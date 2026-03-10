/**
 * Lambda Handler: Update Defect Status (Admin)
 * PUT /admin/defects/{defectId}/status
 * 
 * Updates the status of a defect with workflow validation (admin only)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.6, 8.1, 10.1
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { 
  DefectService, 
  NotFoundError, 
  InvalidTransitionError 
} from '../services/DefectService';
import { DefectRepository } from '../repositories/DefectRepository';
import { StatusUpdateRepository } from '../repositories/StatusUpdateRepository';
import { StatusWorkflowService } from '../services/StatusWorkflowService';
import { NotificationService } from '../services/NotificationService';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { UpdateDefectStatusRequest } from '../types';

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
 * Lambda handler for updating defect status (admin only)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Update defect status request:', JSON.stringify(event, null, 2));

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

    const request: UpdateDefectStatusRequest = JSON.parse(event.body);

    if (!request.newStatus) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'newStatus is required'
        })
      };
    }

    // Update defect status
    const result = await defectService.updateDefectStatus(
      defectId,
      adminId,
      adminName,
      request.newStatus,
      request.comment
    );

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
    console.error('Error updating defect status:', error);

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

    // Handle invalid transition errors
    if (error instanceof InvalidTransitionError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'INVALID_STATUS_TRANSITION',
          message: error.message,
          currentStatus: error.currentStatus,
          attemptedStatus: error.attemptedStatus,
          allowedTransitions: error.allowedTransitions
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
