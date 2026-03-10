/**
 * Test Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.API_URL = 'http://localhost:4000';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup and teardown hooks
beforeAll(async () => {
  console.info('Starting test suite...');
});

afterAll(async () => {
  console.info('Test suite completed');
});
