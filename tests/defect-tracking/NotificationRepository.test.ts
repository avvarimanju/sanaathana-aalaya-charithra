/**
 * Unit tests for NotificationRepository
 * Feature: defect-tracking
 * 
 * Tests CRUD operations and query methods for notification data.
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { NotificationRepository } from '../../src/defect-tracking/repositories/NotificationRepository';
import { Notification, NotificationType } from '../../src/defect-tracking/types';
import { v4 as uuidv4 } from 'uuid';

// Mock DynamoDB client
jest.mock('@aws-sdk/client-dynamodb');

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let mockClient: jest.Mocked<DynamoDBClient>;
  const tableName = 'test-notifications-table';

  beforeEach(() => {
    mockClient = new DynamoDBClient({}) as jest.Mocked<DynamoDBClient>;
    repository = new NotificationRepository(mockClient, tableName);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification with TTL set to 90 days', async () => {
      const notification: Notification = {
        notificationId: uuidv4(),
        userId: 'user-123',
        defectId: 'defect-456',
        defectTitle: 'Test Defect',
        message: 'Status changed to Acknowledged',
        type: 'STATUS_CHANGE',
        isRead: false,
        createdAt: new Date().toISOString(),
        ttl: 0 // Will be set by repository
      };

      mockClient.send = jest.fn().mockResolvedValue({});

      const result = await repository.create(notification);

      expect(mockClient.send).toHaveBeenCalledTimes(1);
      expect(result.ttl).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(result.ttl).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60 + 1);
    });

    it('should throw error if notification already exists', async () => {
      const notification: Notification = {
        notificationId: uuidv4(),
        userId: 'user-123',
        defectId: 'defect-456',
        defectTitle: 'Test Defect',
        message: 'Status changed',
        type: 'STATUS_CHANGE',
        isRead: false,
        createdAt: new Date().toISOString(),
        ttl: 0
      };

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockClient.send = jest.fn().mockRejectedValue(error);

      await expect(repository.create(notification)).rejects.toThrow();
    });
  });

  describe('findByUserId', () => {
    it('should retrieve all notifications for a user in descending order', async () => {
      const userId = 'user-123';
      const notifications: Notification[] = [
        {
          notificationId: uuidv4(),
          userId,
          defectId: 'defect-1',
          defectTitle: 'Defect 1',
          message: 'Message 1',
          type: 'STATUS_CHANGE',
          isRead: false,
          createdAt: '2024-01-02T00:00:00Z',
          ttl: 1234567890
        },
        {
          notificationId: uuidv4(),
          userId,
          defectId: 'defect-2',
          defectTitle: 'Defect 2',
          message: 'Message 2',
          type: 'COMMENT_ADDED',
          isRead: true,
          createdAt: '2024-01-01T00:00:00Z',
          ttl: 1234567890
        }
      ];

      mockClient.send = jest.fn().mockResolvedValue({
        Items: notifications.map(n => ({
          notificationId: { S: n.notificationId },
          userId: { S: n.userId },
          defectId: { S: n.defectId },
          defectTitle: { S: n.defectTitle },
          message: { S: n.message },
          type: { S: n.type },
          isRead: { BOOL: n.isRead },
          createdAt: { S: n.createdAt },
          ttl: { N: n.ttl.toString() }
        }))
      });

      const result = await repository.findByUserId(userId);

      expect(mockClient.send).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].defectId).toBe('defect-1');
      expect(result[1].defectId).toBe('defect-2');
    });

    it('should filter unread notifications when unreadOnly is true', async () => {
      const userId = 'user-123';

      mockClient.send = jest.fn().mockResolvedValue({
        Items: [
          {
            notificationId: { S: uuidv4() },
            userId: { S: userId },
            defectId: { S: 'defect-1' },
            defectTitle: { S: 'Defect 1' },
            message: { S: 'Message 1' },
            type: { S: 'STATUS_CHANGE' },
            isRead: { BOOL: false },
            createdAt: { S: '2024-01-01T00:00:00Z' },
            ttl: { N: '1234567890' }
          }
        ]
      });

      const result = await repository.findByUserId(userId, true);

      expect(mockClient.send).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].isRead).toBe(false);
    });

    it('should return empty array when no notifications exist', async () => {
      mockClient.send = jest.fn().mockResolvedValue({ Items: [] });

      const result = await repository.findByUserId('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = uuidv4();

      mockClient.send = jest.fn().mockResolvedValue({});

      await repository.markAsRead(notificationId);

      expect(mockClient.send).toHaveBeenCalledTimes(1);
    });

    it('should throw error if notification does not exist', async () => {
      const notificationId = uuidv4();

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockClient.send = jest.fn().mockRejectedValue(error);

      await expect(repository.markAsRead(notificationId)).rejects.toThrow(
        `Notification with ID ${notificationId} not found`
      );
    });
  });

  describe('deleteOldNotifications', () => {
    it('should delete notifications older than specified days', async () => {
      const oldNotifications: Notification[] = [
        {
          notificationId: uuidv4(),
          userId: 'user-123',
          defectId: 'defect-1',
          defectTitle: 'Old Defect',
          message: 'Old message',
          type: 'STATUS_CHANGE',
          isRead: true,
          createdAt: '2023-01-01T00:00:00Z',
          ttl: 1234567890
        }
      ];

      // Mock scan to return old notifications
      mockClient.send = jest.fn()
        .mockResolvedValueOnce({
          Items: oldNotifications.map(n => ({
            notificationId: { S: n.notificationId },
            userId: { S: n.userId },
            defectId: { S: n.defectId },
            defectTitle: { S: n.defectTitle },
            message: { S: n.message },
            type: { S: n.type },
            isRead: { BOOL: n.isRead },
            createdAt: { S: n.createdAt },
            ttl: { N: n.ttl.toString() }
          }))
        })
        .mockResolvedValue({}); // Mock delete operations

      const deletedCount = await repository.deleteOldNotifications(90);

      expect(deletedCount).toBe(1);
      expect(mockClient.send).toHaveBeenCalledTimes(2); // 1 scan + 1 delete
    });

    it('should return 0 when no old notifications exist', async () => {
      mockClient.send = jest.fn().mockResolvedValue({ Items: [] });

      const deletedCount = await repository.deleteOldNotifications(90);

      expect(deletedCount).toBe(0);
      expect(mockClient.send).toHaveBeenCalledTimes(1); // Only scan
    });

    it('should continue deleting even if one deletion fails', async () => {
      const oldNotifications: Notification[] = [
        {
          notificationId: uuidv4(),
          userId: 'user-123',
          defectId: 'defect-1',
          defectTitle: 'Old Defect 1',
          message: 'Old message 1',
          type: 'STATUS_CHANGE',
          isRead: true,
          createdAt: '2023-01-01T00:00:00Z',
          ttl: 1234567890
        },
        {
          notificationId: uuidv4(),
          userId: 'user-123',
          defectId: 'defect-2',
          defectTitle: 'Old Defect 2',
          message: 'Old message 2',
          type: 'COMMENT_ADDED',
          isRead: true,
          createdAt: '2023-01-02T00:00:00Z',
          ttl: 1234567890
        }
      ];

      // Mock scan to return old notifications
      mockClient.send = jest.fn()
        .mockResolvedValueOnce({
          Items: oldNotifications.map(n => ({
            notificationId: { S: n.notificationId },
            userId: { S: n.userId },
            defectId: { S: n.defectId },
            defectTitle: { S: n.defectTitle },
            message: { S: n.message },
            type: { S: n.type },
            isRead: { BOOL: n.isRead },
            createdAt: { S: n.createdAt },
            ttl: { N: n.ttl.toString() }
          }))
        })
        .mockRejectedValueOnce(new Error('Delete failed')) // First delete fails
        .mockResolvedValueOnce({}); // Second delete succeeds

      const deletedCount = await repository.deleteOldNotifications(90);

      expect(deletedCount).toBe(1); // Only one successful deletion
      expect(mockClient.send).toHaveBeenCalledTimes(3); // 1 scan + 2 deletes
    });
  });

  describe('findById', () => {
    it('should retrieve notification by ID', async () => {
      const notification: Notification = {
        notificationId: uuidv4(),
        userId: 'user-123',
        defectId: 'defect-456',
        defectTitle: 'Test Defect',
        message: 'Test message',
        type: 'STATUS_CHANGE',
        isRead: false,
        createdAt: new Date().toISOString(),
        ttl: 1234567890
      };

      mockClient.send = jest.fn().mockResolvedValue({
        Item: {
          notificationId: { S: notification.notificationId },
          userId: { S: notification.userId },
          defectId: { S: notification.defectId },
          defectTitle: { S: notification.defectTitle },
          message: { S: notification.message },
          type: { S: notification.type },
          isRead: { BOOL: notification.isRead },
          createdAt: { S: notification.createdAt },
          ttl: { N: notification.ttl.toString() }
        }
      });

      const result = await repository.findById(notification.notificationId);

      expect(result).not.toBeNull();
      expect(result?.notificationId).toBe(notification.notificationId);
      expect(result?.userId).toBe(notification.userId);
    });

    it('should return null when notification does not exist', async () => {
      mockClient.send = jest.fn().mockResolvedValue({});

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle throttling errors', async () => {
      const error = new Error('Throttled');
      error.name = 'ProvisionedThroughputExceededException';
      mockClient.send = jest.fn().mockRejectedValue(error);

      await expect(repository.findByUserId('user-123')).rejects.toThrow(
        'Database throttling detected'
      );
    });

    it('should handle table not found errors', async () => {
      const error = new Error('Table not found');
      error.name = 'ResourceNotFoundException';
      mockClient.send = jest.fn().mockRejectedValue(error);

      await expect(repository.findByUserId('user-123')).rejects.toThrow(
        `Table ${tableName} not found`
      );
    });

    it('should handle access denied errors', async () => {
      const error = new Error('Access denied');
      error.name = 'AccessDeniedException';
      mockClient.send = jest.fn().mockRejectedValue(error);

      await expect(repository.findByUserId('user-123')).rejects.toThrow(
        'Access denied to DynamoDB table'
      );
    });
  });
});
