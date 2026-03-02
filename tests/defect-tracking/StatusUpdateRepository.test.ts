/**
 * Unit tests for StatusUpdateRepository
 * Feature: defect-tracking
 * 
 * Tests CRUD operations and query methods for status update data access layer.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  PutItemCommand,
  GetItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { StatusUpdateRepository } from '../../src/defect-tracking/repositories/StatusUpdateRepository';
import { StatusUpdate } from '../../src/defect-tracking/types';

const ddbMock = mockClient(DynamoDBClient);

describe('StatusUpdateRepository', () => {
  let repository: StatusUpdateRepository;
  const tableName = 'test-status-updates-table';

  beforeEach(() => {
    ddbMock.reset();
    const client = new DynamoDBClient({});
    repository = new StatusUpdateRepository(client, tableName);
  });

  describe('create', () => {
    it('should create a new status update', async () => {
      const statusUpdate: StatusUpdate = {
        updateId: 'update-123',
        defectId: 'defect-456',
        message: 'Working on this issue',
        adminId: 'admin-789',
        adminName: 'Admin User',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      ddbMock.on(PutItemCommand).resolves({});

      const result = await repository.create(statusUpdate);

      expect(result).toEqual(statusUpdate);
      expect(ddbMock.calls()).toHaveLength(1);
    });

    it('should create status update with status change', async () => {
      const statusUpdate: StatusUpdate = {
        updateId: 'update-123',
        defectId: 'defect-456',
        message: 'Status changed to In Progress',
        previousStatus: 'Acknowledged',
        newStatus: 'In_Progress',
        adminId: 'admin-789',
        adminName: 'Admin User',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      ddbMock.on(PutItemCommand).resolves({});

      const result = await repository.create(statusUpdate);

      expect(result).toEqual(statusUpdate);
      expect(result.previousStatus).toBe('Acknowledged');
      expect(result.newStatus).toBe('In_Progress');
    });

    it('should throw error if update already exists', async () => {
      const statusUpdate: StatusUpdate = {
        updateId: 'update-123',
        defectId: 'defect-456',
        message: 'Test message',
        adminId: 'admin-789',
        adminName: 'Admin User',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      ddbMock.on(PutItemCommand).rejects(error);

      await expect(repository.create(statusUpdate)).rejects.toThrow();
    });
  });

  describe('findByDefectId', () => {
    it('should find all status updates for a defect in chronological order', async () => {
      const statusUpdates: StatusUpdate[] = [
        {
          updateId: 'update-1',
          defectId: 'defect-456',
          message: 'First update',
          adminId: 'admin-789',
          adminName: 'Admin User',
          timestamp: '2024-01-01T00:00:00.000Z'
        },
        {
          updateId: 'update-2',
          defectId: 'defect-456',
          message: 'Second update',
          adminId: 'admin-789',
          adminName: 'Admin User',
          timestamp: '2024-01-02T00:00:00.000Z'
        },
        {
          updateId: 'update-3',
          defectId: 'defect-456',
          message: 'Third update',
          previousStatus: 'Acknowledged',
          newStatus: 'In_Progress',
          adminId: 'admin-789',
          adminName: 'Admin User',
          timestamp: '2024-01-03T00:00:00.000Z'
        }
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: statusUpdates.map(u => marshall(u))
      });

      const result = await repository.findByDefectId('defect-456');

      expect(result).toHaveLength(3);
      expect(result[0].updateId).toBe('update-1');
      expect(result[1].updateId).toBe('update-2');
      expect(result[2].updateId).toBe('update-3');
      // Verify chronological order (oldest first)
      expect(new Date(result[0].timestamp).getTime())
        .toBeLessThan(new Date(result[1].timestamp).getTime());
      expect(new Date(result[1].timestamp).getTime())
        .toBeLessThan(new Date(result[2].timestamp).getTime());
    });

    it('should return empty array if no updates found', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: []
      });

      const result = await repository.findByDefectId('defect-456');

      expect(result).toEqual([]);
    });

    it('should handle defect with single update', async () => {
      const statusUpdate: StatusUpdate = {
        updateId: 'update-1',
        defectId: 'defect-456',
        message: 'Only update',
        adminId: 'admin-789',
        adminName: 'Admin User',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      ddbMock.on(QueryCommand).resolves({
        Items: [marshall(statusUpdate)]
      });

      const result = await repository.findByDefectId('defect-456');

      expect(result).toHaveLength(1);
      expect(result[0].updateId).toBe('update-1');
    });
  });

  describe('findById', () => {
    it('should find status update by ID', async () => {
      const statusUpdate: StatusUpdate = {
        updateId: 'update-123',
        defectId: 'defect-456',
        message: 'Test update',
        adminId: 'admin-789',
        adminName: 'Admin User',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(statusUpdate)
      });

      const result = await repository.findById('update-123');

      expect(result).toEqual(statusUpdate);
      expect(ddbMock.calls()).toHaveLength(1);
    });

    it('should return null if status update not found', async () => {
      ddbMock.on(GetItemCommand).resolves({});

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should find status update with status change', async () => {
      const statusUpdate: StatusUpdate = {
        updateId: 'update-123',
        defectId: 'defect-456',
        message: 'Status changed',
        previousStatus: 'New',
        newStatus: 'Acknowledged',
        adminId: 'admin-789',
        adminName: 'Admin User',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(statusUpdate)
      });

      const result = await repository.findById('update-123');

      expect(result).toEqual(statusUpdate);
      expect(result?.previousStatus).toBe('New');
      expect(result?.newStatus).toBe('Acknowledged');
    });
  });

  describe('error handling', () => {
    it('should handle throttling errors', async () => {
      const error = new Error('Throttled');
      error.name = 'ProvisionedThroughputExceededException';
      ddbMock.on(GetItemCommand).rejects(error);

      await expect(repository.findById('update-123'))
        .rejects.toThrow('throttling detected');
    });

    it('should handle resource not found errors', async () => {
      const error = new Error('Table not found');
      error.name = 'ResourceNotFoundException';
      ddbMock.on(GetItemCommand).rejects(error);

      await expect(repository.findById('update-123'))
        .rejects.toThrow('not found');
    });

    it('should handle validation errors', async () => {
      const error = new Error('Invalid parameters');
      error.name = 'ValidationException';
      ddbMock.on(QueryCommand).rejects(error);

      await expect(repository.findByDefectId('defect-123'))
        .rejects.toThrow('Invalid query parameters');
    });

    it('should handle access denied errors', async () => {
      const error = new Error('Access denied');
      error.name = 'AccessDeniedException';
      ddbMock.on(GetItemCommand).rejects(error);

      await expect(repository.findById('update-123'))
        .rejects.toThrow('Access denied');
    });

    it('should handle conditional check failures on create', async () => {
      const statusUpdate: StatusUpdate = {
        updateId: 'update-123',
        defectId: 'defect-456',
        message: 'Test',
        adminId: 'admin-789',
        adminName: 'Admin User',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      ddbMock.on(PutItemCommand).rejects(error);

      await expect(repository.create(statusUpdate))
        .rejects.toThrow('Conditional check failed');
    });
  });
});
