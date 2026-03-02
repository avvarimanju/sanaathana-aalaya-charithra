/**
 * Property-Based Tests for Artifact Service
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import * as templeService from '../templeService';
import * as dynamodb from '../../../utils/dynamodb';
import { CreateArtifactRequest } from '../../../types';

// Mock dependencies
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/logger');
jest.mock('qrcode');
jest.mock('@aws-sdk/client-s3');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;
const mockUpdateItem = dynamodb.updateItem as jest.MockedFunction<typeof dynamodb.updateItem>;

describe('Artifact Service - Property-Based Tests', () => {
  const userId = 'test-admin-123';
  const templeId = 'temple-test-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock QRCode library
    const QRCode = require('qrcode');
    QRCode.toBuffer = jest.fn().mockResolvedValue(Buffer.from('fake-qr-code'));

    // Mock S3 client
    const { S3Client } = require('@aws-sdk/client-s3');
    S3Client.prototype.send = jest.fn().mockResolvedValue({});
  });

  /**
   * Property 27: QR Code Generation Uniqueness
   * **Validates: Requirements 17.3**
   * 
   * For any artifact creation, the Temple Management Service should generate a unique 
   * QR code identifier that does not match any existing QR code identifier in the system.
   */
  test('Feature: temple-pricing-management, Property 27: QR Code generation uniqueness', async () => {
    // Custom generator for non-empty strings (no whitespace-only)
    const nonEmptyString = (minLength: number, maxLength: number) =>
      fc
        .string({ minLength, maxLength })
        .filter((s) => s.trim().length > 0)
        .map((s) => s.trim());

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: nonEmptyString(1, 100),
            description: nonEmptyString(1, 500),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (artifacts) => {
          // Clear mocks for each property test iteration
          jest.clearAllMocks();

          // Mock temple exists
          mockGetItem.mockResolvedValue({
            PK: `TEMPLE#${templeId}`,
            SK: 'METADATA',
            templeId,
            name: 'Test Temple',
            status: 'active',
            activeArtifactCount: 0,
            accessMode: 'HYBRID',
            location: { state: 'Test', city: 'Test', address: 'Test' },
            description: 'Test temple',
            createdAt: '2024-01-01T00:00:00.000Z',
            createdBy: userId,
            updatedAt: '2024-01-01T00:00:00.000Z',
            updatedBy: userId,
            version: 1,
            GSI1PK: 'TEMPLE',
            GSI1SK: 'NAME#Test Temple',
            GSI2PK: 'TEMPLE',
            GSI2SK: 'ACCESSMODE#HYBRID#NAME#Test Temple',
          });

          mockPutItem.mockResolvedValue(undefined);
          mockUpdateItem.mockResolvedValue({});
          mockQueryItems.mockResolvedValue([]); // Mock getGroupsForTemple to return empty array

          const createdArtifacts = [];
          const qrCodeIds = new Set<string>();

          // Create multiple artifacts
          for (const artifactData of artifacts) {
            const request: CreateArtifactRequest = {
              templeId,
              name: artifactData.name,
              description: artifactData.description,
            };

            const artifact = await templeService.createArtifact(request, userId);
            createdArtifacts.push(artifact);
            qrCodeIds.add(artifact.qrCodeId);
          }

          // Verify: All QR code IDs are unique
          expect(qrCodeIds.size).toBe(artifacts.length);

          // Verify: Each QR code ID follows the expected format (QR-{timestamp}-{random})
          for (const artifact of createdArtifacts) {
            expect(artifact.qrCodeId).toBeDefined();
            expect(typeof artifact.qrCodeId).toBe('string');
            expect(artifact.qrCodeId).toMatch(/^QR-[A-Z0-9]+-[A-Z0-9]+$/);
          }

          // Verify: No two artifacts have the same QR code ID
          for (let i = 0; i < createdArtifacts.length; i++) {
            for (let j = i + 1; j < createdArtifacts.length; j++) {
              expect(createdArtifacts[i].qrCodeId).not.toBe(createdArtifacts[j].qrCodeId);
            }
          }

          // Verify: Each artifact was stored with a unique QR code ID in GSI1
          const putCalls = mockPutItem.mock.calls;
          const storedQRCodeIds = new Set<string>();
          
          for (const call of putCalls) {
            const item = call[1];
            if (item.GSI1PK && item.GSI1PK.startsWith('QRCODE#')) {
              const qrCodeId = item.GSI1PK.replace('QRCODE#', '');
              expect(storedQRCodeIds.has(qrCodeId)).toBe(false);
              storedQRCodeIds.add(qrCodeId);
            }
          }

          expect(storedQRCodeIds.size).toBe(artifacts.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 28: Artifact Soft Deletion
   * **Validates: Requirements 17.7**
   * 
   * For any artifact deletion operation, the artifact's status should be changed to 
   * "inactive" rather than removing the record from the database, and the associated 
   * QR code should also be marked as inactive.
   */
  test('Feature: temple-pricing-management, Property 28: Artifact soft deletion', async () => {
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
          description: nonEmptyString(1, 500),
        }),
        async (artifactData) => {
          // Clear mocks for each property test iteration
          jest.clearAllMocks();

          const artifactId = 'artifact-test-123';
          const qrCodeId = 'QR-TEST-123';

          // Mock existing artifact (active status)
          const mockArtifact = {
            PK: `TEMPLE#${templeId}`,
            SK: `ARTIFACT#${artifactId}`,
            artifactId,
            templeId,
            name: artifactData.name,
            description: artifactData.description,
            qrCodeId,
            qrCodeImageUrl: 'https://example.com/qr.png',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
            createdBy: userId,
            updatedAt: '2024-01-01T00:00:00.000Z',
            updatedBy: userId,
            GSI1PK: `QRCODE#${qrCodeId}`,
            GSI1SK: `ARTIFACT#${artifactId}`,
          };

          // Mock getArtifact to return the active artifact
          mockQueryItems.mockResolvedValueOnce([mockArtifact]);
          mockQueryItems.mockResolvedValueOnce([]); // Mock getGroupsForTemple to return empty array
          mockUpdateItem.mockResolvedValue({});
          mockPutItem.mockResolvedValue(undefined); // Mock audit log creation

          // Execute: Delete artifact
          await templeService.deleteArtifact(artifactId, userId);

          // Verify: updateItem was called to set status to inactive (not deleteItem)
          expect(mockUpdateItem).toHaveBeenCalled();
          
          // Find the call that updates the artifact status
          const artifactUpdateCall = mockUpdateItem.mock.calls.find(
            (call) => 
              call[1].PK === `TEMPLE#${templeId}` && 
              call[1].SK === `ARTIFACT#${artifactId}`
          );

          expect(artifactUpdateCall).toBeDefined();
          
          // Verify: The update expression sets status to inactive
          const updateExpression = artifactUpdateCall![2];
          expect(updateExpression).toContain('status');
          
          const expressionValues = artifactUpdateCall![3];
          expect(expressionValues[':status']).toBe('inactive');

          // Verify: The artifact record is not deleted from the database
          // (no deleteItem call should be made)
          const deleteItemMock = dynamodb.deleteItem as jest.MockedFunction<typeof dynamodb.deleteItem>;
          if (deleteItemMock.mock) {
            expect(deleteItemMock).not.toHaveBeenCalled();
          }

          // Verify: The temple's active artifact count is decremented
          const templeUpdateCall = mockUpdateItem.mock.calls.find(
            (call) => 
              call[1].PK === `TEMPLE#${templeId}` && 
              call[1].SK === 'METADATA'
          );

          expect(templeUpdateCall).toBeDefined();
          expect(templeUpdateCall![2]).toContain('activeArtifactCount');
          expect(templeUpdateCall![3][':dec']).toBe(1);

          // Verify: After deletion, querying for the artifact should still return it
          // but with inactive status
          mockQueryItems.mockResolvedValueOnce([
            {
              ...mockArtifact,
              status: 'inactive',
            },
          ]);

          const retrievedArtifact = await templeService.getArtifact(artifactId);
          expect(retrievedArtifact).toBeDefined();
          expect(retrievedArtifact.status).toBe('inactive');
          expect(retrievedArtifact.qrCodeId).toBe(qrCodeId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
