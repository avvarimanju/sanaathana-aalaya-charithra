/**
 * Pricing Service
 * 
 * Manages price configurations for temples and temple groups
 */

import {
  PriceConfiguration,
  PriceConfigRequest,
  EntityType,
  PriceHistory,
  HistoryFilters,
} from '../../types';
import {
  putItem,
  getItem,
  deleteItem,
  generateTimestamp,
  generatePK,
  generateSK,
  queryItems,
} from '../../utils/dynamodb';
import {
  validatePriceAmount,
  validateRequiredString,
  validateEntityType,
  combineValidationResults,
  throwIfInvalid,
} from '../../utils/validators';
import { NotFoundError, ValidationError } from '../../utils/errors';
import config from '../../config';
import logger from '../../utils/logger';
import redisCache from '../../utils/redis';

/**
 * Set or update price configuration for an entity
 */
export async function setPriceConfiguration(
  request: PriceConfigRequest,
  adminUserId: string
): Promise<PriceConfiguration> {
  logger.info('Setting price configuration', { request, adminUserId });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(request.entityId, 'entityId'),
    validateEntityType(request.entityType),
    validatePriceAmount(request.priceAmount)
  );
  throwIfInvalid(validationResult);

  const now = generateTimestamp();
  const isFree = request.priceAmount === 0;

  // Check if there's an existing price configuration to archive
  const existingConfig = await getPriceConfiguration(request.entityType, request.entityId);
  
  if (existingConfig) {
    // Create price history entry for the old price
    await createPriceHistoryEntry(existingConfig, now);
  }

  // Create price configuration object
  const priceConfig: PriceConfiguration = {
    entityId: request.entityId,
    entityType: request.entityType,
    priceAmount: request.priceAmount,
    currency: config.pricing.currency,
    isFree,
    effectiveDate: now,
    setBy: adminUserId,
    isOverride: false, // Will be set by price calculator if needed
    overrideReason: request.overrideReason,
    createdAt: existingConfig?.createdAt || now,
    updatedAt: now,
    version: (existingConfig?.version || 0) + 1,
  };

  // Store in DynamoDB
  const pk = generatePK(`PRICE#${request.entityType}`, request.entityId);
  const sk = generateSK('CURRENT');

  await putItem(config.tables.priceConfigs, {
    PK: pk,
    SK: sk,
    entityId: priceConfig.entityId,
    entityType: priceConfig.entityType,
    priceAmount: priceConfig.priceAmount,
    currency: priceConfig.currency,
    isFree: priceConfig.isFree,
    effectiveDate: priceConfig.effectiveDate,
    setBy: priceConfig.setBy,
    suggestedPrice: priceConfig.suggestedPrice,
    isOverride: priceConfig.isOverride,
    overrideReason: priceConfig.overrideReason,
    createdAt: priceConfig.createdAt,
    updatedAt: priceConfig.updatedAt,
    version: priceConfig.version,
    // GSI1 for listing prices sorted by amount
    GSI1PK: 'PRICES',
    GSI1SK: `AMOUNT#${String(request.priceAmount).padStart(10, '0')}#ENTITY#${request.entityId}`,
  });

  // Invalidate cache
  const cacheKey = redisCache.generatePriceKey(request.entityType, request.entityId);
  await redisCache.del(cacheKey);

  logger.info('Price configuration set successfully', { entityId: request.entityId });

  return priceConfig;
}

/**
 * Get price configuration for an entity with caching
 */
