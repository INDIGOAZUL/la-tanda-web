# E2E Testing Guide - Role System

**Issue**: #16
**Bounty**: 150 LTD + 100 LTD bonus = 250 LTD
**Last Updated**: 2026-03-04

## Overview

This guide explains how to run and maintain the end-to-end tests for the La Tanda role system. The tests cover user journeys, role permissions, edge cases, and visual regression testing.

## Test Coverage

### 1. User Journey Tests (6 tests)
- New user registration → default 'user' role
- Complete KYC → auto-upgrade to 'verified_user'
- Submit role application → pending status
- Admin approves application → role updated
- Admin rejects application → user notified
- Manual role assignment by admin

### 2. Role Permission Tests (5 tests)
- User tries to access admin panel → denied
- Admin tries to assign super_admin → denied
- Super_admin assigns administrator → success
- Coordinator creates tanda → success
- Unverified user creates tanda → denied

### 3. Edge Case Tests (4 tests)
- Apply for same role twice → error
- Apply while having pending application → error
- Session expires during application → redirect to login
- Role changes while user is online → UI updates

### 4. Visual Regression Tests (3 tests)
- Role application form renders correctly
- Admin panel displays all elements
- Mobile responsive layouts work

### 5. Cross-Browser Tests (1 test)
- Role system works in Chrome/Firefox/Safari

**Total**: 19 test cases

## Prerequisites

### 1. Install Dependencies

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Base URLs
BASE_URL=https://latanda.online
API_URL=https://api.latanda.online

# Test Users
TEST_VERIFIED_USER_EMAIL=verified@latanda.test
TEST_VERIFIED_USER_PASSWORD=VerifiedPass123!

TEST_ADMIN_EMAIL=admin@latanda.test
TEST_ADMIN_PASSWORD=AdminPass123!

TEST_SUPER_ADMIN_EMAIL=superadmin@latanda.test
TEST_SUPER_ADMIN_PASSWORD=SuperAdminPass123!

TEST_COORDINATOR_EMAIL=coordinator@latanda.test
TEST_COORDINATOR_PASSWORD=CoordinatorPass123!
```

### 3. Test Data Setup

Before running tests, ensure you have:
- Test users with different roles (user, verified_user, admin, super_admin, coordinator)
- Access to admin panel for role management tests
- KYC functionality enabled (or mock endpoints)

## Running Tests

### Run All Tests

```bash
npx playwright test tests/role-system.spec.js
```

### Run Specific Test Suite

```bash
# User journey tests only
npx playwright test tests/role-system.spec.js -g "User Journey"

# Permission tests only
npx playwright test tests/role-system.spec.js -g "Role Permission"

# Edge case tests only
npx playwright test tests/role-system.spec.js -g "Edge Case"

# Visual regression tests only
npx playwright test tests/role-system.spec.js -g "Visual Regression"
```

### Run in Different Browsers

```bash
# Chrome (default)
npx playwright test tests/role-system.spec.js --project=chromium

# Firefox
npx playwright test tests/role-system.spec.js --project=firefox

