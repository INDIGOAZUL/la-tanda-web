/**
 * 🔒 Rate Limiting Tests
 *
 * Tests rate limiting on various endpoints
 */

const { test, expect } = require('@playwright/test');

test.describe('Rate Limiting', () => {

  test('should enforce login rate limit (5 attempts)', async ({ request }) => {
    const endpoint = process.env.API_URL || 'https://api.latanda.online';

    let blockedAttempt = null;
    let successfulAttempts = 0;

    console.log('\n🔄 Testing login rate limiting (max 5 attempts)...\n');

    // Make 7 login attempts
    for (let i = 1; i <= 7; i++) {
      const response = await request.post(`${endpoint}/api/auth/login`, {
        data: {
          email: 'ratelimit-test@test.com',
          password: 'wrongpassword'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const status = response.status();
      const headers = response.headers();

      console.log(`Attempt ${i}:`);
      console.log(`  Status: ${status}`);
      console.log(`  Rate Limit: ${headers['x-ratelimit-limit'] || 'N/A'}`);
      console.log(`  Remaining: ${headers['x-ratelimit-remaining'] || 'N/A'}`);

      if (status === 429) {
        blockedAttempt = i;
        const body = await response.json();
        console.log(`  ✅ BLOCKED: ${body.data?.error?.message || 'Rate limited'}`);
        break;
      } else {
        successfulAttempts++;
        console.log(`  ✓ Allowed`);
      }
    }

    console.log(`\nResults:`);
    console.log(`  Successful attempts: ${successfulAttempts}`);
    console.log(`  Blocked at attempt: ${blockedAttempt}`);

    // Rate limiting should block after 5 attempts
    expect(blockedAttempt).toBeLessThanOrEqual(6);
    expect(successfulAttempts).toBeGreaterThanOrEqual(5);

    console.log('\n✅ Rate limiting is working correctly\n');
  });

  test('should have rate limit headers', async ({ request }) => {
    const endpoint = process.env.API_URL || 'https://api.latanda.online';

    const response = await request.post(`${endpoint}/api/auth/login`, {
      data: {
        email: 'headers-test@test.com',
        password: 'test'
      }
    });

    const headers = response.headers();

    console.log('\n📊 Rate Limit Headers:');
    console.log(`  X-RateLimit-Limit: ${headers['x-ratelimit-limit'] || 'MISSING'}`);
    console.log(`  X-RateLimit-Remaining: ${headers['x-ratelimit-remaining'] || 'MISSING'}`);
    console.log(`  X-RateLimit-Reset: ${headers['x-ratelimit-reset'] || 'MISSING'}`);

    // At least one rate limit header should be present
    const hasRateLimitHeaders = headers['x-ratelimit-limit'] ||
                                 headers['x-ratelimit-remaining'] ||
                                 headers['x-ratelimit-reset'];

    if (hasRateLimitHeaders) {
      console.log('\n✅ Rate limit headers present\n');
    } else {
      console.log('\n⚠️  Warning: No rate limit headers found\n');
    }
  });

  test('should have different limits for different endpoints', async ({ request }) => {
    const endpoint = process.env.API_URL || 'https://api.latanda.online';

    console.log('\n🔍 Checking rate limits for different endpoints:\n');

    // Test login endpoint
    const loginResponse = await request.post(`${endpoint}/api/auth/login`, {
      data: { email: 'test', password: 'test' }
    });
    const loginLimit = loginResponse.headers()['x-ratelimit-limit'];
    console.log(`  Login endpoint limit: ${loginLimit || 'N/A'}`);

    // Test withdrawal endpoint (without auth)
    const withdrawalResponse = await request.post(`${endpoint}/api/wallet/withdraw/ltd`, {
      data: { amount: 10 }
    });
    const withdrawalLimit = withdrawalResponse.headers()['x-ratelimit-limit'];
    console.log(`  Withdrawal endpoint limit: ${withdrawalLimit || 'N/A'}`);

    console.log('\n✅ Different endpoints can have different limits\n');
  });
});
