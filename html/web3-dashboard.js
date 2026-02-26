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
        
        // Exchange-specific properties
        this.currentTradingPair = 'LTD/USDC';
        this.currentExchangeSection = 'spot';
        this.tradingPairs = [
            { symbol: 'LTD/USDC', price: 0.7523, change: 5.24, volume: 2400000 },
            { symbol: 'LTD/ETH', price: 0.000234, change: -2.18, volume: 890000 },
            { symbol: 'LTD/BTC', price: 0.0000172, change: 1.45, volume: 567000 }
        ];
        
        // Demo data for development
        // Market ticker data
        this.marketTicker = [
            { pair: 'LTD/USDC', price: '$0.7523', change: '+5.24%', positive: true },
            { pair: 'LTD/ETH', price: '₿0.000234', change: '-2.18%', positive: false },
            { pair: 'BTC/USD', price: '$43,750', change: '+3.45%', positive: true },
            { pair: 'ETH/USD', price: '$2,650', change: '+2.87%', positive: true },
            { pair: 'TVL', price: '$847M', change: '+15.2%', positive: true }
        ];
        
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
    
    // Exchange-specific methods
    showPairSelector() {
        console.log('🔄 Opening trading pair selector');
        // TODO: Show trading pair selection modal
        this.showNotification('Trading pair selector coming soon', 'info');
    }
    
    showExchangeSection(section) {
        console.log(`📊 Switching to ${section} trading`);
        this.currentExchangeSection = section;
        
        // Update active nav link
        document.querySelectorAll('.exchange-nav-links .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[onclick*="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Show different interfaces based on section
        switch(section) {
            case 'spot':
                this.initializeSpotTrading();
                break;
            case 'margin':
                this.showNotification('Margin trading coming soon', 'info');
                break;
            case 'futures':
                this.showNotification('Futures trading coming soon', 'info');
                break;
            case 'defi':
                this.scrollToSection('defi-modules');
                break;
            case 'nft':
                this.scrollToSection('nft-collection');
                break;
            case 'dao':
                this.scrollToSection('dao-governance');
                break;
            case 'markets':
                console.log('📈 Showing crypto markets overview');
                this.showNotification('Markets overview - Real-time crypto data', 'info');
                this.scrollToSection('market-data');
                break;
        }
    }
    
    showChainSelector() {
        console.log('🔗 Opening chain selector');
        this.showNotification('Chain selector - La Tanda Chain active', 'success');
    }
    
    showWalletModal() {
        console.log('👛 Opening wallet modal');
        this.showNotification('Wallet: 2,500 LTD ≈ $1,875.75', 'info');
    }
    
    showProfileMenu() {
        console.log('👤 Opening profile menu');
        this.showNotification('Profile menu coming soon', 'info');
    }
    
    initializeSpotTrading() {
        console.log('💹 Initializing spot trading interface');
        // Focus on trading module
        const tradingModule = document.querySelector('.trading-module');
        if (tradingModule) {
            tradingModule.scrollIntoView({ behavior: 'smooth', block: 'center' });
            tradingModule.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
            setTimeout(() => {
                tradingModule.style.boxShadow = '';
            }, 3000);
        }
    }
    
    scrollToSection(sectionClass) {
        const section = document.querySelector(`.${sectionClass}`);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    initializeMarketTicker() {
        console.log('📈 Initializing market ticker');
        
        // Update ticker with real-time-like data
        const updateTicker = () => {
            this.marketTicker.forEach((item, index) => {
                // Simulate minor price movements
                const randomChange = (Math.random() - 0.5) * 0.001;
                if (item.pair === 'LTD/USDC') {
                    const newPrice = 0.7523 + randomChange;
                    const changePercent = ((newPrice - 0.7523) / 0.7523 * 100).toFixed(2);
                    item.price = `$${newPrice.toFixed(4)}`;
                    item.change = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
                    item.positive = changePercent > 0;
                }
            });
            
            this.updateTickerDisplay();
        };
        
        // Update every 30 seconds for demo
        setInterval(updateTicker, 30000);
        
        // Initial update
        this.updateTickerDisplay();
    }
    
    updateTickerDisplay() {
        const tickerContainer = document.querySelector('.ticker-scroll');
        if (tickerContainer) {
            // Update existing ticker items
            const tickerItems = tickerContainer.querySelectorAll('.ticker-item');
            tickerItems.forEach((item, index) => {
                if (this.marketTicker[index]) {
                    const data = this.marketTicker[index];
                    const priceEl = item.querySelector('.price');
                    const changeEl = item.querySelector('.change');
                    
                    if (priceEl) priceEl.textContent = data.price;
                    if (changeEl) {
                        changeEl.textContent = data.change;
                        changeEl.className = `change ${data.positive ? 'positive' : 'negative'}`;
                    }
                }
            });
        }
    }
    
    initializeExchangeInterface() {
        console.log('🚀 Initializing cutting-edge Web3 exchange interface');
        
        // Set up real-time price updates
        this.initializePriceUpdates();
        
        // Initialize advanced trading features
        this.initializeAdvancedTrading();
        
        // Set up WebSocket connections for real-time data (simulated)
        this.initializeRealTimeConnections();
        
        // Initialize exchange-specific UI enhancements
        this.initializeExchangeAnimations();
    }
    
    initializePriceUpdates() {
        // Real-time data validation with cadence control
        console.log('📊 Initializing real-time data feeds with validation');
        
        try {
            // Primary update cycle - every 15 seconds for price data
            this.priceUpdateInterval = setInterval(() => {
                try {
                    this.updateTradingPrices();
                    this.updatePortfolioValues();
                    this.validateDataFreshness();
                } catch (error) {
                    console.error('⚠️ Primary update error:', error);
                }
            }, 15000);
            
            // Secondary update cycle - every 30 seconds for market stats
            this.marketUpdateInterval = setInterval(() => {
                try {
                    this.updateMarketStats();
                    this.updateLiquidityPools();
                } catch (error) {
                    console.error('⚠️ Market update error:', error);
                }
            }, 30000);
            
            // Ticker update cycle - every 45 seconds to match animation
            this.tickerUpdateInterval = setInterval(() => {
                try {
                    this.updateTickerDisplay();
                } catch (error) {
                    console.error('⚠️ Ticker update error:', error);
                }
            }, 45000);
            
            // APY and rewards update - every 2 minutes
            this.yieldUpdateInterval = setInterval(() => {
                try {
                    this.updateYieldData();
                } catch (error) {
                    console.error('⚠️ Yield update error:', error);
                }
            }, 120000);
            
            console.log('✅ All data feed intervals initialized successfully');
        } catch (error) {
            console.error('🔴 Failed to initialize price updates:', error);
        }
    }
    
    validateDataFreshness() {
        const now = Date.now();
        const staleThreshold = 60000; // 1 minute
        
        // Validate last update timestamps
        if (this.lastPriceUpdate && (now - this.lastPriceUpdate) > staleThreshold) {
            console.warn('⚠️ Price data may be stale, refreshing...');
            this.refreshAllData();
        }
        
        // Show connection status
        const statusEl = document.querySelector('.chain-selector .latency');
        if (statusEl) {
            const latency = Math.round(Math.random() * 20 + 8); // 8-28ms simulation
            statusEl.textContent = `${latency}ms`;
            
            // Update status color based on latency
            const statusDot = document.querySelector('.status-dot');
            if (statusDot) {
                statusDot.className = `status-dot ${latency < 20 ? 'active' : 'warning'}`;
            }
        }
    }
    
    refreshAllData() {
        console.log('🔄 Refreshing all data feeds');
        this.updateTradingPrices();
        this.updatePortfolioValues();
        this.updateMarketStats();
        this.updateYieldData();
        this.updateTickerDisplay();
        this.lastPriceUpdate = Date.now();
    }
    
    updateYieldData() {
        // Update APY values with realistic fluctuation
        const apyElements = document.querySelectorAll('.apy-badge, .pool-apy');
        apyElements.forEach(el => {
            if (el.textContent.includes('%')) {
                const currentApy = parseFloat(el.textContent.replace('%', '').replace(' APY', ''));
                const fluctuation = (Math.random() - 0.5) * 0.5; // ±0.25% fluctuation
                const newApy = Math.max(0.1, currentApy + fluctuation);
                
                el.textContent = el.textContent.includes('APY') ? `${newApy.toFixed(1)}% APY` : `${newApy.toFixed(1)}%`;
                this.addUpdateAnimation(el);
            }
        });
        
        // Update staking rewards
        const rewardsEl = document.querySelector('.stat-value');
        if (rewardsEl && rewardsEl.textContent.includes('LTD')) {
            const currentRewards = parseFloat(rewardsEl.textContent.replace(' LTD', ''));
            const newRewards = currentRewards + (Math.random() * 0.1); // Small incremental increase
            rewardsEl.textContent = `${newRewards.toFixed(1)} LTD`;
            this.addUpdateAnimation(rewardsEl);
        }
    }
    
    updateLiquidityPools() {
        // Update TVL values with realistic market movements
        const tvlElements = document.querySelectorAll('.pool-tvl');
        tvlElements.forEach(el => {
            if (el.textContent.includes('TVL')) {
                const currentTvl = el.textContent.match(/\$([\d.]+)K?/)?.[1];
                if (currentTvl) {
                    const multiplier = el.textContent.includes('K') ? 1000 : 1;
                    const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
                    const newTvl = parseFloat(currentTvl) * (1 + fluctuation);
                    
                    if (newTvl >= 1000) {
                        el.textContent = `$${(newTvl / 1000).toFixed(0)}K TVL`;
                    } else {
                        el.textContent = `$${newTvl.toFixed(0)} TVL`;
                    }
                    this.addUpdateAnimation(el);
                }
            }
        });
    }
    
    initializeAdvancedTrading() {
        console.log('🎨 Initializing advanced trading features');
        
        // Add trading interface enhancements
        const tradingModule = document.querySelector('.trading-module');
        if (tradingModule) {
            // Add advanced trading indicators
            this.addTradingIndicators(tradingModule);
        }
    }
    
    initializeRealTimeConnections() {
        console.log('🔄 Establishing real-time data connections');
        
        // Simulate WebSocket connection for real-time data
        this.simulateRealTimeData();
    }
    
    initializeExchangeAnimations() {
        console.log('✨ Initializing Web3 exchange animations');
        
        // Add particle animations for trading actions
        this.addTradingParticles();
        
        // Add glow effects to active elements
        this.addGlowEffects();
    }
    
    updateTradingPrices() {
        // Update LTD price with realistic fluctuation
        const currentPrice = parseFloat(document.querySelector('.current-price')?.textContent?.replace('$', '') || '0.75');
        const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
        const newPrice = Math.max(0.01, currentPrice + fluctuation);
        const priceChange = newPrice - 0.75;
        const percentChange = ((priceChange / 0.75) * 100);
        
        // Update price display
        const priceEl = document.querySelector('.current-price');
        const changeEl = document.querySelector('.price-change');
        
        if (priceEl) {
            priceEl.textContent = `$${newPrice.toFixed(4)}`;
        }
        
        if (changeEl) {
            changeEl.textContent = `${priceChange >= 0 ? '+' : ''}$${Math.abs(priceChange).toFixed(4)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)`;
            changeEl.className = `price-change ${priceChange >= 0 ? 'positive' : 'negative'}`;
        }
    }
    
    updatePortfolioValues() {
        // Update portfolio values based on price changes
        const ltdBalance = 2500;
        const currentPrice = parseFloat(document.querySelector('.current-price')?.textContent?.replace('$', '') || '0.75');
        const newValue = ltdBalance * currentPrice;
        
        // Update KPI values
        const portfolioValueEl = document.querySelector('.kpi-stat .kpi-value');
        if (portfolioValueEl && portfolioValueEl.textContent.includes('$')) {
            portfolioValueEl.textContent = `$${(newValue + 1372.89).toFixed(2)}`; // Include other assets
        }
    }
    
    addTradingIndicators(module) {
        // Add technical analysis indicators (visual enhancements)
        const chartContainer = module.querySelector('.chart-container');
        if (chartContainer) {
            // Add trading volume indicator
            const volumeIndicator = document.createElement('div');
            volumeIndicator.className = 'volume-indicator';
            volumeIndicator.innerHTML = '📈 Volume: 2.4M LTD';
            chartContainer.appendChild(volumeIndicator);
        }
    }
    
    simulateRealTimeData() {
        // Simulate real-time WebSocket data
        setInterval(() => {
            console.log('📶 Receiving real-time market data...');
            this.updateMarketStats();
        }, 10000);
    }
    
    updateMarketStats() {
        // Update 24h volume and other market stats
        const marketStats = document.querySelectorAll('.market-stat .stat-value');
        marketStats.forEach((stat, index) => {
            if (stat.textContent.includes('M')) {
                const currentValue = parseFloat(stat.textContent.replace('$', '').replace('M', ''));
                const newValue = currentValue + (Math.random() - 0.5) * 0.1;
                stat.textContent = `$${newValue.toFixed(1)}M`;
            }
        });
    }
    
    addTradingParticles() {
        // Add visual effects for trading actions
        const particleContainer = document.querySelector('.particles');
        if (particleContainer) {
            // Add trading-specific particles
            for (let i = 0; i < 5; i++) {
                const particle = document.createElement('div');
                particle.className = 'trading-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: var(--accent-primary);
                    border-radius: 50%;
                    opacity: 0.8;
                    animation: float 20s linear infinite;
                    left: ${Math.random() * 100}%;
                    animation-delay: ${Math.random() * 20}s;
                `;
                particleContainer.appendChild(particle);
            }
        }
    }
    
    addGlowEffects() {
        // Add dynamic glow effects to active trading elements
        const tradingButtons = document.querySelectorAll('.action-btn');
        tradingButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.boxShadow = '';
            });
        });
    }
    
    // Professional accordion toggle functionality with accessibility
    toggleAccordion(accordionId) {
        console.log(`🔄 Toggling accordion: ${accordionId}`);
        
        const content = document.getElementById(`${accordionId}-content`);
        const header = document.querySelector(`[onclick*="${accordionId}"]`);
        const icon = header?.querySelector('.accordion-icon');
        
        if (content && header) {
            const isActive = content.classList.contains('active');
            
            // Close all other accordions with ARIA updates
            document.querySelectorAll('.accordion-content.active').forEach(activeContent => {
                if (activeContent !== content) {
                    activeContent.classList.remove('active');
                    const activeHeader = document.querySelector(`[onclick*="${activeContent.id.replace('-content', '')}"]`);
                    const activeIcon = activeHeader?.querySelector('.accordion-icon');
                    
                    if (activeHeader) {
                        activeHeader.classList.remove('active');
                        activeHeader.setAttribute('aria-expanded', 'false');
                    }
                    if (activeIcon) activeIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            // Toggle current accordion with accessibility support
            if (isActive) {
                content.classList.remove('active');
                header.classList.remove('active');
                header.setAttribute('aria-expanded', 'false');
                if (icon) icon.style.transform = 'rotate(0deg)';
                
                // Announce to screen readers
                this.announceToScreenReader(`${accordionId.replace('-', ' ')} section collapsed`);
            } else {
                content.classList.add('active');
                header.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
                if (icon) icon.style.transform = 'rotate(180deg)';
                
                // Announce to screen readers
                this.announceToScreenReader(`${accordionId.replace('-', ' ')} section expanded`);
                
                // Add smooth scroll to accordion with reduced motion check
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
                
                setTimeout(() => {
                    header.scrollIntoView({ behavior: scrollBehavior, block: 'center' });
                }, prefersReducedMotion ? 50 : 200);
            }
        }
    }
    
    // Screen reader announcement utility
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    // Initialize accessibility features
    initializeAccessibility() {
        console.log('♿ Initializing accessibility features');
        
        // Add keyboard navigation support
        this.initializeKeyboardNavigation();
        
        // Add focus management
        this.initializeFocusManagement();
        
        // Add live region for dynamic updates
        this.createLiveRegion();
    }
    
    initializeKeyboardNavigation() {
        // Add keyboard support for accordion headers
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
        });
        
        // Add keyboard support for quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.setAttribute('tabindex', '0');
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    }
    
    initializeFocusManagement() {
        // Ensure proper focus order and visibility
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusable = document.querySelectorAll(focusableElements);
        
        focusable.forEach((element, index) => {
            element.addEventListener('focus', () => {
                // Ensure focused element is visible
                if (element.scrollIntoViewIfNeeded) {
                    element.scrollIntoViewIfNeeded();
                } else {
                    element.scrollIntoView({ block: 'nearest' });
                }
            });
        });
    }
    
    createLiveRegion() {
        // Create ARIA live region for dynamic updates
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'false');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
        
        this.liveRegion = liveRegion;
    }
    
    // Announce price updates to screen readers
    announcePriceUpdate(symbol, newPrice, change) {
        if (this.liveRegion) {
            const changeText = change >= 0 ? `up ${Math.abs(change).toFixed(2)}%` : `down ${Math.abs(change).toFixed(2)}%`;
            this.liveRegion.textContent = `${symbol} price updated to $${newPrice}, ${changeText}`;
        }
    }
    
    // Professional DEX Swap Interface Methods
    initializeSwapInterface() {
        console.log('💹 Initializing professional swap interface');
        
        // Set up event listeners for swap interface
        this.setupSwapEventListeners();
        
        // Initialize default state
        this.resetSwapInterface();
        
        // Show gas analysis with default values for demo
        setTimeout(() => {
            console.log('🚀 DEBUGGING: Starting immediate gas demo...');
            
            // Force show swap details first
            const detailsEl = document.getElementById('swap-details');
            if (detailsEl) {
                detailsEl.style.display = 'block';
                console.log('✅ Swap details element found and shown');
                
                // Add a simple gas section immediately for debugging
                detailsEl.innerHTML += `
                    <div class="detail-row" style="color: #00FFFF; font-weight: bold;">
                        <span class="detail-label">🔧 DEBUG: Gas Analysis Active</span>
                        <span class="detail-value">$0.0023 USD</span>
                    </div>
                `;
                console.log('✅ Debug gas analysis added');
            } else {
                console.error('❌ swap-details element not found!');
            }
            
            // Try the full analysis
            try {
                this.performTransactionAnalysis('LTD', 'USDC', 100);
            } catch (error) {
                console.error('❌ performTransactionAnalysis failed:', error);
            }
        }, 500);
        
        // Add a visible notification
        setTimeout(() => {
            this.showNotification('🔧 Gas Analysis Debug Mode Active', 'info');
        }, 1000);
    }
    
    setupSwapEventListeners() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('tokenSelectorModal');
            if (modal && e.target === modal) {
                this.closeTokenSelector();
            }
        });
        
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTokenSelector();
            }
        });
    }
    
    resetSwapInterface() {
        const swapBtn = document.getElementById('swap-btn');
        if (swapBtn) {
            swapBtn.disabled = true;
            const btnText = swapBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Enter amount';
        }
    }
    
    showTokenSelector(direction) {
        console.log(`🔄 Opening token selector for ${direction}`);
        this.currentTokenDirection = direction;
        const modal = document.getElementById('tokenSelectorModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Focus search input
            setTimeout(() => {
                const searchInput = document.getElementById('tokenSearch');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.value = '';
                }
            }, 100);
        }
    }
    
    closeTokenSelector() {
        const modal = document.getElementById('tokenSelectorModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    selectToken(tokenSymbol) {
        console.log(`🪙 Selected token: ${tokenSymbol} for ${this.currentTokenDirection}`);
        
        const tokens = {
            'LTD': { symbol: 'LTD', name: 'La Tanda', logo: 'La Tanda logos (3).png', balance: '2,500', price: 0.7523 },
            'USDC': { symbol: 'USDC', name: 'USD Coin', icon: 'usdc', balance: '1,247.89', price: 1.00 },
            'ETH': { symbol: 'ETH', name: 'Ethereum', icon: 'eth', balance: '0.5847', price: 2650.00 },
            'USDT': { symbol: 'USDT', name: 'Tether USD', icon: 'usdt', balance: '892.34', price: 1.00 },
            'BTC': { symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: 'btc', balance: '0.0234', price: 43750.00 }
        };
        
        const token = tokens[tokenSymbol];
        if (token && this.currentTokenDirection) {
            this.updateTokenSelector(this.currentTokenDirection, token);
            this.closeTokenSelector();
            this.calculateSwap();
        }
    }
    
    updateTokenSelector(direction, token) {
        const selectors = document.querySelectorAll('.token-selector');
        const targetSelector = direction === 'from' ? selectors[0] : selectors[1];
        
        if (targetSelector) {
            // Update token display
            const logoEl = targetSelector.querySelector('.token-logo, .crypto-icon');
            const symbolEl = targetSelector.querySelector('.token-symbol');
            const nameEl = targetSelector.querySelector('.token-name');
            
            if (token.logo) {
                if (logoEl && logoEl.tagName === 'IMG') {
                    logoEl.src = token.logo;
                    logoEl.alt = token.symbol;
                } else if (logoEl) {
                    // Replace with img element
                    const newImg = document.createElement('img');
                    newImg.src = token.logo;
                    newImg.alt = token.symbol;
                    newImg.className = 'token-logo';
                    logoEl.parentNode.replaceChild(newImg, logoEl);
                }
            } else if (token.icon) {
                if (logoEl && logoEl.tagName === 'IMG') {
                    // Replace with icon div
                    const newIcon = document.createElement('div');
                    newIcon.className = `crypto-icon ${token.icon}`;
                    newIcon.textContent = this.getTokenIconText(token.symbol);
                    logoEl.parentNode.replaceChild(newIcon, logoEl);
                } else if (logoEl) {
                    logoEl.className = `crypto-icon ${token.icon}`;
                    logoEl.textContent = this.getTokenIconText(token.symbol);
                }
            }
            
            if (symbolEl) symbolEl.textContent = token.symbol;
            if (nameEl) nameEl.textContent = token.name;
            
            // Update balance
            const balanceEl = document.getElementById(`${direction}-balance`);
            if (balanceEl) {
                balanceEl.textContent = `${token.balance} ${token.symbol}`;
            }
        }
    }
    
    getTokenIconText(symbol) {
        const icons = {
            'USDC': '$',
            'ETH': 'Ξ',
            'USDT': '₮',
            'WBTC': '₿'
        };
        return icons[symbol] || symbol.charAt(0);
    }
    
    filterTokens(searchTerm) {
        const tokenItems = document.querySelectorAll('.token-item');
        const term = searchTerm.toLowerCase();
        
        tokenItems.forEach(item => {
            const symbol = item.querySelector('.token-symbol')?.textContent.toLowerCase() || '';
            const name = item.querySelector('.token-name')?.textContent.toLowerCase() || '';
            
            if (symbol.includes(term) || name.includes(term) || term === '') {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    calculateSwap() {
        const fromAmount = parseFloat(document.getElementById('from-amount')?.value || '0');
        const fromSymbol = document.querySelector('.token-selector .token-symbol')?.textContent || 'LTD';
        const toSymbol = document.querySelectorAll('.token-selector .token-symbol')[1]?.textContent || 'USDC';
        
        if (fromAmount > 0) {
            // Enhanced SushiSwap-style calculations
            const rate = this.getExchangeRate(fromSymbol, toSymbol);
            const toAmount = fromAmount * rate;
            const priceImpact = this.calculatePriceImpact(fromAmount, fromSymbol);
            const dynamicSlippage = this.calculateSlippage(fromAmount, fromSymbol);
            const minimumReceived = this.calculateMinimumReceived(toAmount, dynamicSlippage);
            
            // Update UI
            const toAmountEl = document.getElementById('to-amount');
            if (toAmountEl) toAmountEl.value = toAmount.toFixed(6);
            
            const fromUsdEl = document.getElementById('from-usd');
            if (fromUsdEl) fromUsdEl.textContent = `~$${(fromAmount * this.getTokenPrice(fromSymbol)).toFixed(2)}`;
            
            const toUsdEl = document.getElementById('to-usd');
            if (toUsdEl) toUsdEl.textContent = `~$${(toAmount * this.getTokenPrice(toSymbol)).toFixed(2)}`;
            
            // Show enhanced swap details
            const detailsEl = document.getElementById('swap-details');
            if (detailsEl) {
                detailsEl.style.display = 'block';
                
                const rateEl = document.getElementById('swap-rate');
                if (rateEl) rateEl.textContent = `1 ${fromSymbol} = ${rate.toFixed(6)} ${toSymbol}`;
                
                const impactEl = document.getElementById('price-impact');
                if (impactEl) {
                    impactEl.textContent = `${priceImpact.toFixed(3)}%`;
                    impactEl.className = `detail-value ${this.getImpactClass(priceImpact)}`;
                }
                
                // Update slippage display with dynamic calculation
                const slippageEl = document.getElementById('slippage');
                if (slippageEl) {
                    slippageEl.textContent = `${dynamicSlippage.toFixed(2)}%`;
                    slippageEl.className = `detail-value ${this.getSlippageClass(dynamicSlippage)}`;
                }
                
                // Add minimum received display
                this.updateMinimumReceived(minimumReceived, toSymbol);
                
                // Show 1inch-style route optimization for larger amounts
                if (fromAmount >= 100) {
                    this.showRouteComparison(fromSymbol, toSymbol, fromAmount);
                }
                
                // Professional gas estimation and transaction simulation (for any amount > 0)
                if (fromAmount > 0) {
                    console.log('🔧 Triggering transaction analysis for amount:', fromAmount);
                    this.performTransactionAnalysis(fromSymbol, toSymbol, fromAmount);
                }
            }
            
            // Enable swap button
            const swapBtn = document.getElementById('swap-btn');
            if (swapBtn) {
                swapBtn.disabled = false;
                const btnText = swapBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = `Swap ${fromSymbol} for ${toSymbol}`;
            }
        } else {
            // Reset UI
            const toAmountEl = document.getElementById('to-amount');
            if (toAmountEl) toAmountEl.value = '';
            
            const detailsEl = document.getElementById('swap-details');
            if (detailsEl) detailsEl.style.display = 'none';
            
            const swapBtn = document.getElementById('swap-btn');
            if (swapBtn) {
                swapBtn.disabled = true;
                const btnText = swapBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'Enter amount';
            }
        }
    }
    
    getExchangeRate(fromSymbol, toSymbol) {
        // Simulated exchange rates (in production, this would call DEX APIs)
        const rates = {
            'LTD_USDC': 0.7523,
            'LTD_ETH': 0.000284,
            'LTD_USDT': 0.7523,
            'USDC_LTD': 1.3295,
            'ETH_LTD': 3521.13,
            'USDT_LTD': 1.3295,
            'USDC_ETH': 0.000377,
            'ETH_USDC': 2650.00
        };
        
        const pair = `${fromSymbol}_${toSymbol}`;
        return rates[pair] || 1;
    }
    
    getTokenPrice(symbol) {
        const prices = {
            'LTD': 0.7523,
            'USDC': 1.00,
            'ETH': 2650.00,
            'USDT': 1.00,
            'WBTC': 43750.00
        };
        return prices[symbol] || 1;
    }
    
    calculatePriceImpact(amount, symbol) {
        // Enhanced SushiSwap-style price impact calculation
        const liquidityPools = {
            'LTD': { 
                reserve0: 500000, // LTD reserves
                reserve1: 375000, // Paired token reserves (USDC equivalent)
                fee: 0.003,       // 0.3% fee like SushiSwap
                k: 500000 * 375000 // Constant product k = x * y
            },
            'USDC': { 
                reserve0: 750000, 
                reserve1: 1000000, 
                fee: 0.003,
                k: 750000 * 1000000
            },
            'ETH': { 
                reserve0: 300, 
                reserve1: 750000, // $2500 per ETH
                fee: 0.003,
                k: 300 * 750000
            },
            'USDT': { 
                reserve0: 800000, 
                reserve1: 800000, // 1:1 peg with USDC
                fee: 0.003,
                k: 800000 * 800000
            },
            'WBTC': { 
                reserve0: 25, 
                reserve1: 1250000, // $50k per BTC
                fee: 0.003,
                k: 25 * 1250000
            }
        };
        
        const pool = liquidityPools[symbol];
        if (!pool) {
            // Fallback for unknown tokens
            return Math.min((amount / 100000) * 100, 15);
        }
        
        // Calculate output using constant product formula: (x + Δx) * (y - Δy) = k
        // Where Δy = (y * Δx * (1 - fee)) / (x + Δx * (1 - fee))
        const amountWithFee = amount * (1 - pool.fee);
        const numerator = pool.reserve1 * amountWithFee;
        const denominator = pool.reserve0 + amountWithFee;
        const amountOut = numerator / denominator;
        
        // Calculate theoretical output without slippage
        const theoreticalRate = pool.reserve1 / pool.reserve0;
        const theoreticalOutput = amount * theoreticalRate * (1 - pool.fee);
        
        // Price impact = (theoretical - actual) / theoretical * 100
        const priceImpact = ((theoreticalOutput - amountOut) / theoreticalOutput) * 100;
        
        // Add liquidity depth consideration
        const liquidityRatio = amount / pool.reserve0;
        const depthImpact = liquidityRatio > 0.05 ? liquidityRatio * 10 : 0; // Penalty for large trades
        
        return Math.min(priceImpact + depthImpact, 25); // Cap at 25% for extreme cases
    }
    
    calculateSlippage(amount, symbol, userSlippage = null) {
        // SushiSwap-style dynamic slippage calculation
        const priceImpact = this.calculatePriceImpact(amount, symbol);
        
        // Base slippage settings (customizable like SushiSwap)
        const baseSlippage = userSlippage || this.getDefaultSlippage();
        
        // Dynamic slippage adjustment based on market conditions
        const marketVolatility = this.getMarketVolatility(symbol);
        const liquidityDepth = this.getLiquidityDepth(symbol);
        
        // Adjust slippage based on conditions
        let adjustedSlippage = baseSlippage;
        
        // Increase slippage for volatile markets
        if (marketVolatility > 0.05) {
            adjustedSlippage += marketVolatility * 100; // Add volatility premium
        }
        
        // Increase slippage for low liquidity
        if (liquidityDepth < 0.1) {
            adjustedSlippage += (0.1 - liquidityDepth) * 10; // Liquidity penalty
        }
        
        // Add price impact to minimum slippage
        const minimumSlippage = Math.max(adjustedSlippage, priceImpact * 1.2);
        
        return Math.min(minimumSlippage, 50); // Cap at 50% for extreme cases
    }
    
    getDefaultSlippage() {
        // SushiSwap default slippage tolerance
        return 0.5; // 0.5%
    }
    
    getMarketVolatility(symbol) {
        // Simulate market volatility (in production, would use real volatility data)
        const volatilityMap = {
            'LTD': 0.08,   // 8% daily volatility
            'USDC': 0.01,  // 1% stablecoin
            'ETH': 0.12,   // 12% ETH volatility
            'USDT': 0.01,  // 1% stablecoin
            'WBTC': 0.10   // 10% BTC volatility
        };
        return volatilityMap[symbol] || 0.15; // Default to high volatility for unknown tokens
    }
    
    getLiquidityDepth(symbol) {
        // Calculate liquidity depth score (0-1, where 1 is highest liquidity)
        const liquidityScores = {
            'LTD': 0.3,    // Medium liquidity
            'USDC': 0.9,   // High liquidity
            'ETH': 0.8,    // High liquidity
            'USDT': 0.9,   // High liquidity
            'WBTC': 0.6    // Medium-high liquidity
        };
        return liquidityScores[symbol] || 0.1; // Default to low liquidity for unknown tokens
    }
    
    calculateMinimumReceived(amountOut, slippage) {
        // Calculate minimum amount to receive after slippage
        return amountOut * (1 - slippage / 100);
    }
    
    calculateMaximumSlipped(amountOut, slippage) {
        // Calculate maximum amount considering slippage
        return amountOut * (1 + slippage / 100);
    }
    
    getSlippageClass(slippage) {
        // SushiSwap-style slippage classification
        if (slippage < 0.1) return 'slippage-excellent';
        if (slippage < 0.5) return 'slippage-good';
        if (slippage < 1) return 'slippage-acceptable';
        if (slippage < 3) return 'slippage-warning';
        return 'slippage-critical';
    }
    
    updateMinimumReceived(minimumAmount, symbol) {
        // Add or update minimum received display in swap details
        let minReceivedEl = document.getElementById('minimum-received');
        
        if (!minReceivedEl) {
            // Create element if it doesn't exist
            const detailsEl = document.getElementById('swap-details');
            if (detailsEl) {
                const detailRow = document.createElement('div');
                detailRow.className = 'detail-row';
                detailRow.innerHTML = `
                    <span class="detail-label">
                        <i class="fas fa-shield-alt" aria-hidden="true"></i>
                        Minimum Received
                    </span>
                    <span class="detail-value" id="minimum-received">${minimumAmount.toFixed(6)} ${symbol}</span>
                `;
                detailsEl.appendChild(detailRow);
            }
        } else {
            minReceivedEl.textContent = `${minimumAmount.toFixed(6)} ${symbol}`;
        }
    }
    
    // 1inch-style Pathfinding and Route Optimization
    async findOptimalRoute(fromSymbol, toSymbol, amount) {
        console.log(`🔍 Finding optimal route for ${amount} ${fromSymbol} → ${toSymbol}`);
        
        // Simulate multiple DEX routes like 1inch
        const routes = await this.calculateAllPossibleRoutes(fromSymbol, toSymbol, amount);
        
        // Sort routes by best output amount
        routes.sort((a, b) => b.outputAmount - a.outputAmount);
        
        // Return best route with split information
        return {
            bestRoute: routes[0],
            allRoutes: routes.slice(0, 3), // Top 3 routes
            totalSavings: routes[0] ? this.calculateSavings(routes[0], routes[routes.length - 1]) : 0
        };
    }
    
    async calculateAllPossibleRoutes(fromSymbol, toSymbol, amount) {
        // Simulate multiple DEX protocols like 1inch aggregates
        const dexProtocols = [
            { name: 'LaTanda DEX', fee: 0.003, liquidity: 'High', color: '#00FFFF' },
            { name: 'Uniswap V3', fee: 0.003, liquidity: 'Very High', color: '#FF007A' },
            { name: 'SushiSwap', fee: 0.003, liquidity: 'High', color: '#0E111A' },
            { name: 'Curve', fee: 0.0004, liquidity: 'Medium', color: '#40E0D0' },
            { name: 'Balancer', fee: 0.002, liquidity: 'Medium', color: '#1E1E1E' }
        ];
        
        const routes = [];
        
        // Direct routes (single DEX)
        for (const dex of dexProtocols) {
            const directRoute = await this.calculateDirectRoute(fromSymbol, toSymbol, amount, dex);
            if (directRoute) routes.push(directRoute);
        }
        
        // Multi-hop routes (via intermediate tokens)
        const intermediateTokens = ['USDC', 'ETH', 'USDT'];
        for (const intermediate of intermediateTokens) {
            if (intermediate !== fromSymbol && intermediate !== toSymbol) {
                for (const dex1 of dexProtocols) {
                    for (const dex2 of dexProtocols) {
                        const multiHopRoute = await this.calculateMultiHopRoute(
                            fromSymbol, intermediate, toSymbol, amount, dex1, dex2
                        );
                        if (multiHopRoute) routes.push(multiHopRoute);
                    }
                }
            }
        }
        
        // Split routes (1inch specialty - splitting across multiple DEXes)
        const splitRoutes = await this.calculateSplitRoutes(fromSymbol, toSymbol, amount, dexProtocols);
        routes.push(...splitRoutes);
        
        return routes;
    }
    
    async calculateDirectRoute(fromSymbol, toSymbol, amount, dex) {
        // Simulate direct swap calculation
        const baseRate = this.getExchangeRate(fromSymbol, toSymbol);
        const liquidityMultiplier = this.getLiquidityMultiplier(dex.liquidity);
        const effectiveRate = baseRate * liquidityMultiplier * (1 - dex.fee);
        const outputAmount = amount * effectiveRate;
        
        // Calculate price impact for this specific DEX
        const priceImpact = this.calculatePriceImpactForDEX(amount, fromSymbol, dex);
        const finalOutput = outputAmount * (1 - priceImpact / 100);
        
        return {
            type: 'direct',
            dex: dex.name,
            path: [fromSymbol, toSymbol],
            inputAmount: amount,
            outputAmount: finalOutput,
            priceImpact: priceImpact,
            gasEstimate: this.estimateGasForRoute('direct', dex),
            route: `${fromSymbol} → ${toSymbol}`,
            color: dex.color,
            splits: [{ dex: dex.name, percentage: 100, color: dex.color }]
        };
    }
    
    async calculateMultiHopRoute(fromSymbol, intermediateSymbol, toSymbol, amount, dex1, dex2) {
        // First hop: fromSymbol → intermediateSymbol
        const firstHopRate = this.getExchangeRate(fromSymbol, intermediateSymbol);
        const firstHopAmount = amount * firstHopRate * (1 - dex1.fee);
        const firstHopImpact = this.calculatePriceImpactForDEX(amount, fromSymbol, dex1);
        const adjustedFirstHop = firstHopAmount * (1 - firstHopImpact / 100);
        
        // Second hop: intermediateSymbol → toSymbol
        const secondHopRate = this.getExchangeRate(intermediateSymbol, toSymbol);
        const secondHopAmount = adjustedFirstHop * secondHopRate * (1 - dex2.fee);
        const secondHopImpact = this.calculatePriceImpactForDEX(adjustedFirstHop, intermediateSymbol, dex2);
        const finalOutput = secondHopAmount * (1 - secondHopImpact / 100);
        
        const totalPriceImpact = firstHopImpact + secondHopImpact;
        
        return {
            type: 'multi-hop',
            dex: `${dex1.name} → ${dex2.name}`,
            path: [fromSymbol, intermediateSymbol, toSymbol],
            inputAmount: amount,
            outputAmount: finalOutput,
            priceImpact: totalPriceImpact,
            gasEstimate: this.estimateGasForRoute('multi-hop', [dex1, dex2]),
            route: `${fromSymbol} → ${intermediateSymbol} → ${toSymbol}`,
            color: this.blendColors(dex1.color, dex2.color),
            splits: [
                { dex: dex1.name, percentage: 50, color: dex1.color },
                { dex: dex2.name, percentage: 50, color: dex2.color }
            ]
        };
    }
    
    async calculateSplitRoutes(fromSymbol, toSymbol, amount, dexProtocols) {
        const splitRoutes = [];
        
        // Calculate optimal splitting (1inch algorithm simulation)
        const splits = [
            { percentages: [70, 30], dexes: [0, 1] },
            { percentages: [50, 50], dexes: [0, 2] },
            { percentages: [60, 25, 15], dexes: [0, 1, 2] },
            { percentages: [40, 40, 20], dexes: [1, 2, 3] }
        ];
        
        for (const split of splits) {
            let totalOutput = 0;
            let weightedPriceImpact = 0;
            let totalGas = 0;
            const routeSplits = [];
            
            for (let i = 0; i < split.percentages.length; i++) {
                const percentage = split.percentages[i];
                const dex = dexProtocols[split.dexes[i]];
                const splitAmount = amount * (percentage / 100);
                
                const route = await this.calculateDirectRoute(fromSymbol, toSymbol, splitAmount, dex);
                if (route) {
                    totalOutput += route.outputAmount;
                    weightedPriceImpact += route.priceImpact * (percentage / 100);
                    totalGas += route.gasEstimate * (percentage / 100);
                    
                    routeSplits.push({
                        dex: dex.name,
                        percentage: percentage,
                        color: dex.color,
                        amount: splitAmount,
                        output: route.outputAmount
                    });
                }
            }
            
            splitRoutes.push({
                type: 'split',
                dex: `Split across ${split.percentages.length} DEXes`,
                path: [fromSymbol, toSymbol],
                inputAmount: amount,
                outputAmount: totalOutput,
                priceImpact: weightedPriceImpact,
                gasEstimate: totalGas,
                route: `Split: ${routeSplits.map(s => `${s.percentage}% ${s.dex}`).join(' + ')}`,
                color: '#FFD700', // Gold for split routes
                splits: routeSplits
            });
        }
        
        return splitRoutes;
    }
    
    calculatePriceImpactForDEX(amount, symbol, dex) {
        // DEX-specific price impact calculation
        const baseLiquidity = {
            'LaTanda DEX': 0.8,
            'Uniswap V3': 1.0,
            'SushiSwap': 0.9,
            'Curve': 0.6,
            'Balancer': 0.7
        };
        
        const liquidityFactor = baseLiquidity[dex.name] || 0.5;
        const baseImpact = this.calculatePriceImpact(amount, symbol);
        
        return baseImpact / liquidityFactor; // Higher liquidity = lower impact
    }
    
    getLiquidityMultiplier(liquidityLevel) {
        const multipliers = {
            'Very High': 1.02,
            'High': 1.0,
            'Medium': 0.98,
            'Low': 0.95
        };
        return multipliers[liquidityLevel] || 0.95;
    }
    
    estimateGasForRoute(routeType, dexInfo) {
        // Simulate gas estimation based on route complexity
        const baseGas = {
            'direct': 150000,
            'multi-hop': 250000,
            'split': 180000
        };
        
        const gas = baseGas[routeType] || 150000;
        
        // Add complexity multiplier for multiple DEXes
        const complexityMultiplier = Array.isArray(dexInfo) ? dexInfo.length * 1.2 : 1;
        
        return Math.floor(gas * complexityMultiplier);
    }
    
    calculateSavings(bestRoute, worstRoute) {
        if (!bestRoute || !worstRoute) return 0;
        return ((bestRoute.outputAmount - worstRoute.outputAmount) / worstRoute.outputAmount) * 100;
    }
    
    blendColors(color1, color2) {
        // Simple color blending for multi-hop routes
        return '#9333EA'; // Purple blend default
    }
    
    async showRouteComparison(fromSymbol, toSymbol, amount) {
        console.log('🛣️ Showing route comparison');
        
        // Find optimal routes
        const routeData = await this.findOptimalRoute(fromSymbol, toSymbol, amount);
        
        // Create route comparison UI
        this.displayRouteComparison(routeData);
    }
    
    displayRouteComparison(routeData) {
        // Add route comparison to swap details
        let routeEl = document.getElementById('route-comparison');
        
        if (!routeEl) {
            const detailsEl = document.getElementById('swap-details');
            if (detailsEl) {
                const routeSection = document.createElement('div');
                routeSection.className = 'route-section';
                routeSection.innerHTML = `
                    <div class="detail-row route-header">
                        <span class="detail-label">
                            <i class="fas fa-route" aria-hidden="true"></i>
                            Best Route Found
                        </span>
                        <span class="detail-value route-savings" id="route-savings">
                            ${routeData.totalSavings.toFixed(2)}% better
                        </span>
                    </div>
                    <div id="route-comparison" class="route-comparison">
                        ${this.generateRouteHTML(routeData.bestRoute)}
                    </div>
                `;
                detailsEl.appendChild(routeSection);
            }
        } else {
            routeEl.innerHTML = this.generateRouteHTML(routeData.bestRoute);
            const savingsEl = document.getElementById('route-savings');
            if (savingsEl) {
                savingsEl.textContent = `${routeData.totalSavings.toFixed(2)}% better`;
            }
        }
    }
    
    generateRouteHTML(route) {
        if (!route) return '<div class="route-item">No route found</div>';
        
        const splitsHTML = route.splits.map(split => 
            `<span class="route-split" style="color: ${split.color}">${split.percentage}% ${split.dex}</span>`
        ).join(' + ');
        
        return `
            <div class="route-item ${route.type}">
                <div class="route-path">
                    <span class="route-type">${route.type.toUpperCase()}</span>
                    <span class="route-description">${route.route}</span>
                </div>
                <div class="route-details">
                    <div class="route-splits">${splitsHTML}</div>
                    <div class="route-gas">⛽ ${route.gasEstimate.toLocaleString()} gas</div>
                </div>
            </div>
        `;
    }
    
    // Professional Gas Estimation and Transaction Analysis
    async calculateComprehensiveGasEstimate(route, fromSymbol, toSymbol, amount) {
        console.log('⛽ Calculating comprehensive gas estimate');
        
        // Base gas costs by network
        const networkGasCosts = {
            'latanda-chain': {
                baseFee: 0.000001, // Very low for L2
                priorityFee: 0.000002,
                gasPrice: 0.000003, // HTN per gas unit
                htnToUsd: 0.75 // 1 HTN = $0.75
            },
            'ethereum': {
                baseFee: 0.000015,
                priorityFee: 0.000005,
                gasPrice: 0.00002,
                ethToUsd: 2650
            }
        };
        
        const network = this.getCurrentNetwork();
        const costs = networkGasCosts[network] || networkGasCosts['latanda-chain'];
        
        // Calculate gas units needed
        const gasUnits = route ? route.gasEstimate : this.estimateStandardSwapGas(fromSymbol, toSymbol);
        
        // Calculate gas costs in native token and USD
        const gasCostNative = gasUnits * costs.gasPrice;
        const gasCostUSD = gasCostNative * costs.htnToUsd;
        
        // Add congestion multiplier
        const congestionMultiplier = await this.getNetworkCongestion();
        const adjustedGasCost = gasCostUSD * congestionMultiplier;
        
        // Calculate transaction value for gas efficiency analysis
        const transactionValueUSD = amount * this.getTokenPrice(fromSymbol);
        const gasEfficiencyRatio = (adjustedGasCost / transactionValueUSD) * 100;
        
        return {
            gasUnits: gasUnits,
            gasCostNative: gasCostNative,
            gasCostUSD: adjustedGasCost,
            congestionMultiplier: congestionMultiplier,
            gasEfficiencyRatio: gasEfficiencyRatio,
            recommendation: this.getGasRecommendation(gasEfficiencyRatio),
            network: network,
            estimatedConfirmationTime: this.estimateConfirmationTime(congestionMultiplier)
        };
    }
    
    getCurrentNetwork() {
        // In production, this would check actual wallet connection
        return 'latanda-chain'; // Default to La Tanda's native chain
    }
    
    async getNetworkCongestion() {
        // Simulate real-time network congestion analysis
        const hour = new Date().getHours();
        
        // Peak hours have higher congestion
        let baseCongestion = 1.0;
        if (hour >= 9 && hour <= 11) baseCongestion = 1.3; // Morning peak
        if (hour >= 14 && hour <= 16) baseCongestion = 1.2; // Afternoon activity
        if (hour >= 19 && hour <= 21) baseCongestion = 1.4; // Evening peak
        
        // Add some randomness for realistic simulation
        const randomFactor = 0.9 + (Math.random() * 0.3); // ±15% variation
        
        return Math.round((baseCongestion * randomFactor) * 100) / 100;
    }
    
    estimateStandardSwapGas(fromSymbol, toSymbol) {
        // Base swap gas estimation
        const baseSwapGas = 120000;
        
        // Add complexity based on token types
        let complexityMultiplier = 1.0;
        
        // Native token swaps are cheaper
        if (fromSymbol === 'LTD' || toSymbol === 'LTD') {
            complexityMultiplier = 0.8;
        }
        
        // Stablecoin swaps are more efficient
        const stablecoins = ['USDC', 'USDT'];
        if (stablecoins.includes(fromSymbol) && stablecoins.includes(toSymbol)) {
            complexityMultiplier = 0.7;
        }
        
        // Cross-chain operations cost more
        if (this.isCrossChainSwap(fromSymbol, toSymbol)) {
            complexityMultiplier = 2.5;
        }
        
        return Math.floor(baseSwapGas * complexityMultiplier);
    }
    
    isCrossChainSwap(fromSymbol, toSymbol) {
        // Simulate cross-chain detection
        const nativeTokens = ['LTD'];
        const ethereumTokens = ['ETH', 'WBTC'];
        
        const fromIsNative = nativeTokens.includes(fromSymbol);
        const toIsNative = nativeTokens.includes(toSymbol);
        const fromIsEthereum = ethereumTokens.includes(fromSymbol);
        const toIsEthereum = ethereumTokens.includes(toSymbol);
        
        return (fromIsNative && toIsEthereum) || (fromIsEthereum && toIsNative);
    }
    
    getGasRecommendation(gasEfficiencyRatio) {
        if (gasEfficiencyRatio < 0.1) return { level: 'excellent', message: 'Very gas efficient trade' };
        if (gasEfficiencyRatio < 0.5) return { level: 'good', message: 'Reasonable gas cost' };
        if (gasEfficiencyRatio < 2) return { level: 'moderate', message: 'Consider larger amount' };
        if (gasEfficiencyRatio < 5) return { level: 'expensive', message: 'High gas relative to trade' };
        return { level: 'very-expensive', message: 'Gas cost exceeds 5% of trade value' };
    }
    
    estimateConfirmationTime(congestionMultiplier) {
        // Base confirmation time in seconds
        const baseTime = 3; // La Tanda Chain is fast
        
        // Adjust for congestion
        const adjustedTime = baseTime * congestionMultiplier;
        
        if (adjustedTime < 5) return '~3-5 seconds';
        if (adjustedTime < 15) return '~10-15 seconds';
        if (adjustedTime < 30) return '~20-30 seconds';
        return '~1-2 minutes';
    }
    
    async simulateTransaction(fromSymbol, toSymbol, amount, route) {
        console.log('🔬 Simulating transaction execution');
        
        // Comprehensive pre-flight checks
        const simulation = {
            success: true,
            errors: [],
            warnings: [],
            gasEstimate: null,
            priceImpactWarning: false,
            slippageWarning: false,
            liquidityWarning: false
        };
        
        // Gas estimation
        simulation.gasEstimate = await this.calculateComprehensiveGasEstimate(route, fromSymbol, toSymbol, amount);
        
        // Price impact checks
        const priceImpact = route ? route.priceImpact : this.calculatePriceImpact(amount, fromSymbol);
        if (priceImpact > 5) {
            simulation.warnings.push(`High price impact: ${priceImpact.toFixed(2)}%`);
            simulation.priceImpactWarning = true;
        }
        
        // Slippage analysis
        const slippage = this.calculateSlippage(amount, fromSymbol);
        if (slippage > 3) {
            simulation.warnings.push(`High slippage expected: ${slippage.toFixed(2)}%`);
            simulation.slippageWarning = true;
        }
        
        // Liquidity validation
        const liquidityDepth = this.getLiquidityDepth(fromSymbol);
        if (liquidityDepth < 0.3) {
            simulation.warnings.push('Low liquidity pool - consider smaller amount');
            simulation.liquidityWarning = true;
        }
        
        // Balance checks
        const balanceCheck = await this.validateSufficientBalance(fromSymbol, amount);
        if (!balanceCheck.sufficient) {
            simulation.success = false;
            simulation.errors.push(`Insufficient ${fromSymbol} balance`);
        }
        
        // Gas balance check
        const gasBalanceCheck = await this.validateGasBalance(simulation.gasEstimate);
        if (!gasBalanceCheck.sufficient) {
            simulation.success = false;
            simulation.errors.push('Insufficient gas balance');
        }
        
        return simulation;
    }
    
    async validateSufficientBalance(symbol, amount) {
        // Simulate balance checking
        const mockBalances = {
            'LTD': 2500,
            'USDC': 1247.89,
            'ETH': 0.5847,
            'USDT': 892.34,
            'WBTC': 0.0234
        };
        
        const balance = mockBalances[symbol] || 0;
        const sufficient = balance >= amount;
        
        return {
            sufficient: sufficient,
            currentBalance: balance,
            required: amount,
            shortage: sufficient ? 0 : amount - balance
        };
    }
    
    async validateGasBalance(gasEstimate) {
        // Simulate gas balance checking
        const mockGasBalance = 0.05; // HTN balance for gas
        const required = gasEstimate.gasCostNative;
        
        return {
            sufficient: mockGasBalance >= required,
            currentBalance: mockGasBalance,
            required: required,
            shortage: mockGasBalance >= required ? 0 : required - mockGasBalance
        };
    }
    
    displayAdvancedGasInfo(gasEstimate) {
        // Add advanced gas information to swap details
        let gasInfoEl = document.getElementById('advanced-gas-info');
        
        if (!gasInfoEl) {
            const detailsEl = document.getElementById('swap-details');
            if (detailsEl) {
                const gasSection = document.createElement('div');
                gasSection.className = 'gas-section';
                gasSection.innerHTML = `
                    <div class="detail-row gas-header">
                        <span class="detail-label">
                            <i class="fas fa-gas-pump" aria-hidden="true"></i>
                            Gas Analysis
                        </span>
                        <span class="detail-value gas-total" id="gas-total">
                            $${gasEstimate.gasCostUSD.toFixed(4)}
                        </span>
                    </div>
                    <div id="advanced-gas-info" class="advanced-gas-info">
                        ${this.generateGasAnalysisHTML(gasEstimate)}
                    </div>
                `;
                detailsEl.appendChild(gasSection);
            }
        } else {
            gasInfoEl.innerHTML = this.generateGasAnalysisHTML(gasEstimate);
            const gasTotalEl = document.getElementById('gas-total');
            if (gasTotalEl) {
                gasTotalEl.textContent = `$${gasEstimate.gasCostUSD.toFixed(4)}`;
            }
        }
    }
    
    generateGasAnalysisHTML(gasEstimate) {
        const recommendation = gasEstimate.recommendation;
        
        return `
            <div class="gas-breakdown">
                <div class="gas-row">
                    <span class="gas-label">Gas Units:</span>
                    <span class="gas-value">${gasEstimate.gasUnits.toLocaleString()}</span>
                </div>
                <div class="gas-row">
                    <span class="gas-label">Network:</span>
                    <span class="gas-value">${gasEstimate.network}</span>
                </div>
                <div class="gas-row">
                    <span class="gas-label">Congestion:</span>
                    <span class="gas-value congestion-${gasEstimate.congestionMultiplier < 1.2 ? 'low' : gasEstimate.congestionMultiplier < 1.5 ? 'medium' : 'high'}">
                        ${gasEstimate.congestionMultiplier}x
                    </span>
                </div>
                <div class="gas-row">
                    <span class="gas-label">Confirmation:</span>
                    <span class="gas-value">${gasEstimate.estimatedConfirmationTime}</span>
                </div>
                <div class="gas-efficiency">
                    <span class="efficiency-label">Gas Efficiency:</span>
                    <span class="efficiency-value efficiency-${recommendation.level}">
                        ${gasEstimate.gasEfficiencyRatio.toFixed(2)}% of trade value
                    </span>
                    <div class="efficiency-message">${recommendation.message}</div>
                </div>
            </div>
        `;
    }
    
    async performTransactionAnalysis(fromSymbol, toSymbol, amount) {
        console.log('🔍 Performing comprehensive transaction analysis for:', amount, fromSymbol, '→', toSymbol);
        
        try {
            // Always show basic gas estimation, even for small amounts
            console.log('📊 Step 1: Calculating gas estimate...');
            
            // Calculate comprehensive gas estimate (simplified for small amounts)
            const gasEstimate = await this.calculateComprehensiveGasEstimate(null, fromSymbol, toSymbol, amount);
            console.log('⛽ Gas estimate calculated:', gasEstimate);
            
            // Display advanced gas information immediately
            this.displayAdvancedGasInfo(gasEstimate);
            
            // Get route data for larger amounts
            let bestRoute = null;
            if (amount >= 10) { // Lower threshold for route optimization
                console.log('🛣️  Step 2: Finding optimal route...');
                const routeData = await this.findOptimalRoute(fromSymbol, toSymbol, amount);
                bestRoute = routeData ? routeData.bestRoute : null;
                console.log('🎯 Best route found:', bestRoute);
            }
            
            // Simulate transaction for validation
            console.log('🔬 Step 3: Simulating transaction...');
            const simulation = await this.simulateTransaction(fromSymbol, toSymbol, amount, bestRoute);
            console.log('✅ Transaction simulation complete:', simulation);
            
            // Update swap button based on simulation results
            this.updateSwapButtonWithSimulation(simulation, fromSymbol, toSymbol);
            
            // Show warnings if any
            if (simulation.warnings.length > 0) {
                console.log('⚠️  Displaying warnings:', simulation.warnings);
                this.displayTransactionWarnings(simulation.warnings);
            } else {
                // Hide warnings if none
                this.displayTransactionWarnings([]);
            }
            
            console.log('✨ Transaction analysis complete!');
            
        } catch (error) {
            console.error('❌ Transaction analysis failed:', error);
            this.showNotification('Transaction analysis failed: ' + error.message, 'error');
        }
    }
    
    updateSwapButtonWithSimulation(simulation, fromSymbol, toSymbol) {
        const swapBtn = document.getElementById('swap-btn');
        const btnText = swapBtn?.querySelector('.btn-text');
        
        if (!swapBtn || !btnText) return;
        
        if (!simulation.success) {
            swapBtn.disabled = true;
            swapBtn.className = 'swap-btn error';
            btnText.textContent = simulation.errors[0] || 'Transaction Failed';
        } else if (simulation.warnings.length > 0) {
            swapBtn.disabled = false;
            swapBtn.className = 'swap-btn warning';
            btnText.textContent = `Swap ${fromSymbol} for ${toSymbol} ⚠️`;
        } else {
            swapBtn.disabled = false;
            swapBtn.className = 'swap-btn';
            btnText.textContent = `Swap ${fromSymbol} for ${toSymbol} ✓`;
        }
    }
    
    displayTransactionWarnings(warnings) {
        let warningEl = document.getElementById('transaction-warnings');
        
        if (!warningEl && warnings.length > 0) {
            const detailsEl = document.getElementById('swap-details');
            if (detailsEl) {
                const warningSection = document.createElement('div');
                warningSection.className = 'warning-section';
                warningSection.innerHTML = `
                    <div class="detail-row warning-header">
                        <span class="detail-label">
                            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                            Transaction Warnings
                        </span>
                    </div>
                    <div id="transaction-warnings" class="transaction-warnings">
                        ${warnings.map(warning => `<div class="warning-item">${warning}</div>`).join('')}
                    </div>
                `;
                detailsEl.appendChild(warningSection);
            }
        } else if (warningEl) {
            if (warnings.length > 0) {
                warningEl.innerHTML = warnings.map(warning => `<div class="warning-item">${warning}</div>`).join('');
                warningEl.parentElement.style.display = 'block';
            } else {
                warningEl.parentElement.style.display = 'none';
            }
        }
    }
    
    // Enhanced executeSwap with professional transaction handling
    async executeSwapWithAnalysis() {
        console.log('💹 Executing swap with comprehensive analysis');
        
        const fromAmount = parseFloat(document.getElementById('from-amount')?.value || '0');
        const fromSymbol = document.querySelector('.token-selector .token-symbol')?.textContent || 'LTD';
        const toSymbol = document.querySelectorAll('.token-selector .token-symbol')[1]?.textContent || 'USDC';
        
        if (fromAmount <= 0) {
            this.showNotification('Invalid amount', 'error');
            return;
        }
        
        const swapBtn = document.getElementById('swap-btn');
        const btnText = swapBtn?.querySelector('.btn-text');
        const btnLoading = swapBtn?.querySelector('.btn-loading');
        
        if (!swapBtn || !btnText || !btnLoading) return;
        
        try {
            // Show loading state
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            swapBtn.disabled = true;
            
            // Pre-transaction validation
            const routeData = await this.findOptimalRoute(fromSymbol, toSymbol, fromAmount);
            const simulation = await this.simulateTransaction(fromSymbol, toSymbol, fromAmount, routeData.bestRoute);
            
            if (!simulation.success) {
                throw new Error(simulation.errors[0] || 'Transaction validation failed');
            }
            
            // Show transaction details
            this.showTransactionSummary(simulation, fromAmount, fromSymbol, toSymbol);
            
            // Simulate blockchain transaction
            await this.simulateBlockchainTransaction(simulation);
            
            // Success handling
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            swapBtn.disabled = false;
            
            this.showNotification(`Swap completed! Gas used: $${simulation.gasEstimate.gasCostUSD.toFixed(4)}`, 'success');
            
            // Reset form and update balances
            this.resetSwapForm();
            this.updateBalancesAfterSwap();
            
        } catch (error) {
            console.error('Swap execution failed:', error);
            
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            swapBtn.disabled = false;
            
            this.showNotification(`Swap failed: ${error.message}`, 'error');
        }
    }
    
    showTransactionSummary(simulation, amount, fromSymbol, toSymbol) {
        const summary = `
            Transaction Summary:
            • Amount: ${amount} ${fromSymbol} → ${toSymbol}
            • Gas Cost: $${simulation.gasEstimate.gasCostUSD.toFixed(4)}
            • Network: ${simulation.gasEstimate.network}
            • Confirmation: ${simulation.gasEstimate.estimatedConfirmationTime}
            ${simulation.warnings.length > 0 ? '\n⚠️ Warnings: ' + simulation.warnings.length : ''}
        `;
        
        console.log(summary);
    }
    
    async simulateBlockchainTransaction(simulation) {
        // Simulate actual blockchain interaction
        const steps = [
            'Preparing transaction...',
            'Estimating gas...',
            'Broadcasting to network...',
            'Waiting for confirmation...',
            'Transaction confirmed!'
        ];
        
        for (let i = 0; i < steps.length; i++) {
            console.log(`📡 ${steps[i]}`);
            await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
        }
        
        return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    }
    
    getImpactClass(impact) {
        // SushiSwap-style impact classification
        if (impact < 0.01) return 'impact-minimal';
        if (impact < 0.1) return 'impact-low';
        if (impact < 1) return 'impact-medium';
        if (impact < 3) return 'impact-high';
        if (impact < 5) return 'impact-warning';
        return 'impact-critical';
    }
    
    setMaxAmount(direction) {
        if (direction === 'from') {
            const balanceEl = document.getElementById('from-balance');
            if (balanceEl) {
                const balance = balanceEl.textContent.split(' ')[0].replace(',', '');
                const fromAmountEl = document.getElementById('from-amount');
                if (fromAmountEl) {
                    fromAmountEl.value = balance;
                    this.calculateSwap();
                }
            }
        }
    }
    
    reverseSwap() {
        console.log('🔄 Reversing swap direction');
        
        // Simple implementation - in production would swap token selectors
        this.showNotification('Swap direction reversed', 'info');
        
        // Clear amounts to prevent confusion
        const fromAmountEl = document.getElementById('from-amount');
        const toAmountEl = document.getElementById('to-amount');
        
        if (fromAmountEl) fromAmountEl.value = '';
        if (toAmountEl) toAmountEl.value = '';
        
        this.calculateSwap();
    }
    
    executeSwap() {
        // Use the enhanced swap execution with comprehensive analysis
        this.executeSwapWithAnalysis();
    }
    
    resetSwapForm() {
        const fromAmountEl = document.getElementById('from-amount');
        const toAmountEl = document.getElementById('to-amount');
        const detailsEl = document.getElementById('swap-details');
        const swapBtn = document.getElementById('swap-btn');
        
        if (fromAmountEl) fromAmountEl.value = '';
        if (toAmountEl) toAmountEl.value = '';
        if (detailsEl) detailsEl.style.display = 'none';
        
        if (swapBtn) {
            const btnText = swapBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Enter amount';
            swapBtn.disabled = true;
        }
    }
    
    updateBalancesAfterSwap() {
        // Simulate balance updates
        const portfolioValueEl = document.querySelector('.kpi-value');
        if (portfolioValueEl && portfolioValueEl.textContent.includes('$')) {
            const currentValue = parseFloat(portfolioValueEl.textContent.replace('$', '').replace(',', ''));
            const newValue = currentValue + (Math.random() - 0.5) * 100;
            portfolioValueEl.textContent = `$${newValue.toFixed(2)}`;
            this.addUpdateAnimation(portfolioValueEl);
        }
    }
    
    // Real-time update animations
    addUpdateAnimation(element) {
        if (element) {
            element.classList.add('updating');
            setTimeout(() => {
                element.classList.remove('updating');
            }, 1000);
        }
    }
    
    // Enhanced portfolio value updates with animation
    updatePortfolioValues() {
        // Update portfolio values based on price changes
        const ltdBalance = 2500;
        const currentPrice = parseFloat(document.querySelector('.current-price')?.textContent?.replace('$', '') || '0.75');
        const newValue = ltdBalance * currentPrice;
        
        // Update KPI values with animation
        const portfolioValueEl = document.querySelector('.kpi-stat .kpi-value');
        if (portfolioValueEl && portfolioValueEl.textContent.includes('$')) {
            const newPortfolioValue = (newValue + 1372.89).toFixed(2);
            portfolioValueEl.textContent = `$${newPortfolioValue}`;
            this.addUpdateAnimation(portfolioValueEl);
        }
        
        // Update asset values in portfolio module
        const ltdAssetValue = document.querySelector('.asset-item .value-usd');
        if (ltdAssetValue) {
            ltdAssetValue.textContent = `$${(ltdBalance * currentPrice).toFixed(2)}`;
            this.addUpdateAnimation(ltdAssetValue);
        }
    }
    
    // Enhanced trading price updates with animation
    updateTradingPrices() {
        // Update LTD price with realistic fluctuation
        const currentPriceEl = document.querySelector('.current-price');
        const changeEl = document.querySelector('.price-change');
        
        if (currentPriceEl) {
            const currentPrice = parseFloat(currentPriceEl.textContent?.replace('$', '') || '0.75');
            const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
            const newPrice = Math.max(0.01, currentPrice + fluctuation);
            const priceChange = newPrice - 0.75;
            const percentChange = ((priceChange / 0.75) * 100);
            
            // Update price display with animation
            currentPriceEl.textContent = `$${newPrice.toFixed(4)}`;
            this.addUpdateAnimation(currentPriceEl);
            
            if (changeEl) {
                changeEl.textContent = `${priceChange >= 0 ? '+' : ''}$${Math.abs(priceChange).toFixed(4)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)`;
                changeEl.className = `price-change ${priceChange >= 0 ? 'positive' : 'negative'}`;
                this.addUpdateAnimation(changeEl);
            }
            
            // Update trading pair price in header
            const pairPriceEl = document.querySelector('.pair-price');
            if (pairPriceEl) {
                pairPriceEl.textContent = `$${newPrice.toFixed(4)}`;
            }
        }
    }
    
    initializeRealTimeAnimations() {
        console.log('✨ Initializing real-time data animations');
        
        // Add staggered entrance animations to modules
        const modules = document.querySelectorAll('.module-card');
        modules.forEach((module, index) => {
            module.style.animationDelay = `${index * 0.1}s`;
        });
        
        // Add entrance animations to KPI stats
        const kpiStats = document.querySelectorAll('.kpi-stat');
        kpiStats.forEach((stat, index) => {
            stat.style.animationDelay = `${index * 0.1}s`;
        });
        
        // Initialize hover effects for interactive elements
        this.initializeHoverEffects();
    }
    
    initializeHoverEffects() {
        // Enhanced hover effects for asset items
        const assetItems = document.querySelectorAll('.asset-item');
        assetItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.boxShadow = '0 8px 25px rgba(0, 255, 255, 0.1)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.boxShadow = '';
            });
        });
        
        // Enhanced hover effects for pool items
        const poolItems = document.querySelectorAll('.pool-item');
        poolItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.boxShadow = '0 8px 25px rgba(0, 255, 255, 0.1)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.boxShadow = '';
            });
        });
        
        // Enhanced hover effects for NFT items
        const nftItems = document.querySelectorAll('.nft-item');
        nftItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const rarity = item.classList.contains('legendary') ? 'gold' : 
                             item.classList.contains('epic') ? 'purple' : 'blue';
                const colors = {
                    gold: 'rgba(255, 215, 0, 0.2)',
                    purple: 'rgba(139, 92, 246, 0.2)',
                    blue: 'rgba(59, 130, 246, 0.2)'
                };
                item.style.boxShadow = `0 12px 30px ${colors[rarity]}`;
            });
            item.addEventListener('mouseleave', () => {
                item.style.boxShadow = '';
            });
        });
    }
    
    async init() {
        try {
            console.log('🔥 DEBUGGING: Init method starting...');
            
            // Immediate visible debug
            document.body.style.border = '3px solid #00FFFF';
            console.log('🔧 DEBUG: JavaScript is executing! Border added to body.');
            
            // Initialize exchange ticker animation
            this.initializeMarketTicker();
            
            // Initialize exchange interface
            this.initializeExchangeInterface();
            
            console.log('🚀 La Tanda DEX Exchange initialized with cutting-edge Web3 technology');
            
            // Initialize real-time data animations
            this.initializeRealTimeAnimations();
            
            // Initialize accessibility features
            this.initializeAccessibility();
            
            // Initialize professional swap interface
            this.initializeSwapInterface();
            
            this.showNotification('Welcome to La Tanda DEX - Professional Web3 Exchange', 'success');
            
            // Check authentication first
            const authStatus = this.checkAuthentication();
            if (!authStatus.authenticated) {
                this.initializeLimitedMode(authStatus.reason);
                return;
            }
            
            console.log('✅ User authenticated, initializing full dashboard for:', authStatus.user.email);
            this.currentUser = authStatus.user;
            this.authToken = authStatus.token;
            
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

    toggleAccordion(accordionId) {
        const content = document.getElementById(`${accordionId}-content`);
        const header = content.previousElementSibling;
        const icon = header.querySelector('.accordion-icon');
        
        if (content.classList.contains('show')) {
            content.classList.remove('show');
            header.classList.remove('active');
            setTimeout(() => {
                content.style.display = 'none';
            }, 300);
        } else {
            content.style.display = 'block';
            setTimeout(() => {
                content.classList.add('show');
                header.classList.add('active');
            }, 10);
        }
    }

    checkAuthentication() {
        // Check both possible token keys for compatibility
        const token = localStorage.getItem('auth_token') || localStorage.getItem('latanda_auth_token');
        const user = localStorage.getItem('latanda_user');
        
        console.log('🔍 Dashboard auth check - Token:', token ? 'exists' : 'none');
        
        // DEVELOPMENT MODE: Auto-create demo auth if none exists
        if (!token && window.location.hostname === 'localhost') {
            console.log('🔧 Development mode: Creating demo authentication');
            this.createDemoAuthentication();
            return this.checkAuthentication(); // Recursive call with demo auth
        }
        
        if (!token) {
            return { authenticated: false, reason: 'no_token' };
        }
        
        try {
            // Validate token format (JWT)
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error('Invalid token format: not JWT');
                return { authenticated: false, reason: 'invalid_token' };
            }
            
            const payload = JSON.parse(atob(parts[1]));
            const now = Date.now() / 1000;
            
            console.log('🔍 Token payload:', payload);
            
            if (payload.exp && payload.exp < now) {
                console.warn('Token expired');
                return { authenticated: false, reason: 'expired_token' };
            }
            
            // Extract user info from token payload if user not stored separately
            const userData = user ? JSON.parse(user) : {
                id: payload.user_id,
                email: payload.email,
                role: payload.role,
                permissions: payload.permissions
            };
            
            console.log('✅ Authentication successful:', userData);
            return { authenticated: true, user: userData, token };
        } catch (error) {
            console.error('Invalid token format:', error);
            return { authenticated: false, reason: 'invalid_token' };
        }
    }

    createDemoAuthentication() {
        console.log('🎭 Creating demo authentication for development');
        
        // Create a demo JWT token (in production, this would come from the server)
        const now = Math.floor(Date.now() / 1000);
        const demoPayload = {
            user_id: 'demo_user_001',
            email: 'demo@latanda.dev',
            role: 'user',
            permissions: ['trade', 'stake', 'vote', 'nft'],
            iat: now,
            exp: now + (24 * 60 * 60) // 24 hours
        };
        
        // Create a simple base64 encoded "JWT" for demo purposes
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify(demoPayload));
        const signature = btoa('demo_signature_for_development_only');
        const demoToken = `${header}.${payload}.${signature}`;
        
        // Create demo user data
        const demoUser = {
            id: 'demo_user_001',
            email: 'demo@latanda.dev',
            name: 'Demo User',
            role: 'user',
            wallet: '0x742d35...8b2f',
            joinDate: new Date().toISOString(),
            verified: true
        };
        
        // Store in localStorage
        localStorage.setItem('latanda_auth_token', demoToken);
        localStorage.setItem('latanda_user', JSON.stringify(demoUser));
        
        console.log('✅ Demo authentication created successfully');
    }

    enableDemoMode() {
        console.log('🎭 Enabling demo mode for full dashboard access');
        
        // Remove the auth warning
        const authWarning = document.querySelector('.auth-warning-banner');
        if (authWarning) {
            authWarning.style.animation = 'slideUp 0.3s ease-in forwards';
            setTimeout(() => authWarning.remove(), 300);
        }
        
        // Create demo authentication
        this.createDemoAuthentication();
        
        // Show success notification
        this.showNotification('✅ Full access enabled! Welcome to La Tanda Web3 Dashboard', 'success');
        
        // Reload the page to initialize with authentication
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    initializeLimitedMode(reason) {
        console.warn('🔒 Initializing dashboard in limited mode:', reason);
        
        // Show authentication warning
        this.showAuthWarning(reason);
        
        // Disable interactive features
        this.disableInteractiveFeatures();
        
        // Still show basic UI for demonstration
        this.initializeChart();
        this.initializeParticles();
        
        console.log('📊 Dashboard running in view-only mode');
    }

    showAuthWarning(reason) {
        let message = '';
        let action = '';
        
        switch(reason) {
            case 'no_token':
                message = 'You are not logged in. Please authenticate to access full features.';
                action = 'Go to Login';
                // Add login redirect functionality
                setTimeout(() => {
                    if (confirm('You need to login first. Redirect to login page?')) {
                        window.location.href = '/auth-enhanced.html';
                    }
                }, 2000);
                break;
            case 'expired_token':
                message = 'Your session has expired. Please log in again.';
                action = 'Session Expired';
                break;
            case 'invalid_token':
                message = 'Authentication error. Please log in again.';
                action = 'Auth Error';
                break;
        }
        
        // Create auth warning banner
        const authWarning = document.createElement('div');
        authWarning.className = 'auth-warning-banner';
        authWarning.innerHTML = `
            <div class="auth-warning-content">
                <div class="auth-warning-icon">🔒</div>
                <div class="auth-warning-text">
                    <strong>Dashboard Access</strong>
                    <p>You're viewing in preview mode. Enable full access to use all features.</p>
                </div>
                <div class="auth-warning-actions">
                    <button class="auth-warning-btn primary" onclick="dashboard.enableDemoMode()">
                        🚀 Enable Full Access
                    </button>
                    <button class="auth-warning-btn secondary" onclick="window.location.href='auth-enhanced.html'">
                        Login with Account
                    </button>
                </div>
            </div>
        `;
        
        // Add warning styles
        const style = document.createElement('style');
        style.textContent = `
            .auth-warning-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10000;
                background: linear-gradient(135deg, #0f172a, #1e293b, #334155);
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border-bottom: 1px solid rgba(0, 255, 255, 0.3);
                animation: slideDown 0.3s ease-out;
            }
            .auth-warning-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                max-width: 1000px;
                margin: 0 auto;
                gap: 20px;
                color: white;
            }
            .auth-warning-icon { font-size: 1.5rem; }
            .auth-warning-text p { margin: 0; opacity: 0.9; }
            .auth-warning-actions {
                display: flex;
                gap: 12px;
                align-items: center;
            }
            .auth-warning-btn {
                border: none;
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
                font-weight: 600;
            }
            .auth-warning-btn.primary {
                background: linear-gradient(135deg, #00FFFF, #7F00FF);
                box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
            }
            .auth-warning-btn.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 255, 255, 0.4);
            }
            .auth-warning-btn.secondary {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
            }
            .auth-warning-btn.secondary:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-1px);
            }
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
            @keyframes slideUp {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(-100%); opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.insertBefore(authWarning, document.body.firstChild);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (authWarning.parentNode) {
                authWarning.style.animation = 'slideUp 0.3s ease-in forwards';
                setTimeout(() => authWarning.remove(), 300);
            }
        }, 10000);
    }

    disableInteractiveFeatures() {
        // Disable trading actions
        const tradingButtons = document.querySelectorAll('.trading-section button, .staking-section button, .nft-section button');
        tradingButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Login required for this action';
        });
        
        // Disable wallet actions
        const walletButtons = document.querySelectorAll('.wallet-actions button');
        walletButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Authentication required';
        });
        
        // Show demo data overlay on sensitive sections
        this.addDemoOverlays();
    }

    addDemoOverlays() {
        const sensitiveSelectors = ['.portfolio-stats', '.staking-pools', '.nft-gallery'];
        
        sensitiveSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                const overlay = document.createElement('div');
                overlay.className = 'demo-overlay';
                overlay.innerHTML = `
                    <div class="demo-overlay-content">
                        <div class="demo-icon">👁️</div>
                        <div>Preview Mode</div>
                        <small>Login to access real data</small>
                    </div>
                `;
                
                element.style.position = 'relative';
                element.appendChild(overlay);
            }
        });
        
        // Add overlay styles
        const style = document.createElement('style');
        style.textContent = `
            .demo-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: inherit;
                z-index: 100;
            }
            .demo-overlay-content {
                text-align: center;
                color: white;
                font-weight: 500;
            }
            .demo-icon { font-size: 2rem; margin-bottom: 8px; }
            .demo-overlay small { opacity: 0.8; display: block; }
        `;
        
        if (!document.querySelector('style[data-demo-overlay]')) {
            style.setAttribute('data-demo-overlay', 'true');
            document.head.appendChild(style);
        }
    }

    /**
     * Initialize API Integration System - Fase 2: Backend Integration
     */
    async initializeAPIIntegration() {
        try {
            console.log('🔗 Initializing API Integration with Enhanced Proxy...');
            
            // Wait for Enhanced API Proxy to be available
            if (window.enhancedAPIProxy) {
                this.apiManager = window.enhancedAPIProxy;
                this.paymentManager = window.enhancedAPIProxy; // Same proxy handles payments
                
                console.log('✅ Enhanced API Proxy integration initialized successfully');
            } else {
                console.warn('⚠️ Enhanced API Proxy not available, using demo mode');
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

    /**
     * Wallet Address Functionality
     */
    async copyWalletAddress() {
        try {
            const walletElement = document.getElementById('walletAddress');
            const fullAddress = '0x742d35Cc7b4e6a2F8b2f891A42C7D8F8C9E3A5B1'; // Full demo address
            
            // Copy to clipboard
            await navigator.clipboard.writeText(fullAddress);
            
            // Show tooltip
            const tooltip = document.getElementById('copyTooltip');
            tooltip.classList.add('show');
            
            // Hide tooltip after 2 seconds
            setTimeout(() => {
                tooltip.classList.remove('show');
            }, 2000);
            
            // Show notification
            this.showNotification('Wallet address copied to clipboard', 'success');
            
            console.log('✅ Wallet address copied:', fullAddress);
            
        } catch (error) {
            console.error('❌ Failed to copy address:', error);
            this.showNotification('Failed to copy address', 'error');
        }
    }

    /**
     * Toggle Balance Visibility
     */
    toggleBalanceView() {
        const balanceAmount = document.getElementById('balanceAmount');
        const balanceUsd = document.getElementById('balanceUsd');
        const toggleIcon = document.getElementById('balanceToggle');
        
        const isHidden = balanceAmount.classList.contains('hidden');
        
        if (isHidden) {
            // Show balance
            balanceAmount.classList.remove('hidden');
            balanceUsd.classList.remove('hidden');
            toggleIcon.className = 'fas fa-eye balance-toggle-icon';
            balanceAmount.textContent = '2,500 LTD';
            balanceUsd.textContent = '≈ $1,875.75';
            
            console.log('👁️ Balance visibility: Shown');
        } else {
            // Hide balance
            balanceAmount.classList.add('hidden');
            balanceUsd.classList.add('hidden');
            toggleIcon.className = 'fas fa-eye-slash balance-toggle-icon';
            balanceAmount.textContent = '';
            balanceUsd.textContent = '';
            
            console.log('🙈 Balance visibility: Hidden');
        }
    }

    /**
     * Show Wallet Management Modal
     */
    showWalletModal() {
        // Create wallet modal dynamically
        const modal = document.createElement('div');
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="wallet-modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="wallet-modal-content">
                <div class="wallet-modal-header">
                    <h3>Wallet Details</h3>
                    <button class="close-btn" onclick="this.closest('.wallet-modal').remove()">&times;</button>
                </div>
                <div class="wallet-modal-body">
                    <div class="wallet-info-section">
                        <h4>Connected Wallet</h4>
                        <div class="wallet-detail-item">
                            <span class="label">Address:</span>
                            <span class="value">0x742d35Cc7b4e6a2F8b2f891A42C7D8F8C9E3A5B1</span>
                            <button class="copy-btn" onclick="dashboard.copyWalletAddress()">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <div class="wallet-detail-item">
                            <span class="label">Network:</span>
                            <span class="value">La Tanda Mainnet</span>
                        </div>
                        <div class="wallet-detail-item">
                            <span class="label">Balance:</span>
                            <span class="value">2,500 LTD (≈ $1,875.75)</span>
                        </div>
                    </div>
                    
                    <div class="wallet-actions-section">
                        <h4>Quick Actions</h4>
                        <div class="wallet-action-grid">
                            <button class="wallet-modal-btn" onclick="dashboard.showDepositModal()">
                                <i class="fas fa-arrow-down"></i>
                                Deposit
                            </button>
                            <button class="wallet-modal-btn" onclick="dashboard.showWithdrawModal()">
                                <i class="fas fa-arrow-up"></i>
                                Withdraw
                            </button>
                            <button class="wallet-modal-btn" onclick="dashboard.showTransferModal()">
                                <i class="fas fa-exchange-alt"></i>
                                Transfer
                            </button>
                            <button class="wallet-modal-btn" onclick="dashboard.viewTransactionHistory()">
                                <i class="fas fa-history"></i>
                                History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles for the modal
        if (!document.getElementById('wallet-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'wallet-modal-styles';
            styles.textContent = `
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
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(10px);
                }
                
                .wallet-modal-content {
                    position: relative;
                    background: var(--bg-primary);
                    border-radius: 16px;
                    border: 1px solid var(--border-primary);
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .wallet-modal-header {
                    padding: 24px;
                    border-bottom: 1px solid var(--border-primary);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .wallet-modal-body {
                    padding: 24px;
                }
                
                .wallet-info-section {
                    margin-bottom: 32px;
                }
                
                .wallet-detail-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid var(--border-secondary);
                }
                
                .wallet-detail-item .label {
                    color: var(--text-secondary);
                    font-size: 14px;
                }
                
                .wallet-detail-item .value {
                    color: var(--text-primary);
                    font-family: var(--font-mono);
                    font-size: 14px;
                }
                
                .wallet-action-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                
                .wallet-modal-btn {
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid var(--border-primary);
                    border-radius: 8px;
                    color: var(--text-primary);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                
                .wallet-modal-btn:hover {
                    background: rgba(0, 255, 255, 0.1);
                    border-color: var(--accent-primary);
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(styles);
        }
        
        console.log('💼 Wallet modal opened');
    }

    /**
     * Disconnect Wallet
     */
    async disconnectWallet() {
        try {
            // Show confirmation dialog
            const confirmed = confirm('Are you sure you want to disconnect your wallet?');
            
            if (confirmed) {
                // Clear wallet data
                this.currentAccount = null;
                this.web3 = null;
                
                // Update UI to show disconnected state
                const walletConnection = document.querySelector('.wallet-connection');
                if (walletConnection) {
                    walletConnection.innerHTML = `
                        <button class="connect-wallet-btn" onclick="dashboard.connectWallet()">
                            <i class="fas fa-wallet"></i>
                            Connect Wallet
                        </button>
                    `;
                }
                
                this.showNotification('Wallet disconnected successfully', 'success');
                console.log('🔌 Wallet disconnected');
                
                // Redirect to auth page or show connection prompt
                setTimeout(() => {
                    window.location.href = 'auth-enhanced.html';
                }, 2000);
            }
            
        } catch (error) {
            console.error('❌ Failed to disconnect wallet:', error);
            this.showNotification('Failed to disconnect wallet', 'error');
        }
    }

    /**
     * Connect Wallet (for reconnection)
     */
    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.currentAccount = accounts[0];
                
                // Update UI
                location.reload();
                
                this.showNotification('Wallet connected successfully', 'success');
                console.log('✅ Wallet connected:', this.currentAccount);
                
            } else {
                this.showNotification('Please install MetaMask or another Web3 wallet', 'error');
            }
        } catch (error) {
            console.error('❌ Failed to connect wallet:', error);
            this.showNotification('Failed to connect wallet', 'error');
        }
    }

    /**
     * Placeholder methods for wallet actions
     */
    showDepositModal() {
        this.showNotification('Deposit feature coming soon', 'info');
    }

    showWithdrawModal() {
        this.showNotification('Withdraw feature coming soon', 'info');
    }

    showTransferModal() {
        this.showNotification('Transfer feature coming soon', 'info');
    }

    viewTransactionHistory() {
        this.showNotification('Transaction history coming soon', 'info');
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