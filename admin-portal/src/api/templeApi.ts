/**
 * Temple Management API
 * API client for temple and artifact operations
 */

import { apiClient } from './client';

export interface Location {
  state: string;
  city: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Temple {
  templeId: string;
  name: string;
  description: string;
  location: Location;
  accessMode: 'FREE' | 'PAID' | 'HYBRID';
  status: 'active' | 'inactive';
  activeArtifactCount: number;
  qrCodeCount?: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export interface CreateTempleRequest {
  name: string;
  description: string;
  location: Location;
  accessMode: 'FREE' | 'PAID' | 'HYBRID';
}

export interface UpdateTempleRequest {
  name?: string;
  description?: string;
  location?: Location;
  accessMode?: 'FREE' | 'PAID' | 'HYBRID';
  status?: 'active' | 'inactive';
}

export interface TempleGroup {
  groupId: string;
  name: string;
  description: string;
  templeIds: string[];
  totalTempleCount: number;
  totalQRCodeCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export interface CreateTempleGroupRequest {
  name: string;
  description: string;
  templeIds: string[];
}

export interface Artifact {
  artifactId: string;
  templeId: string;
  name: string;
  description: string;
  qrCodeId: string;
  qrCodeImageUrl: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CreateArtifactRequest {
  templeId: string;
  name: string;
  description: string;
}

export class TempleApi {
  /**
   * Create a new temple
   */
  async createTemple(data: CreateTempleRequest): Promise<Temple> {
    return apiClient.post<Temple>('/api/temples', data);
  }

  /**
   * Get temple by ID
   */
  async getTemple(templeId: string): Promise<Temple> {
    return apiClient.get<Temple>(`/api/temples/${templeId}`);
  }

  /**
   * List temples with optional filters
   */
  async listTemples(params?: {
    limit?: number;
    accessMode?: 'FREE' | 'PAID' | 'HYBRID';
    status?: 'active' | 'inactive';
  }): Promise<{ items: Temple[]; total: number }> {
    return apiClient.get('/api/temples', params);
  }

  /**
   * Update temple
   */
  async updateTemple(templeId: string, data: UpdateTempleRequest): Promise<Temple> {
    return apiClient.put<Temple>(`/api/temples/${templeId}`, data);
  }

  /**
   * Delete temple
   */
  async deleteTemple(templeId: string): Promise<void> {
    return apiClient.delete(`/api/temples/${templeId}`);
  }

  /**
   * Create temple group
   */
  async createTempleGroup(data: CreateTempleGroupRequest): Promise<TempleGroup> {
    return apiClient.post<TempleGroup>('/api/temple-groups', data);
  }

  /**
   * Get temple group by ID
   */
  async getTempleGroup(groupId: string): Promise<TempleGroup> {
    return apiClient.get<TempleGroup>(`/api/temple-groups/${groupId}`);
  }

  /**
   * List temple groups
   */
  async listTempleGroups(params?: {
    limit?: number;
    status?: 'active' | 'inactive';
  }): Promise<{ items: TempleGroup[]; total: number }> {
    return apiClient.get('/api/temple-groups', params);
  }

  /**
   * Create artifact with QR code
   */
  async createArtifact(data: CreateArtifactRequest): Promise<Artifact> {
    return apiClient.post<Artifact>('/api/artifacts', data);
  }

  /**
   * Get artifact by ID
   */
  async getArtifact(artifactId: string): Promise<Artifact> {
    return apiClient.get<Artifact>(`/api/artifacts/${artifactId}`);
  }

  /**
   * List artifacts for a temple
   */
  async listArtifacts(params?: {
    templeId?: string;
    status?: 'active' | 'inactive';
    type?: string;
    limit?: number;
  }): Promise<{ items: Artifact[]; total: number }> {
    return apiClient.get('/api/artifacts', params);
  }

  /**
   * Update artifact
   */
  async updateArtifact(artifactId: string, data: Partial<Artifact>): Promise<Artifact> {
    return apiClient.put<Artifact>(`/api/artifacts/${artifactId}`, data);
  }

  /**
   * Delete artifact
   */
  async deleteArtifact(artifactId: string): Promise<void> {
    return apiClient.delete(`/api/artifacts/${artifactId}`);
  }
}

// Export singleton instance
export const templeApi = new TempleApi();
