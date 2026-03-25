/**
 * LA TANDA - Header Main Module (Facade)
 * Entry point and public API
 * @version 1.0
 */

const LaTandaHeader = {
    initialized: false,

    /**
     * Initialize all header modules
     */
    init() {
        if (this.initialized) {
            return;
        }

        // Wait for header DOM to be ready
        const mainHeader = document.getElementById("mainHeader");
        if (!mainHeader) {
            setTimeout(() => this.init(), 100);
            return;
        }

        // Initialize sub-modules
        if (window.HeaderUI) window.HeaderUI.init();
        if (window.HeaderEvents) window.HeaderEvents.init();
        if (window.HeaderDropdown) window.HeaderDropdown.init();
        if (window.HeaderSync) window.HeaderSync.start();

        // Restore balance visibility state
        const balanceHidden = localStorage.getItem("balanceHidden") === "true";
        if (balanceHidden && window.HeaderUI) {
            window.HeaderUI.toggleBalanceVisibility(true);
        }

        // Load user avatar
        this.loadUserAvatar();
        this.initialized = true;
    },

    /**
     * Load user avatar into header
     */
    loadUserAvatar() {
        try {
            const userData = JSON.parse(localStorage.getItem("latanda_user") || sessionStorage.getItem("latanda_user") || "{}");
            const avatarUrl = userData.avatar_url;
            const headerAvatar = document.getElementById("headerAvatar");
            const headerFallback = document.getElementById("headerAvatarFallback");
            
            if (headerAvatar && avatarUrl) {
                headerAvatar.src = avatarUrl;
                headerAvatar.style.display = "block";
                if (headerFallback) headerFallback.style.display = "none";
            } else if (headerFallback) {
                if (headerAvatar) headerAvatar.style.display = "none";
                headerFallback.style.display = "flex";
            }
        } catch (e) {
        }
    },

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (window.HeaderSync) window.HeaderSync.stop();
        if (window.HeaderEvents) window.HeaderEvents.destroy();
        this.initialized = false;
    },

    // ============================================
    // PUBLIC API
    // ============================================

    // Data operations
    refreshBalance: () => window.HeaderSync && window.HeaderSync.forceRefresh("balance"),
    refreshNotifications: () => window.HeaderSync && window.HeaderSync.forceRefresh("notifications"),
    refreshAll: () => window.HeaderSync && window.HeaderSync.syncAll(),

    // UI operations
    updateBalance: (data) => window.HeaderUI && window.HeaderUI.updateBalance(data),
    updateNotifCount: (count) => window.HeaderUI && window.HeaderUI.updateNotifCount(count),
    showLoading: (id, show) => window.HeaderUI && window.HeaderUI.showLoading(id, show),
    showToast: (msg, type) => window.HeaderUI && window.HeaderUI.showToast(msg, type),

    // Dropdown operations
    openWallet: () => window.HeaderDropdown && window.HeaderDropdown.open(),
    closeWallet: () => window.HeaderDropdown && window.HeaderDropdown.close(),
    toggleWallet: () => window.HeaderDropdown && window.HeaderDropdown.toggle(),

    // Event subscription
    on: (event, callback) => window.LaTandaEvents && window.LaTandaEvents.on(event, callback),
    off: (event, callback) => window.LaTandaEvents && window.LaTandaEvents.off(event, callback),

    // State
    getState: () => ({
        initialized: LaTandaHeader.initialized,
        balanceHidden: localStorage.getItem("balanceHidden") === "true",
        dropdownOpen: window.HeaderDropdown ? window.HeaderDropdown.isOpen : false,
        lastSync: window.HeaderSync ? window.HeaderSync.lastSync : null
    })
};

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Give component loader time to inject header
    setTimeout(() => {
        if (!LaTandaHeader.initialized) {
            LaTandaHeader.init();
        }
    }, 500);
});

// Also listen for custom event from component loader
document.addEventListener("headerLoaded", () => {
    if (!LaTandaHeader.initialized) {
        LaTandaHeader.init();
    }
});

window.LaTandaHeader = LaTandaHeader;
