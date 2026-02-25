/**
 * Fast-check arbitraries for property-based testing
 * Feature: real-time-reports-dashboard
 */

import fc from 'fast-check';
import {
  Feedback,
  FilterState,
  TimeRange,
  CommentType,
  SentimentLabel,
  Review,
  Comment,
  AggregatedMetrics,
  SentimentDistribution,
  RatingDistribution
} from '../../../src/dashboard/types';

// ============================================================================
// Basic Arbitraries
// ============================================================================

export const timeRangeArbitrary = (): fc.Arbitrary<TimeRange> =>
  fc.constantFrom('today', 'last_7_days', 'last_30_days', 'last_90_days', 'all_time');

export const commentTypeArbitrary = (): fc.Arbitrary<CommentType> =>
  fc.constantFrom('general', 'suggestion', 'complaint');

export const sentimentLabelArbitrary = (): fc.Arbitrary<SentimentLabel> =>
  fc.constantFrom('positive', 'neutral', 'negative');

export const ratingArbitrary = (): fc.Arbitrary<number> =>
  fc.integer({ min: 1, max: 5 });

export const sentimentScoreArbitrary = (): fc.Arbitrary<number> =>
  fc.float({ min: -1.0, max: 1.0 });

export const regionArbitrary = (): fc.Arbitrary<string> =>
  fc.constantFrom('North', 'South', 'East', 'West', 'Central');

export const categoryArbitrary = (): fc.Arbitrary<string> =>
  fc.constantFrom('Architecture', 'History', 'Rituals', 'Festivals', 'Deities');

// ============================================================================
// Timestamp Arbitraries
// ============================================================================

export const timestampArbitrary = (
  minDaysAgo: number = 90,
  maxDaysAgo: number = 0
): fc.Arbitrary<number> => {
  const now = Date.now();
  const minTime = now - minDaysAgo * 24 * 60 * 60 * 1000;
  const maxTime = now - maxDaysAgo * 24 * 60 * 60 * 1000;
  return fc.integer({ min: minTime, max: maxTime });
};

export const isoDateArbitrary = (): fc.Arbitrary<string> =>
  timestampArbitrary().map(ts => new Date(ts).toISOString());

// ============================================================================
// Feedback Arbitrary
// ============================================================================

export const feedbackArbitrary = (): fc.Arbitrary<Feedback> =>
  fc.record({
    feedbackId: fc.uuid(),
    timestamp: timestampArbitrary(),
    userId: fc.uuid(),
    templeId: fc.uuid(),
    artifactId: fc.option(fc.uuid(), { nil: undefined }),
    rating: ratingArbitrary(),
    reviewText: fc.option(fc.lorem({ maxCount: 50 }), { nil: undefined }),
    commentText: fc.option(fc.lorem({ maxCount: 30 }), { nil: undefined }),
    commentType: fc.option(commentTypeArbitrary(), { nil: undefined }),
    sentimentScore: fc.option(sentimentScoreArbitrary(), { nil: undefined }),
    sentimentLabel: fc.option(sentimentLabelArbitrary(), { nil: undefined }),
    region: regionArbitrary(),
    category: categoryArbitrary(),
    metadata: fc.record({
      deviceType: fc.constantFrom('iOS', 'Android', 'Web'),
      appVersion: fc.constantFrom('1.0.0', '1.1.0', '1.2.0'),
      language: fc.constantFrom('en', 'hi', 'ta', 'te', 'kn')
    }),
    createdAt: isoDateArbitrary(),
    updatedAt: isoDateArbitrary()
  });

// ============================================================================
// Review Arbitrary
// ============================================================================

export const reviewArbitrary = (): fc.Arbitrary<Review> =>
  fc.record({
    feedbackId: fc.uuid(),
    userId: fc.uuid(),
    userName: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
    templeId: fc.uuid(),
    templeName: fc.lorem({ maxCount: 5 }),
    rating: ratingArbitrary(),
    reviewText: fc.lorem({ maxCount: 50 }),
    sentimentLabel: sentimentLabelArbitrary(),
    timestamp: timestampArbitrary(),
    createdAt: isoDateArbitrary()
  });

