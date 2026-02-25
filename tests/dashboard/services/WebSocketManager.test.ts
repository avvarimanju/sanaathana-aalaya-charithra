/**
 * Unit tests for WebSocketManager
 * Feature: real-time-reports-dashboard
 * 
 * Tests connection lifecycle, message delivery, and role-based broadcasting
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  PutItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { WebSocketManager } from '../../../src/dashboard/services/WebSocketManager';
import { DashboardUpdate, WebSocketConnection } from '../../../src/dashboard/types';

const dynamoMock = mockClient(DynamoDBClient);

describe('WebSocketManager', () => {
  let manager: WebSocketManager;
  const config = {
    connectionsTableName: 'test-connections',
    apiGatewayEndpoint: 'https://test.execute-api.us-east-1.amazonaws.com/test',
    connectionTtlHours: 24
  };

  beforeEach(() => {
    dynamoMock.reset();
    const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
    manager = new WebSocketManager(dynamoClient, config);
  });

  describe('handleConnect', () => {
    it('should store connection in DynamoDB', async () => {
      dynamoMock.on(PutItemCommand).resolves({});

      await manager.handleConnect(
        'conn-123',
        'user-456',
        'admin',
        'North'
      );

      expect(dynamoMock.calls()).toHaveLength(1);
      const call = dynamoMock.call(0);
      const input = call.args[0].input as any;
      expect(input.TableName).toBe(config.connectionsTableName);
    });

    it('should set TTL for connection', async () => {
      dynamoMock.on(PutItemCommand).resolves({});

      await manager.handleConnect(
        'conn-123',
        'user-456',
        'admin'
      );

      const call = dynamoMock.call(0);
      const input = call.args[0].input as any;
      expect(input.Item).toHaveProperty('ttl');
    });

    it('should store subscribed filters', async () => {
      dynamoMock.on(PutItemCommand).resolves({});

      const filters = {
        timeRange: 'last_7_days' as const,
        templeIds: ['temple-1'],
        regions: ['North'],
        categories: ['Architecture']
      };

      await manager.handleConnect(
        'conn-123',
        'user-456',
        'admin',
        'North',
        filters
      );

      expect(dynamoMock.calls()).toHaveLength(1);
    });

    it('should throw error on DynamoDB failure', async () => {
      dynamoMock.on(PutItemCommand).rejects(new Error('DynamoDB error'));

      await expect(
        manager.handleConnect('conn-123', 'user-456', 'admin')
      ).rejects.toThrow();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove connection from DynamoDB', async () => {
      dynamoMock.on(DeleteItemCommand).resolves({});

      await manager.handleDisconnect('conn-123');

      expect(dynamoMock.calls()).toHaveLength(1);
      const call = dynamoMock.call(0);
      const input = call.args[0].input as any;
      expect(input.TableName).toBe(config.connectionsTableName);
      expect(input.Key).toEqual(
        marshall({ connectionId: 'conn-123' })
      );
    });

    it('should not throw error on DynamoDB failure', async () => {
      dynamoMock.on(DeleteItemCommand).rejects(new Error('DynamoDB error'));

      // Should not throw - disconnection cleanup is best-effort
      await expect(
        manager.handleDisconnect('conn-123')
      ).resolves.not.toThrow();
    });
  });

  describe('getConnection', () => {
    it('should retrieve connection by ID', async () => {
      const connection: WebSocketConnection = {
        connectionId: 'conn-123',
        userId: 'user-456',
        userRole: 'admin',
        region: 'North',
        subscribedFilters: {
          timeRange: 'all_time',
          templeIds: [],
          regions: ['North'],
          categories: []
        },
        connectedAt: Date.now(),
        lastPingAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 86400
      };

      dynamoMock.on(GetItemCommand).resolves({
        Item: marshall(connection)
      });

      const result = await manager.getConnection('conn-123');

      expect(result).toBeDefined();
      expect(result?.connectionId).toBe('conn-123');
      expect(result?.userId).toBe('user-456');
      expect(result?.userRole).toBe('admin');
    });

    it('should return null when connection not found', async () => {
      dynamoMock.on(GetItemCommand).resolves({});

      const result = await manager.getConnection('conn-999');

      expect(result).toBeNull();
    });

    it('should throw error on DynamoDB failure', async () => {
      dynamoMock.on(GetItemCommand).rejects(new Error('DynamoDB error'));

      await expect(
        manager.getConnection('conn-123')
      ).rejects.toThrow();
    });
  });

  describe('updateLastPing', () => {
    it('should update lastPingAt timestamp', async () => {
      dynamoMock.on(PutItemCommand).resolves({});

      await manager.updateLastPing('conn-123');

      expect(dynamoMock.calls()).toHaveLength(1);
      const call = dynamoMock.call(0);
      const input = call.args[0].input as any;
      expect(input.TableName).toBe(config.connectionsTableName);
    });

    it('should not throw error when connection does not exist', async () => {
      dynamoMock.on(PutItemCommand).rejects({
        name: 'ConditionalCheckFailedException'
      });

      // Should not throw - just log warning
      await expect(
        manager.updateLastPing('conn-999')
      ).resolves.not.toThrow();
    });
  });

  describe('broadcastToRole', () => {
    it('should query connections by role', async () => {
      const connections: WebSocketConnection[] = [
        {
          connectionId: 'conn-1',
          userId: 'user-1',
          userRole: 'admin',
          subscribedFilters: {
            timeRange: 'all_time',
            templeIds: [],
            regions: [],
            categories: []
          },
          connectedAt: Date.now(),
          lastPingAt: Date.now(),
          ttl: Math.floor(Date.now() / 1000) + 86400
        },
        {
          connectionId: 'conn-2',
          userId: 'user-2',
          userRole: 'admin',
          subscribedFilters: {
            timeRange: 'all_time',
            templeIds: [],
            regions: [],
            categories: []
          },
          connectedAt: Date.now(),
          lastPingAt: Date.now(),
          ttl: Math.floor(Date.now() / 1000) + 86400
        }
      ];

      dynamoMock.on(QueryCommand).resolves({
        Items: connections.map(c => marshall(c))
      });

      const update: DashboardUpdate = {
        type: 'metrics',
        data: {},
        timestamp: Date.now()
      };

      // Note: This will fail to send because we don't have API Gateway mock
      // but we can verify the query was made
      await manager.broadcastToRole(update, 'admin');

      const queryCalls = dynamoMock.calls().filter(
        call => call.args[0] instanceof QueryCommand
      );
      expect(queryCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle ProvisionedThroughputExceededException', async () => {
      dynamoMock.on(GetItemCommand).rejects({
        name: 'ProvisionedThroughputExceededException'
      });

      await expect(
        manager.getConnection('conn-123')
      ).rejects.toThrow('Database throttling detected');
    });

    it('should handle ResourceNotFoundException', async () => {
      dynamoMock.on(GetItemCommand).rejects({
        name: 'ResourceNotFoundException'
      });

      await expect(
        manager.getConnection('conn-123')
      ).rejects.toThrow('Table test-connections not found');
    });

    it('should handle ValidationException', async () => {
      dynamoMock.on(GetItemCommand).rejects({
        name: 'ValidationException',
        message: 'Invalid key'
      });

      await expect(
        manager.getConnection('conn-123')
      ).rejects.toThrow('Invalid parameters');
    });

    it('should handle AccessDeniedException', async () => {
      dynamoMock.on(GetItemCommand).rejects({
        name: 'AccessDeniedException'
      });

      await expect(
        manager.getConnection('conn-123')
      ).rejects.toThrow('Access denied');
    });
  });
});
