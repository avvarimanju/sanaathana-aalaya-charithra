/**
 * NotificationService - Business logic for managing defect notifications
 * Feature: defect-tracking
 * 
 * This service handles creating and managing notifications for defect status changes
 * and comments. It integrates with the NotificationRepository for data persistence
 * and optionally with SNS for external notifications (email/push).
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType, DefectStatus } from '../types';
import { NotificationRepository } from '../repositories/NotificationRepository';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor(notificationRepository: NotificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  /**
   * Create a notification for a status change
   * 
   * @param userId - The user to notify (defect submitter)
   * @param defectId - The ID of the defect
   * @param defectTitle - The title of the defect
   * @param oldStatus - The previous status
   * @param newStatus - The new status
   * 
   * Requirements: 8.1
   */
  async notifyStatusChange(
    userId: string,
    defectId: string,
    defectTitle: string,
    oldStatus: DefectStatus,
    newStatus: DefectStatus
  ): Promise<void> {
    const message = `Status changed from ${oldStatus} to ${newStatus}`;
    
    const notification: Notification = {
      notificationId: uuidv4(),
      userId,
      defectId,
      defectTitle,
      message,
      type: 'STATUS_CHANGE',
      isRead: false,
      createdAt: new Date().toISOString(),
      ttl: 0 // Will be set by repository
    };

    try {
      await this.notificationRepository.create(notification);
      
      // Optional: Send external notification (SNS/email/push)
      // This is a best-effort operation - we don't fail if it doesn't work
      await this.sendExternalNotification(userId, notification).catch(error => {
        console.error('Failed to send external notification:', error);
        // Continue - in-app notification was created successfully
      });
    } catch (error) {
      console.error('Failed to create status change notification:', error);
      throw error;
    }
  }

  /**
   * Create a notification for a new comment/status update
   * 
   * @param userId - The user to notify (defect submitter)
   * @param defectId - The ID of the defect
   * @param defectTitle - The title of the defect
   * @param comment - The comment/update message
   * 
   * Requirements: 8.2
   */
  async notifyCommentAdded(
    userId: string,
    defectId: string,
    defectTitle: string,
    comment: string
  ): Promise<void> {
    const message = `New comment: ${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}`;
    
    const notification: Notification = {
      notificationId: uuidv4(),
      userId,
      defectId,
      defectTitle,
      message,
      type: 'COMMENT_ADDED',
      isRead: false,
      createdAt: new Date().toISOString(),
      ttl: 0 // Will be set by repository
    };

    try {
      await this.notificationRepository.create(notification);
      
      // Optional: Send external notification (SNS/email/push)
      await this.sendExternalNotification(userId, notification).catch(error => {
        console.error('Failed to send external notification:', error);
        // Continue - in-app notification was created successfully
      });
    } catch (error) {
      console.error('Failed to create comment notification:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for a user
   * 
   * @param userId - The user ID
   * @param unreadOnly - If true, only return unread notifications
   * @returns Array of notifications
   * 
   * Requirements: 8.3
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      return await this.notificationRepository.findByUserId(userId, unreadOnly);
    } catch (error) {
      console.error('Failed to retrieve user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * 
   * @param notificationId - The notification ID
   * 
   * Requirements: 8.4
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.notificationRepository.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Send external notification via SNS (optional)
   * This is a placeholder for future SNS integration
   * 
   * @param userId - The user to notify
   * @param notification - The notification data
   */
  private async sendExternalNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    // TODO: Implement SNS integration for email/push notifications
    // This is optional and can be implemented in a future phase
    
    // Example implementation:
    // const sns = new SNSClient({ region: process.env.AWS_REGION });
    // const topicArn = await this.getUserNotificationTopicArn(userId);
    // 
    // if (topicArn) {
    //   await sns.send(new PublishCommand({
    //     TopicArn: topicArn,
    //     Subject: `Defect Update: ${notification.defectTitle}`,
    //     Message: notification.message,
    //     MessageAttributes: {
    //       defectId: { DataType: 'String', StringValue: notification.defectId },
    //       type: { DataType: 'String', StringValue: notification.type }
    //     }
    //   }));
    // }
    
    // For now, this is a no-op
    return Promise.resolve();
  }
}
