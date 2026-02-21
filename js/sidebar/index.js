/**
 * La Tanda Sidebar Module v1.3
 * Main entry point - Facade pattern for sidebar functionality
 * Fixed: Badge updates after sidebar is fully loaded
 */

const LaTandaSidebar = {
    initialized: false,
    loaded: false,
    badgeUpdateInterval: null,

    async init() {
        if (this.initialized) return;

        try {
            // Wait for sidebar element to exist in DOM
            await this.waitForSidebar();

            // Initialize sub-modules
            if (window.SidebarUI) {
            }

            if (window.SidebarEvents) {
                SidebarEvents.init();
            }

            if (window.SidebarNavigation) {
                SidebarNavigation.init();
            }

            this.initialized = true;

            // Update badges after initialization (with small delay to ensure DOM is ready)
            setTimeout(() => this.updateBadges(), 500);
            
            // Set up periodic badge updates (every 60 seconds)
            this.badgeUpdateInterval = setInterval(() => this.updateBadges(), 60000);

            // Emit ready event
            if (window.EventBus) {
                window.EventBus.emit('sidebar:ready');
            }

        } catch (error) {
        }
    },

    // Wait for sidebar element to be in DOM
    async waitForSidebar() {
        let attempts = 0;
        while (!document.getElementById('sidebar') && attempts < 50) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        if (!document.getElementById('sidebar')) {
        } else {
            this.loaded = true;
        }
    },

    // Update all dynamic badges from API
    async updateBadges() {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            if (!token) {
                return;
            }

            const response = await fetch('/api/dashboard/summary', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            
            if (data.success && data.dashboard) {
                const dashboard = data.dashboard;
                
                // Update tandas count badge
                this.updateBadge('tandasCount', dashboard.active_tandas || 0);
                
                // Update invitations count badge
                this.updateBadge('invitationsCount', dashboard.pending_invitations || 0);
                
                // Update KYC badge (show if not verified)
                this.updateKycBadge(dashboard.kyc_status);
            }
        } catch (error) {
        }
    },

    // Update KYC badge visibility based on verification_level
    updateKycBadge(level) {
        const kycBadge = document.getElementById('kycBadge');
        if (!kycBadge) return;

        // Levels that indicate verified status
        const verifiedLevels = ['intermediate', 'full', 'verified', 'advanced'];
        const isVerified = level && verifiedLevels.includes(level.toLowerCase());

        if (isVerified) {
            // Hide badge if verified
            kycBadge.style.display = 'none';
        } else {
            // Show badge with appropriate indicator
            kycBadge.style.display = 'inline-block';
            
            if (level === 'basic') {
                kycBadge.textContent = '!';
                kycBadge.title = 'Completa tu verificación KYC';
            } else if (level === 'pending' || level === 'pending_review') {
                kycBadge.textContent = '⏳';
                kycBadge.title = 'KYC en revisión';
            } else {
                // none or unknown
                kycBadge.textContent = '!';
                kycBadge.title = 'Verificación KYC requerida';
            }
        }
    },

    // Public API
    open() {
        if (window.SidebarUI) SidebarUI.open();
    },

    close() {
        if (window.SidebarUI) SidebarUI.close();
    },

    toggle() {
        if (window.SidebarUI) SidebarUI.toggle();
    },

    isOpen() {
        return window.SidebarUI ? SidebarUI.isOpen : false;
    },

    updateBadge(id, value) {
        const badge = document.getElementById(id);
        if (badge) {
            badge.textContent = value;
            badge.style.display = value > 0 ? 'inline-block' : 'none';
        }
    },

    navigateTo(page) {
        if (window.SidebarNavigation) SidebarNavigation.goTo(page);
    },

    destroy() {
        if (window.SidebarEvents) SidebarEvents.destroy();
        
        // Clear badge update interval
        if (this.badgeUpdateInterval) {
            clearInterval(this.badgeUpdateInterval);
            this.badgeUpdateInterval = null;
        }
        
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) sidebar.remove();
        if (overlay) overlay.remove();
        
        this.initialized = false;
        this.loaded = false;
    }
};

window.LaTandaSidebar = LaTandaSidebar;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LaTandaSidebar.init());
} else {
    // Small delay to ensure other scripts have loaded
    setTimeout(() => LaTandaSidebar.init(), 100);
}
