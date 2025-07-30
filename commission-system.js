/**
 * La Tanda - Sistema de Comisiones Descendentes 90/10
 * Gestión completa de comisiones piramidales con distribución automática
 * Versión: 2.0.0
 */

class CommissionSystem {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = this.getCurrentUser();
        
        // Configuración del sistema de comisiones
        this.commissionRates = {
            direct: 0.90,      // 90% para coordinador directo
            level2: 0.05,      // 5% para nivel 2
            level3: 0.03,      // 3% para nivel 3
            level4Plus: 0.02   // 2% para nivel 4+
        };
        
        this.baseCommissionRate = 0.10; // 10% de comisión sobre transacciones
        
        // Estado del sistema
        this.userCommissions = {
            totalEarnings: 0,
            monthlyEarnings: 0,
            activeReferrals: 0,
            commissionLevel: 1,
            monthlyGrowth: 0
        };
        
        this.referrals = [];
        this.earnings = [];
        this.upcomingDistributions = [];
        
        this.init();
    }
    
    async init() {
        try {
            this.setupEventListeners();
            await this.loadUserCommissionData();
            await this.loadReferrals();
            await this.loadEarnings();
            this.updateDashboard();
            this.setupCalculator();
            
            console.log('💰 Commission System initialized');
        } catch (error) {
            console.error('❌ Error initializing commission system:', error);
            this.showNotification('Error inicializando el sistema de comisiones', 'error');
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
        
        // Calculator inputs
        const calculatorInputs = ['directReferrals', 'avgContribution', 'level2Referrals', 'level3Referrals'];
        calculatorInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => {
                    this.calculateCommissions();
                });
            }
        });
        
        // Earnings filter
        const earningsFilter = document.getElementById('earningsFilter');
        if (earningsFilter) {
            earningsFilter.addEventListener('change', (e) => {
                this.filterEarnings(e.target.value);
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
                this.updateDashboard();
                break;
            case 'my-network':
                this.renderNetworkTree();
                break;
            case 'earnings':
                this.loadEarningsHistory();
                break;
            case 'referrals':
                this.loadReferralsData();
                break;
            case 'calculator':
                this.calculateCommissions();
                break;
            case 'reports':
                this.loadReports();
                break;
        }
    }
    
    async loadUserCommissionData() {
        try {
            // En un entorno real, esto vendría de la API
            const mockCommissionData = {
                totalEarnings: 2700,
                monthlyEarnings: 495,
                activeReferrals: 8,
                commissionLevel: 3,
                monthlyGrowth: 15.2,
                directCommissions: 2430,
                level2Commissions: 135,
                level3Commissions: 81,
                level4Commissions: 54
            };
            
            this.userCommissions = mockCommissionData;
            this.updateCommissionStats();
        } catch (error) {
            console.error('Error loading commission data:', error);
        }
    }
    
    updateCommissionStats() {
        document.getElementById('totalEarnings').textContent = `$${this.userCommissions.totalEarnings.toLocaleString()}`;
        document.getElementById('activeReferrals').textContent = this.userCommissions.activeReferrals;
        document.getElementById('commissionLevel').textContent = this.userCommissions.commissionLevel;
        document.getElementById('monthlyGrowth').textContent = `${this.userCommissions.monthlyGrowth}%`;
    }
    
    async loadReferrals() {
        try {
            const mockReferrals = [
                {
                    id: 'ref_001',
                    name: 'María López',
                    email: 'maria@example.com',
                    joinDate: '2024-01-15',
                    status: 'active',
                    monthlyCommission: 180,
                    totalGenerated: 2160,
                    level: 1,
                    avatar: 'M'
                },
                {
                    id: 'ref_002',
                    name: 'Juan Pérez',
                    email: 'juan@example.com',
                    joinDate: '2024-01-22',
                    status: 'active',
                    monthlyCommission: 150,
                    totalGenerated: 1800,
                    level: 1,
                    avatar: 'J'
                },
                {
                    id: 'ref_003',
                    name: 'Ana García',
                    email: 'ana@example.com',
                    joinDate: '2024-02-05',
                    status: 'active',
                    monthlyCommission: 120,
                    totalGenerated: 480,
                    level: 1,
                    avatar: 'A'
                },
                {
                    id: 'ref_004',
                    name: 'Carlos Ruiz',
                    email: 'carlos@example.com',
                    joinDate: '2024-01-30',
                    status: 'active',
                    monthlyCommission: 45,
                    totalGenerated: 495,
                    level: 2,
                    avatar: 'C'
                },
                {
                    id: 'ref_005',
                    name: 'Laura Silva',
                    email: 'laura@example.com',
                    joinDate: '2024-02-10',
                    status: 'active',
                    monthlyCommission: 60,
                    totalGenerated: 240,
                    level: 2,
                    avatar: 'L'
                }
            ];
            
            this.referrals = mockReferrals;
        } catch (error) {
            console.error('Error loading referrals:', error);
        }
    }
    
    async loadEarnings() {
        try {
            const mockEarnings = [
                {
                    id: 'earn_001',
                    date: '2024-02-15',
                    source: 'Cooperativa Central',
                    type: 'Comisión Directa',
                    level: 1,
                    amount: 180,
                    status: 'paid',
                    referralId: 'ref_001'
                },
                {
                    id: 'earn_002',
                    date: '2024-02-10',
                    source: 'Red de María',
                    type: 'Comisión Nivel 2',
                    level: 2,
                    amount: 45,
                    status: 'paid',
                    referralId: 'ref_004'
                },
                {
                    id: 'earn_003',
                    date: '2024-02-05',
                    source: 'Profesionales Tech',
                    type: 'Comisión Directa',
                    level: 1,
                    amount: 120,
                    status: 'paid',
                    referralId: 'ref_003'
                },
                {
                    id: 'earn_004',
                    date: '2024-02-20',
                    source: 'Red de Juan',
                    type: 'Comisión Nivel 2',
                    level: 2,
                    amount: 60,
                    status: 'pending',
                    referralId: 'ref_005'
                },
                {
                    id: 'earn_005',
                    date: '2024-02-25',
                    source: 'Familia Extendida',
                    type: 'Comisión Directa',
                    level: 1,
                    amount: 90,
                    status: 'pending',
                    referralId: 'ref_002'
                }
            ];
            
            this.earnings = mockEarnings;
            this.loadUpcomingDistributions();
        } catch (error) {
            console.error('Error loading earnings:', error);
        }
    }
    
    loadUpcomingDistributions() {
        this.upcomingDistributions = this.earnings
            .filter(earning => earning.status === 'pending')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);
    }
    
    updateDashboard() {
        this.updateCommissionStats();
        this.renderUpcomingDistributions();
    }
    
    renderUpcomingDistributions() {
        const container = document.getElementById('upcomingDistributions');
        if (!container) return;
        
        if (this.upcomingDistributions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">📅</div>
                    <h3>No hay distribuciones pendientes</h3>
                    <p>Las próximas comisiones aparecerán aquí</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.upcomingDistributions.map(distribution => `
            <div style="display: flex; justify-content: between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                <div>
                    <div style="font-weight: 600;">${distribution.source}</div>
                    <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">Pago del ${this.formatDate(distribution.date)}</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #F59E0B; font-weight: 600;">$${distribution.amount}</div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">${distribution.type}</div>
                </div>
            </div>
        `).join('');
    }
    
    renderNetworkTree() {
        // El árbol ya está renderizado en el HTML
        // Aquí podríamos actualizar con datos dinámicos
        console.log('Network tree rendered with current referrals data');
    }
    
    loadEarningsHistory() {
        const tbody = document.getElementById('earningsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = this.earnings.map(earning => `
            <tr>
                <td>${this.formatDate(earning.date)}</td>
                <td>${earning.source}</td>
                <td>${earning.type}</td>
                <td>${earning.level}</td>
                <td style="color: ${earning.status === 'paid' ? '#10B981' : '#F59E0B'}; font-weight: 600;">$${earning.amount.toFixed(2)}</td>
                <td>
                    <span style="padding: 4px 12px; background: rgba(${earning.status === 'paid' ? '16, 185, 129' : '245, 158, 11'}, 0.2); color: ${earning.status === 'paid' ? '#10B981' : '#F59E0B'}; border-radius: 20px; font-size: 12px;">
                        ${earning.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                </td>
            </tr>
        `).join('');
    }
    
    filterEarnings(period) {
        let filteredEarnings = [...this.earnings];
        const now = new Date();
        
        switch (period) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredEarnings = this.earnings.filter(earning => new Date(earning.date) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                filteredEarnings = this.earnings.filter(earning => new Date(earning.date) >= monthAgo);
                break;
            case 'quarter':
                const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                filteredEarnings = this.earnings.filter(earning => new Date(earning.date) >= quarterAgo);
                break;
        }
        
        // Update table with filtered data
        const tbody = document.getElementById('earningsTableBody');
        if (tbody) {
            tbody.innerHTML = filteredEarnings.map(earning => `
                <tr>
                    <td>${this.formatDate(earning.date)}</td>
                    <td>${earning.source}</td>
                    <td>${earning.type}</td>
                    <td>${earning.level}</td>
                    <td style="color: ${earning.status === 'paid' ? '#10B981' : '#F59E0B'}; font-weight: 600;">$${earning.amount.toFixed(2)}</td>
                    <td>
                        <span style="padding: 4px 12px; background: rgba(${earning.status === 'paid' ? '16, 185, 129' : '245, 158, 11'}, 0.2); color: ${earning.status === 'paid' ? '#10B981' : '#F59E0B'}; border-radius: 20px; font-size: 12px;">
                            ${earning.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    loadReferralsData() {
        // Los referidos ya están cargados y se muestran en el HTML
        console.log('Referrals data loaded:', this.referrals.length, 'referrals');
    }
    
    setupCalculator() {
        // Initialize calculator with default values
        this.calculateCommissions();
    }
    
    calculateCommissions() {
        const directReferrals = parseInt(document.getElementById('directReferrals').value) || 0;
        const avgContribution = parseFloat(document.getElementById('avgContribution').value) || 0;
        const level2Referrals = parseInt(document.getElementById('level2Referrals').value) || 0;
        const level3Referrals = parseInt(document.getElementById('level3Referrals').value) || 0;
        
        // Calculate commissions based on 10% base rate
        const baseCommission = avgContribution * this.baseCommissionRate;
        
        const directCommissions = directReferrals * baseCommission * this.commissionRates.direct;
        const level2Commissions = level2Referrals * baseCommission * this.commissionRates.level2;
        const level3Commissions = level3Referrals * baseCommission * this.commissionRates.level3;
        
        const totalCommissions = directCommissions + level2Commissions + level3Commissions;
        const annualCommissions = totalCommissions * 12;
        
        // Update display
        document.getElementById('directCommissions').textContent = `$${directCommissions.toFixed(0)}`;
        document.getElementById('level2Commissions').textContent = `$${level2Commissions.toFixed(0)}`;
        document.getElementById('level3Commissions').textContent = `$${level3Commissions.toFixed(0)}`;
        document.getElementById('totalCommissions').textContent = `$${totalCommissions.toFixed(0)}`;
        document.getElementById('annualCommissions').textContent = `$${annualCommissions.toLocaleString()}`;
    }
    
    loadReports() {
        // En un entorno real, aquí cargaríamos gráficos y métricas avanzadas
        console.log('Loading advanced reports and analytics...');
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
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#F59E0B'};
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
    
    // Commission calculation methods
    calculateCommissionForUser(userId, transactionAmount) {
        const baseCommission = transactionAmount * this.baseCommissionRate;
        const userLevel = this.getUserLevel(userId);
        
        switch (userLevel) {
            case 1:
                return baseCommission * this.commissionRates.direct;
            case 2:
                return baseCommission * this.commissionRates.level2;
            case 3:
                return baseCommission * this.commissionRates.level3;
            default:
                return baseCommission * this.commissionRates.level4Plus;
        }
    }
    
    getUserLevel(userId) {
        // En un entorno real, esto vendría de la base de datos
        return 1; // Default level
    }
    
    async distributeCommissions(transactionId, amount) {
        try {
            // Simulate commission distribution API call
            const commissionData = {
                transactionId,
                totalCommission: amount * this.baseCommissionRate,
                distributions: [
                    {
                        userId: this.currentUser.id,
                        level: 1,
                        amount: amount * this.baseCommissionRate * this.commissionRates.direct,
                        type: 'direct'
                    }
                    // Add more levels as needed
                ]
            };
            
            console.log('Commission distribution:', commissionData);
            return commissionData;
        } catch (error) {
            console.error('Error distributing commissions:', error);
            throw error;
        }
    }
}

// Global functions for UI interactions
function copyReferralCode() {
    const codeInput = document.getElementById('referralCode');
    codeInput.select();
    document.execCommand('copy');
    window.commissionSystem?.showNotification('Código copiado al portapapeles', 'success');
}

function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    document.execCommand('copy');
    window.commissionSystem?.showNotification('Enlace copiado al portapapeles', 'success');
}

function shareReferralLink() {
    const link = document.getElementById('referralLink').value;
    if (navigator.share) {
        navigator.share({
            title: 'Únete a La Tanda',
            text: '¡Únete a La Tanda y empieza a ahorrar con nosotros!',
            url: link
        });
    } else {
        copyReferralLink();
    }
}

function calculateCommissions() {
    if (window.commissionSystem) {
        window.commissionSystem.calculateCommissions();
    }
}

function downloadReport() {
    window.commissionSystem?.showNotification('Generando reporte PDF...', 'info');
    // Simulate PDF generation
    setTimeout(() => {
        window.commissionSystem?.showNotification('Reporte descargado exitosamente', 'success');
    }, 2000);
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
    window.commissionSystem = new CommissionSystem();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommissionSystem;
}