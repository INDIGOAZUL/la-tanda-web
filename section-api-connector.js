/**
 * La Tanda - Section API Connector
 * Conector que vincula cada sección con sus APIs correspondientes
 * Mantiene consistencia entre todas las secciones
 */

class SectionAPIConnector {
    constructor() {
        this.sectionConfigs = new Map();
        this.loadedSections = new Set();
        this.sectionStates = new Map();
        
        this.initializeSectionConfigs();
        console.log('🔗 Section API Connector initialized');
    }

    /**
     * Configurar conexiones API para cada sección
     */
    initializeSectionConfigs() {
        // Auth Section
        this.sectionConfigs.set('auth', {
            file: 'auth.html',
            apis: [
                { endpoint: '/api/auth/login', method: 'POST' },
                { endpoint: '/api/auth/register', method: 'POST' },
                { endpoint: '/api/auth/logout', method: 'POST' }
            ],
            dependencies: ['apiIntegrationManager'],
            requiredAuth: false
        });

        // KYC Section
        this.sectionConfigs.set('kyc', {
            file: 'kyc-registration.html',
            apis: [
                { endpoint: '/api/verification/phone/send', method: 'POST' },
                { endpoint: '/api/verification/phone/confirm', method: 'POST' },
                { endpoint: '/api/verification/document/upload', method: 'POST' },
                { endpoint: '/api/verification/identity/check', method: 'POST' }
            ],
            dependencies: ['apiIntegrationManager'],
            requiredAuth: true
        });

        // Wallet Section
        this.sectionConfigs.set('wallet', {
            file: 'tanda-wallet.html',
            apis: [
                { endpoint: '/api/wallet/{id}', method: 'GET' },
                { endpoint: '/api/wallet/{id}/transactions', method: 'GET' },
                { endpoint: '/api/wallet/transactions', method: 'POST' },
                { endpoint: '/api/payments/process', method: 'POST' }
            ],
            dependencies: ['apiIntegrationManager', 'paymentIntegrationManager'],
            requiredAuth: true
        });

        // Groups Section
        this.sectionConfigs.set('groups', {
            file: 'groups-advanced-system.html',
            apis: [
                { endpoint: '/api/groups', method: 'GET' },
                { endpoint: '/api/registration/groups/create', method: 'POST' },
                { endpoint: '/api/registration/groups/join/{groupId}', method: 'POST' },
                { endpoint: '/api/registration/groups/details', method: 'GET' }
            ],
            dependencies: ['apiIntegrationManager'],
            requiredAuth: true
        });

        // Commissions Section
        this.sectionConfigs.set('commissions', {
            file: 'commission-system.html',
            apis: [
                { endpoint: '/api/payments/commission/calculate', method: 'POST' },
                { endpoint: '/api/payments/analytics', method: 'GET' },
                { endpoint: '/api/business/coordinator/performance', method: 'GET' }
            ],
            dependencies: ['apiIntegrationManager', 'paymentIntegrationManager'],
            requiredAuth: true
        });

        // Tokens Section
        this.sectionConfigs.set('tokens', {
            file: 'ltd-token-economics.html',
            apis: [
                { endpoint: '/api/tokens/balance', method: 'GET' },
                { endpoint: '/api/tokens/transactions', method: 'GET' },
                { endpoint: '/api/staking/rewards', method: 'GET' }
            ],
            dependencies: ['apiIntegrationManager'],
            requiredAuth: true
        });

        // Marketplace Section
        this.sectionConfigs.set('marketplace', {
            file: 'marketplace-social.html',
            apis: [
                { endpoint: '/api/marketplace/products', method: 'GET' },
                { endpoint: '/api/marketplace/orders', method: 'POST' },
                { endpoint: '/api/social/posts', method: 'GET' },
                { endpoint: '/api/social/feed', method: 'GET' }
            ],
            dependencies: ['apiIntegrationManager', 'paymentIntegrationManager'],
            requiredAuth: true
        });

        // Security Section
        this.sectionConfigs.set('security', {
            file: 'group-security-demo.html',
            apis: [
                { endpoint: '/api/security/user-status/{id}', method: 'GET' },
                { endpoint: '/api/security/freeze-account', method: 'POST' },
                { endpoint: '/api/audit/security-log', method: 'POST' }
            ],
            dependencies: ['apiIntegrationManager'],
            requiredAuth: true
        });

        // Dashboard Section
        this.sectionConfigs.set('dashboard', {
            file: 'web3-dashboard.html',
            apis: [
                { endpoint: '/api/dashboard/overview', method: 'GET' },
                { endpoint: '/api/business/analytics/revenue', method: 'GET' },
                { endpoint: '/api/business/performance/dashboard', method: 'GET' }
            ],
            dependencies: ['apiIntegrationManager', 'paymentIntegrationManager'],
            requiredAuth: true
        });
    }

