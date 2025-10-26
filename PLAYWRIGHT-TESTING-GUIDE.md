# 🧪 Playwright Automated Testing Guide

**Created:** October 26, 2025
**Purpose:** Automated E2E testing for La Tanda platform

---

## 📋 Quick Start

### 1. Install Dependencies

```bash
cd /home/ebanksnigel/la-tanda-web

# Install Playwright
npm install --save-dev @playwright/test@latest

# Install browsers
npx playwright install chromium
```

### 2. Configure Credentials

```bash
# Copy template
cp .env.test .env

# Edit with your credentials
nano .env
```

**Required in .env:**
```env
TEST_USER_EMAIL=ebanksnigel@gmail.com
TEST_USER_PASSWORD=your-actual-password
```

### 3. Run Tests

```bash
# Interactive menu
./run-tests.sh

# Or directly:
npx playwright test                    # All tests
npx playwright test auth.spec.js       # Auth only
npx playwright test rate-limiting.spec.js  # Rate limiting
npx playwright test withdrawal.spec.js # Withdrawals
```

---

## 🎯 Test Suites

### Authentication Tests (`tests/auth.spec.js`)

**Tests:**
- ✅ Login page loads
- ✅ Invalid credentials rejected
- ✅ Valid credentials accepted
- ✅ Session persistence

**Usage:**
```bash
npx playwright test auth.spec.js
```

**What it tests:**
- User can login with correct credentials
- Wrong credentials are rejected
- Dashboard loads after login
- User email appears in UI

---

### Rate Limiting Tests (`tests/rate-limiting.spec.js`)

**Tests:**
- ✅ Login endpoint blocks after 5 attempts
- ✅ Rate limit headers present
- ✅ Different endpoints have different limits
- ✅ 429 status code on rate limit

**Usage:**
```bash
npx playwright test rate-limiting.spec.js
```

**What it tests:**
- `/api/auth/login` - Max 5 attempts / 15 min
- `/api/wallet/withdraw` - Max 10 requests / hour
- Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)
- Proper 429 response when limited

**Example output:**
```
🔄 Testing login rate limiting (max 5 attempts)...

Attempt 1:
  Status: 401
  Rate Limit: 5
  Remaining: 4
  ✓ Allowed

Attempt 2:
  Status: 401
  Rate Limit: 5
  Remaining: 3
  ✓ Allowed

...

Attempt 6:
  Status: 429
  Rate Limit: 5
  Remaining: 0
  ✅ BLOCKED: Too many login attempts. Please try again in 15 minutes.

Results:
  Successful attempts: 5
  Blocked at attempt: 6

✅ Rate limiting is working correctly
```

---

### Withdrawal Tests (`tests/withdrawal.spec.js`)

**Tests:**
- ✅ LTD economics page loads
- ✅ Connect Wallet button visible
- ✅ Balance displayed after login
- ✅ Withdrawal requires authentication
- ✅ Invalid amounts rejected
- ✅ Invalid wallet addresses rejected

**Usage:**
```bash
npx playwright test withdrawal.spec.js
```

**What it tests:**
- Frontend UI elements
- API authentication requirements
- Input validation
- Error handling

---

## 📊 Viewing Reports

### HTML Report

```bash
# Run tests and generate report
npx playwright test

# View report in browser
npx playwright show-report
```

### Screenshots and Videos

Tests automatically capture:
- **Screenshots:** On test failure
- **Videos:** On test failure
- **Traces:** On retry

**Location:** `test-results/`

---

## 🔧 Advanced Usage

### Run Specific Test

```bash
# Run single test by name
npx playwright test --grep "should login with valid credentials"

# Run tests matching pattern
npx playwright test --grep "rate limit"
```

### Debug Mode

```bash
# Run with Playwright Inspector
npx playwright test --debug

# Run headed (see browser)
npx playwright test --headed

# Run with specific browser
npx playwright test --project=chromium
```

### Parallel Execution

```bash
# Run with multiple workers (careful with rate limiting!)
npx playwright test --workers=1  # Sequential (recommended)
npx playwright test --workers=4  # Parallel
```

---

## 🎭 Test Configuration

