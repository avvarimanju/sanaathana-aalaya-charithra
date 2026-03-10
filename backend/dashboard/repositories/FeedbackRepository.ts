/**
 * FeedbackRepository - Data access layer for Feedback DynamoDB table
 * Feature: real-time-reports-dashboard
 * 
 * Provides methods for querying, filtering, and batch operations on feedback data.
 * Supports pagination, time range filtering, and multi-dimensional filtering.
 */

import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
  ScanCommand,
  ScanCommandInput,
  GetItemCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  Feedback,
  FilterState,
  PaginatedReviews,
  Review,
  Comment,
  CommentType,
  TimeRange
} from '../types';
import { TIME_RANGE_MILLISECONDS, GSI_NAMES } from '../constants';

export interface QueryOptions {
  limit?: number;
  lastEvaluatedKey?: Record<string, any>;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
  count: number;
}

export class FeedbackRepository {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(client: DynamoDBClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Query feedback items with filtering and pagination support
   * Validates: Requirements 1.1, 2.1, 7.1, 7.2, 7.3
   */
  async queryFeedback(
    filters: FilterState,
    options: QueryOptions = {}
  ): Promise<QueryResult<Feedback>> {
    const now = Date.now();
    const timeRangeMs = this.getTimeRangeMilliseconds(filters.timeRange);
    const startTimestamp = filters.timeRange === 'all_time' ? 0 : now - timeRangeMs;

    // Determine the best query strategy based on filters
    if (filters.templeIds.length === 1) {
      // Use templeId-timestamp GSI for single temple queries
      return this.queryByTemple(filters.templeIds[0], startTimestamp, filters, options);
    } else if (filters.regions.length === 1 && filters.templeIds.length === 0) {
      // Use region-timestamp GSI for single region queries
      return this.queryByRegion(filters.regions[0], startTimestamp, filters, options);
    } else {
      // Use scan with filters for complex multi-dimensional queries
      return this.scanWithFilters(startTimestamp, filters, options);
    }
  }

  /**
   * Query feedback by temple ID using GSI
   */
  private async queryByTemple(
    templeId: string,
    startTimestamp: number,
    filters: FilterState,
    options: QueryOptions
  ): Promise<QueryResult<Feedback>> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: GSI_NAMES.TEMPLE_TIMESTAMP,
      KeyConditionExpression: 'templeId = :templeId AND #ts >= :startTimestamp',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: marshall({
        ':templeId': templeId,
        ':startTimestamp': startTimestamp
      }),
      Limit: options.limit,
      ExclusiveStartKey: options.lastEvaluatedKey
        ? marshall(options.lastEvaluatedKey)
        : undefined,
      ScanIndexForward: false // Descending order (newest first)
    };

    // Add filter expressions for additional filters
    const filterExpressions: string[] = [];
    const filterValues: Record<string, any> = {};

    if (filters.regions.length > 0) {
      filterExpressions.push('region IN (:regions)');
      filterValues[':regions'] = filters.regions;
    }

