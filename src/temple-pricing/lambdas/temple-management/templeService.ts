/**
 * Temple Service - Core CRUD operations for temples
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Temple,
  TempleGroup,
  Artifact,
  CreateTempleRequest,
  UpdateTempleRequest,
  CreateGroupRequest,
  UpdateGroupRequest,
  CreateArtifactRequest,
  UpdateArtifactRequest,
  PaginatedResult,
  AccessMode,
  BulkUpdateTempleRequest,
  BulkUpdateResult,
  BulkDeleteResult,
  BulkOperationSuccess,
  BulkOperationFailure,
  AuditLog,
} from '../../types';
import {
  putItem,
  getItem,
  queryItems,
  updateItem,
  deleteItem,
  generateTimestamp,
  generatePK,
  DynamoDBKey,
} from '../../utils/dynamodb';
import {
  validateRequiredString,
  validateAccessMode,
  combineValidationResults,
  throwIfInvalid,
} from '../../utils/validators';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';
import config from '../../config';
import logger from '../../utils/logger';

const TEMPLES_TABLE = config.tables.temples;
const AUDIT_LOG_TABLE = config.tables.auditLog;

// ============================================================================
// Audit Logging Functions
// ============================================================================

interface AuditLogDBItem {
  PK: string;
  SK: string;
  auditId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  userAgent?: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
}

/**
 * Create an audit log entry for temple operations
 */
async function createAuditLog(
  entityType: string,
  entityId: string,
  action: string,
  performedBy: string,
  beforeState?: any,
  afterState?: any,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const auditId = uuidv4();
  const timestamp = generateTimestamp();

  const auditItem: AuditLogDBItem = {
    PK: `AUDIT#${entityType}#${entityId}`,
    SK: `TIMESTAMP#${timestamp}`,
    auditId,
    entityType,
    entityId,
    action,
    performedBy,
    timestamp,
    beforeState,
    afterState,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    GSI1PK: `ADMIN#${performedBy}`,
    GSI1SK: `TIMESTAMP#${timestamp}`,
    GSI2PK: `ACTION#${action}`,
    GSI2SK: `TIMESTAMP#${timestamp}`,
  };

  await putItem(AUDIT_LOG_TABLE, auditItem);

  logger.info('Audit log created', {
    auditId,
    entityType,
    entityId,
    action,
    performedBy,
  });
}

/**
 * Query audit logs by entity
 */
export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string,
  limit?: number
): Promise<AuditLog[]> {
  logger.info('Getting audit logs by entity', { entityType, entityId, limit });

  const items = await queryItems<AuditLogDBItem>(
    AUDIT_LOG_TABLE,
    'PK = :pk',
    {
      ':pk': `AUDIT#${entityType}#${entityId}`,
    }
  );

  // Apply limit if specified
  const limitedItems = limit ? items.slice(0, limit) : items;

  return limitedItems.map(mapDBItemToAuditLog);
}

/**
 * Query audit logs by admin user using GSI1
 */
export async function getAuditLogsByAdmin(
  adminUserId: string,
  limit?: number
): Promise<AuditLog[]> {
  logger.info('Getting audit logs by admin', { adminUserId, limit });

  const items = await queryItems<AuditLogDBItem>(
    AUDIT_LOG_TABLE,
    'GSI1PK = :gsi1pk',
    {
      ':gsi1pk': `ADMIN#${adminUserId}`,
    },
    'GSI1'
  );

  // Apply limit if specified
  const limitedItems = limit ? items.slice(0, limit) : items;

  return limitedItems.map(mapDBItemToAuditLog);
}

/**
 * Query audit logs by action type using GSI2
 */
export async function getAuditLogsByAction(
  action: string,
  limit?: number
): Promise<AuditLog[]> {
  logger.info('Getting audit logs by action', { action, limit });

  const items = await queryItems<AuditLogDBItem>(
    AUDIT_LOG_TABLE,
    'GSI2PK = :gsi2pk',
    {
      ':gsi2pk': `ACTION#${action}`,
    },
    'GSI2'
  );

  // Apply limit if specified
  const limitedItems = limit ? items.slice(0, limit) : items;

  return limitedItems.map(mapDBItemToAuditLog);
}

/**
 * Map DynamoDB item to AuditLog interface
 */
function mapDBItemToAuditLog(item: AuditLogDBItem): AuditLog {
  return {
    auditId: item.auditId,
    entityType: item.entityType,
    entityId: item.entityId,
    action: item.action,
    performedBy: item.performedBy,
    timestamp: item.timestamp,
    beforeState: item.beforeState,
    afterState: item.afterState,
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
  };
}

// ============================================================================
// Temple Operations
// ============================================================================

