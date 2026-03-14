/**
 * Rate Limiter Utility
 * 
 * Implements rate limiting for admin API requests using DynamoDB.
 * Limits: 100 requests per minute per user.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export interface RateLimitEntry {
  userId: string;
  requests: number[];
  lastRequest: number;
  ttl: number;
}

export class RateLimiter {
  private tableName: string;
  private maxRequests: number;
  private windowSeconds: number;

  constructor(tableName: string = 'SanaathanaAalayaCharithra-RateLimits') {
    this.tableName = tableName;
    this.maxRequests = 100; // requests per minute
    this.windowSeconds = 60;
  }

  /**
   * Check if user has exceeded rate limit
   */
  async checkRateLimit(userId: string): Promise<boolean> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const windowStart = currentTime - this.windowSeconds;

      // Get current request count
      const getCommand = new GetCommand({
        TableName: this.tableName,
        Key: { userId },
      });

      const response = await docClient.send(getCommand);

      if (!response.Item) {
        // First request, create entry
        await this.createEntry(userId, currentTime);
        return true;
      }

      const item = response.Item as RateLimitEntry;
      const requests = item.requests || [];

      // Filter requests within current window
      const recentRequests = requests.filter(req => req >= windowStart);

      // Check if limit exceeded
      if (recentRequests.length >= this.maxRequests) {
        return false;
      }

      // Add current request
      recentRequests.push(currentTime);

      // Update DynamoDB
      const updateCommand = new UpdateCommand({
        TableName: this.tableName,
        Key: { userId },
        UpdateExpression: 'SET requests = :requests, lastRequest = :last',
        ExpressionAttributeValues: {
          ':requests': recentRequests,
          ':last': currentTime,
        },
      });

      await docClient.send(updateCommand);
      return true;

    } catch (error) {
      console.error(`Rate limit check error: ${error}`);
      // On error, allow request (fail open)
      return true;
    }
  }

  /**
   * Create new rate limit entry
   */
  private async createEntry(userId: string, timestamp: number): Promise<void> {
    const putCommand = new PutCommand({
      TableName: this.tableName,
      Item: {
        userId,
        requests: [timestamp],
        lastRequest: timestamp,
        ttl: timestamp + (2 * this.windowSeconds), // Auto-delete after 2 minutes
      },
    });

    await docClient.send(putCommand);
  }

  /**
   * Get current request count for user (for testing)
   */
  async getCurrentRequestCount(userId: string): Promise<number> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const windowStart = currentTime - this.windowSeconds;

      const getCommand = new GetCommand({
        TableName: this.tableName,
        Key: { userId },
      });

      const response = await docClient.send(getCommand);

      if (!response.Item) {
        return 0;
      }

      const item = response.Item as RateLimitEntry;
      const requests = item.requests || [];

      // Filter requests within current window
      return requests.filter(req => req >= windowStart).length;

    } catch (error) {
      console.error(`Error getting request count: ${error}`);
      return 0;
    }
  }

  /**
   * Reset rate limit for user (for testing)
   */
  async resetRateLimit(userId: string): Promise<void> {
    try {
      const putCommand = new PutCommand({
        TableName: this.tableName,
        Item: {
          userId,
          requests: [],
          lastRequest: 0,
          ttl: Math.floor(Date.now() / 1000) + this.windowSeconds,
        },
      });

      await docClient.send(putCommand);
    } catch (error) {
      console.error(`Error resetting rate limit: ${error}`);
    }
  }
}