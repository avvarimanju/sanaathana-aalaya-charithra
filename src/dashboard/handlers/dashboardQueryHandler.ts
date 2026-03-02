/**
 * Dashboard Query Lambda Handler
 * Feature: real-time-reports-dashboard
 * Task: 10.1
 * 
 * REST API endpoint handlers for dashboard queries:
 * - GET /dashboard/metrics
 * - GET /dashboard/reviews
 * - GET /dashboard/comments
 * - GET /dashboard/visualizations
 * 
 * Validates: Requirements 1.1, 2.1, 4.1, 5.1, 6.1, 7.1, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DashboardService } from '../services/DashboardService';
import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { CacheService } from '../services/CacheService';
import { MetricsAggregator } from '../services/MetricsAggregator';
import { getConfig } from '../config';
import { FilterState, CommentType, AuthenticatedUser, ErrorResponse } from '../types';
import { TrendGranularity } from '../services/MetricsAggregator';

// Initialize AWS clients
const config = getConfig();
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));

// Initialize services
const feedbackRepository = new FeedbackRepository(dynamoClient, config.feedbackTableName);
const cacheService = new CacheService(config.redisEndpoint, config.redisPort);
const metricsAggregator = new MetricsAggregator();
const dashboardService = new DashboardService(feedbackRepository, cacheService, metricsAggregator);

/**
 * Main Lambda handler - routes requests to appropriate endpoint handlers
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  try {
    // Extract authenticated user from request context (set by authorizer)
    const user = extractAuthenticatedUser(event);
    
    // Log request
    console.log('Dashboard query request', {
      requestId,
      path: event.path,
      method: event.httpMethod,
      userId: user.userId,
      userRole: user.role
    });

    // Route to appropriate handler based on path
    const path = event.path;
    
    if (path.endsWith('/metrics')) {
      return await handleGetMetrics(event, user, requestId);
    } else if (path.endsWith('/reviews')) {
      return await handleGetReviews(event, user, requestId);
    } else if (path.endsWith('/comments')) {
      return await handleGetComments(event, user, requestId);
    } else if (path.endsWith('/visualizations')) {
      return await handleGetVisualizations(event, user, requestId);
    } else {
      return createErrorResponse(404, 'NOT_FOUND', 'Endpoint not found', requestId);
    }
  } catch (error) {
    console.error('Dashboard query error', { requestId, error });
    return handleError(error, requestId);
  }
}

/**
 * Handle GET /dashboard/metrics
 * Returns aggregated metrics for the dashboard
 */
async function handleGetMetrics(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser,
  requestId: string
): Promise<APIGatewayProxyResult> {
  // Parse filters from query parameters
  const filters = parseFilters(event.queryStringParameters || {});
  
  // Get metrics
  const metrics = await dashboardService.getMetrics(filters, user.role, user.region);
  
  return createSuccessResponse(metrics, requestId);
}

/**
 * Handle GET /dashboard/reviews
 * Returns paginated reviews
 */
async function handleGetReviews(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser,
  requestId: string
): Promise<APIGatewayProxyResult> {
  // Parse filters and pagination from query parameters
  const params = event.queryStringParameters || {};
  const filters = parseFilters(params);
  const page = parseInt(params.page || '1');
  const pageSize = parseInt(params.pageSize || '50');
  
  // Validate pagination parameters
  if (page < 1) {
    return createErrorResponse(400, 'INVALID_PARAMETER', 'Page must be >= 1', requestId);
  }
  if (pageSize < 1 || pageSize > 100) {
    return createErrorResponse(400, 'INVALID_PARAMETER', 'Page size must be between 1 and 100', requestId);
  }
  
  // Get reviews
  const reviews = await dashboardService.getReviews(filters, page, pageSize, user.role, user.region);
  
  return createSuccessResponse(reviews, requestId);
}

/**
 * Handle GET /dashboard/comments
 * Returns filtered comments
 */
async function handleGetComments(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser,
  requestId: string
): Promise<APIGatewayProxyResult> {
  // Parse filters and comment-specific parameters
  const params = event.queryStringParameters || {};
  const filters = parseFilters(params);
  const commentType = params.commentType as CommentType | undefined;
  const searchKeyword = params.search;
  
  // Validate comment type if provided
  if (commentType && !['general', 'suggestion', 'complaint'].includes(commentType)) {
    return createErrorResponse(
      400,
      'INVALID_PARAMETER',
      'Comment type must be one of: general, suggestion, complaint',
      requestId
    );
  }
  
  // Get comments
  const comments = await dashboardService.getComments(
    filters,
    commentType,
    searchKeyword,
    user.role,
    user.region
  );
  
  return createSuccessResponse(comments, requestId);
}

/**
 * Handle GET /dashboard/visualizations
 * Returns visualization data for charts
 */
async function handleGetVisualizations(
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser,
  requestId: string
): Promise<APIGatewayProxyResult> {
  // Parse filters and visualization parameters
  const params = event.queryStringParameters || {};
  const filters = parseFilters(params);
  const granularity = (params.granularity || 'day') as TrendGranularity;
  
  // Validate granularity
  if (!['hour', 'day', 'week', 'month'].includes(granularity)) {
    return createErrorResponse(
      400,
      'INVALID_PARAMETER',
      'Granularity must be one of: hour, day, week, month',
      requestId
    );
  }
  
  // Get visualizations
  const visualizations = await dashboardService.getVisualizations(
    filters,
    granularity,
    user.role,
    user.region
  );
  
  return createSuccessResponse(visualizations, requestId);
}

/**
 * Extract authenticated user from API Gateway event
 * User info is set by the authorizer Lambda
 */
function extractAuthenticatedUser(event: APIGatewayProxyEvent): AuthenticatedUser {
  const authorizer = event.requestContext.authorizer;
  
  if (!authorizer || !authorizer.userId) {
    throw new Error('UNAUTHORIZED: Missing authentication');
  }
  
  return {
    userId: authorizer.userId,
    role: authorizer.role || 'analyst',
    region: authorizer.region,
    email: authorizer.email
  };
}

/**
 * Parse filter parameters from query string
 */
function parseFilters(params: Record<string, string | undefined>): FilterState {
  return {
    timeRange: (params.timeRange as any) || 'last_30_days',
    templeIds: params.templeIds ? params.templeIds.split(',') : [],
    regions: params.regions ? params.regions.split(',') : [],
    categories: params.categories ? params.categories.split(',') : []
  };
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, requestId: string): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Request-Id': requestId
    },
    body: JSON.stringify({
      data,
      requestId,
      timestamp: new Date().toISOString()
    })
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
      'X-Request-Id': requestId
    },
    body: JSON.stringify(errorResponse)
  };
}

/**
 * Handle errors and convert to appropriate HTTP responses
 */
function handleError(error: any, requestId: string): APIGatewayProxyResult {
  // Handle specific error types
  if (error.message?.includes('UNAUTHORIZED')) {
    return createErrorResponse(401, 'UNAUTHORIZED', 'Authentication required', requestId);
  }
  
  if (error.message?.includes('FORBIDDEN')) {
    return createErrorResponse(403, 'FORBIDDEN', 'Access denied', requestId);
  }
  
  if (error.name === 'ValidationException') {
    return createErrorResponse(400, 'VALIDATION_ERROR', error.message, requestId);
  }
  
  if (error.name === 'ResourceNotFoundException') {
    return createErrorResponse(404, 'NOT_FOUND', 'Resource not found', requestId);
  }
  
  // Default to internal server error
  return createErrorResponse(
    500,
    'INTERNAL_ERROR',
    'An internal error occurred',
    requestId,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}