# Safari
npx playwright test tests/role-system.spec.js --project=webkit
```

### Run in Headed Mode (See Browser)

```bash
npx playwright test tests/role-system.spec.js --headed
```

### Run in Debug Mode

```bash
npx playwright test tests/role-system.spec.js --debug
```

### Run with UI Mode

```bash
npx playwright test tests/role-system.spec.js --ui
```

## Test Reports

### Generate HTML Report

```bash
npx playwright test tests/role-system.spec.js --reporter=html
npx playwright show-report
```

### Generate Coverage Report

```bash
npx playwright test tests/role-system.spec.js --reporter=html,json
```

Reports are saved in:
- `playwright-report/` - HTML report
- `test-results/` - Screenshots and videos

## CI/CD Integration

### GitHub Actions

The tests run automatically on:
- Pull requests to `main` branch
- Push to `main` branch
- Manual workflow dispatch

See `.github/workflows/e2e-tests.yml` for configuration.

### Running Tests in CI

```bash
# CI mode (no retries, fail fast)
npx playwright test tests/role-system.spec.js --reporter=github
```

## Test Maintenance

### Adding New Tests

1. Add test case to appropriate `test.describe()` block
2. Follow existing naming convention: `X.Y Test description`
3. Use helper functions for common operations (login, logout, getUserRole)
4. Add assertions with clear error messages
5. Update this guide with new test coverage

### Updating Test Data

If role system changes:
1. Update `FEATURE_ACCESS` matrix in test file
2. Update test user credentials in `.env`
3. Update expected behaviors in assertions
4. Re-run all tests to verify

### Debugging Failed Tests

1. **Check screenshots**: `test-results/` folder
2. **Check videos**: `test-results/` folder (if enabled)
3. **Check trace**: `npx playwright show-trace trace.zip`
4. **Run in headed mode**: `--headed` flag
5. **Run in debug mode**: `--debug` flag

### Common Issues

**Issue**: Tests fail with "Element not found"
- **Solution**: Increase `waitForTimeout` or use `waitForSelector`

**Issue**: Tests fail with "Authentication required"
- **Solution**: Check test user credentials in `.env`

**Issue**: Tests fail with "Access denied"
- **Solution**: Verify test user has correct role

**Issue**: Visual regression tests fail
- **Solution**: Update baseline screenshots if UI changed intentionally

## Test Configuration

### Playwright Config

See `tests/playwright.config.js` for:
- Base URL configuration
- Timeout settings
- Retry logic
- Browser projects
- Reporter settings

### Modifying Config

```javascript
// tests/playwright.config.js
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000, // 60 seconds per test
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Sequential execution
  use: {
    baseURL: 'https://latanda.online',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

## Best Practices

### 1. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up test data after each test

### 2. Stable Selectors
- Use data attributes: `[data-testid="role-select"]`
- Avoid CSS classes that may change
- Use semantic selectors when possible

### 3. Explicit Waits
- Use `waitForSelector` instead of `waitForTimeout`
- Wait for network requests to complete
- Wait for animations to finish

### 4. Error Handling
- Add try-catch for optional elements
- Use `test.skip()` for unavailable features
- Log meaningful error messages

### 5. Performance
- Run tests in parallel when possible
- Use `test.describe.configure({ mode: 'parallel' })`
- Minimize unnecessary waits

## Bonus Features

### Visual Regression Testing (+50 LTD)

Using Percy or Chromatic:

```bash
# Install Percy
npm install --save-dev @percy/cli @percy/playwright

# Run with Percy
npx percy exec -- npx playwright test tests/role-system.spec.js
```

### Load Testing (+50 LTD)

Using k6 or Artillery:

```bash
# Install k6
brew install k6

# Run load test
k6 run load-tests/role-applications.js
```

## Troubleshooting

### Test Environment Issues

**Problem**: Tests pass locally but fail in CI
- Check environment variables in CI
- Verify test data exists in CI environment
- Check network connectivity

**Problem**: Flaky tests (pass/fail randomly)
- Add explicit waits
- Increase timeout values
- Check for race conditions

**Problem**: Slow test execution
- Run tests in parallel
- Reduce unnecessary waits
- Use faster selectors

### Role System Issues

**Problem**: Role not updating after assignment
- Check WebSocket connection
- Verify database transaction committed
- Check cache invalidation

**Problem**: Permission checks failing
- Verify role hierarchy in `ROLE_HIERARCHY`
- Check feature access matrix
- Verify JWT token contains correct role

## Contributing

When adding new role system features:
1. Add corresponding E2E tests
2. Update this guide
3. Run full test suite before PR
4. Include test results in PR description

## Support

For issues or questions:
- GitHub Issue: #16
- Discord: La Tanda Community
- Email: dev@latanda.online

## License

MIT License - La Tanda Platform

---

**Test Suite Status**: ✅ Ready for execution
**Coverage**: 19 test cases across 5 categories
**Estimated Runtime**: 5-10 minutes (all tests)
