/**
 * DefectRepository - Data access layer for Defects DynamoDB table
 * Feature: defect-tracking
 * 
 * Provides CRUD operations and query methods for defect data.
 * Supports efficient lookups using GSIs for userId and status filtering.
 * 
 * Requirements: 1.1, 2.1, 3.1, 9.1
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Defect, DefectStatus, DefectFilters, AdminDefectFilters } from '../types';

export interface QueryOptions {
  limit?: number;
  lastEvaluatedKey?: Record<string, any>;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
  count: number;
}

/**
 * Repository for managing Defect entities in DynamoDB
 */
export class DefectRepository {
  private client: DynamoDBClient;
  private tableName: string;

  // GSI names
  private readonly USER_ID_INDEX = 'userId-createdAt-index';
  private readonly STATUS_INDEX = 'status-createdAt-index';

  constructor(client: DynamoDBClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Create a new defect
   * Validates: Requirements 1.1, 9.1
   */
  async create(defect: Defect): Promise<Defect> {
    const params = {
      TableName: this.tableName,
      Item: marshall(defect, { removeUndefinedValues: true }),
      ConditionExpression: 'attribute_not_exists(defectId)'
    };

    try {
      await this.client.send(new PutItemCommand(params));
      return defect;
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Find defect by ID
   * Validates: Requirements 2.1, 3.1
   */
  async findById(defectId: string): Promise<Defect | null> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ defectId })
    };

    try {
      const result = await this.client.send(new GetItemCommand(params));
      
      if (!result.Item) {
        return null;
      }

      return unmarshall(result.Item) as Defect;
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Find all defects submitted by a specific user
   * Uses userId-createdAt-index GSI for efficient queries
   * Validates: Requirements 2.1
   */
  async findByUserId(
    userId: string,
    filters?: DefectFilters
  ): Promise<QueryResult<Defect>> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: this.USER_ID_INDEX,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: marshall({
        ':userId': userId
      }),
      Limit: filters?.limit || 20,
      ExclusiveStartKey: filters?.lastEvaluatedKey
        ? (marshall(filters.lastEvaluatedKey) as Record<string, any>)
        : undefined,
      ScanIndexForward: false // Descending order (newest first)
    };

    // Add status filter if provided
    if (filters?.status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = {
        '#status': 'status'
      };
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ...marshall({ ':status': filters.status })
      };
    }

    try {
      const result = await this.client.send(new QueryCommand(params));

      return {
        items: (result.Items || []).map(item => unmarshall(item) as Defect),
        lastEvaluatedKey: result.LastEvaluatedKey
          ? unmarshall(result.LastEvaluatedKey)
          : undefined,
        count: result.Count || 0
      };
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Find all defects with optional filtering
   * Uses status-createdAt-index GSI when filtering by status
   * Uses scan for complex queries or when no status filter is provided
   * Validates: Requirements 3.1, 3.2, 3.3
   */
  async findAll(filters?: AdminDefectFilters): Promise<QueryResult<Defect>> {
    // If status filter is provided, use GSI for efficient query
    if (filters?.status) {
      return this.findByStatus(filters.status, filters);
    }

    // If search is provided, use scan with filter
    if (filters?.search) {
      return this.searchDefects(filters.search, filters);
    }

    // Otherwise, scan all defects
    return this.scanAllDefects(filters);
  }

  /**
   * Find defects by status using GSI
   * Uses status-createdAt-index for efficient queries
   * Validates: Requirements 3.2
   */
  private async findByStatus(
    status: DefectStatus,
    filters?: AdminDefectFilters
  ): Promise<QueryResult<Defect>> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: this.STATUS_INDEX,
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: marshall({
        ':status': status
      }),
      Limit: filters?.limit || 20,
      ExclusiveStartKey: filters?.lastEvaluatedKey
        ? (marshall(filters.lastEvaluatedKey) as Record<string, any>)
        : undefined,
      ScanIndexForward: false // Descending order (newest first)
    };

    // Add search filter if provided
    if (filters?.search) {
      params.FilterExpression = 'contains(defectId, :search) OR contains(title, :search)';
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ...marshall({ ':search': filters.search })
      };
    }

    try {
      const result = await this.client.send(new QueryCommand(params));

      return {
        items: (result.Items || []).map(item => unmarshall(item) as Defect),
        lastEvaluatedKey: result.LastEvaluatedKey
          ? unmarshall(result.LastEvaluatedKey)
          : undefined,
        count: result.Count || 0
      };
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Search defects by ID or title
   * Uses scan with filter expression
   * Validates: Requirements 3.3
   */
  private async searchDefects(
    search: string,
    filters?: AdminDefectFilters
  ): Promise<QueryResult<Defect>> {
    const params: ScanCommandInput = {
      TableName: this.tableName,
      FilterExpression: 'contains(defectId, :search) OR contains(title, :search)',
      ExpressionAttributeValues: marshall({
        ':search': search
      }),
      Limit: filters?.limit || 20,
      ExclusiveStartKey: filters?.lastEvaluatedKey
        ? (marshall(filters.lastEvaluatedKey) as Record<string, any>)
        : undefined
    };

    try {
      const result = await this.client.send(new ScanCommand(params));

      // Sort by createdAt descending (newest first)
      const items = (result.Items || [])
        .map(item => unmarshall(item) as Defect)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        items,
        lastEvaluatedKey: result.LastEvaluatedKey
          ? unmarshall(result.LastEvaluatedKey)
          : undefined,
        count: result.Count || 0
      };
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Scan all defects without filters
   * Validates: Requirements 3.1
   */
  private async scanAllDefects(filters?: AdminDefectFilters): Promise<QueryResult<Defect>> {
    const params: ScanCommandInput = {
      TableName: this.tableName,
      Limit: filters?.limit || 20,
      ExclusiveStartKey: filters?.lastEvaluatedKey
        ? (marshall(filters.lastEvaluatedKey) as Record<string, any>)
        : undefined
    };

    try {
      const result = await this.client.send(new ScanCommand(params));

      // Sort by createdAt descending (newest first)
      const items = (result.Items || [])
        .map(item => unmarshall(item) as Defect)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        items,
        lastEvaluatedKey: result.LastEvaluatedKey
          ? unmarshall(result.LastEvaluatedKey)
          : undefined,
        count: result.Count || 0
      };
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Update defect status
   * Validates: Requirements 4.1, 9.2
   */
  async updateStatus(defectId: string, newStatus: DefectStatus): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ defectId }),
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: marshall({
        ':status': newStatus,
        ':updatedAt': new Date().toISOString()
      }),
      ConditionExpression: 'attribute_exists(defectId)'
    };

    try {
      await this.client.send(new UpdateItemCommand(params));
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Defect with ID ${defectId} not found`);
      }
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Update defect (full update)
   * Validates: Requirements 9.2
   */
  async update(defect: Defect): Promise<Defect> {
    // Update the updatedAt timestamp
    const updatedDefect = {
      ...defect,
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: this.tableName,
      Item: marshall(updatedDefect, { removeUndefinedValues: true }),
      ConditionExpression: 'attribute_exists(defectId)'
    };

    try {
      await this.client.send(new PutItemCommand(params));
      return updatedDefect;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Defect with ID ${defect.defectId} not found`);
      }
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
