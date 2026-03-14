/**
 * Session Manager Utility
 * 
 * Manages admin user sessions with 8-hour timeout.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export interface SessionEntry {
  sessionId: string;
  userId: string;
  tokenJti: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  ttl: number;
}

export class SessionManager {
  private tableName: string;
  private sessionTimeoutHours: number;

  constructor(tableName: string = 'SanaathanaAalayaCharithra-AdminSessions') {
    this.tableName = tableName;
    this.sessionTimeoutHours = 8;
  }

  /**
   * Create new session
   */
  async createSession(userId: string, tokenJti: string): Promise<string> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresAt = currentTime + (this.sessionTimeoutHours * 3600);
      const sessionId = `${userId}:${tokenJti}`;

      const putCommand = new PutCommand({
        TableName: this.tableName,
        Item: {
          sessionId,
          userId,
          tokenJti,
          createdAt: currentTime,
          expiresAt,
          lastActivity: currentTime,
          ttl: expiresAt + 3600, // Auto-delete 1 hour after expiry
        },
      });

      await docClient.send(putCommand);
      return sessionId;

    } catch (error) {
      console.error(`Error creating session: ${error}`);
      throw error;
    }
  }

  /**
   * Validate session is active and not expired
   */
  async validateSession(userId: string, tokenJti: string): Promise<boolean> {
    try {
      const sessionId = `${userId}:${tokenJti}`;

      const getCommand = new GetCommand({
        TableName: this.tableName,
        Key: { sessionId },
      });

      const response = await docClient.send(getCommand);

      if (!response.Item) {
        return false;
      }

      const session = response.Item as SessionEntry;
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if session expired
      if (session.expiresAt < currentTime) {
        return false;
      }

      // Update last activity
      const updateCommand = new UpdateCommand({
        TableName: this.tableName,
        Key: { sessionId },
        UpdateExpression: 'SET lastActivity = :activity',
        ExpressionAttributeValues: {
          ':activity': currentTime,
        },
      });

      await docClient.send(updateCommand);
      return true;

    } catch (error) {
      console.error(`Error validating session: ${error}`);
      return false;
    }
  }

  /**
   * Terminate session
   */
  async terminateSession(userId: string, tokenJti: string): Promise<void> {
    try {
      const sessionId = `${userId}:${tokenJti}`;

      const deleteCommand = new DeleteCommand({
        TableName: this.tableName,
        Key: { sessionId },
      });

      await docClient.send(deleteCommand);

    } catch (error) {
      console.error(`Error terminating session: ${error}`);
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(userId: string): Promise<number> {
    try {
      // Query all sessions for user
      const queryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      });

      const response = await docClient.send(queryCommand);
      const sessions = response.Items || [];
      let count = 0;

      for (const session of sessions) {
        const deleteCommand = new DeleteCommand({
          TableName: this.tableName,
          Key: { sessionId: session.sessionId },
        });

        await docClient.send(deleteCommand);
        count++;
      }

      return count;

    } catch (error) {
      console.error(`Error terminating user sessions: ${error}`);
      return 0;
    }
  }

  /**
   * Get session details (for testing)
   */
  async getSession(userId: string, tokenJti: string): Promise<SessionEntry | null> {
    try {
      const sessionId = `${userId}:${tokenJti}`;

      const getCommand = new GetCommand({
        TableName: this.tableName,
        Key: { sessionId },
      });

      const response = await docClient.send(getCommand);
      return response.Item as SessionEntry || null;

    } catch (error) {
      console.error(`Error getting session: ${error}`);
      return null;
    }
  }

  /**
   * Check if session is expired (for testing)
   */
  async isSessionExpired(userId: string, tokenJti: string): Promise<boolean> {
    try {
      const session = await this.getSession(userId, tokenJti);
      if (!session) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return session.expiresAt < currentTime;

    } catch (error) {
      console.error(`Error checking session expiry: ${error}`);
      return true;
    }
  }
}