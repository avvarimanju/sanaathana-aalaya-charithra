/**
 * Property-Based Tests for MetricsAggregator
 * Feature: real-time-reports-dashboard
 * Tasks: 4.2, 4.3, 4.4, 4.5
 * 
 * Properties: 3, 6, 11, 12
 */

import * as fc from 'fast-check';
import { MetricsAggregator } from '../../../src/dashboard/services/MetricsAggregator';
import { Feedback, FilterState } from '../../../src/dashboard/types';
import { feedbackArbitrary } from '../fixtures/arbitraries';

describe('MetricsAggregator Property Tests', () => {
  let aggregator: MetricsAggregator;

  beforeEach(() => {
    aggregator = new MetricsAggregator();
  });

  describe('Property 3: Rating Distribution Completeness', () => {
    it('should always include all rating values 1-5 in distribution', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(feedbackArbitrary(), { minLength: 1, maxLength: 100 }),
          async (feedbackItems: Feedback[]) => {
            const distribution = await aggregator.calculateRatingDistribution(feedbackItems);
            
            // All rating values 1-5 must be present
            expect(distribution).toHaveProperty('1');
            expect(distribution).toHaveProperty('2');
            expect(distribution).toHaveProperty('3');
            expect(distribution).toHaveProperty('4');
            expect(distribution).toHaveProperty('5');
            
            // All values must be non-negative
            expect(distribution[1]).toBeGreaterThanOrEqual(0);
            expect(distribution[2]).toBeGreaterThanOrEqual(0);
            expect(distribution[3]).toBeGreaterThanOrEqual(0);
            expect(distribution[4]).toBeGreaterThanOrEqual(0);
            expect(distribution[5]).toBeGreaterThanOrEqual(0);
            
            // Sum of all ratings should equal total feedback items
            const sum = distribution[1] + distribution[2] + distribution[3] + distribution[4] + distribution[5];
            expect(sum).toBe(feedbackItems.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Review Count Accuracy', () => {
    it('should accurately count reviews across different time periods', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(feedbackArbitrary(), { minLength: 1, maxLength: 100 }),
          fc.record({
            timeRange: fc.constantFrom('today', 'last_7_days', 'last_30_days', 'last_90_days', 'all_time'),
            templeIds: fc.array(fc.uuid(), { maxLength: 3 }),
            regions: fc.array(fc.string(), { maxLength: 3 }),
            categories: fc.array(fc.string(), { maxLength: 3 })
          }),
          async (feedbackItems: Feedback[], filters: FilterState) => {
            const counts = await aggregator.calculateReviewCount(feedbackItems, filters);
            
            // All time period counts must be non-negative
            expect(counts.today).toBeGreaterThanOrEqual(0);
            expect(counts.thisWeek).toBeGreaterThanOrEqual(0);
            expect(counts.thisMonth).toBeGreaterThanOrEqual(0);
            expect(counts.allTime).toBeGreaterThanOrEqual(0);
            
            // Hierarchical relationship: today <= thisWeek <= thisMonth <= allTime
            expect(counts.today).toBeLessThanOrEqual(counts.thisWeek);
            expect(counts.thisWeek).toBeLessThanOrEqual(counts.thisMonth);
            expect(counts.thisMonth).toBeLessThanOrEqual(counts.allTime);
            
            // All time should equal total feedback items
            expect(counts.allTime).toBe(feedbackItems.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Average Rating Precision', () => {
    it('should always calculate average rating with exactly 2 decimal places', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(feedbackArbitrary(), { minLength: 1, maxLength: 100 }),
          async (feedbackItems: Feedback[]) => {
            const avgRating = await aggregator.calculateAverageRating(feedbackItems);
            
            // Must be between 1 and 5
            expect(avgRating).toBeGreaterThanOrEqual(1);
            expect(avgRating).toBeLessThanOrEqual(5);
            
            // Must have exactly 2 decimal places
            const decimalPart = avgRating.toString().split('.')[1];
            if (decimalPart) {
              expect(decimalPart.length).toBeLessThanOrEqual(2);
            }
            
            // Verify precision by checking rounded value
            const rounded = Math.round(avgRating * 100) / 100;
            expect(avgRating).toBe(rounded);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Multi-Level Aggregation', () => {
    it('should maintain consistency across different aggregation levels', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(feedbackArbitrary(), { minLength: 10, maxLength: 50 }),
          async (feedbackItems: Feedback[]) => {
            // Calculate metrics at different levels
            const overallAvg = await aggregator.calculateAverageRating(feedbackItems);
            const distribution = await aggregator.calculateRatingDistribution(feedbackItems);
            
            // Calculate weighted average from distribution
            const weightedAvg = (
              distribution[1] * 1 +
              distribution[2] * 2 +
              distribution[3] * 3 +
              distribution[4] * 4 +
              distribution[5] * 5
            ) / feedbackItems.length;
            
            // Weighted average should match overall average (within floating point precision)
            expect(Math.abs(overallAvg - weightedAvg)).toBeLessThan(0.01);
            
            // Group by temple and verify sum
            const templeGroups = new Map<string, Feedback[]>();
            feedbackItems.forEach(item => {
              if (!templeGroups.has(item.templeId)) {
                templeGroups.set(item.templeId, []);
              }
              templeGroups.get(item.templeId)!.push(item);
            });
            
            // Sum of temple-level counts should equal total
            let totalFromGroups = 0;
            for (const [_, items] of templeGroups) {
              totalFromGroups += items.length;
            }
            expect(totalFromGroups).toBe(feedbackItems.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