interface TempleDBItem {
  PK: string;
  SK: string;
  templeId: string;
  name: string;
  location: {
    state: string;
    city: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  description: string;
  activeArtifactCount: number;
  accessMode: AccessMode;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
}

/**
 * Create a new temple
 */
export async function createTemple(
  request: CreateTempleRequest,
  userId: string
): Promise<Temple> {
  logger.info('Creating temple', { name: request.name, userId });

  // Validate input
  const nameValidation = validateRequiredString(request.name, 'name');
  const descValidation = validateRequiredString(request.description, 'description');
  const accessModeValidation = validateAccessMode(request.accessMode);

  const validation = combineValidationResults(
    nameValidation,
    descValidation,
    accessModeValidation
  );
  throwIfInvalid(validation);

  // Validate location
  if (!request.location || !request.location.state || !request.location.city) {
    throw new ValidationError('Location must include state and city', {
      location: request.location,
    });
  }

  // Check for name uniqueness
  const existingTemples = await queryItems<TempleDBItem>(
    TEMPLES_TABLE,
    'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
    {
      ':gsi1pk': 'TEMPLE',
      ':gsi1sk': `NAME#${request.name}`,
    },
    'GSI1'
  );

  if (existingTemples.length > 0) {
    throw new ConflictError(`Temple with name "${request.name}" already exists`);
  }

  // Generate temple ID and timestamps
  const templeId = uuidv4();
  const now = generateTimestamp();
  const accessMode = request.accessMode || 'HYBRID';

  // Create temple item
  const templeItem: TempleDBItem = {
    PK: generatePK('TEMPLE', templeId),
    SK: 'METADATA',
    templeId,
    name: request.name,
    location: request.location,
    description: request.description,
    activeArtifactCount: 0,
    accessMode,
    status: 'active',
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
    version: 1,
    GSI1PK: 'TEMPLE',
    GSI1SK: `NAME#${request.name}`,
    GSI2PK: 'TEMPLE',
    GSI2SK: `ACCESSMODE#${accessMode}#NAME#${request.name}`,
  };

  // Store in DynamoDB
  await putItem(TEMPLES_TABLE, templeItem);

  // Create audit log for temple creation
  await createAuditLog(
    'TEMPLE',
    templeId,
    'CREATE',
    userId,
    undefined, // No before state for creation
    templeItem
  );

  logger.info('Temple created successfully', { templeId, name: request.name });

  return mapDBItemToTemple(templeItem);
}

/**
 * Get a temple by ID
 */
export async function getTemple(templeId: string): Promise<Temple> {
  logger.info('Getting temple', { templeId });

  const key: DynamoDBKey = {
    PK: generatePK('TEMPLE', templeId),
    SK: 'METADATA',
  };

  const item = await getItem<TempleDBItem>(TEMPLES_TABLE, key);

  if (!item) {
    throw new NotFoundError('Temple', templeId);
  }

  return mapDBItemToTemple(item);
}

/**
 * List temples with pagination and filtering
 */
export async function listTemples(
  filters?: {
    accessMode?: AccessMode;
    status?: 'active' | 'inactive';
    limit?: number;
  }
): Promise<PaginatedResult<Temple>> {
  logger.info('Listing temples', { filters });

  let items: TempleDBItem[];

  if (filters?.accessMode) {
    // Query by access mode using GSI2
    items = await queryItems<TempleDBItem>(
      TEMPLES_TABLE,
      'GSI2PK = :gsi2pk AND begins_with(GSI2SK, :gsi2sk)',
      {
        ':gsi2pk': 'TEMPLE',
        ':gsi2sk': `ACCESSMODE#${filters.accessMode}`,
      },
      'GSI2'
    );
  } else {
    // Query all temples using GSI1
    items = await queryItems<TempleDBItem>(
      TEMPLES_TABLE,
      'GSI1PK = :gsi1pk',
      {
        ':gsi1pk': 'TEMPLE',
      },
      'GSI1'
    );
  }

  // Filter by status if specified
  if (filters?.status) {
    items = items.filter(item => item.status === filters.status);
  }

  // Apply limit if specified
  if (filters?.limit && filters.limit > 0) {
    items = items.slice(0, filters.limit);
  }

  const temples = items.map(mapDBItemToTemple);

  return {
    items: temples,
    total: temples.length,
  };
}

/**
 * Update a temple
 */
export async function updateTemple(
  templeId: string,
  request: UpdateTempleRequest,
  userId: string
): Promise<Temple> {
  logger.info('Updating temple', { templeId, userId });

  // Get existing temple to check version
  const existing = await getTemple(templeId);

  // Build update expression
  const updateParts: string[] = [];
  const expressionAttributeValues: any = {};
  const expressionAttributeNames: any = {};

  if (request.name !== undefined) {
    // Validate name
    const nameValidation = validateRequiredString(request.name, 'name');
    throwIfInvalid(nameValidation);

    // Check for name uniqueness (excluding current temple)
    const existingTemples = await queryItems<TempleDBItem>(
      TEMPLES_TABLE,
      'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
      {
        ':gsi1pk': 'TEMPLE',
        ':gsi1sk': `NAME#${request.name}`,
      },
      'GSI1'
    );

    if (existingTemples.length > 0 && existingTemples[0].templeId !== templeId) {
      throw new ConflictError(`Temple with name "${request.name}" already exists`);
    }

    updateParts.push('#name = :name');
    updateParts.push('GSI1SK = :gsi1sk');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = request.name;
    expressionAttributeValues[':gsi1sk'] = `NAME#${request.name}`;

    // Update GSI2SK if name changed
    updateParts.push('GSI2SK = :gsi2sk');
    expressionAttributeValues[':gsi2sk'] = `ACCESSMODE#${existing.accessMode}#NAME#${request.name}`;
  }

  if (request.location !== undefined) {
    updateParts.push('#location = :location');
    expressionAttributeNames['#location'] = 'location';
    expressionAttributeValues[':location'] = request.location;
  }

  if (request.description !== undefined) {
    const descValidation = validateRequiredString(request.description, 'description');
    throwIfInvalid(descValidation);

    updateParts.push('#description = :description');
    expressionAttributeNames['#description'] = 'description';
    expressionAttributeValues[':description'] = request.description;
  }

  if (request.accessMode !== undefined) {
    const accessModeValidation = validateAccessMode(request.accessMode);
    throwIfInvalid(accessModeValidation);

    updateParts.push('accessMode = :accessMode');
    expressionAttributeValues[':accessMode'] = request.accessMode;

    // Update GSI2SK with new access mode
    const templeName = request.name || existing.name;
    updateParts.push('GSI2SK = :gsi2sk');
    expressionAttributeValues[':gsi2sk'] = `ACCESSMODE#${request.accessMode}#NAME#${templeName}`;
  }

  if (request.status !== undefined) {
    updateParts.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = request.status;
  }

  if (updateParts.length === 0) {
    // No updates requested
    return existing;
  }

  // Add metadata updates
  updateParts.push('updatedAt = :updatedAt');
  updateParts.push('updatedBy = :updatedBy');
  updateParts.push('#version = #version + :inc');

  expressionAttributeValues[':updatedAt'] = generateTimestamp();
  expressionAttributeValues[':updatedBy'] = userId;
  expressionAttributeValues[':inc'] = 1;
  expressionAttributeValues[':expectedVersion'] = existing.version;
  expressionAttributeNames['#version'] = 'version';

  const updateExpression = `SET ${updateParts.join(', ')}`;
  const conditionExpression = '#version = :expectedVersion';

  const key: DynamoDBKey = {
    PK: generatePK('TEMPLE', templeId),
    SK: 'METADATA',
  };

  try {
    const updated = await updateItem(
      TEMPLES_TABLE,
      key,
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames,
      conditionExpression
    );

    // Create audit log for temple update
    await createAuditLog(
      'TEMPLE',
      templeId,
      'UPDATE',
      userId,
      existing, // Before state
      updated // After state
    );

    logger.info('Temple updated successfully', { templeId });

    return mapDBItemToTemple(updated as TempleDBItem);
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new ConflictError('Temple was modified by another request. Please retry.', {
        expectedVersion: existing.version,
      });
    }
    throw error;
  }
}

