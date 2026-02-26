#\!/bin/bash
# Deployment Script for La Tanda Platform
# Usage: ./scripts/deploy.sh

set -e

echo "==========================================="
echo "La Tanda Platform - Deployment"
echo "==========================================="
echo ""

# Check we are in the right directory
if [ \! -f "integrated-api-complete-95-endpoints.js" ]; then
    echo "ERROR: Must be run from /var/www/latanda.online"
    exit 1
fi

# 1. Pull latest changes
echo "[1/5] Pulling latest changes from git..."
git pull origin main || { echo "Git pull failed"; exit 1; }
echo ""

# 2. Install dependencies
echo "[2/5] Installing dependencies..."
npm ci --production || npm install --production
echo ""

# 3. Run syntax check
echo "[3/5] Checking syntax..."
node -c integrated-api-complete-95-endpoints.js || { echo "Syntax error in API"; exit 1; }
node -c security-middleware.js || { echo "Syntax error in security middleware"; exit 1; }
echo ""

# 4. Restart PM2
echo "[4/5] Restarting PM2 processes..."
pm2 restart latanda-api-fixed --update-env || { echo "PM2 restart failed"; exit 1; }
pm2 save
echo ""

# 5. Verify deployment
echo "[5/5] Verifying deployment..."
sleep 3
HEALTH=$(curl -s http://127.0.0.1:3002/health | grep -o "online" || echo "")
if [ "$HEALTH" \!= "online" ]; then
    echo "ERROR: API health check failed after deployment"
    pm2 logs latanda-api-fixed --lines 20 --nostream
    exit 1
fi
echo "OK: API is online"

echo ""
echo "==========================================="
echo "Deployment completed successfully\!"
echo "==========================================="
