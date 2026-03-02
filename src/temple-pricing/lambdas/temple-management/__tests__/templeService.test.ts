/**
 * Unit tests for Temple Service
 */

import * as templeService from '../templeService';
import * as dynamodb from '../../../utils/dynamodb';
import { CreateTempleRequest, UpdateTempleRequest, AccessMode } from '../../../types';
import { NotFoundError, ConflictError, ValidationError } from '../../../utils/errors';

// Mock DynamoDB utilities
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/logger');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;
const mockUpdateItem = dynamodb.updateItem as jest.MockedFunction<typeof dynamodb.updateItem>;
const mockDeleteItem = dynamodb.deleteItem as jest.MockedFunction<typeof dynamodb.deleteItem>;

describe('Temple Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTemple', () => {
    it('should create a temple with valid input', async () => {
      const request: CreateTempleRequest = {
        name: 'Lepakshi Temple',
        location: {
          state: 'Andhra Pradesh',
          city: 'Lepakshi',
          address: 'Lepakshi Village',
        },
        description: 'Famous for hanging pillar',
        accessMode: 'HYBRID',
      };

      mockQueryItems.mockResolvedValue([]);
      mockPutItem.mockResolvedValue();

      const result = await templeService.createTemple(request, 'admin-123');

      expect(result.name).toBe('Lepakshi Temple');
      expect(result.accessMode).toBe('HYBRID');
      expect(result.activeArtifactCount).toBe(0);
      expect(result.status).toBe('active');
      expect(result.version).toBe(1);
      expect(mockPutItem).toHaveBeenCalledTimes(2); // 1 temple + 1 audit log
    });

    it('should default to HYBRID access mode if not specified', async () => {
      const request: CreateTempleRequest = {
        name: 'Test Temple',
        location: {
          state: 'Karnataka',
          city: 'Bangalore',
          address: 'Test Address',
        },
        description: 'Test description',
      };

      mockQueryItems.mockResolvedValue([]);
      mockPutItem.mockResolvedValue();

      const result = await templeService.createTemple(request, 'admin-123');

      expect(result.accessMode).toBe('HYBRID');
    });

    it('should throw ConflictError if temple name already exists', async () => {
      const request: CreateTempleRequest = {
        name: 'Existing Temple',
        location: {
          state: 'Karnataka',
          city: 'Bangalore',
          address: 'Test Address',
        },
        description: 'Test description',
      };

      mockQueryItems.mockResolvedValue([
        {
          templeId: 'existing-id',
          name: 'Existing Temple',
        } as any,
      ]);

      await expect(templeService.createTemple(request, 'admin-123')).rejects.toThrow(
        ConflictError
      );
    });

    it('should throw ValidationError if name is missing', async () => {
      const request: CreateTempleRequest = {
        name: '',
        location: {
          state: 'Karnataka',
          city: 'Bangalore',
          address: 'Test Address',
        },
        description: 'Test description',
      };

      await expect(templeService.createTemple(request, 'admin-123')).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError if location is incomplete', async () => {
      const request: CreateTempleRequest = {
        name: 'Test Temple',
        location: {
          state: '',
          city: '',
          address: '',
        },
        description: 'Test description',
      };

      await expect(templeService.createTemple(request, 'admin-123')).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('getTemple', () => {
    it('should return temple if found', async () => {
      const mockTemple = {
        PK: 'TEMPLE#123',
        SK: 'METADATA',
        templeId: '123',
        name: 'Test Temple',
        location: {
          state: 'Karnataka',
          city: 'Bangalore',
          address: 'Test Address',
        },
        description: 'Test description',
        activeArtifactCount: 5,
        accessMode: 'HYBRID' as AccessMode,
        status: 'active' as const,
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'admin-123',
        version: 1,
        GSI1PK: 'TEMPLE',
        GSI1SK: 'NAME#Test Temple',
        GSI2PK: 'TEMPLE',
        GSI2SK: 'ACCESSMODE#HYBRID#NAME#Test Temple',
      };

      mockGetItem.mockResolvedValue(mockTemple);

      const result = await templeService.getTemple('123');

      expect(result.templeId).toBe('123');
      expect(result.name).toBe('Test Temple');
      expect(result.activeArtifactCount).toBe(5);
    });

    it('should throw NotFoundError if temple does not exist', async () => {
      mockGetItem.mockResolvedValue(null);

      await expect(templeService.getTemple('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listTemples', () => {
    it('should list all temples', async () => {
      const mockTemples = [
        {
          templeId: '1',
          name: 'Temple 1',
          status: 'active',
          accessMode: 'HYBRID',
        },
        {
          templeId: '2',
          name: 'Temple 2',
          status: 'active',
          accessMode: 'QR_CODE_SCAN',
        },
      ] as any[];

      mockQueryItems.mockResolvedValue(mockTemples);

      const result = await templeService.listTemples();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter temples by access mode', async () => {
      const mockTemples = [
        {
          templeId: '1',
          name: 'Temple 1',
          status: 'active',
          accessMode: 'HYBRID',
        },
      ] as any[];

      mockQueryItems.mockResolvedValue(mockTemples);

      const result = await templeService.listTemples({ accessMode: 'HYBRID' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].accessMode).toBe('HYBRID');
    });

    it('should filter temples by status', async () => {
      const mockTemples = [
        {
          templeId: '1',
          name: 'Temple 1',
          status: 'active',
          accessMode: 'HYBRID',
        },
        {
          templeId: '2',
          name: 'Temple 2',
          status: 'inactive',
          accessMode: 'HYBRID',
        },
      ] as any[];

      mockQueryItems.mockResolvedValue(mockTemples);

      const result = await templeService.listTemples({ status: 'active' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('active');
    });
  });

  describe('updateTemple', () => {
    const existingTemple = {
      PK: 'TEMPLE#123',
      SK: 'METADATA',
      templeId: '123',
      name: 'Old Name',
      location: {
        state: 'Karnataka',
        city: 'Bangalore',
        address: 'Old Address',
      },
      description: 'Old description',
      activeArtifactCount: 5,
      accessMode: 'HYBRID' as AccessMode,
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin-123',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'admin-123',
      version: 1,
      GSI1PK: 'TEMPLE',
      GSI1SK: 'NAME#Old Name',
      GSI2PK: 'TEMPLE',
      GSI2SK: 'ACCESSMODE#HYBRID#NAME#Old Name',
    };

    it('should update temple name', async () => {
      mockGetItem.mockResolvedValue(existingTemple);
      mockQueryItems.mockResolvedValue([]);
      mockUpdateItem.mockResolvedValue({
        ...existingTemple,
        name: 'New Name',
        version: 2,
      });

      const request: UpdateTempleRequest = {
        name: 'New Name',
      };

      const result = await templeService.updateTemple('123', request, 'admin-123');

      expect(result.name).toBe('New Name');
      expect(result.version).toBe(2);
    });

    it('should update access mode', async () => {
      mockGetItem.mockResolvedValue(existingTemple);
      mockUpdateItem.mockResolvedValue({
        ...existingTemple,
        accessMode: 'OFFLINE_DOWNLOAD',
        version: 2,
      });

      const request: UpdateTempleRequest = {
        accessMode: 'OFFLINE_DOWNLOAD',
      };

      const result = await templeService.updateTemple('123', request, 'admin-123');

      expect(result.accessMode).toBe('OFFLINE_DOWNLOAD');
    });

    it('should throw ConflictError if name already exists', async () => {
      mockGetItem.mockResolvedValue(existingTemple);
      mockQueryItems.mockResolvedValue([
        {
          templeId: 'different-id',
          name: 'Existing Name',
        } as any,
      ]);

      const request: UpdateTempleRequest = {
        name: 'Existing Name',
      };

      await expect(templeService.updateTemple('123', request, 'admin-123')).rejects.toThrow(
        ConflictError
      );
    });

    it('should return existing temple if no updates provided', async () => {
      mockGetItem.mockResolvedValue(existingTemple);

      const request: UpdateTempleRequest = {};

      const result = await templeService.updateTemple('123', request, 'admin-123');

      expect(result.name).toBe('Old Name');
      expect(mockUpdateItem).not.toHaveBeenCalled();
    });
  });

  describe('deleteTemple', () => {
    it('should delete temple if exists', async () => {
      const mockTemple = {
        templeId: '123',
        name: 'Test Temple',
      } as any;

      mockGetItem.mockResolvedValue(mockTemple);
      mockDeleteItem.mockResolvedValue();

      await templeService.deleteTemple('123', 'admin-123');

      expect(mockDeleteItem).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError if temple does not exist', async () => {
      mockGetItem.mockResolvedValue(null);

      await expect(templeService.deleteTemple('non-existent', 'admin-123')).rejects.toThrow(NotFoundError);
    });
  });
});


describe('QR Code Count Tracking', () => {
  describe('getQRCodeCount', () => {
    it('should return active artifact count for a temple', async () => {
      const templeId = 'temple-123';
      
      mockGetItem.mockResolvedValue({
        templeId,
        name: 'Test Temple',
        activeArtifactCount: 5,
        status: 'active',
      } as any);

      const count = await templeService.getQRCodeCount('TEMPLE', templeId);

      expect(count).toBe(5);
      expect(mockGetItem).toHaveBeenCalled();
    });

    it('should return total QR code count for a temple group', async () => {
      const groupId = 'group-123';
      
      mockGetItem.mockResolvedValueOnce({
        groupId,
        name: 'Test Group',
        totalQRCodeCount: 15,
        status: 'active',
      } as any);

      const count = await templeService.getQRCodeCount('GROUP', groupId);

      expect(count).toBe(15);
      expect(mockGetItem).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid entity type', async () => {
      await expect(
        templeService.getQRCodeCount('INVALID' as any, 'entity-123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if temple does not exist', async () => {
      mockGetItem.mockResolvedValue(null);

      await expect(
        templeService.getQRCodeCount('TEMPLE', 'nonexistent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('recalculateQRCodeCounts', () => {
    it('should recalculate temple QR code count based on active artifacts', async () => {
      const templeId = 'temple-123';
      
      // Mock getTemple
      mockGetItem.mockResolvedValueOnce({
        templeId,
        name: 'Test Temple',
        activeArtifactCount: 3,
        status: 'active',
      } as any);

      // Mock listArtifacts - return 5 active artifacts
      mockQueryItems.mockResolvedValueOnce([
        { artifactId: '1', status: 'active' },
        { artifactId: '2', status: 'active' },
        { artifactId: '3', status: 'active' },
        { artifactId: '4', status: 'active' },
        { artifactId: '5', status: 'active' },
      ] as any);

      // Mock getGroupsForTemple - no groups
      mockQueryItems.mockResolvedValueOnce([]);

      mockUpdateItem.mockResolvedValue({} as any);

      await templeService.recalculateQRCodeCounts('TEMPLE', templeId, 'admin-123');

      // Verify updateItem was called with the correct count
      expect(mockUpdateItem).toHaveBeenCalled();
      const updateCall = mockUpdateItem.mock.calls[0];
      expect(updateCall[3]).toMatchObject({
        ':count': 5,
        ':userId': 'admin-123',
      });
    });

    it('should recalculate temple group QR code count based on all temples', async () => {
      const groupId = 'group-123';
      const temple1Id = 'temple-1';
      const temple2Id = 'temple-2';
      
      // Mock getTempleGroup
      mockGetItem.mockResolvedValueOnce({
        groupId,
        name: 'Test Group',
        templeIds: [temple1Id, temple2Id],
        totalQRCodeCount: 10,
        status: 'active',
      } as any);

      // Mock getTemple for temple1
      mockGetItem.mockResolvedValueOnce({
        templeId: temple1Id,
        name: 'Temple 1',
        activeArtifactCount: 7,
        status: 'active',
      } as any);

      // Mock getTemple for temple2
      mockGetItem.mockResolvedValueOnce({
        templeId: temple2Id,
        name: 'Temple 2',
        activeArtifactCount: 5,
        status: 'active',
      } as any);

      mockUpdateItem.mockResolvedValue({} as any);

      await templeService.recalculateQRCodeCounts('GROUP', groupId, 'admin-123');

      // Verify updateItem was called with the correct count
      expect(mockUpdateItem).toHaveBeenCalled();
      const updateCalls = mockUpdateItem.mock.calls;
      const groupUpdateCall = updateCalls.find(call => 
        call[2].includes('totalQRCodeCount')
      );
      expect(groupUpdateCall).toBeDefined();
      if (groupUpdateCall) {
        expect(groupUpdateCall[3]).toMatchObject({
          ':count': 12, // 7 + 5
          ':userId': 'admin-123',
        });
      }
    });

    it('should update all temple groups when recalculating temple count', async () => {
      const templeId = 'temple-123';
      
      // Mock getTemple
      mockGetItem.mockResolvedValue({
        templeId,
        name: 'Test Temple',
        activeArtifactCount: 2,
        status: 'active',
      } as any);

      // Mock listArtifacts
      mockQueryItems.mockResolvedValueOnce([
        { artifactId: '1', status: 'active' },
        { artifactId: '2', status: 'active' },
      ] as any);

      // Mock getGroupsForTemple - return empty array (no groups)
      mockQueryItems.mockResolvedValueOnce([]);

      mockUpdateItem.mockResolvedValue({} as any);

      const initialCallCount = mockUpdateItem.mock.calls.length;
      await templeService.recalculateQRCodeCounts('TEMPLE', templeId, 'admin-123');

      // Should update temple only (no groups) - 1 new call
      expect(mockUpdateItem).toHaveBeenCalledTimes(initialCallCount + 1);
      const updateCall = mockUpdateItem.mock.calls[mockUpdateItem.mock.calls.length - 1];
      expect(updateCall[3]).toMatchObject({
        ':count': 2,
        ':userId': 'admin-123',
      });
    });

    it('should throw ValidationError for invalid entity type', async () => {
      await expect(
        templeService.recalculateQRCodeCounts('INVALID' as any, 'entity-123', 'admin-123')
      ).rejects.toThrow(ValidationError);
    });
  });
});
