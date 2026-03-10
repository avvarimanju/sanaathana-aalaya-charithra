/**
 * WebSocket Lambda Handler
 * Handles WebSocket connections for real-time dashboard updates
 * Feature: real-time-reports-dashboard
 * 
 * Routes:
 * - $connect: Establish WebSocket connection with authentication
 * - $disconnect: Clean up connection
 * - $default: Handle ping/pong and default messages
 * - subscribe: Subscribe to specific data updates
 * - unsubscribe: Unsubscribe from updates
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, DeleteItemCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { WebSocketManager } from '../services/WebSocketManager';
import { getConfig } from '../config';
import { 
  WebSocketConnection,
  FilterState,
  AuthenticatedUser,
  ErrorResponse
} from '../types';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

// Initialize services
const config = getConfig();
const dynamoClient = new DynamoDBClient({ region: config.region });

// Get API Gateway endpoint from environment or construct it
const apiGatewayEndpoint = process.env.WEBSOCKET_API_ENDPOINT || 
  `https://${process.env.WEBSOCKET_API_ID}.execute-api.${config.region}.amazonaws.com/${process.env.STAGE || 'prod'}`;

const webSocketManager = new WebSocketManager(dynamoClient, {
  connectionsTableName: config.connectionsTableName,
  apiGatewayEndpoint,
  connectionTtlHours: 24
});

const apiGatewayClient = new ApiGatewayManagementApiClient({
  endpoint: apiGatewayEndpoint
});

/**
 * Main Lambda handler - routes WebSocket events
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const routeKey = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId!;
  
  console.log(JSON.stringify({
    routeKey,
    connectionId,
    timestamp: new Date().toISOString()
  }));
  
  try {
    switch (routeKey) {
      case '$connect':
        return await handleConnect(event, connectionId);
      
      case '$disconnect':
        return await handleDisconnect(connectionId);
      
      case '$default':
        return await handleDefault(event, connectionId);
      
      case 'subscribe':
        return await handleSubscribe(event, connectionId);
      
      case 'unsubscribe':
        return await handleUnsubscribe(connectionId);
      
      default:
        return createResponse(400, { error: 'Unknown route' });
    }
  } catch (error) {
    console.error('Error handling WebSocket event:', {
      routeKey,
      connectionId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return createResponse(500, { error: 'Internal server error' });
  }
}

/**
 * Handle $connect - Establish WebSocket connection with authentication
 */
