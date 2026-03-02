/**
 * Pricing Management API
 * API client for pricing configuration and history
 */

import { apiClient } from './client';

export interface PriceConfiguration {
  entityId: string;
  entityType: 'TEMPLE' | 'GROUP';
  priceAmount: number;
  currency: string;
  isFree: boolean;
  effectiveDate: string;
  setBy: string;
  isOverride: boolean;
  overrideReason?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SetPriceRequest {
  entityId: string;
  entityType: 'TEMPLE' | 'GROUP';
  priceAmount: number;
  overrideReason?: string;
}

export interface PriceHistoryEntry {
  entityId: string;
  entityType: 'TEMPLE' | 'GROUP';
  priceAmount: number;
  effectiveDate: string;
  setBy: string;
  isOverride: boolean;
  overrideReason?: string;
  changeType: 'created' | 'updated' | 'deleted';
}

export interface PriceHistoryParams {
  entityType: 'TEMPLE' | 'GROUP';
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface PricingFormula {
  basePrice: number;
  perQRCodePrice: number;
  roundingRule: 'none' | 'nearest10' | 'nearest99' | 'nearest100';
  lastUpdated: string;
  updatedBy: string;
}

export interface PriceSuggestion {
  entityId: string;
  entityName: string;
  entityType: 'TEMPLE' | 'GROUP';
  qrCodeCount: number;
  currentPrice: number | null;
  suggestedPrice: number;
  difference: number | null;
}

export class PricingApi {
  /**
   * Set or update price configuration
   */
  async setPriceConfiguration(data: SetPriceRequest): Promise<PriceConfiguration> {
    return apiClient.post<PriceConfiguration>('/api/pricing/configure', data);
  }

  /**
   * Get price configuration for an entity
   */
  async getPriceConfiguration(
    entityId: string,
    entityType: 'TEMPLE' | 'GROUP'
  ): Promise<PriceConfiguration | null> {
    try {
      return await apiClient.get<PriceConfiguration>(`/api/pricing/${entityId}`, {
        entityType,
      });
    } catch (error) {
      // Return null if not found
      return null;
    }
  }

  /**
   * Get price history for an entity
   */
  async getPriceHistory(
    entityId: string,
    params: PriceHistoryParams
  ): Promise<PriceHistoryEntry[]> {
    return apiClient.get<PriceHistoryEntry[]>(`/api/pricing/${entityId}/history`, params);
  }

  /**
   * Batch set prices for multiple entities
   */
  async batchSetPrices(requests: SetPriceRequest[]): Promise<PriceConfiguration[]> {
    // Execute requests in parallel
    const promises = requests.map((req) => this.setPriceConfiguration(req));
    return Promise.all(promises);
  }

  /**
   * Get prices for multiple entities
   */
  async batchGetPrices(
    entities: Array<{ entityId: string; entityType: 'TEMPLE' | 'GROUP' }>
  ): Promise<Map<string, PriceConfiguration | null>> {
    const promises = entities.map(async ({ entityId, entityType }) => {
      const price = await this.getPriceConfiguration(entityId, entityType);
      return [entityId, price] as const;
    });

    const results = await Promise.all(promises);
    return new Map(results);
  }

  /**
   * Get pricing formula
   */
  async getPricingFormula(): Promise<PricingFormula> {
    return apiClient.get<PricingFormula>('/api/pricing/formula');
  }

  /**
   * Update pricing formula
   */
  async updatePricingFormula(formula: Partial<PricingFormula>): Promise<PricingFormula> {
    return apiClient.put<PricingFormula>('/api/pricing/formula', formula);
  }

  /**
   * Get price suggestions for all entities
   */
  async getPriceSuggestions(): Promise<{ items: PriceSuggestion[] }> {
    return apiClient.get<{ items: PriceSuggestion[] }>('/api/pricing/suggestions');
  }
}

// Export singleton instance
export const pricingApi = new PricingApi();
