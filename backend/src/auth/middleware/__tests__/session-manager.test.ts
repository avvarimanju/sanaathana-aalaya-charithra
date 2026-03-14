/**
 * Unit Tests for Session Manager
 * 
 * Tests session expiration handling and session management.
 * Validates Requirements 1.5, 1.6
 */

import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SessionManager } from '../session-manager';

// Mock AWS SDK
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  const testTableName = 'test-admin-sessions';
  const testUserId = 'user123';
  const testTokenJti = 'token123';

  beforeEach(() => {
    jest.clearAllMocks();
    ddbMock.reset();
    sessionManager = new SessionManager(testTableName);
    
    // Mock current time
    jest.spyOn(Date, 'now').mockReturnValue(1000000 * 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('Session Configuration', () => {
    it('should initialize with correct default values', () => {
      const manager = new SessionManager();
      
      expect(manager['sessionTimeoutHours']).toBe(8);
    });

    it('should use custom table name', () => {
      const customTableName = 'custom-sessions';
      const manager = new SessionManager(customTableName);
      
      expect(manager['tableName']).toBe(customTableName);
    });
  });

  describe('Session Creation', () => {
    it('should create new session successfully', async () => {
      // Arrange
      ddbMock.on(PutCommand).resolves({});

      // Act
      const sessionId = await sessionManager.createSession(testUserId, testTokenJti);

      // Assert
      expect(sessionId).toBe(`${testUserId}:${testTokenJti}`);
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);

      const putCall = ddbMock.commandCalls(PutCommand)[0];
      const item = putCall.args[0].input.Item;
      expect(item?.sessionId).toBe(`${testUserId}:${testTokenJti}`);
      expect(item?.userId).toBe(testUserId);
      expect(item?.tokenJti).toBe(testTokenJti);
      expect(item?.createdAt).toBe(1000000);
      expect(item?.expiresAt).toBe(1000000 + (8 * 3600)); // 8 hours later
    });
  });
  describe('Session Validation', () => {
    it('should validate active session and update last activity', async () => {
      // Arrange
      const currentTime = 1000000;
      const expiresAt = currentTime + (8 * 3600);
      
      ddbMock.on(GetCommand).resolves({
        Item: {
          sessionId: `${testUserId}:${testTokenJti}`,
          userId: testUserId,
          tokenJti: testTokenJti,
          createdAt: currentTime - 3600,
          expiresAt,
          lastActivity: currentTime - 3600,
        },
      });
      ddbMock.on(UpdateCommand).resolves({});

      // Act
      const result = await sessionManager.validateSession(testUserId, testTokenJti);

      // Assert
      expect(result).toBe(true);
      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1);
    });

    it('should reject expired session', async () => {
      // Arrange
      const currentTime = 1000000;
      const expiredTime = currentTime - 3600; // 1 hour ago
      
      ddbMock.on(GetCommand).resolves({
        Item: {
          sessionId: `${testUserId}:${testTokenJti}`,
          expiresAt: expiredTime,
        },
      });

      // Act
      const result = await sessionManager.validateSession(testUserId, testTokenJti);

      // Assert
      expect(result).toBe(false);
      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(0);
    });
  });
});