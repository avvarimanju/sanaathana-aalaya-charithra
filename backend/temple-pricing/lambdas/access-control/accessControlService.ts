/**
 * Access Control Service
 * 
 * Manages access grants and verification for temples and temple groups
 */

import {
  AccessGrant,
  AccessGrantRequest,
  EntityType,
  GrantStatus,
  AccessMode,
} from '../../types';
import {
  putItem,
  getItem,
  queryItems,
  updateItem,
  generateTimestamp,
  generatePK,
  generateSK,
} from '../../utils/dynamodb';
import {
  validateRequiredString,
  validateEntityType,
  validatePriceAmount,
  combineValidationResults,
  throwIfInvalid,
} from '../../utils/validators';
import { NotFoundError, ValidationError } from '../../utils/errors';
import config from '../../config';
import logger from '../../utils/logger';
import redisCache from '../../utils/redis';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create an access grant after successful payment
 */
export async function createAccessGrant(
  request: AccessGrantRequest
): Promise<AccessGrant> {
  logger.info('Creating access grant', { request });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(request.userId, 'userId'),
    validateRequiredString(request.entityId, 'entityId'),
    validateEntityType(request.entityType),
    validateRequiredString(request.paymentId, 'paymentId'),
    validatePriceAmount(request.paidAmount)
  );
  throwIfInvalid(validationResult);

  // Validate payment amount matches current price
  const isValidPayment = await validatePaymentAmount(
    request.entityType,
    request.entityId,
    request.paidAmount
  );

  if (!isValidPayment) {
    throw new ValidationError(
      `Payment amount ${request.paidAmount} does not match current price for ${request.entityType} ${request.entityId}`
    );
  }

  // Get entity access mode to determine offline download permission
  const accessMode = await getEntityAccessMode(request.entityType, request.entityId);
  const offlineDownloadPermission = 
    accessMode === 'OFFLINE_DOWNLOAD' || accessMode === 'HYBRID';

  const now = generateTimestamp();
  const grantId = uuidv4();

  // Create access grant object
  const accessGrant: AccessGrant = {
    grantId,
    userId: request.userId,
    entityId: request.entityId,
    entityType: request.entityType,
    paymentId: request.paymentId,
    paidAmount: request.paidAmount,
    currency: config.pricing.currency,
    grantedAt: now,
    status: 'active',
    accessMode,
    offlineDownloadPermission,
  };

  // Store in DynamoDB
  const pk = generatePK('USER', request.userId);
  const sk = generateSK(`GRANT#${request.entityType}`, request.entityId);

  await putItem(config.tables.accessGrants, {
    PK: pk,
    SK: sk,
    grantId: accessGrant.grantId,
    userId: accessGrant.userId,
    entityId: accessGrant.entityId,
    entityType: accessGrant.entityType,
    paymentId: accessGrant.paymentId,
    paidAmount: accessGrant.paidAmount,
    currency: accessGrant.currency,
    grantedAt: accessGrant.grantedAt,
    expiresAt: accessGrant.expiresAt,
    status: accessGrant.status,
    accessMode: accessGrant.accessMode,
    offlineDownloadPermission: accessGrant.offlineDownloadPermission,
    // GSI1 for entity-to-user lookup
    GSI1PK: generatePK(`GRANT#${request.entityType}`, request.entityId),
    GSI1SK: generatePK('USER', request.userId),
  });

  logger.info('Access grant created successfully', { 
    grantId, 
    userId: request.userId,
    entityId: request.entityId 
  });

  return accessGrant;
}

/**
 * Get all access grants for a user
 */
export async function getUserAccessGrants(
  userId: string
): Promise<AccessGrant[]> {
  logger.info('Getting user access grants', { userId });

  // Validate input
  const validationResult = validateRequiredString(userId, 'userId');
  throwIfInvalid(validationResult);

  // Query DynamoDB
  const pk = generatePK('USER', userId);

  const items = await queryItems<any>(
    config.tables.accessGrants,
    'PK = :pk AND begins_with(SK, :skPrefix)',
    {
      ':pk': pk,
      ':skPrefix': 'GRANT#',
    }
  );

  // Map to AccessGrant objects
  const grants: AccessGrant[] = items.map((item) => ({
    grantId: item.grantId,
    userId: item.userId,
    entityId: item.entityId,
    entityType: item.entityType,
    paymentId: item.paymentId,
    paidAmount: item.paidAmount,
    currency: item.currency,
    grantedAt: item.grantedAt,
    expiresAt: item.expiresAt,
    status: item.status,
    accessMode: item.accessMode,
    offlineDownloadPermission: item.offlineDownloadPermission,
  }));

  logger.info('User access grants retrieved', { 
    userId, 
    count: grants.length 
  });

  return grants;
}

