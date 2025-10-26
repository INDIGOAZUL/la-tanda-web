/**
 * 🛡️ ARGENTINA INFLATION TRACKER
 * Real-time inflation protection metrics for Argentine users
 * Shows peso devaluation vs USDT protection
 */

class InflationTracker {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedCurrency = 'ARS'; // Default to Argentine Pesos
        this.selectedTimeframe = '1Y';
        
        this.currencies = {
            ARS: {
                name: 'Peso Argentino',
                flag: '🇦🇷',
                symbol: 'ARS',
                currentInflation: 143.0,
                monthlyInflation: 12.8,
                devaluation: -58.2,
                timeframes: {
                    '1M': -12.8,
                    '3M': -35.2,
                    '6M': -51.7,
                    '1Y': -58.2
                }
            },
            HNL: {
                name: 'Lempira Hondureña',
                flag: '🇭🇳',
                symbol: 'HNL',
                currentInflation: 9.8,
                monthlyInflation: 0.8,
                devaluation: -5.2,
                timeframes: {
                    '1M': -0.8,
                    '3M': -2.4,
                    '6M': -3.8,
                    '1Y': -5.2
                }
            },
            USD_MX: {
                name: 'Peso Mexicano',
                flag: '🇲🇽',
                symbol: 'MXN',
                currentInflation: 4.7,
                monthlyInflation: 0.4,
                devaluation: -2.1,
                timeframes: {
                    '1M': -0.4,
                    '3M': -1.2,
                    '6M': -1.8,
                    '1Y': -2.1
                }
            },
            COP: {
                name: 'Peso Colombiano',
                flag: '🇨🇴',
                symbol: 'COP',
                currentInflation: 12.4,
                monthlyInflation: 1.0,
                devaluation: -8.7,
                timeframes: {
                    '1M': -1.0,
                    '3M': -3.1,
                    '6M': -5.5,
                    '1Y': -8.7
                }
            },
            BRL: {
                name: 'Real Brasileño',
                flag: '🇧🇷',
                symbol: 'BRL',
                currentInflation: 3.2,
                monthlyInflation: 0.3,
                devaluation: -1.8,
                timeframes: {
                    '1M': -0.3,
                    '3M': -0.9,
                    '6M': -1.4,
                    '1Y': -1.8
                }
            },
            VES: {
                name: 'Bolívar Venezolano',
                flag: '🇻🇪',
                symbol: 'VES',
                currentInflation: 405.0,
                monthlyInflation: 28.5,
                devaluation: -78.3,
                timeframes: {
                    '1M': -28.5,
                    '3M': -65.4,
                    '6M': -72.1,
                    '1Y': -78.3
                }
            }
        };
        
        this.data = {
            usdtProtection: 100.0,
            savingsProtected: 12750.50,
            potentialLoss: 7437.79,
            usdtPerformance: {
                '1M': 0.1,
                '3M': 0.8,
                '6M': 1.2,
                '1Y': 2.1
            }
        };
        
