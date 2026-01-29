/**
 * Role-Based Feature Gating System
 * Bounty #17 Implementation - La Tanda Web
 *
 * This utility manages access control for features based on user roles.
 * Integrates with existing auth system (localStorage.getItem('auth_token'))
 */

class RoleGuard {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = null;
        this.currentRole = null;

        // Feature Access Matrix - defines which roles can access which features
        this.FEATURE_ACCESS = {
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

        // Role Hierarchy - used for "at least" checks
        this.ROLE_HIERARCHY = {
            'user': 1,
            'verified_user': 2,
            'active_member': 3,
            'coordinator': 4,
            'moderator': 5,
            'admin': 6,
            'administrator': 7,
            'super_admin': 8
        };

        // Role Display Names
        this.ROLE_NAMES = {
            'user': 'Usuario',
            'verified_user': 'Usuario Verificado',
            'active_member': 'Miembro Activo',
            'coordinator': 'Coordinador',
            'moderator': 'Moderador',
            'admin': 'Administrador',
            'administrator': 'Administrador Principal',
            'super_admin': 'Super Administrador'
        };

        this.init();
    }

    /**
     * Initialize the role guard system
     */
    async init() {
        await this.loadCurrentUser();
        this.applyFeatureGates();
        this.setupMutationObserver();
    }