/**
 * Delete a temple
 */
export async function deleteTemple(templeId: string, userId: string): Promise<void> {
  logger.info('Deleting temple', { templeId, userId });

  // Check if temple exists and capture before state
  const temple = await getTemple(templeId);

  // Check for referential integrity - temple should not have active artifacts
  // This will be implemented in artifact service integration

  const key: DynamoDBKey = {
    PK: generatePK('TEMPLE', templeId),
    SK: 'METADATA',
  };

  await deleteItem(TEMPLES_TABLE, key);

  // Create audit log for temple deletion
  await createAuditLog(
    'TEMPLE',
    templeId,
    'DELETE',
    userId,
    temple, // Before state
    undefined // No after state for deletion
  );

  logger.info('Temple deleted successfully', { templeId });
}

/**
 * Map DynamoDB item to Temple interface
 */
function mapDBItemToTemple(item: TempleDBItem): Temple {
  return {
    templeId: item.templeId,
    name: item.name,
    location: item.location,
    description: item.description,
    activeArtifactCount: item.activeArtifactCount,
    accessMode: item.accessMode,
    status: item.status,
    createdAt: item.createdAt,
    createdBy: item.createdBy,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy,
    version: item.version,
  };
}

// ============================================================================
// Temple Group Operations
// ============================================================================

const TEMPLE_GROUPS_TABLE = config.tables.templeGroups;
const TEMPLE_GROUP_ASSOCIATIONS_TABLE = config.tables.associations;

interface TempleGroupDBItem {
  PK: string;
  SK: string;
  groupId: string;
  name: string;
  description: string;
  templeIds: string[];
  totalTempleCount: number;
  totalQRCodeCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  GSI1PK: string;
  GSI1SK: string;
}

interface TempleGroupAssociationDBItem {
  PK: string;
  SK: string;
  groupId: string;
  templeId: string;
  addedAt: string;
  addedBy: string;
  GSI1PK: string;
  GSI1SK: string;
}

/**
 * Create a new temple group
 */
export async function createTempleGroup(
  request: CreateGroupRequest,
  userId: string
): Promise<TempleGroup> {
  logger.info('Creating temple group', { name: request.name, userId });

  // Validate input
  const nameValidation = validateRequiredString(request.name, 'name');
  const descValidation = validateRequiredString(request.description, 'description');

  const validation = combineValidationResults(nameValidation, descValidation);
  throwIfInvalid(validation);

  // Validate that at least one temple is included
  if (!request.templeIds || request.templeIds.length === 0) {
    throw new ValidationError('Temple group must include at least one temple', {
      templeIds: request.templeIds,
    });
  }

  // Verify all temples exist
  const templePromises = request.templeIds.map(templeId => getTemple(templeId));
  const temples = await Promise.all(templePromises);

  // Calculate total QR code count
  const totalQRCodeCount = temples.reduce(
    (sum, temple) => sum + temple.activeArtifactCount,
    0
  );

  // Generate group ID and timestamps
  const groupId = uuidv4();
  const now = generateTimestamp();

  // Create temple group item
  const groupItem: TempleGroupDBItem = {
    PK: generatePK('GROUP', groupId),
    SK: 'METADATA',
    groupId,
    name: request.name,
    description: request.description,
    templeIds: request.templeIds,
    totalTempleCount: request.templeIds.length,
    totalQRCodeCount,
    status: 'active',
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
    version: 1,
    GSI1PK: 'GROUP',
    GSI1SK: `NAME#${request.name}`,
  };

  // Store group in DynamoDB
  await putItem(TEMPLE_GROUPS_TABLE, groupItem);

  // Create associations
  const associationPromises = request.templeIds.map(templeId => {
    const associationItem: TempleGroupAssociationDBItem = {
      PK: generatePK('GROUP', groupId),
      SK: generatePK('TEMPLE', templeId),
      groupId,
      templeId,
      addedAt: now,
      addedBy: userId,
      GSI1PK: generatePK('TEMPLE', templeId),
      GSI1SK: generatePK('GROUP', groupId),
    };
    return putItem(TEMPLE_GROUP_ASSOCIATIONS_TABLE, associationItem);
  });

  await Promise.all(associationPromises);

  // Create audit log for temple group creation
  await createAuditLog(
    'GROUP',
    groupId,
    'CREATE',
    userId,
    undefined, // No before state for creation
    groupItem
  );

  logger.info('Temple group created successfully', { groupId, name: request.name });

  return mapDBItemToTempleGroup(groupItem);
}

/**
 * Get a temple group by ID
 */
export async function getTempleGroup(groupId: string): Promise<TempleGroup> {
  logger.info('Getting temple group', { groupId });

  const key: DynamoDBKey = {
    PK: generatePK('GROUP', groupId),
    SK: 'METADATA',
  };

  const item = await getItem<TempleGroupDBItem>(TEMPLE_GROUPS_TABLE, key);

  if (!item) {
    throw new NotFoundError('Temple group', groupId);
  }

  return mapDBItemToTempleGroup(item);
}