/**
 * Revoke an access grant
 */
export async function revokeAccessGrant(
  userId: string,
  entityType: EntityType,
  entityId: string
): Promise<void> {
  logger.info('Revoking access grant', { userId, entityType, entityId });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(userId, 'userId'),
    validateRequiredString(entityId, 'entityId'),
    validateEntityType(entityType)
  );
  throwIfInvalid(validationResult);

  // Check if grant exists
  const pk = generatePK('USER', userId);
  const sk = generateSK(`GRANT#${entityType}`, entityId);

  const existing = await getItem<any>(config.tables.accessGrants, { PK: pk, SK: sk });
  
  if (!existing) {
    throw new NotFoundError('AccessGrant', `${userId}:${entityType}:${entityId}`);
  }

  // Update status to revoked
  await updateItem(
    config.tables.accessGrants,
    { PK: pk, SK: sk },
    'SET #status = :status',
    {
      ':status': 'revoked' as GrantStatus,
    },
    {
      '#status': 'status',
    }
  );

  // Invalidate cache for this user's access
  await redisCache.delPattern(`access:${userId}:*`);

  logger.info('Access grant revoked successfully', { userId, entityId });
}

/**
 * Validate payment amount matches current price (±1 rupee tolerance)
 */
export async function validatePaymentAmount(
  entityType: EntityType,
  entityId: string,
  paidAmount: number
): Promise<boolean> {
  logger.info('Validating payment amount', { entityType, entityId, paidAmount });

  // Import pricing service to get current price
  const { getPriceConfiguration } = await import('../pricing-service/pricingService');
  
  const priceConfig = await getPriceConfiguration(entityType, entityId);

  // If no price configuration, treat as free (payment should be 0)
  if (!priceConfig) {
    const isValid = paidAmount === 0;
    logger.info('No price configuration found, validating as free', { 
      paidAmount, 
      isValid 
    });
    return isValid;
  }

  // If price is free, payment should be 0
  if (priceConfig.isFree) {
    const isValid = paidAmount === 0;
    logger.info('Price is free, validating payment is 0', { 
      paidAmount, 
      isValid 
    });
    return isValid;
  }

  // Check if payment amount matches price (±1 rupee tolerance for rounding)
  const difference = Math.abs(paidAmount - priceConfig.priceAmount);
  const isValid = difference <= 1;

  if (!isValid) {
    logger.error('Payment amount mismatch', undefined, {
      entityType,
      entityId,
      expectedPrice: priceConfig.priceAmount,
      paidAmount,
      difference,
    });
  }

  logger.info('Payment amount validated', { 
    expectedPrice: priceConfig.priceAmount,
    paidAmount,
    difference,
    isValid 
  });

  return isValid;
}

/**
 * Verify if a user has access to a specific QR code
 */