    /**
     * Preparar sección antes de cargar
     */
    async prepareSection(sectionName) {
        const config = this.sectionConfigs.get(sectionName);
        if (!config) {
            throw new Error(`Unknown section: ${sectionName}`);
        }

        console.log(`🔧 Preparing section: ${sectionName}`);

        // Verificar autenticación si es requerida
        if (config.requiredAuth && !this.isUserAuthenticated()) {
            throw new Error(`Authentication required for section: ${sectionName}`);
        }

        // Verificar dependencias
        const missingDeps = this.checkDependencies(config.dependencies);
        if (missingDeps.length > 0) {
            throw new Error(`Missing dependencies for ${sectionName}: ${missingDeps.join(', ')}`);
        }

        // Pre-cargar datos necesarios
        await this.preloadSectionData(sectionName, config);

        // Marcar como preparada
        this.sectionStates.set(sectionName, {
            prepared: true,
            loaded: false,
            lastPreload: Date.now()
        });

        console.log(`✅ Section ${sectionName} prepared successfully`);
    }

    /**
     * Pre-cargar datos de la sección
     */
    async preloadSectionData(sectionName, config) {
        try {
            const promises = config.apis
                .filter(api => api.method === 'GET') // Solo pre-cargar GET requests
                .map(api => this.preloadAPIData(api, sectionName));

            await Promise.allSettled(promises);
            console.log(`📊 Data preloaded for section: ${sectionName}`);

        } catch (error) {
            console.warn(`⚠️ Could not preload all data for ${sectionName}:`, error);
            // No throw - permitir que la sección se cargue sin datos pre-cargados
        }
    }

    /**
     * Pre-cargar datos de API específica
     */
    async preloadAPIData(api, sectionName) {
        try {
            // Reemplazar parámetros en la URL si es necesario
            let endpoint = api.endpoint;
            if (endpoint.includes('{id}') && this.getCurrentUserId()) {
                endpoint = endpoint.replace('{id}', this.getCurrentUserId());
            }

            const response = await window.laTandaAPI.makeRequest(endpoint, {
                method: api.method
            });

            // Almacenar datos en cache temporal
            const cacheKey = `${sectionName}_${api.endpoint}`;
            this.setCacheData(cacheKey, response, 300000); // 5 minutos

            return response;

        } catch (error) {
            console.warn(`⚠️ Failed to preload ${api.endpoint}:`, error);
            return null;
        }
    }

