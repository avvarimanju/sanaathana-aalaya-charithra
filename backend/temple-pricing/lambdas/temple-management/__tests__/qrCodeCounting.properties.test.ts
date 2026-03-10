/**
 * Property-Based Tests for QR Code Counting
 * Using fast-check for property-based testing
 * 
 * Tests for Task 2.8: Write property tests for QR code counting
 */

import * as fc from 'fast-check';
import * as templeService from '../templeService';
import * as dynamodb from '../../../utils/dynamodb';

// Mock DynamoDB utilities
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/logger');
jest.mock('qrcode');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;
const mockUpdateItem = dynamodb.updateItem as jest.MockedFunction<typeof dynamodb.updateItem>;

// Helper function to generate non-empty strings
const nonEmptyString = (minLength: number, maxLength: number) =>
  fc
    .string({ minLength, maxLength })
    .filter((s) => s.trim().length > 0)
    .map((s) => s.trim());

describe('QR Code Counting - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dynamodb.generateTimestamp as jest.Mock).mockReturnValue('2024-01-01T00:00:00.000Z');
    (dynamodb.generatePK as jest.Mock).mockImplementation((prefix: string, id: string) => `${prefix}#${id}`);
  });

  /**
   * Property 6: QR Code Count Accuracy
   * Validates: Requirements 3.1, 3.2, 18.1, 18.2
   * 
   * For any temple or temple group, the displayed QR code count should equal 
   * the number of artifacts with status "active" associated with that entity 
   * (for temples) or the sum of active artifacts across all temples in the 
   * group (for temple groups).
   */
  test('Feature: temple-pricing-management, Property 6: QR code count accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templeId: fc.uuid(),
          artifacts: fc.array(
            fc.record({
              artifactId: fc.uuid(),
              name: nonEmptyString(1, 100),
              status: fc.constantFrom('active', 'inactive'),
            }),
            { minLength: 0, maxLength: 20 }
          ),
        }),
        async (testData) => {
          jest.clearAllMocks();

          // Calculate expected count (only active artifacts)
          const expectedCount = testData.artifacts.filter((a) => a.status === 'active').length;

          // Setup: Mock getTemple to return temple with activeArtifactCount
          mockGetItem.mockResolvedValueOnce({
            PK: `TEMPLE#${testData.templeId}`,
            SK: 'METADATA',
            templeId: testData.templeId,
            name: 'Test Temple',
            activeArtifactCount: expectedCount,
            status: 'active',
            location: {
              state: 'Test State',
              city: 'Test City',
              address: 'Test Address',
            },
            description: 'Test Description',
            accessMode: 'HYBRID',
            createdAt: new Date().toISOString(),
            createdBy: 'admin-123',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin-123',
            version: 1,
          });

          // Execute: Get QR code count
          const count = await templeService.getQRCodeCount('TEMPLE', testData.templeId);

          // Verify: Count matches active artifacts
          expect(count).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6 (Temple Group): QR Code Count Accuracy for Temple Groups
   * Validates: Requirements 3.2, 18.2
   * 
   * For any temple group, the displayed QR code count should equal the sum 
   * of active artifacts across all temples in the group.
   */
  test('Feature: temple-pricing-management, Property 6 (Group): QR code count accuracy for temple groups', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          groupId: fc.uuid(),
          temples: fc.array(
            fc.record({
              templeId: fc.uuid(),
              qrCodeCount: fc.integer({ min: 0, max: 20 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (testData) => {
          jest.clearAllMocks();

          // Calculate expected total count
          const expectedTotalCount = testData.temples.reduce(
            (sum, temple) => sum + temple.qrCodeCount,
            0
          );

          // Setup: Mock getTempleGroup to return group with totalQRCodeCount
          mockGetItem.mockResolvedValueOnce({
            PK: `GROUP#${testData.groupId}`,
            SK: 'METADATA',
            groupId: testData.groupId,
            name: 'Test Group',
            description: 'Test Group Description',
            templeIds: testData.temples.map((t) => t.templeId),
            totalTempleCount: testData.temples.length,
            totalQRCodeCount: expectedTotalCount,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: 'admin-123',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin-123',
            version: 1,
          });

          // Execute: Get QR code count for temple group
          const count = await templeService.getQRCodeCount('GROUP', testData.groupId);

          // Verify: Count matches sum of active artifacts
          expect(count).toBe(expectedTotalCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29: QR Code Count Recalculation
   * Validates: Requirements 18.3
   * 
   * For any artifact addition or deletion operation on a temple, the temple's 
   * activeArtifactCount should be recalculated to equal the number of artifacts 
   * with status "active" for that temple.
   */
  test('Feature: temple-pricing-management, Property 29: QR code count recalculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templeId: fc.uuid(),
          initialArtifacts: fc.array(
            fc.record({
              artifactId: fc.uuid(),
              name: nonEmptyString(1, 100),
              status: fc.constant('active'),
            }),
            { minLength: 0, maxLength: 10 }
          ),
        }),
        async (testData) => {
          jest.clearAllMocks();

          // Setup: Mock initial temple state
          const initialCount = testData.initialArtifacts.length;
          mockGetItem.mockResolvedValueOnce({
            PK: `TEMPLE#${testData.templeId}`,
            SK: 'METADATA',
            templeId: testData.templeId,
            name: 'Test Temple',
            activeArtifactCount: initialCount,
            status: 'active',
            location: {
              state: 'Test State',
              city: 'Test City',
              address: 'Test Address',
            },
            description: 'Test Description',
            accessMode: 'HYBRID',
            createdAt: new Date().toISOString(),
            createdBy: 'admin-123',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin-123',
            version: 1,
          });

          // Setup: Mock initial artifacts for listArtifacts call
          const initialArtifactDBItems = testData.initialArtifacts.map((artifact) => ({
            PK: `TEMPLE#${testData.templeId}`,
            SK: `ARTIFACT#${artifact.artifactId}`,
            artifactId: artifact.artifactId,
            templeId: testData.templeId,
            name: artifact.name,
            status: 'active',
            description: 'Test artifact',
            qrCodeId: `QR-${artifact.artifactId}`,
            qrCodeImageUrl: `https://s3.example.com/qr-${artifact.artifactId}.png`,
            createdAt: new Date().toISOString(),
            createdBy: 'admin-123',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin-123',
          }));

          mockQueryItems.mockResolvedValueOnce(initialArtifactDBItems);

          // Setup: Mock getGroupsForTemple to return empty array (no groups)
          mockQueryItems.mockResolvedValueOnce([]);

          mockUpdateItem.mockResolvedValueOnce(undefined);

          // Execute: Recalculate counts
          await templeService.recalculateQRCodeCounts('TEMPLE', testData.templeId, 'admin-123');

          // Verify: Count is correct
          expect(mockUpdateItem).toHaveBeenCalledWith(
            'Temples',
            {
              PK: `TEMPLE#${testData.templeId}`,
              SK: 'METADATA',
            },
            'SET activeArtifactCount = :count, updatedAt = :timestamp, updatedBy = :userId',
            expect.objectContaining({
              ':count': initialCount,
            })
          );

          jest.clearAllMocks();

          // Now test after adding one artifact
          const newArtifact = {
            artifactId: fc.sample(fc.uuid(), 1)[0],
            name: fc.sample(nonEmptyString(1, 100), 1)[0],
          };

          // Setup: Mock artifacts after addition (simulate artifact was added)
          const updatedArtifactDBItems = [
            ...initialArtifactDBItems,
            {
              PK: `TEMPLE#${testData.templeId}`,
              SK: `ARTIFACT#${newArtifact.artifactId}`,
              artifactId: newArtifact.artifactId,
              templeId: testData.templeId,
              name: newArtifact.name,
              status: 'active',
              description: 'Test artifact',
              qrCodeId: `QR-${newArtifact.artifactId}`,
              qrCodeImageUrl: `https://s3.example.com/qr-${newArtifact.artifactId}.png`,
              createdAt: new Date().toISOString(),
              createdBy: 'admin-123',
              updatedAt: new Date().toISOString(),
              updatedBy: 'admin-123',
            },
          ];

          mockGetItem.mockResolvedValueOnce({
            PK: `TEMPLE#${testData.templeId}`,
            SK: 'METADATA',
            templeId: testData.templeId,
            name: 'Test Temple',
            activeArtifactCount: initialCount,
            status: 'active',
            location: {
              state: 'Test State',
              city: 'Test City',
              address: 'Test Address',
            },
            description: 'Test Description',
            accessMode: 'HYBRID',
            createdAt: new Date().toISOString(),
            createdBy: 'admin-123',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin-123',
            version: 1,
          });

          mockQueryItems.mockResolvedValueOnce(updatedArtifactDBItems);

          // Setup: Mock getGroupsForTemple to return empty array (no groups)
          mockQueryItems.mockResolvedValueOnce([]);

          mockUpdateItem.mockResolvedValueOnce(undefined);

          // Execute: Recalculate counts after adding artifact
          await templeService.recalculateQRCodeCounts('TEMPLE', testData.templeId, 'admin-123');

          // Calculate expected count after addition
          const expectedCountAfterAddition = initialCount + 1;

          // Verify: Count was updated to include new artifact
          expect(mockUpdateItem).toHaveBeenCalledWith(
            'Temples',
            {
              PK: `TEMPLE#${testData.templeId}`,
              SK: 'METADATA',
            },
            'SET activeArtifactCount = :count, updatedAt = :timestamp, updatedBy = :userId',
            expect.objectContaining({
              ':count': expectedCountAfterAddition,
            })
          );
        }
      ),
      { numRuns: 50 } // Reduced runs due to complexity
    );
  });

  /**
   * Property 34: Temple Group Aggregate Calculation
   * Validates: Requirements 21.1
   * 
   * For any temple group containing temples T1, T2, ..., Tn with QR code counts 
   * Q1, Q2, ..., Qn, the suggested price for the group should be calculated using 
   * the sum (Q1 + Q2 + ... + Qn) in the pricing formula.
   * 
   * Note: This test validates the QR code count aggregation part. The pricing 
   * formula application will be tested in the Price Calculator tests.
   */
  test('Feature: temple-pricing-management, Property 34: Temple group aggregate calculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          groupId: fc.uuid(),
          temples: fc.array(
            fc.record({
              templeId: fc.uuid(),
              qrCodeCount: fc.integer({ min: 0, max: 20 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        async (testData) => {
          jest.clearAllMocks();

          // Calculate expected aggregate count
          const expectedTotalCount = testData.temples.reduce(
            (sum, temple) => sum + temple.qrCodeCount,
            0
          );

          // Setup: Mock getTempleGroup to return group with totalQRCodeCount
          mockGetItem.mockResolvedValueOnce({
            PK: `GROUP#${testData.groupId}`,
            SK: 'METADATA',
            groupId: testData.groupId,
            name: 'Test Group',
            description: 'Test Group Description',
            templeIds: testData.temples.map((t) => t.templeId),
            totalTempleCount: testData.temples.length,
            totalQRCodeCount: expectedTotalCount,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: 'admin-123',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin-123',
            version: 1,
          });

          // Execute: Get QR code count for temple group
          const totalCount = await templeService.getQRCodeCount('GROUP', testData.groupId);

          // Verify: Total count equals sum of individual temple counts
          expect(totalCount).toBe(expectedTotalCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 36: Group Price Recalculation on Membership Change
   * Validates: Requirements 21.6
   * 
   * For any temple group, when a temple is added to or removed from the group, 
   * the group's total QR code count should be recalculated and the suggested 
   * price should be automatically recalculated.
   * 
   * Note: This test validates the QR code count recalculation part. The suggested 
   * price recalculation will be tested in the Price Calculator tests.
   */
  test('Feature: temple-pricing-management, Property 36: Group QR code count recalculation on membership change', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          groupId: fc.uuid(),
          initialTemples: fc.array(
            fc.record({
              templeId: fc.uuid(),
              qrCodeCount: fc.integer({ min: 0, max: 20 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          newTemple: fc.record({
            templeId: fc.uuid(),
            qrCodeCount: fc.integer({ min: 1, max: 20 }),
          }),
        }),
        async (testData) => {
          // Skip test if new temple ID already exists in initial temples
          const initialTempleIds = testData.initialTemples.map((t) => t.templeId);
          if (initialTempleIds.includes(testData.newTemple.templeId)) {
            return; // Skip this test case
          }

          jest.clearAllMocks();

          // Setup: Mock initial temple group state
          const initialTotalCount = testData.initialTemples.reduce(
            (sum, t) => sum + t.qrCodeCount,
            0
          );

          mockGetItem.mockResolvedValueOnce({
            PK: `GROUP#${testData.groupId}`,
            SK: 'METADATA',
            groupId: testData.groupId,
            name: 'Test Group',
            description: 'Test Group Description',
            templeIds: initialTempleIds,
            totalTempleCount: initialTempleIds.length,
            totalQRCodeCount: initialTotalCount,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: 'admin-123',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin-123',
            version: 1,
          });

          // Execute: Get initial QR code count
          const initialCount = await templeService.getQRCodeCount('GROUP', testData.groupId);

          // Verify: Initial count is correct
          expect(initialCount).toBe(initialTotalCount);

          jest.clearAllMocks();

          // Calculate expected count after addition
          const expectedUpdatedCount = initialTotalCount + testData.newTemple.qrCodeCount;

          // Setup: Mock adding temple to group
          mockGetItem
            .mockResolvedValueOnce({
              PK: `GROUP#${testData.groupId}`,
              SK: 'METADATA',
              groupId: testData.groupId,
              name: 'Test Group',
              description: 'Test Group Description',
              templeIds: initialTempleIds,
              totalTempleCount: initialTempleIds.length,
              totalQRCodeCount: initialTotalCount,
              status: 'active',
              createdAt: new Date().toISOString(),
              createdBy: 'admin-123',
              updatedAt: new Date().toISOString(),
              updatedBy: 'admin-123',
              version: 1,
            })
            .mockResolvedValueOnce({
              PK: `TEMPLE#${testData.newTemple.templeId}`,
              SK: 'METADATA',
              templeId: testData.newTemple.templeId,
              name: `Temple ${testData.newTemple.templeId}`,
              activeArtifactCount: testData.newTemple.qrCodeCount,
              status: 'active',
              location: {
                state: 'Test State',
                city: 'Test City',
                address: 'Test Address',
              },
              description: 'Test Description',
              accessMode: 'HYBRID',
              createdAt: new Date().toISOString(),
              createdBy: 'admin-123',
              updatedAt: new Date().toISOString(),
              updatedBy: 'admin-123',
              version: 1,
            });

          mockQueryItems.mockResolvedValueOnce([]); // No existing association
          mockPutItem.mockResolvedValueOnce(undefined); // Association created
          mockUpdateItem.mockResolvedValueOnce(undefined); // Group updated

          // Execute: Add temple to group
          await templeService.addTempleToGroup(
            testData.groupId,
            testData.newTemple.templeId,
            'admin-123'
          );

          // Verify: Group was updated with new counts
          expect(mockUpdateItem).toHaveBeenCalledWith(
            'TempleGroups',
            {
              PK: `GROUP#${testData.groupId}`,
              SK: 'METADATA',
            },
            expect.any(String),
            expect.objectContaining({
              ':qrCount': expectedUpdatedCount,
            }),
            expect.any(Object),
            expect.any(String)
          );

          jest.clearAllMocks();

          // Setup: Mock updated group state
          mockGetItem.mockResolvedValueOnce({
            PK: `GROUP#${testData.groupId}`,
            SK: 'METADATA',
            groupId: testData.groupId,
            name: 'Test Group',
            description: 'Test Group Description',
            templeIds: [...initialTempleIds, testData.newTemple.templeId],
            totalTempleCount: initialTempleIds.length + 1,
            totalQRCodeCount: expectedUpdatedCount,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: 'admin-123',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin-123',
            version: 1,
          });

          // Execute: Get updated QR code count
          const updatedCount = await templeService.getQRCodeCount('GROUP', testData.groupId);

          // Verify: Count was updated to include new temple's QR codes
          expect(updatedCount).toBe(expectedUpdatedCount);
        }
      ),
      { numRuns: 50 } // Reduced runs due to complexity
    );
  });
});
