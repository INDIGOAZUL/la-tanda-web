/**
 * Transaction Modal Component
 * Handles Send/Receive cryptocurrency transactions
 * Version: 1.0.0
 * Date: November 1, 2025
 */

class TransactionModal {
    constructor() {
        this.modal = null;
        this.currentTab = 'send';
        this.selectedToken = 'LTD';
        this.userAddress = '0x1234...5678'; // Will be replaced with actual wallet address
        this.tokens = {
            'LTD': { symbol: 'LTD', balance: 24567.89, decimals: 18, icon: '💎' },
            'ETH': { symbol: 'ETH', balance: 0.5, decimals: 18, icon: '⟠' },
            'USDT': { symbol: 'USDT', balance: 1250.00, decimals: 6, icon: '₮' }
        };

        // Cargar datos del wallet si está disponible
        this.loadWalletData();

        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
    }

    loadWalletData() {
        // Intentar obtener datos del Wallet Dropdown si está disponible
        if (typeof walletDropdown !== 'undefined' && walletDropdown.walletAddress) {

            this.userAddress = walletDropdown.walletAddress;

            // Actualizar tokens con balances reales
            this.tokens = {
                'LTD': {
                    symbol: 'LTD',
                    balance: walletDropdown.balance.available || 0,
                    decimals: 18,
                    icon: '💎'
                },
                'ETH': {
                    symbol: 'ETH',
                    balance: walletDropdown.balance.eth || 0,
                    decimals: 18,
                    icon: '⟠'
                },
                'USDT': {
                    symbol: 'USDT',
                    balance: walletDropdown.balance.usdt || 0,
                    decimals: 6,
                    icon: '₮'
                }
            };

        } else {
            // Usar datos mock (ya definidos en constructor)
        }
    }

