/**
 * Price Calculator Service
 * 
 * Handles automatic price calculation, formula management, and price overrides
 */

import { v4 as uuidv4 } from 'uuid';
import {
  PricingFormula,
  RoundingRule,
  EntityType,
} from '../../types';
import {
  putItem,
  getItem,
  queryItems,
  generateTimestamp,
  generatePK,
  generateSK,
} from '../../utils/dynamodb';
import {
  validateRequiredString,
  validateNonNegativeNumber,
  combineValidationResults,
  throwIfInvalid,
} from '../../utils/validators';
import { NotFoundError, ValidationError } from '../../utils/errors';
import config from '../../config';
import logger from '../../utils/logger';

// ============================================================================
// Pricing Formula Management (Task 6.1)
// ============================================================================

/**
 * Set or update pricing formula for a category
 */
export async function setPricingFormula(
  category: string,
  basePrice: number,
  perQRCodePrice: number,
  roundingRule: RoundingRule,
  discountFactor: number,
  adminUserId: string
): Promise<PricingFormula> {
  logger.info('Setting pricing formula', { 
    category, 
    basePrice, 
    perQRCodePrice, 
    discountFactor,
    adminUserId 
  });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(category, 'category'),
    validateNonNegativeNumber(basePrice, 'basePrice'),
    validateNonNegativeNumber(perQRCodePrice, 'perQRCodePrice'),
    validateNonNegativeNumber(discountFactor, 'discountFactor')
  );
  throwIfInvalid(validationResult);

  // Validate discount factor range (0.0 - 1.0)
  if (discountFactor < 0 || discountFactor > 1) {
    throw new ValidationError('Discount factor must be between 0 and 1');
  }

  // Validate rounding rule
  if (!roundingRule || !roundingRule.type || !roundingRule.direction) {
    throw new ValidationError('Rounding rule must have type and direction');
  }

  const validRoundingTypes = ['none', 'nearest10', 'nearest99', 'nearest100'];
  const validDirections = ['up', 'down', 'nearest'];
  
  if (!validRoundingTypes.includes(roundingRule.type)) {
    throw new ValidationError(`Invalid rounding type: ${roundingRule.type}`);
  }
  
  if (!validDirections.includes(roundingRule.direction)) {
    throw new ValidationError(`Invalid rounding direction: ${roundingRule.direction}`);
  }

  const now = generateTimestamp();

  // Check if there's an existing formula to archive
  const existingFormula = await getPricingFormula(category);
  
  if (existingFormula) {
    // Create formula history entry for the old formula
    await createFormulaHistoryEntry(existingFormula, now);
  }

  // Create pricing formula object
  const formulaId = uuidv4();
  const formula: PricingFormula = {
    formulaId,
    category,
    basePrice,
    perQRCodePrice,
    roundingRule,
    discountFactor,
    isActive: true,
    effectiveDate: now,
    setBy: adminUserId,
    createdAt: existingFormula?.createdAt || now,
    updatedAt: now,
    version: (existingFormula?.version || 0) + 1,
  };

  // Store in DynamoDB
  const pk = generatePK('FORMULA', category);
  const sk = generateSK('CURRENT');

  await putItem(config.tables.formulas, {
    PK: pk,
    SK: sk,
    formulaId: formula.formulaId,
    category: formula.category,
    basePrice: formula.basePrice,
    perQRCodePrice: formula.perQRCodePrice,
    roundingRule: formula.roundingRule,
    discountFactor: formula.discountFactor,
    isActive: formula.isActive,
    effectiveDate: formula.effectiveDate,
    setBy: formula.setBy,
    createdAt: formula.createdAt,
    updatedAt: formula.updatedAt,
    version: formula.version,
  });

  logger.info('Pricing formula set successfully', { category, formulaId });

  return formula;
}

/**
 * Get pricing formula for a category
 */
