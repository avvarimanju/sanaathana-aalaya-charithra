/**
 * JWT Authorizer Lambda Handler
 * 
 * Validates JWT tokens for API Gateway
 */

import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import logger from '../../utils/logger';

export async function handler(event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> {
  logger.info('Authorizer invoked', {
    methodArn: event.methodArn,
  });

  try {
    // TODO: Implement JWT validation logic in subsequent tasks
    // This is a placeholder for Task 1 infrastructure setup
    
    // For now, allow all requests (development only)
    return generatePolicy('user', 'Allow', event.methodArn);
  } catch (error) {
    logger.error('Authorization error', error as Error);
    throw new Error('Unauthorized');
  }
}

function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}
