/**
 * 🔗 LA TANDA UNIFIED SYSTEM
 * Integrates all La Tanda components including Web3 wallet, API connections, and system management
 */

class LaTandaUnifiedSystem {
    constructor() {
        this.web3Wallet = null;
        this.web3UI = null;
        this.apiConnector = null;
        this.bridge = null;
        this.isInitialized = false;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔗 Initializing La Tanda Unified System...');
        
        try {
            // Wait for all dependencies to load (non-blocking)
            const dependenciesLoaded = await this.waitForDependencies();
            
            // Initialize Web3 wallet integration
            await this.initializeWeb3();
            
            // Initialize API connections
            await this.initializeAPI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Connect wallet linking to backend
            this.setupWalletBackendIntegration();
            
            this.isInitialized = true;
            console.log('✅ La Tanda Unified System initialized successfully!');
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('latanda:unified:ready', {
                detail: { system: this }
            }));
            
        } catch (error) {
            console.error('❌ Failed to initialize La Tanda Unified System:', error);
        }
    }
    
    async waitForDependencies() {
        const dependencies = [
            () => typeof window.Web3WalletManager !== 'undefined',
            () => typeof window.Web3WalletUI !== 'undefined',
            () => typeof window.LaTandaAPI !== 'undefined',
            () => typeof window.bridge !== 'undefined'
        ];
        
        const timeout = 2000; // 2 seconds - reduced timeout
        const interval = 100; // Check every 100ms
        let elapsed = 0;
        
        while (elapsed < timeout) {
            const allLoaded = dependencies.every(check => check());
            if (allLoaded) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
            elapsed += interval;
        }
        
        console.warn('⚠️ Some dependencies not loaded within timeout - continuing with available features');
        return false; // Continue anyway
    }
    
    async initializeWeb3() {
        try {
            // Web3 wallet manager should already be initialized via web3-wallet-integration.js
            this.web3Wallet = window.web3Wallet;
            this.web3UI = window.web3UI;
            
            if (!this.web3Wallet || !this.web3UI) {
                console.warn('⚠️ Web3 wallet components not available');
                return;
            }
            
            console.log('✅ Web3 wallet integration connected');
            
        } catch (error) {
            console.error('❌ Failed to initialize Web3:', error);
        }
    }
    
    async initializeAPI() {
        try {
            this.apiConnector = window.LaTandaAPI;
            this.bridge = window.bridge;
            
            if (!this.apiConnector) {
                console.warn('⚠️ API connector not available');
                return;
            }
            
            // Test API connection
            const health = await this.apiConnector.getHealth();
            console.log('✅ API connection verified:', health);
            
        } catch (error) {
            console.error('❌ Failed to initialize API:', error);
        }
    }
    
    setupEventListeners() {
        // Listen for Web3 wallet events
        if (this.web3Wallet) {
            this.web3Wallet.addEventListener('wallet:connected', (data) => {
                console.log('🔗 Wallet connected:', data);
                this.onWalletConnected(data);
            });
            
            this.web3Wallet.addEventListener('wallet:disconnected', (data) => {
                console.log('🔗 Wallet disconnected:', data);
                this.onWalletDisconnected(data);
            });
            
            this.web3Wallet.addEventListener('wallet:linked', (data) => {
                console.log('🔗 Wallet linked to backend:', data);
                this.onWalletLinked(data);
            });
            
            this.web3Wallet.addEventListener('wallet:chainChanged', (data) => {
                console.log('🔗 Wallet chain changed:', data);
                this.onChainChanged(data);
            });
        }
        
        // Listen for API authentication events
        window.addEventListener('latanda:auth:success', (event) => {
            console.log('🔐 Authentication successful:', event.detail);
            this.onAuthSuccess(event.detail);
        });
        
        // Listen for system events
        window.addEventListener('latanda:system:ready', (event) => {
            console.log('🚀 System ready:', event.detail);
        });
    }
    
    setupWalletBackendIntegration() {
        if (!this.web3Wallet || !this.apiConnector) {
            console.warn('⚠️ Cannot setup wallet-backend integration: missing dependencies');
            return;
        }
        
        // Override the linkWalletToAccount method to use our API
        const originalLinkMethod = this.web3Wallet.linkWalletToAccount.bind(this.web3Wallet);
        
        this.web3Wallet.linkWalletToAccount = async () => {
            try {
                if (!this.web3Wallet.isConnected) {
                    throw new Error('Wallet not connected');
                }
                
                if (!this.apiConnector.isAuthenticated()) {
                    throw new Error('User not authenticated with La Tanda backend');
                }
                
                // Sign a message to prove wallet ownership
                const message = `Link wallet ${this.web3Wallet.currentAccount} to La Tanda account. Timestamp: ${Date.now()}`;
                const signature = await this.web3Wallet.signMessage(message);
                
                // Send to backend API using our connector
                const result = await this.apiConnector.apiCall('/api/users/link-wallet', {
                    wallet_address: this.web3Wallet.currentAccount,
                    message,
                    signature,
                    chain_id: this.web3Wallet.currentChainId,
                    wallet_type: this.web3Wallet.currentWallet
                }, { method: 'POST' });
                
                if (result.success) {
                    this.web3Wallet.dispatchEvent('wallet:linked', { 
                        address: this.web3Wallet.currentAccount,
                        user: result.data.user 
                    });
                    
                    // Update UI to show linked status
                    this.updateWalletLinkedStatus(true, result.data.user);
                    
                    return result;
                } else {
                    throw new Error(result.error?.message || 'Failed to link wallet');
                }
                
            } catch (error) {
                console.error('Wallet linking failed:', error);
                this.web3Wallet.dispatchEvent('wallet:linkError', { error: error.message });
                throw error;
            }
        };
    }
    
    // Event handlers
    onWalletConnected(data) {
        console.log('🔗 Processing wallet connection:', data);
        
        // Update connection status in UI
        this.updateConnectionStatus('wallet', 'connected');
        
        // Check if user is authenticated to enable linking
        if (this.apiConnector && this.apiConnector.isAuthenticated()) {
            // Show option to link wallet
            this.showWalletLinkingOption();
        }
        
        // Dispatch system event
        window.dispatchEvent(new CustomEvent('latanda:wallet:connected', {
            detail: data
        }));
    }
    
    onWalletDisconnected(data) {
        console.log('🔗 Processing wallet disconnection:', data);
        
        // Update connection status in UI
        this.updateConnectionStatus('wallet', 'disconnected');
        
        // Hide wallet linking options
        this.hideWalletLinkingOption();
        
        // Update linked status
        this.updateWalletLinkedStatus(false);
        
        // Dispatch system event
        window.dispatchEvent(new CustomEvent('latanda:wallet:disconnected', {
            detail: data
        }));
    }
    
    onWalletLinked(data) {
        console.log('🔗 Wallet successfully linked:', data);
        
        // Update UI to show successful linking
        this.updateWalletLinkedStatus(true, data.user);
        
        // Show success notification
        this.showNotification('Wallet linked successfully!', 'success');
        
        // Dispatch system event
        window.dispatchEvent(new CustomEvent('latanda:wallet:linked', {
            detail: data
        }));
    }
    
    onChainChanged(data) {
        console.log('🔗 Processing chain change:', data);
        
        // Update chain info in UI
        this.updateChainInfo(data.chainId);
        
        // Check if on supported chain
        const isSupported = this.web3Wallet.isOnSupportedChain();
        if (!isSupported) {
            this.showNotification('Please switch to a supported network', 'warning');
        }
        
        // Dispatch system event
        window.dispatchEvent(new CustomEvent('latanda:wallet:chainChanged', {
            detail: data
        }));
    }
    
    onAuthSuccess(data) {
        console.log('🔐 Processing authentication success:', data);
        
        // If wallet is connected, show linking option
        if (this.web3Wallet && this.web3Wallet.isConnected) {
            this.showWalletLinkingOption();
        }
    }
    
    // UI Update methods
    updateConnectionStatus(type, status) {
        const indicators = document.querySelectorAll(`[data-connection-type="${type}"]`);
        indicators.forEach(indicator => {
            indicator.className = `connection-status ${status}`;
            const statusText = {
                connected: '🟢 Connected',
                disconnected: '🟡 Disconnected',
                error: '🔴 Error'
            };
            indicator.textContent = statusText[status] || status;
        });
    }
    
    updateWalletLinkedStatus(isLinked, userData = null) {
        const linkStatus = document.querySelectorAll('[data-wallet-link-status]');
        linkStatus.forEach(element => {
            if (isLinked) {
                element.textContent = `🔗 Linked to ${userData?.name || 'account'}`;
                element.className = 'wallet-link-status linked';
            } else {
                element.textContent = '🔗 Not linked';
                element.className = 'wallet-link-status not-linked';
            }
        });
    }
    
    updateChainInfo(chainId) {
        const chainInfo = document.querySelectorAll('[data-chain-info]');
        const network = this.web3Wallet ? this.web3Wallet.getCurrentNetwork() : null;
        
        chainInfo.forEach(element => {
            element.textContent = network ? network.chainName : 'Unknown Network';
        });
    }
    
    showWalletLinkingOption() {
        const linkButtons = document.querySelectorAll('[data-wallet-link-button]');
        linkButtons.forEach(button => {
            button.style.display = 'block';
            button.onclick = () => this.linkWalletToAccount();
        });
    }
    
    hideWalletLinkingOption() {
        const linkButtons = document.querySelectorAll('[data-wallet-link-button]');
        linkButtons.forEach(button => {
            button.style.display = 'none';
        });
    }
    
    showNotification(message, type = 'info') {
        // Create or update notification element
        let notification = document.getElementById('laTandaNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'laTandaNotification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            `;
            document.body.appendChild(notification);
        }
        
        // Set message and style based on type
        notification.textContent = message;
        const styles = {
            success: 'background: #10B981; border: 1px solid #059669;',
            error: 'background: #EF4444; border: 1px solid #DC2626;',
            warning: 'background: #F59E0B; border: 1px solid #D97706;',
            info: 'background: #3B82F6; border: 1px solid #2563EB;'
        };
        notification.style.cssText += styles[type] || styles.info;
        
        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Hide after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    // Public methods
    async linkWalletToAccount() {
        try {
            if (!this.web3Wallet) {
                throw new Error('Web3 wallet not available');
            }
            
            const result = await this.web3Wallet.linkWalletToAccount();
            this.showNotification('Wallet linked successfully!', 'success');
            return result;
            
        } catch (error) {
            this.showNotification(`Failed to link wallet: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async connectWallet(type = 'metamask') {
        try {
            if (!this.web3Wallet) {
                throw new Error('Web3 wallet not available');
            }
            
            let result;
            if (type === 'metamask') {
                result = await this.web3Wallet.connectMetaMask();
            } else if (type === 'walletconnect') {
                result = await this.web3Wallet.connectWalletConnect();
            }
            
            this.showNotification(`${type} connected successfully!`, 'success');
            return result;
            
        } catch (error) {
            this.showNotification(`Failed to connect ${type}: ${error.message}`, 'error');
            throw error;
        }
    }
    
    disconnectWallet() {
        if (this.web3Wallet) {
            this.web3Wallet.disconnect();
            this.showNotification('Wallet disconnected', 'info');
        }
    }
    
    getWalletInfo() {
        if (!this.web3Wallet || !this.web3Wallet.isConnected) {
            return null;
        }
        
        return {
            wallet: this.web3Wallet.currentWallet,
            account: this.web3Wallet.currentAccount,
            chainId: this.web3Wallet.currentChainId,
            network: this.web3Wallet.getCurrentNetwork(),
            isConnected: this.web3Wallet.isConnected,
            isOnSupportedChain: this.web3Wallet.isOnSupportedChain()
        };
    }
    
    async getWalletBalance() {
        if (!this.web3Wallet || !this.web3Wallet.isConnected) {
            return null;
        }
        
        try {
            return await this.web3Wallet.getBalance();
        } catch (error) {
            console.error('Failed to get wallet balance:', error);
            return null;
        }
    }
    
    // System status
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            web3: {
                available: !!this.web3Wallet,
                connected: this.web3Wallet ? this.web3Wallet.isConnected : false,
                wallet: this.getWalletInfo()
            },
            api: {
                available: !!this.apiConnector,
                connected: this.apiConnector ? this.apiConnector.isAuthenticated() : false
            },
            bridge: {
                available: !!this.bridge,
                connected: this.bridge ? this.bridge.isConnected : false
            }
        };
    }
}

// Initialize the unified system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting La Tanda Unified System initialization...');
    window.laTandaUnified = new LaTandaUnifiedSystem();
});

// Export for global access
window.LaTandaUnifiedSystem = LaTandaUnifiedSystem;

console.log('🔗 La Tanda Unified System loaded!');