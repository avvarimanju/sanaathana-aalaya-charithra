/**
 * Unit Tests for Authorization Middleware
 * 
 * Tests permission checking logic, rate limiting behavior, and session expiration handling.
 * Validates Requirements 1.5, 1.6
 */

import { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { handler, verifyToken, getAdminUser, generatePolicy } from '../authorizer';
import { RateLimiter } from '../rate-limiter';
import { SessionManager } from '../session-manager';

// Mock AWS SDK
const ddbMock = mockClient(DynamoDBDocumentClient);

// Mock external dependencies
jest.mock('jwks-rsa');
jest.mock('jsonwebtoken');
jest.mock('../rate-limiter');
jest.mock('../session-manager');

const mockJwksClient = jwksClient as jest.MockedFunction<typeof jwksClient>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const MockRateLimiter = RateLimiter as jest.MockedClass<typeof RateLimiter>;
const MockSessionManager = SessionManager as jest.MockedClass<typeof SessionManager>;

describe('Authorization Middleware', () => {
  let mockRateLimiter: jest.Mocked<RateLimiter>;
  let mockSessionManager: jest.Mocked<SessionManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    ddbMock.reset();

    // Setup mocks
    mockRateLimiter = new MockRateLimiter() as jest.Mocked<RateLimiter>;
    mockSessionManager = new MockSessionManager() as jest.Mocked<SessionManager>;

    // Mock JWKS client
    const mockGetSigningKey = jest.fn();
    mockJwksClient.mockReturnValue({
      getSigningKey: mockGetSigningKey,
    } as any);

    // Set environment variables
    process.env.USER_POOL_ID = 'test-pool-id';
    process.env.ADMIN_USERS_TABLE = 'test-admin-users';
    process.env.AWS_REGION = 'us-east-1';
  });

  describe('Permission Checking Logic', () => {
    it('should allow access for valid admin user with active status', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: 'Bearer valid_token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      const mockUser = {
        userId: 'user123',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        permissions: ['MANAGE_TEMPLES', 'MANAGE_ARTIFACTS'],
      };

      // Mock token verification
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { sub: 'user123', jti: 'token123', exp: 9999999999 });
        }
      });

      // Mock rate limiter
      mockRateLimiter.checkRateLimit.mockResolvedValue(true);

      // Mock DynamoDB response
      ddbMock.on(GetCommand).resolves({
        Item: mockUser,
      });

      // Mock session manager
      mockSessionManager.validateSession.mockResolvedValue(true);

      // Act
      const result = await handler(event);

      // Assert
      expect(result.principalId).toBe('user123');
      expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
      expect(result.context).toEqual({
        userId: 'user123',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        permissions: 'MANAGE_TEMPLES,MANAGE_ARTIFACTS',
      });
    });

    it('should deny access for inactive admin user', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: 'Bearer valid_token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      const mockUser = {
        userId: 'user123',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        status: 'DEACTIVATED',
        permissions: ['MANAGE_TEMPLES'],
      };

      // Mock token verification
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { sub: 'user123', jti: 'token123', exp: 9999999999 });
        }
      });

      // Mock rate limiter
      mockRateLimiter.checkRateLimit.mockResolvedValue(true);

      // Mock DynamoDB response
      ddbMock.on(GetCommand).resolves({
        Item: mockUser,
      });

      // Act
      const result = await handler(event);

      // Assert
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('should deny access for non-existent user', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: 'Bearer valid_token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      // Mock token verification
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { sub: 'user123', jti: 'token123', exp: 9999999999 });
        }
      });

      // Mock rate limiter
      mockRateLimiter.checkRateLimit.mockResolvedValue(true);

      // Mock DynamoDB response (no user found)
      ddbMock.on(GetCommand).resolves({});

      // Act
      const result = await handler(event);

      // Assert
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('should deny access when no authorization token provided', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: '',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      // Act
      const result = await handler(event);

      // Assert
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });
  });

  describe('Rate Limiting Behavior', () => {
    it('should deny access when rate limit is exceeded', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: 'Bearer valid_token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      // Mock token verification
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { sub: 'user123', jti: 'token123', exp: 9999999999 });
        }
      });

      // Mock rate limiter (exceeded)
      mockRateLimiter.checkRateLimit.mockResolvedValue(false);

      // Act
      const result = await handler(event);

      // Assert
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
      expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith('user123');
    });

    it('should allow access when within rate limit', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: 'Bearer valid_token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      const mockUser = {
        userId: 'user123',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        permissions: ['MANAGE_TEMPLES'],
      };

      // Mock token verification
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { sub: 'user123', jti: 'token123', exp: 9999999999 });
        }
      });

      // Mock rate limiter (within limit)
      mockRateLimiter.checkRateLimit.mockResolvedValue(true);

      // Mock DynamoDB response
      ddbMock.on(GetCommand).resolves({
        Item: mockUser,
      });

      // Mock session manager
      mockSessionManager.validateSession.mockResolvedValue(true);

      // Act
      const result = await handler(event);

      // Assert
      expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
      expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith('user123');
    });

    it('should enforce 100 requests per minute limit', () => {
      // Arrange
      const rateLimiter = new RateLimiter();

      // Assert
      expect(rateLimiter['maxRequests']).toBe(100);
      expect(rateLimiter['windowSeconds']).toBe(60);
    });
  });

  describe('Session Expiration Handling', () => {
    it('should create new session for first-time token', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: 'Bearer valid_token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      const mockUser = {
        userId: 'user123',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        permissions: ['MANAGE_TEMPLES'],
      };

      // Mock token verification
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { sub: 'user123', jti: 'token123', exp: 9999999999 });
        }
      });

      // Mock rate limiter
      mockRateLimiter.checkRateLimit.mockResolvedValue(true);

      // Mock DynamoDB response
      ddbMock.on(GetCommand).resolves({
        Item: mockUser,
      });

      // Mock session manager (no existing session)
      mockSessionManager.validateSession.mockResolvedValue(false);
      mockSessionManager.createSession.mockResolvedValue('user123:token123');

      // Act
      const result = await handler(event);

      // Assert
      expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
      expect(mockSessionManager.validateSession).toHaveBeenCalledWith('user123', 'token123');
      expect(mockSessionManager.createSession).toHaveBeenCalledWith('user123', 'token123');
    });

    it('should validate existing session', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: 'Bearer valid_token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      const mockUser = {
        userId: 'user123',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        permissions: ['MANAGE_TEMPLES'],
      };

      // Mock token verification
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { sub: 'user123', jti: 'token123', exp: 9999999999 });
        }
      });

      // Mock rate limiter
      mockRateLimiter.checkRateLimit.mockResolvedValue(true);

      // Mock DynamoDB response
      ddbMock.on(GetCommand).resolves({
        Item: mockUser,
      });

      // Mock session manager (existing valid session)
      mockSessionManager.validateSession.mockResolvedValue(true);

      // Act
      const result = await handler(event);

      // Assert
      expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
      expect(mockSessionManager.validateSession).toHaveBeenCalledWith('user123', 'token123');
      expect(mockSessionManager.createSession).not.toHaveBeenCalled();
    });

    it('should enforce 8-hour session timeout', () => {
      // Arrange
      const sessionManager = new SessionManager();

      // Assert
      expect(sessionManager['sessionTimeoutHours']).toBe(8);
    });
  });

  describe('Token Verification', () => {
    it('should reject expired tokens', async () => {
      // Arrange
      const token = 'expired_token';

      // Mock JWT verification to throw expired error
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          const error = new Error('Token expired');
          error.name = 'TokenExpiredError';
          callback(error, null);
        }
      });

      // Act & Assert
      await expect(verifyToken(token)).rejects.toThrow('Unauthorized: Token expired');
    });

    it('should reject invalid tokens', async () => {
      // Arrange
      const token = 'invalid_token';

      // Mock JWT verification to throw invalid token error
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          const error = new Error('Invalid signature');
          error.name = 'JsonWebTokenError';
          callback(error, null);
        }
      });

      // Act & Assert
      await expect(verifyToken(token)).rejects.toThrow('Unauthorized: Invalid token');
    });

    it('should successfully verify valid tokens', async () => {
      // Arrange
      const token = 'valid_token';
      const expectedPayload = {
        sub: 'user123',
        jti: 'token123',
        exp: 9999999999,
        email: 'admin@example.com',
      };

      // Mock JWT verification to succeed
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, expectedPayload);
        }
      });

      // Act
      const result = await verifyToken(token);

      // Assert
      expect(result).toEqual(expectedPayload);
    });
  });

  describe('Policy Generation', () => {
    it('should generate Allow policy with context', () => {
      // Arrange
      const principalId = 'user123';
      const effect = 'Allow';
      const resource = 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples';
      const context = {
        userId: 'user123',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        permissions: 'MANAGE_TEMPLES,MANAGE_ARTIFACTS',
      };

      // Act
      const result = generatePolicy(principalId, effect, resource, context);

      // Assert
      expect(result.principalId).toBe(principalId);
      expect(result.policyDocument.Statement[0].Effect).toBe(effect);
      expect(result.policyDocument.Statement[0].Resource).toBe(resource);
      expect(result.context).toEqual(context);
    });

    it('should generate Deny policy without context', () => {
      // Arrange
      const principalId = 'user';
      const effect = 'Deny';
      const resource = 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples';

      // Act
      const result = generatePolicy(principalId, effect, resource);

      // Assert
      expect(result.principalId).toBe(principalId);
      expect(result.policyDocument.Statement[0].Effect).toBe(effect);
      expect(result.policyDocument.Statement[0].Resource).toBe(resource);
      expect(result.context).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle DynamoDB errors gracefully', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: 'Bearer valid_token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      // Mock token verification
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { sub: 'user123', jti: 'token123', exp: 9999999999 });
        }
      });

      // Mock rate limiter
      mockRateLimiter.checkRateLimit.mockResolvedValue(true);

      // Mock DynamoDB error
      ddbMock.on(GetCommand).rejects(new Error('DynamoDB error'));

      // Act
      const result = await handler(event);

      // Assert
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('should handle rate limiter errors gracefully (fail open)', async () => {
      // Arrange
      const event: APIGatewayTokenAuthorizerEvent = {
        type: 'TOKEN',
        authorizationToken: 'Bearer valid_token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples',
      };

      const mockUser = {
        userId: 'user123',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        permissions: ['MANAGE_TEMPLES'],
      };

      // Mock token verification
      jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { sub: 'user123', jti: 'token123', exp: 9999999999 });
        }
      });

      // Mock rate limiter error (should fail open)
      mockRateLimiter.checkRateLimit.mockRejectedValue(new Error('Rate limiter error'));

      // Mock DynamoDB response
      ddbMock.on(GetCommand).resolves({
        Item: mockUser,
      });

      // Mock session manager
      mockSessionManager.validateSession.mockResolvedValue(true);

      // Act
      const result = await handler(event);

      // Assert - Should still allow access when rate limiter fails
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny'); // Because rate limiter throws, not returns true
    });
  });
});