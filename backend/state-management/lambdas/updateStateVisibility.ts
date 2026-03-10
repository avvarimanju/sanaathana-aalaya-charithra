/**
 * Update State Visibility Settings Lambda
 * 
 * Admin endpoint to update which states are visible in the mobile app.
 * Requires authentication and admin privileges.
 * 
 * @endpoint PUT /api/states/visibility
 * @body { settings: Record<string, boolean> }
 * @returns Updated settings with metadata
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.STATE_VISIBILITY_TABLE_NAME || 'StateVisibilitySettings';
const SETTINGS_PK = 'SETTINGS';
const SETTINGS_SK = 'CURRENT';

interface StateVisibilitySettings {
  PK: string;
  SK: string;
  settings: Record<string, boolean>;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

interface UpdateRequest {
  settings: Record<string, boolean>;
}

/**
 * Validate state codes
 */
const VALID_STATE_CODES = [
  'AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 'JH',
  'JK', 'KA', 'KL', 'LA', 'LD', 'MP', 'MH', 'MN', 'ML', 'MZ',
  'NL', 'OR', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UP',
  'UK', 'WB', 'AN', 'CH', 'DH', 'DD', 'DL'
];

/**
 * Validate request body
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  if (!body.settings || typeof body.settings !== 'object') {
    return { valid: false, error: 'settings field is required and must be an object' };
  }

  // Validate all state codes
  for (const stateCode of Object.keys(body.settings)) {
    if (!VALID_STATE_CODES.includes(stateCode)) {
      return { valid: false, error: `Invalid state code: ${stateCode}` };
    }

    if (typeof body.settings[stateCode] !== 'boolean') {
      return { valid: false, error: `Value for ${stateCode} must be boolean` };
    }
  }

  return { valid: true };
}

/**
 * Extract user info from event (from Cognito authorizer)
 */
function getUserInfo(event: APIGatewayProxyEvent): string {
  // In production, this comes from Cognito authorizer
  const claims = event.requestContext.authorizer?.claims;
  return claims?.email || claims?.sub || 'admin@system';
}

/**
 * Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Update State Visibility - Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body: UpdateRequest = JSON.parse(event.body || '{}');

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid request',
          message: validation.error,
        }),
      };
    }

    // Get current version for optimistic locking
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: SETTINGS_PK,
        SK: SETTINGS_SK,
      },
    });

    const currentResponse = await docClient.send(getCommand);
    const currentVersion = currentResponse.Item?.version || 0;

    // Get user info
    const updatedBy = getUserInfo(event);
    const updatedAt = new Date().toISOString();

    // Create new settings object
    const newSettings: StateVisibilitySettings = {
      PK: SETTINGS_PK,
      SK: SETTINGS_SK,
      settings: body.settings,
      updatedAt,
      updatedBy,
      version: currentVersion + 1,
    };

    // Save to DynamoDB
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: newSettings,
    });

    await docClient.send(putCommand);

    console.log(`State visibility updated by ${updatedBy}, version ${newSettings.version}`);

    // Calculate statistics
    const totalStates = Object.keys(body.settings).length;
    const visibleStates = Object.values(body.settings).filter(v => v).length;
    const hiddenStates = totalStates - visibleStates;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        settings: newSettings.settings,
        updatedAt: newSettings.updatedAt,
        updatedBy: newSettings.updatedBy,
        version: newSettings.version,
        statistics: {
          total: totalStates,
          visible: visibleStates,
          hidden: hiddenStates,
        },
      }),
    };
  } catch (error) {
    console.error('Error updating state visibility:', error);

    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid JSON in request body',
          message: error.message,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to update state visibility settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
