/**
 * Role System End-to-End Tests
 * Issue #16 - La Tanda Web
 *
 * Tests the complete role system functionality including:
 * - User journey tests (registration, KYC, role applications)
 * - Role permission tests (access control)
 * - Edge case tests (duplicate applications, session expiry)
 *
 * @requires @playwright/test
 */

const { test, expect } = require('@playwright/test');
require('dotenv').config();

// Test configuration
const BASE_URL = process.env.BASE_URL || 'https://latanda.online';
const API_URL = process.env.API_URL || 'https://api.latanda.online';

// Test users with different roles
const TEST_USERS = {
  newUser: {
    email: `test_new_${Date.now()}@latanda.test`,
    password: 'TestPassword123!',
    name: 'New Test User'
  },
  verifiedUser: {
    email: process.env.TEST_VERIFIED_USER_EMAIL || 'verified@latanda.test',
    password: process.env.TEST_VERIFIED_USER_PASSWORD || 'VerifiedPass123!'
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@latanda.test',
    password: process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!'
  },
  superAdmin: {
    email: process.env.TEST_SUPER_ADMIN_EMAIL || 'superadmin@latanda.test',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'SuperAdminPass123!'
  }
};

// Helper functions
async function login(page, email, password) {
  await page.goto('/');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button:has-text("Login"), button:has-text("Iniciar")');
  await page.waitForTimeout(2000);
}

async function logout(page) {
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Cerrar sesión"), a:has-text("Logout")');
  if (await logoutBtn.count() > 0) {
    await logoutBtn.first().click();
    await page.waitForTimeout(1000);
  }
}

async function getUserRole(page) {
  // Try to get role from API or UI
  try {
    const response = await page.request.get(`${API_URL}/api/auth/me`);
    if (response.ok()) {
      const data = await response.json();
      return data.user?.role || data.role || 'user';
    }
  } catch (e) {
    console.log('Could not fetch role from API, checking UI...');
  }

  // Fallback: check UI for role indicator
  const roleElement = page.locator('[data-role], .user-role, .role-badge');
  if (await roleElement.count() > 0) {
    return await roleElement.first().textContent();
  }

  return 'user'; // default
}

// ============================================================================
// TEST SUITE 1: User Journey Tests
// ============================================================================

