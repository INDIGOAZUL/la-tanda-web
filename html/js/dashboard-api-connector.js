/**
 * LA TANDA - Dashboard API Connector
 * Conecta el dashboard con las APIs reales del backend
 * Reemplaza datos simulados con datos reales
 */

class DashboardAPIConnector {
    constructor() {
        this.apiBase = window.API_BASE_URL || "https://latanda.online";
        this.cache = new Map();
        this.cacheTTL = 30000; // 30 segundos
        this.userId = this.getCurrentUserId();
        this.isConnected = false;
        this.lastSync = null;
    }
    
    // Get auth token for API calls
    getAuthToken() {
        return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || null;
    }

    // Get user ID from various sources
    getCurrentUserId() {
        // 1. Check latanda_user (primary auth source)
        const latandaUser = localStorage.getItem("latanda_user") || sessionStorage.getItem("latanda_user");
        if (latandaUser) {
            try {
                const parsed = JSON.parse(latandaUser);
                if (parsed.id) return String(parsed.id);
                if (parsed.user_id) return String(parsed.user_id);
            } catch(e) {}
        }
        // v4.2.0: URL param fallback removed (IDOR risk)
        // 3. Fallback to direct storage
        return localStorage.getItem("user_id") || localStorage.getItem("userId") || null;
    }

    // ============================================
    // CACHE MANAGEMENT
    // ============================================
    
    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // ============================================
    // API METHODS
    // ============================================

    async fetchWithCache(endpoint, options = {}) {
        const cacheKey = endpoint + JSON.stringify(options);
        const cached = this.getCached(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            // Build headers with JWT if available
            const headers = {
                "Content-Type": "application/json",
                ...options.headers
            };
            
            const token = this.getAuthToken();
            if (token) {
                headers["Authorization"] = "Bearer " + token;
            }

            const response = await fetch(this.apiBase + endpoint, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }

            const data = await response.json();
            this.setCache(cacheKey, data);
            this.isConnected = true;
            return data;

        } catch (error) {
            this.isConnected = false;
            return null;
        }
    }

    // ============================================
    // WALLET / BALANCE
    // ============================================

    async getWalletBalance() {
        if (!this.userId) return this.getDefaultBalance();

        const data = await this.fetchWithCache(
            "/api/wallet/balance?user_id=" + this.userId
        );

        if (data && data.success) {
            return {
                available: parseFloat(data.data?.balance || data.balance || 0),
                pending: parseFloat(data.data?.pending_deposits || data.pending || 0),
                total: parseFloat(data.data?.balances?.total_usd || data.data?.balance || 0)
            };
        }

        return this.getDefaultBalance();
    }

    getDefaultBalance() {
        return { available: 0, pending: 0, total: 0 };
    }

    // ============================================
    // TANDAS / GROUPS
    // ============================================

    async getMyTandas() {
        if (!this.userId) return [];

        // Try primary endpoint
        let data = await this.fetchWithCache(
            "/api/groups?user_id=" + this.userId
        );

        if (data && data.success && data.data) {
            return this.formatTandas(data.data);
        }

        // Try alternative endpoint
        data = await this.fetchWithCache(
            "/api/tandas/my-tandas?user_id=" + this.userId
        );

        if (data && data.success && data.data) {
            return this.formatTandas(data.data);
        }

        return [];
    }

    formatTandas(tandas) {
        if (!Array.isArray(tandas)) return [];
        
        return tandas.map(t => ({
            id: t.group_id || t.id,
            name: t.name || "Tanda",
            status: t.status || "active",
            amount: parseFloat(t.contribution_amount || t.base_contribution || 0),
            frequency: t.frequency || t.payment_frequency || "monthly",
            memberCount: t.member_count || t.members?.length || 0,
            currentRound: t.current_round || 1,
            totalRounds: t.total_rounds || t.max_members || 10,
            nextPaymentDate: t.next_payment_date || t.start_date,
            isCreator: t.created_by === this.userId || t.admin_id === this.userId
        }));
    }