export async function getPricingFormula(category: string): Promise<PricingFormula | null> {
  logger.info('Getting pricing formula', { category });

  // Validate input
  const validationResult = validateRequiredString(category, 'category');
  throwIfInvalid(validationResult);

  // Query DynamoDB
  const pk = generatePK('FORMULA', category);
  const sk = generateSK('CURRENT');

  const item = await getItem<any>(config.tables.formulas, { PK: pk, SK: sk });

  if (!item) {
    logger.info('Pricing formula not found', { category });
    return null;
  }

  // Map to PricingFormula
  const formula: PricingFormula = {
    formulaId: item.formulaId,
    category: item.category,
    basePrice: item.basePrice,
    perQRCodePrice: item.perQRCodePrice,
    roundingRule: item.roundingRule,
    discountFactor: item.discountFactor,
    isActive: item.isActive,
    effectiveDate: item.effectiveDate,
    setBy: item.setBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    version: item.version,
  };

  logger.info('Pricing formula retrieved', { category });

  return formula;
}

/**
 * Get formula history for a category with chronological ordering
 */
export async function getFormulaHistory(category: string): Promise<PricingFormula[]> {
  logger.info('Getting formula history', { category });

  // Validate input
  const validationResult = validateRequiredString(category, 'category');
  throwIfInvalid(validationResult);

  // Query all history for this category
  const pk = generatePK('FORMULA', category);
  
  const items = await queryItems<any>(
    config.tables.formulaHistory,
    'PK = :pk AND begins_with(SK, :skPrefix)',
    {
      ':pk': pk,
      ':skPrefix': 'HISTORY#',
    },
    undefined,
    false // Don't scan forward - we want most recent first
  );

  // Map to PricingFormula objects
  const history: PricingFormula[] = items.map((item) => ({
    formulaId: item.formulaId,
    category: item.category,
    basePrice: item.basePrice,
    perQRCodePrice: item.perQRCodePrice,
    roundingRule: item.roundingRule,
    discountFactor: item.discountFactor,
    isActive: false, // Historical formulas are not active
    effectiveDate: item.effectiveDate,
    setBy: item.setBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt || item.createdAt,
    version: item.version || 1,
  }));

  logger.info('Formula history retrieved', { 
    category, 
    count: history.length 
  });

  return history;
}

/**
 * Create a formula history entry for an old formula
 * @internal
 */
async function createFormulaHistoryEntry(
  oldFormula: PricingFormula,
  endDate: string
): Promise<void> {
  logger.info('Creating formula history entry', { 
    category: oldFormula.category,
    formulaId: oldFormula.formulaId
  });

  const pk = generatePK('FORMULA', oldFormula.category);
  const sk = generateSK(`HISTORY#${oldFormula.effectiveDate}`);

  const historyEntry = {
    PK: pk,
    SK: sk,
    formulaId: oldFormula.formulaId,
    category: oldFormula.category,
    basePrice: oldFormula.basePrice,
    perQRCodePrice: oldFormula.perQRCodePrice,
    roundingRule: oldFormula.roundingRule,
    discountFactor: oldFormula.discountFactor,
    effectiveDate: oldFormula.effectiveDate,
    endDate: endDate,
    setBy: oldFormula.setBy,
    createdAt: oldFormula.createdAt,
    updatedAt: oldFormula.updatedAt,
    version: oldFormula.version,
  };

  await putItem(config.tables.formulaHistory, historyEntry);

  logger.info('Formula history entry created', { 
    category: oldFormula.category,
    formulaId: oldFormula.formulaId
  });
}


// ============================================================================
// Suggested Price Calculation (Task 6.3)
// ============================================================================

/**
 * Suggested price result with raw and rounded values
 */
export interface SuggestedPrice {
  entityId: string;
  entityType: EntityType;
  qrCodeCount: number;
  basePrice: number;
  perQRCodePrice: number;
  rawPrice: number;
  roundedPrice: number;
  roundingRule: RoundingRule;
  formula: string;
}

/**
 * Calculate suggested price for an entity using the pricing formula
 */
