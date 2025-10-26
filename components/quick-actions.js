/**
 * ⚡ QUICK ACTIONS PANEL
 * One-click access to primary user actions
 * Argentina-focused with peso→USDT conversion
 */

class QuickActionsPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.rates = {
            usdArs: 365.50, // Current USD-ARS rate
            usdtArs: 364.80, // USDT-ARS rate (slightly lower)
            lastUpdated: new Date()
        };
        
        this.render();
        this.updateRates();
    }

    /**
     * 🎨 RENDER QUICK ACTIONS PANEL
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="quick-actions-panel">
                <div class="actions-header">
                    <h3>⚡ Acciones Rápidas</h3>
                    <div class="rate-display">
                        <span class="rate-label">USD/ARS:</span>
                        <span class="rate-value">$${this.rates.usdArs}</span>
                        <span class="rate-indicator ${this.getRateDirection()}">
                            ${this.getRateDirection() === 'up' ? '↗' : '↘'}
                        </span>
                    </div>
                </div>

                <div class="actions-grid">
                    <!-- Convert Pesos Action -->
                    <div class="quick-action convert-action">
                        <div class="action-icon">💱</div>
                        <div class="action-content">
                            <h4>Convertir Pesos</h4>
                            <p>Peso Argentino → USDT</p>
                            <div class="conversion-preview">
                                <div class="conversion-rate">
                                    1 USD = $${this.rates.usdtArs} ARS
                                </div>
                                <div class="quick-amounts">
                                    <button class="amount-btn" onclick="quickActions.convert(10000)">$10K</button>
                                    <button class="amount-btn" onclick="quickActions.convert(50000)">$50K</button>
                                    <button class="amount-btn" onclick="quickActions.convert(100000)">$100K</button>
                                </div>
                            </div>
                        </div>
                        <button class="action-button primary" onclick="quickActions.openConverter()">
                            Convertir Ahora
                        </button>
                    </div>

                    <!-- Deposit Action -->
                    <div class="quick-action deposit-action">
                        <div class="action-icon">📥</div>
                        <div class="action-content">
                            <h4>Depositar Fondos</h4>
                            <p>Transferencia bancaria o crypto</p>
                            <div class="deposit-options">
                                <span class="option-tag">Transferencia</span>
                                <span class="option-tag">Mercado Pago</span>
                                <span class="option-tag">Crypto</span>
                            </div>
                        </div>
                        <button class="action-button secondary" onclick="quickActions.deposit()">
                            Depositar
                        </button>
                    </div>

                    <!-- Withdraw Action -->
                    <div class="quick-action withdraw-action">
                        <div class="action-icon">📤</div>
                        <div class="action-content">
                            <h4>Retirar Fondos</h4>
                            <p>A tu cuenta bancaria</p>
                            <div class="withdraw-info">
                                <span class="info-item">⚡ Instantáneo</span>
                                <span class="info-item">🔒 Seguro</span>
                            </div>
                        </div>
                        <button class="action-button secondary" onclick="quickActions.withdraw()">
                            Retirar
                        </button>
                    </div>

                    <!-- Join Tanda Action -->
                    <div class="quick-action tanda-action">
                        <div class="action-icon">👥</div>
                        <div class="action-content">
                            <h4>Unirse a Tanda</h4>
                            <p>Grupos disponibles</p>
                            <div class="tanda-stats">
                                <span class="stat">12 grupos activos</span>
                                <span class="stat">8-15% APY</span>
                            </div>
                        </div>
                        <button class="action-button accent" onclick="quickActions.joinTanda()">
                            Ver Grupos
                        </button>
                    </div>

                    <!-- Yield Opportunities -->
                    <div class="quick-action yield-action">
                        <div class="action-icon">🌱</div>
                        <div class="action-content">
                            <h4>Generar Rendimientos</h4>
                            <p>Oportunidades DeFi</p>
                            <div class="yield-preview">
                                <span class="yield-rate">Hasta 15% APY</span>
                                <span class="yield-type">Staking USDT</span>
                            </div>
                        </div>
                        <button class="action-button accent" onclick="quickActions.exploreYield()">
                            Explorar
                        </button>
                    </div>

                    <!-- Emergency Actions -->
                    <div class="quick-action emergency-action">
                        <div class="action-icon">🆘</div>
                        <div class="action-content">
                            <h4>Ayuda Rápida</h4>
                            <p>Soporte inmediato</p>
                            <div class="support-options">
                                <span class="support-tag">WhatsApp</span>
                                <span class="support-tag">Chat</span>
                            </div>
                        </div>
                        <button class="action-button emergency" onclick="quickActions.getHelp()">
                            Contactar
                        </button>
                    </div>
                </div>

                <!-- Quick Calculator -->
                <div class="quick-calculator">
                    <div class="calculator-header">
                        <span class="calc-title">🧮 Calculadora Rápida</span>
                        <button class="calc-toggle" onclick="quickActions.toggleCalculator()">
                            <span id="calc-toggle-text">Mostrar</span>
                        </button>
                    </div>
                    <div class="calculator-content" id="calculator-content" style="display: none;">
                        <div class="calc-input-group">
                            <label>Pesos Argentinos (ARS)</label>
                            <input type="number" id="pesos-input" placeholder="0" oninput="quickActions.calculateConversion()">
                        </div>
                        <div class="calc-arrow">⬇️</div>
                        <div class="calc-result-group">
                            <label>Dólares USDT</label>
                            <div class="calc-result" id="usdt-result">0.00 USDT</div>
                        </div>
                        <div class="calc-info">
                            <small>Tasa: 1 USDT = $${this.rates.usdtArs} ARS</small>
                        </div>
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
        if (document.getElementById('quick-actions-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'quick-actions-styles';
        styles.textContent = `
            .quick-actions-panel {
                background: var(--bg-glass);
                backdrop-filter: blur(24px);
                border: 1px solid var(--border-primary);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
            }

            .actions-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }

            .actions-header h3 {
                color: var(--text-primary);
                font-size: 20px;
                font-weight: 600;
                margin: 0;
            }

            .rate-display {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: rgba(0, 212, 170, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(0, 212, 170, 0.2);
            }

            .rate-label {
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 500;
            }

            .rate-value {
                color: var(--tanda-cyan);
                font-size: 14px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
            }

            .rate-indicator {
                font-size: 12px;
            }

            .rate-indicator.up { color: #10B981; }
            .rate-indicator.down { color: #EF4444; }

            .actions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }

            .quick-action {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .quick-action:hover {
                background: rgba(255, 255, 255, 0.04);
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            }

            .convert-action {
                background: linear-gradient(135deg, rgba(0, 212, 170, 0.1), rgba(0, 245, 212, 0.05));
                border-color: var(--tanda-cyan);
            }

            .action-icon {
                font-size: 32px;
                margin-bottom: 12px;
                display: block;
            }

            .action-content h4 {
                color: var(--text-primary);
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 8px 0;
            }

            .action-content p {
                color: var(--text-secondary);
                font-size: 14px;
                margin: 0 0 16px 0;
            }

            .conversion-preview {
                margin-bottom: 16px;
            }

            .conversion-rate {
                color: var(--tanda-cyan);
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
            }

            .quick-amounts {
                display: flex;
                gap: 8px;
            }

            .amount-btn {
                padding: 4px 8px;
                background: rgba(0, 212, 170, 0.2);
                border: 1px solid var(--tanda-cyan);
                border-radius: 6px;
                color: var(--tanda-cyan);
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .amount-btn:hover {
                background: var(--tanda-cyan);
                color: var(--tanda-black);
            }

            .deposit-options, .withdraw-info, .tanda-stats, .yield-preview, .support-options {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 16px;
            }

            .option-tag, .info-item, .stat, .yield-rate, .yield-type, .support-tag {
                padding: 4px 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: var(--text-secondary);
                font-size: 11px;
                font-weight: 500;
            }

            .yield-rate {
                color: #10B981;
                background: rgba(16, 185, 129, 0.2);
            }

            .action-button {
                width: 100%;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                margin-top: auto;
            }

            .action-button.primary {
                background: linear-gradient(135deg, var(--tanda-cyan), var(--tanda-cyan-light));
                color: var(--tanda-black);
            }

            .action-button.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(0, 212, 170, 0.3);
            }

            .action-button.secondary {
                background: transparent;
                color: var(--text-primary);
                border: 1px solid var(--border-primary);
            }

            .action-button.secondary:hover {
                background: rgba(255, 255, 255, 0.05);
                border-color: var(--tanda-cyan);
            }

            .action-button.accent {
                background: linear-gradient(135deg, #10B981, #059669);
                color: white;
            }

            .action-button.accent:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
            }

            .action-button.emergency {
                background: linear-gradient(135deg, #EF4444, #DC2626);
                color: white;
            }

            .action-button.emergency:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
            }

            .quick-calculator {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 16px;
            }

            .calculator-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .calc-title {
                color: var(--text-primary);
                font-size: 16px;
                font-weight: 600;
            }

            .calc-toggle {
                background: transparent;
                border: 1px solid var(--border-primary);
                color: var(--tanda-cyan);
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .calc-toggle:hover {
                background: rgba(0, 212, 170, 0.1);
            }

            .calculator-content {
                animation: slideDown 0.3s ease;
            }

            .calc-input-group, .calc-result-group {
                margin-bottom: 12px;
            }

            .calc-input-group label, .calc-result-group label {
                display: block;
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 6px;
            }

            .calc-input-group input {
                width: 100%;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--border-primary);
                border-radius: 8px;
                color: var(--text-primary);
                font-size: 16px;
                font-family: 'JetBrains Mono', monospace;
            }

            .calc-input-group input:focus {
                outline: none;
                border-color: var(--tanda-cyan);
                box-shadow: 0 0 16px rgba(0, 212, 170, 0.2);
            }

            .calc-result {
                padding: 12px 16px;
                background: rgba(0, 212, 170, 0.1);
                border: 1px solid var(--tanda-cyan);
                border-radius: 8px;
                color: var(--tanda-cyan);
                font-size: 18px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
                text-align: center;
            }

            .calc-arrow {
                text-align: center;
                font-size: 20px;
                margin: 8px 0;
            }

            .calc-info {
                text-align: center;
                margin-top: 12px;
            }

            .calc-info small {
                color: var(--text-secondary);
                font-size: 11px;
            }

            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .actions-grid {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .actions-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: flex-start;
                }
                
                .quick-actions-panel {
                    padding: 16px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * 🔄 UPDATE EXCHANGE RATES
     */
    async updateRates() {
        // Simulate rate updates every 60 seconds
        setInterval(() => {
            // Add some realistic fluctuation
            this.rates.usdArs += (Math.random() - 0.5) * 2;
            this.rates.usdtArs = this.rates.usdArs - 0.70; // USDT typically slightly lower
            this.rates.lastUpdated = new Date();
            
            this.render();
        }, 60000);
    }

    /**
     * 📈 GET RATE DIRECTION INDICATOR
     */
    getRateDirection() {
        // Simulate rate direction based on time
        return Math.random() > 0.5 ? 'up' : 'down';
    }

    /**
     * 🧮 CALCULATE CONVERSION
     */
    calculateConversion() {
        const pesosInput = document.getElementById('pesos-input');
        const usdtResult = document.getElementById('usdt-result');
        
        if (pesosInput && usdtResult) {
            const pesos = parseFloat(pesosInput.value) || 0;
            const usdt = pesos / this.rates.usdtArs;
            usdtResult.textContent = `${usdt.toFixed(2)} USDT`;
        }
    }

    /**
     * 🔧 TOGGLE CALCULATOR VISIBILITY
     */
    toggleCalculator() {
        const content = document.getElementById('calculator-content');
        const toggleText = document.getElementById('calc-toggle-text');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggleText.textContent = 'Ocultar';
        } else {
            content.style.display = 'none';
            toggleText.textContent = 'Mostrar';
        }
    }
}

