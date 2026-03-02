/**
 * Unit tests for bulk operations
 */

import * as templeService from '../templeService';
import * as dynamodb from '../../../utils/dynamodb';
import { BulkUpdateTempleRequest } from '../../../types';

jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/logger');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;
const mockUpdateItem = dynamodb.updateItem as jest.MockedFunction<typeof dynamodb.updateItem>;
const mockDeleteItem = dynamodb.deleteItem as jest.MockedFunction<typeof dynamodb.deleteItem>;

describe('Bulk Operations', () => {
  const userId = 'admin-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bulkUpdateTemples', () => {
    it('should successfully update all temples when all operations succeed', async () => {
      // Mock getItem to return existing temples for each call (called by getTemple)
      mockGetItem
        .mockResolvedValueOnce({
          PK: 'TEMPLE#temple-1',
          SK: 'METADATA',
          templeId: 'temple-1',
          name: 'Old Temple 1',
          location: { state: 'Karnataka', city: 'Bangalore', address: '123 Temple St' },
          description: 'Old description',
          activeArtifactCount: 5,
          accessMode: 'HYBRID',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedAt: '2024-01-01T00:00:00Z',
          updatedBy: 'admin',
          version: 1,
        })
        .mockResolvedValueOnce({
          PK: 'TEMPLE#temple-2',
          SK: 'METADATA',
          templeId: 'temple-2',
          name: 'Old Temple 2',
          location: { state: 'Karnataka', city: 'Mysore', address: '456 Temple St' },
          description: 'Old description 2',
          activeArtifactCount: 3,
          accessMode: 'HYBRID',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedAt: '2024-01-01T00:00:00Z',
          updatedBy: 'admin',
          version: 1,
        })
        .mockResolvedValueOnce({
          PK: 'TEMPLE#temple-3',
          SK: 'METADATA',
          templeId: 'temple-3',
          name: 'Old Temple 3',
          location: { state: 'Karnataka', city: 'Hampi', address: '789 Temple St' },
          description: 'Old description 3',
          activeArtifactCount: 7,
          accessMode: 'QR_CODE_SCAN',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedAt: '2024-01-01T00:00:00Z',
          updatedBy: 'admin',
          version: 1,
        });

      // Mock queryItems to return empty (no name conflicts)
      mockQueryItems.mockResolvedValue([]);

      // Mock updateItem to succeed
      mockUpdateItem.mockResolvedValue({
        templeId: 'temple-1',
        name: 'Updated Temple',
        location: { state: 'Karnataka', city: 'Bangalore', address: '123 Temple St' },
        description: 'Updated description',
        activeArtifactCount: 5,
        accessMode: 'HYBRID',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2024-01-02T00:00:00Z',
        updatedBy: userId,
        version: 2,
      });

      // Mock putItem for audit log
      mockPutItem.mockResolvedValue();

      const updates: BulkUpdateTempleRequest[] = [
        { templeId: 'temple-1', updates: { name: 'Updated Temple 1' } },
        { templeId: 'temple-2', updates: { description: 'Updated description 2' } },
        { templeId: 'temple-3', updates: { accessMode: 'OFFLINE_DOWNLOAD' } },
      ];

      const result = await templeService.bulkUpdateTemples(updates, userId);

      expect(result.totalProcessed).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(mockUpdateItem).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures', async () => {
      // Mock getItem to return temple for first and third, but fail for second
      mockGetItem
        .mockResolvedValueOnce({
          PK: 'TEMPLE#temple-1',
          SK: 'METADATA',
          templeId: 'temple-1',
          name: 'Temple 1',
          location: { state: 'KA', city: 'BLR', address: '123' },
          description: 'Desc',
          activeArtifactCount: 5,
          accessMode: 'HYBRID',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedAt: '2024-01-01T00:00:00Z',
          updatedBy: 'admin',
          version: 1,
        })
        .mockResolvedValueOnce(undefined) // Temple 2 not found
        .mockResolvedValueOnce({
          PK: 'TEMPLE#temple-3',
          SK: 'METADATA',
          templeId: 'temple-3',
          name: 'Temple 3',
          location: { state: 'KA', city: 'MYS', address: '456' },
          description: 'Desc',
          activeArtifactCount: 3,
          accessMode: 'QR_CODE_SCAN',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedAt: '2024-01-01T00:00:00Z',
          updatedBy: 'admin',
          version: 1,
        });

      // Mock queryItems to return empty (no name conflicts)
      mockQueryItems.mockResolvedValue([]);

      mockUpdateItem.mockResolvedValue({});
      mockPutItem.mockResolvedValue();

      const updates: BulkUpdateTempleRequest[] = [
        { templeId: 'temple-1', updates: { name: 'Updated Temple 1' } },
        { templeId: 'temple-2', updates: { name: 'Updated Temple 2' } },
        { templeId: 'temple-3', updates: { name: 'Updated Temple 3' } },
      ];

      const result = await templeService.bulkUpdateTemples(updates, userId);

      expect(result.totalProcessed).toBe(3);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(result.failed[0].entityId).toBe('temple-2');
    });
  });

  describe('bulkDeleteTemples', () => {
    it('should successfully delete all temples', async () => {
      // Mock getItem to return temples
      mockGetItem.mockResolvedValue({
        PK: 'TEMPLE#temple-1',
        SK: 'METADATA',
        templeId: 'temple-1',
        name: 'Temple 1',
        location: { state: 'KA', city: 'BLR', address: '123' },
        description: 'Desc',
        activeArtifactCount: 5,
        accessMode: 'HYBRID',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'admin',
        version: 1,
      });

      // Mock queryItems to return no groups (temple not in any group)
      mockQueryItems.mockResolvedValue([]);

      // Mock deleteItem to succeed
      mockDeleteItem.mockResolvedValue();

      // Mock putItem for audit log
      mockPutItem.mockResolvedValue();

      const result = await templeService.bulkDeleteTemples(['temple-1', 'temple-2'], userId);

      expect(result.totalProcessed).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('should fail to delete temples in groups', async () => {
      // Mock getItem to return temple
      mockGetItem.mockResolvedValue({
        PK: 'TEMPLE#temple-1',
        SK: 'METADATA',
        templeId: 'temple-1',
        name: 'Temple 1',
        location: { state: 'KA', city: 'BLR', address: '123' },
        description: 'Desc',
        activeArtifactCount: 5,
        accessMode: 'HYBRID',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'admin',
        version: 1,
      });

      // Mock queryItems to return groups (temple is in a group)
      mockQueryItems.mockResolvedValue([{
        PK: 'GROUP#group-1',
        SK: 'METADATA',
        groupId: 'group-1',
        name: 'Karnataka Temples',
        description: 'Group',
        templeIds: ['temple-1'],
        totalTempleCount: 1,
        totalQRCodeCount: 5,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'admin',
        version: 1,
      }]);

      // Mock putItem for audit log
      mockPutItem.mockResolvedValue();

      const result = await templeService.bulkDeleteTemples(['temple-1'], userId);

      expect(result.totalProcessed).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.failed[0].error).toContain('Cannot delete temple');
    });
  });
});
