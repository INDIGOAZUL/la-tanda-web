/**
 * Backend Role-Based Access Control Middleware
 * Bounty #17 Implementation - La Tanda Web
 *
 * This middleware enforces role-based access control on the server side.
 * Works with Express.js to protect API endpoints.
 */

// Feature Access Matrix (must match frontend)
const FEATURE_ACCESS = {
    // Tanda Management
    'create_tanda': ['verified_user', 'active_member', 'coordinator', 'moderator', 'admin', 'administrator', 'super_admin'],
    'edit_tanda': ['coordinator', 'moderator', 'admin', 'administrator', 'super_admin'],
    'delete_tanda': ['moderator', 'admin', 'administrator', 'super_admin'],

    // Content Moderation
    'moderate_content': ['moderator', 'admin', 'administrator', 'super_admin'],
    'ban_users': ['moderator', 'admin', 'administrator', 'super_admin'],

    // Role Management
    'assign_roles': ['admin', 'administrator', 'super_admin'],
    'review_applications': ['admin', 'administrator', 'super_admin'],

    // Analytics & Reports
    'view_analytics': ['coordinator', 'admin', 'administrator', 'super_admin'],
    'export_reports': ['admin', 'administrator', 'super_admin'],

    // Financial Operations
    'process_payouts': ['admin', 'administrator', 'super_admin'],
    'manage_wallets': ['verified_user', 'active_member', 'coordinator', 'moderator', 'admin', 'administrator', 'super_admin'],

    // Administration
    'access_admin_panel': ['admin', 'administrator', 'super_admin'],
    'system_settings': ['administrator', 'super_admin'],

    // Community Features
    'create_post': ['verified_user', 'active_member', 'coordinator', 'moderator', 'admin', 'administrator', 'super_admin'],
    'comment': ['verified_user', 'active_member', 'coordinator', 'moderator', 'admin', 'administrator', 'super_admin']
};

// Role Hierarchy
const ROLE_HIERARCHY = {
    'user': 1,
    'verified_user': 2,
    'active_member': 3,
    'coordinator': 4,
    'moderator': 5,
    'admin': 6,
    'administrator': 7,
    'super_admin': 8
};

/**
 * Middleware to require a specific feature access
 * @param {string} featureName - The required feature
 * @returns {Function} Express middleware
 */
function requireFeature(featureName) {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required',
                    code: 401
                }
            });
        }

        const userRole = req.user.role || 'user';

        // Check if feature exists
        if (!FEATURE_ACCESS[featureName]) {
            console.error(`Feature "${featureName}" not defined in access matrix`);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Feature configuration error',
                    code: 500
                }
            });
        }

        // Check if user has access
        if (!FEATURE_ACCESS[featureName].includes(userRole)) {
            const requiredRole = getLowestRequiredRole(featureName);

            return res.status(403).json({
                success: false,
                error: {
                    message: `Access denied. Requires ${requiredRole} role or higher.`,
                    code: 403,
                    requiredRole: requiredRole,
                    currentRole: userRole
                }
            });
        }

        // User has access
        next();
    };
}

/**
 * Middleware to require a minimum role level
 * @param {string} minimumRole - The minimum required role
 * @returns {Function} Express middleware
 */
function requireRole(minimumRole) {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required',
                    code: 401
                }
            });
        }

        const userRole = req.user.role || 'user';
        const currentLevel = ROLE_HIERARCHY[userRole] || 0;
        const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

        if (currentLevel < requiredLevel) {
            return res.status(403).json({
                success: false,
                error: {
                    message: `Access denied. Requires ${minimumRole} role or higher.`,
                    code: 403,
                    requiredRole: minimumRole,
                    currentRole: userRole
                }
            });
        }

        // User has sufficient role level
        next();
    };
}

/**
 * Check if a user has access to a feature (helper function)
 * @param {string} userRole - The user's role
 * @param {string} featureName - The feature to check
 * @returns {boolean}
 */
function hasFeatureAccess(userRole, featureName) {
    if (!FEATURE_ACCESS[featureName]) {
        return false;
    }

    return FEATURE_ACCESS[featureName].includes(userRole);
}

/**
 * Get the lowest required role for a feature
 * @param {string} featureName - The feature name
 * @returns {string}
 */
function getLowestRequiredRole(featureName) {
    const roles = FEATURE_ACCESS[featureName];
    if (!roles || roles.length === 0) return 'user';

    let lowestRole = roles[0];
    let lowestLevel = ROLE_HIERARCHY[lowestRole];

    for (const role of roles) {
        const level = ROLE_HIERARCHY[role];
        if (level < lowestLevel) {
            lowestLevel = level;
            lowestRole = role;
        }
    }

    return lowestRole;
}

module.exports = {
    requireFeature,
    requireRole,
    hasFeatureAccess,
    FEATURE_ACCESS,
    ROLE_HIERARCHY
};
