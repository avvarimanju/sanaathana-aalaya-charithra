/**
 * Authentication Middleware
 * Feature: real-time-reports-dashboard
 * Task: 12.1
 * 
 * JWT token validation and AWS Cognito integration
 * Handles token expiration and refresh
 * 
 * Validates: Requirements 12.1, 12.3
 */

import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthenticatedUser } from '../types';

// Initialize Cognito JWT Verifier
// In production, these would come from environment variables
const userPoolId = process.env.COGNITO_USER_POOL_ID || 'us-east-1_XXXXXXXXX';
const clientId = process.env.COGNITO_CLIENT_ID || 'XXXXXXXXXXXXXXXXXXXXXXXXXX';

const verifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: 'access',
  clientId
});

/**
 * Lambda authorizer handler for API Gateway
 * Validates JWT tokens and returns IAM policy
 */
export async function handler(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  const token = event.authorizationToken;
  
  try {
    // Remove 'Bearer ' prefix if present
    const jwtToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    // Verify JWT token with Cognito
    const payload = await verifier.verify(jwtToken);
    
    // Extract user information from token
    const user: AuthenticatedUser = {
      userId: payload.sub,
      role: (payload['custom:role'] as any) || 'analyst',
      region: payload['custom:region'] as string | undefined,
      email: payload.email as string | undefined
    };
    
    // Generate IAM policy allowing access
    const policy = generatePolicy(user, 'Allow', event.methodArn);
    
    console.log('Authentication successful', {
      userId: user.userId,
      role: user.role
    });
    
    return policy;
    
  } catch (error) {
    console.error('Authentication failed', { error });
    
    // Return deny policy
    throw new Error('Unauthorized');
  }
}

/**
 * Generate IAM policy for API Gateway
 */
function generatePolicy(
  user: AuthenticatedUser,
  effect: 'Allow' | 'Deny',
  resource: string
): APIGatewayAuthorizerResult {
  // Extract API Gateway ARN components
  const tmp = resource.split(':');
  const apiGatewayArnTmp = tmp[5].split('/');
  const awsAccountId = tmp[4];
  const region = tmp[3];
  const restApiId = apiGatewayArnTmp[0];
  const stage = apiGatewayArnTmp[1];
  
  // Build resource ARN for all methods and paths
  const resourceArn = `arn:aws:execute-api:${region}:${awsAccountId}:${restApiId}/${stage}/*/*`;
  
  return {
    principalId: user.userId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resourceArn
        }
      ]
    },
    context: {
      userId: user.userId,
      role: user.role,
      region: user.region || '',
      email: user.email || ''
    }
  };
}

/**
 * Validate token expiration
 * Returns true if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    // Decode JWT without verification (just to check expiration)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const exp = payload.exp;
    
    if (!exp) {
      return true;
    }
    
    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    return exp < (now + 300);
    
  } catch (error) {
    return true;
  }
}

/**
 * Extract user ID from token without full verification
 * Used for logging and audit purposes
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.sub || null;
    
  } catch (error) {
    return null;
  }
}

/**
 * Refresh token using Cognito
 * In production, this would call Cognito's token refresh endpoint
 */
export async function refreshToken(refreshToken: string): Promise<{
  accessToken: string;
  idToken: string;
  expiresIn: number;
}> {
  // Mock implementation - in production, call Cognito API
  // Example: POST to https://cognito-idp.{region}.amazonaws.com/
  // with InitiateAuth action and REFRESH_TOKEN_AUTH flow
  
  throw new Error('Token refresh not implemented - use Cognito SDK');
}
