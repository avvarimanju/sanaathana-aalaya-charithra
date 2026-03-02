/**
 * Property-Based Tests for Temple Service
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import * as templeService from '../templeService';
import * as dynamodb from '../../../utils/dynamodb';
import { CreateTempleRequest, AccessMode } from '../../../types';
import { ConflictError } from '../../../utils/errors';

// Mock DynamoDB utilities
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/logger');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;

describe('Temple Service - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 23: Temple Name Uniqueness
   * Validates: Requirements 15.2
   * 
   * For any two temples in the system, they should have different names 
   * (case-insensitive comparison).
   */
  test('Feature: temple-pricing-management, Property 23: Temple name uniqueness', async () => {
    // Custom generator for non-empty strings (no whitespace-only)
    const nonEmptyString = (minLength: number, maxLength: number) =>
      fc
        .string({ minLength, maxLength })
        .filter((s) => s.trim().length > 0)
        .map((s) => s.trim());

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          temple1: fc.record({
            name: nonEmptyString(1, 100),
            location: fc.record({
              state: nonEmptyString(1, 50),
              city: nonEmptyString(1, 50),
              address: nonEmptyString(1, 200),
            }),
            description: nonEmptyString(1, 500),
          }),
          temple2Name: nonEmptyString(1, 100),
        }),
        async (testData) => {
          // Setup: First temple creation succeeds
          mockQueryItems.mockResolvedValueOnce([]); // No existing temples
          mockPutItem.mockResolvedValueOnce(undefined);

          const temple1Request: CreateTempleRequest = {
            name: testData.temple1.name,
            location: testData.temple1.location,
            description: testData.temple1.description,
          };

          const temple1 = await templeService.createTemple(temple1Request, 'admin-123');

          // Attempt to create second temple with same name (case-insensitive)
          const temple2Request: CreateTempleRequest = {
            name: testData.temple1.name, // Same name as temple1
            location: testData.temple1.location,
            description: testData.temple1.description,
          };

          // Mock: Return existing temple with same name
          mockQueryItems.mockResolvedValueOnce([
            {
              templeId: temple1.templeId,
              name: testData.temple1.name,
            } as any,
          ]);

          // Verify: Should throw ConflictError for duplicate name
          await expect(
            templeService.createTemple(temple2Request, 'admin-123')
          ).rejects.toThrow(ConflictError);

          // If temple2Name is different, it should succeed
          if (testData.temple2Name.toLowerCase() !== testData.temple1.name.toLowerCase()) {
            mockQueryItems.mockResolvedValueOnce([]); // No conflict
            mockPutItem.mockResolvedValueOnce(undefined);

            const temple2DifferentRequest: CreateTempleRequest = {
              name: testData.temple2Name,
              location: testData.temple1.location,
              description: testData.temple1.description,
            };

            const temple2 = await templeService.createTemple(
              temple2DifferentRequest,
              'admin-123'
            );

            // Verify: Different names should be allowed
            expect(temple2.name).toBe(testData.temple2Name);
            expect(temple2.name).not.toBe(temple1.name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 24: Temple Creation ID Generation
   * Validates: Requirements 15.3
   * 
   * For any valid temple creation request, the Temple Management Service should 
   * store the temple in DynamoDB and return a unique temple identifier (UUID format).
   */
  test('Feature: temple-pricing-management, Property 24: Temple creation ID generation', async () => {
    // Custom generator for non-empty strings (no whitespace-only)
    const nonEmptyString = (minLength: number, maxLength: number) =>
      fc
        .string({ minLength, maxLength })
        .filter((s) => s.trim().length > 0)
        .map((s) => s.trim());

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: nonEmptyString(1, 100),
          location: fc.record({
            state: nonEmptyString(1, 50),
            city: nonEmptyString(1, 50),
            address: nonEmptyString(1, 200),
          }),
          description: nonEmptyString(1, 500),
          accessMode: fc.constantFrom<AccessMode>('QR_CODE_SCAN', 'OFFLINE_DOWNLOAD', 'HYBRID'),
        }),
        async (templeData) => {
          // Clear mocks for each property test iteration
          jest.clearAllMocks();

          // Setup: Mock successful creation
          mockQueryItems.mockResolvedValue([]); // No name conflicts
          mockPutItem.mockResolvedValue(undefined);

          const request: CreateTempleRequest = {
            name: templeData.name,
            location: templeData.location,
            description: templeData.description,
            accessMode: templeData.accessMode,
          };

          // Execute: Create temple
          const temple = await templeService.createTemple(request, 'admin-123');

          // Verify: Temple ID is generated and is a valid UUID
          expect(temple.templeId).toBeDefined();
          expect(typeof temple.templeId).toBe('string');
          expect(temple.templeId.length).toBeGreaterThan(0);

          // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          expect(temple.templeId).toMatch(uuidRegex);

          // Verify: Temple was stored in DynamoDB
          expect(mockPutItem).toHaveBeenCalledTimes(2); // 1 temple + 1 audit log
          const storedItem = mockPutItem.mock.calls[0][1];
          expect(storedItem.templeId).toBe(temple.templeId);
          expect(storedItem.name).toBe(templeData.name);
          expect(storedItem.accessMode).toBe(templeData.accessMode);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 45: Access Mode Default Value
   * Validates: Requirements 25.5
   * 
   * For any temple creation request that does not explicitly specify an access mode, 
   * the Temple Management Service should store the temple with accessMode set to "HYBRID".
   */
  test('Feature: temple-pricing-management, Property 45: Access mode default value', async () => {
    // Custom generator for non-empty strings (no whitespace-only)
    const nonEmptyString = (minLength: number, maxLength: number) =>
      fc
        .string({ minLength, maxLength })
        .filter((s) => s.trim().length > 0)
        .map((s) => s.trim());

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: nonEmptyString(1, 100),
          location: fc.record({
            state: nonEmptyString(1, 50),
            city: nonEmptyString(1, 50),
            address: nonEmptyString(1, 200),
          }),
          description: nonEmptyString(1, 500),
        }),
        async (templeData) => {
          // Clear mocks for each property test iteration
          jest.clearAllMocks();

          // Setup: Mock successful creation
          mockQueryItems.mockResolvedValue([]); // No name conflicts
          mockPutItem.mockResolvedValue(undefined);

          // Create temple WITHOUT specifying access mode
          const request: CreateTempleRequest = {
            name: templeData.name,
            location: templeData.location,
            description: templeData.description,
            // accessMode is intentionally omitted
          };

          // Execute: Create temple
          const temple = await templeService.createTemple(request, 'admin-123');

          // Verify: Default access mode is HYBRID
          expect(temple.accessMode).toBe('HYBRID');

          // Verify: Temple was stored with HYBRID access mode
          expect(mockPutItem).toHaveBeenCalledTimes(2); // 1 temple + 1 audit log
          const storedItem = mockPutItem.mock.calls[0][1];
          expect(storedItem.accessMode).toBe('HYBRID');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 46: Access Mode Storage
   * Validates: Requirements 25.2, 25.3, 25.4
   * 
   * For any valid access mode value (QR_CODE_SCAN, OFFLINE_DOWNLOAD, or HYBRID), 
   * when an administrator sets a temple's access mode to that value, the Temple 
   * Management Service should store and retrieve the exact same access mode value.
   */
  test('Feature: temple-pricing-management, Property 46: Access mode storage', async () => {
    // Custom generator for non-empty strings (no whitespace-only)
    const nonEmptyString = (minLength: number, maxLength: number) =>
      fc
        .string({ minLength, maxLength })
        .filter((s) => s.trim().length > 0)
        .map((s) => s.trim());

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: nonEmptyString(1, 100),
          location: fc.record({
            state: nonEmptyString(1, 50),
            city: nonEmptyString(1, 50),
            address: nonEmptyString(1, 200),
          }),
          description: nonEmptyString(1, 500),
          accessMode: fc.constantFrom<AccessMode>('QR_CODE_SCAN', 'OFFLINE_DOWNLOAD', 'HYBRID'),
        }),
        async (templeData) => {
          // Clear mocks for each property test iteration
          jest.clearAllMocks();

          // Setup: Mock successful creation
          mockQueryItems.mockResolvedValue([]); // No name conflicts
          mockPutItem.mockResolvedValue(undefined);

          const request: CreateTempleRequest = {
            name: templeData.name,
            location: templeData.location,
            description: templeData.description,
            accessMode: templeData.accessMode,
          };

          // Execute: Create temple with specific access mode
          const createdTemple = await templeService.createTemple(request, 'admin-123');

          // Verify: Created temple has the correct access mode
          expect(createdTemple.accessMode).toBe(templeData.accessMode);

          // Verify: Temple was stored with the correct access mode
          expect(mockPutItem).toHaveBeenCalledTimes(2); // 1 temple + 1 audit log
          const storedItem = mockPutItem.mock.calls[0][1];
          expect(storedItem.accessMode).toBe(templeData.accessMode);

          // Simulate retrieval: Mock getTemple to return the stored temple
          mockGetItem.mockResolvedValue({
            PK: `TEMPLE#${createdTemple.templeId}`,
            SK: 'METADATA',
            templeId: createdTemple.templeId,
            name: templeData.name,
            location: templeData.location,
            description: templeData.description,
            activeArtifactCount: 0,
            accessMode: templeData.accessMode,
            status: 'active',
            createdAt: createdTemple.createdAt,
            createdBy: 'admin-123',
            updatedAt: createdTemple.updatedAt,
            updatedBy: 'admin-123',
            version: 1,
            GSI1PK: 'TEMPLE',
            GSI1SK: `NAME#${templeData.name}`,
            GSI2PK: 'TEMPLE',
            GSI2SK: `ACCESSMODE#${templeData.accessMode}#NAME#${templeData.name}`,
          });

          // Execute: Retrieve temple
          const retrievedTemple = await templeService.getTemple(createdTemple.templeId);

          // Verify: Retrieved temple has the exact same access mode
          expect(retrievedTemple.accessMode).toBe(templeData.accessMode);
          expect(retrievedTemple.accessMode).toBe(createdTemple.accessMode);
        }
      ),
      { numRuns: 100 }
    );
  });
});
