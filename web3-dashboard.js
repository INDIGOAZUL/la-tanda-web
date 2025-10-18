/**
 * La Tanda Web3 Dashboard - Professional DeFi Interface
 * Modern JavaScript implementation with Web3 integration
 */

class LaTandaWeb3Dashboard {
    constructor() {
        this.isInitialized = false;
        this.web3 = null;
        this.currentAccount = null;
        this.ltdContract = null;
        this.stakingContract = null;
        this.daoContract = null;
        this.nftContract = null;
        
        // API Integration Manager reference
        this.apiManager = null;
        this.paymentManager = null;
        
        // Demo data for development
        this.demoData = {
            portfolio: {
                totalValue: 3247.89,
                change: 12.5,
                ltdBalance: 2500,
                ltdValue: 1875.00,
                stakingRewards: 127.3,
                apy: 24.5,
                nftCount: 3
            },
            trading: {
                currentPrice: 0.75,
                priceChange: 0.04,
                percentChange: 5.2,
                volume24h: 125000
            },
            pools: [
                {
                    id: 1,
                    name: 'LTD/USDC',
                    apy: 45.2,
                    tvl: 127000,
                    tokens: ['LTD', 'USDC'],
                    userStaked: 1200
                },
                {
                    id: 2,
                    name: 'LTD/ETH',
                    apy: 38.7,
                    tvl: 89000,
                    tokens: ['LTD', 'ETH'],
                    userStaked: 800
                },
                {
                    id: 3,
                    name: 'LTD Single Stake',
                    apy: 24.5,
                    tvl: 234000,
                    tokens: ['LTD'],
                    userStaked: 2500
                }
            ],
            proposals: [
                {
                    id: 15,
                    title: 'Increase Staking Rewards to 30% APY',
                    status: 'active',
                    yesVotes: 156000,
                    noVotes: 60000,
                    totalVotes: 216000,
                    endTime: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
                    description: 'Proposal to increase staking rewards from current 24.5% to 30% APY to incentivize more participation.'
                }
            ],
            nfts: [
                {
                    id: 1,
                    name: 'Golden Coordinator',
                    rarity: 'legendary',
                    level: 5,
                    value: 500,
                    description: 'Highest level coordinator achievement'
                },
                {
                    id: 2,
                    name: 'Top Performer',
                    rarity: 'epic',
                    level: 3,
                    value: 200,
                    description: 'Monthly performance leader'
                },
                {
                    id: 3,
                    name: 'Group Founder',
                    rarity: 'rare',
                    level: 1,
                    value: 50,
                    description: 'Early adopter recognition'
                }
            ],
            activities: [
                {
                    id: 1,
                    type: 'staking_reward',
                    title: 'Staking Reward Claimed',
                    subtitle: '+12.5 LTD earned',
                    time: new Date(Date.now() - 2 * 60 * 1000),
                    icon: 'success'
                },
                {
                    id: 2,
                    type: 'trade',
                    title: 'LTD Purchase',
                    subtitle: 'Bought 100 LTD at $0.73',
                    time: new Date(Date.now() - 60 * 60 * 1000),
                    icon: 'buy'
                },
                {
                    id: 3,
                    type: 'nft_earned',
                    title: 'NFT Badge Earned',
                    subtitle: 'Coordinator Level 2 achieved',
                    time: new Date(Date.now() - 3 * 60 * 60 * 1000),
                    icon: 'nft'
                },
                {
                    id: 4,
                    type: 'governance',
                    title: 'DAO Vote Cast',
                    subtitle: 'Voted on Proposal #15',
                    time: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    icon: 'governance'
                }
            ]
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize API Integration first
            await this.initializeAPIIntegration();
            
            // Then initialize Web3 and other components
            await this.initializeWeb3();
            this.initializeEventListeners();
            this.initializeChart();
            this.initializeParticles();
            this.startDataRefresh();
            this.isInitialized = true;
            console.log('🚀 La Tanda Web3 Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing dashboard:', error);
            this.showNotification('Error initializing dashboard', 'error');
        }
    }

    /**
     * Initialize API Integration System - Fase 2: Backend Integration
     */
    async initializeAPIIntegration() {
        try {
            console.log('🔗 Initializing API Integration...');
            
            // Wait for API Integration Manager to be available
            if (window.apiIntegrationManager) {
                await window.apiIntegrationManager.initialize();
                this.apiManager = window.apiIntegrationManager;
                
                // Setup API event listeners
                this.setupAPIEventListeners();
                
                // Initialize Payment Manager if available
                if (window.paymentIntegrationManager) {
                    this.paymentManager = window.paymentIntegrationManager;
                    await this.paymentManager.initialize();
                }
                
                console.log('✅ API Integration initialized successfully');
            } else {
                console.warn('⚠️ API Integration Manager not available, using demo mode');
            }
        } catch (error) {
            console.error('❌ Error initializing API integration:', error);
            // Continue with demo mode if API integration fails
        }
    }

