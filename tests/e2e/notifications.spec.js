import { test, expect } from '@playwright/test';

test.describe('Notification System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the local server
    await page.goto('http://localhost:8080/notificaciones.html');
  });

  test('should display history header', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Todas tus notificaciones');
  });

  test('should allow filtering by text', async ({ page }) => {
    const searchInput = page.locator('#searchNotifications');
    await searchInput.fill('prueba');
    // We expect the list to update. If empty, it shows a message.
    const emptyMsg = page.locator('.history-empty');
    if (await emptyMsg.isVisible()) {
      await expect(emptyMsg).toContainText('No se encontraron notificaciones');
    }
  });

  test('should allow filtering by type', async ({ page }) => {
    const typeSelect = page.locator('#filterType');
    await typeSelect.selectOption('social');
    
    // Check if the empty message appears or items load
    const historyList = page.locator('#historyList');
    await expect(historyList).toBeVisible();
  });

  test('should have infinite scroll sentinel', async ({ page }) => {
    const sentinel = page.locator('#historySentinel');
    await expect(sentinel).toBeAttached();
  });
});
