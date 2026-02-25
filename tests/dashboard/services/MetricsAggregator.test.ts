/**
 * Unit tests for MetricsAggregator Service
 * Feature: real-time-reports-dashboard
 */

import { MetricsAggregator } from '../../../src/dashboard/services/MetricsAggregator';
import {
  Feedback,
  AggregatedMetrics,
  SentimentDistribution,
  RatingDistribution,
  FilterState
} from '../../../src/dashboard/types';

describe('MetricsAggregator', () => {
  let aggregator: MetricsAggregator;

  beforeEach(() => {
    aggregator = new MetricsAggregator();
  });

  describe('calculateAverageRating', () => {
    it('should return 0 for empty feedback array', async () => {
      const result = await aggregator.calculateAverageRating([]);
      expect(result).toBe(0);
    });

    it('should calculate average rating with two decimal precision', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ rating: 4 }),
        createFeedback({ rating: 5 }),
        createFeedback({ rating: 3 })
      ];

      const result = await aggregator.calculateAverageRating(feedbackItems);
      expect(result).toBe(4.00);
    });

    it('should round to exactly two decimal places', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ rating: 4 }),
        createFeedback({ rating: 4 }),
        createFeedback({ rating: 5 })
      ];

      const result = await aggregator.calculateAverageRating(feedbackItems);
      // (4 + 4 + 5) / 3 = 4.333... should round to 4.33
      expect(result).toBe(4.33);
    });

    it('should handle single rating', async () => {
      const feedbackItems: Feedback[] = [createFeedback({ rating: 5 })];

      const result = await aggregator.calculateAverageRating(feedbackItems);
      expect(result).toBe(5.00);
    });

    it('should handle all minimum ratings', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ rating: 1 }),
        createFeedback({ rating: 1 }),
        createFeedback({ rating: 1 })
      ];

      const result = await aggregator.calculateAverageRating(feedbackItems);
      expect(result).toBe(1.00);
    });

    it('should handle all maximum ratings', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ rating: 5 }),
        createFeedback({ rating: 5 }),
        createFeedback({ rating: 5 })
      ];

      const result = await aggregator.calculateAverageRating(feedbackItems);
      expect(result).toBe(5.00);
    });
  });

  describe('calculateSentimentDistribution', () => {
    it('should return zero distribution for empty feedback array', async () => {
      const result = await aggregator.calculateSentimentDistribution([]);
      expect(result).toEqual({
        positive: 0,
        neutral: 0,
        negative: 0
      });
    });

    it('should calculate sentiment distribution as percentages', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ sentimentLabel: 'positive' }),
        createFeedback({ sentimentLabel: 'positive' }),
        createFeedback({ sentimentLabel: 'neutral' }),
        createFeedback({ sentimentLabel: 'negative' })
      ];

      const result = await aggregator.calculateSentimentDistribution(feedbackItems);
      expect(result.positive).toBe(50);
      expect(result.neutral).toBe(25);
      expect(result.negative).toBe(25);
    });

    it('should sum to 100 percent', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ sentimentLabel: 'positive' }),
        createFeedback({ sentimentLabel: 'positive' }),
        createFeedback({ sentimentLabel: 'neutral' })
      ];

      const result = await aggregator.calculateSentimentDistribution(feedbackItems);
      const sum = result.positive + result.neutral + result.negative;
      expect(sum).toBe(100);
    });

    it('should handle all positive sentiment', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ sentimentLabel: 'positive' }),
        createFeedback({ sentimentLabel: 'positive' })
      ];

      const result = await aggregator.calculateSentimentDistribution(feedbackItems);
      expect(result.positive).toBe(100);
      expect(result.neutral).toBe(0);
      expect(result.negative).toBe(0);
    });

    it('should handle all negative sentiment', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ sentimentLabel: 'negative' }),
        createFeedback({ sentimentLabel: 'negative' })
      ];

      const result = await aggregator.calculateSentimentDistribution(feedbackItems);
      expect(result.positive).toBe(0);
      expect(result.neutral).toBe(0);
      expect(result.negative).toBe(100);
    });

    it('should default to neutral for missing sentiment label', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ sentimentLabel: undefined })
      ];

      const result = await aggregator.calculateSentimentDistribution(feedbackItems);
      expect(result.neutral).toBe(100);
    });

    it('should handle rounding to ensure sum equals 100', async () => {
      // Create a scenario that would cause rounding issues
      const feedbackItems: Feedback[] = [
        createFeedback({ sentimentLabel: 'positive' }),
        createFeedback({ sentimentLabel: 'neutral' }),
        createFeedback({ sentimentLabel: 'negative' })
      ];

      const result = await aggregator.calculateSentimentDistribution(feedbackItems);
      const sum = result.positive + result.neutral + result.negative;
      expect(sum).toBe(100);
    });
  });

  describe('calculateReviewCount', () => {
    it('should count reviews by time period', async () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

      const feedbackItems: Feedback[] = [
        createFeedback({ reviewText: 'Today review', timestamp: now - 1000 }),
        createFeedback({ reviewText: 'This week review', timestamp: now - 3 * oneDayMs }),
        createFeedback({ reviewText: 'This month review', timestamp: now - 15 * oneDayMs }),
        createFeedback({ reviewText: 'Old review', timestamp: now - 60 * oneDayMs })
      ];

      const result = await aggregator.calculateReviewCount(feedbackItems);
      expect(result.today).toBe(1);
      expect(result.thisWeek).toBe(2);
      expect(result.thisMonth).toBe(3);
      expect(result.allTime).toBe(4);
    });

    it('should exclude items without review text', async () => {
      const now = Date.now();
      const feedbackItems: Feedback[] = [
        createFeedback({ reviewText: 'Has review', timestamp: now }),
        createFeedback({ reviewText: '', timestamp: now }),
        createFeedback({ reviewText: undefined, timestamp: now })
      ];

      const result = await aggregator.calculateReviewCount(feedbackItems);
      expect(result.allTime).toBe(1);
    });

    it('should return zero counts for empty array', async () => {
      const result = await aggregator.calculateReviewCount([]);
      expect(result.today).toBe(0);
      expect(result.thisWeek).toBe(0);
      expect(result.thisMonth).toBe(0);
      expect(result.allTime).toBe(0);
    });

    it('should exclude whitespace-only review text', async () => {
      const now = Date.now();
      const feedbackItems: Feedback[] = [
        createFeedback({ reviewText: '   ', timestamp: now }),
        createFeedback({ reviewText: '\t\n', timestamp: now })
      ];

      const result = await aggregator.calculateReviewCount(feedbackItems);
      expect(result.allTime).toBe(0);
    });
  });

  describe('calculateRatingTrend', () => {
    it('should return empty array for empty feedback', async () => {
      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: [],
        regions: [],
        categories: []
      };

      const result = await aggregator.calculateRatingTrend([], filters, 'day');
      expect(result).toEqual([]);
    });

    it('should group ratings by day', async () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const feedbackItems: Feedback[] = [
        createFeedback({ rating: 5, timestamp: now }),
        createFeedback({ rating: 4, timestamp: now }),
        createFeedback({ rating: 3, timestamp: now - oneDayMs }),
        createFeedback({ rating: 2, timestamp: now - oneDayMs })
      ];

      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: [],
        regions: [],
        categories: []
      };

      const result = await aggregator.calculateRatingTrend(feedbackItems, filters, 'day');
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(2.5); // (3 + 2) / 2
      expect(result[1].value).toBe(4.5); // (5 + 4) / 2
    });

    it('should sort trend data by timestamp ascending', async () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const feedbackItems: Feedback[] = [
        createFeedback({ rating: 5, timestamp: now }),
        createFeedback({ rating: 3, timestamp: now - 2 * oneDayMs }),
        createFeedback({ rating: 4, timestamp: now - oneDayMs })
      ];

      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: [],
        regions: [],
        categories: []
      };

      const result = await aggregator.calculateRatingTrend(feedbackItems, filters, 'day');
      expect(result[0].timestamp).toBeLessThan(result[1].timestamp);
      expect(result[1].timestamp).toBeLessThan(result[2].timestamp);
    });

    it('should include timestamp labels', async () => {
      const now = Date.now();
      const feedbackItems: Feedback[] = [
        createFeedback({ rating: 5, timestamp: now })
      ];

      const filters: FilterState = {
        timeRange: 'last_7_days',
        templeIds: [],
        regions: [],
        categories: []
      };

      const result = await aggregator.calculateRatingTrend(feedbackItems, filters, 'day');
      expect(result[0].label).toBeDefined();
      expect(typeof result[0].label).toBe('string');
    });
  });

  describe('calculateRatingDistribution', () => {
    it('should count ratings by level', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ rating: 5 }),
        createFeedback({ rating: 5 }),
        createFeedback({ rating: 4 }),
        createFeedback({ rating: 3 }),
        createFeedback({ rating: 2 })
      ];

      const result = await aggregator.calculateRatingDistribution(feedbackItems);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(1);
      expect(result[3]).toBe(1);
      expect(result[4]).toBe(1);
      expect(result[5]).toBe(2);
    });

    it('should return zero counts for empty array', async () => {
      const result = await aggregator.calculateRatingDistribution([]);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(0);
      expect(result[3]).toBe(0);
      expect(result[4]).toBe(0);
      expect(result[5]).toBe(0);
    });

    it('should handle all ratings at one level', async () => {
      const feedbackItems: Feedback[] = [
        createFeedback({ rating: 5 }),
        createFeedback({ rating: 5 }),
        createFeedback({ rating: 5 })
      ];

      const result = await aggregator.calculateRatingDistribution(feedbackItems);
      expect(result[5]).toBe(3);
      expect(result[1] + result[2] + result[3] + result[4]).toBe(0);
    });
  });

  describe('updateMetricsIncremental', () => {
    it('should update average rating incrementally', async () => {
      const previousMetrics = createAggregatedMetrics({
        averageRating: 4.0,
        totalReviews: 2,
        totalComments: 0
      });

      const newFeedback = createFeedback({
        rating: 5,
        reviewText: 'Great temple!'
      });

      const result = await aggregator.updateMetricsIncremental(previousMetrics, newFeedback);
      
      // (4.0 * 2 + 5) / 3 = 13 / 3 = 4.33
      expect(result.averageRating).toBe(4.33);
      expect(result.totalReviews).toBe(3);
    });

    it('should update review count when new feedback has review text', async () => {
      const previousMetrics = createAggregatedMetrics({
        totalReviews: 5
      });

      const newFeedback = createFeedback({
        reviewText: 'New review'
      });

      const result = await aggregator.updateMetricsIncremental(previousMetrics, newFeedback);
      expect(result.totalReviews).toBe(6);
    });

    it('should not update review count when feedback has no review text', async () => {
      const previousMetrics = createAggregatedMetrics({
        totalReviews: 5
      });

      const newFeedback = createFeedback({
        reviewText: ''
      });

      const result = await aggregator.updateMetricsIncremental(previousMetrics, newFeedback);
      expect(result.totalReviews).toBe(5);
    });

    it('should update comment count when new feedback has comment text', async () => {
      const previousMetrics = createAggregatedMetrics({
        totalComments: 3
      });

      const newFeedback = createFeedback({
        commentText: 'New comment'
      });

      const result = await aggregator.updateMetricsIncremental(previousMetrics, newFeedback);
      expect(result.totalComments).toBe(4);
    });

    it('should update sentiment distribution incrementally', async () => {
      const previousMetrics = createAggregatedMetrics({
        totalReviews: 2,
        sentimentDistribution: {
          positive: 50,
          neutral: 50,
          negative: 0
        }
      });

      const newFeedback = createFeedback({
        sentimentLabel: 'positive'
      });

      const result = await aggregator.updateMetricsIncremental(previousMetrics, newFeedback);
      
      // Should have 2 positive, 1 neutral out of 3 total
      expect(result.sentimentDistribution.positive).toBeCloseTo(66.67, 1);
      expect(result.sentimentDistribution.neutral).toBeCloseTo(33.33, 1);
    });

    it('should update rating distribution incrementally', async () => {
      const previousMetrics = createAggregatedMetrics({
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 1,
          4: 1,
          5: 0
        }
      });

      const newFeedback = createFeedback({
        rating: 5
      });

      const result = await aggregator.updateMetricsIncremental(previousMetrics, newFeedback);
      expect(result.ratingDistribution[5]).toBe(1);
    });

    it('should handle first feedback item', async () => {
      const previousMetrics = createAggregatedMetrics({
        averageRating: 0,
        totalReviews: 0,
        totalComments: 0
      });

      const newFeedback = createFeedback({
        rating: 5,
        reviewText: 'First review'
      });

      const result = await aggregator.updateMetricsIncremental(previousMetrics, newFeedback);
      expect(result.averageRating).toBe(5);
      expect(result.totalReviews).toBe(1);
    });

    it('should update calculatedAt timestamp', async () => {
      const previousMetrics = createAggregatedMetrics({});
      const newFeedback = createFeedback({});

      const result = await aggregator.updateMetricsIncremental(previousMetrics, newFeedback);
      expect(result.calculatedAt).not.toBe(previousMetrics.calculatedAt);
    });
  });
});

// Helper functions to create test data

function createFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    feedbackId: `feedback-${Math.random()}`,
    timestamp: Date.now(),
    userId: 'user-123',
    templeId: 'temple-456',
    rating: 4,
    region: 'North',
    category: 'Architecture',
    metadata: {
      deviceType: 'mobile',
      appVersion: '1.0.0',
      language: 'en'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

function createAggregatedMetrics(overrides: Partial<AggregatedMetrics> = {}): AggregatedMetrics {
  return {
    metricId: 'metric-123',
    metricType: 'daily_summary',
    averageRating: 4.0,
    totalReviews: 10,
    totalComments: 5,
    sentimentDistribution: {
      positive: 60,
      neutral: 30,
      negative: 10
    },
    ratingDistribution: {
      1: 0,
      2: 1,
      3: 2,
      4: 3,
      5: 4
    },
    calculatedAt: new Date().toISOString(),
    ttl: Date.now() + 90 * 24 * 60 * 60 * 1000,
    ...overrides
  };
}
