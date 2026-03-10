// Trusted Sources Lambda Handler
// Handles CRUD operations for trusted sources management

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import {
  TrustedSource,
  CreateTrustedSourceRequest,
  UpdateTrustedSourceRequest,
  TrustedSourcesResponse,
  VerificationStatus
} from '../src/types/trustedSource';

const dynamodb = new DynamoDB.DocumentClient();
const TRUSTED_SOURCES_TABLE = process.env.TRUSTED_SOURCES_TABLE || 'TrustedSources';

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

/**
 * Main Lambda handler for trusted sources operations
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Trusted Sources Lambda invoked', {
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
    // Extract sourceId from path if present
    const sourceId = event.pathParameters?.sourceId;
    const action = event.pathParameters?.action; // For verify/unverify actions

    // Route to appropriate handler
    switch (event.httpMethod) {
      case 'GET':
        if (sourceId) {
          return await getSource(sourceId, context.requestId);
        }
        return await listSources(event, context.requestId);

      case 'POST':
        if (sourceId && action === 'verify') {
          return await verifySource(sourceId, event, context.requestId);
        }
        if (sourceId && action === 'unverify') {
          return await unverifySource(sourceId, context.requestId);
        }
        return await createSource(event, context.requestId);

      case 'PUT':
        if (!sourceId) {
          return errorResponse(400, 'Source ID is required for update', context.requestId);
        }
        return await updateSource(sourceId, event, context.requestId);

      case 'DELETE':
        if (!sourceId) {
          return errorResponse(400, 'Source ID is required for delete', context.requestId);
        }
        return await deleteSource(sourceId, context.requestId);

      default:
        return errorResponse(405, 'Method not allowed', context.requestId);
    }
  } catch (error) {
    console.error('Error in trusted sources handler:', error);
    return errorResponse(
      500,
      error instanceof Error ? error.message : 'Internal server error',
      context.requestId
    );
  }
};

/**
 * List all trusted sources with pagination and filtering
 */
async function listSources(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const queryParams = event.queryStringParameters || {};
  const page = parseInt(queryParams.page || '1');
  const pageSize = parseInt(queryParams.pageSize || '20');
  const sourceType = queryParams.sourceType;
  const verificationStatus = queryParams.verificationStatus;
  const isActive = queryParams.isActive;

  // Build scan parameters
  const scanParams: DynamoDB.DocumentClient.ScanInput = {
    TableName: TRUSTED_SOURCES_TABLE,
  };

  // Add filters if provided
  const filterExpressions: string[] = [];
  const expressionAttributeValues: any = {};

  if (sourceType) {
    filterExpressions.push('sourceType = :sourceType');
    expressionAttributeValues[':sourceType'] = sourceType;
  }

  if (verificationStatus) {
    filterExpressions.push('verificationStatus = :verificationStatus');
    expressionAttributeValues[':verificationStatus'] = verificationStatus;
  }

  if (isActive !== undefined) {
    filterExpressions.push('isActive = :isActive');
    expressionAttributeValues[':isActive'] = isActive === 'true';
  }

  if (filterExpressions.length > 0) {
    scanParams.FilterExpression = filterExpressions.join(' AND ');
    scanParams.ExpressionAttributeValues = expressionAttributeValues;
  }

  const result = await dynamodb.scan(scanParams).promise();
  const sources = (result.Items || []) as TrustedSource[];

  // Sort by trust score (descending) and then by name
  sources.sort((a, b) => {
    if (b.trustScore !== a.trustScore) {
      return b.trustScore - a.trustScore;
    }
    return a.sourceName.localeCompare(b.sourceName);
  });

  // Paginate results
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSources = sources.slice(startIndex, endIndex);

  const response: TrustedSourcesResponse = {
    sources: paginatedSources,
    total: sources.length,
    page,
    pageSize,
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
 * Get a single trusted source by ID
 */
async function getSource(
  sourceId: string,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const result = await dynamodb
    .get({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId },
    })
    .promise();

  if (!result.Item) {
    return errorResponse(404, `Source not found: ${sourceId}`, requestId);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result.Item as TrustedSource,
      requestId,
    }),
  };
}

/**
 * Create a new trusted source
 */
