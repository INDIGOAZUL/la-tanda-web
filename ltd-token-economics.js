/**
 * La Tanda - LTD Token Economics System
 * Sistema completo de tokenomía con distribución, staking, burn y gobernanza
 * Versión: 2.0.0
 */

class LTDTokenEconomics {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = this.getCurrentUser();
        
        // Token configuration
        this.tokenConfig = {
            name: 'La Tanda Token',
            symbol: 'LTD',
            decimals: 18,
            totalSupply: 10000000,
            contractAddress: '0x...' // Placeholder
        };
        
        // Distribution rates
        this.distributionRates = {
            participation: 0.60,    // 60% for participation rewards
            staking: 0.25,         // 25% for staking and governance  
            development: 0.10,     // 10% for development and marketing
            liquidity: 0.05        // 5% for liquidity reserve
        };
        
        // Burn mechanisms
        this.burnRates = {
            transactions: 0.02,    // 2% on tanda transactions
            commissions: 0.01,     // 1% on commissions
            penalties: 0.05        // 5% on penalties
        };
        
        // Staking APY rates
        this.stakingAPY = {
            30: 0.08,    // 8% for 30 days
            90: 0.12,    // 12% for 90 days
            180: 0.18,   // 18% for 180 days  
            365: 0.25    // 25% for 365 days
        };
        
        // User token state
        this.userTokens = {
            balance: 8347,
            staked: 3500,
            locked: 1000,
            totalEarned: 0,
            totalBurned: 1250
        };
        
