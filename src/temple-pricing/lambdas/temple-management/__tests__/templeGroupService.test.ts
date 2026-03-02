/**
 * Unit tests for Temple Group Service
 */

import * as templeService from '../templeService';
import * as dynamodb from '../../../utils/dynamodb';
import { CreateGroupRequest, UpdateGroupRequest } from '../../../types';
import { ValidationError, NotFoundError } from '../../../utils/errors';

// Mock DynamoDB utilities
jest.mock('../../../utils/dynamodb');
jest.mock('../../../utils/logger');

const mockPutItem = dynamodb.putItem as jest.MockedFunction<typeof dynamodb.putItem>;
const mockGetItem = dynamodb.getItem as jest.MockedFunction<typeof dynamodb.getItem>;
const mockQueryItems = dynamodb.queryItems as jest.MockedFunction<typeof dynamodb.queryItems>;
const mockUpdateItem = dynamodb.updateItem as jest.MockedFunction<typeof dynamodb.updateItem>;
const mockDeleteItem = dynamodb.deleteItem as jest.MockedFunction<typeof dynamodb.deleteItem>;

describe('Temple Group Service', () => {
  const mockUserId = 'admin-123';
  const mockTimestamp = '2024-01-01T00:00:00.000Z';

  beforeEach(() => {
    jest.clearAllMocks();
    (dynamodb.generateTimestamp as jest.Mock).mockReturnValue(mockTimestamp);
  });

  describe('createTempleGroup', () => {
    it('should create a temple group with valid input', async () => {
      const request: CreateGroupRequest = {
        name: 'Tirumala Temples',
        description: 'Famous temples in Tirumala',
        templeIds: ['temple-1', 'temple-2'],
      };

      // Mock temple lookups
      mockGetItem
        .mockResolvedValueOnce({
          templeId: 'temple-1',
          name: 'Temple 1',
          activeArtifactCount: 5,
        })
        .mockResolvedValueOnce({
          templeId: 'temple-2',
          name: 'Temple 2',
          activeArtifactCount: 7,
        });

      mockPutItem.mockResolvedValue();

      const result = await templeService.createTempleGroup(request, mockUserId);

      expect(result.name).toBe('Tirumala Temples');
      expect(result.description).toBe('Famous temples in Tirumala');
      expect(result.templeIds).toEqual(['temple-1', 'temple-2']);
      expect(result.totalTempleCount).toBe(2);
      expect(result.totalQRCodeCount).toBe(12); // 5 + 7
      expect(result.status).toBe('active');
      expect(result.createdBy).toBe(mockUserId);
      expect(result.version).toBe(1);
      expect(mockPutItem).toHaveBeenCalledTimes(4); // 1 group + 2 associations + 1 audit log
    });

    it('should reject group with empty temple list', async () => {
      const request: CreateGroupRequest = {
        name: 'Empty Group',
        description: 'Group with no temples',
        templeIds: [],
      };

      await expect(
        templeService.createTempleGroup(request, mockUserId)
      ).rejects.toThrow(ValidationError);
    });

    it('should reject group with missing name', async () => {
      const request: CreateGroupRequest = {
        name: '',
        description: 'Group with no name',
        templeIds: ['temple-1'],
      };

      await expect(
        templeService.createTempleGroup(request, mockUserId)
      ).rejects.toThrow(ValidationError);
    });

    it('should reject group with non-existent temple', async () => {
      const request: CreateGroupRequest = {
        name: 'Test Group',
        description: 'Group with invalid temple',
        templeIds: ['invalid-temple'],
      };

      mockGetItem.mockResolvedValue(null);

      await expect(
        templeService.createTempleGroup(request, mockUserId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTempleGroup', () => {
    it('should retrieve an existing temple group', async () => {
      const mockGroup = {
        PK: 'GROUP#group-1',
        SK: 'METADATA',
        groupId: 'group-1',
        name: 'Test Group',
        description: 'Test description',
        templeIds: ['temple-1', 'temple-2'],
        totalTempleCount: 2,
        totalQRCodeCount: 10,
        status: 'active',
        createdAt: mockTimestamp,
        createdBy: mockUserId,
        updatedAt: mockTimestamp,
        updatedBy: mockUserId,
        version: 1,
        GSI1PK: 'GROUP',
        GSI1SK: 'NAME#Test Group',
      };

      mockGetItem.mockResolvedValue(mockGroup);

      const result = await templeService.getTempleGroup('group-1');

      expect(result.groupId).toBe('group-1');
      expect(result.name).toBe('Test Group');
      expect(result.templeIds).toEqual(['temple-1', 'temple-2']);
      expect(result.totalQRCodeCount).toBe(10);
    });

    it('should throw NotFoundError for non-existent group', async () => {
      mockGetItem.mockResolvedValue(null);

      await expect(templeService.getTempleGroup('invalid-id')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('listTempleGroups', () => {
    it('should list all temple groups', async () => {
      const mockGroups = [
        {
          groupId: 'group-1',
          name: 'Group 1',
          status: 'active',
          totalTempleCount: 2,
          templeIds: ['temple-1'],
          totalQRCodeCount: 5,
          description: 'Test',
          createdAt: mockTimestamp,
          createdBy: mockUserId,
          updatedAt: mockTimestamp,
          updatedBy: mockUserId,
          version: 1,
        },
        {
          groupId: 'group-2',
          name: 'Group 2',
          status: 'active',
          totalTempleCount: 3,
          templeIds: ['temple-2'],
          totalQRCodeCount: 7,
          description: 'Test',
          createdAt: mockTimestamp,
          createdBy: mockUserId,
          updatedAt: mockTimestamp,
          updatedBy: mockUserId,
          version: 1,
        },
      ];

      mockQueryItems.mockResolvedValue(mockGroups as any);

      const result = await templeService.listTempleGroups();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter groups by status', async () => {
      const mockGroups = [
        {
          groupId: 'group-1',
          name: 'Group 1',
          status: 'active',
          templeIds: ['temple-1'],
          totalTempleCount: 1,
          totalQRCodeCount: 5,
          description: 'Test',
          createdAt: mockTimestamp,
          createdBy: mockUserId,
          updatedAt: mockTimestamp,
          updatedBy: mockUserId,
          version: 1,
        },
        {
          groupId: 'group-2',
          name: 'Group 2',
          status: 'inactive',
          templeIds: ['temple-2'],
          totalTempleCount: 1,
          totalQRCodeCount: 7,
          description: 'Test',
          createdAt: mockTimestamp,
          createdBy: mockUserId,
          updatedAt: mockTimestamp,
          updatedBy: mockUserId,
          version: 1,
        },
      ];

      mockQueryItems.mockResolvedValue(mockGroups as any);

      const result = await templeService.listTempleGroups({ status: 'active' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].groupId).toBe('group-1');
    });
  });

  describe('updateTempleGroup', () => {
    it('should update temple group name', async () => {
      const mockExistingGroup = {
        groupId: 'group-1',
        name: 'Old Name',
        description: 'Description',
        templeIds: ['temple-1'],
        totalTempleCount: 1,
        totalQRCodeCount: 5,
        status: 'active' as const,
        version: 1,
        createdAt: mockTimestamp,
        createdBy: mockUserId,
        updatedAt: mockTimestamp,
        updatedBy: mockUserId,
      };

      mockGetItem.mockResolvedValue({
        ...mockExistingGroup,
        PK: 'GROUP#group-1',
        SK: 'METADATA',
        GSI1PK: 'GROUP',
        GSI1SK: 'NAME#Old Name',
      });

      mockUpdateItem.mockResolvedValue({
        ...mockExistingGroup,
        name: 'New Name',
        version: 2,
      } as any);

      const request: UpdateGroupRequest = {
        name: 'New Name',
      };

      const result = await templeService.updateTempleGroup('group-1', request, mockUserId);

      expect(result.name).toBe('New Name');
      expect(result.version).toBe(2);
    });

    it('should return existing group when no updates provided', async () => {
      const mockExistingGroup = {
        groupId: 'group-1',
        name: 'Group Name',
        description: 'Description',
        templeIds: ['temple-1'],
        totalTempleCount: 1,
        totalQRCodeCount: 5,
        status: 'active' as const,
        version: 1,
        createdAt: mockTimestamp,
        createdBy: mockUserId,
        updatedAt: mockTimestamp,
        updatedBy: mockUserId,
      };

      mockGetItem.mockResolvedValue({
        ...mockExistingGroup,
        PK: 'GROUP#group-1',
        SK: 'METADATA',
        GSI1PK: 'GROUP',
        GSI1SK: 'NAME#Group Name',
      });

      const request: UpdateGroupRequest = {};

      const result = await templeService.updateTempleGroup('group-1', request, mockUserId);

      expect(result.groupId).toBe('group-1');
      expect(result.version).toBe(1);
      expect(mockUpdateItem).not.toHaveBeenCalled();
    });
  });

  describe('deleteTempleGroup', () => {
    it('should delete temple group and associations', async () => {
      const mockGroup = {
        groupId: 'group-1',
        name: 'Test Group',
        description: 'Description',
        templeIds: ['temple-1', 'temple-2'],
        totalTempleCount: 2,
        totalQRCodeCount: 10,
        status: 'active' as const,
        version: 1,
        createdAt: mockTimestamp,
        createdBy: mockUserId,
        updatedAt: mockTimestamp,
        updatedBy: mockUserId,
      };

      mockGetItem.mockResolvedValue({
        ...mockGroup,
        PK: 'GROUP#group-1',
        SK: 'METADATA',
        GSI1PK: 'GROUP',
        GSI1SK: 'NAME#Test Group',
      });

      mockDeleteItem.mockResolvedValue();

      await templeService.deleteTempleGroup('group-1', 'admin-123');

      // Should delete 2 associations + 1 group = 3 deletes
      expect(mockDeleteItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('addTempleToGroup', () => {
    it('should add temple to group', async () => {
      const mockGroup = {
        groupId: 'group-1',
        name: 'Test Group',
        description: 'Description',
        templeIds: ['temple-1'],
        totalTempleCount: 1,
        totalQRCodeCount: 5,
        status: 'active' as const,
        version: 1,
        createdAt: mockTimestamp,
        createdBy: mockUserId,
        updatedAt: mockTimestamp,
        updatedBy: mockUserId,
      };

      const mockTemple = {
        templeId: 'temple-2',
        name: 'Temple 2',
        activeArtifactCount: 7,
      };

      mockGetItem
        .mockResolvedValueOnce({
          ...mockGroup,
          PK: 'GROUP#group-1',
          SK: 'METADATA',
          GSI1PK: 'GROUP',
          GSI1SK: 'NAME#Test Group',
        })
        .mockResolvedValueOnce({
          ...mockTemple,
          PK: 'TEMPLE#temple-2',
          SK: 'METADATA',
        });

      mockPutItem.mockResolvedValue();
      mockUpdateItem.mockResolvedValue({} as any);

      await templeService.addTempleToGroup('group-1', 'temple-2', mockUserId);

      expect(mockPutItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateItem).toHaveBeenCalledTimes(1);
    });

    it('should not add temple if already in group', async () => {
      const mockGroup = {
        groupId: 'group-1',
        name: 'Test Group',
        description: 'Description',
        templeIds: ['temple-1', 'temple-2'],
        totalTempleCount: 2,
        totalQRCodeCount: 12,
        status: 'active' as const,
        version: 1,
        createdAt: mockTimestamp,
        createdBy: mockUserId,
        updatedAt: mockTimestamp,
        updatedBy: mockUserId,
      };

      mockGetItem.mockResolvedValue({
        ...mockGroup,
        PK: 'GROUP#group-1',
        SK: 'METADATA',
        GSI1PK: 'GROUP',
        GSI1SK: 'NAME#Test Group',
      });

      await templeService.addTempleToGroup('group-1', 'temple-2', mockUserId);

      expect(mockPutItem).not.toHaveBeenCalled();
    });
  });

  describe('removeTempleFromGroup', () => {
    it('should remove temple from group', async () => {
      const mockGroup = {
        groupId: 'group-1',
        name: 'Test Group',
        description: 'Description',
        templeIds: ['temple-1', 'temple-2'],
        totalTempleCount: 2,
        totalQRCodeCount: 12,
        status: 'active' as const,
        version: 1,
        createdAt: mockTimestamp,
        createdBy: mockUserId,
        updatedAt: mockTimestamp,
        updatedBy: mockUserId,
      };

      const mockTemple = {
        templeId: 'temple-2',
        name: 'Temple 2',
        activeArtifactCount: 7,
      };

      mockGetItem
        .mockResolvedValueOnce({
          ...mockGroup,
          PK: 'GROUP#group-1',
          SK: 'METADATA',
          GSI1PK: 'GROUP',
          GSI1SK: 'NAME#Test Group',
        })
        .mockResolvedValueOnce({
          ...mockTemple,
          PK: 'TEMPLE#temple-2',
          SK: 'METADATA',
        });

      mockDeleteItem.mockResolvedValue();
      mockUpdateItem.mockResolvedValue({} as any);

      await templeService.removeTempleFromGroup('group-1', 'temple-2', mockUserId);

      expect(mockDeleteItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateItem).toHaveBeenCalledTimes(1);
    });

    it('should reject removing last temple from group', async () => {
      const mockGroup = {
        groupId: 'group-1',
        name: 'Test Group',
        description: 'Description',
        templeIds: ['temple-1'],
        totalTempleCount: 1,
        totalQRCodeCount: 5,
        status: 'active' as const,
        version: 1,
        createdAt: mockTimestamp,
        createdBy: mockUserId,
        updatedAt: mockTimestamp,
        updatedBy: mockUserId,
      };

      mockGetItem.mockResolvedValue({
        ...mockGroup,
        PK: 'GROUP#group-1',
        SK: 'METADATA',
        GSI1PK: 'GROUP',
        GSI1SK: 'NAME#Test Group',
      });

      await expect(
        templeService.removeTempleFromGroup('group-1', 'temple-1', mockUserId)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getGroupsForTemple', () => {
    it('should retrieve all groups containing a temple', async () => {
      const mockAssociations = [
        {
          PK: 'GROUP#group-1',
          SK: 'TEMPLE#temple-1',
          groupId: 'group-1',
          templeId: 'temple-1',
          GSI1PK: 'TEMPLE#temple-1',
          GSI1SK: 'GROUP#group-1',
        },
        {
          PK: 'GROUP#group-2',
          SK: 'TEMPLE#temple-1',
          groupId: 'group-2',
          templeId: 'temple-1',
          GSI1PK: 'TEMPLE#temple-1',
          GSI1SK: 'GROUP#group-2',
        },
      ];

      const mockGroups = [
        {
          groupId: 'group-1',
          name: 'Group 1',
          templeIds: ['temple-1'],
          description: 'Test',
          totalTempleCount: 1,
          totalQRCodeCount: 5,
          status: 'active' as const,
          createdAt: mockTimestamp,
          createdBy: mockUserId,
          updatedAt: mockTimestamp,
          updatedBy: mockUserId,
          version: 1,
        },
        {
          groupId: 'group-2',
          name: 'Group 2',
          templeIds: ['temple-1'],
          description: 'Test',
          totalTempleCount: 1,
          totalQRCodeCount: 7,
          status: 'active' as const,
          createdAt: mockTimestamp,
          createdBy: mockUserId,
          updatedAt: mockTimestamp,
          updatedBy: mockUserId,
          version: 1,
        },
      ];

      mockGetItem
        .mockResolvedValueOnce({
          templeId: 'temple-1',
          name: 'Temple 1',
          PK: 'TEMPLE#temple-1',
          SK: 'METADATA',
        })
        .mockResolvedValueOnce({
          ...mockGroups[0],
          PK: 'GROUP#group-1',
          SK: 'METADATA',
        })
        .mockResolvedValueOnce({
          ...mockGroups[1],
          PK: 'GROUP#group-2',
          SK: 'METADATA',
        });

      mockQueryItems.mockResolvedValue(mockAssociations);

      const result = await templeService.getGroupsForTemple('temple-1');

      expect(result).toHaveLength(2);
      expect(result[0].groupId).toBe('group-1');
      expect(result[1].groupId).toBe('group-2');
    });

    it('should return empty array if temple not in any groups', async () => {
      mockGetItem.mockResolvedValue({
        templeId: 'temple-1',
        name: 'Temple 1',
        PK: 'TEMPLE#temple-1',
        SK: 'METADATA',
      });

      mockQueryItems.mockResolvedValue([]);

      const result = await templeService.getGroupsForTemple('temple-1');

      expect(result).toHaveLength(0);
    });
  });
});
