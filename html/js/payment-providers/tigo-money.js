/**
 * Tigo Money Payment Provider
 * Integración con Tigo Money API para El Salvador
 * Fecha: 2 de Noviembre, 2025
 */

class TigoMoneyProvider {
    constructor() {
        this.name = 'tigo_money';
        this.displayName = 'Tigo Money';

        // API URLs
        this.productionURL = 'https://api.tigo.com.sv/v1';
        this.sandboxURL = 'https://sandbox-api.tigo.com.sv/v1';
        this.useSandbox = true; // Cambiar a false en producción

        // Authentication
        this.accessToken = null;
        this.tokenExpiry = null;

        // Config
        this.config = null;
        this.isInitialized = false;

    }

    /**
     * Get base URL based on environment
     */
    getBaseURL() {
        return this.useSandbox ? this.sandboxURL : this.productionURL;
    }

    /**
     * Initialize provider
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {

            // Get configuration
            this.config = await this.getConfig();

            // Authenticate
            await this.authenticate();

            this.isInitialized = true;

        } catch (error) {
            throw new Error(`Tigo Money initialization failed: ${error.message}`);
        }
    }

    /**
     * Get configuration from backend
     */
    async getConfig() {
        // En producción, obtener desde backend seguro
        // Por ahora, usar configuración de sandbox/simulación

        if (this.useSandbox) {
            // v4.3.0: Sandbox credentials removed — must be configured server-side
            return {
                client_id: '',
                client_secret: '',
                agent_account: '',
                agent_pin: '',
                agent_name: 'La Tanda SV'
            };
        }

        // Producción: obtener desde API backend
        try {
            const response = await fetch('/api/payments/config/tigo', {
                headers: {
                    'Authorization': `Bearer ${(localStorage.getItem('auth_token') || localStorage.getItem('authToken'))}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get Tigo Money config');
            }

            const data = await response.json();
            return data.config;

        } catch (error) {
            return null; // v4.3.0: removed infinite recursion
        }
    }

    /**
     * Authenticate with Tigo Money API
     */
    async authenticate() {

        // En modo sandbox/simulación, simular token
        if (this.useSandbox) {
            this.accessToken = 'SANDBOX_TOKEN_' + Date.now();
            this.tokenExpiry = Date.now() + (3600 * 1000); // 1 hora
            return;
        }

        // Producción: autenticación real
        const url = `${this.getBaseURL()}/oauth/token`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.config.client_id,
                    client_secret: this.config.client_secret
                })
            });

            const data = await response.json();

            if (data.access_token) {
                this.accessToken = data.access_token;
                this.tokenExpiry = Date.now() + (data.expires_in * 1000);
            } else {
                throw new Error('No access token received');
            }

        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if token is still valid
     */
    isTokenValid() {
        if (!this.accessToken) return false;
        if (!this.tokenExpiry) return false;

        // Renovar token 5 minutos antes de expirar
        const buffer = 5 * 60 * 1000;
        return Date.now() < (this.tokenExpiry - buffer);
    }

    /**
     * Ensure we have a valid token
     */
    async ensureAuthenticated() {
        if (!this.isTokenValid()) {
            await this.authenticate();
        }
    }

    /**
     * Process payment
     */
    async processPayment(amount, metadata) {

        // Inicializar si es necesario
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Verificar autenticación
        await this.ensureAuthenticated();

        // Validar datos
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }

        if (!metadata.customer_phone) {
            throw new Error('Customer phone number is required');
        }

        // Formatear número de teléfono (debe ser +503XXXXXXXX o 503XXXXXXXX)
        const phone = this.formatPhoneNumber(metadata.customer_phone);

        // Generar referencia única
        const reference = `LATANDA-TM-${Date.now()}`;

        // En modo sandbox, simular respuesta
        if (this.useSandbox) {

            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simular respuesta exitosa
            const transactionId = `TM${Date.now()}`;

            return {
                success: true,
                provider: 'tigo_money',
                transaction_id: transactionId,
                status: 'pending',
                payment_url: `https://money.tigo.com.sv/pay/${transactionId}`,
                amount: amount,
                currency: 'USD',
                reference: reference,
                customer_phone: phone,
                timestamp: new Date().toISOString(),
                instructions: {
                    message: 'Pago iniciado. Por favor, completa el pago en tu app de Tigo Money.',
                    steps: [
                        '1. Abre tu app de Tigo Money',
                        '2. Ve a "Pagos pendientes"',
                        `3. Busca la transacción ${transactionId}`,
                        '4. Confirma el pago de $' + amount
                    ]
                }
            };
        }

        // Producción: llamada real a API
        const url = `${this.getBaseURL()}/payments/initiate`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agent_account: this.config.agent_account,
                    agent_pin: this.config.agent_pin,
                    customer_phone: phone,
                    amount: amount,
                    currency: 'USD',
                    reference: reference,
                    description: metadata.description || 'Pago de tanda - La Tanda SV'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Payment initiation failed');
            }

            if (result.transaction_id) {

                return {
                    success: true,
                    provider: 'tigo_money',
                    transaction_id: result.transaction_id,
                    status: result.status,
                    payment_url: result.payment_url,
                    amount: amount,
                    currency: 'USD',
                    reference: reference,
                    customer_phone: phone,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error('No transaction ID received');
            }

        } catch (error) {
            throw new Error(`Tigo Money payment failed: ${error.message}`);
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(transactionId) {

        // Inicializar si es necesario
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Verificar autenticación
        await this.ensureAuthenticated();

        // En modo sandbox, simular verificación
        if (this.useSandbox) {

            // Simular delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Simular que el pago está completado después de 10 segundos
            const txTime = parseInt(transactionId.replace('TM', ''));
            const elapsed = Date.now() - txTime;
            const status = elapsed > 10000 ? 'completed' : 'pending';

            return {
                success: true,
                transaction_id: transactionId,
                status: status,
                amount: 100.00, // Simulated
                currency: 'USD',
                paid_at: status === 'completed' ? new Date().toISOString() : null,
                verified_at: new Date().toISOString()
            };
        }

        // Producción: verificación real
        const url = `${this.getBaseURL()}/payments/${transactionId}/status`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Payment verification failed');
            }


            return {
                success: true,
                transaction_id: result.transaction_id,
                status: result.status,
                amount: result.amount,
                currency: result.currency || 'USD',
                paid_at: result.timestamp,
                verified_at: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Payment verification failed: ${error.message}`);
        }
    }

    /**
     * Cancel/refund payment
     */
    async refundPayment(transactionId, reason) {

        // En modo sandbox, simular reembolso
        if (this.useSandbox) {

            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                success: true,
                transaction_id: transactionId,
                refund_id: `RF${Date.now()}`,
                status: 'refunded',
                refunded_at: new Date().toISOString(),
                reason: reason || 'Customer request'
            };
        }

        // Producción: reembolso real
        const url = `${this.getBaseURL()}/payments/${transactionId}/refund`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: reason || 'Customer request'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Refund failed');
            }


            return {
                success: true,
                transaction_id: transactionId,
                refund_id: result.refund_id,
                status: 'refunded',
                refunded_at: result.timestamp,
                reason: reason
            };

        } catch (error) {
            throw new Error(`Refund failed: ${error.message}`);
        }
    }

    /**
     * Format phone number to Tigo Money format
     */
    formatPhoneNumber(phone) {
        // Eliminar espacios y caracteres especiales
        let cleaned = phone.replace(/[\s\-\(\)]/g, '');

        // Si empieza con +503, dejarlo
        if (cleaned.startsWith('+503')) {
            return cleaned;
        }

        // Si empieza con 503, agregar +
        if (cleaned.startsWith('503')) {
            return '+' + cleaned;
        }

        // Si es solo 8 dígitos, agregar +503
        if (cleaned.length === 8) {
            return '+503' + cleaned;
        }

        // Si no, retornar tal cual (validación fallará en API)
        return cleaned;
    }

    /**
     * Get provider info
     */
    getInfo() {
        return {
            name: this.name,
            displayName: this.displayName,
            logo: '/assets/tigo-logo.png',
            description: 'Paga con tu cuenta de Tigo Money',
            supported_currencies: ['USD'],
            supported_countries: ['SV'], // El Salvador
            min_amount: 1.00,
            max_amount: 10000.00,
            fees: {
                fixed: 0.00,
                percentage: 0.00 // Sin comisiones para el usuario
            },
            processing_time: 'Instantáneo',
            features: [
                'Pagos instantáneos',
                'Sin comisiones',
                'Seguro y confiable',
                'Disponible 24/7'
            ]
        };
    }

    /**
     * Test connection (for debugging)
     */
    async testConnection() {

        try {
            await this.initialize();
            return { success: true, message: 'Connection OK' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Export para uso global
if (typeof window !== 'undefined') {
    window.TigoMoneyProvider = TigoMoneyProvider;
}
