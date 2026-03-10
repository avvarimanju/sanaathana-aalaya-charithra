/**
 * Property-Based Tests for Payment Validation
 * 
 * Tests Property 10 from the design document
 */

import * as fc from 'fast-check';
import { validatePaymentAmount } from '../accessControlService';
import { EntityType } from '../../../types';

// Mock dependencies
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/redis');
jest.mock('../../../utils/logger');
jest.mock('../../pricing-service/pricingService');

// Import mocked pricing service
const pricingService = require('../../pricing-service/pricingService');

describe('Feature: temple-pricing-management - Payment Validation Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 10: Payment Amount Validation
   * 
   * For any payment transaction, if the paid amount does not match the current 
   * price configuration for the entity (within a tolerance of ±1 rupee for rounding), 
   * the Pricing Service should reject the transaction and log a price mismatch error.
   * 
   * **Validates: Requirements 4.4, 4.5**
   */
  describe('Property 10: Payment Amount Validation', () => {
    it('should accept payment within ±1 rupee tolerance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityId: fc.uuid(),
            entityType: fc.constantFrom('TEMPLE' as EntityType, 'GROUP' as EntityType),
            actualPrice: fc.integer({ min: 10, max: 99999 }),
            tolerance: fc.integer({ min: -1, max: 1 }),
          }),
          async (request) => {
            const paidAmount = request.actualPrice + request.tolerance;

            // Mock price configuration
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: request.actualPrice,
              currency: 'INR',
              isFree: false,
            });

            const isValid = await validatePaymentAmount(
              request.entityType,
              request.entityId,
              paidAmount
            );

            // Payment within tolerance should be valid
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject payment outside ±1 rupee tolerance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityId: fc.uuid(),
            entityType: fc.constantFrom('TEMPLE' as EntityType, 'GROUP' as EntityType),
            actualPrice: fc.integer({ min: 10, max: 99999 }),
            difference: fc.integer({ min: 2, max: 1000 }),
            sign: fc.constantFrom(-1, 1),
          }),
          async (request) => {
            const paidAmount = request.actualPrice + (request.difference * request.sign);

            // Mock price configuration
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: request.actualPrice,
              currency: 'INR',
              isFree: false,
            });

            const isValid = await validatePaymentAmount(
              request.entityType,
              request.entityId,
              paidAmount
            );

            // Payment outside tolerance should be invalid
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept exact payment match', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityId: fc.uuid(),
            entityType: fc.constantFrom('TEMPLE' as EntityType, 'GROUP' as EntityType),
            price: fc.integer({ min: 0, max: 99999 }),
          }),
          async (request) => {
            // Mock price configuration
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: request.price,
              currency: 'INR',
              isFree: request.price === 0,
            });

            const isValid = await validatePaymentAmount(
              request.entityType,
              request.entityId,
              request.price
            );

            // Exact match should always be valid
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept zero payment for free entities', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityId: fc.uuid(),
            entityType: fc.constantFrom('TEMPLE' as EntityType, 'GROUP' as EntityType),
          }),
          async (request) => {
            // Mock free price configuration
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: 0,
              currency: 'INR',
              isFree: true,
            });

            const isValid = await validatePaymentAmount(
              request.entityType,
              request.entityId,
              0
            );

            // Zero payment for free entity should be valid
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-zero payment for free entities', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityId: fc.uuid(),
            entityType: fc.constantFrom('TEMPLE' as EntityType, 'GROUP' as EntityType),
            paidAmount: fc.integer({ min: 1, max: 99999 }),
          }),
          async (request) => {
            // Mock free price configuration
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: 0,
              currency: 'INR',
              isFree: true,
            });

            const isValid = await validatePaymentAmount(
              request.entityType,
              request.entityId,
              request.paidAmount
            );

            // Non-zero payment for free entity should be invalid
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept zero payment for entities without price configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityId: fc.uuid(),
            entityType: fc.constantFrom('TEMPLE' as EntityType, 'GROUP' as EntityType),
          }),
          async (request) => {
            // Mock no price configuration
            pricingService.getPriceConfiguration.mockResolvedValue(null);

            const isValid = await validatePaymentAmount(
              request.entityType,
              request.entityId,
              0
            );

            // Zero payment for unpriced entity should be valid
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-zero payment for entities without price configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityId: fc.uuid(),
            entityType: fc.constantFrom('TEMPLE' as EntityType, 'GROUP' as EntityType),
            paidAmount: fc.integer({ min: 1, max: 99999 }),
          }),
          async (request) => {
            // Mock no price configuration
            pricingService.getPriceConfiguration.mockResolvedValue(null);

            const isValid = await validatePaymentAmount(
              request.entityType,
              request.entityId,
              request.paidAmount
            );

            // Non-zero payment for unpriced entity should be invalid
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
