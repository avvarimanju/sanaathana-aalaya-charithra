/**
 * Property-Based Tests for Price Calculation
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import {
  calculateSuggestedPrice,
  applyRoundingRules,
} from '../priceCalculatorService';
import { EntityType, RoundingRule } from '../../../types';
import * as dynamodb from '../../../utils/dynamodb';

// Mock dependencies
jest.mock('../../../utils/dynamodb', () => {
  const actual = jest.requireActual<typeof import('../../../utils/dynamodb')>('../../../utils/dynamodb');
  return {
    ...actual,
    putItem: jest.fn(),
    getItem: jest.fn(),
    queryItems: jest.fn(),
  };
});
jest.mock('../../../utils/logger');

const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;

describe('Price Calculation - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 31: Suggested Price Calculation
   * **Validates: Requirements 20.1**
   * 
   * For any temple with N active QR codes, given a pricing formula with base price B
   * and per-QR-code price P, the calculated suggested price should equal B + (N × P)
   * before applying rounding rules.
   */
  test('Property 31: Suggested price calculation formula', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityId: fc.uuid(),
          entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
          qrCodeCount: fc.integer({ min: 0, max: 100 }),
          basePrice: fc.integer({ min: 0, max: 500 }),
          perQRCodePrice: fc.integer({ min: 0, max: 100 }),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();

          // Mock formula retrieval
          mockGetItem.mockResolvedValue({
            formulaId: 'test-formula-id',
            category: 'DEFAULT',
            basePrice: testData.basePrice,
            perQRCodePrice: testData.perQRCodePrice,
            roundingRule: { type: 'none', direction: 'nearest' },
            discountFactor: 0,
            isActive: true,
            effectiveDate: '2024-01-01T00:00:00Z',
            setBy: 'admin',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            version: 1,
          });

          // Calculate suggested price
          const suggestedPrice = await calculateSuggestedPrice(
            testData.entityType,
            testData.entityId,
            testData.qrCodeCount,
            'DEFAULT'
          );

          // Verify the formula: B + (N × P)
          const expectedRawPrice = testData.basePrice + (testData.qrCodeCount * testData.perQRCodePrice);
          
          expect(suggestedPrice.rawPrice).toBe(expectedRawPrice);
          expect(suggestedPrice.basePrice).toBe(testData.basePrice);
          expect(suggestedPrice.perQRCodePrice).toBe(testData.perQRCodePrice);
          expect(suggestedPrice.qrCodeCount).toBe(testData.qrCodeCount);
          expect(suggestedPrice.entityId).toBe(testData.entityId);
          expect(suggestedPrice.entityType).toBe(testData.entityType);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 32: Rounding Rule Application
   * **Validates: Requirements 20.3**
   * 
   * For any calculated price that requires rounding according to the configured rounding
   * rules, the Price Calculator should apply the rules correctly and return both the raw
   * calculated price and the rounded price.
   */
  test('Property 32: Rounding to nearest 10 (up)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (price) => {
          const roundingRule: RoundingRule = { type: 'nearest10', direction: 'up' };
          const rounded = applyRoundingRules(price, roundingRule);
          
          // Verify rounded price is a multiple of 10
          expect(rounded % 10).toBe(0);
          
          // Verify rounded price is >= original price (rounding up)
          expect(rounded).toBeGreaterThanOrEqual(price);
          
          // Verify rounded price is within 10 of original
          expect(rounded - price).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 32: Rounding to nearest 10 (down)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (price) => {
          const roundingRule: RoundingRule = { type: 'nearest10', direction: 'down' };
          const rounded = applyRoundingRules(price, roundingRule);
          
          // Verify rounded price is a multiple of 10
          expect(rounded % 10).toBe(0);
          
          // Verify rounded price is <= original price (rounding down)
          expect(rounded).toBeLessThanOrEqual(price);
          
          // Verify rounded price is within 10 of original
          expect(price - rounded).toBeLessThan(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 32: Rounding to nearest 99', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 10000 }),
        (price) => {
          const roundingRule: RoundingRule = { type: 'nearest99', direction: 'nearest' };
          const rounded = applyRoundingRules(price, roundingRule);
          
          // Verify rounded price ends in 99 (e.g., 99, 199, 299, etc.)
          expect(rounded % 100).toBe(99);
          
          // Verify rounded price is within 50 of original (nearest)
          expect(Math.abs(rounded - price)).toBeLessThanOrEqual(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 32: Rounding to nearest 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (price) => {
          const roundingRule: RoundingRule = { type: 'nearest100', direction: 'nearest' };
          const rounded = applyRoundingRules(price, roundingRule);
          
          // Verify rounded price is a multiple of 100
          expect(rounded % 100).toBe(0);
          
          // Verify rounded price is within 50 of original (nearest)
          expect(Math.abs(rounded - price)).toBeLessThanOrEqual(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 32: No rounding preserves original price', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        (price) => {
          const roundingRule: RoundingRule = { type: 'none', direction: 'nearest' };
          const rounded = applyRoundingRules(price, roundingRule);
          
          // Verify price is unchanged
          expect(rounded).toBe(price);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 33: Suggested Price Recalculation on Count Change
   * **Validates: Requirements 20.7**
   * 
   * For any temple, when the active QR code count changes (due to artifact addition or
   * deletion), the suggested price should be automatically recalculated using the current
   * pricing formula.
   */
  test('Property 33: Price recalculation reflects QR code count changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityId: fc.uuid(),
          entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
          initialQRCount: fc.integer({ min: 5, max: 50 }), // Start with higher count to avoid negatives
          qrCountChange: fc.integer({ min: -4, max: 10 }), // Smaller negative changes
          basePrice: fc.integer({ min: 50, max: 200 }),
          perQRCodePrice: fc.integer({ min: 10, max: 50 }),
        }),
        async (testData) => {
          // Ensure final count is non-negative
          const finalQRCount = Math.max(0, testData.initialQRCount + testData.qrCountChange);
          
          // Skip if both counts are the same (no change to test)
          if (testData.initialQRCount === finalQRCount) {
            return true;
          }
          
          // Clear mocks for each iteration
          jest.clearAllMocks();

          // Mock formula retrieval
          const mockFormula = {
            formulaId: 'test-formula-id',
            category: 'DEFAULT',
            basePrice: testData.basePrice,
            perQRCodePrice: testData.perQRCodePrice,
            roundingRule: { type: 'none', direction: 'nearest' },
            discountFactor: 0,
            isActive: true,
            effectiveDate: '2024-01-01T00:00:00Z',
            setBy: 'admin',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            version: 1,
          };

          // Calculate initial suggested price
          mockGetItem.mockResolvedValue(mockFormula);
          const initialPrice = await calculateSuggestedPrice(
            testData.entityType,
            testData.entityId,
            testData.initialQRCount,
            'DEFAULT'
          );

          // Calculate new suggested price after count change
          mockGetItem.mockResolvedValue(mockFormula);
          const newPrice = await calculateSuggestedPrice(
            testData.entityType,
            testData.entityId,
            finalQRCount,
            'DEFAULT'
          );

          // Verify price difference matches the formula
          const actualCountChange = finalQRCount - testData.initialQRCount;
          const expectedPriceDifference = actualCountChange * testData.perQRCodePrice;
          const actualPriceDifference = newPrice.rawPrice - initialPrice.rawPrice;
          
          expect(actualPriceDifference).toBe(expectedPriceDifference);
          
          // Verify new price uses correct QR count
          expect(newPrice.qrCodeCount).toBe(finalQRCount);
          expect(newPrice.rawPrice).toBe(testData.basePrice + (finalQRCount * testData.perQRCodePrice));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
