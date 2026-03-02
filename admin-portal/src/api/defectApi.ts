/**
 * Defect Tracking API Client
 */

import { apiClient } from './client';

export interface Defect {
  defectId: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'feedback';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo: string | null;
  comments: DefectComment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface DefectComment {
  commentId: string;
  comment: string;
  author: string;
  createdAt: string;
}

export interface DefectFilters {
  status?: string;
  priority?: string;
  type?: string;
  assignedTo?: string;
  limit?: number;
}

export interface CreateDefectRequest {
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'feedback';
  priority?: 'low' | 'medium' | 'high';
  reportedBy?: string;
}

export interface AddCommentRequest {
  comment: string;
  author?: string;
}

/**
 * Get all defects
 */
export async function getDefects(filters?: DefectFilters): Promise<{ items: Defect[]; total: number }> {
  return apiClient.get('/api/defects', filters);
}

/**
 * Get a single defect
 */
export async function getDefect(defectId: string): Promise<Defect> {
  return apiClient.get(`/api/defects/${defectId}`);
}

/**
 * Create a new defect
 */
export async function createDefect(request: CreateDefectRequest): Promise<Defect> {
  return apiClient.post('/api/defects', request);
}

/**
 * Update a defect
 */
export async function updateDefect(defectId: string, updates: Partial<Defect>): Promise<Defect> {
  return apiClient.put(`/api/defects/${defectId}`, updates);
}

/**
 * Delete a defect
 */
export async function deleteDefect(defectId: string): Promise<void> {
  return apiClient.delete(`/api/defects/${defectId}`);
}

/**
 * Add a comment to a defect
 */
export async function addDefectComment(defectId: string, request: AddCommentRequest): Promise<DefectComment> {
  return apiClient.post(`/api/defects/${defectId}/comments`, request);
}