export async function getPriceConfiguration(
  entityType: EntityType,
  entityId: string
): Promise<PriceConfiguration | null> {
  logger.info('Getting price configuration', { entityType, entityId });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(entityId, 'entityId'),
    validateEntityType(entityType)
  );
  throwIfInvalid(validationResult);

  // Check cache first
  const cacheKey = redisCache.generatePriceKey(entityType, entityId);
  const cached = await redisCache.get<PriceConfiguration>(cacheKey);
  if (cached) {
    logger.info('Price configuration found in cache', { entityId });
    return cached;
  }

  // Query DynamoDB
  const pk = generatePK(`PRICE#${entityType}`, entityId);
  const sk = generateSK('CURRENT');

  const item = await getItem<any>(config.tables.priceConfigs, { PK: pk, SK: sk });

  if (!item) {
    logger.info('Price configuration not found', { entityType, entityId });
    return null;
  }

  // Map to PriceConfiguration
  const priceConfig: PriceConfiguration = {
    entityId: item.entityId,
    entityType: item.entityType,
    priceAmount: item.priceAmount,
    currency: item.currency,
    isFree: item.isFree,
    effectiveDate: item.effectiveDate,
    setBy: item.setBy,
    suggestedPrice: item.suggestedPrice,
    isOverride: item.isOverride,
    overrideReason: item.overrideReason,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    version: item.version,
  };

  // Cache the result
  await redisCache.set(cacheKey, priceConfig, config.redis.ttl.priceCache);

  logger.info('Price configuration retrieved', { entityId });

  return priceConfig;
}

/**
 * Get price configurations for multiple entities (batch retrieval)
 */
export async function getBatchPriceConfigurations(
  entities: Array<{ entityType: EntityType; entityId: string }>
): Promise<PriceConfiguration[]> {
  // Validate input
  if (!Array.isArray(entities) || entities.length === 0) {
    throw new ValidationError('Entities array is required and must not be empty');
  }

  logger.info('Getting batch price configurations', { count: entities.length });

  // Fetch all price configurations
  const results = await Promise.all(
    entities.map(async (entity) => {
      try {
        return await getPriceConfiguration(entity.entityType, entity.entityId);
      } catch (error) {
        logger.error('Error fetching price configuration', error as Error, { entity });
        return null;
      }
    })
  );

  // Filter out nulls
  const priceConfigs = results.filter((config): config is PriceConfiguration => config !== null);

  logger.info('Batch price configurations retrieved', { 
    requested: entities.length, 
    found: priceConfigs.length 
  });

  return priceConfigs;
}

/**
 * Delete price configuration for an entity
 */
export async function deletePriceConfiguration(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  logger.info('Deleting price configuration', { entityType, entityId });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(entityId, 'entityId'),
    validateEntityType(entityType)
  );
  throwIfInvalid(validationResult);

  // Check if price configuration exists
  const existing = await getPriceConfiguration(entityType, entityId);
  if (!existing) {
    throw new NotFoundError('PriceConfiguration', entityId);
  }

  // Delete from DynamoDB
  const pk = generatePK(`PRICE#${entityType}`, entityId);
  const sk = generateSK('CURRENT');

  await deleteItem(config.tables.priceConfigs, { PK: pk, SK: sk });

  // Invalidate cache
  const cacheKey = redisCache.generatePriceKey(entityType, entityId);
  await redisCache.del(cacheKey);

  logger.info('Price configuration deleted successfully', { entityId });
}

/**
 * List all price configurations sorted by amount (using GSI1)
 */
export async function listPricesSortedByAmount(): Promise<PriceConfiguration[]> {
  logger.info('Listing prices sorted by amount');

  const items = await queryItems<any>(
    config.tables.priceConfigs,
    'GSI1PK = :pk',
    { ':pk': 'PRICES' },
    'GSI1'
  );

  const priceConfigs = items.map((item) => ({
    entityId: item.entityId,
    entityType: item.entityType,
    priceAmount: item.priceAmount,
    currency: item.currency,
    isFree: item.isFree,
    effectiveDate: item.effectiveDate,
    setBy: item.setBy,
    suggestedPrice: item.suggestedPrice,
    isOverride: item.isOverride,
    overrideReason: item.overrideReason,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    version: item.version,
  }));

  logger.info('Prices listed', { count: priceConfigs.length });

  return priceConfigs;
}

/**
 * Create a price history entry for an old price configuration
 * @internal
 */
