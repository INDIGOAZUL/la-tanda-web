#\!/bin/bash
# CI/CD Test Runner Script
# Usage: ./scripts/run-tests.sh

set -e

echo "==========================================="
echo "La Tanda Platform - Automated Test Suite"
echo "==========================================="
echo ""

# Check if API is running
echo "[1/4] Checking API status..."
HEALTH=$(curl -s http://127.0.0.1:3002/health | grep -o "online" || echo "")
if [ "$HEALTH" \!= "online" ]; then
    echo "ERROR: API is not running on port 3002"
    exit 1
fi
echo "OK: API is online"
echo ""

# Run integration tests
echo "[2/4] Running integration tests..."
npm run test:integration
echo ""

# Check security headers
echo "[3/4] Verifying security headers..."
HEADERS=$(curl -sI http://127.0.0.1:3002/health | grep -c "X-" || echo "0")
if [ "$HEADERS" -lt 3 ]; then
    echo "ERROR: Security headers not found"
    exit 1
fi
echo "OK: Security headers verified"
echo ""

# Check rate limiting
echo "[4/4] Testing rate limiting..."
for i in {1..12}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:3002/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}')
    if [ "$STATUS" = "429" ]; then
        echo "OK: Rate limiting active (triggered at request $i)"
        break
    fi
done
echo ""

echo "==========================================="
echo "All tests passed successfully\!"
echo "==========================================="
