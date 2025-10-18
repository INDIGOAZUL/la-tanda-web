/**
 * La Tanda - Payment Integration Module
 * Sistema integrado de pagos con manejo de transacciones
 * Integración con múltiples proveedores de pago
 */

class PaymentIntegrationManager {
    constructor() {
        this.isInitialized = false;
        this.paymentMethods = new Map();
        this.activeTransactions = new Map();
        this.transactionHistory = [];
        this.apiBaseURL = 'https://api.latanda.online/api';
        
        // Payment providers configuration
        this.providers = {
            stripe: {
                enabled: false,
                publicKey: null,
                supportedMethods: ['card', 'bank_transfer']
            },
            paypal: {
                enabled: false,
                clientId: null,
                supportedMethods: ['paypal', 'card']
            },
            crypto: {
                enabled: true,
                supportedCurrencies: ['BTC', 'ETH', 'USDT', 'LTD']
            },
            traditional: {
                enabled: true,
                supportedMethods: ['bank_transfer', 'cash']
            }
        };

        console.log('💳 Payment Integration Manager initialized');
    }

    /**
     * Inicializar sistema de pagos
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('💳 Initializing Payment Integration System...');

            // Verificar dependencias
            await this.checkDependencies();

            // Cargar métodos de pago disponibles
            await this.loadAvailablePaymentMethods();

            // Configurar event listeners
            this.setupEventListeners();

            // Inicializar proveedores de pago
            await this.initializePaymentProviders();

            this.isInitialized = true;
            this.broadcastEvent('payment:initialized', { status: 'ready' });

            console.log('✅ Payment Integration System fully initialized');

        } catch (error) {
            console.error('❌ Failed to initialize Payment Integration:', error);
            this.handleSystemError(error);
        }
    }

    /**
     * Verificar dependencias requeridas
     */
    async checkDependencies() {
        // Verificar que API Integration Manager esté disponible
        if (!window.apiIntegrationManager) {
            throw new Error('API Integration Manager is required');
        }

        console.log('✅ Payment dependencies verified');
    }

