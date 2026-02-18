// Real-time API Integration for La Tanda Dashboards
// This script provides functions to connect dashboards with live API data

const API_BASE_URL = 'https://latanda.online';

// API Configuration
const ApiConfig = {
    baseURL: API_BASE_URL,
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
};

// Utility function for API calls with retry logic
async function apiCall(endpoint, options = {}) {
    const { method = 'GET', data = null, headers = {}, retryAttempts = ApiConfig.retryAttempts } = options;
    
    // 🔐 PHASE 1 FIX (Oct 23, 2025): Add auth token to requests
    const authToken = localStorage.getItem('auth_token');

    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            ...headers
        },
        ...options.fetchOptions
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
    }
    
    const url = `${ApiConfig.baseURL}${endpoint}`;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
            const response = await fetch(url, config);
            const result = await response.json();
            
            if (response.ok) {
                return result;
            } else {
                throw new Error(result.data?.error?.message || 'API Error');
            }
        } catch (error) {
            console.log(`API call attempt ${attempt} failed:`, error.message);
            
            if (attempt === retryAttempts) {
                throw error;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, ApiConfig.retryDelay * attempt));
        }
    }
}

// Real-time data fetchers
class RealTimeData {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
        this.updateInterval = null;
    }
    
    // Get user session - DO NOT CREATE DEMO USERS
    async getUserSession() {
        const userData = JSON.parse(localStorage.getItem('latanda_user') || sessionStorage.getItem('latanda_user') || '{}');
        
        if (!userData.id) {
            // No user found - return null, don't create fake users
            console.log('[RealTimeData] No authenticated user found');
            return null;
        }
        
        return userData;
    }
    
    // Get wallet balance with caching
    async getWalletBalance(userId) {
        const cacheKey = `wallet_balance_${userId}`;
        const cached = this.getCached(cacheKey);
        
        if (cached) return cached;
        
        try {
            const response = await apiCall(`/api/wallet/balance?user_id=${userId}`);
            if (response.success) {
                this.setCached(cacheKey, response.data);
                return response.data;
            }
        } catch (error) {
            console.log('Wallet balance error:', error.message);
            // Return mock data as fallback
            return {
                success: true,
                data: {
                    balance: 0,
                    ltd_balance: 0,
                    balances: {
                        available_usd: 0,
                        locked_usd: 0,
                        pending_deposits_usd: 0,
                        total_usd: 0,
                        ltd_tokens: 0,
                        usd_to_ltd_rate: 1
                    }
                }
            };
        }
    }
    
    // Get user transactions
    async getUserTransactions(userId, limit = 10) {
        const cacheKey = `user_transactions_${userId}_${limit}`;
        const cached = this.getCached(cacheKey);
        
        if (cached) return cached;
        
        try {
            const response = await apiCall('/api/user/transactions', {
                method: 'POST',
                data: { user_id: userId, limit }
            });
            
            if (response.success) {
                this.setCached(cacheKey, response.data);
                return response.data;
            }
        } catch (error) {
            console.log('Transactions error:', error.message);
            return {
                user_id: userId,
                transactions: [],
                pagination: { total: 0, limit, offset: 0, has_more: false }
            };
        }
    }
    
    // Get API health status
    async getApiHealth() {
        const cacheKey = 'api_health';
        const cached = this.getCached(cacheKey, 10000); // 10 second cache
        
        if (cached) return cached;
        
        try {
            const response = await apiCall('/api/system/status');
            if (response.success) {
                this.setCached(cacheKey, response.data);
                return response.data;
            }
        } catch (error) {
            console.log('API health check failed:', error.message);
            return {
                status: 'offline',
                server: 'unknown',
                endpoints_available: 0,
                uptime_seconds: 0
            };
        }
    }
    
    // Get real exchange rates (or use mock if API unavailable)
    async getExchangeRates() {
        const cacheKey = 'exchange_rates';
        const cached = this.getCached(cacheKey, 300000); // 5 minute cache
        
        if (cached) return cached;
        
        try {
            // Try to get real rates from API (if endpoint exists)
            // For now, use enhanced mock data
            const rates = {
                'USD': { rate: 1.0, symbol: '$', name: 'USD' },
                'HNL': { rate: 24.85, symbol: 'L', name: 'Lempira' },
                'EUR': { rate: 0.92, symbol: '€', name: 'Euro' },
                'BTC': { rate: 0.000023, symbol: '₿', name: 'Bitcoin' },
                'ETH': { rate: 0.00041, symbol: 'Ξ', name: 'Ethereum' }
            };
            
            this.setCached(cacheKey, rates);
            return rates;
        } catch (error) {
            console.log('Exchange rates error:', error.message);
            return {
                'USD': { rate: 1.0, symbol: '$', name: 'USD' },
                'HNL': { rate: 24.85, symbol: 'L', name: 'Lempira' }
            };
        }
    }
    
    // Cache management
    getCached(key, customTimeout = null) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const timeout = customTimeout || this.cacheTimeout;
        if (Date.now() - cached.timestamp > timeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    setCached(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    // Start real-time updates
    startRealTimeUpdates(updateFunction, interval = 30000) {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(updateFunction, interval);
        
        // Initial update
        updateFunction();
    }
    
    // Stop real-time updates
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Initialize real-time data instance
const realTimeData = new RealTimeData();

// Dashboard integration functions
async function updateDashboardWithRealData() {
    try {
        // Get user session
        const user = await realTimeData.getUserSession();
        
        // Update user info
        if (user && user.id) {
            // Update profile display
            const profileElements = document.querySelectorAll('[data-user-name]');
            profileElements.forEach(el => el.textContent = user.name || 'Usuario La Tanda');
            
            const emailElements = document.querySelectorAll('[data-user-email]');
            emailElements.forEach(el => el.textContent = user.email || 'usuario@latanda.com');
            
            // Get and update wallet balance
            const walletData = await realTimeData.getWalletBalance(user.id);
            if (walletData && walletData.data) {
                updateWalletDisplay(walletData.data);
            }
            
            // Get and update transactions
            const transactionData = await realTimeData.getUserTransactions(user.id, 5);
            if (transactionData) {
                updateRecentTransactions(transactionData);
            }
        }
        
        // Update API health status
        const healthData = await realTimeData.getApiHealth();
        updateApiHealthDisplay(healthData);
        
        // Update exchange rates
        const rates = await realTimeData.getExchangeRates();
        updateExchangeRatesDisplay(rates);
        
    } catch (error) {
        console.log('Dashboard update error:', error.message);
    }
}

// Helper functions to update UI elements
function updateWalletDisplay(balanceData) {
    const balanceElements = document.querySelectorAll('[data-balance-usd]');
    balanceElements.forEach(el => {
        el.textContent = `$${(balanceData.balances?.total_usd || 0).toFixed(2)}`;
    });
    
    const ltdElements = document.querySelectorAll('[data-balance-ltd]');
    ltdElements.forEach(el => {
        el.textContent = `${(balanceData.balances?.ltd_tokens || 0).toFixed(2)} LTD`;
    });
}

function updateRecentTransactions(transactionData) {
    const container = document.querySelector('[data-recent-transactions]');
    if (!container) return;
    
    if (transactionData.transactions.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No hay transacciones recientes</div>';
        return;
    }
    
    const transactionsHtml = transactionData.transactions.slice(0, 3).map(tx => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-primary);">
            <div>
                <div style="color: var(--text-primary); font-weight: 500;">${tx.type || 'Transacción'}</div>
                <div style="color: var(--text-secondary); font-size: 12px;">${new Date(tx.created_at || Date.now()).toLocaleDateString()}</div>
            </div>
            <div style="text-align: right;">
                <div style="color: var(--tanda-cyan); font-weight: 600;">$${(tx.amount || 0).toFixed(2)}</div>
                <div style="color: var(--text-secondary); font-size: 12px;">${tx.status || 'Completado'}</div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = transactionsHtml;
}

function updateApiHealthDisplay(healthData) {
    const statusElement = document.querySelector('[data-api-status]');
    if (statusElement) {
        const isOnline = healthData.status === 'online';
        statusElement.innerHTML = `
            <span style="color: ${isOnline ? 'var(--tanda-green)' : 'var(--tanda-red)'};">
                ● ${isOnline ? 'En línea' : 'Desconectado'}
            </span>
        `;
    }
    
    const endpointsElement = document.querySelector('[data-api-endpoints]');
    if (endpointsElement) {
        endpointsElement.textContent = `${healthData.endpoints_available || 0} endpoints`;
    }
}

function updateExchangeRatesDisplay(rates) {
    // Update currency selector options and exchange rate displays
    const currencySelectors = document.querySelectorAll('[data-currency-rates]');
    currencySelectors.forEach(selector => {
        if (selector.tagName === 'SELECT') {
            selector.innerHTML = Object.entries(rates).map(([code, info]) => 
                `<option value="${code}">${info.symbol} ${info.name}</option>`
            ).join('');
        }
    });
}

// Export for global use
window.RealTimeData = realTimeData;
window.updateDashboardWithRealData = updateDashboardWithRealData;

// Auto-start real-time updates when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Start real-time updates every 30 seconds
    realTimeData.startRealTimeUpdates(updateDashboardWithRealData, 30000);
    
    console.log('🚀 Real-time API integration initialized');
});