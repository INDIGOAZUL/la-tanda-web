/**
 * La Tanda Wallet - Sistema Web3 con Smart Contracts
 * Funcionalidad: Cartera inteligente con restricciones automáticas
 * Versión: 1.0.0
 * 
 * CARACTERÍSTICAS:
 * - Gestión de fondos con smart contracts
 * - Restricciones inteligentes de retiro
 * - Integración con LTD Token Economics
 * - Protección anti-fraude automática
 */

class TandaWallet {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = null;
        this.walletAddress = null;
        this.smartContracts = {
            tandaManager: null,
            ltdToken: null,
            restrictionEngine: null
        };
        
        // Estados de la wallet
        this.WALLET_STATES = {
            ACTIVE: 'active',
            LOCKED: 'locked',
            RESTRICTED: 'restricted',
            FROZEN: 'frozen'
        };
        
        // Tipos de transacciones
        this.TRANSACTION_TYPES = {
            DEPOSIT: 'deposit',
            WITHDRAW: 'withdraw',
            LOCK_FOR_TANDA: 'lock_for_tanda',
            UNLOCK_TANDA: 'unlock_tanda',
            LTD_MINT: 'ltd_mint',
            LTD_BURN: 'ltd_burn',
            COMMISSION_PAYMENT: 'commission_payment'
        };
        
        // Límites de seguridad
        this.SECURITY_LIMITS = {
            MAX_DAILY_WITHDRAWAL: 50000, // L. 50,000
            MAX_SINGLE_WITHDRAWAL: 5000,  // L. 5,000 sin verificación
            MIN_VERIFICATION_AMOUNT: 1000 // L. 1,000
        };
        
