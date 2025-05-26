// Test setup file for Jest
require('dotenv').config({ path: '.env.test' });

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test configuration
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 