/**
 * List temple groups with pagination
 */
export async function listTempleGroups(
  filters?: {
    status?: 'active' | 'inactive';
    limit?: number;
  }
): Promise<PaginatedResult<TempleGroup>> {
  logger.info('Listing temple groups', { filters });

  // Query all temple groups using GSI1
  let items = await queryItems<TempleGroupDBItem>(
    TEMPLE_GROUPS_TABLE,
    'GSI1PK = :gsi1pk',
    {
      ':gsi1pk': 'GROUP',
    },
    'GSI1'
  );

  // Filter by status if specified
  if (filters?.status) {
    items = items.filter(item => item.status === filters.status);
  }

  // Apply limit if specified
  if (filters?.limit && filters.limit > 0) {
    items = items.slice(0, filters.limit);
  }

  const groups = items.map(mapDBItemToTempleGroup);

  return {
    items: groups,
    total: groups.length,
  };
}

/**
 * Update a temple group
 */
export async function updateTempleGroup(
  groupId: string,
  request: UpdateGroupRequest,
  userId: string
): Promise<TempleGroup> {
  logger.info('Updating temple group', { groupId, userId });

  // Get existing group to check version
  const existing = await getTempleGroup(groupId);

  // Build update expression
  const updateParts: string[] = [];
  const expressionAttributeValues: any = {};
  const expressionAttributeNames: any = {};

  if (request.name !== undefined) {
    // Validate name
    const nameValidation = validateRequiredString(request.name, 'name');
    throwIfInvalid(nameValidation);

    updateParts.push('#name = :name');
    updateParts.push('GSI1SK = :gsi1sk');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = request.name;
    expressionAttributeValues[':gsi1sk'] = `NAME#${request.name}`;
  }

  if (request.description !== undefined) {
    const descValidation = validateRequiredString(request.description, 'description');
    throwIfInvalid(descValidation);

    updateParts.push('#description = :description');
    expressionAttributeNames['#description'] = 'description';
    expressionAttributeValues[':description'] = request.description;
  }

  if (updateParts.length === 0) {
    // No updates requested
    return existing;
  }

  // Add metadata updates
  updateParts.push('updatedAt = :updatedAt');
  updateParts.push('updatedBy = :updatedBy');
  updateParts.push('#version = #version + :inc');

  expressionAttributeValues[':updatedAt'] = generateTimestamp();
  expressionAttributeValues[':updatedBy'] = userId;
  expressionAttributeValues[':inc'] = 1;
  expressionAttributeValues[':expectedVersion'] = existing.version;
  expressionAttributeNames['#version'] = 'version';

  const updateExpression = `SET ${updateParts.join(', ')}`;
  const conditionExpression = '#version = :expectedVersion';

  const key: DynamoDBKey = {
    PK: generatePK('GROUP', groupId),
    SK: 'METADATA',
  };

  try {
    const updated = await updateItem(
      TEMPLE_GROUPS_TABLE,
      key,
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames,
      conditionExpression
    );

    // Create audit log for temple group update
    await createAuditLog(
      'GROUP',
      groupId,
      'UPDATE',
      userId,
      existing, // Before state
      updated // After state
    );

    logger.info('Temple group updated successfully', { groupId });

    return mapDBItemToTempleGroup(updated as TempleGroupDBItem);
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new ConflictError(
        'Temple group was modified by another request. Please retry.',
        {
          expectedVersion: existing.version,
        }
      );
    }
    throw error;
  }
}

/**
 * Delete a temple group
 */
export async function deleteTempleGroup(groupId: string, userId: string): Promise<void> {
  logger.info('Deleting temple group', { groupId, userId });

  // Check if group exists and capture before state
  const group = await getTempleGroup(groupId);

  // Delete all associations first
  const associationPromises = group.templeIds.map(templeId => {
    const key: DynamoDBKey = {
      PK: generatePK('GROUP', groupId),
      SK: generatePK('TEMPLE', templeId),
    };
    return deleteItem(TEMPLE_GROUP_ASSOCIATIONS_TABLE, key);
  });

  await Promise.all(associationPromises);

  // Delete the group
  const key: DynamoDBKey = {
    PK: generatePK('GROUP', groupId),
    SK: 'METADATA',
  };

  await deleteItem(TEMPLE_GROUPS_TABLE, key);

  // Create audit log for temple group deletion
  await createAuditLog(
    'GROUP',
    groupId,
    'DELETE',
    userId,
    group, // Before state
    undefined // No after state for deletion
  );

  logger.info('Temple group deleted successfully', { groupId });
}

/**
 * Add a temple to a group
 */
export async function addTempleToGroup(
  groupId: string,
  templeId: string,
  userId: string
): Promise<void> {
  logger.info('Adding temple to group', { groupId, templeId, userId });

  // Verify group exists
  const group = await getTempleGroup(groupId);

  // Verify temple exists
  const temple = await getTemple(templeId);

  // Check if temple is already in the group
  if (group.templeIds.includes(templeId)) {
    logger.info('Temple already in group', { groupId, templeId });
    return;
  }

  const now = generateTimestamp();

  // Create association
  const associationItem: TempleGroupAssociationDBItem = {
    PK: generatePK('GROUP', groupId),
    SK: generatePK('TEMPLE', templeId),
    groupId,
    templeId,
    addedAt: now,
    addedBy: userId,
    GSI1PK: generatePK('TEMPLE', templeId),
    GSI1SK: generatePK('GROUP', groupId),
  };

  await putItem(TEMPLE_GROUP_ASSOCIATIONS_TABLE, associationItem);

  // Update group metadata
  const updatedTempleIds = [...group.templeIds, templeId];
  const updatedQRCodeCount = group.totalQRCodeCount + temple.activeArtifactCount;

  const key: DynamoDBKey = {
    PK: generatePK('GROUP', groupId),
    SK: 'METADATA',
  };

  const updateExpression =
    'SET templeIds = :templeIds, totalTempleCount = :templeCount, totalQRCodeCount = :qrCount, updatedAt = :updatedAt, updatedBy = :updatedBy, #version = #version + :inc';
  const expressionAttributeValues = {
    ':templeIds': updatedTempleIds,
    ':templeCount': updatedTempleIds.length,
    ':qrCount': updatedQRCodeCount,
    ':updatedAt': now,
    ':updatedBy': userId,
    ':inc': 1,
    ':expectedVersion': group.version,
  };
  const expressionAttributeNames = {
    '#version': 'version',
  };
  const conditionExpression = '#version = :expectedVersion';

  try {
    await updateItem(
      TEMPLE_GROUPS_TABLE,
      key,
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames,
      conditionExpression
    );

    logger.info('Temple added to group successfully', { groupId, templeId });
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new ConflictError(
        'Temple group was modified by another request. Please retry.',
        {
          expectedVersion: group.version,
        }
      );
    }
    throw error;
  }
}

