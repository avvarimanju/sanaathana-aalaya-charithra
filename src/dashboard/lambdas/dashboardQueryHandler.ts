/**
 * Dashboard Query Lambda Handler
 * Handles REST API endpoints for dashboard data queries
 * Feature: real-time-reports-dashboard
 * 
 * Endpoints:
 * - GET /dashboard/metrics
 * - GET /dashboard/reviews
 * - GET /dashboard/comments
 * - GET /dashboard/visualizations
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DashboardService } from '../services/DashboardService';
import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { CacheService } from '../services/CacheService';
import { MetricsAggregator } from '../services/MetricsAggregator';
import { getConfig } from '../config';
import { 
  FilterState, 
  PaginationState, 
  TimeRange, 
  CommentType,
  ErrorResponse,
  AuthenticatedUser
} from '../types';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

// Initialize services
const config = getConfig();
const feedbackRepository = new FeedbackRepository(config.feedbackTableName, config.region);
const cacheService = new CacheService(config);
const metricsAggregator = new MetricsAggregator();
const dashboardService = new DashboardService(
  feedbackRepository,
  cacheService,
  metricsAggregator
);

/**
 * Main Lambda handler - routes requests to appropriate endpoint handlers
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  try {
    // Authenticate and authorize user
    const user = await authenticateUser(event);
    
    // Log access attempt
    console.log(JSON.stringify({
      requestId,
      userId: user.userId,
      role: user.role,
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString()
    }));
    
    // Route to appropriate handler
    const path = event.path;
    const method = event.httpMethod;
    
    if (method === 'GET' && path.endsWith('/metrics')) {
      return await handleGetMetrics(event, user, requestId);
    } else if (method === 'GET' && path.endsWith('/reviews')) {
      return await handleGetReviews(event, user, requestId);
    } else if (method === 'GET' && path.endsWith('/comments')) {
      return await handleGetComments(event, user, requestId);
    } else if (method === 'GET' && path.endsWith('/visualizations')) {
      return await handleGetVisualizations(event, user, requestId);
    } else {
      return createErrorResponse(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND,
        'Endpoint not found',
        requestId
      );
    }
  } catch (error) {
    console.error('Error handling request:', {
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
    } else {
      return createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
        'An unexpected error occurred',
        requestId
      );
    }
  }
}

/**
 * Handle GET /dashboard/metrics
 */
async function handleGetMetrics(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const filters = parseFilters(event.queryStringParameters || {});
  
  // Apply role-based filtering
  applyRoleBasedFiltering(filters, user);
  
  const dashboardData = await dashboardService.getDashboardData(filters, user.userId, user.role);
  
  return createSuccessResponse(dashboardData.metrics, requestId);
}

/**
 * Handle GET /dashboard/reviews
 */
async function handleGetReviews(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const filters = parseFilters(event.queryStringParameters || {});
  const pagination = parsePagination(event.queryStringParameters || {});
  
  // Apply role-based filtering
  applyRoleBasedFiltering(filters, user);
  
  const paginatedReviews = await dashboardService.getReviews(filters, pagination);
  
  return createSuccessResponse(paginatedReviews, requestId);
}

/**
 * Handle GET /dashboard/comments
 */
async function handleGetComments(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const filters = parseFilters(event.queryStringParameters || {});
  const commentType = parseCommentType(event.queryStringParameters?.commentType);
  const search = event.queryStringParameters?.search;
  
  // Apply role-based filtering
  applyRoleBasedFiltering(filters, user);
  
  const comments = await dashboardService.getComments(filters, commentType, search);
  
  return createSuccessResponse(comments, requestId);
}

/**
 * Handle GET /dashboard/visualizations
 */
async function handleGetVisualizations(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const filters = parseFilters(event.queryStringParameters || {});
  
  // Apply role-based filtering
  applyRoleBasedFiltering(filters, user);
  
  const dashboardData = await dashboardService.getDashboardData(filters, user.userId, user.role);
  
  return createSuccessResponse(dashboardData.visualizations, requestId);
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
    throw new AuthorizationError('User does not have required role for dashboard access');
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
 * Parse filter parameters from query string
 */
function parseFilters(params: Record<string, string | undefined>): FilterState {
  const timeRange = parseTimeRange(params.timeRange);
  const templeIds = parseArrayParam(params.templeIds);
  const regions = parseArrayParam(params.regions);
  const categories = parseArrayParam(params.categories);
  
  return {
    timeRange,
    templeIds,
    regions,
    categories
  };
}

/**
 * Parse pagination parameters from query string
 */
function parsePagination(params: Record<string, string | undefined>): PaginationState {
  const page = parseInt(params.page || '1');
  const pageSize = parseInt(params.pageSize || String(config.defaultPageSize));
  
  if (page < 1) {
    throw new ValidationError('Page must be greater than 0');
  }
  
  if (pageSize < 1 || pageSize > 100) {
    throw new ValidationError('Page size must be between 1 and 100');
  }
  
  return {
    page,
    pageSize,
    totalPages: 0,
    totalItems: 0
  };
}

/**
 * Parse time range parameter
 */
function parseTimeRange(value: string | undefined): TimeRange {
  const validRanges: TimeRange[] = ['today', 'last_7_days', 'last_30_days', 'last_90_days', 'all_time'];
  const timeRange = (value || 'last_30_days') as TimeRange;
  
  if (!validRanges.includes(timeRange)) {
    throw new ValidationError(`Invalid time range. Must be one of: ${validRanges.join(', ')}`);
  }
  
  return timeRange;
}

/**
 * Parse comment type parameter
 */
function parseCommentType(value: string | undefined): CommentType | undefined {
  if (!value) {
    return undefined;
  }
  
  const validTypes: CommentType[] = ['general', 'suggestion', 'complaint'];
  const commentType = value as CommentType;
  
  if (!validTypes.includes(commentType)) {
    throw new ValidationError(`Invalid comment type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  return commentType;
}

/**
 * Parse comma-separated array parameter
 */
function parseArrayParam(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  
  return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
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
