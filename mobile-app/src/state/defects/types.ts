/**
 * State management types for defect tracking
 */

import {
  DefectSummary,
  DefectDetails,
  DefectStatus,
  Notification,
} from '../../services/defect-api.service';

/**
 * Defect state interface
 */
export interface DefectState {
  // Defects list
  defects: DefectSummary[];
  selectedDefect: DefectDetails | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error state
  error: string | null;
  
  // Filter state
  statusFilter: DefectStatus | null;
}

/**
 * Notification state interface
 */
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastPolled: Date | null;
}

/**
 * Defect actions
 */
export type DefectAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DEFECTS'; payload: DefectSummary[] }
  | { type: 'SET_SELECTED_DEFECT'; payload: DefectDetails | null }
  | { type: 'SET_STATUS_FILTER'; payload: DefectStatus | null }
  | { type: 'UPDATE_DEFECT'; payload: DefectSummary }
  | { type: 'CLEAR_STATE' };

/**
 * Notification actions
 */
export type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'UPDATE_LAST_POLLED' }
  | { type: 'CLEAR_STATE' };