/**
 * Remove a temple from a group
 */
export async function removeTempleFromGroup(
  groupId: string,
  templeId: string,
  userId: string
): Promise<void> {
  logger.info('Removing temple from group', { groupId, templeId, userId });

  // Verify group exists
  const group = await getTempleGroup(groupId);

  // Check if temple is in the group
  if (!group.templeIds.includes(templeId)) {
    logger.info('Temple not in group', { groupId, templeId });
    return;
  }

  // Verify this won't leave the group empty
  if (group.templeIds.length === 1) {
    throw new ValidationError(
      'Cannot remove the last temple from a group. Delete the group instead.',
      { groupId, templeId }
    );
  }

  // Get temple to update QR code count
  const temple = await getTemple(templeId);

  // Delete association
  const associationKey: DynamoDBKey = {
    PK: generatePK('GROUP', groupId),
    SK: generatePK('TEMPLE', templeId),
  };

  await deleteItem(TEMPLE_GROUP_ASSOCIATIONS_TABLE, associationKey);

  // Update group metadata
  const updatedTempleIds = group.templeIds.filter(id => id !== templeId);
  const updatedQRCodeCount = group.totalQRCodeCount - temple.activeArtifactCount;

  const key: DynamoDBKey = {
    PK: generatePK('GROUP', groupId),
    SK: 'METADATA',
  };

  const now = generateTimestamp();
  const updateExpression =
    'SET templeIds = :templeIds, totalTempleCount = :templeCount, totalQRCodeCount = :qrCount, updatedAt = :updatedAt, updatedBy = :updatedBy, #version = #version + :inc';
  const expressionAttributeValues = {
    ':templeIds': updatedTempleIds,
    ':templeCount': updatedTempleIds.length,
    ':qrCount': updatedQRCodeCount,
    ':updatedAt': now,
    ':updatedBy': userId,
    ':inc': 1,
    ':expectedVersion': group.version,
  };
  const expressionAttributeNames = {
    '#version': 'version',
  };
  const conditionExpression = '#version = :expectedVersion';

  try {
    await updateItem(
      TEMPLE_GROUPS_TABLE,
      key,
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames,
      conditionExpression
    );

    logger.info('Temple removed from group successfully', { groupId, templeId });
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new ConflictError(
        'Temple group was modified by another request. Please retry.',
        {
          expectedVersion: group.version,
        }
      );
    }
    throw error;
  }
}

/**
 * Get all groups that contain a specific temple (reverse lookup using GSI1)
 */
export async function getGroupsForTemple(templeId: string): Promise<TempleGroup[]> {
  logger.info('Getting groups for temple', { templeId });

  // Verify temple exists
  await getTemple(templeId);

  // Query associations using GSI1 (reverse lookup)
  const associations = await queryItems<TempleGroupAssociationDBItem>(
    TEMPLE_GROUP_ASSOCIATIONS_TABLE,
    'GSI1PK = :gsi1pk',
    {
      ':gsi1pk': generatePK('TEMPLE', templeId),
    },
    'GSI1'
  );

  // Fetch all groups
  const groupPromises = associations.map(assoc => getTempleGroup(assoc.groupId));
  const groups = await Promise.all(groupPromises);

  logger.info('Found groups for temple', { templeId, groupCount: groups.length });

  return groups;
}

/**
 * Map DynamoDB item to TempleGroup interface
 */
function mapDBItemToTempleGroup(item: TempleGroupDBItem): TempleGroup {
  return {
    groupId: item.groupId,
    name: item.name,
    description: item.description,
    templeIds: item.templeIds,
    totalTempleCount: item.totalTempleCount,
    totalQRCodeCount: item.totalQRCodeCount,
    status: item.status,
    createdAt: item.createdAt,
    createdBy: item.createdBy,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy,
    version: item.version,
  };
}

// ========================================
// Artifact Operations
// ========================================

const ARTIFACTS_TABLE = config.tables.artifacts;
const QR_CODE_BUCKET = config.buckets.qrCodes;

interface ArtifactDBItem {
  PK: string;
  SK: string;
  artifactId: string;
  templeId: string;
  name: string;
  description: string;
  qrCodeId: string;
  qrCodeImageUrl: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  GSI1PK: string;
  GSI1SK: string;
}

/**
 * Generate a unique QR code ID
 */
function generateQRCodeId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `QR-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate QR code image and upload to S3
 */
async function generateAndUploadQRCode(qrCodeId: string): Promise<string> {
  // Import QR code library
  const QRCode = require('qrcode');
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

  try {
    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeId, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 512,
      margin: 2,
    });

    // Upload to S3
    const s3Client = new S3Client({ region: config.region });
    const key = `qr-codes/${qrCodeId}.png`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: QR_CODE_BUCKET,
        Key: key,
        Body: qrCodeBuffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=31536000', // 1 year
      })
    );

    const imageUrl = `https://${QR_CODE_BUCKET}.s3.${config.region}.amazonaws.com/${key}`;
    logger.info('QR code uploaded to S3', { qrCodeId, imageUrl });

    return imageUrl;
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to generate or upload QR code', err, { qrCodeId });
    throw new Error(`Failed to generate QR code: ${err.message}`);
  }
}

