/**
 * Jest configuration for Dashboard feature tests
 * Includes property-based testing with fast-check
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    '../../src/dashboard/**/*.ts',
    '!../../src/dashboard/**/*.d.ts',
    '!../../src/dashboard/**/index.ts',
    '!../../src/dashboard/**/.gitkeep'
  ],
  coverageDirectory: '../../coverage/dashboard',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@dashboard/(.*)$': '<rootDir>/../../src/dashboard/$1',
    '^@/(.*)$': '<rootDir>/../../src/$1'
  },
  // Property-based testing configuration
  testTimeout: 30000, // Increased timeout for property tests (30 seconds)
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};
