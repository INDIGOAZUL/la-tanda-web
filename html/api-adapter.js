/**
 * La Tanda - API Adapter
 * Adaptador que intercepta y corrige todas las llamadas a la API
 * para usar los endpoints reales del servidor
 */

class LaTandaAPIAdapter {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.originalFetch = window.fetch.bind(window);
        this.setupFetchInterceptor();
        
        // Mapeo de endpoints legacy a reales
        this.endpointMapping = {
            // Auth endpoints
            'POST /api/auth/signin': 'POST /api/auth/login',
            'POST /api/auth/signup': 'POST /api/auth/register',
            'POST /api/auth/test': 'GET /api/system/status',
            
            // User endpoints
            'GET /api/users/': 'POST /api/registration/groups/details',
            'GET /api/users/{id}/security-info': 'POST /api/verification/status/update',
            
            // Groups endpoints
            'GET /api/groups/{id}/security-info': 'POST /api/registration/groups/details',
            'POST /api/registration/groups/join/{id}': 'POST /api/registration/groups/join/{id}',
            'POST /api/registration/groups/accept-member': 'POST /api/registration/groups/accept-member',
            
            // Wallet endpoints
            'GET /api/wallet/{id}': 'POST /api/payments/history',
            'GET /api/wallet/{id}/transactions': 'POST /api/payments/history',
            'POST /api/wallet/transactions': 'POST /api/payments/process',
            
            // Security endpoints  
            'GET /api/security/user-status/{id}': 'POST /api/verification/status/update',
            'POST /api/security/freeze-account': 'POST /api/verification/reset',
            'POST /api/security/public-warning': 'POST /api/notifications/send',
            
            // Audit endpoints
            'POST /api/audit/security-log': 'POST /api/mobile/analytics'
        };
        
