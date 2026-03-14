/**
 * Authorization Middleware for Admin API
 * 
 * This module provides JWT token validation, session management,
 * rate limiting, and permission checking for admin API endpoints.
 */

import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { RateLimiter } from './rate-limiter';
import { SessionManager } from './session-manager';

// Environment variables
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const ADMIN_USERS_TABLE = process.env.ADMIN_USERS_TABLE || 'SanaathanaAalayaCharithra-AdminUsers';
const RATE_LIMITS_TABLE = process.env.RATE_LIMITS_TABLE || 'SanaathanaAalayaCharithra-RateLimits';
const ADMIN_SESSIONS_TABLE = process.env.ADMIN_SESSIONS_TABLE || 'SanaathanaAalayaCharithra-AdminSessions';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// AWS clients
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// JWKS client for Cognito
const jwksUri = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;
const client = jwksClient({
  jwksUri,
  requestHeaders: {},
  timeout: 30000,
});

// Initialize utilities
const rateLimiter = new RateLimiter(RATE_LIMITS_TABLE);
const sessionManager = new SessionManager(ADMIN_SESSIONS_TABLE);

export interface AdminUser {
  userId: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
}

export interface DecodedToken {
  sub: string;
  jti?: string;
  exp: number;
  email?: string;
}

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  permissions: string;
}

/**
 * Lambda handler for custom authorizer
 */
export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    // Extract token from Authorization header
    const token = event.authorizationToken?.replace('Bearer ', '') || '';
    
    if (!token) {
      throw new Error('Unauthorized: No token provided');
    }

    // Verify JWT token
    const decodedToken = await verifyToken(token);
    
    // Get user ID from token
    const userId = decodedToken.sub;
    const tokenJti = decodedToken.jti;
    
    if (!userId) {
      throw new Error('Unauthorized: Invalid token');
    }

    // Check rate limit
    const withinLimit = await rateLimiter.checkRateLimit(userId);
    if (!withinLimit) {
      throw new Error('Unauthorized: Rate limit exceeded');
    }

    // Get user from DynamoDB
    const user = await getAdminUser(userId);
    
    if (!user || user.status !== 'ACTIVE') {
      throw new Error('Unauthorized: User not active');
    }

    // Validate session
    if (tokenJti) {
      const sessionValid = await sessionManager.validateSession(userId, tokenJti);
      if (!sessionValid) {
        // Create new session for first-time token
        try {
          await sessionManager.createSession(userId, tokenJti);
        } catch (error) {
          console.warn(`Could not create session: ${error}`);
        }
      }
    }

    // Generate IAM policy
    const policy = generatePolicy(
      userId,
      'Allow',
      event.methodArn,
      {
        userId,
        email: user.email,
        role: user.role,
        permissions: user.permissions.join(','),
      }
    );

    return policy;

  } catch (error) {
    console.error(`Authorization error: ${error}`);
    // Return Deny policy
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};

/**
 * Verify JWT token from Cognito
 */
export const verifyToken = async (token: string): Promise<DecodedToken> => {
  try {
    // Get signing key from JWKS
    const getKey = (header: any, callback: any) => {
      client.getSigningKey(header.kid, (err, key) => {
        if (err) {
          callback(err);
          return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
      });
    };

    return new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        algorithms: ['RS256'],
      }, (err, decoded) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            reject(new Error('Unauthorized: Token expired'));
          } else {
            reject(new Error(`Unauthorized: Invalid token - ${err.message}`));
          }
        } else {
          resolve(decoded as DecodedToken);
        }
      });
    });

  } catch (error) {
    throw new Error(`Token verification failed: ${error}`);
  }
};

/**
 * Get admin user from DynamoDB
 */
export const getAdminUser = async (userId: string): Promise<AdminUser | null> => {
  try {
    const command = new GetCommand({
      TableName: ADMIN_USERS_TABLE,
      Key: { userId },
    });

    const response = await docClient.send(command);
    return response.Item as AdminUser || null;

  } catch (error) {
    console.error(`Error getting user: ${error}`);
    return null;
  }
};

/**
 * Generate IAM policy document
 */
export const generatePolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: AuthContext
): APIGatewayAuthorizerResult => {
  const policy: APIGatewayAuthorizerResult = {
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

  if (context) {
    policy.context = context;
  }

  return policy;
};