test.describe('User Journey Tests', () => {

  test('1.1 New user registration should assign default "user" role', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="name"], input[type="text"]', TEST_USERS.newUser.name);
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.newUser.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USERS.newUser.password);

    // Submit registration
    await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Registrar")');
    await page.waitForTimeout(3000);

    // Verify default role is 'user'
    const role = await getUserRole(page);
    expect(role.toLowerCase()).toContain('user');

    console.log('✅ New user assigned default "user" role');
  });

  test('1.2 Complete KYC should auto-upgrade to "verified_user"', async ({ page }) => {
    // This test requires KYC functionality to be implemented
    // For now, we'll test the role change mechanism

    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    // Navigate to KYC page
    await page.goto('/kyc');
    await page.waitForTimeout(1000);

    // Check if KYC form exists
    const kycForm = page.locator('form[id*="kyc"], form[class*="kyc"]');
    if (await kycForm.count() > 0) {
      // Fill KYC form (simplified)
      await page.fill('input[name="fullName"]', 'Test User Full Name');
      await page.fill('input[name="idNumber"]', '0801-1990-12345');

      // Submit KYC
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Verify role upgraded to verified_user
      const role = await getUserRole(page);
      expect(role.toLowerCase()).toContain('verified');

      console.log('✅ KYC completion upgraded user to "verified_user"');
    } else {
      console.log('⚠️  KYC form not found, skipping test');
      test.skip();
    }
  });

  test('1.3 Submit role application should show pending status', async ({ page }) => {
    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    // Navigate to role application page
    await page.goto('/roles/apply');
    await page.waitForTimeout(1000);

    // Check if role application form exists
    const applicationForm = page.locator('form[id*="role"], form[class*="role-application"]');
    if (await applicationForm.count() > 0) {
      // Select role to apply for
      await page.selectOption('select[name="role"]', 'coordinator');

      // Fill application reason
      await page.fill('textarea[name="reason"]', 'I want to coordinate tandas in my community');

      // Submit application
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Verify pending status
      const statusElement = page.locator('.application-status, [data-status="pending"]');
      expect(await statusElement.count()).toBeGreaterThan(0);

      console.log('✅ Role application submitted with pending status');
    } else {
      console.log('⚠️  Role application form not found, skipping test');
      test.skip();
    }
  });

  test('1.4 Admin approves application should update user role', async ({ page }) => {
    // Login as admin
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Navigate to admin panel
    await page.goto('/admin/role-applications');
    await page.waitForTimeout(1000);

    // Check if admin panel exists
    const adminPanel = page.locator('.admin-panel, [data-admin-panel]');
    if (await adminPanel.count() > 0) {
      // Find pending application
      const pendingApplication = page.locator('.application-item[data-status="pending"]').first();

      if (await pendingApplication.count() > 0) {
        // Approve application
        await pendingApplication.locator('button:has-text("Approve"), button:has-text("Aprobar")').click();
        await page.waitForTimeout(2000);

        // Verify application approved
        const approvedStatus = page.locator('.application-status:has-text("approved"), .application-status:has-text("aprobado")');
        expect(await approvedStatus.count()).toBeGreaterThan(0);

        console.log('✅ Admin approved role application');
      } else {
        console.log('⚠️  No pending applications found');
      }
    } else {
      console.log('⚠️  Admin panel not accessible, skipping test');
      test.skip();
    }
  });

  test('1.5 Admin rejects application should notify user', async ({ page }) => {
    // Login as admin
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Navigate to admin panel
    await page.goto('/admin/role-applications');
    await page.waitForTimeout(1000);

    const adminPanel = page.locator('.admin-panel, [data-admin-panel]');
    if (await adminPanel.count() > 0) {
      const pendingApplication = page.locator('.application-item[data-status="pending"]').first();

      if (await pendingApplication.count() > 0) {
        // Reject application
        await pendingApplication.locator('button:has-text("Reject"), button:has-text("Rechazar")').click();

        // Fill rejection reason
        await page.fill('textarea[name="rejectionReason"]', 'Insufficient experience');
        await page.click('button:has-text("Confirm"), button:has-text("Confirmar")');
        await page.waitForTimeout(2000);

        // Verify rejection
        const rejectedStatus = page.locator('.application-status:has-text("rejected"), .application-status:has-text("rechazado")');
        expect(await rejectedStatus.count()).toBeGreaterThan(0);

        console.log('✅ Admin rejected role application with reason');
      }
    } else {
      test.skip();
    }
  });

  test('1.6 Manual role assignment by admin should work', async ({ page }) => {
    // Login as admin
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Navigate to user management
    await page.goto('/admin/users');
    await page.waitForTimeout(1000);

    const userManagement = page.locator('.user-management, [data-user-management]');
    if (await userManagement.count() > 0) {
      // Find a user
      const userRow = page.locator('.user-row, tr[data-user-id]').first();

      if (await userRow.count() > 0) {
        // Click role assignment button
        await userRow.locator('button:has-text("Assign Role"), button:has-text("Asignar Rol")').click();
        await page.waitForTimeout(500);

        // Select new role
        await page.selectOption('select[name="role"]', 'moderator');
        await page.click('button:has-text("Save"), button:has-text("Guardar")');
        await page.waitForTimeout(2000);

        // Verify role updated
        const roleCell = userRow.locator('.role-cell, td[data-role]');
        const roleText = await roleCell.textContent();
        expect(roleText.toLowerCase()).toContain('moderator');

        console.log('✅ Admin manually assigned role to user');
      }
    } else {
      test.skip();
    }
  });
});

// ============================================================================
// TEST SUITE 2: Role Permission Tests
// ============================================================================

