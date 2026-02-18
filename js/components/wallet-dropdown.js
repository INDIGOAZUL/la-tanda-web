/* ============================================
   WALLET DROPDOWN COMPONENT
   Web3 wallet integration with real-time updates
   ============================================ */

class WalletDropdown {
    constructor() {
        this.isOpen = false;
        this.walletAddress = null;
        this.balance = {
            ltd: 0,
            usd: 0,
            staked: 0,
            available: 0
        };
        this.network = {
            name: 'Unknown',
            chainId: null,
            isCorrect: false
        };
        this.transactions = [];
        this.isLoading = false;
        this.updateInterval = null;

        // Expected network (Polygon Amoy Testnet)
        this.expectedChainId = '0x13882'; // 80002 in decimal
        this.expectedNetworkName = 'Polygon Amoy';

        this.init();
    }

    init() {
        this.createDropdownHTML();
        this.attachEventListeners();
        this.checkWalletConnection();

        // Listen for account/network changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountChange(accounts);
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.handleNetworkChange(chainId);
            });
        }
    }

    createDropdownHTML() {
        const container = document.createElement('div');
        container.className = 'wallet-dropdown';
        container.id = 'walletDropdown';

        container.innerHTML = `
            <!-- Wallet Header -->
            <div class="wallet-header">
                <div class="wallet-address-section">
                    <div class="wallet-identicon" id="walletIdenticon">👤</div>
                    <div class="wallet-address-info">
                        <div class="wallet-address-label">Connected Wallet</div>
                        <div class="wallet-address-display">
                            <span class="wallet-address-text" id="walletAddressText">Not Connected</span>
                            <button class="wallet-copy-btn" id="walletCopyBtn" title="Copy address">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="wallet-network" id="walletNetwork">
                    <div class="network-dot" id="networkDot"></div>
                    <span class="network-name" id="networkName">Detecting...</span>
                    <span class="network-chain-id" id="networkChainId"></span>
                </div>
            </div>

            <!-- Balance Section -->
            <div class="wallet-balance">
                <div class="balance-main">
                    <div class="balance-label">Total Balance</div>
                    <div>
                        <span class="balance-amount" id="balanceAmount">0.00</span>
                        <span class="balance-token">LTD</span>
                    </div>
                    <div class="balance-usd" id="balanceUsd">≈ $0.00 USD</div>
                </div>

                <div class="balance-breakdown">
                    <div class="balance-item">
                        <div class="balance-item-label">Available</div>
                        <div>
                            <span class="balance-item-value" id="balanceAvailable">0.00</span>
                            <span class="balance-item-token">LTD</span>
                        </div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-item-label">Staked</div>
                        <div>
                            <span class="balance-item-value" id="balanceStaked">0.00</span>
                            <span class="balance-item-token">LTD</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Transactions -->
            <div class="wallet-transactions">
                <div class="transactions-header">
                    <h4 class="transactions-title">Recent Activity</h4>
                    <a href="my-wallet.html" class="transactions-view-all">View All →</a>
                </div>
                <div class="transactions-list" id="transactionsList">
                    <div class="wallet-loading">
                        <div class="wallet-loading-spinner"></div>
                        Loading transactions...
                    </div>
                </div>
            </div>

            <!-- QR Code Section (Hidden by default) -->
            <div class="wallet-qr" id="walletQr">
                <div class="qr-container">
                    <div class="qr-code" id="qrCode">
                        <canvas id="qrCanvas"></canvas>
                    </div>
                    <div class="qr-label">Scan to send tokens to this address</div>
                </div>
            </div>

            <!-- Wallet Actions -->
            <div class="wallet-actions">
                <button class="wallet-action-btn" id="walletReceiveBtn">
                    <i class="fas fa-qrcode"></i>
                    Receive
                </button>
                <button class="wallet-action-btn" id="walletSendBtn">
                    <i class="fas fa-paper-plane"></i>
                    Send
                </button>
                <button class="wallet-action-btn disconnect" id="walletDisconnectBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    Disconnect
                </button>
            </div>
        `;

        document.body.appendChild(container);
    }

    attachEventListeners() {
        // Copy address button
        const copyBtn = document.getElementById('walletCopyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyAddress());
        }

        // Receive button (open modal)
        const receiveBtn = document.getElementById('walletReceiveBtn');
        if (receiveBtn) {
            receiveBtn.addEventListener('click', () => this.openReceiveModal());
        }

        // Send button
        const sendBtn = document.getElementById('walletSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.openSendModal());
        }

        // Disconnect button
        const disconnectBtn = document.getElementById('walletDisconnectBtn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnect());
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('walletDropdown');
            const walletButton = document.querySelector('[data-wallet-toggle]');

            if (dropdown && !dropdown.contains(e.target) &&
                walletButton && !walletButton.contains(e.target)) {
                this.close();
            }
        });

    }

    async connectWallet() {
        if (!window.ethereum) {
            alert('Please install MetaMask or another Web3 wallet to continue.\n\nVisit: https://metamask.io');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            if (accounts.length > 0) {
                this.walletAddress = accounts[0];
                await this.loadWalletData();
            }
        } catch (error) {
            if (error.code === 4001) {
                // User rejected the connection
                alert('Wallet connection rejected. Please try again.');
            } else {
                alert('Failed to connect wallet. Please try again.');
            }
        }
    }

    async checkWalletConnection() {
        if (!window.ethereum) {
            this.showNotConnected();
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });

            if (accounts.length > 0) {
                this.walletAddress = accounts[0];
                await this.loadWalletData();
            } else {
                this.showNotConnected();
            }
        } catch (error) {
            this.showError('Failed to check wallet connection');
        }
    }

    async loadWalletData() {
        if (!this.walletAddress) return;

        this.isLoading = true;

        try {
            // Update UI with address
            this.updateAddressDisplay();

            // Check network
            await this.checkNetwork();

            // Load balance
            await this.loadBalance();

            // Load transactions
            await this.loadTransactions();

            // Start auto-refresh (every 30 seconds)
            this.startAutoRefresh();

        } catch (error) {
            this.showError('Failed to load wallet data');
        } finally {
            this.isLoading = false;
        }
    }

    async checkNetwork() {
        if (!window.ethereum) return;

        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });

            this.network.chainId = chainId;
            this.network.isCorrect = (chainId === this.expectedChainId);

            // Set network name
            if (chainId === this.expectedChainId) {
                this.network.name = this.expectedNetworkName;
            } else {
                this.network.name = this.getNetworkName(chainId);
            }

            this.updateNetworkDisplay();
        } catch (error) {
        }
    }

    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x89': 'Polygon Mainnet',
            '0x13881': 'Polygon Mumbai',
            '0x13882': 'Polygon Amoy',
            '0x5': 'Goerli Testnet',
            '0xaa36a7': 'Sepolia Testnet'
        };

        return networks[chainId] || 'Unknown Network';
    }

    async loadBalance() {
        // Try to get balance from API
        try {
            const response = await fetch('/api/wallet/balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(localStorage.getItem('auth_token') || localStorage.getItem('authToken'))}`
                },
                body: JSON.stringify({
                    address: this.walletAddress
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.balance = {
                    ltd: parseFloat(data.balance) || 0,
                    usd: parseFloat(data.balanceUsd) || 0,
                    staked: parseFloat(data.staked) || 0,
                    available: parseFloat(data.available) || 0
                };
            } else {
                // Fallback to mock data
                this.balance = this.getMockBalance();
            }
        } catch (error) {
            this.balance = this.getMockBalance();
        }

        this.updateBalanceDisplay();
    }

    getMockBalance() {
        // Mock balance for testing
        return {
            ltd: 1250.50,
            usd: 625.25,
            staked: 500.00,
            available: 750.50
        };
    }

    async loadTransactions() {
        try {
            const response = await fetch('/api/user/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(localStorage.getItem('auth_token') || localStorage.getItem('authToken'))}`
                },
                body: JSON.stringify({
                    userId: localStorage.getItem('userId'),
                    limit: 5
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.transactions = data.transactions || [];
            } else {
                this.transactions = this.getMockTransactions();
            }
        } catch (error) {
            this.transactions = this.getMockTransactions();
        }

        this.updateTransactionsDisplay();
    }

    getMockTransactions() {
        return [
            {
                type: 'receive',
                amount: 100,
                token: 'LTD',
                status: 'confirmed',
                time: new Date(Date.now() - 2 * 60 * 1000),
                hash: '0x1234...5678'
            },
            {
                type: 'send',
                amount: -50,
                token: 'LTD',
                status: 'confirmed',
                time: new Date(Date.now() - 1 * 60 * 60 * 1000),
                hash: '0xabcd...efgh'
            },
            {
                type: 'swap',
                amount: 25,
                token: 'LTD',
                status: 'confirmed',
                time: new Date(Date.now() - 3 * 60 * 60 * 1000),
                hash: '0x9876...5432'
            }
        ];
    }

    updateAddressDisplay() {
        const addressText = document.getElementById('walletAddressText');
        const identicon = document.getElementById('walletIdenticon');

        // ALSO UPDATE HEADER WALLET ADDRESS
        const headerAddress = document.querySelector('.wallet-address');

        if (addressText && this.walletAddress) {
            const shortened = this.shortenAddress(this.walletAddress);
            addressText.textContent = shortened;

            // Update header wallet address too
            if (headerAddress) {
                headerAddress.textContent = shortened;
            }

            // Generate simple identicon (first 2 chars)
            if (identicon) {
                identicon.textContent = this.walletAddress.slice(2, 4).toUpperCase();
            }
        } else if (headerAddress) {
            // Not connected - show prompt
            headerAddress.textContent = 'Connect Wallet';
        }
    }

    updateNetworkDisplay() {
        const networkName = document.getElementById('networkName');
        const networkChainId = document.getElementById('networkChainId');
        const networkDot = document.getElementById('networkDot');

        if (networkName) {
            networkName.textContent = this.network.name;
        }

        if (networkChainId && this.network.chainId) {
            const decimalChainId = parseInt(this.network.chainId, 16);
            networkChainId.textContent = `(${decimalChainId})`;
        }

        if (networkDot) {
            networkDot.className = this.network.isCorrect ? 'network-dot' : 'network-dot wrong-network';
        }
    }

    updateBalanceDisplay() {
        const balanceAmount = document.getElementById('balanceAmount');
        const balanceUsd = document.getElementById('balanceUsd');
        const balanceAvailable = document.getElementById('balanceAvailable');
        const balanceStaked = document.getElementById('balanceStaked');

        // ALSO UPDATE HEADER WALLET BALANCE
        const headerBalance = document.querySelector('.wallet-balance[data-balance-ltd]');

        if (balanceAmount) {
            balanceAmount.textContent = this.formatNumber(this.balance.ltd);
        }

        // Update header balance
        if (headerBalance && this.balance.ltd !== undefined) {
            headerBalance.textContent = `${this.formatNumber(this.balance.ltd)} LTD`;
        }

        if (balanceUsd) {
            balanceUsd.textContent = `≈ $${this.formatNumber(this.balance.usd)} USD`;
        }

        if (balanceAvailable) {
            balanceAvailable.textContent = this.formatNumber(this.balance.available);
        }

        if (balanceStaked) {
            balanceStaked.textContent = this.formatNumber(this.balance.staked);
        }
    }

    updateTransactionsDisplay() {
        const transactionsList = document.getElementById('transactionsList');

        if (!transactionsList) return;

        if (this.transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="transactions-empty">
                    <i class="fas fa-inbox"></i>
                    <div>No recent transactions</div>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = this.transactions.map(tx => `
            <div class="transaction-item" data-tx-hash="${this.escapeHtml(tx.hash)}"">
                <div class="transaction-icon ${tx.type}">
                    <i class="fas fa-${this.getTransactionIcon(tx.type)}"></i>
                </div>
                <div class="transaction-info">
                    <div class="transaction-type">${this.getTransactionLabel(tx.type)}</div>
                    <div class="transaction-time">${this.formatTimeAgo(tx.time)}</div>
                </div>
                <div class="transaction-amount">
                    <div class="transaction-value ${tx.amount > 0 ? 'positive' : 'negative'}">
                        ${tx.amount > 0 ? '+' : ''}${this.formatNumber(Math.abs(tx.amount))} ${this.escapeHtml(tx.token)}
                    </div>
                    <div class="transaction-status ${tx.status}">${this.escapeHtml(tx.status)}</div>
                </div>
            </div>
        `).join('');
    }

    getTransactionIcon(type) {
        const icons = {
            'send': 'arrow-up',
            'receive': 'arrow-down',
            'swap': 'exchange-alt'
        };
        return icons[type] || 'circle';
    }

    getTransactionLabel(type) {
        const labels = {
            'send': 'Sent',
            'receive': 'Received',
            'swap': 'Swapped'
        };
        return labels[type] || 'Transaction';
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    shortenAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    async copyAddress() {
        if (!this.walletAddress) return;

        try {
            await navigator.clipboard.writeText(this.walletAddress);

            const copyBtn = document.getElementById('walletCopyBtn');
            if (copyBtn) {
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';

                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            }

        } catch (error) {
        }
    }

    toggleQR() {
        const qrSection = document.getElementById('walletQr');
        if (qrSection) {
            const isActive = qrSection.classList.toggle('active');

            if (isActive && this.walletAddress) {
                this.generateQR();
            }
        }
    }

    generateQR() {
        // QR generation would require QRCode.js library
        // For now, show placeholder
        const qrCode = document.getElementById('qrCode');
        if (qrCode) {
            qrCode.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #0f172a; font-size: 12px; text-align: center;">
                    QR Code<br/>${this.shortenAddress(this.walletAddress)}
                </div>
            `;
        }
    }

    openSendModal() {
        this.close(); // Cerrar dropdown primero
        if (typeof transactionModal !== 'undefined') {
            transactionModal.open('send'); // Abrir Transaction Modal en tab Send
        } else {
            // Fallback: redirigir si modal no está disponible
            window.location.href = 'my-wallet.html?action=send';
        }
    }

    openReceiveModal() {
        this.close(); // Cerrar dropdown primero
        if (typeof transactionModal !== 'undefined') {
            transactionModal.open('receive'); // Abrir Transaction Modal en tab Receive
        } else {
            // Fallback: toggle QR code interno
            this.toggleQR();
        }
    }

    openTransaction(hash) {
        // Open explorer or transaction details
        const explorerUrl = `https://amoy.polygonscan.com/tx/${hash}`;
        window.open(explorerUrl, '_blank');
    }

    async disconnect() {

        this.walletAddress = null;
        this.balance = { ltd: 0, usd: 0, staked: 0, available: 0 };
        this.transactions = [];

        this.stopAutoRefresh();
        this.close();

        // Reload page to reset connection
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    handleAccountChange(accounts) {
        if (accounts.length === 0) {
            this.disconnect();
        } else if (accounts[0] !== this.walletAddress) {
            this.walletAddress = accounts[0];
            this.loadWalletData();
        }
    }

    handleNetworkChange(chainId) {
        this.network.chainId = chainId;
        this.checkNetwork();
    }

    startAutoRefresh() {
        this.stopAutoRefresh();

        this.updateInterval = setInterval(() => {
            if (this.isOpen && !this.isLoading) {
                this.loadBalance();
                this.loadTransactions();
            }
        }, 30000); // 30 seconds
    }

    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    toggle() {
        // If not connected, trigger connect instead of toggle
        if (!this.walletAddress) {
            this.connectWallet();
            return;
        }

        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const dropdown = document.getElementById('walletDropdown');
        if (dropdown) {
            dropdown.classList.add('active');
            this.positionDropdown(); // Position dropdown below wallet button
            this.isOpen = true;

            // Refresh data when opening
            if (this.walletAddress && !this.isLoading) {
                this.loadBalance();
                this.loadTransactions();
            }
        }
    }

    close() {
        const dropdown = document.getElementById('walletDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
            this.isOpen = false;

            // Hide QR if open
            const qrSection = document.getElementById('walletQr');
            if (qrSection) {
                qrSection.classList.remove('active');
            }
        }
    }

    showNotConnected() {
        const addressText = document.getElementById('walletAddressText');
        const balanceAmount = document.getElementById('balanceAmount');
        const transactionsList = document.getElementById('transactionsList');

        if (addressText) addressText.textContent = 'Not Connected';
        if (balanceAmount) balanceAmount.textContent = '0.00';

        if (transactionsList) {
            transactionsList.innerHTML = `
                <div class="transactions-empty">
                    <i class="fas fa-wallet"></i>
                    <div>Connect wallet to view transactions</div>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text != null ? text : '');
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    showError(message) {
        const transactionsList = document.getElementById('transactionsList');
        if (transactionsList) {
            transactionsList.innerHTML = `
                <div class="wallet-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>${this.escapeHtml(message)}</div>
                    <button class="wallet-error-retry" onclick="walletDropdown.loadWalletData()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    positionDropdown() {
        const walletButton = document.querySelector('.wallet-connect');
        const dropdown = document.getElementById('walletDropdown');

        if (walletButton && dropdown) {
            const rect = walletButton.getBoundingClientRect();
            dropdown.style.position = 'fixed';
            dropdown.style.top = (rect.bottom + 2) + 'px'; // Reduced gap from 8px to 2px
            dropdown.style.right = (window.innerWidth - rect.right) + 'px';
            dropdown.style.left = 'auto';
        }
    }
}

// Initialize wallet dropdown when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.walletDropdown = new WalletDropdown();
    });
} else {
    window.walletDropdown = new WalletDropdown();
}