// ============================================================================
// Comment Arbitrary
// ============================================================================

export const commentArbitrary = (): fc.Arbitrary<Comment> =>
  fc.record({
    feedbackId: fc.uuid(),
    userId: fc.uuid(),
    templeId: fc.uuid(),
    templeName: fc.lorem({ maxCount: 5 }),
    commentText: fc.lorem({ maxCount: 30 }),
    commentType: commentTypeArbitrary(),
    timestamp: timestampArbitrary(),
    createdAt: isoDateArbitrary()
  });

// ============================================================================
// Filter State Arbitrary
// ============================================================================

export const filterStateArbitrary = (): fc.Arbitrary<FilterState> =>
  fc.record({
    timeRange: timeRangeArbitrary(),
    templeIds: fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
    regions: fc.array(regionArbitrary(), { minLength: 0, maxLength: 3 }),
    categories: fc.array(categoryArbitrary(), { minLength: 0, maxLength: 3 })
  });

// ============================================================================
// Sentiment Distribution Arbitrary
// ============================================================================

export const sentimentDistributionArbitrary = (): fc.Arbitrary<SentimentDistribution> =>
  fc.tuple(
    fc.integer({ min: 0, max: 100 }),
    fc.integer({ min: 0, max: 100 }),
    fc.integer({ min: 0, max: 100 })
  ).map(([p, n, neg]) => {
    const total = p + n + neg;
    if (total === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }
    return {
      positive: Math.round((p / total) * 100 * 100) / 100,
      neutral: Math.round((n / total) * 100 * 100) / 100,
      negative: Math.round((neg / total) * 100 * 100) / 100
    };
  });

// ============================================================================
// Rating Distribution Arbitrary
// ============================================================================

export const ratingDistributionArbitrary = (): fc.Arbitrary<RatingDistribution> =>
  fc.record({
    1: fc.nat(),
    2: fc.nat(),
    3: fc.nat(),
    4: fc.nat(),
    5: fc.nat()
  });

// ============================================================================
// Aggregated Metrics Arbitrary
// ============================================================================

export const aggregatedMetricsArbitrary = (): fc.Arbitrary<AggregatedMetrics> =>
  fc.record({
    metricId: fc.string(),
    metricType: fc.constantFrom('daily_summary', 'weekly_summary', 'monthly_summary'),
    averageRating: fc.float({ min: 1.0, max: 5.0 }),
    totalReviews: fc.nat(),
    totalComments: fc.nat(),
    sentimentDistribution: sentimentDistributionArbitrary(),
    ratingDistribution: ratingDistributionArbitrary(),
    calculatedAt: isoDateArbitrary(),
    ttl: fc.integer({ min: Date.now(), max: Date.now() + 90 * 24 * 60 * 60 * 1000 })
  });

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a feedback item with a specific rating
 */
export const feedbackWithRating = (rating: number): fc.Arbitrary<Feedback> =>
  feedbackArbitrary().map(f => ({ ...f, rating }));

/**
 * Creates a feedback item with a specific sentiment score
 */
export const feedbackWithSentiment = (score: number): fc.Arbitrary<Feedback> =>
  feedbackArbitrary().map(f => ({
    ...f,
    sentimentScore: score,
    sentimentLabel: score >= 0.3 ? 'positive' : score <= -0.3 ? 'negative' : 'neutral'
  }));

/**
 * Creates a feedback item within a specific time range
 */
export const feedbackInTimeRange = (
  startTime: number,
  endTime: number
): fc.Arbitrary<Feedback> =>
  feedbackArbitrary().map(f => ({
    ...f,
    timestamp: fc.sample(fc.integer({ min: startTime, max: endTime }), 1)[0]
  }));