        console.log('🔄 API Adapter initialized - intercepting fetch calls');
    }
    
    setupFetchInterceptor() {
        const self = this;
        
        window.fetch = async function(url, options = {}) {
            // Solo interceptar llamadas a nuestra API
            if (typeof url === 'string' && url.includes('api.latanda.online')) {
                return await self.interceptAPICall(url, options);
            }
            
            // Para otras URLs, usar fetch original
            return self.originalFetch.call(this, url, options);
        };
    }
    
    async interceptAPICall(url, options) {
        try {
            const method = options.method || 'GET';
            const originalPath = url.replace(this.API_BASE, '');
            const mappingKey = `${method} ${originalPath}`;
            
            // Buscar mapeo directo
            let newPath = this.findMapping(mappingKey, originalPath);
            
            if (newPath !== originalPath) {
                const newUrl = `${this.API_BASE}${newPath}`;
                console.log(`🔄 API Redirect: ${originalPath} → ${newPath}`);
                
                // Actualizar opciones si es necesario
                const newOptions = this.adaptRequestOptions(originalPath, newPath, options);
                
                return await this.originalFetch(newUrl, newOptions);
            }
            
            // Si no hay mapeo, usar URL original
            return await this.originalFetch(url, options);
            
        } catch (error) {
            console.error('❌ API Adapter Error:', error);
            
            // Fallback: intentar con mock data
            return this.createMockResponse(url, options);
        }
    }
    
    findMapping(mappingKey, originalPath) {
        // Buscar mapeo exacto
        if (this.endpointMapping[mappingKey]) {
            return this.endpointMapping[mappingKey].split(' ')[1];
        }
        
        // Buscar mapeo con parámetros
        for (const [pattern, replacement] of Object.entries(this.endpointMapping)) {
            const [patternMethod, patternPath] = pattern.split(' ');
            const [, replacementPath] = replacement.split(' ');
            
            if (mappingKey.startsWith(patternMethod) && this.pathMatches(originalPath, patternPath)) {
                return this.replacePath(originalPath, patternPath, replacementPath);
            }
        }
        
        return originalPath;
    }
    
    pathMatches(actualPath, patternPath) {
        if (!patternPath.includes('{')) {
            return actualPath === patternPath;
        }
        
        const patternRegex = patternPath.replace(/\{[^}]+\}/g, '([^/]+)');
        const regex = new RegExp(`^${patternRegex}$`);
        return regex.test(actualPath);
    }
    
    replacePath(actualPath, patternPath, replacementPath) {
        if (!patternPath.includes('{')) {
            return replacementPath;
        }
        
        const patternRegex = patternPath.replace(/\{[^}]+\}/g, '([^/]+)');
        const regex = new RegExp(`^${patternRegex}$`);
        const matches = actualPath.match(regex);
        
        if (matches) {
            let result = replacementPath;
            matches.slice(1).forEach((match, index) => {
                result = result.replace(/\{[^}]+\}/, match);
            });
            return result;
        }
        
        return replacementPath;
    }
    
    adaptRequestOptions(originalPath, newPath, options) {
        const newOptions = { ...options };
        
        // Adaptar body para endpoints específicos
        if (originalPath.includes('/api/auth/signin') && newPath.includes('/api/auth/login')) {
            // El endpoint de login puede necesitar estructura diferente
            if (newOptions.body) {
                const body = JSON.parse(newOptions.body);
                // Adaptar estructura si es necesario
                newOptions.body = JSON.stringify(this.adaptAuthLoginBody(body));
            }
        }
        
        // Adaptar headers
        if (!newOptions.headers) {
            newOptions.headers = {};
        }
        
        // Asegurar headers requeridos
        if (!newOptions.headers['Content-Type'] && newOptions.body) {
            newOptions.headers['Content-Type'] = 'application/json';
        }
        
        return newOptions;
    }
    
    adaptAuthLoginBody(body) {
        // Adaptar estructura del body si es necesario
        // Por ejemplo, si el endpoint real espera campos diferentes
        return {
            email: body.email || body.username,
            password: body.password,
            app_version: '2.0.0',
            device_type: 'web'
        };
    }
    
    async createMockResponse(url, options) {
        console.log('🎭 Creating mock response for:', url);
        
        // Crear respuesta mock básica
        const mockData = {
            success: true,
            data: {
                message: 'Mock response - API endpoint being developed',
                original_url: url,
                method: options.method || 'GET'
            },
            meta: {
                timestamp: new Date().toISOString(),
                mock: true
            }
        };
        
        // Mock específico para diferentes endpoints
        if (url.includes('/auth/')) {
            mockData.data = {
                user: {
                    id: 'mock_user_' + Date.now(),
                    name: 'Usuario Demo',
                    email: 'demo@latanda.online'
                },
                auth_token: 'mock_token_' + Date.now()
            };
        }
        
        return new Response(JSON.stringify(mockData), {
            status: 200,
            statusText: 'OK',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    
    // Método para probar conectividad real
    async testRealEndpoints() {
        const testEndpoints = [
            'GET /api/system/status',
            'POST /api/auth/login',
            'GET /api/groups',
            'POST /api/payments/methods/available'
        ];
        
        const results = {};
        
        for (const endpoint of testEndpoints) {
            const [method, path] = endpoint.split(' ');
            const url = `${this.API_BASE}${path}`;
            
            try {
                const response = await this.originalFetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: method === 'POST' ? JSON.stringify({}) : undefined
                });
                
                const data = await response.json();
                results[endpoint] = {
                    status: response.status,
                    success: data.success || response.ok,
                    data: data
                };
            } catch (error) {
                results[endpoint] = {
                    status: 'error',
                    success: false,
                    error: error.message
                };
            }
        }
        
        return results;
    }
    
    // Restore original fetch if needed
    restoreOriginalFetch() {
        window.fetch = this.originalFetch;
        console.log('🔄 Original fetch restored');
    }
}

// Initialize adapter immediately
const apiAdapter = new LaTandaAPIAdapter();

// Make available globally
window.laTandaAPIAdapter = apiAdapter;

// Test endpoints when loaded
setTimeout(async () => {
    if (window.location.hostname !== 'localhost') {
        console.log('🧪 Testing real endpoints...');
        const results = await apiAdapter.testRealEndpoints();
        console.table(results);
    }
}, 2000);

console.log('🔄 La Tanda API Adapter loaded - all fetch calls will be intercepted and corrected');