export async function calculateSuggestedPrice(
  entityType: EntityType,
  entityId: string,
  qrCodeCount: number,
  category: string = 'DEFAULT'
): Promise<SuggestedPrice> {
  logger.info('Calculating suggested price', { 
    entityType, 
    entityId, 
    qrCodeCount,
    category
  });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(entityId, 'entityId'),
    validateNonNegativeNumber(qrCodeCount, 'qrCodeCount')
  );
  throwIfInvalid(validationResult);

  // Get pricing formula
  const formula = await getPricingFormula(category);
  if (!formula) {
    throw new NotFoundError('PricingFormula', category);
  }

  // Calculate raw price: basePrice + (qrCodeCount * perQRCodePrice)
  const rawPrice = formula.basePrice + (qrCodeCount * formula.perQRCodePrice);

  // Apply rounding rules
  const roundedPrice = applyRoundingRules(rawPrice, formula.roundingRule);

  // Build formula string for display
  const formulaString = `₹${formula.basePrice} base + (${qrCodeCount} QR codes × ₹${formula.perQRCodePrice}) = ₹${rawPrice}`;

  const suggestedPrice: SuggestedPrice = {
    entityId,
    entityType,
    qrCodeCount,
    basePrice: formula.basePrice,
    perQRCodePrice: formula.perQRCodePrice,
    rawPrice,
    roundedPrice,
    roundingRule: formula.roundingRule,
    formula: formulaString,
  };

  logger.info('Suggested price calculated', { 
    entityId, 
    rawPrice, 
    roundedPrice 
  });

  return suggestedPrice;
}

/**
 * Apply rounding rules to a calculated price
 */
export function applyRoundingRules(price: number, rules: RoundingRule): number {
  logger.info('Applying rounding rules', { price, rules });

  if (rules.type === 'none') {
    return price;
  }

  let roundedPrice: number;

  switch (rules.type) {
    case 'nearest10':
      roundedPrice = applyRounding(price, 10, rules.direction);
      break;
    
    case 'nearest99':
      // Round to nearest 99 (e.g., 99, 199, 299, etc.)
      roundedPrice = applyRoundingTo99(price, rules.direction);
      break;
    
    case 'nearest100':
      roundedPrice = applyRounding(price, 100, rules.direction);
      break;
    
    default:
      roundedPrice = price;
  }

  logger.info('Rounding applied', { 
    originalPrice: price, 
    roundedPrice 
  });

  return roundedPrice;
}

/**
 * Apply rounding to a specific multiple
 * @internal
 */
function applyRounding(
  price: number, 
  multiple: number, 
  direction: 'up' | 'down' | 'nearest'
): number {
  if (direction === 'up') {
    return Math.ceil(price / multiple) * multiple;
  } else if (direction === 'down') {
    return Math.floor(price / multiple) * multiple;
  } else {
    // nearest
    return Math.round(price / multiple) * multiple;
  }
}

/**
 * Apply rounding to nearest 99 (e.g., 99, 199, 299, etc.)
 * @internal
 */
function applyRoundingTo99(price: number, direction: 'up' | 'down' | 'nearest'): number {
  if (direction === 'up') {
    // Round up to next 99
    const hundreds = Math.ceil(price / 100);
    return hundreds * 100 - 1;
  } else if (direction === 'down') {
    // Round down to previous 99
    const hundreds = Math.floor((price + 1) / 100);
    return hundreds * 100 - 1;
  } else {
    // nearest
    const lower = Math.floor((price + 1) / 100) * 100 - 1;
    const upper = Math.ceil(price / 100) * 100 - 1;
    
    const distanceToLower = Math.abs(price - lower);
    const distanceToUpper = Math.abs(price - upper);
    
    return distanceToLower <= distanceToUpper ? lower : upper;
  }
}


// ============================================================================
// Temple Group Pricing (Task 6.5)
// ============================================================================

/**
 * Temple group suggested price with breakdown
 */
export interface GroupSuggestedPrice extends SuggestedPrice {
  templeBreakdown: Array<{
    templeId: string;
    templeName: string;
    qrCodeCount: number;
  }>;
  discountFactor: number;
  priceBeforeDiscount: number;
  individualTemplesPriceSum?: number;
  hasGroupDiscount: boolean;
}

/**
 * Calculate suggested price for a temple group with discount
 */
