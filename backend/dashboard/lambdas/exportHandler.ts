/**
 * Export Lambda Handler
 * Handles report export requests (CSV and PDF)
 * Feature: real-time-reports-dashboard
 * 
 * Endpoint:
 * - POST /dashboard/export
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DashboardService } from '../services/DashboardService';
import { ReportGenerator } from '../services/ReportGenerator';
import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { CacheService } from '../services/CacheService';
import { MetricsAggregator } from '../services/MetricsAggregator';
import { getConfig } from '../config';
import { 
  FilterState, 
  ExportFormat,
  ErrorResponse,
  AuthenticatedUser
} from '../types';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

// Initialize services
const config = getConfig();
const s3Client = new S3Client({ region: config.region });
const feedbackRepository = new FeedbackRepository(config.feedbackTableName, config.region);
const cacheService = new CacheService(config);
const metricsAggregator = new MetricsAggregator();
const dashboardService = new DashboardService(
  feedbackRepository,
  cacheService,
  metricsAggregator
);
const reportGenerator = new ReportGenerator();

/**
 * Main Lambda handler for export requests
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  try {
    // Authenticate and authorize user
    const user = await authenticateUser(event);
    
    // Log export request
    console.log(JSON.stringify({
      requestId,
      userId: user.userId,
      role: user.role,
      action: 'export_request',
      timestamp: new Date().toISOString()
    }));
    
    // Parse request body
    const body = parseRequestBody(event.body);
    
    // Validate export format
    const format = validateExportFormat(body.format);
    
    // Parse filters
    const filters = body.filters || getDefaultFilters();
    
    // Apply role-based filtering
    applyRoleBasedFiltering(filters, user);
    
    // Check rate limiting (simplified - in production use DynamoDB or Redis)
    await checkRateLimit(user.userId);
    
    // Fetch dashboard data
    const dashboardData = await dashboardService.getDashboardData(filters, user.userId, user.role);
    
    // Generate report with timeout handling
    const reportBuffer = await Promise.race([
      generateReport(format, dashboardData, filters, body.includeCharts),
      createTimeout(config.maxExportRecords > 10000 ? 30000 : 10000)
    ]);
    
    if (!reportBuffer) {
      throw new TimeoutError('Report generation timed out');
    }
    
    // Upload to S3
    const s3Key = await uploadToS3(reportBuffer, format, user.userId, requestId);
    
    // Generate presigned URL for download
    const downloadUrl = await generateDownloadUrl(s3Key);
    
    // Log successful export
    console.log(JSON.stringify({
      requestId,
      userId: user.userId,
      action: 'export_completed',
      format,
      s3Key,
      size: reportBuffer.length,
      timestamp: new Date().toISOString()
    }));
    
    return createSuccessResponse({
      downloadUrl,
      s3Key,
      format,
      expiresIn: 3600 // URL expires in 1 hour
    }, requestId);
    
  } catch (error) {
    console.error('Error handling export request:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof AuthenticationError) {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        error.message,
        requestId
      );
    } else if (error instanceof AuthorizationError) {
      return createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.AUTHORIZATION_FAILED,
        error.message,
        requestId
      );
    } else if (error instanceof ValidationError) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_REQUEST,
        error.message,
        requestId,
        error.details
      );
    } else if (error instanceof TimeoutError) {
      return createErrorResponse(
        HTTP_STATUS.GATEWAY_TIMEOUT,
        ERROR_CODES.TIMEOUT,
        error.message,
        requestId
      );
    } else if (error instanceof RateLimitError) {
      return createErrorResponse(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        error.message,
        requestId
      );
    } else {
      return createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
        'An unexpected error occurred during export',
        requestId
      );
    }
  }
}

/**
 * Generate report based on format
 */
async function generateReport(
  format: ExportFormat,
  dashboardData: any,
  filters: FilterState,
  includeCharts: boolean = true
): Promise<Buffer> {
  if (format === 'csv') {
    return await reportGenerator.generateCSV(dashboardData, filters);
  } else {
    // For PDF, we need chart images if includeCharts is true
    const charts = includeCharts ? await generateChartImages(dashboardData.visualizations) : [];
    return await reportGenerator.generatePDF(dashboardData, filters, charts);
  }
}