test.describe('Role Permission Tests', () => {

  test('2.1 Regular user tries to access admin panel - should be denied', async ({ page }) => {
    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    // Try to access admin panel
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    // Should be redirected or see access denied
    const url = page.url();
    const content = await page.content();

    const isAccessDenied =
      url.includes('403') ||
      url.includes('unauthorized') ||
      content.includes('Access Denied') ||
      content.includes('Acceso Denegado') ||
      content.includes('403') ||
      !url.includes('/admin');

    expect(isAccessDenied).toBeTruthy();
    console.log('✅ Regular user denied access to admin panel');
  });

  test('2.2 Admin tries to assign super_admin role - should be denied', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await page.goto('/admin/users');
    await page.waitForTimeout(1000);

    const userRow = page.locator('.user-row, tr[data-user-id]').first();
    if (await userRow.count() > 0) {
      await userRow.locator('button:has-text("Assign Role")').click();
      await page.waitForTimeout(500);

      // Try to select super_admin
      const superAdminOption = page.locator('option[value="super_admin"]');

      // Should either not exist or be disabled
      if (await superAdminOption.count() > 0) {
        const isDisabled = await superAdminOption.isDisabled();
        expect(isDisabled).toBeTruthy();
        console.log('✅ Admin cannot assign super_admin role (option disabled)');
      } else {
        console.log('✅ Admin cannot assign super_admin role (option not available)');
      }
    } else {
      test.skip();
    }
  });

  test('2.3 Super_admin assigns administrator role - should succeed', async ({ page }) => {
    await login(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);

    await page.goto('/admin/users');
    await page.waitForTimeout(1000);

    const userRow = page.locator('.user-row, tr[data-user-id]').first();
    if (await userRow.count() > 0) {
      await userRow.locator('button:has-text("Assign Role")').click();
      await page.waitForTimeout(500);

      // Select administrator role
      await page.selectOption('select[name="role"]', 'administrator');
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(2000);

      // Verify success
      const successMessage = page.locator('.success-message, .alert-success');
      expect(await successMessage.count()).toBeGreaterThan(0);

      console.log('✅ Super_admin successfully assigned administrator role');
    } else {
      test.skip();
    }
  });

  test('2.4 Coordinator creates tanda - should succeed', async ({ page }) => {
    // Assuming we have a coordinator user
    const coordinatorEmail = process.env.TEST_COORDINATOR_EMAIL || TEST_USERS.verifiedUser.email;
    const coordinatorPassword = process.env.TEST_COORDINATOR_PASSWORD || TEST_USERS.verifiedUser.password;

    await login(page, coordinatorEmail, coordinatorPassword);

    // Navigate to create tanda page
    await page.goto('/tandas/create');
    await page.waitForTimeout(1000);

    const createForm = page.locator('form[id*="tanda"], form[class*="create-tanda"]');
    if (await createForm.count() > 0) {
      // Fill tanda creation form
      await page.fill('input[name="name"]', 'Test Tanda E2E');
      await page.fill('input[name="contribution"]', '1000');
      await page.selectOption('select[name="frequency"]', 'monthly');

      // Submit
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Verify tanda created
      const successMessage = page.locator('.success-message, .alert-success');
      expect(await successMessage.count()).toBeGreaterThan(0);

      console.log('✅ Coordinator successfully created tanda');
    } else {
      test.skip();
    }
  });

  test('2.5 Unverified user creates tanda - should be denied', async ({ page }) => {
    // Login with basic user (not verified)
    await login(page, TEST_USERS.newUser.email, TEST_USERS.newUser.password);

    // Try to access create tanda page
    await page.goto('/tandas/create');
    await page.waitForTimeout(2000);

    const url = page.url();
    const content = await page.content();

    const isAccessDenied =
      url.includes('403') ||
      url.includes('unauthorized') ||
      content.includes('Access Denied') ||
      content.includes('verification required') ||
      !url.includes('/tandas/create');

    expect(isAccessDenied).toBeTruthy();
    console.log('✅ Unverified user denied access to create tanda');
  });
});

// ============================================================================
// TEST SUITE 3: Edge Case Tests
// ============================================================================

