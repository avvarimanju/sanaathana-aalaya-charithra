/**
 * Price Calculator API
 * API client for pricing formula management and simulation
 */

import { apiClient } from './client';

export interface RoundingRule {
  type: 'nearest10' | 'nearest5' | 'ceil' | 'floor' | 'none';
  direction: 'nearest' | 'up' | 'down';
}

export interface CalculatorPricingFormula {
  category: string;
  basePrice: number;
  perQRCodePrice: number;
  roundingRule: RoundingRule;
  discountFactor: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export interface SetFormulaRequest {
  category: string;
  basePrice: number;
  perQRCodePrice: number;
  roundingRule: RoundingRule;
  discountFactor: number;
}

export interface SuggestedPriceRequest {
  entityId: string;
  entityType: 'TEMPLE' | 'GROUP';
  qrCodeCount: number;
}

export interface PriceCalculation {
  baseAmount: number;
  qrCodeAmount: number;
  subtotal: number;
  discount: number;
  beforeRounding: number;
  afterRounding: number;
}

export interface SuggestedPriceResult {
  entityId: string;
  entityType: 'TEMPLE' | 'GROUP';
  qrCodeCount: number;
  suggestedPrice: number;
  formula: {
    basePrice: number;
    perQRCodePrice: number;
    discountFactor: number;
  };
  calculation: PriceCalculation;
}

export interface SimulationEntity {
  entityId: string;
  entityType: 'TEMPLE' | 'GROUP';
  qrCodeCount: number;
}

export interface SimulationRequest {
  basePrice: number;
  perQRCodePrice: number;
  roundingRule: RoundingRule;
  discountFactor: number;
  entities: SimulationEntity[];
}

export interface SimulationResult {
  entityId: string;
  entityType: 'TEMPLE' | 'GROUP';
  qrCodeCount: number;
  currentPrice: number;
  suggestedPrice: number;
  difference: number;
  percentageChange: number;
}

export interface SimulationResponse {
  formula: {
    basePrice: number;
    perQRCodePrice: number;
    roundingRule: RoundingRule;
    discountFactor: number;
  };
  results: SimulationResult[];
  summary: {
    totalEntities: number;
    averageIncrease: number;
    entitiesWithIncrease: number;
    entitiesWithDecrease: number;
  };
}

export class CalculatorApi {
  /**
   * Set or update pricing formula
   */
  async setPricingFormula(data: SetFormulaRequest): Promise<PricingFormula> {
    return apiClient.post<PricingFormula>('/api/calculator/formula', data);
  }

  /**
   * Calculate suggested price for an entity
   */
  async calculateSuggestedPrice(data: SuggestedPriceRequest): Promise<SuggestedPriceResult> {
    return apiClient.post<SuggestedPriceResult>('/api/calculator/suggest', data);
  }

  /**
   * Simulate formula change across multiple entities
   */
  async simulateFormulaChange(data: SimulationRequest): Promise<SimulationResponse> {
    return apiClient.post<SimulationResponse>('/api/calculator/simulate', data);
  }

  /**
   * Calculate suggested prices for multiple entities
   */
  async batchCalculateSuggestedPrices(
    requests: SuggestedPriceRequest[]
  ): Promise<SuggestedPriceResult[]> {
    const promises = requests.map((req) => this.calculateSuggestedPrice(req));
    return Promise.all(promises);
  }
}

// Export singleton instance
export const calculatorApi = new CalculatorApi();
