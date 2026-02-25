/**
 * Unit tests for DashboardService
 * Feature: real-time-reports-dashboard
 * 
 * Tests integration between FeedbackRepository, CacheService, and MetricsAggregator.
 * Validates: Requirements 1.1, 2.1, 6.1, 7.1, 10.1, 10.3
 */

import { DashboardService } from '../../../src/dashboard/services/DashboardService';
import { FeedbackRepository } from '../../../src/dashboard/repositories/FeedbackRepository';
import { CacheService } from '../../../src/dashboard/services/CacheService';
import { MetricsAggregator } from '../../../src/dashboard/services/MetricsAggregator';
import {
  Feedback,
  FilterState,
  AggregatedMetrics,
  PaginatedReviews,
  Comment,
  DashboardData
} from '../../../src/dashboard/types';

// Mock dependencies
jest.mock('../../../src/dashboard/repositories/FeedbackRepository');
jest.mock('../../../src/dashboard/services/CacheService');
jest.mock('../../../src/dashboard/services/MetricsAggregator');

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockFeedbackRepository: jest.Mocked<FeedbackRepository>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockMetricsAggregator: jest.Mocked<MetricsAggregator>;

  // Sample data
  const sampleFilters: FilterState = {
    timeRange: 'last_7_days',
    templeIds: [],
    regions: [],
    categories: []
  };

  const sampleFeedback: Feedback[] = [
    {
      feedbackId: 'fb1',
      timestamp: Date.now(),
      userId: 'user1',
      templeId: 'temple1',
      rating: 5,
      reviewText: 'Great temple!',
      sentimentScore: 0.8,
      sentimentLabel: 'positive',
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
      feedbackId: 'fb2',
      timestamp: Date.now() - 1000,
      userId: 'user2',
      templeId: 'temple1',
      rating: 4,
      reviewText: 'Nice place',
      commentText: 'Could improve lighting',
      commentType: 'suggestion',
      sentimentScore: 0.5,
      sentimentLabel: 'positive',
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

  const sampleMetrics: AggregatedMetrics = {
    metricId: 'temple1:2024-01-15',
    metricType: 'dashboard_summary',
    averageRating: 4.5,
    totalReviews: 2,
    totalComments: 1,
    sentimentDistribution: {
      positive: 100,
      neutral: 0,
      negative: 0
    },
    ratingDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 1,
      5: 1
    },
    calculatedAt: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
  };

  beforeEach(() => {
    // Create mock instances
    mockFeedbackRepository = new FeedbackRepository(null as any, 'test-table') as jest.Mocked<FeedbackRepository>;
    mockCacheService = new CacheService() as jest.Mocked<CacheService>;
    mockMetricsAggregator = new MetricsAggregator() as jest.Mocked<MetricsAggregator>;

    // Create service instance
    dashboardService = new DashboardService(
      mockFeedbackRepository,
      mockCacheService,
      mockMetricsAggregator
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('should return cached data when available', async () => {
      // Arrange
      const cachedData: DashboardData = {
        metrics: sampleMetrics,
        reviews: [],
        comments: [],
        visualizations: {
          ratingTrend: [],
          sentimentPie: { positive: 100, neutral: 0, negative: 0 },
          reviewsByTemple: [],
          ratingHistogram: []
        }
      };

      mockCacheService.get.mockResolvedValue(cachedData);

      // Act
      const result = await dashboardService.getDashboardData(
        sampleFilters,
        'user1',
        'admin'
      );

      // Assert
      expect(result).toEqual(cachedData);
      expect(mockCacheService.get).toHaveBeenCalledTimes(1);
      expect(mockFeedbackRepository.queryFeedback).not.toHaveBeenCalled();
    });

    it('should fetch and calculate data when cache misses', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.queryFeedback.mockResolvedValue({
        items: sampleFeedback,
        count: 2,
        lastEvaluatedKey: undefined
      });
      mockFeedbackRepository.getReviews.mockResolvedValue({
        reviews: [],
        pagination: {
          page: 1,
          pageSize: 50,
          totalPages: 1,
          totalItems: 2
        }
      });
      mockFeedbackRepository.getComments.mockResolvedValue([]);
      mockMetricsAggregator.calculateAverageRating.mockResolvedValue(4.5);
      mockMetricsAggregator.calculateSentimentDistribution.mockResolvedValue({
        positive: 100,
        neutral: 0,
        negative: 0
      });
      mockMetricsAggregator.calculateReviewCount.mockResolvedValue({
        today: 2,
        thisWeek: 2,
        thisMonth: 2,
        allTime: 2
      });
      mockMetricsAggregator.calculateRatingDistribution.mockResolvedValue({
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 1
      });
      mockMetricsAggregator.calculateRatingTrend.mockResolvedValue([]);

      // Act
      const result = await dashboardService.getDashboardData(
        sampleFilters,
        'user1',
        'admin'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.averageRating).toBe(4.5);
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
      expect(mockFeedbackRepository.queryFeedback).toHaveBeenCalled();
    });

    it('should apply regional filtering for regional managers', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.queryFeedback.mockResolvedValue({
        items: sampleFeedback,
        count: 2,
        lastEvaluatedKey: undefined
      });
      mockFeedbackRepository.getReviews.mockResolvedValue({
        reviews: [],
        pagination: {
          page: 1,
          pageSize: 50,
          totalPages: 1,
          totalItems: 0
        }
      });
      mockFeedbackRepository.getComments.mockResolvedValue([]);
      mockMetricsAggregator.calculateAverageRating.mockResolvedValue(4.5);
      mockMetricsAggregator.calculateSentimentDistribution.mockResolvedValue({
        positive: 100,
        neutral: 0,
        negative: 0
      });
      mockMetricsAggregator.calculateReviewCount.mockResolvedValue({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        allTime: 0
      });
      mockMetricsAggregator.calculateRatingDistribution.mockResolvedValue({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      });
      mockMetricsAggregator.calculateRatingTrend.mockResolvedValue([]);

      // Act
      await dashboardService.getDashboardData(
        sampleFilters,
        'user1',
        'regional_manager',
        'North'
      );

      // Assert
      expect(mockFeedbackRepository.queryFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          regions: ['North']
        }),
        expect.any(Object)
      );
    });
  });

  describe('getReviews', () => {
    it('should return cached reviews when available', async () => {
      // Arrange
      const cachedReviews: PaginatedReviews = {
        reviews: [],
        pagination: {
          page: 1,
          pageSize: 50,
          totalPages: 1,
          totalItems: 0
        }
      };

      mockCacheService.get.mockResolvedValue(cachedReviews);

      // Act
      const result = await dashboardService.getReviews(sampleFilters, 1, 50);

      // Assert
      expect(result).toEqual(cachedReviews);
      expect(mockCacheService.get).toHaveBeenCalledTimes(1);
      expect(mockFeedbackRepository.getReviews).not.toHaveBeenCalled();
    });

    it('should fetch reviews when cache misses', async () => {
      // Arrange
      const reviews: PaginatedReviews = {
        reviews: [],
        pagination: {
          page: 1,
          pageSize: 50,
          totalPages: 1,
          totalItems: 0
        }
      };

      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.getReviews.mockResolvedValue(reviews);

      // Act
      const result = await dashboardService.getReviews(sampleFilters, 1, 50);

      // Assert
      expect(result).toEqual(reviews);
      expect(mockFeedbackRepository.getReviews).toHaveBeenCalledWith(sampleFilters, 1, 50);
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });

    it('should support pagination', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.getReviews.mockResolvedValue({
        reviews: [],
        pagination: {
          page: 2,
          pageSize: 50,
          totalPages: 3,
          totalItems: 150
        }
      });

      // Act
      const result = await dashboardService.getReviews(sampleFilters, 2, 50);

      // Assert
      expect(result.pagination.page).toBe(2);
      expect(mockFeedbackRepository.getReviews).toHaveBeenCalledWith(sampleFilters, 2, 50);
    });
  });

  describe('getComments', () => {
    it('should return cached comments when available', async () => {
      // Arrange
      const cachedComments: Comment[] = [];
      mockCacheService.get.mockResolvedValue(cachedComments);

      // Act
      const result = await dashboardService.getComments(sampleFilters);

      // Assert
      expect(result).toEqual(cachedComments);
      expect(mockCacheService.get).toHaveBeenCalledTimes(1);
      expect(mockFeedbackRepository.getComments).not.toHaveBeenCalled();
    });

    it('should fetch comments when cache misses', async () => {
      // Arrange
      const comments: Comment[] = [];
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.getComments.mockResolvedValue(comments);

      // Act
      const result = await dashboardService.getComments(sampleFilters);

      // Assert
      expect(result).toEqual(comments);
      expect(mockFeedbackRepository.getComments).toHaveBeenCalledWith(
        sampleFilters,
        undefined,
        undefined
      );
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });

    it('should support comment type filtering', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.getComments.mockResolvedValue([]);

      // Act
      await dashboardService.getComments(sampleFilters, 'suggestion');

      // Assert
      expect(mockFeedbackRepository.getComments).toHaveBeenCalledWith(
        sampleFilters,
        'suggestion',
        undefined
      );
    });

    it('should support keyword search', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.getComments.mockResolvedValue([]);

      // Act
      await dashboardService.getComments(sampleFilters, undefined, 'lighting');

      // Assert
      expect(mockFeedbackRepository.getComments).toHaveBeenCalledWith(
        sampleFilters,
        undefined,
        'lighting'
      );
    });
  });

  describe('getMetrics', () => {
    it('should return cached metrics when available', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(sampleMetrics);

      // Act
      const result = await dashboardService.getMetrics(sampleFilters);

      // Assert
      expect(result).toEqual(sampleMetrics);
      expect(mockCacheService.get).toHaveBeenCalledTimes(1);
      expect(mockFeedbackRepository.queryFeedback).not.toHaveBeenCalled();
    });

    it('should fetch and calculate metrics when cache misses', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.queryFeedback.mockResolvedValue({
        items: sampleFeedback,
        count: 2,
        lastEvaluatedKey: undefined
      });
      mockMetricsAggregator.calculateAverageRating.mockResolvedValue(4.5);
      mockMetricsAggregator.calculateSentimentDistribution.mockResolvedValue({
        positive: 100,
        neutral: 0,
        negative: 0
      });
      mockMetricsAggregator.calculateReviewCount.mockResolvedValue({
        today: 2,
        thisWeek: 2,
        thisMonth: 2,
        allTime: 2
      });
      mockMetricsAggregator.calculateRatingDistribution.mockResolvedValue({
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 1
      });

      // Act
      const result = await dashboardService.getMetrics(sampleFilters);

      // Assert
      expect(result).toBeDefined();
      expect(result.averageRating).toBe(4.5);
      expect(result.totalReviews).toBe(2);
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('getVisualizations', () => {
    it('should return cached visualizations when available', async () => {
      // Arrange
      const cachedViz = {
        ratingTrend: [],
        sentimentPie: { positive: 100, neutral: 0, negative: 0 },
        reviewsByTemple: [],
        ratingHistogram: []
      };
      mockCacheService.get.mockResolvedValue(cachedViz);

      // Act
      const result = await dashboardService.getVisualizations(sampleFilters);

      // Assert
      expect(result).toEqual(cachedViz);
      expect(mockCacheService.get).toHaveBeenCalledTimes(1);
      expect(mockFeedbackRepository.queryFeedback).not.toHaveBeenCalled();
    });

    it('should fetch and generate visualizations when cache misses', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.queryFeedback.mockResolvedValue({
        items: sampleFeedback,
        count: 2,
        lastEvaluatedKey: undefined
      });
      mockMetricsAggregator.calculateRatingTrend.mockResolvedValue([]);
      mockMetricsAggregator.calculateSentimentDistribution.mockResolvedValue({
        positive: 100,
        neutral: 0,
        negative: 0
      });
      mockMetricsAggregator.calculateRatingDistribution.mockResolvedValue({
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 1
      });

      // Act
      const result = await dashboardService.getVisualizations(sampleFilters);

      // Assert
      expect(result).toBeDefined();
      expect(result.ratingTrend).toBeDefined();
      expect(result.sentimentPie).toBeDefined();
      expect(result.reviewsByTemple).toBeDefined();
      expect(result.ratingHistogram).toBeDefined();
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });

    it('should support different granularities', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.queryFeedback.mockResolvedValue({
        items: sampleFeedback,
        count: 2,
        lastEvaluatedKey: undefined
      });
      mockMetricsAggregator.calculateRatingTrend.mockResolvedValue([]);
      mockMetricsAggregator.calculateSentimentDistribution.mockResolvedValue({
        positive: 100,
        neutral: 0,
        negative: 0
      });
      mockMetricsAggregator.calculateRatingDistribution.mockResolvedValue({
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 1
      });

      // Act
      await dashboardService.getVisualizations(sampleFilters, 'week');

      // Assert
      expect(mockMetricsAggregator.calculateRatingTrend).toHaveBeenCalledWith(
        sampleFeedback,
        sampleFilters,
        'week'
      );
    });
  });

  describe('invalidateCacheForFeedback', () => {
    it('should call cache service invalidation', async () => {
      // Arrange
      mockCacheService.invalidateForFeedback.mockResolvedValue();

      // Act
      await dashboardService.invalidateCacheForFeedback('fb1', 'temple1');

      // Assert
      expect(mockCacheService.invalidateForFeedback).toHaveBeenCalledWith('fb1', 'temple1');
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockFeedbackRepository.queryFeedback.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        dashboardService.getDashboardData(sampleFilters, 'user1', 'admin')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle cache errors gracefully', async () => {
      // Arrange
      mockCacheService.get.mockRejectedValue(new Error('Redis connection failed'));
      mockFeedbackRepository.queryFeedback.mockResolvedValue({
        items: sampleFeedback,
        count: 2,
        lastEvaluatedKey: undefined
      });
      mockFeedbackRepository.getReviews.mockResolvedValue({
        reviews: [],
        pagination: {
          page: 1,
          pageSize: 50,
          totalPages: 1,
          totalItems: 0
        }
      });
      mockFeedbackRepository.getComments.mockResolvedValue([]);
      mockMetricsAggregator.calculateAverageRating.mockResolvedValue(4.5);
      mockMetricsAggregator.calculateSentimentDistribution.mockResolvedValue({
        positive: 100,
        neutral: 0,
        negative: 0
      });
      mockMetricsAggregator.calculateReviewCount.mockResolvedValue({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        allTime: 0
      });
      mockMetricsAggregator.calculateRatingDistribution.mockResolvedValue({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      });
      mockMetricsAggregator.calculateRatingTrend.mockResolvedValue([]);

      // Act & Assert
      await expect(
        dashboardService.getDashboardData(sampleFilters, 'user1', 'admin')
      ).rejects.toThrow('Redis connection failed');
    });
  });
});