    createModal() {
        const modalHTML = `
            <div id="transactionModal" class="transaction-modal-overlay hidden">
                <div class="transaction-modal">
                    <!-- Header -->
                    <div class="modal-header">
                        <h2 class="modal-title">
                            <i class="fas fa-exchange-alt"></i>
                            Transaction
                        </h2>
                        <button class="modal-close" onclick="transactionModal.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="modal-tabs">
                        <button class="tab-btn active" data-tab="send">
                            <i class="fas fa-paper-plane"></i>
                            Send
                        </button>
                        <button class="tab-btn" data-tab="receive">
                            <i class="fas fa-qrcode"></i>
                            Receive
                        </button>
                    </div>

                    <!-- Send Tab Content -->
                    <div id="sendTab" class="tab-content active">
                        <!-- Token Selector -->
                        <div class="form-group">
                            <label class="form-label">Token</label>
                            <div class="token-selector">
                                ${Object.entries(this.tokens).map(([key, token]) => `
                                    <button class="token-option ${key === 'LTD' ? 'active' : ''}" data-token="${key}">
                                        <span class="token-icon">${token.icon}</span>
                                        <div class="token-info">
                                            <span class="token-symbol">${token.symbol}</span>
                                            <span class="token-balance">${token.balance.toFixed(2)}</span>
                                        </div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Recipient Address -->
                        <div class="form-group">
                            <label class="form-label">
                                Recipient Address
                                <span class="label-required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input
                                    type="text"
                                    id="recipientAddress"
                                    class="form-input"
                                    placeholder="0x..."
                                    maxlength="42"
                                >
                                <button class="input-action-btn" onclick="transactionModal.pasteAddress()" title="Paste">
                                    <i class="fas fa-paste"></i>
                                </button>
                            </div>
                            <span class="input-error" id="addressError"></span>
                        </div>

                        <!-- Amount -->
                        <div class="form-group">
                            <label class="form-label">
                                Amount
                                <span class="label-required">*</span>
                            </label>
                            <div class="input-wrapper">
                                <input
                                    type="number"
                                    id="amountInput"
                                    class="form-input"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                >
                                <button class="input-action-btn max-btn" onclick="transactionModal.setMaxAmount()">
                                    MAX
                                </button>
                            </div>
                            <div class="amount-info">
                                <span class="amount-usd" id="amountUSD">≈ $0.00 USD</span>
                                <span class="amount-available">Available: <span id="availableBalance">24,567.89</span> LTD</span>
                            </div>
                            <span class="input-error" id="amountError"></span>
                        </div>

                        <!-- Gas Fee Estimate -->
                        <div class="gas-estimate">
                            <div class="gas-row">
                                <span class="gas-label">
                                    <i class="fas fa-gas-pump"></i>
                                    Network Fee
                                </span>
                                <span class="gas-value" id="gasFee">
                                    <span class="gas-loading">Calculating...</span>
                                </span>
                            </div>
                            <div class="gas-row total">
                                <span class="gas-label">Total</span>
                                <span class="gas-value" id="totalAmount">0.00 LTD</span>
                            </div>
                        </div>

                        <!-- Send Button -->
                        <button class="modal-action-btn" id="sendBtn" onclick="transactionModal.sendTransaction()" disabled>
                            <i class="fas fa-paper-plane"></i>
                            Send Transaction
                        </button>
                    </div>

                    <!-- Receive Tab Content -->
                    <div id="receiveTab" class="tab-content">
                        <div class="receive-container">
                            <!-- QR Code -->
                            <div class="qr-code-container">
                                <div class="qr-code-placeholder">
                                    <i class="fas fa-qrcode"></i>
                                    <p>Scan to receive</p>
                                </div>
                            </div>

                            <!-- Address Display -->
                            <div class="address-display">
                                <label class="form-label">Your Wallet Address</label>
                                <div class="address-box">
                                    <span class="address-text" id="walletAddress">${this.userAddress}</span>
                                    <button class="copy-btn" onclick="transactionModal.copyAddress()">
                                        <i class="fas fa-copy"></i>
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <!-- Instructions -->
                            <div class="receive-instructions">
                                <p class="instruction-title">
                                    <i class="fas fa-info-circle"></i>
                                    How to receive
                                </p>
                                <ul class="instruction-list">
                                    <li>Share this address with the sender</li>
                                    <li>Or scan the QR code</li>
                                    <li>Funds will appear once confirmed on the blockchain</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Transaction Status (Hidden by default) -->
                    <div id="transactionStatus" class="transaction-status hidden">
                        <div class="status-content">
                            <div class="status-icon">
                                <i class="fas fa-spinner fa-spin"></i>
                            </div>
                            <h3 class="status-title">Processing Transaction...</h3>
                            <p class="status-message">Please confirm the transaction in your wallet</p>
                            <div class="status-progress">
                                <div class="progress-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('transactionModal');
    }

    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn').dataset.tab));
        });

        // Token selection
        document.querySelectorAll('.token-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectToken(e.target.closest('.token-option').dataset.token));
        });

        // Input validation
        const addressInput = document.getElementById('recipientAddress');
        const amountInput = document.getElementById('amountInput');

        if (addressInput) {
            addressInput.addEventListener('input', () => this.validateAddress());
            addressInput.addEventListener('blur', () => this.validateAddress());
        }

        if (amountInput) {
            amountInput.addEventListener('input', () => this.validateAmount());
            amountInput.addEventListener('blur', () => this.validateAmount());
        }

        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    open(tab = 'send') {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Cambiar a tab especificado
        this.switchTab(tab);

        // Recargar datos del wallet (por si cambiaron)
        this.loadWalletData();
        this.updateBalanceDisplays();

        // Estimate gas fee
        setTimeout(() => this.estimateGas(), 500);

    }

    updateBalanceDisplays() {
        // Actualizar balance disponible en UI
        const balanceEl = document.getElementById('availableBalance');
        if (balanceEl && this.tokens[this.selectedToken]) {
            balanceEl.textContent = this.tokens[this.selectedToken].balance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        // Actualizar dirección del wallet en tab Receive
        const walletAddressEl = document.getElementById('walletAddress');
        if (walletAddressEl) {
            walletAddressEl.textContent = this.userAddress;
        }

        // Actualizar token selector con balances actuales
        document.querySelectorAll('.token-option').forEach(btn => {
            const tokenSymbol = btn.dataset.token;
            const balanceSpan = btn.querySelector('.token-balance');
            if (balanceSpan && this.tokens[tokenSymbol]) {
                balanceSpan.textContent = this.tokens[tokenSymbol].balance.toFixed(2);
            }
        });

    }

    close() {
        this.modal.classList.remove('active');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);

        // Reset form
        this.resetForm();

    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}Tab`);
        });

    }

    selectToken(token) {
        this.selectedToken = token;

        // Update UI
        document.querySelectorAll('.token-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.token === token);
        });

        // Update available balance
        const balanceEl = document.getElementById('availableBalance');
        if (balanceEl) {
            balanceEl.textContent = this.tokens[token].balance.toFixed(2);
        }

        // Re-validate amount
        this.validateAmount();

    }

    validateAddress() {
        const input = document.getElementById('recipientAddress');
        const error = document.getElementById('addressError');
        const address = input.value.trim();

        if (!address) {
            error.textContent = '';
            input.classList.remove('error', 'valid');
            this.updateSendButton();
            return false;
        }

        // Validate Ethereum address format
        const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);

        if (isValid) {
            input.classList.remove('error');
            input.classList.add('valid');
            error.textContent = '';
        } else {
            input.classList.remove('valid');
            input.classList.add('error');
            error.textContent = 'Invalid address format';
        }

        this.updateSendButton();
        return isValid;
    }

    validateAmount() {
        const input = document.getElementById('amountInput');
        const error = document.getElementById('amountError');
        const amount = parseFloat(input.value);
        const available = this.tokens[this.selectedToken].balance;

        if (!input.value) {
            error.textContent = '';
            input.classList.remove('error', 'valid');
            this.updateSendButton();
            return false;
        }

        if (isNaN(amount) || amount <= 0) {
            input.classList.add('error');
            error.textContent = 'Amount must be greater than 0';
            this.updateSendButton();
            return false;
        }

        if (amount > available) {
            input.classList.add('error');
            error.textContent = 'Insufficient balance';
            this.updateSendButton();
            return false;
        }

        input.classList.remove('error');
        input.classList.add('valid');
        error.textContent = '';

        // Update USD equivalent (mock)
        const usdRate = 0.85; // Mock rate
        const usdValue = (amount * usdRate).toFixed(2);
        document.getElementById('amountUSD').textContent = `≈ $${usdValue} USD`;

        // Update total
        this.updateTotal();

        this.updateSendButton();
        return true;
    }

    updateSendButton() {
        const btn = document.getElementById('sendBtn');
        const addressValid = this.validateAddress();
        const amountValid = this.validateAmount();

        if (addressValid && amountValid) {
            btn.disabled = false;
            btn.classList.add('enabled');
        } else {
            btn.disabled = true;
            btn.classList.remove('enabled');
        }
    }

    estimateGas() {
        const gasFeeEl = document.getElementById('gasFee');

        // Simulate gas calculation
        setTimeout(() => {
            const gasFee = (Math.random() * 0.005 + 0.002).toFixed(4); // Mock gas fee
            gasFeeEl.innerHTML = `<span class="gas-amount">${gasFee} ETH</span> <span class="gas-usd">(≈ $${(gasFee * 2000).toFixed(2)})</span>`;
            this.updateTotal();
        }, 1000);
    }

    updateTotal() {
        const amount = parseFloat(document.getElementById('amountInput')?.value || 0);
        const totalEl = document.getElementById('totalAmount');

        if (totalEl && amount > 0) {
            totalEl.textContent = `${amount.toFixed(2)} ${this.selectedToken}`;
        }
    }

    setMaxAmount() {
        const input = document.getElementById('amountInput');
        const maxAmount = this.tokens[this.selectedToken].balance;
        input.value = maxAmount.toFixed(2);
        this.validateAmount();
    }

    async pasteAddress() {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('recipientAddress').value = text;
            this.validateAddress();
        } catch (err) {
        }
    }

    copyAddress() {
        const address = document.getElementById('walletAddress').textContent;

        navigator.clipboard.writeText(address).then(() => {
            // Show success feedback
            const btn = event.target.closest('.copy-btn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.classList.add('success');

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('success');
            }, 2000);

            // Show notification (if notification center exists)
            if (typeof notificationCenter !== 'undefined') {
                notificationCenter.show('Address copied to clipboard', 'success');
            }
        }).catch(err => {
        });
    }

    async sendTransaction() {
        const address = document.getElementById('recipientAddress').value;
        const amount = document.getElementById('amountInput').value;


        // Show loading state
        this.showTransactionStatus('processing');

        // Simulate transaction (replace with actual Web3 call)
        setTimeout(() => {
            const success = Math.random() > 0.2; // 80% success rate

            if (success) {
                this.showTransactionStatus('success');

                // Show notification
                if (typeof notificationCenter !== 'undefined') {
                    notificationCenter.show(
                        `Successfully sent ${amount} ${this.selectedToken}`,
                        'success'
                    );
                }

                // Close modal after success
                setTimeout(() => this.close(), 3000);
            } else {
                this.showTransactionStatus('error');
            }
        }, 3000);
    }

    showTransactionStatus(status) {
        const statusDiv = document.getElementById('transactionStatus');
        const icon = statusDiv.querySelector('.status-icon i');
        const title = statusDiv.querySelector('.status-title');
        const message = statusDiv.querySelector('.status-message');

        statusDiv.classList.remove('hidden');

        if (status === 'processing') {
            icon.className = 'fas fa-spinner fa-spin';
            title.textContent = 'Processing Transaction...';
            message.textContent = 'Please confirm the transaction in your wallet';
        } else if (status === 'success') {
            icon.className = 'fas fa-check-circle';
            title.textContent = 'Transaction Successful!';
            message.textContent = 'Your transaction has been confirmed';
            statusDiv.classList.add('success');
        } else if (status === 'error') {
            icon.className = 'fas fa-times-circle';
            title.textContent = 'Transaction Failed';
            message.textContent = 'Please try again or contact support';
            statusDiv.classList.add('error');
        }
    }

    resetForm() {
        // Reset inputs
        document.getElementById('recipientAddress').value = '';
        document.getElementById('amountInput').value = '';

        // Reset errors
        document.querySelectorAll('.input-error').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-input').forEach(el => {
            el.classList.remove('error', 'valid');
        });

        // Hide status
        const statusDiv = document.getElementById('transactionStatus');
        statusDiv.classList.add('hidden');
        statusDiv.classList.remove('success', 'error');

        // Reset to send tab
        this.switchTab('send');
    }
}

// Initialize on DOM ready
let transactionModal;
document.addEventListener('DOMContentLoaded', () => {
    transactionModal = new TransactionModal();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionModal;
}
