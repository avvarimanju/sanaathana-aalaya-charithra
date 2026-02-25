/**
 * DashboardService
 * Feature: real-time-reports-dashboard
 * 
 * Core service for querying and aggregating dashboard data.
 * Orchestrates FeedbackRepository, CacheService, and MetricsAggregator
 * to provide high-level dashboard functionality with caching support.
 * 
 * Validates: Requirements 1.1, 2.1, 4.1, 5.1, 6.1, 7.1, 7.2, 10.1, 10.3
 */

import {
  DashboardData,
  FilterState,
  PaginatedReviews,
  Comment,
  CommentType,
  AggregatedMetrics,
  VisualizationData,
  TimeSeriesData,
  BarChartData,
  HistogramData,
  Feedback,
  UserRole
} from '../types';
import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { CacheService } from './CacheService';
import { MetricsAggregator, TrendGranularity } from './MetricsAggregator';
import { CACHE_TTL } from '../constants';

export class DashboardService {
  constructor(
    private feedbackRepository: FeedbackRepository,
    private cacheService: CacheService,
    private metricsAggregator: MetricsAggregator
  ) {}

  /**
   * Get complete dashboard data with caching
   * Requirement 10.3: Cache aggregated metrics for 30 seconds to reduce database load
   * Requirement 10.1: Dashboard SHALL load initial data within 3 seconds
   * 
   * @param filters Filter criteria for dashboard data
   * @param userId User ID for audit logging
   * @param userRole User role for authorization
   * @param userRegion User's region (for regional managers)
   * @returns Complete dashboard data including metrics, reviews, comments, and visualizations
   */
  async getDashboardData(
    filters: FilterState,
    userId: string,
    userRole: UserRole,
    userRegion?: string
  ): Promise<DashboardData> {
    // Apply regional filtering for regional managers
    const effectiveFilters = this.applyRoleBasedFiltering(filters, userRole, userRegion);

    // Generate cache key based on filters
    const cacheKey = this.generateCacheKey('dashboard:data', effectiveFilters);

    // Try to get from cache first
    const cachedData = await this.cacheService.get<DashboardData>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Cache miss - fetch from database and calculate
    const feedbackItems = await this.fetchAllFeedback(effectiveFilters);

    // Calculate metrics
    const metrics = await this.calculateMetrics(feedbackItems, effectiveFilters);

    // Get reviews (limited to first 50 for initial load)
    const reviews = await this.feedbackRepository.getReviews(effectiveFilters, 1, 50);

    // Get comments (limited to first 100 for initial load)
    const comments = await this.feedbackRepository.getComments(effectiveFilters);

    // Generate visualizations
    const visualizations = await this.generateVisualizations(feedbackItems, effectiveFilters);

    const dashboardData: DashboardData = {
      metrics,
      reviews: reviews.reviews,
      comments: comments.slice(0, 100),
      visualizations
    };

    // Cache the result
    await this.cacheService.set(cacheKey, dashboardData, CACHE_TTL.DASHBOARD_DATA);

    return dashboardData;
  }

  /**
   * Get reviews with pagination
   * Requirement 2.4: Support pagination when more than 50 reviews exist
   * Requirement 2.3: Display reviews in reverse chronological order (newest first)
   * 
   * @param filters Filter criteria
   * @param page Page number (1-indexed)
   * @param pageSize Number of items per page
   * @returns Paginated reviews
   */
  async getReviews(
    filters: FilterState,
    page: number = 1,
    pageSize: number = 50,
    userRole?: UserRole,
    userRegion?: string
  ): Promise<PaginatedReviews> {
    // Apply regional filtering for regional managers
    const effectiveFilters = this.applyRoleBasedFiltering(filters, userRole, userRegion);

    // Generate cache key
    const cacheKey = this.generateCacheKey(`dashboard:reviews:${page}:${pageSize}`, effectiveFilters);

    // Try cache first
    const cachedReviews = await this.cacheService.get<PaginatedReviews>(cacheKey);
    if (cachedReviews) {
      return cachedReviews;
    }

    // Fetch from repository
    const reviews = await this.feedbackRepository.getReviews(effectiveFilters, page, pageSize);

    // Cache the result
    await this.cacheService.set(cacheKey, reviews, CACHE_TTL.REVIEWS);

    return reviews;
  }

