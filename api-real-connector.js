/**
 * 🔗 Real API Connector for Enhanced Server
 * Connects frontend to enhanced API server instead of simulation
 */

class RealAPIConnector {
    constructor() {
        this.API_BASE = 'http://localhost:3001/api';
        this.isReal = true;
        this.isSimulation = false;
        
        console.log('🔗 Real API Connector initialized');
        console.log('📡 Connecting to enhanced API server at:', this.API_BASE);
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        const method = options.method || 'GET';
        
        console.log(`🔍 Real API Request: ${method} ${url}`);
        
        try {
            const fetchOptions = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                credentials: 'include'
            };

            // Add body for POST/PUT requests
            if (options.body && (method === 'POST' || method === 'PUT')) {
                fetchOptions.body = options.body;
            }

            // Add authorization header if token exists
            const token = localStorage.getItem('latanda_auth_token');
            if (token) {
                fetchOptions.headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, fetchOptions);
            const data = await response.json();
            
            console.log(`✅ Real API Response (${response.status}):`, data);
            
            // Handle non-200 responses
            if (!response.ok) {
                throw new Error(data.error?.message || `HTTP ${response.status}`);
            }
            
            return data;
            
        } catch (error) {
            console.error(`❌ Real API Error for ${endpoint}:`, error);
            
            // Return error in expected format
            return {
                success: false,
                error: {
                    message: error.message || 'Network error',
                    code: 500,
                    endpoint: endpoint
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    version: "2.0.0",
                    server: "enhanced-api",
                    environment: "real-connection"
                }
            };
        }
    }

    // Health check method
    async checkConnection() {
        try {
            const response = await this.makeRequest('/system/status');
            if (response.success) {
                console.log('🎉 Enhanced API connection successful!');
                console.log('📊 Server status:', response.data.system);
                console.log('⏱️  Uptime:', Math.floor(response.data.uptime), 'seconds');
                return true;
            }
        } catch (error) {
            console.error('❌ Enhanced API connection failed:', error);
            return false;
        }
        return false;
    }

    // Test authentication
    async testAuthentication() {
        console.log('🧪 Testing authentication with enhanced API...');
        
        const tests = [
            {
                name: 'Admin Login',
                endpoint: '/auth/login',
                method: 'POST',
                body: JSON.stringify({
                    email: 'admin@latanda.online',
                    password: 'Admin123!'
                })
            },
            {
                name: 'Demo Login',
                endpoint: '/auth/login',
                method: 'POST',
                body: JSON.stringify({
                    email: 'demo@latanda.online',
                    password: 'demo123'
                })
            }
        ];

        for (const test of tests) {
            console.log(`🔐 Testing ${test.name}...`);
            const result = await this.makeRequest(test.endpoint, {
                method: test.method,
                body: test.body
            });

            if (result.success) {
                console.log(`✅ ${test.name} successful:`, result.data.user.role);
            } else {
                console.log(`❌ ${test.name} failed:`, result.error?.message);
            }
        }
    }
}

// Global instance for real API
window.realApiConnector = new RealAPIConnector();

// Optional: Replace the simulation API proxy with real connector
// Uncomment the next line to use real API instead of simulation
// window.apiProxy = window.realApiConnector;