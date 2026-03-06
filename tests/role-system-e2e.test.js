/**
 * Role System End-to-End Tests
 * Bounty: 150-250 LTD
 * 
 * Run with: npx playwright test role-system-e2e.test.js
 */

const { test, expect } = require('@playwright/test');

test.describe('Role System', () => {
    
    test('1. New user registration → default user role', async ({ page }) => {
        await page.goto('/register.html');
        await page.fill('#email', 'newuser@test.com');
        await page.fill('#password', 'TestPass123!');
        await page.click('#register-btn');
        
        // Should be logged in with default 'user' role
        await expect(page.locator('.user-role')).toContainText('user');
    });
    
    test('2. Complete KYC → auto-upgrade to verified_user', async ({ page }) => {
        await page.goto('/kyc-registration.html');
        await page.fill('#document-number', '12345678');
        await page.selectOption('#document-type', 'dni');
        await page.click('#submit-kyc');
        
        // Should auto-upgrade after KYC
        await expect(page.locator('.user-role')).toContainText('verified_user');
    });
    
    test('3. Submit role application → pending status', async ({ page }) => {
        await page.goto('/role-application.html');
        await page.selectOption('#role-select', 'coordinator');
        await page.fill('#reason', 'I want to manage tanda groups');
        await page.click('#submit-application');
        
        // Should show pending
        await expect(page.locator('.application-status')).toContainText('pending');
    });
    
    test('4. Admin approves application → role updated', async ({ page }) => {
        // Login as admin
        await page.goto('/admin-panel.html');
        await page.fill('#email', 'admin@test.com');
        await page.fill('#password', 'AdminPass123!');
        await page.click('#login-btn');
        
        // Navigate to role applications
        await page.click('#role-applications');
        await page.click('#approve-app-123');
        
        // Verify role updated
        await expect(page.locator('#app-123-status')).toContainText('approved');
    });
    
    test('5. User tries to access admin panel → denied', async ({ page }) => {
        // Login as regular user
        await page.goto('/login.html');
        await page.fill('#email', 'user@test.com');
        await page.fill('#password', 'UserPass123!');
        await page.click('#login-btn');
        
        // Try to access admin
        await page.goto('/admin-panel.html');
        
        // Should be redirected or show access denied
        await expect(page.locator('.access-denied, .error')).toBeVisible();
    });
    
    test('6. Apply for same role twice → error', async ({ page }) => {
        await page.goto('/role-application.html');
        await page.selectOption('#role-select', 'coordinator');
        
        // First application
        await page.click('#submit-application');
        
        // Try second application
        await page.click('#submit-application');
        
        // Should show error
        await expect(page.locator('.error-message')).toContainText('ya tienes');
    });
    
    test('7. Session expires during application → redirect to login', async ({ page }) => {
        // Set short session
        await page.addInitScript(() => {
            window.sessionExpiry = Date.now() - 1000;
        });
        
        await page.goto('/role-application.html');
        await page.waitForTimeout(2000);
        
        // Should redirect to login
        await expect(page.url()).toContain('/login');
    });
    
    test('8. Role changes while user is online → UI updates', async ({ page }) => {
        await page.goto('/dashboard.html');
        const initialRole = await page.locator('.user-role').textContent();
        
        // Simulate role change via API
        await page.evaluate(() => {
            localStorage.setItem('user_role', 'coordinator');
        });
        
        await page.reload();
        
        // Should reflect new role
        await expect(page.locator('.user-role')).toContainText('coordinator');
    });
    
    test('9. Visual: Role application form renders correctly', async ({ page }) => {
        await page.goto('/role-application.html');
        
        // Check all elements visible
        await expect(page.locator('#role-select')).toBeVisible();
        await expect(page.locator('#reason')).toBeVisible();
        await expect(page.locator('#submit-application')).toBeVisible();
        
        // Screenshot for visual regression
        await page.screenshot({ path: 'screenshots/role-application.png' });
    });
    
    test('10. Admin panel displays all role applications', async ({ page }) => {
        await page.goto('/admin-panel.html');
        await page.fill('#email', 'admin@test.com');
        await page.fill('#password', 'AdminPass123!');
        await page.click('#login-btn');
        
        await page.click('#role-applications');
        
        // Should list applications
        await expect(page.locator('.application-list')).toBeVisible();
    });
});
