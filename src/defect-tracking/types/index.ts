/**
 * Type definitions for Defect Tracking System
 * Feature: defect-tracking
 */

/**
 * Defect status enum representing the lifecycle states
 */
export type DefectStatus = 
  | 'New'
  | 'Acknowledged'
  | 'In_Progress'
  | 'Resolved'
  | 'Closed';

/**
 * Notification type enum
 */
export type NotificationType = 
  | 'STATUS_CHANGE'
  | 'COMMENT_ADDED';

/**
 * Device information captured during defect submission
 */
export interface DeviceInfo {
  platform: 'android' | 'ios';
  osVersion: string;
  appVersion: string;
  deviceModel?: string;
}

/**
 * Core Defect entity
 */
export interface Defect {
  // Primary Key
  defectId: string;
  
  // User Information
  userId: string;
  
  // Defect Details
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  
  // Status
  status: DefectStatus;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Device Information
  deviceInfo?: DeviceInfo;
  
  // Metadata
  updateCount: number;
}

/**
 * Status Update entity
 */
export interface StatusUpdate {
  // Primary Key
  updateId: string;
  
  // Foreign Key
  defectId: string;
  
  // Update Details
  message: string;
  
  // Status Change (optional)
  previousStatus?: DefectStatus;
  newStatus?: DefectStatus;
  
  // Admin Information
  adminId: string;
  adminName: string;
  
  // Timestamp
  timestamp: string;
}

/**
 * Notification entity
 */
export interface Notification {
  // Primary Key
  notificationId: string;
  
  // User Information
  userId: string;
  
  // Defect Reference
  defectId: string;
  defectTitle: string;
  
  // Notification Details
  message: string;
  type: NotificationType;
  
  // Status
  isRead: boolean;
  
  // Timestamp
  createdAt: string;
  
  // TTL for auto-deletion (Unix timestamp)
  ttl: number;
}

/**
 * Request/Response Types
 */

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

export interface DefectFilters {
  status?: DefectStatus;
  limit?: number;
  lastEvaluatedKey?: string;
}

export interface AdminDefectFilters extends DefectFilters {
  search?: string;
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

export interface DefectDetails extends Defect {
  statusUpdates: StatusUpdate[];
}

export interface DefectList {
  defects: DefectSummary[];
  lastEvaluatedKey?: string;
  totalCount?: number;
}

export interface StatusUpdateResult {
  defectId: string;
  previousStatus: DefectStatus;
  newStatus: DefectStatus;
  updatedAt: string;
}

export interface UpdateDefectStatusRequest {
  newStatus: DefectStatus;
  comment?: string;
}

export interface AddStatusUpdateRequest {
  message: string;
}

/**
 * Validation Types
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  data?: any;
}

/**
 * Error Context for logging
 */
export interface ErrorContext {
  requestId: string;
  userId?: string;
  operation: string;
  timestamp: string;
}

/**
 * Status Transition Map
 */
export const STATUS_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  'New': ['Acknowledged'],
  'Acknowledged': ['In_Progress'],
  'In_Progress': ['Resolved'],
  'Resolved': ['Closed', 'In_Progress'],
  'Closed': []
};
