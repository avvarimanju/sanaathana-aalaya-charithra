/**
 * Unit tests for FeedbackRepository
 * Feature: real-time-reports-dashboard
 */

import { DynamoDBClient, QueryCommand, ScanCommand, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { FeedbackRepository } from '../../../src/dashboard/repositories/FeedbackRepository';
import { Feedback, FilterState } from '../../../src/dashboard/types';
import { TIME_RANGES } from '../../../src/dashboard/constants';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/util-dynamodb');

describe('FeedbackRepository', () => {
  let repository: FeedbackRepository;
  let mockClient: any;
  const tableName = 'test-feedback-table';

  beforeEach(() => {
    mockClient = {
      send: jest.fn()
    };

    repository = new FeedbackRepository(mockClient, tableName);

    // Setup default mocks
    (marshall as jest.Mock).mockImplementation((obj) => obj as any);
    (unmarshall as jest.Mock).mockImplementation((obj) => obj as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('queryFeedback', () => {
    it('should query by temple ID when single temple filter is provided', async () => {
      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const mockFeedback: Feedback = {
        feedbackId: 'feedback-1',
        timestamp: Date.now(),
        userId: 'user-1',
        templeId: 'temple-123',
        rating: 5,
        reviewText: 'Great temple',
        region: 'North',
        category: 'Architecture',
        metadata: {
          deviceType: 'mobile',
          appVersion: '1.0.0',
          language: 'en'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockClient.send.mockResolvedValueOnce({
        Items: [mockFeedback],
        Count: 1
      });

      const result = await repository.queryFeedback(filters);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(mockFeedback);
      expect(result.count).toBe(1);
      expect(mockClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    });

    it('should query by region when single region filter is provided', async () => {
      const filters: FilterState = {
        timeRange: 'last_30_days',
        templeIds: [],
        regions: ['North'],
        categories: []
      };

      mockClient.send.mockResolvedValueOnce({
        Items: [],
        Count: 0
      });

      const result = await repository.queryFeedback(filters);

      expect(result.items).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(mockClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    });

    it('should use scan for complex multi-dimensional queries', async () => {
      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: ['temple-1', 'temple-2'],
        regions: ['North', 'South'],
        categories: ['Architecture']
      };

      mockClient.send.mockResolvedValueOnce({
        Items: [],
        Count: 0
      });

      const result = await repository.queryFeedback(filters);

      expect(result.items).toHaveLength(0);
      expect(mockClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
    });

    it('should handle pagination with lastEvaluatedKey', async () => {
      const filters: FilterState = {
        timeRange: 'today',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const lastKey = { feedbackId: 'feedback-1', timestamp: 123456 };

      mockClient.send.mockResolvedValueOnce({
        Items: [],
        Count: 0,
        LastEvaluatedKey: lastKey
      });

      const result = await repository.queryFeedback(filters, {
        limit: 50,
        lastEvaluatedKey: lastKey
      });

      expect(result.lastEvaluatedKey).toEqual(lastKey);
    });

    it('should handle DynamoDB throttling errors', async () => {
      const filters: FilterState = {
        timeRange: 'today',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const throttlingError = new Error('Throttling');
      throttlingError.name = 'ProvisionedThroughputExceededException';

      mockClient.send.mockRejectedValueOnce(throttlingError);

      await expect(repository.queryFeedback(filters)).rejects.toThrow(
        'Database throttling detected. Please retry after a moment.'
      );
    });

    it('should handle table not found errors', async () => {
      const filters: FilterState = {
        timeRange: 'today',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const notFoundError = new Error('Not found');
      notFoundError.name = 'ResourceNotFoundException';

      mockClient.send.mockRejectedValueOnce(notFoundError);

      await expect(repository.queryFeedback(filters)).rejects.toThrow(
        `Table ${tableName} not found.`
      );
    });
  });

  describe('getReviews', () => {
    it('should return paginated reviews', async () => {
      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const mockFeedbackItems: Feedback[] = Array.from({ length: 60 }, (_, i) => ({
        feedbackId: `feedback-${i}`,
        timestamp: Date.now() - i * 1000,
        userId: `user-${i}`,
        templeId: 'temple-123',
        rating: 4,
        reviewText: `Review ${i}`,
        region: 'North',
        category: 'Architecture',
        metadata: {
          deviceType: 'mobile',
          appVersion: '1.0.0',
          language: 'en'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      mockClient.send.mockResolvedValueOnce({
        Items: mockFeedbackItems,
        Count: 60
      });

      const result = await repository.getReviews(filters, 1, 50);

      expect(result.reviews).toHaveLength(50);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(50);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.totalItems).toBe(60);
    });

    it('should filter out feedback without review text', async () => {
      const filters: FilterState = {
        timeRange: 'today',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const mockFeedbackItems: Feedback[] = [
        {
          feedbackId: 'feedback-1',
          timestamp: Date.now(),
          userId: 'user-1',
          templeId: 'temple-123',
          rating: 5,
          reviewText: 'Great temple',
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          feedbackId: 'feedback-2',
          timestamp: Date.now(),
          userId: 'user-2',
          templeId: 'temple-123',
          rating: 4,
          // No reviewText
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      mockClient.send.mockResolvedValueOnce({
        Items: mockFeedbackItems,
        Count: 2
      });

      const result = await repository.getReviews(filters, 1, 50);

      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].reviewText).toBe('Great temple');
    });

    it('should return empty array when no reviews exist', async () => {
      const filters: FilterState = {
        timeRange: 'today',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      mockClient.send.mockResolvedValueOnce({
        Items: [],
        Count: 0
      });

      const result = await repository.getReviews(filters, 1, 50);

      expect(result.reviews).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('getComments', () => {
    it('should return all comments without filters', async () => {
      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const mockFeedbackItems: Feedback[] = [
        {
          feedbackId: 'feedback-1',
          timestamp: Date.now(),
          userId: 'user-1',
          templeId: 'temple-123',
          rating: 5,
          commentText: 'Great experience',
          commentType: 'general',
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      mockClient.send.mockResolvedValueOnce({
        Items: mockFeedbackItems,
        Count: 1
      });

      const result = await repository.getComments(filters);

      expect(result).toHaveLength(1);
      expect(result[0].commentText).toBe('Great experience');
    });

    it('should filter comments by type', async () => {
      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const mockFeedbackItems: Feedback[] = [
        {
          feedbackId: 'feedback-1',
          timestamp: Date.now(),
          userId: 'user-1',
          templeId: 'temple-123',
          rating: 5,
          commentText: 'Great experience',
          commentType: 'general',
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          feedbackId: 'feedback-2',
          timestamp: Date.now(),
          userId: 'user-2',
          templeId: 'temple-123',
          rating: 4,
          commentText: 'Add more photos',
          commentType: 'suggestion',
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      mockClient.send.mockResolvedValueOnce({
        Items: mockFeedbackItems,
        Count: 2
      });

      const result = await repository.getComments(filters, 'suggestion');

      expect(result).toHaveLength(1);
      expect(result[0].commentType).toBe('suggestion');
      expect(result[0].commentText).toBe('Add more photos');
    });

    it('should filter comments by keyword (case-insensitive)', async () => {
      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const mockFeedbackItems: Feedback[] = [
        {
          feedbackId: 'feedback-1',
          timestamp: Date.now(),
          userId: 'user-1',
          templeId: 'temple-123',
          rating: 5,
          commentText: 'Great PHOTOS of the temple',
          commentType: 'general',
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          feedbackId: 'feedback-2',
          timestamp: Date.now(),
          userId: 'user-2',
          templeId: 'temple-123',
          rating: 4,
          commentText: 'Add more information',
          commentType: 'suggestion',
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      mockClient.send.mockResolvedValueOnce({
        Items: mockFeedbackItems,
        Count: 2
      });

      const result = await repository.getComments(filters, undefined, 'photos');

      expect(result).toHaveLength(1);
      expect(result[0].commentText).toContain('PHOTOS');
    });

    it('should filter out feedback without comment text', async () => {
      const filters: FilterState = {
        timeRange: 'today',
        templeIds: ['temple-123'],
        regions: [],
        categories: []
      };

      const mockFeedbackItems: Feedback[] = [
        {
          feedbackId: 'feedback-1',
          timestamp: Date.now(),
          userId: 'user-1',
          templeId: 'temple-123',
          rating: 5,
          commentText: 'Great temple',
          commentType: 'general',
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          feedbackId: 'feedback-2',
          timestamp: Date.now(),
          userId: 'user-2',
          templeId: 'temple-123',
          rating: 4,
          // No commentText
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      mockClient.send.mockResolvedValueOnce({
        Items: mockFeedbackItems,
        Count: 2
      });

      const result = await repository.getComments(filters);

      expect(result).toHaveLength(1);
      expect(result[0].commentText).toBe('Great temple');
    });
  });

  describe('batchWriteFeedback', () => {
    it('should write items in batches of 25', async () => {
      const items: Feedback[] = Array.from({ length: 60 }, (_, i) => ({
        feedbackId: `feedback-${i}`,
        timestamp: Date.now(),
        userId: `user-${i}`,
        templeId: 'temple-123',
        rating: 5,
        reviewText: `Review ${i}`,
        region: 'North',
        category: 'Architecture',
        metadata: {
          deviceType: 'mobile',
          appVersion: '1.0.0',
          language: 'en'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      mockClient.send.mockResolvedValue({});

      await repository.batchWriteFeedback(items);

      // Should be called 3 times (60 items / 25 per batch = 3 batches)
      expect(mockClient.send).toHaveBeenCalledTimes(3);
      expect(mockClient.send).toHaveBeenCalledWith(expect.any(BatchWriteItemCommand));
    });

    it('should handle empty array', async () => {
      await repository.batchWriteFeedback([]);

      expect(mockClient.send).not.toHaveBeenCalled();
    });

    it('should retry unprocessed items with exponential backoff', async () => {
      const items: Feedback[] = [
        {
          feedbackId: 'feedback-1',
          timestamp: Date.now(),
          userId: 'user-1',
          templeId: 'temple-123',
          rating: 5,
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // First call returns unprocessed items
      mockClient.send.mockResolvedValueOnce({
        UnprocessedItems: {
          [tableName]: [{ PutRequest: { Item: items[0] } }]
        }
      });

      // Second call succeeds
      mockClient.send.mockResolvedValueOnce({});

      await repository.batchWriteFeedback(items);

      expect(mockClient.send).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retry attempts', async () => {
      const items: Feedback[] = [
        {
          feedbackId: 'feedback-1',
          timestamp: Date.now(),
          userId: 'user-1',
          templeId: 'temple-123',
          rating: 5,
          region: 'North',
          category: 'Architecture',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Always return unprocessed items
      mockClient.send.mockResolvedValue({
        UnprocessedItems: {
          [tableName]: [{ PutRequest: { Item: items[0] } }]
        }
      });

      await expect(repository.batchWriteFeedback(items)).rejects.toThrow(
        'Max retry attempts reached for batch write'
      );
    });
  });
});