    /**
     * Conectar sección después de que se carga
     */
    async connectSection(sectionName, iframe) {
        try {
            console.log(`🔗 Connecting APIs for section: ${sectionName}`);

            const config = this.sectionConfigs.get(sectionName);
            if (!config) {
                console.warn(`No configuration found for section: ${sectionName}`);
                return;
            }

            // Esperar a que la sección cargue completamente
            await this.waitForSectionLoad(iframe);

            // Inyectar helper functions en la sección
            this.injectSectionHelpers(iframe, sectionName, config);

            // Configurar comunicación entre iframe y parent
            this.setupSectionCommunication(iframe, sectionName);

            // Cargar datos iniciales si están disponibles en cache
            this.loadCachedDataIntoSection(iframe, sectionName);

            // Marcar como conectada
            const state = this.sectionStates.get(sectionName) || {};
            state.loaded = true;
            state.lastConnected = Date.now();
            this.sectionStates.set(sectionName, state);

            this.loadedSections.add(sectionName);
            console.log(`✅ Section ${sectionName} connected successfully`);

        } catch (error) {
            console.error(`❌ Failed to connect section ${sectionName}:`, error);
        }
    }

    /**
     * Esperar a que la sección cargue
     */
    async waitForSectionLoad(iframe, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkLoad = () => {
                try {
                    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                        resolve();
                        return;
                    }
                } catch (error) {
                    // Cross-origin restriction, assume loaded after timeout
                }

                if (Date.now() - startTime > timeout) {
                    resolve(); // Timeout, but don't reject
                    return;
                }

                setTimeout(checkLoad, 100);
            };

