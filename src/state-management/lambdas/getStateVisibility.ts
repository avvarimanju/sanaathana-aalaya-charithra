/**
 * Get State Visibility Settings Lambda
 * 
 * Returns the current state visibility configuration for the mobile app.
 * This is a public endpoint that mobile apps use to determine which states to display.
 * 
 * @endpoint GET /api/public/states/visible
 * @returns Array of visible state codes
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
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

/**
 * Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get State Visibility - Event:', JSON.stringify(event, null, 2));

  try {
    // Get current settings from DynamoDB
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: SETTINGS_PK,
        SK: SETTINGS_SK,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      // No settings found - return all states as visible (default behavior)
      console.log('No settings found, returning default (all visible)');
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
        body: JSON.stringify({
          visibleStates: [], // Empty array means all states visible
          allVisible: true,
          updatedAt: new Date().toISOString(),
        }),
      };
    }

    const settings = response.Item as StateVisibilitySettings;

    // Extract visible state codes
    const visibleStates = Object.entries(settings.settings)
      .filter(([_, isVisible]) => isVisible)
      .map(([stateCode, _]) => stateCode);

    console.log(`Returning ${visibleStates.length} visible states`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
      body: JSON.stringify({
        visibleStates,
        allVisible: false,
        updatedAt: settings.updatedAt,
        version: settings.version,
      }),
    };
  } catch (error) {
    console.error('Error getting state visibility:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to get state visibility settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
