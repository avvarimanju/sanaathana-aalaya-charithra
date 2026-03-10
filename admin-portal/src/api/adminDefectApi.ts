/**
 * Admin Defect Tracking API Client
 * Handles all API calls for admin defect management
 */

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

export interface DefectSummary {
  defectId: string;
  userId: string;
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

export interface AdminDefectFilters {
  status?: DefectStatus;
  search?: string;
  limit?: number;
  lastEvaluatedKey?: string;
}

export interface DefectListResponse {
  defects: DefectSummary[];
  lastEvaluatedKey?: string;
  totalCount: number;
}

export interface UpdateStatusRequest {
  newStatus: DefectStatus;
  comment?: string;
}

export interface UpdateStatusResponse {
  defectId: string;
  previousStatus: DefectStatus;
  newStatus: DefectStatus;
  updatedAt: string;
}

export interface AddStatusUpdateRequest {
  message: string;
}

export interface AddStatusUpdateResponse {
  updateId: string;
  defectId: string;
  message: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  currentStatus?: DefectStatus;
  attemptedStatus?: DefectStatus;
  allowedTransitions?: DefectStatus[];
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
 * Admin Defect API Client Configuration
 */
interface AdminAPIConfig {
  baseUrl: string;
  timeout?: number;
}

/**
 * Admin Defect API Client Class
 */
class AdminDefectAPIClient {
  private baseUrl: string;
  private timeout: number;
  private adminToken: string | null = null;

  constructor(config: AdminAPIConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Set admin authentication token for API requests
   */
  setAdminToken(token: string): void {
    this.adminToken = token;
  }

  /**
   * Clear admin authentication token
   */
  clearAdminToken(): void {
    this.adminToken = null;
  }

  /**
   * Get current admin token
   */
  getAdminToken(): string | null {
    return this.adminToken;
  }

  /**
   * Make HTTP request with error handling and admin authentication
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      // Add admin authorization header
      if (this.adminToken) {
        headers['Authorization'] = `Bearer ${this.adminToken}`;
      } else {
        return {
          success: false,
          error: {
            error: 'UNAUTHORIZED',
            message: 'Admin authentication token is required',
          },
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      console.error('Admin API request failed:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            error: 'TIMEOUT_ERROR',
            message: 'Request timed out',
          },
        };
      }

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
   * Get all defects with filtering and pagination (Admin)
   * GET /admin/defects
   */
  async getAllDefects(
    filters?: AdminDefectFilters
  ): Promise<APIResponse<DefectListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (filters?.status) {
      queryParams.append('status', filters.status);
    }
    if (filters?.search) {
      queryParams.append('search', filters.search);
    }
    if (filters?.limit) {
      queryParams.append('limit', filters.limit.toString());
    }
    if (filters?.lastEvaluatedKey) {
      queryParams.append('lastEvaluatedKey', filters.lastEvaluatedKey);
    }

    const queryString = queryParams.toString();
    const endpoint = `/admin/defects${queryString ? `?${queryString}` : ''}`;

    return this.request<DefectListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get detailed information about a specific defect (Admin)
   * GET /admin/defects/{defectId}
   */
  async getDefectDetails(defectId: string): Promise<APIResponse<DefectDetails>> {
    return this.request<DefectDetails>(`/admin/defects/${defectId}`, {
      method: 'GET',
    });
  }

  /**
   * Update defect status (Admin)
   * PUT /admin/defects/{defectId}/status
   */
  async updateDefectStatus(
    defectId: string,
    request: UpdateStatusRequest
  ): Promise<APIResponse<UpdateStatusResponse>> {
    return this.request<UpdateStatusResponse>(
      `/admin/defects/${defectId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Add status update comment to a defect (Admin)
   * POST /admin/defects/{defectId}/updates
   */
  async addStatusUpdate(
    defectId: string,
    request: AddStatusUpdateRequest
  ): Promise<APIResponse<AddStatusUpdateResponse>> {
    return this.request<AddStatusUpdateResponse>(
      `/admin/defects/${defectId}/updates`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Get defect statistics (helper method)
   */
  async getDefectStatistics(): Promise<APIResponse<{
    total: number;
    byStatus: Record<DefectStatus, number>;
  }>> {
    // Fetch all defects without pagination to get statistics
    const response = await this.getAllDefects({ limit: 1000 });
    
    if (!response.success || !response.data) {
      return response as APIResponse<any>;
    }

    const defects = response.data.defects;
    const byStatus: Record<DefectStatus, number> = {
      'New': 0,
      'Acknowledged': 0,
      'In_Progress': 0,
      'Resolved': 0,
      'Closed': 0,
    };

    defects.forEach(defect => {
      byStatus[defect.status]++;
    });

    return {
      success: true,
      data: {
        total: defects.length,
        byStatus,
      },
    };
  }

  /**
   * Validate status transition (client-side validation)
   */
  isValidStatusTransition(
    currentStatus: DefectStatus,
    newStatus: DefectStatus
  ): boolean {
    const validTransitions: Record<DefectStatus, DefectStatus[]> = {
      'New': ['Acknowledged'],
      'Acknowledged': ['In_Progress'],
      'In_Progress': ['Resolved'],
      'Resolved': ['Closed', 'In_Progress'],
      'Closed': [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Get allowed status transitions for a given status
   */
  getAllowedTransitions(currentStatus: DefectStatus): DefectStatus[] {
    const validTransitions: Record<DefectStatus, DefectStatus[]> = {
      'New': ['Acknowledged'],
      'Acknowledged': ['In_Progress'],
      'In_Progress': ['Resolved'],
      'Resolved': ['Closed', 'In_Progress'],
      'Closed': [],
    };

    return validTransitions[currentStatus] || [];
  }
}

/**
 * Create and export admin API client instance
 * The baseUrl should be configured based on environment
 */
export const createAdminDefectAPIClient = (config: AdminAPIConfig): AdminDefectAPIClient => {
  return new AdminDefectAPIClient(config);
};

// Export default instance with placeholder URL (should be configured in app)
// Use environment variable for Vite
const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
};

export const adminDefectApi = new AdminDefectAPIClient({
  baseUrl: getBaseUrl(),
  timeout: 30000,
});
