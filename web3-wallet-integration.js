/**
 * 🔗 LA TANDA WEB3 WALLET INTEGRATION
 * Comprehensive Web3 wallet integration supporting MetaMask, WalletConnect, and more
 */

class Web3WalletManager {
    constructor() {
        this.isConnected = false;
        this.currentWallet = null;
        this.currentAccount = null;
        this.currentChainId = null;
        this.supportedChains = {
            // Honduras Chain (hypothetical)
            '0x1F6': { // 502 in hex
                chainId: '0x1F6',
                chainName: 'Honduras Chain',
                nativeCurrency: {
                    name: 'HNL',
                    symbol: 'HNL',
                    decimals: 18
                },
                rpcUrls: ['https://rpc.honduras-chain.org'],
                blockExplorerUrls: ['https://explorer.honduras-chain.org']
            },
            // Ethereum Mainnet
            '0x1': {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                blockExplorerUrls: ['https://etherscan.io']
            },
            // Polygon
            '0x89': {
                chainId: '0x89',
                chainName: 'Polygon',
                nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                },
                rpcUrls: ['https://polygon-rpc.com'],
                blockExplorerUrls: ['https://polygonscan.com']
            },
            // BSC
            '0x38': {
                chainId: '0x38',
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org'],
                blockExplorerUrls: ['https://bscscan.com']
            }
        };
        
