/**
 * Property-Based Tests for Price History
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import {
  setPriceConfiguration,
  getPriceHistory,
} from '../pricingService';
import { PriceConfigRequest, EntityType } from '../../../types';
import * as dynamodb from '../../../utils/dynamodb';
import * as redisCache from '../../../utils/redis';

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
jest.mock('../../../utils/redis');
jest.mock('../../../utils/logger');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;

describe('Price History - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redis cache methods
    jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
    jest.spyOn(redisCache.default, 'set').mockResolvedValue(undefined);
    jest.spyOn(redisCache.default, 'del').mockResolvedValue(undefined);
    jest.spyOn(redisCache.default, 'generatePriceKey').mockReturnValue('price:TEMPLE:test-id');
  });

  /**
   * Property 3: Price History Preservation
   * Validates: Requirements 1.7, 7.2
   * 
   * For any sequence of price configuration changes for an entity, the system should
   * preserve a complete history of all previous prices with their effective dates,
   * end dates, and administrator IDs.
   */
  test('Feature: temple-pricing-management, Property 3: Price history preservation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityId: fc.uuid(),
          entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
          priceChanges: fc.array(
            fc.record({
              priceAmount: fc.integer({ min: 0, max: 99999 }),
              adminUserId: fc.uuid(),
            }),
            { minLength: 2, maxLength: 5 }
          ),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();
          jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
          jest.spyOn(redisCache.default, 'set').mockResolvedValue(undefined);
          jest.spyOn(redisCache.default, 'del').mockResolvedValue(undefined);

          const historyEntries: any[] = [];
          let currentConfig: any = null;

          // Apply each price change
          for (let i = 0; i < testData.priceChanges.length; i++) {
            const change = testData.priceChanges[i];

            // Mock getItem to return current config (or null for first iteration)
            mockGetItem.mockResolvedValue(currentConfig);

            // Mock putItem for both current config and history
            mockPutItem.mockResolvedValue(undefined);

            const request: PriceConfigRequest = {
              entityId: testData.entityId,
              entityType: testData.entityType,
              priceAmount: change.priceAmount,
            };

            const result = await setPriceConfiguration(request, change.adminUserId);

            // If there was a previous config, it should have been archived
            if (currentConfig) {
              historyEntries.push(currentConfig);
            }

            // Update current config for next iteration
            currentConfig = {
              PK: `PRICE#${testData.entityType}#${testData.entityId}`,
              SK: 'CURRENT',
              entityId: testData.entityId,
              entityType: testData.entityType,
              priceAmount: change.priceAmount,
              currency: 'INR',
              isFree: change.priceAmount === 0,
              effectiveDate: result.effectiveDate,
              setBy: change.adminUserId,
              isOverride: false,
              createdAt: currentConfig?.createdAt || result.createdAt,
              updatedAt: result.updatedAt,
              version: (currentConfig?.version || 0) + 1,
            };
          }

          // Verify that putItem was called for each price change
          // Each change creates 2 putItem calls: 1 for history (if not first), 1 for current
          const expectedPutItemCalls = testData.priceChanges.length + (testData.priceChanges.length - 1);
          expect(mockPutItem).toHaveBeenCalledTimes(expectedPutItemCalls);

          // Verify history entries were created
          const historyPutCalls = mockPutItem.mock.calls.filter(
            (call) => call[1].SK && call[1].SK.startsWith('HISTORY#')
          );
          expect(historyPutCalls).toHaveLength(testData.priceChanges.length - 1);

          // Verify each history entry has required fields
          historyPutCalls.forEach((call) => {
            const historyItem = call[1];
            expect(historyItem.entityId).toBe(testData.entityId);
            expect(historyItem.entityType).toBe(testData.entityType);
            expect(historyItem.priceAmount).toBeDefined();
            expect(historyItem.effectiveDate).toBeDefined();
            expect(historyItem.endDate).toBeDefined();
            expect(historyItem.setBy).toBeDefined();
            expect(historyItem.GSI1PK).toBe(`HISTORY#${testData.entityType}#${testData.entityId}`);
            expect(historyItem.GSI1SK).toMatch(/^DATE#/);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 14: Price History Chronological Ordering
   * Validates: Requirements 7.1
   * 
   * For any entity with price history, when retrieving the history, the system should
   * return entries in chronological order with the most recent price first.
   */
  test('Feature: temple-pricing-management, Property 14: Price history chronological ordering', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityId: fc.uuid(),
          entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
          historyCount: fc.integer({ min: 2, max: 10 }),
        }),
        async (testData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();

          // Generate history entries with timestamps
          const baseTime = new Date('2024-01-01T00:00:00.000Z').getTime();
          const historyItems = Array.from({ length: testData.historyCount }, (_, i) => {
            const timestamp = new Date(baseTime + i * 86400000).toISOString(); // 1 day apart
            return {
              PK: `PRICE#${testData.entityType}#${testData.entityId}`,
              SK: `HISTORY#${timestamp}`,
              entityId: testData.entityId,
              entityType: testData.entityType,
              priceAmount: 100 + i * 10,
              currency: 'INR',
              effectiveDate: timestamp,
              endDate: new Date(baseTime + (i + 1) * 86400000).toISOString(),
              setBy: `admin-${i}`,
              isOverride: false,
              createdAt: timestamp,
              GSI1PK: `HISTORY#${testData.entityType}#${testData.entityId}`,
              GSI1SK: `DATE#${timestamp}`,
            };
          });

          // Mock queryItems to return history in reverse chronological order
          // (simulating ScanIndexForward: false)
          mockQueryItems.mockResolvedValue([...historyItems].reverse());

          const result = await getPriceHistory(testData.entityType, testData.entityId);

          // Verify results are in chronological order (most recent first)
          expect(result).toHaveLength(testData.historyCount);
          
          for (let i = 0; i < result.length - 1; i++) {
            const current = new Date(result[i].effectiveDate).getTime();
            const next = new Date(result[i + 1].effectiveDate).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }

          // Verify queryItems was called with ScanIndexForward: false
          expect(mockQueryItems).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.any(Object),
            undefined,
            false // ScanIndexForward: false for reverse chronological order
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 15: Price History Date Range Filtering
   * Validates: Requirements 7.3
   * 
   * For any entity with price history and any valid date range, the system should
   * return only the price history entries that fall within the specified date range.
   */
  test('Feature: temple-pricing-management, Property 15: Price history date range filtering', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityId: fc.uuid(),
          entityType: fc.constantFrom<EntityType>('TEMPLE', 'GROUP'),
          startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
          endDate: fc.date({ min: new Date('2024-06-02'), max: new Date('2024-12-31') }),
        }),
        async (testData) => {
          // Ensure startDate < endDate
          fc.pre(testData.startDate < testData.endDate);

          // Clear mocks for each iteration
          jest.clearAllMocks();

          const startDateISO = testData.startDate.toISOString();
          const endDateISO = testData.endDate.toISOString();

          // Generate history entries: some within range, some outside
          const allHistoryItems = [
            // Before range
            {
              PK: `PRICE#${testData.entityType}#${testData.entityId}`,
              SK: 'HISTORY#2023-12-01T00:00:00.000Z',
              entityId: testData.entityId,
              entityType: testData.entityType,
              priceAmount: 50,
              currency: 'INR',
              effectiveDate: '2023-12-01T00:00:00.000Z',
              endDate: '2023-12-31T23:59:59.999Z',
              setBy: 'admin-1',
              isOverride: false,
              createdAt: '2023-12-01T00:00:00.000Z',
              GSI1PK: `HISTORY#${testData.entityType}#${testData.entityId}`,
              GSI1SK: 'DATE#2023-12-01T00:00:00.000Z',
            },
            // Within range
            {
              PK: `PRICE#${testData.entityType}#${testData.entityId}`,
              SK: `HISTORY#${startDateISO}`,
              entityId: testData.entityId,
              entityType: testData.entityType,
              priceAmount: 100,
              currency: 'INR',
              effectiveDate: startDateISO,
              endDate: endDateISO,
              setBy: 'admin-2',
              isOverride: false,
              createdAt: startDateISO,
              GSI1PK: `HISTORY#${testData.entityType}#${testData.entityId}`,
              GSI1SK: `DATE#${startDateISO}`,
            },
            // After range
            {
              PK: `PRICE#${testData.entityType}#${testData.entityId}`,
              SK: 'HISTORY#2025-01-01T00:00:00.000Z',
              entityId: testData.entityId,
              entityType: testData.entityType,
              priceAmount: 200,
              currency: 'INR',
              effectiveDate: '2025-01-01T00:00:00.000Z',
              endDate: '2025-01-31T23:59:59.999Z',
              setBy: 'admin-3',
              isOverride: false,
              createdAt: '2025-01-01T00:00:00.000Z',
              GSI1PK: `HISTORY#${testData.entityType}#${testData.entityId}`,
              GSI1SK: 'DATE#2025-01-01T00:00:00.000Z',
            },
          ];

          // Mock queryItems to return only items within range
          const itemsWithinRange = allHistoryItems.filter((item) => {
            const itemDate = new Date(item.effectiveDate);
            return itemDate >= testData.startDate && itemDate <= testData.endDate;
          });

          mockQueryItems.mockResolvedValue(itemsWithinRange);

          const result = await getPriceHistory(testData.entityType, testData.entityId, {
            startDate: startDateISO,
            endDate: endDateISO,
          });

          // Verify only items within range are returned
          expect(result.length).toBeLessThanOrEqual(allHistoryItems.length);
          
          result.forEach((item) => {
            const itemDate = new Date(item.effectiveDate);
            expect(itemDate.getTime()).toBeGreaterThanOrEqual(testData.startDate.getTime());
            expect(itemDate.getTime()).toBeLessThanOrEqual(testData.endDate.getTime());
          });

          // Verify queryItems was called with date range parameters
          expect(mockQueryItems).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('BETWEEN'),
            expect.objectContaining({
              ':startDate': `DATE#${startDateISO}`,
              ':endDate': `DATE#${endDateISO}`,
            }),
            'GSI1',
            false
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});
