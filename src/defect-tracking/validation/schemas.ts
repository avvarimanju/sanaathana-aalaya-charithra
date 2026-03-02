/**
 * Zod validation schemas for Defect Tracking System
 * Feature: defect-tracking
 */

import { z } from 'zod';

/**
 * Device Info Schema
 */
export const DeviceInfoSchema = z.object({
  platform: z.enum(['android', 'ios']),
  osVersion: z.string(),
  appVersion: z.string(),
  deviceModel: z.string().optional()
});

/**
 * Defect Status Schema
 */
export const DefectStatusSchema = z.enum([
  'New',
  'Acknowledged',
  'In_Progress',
  'Resolved',
  'Closed'
]);

/**
 * Notification Type Schema
 */
export const NotificationTypeSchema = z.enum([
  'STATUS_CHANGE',
  'COMMENT_ADDED'
]);

/**
 * Submit Defect Request Schema
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */
export const SubmitDefectSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  stepsToReproduce: z.string()
    .max(5000, 'Steps to reproduce must not exceed 5000 characters')
    .optional(),
  expectedBehavior: z.string()
    .max(2000, 'Expected behavior must not exceed 2000 characters')
    .optional(),
  actualBehavior: z.string()
    .max(2000, 'Actual behavior must not exceed 2000 characters')
    .optional(),
  deviceInfo: DeviceInfoSchema.optional()
});

/**
 * Update Defect Status Request Schema
 */
export const UpdateStatusSchema = z.object({
  newStatus: DefectStatusSchema,
  comment: z.string()
    .max(2000, 'Comment must not exceed 2000 characters')
    .optional()
});

/**
 * Add Status Update Request Schema
 */
export const AddStatusUpdateSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(2000, 'Message must not exceed 2000 characters')
});

/**
 * Defect Schema (full entity)
 */
export const DefectSchema = z.object({
  defectId: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  stepsToReproduce: z.string().max(5000).optional(),
  expectedBehavior: z.string().max(2000).optional(),
  actualBehavior: z.string().max(2000).optional(),
  status: DefectStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deviceInfo: DeviceInfoSchema.optional(),
  updateCount: z.number().int().min(0)
});

/**
 * Status Update Schema (full entity)
 */
export const StatusUpdateSchema = z.object({
  updateId: z.string().uuid(),
  defectId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  previousStatus: DefectStatusSchema.optional(),
  newStatus: DefectStatusSchema.optional(),
  adminId: z.string().uuid(),
  adminName: z.string().min(1).max(200),
  timestamp: z.string().datetime()
});

/**
 * Notification Schema (full entity)
 */
export const NotificationSchema = z.object({
  notificationId: z.string().uuid(),
  userId: z.string().uuid(),
  defectId: z.string().uuid(),
  defectTitle: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: NotificationTypeSchema,
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
  ttl: z.number().int().positive()
});

/**
 * Validation helper function
 */
export function validateDefectSubmission(data: unknown) {
  try {
    const validated = SubmitDefectSchema.parse(data);
    return {
      valid: true as const,
      data: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false as const,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

/**
 * Validation helper for status updates
 */
export function validateStatusUpdate(data: unknown) {
  try {
    const validated = UpdateStatusSchema.parse(data);
    return {
      valid: true as const,
      data: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false as const,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

/**
 * Validation helper for adding status updates
 */
export function validateAddStatusUpdate(data: unknown) {
  try {
    const validated = AddStatusUpdateSchema.parse(data);
    return {
      valid: true as const,
      data: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false as const,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}