export async function verifyAccess(
  userId: string,
  qrCodeId: string
): Promise<{ hasAccess: boolean; grantId?: string; entityType?: EntityType; entityId?: string }> {
  logger.info('Verifying access', { userId, qrCodeId });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(userId, 'userId'),
    validateRequiredString(qrCodeId, 'qrCodeId')
  );
  throwIfInvalid(validationResult);

  // Check cache first
  const cacheKey = redisCache.generateAccessKey(userId, qrCodeId);
  const cached = await redisCache.get<{ hasAccess: boolean; grantId?: string; entityType?: EntityType; entityId?: string }>(cacheKey);
  if (cached !== null) {
    logger.info('Access verification found in cache', { userId, qrCodeId, hasAccess: cached.hasAccess });
    return cached;
  }

  // Get temple ID for this QR code
  const { templeId } = await getTempleForQRCode(qrCodeId);
  
  if (!templeId) {
    logger.info('QR code not found', { qrCodeId });
    const result = { hasAccess: false };
    await redisCache.set(cacheKey, result, config.redis.ttl.accessCache);
    return result;
  }

  // Get all user's access grants
  const grants = await getUserAccessGrants(userId);

  // Check for direct temple access
  const templeGrant = grants.find(
    (g) => g.entityType === 'TEMPLE' && g.entityId === templeId && g.status === 'active'
  );

  if (templeGrant) {
    logger.info('User has direct temple access', { userId, templeId, grantId: templeGrant.grantId });
    const result = { 
      hasAccess: true, 
      grantId: templeGrant.grantId,
      entityType: 'TEMPLE' as EntityType,
      entityId: templeId
    };
    await redisCache.set(cacheKey, result, config.redis.ttl.accessCache);
    return result;
  }

  // Check for temple group access
  const groupGrants = grants.filter(
    (g) => g.entityType === 'GROUP' && g.status === 'active'
  );

  for (const groupGrant of groupGrants) {
    const hasGroupAccess = await isTempleInGroup(templeId, groupGrant.entityId);
    if (hasGroupAccess) {
      logger.info('User has temple group access', { 
        userId, 
        templeId, 
        groupId: groupGrant.entityId,
        grantId: groupGrant.grantId 
      });
      const result = { 
        hasAccess: true, 
        grantId: groupGrant.grantId,
        entityType: 'GROUP' as EntityType,
        entityId: groupGrant.entityId
      };
      await redisCache.set(cacheKey, result, config.redis.ttl.accessCache);
      return result;
    }
  }

  logger.info('User does not have access', { userId, qrCodeId, templeId });
  const result = { hasAccess: false };
  await redisCache.set(cacheKey, result, config.redis.ttl.accessCache);
  return result;
}

/**
 * Get all accessible QR codes for a user's access grant
 */
export async function getAccessibleQRCodes(
  userId: string,
  entityType: EntityType,
  entityId: string
): Promise<string[]> {
  logger.info('Getting accessible QR codes', { userId, entityType, entityId });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(userId, 'userId'),
    validateRequiredString(entityId, 'entityId'),
    validateEntityType(entityType)
  );
  throwIfInvalid(validationResult);

  // Verify user has an active grant for this entity
  const pk = generatePK('USER', userId);
  const sk = generateSK(`GRANT#${entityType}`, entityId);

  const grant = await getItem<any>(config.tables.accessGrants, { PK: pk, SK: sk });
  
  if (!grant || grant.status !== 'active') {
    logger.info('No active grant found', { userId, entityType, entityId });
    return [];
  }

  let qrCodeIds: string[] = [];

  if (entityType === 'TEMPLE') {
    // Get all QR codes for this temple
    qrCodeIds = await getQRCodesForTemple(entityId);
  } else if (entityType === 'GROUP') {
    // Get all temples in the group, then get all QR codes for each temple
    const templeIds = await getTemplesInGroup(entityId);
    
    const qrCodePromises = templeIds.map((templeId) => getQRCodesForTemple(templeId));
    const qrCodeArrays = await Promise.all(qrCodePromises);
    
    // Flatten the arrays
    qrCodeIds = qrCodeArrays.flat();
  }

  logger.info('Accessible QR codes retrieved', { 
    userId, 
    entityType, 
    entityId, 
    count: qrCodeIds.length 
  });

  return qrCodeIds;
}

/**
 * Verify if a user has offline download permission for an entity
 */
export async function verifyOfflineDownloadPermission(
  userId: string,
  entityId: string
): Promise<boolean> {
  logger.info('Verifying offline download permission', { userId, entityId });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(userId, 'userId'),
    validateRequiredString(entityId, 'entityId')
  );
  throwIfInvalid(validationResult);

  // Get all user's access grants
  const grants = await getUserAccessGrants(userId);

  // Check for direct entity access with offline download permission
  const directGrant = grants.find(
    (g) => g.entityId === entityId && g.status === 'active' && g.offlineDownloadPermission
  );

  if (directGrant) {
    logger.info('User has offline download permission (direct grant)', { 
      userId, 
      entityId,
      grantId: directGrant.grantId 
    });
    return true;
  }

  // If entityId is a temple, check if user has group access that includes this temple
  const groupGrants = grants.filter(
    (g) => g.entityType === 'GROUP' && g.status === 'active' && g.offlineDownloadPermission
  );

  for (const groupGrant of groupGrants) {
    const isInGroup = await isTempleInGroup(entityId, groupGrant.entityId);
    if (isInGroup) {
      logger.info('User has offline download permission (group grant)', { 
        userId, 
        entityId,
        groupId: groupGrant.entityId,
        grantId: groupGrant.grantId 
      });
      return true;
    }
  }

  logger.info('User does not have offline download permission', { userId, entityId });
  return false;
}

