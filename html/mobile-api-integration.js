/**
 * 📱 LA TANDA MOBILE API INTEGRATION
 * Complete mobile app integration layer for connecting to La Tanda backend APIs
 * Supports React Native, Flutter, and Cordova/PhoneGap applications
 */

class LaTandaMobileAPI {
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'http://localhost:3001';
        this.apiVersion = config.apiVersion || 'v1';
        this.timeout = config.timeout || 30000;
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;
        
        // Mobile-specific configurations
        this.deviceInfo = null;
        this.authToken = null;
        this.refreshToken = null;
        this.isOffline = false;
        this.offlineQueue = [];
        
        // Event handlers
        this.eventHandlers = {};
        
        this.initialize();
    }
    
    async initialize() {
        console.log('📱 Initializing La Tanda Mobile API...');
        
        // Detect mobile environment
        this.detectMobileEnvironment();
        
        // Initialize device information
        await this.initializeDeviceInfo();
        
        // Setup offline handling
        this.setupOfflineHandling();
        
        // Load stored credentials
        await this.loadStoredCredentials();
        
        // Setup automatic token refresh
        this.setupTokenRefresh();
        
        console.log('✅ Mobile API initialized successfully');
        this.emit('api:ready', { deviceInfo: this.deviceInfo });
    }
    
    detectMobileEnvironment() {
        // Detect React Native
        if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
            this.platform = 'react-native';
            this.storage = require('@react-native-async-storage/async-storage');
        }
        // Detect Cordova/PhoneGap
        else if (typeof window !== 'undefined' && window.cordova) {
            this.platform = 'cordova';
            this.storage = window.localStorage;
        }
        // Detect Capacitor
        else if (typeof window !== 'undefined' && window.Capacitor) {
            this.platform = 'capacitor';
            this.storage = window.Capacitor.Plugins.Storage;
        }
        // Web fallback
        else {
            this.platform = 'web';
            this.storage = typeof localStorage !== 'undefined' ? localStorage : null;
        }
        
        console.log(`📱 Platform detected: ${this.platform}`);
    }
    
    async initializeDeviceInfo() {
        try {
            if (this.platform === 'react-native') {
                // React Native device info
                const DeviceInfo = require('react-native-device-info');
                this.deviceInfo = {
                    device_id: await DeviceInfo.getUniqueId(),
                    device_name: await DeviceInfo.getDeviceName(),
                    device_type: 'mobile',
                    platform: await DeviceInfo.getSystemName(),
                    platform_version: await DeviceInfo.getSystemVersion(),
                    app_version: DeviceInfo.getVersion(),
                    app_build: DeviceInfo.getBuildNumber(),
                    manufacturer: await DeviceInfo.getManufacturer(),
                    model: await DeviceInfo.getModel(),
                    is_emulator: await DeviceInfo.isEmulator(),
                    battery_level: await DeviceInfo.getBatteryLevel(),
                    is_wifi: await DeviceInfo.getConnectionType() === 'wifi'
                };
            } else if (this.platform === 'cordova') {
                // Cordova device info
                this.deviceInfo = {
                    device_id: device.uuid,
                    device_name: device.model,
                    device_type: 'mobile',
                    platform: device.platform,
                    platform_version: device.version,
                    app_version: '1.0.0',
                    manufacturer: device.manufacturer,
                    model: device.model,
                    is_emulator: device.isVirtual || false
                };
            } else if (this.platform === 'capacitor') {
                // Capacitor device info
                const { Device } = window.Capacitor.Plugins;
                const deviceInfo = await Device.getInfo();
                this.deviceInfo = {
                    device_id: deviceInfo.identifier,
                    device_name: deviceInfo.name,
                    device_type: 'mobile',
                    platform: deviceInfo.platform,
                    platform_version: deviceInfo.osVersion,
                    app_version: deviceInfo.appVersion,
                    manufacturer: deviceInfo.manufacturer,
                    model: deviceInfo.model,
                    is_emulator: deviceInfo.isVirtual
                };
            } else {
                // Web fallback
                this.deviceInfo = {
                    device_id: this.generateDeviceId(),
                    device_name: navigator.userAgent,
                    device_type: 'web',
                    platform: 'web',
                    platform_version: navigator.appVersion,
                    app_version: '1.0.0'
                };
            }
            
            console.log('📱 Device info initialized:', this.deviceInfo);
            
        } catch (error) {
            console.error('Failed to initialize device info:', error);
            // Fallback device info
            this.deviceInfo = {
                device_id: this.generateDeviceId(),
                device_name: 'Unknown Device',
                device_type: 'mobile',
                platform: this.platform,
                app_version: '1.0.0'
            };
        }
    }
    
    generateDeviceId() {
        return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    setupOfflineHandling() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOffline = false;
                this.emit('connectivity:online');
                this.processOfflineQueue();
            });
            
            window.addEventListener('offline', () => {
                this.isOffline = true;
                this.emit('connectivity:offline');
            });
            
            this.isOffline = !navigator.onLine;
        }
    }
    
    async loadStoredCredentials() {
        try {
            const token = await this.getStoredValue('la_tanda_auth_token');
            const refreshToken = await this.getStoredValue('la_tanda_refresh_token');
            
            if (token) {
                this.authToken = token;
                console.log('📱 Stored auth token loaded');
            }
            
            if (refreshToken) {
                this.refreshToken = refreshToken;
                console.log('📱 Stored refresh token loaded');
            }
            
        } catch (error) {
            console.error('Failed to load stored credentials:', error);
        }
    }
    
    setupTokenRefresh() {
        // Check token expiration every 5 minutes
        setInterval(async () => {
            if (this.authToken && this.isTokenExpiringSoon()) {
                try {
                    await this.refreshAuthToken();
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    this.emit('auth:token_refresh_failed', error);
                }
            }
        }, 5 * 60 * 1000);
    }
    
    // Storage methods
    async getStoredValue(key) {
        try {
            if (this.platform === 'react-native') {
                return await this.storage.getItem(key);
            } else if (this.platform === 'capacitor') {
                const result = await this.storage.get({ key });
                return result.value;
            } else {
                return this.storage.getItem(key);
            }
        } catch (error) {
            console.error(`Failed to get stored value ${key}:`, error);
            return null;
        }
    }
    
    async setStoredValue(key, value) {
        try {
            if (this.platform === 'react-native') {
                await this.storage.setItem(key, value);
            } else if (this.platform === 'capacitor') {
                await this.storage.set({ key, value });
            } else {
                this.storage.setItem(key, value);
            }
        } catch (error) {
            console.error(`Failed to set stored value ${key}:`, error);
        }
    }
    
    async removeStoredValue(key) {
        try {
            if (this.platform === 'react-native') {
                await this.storage.removeItem(key);
            } else if (this.platform === 'capacitor') {
                await this.storage.remove({ key });
            } else {
                this.storage.removeItem(key);
            }
        } catch (error) {
            console.error(`Failed to remove stored value ${key}:`, error);
        }
    }
    
    // HTTP request methods
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `LaTandaMobile/${this.deviceInfo?.app_version || '1.0.0'} (${this.deviceInfo?.platform || 'unknown'})`,
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };
        
        // Add auth token if available
        if (this.authToken) {
            config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        // Add device information headers
        if (this.deviceInfo) {
            config.headers['X-Device-ID'] = this.deviceInfo.device_id;
            config.headers['X-Device-Platform'] = this.deviceInfo.platform;
            config.headers['X-App-Version'] = this.deviceInfo.app_version;
        }
        
        // Handle offline requests
        if (this.isOffline && options.method !== 'GET') {
            return this.queueOfflineRequest(endpoint, config);
        }
        
        let lastError;
        
        // Retry logic
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await this.executeRequest(url, config);
                
                // Handle token refresh on 401
                if (response.status === 401 && this.refreshToken && attempt === 1) {
                    await this.refreshAuthToken();
                    config.headers['Authorization'] = `Bearer ${this.authToken}`;
                    continue; // Retry with new token
                }
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || `HTTP ${response.status}`);
                }
                
                return data;
                
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt} failed:`, error);
                
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        
        throw lastError;
    }
    
    async executeRequest(url, config) {
        if (typeof fetch !== 'undefined') {
            return fetch(url, config);
        } else if (this.platform === 'react-native') {
            // React Native fetch
            return fetch(url, config);
        } else {
            // Fallback to XMLHttpRequest
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.timeout = config.timeout;
                xhr.open(config.method, url);
                
                Object.keys(config.headers).forEach(key => {
                    xhr.setRequestHeader(key, config.headers[key]);
                });
                
                xhr.onload = () => {
                    resolve({
                        ok: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        json: () => Promise.resolve(JSON.parse(xhr.responseText))
                    });
                };
                
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.ontimeout = () => reject(new Error('Request timeout'));
                
                xhr.send(config.body);
            });
        }
    }
    
    async queueOfflineRequest(endpoint, config) {
        const requestId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.offlineQueue.push({
            id: requestId,
            endpoint,
            config,
            timestamp: Date.now()
        });
        
        console.log(`📱 Request queued for offline processing: ${endpoint}`);
        this.emit('offline:request_queued', { requestId, endpoint });
        
        return Promise.resolve({
            success: true,
            message: 'Request queued for offline processing',
            request_id: requestId
        });
    }
    
    async processOfflineQueue() {
        console.log(`📱 Processing ${this.offlineQueue.length} offline requests...`);
        
        while (this.offlineQueue.length > 0) {
            const request = this.offlineQueue.shift();
            
            try {
                const result = await this.makeRequest(request.endpoint, request.config);
                this.emit('offline:request_processed', { 
                    requestId: request.id, 
                    success: true, 
                    result 
                });
                
            } catch (error) {
                console.error(`Failed to process offline request ${request.id}:`, error);
                this.emit('offline:request_failed', { 
                    requestId: request.id, 
                    error: error.message 
                });
            }
        }
        
        console.log('📱 Offline queue processing completed');
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Authentication methods
    async login(email, password) {
        try {
            const response = await this.makeRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            if (response.success) {
                this.authToken = response.data.auth_token;
                this.refreshToken = response.data.refresh_token;
                
                // Store tokens
                await this.setStoredValue('la_tanda_auth_token', this.authToken);
                await this.setStoredValue('la_tanda_refresh_token', this.refreshToken);
                await this.setStoredValue('la_tanda_user', JSON.stringify(response.data.user));
                
                // Register device
                await this.registerDevice();
                
                this.emit('auth:login_success', response.data);
                return response;
            }
            
            throw new Error(response.message || 'Login failed');
            
        } catch (error) {
            this.emit('auth:login_failed', error);
            throw error;
        }
    }
    
    async logout() {
        try {
            if (this.authToken) {
                await this.makeRequest('/api/auth/logout', {
                    method: 'POST'
                });
            }
            
            // Clear stored data
            await this.removeStoredValue('la_tanda_auth_token');
            await this.removeStoredValue('la_tanda_refresh_token');
            await this.removeStoredValue('la_tanda_user');
            
            this.authToken = null;
            this.refreshToken = null;
            
            this.emit('auth:logout_success');
            
        } catch (error) {
            this.emit('auth:logout_failed', error);
            throw error;
        }
    }
    
    async refreshAuthToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
        
        try {
            const response = await this.makeRequest('/api/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });
            
            if (response.success) {
                this.authToken = response.data.auth_token;
                await this.setStoredValue('la_tanda_auth_token', this.authToken);
                
                this.emit('auth:token_refreshed');
                return response;
            }
            
            throw new Error(response.message || 'Token refresh failed');
            
        } catch (error) {
            // Clear invalid tokens
            this.authToken = null;
            this.refreshToken = null;
            await this.removeStoredValue('la_tanda_auth_token');
            await this.removeStoredValue('la_tanda_refresh_token');
            
            this.emit('auth:token_refresh_failed', error);
            throw error;
        }
    }
    
    isTokenExpiringSoon() {
        if (!this.authToken) return false;
        
        try {
            const payload = JSON.parse(atob(this.authToken.split('.')[1]));
            const expirationTime = payload.exp * 1000;
            const currentTime = Date.now();
            const timeUntilExpiration = expirationTime - currentTime;
            
            // Refresh if token expires in less than 5 minutes
            return timeUntilExpiration < (5 * 60 * 1000);
            
        } catch (error) {
            return true; // Refresh if we can't parse the token
        }
    }
    
    isAuthenticated() {
        return !!this.authToken;
    }
    
    // Device management
    async registerDevice() {
        try {
            const response = await this.makeRequest('/api/mobile/devices/register', {
                method: 'POST',
                body: JSON.stringify({
                    device_token: await this.getDeviceToken(),
                    device_type: this.deviceInfo.device_type,
                    device_id: this.deviceInfo.device_id,
                    device_name: this.deviceInfo.device_name,
                    platform: this.deviceInfo.platform,
                    platform_version: this.deviceInfo.platform_version,
                    app_version: this.deviceInfo.app_version,
                    manufacturer: this.deviceInfo.manufacturer,
                    model: this.deviceInfo.model,
                    is_emulator: this.deviceInfo.is_emulator
                })
            });
            
            if (response.success) {
                await this.setStoredValue('device_registration_id', response.data.device_registration_id);
                this.emit('device:registered', response.data);
            }
            
            return response;
            
        } catch (error) {
            console.error('Device registration failed:', error);
            this.emit('device:registration_failed', error);
            throw error;
        }
    }
    
    async getDeviceToken() {
        // Implementation varies by platform
        if (this.platform === 'react-native') {
            // Firebase messaging token for React Native
            try {
                const messaging = require('@react-native-firebase/messaging');
                return await messaging().getToken();
            } catch (error) {
                return `rn_token_${this.deviceInfo.device_id}`;
            }
        } else if (this.platform === 'cordova') {
            // Cordova push plugin token
            return `cordova_token_${this.deviceInfo.device_id}`;
        } else {
            // Web push registration or fallback
            return `web_token_${this.deviceInfo.device_id}`;
        }
    }
    
    // Dashboard and data methods
    async getDashboard() {
        return this.makeRequest('/api/mobile/dashboard');
    }
    
    async getGroups(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.makeRequest(`/api/groups${params ? '?' + params : ''}`);
    }
    
    async createGroup(groupData) {
        return this.makeRequest('/api/groups/create', {
            method: 'POST',
            body: JSON.stringify(groupData)
        });
    }
    
    async joinGroup(groupId) {
        return this.makeRequest(`/api/groups/${groupId}/join`, {
            method: 'POST'
        });
    }
    
    async leaveGroup(groupId) {
        return this.makeRequest(`/api/groups/${groupId}/leave`, {
            method: 'POST'
        });
    }
    
    async getNotifications() {
        return this.makeRequest('/api/notifications');
    }
    
    async markNotificationRead(notificationId) {
        return this.makeRequest(`/api/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }
    
    // Payment methods
    async getPaymentGateways() {
        return this.makeRequest('/api/payment/gateways');
    }
    
    async createTransaction(transactionData) {
        return this.makeRequest('/api/payment/transactions/create', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    }
    
    async getTransactionHistory(limit = 50, offset = 0) {
        return this.makeRequest(`/api/payment/transactions/history?limit=${limit}&offset=${offset}`);
    }
    
    // Analytics and tracking
    async trackEvent(eventData) {
        return this.makeRequest('/api/mobile/analytics/track', {
            method: 'POST',
            body: JSON.stringify({
                device_id: this.deviceInfo.device_id,
                session_id: this.getSessionId(),
                timestamp: Date.now(),
                ...eventData
            })
        });
    }
    
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return this.sessionId;
    }
    
    // Sync methods
    async queueSyncAction(actionData) {
        return this.makeRequest(`/api/mobile/sync/${this.deviceInfo.device_id}/queue`, {
            method: 'POST',
            body: JSON.stringify(actionData)
        });
    }
    
    async processSyncQueue() {
        return this.makeRequest(`/api/mobile/sync/${this.deviceInfo.device_id}/process`, {
            method: 'POST'
        });
    }
    
    // Event system
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }
    
    off(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
        }
    }
    
    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Event handler error for ${event}:`, error);
                }
            });
        }
    }
    
    // Utility methods
    getSystemInfo() {
        return {
            platform: this.platform,
            deviceInfo: this.deviceInfo,
            isAuthenticated: this.isAuthenticated(),
            isOffline: this.isOffline,
            offlineQueueLength: this.offlineQueue.length,
            apiVersion: this.apiVersion,
            baseURL: this.baseURL
        };
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTandaMobileAPI;
} else if (typeof window !== 'undefined') {
    window.LaTandaMobileAPI = LaTandaMobileAPI;
}

console.log('📱 La Tanda Mobile API Integration loaded!');