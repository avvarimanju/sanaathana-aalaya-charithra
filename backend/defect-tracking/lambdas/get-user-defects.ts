/**
 * Lambda Handler: Get User Defects
 * GET /defects/user/{userId}
 * 
 * Retrieves all defects submitted by a specific user
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
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
import { DefectFilters, DefectStatus } from '../types';

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
 * Lambda handler for getting user defects
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get user defects request:', JSON.stringify(event, null, 2));

  try {
    // Extract userId from path parameters
    const userId = event.pathParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'userId is required in path parameters'
        })
      };
    }

    // Parse query parameters for filters
    const filters: DefectFilters = {};
    
    if (event.queryStringParameters?.status) {
      filters.status = event.queryStringParameters.status as DefectStatus;
    }
    
    if (event.queryStringParameters?.limit) {
      filters.limit = parseInt(event.queryStringParameters.limit, 10);
    }
    
    if (event.queryStringParameters?.lastEvaluatedKey) {
      filters.lastEvaluatedKey = event.queryStringParameters.lastEvaluatedKey;
    }

    // Get user defects
    const result = await defectService.getUserDefects(userId, filters);

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
    console.error('Error getting user defects:', error);

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
