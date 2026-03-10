/**
 * Property-Based Tests for Formula Validation
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import {
  setPricingFormula,
} from '../priceCalculatorService';
import * as dynamodb from '../../../utils/dynamodb';
import { ValidationError } from '../../../utils/errors';

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

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;

describe('Formula Validation - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 30: Formula Validation
   * **Validates: Requirements 19.2**
   * 
   * For any pricing formula submission, if either the base price or per-QR-code price
   * is negative, the system should reject it with a validation error.
   */
  test('Property 30: Formula validation rejects negative prices', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          category: fc.constantFrom('DEFAULT', 'PREMIUM', 'BASIC'),
          basePrice: fc.integer({ min: -10000, max: -1 }),
          perQRCodePrice: fc.integer({ min: 0, max: 1000 }),
          roundingRule: fc.record({
            type: fc.constantFrom<'none' | 'nearest10' | 'nearest99' | 'nearest100'>('none', 'nearest10', 'nearest99', 'nearest100'),
            direction: fc.constantFrom<'up' | 'down' | 'nearest'>('up', 'down', 'nearest'),
          }),
          discountFactor: fc.double({ min: 0, max: 1 }),
          adminUserId: fc.uuid(),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();

          // Attempt to set formula with negative base price
          await expect(
            setPricingFormula(
              testData.category,
              testData.basePrice,
              testData.perQRCodePrice,
              testData.roundingRule,
              testData.discountFactor,
              testData.adminUserId
            )
          ).rejects.toThrow(ValidationError);

          // Verify putItem was never called
          expect(mockPutItem).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 30: Formula validation rejects negative per-QR-code price', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          category: fc.constantFrom('DEFAULT', 'PREMIUM', 'BASIC'),
          basePrice: fc.integer({ min: 0, max: 1000 }),
          perQRCodePrice: fc.integer({ min: -1000, max: -1 }),
          roundingRule: fc.record({
            type: fc.constantFrom<'none' | 'nearest10' | 'nearest99' | 'nearest100'>('none', 'nearest10', 'nearest99', 'nearest100'),
            direction: fc.constantFrom<'up' | 'down' | 'nearest'>('up', 'down', 'nearest'),
          }),
          discountFactor: fc.double({ min: 0, max: 1 }),
          adminUserId: fc.uuid(),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();

          // Attempt to set formula with negative per-QR-code price
          await expect(
            setPricingFormula(
              testData.category,
              testData.basePrice,
              testData.perQRCodePrice,
              testData.roundingRule,
              testData.discountFactor,
              testData.adminUserId
            )
          ).rejects.toThrow(ValidationError);

          // Verify putItem was never called
          expect(mockPutItem).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 30: Formula validation accepts non-negative prices', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          category: fc.constantFrom('DEFAULT', 'PREMIUM', 'BASIC'),
          basePrice: fc.integer({ min: 0, max: 1000 }),
          perQRCodePrice: fc.integer({ min: 0, max: 500 }),
          roundingRule: fc.record({
            type: fc.constantFrom<'none' | 'nearest10' | 'nearest99' | 'nearest100'>('none', 'nearest10', 'nearest99', 'nearest100'),
            direction: fc.constantFrom<'up' | 'down' | 'nearest'>('up', 'down', 'nearest'),
          }),
          discountFactor: fc.double({ min: 0, max: 1, noNaN: true }),
          adminUserId: fc.uuid(),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();

          // Mock no existing formula
          mockGetItem.mockResolvedValue(null);

          // Mock successful storage
          mockPutItem.mockResolvedValue(undefined);

          // Set formula with non-negative prices
          const formula = await setPricingFormula(
            testData.category,
            testData.basePrice,
            testData.perQRCodePrice,
            testData.roundingRule,
            testData.discountFactor,
            testData.adminUserId
          );

          // Verify formula was created successfully
          expect(formula).toBeDefined();
          expect(formula.basePrice).toBe(testData.basePrice);
          expect(formula.perQRCodePrice).toBe(testData.perQRCodePrice);
          expect(formula.category).toBe(testData.category);
          expect(formula.setBy).toBe(testData.adminUserId);

          // Verify putItem was called
          expect(mockPutItem).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
