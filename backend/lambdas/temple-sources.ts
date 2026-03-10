// Temple Sources Lambda Handler
// Handles mapping between temples and trusted sources

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import {
  TempleSourceMapping,
  AddTempleSourceRequest,
  TempleSourcesResponse,
  TrustedSource,
} from '../src/types/trustedSource';

const dynamodb = new DynamoDB.DocumentClient();
const TEMPLE_SOURCE_MAPPING_TABLE = process.env.TEMPLE_SOURCE_MAPPING_TABLE || 'TempleSourceMapping';
const TRUSTED_SOURCES_TABLE = process.env.TRUSTED_SOURCES_TABLE || 'TrustedSources';

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
};

/**
 * Main Lambda handler for temple-source mapping operations
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Temple Sources Lambda invoked', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  try {
    const templeId = event.pathParameters?.templeId;
    const sourceId = event.pathParameters?.sourceId;

    if (!templeId) {
      return errorResponse(400, 'Temple ID is required', context.requestId);
    }

    // Route to appropriate handler
    switch (event.httpMethod) {
      case 'GET':
        return await getTempleSources(templeId, context.requestId);

      case 'POST':
        return await addSourceToTemple(templeId, event, context.requestId);

      case 'DELETE':
        if (!sourceId) {
          return errorResponse(400, 'Source ID is required for delete', context.requestId);
        }
        return await removeSourceFromTemple(templeId, sourceId, context.requestId);

      default:
        return errorResponse(405, 'Method not allowed', context.requestId);
    }
  } catch (error) {
    console.error('Error in temple sources handler:', error);
    return errorResponse(
      500,
      error instanceof Error ? error.message : 'Internal server error',
      context.requestId
    );
  }
};

/**
 * Get all sources mapped to a temple
 */
async function getTempleSources(
  templeId: string,
  requestId: string
): Promise<APIGatewayProxyResult> {
  // Query mappings for this temple
  const mappingsResult = await dynamodb
    .query({
      TableName: TEMPLE_SOURCE_MAPPING_TABLE,
      IndexName: 'TempleIdIndex',
      KeyConditionExpression: 'templeId = :templeId',
      ExpressionAttributeValues: {
        ':templeId': templeId,
      },
    })
    .promise();

  const mappings = (mappingsResult.Items || []) as TempleSourceMapping[];

  // Fetch source details for each mapping
  const templeSources = await Promise.all(
    mappings.map(async (mapping) => {
      const sourceResult = await dynamodb
        .get({
          TableName: TRUSTED_SOURCES_TABLE,
          Key: { sourceId: mapping.sourceId },
        })
        .promise();

      return {
        ...(sourceResult.Item as TrustedSource),
        mapping,
      };
    })
  );

  // Sort by priority (ascending)
  templeSources.sort((a, b) => a.mapping.priority - b.mapping.priority);

  const response: TempleSourcesResponse = {
    templeSources,
    total: templeSources.length,
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: response,
      requestId,
    }),
  };
}

/**
 * Add a source to a temple
 */
async function addSourceToTemple(
  templeId: string,
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse(400, 'Request body is required', requestId);
  }

  const request: AddTempleSourceRequest = JSON.parse(event.body);

  // Validate required fields
  if (!request.sourceId) {
    return errorResponse(400, 'Missing required field: sourceId', requestId);
  }

  // Check if source exists
  const sourceResult = await dynamodb
    .get({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId: request.sourceId },
    })
    .promise();

  if (!sourceResult.Item) {
    return errorResponse(404, `Source not found: ${request.sourceId}`, requestId);
  }

  // Check if mapping already exists
  const existingMappingResult = await dynamodb
    .query({
      TableName: TEMPLE_SOURCE_MAPPING_TABLE,
      IndexName: 'TempleIdIndex',
      KeyConditionExpression: 'templeId = :templeId',
      FilterExpression: 'sourceId = :sourceId',
      ExpressionAttributeValues: {
        ':templeId': templeId,
        ':sourceId': request.sourceId,
      },
    })
    .promise();

  if (existingMappingResult.Items && existingMappingResult.Items.length > 0) {
    return errorResponse(409, 'Source already mapped to this temple', requestId);
  }

  // Get admin info
  const adminId = event.requestContext.authorizer?.claims?.sub || 'system';

  // If this is marked as primary, unset other primary sources
  if (request.isPrimary) {
    const allMappingsResult = await dynamodb
      .query({
        TableName: TEMPLE_SOURCE_MAPPING_TABLE,
        IndexName: 'TempleIdIndex',
        KeyConditionExpression: 'templeId = :templeId',
        FilterExpression: 'isPrimary = :true',
        ExpressionAttributeValues: {
          ':templeId': templeId,
          ':true': true,
        },
      })
      .promise();

    // Unset primary flag for existing primary sources
    for (const mapping of allMappingsResult.Items || []) {
      await dynamodb
        .update({
          TableName: TEMPLE_SOURCE_MAPPING_TABLE,
          Key: { mappingId: (mapping as TempleSourceMapping).mappingId },
          UpdateExpression: 'SET isPrimary = :false',
          ExpressionAttributeValues: {
            ':false': false,
          },
        })
        .promise();
    }
  }

  // Determine priority
  let priority = request.priority || 999;
  if (request.isPrimary) {
    priority = 1;
  }

  // Generate mapping ID
  const mappingId = `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newMapping: TempleSourceMapping = {
    mappingId,
    templeId,
    sourceId: request.sourceId,
    isPrimary: request.isPrimary || false,
    priority,
    usedForContentGeneration: request.usedForContentGeneration !== false,
    addedBy: adminId,
    addedDate: new Date().toISOString(),
  };

  await dynamodb
    .put({
      TableName: TEMPLE_SOURCE_MAPPING_TABLE,
      Item: newMapping,
    })
    .promise();

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      data: newMapping,
      message: 'Source added to temple successfully',
      requestId,
    }),
  };
}

/**
 * Remove a source from a temple
 */
async function removeSourceFromTemple(
  templeId: string,
  sourceId: string,
  requestId: string
): Promise<APIGatewayProxyResult> {
  // Find the mapping
  const mappingsResult = await dynamodb
    .query({
      TableName: TEMPLE_SOURCE_MAPPING_TABLE,
      IndexName: 'TempleIdIndex',
      KeyConditionExpression: 'templeId = :templeId',
      FilterExpression: 'sourceId = :sourceId',
      ExpressionAttributeValues: {
        ':templeId': templeId,
        ':sourceId': sourceId,
      },
    })
    .promise();

  if (!mappingsResult.Items || mappingsResult.Items.length === 0) {
    return errorResponse(404, 'Mapping not found', requestId);
  }

  const mapping = mappingsResult.Items[0] as TempleSourceMapping;

  await dynamodb
    .delete({
      TableName: TEMPLE_SOURCE_MAPPING_TABLE,
      Key: { mappingId: mapping.mappingId },
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Source removed from temple successfully',
      requestId,
    }),
  };
}

/**
 * Helper function to create error responses
 */
function errorResponse(
  statusCode: number,
  message: string,
  requestId: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers,
    body: JSON.stringify({
      success: false,
      error: message,
      requestId,
    }),
  };
}