    if (filters.categories.length > 0) {
      filterExpressions.push('category IN (:categories)');
      filterValues[':categories'] = filters.categories;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ...marshall(filterValues)
      };
    }

    try {
      const result = await this.client.send(new QueryCommand(params));

      return {
        items: (result.Items || []).map(item => unmarshall(item) as Feedback),
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
   * Query feedback by region using GSI
   */
  private async queryByRegion(
    region: string,
    startTimestamp: number,
    filters: FilterState,
    options: QueryOptions
  ): Promise<QueryResult<Feedback>> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: GSI_NAMES.REGION_TIMESTAMP,
      KeyConditionExpression: 'region = :region AND #ts >= :startTimestamp',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: marshall({
        ':region': region,
        ':startTimestamp': startTimestamp
      }),
      Limit: options.limit,
      ExclusiveStartKey: options.lastEvaluatedKey
        ? marshall(options.lastEvaluatedKey)
        : undefined,
      ScanIndexForward: false
    };

    // Add filter expressions
    const filterExpressions: string[] = [];
    const filterValues: Record<string, any> = {};

    if (filters.categories.length > 0) {
      filterExpressions.push('category IN (:categories)');
      filterValues[':categories'] = filters.categories;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ...marshall(filterValues)
      };
    }

    try {
      const result = await this.client.send(new QueryCommand(params));

      return {
        items: (result.Items || []).map(item => unmarshall(item) as Feedback),
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
   * Scan table with filters for complex multi-dimensional queries
   */
  private async scanWithFilters(
    startTimestamp: number,
    filters: FilterState,
    options: QueryOptions
  ): Promise<QueryResult<Feedback>> {
    const filterExpressions: string[] = ['#ts >= :startTimestamp'];
    const expressionAttributeNames: Record<string, string> = { '#ts': 'timestamp' };
    const expressionAttributeValues: Record<string, any> = {
      ':startTimestamp': startTimestamp
    };

    if (filters.templeIds.length > 0) {
      filterExpressions.push('templeId IN (:templeIds)');
      expressionAttributeValues[':templeIds'] = filters.templeIds;
    }

    if (filters.regions.length > 0) {
      filterExpressions.push('region IN (:regions)');
      expressionAttributeValues[':regions'] = filters.regions;
    }

    if (filters.categories.length > 0) {
      filterExpressions.push('category IN (:categories)');
      expressionAttributeValues[':categories'] = filters.categories;
    }

    const params: ScanCommandInput = {
      TableName: this.tableName,
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      Limit: options.limit,
      ExclusiveStartKey: options.lastEvaluatedKey
        ? marshall(options.lastEvaluatedKey)
        : undefined
    };

    try {
      const result = await this.client.send(new ScanCommand(params));

      // Sort by timestamp descending (newest first)
      const items = (result.Items || [])
        .map(item => unmarshall(item) as Feedback)
        .sort((a, b) => b.timestamp - a.timestamp);

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
   * Get reviews with pagination
   * Validates: Requirements 2.1, 2.4
   */
  async getReviews(
    filters: FilterState,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedReviews> {
    // Query all feedback items matching filters
    const allReviews: Review[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;
    let hasMore = true;

    // Fetch enough items to satisfy pagination
    const targetCount = page * pageSize;

    while (hasMore && allReviews.length < targetCount) {
      const result = await this.queryFeedback(filters, {
        limit: 100,
        lastEvaluatedKey
      });

      // Filter to only items with review text
      const reviews = result.items
        .filter(item => item.reviewText && item.reviewText.trim().length > 0)
        .map(item => this.feedbackToReview(item));

      allReviews.push(...reviews);
      lastEvaluatedKey = result.lastEvaluatedKey;
      hasMore = lastEvaluatedKey !== undefined;
    }

    // Calculate pagination
    const totalItems = allReviews.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedReviews = allReviews.slice(startIndex, endIndex);

    return {
      reviews: paginatedReviews,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalItems
      }
    };
  }

  /**
   * Get comments with optional type filtering
   * Validates: Requirements 6.1, 6.2, 6.4, 6.5
   */
  async getComments(
    filters: FilterState,
    commentType?: CommentType,
    searchKeyword?: string
  ): Promise<Comment[]> {
    const allComments: Comment[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await this.queryFeedback(filters, {
        limit: 100,
        lastEvaluatedKey
      });

      // Filter to only items with comment text
      let comments = result.items
        .filter(item => item.commentText && item.commentText.trim().length > 0)
        .map(item => this.feedbackToComment(item));

      // Apply comment type filter
      if (commentType) {
        comments = comments.filter(comment => comment.commentType === commentType);
      }

      // Apply keyword search (case-insensitive)
      if (searchKeyword && searchKeyword.trim().length > 0) {
        const keyword = searchKeyword.toLowerCase();
        comments = comments.filter(comment =>
          comment.commentText.toLowerCase().includes(keyword)
        );
      }

      allComments.push(...comments);
      lastEvaluatedKey = result.lastEvaluatedKey;
      hasMore = lastEvaluatedKey !== undefined;
    }

    return allComments;
  }

  /**
   * Batch write feedback items
   * Validates: Requirements 1.1, 2.1
   */
  async batchWriteFeedback(items: Feedback[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    // DynamoDB batch write supports max 25 items per request
    const batchSize = 25;
    const batches: Feedback[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    // Process batches sequentially to avoid throttling
    for (const batch of batches) {
      await this.writeBatch(batch);
    }
  }

  /**
   * Write a single batch of items
   */
  private async writeBatch(items: Feedback[]): Promise<void> {
    const params: BatchWriteItemCommandInput = {
      RequestItems: {
        [this.tableName]: items.map(item => ({
          PutRequest: {
            Item: marshall(item, { removeUndefinedValues: true })
          }
        }))
      }
    };

    try {
      const result = await this.client.send(new BatchWriteItemCommand(params));

      // Handle unprocessed items with exponential backoff
      if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
        await this.retryUnprocessedItems(result.UnprocessedItems);
      }
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Retry unprocessed items with exponential backoff
   */
  private async retryUnprocessedItems(
    unprocessedItems: Record<string, any>,
    attempt: number = 1
  ): Promise<void> {
    const maxAttempts = 3;
    const baseDelay = 100; // milliseconds

    if (attempt > maxAttempts) {
      throw new Error('Max retry attempts reached for batch write');
    }

    // Exponential backoff with jitter
    const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, delay));

    const params: BatchWriteItemCommandInput = {
      RequestItems: unprocessedItems
    };

    try {
      const result = await this.client.send(new BatchWriteItemCommand(params));

      if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
        await this.retryUnprocessedItems(result.UnprocessedItems, attempt + 1);
      }
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }

  /**
   * Get time range in milliseconds
   */
  private getTimeRangeMilliseconds(timeRange: TimeRange): number {
    return TIME_RANGE_MILLISECONDS[timeRange] || TIME_RANGE_MILLISECONDS.all_time;
  }

  /**
   * Convert Feedback to Review
   */
  private feedbackToReview(feedback: Feedback): Review {
    return {
      feedbackId: feedback.feedbackId,
      userId: feedback.userId,
      userName: undefined, // To be populated by service layer
      templeId: feedback.templeId,
      templeName: '', // To be populated by service layer
      rating: feedback.rating,
      reviewText: feedback.reviewText || '',
      sentimentLabel: feedback.sentimentLabel || 'neutral',
      timestamp: feedback.timestamp,
      createdAt: feedback.createdAt
    };
  }

  /**
   * Convert Feedback to Comment
   */
  private feedbackToComment(feedback: Feedback): Comment {
    return {
      feedbackId: feedback.feedbackId,
      userId: feedback.userId,
      templeId: feedback.templeId,
      templeName: '', // To be populated by service layer
      commentText: feedback.commentText || '',
      commentType: feedback.commentType || 'general',
      timestamp: feedback.timestamp,
      createdAt: feedback.createdAt
    };
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

    // Return original error for unexpected cases
    return error;
  }

  /**
   * Query all feedback items matching filters (no pagination limit)
   * Used for exports and batch processing
   */
  async queryAllFeedback(filters: FilterState): Promise<Feedback[]> {
    const allItems: Feedback[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const result = await this.queryFeedback(filters, {
        limit: 100,
        lastEvaluatedKey
      });

      allItems.push(...result.items);
      lastEvaluatedKey = result.lastEvaluatedKey;

      // Safety limit
      if (allItems.length > 100000) {
        console.warn('Reached maximum feedback limit (100,000)');
        break;
      }
    } while (lastEvaluatedKey);

    return allItems;
  }

  /**
   * Get feedback item by ID
   */
  async getFeedbackById(feedbackId: string): Promise<Feedback | null> {
    try {
      const result = await this.client.send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: marshall({ feedbackId })
        })
      );

      if (!result.Item) {
        return null;
      }

      return unmarshall(result.Item) as Feedback;
    } catch (error) {
      throw this.handleDynamoDBError(error);
    }
  }
}