async function createSource(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse(400, 'Request body is required', requestId);
  }

  const request: CreateTrustedSourceRequest = JSON.parse(event.body);

  // Validate required fields
  if (!request.sourceName || !request.sourceUrl || !request.sourceType) {
    return errorResponse(
      400,
      'Missing required fields: sourceName, sourceUrl, sourceType',
      requestId
    );
  }

  // Validate URL format
  try {
    new URL(request.sourceUrl);
  } catch {
    return errorResponse(400, 'Invalid URL format', requestId);
  }

  // Get admin info from authorizer context
  const adminId = event.requestContext.authorizer?.claims?.sub || 'system';

  // Generate source ID
  const sourceId = `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newSource: TrustedSource = {
    sourceId,
    sourceName: request.sourceName,
    sourceUrl: request.sourceUrl,
    sourceType: request.sourceType,
    verificationStatus: 'pending',
    applicableStates: request.applicableStates || [],
    applicableTemples: request.applicableTemples || [],
    trustScore: request.trustScore || 5,
    isActive: true,
    addedBy: adminId,
    addedDate: new Date().toISOString(),
    metadata: request.metadata || {},
  };

  await dynamodb
    .put({
      TableName: TRUSTED_SOURCES_TABLE,
      Item: newSource,
    })
    .promise();

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      data: newSource,
      message: 'Trusted source created successfully',
      requestId,
    }),
  };
}

/**
 * Update an existing trusted source
 */
async function updateSource(
  sourceId: string,
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse(400, 'Request body is required', requestId);
  }

  const request: UpdateTrustedSourceRequest = JSON.parse(event.body);

  // Check if source exists
  const existingSource = await dynamodb
    .get({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId },
    })
    .promise();

  if (!existingSource.Item) {
    return errorResponse(404, `Source not found: ${sourceId}`, requestId);
  }

  // Validate URL if provided
  if (request.sourceUrl) {
    try {
      new URL(request.sourceUrl);
    } catch {
      return errorResponse(400, 'Invalid URL format', requestId);
    }
  }

  // Get admin info
  const adminId = event.requestContext.authorizer?.claims?.sub || 'system';

  // Build update expression
  const updateExpressions: string[] = [];
  const expressionAttributeNames: any = {};
  const expressionAttributeValues: any = {};

  if (request.sourceName !== undefined) {
    updateExpressions.push('#sourceName = :sourceName');
    expressionAttributeNames['#sourceName'] = 'sourceName';
    expressionAttributeValues[':sourceName'] = request.sourceName;
  }

  if (request.sourceUrl !== undefined) {
    updateExpressions.push('#sourceUrl = :sourceUrl');
    expressionAttributeNames['#sourceUrl'] = 'sourceUrl';
    expressionAttributeValues[':sourceUrl'] = request.sourceUrl;
  }

  if (request.sourceType !== undefined) {
    updateExpressions.push('#sourceType = :sourceType');
    expressionAttributeNames['#sourceType'] = 'sourceType';
    expressionAttributeValues[':sourceType'] = request.sourceType;
  }

  if (request.applicableStates !== undefined) {
    updateExpressions.push('#applicableStates = :applicableStates');
    expressionAttributeNames['#applicableStates'] = 'applicableStates';
    expressionAttributeValues[':applicableStates'] = request.applicableStates;
  }

  if (request.applicableTemples !== undefined) {
    updateExpressions.push('#applicableTemples = :applicableTemples');
    expressionAttributeNames['#applicableTemples'] = 'applicableTemples';
    expressionAttributeValues[':applicableTemples'] = request.applicableTemples;
  }

  if (request.trustScore !== undefined) {
    updateExpressions.push('#trustScore = :trustScore');
    expressionAttributeNames['#trustScore'] = 'trustScore';
    expressionAttributeValues[':trustScore'] = request.trustScore;
  }

  if (request.isActive !== undefined) {
    updateExpressions.push('#isActive = :isActive');
    expressionAttributeNames['#isActive'] = 'isActive';
    expressionAttributeValues[':isActive'] = request.isActive;
  }

  if (request.metadata !== undefined) {
    updateExpressions.push('#metadata = :metadata');
    expressionAttributeNames['#metadata'] = 'metadata';
    expressionAttributeValues[':metadata'] = request.metadata;
  }

  // Always update updatedBy and updatedDate
  updateExpressions.push('#updatedBy = :updatedBy', '#updatedDate = :updatedDate');
  expressionAttributeNames['#updatedBy'] = 'updatedBy';
  expressionAttributeNames['#updatedDate'] = 'updatedDate';
  expressionAttributeValues[':updatedBy'] = adminId;
  expressionAttributeValues[':updatedDate'] = new Date().toISOString();

  const result = await dynamodb
    .update({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result.Attributes as TrustedSource,
      message: 'Trusted source updated successfully',
      requestId,
    }),
  };
}

/**
 * Delete a trusted source
 */
async function deleteSource(
  sourceId: string,
  requestId: string
): Promise<APIGatewayProxyResult> {
  // Check if source exists
  const existingSource = await dynamodb
    .get({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId },
    })
    .promise();

  if (!existingSource.Item) {
    return errorResponse(404, `Source not found: ${sourceId}`, requestId);
  }

  await dynamodb
    .delete({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId },
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Trusted source deleted successfully',
      requestId,
    }),
  };
}

/**
 * Verify a trusted source
 */
async function verifySource(
  sourceId: string,
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  // Check if source exists
  const existingSource = await dynamodb
    .get({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId },
    })
    .promise();

  if (!existingSource.Item) {
    return errorResponse(404, `Source not found: ${sourceId}`, requestId);
  }

  // Get admin info
  const adminId = event.requestContext.authorizer?.claims?.sub || 'system';

  const result = await dynamodb
    .update({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId },
      UpdateExpression:
        'SET #verificationStatus = :verified, #verifiedBy = :adminId, #verifiedDate = :date',
      ExpressionAttributeNames: {
        '#verificationStatus': 'verificationStatus',
        '#verifiedBy': 'verifiedBy',
        '#verifiedDate': 'verifiedDate',
      },
      ExpressionAttributeValues: {
        ':verified': 'verified' as VerificationStatus,
        ':adminId': adminId,
        ':date': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result.Attributes as TrustedSource,
      message: 'Source verified successfully',
      requestId,
    }),
  };
}

/**
 * Unverify a trusted source
 */
async function unverifySource(
  sourceId: string,
  requestId: string
): Promise<APIGatewayProxyResult> {
  // Check if source exists
  const existingSource = await dynamodb
    .get({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId },
    })
    .promise();

  if (!existingSource.Item) {
    return errorResponse(404, `Source not found: ${sourceId}`, requestId);
  }

  const result = await dynamodb
    .update({
      TableName: TRUSTED_SOURCES_TABLE,
      Key: { sourceId },
      UpdateExpression: 'SET #verificationStatus = :unverified',
      ExpressionAttributeNames: {
        '#verificationStatus': 'verificationStatus',
      },
      ExpressionAttributeValues: {
        ':unverified': 'unverified' as VerificationStatus,
      },
      ReturnValues: 'ALL_NEW',
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result.Attributes as TrustedSource,
      message: 'Source unverified',
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
