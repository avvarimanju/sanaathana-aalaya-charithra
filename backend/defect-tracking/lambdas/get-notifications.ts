/**
 * Lambda Handler: Get Notifications
 * GET /notifications/user/{userId}
 * 
 * Retrieves notifications for a specific user
 * 
 * Requirements: 8.3
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NotificationService } from '../services/NotificationService';
import { NotificationRepository } from '../repositories/NotificationRepository';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize repositories and services
const notificationRepository = new NotificationRepository(
  docClient,
  process.env.NOTIFICATIONS_TABLE_NAME || 'Notifications'
);
const notificationService = new NotificationService(notificationRepository);

/**
 * Lambda handler for getting user notifications
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get notifications request:', JSON.stringify(event, null, 2));

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

    // Parse query parameters
    const unreadOnly = event.queryStringParameters?.unreadOnly === 'true';

    // Get notifications
    const notifications = await notificationService.getUserNotifications(
      userId,
      unreadOnly
    );

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        notifications
      })
    };
  } catch (error) {
    console.error('Error getting notifications:', error);

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