    /**
     * Setup event listeners for API integration
     */
    setupAPIEventListeners() {
        // Listen for authentication events
        document.addEventListener('latanda:auth:login', (event) => {
            const userData = event.detail.user;
            this.handleUserLogin(userData);
        });

        document.addEventListener('latanda:auth:logout', () => {
            this.handleUserLogout();
        });

        // Listen for connection status changes
        document.addEventListener('latanda:connection:status', (event) => {
            this.updateConnectionStatus(event.detail.status);
        });

        // Listen for payment events
        document.addEventListener('latanda:payment:success', (event) => {
            this.handlePaymentSuccess(event.detail);
        });

        document.addEventListener('latanda:payment:error', (event) => {
            this.handlePaymentError(event.detail);
        });
    }
    
    async initializeWeb3() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                this.web3 = new Web3(window.ethereum);
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });
                
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.updateWalletInfo();
                }
                
                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length > 0) {
                        this.currentAccount = accounts[0];
                        this.updateWalletInfo();
                        this.refreshData();
                    }
                });
                
                // Listen for network changes
                window.ethereum.on('chainChanged', () => {
                    window.location.reload();
                });
                
            } catch (error) {
                console.warn('Web3 not available, using demo mode');
                this.initializeDemoMode();
            }
        } else {
            console.warn('MetaMask not detected, using demo mode');
            this.initializeDemoMode();
        }
    }
    
    initializeDemoMode() {
        // Simulate wallet connection with demo data
        this.currentAccount = '0x742d35...8b2f';
        this.updateWalletInfo();
        console.log('Demo mode activated');
    }
    
    updateWalletInfo() {
        const addressElement = document.querySelector('.wallet-address');
        const balanceElement = document.querySelector('.wallet-balance');
        
        if (addressElement && this.currentAccount) {
            const shortAddress = this.currentAccount.length > 10 
                ? `${this.currentAccount.slice(0, 6)}...${this.currentAccount.slice(-4)}`
                : this.currentAccount;
            addressElement.textContent = shortAddress;
        }
        
        if (balanceElement) {
            balanceElement.textContent = `${this.demoData.portfolio.ltdBalance.toLocaleString()} LTD`;
        }
    }
    
    initializeEventListeners() {
        // Navigation events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                this.handleNavigation(e.target);
            }
        });
        
        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal')) {
                this.closeModal();
            }
        });
        
        // Form events
        const tradeForm = document.getElementById('tradingModal');
        if (tradeForm) {
            const amountInput = document.getElementById('tradeAmount');
            const priceInput = document.getElementById('tradePrice');
            
            if (amountInput && priceInput) {
                [amountInput, priceInput].forEach(input => {
                    input.addEventListener('input', () => this.calculateTradeTotal());
                });
            }
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    initializeChart() {
        const canvas = document.getElementById('tradingChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Generate sample price data
        const priceData = this.generatePriceData();
        this.drawChart(ctx, priceData);
        
        // Animate chart
        this.animateChart(ctx, priceData);
    }
    
    generatePriceData() {
        const data = [];
        const basePrice = 0.75;
        const points = 50;
        
        for (let i = 0; i < points; i++) {
            const variation = (Math.random() - 0.5) * 0.1;
            const trend = Math.sin(i / 10) * 0.05;
            const price = basePrice + variation + trend;
            data.push({
                time: new Date(Date.now() - (points - i) * 30 * 60 * 1000),
                price: Math.max(0.1, price)
            });
        }
        
        return data;
    }
    
    drawChart(ctx, data) {
        const canvas = ctx.canvas;
        const padding = 40;
        const width = canvas.width - 2 * padding;
        const height = canvas.height - 2 * padding;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up drawing context
        ctx.strokeStyle = '#F0B90B';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Calculate bounds
        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        
        // Draw price line
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * width;
            const y = padding + height - ((point.price - minPrice) / priceRange) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
        gradient.addColorStop(0, 'rgba(240, 185, 11, 0.3)');
        gradient.addColorStop(1, 'rgba(240, 185, 11, 0.01)');
        
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * width;
            const y = padding + height - ((point.price - minPrice) / priceRange) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw grid lines
        this.drawGrid(ctx, padding, width, height, minPrice, maxPrice, priceRange);
    }
    
    drawGrid(ctx, padding, width, height, minPrice, maxPrice, priceRange) {
        ctx.strokeStyle = 'rgba(234, 236, 239, 0.1)';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i / 5) * height;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + width, y);
            ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = padding + (i / 10) * width;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, padding + height);
            ctx.stroke();
        }
    }
    
    animateChart(ctx, data) {
        let animationProgress = 0;
        const animationDuration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            animationProgress = Math.min(elapsed / animationDuration, 1);
            
            // Ease out animation
            const easeProgress = 1 - Math.pow(1 - animationProgress, 3);
            
            // Draw partial data based on progress
            const visibleDataPoints = Math.floor(data.length * easeProgress);
            const visibleData = data.slice(0, visibleDataPoints);
            
            if (visibleData.length > 1) {
                this.drawChart(ctx, visibleData);
            }
            
            if (animationProgress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    initializeParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Random animation delay
            particle.style.animationDelay = `${Math.random() * 6}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    startDataRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.refreshData();
        }, 30000);
        
        // Update time-based elements every second
        setInterval(() => {
            this.updateTimeElements();
        }, 1000);
    }
    
    refreshData() {
        // Simulate data updates
        this.demoData.trading.currentPrice += (Math.random() - 0.5) * 0.02;
        this.demoData.trading.priceChange = this.demoData.trading.currentPrice - 0.75;
        this.demoData.trading.percentChange = (this.demoData.trading.priceChange / 0.75) * 100;
        
        this.updatePriceDisplay();
        this.updatePortfolioStats();
    }
    
    updatePriceDisplay() {
        const priceElement = document.querySelector('.current-price');
        const changeElement = document.querySelector('.price-change');
        
        if (priceElement) {
            priceElement.textContent = `$${this.demoData.trading.currentPrice.toFixed(2)}`;
        }
        
        if (changeElement) {
            const change = this.demoData.trading.priceChange;
            const percent = this.demoData.trading.percentChange;
            const sign = change >= 0 ? '+' : '';
            
            changeElement.textContent = `${sign}$${change.toFixed(2)} (${percent.toFixed(1)}%)`;
            changeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
    }
    
    updatePortfolioStats() {
        // Update portfolio value
        const portfolioElement = document.querySelector('.stat-card.primary .stat-value');
        if (portfolioElement) {
            const newValue = this.demoData.portfolio.totalValue * (1 + Math.random() * 0.02 - 0.01);
            portfolioElement.textContent = `$${newValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
    }
    
    updateTimeElements() {
        // Update activity timestamps
        document.querySelectorAll('.activity-time').forEach((element, index) => {
            if (this.demoData.activities[index]) {
                const time = this.demoData.activities[index].time;
                element.textContent = this.formatTimeAgo(time);
            }
        });
        
        // Update proposal countdown
        const proposalTime = document.querySelector('.proposal-time span');
        if (proposalTime && this.demoData.proposals[0]) {
            const endTime = this.demoData.proposals[0].endTime;
            const remaining = endTime - Date.now();
            proposalTime.textContent = this.formatTimeRemaining(remaining);
        }
    }
    
    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    formatTimeRemaining(milliseconds) {
        const days = Math.floor(milliseconds / 86400000);
        const hours = Math.floor((milliseconds % 86400000) / 3600000);
        
        if (days > 0) return `Ends in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Ends in ${hours} hour${hours > 1 ? 's' : ''}`;
        return 'Ending soon';
    }
    
    handleNavigation(element) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked element
        element.classList.add('active');
        
        // Handle navigation logic based on the link
        const section = element.textContent.toLowerCase();
        console.log(`Navigating to: ${section}`);
        
        // You can implement actual navigation here
        this.showNotification(`Navigating to ${section}`, 'info');
    }
    
    handleKeyboardShortcuts(event) {
        // Handle keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 't':
                    event.preventDefault();
                    this.showTrading('buy');
                    break;
                case 's':
                    event.preventDefault();
                    this.showStaking();
                    break;
                case 'Escape':
                    this.closeModal();
                    break;
            }
        }
    }
    
    // Trading Functions
    showTrading(type = 'buy', buttonElement = null) {
        if (buttonElement) this.setButtonLoading(buttonElement, true);
        
        const currentPrice = this.demoData.trading.currentPrice;
        const balance = this.demoData.portfolio.ltdBalance;
        
        const modalContent = `
            <div class="modal-header">
                <h2>${type === 'buy' ? 'Buy' : 'Sell'} LTD Tokens</h2>
                <button class="close-btn" onclick="dashboard.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="trading-info">
                    <div class="info-item">
                        <span>Current Price:</span>
                        <span class="highlight">$${currentPrice}</span>
                    </div>
                    <div class="info-item">
                        <span>Your Balance:</span>
                        <span>${balance.toFixed(0)} LTD</span>
                    </div>
                    <div class="info-item">
                        <span>24h Change:</span>
                        <span class="success">+${this.demoData.trading.percentChange}%</span>
                    </div>
                </div>
                <div class="trading-form">
                    <label>Amount:</label>
                    <input type="number" id="trade-amount" placeholder="Enter amount" min="1" ${type === 'sell' ? `max="${balance}"` : ''}>
                    <div class="trading-buttons">
                        <button class="trade-btn ${type} btn-with-ripple" onclick="dashboard.executeTrade('${type}')">
                            ${type === 'buy' ? 'Buy' : 'Sell'} LTD
                        </button>
                        <button class="trade-btn cancel" onclick="dashboard.closeModal()">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalContent);
        
        if (buttonElement) {
            setTimeout(() => {
                this.setButtonLoading(buttonElement, false);
            }, 300);
        }
    }
    
    calculateTradeTotal() {
        const amountInput = document.getElementById('tradeAmount');
        const priceInput = document.getElementById('tradePrice');
        const totalElement = document.getElementById('tradeTotal');
        const feeElement = document.getElementById('tradeFee');
        
        if (amountInput && priceInput && totalElement && feeElement) {
            const amount = parseFloat(amountInput.value) || 0;
            const price = parseFloat(priceInput.value) || this.demoData.trading.currentPrice;
            
            const subtotal = amount * price;
            const fee = subtotal * 0.001; // 0.1% fee
            const total = subtotal + fee;
            
            totalElement.textContent = `$${total.toFixed(2)}`;
            feeElement.textContent = `$${fee.toFixed(4)}`;
            
            // Update price input if empty
            if (!priceInput.value) {
                priceInput.value = this.demoData.trading.currentPrice.toFixed(2);
            }
        }
    }
    
    // Enhanced Button Functionality with Loading States
    async showStaking(buttonElement = null) {
        if (buttonElement) this.setButtonLoading(buttonElement, true);
        
        try {
            this.showNotification('Loading staking interface...', 'info');
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Create and show staking modal
            this.createStakingModal();
            this.showNotification('Staking interface ready!', 'success');
        } catch (error) {
            this.showNotification('Failed to load staking interface', 'error');
        } finally {
            if (buttonElement) this.setButtonLoading(buttonElement, false);
        }
    }
    
    async showYieldFarming(buttonElement = null) {
        if (buttonElement) this.setButtonLoading(buttonElement, true);
        
        try {
            this.showNotification('Loading yield farming...', 'info');
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.createYieldFarmingModal();
            this.showNotification('Yield farming interface ready!', 'success');
        } catch (error) {
            this.showNotification('Failed to load yield farming', 'error');
        } finally {
            if (buttonElement) this.setButtonLoading(buttonElement, false);
        }
    }
    
    async showLending(buttonElement = null) {
        if (buttonElement) this.setButtonLoading(buttonElement, true);
        
        try {
            this.showNotification('Loading lending interface...', 'info');
            await new Promise(resolve => setTimeout(resolve, 600));
            
            this.createLendingModal();
            this.showNotification('Lending interface ready!', 'success');
        } catch (error) {
            this.showNotification('Failed to load lending interface', 'error');
        } finally {
            if (buttonElement) this.setButtonLoading(buttonElement, false);
        }
    }
    
    // NFT Functions
    async showNFTs(buttonElement = null) {
        if (buttonElement) this.setButtonLoading(buttonElement, true);
        
        try {
            this.showNotification('Loading NFT collection...', 'info');
            await new Promise(resolve => setTimeout(resolve, 700));
            
            this.createNFTModal();
            this.showNotification('NFT collection ready!', 'success');
        } catch (error) {
            this.showNotification('Failed to load NFT collection', 'error');
        } finally {
            if (buttonElement) this.setButtonLoading(buttonElement, false);
        }
    }
    
    async showMarketplace(buttonElement = null) {
        if (buttonElement) this.setButtonLoading(buttonElement, true);
        
        try {
            this.showNotification('Loading NFT marketplace...', 'info');
            await new Promise(resolve => setTimeout(resolve, 900));
            
            this.createMarketplaceModal();
            this.showNotification('NFT marketplace ready!', 'success');
        } catch (error) {
            this.showNotification('Failed to load marketplace', 'error');
        } finally {
            if (buttonElement) this.setButtonLoading(buttonElement, false);
        }
    }

    // Button State Management
    setButtonLoading(buttonElement, isLoading) {
        if (!buttonElement) return;
        
        if (isLoading) {
            buttonElement.setAttribute('data-loading', 'true');
            buttonElement.disabled = true;
            buttonElement.classList.add('btn-with-ripple');
        } else {
            buttonElement.removeAttribute('data-loading');
            buttonElement.disabled = false;
            // Keep ripple class for better UX
        }
    }

    // Modal Creation Functions
    createStakingModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>Stake LTD Tokens</h2>
                <button class="close-btn" onclick="dashboard.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="staking-info">
                    <div class="info-item">
                        <span>Current APY:</span>
                        <span class="highlight">24.5%</span>
                    </div>
                    <div class="info-item">
                        <span>Your Balance:</span>
                        <span>${this.demoData.portfolio.ltdBalance} LTD</span>
                    </div>
                </div>
                <div class="staking-form">
                    <label>Amount to Stake:</label>
                    <input type="number" id="stake-amount" placeholder="Enter amount" max="${this.demoData.portfolio.ltdBalance}">
                    <button class="trade-confirm-btn" onclick="dashboard.confirmStaking()">Stake Tokens</button>
                </div>
            </div>
        `;
        this.showModal(modalContent);
    }

    createYieldFarmingModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>Yield Farming</h2>
                <button class="close-btn" onclick="dashboard.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Select a liquidity pool to start yield farming:</p>
                <div class="pools-list">
                    ${this.demoData.pools.map(pool => `
                        <div class="pool-item">
                            <h4>${pool.name}</h4>
                            <p>APY: ${pool.apy}%</p>
                            <button class="pool-btn" onclick="dashboard.joinPool(${pool.id})">Join Pool</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.showModal(modalContent);
    }

    createLendingModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>Lend Assets</h2>
                <button class="close-btn" onclick="dashboard.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Earn interest by lending your assets to the protocol.</p>
                <div class="lending-options">
                    <div class="lending-option">
                        <h4>LTD Lending</h4>
                        <p>APY: 18.5%</p>
                        <button class="trade-confirm-btn">Lend LTD</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalContent);
    }

    createNFTModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>NFT Collection</h2>
                <button class="close-btn" onclick="dashboard.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="nft-collection">
                    ${this.demoData.nfts.map(nft => `
                        <div class="nft-modal-item ${nft.rarity}">
                            <h4>${nft.name}</h4>
                            <p>${nft.description}</p>
                            <span class="nft-value">Value: ${nft.value} LTD</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.showModal(modalContent);
    }

    createMarketplaceModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>NFT Marketplace</h2>
                <button class="close-btn" onclick="dashboard.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Buy, sell, and trade NFTs with other community members.</p>
                <div class="marketplace-features">
                    <button class="marketplace-btn">Browse NFTs</button>
                    <button class="marketplace-btn">Sell NFT</button>
                    <button class="marketplace-btn">My Listings</button>
                </div>
            </div>
        `;
        this.showModal(modalContent);
    }

    // Functional Implementations
    async confirmStaking() {
        const amount = parseFloat(document.getElementById('stake-amount').value);
        if (!amount || amount <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }
        if (amount > this.demoData.portfolio.ltdBalance) {
            this.showNotification('Insufficient balance', 'error');
            return;
        }

        const button = document.querySelector('.trade-confirm-btn');
        this.setButtonLoading(button, true);

        try {
            this.showNotification('Processing stake transaction...', 'info');
            
            // Simulate blockchain transaction
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update portfolio data
            this.demoData.portfolio.ltdBalance -= amount;
            this.demoData.portfolio.stakingRewards += amount * 0.245; // 24.5% APY simulation
            
            this.updatePortfolioDisplay();
            this.showNotification(`Successfully staked ${amount} LTD tokens!`, 'success');
            this.closeModal();
            
        } catch (error) {
            this.showNotification('Transaction failed. Please try again.', 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async joinPool(poolId) {
        const pool = this.demoData.pools.find(p => p.id === poolId);
        if (!pool) return;

        try {
            this.showNotification(`Joining ${pool.name} pool...`, 'info');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.showNotification(`Successfully joined ${pool.name} pool!`, 'success');
            this.closeModal();
            
        } catch (error) {
            this.showNotification('Failed to join pool', 'error');
        }
    }

    // Trading Functions
    async executeTrade(type) {
        const amountInput = document.getElementById('trade-amount');
        const amount = parseFloat(amountInput?.value || 0);
        
        if (!amount || amount <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }

        const button = document.querySelector(`.trade-btn.${type}`);
        this.setButtonLoading(button, true);

        try {
            const action = type === 'buy' ? 'Buying' : 'Selling';
            this.showNotification(`${action} ${amount} LTD...`, 'info');
            
            await new Promise(resolve => setTimeout(resolve, 1800));
            
            // Update balances (demo simulation)
            if (type === 'buy') {
                this.demoData.portfolio.ltdBalance += amount;
                this.demoData.portfolio.totalValue += amount * this.demoData.trading.currentPrice;
            } else {
                this.demoData.portfolio.ltdBalance -= amount;
                this.demoData.portfolio.totalValue -= amount * this.demoData.trading.currentPrice;
            }
            
            this.updatePortfolioDisplay();
            this.showNotification(`Successfully ${type === 'buy' ? 'bought' : 'sold'} ${amount} LTD!`, 'success');
            
        } catch (error) {
            this.showNotification('Trade failed. Please try again.', 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    // Portfolio Display Update
    updatePortfolioDisplay() {
        // Update portfolio values in the UI
        const elements = {
            totalValue: document.querySelector('.portfolio-value'),
            ltdBalance: document.querySelector('.ltd-balance'),
            stakingRewards: document.querySelector('.staking-rewards')
        };

        if (elements.totalValue) {
            elements.totalValue.textContent = `$${this.demoData.portfolio.totalValue.toFixed(2)}`;
        }
        if (elements.ltdBalance) {
            elements.ltdBalance.textContent = `${this.demoData.portfolio.ltdBalance.toFixed(0)} LTD`;
        }
        if (elements.stakingRewards) {
            elements.stakingRewards.textContent = `${this.demoData.portfolio.stakingRewards.toFixed(1)} LTD`;
        }
    }

    // Navigation System
    navigateToSection(sectionName) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        const activeLink = Array.from(document.querySelectorAll('.nav-link'))
            .find(link => link.textContent.toLowerCase() === sectionName.toLowerCase());
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Hide all sections
        document.querySelectorAll('.dashboard-grid > section').forEach(section => {
            section.style.display = 'none';
        });

        // Show relevant sections based on navigation
        switch(sectionName.toLowerCase()) {
            case 'dashboard':
                this.showDashboardSections();
                break;
            case 'trading':
                this.showTradingSection();
                break;
            case 'staking':
                this.showStakingSection();
                break;
            case 'nfts':
                this.showNFTSection();
                break;
            case 'dao':
                this.showDAOSection();
                break;
            default:
                this.showDashboardSections();
        }

        this.showNotification(`Navigated to ${sectionName}`, 'info');
    }

    showDashboardSections() {
        // Show main dashboard sections
        const sectionsToShow = ['.portfolio-stats', '.trading-interface', '.quick-actions', '.liquidity-pools', '.activity-feed'];
        sectionsToShow.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) element.style.display = 'block';
        });
    }

    showTradingSection() {
        const element = document.querySelector('.trading-interface');
        if (element) element.style.display = 'block';
        // Auto-open trading modal for better UX
        setTimeout(() => this.showTrading('buy'), 500);
    }

    showStakingSection() {
        const element = document.querySelector('.quick-actions');
        if (element) element.style.display = 'block';
        // Auto-open staking modal
        setTimeout(() => this.showStaking(), 500);
    }

    showNFTSection() {
        const element = document.querySelector('.nft-card');
        if (element) element.style.display = 'block';
    }

    showDAOSection() {
        const element = document.querySelector('.governance-card');
        if (element) element.style.display = 'block';
    }
    
    // Liquidity Pool Functions
    addLiquidity() {
        this.showNotification('Add liquidity interface opening...', 'info');
        // Implement add liquidity modal
    }
    
    // DAO Functions
    vote(choice, proposalId) {
        const proposal = this.demoData.proposals.find(p => p.id === proposalId);
        if (proposal) {
            this.showNotification(`Voting ${choice} on proposal #${proposalId}...`, 'info');
            
            // Simulate voting
            setTimeout(() => {
                if (choice === 'yes') {
                    proposal.yesVotes += this.demoData.portfolio.ltdBalance;
                } else {
                    proposal.noVotes += this.demoData.portfolio.ltdBalance;
                }
                
                proposal.totalVotes = proposal.yesVotes + proposal.noVotes;
                this.updateProposalDisplay(proposalId);
                this.showNotification(`Vote cast successfully!`, 'success');
            }, 2000);
        }
    }
    
    updateProposalDisplay(proposalId) {
        const proposal = this.demoData.proposals.find(p => p.id === proposalId);
        if (!proposal) return;
        
        const yesPercent = (proposal.yesVotes / proposal.totalVotes) * 100;
        const noPercent = (proposal.noVotes / proposal.totalVotes) * 100;
        
        // Update vote bars
        const yesBar = document.querySelector('.vote-yes');
        const noBar = document.querySelector('.vote-no');
        
        if (yesBar) yesBar.style.width = `${yesPercent}%`;
        if (noBar) noBar.style.width = `${noPercent}%`;
        
        // Update vote numbers
        const yesVotes = document.querySelector('.yes-votes');
        const noVotes = document.querySelector('.no-votes');
        
        if (yesVotes) {
            yesVotes.textContent = `${yesPercent.toFixed(0)}% Yes (${(proposal.yesVotes / 1000).toFixed(0)}K LTD)`;
        }
        if (noVotes) {
            noVotes.textContent = `${noPercent.toFixed(0)}% No (${(proposal.noVotes / 1000).toFixed(0)}K LTD)`;
        }
    }
    
    // Profile Functions
    showProfile() {
        this.showNotification('Profile opening...', 'info');
        // Implement profile modal
    }
    
    // Modal Functions
    // Modal Management
    showModal(content, modalId = 'dynamic-modal') {
        // Remove existing modal if present
        this.closeModal();
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = modalId;
        modal.innerHTML = `
            <div class="modal-content">
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        return modal;
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        });
    }
    
    // Utility Functions
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            maxWidth: '300px',
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            transform: 'translateX(100%)',
            opacity: '0'
        });
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = 'rgba(14, 203, 129, 0.9)';
                break;
            case 'error':
                notification.style.background = 'rgba(246, 70, 93, 0.9)';
                break;
            case 'warning':
                notification.style.background = 'rgba(240, 185, 11, 0.9)';
                break;
            default:
                notification.style.background = 'rgba(31, 199, 212, 0.9)';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    formatNumber(number, decimals = 2) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }
    
    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.updateWalletInfo();
                    this.showNotification('Wallet connected successfully!', 'success');
                    return true;
                }
            } catch (error) {
                console.error('Error connecting wallet:', error);
                this.showNotification('Error connecting wallet', 'error');
                return false;
            }
        } else {
            this.showNotification('MetaMask not detected', 'warning');
            return false;
        }
    }
    
    async disconnectWallet() {
        this.currentAccount = null;
        this.updateWalletInfo();
        this.showNotification('Wallet disconnected', 'info');
    }
    
    // Contract interaction methods (placeholders)
    async stakeLTD(amount) {
        try {
            this.showNotification(`Staking ${amount} LTD...`, 'info');
            // Implement actual staking logic
            setTimeout(() => {
                this.showNotification('LTD staked successfully!', 'success');
            }, 2000);
        } catch (error) {
            console.error('Error staking LTD:', error);
            this.showNotification('Error staking LTD', 'error');
        }
    }
    
    async claimRewards() {
        try {
            this.showNotification('Claiming staking rewards...', 'info');
            // Implement actual claim logic
            setTimeout(() => {
                this.demoData.portfolio.stakingRewards = 0;
                this.showNotification('Rewards claimed successfully!', 'success');
            }, 2000);
        } catch (error) {
            console.error('Error claiming rewards:', error);
            this.showNotification('Error claiming rewards', 'error');
        }
    }
    
    async swapTokens(fromToken, toToken, amount) {
        try {
            this.showNotification(`Swapping ${amount} ${fromToken} to ${toToken}...`, 'info');
            // Implement actual swap logic
            setTimeout(() => {
                this.showNotification('Swap completed successfully!', 'success');
            }, 3000);
        } catch (error) {
            console.error('Error swapping tokens:', error);
            this.showNotification('Error swapping tokens', 'error');
        }
    }

    /**
     * API Integration Event Handlers - Fase 2: Backend Integration
     */
    
    /**
     * Handle successful user login
     */
    handleUserLogin(userData) {
        console.log('🔐 User logged in:', userData);
        
        // Update wallet info with user data
        const walletAddress = document.querySelector('.wallet-address');
        const walletBalance = document.querySelector('.wallet-balance');
        
        if (walletAddress && userData.wallet_address) {
            walletAddress.textContent = userData.wallet_address;
        }
        
        if (walletBalance && userData.balance) {
            walletBalance.textContent = `${userData.balance} LTD`;
        }

        // Show welcome notification
        if (this.apiManager) {
            this.apiManager.showNotification(
                'Welcome Back!',
                `Hello ${userData.name}, your dashboard is ready`,
                'success'
            );
        }

        // Refresh data with authenticated user context
        this.refreshData();
    }

    /**
     * Handle user logout
     */
    handleUserLogout() {
        console.log('🚪 User logged out');
        
        // Reset to demo/default values
        const walletAddress = document.querySelector('.wallet-address');
        const walletBalance = document.querySelector('.wallet-balance');
        
        if (walletAddress) walletAddress.textContent = '0x742d35...8b2f';
        if (walletBalance) walletBalance.textContent = '2,500 LTD';

        // Show logout notification
        if (this.apiManager) {
            this.apiManager.showNotification(
                'Logged Out',
                'You have been logged out successfully',
                'info'
            );
        }
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(status) {
        const indicator = document.getElementById('connectionStatus');
        if (!indicator) return;

        indicator.className = `connection-status ${status}`;
        
        const statusText = {
            connected: '🟢 Connected',
            disconnected: '🟡 Offline',
            error: '🔴 Connection Error'
        };
        
        indicator.textContent = statusText[status] || status;
    }

    /**
     * Handle successful payment/transaction
     */
    handlePaymentSuccess(paymentData) {
        console.log('💰 Payment successful:', paymentData);
        
        // Show success notification
        if (this.apiManager) {
            this.apiManager.showNotification(
                'Transaction Successful',
                `${paymentData.type}: ${paymentData.amount} ${paymentData.currency}`,
                'success'
            );
        }

        // Refresh balance and data
        this.refreshData();
    }

    /**
     * Handle payment/transaction error
     */
    handlePaymentError(errorData) {
        console.error('💥 Payment error:', errorData);
        
        // Show error notification
        if (this.apiManager) {
            this.apiManager.showNotification(
                'Transaction Failed',
                errorData.message || 'Unknown payment error',
                'error'
            );
        }
    }

    /**
     * Enhanced trading with API integration
     */
    async showTrading(type) {
        if (!this.apiManager) {
            // Fallback to demo mode
            return this.showTradingDemo(type);
        }

        try {
            // Check authentication
            if (!this.apiManager.isAuthenticated) {
                this.apiManager.showNotification(
                    'Authentication Required',
                    'Please log in to access trading features',
                    'warning'
                );
                return;
            }

            // Show trading modal with API integration
            const modal = document.getElementById('tradingModal');
            const title = document.getElementById('tradingModalTitle');
            
            title.textContent = type === 'buy' ? 'Buy LTD' : 'Sell LTD';
            modal.style.display = 'flex';

            // Setup API-integrated trading
            this.setupAPITrading(type);
            
        } catch (error) {
            console.error('Error showing trading interface:', error);
            this.apiManager.showNotification(
                'Trading Error',
                'Could not load trading interface',
                'error'
            );
        }
    }

    /**
     * Setup API-integrated trading
     */
    setupAPITrading(type) {
        const confirmBtn = document.getElementById('tradeConfirmBtn');
        const amountInput = document.getElementById('tradeAmount');
        const priceInput = document.getElementById('tradePrice');

        // Remove existing listeners
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

        // Add new API-integrated listener
        newBtn.addEventListener('click', async () => {
            const amount = parseFloat(amountInput.value);
            const price = parseFloat(priceInput.value);

            if (!amount || !price) {
                this.apiManager.showNotification(
                    'Invalid Input',
                    'Please enter valid amount and price',
                    'warning'
                );
                return;
            }

            try {
                // Show loading state
                newBtn.setAttribute('data-loading', 'true');
                newBtn.textContent = 'Processing...';

                // Process trade through API
                const tradeData = {
                    type: type,
                    amount: amount,
                    price: price,
                    total: amount * price,
                    currency: 'LTD'
                };

                // Use payment manager for transaction
                if (this.paymentManager) {
                    await this.paymentManager.processPayment(tradeData);
                }

                // Close modal on success
                this.closeModal();
                
            } catch (error) {
                console.error('Trading error:', error);
                this.apiManager.showNotification(
                    'Trade Failed',
                    error.message || 'Could not process trade',
                    'error'
                );
            } finally {
                // Reset button state
                newBtn.removeAttribute('data-loading');
                newBtn.textContent = 'Confirm Trade';
            }
        });
    }

    /**
     * Demo trading fallback
     */
    showTradingDemo(type) {
        console.log(`Demo ${type} trading`);
        const modal = document.getElementById('tradingModal');
        const title = document.getElementById('tradingModalTitle');
        
        title.textContent = type === 'buy' ? 'Buy LTD (Demo)' : 'Sell LTD (Demo)';
        modal.style.display = 'flex';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new LaTandaWeb3Dashboard();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Dashboard paused');
    } else {
        console.log('Dashboard resumed');
        if (window.dashboard) {
            window.dashboard.refreshData();
        }
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.dashboard && window.dashboard.isInitialized) {
        // Redraw chart on resize
        setTimeout(() => {
            window.dashboard.initializeChart();
        }, 100);
    }
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('Dashboard error:', event.error);
    if (window.dashboard) {
        window.dashboard.showNotification('An error occurred', 'error');
    }
});

// Unhandled promise rejection handling
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.dashboard) {
        window.dashboard.showNotification('Operation failed', 'error');
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTandaWeb3Dashboard;
}