            iframe.addEventListener('load', () => resolve());
            checkLoad();
        });
    }

    /**
     * Inyectar helper functions en la sección
     */
    injectSectionHelpers(iframe, sectionName, config) {
        try {
            const doc = iframe.contentDocument;
            if (!doc) return;

            // Crear script con helpers
            const script = doc.createElement('script');
            script.textContent = `
                // La Tanda Section API Helpers
                window.laTandaHelpers = {
                    sectionName: "${sectionName}",
                    
                    // Hacer petición API con contexto de sección
                    async apiRequest(endpoint, options = {}) {
                        try {
                            return await parent.window.laTandaAPI.makeRequest(endpoint, options);
                        } catch (error) {
                            console.error('API request failed:', error);
                            throw error;
                        }
                    },
                    
                    // Procesar pago
                    async processPayment(paymentData) {
                        if (parent.window.paymentIntegrationManager) {
                            return await parent.window.paymentIntegrationManager.processPayment(paymentData);
                        }
                        throw new Error('Payment manager not available');
                    },
                    
                    // Mostrar notificación
                    showNotification(title, message, type = 'info') {
                        if (parent.window.apiIntegrationManager) {
                            parent.window.apiIntegrationManager.showNotification(title, message, type);
                        }
                    },
                    
                    // Obtener datos del usuario actual
                    getCurrentUser() {
                        if (parent.window.apiIntegrationManager) {
                            return parent.window.apiIntegrationManager.currentUser;
                        }
                        return null;
                    },
                    
                    // Verificar si usuario está autenticado
                    isAuthenticated() {
                        if (parent.window.apiIntegrationManager) {
                            return parent.window.apiIntegrationManager.isAuthenticated;
                        }
                        return false;
                    },
                    
                    // Navegar a otra sección
                    navigateToSection(targetSection) {
                        parent.window.postMessage({
                            type: 'navigate',
                            section: targetSection
                        }, '*');
                    },
                    
                    // Obtener datos de cache
                    getCachedData(key) {
                        return parent.window.sectionAPIConnector?.getCacheData(key);
                    }
                };
                
                console.log('🔧 La Tanda section helpers injected for: ${sectionName}');
            `;

            doc.head.appendChild(script);

        } catch (error) {
            console.warn(`Could not inject helpers into ${sectionName}:`, error);
        }
    }

    /**
     * Configurar comunicación entre iframe y parent
     */
    setupSectionCommunication(iframe, sectionName) {
        // Listen for messages from the iframe
        const messageHandler = (event) => {
            if (event.source !== iframe.contentWindow) return;

            switch (event.data.type) {
                case 'navigate':
                    this.handleSectionNavigation(event.data.section);
                    break;
                case 'api-request':
                    this.handleSectionAPIRequest(event.data, iframe);
                    break;
                case 'payment-request':
                    this.handleSectionPaymentRequest(event.data, iframe);
                    break;
            }
        };

        window.addEventListener('message', messageHandler);

        // Store handler reference for cleanup
        iframe._messageHandler = messageHandler;
    }

    /**
     * Cargar datos de cache en la sección
     */
    loadCachedDataIntoSection(iframe, sectionName) {
        try {
            const config = this.sectionConfigs.get(sectionName);
            if (!config) return;

            config.apis.forEach(api => {
                const cacheKey = `${sectionName}_${api.endpoint}`;
                const cachedData = this.getCacheData(cacheKey);

                if (cachedData) {
                    // Enviar datos cached a la sección
                    iframe.contentWindow.postMessage({
                        type: 'cached-data',
                        endpoint: api.endpoint,
                        data: cachedData
                    }, '*');
                }
            });

        } catch (error) {
            console.warn(`Could not load cached data for ${sectionName}:`, error);
        }
    }

    /**
     * Verificar dependencias
     */
    checkDependencies(dependencies) {
        return dependencies.filter(dep => !window[dep]);
    }

    /**
     * Verificar si usuario está autenticado
     */
    isUserAuthenticated() {
        return window.apiIntegrationManager?.isAuthenticated || false;
    }

    /**
     * Obtener ID del usuario actual
     */
    getCurrentUserId() {
        return window.apiIntegrationManager?.currentUser?.id || null;
    }

    /**
     * Sistema de cache simple
     */
    setCacheData(key, data, ttl = 300000) {
        const cacheItem = {
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        };
        
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Could not cache data:', error);
        }
    }

    getCacheData(key) {
        try {
            const cached = localStorage.getItem(`cache_${key}`);
            if (!cached) return null;

            const cacheItem = JSON.parse(cached);
            if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }

            return cacheItem.data;
        } catch (error) {
            return null;
        }
    }

    /**
     * Handlers para comunicación
     */
    handleSectionNavigation(targetSection) {
        // Delegate to main app navigation
        if (window.app && window.app.navigateToSection) {
            window.app.navigateToSection(targetSection);
        }
    }

    async handleSectionAPIRequest(requestData, iframe) {
        try {
            const response = await window.laTandaAPI.makeRequest(
                requestData.endpoint, 
                requestData.options
            );

            iframe.contentWindow.postMessage({
                type: 'api-response',
                requestId: requestData.requestId,
                response: response
            }, '*');

        } catch (error) {
            iframe.contentWindow.postMessage({
                type: 'api-error',
                requestId: requestData.requestId,
                error: error.message
            }, '*');
        }
    }

    async handleSectionPaymentRequest(requestData, iframe) {
        try {
            const response = await window.paymentIntegrationManager?.processPayment(
                requestData.paymentData
            );

            iframe.contentWindow.postMessage({
                type: 'payment-response',
                requestId: requestData.requestId,
                response: response
            }, '*');

        } catch (error) {
            iframe.contentWindow.postMessage({
                type: 'payment-error',
                requestId: requestData.requestId,
                error: error.message
            }, '*');
        }
    }

    /**
     * Limpiar sección cuando se descarga
     */
    cleanupSection(sectionName, iframe) {
        // Remover event listeners
        if (iframe._messageHandler) {
            window.removeEventListener('message', iframe._messageHandler);
        }

        // Limpiar estado
        this.sectionStates.delete(sectionName);
        this.loadedSections.delete(sectionName);

        console.log(`🧹 Section ${sectionName} cleaned up`);
    }

    /**
     * Obtener estado de todas las secciones
     */
    getSectionStates() {
        return Object.fromEntries(this.sectionStates);
    }

    /**
     * Obtener secciones cargadas
     */
    getLoadedSections() {
        return Array.from(this.loadedSections);
    }
}

// Inicializar globalmente
window.sectionAPIConnector = new SectionAPIConnector();

console.log('🔗 Section API Connector loaded and ready');