export async function calculateGroupSuggestedPrice(
  groupId: string,
  temples: Array<{ templeId: string; templeName: string; qrCodeCount: number }>,
  category: string = 'DEFAULT'
): Promise<GroupSuggestedPrice> {
  logger.info('Calculating group suggested price', { 
    groupId, 
    templeCount: temples.length,
    category
  });

  // Validate input
  if (!temples || temples.length === 0) {
    throw new ValidationError('Temple group must contain at least one temple');
  }

  // Calculate total QR code count across all temples
  const totalQRCodeCount = temples.reduce((sum, temple) => sum + temple.qrCodeCount, 0);

  // Get pricing formula
  const formula = await getPricingFormula(category);
  if (!formula) {
    throw new NotFoundError('PricingFormula', category);
  }

  // Calculate raw price: basePrice + (totalQRCodeCount * perQRCodePrice)
  const priceBeforeDiscount = formula.basePrice + (totalQRCodeCount * formula.perQRCodePrice);

  // Apply discount factor
  const rawPrice = priceBeforeDiscount * (1 - formula.discountFactor);

  // Apply rounding rules
  const roundedPrice = applyRoundingRules(rawPrice, formula.roundingRule);

  // Build formula string for display
  const formulaString = `₹${formula.basePrice} base + (${totalQRCodeCount} QR codes × ₹${formula.perQRCodePrice}) × (1 - ${formula.discountFactor}) = ₹${rawPrice}`;

  const groupSuggestedPrice: GroupSuggestedPrice = {
    entityId: groupId,
    entityType: 'GROUP',
    qrCodeCount: totalQRCodeCount,
    basePrice: formula.basePrice,
    perQRCodePrice: formula.perQRCodePrice,
    rawPrice,
    roundedPrice,
    roundingRule: formula.roundingRule,
    formula: formulaString,
    templeBreakdown: temples,
    discountFactor: formula.discountFactor,
    priceBeforeDiscount,
    hasGroupDiscount: formula.discountFactor > 0,
  };

  logger.info('Group suggested price calculated', { 
    groupId, 
    totalQRCodeCount,
    priceBeforeDiscount,
    rawPrice, 
    roundedPrice 
  });

  return groupSuggestedPrice;
}

/**
 * Check if group price is higher than sum of individual temple prices
 * Returns warning message if group price > sum, null otherwise
 */
export async function checkGroupPriceWarning(
  groupPrice: number,
  individualTemplePrices: number[]
): Promise<string | null> {
  const sumOfIndividualPrices = individualTemplePrices.reduce((sum, price) => sum + price, 0);

  if (groupPrice > sumOfIndividualPrices) {
    const difference = groupPrice - sumOfIndividualPrices;
    const percentageHigher = ((difference / sumOfIndividualPrices) * 100).toFixed(1);
    
    logger.warn('Group price is higher than sum of individual prices', {
      groupPrice,
      sumOfIndividualPrices,
      difference,
      percentageHigher,
    });

    return `Warning: Group price (₹${groupPrice}) is ₹${difference} (${percentageHigher}%) higher than the sum of individual temple prices (₹${sumOfIndividualPrices}). Consider adjusting the group price or discount factor.`;
  }

  return null;
}


// ============================================================================
// Price Override Tracking (Task 6.7)
// ============================================================================

/**
 * Price override record
 */
export interface PriceOverride {
  entityId: string;
  entityType: EntityType;
  suggestedPrice: number;
  actualPrice: number;
  difference: number;
  differencePercent: number;
  reason?: string;
  setBy: string;
  createdAt: string;
}

/**
 * Override report filters
 */
export interface OverrideFilters {
  startDate?: string;
  endDate?: string;
  adminUserId?: string;
  minOverridePercent?: number;
  maxOverridePercent?: number;
  limit?: number;
}

/**
 * Override report result
 */
export interface OverrideReport {
  overrides: PriceOverride[];
  totalCount: number;
  averageOverridePercent: number;
}

/**
 * Record a price override when actual price differs from suggested price
 */
