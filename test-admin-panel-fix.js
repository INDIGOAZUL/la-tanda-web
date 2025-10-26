/**
 * Playwright Test: Admin Panel Visual Validation
 * Tests that admin panel has no exposed JavaScript code at the bottom
 */

const { chromium } = require('playwright');

(async () => {
    console.log('🎭 Starting Playwright validation...\n');

    const browser = await chromium.launch({
        headless: true
    });

    const context = await browser.newContext({
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    try {
        console.log('📄 Loading admin panel...');
        await page.goto('https://latanda.online/admin-panel.html', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        console.log('✅ Page loaded successfully\n');

        // Test 1: Check that page loaded without console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Test 2: Check that no JavaScript code is visible in the body text
        const bodyText = await page.locator('body').textContent();

        // These strings should NOT be visible as text (they should be inside script tags)
        const forbiddenStrings = [
            'function approveAppeal(appealId)',
            'localStorage.getItem(\'admin_appeals_queue\')',
            'const adminAppeals',
            'adminAppeals.findIndex',
            'showNotification(\'Apelación no encontrada\'',
            'const apiAdapter = new LaTandaAPIAdapter()'
        ];

        let hasExposedCode = false;
        const foundExposedCode = [];

        for (const str of forbiddenStrings) {
            if (bodyText.includes(str)) {
                hasExposedCode = true;
                foundExposedCode.push(str);
            }
        }

        // Test 3: Verify script tags are properly closed
        const scriptTags = await page.locator('script').count();
        console.log(`📊 Found ${scriptTags} script tags\n`);

        // Test 4: Check for visual elements that should be present
        const expectedElements = [
            'Panel de Administración',
            'Gestión de Depósitos',
            'Estadísticas'
        ];

        let missingElements = [];
        for (const element of expectedElements) {
            if (!bodyText.includes(element)) {
                missingElements.push(element);
            }
        }

        // Results
        console.log('═══════════════════════════════════════');
        console.log('           VALIDATION RESULTS           ');
        console.log('═══════════════════════════════════════\n');

        if (hasExposedCode) {
            console.log('❌ TEST FAILED: Exposed JavaScript code detected!\n');
            console.log('Found the following code visible in page body:');
            foundExposedCode.forEach(code => {
                console.log(`   ⚠️  ${code.substring(0, 60)}...`);
            });
            console.log('\n');
        } else {
            console.log('✅ TEST PASSED: No exposed JavaScript code\n');
        }

        if (missingElements.length > 0) {
            console.log('⚠️  WARNING: Some expected elements missing:');
            missingElements.forEach(el => console.log(`   • ${el}`));
            console.log('\n');
        } else {
            console.log('✅ All expected UI elements present\n');
        }

        if (consoleErrors.length > 0) {
            console.log('⚠️  Console errors detected:');
            consoleErrors.slice(0, 5).forEach(err => {
                console.log(`   • ${err}`);
            });
            console.log('\n');
        } else {
            console.log('✅ No console errors\n');
        }

        console.log('═══════════════════════════════════════\n');

        // Take screenshot
        await page.screenshot({
            path: '/tmp/admin-panel-validation.png',
            fullPage: true
        });
        console.log('📸 Screenshot saved: /tmp/admin-panel-validation.png\n');

        // Final verdict
        if (hasExposedCode) {
            console.log('🔴 OVERALL: FIX FAILED - Code still exposed');
            process.exit(1);
        } else {
            console.log('🟢 OVERALL: FIX SUCCESSFUL - Admin panel clean');
            process.exit(0);
        }

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
