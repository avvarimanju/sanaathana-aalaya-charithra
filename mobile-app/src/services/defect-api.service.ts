/**
 * Defect Tracking API Service for Mobile App
 * Handles all API calls related to defect submission, viewing, and notifications
 */

import { API_BASE_URL, API_CONFIG } from '../config/api';

/**
 * Type definitions for defect tracking
 */
export type DefectStatus = 
  | 'New'
  | 'Acknowledged'
  | 'In_Progress'
  | 'Resolved'
  | 'Closed';

export type NotificationType = 
  | 'STATUS_CHANGE'
  | 'COMMENT_ADDED';

export interface DeviceInfo {
  platform: 'android' | 'ios';
  osVersion: string;
  appVersion: string;
  deviceModel?: string;
}

export interface SubmitDefectRequest {
  userId: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  deviceInfo?: DeviceInfo;
}

export interface DefectCreationResult {
  defectId: string;
  status: DefectStatus;
  createdAt: string;
}

export interface DefectSummary {
  defectId: string;
  title: string;
  description: string;
  status: DefectStatus;
  createdAt: string;
  updatedAt: string;
  updateCount: number;
}

export interface StatusUpdate {
  updateId: string;
  message: string;
  previousStatus?: DefectStatus;
  newStatus?: DefectStatus;
  adminId: string;
  adminName: string;
  timestamp: string;
}

export interface DefectDetails {
  defectId: string;
  userId: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  status: DefectStatus;
  createdAt: string;
  updatedAt: string;
  deviceInfo?: DeviceInfo;
  updateCount: number;
  statusUpdates: StatusUpdate[];
}

export interface Notification {
  notificationId: string;
  defectId: string;
  defectTitle: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface DefectFilters {
  status?: DefectStatus;
  limit?: number;
  lastEvaluatedKey?: string;
}

export interface DefectListResponse {
  defects: DefectSummary[];
  lastEvaluatedKey?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}

/**
 * API Response wrapper
 */
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

/**
 * Defect API Service Class
 */
class DefectAPIService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const headers: Record<string, string> = {
        ...API_CONFIG.headers,
        ...(options.headers as Record<string, string> || {}),
      };

      // Add authorization header if token is available
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data as ErrorResponse,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      console.error('Defect API request failed:', error);
      return {
        success: false,
        error: {
          error: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  /**
   * Submit a new defect report
   * POST /defects
   */
  async submitDefect(request: SubmitDefectRequest): Promise<APIResponse<DefectCreationResult>> {
    return this.request<DefectCreationResult>('/defects', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get defects for a specific user
   * GET /defects/user/{userId}
   */
  async getUserDefects(
    userId: string,
    filters?: DefectFilters
  ): Promise<APIResponse<DefectListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (filters?.status) {
      queryParams.append('status', filters.status);
    }
    if (filters?.limit) {
      queryParams.append('limit', filters.limit.toString());
    }
    if (filters?.lastEvaluatedKey) {
      queryParams.append('lastEvaluatedKey', filters.lastEvaluatedKey);
    }

    const queryString = queryParams.toString();
    const endpoint = `/defects/user/${userId}${queryString ? `?${queryString}` : ''}`;

    return this.request<DefectListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get detailed information about a specific defect
   * GET /defects/{defectId}
   */
  async getDefectDetails(defectId: string): Promise<APIResponse<DefectDetails>> {
    return this.request<DefectDetails>(`/defects/${defectId}`, {
      method: 'GET',
    });
  }

  /**
   * Get notifications for a specific user
   * GET /notifications/user/{userId}
   */
  async getNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<APIResponse<NotificationListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (unreadOnly) {
      queryParams.append('unreadOnly', 'true');
    }

    const queryString = queryParams.toString();
    const endpoint = `/notifications/user/${userId}${queryString ? `?${queryString}` : ''}`;

    return this.request<NotificationListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Mark a notification as read
   * PUT /notifications/{notificationId}/read
   */
  async markNotificationRead(notificationId: string): Promise<APIResponse<{ notificationId: string; isRead: boolean }>> {
    return this.request<{ notificationId: string; isRead: boolean }>(
      `/notifications/${notificationId}/read`,
      {
        method: 'PUT',
      }
    );
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    const response = await this.getNotifications(userId, true);
    
    if (response.success && response.data) {
      return response.data.notifications.length;
    }
    
    return 0;
  }

  /**
   * Helper method to get device information
   */
  static getDeviceInfo(): DeviceInfo {
    // This would be implemented using React Native's Platform and Device Info
    // For now, returning a placeholder
    return {
      platform: 'android', // or 'ios' based on Platform.OS
      osVersion: '13.0', // from DeviceInfo
      appVersion: '1.0.0', // from app.json or DeviceInfo
      deviceModel: 'Unknown', // from DeviceInfo
    };
  }
}

// Export singleton instance
export const defectApiService = new DefectAPIService();
