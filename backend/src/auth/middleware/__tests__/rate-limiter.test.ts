/**
 * Unit Tests for Rate Limiter
 * 
 * Tests rate limiting behavior with 100 requests per minute per user.
 * Validates Requirements 1.5, 1.6
 */

import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { RateLimiter } from '../rate-limiter';

// Mock AWS SDK
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  const testTableName = 'test-rate-limits';
  const testUserId = 'user123';

  beforeEach(() => {
    jest.clearAllMocks();
    ddbMock.reset();
    rateLimiter = new RateLimiter(testTableName);
    
    // Mock current time to have consistent tests
    jest.spyOn(Date, 'now').mockReturnValue(1000000 * 1000); // 1000000 seconds
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rate Limit Configuration', () => {
    it('should initialize with correct default values', () => {
      const limiter = new RateLimiter();
      
      expect(limiter['maxRequests']).toBe(100);
      expect(limiter['windowSeconds']).toBe(60);
    });

    it('should use custom table name', () => {
      const customTableName = 'custom-rate-limits';
      const limiter = new RateLimiter(customTableName);
      
      expect(limiter['tableName']).toBe(customTableName);
    });
  });

  describe('First Request Handling', () => {
    it('should allow first request and create new entry', async () => {
      // Arrange - No existing entry
      ddbMock.on(GetCommand).resolves({});
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(true);
      expect(ddbMock.commandCalls(GetCommand)).toHaveLength(1);
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);

      const putCall = ddbMock.commandCalls(PutCommand)[0];
      expect(putCall.args[0].input.TableName).toBe(testTableName);
      expect(putCall.args[0].input.Item?.userId).toBe(testUserId);
      expect(putCall.args[0].input.Item?.requests).toEqual([1000000]);
    });
  });

  describe('Within Rate Limit', () => {
    it('should allow request when under limit', async () => {
      // Arrange - Existing entry with 50 requests in current window
      const currentTime = 1000000;
      const existingRequests = Array.from({ length: 50 }, (_, i) => currentTime - i);
      
      ddbMock.on(GetCommand).resolves({
        Item: {
          userId: testUserId,
          requests: existingRequests,
          lastRequest: currentTime - 1,
          ttl: currentTime + 120,
        },
      });
      ddbMock.on(UpdateCommand).resolves({});

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(true);
      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1);

      const updateCall = ddbMock.commandCalls(UpdateCommand)[0];
      expect(updateCall.args[0].input.ExpressionAttributeValues?.[':requests']).toHaveLength(51);
    });

    it('should filter out old requests outside window', async () => {
      // Arrange - Mix of old and recent requests
      const currentTime = 1000000;
      const oldRequests = [currentTime - 120, currentTime - 90]; // Outside 60-second window
      const recentRequests = [currentTime - 30, currentTime - 10]; // Within window
      
      ddbMock.on(GetCommand).resolves({
        Item: {
          userId: testUserId,
          requests: [...oldRequests, ...recentRequests],
          lastRequest: currentTime - 10,
          ttl: currentTime + 120,
        },
      });
      ddbMock.on(UpdateCommand).resolves({});

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(true);
      
      const updateCall = ddbMock.commandCalls(UpdateCommand)[0];
      const updatedRequests = updateCall.args[0].input.ExpressionAttributeValues?.[':requests'] as number[];
      
      // Should only include recent requests + new request
      expect(updatedRequests).toHaveLength(3);
      expect(updatedRequests).toContain(currentTime - 30);
      expect(updatedRequests).toContain(currentTime - 10);
      expect(updatedRequests).toContain(currentTime);
      expect(updatedRequests).not.toContain(currentTime - 120);
      expect(updatedRequests).not.toContain(currentTime - 90);
    });
  });

  describe('Rate Limit Exceeded', () => {
    it('should deny request when limit is exceeded', async () => {
      // Arrange - Existing entry with 100 requests (at limit)
      const currentTime = 1000000;
      const existingRequests = Array.from({ length: 100 }, (_, i) => currentTime - i);
      
      ddbMock.on(GetCommand).resolves({
        Item: {
          userId: testUserId,
          requests: existingRequests,
          lastRequest: currentTime - 1,
          ttl: currentTime + 120,
        },
      });

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(false);
      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(0); // Should not update when denied
    });

    it('should deny request when exactly at limit', async () => {
      // Arrange - Existing entry with exactly 100 requests
      const currentTime = 1000000;
      const existingRequests = Array.from({ length: 100 }, (_, i) => currentTime - (i * 0.5));
      
      ddbMock.on(GetCommand).resolves({
        Item: {
          userId: testUserId,
          requests: existingRequests,
          lastRequest: currentTime - 0.5,
          ttl: currentTime + 120,
        },
      });

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Window Sliding Behavior', () => {
    it('should allow requests as window slides', async () => {
      // Arrange - Requests at edge of window
      const currentTime = 1000000;
      const windowStart = currentTime - 60;
      const requestsAtEdge = [windowStart + 1, windowStart + 2]; // Just inside window
      
      ddbMock.on(GetCommand).resolves({
        Item: {
          userId: testUserId,
          requests: requestsAtEdge,
          lastRequest: windowStart + 2,
          ttl: currentTime + 120,
        },
      });
      ddbMock.on(UpdateCommand).resolves({});

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(true);
      
      const updateCall = ddbMock.commandCalls(UpdateCommand)[0];
      const updatedRequests = updateCall.args[0].input.ExpressionAttributeValues?.[':requests'] as number[];
      expect(updatedRequests).toHaveLength(3); // 2 existing + 1 new
    });

    it('should exclude requests exactly at window boundary', async () => {
      // Arrange - Request exactly at window start (should be excluded)
      const currentTime = 1000000;
      const windowStart = currentTime - 60;
      const requestsAtBoundary = [windowStart, windowStart + 10]; // One at boundary, one inside
      
      ddbMock.on(GetCommand).resolves({
        Item: {
          userId: testUserId,
          requests: requestsAtBoundary,
          lastRequest: windowStart + 10,
          ttl: currentTime + 120,
        },
      });
      ddbMock.on(UpdateCommand).resolves({});

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(true);
      
      const updateCall = ddbMock.commandCalls(UpdateCommand)[0];
      const updatedRequests = updateCall.args[0].input.ExpressionAttributeValues?.[':requests'] as number[];
      expect(updatedRequests).toHaveLength(2); // Only the one inside window + new request
      expect(updatedRequests).toContain(windowStart + 10);
      expect(updatedRequests).toContain(currentTime);
      expect(updatedRequests).not.toContain(windowStart);
    });
  });

  describe('Error Handling', () => {
    it('should fail open on DynamoDB get error', async () => {
      // Arrange
      ddbMock.on(GetCommand).rejects(new Error('DynamoDB error'));

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(true); // Should fail open
    });

    it('should fail open on DynamoDB update error', async () => {
      // Arrange
      ddbMock.on(GetCommand).resolves({
        Item: {
          userId: testUserId,
          requests: [999990],
          lastRequest: 999990,
          ttl: 1000120,
        },
      });
      ddbMock.on(UpdateCommand).rejects(new Error('DynamoDB update error'));

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(true); // Should fail open
    });

    it('should fail open on DynamoDB put error for new entry', async () => {
      // Arrange
      ddbMock.on(GetCommand).resolves({}); // No existing entry
      ddbMock.on(PutCommand).rejects(new Error('DynamoDB put error'));

      // Act
      const result = await rateLimiter.checkRateLimit(testUserId);

      // Assert
      expect(result).toBe(true); // Should fail open
    });
  });

  describe('Utility Methods', () => {
    describe('getCurrentRequestCount', () => {
      it('should return correct count of requests in current window', async () => {
        // Arrange
        const currentTime = 1000000;
        const recentRequests = [currentTime - 30, currentTime - 10];
        const oldRequests = [currentTime - 90, currentTime - 120];
        
        ddbMock.on(GetCommand).resolves({
          Item: {
            userId: testUserId,
            requests: [...oldRequests, ...recentRequests],
            lastRequest: currentTime - 10,
            ttl: currentTime + 120,
          },
        });

        // Act
        const count = await rateLimiter.getCurrentRequestCount(testUserId);

        // Assert
        expect(count).toBe(2); // Only recent requests
      });

      it('should return 0 for non-existent user', async () => {
        // Arrange
        ddbMock.on(GetCommand).resolves({});

        // Act
        const count = await rateLimiter.getCurrentRequestCount(testUserId);

        // Assert
        expect(count).toBe(0);
      });

      it('should return 0 on error', async () => {
        // Arrange
        ddbMock.on(GetCommand).rejects(new Error('DynamoDB error'));

        // Act
        const count = await rateLimiter.getCurrentRequestCount(testUserId);

        // Assert
        expect(count).toBe(0);
      });
    });

    describe('resetRateLimit', () => {
      it('should reset rate limit for user', async () => {
        // Arrange
        ddbMock.on(PutCommand).resolves({});

        // Act
        await rateLimiter.resetRateLimit(testUserId);

        // Assert
        expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
        
        const putCall = ddbMock.commandCalls(PutCommand)[0];
        expect(putCall.args[0].input.Item?.userId).toBe(testUserId);
        expect(putCall.args[0].input.Item?.requests).toEqual([]);
        expect(putCall.args[0].input.Item?.lastRequest).toBe(0);
      });

      it('should handle reset errors gracefully', async () => {
        // Arrange
        ddbMock.on(PutCommand).rejects(new Error('DynamoDB error'));

        // Act & Assert - Should not throw
        await expect(rateLimiter.resetRateLimit(testUserId)).resolves.toBeUndefined();
      });
    });
  });

  describe('TTL Behavior', () => {
    it('should set appropriate TTL for new entries', async () => {
      // Arrange
      ddbMock.on(GetCommand).resolves({});
      ddbMock.on(PutCommand).resolves({});

      // Act
      await rateLimiter.checkRateLimit(testUserId);

      // Assert
      const putCall = ddbMock.commandCalls(PutCommand)[0];
      const ttl = putCall.args[0].input.Item?.ttl as number;
      const expectedTtl = 1000000 + (2 * 60); // Current time + 2 minutes
      expect(ttl).toBe(expectedTtl);
    });
  });

  describe('Concurrent User Handling', () => {
    it('should handle different users independently', async () => {
      // Arrange
      const user1 = 'user1';
      const user2 = 'user2';
      
      ddbMock.on(GetCommand).resolves({});
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result1 = await rateLimiter.checkRateLimit(user1);
      const result2 = await rateLimiter.checkRateLimit(user2);

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(ddbMock.commandCalls(GetCommand)).toHaveLength(2);
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(2);
    });
  });
});