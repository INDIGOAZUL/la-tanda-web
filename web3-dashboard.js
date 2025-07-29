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
            await this.initializeWeb3();
            this.initializeEventListeners();
            this.initializeChart();
            this.initializeParticles();
            this.startDataRefresh();
            this.isInitialized = true;
            console.log('La Tanda Web3 Dashboard initialized successfully');
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showNotification('Error initializing dashboard', 'error');
        }
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
    showTrading(type = 'buy') {
        const modal = document.getElementById('tradingModal');
        const title = document.getElementById('tradingModalTitle');
        const confirmBtn = document.getElementById('tradeConfirmBtn');
        
        if (modal && title && confirmBtn) {
            title.textContent = `${type === 'buy' ? 'Buy' : 'Sell'} LTD`;
            confirmBtn.textContent = `Confirm ${type === 'buy' ? 'Purchase' : 'Sale'}`;
            confirmBtn.className = `trade-confirm-btn ${type}`;
            
            modal.classList.add('show');
            
            // Focus on amount input
            setTimeout(() => {
                const amountInput = document.getElementById('tradeAmount');
                if (amountInput) amountInput.focus();
            }, 100);
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
    
    // Staking Functions
    showStaking() {
        this.showNotification('Staking interface opening...', 'info');
        // Implement staking modal
    }
    
    showYieldFarming() {
        this.showNotification('Yield farming interface opening...', 'info');
        // Implement yield farming modal
    }
    
    showLending() {
        this.showNotification('Lending interface opening...', 'info');
        // Implement lending modal
    }
    
    // NFT Functions
    showNFTs() {
        this.showNotification('NFT collection opening...', 'info');
        // Implement NFT modal
    }
    
    showMarketplace() {
        this.showNotification('NFT marketplace opening...', 'info');
        // Implement marketplace modal
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
    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
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