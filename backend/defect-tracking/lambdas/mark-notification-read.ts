/**
 * Lambda Handler: Mark Notification as Read
 * PUT /notifications/{notificationId}/read
 * 
 * Marks a notification as read
 * 
 * Requirements: 8.4
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
 * Lambda handler for marking notification as read
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Mark notification read request:', JSON.stringify(event, null, 2));

  try {
    // Extract notificationId from path parameters
    const notificationId = event.pathParameters?.notificationId;
    
    if (!notificationId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'notificationId is required in path parameters'
        })
      };
    }

    // Mark notification as read
    await notificationService.markAsRead(notificationId);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        notificationId,
        isRead: true
      })
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);

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
