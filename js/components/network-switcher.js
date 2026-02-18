/**
 * Network Switcher Component - CLICK PROPAGATION FIX
 * Version: 1.0.4 - Fixed dropdown closing immediately after opening
 */

const networkSwitcher = {
    currentNetwork: 'ethereum',
    initialized: false,
    isTogglingNow: false,  // Prevent immediate close
    
    networks: {
        ethereum: {
            name: 'Ethereum',
            chain: 'ETH Mainnet',
            icon: '<i class="fab fa-ethereum" style="color: white;"></i>',
            color: 'linear-gradient(135deg, #627EEA, #4E5C9E)',
            latency: '12 ms',
            chainId: 1,
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://etherscan.io']
        },
        polygon: {
            name: 'Polygon',
            chain: 'MATIC Mainnet',
            icon: '<span style="color: white;">⬡</span>',
            color: 'linear-gradient(135deg, #8247E5, #5C2B99)',
            latency: '8 ms',
            chainId: 137,
            rpcUrls: ['https://polygon-rpc.com/'],
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            blockExplorerUrls: ['https://polygonscan.com']
        },
        bsc: {
            name: 'BSC',
            chain: 'BNB Smart Chain',
            icon: '<span style="color: black;">B</span>',
            color: 'linear-gradient(135deg, #F3BA2F, #E6A820)',
            latency: '15 ms',
            chainId: 56,
            rpcUrls: ['https://bsc-dataseed1.binance.org'],
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            blockExplorerUrls: ['https://bscscan.com']
        },
        arbitrum: {
            name: 'Arbitrum',
            chain: 'ARB One',
            icon: '<span style="color: white;">A</span>',
            color: 'linear-gradient(135deg, #28A0F0, #1E7DBF)',
            latency: '6 ms',
            chainId: 42161,
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://arbiscan.io']
        },
        optimism: {
            name: 'Optimism',
            chain: 'OP Mainnet',
            icon: '<span style="color: white;">O</span>',
            color: 'linear-gradient(135deg, #FF0420, #CC0319)',
            latency: '9 ms',
            chainId: 10,
            rpcUrls: ['https://mainnet.optimism.io'],
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://optimistic.etherscan.io']
        }
    },
    
    init() {
        if (this.initialized) {
            return;
        }
        
        const savedNetwork = localStorage.getItem('selectedNetwork');
        if (savedNetwork && this.networks[savedNetwork]) {
            this.currentNetwork = savedNetwork;
            this.updateDisplay(savedNetwork);
        }
        
        // Add click handler to network switcher (with mobile touch support)
        const switcher = document.querySelector('.network-switcher');
        if (switcher) {
            const handleToggle = (e) => {
                // Don't toggle if clicking inside dropdown menu
                if (e.target.closest('.network-dropdown')) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();
                this.isTogglingNow = true;
                this.toggle();

                // Reset flag after event loop completes
                setTimeout(() => {
                    this.isTogglingNow = false;
                }, 10);
            };

            // Add both click and touch handlers for mobile compatibility
            switcher.addEventListener('click', handleToggle);
            switcher.addEventListener('touchstart', (e) => {
                // Prevent ghost click on mobile
                e.preventDefault();
                handleToggle(e);
            }, { passive: false });

        }
        
        // Add click handlers to network options (with mobile touch support)
        document.querySelectorAll('.network-option').forEach(option => {
            const handleNetworkSwitch = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const networkKey = option.getAttribute('data-network');
                if (networkKey) {
                    this.switch(networkKey, e);
                }
            };

            // Add both click and touch handlers
            option.addEventListener('click', handleNetworkSwitch);
            option.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleNetworkSwitch(e);
            }, { passive: false });
        });
        
        // Close dropdown when clicking/touching outside (with delay check)
        const handleOutsideInteraction = (e) => {
            // Skip if we just toggled
            if (this.isTogglingNow) {
                return;
            }

            const switcher = document.querySelector('.network-switcher');
            const dropdown = document.getElementById('network-dropdown');

            if (dropdown && switcher && !switcher.contains(e.target)) {
                if (dropdown.classList.contains('active')) {
                    dropdown.classList.remove('active');
                    dropdown.style.display = "none";
                }
            }
        };

        document.addEventListener('click', handleOutsideInteraction);
        document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
        
        this.initialized = true;
    },
    
    toggle() {
        const dropdown = document.getElementById('network-dropdown');
        if (dropdown) {
            const isCurrentlyOpen = dropdown.classList.contains('active');
            
            if (isCurrentlyOpen) {
                // Close dropdown
                dropdown.classList.remove('active');
                dropdown.style.display = 'none';
            } else {
                // Open dropdown
                dropdown.classList.add('active');
                dropdown.style.display = 'block';
            }
        }
    },
    
    async switch(networkKey, event) {
        if (event) {
            event.stopPropagation();
        }
        
        if (networkKey === this.currentNetwork) {
            this.closeDropdown();
            return;
        }
        
        const network = this.networks[networkKey];
        if (!network) {
            return;
        }
        
        try {
            this.showLoading();
            await this.switchWeb3Network(network.chainId);
            
            this.currentNetwork = networkKey;
            localStorage.setItem('selectedNetwork', networkKey);
            
            this.updateDisplay(networkKey);
            this.closeDropdown();
            
            this.showNotification(`Switched to ${network.name}`, 'success');
            
            if (window.walletDropdown && typeof window.walletDropdown.refreshData === 'function') {
                window.walletDropdown.refreshData();
            }
            
            
        } catch (error) {
            this.showNotification('Failed to switch network', 'error');
        } finally {
            this.hideLoading();
        }
    },
    
    closeDropdown() {
        const dropdown = document.getElementById('network-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
            dropdown.style.display = "none";
        }
    },
    
    updateDisplay(networkKey) {
        const network = this.networks[networkKey];
        if (!network) return;
        
        const iconEl = document.querySelector('.network-switcher > .network-icon');
        if (iconEl) {
            iconEl.style.background = network.color;
            iconEl.innerHTML = network.icon;
        }
        
        const nameEl = document.getElementById('current-network-name');
        if (nameEl) {
            nameEl.textContent = network.name;
        }
        
        const latencyEl = document.getElementById('network-latency');
        if (latencyEl) {
            latencyEl.textContent = network.latency;
        }
        
        document.querySelectorAll('.network-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-network') === networkKey) {
                option.classList.add('active');
            }
        });
    },
    
    async switchWeb3Network(chainId) {
        if (typeof window.ethereum === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 300));
            return;
        }

        const hexChainId = `0x${chainId.toString(16)}`;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hexChainId }],
            });
        } catch (switchError) {
            // Error code 4902 means the network hasn't been added to MetaMask yet
            if (switchError.code === 4902) {

                // Find the network configuration
                const networkConfig = Object.values(this.networks).find(n => n.chainId === chainId);

                if (!networkConfig) {
                    throw new Error(`Network configuration not found for chainId: ${chainId}`);
                }

                try {
                    // Add the network to MetaMask
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: hexChainId,
                            chainName: networkConfig.chain,
                            nativeCurrency: networkConfig.nativeCurrency,
                            rpcUrls: networkConfig.rpcUrls,
                            blockExplorerUrls: networkConfig.blockExplorerUrls
                        }]
                    });


                    // After adding, MetaMask automatically switches to the network
                    // No need to call wallet_switchEthereumChain again

                } catch (addError) {
                    if (addError.code === 4001) {
                        // User rejected the request
                        throw new Error(`Network addition cancelled by user`);
                    } else {
                        throw new Error(`Failed to add ${networkConfig.name} network: ${addError.message}`);
                    }
                }
            } else if (switchError.code === 4001) {
                // User rejected the request
                throw new Error('Network switch cancelled by user');
            } else {
                throw switchError;
            }
        }
    },
    
    showLoading() {
        const switcher = document.querySelector('.network-switcher');
        if (switcher) {
            switcher.style.opacity = '0.6';
            switcher.style.pointerEvents = 'none';
        }
    },
    
    hideLoading() {
        const switcher = document.querySelector('.network-switcher');
        if (switcher) {
            switcher.style.opacity = '1';
            switcher.style.pointerEvents = 'auto';
        }
    },
    
    showNotification(message, type = 'info') {
        if (window.notificationCenter && typeof window.notificationCenter.addNotification === 'function') {
            window.notificationCenter.addNotification({
                title: 'Network',
                message: message,
                type: type,
                timestamp: new Date().toISOString()
            });
        } else {
        }
    }
};

// Legacy global functions
function toggleNetworkDropdown() {
    if (networkSwitcher.initialized) {
        networkSwitcher.isTogglingNow = true;
        networkSwitcher.toggle();
        setTimeout(() => {
            networkSwitcher.isTogglingNow = false;
        }, 10);
    }
}

function switchNetwork(networkKey, event) {
    if (networkSwitcher.initialized) {
        networkSwitcher.switch(networkKey, event);
    }
}

// Initialize only once
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        networkSwitcher.init();
        window.networkSwitcher = networkSwitcher;
    });
} else {
    networkSwitcher.init();
    window.networkSwitcher = networkSwitcher;
}
