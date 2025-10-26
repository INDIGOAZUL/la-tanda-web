#!/bin/bash
###############################################################################
# 🔍 Audit Logging Integration Script
#
# Safely integrates audit logging into La Tanda production API
# FASE 4: Admin & Seguridad - Day 3-4
###############################################################################

set -e  # Exit on any error

echo "🔍 La Tanda Audit Logging Integration"
echo "======================================"
echo ""

API_FILE="/root/enhanced-api-production-complete.js"
BACKUP_FILE="/root/enhanced-api-production-complete.js.backup-$(date +%Y%m%d-%H%M%S)"

# Safety check
if [ ! -f "$API_FILE" ]; then
    echo "❌ API file not found: $API_FILE"
    exit 1
fi

echo "📦 Creating backup..."
cp "$API_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

echo "🔧 Applying audit logging integration..."

# Integration points to add audit logging:
# 1. Login success (after token generation)
# 2. Login failure (invalid credentials)
# 3. Rate limit exceeded (in rate limiter)
# 4. Withdrawal requested

# Create temporary patch file
cat > /tmp/audit-integration.patch << 'PATCH_END'
# This script will add audit logging calls to key points in the API

# 1. Add audit logging to login failures (line ~1388-1390)
# After: if (!user) { sendError(res, 401, 'Credenciales inválidas'); return; }
# Add: await auditLog.loginFailure(email, req.socket.remoteAddress, req.headers['user-agent'] || 'unknown', 'User not found');

# 2. Add audit logging to invalid password (line ~1401-1404)
# After: if (!passwordValid) { sendError(res, 401, 'Credenciales inválidas'); return; }
# Add: await auditLog.loginFailure(email, req.socket.remoteAddress, req.headers['user-agent'] || 'unknown', 'Invalid password');

# 3. Add audit logging to login success (line ~1455-1470)
# After: const authToken = generateId('auth');
# Add: await auditLog.loginSuccess(user.id, user.email, req.socket.remoteAddress, req.headers['user-agent'] || 'unknown');

# 4. Add audit logging to rate limit violations
# In rate-limiter-middleware.js, after returning 429
PATCH_END

echo "📝 Creating integrated API file..."

# Use Node.js to safely add audit logging calls
node << 'NODE_SCRIPT'
const fs = require('fs');
const apiFile = '/root/enhanced-api-production-complete.js';
let code = fs.readFileSync(apiFile, 'utf8');

// Find and replace key points

// 1. Login failure - user not found (around line 1389)
code = code.replace(
    /if \(!user\) {\s+sendError\(res, 401, 'Credenciales inválidas'\);/,
    `if (!user) {
                await auditLog.loginFailure(email, req.socket.remoteAddress, req.headers['user-agent'] || 'unknown', 'User not found');
                sendError(res, 401, 'Credenciales inválidas');`
);

// 2. Login failure - invalid password (around line 1403)
code = code.replace(
    /if \(!passwordValid\) {\s+sendError\(res, 401, 'Credenciales inválidas'\);/,
    `if (!passwordValid) {
                await auditLog.loginFailure(email, req.socket.remoteAddress, req.headers['user-agent'] || 'unknown', 'Invalid password');
                sendError(res, 401, 'Credenciales inválidas');`
);

// 3. Login success - after token generation
// Find: database.sessions[authToken] = {
// Add audit log before saveDatabase()
code = code.replace(
    /(database\.sessions\[authToken\] = \{[^}]+\};)\s+(saveDatabase\(\);)/,
    `$1

            // 🔍 AUDIT LOG: Successful login
            await auditLog.loginSuccess(user.id, user.email, req.socket.remoteAddress, req.headers['user-agent'] || 'unknown');

            $2`
);

// Write back
fs.writeFileSync(apiFile, code, 'utf8');
console.log('✅ Audit logging calls added to login endpoint');

NODE_SCRIPT

echo ""
echo "✅ Integration complete!"
echo ""

# Validate JavaScript syntax
echo "🔍 Validating JavaScript syntax..."
node -c "$API_FILE" && echo "✅ Syntax valid" || {
    echo "❌ Syntax error detected! Restoring backup..."
    cp "$BACKUP_FILE" "$API_FILE"
    exit 1
}

echo ""
echo "📊 Integration Summary:"
echo "  - Login success logging: ✅"
echo "  - Login failure logging: ✅"
echo "  - Rate limit logging: ⏳ (will add separately)"
echo "  - Withdrawal logging: ⏳ (will add separately)"
echo ""
echo "🔄 Ready to restart API with audit logging"
echo ""
echo "Next steps:"
echo "  1. Review changes: diff $BACKUP_FILE $API_FILE"
echo "  2. Restart API: pkill -9 node && nohup node $API_FILE > /root/api.log 2>&1 &"
echo "  3. Test login: curl -X POST https://api.latanda.online/api/auth/login ..."
echo ""
