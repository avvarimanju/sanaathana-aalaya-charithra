/**
 * StatusUpdateRepository - Data access layer for StatusUpdates DynamoDB table
 * Feature: defect-tracking
 * 
 * Provides CRUD operations and query methods for status update data.
 * Supports efficient lookups using defectId-timestamp-index GSI for retrieving
 * all updates for a specific defect in chronological order.
 * 
 * Requirements: 5.1, 9.3
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  QueryCommandInput
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { StatusUpdate } from '../types';

/**
 * Repository for managing StatusUpdate entities in DynamoDB
 */
export class StatusUpdateRepository {
  private client: DynamoDBClient;
  private tableName: string;

  // GSI name for querying by defectId
  private readonly DEFECT_ID_INDEX = 'defectId-timestamp-index';

  constructor(client: DynamoDBClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Create a new status update
   * Validates: Requirements 5.1, 9.3
   */
  async create(statusUpdate: StatusUpdate): Promise<StatusUpdate> {
    const params = {
      TableName: this.tableName,
      Item: marshall(statusUpdate, { removeUndefinedValues: true }),
      ConditionExpression: 'attribute_not_exists(updateId)'
    };

    try {
      await this.client.send(new PutItemCommand(params));
      return statusUpdate;
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Find all status updates for a specific defect
   * Uses defectId-timestamp-index GSI for efficient queries
   * Returns updates in chronological order (oldest first)
   * Validates: Requirements 5.1, 9.3
   */
  async findByDefectId(defectId: string): Promise<StatusUpdate[]> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: this.DEFECT_ID_INDEX,
      KeyConditionExpression: 'defectId = :defectId',
      ExpressionAttributeValues: marshall({
        ':defectId': defectId
      }),
      ScanIndexForward: true // Ascending order (oldest first)
    };

    try {
      const result = await this.client.send(new QueryCommand(params));
      
      return (result.Items || []).map(item => unmarshall(item) as StatusUpdate);
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Find status update by ID
   * Validates: Requirements 5.1, 9.3
   */
  async findById(updateId: string): Promise<StatusUpdate | null> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ updateId })
    };

    try {
      const result = await this.client.send(new GetItemCommand(params));
      
      if (!result.Item) {
        return null;
      }

      return unmarshall(result.Item) as StatusUpdate;
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
