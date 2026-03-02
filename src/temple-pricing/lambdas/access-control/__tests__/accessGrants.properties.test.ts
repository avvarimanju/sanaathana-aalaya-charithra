/**
 * Property-Based Tests for Access Grants
 * 
 * Tests Properties 8, 9, and 55 from the design document
 */

import * as fc from 'fast-check';
import {
  createAccessGrant,
} from '../accessControlService';
import { AccessGrantRequest, EntityType, AccessMode } from '../../../types';
import { putItem, getItem, queryItems, generateTimestamp } from '../../../utils/dynamodb';
import config from '../../../config';

// Mock dependencies
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/redis');
jest.mock('../../../utils/logger');
jest.mock('../../pricing-service/pricingService');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-grant-id-123'),
}));

const mockPutItem = putItem as jest.MockedFunction<typeof putItem>;
const mockGetItem = getItem as jest.MockedFunction<typeof getItem>;
const mockQueryItems = queryItems as jest.MockedFunction<typeof queryItems>;
const mockGenerateTimestamp = generateTimestamp as jest.MockedFunction<typeof generateTimestamp>;

// Import mocked pricing service
const pricingService = require('../../pricing-service/pricingService');

describe('Feature: temple-pricing-management - Access Grant Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock generateTimestamp to return a fixed timestamp
    mockGenerateTimestamp.mockReturnValue('2024-01-01T00:00:00.000Z');
  });

  /**
   * Property 8: Payment-Grant Linkage
   * 
   * For any successful payment transaction, an access grant should be created 
   * with the user ID, entity ID, entity type, payment ID, and paid amount, 
   * and the grant status should be "active".
   * 
   * **Validates: Requirements 4.2**
   */
  describe('Property 8: Payment-Grant Linkage', () => {
    it('should create active access grant with correct data for successful payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            entityId: fc.uuid(),
            entityType: fc.constant('TEMPLE' as EntityType), // Only test temples for simplicity
            paymentId: fc.uuid(),
            paidAmount: fc.integer({ min: 0, max: 99999 }),
            accessMode: fc.constantFrom(
              'QR_CODE_SCAN' as AccessMode,
              'OFFLINE_DOWNLOAD' as AccessMode,
              'HYBRID' as AccessMode
            ),
          }),
          async (request) => {
            // Mock price configuration to match paid amount
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: request.paidAmount,
              currency: 'INR',
              isFree: request.paidAmount === 0,
            });

            // Mock temple/group access mode
            mockGetItem.mockImplementation(async (tableName, _key) => {
              if (tableName === config.tables.temples) {
                return {
                  accessMode: request.accessMode,
                };
              }
              return null;
            });

            // Mock queryItems for group associations (return empty for temples)
            mockQueryItems.mockResolvedValue([]);

            // Mock successful DynamoDB put
            mockPutItem.mockResolvedValue(undefined);

            const grantRequest: AccessGrantRequest = {
              userId: request.userId,
              entityId: request.entityId,
              entityType: request.entityType,
              paymentId: request.paymentId,
              paidAmount: request.paidAmount,
            };

            const grant = await createAccessGrant(grantRequest);

            // Verify grant has correct data
            expect(grant.userId).toBe(request.userId);
            expect(grant.entityId).toBe(request.entityId);
            expect(grant.entityType).toBe(request.entityType);
            expect(grant.paymentId).toBe(request.paymentId);
            expect(grant.paidAmount).toBe(request.paidAmount);
            expect(grant.status).toBe('active');
            expect(grant.grantId).toBeDefined();
            expect(grant.grantedAt).toBeDefined();

            // Verify DynamoDB was called
            expect(mockPutItem).toHaveBeenCalledWith(
              config.tables.accessGrants,
              expect.objectContaining({
                userId: request.userId,
                entityId: request.entityId,
                entityType: request.entityType,
                paymentId: request.paymentId,
                paidAmount: request.paidAmount,
                status: 'active',
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Failed Payment No-Grant
   * 
   * For any failed payment transaction, no access grant should be created 
   * for that user and entity combination with that payment ID.
   * 
   * **Validates: Requirements 4.3**
   */
  describe('Property 9: Failed Payment No-Grant', () => {
    it('should not create access grant when payment amount does not match price', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            entityId: fc.uuid(),
            entityType: fc.constantFrom('TEMPLE' as EntityType, 'GROUP' as EntityType),
            paymentId: fc.uuid(),
            actualPrice: fc.integer({ min: 10, max: 99999 }),
            paidAmount: fc.integer({ min: 0, max: 99999 }),
          }).filter((r) => Math.abs(r.paidAmount - r.actualPrice) > 1), // Ensure mismatch > tolerance
          async (request) => {
            // Mock price configuration with different amount
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: request.actualPrice,
              currency: 'INR',
              isFree: false,
            });

            const grantRequest: AccessGrantRequest = {
              userId: request.userId,
              entityId: request.entityId,
              entityType: request.entityType,
              paymentId: request.paymentId,
              paidAmount: request.paidAmount,
            };

            // Should throw validation error
            await expect(createAccessGrant(grantRequest)).rejects.toThrow();

            // Verify no grant was created in DynamoDB
            expect(mockPutItem).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not create access grant when payment is 0 for non-free entity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            entityId: fc.uuid(),
            entityType: fc.constantFrom('TEMPLE' as EntityType, 'GROUP' as EntityType),
            paymentId: fc.uuid(),
            actualPrice: fc.integer({ min: 10, max: 99999 }),
          }),
          async (request) => {
            // Mock price configuration with non-zero amount
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: request.actualPrice,
              currency: 'INR',
              isFree: false,
            });

            const grantRequest: AccessGrantRequest = {
              userId: request.userId,
              entityId: request.entityId,
              entityType: request.entityType,
              paymentId: request.paymentId,
              paidAmount: 0, // Failed payment - no amount paid
            };

            // Should throw validation error
            await expect(createAccessGrant(grantRequest)).rejects.toThrow();

            // Verify no grant was created in DynamoDB
            expect(mockPutItem).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 55: Offline Download Permission in Access Grants
   * 
   * For any access grant created for a temple with OFFLINE_DOWNLOAD or HYBRID 
   * access mode, the access grant should have offlineDownloadPermission set to true.
   * 
   * **Validates: Requirements 34.1**
   */
  describe('Property 55: Offline Download Permission in Access Grants', () => {
    it('should set offlineDownloadPermission to true for OFFLINE_DOWNLOAD mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            entityId: fc.uuid(),
            entityType: fc.constant('TEMPLE' as EntityType), // Only test temples for simplicity
            paymentId: fc.uuid(),
            paidAmount: fc.integer({ min: 0, max: 99999 }),
          }),
          async (request) => {
            // Mock price configuration
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: request.paidAmount,
              currency: 'INR',
              isFree: request.paidAmount === 0,
            });

            // Mock temple with OFFLINE_DOWNLOAD mode
            mockGetItem.mockImplementation(async (tableName, _key) => {
              if (tableName === config.tables.temples) {
                return {
                  accessMode: 'OFFLINE_DOWNLOAD' as AccessMode,
                };
              }
              return null;
            });

            // Mock queryItems for group associations (return empty for temples)
            mockQueryItems.mockResolvedValue([]);

            mockPutItem.mockResolvedValue(undefined);

            const grantRequest: AccessGrantRequest = {
              userId: request.userId,
              entityId: request.entityId,
              entityType: request.entityType,
              paymentId: request.paymentId,
              paidAmount: request.paidAmount,
            };

            const grant = await createAccessGrant(grantRequest);

            // Verify offline download permission is true
            expect(grant.offlineDownloadPermission).toBe(true);
            expect(grant.accessMode).toBe('OFFLINE_DOWNLOAD');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set offlineDownloadPermission to true for HYBRID mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            entityId: fc.uuid(),
            entityType: fc.constant('TEMPLE' as EntityType), // Only test temples for simplicity
            paymentId: fc.uuid(),
            paidAmount: fc.integer({ min: 0, max: 99999 }),
          }),
          async (request) => {
            // Mock price configuration
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: request.paidAmount,
              currency: 'INR',
              isFree: request.paidAmount === 0,
            });

            // Mock temple with HYBRID mode
            mockGetItem.mockImplementation(async (tableName, _key) => {
              if (tableName === config.tables.temples) {
                return {
                  accessMode: 'HYBRID' as AccessMode,
                };
              }
              return null;
            });

            // Mock queryItems for group associations (return empty for temples)
            mockQueryItems.mockResolvedValue([]);

            mockPutItem.mockResolvedValue(undefined);

            const grantRequest: AccessGrantRequest = {
              userId: request.userId,
              entityId: request.entityId,
              entityType: request.entityType,
              paymentId: request.paymentId,
              paidAmount: request.paidAmount,
            };

            const grant = await createAccessGrant(grantRequest);

            // Verify offline download permission is true
            expect(grant.offlineDownloadPermission).toBe(true);
            expect(grant.accessMode).toBe('HYBRID');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set offlineDownloadPermission to false for QR_CODE_SCAN mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            entityId: fc.uuid(),
            entityType: fc.constant('TEMPLE' as EntityType), // Only test temples for simplicity
            paymentId: fc.uuid(),
            paidAmount: fc.integer({ min: 0, max: 99999 }),
          }),
          async (request) => {
            // Mock price configuration
            pricingService.getPriceConfiguration.mockResolvedValue({
              entityId: request.entityId,
              entityType: request.entityType,
              priceAmount: request.paidAmount,
              currency: 'INR',
              isFree: request.paidAmount === 0,
            });

            // Mock temple with QR_CODE_SCAN mode
            mockGetItem.mockImplementation(async (tableName, _key) => {
              if (tableName === config.tables.temples) {
                return {
                  accessMode: 'QR_CODE_SCAN' as AccessMode,
                };
              }
              return null;
            });

            // Mock queryItems for group associations (return empty for temples)
            mockQueryItems.mockResolvedValue([]);

            mockPutItem.mockResolvedValue(undefined);

            const grantRequest: AccessGrantRequest = {
              userId: request.userId,
              entityId: request.entityId,
              entityType: request.entityType,
              paymentId: request.paymentId,
              paidAmount: request.paidAmount,
            };

            const grant = await createAccessGrant(grantRequest);

            // Verify offline download permission is false
            expect(grant.offlineDownloadPermission).toBe(false);
            expect(grant.accessMode).toBe('QR_CODE_SCAN');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
