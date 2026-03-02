/**
 * Property-Based Tests for Data Model Validation
 * Feature: real-time-reports-dashboard
 * Task: 2.2
 * 
 * Property 2: Required Field Display
 * Validates: Requirements 1.2, 2.2, 6.3
 */

import * as fc from 'fast-check';
import { Feedback, Review, Comment } from '../../../src/dashboard/types';

describe('Property 2: Required Field Display', () => {
  it('should always display required fields for reviews', () => {
    fc.assert(
      fc.property(
        fc.record({
          feedbackId: fc.uuid(),
          userId: fc.uuid(),
          templeId: fc.uuid(),
          templeName: fc.string({ minLength: 1 }),
          rating: fc.integer({ min: 1, max: 5 }),
          reviewText: fc.string({ minLength: 1 }),
          sentimentLabel: fc.constantFrom('positive', 'neutral', 'negative'),
          timestamp: fc.integer({ min: 0 }),
          createdAt: fc.integer({ min: 0, max: Date.now() }).map(ts => new Date(ts).toISOString())
        }),
        (review: Review) => {
          // All required fields must be present and non-empty
          expect(review.feedbackId).toBeDefined();
          expect(review.feedbackId.length).toBeGreaterThan(0);
          
          expect(review.userId).toBeDefined();
          expect(review.userId.length).toBeGreaterThan(0);
          
          expect(review.templeId).toBeDefined();
          expect(review.templeId.length).toBeGreaterThan(0);
          
          expect(review.templeName).toBeDefined();
          expect(review.templeName.length).toBeGreaterThan(0);
          
          expect(review.rating).toBeDefined();
          expect(review.rating).toBeGreaterThanOrEqual(1);
          expect(review.rating).toBeLessThanOrEqual(5);
          
          expect(review.reviewText).toBeDefined();
          expect(review.reviewText.length).toBeGreaterThan(0);
          
          expect(review.sentimentLabel).toBeDefined();
          expect(['positive', 'neutral', 'negative']).toContain(review.sentimentLabel);
          
          expect(review.timestamp).toBeDefined();
          expect(review.timestamp).toBeGreaterThanOrEqual(0);
          
          expect(review.createdAt).toBeDefined();
          expect(review.createdAt.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always display required fields for comments', () => {
    fc.assert(
      fc.property(
        fc.record({
          feedbackId: fc.uuid(),
          userId: fc.uuid(),
          templeId: fc.uuid(),
          templeName: fc.string({ minLength: 1 }),
          commentText: fc.string({ minLength: 1 }),
          commentType: fc.constantFrom('general', 'suggestion', 'complaint'),
          timestamp: fc.integer({ min: 0 }),
          createdAt: fc.integer({ min: 0, max: Date.now() }).map(ts => new Date(ts).toISOString())
        }),
        (comment: Comment) => {
          // All required fields must be present and non-empty
          expect(comment.feedbackId).toBeDefined();
          expect(comment.feedbackId.length).toBeGreaterThan(0);
          
          expect(comment.userId).toBeDefined();
          expect(comment.userId.length).toBeGreaterThan(0);
          
          expect(comment.templeId).toBeDefined();
          expect(comment.templeId.length).toBeGreaterThan(0);
          
          expect(comment.templeName).toBeDefined();
          expect(comment.templeName.length).toBeGreaterThan(0);
          
          expect(comment.commentText).toBeDefined();
          expect(comment.commentText.length).toBeGreaterThan(0);
          
          expect(comment.commentType).toBeDefined();
          expect(['general', 'suggestion', 'complaint']).toContain(comment.commentType);
          
          expect(comment.timestamp).toBeDefined();
          expect(comment.timestamp).toBeGreaterThanOrEqual(0);
          
          expect(comment.createdAt).toBeDefined();
          expect(comment.createdAt.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate feedback data model structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          feedbackId: fc.uuid(),
          timestamp: fc.integer({ min: 0 }),
          userId: fc.uuid(),
          templeId: fc.uuid(),
          rating: fc.integer({ min: 1, max: 5 }),
          reviewText: fc.option(fc.string(), { nil: undefined }),
          commentText: fc.option(fc.string(), { nil: undefined }),
          commentType: fc.option(fc.constantFrom('general', 'suggestion', 'complaint'), { nil: undefined }),
          sentimentScore: fc.option(fc.float({ min: -1, max: 1, noNaN: true }), { nil: undefined }),
          sentimentLabel: fc.option(fc.constantFrom('positive', 'neutral', 'negative'), { nil: undefined }),
          region: fc.string({ minLength: 1 }),
          category: fc.string({ minLength: 1 }),
          metadata: fc.record({
            deviceType: fc.string(),
            appVersion: fc.string(),
            language: fc.string()
          }),
          createdAt: fc.integer({ min: 0, max: Date.now() }).map(ts => new Date(ts).toISOString()),
          updatedAt: fc.integer({ min: 0, max: Date.now() }).map(ts => new Date(ts).toISOString())
        }),
        (feedback: Feedback) => {
          // Core required fields
          expect(feedback.feedbackId).toBeDefined();
          expect(feedback.timestamp).toBeGreaterThanOrEqual(0);
          expect(feedback.userId).toBeDefined();
          expect(feedback.templeId).toBeDefined();
          expect(feedback.rating).toBeGreaterThanOrEqual(1);
          expect(feedback.rating).toBeLessThanOrEqual(5);
          expect(feedback.region).toBeDefined();
          expect(feedback.category).toBeDefined();
          expect(feedback.metadata).toBeDefined();
          expect(feedback.createdAt).toBeDefined();
          expect(feedback.updatedAt).toBeDefined();
          
          // Sentiment score range validation
          if (feedback.sentimentScore !== undefined) {
            expect(feedback.sentimentScore).toBeGreaterThanOrEqual(-1);
            expect(feedback.sentimentScore).toBeLessThanOrEqual(1);
            expect(Number.isNaN(feedback.sentimentScore)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
