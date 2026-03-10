/**
 * Jest Configuration for All Test Types
 * Supports unit, integration, and property-based tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/..'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../../src/**/*.{ts,tsx}',
    '../../backend/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '<rootDir>/../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/results/',
    '/coverage/',
  ],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  verbose: true,
  
  // Separate configurations for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/../unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/setup.ts'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/../integration/**/*.test.ts'],
      testTimeout: 30000,
      setupFilesAfterEnv: ['<rootDir>/setup.ts'],
    },
    {
      displayName: 'property-based',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/../property-based/**/*.test.ts'],
      testTimeout: 60000,
      setupFilesAfterEnv: ['<rootDir>/setup.ts'],
    },
  ],
};
