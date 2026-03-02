/**
 * Lambda Handler: Get All Defects (Admin)
 * GET /admin/defects
 * 
 * Retrieves all defects with filtering and search capabilities (admin only)
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.6
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DefectService } from '../services/DefectService';
import { DefectRepository } from '../repositories/DefectRepository';
import { StatusUpdateRepository } from '../repositories/StatusUpdateRepository';
import { StatusWorkflowService } from '../services/StatusWorkflowService';
import { NotificationService } from '../services/NotificationService';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { AdminDefectFilters, DefectStatus } from '../types';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize repositories and services
const defectRepository = new DefectRepository(
  docClient,
  process.env.DEFECTS_TABLE_NAME || 'Defects'
);
const statusUpdateRepository = new StatusUpdateRepository(
  docClient,
  process.env.STATUS_UPDATES_TABLE_NAME || 'StatusUpdates'
);
const notificationRepository = new NotificationRepository(
  docClient,
  process.env.NOTIFICATIONS_TABLE_NAME || 'Notifications'
);
const statusWorkflowService = new StatusWorkflowService();
const notificationService = new NotificationService(notificationRepository);
const defectService = new DefectService(
  defectRepository,
  statusUpdateRepository,
  statusWorkflowService,
  notificationService
);

/**
 * Verify admin authorization
 */
const isAdmin = (event: APIGatewayProxyEvent): boolean => {
  // Check if user has admin role from authorizer context
  const userRole = event.requestContext.authorizer?.claims?.role || 
                  event.headers['x-user-role'];
  
  return userRole === 'admin';
};

/**
 * Lambda handler for getting all defects (admin only)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get all defects request:', JSON.stringify(event, null, 2));

  try {
    // Verify admin authorization
    if (!isAdmin(event)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'FORBIDDEN',
          message: 'Admin privileges required for this operation'
        })
      };
    }

    // Parse query parameters for filters
    const filters: AdminDefectFilters = {};
    
    if (event.queryStringParameters?.status) {
      filters.status = event.queryStringParameters.status as DefectStatus;
    }
    
    if (event.queryStringParameters?.search) {
      filters.search = event.queryStringParameters.search;
    }
    
    if (event.queryStringParameters?.limit) {
      filters.limit = parseInt(event.queryStringParameters.limit, 10);
    }
    
    if (event.queryStringParameters?.lastEvaluatedKey) {
      filters.lastEvaluatedKey = event.queryStringParameters.lastEvaluatedKey;
    }

    // Get all defects
    const result = await defectService.getAllDefects(filters);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error getting all defects:', error);

    // Handle unknown errors
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId: event.requestContext.requestId
      })
    };
  }
};