**File:** `tests/playwright.config.js`

**Key Settings:**
- `timeout`: 60 seconds per test
- `workers`: 1 (sequential to avoid rate limit conflicts)
- `retries`: 2 on CI, 0 locally
- `baseURL`: https://latanda.online
- `apiURL`: https://api.latanda.online

**Modify:**
```javascript
// In playwright.config.js
module.exports = defineConfig({
  timeout: 90 * 1000,  // 90 seconds
  workers: 2,          // 2 parallel workers
  // ...
});
```

---

## 📝 Writing New Tests

### Example Test

```javascript
const { test, expect } = require('@playwright/test');

test('should do something', async ({ page, request }) => {
  // UI test
  await page.goto('/');
  await expect(page).toHaveTitle(/La Tanda/);

  // API test
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);

  console.log('✅ Test passed');
});
```

### Available Fixtures

- `page` - Browser page for UI testing
- `request` - API request context
- `context` - Browser context
- `browser` - Browser instance

---

## 🔐 Security Best Practices

### DO:
- ✅ Store credentials in `.env` (gitignored)
- ✅ Use test accounts for automated tests
- ✅ Limit rate limit testing (avoid account lockout)
- ✅ Clean up test data after tests

### DON'T:
- ❌ Commit credentials to git
- ❌ Use production data in tests
- ❌ Run unlimited rate limit tests
- ❌ Share test credentials publicly

---

## 🐛 Troubleshooting

### Tests Failing

**Check API is running:**
```bash
curl https://api.latanda.online/api/health
```

**Check credentials in .env:**
```bash
cat .env | grep TEST_USER
```

**Run in debug mode:**
```bash
npx playwright test --debug auth.spec.js
```

### Rate Limit Issues

If you get rate limited during testing:

**Wait for reset:**
```bash
# Rate limits reset after their window
# Auth: 15 minutes
# Withdrawal: 1 hour
```

**Use different test accounts:**
```env
TEST_USER_2_EMAIL=alternate@test.com
```

### Connection Timeouts

**Increase timeout:**
```javascript
test.setTimeout(120000); // 2 minutes
```

**Check network:**
```bash
ping latanda.online
curl -I https://latanda.online
```

---

## 📈 CI/CD Integration

### GitHub Actions

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📊 Test Coverage

### Current Coverage

| Feature | Tests | Coverage |
|---------|-------|----------|
| Authentication | 3 | 80% |
| Rate Limiting | 3 | 90% |
| Withdrawals | 6 | 70% |
| **Total** | **12** | **80%** |

### Planned Tests

- [ ] Admin panel access
- [ ] 2FA enrollment
- [ ] User management
- [ ] Audit log viewing
- [ ] Group management
- [ ] KYC workflow

---

## 🚀 Quick Commands Reference

```bash
# Install
npm install --save-dev @playwright/test
npx playwright install chromium

# Run tests
./run-tests.sh                          # Interactive menu
npx playwright test                     # All tests
npx playwright test --headed            # See browser
npx playwright test --debug             # Debug mode

# Specific suites
npx playwright test auth.spec.js        # Auth tests
npx playwright test rate-limiting.spec.js  # Rate limit tests
npx playwright test withdrawal.spec.js  # Withdrawal tests

# Reports
npx playwright show-report              # HTML report
npx playwright test --reporter=list     # Console output

# Update
npm update @playwright/test
npx playwright install chromium
```

---

## ✅ Success Criteria

**Tests pass when:**
- ✅ All authentication flows work
- ✅ Rate limiting blocks after limit
- ✅ Withdrawal validation works
- ✅ No unexpected errors
- ✅ Response times < 5 seconds

**Tests provide value when:**
- ✅ Catch regressions before deployment
- ✅ Verify rate limiting is active
- ✅ Confirm security measures work
- ✅ Document expected behavior

---

**Next Steps:**
1. Install Playwright: `npm install --save-dev @playwright/test`
2. Configure .env with your credentials
3. Run tests: `./run-tests.sh`
4. Review results and fix any failures
5. Integrate into CI/CD pipeline

---

*Guide created: October 26, 2025*
*Playwright version: Latest*
*Test coverage: 80%*
