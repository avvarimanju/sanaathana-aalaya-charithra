/**
 * NotificationRepository - Data access layer for Notifications DynamoDB table
 * Feature: defect-tracking
 * 
 * Provides CRUD operations and query methods for notification data.
 * Supports efficient lookups using userId-createdAt-index GSI for retrieving
 * all notifications for a specific user in chronological order.
 * Implements TTL-based automatic expiration after 90 days.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  QueryCommand,
  QueryCommandInput,
  DeleteItemCommand,
  ScanCommand,
  ScanCommandInput
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Notification } from '../types';

/**
 * Repository for managing Notification entities in DynamoDB
 */
export class NotificationRepository {
  private client: DynamoDBClient;
  private tableName: string;

  // GSI name for querying by userId
  private readonly USER_ID_INDEX = 'userId-createdAt-index';

  // TTL duration: 90 days in seconds
  private readonly TTL_DURATION_SECONDS = 90 * 24 * 60 * 60;

  constructor(client: DynamoDBClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Create a new notification
   * Automatically sets TTL for 90 days from creation
   * Validates: Requirements 8.1, 8.2
   */
  async create(notification: Notification): Promise<Notification> {
    // Calculate TTL (90 days from now)
    const ttl = Math.floor(Date.now() / 1000) + this.TTL_DURATION_SECONDS;
    
    const notificationWithTTL = {
      ...notification,
      ttl
    };

    const params = {
      TableName: this.tableName,
      Item: marshall(notificationWithTTL, { removeUndefinedValues: true }),
      ConditionExpression: 'attribute_not_exists(notificationId)'
    };

    try {
      await this.client.send(new PutItemCommand(params));
      return notificationWithTTL;
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Find all notifications for a specific user
   * Uses userId-createdAt-index GSI for efficient queries
   * Returns notifications in reverse chronological order (newest first)
   * Validates: Requirements 8.3
   */
  async findByUserId(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: this.USER_ID_INDEX,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: marshall({
        ':userId': userId
      }),
      ScanIndexForward: false // Descending order (newest first)
    };

    // Add filter for unread notifications if requested
    if (unreadOnly) {
      params.FilterExpression = 'isRead = :isRead';
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ...marshall({ ':isRead': false })
      };
    }

    try {
      const result = await this.client.send(new QueryCommand(params));
      
      return (result.Items || []).map(item => unmarshall(item) as Notification);
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Mark a notification as read
   * Validates: Requirements 8.4
   */
  async markAsRead(notificationId: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ notificationId }),
      UpdateExpression: 'SET isRead = :isRead',
      ExpressionAttributeValues: marshall({
        ':isRead': true
      }),
      ConditionExpression: 'attribute_exists(notificationId)'
    };

    try {
      await this.client.send(new UpdateItemCommand(params));
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Notification with ID ${notificationId} not found`);
      }
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Delete old notifications manually (backup to TTL)
   * Deletes notifications older than the specified number of days
   * Note: DynamoDB TTL handles automatic deletion, but this method
   * can be used for manual cleanup if needed
   */
  async deleteOldNotifications(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    // Scan for old notifications
    const scanParams: ScanCommandInput = {
      TableName: this.tableName,
      FilterExpression: 'createdAt < :cutoffDate',
      ExpressionAttributeValues: marshall({
        ':cutoffDate': cutoffTimestamp
      })
    };

    try {
      const scanResult = await this.client.send(new ScanCommand(scanParams));
      const oldNotifications = (scanResult.Items || []).map(item => unmarshall(item) as Notification);

      // Delete each old notification
      let deletedCount = 0;
      for (const notification of oldNotifications) {
        try {
          await this.client.send(new DeleteItemCommand({
            TableName: this.tableName,
            Key: marshall({ notificationId: notification.notificationId })
          }));
          deletedCount++;
        } catch (error) {
          // Log error but continue with other deletions
          console.error(`Failed to delete notification ${notification.notificationId}:`, error);
        }
      }

      return deletedCount;
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Find notification by ID (helper method)
   */
  async findById(notificationId: string): Promise<Notification | null> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ notificationId })
    };

    try {
      const result = await this.client.send(new GetItemCommand(params));
      
      if (!result.Item) {
        return null;
      }

      return unmarshall(result.Item) as Notification;
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Handle DynamoDB errors with proper error messages
   */
  private handleDynamoDBError(error: any): Error {
    if (error.name === 'ProvisionedThroughputExceededException') {
      return new Error('Database throttling detected. Please retry after a moment.');
    }

    if (error.name === 'ResourceNotFoundException') {
      return new Error(`Table ${this.tableName} not found.`);
    }

    if (error.name === 'ValidationException') {
      return new Error(`Invalid query parameters: ${error.message}`);
    }

    if (error.name === 'AccessDeniedException') {
      return new Error('Access denied to DynamoDB table.');
    }

    if (error.name === 'ConditionalCheckFailedException') {
      return new Error('Conditional check failed for DynamoDB operation.');
    }

    // Return original error for unexpected cases
    return error;
  }
}
