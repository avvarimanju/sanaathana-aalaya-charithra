/**
 * Access Control Service Lambda Handler
 * 
 * Handles access grant management and verification
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { formatErrorResponse } from '../../utils/errors';
import logger from '../../utils/logger';
import {
  createAccessGrant,
  getUserAccessGrants,
  revokeAccessGrant,
  verifyAccess,
  getAccessibleQRCodes,
  verifyOfflineDownloadPermission,
} from './accessControlService';
import { AccessGrantRequest, EntityType } from '../../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logger.info('Access Control request received', {
    requestId,
    method: event.httpMethod,
    path: event.path,
  });

  try {
    const path = event.path;
    const method = event.httpMethod;

    // POST /api/access/grant - Create access grant
    if (method === 'POST' && path === '/api/access/grant') {
      const request: AccessGrantRequest = JSON.parse(event.body || '{}');
      const grant = await createAccessGrant(request);
      
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          data: grant,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // GET /api/access/user/{userId} - Get user access grants
    if (method === 'GET' && path.startsWith('/api/access/user/')) {
      const userId = path.split('/').pop();
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: { message: 'User ID is required' },
            requestId,
          }),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        };
      }

      const grants = await getUserAccessGrants(userId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: grants,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // POST /api/access/verify - Verify QR code access
    if (method === 'POST' && path === '/api/access/verify') {
      const { userId, qrCodeId } = JSON.parse(event.body || '{}');
      const result = await verifyAccess(userId, qrCodeId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: result,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // GET /api/access/qr-codes/{entityType}/{entityId} - Get accessible QR codes
    if (method === 'GET' && path.startsWith('/api/access/qr-codes/')) {
      const pathParts = path.split('/');
      const entityType = pathParts[4] as EntityType;
      const entityId = pathParts[5];
      const userId = event.queryStringParameters?.userId;

      if (!userId || !entityType || !entityId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: { message: 'userId, entityType, and entityId are required' },
            requestId,
          }),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        };
      }

      const qrCodes = await getAccessibleQRCodes(userId, entityType, entityId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: qrCodes,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // POST /api/access/verify-download - Verify offline download permission
    if (method === 'POST' && path === '/api/access/verify-download') {
      const { userId, entityId } = JSON.parse(event.body || '{}');
      const hasPermission = await verifyOfflineDownloadPermission(userId, entityId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: { hasPermission },
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // DELETE /api/access/revoke - Revoke access grant
    if (method === 'DELETE' && path === '/api/access/revoke') {
      const { userId, entityType, entityId } = JSON.parse(event.body || '{}');
      await revokeAccessGrant(userId, entityType, entityId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Access grant revoked successfully',
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Route not found
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: { message: 'Route not found' },
        requestId,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    logger.error('Access Control error', error as Error, { requestId });
    return formatErrorResponse(error as Error, requestId);
  }
}
