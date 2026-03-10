/**
 * API Client Configuration
 * Base client for making HTTP requests to the local backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface ApiError {
  error: string;
  details?: string;
  isConnectionRefused?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set user ID for admin actions
   */
  setUserId(userId: string) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      'x-user-id': userId,
    };
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.defaultHeaders,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleFetchError(error);
    }
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleFetchError(error);
    }
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.defaultHeaders,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleFetchError(error);
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.defaultHeaders,
      });

      if (response.status === 204) {
        return undefined as T;
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleFetchError(error);
    }
  }

  /**
   * Handle fetch errors (network errors, connection refused, etc.)
   */
  private handleFetchError(error: any): Error {
    // Check if it's a TypeError which typically indicates network errors
    if (error instanceof TypeError) {
      // Check for connection refused or network failure
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('ERR_CONNECTION_REFUSED')) {
        const connectionError = new Error(
          'Backend server is not running. Please start the backend server on port 4000.'
        ) as Error & { isConnectionRefused: boolean };
        connectionError.isConnectionRefused = true;
        return connectionError;
      }
    }
    
    // Return the original error if it's not a connection issue
    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || 'API request failed');
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Check server health
   */
  async healthCheck(): Promise<{ status: string; environment: string; timestamp: string }> {
    try {
      return await this.get('/health');
    } catch (error) {
      // Re-throw with connection info if it's a connection error
      throw error;
    }
  }

  /**
   * Check if backend server is accessible
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