        this.eventListeners = {};
        this.initialize();
    }
    
    async initialize() {
        console.log('🔗 Initializing Web3 Wallet Manager...');
        
        // Check for existing wallet connections
        await this.checkExistingConnection();
        
        // Setup wallet event listeners
        this.setupWalletEventListeners();
        
        console.log('✅ Web3 Wallet Manager ready!');
    }
    
    async checkExistingConnection() {
        try {
            // Check MetaMask
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.currentWallet = 'metamask';
                    this.currentAccount = accounts[0];
                    this.currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
                    this.isConnected = true;
                    
                    this.dispatchEvent('wallet:connected', {
                        wallet: this.currentWallet,
                        account: this.currentAccount,
                        chainId: this.currentChainId
                    });
                }
            }
        } catch (error) {
            console.warn('Error checking existing wallet connection:', error);
        }
    }
    
    setupWalletEventListeners() {
        if (typeof window.ethereum !== 'undefined') {
            // Account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.currentAccount = accounts[0];
                    this.dispatchEvent('wallet:accountChanged', { account: this.currentAccount });
                }
            });
            
            // Chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                this.currentChainId = chainId;
                this.dispatchEvent('wallet:chainChanged', { chainId });
            });
            
            // Connection/disconnection
            window.ethereum.on('connect', (connectInfo) => {
                this.currentChainId = connectInfo.chainId;
                this.dispatchEvent('wallet:connected', { chainId: connectInfo.chainId });
            });
            
            window.ethereum.on('disconnect', (error) => {
                this.disconnect();
                this.dispatchEvent('wallet:disconnected', { error });
            });
        }
    }
    
    // Wallet connection methods
    async connectMetaMask() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
            }
            
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (accounts.length === 0) {
                throw new Error('No accounts found. Please unlock MetaMask.');
            }
            
            this.currentWallet = 'metamask';
            this.currentAccount = accounts[0];
            this.currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            this.isConnected = true;
            
            // Try to switch to Honduras Chain if not already
            await this.switchToHondurasChain();
            
            this.dispatchEvent('wallet:connected', {
                wallet: this.currentWallet,
                account: this.currentAccount,
                chainId: this.currentChainId
            });
            
            return {
                success: true,
                wallet: this.currentWallet,
                account: this.currentAccount,
                chainId: this.currentChainId
            };
            
        } catch (error) {
            console.error('MetaMask connection failed:', error);
            this.dispatchEvent('wallet:error', { error: error.message });
            throw error;
        }
    }
    
    async connectWalletConnect() {
        try {
            // WalletConnect v2 implementation
            // Note: This requires @walletconnect/web3-provider to be loaded
            if (typeof window.WalletConnectProvider === 'undefined') {
                throw new Error('WalletConnect not loaded. Please include WalletConnect library.');
            }
            
            const provider = new window.WalletConnectProvider({
                infuraId: "YOUR_INFURA_PROJECT_ID", // Replace with actual Infura ID
                rpc: {
                    502: "https://rpc.honduras-chain.org", // Honduras Chain
                    1: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
                    137: "https://polygon-rpc.com"
                }
            });
            
            // Enable session (triggers QR Code modal)
            await provider.enable();
            
            this.currentWallet = 'walletconnect';
            this.currentAccount = provider.accounts[0];
            this.currentChainId = `0x${provider.chainId.toString(16)}`;
            this.isConnected = true;
            
            this.dispatchEvent('wallet:connected', {
                wallet: this.currentWallet,
                account: this.currentAccount,
                chainId: this.currentChainId
            });
            
            return {
                success: true,
                wallet: this.currentWallet,
                account: this.currentAccount,
                chainId: this.currentChainId
            };
            
        } catch (error) {
            console.error('WalletConnect connection failed:', error);
            this.dispatchEvent('wallet:error', { error: error.message });
            throw error;
        }
    }
    
    async disconnect() {
        try {
            if (this.currentWallet === 'walletconnect' && window.walletConnectProvider) {
                await window.walletConnectProvider.disconnect();
            }
            
            this.isConnected = false;
            this.currentWallet = null;
            this.currentAccount = null;
            this.currentChainId = null;
            
            this.dispatchEvent('wallet:disconnected', {});
            
        } catch (error) {
            console.error('Wallet disconnect failed:', error);
        }
    }
    
    // Chain management
    async switchToHondurasChain() {
        try {
            const hondurasChain = this.supportedChains['0x1F6'];
            
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hondurasChain.chainId }],
            });
            
            this.currentChainId = hondurasChain.chainId;
            
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await this.addHondurasChain();
                } catch (addError) {
                    console.error('Failed to add Honduras Chain:', addError);
                    throw addError;
                }
            } else {
                console.error('Failed to switch to Honduras Chain:', switchError);
                throw switchError;
            }
        }
    }
    
    async addHondurasChain() {
        const hondurasChain = this.supportedChains['0x1F6'];
        
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [hondurasChain],
        });
    }
    
    async switchChain(chainId) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId }],
            });
            
            this.currentChainId = chainId;
            this.dispatchEvent('wallet:chainChanged', { chainId });
            
        } catch (error) {
            console.error('Failed to switch chain:', error);
            throw error;
        }
    }
    
    // Token operations
    async addLTDToken() {
        try {
            const ltdTokenAddress = '0x...'; // Replace with actual LTD token address
            
            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: ltdTokenAddress,
                        symbol: 'LTD',
                        decimals: 18,
                        image: 'https://latanda.online/logo-ltd.png',
                    },
                },
            });
            
            this.dispatchEvent('token:added', { symbol: 'LTD' });
            
        } catch (error) {
            console.error('Failed to add LTD token:', error);
            throw error;
        }
    }
    
    // Transaction methods
    async sendTransaction(to, value, data = '0x') {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }
            
            const transactionParameters = {
                to,
                from: this.currentAccount,
                value: `0x${parseInt(value).toString(16)}`,
                data,
            };
            
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });
            
            this.dispatchEvent('transaction:sent', { txHash, to, value });
            
            return txHash;
            
        } catch (error) {
            console.error('Transaction failed:', error);
            this.dispatchEvent('transaction:error', { error: error.message });
            throw error;
        }
    }
    
    async signMessage(message) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }
            
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, this.currentAccount],
            });
            
            this.dispatchEvent('message:signed', { message, signature });
            
            return signature;
            
        } catch (error) {
            console.error('Message signing failed:', error);
            this.dispatchEvent('signing:error', { error: error.message });
            throw error;
        }
    }
    
    // Utility methods
    getBalance() {
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.isConnected) {
                    throw new Error('Wallet not connected');
                }
                
                const balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [this.currentAccount, 'latest']
                });
                
                // Convert from Wei to Ether
                const balanceInEther = parseInt(balance, 16) / Math.pow(10, 18);
                resolve(balanceInEther);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    getCurrentNetwork() {
        if (!this.currentChainId) return null;
        
        return this.supportedChains[this.currentChainId] || {
            chainId: this.currentChainId,
            chainName: 'Unknown Network'
        };
    }
    
    isOnSupportedChain() {
        return this.currentChainId && this.supportedChains[this.currentChainId];
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.substr(0, 6)}...${address.substr(-4)}`;
    }
    
    // Event system
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }
    
    dispatchEvent(event, data = {}) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error for ${event}:`, error);
                }
            });
        }
        
        // Also dispatch as DOM event
        window.dispatchEvent(new CustomEvent(`web3:${event}`, { detail: data }));
    }
    
    // Integration with La Tanda backend
    async linkWalletToAccount() {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }
            
            // Sign a message to prove wallet ownership
            const message = `Link wallet ${this.currentAccount} to La Tanda account. Timestamp: ${Date.now()}`;
            const signature = await this.signMessage(message);
            
            // Send to backend API
            if (window.LaTandaAPI) {
                const result = await window.LaTandaAPI.apiCall('/api/users/link-wallet', {
                    wallet_address: this.currentAccount,
                    message,
                    signature,
                    chain_id: this.currentChainId
                }, { method: 'POST' });
                
                if (result.success) {
                    this.dispatchEvent('wallet:linked', { 
                        address: this.currentAccount,
                        user: result.data.user 
                    });
                    return result;
                } else {
                    throw new Error(result.error?.message || 'Failed to link wallet');
                }
            }
            
        } catch (error) {
            console.error('Wallet linking failed:', error);
            this.dispatchEvent('wallet:linkError', { error: error.message });
            throw error;
        }
    }
}