        this.walletData = {
            availableBalance: 0,
            lockedBalance: 0,
            ltdTokens: 0,
            dailyWithdrawn: 0,
            lastWithdrawalDate: null,
            activeTandas: [],
            restrictions: []
        };
    }
    
    async init() {
        try {
            await this.loadUserData();
            await this.connectWallet();
            await this.loadWalletData();
            await this.initSmartContracts();
            await this.integrateSecuritySystem();
            this.setupEventListeners();
            this.updateUI();
            this.loadTransactionHistory();
            
            console.log('🚀 Tanda Wallet initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Tanda Wallet:', error);
            this.showNotification('Error inicializando la wallet: ' + error.message, 'error');
        }
    }
    
    loadUserData() {
        const authData = localStorage.getItem('laTandaWeb3Auth');
        if (authData) {
            this.currentUser = JSON.parse(authData).user;
        } else {
            throw new Error('Usuario no autenticado');
        }
    }
    
    async connectWallet() {
        try {
            // Simulación de conexión Web3 (Ethereum/Polygon)
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                this.walletAddress = accounts[0];
                
                // Verificar red (Polygon Mumbai/Mainnet)
                const chainId = await window.ethereum.request({ 
                    method: 'eth_chainId' 
                });
                
                if (chainId !== '0x89' && chainId !== '0x13881') {
                    await this.switchToPolygon();
                }
            } else {
                // Crear wallet simulada para demo
                this.walletAddress = this.generateMockWalletAddress();
                console.log('📱 Using mock wallet for demo:', this.walletAddress);
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.walletAddress = this.generateMockWalletAddress();
        }
    }
    
    generateMockWalletAddress() {
        return '0x' + Math.random().toString(16).substr(2, 40);
    }
    
    async switchToPolygon() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }], // Polygon Mainnet
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await this.addPolygonNetwork();
            }
        }
    }
    
    async addPolygonNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x89',
                    chainName: 'Polygon',
                    nativeCurrency: {
                        name: 'MATIC',
                        symbol: 'MATIC',
                        decimals: 18
                    },
                    rpcUrls: ['https://polygon-rpc.com/'],
                    blockExplorerUrls: ['https://polygonscan.com/']
                }]
            });
        } catch (addError) {
            console.error('Error adding Polygon network:', addError);
        }
    }
    
    async loadWalletData() {
        try {
            const response = await fetch(`${this.API_BASE}/api/wallet/${this.currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.walletData = { ...this.walletData, ...result.data };
            } else {
                // Datos mock para demo
                this.walletData = {
                    availableBalance: 2500.50,
                    lockedBalance: 5000.00,
                    ltdTokens: 150,
                    dailyWithdrawn: 0,
                    lastWithdrawalDate: null,
                    activeTandas: [
                        { id: 'tanda_001', amount: 2500, dueDate: '2025-08-15' },
                        { id: 'tanda_002', amount: 2500, dueDate: '2025-09-01' }
                    ],
                    restrictions: [
                        { type: 'daily_limit', active: true },
                        { type: 'tanda_lock', active: true },
                        { type: 'anti_fraud', active: true }
                    ]
                };
            }
        } catch (error) {
            console.error('Error loading wallet data:', error);
            // Usar datos mock en caso de error
        }
    }
    
    async initSmartContracts() {
        try {
            // Mock de inicialización de smart contracts
            this.smartContracts = {
                tandaManager: {
                    address: '0x1234567890123456789012345678901234567890',
                    methods: {
                        lockFunds: this.mockSmartContractCall.bind(this),
                        unlockFunds: this.mockSmartContractCall.bind(this),
                        checkRestrictions: this.mockSmartContractCall.bind(this)
                    }
                },
                ltdToken: {
                    address: '0x0987654321098765432109876543210987654321',
                    methods: {
                        mint: this.mockSmartContractCall.bind(this),
                        burn: this.mockSmartContractCall.bind(this),
                        transfer: this.mockSmartContractCall.bind(this)
                    }
                },
                restrictionEngine: {
                    address: '0x5555555555555555555555555555555555555555',
                    methods: {
                        validateWithdrawal: this.mockSmartContractCall.bind(this),
                        applyRestriction: this.mockSmartContractCall.bind(this),
                        removeRestriction: this.mockSmartContractCall.bind(this)
                    }
                }
            };
            
            console.log('🔗 Smart contracts initialized:', this.smartContracts);
        } catch (error) {
            console.error('Error initializing smart contracts:', error);
        }
    }
    
    async mockSmartContractCall(method, params) {
        // Simulación de llamadas a smart contracts
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    txHash: '0x' + Math.random().toString(16).substr(2, 64),
                    gasUsed: Math.floor(Math.random() * 100000) + 21000,
                    data: { method, params }
                });
            }, 1000 + Math.random() * 2000);
        });
    }
    
    async executeSmartContractCall(method, params) {
        try {
            // Verificar si tenemos smart contracts inicializados
            if (this.smartContracts && this.smartContracts.tandaManager && this.smartContracts.tandaManager.methods) {
                // Usar smart contracts reales si están disponibles
                return await this.smartContracts.tandaManager.methods[method](method, params);
            } else {
                // Usar simulación para demo
                return await this.mockSmartContractCall(method, params);
            }
        } catch (error) {
            console.error('Error in smart contract call:', error);
            // Fallback a simulación en caso de error
            return await this.mockSmartContractCall(method, params);
        }
    }
    
    setupEventListeners() {
        // Escuchar eventos de la blockchain (mock)
        this.setupBlockchainEventListeners();
        
        // Actualizar UI cada 30 segundos
        setInterval(() => {
            this.updateUI();
        }, 30000);
    }
    
    setupBlockchainEventListeners() {
        // Mock de eventos de blockchain
        console.log('🎧 Blockchain event listeners setup complete');
    }
    
    updateUI() {
        // Actualizar saldos
        document.getElementById('availableBalance').textContent = 
            `L. ${this.walletData.availableBalance.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
        
        document.getElementById('lockedBalance').textContent = 
            `L. ${this.walletData.lockedBalance.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
        
        document.getElementById('ltdTokens').textContent = 
            `${this.walletData.ltdTokens} LTD`;
    }
    
    async loadTransactionHistory() {
        try {
            const response = await fetch(`${this.API_BASE}/api/wallet/${this.currentUser.id}/transactions`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            let transactions = [];
            
            if (response.ok) {
                const result = await response.json();
                transactions = result.data || [];
            } else {
                // Datos mock para demo
                transactions = [
                    {
                        id: 'tx_001',
                        type: this.TRANSACTION_TYPES.DEPOSIT,
                        amount: 2500.00,
                        date: new Date().toISOString(),
                        description: 'Depósito inicial',
                        status: 'completed'
                    },
                    {
                        id: 'tx_002',
                        type: this.TRANSACTION_TYPES.LOCK_FOR_TANDA,
                        amount: -2500.00,
                        date: new Date(Date.now() - 86400000).toISOString(),
                        description: 'Fondos bloqueados para Tanda Emprendedores',
                        status: 'completed'
                    },
                    {
                        id: 'tx_003',
                        type: this.TRANSACTION_TYPES.LTD_MINT,
                        amount: 50,
                        date: new Date(Date.now() - 172800000).toISOString(),
                        description: 'Recompensa LTD por participación',
                        status: 'completed'
                    }
                ];
            }
            
            this.renderTransactions(transactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }
    
    renderTransactions(transactions) {
        const container = document.getElementById('transactionsList');
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                    <p>No hay transacciones aún</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = transactions.map(tx => {
            const isPositive = tx.amount > 0;
            const iconClass = this.getTransactionIcon(tx.type);
            const formattedDate = new Date(tx.date).toLocaleDateString('es-HN');
            
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon ${iconClass}">
                            ${this.getTransactionEmoji(tx.type)}
                        </div>
                        <div class="transaction-details">
                            <h4>${tx.description}</h4>
                            <p>${formattedDate} • ${tx.status}</p>
                        </div>
                    </div>
                    <div class="transaction-amount ${isPositive ? 'amount-positive' : 'amount-negative'}">
                        ${isPositive ? '+' : ''}${tx.type === this.TRANSACTION_TYPES.LTD_MINT ? 
                            `${tx.amount} LTD` : 
                            `L. ${Math.abs(tx.amount).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getTransactionIcon(type) {
        const iconMap = {
            [this.TRANSACTION_TYPES.DEPOSIT]: 'tx-deposit',
            [this.TRANSACTION_TYPES.WITHDRAW]: 'tx-withdraw',
            [this.TRANSACTION_TYPES.LOCK_FOR_TANDA]: 'tx-locked',
            [this.TRANSACTION_TYPES.UNLOCK_TANDA]: 'tx-deposit',
            [this.TRANSACTION_TYPES.LTD_MINT]: 'tx-deposit',
            [this.TRANSACTION_TYPES.LTD_BURN]: 'tx-withdraw',
            [this.TRANSACTION_TYPES.COMMISSION_PAYMENT]: 'tx-deposit'
        };
        return iconMap[type] || 'tx-deposit';
    }
    
    getTransactionEmoji(type) {
        const emojiMap = {
            [this.TRANSACTION_TYPES.DEPOSIT]: '💰',
            [this.TRANSACTION_TYPES.WITHDRAW]: '💸',
            [this.TRANSACTION_TYPES.LOCK_FOR_TANDA]: '🔒',
            [this.TRANSACTION_TYPES.UNLOCK_TANDA]: '🔓',
            [this.TRANSACTION_TYPES.LTD_MINT]: '🪙',
            [this.TRANSACTION_TYPES.LTD_BURN]: '🔥',
            [this.TRANSACTION_TYPES.COMMISSION_PAYMENT]: '💼'
        };
        return emojiMap[type] || '💳';
    }
    
    /**
     * FUNCIONES PRINCIPALES DE LA WALLET
     */
    
    async depositFunds() {
        try {
            const amount = await this.showDepositModal();
            if (!amount) return;
            
            const validation = this.validateDeposit(amount);
            if (!validation.valid) {
                this.showNotification(validation.message, 'error');
                return;
            }
            
            // Ejecutar depósito con smart contract
            this.showNotification('💳 Procesando depósito...', 'info');
            
            const txResult = await this.executeSmartContractCall('lockFunds', {
                type: 'deposit',
                amount, 
                user: this.currentUser.id
            });
            
            if (txResult.success) {
                // Actualizar saldos localmente
                this.walletData.availableBalance += amount;
                
                // Registrar transacción
                await this.recordTransaction({
                    type: this.TRANSACTION_TYPES.DEPOSIT,
                    amount: amount,
                    description: `Depósito de L. ${amount.toLocaleString('es-HN')}`,
                    txHash: txResult.txHash
                });
                
                this.updateUI();
                this.loadTransactionHistory();
                this.showNotification(`✅ Depósito de L. ${amount.toLocaleString('es-HN')} completado exitosamente`, 'success');
            } else {
                throw new Error('Error en la transacción blockchain');
            }
            
        } catch (error) {
            console.error('Error in deposit:', error);
            this.showNotification('❌ Error procesando depósito: ' + error.message, 'error');
        }
    }
    
    async withdrawFunds() {
        try {
            const amount = await this.showWithdrawModal();
            if (!amount) return;
            
            const validation = await this.validateWithdrawal(amount);
            if (!validation.valid) {
                this.showNotification(validation.message, 'error');
                return;
            }
            
            // Verificar restricciones con smart contract
            const restrictionCheck = await this.executeSmartContractCall('validateWithdrawal', {
                amount, 
                user: this.currentUser.id,
                dailyWithdrawn: this.walletData.dailyWithdrawn 
            });
            
            if (!restrictionCheck.success) {
                this.showNotification('🚫 Retiro bloqueado por restricciones de seguridad', 'warning');
                return;
            }
            
            // Verificar seguridad adicional
            const securityCheck = await this.verifyTransactionSecurity({
                type: this.TRANSACTION_TYPES.WITHDRAW,
                amount: amount,
                timestamp: new Date().toISOString()
            });
            
            if (!securityCheck.approved) {
                if (securityCheck.requiresVerification) {
                    const verificationResult = await this.requestEnhancedVerification(securityCheck.reason);
                    if (!verificationResult.approved) {
                        this.showNotification(`❌ ${securityCheck.reason}`, 'error');
                        return;
                    }
                } else {
                    this.showNotification(`🚫 ${securityCheck.reason}`, 'warning');
                    return;
                }
            }
            
            // Ejecutar retiro
            this.showNotification('💸 Procesando retiro...', 'info');
            
            const txResult = await this.executeSmartContractCall('unlockFunds', {
                type: 'withdraw',
                amount, 
                user: this.currentUser.id
            });
            
            if (txResult.success) {
                // Actualizar saldos localmente
                this.walletData.availableBalance -= amount;
                this.walletData.dailyWithdrawn += amount;
                this.walletData.lastWithdrawalDate = new Date().toISOString();
                
                // Registrar transacción
                await this.recordTransaction({
                    type: this.TRANSACTION_TYPES.WITHDRAW,
                    amount: -amount,
                    description: `Retiro de L. ${amount.toLocaleString('es-HN')}`,
                    txHash: txResult.txHash
                });
                
                this.updateUI();
                this.loadTransactionHistory();
                this.showNotification(`✅ Retiro de L. ${amount.toLocaleString('es-HN')} completado exitosamente`, 'success');
            } else {
                throw new Error('Error en la transacción blockchain');
            }
            
        } catch (error) {
            console.error('Error in withdrawal:', error);
            this.showNotification('❌ Error procesando retiro: ' + error.message, 'error');
        }
    }
    
    async lockFunds() {
        try {
            const lockData = await this.showLockFundsModal();
            if (!lockData) return;
            
            const validation = this.validateLockFunds(lockData.amount);
            if (!validation.valid) {
                this.showNotification(validation.message, 'error');
                return;
            }
            
            // Ejecutar bloqueo con smart contract
            this.showNotification('🔐 Bloqueando fondos para tanda...', 'info');
            
            const txResult = await this.executeSmartContractCall('lockFunds', {
                type: 'lock_for_tanda',
                amount: lockData.amount, 
                user: this.currentUser.id,
                tandaId: lockData.tandaId,
                duration: lockData.duration
            });
            
            if (txResult.success) {
                // Actualizar saldos localmente
                this.walletData.availableBalance -= lockData.amount;
                this.walletData.lockedBalance += lockData.amount;
                
                // Registrar transacción
                await this.recordTransaction({
                    type: this.TRANSACTION_TYPES.LOCK_FOR_TANDA,
                    amount: -lockData.amount,
                    description: `Fondos bloqueados para tanda ${lockData.tandaId}`,
                    txHash: txResult.txHash
                });
                
                this.updateUI();
                this.loadTransactionHistory();
                this.showNotification(`🔒 L. ${lockData.amount.toLocaleString('es-HN')} bloqueados exitosamente para la tanda`, 'success');
            } else {
                throw new Error('Error en la transacción blockchain');
            }
            
        } catch (error) {
            console.error('Error locking funds:', error);
            this.showNotification('❌ Error bloqueando fondos: ' + error.message, 'error');
        }
    }
    
    /**
     * VALIDACIONES Y RESTRICCIONES
     */
    
    validateDeposit(amount) {
        if (!amount || amount <= 0) {
            return { valid: false, message: 'Monto inválido' };
        }
        
        if (amount > 100000) {
            return { valid: false, message: 'Monto máximo por depósito: L. 100,000' };
        }
        
        return { valid: true };
    }
    
    async validateWithdrawal(amount) {
        if (!amount || amount <= 0) {
            return { valid: false, message: 'Monto inválido' };
        }
        
        if (amount > this.walletData.availableBalance) {
            return { valid: false, message: 'Saldo insuficiente' };
        }
        
        // Verificar límite diario
        const today = new Date().toDateString();
        const lastWithdrawal = this.walletData.lastWithdrawalDate ? 
            new Date(this.walletData.lastWithdrawalDate).toDateString() : null;
        
        let dailyWithdrawn = 0;
        if (lastWithdrawal === today) {
            dailyWithdrawn = this.walletData.dailyWithdrawn;
        }
        
        if (dailyWithdrawn + amount > this.SECURITY_LIMITS.MAX_DAILY_WITHDRAWAL) {
            return { 
                valid: false, 
                message: `Límite diario excedido. Máximo: L. ${this.SECURITY_LIMITS.MAX_DAILY_WITHDRAWAL.toLocaleString('es-HN')}` 
            };
        }
        
        // Verificar límite por transacción
        if (amount > this.SECURITY_LIMITS.MAX_SINGLE_WITHDRAWAL) {
            return { 
                valid: false, 
                message: `Retiro máximo sin verificación adicional: L. ${this.SECURITY_LIMITS.MAX_SINGLE_WITHDRAWAL.toLocaleString('es-HN')}` 
            };
        }
        
        // Verificar tandas activas
        if (this.walletData.activeTandas.length > 0 && amount > 1000) {
            return { 
                valid: false, 
                message: 'Retiros limitados durante tandas activas. Máximo: L. 1,000' 
            };
        }
        
        return { valid: true };
    }
    
    validateLockFunds(amount) {
        if (!amount || amount <= 0) {
            return { valid: false, message: 'Monto inválido' };
        }
        
        if (amount > this.walletData.availableBalance) {
            return { valid: false, message: 'Saldo insuficiente' };
        }
        
        if (amount < 500) {
            return { valid: false, message: 'Monto mínimo para bloquear: L. 500' };
        }
        
        return { valid: true };
    }
    
    /**
     * INTEGRACIÓN CON SISTEMA DE SEGURIDAD
     */
    
    async integrateSecuritySystem() {
        try {
            // Verificar estado de seguridad del usuario
            const securityStatus = await this.checkUserSecurityStatus();
            
            // Aplicar restricciones basadas en el estado de seguridad
            if (securityStatus.frozen) {
                this.freezeWallet('Cuenta congelada por actividad sospechosa');
                return;
            }
            
            if (securityStatus.restricted) {
                this.applySecurityRestrictions(securityStatus.restrictions);
            }
            
            // Integrar con el sistema de advertencias de grupos
            if (window.groupSecurityAdvisor) {
                this.securityAdvisor = window.groupSecurityAdvisor;
                this.setupSecurityEventListeners();
            }
            
            console.log('🛡️ Security system integration complete');
        } catch (error) {
            console.error('Error integrating security system:', error);
        }
    }
    
    async checkUserSecurityStatus() {
        try {
            const response = await fetch(`${this.API_BASE}/api/security/user-status/${this.currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            } else {
                // Mock data for demo
                return {
                    frozen: false,
                    restricted: false,
                    restrictions: [],
                    riskLevel: 'low',
                    lastSecurityCheck: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Error checking security status:', error);
            return { frozen: false, restricted: false, restrictions: [] };
        }
    }
    
    freezeWallet(reason) {
        this.walletData.state = this.WALLET_STATES.FROZEN;
        
        // Deshabilitar todas las acciones
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        
        // Mostrar indicador de congelamiento
        const header = document.querySelector('.wallet-header');
        if (header) {
            const frozenBanner = document.createElement('div');
            frozenBanner.className = 'frozen-banner';
            frozenBanner.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.9); color: white; padding: 12px; text-align: center; font-weight: 600;">
                    🧊 WALLET CONGELADA: ${reason}
                </div>
            `;
            header.appendChild(frozenBanner);
        }
        
        this.showNotification(`🧊 Wallet congelada: ${reason}`, 'error');
    }
    
    applySecurityRestrictions(restrictions) {
        restrictions.forEach(restriction => {
            switch (restriction.type) {
                case 'daily_limit_reduced':
                    this.SECURITY_LIMITS.MAX_DAILY_WITHDRAWAL *= 0.5;
                    break;
                case 'single_withdrawal_limit':
                    this.SECURITY_LIMITS.MAX_SINGLE_WITHDRAWAL *= 0.3;
                    break;
                case 'enhanced_verification':
                    this.SECURITY_LIMITS.MIN_VERIFICATION_AMOUNT = 100;
                    break;
            }
        });
        
        this.updateSecurityIndicators();
    }
    
    updateSecurityIndicators() {
        const restrictionsContainer = document.querySelector('.smart-restrictions');
        if (restrictionsContainer) {
            // Agregar indicadores de restricciones activas
            const securityBanner = document.createElement('div');
            securityBanner.className = 'security-banner';
            securityBanner.innerHTML = `
                <div class="restriction-item">
                    <div class="restriction-icon">🔒</div>
                    <div class="restriction-text">
                        Límites de seguridad reducidos debido a actividad de riesgo detectada
                    </div>
                </div>
            `;
            restrictionsContainer.appendChild(securityBanner);
        }
    }
    
    setupSecurityEventListeners() {
        // Escuchar eventos del sistema de seguridad
        document.addEventListener('securityAlertTriggered', (event) => {
            this.handleSecurityAlert(event.detail);
        });
        
        document.addEventListener('userRiskLevelChanged', (event) => {
            this.handleRiskLevelChange(event.detail);
        });
    }
    
    handleSecurityAlert(alertData) {
        console.log('🚨 Security alert received:', alertData);
        
        if (alertData.severity === 'critical') {
            this.freezeWallet(alertData.reason);
        } else if (alertData.severity === 'high') {
            this.applyTemporaryRestrictions();
        }
        
        this.showNotification(`🚨 Alerta de seguridad: ${alertData.message}`, 'warning');
    }
    
    handleRiskLevelChange(riskData) {
        console.log('📊 Risk level changed:', riskData);
        
        switch (riskData.level) {
            case 'high':
                this.SECURITY_LIMITS.MAX_SINGLE_WITHDRAWAL = 1000;
                break;
            case 'medium':
                this.SECURITY_LIMITS.MAX_SINGLE_WITHDRAWAL = 2500;
                break;
            default:
                this.SECURITY_LIMITS.MAX_SINGLE_WITHDRAWAL = 5000;
        }
        
        this.updateUI();
    }
    
    applyTemporaryRestrictions() {
        // Aplicar restricciones temporales (24 horas)
        const originalLimits = { ...this.SECURITY_LIMITS };
        
        this.SECURITY_LIMITS.MAX_DAILY_WITHDRAWAL *= 0.3;
        this.SECURITY_LIMITS.MAX_SINGLE_WITHDRAWAL *= 0.2;
        
        // Remover restricciones después de 24 horas
        setTimeout(() => {
            this.SECURITY_LIMITS = originalLimits;
            this.showNotification('🔓 Restricciones temporales removidas', 'info');
        }, 24 * 60 * 60 * 1000);
        
        this.showNotification('⏰ Restricciones temporales aplicadas por 24 horas', 'warning');
    }
    
    /**
     * FUNCIONES DE VERIFICACIÓN ANTI-FRAUDE
     */
    
    async verifyTransactionSecurity(transactionData) {
        try {
            // Verificar patrones sospechosos
            const suspiciousPatterns = await this.detectSuspiciousPatterns(transactionData);
            
            if (suspiciousPatterns.length > 0) {
                return {
                    approved: false,
                    reason: 'Patrones sospechosos detectados',
                    patterns: suspiciousPatterns
                };
            }
            
            // Verificar límites dinámicos basados en comportamiento
            const dynamicLimits = await this.calculateDynamicLimits();
            
            if (transactionData.amount > dynamicLimits.maxAmount) {
                return {
                    approved: false,
                    reason: `Excede límite dinámico: L. ${dynamicLimits.maxAmount.toLocaleString('es-HN')}`,
                    requiresVerification: true
                };
            }
            
            return { approved: true };
            
        } catch (error) {
            console.error('Error in security verification:', error);
            return { approved: false, reason: 'Error en verificación de seguridad' };
        }
    }
    
    async detectSuspiciousPatterns(transactionData) {
        const patterns = [];
        
        // Patrón 1: Múltiples transacciones en corto tiempo
        const recentTransactions = await this.getRecentTransactions(10);
        const last5Minutes = recentTransactions.filter(tx => 
            Date.now() - new Date(tx.date).getTime() < 5 * 60 * 1000
        );
        
        if (last5Minutes.length > 3) {
            patterns.push({
                type: 'rapid_transactions',
                description: 'Múltiples transacciones en corto tiempo',
                risk: 'medium'
            });
        }
        
        // Patrón 2: Montos redondos sospechosos
        if (transactionData.amount % 1000 === 0 && transactionData.amount > 5000) {
            patterns.push({
                type: 'round_amounts',
                description: 'Montos redondos sospechosos',
                risk: 'low'
            });
        }
        
        // Patrón 3: Horarios inusuales
        const hour = new Date().getHours();
        if (hour < 6 || hour > 23) {
            patterns.push({
                type: 'unusual_hours',
                description: 'Transacción en horario inusual',
                risk: 'medium'
            });
        }
        
        return patterns;
    }
    
    async calculateDynamicLimits() {
        // Calcular límites basados en historial del usuario
        const userHistory = await this.getUserTransactionHistory();
        
        const avgTransactionAmount = userHistory.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / userHistory.length;
        const maxHistoricalAmount = Math.max(...userHistory.map(tx => Math.abs(tx.amount)));
        
        return {
            maxAmount: Math.min(
                maxHistoricalAmount * 2, // Máximo el doble de la transacción más grande
                avgTransactionAmount * 10, // O 10 veces el promedio
                this.SECURITY_LIMITS.MAX_SINGLE_WITHDRAWAL // Nunca exceder límite base
            )
        };
    }
    
    async getUserTransactionHistory() {
        // Mock data - en producción vendría de la API
        return [
            { amount: 500, date: new Date() },
            { amount: 1000, date: new Date() },
            { amount: 750, date: new Date() }
        ];
    }
    
    async getRecentTransactions(limit) {
        // Mock data - en producción vendría de la API
        return [];
    }
    
    async requestEnhancedVerification(reason) {
        return new Promise((resolve) => {
            const modal = this.createEnhancedVerificationModal(reason);
            
            const verifyBtn = modal.querySelector('#verifyBtn');
            const cancelBtn = modal.querySelector('#cancelBtn');
            const codeInput = modal.querySelector('#verificationCode');
            
            // Generar código de verificación mock
            const mockCode = Math.floor(100000 + Math.random() * 900000);
            console.log('🔐 Código de verificación (DEMO):', mockCode);
            
            // Simular envío de SMS/Email
            setTimeout(() => {
                this.showNotification(`📱 Código enviado por SMS: ${mockCode}`, 'info');
            }, 1000);
            
            verifyBtn.onclick = () => {
                const enteredCode = codeInput.value;
                
                if (enteredCode == mockCode) {
                    modal.remove();
                    resolve({ approved: true });
                } else {
                    this.showNotification('❌ Código incorrecto', 'error');
                    codeInput.focus();
                }
            };
            
            cancelBtn.onclick = () => {
                modal.remove();
                resolve({ approved: false });
            };
            
            document.body.appendChild(modal);
            codeInput.focus();
        });
    }
    
    createEnhancedVerificationModal(reason) {
        const modal = document.createElement('div');
        modal.className = 'wallet-modal verification-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔐 Verificación de Seguridad</h2>
                    <p>Se requiere verificación adicional</p>
                </div>
                <div class="modal-body">
                    <div class="verification-reason">
                        <div class="alert-box">
                            <div class="alert-icon">⚠️</div>
                            <div class="alert-text">
                                <strong>Motivo:</strong> ${reason}
                            </div>
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="verificationCode">Código de Verificación</label>
                        <input type="text" id="verificationCode" placeholder="Ingresa el código de 6 dígitos" maxlength="6">
                        <small>Se ha enviado un código a tu teléfono registrado</small>
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="cancelBtn" class="btn-secondary">Cancelar</button>
                    <button id="verifyBtn" class="btn-primary">Verificar</button>
                </div>
            </div>
        `;
        
        // Agregar estilos específicos para verificación
        const style = document.createElement('style');
        style.textContent = `
            .verification-modal .alert-box {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 8px;
                margin-bottom: 20px;
            }
            
            .verification-modal .alert-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            
            .verification-modal .alert-text {
                color: #92400e;
                font-size: 14px;
            }
            
            .verification-modal .input-group small {
                color: #64748b;
                font-size: 12px;
                margin-top: 4px;
            }
            
            .verification-modal #verificationCode {
                text-align: center;
                font-size: 18px;
                font-weight: 600;
                letter-spacing: 2px;
            }
        `;
        
        modal.appendChild(style);
        this.addModalStyles(modal);
        
        return modal;
    }
    
    /**
     * MODALES DE INTERACCIÓN
     */
    
    showDepositModal() {
        return new Promise((resolve) => {
            const modal = this.createAmountModal({
                title: '💳 Depositar Fondos',
                subtitle: 'Ingresa el monto que deseas depositar',
                placeholder: 'Monto en Lempiras',
                confirmText: 'Depositar',
                cancelText: 'Cancelar'
            });
            
            const confirmBtn = modal.querySelector('#confirmBtn');
            const cancelBtn = modal.querySelector('#cancelBtn');
            const amountInput = modal.querySelector('#amountInput');
            
            confirmBtn.onclick = () => {
                const amount = parseFloat(amountInput.value);
                modal.remove();
                resolve(amount);
            };
            
            cancelBtn.onclick = () => {
                modal.remove();
                resolve(null);
            };
            
            document.body.appendChild(modal);
            amountInput.focus();
        });
    }
    
    showWithdrawModal() {
        return new Promise((resolve) => {
            const modal = this.createAmountModal({
                title: '💸 Retirar Fondos',
                subtitle: `Saldo disponible: L. ${this.walletData.availableBalance.toLocaleString('es-HN')}`,
                placeholder: 'Monto a retirar',
                confirmText: 'Retirar',
                cancelText: 'Cancelar'
            });
            
            const confirmBtn = modal.querySelector('#confirmBtn');
            const cancelBtn = modal.querySelector('#cancelBtn');
            const amountInput = modal.querySelector('#amountInput');
            
            confirmBtn.onclick = () => {
                const amount = parseFloat(amountInput.value);
                modal.remove();
                resolve(amount);
            };
            
            cancelBtn.onclick = () => {
                modal.remove();
                resolve(null);
            };
            
            document.body.appendChild(modal);
            amountInput.focus();
        });
    }
    
    showLockFundsModal() {
        return new Promise((resolve) => {
            const modal = this.createLockFundsModal();
            
            const confirmBtn = modal.querySelector('#confirmBtn');
            const cancelBtn = modal.querySelector('#cancelBtn');
            const amountInput = modal.querySelector('#amountInput');
            const tandaSelect = modal.querySelector('#tandaSelect');
            const durationSelect = modal.querySelector('#durationSelect');
            
            confirmBtn.onclick = () => {
                const amount = parseFloat(amountInput.value);
                const tandaId = tandaSelect.value;
                const duration = durationSelect.value;
                
                modal.remove();
                resolve({ amount, tandaId, duration });
            };
            
            cancelBtn.onclick = () => {
                modal.remove();
                resolve(null);
            };
            
            document.body.appendChild(modal);
            amountInput.focus();
        });
    }
    
    createAmountModal(config) {
        const modal = document.createElement('div');
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${config.title}</h2>
                    <p>${config.subtitle}</p>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label for="amountInput">Monto (L.)</label>
                        <input type="number" id="amountInput" placeholder="${config.placeholder}" min="0" step="0.01">
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="cancelBtn" class="btn-secondary">${config.cancelText}</button>
                    <button id="confirmBtn" class="btn-primary">${config.confirmText}</button>
                </div>
            </div>
        `;
        
        // Agregar estilos del modal
        this.addModalStyles(modal);
        
        return modal;
    }
    
    createLockFundsModal() {
        const modal = document.createElement('div');
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔐 Bloquear Fondos para Tanda</h2>
                    <p>Los fondos quedarán bloqueados hasta completar la tanda</p>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label for="amountInput">Monto (L.)</label>
                        <input type="number" id="amountInput" placeholder="Monto a bloquear" min="500" step="0.01">
                    </div>
                    <div class="input-group">
                        <label for="tandaSelect">Tanda</label>
                        <select id="tandaSelect">
                            <option value="new_tanda">Crear nueva tanda</option>
                            <option value="tanda_emprendedores">Emprendedores VIP</option>
                            <option value="tanda_ahorro">Ahorro Familiar</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="durationSelect">Duración</label>
                        <select id="durationSelect">
                            <option value="30">30 días</option>
                            <option value="60">60 días</option>
                            <option value="90">90 días</option>
                            <option value="180">180 días</option>
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="cancelBtn" class="btn-secondary">Cancelar</button>
                    <button id="confirmBtn" class="btn-primary">Bloquear Fondos</button>
                </div>
            </div>
        `;
        
        // Agregar estilos del modal
        this.addModalStyles(modal);
        
        return modal;
    }
    
    addModalStyles(modal) {
        const style = document.createElement('style');
        style.textContent = `
            .wallet-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            }
            
            .wallet-modal .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(10px);
            }
            
            .wallet-modal .modal-content {
                position: relative;
                background: white;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                max-width: 400px;
                width: 90%;
                animation: slideIn 0.4s ease-out;
            }
            
            .wallet-modal .modal-header {
                padding: 24px 24px 16px;
                text-align: center;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .wallet-modal .modal-header h2 {
                font-size: 24px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 8px;
            }
            
            .wallet-modal .modal-header p {
                font-size: 14px;
                color: #64748b;
            }
            
            .wallet-modal .modal-body {
                padding: 24px;
            }
            
            .wallet-modal .input-group {
                margin-bottom: 20px;
            }
            
            .wallet-modal .input-group label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 8px;
            }
            
            .wallet-modal .input-group input,
            .wallet-modal .input-group select {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.2s;
            }
            
            .wallet-modal .input-group input:focus,
            .wallet-modal .input-group select:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }
            
            .wallet-modal .modal-actions {
                padding: 16px 24px 24px;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            
            .wallet-modal .modal-actions button {
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                border: none;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-50px) scale(0.95);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        
        modal.appendChild(style);
    }
    
    async recordTransaction(transactionData) {
        try {
            const response = await fetch(`${this.API_BASE}/api/wallet/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    ...transactionData,
                    userId: this.currentUser.id,
                    walletAddress: this.walletAddress,
                    timestamp: new Date().toISOString()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Transaction recorded:', result.data);
            } else {
                console.warn('⚠️ Failed to record transaction:', result.message);
            }
        } catch (error) {
            console.error('❌ Error recording transaction:', error);
        }
    }
    
    getAuthToken() {
        const authData = localStorage.getItem('laTandaWeb3Auth');
        return authData ? JSON.parse(authData).auth_token : null;
    }
    
    showNotification(message, type = 'info') {
        // Usar el sistema de notificaciones existente
        if (window.auth && window.auth.showNotification) {
            window.auth.showNotification(message, type);
        } else {
            // Crear notificación simple
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
                z-index: 10001;
                font-weight: 500;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
    }
}

// Crear instancia global
window.tandaWallet = new TandaWallet();

// Funciones globales para botones
window.depositFunds = () => window.tandaWallet.depositFunds();
window.withdrawFunds = () => window.tandaWallet.withdrawFunds();
window.lockFunds = () => window.tandaWallet.lockFunds();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TandaWallet;
}