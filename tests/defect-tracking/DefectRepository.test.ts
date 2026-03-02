/**
 * Unit tests for DefectRepository
 * Feature: defect-tracking
 * 
 * Tests CRUD operations and query methods for defect data access layer.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { DefectRepository } from '../../src/defect-tracking/repositories/DefectRepository';
import { Defect, DefectStatus } from '../../src/defect-tracking/types';

const ddbMock = mockClient(DynamoDBClient);

describe('DefectRepository', () => {
  let repository: DefectRepository;
  const tableName = 'test-defects-table';

  beforeEach(() => {
    ddbMock.reset();
    const client = new DynamoDBClient({});
    repository = new DefectRepository(client, tableName);
  });

  describe('create', () => {
    it('should create a new defect', async () => {
      const defect: Defect = {
        defectId: 'defect-123',
        userId: 'user-456',
        title: 'Test Bug Title',
        description: 'This is a test bug description',
        status: 'New',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        updateCount: 0
      };

      ddbMock.on(PutItemCommand).resolves({});

      const result = await repository.create(defect);

      expect(result).toEqual(defect);
      expect(ddbMock.calls()).toHaveLength(1);
    });

    it('should throw error if defect already exists', async () => {
      const defect: Defect = {
        defectId: 'defect-123',
        userId: 'user-456',
        title: 'Test Bug Title',
        description: 'This is a test bug description',
        status: 'New',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        updateCount: 0
      };

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      ddbMock.on(PutItemCommand).rejects(error);

      await expect(repository.create(defect)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find defect by ID', async () => {
      const defect: Defect = {
        defectId: 'defect-123',
        userId: 'user-456',
        title: 'Test Bug Title',
        description: 'This is a test bug description',
        status: 'New',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        updateCount: 0
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(defect)
      });

      const result = await repository.findById('defect-123');

      expect(result).toEqual(defect);
      expect(ddbMock.calls()).toHaveLength(1);
    });

    it('should return null if defect not found', async () => {
      ddbMock.on(GetItemCommand).resolves({});

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find defects by user ID', async () => {
      const defects: Defect[] = [
        {
          defectId: 'defect-1',
          userId: 'user-456',
          title: 'Bug 1',
          description: 'Description 1',
          status: 'New',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          updateCount: 0
        },
        {
          defectId: 'defect-2',
          userId: 'user-456',
          title: 'Bug 2',
          description: 'Description 2',
          status: 'Acknowledged',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          updateCount: 1
        }
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: defects.map(d => marshall(d)),
        Count: 2
      });

      const result = await repository.findByUserId('user-456');

      expect(result.items).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.items[0].defectId).toBe('defect-1');
    });

    it('should filter by status when provided', async () => {
      const defects: Defect[] = [
        {
          defectId: 'defect-1',
          userId: 'user-456',
          title: 'Bug 1',
          description: 'Description 1',
          status: 'New',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          updateCount: 0
        }
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: defects.map(d => marshall(d)),
        Count: 1
      });

      const result = await repository.findByUserId('user-456', { status: 'New' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('New');
    });

    it('should support pagination', async () => {
      const defects: Defect[] = [
        {
          defectId: 'defect-1',
          userId: 'user-456',
          title: 'Bug 1',
          description: 'Description 1',
          status: 'New',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          updateCount: 0
        }
      ];

      const lastKey = { defectId: 'defect-1', userId: 'user-456', createdAt: '2024-01-01T00:00:00.000Z' };

      ddbMock.on(QueryCommand).resolves({
        Items: defects.map(d => marshall(d)),
        Count: 1,
        LastEvaluatedKey: marshall(lastKey)
      });

      const result = await repository.findByUserId('user-456', { limit: 10 });

      expect(result.lastEvaluatedKey).toEqual(lastKey);
    });
  });

  describe('findAll', () => {
    it('should find all defects without filters', async () => {
      const defects: Defect[] = [
        {
          defectId: 'defect-1',
          userId: 'user-1',
          title: 'Bug 1',
          description: 'Description 1',
          status: 'New',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          updateCount: 0
        },
        {
          defectId: 'defect-2',
          userId: 'user-2',
          title: 'Bug 2',
          description: 'Description 2',
          status: 'Acknowledged',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          updateCount: 1
        }
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: defects.map(d => marshall(d)),
        Count: 2
      });

      const result = await repository.findAll();

      expect(result.items).toHaveLength(2);
      expect(result.count).toBe(2);
      // Should be sorted by createdAt descending
      expect(result.items[0].defectId).toBe('defect-1');
    });

    it('should filter by status using GSI', async () => {
      const defects: Defect[] = [
        {
          defectId: 'defect-1',
          userId: 'user-1',
          title: 'Bug 1',
          description: 'Description 1',
          status: 'New',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          updateCount: 0
        }
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: defects.map(d => marshall(d)),
        Count: 1
      });

      const result = await repository.findAll({ status: 'New' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('New');
    });

    it('should search by defect ID or title', async () => {
      const defects: Defect[] = [
        {
          defectId: 'defect-123',
          userId: 'user-1',
          title: 'Search Bug',
          description: 'Description',
          status: 'New',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          updateCount: 0
        }
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: defects.map(d => marshall(d)),
        Count: 1
      });

      const result = await repository.findAll({ search: 'Search' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toContain('Search');
    });
  });

  describe('updateStatus', () => {
    it('should update defect status', async () => {
      ddbMock.on(UpdateItemCommand).resolves({});

      await repository.updateStatus('defect-123', 'Acknowledged');

      expect(ddbMock.calls()).toHaveLength(1);
      const call = ddbMock.call(0);
      expect(call.args[0].input).toMatchObject({
        TableName: tableName,
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt'
      });
    });

    it('should throw error if defect not found', async () => {
      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      ddbMock.on(UpdateItemCommand).rejects(error);

      await expect(repository.updateStatus('non-existent', 'Acknowledged'))
        .rejects.toThrow('not found');
    });
  });

  describe('update', () => {
    it('should update entire defect', async () => {
      const defect: Defect = {
        defectId: 'defect-123',
        userId: 'user-456',
        title: 'Updated Bug Title',
        description: 'Updated description',
        status: 'In_Progress',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        updateCount: 2
      };

      ddbMock.on(PutItemCommand).resolves({});

      const result = await repository.update(defect);

      expect(result.defectId).toBe(defect.defectId);
      expect(result.title).toBe(defect.title);
      // updatedAt should be updated
      expect(result.updatedAt).not.toBe(defect.updatedAt);
    });

    it('should throw error if defect not found', async () => {
      const defect: Defect = {
        defectId: 'non-existent',
        userId: 'user-456',
        title: 'Bug',
        description: 'Description',
        status: 'New',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        updateCount: 0
      };

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      ddbMock.on(PutItemCommand).rejects(error);

      await expect(repository.update(defect)).rejects.toThrow('not found');
    });
  });

  describe('error handling', () => {
    it('should handle throttling errors', async () => {
      const error = new Error('Throttled');
      error.name = 'ProvisionedThroughputExceededException';
      ddbMock.on(GetItemCommand).rejects(error);

      await expect(repository.findById('defect-123'))
        .rejects.toThrow('throttling detected');
    });

    it('should handle resource not found errors', async () => {
      const error = new Error('Table not found');
      error.name = 'ResourceNotFoundException';
      ddbMock.on(GetItemCommand).rejects(error);

      await expect(repository.findById('defect-123'))
        .rejects.toThrow('not found');
    });

    it('should handle validation errors', async () => {
      const error = new Error('Invalid parameters');
      error.name = 'ValidationException';
      ddbMock.on(QueryCommand).rejects(error);

      await expect(repository.findByUserId('user-123'))
        .rejects.toThrow('Invalid query parameters');
    });

    it('should handle access denied errors', async () => {
      const error = new Error('Access denied');
      error.name = 'AccessDeniedException';
      ddbMock.on(GetItemCommand).rejects(error);

      await expect(repository.findById('defect-123'))
        .rejects.toThrow('Access denied');
    });
  });
});
