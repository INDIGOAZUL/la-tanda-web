# 🔐 FASE 4 Day 5: 2FA Enforcement Implementation Plan

**Date:** October 26, 2025
**Goal:** Make 2FA mandatory for all admin accounts
**Estimated Time:** 3-4 hours

---

## 📊 Current State Analysis

### ✅ Existing 2FA Infrastructure

**Already Implemented:**
- Email-based 2FA system
- `/api/auth/enable-2fa` - Enable 2FA for user
- `/api/auth/disable-2fa` - Disable 2FA
- `/api/auth/verify-2fa` - Verify 2FA code
- Login integration (sends code if 2FA enabled)
- Backup codes system
- Database fields: `two_factor_enabled`, `two_factor_backup_codes`

**Admin Endpoints (12 total):**
1. `/api/admin/login` - Admin authentication
2. `/api/admin/verify` - Verify admin token
3. `/api/admin/logout` - Admin logout
4. `/api/admin/kyc/pending` - View pending KYC
5. `/api/admin/kyc/:id` - View KYC details
6. `/api/admin/kyc/approve` - Approve KYC
7. `/api/admin/kyc/reject` - Reject KYC
8. `/api/admin/kyc/stats` - KYC statistics
9. `/api/admin/deposits/pending` - View pending deposits
10. `/api/admin/deposits/confirm` - Confirm deposit
11. `/api/admin/deposits/reject` - Reject deposit
12. `/api/admin/users/roles` - View user roles

**Additional endpoints from search:**
- `/api/admin/audit-logs` (newly added, Day 3-4)

---

## 🎯 Implementation Strategy

### Phase 1: Add 2FA Audit Logging
**Time:** 30 minutes

**Tasks:**
1. Add 2FA event types to audit logger (already defined in `AuditLogger.EVENT_TYPES`):
   - `AUTH_2FA_ENABLED` ✅ (already exists)
   - `AUTH_2FA_DISABLED` ✅ (already exists)
   - `AUTH_2FA_SUCCESS` ✅ (already exists)
   - `AUTH_2FA_FAILURE` ✅ (already exists)

2. Integrate audit logging into 2FA endpoints:
   - `enable-2fa`: Log when admin enables 2FA (INFO severity)
   - `disable-2fa`: Log when admin disables 2FA (CRITICAL severity)
   - `verify-2fa`: Log successful/failed verifications

**Files to Modify:**
- `/root/enhanced-api-production-complete.js` (lines ~1859-1920)

---

### Phase 2: Create 2FA Enforcement Middleware
**Time:** 45 minutes

**Goal:** Create reusable function to check if admin has 2FA enabled

**Implementation:**
```javascript
// Add after other helper functions (around line 700)

/**
 * 🔐 FASE 4 Day 5: 2FA Enforcement for Admins
 * Checks if user is admin and has 2FA enabled
 */
function require2FAForAdmin(user) {
    // Check if user has admin role
    if (user.role !== 'admin') {
        return { required: false, reason: 'not_admin' };
    }

    // Check if 2FA is enabled
    if (!user.two_factor_enabled) {
        return {
            required: true,
            enabled: false,
            reason: '2fa_not_enabled',
            message: '2FA es obligatoria para administradores. Habilita 2FA primero.'
        };
    }

    return { required: true, enabled: true, reason: '2fa_enabled' };
}
```

**Files to Create:**
- Add function to `/root/enhanced-api-production-complete.js`

---

### Phase 3: Add 2FA Check to Admin Login
**Time:** 30 minutes

**Goal:** Force 2FA setup after admin login if not enabled

**Current Admin Login Flow:**
1. User logs in with username/password
2. Admin credentials validated
3. Token generated
4. Success response

**New Admin Login Flow:**
1. User logs in with username/password
2. Admin credentials validated
3. **Check if 2FA enabled:**
   - If YES: Proceed normally
   - If NO: Return `2fa_setup_required` flag
4. Token generated (limited permissions until 2FA setup)
5. Success response with 2FA status

