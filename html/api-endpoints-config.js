/**
 * La Tanda - Configuración de Endpoints Reales
 * Mapeo de las rutas correctas de la API
 * Basado en: latanda-complete-mobile-api-85-endpoints.js
 */

class LaTandaAPIConfig {
    constructor() {
        this.API_BASE = 'https://latanda.online';
        
        // Mapeo de endpoints reales encontrados
        this.ENDPOINTS = {
            // Sistema Core
            SYSTEM_STATUS: '/api/system/status',
            DOCS: '/docs',
            
            // Autenticación
            AUTH_LOGIN: '/api/auth/login',
            AUTH_REGISTER: '/api/auth/register', 
            AUTH_REFRESH: '/api/auth/refresh',
            AUTH_LOGOUT: '/api/auth/logout',
            
            // Mobile App
            MOBILE_INIT: '/api/mobile/init',
            MOBILE_SETTINGS: '/api/mobile/settings',
            MOBILE_SESSION_START: '/api/mobile/session/start',
            MOBILE_SESSION_END: '/api/mobile/session/end',
            MOBILE_FEEDBACK: '/api/mobile/feedback',
            MOBILE_ANALYTICS: '/api/mobile/analytics',
            
            // Push Notifications
            PUSH_REGISTER: '/api/push/register',
            PUSH_SEND: '/api/push/send',
            
            // Sync
            SYNC_STATUS: '/api/sync/status',
            SYNC_UPLOAD: '/api/sync/upload',
            SYNC_DOWNLOAD: '/api/sync/download',
            
            // MIA Assistant
            MIA_CONVERSATION_START: '/api/mia/conversation/start',
            MIA_MESSAGE_SEND: '/api/mia/message/send',
            MIA_CONTEXT_UPDATE: '/api/mia/context/update',
            MIA_CAPABILITIES: '/api/mia/capabilities',
            MIA_HELP_SUGGEST: '/api/mia/help/suggest',
            
            // Groups
            GROUPS_LIST: '/api/groups',
            GROUPS_LIST_REGISTRATION: '/api/registration/groups/list',
            GROUPS_CREATE: '/api/registration/groups/create',
            GROUPS_JOIN: '/api/registration/groups/join/{groupId}',
            GROUPS_ACCEPT_MEMBER: '/api/registration/groups/accept-member',
            GROUPS_REMOVE_MEMBER: '/api/registration/groups/remove-member',
            GROUPS_UPDATE_STATUS: '/api/registration/groups/update-status',
            GROUPS_DETAILS: '/api/registration/groups/details',
            GROUPS_MEMBERS: '/api/registration/groups/members',
            
            // Payments
            PAYMENTS_METHODS: '/api/payments/methods/available',
            PAYMENTS_PROCESS: '/api/payments/process',
            PAYMENTS_STATUS_UPDATE: '/api/payments/status/update',
            PAYMENTS_REMINDER_SEND: '/api/payments/reminder/send',
            PAYMENTS_CONFIRM: '/api/payments/confirm',
            PAYMENTS_DISPUTE: '/api/payments/dispute',
            PAYMENTS_HISTORY: '/api/payments/history',
            PAYMENTS_ANALYTICS: '/api/payments/analytics',
            PAYMENTS_COMMISSION_CALCULATE: '/api/payments/commission/calculate',
            
            // Verification
            VERIFICATION_PHONE_SEND: '/api/verification/phone/send',
            VERIFICATION_PHONE_CONFIRM: '/api/verification/phone/confirm',
            VERIFICATION_DOCUMENT_UPLOAD: '/api/verification/document/upload',
            VERIFICATION_DOCUMENT_STATUS: '/api/verification/document/status',
            VERIFICATION_IDENTITY_CHECK: '/api/verification/identity/check',
            VERIFICATION_STATUS_UPDATE: '/api/verification/status/update',
            VERIFICATION_RESET: '/api/verification/reset',
            VERIFICATION_ADVANCED_REQUEST: '/api/verification/advanced/request',
            
            // Business Intelligence
            BUSINESS_REVENUE: '/api/business/analytics/revenue',
            BUSINESS_DASHBOARD: '/api/business/performance/dashboard',
            BUSINESS_GROWTH_METRICS: '/api/business/growth/metrics',
            BUSINESS_USER_ACQUISITION: '/api/business/user/acquisition',
            BUSINESS_COORDINATOR_PERFORMANCE: '/api/business/coordinator/performance',
            BUSINESS_GROUP_ANALYTICS: '/api/business/group/analytics',
            BUSINESS_FINANCIAL_REPORTS: '/api/business/financial/reports',
            BUSINESS_PREDICTIONS: '/api/business/predictions',
            
            // Notifications
            NOTIFICATIONS_SEND: '/api/notifications/send',
            NOTIFICATIONS_SCHEDULE: '/api/notifications/schedule',
            NOTIFICATIONS_BULK_SEND: '/api/notifications/bulk/send',
            NOTIFICATIONS_TEMPLATE_CREATE: '/api/notifications/template/create',
            NOTIFICATIONS_SETTINGS_UPDATE: '/api/notifications/settings/update',
            NOTIFICATIONS_HISTORY: '/api/notifications/history'
        };
        
        // Mapeo para compatibilidad con componentes existentes
        this.LEGACY_MAPPING = {
            // Auth endpoints que usan nuestros componentes
            '/api/auth/test': this.ENDPOINTS.SYSTEM_STATUS,
            '/api/auth/signin': this.ENDPOINTS.AUTH_LOGIN,
            '/api/auth/signup': this.ENDPOINTS.AUTH_REGISTER,
            
            // User endpoints
            '/api/users/{id}': '/api/registration/groups/details', // Temporal
            '/api/users/{id}/security-info': this.ENDPOINTS.VERIFICATION_STATUS_UPDATE,
            
            // Groups endpoints  
            '/api/groups/{id}/security-info': this.ENDPOINTS.GROUPS_DETAILS,
            '/api/groups/{id}/join': this.ENDPOINTS.GROUPS_JOIN,
            
            // Wallet endpoints (necesitamos crearlos)
            '/api/wallet/{id}': this.ENDPOINTS.PAYMENTS_HISTORY,
            '/api/wallet/{id}/transactions': this.ENDPOINTS.PAYMENTS_HISTORY,
            '/api/wallet/transactions': this.ENDPOINTS.PAYMENTS_PROCESS,
            
            // Security endpoints
            '/api/security/user-status/{id}': this.ENDPOINTS.VERIFICATION_STATUS_UPDATE,
            '/api/security/freeze-account': this.ENDPOINTS.VERIFICATION_RESET,
            '/api/security/public-warning': this.ENDPOINTS.NOTIFICATIONS_SEND,
            
            // Audit endpoints
            '/api/audit/security-log': this.ENDPOINTS.MOBILE_ANALYTICS
        };
    }
    