async function createPriceHistoryEntry(
  oldConfig: PriceConfiguration,
  endDate: string
): Promise<void> {
  logger.info('Creating price history entry', { 
    entityId: oldConfig.entityId, 
    entityType: oldConfig.entityType 
  });

  const pk = generatePK(`PRICE#${oldConfig.entityType}`, oldConfig.entityId);
  const sk = generateSK(`HISTORY#${oldConfig.effectiveDate}`);

  const historyEntry = {
    PK: pk,
    SK: sk,
    entityId: oldConfig.entityId,
    entityType: oldConfig.entityType,
    priceAmount: oldConfig.priceAmount,
    currency: oldConfig.currency,
    effectiveDate: oldConfig.effectiveDate,
    endDate: endDate,
    setBy: oldConfig.setBy,
    suggestedPrice: oldConfig.suggestedPrice,
    isOverride: oldConfig.isOverride,
    overrideReason: oldConfig.overrideReason,
    createdAt: oldConfig.createdAt,
    // GSI1 for date range queries
    GSI1PK: `HISTORY#${oldConfig.entityType}#${oldConfig.entityId}`,
    GSI1SK: `DATE#${oldConfig.effectiveDate}`,
  };

  await putItem(config.tables.priceHistory, historyEntry);

  logger.info('Price history entry created', { entityId: oldConfig.entityId });
}

/**
 * Get price history for an entity with optional date range filtering
 */
export async function getPriceHistory(
  entityType: EntityType,
  entityId: string,
  filters?: HistoryFilters
): Promise<PriceHistory[]> {
  logger.info('Getting price history', { entityType, entityId, filters });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(entityId, 'entityId'),
    validateEntityType(entityType)
  );
  throwIfInvalid(validationResult);

  // Build query based on filters
  let items: any[];
  
  if (filters?.startDate || filters?.endDate) {
    // Use GSI1 for date range queries
    const gsi1PK = `HISTORY#${entityType}#${entityId}`;
    
    let keyConditionExpression = 'GSI1PK = :pk';
    const expressionAttributeValues: Record<string, any> = {
      ':pk': gsi1PK,
    };

    if (filters.startDate && filters.endDate) {
      keyConditionExpression += ' AND GSI1SK BETWEEN :startDate AND :endDate';
      expressionAttributeValues[':startDate'] = `DATE#${filters.startDate}`;
      expressionAttributeValues[':endDate'] = `DATE#${filters.endDate}`;
    } else if (filters.startDate) {
      keyConditionExpression += ' AND GSI1SK >= :startDate';
      expressionAttributeValues[':startDate'] = `DATE#${filters.startDate}`;
    } else if (filters.endDate) {
      keyConditionExpression += ' AND GSI1SK <= :endDate';
      expressionAttributeValues[':endDate'] = `DATE#${filters.endDate}`;
    }

    items = await queryItems<any>(
      config.tables.priceHistory,
      keyConditionExpression,
      expressionAttributeValues,
      'GSI1',
      false // Don't scan forward - we want most recent first
    );
  } else {
    // Query all history for this entity
    const pk = generatePK(`PRICE#${entityType}`, entityId);
    
    items = await queryItems<any>(
      config.tables.priceHistory,
      'PK = :pk AND begins_with(SK, :skPrefix)',
      {
        ':pk': pk,
        ':skPrefix': 'HISTORY#',
      },
      undefined,
      false // Don't scan forward - we want most recent first
    );
  }

  // Apply limit if specified
  if (filters?.limit && filters.limit > 0) {
    items = items.slice(0, filters.limit);
  }

  // Map to PriceHistory objects
  const history: PriceHistory[] = items.map((item) => ({
    entityId: item.entityId,
    entityType: item.entityType,
    priceAmount: item.priceAmount,
    currency: item.currency,
    effectiveDate: item.effectiveDate,
    endDate: item.endDate,
    setBy: item.setBy,
    suggestedPrice: item.suggestedPrice,
    isOverride: item.isOverride,
    overrideReason: item.overrideReason,
    createdAt: item.createdAt,
  }));

  logger.info('Price history retrieved', { 
    entityId, 
    count: history.length 
  });

  return history;
}
