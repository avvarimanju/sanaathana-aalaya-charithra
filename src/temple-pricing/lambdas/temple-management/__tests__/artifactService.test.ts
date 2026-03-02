/**
 * Unit tests for Artifact CRUD operations
 */

import {
  createArtifact,
  getArtifact,
  getArtifactByQRCode,
  listArtifacts,
  updateArtifact,
  deleteArtifact,
  generateQRCode,
} from '../templeService';
import { CreateArtifactRequest, UpdateArtifactRequest } from '../../../types';
import * as dynamodb from '../../../utils/dynamodb';
import { NotFoundError, ValidationError } from '../../../utils/errors';

// Mock dependencies
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/logger');
jest.mock('qrcode');
jest.mock('@aws-sdk/client-s3');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;
const mockUpdateItem = dynamodb.updateItem as jest.MockedFunction<typeof dynamodb.updateItem>;

describe('Artifact Service', () => {
  const userId = 'test-user-123';
  const templeId = 'temple-123';
  const artifactId = 'artifact-123';
  const qrCodeId = 'QR-TEST-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // Mock QRCode library
    const QRCode = require('qrcode');
    QRCode.toBuffer = jest.fn().mockResolvedValue(Buffer.from('fake-qr-code'));
    
    // Mock S3 client
    const { S3Client } = require('@aws-sdk/client-s3');
    S3Client.prototype.send = jest.fn().mockResolvedValue({});
  });

  describe('createArtifact', () => {
    it('should create an artifact with QR code generation', async () => {
      const request: CreateArtifactRequest = {
        templeId,
        name: 'Hanging Pillar',
        description: 'A pillar that hangs from the ceiling',
      };

      const mockTemple = {
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
      };

      // Mock temple exists (getTemple is called by getGroupsForTemple)
      mockGetItem.mockResolvedValue(mockTemple);

      // Mock getGroupsForTemple (returns empty array - no groups)
      mockQueryItems.mockResolvedValueOnce([]);

      mockPutItem.mockResolvedValueOnce();
      mockUpdateItem.mockResolvedValueOnce({});

      const result = await createArtifact(request, userId);

      expect(result).toMatchObject({
        templeId,
        name: request.name,
        description: request.description,
        status: 'active',
      });
      expect(result.artifactId).toBeDefined();
      expect(result.qrCodeId).toBeDefined();
      expect(result.qrCodeImageUrl).toBeDefined();
      expect(mockPutItem).toHaveBeenCalledTimes(2); // 1 artifact + 1 audit log
      expect(mockUpdateItem).toHaveBeenCalledTimes(1); // Increment artifact count
    });

    it('should throw ValidationError for missing name', async () => {
      const request: CreateArtifactRequest = {
        templeId,
        name: '',
        description: 'Test description',
      };

      await expect(createArtifact(request, userId)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing description', async () => {
      const request: CreateArtifactRequest = {
        templeId,
        name: 'Test Artifact',
        description: '',
      };

      await expect(createArtifact(request, userId)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if temple does not exist', async () => {
      const request: CreateArtifactRequest = {
        templeId: 'non-existent-temple',
        name: 'Test Artifact',
        description: 'Test description',
      };

      mockGetItem.mockResolvedValueOnce(null);

      await expect(createArtifact(request, userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getArtifact', () => {
    it('should retrieve an artifact by ID', async () => {
      const mockArtifact = {
        PK: `TEMPLE#${templeId}`,
        SK: `ARTIFACT#${artifactId}`,
        artifactId,
        templeId,
        name: 'Test Artifact',
        description: 'Test description',
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

      mockQueryItems.mockResolvedValue([mockArtifact]);

      const result = await getArtifact(artifactId);

      expect(result).toMatchObject({
        artifactId,
        templeId,
        name: 'Test Artifact',
        description: 'Test description',
        qrCodeId,
        status: 'active',
      });
    });

    it('should throw NotFoundError if artifact does not exist', async () => {
      mockQueryItems.mockResolvedValue([]);

      await expect(getArtifact('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getArtifactByQRCode', () => {
    it('should retrieve an artifact by QR code ID', async () => {
      const mockArtifact = {
        PK: `TEMPLE#${templeId}`,
        SK: `ARTIFACT#${artifactId}`,
        artifactId,
        templeId,
        name: 'Test Artifact',
        description: 'Test description',
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

      mockQueryItems.mockResolvedValue([mockArtifact]);

      const result = await getArtifactByQRCode(qrCodeId);

      expect(result).toMatchObject({
        artifactId,
        qrCodeId,
        name: 'Test Artifact',
      });
    });

    it('should throw NotFoundError if QR code does not exist', async () => {
      mockQueryItems.mockResolvedValue([]);

      await expect(getArtifactByQRCode('non-existent-qr')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listArtifacts', () => {
    it('should list artifacts for a temple', async () => {
      const mockArtifacts = [
        {
          PK: `TEMPLE#${templeId}`,
          SK: `ARTIFACT#artifact-1`,
          artifactId: 'artifact-1',
          templeId,
          name: 'Artifact 1',
          description: 'Description 1',
          qrCodeId: 'QR-1',
          qrCodeImageUrl: 'https://example.com/qr1.png',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          createdBy: userId,
          updatedAt: '2024-01-01T00:00:00.000Z',
          updatedBy: userId,
          GSI1PK: 'QRCODE#QR-1',
          GSI1SK: 'ARTIFACT#artifact-1',
        },
        {
          PK: `TEMPLE#${templeId}`,
          SK: `ARTIFACT#artifact-2`,
          artifactId: 'artifact-2',
          templeId,
          name: 'Artifact 2',
          description: 'Description 2',
          qrCodeId: 'QR-2',
          qrCodeImageUrl: 'https://example.com/qr2.png',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          createdBy: userId,
          updatedAt: '2024-01-01T00:00:00.000Z',
          updatedBy: userId,
          GSI1PK: 'QRCODE#QR-2',
          GSI1SK: 'ARTIFACT#artifact-2',
        },
      ];

      mockQueryItems.mockResolvedValue(mockArtifacts);

      const result = await listArtifacts(templeId);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Artifact 1');
      expect(result.items[1].name).toBe('Artifact 2');
    });

    it('should filter artifacts by status', async () => {
      const mockArtifacts = [
        {
          PK: `TEMPLE#${templeId}`,
          SK: `ARTIFACT#artifact-1`,
          artifactId: 'artifact-1',
          templeId,
          name: 'Artifact 1',
          description: 'Description 1',
          qrCodeId: 'QR-1',
          qrCodeImageUrl: 'https://example.com/qr1.png',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          createdBy: userId,
          updatedAt: '2024-01-01T00:00:00.000Z',
          updatedBy: userId,
          GSI1PK: 'QRCODE#QR-1',
          GSI1SK: 'ARTIFACT#artifact-1',
        },
        {
          PK: `TEMPLE#${templeId}`,
          SK: `ARTIFACT#artifact-2`,
          artifactId: 'artifact-2',
          templeId,
          name: 'Artifact 2',
          description: 'Description 2',
          qrCodeId: 'QR-2',
          qrCodeImageUrl: 'https://example.com/qr2.png',
          status: 'inactive',
          createdAt: '2024-01-01T00:00:00.000Z',
          createdBy: userId,
          updatedAt: '2024-01-01T00:00:00.000Z',
          updatedBy: userId,
          GSI1PK: 'QRCODE#QR-2',
          GSI1SK: 'ARTIFACT#artifact-2',
        },
      ];

      mockQueryItems.mockResolvedValue(mockArtifacts);

      const result = await listArtifacts(templeId, 'active');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('active');
    });

    it('should throw ValidationError if templeId is not provided', async () => {
      await expect(listArtifacts()).rejects.toThrow(ValidationError);
    });
  });

  describe('updateArtifact', () => {
    it('should update artifact name', async () => {
      const mockArtifact = {
        PK: `TEMPLE#${templeId}`,
        SK: `ARTIFACT#${artifactId}`,
        artifactId,
        templeId,
        name: 'Old Name',
        description: 'Test description',
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

      const updatedArtifact = { ...mockArtifact, name: 'New Name' };

      // First call: getArtifact (before update)
      mockQueryItems.mockResolvedValueOnce([mockArtifact]);
      // Update call
      mockUpdateItem.mockResolvedValueOnce({});
      // Audit log
      mockPutItem.mockResolvedValueOnce();
      // Second call: getArtifact (after update)
      mockQueryItems.mockResolvedValueOnce([updatedArtifact]);

      const updates: UpdateArtifactRequest = {
        name: 'New Name',
      };

      const result = await updateArtifact(artifactId, updates, userId);

      expect(result.name).toBe('New Name');
      expect(mockUpdateItem).toHaveBeenCalledTimes(1);
    });

    it('should update artifact status', async () => {
      const mockArtifact = {
        PK: `TEMPLE#${templeId}`,
        SK: `ARTIFACT#${artifactId}`,
        artifactId,
        templeId,
        name: 'Test Artifact',
        description: 'Test description',
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

      const updatedArtifact = { ...mockArtifact, status: 'inactive' };

      // First call: getArtifact (before update)
      mockQueryItems.mockResolvedValueOnce([mockArtifact]);
      // Update call
      mockUpdateItem.mockResolvedValueOnce({});
      // Audit log
      mockPutItem.mockResolvedValueOnce();
      // Second call: getArtifact (after update)
      mockQueryItems.mockResolvedValueOnce([updatedArtifact]);

      const updates: UpdateArtifactRequest = {
        status: 'inactive',
      };

      const result = await updateArtifact(artifactId, updates, userId);

      expect(result.status).toBe('inactive');
    });

    it('should throw ValidationError for empty updates', async () => {
      const mockArtifact = {
        PK: `TEMPLE#${templeId}`,
        SK: `ARTIFACT#${artifactId}`,
        artifactId,
        templeId,
        name: 'Test Artifact',
        description: 'Test description',
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

      mockQueryItems.mockResolvedValueOnce([mockArtifact]);

      await expect(updateArtifact(artifactId, {}, userId)).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteArtifact', () => {
    it('should soft delete an artifact', async () => {
      const mockArtifact = {
        PK: `TEMPLE#${templeId}`,
        SK: `ARTIFACT#${artifactId}`,
        artifactId,
        templeId,
        name: 'Test Artifact',
        description: 'Test description',
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

      const mockTemple = {
        PK: `TEMPLE#${templeId}`,
        SK: 'METADATA',
        templeId,
        name: 'Test Temple',
        status: 'active',
        activeArtifactCount: 1,
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
      };

      // First call: getArtifact
      mockQueryItems.mockResolvedValueOnce([mockArtifact]);
      // Second call: getTemple (for getGroupsForTemple)
      mockGetItem.mockResolvedValueOnce(mockTemple);
      // Third call: getGroupsForTemple
      mockQueryItems.mockResolvedValueOnce([]); // No groups
      // Update artifact status to inactive
      mockUpdateItem.mockResolvedValueOnce({});
      // Decrement temple artifact count
      mockUpdateItem.mockResolvedValueOnce({});
      // Audit log
      mockPutItem.mockResolvedValueOnce();

      await deleteArtifact(artifactId, userId);

      expect(mockUpdateItem).toHaveBeenCalledTimes(2); // Set status to inactive + decrement count
      expect(mockPutItem).toHaveBeenCalledTimes(1); // Audit log
    });

    it('should throw NotFoundError if artifact does not exist', async () => {
      mockQueryItems.mockResolvedValueOnce([]);

      await expect(deleteArtifact('non-existent', userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('generateQRCode', () => {
    it('should return existing QR code info', async () => {
      const mockArtifact = {
        PK: `TEMPLE#${templeId}`,
        SK: `ARTIFACT#${artifactId}`,
        artifactId,
        templeId,
        name: 'Test Artifact',
        description: 'Test description',
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

      mockQueryItems.mockResolvedValue([mockArtifact]);

      const result = await generateQRCode(artifactId);

      expect(result).toEqual({
        qrCodeId,
        qrCodeImageUrl: 'https://example.com/qr.png',
      });
    });
  });
});