// Web3 UI Components
class Web3WalletUI {
    constructor(walletManager) {
        this.walletManager = walletManager;
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // Create wallet connection modal
        this.modalHTML = `
            <div id="web3WalletModal" class="wallet-modal" style="display: none;">
                <div class="wallet-modal-overlay" onclick="web3UI.closeModal()"></div>
                <div class="wallet-modal-content">
                    <div class="wallet-modal-header">
                        <h3>Connect Wallet</h3>
                        <button onclick="web3UI.closeModal()" class="close-btn">×</button>
                    </div>
                    <div class="wallet-modal-body">
                        <div class="wallet-options">
                            <button onclick="web3UI.connectWallet('metamask')" class="wallet-option">
                                <img src="https://docs.metamask.io/metamask-fox.svg" alt="MetaMask" width="32" height="32">
                                <span>MetaMask</span>
                            </button>
                            <button onclick="web3UI.connectWallet('walletconnect')" class="wallet-option">
                                <img src="https://walletconnect.org/walletconnect-logo.svg" alt="WalletConnect" width="32" height="32">
                                <span>WalletConnect</span>
                            </button>
                        </div>
                        <div id="walletStatus" class="wallet-status"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Inject modal into page
        document.body.insertAdjacentHTML('beforeend', this.modalHTML);
        
        // Create wallet button in header
        this.createWalletButton();
        
        // Add CSS styles
        this.injectStyles();
    }
    
    createWalletButton() {
        const walletButton = document.createElement('button');
        walletButton.id = 'web3WalletButton';
        walletButton.className = 'wallet-connect-btn';
        walletButton.innerHTML = '🔗 Connect Wallet';
        walletButton.onclick = () => this.openModal();
        
        // Add to header or sidebar
        const header = document.querySelector('.logo-section') || document.querySelector('header') || document.body;
        header.appendChild(walletButton);
    }
    
    injectStyles() {
        const styles = `
            <style>
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
                }
                
