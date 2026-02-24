// jest.config.js
module.exports = {
  testEnvironment: "node",
  verbose: true,
  projects: [
    {
      displayName: "unit",
      testMatch: ["**/tests/api/**/*.test.js", "**/tests/middleware/**/*.test.js"],
      setupFilesAfterEnv: ["./tests/setup.js"],
      collectCoverage: true,
      collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
      coverageThreshold: {
        global: { branches: 70, functions: 70, lines: 70, statements: 70 }
      }
    },
    {
      displayName: "integration",
      testMatch: ["**/tests/integration/**/*.test.js"],
      testTimeout: 30000,
      collectCoverage: false
    }
  ]
};