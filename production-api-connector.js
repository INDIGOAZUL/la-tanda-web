/**
 * 🚀 LA TANDA PRODUCTION API CONNECTOR
 * Connects Web3 frontend to deployed backend APIs
 * Updated to use actual deployed endpoints at api.latanda.online
 */

class ProductionAPIConnector {
    constructor() {
        // Use deployed backend URL (change to api.latanda.online when ready for production)
        this.API_BASE = 'http://localhost:3001'; // Our deployed backend
        this.authToken = localStorage.getItem('la_tanda_auth_token');
        this.user = JSON.parse(localStorage.getItem('la_tanda_user') || '{}');
        
        // Map frontend sections to backend endpoints
        this.endpointMap = {
            // Authentication endpoints
            login: 'POST /api/auth/login',
            register: 'POST /api/auth/register',
            refresh: 'POST /api/auth/refresh',
            logout: 'POST /api/auth/logout',
            verify: 'POST /api/auth/verify',
            
            // User management
            getUserProfile: 'GET /api/users/profile',
            updateProfile: 'PUT /api/users/profile',
            getUserStats: 'GET /api/users/stats',
            
            // Group management
            getGroups: 'GET /api/groups',
            createGroup: 'POST /api/groups/create',
            getGroupDetails: 'GET /api/groups/{id}',
            joinGroup: 'POST /api/groups/{id}/join',
            leaveGroup: 'POST /api/groups/{id}/leave',
            getGroupMembers: 'GET /api/groups/{id}/members',
            
            // Contributions and payments
            getUserContributions: 'GET /api/users/contributions',
            createContribution: 'POST /api/contributions/create',
            processPayment: 'POST /api/payment/transactions/create',
            getPaymentHistory: 'GET /api/users/payment-history',
            
            // Payout management
            getPayoutSchedule: 'GET /api/groups/{id}/payout-schedule',
            requestPayout: 'POST /api/payouts/request',
            
            // Notifications
            getNotifications: 'GET /api/notifications',
            markNotificationRead: 'PUT /api/notifications/{id}/read',
            getNotificationPreferences: 'GET /api/notifications/preferences',
            updateNotificationPreferences: 'PUT /api/notifications/preferences',
            
            // Mobile specific
            registerDevice: 'POST /api/mobile/devices/register',
            getMobileDashboard: 'GET /api/mobile/dashboard',
            queueOfflineAction: 'POST /api/mobile/sync/{deviceId}/queue',
            trackAnalytics: 'POST /api/mobile/analytics/track',
            
            // Financial reconciliation
            getFinancialReports: 'GET /api/reports/financial',
            
            // System status
            getSystemStatus: 'GET /api/system/status',
            getHealth: 'GET /health'
        };
        
        console.log('🚀 Production API Connector initialized');
        this.setupEventListeners();
    }
    
    // Generic API call method
    async apiCall(endpoint, data = null, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            // Add auth token if available
            if (this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }
            
            const config = {
                method: options.method || (data ? 'POST' : 'GET'),
                headers,
                ...options
            };
            
            if (data && config.method !== 'GET') {
                config.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${this.API_BASE}${endpoint}`, config);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error?.message || `HTTP ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }
    
    // Authentication methods
    async login(email, password) {
        try {
            const result = await this.apiCall('/api/auth/login', { email, password });
            
            if (result.success) {
                this.authToken = result.data.auth_token;
                this.user = result.data.user;
                
                localStorage.setItem('la_tanda_auth_token', this.authToken);
                localStorage.setItem('la_tanda_user', JSON.stringify(this.user));
                
                this.dispatchEvent('auth:login', { user: this.user });
                return result;
            }
            
            throw new Error(result.error?.message || 'Login failed');
        } catch (error) {
            this.dispatchEvent('auth:error', { error: error.message });
            throw error;
        }
    }
    
    async register(userData) {
        try {
            const result = await this.apiCall('/api/auth/register', userData);
            
            if (result.success) {
                this.dispatchEvent('auth:register', { user: result.data.user });
                return result;
            }
            
            throw new Error(result.error?.message || 'Registration failed');
        } catch (error) {
            this.dispatchEvent('auth:error', { error: error.message });
            throw error;
        }
    }
    
    async logout() {
        try {
            if (this.authToken) {
                await this.apiCall('/api/auth/logout', null, { method: 'POST' });
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            this.authToken = null;
            this.user = {};
            localStorage.removeItem('la_tanda_auth_token');
            localStorage.removeItem('la_tanda_user');
            this.dispatchEvent('auth:logout');
        }
    }
    
    // Group management methods
    async getGroups() {
        return await this.apiCall('/api/groups');
    }
    
    async createGroup(groupData) {
        const result = await this.apiCall('/api/groups/create', groupData);
        if (result.success) {
            this.dispatchEvent('group:created', { group: result.data.group });
        }
        return result;
    }
    
    async getGroupDetails(groupId) {
        return await this.apiCall(`/api/groups/${groupId}`);
    }
    
    async joinGroup(groupId, memberData = {}) {
        const result = await this.apiCall(`/api/groups/${groupId}/join`, memberData);
        if (result.success) {
            this.dispatchEvent('group:joined', { groupId, member: result.data.member });
        }
        return result;
    }
    
    // Contribution management
    async getUserContributions() {
        return await this.apiCall('/api/users/contributions');
    }
    
    async processPayment(contributionId, paymentData) {
        const result = await this.apiCall('/api/payment/transactions/create', {
            contribution_id: contributionId,
            ...paymentData
        });
        
        if (result.success) {
            this.dispatchEvent('payment:processed', { 
                contributionId, 
                transaction: result.data.transaction 
            });
        }
        
        return result;
    }
    
    // Notification management
    async getNotifications(filters = {}) {
        const params = new URLSearchParams(filters);
        const endpoint = params.toString() ? `/api/notifications?${params}` : '/api/notifications';
        return await this.apiCall(endpoint);
    }
    
    async markNotificationRead(notificationId) {
        return await this.apiCall(`/api/notifications/${notificationId}/read`, null, { method: 'PUT' });
    }
    
    // Mobile dashboard
    async getMobileDashboard() {
        return await this.apiCall('/api/mobile/dashboard');
    }
    
    // System status
    async getSystemStatus() {
        return await this.apiCall('/api/system/status');
    }
    
    async getHealth() {
        return await this.apiCall('/health');
    }
    
    // Event system for UI updates
    setupEventListeners() {
        this.eventListeners = {};
    }
    
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    dispatchEvent(event, data = {}) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error for ${event}:`, error);
                }
            });
        }
        
        // Also dispatch as custom DOM event
        window.dispatchEvent(new CustomEvent(`latanda:${event}`, { detail: data }));
    }
    
    // Utility methods
    isAuthenticated() {
        return !!this.authToken && !!this.user.id;
    }
    
    getCurrentUser() {
        return this.user;
    }
    
    // Auto-refresh token
    async refreshTokenIfNeeded() {
        if (!this.authToken) return false;
        
        try {
            const result = await this.apiCall('/api/auth/verify');
            if (result.success) {
                this.user = result.data.user;
                localStorage.setItem('la_tanda_user', JSON.stringify(this.user));
                return true;
            }
        } catch (error) {
            console.warn('Token refresh failed:', error);
            await this.logout();
        }
        
        return false;
    }
}

// Initialize global API connector
window.LaTandaAPI = new ProductionAPIConnector();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionAPIConnector;
}

console.log('🚀 Production API Connector loaded and ready!');