                .wallet-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                }
                
                .wallet-modal-content {
                    position: relative;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border: 1px solid rgba(0, 255, 255, 0.2);
                    border-radius: 16px;
                    padding: 24px;
                    max-width: 400px;
                    width: 90%;
                }
                
                .wallet-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    color: #f8fafc;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .wallet-options {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .wallet-option {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    border-radius: 8px;
                    color: #f8fafc;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 100%;
                    text-align: left;
                }
                
                .wallet-option:hover {
                    border-color: #00FFFF;
                    background: rgba(0, 255, 255, 0.1);
                }
                
                .wallet-connect-btn {
                    background: linear-gradient(135deg, #00FFFF, #00D4AA);
                    color: #000;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    margin-top: 16px;
                    transition: all 0.3s ease;
                }
                
                .wallet-connect-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 255, 255, 0.3);
                }
                
                .wallet-connect-btn.connected {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: white;
                }
                
                .wallet-status {
                    margin-top: 16px;
                    padding: 12px;
                    border-radius: 8px;
                    text-align: center;
                    color: #f8fafc;
                }
                
                .wallet-status.success {
                    background: rgba(34, 197, 94, 0.2);
                    border: 1px solid #22c55e;
                }
                
                .wallet-status.error {
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid #ef4444;
                }
                
                .wallet-info {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-top: 16px;
                    padding: 16px;
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 8px;
                    color: #cbd5e1;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    setupEventListeners() {
        // Listen for wallet events
        this.walletManager.addEventListener('wallet:connected', (data) => {
            this.updateWalletButton(true, data);
            this.showStatus(`Connected to ${data.wallet}`, 'success');
            setTimeout(() => this.closeModal(), 2000);
        });
        
        this.walletManager.addEventListener('wallet:disconnected', () => {
            this.updateWalletButton(false);
            this.showStatus('Wallet disconnected', 'error');
        });
        
        this.walletManager.addEventListener('wallet:error', (data) => {
            this.showStatus(data.error, 'error');
        });
        
        this.walletManager.addEventListener('wallet:chainChanged', (data) => {
            this.updateNetworkInfo(data.chainId);
        });
    }
    
    openModal() {
        document.getElementById('web3WalletModal').style.display = 'flex';
    }
    
    closeModal() {
        document.getElementById('web3WalletModal').style.display = 'none';
        this.clearStatus();
    }
    
    async connectWallet(type) {
        try {
            this.showStatus('Connecting...', 'info');
            
            if (type === 'metamask') {
                await this.walletManager.connectMetaMask();
            } else if (type === 'walletconnect') {
                await this.walletManager.connectWalletConnect();
            }
            
        } catch (error) {
            this.showStatus(error.message, 'error');
        }
    }
    
    updateWalletButton(connected, data = null) {
        const button = document.getElementById('web3WalletButton');
        if (button) {
            if (connected && data) {
                button.innerHTML = `✅ ${this.walletManager.formatAddress(data.account)}`;
                button.className = 'wallet-connect-btn connected';
                button.onclick = () => this.showWalletInfo();
            } else {
                button.innerHTML = '🔗 Connect Wallet';
                button.className = 'wallet-connect-btn';
                button.onclick = () => this.openModal();
            }
        }
    }
    
    showWalletInfo() {
        if (this.walletManager.isConnected) {
            const network = this.walletManager.getCurrentNetwork();
            this.showStatus(`
                <div class="wallet-info">
                    <div><strong>Account:</strong> ${this.walletManager.formatAddress(this.walletManager.currentAccount)}</div>
                    <div><strong>Network:</strong> ${network?.chainName || 'Unknown'}</div>
                    <div><strong>Wallet:</strong> ${this.walletManager.currentWallet}</div>
                    <button onclick="web3UI.walletManager.disconnect()" style="margin-top: 12px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Disconnect
                    </button>
                </div>
            `, 'success');
            this.openModal();
        }
    }
    
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('walletStatus');
        if (statusEl) {
            statusEl.innerHTML = message;
            statusEl.className = `wallet-status ${type}`;
        }
    }
    
    clearStatus() {
        const statusEl = document.getElementById('walletStatus');
        if (statusEl) {
            statusEl.innerHTML = '';
            statusEl.className = 'wallet-status';
        }
    }
    
    updateNetworkInfo(chainId) {
        const network = this.walletManager.supportedChains[chainId];
        if (network) {
            this.showStatus(`Switched to ${network.chainName}`, 'success');
        }
    }
}

// Initialize Web3 integration
window.addEventListener('DOMContentLoaded', () => {
    window.web3Wallet = new Web3WalletManager();
    window.web3UI = new Web3WalletUI(window.web3Wallet);
    
    console.log('🔗 Web3 Wallet Integration loaded!');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Web3WalletManager, Web3WalletUI };
}

console.log('🔗 Web3 Wallet Integration ready!');