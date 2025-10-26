/**
 * Simple Test Version of Enhanced API Proxy
 * For debugging purposes
 */

console.log('🔍 Loading simple test API proxy...');

class SimpleEnhancedAPIProxy {
    constructor() {
        this.API_BASE = 'https://api.latanda.online/api';
        this.isProxy = true;
        this.version = "3.0.0-test";
        console.log(`🚀 Simple API Proxy v${this.version} initialized`);
    }

    async makeRequest(endpoint, options = {}) {
        console.log(`🔍 Simple API Proxy: ${options.method || 'GET'} ${endpoint}`);
        
        // Basic test responses
        const responses = {
            '/system/health': {
                success: true,
                data: {
                    system: "healthy",
                    endpoints: 120,
                    version: "3.0.0-test"
                }
            },
            '/auth/login': {
                success: true,
                data: {
                    message: "Login exitoso",
                    user: { id: "test_001", name: "Test User" },
                    auth_token: "test_token_123"
                }
            },
            '/user/profile': {
                success: true,
                data: {
                    id: "test_001",
                    name: "Test User",
                    email: "test@latanda.online"
                }
            }
        };

        // Return mock response or default
        return responses[endpoint] || {
            success: true,
            data: {
                message: `Mock response for ${endpoint}`,
                endpoint: endpoint,
                method: options.method || 'GET'
            }
        };
    }
}

// Initialize
console.log('🔍 Creating SimpleEnhancedAPIProxy instance...');
const simpleAPIProxy = new SimpleEnhancedAPIProxy();

// Make available globally
window.apiProxy = simpleAPIProxy;
window.enhancedAPIProxy = simpleAPIProxy;
window.comprehensiveAPIProxy = simpleAPIProxy;

console.log('✅ Simple API Proxy loaded successfully!');
console.log('✅ Available as window.apiProxy, window.enhancedAPIProxy, window.comprehensiveAPIProxy');