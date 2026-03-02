/**
 * Lambda Handler: Get Defect Details
 * GET /defects/{defectId}
 * 
 * Retrieves detailed information about a specific defect including status updates
 * 
 * Requirements: 2.2, 2.3, 2.4, 3.4, 3.5, 10.5
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DefectService, NotFoundError, ForbiddenError } from '../services/DefectService';
import { DefectRepository } from '../repositories/DefectRepository';
import { StatusUpdateRepository } from '../repositories/StatusUpdateRepository';
import { StatusWorkflowService } from '../services/StatusWorkflowService';
import { NotificationService } from '../services/NotificationService';
import { NotificationRepository } from '../repositories/NotificationRepository';

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
 * Lambda handler for getting defect details
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get defect details request:', JSON.stringify(event, null, 2));

  try {
    // Extract defectId from path parameters
    const defectId = event.pathParameters?.defectId;
    
    if (!defectId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'defectId is required in path parameters'
        })
      };
    }

    // Extract requesterId from authorizer context or headers
    // In a real implementation, this would come from the JWT token
    const requesterId = event.requestContext.authorizer?.claims?.sub || 
                       event.headers['x-user-id'] || 
                       '';

    if (!requesterId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'UNAUTHORIZED',
          message: 'User authentication required'
        })
      };
    }

    // Get defect details
    const result = await defectService.getDefectDetails(defectId, requesterId);

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
    console.error('Error getting defect details:', error);

    // Handle not found errors
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: error.message
        })
      };
    }

    // Handle forbidden errors
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'FORBIDDEN',
          message: error.message
        })
      };
    }

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
