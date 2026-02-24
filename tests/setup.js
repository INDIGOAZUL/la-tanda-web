// tests/setup.js
// Set test environment variables
process.env.NODE_ENV = 'test';

// Configure Jest timeouts if needed
jest.setTimeout(10000); // 10 seconds

// Global test setup
beforeAll(() => {
  console.log('Starting test suite');
});

// Global test teardown
afterAll(() => {
  console.log('Test suite complete');
});
