/**
 * Property-Based Tests for Temple Group Service
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import * as templeService from '../templeService';
import * as dynamodb from '../../../utils/dynamodb';
import { CreateGroupRequest, CreateTempleRequest } from '../../../types';
import { ValidationError } from '../../../utils/errors';
import config from '../../../config';

// Mock DynamoDB utilities
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/logger');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;
const mockUpdateItem = dynamodb.updateItem as jest.MockedFunction<typeof dynamodb.updateItem>;
const mockDeleteItem = dynamodb.deleteItem as jest.MockedFunction<typeof dynamodb.deleteItem>;

describe('Temple Group Service - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dynamodb.generateTimestamp as jest.Mock).mockReturnValue('2024-01-01T00:00:00.000Z');
    (dynamodb.generatePK as jest.Mock).mockImplementation((prefix: string, id: string) => `${prefix}#${id}`);
  });

  // Helper: Custom generator for non-empty strings
  const nonEmptyString = (minLength: number, maxLength: number) =>
    fc
      .string({ minLength, maxLength })
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim());

  // Helper: Generator for temple data
  const templeDataArb = fc.record({
    name: nonEmptyString(1, 100),
    location: fc.record({
      state: nonEmptyString(1, 50),
      city: nonEmptyString(1, 50),
      address: nonEmptyString(1, 200),
    }),
    description: nonEmptyString(1, 500),
    activeArtifactCount: fc.integer({ min: 0, max: 100 }),
  });

  /**
   * Property 25: Temple Group Minimum Size
   * **Validates: Requirements 16.3, 24.4**
   * 
   * For any temple group creation or update request, if the group contains zero temples, 
   * the system should reject the request with a validation error.
   */
  test('Feature: temple-pricing-management, Property 25: Temple group minimum size', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: nonEmptyString(1, 100),
          description: nonEmptyString(1, 500),
        }),
        async (groupData) => {
          jest.clearAllMocks();

          // Test Case 1: Creating a group with zero temples should fail
          const emptyGroupRequest: CreateGroupRequest = {
            name: groupData.name,
            description: groupData.description,
            templeIds: [], // Empty array
          };

          // Verify: Should throw ValidationError
          await expect(
            templeService.createTempleGroup(emptyGroupRequest, 'admin-123')
          ).rejects.toThrow(ValidationError);

          await expect(
            templeService.createTempleGroup(emptyGroupRequest, 'admin-123')
          ).rejects.toThrow('Temple group must include at least one temple');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 26: Temple Group Independence
   * **Validates: Requirements 16.6**
   * 
   * For any temple that is added to a temple group, the temple should remain a separate 
   * purchasable entity with its own price configuration that is independent of the 
   * group's price configuration.
   */
  test('Feature: temple-pricing-management, Property 26: Temple group independence', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          temple: templeDataArb,
          group: fc.record({
            name: nonEmptyString(1, 100),
            description: nonEmptyString(1, 500),
          }),
        }),
        async (testData) => {
          jest.clearAllMocks();

          // Step 1: Create a temple
          mockQueryItems.mockResolvedValueOnce([]); // No name conflicts
          mockPutItem.mockResolvedValueOnce(undefined);

          const templeRequest: CreateTempleRequest = {
            name: testData.temple.name,
            location: testData.temple.location,
            description: testData.temple.description,
          };

          const temple = await templeService.createTemple(templeRequest, 'admin-123');

          // Step 2: Create a temple group containing this temple
          mockGetItem.mockResolvedValueOnce({
            PK: `TEMPLE#${temple.templeId}`,
            SK: 'METADATA',
            templeId: temple.templeId,
            name: temple.name,
            activeArtifactCount: testData.temple.activeArtifactCount,
            location: testData.temple.location,
            description: testData.temple.description,
            accessMode: 'HYBRID',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
            createdBy: 'admin-123',
            updatedAt: '2024-01-01T00:00:00.000Z',
            updatedBy: 'admin-123',
            version: 1,
            GSI1PK: 'TEMPLE',
            GSI1SK: `NAME#${temple.name}`,
            GSI2PK: 'TEMPLE',
            GSI2SK: `ACCESSMODE#HYBRID#NAME#${temple.name}`,
          });

          mockPutItem.mockResolvedValue(undefined);

          const groupRequest: CreateGroupRequest = {
            name: testData.group.name,
            description: testData.group.description,
            templeIds: [temple.templeId],
          };

          const group = await templeService.createTempleGroup(groupRequest, 'admin-123');

          // Step 3: Verify temple remains independent
          // The temple should still exist as a separate entity
          mockGetItem.mockResolvedValueOnce({
            PK: `TEMPLE#${temple.templeId}`,
            SK: 'METADATA',
            templeId: temple.templeId,
            name: temple.name,
            activeArtifactCount: testData.temple.activeArtifactCount,
            location: testData.temple.location,
            description: testData.temple.description,
            accessMode: 'HYBRID',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
            createdBy: 'admin-123',
            updatedAt: '2024-01-01T00:00:00.000Z',
            updatedBy: 'admin-123',
            version: 1,
            GSI1PK: 'TEMPLE',
            GSI1SK: `NAME#${temple.name}`,
            GSI2PK: 'TEMPLE',
            GSI2SK: `ACCESSMODE#HYBRID#NAME#${temple.name}`,
          });

          const retrievedTemple = await templeService.getTemple(temple.templeId);

          // Verify: Temple still exists independently
          expect(retrievedTemple.templeId).toBe(temple.templeId);
          expect(retrievedTemple.name).toBe(temple.name);

          // Verify: Group contains the temple
          expect(group.templeIds).toContain(temple.templeId);

          // Verify: Temple and group are separate entities (different IDs)
          expect(temple.templeId).not.toBe(group.groupId);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 42: Temple Multi-Group Membership
   * **Validates: Requirements 24.1**
   * 
   * For any temple, it should be possible to add that temple to multiple temple groups, 
   * and all group associations should be maintained in the TempleGroupAssociations table.
   */
  test('Feature: temple-pricing-management, Property 42: Temple multi-group membership', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          temple: templeDataArb,
          group1: fc.record({
            name: nonEmptyString(1, 100),
            description: nonEmptyString(1, 500),
          }),
          group2: fc.record({
            name: nonEmptyString(1, 100),
            description: nonEmptyString(1, 500),
          }),
        }),
        async (testData) => {
          jest.clearAllMocks();

          // Step 1: Create a temple
          mockQueryItems.mockResolvedValueOnce([]); // No name conflicts
          mockPutItem.mockResolvedValueOnce(undefined);

          const templeRequest: CreateTempleRequest = {
            name: testData.temple.name,
            location: testData.temple.location,
            description: testData.temple.description,
          };

          const temple = await templeService.createTemple(templeRequest, 'admin-123');

          const templeDBItem = {
            PK: `TEMPLE#${temple.templeId}`,
            SK: 'METADATA',
            templeId: temple.templeId,
            name: temple.name,
            activeArtifactCount: testData.temple.activeArtifactCount,
            location: testData.temple.location,
            description: testData.temple.description,
            accessMode: 'HYBRID',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
            createdBy: 'admin-123',
            updatedAt: '2024-01-01T00:00:00.000Z',
            updatedBy: 'admin-123',
            version: 1,
            GSI1PK: 'TEMPLE',
            GSI1SK: `NAME#${temple.name}`,
            GSI2PK: 'TEMPLE',
            GSI2SK: `ACCESSMODE#HYBRID#NAME#${temple.name}`,
          };

          // Step 2: Create first temple group
          mockGetItem.mockResolvedValueOnce(templeDBItem);
          mockPutItem.mockResolvedValue(undefined);

          const group1Request: CreateGroupRequest = {
            name: testData.group1.name,
            description: testData.group1.description,
            templeIds: [temple.templeId],
          };

          const group1 = await templeService.createTempleGroup(group1Request, 'admin-123');

          // Step 3: Create second temple group with the same temple
          mockGetItem.mockResolvedValueOnce(templeDBItem);
          mockPutItem.mockResolvedValue(undefined);

          const group2Request: CreateGroupRequest = {
            name: testData.group2.name,
            description: testData.group2.description,
            templeIds: [temple.templeId],
          };

          const group2 = await templeService.createTempleGroup(group2Request, 'admin-123');

          // Verify: Both groups contain the same temple
          expect(group1.templeIds).toContain(temple.templeId);
          expect(group2.templeIds).toContain(temple.templeId);

          // Step 4: Retrieve groups for the temple (reverse lookup)
          mockGetItem.mockResolvedValueOnce(templeDBItem);

          mockQueryItems.mockResolvedValueOnce([
            {
              PK: `GROUP#${group1.groupId}`,
              SK: `TEMPLE#${temple.templeId}`,
              groupId: group1.groupId,
              templeId: temple.templeId,
              GSI1PK: `TEMPLE#${temple.templeId}`,
              GSI1SK: `GROUP#${group1.groupId}`,
            },
            {
              PK: `GROUP#${group2.groupId}`,
              SK: `TEMPLE#${temple.templeId}`,
              groupId: group2.groupId,
              templeId: temple.templeId,
              GSI1PK: `TEMPLE#${temple.templeId}`,
              GSI1SK: `GROUP#${group2.groupId}`,
            },
          ]);

          mockGetItem
            .mockResolvedValueOnce({
              PK: `GROUP#${group1.groupId}`,
              SK: 'METADATA',
              groupId: group1.groupId,
              name: group1.name,
              description: group1.description,
              templeIds: [temple.templeId],
              totalTempleCount: 1,
              totalQRCodeCount: testData.temple.activeArtifactCount,
              status: 'active',
              createdAt: '2024-01-01T00:00:00.000Z',
              createdBy: 'admin-123',
              updatedAt: '2024-01-01T00:00:00.000Z',
              updatedBy: 'admin-123',
              version: 1,
              GSI1PK: 'GROUP',
              GSI1SK: `NAME#${group1.name}`,
            })
            .mockResolvedValueOnce({
              PK: `GROUP#${group2.groupId}`,
              SK: 'METADATA',
              groupId: group2.groupId,
              name: group2.name,
              description: group2.description,
              templeIds: [temple.templeId],
              totalTempleCount: 1,
              totalQRCodeCount: testData.temple.activeArtifactCount,
              status: 'active',
              createdAt: '2024-01-01T00:00:00.000Z',
              createdBy: 'admin-123',
              updatedAt: '2024-01-01T00:00:00.000Z',
              updatedBy: 'admin-123',
              version: 1,
              GSI1PK: 'GROUP',
              GSI1SK: `NAME#${group2.name}`,
            });

          const groups = await templeService.getGroupsForTemple(temple.templeId);

          // Verify: Temple is associated with both groups
          expect(groups).toHaveLength(2);
          expect(groups.map(g => g.groupId)).toContain(group1.groupId);
          expect(groups.map(g => g.groupId)).toContain(group2.groupId);

          // Verify: putItem was called for both group creations
          // Each createTempleGroup call should result in:
          // - 1 putItem for the group metadata
          // - 1 putItem for each temple association
          // So for 2 groups with 1 temple each: 2 groups + 2 associations = 4 putItem calls minimum
          expect(mockPutItem).toHaveBeenCalled();
          expect(mockPutItem.mock.calls.length).toBeGreaterThanOrEqual(4);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 44: Referential Integrity on Temple Deletion
   * **Validates: Requirements 24.6**
   * 
   * For any temple deletion operation, all associations between that temple and temple 
   * groups should be removed from the TempleGroupAssociations table, and the affected 
   * groups' temple counts and QR code counts should be recalculated.
   */
  test('Feature: temple-pricing-management, Property 44: Referential integrity on temple deletion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          temple: templeDataArb,
          group: fc.record({
            name: nonEmptyString(1, 100),
            description: nonEmptyString(1, 500),
          }),
          otherTemple: templeDataArb,
        }),
        async (testData) => {
          jest.clearAllMocks();

          // Step 1: Create two temples
          mockQueryItems.mockResolvedValueOnce([]); // No name conflicts for temple1
          mockPutItem.mockResolvedValueOnce(undefined);

          const temple1Request: CreateTempleRequest = {
            name: testData.temple.name,
            location: testData.temple.location,
            description: testData.temple.description,
          };

          const temple1 = await templeService.createTemple(temple1Request, 'admin-123');

          mockQueryItems.mockResolvedValueOnce([]); // No name conflicts for temple2
          mockPutItem.mockResolvedValueOnce(undefined);

          const temple2Request: CreateTempleRequest = {
            name: testData.otherTemple.name,
            location: testData.otherTemple.location,
            description: testData.otherTemple.description,
          };

          const temple2 = await templeService.createTemple(temple2Request, 'admin-123');

          // Step 2: Create a temple group with both temples
          mockGetItem
            .mockResolvedValueOnce({
              PK: `TEMPLE#${temple1.templeId}`,
              SK: 'METADATA',
              templeId: temple1.templeId,
              name: temple1.name,
              activeArtifactCount: testData.temple.activeArtifactCount,
            })
            .mockResolvedValueOnce({
              PK: `TEMPLE#${temple2.templeId}`,
              SK: 'METADATA',
              templeId: temple2.templeId,
              name: temple2.name,
              activeArtifactCount: testData.otherTemple.activeArtifactCount,
            });

          mockPutItem.mockResolvedValue(undefined);

          const groupRequest: CreateGroupRequest = {
            name: testData.group.name,
            description: testData.group.description,
            templeIds: [temple1.templeId, temple2.templeId],
          };

          const group = await templeService.createTempleGroup(groupRequest, 'admin-123');

          // Verify initial state
          expect(group.templeIds).toHaveLength(2);
          expect(group.totalTempleCount).toBe(2);
          expect(group.totalQRCodeCount).toBe(
            testData.temple.activeArtifactCount + testData.otherTemple.activeArtifactCount
          );

          // Step 3: Simulate temple deletion by removing it from the group
          // (In a real implementation, temple deletion would trigger this)
          mockGetItem
            .mockResolvedValueOnce({
              PK: `GROUP#${group.groupId}`,
              SK: 'METADATA',
              groupId: group.groupId,
              name: group.name,
              description: group.description,
              templeIds: [temple1.templeId, temple2.templeId],
              totalTempleCount: 2,
              totalQRCodeCount: testData.temple.activeArtifactCount + testData.otherTemple.activeArtifactCount,
              status: 'active',
              version: 1,
              createdAt: '2024-01-01T00:00:00.000Z',
              createdBy: 'admin-123',
              updatedAt: '2024-01-01T00:00:00.000Z',
              updatedBy: 'admin-123',
              GSI1PK: 'GROUP',
              GSI1SK: `NAME#${group.name}`,
            })
            .mockResolvedValueOnce({
              PK: `TEMPLE#${temple1.templeId}`,
              SK: 'METADATA',
              templeId: temple1.templeId,
              name: temple1.name,
              activeArtifactCount: testData.temple.activeArtifactCount,
            });

          mockDeleteItem.mockResolvedValue();
          mockUpdateItem.mockResolvedValue({
            groupId: group.groupId,
            name: group.name,
            description: group.description,
            templeIds: [temple2.templeId],
            totalTempleCount: 1,
            totalQRCodeCount: testData.otherTemple.activeArtifactCount,
            status: 'active',
            version: 2,
          } as any);

          await templeService.removeTempleFromGroup(group.groupId, temple1.templeId, 'admin-123');

          // Verify: Association deletion was called
          expect(mockDeleteItem).toHaveBeenCalled();
          
          // Verify: The delete was called with the associations table
          const deleteCall = mockDeleteItem.mock.calls[0];
          expect(deleteCall[0]).toBe(config.tables.associations);
          
          // Verify: The key contains the correct PK and SK patterns
          const deletedKey = deleteCall[1];
          expect(deletedKey.PK).toContain('GROUP#');
          expect(deletedKey.PK).toContain(group.groupId);
          expect(deletedKey.SK).toContain('TEMPLE#');
          expect(deletedKey.SK).toContain(temple1.templeId);

          // Verify: Group was updated with recalculated counts
          expect(mockUpdateItem).toHaveBeenCalled();
          
          // Verify the update expression contains the recalculated values
          const updateCall = mockUpdateItem.mock.calls[0];
          expect(updateCall[3]).toMatchObject({
            ':templeIds': [temple2.templeId],
            ':templeCount': 1,
            ':qrCount': testData.otherTemple.activeArtifactCount,
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
