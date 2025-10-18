/**
 * La Tanda - API Integration Manager
 * Gestor central de integraciones API con estados y consistencia visual
 * Fase 2: Backend Integration con mantenimiento de design system
 */

class APIIntegrationManager {
    constructor() {
        this.isInitialized = false;
        this.authToken = null;
        this.userProfile = null;
        this.connectionStatus = 'disconnected';
        this.loadingStates = new Map();
        this.errorStates = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        console.log('🔧 API Integration Manager initialized');
    }

    /**
     * Inicialización completa del sistema de integración
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initializing API Integration System...');
            
            // Verificar dependencias
            await this.checkDependencies();
            
            // Configurar interceptores globales
            this.setupGlobalInterceptors();
            
            // Inicializar estado de autenticación
            await this.initializeAuthState();
            
            // Configurar notificaciones
            this.setupNotificationSystem();
            
            // Configurar manejo de errores global
            this.setupGlobalErrorHandling();
            
            // Test de conectividad inicial
            await this.performConnectivityCheck();
            
            this.isInitialized = true;
            this.broadcastEvent('api:initialized', { status: 'ready' });
            
            console.log('✅ API Integration System fully initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize API Integration:', error);
            this.handleSystemError(error);
        }
    }

    /**
     * Verificar que todas las dependencias estén disponibles
     */
    async checkDependencies() {
        const required = ['laTandaAPI', 'laTandaAPIAdapter'];
        const missing = [];

        for (const dep of required) {
            if (!window[dep]) {
                missing.push(dep);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Missing dependencies: ${missing.join(', ')}`);
        }

        console.log('✅ All API dependencies verified');
    }

    /**
     * Configurar interceptores globales para mantener consistencia
     */
    setupGlobalInterceptors() {
        // Interceptar todas las llamadas para agregar loading states
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            const requestId = this.generateRequestId(url, options);
            
            try {
                // Mostrar loading state
                this.setLoadingState(requestId, true);
                this.clearErrorState(requestId);
                
                // Agregar headers de autenticación si están disponibles
                if (this.authToken) {
                    options.headers = {
                        ...options.headers,
                        'Authorization': `Bearer ${this.authToken}`,
                        'X-User-ID': this.userProfile?.id || 'anonymous'
                    };
                }

                // Realizar petición
                const response = await originalFetch(url, options);
                
                // Manejar respuesta
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                // Ocultar loading state
                this.setLoadingState(requestId, false);
                
                // Actualizar estado de conexión
                this.updateConnectionStatus('connected');
                
                return { ...response, json: () => Promise.resolve(data) };
                
            } catch (error) {
                this.setLoadingState(requestId, false);
                this.setErrorState(requestId, error.message);
                this.updateConnectionStatus('error');
                
                // Intentar retry automático para errores de red
                if (this.shouldRetry(error, requestId)) {
                    console.log(`🔄 Retrying request ${requestId}...`);
                    return this.retryRequest(url, options, requestId);
                }
                
                throw error;
            }
        };

        console.log('🔄 Global API interceptors configured');
    }

    /**
     * Inicializar estado de autenticación desde localStorage
     */
    async initializeAuthState() {
        try {
            // Verificar si hay una sesión guardada
            const savedAuth = localStorage.getItem('laTandaWeb3Auth');
            if (savedAuth) {
                const authData = JSON.parse(savedAuth);
                
                // Verificar que los datos básicos estén presentes
                if (authData.auth_token && authData.user) {
                    this.authToken = authData.auth_token;
                    this.userProfile = authData.user;
                    this.broadcastEvent('auth:restored', { user: this.userProfile });
                    console.log('🔐 Authentication state restored from localStorage');
                } else {
                    // Datos incompletos, limpiar sesión
                    localStorage.removeItem('laTandaWeb3Auth');
                    console.log('🔐 Incomplete auth data removed');
                }
            } else {
                console.log('🔐 No saved authentication found');
            }
        } catch (error) {
            console.warn('⚠️ Error initializing auth state:', error);
            localStorage.removeItem('laTandaWeb3Auth');
        }
    }

    /**
     * Validar token de autenticación
     */
    async validateToken(token) {
        try {
            const response = await window.laTandaAPI.makeRequest('/api/auth/validate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.success;
        } catch (error) {
            return false;
        }
    }

    /**
     * Configurar sistema de notificaciones consistente
     */
    setupNotificationSystem() {
        // Crear contenedor de notificaciones si no existe
        if (!document.getElementById('api-notifications')) {
            const container = document.createElement('div');
            container.id = 'api-notifications';
            container.className = 'api-notifications-container';
            container.innerHTML = `
                <style>
                    .api-notifications-container {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 10000;
                        max-width: 400px;
                    }
                    
                    .api-notification {
                        background: var(--bg-accent, rgba(15, 23, 42, 0.9));
                        backdrop-filter: blur(24px);
                        border: 1px solid var(--border-primary, rgba(148, 163, 184, 0.1));
                        border-radius: 12px;
                        padding: 16px;
                        margin-bottom: 12px;
                        color: var(--text-primary, #f8fafc);
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        transform: translateX(100%);
                        opacity: 0;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    
                    .api-notification.show {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    
                    .api-notification.success {
                        border-color: var(--tanda-cyan, #00FFFF);
                        box-shadow: 0 25px 50px -12px rgba(0, 255, 255, 0.2);
                    }
                    
                    .api-notification.error {
                        border-color: #ef4444;
                        box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.2);
                    }
                    
                    .api-notification.warning {
                        border-color: #f59e0b;
                        box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.2);
                    }
                    
                    .notification-content {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                    }
                    
                    .notification-icon {
                        font-size: 20px;
                        margin-top: 2px;
                    }
                    
                    .notification-text {
                        flex: 1;
                    }
                    
                    .notification-title {
                        font-weight: 600;
                        margin-bottom: 4px;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                    }
                    
                    .notification-message {
                        font-size: 14px;
                        color: var(--text-secondary, rgba(248, 250, 252, 0.7));
                        line-height: 1.4;
                    }
                    
                    .notification-close {
                        background: none;
                        border: none;
                        color: var(--text-secondary, rgba(248, 250, 252, 0.7));
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: all 0.2s ease;
                    }
                    
                    .notification-close:hover {
                        background: rgba(255, 255, 255, 0.1);
                        color: var(--text-primary, #f8fafc);
                    }
                </style>
            `;
            document.body.appendChild(container);
        }

        console.log('🔔 Notification system configured');
    }

    /**
     * Mostrar notificación con estilo consistente
     */
    showNotification(title, message, type = 'info', duration = 5000) {
        const container = document.getElementById('api-notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `api-notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icons[type] || icons.info}</div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        container.appendChild(notification);

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }

        return notification;
    }

    /**
     * Configurar manejo global de errores
     */
    setupGlobalErrorHandling() {
        // Manejar errores no capturados
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled Promise Rejection:', event.reason);
            this.showNotification(
                'Error de Sistema',
                'Se produjo un error inesperado. El equipo técnico ha sido notificado.',
                'error'
            );
        });

        // Manejar errores JavaScript
        window.addEventListener('error', (event) => {
            console.error('🚨 JavaScript Error:', event.error);
            if (event.error?.message?.includes('api') || event.error?.message?.includes('fetch')) {
                this.showNotification(
                    'Error de Conectividad',
                    'Problema conectando con el servidor. Verificando conexión...',
                    'warning'
                );
                this.performConnectivityCheck();
            }
        });

        console.log('🛡️ Global error handling configured');
    }

    /**
     * Realizar test de conectividad
     */
    async performConnectivityCheck() {
        try {
            const result = await window.laTandaAPI.testConnection();
            
            if (result.success) {
                this.updateConnectionStatus('connected');
                this.showNotification(
                    'Conexión Establecida',
                    'Conectado exitosamente con los servidores de La Tanda',
                    'success',
                    3000
                );
            } else {
                this.updateConnectionStatus('disconnected');
                this.showNotification(
                    'Sin Conexión',
                    'No se pudo conectar con el servidor. Trabajando en modo offline.',
                    'warning'
                );
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            this.showNotification(
                'Error de Conectividad',
                'Error verificando conexión con el servidor',
                'error'
            );
        }
    }

    /**
     * Actualizar estado de conexión en UI
     */
    updateConnectionStatus(status) {
        this.connectionStatus = status;
        
        // Actualizar indicador visual si existe
        const indicator = document.querySelector('.connection-status');
        if (indicator) {
            indicator.className = `connection-status ${status}`;
            
            const statusText = {
                connected: '🟢 Conectado',
                disconnected: '🟡 Sin conexión',
                error: '🔴 Error de conexión'
            };
            
            indicator.textContent = statusText[status] || status;
        }

        // Broadcast event para otros componentes
        this.broadcastEvent('connection:status', { status });
    }

    /**
     * Gestión de estados de carga
     */
    setLoadingState(requestId, isLoading) {
        this.loadingStates.set(requestId, isLoading);
        
        // Actualizar UI global de loading si existe
        const globalLoader = document.querySelector('.global-loading');
        const hasActiveLoading = Array.from(this.loadingStates.values()).some(state => state);
        
        if (globalLoader) {
            globalLoader.style.display = hasActiveLoading ? 'flex' : 'none';
        }

        this.broadcastEvent('loading:state', { requestId, isLoading, hasActiveLoading });
    }

    setErrorState(requestId, error) {
        this.errorStates.set(requestId, error);
        this.broadcastEvent('error:state', { requestId, error });
    }

    clearErrorState(requestId) {
        this.errorStates.delete(requestId);
        this.broadcastEvent('error:cleared', { requestId });
    }

    /**
     * Sistema de retry automático
     */
    shouldRetry(error, requestId) {
        const currentAttempts = this.retryAttempts.get(requestId) || 0;
        const isNetworkError = error.message.includes('fetch') || 
                              error.message.includes('network') ||
                              error.message.includes('timeout');
        
        return isNetworkError && currentAttempts < this.maxRetries;
    }

    async retryRequest(url, options, requestId) {
        const attempts = this.retryAttempts.get(requestId) || 0;
        this.retryAttempts.set(requestId, attempts + 1);

        // Delay exponencial
        const delay = Math.pow(2, attempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        return window.fetch(url, options);
    }

    /**
     * Broadcast de eventos para comunicación entre componentes
     */
    broadcastEvent(eventName, data) {
        const event = new CustomEvent(`latanda:${eventName}`, { 
            detail: data,
            bubbles: true 
        });
        document.dispatchEvent(event);
    }

    /**
     * Utilities
     */
    generateRequestId(url, options) {
        const method = options.method || 'GET';
        const timestamp = Date.now();
        return `${method}_${url}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    handleSystemError(error) {
        console.error('🚨 System Error:', error);
        this.showNotification(
            'Error del Sistema',
            'Se produjo un error crítico. Por favor, recarga la página.',
            'error',
            0 // No auto-dismiss
        );
    }

    /**
     * API Methods para uso en componentes
     */
    
    // Autenticación
    async login(credentials) {
        try {
            const response = await window.laTandaAPI.makeRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (response.success) {
                this.authToken = response.data.auth_token;
                this.userProfile = response.data.user;
                
                // Guardar en localStorage
                localStorage.setItem('laTandaWeb3Auth', JSON.stringify(response.data));
                
                this.broadcastEvent('auth:login', { user: this.userProfile });
                this.showNotification('Sesión Iniciada', `Bienvenido ${this.userProfile.name}`, 'success');
                
                return response;
            }
            
            throw new Error(response.message || 'Error en login');
        } catch (error) {
            this.showNotification('Error de Login', error.message, 'error');
            throw error;
        }
    }

    async logout() {
        try {
            if (this.authToken) {
                await window.laTandaAPI.makeRequest('/api/auth/logout', {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.warn('Error during logout:', error);
        } finally {
            this.authToken = null;
            this.userProfile = null;
            localStorage.removeItem('laTandaWeb3Auth');
            
            this.broadcastEvent('auth:logout', {});
            this.showNotification('Sesión Cerrada', 'Has cerrado sesión correctamente', 'info');
        }
    }

    // Getters para estado actual
    get isAuthenticated() {
        return !!this.authToken && !!this.userProfile;
    }

    get currentUser() {
        return this.userProfile;
    }

    get isConnected() {
        return this.connectionStatus === 'connected';
    }
}

// Inicializar globalmente
window.apiIntegrationManager = new APIIntegrationManager();

// Auto-inicializar cuando la página esté lista
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiIntegrationManager.initialize();
    });
} else {
    window.apiIntegrationManager.initialize();
}

console.log('🔧 API Integration Manager loaded and ready');