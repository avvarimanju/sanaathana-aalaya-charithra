/**
 * Unit tests for notification reducer
 */

import { notificationReducer, initialNotificationState } from '../notificationReducer';
import { NotificationState, NotificationAction } from '../types';
import { Notification, NotificationType } from '../../../services/defect-api.service';

describe('notificationReducer', () => {
  const mockNotification: Notification = {
    notificationId: 'notif-1',
    defectId: 'defect-1',
    defectTitle: 'Test Defect',
    message: 'Status changed',
    type: 'STATUS_CHANGE' as NotificationType,
    isRead: false,
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('should return initial state', () => {
    const state = notificationReducer(initialNotificationState, { type: 'CLEAR_STATE' });
    expect(state).toEqual(initialNotificationState);
  });

  it('should handle SET_LOADING', () => {
    const action: NotificationAction = { type: 'SET_LOADING', payload: true };
    const state = notificationReducer(initialNotificationState, action);
    
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle SET_ERROR', () => {
    const action: NotificationAction = { type: 'SET_ERROR', payload: 'Test error' };
    const state = notificationReducer(
      { ...initialNotificationState, isLoading: true },
      action
    );
    
    expect(state.error).toBe('Test error');
    expect(state.isLoading).toBe(false);
  });

  it('should handle SET_NOTIFICATIONS', () => {
    const notifications = [mockNotification];
    const action: NotificationAction = { type: 'SET_NOTIFICATIONS', payload: notifications };
    const state = notificationReducer(
      { ...initialNotificationState, isLoading: true },
      action
    );
    
    expect(state.notifications).toEqual(notifications);
    expect(state.unreadCount).toBe(1);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should calculate unread count correctly', () => {
    const notifications: Notification[] = [
      { ...mockNotification, notificationId: 'notif-1', isRead: false },
      { ...mockNotification, notificationId: 'notif-2', isRead: true },
      { ...mockNotification, notificationId: 'notif-3', isRead: false },
    ];
    
    const action: NotificationAction = { type: 'SET_NOTIFICATIONS', payload: notifications };
    const state = notificationReducer(initialNotificationState, action);
    
    expect(state.unreadCount).toBe(2);
  });

  it('should handle MARK_AS_READ', () => {
    const initialState: NotificationState = {
      ...initialNotificationState,
      notifications: [
        { ...mockNotification, notificationId: 'notif-1', isRead: false },
        { ...mockNotification, notificationId: 'notif-2', isRead: false },
      ],
      unreadCount: 2,
    };
    
    const action: NotificationAction = { type: 'MARK_AS_READ', payload: 'notif-1' };
    const state = notificationReducer(initialState, action);
    
    expect(state.notifications[0].isRead).toBe(true);
    expect(state.notifications[1].isRead).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it('should not change unread count if notification already read', () => {
    const initialState: NotificationState = {
      ...initialNotificationState,
      notifications: [
        { ...mockNotification, notificationId: 'notif-1', isRead: true },
      ],
      unreadCount: 0,
    };
    
    const action: NotificationAction = { type: 'MARK_AS_READ', payload: 'notif-1' };
    const state = notificationReducer(initialState, action);
    
    expect(state.unreadCount).toBe(0);
  });

  it('should handle UPDATE_LAST_POLLED', () => {
    const beforeTime = new Date();
    const action: NotificationAction = { type: 'UPDATE_LAST_POLLED' };
    const state = notificationReducer(initialNotificationState, action);
    const afterTime = new Date();
    
    expect(state.lastPolled).toBeDefined();
    expect(state.lastPolled!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(state.lastPolled!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it('should handle CLEAR_STATE', () => {
    const dirtyState: NotificationState = {
      notifications: [mockNotification],
      unreadCount: 1,
      isLoading: true,
      error: 'Some error',
      lastPolled: new Date(),
    };
    
    const action: NotificationAction = { type: 'CLEAR_STATE' };
    const state = notificationReducer(dirtyState, action);
    
    expect(state).toEqual(initialNotificationState);
  });

  it('should clear error when setting loading to true', () => {
    const stateWithError: NotificationState = {
      ...initialNotificationState,
      error: 'Previous error',
    };
    
    const action: NotificationAction = { type: 'SET_LOADING', payload: true };
    const state = notificationReducer(stateWithError, action);
    
    expect(state.error).toBeNull();
  });

  it('should preserve error when setting loading to false', () => {
    const stateWithError: NotificationState = {
      ...initialNotificationState,
      error: 'Previous error',
      isLoading: true,
    };
    
    const action: NotificationAction = { type: 'SET_LOADING', payload: false };
    const state = notificationReducer(stateWithError, action);
    
    expect(state.error).toBe('Previous error');
  });

  it('should handle marking non-existent notification as read', () => {
    const initialState: NotificationState = {
      ...initialNotificationState,
      notifications: [mockNotification],
      unreadCount: 1,
    };
    
    const action: NotificationAction = { type: 'MARK_AS_READ', payload: 'non-existent' };
    const state = notificationReducer(initialState, action);
    
    // Should not change anything
    expect(state.notifications).toEqual(initialState.notifications);
    expect(state.unreadCount).toBe(1);
  });
});
