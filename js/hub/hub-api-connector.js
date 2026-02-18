/**
 * LA TANDA - Hub API Connector
 * Fetching paralelo con cache para el Hub Inteligente
 * Version: 1.0.0
 */

const HubAPIConnector = {
    apiBase: window.API_BASE_URL || "https://latanda.online",
    cache: new Map(),
    cacheTTL: {
        summary: 30000,    // 30 segundos
        activity: 60000,   // 60 segundos
        insights: 120000   // 2 minutos
    },

    getAuthToken() {
        return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || null;
    },

    getUserId() {
        const storedUser = localStorage.getItem("latanda_user") || sessionStorage.getItem("latanda_user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed.id) return String(parsed.id);
                if (parsed.user_id) return String(parsed.user_id);
            } catch(e) {}
        }
        return localStorage.getItem("user_id") || null;
    },

    getCached(key) {
        const cached = this.cache.get(key);
        const ttl = this.cacheTTL[key.split("_")[0]] || 30000;
        if (cached && (Date.now() - cached.timestamp < ttl)) {
            return cached.data;
        }
        return null;
    },

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    },

    clearCache() {
        this.cache.clear();
    },

    async fetchWithAuth(endpoint) {
        const headers = { "Content-Type": "application/json" };
        const token = this.getAuthToken();
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }

        const response = await fetch(this.apiBase + endpoint, { headers });
        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }
        return response.json();
    },

    // Prioridad 1: Datos criticos (paralelo)
    async fetchCriticalData() {
        const userId = this.getUserId();
        if (!userId) {

            return null;
        }

        const cacheKey = "summary_" + userId;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const [summaryResult, notificationsResult] = await Promise.all([
                this.fetchWithAuth("/api/hub/summary?user_id=" + encodeURIComponent(userId)),
                this.fetchWithAuth("/api/notifications/unread-count?user_id=" + encodeURIComponent(userId)).catch(() => ({ data: { count: 0 } }))
            ]);

            const data = {
                ...summaryResult.data,
                unread_notifications: notificationsResult.data?.count || 0
            };

            this.setCache(cacheKey, data);
            return data;
        } catch (error) {

            return null;
        }
    },

    // Prioridad 2: Datos secundarios (lazy load)
    async fetchSecondaryData() {
        const userId = this.getUserId();
        if (!userId) return null;

        const activityKey = "activity_" + userId;
        const insightsKey = "insights_" + userId;

        const cachedActivity = this.getCached(activityKey);
        const cachedInsights = this.getCached(insightsKey);

        if (cachedActivity && cachedInsights) {
            return { activity: cachedActivity, insights: cachedInsights };
        }

        try {
            const [activityResult, insightsResult] = await Promise.all([
                cachedActivity ? Promise.resolve({ data: cachedActivity }) : this.fetchWithAuth("/api/hub/activity?user_id=" + encodeURIComponent(userId) + "&limit=10"),
                cachedInsights ? Promise.resolve({ data: cachedInsights }) : this.fetchWithAuth("/api/hub/insights?user_id=" + encodeURIComponent(userId))
            ]);

            const activity = activityResult.data;
            const insights = insightsResult.data;

            if (!cachedActivity) this.setCache(activityKey, activity);
            if (!cachedInsights) this.setCache(insightsKey, insights);

            return { activity, insights };
        } catch (error) {

            return null;
        }
    },

    // Fetch all hub data with smart loading
    async fetchAllHubData() {

        // Priority 1: Critical data immediately
        const criticalData = await this.fetchCriticalData();

        // Priority 2: Secondary data after 500ms delay
        setTimeout(async () => {
            const secondaryData = await this.fetchSecondaryData();
            if (secondaryData) {
                document.dispatchEvent(new CustomEvent("hubSecondaryDataLoaded", {
                    detail: secondaryData
                }));
            }
        }, 500);

        return criticalData;
    },

    // Refresh specific section
    async refreshSection(section) {
        const userId = this.getUserId();
        if (!userId) return null;

        // Clear cache for this section
        this.cache.delete(section + "_" + userId);

        switch(section) {
            case "summary":
                return this.fetchCriticalData();
            case "activity":
            case "insights":
                return this.fetchSecondaryData();
            default:
                return null;
        }
    }
};

// Auto-initialize
window.HubAPI = HubAPIConnector;
