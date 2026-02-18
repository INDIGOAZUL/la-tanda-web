/**
 * LA TANDA - Header Sync Manager
 * Real-time data synchronization with polling
 * @version 1.3 - Added JWT authentication
 */

const HeaderSync = {
    intervals: {},
    isVisible: true,
    lastSync: null,
    pausedAt: null,

    // Sync configuration
    config: {
        balanceInterval: 30000,    // 30 seconds
        notifInterval: 60000,      // 60 seconds
        pauseThreshold: 30000      // Refresh all if hidden > 30s
    },

    /**
     * Get auth token for API calls
     */
    getAuthToken() {
        return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || null;
    },

    /**
     * Get headers with JWT
     */
    getAuthHeaders() {
        const token = this.getAuthToken();
        return token ? { "Authorization": "Bearer " + token } : {};
    },

    /**
     * Get user ID - uses centralized LaTandaUser system
     */
    getUserId() {
        // Try LaTandaUser first (centralized system)
        if (window.LaTandaUser && window.LaTandaUser.getId) {
            const id = window.LaTandaUser.getId();
            if (id) return id;
        }

        // Try latanda_user JSON
        try {
            const userData = localStorage.getItem("latanda_user");
            if (userData) {
                const user = JSON.parse(userData);
                if (user.id) return user.id;
            }
        } catch (e) {}

        // Fallback to direct user_id
        return localStorage.getItem("user_id") || null;
    },

    /**
     * Start automatic synchronization
     */
    start() {
        // Visibility change handler
        document.addEventListener("visibilitychange", () => {
            this.handleVisibilityChange();
        });

        // Start intervals
        this.intervals.balance = setInterval(() => {
            if (this.isVisible) this.syncBalance();
        }, this.config.balanceInterval);

        this.intervals.notifications = setInterval(() => {
            if (this.isVisible) this.syncNotifications();
        }, this.config.notifInterval);

        // Initial sync
        this.syncAll();
    },

    /**
     * Stop all synchronization
     */
    stop() {
        Object.values(this.intervals).forEach(clearInterval);
        this.intervals = {};
    },

    /**
     * Handle visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.isVisible = false;
            this.pausedAt = Date.now();
        } else {
            this.isVisible = true;
            if (this.pausedAt && Date.now() - this.pausedAt > this.config.pauseThreshold) {
                this.syncAll();
            }
            this.pausedAt = null;
        }
    },

    /**
     * Sync all header data
     */
    async syncAll() {
        await Promise.all([
            this.syncBalance(),
            this.syncNotifications()
        ]);
        this.lastSync = Date.now();
        window.LaTandaEvents && window.LaTandaEvents.emit("header:synced", { time: this.lastSync });
    },

    /**
     * Sync wallet balance
     */
    async syncBalance() {
        const userId = this.getUserId();
        if (!userId) {
            return null;
        }

        // Check cache first
        const cached = window.LaTandaCache && window.LaTandaCache.get("balance");
        if (cached) return cached;

        try {
            const api = window.LaTandaAPI || { baseURL: "https://latanda.online" };
            const url = (api.baseURL || "https://latanda.online") + "/api/wallet/balance?user_id=" + userId;

            const response = await fetch(url, { headers: this.getAuthHeaders() });
            const data = await response.json();

            if (data.success) {
                const balance = {
                    amount: parseFloat(data.data?.balance || data.data?.confirmed_balance || data.balance || 0),
                    pending: parseFloat(data.data?.pending_deposits || data.pending || 0),
                    currency: "HNL"
                };

                // Cache the result
                window.LaTandaCache && window.LaTandaCache.set("balance", balance);

                // Update UI
                window.HeaderUI && window.HeaderUI.updateBalance(balance);

                // Emit event
                window.LaTandaEvents && window.LaTandaEvents.emit("balance:updated", balance);

                return balance;
            }
        } catch (err) {
            // error handled silently
        }

        return null;
    },

    /**
     * Sync notifications count
     */
    async syncNotifications() {
        const userId = this.getUserId();
        if (!userId) return null;

        // Check cache first
        const cached = window.LaTandaCache && window.LaTandaCache.get("notifications");
        if (cached) return cached;

        try {
            const api = window.LaTandaAPI || { baseURL: "https://latanda.online" };
            const url = (api.baseURL || "https://latanda.online") + "/api/notifications?user_id=" + userId + "&status=unread";

            const response = await fetch(url, { headers: this.getAuthHeaders() });
            const data = await response.json();

            if (data.success) {
                const notifs = {
                    count: (data.data?.length || data.notifications?.length || 0),
                    items: data.data || data.notifications || []
                };

                // Cache the result
                window.LaTandaCache && window.LaTandaCache.set("notifications", notifs);

                // Update UI
                window.HeaderUI && window.HeaderUI.updateNotifCount(notifs.count);

                // Emit event
                window.LaTandaEvents && window.LaTandaEvents.emit("notifications:updated", notifs);

                return notifs;
            }
        } catch (err) {
            // error handled silently
        }

        return null;
    },

    /**
     * Force refresh a specific type
     */
    forceRefresh(type) {
        window.LaTandaCache && window.LaTandaCache.delete(type);

        if (type === "balance") return this.syncBalance();
        if (type === "notifications") return this.syncNotifications();
        if (type === "all") return this.syncAll();
    }
};

window.HeaderSync = HeaderSync;
