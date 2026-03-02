/**
 * Audit Logging Service
 * Feature: real-time-reports-dashboard
 * Task: 12.3
 * 
 * Logs all access attempts, authentication failures, and authorization failures
 * 
 * Validates: Requirement 12.5
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { AuthenticatedUser } from '../types';
import { v4 as uuidv4 } from 'uuid';

export type AuditEventType =
  | 'authentication_success'
  | 'authentication_failure'
  | 'authorization_success'
  | 'authorization_failure'
  | 'data_access'
  | 'data_export'
  | 'websocket_connect'
  | 'websocket_disconnect';

export interface AuditLogEntry {
  logId: string;
  timestamp: number;
  eventType: AuditEventType;
  userId?: string;
  userRole?: string;
  userRegion?: string;
  resource: string;
  action: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  ttl: number; // Auto-expire after 90 days
}

export class AuditLogger {
  private dynamoClient: DynamoDBDocumentClient;
  private tableName: string;
  private enabled: boolean;

  constructor(
    dynamoClient: DynamoDBClient,
    tableName: string,
    enabled: boolean = true
  ) {
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = tableName;
    this.enabled = enabled;
  }


  /**
   * Log authentication success
   */
  async logAuthenticationSuccess(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      eventType: 'authentication_success',
      userId,
      userRole,
      resource: 'authentication',
      action: 'login',
      success: true,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log authentication failure
   */
  async logAuthenticationFailure(
    attemptedUserId?: string,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      eventType: 'authentication_failure',
      userId: attemptedUserId,
      resource: 'authentication',
      action: 'login',
      success: false,
      errorMessage,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log authorization failure
   */
  async logAuthorizationFailure(
    user: AuthenticatedUser,
    resource: string,
    action: string,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      eventType: 'authorization_failure',
      userId: user.userId,
      userRole: user.role,
      userRegion: user.region,
      resource,
      action,
      success: false,
      errorMessage
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(
    user: AuthenticatedUser,
    resource: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: 'data_access',
      userId: user.userId,
      userRole: user.role,
      userRegion: user.region,
      resource,
      action,
      success: true,
      metadata
    });
  }

  /**
   * Log data export
   */
  async logDataExport(
    user: AuthenticatedUser,
    format: string,
    recordCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: 'data_export',
      userId: user.userId,
      userRole: user.role,
      userRegion: user.region,
      resource: 'export',
      action: 'generate',
      success: true,
      metadata: {
        ...metadata,
        format,
        recordCount
      }
    });
  }

  /**
   * Log WebSocket connection
   */
  async logWebSocketConnect(
    user: AuthenticatedUser,
    connectionId: string
  ): Promise<void> {
    await this.log({
      eventType: 'websocket_connect',
      userId: user.userId,
      userRole: user.role,
      userRegion: user.region,
      resource: 'websocket',
      action: 'connect',
      success: true,
      metadata: { connectionId }
    });
  }

  /**
   * Log WebSocket disconnection
   */
  async logWebSocketDisconnect(
    userId: string,
    connectionId: string
  ): Promise<void> {
    await this.log({
      eventType: 'websocket_disconnect',
      userId,
      resource: 'websocket',
      action: 'disconnect',
      success: true,
      metadata: { connectionId }
    });
  }

  /**
   * Core logging method
   */
  private async log(entry: Omit<AuditLogEntry, 'logId' | 'timestamp' | 'ttl'>): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const now = Date.now();
    const logEntry: AuditLogEntry = {
      logId: uuidv4(),
      timestamp: now,
      ttl: Math.floor(now / 1000) + (90 * 24 * 60 * 60), // 90 days
      ...entry
    };

    try {
      await this.dynamoClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: logEntry
        })
      );

      // Also log to CloudWatch for real-time monitoring
      console.log('Audit log', logEntry);
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('Failed to write audit log', { error, entry });
    }
  }
}
