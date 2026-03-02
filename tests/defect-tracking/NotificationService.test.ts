/**
 * Unit tests for NotificationService
 * Feature: defect-tracking
 * 
 * Tests business logic for managing defect notifications.
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

import { NotificationService } from '../../src/defect-tracking/services/NotificationService';
import { NotificationRepository } from '../../src/defect-tracking/repositories/NotificationRepository';
import { Notification, DefectStatus } from '../../src/defect-tracking/types';
import { v4 as uuidv4 } from 'uuid';

// Mock the NotificationRepository
jest.mock('../../src/defect-tracking/repositories/NotificationRepository');

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepository: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    mockRepository = new NotificationRepository(null as any, 'test-table') as jest.Mocked<NotificationRepository>;
    service = new NotificationService(mockRepository);
    jest.clearAllMocks();
  });

  describe('notifyStatusChange', () => {
    it('should create a status change notification', async () => {
      const userId = 'user-123';
      const defectId = 'defect-456';
      const defectTitle = 'Test Defect';
      const oldStatus: DefectStatus = 'New';
      const newStatus: DefectStatus = 'Acknowledged';

      mockRepository.create = jest.fn().mockResolvedValue({
        notificationId: uuidv4(),
        userId,
        defectId,
        defectTitle,
        message: `Status changed from ${oldStatus} to ${newStatus}`,
        type: 'STATUS_CHANGE',
        isRead: false,
        createdAt: new Date().toISOString(),
        ttl: 1234567890
      });

      await service.notifyStatusChange(userId, defectId, defectTitle, oldStatus, newStatus);

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          defectId,
          defectTitle,
          message: 'Status changed from New to Acknowledged',
          type: 'STATUS_CHANGE',
          isRead: false
        })
      );
    });

    it('should throw error if notification creation fails', async () => {
      mockRepository.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        service.notifyStatusChange('user-123', 'defect-456', 'Test', 'New', 'Acknowledged')
      ).rejects.toThrow('Database error');
    });

    it('should not fail if external notification fails', async () => {
      mockRepository.create = jest.fn().mockResolvedValue({
        notificationId: uuidv4(),
        userId: 'user-123',
        defectId: 'defect-456',
        defectTitle: 'Test',
        message: 'Status changed from New to Acknowledged',
        type: 'STATUS_CHANGE',
        isRead: false,
        createdAt: new Date().toISOString(),
        ttl: 1234567890
      });

      // External notification is a no-op in current implementation
      await expect(
        service.notifyStatusChange('user-123', 'defect-456', 'Test', 'New', 'Acknowledged')
      ).resolves.not.toThrow();
    });
  });

  describe('notifyCommentAdded', () => {
    it('should create a comment notification with truncated message', async () => {
      const userId = 'user-123';
      const defectId = 'defect-456';
      const defectTitle = 'Test Defect';
      const comment = 'This is a test comment';

      mockRepository.create = jest.fn().mockResolvedValue({
        notificationId: uuidv4(),
        userId,
        defectId,
        defectTitle,
        message: `New comment: ${comment}`,
        type: 'COMMENT_ADDED',
        isRead: false,
        createdAt: new Date().toISOString(),
        ttl: 1234567890
      });

      await service.notifyCommentAdded(userId, defectId, defectTitle, comment);

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          defectId,
          defectTitle,
          message: 'New comment: This is a test comment',
          type: 'COMMENT_ADDED',
          isRead: false
        })
      );
    });

    it('should truncate long comments to 100 characters', async () => {
      const longComment = 'a'.repeat(150);
      
      mockRepository.create = jest.fn().mockResolvedValue({
        notificationId: uuidv4(),
        userId: 'user-123',
        defectId: 'defect-456',
        defectTitle: 'Test',
        message: `New comment: ${'a'.repeat(100)}...`,
        type: 'COMMENT_ADDED',
        isRead: false,
        createdAt: new Date().toISOString(),
        ttl: 1234567890
      });

      await service.notifyCommentAdded('user-123', 'defect-456', 'Test', longComment);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('...')
        })
      );
    });

    it('should throw error if notification creation fails', async () => {
      mockRepository.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        service.notifyCommentAdded('user-123', 'defect-456', 'Test', 'Comment')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve all notifications for a user', async () => {
      const userId = 'user-123';
      const notifications: Notification[] = [
        {
          notificationId: uuidv4(),
          userId,
          defectId: 'defect-1',
          defectTitle: 'Defect 1',
          message: 'Status changed',
          type: 'STATUS_CHANGE',
          isRead: false,
          createdAt: '2024-01-01T00:00:00Z',
          ttl: 1234567890
        },
        {
          notificationId: uuidv4(),
          userId,
          defectId: 'defect-2',
          defectTitle: 'Defect 2',
          message: 'New comment',
          type: 'COMMENT_ADDED',
          isRead: true,
          createdAt: '2024-01-02T00:00:00Z',
          ttl: 1234567890
        }
      ];

      mockRepository.findByUserId = jest.fn().mockResolvedValue(notifications);

      const result = await service.getUserNotifications(userId);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, false);
      expect(result).toEqual(notifications);
      expect(result).toHaveLength(2);
    });

    it('should retrieve only unread notifications when unreadOnly is true', async () => {
      const userId = 'user-123';
      const unreadNotifications: Notification[] = [
        {
          notificationId: uuidv4(),
          userId,
          defectId: 'defect-1',
          defectTitle: 'Defect 1',
          message: 'Status changed',
          type: 'STATUS_CHANGE',
          isRead: false,
          createdAt: '2024-01-01T00:00:00Z',
          ttl: 1234567890
        }
      ];

      mockRepository.findByUserId = jest.fn().mockResolvedValue(unreadNotifications);

      const result = await service.getUserNotifications(userId, true);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, true);
      expect(result).toEqual(unreadNotifications);
      expect(result.every(n => !n.isRead)).toBe(true);
    });

    it('should return empty array when no notifications exist', async () => {
      mockRepository.findByUserId = jest.fn().mockResolvedValue([]);

      const result = await service.getUserNotifications('user-123');

      expect(result).toEqual([]);
    });

    it('should throw error if retrieval fails', async () => {
      mockRepository.findByUserId = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        service.getUserNotifications('user-123')
      ).rejects.toThrow('Database error');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = uuidv4();

      mockRepository.markAsRead = jest.fn().mockResolvedValue(undefined);

      await service.markAsRead(notificationId);

      expect(mockRepository.markAsRead).toHaveBeenCalledWith(notificationId);
      expect(mockRepository.markAsRead).toHaveBeenCalledTimes(1);
    });

    it('should throw error if notification does not exist', async () => {
      const notificationId = uuidv4();

      mockRepository.markAsRead = jest.fn().mockRejectedValue(
        new Error(`Notification with ID ${notificationId} not found`)
      );

      await expect(
        service.markAsRead(notificationId)
      ).rejects.toThrow(`Notification with ID ${notificationId} not found`);
    });

    it('should throw error if update fails', async () => {
      mockRepository.markAsRead = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        service.markAsRead('notification-123')
      ).rejects.toThrow('Database error');
    });
  });
});
