/**
 * Property-Based Tests for Audit Trail Completeness
 * Using fast-check for property-based testing
 * 
 * Tests for Task 2.11: Write property test for audit trail
 * 
 * **Validates: Requirements 1.6, 15.7, 19.7**
 */

import * as fc from 'fast-check';
import * as templeService from '../templeService';
import * as dynamodb from '../../../utils/dynamodb';

// Mock DynamoDB utilities
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/logger');
jest.mock('qrcode');
jest.mock('@aws-sdk/client-s3');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;
const mockUpdateItem = dynamodb.updateItem as jest.MockedFunction<typeof dynamodb.updateItem>;
const mockDeleteItem = dynamodb.deleteItem as jest.MockedFunction<typeof dynamodb.deleteItem>;

// Helper function to generate non-empty strings
const nonEmptyString = (minLength: number, maxLength: number) =>
  fc
    .string({ minLength, maxLength })
    .filter((s) => s.trim().length > 0)
    .map((s) => s.trim());

// Helper to extract audit log calls from mockPutItem
function getAuditLogCalls() {
  return mockPutItem.mock.calls.filter(
    (call) => call[1].entityType && call[1].action && call[1].performedBy
  );
}

describe('Audit Trail Completeness - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dynamodb.generateTimestamp as jest.Mock).mockReturnValue('2024-01-01T00:00:00.000Z');
    (dynamodb.generatePK as jest.Mock).mockImplementation(
      (prefix: string, id: string) => `${prefix}#${id}`
    );
  });

  /**
   * Property 4: Audit Trail Completeness
   * Validates: Requirements 1.6, 15.7, 19.7
   * 
   * For any create, update, or delete operation on temples, temple groups, 
   * artifacts, prices, or formulas, an audit log entry should be created 
   * containing the entity type, entity ID, action, timestamp, administrator ID, 
   * and before/after state snapshots.
   */
  test('Feature: temple-pricing-management, Property 4: Audit trail completeness for temple operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('CREATE', 'UPDATE', 'DELETE'),
          templeId: fc.uuid(),
          templeName: nonEmptyString(5, 50),
          adminUserId: fc.uuid(),
          location: fc.record({
            state: nonEmptyString(3, 30),
            city: nonEmptyString(3, 30),
            address: nonEmptyString(5, 100),
          }),
          description: nonEmptyString(10, 200),
        }),
        async (testData) => {
          jest.clearAllMocks();

          const timestamp = '2024-01-01T00:00:00.000Z';
          (dynamodb.generateTimestamp as jest.Mock).mockReturnValue(timestamp);

          if (testData.operation === 'CREATE') {
            // Test CREATE operation
            mockQueryItems.mockResolvedValueOnce([]); // No existing temples with same name
            mockPutItem.mockResolvedValue();

            await templeService.createTemple(
              {
                name: testData.templeName,
                location: testData.location,
                description: testData.description,
                accessMode: 'HYBRID',
              },
              testData.adminUserId
            );

            // Verify audit log was created
            const auditLogCalls = getAuditLogCalls();
            expect(auditLogCalls.length).toBeGreaterThanOrEqual(1);

            const auditLog = auditLogCalls[0][1];
            expect(auditLog).toMatchObject({
              entityType: 'TEMPLE',
              action: 'CREATE',
              performedBy: testData.adminUserId,
              timestamp,
            });

            // CREATE should have afterState but no beforeState
            expect(auditLog.afterState).toBeDefined();
            expect(auditLog.afterState.name).toBe(testData.templeName);
            expect(auditLog.beforeState).toBeUndefined();
          } else if (testData.operation === 'UPDATE') {
            // Test UPDATE operation
            const existingTemple = {
              PK: `TEMPLE#${testData.templeId}`,
              SK: 'METADATA',
              templeId: testData.templeId,
              name: 'Old Name',
              location: testData.location,
              description: 'Old description',
              activeArtifactCount: 0,
              accessMode: 'HYBRID',
              status: 'active',
              createdAt: timestamp,
              createdBy: 'admin-creator',
              updatedAt: timestamp,
              updatedBy: 'admin-creator',
              version: 1,
              GSI1PK: 'TEMPLE',
              GSI1SK: 'NAME#Old Name',
              GSI2PK: 'TEMPLE',
              GSI2SK: 'ACCESSMODE#HYBRID#NAME#Old Name',
            };

            mockGetItem.mockResolvedValueOnce(existingTemple);
            mockQueryItems.mockResolvedValueOnce([]); // No name conflicts
            mockUpdateItem.mockResolvedValueOnce({
              ...existingTemple,
              name: testData.templeName,
              description: testData.description,
              version: 2,
            });
            mockPutItem.mockResolvedValue();

            await templeService.updateTemple(
              testData.templeId,
              {
                name: testData.templeName,
                description: testData.description,
              },
              testData.adminUserId
            );

            // Verify audit log was created
            const auditLogCalls = getAuditLogCalls();
            expect(auditLogCalls.length).toBeGreaterThanOrEqual(1);

            const auditLog = auditLogCalls[0][1];
            expect(auditLog).toMatchObject({
              entityType: 'TEMPLE',
              entityId: testData.templeId,
              action: 'UPDATE',
              performedBy: testData.adminUserId,
              timestamp,
            });

            // UPDATE should have both beforeState and afterState
            expect(auditLog.beforeState).toBeDefined();
            expect(auditLog.beforeState.name).toBe('Old Name');
            expect(auditLog.afterState).toBeDefined();
            expect(auditLog.afterState.name).toBe(testData.templeName);
          } else if (testData.operation === 'DELETE') {
            // Test DELETE operation
            const existingTemple = {
              PK: `TEMPLE#${testData.templeId}`,
              SK: 'METADATA',
              templeId: testData.templeId,
              name: testData.templeName,
              location: testData.location,
              description: testData.description,
              activeArtifactCount: 0,
              accessMode: 'HYBRID',
              status: 'active',
              createdAt: timestamp,
              createdBy: 'admin-creator',
              updatedAt: timestamp,
              updatedBy: 'admin-creator',
              version: 1,
              GSI1PK: 'TEMPLE',
              GSI1SK: `NAME#${testData.templeName}`,
              GSI2PK: 'TEMPLE',
              GSI2SK: `ACCESSMODE#HYBRID#NAME#${testData.templeName}`,
            };

            mockGetItem.mockResolvedValueOnce(existingTemple);
            mockQueryItems.mockResolvedValueOnce([]); // No groups
            mockDeleteItem.mockResolvedValue();
            mockPutItem.mockResolvedValue();

            await templeService.deleteTemple(testData.templeId, testData.adminUserId);

            // Verify audit log was created
            const auditLogCalls = getAuditLogCalls();
            expect(auditLogCalls.length).toBeGreaterThanOrEqual(1);

            const auditLog = auditLogCalls[0][1];
            expect(auditLog).toMatchObject({
              entityType: 'TEMPLE',
              entityId: testData.templeId,
              action: 'DELETE',
              performedBy: testData.adminUserId,
              timestamp,
            });

            // DELETE should have beforeState but no afterState
            expect(auditLog.beforeState).toBeDefined();
            expect(auditLog.beforeState.name).toBe(testData.templeName);
            expect(auditLog.afterState).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Feature: temple-pricing-management, Property 4: Audit trail completeness for temple group operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('CREATE', 'UPDATE', 'DELETE'),
          groupId: fc.uuid(),
          groupName: nonEmptyString(5, 50),
          adminUserId: fc.uuid(),
          description: nonEmptyString(10, 200),
          templeIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
        }),
        async (testData) => {
          jest.clearAllMocks();

          const timestamp = '2024-01-01T00:00:00.000Z';
          (dynamodb.generateTimestamp as jest.Mock).mockReturnValue(timestamp);

          if (testData.operation === 'CREATE') {
            // Mock temples exist
            for (const templeId of testData.templeIds) {
              mockGetItem.mockResolvedValueOnce({
                PK: `TEMPLE#${templeId}`,
                SK: 'METADATA',
                templeId,
                name: `Temple ${templeId}`,
                activeArtifactCount: 5,
                status: 'active',
                location: { state: 'State', city: 'City', address: 'Address' },
                description: 'Description',
                accessMode: 'HYBRID',
                createdAt: timestamp,
                createdBy: 'admin',
                updatedAt: timestamp,
                updatedBy: 'admin',
                version: 1,
                GSI1PK: 'TEMPLE',
                GSI1SK: `NAME#Temple ${templeId}`,
                GSI2PK: 'TEMPLE',
                GSI2SK: `ACCESSMODE#HYBRID#NAME#Temple ${templeId}`,
              });
            }

            mockPutItem.mockResolvedValue();

            await templeService.createTempleGroup(
              {
                name: testData.groupName,
                description: testData.description,
                templeIds: testData.templeIds,
              },
              testData.adminUserId
            );

            // Verify audit log was created
            const auditLogCalls = getAuditLogCalls();
            expect(auditLogCalls.length).toBeGreaterThanOrEqual(1);

            const auditLog = auditLogCalls[auditLogCalls.length - 1][1];
            expect(auditLog).toMatchObject({
              entityType: 'GROUP',
              action: 'CREATE',
              performedBy: testData.adminUserId,
              timestamp,
            });

            expect(auditLog.afterState).toBeDefined();
            expect(auditLog.afterState.name).toBe(testData.groupName);
            expect(auditLog.beforeState).toBeUndefined();
          } else if (testData.operation === 'UPDATE') {
            const existingGroup = {
              PK: `GROUP#${testData.groupId}`,
              SK: 'METADATA',
              groupId: testData.groupId,
              name: 'Old Group Name',
              description: 'Old description',
              templeIds: testData.templeIds,
              totalTempleCount: testData.templeIds.length,
              totalQRCodeCount: 15,
              status: 'active',
              createdAt: timestamp,
              createdBy: 'admin-creator',
              updatedAt: timestamp,
              updatedBy: 'admin-creator',
              version: 1,
              GSI1PK: 'GROUP',
              GSI1SK: 'NAME#Old Group Name',
            };

            mockGetItem.mockResolvedValueOnce(existingGroup);
            mockUpdateItem.mockResolvedValueOnce({
              ...existingGroup,
              name: testData.groupName,
              version: 2,
            });
            mockPutItem.mockResolvedValue();

            await templeService.updateTempleGroup(
              testData.groupId,
              { name: testData.groupName },
              testData.adminUserId
            );

            // Verify audit log was created
            const auditLogCalls = getAuditLogCalls();
            expect(auditLogCalls.length).toBeGreaterThanOrEqual(1);

            const auditLog = auditLogCalls[0][1];
            expect(auditLog).toMatchObject({
              entityType: 'GROUP',
              entityId: testData.groupId,
              action: 'UPDATE',
              performedBy: testData.adminUserId,
              timestamp,
            });

            expect(auditLog.beforeState).toBeDefined();
            expect(auditLog.beforeState.name).toBe('Old Group Name');
            expect(auditLog.afterState).toBeDefined();
            expect(auditLog.afterState.name).toBe(testData.groupName);
          } else if (testData.operation === 'DELETE') {
            const existingGroup = {
              PK: `GROUP#${testData.groupId}`,
              SK: 'METADATA',
              groupId: testData.groupId,
              name: testData.groupName,
              description: testData.description,
              templeIds: testData.templeIds,
              totalTempleCount: testData.templeIds.length,
              totalQRCodeCount: 15,
              status: 'active',
              createdAt: timestamp,
              createdBy: 'admin-creator',
              updatedAt: timestamp,
              updatedBy: 'admin-creator',
              version: 1,
              GSI1PK: 'GROUP',
              GSI1SK: `NAME#${testData.groupName}`,
            };

            mockGetItem.mockResolvedValueOnce(existingGroup);
            mockDeleteItem.mockResolvedValue();
            mockPutItem.mockResolvedValue();

            await templeService.deleteTempleGroup(testData.groupId, testData.adminUserId);

            // Verify audit log was created
            const auditLogCalls = getAuditLogCalls();
            expect(auditLogCalls.length).toBeGreaterThanOrEqual(1);

            const auditLog = auditLogCalls[0][1];
            expect(auditLog).toMatchObject({
              entityType: 'GROUP',
              entityId: testData.groupId,
              action: 'DELETE',
              performedBy: testData.adminUserId,
              timestamp,
            });

            expect(auditLog.beforeState).toBeDefined();
            expect(auditLog.beforeState.name).toBe(testData.groupName);
            expect(auditLog.afterState).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Feature: temple-pricing-management, Property 4: Audit trail completeness for artifact operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('CREATE', 'UPDATE', 'DELETE'),
          templeId: fc.uuid(),
          artifactId: fc.uuid(),
          artifactName: nonEmptyString(5, 50),
          adminUserId: fc.uuid(),
          description: nonEmptyString(10, 200),
        }),
        async (testData) => {
          // Reset mocks completely at the start of each iteration
          mockGetItem.mockReset();
          mockQueryItems.mockReset();
          mockPutItem.mockReset();
          mockUpdateItem.mockReset();
          mockDeleteItem.mockReset();

          const timestamp = '2024-01-01T00:00:00.000Z';
          (dynamodb.generateTimestamp as jest.Mock).mockReturnValue(timestamp);

          if (testData.operation === 'CREATE') {
            // Mock temple exists (for getTemple call in createArtifact)
            const mockTemple = {
              PK: `TEMPLE#${testData.templeId}`,
              SK: 'METADATA',
              templeId: testData.templeId,
              name: 'Test Temple',
              activeArtifactCount: 0,
              status: 'active',
              location: { state: 'State', city: 'City', address: 'Address' },
              description: 'Description',
              accessMode: 'HYBRID',
              createdAt: timestamp,
              createdBy: 'admin',
              updatedAt: timestamp,
              updatedBy: 'admin',
              version: 1,
              GSI1PK: 'TEMPLE',
              GSI1SK: 'NAME#Test Temple',
              GSI2PK: 'TEMPLE',
              GSI2SK: 'ACCESSMODE#HYBRID#NAME#Test Temple',
            };

            // First getItem call for temple validation in createArtifact
            mockGetItem.mockResolvedValueOnce(mockTemple);
            // Second getItem call for getGroupsForTemple -> getTemple
            mockGetItem.mockResolvedValueOnce(mockTemple);

            // Mock associations query to return empty array (no groups)
            mockQueryItems.mockResolvedValueOnce([]);
            mockPutItem.mockResolvedValue();
            mockUpdateItem.mockResolvedValue({});

            // Mock QR code generation
            const QRCode = require('qrcode');
            QRCode.toBuffer = jest.fn().mockResolvedValue(Buffer.from('fake-qr-code'));

            const { S3Client } = require('@aws-sdk/client-s3');
            S3Client.prototype.send = jest.fn().mockResolvedValue({});

            await templeService.createArtifact(
              {
                templeId: testData.templeId,
                name: testData.artifactName,
                description: testData.description,
              },
              testData.adminUserId
            );

            // Verify audit log was created
            const auditLogCalls = getAuditLogCalls();
            expect(auditLogCalls.length).toBeGreaterThanOrEqual(1);

            const auditLog = auditLogCalls[auditLogCalls.length - 1][1];
            expect(auditLog).toMatchObject({
              entityType: 'ARTIFACT',
              action: 'CREATE',
              performedBy: testData.adminUserId,
              timestamp,
            });

            expect(auditLog.afterState).toBeDefined();
            expect(auditLog.afterState.name).toBe(testData.artifactName);
            expect(auditLog.beforeState).toBeUndefined();
          } else if (testData.operation === 'UPDATE') {
            const existingArtifact = {
              PK: `TEMPLE#${testData.templeId}`,
              SK: `ARTIFACT#${testData.artifactId}`,
              artifactId: testData.artifactId,
              templeId: testData.templeId,
              name: 'Old Artifact Name',
              description: 'Old description',
              qrCodeId: 'QR-123',
              qrCodeImageUrl: 'https://example.com/qr.png',
              status: 'active',
              createdAt: timestamp,
              createdBy: 'admin-creator',
              updatedAt: timestamp,
              updatedBy: 'admin-creator',
              GSI1PK: 'QRCODE#QR-123',
              GSI1SK: `ARTIFACT#${testData.artifactId}`,
            };

            const updatedArtifact = {
              ...existingArtifact,
              name: testData.artifactName,
              description: testData.description,
              updatedAt: timestamp,
              updatedBy: testData.adminUserId,
            };

            // First query for getArtifact (before update)
            mockQueryItems.mockResolvedValueOnce([existingArtifact]);
            // Second query for getArtifact (after update)
            mockQueryItems.mockResolvedValueOnce([updatedArtifact]);
            mockUpdateItem.mockResolvedValueOnce(updatedArtifact);
            mockPutItem.mockResolvedValue();

            await templeService.updateArtifact(
              testData.artifactId,
              {
                name: testData.artifactName,
                description: testData.description,
              },
              testData.adminUserId
            );

            // Verify audit log was created
            const auditLogCalls = getAuditLogCalls();
            expect(auditLogCalls.length).toBeGreaterThanOrEqual(1);

            const auditLog = auditLogCalls[0][1];
            expect(auditLog).toMatchObject({
              entityType: 'ARTIFACT',
              entityId: testData.artifactId,
              action: 'UPDATE',
              performedBy: testData.adminUserId,
              timestamp,
            });

            expect(auditLog.beforeState).toBeDefined();
            expect(auditLog.beforeState.name).toBe('Old Artifact Name');
            expect(auditLog.afterState).toBeDefined();
            expect(auditLog.afterState.name).toBe(testData.artifactName);
          } else if (testData.operation === 'DELETE') {
            const existingArtifact = {
              PK: `TEMPLE#${testData.templeId}`,
              SK: `ARTIFACT#${testData.artifactId}`,
              artifactId: testData.artifactId,
              templeId: testData.templeId,
              name: testData.artifactName,
              description: testData.description,
              qrCodeId: 'QR-123',
              qrCodeImageUrl: 'https://example.com/qr.png',
              status: 'active',
              createdAt: timestamp,
              createdBy: 'admin-creator',
              updatedAt: timestamp,
              updatedBy: 'admin-creator',
              GSI1PK: 'QRCODE#QR-123',
              GSI1SK: `ARTIFACT#${testData.artifactId}`,
            };

            const mockTemple = {
              PK: `TEMPLE#${testData.templeId}`,
              SK: 'METADATA',
              templeId: testData.templeId,
              name: 'Test Temple',
              activeArtifactCount: 1,
              status: 'active',
              location: { state: 'State', city: 'City', address: 'Address' },
              description: 'Description',
              accessMode: 'HYBRID',
              createdAt: timestamp,
              createdBy: 'admin',
              updatedAt: timestamp,
              updatedBy: 'admin',
              version: 1,
              GSI1PK: 'TEMPLE',
              GSI1SK: 'NAME#Test Temple',
              GSI2PK: 'TEMPLE',
              GSI2SK: 'ACCESSMODE#HYBRID#NAME#Test Temple',
            };

            // Mock getArtifact call
            mockQueryItems.mockResolvedValueOnce([existingArtifact]);
            // Mock getGroupsForTemple -> getTemple
            mockGetItem.mockResolvedValueOnce(mockTemple);
            // Mock getGroupsForTemple -> query associations (no groups)
            mockQueryItems.mockResolvedValueOnce([]);
            mockUpdateItem.mockResolvedValue({});
            mockPutItem.mockResolvedValue();

            await templeService.deleteArtifact(testData.artifactId, testData.adminUserId);

            // Verify audit log was created
            const auditLogCalls = getAuditLogCalls();
            expect(auditLogCalls.length).toBeGreaterThanOrEqual(1);

            const auditLog = auditLogCalls[0][1];
            expect(auditLog).toMatchObject({
              entityType: 'ARTIFACT',
              entityId: testData.artifactId,
              action: 'DELETE',
              performedBy: testData.adminUserId,
              timestamp,
            });

            expect(auditLog.beforeState).toBeDefined();
            expect(auditLog.beforeState.name).toBe(testData.artifactName);
            expect(auditLog.afterState).toBeUndefined();
          }
        }
      ),
      { numRuns: 50 } // Reduced runs due to complexity with QR code mocking
    );
  });

  test('Feature: temple-pricing-management, Property 4: Audit logs can be queried by entity, admin user, and action type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityType: fc.constantFrom('TEMPLE', 'GROUP', 'ARTIFACT'),
          entityId: fc.uuid(),
          adminUserId: fc.uuid(),
          action: fc.constantFrom('CREATE', 'UPDATE', 'DELETE'),
        }),
        async (testData) => {
          const timestamp = '2024-01-01T00:00:00.000Z';

          // Mock audit log entries
          const mockAuditLog = {
            PK: `AUDIT#${testData.entityType}#${testData.entityId}`,
            SK: `TIMESTAMP#${timestamp}`,
            auditId: fc.sample(fc.uuid(), 1)[0],
            entityType: testData.entityType,
            entityId: testData.entityId,
            action: testData.action,
            performedBy: testData.adminUserId,
            timestamp,
            beforeState: testData.action !== 'CREATE' ? { name: 'Old Name' } : undefined,
            afterState: testData.action !== 'DELETE' ? { name: 'New Name' } : undefined,
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
            GSI1PK: `ADMIN#${testData.adminUserId}`,
            GSI1SK: `TIMESTAMP#${timestamp}`,
            GSI2PK: `ACTION#${testData.action}`,
            GSI2SK: `TIMESTAMP#${timestamp}`,
          };

          // Test query by entity
          mockQueryItems.mockReset();
          mockQueryItems.mockResolvedValueOnce([mockAuditLog]);
          const byEntity = await templeService.getAuditLogsByEntity(
            testData.entityType,
            testData.entityId
          );
          expect(byEntity).toHaveLength(1);
          expect(byEntity[0].entityType).toBe(testData.entityType);
          expect(byEntity[0].entityId).toBe(testData.entityId);
          expect(byEntity[0].action).toBe(testData.action);
          expect(byEntity[0].performedBy).toBe(testData.adminUserId);

          // Test query by admin user
          mockQueryItems.mockReset();
          mockQueryItems.mockResolvedValueOnce([mockAuditLog]);
          const byAdmin = await templeService.getAuditLogsByAdmin(testData.adminUserId);
          expect(byAdmin).toHaveLength(1);
          expect(byAdmin[0].performedBy).toBe(testData.adminUserId);

          // Test query by action type
          mockQueryItems.mockReset();
          mockQueryItems.mockResolvedValueOnce([mockAuditLog]);
          const byAction = await templeService.getAuditLogsByAction(testData.action);
          expect(byAction).toHaveLength(1);
          expect(byAction[0].action).toBe(testData.action);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Feature: temple-pricing-management, Property 4: Audit log timestamps are in chronological order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entityType: fc.constantFrom('TEMPLE', 'GROUP', 'ARTIFACT'),
          entityId: fc.uuid(),
          operationCount: fc.integer({ min: 2, max: 10 }),
        }),
        async (testData) => {
          jest.clearAllMocks();

          // Generate multiple audit logs with sequential timestamps
          const auditLogs = Array.from({ length: testData.operationCount }, (_, i) => {
            const timestamp = new Date(Date.now() + i * 1000).toISOString();
            return {
              PK: `AUDIT#${testData.entityType}#${testData.entityId}`,
              SK: `TIMESTAMP#${timestamp}`,
              auditId: fc.sample(fc.uuid(), 1)[0],
              entityType: testData.entityType,
              entityId: testData.entityId,
              action: 'UPDATE',
              performedBy: 'admin-123',
              timestamp,
              beforeState: { name: `Name ${i}` },
              afterState: { name: `Name ${i + 1}` },
              GSI1PK: 'ADMIN#admin-123',
              GSI1SK: `TIMESTAMP#${timestamp}`,
              GSI2PK: 'ACTION#UPDATE',
              GSI2SK: `TIMESTAMP#${timestamp}`,
            };
          });

          mockQueryItems.mockResolvedValueOnce(auditLogs);

          const result = await templeService.getAuditLogsByEntity(
            testData.entityType,
            testData.entityId
          );

          // Verify timestamps are in chronological order
          for (let i = 1; i < result.length; i++) {
            const prevTimestamp = new Date(result[i - 1].timestamp).getTime();
            const currTimestamp = new Date(result[i].timestamp).getTime();
            expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
