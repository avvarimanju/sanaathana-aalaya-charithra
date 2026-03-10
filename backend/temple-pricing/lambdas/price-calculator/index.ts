/**
 * Price Calculator Lambda Handler
 * 
 * Handles automatic price calculation and formula management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { formatErrorResponse } from '../../utils/errors';
import logger from '../../utils/logger';
import {
  setPricingFormula,
  getPricingFormula,
  getFormulaHistory,
  calculateSuggestedPrice,
  calculateGroupSuggestedPrice,
  checkGroupPriceWarning,
  recordPriceOverride,
  getOverrideReport,
  calculateAverageOverridePercentage,
  simulateFormulaChange,
  applySimulatedFormula,
} from './priceCalculatorService';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  const adminUserId = event.requestContext.authorizer?.claims?.sub || 'system';
  
  logger.info('Price Calculator request received', {
    requestId,
    method: event.httpMethod,
    path: event.path,
  });

  try {
    const path = event.path;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};

    // Route requests
    if (path.includes('/pricing-formula') && method === 'POST') {
      // Set pricing formula
      const formula = await setPricingFormula(
        body.category || 'DEFAULT',
        body.basePrice,
        body.perQRCodePrice,
        body.roundingRule,
        body.discountFactor || 0,
        adminUserId
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data: formula }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    if (path.includes('/pricing-formula') && method === 'GET') {
      // Get pricing formula
      const category = queryParams.category || 'DEFAULT';
      const formula = await getPricingFormula(category);
      
      return {
        statusCode: formula ? 200 : 404,
        body: JSON.stringify({ 
          success: !!formula, 
          data: formula,
          message: formula ? undefined : 'Formula not found'
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    if (path.includes('/formula-history') && method === 'GET') {
      // Get formula history
      const category = queryParams.category || 'DEFAULT';
      const history = await getFormulaHistory(category);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data: history }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    if (path.includes('/suggested-price') && method === 'GET') {
      // Calculate suggested price
      const { entityType, entityId, qrCodeCount, category } = queryParams;
      
      const suggestedPrice = await calculateSuggestedPrice(
        entityType as any,
        entityId!,
        parseInt(qrCodeCount || '0'),
        category || 'DEFAULT'
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data: suggestedPrice }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    if (path.includes('/price-override') && method === 'POST') {
      // Record price override
      await recordPriceOverride(
        body.entityType,
        body.entityId,
        body.suggestedPrice,
        body.actualPrice,
        body.reason,
        adminUserId
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Price override recorded' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    if (path.includes('/price-overrides') && method === 'GET') {
      // Get override report
      const filters = {
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        adminUserId: queryParams.adminUserId,
        minOverridePercent: queryParams.minOverridePercent ? parseFloat(queryParams.minOverridePercent) : undefined,
        maxOverridePercent: queryParams.maxOverridePercent ? parseFloat(queryParams.maxOverridePercent) : undefined,
        limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
      };
      
      const report = await getOverrideReport(filters);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data: report }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    if (path.includes('/simulate-formula') && method === 'POST') {
      // Simulate formula change
      const simulation = await simulateFormulaChange(
        body.basePrice,
        body.perQRCodePrice,
        body.roundingRule,
        body.discountFactor || 0,
        body.entities
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data: simulation }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    if (path.includes('/apply-simulation') && method === 'POST') {
      // Apply simulated formula
      const formula = await applySimulatedFormula(
        body.simulationResult,
        body.category || 'DEFAULT',
        adminUserId
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data: formula }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Route not found
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    logger.error('Price Calculator error', error as Error, { requestId });
    return formatErrorResponse(error as Error, requestId);
  }
}