/**
 * Get temple ID for a QR code
 * @internal
 */
async function getTempleForQRCode(qrCodeId: string): Promise<{ templeId: string | null; artifactId: string | null }> {
  // Query Artifacts table using GSI1 (QR code lookup)
  const items = await queryItems<any>(
    config.tables.artifacts,
    'GSI1PK = :qrCodePK',
    {
      ':qrCodePK': generatePK('QRCODE', qrCodeId),
    },
    'GSI1'
  );

  if (items.length === 0) {
    return { templeId: null, artifactId: null };
  }

  const artifact = items[0];
  return { templeId: artifact.templeId, artifactId: artifact.artifactId };
}

/**
 * Check if a temple is in a temple group
 * @internal
 */
async function isTempleInGroup(templeId: string, groupId: string): Promise<boolean> {
  // Query TempleGroupAssociations table
  const pk = generatePK('GROUP', groupId);
  const sk = generateSK('TEMPLE', templeId);

  const association = await getItem<any>(config.tables.associations, { 
    PK: pk, 
    SK: sk 
  });

  return association !== null;
}

/**
 * Get all QR codes for a temple
 * @internal
 */
async function getQRCodesForTemple(templeId: string): Promise<string[]> {
  // Query Artifacts table for this temple
  const pk = generatePK('TEMPLE', templeId);

  const items = await queryItems<any>(
    config.tables.artifacts,
    'PK = :pk AND begins_with(SK, :skPrefix)',
    {
      ':pk': pk,
      ':skPrefix': 'ARTIFACT#',
    }
  );

  // Filter active artifacts and extract QR code IDs
  const qrCodeIds = items
    .filter((item) => item.status === 'active')
    .map((item) => item.qrCodeId);

  return qrCodeIds;
}

/**
 * Get all temples in a temple group
 * @internal
 */
async function getTemplesInGroup(groupId: string): Promise<string[]> {
  // Query TempleGroupAssociations table
  const pk = generatePK('GROUP', groupId);

  const items = await queryItems<any>(
    config.tables.associations,
    'PK = :pk AND begins_with(SK, :skPrefix)',
    {
      ':pk': pk,
      ':skPrefix': 'TEMPLE#',
    }
  );

  const templeIds = items.map((item) => item.templeId);

  return templeIds;
}

/**
 * Get entity access mode
 * @internal
 */
async function getEntityAccessMode(
  entityType: EntityType,
  entityId: string
): Promise<AccessMode> {
  if (entityType === 'TEMPLE') {
    // Get temple access mode
    const pk = generatePK('TEMPLE', entityId);
    const sk = generateSK('METADATA');

    const temple = await getItem<any>(config.tables.temples, { PK: pk, SK: sk });
    
    if (!temple) {
      throw new NotFoundError('Temple', entityId);
    }

    return temple.accessMode || 'HYBRID'; // Default to HYBRID
  } else if (entityType === 'GROUP') {
    // For groups, we need to check if any temple in the group has offline capability
    // If any temple has OFFLINE_DOWNLOAD or HYBRID, the group should allow offline downloads
    const templeIds = await getTemplesInGroup(entityId);
    
    for (const templeId of templeIds) {
      const pk = generatePK('TEMPLE', templeId);
      const sk = generateSK('METADATA');

      const temple = await getItem<any>(config.tables.temples, { PK: pk, SK: sk });
      
      if (temple && (temple.accessMode === 'OFFLINE_DOWNLOAD' || temple.accessMode === 'HYBRID')) {
        return 'HYBRID'; // Group supports offline if any temple does
      }
    }

    return 'QR_CODE_SCAN'; // Default if no temples support offline
  }

  return 'HYBRID'; // Default fallback
}