export async function recordPriceOverride(
  entityType: EntityType,
  entityId: string,
  suggestedPrice: number,
  actualPrice: number,
  reason: string | undefined,
  adminUserId: string
): Promise<void> {
  logger.info('Recording price override', { 
    entityType,
    entityId, 
    suggestedPrice, 
    actualPrice,
    adminUserId
  });

  // Validate input
  const validationResult = combineValidationResults(
    validateRequiredString(entityId, 'entityId'),
    validateNonNegativeNumber(suggestedPrice, 'suggestedPrice'),
    validateNonNegativeNumber(actualPrice, 'actualPrice'),
    validateRequiredString(adminUserId, 'adminUserId')
  );
  throwIfInvalid(validationResult);

  const now = generateTimestamp();
  const difference = actualPrice - suggestedPrice;
  const differencePercent = suggestedPrice > 0 
    ? (difference / suggestedPrice) * 100 
    : 0;

  // Store in DynamoDB
  const pk = generatePK(`OVERRIDE#${entityType}`, entityId);
  const sk = generateSK(`TIMESTAMP#${now}`);

  await putItem(config.tables.overrides, {
    PK: pk,
    SK: sk,
    entityId,
    entityType,
    suggestedPrice,
    actualPrice,
    difference,
    differencePercent,
    reason,
    setBy: adminUserId,
    createdAt: now,
    // GSI1 for sorting by override percentage
    GSI1PK: 'OVERRIDES',
    GSI1SK: `PERCENT#${String(Math.abs(differencePercent)).padStart(10, '0')}#ENTITY#${entityId}#${now}`,
  });

  logger.info('Price override recorded', { 
    entityId, 
    difference, 
    differencePercent 
  });
}

/**
 * Get override report with filtering
 */
export async function getOverrideReport(filters?: OverrideFilters): Promise<OverrideReport> {
  logger.info('Getting override report', { filters });

  let items: any[];

  // Query all overrides using GSI1 (sorted by percentage)
  items = await queryItems<any>(
    config.tables.overrides,
    'GSI1PK = :gsi1pk',
    {
      ':gsi1pk': 'OVERRIDES',
    },
    'GSI1'
  );

  // Map to PriceOverride objects
  let overrides: PriceOverride[] = items.map((item) => ({
    entityId: item.entityId,
    entityType: item.entityType,
    suggestedPrice: item.suggestedPrice,
    actualPrice: item.actualPrice,
    difference: item.difference,
    differencePercent: item.differencePercent,
    reason: item.reason,
    setBy: item.setBy,
    createdAt: item.createdAt,
  }));

  // Apply filters
  if (filters) {
    if (filters.startDate) {
      overrides = overrides.filter(o => o.createdAt >= filters.startDate!);
    }
    
    if (filters.endDate) {
      overrides = overrides.filter(o => o.createdAt <= filters.endDate!);
    }
    
    if (filters.adminUserId) {
      overrides = overrides.filter(o => o.setBy === filters.adminUserId);
    }
    
    if (filters.minOverridePercent !== undefined) {
      overrides = overrides.filter(o => Math.abs(o.differencePercent) >= filters.minOverridePercent!);
    }
    
    if (filters.maxOverridePercent !== undefined) {
      overrides = overrides.filter(o => Math.abs(o.differencePercent) <= filters.maxOverridePercent!);
    }
    
    if (filters.limit && filters.limit > 0) {
      overrides = overrides.slice(0, filters.limit);
    }
  }

  // Calculate average override percentage
  const averageOverridePercent = overrides.length > 0
    ? overrides.reduce((sum, o) => sum + Math.abs(o.differencePercent), 0) / overrides.length
    : 0;

  logger.info('Override report generated', { 
    totalCount: overrides.length,
    averageOverridePercent
  });

  return {
    overrides,
    totalCount: overrides.length,
    averageOverridePercent,
  };
}

/**
 * Calculate average override percentage across all overrides
 */
export async function calculateAverageOverridePercentage(): Promise<number> {
  logger.info('Calculating average override percentage');

  const report = await getOverrideReport();
  
  logger.info('Average override percentage calculated', { 
    average: report.averageOverridePercent 
  });

  return report.averageOverridePercent;
}


// ============================================================================
// Formula Simulation (Task 6.9)
// ============================================================================

/**
 * Simulation comparison entry
 */
export interface SimulationComparison {
  entityId: string;
  entityType: EntityType;
  qrCodeCount: number;
  currentPrice: number;
  newSuggestedPrice: number;
  difference: number;
  differencePercent: number;
}

/**
 * Simulation result with comparison table
 */
