/**
 * MetricsAggregator Service
 * Feature: real-time-reports-dashboard
 * 
 * Calculates aggregated metrics from raw feedback data.
 * Includes methods for average rating (rounded to 2 decimal places),
 * sentiment distribution, review counts by time period, rating trends,
 * and incremental metric updates for performance.
 * 
 * Validates: Requirements 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 5.4, 10.2
 */

import {
  Feedback,
  AggregatedMetrics,
  SentimentDistribution,
  RatingDistribution,
  TimeSeriesData,
  FilterState,
  TimeRange
} from '../types';
import { RATING, TIME_RANGE_MILLISECONDS, GRANULARITY } from '../constants';

export interface ReviewCountByPeriod {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
}

export type TrendGranularity = 'hour' | 'day' | 'week' | 'month';

export class MetricsAggregator {
  /**
   * Calculate average rating with two decimal precision
   * Requirement 4.2: Calculate average rating with precision to two decimal places
   */
  async calculateAverageRating(feedbackItems: Feedback[]): Promise<number> {
    if (feedbackItems.length === 0) {
      return 0;
    }

    const sum = feedbackItems.reduce((acc, item) => acc + item.rating, 0);
    const average = sum / feedbackItems.length;

    // Round to exactly 2 decimal places
    return Math.round(average * 100) / 100;
  }