// Quick Actions Handler
const quickActions = {
    convert(amount) {
        console.log(`💱 Converting ${amount} ARS to USDT...`);
        // Implementation: Open conversion modal with pre-filled amount
    },

    openConverter() {
        console.log('💱 Opening full converter interface...');
        // Implementation: Navigate to conversion page
    },

    deposit() {
        console.log('📥 Opening deposit interface...');
        // Implementation: Open deposit modal/page
    },

    withdraw() {
        console.log('📤 Opening withdrawal interface...');
        // Implementation: Open withdrawal modal/page
    },

    joinTanda() {
        console.log('👥 Opening Tanda groups...');
        // Implementation: Navigate to groups page
    },

    exploreYield() {
        console.log('🌱 Opening yield opportunities...');
        // Implementation: Navigate to DeFi yield page
    },

    getHelp() {
        console.log('🆘 Opening support options...');
        // Implementation: Open support chat or contact modal
    },

    toggleCalculator() {
        const instance = window.quickActionsInstance;
        if (instance) {
            instance.toggleCalculator();
        }
    },

    calculateConversion() {
        const instance = window.quickActionsInstance;
        if (instance) {
            instance.calculateConversion();
        }
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('quick-actions-container')) {
        window.quickActionsInstance = new QuickActionsPanel('quick-actions-container');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickActionsPanel;
}