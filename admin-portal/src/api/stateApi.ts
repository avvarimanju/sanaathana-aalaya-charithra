/**
 * State Management API
 * API client for managing state visibility in mobile app
 */

import { apiClient } from './client';

export interface StateVisibilitySettings {
  [stateCode: string]: boolean;
}

export interface StateVisibilityResponse {
  settings: StateVisibilitySettings;
  updatedAt: string;
  updatedBy: string;
}

export class StateApi {
  /**
   * Get state visibility settings
   */
  async getStateVisibility(): Promise<StateVisibilityResponse> {
    return apiClient.get<StateVisibilityResponse>('/api/states/visibility');
  }

  /**
   * Update state visibility settings
   */
  async updateStateVisibility(settings: StateVisibilitySettings): Promise<StateVisibilityResponse> {
    return apiClient.put<StateVisibilityResponse>('/api/states/visibility', { settings });
  }

  /**
   * Get visible states for mobile app (public endpoint)
   */
  async getVisibleStates(): Promise<string[]> {
    return apiClient.get<string[]>('/api/public/states/visible');
  }
}

// Export singleton instance
export const stateApi = new StateApi();
