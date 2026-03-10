/**
 * Property-Based Tests for Price Storage and Validation
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import {
  setPriceConfiguration,
  getPriceConfiguration,
} from '../pricingService';
import { PriceConfigRequest, EntityType } from '../../../types';
import * as dynamodb from '../../../utils/dynamodb';
import * as redisCache from '../../../utils/redis';
import { ValidationError } from '../../../utils/errors';

// Mock dependencies
jest.mock('../../../utils/dynamodb', () => {
  const actual = jest.requireActual<typeof import('../../../utils/dynamodb')>('../../../utils/dynamodb');
  return {
    ...actual,
    putItem: jest.fn(),
    getItem: jest.fn(),
    queryItems: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
  };
});
jest.mock('../../../utils/redis');
jest.mock('../../../utils/logger');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;

describe('Price Storage and Validation - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redis cache methods
    jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
    jest.spyOn(redisCache.default, 'set').mockResolvedValue(undefined);
    jest.spyOn(redisCache.default, 'del').mockResolvedValue(undefined);
    jest.spyOn(redisCache.default, 'generatePriceKey').mockReturnValue('price:TEMPLE:test-id');
  });

  /**
   * Property 1: Valid Price Storage
   * Validates: Requirements 1.3, 1.4, 6.1, 6.2, 6.4
   * 
   * For any valid price configuration with a price amount between 0 and 99999 rupees,
   * when stored by the Pricing Service, the price should be retrievable with the exact
   * same amount, currency (INR), and metadata (timestamp, administrator ID).
   */
  test('Feature: temple-pricing-management, Property 1: Valid price storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityId: fc.uuid(),
          entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
          priceAmount: fc.integer({ min: 0, max: 99999 }),
          adminUserId: fc.uuid(),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();
          jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
          jest.spyOn(redisCache.default, 'set').mockResolvedValue(undefined);
          jest.spyOn(redisCache.default, 'del').mockResolvedValue(undefined);
          jest.spyOn(redisCache.default, 'generatePriceKey').mockReturnValue(
            `price:${testData.entityType}:${testData.entityId}`
          );

          const request: PriceConfigRequest = {
            entityId: testData.entityId,
            entityType: testData.entityType,
            priceAmount: testData.priceAmount,
          };

          // Mock successful storage
          mockPutItem.mockResolvedValue(undefined);

          // Store the price configuration
          const storedConfig = await setPriceConfiguration(request, testData.adminUserId);

          // Verify stored configuration has correct values
          expect(storedConfig.entityId).toBe(testData.entityId);
          expect(storedConfig.entityType).toBe(testData.entityType);
          expect(storedConfig.priceAmount).toBe(testData.priceAmount);
          expect(storedConfig.currency).toBe('INR');
          expect(storedConfig.setBy).toBe(testData.adminUserId);
          expect(storedConfig.isFree).toBe(testData.priceAmount === 0);

          // Verify timestamps are present and valid
          expect(storedConfig.effectiveDate).toBeDefined();
          expect(typeof storedConfig.effectiveDate).toBe('string');
          expect(storedConfig.createdAt).toBeDefined();
          expect(typeof storedConfig.createdAt).toBe('string');
          expect(storedConfig.updatedAt).toBeDefined();
          expect(typeof storedConfig.updatedAt).toBe('string');

          // Mock retrieval
          const dbItem = {
            PK: `PRICE#${testData.entityType}#${testData.entityId}`,
            SK: 'CURRENT',
            entityId: testData.entityId,
            entityType: testData.entityType,
            priceAmount: testData.priceAmount,
            currency: 'INR',
            isFree: testData.priceAmount === 0,
            effectiveDate: storedConfig.effectiveDate,
            setBy: testData.adminUserId,
            isOverride: false,
            createdAt: storedConfig.createdAt,
            updatedAt: storedConfig.updatedAt,
            version: 1,
          };

          mockGetItem.mockResolvedValue(dbItem);

          // Retrieve the price configuration
          const retrievedConfig = await getPriceConfiguration(
            testData.entityType,
            testData.entityId
          );

          // Verify retrieved configuration matches stored configuration
          expect(retrievedConfig).not.toBeNull();
          expect(retrievedConfig!.entityId).toBe(testData.entityId);
          expect(retrievedConfig!.entityType).toBe(testData.entityType);
          expect(retrievedConfig!.priceAmount).toBe(testData.priceAmount);
          expect(retrievedConfig!.currency).toBe('INR');
          expect(retrievedConfig!.setBy).toBe(testData.adminUserId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Negative Price Rejection
   * Validates: Requirements 1.4, 9.1
   * 
   * For any price configuration with a negative price amount, the Pricing Service
   * should reject it with a validation error and not store it in the database.
   */
  test('Feature: temple-pricing-management, Property 2: Negative price rejection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityId: fc.uuid(),
          entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
          priceAmount: fc.integer({ min: -100000, max: -1 }),
          adminUserId: fc.uuid(),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();

          const request: PriceConfigRequest = {
            entityId: testData.entityId,
            entityType: testData.entityType,
            priceAmount: testData.priceAmount,
          };

          // Attempt to store negative price
          await expect(
            setPriceConfiguration(request, testData.adminUserId)
          ).rejects.toThrow(ValidationError);

          // Verify that putItem was never called (price was not stored)
          expect(mockPutItem).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 12: Pricing Independence
   * Validates: Requirements 6.1, 6.2
   * 
   * For any two distinct pricing entities, setting or modifying the price configuration
   * for one entity should not change the price configuration of the other entity.
   */
  test('Feature: temple-pricing-management, Property 12: Pricing independence', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entity1: fc.record({
            entityId: fc.uuid(),
            entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
            priceAmount: fc.integer({ min: 0, max: 99999 }),
          }),
          entity2: fc.record({
            entityId: fc.uuid(),
            entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
            priceAmount: fc.integer({ min: 0, max: 99999 }),
          }),
          adminUserId: fc.uuid(),
        }),
        async (testData) => {
          // Ensure entities are distinct
          fc.pre(testData.entity1.entityId !== testData.entity2.entityId);

          // Clear mocks for each iteration
          jest.clearAllMocks();
          
          // Mock getItem to return null (no existing config) for both entities
          mockGetItem.mockResolvedValue(null);
          
          jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
          jest.spyOn(redisCache.default, 'set').mockResolvedValue(undefined);
          jest.spyOn(redisCache.default, 'del').mockResolvedValue(undefined);

          // Mock storage for both entities
          mockPutItem.mockResolvedValue(undefined);

          // Store price for entity 1
          const request1: PriceConfigRequest = {
            entityId: testData.entity1.entityId,
            entityType: testData.entity1.entityType,
            priceAmount: testData.entity1.priceAmount,
          };

          const config1 = await setPriceConfiguration(request1, testData.adminUserId);

          // Store price for entity 2
          const request2: PriceConfigRequest = {
            entityId: testData.entity2.entityId,
            entityType: testData.entity2.entityType,
            priceAmount: testData.entity2.priceAmount,
          };

          const config2 = await setPriceConfiguration(request2, testData.adminUserId);

          // Verify both configurations are independent
          expect(config1.entityId).toBe(testData.entity1.entityId);
          expect(config1.priceAmount).toBe(testData.entity1.priceAmount);
          expect(config2.entityId).toBe(testData.entity2.entityId);
          expect(config2.priceAmount).toBe(testData.entity2.priceAmount);

          // Verify putItem was called twice (once for each entity, no history since they're new)
          expect(mockPutItem).toHaveBeenCalledTimes(2);
          
          // Get the actual arguments passed to putItem
          const call1Args = mockPutItem.mock.calls[0];
          const call2Args = mockPutItem.mock.calls[1];
          
          // The second argument contains the item data
          const item1 = call1Args[1];
          const item2 = call2Args[1];
          
          // Verify different partition keys (different entities)
          expect(item1.PK).toBeDefined();
          expect(item2.PK).toBeDefined();
          expect(item1.PK).not.toBe(item2.PK);
          expect(item1.entityId).toBe(testData.entity1.entityId);
          expect(item2.entityId).toBe(testData.entity2.entityId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Price Range Validation
   * Validates: Requirements 6.4, 9.1, 9.4
   * 
   * For any price configuration, if the price amount is less than 0 or greater than 99999,
   * the system should reject it with a validation error; if the price amount is between
   * 0 and 99999 inclusive, the system should accept it.
   */
  test('Feature: temple-pricing-management, Property 13: Price range validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityId: fc.uuid(),
          entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
          priceAmount: fc.integer({ min: -10000, max: 110000 }),
          adminUserId: fc.uuid(),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();
          
          // Mock getItem to return null (no existing config)
          mockGetItem.mockResolvedValue(null);
          
          jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
          jest.spyOn(redisCache.default, 'set').mockResolvedValue(undefined);
          jest.spyOn(redisCache.default, 'del').mockResolvedValue(undefined);

          const request: PriceConfigRequest = {
            entityId: testData.entityId,
            entityType: testData.entityType,
            priceAmount: testData.priceAmount,
          };

          if (testData.priceAmount < 0 || testData.priceAmount > 99999) {
            // Price outside valid range should be rejected
            await expect(
              setPriceConfiguration(request, testData.adminUserId)
            ).rejects.toThrow(ValidationError);

            // Verify that putItem was never called
            expect(mockPutItem).not.toHaveBeenCalled();
          } else {
            // Price within valid range should be accepted
            mockPutItem.mockResolvedValue(undefined);

            const config = await setPriceConfiguration(request, testData.adminUserId);

            expect(config.priceAmount).toBe(testData.priceAmount);
            // Should be called once for new price (no history since it's new)
            expect(mockPutItem).toHaveBeenCalledTimes(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 17: Non-Numeric Input Rejection
   * Validates: Requirements 9.4, 12.1
   * 
   * For any price configuration input that contains non-numeric values,
   * the system should reject it with a validation error.
   */
  test('Feature: temple-pricing-management, Property 17: Non-numeric input rejection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityId: fc.uuid(),
          entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
          invalidPrice: fc.oneof(
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
            fc.constant(undefined as any),
            fc.constant(null as any),
            fc.constant('100' as any),
            fc.constant('abc' as any),
            fc.constant({} as any),
            fc.constant([] as any),
          ),
          adminUserId: fc.uuid(),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();

          const request: PriceConfigRequest = {
            entityId: testData.entityId,
            entityType: testData.entityType,
            priceAmount: testData.invalidPrice,
          };

          // Attempt to store invalid price
          await expect(
            setPriceConfiguration(request, testData.adminUserId)
          ).rejects.toThrow(ValidationError);

          // Verify that putItem was never called
          expect(mockPutItem).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });
});