    async getTandasCount() {
        const tandas = await this.getMyTandas();
        return {
            total: tandas.length,
            active: tandas.filter(t => t.status === "active").length,
            asCreator: tandas.filter(t => t.isCreator).length,
            asMember: tandas.filter(t => !t.isCreator).length
        };
    }

    // ============================================
    // TRANSACTIONS
    // ============================================

    async getRecentTransactions(limit = 5) {
        if (!this.userId) return [];

        const data = await this.fetchWithCache(
            "/api/user/transactions",
            {
                method: "POST",
                body: JSON.stringify({ 
                    user_id: this.userId, 
                    limit: limit 
                })
            }
        );

        if (data && data.success && data.data) {
            const txs = data.data.transactions || data.data;
            return Array.isArray(txs) ? txs.slice(0, limit) : [];
        }

        return [];
    }

    async getTransactionStats() {
        const transactions = await this.getRecentTransactions(50);
        
        const stats = {
            total: transactions.length,
            completed: 0,
            pending: 0,
            totalAmount: 0
        };

        transactions.forEach(tx => {
            if (tx.status === "confirmed" || tx.status === "completed") {
                stats.completed++;
            } else if (tx.status === "pending") {
                stats.pending++;
            }
            stats.totalAmount += parseFloat(tx.amount || 0);
        });

        return stats;
    }

    // ============================================
    // PAYMENTS
    // ============================================

    async getNextPayment() {
        const tandas = await this.getMyTandas();
        let nextPayment = null;

        tandas.forEach(tanda => {
            if (tanda.status !== "active") return;

            // Calculate next payment date based on frequency
            let nextDate = tanda.nextPaymentDate ? new Date(tanda.nextPaymentDate) : null;
            
            if (!nextDate) {
                // Estimate based on frequency
                nextDate = this.estimateNextPaymentDate(tanda.frequency);
            }

            if (nextDate && (!nextPayment || nextDate < nextPayment.date)) {
                nextPayment = {
                    date: nextDate,
                    amount: tanda.amount,
                    tandaName: tanda.name,
                    tandaId: tanda.id,
                    daysUntil: Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24))
                };
            }
        });

        return nextPayment;
    }

    estimateNextPaymentDate(frequency) {
        const now = new Date();
        const days = {
            "daily": 1,
            "weekly": 7,
            "biweekly": 14,
            "monthly": 30
        };
        const addDays = days[frequency] || 30;
        return new Date(now.getTime() + (addDays * 24 * 60 * 60 * 1000));
    }

    // ============================================
    // SYNC ALL DATA
    // ============================================

    async syncAll() {
        
        const [balance, tandas, transactions] = await Promise.all([
            this.getWalletBalance(),
            this.getMyTandas(),
            this.getRecentTransactions()
        ]);

        const nextPayment = await this.getNextPayment();
        const tandasCount = {
            total: tandas.length,
            active: tandas.filter(t => t.status === "active").length
        };

        this.lastSync = Date.now();

        return {
            balance,
            tandas,
            tandasCount,
            transactions,
            nextPayment,
            lastSync: this.lastSync,
            isConnected: this.isConnected
        };
    }

    // ============================================
    // UTILITY
    // ============================================

    formatCurrency(amount, currency = "HNL") {
        const num = parseFloat(amount) || 0;
        const symbols = { "HNL": "L.", "USD": "$", "LTD": "L" };
        const symbol = symbols[currency] || "L.";
        return symbol + " " + num.toLocaleString("es-HN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    getFrequencyLabel(freq) {
        const labels = {
            "daily": "Diario",
            "weekly": "Semanal",
            "biweekly": "Quincenal",
            "monthly": "Mensual"
        };
        return labels[freq] || "Mensual";
    }
}

// Create global instance
window.dashboardAPI = new DashboardAPIConnector();

