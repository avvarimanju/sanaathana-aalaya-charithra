/**
 * API Module Exports
 * Central export point for all API clients
 */

export * from './client';
export * from './templeApi';
export * from './pricingApi';
export * from './calculatorApi';
export * from './contentApi';
export * from './userApi';
export * from './defectApi';

// Re-export singleton instances for convenience
export { apiClient } from './client';
export { templeApi } from './templeApi';
export { pricingApi } from './pricingApi';
export { calculatorApi } from './calculatorApi';