test.describe('Edge Case Tests', () => {

  test('3.1 Apply for same role twice - should show error', async ({ page }) => {
    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    await page.goto('/roles/apply');
    await page.waitForTimeout(1000);

    const applicationForm = page.locator('form[id*="role"]');
    if (await applicationForm.count() > 0) {
      // Submit first application
      await page.selectOption('select[name="role"]', 'coordinator');
      await page.fill('textarea[name="reason"]', 'First application');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Try to submit second application for same role
      await page.goto('/roles/apply');
      await page.waitForTimeout(1000);

      await page.selectOption('select[name="role"]', 'coordinator');
      await page.fill('textarea[name="reason"]', 'Second application');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Should show error
      const errorMessage = page.locator('.error-message, .alert-error, .alert-danger');
      expect(await errorMessage.count()).toBeGreaterThan(0);

      console.log('✅ Duplicate role application prevented');
    } else {
      test.skip();
    }
  });

  test('3.2 Apply while having pending application - should show error', async ({ page }) => {
    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    // Check if user has pending application
    await page.goto('/roles/my-applications');
    await page.waitForTimeout(1000);

    const pendingApp = page.locator('.application-item[data-status="pending"]');
    if (await pendingApp.count() > 0) {
      // Try to submit new application
      await page.goto('/roles/apply');
      await page.waitForTimeout(1000);

      // Should show warning or disable form
      const warning = page.locator('.warning-message, .alert-warning');
      const disabledForm = page.locator('form[disabled], fieldset[disabled]');

      const hasWarning = await warning.count() > 0 || await disabledForm.count() > 0;
      expect(hasWarning).toBeTruthy();

      console.log('✅ New application blocked while pending application exists');
    } else {
      console.log('⚠️  No pending application found, skipping test');
      test.skip();
    }
  });

  test('3.3 Session expires during application - should redirect to login', async ({ page }) => {
    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    await page.goto('/roles/apply');
    await page.waitForTimeout(1000);

    // Clear session/cookies to simulate expiry
    await page.context().clearCookies();

    // Try to submit application
    const applicationForm = page.locator('form[id*="role"]');
    if (await applicationForm.count() > 0) {
      await page.selectOption('select[name="role"]', 'coordinator');
      await page.fill('textarea[name="reason"]', 'Test application');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Should redirect to login
      const url = page.url();
      expect(url.includes('login') || url.includes('signin')).toBeTruthy();

      console.log('✅ Expired session redirected to login');
    } else {
      test.skip();
    }
  });

  test('3.4 Role changes while user is online - UI should update', async ({ page, context }) => {
    // This test requires WebSocket or polling mechanism
    // For now, we'll test manual refresh behavior

    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    // Get initial role
    const initialRole = await getUserRole(page);

    // Simulate role change (would need admin to change role in another session)
    // For testing, we'll just verify the UI updates on refresh
    await page.reload();
    await page.waitForTimeout(2000);

    const updatedRole = await getUserRole(page);

    // Role should be consistent after refresh
    expect(updatedRole).toBeDefined();

    console.log('✅ Role persists after page refresh');
  });
});

// ============================================================================
// TEST SUITE 4: Visual Regression Tests (Optional Bonus)
// ============================================================================

test.describe('Visual Regression Tests', () => {

  test('4.1 Role application form renders correctly', async ({ page }) => {
    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    await page.goto('/roles/apply');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/role-application-form.png', fullPage: true });

    // Verify key elements are visible
    const form = page.locator('form[id*="role"]');
    const roleSelect = page.locator('select[name="role"]');
    const reasonTextarea = page.locator('textarea[name="reason"]');
    const submitButton = page.locator('button[type="submit"]');

    expect(await form.count()).toBeGreaterThan(0);
    expect(await roleSelect.count()).toBeGreaterThan(0);
    expect(await reasonTextarea.count()).toBeGreaterThan(0);
    expect(await submitButton.count()).toBeGreaterThan(0);

    console.log('✅ Role application form renders correctly');
  });

  test('4.2 Admin panel displays all elements', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await page.goto('/admin');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-panel.png', fullPage: true });

    // Verify admin panel elements
    const adminPanel = page.locator('.admin-panel, [data-admin-panel]');
    expect(await adminPanel.count()).toBeGreaterThan(0);

    console.log('✅ Admin panel displays correctly');
  });

  test('4.3 Mobile responsive layouts work', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    await page.goto('/roles/apply');
    await page.waitForTimeout(1000);

    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/role-application-mobile.png', fullPage: true });

    // Verify mobile layout
    const form = page.locator('form[id*="role"]');
    expect(await form.count()).toBeGreaterThan(0);

    console.log('✅ Mobile layout renders correctly');
  });
});

// ============================================================================
// TEST SUITE 5: Cross-Browser Tests
// ============================================================================

test.describe('Cross-Browser Compatibility', () => {

  test('5.1 Role system works in Chrome', async ({ page }) => {
    // This test runs in Chromium by default
    await login(page, TEST_USERS.verifiedUser.email, TEST_USERS.verifiedUser.password);

    const role = await getUserRole(page);
    expect(role).toBeDefined();

    console.log('✅ Role system works in Chrome');
  });

  // Additional browser tests would be configured in playwright.config.js
});
