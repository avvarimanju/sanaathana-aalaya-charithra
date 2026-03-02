/**
 * Pricing Service Lambda Handler
 * 
 * Handles price configuration management and retrieval
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { formatErrorResponse } from '../../utils/errors';
import logger from '../../utils/logger';
import redisCache from '../../utils/redis';
import {
  setPriceConfiguration,
  getPriceConfiguration,
  getBatchPriceConfigurations,
  deletePriceConfiguration,
  listPricesSortedByAmount,
  getPriceHistory,
} from './pricingService';
import { PriceConfigRequest, EntityType } from '../../types';
import config from '../../config';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logger.info('Pricing Service request received', {
    requestId,
    method: event.httpMethod,
    path: event.path,
  });

  try {
    // Connect to Redis cache
    await redisCache.connect();

    const method = event.httpMethod;
    const path = event.path;

    // Extract admin user ID from authorizer context
    const adminUserId = event.requestContext.authorizer?.claims?.sub || 'system';

    // Route to appropriate handler
    if (method === 'POST' && path.match(/\/api\/pricing\/entity\/[^/]+$/)) {
      return await handleSetPriceConfiguration(event, adminUserId, requestId);
    } else if (method === 'GET' && path.match(/\/api\/pricing\/entity\/[^/]+$/)) {
      return await handleGetPriceConfiguration(event, requestId);
    } else if (method === 'GET' && path.match(/\/api\/pricing\/history\/[^/]+$/)) {
      return await handleGetPriceHistory(event, requestId);
    } else if (method === 'GET' && path === '/api/pricing/entities') {
      return await handleGetBatchPriceConfigurations(event, requestId);
    } else if (method === 'DELETE' && path.match(/\/api\/pricing\/entity\/[^/]+$/)) {
      return await handleDeletePriceConfiguration(event, requestId);
    } else if (method === 'GET' && path === '/api/admin/pricing/list') {
      return await handleListPricesSortedByAmount(requestId);
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
            requestId,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
  } catch (error) {
    logger.error('Pricing Service error', error as Error, { requestId });
    return formatErrorResponse(error as Error, requestId);
  }
}

/**
 * Handle POST /api/pricing/entity/{entityId}
 */
async function handleSetPriceConfiguration(
  event: APIGatewayProxyEvent,
  adminUserId: string,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const pathParts = event.path.split('/');
  const entityId = pathParts[pathParts.length - 1];

  const request: PriceConfigRequest = {
    entityId,
    entityType: body.entityType as EntityType,
    priceAmount: body.priceAmount,
    overrideReason: body.overrideReason,
  };

  const priceConfig = await setPriceConfiguration(request, adminUserId);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: priceConfig,
      requestId,
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `max-age=${config.api.cacheMaxAge}`,
    },
  };
}

/**
 * Handle GET /api/pricing/entity/{entityId}
 */
async function handleGetPriceConfiguration(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const entityId = pathParts[pathParts.length - 1];
  const entityType = event.queryStringParameters?.entityType as EntityType;

  if (!entityType) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'entityType query parameter is required',
          requestId,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  const priceConfig = await getPriceConfiguration(entityType, entityId);

  if (!priceConfig) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: {
          code: 'NOT_FOUND',
          message: `Price configuration not found for ${entityType} ${entityId}`,
          requestId,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: priceConfig,
      requestId,
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `max-age=${config.api.cacheMaxAge}`,
    },
  };
}

/**
 * Handle GET /api/pricing/entities (batch retrieval)
 */
async function handleGetBatchPriceConfigurations(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const entities = body.entities as Array<{ entityType: EntityType; entityId: string }>;

  if (!entities || !Array.isArray(entities)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'entities array is required in request body',
          requestId,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  const priceConfigs = await getBatchPriceConfigurations(entities);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: priceConfigs,
      requestId,
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `max-age=${config.api.cacheMaxAge}`,
    },
  };
}

/**
 * Handle DELETE /api/pricing/entity/{entityId}
 */
async function handleDeletePriceConfiguration(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const entityId = pathParts[pathParts.length - 1];
  const entityType = event.queryStringParameters?.entityType as EntityType;

  if (!entityType) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'entityType query parameter is required',
          requestId,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  await deletePriceConfiguration(entityType, entityId);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Price configuration deleted successfully',
      requestId,
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };
}

/**
 * Handle GET /api/admin/pricing/list
 */
async function handleListPricesSortedByAmount(
  requestId: string
): Promise<APIGatewayProxyResult> {
  const priceConfigs = await listPricesSortedByAmount();

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: priceConfigs,
      requestId,
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `max-age=${config.api.cacheMaxAge}`,
    },
  };
}

/**
 * Handle GET /api/pricing/history/{entityId}
 */
async function handleGetPriceHistory(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const entityId = pathParts[pathParts.length - 1];
  const entityType = event.queryStringParameters?.entityType as EntityType;

  if (!entityType) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'entityType query parameter is required',
          requestId,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  // Parse optional filters
  const filters = {
    startDate: event.queryStringParameters?.startDate,
    endDate: event.queryStringParameters?.endDate,
    limit: event.queryStringParameters?.limit 
      ? parseInt(event.queryStringParameters.limit, 10) 
      : undefined,
  };

  const history = await getPriceHistory(entityType, entityId, filters);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: history,
      requestId,
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `max-age=${config.api.cacheMaxAge}`,
    },
  };
}
