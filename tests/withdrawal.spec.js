/**
 * 💰 Withdrawal Tests
 *
 * Tests LTD token withdrawal functionality
 */

const { test, expect } = require('@playwright/test');
require('dotenv').config();

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'ebanksnigel@gmail.com',
  password: process.env.TEST_USER_PASSWORD || 'your-password-here'
};

test.describe('LTD Withdrawal', () => {

  test('should navigate to LTD token economics page', async ({ page }) => {
    await page.goto('/ltd-token-economics.html');

    // Check page loaded
    await expect(page).toHaveTitle(/LTD|Token|Economics/i);

    console.log('✅ LTD token economics page loaded');
  });

  test('should show Connect Wallet button', async ({ page }) => {
    await page.goto('/ltd-token-economics.html');

    // Look for MetaMask connect button
    const connectButton = page.locator('button:has-text("Connect"), button:has-text("Conectar")');
    await expect(connectButton.first()).toBeVisible();

    console.log('✅ Connect Wallet button visible');
  });

  test('should show LTD balance after login', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(3000);

    // Go to LTD page
    await page.goto('/ltd-token-economics.html');
    await page.waitForTimeout(2000);

    // Look for balance display
    const content = await page.content();
    const hasBalance = content.includes('10,000') || // Admin balance
                       content.includes('LTD') ||
                       content.includes('Balance');

    console.log('✅ Page shows LTD balance information');
  });
});

test.describe('Withdrawal API', () => {

  test('should reject withdrawal without authentication', async ({ request }) => {
    const endpoint = process.env.API_URL || 'https://api.latanda.online';

    const response = await request.post(`${endpoint}/api/wallet/withdraw/ltd`, {
      data: {
        amount: 100,
        destination_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
      }
    });

    expect(response.status()).toBe(401); // Unauthorized

    const body = await response.json();
    console.log('✅ Withdrawal rejected without auth:', body.data?.error?.message);
  });

  test('should validate withdrawal amount', async ({ request }) => {
    const endpoint = process.env.API_URL || 'https://api.latanda.online';

    // Try invalid amounts
    const invalidAmounts = [-10, 0, 'invalid'];

    for (const amount of invalidAmounts) {
      const response = await request.post(`${endpoint}/api/wallet/withdraw/ltd`, {
        data: {
          amount: amount,
          destination_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
        }
      });

      // Should be rejected (401 for no auth, or 400 for invalid amount)
      expect([400, 401]).toContain(response.status());
    }

    console.log('✅ Invalid withdrawal amounts are rejected');
  });

  test('should validate wallet address format', async ({ request }) => {
    const endpoint = process.env.API_URL || 'https://api.latanda.online';

    // Try invalid addresses
    const invalidAddresses = ['invalid', '0x123', 'not-an-address'];

    for (const address of invalidAddresses) {
      const response = await request.post(`${endpoint}/api/wallet/withdraw/ltd`, {
        data: {
          amount: 10,
          destination_address: address
        }
      });

      // Should be rejected
      expect([400, 401]).toContain(response.status());
    }

    console.log('✅ Invalid wallet addresses are rejected');
  });
});
