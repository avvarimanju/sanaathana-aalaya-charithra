/**
 * Validation utilities for Temple Pricing Management
 */

import { ValidationError } from './errors';
import config from '../config';

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

export function validatePriceAmount(amount: number): ValidationResult {
  const errors: Array<{ field: string; message: string; value?: any }> = [];

  if (typeof amount !== 'number') {
    errors.push({
      field: 'priceAmount',
      message: 'Price amount must be a number',
      value: amount,
    });
  } else if (isNaN(amount)) {
    errors.push({
      field: 'priceAmount',
      message: 'Price amount must be a valid number',
      value: amount,
    });
  } else if (amount < config.pricing.minPrice) {
    errors.push({
      field: 'priceAmount',
      message: `Price amount must be at least ${config.pricing.minPrice}`,
      value: amount,
    });
  } else if (amount > config.pricing.maxPrice) {
    errors.push({
      field: 'priceAmount',
      message: `Price amount must not exceed ${config.pricing.maxPrice}`,
      value: amount,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRequiredString(value: any, fieldName: string): ValidationResult {
  const errors: Array<{ field: string; message: string; value?: any }> = [];

  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required and must be a non-empty string`,
      value,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUUID(value: any, fieldName: string): ValidationResult {
  const errors: Array<{ field: string; message: string; value?: any }> = [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!value || typeof value !== 'string' || !uuidRegex.test(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a valid UUID`,
      value,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateEntityType(value: any): ValidationResult {
  const errors: Array<{ field: string; message: string; value?: any }> = [];
  const validTypes = ['TEMPLE', 'GROUP'];

  if (!validTypes.includes(value)) {
    errors.push({
      field: 'entityType',
      message: `Entity type must be one of: ${validTypes.join(', ')}`,
      value,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateAccessMode(value: any): ValidationResult {
  const errors: Array<{ field: string; message: string; value?: any }> = [];
  const validModes = ['QR_CODE_SCAN', 'OFFLINE_DOWNLOAD', 'HYBRID'];

  if (value && !validModes.includes(value)) {
    errors.push({
      field: 'accessMode',
      message: `Access mode must be one of: ${validModes.join(', ')}`,
      value,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateNonNegativeNumber(value: any, fieldName: string): ValidationResult {
  const errors: Array<{ field: string; message: string; value?: any }> = [];

  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a non-negative number`,
      value,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(r => r.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

export function throwIfInvalid(result: ValidationResult): void {
  if (!result.isValid) {
    throw new ValidationError('Validation failed', result.errors);
  }
}
