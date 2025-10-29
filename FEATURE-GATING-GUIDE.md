# Role-Based Feature Gating Guide

**Bounty #17 Implementation - La Tanda Web**

Complete guide for implementing and using role-based access control across the La Tanda platform.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Role Hierarchy](#role-hierarchy)
6. [Feature Access Matrix](#feature-access-matrix)
7. [Usage Examples](#usage-examples)
8. [Customization](#customization)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Role-Based Feature Gating system controls access to features based on user roles. It provides:

- **Frontend Protection:** Visual feedback (hide/disable/lock UI elements)
- **Backend Enforcement:** API-level access control
- **User Experience:** Clear upgrade paths and role requirements
- **Security:** Defense-in-depth with client and server validation

### Role Levels (1-8)

1. **user** - Default role for all new users
2. **verified_user** - Completed KYC verification
3. **active_member** - Active participant with transaction history
4. **coordinator** - Manages and creates tandas
5. **moderator** - Content and community moderation
6. **admin** - Platform administration
7. **administrator** - High-level administration
8. **super_admin** - Full system access

---

## Quick Start

### 1. Include Required Files

Add to your HTML `<head>`:

```html
<!-- Role Guard CSS -->
<link rel="stylesheet" href="/utils/roleGuard.css">

<!-- Role Guard JavaScript -->
<script src="/utils/roleGuard.js"></script>
```

### 2. Mark Elements with Data Attributes

```html
<!-- Hide element if user doesn't have access -->
<button data-feature="create_tanda" data-gate-action="hide">
    Create Tanda
</button>

<!-- Disable button if user doesn't have access -->
<button data-feature="moderate_content" data-gate-action="disable">
    Moderate
</button>

<!-- Show lock overlay if user doesn't have access -->
<div data-feature="view_analytics" data-gate-action="lock">
    <h3>Analytics Dashboard</h3>
    <!-- Content -->
</div>
```

### 3. Protect Backend Endpoints

```javascript
const { requireFeature, requireRole } = require('./middleware/roleGuard');

// Protect specific feature
router.post('/api/tandas/create',
    auth,
    requireFeature('create_tanda'),
    createTandaHandler
);

// Require minimum role level
router.get('/api/admin/users',
    auth,
    requireRole('admin'),
    getUsersHandler
);
```

---

## Frontend Implementation

### Data Attributes

| Attribute | Required | Description | Values |
|-----------|----------|-------------|---------|
| `data-feature` | Yes | Feature name | Any key from `FEATURE_ACCESS` |
| `data-gate-action` | No | How to gate | `hide`, `disable`, `lock` (default: `hide`) |

### Gate Actions

#### 1. Hide (Default)

Completely removes element from DOM.

```html
<button data-feature="create_tanda" data-gate-action="hide">
    Create Tanda
</button>
```

**Use when:** Feature should not be visible to unauthorized users.

#### 2. Disable

Disables interactive elements (buttons, inputs) and adds visual indicator.

```html
<button data-feature="assign_roles" data-gate-action="disable">
    Assign Role
</button>
```

**Use when:** User should see feature exists but can't interact.

#### 3. Lock

Shows content with semi-transparent overlay and upgrade prompt.

```html
<div data-feature="view_analytics" data-gate-action="lock">
    <div class="analytics-dashboard">
        <!-- Content -->
    </div>
</div>
```

**Use when:** Feature is premium/promotional and you want to encourage upgrades.

### JavaScript API

```javascript
// Check if current user has access to a feature
if (window.roleGuard.hasAccess('create_tanda')) {
    console.log('User can create tandas');
}

// Check minimum role level
if (window.roleGuard.hasMinimumRole('moderator')) {
    console.log('User is at least a moderator');
}

// Get required role for a feature
const requiredRole = window.roleGuard.getRequiredRole('moderate_content');
console.log(`Requires: ${requiredRole}`);

// Manually apply gate to an element
const element = document.getElementById('myFeature');
window.roleGuard.applyGate(element, 'create_tanda', 'lock');

// Refresh after role change
await window.roleGuard.refresh();
```

### Programmatic Feature Checks

```javascript
// In your application code
async function handleCreateTanda() {
    if (!window.roleGuard.hasAccess('create_tanda')) {
        window.roleGuard.showUpgradePrompt('create_tanda', 'verified_user');
        return;
    }

    // Proceed with tanda creation
    await createTanda();
}
```

---

## Backend Implementation

### Middleware Usage

#### requireFeature(featureName)

Protects endpoints based on feature access.

```javascript
const { requireFeature } = require('./middleware/roleGuard');

// Protect tanda creation
router.post('/api/tandas/create',
    auth,                          // Authentication middleware
    requireFeature('create_tanda'), // Role check
    async (req, res) => {
        // Handler code
    }
);
```

#### requireRole(minimumRole)

Requires a minimum role level.

```javascript
const { requireRole } = require('./middleware/roleGuard');

// Require admin or higher
router.get('/api/admin/dashboard',
    auth,
    requireRole('admin'),
    async (req, res) => {
        // Handler code
    }
);
```

### Error Responses

When access is denied, the middleware returns:

```json
{
    "success": false,
    "error": {
        "message": "Access denied. Requires verified_user role or higher.",
        "code": 403,
        "requiredRole": "verified_user",
        "currentRole": "user"
    }
}
```

### Helper Functions

```javascript
const { hasFeatureAccess } = require('./middleware/roleGuard');

// Check access programmatically
if (hasFeatureAccess(user.role, 'moderate_content')) {
    // Allow action
}
```

---

## Role Hierarchy

Roles are organized in ascending levels of privilege:

```
Level 1: user                → New user
Level 2: verified_user       → KYC completed
Level 3: active_member       → Active participation
Level 4: coordinator         → Tanda management
Level 5: moderator           → Content moderation
Level 6: admin               → Platform administration
Level 7: administrator       → High-level admin
Level 8: super_admin         → Full system access
```

**Inheritance:** Higher roles inherit permissions of lower roles.

---

## Feature Access Matrix

| Feature | Minimum Role | Description |
|---------|--------------|-------------|
| `create_tanda` | verified_user | Create new tandas |
| `edit_tanda` | coordinator | Edit existing tandas |
| `delete_tanda` | moderator | Delete tandas |
| `moderate_content` | moderator | Moderate posts/comments |
| `ban_users` | moderator | Ban/suspend users |
| `assign_roles` | admin | Assign roles to users |
| `review_applications` | admin | Review role applications |
| `view_analytics` | coordinator | View platform analytics |
| `export_reports` | admin | Export data reports |
| `process_payouts` | admin | Process financial payouts |
| `manage_wallets` | verified_user | Manage crypto wallets |
| `access_admin_panel` | admin | Access admin interface |
| `system_settings` | administrator | Modify system settings |
| `create_post` | verified_user | Create community posts |
| `comment` | verified_user | Comment on posts |

---

## Usage Examples

### Example 1: Simple Button Protection

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="/utils/roleGuard.css">
</head>
<body>
    <h1>My Dashboard</h1>

    <!-- Only verified users can create tandas -->
    <button data-feature="create_tanda" data-gate-action="disable"
            class="btn btn-primary">
        Create New Tanda
    </button>

    <!-- Only admins can access admin panel -->
    <a href="/admin" data-feature="access_admin_panel"
       data-gate-action="hide">
        Admin Panel
    </a>

    <script src="/utils/roleGuard.js"></script>
</body>
</html>
```

### Example 2: Premium Feature with Lock Overlay

```html
<div class="card" data-feature="view_analytics" data-gate-action="lock">
    <h3>📊 Analytics Dashboard</h3>
    <div class="analytics-content">
        <canvas id="chart"></canvas>
        <div class="stats">
            <!-- Statistics -->
        </div>
    </div>
</div>
```

Result: Non-coordinators see a blurred overlay with upgrade prompt.

### Example 3: Dynamic Content Based on Role

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    await window.roleGuard.init();

    const userRole = window.roleGuard.currentRole;

    // Show different menu items based on role
    if (window.roleGuard.hasMinimumRole('admin')) {
        document.getElementById('adminMenu').style.display = 'block';
    }

    if (window.roleGuard.hasAccess('moderate_content')) {
        document.getElementById('moderatorTools').style.display = 'block';
    }
});
```

### Example 4: Backend Endpoint Protection

```javascript
const express = require('express');
const { requireFeature, requireRole } = require('./middleware/roleGuard');
const auth = require('./middleware/auth');

const router = express.Router();

// Tanda creation - requires verified_user
router.post('/api/tandas',
    auth,
    requireFeature('create_tanda'),
    async (req, res) => {
        try {
            const tanda = await createTanda(req.body);
            res.json({ success: true, data: tanda });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

// Admin operations - requires admin role
router.get('/api/admin/users',
    auth,
    requireRole('admin'),
    async (req, res) => {
        const users = await getAllUsers();
        res.json({ success: true, data: users });
    }
);

// Moderation - requires moderator role
router.delete('/api/posts/:id',
    auth,
    requireFeature('moderate_content'),
    async (req, res) => {
        await deletePost(req.params.id);
        res.json({ success: true });
    }
);

module.exports = router;
```

---

## Customization

### Adding New Features

1. **Update Feature Access Matrix** (both frontend and backend):

```javascript
// utils/roleGuard.js
this.FEATURE_ACCESS = {
    ...
    'my_new_feature': ['active_member', 'coordinator', 'admin']
};
```

```javascript
// middleware/roleGuard.js
const FEATURE_ACCESS = {
    ...
    'my_new_feature': ['active_member', 'coordinator', 'admin']
};
```

2. **Mark HTML elements:**

```html
<button data-feature="my_new_feature" data-gate-action="lock">
    New Feature
</button>
```

3. **Protect backend endpoint:**

```javascript
router.post('/api/my-feature',
    auth,
    requireFeature('my_new_feature'),
    handler
);
```

### Adding New Roles

1. **Update Role Hierarchy:**

```javascript
this.ROLE_HIERARCHY = {
    ...
    'my_new_role': 6.5  // Between admin (6) and administrator (7)
};
```

2. **Update Role Display Names:**

```javascript
this.ROLE_NAMES = {
    ...
    'my_new_role': 'My New Role'
};
```

3. **Update Feature Access Matrix** to include new role where appropriate.

### Customizing UI

Modify `utils/roleGuard.css` to match your brand:

```css
/* Change primary color */
.upgrade-button {
    background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}

/* Change modal style */
.modal-content {
    border-radius: 20px;
    /* Your styles */
}
```

---

## Best Practices

### 1. Always Use Both Frontend and Backend Protection

**❌ Bad:**
```html
<!-- Only frontend protection -->
<button data-feature="delete_user">Delete User</button>
```

**✅ Good:**
```html
<!-- Frontend protection -->
<button data-feature="delete_user" data-gate-action="disable">
    Delete User
</button>
```
```javascript
// Backend protection
router.delete('/api/users/:id', auth, requireFeature('delete_user'), handler);
```

### 2. Use Appropriate Gate Actions

- **Hide:** Confidential features (admin panels, sensitive data)
- **Disable:** Actions users know exist but need permission
- **Lock:** Premium/promotional features to encourage upgrades

### 3. Provide Clear Upgrade Paths

The system automatically shows upgrade requirements. Ensure your role requirements are documented and achievable.

### 4. Test with Different Roles

```javascript
// Test helper function
async function testAsRole(role) {
    localStorage.setItem('latanda_user', JSON.stringify({ role }));
    await window.roleGuard.refresh();
}

// Test as different roles
await testAsRole('user');
await testAsRole('verified_user');
await testAsRole('admin');
```

### 5. Handle Role Changes Gracefully

```javascript
// After user role changes
await window.roleGuard.refresh();

// Or reload the page
window.location.reload();
```

### 6. Log Access Denied Events

```javascript
// In backend middleware
router.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        if (data.error && data.error.code === 403) {
            console.log(`Access denied: ${req.user.email} to ${req.path}`);
            // Log to monitoring system
        }
        originalJson.call(this, data);
    };
    next();
});
```

---

## Troubleshooting

### Feature Gates Not Working

**Problem:** Elements not being hidden/disabled.

**Solutions:**
1. Check browser console for errors
2. Verify `roleGuard.js` is loaded after DOM
3. Ensure `data-feature` names match `FEATURE_ACCESS` keys
4. Check user role is correctly loaded: `console.log(window.roleGuard.currentRole)`

```javascript
// Debug current state
console.log('Current Role:', window.roleGuard.currentRole);
console.log('Has Access:', window.roleGuard.hasAccess('your_feature'));
```

### Backend Returns 403 but Frontend Shows Feature

**Problem:** Mismatch between frontend and backend access matrices.

**Solution:** Ensure `FEATURE_ACCESS` is identical in both files:
- `utils/roleGuard.js` (frontend)
- `middleware/roleGuard.js` (backend)

### Role Not Updating

**Problem:** User role changed but UI doesn't update.

**Solution:**
```javascript
// Call refresh after role change
await window.roleGuard.refresh();

// Or force page reload
window.location.reload();
```

### Locked Features Not Showing Overlay

**Problem:** `data-gate-action="lock"` not displaying overlay.

**Solutions:**
1. Verify `roleGuard.css` is loaded
2. Check element has position (relative/absolute/fixed)
3. Ensure element has content (min height/width)

```css
/* Add to your CSS if needed */
[data-feature][data-gate-action="lock"] {
    min-height: 100px;
    position: relative;
}
```

### localStorage Not Persisting

**Problem:** User role resets on page reload.

**Solution:** Check auth system is properly storing user data:

```javascript
// After successful login
localStorage.setItem('latanda_user', JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role  // ← Ensure role is included
}));
```

---

## API Reference

### Frontend (window.roleGuard)

#### Methods

```javascript
// Initialize system
await roleGuard.init()

// Check feature access
roleGuard.hasAccess(featureName: string): boolean

// Check minimum role
roleGuard.hasMinimumRole(minimumRole: string): boolean

// Get required role for feature
roleGuard.getRequiredRole(featureName: string): string

// Apply gate to element
roleGuard.applyGate(element: HTMLElement, featureName: string, action: string)

// Show upgrade prompt
roleGuard.showUpgradePrompt(featureName: string, requiredRole: string)

// Refresh user role
await roleGuard.refresh()
```

#### Properties

```javascript
roleGuard.currentUser: object|null
roleGuard.currentRole: string
roleGuard.FEATURE_ACCESS: object
roleGuard.ROLE_HIERARCHY: object
roleGuard.ROLE_NAMES: object
```

### Backend (middleware/roleGuard.js)

#### Functions

```javascript
// Middleware: require feature access
requireFeature(featureName: string): Function

// Middleware: require minimum role
requireRole(minimumRole: string): Function

// Helper: check feature access
hasFeatureAccess(userRole: string, featureName: string): boolean
```

---

## License

This feature gating system is part of the La Tanda Web platform.

**Created for Bounty #17**

---

## Support

For questions or issues:
- GitHub Issues: https://github.com/INDIGOAZUL/la-tanda-web/issues
- Discord: [Join our server]
- Email: dev@latanda.online

---

**Last Updated:** October 29, 2025
**Version:** 1.0.0
**Author:** Bounty #17 Contributor
