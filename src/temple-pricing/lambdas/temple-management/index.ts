/**
 * Temple Management Service Lambda Handler
 * 
 * Handles CRUD operations for temples, temple groups, and artifacts
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { formatErrorResponse } from '../../utils/errors';
import logger from '../../utils/logger';
import * as templeService from './templeService';
import { CreateTempleRequest, UpdateTempleRequest, CreateGroupRequest, UpdateGroupRequest } from '../../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logger.info('Temple Management request received', {
    requestId,
    method: event.httpMethod,
    path: event.path,
  });

  try {
    const userId = event.requestContext.authorizer?.principalId || 'system';
    const method = event.httpMethod;
    const pathParts = event.path.split('/').filter(p => p);
    
    // Route: POST /api/admin/temples - Create temple
    if (method === 'POST' && pathParts[pathParts.length - 1] === 'temples') {
      const request: CreateTempleRequest = JSON.parse(event.body || '{}');
      const temple = await templeService.createTemple(request, userId);
      
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          data: temple,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: GET /api/admin/temples/{templeId} - Get temple
    if (method === 'GET' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'temples') {
      const templeId = pathParts[pathParts.length - 1];
      const temple = await templeService.getTemple(templeId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: temple,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: GET /api/admin/temples - List temples
    if (method === 'GET' && pathParts[pathParts.length - 1] === 'temples') {
      const filters = {
        accessMode: event.queryStringParameters?.accessMode as any,
        status: event.queryStringParameters?.status as any,
        limit: event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : undefined,
      };
      
      const result = await templeService.listTemples(filters);
      
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
    
    // Route: PUT /api/admin/temples/{templeId} - Update temple
    if (method === 'PUT' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'temples') {
      const templeId = pathParts[pathParts.length - 1];
      const request: UpdateTempleRequest = JSON.parse(event.body || '{}');
      const temple = await templeService.updateTemple(templeId, request, userId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: temple,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: DELETE /api/admin/temples/{templeId} - Delete temple
    if (method === 'DELETE' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'temples') {
      const templeId = pathParts[pathParts.length - 1];
      await templeService.deleteTemple(templeId, userId);
      
      return {
        statusCode: 204,
        body: '',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: POST /api/admin/temples/bulk-update - Bulk update temples
    if (method === 'POST' && pathParts[pathParts.length - 1] === 'bulk-update' && pathParts[pathParts.length - 2] === 'temples') {
      const { updates } = JSON.parse(event.body || '{}');
      const result = await templeService.bulkUpdateTemples(updates, userId);
      
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
    
    // Route: POST /api/admin/temples/bulk-delete - Bulk delete temples
    if (method === 'POST' && pathParts[pathParts.length - 1] === 'bulk-delete' && pathParts[pathParts.length - 2] === 'temples') {
      const { templeIds } = JSON.parse(event.body || '{}');
      const result = await templeService.bulkDeleteTemples(templeIds, userId);
      
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
    
    // ========================================================================
    // Temple Group Routes
    // ========================================================================
    
    // Route: POST /api/admin/temple-groups - Create temple group
    if (method === 'POST' && pathParts[pathParts.length - 1] === 'temple-groups') {
      const request: CreateGroupRequest = JSON.parse(event.body || '{}');
      const group = await templeService.createTempleGroup(request, userId);
      
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          data: group,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: GET /api/admin/temple-groups/{groupId} - Get temple group
    if (method === 'GET' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'temple-groups') {
      const groupId = pathParts[pathParts.length - 1];
      const group = await templeService.getTempleGroup(groupId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: group,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: GET /api/admin/temple-groups - List temple groups
    if (method === 'GET' && pathParts[pathParts.length - 1] === 'temple-groups') {
      const filters = {
        status: event.queryStringParameters?.status as any,
        limit: event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : undefined,
      };
      
      const result = await templeService.listTempleGroups(filters);
      
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
    
    // Route: PUT /api/admin/temple-groups/{groupId} - Update temple group
    if (method === 'PUT' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'temple-groups') {
      const groupId = pathParts[pathParts.length - 1];
      const request: UpdateGroupRequest = JSON.parse(event.body || '{}');
      const group = await templeService.updateTempleGroup(groupId, request, userId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: group,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: DELETE /api/admin/temple-groups/{groupId} - Delete temple group
    if (method === 'DELETE' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'temple-groups') {
      const groupId = pathParts[pathParts.length - 1];
      await templeService.deleteTempleGroup(groupId, userId);
      
      return {
        statusCode: 204,
        body: '',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: POST /api/admin/temple-groups/{groupId}/temples - Add temple to group
    if (method === 'POST' && pathParts.length >= 4 && pathParts[pathParts.length - 3] === 'temple-groups' && pathParts[pathParts.length - 1] === 'temples') {
      const groupId = pathParts[pathParts.length - 2];
      const { templeId } = JSON.parse(event.body || '{}');
      await templeService.addTempleToGroup(groupId, templeId, userId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Temple added to group successfully',
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: DELETE /api/admin/temple-groups/{groupId}/temples/{templeId} - Remove temple from group
    if (method === 'DELETE' && pathParts.length >= 5 && pathParts[pathParts.length - 4] === 'temple-groups' && pathParts[pathParts.length - 2] === 'temples') {
      const groupId = pathParts[pathParts.length - 3];
      const templeId = pathParts[pathParts.length - 1];
      await templeService.removeTempleFromGroup(groupId, templeId, userId);
      
      return {
        statusCode: 204,
        body: '',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: GET /api/admin/temples/{templeId}/groups - Get groups for temple
    if (method === 'GET' && pathParts.length >= 4 && pathParts[pathParts.length - 3] === 'temples' && pathParts[pathParts.length - 1] === 'groups') {
      const templeId = pathParts[pathParts.length - 2];
      const groups = await templeService.getGroupsForTemple(templeId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: groups,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // ========================================================================
    // Artifact Routes
    // ========================================================================
    
    // Route: POST /api/admin/artifacts - Create artifact
    if (method === 'POST' && pathParts[pathParts.length - 1] === 'artifacts') {
      const request = JSON.parse(event.body || '{}');
      const artifact = await templeService.createArtifact(request, userId);
      
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          data: artifact,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: GET /api/admin/artifacts/{artifactId} - Get artifact
    if (method === 'GET' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'artifacts') {
      const artifactId = pathParts[pathParts.length - 1];
      const artifact = await templeService.getArtifact(artifactId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: artifact,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: GET /api/admin/artifacts - List artifacts
    if (method === 'GET' && pathParts[pathParts.length - 1] === 'artifacts') {
      const templeId = event.queryStringParameters?.templeId;
      const status = event.queryStringParameters?.status as 'active' | 'inactive' | undefined;
      
      const result = await templeService.listArtifacts(templeId, status);
      
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
    
    // Route: PUT /api/admin/artifacts/{artifactId} - Update artifact
    if (method === 'PUT' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'artifacts') {
      const artifactId = pathParts[pathParts.length - 1];
      const request = JSON.parse(event.body || '{}');
      const artifact = await templeService.updateArtifact(artifactId, request, userId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: artifact,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: DELETE /api/admin/artifacts/{artifactId} - Delete artifact (soft delete)
    if (method === 'DELETE' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'artifacts') {
      const artifactId = pathParts[pathParts.length - 1];
      await templeService.deleteArtifact(artifactId, userId);
      
      return {
        statusCode: 204,
        body: '',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: GET /api/admin/artifacts/{artifactId}/qr-code - Get QR code
    if (method === 'GET' && pathParts.length >= 4 && pathParts[pathParts.length - 3] === 'artifacts' && pathParts[pathParts.length - 1] === 'qr-code') {
      const artifactId = pathParts[pathParts.length - 2];
      const qrCode = await templeService.generateQRCode(artifactId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: qrCode,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: GET /api/mobile/qr-code/{qrCodeId} - Get artifact by QR code (mobile)
    if (method === 'GET' && pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'qr-code') {
      const qrCodeId = pathParts[pathParts.length - 1];
      const artifact = await templeService.getArtifactByQRCode(qrCodeId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: artifact,
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // ========================================================================
    // QR Code Count Tracking Routes
    // ========================================================================
    
    // Route: GET /api/admin/qr-code-count/{entityType}/{entityId} - Get QR code count
    if (method === 'GET' && pathParts.length >= 4 && pathParts[pathParts.length - 3] === 'qr-code-count') {
      const entityType = pathParts[pathParts.length - 2].toUpperCase() as 'TEMPLE' | 'GROUP';
      const entityId = pathParts[pathParts.length - 1];
      const count = await templeService.getQRCodeCount(entityType, entityId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            entityType,
            entityId,
            count,
          },
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // Route: POST /api/admin/recalculate-qr-counts/{entityType}/{entityId} - Recalculate QR code counts
    if (method === 'POST' && pathParts.length >= 4 && pathParts[pathParts.length - 3] === 'recalculate-qr-counts') {
      const entityType = pathParts[pathParts.length - 2].toUpperCase() as 'TEMPLE' | 'GROUP';
      const entityId = pathParts[pathParts.length - 1];
      await templeService.recalculateQRCodeCounts(entityType, entityId, userId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'QR code counts recalculated successfully',
          requestId,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // No matching route
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
          requestId,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    logger.error('Temple Management error', error as Error, { requestId });
    return formatErrorResponse(error as Error, requestId);
  }
}