**Modification:**
```javascript
// In /api/admin/login endpoint (around line 4419)

// After password validation, before creating session
const twoFactorStatus = require2FAForAdmin(adminUser);

if (twoFactorStatus.required && !twoFactorStatus.enabled) {
    // 2FA required but not enabled
    // Create temporary session with 2FA setup requirement
    const tempToken = generateId('temp_admin');
    database.admin_sessions[tempToken] = {
        username: adminUser.username,
        role: 'admin',
        two_factor_setup_required: true,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 900000).toISOString() // 15 minutes
    };
    saveDatabase();

    sendSuccess(res, {
        message: '2FA requerida - Configura 2FA para continuar',
        two_factor_setup_required: true,
        temp_token: tempToken,
        setup_endpoint: '/api/auth/enable-2fa'
    });
    return;
}

// Normal flow if 2FA already enabled
```

---

### Phase 4: Protect Admin Endpoints
**Time:** 45 minutes

**Goal:** Add 2FA check to all admin endpoints (except login/logout)

**Strategy:**
Add 2FA check after session validation in each admin endpoint:

```javascript
// After verifying session exists and user is admin
const user = database.users.find(u => u.email === session.email || u.id === session.userId);
if (!user) {
    sendError(res, 401, 'Usuario no encontrado');
    return;
}

// 🔐 2FA Enforcement (FASE 4 Day 5)
const twoFactorStatus = require2FAForAdmin(user);
if (twoFactorStatus.required && !twoFactorStatus.enabled) {
    await auditLog.log(AuditLogger.EVENT_TYPES.SECURITY_ACCESS_DENIED, {
        user_id: user.id,
        user_email: user.email,
        ip_address: req.socket.remoteAddress,
        endpoint: path,
        details: { reason: '2fa_not_enabled' }
    });
    sendError(res, 403, '2FA obligatoria para administradores');
    return;
}
```

**Endpoints to Protect (11 total, excluding login):**
- `/api/admin/kyc/*` (4 endpoints)
- `/api/admin/deposits/*` (3 endpoints)
- `/api/admin/users/*` (1 endpoint)
- `/api/admin/audit-logs` (1 endpoint)
- `/api/admin/verify` (1 endpoint)
- Note: `/api/admin/logout` does not need protection (graceful logout)

---

### Phase 5: Create 2FA Setup Wizard Endpoint
**Time:** 30 minutes

**Goal:** Admin-specific endpoint to guide through 2FA setup

**Endpoint:** `GET /api/admin/2fa/setup-status`

**Purpose:**
- Check if admin has 2FA enabled
- Return setup instructions if not
- Return status if already enabled

```javascript
// Add around line 4600 (after other admin endpoints)

// ADMIN: Check 2FA setup status
if (path === '/api/admin/2fa/setup-status' && method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendError(res, 401, 'Token requerido');
        return;
    }

    const token = authHeader.split(' ')[1];
    const session = database.admin_sessions?.[token];

    if (!session) {
        sendError(res, 401, 'Sesión inválida');
        return;
    }

    const user = database.users.find(u => u.username === session.username || u.email === session.email);
    if (!user) {
        sendError(res, 404, 'Usuario no encontrado');
        return;
    }

    const twoFactorStatus = require2FAForAdmin(user);

    sendSuccess(res, {
        username: user.username,
        email: user.email,
        role: user.role,
        two_factor_required: twoFactorStatus.required,
        two_factor_enabled: twoFactorStatus.enabled,
        setup_required: twoFactorStatus.required && !twoFactorStatus.enabled,
        backup_codes_count: user.two_factor_backup_codes?.length || 0,
        setup_instructions: {
            step1: 'Call POST /api/auth/enable-2fa with your auth token',
            step2: 'Save the backup codes returned',
            step3: 'Verify your setup is complete',
            step4: 'Logout and login again to test 2FA'
        }
    });
    return;
}
```

---

### Phase 6: Testing
**Time:** 30 minutes

**Test Scenarios:**

**Test 1: Admin Login Without 2FA**
```bash
# Login as admin
curl -X POST https://api.latanda.online/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"LaTanda2025Admin"}'

# Expected: 2fa_setup_required flag
```

