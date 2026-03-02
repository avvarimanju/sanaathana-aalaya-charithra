/**
 * Validation tests for Defect Tracking System
 * Feature: defect-tracking
 * 
 * Tests validation schemas and helper functions
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */

import {
  validateDefectSubmission,
  validateStatusUpdate,
  validateAddStatusUpdate
} from '../../src/defect-tracking/validation/schemas';

describe('Defect Validation', () => {
  describe('validateDefectSubmission', () => {
    it('should accept valid defect submission with all fields', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Bug Title',
        description: 'This is a valid bug description with enough characters',
        stepsToReproduce: 'Step 1, Step 2, Step 3',
        expectedBehavior: 'Expected behavior description',
        actualBehavior: 'Actual behavior description',
        deviceInfo: {
          platform: 'android' as const,
          osVersion: '13.0',
          appVersion: '1.0.0',
          deviceModel: 'Pixel 7'
        }
      };

      const result = validateDefectSubmission(validData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should accept valid defect submission with only required fields', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Bug Title',
        description: 'This is a valid bug description with enough characters'
      };

      const result = validateDefectSubmission(validData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject submission with missing title (Requirement 7.1)', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'This is a valid bug description'
      };

      const result = validateDefectSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'title')).toBe(true);
    });

    it('should reject submission with missing description (Requirement 7.2)', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Bug Title'
      };

      const result = validateDefectSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'description')).toBe(true);
    });

    it('should reject submission with title shorter than 5 characters (Requirement 7.3)', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Bug',
        description: 'This is a valid bug description'
      };

      const result = validateDefectSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      const titleError = result.errors?.find(e => e.field === 'title');
      expect(titleError).toBeDefined();
      expect(titleError?.message).toContain('at least 5 characters');
    });

    it('should reject submission with description shorter than 10 characters (Requirement 7.4)', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Bug Title',
        description: 'Short'
      };

      const result = validateDefectSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      const descError = result.errors?.find(e => e.field === 'description');
      expect(descError).toBeDefined();
      expect(descError?.message).toContain('at least 10 characters');
    });

    it('should reject submission with title exceeding 200 characters', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'A'.repeat(201),
        description: 'This is a valid bug description'
      };

      const result = validateDefectSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      const titleError = result.errors?.find(e => e.field === 'title');
      expect(titleError).toBeDefined();
      expect(titleError?.message).toContain('not exceed 200 characters');
    });

    it('should reject submission with description exceeding 5000 characters', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Bug Title',
        description: 'A'.repeat(5001)
      };

      const result = validateDefectSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      const descError = result.errors?.find(e => e.field === 'description');
      expect(descError).toBeDefined();
      expect(descError?.message).toContain('not exceed 5000 characters');
    });

    it('should reject submission with invalid userId format', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        title: 'Valid Bug Title',
        description: 'This is a valid bug description'
      };

      const result = validateDefectSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      const userIdError = result.errors?.find(e => e.field === 'userId');
      expect(userIdError).toBeDefined();
      expect(userIdError?.message).toContain('UUID');
    });

    it('should reject submission with invalid device platform', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Bug Title',
        description: 'This is a valid bug description',
        deviceInfo: {
          platform: 'windows' as any,
          osVersion: '11',
          appVersion: '1.0.0'
        }
      };

      const result = validateDefectSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateStatusUpdate', () => {
    it('should accept valid status update', () => {
      const validData = {
        newStatus: 'Acknowledged' as const,
        comment: 'We are looking into this issue'
      };

      const result = validateStatusUpdate(validData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should accept status update without comment', () => {
      const validData = {
        newStatus: 'In_Progress' as const
      };

      const result = validateStatusUpdate(validData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid status value', () => {
      const invalidData = {
        newStatus: 'InvalidStatus' as any
      };

      const result = validateStatusUpdate(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject comment exceeding 2000 characters', () => {
      const invalidData = {
        newStatus: 'Acknowledged' as const,
        comment: 'A'.repeat(2001)
      };

      const result = validateStatusUpdate(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      const commentError = result.errors?.find(e => e.field === 'comment');
      expect(commentError).toBeDefined();
      expect(commentError?.message).toContain('not exceed 2000 characters');
    });
  });

  describe('validateAddStatusUpdate', () => {
    it('should accept valid status update message', () => {
      const validData = {
        message: 'We have identified the root cause and are working on a fix'
      };

      const result = validateAddStatusUpdate(validData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject empty message', () => {
      const invalidData = {
        message: ''
      };

      const result = validateAddStatusUpdate(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      const messageError = result.errors?.find(e => e.field === 'message');
      expect(messageError).toBeDefined();
      expect(messageError?.message).toContain('required');
    });

    it('should reject message exceeding 2000 characters', () => {
      const invalidData = {
        message: 'A'.repeat(2001)
      };

      const result = validateAddStatusUpdate(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      const messageError = result.errors?.find(e => e.field === 'message');
      expect(messageError).toBeDefined();
      expect(messageError?.message).toContain('not exceed 2000 characters');
    });

    it('should reject missing message field', () => {
      const invalidData = {};

      const result = validateAddStatusUpdate(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