    /**
     * Cargar métodos de pago disponibles desde API
     */
    async loadAvailablePaymentMethods() {
        try {
            const response = await fetch(`${this.apiBaseURL}/payments/methods/available`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('latanda_auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success && data.data) {
                // Actualizar métodos disponibles
                data.data.methods?.forEach(method => {
                    this.paymentMethods.set(method.id, {
                        ...method,
                        provider: this.getProviderForMethod(method.type)
                    });
                });

                console.log(`💳 Loaded ${this.paymentMethods.size} payment methods`);
            }

        } catch (error) {
            console.warn('⚠️ Payment methods endpoint not available, testing processing and using fallback');
            
            // Test if payment processing works
            try {
                const testResponse = await fetch(`${this.apiBaseURL}/payments/process`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('latanda_auth_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: 1,
                        currency: 'HNL',
                        payment_method: 'test',
                        test_mode: true
                    })
                });

                const testData = await testResponse.json();
                this.paymentProcessingAvailable = testData.success;
                
                if (testData.success) {
                    console.log('✅ Payment processing API is available');
                }
            } catch (processError) {
                console.warn('⚠️ Payment processing also unavailable');
                this.paymentProcessingAvailable = false;
            }
            
            // Fallback: métodos básicos
            this.loadFallbackPaymentMethods();
        }
    }

    /**
     * Métodos de pago de respaldo
     */
    loadFallbackPaymentMethods() {
        const fallbackMethods = [
            {
                id: 'ltd_token',
                name: 'Token LTD',
                type: 'crypto',
                icon: '🪙',
                enabled: true,
                fees: 0
            },
            {
                id: 'bank_transfer',
                name: 'Transferencia Bancaria',
                type: 'traditional',
                icon: '🏦',
                enabled: true,
                fees: 0.02
            },
            {
                id: 'cash',
                name: 'Efectivo',
                type: 'traditional',
                icon: '💵',
                enabled: true,
                fees: 0
            }
        ];

        fallbackMethods.forEach(method => {
            this.paymentMethods.set(method.id, {
                ...method,
                provider: this.getProviderForMethod(method.type)
            });
        });
    }

    /**
     * Obtener proveedor para tipo de método
     */
    getProviderForMethod(methodType) {
        const providerMap = {
            crypto: 'crypto',
            card: 'stripe',
            paypal: 'paypal',
            traditional: 'traditional'
        };

        return providerMap[methodType] || 'traditional';
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Listen for authentication changes
        document.addEventListener('latanda:auth:login', (event) => {
            this.handleUserLogin(event.detail.user);
        });

        document.addEventListener('latanda:auth:logout', () => {
            this.handleUserLogout();
        });

        console.log('💳 Payment event listeners configured');
    }

    /**
     * Inicializar proveedores de pago
     */
    async initializePaymentProviders() {
        // Initialize crypto payments
        if (this.providers.crypto.enabled) {
            await this.initializeCryptoPayments();
        }

        // Initialize traditional payments
        if (this.providers.traditional.enabled) {
            await this.initializeTraditionalPayments();
        }

        // TODO: Initialize Stripe, PayPal if keys are available
    }

    /**
     * Inicializar pagos crypto
     */
    async initializeCryptoPayments() {
        try {
            // Check if Web3 is available
            if (typeof window.ethereum !== 'undefined') {
                console.log('🔗 Web3 wallet detected');
                this.providers.crypto.web3Available = true;
            }

            console.log('💎 Crypto payments initialized');
        } catch (error) {
            console.warn('⚠️ Crypto payments initialization failed:', error);
        }
    }

    /**
     * Inicializar pagos tradicionales
     */
    async initializeTraditionalPayments() {
        // Traditional payments are always available
        console.log('🏦 Traditional payments initialized');
    }

    /**
     * Procesar pago
     */
    async processPayment(paymentData) {
        try {
            console.log('💳 Processing payment:', paymentData);

            // Validar datos del pago
            this.validatePaymentData(paymentData);

            // Generar ID único para la transacción
            const transactionId = this.generateTransactionId();

            // Crear registro de transacción
            const transaction = {
                id: transactionId,
                ...paymentData,
                status: 'processing',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Agregar a transacciones activas
            this.activeTransactions.set(transactionId, transaction);

            // Mostrar notificación de procesamiento
            this.showPaymentNotification('Procesando Pago', 'Tu transacción está siendo procesada...', 'loading');

            // Try to use real API first, then fallback to method-specific processing
            let result;
            
            if (this.paymentProcessingAvailable) {
                result = await this.processPaymentViaAPI(transaction);
            } else {
                // Fallback to method-specific processing
                const method = this.paymentMethods.get(paymentData.paymentMethodId);
                
                switch (method.provider) {
                    case 'crypto':
                        result = await this.processCryptoPayment(transaction, method);
                        break;
                    case 'traditional':
                        result = await this.processTraditionalPayment(transaction, method);
                        break;
                    case 'stripe':
                        result = await this.processStripePayment(transaction, method);
                        break;
                    default:
                    throw new Error(`Unsupported payment provider: ${method.provider}`);
            }

            // Actualizar estado de la transacción
            transaction.status = result.success ? 'completed' : 'failed';
            transaction.updatedAt = new Date().toISOString();
            transaction.providerResponse = result;

            // Mover a historial si está completada
            if (transaction.status === 'completed') {
                this.activeTransactions.delete(transactionId);
                this.transactionHistory.unshift(transaction);
                
                this.showPaymentNotification('Pago Exitoso', `Transacción completada: ${paymentData.amount} ${paymentData.currency}`, 'success');
                
                // Broadcast successful payment
                this.broadcastEvent('payment:success', { transaction });
            } else {
                this.showPaymentNotification('Error en Pago', result.error || 'El pago no pudo procesarse', 'error');
                
                // Broadcast failed payment
                this.broadcastEvent('payment:failed', { transaction, error: result.error });
            }

            return {
                success: result.success,
                transactionId: transactionId,
                transaction: transaction
            };

        } catch (error) {
            console.error('❌ Payment processing error:', error);
            this.showPaymentNotification('Error de Pago', error.message, 'error');
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process payment via real API
     */
    async processPaymentViaAPI(transaction) {
        try {
            const response = await fetch(`${this.apiBaseURL}/payments/process`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('latanda_auth_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: transaction.amount,
                    currency: transaction.currency || 'HNL',
                    payment_method: transaction.paymentMethodId,
                    description: transaction.description,
                    transaction_id: transaction.id,
                    user_id: transaction.userId || 'current_user'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    transactionId: data.data.id,
                    confirmationCode: data.data.confirmation_code,
                    status: data.data.status,
                    estimatedCompletion: data.data.estimated_completion,
                    apiResponse: data.data
                };
            } else {
                throw new Error(data.message || 'Payment processing failed');
            }
        } catch (error) {
            console.error('API payment processing error:', error);
            throw error;
        }
    }

    /**
     * Validar datos de pago
     */
    validatePaymentData(paymentData) {
        const required = ['amount', 'currency', 'paymentMethodId', 'description'];
        const missing = required.filter(field => !paymentData[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Validar método de pago
        if (!this.paymentMethods.has(paymentData.paymentMethodId)) {
            throw new Error(`Invalid payment method: ${paymentData.paymentMethodId}`);
        }

        // Validar cantidad
        if (paymentData.amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
    }

    /**
     * Procesar pago crypto
     */
    async processCryptoPayment(transaction, method) {
        try {
            if (method.id === 'ltd_token') {
                // Simular pago con LTD token
                await this.simulatePaymentDelay();
                
                // TODO: Integrate with actual LTD token contract
                return {
                    success: true,
                    txHash: this.generateTxHash(),
                    blockNumber: Math.floor(Math.random() * 1000000),
                    message: `Payment processed with ${method.name}`
                };
            }

            // Para otros cryptos, usar Web3
            if (this.providers.crypto.web3Available) {
                return await this.processWeb3Payment(transaction, method);
            }

            throw new Error('Web3 wallet not available');

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Procesar pago tradicional
     */
    async processTraditionalPayment(transaction, method) {
        try {
            // Simular procesamiento de pago tradicional
            await this.simulatePaymentDelay();

            // TODO: Integrate with actual payment processors
            return {
                success: true,
                reference: this.generatePaymentReference(),
                message: `Payment processed via ${method.name}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Procesar pago con Stripe
     */
    async processStripePayment(transaction, method) {
        try {
            // TODO: Implement Stripe integration
            throw new Error('Stripe integration not yet implemented');
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Procesar pago Web3
     */
    async processWeb3Payment(transaction, method) {
        try {
            // TODO: Implement Web3 payment processing
            throw new Error('Web3 payment processing not yet implemented');
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener métodos de pago disponibles
     */
    getAvailablePaymentMethods() {
        return Array.from(this.paymentMethods.values()).filter(method => method.enabled);
    }

    /**
     * Obtener historial de transacciones
     */
    getTransactionHistory(limit = 50) {
        return this.transactionHistory.slice(0, limit);
    }

    /**
     * Obtener transacciones activas
     */
    getActiveTransactions() {
        return Array.from(this.activeTransactions.values());
    }

    /**
     * Manejar login de usuario
     */
    handleUserLogin(user) {
        console.log('💳 User logged in, refreshing payment methods');
        this.loadAvailablePaymentMethods();
    }

    /**
     * Manejar logout de usuario
     */
    handleUserLogout() {
        console.log('💳 User logged out, clearing payment data');
        this.activeTransactions.clear();
        this.transactionHistory = [];
    }

    /**
     * Mostrar notificación de pago
     */
    showPaymentNotification(title, message, type) {
        if (window.apiIntegrationManager) {
            window.apiIntegrationManager.showNotification(title, message, type);
        } else {
            console.log(`💳 ${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    /**
     * Broadcast de eventos
     */
    broadcastEvent(eventName, data) {
        const event = new CustomEvent(`latanda:${eventName}`, { 
            detail: data,
            bubbles: true 
        });
        document.dispatchEvent(event);
    }

    /**
     * Utilidades
     */
    generateTransactionId() {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateTxHash() {
        return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    generatePaymentReference() {
        return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    async simulatePaymentDelay() {
        // Simular delay de procesamiento
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    handleSystemError(error) {
        console.error('🚨 Payment System Error:', error);
        this.showPaymentNotification(
            'Error del Sistema de Pagos',
            'Se produjo un error en el sistema de pagos. Inténtalo de nuevo.',
            'error'
        );
    }

    /**
     * API pública para componentes
     */
    
    // Crear interfaz de pago
    createPaymentInterface(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }

        // TODO: Implement payment UI component
        container.innerHTML = `
            <div class="payment-interface">
                <h3>Métodos de Pago Disponibles</h3>
                <div class="payment-methods-list">
                    ${this.renderPaymentMethods()}
                </div>
            </div>
        `;
    }

    renderPaymentMethods() {
        const methods = this.getAvailablePaymentMethods();
        return methods.map(method => `
            <div class="payment-method" data-method-id="${method.id}">
                <span class="method-icon">${method.icon}</span>
                <span class="method-name">${method.name}</span>
                ${method.fees > 0 ? `<span class="method-fees">${(method.fees * 100).toFixed(1)}% fee</span>` : ''}
            </div>
        `).join('');
    }
}

// Inicializar globalmente
window.paymentIntegrationManager = new PaymentIntegrationManager();

// Auto-inicializar cuando API Integration Manager esté listo
document.addEventListener('latanda:api:initialized', () => {
    window.paymentIntegrationManager.initialize();
});

console.log('💳 Payment Integration Manager loaded and ready');