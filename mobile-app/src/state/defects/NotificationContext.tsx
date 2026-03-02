/**
 * Notification Context Provider
 * Manages notification state with automatic polling
 */

import React, { createContext, useReducer, useCallback, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { defectApiService } from '../../services/defect-api.service';
import { NotificationState } from './types';
import { notificationReducer, initialNotificationState } from './notificationReducer';

/**
 * Polling interval in milliseconds (30 seconds)
 */
const POLLING_INTERVAL = 30000;

/**
 * Context value interface
 */
interface NotificationContextValue extends NotificationState {
  // Actions
  loadNotifications: (userId: string, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  startPolling: (userId: string) => void;
  stopPolling: () => void;
  clearError: () => void;
  clearState: () => void;
}

/**
 * Create context
 */
export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * Provider props
 */
interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Notification Provider Component
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialNotificationState);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(async (userId: string, unreadOnly = false) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await defectApiService.getNotifications(userId, unreadOnly);

      if (response.success && response.data) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data.notifications });
        dispatch({ type: 'UPDATE_LAST_POLLED' });
      } else {
        const errorMessage = response.error?.message || 'Failed to load notifications';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred' });
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await defectApiService.markNotificationRead(notificationId);

      if (response.success) {
        dispatch({ type: 'MARK_AS_READ', payload: notificationId });
      } else {
        console.error('Failed to mark notification as read:', response.error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  /**
   * Start polling for notifications
   */
  const startPolling = useCallback((userId: string) => {
    // Store userId for polling
    userIdRef.current = userId;

    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Initial load
    loadNotifications(userId, false);

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if app is in foreground
      if (appStateRef.current === 'active' && userIdRef.current) {
        loadNotifications(userIdRef.current, false);
      }
    }, POLLING_INTERVAL);
  }, [loadNotifications]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    userIdRef.current = null;
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  /**
   * Clear state (on logout)
   */
  const clearState = useCallback(() => {
    stopPolling();
    dispatch({ type: 'CLEAR_STATE' });
  }, [stopPolling]);

  /**
   * Handle app state changes (pause polling when app is in background)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;

      // Resume polling when app comes to foreground
      if (nextAppState === 'active' && userIdRef.current && pollingIntervalRef.current) {
        loadNotifications(userIdRef.current, false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadNotifications]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const value: NotificationContextValue = {
    ...state,
    loadNotifications,
    markAsRead,
    startPolling,
    stopPolling,
    clearError,
    clearState,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