        this.render();
        this.startUpdates();
    }

    /**
     * 🎨 RENDER INFLATION TRACKER
     */
    render() {
        if (!this.container) return;
        
        const currentCurrency = this.currencies[this.selectedCurrency];

        this.container.innerHTML = `
            <div class="inflation-tracker">
                <div class="tracker-header">
                    <div class="header-left">
                        <h3>🛡️ Protección contra Inflación Regional</h3>
                        <p class="header-subtitle">Tu escudo financiero en América Latina</p>
                    </div>
                    <div class="currency-selector">
                        <label class="selector-label">Moneda:</label>
                        <select class="currency-select" onchange="inflationTracker.selectCurrency(this.value)">
                            ${Object.entries(this.currencies).map(([code, currency]) => 
                                `<option value="${code}" ${code === this.selectedCurrency ? 'selected' : ''}>
                                    ${currency.flag} ${currency.name} (${currency.symbol})
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="inflation-badge">
                        <span class="badge-label">Inflación Anual</span>
                        <span class="badge-value">${currentCurrency.currentInflation}%</span>
                        <span class="badge-icon">${currentCurrency.flag}</span>
                    </div>
                </div>

                <div class="protection-overview">
                    <div class="protection-card main-protection">
                        <div class="protection-icon">💰</div>
                        <div class="protection-content">
                            <div class="protection-label">Ahorros Protegidos</div>
                            <div class="protection-amount">$${this.formatAmount(this.data.savingsProtected)} USD</div>
                            <div class="protection-status">
                                <span class="status-icon">✅</span>
                                <span class="status-text">100% protegido de inflación</span>
                            </div>
                        </div>
                    </div>

                    <div class="protection-card loss-avoided">
                        <div class="protection-icon">🚫</div>
                        <div class="protection-content">
                            <div class="protection-label">Pérdida Evitada</div>
                            <div class="protection-amount avoided">${this.formatAmount(this.calculateLossInLocalCurrency())} ${currentCurrency.symbol}</div>
                            <div class="protection-status">
                                <span class="status-icon">⚠️</span>
                                <span class="status-text">Si hubieras mantenido ${currentCurrency.name.toLowerCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="comparison-section">
                    <div class="section-title">
                        <h4>📊 Comparación de Performance</h4>
                        <div class="timeframe-selector">
                            ${Object.keys(currentCurrency.timeframes).map(period => 
                                `<button class="timeframe-btn ${period === this.selectedTimeframe ? 'active' : ''}" 
                                         onclick="inflationTracker.selectTimeframe('${period}')">${period}</button>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="comparison-charts">
                        <div class="performance-chart">
                            <div class="chart-header">
                                <span class="chart-title">Performance ${this.selectedTimeframe} - ${currentCurrency.name}</span>
                            </div>
                            
                            <div class="performance-bars">
                                <div class="performance-item local-currency-performance">
                                    <div class="perf-label">
                                        <span class="perf-icon">${currentCurrency.flag}</span>
                                        <span class="perf-name">${currentCurrency.name}</span>
                                    </div>
                                    <div class="perf-bar-container">
                                        <div class="perf-bar negative" style="width: ${Math.min(Math.abs(currentCurrency.timeframes[this.selectedTimeframe]), 100)}%">
                                            <span class="perf-value">${currentCurrency.timeframes[this.selectedTimeframe]}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="performance-item usdt-performance">
                                    <div class="perf-label">
                                        <span class="perf-icon">💵</span>
                                        <span class="perf-name">USDT (La Tanda)</span>
                                    </div>
                                    <div class="perf-bar-container">
                                        <div class="perf-bar positive" style="width: ${Math.min(this.data.usdtPerformance[this.selectedTimeframe] * 10, 100)}%">
                                            <span class="perf-value">+${this.data.usdtPerformance[this.selectedTimeframe]}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="chart-insight">
                                <div class="insight-icon">💡</div>
                                <div class="insight-text">
                                    Con USDT evitaste una pérdida del ${Math.abs(currentCurrency.timeframes[this.selectedTimeframe])}% 
                                    en ${currentCurrency.name} y además generaste ${this.data.usdtPerformance[this.selectedTimeframe]}% de rendimiento.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="protection-stats">
                    <div class="stat-item">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-label">Inflación Mensual</div>
                            <div class="stat-value">${currentCurrency.monthlyInflation}%</div>
                        </div>
                    </div>

                    <div class="stat-item">
                        <div class="stat-icon">💸</div>
                        <div class="stat-content">
                            <div class="stat-label">Devaluación Anual</div>
                            <div class="stat-value">${Math.abs(currentCurrency.devaluation)}%</div>
                        </div>
                    </div>

                    <div class="stat-item">
                        <div class="stat-icon">🛡️</div>
                        <div class="stat-content">
                            <div class="stat-label">Tu Protección</div>
                            <div class="stat-value">${this.data.usdtProtection}%</div>
                        </div>
                    </div>

                    <div class="stat-item">
                        <div class="stat-icon">⏰</div>
                        <div class="stat-content">
                            <div class="stat-label">Último Update</div>
                            <div class="stat-value">Ahora</div>
                        </div>
                    </div>
                </div>

                <div class="action-section">
                    <div class="action-message">
                        <div class="message-icon">🚀</div>
                        <div class="message-content">
                            <strong>¡Seguí protegiendo tus ahorros!</strong>
                            <p>Convertí más ${currentCurrency.name.toLowerCase()} a USDT y generá rendimientos adicionales.</p>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="action-btn primary" onclick="inflationTracker.convertMore()">
                            💱 Convertir ${currentCurrency.symbol}
                        </button>
                        <button class="action-btn secondary" onclick="inflationTracker.shareSuccess()">
                            📤 Compartir Éxito
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.addStyles();
    }

    /**
     * 🎨 ADD COMPONENT STYLES
     */
    addStyles() {
        if (document.getElementById('inflation-tracker-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'inflation-tracker-styles';
        styles.textContent = `
            .inflation-tracker {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
                backdrop-filter: blur(24px);
                border: 1px solid rgba(239, 68, 68, 0.2);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
            }

            .tracker-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 24px;
                flex-wrap: wrap;
                gap: 16px;
            }

            .header-left h3 {
                color: var(--text-primary);
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 8px 0;
            }

            .header-subtitle {
                color: var(--text-secondary);
                font-size: 14px;
                margin: 0;
            }

            .inflation-badge {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px 16px;
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid #EF4444;
                border-radius: 12px;
                text-align: center;
            }

            .badge-label {
                color: var(--text-secondary);
                font-size: 11px;
                font-weight: 500;
                margin-bottom: 4px;
            }

            .badge-value {
                color: #EF4444;
                font-size: 24px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
                margin-bottom: 4px;
            }

            .badge-icon {
                font-size: 16px;
            }

            /* Currency Selector */
            .currency-selector {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                min-width: 200px;
            }

            .selector-label {
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .currency-select {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--border-primary);
                border-radius: 8px;
                color: var(--text-primary);
                padding: 8px 12px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                max-width: 250px;
            }

            .currency-select:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: var(--tanda-cyan);
            }

            .currency-select:focus {
                outline: none;
                border-color: var(--tanda-cyan);
                box-shadow: 0 0 16px rgba(0, 212, 170, 0.2);
            }

            .currency-select option {
                background: var(--tanda-dark);
                color: var(--text-primary);
                padding: 8px;
            }

            .protection-overview {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 24px;
            }

            .protection-card {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                transition: all 0.3s ease;
            }

            .protection-card:hover {
                background: rgba(255, 255, 255, 0.04);
                transform: translateY(-2px);
            }

            .main-protection {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05));
                border-color: #10B981;
            }

            .loss-avoided {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05));
                border-color: #F59E0B;
            }

            .protection-icon {
                font-size: 32px;
                flex-shrink: 0;
            }

            .protection-content {
                flex: 1;
            }

            .protection-label {
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 8px;
            }

            .protection-amount {
                color: var(--text-primary);
                font-size: 24px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
                margin-bottom: 8px;
            }

            .protection-amount.avoided {
                color: #F59E0B;
            }

            .protection-status {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .status-text {
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 500;
            }

            .comparison-section {
                margin-bottom: 24px;
            }

            .section-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .section-title h4 {
                color: var(--text-primary);
                font-size: 16px;
                font-weight: 600;
                margin: 0;
            }

            .timeframe-selector {
                display: flex;
                gap: 4px;
            }

            .timeframe-btn {
                padding: 6px 12px;
                background: transparent;
                border: 1px solid var(--border-primary);
                border-radius: 6px;
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .timeframe-btn:hover {
                background: rgba(255, 255, 255, 0.05);
                color: var(--text-primary);
            }

            .timeframe-btn.active {
                background: var(--tanda-cyan);
                color: var(--tanda-black);
                border-color: var(--tanda-cyan);
            }

            .performance-chart {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px;
            }

            .chart-header {
                margin-bottom: 16px;
            }

            .chart-title {
                color: var(--text-primary);
                font-size: 14px;
                font-weight: 600;
            }

            .performance-bars {
                margin-bottom: 16px;
            }

            .performance-item {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 16px;
            }

            .perf-label {
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 140px;
            }

            .perf-name {
                color: var(--text-primary);
                font-size: 14px;
                font-weight: 500;
            }

            .perf-bar-container {
                flex: 1;
                height: 32px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                position: relative;
                overflow: hidden;
            }

            .perf-bar {
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                position: relative;
                min-width: 60px;
                max-width: 100%;
            }

            .perf-bar.positive {
                background: linear-gradient(135deg, #10B981, #059669);
            }

            .perf-bar.negative {
                background: linear-gradient(135deg, #EF4444, #DC2626);
            }

            .perf-value {
                color: white;
                font-size: 12px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
            }

            .chart-insight {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px;
                background: rgba(59, 130, 246, 0.1);
                border-left: 4px solid #3B82F6;
                border-radius: 8px;
            }

            .insight-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .insight-text {
                color: var(--text-primary);
                font-size: 14px;
                line-height: 1.5;
            }

            .protection-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }

            .stat-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
            }

            .stat-icon {
                font-size: 24px;
                flex-shrink: 0;
            }

            .stat-content {
                flex: 1;
            }

            .stat-label {
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 4px;
            }

            .stat-value {
                color: var(--text-primary);
                font-size: 18px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
            }

            .action-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: rgba(0, 212, 170, 0.05);
                border: 1px solid rgba(0, 212, 170, 0.2);
                border-radius: 12px;
            }

            .action-message {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                flex: 1;
            }

            .message-icon {
                font-size: 24px;
                flex-shrink: 0;
            }

            .message-content strong {
                color: var(--text-primary);
                font-size: 16px;
                font-weight: 600;
                display: block;
                margin-bottom: 4px;
            }

            .message-content p {
                color: var(--text-secondary);
                font-size: 14px;
                margin: 0;
            }

            .action-buttons {
                display: flex;
                gap: 12px;
            }

            .action-btn {
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                white-space: nowrap;
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
                color: var(--text-primary);
                border: 1px solid var(--border-primary);
            }

            .action-btn.secondary:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .tracker-header {
                    flex-direction: column;
                    gap: 16px;
                    align-items: stretch;
                }
                
                .currency-selector {
                    align-items: stretch;
                    min-width: auto;
                }
                
                .currency-select {
                    max-width: 100%;
                }
                
                .protection-overview {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .section-title {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }
                
                .protection-stats {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .action-section {
                    flex-direction: column;
                    gap: 16px;
                    align-items: stretch;
                }
                
                .action-buttons {
                    justify-content: center;
                }
                
                .inflation-tracker {
                    padding: 16px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * 🔄 START REAL-TIME UPDATES
     */
    startUpdates() {
        // Update inflation data every 5 minutes
        setInterval(() => {
            this.updateInflationData();
        }, 300000);
    }

    /**
     * 📊 UPDATE INFLATION DATA
     */
    updateInflationData() {
        // Simulate small changes in inflation data
        this.data.monthlyInflation += (Math.random() - 0.5) * 0.2;
        this.data.currentInflation += (Math.random() - 0.5) * 0.5;
        
        // Recalculate protection amounts
        this.calculateProtectionAmounts();
        this.render();
    }

    /**
     * 💰 CALCULATE PROTECTION AMOUNTS
     */
    calculateProtectionAmounts() {
        // Simulate calculation based on user's balance
        const baseAmount = 12750.50;
        this.data.savingsProtected = baseAmount;
        
        // Calculate what would have been lost in pesos
        const inflationLoss = baseAmount * (this.data.currentInflation / 100);
        this.data.potentialLoss = inflationLoss;
    }

    /**
     * 🌍 SELECT CURRENCY
     */
    selectCurrency(currency) {
        this.selectedCurrency = currency;
        this.render();
    }

    /**
     * 📅 SELECT TIMEFRAME
     */
    selectTimeframe(timeframe) {
        this.selectedTimeframe = timeframe;
        this.render();
    }

    /**
     * 💰 CALCULATE LOSS IN LOCAL CURRENCY
     */
    calculateLossInLocalCurrency() {
        const currentCurrency = this.currencies[this.selectedCurrency];
        const exchangeRates = {
            ARS: 365.50,    // USD to ARS
            HNL: 24.60,     // USD to HNL
            MXN: 17.85,     // USD to MXN
            COP: 4320.50,   // USD to COP
            BRL: 5.45,      // USD to BRL  
            VES: 36.50      // USD to VES (official rate, black market much higher)
        };
        
        const baseUSDAmount = this.data.savingsProtected;
        const localAmount = baseUSDAmount * exchangeRates[this.selectedCurrency];
        const inflationLoss = localAmount * (Math.abs(currentCurrency.devaluation) / 100);
        
        return inflationLoss;
    }

    /**
     * 💫 FORMAT AMOUNT
     */
    formatAmount(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

// Inflation Tracker Actions
const inflationTracker = {
    selectCurrency(currency) {
        const instance = window.inflationTrackerInstance;
        if (instance) {
            instance.selectCurrency(currency);
        }
    },

    selectTimeframe(timeframe) {
        const instance = window.inflationTrackerInstance;
        if (instance) {
            instance.selectTimeframe(timeframe);
        }
    },

    convertMore() {
        const instance = window.inflationTrackerInstance;
        const currentCurrency = instance ? instance.currencies[instance.selectedCurrency] : null;
        const currencyName = currentCurrency ? currentCurrency.name : 'currency';
        
        console.log(`💱 Opening ${currencyName} conversion...`);
        // Implementation: Open conversion interface
    },

    shareSuccess() {
        const instance = window.inflationTrackerInstance;
        const currentCurrency = instance ? instance.currencies[instance.selectedCurrency] : null;
        const currencyName = currentCurrency ? currentCurrency.name : 'currency';
        
        console.log(`📤 Sharing ${currencyName} protection success...`);
        // Implementation: Open social sharing options
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('inflation-tracker-container')) {
        window.inflationTrackerInstance = new InflationTracker('inflation-tracker-container');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InflationTracker;
}