**Test 2: Enable 2FA**
```bash
# Use temp token from login
curl -X POST https://api.latanda.online/api/auth/enable-2fa \
  -H "Authorization: Bearer [TEMP_TOKEN]" \
  -H "Content-Type: application/json"

# Expected: Backup codes returned, 2FA enabled
```

**Test 3: Admin Endpoint Access (2FA Not Enabled)**
```bash
# Try to access admin endpoint without 2FA
curl -H "Authorization: Bearer [TOKEN_WITHOUT_2FA]" \
  https://api.latanda.online/api/admin/kyc/pending

# Expected: 403 - 2FA obligatoria
```

**Test 4: Admin Endpoint Access (2FA Enabled)**
```bash
# Access admin endpoint with 2FA enabled
curl -H "Authorization: Bearer [TOKEN_WITH_2FA]" \
  https://api.latanda.online/api/admin/kyc/pending

# Expected: Success
```

**Test 5: Audit Logs**
```bash
# Check audit logs for 2FA events
ssh root@168.231.67.201 "cat /root/database.json | jq '.audit_logs[] | select(.event_type | contains(\"2fa\"))'"

# Expected: See enable, disable, success, failure events
```

---

## 📁 Files to Modify

### 1. `/root/enhanced-api-production-complete.js`
**Changes:**
- Add `require2FAForAdmin()` function (~line 700)
- Update `/api/admin/login` to check 2FA (~line 4419)
- Add 2FA checks to 11 admin endpoints (~lines 4543-5400)
- Add audit logging to `/api/auth/enable-2fa` (~line 1859)
- Add audit logging to `/api/auth/disable-2fa` (~line 1894)
- Add audit logging to `/api/auth/verify-2fa` (~line 1918)
- Add `/api/admin/2fa/setup-status` endpoint (~line 4600)

### 2. Backups to Create
- `/root/enhanced-api-production-complete.js.backup-before-2fa-enforcement`

---

## 🎯 Success Criteria

- [x] Analysis complete (existing 2FA, 12 admin endpoints)
- [ ] Audit logging integrated into 2FA endpoints
- [ ] `require2FAForAdmin()` function created
- [ ] Admin login checks 2FA status
- [ ] 11 admin endpoints protected with 2FA check
- [ ] Setup wizard endpoint created
- [ ] All tests passing
- [ ] Documentation complete

---

## ⚠️ Important Notes

### Graceful Rollout
- Existing admin users will get `2fa_setup_required` on next login
- They can enable 2FA using `/api/auth/enable-2fa`
- Backup codes are provided for recovery
- Logout endpoint remains unprotected for graceful exit

### Security Considerations
- Temp tokens expire in 15 minutes
- Backup codes are one-time use
- 2FA codes expire in 10 minutes
- All 2FA events are audit logged
- Disabling 2FA logs as CRITICAL severity

### User Experience
- Clear error messages explain 2FA requirement
- Setup instructions provided via `/api/admin/2fa/setup-status`
- Backup codes saved in user profile
- Graceful fallback if email fails

---

## 📊 Timeline

| Phase | Task | Est. Time | Status |
|-------|------|-----------|--------|
| 1 | Add 2FA audit logging | 30 min | ⏳ Pending |
| 2 | Create enforcement middleware | 45 min | ⏳ Pending |
| 3 | Update admin login | 30 min | ⏳ Pending |
| 4 | Protect admin endpoints | 45 min | ⏳ Pending |
| 5 | Create setup wizard | 30 min | ⏳ Pending |
| 6 | Testing | 30 min | ⏳ Pending |
| **Total** | | **3 hours 30 min** | |

---

## 🚀 Deployment Strategy

1. Create backup of production API
2. Apply all changes in single deployment
3. Restart API with PM2
4. Test 2FA enforcement immediately
5. Monitor audit logs for 2FA events
6. Notify existing admins of 2FA requirement

---

**Ready to implement?** This plan will complete FASE 4 security enhancements!

---

*Plan created: October 26, 2025 18:20 UTC*
*FASE 4: Admin & Seguridad - Day 5*