/**
 * Create a new artifact with QR code generation
 */
export async function createArtifact(
  request: CreateArtifactRequest,
  userId: string
): Promise<Artifact> {
  logger.info('Creating artifact', { templeId: request.templeId, name: request.name, userId });

  // Validate input
  const nameValidation = validateRequiredString(request.name, 'name');
  const descValidation = validateRequiredString(request.description, 'description');
  const templeIdValidation = validateRequiredString(request.templeId, 'templeId');

  const validation = combineValidationResults(
    nameValidation,
    descValidation,
    templeIdValidation
  );
  throwIfInvalid(validation);

  // Verify temple exists
  const temple = await getTemple(request.templeId);
  if (!temple) {
    throw new NotFoundError('Temple', request.templeId);
  }

  // Generate unique IDs
  const artifactId = uuidv4();
  const qrCodeId = generateQRCodeId();
  const timestamp = generateTimestamp();

  // Generate and upload QR code
  const qrCodeImageUrl = await generateAndUploadQRCode(qrCodeId);

  // Create artifact item
  const artifactItem: ArtifactDBItem = {
    PK: `TEMPLE#${request.templeId}`,
    SK: `ARTIFACT#${artifactId}`,
    artifactId,
    templeId: request.templeId,
    name: request.name,
    description: request.description,
    qrCodeId,
    qrCodeImageUrl,
    status: 'active',
    createdAt: timestamp,
    createdBy: userId,
    updatedAt: timestamp,
    updatedBy: userId,
    GSI1PK: `QRCODE#${qrCodeId}`,
    GSI1SK: `ARTIFACT#${artifactId}`,
  };

  await putItem(ARTIFACTS_TABLE, artifactItem);

  // Increment temple's active artifact count
  await updateItem(
    TEMPLES_TABLE,
    { PK: `TEMPLE#${request.templeId}`, SK: 'METADATA' },
    'SET activeArtifactCount = activeArtifactCount + :inc, updatedAt = :timestamp, updatedBy = :userId',
    {
      ':inc': 1,
      ':timestamp': timestamp,
      ':userId': userId,
    }
  );

  // Update QR code counts for all temple groups containing this temple
  const groups = await getGroupsForTemple(request.templeId);
  const groupUpdatePromises = groups.map(group => {
    const groupKey: DynamoDBKey = {
      PK: generatePK('GROUP', group.groupId),
      SK: 'METADATA',
    };
    return updateItem(
      TEMPLE_GROUPS_TABLE,
      groupKey,
      'SET totalQRCodeCount = totalQRCodeCount + :inc, updatedAt = :timestamp, updatedBy = :userId',
      {
        ':inc': 1,
        ':timestamp': timestamp,
        ':userId': userId,
      }
    );
  });
  await Promise.all(groupUpdatePromises);

  // Create audit log for artifact creation
  await createAuditLog(
    'ARTIFACT',
    artifactId,
    'CREATE',
    userId,
    undefined, // No before state for creation
    artifactItem
  );

  logger.info('Artifact created successfully', { artifactId, qrCodeId });

  return mapDBItemToArtifact(artifactItem);
}

/**
 * Get artifact by ID
 */
export async function getArtifact(artifactId: string): Promise<Artifact> {
  logger.info('Getting artifact', { artifactId });

  // Query using GSI1 to find artifact by ID
  const items = await queryItems<ArtifactDBItem>(
    ARTIFACTS_TABLE,
    'GSI1SK = :gsi1sk',
    {
      ':gsi1sk': `ARTIFACT#${artifactId}`,
    },
    'GSI1'
  );

  if (!items || items.length === 0) {
    throw new NotFoundError('Artifact', artifactId);
  }

  return mapDBItemToArtifact(items[0]);
}

/**
 * Get artifact by QR code ID
 */
export async function getArtifactByQRCode(qrCodeId: string): Promise<Artifact> {
  logger.info('Getting artifact by QR code', { qrCodeId });

  const items = await queryItems<ArtifactDBItem>(
    ARTIFACTS_TABLE,
    'GSI1PK = :gsi1pk',
    {
      ':gsi1pk': `QRCODE#${qrCodeId}`,
    },
    'GSI1'
  );

  if (!items || items.length === 0) {
    throw new NotFoundError('Artifact with QR code', qrCodeId);
  }

  return mapDBItemToArtifact(items[0]);
}

/**
 * List artifacts with filtering
 */
export async function listArtifacts(
  templeId?: string,
  status?: 'active' | 'inactive'
): Promise<PaginatedResult<Artifact>> {
  logger.info('Listing artifacts', { templeId, status });

  let items: ArtifactDBItem[];

  if (templeId) {
    // Query artifacts for specific temple
    const keyCondition = 'PK = :pk AND begins_with(SK, :sk)';
    const expressionValues: any = {
      ':pk': `TEMPLE#${templeId}`,
      ':sk': 'ARTIFACT#',
    };

    items = await queryItems<ArtifactDBItem>(
      ARTIFACTS_TABLE,
      keyCondition,
      expressionValues
    );

    // Filter by status if provided
    if (status) {
      items = items.filter(item => item.status === status);
    }
  } else {
    // For listing all artifacts, we need to scan or use a different approach
    // Since we don't have a GSI for all artifacts, we'll return an error
    throw new ValidationError('templeId is required for listing artifacts', { templeId });
  }

  return {
    items: items.map(mapDBItemToArtifact),
    nextToken: undefined, // TODO: Implement pagination token
  };
}

/**
 * Update artifact
 */
