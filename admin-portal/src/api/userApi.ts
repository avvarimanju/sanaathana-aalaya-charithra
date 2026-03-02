/**
 * User Management API Client
 */

import { apiClient } from './client';

export interface AdminUser {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'moderator' | 'viewer';
  status: 'active' | 'suspended';
  lastLogin: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface MobileUser {
  userId: string;
  name: string;
  email: string;
  status: 'active' | 'suspended';
  qrScans?: number;
  lastActive?: string;
  joinedDate: string;
  updatedAt?: string;
}

export interface AdminUserFilters {
  role?: string;
  status?: string;
  search?: string;
  limit?: number;
}

export interface MobileUserFilters {
  status?: string;
  search?: string;
  limit?: number;
}

export interface CreateAdminUserRequest {
  name: string;
  email: string;
  role: 'admin' | 'moderator' | 'viewer';
}

/**
 * Get all admin users
 */
export async function getAdminUsers(filters?: AdminUserFilters): Promise<{ items: AdminUser[]; total: number }> {
  return apiClient.get('/api/admin/users', filters);
}

/**
 * Get a single admin user
 */
export async function getAdminUser(userId: string): Promise<AdminUser> {
  return apiClient.get(`/api/admin/users/${userId}`);
}

/**
 * Create a new admin user
 */
export async function createAdminUser(request: CreateAdminUserRequest): Promise<AdminUser> {
  return apiClient.post('/api/admin/users', request);
}

/**
 * Update an admin user
 */
export async function updateAdminUser(userId: string, updates: Partial<AdminUser>): Promise<AdminUser> {
  return apiClient.put(`/api/admin/users/${userId}`, updates);
}

/**
 * Delete an admin user
 */
export async function deleteAdminUser(userId: string): Promise<void> {
  return apiClient.delete(`/api/admin/users/${userId}`);
}

/**
 * Get all mobile app users
 */
export async function getMobileUsers(filters?: MobileUserFilters): Promise<{ items: MobileUser[]; total: number }> {
  return apiClient.get('/api/mobile/users', filters);
}

/**
 * Update mobile user status (active/suspended)
 */
export async function updateMobileUserStatus(userId: string, status: 'active' | 'suspended'): Promise<MobileUser> {
  return apiClient.put(`/api/mobile/users/${userId}/status`, { status });
}