  /**
   * Get comments with filtering
   * Requirement 6.4: Support filtering comments by type (general, suggestion, complaint)
   * Requirement 6.5: Support searching comments by keyword
   * 
   * @param filters Filter criteria
   * @param commentType Optional comment type filter
   * @param searchKeyword Optional keyword search
   * @returns Filtered comments
   */
  async getComments(
    filters: FilterState,
    commentType?: CommentType,
    searchKeyword?: string,
    userRole?: UserRole,
    userRegion?: string
  ): Promise<Comment[]> {
    // Apply regional filtering for regional managers
    const effectiveFilters = this.applyRoleBasedFiltering(filters, userRole, userRegion);

    // Generate cache key
    const cacheKey = this.generateCacheKey(
      `dashboard:comments:${commentType || 'all'}:${searchKeyword || 'none'}`,
      effectiveFilters
    );

    // Try cache first
    const cachedComments = await this.cacheService.get<Comment[]>(cacheKey);
    if (cachedComments) {
      return cachedComments;
    }

    // Fetch from repository
    const comments = await this.feedbackRepository.getComments(
      effectiveFilters,
      commentType,
      searchKeyword
    );

    // Cache the result
    await this.cacheService.set(cacheKey, comments, CACHE_TTL.COMMENTS);

    return comments;
  }

  /**
   * Get aggregated metrics
   * Requirement 4.1: Calculate and display average rating
   * Requirement 5.1: Display total review count
   * 
   * @param filters Filter criteria
   * @returns Aggregated metrics
   */
  async getMetrics(
    filters: FilterState,
    userRole?: UserRole,
    userRegion?: string
  ): Promise<AggregatedMetrics> {
    // Apply regional filtering for regional managers
    const effectiveFilters = this.applyRoleBasedFiltering(filters, userRole, userRegion);

    // Generate cache key
    const cacheKey = this.generateCacheKey('dashboard:metrics', effectiveFilters);

    // Try cache first
    const cachedMetrics = await this.cacheService.get<AggregatedMetrics>(cacheKey);
    if (cachedMetrics) {
      return cachedMetrics;
    }

    // Fetch feedback and calculate metrics
    const feedbackItems = await this.fetchAllFeedback(effectiveFilters);
    const metrics = await this.calculateMetrics(feedbackItems, effectiveFilters);

    // Cache the result
    await this.cacheService.set(cacheKey, metrics, CACHE_TTL.METRICS);

    return metrics;
  }

  /**
   * Get visualization data
   * Requirement 11.1: Display line chart showing rating trends over time
   * Requirement 11.2: Display pie chart showing sentiment distribution
   * Requirement 11.3: Display bar chart showing review count by temple
   * Requirement 11.4: Display histogram showing rating distribution
   * 
   * @param filters Filter criteria
   * @param granularity Time granularity for trend chart
   * @returns Visualization data
   */
  async getVisualizations(
    filters: FilterState,
    granularity: TrendGranularity = 'day',
    userRole?: UserRole,
    userRegion?: string
  ): Promise<VisualizationData> {
    // Apply regional filtering for regional managers
    const effectiveFilters = this.applyRoleBasedFiltering(filters, userRole, userRegion);

    // Generate cache key
    const cacheKey = this.generateCacheKey(`dashboard:visualizations:${granularity}`, effectiveFilters);

    // Try cache first
    const cachedViz = await this.cacheService.get<VisualizationData>(cacheKey);
    if (cachedViz) {
      return cachedViz;
    }

    // Fetch feedback and generate visualizations
    const feedbackItems = await this.fetchAllFeedback(effectiveFilters);
    const visualizations = await this.generateVisualizations(feedbackItems, effectiveFilters, granularity);

    // Cache the result
    await this.cacheService.set(cacheKey, visualizations, CACHE_TTL.VISUALIZATIONS);

    return visualizations;
  }

  /**
   * Invalidate cache for specific feedback item
   * Called when new feedback is submitted or updated
   * 
   * @param feedbackId Feedback item ID
   * @param templeId Temple ID
   */
  async invalidateCacheForFeedback(feedbackId: string, templeId: string): Promise<void> {
    await this.cacheService.invalidateForFeedback(feedbackId, templeId);
  }

