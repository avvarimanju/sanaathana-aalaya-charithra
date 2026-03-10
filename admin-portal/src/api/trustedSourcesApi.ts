// Trusted Sources API Client
// API functions for managing trusted sources

import { apiClient } from './client';

export interface TrustedSource {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: 'temple_official' | 'state_authority' | 'heritage_authority' | 'custom';
  verificationStatus: 'verified' | 'pending' | 'unverified';
  verifiedBy?: string;
  verifiedDate?: string;
  applicableStates?: string[];
  applicableTemples?: string[];
  trustScore: number;
  isActive: boolean;
  addedBy: string;
  addedDate: string;
  updatedBy?: string;
  updatedDate?: string;
  metadata: {
    description?: string;
    contactEmail?: string;
    managementBody?: string;
    lastChecked?: string;
    notes?: string;
  };
}

export interface TempleSourceMapping {
  mappingId: string;
  templeId: string;
  sourceId: string;
  isPrimary: boolean;
  priority: number;
  usedForContentGeneration: boolean;
  lastUsed?: string;
  contentQualityScore?: number;
  addedBy: string;
  addedDate: string;
}

export interface CreateTrustedSourceRequest {
  sourceName: string;
  sourceUrl: string;
  sourceType: 'temple_official' | 'state_authority' | 'heritage_authority' | 'custom';
  applicableStates?: string[];
  applicableTemples?: string[];
  trustScore?: number;
  metadata?: {
    description?: string;
    contactEmail?: string;
    managementBody?: string;
    notes?: string;
  };
}

export interface UpdateTrustedSourceRequest {
  sourceName?: string;
  sourceUrl?: string;
  sourceType?: 'temple_official' | 'state_authority' | 'heritage_authority' | 'custom';
  applicableStates?: string[];
  applicableTemples?: string[];
  trustScore?: number;
  isActive?: boolean;
  metadata?: {
    description?: string;
    contactEmail?: string;
    managementBody?: string;
    notes?: string;
  };
}

export interface AddTempleSourceRequest {
  sourceId: string;
  isPrimary?: boolean;
  priority?: number;
  usedForContentGeneration?: boolean;
}

export interface TrustedSourcesResponse {
  sources: TrustedSource[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TempleSourcesResponse {
  templeSources: Array<TrustedSource & { mapping: TempleSourceMapping }>;
  total: number;
}

/**
 * List all trusted sources with pagination and filtering
 */
export async function listTrustedSources(params?: {
  page?: number;
  pageSize?: number;
  sourceType?: string;
  verificationStatus?: string;
  isActive?: boolean;
}): Promise<TrustedSourcesResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.sourceType) queryParams.append('sourceType', params.sourceType);
  if (params?.verificationStatus) queryParams.append('verificationStatus', params.verificationStatus);
  if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

  const response = await apiClient.get<{ data: TrustedSourcesResponse }>(
    `/api/admin/trusted-sources?${queryParams.toString()}`
  );
  
  return response.data;
}

/**
 * Get a single trusted source by ID
 */
export async function getTrustedSource(sourceId: string): Promise<TrustedSource> {
  const response = await apiClient.get<{ data: TrustedSource }>(
    `/api/admin/trusted-sources/${sourceId}`
  );
  
  return response.data;
}

/**
 * Create a new trusted source
 */
export async function createTrustedSource(
  request: CreateTrustedSourceRequest
): Promise<TrustedSource> {
  const response = await apiClient.post<{ data: TrustedSource }>(
    '/api/admin/trusted-sources',
    request
  );
  
  return response.data;
}

/**
 * Update an existing trusted source
 */
export async function updateTrustedSource(
  sourceId: string,
  request: UpdateTrustedSourceRequest
): Promise<TrustedSource> {
  const response = await apiClient.put<{ data: TrustedSource }>(
    `/api/admin/trusted-sources/${sourceId}`,
    request
  );
  
  return response.data;
}

/**
 * Delete a trusted source
 */
export async function deleteTrustedSource(sourceId: string): Promise<void> {
  await apiClient.delete(`/api/admin/trusted-sources/${sourceId}`);
}

/**
 * Verify a trusted source
 */
export async function verifyTrustedSource(sourceId: string): Promise<TrustedSource> {
  const response = await apiClient.post<{ data: TrustedSource }>(
    `/api/admin/trusted-sources/${sourceId}/verify`
  );
  
  return response.data;
}

/**
 * Unverify a trusted source
 */
export async function unverifyTrustedSource(sourceId: string): Promise<TrustedSource> {
  const response = await apiClient.post<{ data: TrustedSource }>(
    `/api/admin/trusted-sources/${sourceId}/unverify`
  );
  
  return response.data;
}

/**
 * Get all sources mapped to a temple
 */
export async function getTempleSources(templeId: string): Promise<TempleSourcesResponse> {
  const response = await apiClient.get<{ data: TempleSourcesResponse }>(
    `/api/admin/temples/${templeId}/sources`
  );
  
  return response.data;
}

/**
 * Add a source to a temple
 */
export async function addSourceToTemple(
  templeId: string,
  request: AddTempleSourceRequest
): Promise<TempleSourceMapping> {
  const response = await apiClient.post<{ data: TempleSourceMapping }>(
    `/api/admin/temples/${templeId}/sources`,
    request
  );
  
  return response.data;
}

/**
 * Remove a source from a temple
 */
export async function removeSourceFromTemple(
  templeId: string,
  sourceId: string
): Promise<void> {
  await apiClient.delete(`/api/admin/temples/${templeId}/sources/${sourceId}`);
}
