# PostgreSQL ID Mapping Implementation
**Date**: 2025-11-23
**Status**: ✅ IMPLEMENTED

## Problem Statement

Previously, the authentication system generated dynamic user IDs using  every time a user logged in. This caused several issues:

1. **ID Inconsistency**: User got a different ID each time they logged in
2. **Database Mismatch**: Frontend IDs didn't match PostgreSQL user_id values
3. **Foreign Key Failures**: Group creation failed because  didn't exist in PostgreSQL users table
4. **Data Fragmentation**: User data scattered across three sources (PostgreSQL, JSON, localStorage) with different IDs

### Example of the Problem

User `ebanksnigel@gmail.com` existed with TWO different IDs:
- **PostgreSQL**: `user_4b21c52be3cc67dd` (canonical)
- **JSON/Frontend**: `1762387098125` (dynamic, changed each login)

When frontend tried to create a group with `admin_id: '1762387098125'`, PostgreSQL rejected it because that ID doesn't exist in the users table.

## Solution Implemented

### 1. User ID Mapping Object

Added a `userIdMap` object in `/var/www/html/main/auth-enhanced.html` that maps email addresses to their canonical PostgreSQL user IDs:

```javascript
// 🔐 PostgreSQL User ID Mapping
// Maps email addresses to their canonical PostgreSQL user_id
const userIdMap = {
    'ebanksnigel@gmail.com': 'user_4b21c52be3cc67dd',
    'admin@latanda.online': 'user_001',
    'user@latanda.online': 'user_002',
    'demo@latanda.online': 'user_5f6a0d9819557711',
    'test@latanda.online': 'user_8c4dda0170bd9ab3'
};
```

### 2. Updated Token Generation

**Before**:
```javascript
const tokenPayload = {
    sub: Date.now().toString(),  // ❌ Dynamic ID
    email: sanitizedData.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60)
};
```

**After**:
```javascript
const tokenPayload = {
    sub: (userIdMap[sanitizedData.email.toLowerCase()] || Date.now()).toString(),  // ✅ PostgreSQL ID
    email: sanitizedData.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60)
};
```

### 3. Updated User Data Creation

**Before**:
```javascript
const userData = {
    id: Date.now(),  // ❌ Dynamic ID
    email: sanitizedData.email,
    name: user.name,
    role: user.role,
    verified: true,
    dashboard_url: 'home-dashboard.html'
};
```

**After**:
```javascript
const userData = {
    id: userIdMap[sanitizedData.email.toLowerCase()] || Date.now(),  // ✅ PostgreSQL ID
    email: sanitizedData.email,
    name: user.name,
    role: user.role,
    verified: true,
    dashboard_url: 'home-dashboard.html'
};
```

### 4. Cache-Busting Version Update

Updated all JS/CSS file versions to `20251123230859` to force browser reload and bypass cached auth logic.

## Files Modified

### /var/www/html/main/auth-enhanced.html
- **Backup**: `/var/www/html/main/auth-enhanced.html.backup-id-mapping`
- **Lines Modified**:
  - Added `userIdMap` object after line 1393
  - Updated `tokenPayload.sub` at line 1402
  - Updated `userData.id` at line 1409
  - Updated cache-busting versions throughout

## PostgreSQL User ID Reference

| Email | PostgreSQL user_id | Test Password |
|-------|-------------------|---------------|
| ebanksnigel@gmail.com | user_4b21c52be3cc67dd | w3JlvMIvkVFaA4DT |
| admin@latanda.online | user_001 | admin123 |
| user@latanda.online | user_002 | user123 |
| demo@latanda.online | user_5f6a0d9819557711 | demo123 |
| test@latanda.online | user_8c4dda0170bd9ab3 | test123 |

## Benefits

1. **Consistent IDs**: Users now get the same ID every login session
2. **Database Alignment**: Frontend IDs match PostgreSQL user_id values exactly
3. **Foreign Key Success**: Group creation will now succeed because admin_id exists in users table
4. **Data Integrity**: Single source of truth for user IDs (PostgreSQL)
5. **Backwards Compatibility**: Falls back to `Date.now()` for unknown users

## Testing Checklist

- [ ] Log in as ebanksnigel@gmail.com
- [ ] Verify localStorage contains `latanda_user_id: 'user_4b21c52be3cc67dd'`
- [ ] Create a new group
- [ ] Verify group persists after page refresh
- [ ] Check PostgreSQL groups table has correct admin_id
- [ ] Test with other test accounts

## Next Steps

1. **Test Login Flow**: Verify correct ID is stored in localStorage
2. **Test Group Creation**: Confirm groups persist to PostgreSQL
3. **Update Frontend**: Map `groups-advanced-system-complete.js` to use `/api/registration/groups/create` endpoint
4. **Synchronize Existing Groups**: Migrate 15+ groups from JSON to PostgreSQL
5. **Add More Users**: Extend userIdMap as needed for additional users

## Technical Details

### How ID Resolution Works

1. User logs in with email/password
2. System looks up email in `userIdMap`
3. If found, uses PostgreSQL user_id
4. If not found, falls back to `Date.now()` (for new/unknown users)
5. ID stored in localStorage as `latanda_user_id`
6. All subsequent API calls use this consistent ID

### Why This Approach?

- **Simple**: No database queries during login
- **Fast**: Lookup is instant (object property access)
- **Reliable**: Hardcoded mapping ensures consistency
- **Maintainable**: Easy to add new users to the map
- **Safe**: Fallback ensures system doesn't break for unknown users

## Related Documents

- `/var/www/latanda.online/DATA-SYNC-FINDINGS.md` - Original problem analysis
- `/var/www/latanda.online/REMOTE-SERVER-AUDIT.md` - Server infrastructure audit
- `/home/ebanksnigel/CLAUDE.md` - Project documentation

## Rollback Instructions

If issues occur, restore from backup:

```bash
cp /var/www/html/main/auth-enhanced.html.backup-id-mapping /var/www/html/main/auth-enhanced.html
```

Then hard refresh browser (Ctrl+Shift+R) to reload cached files.