    /**
     * Load current user data from localStorage or API
     */
    async loadCurrentUser() {
        try {
            const authToken = localStorage.getItem('auth_token') || localStorage.getItem('latanda_auth_token');

            if (!authToken) {
                this.currentRole = 'user'; // Default role for unauthenticated users
                return;
            }

            // Try to get user from localStorage first
            const storedUser = localStorage.getItem('latanda_user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                this.currentUser = userData;
                this.currentRole = userData.role || 'user';
            }

            // Optionally fetch fresh user data from API
            try {
                const response = await fetch(`${this.API_BASE}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                        this.currentUser = data.user;
                        this.currentRole = data.user.role || 'user';
                        localStorage.setItem('latanda_user', JSON.stringify(data.user));
                    }
                }
            } catch (apiError) {
                console.warn('Could not fetch fresh user data, using cached role:', apiError);
            }

        } catch (error) {
            console.error('Error loading user:', error);
            this.currentRole = 'user';
        }
    }

    /**
     * Check if current user has access to a feature
     * @param {string} featureName - The feature to check
     * @returns {boolean}
     */
    hasAccess(featureName) {
        if (!this.FEATURE_ACCESS[featureName]) {
            console.warn(`Feature "${featureName}" not defined in access matrix`);
            return false;
        }

        return this.FEATURE_ACCESS[featureName].includes(this.currentRole);
    }

    /**
     * Check if current user has a minimum role level
     * @param {string} minimumRole - The minimum required role
     * @returns {boolean}
     */
    hasMinimumRole(minimumRole) {
        const currentLevel = this.ROLE_HIERARCHY[this.currentRole] || 0;
        const requiredLevel = this.ROLE_HIERARCHY[minimumRole] || 0;
        return currentLevel >= requiredLevel;
    }

    /**
     * Get the required role for a feature
     * @param {string} featureName - The feature name
     * @returns {string|null} - The lowest required role
     */
    getRequiredRole(featureName) {
        const roles = this.FEATURE_ACCESS[featureName];
        if (!roles || roles.length === 0) return null;

        // Return the lowest level role that has access
        let lowestRole = roles[0];
        let lowestLevel = this.ROLE_HIERARCHY[lowestRole];

        for (const role of roles) {
            const level = this.ROLE_HIERARCHY[role];
            if (level < lowestLevel) {
                lowestLevel = level;
                lowestRole = role;
            }
        }

        return lowestRole;
    }

    /**
     * Apply feature gates to all elements with data-feature attribute
     */
    applyFeatureGates() {
        const gatedElements = document.querySelectorAll('[data-feature]');

        gatedElements.forEach(element => {
            const featureName = element.getAttribute('data-feature');
            const action = element.getAttribute('data-gate-action') || 'hide'; // hide, disable, or lock

            if (!this.hasAccess(featureName)) {
                this.applyGate(element, featureName, action);
            }
        });
    }

    /**
     * Apply a gate to a specific element
     * @param {HTMLElement} element - The element to gate
     * @param {string} featureName - The feature name
     * @param {string} action - The gating action (hide, disable, lock)
     */
    applyGate(element, featureName, action) {
        const requiredRole = this.getRequiredRole(featureName);
        const roleDisplayName = this.ROLE_NAMES[requiredRole] || requiredRole;

        switch (action) {
            case 'hide':
                element.style.display = 'none';
                break;

            case 'disable':
                element.disabled = true;
                element.classList.add('feature-locked');
                element.title = `Requiere rol: ${roleDisplayName}`;
                break;

            case 'lock':
                element.classList.add('feature-locked');
                element.style.position = 'relative';
                element.style.pointerEvents = 'none';
                element.style.opacity = '0.5';

                // Add lock overlay
                const overlay = document.createElement('div');
                overlay.className = 'feature-lock-overlay';
                overlay.innerHTML = `
                    <div class="lock-icon">🔒</div>
                    <div class="lock-message">
                        <strong>Función bloqueada</strong>
                        <p>Requiere rol: ${roleDisplayName}</p>
                        <button class="upgrade-button" onclick="window.roleGuard.showUpgradePrompt('${featureName}', '${requiredRole}')">
                            Ver cómo desbloquear
                        </button>
                    </div>
                `;

                // Position overlay
                const elementPosition = window.getComputedStyle(element).position;
                if (elementPosition === 'static') {
                    element.style.position = 'relative';
                }

                element.appendChild(overlay);
                break;
        }
    }

    /**
     * Show upgrade prompt modal
     * @param {string} featureName - The feature name
     * @param {string} requiredRole - The required role
     */
    showUpgradePrompt(featureName, requiredRole) {
        const roleDisplayName = this.ROLE_NAMES[requiredRole] || requiredRole;
        const currentRoleDisplay = this.ROLE_NAMES[this.currentRole] || this.currentRole;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'role-upgrade-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.role-upgrade-modal').remove()">×</button>
                <div class="modal-header">
                    <h2>🎯 Desbloquear Función</h2>
                </div>
                <div class="modal-body">
                    <div class="role-comparison">
                        <div class="current-role">
                            <span class="label">Tu rol actual</span>
                            <span class="role-badge">${currentRoleDisplay}</span>
                        </div>
                        <div class="role-arrow">→</div>
                        <div class="required-role">
                            <span class="label">Rol requerido</span>
                            <span class="role-badge required">${roleDisplayName}</span>
                        </div>
                    </div>

                    <div class="feature-info">
                        <p><strong>Función bloqueada:</strong> ${this.getFeatureDisplayName(featureName)}</p>
                    </div>

                    <div class="upgrade-path">
                        <h3>¿Cómo obtener este rol?</h3>
                        <ul>
                            ${this.getUpgradeRequirements(requiredRole).map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="modal-actions">
                        <a href="/role-system.html" class="btn btn-primary">Ver todos los roles</a>
                        <a href="/role-application.html?role=${requiredRole}" class="btn btn-success">Solicitar rol</a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Get feature display name
     * @param {string} featureName - The feature name
     * @returns {string}
     */
    getFeatureDisplayName(featureName) {
        const displayNames = {
            'create_tanda': 'Crear Tanda',
            'edit_tanda': 'Editar Tanda',
            'delete_tanda': 'Eliminar Tanda',
            'moderate_content': 'Moderar Contenido',
            'assign_roles': 'Asignar Roles',
            'view_analytics': 'Ver Analíticas',
            'access_admin_panel': 'Panel de Administración',
            'process_payouts': 'Procesar Pagos',
            'manage_wallets': 'Gestionar Billetera'
        };

        return displayNames[featureName] || featureName;
    }

    /**
     * Get upgrade requirements for a role
     * @param {string} role - The target role
     * @returns {Array<string>}
     */
    getUpgradeRequirements(role) {
        const requirements = {
            'verified_user': [
                'Completar verificación KYC',
                'Proporcionar identificación válida'
            ],
            'active_member': [
                'Completar verificación KYC',
                'Realizar al menos 5 transacciones',
                'Participar en 5 tandas diferentes',
                'Cuenta activa por 14 días'
            ],
            'coordinator': [
                'Crear al menos 10 tandas',
                'Tasa de finalización del 95% o más',
                'Calificación promedio de 4.5/5',
                'Sin pagos atrasados en los últimos 90 días'
            ],
            'moderator': [
                'Aplicar mediante solicitud',
                'Historial comprobado de contribuciones',
                'Aprobación del equipo de administración'
            ],
            'admin': [
                'Asignado solo por administradores de nivel superior',
                'Requiere aprobación del Super Admin'
            ]
        };

        return requirements[role] || ['Contactar al administrador'];
    }

    /**
     * Setup MutationObserver to watch for dynamically added elements
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-feature')) {
                        const featureName = node.getAttribute('data-feature');
                        const action = node.getAttribute('data-gate-action') || 'hide';

                        if (!this.hasAccess(featureName)) {
                            this.applyGate(node, featureName, action);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Refresh user role (call after role change)
     */
    async refresh() {
        await this.loadCurrentUser();
        this.applyFeatureGates();
    }
}

// Initialize global instance
window.roleGuard = new RoleGuard();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoleGuard;
}