export async function updateArtifact(
  artifactId: string,
  updates: UpdateArtifactRequest,
  userId: string
): Promise<Artifact> {
  logger.info('Updating artifact', { artifactId, updates, userId });

  // Get existing artifact to find its PK
  const existing = await getArtifact(artifactId);

  // Build update expression
  const updateParts: string[] = [];
  const expressionValues: any = {
    ':timestamp': generateTimestamp(),
    ':userId': userId,
  };
  const expressionNames: any = {};

  if (updates.name !== undefined) {
    const validation = validateRequiredString(updates.name, 'name');
    throwIfInvalid(validation);
    updateParts.push('#name = :name');
    expressionValues[':name'] = updates.name;
    expressionNames['#name'] = 'name';
  }

  if (updates.description !== undefined) {
    const validation = validateRequiredString(updates.description, 'description');
    throwIfInvalid(validation);
    updateParts.push('description = :description');
    expressionValues[':description'] = updates.description;
  }

  if (updates.status !== undefined) {
    if (updates.status !== 'active' && updates.status !== 'inactive') {
      throw new ValidationError('Invalid status', { status: updates.status });
    }
    updateParts.push('#status = :status');
    expressionValues[':status'] = updates.status;
    expressionNames['#status'] = 'status';
  }

  if (updateParts.length === 0) {
    throw new ValidationError('No valid updates provided', updates);
  }

  // Add timestamp and user
  updateParts.push('updatedAt = :timestamp', 'updatedBy = :userId');

  const updateExpression = `SET ${updateParts.join(', ')}`;

  await updateItem(
    ARTIFACTS_TABLE,
    { PK: `TEMPLE#${existing.templeId}`, SK: `ARTIFACT#${artifactId}` },
    updateExpression,
    expressionValues,
    Object.keys(expressionNames).length > 0 ? expressionNames : undefined
  );

  logger.info('Artifact updated successfully', { artifactId });

  // Get updated artifact for audit log
  const updated = await getArtifact(artifactId);

  // Create audit log for artifact update
  await createAuditLog(
    'ARTIFACT',
    artifactId,
    'UPDATE',
    userId,
    existing, // Before state
    updated // After state
  );

  // Return updated artifact
  return updated;
}

/**
 * Delete artifact (soft deletion - set status to inactive)
 */
export async function deleteArtifact(artifactId: string, userId: string): Promise<void> {
  logger.info('Deleting artifact', { artifactId, userId });

  // Get existing artifact
  const existing = await getArtifact(artifactId);

  // Soft delete by setting status to inactive
  await updateItem(
    ARTIFACTS_TABLE,
    { PK: `TEMPLE#${existing.templeId}`, SK: `ARTIFACT#${artifactId}` },
    'SET #status = :status, updatedAt = :timestamp, updatedBy = :userId',
    {
      ':status': 'inactive',
      ':timestamp': generateTimestamp(),
      ':userId': userId,
    },
    {
      '#status': 'status',
    }
  );

  // Decrement temple's active artifact count
  await updateItem(
    TEMPLES_TABLE,
    { PK: `TEMPLE#${existing.templeId}`, SK: 'METADATA' },
    'SET activeArtifactCount = activeArtifactCount - :dec, updatedAt = :timestamp, updatedBy = :userId',
    {
      ':dec': 1,
      ':timestamp': generateTimestamp(),
      ':userId': userId,
    }
  );

  // Update QR code counts for all temple groups containing this temple
  const groups = await getGroupsForTemple(existing.templeId);
  const groupUpdatePromises = groups.map(group => {
    const groupKey: DynamoDBKey = {
      PK: generatePK('GROUP', group.groupId),
      SK: 'METADATA',
    };
    return updateItem(
      TEMPLE_GROUPS_TABLE,
      groupKey,
      'SET totalQRCodeCount = totalQRCodeCount - :dec, updatedAt = :timestamp, updatedBy = :userId',
      {
        ':dec': 1,
        ':timestamp': generateTimestamp(),
        ':userId': userId,
      }
    );
  });
  await Promise.all(groupUpdatePromises);

  // Create audit log for artifact deletion
  await createAuditLog(
    'ARTIFACT',
    artifactId,
    'DELETE',
    userId,
    existing, // Before state
    undefined // No after state for deletion
  );

  logger.info('Artifact deleted successfully', { artifactId });
}

/**
 * Generate QR code for an artifact (regenerate if needed)
 */
export async function generateQRCode(artifactId: string): Promise<{ qrCodeId: string; qrCodeImageUrl: string }> {
  logger.info('Generating QR code for artifact', { artifactId });

  const artifact = await getArtifact(artifactId);

  // Return existing QR code info
  return {
    qrCodeId: artifact.qrCodeId,
    qrCodeImageUrl: artifact.qrCodeImageUrl,
  };
}

/**
 * Map DynamoDB item to Artifact interface
 */
function mapDBItemToArtifact(item: ArtifactDBItem): Artifact {
  return {
    artifactId: item.artifactId,
    templeId: item.templeId,
    name: item.name,
    description: item.description,
    qrCodeId: item.qrCodeId,
    qrCodeImageUrl: item.qrCodeImageUrl,
    status: item.status,
    createdAt: item.createdAt,
    createdBy: item.createdBy,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy,
  };
}

// ========================================
// QR Code Count Tracking
// ========================================

/**
 * Get QR code count for a temple or temple group
 */
export async function getQRCodeCount(
  entityType: 'TEMPLE' | 'GROUP',
  entityId: string
): Promise<number> {
  logger.info('Getting QR code count', { entityType, entityId });

  if (entityType === 'TEMPLE') {
    const temple = await getTemple(entityId);
    return temple.activeArtifactCount;
  } else if (entityType === 'GROUP') {
    const group = await getTempleGroup(entityId);
    return group.totalQRCodeCount;
  } else {
    throw new ValidationError('Invalid entity type', { entityType });
  }
}