export interface SimulationResult {
  simulationId: string;
  testFormula: {
    basePrice: number;
    perQRCodePrice: number;
    roundingRule: RoundingRule;
    discountFactor: number;
  };
  comparisons: SimulationComparison[];
  summary: {
    totalEntities: number;
    averagePriceChange: number;
    minPrice: number;
    maxPrice: number;
    totalPriceIncrease: number;
    totalPriceDecrease: number;
  };
  createdAt: string;
}

/**
 * Simulate formula change without applying it
 * Tests a new formula against all pricing entities
 */
export async function simulateFormulaChange(
  basePrice: number,
  perQRCodePrice: number,
  roundingRule: RoundingRule,
  discountFactor: number,
  entities: Array<{ 
    entityId: string; 
    entityType: EntityType; 
    qrCodeCount: number; 
    currentPrice: number;
  }>
): Promise<SimulationResult> {
  logger.info('Simulating formula change', { 
    basePrice, 
    perQRCodePrice,
    discountFactor,
    entityCount: entities.length
  });

  // Validate input
  const validationResult = combineValidationResults(
    validateNonNegativeNumber(basePrice, 'basePrice'),
    validateNonNegativeNumber(perQRCodePrice, 'perQRCodePrice'),
    validateNonNegativeNumber(discountFactor, 'discountFactor')
  );
  throwIfInvalid(validationResult);

  if (discountFactor < 0 || discountFactor > 1) {
    throw new ValidationError('Discount factor must be between 0 and 1');
  }

  const simulationId = uuidv4();
  const comparisons: SimulationComparison[] = [];

  // Calculate new suggested prices for all entities
  for (const entity of entities) {
    // Calculate raw price with test formula
    let rawPrice = basePrice + (entity.qrCodeCount * perQRCodePrice);
    
    // Apply discount for groups
    if (entity.entityType === 'GROUP') {
      rawPrice = rawPrice * (1 - discountFactor);
    }
    
    // Apply rounding rules
    const newSuggestedPrice = applyRoundingRules(rawPrice, roundingRule);
    
    const difference = newSuggestedPrice - entity.currentPrice;
    const differencePercent = entity.currentPrice > 0 
      ? (difference / entity.currentPrice) * 100 
      : 0;

    comparisons.push({
      entityId: entity.entityId,
      entityType: entity.entityType,
      qrCodeCount: entity.qrCodeCount,
      currentPrice: entity.currentPrice,
      newSuggestedPrice,
      difference,
      differencePercent,
    });
  }

  // Calculate summary statistics
  const totalEntities = comparisons.length;
  const averagePriceChange = totalEntities > 0
    ? comparisons.reduce((sum, c) => sum + c.difference, 0) / totalEntities
    : 0;
  
  const prices = comparisons.map(c => c.newSuggestedPrice);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  
  const totalPriceIncrease = comparisons
    .filter(c => c.difference > 0)
    .reduce((sum, c) => sum + c.difference, 0);
  
  const totalPriceDecrease = Math.abs(comparisons
    .filter(c => c.difference < 0)
    .reduce((sum, c) => sum + c.difference, 0));

  const result: SimulationResult = {
    simulationId,
    testFormula: {
      basePrice,
      perQRCodePrice,
      roundingRule,
      discountFactor,
    },
    comparisons,
    summary: {
      totalEntities,
      averagePriceChange,
      minPrice,
      maxPrice,
      totalPriceIncrease,
      totalPriceDecrease,
    },
    createdAt: generateTimestamp(),
  };

  logger.info('Formula simulation completed', { 
    simulationId,
    totalEntities,
    averagePriceChange
  });

  return result;
}

/**
 * Apply a simulated formula to all entities
 * This commits the test formula as the active formula
 */
export async function applySimulatedFormula(
  simulationResult: SimulationResult,
  category: string,
  adminUserId: string
): Promise<PricingFormula> {
  logger.info('Applying simulated formula', { 
    simulationId: simulationResult.simulationId,
    category,
    adminUserId
  });

  // Set the new formula
  const formula = await setPricingFormula(
    category,
    simulationResult.testFormula.basePrice,
    simulationResult.testFormula.perQRCodePrice,
    simulationResult.testFormula.roundingRule,
    simulationResult.testFormula.discountFactor,
    adminUserId
  );

  logger.info('Simulated formula applied successfully', { 
    category,
    formulaId: formula.formulaId
  });

  return formula;
}