        // Token market data
        this.marketData = {
            price: 0.0847,
            marketCap: 639000,
            volume24h: 84000,
            priceChange24h: 12.4,
            totalSupply: 10000000,
            circulating: 7543210,
            burned: 2456790,
            staked: 1234567
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.setupEventListeners();
            await this.loadTokenData();
            this.updateAllDisplays();
            this.setupStakingCalculator();
            this.setupBurnForm();
            
            console.log('🪙 LTD Token Economics initialized');
        } catch (error) {
            console.error('❌ Error initializing token system:', error);
            this.showNotification('Error inicializando el sistema de tokens', 'error');
        }
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Staking form
        const stakingForm = document.getElementById('stakingForm');
        if (stakingForm) {
            stakingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleStaking();
            });
        }
        
        // Burn form
        const burnForm = document.getElementById('burnForm');
        if (burnForm) {
            burnForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBurn();
            });
        }
        
        // Staking calculator inputs
        const stakeAmountInput = document.getElementById('stakeAmount');
        const stakePeriodSelect = document.getElementById('stakePeriod');
        
        if (stakeAmountInput && stakePeriodSelect) {
            stakeAmountInput.addEventListener('input', () => this.calculateStakingRewards());
            stakePeriodSelect.addEventListener('change', () => this.calculateStakingRewards());
        }
        
        // Burn confirmation checkbox
        const burnConfirmation = document.getElementById('burnConfirmation');
        const burnSubmitBtn = burnForm?.querySelector('button[type="submit"]');
        
        if (burnConfirmation && burnSubmitBtn) {
            burnConfirmation.addEventListener('change', (e) => {
                burnSubmitBtn.disabled = !e.target.checked;
            });
        }
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        // Load section-specific data
        this.loadSectionData(tabName);
    }
    
    async loadSectionData(section) {
        switch (section) {
            case 'overview':
                this.updateTokenStats();
                break;
            case 'wallet':
                this.updateWalletDisplay();
                break;
            case 'earn':
                this.loadEarningOpportunities();
                break;
            case 'stake':
                this.updateStakingDisplay();
                break;
            case 'burn':
                this.updateBurnDisplay();
                break;
            case 'governance':
                this.loadGovernanceData();
                break;
        }
    }
    
    async loadTokenData() {
        try {
            // En un entorno real, esto vendría de la blockchain y API
            // Simulamos la carga de datos
            await this.delay(500);
            
            // Update market data (simulated)
            this.marketData.price = 0.0847 + (Math.random() - 0.5) * 0.01;
            this.marketData.priceChange24h = 12.4 + (Math.random() - 0.5) * 5;
            
            console.log('Token data loaded successfully');
        } catch (error) {
            console.error('Error loading token data:', error);
        }
    }
    
    updateAllDisplays() {
        this.updateTokenStats();
        this.updateWalletDisplay();
        this.updateStakingDisplay();
        this.updateBurnDisplay();
    }
    
    updateTokenStats() {
        // Update main token statistics
        document.getElementById('totalSupply').textContent = this.marketData.totalSupply.toLocaleString();
        document.getElementById('circulating').textContent = this.marketData.circulating.toLocaleString();
        document.getElementById('burned').textContent = this.marketData.burned.toLocaleString();
        document.getElementById('staked').textContent = this.marketData.staked.toLocaleString();
    }
    
    updateWalletDisplay() {
        const totalBalance = this.userTokens.balance + this.userTokens.staked + this.userTokens.locked;
        const balanceUSD = totalBalance * this.marketData.price;
        
        document.getElementById('userBalance').textContent = totalBalance.toLocaleString();
        document.getElementById('balanceUSD').textContent = `≈ $${balanceUSD.toFixed(2)} USD`;
    }
    
    setupStakingCalculator() {
        this.calculateStakingRewards();
    }
    
    calculateStakingRewards() {
        const stakeAmount = parseFloat(document.getElementById('stakeAmount')?.value) || 0;
        const stakePeriod = parseInt(document.getElementById('stakePeriod')?.value) || 30;
        
        const apy = this.stakingAPY[stakePeriod] || 0.08;
        const rewardAmount = (stakeAmount * apy * stakePeriod) / 365;
        const totalAfterStaking = stakeAmount + rewardAmount;
        
        if (document.getElementById('estimatedReward')) {
            document.getElementById('estimatedReward').textContent = `${rewardAmount.toFixed(0)} LTD`;
        }
        
        if (document.getElementById('totalAfterStaking')) {
            document.getElementById('totalAfterStaking').textContent = `${totalAfterStaking.toFixed(0)} LTD`;
        }
    }
    
    async handleStaking() {
        try {
            const stakeAmount = parseFloat(document.getElementById('stakeAmount').value);
            const stakePeriod = parseInt(document.getElementById('stakePeriod').value);
            
            if (!stakeAmount || stakeAmount < 100) {
                this.showNotification('Cantidad mínima de staking: 100 LTD', 'error');
                return;
            }
            
            if (stakeAmount > this.userTokens.balance) {
                this.showNotification('Balance insuficiente', 'error');
                return;
            }
            
            // Simulate staking transaction
            this.showNotification('Procesando transacción de staking...', 'info');
            await this.delay(2000);
            
            // Update user balances
            this.userTokens.balance -= stakeAmount;
            this.userTokens.staked += stakeAmount;
            
            // Create staking position
            const stakingPosition = {
                id: 'stake_' + Date.now(),
                amount: stakeAmount,
                period: stakePeriod,
                apy: this.stakingAPY[stakePeriod],
                startDate: new Date(),
                endDate: new Date(Date.now() + stakePeriod * 24 * 60 * 60 * 1000),
                status: 'active'
            };
            
            this.updateWalletDisplay();
            this.updateStakingDisplay();
            
            document.getElementById('stakingForm').reset();
            this.calculateStakingRewards();
            
            this.showNotification(`¡Staking iniciado! ${stakeAmount} LTD por ${stakePeriod} días`, 'success');
            
        } catch (error) {
            console.error('Error in staking:', error);
            this.showNotification('Error al procesar el staking', 'error');
        }
    }
    
    updateStakingDisplay() {
        // Update staking positions display
        // This would show real staking positions in a real implementation
        console.log('Staking display updated');
    }
    
    setupBurnForm() {
        const burnAmountInput = document.getElementById('burnAmount');
        const burnConfirmation = document.getElementById('burnConfirmation');
        
        if (burnAmountInput) {
            burnAmountInput.addEventListener('input', () => {
                const amount = parseFloat(burnAmountInput.value) || 0;
                const submitBtn = document.querySelector('#burnForm button[type="submit"]');
                
                if (submitBtn) {
                    submitBtn.disabled = !burnConfirmation?.checked || amount < 10 || amount > this.userTokens.balance;
                }
            });
        }
    }
    
    async handleBurn() {
        try {
            const burnAmount = parseFloat(document.getElementById('burnAmount').value);
            
            if (!burnAmount || burnAmount < 10) {
                this.showNotification('Cantidad mínima de burn: 10 LTD', 'error');
                return;
            }
            
            if (burnAmount > this.userTokens.balance) {
                this.showNotification('Balance insuficiente', 'error');
                return;
            }
            
            // Simulate burn transaction
            this.showNotification('Procesando quema de tokens...', 'info');
            await this.delay(2000);
            
            // Update user balances
            this.userTokens.balance -= burnAmount;
            this.userTokens.totalBurned += burnAmount;
            
            // Update global burn statistics
            this.marketData.burned += burnAmount;
            this.marketData.circulating -= burnAmount;
            
            this.updateWalletDisplay();
            this.updateTokenStats();
            this.updateBurnDisplay();
            
            document.getElementById('burnForm').reset();
            document.getElementById('burnConfirmation').checked = false;
            
            this.showNotification(`¡${burnAmount} LTD quemados exitosamente!`, 'success');
            
        } catch (error) {
            console.error('Error in burn:', error);
            this.showNotification('Error al quemar tokens', 'error');
        }
    }
    
    updateBurnDisplay() {
        // Update burn-related displays
        console.log('Burn display updated');
    }
    
    loadEarningOpportunities() {
        // Load and display earning opportunities
        console.log('Loading earning opportunities...');
    }
    
    loadGovernanceData() {
        // Load governance proposals and voting data
        console.log('Loading governance data...');
    }
    
    // Token utility methods
    async mintTokens(userId, amount, reason) {
        try {
            // Simulate minting transaction
            const mintTransaction = {
                id: 'mint_' + Date.now(),
                userId: userId,
                amount: amount,
                reason: reason,
                timestamp: new Date().toISOString(),
                txHash: '0x' + Math.random().toString(16).substr(2, 64)
            };
            
            console.log('Tokens minted:', mintTransaction);
            return mintTransaction;
        } catch (error) {
            console.error('Error minting tokens:', error);
            throw error;
        }
    }
    
    async burnTokens(userId, amount, reason) {
        try {
            // Simulate burn transaction
            const burnTransaction = {
                id: 'burn_' + Date.now(),
                userId: userId,
                amount: amount,
                reason: reason,
                timestamp: new Date().toISOString(),
                txHash: '0x' + Math.random().toString(16).substr(2, 64)
            };
            
            // Update global supply
            this.marketData.totalSupply -= amount;
            this.marketData.burned += amount;
            
            console.log('Tokens burned:', burnTransaction);
            return burnTransaction;
        } catch (error) {
            console.error('Error burning tokens:', error);
            throw error;
        }
    }
    
    async distributeRewards(participants, totalReward) {
        try {
            const rewardPerParticipant = totalReward / participants.length;
            const distributions = [];
            
            for (const participant of participants) {
                const distribution = await this.mintTokens(
                    participant.id, 
                    rewardPerParticipant, 
                    'participation_reward'
                );
                distributions.push(distribution);
            }
            
            return distributions;
        } catch (error) {
            console.error('Error distributing rewards:', error);
            throw error;
        }
    }
    
    async calculateTokenPrice() {
        try {
            // Simplified price calculation based on supply and demand
            const supplyFactor = this.marketData.totalSupply / 10000000; // Original supply
            const demandFactor = this.marketData.staked / this.marketData.circulating;
            const burnFactor = this.marketData.burned / 10000000;
            
            const basePrice = 0.05;
            const calculatedPrice = basePrice * (1 + burnFactor) * (1 + demandFactor) / supplyFactor;
            
            return Math.max(calculatedPrice, 0.01); // Minimum price floor
        } catch (error) {
            console.error('Error calculating token price:', error);
            return this.marketData.price;
        }
    }
    
    // Governance methods
    async submitProposal(title, description, options) {
        try {
            const proposal = {
                id: 'prop_' + Date.now(),
                title: title,
                description: description,
                options: options,
                submitter: this.currentUser.id,
                timestamp: new Date().toISOString(),
                votingEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                votes: {},
                status: 'active'
            };
            
            console.log('Proposal submitted:', proposal);
            return proposal;
        } catch (error) {
            console.error('Error submitting proposal:', error);
            throw error;
        }
    }
    
    async vote(proposalId, option) {
        try {
            const votingPower = this.calculateVotingPower();
            
            const vote = {
                proposalId: proposalId,
                userId: this.currentUser.id,
                option: option,
                power: votingPower,
                timestamp: new Date().toISOString()
            };
            
            // Simulate vote transaction
            await this.delay(1000);
            
            this.showNotification(`Voto registrado: ${option}`, 'success');
            
            // Award governance participation reward
            await this.mintTokens(this.currentUser.id, 25, 'governance_participation');
            
            return vote;
        } catch (error) {
            console.error('Error voting:', error);
            throw error;
        }
    }
    
    calculateVotingPower() {
        const baseVotingPower = this.userTokens.balance + this.userTokens.staked;
        const stakingMultiplier = 1.5; // 1.5x multiplier for staked tokens
        
        return Math.floor(baseVotingPower * stakingMultiplier);
    }
    
    // Utility methods
    getCurrentUser() {
        const authData = localStorage.getItem('laTandaWeb3Auth') || sessionStorage.getItem('laTandaWeb3Auth');
        if (authData) {
            return JSON.parse(authData).user;
        }
        return {
            id: 'demo_user_001',
            name: 'Usuario Demo',
            email: 'demo@latanda.online'
        };
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#10B981'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
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
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    formatTokenAmount(amount) {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(amount);
    }
}

// Global functions for UI interactions
function showSendModal() {
    window.tokenSystem?.showNotification('Modal de envío en desarrollo', 'info');
}

function showReceiveModal() {
    window.tokenSystem?.showNotification('Modal de recepción en desarrollo', 'info');
}

function vote(proposalId, option) {
    if (window.tokenSystem) {
        window.tokenSystem.vote(proposalId, option);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tokenSystem = new LTDTokenEconomics();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LTDTokenEconomics;
}