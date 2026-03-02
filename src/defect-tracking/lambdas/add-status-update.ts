/**
 * Lambda Handler: Add Status Update (Admin)
 * POST /admin/defects/{defectId}/updates
 * 
 * Adds a comment/status update to a defect (admin only)
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.2, 10.2
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DefectService, NotFoundError } from '../services/DefectService';
import { DefectRepository } from '../repositories/DefectRepository';
import { StatusUpdateRepository } from '../repositories/StatusUpdateRepository';
import { StatusWorkflowService } from '../services/StatusWorkflowService';
import { NotificationService } from '../services/NotificationService';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { AddStatusUpdateRequest } from '../types';

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
 * Verify admin authorization and extract admin info
 */
const getAdminInfo = (event: APIGatewayProxyEvent): { isAdmin: boolean; adminId: string; adminName: string } => {
  const userRole = event.requestContext.authorizer?.claims?.role || 
                  event.headers['x-user-role'];
  
  const adminId = event.requestContext.authorizer?.claims?.sub || 
                 event.headers['x-user-id'] || 
                 '';
  
  const adminName = event.requestContext.authorizer?.claims?.name || 
                   event.headers['x-user-name'] || 
                   'Admin';
  
  return {
    isAdmin: userRole === 'admin',
    adminId,
    adminName
  };
};

/**
 * Lambda handler for adding status updates (admin only)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Add status update request:', JSON.stringify(event, null, 2));

  try {
    // Verify admin authorization
    const { isAdmin, adminId, adminName } = getAdminInfo(event);
    
    if (!isAdmin) {
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

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Request body is required'
        })
      };
    }

    const request: AddStatusUpdateRequest = JSON.parse(event.body);

    if (!request.message) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'message is required'
        })
      };
    }

    // Add status update
    const result = await defectService.addStatusUpdate(
      defectId,
      adminId,
      adminName,
      request.message
    );

    // Return success response
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error adding status update:', error);

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
