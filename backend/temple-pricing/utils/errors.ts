/**
 * Custom error classes for Temple Pricing Management
 */

export class TemplePricingError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message);
    this.name = 'TemplePricingError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends TemplePricingError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends TemplePricingError {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} with ID ${entityId} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends TemplePricingError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends TemplePricingError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends TemplePricingError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ServiceError extends TemplePricingError {
  constructor(message: string, details?: any) {
    super(message, 500, 'SERVICE_ERROR', details);
    this.name = 'ServiceError';
  }
}

export class PaymentMismatchError extends TemplePricingError {
  constructor(expectedAmount: number, actualAmount: number) {
    super(
      `Payment amount mismatch: expected ${expectedAmount}, received ${actualAmount}`,
      400,
      'PAYMENT_MISMATCH',
      { expectedAmount, actualAmount }
    );
    this.name = 'PaymentMismatchError';
  }
}

export class AccessDeniedError extends TemplePricingError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'ACCESS_DENIED');
    this.name = 'AccessDeniedError';
  }
}

export function isTemplePricingError(error: any): error is TemplePricingError {
  return error instanceof TemplePricingError;
}

export function formatErrorResponse(error: Error, requestId?: string) {
  if (isTemplePricingError(error)) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId,
          timestamp: new Date().toISOString(),
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  // Unknown error - return generic 500
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId,
        timestamp: new Date().toISOString(),
      },
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };
}
