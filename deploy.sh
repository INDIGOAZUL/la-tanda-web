#!/bin/bash
# La Tanda Deploy Script
# Usage: ./deploy.sh [message]

set -e

TIMESTAMP=20251210-104129
API_FILE="integrated-api-complete-95-endpoints.js"
COMMIT_MSG="${1:-Deploy $TIMESTAMP}"

echo "🚀 La Tanda Deploy Script"
echo "========================"
echo "Timestamp: $TIMESTAMP"
echo ""

# 1. Syntax check
echo "📋 Step 1: Checking syntax..."
node --check $API_FILE
if [ $? -ne 0 ]; then
    echo "❌ Syntax error! Aborting deploy."
    exit 1
fi
echo "✅ Syntax OK"
echo ""

# 2. Create backup
echo "📦 Step 2: Creating backup..."
cp $API_FILE $API_FILE.backup-$TIMESTAMP
echo "✅ Backup: $API_FILE.backup-$TIMESTAMP"
echo ""

# 3. Git commit
echo "📝 Step 3: Committing changes..."
git add -A
git status --short

read -p "Commit these changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "$COMMIT_MSG"
    echo "✅ Committed"
else
    echo "⏭️ Skipped commit"
fi
echo ""

# 4. Restart PM2
echo "🔄 Step 4: Restarting API..."
pm2 restart 0
sleep 3
echo "✅ API restarted"
echo ""

# 5. Health check
echo "🏥 Step 5: Health check..."
HEALTH=$(curl -s http://localhost:3002/api/system/status | jq -r '.success // "false"')
if [ "$HEALTH" = "true" ]; then
    echo "✅ API is healthy!"
else
    echo "⚠️ Health check failed - check logs with: pm2 logs 0"
fi
echo ""

# 6. Show recent logs
echo "📊 Recent logs:"
pm2 logs 0 --lines 5 --nostream
echo ""

echo "🎉 Deploy complete!"
echo ""
echo "Useful commands:"
echo "  pm2 logs 0          - View logs"
echo "  pm2 restart 0       - Restart API"
echo "  git log --oneline -5 - Recent commits"
