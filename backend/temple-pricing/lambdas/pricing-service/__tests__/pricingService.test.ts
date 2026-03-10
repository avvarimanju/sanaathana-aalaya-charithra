/**
 * Unit tests for Pricing Service
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  setPriceConfiguration,
  getPriceConfiguration,
  getBatchPriceConfigurations,
  deletePriceConfiguration,
  listPricesSortedByAmount,
  getPriceHistory,
} from '../pricingService';
import { PriceConfigRequest, EntityType } from '../../../types';
import * as dynamodb from '../../../utils/dynamodb';
import * as redisCache from '../../../utils/redis';
import { ValidationError, NotFoundError } from '../../../utils/errors';

// Mock dependencies
jest.mock('../../../utils/dynamodb', () => {
  const actual = jest.requireActual<typeof import('../../../utils/dynamodb')>('../../../utils/dynamodb');
  return {
    ...actual,
    putItem: jest.fn(),
    getItem: jest.fn(),
    deleteItem: jest.fn(),
    queryItems: jest.fn(),
  };
});
jest.mock('../../../utils/redis');
jest.mock('../../../utils/logger');

describe('Pricing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redis cache methods
    jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
    jest.spyOn(redisCache.default, 'set').mockResolvedValue(undefined);
    jest.spyOn(redisCache.default, 'del').mockResolvedValue(undefined);
    jest.spyOn(redisCache.default, 'generatePriceKey').mockReturnValue('price:TEMPLE:test-id');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setPriceConfiguration', () => {
    it('should set a valid price configuration', async () => {
      const request: PriceConfigRequest = {
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 100,
      };

      jest.spyOn(dynamodb, 'putItem').mockResolvedValue(undefined);

      const result = await setPriceConfiguration(request, 'admin-123');

      expect(result).toMatchObject({
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 100,
        currency: 'INR',
        isFree: false,
        setBy: 'admin-123',
        isOverride: false,
      });

      expect(dynamodb.putItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'CURRENT',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 100,
          GSI1PK: 'PRICES',
          GSI1SK: expect.stringContaining('AMOUNT#'),
        })
      );

      expect(redisCache.default.del).toHaveBeenCalled();
    });

    it('should set isFree to true for zero price', async () => {
      const request: PriceConfigRequest = {
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 0,
      };

      jest.spyOn(dynamodb, 'putItem').mockResolvedValue(undefined);

      const result = await setPriceConfiguration(request, 'admin-123');

      expect(result.isFree).toBe(true);
      expect(result.priceAmount).toBe(0);
    });

    it('should reject negative price amounts', async () => {
      const request: PriceConfigRequest = {
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: -100,
      };

      await expect(setPriceConfiguration(request, 'admin-123')).rejects.toThrow(ValidationError);
    });

    it('should reject price amounts exceeding maximum', async () => {
      const request: PriceConfigRequest = {
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 100000, // Exceeds 99999 max
      };

      await expect(setPriceConfiguration(request, 'admin-123')).rejects.toThrow(ValidationError);
    });

    it('should reject invalid entity type', async () => {
      const request: PriceConfigRequest = {
        entityId: 'temple-123',
        entityType: 'INVALID' as EntityType,
        priceAmount: 100,
      };

      await expect(setPriceConfiguration(request, 'admin-123')).rejects.toThrow(ValidationError);
    });

    it('should reject empty entity ID', async () => {
      const request: PriceConfigRequest = {
        entityId: '',
        entityType: 'TEMPLE',
        priceAmount: 100,
      };

      await expect(setPriceConfiguration(request, 'admin-123')).rejects.toThrow(ValidationError);
    });

    it('should store override reason when provided', async () => {
      const request: PriceConfigRequest = {
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 100,
        overrideReason: 'Special pricing for promotional period',
      };

      jest.spyOn(dynamodb, 'putItem').mockResolvedValue(undefined);

      const result = await setPriceConfiguration(request, 'admin-123');

      expect(result.overrideReason).toBe('Special pricing for promotional period');
    });

    it('should handle temple group pricing', async () => {
      const request: PriceConfigRequest = {
        entityId: 'group-456',
        entityType: 'GROUP',
        priceAmount: 500,
      };

      jest.spyOn(dynamodb, 'putItem').mockResolvedValue(undefined);

      const result = await setPriceConfiguration(request, 'admin-123');

      expect(result.entityType).toBe('GROUP');
      expect(result.entityId).toBe('group-456');
      expect(dynamodb.putItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          PK: 'PRICE#GROUP#group-456',
        })
      );
    });
  });

  describe('getPriceConfiguration', () => {
    it('should retrieve price configuration from cache', async () => {
      const cachedConfig = {
        entityId: 'temple-123',
        entityType: 'TEMPLE' as EntityType,
        priceAmount: 100,
        currency: 'INR',
        isFree: false,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        setBy: 'admin-123',
        isOverride: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
      };

      jest.spyOn(redisCache.default, 'get').mockResolvedValue(cachedConfig);

      const result = await getPriceConfiguration('TEMPLE', 'temple-123');

      expect(result).toEqual(cachedConfig);
      expect(dynamodb.getItem).not.toHaveBeenCalled();
    });

    it('should retrieve price configuration from DynamoDB when not cached', async () => {
      const dbItem = {
        PK: 'PRICE#TEMPLE#temple-123',
        SK: 'CURRENT',
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 100,
        currency: 'INR',
        isFree: false,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        setBy: 'admin-123',
        isOverride: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
      };

      jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
      jest.spyOn(dynamodb, 'getItem').mockResolvedValue(dbItem);

      const result = await getPriceConfiguration('TEMPLE', 'temple-123');

      expect(result).toMatchObject({
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 100,
      });

      expect(dynamodb.getItem).toHaveBeenCalledWith(
        expect.any(String),
        { PK: 'PRICE#TEMPLE#temple-123', SK: 'CURRENT' }
      );

      expect(redisCache.default.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        3600
      );
    });

    it('should return null when price configuration does not exist', async () => {
      jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
      jest.spyOn(dynamodb, 'getItem').mockResolvedValue(null);

      const result = await getPriceConfiguration('TEMPLE', 'nonexistent-id');

      expect(result).toBeNull();
    });

    it('should validate entity type', async () => {
      await expect(
        getPriceConfiguration('INVALID' as EntityType, 'temple-123')
      ).rejects.toThrow(ValidationError);
    });

    it('should validate entity ID', async () => {
      await expect(
        getPriceConfiguration('TEMPLE', '')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getBatchPriceConfigurations', () => {
    it('should retrieve multiple price configurations', async () => {
      const entities = [
        { entityType: 'TEMPLE' as EntityType, entityId: 'temple-1' },
        { entityType: 'TEMPLE' as EntityType, entityId: 'temple-2' },
        { entityType: 'GROUP' as EntityType, entityId: 'group-1' },
      ];

      const mockConfigs = [
        {
          entityId: 'temple-1',
          entityType: 'TEMPLE' as EntityType,
          priceAmount: 100,
          currency: 'INR',
          isFree: false,
          effectiveDate: '2024-01-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1,
        },
        {
          entityId: 'temple-2',
          entityType: 'TEMPLE' as EntityType,
          priceAmount: 200,
          currency: 'INR',
          isFree: false,
          effectiveDate: '2024-01-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1,
        },
        {
          entityId: 'group-1',
          entityType: 'GROUP' as EntityType,
          priceAmount: 500,
          currency: 'INR',
          isFree: false,
          effectiveDate: '2024-01-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1,
        },
      ];

      jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
      jest.spyOn(dynamodb, 'getItem')
        .mockResolvedValueOnce({ ...mockConfigs[0], PK: 'PRICE#TEMPLE#temple-1', SK: 'CURRENT' })
        .mockResolvedValueOnce({ ...mockConfigs[1], PK: 'PRICE#TEMPLE#temple-2', SK: 'CURRENT' })
        .mockResolvedValueOnce({ ...mockConfigs[2], PK: 'PRICE#GROUP#group-1', SK: 'CURRENT' });

      const result = await getBatchPriceConfigurations(entities);

      expect(result).toHaveLength(3);
      expect(result[0].entityId).toBe('temple-1');
      expect(result[1].entityId).toBe('temple-2');
      expect(result[2].entityId).toBe('group-1');
    });

    it('should filter out null results for non-existent entities', async () => {
      const entities = [
        { entityType: 'TEMPLE' as EntityType, entityId: 'temple-1' },
        { entityType: 'TEMPLE' as EntityType, entityId: 'nonexistent' },
      ];

      const mockConfig = {
        entityId: 'temple-1',
        entityType: 'TEMPLE' as EntityType,
        priceAmount: 100,
        currency: 'INR',
        isFree: false,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        setBy: 'admin-123',
        isOverride: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
      };

      jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
      jest.spyOn(dynamodb, 'getItem')
        .mockResolvedValueOnce({ ...mockConfig, PK: 'PRICE#TEMPLE#temple-1', SK: 'CURRENT' })
        .mockResolvedValueOnce(null);

      const result = await getBatchPriceConfigurations(entities);

      expect(result).toHaveLength(1);
      expect(result[0].entityId).toBe('temple-1');
    });

    it('should reject empty entities array', async () => {
      await expect(getBatchPriceConfigurations([])).rejects.toThrow(ValidationError);
    });

    it('should reject non-array input', async () => {
      await expect(getBatchPriceConfigurations(null as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('deletePriceConfiguration', () => {
    it('should delete existing price configuration', async () => {
      const mockConfig = {
        entityId: 'temple-123',
        entityType: 'TEMPLE' as EntityType,
        priceAmount: 100,
        currency: 'INR',
        isFree: false,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        setBy: 'admin-123',
        isOverride: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
      };

      jest.spyOn(redisCache.default, 'get').mockResolvedValue(mockConfig);
      jest.spyOn(dynamodb, 'deleteItem').mockResolvedValue(undefined);

      await deletePriceConfiguration('TEMPLE', 'temple-123');

      expect(dynamodb.deleteItem).toHaveBeenCalledWith(
        expect.any(String),
        { PK: 'PRICE#TEMPLE#temple-123', SK: 'CURRENT' }
      );

      expect(redisCache.default.del).toHaveBeenCalled();
    });

    it('should throw NotFoundError when price configuration does not exist', async () => {
      jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
      jest.spyOn(dynamodb, 'getItem').mockResolvedValue(null);

      await expect(
        deletePriceConfiguration('TEMPLE', 'nonexistent-id')
      ).rejects.toThrow(NotFoundError);

      expect(dynamodb.deleteItem).not.toHaveBeenCalled();
    });

    it('should validate entity type', async () => {
      await expect(
        deletePriceConfiguration('INVALID' as EntityType, 'temple-123')
      ).rejects.toThrow(ValidationError);
    });

    it('should validate entity ID', async () => {
      await expect(
        deletePriceConfiguration('TEMPLE', '')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('listPricesSortedByAmount', () => {
    it('should list all prices sorted by amount using GSI1', async () => {
      const mockItems = [
        {
          PK: 'PRICE#TEMPLE#temple-1',
          SK: 'CURRENT',
          entityId: 'temple-1',
          entityType: 'TEMPLE',
          priceAmount: 50,
          currency: 'INR',
          isFree: false,
          effectiveDate: '2024-01-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1,
          GSI1PK: 'PRICES',
          GSI1SK: 'AMOUNT#0000000050#ENTITY#temple-1',
        },
        {
          PK: 'PRICE#TEMPLE#temple-2',
          SK: 'CURRENT',
          entityId: 'temple-2',
          entityType: 'TEMPLE',
          priceAmount: 100,
          currency: 'INR',
          isFree: false,
          effectiveDate: '2024-01-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1,
          GSI1PK: 'PRICES',
          GSI1SK: 'AMOUNT#0000000100#ENTITY#temple-2',
        },
        {
          PK: 'PRICE#GROUP#group-1',
          SK: 'CURRENT',
          entityId: 'group-1',
          entityType: 'GROUP',
          priceAmount: 500,
          currency: 'INR',
          isFree: false,
          effectiveDate: '2024-01-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1,
          GSI1PK: 'PRICES',
          GSI1SK: 'AMOUNT#0000000500#ENTITY#group-1',
        },
      ];

      jest.spyOn(dynamodb, 'queryItems').mockResolvedValue(mockItems);

      const result = await listPricesSortedByAmount();

      expect(result).toHaveLength(3);
      expect(result[0].priceAmount).toBe(50);
      expect(result[1].priceAmount).toBe(100);
      expect(result[2].priceAmount).toBe(500);

      expect(dynamodb.queryItems).toHaveBeenCalledWith(
        expect.any(String),
        'GSI1PK = :pk',
        { ':pk': 'PRICES' },
        'GSI1'
      );
    });

    it('should return empty array when no prices exist', async () => {
      jest.spyOn(dynamodb, 'queryItems').mockResolvedValue([]);

      const result = await listPricesSortedByAmount();

      expect(result).toHaveLength(0);
    });
  });

  describe('getPriceHistory', () => {
    it('should retrieve price history for an entity', async () => {
      const mockHistoryItems = [
        {
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'HISTORY#2024-01-01T00:00:00.000Z',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 100,
          currency: 'INR',
          effectiveDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-02-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          GSI1PK: 'HISTORY#TEMPLE#temple-123',
          GSI1SK: 'DATE#2024-01-01T00:00:00.000Z',
        },
        {
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'HISTORY#2023-12-01T00:00:00.000Z',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 50,
          currency: 'INR',
          effectiveDate: '2023-12-01T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z',
          setBy: 'admin-456',
          isOverride: false,
          createdAt: '2023-12-01T00:00:00.000Z',
          GSI1PK: 'HISTORY#TEMPLE#temple-123',
          GSI1SK: 'DATE#2023-12-01T00:00:00.000Z',
        },
      ];

      jest.spyOn(dynamodb, 'queryItems').mockResolvedValue(mockHistoryItems);

      const result = await getPriceHistory('TEMPLE', 'temple-123');

      expect(result).toHaveLength(2);
      expect(result[0].priceAmount).toBe(100);
      expect(result[0].effectiveDate).toBe('2024-01-01T00:00:00.000Z');
      expect(result[0].endDate).toBe('2024-02-01T00:00:00.000Z');
      expect(result[1].priceAmount).toBe(50);

      expect(dynamodb.queryItems).toHaveBeenCalledWith(
        expect.any(String),
        'PK = :pk AND begins_with(SK, :skPrefix)',
        {
          ':pk': 'PRICE#TEMPLE#temple-123',
          ':skPrefix': 'HISTORY#',
        },
        undefined,
        false
      );
    });

    it('should filter price history by date range', async () => {
      const mockHistoryItems = [
        {
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'HISTORY#2024-01-15T00:00:00.000Z',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 150,
          currency: 'INR',
          effectiveDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-02-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-01-15T00:00:00.000Z',
          GSI1PK: 'HISTORY#TEMPLE#temple-123',
          GSI1SK: 'DATE#2024-01-15T00:00:00.000Z',
        },
      ];

      jest.spyOn(dynamodb, 'queryItems').mockResolvedValue(mockHistoryItems);

      const result = await getPriceHistory('TEMPLE', 'temple-123', {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      });

      expect(result).toHaveLength(1);
      expect(result[0].priceAmount).toBe(150);

      expect(dynamodb.queryItems).toHaveBeenCalledWith(
        expect.any(String),
        'GSI1PK = :pk AND GSI1SK BETWEEN :startDate AND :endDate',
        {
          ':pk': 'HISTORY#TEMPLE#temple-123',
          ':startDate': 'DATE#2024-01-01T00:00:00.000Z',
          ':endDate': 'DATE#2024-01-31T23:59:59.999Z',
        },
        'GSI1',
        false
      );
    });

    it('should filter price history with only start date', async () => {
      const mockHistoryItems = [
        {
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'HISTORY#2024-02-01T00:00:00.000Z',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 200,
          currency: 'INR',
          effectiveDate: '2024-02-01T00:00:00.000Z',
          endDate: '2024-03-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-02-01T00:00:00.000Z',
          GSI1PK: 'HISTORY#TEMPLE#temple-123',
          GSI1SK: 'DATE#2024-02-01T00:00:00.000Z',
        },
      ];

      jest.spyOn(dynamodb, 'queryItems').mockResolvedValue(mockHistoryItems);

      const result = await getPriceHistory('TEMPLE', 'temple-123', {
        startDate: '2024-02-01T00:00:00.000Z',
      });

      expect(result).toHaveLength(1);
      expect(result[0].priceAmount).toBe(200);

      expect(dynamodb.queryItems).toHaveBeenCalledWith(
        expect.any(String),
        'GSI1PK = :pk AND GSI1SK >= :startDate',
        {
          ':pk': 'HISTORY#TEMPLE#temple-123',
          ':startDate': 'DATE#2024-02-01T00:00:00.000Z',
        },
        'GSI1',
        false
      );
    });

    it('should filter price history with only end date', async () => {
      const mockHistoryItems = [
        {
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'HISTORY#2023-12-01T00:00:00.000Z',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 50,
          currency: 'INR',
          effectiveDate: '2023-12-01T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z',
          setBy: 'admin-456',
          isOverride: false,
          createdAt: '2023-12-01T00:00:00.000Z',
          GSI1PK: 'HISTORY#TEMPLE#temple-123',
          GSI1SK: 'DATE#2023-12-01T00:00:00.000Z',
        },
      ];

      jest.spyOn(dynamodb, 'queryItems').mockResolvedValue(mockHistoryItems);

      const result = await getPriceHistory('TEMPLE', 'temple-123', {
        endDate: '2023-12-31T23:59:59.999Z',
      });

      expect(result).toHaveLength(1);
      expect(result[0].priceAmount).toBe(50);

      expect(dynamodb.queryItems).toHaveBeenCalledWith(
        expect.any(String),
        'GSI1PK = :pk AND GSI1SK <= :endDate',
        {
          ':pk': 'HISTORY#TEMPLE#temple-123',
          ':endDate': 'DATE#2023-12-31T23:59:59.999Z',
        },
        'GSI1',
        false
      );
    });

    it('should apply limit to price history results', async () => {
      const mockHistoryItems = [
        {
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'HISTORY#2024-03-01T00:00:00.000Z',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 300,
          currency: 'INR',
          effectiveDate: '2024-03-01T00:00:00.000Z',
          endDate: '2024-04-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-03-01T00:00:00.000Z',
          GSI1PK: 'HISTORY#TEMPLE#temple-123',
          GSI1SK: 'DATE#2024-03-01T00:00:00.000Z',
        },
        {
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'HISTORY#2024-02-01T00:00:00.000Z',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 200,
          currency: 'INR',
          effectiveDate: '2024-02-01T00:00:00.000Z',
          endDate: '2024-03-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-02-01T00:00:00.000Z',
          GSI1PK: 'HISTORY#TEMPLE#temple-123',
          GSI1SK: 'DATE#2024-02-01T00:00:00.000Z',
        },
        {
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'HISTORY#2024-01-01T00:00:00.000Z',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 100,
          currency: 'INR',
          effectiveDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-02-01T00:00:00.000Z',
          setBy: 'admin-123',
          isOverride: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          GSI1PK: 'HISTORY#TEMPLE#temple-123',
          GSI1SK: 'DATE#2024-01-01T00:00:00.000Z',
        },
      ];

      jest.spyOn(dynamodb, 'queryItems').mockResolvedValue(mockHistoryItems);

      const result = await getPriceHistory('TEMPLE', 'temple-123', { limit: 2 });

      expect(result).toHaveLength(2);
      expect(result[0].priceAmount).toBe(300);
      expect(result[1].priceAmount).toBe(200);
    });

    it('should return empty array when no history exists', async () => {
      jest.spyOn(dynamodb, 'queryItems').mockResolvedValue([]);

      const result = await getPriceHistory('TEMPLE', 'temple-123');

      expect(result).toHaveLength(0);
    });

    it('should validate entity type', async () => {
      await expect(
        getPriceHistory('INVALID' as EntityType, 'temple-123')
      ).rejects.toThrow(ValidationError);
    });

    it('should validate entity ID', async () => {
      await expect(
        getPriceHistory('TEMPLE', '')
      ).rejects.toThrow(ValidationError);
    });

    it('should include override information in history', async () => {
      const mockHistoryItems = [
        {
          PK: 'PRICE#TEMPLE#temple-123',
          SK: 'HISTORY#2024-01-01T00:00:00.000Z',
          entityId: 'temple-123',
          entityType: 'TEMPLE',
          priceAmount: 100,
          currency: 'INR',
          effectiveDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-02-01T00:00:00.000Z',
          setBy: 'admin-123',
          suggestedPrice: 150,
          isOverride: true,
          overrideReason: 'Promotional pricing',
          createdAt: '2024-01-01T00:00:00.000Z',
          GSI1PK: 'HISTORY#TEMPLE#temple-123',
          GSI1SK: 'DATE#2024-01-01T00:00:00.000Z',
        },
      ];

      jest.spyOn(dynamodb, 'queryItems').mockResolvedValue(mockHistoryItems);

      const result = await getPriceHistory('TEMPLE', 'temple-123');

      expect(result).toHaveLength(1);
      expect(result[0].isOverride).toBe(true);
      expect(result[0].suggestedPrice).toBe(150);
      expect(result[0].overrideReason).toBe('Promotional pricing');
    });
  });

  describe('setPriceConfiguration with history tracking', () => {
    it('should create price history entry when updating existing price', async () => {
      const existingConfig = {
        entityId: 'temple-123',
        entityType: 'TEMPLE' as EntityType,
        priceAmount: 100,
        currency: 'INR',
        isFree: false,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        setBy: 'admin-123',
        isOverride: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
      };

      jest.spyOn(redisCache.default, 'get').mockResolvedValue(existingConfig);
      jest.spyOn(dynamodb, 'getItem').mockResolvedValue(null);
      jest.spyOn(dynamodb, 'putItem').mockResolvedValue(undefined);

      const request: PriceConfigRequest = {
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 150,
      };

      await setPriceConfiguration(request, 'admin-456');

      // Verify that putItem was called twice: once for history, once for current
      expect(dynamodb.putItem).toHaveBeenCalledTimes(2);

      // First call should be for price history
      const historyCall = (dynamodb.putItem as jest.Mock).mock.calls[0];
      expect(historyCall[0]).toBe('PriceHistory');
      const historyItem = historyCall[1] as any;
      expect(historyItem).toMatchObject({
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 100,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        setBy: 'admin-123',
      });
      expect(historyItem.endDate).toBeDefined();
      expect(historyItem.SK).toContain('HISTORY#');
      expect(historyItem.GSI1PK).toBe('HISTORY#TEMPLE#temple-123');
      expect(historyItem.GSI1SK).toContain('DATE#');

      // Second call should be for current price
      const currentCall = (dynamodb.putItem as jest.Mock).mock.calls[1];
      expect(currentCall[0]).toBe('PriceConfigurations');
      expect(currentCall[1]).toMatchObject({
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 150,
        setBy: 'admin-456',
        SK: 'CURRENT',
      });
    });

    it('should not create history entry for first price configuration', async () => {
      jest.spyOn(redisCache.default, 'get').mockResolvedValue(null);
      jest.spyOn(dynamodb, 'getItem').mockResolvedValue(null);
      jest.spyOn(dynamodb, 'putItem').mockResolvedValue(undefined);

      const request: PriceConfigRequest = {
        entityId: 'temple-new',
        entityType: 'TEMPLE',
        priceAmount: 100,
      };

      await setPriceConfiguration(request, 'admin-123');

      // Verify that putItem was called only once (for current price, not history)
      expect(dynamodb.putItem).toHaveBeenCalledTimes(1);
      const currentItem = (dynamodb.putItem as jest.Mock).mock.calls[0][1] as any;
      expect(currentItem.SK).toBe('CURRENT');
    });

    it('should increment version when updating price', async () => {
      const existingConfig = {
        entityId: 'temple-123',
        entityType: 'TEMPLE' as EntityType,
        priceAmount: 100,
        currency: 'INR',
        isFree: false,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        setBy: 'admin-123',
        isOverride: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
      };

      jest.spyOn(redisCache.default, 'get').mockResolvedValue(existingConfig);
      jest.spyOn(dynamodb, 'putItem').mockResolvedValue(undefined);

      const request: PriceConfigRequest = {
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 150,
      };

      const result = await setPriceConfiguration(request, 'admin-456');

      expect(result.version).toBe(2);
    });

    it('should preserve createdAt when updating price', async () => {
      const existingConfig = {
        entityId: 'temple-123',
        entityType: 'TEMPLE' as EntityType,
        priceAmount: 100,
        currency: 'INR',
        isFree: false,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        setBy: 'admin-123',
        isOverride: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
      };

      jest.spyOn(redisCache.default, 'get').mockResolvedValue(existingConfig);
      jest.spyOn(dynamodb, 'putItem').mockResolvedValue(undefined);

      const request: PriceConfigRequest = {
        entityId: 'temple-123',
        entityType: 'TEMPLE',
        priceAmount: 150,
      };

      const result = await setPriceConfiguration(request, 'admin-456');

      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.updatedAt).not.toBe('2024-01-01T00:00:00.000Z');
    });
  });
});
