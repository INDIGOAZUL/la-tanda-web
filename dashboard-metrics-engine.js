/**
 * 📊 DASHBOARD METRICS ENGINE
 * Motor de métricas en tiempo real para el dashboard de tandas
 * Calcula y actualiza todas las estadísticas dinámicamente
 */

class DashboardMetricsEngine {
    constructor() {
        this.system = null;
        this.updateInterval = null;
        this.isRunning = false;
        
        // Elementos del DOM para actualizar
        this.elements = {
            liquidityPool: null,
            activeWallets: null,
            smartContractSuccess: null,
            portfolioAPY: null,
            portfolioTVL: null,
            portfolioGrowthChart: null,
            flashMessages: null
        };
        
        this.init();
    }
    
    async init() {
        console.log('📊 Initializing Dashboard Metrics Engine...');
        
        // Esperar al sistema completo
        await this.waitForSystem();
        
        // Localizar elementos del DOM
        this.locateElements();
        
        // Iniciar actualizaciones automáticas
        this.startRealTimeUpdates();
        
        console.log('✅ Dashboard Metrics Engine ready!');
    }
    
    async waitForSystem() {
        return new Promise((resolve) => {
            const checkSystem = () => {
                if (window.laTandaSystemComplete && window.laTandaSystemComplete.isInitialized) {
                    this.system = window.laTandaSystemComplete;
                    resolve();
                } else {
                    setTimeout(checkSystem, 100);
                }
            };
            checkSystem();
        });
    }
    
    locateElements() {
        // Localizar elementos por contenido o estructura
        this.elements = {
            liquidityPool: this.findElementByText('Liquidity Pool Total'),
            activeWallets: this.findElementByText('Active Wallets'),
            smartContractSuccess: this.findElementByText('Smart Contract Success'),
            portfolioAPY: this.findElementByText('APY'),
            portfolioTVL: this.findElementByText('TVL'),
            portfolioGrowthChart: document.querySelector('.web3-growth-chart'),
            flashMessages: document.querySelector('.flash-text')
        };
        
        console.log('🎯 Elements located:', Object.keys(this.elements).filter(key => this.elements[key]));
    }
    
