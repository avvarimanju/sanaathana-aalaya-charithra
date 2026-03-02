/**
 * Content Generation API Client
 */

import { apiClient } from './client';

export interface ContentJob {
  jobId: string;
  artifactId: string;
  contentType: string;
  language: string;
  sources: string[];
  customPrompt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GeneratedContent {
  contentId: string;
  artifactId: string;
  language: string;
  contentType: string;
  text?: string;
  audioUrl?: string;
  videoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface ContentJobFilters {
  status?: string;
  artifactId?: string;
  limit?: number;
}

export interface GenerateContentRequest {
  artifactId: string;
  contentType: string;
  language: string;
  sources?: string[];
  customPrompt?: string;
}

/**
 * Get all content generation jobs
 */
export async function getContentJobs(filters?: ContentJobFilters): Promise<{ items: ContentJob[]; total: number }> {
  return apiClient.get('/api/content/jobs', filters);
}

/**
 * Get a single content generation job
 */
export async function getContentJob(jobId: string): Promise<ContentJob> {
  return apiClient.get(`/api/content/jobs/${jobId}`);
}

/**
 * Create a new content generation job
 */
export async function generateContent(request: GenerateContentRequest): Promise<ContentJob> {
  return apiClient.post('/api/content/generate', request);
}

/**
 * Update a content generation job
 */
export async function updateContentJob(jobId: string, updates: Partial<ContentJob>): Promise<ContentJob> {
  return apiClient.put(`/api/content/jobs/${jobId}`, updates);
}

/**
 * Delete a content generation job
 */
export async function deleteContentJob(jobId: string): Promise<void> {
  return apiClient.delete(`/api/content/jobs/${jobId}`);
}

/**
 * Get generated content for an artifact
 */
export async function getGeneratedContent(artifactId: string, language?: string): Promise<{ items: GeneratedContent[] }> {
  return apiClient.get('/api/content', { artifactId, language });
}