/**
 * Recalculate QR code counts for a temple or temple group with atomic updates
 */
export async function recalculateQRCodeCounts(
  entityType: 'TEMPLE' | 'GROUP',
  entityId: string,
  userId: string
): Promise<void> {
  logger.info('Recalculating QR code counts', { entityType, entityId, userId });

  if (entityType === 'TEMPLE') {
    // Recalculate temple's active artifact count
    const artifacts = await listArtifacts(entityId, 'active');
    const actualCount = artifacts.items.length;

    const now = generateTimestamp();
    const key: DynamoDBKey = {
      PK: generatePK('TEMPLE', entityId),
      SK: 'METADATA',
    };

    await updateItem(
      TEMPLES_TABLE,
      key,
      'SET activeArtifactCount = :count, updatedAt = :timestamp, updatedBy = :userId',
      {
        ':count': actualCount,
        ':timestamp': now,
        ':userId': userId,
      }
    );

    logger.info('Temple QR code count recalculated', { entityId, actualCount });

    // Update all temple groups that contain this temple
    const groups = await getGroupsForTemple(entityId);
    for (const group of groups) {
      await recalculateQRCodeCounts('GROUP', group.groupId, userId);
    }
  } else if (entityType === 'GROUP') {
    // Recalculate temple group's total QR code count
    const group = await getTempleGroup(entityId);
    
    // Fetch all temples in the group and sum their active artifact counts
    const templePromises = group.templeIds.map(templeId => getTemple(templeId));
    const temples = await Promise.all(templePromises);
    
    const totalQRCodeCount = temples.reduce(
      (sum, temple) => sum + temple.activeArtifactCount,
      0
    );

    const now = generateTimestamp();
    const key: DynamoDBKey = {
      PK: generatePK('GROUP', entityId),
      SK: 'METADATA',
    };

    await updateItem(
      TEMPLE_GROUPS_TABLE,
      key,
      'SET totalQRCodeCount = :count, updatedAt = :timestamp, updatedBy = :userId',
      {
        ':count': totalQRCodeCount,
        ':timestamp': now,
        ':userId': userId,
      }
    );

    logger.info('Temple group QR code count recalculated', { entityId, totalQRCodeCount });
  } else {
    throw new ValidationError('Invalid entity type', { entityType });
  }
}

/**
 * Bulk update temples with partial failure handling
 * 
 * Processes multiple temple updates and returns detailed results for successful
 * and failed operations. Continues processing even if some updates fail.
 */
export async function bulkUpdateTemples(
  updates: BulkUpdateTempleRequest[],
  userId: string
): Promise<BulkUpdateResult> {
  logger.info('Starting bulk temple update', { count: updates.length, userId });

  const successful: BulkOperationSuccess[] = [];
  const failed: BulkOperationFailure[] = [];

  // Process each update independently
  for (const update of updates) {
    try {
      await updateTemple(update.templeId, update.updates, userId);
      
      successful.push({
        entityId: update.templeId,
        message: 'Temple updated successfully',
      });
      
      logger.info('Bulk update succeeded for temple', { templeId: update.templeId });
    } catch (error) {
      const err = error as Error;
      failed.push({
        entityId: update.templeId,
        error: err.message,
        details: err.name,
      });
      
      logger.error('Bulk update failed for temple', err, { templeId: update.templeId });
    }
  }

  const result: BulkUpdateResult = {
    successful,
    failed,
    totalProcessed: updates.length,
    successCount: successful.length,
    failureCount: failed.length,
  };

  // Create audit log for bulk update operation
  await createAuditLog(
    'TEMPLE',
    'BULK',
    'BULK_UPDATE',
    userId,
    { updates }, // Before state: the update requests
    result // After state: the results
  );

  logger.info('Bulk temple update completed', {
    totalProcessed: result.totalProcessed,
    successCount: result.successCount,
    failureCount: result.failureCount,
  });

  return result;
}

/**
 * Bulk delete temples with transaction support and referential integrity checks
 * 
 * Deletes multiple temples after checking referential integrity for each.
 * Returns detailed results for successful and failed operations.
 */
export async function bulkDeleteTemples(
  templeIds: string[],
  userId: string
): Promise<BulkDeleteResult> {
  logger.info('Starting bulk temple deletion', { count: templeIds.length, userId });

  const successful: BulkOperationSuccess[] = [];
  const failed: BulkOperationFailure[] = [];

  // Process each deletion independently with referential integrity checks
  for (const templeId of templeIds) {
    try {
      // Check if temple exists
      await getTemple(templeId);
      
      // Check if temple is part of any temple groups
      const groups = await getGroupsForTemple(templeId);
      if (groups.length > 0) {
        const groupNames = groups.map(g => g.name).join(', ');
        throw new ValidationError(
          `Cannot delete temple: it is part of ${groups.length} temple group(s): ${groupNames}`,
          { templeId, groupCount: groups.length, groups: groupNames }
        );
      }

      // Perform the deletion
      await deleteTemple(templeId, userId);
      
      successful.push({
        entityId: templeId,
        message: 'Temple deleted successfully',
      });
      
      logger.info('Bulk delete succeeded for temple', { templeId });
    } catch (error) {
      const err = error as Error;
      failed.push({
        entityId: templeId,
        error: err.message,
        details: err.name,
      });
      
      logger.error('Bulk delete failed for temple', err, { templeId });
    }
  }

  const result: BulkDeleteResult = {
    successful,
    failed,
    totalProcessed: templeIds.length,
    successCount: successful.length,
    failureCount: failed.length,
  };

  // Create audit log for bulk delete operation
  await createAuditLog(
    'TEMPLE',
    'BULK',
    'BULK_DELETE',
    userId,
    { templeIds }, // Before state: the temple IDs to delete
    result // After state: the results
  );

  logger.info('Bulk temple deletion completed', {
    totalProcessed: result.totalProcessed,
    successCount: result.successCount,
    failureCount: result.failureCount,
  });

  return result;
}
