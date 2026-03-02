/**
 * DashboardApiClient - Task 15.1
 * REST API client with authentication and error handling
 */

import {
  DashboardData,
  FilterState,
  PaginatedReviews,
  Comment,
  AggregatedMetrics,
  VisualizationData,
  ExportFormat,
  CommentType
} from '../../types';

export class DashboardApiClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getDashboardData(filters: FilterState): Promise<DashboardData> {
    const params = this.buildFilterParams(filters);
    return this.request(`/dashboard/metrics?${params}`);
  }

  async getMetrics(filters: FilterState): Promise<AggregatedMetrics> {
    const params = this.buildFilterParams(filters);
    return this.request(`/dashboard/metrics?${params}`);
  }

  async getReviews(filters: FilterState, page: number = 1, pageSize: number = 50): Promise<PaginatedReviews> {
    const params = this.buildFilterParams(filters);
    return this.request(`/dashboard/reviews?${params}&page=${page}&pageSize=${pageSize}`);
  }

  async getComments(
    filters: FilterState,
    commentType?: CommentType,
    searchKeyword?: string
  ): Promise<Comment[]> {
    const params = this.buildFilterParams(filters);
    const typeParam = commentType ? `&commentType=${commentType}` : '';
    const searchParam = searchKeyword ? `&search=${encodeURIComponent(searchKeyword)}` : '';
    return this.request(`/dashboard/comments?${params}${typeParam}${searchParam}`);
  }

  async getVisualizations(filters: FilterState, granularity: string = 'day'): Promise<VisualizationData> {
    const params = this.buildFilterParams(filters);
    return this.request(`/dashboard/visualizations?${params}&granularity=${granularity}`);
  }

  async exportData(filters: FilterState, format: ExportFormat): Promise<{ jobId: string; status: string }> {
    return this.request('/dashboard/export', {
      method: 'POST',
      body: JSON.stringify({ filters, format })
    });
  }

  private buildFilterParams(filters: FilterState): string {
    const params = new URLSearchParams();
    params.append('timeRange', filters.timeRange);
    if (filters.templeIds.length > 0) {
      params.append('templeIds', filters.templeIds.join(','));
    }
    if (filters.regions.length > 0) {
      params.append('regions', filters.regions.join(','));
    }
    if (filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }
    return params.toString();
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('API request error', { endpoint, error });
      throw error;
    }
  }
}
