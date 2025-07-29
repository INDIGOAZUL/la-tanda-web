/**
 * La Tanda - Aplicación Unificada
 * Sistema integrado completo con todos los componentes
 * Versión: 2.0.0
 */

class LaTandaUnifiedApp {
    constructor() {
        this.currentSection = 'welcome';
        this.userState = {
            authenticated: false,
            kycCompleted: false,
            walletConnected: false,
            hasGroups: false,
            userData: null
        };
        
        // URLs de los componentes
        this.componentUrls = {
            auth: 'auth-modern.html',
            kyc: 'kyc-registration.html',
            wallet: 'tanda-wallet.html',
            groups: 'group-security-demo.html',
            security: 'group-security-demo.html',
            dashboard: 'web3-dashboard.html'
        };
        
        // Estado de carga de componentes
        this.loadedComponents = new Set();
        
        this.init();
    }
    
    async init() {
        try {
            await this.setupEventListeners();
            await this.loadUserState();
            await this.hideLoadingScreen();
            
            console.log('🚀 La Tanda Unified App initialized');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.showError('Error inicializando la aplicación');
        }
    }
    
    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });
        
        // Menu toggle for mobile
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Listen for iframe messages
        window.addEventListener('message', (event) => {
            this.handleComponentMessage(event);
        });
        
        // Listen for auth state changes
        window.addEventListener('storage', (event) => {
            if (event.key === 'laTandaWeb3Auth') {
                this.handleAuthStateChange();
            }
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.section) {
                this.navigateToSection(event.state.section, false);
            }
        });
    }
    
    async loadUserState() {
        try {
            // Check localStorage for existing auth
            const authData = localStorage.getItem('laTandaWeb3Auth');
            if (authData) {
                const parsed = JSON.parse(authData);
                this.userState.authenticated = true;
                this.userState.userData = parsed.user;
                this.updateAuthStatus('success');
                this.updateUserInfo(parsed.user);
            }
            
            // Check KYC completion
            const kycData = localStorage.getItem('laTandaKYCData');
            if (kycData) {
                this.userState.kycCompleted = true;
                this.updateKYCStatus('success');
            }
            
            // Check wallet connection
            const walletData = localStorage.getItem('laTandaWalletData');
            if (walletData) {
                this.userState.walletConnected = true;
                this.updateWalletStatus('success');
            }
            
            // Update navigation based on state
            this.updateNavigationState();
            
        } catch (error) {
            console.error('Error loading user state:', error);
        }
    }
    
    async hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1500);
    }
    
    navigateToSection(section, pushState = true) {
        // Check if user can access this section
        if (!this.canAccessSection(section)) {
            this.showAccessDenied(section);
            return;
        }
        
        // Hide current section
        const currentSection = document.getElementById(this.currentSection);
        if (currentSection) {
            currentSection.classList.remove('active');
        }
        
        // Show new section
        const newSection = document.getElementById(section);
        if (newSection) {
            newSection.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update page title
        this.updatePageTitle(section);
        
        // Load component if needed
        this.loadComponentIfNeeded(section);
        
        // Update URL
        if (pushState) {
            history.pushState({ section }, '', `#${section}`);
        }
        
        this.currentSection = section;
    }
    
    canAccessSection(section) {
        switch (section) {
            case 'welcome':
                return true;
            case 'auth':
                return true;
            case 'kyc':
                return this.userState.authenticated;
            case 'wallet':
                return this.userState.authenticated && this.userState.kycCompleted;
            case 'groups':
                return this.userState.authenticated && this.userState.kycCompleted;
            case 'security':
                return this.userState.authenticated;
            case 'dashboard':
                return this.userState.authenticated && this.userState.kycCompleted && this.userState.walletConnected;
            default:
                return false;
        }
    }
    
    showAccessDenied(section) {
        const messages = {
            kyc: 'Debes autenticarte primero para acceder al registro KYC',
            wallet: 'Completa tu registro KYC para acceder a la wallet',
            groups: 'Completa tu registro KYC para acceder a los grupos',
            dashboard: 'Completa la autenticación, KYC y conexión de wallet para acceder al dashboard'
        };
        
        this.showNotification(messages[section] || 'Acceso denegado', 'warning');
        
        // Redirect to appropriate section
        if (!this.userState.authenticated) {
            this.navigateToSection('auth');
        } else if (!this.userState.kycCompleted) {
            this.navigateToSection('kyc');
        }
    }
    
    updatePageTitle(section) {
        const titles = {
            welcome: 'Ecosistema La Tanda',
            auth: 'Autenticación',
            kyc: 'Registro KYC',
            wallet: 'Wallet Web3',
            groups: 'Grupos & Tandas',
            security: 'Seguridad',
            dashboard: 'Dashboard Principal'
        };
        
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[section] || 'La Tanda';
        }
    }
    
    loadComponentIfNeeded(section) {
        if (this.loadedComponents.has(section) || section === 'welcome') {
            return;
        }
        
        const frameId = `${section}Frame`;
        const frame = document.getElementById(frameId);
        
        if (frame && this.componentUrls[section]) {
            frame.src = this.componentUrls[section];
            this.loadedComponents.add(section);
            
            // Add load event listener
            frame.addEventListener('load', () => {
                this.onComponentLoaded(section);
            });
        }
    }
    
    onComponentLoaded(section) {
        console.log(`✅ Component loaded: ${section}`);
        
        // Post initial state to component
        const frame = document.getElementById(`${section}Frame`);
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage({
                type: 'USER_STATE_UPDATE',
                userState: this.userState
            }, '*');
        }
    }
    
    handleComponentMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'AUTH_SUCCESS':
                this.handleAuthSuccess(data);
                break;
            case 'KYC_COMPLETED':
                this.handleKYCCompleted(data);
                break;
            case 'WALLET_CONNECTED':
                this.handleWalletConnected(data);
                break;
            case 'GROUP_JOINED':
                this.handleGroupJoined(data);
                break;
            case 'NAVIGATE_TO':
                this.navigateToSection(data.section);
                break;
            case 'SHOW_NOTIFICATION':
                this.showNotification(data.message, data.type);
                break;
        }
    }
    
    handleAuthSuccess(data) {
        this.userState.authenticated = true;
        this.userState.userData = data.user;
        this.updateAuthStatus('success');
        this.updateUserInfo(data.user);
        this.updateNavigationState();
        
        // Store auth data
        localStorage.setItem('laTandaWeb3Auth', JSON.stringify(data));
        
        this.showNotification('¡Autenticación exitosa! 🎉', 'success');
        
        // Auto-navigate to KYC if not completed
        if (!this.userState.kycCompleted) {
            setTimeout(() => {
                this.navigateToSection('kyc');
            }, 2000);
        }
    }
    
    handleKYCCompleted(data) {
        this.userState.kycCompleted = true;
        this.updateKYCStatus('success');
        this.updateNavigationState();
        
        // Store KYC data
        localStorage.setItem('laTandaKYCData', JSON.stringify(data));
        
        this.showNotification('¡Registro KYC completado! 🎉', 'success');
        
        // Auto-navigate to wallet
        setTimeout(() => {
            this.navigateToSection('wallet');
        }, 2000);
    }
    
    handleWalletConnected(data) {
        this.userState.walletConnected = true;
        this.updateWalletStatus('success');
        this.updateNavigationState();
        
        // Store wallet data
        localStorage.setItem('laTandaWalletData', JSON.stringify(data));
        
        this.showNotification('¡Wallet conectada exitosamente! 🎉', 'success');
        
        // Auto-navigate to dashboard
        setTimeout(() => {
            this.navigateToSection('dashboard');
        }, 2000);
    }
    
    handleGroupJoined(data) {
        this.userState.hasGroups = true;
        this.updateGroupsStatus('success');
        
        this.showNotification('¡Te uniste al grupo exitosamente! 🎉', 'success');
    }
    
    handleAuthStateChange() {
        // Reload user state when auth changes
        this.loadUserState();
    }
    
    updateAuthStatus(status) {
        this.updateStatusIndicator('authStatus', status);
    }
    
    updateKYCStatus(status) {
        this.updateStatusIndicator('kycStatus', status);
    }
    
    updateWalletStatus(status) {
        this.updateStatusIndicator('walletStatus', status);
    }
    
    updateGroupsStatus(status) {
        this.updateStatusIndicator('groupsStatus', status);
    }
    
    updateDashboardStatus(status) {
        this.updateStatusIndicator('dashboardStatus', status);
    }
    
    updateStatusIndicator(elementId, status) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Remove existing status classes
        element.classList.remove('status-pending', 'status-success', 'status-error');
        
        // Add new status class
        element.classList.add(`status-${status}`);
        
        // Update text and icon
        const statusMap = {
            pending: { text: 'Pendiente', icon: '⏳' },
            success: { text: 'Completado', icon: '✅' },
            error: { text: 'Error', icon: '❌' }
        };
        
        const statusInfo = statusMap[status];
        if (statusInfo) {
            element.innerHTML = `
                <span class="status-dot"></span>
                ${statusInfo.text}
            `;
        }
    }
    
    updateUserInfo(user) {
        const userInfo = document.getElementById('userInfo');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (userInfo && user) {
            userInfo.style.display = 'flex';
            
            if (userAvatar) {
                userAvatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
            }
            
            if (userName) {
                userName.textContent = user.name || user.email || 'Usuario';
            }
        }
    }
    
    updateNavigationState() {
        // Update navigation link states based on user progress
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const section = link.dataset.section;
            if (this.canAccessSection(section)) {
                link.classList.remove('disabled');
                link.style.opacity = '1';
                link.style.pointerEvents = 'auto';
            } else {
                link.classList.add('disabled');
                link.style.opacity = '0.5';
                link.style.pointerEvents = 'none';
            }
        });
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('visible');
        } else {
            sidebar.classList.toggle('hidden');
            mainContent.classList.toggle('expanded');
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
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
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    // Public methods for components to call
    goToAuth() {
        this.navigateToSection('auth');
    }
    
    goToKYC() {
        this.navigateToSection('kyc');
    }
    
    goToWallet() {
        this.navigateToSection('wallet');
    }
    
    goToDashboard() {
        this.navigateToSection('dashboard');
    }
    
    // Method to reset app state (for logout)
    logout() {
        // Clear all stored data
        localStorage.removeItem('laTandaWeb3Auth');
        localStorage.removeItem('laTandaKYCData');
        localStorage.removeItem('laTandaWalletData');
        
        // Reset user state
        this.userState = {
            authenticated: false,
            kycCompleted: false,
            walletConnected: false,
            hasGroups: false,
            userData: null
        };
        
        // Update UI
        this.updateAuthStatus('pending');
        this.updateKYCStatus('pending');
        this.updateWalletStatus('pending');
        this.updateGroupsStatus('pending');
        this.updateDashboardStatus('pending');
        
        // Hide user info
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.style.display = 'none';
        }
        
        // Navigate to welcome
        this.navigateToSection('welcome');
        
        this.showNotification('Sesión cerrada exitosamente', 'info');
    }
}

// CSS for animations
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LaTandaUnifiedApp();
});

// Export for global access
window.LaTandaUnifiedApp = LaTandaUnifiedApp;