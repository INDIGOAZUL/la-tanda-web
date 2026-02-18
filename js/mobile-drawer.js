/**
 * LA TANDA - Mobile Drawer Navigation
 * Slide-out menu for mobile devices
 * Version: 1.0.0
 * Added: 2026-01-26
 */

const MobileDrawer = {
    drawer: null,
    overlay: null,
    isOpen: false,

    init() {
        this.drawer = document.getElementById('mobileDrawer');
        this.overlay = document.getElementById('mobileDrawerOverlay');

        if (!this.drawer || !this.overlay) {
            return;
        }

        // Load user data
        this.loadUserData();

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Prevent body scroll when drawer is open
        this.drawer.addEventListener('touchmove', (e) => e.stopPropagation());

    },

    open() {
        if (!this.drawer || !this.overlay) return;

        this.isOpen = true;
        this.overlay.classList.add('active');
        this.drawer.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Refresh user data when opening
        this.loadUserData();
    },

    close() {
        if (!this.drawer || !this.overlay) return;

        this.isOpen = false;
        this.drawer.classList.remove('active');

        // Delay overlay hide for animation
        setTimeout(() => {
            this.overlay.classList.remove('active');
        }, 100);

        document.body.style.overflow = '';
    },

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    loadUserData() {
        try {
            const userStr = localStorage.getItem('latanda_user');
            if (userStr) {
                const user = JSON.parse(userStr);

                // Update name
                const nameEl = document.getElementById('mobileDrawerUserName');
                if (nameEl && user.name) {
                    nameEl.textContent = user.name;
                }

                // Update handle
                const handleEl = document.getElementById('mobileDrawerUserHandle');
                if (handleEl && user.email) {
                    handleEl.textContent = '@' + user.email.split('@')[0];
                }

                // Update avatar with initials
                const avatarEl = document.getElementById('mobileDrawerAvatar');
                if (avatarEl && user.name) {
                    const initials = user.name.split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2);
                    avatarEl.innerHTML = `<span style="font-size:1rem;font-weight:600;">${initials}</span>`;
                }
            }

            // Load follow stats
            this.loadFollowStats();
        } catch (error) {
        }
    },

    async loadFollowStats() {
        const token = (localStorage.getItem('auth_token') || localStorage.getItem('authToken'));
        if (!token) return;

        try {
            // Get following count
            const followingRes = await fetch('/api/feed/social/following?limit=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (followingRes.ok) {
                const data = await followingRes.json();
                const followingEl = document.getElementById('mobileDrawerFollowing');
                if (followingEl && data.success) {
                    // Note: This endpoint returns feed, not count. We'd need a proper stats endpoint
                    // For now, show placeholder or fetch from user profile
                    followingEl.textContent = '0';
                }
            }

            // Followers would need a different endpoint
            const followersEl = document.getElementById('mobileDrawerFollowers');
            if (followersEl) {
                followersEl.textContent = '0';
            }
        } catch (error) {
        }
    },

    openCompose() {
        // Close drawer if open
        this.close();

        // Show compose popup (to be implemented)
        if (window.LaTandaPopup) {
            window.LaTandaPopup.showInfo('Crear publicacion proximamente');
        }
    },

    logout() {
        this.close();

        if (confirm('¿Seguro que deseas cerrar sesión?')) {
            // Clear auth data
            localStorage.removeItem('authToken'); localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('latanda_user');
            sessionStorage.removeItem('auth_token');

            // Redirect to login
            window.location.href = 'index.html';
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileDrawer.init());
} else {
    MobileDrawer.init();
}

// Make globally available
window.MobileDrawer = MobileDrawer;

// ============================================
// DRAWER QUICK STATS
// Added: 2026-01-26
// ============================================
MobileDrawer.loadQuickStats = async function() {
    const token = (localStorage.getItem('auth_token') || localStorage.getItem('authToken'));
    if (!token) return;

    try {
        // Fetch balance
        const balanceRes = await fetch('/api/wallet/balance', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (balanceRes.ok) {
            const data = await balanceRes.json();
            if (data.success && data.data) {
                const el = document.getElementById('drawerBalance');
                if (el) el.textContent = (data.data.balance || 0).toFixed(2) + ' LTD';
            }
        }

        // Fetch tandas
        const tandasRes = await fetch('/api/groups/my-groups', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (tandasRes.ok) {
            const data = await tandasRes.json();
            if (data.success && data.data) {
                const count = (data.data.groups || []).filter(g => g.status === 'active').length;
                const el = document.getElementById('drawerTandas');
                if (el) el.textContent = count;
            }
        }

        // Fetch products
        const productsRes = await fetch('/api/marketplace/my-products', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (productsRes.ok) {
            const data = await productsRes.json();
            if (data.success && data.data) {
                const count = (data.data.products || []).length;
                const el = document.getElementById('drawerProducts');
                if (el) el.textContent = count;
            }
        }

        // Calculate progress (simple formula)
        const progressEl = document.getElementById('drawerProgress');
        if (progressEl) {
            // Progress based on profile completion, tandas, etc.
            let progress = 20; // Base
            const userStr = localStorage.getItem('latanda_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.name) progress += 20;
                if (user.email) progress += 20;
            }
            const tandas = parseInt(document.getElementById('drawerTandas')?.textContent) || 0;
            if (tandas > 0) progress += 20;
            const products = parseInt(document.getElementById('drawerProducts')?.textContent) || 0;
            if (products > 0) progress += 20;
            progressEl.textContent = Math.min(progress, 100) + '%';
        }

    } catch (error) {
    }
};

// Call loadQuickStats when opening drawer
const originalOpen = MobileDrawer.open;
MobileDrawer.open = function() {
    originalOpen.call(this);
    this.loadQuickStats();
};