  /**
   * Calculate sentiment distribution as percentages
   * Requirement 3.4: Display sentiment distribution as percentages
   */
  async calculateSentimentDistribution(
    feedbackItems: Feedback[]
  ): Promise<SentimentDistribution> {
    if (feedbackItems.length === 0) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0
      };
    }

    const counts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    // Count items by sentiment label
    feedbackItems.forEach(item => {
      const label = item.sentimentLabel || 'neutral';
      counts[label]++;
    });

    const total = feedbackItems.length;

    // Calculate percentages and round to 2 decimal places
    const distribution: SentimentDistribution = {
      positive: Math.round((counts.positive / total) * 10000) / 100,
      neutral: Math.round((counts.neutral / total) * 10000) / 100,
      negative: Math.round((counts.negative / total) * 10000) / 100
    };

    // Ensure percentages sum to 100% by adjusting the largest value
    // This handles rounding errors
    const sum = distribution.positive + distribution.neutral + distribution.negative;
    if (sum !== 100) {
      const diff = 100 - sum;
      const maxKey = Object.keys(distribution).reduce((a, b) =>
        distribution[a as keyof SentimentDistribution] > distribution[b as keyof SentimentDistribution] ? a : b
      ) as keyof SentimentDistribution;
      distribution[maxKey] = Math.round((distribution[maxKey] + diff) * 100) / 100;
    }

    return distribution;
  }

  /**
   * Calculate review count with time period support
   * Requirement 5.4: Display count of reviews by time period
   */
  async calculateReviewCount(
    feedbackItems: Feedback[],
    filters?: FilterState
  ): Promise<ReviewCountByPeriod> {
    const now = Date.now();
    const oneDayMs = TIME_RANGE_MILLISECONDS.today;
    const oneWeekMs = TIME_RANGE_MILLISECONDS.last_7_days;
    const oneMonthMs = TIME_RANGE_MILLISECONDS.last_30_days;

    // Filter to only items with review text
    const reviews = feedbackItems.filter(
      item => item.reviewText && item.reviewText.trim().length > 0
    );

    const counts: ReviewCountByPeriod = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      allTime: reviews.length
    };

    reviews.forEach(item => {
      const age = now - item.timestamp;

      if (age <= oneDayMs) {
        counts.today++;
      }
      if (age <= oneWeekMs) {
        counts.thisWeek++;
      }
      if (age <= oneMonthMs) {
        counts.thisMonth++;
      }
    });

    return counts;
  }

  /**
   * Calculate rating trend with granularity options
   * Requirement 11.1: Display line chart showing rating trends over time
   */
  async calculateRatingTrend(
    feedbackItems: Feedback[],
    filters: FilterState,
    granularity: TrendGranularity = 'day'
  ): Promise<TimeSeriesData[]> {
    if (feedbackItems.length === 0) {
      return [];
    }

    // Group feedback by time buckets based on granularity
    const buckets = new Map<number, Feedback[]>();

    feedbackItems.forEach(item => {
      const bucketKey = this.getBucketKey(item.timestamp, granularity);
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(item);
    });

    // Calculate average rating for each bucket
    const trendData: TimeSeriesData[] = [];

    buckets.forEach((items, timestamp) => {
      const sum = items.reduce((acc, item) => acc + item.rating, 0);
      const average = Math.round((sum / items.length) * 100) / 100;

      trendData.push({
        timestamp,
        value: average,
        label: this.formatTimestampLabel(timestamp, granularity)
      });
    });

    // Sort by timestamp ascending
    trendData.sort((a, b) => a.timestamp - b.timestamp);

    return trendData;
  }

  /**
   * Calculate rating distribution (histogram)
   * Requirement 11.4: Display histogram showing rating distribution
   */
  async calculateRatingDistribution(
    feedbackItems: Feedback[]
  ): Promise<RatingDistribution> {
    const distribution: RatingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    feedbackItems.forEach(item => {
      const rating = item.rating as 1 | 2 | 3 | 4 | 5;
      if (rating >= RATING.MIN && rating <= RATING.MAX) {
        distribution[rating]++;
      }
    });

    return distribution;
  }

  /**
   * Update metrics incrementally for performance optimization
   * Requirement 10.2: Use incremental calculation methods to avoid recalculating from scratch
   */
  async updateMetricsIncremental(
    previousMetrics: AggregatedMetrics,
    newFeedback: Feedback
  ): Promise<AggregatedMetrics> {
    // Extract previous values
    const prevAvgRating = previousMetrics.averageRating;
    const prevTotalReviews = previousMetrics.totalReviews;
    const prevTotalComments = previousMetrics.totalComments;
    const prevSentiment = previousMetrics.sentimentDistribution;
    const prevRatingDist = previousMetrics.ratingDistribution;

    // Determine if this is a review or comment
    const isReview = newFeedback.reviewText && newFeedback.reviewText.trim().length > 0;
    const isComment = newFeedback.commentText && newFeedback.commentText.trim().length > 0;

    // Update review count
    const newTotalReviews = isReview ? prevTotalReviews + 1 : prevTotalReviews;

    // Update comment count
    const newTotalComments = isComment ? prevTotalComments + 1 : prevTotalComments;

    // Update average rating incrementally
    // Formula: new_avg = (old_avg * old_count + new_value) / new_count
    const totalRatings = prevTotalReviews; // Previous count of ratings
    const newAvgRating = totalRatings === 0
      ? newFeedback.rating
      : Math.round(((prevAvgRating * totalRatings + newFeedback.rating) / (totalRatings + 1)) * 100) / 100;

    // Update sentiment distribution incrementally
    const sentimentLabel = newFeedback.sentimentLabel || 'neutral';
    const newSentiment = this.updateSentimentDistributionIncremental(
      prevSentiment,
      sentimentLabel,
      totalRatings + 1
    );

    // Update rating distribution incrementally
    const newRatingDist = { ...prevRatingDist };
    const rating = newFeedback.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= RATING.MIN && rating <= RATING.MAX) {
      newRatingDist[rating]++;
    }

    return {
      ...previousMetrics,
      averageRating: newAvgRating,
      totalReviews: newTotalReviews,
      totalComments: newTotalComments,
      sentimentDistribution: newSentiment,
      ratingDistribution: newRatingDist,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Update sentiment distribution incrementally
   */
  private updateSentimentDistributionIncremental(
    prevDistribution: SentimentDistribution,
    newSentimentLabel: 'positive' | 'neutral' | 'negative',
    newTotalCount: number
  ): SentimentDistribution {
    // Convert percentages back to counts
    const prevTotalCount = newTotalCount - 1;
    const prevCounts = {
      positive: Math.round((prevDistribution.positive / 100) * prevTotalCount),
      neutral: Math.round((prevDistribution.neutral / 100) * prevTotalCount),
      negative: Math.round((prevDistribution.negative / 100) * prevTotalCount)
    };

    // Increment the count for the new sentiment
    prevCounts[newSentimentLabel]++;

    // Calculate new percentages
    const newDistribution: SentimentDistribution = {
      positive: Math.round((prevCounts.positive / newTotalCount) * 10000) / 100,
      neutral: Math.round((prevCounts.neutral / newTotalCount) * 10000) / 100,
      negative: Math.round((prevCounts.negative / newTotalCount) * 10000) / 100
    };

    // Ensure percentages sum to 100%
    const sum = newDistribution.positive + newDistribution.neutral + newDistribution.negative;
    if (sum !== 100) {
      const diff = 100 - sum;
      const maxKey = Object.keys(newDistribution).reduce((a, b) =>
        newDistribution[a as keyof SentimentDistribution] > newDistribution[b as keyof SentimentDistribution] ? a : b
      ) as keyof SentimentDistribution;
      newDistribution[maxKey] = Math.round((newDistribution[maxKey] + diff) * 100) / 100;
    }

    return newDistribution;
  }

  /**
   * Get bucket key for time series grouping based on granularity
   */
  private getBucketKey(timestamp: number, granularity: TrendGranularity): number {
    const date = new Date(timestamp);

    switch (granularity) {
      case 'hour':
        // Round down to the start of the hour
        date.setMinutes(0, 0, 0);
        return date.getTime();

      case 'day':
        // Round down to the start of the day
        date.setHours(0, 0, 0, 0);
        return date.getTime();

      case 'week':
        // Round down to the start of the week (Sunday)
        const day = date.getDay();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
        return date.getTime();

      case 'month':
        // Round down to the start of the month
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date.getTime();

      default:
        return timestamp;
    }
  }

  /**
   * Format timestamp label based on granularity
   */
  private formatTimestampLabel(timestamp: number, granularity: TrendGranularity): string {
    const date = new Date(timestamp);

    switch (granularity) {
      case 'hour':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          hour12: true
        });

      case 'day':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric'
        });

      case 'week':
        return `Week of ${date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric'
        })}`;

      case 'month':
        return date.toLocaleString('en-US', {
          month: 'long',
          year: 'numeric'
        });

      default:
        return date.toISOString();
    }
  }
}
