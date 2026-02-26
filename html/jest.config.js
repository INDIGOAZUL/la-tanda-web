export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { branches: 60, functions: 60, lines: 60, statements: 60 }
  },
  collectCoverageFrom: ['*.js', '\!node_modules/**', '\!dist/**', '\!coverage/**'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  verbose: true
};