    findElementByText(text) {
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
            if (element.textContent && element.textContent.includes(text)) {
                // Buscar el elemento que contiene el valor numérico
                const parent = element.closest('.hero-stat, .portfolio-item, .stat-number');
                if (parent) {
                    return parent.querySelector('.stat-number, .portfolio-value, .stat-value') || element;
                }
            }
        }
        return null;
    }
    
    startRealTimeUpdates() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Actualización inicial
        this.updateAllMetrics();
        
        // Actualizaciones cada 30 segundos
        this.updateInterval = setInterval(() => {
            this.updateAllMetrics();
        }, 30000);
        
        // Actualizaciones cada 5 segundos para el portfolio
        setInterval(() => {
            this.updatePortfolioGrowth();
            this.updateFlashMessages();
        }, 5000);
        
        console.log('⚡ Real-time updates started');
    }
    
    updateAllMetrics() {
        try {
            // Recalcular analíticas del sistema
            const analytics = this.system.calculateRealAnalytics();
            const systemStats = this.system.systemStats;
            
            // Actualizar métricas principales
            this.updateLiquidityPool(analytics);
            this.updateActiveWallets(analytics);
            this.updateSmartContractSuccess(analytics);
            this.updatePortfolioMetrics(analytics);
            
            console.log('📊 Metrics updated:', new Date().toLocaleTimeString());
            
        } catch (error) {
            console.error('Error updating metrics:', error);
        }
    }
    
    updateLiquidityPool(analytics) {
        const liquidityElement = this.findStatElement('Liquidity Pool Total');
        if (liquidityElement) {
            const totalLiquidity = analytics.totalLiquidity;
            const formattedValue = this.formatCurrency(totalLiquidity);
            
            this.animateValueChange(liquidityElement, formattedValue);
        }
    }
    
    updateActiveWallets(analytics) {
        const walletsElement = this.findStatElement('Active Wallets');
        if (walletsElement) {
            // Calcular wallets activas = miembros únicos en grupos activos
            const activeMembers = new Set();
            this.system.groups.forEach(group => {
                if (group.status === 'active') {
                    group.members.forEach(member => {
                        activeMembers.add(member.userId);
                    });
                }
            });
            
            const activeWallets = activeMembers.size;
            const growthRate = this.calculateGrowthRate(activeWallets);
            
            this.animateValueChange(walletsElement, activeWallets.toLocaleString());
            
            // Agregar indicador de crecimiento
            this.addGrowthIndicator(walletsElement, growthRate);
        }
    }
    
    updateSmartContractSuccess(analytics) {
        const successElement = this.findStatElement('Smart Contract Success');
        if (successElement) {
            // Calcular tasa de éxito basada en pagos completados
            const successRate = analytics.onTimePaymentRate || 98.5;
            const formattedValue = `${successRate}%`;
            
            this.animateValueChange(successElement, formattedValue);
        }
    }
    
    updatePortfolioMetrics(analytics) {
        // Actualizar APY
        const apyElement = this.findPortfolioElement('APY');
        if (apyElement) {
            const currentAPY = this.calculateCurrentAPY(analytics);
            this.animateValueChange(apyElement, `+${currentAPY}%`, 'crypto-green');
        }
        
        // Actualizar TVL
        const tvlElement = this.findPortfolioElement('TVL');
        if (tvlElement) {
            const userTVL = this.calculateUserTVL();
            this.animateValueChange(tvlElement, this.formatCurrency(userTVL), 'crypto-blue');
        }
    }
    
    calculateCurrentAPY(analytics) {
        // Calcular APY basado en rendimiento del sistema
        const baseAPY = 18.7; // APY base
        const performanceBonus = (analytics.successRate - 90) * 0.1; // Bonus por performance
        const liquidityFactor = Math.min(5, analytics.totalLiquidity / 1000000); // Factor de liquidez
        
        const currentAPY = baseAPY + performanceBonus + liquidityFactor;
        return Math.round(currentAPY * 10) / 10; // Redondear a 1 decimal
    }
    
    calculateUserTVL() {
        // Calcular TVL del usuario actual
        let userTVL = 0;
        
        // Sumar contribuciones en grupos activos
        this.system.groups.forEach(group => {
            const userMember = group.members.find(m => m.userId === this.system.currentUser.id);
            if (userMember && group.status === 'active') {
                userTVL += group.baseContribution;
            }
        });
        
        // Sumar tandas en progreso
        this.system.tandas.forEach(tanda => {
            const userParticipant = tanda.participants.find(p => p.userId === this.system.currentUser.id);
            if (userParticipant && tanda.status === 'active') {
                userTVL += tanda.contributionAmount * tanda.currentRound;
            }
        });
        
        return userTVL;
    }
    
    updatePortfolioGrowth() {
        const chartElement = document.querySelector('.web3-growth-chart');
        if (!chartElement) return;
        
        const bars = chartElement.querySelectorAll('.chart-bar');
        if (bars.length === 0) return;
        
        // Generar datos de crecimiento realistas
        bars.forEach((bar, index) => {
            const baseHeight = parseInt(bar.dataset.height);
            const variation = Math.sin(Date.now() / 10000 + index) * 5; // Variación sutil
            const newHeight = Math.max(20, Math.min(100, baseHeight + variation));
            
            bar.style.height = `${newHeight}%`;
            bar.style.transition = 'height 2s ease-in-out';
        });
    }
    
    updateFlashMessages() {
        const flashContainer = document.querySelector('.flash-text');
        if (!flashContainer) return;
        
        const messages = flashContainer.querySelectorAll('.flash-word');
        if (messages.length === 0) return;
        
        // Rotar mensajes cada 5 segundos
        const currentActive = flashContainer.querySelector('.flash-word.active');
        const currentIndex = Array.from(messages).indexOf(currentActive);
        const nextIndex = (currentIndex + 1) % messages.length;
        
        if (currentActive) {
            currentActive.classList.remove('active');
        }
        
        messages[nextIndex].classList.add('active');
    }
    
    findStatElement(labelText) {
        const labels = document.querySelectorAll('.stat-label');
        for (let label of labels) {
            if (label.textContent.includes(labelText)) {
                const parent = label.closest('.hero-stat, .stat-item');
                return parent ? parent.querySelector('.stat-number, .stat-value') : null;
            }
        }
        return null;
    }
    
    findPortfolioElement(labelText) {
        const labels = document.querySelectorAll('.portfolio-label');
        for (let label of labels) {
            if (label.textContent.includes(labelText)) {
                const parent = label.closest('.portfolio-item');
                return parent ? parent.querySelector('.portfolio-value') : null;
            }
        }
        return null;
    }
    
    animateValueChange(element, newValue, colorClass = '') {
        if (!element) return;
        
        // Guardar valor anterior
        const oldValue = element.textContent;
        
        // Aplicar animación de cambio
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.3s ease';
        
        // Cambiar color temporalmente si es diferente
        if (oldValue !== newValue) {
            element.style.color = '#00FFFF';
        }
        
        // Actualizar valor
        setTimeout(() => {
            element.textContent = newValue;
            
            if (colorClass) {
                element.className = `portfolio-value ${colorClass}`;
            }
            
            // Restaurar escala
            element.style.transform = 'scale(1)';
            
            // Restaurar color
            setTimeout(() => {
                element.style.color = '';
            }, 1000);
            
        }, 150);
    }
    
    addGrowthIndicator(element, growthRate) {
        if (!element || !element.parentElement) return;
        
        // Remover indicador anterior
        const oldIndicator = element.parentElement.querySelector('.growth-indicator');
        if (oldIndicator) {
            oldIndicator.remove();
        }
        
        // Crear nuevo indicador
        const indicator = document.createElement('div');
        indicator.className = 'growth-indicator';
        
        const arrow = growthRate >= 0 ? '↗️' : '↘️';
        const color = growthRate >= 0 ? '#22d55e' : '#f87171';
        
        indicator.innerHTML = `
            <span style="color: ${color}; font-size: 12px; margin-left: 8px;">
                ${arrow} ${Math.abs(growthRate).toFixed(1)}%
            </span>
        `;
        
        element.parentElement.appendChild(indicator);
    }
    
    calculateGrowthRate(currentValue) {
        // Simular crecimiento basado en performance del sistema
        const analytics = this.system.analytics;
        if (!analytics) return 0;
        
        const baseGrowth = 2.5; // 2.5% base
        const performanceBonus = (analytics.successRate - 95) * 0.5;
        const liquidityFactor = Math.min(3, analytics.totalLiquidity / 2000000);
        
        return baseGrowth + performanceBonus + liquidityFactor + (Math.random() - 0.5);
    }
    
    formatCurrency(amount) {
        if (amount >= 1000000) {
            return `L. ${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `L. ${(amount / 1000).toFixed(1)}K`;
        } else {
            return `L. ${amount.toLocaleString()}`;
        }
    }
    
    // Método para actualizar manualmente (llamado desde el sistema)
    forceUpdate() {
        this.updateAllMetrics();
        console.log('🔄 Forced metrics update');
    }
    
    // Método para detener actualizaciones
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isRunning = false;
        console.log('⏹️ Dashboard metrics engine stopped');
    }
}

// Funciones para mejorar la interfaz visual
class DashboardVisualEffects {
    constructor() {
        this.init();
    }
    
    init() {
        this.enhanceHeroSection();
        this.addInteractiveEffects();
        this.improveChartVisuals();
    }
    
    enhanceHeroSection() {
        // Agregar efectos de partículas animadas
        const heroSection = document.querySelector('.dashboard-hero');
        if (!heroSection) return;
        
        // Crear partículas flotantes
        this.createFloatingParticles(heroSection);
        
        // Mejorar el chart de crecimiento
        this.enhanceGrowthChart();
    }
    
    createFloatingParticles(container) {
        const particlesContainer = container.querySelector('.web3-particles');
        if (!particlesContainer) return;
        
        // Animar partículas existentes
        const particles = particlesContainer.querySelectorAll('.crypto-particle');
        particles.forEach((particle, index) => {
            particle.style.animation = `float ${3 + index}s ease-in-out infinite`;
            particle.style.animationDelay = `${index * 0.5}s`;
        });
        
        // Agregar estilos de animación si no existen
        this.addParticleAnimations();
    }
    
    addParticleAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                25% { transform: translateY(-10px) rotate(90deg); }
                50% { transform: translateY(-5px) rotate(180deg); }
                75% { transform: translateY(-15px) rotate(270deg); }
            }
            
            .crypto-particle {
                transition: all 0.3s ease;
            }
            
            .crypto-particle:hover {
                transform: scale(1.2);
                filter: brightness(1.5);
            }
            
            .stat-number, .portfolio-value {
                transition: all 0.3s ease;
            }
            
            .hero-stat:hover .stat-number {
                color: #00FFFF;
                text-shadow: 0 0 10px #00FFFF;
            }
        `;
        document.head.appendChild(style);
    }
    
    enhanceGrowthChart() {
        const chart = document.querySelector('.web3-growth-chart');
        if (!chart) return;
        
        const bars = chart.querySelectorAll('.chart-bar');
        bars.forEach((bar, index) => {
            bar.addEventListener('mouseenter', () => {
                bar.style.filter = 'brightness(1.3)';
                bar.style.transform = 'scaleY(1.1)';
            });
            
            bar.addEventListener('mouseleave', () => {
                bar.style.filter = '';
                bar.style.transform = '';
            });
        });
    }
    
    addInteractiveEffects() {
        // Efectos hover para estadísticas
        const stats = document.querySelectorAll('.hero-stat, .portfolio-item');
        stats.forEach(stat => {
            stat.addEventListener('mouseenter', () => {
                stat.style.transform = 'translateY(-5px)';
                stat.style.boxShadow = '0 10px 25px rgba(0, 255, 255, 0.2)';
            });
            
            stat.addEventListener('mouseleave', () => {
                stat.style.transform = '';
                stat.style.boxShadow = '';
            });
        });
    }
    
    improveChartVisuals() {
        // Agregar gradientes a las barras del chart
        const bars = document.querySelectorAll('.chart-bar');
        bars.forEach(bar => {
            bar.style.background = 'linear-gradient(135deg, #00FFFF 0%, #0080FF 100%)';
            bar.style.borderRadius = '4px';
        });
    }
}

// Inicialización global
window.dashboardMetricsEngine = null;
window.dashboardVisualEffects = null;

document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el DOM esté completamente cargado
    setTimeout(() => {
        window.dashboardMetricsEngine = new DashboardMetricsEngine();
        window.dashboardVisualEffects = new DashboardVisualEffects();
    }, 1000);
});

// Escuchar eventos del sistema para actualizaciones
window.addEventListener('tandasDataUpdate', () => {
    if (window.dashboardMetricsEngine) {
        window.dashboardMetricsEngine.forceUpdate();
    }
});

console.log('📊 Dashboard Metrics Engine loaded!');