  /**
   * Fetch all feedback items matching filters
   * Private helper method
   */
  private async fetchAllFeedback(filters: FilterState): Promise<Feedback[]> {
    const allFeedback: Feedback[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;
    let hasMore = true;

    // Fetch all pages
    while (hasMore) {
      const result = await this.feedbackRepository.queryFeedback(filters, {
        limit: 100,
        lastEvaluatedKey
      });

      allFeedback.push(...result.items);
      lastEvaluatedKey = result.lastEvaluatedKey;
      hasMore = lastEvaluatedKey !== undefined;

      // Safety limit to prevent infinite loops
      if (allFeedback.length > 100000) {
        console.warn('Reached maximum feedback item limit (100,000)');
        break;
      }
    }

    return allFeedback;
  }

  /**
   * Calculate aggregated metrics from feedback items
   * Private helper method
   */
  private async calculateMetrics(
    feedbackItems: Feedback[],
    filters: FilterState
  ): Promise<AggregatedMetrics> {
    const averageRating = await this.metricsAggregator.calculateAverageRating(feedbackItems);
    const sentimentDistribution = await this.metricsAggregator.calculateSentimentDistribution(feedbackItems);
    const reviewCount = await this.metricsAggregator.calculateReviewCount(feedbackItems, filters);
    const ratingDistribution = await this.metricsAggregator.calculateRatingDistribution(feedbackItems);

    // Generate metric ID based on filters
    const metricId = this.generateMetricId(filters);

    return {
      metricId,
      metricType: 'dashboard_summary',
      averageRating,
      totalReviews: reviewCount.allTime,
      totalComments: feedbackItems.filter(item => item.commentText).length,
      sentimentDistribution,
      ratingDistribution,
      calculatedAt: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days from now
    };
  }

  /**
   * Generate visualization data from feedback items
   * Private helper method
   */
  private async generateVisualizations(
    feedbackItems: Feedback[],
    filters: FilterState,
    granularity: TrendGranularity = 'day'
  ): Promise<VisualizationData> {
    // Rating trend over time
    const ratingTrend = await this.metricsAggregator.calculateRatingTrend(
      feedbackItems,
      filters,
      granularity
    );

    // Sentiment distribution (pie chart)
    const sentimentPie = await this.metricsAggregator.calculateSentimentDistribution(feedbackItems);

    // Reviews by temple (bar chart)
    const reviewsByTemple = this.calculateReviewsByTemple(feedbackItems);

    // Rating distribution (histogram)
    const ratingDistribution = await this.metricsAggregator.calculateRatingDistribution(feedbackItems);
    const ratingHistogram = this.convertRatingDistributionToHistogram(ratingDistribution);

    return {
      ratingTrend,
      sentimentPie,
      reviewsByTemple,
      ratingHistogram
    };
  }

  /**
   * Calculate reviews grouped by temple
   * Private helper method
   */
  private calculateReviewsByTemple(feedbackItems: Feedback[]): BarChartData[] {
    const templeMap = new Map<string, number>();

    feedbackItems
      .filter(item => item.reviewText && item.reviewText.trim().length > 0)
      .forEach(item => {
        const count = templeMap.get(item.templeId) || 0;
        templeMap.set(item.templeId, count + 1);
      });

    const barChartData: BarChartData[] = [];
    templeMap.forEach((count, templeId) => {
      barChartData.push({
        label: templeId, // Will be replaced with temple name by frontend
        value: count,
        metadata: { templeId }
      });
    });

    // Sort by count descending
    barChartData.sort((a, b) => b.value - a.value);

    return barChartData;
  }

  /**
   * Convert rating distribution to histogram format
   * Private helper method
   */
  private convertRatingDistributionToHistogram(
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number }
  ): HistogramData[] {
    return [
      { bin: 1, count: distribution[1] },
      { bin: 2, count: distribution[2] },
      { bin: 3, count: distribution[3] },
      { bin: 4, count: distribution[4] },
      { bin: 5, count: distribution[5] }
    ];
  }

  /**
   * Apply role-based filtering
   * Requirement 12.4: Support role-based data filtering
   * Private helper method
   */
  private applyRoleBasedFiltering(
    filters: FilterState,
    userRole?: UserRole,
    userRegion?: string
  ): FilterState {
    // Regional managers can only see data from their region
    if (userRole === 'regional_manager' && userRegion) {
      return {
        ...filters,
        regions: [userRegion]
      };
    }

    return filters;
  }

  /**
   * Generate cache key from filters
   * Private helper method
   */
  private generateCacheKey(prefix: string, filters: FilterState): string {
    const parts = [
      prefix,
      filters.timeRange,
      filters.templeIds.sort().join(',') || 'all',
      filters.regions.sort().join(',') || 'all',
      filters.categories.sort().join(',') || 'all'
    ];

    return parts.join(':');
  }

  /**
   * Generate metric ID from filters
   * Private helper method
   */
  private generateMetricId(filters: FilterState): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const templeId = filters.templeIds.length === 1 ? filters.templeIds[0] : 'all';
    return `${templeId}:${date}`;
  }
}
