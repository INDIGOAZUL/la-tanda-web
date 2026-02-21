/* ================================
   🌐 MY WALLET - LA TANDA WEB3 ECOSYSTEM
   v=20250927025 - Fixed bank account data structure for admin panel compatibility
   ================================ */

class LaTandaWallet {
    constructor() {
        this.apiBase = 'https://latanda.online';
        this.userSession = this.loadUserSession();
        this.balances = {
            USD: 0.00,
            HNL: 0.00
        };
        this.exchangeRates = {
            USD_HNL: 24.85,
            HNL_USD: 0.0402
        };
        this.selectedBank = null;
        this.transactionHistory = [];
        
        // Pagination state
        this.currentPage = 1;
        this.totalPages = 1;
        this.paginationData = { total: 0, limit: 50, offset: 0, has_more: false };
        
        this.qrCodeInstance = null;
        this.notificationHistory = JSON.parse(localStorage.getItem('notificationHistory') || '[]');

        // Wallet settings
        // ============================================
        // 🎚️ FEATURE FLAGS SYSTEM (Phase 2 Implementation)
        // ============================================
        this.featureFlags = this.initializeFeatureFlags();

        // ============================================
        // 🔍 USER VALIDATION SYSTEM (Debouncing & API)
        // ============================================
        this.validationTimeout = null;
        this.validationAbortController = null;

        this.walletSettings = {
            balanceVisible: true, // Always start with balance visible
            currencyPreference: localStorage.getItem('currencyPreference') || 'USD',
            notificationsEnabled: JSON.parse(localStorage.getItem('notificationsEnabled') || 'true'),
            settingsDropdownOpen: false,
            // Security settings
            pinEnabled: JSON.parse(localStorage.getItem('pinEnabled') || 'false'),
            pinCode: localStorage.getItem('pinCode') || null,
            autoLockTime: parseInt(localStorage.getItem('autoLockTime') || '900000'), // 15 min default
            lastActivity: Date.now(),
            isLocked: false,
            // PIN rate limiting
            pinAttempts: 0,
            pinLockoutUntil: 0,
            maxPinAttempts: 3,
            pinLockoutDuration: 30000, // 30 seconds
            // Privacy settings
            defaultBalanceVisibility: JSON.parse(localStorage.getItem('defaultBalanceVisibility') || 'true'),
            transactionPrivacy: localStorage.getItem('transactionPrivacy') || 'normal',
            analyticsOptOut: JSON.parse(localStorage.getItem('analyticsOptOut') || 'false'),
            incognitoMode: false,
            screenshotProtection: JSON.parse(localStorage.getItem('screenshotProtection') || 'false')
        };

        // Notification system
        this.notificationQueue = [];
        this.notificationHistory = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
        this.notificationSettings = {
            transactions: JSON.parse(localStorage.getItem('notifyTransactions') || 'true'),
            deposits: JSON.parse(localStorage.getItem('notifyDeposits') || 'true'),
            lowBalance: JSON.parse(localStorage.getItem('notifyLowBalance') || 'true'),
            security: JSON.parse(localStorage.getItem('notifySecurity') || 'true'),
            soundEnabled: JSON.parse(localStorage.getItem('notificationSound') || 'true'),
            lowBalanceThreshold: parseFloat(localStorage.getItem('lowBalanceThreshold') || '10.0')
        };

        this.init();
    }


    // XSS prevention helper (v3.98.0)
    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = String(text != null ? text : "");
        return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    init() {

        try {
            this.setupEventListeners();
        } catch (error) {
        }

        try {
            this.loadWalletData();
        } catch (error) {
        }

        try {
            this.initializeTranslations();
        } catch (error) {
        }

        try {
            this.loadTransactionHistory();
        } catch (error) {
        }

        // Auto-refresh disabled - users can refresh manually if needed
        // setInterval(() => this.refreshWallet(), 30000);

        // Security monitoring
        try {
            this.setupSecurityMonitoring();
        } catch (error) {
        }

        try {
            this.setupAutoLock();
        } catch (error) {
        }

        // Initialize simulated internal users database
        this.initializeInternalUsers();

    }

    setupEventListeners() {
        // Close settings dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const settingsDropdown = document.getElementById('walletSettingsDropdown');
            const settingsBtn = document.querySelector('.settings-btn');

            if (settingsDropdown && settingsBtn &&
                !settingsDropdown.contains(e.target) &&
                !settingsBtn.contains(e.target)) {
                this.closeWalletSettings();
            }
        });

        // Pagination controls
        document.getElementById('prevPage')?.addEventListener('click', () => this.prevPage());
        document.getElementById('nextPage')?.addEventListener('click', () => this.nextPage());
        document.getElementById('jumpPageBtn')?.addEventListener('click', () => {
            const input = document.getElementById('jumpToPage');
            const page = parseInt(input?.value);
            if (page) this.loadPage(page);
        });
        document.getElementById('jumpToPage')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const page = parseInt(e.target.value);
                if (page) this.loadPage(page);
            }
        });

        // Form submissions
        this.setupFormHandlers();

        // Modal close handlers
        this.setupModalHandlers();

        // Real-time balance updates
        this.setupBalanceCalculations();

        // Initialize QR code for receiving
        this.initializeQRCode();

        // Initialize notification center
        this.addInitialNotifications();
        this.updateNotificationBadge();

        // Initialize session timeout (auto-logout after 15 min inactivity)
        try {
            this.initSessionTimeout();
        } catch (error) {
        }

        // Initialize transaction history
        // Transaction history is already loaded in init() - no need to duplicate


        // Setup mobile balance cards interactions
        this.setupMobileBalanceCards();

        // Close notification center when clicking outside
        document.addEventListener('click', (e) => {
            const notificationCenter = document.querySelector('.notification-center');
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown && notificationCenter &&
                !notificationCenter.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        // Delegated event listeners for transaction actions (v3.98.0 - XSS fix)
        document.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;
            const action = actionEl.dataset.action;
            const txId = actionEl.dataset.txId;
            if (!txId) return;
            e.stopPropagation();
            switch (action) {
                case 'show-details':
                case 'show-details-stop':
                    if (typeof showTransactionDetails === 'function') {
                        showTransactionDetails(txId);
                    } else if (walletInstance) {
                        walletInstance.showTransactionDetails(txId);
                    }
                    break;
                case 'cancel-tx':
                    if (walletInstance) walletInstance.cancelTransaction(txId);
                    break;
                case 'appeal-tx':
                    if (walletInstance) walletInstance.appealTransaction(txId);
                    break;
                case 'resubmit-receipt': {
                    if (!walletInstance) break;
                    const tx = walletInstance.transactionHistory.find(t => t.id === txId);
                    if (tx) {
                        walletInstance.showAdminRequestModal(tx, {message: tx.admin_message || 'Se requiere nueva imagen'});
                    }
                    break;
                }
                case 'resubmit-receipt-simple':
                    if (walletInstance) walletInstance.resubmitReceipt(txId);
                    break;
                case 'show-my-details':
                    if (walletInstance) walletInstance.showMyTransactionDetails(txId);
                    break;
                case 'cancel-my-deposit':
                case 'cancel-deposit-modal':
                    if (walletInstance) walletInstance.cancelMyDeposit(txId);
                    if (action.endsWith('-modal')) actionEl.closest('.modal')?.remove();
                    break;
                case 'resubmit-my-receipt':
                case 'resubmit-receipt-modal':
                    if (walletInstance) walletInstance.resubmitMyReceipt(txId);
                    if (action.endsWith('-modal')) actionEl.closest('.modal')?.remove();
                    break;
                case 'cancel-my-withdrawal':
                    if (walletInstance) walletInstance.cancelMyWithdrawal(txId);
                    break;
                case 'show-withdrawal-receipt':
                    if (walletInstance) walletInstance.showWithdrawalReceipt(txId);
                    break;
                case 'retry-tx':
                case 'retry-tx-modal':
                    if (walletInstance) walletInstance.retryTransaction(txId);
                    if (action.endsWith('-modal')) actionEl.closest('.modal')?.remove();
                    break;
                case 'contact-support-modal':
                    if (walletInstance) walletInstance.contactSupport(txId);
                    actionEl.closest('.modal')?.remove();
                    break;
                case 'download-receipt':
                    if (walletInstance) walletInstance.downloadReceipt(txId);
                    break;
                case 'cancel-user-tx':
                    if (walletInstance) walletInstance.cancelUserTransaction(txId);
                    break;
                case 'request-time-ext':
                    if (walletInstance) walletInstance.requestTimeExtension(txId);
                    break;
                case 'submit-appeal':
                    if (walletInstance) walletInstance.submitAppeal(txId);
                    break;
                case 'retry-failed-tx':
                    if (walletInstance) walletInstance.retryFailedTransaction(txId);
                    break;
                case 'upload-docs':
                    if (walletInstance) walletInstance.uploadAdditionalDocuments(txId);
                    break;
                case 'contact-support-tx':
                    if (walletInstance) walletInstance.contactSupportForTransaction(txId);
                    break;
                case 'upload-tanda-receipt-modal':
                    if (walletInstance) walletInstance.uploadTandaReceipt(txId);
                    actionEl.closest('.modal-overlay')?.remove();
                    break;
                case 'copy-receipt':
                    if (walletInstance) walletInstance.copyReceiptInfo(txId);
                    break;
                case 'print-receipt':
                    if (walletInstance) walletInstance.printReceipt(txId);
                    break;
            }
        });
    }

    setupFormHandlers() {
        // Send form
        const sendForm = document.getElementById('sendForm');
        if (sendForm) {
            sendForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processSendTransaction();
            });
        }

        // Withdraw form
        const withdrawForm = document.getElementById('withdrawForm');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processWithdrawal();
            });
        } else {
        }

        // BACKUP: Direct button listener
        const withdrawButton = document.getElementById('withdrawSubmitBtn');
        if (withdrawButton) {
            withdrawButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.processWithdrawal();
            });
        }

        // Amount input handlers for fee calculations
        const sendAmount = document.getElementById('sendAmount');
        const sendCurrency = document.getElementById('sendCurrency');

        if (sendAmount && sendCurrency) {
            [sendAmount, sendCurrency].forEach(element => {
                element.addEventListener('input', () => this.calculateSendFees());
            });
        }

        const withdrawAmount = document.getElementById('withdrawAmount');
        const withdrawCurrency = document.getElementById('withdrawCurrency');

        if (withdrawAmount && withdrawCurrency) {
            [withdrawAmount, withdrawCurrency].forEach(element => {
                element.addEventListener('input', () => this.calculateWithdrawalFees());
            });
        }

        // Receive amount changes for QR update
        const receiveAmount = document.getElementById('receiveAmount');
        const receiveCurrency = document.getElementById('receiveCurrency');

        if (receiveAmount && receiveCurrency) {
            [receiveAmount, receiveCurrency].forEach(element => {
                element.addEventListener('input', () => this.updateReceiveQR());
            });
        }

        // Real-time recipient validation
        const recipientEmail = document.getElementById('recipientEmail');
        if (recipientEmail) {
            recipientEmail.addEventListener('input', () => this.validateRecipientRealTime());
        }
    }

    setupModalHandlers() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupBalanceCalculations() {
        // Update total balance when individual balances change
        this.updateTotalBalance();
    }

    // ================================
    // 📱 MOBILE BALANCE CARDS
    // ================================

    setupMobileBalanceCards() {
        this.currentCardIndex = 0;
        this.cardVisibility = {
            usd: true,
            hnl: true,
            ltd: true
        };

        // Initialize balance updates
        this.updateBalanceDisplay();

        // Listen for resize events
        window.addEventListener('resize', () => {
            this.updateBalanceDisplay();
        });

        // Listen for page visibility changes to pause/resume updates
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Page became visible, restart balance updates if needed
                if (this.featureFlags.useApiBalances && this.userSession?.token) {
                    this.startRealTimeBalanceUpdates();
                    // Also refresh balances immediately
                    this.refreshBalances(false);
                }
            } else {
                // Page hidden, stop balance updates to save resources
                this.stopRealTimeBalanceUpdates();
            }
        });

        // Initialize currency conversion updates
        this.updateCurrencyConversions();
    }

    // Update balance display for single-page layout
    updateBalanceDisplay() {
        // Calculate total balance in USD (only real currencies)
        const totalUSD = this.balances.USD +
                        (this.balances.HNL * this.exchangeRates.HNL_USD);

        // Update main balance display
        const balanceElement = document.getElementById('totalBalance');
        if (balanceElement) {
            if (this.walletSettings.balanceVisible) {
                balanceElement.textContent = this.formatCurrency(totalUSD, 'USD');
            } else {
                balanceElement.textContent = '$****';
            }
        }

        // Update individual currency amounts
        this.updateCurrencyAmount('usdBalance', this.balances.USD, 'USD');
        this.updateCurrencyAmount('hnlBalance', this.balances.HNL, 'HNL');
        // LTD removed - this.updateCurrencyAmount('ltdBalance', 0, 'USD');

        // Update header balance summary if visible
        const headerBalance = document.querySelector('.header .balance-amount');
        if (headerBalance) {
            headerBalance.textContent = this.formatCurrency(totalUSD, 'USD');
        }
    }

    updateCurrencyAmount(elementId, amount, currency) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.formatCurrency(amount, currency);
        }
    }

    formatCurrency(amount, currency, showConversion = false) {
        if (!amount && amount !== 0) return 'Monto no disponible';
        if (!currency) currency = 'USD'; // Default fallback

        const formattedAmount = new Intl.NumberFormat('es-HN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Math.abs(amount));

        let mainDisplay;
        switch(currency) {
            case 'USD':
                mainDisplay = `${formattedAmount} USD`;
                break;
            case 'HNL':
                mainDisplay = `${formattedAmount} HNL`;
                break;
            default:
                mainDisplay = `${formattedAmount} ${currency}`;
        }

        // Show conversion if requested and different currency than main display
        if (showConversion && currency !== this.walletSettings.currencyPreference) {
            const convertedAmount = this.convertCurrency(Math.abs(amount), currency, this.walletSettings.currencyPreference);
            const convertedFormatted = new Intl.NumberFormat('es-HN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(convertedAmount);

            return `${mainDisplay} <span class="currency-conversion">(≈ ${convertedFormatted} ${this.walletSettings.currencyPreference})</span>`;
        }

        return mainDisplay;
    }

    // Load transaction history for the new layout
    async loadTransactionHistory() {
        try {

            // Try to load from API first, fallback to local data
            await this.fetchTransactionHistory();

            // Load Tandas transaction history
            await this.loadTandaTransactionHistory();

            // Update the UI
            this.updateTransactionHistory();

        } catch (error) {
            this.loadLocalTransactionHistory();
        }
    }

    async fetchTransactionHistory() {
        try {
            // Check if we're in local development
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            if (isLocal) {
                // Local mode: Load from localStorage if available
                this.loadLocalTransactionHistory();
                return;
            }

            // Production API call - use correct POST endpoint with user_id
            const userId = this.getCurrentUserId();

            const response = await this.apiCall('/api/user/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    limit: 50,
                    offset: 0
                })
            });

            if (response && response.success && response.data && response.data.transactions) {
                this.transactionHistory = response.data.transactions;

                // Capture pagination data
                if (response.data.pagination) {
                    this.paginationData = response.data.pagination;
                    this.totalPages = Math.ceil(response.data.pagination.total / response.data.pagination.limit) || 1;
                    this.currentPage = Math.floor(response.data.pagination.offset / response.data.pagination.limit) + 1;
                    this.updatePaginationUI();
                }

                // Save to localStorage as backup
                this.saveTransactionHistory();
            } else if (response && !response.success) {
                throw new Error(response.message || 'Failed to load transactions');
            } else {
                this.transactionHistory = [];
            }
        } catch (error) {
            // Try loading from localStorage as fallback
            this.loadLocalTransactionHistory();

            // Show error notification to user
            this.showError('No se pudieron cargar las transacciones desde el servidor. Mostrando datos locales.');
        }
    }

    // REMOVED: loadMockTransactionData() - Mock data should not be used in production
    // All transaction data should come from the API or localStorage backup only

    async loadTandaTransactionHistory() {
        // Load Tandas-specific transaction history
        if (this.tandaSystemData && this.tandaSystemData.movement_log) {
            const tandaTransactions = this.tandaSystemData.movement_log.map(log => ({
                id: log.id,
                type: 'tanda',
                description: `${log.event_type} - ${log.tanda_name}`,
                amount: Math.abs(log.balance_impact),
                currency: 'HNL',
                status: 'completed',
                timestamp: new Date(log.timestamp),
                recipient: log.administrator_name || 'Sistema',
                fee: log.commission_amount || 0,
                reference: log.reference,
                admin_tracking: {
                    tanda_id: log.tanda_id,
                    administrator: log.administrator_name,
                    cycle: log.cycle_number,
                    event_type: log.event_type
                }
            }));

            // Merge with regular transaction history
            this.transactionHistory = [...this.transactionHistory, ...tandaTransactions]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
    }

    loadLocalTransactionHistory() {
        // Load from localStorage as fallback - now using consistent key
        const stored = localStorage.getItem('transactionHistory');
        if (stored) {
            try {
                this.transactionHistory = JSON.parse(stored);
                    count: this.transactionHistory.length,
                    storageKey: 'transactionHistory',
                    lastTransaction: this.transactionHistory[this.transactionHistory.length - 1]?.id || 'none'
                });
            } catch (error) {
                this.transactionHistory = [];
            }
        } else {
            // Start with empty transaction history - real transactions will be added as they occur
            this.transactionHistory = [];
        }
    }

    // ================================
    // 📄 PAGINATION METHODS
    // ================================

    async loadPage(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) return;
        
        const offset = (pageNum - 1) * this.paginationData.limit;
        const userId = this.getCurrentUserId();
        
        try {
            // Show loading indicator
            this.showLoading('Cargando transacciones...');
            
            const response = await this.apiCall('/api/user/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    limit: this.paginationData.limit,
                    offset: offset
                })
            });
            
            this.hideLoading();
            
            if (response && response.success && response.data) {
                this.transactionHistory = response.data.transactions || [];
                this.currentPage = pageNum;
                if (response.data.pagination) {
                    this.paginationData = response.data.pagination;
                }
                this.updatePaginationUI();
                this.renderTransactionHistory();
                this.saveTransactionHistory();
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Error al cargar la página de transacciones');
        }
    }

    nextPage() {
        if (this.paginationData.has_more) {
            this.loadPage(this.currentPage + 1);
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.loadPage(this.currentPage - 1);
        }
    }

    updatePaginationUI() {
        const controls = document.getElementById('paginationControls');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const indicator = document.getElementById('pageIndicator');
        
        if (!controls) return;
        
        controls.classList.toggle('hidden', this.totalPages <= 1);
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = !this.paginationData.has_more;
        
        if (indicator) {
            indicator.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
        }
    }

    // ================================
    // 🔔 ADMIN UPDATES & NOTIFICATIONS
    // ================================

    async checkAdminUpdates() {
        try {

            // Check localStorage for admin updates
            const updates = localStorage.getItem('latanda_transaction_updates');
            if (updates) {
                const adminUpdates = JSON.parse(updates);
                await this.processAdminUpdates(adminUpdates);
            }

            // Check for admin notifications
            const notifications = localStorage.getItem('admin_notifications');
            if (notifications) {
                const adminNotifications = JSON.parse(notifications);
                this.showAdminNotifications(adminNotifications);
            }

        } catch (error) {
        }
    }

    async processAdminUpdates(adminUpdates) {
        for (const [depositId, update] of Object.entries(adminUpdates)) {
            // Find the transaction in our history
            const transaction = this.transactionHistory.find(tx =>
                tx.id === depositId || tx.reference === depositId
            );

            if (transaction && update.type === 'admin_request_image') {
                // Admin is requesting a new image
                transaction.status = 'resubmit_required';
                transaction.admin_message = update.message;
                transaction.admin_request_date = update.timestamp;
                transaction.user_actions = ['resubmit_receipt', 'cancel'];

                // Show notification to user
                this.showAdminImageRequest(transaction, update);

            } else if (transaction) {
                // Handle different admin update types
                const previousStatus = transaction.status;
                transaction.status = update.status;
                transaction.admin_message = update.message || '';
                transaction.last_admin_update = update.timestamp;

                // If deposit was approved (completed), update balance
                if (transaction.type === 'deposit' &&
                    update.status === 'completed' &&
                    previousStatus !== 'completed') {

                        amount: transaction.amount,
                        currency: transaction.currency,
                        transactionId: transaction.id
                    });

                    // Update balance
                    this.balances[transaction.currency] += transaction.amount;

                    // Save balance to localStorage
                    localStorage.setItem('balances', JSON.stringify(this.balances));

                    this.updateBalanceDisplay();

                    // Show success notification
                    this.showSuccess(`¡Depósito aprobado! +${transaction.amount} ${transaction.currency} agregado a tu balance.`);

                }

                // Handle withdrawal completion
                else if (transaction.type === 'withdrawal' &&
                         update.status === 'completed' &&
                         previousStatus !== 'completed') {

                        amount: transaction.amount,
                        currency: transaction.currency,
                        transactionId: transaction.id
                    });

                    // Update transaction details for completion
                    transaction.processedAt = update.processed_at;
                    transaction.processedBy = update.processed_by;
                    transaction.processingNotes = update.admin_message;
                    transaction.canAppeal = false;
                    transaction.canResubmit = false;

                    // Show success notification
                    this.showSuccess(`¡Retiro procesado exitosamente! ${this.formatCurrency(transaction.amount, transaction.currency)} transferido a tu cuenta bancaria. ${this.escapeHtml(update.admin_message || '')}`);

                }

                // Handle withdrawal rejection with balance restoration
                else if (update.type === 'withdrawal_rejection' &&
                         transaction.type === 'withdrawal' &&
                         previousStatus !== 'rejected') {

                        amount: update.amount_restored,
                        currency: update.currency,
                        transactionId: transaction.id
                    });

                    // Restore balance (add back the withdrawn amount)
                    this.balances[update.currency] += update.amount_restored;

                    // Save balance to localStorage
                    localStorage.setItem('balances', JSON.stringify(this.balances));
                    this.updateBalanceDisplay();

                    // Update transaction details
                    transaction.rejectedAt = update.rejected_at;
                    transaction.rejectedBy = update.rejected_by;
                    transaction.rejectionReason = update.admin_message;
                    transaction.canAppeal = true;
                    transaction.canResubmit = false;

                    // Show notification with balance restoration info
                    this.showError(`Retiro rechazado. ${this.formatCurrency(update.amount_restored, update.currency)} devuelto a tu balance. ${this.escapeHtml(update.admin_message || '')}`);

                }

            }
        }

        // Save updated transaction history
        this.saveTransactionHistory();
        this.updateTransactionHistory();

        // Clear processed admin updates to prevent reprocessing
        localStorage.removeItem('latanda_transaction_updates');
    }

    showAdminImageRequest(transaction, update) {
        // Create notification for user
        const notification = {
            id: 'admin_req_' + Date.now(),
            type: 'admin_request',
            title: 'Nueva imagen requerida',
            message: update.message,
            transaction_id: transaction.id,
            timestamp: new Date(),
            actions: ['view_deposit', 'resubmit']
        };

        // Add to notification history
        if (!this.notificationHistory) this.notificationHistory = [];
        this.notificationHistory.unshift(notification);
        localStorage.setItem('notificationHistory', JSON.stringify(this.notificationHistory));

        // Show immediate notification
        this.showNotification(
            `📋 Actualización de depósito: ${update.message}`,
            'warning'
        );

        // Show admin request modal
        this.showAdminRequestModal(transaction, update);
    }

    showAdminRequestModal(transaction, update) {
        const modal = document.createElement('div');
        modal.className = 'modal admin-request-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Actualización de Depósito</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="admin-message">
                        <div class="alert alert-warning">
                            <i class="fas fa-info-circle"></i>
                            <strong>Mensaje del administrador:</strong>
                            <p>${update.message}</p>
                        </div>
                    </div>

                    <div class="transaction-details">
                        <h4>Detalles del depósito:</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Monto:</strong> ${this.formatCurrency(transaction.amount, transaction.currency, true)}
                            </div>
                            <div class="detail-item">
                                <strong>Referencia:</strong> ${transaction.reference || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Fecha:</strong> ${this.formatDateTime(transaction.timestamp)}
                            </div>
                            <div class="detail-item">
                                <strong>Estado actual:</strong>
                                <span class="status-badge resubmit">Nueva imagen requerida</span>
                            </div>
                        </div>
                    </div>

                    <div class="resubmit-section">
                        <h4>Subir nueva imagen:</h4>
                        <div class="input-group">
                            <label for="newReceiptFile">Nuevo comprobante de pago</label>
                            <input type="file" id="newReceiptFile" accept="image/*,.pdf" required>
                            <small class="input-help">Sube una imagen clara del comprobante de transferencia</small>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">
                        Cerrar
                    </button>
                    <button type="button" class="btn-primary" data-action="resubmit-receipt-simple" data-tx-id="${this.escapeHtml(transaction.id)}"">
                        <i class="fas fa-upload"></i> Enviar Nueva Imagen
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async resubmitReceipt(transactionId) {
        try {
            const fileInput = document.getElementById('newReceiptFile');
            const file = fileInput?.files[0];

            if (!file) {
                walletInstance.showError('Por favor selecciona un archivo');
                return;
            }

            // Validate file
            if (!this.validateReceiptFile(file)) {
                return;
            }

            walletInstance.showLoading('Enviando nueva imagen...');

            // Find the transaction
            const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
            if (!transaction) {
                throw new Error('Transacción no encontrada');
            }

            // Update transaction
            transaction.status = 'pending_admin_verification';
            transaction.receipt_resubmitted = true;
            transaction.new_receipt_filename = file.name;
            transaction.resubmit_date = new Date();
            transaction.user_actions = ['cancel'];
            transaction.admin_message = ''; // Clear previous message

            // Save transaction history
            walletInstance.saveTransactionHistory();

            // Remove admin update from localStorage
            const updates = JSON.parse(localStorage.getItem('latanda_transaction_updates') || '{}');
            delete updates[transactionId];
            localStorage.setItem('latanda_transaction_updates', JSON.stringify(updates));

            // Close modal
            document.querySelector('.admin-request-modal')?.remove();

            // Update UI
            this.updateTransactionHistory();

            walletInstance.showSuccess('Nueva imagen enviada correctamente. El administrador la revisará pronto.');

        } catch (error) {
            walletInstance.showError('Error al enviar la nueva imagen');
        } finally {
            walletInstance.hideLoading();
        }
    }

    showAdminNotifications(notifications) {
        if (!Array.isArray(notifications) || notifications.length === 0) return;

        notifications.forEach(notification => {
            if (notification.type === 'deposit_confirmed') {
                this.showNotification('✅ Depósito confirmado por el administrador', 'success');
            } else if (notification.type === 'deposit_rejected') {
                this.showNotification('❌ Depósito rechazado: ' + notification.message, 'error');
            }
        });

        // Clear notifications after showing
        localStorage.removeItem('admin_notifications');
    }

    // New function to go to transactions page
    goToTransactions() {
        window.location.href = 'transacciones.html';
    }

    // New function to show help modal
    showHelpModal() {
        // This would open a help/support modal
        // In a real implementation, you would create and show a help modal
    }

    updateCurrencyConversions() {
        // Update balance display after conversions are updated
        this.updateBalanceDisplay();
    }

    // ================================
    // 💰 WALLET DATA & API INTEGRATION
    // ================================

    async loadWalletData() {
        try {
            this.showLoading('Cargando datos del wallet...');

            // Load balances
            await this.loadBalances();

            // Load transaction history
            await this.loadTransactionHistory();

            // Load exchange rates
            await this.loadExchangeRates();

            // Check for admin updates
            await this.checkAdminUpdates();

            // Update UI
            this.updateBalanceDisplay();
            this.updateTransactionHistory();

            // Start real-time updates
            this.startTransactionStatusUpdates();
            this.startRealTimeBalanceUpdates();

        } catch (error) {
            this.showError('Error al cargar los datos del wallet');
        } finally {
            this.hideLoading();
        }
    }

    async loadBalances() {
        try {
            // Use feature flag to determine balance loading method
            if (this.featureFlags.useApiBalances) {
                await this.loadBalancesFromAPI();
            } else {
                // For demo purposes, using mock data
                const mockBalances = {
                    USD: 1247.50,
                    HNL: 15420.75,
                    LTD: 542.30
                };

                // Simulate API call delay
                await this.delay(500);
                this.balances = mockBalances;
            }

        } catch (error) {

            // Fallback to cached balances or mock data
            const cachedBalances = this.getCachedBalances();
            if (cachedBalances) {
                this.balances = cachedBalances;
            } else {
                // Ultimate fallback to mock data
                this.balances = {
                    USD: 0.00,
                    HNL: 0.00,
                    LTD: 0.00
                };
            }
        }
    }

    // ============================================
    // 💰 API BALANCE INTEGRATION SYSTEM
    // ============================================

    async loadBalancesFromAPI() {
        try {
            // Show loading state
            this.showBalanceLoadingState();

            // Check cache first (5-minute expiration)
            const cachedBalances = this.getCachedBalances();
            if (cachedBalances && this.isCacheValid('balances')) {
                this.balances = cachedBalances;
                this.hideBalanceLoadingState();
                return;
            }

            // Get user ID for API call
            const userId = this.userSession?.user?.id || this.userSession?.id;
            if (!userId) {
                throw new Error('User ID not available for balance API call');
            }

            // Call balance API endpoint
            const response = await this.apiCall(`/api/wallet/balance?user_id=${userId}`, {
                method: 'GET'
            });

            if (!response.success) {
                throw new Error(response.message || 'Failed to load balances');
            }

            // Transform API response to internal balance format
            const apiData = response.data;
            this.balances = {
                USD: parseFloat(apiData.balance || apiData.balances?.available_usd || 0),
                HNL: parseFloat((apiData.balance || apiData.balances?.available_usd || 0) * 25.0),
                LTD: parseFloat(apiData.ltd_balance || apiData.balances?.ltd_tokens || 0)
            };

            // Update exchange rates if provided
            if (apiData.exchange_rates) {
                this.exchangeRates = {
                    ...this.exchangeRates,
                    USD_HNL: parseFloat(apiData.exchange_rates.USD_HNL || this.exchangeRates.USD_HNL),
                    HNL_USD: parseFloat(apiData.exchange_rates.HNL_USD || this.exchangeRates.HNL_USD)
                };
            }

            // Cache the balance data
            this.cacheBalances(this.balances);

            // Store additional balance info for advanced features
            this.balanceMetadata = {
                pending_deposits_amount: parseFloat(apiData.balances?.pending_deposits_usd || 0),
                locked_balance: parseFloat(apiData.balances?.locked_usd || apiData.restrictions?.tanda_locked_amount || 0),
                last_updated: apiData.last_updated || new Date().toISOString()
            };


        } catch (error) {

            // Try to use cached data as fallback
            const cachedBalances = this.getCachedBalances();
            if (cachedBalances) {
                this.balances = cachedBalances;
            } else {
                // Re-throw error if no cache available
                throw error;
            }
        } finally {
            this.hideBalanceLoadingState();
        }
    }

    // ============================================
    // 💾 BALANCE CACHING SYSTEM
    // ============================================

    cacheBalances(balances) {
        try {
            const cacheData = {
                balances: balances,
                timestamp: Date.now(),
                exchangeRates: this.exchangeRates
            };

            localStorage.setItem('balance_cache', JSON.stringify(cacheData));
        } catch (error) {
        }
    }

    getCachedBalances() {
        try {
            const cached = localStorage.getItem('balance_cache');
            if (!cached) return null;

            const cacheData = JSON.parse(cached);

            // Return cached balances if valid
            if (this.isCacheValid('balances', cacheData.timestamp)) {
                // Also restore exchange rates if available
                if (cacheData.exchangeRates) {
                    this.exchangeRates = { ...this.exchangeRates, ...cacheData.exchangeRates };
                }
                return cacheData.balances;
            }

            // Cache expired, remove it
            localStorage.removeItem('balance_cache');
            return null;

        } catch (error) {
            return null;
        }
    }

    isCacheValid(type, customTimestamp = null) {
        try {
            let cacheKey, maxAge;

            switch (type) {
                case 'balances':
                    cacheKey = 'balance_cache';
                    maxAge = 5 * 60 * 1000; // 5 minutes
                    break;
                default:
                    return false;
            }

            if (customTimestamp) {
                return (Date.now() - customTimestamp) < maxAge;
            }

            const cached = localStorage.getItem(cacheKey);
            if (!cached) return false;

            const cacheData = JSON.parse(cached);
            return (Date.now() - cacheData.timestamp) < maxAge;

        } catch (error) {
            return false;
        }
    }

    clearBalanceCache() {
        try {
            localStorage.removeItem('balance_cache');
        } catch (error) {
        }
    }

    // ============================================
    // 🔄 REAL-TIME BALANCE UPDATES
    // ============================================

    startRealTimeBalanceUpdates() {
        // Only start if API balances are enabled and user is authenticated
        if (!this.featureFlags.useApiBalances || !this.userSession?.token) {
            return;
        }

        // Clear any existing interval
        if (this.balanceUpdateInterval) {
            clearInterval(this.balanceUpdateInterval);
        }

        // Set up 30-second balance refresh
        this.balanceUpdateInterval = setInterval(async () => {
            try {
                // Only update if page is visible and user is authenticated
                if (document.visibilityState === 'visible' && this.userSession?.token) {
                    await this.refreshBalances(false); // Silent refresh
                }
            } catch (error) {
            }
        }, 30000); // 30 seconds

    }

    stopRealTimeBalanceUpdates() {
        if (this.balanceUpdateInterval) {
            clearInterval(this.balanceUpdateInterval);
            this.balanceUpdateInterval = null;
        }
    }

    async refreshBalances(showLoading = true) {
        try {
            if (showLoading) {
                this.showLoading('Actualizando balances...');
            }

            await this.loadBalances();
            this.updateBalanceDisplay();

            if (showLoading) {
                this.hideLoading();
            }

        } catch (error) {
            if (showLoading) {
                this.hideLoading();
                this.showError('Error al actualizar balances. Usando datos en caché.');
            }
        }
    }

    // ============================================
    // 🎨 LOADING STATE MANAGEMENT
    // ============================================

    showBalanceLoadingState() {
        // Add loading spinners to balance elements
        const balanceElements = ['usdBalance', 'hnlBalance', 'ltdBalance'];

        balanceElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.opacity = '0.6';
                // Add loading class if it exists in CSS
                element.classList.add('loading-balance');
            }
        });

        // Show main loading indicator if available
        const mainBalance = document.querySelector('.main-balance');
        if (mainBalance) {
            mainBalance.classList.add('loading');
        }
    }

    hideBalanceLoadingState() {
        // Remove loading spinners from balance elements
        const balanceElements = ['usdBalance', 'hnlBalance', 'ltdBalance'];

        balanceElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.opacity = '1';
                element.classList.remove('loading-balance');
            }
        });

        // Hide main loading indicator
        const mainBalance = document.querySelector('.main-balance');
        if (mainBalance) {
            mainBalance.classList.remove('loading');
        }
    }

    // REMOVED: Duplicate loadTransactionHistory() function that was overwriting localStorage data with mock data
    // The main loadTransactionHistory() function at line 318 handles loading correctly from localStorage

    async loadExchangeRates() {
        try {
            // In production, fetch real-time rates
            const mockRates = {
                USD_HNL: 24.85,
                HNL_USD: 0.0402,
                LTD_USD: 0.847,
                USD_LTD: 1.18
            };

            await this.delay(200);
            this.exchangeRates = mockRates;

        } catch (error) {
            throw error;
        }
    }

    updateBalanceDisplay() {
        // Update individual balance cards with primary/secondary currency display
        const usdBalance = document.getElementById('usdBalance');
        const hnlBalance = document.getElementById('hnlBalance');
        const ltdBalance = document.getElementById('ltdBalance');
        const primaryCurrency = this.walletSettings.currencyPreference;

        if (this.walletSettings.balanceVisible) {
            // USD Balance Card
            if (usdBalance) {
                const primaryAmount = this.convertToPreferredCurrency(this.balances.USD, 'USD');
                if (primaryCurrency === 'USD') {
                    usdBalance.innerHTML = `$${this.formatCurrency(this.balances.USD)}<br><small class="secondary-balance">L ${this.formatCurrency(this.balances.USD * this.exchangeRates.USD_HNL)}</small>`;
                } else {
                    usdBalance.innerHTML = `L ${this.formatCurrency(primaryAmount)}<br><small class="secondary-balance">$${this.formatCurrency(this.balances.USD)}</small>`;
                }
                usdBalance.classList.remove('balance-hidden');
            }

            // HNL Balance Card
            if (hnlBalance) {
                const primaryAmount = this.convertToPreferredCurrency(this.balances.HNL, 'HNL');
                if (primaryCurrency === 'HNL') {
                    hnlBalance.innerHTML = `L ${this.formatCurrency(this.balances.HNL)}<br><small class="secondary-balance">$${this.formatCurrency(this.balances.HNL * this.exchangeRates.HNL_USD)}</small>`;
                } else {
                    hnlBalance.innerHTML = `$${this.formatCurrency(primaryAmount)}<br><small class="secondary-balance">L ${this.formatCurrency(this.balances.HNL)}</small>`;
                }
                hnlBalance.classList.remove('balance-hidden');
            }

            // LTD Balance Card
            if (ltdBalance) {
                const primaryInUSD = 0; // LTD removed * this.exchangeRates.LTD_USD;
                const primaryAmount = this.convertToPreferredCurrency(primaryInUSD, 'USD');
                const secondarySymbol = primaryCurrency === 'USD' ? 'L' : '$';
                const secondaryAmount = primaryCurrency === 'USD' ?
                    primaryInUSD * this.exchangeRates.USD_HNL : primaryInUSD;

                // LTD removed - ltdBalance.innerHTML = `${this.formatCurrency(0)} LTD<br><small class="secondary-balance">${secondarySymbol}${this.formatCurrency(secondaryAmount)}</small>`;
                ltdBalance.classList.remove('balance-hidden');
            }
        } else {
            if (usdBalance) {
                usdBalance.innerHTML = primaryCurrency === 'USD' ? '$****' : 'L ****';
                usdBalance.classList.add('balance-hidden');
            }

            if (hnlBalance) {
                hnlBalance.innerHTML = primaryCurrency === 'HNL' ? 'L ****' : '$****';
                hnlBalance.classList.add('balance-hidden');
            }

            if (ltdBalance) {
                ltdBalance.innerHTML = '**** LTD';
                ltdBalance.classList.add('balance-hidden');
            }
        }

        // Update total balance in header
        this.updateTotalBalance();
        this.updateBalanceToggleIcon();
        this.checkLowBalanceAlerts();
    }

    updateTotalBalance() {
        const totalBalanceElement = document.getElementById('totalBalance');

        if (totalBalanceElement) {
            if (this.walletSettings.balanceVisible) {
                const totalInUSD = this.balances.USD +
                                 (this.balances.HNL * this.exchangeRates.HNL_USD) +
                                 (0) // LTD removed * this.exchangeRates.LTD_USD;

                const preferredCurrency = this.walletSettings.currencyPreference;
                if (preferredCurrency === 'USD') {
                    totalBalanceElement.textContent = this.formatCurrency(totalInUSD, 'USD');
                } else {
                    const totalInHNL = totalInUSD * this.exchangeRates.USD_HNL;
                    totalBalanceElement.textContent = this.formatCurrency(totalInHNL, 'HNL');
                }
            } else {
                const symbol = this.walletSettings.currencyPreference === 'USD' ? '$' : 'L';
                const currency = this.walletSettings.currencyPreference;
                totalBalanceElement.textContent = `${symbol}**** ${currency}`;
            }
        }
    }

    updateTransactionHistory() {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;

        // Filter to show only MY transactions (as wallet owner)
        const myTransactions = this.getMyTransactions();

        if (myTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wallet"></i>
                    <p><strong>Tu wallet está listo</strong></p>
                    <p>Usa el botón "Depositar" arriba para comenzar</p>
                </div>
            `;
            return;
        }

        const transactionsHTML = myTransactions.map(tx => {
            return this.renderTransactionItem(tx);
        }).join('');

        transactionsList.innerHTML = transactionsHTML;
        this.updateTransactionsSummary(myTransactions);
    }

    // Get transactions that belong to ME (the wallet owner)
    getMyTransactions() {
        const currentUserId = this.getCurrentUserId();

        return this.transactionHistory.filter(tx => {
            // Include transactions where I am the owner/initiator
            return tx.userId === currentUserId ||
                   tx.owner === currentUserId ||
                   tx.walletOwner === currentUserId ||
                   // For backward compatibility, include transactions without owner (assume they're mine)
                   (!tx.userId && !tx.owner && !tx.walletOwner);
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getCurrentUserId() {
        // Get current user ID (from auth, localStorage, etc.)
        try { const user = JSON.parse(localStorage.getItem("latanda_user")); return user?.user_id || user?.userId || localStorage.getItem("currentUserId") || "user_default_123"; } catch(e) { return localStorage.getItem("currentUserId") || "user_default_123"; }
    }

    updateTransactionsSummary(transactions) {
        // Simplified summary - only show if there are pending actions
        const summaryElement = document.getElementById('transactionsSummary');
        if (!summaryElement) return;

        const needsAction = transactions.filter(tx => tx.status === 'resubmit_required').length;
        const pending = transactions.filter(tx => tx.status === 'pending').length;

        // Only show summary if there's something that needs attention
        if (needsAction > 0 || pending > 0) {
            summaryElement.innerHTML = `
                <div class="transactions-summary compact">
                    ${needsAction > 0 ? `<span class="alert-item">⚠️ ${needsAction} requieren acción</span>` : ''}
                    ${pending > 0 ? `<span class="pending-item">⏳ ${pending} pendientes</span>` : ''}
                </div>
            `;
        } else {
            summaryElement.innerHTML = '';
        }
    }

    renderTransactionItem(transaction) {
        const iconMap = {
            deposit: 'fas fa-arrow-down',
            withdrawal: 'fas fa-arrow-up',
            transfer: 'fas fa-exchange-alt',
            tanda: 'fas fa-coins'
        };

        const statusMap = {
            completed: { class: 'status-completed', text: 'Completada', icon: 'fas fa-check-circle' },
            pending: { class: 'status-pending', text: 'Pendiente', icon: 'fas fa-clock' },
            pending_verification: { class: 'status-pending-verification', text: 'En verificación', icon: 'fas fa-search' },
            rejected: { class: 'status-rejected', text: 'Rechazada', icon: 'fas fa-times-circle' },
            appealing: { class: 'status-appealing', text: 'En apelación', icon: 'fas fa-gavel' },
            cancelled: { class: 'status-cancelled', text: 'Cancelada', icon: 'fas fa-ban' },
            failed: { class: 'status-failed', text: 'Fallida', icon: 'fas fa-times-circle' },
            resubmit_required: { class: 'status-action-required', text: 'Acción requerida', icon: 'fas fa-exclamation-triangle' }
        };

        const status = statusMap[transaction.status] || statusMap.pending;
        const icon = iconMap[transaction.type] || 'fas fa-circle';

        // Simplified transaction info
        const paymentMethod = transaction.paymentMethod ?
            `<span class="payment-method ${transaction.paymentMethod}">${transaction.paymentMethod === 'lightning' ? '⚡' : '🏦'}</span>` : '';

        // Admin message if exists
        const adminMessage = transaction.admin_message ?
            `<div class="admin-message-alert">
                <i class="fas fa-info-circle"></i> ${this.escapeHtml(transaction.admin_message)}
             </div>` : '';

        // Clear ownership context (minimal)
        const ownershipContext = this.getTransactionOwnershipContext(transaction);

        return `
            <div class="transaction-item ${transaction.status === 'resubmit_required' ? 'needs-action' : ''} ${transaction.isNew ? 'newly-added' : ''}"
                 data-transaction-id="${transaction.id}"
                 data-action="show-details" data-tx-id="${this.escapeHtml(transaction.id)}">
                <div class="transaction-icon ${transaction.type}">
                    <i class="${icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-main">
                        <h4>${this.getTransactionTitle(transaction)}</h4>
                        <p class="transaction-time">${this.formatDateTime(transaction.timestamp)}</p>
                        <span class="transaction-status ${status.class}">
                            <i class="${status.icon}"></i>
                            ${status.text}
                        </span>
                        ${ownershipContext}
                        ${adminMessage}
                    </div>
                </div>
                <div class="transaction-amount">
                    <span class="amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                        ${transaction.amount >= 0 ? '+' : ''}${this.formatCurrency(transaction.amount, transaction.currency, true)}
                    </span>
                    ${transaction.type === 'tanda' && transaction.fee > 0 ? `<span class="fee">Comisión: ${this.formatCurrency(transaction.fee, transaction.currency)}</span>` : ''}
                    ${this.renderMyTransactionActions(transaction)}
                </div>
            </div>
        `;
    }


    getTransactionTitle(transaction) {
        // Simplified titles - only transaction type
        switch (transaction.type) {
            case 'deposit':
                return `Recarga`;
            case 'withdrawal':
                return `Retiro`;
            case 'transfer':
                if (transaction.amount > 0) {
                    return `Transferencia recibida`;
                } else {
                    return `Transferencia enviada`;
                }
            case 'tanda':
                if (transaction.amount > 0) {
                    return `Turno recibido`;
                } else {
                    return `Aporte enviado`;
                }
            default:
                return transaction.description || 'Transacción';
        }
    }

    getSimplifiedTransactionTitle(transaction) {
        // More specific titles for details modal - from MY perspective
        switch (transaction.type) {
            case 'deposit':
                if (transaction.paymentMethod === 'lightning') {
                    return `Recargué mi wallet via Lightning Network`;
                } else if (transaction.paymentMethod === 'bank_transfer') {
                    return `Recargué mi wallet via transferencia bancaria`;
                } else {
                    return `Recargué mi wallet`;
                }
            case 'withdrawal':
                return `Retiré fondos de mi wallet`;
            case 'transfer':
                if (transaction.amount > 0) {
                    return `Recibí transferencia en mi wallet`;
                } else {
                    return `Envié transferencia desde mi wallet`;
                }
            case 'tanda':
                if (transaction.amount > 0) {
                    return `Mi turno en Tanda ${transaction.tandaId || 'X'} fue acreditado a mi wallet`;
                } else {
                    return `Mi aporte mensual a Tanda ${transaction.tandaId || 'X'} desde mi wallet`;
                }
            default:
                return transaction.description || 'Mi transacción';
        }
    }

    getTransactionOwnershipContext(transaction) {
        // Clear context showing this is MY wallet activity
        switch (transaction.type) {
            case 'deposit':
                return `<span class="ownership-context">💰 Recarga a mi wallet personal</span>`;
            case 'withdrawal':
                return `<span class="ownership-context">💸 Retiro de mi wallet personal</span>`;
            case 'tanda':
                if (transaction.amount > 0) {
                    return `<span class="ownership-context">🎯 Mi turno recibido</span>`;
                } else {
                    return `<span class="ownership-context">🤝 Mi aporte enviado</span>`;
                }
            case 'transfer':
                if (transaction.amount > 0) {
                    return `<span class="ownership-context">📥 Transferencia hacia mi wallet</span>`;
                } else {
                    return `<span class="ownership-context">📤 Transferencia desde mi wallet</span>`;
                }
            default:
                return `<span class="ownership-context">👤 Mi actividad</span>`;
        }
    }

    renderTransactionBreakdown(transaction) {
        if (transaction.type === 'tanda' && transaction.amount > 0 && transaction.fee > 0) {
            // Para tandas recibidas con comisión
            const grossAmount = Math.abs(transaction.amount) + transaction.fee;
            return `
                <div class="transaction-breakdown">
                    <p class="gross-amount">Monto de tu ronda: ${this.formatCurrency(grossAmount, transaction.currency)}</p>
                    <p class="fee-deduction">Comisión del coordinador: -${this.formatCurrency(transaction.fee, transaction.currency)}</p>
                    <p class="net-amount positive">+${this.formatCurrency(Math.abs(transaction.amount), transaction.currency)} depositado</p>
                </div>
            `;
        } else if (transaction.type === 'tanda' && transaction.amount < 0) {
            // Para aportes a tandas
            return `
                <div class="transaction-breakdown">
                    <p class="amount-paid negative">-${this.formatCurrency(Math.abs(transaction.amount), transaction.currency)} aportado</p>
                    ${transaction.fee > 0 ? `<p class="fee-info">Comisión incluida: ${this.formatCurrency(transaction.fee, transaction.currency)}</p>` : ''}
                </div>
            `;
        } else {
            // Para depósitos, retiros, transferencias
            return `
                <div class="transaction-breakdown">
                    <p class="detail-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                        ${transaction.amount >= 0 ? '+' : ''}${this.formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                    </p>
                    ${transaction.type === 'tanda' && transaction.fee > 0 ? `<p class="fee-info">Comisión: ${this.formatCurrency(transaction.fee, transaction.currency)}</p>` : ''}
                </div>
            `;
        }
    }

    renderMyTransactionActions(transaction) {
        // Actions based on transaction type and business logic
        const actions = [];

        // Universal action - view details/receipt
        if (transaction.receiptId || transaction.receiptFile) {
            const idToUse = transaction.receiptId || transaction.id;
            actions.push(`
                <button class="btn-primary btn-sm" onclick="event.stopPropagation(); walletInstance.showReceiptDetails('${idToUse}')">
                    <i class="fas fa-file-image"></i> Ver comprobante
                </button>
            `);
        } else {
            actions.push(`
                <button class="btn-primary btn-sm" data-action="show-my-details" data-tx-id="${this.escapeHtml(transaction.id)}"">
                    <i class="fas fa-receipt"></i> Ver recibo
                </button>
            `);
        }

        // Type and status specific actions
        switch (transaction.type) {
            case 'deposit':
                // Pending verification (can cancel)
                if (transaction.status === 'pending_verification' && transaction.canCancel) {
                    actions.push(`
                        <button class="btn-secondary btn-sm" data-action="cancel-my-deposit" data-tx-id="${this.escapeHtml(transaction.id)}"">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    `);
                }

                // Rejected (can appeal or resubmit)
                else if (transaction.status === 'rejected') {
                    if (transaction.canAppeal) {
                        actions.push(`
                            <button class="btn-warning btn-sm" data-action="appeal-tx" data-tx-id="${this.escapeHtml(transaction.id)}">
                                <i class="fas fa-gavel"></i> Apelar
                            </button>
                        `);
                    }
                    // Removed: "Resubir comprobante" button - users should use "Apelar" instead
                }

                // Completed (option to deposit more)
                else if (transaction.status === 'completed') {
                    actions.push(`
                        <button class="btn-success btn-sm" onclick="event.stopPropagation(); walletInstance.showDepositModal()">
                            <i class="fas fa-plus"></i> Depositar más
                        </button>
                    `);
                }

                // Legacy handling
                else if (transaction.status === 'pending') {
                    actions.push(`
                        <button class="btn-secondary btn-sm" data-action="cancel-my-deposit" data-tx-id="${this.escapeHtml(transaction.id)}"">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    `);
                } else if (transaction.status === 'resubmit_required') {
                    actions.push(`
                        <button class="btn-danger btn-sm" data-action="resubmit-my-receipt" data-tx-id="${this.escapeHtml(transaction.id)}"">
                            <i class="fas fa-upload"></i> Nueva imagen
                        </button>
                    `);
                } else if (transaction.status === 'completed') {
                    actions.push(`
                        <button class="btn-success btn-sm" onclick="event.stopPropagation(); walletInstance.showDepositModal('${transaction.currency}')">
                            <i class="fas fa-plus"></i> Depositar más
                        </button>
                    `);
                }
                break;

            case 'withdrawal':
                if (transaction.status === 'pending') {
                    actions.push(`
                        <button class="btn-secondary btn-sm" data-action="cancel-my-withdrawal" data-tx-id="${this.escapeHtml(transaction.id)}"">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    `);
                } else if (transaction.status === 'completed') {
                    // Add receipt viewer for completed withdrawals
                    if (transaction.hasReceipt || transaction.transferReceipt || transaction.completionProof) {
                        actions.push(`
                            <button class="btn-primary btn-sm" data-action="show-withdrawal-receipt" data-tx-id="${this.escapeHtml(transaction.id)}"">
                                <i class="fas fa-receipt"></i> Ver comprobante
                            </button>
                        `);
                    }
                    actions.push(`
                        <button class="btn-success btn-sm" onclick="event.stopPropagation(); walletInstance.showWithdrawModal()">
                            <i class="fas fa-minus"></i> Retirar más
                        </button>
                    `);
                }
                break;

            case 'tanda':
                if (transaction.amount > 0) {
                    // Received tanda payout
                    actions.push(`
                        <button class="btn-info btn-sm" onclick="event.stopPropagation(); walletInstance.viewTandaDetails('${transaction.tandaId}')">
                            <i class="fas fa-users"></i> Ver tanda
                        </button>
                    `);
                } else {
                    // Made tanda contribution
                    actions.push(`
                        <button class="btn-info btn-sm" onclick="event.stopPropagation(); walletInstance.viewTandaDetails('${transaction.tandaId}')">
                            <i class="fas fa-calendar"></i> Ver calendario
                        </button>
                    `);
                }
                break;

            case 'transfer':
                if (transaction.amount > 0) {
                    // Received transfer
                    actions.push(`
                        <button class="btn-primary btn-sm" onclick="event.stopPropagation(); walletInstance.sendTransferTo('${transaction.senderId}')">
                            <i class="fas fa-reply"></i> Enviar de vuelta
                        </button>
                    `);
                } else {
                    // Sent transfer
                    actions.push(`
                        <button class="btn-primary btn-sm" onclick="event.stopPropagation(); walletInstance.sendTransferTo('${transaction.recipientId}')">
                            <i class="fas fa-paper-plane"></i> Enviar más
                        </button>
                    `);
                }
                break;
        }

        // Failed transactions - always show retry
        if (transaction.status === 'failed') {
            actions.push(`
                <button class="btn-danger btn-sm" data-action="retry-tx" data-tx-id="${this.escapeHtml(transaction.id)}"">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            `);
        }

        return `<div class="my-transaction-actions">${actions.join('')}</div>`;
    }

    renderTransactionActions(transaction) {
        if (!transaction.user_actions || transaction.user_actions.length === 0) {
            return '';
        }

        const actions = transaction.user_actions.map(action => {
            switch (action) {
                case 'resubmit_receipt':
                    return `<button class="btn-danger btn-sm" data-action="resubmit-receipt" data-tx-id="${this.escapeHtml(transaction.id)}">
                        <i class="fas fa-upload"></i> Nueva Imagen
                    </button>`;
                case 'cancel':
                    return `<button class="btn-secondary btn-sm" data-action="cancel-tx" data-tx-id="${this.escapeHtml(transaction.id)}">
                        <i class="fas fa-times"></i> Cancelar
                    </button>`;
                case 'appeal':
                    return `<button class="btn-warning btn-sm" data-action="appeal-tx" data-tx-id="${this.escapeHtml(transaction.id)}">
                        <i class="fas fa-gavel"></i> Apelar
                    </button>`;
                case 'view_details':
                    return `<button class="btn-primary btn-sm" data-action="show-details-stop" data-tx-id="${this.escapeHtml(transaction.id)}">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>`;
                default:
                    return '';
            }
        }).filter(button => button !== '');

        if (actions.length === 0) return '';

        return `<div class="transaction-actions" onclick="event.stopPropagation()">
            ${actions.join('')}
        </div>`;
    }

    // ================================
    // 🚀 TRANSACTION FUNCTIONS
    // ================================

    async processSendTransaction() {
        try {
            walletInstance.showLoading('Procesando envío...');

            const formData = {
                recipient: document.getElementById('recipientEmail').value,
                amount: parseFloat(document.getElementById('sendAmount').value),
                currency: document.getElementById('sendCurrency').value,
                note: document.getElementById('sendNote').value
            };

            // Validate form data
            if (!(await this.validateSendForm(formData))) {
                return;
            }

            // Check balance
            if (formData.amount > this.balances[formData.currency]) {
                throw new Error('Saldo insuficiente');
            }

            // Check if PIN verification is required for large transactions
            const amountInUSD = formData.currency === 'USD' ? formData.amount :
                              formData.currency === 'HNL' ? formData.amount * this.exchangeRates.HNL_USD :
                              formData.amount * this.exchangeRates.LTD_USD;

            if (amountInUSD > 50 && this.walletSettings.pinEnabled) {
                const pinVerified = await this.verifyPin('confirmar transferencia');
                if (!pinVerified) {
                    walletInstance.hideLoading();
                    return;
                }
            }

            // Simulate API call
            await this.delay(2000);

            // Update balance
            this.balances[formData.currency] -= formData.amount;

            // Add to transaction history
            const newTransaction = {
                id: `tx_${Date.now()}`,
                type: 'transfer',
                amount: formData.amount,
                currency: formData.currency,
                description: `Envío a ${formData.recipient}`,
                status: 'completed',
                timestamp: new Date(),
                fee: this.calculateTransactionFee(formData.amount, formData.currency, true), // Internal transfer
                recipient: formData.recipient
            };

            this.transactionHistory.unshift(newTransaction);

            // Update UI
            this.updateBalanceDisplay();
            this.updateTransactionHistory();

            this.closeSendModal();
            this.sendTransactionNotification('sent', formData.amount, formData.currency, formData.recipient);

        } catch (error) {
            this.showError(error.message || 'Error al procesar la transferencia');
        } finally {
            walletInstance.hideLoading();
        }
    }


    async processDeposit() {
        try {
            if (!this.selectedBank) {
                walletInstance.showError('Por favor selecciona un banco');
                return;
            }

            // Validate form inputs
            const amount = parseFloat(document.getElementById('depositAmount').value);
            const currency = document.getElementById('depositCurrency').value;
            const receiptFile = document.getElementById('depositReceipt').files[0];

            if (!amount || amount <= 0) {
                walletInstance.showError('Por favor ingresa un monto válido');
                return;
            }

            if (!receiptFile) {
                walletInstance.showError('Por favor sube el comprobante de pago');
                return;
            }

            // Validate file type and size
            if (!this.validateReceiptFile(receiptFile)) {
                return;
            }

            walletInstance.showLoading('Procesando depósito...');

            // Submit deposit with receipt
            await this.submitDepositWithReceipt({
                amount,
                currency,
                bank_code: this.selectedBank,
                user_id: this.currentUser?.id || 1 // Default for testing
            }, receiptFile);

            walletInstance.showSuccess('Depósito enviado para revisión. Recibirás una notificación cuando sea aprobado.');
            this.closeDepositModal();

        } catch (error) {
            walletInstance.showError('Error al procesar el depósito');
        } finally {
            walletInstance.hideLoading();
        }
    }

    validateReceiptFile(file) {
        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            walletInstance.showError('El archivo es demasiado grande. Máximo 5MB permitido.');
            return false;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            walletInstance.showError('Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG) y PDF.');
            return false;
        }

        return true;
    }

    async submitDepositWithReceipt(depositData, receiptFile) {
        try {
            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append('user_id', depositData.user_id);
            formData.append('amount', depositData.amount);
            formData.append('currency', depositData.currency);
            formData.append('bank_code', depositData.bank_code);
            formData.append('region', 'HN'); // Honduras region

            if (receiptFile) {
                formData.append('receipt', receiptFile);
            }

            const response = await fetch('https://latanda.online/api/wallet/deposit/bank-transfer', {
                method: 'POST',
                body: formData
                // Don't set Content-Type header - browser will set it automatically with boundary
            });

            if (!response.ok) {
                // For testing: if API is down, simulate success
                const simulatedResult = {
                    success: true,
                    message: 'Depósito simulado exitosamente',
                    deposit_id: Date.now()
                };

                // Add notification about the simulated deposit
                walletInstance.addNotification({
                    type: 'info',
                    title: 'Depósito Enviado (Simulado)',
                    message: `Depósito de ${depositData.currency} ${depositData.amount} enviado para revisión.`,
                    timestamp: new Date()
                });

                // CRITICAL: Add transaction to history (this was missing!)
                this.addRealTransaction({
                    id: `dep_${simulatedResult.deposit_id}`,
                    type: 'deposit',
                    description: `Depósito ${depositData.bank_code}`,
                    amount: depositData.amount,
                    currency: depositData.currency,
                    status: 'pending',
                    timestamp: new Date(),
                    paymentMethod: 'bank_transfer',
                    userId: depositData.user_id,
                    walletOwner: depositData.user_id,
                    reference: simulatedResult.deposit_id
                });

                return simulatedResult;
            }

            const result = await response.json();

            if (result.success) {
                // Add notification about the deposit
                walletInstance.addNotification({
                    type: 'info',
                    title: 'Depósito Enviado',
                    message: `Depósito de ${depositData.currency} ${depositData.amount} enviado para revisión.`,
                    timestamp: new Date()
                });

                // CRITICAL: Add transaction to history (this was missing!)
                this.addRealTransaction({
                    id: `dep_${result.deposit_id || Date.now()}`,
                    type: 'deposit',
                    description: `Depósito ${depositData.bank_code}`,
                    amount: depositData.amount,
                    currency: depositData.currency,
                    status: 'pending',
                    timestamp: new Date(),
                    paymentMethod: 'bank_transfer',
                    userId: depositData.user_id,
                    walletOwner: depositData.user_id,
                    reference: result.deposit_id || Date.now()
                });

                return result;
            } else {
                throw new Error(result.message || 'Error al procesar el depósito');
            }

        } catch (error) {
            throw error;
        }
    }

    // ================================
    // 🏦 BANK INTEGRATION
    // ================================

    selectBank(bankId, element = null) {
        this.selectedBank = bankId;

        // Update UI to show selected bank
        document.querySelectorAll('.bank-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Find the clicked element or use the bankId to find the correct element
        const targetElement = element || document.querySelector(`[onclick*="selectBank('${bankId}')"]`);
        if (targetElement) {
            targetElement.classList.add('selected');
        }

        // Show deposit form
        const depositForm = document.getElementById('depositForm');
        if (depositForm) {
            depositForm.style.display = 'block';

            // Display bank-specific instructions
            const instructionsContainer = document.getElementById('depositInstructions');
            if (instructionsContainer) {
                instructionsContainer.innerHTML = this.generateDepositInstructions(bankId);
            }
        }
    }

    generateDepositInstructions(bankId, amount = null, currency = null) {
        const bankData = {
            atlantida: {
                name: 'Banco Atlántida',
                account: '30613012837',
                accountName: 'La Tanda Web3 Platform',
                swift: 'ATLAHNHN',
                instructions: 'Realiza la transferencia y envía el comprobante a deposits@latanda.online'
            },
            bac: {
                name: 'BAC Honduras',
                account: '0987654321',
                accountName: 'La Tanda Web3 Platform',
                swift: 'BACHHNHN',
                instructions: 'Usa el código de referencia LT-' + Date.now()
            },
            continental: {
                name: 'Banco Continental',
                account: '1122334455',
                accountName: 'La Tanda Web3 Platform',
                swift: 'CONMHNHN',
                instructions: 'Incluye tu email registrado en el concepto'
            }
        };

        const bank = bankData[bankId];
        if (!bank) {
            return '<div class="deposit-instructions-content"><p>Información del banco no disponible.</p></div>';
        }

        const referenceCode = `LT-${Date.now()}`;
        const amountDisplay = amount && currency ? `${this.formatCurrency(amount)} ${currency}` : 'Ingresa el monto arriba';

        return `
            <div class="deposit-instructions-content">
                <h5>Instrucciones para ${bank.name}</h5>
                <div class="instruction-item">
                    <strong>Cuenta de destino:</strong> ${bank.account}
                </div>
                <div class="instruction-item">
                    <strong>A nombre de:</strong> ${bank.accountName}
                </div>
                <div class="instruction-item">
                    <strong>Código de referencia:</strong> ${referenceCode}
                </div>
                <div class="instruction-item">
                    <strong>Instrucciones especiales:</strong> ${bank.instructions}
                </div>
                <div class="instruction-note">
                    <i class="fas fa-info-circle"></i>
                    <p>Los depósitos se procesan automáticamente en 5-15 minutos. Guarda el comprobante de transferencia para cualquier consulta.</p>
                </div>
            </div>
        `;
    }

    // ================================
    // 📱 QR CODE FUNCTIONALITY
    // ================================

    initializeQRCode() {
        this.updateReceiveQR();
    }

    updateReceiveQR() {
        const canvas = document.getElementById('qrCode');
        if (!canvas) return;

        const amount = document.getElementById('receiveAmount')?.value || '';
        const currency = document.getElementById('receiveCurrency')?.value || 'USD';
        const walletAddress = 'latanda_user_12345'; // In production, get from user session

        // Create payment URI
        let qrData = `latanda:${walletAddress}`;
        if (amount) {
            qrData += `?amount=${amount}&currency=${currency}`;
        }

        // Generate QR code
        if (window.QRCode) {
            QRCode.toCanvas(canvas, qrData, {
                width: 200,
                height: 200,
                colorDark: '#00FFFF',
                colorLight: '#0f172a',
                margin: 2,
                correctLevel: QRCode.CorrectLevel.M
            }, (error) => {
                if (error) {
                } else {
                }
            });
        }
    }

    copyAddress() {
        const address = document.getElementById('walletAddress').textContent;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(address).then(() => {
                walletInstance.showSuccess('Dirección copiada al portapapeles');
            }).catch(() => {
                this.fallbackCopyText(address);
            });
        } else {
            this.fallbackCopyText(address);
        }
    }

    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            walletInstance.showSuccess('Dirección copiada al portapapeles');
        } catch (err) {
            walletInstance.showError('No se pudo copiar la dirección');
        }

        document.body.removeChild(textArea);
    }

    shareQR() {
        const canvas = document.getElementById('qrCode');
        if (!canvas) {
            this.showError('QR Code no encontrado');
            return;
        }

        // Mostrar loading mientras procesa
        this.showLoading('Preparando QR para compartir...');

        canvas.toBlob((blob) => {
            this.hideLoading();

            if (!blob) {
                this.showError('Error al generar imagen del QR');
                return;
            }

            // Obtener información del QR para el mensaje
            const amount = document.getElementById('receiveAmount')?.value || '';
            const currency = document.getElementById('receiveCurrency')?.value || 'USD';
            const walletAddress = 'latanda_user_12345';

            let shareText = '💰 Envíame fondos con La Tanda!\n';
            if (amount) {
                shareText += `💵 Monto: ${amount} ${currency}\n`;
            }
            shareText += `📱 Escanea este QR code o usa mi dirección:\n${walletAddress}`;

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'qr.png', { type: 'image/png' })] })) {
                // Compartir nativo con imagen
                const file = new File([blob], `latanda-qr-${amount || 'wallet'}-${currency}.png`, { type: 'image/png' });
                navigator.share({
                    title: '💰 La Tanda - Mi Wallet QR',
                    text: shareText,
                    files: [file]
                }).then(() => {
                    this.showSuccess('✅ QR compartido exitosamente');
                }).catch((error) => {
                    this.fallbackShareQR(blob, shareText);
                });
            } else {
                // Fallback mejorado
                this.fallbackShareQR(blob, shareText);
            }
        }, 'image/png', 0.9);
    }

    fallbackShareQR(blob, shareText) {
        // Crear modal de compartir personalizado
        const shareModal = document.createElement('div');
        shareModal.className = 'modal active';
        shareModal.style.zIndex = '10000';

        shareModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3><i class="fas fa-share-alt"></i> Compartir QR Code</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <div id="qr-preview" style="margin-bottom: 20px;"></div>
                    <p style="margin-bottom: 20px; font-size: 14px; color: var(--text-secondary);">
                        ${shareText.replace(/\n/g, '<br>')}
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button id="download-qr" class="btn-primary">
                            <i class="fas fa-download"></i> Descargar QR
                        </button>
                        <button id="copy-text" class="btn-secondary">
                            <i class="fas fa-copy"></i> Copiar Info
                        </button>
                        <button id="open-image" class="btn-secondary">
                            <i class="fas fa-external-link-alt"></i> Abrir Imagen
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(shareModal);

        // Mostrar preview del QR
        const qrPreview = document.getElementById('qr-preview');
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.style.maxWidth = '200px';
        img.style.borderRadius = '8px';
        img.style.border = '2px solid var(--tanda-cyan)';
        qrPreview.appendChild(img);

        // Configurar botones
        const amount = document.getElementById('receiveAmount')?.value || '';
        const currency = document.getElementById('receiveCurrency')?.value || 'USD';
        const fileName = `latanda-qr-${amount || 'wallet'}-${currency}.png`;

        document.getElementById('download-qr').onclick = () => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showSuccess('✅ QR descargado exitosamente');
            shareModal.remove();
        };

        document.getElementById('copy-text').onclick = () => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText.replace(/<br>/g, '\n')).then(() => {
                    this.showSuccess('✅ Información copiada al portapapeles');
                });
            } else {
                this.showError('❌ No se pudo copiar al portapapeles');
            }
        };

        document.getElementById('open-image').onclick = () => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };

        // Cerrar al hacer clic fuera
        shareModal.onclick = (e) => {
            if (e.target === shareModal) {
                shareModal.remove();
            }
        };
    }

    // ================================
    // 🔍 FILTERING & SEARCH
    // ================================

    filterTransactions() {
        // Get all filter values from the new filter section
        const typeFilter = document.getElementById('filterType')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';
        const dateFrom = document.getElementById('filterDateFrom')?.value || '';
        const dateTo = document.getElementById('filterDateTo')?.value || '';
        const amountMin = parseFloat(document.getElementById('filterAmountMin')?.value) || 0;
        const amountMax = parseFloat(document.getElementById('filterAmountMax')?.value) || Infinity;

        // Also check legacy filter IDs for backwards compatibility
        const legacyTypeFilter = document.getElementById('transactionFilter')?.value || 'all';
        const legacyStatusFilter = document.getElementById('statusFilter')?.value || 'all';

        let filteredTransactions = [...this.transactionHistory];

        // Filter by transaction type
        const effectiveTypeFilter = typeFilter || (legacyTypeFilter !== 'all' ? legacyTypeFilter : '');
        if (effectiveTypeFilter) {
            filteredTransactions = filteredTransactions.filter(tx =>
                tx.type === effectiveTypeFilter
            );
        }

        // Filter by transaction status
        const effectiveStatusFilter = statusFilter || (legacyStatusFilter !== 'all' ? legacyStatusFilter : '');
        if (effectiveStatusFilter) {
            filteredTransactions = filteredTransactions.filter(tx =>
                tx.status === effectiveStatusFilter
            );
        }

        // Filter by date range
        if (dateFrom) {
            const startDate = new Date(dateFrom);
            startDate.setHours(0, 0, 0, 0);
            filteredTransactions = filteredTransactions.filter(tx => {
                const txDate = new Date(tx.date || tx.created_at);
                return txDate >= startDate;
            });
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            filteredTransactions = filteredTransactions.filter(tx => {
                const txDate = new Date(tx.date || tx.created_at);
                return txDate <= endDate;
            });
        }

        // Also apply legacy dateFilter if set
        if (this.dateFilter && this.dateFilter.start && this.dateFilter.end) {
            filteredTransactions = filteredTransactions.filter(tx => {
                const txDate = new Date(tx.date || tx.created_at);
                const startDate = new Date(this.dateFilter.start);
                const endDate = new Date(this.dateFilter.end);
                return txDate >= startDate && txDate <= endDate;
            });
        }

        // Filter by amount range
        if (amountMin > 0 || amountMax < Infinity) {
            filteredTransactions = filteredTransactions.filter(tx => {
                const amount = parseFloat(tx.amount) || 0;
                return amount >= amountMin && amount <= amountMax;
            });
        }

        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

        // Store filtered results for export
        this.filteredTransactions = filteredTransactions;

        // Update display with filtered transactions
        this.displayFilteredTransactions(filteredTransactions);

        // Update filter indicators
        this.updateFilterIndicators();

        // Update results count
        this.updateFilterResultsCount(filteredTransactions.length, this.transactionHistory.length);
    }

    updateFilterResultsCount(filtered, total) {
        let countDisplay = document.getElementById('filterResultsCount');
        if (!countDisplay) {
            const filtersSection = document.getElementById('transactionFilters');
            if (filtersSection) {
                countDisplay = document.createElement('div');
                countDisplay.id = 'filterResultsCount';
                countDisplay.className = 'filter-results-count';
                filtersSection.appendChild(countDisplay);
            }
        }
        if (countDisplay) {
            countDisplay.textContent = `Mostrando ${filtered} de ${total} transacciones`;
        }
    }

    clearFilters() {
        // Reset all filter inputs
        const filterIds = ['filterType', 'filterStatus', 'filterDateFrom', 'filterDateTo', 'filterAmountMin', 'filterAmountMax', 'transactionFilter', 'statusFilter'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'SELECT') {
                    element.selectedIndex = 0;
                } else {
                    element.value = '';
                }
            }
        });

        // Clear legacy date filter
        this.dateFilter = null;

        // Re-run filter (will show all)
        this.filterTransactions();

        this.showSuccess('Filtros limpiados');
    }



    // ============================================
    // 📊 EXPORT FUNCTIONS (CSV & PDF)
    // ============================================

    exportToCSV() {
        const transactions = this.filteredTransactions || this.transactionHistory;
        
        if (!transactions || transactions.length === 0) {
            this.showWarning('No hay transacciones para exportar');
            return;
        }

        // CSV Headers
        const headers = ['ID', 'Fecha', 'Tipo', 'Descripción', 'Monto', 'Moneda', 'Estado', 'Método'];
        
        // Convert transactions to CSV rows
        const rows = transactions.map(tx => {
            const date = new Date(tx.date || tx.created_at).toLocaleDateString('es-HN');
            const type = this.getTransactionTypeLabel(tx.type);
            const description = tx.description || tx.group_name || '-';
            const amount = parseFloat(tx.amount || 0).toFixed(2);
            const currency = tx.currency || 'USD';
            const status = this.getStatusLabel(tx.status);
            const method = tx.method || tx.payment_method || '-';
            
            // Escape fields that might contain commas
            const escapeCSV = (field) => {
                if (field && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
                    return '"' + field.replace(/"/g, '""') + '"';
                }
                return field || '';
            };
            
            return [
                tx.id,
                date,
                type,
                escapeCSV(description),
                amount,
                currency,
                status,
                method
            ].join(',');
        });

        // Combine headers and rows
        const csvContent = [headers.join(','), ...rows].join('\n');
        
        // Add BOM for Excel UTF-8 compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Generate filename with date
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `transacciones_latanda_${dateStr}.csv`;
        
        // Download file
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        this.showSuccess(`Exportado ${transactions.length} transacciones a CSV`);
    }

    exportToPDF() {
        const transactions = this.filteredTransactions || this.transactionHistory;
        
        if (!transactions || transactions.length === 0) {
            this.showWarning('No hay transacciones para exportar');
            return;
        }

        // Create PDF content using browser print
        const printWindow = window.open('', '_blank');
        const dateStr = new Date().toLocaleDateString('es-HN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Calculate totals
        const totals = transactions.reduce((acc, tx) => {
            const amount = parseFloat(tx.amount) || 0;
            if (tx.type === 'deposit' || tx.type === 'reward') {
                acc.income += amount;
            } else if (tx.type === 'withdrawal' || tx.type === 'transfer' || tx.type === 'payment') {
                acc.expense += amount;
            }
            return acc;
        }, { income: 0, expense: 0 });

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Historial de Transacciones - La Tanda</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 20px;
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #FFD700;
            padding-bottom: 20px;
        }
        .header h1 { 
            color: #1a1a2e; 
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header .subtitle { 
            color: #666; 
            font-size: 14px;
        }
        .header .date { 
            color: #999; 
            font-size: 12px;
            margin-top: 10px;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item .label {
            font-size: 12px;
            color: #666;
        }
        .summary-item .value {
            font-size: 18px;
            font-weight: bold;
        }
        .summary-item.income .value { color: #28a745; }
        .summary-item.expense .value { color: #dc3545; }
        .summary-item.count .value { color: #007bff; }
        table { 
            width: 100%; 
            border-collapse: collapse;
            font-size: 11px;
        }
        th { 
            background: #1a1a2e; 
            color: white;
            padding: 10px 8px;
            text-align: left;
        }
        td { 
            padding: 8px;
            border-bottom: 1px solid #eee;
        }
        tr:nth-child(even) { background: #f9f9f9; }
        .amount-positive { color: #28a745; font-weight: 500; }
        .amount-negative { color: #dc3545; font-weight: 500; }
        .status-completed { color: #28a745; }
        .status-pending { color: #ffc107; }
        .status-failed { color: #dc3545; }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #999;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏦 La Tanda - Historial de Transacciones</h1>
        <div class="subtitle">Reporte de Movimientos</div>
        <div class="date">Generado el ${dateStr}</div>
    </div>
    
    <div class="summary">
        <div class="summary-item count">
            <div class="label">Total Transacciones</div>
            <div class="value">${transactions.length}</div>
        </div>
        <div class="summary-item income">
            <div class="label">Total Ingresos</div>
            <div class="value">$${totals.income.toFixed(2)}</div>
        </div>
        <div class="summary-item expense">
            <div class="label">Total Egresos</div>
            <div class="value">$${totals.expense.toFixed(2)}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            ${transactions.map(tx => {
                const date = new Date(tx.date || tx.created_at).toLocaleDateString('es-HN');
                const type = this.getTransactionTypeLabel(tx.type);
                const description = tx.description || tx.group_name || '-';
                const amount = parseFloat(tx.amount || 0);
                const isPositive = tx.type === 'deposit' || tx.type === 'reward';
                const status = this.getStatusLabel(tx.status);
                const statusClass = tx.status === 'completed' ? 'status-completed' : 
                                   tx.status === 'pending' ? 'status-pending' : 'status-failed';
                
                return `
                    <tr>
                        <td>${date}</td>
                        <td>${type}</td>
                        <td>${description}</td>
                        <td class="${isPositive ? 'amount-positive' : 'amount-negative'}">
                            ${isPositive ? '+' : '-'}$${amount.toFixed(2)}
                        </td>
                        <td class="${statusClass}">${status}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>La Tanda Fintech - www.latanda.online</p>
        <p>Este documento es un comprobante de sus transacciones</p>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`;

        printWindow.document.write(html);
        printWindow.document.close();
        
        this.showSuccess('PDF generado - usa Ctrl+P para guardar');
    }

    getTransactionTypeLabel(type) {
        const labels = {
            'deposit': 'Depósito',
            'withdrawal': 'Retiro',
            'transfer': 'Transferencia',
            'payment': 'Pago',
            'reward': 'Recompensa',
            'contribution': 'Contribución',
            'tanda_payment': 'Pago Tanda'
        };
        return labels[type] || type || 'Otro';
    }

    getStatusLabel(status) {
        const labels = {
            'completed': 'Completado',
            'pending': 'Pendiente',
            'processing': 'Procesando',
            'failed': 'Fallido',
            'cancelled': 'Cancelado',
            'awaiting_payment': 'Esperando Pago'
        };
        return labels[status] || status || 'Desconocido';
    }

    displayFilteredTransactions(transactions) {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;

        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <p>No hay transacciones que coincidan con el filtro</p>
                </div>
            `;
            return;
        }

        const transactionsHTML = transactions.map(tx => {
            return this.renderTransactionItem(tx);
        }).join('');

        transactionsList.innerHTML = transactionsHTML;
    }

    showDateFilter() {
        const modal = this.createDateFilterModal();
        document.body.appendChild(modal);

        // Show the modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    createDateFilterModal() {
        const modal = document.createElement('div');
        modal.className = 'date-filter-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Filtrar por Fecha</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="date-range-section">
                        <div class="input-group">
                            <label>Fecha de inicio</label>
                            <input type="date" id="dateFilterStart" class="form-input">
                        </div>
                        <div class="input-group">
                            <label>Fecha de fin</label>
                            <input type="date" id="dateFilterEnd" class="form-input">
                        </div>
                    </div>
                    <div class="quick-filters">
                        <h4>Filtros rápidos</h4>
                        <div class="quick-filter-buttons">
                            <button class="quick-filter-btn" data-days="7">Últimos 7 días</button>
                            <button class="quick-filter-btn" data-days="30">Últimos 30 días</button>
                            <button class="quick-filter-btn" data-days="90">Últimos 3 meses</button>
                            <button class="quick-filter-btn" data-days="365">Último año</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancelar
                    </button>
                    <button class="btn btn-danger" onclick="walletInstance.clearDateFilter(); this.closest('.modal-overlay').remove()">
                        Limpiar filtro
                    </button>
                    <button class="btn btn-primary" onclick="walletInstance.applyDateFilter(); this.closest('.modal-overlay').remove()">
                        Aplicar filtro
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for quick filters
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-filter-btn')) {
                const days = parseInt(e.target.dataset.days);
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - days);

                modal.querySelector('#dateFilterStart').value = startDate.toISOString().split('T')[0];
                modal.querySelector('#dateFilterEnd').value = endDate.toISOString().split('T')[0];
            }
        });

        return modal;
    }

    applyDateFilter() {
        const startDate = document.getElementById('dateFilterStart').value;
        const endDate = document.getElementById('dateFilterEnd').value;

        if (!startDate || !endDate) {
            walletInstance.showError('Por favor selecciona ambas fechas');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            walletInstance.showError('La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }

        this.dateFilter = {
            start: startDate,
            end: endDate
        };

        this.filterTransactions();
        walletInstance.showSuccess('Filtro de fecha aplicado exitosamente');
    }

    clearDateFilter() {
        this.dateFilter = null;
        this.filterTransactions();
        walletInstance.showSuccess('Filtro de fecha eliminado');
    }

    updateFilterIndicators() {
        const filterIndicator = document.getElementById('filterIndicator') || this.createFilterIndicator();
        let activeFilters = [];

        // Check type filter
        const typeFilter = document.getElementById('transactionFilter').value;
        if (typeFilter !== 'all') {
            const typeNames = {
                deposit: 'Depósitos',
                withdraw: 'Retiros',
                send: 'Envíos',
                receive: 'Recibos',
                transfer: 'Transferencias',
                tanda: 'Tandas',
                commission: 'Comisiones'
            };
            activeFilters.push(typeNames[typeFilter] || typeFilter);
        }

        // Check status filter
        const statusFilter = document.getElementById('statusFilter')?.value;
        if (statusFilter && statusFilter !== 'all') {
            const statusNames = {
                completed: 'Completadas',
                pending: 'Pendientes',
                processing: 'Procesando',
                failed: 'Fallidas',
                cancelled: 'Canceladas'
            };
            activeFilters.push(statusNames[statusFilter] || statusFilter);
        }

        // Check date filter
        if (this.dateFilter) {
            const start = new Date(this.dateFilter.start).toLocaleDateString('es-ES');
            const end = new Date(this.dateFilter.end).toLocaleDateString('es-ES');
            activeFilters.push(`${start} - ${end}`);
        }

        // Update indicator
        if (activeFilters.length > 0) {
            filterIndicator.innerHTML = `
                <i class="fas fa-filter"></i>
                Filtros activos: ${activeFilters.join(', ')}
                <button class="clear-all-filters" onclick="walletInstance.clearAllFilters()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            filterIndicator.style.display = 'flex';
        } else {
            filterIndicator.style.display = 'none';
        }
    }

    createFilterIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'filterIndicator';
        indicator.className = 'filter-indicator';

        const transactionSection = document.querySelector('.recent-transactions');
        if (transactionSection) {
            transactionSection.insertBefore(indicator, transactionSection.querySelector('.transactions-list'));
        }

        return indicator;
    }

    clearAllFilters() {
        // Reset all filter controls
        document.getElementById('transactionFilter').value = 'all';
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) statusFilter.value = 'all';

        // Clear date filter
        this.dateFilter = null;

        // Reapply filters (which will show all transactions)
        this.filterTransactions();

        walletInstance.showSuccess('Todos los filtros han sido eliminados');
    }

    // ================================
    // 👤 USER PROFILE MANAGEMENT
    // ================================

    initializeUserProfile() {
        // Load user data from localStorage or API
        this.currentUser = this.loadUserData();
        this.updateUserProfileDisplay();
        this.initializeProfileEventListeners();
    }

    loadUserData() {
        // In a real app, this would come from an API
        const defaultUser = {
            id: 1,
            username: 'Usuario Demo',
            email: 'usuario@latanda.com',
            fullName: 'Juan Carlos Pérez González',
            phone: '+52 55 1234 5678',
            birthdate: '1990-03-15',
            country: 'México',
            memberSince: '2024-01-15',
            avatar: null,
            isVerified: true,
            totalTransactions: 127,
            settings: {
                twoFactorEnabled: true,
                notificationsEnabled: true,
                darkModeEnabled: false
            },
            limits: {
                dailyLimit: 5000,
                monthlyLimit: 25000,
                dailyUsed: 1150,
                monthlyUsed: 10500
            }
        };

        const savedUser = localStorage.getItem('latanda_user_data');
        return savedUser ? { ...defaultUser, ...JSON.parse(savedUser) } : defaultUser;
    }

    updateUserProfileDisplay() {
        const user = this.currentUser;

        // Update basic info
        this.updateElement('userName', user.username);
        this.updateElement('userEmail', user.email);
        this.updateElement('fullName', user.fullName);
        this.updateElement('userPhone', user.phone);
        this.updateElement('userCountry', user.country);

        // Format and update birthdate
        const birthdate = new Date(user.birthdate);
        const formattedBirthdate = birthdate.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        this.updateElement('userBirthdate', formattedBirthdate);

        // Update member since
        const memberSince = new Date(user.memberSince);
        const formattedMemberSince = memberSince.toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric'
        });
        this.updateElement('memberSince', `Miembro desde ${formattedMemberSince}`);

        // Update stats
        this.updateElement('totalTransactions', user.totalTransactions.toString());
        this.updateElement('verificationLevel', user.isVerified ? 'Verificado' : 'Pendiente');

        // Update settings toggles
        this.updateToggle('enable2FA', user.settings.twoFactorEnabled);
        this.updateToggle('enableNotifications', user.settings.notificationsEnabled);
        this.updateToggle('enableDarkMode', user.settings.darkModeEnabled);

        // Update limits progress
        this.updateLimitsDisplay();

        // Update avatar if available
        if (user.avatar) {
            this.updateElement('userAvatar', null, 'src', user.avatar);
        }
    }

    updateElement(id, textContent, attribute = null, value = null) {
        const element = document.getElementById(id);
        if (element) {
            if (attribute) {
                element.setAttribute(attribute, value);
            } else if (textContent !== null) {
                element.textContent = textContent;
            }
        }
    }

    updateToggle(id, checked) {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.checked = checked;
        }
    }

    updateLimitsDisplay() {
        const user = this.currentUser;

        // Daily limit progress
        const dailyPercentage = (user.limits.dailyUsed / user.limits.dailyLimit) * 100;
        const dailyProgressBar = document.querySelector('.limit-item:first-child .progress-fill');
        const dailyProgressText = document.querySelector('.limit-item:first-child .progress-text');

        // Check if approaching limits and send alert
        if (dailyPercentage >= 80 && !this._limitAlertSent) {
            this._limitAlertSent = true;
            this.sendSecurityNotification(
                "Estás cerca de tu límite diario (" + dailyPercentage.toFixed(0) + "% utilizado)",
                "limit_warning"
            );
        } else if (dailyPercentage < 80) {
            this._limitAlertSent = false;
        }

        if (dailyProgressBar) {
            dailyProgressBar.style.width = `${dailyPercentage}%`;
        }
        if (dailyProgressText) {
            dailyProgressText.textContent = `$${user.limits.dailyUsed.toLocaleString()} / $${user.limits.dailyLimit.toLocaleString()} utilizados hoy`;
        }

        // Monthly limit progress
        const monthlyPercentage = (user.limits.monthlyUsed / user.limits.monthlyLimit) * 100;
        const monthlyProgressBar = document.querySelector('.limit-item:last-child .progress-fill');
        const monthlyProgressText = document.querySelector('.limit-item:last-child .progress-text');

        if (monthlyProgressBar) {
            monthlyProgressBar.style.width = `${monthlyPercentage}%`;
        }
        if (monthlyProgressText) {
            monthlyProgressText.textContent = `$${user.limits.monthlyUsed.toLocaleString()} / $${user.limits.monthlyLimit.toLocaleString()} utilizados este mes`;
        }
    }

    initializeProfileEventListeners() {
        // Toggle event listeners
        const toggles = ['enable2FA', 'enableNotifications', 'enableDarkMode'];
        toggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.handleSettingToggle(toggleId, e.target.checked);
                });
            }
        });
    }

    handleSettingToggle(settingName, isEnabled) {
        const settingMap = {
            'enable2FA': 'twoFactorEnabled',
            'enableNotifications': 'notificationsEnabled',
            'enableDarkMode': 'darkModeEnabled'
        };

        const userSetting = settingMap[settingName];
        if (userSetting) {
            this.currentUser.settings[userSetting] = isEnabled;
            this.saveUserData();

            // Handle specific settings
            if (settingName === 'enableDarkMode') {
                this.toggleDarkMode(isEnabled);
            } else if (settingName === 'enable2FA') {
                this.handle2FAToggle(isEnabled);
            } else if (settingName === 'enableNotifications') {
                this.handleNotificationsToggle(isEnabled);
            }
        }
    }

    toggleDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
            walletInstance.showSuccess('Modo oscuro activado');
        } else {
            document.body.classList.remove('dark-mode');
            walletInstance.showSuccess('Modo claro activado');
        }
    }

    handle2FAToggle(enabled) {
        if (enabled) {
            // In a real app, this would trigger 2FA setup process
            walletInstance.showSuccess('Autenticación de dos factores activada');
        } else {
            // In a real app, this would require additional verification
            const confirm = window.confirm('¿Está seguro de que desea desactivar la autenticación de dos factores? Esto reducirá la seguridad de su cuenta.');
            if (confirm) {
                walletInstance.showSuccess('Autenticación de dos factores desactivada');
            } else {
                // Revert the toggle
                this.updateToggle('enable2FA', true);
                this.currentUser.settings.twoFactorEnabled = true;
            }
        }
    }

    handleNotificationsToggle(enabled) {
        if (enabled) {
            // Request notification permission if not already granted
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        walletInstance.showSuccess('Notificaciones activadas');
                    } else {
                        walletInstance.showError('Permisos de notificación denegados');
                        this.updateToggle('enableNotifications', false);
                        this.currentUser.settings.notificationsEnabled = false;
                    }
                });
            } else {
                walletInstance.showSuccess('Notificaciones activadas');
            }
        } else {
            walletInstance.showSuccess('Notificaciones desactivadas');
        }
    }

    saveUserData() {
        localStorage.setItem('latanda_user_data', JSON.stringify(this.currentUser));
    }

    showEditProfile() {
        const modal = this.createEditProfileModal();
        document.body.appendChild(modal);

        // Show the modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    createEditProfileModal() {
        const user = this.currentUser;
        const modal = document.createElement('div');
        modal.className = 'edit-profile-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Editar Perfil</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editProfileForm">
                        <div class="input-group">
                            <label>Nombre de usuario</label>
                            <input type="text" id="editUserName" value="${user.username}" required>
                        </div>
                        <div class="input-group">
                            <label>Nombre completo</label>
                            <input type="text" id="editFullName" value="${user.fullName}" required>
                        </div>
                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" id="editUserEmail" value="${user.email}" required>
                        </div>
                        <div class="input-group">
                            <label>Teléfono</label>
                            <input type="tel" id="editUserPhone" value="${user.phone}" required>
                        </div>
                        <div class="input-group">
                            <label>Fecha de nacimiento</label>
                            <input type="date" id="editUserBirthdate" value="${user.birthdate}" required>
                        </div>
                        <div class="input-group">
                            <label>País</label>
                            <select id="editUserCountry">
                                <option value="México" ${user.country === 'México' ? 'selected' : ''}>México</option>
                                <option value="Honduras" ${user.country === 'Honduras' ? 'selected' : ''}>Honduras</option>
                                <option value="Guatemala" ${user.country === 'Guatemala' ? 'selected' : ''}>Guatemala</option>
                                <option value="El Salvador" ${user.country === 'El Salvador' ? 'selected' : ''}>El Salvador</option>
                                <option value="Nicaragua" ${user.country === 'Nicaragua' ? 'selected' : ''}>Nicaragua</option>
                                <option value="Costa Rica" ${user.country === 'Costa Rica' ? 'selected' : ''}>Costa Rica</option>
                                <option value="Panamá" ${user.country === 'Panamá' ? 'selected' : ''}>Panamá</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancelar
                    </button>
                    <button class="btn btn-primary" onclick="walletInstance.saveProfileChanges(); this.closest('.modal-overlay').remove()">
                        Guardar cambios
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    saveProfileChanges() {
        const form = document.getElementById('editProfileForm');
        if (!form) return;

        // Get form values
        const updates = {
            username: document.getElementById('editUserName').value,
            fullName: document.getElementById('editFullName').value,
            email: document.getElementById('editUserEmail').value,
            phone: document.getElementById('editUserPhone').value,
            birthdate: document.getElementById('editUserBirthdate').value,
            country: document.getElementById('editUserCountry').value
        };

        // Validate required fields
        if (!updates.username || !updates.fullName || !updates.email) {
            walletInstance.showError('Por favor complete todos los campos requeridos');
            return;
        }

        // Update user data
        Object.assign(this.currentUser, updates);
        this.saveUserData();
        this.updateUserProfileDisplay();

        walletInstance.showSuccess('Perfil actualizado exitosamente');
    }

    changeAvatar() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processAvatarUpload(file);
            }
        };
        input.click();
    }

    processAvatarUpload(file) {
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            walletInstance.showError('La imagen debe ser menor a 2MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            walletInstance.showError('Por favor seleccione una imagen válida');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.currentUser.avatar = dataUrl;
            this.saveUserData();

            // Update avatar display
            const avatarImg = document.getElementById('userAvatar');
            if (avatarImg) {
                avatarImg.src = dataUrl;
            }

            walletInstance.showSuccess('Avatar actualizado exitosamente');
        };
        reader.readAsDataURL(file);
    }

    // ================================
    // 💰 FEE CALCULATIONS
    // ================================

    calculateSendFees() {
        const amount = parseFloat(document.getElementById('sendAmount').value) || 0;
        const currency = document.getElementById('sendCurrency').value;

        const fee = this.calculateTransactionFee(amount, currency, true); // Internal transfers
        const total = amount + fee;

        const sendFeeElement = document.getElementById('sendFee');
        const sendTotalElement = document.getElementById('sendTotal');

        if (sendFeeElement) {
            sendFeeElement.textContent = `${this.formatCurrency(fee)} ${currency}`;
        }

        if (sendTotalElement) {
            sendTotalElement.textContent = `${this.formatCurrency(total)} ${currency}`;
        }
    }


    calculateTransactionFee(amount, currency, isInternal = true) {
        // Para transferencias internas de La Tanda: SIN COMISIÓN
        if (isInternal) {
            return 0.00;
        }

        // Fee structure para transferencias externas (futuro)
        const feeRates = {
            USD: { fixed: 1.00, percentage: 0.01 }, // $1 + 1%
            HNL: { fixed: 25.00, percentage: 0.01 }, // L25 + 1%
            LTD: { fixed: 0.50, percentage: 0.005 } // 0.5 LTD + 0.5%
        };

        const rate = feeRates[currency] || feeRates.USD;
        return Math.max(rate.fixed, amount * rate.percentage);
    }

    calculateWithdrawalFee(amount, currency) {
        // Higher fees for withdrawals
        const feeRates = {
            USD: 2.00,
            HNL: 50.00,
            LTD: 1.00
        };

        return feeRates[currency] || feeRates.USD;
    }

    // ================================
    // 🎯 MODAL MANAGEMENT
    // ================================

    showSendModal() {
        const modal = document.getElementById('sendModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('recipientEmail').focus();
        }
    }

    closeSendModal() {
        const modal = document.getElementById('sendModal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('sendForm').reset();
            this.calculateSendFees(); // Reset fee display
        }
    }

    showReceiveModal() {
        const modal = document.getElementById('receiveModal');
        if (modal) {
            modal.classList.add('active');
            this.updateReceiveQR();
        }
    }

    closeReceiveModal() {
        const modal = document.getElementById('receiveModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async showDepositModal(currency = 'USD') {
        const modal = document.getElementById('depositModal');
        if (!modal) return;

        // Show modal with method selection
        modal.classList.add('active');

        // Show method selection screen
        this.showMethodSelection();
    }

    initializeAtlantidaDepositForm() {
        // Generate unique reference for this deposit
        const reference = this.generateUniqueReference();

        // Set the reference in the HTML
        document.getElementById('depositReference').textContent = reference;

        // Store the reference for later use
        this.currentDepositReference = reference;

        // Initialize form validation
        this.setupAtlantidaFormValidation();

    }

    generateUniqueReference() {
        const today = new Date();
        const dateStr = today.getFullYear().toString().slice(-2) +
                       (today.getMonth() + 1).toString().padStart(2, '0') +
                       today.getDate().toString().padStart(2, '0');

        // Generate random 4-character code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomCode = '';
        for (let i = 0; i < 4; i++) {
            randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return `LT-DEP-${dateStr}-${randomCode}`;
    }

    setupAtlantidaFormValidation() {
        const amountInput = document.getElementById('depositAmount');
        const receiptInput = document.getElementById('depositReceipt');
        const submitBtn = document.getElementById('submitDepositBtn');

        const validateForm = () => {
            const amount = parseFloat(amountInput.value);
            const hasReceipt = receiptInput.files.length > 0;

            if (amount && amount > 0 && hasReceipt) {
                submitBtn.disabled = false;
            } else {
                submitBtn.disabled = true;
            }
        };

        amountInput.addEventListener('input', validateForm);
        receiptInput.addEventListener('change', validateForm);
    }

    async processAtlantidaDeposit(depositData) {
        try {

            // Create transaction for the history
            const transaction = {
                id: depositData.reference,
                type: 'deposit',
                description: `Depósito Banco Atlántida - ${depositData.reference}`,
                amount: depositData.amount,
                currency: depositData.currency,
                status: 'pending_approval',
                timestamp: new Date(),
                reference: depositData.reference,
                method: 'bank_atlantida',
                accountUsed: depositData.accountUsed,
                receiptFile: depositData.receiptFile,
                receiptId: depositData.receiptId,  // Add receipt ID for proper linking
                userId: this.getCurrentUserId(),
                isMyTransaction: true,
                category: 'deposit'
            };

            // Add to transaction history
            walletInstance.transactionHistory.unshift(transaction);
            walletInstance.saveTransactionHistory();

            // Update UI
            this.updateTransactionHistory();

            // Notify admin (this would be real in production)
            this.notifyAdminNewDeposit(transaction);

            // Show success message and close modal
            this.showSuccess(`Depósito enviado con referencia ${depositData.reference}. Esperando aprobación del admin.`);
            this.closeDepositModal();


        } catch (error) {
            walletInstance.showError('Error al procesar el depósito. Inténtalo de nuevo.');
        }
    }

    showMethodSelection() {
        // Hide all forms
        document.getElementById('methodSelection').style.display = 'block';
        document.getElementById('atlantidaForm').style.display = 'none';
        document.getElementById('lightningForm').style.display = 'none';
    }

    selectDepositMethod(method) {
        if (method === 'atlantida') {
            // Show Atlántida form
            document.getElementById('methodSelection').style.display = 'none';
            document.getElementById('atlantidaForm').style.display = 'block';
            document.getElementById('lightningForm').style.display = 'none';

            // Initialize Atlántida form
            this.initializeAtlantidaDepositForm();
        } else if (method === 'lightning') {
            // Close deposit modal and open Lightning Wallet configuration
            this.closeDepositModal();

            // Check if Lightning wallet is connected
            const lightningConfig = localStorage.getItem('lightningWalletConfig');

            if (lightningConfig && JSON.parse(lightningConfig).connected) {
                // If connected, show transfer interface directly
                showLightningWalletConfig();
                setTimeout(() => {
                    showLightningTransfer();
                }, 500);
            } else {
                // If not connected, show connection options
                showLightningWalletConfig();
                this.showNotification('Conecta tu Lightning Wallet para transferencias instantáneas', 'info');
            }
        }
    }

    initializeLightningDepositForm() {

        // Reset form
        document.getElementById('lightningAmount').value = '';
        document.getElementById('invoiceSection').style.display = 'none';
        document.getElementById('lightningInstructions').style.display = 'none';
        document.getElementById('lightningStatus').style.display = 'none';
        document.getElementById('checkPaymentBtn').style.display = 'none';

        // Clear any existing invoice
        document.getElementById('lightningInvoice').value = '';

    }

    async generateLightningInvoice() {
        const amount = parseFloat(document.getElementById('lightningAmount').value);

        if (!amount || amount < 1) {
            document.getElementById('invoiceSection').style.display = 'none';
            document.getElementById('lightningInstructions').style.display = 'none';
            document.getElementById('lightningStatus').style.display = 'none';
            return;
        }

        try {

            // Show loading state
            document.getElementById('lightningInvoice').value = 'Generando invoice...';
            document.getElementById('invoiceSection').style.display = 'block';

            // Generate invoice using Blink API
            const invoice = await this.createBlinkInvoice(amount);

            if (invoice) {
                // Show the invoice
                document.getElementById('lightningInvoice').value = invoice.paymentRequest;
                document.getElementById('lightningInstructions').style.display = 'block';
                document.getElementById('lightningStatus').style.display = 'block';
                document.getElementById('checkPaymentBtn').style.display = 'block';

                // Store invoice for checking
                this.currentLightningInvoice = invoice;

                // Start automatic payment checking
                this.startLightningPaymentCheck(invoice.paymentHash);

            } else {
                throw new Error('Failed to generate invoice');
            }

        } catch (error) {
            document.getElementById('lightningInvoice').value = 'Error generando invoice. Inténtalo de nuevo.';
            walletInstance.showError('Error generando invoice Lightning. Verifica tu conexión.');
        }
    }

    async createBlinkInvoice(amountUSD) {
        try {

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate a realistic-looking Lightning invoice (for development)
            const timestamp = Math.floor(Date.now() / 1000);
            const randomHash = Math.random().toString(36).substring(2, 15);
            const paymentHash = `${randomHash}${timestamp}`;

            // Create a mock but realistic Lightning invoice
            const mockInvoice = `lnbc${amountUSD * 10}u1p${randomHash}pp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp`;


            return {
                paymentRequest: mockInvoice,
                paymentHash: paymentHash,
                paymentSecret: randomHash,
                satoshis: Math.round((amountUSD / 65000) * 100000000)
            };

        } catch (error) {
            return null;
        }
    }

    startLightningPaymentCheck(paymentHash) {
        if (this.lightningCheckInterval) {
            clearInterval(this.lightningCheckInterval);
        }

        this.lightningCheckInterval = setInterval(async () => {
            const isPaid = await this.checkLightningPaymentStatus(paymentHash);
            if (isPaid) {
                clearInterval(this.lightningCheckInterval);
                this.handleLightningPaymentSuccess();
            }
        }, 5000); // Check every 5 seconds
    }

    async checkLightningPaymentStatus(paymentHash) {
        try {

            // Store when we started checking this payment
            if (!this.paymentCheckStartTime) {
                this.paymentCheckStartTime = Date.now();
            }

            // Simulate payment after 15 seconds (for demo purposes)
            const timeElapsed = Date.now() - this.paymentCheckStartTime;
            const shouldBePaid = timeElapsed > 15000; // 15 seconds

            if (shouldBePaid) {
                return true;
            } else {
                return false;
            }

        } catch (error) {
            return false;
        }
    }

    handleLightningPaymentSuccess() {

        // Update UI
        document.getElementById('lightningStatus').innerHTML = `
            <div class="status-indicator success">
                <i class="fas fa-check-circle"></i>
                <span>✅ ¡Pago recibido!</span>
            </div>
            <p>Tu saldo se ha actualizado automáticamente</p>
        `;

        // Create transaction
        const amount = parseFloat(document.getElementById('lightningAmount').value);
        const transaction = {
            id: this.currentLightningInvoice.paymentHash,
            type: 'deposit',
            description: `Depósito Lightning Network - $${amount} USD`,
            amount: amount,
            currency: 'USD',
            status: 'completed',
            timestamp: new Date(),
            reference: this.currentLightningInvoice.paymentHash,
            method: 'lightning',
            userId: this.getCurrentUserId(),
            isMyTransaction: true,
            category: 'deposit'
        };

        // Add to transaction history
        this.transactionHistory.unshift(transaction);
        this.saveTransactionHistory();

        // Update balance
        this.balances.USD += amount;
        this.updateBalanceDisplay();

        // Update UI
        this.updateTransactionHistory();

        // Show success and close modal after delay
        this.showSuccess(`¡Depósito Lightning exitoso! +$${amount} USD agregado a tu wallet`);

        setTimeout(() => {
            this.closeDepositModal();
        }, 3000);
    }

    generateSuggestionButtons(currency) {
        if (currency === 'USD') {
            return `
                <button onclick="setAmount(25)">$25</button>
                <button onclick="setAmount(50)">$50</button>
                <button onclick="setAmount(100)">$100</button>
                <button onclick="setAmount(250)">$250</button>
            `;
        } else if (currency === 'USDC') {
            return `
                <button onclick="setAmount(10)">10 USDC</button>
                <button onclick="setAmount(25)">25 USDC</button>
                <button onclick="setAmount(50)">50 USDC</button>
                <button onclick="setAmount(100)">100 USDC</button>
            `;
        } else {
            // HNL
            return `
                <button onclick="setAmount(100)">L 100</button>
                <button onclick="setAmount(500)">L 500</button>
                <button onclick="setAmount(1000)">L 1000</button>
                <button onclick="setAmount(2500)">L 2500</button>
            `;
        }
    }

    setupAmountInputMonitoring() {
        const amountInput = document.getElementById('depositAmount');
        const startBtn = document.getElementById('startFlowBtn');
        const methodPreview = document.getElementById('methodPreview');

        if (!amountInput || !startBtn) return;

        amountInput.addEventListener('input', () => {
            const amount = parseFloat(amountInput.value);
            const currency = document.getElementById('depositCurrency').value;

            if (amount && amount >= 1) {
                startBtn.disabled = false;
                this.updateMethodPreview(amount, currency);
            } else {
                startBtn.disabled = true;
                methodPreview.querySelector('#suggestedMethod').textContent = 'Ingresa un monto para ver el método óptimo';
            }
        });
    }

    updateMethodPreview(amount, currency) {
        const methodPreview = document.getElementById('suggestedMethod');
        if (!methodPreview) return;

        // Currency-based routing (not amount-based)
        if (currency === 'USDC') {
            methodPreview.innerHTML = `
                <div class="method-lightning">
                    ⚡ <strong>Lightning Network</strong> - Pago instantáneo
                    <br><small>Confirmación en ~5 segundos, verificación automática</small>
                    <br><small class="amount-display">💎 ${amount.toFixed(2)} USDC via Lightning Network</small>
                </div>
            `;
        } else {
            // HNL and USD use traditional banking with manual verification
            const bankName = currency === 'HNL' ? 'Banco Atlántida' : 'Wire Transfer';
            const symbol = currency === 'HNL' ? 'L' : '$';

            methodPreview.innerHTML = `
                <div class="method-bank">
                    🏦 <strong>Transferencia Bancaria</strong> - ${bankName}
                    <br><small>Verificación manual por admin, 5-15 minutos</small>
                    <br><small class="amount-display">${symbol}${amount.toFixed(2)} ${currency} - Sube comprobante para revisión</small>
                </div>
            `;
        }
    }

    // Method to process successful deposits from the new flow
    async processSuccessfulDeposit(depositData) {
        try {

            // Update wallet balance
            const amount = depositData.amount;
            const currency = depositData.currency;

            // Note: Balance will be updated only when admin approves the deposit
            // For now, the transaction is pending admin approval

            // We'll update balances in the admin approval process, not here

            // Create transaction record with enhanced details
            const transaction = {
                id: depositData.id,
                type: 'deposit',
                description: `Depósito ${depositData.paymentMethod === 'lightning' ? 'Lightning Network' : 'Transferencia bancaria'}`,
                amount: amount,
                currency: currency,
                status: 'pending_admin_verification', // Admin must approve
                timestamp: new Date(),
                recipient: 'Mi Wallet',
                fee: 0,
                reference: depositData.id,
                paymentMethod: depositData.paymentMethod,
                method: depositData.paymentMethod === 'lightning' ? 'lightning' : 'atlantida', // For admin panel compatibility
                ocrConfidence: depositData.ocrResult?.confidence || null,
                processingTime: this.calculateProcessingTimeForDeposit(depositData),
                receiptImage: depositData.receiptImage, // For admin verification
                // Add ownership clarity
                userId: this.getCurrentUserId(),
                walletOwner: this.getCurrentUserId(),
                isMyTransaction: true,
                // Add visual indicators
                isNew: true,
                category: 'deposit'
            };

            // Add to transaction history at the beginning
            walletInstance.transactionHistory.unshift(transaction);

            // Save to localStorage immediately
            this.saveWalletData();
            walletInstance.saveTransactionHistory();

            // Notify admin panel of new deposit for approval
            this.notifyAdminNewDeposit(transaction);

            // Force UI update
            this.updateBalanceDisplay();
            this.updateTransactionHistory();

            // Highlight new transaction briefly
            setTimeout(() => {
                this.highlightNewTransaction(transaction.id);
            }, 100);

            // Show success notification
            this.showSuccessNotification(`¡Depósito completado! +${currency} ${this.formatCurrency(amount)}`);


        } catch (error) {
            walletInstance.showError('Error al procesar el depósito completado');
        }
    }

    async createPendingDepositTransaction(depositData) {
        try {

            const amount = depositData.amount;
            const currency = depositData.currency;

            // Create transaction record (similar to processSuccessfulDeposit but with pending status)
            const transaction = {
                id: depositData.id,
                type: 'deposit',
                description: `Depósito ${depositData.paymentMethod === 'lightning' ? 'Lightning Network' : 'Transferencia bancaria'} - Pendiente aprobación`,
                amount: amount,
                currency: currency,
                status: 'pending_admin_verification', // Admin must approve
                timestamp: new Date(),
                recipient: 'Mi Wallet',
                fee: 0,
                reference: depositData.id,
                paymentMethod: depositData.paymentMethod,
                method: depositData.paymentMethod === 'lightning' ? 'lightning' : 'atlantida', // For admin panel compatibility
                ocrConfidence: depositData.ocrResult?.confidence || null,
                processingTime: this.calculateProcessingTimeForDeposit(depositData),
                receiptImage: depositData.receiptImage, // For admin verification
                // Add ownership clarity
                userId: this.getCurrentUserId(),
                walletOwner: this.getCurrentUserId(),
                isMyTransaction: true,
                // Add visual indicators
                isNew: true,
                category: 'deposit'
            };

            // Add to transaction history at the beginning
            walletInstance.transactionHistory.unshift(transaction);

            // Save to localStorage immediately
            this.saveWalletData();
            walletInstance.saveTransactionHistory();

            // Notify admin panel of new deposit for approval
            this.notifyAdminNewDeposit(transaction);

            // Force UI update
            this.updateBalanceDisplay();
            this.updateTransactionHistory();

            // Highlight new transaction briefly
            setTimeout(() => {
                this.highlightNewTransaction(transaction.id);
            }, 100);

            // Show notification that deposit is pending
            this.showNotification(`Depósito de ${currency} ${this.formatCurrency(amount)} enviado para revisión`, 'info');


        } catch (error) {
            walletInstance.showError('Error al crear la transacción pendiente');
        }
    }

    calculateProcessingTimeForDeposit(depositData) {
        if (depositData.startTime) {
            const start = new Date(depositData.startTime);
            const end = new Date();
            const diffMs = end - start;
            const diffSecs = Math.floor(diffMs / 1000);
            return `${diffSecs}s`;
        }
        return depositData.paymentMethod === 'lightning' ? '~5s' : '~2min';
    }

    highlightNewTransaction(transactionId) {
        const transactionElement = document.querySelector(`[data-transaction-id="${transactionId}"]`);
        if (transactionElement) {
            transactionElement.classList.add('newly-added');
            setTimeout(() => {
                transactionElement.classList.remove('newly-added');
            }, 3000);
        }
    }

    // Real-time transaction status updates
    startTransactionStatusUpdates() {
        // Check for status updates every 30 seconds
        setInterval(() => {
            this.checkForTransactionUpdates();
        }, 30000);
    }

    async checkForTransactionUpdates() {
        try {
            // First, check for admin updates from localStorage
            await this.checkAdminUpdates();

            // Check pending transactions including withdrawals
            const pendingTransactions = this.transactionHistory.filter(tx =>
                tx.status === 'pending' || tx.status === 'pending_admin_verification' || tx.status === 'resubmit_required'
            );

            if (pendingTransactions.length > 0) {
                    pendingTransactions.map(tx => ({id: tx.id.slice(-8), type: tx.type, status: tx.status})));

                // In production, this would call an API to check real status
                // For now, we rely on admin updates via checkAdminUpdates()
            } else {
            }
        } catch (error) {
        }
    }

    async updateTransactionStatus(transaction) {
        // Mark as updating
        const element = document.querySelector(`[data-transaction-id="${transaction.id}"]`);
        if (element) {
            element.classList.add('updating');
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock status update logic (replace with real API call)
        if (transaction.type === 'deposit' && Math.random() > 0.8) {
            // 20% chance to approve pending deposits
            transaction.status = 'completed';
            walletInstance.saveTransactionHistory();
            this.updateTransactionHistory();

            this.showSuccessNotification(`Depósito ${transaction.reference} aprobado`);
        }

        // Remove updating state
        if (element) {
            element.classList.remove('updating');
        }
    }

    // Enhanced save function to ensure persistence
    saveTransactionHistory() {
        try {
            const dataToSave = JSON.stringify(this.transactionHistory);
            localStorage.setItem('transactionHistory', dataToSave);
                count: this.transactionHistory.length,
                lastTransaction: this.transactionHistory[this.transactionHistory.length - 1]?.id || 'none',
                storageKey: 'transactionHistory'
            });
        } catch (error) {
        }
    }

    // Save balances to localStorage
    saveBalancesToStorage() {
        try {
            const dataToSave = JSON.stringify(this.balances);
            localStorage.setItem('balances', dataToSave);
                USD: this.balances.USD,
                HNL: this.balances.HNL,
                storageKey: 'balances'
            });
        } catch (error) {
        }
    }

    // CRITICAL METHOD: Add real transaction to history (this was completely missing!)
    addRealTransaction(transactionData) {

        // Add to the beginning of transaction history
        this.transactionHistory.unshift(transactionData);

        // Save immediately
        this.saveTransactionHistory();

        // Update UI immediately
        this.updateTransactionHistory();

        // Notify admin if needed
        if (transactionData.type === 'deposit' && transactionData.status === 'pending') {
            this.notifyAdminNewDeposit(transactionData);
        }

    }

    // MY TRANSACTION ACTIONS (what I can do as wallet owner)

    showMyTransactionDetails(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) return;

        // Show detailed modal with MY perspective
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content transaction-details-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-receipt"></i> Detalles</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="transaction-detail-view">
                        <div class="detail-header">
                            <div class="detail-icon ${transaction.type}">
                                <i class="fas fa-${transaction.type === 'deposit' ? 'arrow-down' : 'arrow-up'}"></i>
                            </div>
                            <div class="detail-info">
                                <h4>${this.getSimplifiedTransactionTitle(transaction)}</h4>
                                ${this.renderTransactionBreakdown(transaction)}
                            </div>
                        </div>

                        <div class="detail-sections">
                            <div class="detail-section">
                                <h5>📊 Estado actual</h5>
                                <div class="status-info">
                                    <span class="status-badge ${transaction.status}">
                                        ${this.getStatusText(transaction.status)}
                                    </span>
                                    ${this.getMyStatusExplanation(transaction)}
                                </div>
                            </div>

                            <div class="detail-section">
                                <h5>📋 Información</h5>
                                <div class="info-grid compact">
                                    <div class="info-item">
                                        <label>Fecha:</label>
                                        <span>${this.formatDateTime(transaction.timestamp)}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>ID:</label>
                                        <span>${transaction.id}</span>
                                    </div>
                                    ${transaction.fee > 0 ? `
                                        <div class="info-item">
                                            <label>Comisión:</label>
                                            <span>${this.formatCurrency(transaction.fee)} ${transaction.currency}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>

                            ${this.renderActionableSection(transaction)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    getMyStatusExplanation(transaction) {
        switch (transaction.status) {
            case 'pending':
                if (transaction.type === 'tanda' && transaction.amount > 0) {
                    return `<p class="status-explanation">Tu ronda está siendo procesada por el coordinador.</p>`;
                } else if (transaction.type === 'tanda' && transaction.amount < 0) {
                    return `<p class="status-explanation">Tu aporte está siendo confirmado.</p>`;
                } else {
                    return `<p class="status-explanation">Tu ${transaction.type === 'deposit' ? 'depósito está siendo procesado' : 'retiro está siendo procesado'}.</p>`;
                }
            case 'completed':
                if (transaction.type === 'tanda' && transaction.amount > 0) {
                    return `<p class="status-explanation">✅ Fondos acreditados y disponibles en tu wallet.</p>`;
                } else if (transaction.type === 'tanda' && transaction.amount < 0) {
                    return `<p class="status-explanation">✅ Tu aporte fue registrado exitosamente.</p>`;
                } else {
                    return `<p class="status-explanation">✅ Completado. ${transaction.type === 'deposit' ? 'Fondos disponibles en tu wallet' : 'Fondos enviados a tu cuenta'}.</p>`;
                }
            case 'resubmit_required':
                return `<p class="status-explanation">⚠️ Necesitamos que subas una nueva imagen del comprobante más clara.</p>`;
            case 'failed':
                return `<p class="status-explanation">❌ Hubo un problema. Puedes reintentar o contactar soporte.</p>`;
            default:
                return '';
        }
    }

    renderActionableSection(transaction) {
        const actions = this.getAvailableActionsForMe(transaction);

        // Always show contact support
        actions.push({
            type: 'support',
            icon: 'fas fa-headset',
            label: 'Contactar soporte',
            action: 'contact-support-modal'
        });

        return `
            <div class="detail-section actionable">
                <h5>🎯 Acciones</h5>
                <div class="action-buttons compact">
                    ${actions.map(action => `
                        <button class="detail-action-btn ${action.type}" data-action="${action.action}" data-tx-id="${this.escapeHtml(transaction.id)}">
                            <i class="${action.icon}"></i>
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getAvailableActionsForMe(transaction) {
        const actions = [];

        // Actions based on status and type
        if (transaction.status === 'pending' && transaction.type === 'deposit') {
            actions.push({
                type: 'cancel',
                icon: 'fas fa-times',
                label: 'Cancelar depósito',
                action: 'cancel-deposit-modal'
            });
        }

        if (transaction.status === 'resubmit_required') {
            actions.push({
                type: 'resubmit urgent',
                icon: 'fas fa-upload',
                label: 'Subir nueva imagen',
                action: 'resubmit-receipt-modal'
            });
        }

        if (transaction.status === 'failed') {
            actions.push({
                type: 'retry',
                icon: 'fas fa-redo',
                label: 'Reintentar',
                action: 'retry-tx-modal'
            });
        }

        if (transaction.status === 'completed' && transaction.type === 'deposit') {
            actions.push({
                type: 'download',
                icon: 'fas fa-download',
                label: 'Descargar recibo',
                action: 'download-receipt'
            });
        }

        return actions;
    }

    cancelMyDeposit(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction || transaction.status !== 'pending') {
            walletInstance.showError('No se puede cancelar esta transacción');
            return;
        }

        if (confirm('¿Estás seguro de que quieres cancelar este depósito?')) {
            transaction.status = 'cancelled';
            transaction.cancelledAt = new Date();
            transaction.cancelledBy = 'user';

            walletInstance.saveTransactionHistory();
            this.updateTransactionHistory();
            walletInstance.showSuccess('Depósito cancelado exitosamente');
        }
    }

    resubmitMyReceipt(transactionId) {
        // Trigger file upload for new receipt
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            if (e.target.files[0]) {
                this.processNewReceipt(transactionId, e.target.files[0]);
            }
        };
        input.click();
    }

    async processNewReceipt(transactionId, file) {
        try {
            walletInstance.showLoading('Procesando nueva imagen...');

            const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
            if (!transaction) throw new Error('Transacción no encontrada');

            // Update transaction with new receipt
            transaction.status = 'pending';
            transaction.newReceiptFile = file.name;
            transaction.resubmittedAt = new Date();
            transaction.admin_message = '';

            walletInstance.saveTransactionHistory();
            this.updateTransactionHistory();

            walletInstance.showSuccess('Nueva imagen enviada. El administrador la revisará pronto.');
        } catch (error) {
            walletInstance.showError('Error al procesar la nueva imagen');
        } finally {
            walletInstance.hideLoading();
        }
    }

    retryTransaction(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) return;

        // Remove failed transaction and restart process
        if (confirm('¿Quieres reintentar esta transacción?')) {
            if (transaction.type === 'deposit') {
                this.showDepositModal(transaction.currency);
            } else if (transaction.type === 'withdrawal') {
                this.showWithdrawModal();
            }
        }
    }

    downloadReceipt(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) return;

        // Generate receipt PDF or image download
        this.generateReceiptDownload(transaction);
    }

    generateReceiptDownload(transaction) {
        // Create a simple receipt format
        const receiptData = {
            id: transaction.id,
            date: this.formatDateTime(transaction.timestamp),
            type: this.getTransactionTitle(transaction),
            amount: `${transaction.currency} ${this.formatCurrency(transaction.amount)}`,
            status: 'Completado',
            reference: transaction.reference || transaction.id
        };

        // Simple download as JSON (in production, would generate PDF)
        const dataStr = JSON.stringify(receiptData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `recibo_${transaction.id}.json`;
        link.click();

        walletInstance.showSuccess('Recibo descargado');
    }

    contactSupport(transactionId) {
        // Open support modal or redirect
        const supportMessage = `Necesito ayuda con la transacción ${transactionId}`;
        const supportUrl = `mailto:soporte@latanda.online?subject=Ayuda con transacción&body=${encodeURIComponent(supportMessage)}`;
        window.open(supportUrl);
    }

    // NEW BUSINESS LOGIC FUNCTIONS

    cancelMyWithdrawal(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction || transaction.status !== 'pending') {
            walletInstance.showError('No se puede cancelar este retiro');
            return;
        }

        if (confirm('¿Estás seguro de que quieres cancelar este retiro?')) {
            transaction.status = 'cancelled';
            transaction.cancelledAt = new Date();
            transaction.cancelledBy = 'user';

            walletInstance.saveTransactionHistory();
            this.updateTransactionHistory();
            walletInstance.showSuccess('Retiro cancelado exitosamente');
        }
    }

    viewTandaDetails(tandaId) {
        // Navigate to tanda details page or show modal
        this.showInfo(`Viendo detalles de la Tanda ${tandaId}`);
        // TODO: Implement tanda details view
    }

    sendTransferTo(userId) {
        // Open transfer modal with pre-filled recipient
        this.showInfo(`Iniciando transferencia a usuario ${userId}`);
        // TODO: Implement transfer to specific user
    }

    // Show receipt details
    showReceiptDetails(receiptId) {

        let receipt = window.receiptManager?.getReceipt(receiptId);

        // If not found by ID, try smart matching for existing transactions
        if (!receipt && window.receiptManager?.receipts) {

            // Find the transaction to get additional data for matching
            const transaction = this.transactionHistory?.find(t => t.id === receiptId);
            if (transaction) {

                // Try to match receipt by deposit reference or timestamp proximity
                const receipts = window.receiptManager.receipts;

                // Method 1: Match by deposit metadata if available
                receipt = receipts.find(r => {
                    return r.metadata?.depositId && r.metadata.depositId.includes(receiptId.split('-').pop());
                });

                // Method 2: Match by timestamp proximity (within 5 minutes)
                if (!receipt && transaction.timestamp) {
                    const transactionTime = new Date(transaction.timestamp).getTime();
                    receipt = receipts.find(r => {
                        if (r.uploadTime) {
                            const receiptTime = new Date(r.uploadTime).getTime();
                            const timeDiff = Math.abs(transactionTime - receiptTime);
                            return timeDiff < 5 * 60 * 1000; // 5 minutes
                        }
                        return false;
                    });
                }

                // Method 3: If still not found, use the most recent receipt (fallback)
                if (!receipt && receipts.length > 0) {
                    receipt = receipts.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))[0];
                }

                if (receipt) {
                        imageUrl: receipt?.imageUrl,
                        dataUrl: receipt?.dataUrl,
                        file: receipt?.file,
                        fileData: receipt?.fileData,
                        content: receipt?.content,
                        base64: receipt?.base64,
                        url: receipt?.url
                    });
                }
            }
        }

        if (!receipt) {
            this.showError('Comprobante no encontrado');
            return;
        }

        const content = `
            <div class="receipt-details-modal">
                <div class="receipt-header">
                    <p class="receipt-id">ID: ${receipt.id}</p>
                </div>

                <!-- Receipt Image Display -->
                <div class="receipt-image-container" style="margin: 15px 0; text-align: center; max-height: 400px; overflow: auto;">
                    ${receipt.imageUrl || receipt.dataUrl ? `
                        <img src="${receipt.imageUrl || receipt.dataUrl}"
                             alt="Comprobante de pago"
                             style="max-width: 100%; max-height: 350px; border: 2px solid #ccc; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;"
                             onclick="window.open(this.src, '_blank')"
                             title="Haz clic para ver en tamaño completo">
                    ` : `
                        <div style="padding: 20px; background-color: #f5f5f5; border-radius: 8px; color: #666;">
                            📄 <strong>Imagen no disponible</strong><br>
                            <small>El archivo se procesó pero no se puede mostrar la vista previa</small>
                        </div>
                    `}
                </div>

                <div class="receipt-info">
                    <div class="info-row">
                        <span class="label">Archivo:</span>
                        <span class="value">${receipt.fileName}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Monto esperado:</span>
                        <span class="value">$${receipt.expectedAmount} ${receipt.expectedCurrency}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Estado:</span>
                        <span class="value status-${receipt.status}">${this.getReceiptStatusText(receipt.status)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Subido:</span>
                        <span class="value">${this.formatDateTime(receipt.uploadTime)}</span>
                    </div>

                    ${receipt.ocrResult ? `
                        <div class="ocr-results">
                            <h4>📊 Resultados del Análisis</h4>
                            <div class="info-row">
                                <span class="label">Monto detectado:</span>
                                <span class="value">$${receipt.ocrResult.extractedAmount || 'No detectado'}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Confianza:</span>
                                <span class="value">${receipt.ocrResult.confidence || 0}%</span>
                            </div>
                        </div>
                    ` : ''}

                    ${receipt.rejectionReason ? `
                        <div class="rejection-reason">
                            <h4>❌ Motivo del Rechazo</h4>
                            <p>${receipt.rejectionReason}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="receipt-actions">
                    <button onclick="closeReceiptModal()" class="btn-secondary">Cerrar</button>
                    ${receipt.status === 'rejected' ? `
                        <div class="receipt-status-info">
                            <p><i class="fas fa-info-circle"></i> Para continuar con este depósito, usa la opción "Apelar" en los detalles de la transacción.</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Show proper modal with receipt details
        this.showModal('📄 Detalles del Comprobante', content);
    }

    getReceiptStatusText(status) {
        const statusTexts = {
            'uploaded': 'Subido',
            'processing_ocr': 'Procesando',
            'ocr_completed': 'Análisis completado',
            'ready_for_review': 'Listo para revisión',
            'needs_manual_review': 'Requiere revisión manual',
            'approved': 'Aprobado',
            'rejected': 'Rechazado',
            'ocr_failed': 'Error en análisis'
        };
        return statusTexts[status] || status;
    }

    // Appeal a rejected transaction
    appealTransaction(transactionId) {
        const transaction = this.transactionHistory.find(t => t.id === transactionId);
        if (!transaction) {
            walletInstance.showError('Transacción no encontrada');
            return;
        }

        const content = `
            <div class="appeal-form">
                <h3>⚖️ Apelar Transacción Rechazada</h3>
                <p>Transacción: <strong>${transaction.description}</strong></p>
                <p>Monto: <strong>${this.formatCurrency(transaction.amount, transaction.currency)}</strong></p>
                <p>Motivo del rechazo: <strong>${transaction.rejectionReason}</strong></p>

                <div class="form-group">
                    <label for="appealReason">Motivo de la apelación:</label>
                    <textarea id="appealReason" placeholder="Explica por qué consideras que esta transacción debe ser aprobada..." required></textarea>
                </div>

                <div class="form-group">
                    <label for="additionalEvidence">Evidencia adicional (opcional):</label>
                    <input type="file" id="additionalEvidence" accept="image/*,.pdf">
                    <small>Puedes adjuntar documentos adicionales que respalden tu apelación</small>
                </div>

                <div class="appeal-actions">
                    <button onclick="closeModal()" class="btn-secondary">Cancelar</button>
                    <button onclick="walletInstance.submitAppeal('${transactionId}')" class="btn-primary">
                        <i class="fas fa-gavel"></i> Enviar Apelación
                    </button>
                </div>
            </div>
        `;

        this.showModal('Apelar Transacción', content);
    }

    submitAppeal(transactionId) {
        const reason = document.getElementById('appealReason').value.trim();
        if (!reason) {
            walletInstance.showError('Debes explicar el motivo de la apelación');
            return;
        }

        const transaction = this.transactionHistory.find(t => t.id === transactionId);
        if (!transaction) return;

        // Update transaction status
        transaction.status = 'appealing';
        transaction.appealReason = reason;
        transaction.appealedAt = new Date();
        transaction.canAppeal = false;
        transaction.canResubmit = false;

        // Handle additional evidence
        const evidenceFile = document.getElementById('additionalEvidence').files[0];
        if (evidenceFile) {
            // Store file data as base64
            const reader = new FileReader();
            reader.onload = (e) => {
                transaction.appealEvidence = {
                    fileName: evidenceFile.name,
                    fileType: evidenceFile.type,
                    fileSize: evidenceFile.size,
                    dataUrl: e.target.result,
                    uploadedAt: new Date().toISOString()
                };

                this.saveTransactionHistory();
                this.updateTransactionHistory();
                this.notifyAdminAppeal(transaction);
                this.showAppealSubmittedNotification();
            };
            reader.readAsDataURL(evidenceFile);
        } else {
            this.saveTransactionHistory();
            this.updateTransactionHistory();
            this.notifyAdminAppeal(transaction);
            this.showAppealSubmittedNotification();
        }
    }

    showAppealSubmittedNotification() {

        // Show notification
        if (window.notificationSystem) {
            window.notificationSystem.show('appeal_submitted', {
                transactionId: transactionId,
                amount: transaction.amount,
                currency: transaction.currency
            });
        }

        this.closeModal();
        walletInstance.showSuccess('Apelación enviada. Será revisada por un administrador en 1-2 días hábiles.');
    }

    // Show detailed transaction information in a modal
    showTransactionDetails(transactionId) {
        const transaction = this.transactionHistory.find(t => t.id === transactionId);
        if (!transaction) {
            this.showError('Transacción no encontrada');
            return;
        }

        const content = `
            <div class="transaction-details-modal">
                <div class="transaction-header">
                    <h3><i class="fas fa-receipt"></i> ${this.getTransactionTitle(transaction)}</h3>
                    <p class="transaction-date">${this.formatDateTime(transaction.timestamp)}</p>
                </div>

                <div class="transaction-breakdown">
                    ${this.renderTransactionBreakdown(transaction)}
                </div>

                <div class="transaction-info">
                    <div class="info-row">
                        <span class="label">Estado:</span>
                        <span class="value status-${transaction.status}">${this.getTransactionStatusText(transaction.status)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Referencia:</span>
                        <span class="value">${transaction.reference || transaction.id}</span>
                    </div>
                    ${transaction.description ? `
                    <div class="info-row">
                        <span class="label">Descripción:</span>
                        <span class="value">${transaction.description}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="modal-actions">
                    <button onclick="walletInstance.closeModal()" class="btn-primary">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
        `;

        this.showModal('Detalles de Transacción', content);
    }

    // Show withdrawal receipt/proof for completed withdrawals
    showWithdrawalReceipt(transactionId) {
        const transaction = this.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction || transaction.type !== 'withdrawal') {
            this.showError('Transacción de retiro no encontrada');
            return;
        }

        if (transaction.status !== 'completed') {
            this.showError('Solo retiros completados tienen comprobantes disponibles');
            return;
        }

        const content = `
            <div class="withdrawal-receipt-modal">
                <div class="receipt-header">
                    <div class="receipt-success-badge">
                        <i class="fas fa-check-circle"></i>
                        <span>Retiro Procesado Exitosamente</span>
                    </div>
                    <h3><i class="fas fa-receipt"></i> Comprobante de Retiro</h3>
                </div>

                <div class="receipt-details">
                    <div class="detail-section">
                        <h4>📄 Información de la Transacción</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="label">Monto Retirado:</span>
                                <span class="value amount-negative">-${this.formatCurrency(transaction.amount, transaction.currency)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Comisión:</span>
                                <span class="value">${this.formatCurrency(transaction.fee || 0, transaction.currency)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Monto Transferido:</span>
                                <span class="value transfer-amount">${this.formatCurrency((transaction.amount - (transaction.fee || 0)), transaction.currency)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Fecha de Solicitud:</span>
                                <span class="value">${this.formatDateTime(transaction.timestamp)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Fecha de Procesamiento:</span>
                                <span class="value">${transaction.processedAt ? this.formatDateTime(transaction.processedAt) : 'No disponible'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Procesado por:</span>
                                <span class="value">${transaction.processedBy || 'Administrador'}</span>
                            </div>
                        </div>
                    </div>

                    ${transaction.completionProof ? `
                        <div class="detail-section">
                            <h4>🔐 Información de Confirmación</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="label">Número de Referencia:</span>
                                    <span class="value reference-number">${transaction.completionProof.referenceNumber || transaction.referenceNumber}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Código de Confirmación:</span>
                                    <span class="value confirmation-code">${transaction.completionProof.confirmationCode}</span>
                                </div>
                                ${transaction.completionProof.processingNotes ? `
                                    <div class="detail-item full-width">
                                        <span class="label">Notas del Procesamiento:</span>
                                        <span class="value processing-notes">${transaction.completionProof.processingNotes}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <div class="detail-section">
                        <h4>🏦 Información Bancaria de Destino</h4>
                        <div class="bank-info-card">
                            ${transaction.withdrawalAccount ? `
                                <div class="bank-detail">
                                    <span class="label">Banco:</span>
                                    <span class="value">${transaction.withdrawalAccount.bank}</span>
                                </div>
                                <div class="bank-detail">
                                    <span class="label">Número de Cuenta:</span>
                                    <span class="value account-number">****${transaction.withdrawalAccount.account_number.toString().slice(-4)}</span>
                                </div>
                                <div class="bank-detail">
                                    <span class="label">Titular:</span>
                                    <span class="value">${transaction.withdrawalAccount.account_holder}</span>
                                </div>
                                <div class="bank-detail">
                                    <span class="label">Tipo de Cuenta:</span>
                                    <span class="value">${transaction.withdrawalAccount.account_type || 'Ahorros'}</span>
                                </div>
                            ` : `
                                <div class="no-bank-info">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span>Información bancaria no disponible</span>
                                </div>
                            `}
                        </div>
                    </div>

                    ${transaction.transferReceipt && transaction.transferReceipt.data ? `
                        <div class="detail-section">
                            <h4>📎 Comprobante de Transferencia</h4>
                            <div class="receipt-viewer">
                                <img src="${transaction.transferReceipt.data}" alt="Comprobante de transferencia" class="receipt-image">
                                <div class="receipt-actions">
                                    <button onclick="window.open('${transaction.transferReceipt.data}', '_blank')" class="btn-download">
                                        <i class="fas fa-external-link-alt"></i> Ver en tamaño completo
                                    </button>
                                    <button onclick="this.downloadReceipt('${transaction.transferReceipt.data}', '${transaction.transferReceipt.name}')" class="btn-download">
                                        <i class="fas fa-download"></i> Descargar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="receipt-footer">
                    <div class="verification-info">
                        <i class="fas fa-shield-alt"></i>
                        <span>Este comprobante es válido y ha sido procesado por nuestro sistema</span>
                    </div>
                    <div class="receipt-actions">
                        <button data-action="copy-receipt" data-tx-id="${this.escapeHtml(transaction.id)}"" class="btn-copy">
                            <i class="fas fa-copy"></i> Copiar Información
                        </button>
                        <button data-action="print-receipt" data-tx-id="${this.escapeHtml(transaction.id)}"" class="btn-print">
                            <i class="fas fa-print"></i> Imprimir
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.showModal('Comprobante de Retiro', content);
    }

    // Copy receipt information to clipboard
    copyReceiptInfo(transactionId) {
        const transaction = this.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) return;

        const receiptText = `
🧾 COMPROBANTE DE RETIRO - LA TANDA
========================================

💰 INFORMACIÓN DE LA TRANSACCIÓN:
• Monto Retirado: -${this.formatCurrency(transaction.amount, transaction.currency)}
• Comisión: ${this.formatCurrency(transaction.fee || 0, transaction.currency)}
• Monto Transferido: ${this.formatCurrency((transaction.amount - (transaction.fee || 0)), transaction.currency)}
• Fecha de Solicitud: ${this.formatDateTime(transaction.timestamp)}
• Fecha de Procesamiento: ${transaction.processedAt ? this.formatDateTime(transaction.processedAt) : 'No disponible'}

${transaction.completionProof ? `
🔐 INFORMACIÓN DE CONFIRMACIÓN:
• Número de Referencia: ${transaction.completionProof.referenceNumber || transaction.referenceNumber}
• Código de Confirmación: ${transaction.completionProof.confirmationCode}
${transaction.completionProof.processingNotes ? `• Notas: ${transaction.completionProof.processingNotes}` : ''}
` : ''}

🏦 INFORMACIÓN BANCARIA:
${transaction.withdrawalAccount ? `
• Banco: ${transaction.withdrawalAccount.bank}
• Cuenta: ****${transaction.withdrawalAccount.account_number.toString().slice(-4)}
• Titular: ${transaction.withdrawalAccount.account_holder}
• Tipo: ${transaction.withdrawalAccount.account_type || 'Ahorros'}
` : '• Información bancaria no disponible'}

🔒 Comprobante válido y procesado
Generado el: ${new Date().toLocaleString()}
        `.trim();

        navigator.clipboard.writeText(receiptText).then(() => {
            this.showSuccess('Información del comprobante copiada al portapapeles');
        }).catch(() => {
            this.showError('Error al copiar información');
        });
    }

    // Print receipt
    printReceipt(transactionId) {
        const transaction = this.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Comprobante de Retiro - ${transaction.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .detail-section { margin-bottom: 20px; }
                        .detail-item { display: flex; justify-content: space-between; margin: 5px 0; }
                        .label { font-weight: bold; }
                        .bank-info { background: #f5f5f5; padding: 15px; border-radius: 5px; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>LA TANDA - COMPROBANTE DE RETIRO</h1>
                        <p>Retiro procesado exitosamente</p>
                    </div>

                    <div class="detail-section">
                        <h3>Información de la Transacción</h3>
                        <div class="detail-item">
                            <span class="label">Monto Retirado:</span>
                            <span>-${this.formatCurrency(transaction.amount, transaction.currency)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Monto Transferido:</span>
                            <span>${this.formatCurrency((transaction.amount - (transaction.fee || 0)), transaction.currency)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Fecha de Procesamiento:</span>
                            <span>${transaction.processedAt ? this.formatDateTime(transaction.processedAt) : 'No disponible'}</span>
                        </div>
                        ${transaction.completionProof ? `
                            <div class="detail-item">
                                <span class="label">Número de Referencia:</span>
                                <span>${transaction.completionProof.referenceNumber}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Código de Confirmación:</span>
                                <span>${transaction.completionProof.confirmationCode}</span>
                            </div>
                        ` : ''}
                    </div>

                    ${transaction.withdrawalAccount ? `
                        <div class="detail-section">
                            <h3>Información Bancaria</h3>
                            <div class="bank-info">
                                <div class="detail-item">
                                    <span class="label">Banco:</span>
                                    <span>${transaction.withdrawalAccount.bank}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Titular:</span>
                                    <span>${transaction.withdrawalAccount.account_holder}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Cuenta:</span>
                                    <span>****${transaction.withdrawalAccount.account_number.toString().slice(-4)}</span>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <div class="footer">
                        <p>Comprobante válido y procesado por La Tanda</p>
                        <p>Generado el: ${new Date().toLocaleString()}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // Function removed: resubmitDeposit - users should use "Apelar" instead for better workflow

    getStatusText(status) {
        const statusMap = {
            completed: 'Completada',
            pending: 'Pendiente',
            failed: 'Fallida',
            cancelled: 'Cancelada',
            resubmit_required: 'Requiere nueva imagen'
        };
        return statusMap[status] || status;
    }

    closeDepositModal() {
        const modal = document.getElementById('depositModal');
        if (modal) {
            modal.classList.remove('active');
            this.selectedBank = null;

            // Reset UI
            document.querySelectorAll('.bank-option').forEach(option => {
                option.classList.remove('selected');
            });

            const depositForm = document.getElementById('depositForm');
            if (depositForm) {
                depositForm.style.display = 'none';
                depositForm.querySelector('form')?.reset();
            }
        }
    }

    showWithdrawModal() {
        const modal = document.getElementById('withdrawModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('withdrawAmount').focus();
        }
    }


    showStakingModal() {
        // Redirect to staking page for LTD tokens
        window.location.href = 'staking.html';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // ================================
    // ✅ VALIDATION
    // ================================

    async validateSendForm(formData) {
        if (!formData.recipient || !formData.recipient.includes('@')) {
            walletInstance.showError('Por favor ingresa un email válido');
            return false;
        }

        // Validar que sea usuario interno de La Tanda
        try {
            const userValidation = await this.validateInternalUser(formData.recipient);
            if (!userValidation.valid) {
                walletInstance.showError(`❌ ${userValidation.message}. Solo se permiten transferencias entre usuarios de La Tanda.`);
                return false;
            } else {
                // Mostrar confirmación del usuario válido
            }
        } catch (error) {
            walletInstance.showError('Error validando destinatario. Por favor intenta de nuevo.');
            return false;
        }

        if (!formData.amount || formData.amount <= 0) {
            walletInstance.showError('Por favor ingresa un monto válido');
            return false;
        }

        if (formData.amount > this.balances[formData.currency]) {
            walletInstance.showError('Saldo insuficiente');
            return false;
        }

        return true;
    }

    validateRecipientRealTime() {
        const recipientInput = document.getElementById('recipientEmail');
        if (!recipientInput) return;

        const email = recipientInput.value.trim();

        // Clear previous feedback and classes
        recipientInput.classList.remove('valid-user', 'invalid-user', 'validating-user');

        // Remove existing feedback elements
        const existingFeedback = recipientInput.parentNode.querySelector('.recipient-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Cancel previous validation request
        if (this.validationAbortController) {
            this.validationAbortController.abort();
        }

        // Clear debounce timeout
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }

        // Only validate if email looks valid
        if (email.length > 3 && email.includes('@')) {
            // Show loading state immediately for cached results
            if (this.featureFlags.useApiUserValidation && !this.getCachedUserValidation(email)) {
                recipientInput.classList.add('validating-user');
                this.showValidationFeedback(recipientInput, '🔄 Validating user...', 'loading');
            }

            // Debounce validation calls (500ms delay)
            this.validationTimeout = setTimeout(async () => {
                try {
                    const userValidation = await this.validateInternalUser(email);

                    // Check if input value hasn't changed during async operation
                    const currentEmail = recipientInput.value.trim();
                    if (currentEmail !== email) {
                        return; // User continued typing, ignore this result
                    }

                    recipientInput.classList.remove('validating-user');
                    this.showValidationResult(recipientInput, userValidation);

                } catch (error) {
                    recipientInput.classList.remove('validating-user');
                    this.showValidationFeedback(recipientInput, '❌ Error validating user', 'error');
                }
            }, 500);
        }
    }

    showValidationResult(recipientInput, userValidation) {
        if (userValidation.valid) {
            recipientInput.classList.add('valid-user');
            this.showValidationFeedback(recipientInput, `✅ ${userValidation.message}`, 'success');
        } else {
            recipientInput.classList.add('invalid-user');
            this.showValidationFeedback(recipientInput, `❌ ${userValidation.message}`, 'error');
        }
    }

    showValidationFeedback(recipientInput, message, type) {
        // Remove existing feedback
        const existingFeedback = recipientInput.parentNode.querySelector('.recipient-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Create new feedback element
        const feedback = document.createElement('div');
        feedback.className = 'recipient-feedback';
        feedback.style.fontSize = '12px';
        feedback.style.marginTop = '5px';
        feedback.style.padding = '5px 8px';
        feedback.style.borderRadius = '4px';
        feedback.style.fontWeight = '500';
        feedback.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        feedback.textContent = message;

        // Style based on feedback type
        switch (type) {
            case 'success':
                feedback.style.color = '#10b981';
                feedback.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                break;
            case 'error':
                feedback.style.color = '#ef4444';
                feedback.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                feedback.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                break;
            case 'loading':
                feedback.style.color = '#3b82f6';
                feedback.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                feedback.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                // Add loading animation
                feedback.style.position = 'relative';
                feedback.style.overflow = 'hidden';

                // Create loading shimmer effect
                const shimmer = document.createElement('div');
                shimmer.style.position = 'absolute';
                shimmer.style.top = '0';
                shimmer.style.left = '-100%';
                shimmer.style.width = '100%';
                shimmer.style.height = '100%';
                shimmer.style.background = 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent)';
                shimmer.style.animation = 'shimmer 1.5s infinite';
                feedback.appendChild(shimmer);
                break;
        }

        recipientInput.parentNode.appendChild(feedback);

        // Add shimmer animation keyframes to document if not exists
        if (type === 'loading' && !document.querySelector('#validation-shimmer-styles')) {
            const style = document.createElement('style');
            style.id = 'validation-shimmer-styles';
            style.textContent = `
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }

                /* Enhanced input validation states */
                .validating-user {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2) !important;
                }

                .valid-user {
                    border-color: #10b981 !important;
                    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2) !important;
                }

                .invalid-user {
                    border-color: #ef4444 !important;
                    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }


    // ================================
    // ⚙️ WALLET SETTINGS FUNCTIONALITY
    // ================================

    // Home navigation
    goHome() {
        window.location.href = 'home-dashboard.html';
    }

    // Balance visibility toggle
    toggleBalanceVisibility() {
        this.walletSettings.balanceVisible = !this.walletSettings.balanceVisible;
        localStorage.setItem('balanceVisible', this.walletSettings.balanceVisible.toString());

        this.updateBalanceDisplay();
        this.updateBalanceToggleIcon();

        this.showSuccess(
            this.walletSettings.balanceVisible ?
            'Balance visible' :
            'Balance oculto por privacidad'
        );
    }

    updateBalanceToggleIcon() {
        const balanceIcon = document.getElementById('balanceIcon');
        const balanceToggle = document.getElementById('balanceToggle');

        if (balanceIcon && balanceToggle) {
            if (this.walletSettings.balanceVisible) {
                balanceIcon.className = 'fas fa-eye';
            } else {
                balanceIcon.className = 'fas fa-eye-slash';
            }
            // Toggle button should ALWAYS stay visible
        }
    }

    getBalanceVisibility() {
        const stored = localStorage.getItem('balanceVisible');
        // Always default to visible unless explicitly set to false
        return stored !== null ? stored === 'true' : true; // Default to visible
    }

    // Wallet settings dropdown
    toggleWalletSettings() {
        const dropdown = document.getElementById('walletSettingsDropdown');
        if (dropdown) {
            this.walletSettings.settingsDropdownOpen = !this.walletSettings.settingsDropdownOpen;

            if (this.walletSettings.settingsDropdownOpen) {
                dropdown.classList.add('active');
                this.updateSettingsDisplay();
            } else {
                dropdown.classList.remove('active');
            }
        }
    }

    closeWalletSettings() {
        const dropdown = document.getElementById('walletSettingsDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
            this.walletSettings.settingsDropdownOpen = false;
        }
    }

    updateSettingsDisplay() {
        // Update currency preference display
        const currencyElement = document.getElementById('currencyPreference');
        if (currencyElement) {
            currencyElement.textContent = this.walletSettings.currencyPreference;
        }

        // Update notification toggle display
        const notificationElement = document.getElementById('notificationToggle');
        if (notificationElement) {
            notificationElement.textContent = this.walletSettings.notificationsEnabled ? 'ON' : 'OFF';
            notificationElement.classList.toggle('off', !this.walletSettings.notificationsEnabled);
        }
    }

    // Settings actions
    toggleCurrencyPreference() {
        const currencies = ['USD', 'HNL'];
        const currentIndex = currencies.indexOf(this.walletSettings.currencyPreference);
        const nextIndex = (currentIndex + 1) % currencies.length;
        const oldCurrency = this.walletSettings.currencyPreference;

        this.walletSettings.currencyPreference = currencies[nextIndex];
        localStorage.setItem('currencyPreference', this.walletSettings.currencyPreference);

        // Update all currency-dependent displays
        this.updateSettingsDisplay();
        this.updateBalanceDisplay();
        this.updateTransactionHistory();

        // Update send/receive modals if open
        this.updateModalCurrencyDefaults();

        // Show success message
        this.showSuccess(`Moneda principal cambiada de ${oldCurrency} a ${this.walletSettings.currencyPreference}`);
    }

    updateModalCurrencyDefaults() {
        // Update currency selects in modals to default to preferred currency
        const currencySelects = ['sendCurrency', 'receiveCurrency', 'depositCurrency', 'withdrawCurrency'];

        currencySelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select && select.value !== this.walletSettings.currencyPreference) {
                // Only update if the preferred currency is available as an option
                const option = select.querySelector(`option[value="${this.walletSettings.currencyPreference}"]`);
                if (option) {
                    select.value = this.walletSettings.currencyPreference;
                    // Trigger any dependent calculations
                    if (selectId === 'sendCurrency') this.calculateSendFees();
                    if (selectId === 'withdrawCurrency') this.calculateWithdrawalFees();
                }
            }
        });
    }

    toggleNotifications() {
        this.walletSettings.notificationsEnabled = !this.walletSettings.notificationsEnabled;
        localStorage.setItem('notificationsEnabled', JSON.stringify(this.walletSettings.notificationsEnabled));

        this.updateSettingsDisplay();

        if (this.walletSettings.notificationsEnabled) {
            this.showNotification('Notificaciones activadas', 'success');
            // Request notification permission if not granted
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        } else {
            // Show one last notification before disabling
            this.showNotification('Notificaciones desactivadas', 'info');
        }
    }

    showSecuritySettings() {
        this.closeWalletSettings();
        this.showSecuritySettingsModal();
    }

    showSecuritySettingsModal() {
        // Check if modal already exists
        let modal = document.getElementById('securitySettingsModal');
        if (!modal) {
            modal = this.createSecuritySettingsModal();
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
    }

    createSecuritySettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'securitySettingsModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-shield-alt"></i> Configuración de Seguridad</h3>
                    <button class="modal-close" onclick="this.closest('.modal').classList.remove('active')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="security-section">
                        <h4><i class="fas fa-lock"></i> PIN de Transacciones</h4>
                        <p class="section-description">Protege tus transacciones con un PIN de seguridad</p>
                        <div class="security-setting">
                            <div class="setting-info">
                                <span>PIN habilitado</span>
                                <p>Requerirá PIN para transacciones mayores a $50 USD</p>
                            </div>
                            <div class="setting-control">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="pinEnabledToggle" ${this.walletSettings.pinEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="pin-setup" id="pinSetupSection" style="display: ${this.walletSettings.pinEnabled ? 'block' : 'none'}">
                            <button class="btn-secondary" onclick="walletInstance.showPinSetupModal()">
                                ${this.walletSettings.pinCode ? 'Cambiar PIN' : 'Configurar PIN'}
                            </button>
                        </div>
                    </div>

                    <div class="security-section">
                        <h4><i class="fas fa-clock"></i> Auto-bloqueo</h4>
                        <p class="section-description">Bloquea automáticamente el wallet después de inactividad</p>
                        <div class="security-setting">
                            <div class="setting-info">
                                <span>Tiempo de auto-bloqueo</span>
                                <p>Wallet se bloqueará automáticamente</p>
                            </div>
                            <div class="setting-control">
                                <select id="autoLockTimeSelect" onchange="walletInstance.updateAutoLockTime(this.value)">
                                    <option value="300000" ${this.walletSettings.autoLockTime === 300000 ? 'selected' : ''}>5 minutos</option>
                                    <option value="900000" ${this.walletSettings.autoLockTime === 900000 ? 'selected' : ''}>15 minutos</option>
                                    <option value="1800000" ${this.walletSettings.autoLockTime === 1800000 ? 'selected' : ''}>30 minutos</option>
                                    <option value="3600000" ${this.walletSettings.autoLockTime === 3600000 ? 'selected' : ''}>1 hora</option>
                                    <option value="0" ${this.walletSettings.autoLockTime === 0 ? 'selected' : ''}>Nunca</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="security-section">
                        <h4><i class="fas fa-history"></i> Actividad de Seguridad</h4>
                        <p class="section-description">Historial reciente de actividad de seguridad</p>
                        <div class="security-activity" id="securityActivity">
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-sign-in-alt"></i>
                                </div>
                                <div class="activity-details">
                                    <span>Último inicio de sesión</span>
                                    <small>Hoy ${this.formatTime(new Date())}</small>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-key"></i>
                                </div>
                                <div class="activity-details">
                                    <span>PIN ${this.walletSettings.pinCode ? 'configurado' : 'no configurado'}</span>
                                    <small>${this.walletSettings.pinCode ? 'Activo' : 'Pendiente configuración'}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').classList.remove('active')">Cerrar</button>
                        <button type="button" class="btn-primary" onclick="walletInstance.lockWalletNow()">Bloquear Ahora</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listener for PIN toggle
        modal.querySelector('#pinEnabledToggle').addEventListener('change', (e) => {
            this.togglePinSecurity(e.target.checked);
        });

        return modal;
    }

    showPinSetupModal() {
        let modal = document.getElementById('pinSetupModal');
        if (!modal) {
            modal = this.createPinSetupModal();
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
    }

    createPinSetupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'pinSetupModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-key"></i> Configurar PIN de Seguridad</h3>
                    <button class="modal-close" onclick="this.closest('.modal').classList.remove('active')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="pin-setup-form">
                        <div class="input-group">
                            <label for="newPin">Nuevo PIN (4-6 dígitos)</label>
                            <input type="password" id="newPin" maxlength="6" pattern="[0-9]*" placeholder="••••" class="pin-input">
                        </div>
                        <div class="input-group">
                            <label for="confirmPin">Confirmar PIN</label>
                            <input type="password" id="confirmPin" maxlength="6" pattern="[0-9]*" placeholder="••••" class="pin-input">
                        </div>
                        <div class="pin-requirements">
                            <p><i class="fas fa-info-circle"></i> El PIN debe tener entre 4 y 6 dígitos numéricos</p>
                            <p><i class="fas fa-shield-alt"></i> Se requerirá para transacciones mayores a $50 USD</p>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').classList.remove('active')">Cancelar</button>
                        <button type="button" class="btn-primary" onclick="walletInstance.setupPin()">Configurar PIN</button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    togglePinSecurity(enabled) {
        this.walletSettings.pinEnabled = enabled;
        localStorage.setItem('pinEnabled', JSON.stringify(enabled));

        const pinSetupSection = document.getElementById('pinSetupSection');
        if (pinSetupSection) {
            pinSetupSection.style.display = enabled ? 'block' : 'none';
        }

        if (enabled && !this.walletSettings.pinCode) {
            this.showPinSetupModal();
        }

        this.showNotification(
            enabled ? 'Seguridad PIN activada' : 'Seguridad PIN desactivada',
            'success'
        );
    }

    setupPin() {
        const newPin = document.getElementById('newPin').value;
        const confirmPin = document.getElementById('confirmPin').value;

        if (!newPin || newPin.length < 4 || newPin.length > 6) {
            walletInstance.showError('El PIN debe tener entre 4 y 6 dígitos');
            return;
        }

        if (!/^[0-9]+$/.test(newPin)) {
            walletInstance.showError('El PIN solo puede contener números');
            return;
        }

        if (newPin !== confirmPin) {
            walletInstance.showError('Los PINs no coinciden');
            return;
        }

        // In production, hash the PIN before storing
        this.walletSettings.pinCode = newPin;
        localStorage.setItem('pinCode', newPin);

        // Close modals
        document.getElementById('pinSetupModal').classList.remove('active');
        const securityModal = document.getElementById('securitySettingsModal');
        if (securityModal) {
            securityModal.classList.remove('active');
        }

        walletInstance.showSuccess('PIN configurado exitosamente');
        this.sendSecurityNotification('PIN de seguridad configurado correctamente');
    }

    async verifyPin(requiredFor = 'transaction') {
        if (!this.walletSettings.pinEnabled || !this.walletSettings.pinCode) {
            return true;
        }

        return new Promise((resolve) => {
            const modal = this.createPinVerificationModal(requiredFor);
            document.body.appendChild(modal);
            modal.classList.add('active');

            // Store resolve function for later use
            modal.pinResolve = resolve;
        });
    }

    createPinVerificationModal(purpose) {
        const modal = document.createElement('div');
        modal.className = 'modal pin-verification-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-lock"></i> Verificación de Seguridad</h3>
                </div>
                <div class="modal-body">
                    <div class="pin-verification">
                        <p class="verification-message">Ingresa tu PIN para ${purpose}</p>
                        <div class="pin-dots" id="pinDots">
                            <span class="pin-dot"></span>
                            <span class="pin-dot"></span>
                            <span class="pin-dot"></span>
                            <span class="pin-dot"></span>
                            <span class="pin-dot"></span>
                            <span class="pin-dot"></span>
                        </div>
                        <input type="password" id="pinVerificationInput" maxlength="6" class="pin-input-hidden" autofocus>
                        <div class="pin-keypad">
                            <button onclick="walletInstance.addPinDigit('1')">1</button>
                            <button onclick="walletInstance.addPinDigit('2')">2</button>
                            <button onclick="walletInstance.addPinDigit('3')">3</button>
                            <button onclick="walletInstance.addPinDigit('4')">4</button>
                            <button onclick="walletInstance.addPinDigit('5')">5</button>
                            <button onclick="walletInstance.addPinDigit('6')">6</button>
                            <button onclick="walletInstance.addPinDigit('7')">7</button>
                            <button onclick="walletInstance.addPinDigit('8')">8</button>
                            <button onclick="walletInstance.addPinDigit('9')">9</button>
                            <button onclick="walletInstance.clearPin()" class="clear-btn">⌫</button>
                            <button onclick="walletInstance.addPinDigit('0')">0</button>
                            <button onclick="walletInstance.submitPin()" class="submit-btn">✓</button>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="walletInstance.cancelPinVerification()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    addPinDigit(digit) {
        const input = document.getElementById('pinVerificationInput');
        if (input && input.value.length < 6) {
            input.value += digit;
            this.updatePinDots(input.value.length);
        }
    }

    clearPin() {
        const input = document.getElementById('pinVerificationInput');
        if (input) {
            input.value = input.value.slice(0, -1);
            this.updatePinDots(input.value.length);
        }
    }

    updatePinDots(length) {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index < length);
        });
    }

    submitPin() {
        const input = document.getElementById('pinVerificationInput');
        const modal = document.querySelector('.pin-verification-modal');

        // Check if locked out
        if (Date.now() < this.walletSettings.pinLockoutUntil) {
            const remainingSeconds = Math.ceil((this.walletSettings.pinLockoutUntil - Date.now()) / 1000);
            walletInstance.showError(`Demasiados intentos. Espera ${remainingSeconds} segundos.`);
            input.value = '';
            this.updatePinDots(0);
            return;
        }

        if (input.value === this.walletSettings.pinCode) {
            // Reset attempts on success
            this.walletSettings.pinAttempts = 0;
            modal.pinResolve(true);
            modal.remove();
            walletInstance.showSuccess('PIN verificado correctamente');
        } else {
            // Increment failed attempts
            this.walletSettings.pinAttempts++;
            const remainingAttempts = this.walletSettings.maxPinAttempts - this.walletSettings.pinAttempts;
            
            if (remainingAttempts <= 0) {
                // Lock out user
                this.walletSettings.pinLockoutUntil = Date.now() + this.walletSettings.pinLockoutDuration;
                this.walletSettings.pinAttempts = 0;
                walletInstance.showError('Bloqueado por 30 segundos debido a intentos fallidos');
                this.sendSecurityNotification('Múltiples intentos de PIN fallidos detectados');
            } else {
                walletInstance.showError(`PIN incorrecto. ${remainingAttempts} intento(s) restante(s).`);
            }
            
            input.value = '';
            this.updatePinDots(0);
            // Add shake animation
            const dots = document.getElementById('pinDots');
            dots.style.animation = 'shake 0.5s';
            setTimeout(() => dots.style.animation = '', 500);
        }
    }
    cancelPinVerification() {
        const modal = document.querySelector('.pin-verification-modal');
        if (modal) {
            modal.pinResolve(false);
            modal.remove();
        }
    }

    updateAutoLockTime(timeMs) {
        this.walletSettings.autoLockTime = parseInt(timeMs);
        localStorage.setItem('autoLockTime', timeMs);
        this.setupAutoLock();

        const timeText = timeMs === '0' ? 'Nunca' :
                        timeMs === '300000' ? '5 minutos' :
                        timeMs === '900000' ? '15 minutos' :
                        timeMs === '1800000' ? '30 minutos' : '1 hora';

        this.showSuccess(`Auto-bloqueo configurado: ${timeText}`);
    }

    setupAutoLock() {
        if (this.autoLockTimer) {
            clearTimeout(this.autoLockTimer);
        }
        if (this.autoLockWarningTimer) {
            clearTimeout(this.autoLockWarningTimer);
        }

        if (this.walletSettings.autoLockTime > 0) {
            // Show warning 2 minutes before lock
            const warningTime = this.walletSettings.autoLockTime - 120000;
            if (warningTime > 0) {
                this.autoLockWarningTimer = setTimeout(() => {
                    if (!this.walletSettings.isLocked) {
                        this.showWarning("Tu sesión se bloqueará en 2 minutos por inactividad");
                    }
                }, warningTime);
            }

            this.autoLockTimer = setTimeout(() => {
                this.lockWallet();
            }, this.walletSettings.autoLockTime);
        }
    }

    setupSecurityMonitoring() {
        // Track user activity to reset auto-lock timer
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.walletSettings.lastActivity = Date.now();
                if (!this.walletSettings.isLocked) {
                    this.setupAutoLock();
                }
            }, { passive: true });
        });
    }

    lockWallet() {
        this.walletSettings.isLocked = true;
        this.showLockScreen();
        this.sendSecurityNotification('Wallet bloqueado automáticamente por inactividad');
    }

    lockWalletNow() {
        // Close security settings modal
        const modal = document.getElementById('securitySettingsModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.lockWallet();
    }

    showLockScreen() {
        // Create lock screen overlay
        let lockScreen = document.getElementById('walletLockScreen');
        if (!lockScreen) {
            lockScreen = document.createElement('div');
            lockScreen.id = 'walletLockScreen';
            lockScreen.className = 'wallet-lock-screen';
            lockScreen.innerHTML = `
                <div class="lock-screen-content">
                    <div class="lock-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h2>Wallet Bloqueado</h2>
                    <p>Ingresa tu PIN para desbloquear</p>
                    <button class="btn-primary" onclick="walletInstance.unlockWallet()">Desbloquear</button>
                </div>
            `;
            document.body.appendChild(lockScreen);
        }
        lockScreen.style.display = 'flex';
    }

    async unlockWallet() {
        const verified = await this.verifyPin('desbloquear wallet');
        if (verified) {
            this.walletSettings.isLocked = false;
            const lockScreen = document.getElementById('walletLockScreen');
            if (lockScreen) {
                lockScreen.style.display = 'none';
            }
            this.setupAutoLock();
            walletInstance.showSuccess('Wallet desbloqueado');
        }
    }

    exportWalletData() {
        this.closeWalletSettings();
        this.showExportModal();
    }

    showExportModal() {
        let modal = document.getElementById('exportModal');
        if (!modal) {
            modal = this.createExportModal();
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
    }

    createExportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'exportModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-download"></i> Exportar Datos del Wallet</h3>
                    <button class="modal-close" onclick="this.closest('.modal').classList.remove('active')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="export-options">
                        <div class="export-section">
                            <h4><i class="fas fa-file-alt"></i> Formato de Exportación</h4>
                            <div class="format-options">
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="json" checked>
                                    <div class="format-info">
                                        <span class="format-name">JSON</span>
                                        <small>Archivo completo con todos los datos</small>
                                    </div>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="csv">
                                    <div class="format-info">
                                        <span class="format-name">CSV</span>
                                        <small>Tabla compatible con Excel</small>
                                    </div>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="pdf">
                                    <div class="format-info">
                                        <span class="format-name">PDF</span>
                                        <small>Reporte formateado para imprimir</small>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4><i class="fas fa-calendar-alt"></i> Rango de Fechas</h4>
                            <div class="date-range">
                                <div class="input-group">
                                    <label for="exportStartDate">Fecha de inicio</label>
                                    <input type="date" id="exportStartDate" value="${this.getDateMonthsAgo(3)}">
                                </div>
                                <div class="input-group">
                                    <label for="exportEndDate">Fecha de fin</label>
                                    <input type="date" id="exportEndDate" value="${this.getTodayDate()}">
                                </div>
                                <div class="quick-dates">
                                    <button type="button" onclick="walletInstance.setQuickDateRange('week')">7 días</button>
                                    <button type="button" onclick="walletInstance.setQuickDateRange('month')">30 días</button>
                                    <button type="button" onclick="walletInstance.setQuickDateRange('quarter')">3 meses</button>
                                    <button type="button" onclick="walletInstance.setQuickDateRange('all')">Todo</button>
                                </div>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4><i class="fas fa-list"></i> Contenido a Exportar</h4>
                            <div class="content-options">
                                <label class="content-option">
                                    <input type="checkbox" id="includeBalances" checked>
                                    <span>Balances Actuales</span>
                                </label>
                                <label class="content-option">
                                    <input type="checkbox" id="includeTransactions" checked>
                                    <span>Historial de Transacciones</span>
                                </label>
                                <label class="content-option">
                                    <input type="checkbox" id="includeTandas">
                                    <span>Participación en Tandas</span>
                                </label>
                                <label class="content-option">
                                    <input type="checkbox" id="includeSettings">
                                    <span>Configuración del Wallet</span>
                                </label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4><i class="fas fa-envelope"></i> Opciones Adicionales</h4>
                            <div class="additional-options">
                                <label class="content-option">
                                    <input type="checkbox" id="compressExport">
                                    <span>Comprimir archivo (ZIP)</span>
                                </label>
                                <label class="content-option">
                                    <input type="checkbox" id="encryptExport">
                                    <span>Cifrar con contraseña</span>
                                </label>
                                <div class="encrypt-password" id="encryptPasswordSection" style="display: none;">
                                    <input type="password" id="exportPassword" placeholder="Contraseña para cifrado">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').classList.remove('active')">Cancelar</button>
                        <button type="button" class="btn-primary" onclick="walletInstance.processExport()">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('#encryptExport').addEventListener('change', (e) => {
            const passwordSection = modal.querySelector('#encryptPasswordSection');
            passwordSection.style.display = e.target.checked ? 'block' : 'none';
        });

        return modal;
    }

    getDateMonthsAgo(months) {
        const date = new Date();
        date.setMonth(date.getMonth() - months);
        return date.toISOString().split('T')[0];
    }

    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    setQuickDateRange(range) {
        const endDate = new Date();
        let startDate = new Date();

        switch (range) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'quarter':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case 'all':
                startDate = new Date('2020-01-01'); // Very old date
                break;
        }

        document.getElementById('exportStartDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('exportEndDate').value = endDate.toISOString().split('T')[0];
    }

    async processExport() {
        try {
            walletInstance.showLoading('Generando exportación...');

            // Get export parameters
            const format = document.querySelector('input[name="exportFormat"]:checked').value;
            const startDate = new Date(document.getElementById('exportStartDate').value);
            const endDate = new Date(document.getElementById('exportEndDate').value);
            const includeBalances = document.getElementById('includeBalances').checked;
            const includeTransactions = document.getElementById('includeTransactions').checked;
            const includeTandas = document.getElementById('includeTandas').checked;
            const includeSettings = document.getElementById('includeSettings').checked;
            const compress = document.getElementById('compressExport').checked;
            const encrypt = document.getElementById('encryptExport').checked;
            const password = document.getElementById('exportPassword').value;

            // Validate
            if (encrypt && !password) {
                walletInstance.showError('Por favor ingresa una contraseña para el cifrado');
                return;
            }

            // Filter transactions by date range
            const filteredTransactions = this.transactionHistory.filter(tx => {
                const txDate = new Date(tx.timestamp);
                return txDate >= startDate && txDate <= endDate;
            });

            // Build export data
            const exportData = {
                exportInfo: {
                    format,
                    generated: new Date().toISOString(),
                    dateRange: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString()
                    },
                    preferredCurrency: this.walletSettings.currencyPreference
                }
            };

            if (includeBalances) {
                exportData.balances = {
                    ...this.balances,
                    totalInUSD: this.balances.USD +
                               (this.balances.HNL * this.exchangeRates.HNL_USD) +
                               (0) // LTD removed * this.exchangeRates.LTD_USD
                };
            }

            if (includeTransactions) {
                exportData.transactions = filteredTransactions;
                exportData.transactionSummary = this.generateTransactionSummary(filteredTransactions);
            }

            if (includeTandas) {
                exportData.tandas = this.getTandaParticipation();
            }

            if (includeSettings) {
                exportData.settings = {
                    currencyPreference: this.walletSettings.currencyPreference,
                    notificationsEnabled: this.walletSettings.notificationsEnabled,
                    // Don't export sensitive security settings
                };
            }

            // Generate file based on format
            let fileName, mimeType, fileContent;

            switch (format) {
                case 'json':
                    fileName = `wallet-export-${this.getTodayDate()}.json`;
                    mimeType = 'application/json';
                    fileContent = JSON.stringify(exportData, null, 2);
                    break;
                case 'csv':
                    fileName = `wallet-transactions-${this.getTodayDate()}.csv`;
                    mimeType = 'text/csv';
                    fileContent = this.generateCSV(exportData);
                    break;
                case 'pdf':
                    fileName = `wallet-report-${this.getTodayDate()}.pdf`;
                    mimeType = 'application/pdf';
                    fileContent = await this.generatePDF(exportData);
                    break;
            }

            // Create and download file
            const blob = new Blob([fileContent], { type: mimeType });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();

            URL.revokeObjectURL(url);

            // Close modal
            document.getElementById('exportModal').classList.remove('active');

            this.showSuccess(`Exportación ${format.toUpperCase()} generada exitosamente`);

        } catch (error) {
            walletInstance.showError('Error al generar la exportación');
        } finally {
            walletInstance.hideLoading();
        }
    }

    generateCSV(exportData) {
        let csv = '';

        // Add balances section
        if (exportData.balances) {
            csv += 'BALANCES\n';
            csv += 'Moneda,Monto\n';
            csv += `USD,${exportData.balances.USD}\n`;
            csv += `HNL,${exportData.balances.HNL}\n`;
            csv += `LTD,${exportData.balances.LTD}\n`;
            csv += `Total (USD),${exportData.balances.totalInUSD}\n\n`;
        }

        // Add transactions section
        if (exportData.transactions) {
            csv += 'TRANSACCIONES\n';
            csv += 'Fecha,Tipo,Descripción,Monto,Moneda,Estado,Comisión,Destinatario\n';

            exportData.transactions.forEach(tx => {
                const date = new Date(tx.timestamp).toLocaleDateString('es-HN');
                const recipient = tx.recipient || '';
                csv += `"${date}","${tx.type}","${tx.description}",${tx.amount},"${tx.currency}","${tx.status}",${tx.fee || 0},"${recipient}"\n`;
            });
        }

        return csv;
    }

    async generatePDF(exportData) {
        // For demo purposes, return a simple text representation
        // In production, you would use a PDF library like jsPDF
        let pdfContent = `REPORTE DEL WALLET LA TANDA\n`;
        pdfContent += `Generado: ${new Date().toLocaleString('es-HN')}\n\n`;

        if (exportData.balances) {
            pdfContent += `BALANCES ACTUALES\n`;
            pdfContent += `-----------------\n`;
            pdfContent += `USD: $${this.formatCurrency(exportData.balances.USD)}\n`;
            pdfContent += `HNL: L ${this.formatCurrency(exportData.balances.HNL)}\n`;
            pdfContent += `LTD: ${this.formatCurrency(exportData.balances.LTD)}\n`;
            pdfContent += `Total (USD): $${this.formatCurrency(exportData.balances.totalInUSD)}\n\n`;
        }

        if (exportData.transactionSummary) {
            pdfContent += `RESUMEN DE TRANSACCIONES\n`;
            pdfContent += `------------------------\n`;
            pdfContent += `Total de transacciones: ${exportData.transactionSummary.total}\n`;
            pdfContent += `Depósitos: ${exportData.transactionSummary.deposits}\n`;
            pdfContent += `Retiros: ${exportData.transactionSummary.withdrawals}\n`;
            pdfContent += `Transferencias: ${exportData.transactionSummary.transfers}\n\n`;
        }

        return pdfContent;
    }

    generateTransactionSummary(transactions) {
        return {
            total: transactions.length,
            deposits: transactions.filter(tx => tx.type === 'deposit').length,
            withdrawals: transactions.filter(tx => tx.type === 'withdrawal').length,
            transfers: transactions.filter(tx => tx.type === 'transfer').length,
            totalVolume: transactions.reduce((sum, tx) => {
                const usdAmount = tx.currency === 'USD' ? tx.amount :
                                tx.currency === 'HNL' ? tx.amount * this.exchangeRates.HNL_USD :
                                tx.amount * this.exchangeRates.LTD_USD;
                return sum + usdAmount;
            }, 0)
        };
    }

    getTandaParticipation() {
        // Mock tanda data - in production this would come from API
        return [
            {
                tandaId: 'TANDA-001',
                name: 'Tanda Familiar',
                position: 3,
                totalParticipants: 10,
                monthlyAmount: 100,
                currency: 'USD',
                status: 'active',
                nextPayment: '2024-02-15'
            }
        ];
    }

    showPrivacySettings() {
        this.closeWalletSettings();
        this.showPrivacySettingsModal();
    }

    showPrivacySettingsModal() {
        let modal = document.getElementById('privacySettingsModal');
        if (!modal) {
            modal = this.createPrivacySettingsModal();
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
    }

    createPrivacySettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'privacySettingsModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-secret"></i> Configuración de Privacidad</h3>
                    <button class="modal-close" onclick="this.closest('.modal').classList.remove('active')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="privacy-section">
                        <h4><i class="fas fa-eye"></i> Visibilidad de Balance</h4>
                        <div class="privacy-setting">
                            <div class="setting-info">
                                <span>Balance visible por defecto</span>
                                <p>El balance se mostrará al iniciar la aplicación</p>
                            </div>
                            <div class="setting-control">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="defaultBalanceVisibility" ${this.walletSettings.defaultBalanceVisibility ? 'checked' : ''} onchange="walletInstance.updateDefaultBalanceVisibility(this.checked)">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="privacy-section">
                        <h4><i class="fas fa-history"></i> Privacidad de Transacciones</h4>
                        <div class="privacy-setting">
                            <div class="setting-info">
                                <span>Nivel de privacidad</span>
                                <p>Controla qué información se muestra en el historial</p>
                            </div>
                            <div class="setting-control">
                                <select id="transactionPrivacy" onchange="walletInstance.updateTransactionPrivacy(this.value)">
                                    <option value="normal" ${this.walletSettings.transactionPrivacy === 'normal' ? 'selected' : ''}>Normal</option>
                                    <option value="private" ${this.walletSettings.transactionPrivacy === 'private' ? 'selected' : ''}>Privado</option>
                                    <option value="minimal" ${this.walletSettings.transactionPrivacy === 'minimal' ? 'selected' : ''}>Mínimo</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="privacy-section">
                        <h4><i class="fas fa-chart-bar"></i> Analíticas</h4>
                        <div class="privacy-setting">
                            <div class="setting-info">
                                <span>Desactivar analíticas</span>
                                <p>No compartir datos de uso anónimos</p>
                            </div>
                            <div class="setting-control">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="analyticsOptOut" ${this.walletSettings.analyticsOptOut ? 'checked' : ''} onchange="walletInstance.updateAnalyticsOptOut(this.checked)">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="privacy-section">
                        <h4><i class="fas fa-camera"></i> Protección de Pantalla</h4>
                        <div class="privacy-setting">
                            <div class="setting-info">
                                <span>Protección contra capturas</span>
                                <p>Oculta información sensible en capturas de pantalla</p>
                            </div>
                            <div class="setting-control">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="screenshotProtection" ${this.walletSettings.screenshotProtection ? 'checked' : ''} onchange="walletInstance.updateScreenshotProtection(this.checked)">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="privacy-section">
                        <h4><i class="fas fa-mask"></i> Modo Incógnito</h4>
                        <div class="privacy-setting">
                            <div class="setting-info">
                                <span>Activar modo incógnito</span>
                                <p>Oculta todos los balances y datos sensibles temporalmente</p>
                            </div>
                            <div class="setting-control">
                                <button class="btn-secondary ${this.walletSettings.incognitoMode ? 'active' : ''}" onclick="walletInstance.toggleIncognitoMode()" id="incognitoBtn">
                                    ${this.walletSettings.incognitoMode ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').classList.remove('active')">Cerrar</button>
                        <button type="button" class="btn-primary" onclick="walletInstance.clearPrivacyData()">Limpiar Datos de Sesión</button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    updateDefaultBalanceVisibility(visible) {
        this.walletSettings.defaultBalanceVisibility = visible;
        localStorage.setItem('defaultBalanceVisibility', JSON.stringify(visible));
        this.showSuccess(`Balance ${visible ? 'visible' : 'oculto'} por defecto`);
    }

    updateTransactionPrivacy(level) {
        this.walletSettings.transactionPrivacy = level;
        localStorage.setItem('transactionPrivacy', level);
        this.updateTransactionHistory();

        const levels = {
            normal: 'Información completa',
            private: 'Información limitada',
            minimal: 'Solo montos'
        };

        this.showSuccess(`Privacidad de transacciones: ${levels[level]}`);
    }

    updateAnalyticsOptOut(optOut) {
        this.walletSettings.analyticsOptOut = optOut;
        localStorage.setItem('analyticsOptOut', JSON.stringify(optOut));
        this.showSuccess(optOut ? 'Analíticas desactivadas' : 'Analíticas activadas');
    }

    updateScreenshotProtection(enabled) {
        this.walletSettings.screenshotProtection = enabled;
        localStorage.setItem('screenshotProtection', JSON.stringify(enabled));

        // Apply screenshot protection styles
        document.body.classList.toggle('screenshot-protected', enabled);

        this.showSuccess(`Protección de captura ${enabled ? 'activada' : 'desactivada'}`);
    }

    toggleIncognitoMode() {
        this.walletSettings.incognitoMode = !this.walletSettings.incognitoMode;

        // Apply incognito styles
        document.body.classList.toggle('incognito-mode', this.walletSettings.incognitoMode);

        // Update button text
        const btn = document.getElementById('incognitoBtn');
        if (btn) {
            btn.textContent = this.walletSettings.incognitoMode ? 'Desactivar' : 'Activar';
            btn.classList.toggle('active', this.walletSettings.incognitoMode);
        }

        // Force balance visibility update
        if (this.walletSettings.incognitoMode) {
            this.walletSettings.balanceVisible = false;
        }
        this.updateBalanceDisplay();

        this.showSuccess(`Modo incógnito ${this.walletSettings.incognitoMode ? 'activado' : 'desactivado'}`);
    }

    clearPrivacyData() {
        // Clear sensitive data from session
        this.notificationHistory = [];
        localStorage.removeItem('notificationHistory');

        // Clear any cached transaction details
        sessionStorage.clear();

        walletInstance.showSuccess('Datos de sesión eliminados');

        // Close modal
        document.getElementById('privacySettingsModal').classList.remove('active');
    }

    // ================================
    // 🔔 NOTIFICATION CENTER
    // ================================

    toggleNotificationCenter() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            const isOpen = dropdown.classList.contains('active');
            if (isOpen) {
                dropdown.classList.remove('active');
            } else {
                dropdown.classList.add('active');
                this.updateNotificationCenter();
                this.markNotificationsAsRead();
            }
        }
    }

    updateNotificationCenter() {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;

        if (this.notificationHistory.length === 0) {
            notificationList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No hay notificaciones del sistema</p>
                    <small>Aquí aparecerán alertas importantes, cambios de tarifas, vencimientos y actualizaciones</small>
                </div>
            `;
            return;
        }

        // Group notifications by category
        const categories = {
            'security': { name: '🔐 Seguridad', notifications: [] },
            'system': { name: '⚙️ Sistema', notifications: [] },
            'tanda': { name: '🎯 Tandas', notifications: [] },
            'account': { name: '👤 Cuenta', notifications: [] },
            'other': { name: '📢 General', notifications: [] }
        };

        // Show last 15 notifications and categorize them
        const recentNotifications = this.notificationHistory.slice(0, 15);
        recentNotifications.forEach(notification => {
            const category = notification.category || 'other';
            if (categories[category]) {
                categories[category].notifications.push(notification);
            } else {
                categories['other'].notifications.push(notification);
            }
        });

        let notificationsHTML = '';

        // Render each category that has notifications
        Object.entries(categories).forEach(([key, category]) => {
            if (category.notifications.length > 0) {
                notificationsHTML += `
                    <div class="notification-category">
                        <div class="category-header">${category.name}</div>
                `;

                category.notifications.forEach(notification => {
                    const timeAgo = this.getTimeAgo(notification.timestamp);
                    const iconClass = notification.type === 'success' ? 'fa-check-circle' :
                                    notification.type === 'error' ? 'fa-exclamation-circle' :
                                    notification.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
                    const priorityClass = notification.priority ? `priority-${notification.priority}` : '';
                    const actionClass = notification.actionRequired ? 'action-required' : '';

                    notificationsHTML += `
                        <div class="notification-item ${notification.read ? '' : 'unread'} ${priorityClass} ${actionClass}" data-id="${notification.id}">
                            <div class="notification-icon ${notification.type}">
                                <i class="fas ${iconClass}"></i>
                            </div>
                            <div class="notification-content">
                                <div class="notification-title">${notification.title}</div>
                                <div class="notification-message">${notification.message}</div>
                                <div class="notification-meta">
                                    <span class="notification-time">${timeAgo}</span>
                                    ${notification.actionRequired ? '<span class="action-badge">Acción requerida</span>' : ''}
                                </div>
                            </div>
                            <button class="notification-remove" onclick="walletInstance.removeNotification('${notification.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                });

                notificationsHTML += '</div>';
            }
        });

        notificationList.innerHTML = notificationsHTML;
    }

    markNotificationsAsRead() {
        this.notificationHistory.forEach(notification => {
            notification.read = true;
        });
        localStorage.setItem('notificationHistory', JSON.stringify(this.notificationHistory));
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        const unreadCount = this.notificationHistory.filter(n => !n.read).length;
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount.toString();
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    removeNotification(notificationId) {
        this.notificationHistory = this.notificationHistory.filter(n => n.id !== notificationId);
        localStorage.setItem('notificationHistory', JSON.stringify(this.notificationHistory));
        this.updateNotificationCenter();
        this.updateNotificationBadge();
    }

    clearAllNotifications() {
        this.notificationHistory = [];
        localStorage.setItem('notificationHistory', JSON.stringify(this.notificationHistory));
        this.updateNotificationCenter();
        this.updateNotificationBadge();
        walletInstance.showSuccess('Todas las notificaciones han sido eliminadas');
    }

    // Add notification to history and update UI
    addNotification(notification) {
        if (!this.notificationHistory) {
            this.notificationHistory = [];
        }

        notification.id = Date.now() + Math.random();
        notification.read = false;
        notification.timestamp = notification.timestamp || new Date();

        // Set default category if not provided
        if (!notification.category) {
            notification.category = 'other';
        }

        this.notificationHistory.unshift(notification);

        // Keep only last 50 notifications
        if (this.notificationHistory.length > 50) {
            this.notificationHistory = this.notificationHistory.slice(0, 50);
        }

        localStorage.setItem('notificationHistory', JSON.stringify(this.notificationHistory));
        this.updateNotificationCenter();
        this.updateNotificationBadge();
    }

    // Add system-specific notifications (separate from transactions)
    addSystemNotification(type, data = {}) {
        const systemNotifications = {
            'fee_update': {
                type: 'info',
                title: '💰 Tarifas Actualizadas',
                message: `Nuevas tarifas de ${data.service}: ${data.oldFee} → ${data.newFee}`,
                category: 'system',
                priority: 'medium'
            },
            'tanda_reminder': {
                type: 'warning',
                title: '⏰ Recordatorio de Tanda',
                message: `Tu aporte a Tanda ${data.tandaName} vence en ${data.daysLeft} días`,
                category: 'tanda',
                priority: 'high',
                actionRequired: true
            },
            'maintenance_notice': {
                type: 'info',
                title: '🔄 Mantenimiento Programado',
                message: `Mantenimiento ${data.date} de ${data.startTime}-${data.endTime}. ${data.impact}`,
                category: 'system',
                priority: 'low'
            },
            'security_alert': {
                type: 'warning',
                title: '🔐 Alerta de Seguridad',
                message: `${data.event} desde ${data.location}. Si no fuiste tú, contacta soporte.`,
                category: 'security',
                priority: 'high'
            },
            'limit_change': {
                type: 'success',
                title: '🎯 Límites Actualizados',
                message: `Tus límites ${data.limitType} han sido ${data.action} a ${data.newLimit}`,
                category: 'account',
                priority: 'medium'
            },
            'kyc_reminder': {
                type: 'warning',
                title: '📋 Verificación Pendiente',
                message: 'Completa tu verificación KYC para acceder a todas las funciones.',
                category: 'account',
                priority: 'medium',
                actionRequired: true
            },
            'balance_alert': {
                type: 'warning',
                title: '💰 Saldo Bajo',
                message: `Tu saldo está por debajo de ${data.threshold}. Considera hacer un depósito.`,
                category: 'account',
                priority: 'medium'
            }
        };

        const notification = systemNotifications[type];
        if (notification) {
            walletInstance.addNotification({
                ...notification,
                timestamp: new Date(),
                ...data // Allow overriding default values
            });
        }
    }

    // Add initial wallet system notifications
    addInitialNotifications() {
        // Force clean notifications for development
        const resetNotifications = true; // Set to false in production
        const hasInitialNotifications = localStorage.getItem('hasInitialNotifications');

        if (!hasInitialNotifications || resetNotifications) {
            // Clear any existing broken notifications first
            this.notificationHistory = [];
            localStorage.removeItem('la_tanda_notifications');

            // Add clean wallet system notifications (not transaction-related)
            this.addNotification({
                type: 'warning',
                title: '⏰ Recordatorio de Tanda',
                message: 'Tu aporte a Tanda #342 vence en 3 días',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                category: 'tanda',
                priority: 'high',
                actionRequired: true
            });

            this.addNotification({
                type: 'info',
                title: '💰 Tarifas Actualizadas',
                message: 'Nuevas tarifas: 1.0% → 0.5%',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                category: 'system',
                priority: 'medium'
            });

            this.addNotification({
                type: 'success',
                title: '🎯 Límites Aumentados',
                message: 'Límite diario: $5,000 USD',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                category: 'account',
                priority: 'medium'
            });

            this.addNotification({
                type: 'warning',
                title: '🔐 Alerta de Seguridad',
                message: 'Nueva sesión desde Tegucigalpa',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                category: 'security',
                priority: 'high'
            });

            if (!resetNotifications) {
                localStorage.setItem('hasInitialNotifications', 'true');
            }
        }
    }

    // ================================
    // 💰 TRANSACTION HISTORY SYSTEM
    // ================================

    initializeTransactionHistory() {
        // Load transaction history using main loadTransactionHistory function
        this.loadTransactionHistory(); // This calls the async main function at line 265
        this.displayTransactionHistory();
    }

    // Removed duplicate loadTransactionHistory() and sample data that was overwriting localStorage

    // NOTE: displayTransactionHistory and other functions are defined correctly below

    // ================================
    // 💾 SESSION MANAGEMENT
    // ================================

    loadUserSession() {
        try {
            const authToken = localStorage.getItem('auth_token'); const latandaUser = localStorage.getItem('latanda_user'); const session = (authToken && latandaUser) ? JSON.stringify({ user: JSON.parse(latandaUser), token: authToken, auth_token: authToken }) : null;
            if (!session) {
                return null;
            }

            const parsedSession = JSON.parse(session);

            // If using API authentication, validate JWT token
            if (this.featureFlags?.useApiAuthentication && parsedSession.auth_token) {
                // Check if token is expired
                if (parsedSession.expires_at) {
                    const expirationTime = new Date(parsedSession.expires_at);
                    const currentTime = new Date();
                    const timeUntilExpiry = expirationTime.getTime() - currentTime.getTime();

                    // If token expires within 5 minutes, attempt refresh
                    if (timeUntilExpiry < 5 * 60 * 1000) {
                        // Trigger refresh asynchronously to avoid blocking UI
                        setTimeout(() => this.refreshAuthToken(), 100);
                    }

                    // If token is already expired, return null to force re-authentication
                    if (timeUntilExpiry <= 0) {
                        this.clearUserSession();
                        return null;
                    }
                }

                // Validate JWT structure (basic check)
                if (!this.isValidJWTStructure(parsedSession.auth_token)) {
                    this.clearUserSession();
                    return null;
                }

                if (this.featureFlags.enableDebugMode) {
                }
            }

            return parsedSession;

        } catch (error) {
            return null;
        }
    }

    saveUserSession(session) {
        try {
            // Enhanced security for JWT tokens
            if (this.featureFlags?.useApiAuthentication && session?.auth_token) {
                // Add timestamp for token management
                session.saved_at = new Date().toISOString();

                // Store JWT tokens with additional metadata
                if (this.featureFlags.enableDebugMode) {
                }
            }

            localStorage.setItem('auth_token', session.token || session.auth_token); localStorage.setItem('latanda_user', JSON.stringify(session.user || session));
        } catch (error) {
        }
    }

    clearUserSession() {
        try {
            // Stop real-time updates before clearing session
            this.stopRealTimeBalanceUpdates();

            // Clear session data
            localStorage.removeItem(auth_token); localStorage.removeItem(latanda_user);
            this.userSession = null;

            // Clear balance cache for security
            this.clearBalanceCache();

            // Clear user validation cache for security
            this.clearUserValidationCache();

            // Cancel any pending validation requests
            if (this.validationAbortController) {
                this.validationAbortController.abort();
                this.validationAbortController = null;
            }
            if (this.validationTimeout) {
                clearTimeout(this.validationTimeout);
                this.validationTimeout = null;
            }

            if (this.featureFlags?.enableDebugMode) {
            }
        } catch (error) {
        }
    }

    isValidJWTStructure(token) {
        try {
            if (!token || typeof token !== 'string') {
                return false;
            }

            // JWT should have 3 parts separated by dots
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }

            // Each part should be base64 encoded (basic check)
            for (const part of parts) {
                if (!part || part.length === 0) {
                    return false;
                }
            }

            return true;

        } catch (error) {
            return false;
        }
    }

    // ================================
    // 🔐 API AUTHENTICATION METHODS
    // ================================

    async loginWithAPI(credentials) {
        try {
            // Only use API authentication if feature flag is enabled
            if (!this.featureFlags?.useApiAuthentication) {
                throw new Error('API authentication is not enabled');
            }

            if (!credentials.email || !credentials.password) {
                throw new Error('Email and password are required');
            }

            if (this.featureFlags.enableDebugMode) {
            }

            const response = await fetch(`${this.apiBase}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Version': '20250928008',
                    'X-Device-ID': this.generateDeviceId()
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                    device_info: {
                        user_agent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
                throw new Error(errorData.message || `HTTP ${response.status}: Login failed`);
            }

            const data = await response.json();

            // Validate response structure
            if (!data.auth_token || !data.user) {
                throw new Error('Invalid login response format');
            }

            // Create session object compatible with existing structure
            const session = {
                user: data.user,
                auth_token: data.auth_token,
                refresh_token: data.refresh_token,
                expires_at: data.expires_at || new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
                login_method: 'api',
                device_id: this.generateDeviceId(),
                login_timestamp: new Date().toISOString()
            };

            // Save the session
            this.saveUserSession(session);
            this.userSession = session;

            if (this.featureFlags.enableDebugMode) {
            }

            return {
                success: true,
                user: data.user,
                message: 'Login successful'
            };

        } catch (error) {

            // Track authentication failure
            if (this.featureFlags.enableMetrics) {
                this.trackAPICall('/api/auth/login', 0, false, error);
            }

            return {
                success: false,
                error: error.message,
                message: 'Login failed: ' + error.message
            };
        }
    }

    async logout() {
        try {
            // If using API authentication, call logout endpoint
            if (this.featureFlags?.useApiAuthentication && this.userSession?.auth_token) {
                try {
                    await fetch(`${this.apiBase}/api/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.userSession.auth_token}`,
                            'X-Client-Version': '20250928008',
                            'X-Device-ID': this.generateDeviceId()
                        },
                        body: JSON.stringify({
                            refresh_token: this.userSession.refresh_token
                        })
                    });

                    if (this.featureFlags.enableDebugMode) {
                    }
                } catch (error) {
                }
            }

            // Clear session regardless of API call success
            this.clearUserSession();

            // Clear additional authentication-related data
            localStorage.removeItem('currentUserId');
            localStorage.removeItem('balance_cache');
            localStorage.removeItem('user_validation_cache');

            if (this.featureFlags?.enableDebugMode) {
            }

            // Redirect to login page or refresh
            if (typeof window !== 'undefined' && window.location) {
                // Redirect to auth page or reload to show login state
                setTimeout(() => {
                    if (window.location.pathname.includes('my-wallet.html')) {
                        window.location.href = 'auth.html';
                    } else {
                        window.location.reload();
                    }
                }, 100);
            }

            return { success: true };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async authenticateUser(credentials) {
        try {
            // Feature flag controlled authentication
            if (this.featureFlags?.useApiAuthentication) {
                if (this.featureFlags.enableDebugMode) {
                }
                return await this.loginWithAPI(credentials);
            } else {
                if (this.featureFlags.enableDebugMode) {
                }
                return this.loginWithMock(credentials);
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Authentication failed: ' + error.message
            };
        }
    }

    loginWithMock(credentials) {
        try {
            if (!credentials.email || !credentials.password) {
                throw new Error('Email and password are required');
            }

            // Mock authentication - check against internal users or hardcoded credentials
            const validCredentials = [
                { email: 'demo@latanda.com', password: 'demo123', name: 'Usuario Demo' },
                { email: 'admin@latanda.com', password: 'admin123', name: 'Admin La Tanda' },
                { email: 'usuario1@latanda.com', password: 'user123', name: 'María González' }
            ];

            const user = validCredentials.find(cred =>
                cred.email.toLowerCase() === credentials.email.toLowerCase() &&
                cred.password === credentials.password
            );

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Create mock session
            const session = {
                user: {
                    id: 'mock_' + Date.now(),
                    email: user.email,
                    name: user.name,
                    verified: true
                },
                login_method: 'mock',
                device_id: this.generateDeviceId(),
                login_timestamp: new Date().toISOString(),
                // Mock JWT structure for compatibility
                auth_token: null,
                refresh_token: null,
                expires_at: null
            };

            this.saveUserSession(session);
            this.userSession = session;

            if (this.featureFlags.enableDebugMode) {
            }

            return {
                success: true,
                user: session.user,
                message: 'Login successful (mock mode)'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Login failed: ' + error.message
            };
        }
    }

    async registerWithAPI(userData) {
        try {
            // Only use API registration if feature flag is enabled
            if (!this.featureFlags?.useApiAuthentication) {
                throw new Error('API authentication is not enabled');
            }

            if (!userData.email || !userData.password || !userData.name) {
                throw new Error('Email, password, and name are required');
            }

            if (this.featureFlags.enableDebugMode) {
            }

            const response = await fetch(`${this.apiBase}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Version': '20250928008',
                    'X-Device-ID': this.generateDeviceId()
                },
                body: JSON.stringify({
                    email: userData.email,
                    password: userData.password,
                    name: userData.name,
                    device_info: {
                        user_agent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
                throw new Error(errorData.message || `HTTP ${response.status}: Registration failed`);
            }

            const data = await response.json();

            // If registration includes auto-login, save session
            if (data.auth_token && data.user) {
                const session = {
                    user: data.user,
                    auth_token: data.auth_token,
                    refresh_token: data.refresh_token,
                    expires_at: data.expires_at || new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
                    login_method: 'api',
                    device_id: this.generateDeviceId(),
                    login_timestamp: new Date().toISOString()
                };

                this.saveUserSession(session);
                this.userSession = session;
            }

            if (this.featureFlags.enableDebugMode) {
            }

            return {
                success: true,
                user: data.user,
                message: data.message || 'Registration successful',
                autoLogin: !!data.auth_token
            };

        } catch (error) {

            // Track registration failure
            if (this.featureFlags.enableMetrics) {
                this.trackAPICall('/api/auth/register', 0, false, error);
            }

            return {
                success: false,
                error: error.message,
                message: 'Registration failed: ' + error.message
            };
        }
    }

    // Check if user is authenticated (works for both mock and API modes)
    isAuthenticated() {
        if (!this.userSession) {
            return false;
        }

        // For API authentication, check token validity
        if (this.featureFlags?.useApiAuthentication && this.userSession.auth_token) {
            // Check if token is expired
            if (this.userSession.expires_at) {
                const expirationTime = new Date(this.userSession.expires_at);
                const currentTime = new Date();
                if (currentTime >= expirationTime) {
                    if (this.featureFlags.enableDebugMode) {
                    }
                    return false;
                }
            }

            // Validate JWT structure
            return this.isValidJWTStructure(this.userSession.auth_token);
        }

        // For mock authentication, just check if user exists
        return !!(this.userSession.user && this.userSession.user.email);
    }

    getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }
        return this.userSession.user;
    }

    // ================================
    // 👥 INTERNAL USERS DATABASE
    // ================================

    initializeInternalUsers() {
        // Only initialize mock users if API validation is disabled
        if (this.featureFlags.useApiUserValidation) {
            if (this.featureFlags.enableDebugMode) {
            }
            return;
        }

        // Simulated internal La Tanda users for testing transfers (fallback mode)
        const existingUsers = localStorage.getItem('latanda_internal_users');
        if (!existingUsers) {
            const sampleUsers = [
                {
                    email: 'usuario1@latanda.com',
                    name: 'María González',
                    verified: true,
                    joinDate: new Date('2024-01-15').toISOString()
                },
                {
                    email: 'usuario2@latanda.com',
                    name: 'Carlos Rodríguez',
                    verified: true,
                    joinDate: new Date('2024-02-20').toISOString()
                },
                {
                    email: 'admin@latanda.com',
                    name: 'Admin La Tanda',
                    verified: true,
                    joinDate: new Date('2023-12-01').toISOString()
                },
                {
                    email: 'demo@latanda.com',
                    name: 'Usuario Demo',
                    verified: true,
                    joinDate: new Date('2024-03-01').toISOString()
                }
            ];

            localStorage.setItem('latanda_internal_users', JSON.stringify(sampleUsers));
        } else {
            const users = JSON.parse(existingUsers);
        }
    }

    async validateInternalUser(email) {
        try {
            // Feature flag controlled validation
            if (this.featureFlags.useApiUserValidation) {
                return await this.validateUserWithAPI(email);
            } else {
                return this.validateUserWithLocalStorage(email);
            }
        } catch (error) {

            // Fallback to localStorage on any error
            if (this.featureFlags.enableDebugMode) {
            }

            return this.validateUserWithLocalStorage(email);
        }
    }

    async validateUserWithAPI(email) {
        try {
            // Check cache first
            const cachedResult = this.getCachedUserValidation(email);
            if (cachedResult) {
                if (this.featureFlags.enableDebugMode) {
                }
                return cachedResult;
            }

            if (this.featureFlags.enableDebugMode) {
            }

            // Create new abort controller for this request
            this.validationAbortController = new AbortController();

            const response = await fetch(`${this.apiBase}/api/user/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userSession?.auth_token || this.userSession?.token}`,
                    'X-Client-Version': '20250928008',
                    'X-Device-ID': this.generateDeviceId()
                },
                body: JSON.stringify({ email: email }),
                signal: this.validationAbortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                const result = {
                    valid: data.data.valid,
                    user: data.data.user,
                    message: data.data.valid ? `Usuario verificado: ${data.data.user?.name || email}` : data.data.message || 'Usuario no encontrado en La Tanda'
                };

                // Cache the result for 1 minute
                this.setCachedUserValidation(email, result);

                // Track successful API call
                if (this.featureFlags.enableMetrics) {
                    this.trackAPICall('/api/user/validate', Date.now() - Date.now(), true);
                }

                return result;
            } else {
                throw new Error(data.message || 'Invalid API response');
            }

        } catch (error) {

            // Track failed API call
            if (this.featureFlags.enableMetrics) {
                this.trackAPICall('/api/user/validate', 0, false, error);
            }

            // Fallback to localStorage
            if (this.featureFlags.enableDebugMode) {
            }

            return this.validateUserWithLocalStorage(email);
        }
    }

    validateUserWithLocalStorage(email) {
        try {
            const users = JSON.parse(localStorage.getItem('latanda_internal_users') || '[]');
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (user && user.verified) {
                return {
                    valid: true,
                    user: user,
                    message: `Usuario verificado: ${user.name}`
                };
            } else if (user && !user.verified) {
                return {
                    valid: false,
                    user: user,
                    message: 'Usuario no verificado'
                };
            } else {
                return {
                    valid: false,
                    user: null,
                    message: 'Usuario no encontrado en La Tanda'
                };
            }
        } catch (error) {
            return {
                valid: false,
                user: null,
                message: 'Error en validación de usuario'
            };
        }
    }

    // ================================
    // 🏪 USER VALIDATION CACHING SYSTEM
    // ================================

    getCachedUserValidation(email) {
        try {
            const cache = JSON.parse(localStorage.getItem('user_validation_cache') || '{}');
            const cachedEntry = cache[email.toLowerCase()];

            if (!cachedEntry) {
                return null;
            }

            // Check if cache entry is still valid (1 minute expiry)
            const now = Date.now();
            const cacheAge = now - cachedEntry.timestamp;
            const CACHE_EXPIRY = 60 * 1000; // 1 minute

            if (cacheAge > CACHE_EXPIRY) {
                // Cache expired, remove entry
                delete cache[email.toLowerCase()];
                localStorage.setItem('user_validation_cache', JSON.stringify(cache));
                return null;
            }

            return cachedEntry.result;

        } catch (error) {
            return null;
        }
    }

    setCachedUserValidation(email, result) {
        try {
            const cache = JSON.parse(localStorage.getItem('user_validation_cache') || '{}');

            cache[email.toLowerCase()] = {
                result: result,
                timestamp: Date.now()
            };

            // Clean up expired entries to prevent cache bloat
            this.cleanupValidationCache(cache);

            localStorage.setItem('user_validation_cache', JSON.stringify(cache));

            if (this.featureFlags.enableDebugMode) {
            }

        } catch (error) {
        }
    }

    cleanupValidationCache(cache = null) {
        try {
            if (!cache) {
                cache = JSON.parse(localStorage.getItem('user_validation_cache') || '{}');
            }

            const now = Date.now();
            const CACHE_EXPIRY = 60 * 1000; // 1 minute
            let cleanedCount = 0;

            Object.keys(cache).forEach(email => {
                const cacheAge = now - cache[email].timestamp;
                if (cacheAge > CACHE_EXPIRY) {
                    delete cache[email];
                    cleanedCount++;
                }
            });

            if (cleanedCount > 0) {
                localStorage.setItem('user_validation_cache', JSON.stringify(cache));
                if (this.featureFlags.enableDebugMode) {
                }
            }

        } catch (error) {
        }
    }

    clearUserValidationCache() {
        try {
            localStorage.removeItem('user_validation_cache');
            if (this.featureFlags.enableDebugMode) {
            }
        } catch (error) {
        }
    }

    getInternalUsers() {
        try {
            return JSON.parse(localStorage.getItem('latanda_internal_users') || '[]');
        } catch (error) {
            return [];
        }
    }

    checkLowBalanceAlerts() {
        if (!this.notificationSettings || !this.notificationSettings.lowBalance) return;

        const threshold = this.notificationSettings.lowBalanceThreshold || 10;
        const totalInUSD = this.balances.USD +
                         (this.balances.HNL * this.exchangeRates.HNL_USD) +
                         (0); // LTD removed * this.exchangeRates.LTD_USD;

        if (totalInUSD < threshold) {
            const preferredCurrency = this.walletSettings.currencyPreference;
            const thresholdInPreferred = preferredCurrency === 'USD' ? threshold : threshold * this.exchangeRates.USD_HNL;
            const symbol = preferredCurrency === 'USD' ? '$' : 'L';

            this.showNotification(
                `Balance bajo: ${symbol}${this.formatCurrency(thresholdInPreferred, preferredCurrency).split(" ")[0]}`,
                'warning'
            );
        }
    }

    showNotification(message, type = 'info', persistent = false) {
        // Simple implementation for now - just log to console

        // Try to call the global function if available
        if (typeof showNotification === 'function' && this.walletSettings && this.walletSettings.notificationsEnabled) {
            try {
                showNotification.call(this, message, type, persistent);
            } catch (error) {
            }
        }
    }

    // Stub methods for missing functionality
    initializeTranslations() {
        // Stub implementation
    }

    showLoading(message = 'Loading...') {
    }

    hideLoading() {
    }

    setupSecurityMonitoring() {
        // Stub implementation
    }

    setupAutoLock() {
        // Stub implementation
    }

    // ================================
    // 🔧 UTILITY METHODS
    // ================================

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) {
            return 'Hace un momento';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `Hace ${days} día${days > 1 ? 's' : ''}`;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Format time for notifications (e.g., "14:30")
    formatTime(date) {
        if (!date) return '--:--';
        const d = new Date(date);
        return d.toLocaleTimeString('es-HN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // Format date and time for transactions with improved readability
    formatDateTime(date) {
        if (!date) return 'Fecha no disponible';
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // For recent dates, show relative format
        if (diffDays === 0) {
            return `Hoy • ${this.formatTime(date)}`;
        } else if (diffDays === 1) {
            return `Ayer • ${this.formatTime(date)}`;
        } else if (diffDays <= 7) {
            const dayName = d.toLocaleDateString('es-HN', { weekday: 'long' });
            return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} • ${this.formatTime(date)}`;
        }

        // For older dates, use improved format with bullet separator
        return d.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }) + ' • ' + this.formatTime(date);
    }

    // Convert between currencies using current exchange rates
    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;

        if (fromCurrency === 'USD' && toCurrency === 'HNL') {
            return amount * this.exchangeRates.USD_HNL;
        } else if (fromCurrency === 'HNL' && toCurrency === 'USD') {
            return amount * this.exchangeRates.HNL_USD;
        }

        return amount; // fallback
    }

    // Format relative time (e.g., "Hace 2 horas", "Hace 30 minutos")
    formatRelativeTime(date) {
        if (!date) return 'Fecha no disponible';

        const now = new Date();
        const d = new Date(date);
        const diffMs = now - d;

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
            return 'Ahora mismo';
        } else if (diffMinutes < 60) {
            return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays <= 7) {
            return `Hace ${diffDays} días`;
        }

        // For older dates, fall back to formatDateTime
        return this.formatDateTime(date);
    }

    // Show loading indicator
    showLoading(message = 'Cargando...') {
        // Check if loading indicator already exists
        let loadingEl = document.getElementById('wallet-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'wallet-loading';
            loadingEl.innerHTML = `
                <div class="loading-backdrop">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-message">${message}</div>
                    </div>
                </div>
            `;
            document.body.appendChild(loadingEl);
        } else {
            loadingEl.querySelector('.loading-message').textContent = message;
            loadingEl.style.display = 'flex';
        }
    }

    // Hide loading indicator
    hideLoading() {
        const loadingEl = document.getElementById('wallet-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    // Play notification sound (with graceful fallback)
    playNotificationSound() {
        try {
            // Try to play a simple notification sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfCkOS2e+2cSUELITO9daGNwgZaLvt559NEAxQp+Pwtny8C1Gi4/RcOQASDjUJRSfO+4kFCQVYfPZOOQAREzQGQic5AIYECglYfPY0AjkARSXN+wgFRDHO+0AriAYDAjQJQic6AIUECglZe/ZOOgASDjAJRSfO+IkFCgJYfPZOOQAREzQGQic5AIYECglYfPZNOgASDjAJRSfO+IkFCgJYfPZOOAYJEzQGQic5AIYECglYfPZNOgASDjAJRSfO+4kFCgJZfPZOOQAREzQGQic5AIYECglYfPZOOgASDjAJRSfO+IkFCgJYfPZOOQAREzQGQic5AIYECglYfPZNOgASDjAJRSfO+IkFCgJYfPZOOQAREzAGQic5AIYECglYfPZOOgASDjAJRSfO+IkFCgJYfPZOOQA=');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Silently fail if audio can't play (e.g., autoplay restrictions)
            });
        } catch (error) {
            // Graceful fallback - no sound
        }
    }

    // Show success message (similar to showError but for positive feedback)
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Show info notification
    showInfo(message) {
        this.showNotification(message, 'info');
    }

    // Show modal with title and content
    showModal(title, content) {
        const modal = document.getElementById('receiptModal');
        const titleElement = document.getElementById('receiptModalTitle');
        const bodyElement = document.getElementById('receiptModalBody');

        if (modal && titleElement && bodyElement) {
            titleElement.textContent = title;
            bodyElement.innerHTML = content;
            modal.style.display = 'flex';
        } else {
            this.showInfo(`${title}: ${content.replace(/<[^>]*>/g, ' ').substring(0, 100)}...`);
        }
    }

    // Notify admin of new deposit for approval
    notifyAdminNewDeposit(transaction) {
        try {
            // Get existing admin notifications
            const existingNotifications = localStorage.getItem('admin_notifications');
            const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];

            // Add new deposit notification
            notifications.push({
                id: `deposit_${transaction.id}`,
                type: 'pending_deposit',
                transaction: transaction,
                timestamp: new Date().toISOString(),
                status: 'pending_review'
            });

            // Save to localStorage for admin panel
            localStorage.setItem('admin_notifications', JSON.stringify(notifications));

        } catch (error) {
        }
    }

    // Notify admin panel about appeal submission
    notifyAdminAppeal(transaction) {
        try {
            // Create appeal notification for admin panel
            const appealNotification = {
                id: 'appeal_' + Date.now(),
                type: 'appeal_submitted',
                transactionId: transaction.id,
                userId: this.getCurrentUserId(),
                transactionType: transaction.type,
                amount: transaction.amount,
                currency: transaction.currency,
                description: transaction.description,
                originalRejectionReason: transaction.rejectionReason,
                appealReason: transaction.appealReason,
                appealedAt: transaction.appealedAt,
                status: 'pending_review',
                evidenceFile: transaction.appealEvidence || null,
                priority: 'high' // Appeals get high priority
            };

            // Add to admin appeals queue
            const adminAppeals = JSON.parse(localStorage.getItem('admin_appeals_queue') || '[]');
            adminAppeals.unshift(appealNotification);
            localStorage.setItem('admin_appeals_queue', JSON.stringify(adminAppeals));

            // Also add to general admin notifications
            const adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
            adminNotifications.unshift({
                id: appealNotification.id,
                type: 'appeal',
                title: 'Nueva Apelación Recibida',
                message: `Usuario ${this.getCurrentUserId()} apeló ${transaction.type === 'deposit' ? 'depósito' : 'retiro'} de ${this.formatCurrency(transaction.amount, transaction.currency)}`,
                timestamp: new Date(),
                priority: 'high',
                transactionId: transaction.id
            });
            localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));

        } catch (error) {
        }
    }

    // ================================
    // 🏦 WITHDRAWAL SYSTEM METHODS
    // ================================

    showWithdrawModal() {
        const modal = document.getElementById('withdrawModal');
        if (modal) {
            modal.classList.add('active');
            this.removeDuplicateBankAccounts(); // Clean duplicates first
            this.loadSavedBankAccounts();
            this.updateAvailableBalance();
            this.calculateWithdrawalFees();

            // Focus on amount input
            setTimeout(() => {
                const amountInput = document.getElementById('withdrawAmount');
                if (amountInput) amountInput.focus();
            }, 100);

        }
    }

    closeWithdrawModal() {
        const modal = document.getElementById('withdrawModal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('withdrawForm').reset();
            this.hideNewBankAccountForm();
            this.calculateWithdrawalFees(); // Reset fee display
        }
    }

    updateAvailableBalance() {
        const balanceElement = document.getElementById('withdrawAvailableBalance');
        const currencySelect = document.getElementById('withdrawCurrency');

        if (balanceElement && currencySelect) {
            const currency = currencySelect.value || 'HNL';
            const balance = this.balances[currency] || 0;
            balanceElement.textContent = this.formatCurrency(balance, currency);

        }
    }

    setWithdrawAmount(amount) {
        const amountInput = document.getElementById('withdrawAmount');
        const currencySelect = document.getElementById('withdrawCurrency');

        if (amountInput && currencySelect) {
            if (amount === 'max') {
                const currency = currencySelect.value || 'HNL';
                const availableBalance = this.balances[currency] || 0;
                // Sin comisiones, el máximo retirable es el balance completo
                amountInput.value = availableBalance.toFixed(2);
            } else {
                amountInput.value = amount;
            }

            this.calculateWithdrawalFees();
        }
    }

    calculateWithdrawalFees() {
        const amountInput = document.getElementById('withdrawAmount');
        const currencySelect = document.getElementById('withdrawCurrency');
        const feeElement = document.getElementById('withdrawalFee');
        const totalElement = document.getElementById('withdrawalTotal');

        if (!amountInput || !currencySelect || !feeElement || !totalElement) {
            return;
        }

        const amount = parseFloat(amountInput.value) || 0;
        const currency = currencySelect.value || 'HNL';

        if (amount <= 0) {
            feeElement.textContent = '0.00 ' + currency;
            totalElement.textContent = '0.00 ' + currency;
            return;
        }

        // Calculate withdrawal fee
        const fee = this.getWithdrawalFee(amount, currency);
        const totalReceived = Math.max(0, amount - fee);

        // Update display
        feeElement.textContent = this.formatCurrency(fee, currency, false);
        totalElement.textContent = this.formatCurrency(totalReceived, currency, false);

        // Validate against available balance
        const availableBalance = this.balances[currency] || 0;
        const submitBtn = document.getElementById('withdrawSubmitBtn');

        if (submitBtn) {
            if (amount > availableBalance) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Saldo insuficiente';
            } else if (amount <= 0) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Ingresa un monto';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-money-bill-wave"></i> Retirar';
            }
        }

            amount: this.formatCurrency(amount, currency),
            fee: this.formatCurrency(fee, currency),
            total: this.formatCurrency(totalReceived, currency)
        });
    }

    getWithdrawalFee(amount, currency) {
        // La Tanda Wallet no cobra comisiones por retiros
        // Los usuarios pueden retirar sus fondos sin costo adicional
        return 0.00;
    }

    onBankAccountChange() {
        const select = document.getElementById('bankAccount');
        if (select && select.value === 'add_new') {
            this.showNewBankAccountForm();
            // Clear form fields when showing
            document.getElementById('bankName').value = '';
            document.getElementById('accountNumber').value = '';
            document.getElementById('accountHolder').value = '';
            document.getElementById('accountType').value = '';
            document.getElementById('saveAccount').checked = true;
        } else {
            this.hideNewBankAccountForm();
        }

        // Recalculate to update validation
        this.calculateWithdrawalFees();
    }

    showNewBankAccountForm() {
        const form = document.getElementById('newBankAccountForm');
        if (form) {
            form.style.display = 'block';
        }
    }

    hideNewBankAccountForm() {
        const form = document.getElementById('newBankAccountForm');
        if (form) {
            form.style.display = 'none';
        }
    }

    loadSavedBankAccounts() {
        const select = document.getElementById('bankAccount');
        if (!select) return;

        // Get saved bank accounts
        const savedAccounts = this.getSavedBankAccounts();

        // Clear existing options except default ones
        while (select.children.length > 2) {
            select.removeChild(select.lastChild);
        }

        // Add saved accounts
        savedAccounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.bankName} - ****${account.accountNumber.slice(-4)} (${account.accountHolder})`;
            select.insertBefore(option, select.lastElementChild);
        });

    }

    getSavedBankAccounts() {
        try {
            const accounts = localStorage.getItem('savedBankAccounts');
            return accounts ? JSON.parse(accounts) : [];
        } catch (error) {
            return [];
        }
    }

    saveBankAccount(accountData) {
        try {
            const savedAccounts = this.getSavedBankAccounts();

            // Check for duplicate account (same bank + account number)
            const isDuplicate = savedAccounts.some(account =>
                account.bankName === accountData.bankName &&
                account.accountNumber === accountData.accountNumber
            );

            if (isDuplicate) {
                this.showError('Esta cuenta bancaria ya está guardada');
                return null;
            }

            const newAccount = {
                id: 'acc_' + Date.now(),
                ...accountData,
                dateAdded: new Date().toISOString()
            };

            savedAccounts.push(newAccount);
            localStorage.setItem('savedBankAccounts', JSON.stringify(savedAccounts));

            return newAccount;
        } catch (error) {
            return null;
        }
    }

    // Remove duplicate bank accounts
    removeDuplicateBankAccounts() {
        try {
            const savedAccounts = this.getSavedBankAccounts();
            const uniqueAccounts = [];
            const seen = new Set();

            savedAccounts.forEach(account => {
                const key = `${account.bankName}-${account.accountNumber}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueAccounts.push(account);
                } else {
                }
            });

            if (uniqueAccounts.length !== savedAccounts.length) {
                localStorage.setItem('savedBankAccounts', JSON.stringify(uniqueAccounts));
                this.loadSavedBankAccounts(); // Reload the select options
            }

            return uniqueAccounts.length;
        } catch (error) {
            return 0;
        }
    }

    async processWithdrawal() {

        // Debug form validation status
        const form = document.getElementById('withdrawForm');
        if (form) {
                isValid: form.checkValidity(),
                elements: form.elements.length,
                formData: new FormData(form)
            });
        }

        try {
            const formData = this.getWithdrawalFormData();
            if (!formData) return;

            // Validate form data
            // Verify PIN for withdrawals if enabled
            if (this.walletSettings.pinEnabled && this.walletSettings.pinCode) {
                const pinVerified = await this.verifyPin("confirmar retiro de " + this.formatCurrency(formData.amount, formData.currency));
                if (!pinVerified) {
                    return;
                }
            }

            const validation = this.validateWithdrawalData(formData);
            if (!validation.valid) {
                this.showError(validation.message);
                return;
            }

            // Show loading state
            this.showLoading('Procesando retiro...');

            // Create withdrawal transaction
            const withdrawalTransaction = await this.createWithdrawalTransaction(formData);

            // Deduct amount from balance (pending admin approval)
            this.balances[formData.currency] -= formData.amount;
            this.saveBalancesToStorage();
            this.updateBalanceDisplay();

            // Add to transaction history
            this.transactionHistory.unshift(withdrawalTransaction);
            this.saveTransactionHistory();

            // Notify admin
            this.notifyAdminNewWithdrawal(withdrawalTransaction);

            // Close modal and show success
            this.closeWithdrawModal();
            this.hideLoading();

            this.showSuccess(`Retiro de ${this.formatCurrency(formData.amount, formData.currency)} iniciado. Será procesado en 1-3 días hábiles.`);

            // Refresh transaction display
            this.loadTransactionHistory();


        } catch (error) {
            this.hideLoading();
            this.showError('Error al procesar el retiro. Por favor intenta de nuevo.');
        }
    }

    getWithdrawalFormData() {
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const currency = document.getElementById('withdrawCurrency').value;
        const bankAccountSelect = document.getElementById('bankAccount');

        if (!amount || amount <= 0) {
            this.showError('Por favor ingresa un monto válido para el retiro');
            return null;
        }

        if (!currency) {
            this.showError('Por favor selecciona una moneda');
            return null;
        }

        if (!bankAccountSelect.value) {
            this.showError('Por favor selecciona o agrega una cuenta bancaria');
            return null;
        }

        let bankAccount;

        if (bankAccountSelect.value === 'add_new') {
            // Get new bank account data
            const bankName = document.getElementById('bankName').value;
            const accountNumber = document.getElementById('accountNumber').value;
            const accountHolder = document.getElementById('accountHolder').value;
            const accountType = document.getElementById('accountType').value;
            const saveAccount = document.getElementById('saveAccount').checked;

            // Detailed validation with specific error messages
            if (!bankName) {
                this.showError('Por favor selecciona un banco');
                return null;
            }
            if (!accountNumber) {
                this.showError('Por favor ingresa el número de cuenta');
                return null;
            }
            if (!accountHolder) {
                this.showError('Por favor ingresa el nombre del titular de la cuenta');
                return null;
            }
            if (!accountType) {
                this.showError('Por favor selecciona el tipo de cuenta');
                return null;
            }

            bankAccount = {
                bankName,
                accountNumber,
                accountHolder,
                accountType,
                isNew: true
            };

            // Save account if requested
            if (saveAccount) {
                this.saveBankAccount(bankAccount);
            }
        } else {
            // Get saved account
            const savedAccounts = this.getSavedBankAccounts();
            bankAccount = savedAccounts.find(acc => acc.id === bankAccountSelect.value);

            if (!bankAccount) {
                this.showError('Cuenta bancaria no encontrada');
                return null;
            }
        }

        const formData = {
            amount,
            currency,
            bankAccount,
            fee: this.getWithdrawalFee(amount, currency),
            totalReceived: amount - this.getWithdrawalFee(amount, currency)
        };

            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            accountHolder: bankAccount.accountHolder,
            accountType: bankAccount.accountType
        });

        return formData;
    }

    validateWithdrawalData(data) {
        const availableBalance = this.balances[data.currency] || 0;

        if (data.amount <= 0) {
            return { valid: false, message: 'El monto debe ser mayor a cero' };
        }

        if (data.amount > availableBalance) {
            return { valid: false, message: 'Saldo insuficiente para realizar el retiro' };
        }

        // Minimum withdrawal amounts (pequeños para evitar abusos)
        const minimums = { USD: 1, HNL: 25 };
        if (data.amount < minimums[data.currency]) {
            return {
                valid: false,
                message: `El monto mínimo de retiro es ${this.formatCurrency(minimums[data.currency], data.currency)}`
            };
        }

        return { valid: true };
    }

    async createWithdrawalTransaction(data) {

        const transaction = {
            id: 'withdrawal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: 'withdrawal',
            amount: data.amount,
            currency: data.currency,
            fee: data.fee,
            totalReceived: data.totalReceived,
            status: 'pending_admin_verification',
            timestamp: new Date().toISOString(),
            description: `Retiro a ${data.bankAccount.bankName}`,
            userId: this.getCurrentUserId(),
            walletOwner: this.getCurrentUserId(),
            isMyTransaction: true,
            category: 'withdrawal',
            // Admin panel expects 'withdrawalAccount' structure
            withdrawalAccount: {
                bank: data.bankAccount.bankName,
                account_number: data.bankAccount.accountNumber,
                account_holder: data.bankAccount.accountHolder,
                account_type: data.bankAccount.accountType,
                verified: true,
                verification_date: new Date().toISOString()
            },
            // Keep bankAccount for backward compatibility
            bankAccount: {
                bankName: data.bankAccount.bankName,
                accountNumber: data.bankAccount.accountNumber,
                accountHolder: data.bankAccount.accountHolder,
                accountType: data.bankAccount.accountType
            },
            metadata: {
                processingTime: '1-3 días hábiles',
                initiatedBy: 'user',
                requiresAdminApproval: true
            }
        };

            id: transaction.id,
            withdrawalAccount: transaction.withdrawalAccount,
            bankAccount: transaction.bankAccount
        });

        return transaction;
    }

    notifyAdminNewWithdrawal(transaction) {
        try {
            // Get existing admin notifications
            const existingNotifications = localStorage.getItem('admin_notifications');
            const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];

            // Add new withdrawal notification
            notifications.push({
                id: `withdrawal_${transaction.id}`,
                type: 'pending_withdrawal',
                transaction: transaction,
                timestamp: new Date().toISOString(),
                status: 'pending_review',
                priority: 'high'
            });

            // Save to localStorage for admin panel
            localStorage.setItem('admin_notifications', JSON.stringify(notifications));
        } catch (error) {
        }
    }

    // ============================================
    // 🎚️ FEATURE FLAGS SYSTEM (Phase 2 API Integration)
    // ============================================

    initializeFeatureFlags() {
        return {
            // Phase 2 API Integration flags (gradual rollout)
            useApiAuthentication: this.getFeatureFlag('api_auth', 1.0),          // 100% enabled (production)
            useApiBalances: this.getFeatureFlag('api_balance', 1.0),            // 100% enabled (production)
            useApiUserValidation: this.getFeatureFlag('api_validation', 1.0),   // 100% enabled (production)
            useApiTransactions: this.getFeatureFlag('api_transactions', 1.0),   // 100% enabled (production)
            useApiInternalTransfers: this.getFeatureFlag('api_transfers', 0.00), // 0% rollout (not ready)

            // Monitoring flags
            enableMetrics: this.getFeatureFlag('enable_metrics', 1.0),           // 100% enabled
            enableHealthChecks: this.getFeatureFlag('health_checks', 1.0),       // 100% enabled
            enableDebugMode: this.getFeatureFlag('debug_mode', 0.1)              // 10% rollout
        };
    }

    getFeatureFlag(flagName, rolloutPercentage) {
        try {
            // Check localStorage override first (for testing/debugging)
            const override = localStorage.getItem(`flag_${flagName}`);
            if (override !== null) {
                const isEnabled = override === 'true';
                if (this.featureFlags?.enableDebugMode) {
                }
                return isEnabled;
            }

            // Use consistent user-based bucketing for gradual rollout
            const userId = this.getUserId();
            const bucketHash = this.hashCode(userId + flagName);
            const bucket = Math.abs(bucketHash) % 100;
            const isEnabled = bucket < (rolloutPercentage * 100);

            if (this.featureFlags?.enableDebugMode && rolloutPercentage < 1.0) {
            }

            return isEnabled;

        } catch (error) {
            return rolloutPercentage >= 0.5; // Default to enabled if rollout is >50%
        }
    }

    getUserId() {
        // Use consistent identifier for feature flag bucketing
        return this.userSession?.user?.id ||
               localStorage.getItem('deviceId') ||
               this.generateDeviceId();
    }

    generateDeviceId() {
        // Generate consistent device ID for anonymous users
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    // ============================================
    // 🔧 ENHANCED API SYSTEM (Phase 2)
    // ============================================

    async apiCall(endpoint, options = {}) {
        const maxRetries = 3;
        let lastError;

        // Start performance tracking
        const startTime = Date.now();
        const fullEndpoint = endpoint.startsWith('http') ? endpoint : `${this.apiBase}${endpoint}`;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Add user_id to GET requests automatically
                let url = fullEndpoint;
                if (options.method === 'GET' && options.params) {
                    const params = new URLSearchParams(options.params);
                    url += `?${params.toString()}`;
                }

                const response = await fetch(url, {
                    method: options.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.userSession?.auth_token || this.userSession?.token}`,
                        'X-Client-Version': '20250928008',
                        'X-Feature-Flags': JSON.stringify({
                            api_balance: this.featureFlags.useApiBalances,
                            api_auth: this.featureFlags.useApiAuthentication
                        }),
                        ...options.headers
                    },
                    body: options.body ? JSON.stringify(options.body) : undefined,
                    ...options
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                // Track successful API call
                this.trackAPICall(endpoint, Date.now() - startTime, true);

                return data;

            } catch (error) {
                lastError = error;

                if (this.featureFlags.enableDebugMode) {
                }

                // Don't retry on authentication errors
                if (error.message.includes('401') || error.message.includes('403')) {
                    this.trackAPICall(endpoint, Date.now() - startTime, false, error);
                    throw error;
                }

                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        }

        // All retries failed
        this.trackAPICall(endpoint, Date.now() - startTime, false, lastError);
        throw new Error(`API call failed after ${maxRetries} attempts: ${lastError.message}`);
    }

    trackAPICall(endpoint, duration, success, error = null) {
        try {
            if (!this.featureFlags.enableMetrics) return;

            const event = {
                endpoint,
                duration,
                success,
                error: error ? error.message : null,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };

            // Store metrics (you can send these to your analytics service)
            const metrics = JSON.parse(localStorage.getItem('api_metrics') || '[]');
            metrics.push(event);

            // Keep only last 100 events to avoid storage bloat
            if (metrics.length > 100) {
                metrics.splice(0, metrics.length - 100);
            }

            localStorage.setItem('api_metrics', JSON.stringify(metrics));

            // Log slow calls
            if (duration > 3000) {
            }

            if (!success && this.featureFlags.enableDebugMode) {
            }

        } catch (e) {
            // Silent fail for metrics
        }
    }

    // Emergency rollback system
    executeEmergencyRollback(reason) {

        // Disable all API features immediately
        localStorage.setItem('flag_api_auth', 'false');
        localStorage.setItem('flag_api_balance', 'false');
        localStorage.setItem('flag_api_validation', 'false');
        localStorage.setItem('flag_api_transactions', 'false');
        localStorage.setItem('flag_api_transfers', 'false');

        // Clear potentially corrupted cache
        localStorage.removeItem('balance_cache');
        localStorage.removeItem('user_validation_cache');
        localStorage.removeItem('transaction_cache');

        // Log rollback event
        const rollbackEvent = {
            reason,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            userId: this.userSession?.user?.id || 'anonymous'
        };
        localStorage.setItem('last_rollback', JSON.stringify(rollbackEvent));

        this.showNotification('🚨 System rollback executed. Refreshing...', 'error');

        // Reload to ensure clean state
        setTimeout(() => window.location.reload(), 2000);
    }


    // =====================================
    // SESSION TIMEOUT MANAGEMENT
    // =====================================

    initSessionTimeout() {
        this.SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
        this.WARNING_BEFORE = 2 * 60 * 1000; // 2 minutes warning
        this.lastActivity = Date.now();
        this.sessionTimeoutId = null;
        this.warningTimeoutId = null;
        this.warningShown = false;

        // Track user activity
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => this.resetSessionTimeout(), { passive: true });
        });

        // Start the timeout
        this.resetSessionTimeout();
    }

    resetSessionTimeout() {
        this.lastActivity = Date.now();
        this.warningShown = false;

        // Clear existing timeouts
        if (this.sessionTimeoutId) clearTimeout(this.sessionTimeoutId);
        if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);

        // Hide warning if shown
        const warningModal = document.getElementById('sessionWarningModal');
        if (warningModal) warningModal.style.display = 'none';

        // Set warning timeout (13 minutes)
        this.warningTimeoutId = setTimeout(() => {
            this.showSessionWarning();
        }, this.SESSION_TIMEOUT - this.WARNING_BEFORE);

        // Set session timeout (15 minutes)
        this.sessionTimeoutId = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.SESSION_TIMEOUT);
    }

    showSessionWarning() {
        if (this.warningShown) return;
        this.warningShown = true;

        // Create warning modal if not exists
        let modal = document.getElementById('sessionWarningModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sessionWarningModal';
            modal.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                        <div style="font-size: 48px; margin-bottom: 15px;">⏰</div>
                        <h3 style="margin: 0 0 15px; color: #dc2626;">Sesión por expirar</h3>
                        <p style="color: #666; margin-bottom: 20px;">Tu sesión expirará en <strong id="sessionCountdown">2:00</strong> minutos por inactividad.</p>
                        <button onclick="walletInstance.resetSessionTimeout()" style="background: #10b981; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                            Continuar sesión
                        </button>
                        <button onclick="walletInstance.logout()" style="background: #6b7280; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 16px; cursor: pointer;">
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'block';

        // Start countdown
        let secondsLeft = 120;
        const countdownEl = document.getElementById('sessionCountdown');
        const countdownInterval = setInterval(() => {
            secondsLeft--;
            if (countdownEl) {
                const mins = Math.floor(secondsLeft / 60);
                const secs = secondsLeft % 60;
                countdownEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
            if (secondsLeft <= 0 || !this.warningShown) {
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    handleSessionTimeout() {
        this.showNotification('Tu sesión ha expirado por inactividad', 'warning');
        this.logout();
    }

    logout() {
        // Clear all session data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('latanda_user');
        localStorage.removeItem('currentUserId');

        // Clear timeouts
        if (this.sessionTimeoutId) clearTimeout(this.sessionTimeoutId);
        if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);

        // Redirect to login
        window.location.href = '/main/auth-enhanced.html';
    }
} // End of LaTandaWallet class

// ================================
// 🌍 GLOBAL MODAL FUNCTIONS
// ================================

window.showSendModal = function() {
    if (!walletInstance) {
        return;
    }
    walletInstance.showSendModal();
};

window.showReceiveModal = function() {
    if (!walletInstance) {
        return;
    }
    walletInstance.showReceiveModal();
};

window.showDepositModal = function(currency) {
    if (!walletInstance) {
        return;
    }
    walletInstance.showDepositModal(currency);
};

window.showWithdrawModal = function() {
    if (!walletInstance) {
        return;
    }
    walletInstance.showWithdrawModal();
};

// Initialize wallet when page loads
// (Moved to end of file to avoid duplicates)

// ================================
// 🎯 UTILITY FUNCTIONS (Global access needed)
// ================================

function displayTransactionHistory(filter = 'all') {
    if (!walletInstance) return;

    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;

    // Filter transactions
    let filteredTransactions = walletInstance.transactionHistory || [];
    if (filter !== 'all') {
        filteredTransactions = walletInstance.transactionHistory.filter(tx => tx.type === filter);
    }

        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="no-transactions">
                    <i class="fas fa-receipt"></i>
                    <p>No hay transacciones para mostrar</p>
                </div>
            `;
            return;
        }

        const transactionsHTML = filteredTransactions.map(tx => createTransactionHTML(tx)).join('');
        transactionsList.innerHTML = transactionsHTML;
    }

function createTransactionHTML(transaction) {
        const isPositive = ['deposit', 'receive'].includes(transaction.type);
        const amountClass = isPositive ? 'positive' : 'negative';
        const amountSign = isPositive ? '+' : '-';

        // Format date
        const dateStr = formatTransactionDate(transaction.date);

        // Get icon based on type
        const iconClass = getTransactionIcon(transaction.type);

        // Format amount with currency
        const formattedAmount = `${amountSign}${transaction.amount.toFixed(2)} ${transaction.currency}`;

        // Fee display
        const feeDisplay = transaction.fee > 0 ? `Fee: ${transaction.fee.toFixed(2)}` : '';

        // Status badge
        const statusBadge = getStatusBadge(transaction.status);

        // Action buttons for pending transactions
        const actionButtons = getTransactionActions(transaction);

        return `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-header">
                        <div class="transaction-title">${transaction.title}</div>
                        ${statusBadge}
                    </div>
                    <div class="transaction-date">${dateStr}</div>
                    ${feeDisplay ? `<div class="transaction-fee">${feeDisplay}</div>` : ''}
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${amountClass}">${formattedAmount}</div>
                    ${actionButtons}
                </div>
            </div>
        `;
}

// ================================
// 📄 TRANSACTION HELPER METHODS
// ================================

function formatTransactionDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Calculate difference in days
        const diffTime = today - transactionDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Ayer ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

function getTransactionIcon(type) {
        const iconMap = {
            deposit: 'fa-plus-circle',
            withdraw: 'fa-minus-circle',
            send: 'fa-arrow-up',
            receive: 'fa-arrow-down',
            transfer: 'fa-exchange-alt',
            tanda: 'fa-users',
            commission: 'fa-percentage',
            reward: 'fa-gift',
            fee: 'fa-receipt',
            refund: 'fa-undo'
        };
        return iconMap[type] || 'fa-circle';
    }

function getStatusBadge(status) {
        const statusConfig = {
            completed: {
                text: 'Completada',
                class: 'status-completed',
                icon: 'fa-check-circle'
            },
            pending: {
                text: 'Pendiente',
                class: 'status-pending',
                icon: 'fa-clock'
            },
            processing: {
                text: 'Procesando',
                class: 'status-processing',
                icon: 'fa-spinner fa-spin'
            },
            failed: {
                text: 'Fallida',
                class: 'status-failed',
                icon: 'fa-times-circle'
            },
            cancelled: {
                text: 'Cancelada',
                class: 'status-cancelled',
                icon: 'fa-ban'
            }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return `
            <span class="transaction-status ${config.class}">
                <i class="fas ${config.icon}"></i>
                ${config.text}
            </span>
        `;
    }

function getTransactionActions(transaction) {
        // Check if transaction has any user actions available
        if (!transaction.user_actions || transaction.user_actions.length === 0) {
            return '';
        }

        let actions = [];

        // Process each available user action
        transaction.user_actions.forEach(action => {
            switch (action) {
                case 'cancel':
                    actions.push(`
                        <button class="btn-secondary btn-sm" data-action="cancel-user-tx" data-tx-id="${this.escapeHtml(transaction.id)}"" title="Cancelar transacción">
                            <i class="fas fa-times"></i>
                            Cancelar
                        </button>
                    `);
                    break;

                case 'extend_time':
                    actions.push(`
                        <button class="btn-info btn-sm" data-action="request-time-ext" data-tx-id="${this.escapeHtml(transaction.id)}"" title="Solicitar más tiempo">
                            <i class="fas fa-clock"></i>
                            Más tiempo
                        </button>
                    `);
                    break;

                case 'appeal':
                    actions.push(`
                        <button class="btn-warning btn-sm" data-action="submit-appeal" data-tx-id="${this.escapeHtml(transaction.id)}"" title="Apelar decisión del admin">
                            <i class="fas fa-gavel"></i>
                            Apelar
                        </button>
                    `);
                    break;

                case 'retry':
                    actions.push(`
                        <button class="btn-primary btn-sm" data-action="retry-failed-tx" data-tx-id="${this.escapeHtml(transaction.id)}"" title="Reintentar transacción">
                            <i class="fas fa-redo"></i>
                            Reintentar
                        </button>
                    `);
                    break;

                case 'provide_docs':
                    actions.push(`
                        <button class="btn-info btn-sm" data-action="upload-docs" data-tx-id="${this.escapeHtml(transaction.id)}"" title="Subir documentos adicionales">
                            <i class="fas fa-file-upload"></i>
                            Documentos
                        </button>
                    `);
                    break;

                case 'contact_support':
                    actions.push(`
                        <button class="btn-info btn-sm" data-action="contact-support-tx" data-tx-id="${this.escapeHtml(transaction.id)}"" title="Contactar soporte">
                            <i class="fas fa-life-ring"></i>
                            Soporte
                        </button>
                    `);
                    break;
            }
        });

        // Add status-specific information
        let statusInfo = '';
        if (transaction.status === 'pending' && transaction.deadline) {
            const deadline = new Date(transaction.deadline);
            const now = new Date();
            const timeLeft = deadline - now;
            const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));

            if (hoursLeft > 0) {
                statusInfo = `<div class="transaction-deadline">⏱️ ${hoursLeft}h restantes</div>`;
            } else {
                statusInfo = `<div class="transaction-deadline expired">⚠️ Tiempo agotado</div>`;
            }
        }

        if (transaction.status === 'failed' && transaction.admin_reason) {
            statusInfo = `<div class="transaction-reason">❌ ${transaction.admin_reason}</div>`;
        }

        return actions.length > 0 ? `
            <div class="transaction-actions">
                ${statusInfo}
                ${actions.join('')}
            </div>
        ` : '';
    }

    // ================================
    // 🎯 USER TRANSACTION ACTIONS
    // ================================

    // Cancel pending transaction (user-initiated)
function cancelUserTransaction(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) {
            walletInstance.showError('Transacción no encontrada');
            return;
        }

        const confirmation = confirm(
            `¿Está seguro de que desea cancelar esta transacción?\n\n` +
            `Tipo: ${transaction.title}\n` +
            `Monto: ${transaction.amount} ${transaction.currency}\n\n` +
            `Esta acción no se puede deshacer.`
        );

        if (!confirmation) return;

        walletInstance.showLoading('Cancelando transacción...');

        // Simulate API call to admin system
        setTimeout(() => {
            walletInstance.hideLoading();

            // Update transaction status
            transaction.status = 'cancelled';
            transaction.cancelled_by = 'user';
            transaction.cancelled_date = new Date().toISOString();
            transaction.user_actions = []; // Remove all user actions

            walletInstance.saveTransactionHistory();
            walletInstance.displayTransactionHistory();

            walletInstance.showSuccess('Transacción cancelada exitosamente.');

            // Add notification
            walletInstance.addNotification({
                type: 'info',
                title: 'Transacción Cancelada',
                message: `Tu ${transaction.title} de ${transaction.amount} ${transaction.currency} ha sido cancelada.`,
                timestamp: new Date()
            });
        }, 1500);
    }

    // Request time extension for pending transaction
function requestTimeExtension(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) {
            walletInstance.showError('Transacción no encontrada');
            return;
        }

        const reason = prompt(
            'Por favor explique por qué necesita más tiempo para esta transacción:\n\n' +
            '(El admin revisará su solicitud en 1-2 horas)'
        );

        if (!reason || reason.trim() === '') {
            walletInstance.showError('Debe proporcionar una razón para la extensión de tiempo');
            return;
        }

        walletInstance.showLoading('Enviando solicitud de extensión...');

        setTimeout(() => {
            walletInstance.hideLoading();

            // Update transaction
            transaction.extension_requested = true;
            transaction.extension_reason = reason.trim();
            transaction.extension_request_date = new Date().toISOString();
            transaction.user_actions = transaction.user_actions.filter(a => a !== 'extend_time');

            walletInstance.saveTransactionHistory();
            walletInstance.displayTransactionHistory();

            walletInstance.showSuccess('Solicitud de extensión enviada. El admin la revisará pronto.');

            // Add notification
            walletInstance.addNotification({
                type: 'info',
                title: 'Extensión Solicitada',
                message: `Has solicitado más tiempo para tu ${transaction.title}. El admin revisará tu solicitud.`,
                timestamp: new Date()
            });
        }, 2000);
    }

    // Submit appeal for failed/rejected transaction
function submitAppeal(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) {
            walletInstance.showError('Transacción no encontrada');
            return;
        }

        const appealReason = prompt(
            `Razón del rechazo: ${transaction.admin_reason}\n\n` +
            'Por favor explique por qué desea apelar esta decisión:\n\n' +
            '(Incluya cualquier información adicional que pueda ayudar)'
        );

        if (!appealReason || appealReason.trim() === '') {
            walletInstance.showError('Debe proporcionar una razón para la apelación');
            return;
        }

        walletInstance.showLoading('Enviando apelación al admin...');

        setTimeout(() => {
            walletInstance.hideLoading();

            // Update transaction
            transaction.status = 'under_appeal';
            transaction.appeal_reason = appealReason.trim();
            transaction.appeal_date = new Date().toISOString();
            transaction.user_actions = transaction.user_actions.filter(a => a !== 'appeal');

            walletInstance.saveTransactionHistory();
            walletInstance.displayTransactionHistory();

            walletInstance.showSuccess('Apelación enviada exitosamente. Será revisada en 24-48 horas.');

            // Add notification
            walletInstance.addNotification({
                type: 'warning',
                title: 'Apelación Enviada',
                message: `Tu apelación para ${transaction.title} ha sido enviada al admin para revisión.`,
                timestamp: new Date()
            });
        }, 2000);
    }

    // Retry failed transaction with corrected information
function retryFailedTransaction(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) {
            walletInstance.showError('Transacción no encontrada');
            return;
        }

        const confirmation = confirm(
            `¿Desea reintentar esta transacción?\n\n` +
            `Razón del fallo: ${transaction.admin_reason}\n\n` +
            `Asegúrese de corregir la información antes de reintentar.`
        );

        if (!confirmation) return;

        walletInstance.showLoading('Reintentando transacción...');

        setTimeout(() => {
            walletInstance.hideLoading();

            // Create new transaction with corrected information
            const retryTransaction = {
                ...transaction,
                id: transaction.id + '_retry_' + Date.now(),
                status: 'pending',
                date: new Date(),
                retry_of: transaction.id,
                retry_count: (transaction.retry_count || 0) + 1,
                user_actions: ['cancel'], // Only allow cancel for retry
                admin_reason: null
            };

            // Update original transaction
            transaction.retry_attempted = true;
            transaction.retry_date = new Date().toISOString();
            transaction.user_actions = []; // Remove retry option

            // Add retry transaction to history
            walletInstance.transactionHistory.unshift(retryTransaction);

            walletInstance.saveTransactionHistory();
            walletInstance.displayTransactionHistory();

            walletInstance.showSuccess('Transacción reenviada para procesamiento.');

            // Add notification
            walletInstance.addNotification({
                type: 'info',
                title: 'Transacción Reintentada',
                message: `Tu ${transaction.title} ha sido reenviada para procesamiento.`,
                timestamp: new Date()
            });
        }, 2000);
    }

    // Upload additional documents for verification
function uploadAdditionalDocuments(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) {
            walletInstance.showError('Transacción no encontrada');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,.pdf,.doc,.docx';

        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            walletInstance.showLoading('Subiendo documentos...');

        setTimeout(() => {
                walletInstance.hideLoading();

                transaction.additional_docs_uploaded = true;
                transaction.docs_upload_date = new Date().toISOString();
                transaction.uploaded_files = files.map(f => f.name);
                transaction.user_actions = transaction.user_actions.filter(a => a !== 'provide_docs');

                walletInstance.saveTransactionHistory();
                walletInstance.displayTransactionHistory();

                walletInstance.showSuccess(`${files.length} documento(s) subido(s) exitosamente.`);

                walletInstance.addNotification({
                    type: 'success',
                    title: 'Documentos Subidos',
                    message: `Has subido ${files.length} documento(s) para tu ${transaction.title}.`,
                    timestamp: new Date()
                });
            }, 2000);
        };

        input.click();
    }

    // Contact support for specific transaction
function contactSupportForTransaction(transactionId) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) {
            walletInstance.showError('Transacción no encontrada');
            return;
        }

        const message = prompt(
            `Contactar soporte para: ${transaction.title}\n\n` +
            'Describe tu problema o pregunta:\n\n' +
            '(El equipo de soporte te responderá en 2-4 horas)'
        );

        if (!message || message.trim() === '') {
            walletInstance.showError('Debe proporcionar un mensaje para el soporte');
            return;
        }

        walletInstance.showLoading('Enviando mensaje al soporte...');

        setTimeout(() => {
            walletInstance.hideLoading();

            transaction.support_contacted = true;
            transaction.support_message = message.trim();
            transaction.support_contact_date = new Date().toISOString();
            transaction.support_ticket_id = 'SUP-' + Date.now();

            walletInstance.saveTransactionHistory();
            walletInstance.displayTransactionHistory();

            walletInstance.showSuccess(`Mensaje enviado al soporte. Ticket: ${transaction.support_ticket_id}`);

            walletInstance.addNotification({
                type: 'info',
                title: 'Soporte Contactado',
                message: `Has contactado al soporte sobre tu ${transaction.title}. Ticket: ${transaction.support_ticket_id}`,
                timestamp: new Date()
            });
        }, 1500);
    }

    // Save transaction history to localStorage
    // Removed duplicate function - using main saveTransactionHistory() at line 3066

    // ================================
    // 🏛️ TANDAS TRANSACTION METHODS
    // ================================

    /**
     * MÉTODO EFICIENTE PARA DEPÓSITOS DE TANDAS
     * Usando cuenta personal Atlántida con verificación manual
     */
async function processTandaDeposit(tandaId, amount, currency = 'HNL') {
        try {
            const depositReference = generateDepositReference(tandaId);

            const atlantidaAccount = {
                bank: 'Banco Atlántida',
                account_holder: 'Tu Nombre',
                account_number: '****-****-****-1234',
                routing: 'ATLAHNHA',
                currency: currency
            };

            const transaction = {
                id: 'tanda_dep_' + Date.now(),
                type: 'tanda_deposit',
                title: `Depósito a Tanda #${tandaId}`,
                amount: amount,
                currency: currency,
                status: 'pending_verification',
                date: new Date(),
                description: `Depósito para participación en Tanda`,
                tanda_id: tandaId,
                deposit_reference: depositReference,
                deposit_account: atlantidaAccount,
                verification_required: true,
                admin_verification_needed: true,
                user_actions: ['upload_receipt', 'cancel'],
                estimated_processing: '2-4 horas'
            };

            walletInstance.transactionHistory.unshift(transaction);
            walletInstance.saveTransactionHistory();
            walletInstance.displayTransactionHistory();

            showTandaDepositInstructions(transaction);
            return transaction;

        } catch (error) {
            walletInstance.showError('Error al procesar depósito. Intenta nuevamente.');
        }
    }

    /**
     * MÉTODO DUAL PARA RETIROS: ATLÁNTIDA + LIGHTNING
     * < $50 USD: Lightning/Blink (instantáneo)
     * > $50 USD: Atlántida (1-2 días)
     */
async function processTandaWithdrawal(tandaId, amount, currency, withdrawalMethod = 'auto') {
        try {
            if (withdrawalMethod === 'auto') {
                withdrawalMethod = determineOptimalWithdrawalMethod(amount, currency);
            }

            const transaction = {
                id: 'tanda_wth_' + Date.now(),
                type: 'tanda_withdrawal',
                title: `Retiro de Tanda #${tandaId}`,
                amount: amount,
                currency: currency,
                status: 'pending_processing',
                date: new Date(),
                description: `Retiro de ganancias de Tanda`,
                tanda_id: tandaId,
                withdrawal_method: withdrawalMethod,
                admin_verification_needed: true,
                user_actions: ['cancel'],
                estimated_processing: withdrawalMethod === 'lightning' ? '5-10 minutos' : '1-2 días',
                processing_fee: calculateTandaWithdrawalFee(amount, withdrawalMethod)
            };

            if (withdrawalMethod === 'lightning') {
                transaction.lightning_details = {
                    provider: 'Blink',
                    max_amount: 50,
                    instant: true,
                    requires_lightning_address: true
                };
            }

            walletInstance.transactionHistory.unshift(transaction);
            walletInstance.saveTransactionHistory();
            walletInstance.displayTransactionHistory();

            notifyAdminTandaWithdrawal(transaction);
            return transaction;

        } catch (error) {
            walletInstance.showError('Error al procesar retiro. Intenta nuevamente.');
        }
    }

    /**
     * SISTEMA DE GESTIÓN DE LIQUIDEZ
     * Monitorea fondos disponibles y riesgos
     */
function manageTandaLiquidity() {
        return {
            atlantida_balance: 0,
            lightning_balance: 0,
            pending_deposits: 0,
            pending_withdrawals: 0,
            max_daily_deposits: 50000,
            max_single_transaction: 25000,
            min_reserve_ratio: 0.15,
            low_liquidity_threshold: 10000,
            high_risk_threshold: 0.85
        };
    }

    // Helper methods
function generateDepositReference(tandaId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `TANDA${tandaId}_${timestamp}_${random}`;
    }

function determineOptimalWithdrawalMethod(amount, currency) {
        const amountInUSD = currency === 'HNL' ? amount / 24.85 : amount;
        return amountInUSD < 50 ? 'lightning' : 'bank_transfer';
    }

function calculateTandaWithdrawalFee(amount, method) {
        if (method === 'lightning') {
            return 0.50; // Lightning: fee fijo
        } else {
            return Math.max(amount * 0.02, 5.00); // Banco: 2% mín $5
        }
    }

function showTandaDepositInstructions(transaction) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay tanda-instructions-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💰 Instrucciones de Depósito para Tanda</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="deposit-instructions">
                        <div class="instruction-step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Transferencia Bancaria</h4>
                                <p>Monto: <strong>${transaction.amount} ${transaction.currency}</strong></p>
                                <p>Banco: <strong>${transaction.deposit_account.bank}</strong></p>
                                <p>Cuenta: <strong>${transaction.deposit_account.account_number}</strong></p>
                            </div>
                        </div>

                        <div class="instruction-step highlight">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>⚠️ REFERENCIA OBLIGATORIA</h4>
                                <p>En concepto escribe exactamente:</p>
                                <div class="reference-code">
                                    <code>${transaction.deposit_reference}</code>
                                    <button onclick="navigator.clipboard.writeText('${transaction.deposit_reference}')" title="Copiar">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="instruction-step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>Sube Comprobante</h4>
                                <p>Verificación: ${transaction.estimated_processing}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" data-action="upload-tanda-receipt-modal" data-tx-id="${this.escapeHtml(transaction.id)}"">
                        Subir Comprobante
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

function uploadTandaReceipt(transactionId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
            if (!transaction) return;

            walletInstance.showLoading('Subiendo comprobante...');

        setTimeout(() => {
                walletInstance.hideLoading();
                transaction.receipt_uploaded = true;
                transaction.receipt_filename = file.name;
                transaction.receipt_upload_date = new Date();
                transaction.status = 'pending_admin_verification';
                transaction.user_actions = ['cancel'];

                walletInstance.saveTransactionHistory();
                walletInstance.displayTransactionHistory();
                walletInstance.showSuccess('Comprobante subido. Verificación en proceso.');

                    transaction_id: transactionId,
                    tanda_id: transaction.tanda_id,
                    amount: transaction.amount,
                    reference: transaction.deposit_reference
                });
            }, 2000);
        };

        input.click();
    }

function notifyAdminNewDeposit(transaction) {
            type: 'DEPOSIT_APPROVAL_REQUIRED',
            transaction_id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            payment_method: transaction.paymentMethod,
            user_id: transaction.userId,
            wallet_owner: transaction.walletOwner,
            receipt_image: transaction.receiptImage,
            ocr_confidence: transaction.ocrConfidence,
            timestamp: transaction.timestamp,
            reference: transaction.reference,
            description: transaction.description,
            admin_action_required: 'APPROVE_OR_REJECT_DEPOSIT',
            expected_processing_time: transaction.processingTime
        });

        // Store in admin notifications queue (localStorage for now)
        const adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
        adminNotifications.unshift({
            id: `admin_notif_${Date.now()}`,
            type: 'DEPOSIT_APPROVAL_REQUIRED',
            transaction_id: transaction.id,
            user_id: transaction.userId,
            amount: transaction.amount,
            currency: transaction.currency,
            payment_method: transaction.paymentMethod,
            timestamp: new Date(),
            status: 'pending_admin_review',
            priority: 'normal'
        });

        localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));
    }

function notifyAdminTandaWithdrawal(transaction) {
            type: 'tanda_withdrawal_request',
            transaction_id: transaction.id,
            amount: transaction.amount,
            method: transaction.withdrawal_method,
            timestamp: new Date()
        });

        walletInstance.addNotification({
            type: 'info',
            title: 'Retiro en Proceso',
            message: `Retiro de ${transaction.amount} ${transaction.currency} siendo procesado.`,
            timestamp: new Date()
        });
    }

    // ================================
    // 🎯 SISTEMA COMPLETO DE TANDAS CON ADMINISTRADORES Y CICLOS
    // ================================

    /**
     * TRACKING COMPLETO DE TANDAS PARA ADMIN PANEL
     * Maneja: Depósitos → Administradores de Tanda → Pagos de Ciclos → Control de Salidas
     */
function initializeTandaManagementSystem() {
        // Estructura de datos para tracking completo
        walletInstance.tandaSystemData = {
            // Registro de todas las Tandas activas
            active_tandas: {},

            // Administradores de cada Tanda
            tanda_administrators: {},

            // Tracking de fondos por Tanda
            tanda_balances: {},

            // Registro de ciclos y pagos
            cycle_tracking: {},

            // Cola de pagos pendientes para admin panel
            pending_payouts: [],

            // Historial de movimientos para auditoría
            movement_log: []
        };

        // Sistema de cuentas bancarias y métodos de pago
        walletInstance.paymentMethods = {
            // Cuentas bancarias de usuarios
            user_bank_accounts: {},

            // Direcciones Lightning/Blink de usuarios
            user_lightning_addresses: {},

            // Cuentas de creadores de Tandas
            creator_accounts: {},

            // Métodos de pago verificados
            verified_methods: {}
        };

        walletInstance.loadTandaSystemData();
        this.initializePaymentMethods();
    }

    /**
     * PROCESO DEPÓSITO CON TRACKING COMPLETO
     * 1. Usuario deposita → 2. Se asigna a Tanda → 3. Admin Tanda gestiona ciclos
     */
async function processTandaDepositWithTracking(tandaId, amount, currency = 'HNL', participantId) {
        try {
            const depositReference = this.generateTandaReference(tandaId, 'DEP');

            // Obtener info de la Tanda
            const tandaInfo = await this.getTandaInfo(tandaId);
            if (!tandaInfo) {
                throw new Error('Tanda no encontrada');
            }

            const transaction = {
                id: 'tanda_dep_' + Date.now(),
                type: 'tanda_deposit',
                title: `Depósito a Tanda #${tandaId}`,
                amount: amount,
                currency: currency,
                status: 'pending_verification',
                date: new Date(),
                description: `Depósito para participación en Tanda`,

                // DATOS ESPECÍFICOS PARA TRACKING
                tanda_id: tandaId,
                tanda_administrator: tandaInfo.administrator_id,
                participant_id: participantId,
                deposit_reference: depositReference,

                // CONTROL ADMINISTRATIVO
                admin_verification_needed: true,
                tanda_admin_notification_needed: true,

                // TRACKING DE FONDOS
                affects_tanda_balance: true,
                expected_cycle_impact: tandaInfo.next_cycle_info,

                user_actions: ['upload_receipt', 'cancel'],
                estimated_processing: '2-4 horas',

                // INFO PARA ADMIN PANEL
                admin_panel_data: {
                    tanda_name: tandaInfo.name,
                    administrator_name: tandaInfo.administrator_name,
                    current_cycle: tandaInfo.current_cycle,
                    total_participants: tandaInfo.participants.length,
                    cycle_amount: tandaInfo.cycle_amount,
                    next_payout_due: tandaInfo.next_payout_date
                }
            };

            // AGREGAR AL HISTORIAL
            walletInstance.transactionHistory.unshift(transaction);
            walletInstance.saveTransactionHistory();

            // TRACKING PARA ADMIN PANEL
            this.updateTandaTracking('deposit_initiated', {
                tanda_id: tandaId,
                transaction_id: transaction.id,
                amount: amount,
                currency: currency,
                participant_id: participantId,
                reference: depositReference,
                timestamp: new Date()
            });

            walletInstance.displayTransactionHistory();
            showTandaDepositInstructions(transaction);

            return transaction;

        } catch (error) {
            walletInstance.showError('Error al procesar depósito. Intenta nuevamente.');
        }
    }

    /**
     * PROCESO DE PAGO DE CICLO (ÚNICO RETIRO PERMITIDO)
     * Solo el admin puede autorizar pagos de ciclos a usuarios ganadores
     */
async function processCyclePayout(tandaId, cycleNumber, winnerId, amount, currency) {
        try {
            // VERIFICAR QUE ES UN PAGO DE CICLO LEGÍTIMO
            const cycleValidation = await this.validateCyclePayout(tandaId, cycleNumber, winnerId);
            if (!cycleValidation.valid) {
                throw new Error(cycleValidation.reason);
            }

            const payoutReference = this.generateTandaReference(tandaId, 'CYCLE');

            const transaction = {
                id: 'cycle_payout_' + Date.now(),
                type: 'tanda_cycle_payout',
                title: `Pago Ciclo ${cycleNumber} - Tanda #${tandaId}`,
                amount: amount,
                currency: currency,
                status: 'admin_authorized', // Pre-autorizado por admin
                date: new Date(),
                description: `Pago de ciclo a ganador de Tanda`,

                // DATOS DEL CICLO
                tanda_id: tandaId,
                cycle_number: cycleNumber,
                winner_id: winnerId,
                payout_reference: payoutReference,

                // SOLO ADMIN PUEDE PROCESAR
                admin_initiated: true,
                requires_admin_confirmation: true,
                withdrawal_method: this.determineOptimalWithdrawalMethod(amount, currency),

                // TRACKING CRÍTICO
                affects_tanda_balance: true,
                balance_operation: 'subtract',

                user_actions: [], // Usuario no puede cancelar pagos de ciclo
                estimated_processing: '5-10 minutos',

                // DATOS PARA AUDITORÍA
                audit_data: {
                    tanda_administrator: cycleValidation.tanda_info.administrator_id,
                    cycle_participants: cycleValidation.tanda_info.participants.length,
                    cycle_start_date: cycleValidation.cycle_info.start_date,
                    selection_method: cycleValidation.cycle_info.selection_method
                }
            };

            // AGREGAR AL HISTORIAL
            walletInstance.transactionHistory.unshift(transaction);
            walletInstance.saveTransactionHistory();

            // CRITICAL: ACTUALIZAR TRACKING DE TANDA
            this.updateTandaTracking('cycle_payout_processed', {
                tanda_id: tandaId,
                cycle_number: cycleNumber,
                winner_id: winnerId,
                amount: amount,
                transaction_id: transaction.id,
                timestamp: new Date()
            });

            // NOTIFICAR ADMIN PANEL
            this.notifyAdminPanelCyclePayout(transaction);

            walletInstance.displayTransactionHistory();
            return transaction;

        } catch (error) {
            walletInstance.showError('Error al procesar pago de ciclo.');
        }
    }

    /**
     * SISTEMA DE TRACKING PARA ADMIN PANEL
     * Rastrea TODOS los movimientos de fondos
     */
function updateTandaTracking(event_type, data) {
        const trackingEntry = {
            id: 'track_' + Date.now(),
            event_type: event_type,
            timestamp: new Date(),
            data: data,

            // BALANCE IMPACT TRACKING
            balance_impact: this.calculateBalanceImpact(event_type, data),

            // ADMIN PANEL NOTIFICATIONS
            requires_admin_attention: this.requiresAdminAttention(event_type),

            // AUDITORÍA
            user_id: this.currentUser?.id,
            session_id: this.sessionId
        };

        // AGREGAR AL LOG
        this.tandaSystemData.movement_log.unshift(trackingEntry);

        // ACTUALIZAR BALANCES DE TANDA
        this.updateTandaBalance(data.tanda_id, trackingEntry.balance_impact);

        // ENVIAR A ADMIN PANEL (simulado)
        this.sendToAdminPanel(trackingEntry);

        // GUARDAR LOCALMENTE
        this.saveTandaSystemData();

    }

    /**
     * VALIDACIÓN DE PAGOS DE CICLO
     * Solo permite retiros legítimos de ciclos
     */
async function validateCyclePayout(tandaId, cycleNumber, winnerId) {
        try {
            const tandaInfo = await this.getTandaInfo(tandaId);

            // VERIFICACIONES CRÍTICAS
            const validations = {
                tanda_exists: !!tandaInfo,
                cycle_exists: cycleNumber <= tandaInfo.total_cycles,
                winner_is_participant: tandaInfo.participants.includes(winnerId),
                cycle_not_paid: !this.isCyclePaid(tandaId, cycleNumber),
                sufficient_funds: this.getTandaBalance(tandaId) >= tandaInfo.cycle_amount,
                admin_authorized: true // En producción: verificar autorización del admin
            };

            const isValid = Object.values(validations).every(v => v === true);

            return {
                valid: isValid,
                validations: validations,
                reason: isValid ? null : this.getValidationFailureReason(validations),
                tanda_info: tandaInfo,
                cycle_info: this.getCycleInfo(tandaId, cycleNumber)
            };

        } catch (error) {
            return {
                valid: false,
                reason: 'Error en validación: ' + error.message
            };
        }
    }

    /**
     * DATOS PARA ADMIN PANEL
     * Proporciona toda la info necesaria para gestionar Tandas
     */
function getAdminPanelTandaData() {
        return {
            // RESUMEN FINANCIERO
            financial_summary: {
                total_deposits_pending: this.getTotalPendingDeposits(),
                total_payouts_due: this.getTotalPayoutsDue(),
                total_tanda_balance: this.getTotalTandaBalance(),
                liquidity_status: this.getLiquidityStatus()
            },

            // TANDAS ACTIVAS
            active_tandas: this.getActiveTandasSummary(),

            // PAGOS PENDIENTES
            pending_cycle_payouts: this.getPendingCyclePayouts(),

            // DEPÓSITOS PENDIENTES VERIFICACIÓN
            pending_deposit_verifications: this.getPendingDepositVerifications(),

            // MOVIMIENTOS RECIENTES
            recent_movements: this.tandaSystemData.movement_log.slice(0, 20),

            // ALERTAS
            alerts: this.generateTandaAlerts()
        };
    }

    // HELPER METHODS para el sistema

function generateTandaReference(tandaId, type) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${type}${tandaId}_${timestamp}_${random}`;
    }

async function getTandaInfo(tandaId) {
        // En producción: consultar API del sistema de Tandas
        // Por ahora simular datos
        return {
            id: tandaId,
            name: `Tanda #${tandaId}`,
            administrator_id: 'admin_' + tandaId,
            administrator_name: 'Administrador Tanda ' + tandaId,
            current_cycle: 1,
            total_cycles: 10,
            cycle_amount: 1000,
            participants: ['user1', 'user2', 'user3', 'user4', 'user5'],
            next_payout_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
    }

function sendToAdminPanel(trackingEntry) {
        // En producción: enviar via WebSocket o API al admin panel

        // SIMULAR COMUNICACIÓN CON ADMIN PANEL
        if (typeof window !== 'undefined' && window.adminPanelWebSocket) {
            window.adminPanelWebSocket.send(JSON.stringify({
                type: 'tanda_tracking_update',
                data: trackingEntry
            }));
        }
    }

function saveTandaSystemData() {
        localStorage.setItem('tandaSystemData', JSON.stringify(this.tandaSystemData));
    }

function loadTandaSystemData() {
        const saved = localStorage.getItem('tandaSystemData');
        if (saved) {
            walletInstance.tandaSystemData = { ...this.tandaSystemData, ...JSON.parse(saved) };
        }
    }

    // ================================
    // 💰 SISTEMA DE COMISIONES 90/10 OFICIAL
    // ================================

    /**
     * CÁLCULO AUTOMÁTICO DE COMISIONES SEGÚN SISTEMA OFICIAL
     * Basado en el sistema 90/10 descendente configurado
     */
function calculateTandaCommissions(totalAmount, tandaInfo) {
        const COMMISSION_RATE = 0.10; // 10% comisión total

        // Comisión total sobre el monto
        const totalCommission = totalAmount * COMMISSION_RATE;

        // Distribución según sistema 90/10
        const commissionDistribution = {
            // 90% para el coordinador/creador directo de la Tanda
            creator_commission: totalCommission * 0.90,

            // 10% distribuido en niveles superiores
            level_2_commission: totalCommission * 0.05, // 5% del total
            level_3_commission: totalCommission * 0.03, // 3% del total
            level_4_commission: totalCommission * 0.02, // 2% del total

            // Cálculo del monto EXACTO para el ganador del ciclo
            cycle_winner_amount: totalAmount - totalCommission
        };

        return {
            total_collected: totalAmount,
            total_commission: totalCommission,
            distribution: commissionDistribution,

            // DATOS PARA ADMIN PANEL
            admin_panel_instructions: {
                // Monto EXACTO a transferir al ganador
                transfer_to_winner: commissionDistribution.cycle_winner_amount,

                // Comisiones a distribuir
                pay_to_creator: commissionDistribution.creator_commission,
                pay_to_platform: commissionDistribution.level_2_commission +
                               commissionDistribution.level_3_commission +
                               commissionDistribution.level_4_commission,

                // Información del creador de la Tanda
                tanda_creator: tandaInfo.administrator_name,
                tanda_creator_id: tandaInfo.administrator_id,

                // Verificaciones
                verification_checks: {
                    all_deposits_confirmed: this.verifyAllDepositsCompleted(tandaInfo.id),
                    total_matches_expected: totalAmount === (tandaInfo.participants.length * tandaInfo.cycle_amount),
                    commission_calculation_correct: (commissionDistribution.cycle_winner_amount + totalCommission) === totalAmount
                }
            }
        };
    }

    /**
     * PROCESO COMPLETO DE CICLO CON CÁLCULO DE COMISIONES
     * Se ejecuta cuando se completa el capital de una Tanda
     */
async function processTandaCycleWithCommissions(tandaId, cycleNumber, winnerId) {
        try {
            // Obtener información completa de la Tanda
            const tandaInfo = await this.getTandaInfo(tandaId);
            const totalCollected = this.getTandaBalance(tandaId);

            // VERIFICAR que el capital esté completo
            const expectedTotal = tandaInfo.participants.length * tandaInfo.cycle_amount;
            if (totalCollected < expectedTotal) {
                throw new Error(`Capital incompleto. Faltan ${expectedTotal - totalCollected} ${tandaInfo.currency}`);
            }

            // CALCULAR COMISIONES con sistema oficial 90/10
            const commissionData = this.calculateTandaCommissions(totalCollected, tandaInfo);

            // Crear transacción de pago de ciclo
            const cycleTransaction = {
                id: 'cycle_complete_' + Date.now(),
                type: 'tanda_cycle_complete',
                title: `Ciclo ${cycleNumber} Completado - Tanda #${tandaId}`,
                amount: commissionData.distribution.cycle_winner_amount,
                currency: tandaInfo.currency,
                status: 'awaiting_creator_confirmation',
                date: new Date(),
                description: `Ciclo completado, esperando confirmación del creador`,

                // DATOS DEL CICLO
                tanda_id: tandaId,
                cycle_number: cycleNumber,
                winner_id: winnerId,
                total_collected: totalCollected,

                // COMISIONES CALCULADAS
                commission_data: commissionData,

                // INSTRUCCIONES PARA ADMIN PANEL
                admin_instructions: {
                    action_required: 'CONFIRMATION_FROM_CREATOR',
                    creator_id: tandaInfo.administrator_id,
                    creator_name: tandaInfo.administrator_name,

                    message_to_creator: `El capital de la Tanda #${tandaId} está completo (${totalCollected} ${tandaInfo.currency}).
                                       ¿Confirmas el pago de ${commissionData.distribution.cycle_winner_amount} ${tandaInfo.currency}
                                       al ganador del ciclo ${cycleNumber}?`,

                    // MONTOS EXACTOS PARA TRANSFERENCIAS
                    exact_amounts: {
                        to_winner: commissionData.distribution.cycle_winner_amount,
                        to_creator: commissionData.distribution.creator_commission,
                        to_platform: commissionData.distribution.level_2_commission +
                                    commissionData.distribution.level_3_commission +
                                    commissionData.distribution.level_4_commission
                    },

                    verification_passed: commissionData.admin_panel_instructions.verification_checks
                },

                user_actions: [], // No hay acciones para usuarios, solo admin
                estimated_processing: 'Esperando confirmación del creador'
            };

            // Agregar al historial
            this.transactionHistory.unshift(cycleTransaction);
            walletInstance.saveTransactionHistory();

            // NOTIFICAR AL ADMIN PANEL
            this.notifyAdminCycleComplete(cycleTransaction);

            // NOTIFICAR AL CREADOR DE LA TANDA
            this.notifyTandaCreatorForConfirmation(cycleTransaction);

            walletInstance.displayTransactionHistory();
            return cycleTransaction;

        } catch (error) {
            walletInstance.showError('Error al procesar ciclo: ' + error.message);
        }
    }

    /**
     * CONFIRMACIÓN DEL CREADOR DE TANDA
     * El creador confirma que se proceda con el pago
     */
async function confirmCyclePayoutFromCreator(transactionId, creatorConfirmation) {
        const transaction = walletInstance.transactionHistory.find(tx => tx.id === transactionId);
        if (!transaction) {
            throw new Error('Transacción no encontrada');
        }

        if (creatorConfirmation.approved) {
            // El creador aprueba el pago
            transaction.status = 'creator_approved_processing';
            transaction.creator_confirmation = {
                approved: true,
                timestamp: new Date(),
                creator_notes: creatorConfirmation.notes || ''
            };

            // GENERAR INSTRUCCIONES COMPLETAS CON MÉTODOS DE PAGO
            transaction = this.updateTransactionWithPaymentInstructions(transaction);

            // TRACKING PARA AUDITORÍA
            transaction.final_admin_instructions.audit_trail = {
                cycle_completion_verified: true,
                creator_confirmation_received: true,
                commission_calculations_verified: true,
                payment_methods_verified: true,
                ready_for_execution: true
            };

        } else {
            // El creador rechaza o postpone el pago
            transaction.status = 'creator_rejected_pending';
            transaction.creator_confirmation = {
                approved: false,
                timestamp: new Date(),
                rejection_reason: creatorConfirmation.reason,
                creator_notes: creatorConfirmation.notes
            };
        }

        this.saveTransactionHistory();
        this.displayTransactionHistory();

        // Notificar al admin panel
        this.notifyAdminCreatorResponse(transaction);

        return transaction;
    }

/**
 * VERIFICACIONES DE SEGURIDAD
 */
function verifyAllDepositsCompleted(tandaId) {
    const tandaDeposits = this.transactionHistory.filter(tx =>
        tx.tanda_id === tandaId &&
        tx.type === 'tanda_deposit' &&
        tx.status === 'completed'
    );

    const expectedDeposits = this.getTandaInfo(tandaId).then(info => info.participants.length);
    return tandaDeposits.length >= expectedDeposits;
}

function getTandaBalance(tandaId) {
    // En un sistema real, esto consultaría la base de datos
    // Por ahora simular con datos del tracking
    return this.tandaSystemData.tanda_balances[tandaId] || 0;
}

function notifyAdminCycleComplete(transaction) {
            type: 'TANDA_CAPITAL_COMPLETE',
            transaction_id: transaction.id,
            tanda_id: transaction.tanda_id,
            total_collected: transaction.total_collected,
            awaiting_creator_confirmation: true,

            // MONTOS CALCULADOS LISTOS
            calculated_amounts: transaction.admin_instructions.exact_amounts,

            // SIGUIENTE ACCIÓN REQUERIDA
            next_action: 'Wait for creator confirmation',
            creator_to_contact: transaction.admin_instructions.creator_name,

            // DATOS PARA TRACKING
            timestamp: new Date()
        });
    }

function notifyTandaCreatorForConfirmation(transaction) {
        creator_id: transaction.admin_instructions.creator_id,
        creator_name: transaction.admin_instructions.creator_name,
        tanda_id: transaction.tanda_id,
        cycle_number: transaction.cycle_number,
        message: transaction.admin_instructions.message_to_creator,
        amount_to_winner: transaction.admin_instructions.exact_amounts.to_winner,
        creator_commission: transaction.admin_instructions.exact_amounts.to_creator
    });

    // En producción: enviar notificación real al creador
    // WhatsApp, email, SMS, etc.
}

function notifyAdminCreatorResponse(transaction) {
        transaction_id: transaction.id,
        creator_approved: transaction.creator_confirmation.approved,
        ready_for_execution: !!transaction.final_admin_instructions,
        transfers_to_execute: transaction.final_admin_instructions?.transfers || [],
        timestamp: new Date()
    });
}

// ================================
// 🏦 SISTEMA DE MÉTODOS DE PAGO PARA TANDAS
// ================================

/**
 * GESTIÓN COMPLETA DE CUENTAS BANCARIAS Y LIGHTNING
 * Para ejecutar pagos automáticos desde el admin panel
 */
async function initializePaymentMethods() {
    // Cargar métodos de pago guardados
    this.loadPaymentMethods();

    // Inicializar con métodos de ejemplo
    this.setupSamplePaymentMethods();
}

function setupSamplePaymentMethods() {
        // Ejemplo de cuentas bancarias de usuarios
        this.paymentMethods.user_bank_accounts = {
            'user123': {
                primary: {
                    bank: 'Banco Atlántida',
                    account_number: '1234567890',
                    account_holder: 'Juan Pérez González',
                    account_type: 'savings',
                    currency: 'HNL',
                    verified: true,
                    verification_date: '2024-01-15'
                },
                secondary: {
                    bank: 'BAC Credomatic',
                    account_number: '9876543210',
                    account_holder: 'Juan Pérez González',
                    account_type: 'checking',
                    currency: 'HNL',
                    verified: true,
                    verification_date: '2024-01-20'
                }
            },
            'user456': {
                primary: {
                    bank: 'Banco Continental',
                    account_number: '5555666677',
                    account_holder: 'María López Castro',
                    account_type: 'savings',
                    currency: 'HNL',
                    verified: true,
                    verification_date: '2024-02-01'
                }
            }
        };

        // Ejemplo de direcciones Lightning/Blink
        this.paymentMethods.user_lightning_addresses = {
            'user123': {
                blink_address: 'juan@blink.sv',
                lightning_address: 'juan@getalby.com',
                verified: true,
                max_amount_usd: 50,
                preferred_for_small_amounts: true
            },
            'user456': {
                blink_address: 'maria@blink.sv',
                verified: true,
                max_amount_usd: 100,
                preferred_for_small_amounts: true
            }
        };

        // Ejemplo de cuentas de creadores de Tandas
        this.paymentMethods.creator_accounts = {
            'admin_342': {
                name: 'Administrador Tanda 342',
                bank_account: {
                    bank: 'Banco Atlántida',
                    account_number: '1111222233',
                    account_holder: 'Carlos Ruiz Mendoza',
                    account_type: 'checking',
                    currency: 'HNL',
                    verified: true
                },
                lightning_address: 'carlos@blink.sv',
                preferred_method: 'bank_transfer' // Para comisiones siempre banco
            }
        };
    }

    /**
     * OBTENER MÉTODO DE PAGO ÓPTIMO PARA USUARIO
     * Determina automáticamente el mejor método según monto y disponibilidad
     */
function getOptimalPaymentMethod(userId, amount, currency) {
        const userBankAccounts = walletInstance.paymentMethods.user_bank_accounts[userId];
        const userLightning = walletInstance.paymentMethods.user_lightning_addresses[userId];

        // Convertir a USD para evaluación
        const amountInUSD = currency === 'HNL' ? amount / 24.85 : amount;

        // REGLAS DE SELECCIÓN AUTOMÁTICA:
        // 1. Montos < $50 USD → Lightning (si disponible)
        // 2. Montos > $50 USD → Cuenta bancaria
        // 3. Verificar disponibilidad y preferencias

        if (amountInUSD < 50 && userLightning && userLightning.verified) {
            return {
                method: 'lightning',
                details: {
                    type: 'lightning_payment',
                    recipient: userLightning.blink_address || userLightning.lightning_address,
                    provider: userLightning.blink_address ? 'Blink' : 'Lightning',
                    max_amount: userLightning.max_amount_usd,
                    estimated_time: '5-10 minutos',
                    fee: 0.50
                },
                admin_instructions: {
                    platform: 'Blink/Lightning',
                    recipient_address: userLightning.blink_address || userLightning.lightning_address,
                    amount_usd: amountInUSD,
                    amount_local: amount,
                    currency: currency,
                    priority: 'HIGH',
                    execution_time: 'immediate'
                }
            };
        }

        // Para montos grandes o si no hay Lightning, usar cuenta bancaria
        if (userBankAccounts && userBankAccounts.primary && userBankAccounts.primary.verified) {
            const bankAccount = userBankAccounts.primary;

            return {
                method: 'bank_transfer',
                details: {
                    type: 'bank_transfer',
                    bank: bankAccount.bank,
                    account_number: bankAccount.account_number,
                    account_holder: bankAccount.account_holder,
                    account_type: bankAccount.account_type,
                    currency: bankAccount.currency,
                    estimated_time: '1-2 días laborables',
                    fee: Math.max(amount * 0.02, 5.00)
                },
                admin_instructions: {
                    platform: 'Banking',
                    bank_name: bankAccount.bank,
                    account_number: bankAccount.account_number,
                    account_holder: bankAccount.account_holder,
                    amount: amount,
                    currency: currency,
                    reference: `TANDA_PAYOUT_${Date.now()}`,
                    priority: 'MEDIUM',
                    execution_time: '1-2_business_days'
                }
            };
        }

        // Si no hay métodos disponibles
        return {
            method: 'manual_contact',
            details: {
                type: 'manual_contact_required',
                reason: 'No verified payment methods available',
                estimated_time: 'Manual intervention required'
            },
            admin_instructions: {
                action: 'CONTACT_USER',
                user_id: userId,
                reason: 'No hay métodos de pago verificados',
                amount: amount,
                currency: currency,
                priority: 'HIGH',
                requires_manual_setup: true
            }
        };
    }

    /**
     * GENERAR INSTRUCCIONES COMPLETAS PARA ADMIN PANEL
     * Con todos los detalles necesarios para ejecutar pagos
     */
function generatePaymentInstructions(transaction) {
        const { commission_data, winner_id, admin_instructions } = transaction;

        // Obtener métodos de pago para cada destinatario
        const winnerPayment = getOptimalPaymentMethod(
            winner_id,
            commission_data.distribution.cycle_winner_amount,
            transaction.currency
        );

        const creatorPayment = getOptimalPaymentMethod(
            admin_instructions.creator_id,
            commission_data.distribution.creator_commission,
            transaction.currency
        );

        return {
            // INSTRUCCIONES PARA EL ADMIN PANEL
            admin_panel_instructions: {
                transaction_id: transaction.id,
                tanda_id: transaction.tanda_id,
                cycle_number: transaction.cycle_number,
                total_amount: transaction.total_collected,

                // PAGOS A EJECUTAR
                payments_to_execute: [
                    {
                        payment_id: `winner_${transaction.id}`,
                        type: 'cycle_winner_payout',
                        recipient_type: 'participant',
                        recipient_id: winner_id,
                        amount: commission_data.distribution.cycle_winner_amount,
                        currency: transaction.currency,
                        method: winnerPayment.method,
                        details: winnerPayment.admin_instructions,
                        priority: 1,
                        required: true
                    },
                    {
                        payment_id: `creator_${transaction.id}`,
                        type: 'creator_commission',
                        recipient_type: 'tanda_creator',
                        recipient_id: admin_instructions.creator_id,
                        amount: commission_data.distribution.creator_commission,
                        currency: transaction.currency,
                        method: creatorPayment.method,
                        details: creatorPayment.admin_instructions,
                        priority: 2,
                        required: true
                    },
                    {
                        payment_id: `platform_${transaction.id}`,
                        type: 'platform_commission',
                        recipient_type: 'platform',
                        recipient_id: 'platform_account',
                        amount: admin_instructions.exact_amounts.to_platform,
                        currency: transaction.currency,
                        method: 'internal_transfer',
                        details: {
                            platform: 'Internal',
                            account: 'Platform Revenue Account',
                            amount: admin_instructions.exact_amounts.to_platform,
                            currency: transaction.currency,
                            priority: 'LOW',
                            execution_time: 'immediate'
                        },
                        priority: 3,
                        required: true
                    }
                ],

                // RESUMEN PARA ADMIN
                execution_summary: {
                    total_payments: 3,
                    immediate_payments: winnerPayment.method === 'lightning' ? 1 : 0,
                    bank_transfers: winnerPayment.method === 'bank_transfer' ? 1 : 0,
                    estimated_completion: this.getEstimatedCompletionTime([winnerPayment, creatorPayment]),
                    total_fees: this.calculateTotalFees([winnerPayment, creatorPayment]),

                    verification_checklist: [
                        { item: 'Capital completo verificado', status: true },
                        { item: 'Creador confirmó pago', status: true },
                        { item: 'Métodos de pago verificados', status: this.arePaymentMethodsVerified([winnerPayment, creatorPayment]) },
                        { item: 'Comisiones calculadas correctamente', status: true }
                    ]
                }
            }
        };
    }

    /**
     * ACTUALIZAR INSTRUCCIONES FINALES CON MÉTODOS DE PAGO
     * Se ejecuta cuando el creador confirma el pago
     */
function updateTransactionWithPaymentInstructions(transaction) {
        const paymentInstructions = generatePaymentInstructions(transaction);

        // Agregar instrucciones detalladas a la transacción
        transaction.final_admin_instructions = {
            ...transaction.final_admin_instructions,
            ...paymentInstructions.admin_panel_instructions
        };

        return transaction;
    }

    /**
     * HELPER METHODS
     */
function arePaymentMethodsVerified(paymentMethods) {
        return paymentMethods.every(pm =>
            pm.method !== 'manual_contact' &&
            (pm.details.type !== 'manual_contact_required')
        );
    }

function getEstimatedCompletionTime(paymentMethods) {
        const hasBankTransfer = paymentMethods.some(pm => pm.method === 'bank_transfer');
        return hasBankTransfer ? '1-2 días laborables' : '5-10 minutos';
    }

function calculateTotalFees(paymentMethods) {
        return paymentMethods.reduce((total, pm) => {
            return total + (pm.details.fee || 0);
        }, 0);
    }

    /**
     * GESTIÓN DE CUENTAS DE USUARIO
     */
async function addUserBankAccount(userId, bankData) {
        if (!walletInstance.paymentMethods.user_bank_accounts[userId]) {
            walletInstance.paymentMethods.user_bank_accounts[userId] = {};
        }

        const accountKey = Object.keys(walletInstance.paymentMethods.user_bank_accounts[userId]).length === 0 ? 'primary' : 'secondary';

        walletInstance.paymentMethods.user_bank_accounts[userId][accountKey] = {
            ...bankData,
            verified: false,
            verification_date: null,
            added_date: new Date().toISOString()
        };

        savePaymentMethods();

        // Iniciar proceso de verificación
        initiateAccountVerification(userId, accountKey);
    }

async function addUserLightningAddress(userId, lightningData) {
        this.paymentMethods.user_lightning_addresses[userId] = {
            ...lightningData,
            verified: false,
            verification_date: null,
            added_date: new Date().toISOString()
        };

        savePaymentMethods();

        // Iniciar proceso de verificación Lightning
        initiateLightningVerification(userId);
    }

async function initiateAccountVerification(userId, accountKey) {
        // En producción: enviar micro-depósito para verificación
            user_id: userId,
            account_key: accountKey,
            next_step: 'Send micro-deposit for verification'
        });
    }

async function initiateLightningVerification(userId) {
        // En producción: enviar pequeño pago Lightning para verificación
            user_id: userId,
            next_step: 'Send test Lightning payment'
        });
    }

function savePaymentMethods() {
        localStorage.setItem('paymentMethods', JSON.stringify(walletInstance.paymentMethods));
    }

function loadPaymentMethods() {
        const saved = localStorage.getItem('paymentMethods');
        if (saved) {
            walletInstance.paymentMethods = { ...walletInstance.paymentMethods, ...JSON.parse(saved) };
        }
    }

function getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) {
            return 'Hace un momento';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `Hace ${days} día${days > 1 ? 's' : ''}`;
        }
    }

    // ================================
    // 🔄 REFRESH & SYNC
    // ================================

async function refreshWallet() {
        try {
            await this.loadWalletData();
        } catch (error) {
        }
    }

    // ================================
    // 🎨 UI HELPERS
    // ================================

function showLoading(message = 'Cargando...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const messageElement = overlay.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            overlay.classList.add('active');
        }
    }

function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

function showSuccess(message) {
        this.showNotification(message, 'success');
    }

function showError(message) {
        this.showNotification(message, 'error');
    }

function showInfo(message) {
        this.showNotification(message, 'info');
    }

function showNotification(message, type = 'info', persistent = false) {
        // Check if notifications are enabled
        if (!this.walletSettings.notificationsEnabled) {
            return;
        }

        // Add to notification history
        const notificationData = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date(),
            read: false
        };

        this.notificationHistory.unshift(notificationData);
        if (this.notificationHistory.length > 100) {
            this.notificationHistory = this.notificationHistory.slice(0, 100);
        }
        localStorage.setItem('notificationHistory', JSON.stringify(this.notificationHistory));

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.notificationId = notificationData.id;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <div class="notification-text">
                    <span class="notification-message">${message}</span>
                    <small class="notification-time">${this.formatTime(new Date())}</small>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 3000;
                    min-width: 320px;
                    max-width: 450px;
                    background: var(--bg-glass);
                    backdrop-filter: blur(24px);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-lg);
                    animation: slideInRight 0.3s ease;
                    margin-bottom: 10px;
                    cursor: pointer;
                }
                .notification:hover {
                    transform: translateX(-5px);
                    box-shadow: var(--shadow-glow);
                }
                .notification.success { border-left: 4px solid var(--success); }
                .notification.error { border-left: 4px solid var(--error); }
                .notification.warning { border-left: 4px solid var(--warning); }
                .notification.info { border-left: 4px solid var(--info); }
                .notification-content {
                    padding: var(--spacing-md);
                    display: flex;
                    align-items: flex-start;
                    gap: var(--spacing-md);
                    color: var(--text-primary);
                }
                .notification-text {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .notification-message {
                    font-size: 14px;
                    line-height: 1.4;
                }
                .notification-time {
                    font-size: 11px;
                    color: var(--text-muted);
                    opacity: 0.8;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: var(--spacing-xs);
                    border-radius: var(--radius-sm);
                    transition: all var(--transition-fast);
                    flex-shrink: 0;
                }
                .notification-close:hover {
                    background: var(--bg-accent);
                    color: var(--error);
                }
                .secondary-balance {
                    font-size: 0.8em;
                    color: var(--text-muted);
                    opacity: 0.7;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Stack notifications properly
        const existingNotifications = document.querySelectorAll('.notification');
        if (existingNotifications.length > 0) {
            const lastNotification = existingNotifications[existingNotifications.length - 1];
            const rect = lastNotification.getBoundingClientRect();
            notification.style.top = `${rect.bottom + 10}px`;
        }

        document.body.appendChild(notification);

        // Play sound if enabled
        if (this.notificationSettings.soundEnabled) {
            this.playNotificationSound(type);
        }

        // Auto-remove after timeout (unless persistent)
        if (!persistent) {
            const timeout = type === 'error' ? 8000 : 5000;
        setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, timeout);
        }

        return notificationData.id;
    }

function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

function formatDateTime(date) {
        return new Intl.DateTimeFormat('es-HN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

function formatTime(date) {
        return new Intl.DateTimeFormat('es-HN', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // Currency conversion helpers
function convertToPreferredCurrency(amount, fromCurrency) {
        const targetCurrency = this.walletSettings.currencyPreference;

        if (fromCurrency === targetCurrency) {
            return amount;
        }

        // Convert to USD first if needed
        let usdAmount = amount;
        if (fromCurrency === 'HNL') {
            usdAmount = amount * this.exchangeRates.HNL_USD;
        } else if (fromCurrency === 'USD') { // LTD removed
            usdAmount = amount * this.exchangeRates.LTD_USD;
        }

        // Convert from USD to target currency
        if (targetCurrency === 'HNL') {
            return usdAmount * this.exchangeRates.USD_HNL;
        } else if (targetCurrency === 'USD') { // LTD removed
            return usdAmount * this.exchangeRates.USD_LTD;
        }

        return usdAmount; // Default to USD
    }

    // Notification system methods
async function playNotificationSound(type) {
        try {
            // Check if we already have an AudioContext or need to create one
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Check if AudioContext is suspended (due to browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                // Try to resume AudioContext after user gesture
                await this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Different frequencies for different notification types
            const frequencies = {
                success: 800,
                error: 400,
                warning: 600,
                info: 500
            };

            oscillator.frequency.setValueAtTime(frequencies[type] || 500, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            // Silently fail if audio is not available or blocked
            // console.warn('Notification sound not available:', error.message);
        }
    }

// checkLowBalanceAlerts moved to class method above

function sendTransactionNotification(type, amount, currency, description) {
        if (!this.notificationSettings.transactions) return;

        const convertedAmount = this.convertToPreferredCurrency(amount, currency);
        const preferredCurrency = this.walletSettings.currencyPreference;
        const symbol = preferredCurrency === 'USD' ? '$' : 'L';

        let message = '';
        switch (type) {
            case 'sent':
                message = `Pago de ${symbol}${this.formatCurrency(convertedAmount)} enviado exitosamente`;
                break;
            case 'received':
                message = `Pago de ${symbol}${this.formatCurrency(convertedAmount)} recibido`;
                break;
            case 'deposit':
                message = `Depósito de ${symbol}${this.formatCurrency(convertedAmount)} procesado`;
                break;
            case 'withdrawal':
                message = `Retiro de ${symbol}${this.formatCurrency(convertedAmount)} solicitado`;
                break;
        }

        this.showNotification(message, 'success');
    }

function sendSecurityNotification(message, type = 'security_alert') {
        // Show local notification
        if (this.notificationSettings?.security !== false) {
            this.showNotification(message, 'warning', true);
        }
        
        // Send to backend to persist
        try {
            const userId = this.getCurrentUserId();
            if (userId && userId !== 'user_default_123') {
                fetch('https://latanda.online/api/notifications/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        type: type,
                        title: '🔒 Alerta de Seguridad',
                        message: message,
                        data: {
                            timestamp: new Date().toISOString(),
                            device: navigator.userAgent,
                            source: 'wallet_security'
                        }
                    })
                }).catch(() => {});
            }
        } catch (e) {
        }
    }

function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ================================
    // 🌐 TRANSLATION SYSTEM
    // ================================

function initializeTranslations() {
        // Basic translation system integration
        // In production, this would connect to the existing translation system
        const currentLang = localStorage.getItem('preferred_language') || 'es';
        this.applyTranslations(currentLang);
    }

function applyTranslations(lang) {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            // Translation would be applied here
            // For now, keeping Spanish as default
        });
    }

    // ================================
    // 💾 SESSION MANAGEMENT MOVED TO CLASS
    // ================================
    // loadUserSession and saveUserSession are now class methods

    // ================================
    // 🔗 API HELPERS
    // ================================

async function apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${walletInstance.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${walletInstance.userSession?.token}`,
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

// ================================
// 🚀 GLOBAL FUNCTIONS (for HTML onclick events)
// ================================

// Global wallet instance
let walletInstance;

// Declare global functions immediately for HTML event handlers
window.showSendModal = function() {
    if (!walletInstance) {
        return;
    }
    walletInstance.showSendModal();
};

window.showReceiveModal = function() {
    if (!walletInstance) {
        return;
    }
    walletInstance.showReceiveModal();
};


window.showWithdrawModal = function() {
    if (!walletInstance) {
        return;
    }
    walletInstance.showWithdrawModal();
};

// Initialize wallet when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    walletInstance = new LaTandaWallet();

    // Global error handler to capture console errors
    window.addEventListener('error', (e) => {
            message: e.message,
            filename: e.filename,
            line: e.lineno,
            column: e.colno,
            stack: e.error?.stack
        });
    });

    // Global function to manually trigger withdrawal (for debugging)
    window.debugWithdrawal = () => {
        if (walletInstance) {
            walletInstance.processWithdrawal();
        }
    };
});

// Additional global functions for HTML event handlers
function showSendModal() {
    if (!walletInstance) {
        return;
    }
    walletInstance.showSendModal();
}

function closeSendModal() {
    if (!walletInstance) return;
    walletInstance.closeSendModal();
}

function showReceiveModal() {
    if (!walletInstance) {
        return;
    }
    walletInstance.showReceiveModal();
}

function closeReceiveModal() {
    if (!walletInstance) return;
    walletInstance.closeReceiveModal();
}

function showDepositModal(currency) {
    if (!walletInstance) {
        return;
    }
    walletInstance.showDepositModal(currency);
}

function closeDepositModal() {
    if (!walletInstance) return;
    walletInstance.closeDepositModal();
}

function showWithdrawModal() {
    if (!walletInstance) {
        return;
    }
    walletInstance.showWithdrawModal();
}

function closeWithdrawModal() {
    if (!walletInstance) return;
    walletInstance.closeWithdrawModal();
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showStakingModal() {
    walletInstance?.showStakingModal();
}

// New wallet header functions
function goHome() {
    walletInstance?.goHome();
}

function toggleBalanceVisibility() {
    walletInstance?.toggleBalanceVisibility();
}

function toggleWalletSettings() {
    walletInstance?.toggleWalletSettings();
}

function toggleCurrencyPreference() {
    walletInstance?.toggleCurrencyPreference();
}

function toggleNotifications() {
    walletInstance?.toggleNotifications();
}

function showSecuritySettings() {
    walletInstance?.showSecuritySettings();
}

function exportWalletData() {
    walletInstance?.exportWalletData();
}

function showPrivacySettings() {
    walletInstance?.showPrivacySettings();
}

function filterTransactions() {
    walletInstance?.filterTransactions();
}

function showDateFilter() {
    walletInstance?.showDateFilter();
}


function selectBank(bankId) {
    // Find the clicked element from the event
    const element = event && event.target ? event.target.closest('.bank-option') : null;
    walletInstance?.selectBank(bankId, element);
}

function processDeposit() {
    walletInstance?.processDeposit();
}

function copyAddress() {
    walletInstance?.copyAddress();
}

function shareQR() {
    walletInstance?.shareQR();
}

function showTransactionDetails(transactionId) {
    const transaction = walletInstance?.transactionHistory.find(tx => tx.id === transactionId);
    if (transaction) {
        walletInstance?.showInfo(`Detalles de transacción: ${transaction.description}`);
    }
}

// ================================
// 📱 MOBILE BALANCE CARD FUNCTIONS
// ================================

function toggleCardBalance(currency) {
    if (!walletInstance) return;

    const currencyLower = currency.toLowerCase();
    walletInstance.cardVisibility[currencyLower] = !walletInstance.cardVisibility[currencyLower];

    // Toggle visibility icon
    const cardToggle = document.querySelector(`.${currencyLower}-card .card-toggle i`);
    if (cardToggle) {
        if (walletInstance.cardVisibility[currencyLower]) {
            cardToggle.className = 'fas fa-eye';
        } else {
            cardToggle.className = 'fas fa-eye-slash';
        }
    }

    // Toggle balance display
    const primaryBalance = document.querySelector(`.${currencyLower}-card .primary-balance`);
    if (primaryBalance) {
        if (walletInstance.cardVisibility[currencyLower]) {
            primaryBalance.style.filter = 'none';
            primaryBalance.style.opacity = '1';
        } else {
            primaryBalance.style.filter = 'blur(8px)';
            primaryBalance.style.opacity = '0.5';
        }
    }

    // Add haptic feedback simulation
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }

    // Visual feedback
    const cardToggleBtn = document.querySelector(`.${currencyLower}-card .card-toggle`);
    if (cardToggleBtn) {
        cardToggleBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            cardToggleBtn.style.transform = 'scale(1)';
        }, 100);
    }
}

function openSendModal(currency) {
    if (!walletInstance) return;

    // Pre-fill currency in send modal
    const sendCurrency = document.getElementById('sendCurrency');
    if (sendCurrency) {
        sendCurrency.value = currency;
        walletInstance.calculateSendFees();
    }

    // Show modal
    walletInstance.showSendModal();

    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }
}

function openReceiveModal(currency) {
    if (!walletInstance) return;

    // Pre-fill currency in receive modal
    const receiveCurrency = document.getElementById('receiveCurrency');
    if (receiveCurrency) {
        receiveCurrency.value = currency;
        walletInstance.updateReceiveQR();
    }

    // Show modal
    walletInstance.showReceiveModal();

    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }
}

function showStakingModal() {
    if (!walletInstance) return;

    // Create staking modal content
    const modalContent = `
        <div class="modal" id="stakingModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-piggy-bank"></i> Stake LTD Tokens</h3>
                    <button class="modal-close" onclick="closeStakingModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="staking-info">
                        <div class="staking-stats">
                            <div class="stat-item">
                                <span class="stat-label">APY Actual</span>
                                <span class="stat-value">12.5%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Balance Disponible</span>
                                <span class="stat-value">${walletInstance.balances.LTD.toFixed(2)} LTD</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Mínimo a Stake</span>
                                <span class="stat-value">100 LTD</span>
                            </div>
                        </div>

                        <div class="input-group">
                            <label for="stakeAmount">Cantidad a Stake</label>
                            <input type="number" id="stakeAmount" placeholder="0.00" step="0.01" min="100" max="${walletInstance.balances.LTD}">
                        </div>

                        <div class="staking-terms">
                            <p><strong>Términos del Staking:</strong></p>
                            <ul>
                                <li>Periodo mínimo: 30 días</li>
                                <li>Recompensas distribuidas diariamente</li>
                                <li>Penalización por retiro temprano: 2%</li>
                                <li>Gobernanza: Voto en propuestas de La Tanda</li>
                            </ul>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="closeStakingModal()">Cancelar</button>
                            <button type="button" class="btn-primary" onclick="processStaking()">Stake Tokens</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to DOM if it doesn't exist
    if (!document.getElementById('stakingModal')) {
        document.body.insertAdjacentHTML('beforeend', modalContent);
    }

    // Show modal
    const modal = document.getElementById('stakingModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }
}

function closeStakingModal() {
    const modal = document.getElementById('stakingModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function processStaking() {
    if (!walletInstance) return;

    const stakeAmount = parseFloat(document.getElementById('stakeAmount').value);

    if (!stakeAmount || stakeAmount < 100) {
        walletInstance.showError('El monto mínimo para stake es 100 LTD');
        return;
    }

    if (stakeAmount > walletInstance.balances.LTD) {
        walletInstance.showError('No tienes suficientes tokens LTD');
        return;
    }

    walletInstance.showLoading('Procesando stake...');

    // Simulate staking process
        setTimeout(() => {
        walletInstance.balances.LTD -= stakeAmount;
        walletInstance.updateBalanceDisplay();
        walletInstance.updateCurrencyConversions();
        walletInstance.hideLoading();
        walletInstance.showSuccess(`¡Stake exitoso! ${stakeAmount} LTD tokens en staking`);
        closeStakingModal();

        // Add notification
        walletInstance.addNotification({
            type: 'success',
            title: 'Stake Completado',
            message: `${stakeAmount} LTD tokens ahora están en staking ganando 12.5% APY`,
            timestamp: new Date()
        });
    }, 2000);
}

// ================================
// 🌐 GLOBAL FUNCTIONS FOR NEW LAYOUT
// ================================

// Function to navigate to transactions page
function goToTransactions() {
    if (walletInstance) {
        walletInstance.goToTransactions();
    } else {
        window.location.href = 'transacciones.html';
    }
}

// Function to show help modal
function showHelpModal() {
    if (walletInstance) {
        walletInstance.showHelpModal();
    } else {
        // Fallback help modal implementation could go here
    }
}

// Function to filter transactions
function filterTransactions() {
    const filter = document.getElementById('transactionFilter');
    if (filter && walletInstance) {
        // In a real implementation, this would filter the transaction list
        // walletInstance.filterTransactions(filter.value);
    }
}

// Function to show date filter
function showDateFilter() {
    // In a real implementation, this would show a date picker modal
}

// ========================= NEW DEPOSIT FLOW FUNCTIONS =========================

// Copy to clipboard functionality
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 1000);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 1000);
    });
}

// Copy reference functionality
function copyReference() {
    const reference = document.getElementById('depositReference').textContent;
            copyToClipboard(reference, event.target.closest('button'));
}

// File upload handler
function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const uploadArea = document.getElementById('fileUploadArea');
    const placeholder = uploadArea.querySelector('.upload-placeholder');
    const preview = document.getElementById('filePreview');
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            fileName.textContent = file.name;
            placeholder.style.display = 'none';
            preview.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    } else {
        // For PDFs or other files, just show the name
        previewImage.style.display = 'none';
        fileName.textContent = file.name;
        placeholder.style.display = 'none';
        preview.style.display = 'flex';
    }

    // Trigger form validation
    if (walletInstance) {
        walletInstance.setupAtlantidaFormValidation();
    }
}

// Remove file functionality
function removeFile() {
    const input = document.getElementById('depositReceipt');
    const uploadArea = document.getElementById('fileUploadArea');
    const placeholder = uploadArea.querySelector('.upload-placeholder');
    const preview = document.getElementById('filePreview');

    input.value = '';
    placeholder.style.display = 'block';
    preview.style.display = 'none';

    // Trigger form validation
    if (walletInstance) {
        walletInstance.setupAtlantidaFormValidation();
    }
}

// Submit deposit functionality
function submitDeposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const reference = document.getElementById('depositReference').textContent;
    const receiptFile = document.getElementById('depositReceipt').files[0];
    const receiptInput = document.getElementById('depositReceipt');

    if (!amount || !reference || !receiptFile) {
            if (window.showWarning) { window.showWarning('Por favor completa todos los campos'); }
        return;
    }

    // Get the receipt ID that was stored during upload
    const receiptId = receiptInput.dataset.receiptId;

    // Create deposit data
    const depositData = {
        id: reference,
        amount: amount,
        currency: 'HNL',
        method: 'bank_atlantida',
        reference: reference,
        timestamp: new Date().toISOString(),
        status: 'pending_approval',
        accountUsed: '30613012837',
        receiptFile: receiptFile,
        receiptId: receiptId  // Add the receipt ID from receiptManager
    };

    // Process the deposit
    if (walletInstance) {
        walletInstance.processAtlantidaDeposit(depositData);
    }
}

// Method selection functions
function selectDepositMethod(method) {
    if (walletInstance) {
        walletInstance.selectDepositMethod(method);
    }
}

function showMethodSelection() {
    if (walletInstance) {
        walletInstance.showMethodSelection();
    }
}

// Lightning functions
function generateLightningInvoice() {
    if (walletInstance) {
        walletInstance.generateLightningInvoice();
    }
}

function copyLightningInvoice() {
    const textarea = document.getElementById('lightningInvoice');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');

        // Show feedback
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copiado';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 1000);
    }
}

function openLightningWallet() {
    const invoice = document.getElementById('lightningInvoice').value;
    const lightningUrl = `lightning:${invoice}`;

    // Try to open Lightning wallet
    if (navigator.userAgent.match(/Android/i)) {
        window.open(lightningUrl, '_system');
    } else if (navigator.userAgent.match(/iPhone|iPad/i)) {
        window.location = lightningUrl;
    } else {
        // Desktop - copy to clipboard and show instruction
        navigator.clipboard.writeText(invoice).then(() => {
            if (window.showInfo) { window.showInfo('Invoice copiado al portapapeles. Abre tu wallet Lightning y pega el invoice.'); }
        });
    }
}

function checkLightningPayment() {
    if (walletInstance && walletInstance.currentLightningInvoice) {
        walletInstance.checkLightningPaymentStatus(walletInstance.currentLightningInvoice.paymentHash)
            .then(isPaid => {
                if (isPaid) {
                    walletInstance.handleLightningPaymentSuccess();
                } else {
            if (window.showWarning) { window.showWarning('El pago aún no ha sido detectado. Inténtalo de nuevo en unos segundos.'); }
                }
            });
    }
}

// ========================= LIGHTNING WALLET INTEGRATION FUNCTIONS =========================

// Lightning Wallet Configuration and Management
function showLightningWalletConfig() {
    const modal = document.getElementById('lightningWalletModal');
    if (modal) {
        modal.classList.add('active');
        // Check current connection status
        checkLightningWalletConnection();
    }
}

function closeLightningWalletModal() {
    const modal = document.getElementById('lightningWalletModal');
    if (modal) {
        modal.classList.remove('active');
        // Hide transfer section if showing
        hideTransferSection();
    }
}

function checkLightningWalletConnection() {
    // Check if we have a stored Lightning wallet connection
    const lightningConfig = localStorage.getItem('lightningWalletConfig');

    if (lightningConfig) {
        const config = JSON.parse(lightningConfig);
        showConnectedState(config);
        loadLightningBalance();
    } else {
        showDisconnectedState();
    }
}

function showConnectedState(config) {
    const statusCard = document.getElementById('connectionStatus');
    const balanceSection = document.getElementById('lightningBalanceSection');
    const connectionOptions = document.getElementById('connectionOptions');

    statusCard.className = 'status-card connected';
    statusCard.innerHTML = `
        <div class="status-icon">
            <i class="fas fa-bolt"></i>
        </div>
        <div class="status-info">
            <h4>Lightning Wallet Conectado</h4>
            <p>Conectado a ${config.provider} • ${config.alias || 'Lightning Node'}</p>
        </div>
    `;

    balanceSection.style.display = 'block';
    connectionOptions.style.display = 'none';
}

function showDisconnectedState() {
    const statusCard = document.getElementById('connectionStatus');
    const balanceSection = document.getElementById('lightningBalanceSection');
    const connectionOptions = document.getElementById('connectionOptions');

    statusCard.className = 'status-card not-connected';
    statusCard.innerHTML = `
        <div class="status-icon">
            <i class="fas fa-bolt-slash"></i>
        </div>
        <div class="status-info">
            <h4>Lightning Wallet No Conectado</h4>
            <p>Conecta tu wallet Lightning para transferencias instantáneas</p>
        </div>
    `;

    balanceSection.style.display = 'none';
    connectionOptions.style.display = 'block';
}

// Connection Methods
function connectBlink() {

    // Simulate Blink connection for development
    const blinkConfig = {
        provider: 'Blink',
        alias: 'Mi Blink Wallet',
        balance: 76923, // sats
        connected: true,
        connectionDate: new Date().toISOString()
    };

    localStorage.setItem('lightningWalletConfig', JSON.stringify(blinkConfig));
        showConnectedState(blinkConfig);
        loadLightningBalance();

    walletInstance?.showSuccess('✅ Blink Wallet conectado exitosamente!');

    // Send notification
    if (window.notificationSystem) {
        window.notificationSystem.show('lightning_connected', {
            provider: 'Blink',
            balance: '76,923 sats'
        });
    }
}

function connectLNURL() {
    walletInstance?.showError('LNURL-Auth estará disponible pronto');
}

function connectManual() {
    walletInstance?.showError('Configuración manual estará disponible pronto');
}

function loadLightningBalance() {
    const config = JSON.parse(localStorage.getItem('lightningWalletConfig') || '{}');

    if (config.connected) {
        // Simulate Lightning balance (in development)
        const satoshis = config.balance || 76923;
        const usdValue = (satoshis / 100000000) * 65000; // Approximate BTC price

        document.getElementById('lightningBalanceSats').textContent = satoshis.toLocaleString();
        document.getElementById('lightningBalanceUSD').textContent = '$' + usdValue.toFixed(2);
    }
}

function refreshLightningBalance() {
        loadLightningBalance();
    walletInstance?.showSuccess('✅ Balance actualizado');
}

function disconnectLightningWallet() {
    // Show confirmation dialog
    const confirmed = confirm('¿Estás seguro que quieres desconectar tu Lightning Wallet?\n\nPodrás reconectarlo cuando quieras.');

    if (confirmed) {

        // Remove stored configuration
        localStorage.removeItem('lightningWalletConfig');

        // Reset UI to disconnected state
        showDisconnectedState();
        hideTransferSection();

        walletInstance?.showSuccess('⚠️ Lightning Wallet desconectado');
    }
}

// Lightning Transfer Functions
function showLightningTransfer() {
    const transferSection = document.getElementById('lightningTransferSection');
    transferSection.style.display = 'block';

    // Set up amount input monitoring
        setupTransferAmountMonitoring();
}

function hideTransferSection() {
    const transferSection = document.getElementById('lightningTransferSection');
    if (transferSection) {
        transferSection.style.display = 'none';
    }
}

function setupTransferAmountMonitoring() {
    const amountInput = document.getElementById('transferAmount');
    const transferBtn = document.getElementById('executeTransferBtn');
    const satsEquivalent = document.getElementById('transferSatsEquivalent');

    if (!amountInput || !transferBtn) return;

    amountInput.addEventListener('input', () => {
        const amount = parseFloat(amountInput.value) || 0;
        const satoshis = Math.round((amount / 65000) * 100000000); // Approximate conversion

        satsEquivalent.textContent = `≈ ${satoshis.toLocaleString()} sats`;
        transferBtn.disabled = amount < 1;
    });
}

function cancelTransfer() {
    const transferBtn = document.getElementById('executeTransferBtn');
    const amountInput = document.getElementById('transferAmount');

    // Reset button state if it was processing
    if (transferBtn) {
        transferBtn.disabled = false;
        transferBtn.innerHTML = '<i class="fas fa-bolt"></i> Transferir Ahora';
    }

    // Clear amount input
    if (amountInput) {
        amountInput.value = '';
    }

    // Hide transfer section
        hideTransferSection();

    walletInstance?.showSuccess('⚡ Transferencia cancelada');
}

async function executeLightningTransfer() {
    const amountInput = document.getElementById('transferAmount');
    const transferBtn = document.getElementById('executeTransferBtn');
    const amount = parseFloat(amountInput.value);

    // Enhanced validation
    if (!amount || amount < 1) {
        walletInstance?.showError('Ingresa un monto válido mayor a $1');
        return;
    }

    if (amount > 1000) {
        walletInstance?.showError('Monto máximo por transferencia: $1,000 USD');
        return;
    }

    const config = JSON.parse(localStorage.getItem('lightningWalletConfig') || '{}');
    if (!config.connected) {
        walletInstance?.showError('Lightning Wallet no está conectado');
        offerFallbackToAtlantida(amount);
        return;
    }

    // Check Lightning balance
    const satoshis = Math.round((amount / 65000) * 100000000);
    if (satoshis > config.balance) {
        walletInstance?.showError(`Balance Lightning insuficiente. Disponible: ${config.balance.toLocaleString()} sats`);
        offerFallbackToAtlantida(amount);
        return;
    }

    try {

        // Disable button during processing
        transferBtn.disabled = true;
        transferBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        // Simulate Lightning transfer (instant)
        walletInstance?.showSuccess('🔄 Procesando transferencia Lightning...');

        // Simulate potential network issues (5% chance of timeout)
        const simulateTimeout = Math.random() < 0.05;

        if (simulateTimeout) {
            // Simulate timeout after 10 seconds
        setTimeout(() => {
                transferBtn.disabled = false;
                transferBtn.innerHTML = '<i class="fas fa-bolt"></i> Transferir Ahora';

                walletInstance?.showError('⏱️ Transferencia cancelada por timeout. Inténtalo de nuevo.');
        offerRetryOrFallback(amount);
            }, 10000);
            return;
        }

        // Simulate processing time (very short for Lightning)
        setTimeout(() => {
            try {
                // Update Lightning balance
                config.balance -= satoshis;
                localStorage.setItem('lightningWalletConfig', JSON.stringify(config));

                // Update La Tanda wallet balance
                if (walletInstance) {
                    walletInstance.balances.USD += amount;
                    walletInstance.updateBalanceDisplay();

                    // Create transaction record
                    const transaction = {
                        id: 'LT-' + Date.now(),
                        type: 'deposit',
                        description: `Transferencia Lightning → Mi Wallet`,
                        amount: amount,
                        currency: 'USD',
                        status: 'completed',
                        timestamp: new Date(),
                        reference: 'Lightning-' + Date.now(),
                        method: 'lightning-transfer',
                        userId: walletInstance.getCurrentUserId(),
                        isMyTransaction: true,
                        category: 'deposit'
                    };

                    walletInstance.transactionHistory.unshift(transaction);
                    walletInstance.saveTransactionHistory();
                    walletInstance.updateTransactionHistory();
                }

                // Update displays
        loadLightningBalance();
        hideTransferSection();

                walletInstance?.showSuccess(`✅ Transferencia exitosa! +$${amount} USD agregado a Mi Wallet`);

                // Send notification
                if (window.notificationSystem) {
                    window.notificationSystem.show('lightning_transfer_success', {
                        amount: amount,
                        currency: 'USD'
                    });
                }

                // Close modal after success
        setTimeout(() => {
        closeLightningWalletModal();
                }, 2000);

            } catch (processingError) {
                transferBtn.disabled = false;
                transferBtn.innerHTML = '<i class="fas fa-bolt"></i> Transferir Ahora';

                walletInstance?.showError('Error procesando transferencia Lightning');
        offerRetryOrFallback(amount);
            }

        }, 1500);

    } catch (error) {
        transferBtn.disabled = false;
        transferBtn.innerHTML = '<i class="fas fa-bolt"></i> Transferir Ahora';

        walletInstance?.showError('Error de conexión Lightning');
        offerRetryOrFallback(amount);
    }
}

// Helper functions for error handling
function offerFallbackToAtlantida(amount) {
        setTimeout(() => {
        const fallback = confirm(`¿Quieres usar depósito bancario Atlántida en su lugar?\n\nMonto: $${amount} USD`);
        if (fallback) {
        closeLightningWalletModal();
        setTimeout(() => {
                if (walletInstance) {
                    walletInstance.showDepositModal();
        setTimeout(() => {
                        walletInstance.selectDepositMethod('atlantida');
                        document.getElementById('depositAmount').value = amount;
                    }, 500);
                }
            }, 500);
        }
    }, 2000);
}

function offerRetryOrFallback(amount) {
        setTimeout(() => {
        const retry = confirm('¿Quieres intentar nuevamente la transferencia Lightning?\n\nSi cancelas, puedes usar depósito bancario Atlántida.');
        if (!retry) {
        offerFallbackToAtlantida(amount);
        }
        // If retry is true, user can manually try again
    }, 2000);
}

// ============================================
// 🔧 GLOBAL API HELPER FUNCTION (Keep for backward compatibility)
// ============================================

async function apiCall(endpoint, options = {}) {
    // Delegate to wallet instance method if available
    if (typeof walletInstance !== 'undefined' && walletInstance.apiCall) {
        return walletInstance.apiCall(endpoint, options);
    }

    // Fallback implementation for standalone usage
    try {
        const response = await fetch(`https://latanda.online${endpoint}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTandaWallet;
}
