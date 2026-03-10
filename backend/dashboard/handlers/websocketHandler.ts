/**
 * WebSocket Lambda Handlers
 * Feature: real-time-reports-dashboard
 * Task: 10.3
 * 
 * WebSocket API handlers for real-time updates:
 * - $connect: Connection establishment with authentication
 * - $disconnect: Connection cleanup
 * - $default: Default handler for ping/pong
 * - subscribe: Subscribe to dashboard updates
 * - unsubscribe: Unsubscribe from updates
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi';
import { WebSocketManager } from '../services/WebSocketManager';
import { getConfig } from '../config';
import { FilterState, AuthenticatedUser } from '../types';

// Initialize AWS clients
const config = getConfig();
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));

// WebSocket manager (API Gateway Management API client will be created per request)
let webSocketManager: WebSocketManager;

/**
 * Main Lambda handler - routes WebSocket events
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const routeKey = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId!;
  
  // Initialize WebSocket manager with API Gateway endpoint
  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const apiGatewayClient = new ApiGatewayManagementApiClient({ endpoint });
  webSocketManager = new WebSocketManager(dynamoClient, apiGatewayClient, config.connectionsTableName);
  
  try {
    console.log('WebSocket event', { routeKey, connectionId });
    
    switch (routeKey) {
      case '$connect':
        return await handleConnect(event);
      
      case '$disconnect':
        return await handleDisconnect(event);
      
      case '$default':
        return await handleDefault(event);
      
      case 'subscribe':
        return await handleSubscribe(event);
      
      case 'unsubscribe':
        return await handleUnsubscribe(event);
      
      default:
        return createResponse(400, { error: 'Unknown route' });
    }
  } catch (error) {
    console.error('WebSocket handler error', { routeKey, connectionId, error });
    return handleError(error);
  }
}

/**
 * Handle $connect route
 * Establishes WebSocket connection with authentication
 */
async function handleConnect(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId!;
  
  try {
    // Extract authentication from query parameters
    // In production, this would validate JWT token
    const queryParams = event.queryStringParameters || {};
    const token = queryParams.token;
    
    if (!token) {
      return createResponse(401, { error: 'Authentication required' });
    }
    
    // Validate token and extract user info
    // For now, we'll mock this - in production, validate JWT
    const user = await validateToken(token);
    
    // Create connection
    await webSocketManager.handleConnect(
      connectionId,
      user.userId,
      user.role,
      user.region
    );
    
    console.log('WebSocket connected', { connectionId, userId: user.userId });
    
    return createResponse(200, { message: 'Connected' });
    
  } catch (error) {
    console.error('Connect error', { connectionId, error });
    return createResponse(401, { error: 'Authentication failed' });
  }
}

/**
 * Handle $disconnect route
 * Cleans up connection
 */
async function handleDisconnect(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId!;
  
  try {
    await webSocketManager.handleDisconnect(connectionId);
    console.log('WebSocket disconnected', { connectionId });
    
    return createResponse(200, { message: 'Disconnected' });
    
  } catch (error) {
    console.error('Disconnect error', { connectionId, error });
    // Return success even on error - connection is gone anyway
    return createResponse(200, { message: 'Disconnected' });
  }
}

/**
 * Handle $default route
 * Handles ping/pong and unknown messages
 */
async function handleDefault(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId!;
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    // Handle ping
    if (body.action === 'ping') {
      await webSocketManager.pushUpdate(connectionId, {
        type: 'metrics',
        data: { pong: true },
        timestamp: Date.now()
      });
      
      return createResponse(200, { message: 'Pong' });
    }
    
    // Unknown message
    return createResponse(400, { error: 'Unknown action' });
    
  } catch (error) {
    console.error('Default handler error', { connectionId, error });
    return createResponse(500, { error: 'Internal error' });
  }
}

/**
 * Handle subscribe action
 * Subscribes connection to dashboard updates with filters
 */
async function handleSubscribe(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId!;
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    const filters: FilterState = body.filters || {
      timeRange: 'last_30_days',
      templeIds: [],
      regions: [],
      categories: []
    };
    
    // Update connection with subscription filters
    await webSocketManager.updateSubscription(connectionId, filters);
    
    console.log('Subscription updated', { connectionId, filters });
    
    // Send confirmation
    await webSocketManager.pushUpdate(connectionId, {
      type: 'metrics',
      data: { subscribed: true, filters },
      timestamp: Date.now()
    });
    
    return createResponse(200, { message: 'Subscribed' });
    
  } catch (error) {
    console.error('Subscribe error', { connectionId, error });
    return createResponse(500, { error: 'Subscription failed' });
  }
}

/**
 * Handle unsubscribe action
 * Unsubscribes connection from updates
 */
async function handleUnsubscribe(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId!;
  
  try {
    // Clear subscription filters
    await webSocketManager.updateSubscription(connectionId, {
      timeRange: 'all_time',
      templeIds: [],
      regions: [],
      categories: []
    });
    
    console.log('Unsubscribed', { connectionId });
    
    return createResponse(200, { message: 'Unsubscribed' });
    
  } catch (error) {
    console.error('Unsubscribe error', { connectionId, error });
    return createResponse(500, { error: 'Unsubscribe failed' });
  }
}

/**
 * Validate authentication token
 * In production, this would validate JWT with AWS Cognito
 */
async function validateToken(token: string): Promise<AuthenticatedUser> {
  // Mock implementation - in production, validate JWT
  // For now, decode a simple format: userId:role:region
  const parts = token.split(':');
  
  if (parts.length < 2) {
    throw new Error('Invalid token format');
  }
  
  return {
    userId: parts[0],
    role: parts[1] as any,
    region: parts[2]
  };
}

/**
 * Create WebSocket response
 */
function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    body: JSON.stringify(body)
  };
}

/**
 * Handle errors
 */
function handleError(error: any): APIGatewayProxyResult {
  if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('Authentication')) {
    return createResponse(401, { error: 'Unauthorized' });
  }
  
  return createResponse(500, { error: 'Internal error' });
}