/**
 * Generate chart images for PDF export
 */
async function generateChartImages(visualizations: any): Promise<any[]> {
  // In a real implementation, this would render charts to images
  // For now, return empty array as placeholder
  return [];
}

/**
 * Upload report to S3
 */
async function uploadToS3(
  buffer: Buffer,
  format: ExportFormat,
  userId: string,
  requestId: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const s3Key = `exports/${userId}/${timestamp}-${requestId}.${format}`;
  
  const command = new PutObjectCommand({
    Bucket: config.exportBucketName,
    Key: s3Key,
    Body: buffer,
    ContentType: format === 'csv' ? 'text/csv' : 'application/pdf',
    Metadata: {
      userId,
      requestId,
      generatedAt: new Date().toISOString()
    }
  });
  
  await s3Client.send(command);
  
  return s3Key;
}

/**
 * Generate presigned URL for download
 */
async function generateDownloadUrl(s3Key: string): Promise<string> {
  // In production, use S3 presigned URLs
  // For now, return a placeholder URL
  return `https://${config.exportBucketName}.s3.${config.region}.amazonaws.com/${s3Key}`;
}

/**
 * Check rate limiting for exports
 */
async function checkRateLimit(userId: string): Promise<void> {
  // In production, implement proper rate limiting using DynamoDB or Redis
  // For now, this is a placeholder
  // Should check if user has exceeded maxExportsPerHour
}

/**
 * Authenticate user from JWT token
 */
async function authenticateUser(event: APIGatewayProxyEvent): Promise<AuthenticatedUser> {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    throw new AuthenticationError('Authorization header is required');
  }
  
  const token = authHeader.replace(/^Bearer\s+/i, '');
  
  if (!token) {
    throw new AuthenticationError('Invalid authorization header format');
  }
  
  // Extract user from JWT claims (populated by API Gateway authorizer)
  const claims = event.requestContext.authorizer?.claims;
  
  if (!claims) {
    throw new AuthenticationError('Invalid or expired token');
  }
  
  const userId = claims.sub || claims['cognito:username'];
  const role = claims['custom:role'] || 'analyst';
  const region = claims['custom:region'];
  const email = claims.email;
  
  if (!userId) {
    throw new AuthenticationError('User ID not found in token');
  }
  
  // Verify user has required role
  const allowedRoles = ['admin', 'analyst', 'regional_manager'];
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError('User does not have required role for export access');
  }
  
  return {
    userId,
    role,
    region,
    email
  };
}

/**
 * Apply role-based data filtering
 */
function applyRoleBasedFiltering(filters: FilterState, user: AuthenticatedUser): void {
  // Regional managers can only see data from their region
  if (user.role === 'regional_manager' && user.region) {
    filters.regions = [user.region];
  }
}

/**
 * Parse request body
 */
function parseRequestBody(body: string | null): any {
  if (!body) {
    throw new ValidationError('Request body is required');
  }
  
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }
}

/**
 * Validate export format
 */
function validateExportFormat(format: any): ExportFormat {
  if (!format) {
    throw new ValidationError('Export format is required');
  }
  
  const validFormats: ExportFormat[] = ['csv', 'pdf'];
  
  if (!validFormats.includes(format)) {
    throw new ValidationError(`Invalid export format. Must be one of: ${validFormats.join(', ')}`);
  }
  
  return format;
}

/**
 * Get default filters
 */
function getDefaultFilters(): FilterState {
  return {
    timeRange: 'last_30_days',
    templeIds: [],
    regions: [],
    categories: []
  };
}

/**
 * Create timeout promise
 */
function createTimeout(ms: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), ms);
  });
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, requestId: string): APIGatewayProxyResult {
  return {
    statusCode: HTTP_STATUS.OK,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'X-Request-Id': requestId
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create error response
 */
function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
  details?: any
): APIGatewayProxyResult {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      details,
      requestId,
      timestamp: new Date().toISOString()
    }
  };
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'X-Request-Id': requestId
    },
    body: JSON.stringify(errorResponse)
  };
}

/**
 * Custom error classes
 */
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

class ValidationError extends Error {
  details?: any;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}