    /**
     * Obtiene la URL completa de un endpoint
     */
    getEndpointUrl(endpoint) {
        const path = this.ENDPOINTS[endpoint] || endpoint;
        return `${this.API_BASE}${path}`;
    }
    
    /**
     * Mapea endpoint legacy a endpoint real
     */
    mapLegacyEndpoint(legacyPath) {
        // Buscar mapeo directo
        if (this.LEGACY_MAPPING[legacyPath]) {
            return `${this.API_BASE}${this.LEGACY_MAPPING[legacyPath]}`;
        }
        
        // Buscar mapeo con parámetros
        for (const [pattern, realEndpoint] of Object.entries(this.LEGACY_MAPPING)) {
            if (pattern.includes('{')) {
                const regex = new RegExp(pattern.replace(/\{[^}]+\}/g, '([^/]+)'));
                if (regex.test(legacyPath)) {
                    const realPath = realEndpoint.replace(/\{[^}]+\}/g, '$1');
                    return `${this.API_BASE}${realPath}`;
                }
            }
        }
        
        // Si no hay mapeo, devolver tal como está
        return `${this.API_BASE}${legacyPath}`;
    }
    
    /**
     * Hacer petición HTTP con endpoint correcto
     */
    async makeRequest(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : this.mapLegacyEndpoint(endpoint);
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        try {
            console.log(`🔗 API Request: ${requestOptions.method} ${url}`);
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ API Success: ${url}`);
                return data;
            } else {
                console.warn(`⚠️ API Warning: ${url}`, data);
                return data;
            }
        } catch (error) {
            console.error(`❌ API Error: ${url}`, error);
            throw error;
        }
    }
    
    /**
     * Autenticación con token
     */
    setAuthToken(token) {
        this.authToken = token;
    }
    
    /**
     * Obtener headers con autenticación
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        return headers;
    }
    
    /**
     * Test de conectividad
     */
    async testConnection() {
        try {
            const response = await this.makeRequest(this.ENDPOINTS.SYSTEM_STATUS);
            return {
                success: true,
                data: response,
                message: 'Conexión exitosa con la API'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Error conectando con la API'
            };
        }
    }
}

// Crear instancia global
window.laTandaAPI = new LaTandaAPIConfig();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTandaAPIConfig;
}

console.log('🔗 La Tanda API Config loaded with', Object.keys(window.laTandaAPI.ENDPOINTS).length, 'endpoints');