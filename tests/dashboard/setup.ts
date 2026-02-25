/**
 * Test setup for Dashboard feature tests
 * Configures Jest and fast-check for property-based testing
 */

import fc from 'fast-check';

// Configure fast-check global settings
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations for property tests as per design doc
  verbose: process.env.VERBOSE_TESTS === 'true',
  seed: process.env.FC_SEED ? parseInt(process.env.FC_SEED) : undefined,
  endOnFailure: false
});

// Set up test environment
beforeAll(() => {
  // Set timezone to UTC for consistent date/time testing
  process.env.TZ = 'UTC';
});

afterAll(() => {
  // Cleanup
});

// Global test utilities
export const testConfig = {
  propertyTestRuns: 100,
  timeout: 30000
};
