#!/bin/bash

###############################################################################
# 🧪 La Tanda Playwright Test Runner
#
# Runs automated tests for:
# - Authentication
# - Rate limiting
# - Withdrawal functionality
# - Admin features
###############################################################################

echo "🧪 La Tanda Automated Testing Suite"
echo "===================================="
echo ""

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
    echo "❌ Playwright not found. Installing..."
    npm install --save-dev @playwright/test@latest
    npx playwright install chromium
    echo ""
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Copy .env.test to .env and fill in your credentials"
    echo ""
    read -p "Continue with default values? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Menu
echo "Select test suite to run:"
echo ""
echo "  1. All tests (comprehensive)"
echo "  2. Authentication only"
echo "  3. Rate limiting only"
echo "  4. Withdrawal tests only"
echo "  5. Quick smoke test"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo "🚀 Running all tests..."
        npx playwright test
        ;;
    2)
        echo "🔐 Running authentication tests..."
        npx playwright test auth.spec.js
        ;;
    3)
        echo "🔒 Running rate limiting tests..."
        npx playwright test rate-limiting.spec.js
        ;;
    4)
        echo "💰 Running withdrawal tests..."
        npx playwright test withdrawal.spec.js
        ;;
    5)
        echo "⚡ Running quick smoke test..."
        npx playwright test --grep "should load"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Tests complete!"
echo ""
echo "📊 View detailed report:"
echo "   npx playwright show-report"
echo ""