async function handleConnect(
  event: APIGatewayProxyEvent,
  connectionId: string
): Promise<APIGatewayProxyResult> {
  try {
    // Authenticate user from query string parameters (token passed during connection)
    const token = event.queryStringParameters?.token;
    
    if (!token) {
      console.error('Connection rejected: No token provided', { connectionId });
      return createResponse(401, { error: 'Authentication required' });
    }
    
    // Decode and validate token (simplified - in production use proper JWT validation)
    const user = await validateToken(token);
    
    // Create connection record
    const connection: WebSocketConnection = {
      connectionId,
      userId: user.userId,
      userRole: user.role,
      region: user.region,
      subscribedFilters: getDefaultFilters(),
      connectedAt: Date.now(),
      lastPingAt: Date.now(),
      ttl: Math.floor(Date.now() / 1000) + 86400 // 24 hours
    };
    
    // Store connection in DynamoDB
    await storeConnection(connection);
    
    // Register connection with WebSocketManager
    await webSocketManager.handleConnect(connectionId, user.userId, user.role, user.region);
    
    console.log('Connection established', {
      connectionId,
      userId: user.userId,
      role: user.role
    });
    
    return createResponse(200, { message: 'Connected' });
    
  } catch (error) {
    console.error('Error in handleConnect:', {
      connectionId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return createResponse(401, { error: 'Authentication failed' });
  }
}

/**
 * Handle $disconnect - Clean up connection
 */
async function handleDisconnect(connectionId: string): Promise<APIGatewayProxyResult> {
  try {
    // Remove connection from DynamoDB
    await deleteConnection(connectionId);
    
    // Clean up in WebSocketManager
    await webSocketManager.handleDisconnect(connectionId);
    
    console.log('Connection disconnected', { connectionId });
    
    return createResponse(200, { message: 'Disconnected' });
    
  } catch (error) {
    console.error('Error in handleDisconnect:', {
      connectionId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return success even on error to avoid connection hanging
    return createResponse(200, { message: 'Disconnected' });
  }
}

/**
 * Handle $default - Handle ping/pong and default messages
 */
async function handleDefault(
  event: APIGatewayProxyEvent,
  connectionId: string
): Promise<APIGatewayProxyResult> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    
    // Handle ping message
    if (body.action === 'ping') {
      // Update last ping time
      await updateLastPing(connectionId);
      
      // Send pong response using API Gateway Management API
      await sendMessage(connectionId, {
        action: 'pong',
        timestamp: Date.now()
      });
      
      return createResponse(200, { message: 'Pong sent' });
    }
    
    // Default response for unknown messages
    return createResponse(200, { message: 'Message received' });
    
  } catch (error) {
    console.error('Error in handleDefault:', {
      connectionId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return createResponse(500, { error: 'Internal server error' });
  }
}

/**
 * Handle subscribe - Subscribe to specific data updates
 */
async function handleSubscribe(
  event: APIGatewayProxyEvent,
  connectionId: string
): Promise<APIGatewayProxyResult> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const filters: FilterState = body.filters || getDefaultFilters();
    
    // Update connection with subscribed filters
    await updateSubscribedFilters(connectionId, filters);
    
    console.log('Subscription updated', {
      connectionId,
      filters
    });
    
    // Send confirmation using API Gateway Management API
    await sendMessage(connectionId, {
      action: 'subscribed',
      filters,
      timestamp: Date.now()
    });
    
    return createResponse(200, { message: 'Subscribed' });
    
  } catch (error) {
    console.error('Error in handleSubscribe:', {
      connectionId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return createResponse(500, { error: 'Internal server error' });
  }
}

/**
 * Handle unsubscribe - Unsubscribe from updates
 */
async function handleUnsubscribe(connectionId: string): Promise<APIGatewayProxyResult> {
  try {
    // Reset filters to default (effectively unsubscribing from specific updates)
    await updateSubscribedFilters(connectionId, getDefaultFilters());
    
    console.log('Unsubscribed', { connectionId });
    
    // Send confirmation using API Gateway Management API
    await sendMessage(connectionId, {
      action: 'unsubscribed',
      timestamp: Date.now()
    });
    
    return createResponse(200, { message: 'Unsubscribed' });
    
  } catch (error) {
    console.error('Error in handleUnsubscribe:', {
      connectionId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return createResponse(500, { error: 'Internal server error' });
  }
}

/**
 * Validate authentication token
 */
async function validateToken(token: string): Promise<AuthenticatedUser> {
  // In production, implement proper JWT validation with AWS Cognito
  // For now, this is a simplified placeholder
  
  try {
    // Decode token (simplified - use proper JWT library in production)
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    return {
      userId: decoded.sub || decoded.userId,
      role: decoded['custom:role'] || 'analyst',
      region: decoded['custom:region'],
      email: decoded.email
    };
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

/**
 * Store connection in DynamoDB
 */
async function storeConnection(connection: WebSocketConnection): Promise<void> {
  const command = new PutItemCommand({
    TableName: config.connectionsTableName,
    Item: marshall(connection)
  });
  
  await dynamoClient.send(command);
}

/**
 * Delete connection from DynamoDB
 */
async function deleteConnection(connectionId: string): Promise<void> {
  const command = new DeleteItemCommand({
    TableName: config.connectionsTableName,
    Key: marshall({ connectionId })
  });
  
  await dynamoClient.send(command);
}

/**
 * Update last ping time
 */
async function updateLastPing(connectionId: string): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: config.connectionsTableName,
    Key: marshall({ connectionId }),
    UpdateExpression: 'SET lastPingAt = :timestamp',
    ExpressionAttributeValues: marshall({
      ':timestamp': Date.now()
    })
  });
  
  await dynamoClient.send(command);
}

/**
 * Update subscribed filters
 */
async function updateSubscribedFilters(
  connectionId: string,
  filters: FilterState
): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: config.connectionsTableName,
    Key: marshall({ connectionId }),
    UpdateExpression: 'SET subscribedFilters = :filters',
    ExpressionAttributeValues: marshall({
      ':filters': filters
    })
  });
  
  await dynamoClient.send(command);
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
 * Send message to WebSocket connection
 */
async function sendMessage(connectionId: string, data: any): Promise<void> {
  try {
    const message = JSON.stringify(data);
    
    await apiGatewayClient.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(message)
      })
    );
  } catch (error) {
    console.error('Error sending message to connection:', {
      connectionId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
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
