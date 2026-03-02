/**
 * Notification state reducer
 */

import { NotificationState, NotificationAction } from './types';

/**
 * Initial notification state
 */
export const initialNotificationState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastPolled: null,
};

/**
 * Notification reducer
 */
export function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n) => !n.isRead).length,
        isLoading: false,
        error: null,
      };

    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map((notification) =>
        notification.notificationId === action.payload
          ? { ...notification, isRead: true }
          : notification
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.isRead).length,
      };

    case 'UPDATE_LAST_POLLED':
      return {
        ...state,
        lastPolled: new Date(),
      };

    case 'CLEAR_STATE':
      return initialNotificationState;

    default:
      return state;
  }
}
