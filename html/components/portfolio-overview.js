/**
 * 💰 PORTFOLIO OVERVIEW COMPONENT
 * Real-time balance display with yield information
 * Based on competitive analysis from DeFi platforms
 */

class PortfolioOverview {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = {
            totalBalance: 0,
            usdtBalance: 0,
            ltdBalance: 0,
            pesoEquivalent: 0,
            yieldEarned: 0,
            apy: 0,
            change24h: 0
        };
        
        this.isLoading = true;
        this.render();
        this.startDataUpdates();
    }

    /**
     * 🎨 RENDER PORTFOLIO COMPONENT
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="portfolio-overview">
                <div class="portfolio-header">
                    <div class="portfolio-title">
                        <h2>💰 Mi Portfolio</h2>
                        <div class="last-updated">
                            <span class="update-indicator ${this.isLoading ? 'loading' : 'updated'}"></span>
                            <span class="update-text">${this.isLoading ? 'Actualizando...' : 'Actualizado'}</span>
                        </div>
                    </div>
                </div>

                <div class="portfolio-cards">
                    <!-- Main Balance Card -->
                    <div class="balance-card main-balance">
                        <div class="balance-header">
                            <span class="balance-label">Balance Total</span>
                            <div class="change-indicator ${this.data.change24h >= 0 ? 'positive' : 'negative'}">
                                <span class="change-icon">${this.data.change24h >= 0 ? '↗' : '↘'}</span>
                                <span class="change-value">${Math.abs(this.data.change24h).toFixed(2)}%</span>
                            </div>
                        </div>
                        
                        <div class="balance-amount">
                            <div class="primary-balance">
                                <span class="currency-symbol">$</span>
                                <span class="amount">${this.formatAmount(this.data.totalBalance)}</span>
                                <span class="currency">USD</span>
                            </div>
                            <div class="secondary-balance">
                                ≈ $${this.formatAmount(this.data.pesoEquivalent)} ARS
                            </div>
                        </div>
                    </div>

                    <!-- USDT Balance Card -->
                    <div class="balance-card asset-card">
                        <div class="asset-header">
                            <div class="asset-info">
                                <div class="asset-icon crypto-icon usdt">₮</div>
                                <div class="asset-details">
                                    <span class="asset-name">USDT</span>
                                    <span class="asset-apy">APY: ${this.data.apy}%</span>
                                </div>
                            </div>
                        </div>
                        <div class="asset-balance">
                            <div class="asset-amount">${this.formatAmount(this.data.usdtBalance)} USDT</div>
                            <div class="asset-value">$${this.formatAmount(this.data.usdtBalance)} USD</div>
                        </div>
                    </div>

                    <!-- LTD Token Card -->
                    <div class="balance-card asset-card">
                        <div class="asset-header">
                            <div class="asset-info">
                                <div class="asset-icon ltd-icon">LTD</div>
                                <div class="asset-details">
                                    <span class="asset-name">La Tanda Token</span>
                                    <span class="asset-apy">Rewards: Active</span>
                                </div>
                            </div>
                        </div>
                        <div class="asset-balance">
                            <div class="asset-amount">${this.formatAmount(this.data.ltdBalance)} LTD</div>
                            <div class="asset-value">Governance Token</div>
                        </div>
                    </div>

                    <!-- Yield Earnings Card -->
                    <div class="balance-card yield-card">
                        <div class="yield-header">
                            <span class="yield-label">🌱 Rendimientos Generados</span>
                        </div>
                        <div class="yield-content">
                            <div class="yield-amount">
                                <span class="yield-value">+${this.formatAmount(this.data.yieldEarned)}</span>
                                <span class="yield-currency">USDT</span>
                            </div>
                            <div class="yield-period">Este mes</div>
                            <div class="yield-projection">
                                <span class="projection-label">Proyección anual:</span>
                                <span class="projection-value">+${this.formatAmount(this.data.yieldEarned * 12)} USDT</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Portfolio Actions -->
                <div class="portfolio-actions">
                    <button class="action-btn primary" onclick="portfolioActions.viewDetails()">
                        📊 Ver Detalles
                    </button>
                    <button class="action-btn secondary" onclick="portfolioActions.exportData()">
                        📄 Exportar
                    </button>
                </div>
            </div>
        `;

        this.addStyles();
    }

    /**
     * 🎨 ADD COMPONENT STYLES
     */
    addStyles() {
        if (document.getElementById('portfolio-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'portfolio-styles';
        styles.textContent = `
            .portfolio-overview {
                background: var(--bg-glass);
                backdrop-filter: blur(24px);
                border: 1px solid var(--border-primary);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
            }

            .portfolio-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .portfolio-title h2 {
                color: var(--text-primary);
                font-size: 24px;
                font-weight: 600;
                margin: 0;
            }

            .last-updated {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text-secondary);
                font-size: 12px;
            }

            .update-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--tanda-cyan);
            }

            .update-indicator.loading {
                background: #F59E0B;
                animation: pulse 2s ease-in-out infinite;
            }

            .portfolio-cards {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr;
                gap: 16px;
                margin-bottom: 24px;
            }

            .balance-card {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px;
                transition: all 0.3s ease;
            }

            .balance-card:hover {
                background: rgba(255, 255, 255, 0.04);
                border-color: var(--tanda-cyan);
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(0, 212, 170, 0.15);
            }

            .main-balance {
                background: linear-gradient(135deg, rgba(0, 212, 170, 0.1), rgba(0, 245, 212, 0.05));
                border-color: var(--tanda-cyan);
            }

            .balance-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .balance-label {
                color: var(--text-secondary);
                font-size: 14px;
                font-weight: 500;
            }

            .change-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                font-weight: 600;
                padding: 4px 8px;
                border-radius: 8px;
            }

            .change-indicator.positive {
                color: #10B981;
                background: rgba(16, 185, 129, 0.1);
            }

            .change-indicator.negative {
                color: #EF4444;
                background: rgba(239, 68, 68, 0.1);
            }

            .balance-amount {
                margin-bottom: 8px;
            }

            .primary-balance {
                display: flex;
                align-items: baseline;
                gap: 4px;
                margin-bottom: 8px;
            }

            .currency-symbol {
                color: var(--tanda-cyan);
                font-size: 20px;
                font-weight: 700;
            }

            .amount {
                color: var(--text-primary);
                font-size: 28px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
            }

            .currency {
                color: var(--text-secondary);
                font-size: 16px;
                font-weight: 500;
            }

            .secondary-balance {
                color: var(--text-secondary);
                font-size: 14px;
                font-weight: 500;
            }

            .asset-header {
                margin-bottom: 16px;
            }

            .asset-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .asset-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
            }

            .ltd-icon {
                background: linear-gradient(135deg, var(--tanda-cyan), var(--tanda-cyan-light));
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
            }

            .asset-details {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .asset-name {
                color: var(--text-primary);
                font-size: 14px;
                font-weight: 600;
            }

            .asset-apy {
                color: var(--tanda-cyan);
                font-size: 12px;
                font-weight: 500;
            }

            .asset-balance {
                text-align: left;
            }

            .asset-amount {
                color: var(--text-primary);
                font-size: 18px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
                margin-bottom: 4px;
            }

            .asset-value {
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 500;
            }

            .yield-card {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05));
                border-color: #10B981;
            }

            .yield-header {
                margin-bottom: 16px;
            }

            .yield-label {
                color: #10B981;
                font-size: 14px;
                font-weight: 600;
            }

            .yield-amount {
                display: flex;
                align-items: baseline;
                gap: 4px;
                margin-bottom: 8px;
            }

            .yield-value {
                color: #10B981;
                font-size: 20px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
            }

            .yield-currency {
                color: #10B981;
                font-size: 14px;
                font-weight: 500;
            }

            .yield-period {
                color: var(--text-secondary);
                font-size: 12px;
                margin-bottom: 12px;
            }

            .yield-projection {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: 8px;
                background: rgba(16, 185, 129, 0.05);
                border-radius: 8px;
            }

            .projection-label {
                color: var(--text-secondary);
                font-size: 11px;
            }

            .projection-value {
                color: #10B981;
                font-size: 14px;
                font-weight: 600;
                font-family: 'JetBrains Mono', monospace;
            }

            .portfolio-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
            }

            .action-btn {
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
            }

            .action-btn.primary {
                background: linear-gradient(135deg, var(--tanda-cyan), var(--tanda-cyan-light));
                color: var(--tanda-black);
            }

            .action-btn.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(0, 212, 170, 0.3);
            }

            .action-btn.secondary {
                background: transparent;
                color: var(--text-secondary);
                border: 1px solid var(--border-primary);
            }

            .action-btn.secondary:hover {
                background: rgba(255, 255, 255, 0.05);
                color: var(--text-primary);
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .portfolio-cards {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .portfolio-overview {
                    padding: 16px;
                }
                
                .primary-balance .amount {
                    font-size: 24px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * 📊 START REAL-TIME DATA UPDATES
     */
    startDataUpdates() {
        // Simulate real-time data
        this.updateData();
        
        // Update every 30 seconds
        setInterval(() => {
            this.updateData();
        }, 30000);
    }

    /**
     * 🔄 UPDATE PORTFOLIO DATA
     */
    async updateData() {
        this.isLoading = true;
        this.render();

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate dynamic data
        this.data = {
            totalBalance: 12750.50 + (Math.random() - 0.5) * 100,
            usdtBalance: 12500.25 + (Math.random() - 0.5) * 50,
            ltdBalance: 1250 + Math.floor(Math.random() * 100),
            pesoEquivalent: (12750.50 + (Math.random() - 0.5) * 100) * 365.50, // Current USD-ARS rate
            yieldEarned: 156.75 + Math.random() * 10,
            apy: 11.2 + (Math.random() - 0.5) * 2,
            change24h: (Math.random() - 0.5) * 4
        };

        this.isLoading = false;
        this.render();
    }

    /**
     * 💫 FORMAT AMOUNT DISPLAY
     */
    formatAmount(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

// Portfolio Actions Handler
const portfolioActions = {
    viewDetails() {
        // Navigate to detailed portfolio view
        console.log('📊 Opening detailed portfolio view...');
        // Implementation: Open detailed analytics page
    },

    exportData() {
        // Export portfolio data
        console.log('📄 Exporting portfolio data...');
        // Implementation: Generate CSV/PDF export
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('portfolio-container')) {
        new PortfolioOverview('portfolio-container');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioOverview;
}