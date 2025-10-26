/**
 * Playwright Configuration for La Tanda Testing
 *
 * Tests:
 * - Authentication flow
 * - Rate limiting
 * - Withdrawal functionality
 * - Admin panel access
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests sequentially for rate limit testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid rate limit conflicts

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'https://latanda.online',

    // API endpoint
    apiURL: process.env.API_URL || 'https://api.latanda.online',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  // Test projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Local dev server (optional)
  // webServer: {
  //   command: 'python3 -m http.server 8080',
  //   port: 8080,
  //   reuseExistingServer: !process.env.CI,
  // },
});
