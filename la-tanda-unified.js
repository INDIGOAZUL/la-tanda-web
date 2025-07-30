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
        
        // URLs de los componentes con API adapter - Phase 1 Complete
        this.componentUrls = {
            auth: 'auth-modern.html',
            kyc: 'kyc-registration.html',
            wallet: 'tanda-wallet.html',
            groups: 'groups-advanced-system.html',
            commissions: 'commission-system.html',
            tokens: 'ltd-token-economics.html',
            marketplace: 'marketplace-social.html',
            security: 'group-security-demo.html',
            dashboard: 'web3-dashboard.html'
        };
        
        // Asegurar que API adapter esté disponible
        this.ensureAPIAdapter();
        
        // Estado de carga de componentes
        this.loadedComponents = new Set();
        
        this.init();
    }
    
    async init() {
        try {
            this.initializeStatusIndicators();
            await this.setupEventListeners();
            await this.loadUserState();
            await this.hideLoadingScreen();
            
            console.log('🚀 La Tanda Unified App initialized');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.showError('Error inicializando la aplicación');
        }
    }
    
    initializeStatusIndicators() {
        // Initialize all status indicators to pending state
        console.log('🔄 Initializing status indicators...');
        
        const statusElements = ['authStatus', 'kycStatus', 'walletStatus', 'groupsStatus', 
                               'commissionsStatus', 'tokensStatus', 'marketplaceStatus', 'dashboardStatus'];
        
        statusElements.forEach(elementId => {
            this.updateStatusIndicator(elementId, 'pending');
        });
        
        console.log('✅ Status indicators initialized');
    }
    
    setupEventListeners() {
        // Use setTimeout to ensure DOM is fully loaded
        setTimeout(() => {
            // Navigation links
            const navLinks = document.querySelectorAll('.nav-link');
            console.log(`🔗 Setting up ${navLinks.length} navigation links`);
            
            navLinks.forEach(link => {
                // Remove existing listeners to avoid duplicates
                link.removeEventListener('click', this.handleNavClick);
                
                // Add new listener with proper context
                this.handleNavClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const section = link.dataset.section;
                    console.log(`🔍 Navigation clicked: ${section}`);
                    
                    if (section) {
                        // Check if link is disabled
                        if (link.classList.contains('disabled') || link.style.pointerEvents === 'none') {
                            console.log(`⚠️ Navigation disabled for section: ${section}`);
                            this.showAccessDenied(section);
                            return;
                        }
                        
                        this.navigateToSection(section);
                    }
                };
                
                link.addEventListener('click', this.handleNavClick);
            });
            
            // Menu toggle for mobile
            const menuToggle = document.getElementById('menuToggle');
            if (menuToggle) {
                menuToggle.addEventListener('click', () => {
                    this.toggleSidebar();
                });
            }
        }, 100);
        
        // Listen for iframe messages
        window.addEventListener('message', (event) => {
            this.handleComponentMessage(event);
        });
        
        // Listen for auth state changes
        window.addEventListener('storage', (event) => {
            if (event.key === 'laTandaWeb3Auth' || event.key === 'laTandaKYCData') {
                console.log('🔄 Storage change detected, reloading user state');
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
            console.log('🔄 Loading user state...');
            
            // Reset state first
            this.userState = {
                authenticated: false,
                kycCompleted: false,
                walletConnected: false,
                hasGroups: false,
                userData: null
            };
            
            // Check both localStorage and sessionStorage for existing auth
            const authData = localStorage.getItem('laTandaWeb3Auth') || sessionStorage.getItem('laTandaWeb3Auth');
            if (authData) {
                const parsed = JSON.parse(authData);
                this.userState.authenticated = true;
                this.userState.userData = parsed.user;
                this.updateAuthStatus('success');
                this.updateUserInfo(parsed.user);
                console.log('✅ Authentication found in storage:', parsed.user);
                
                // Also store in localStorage for consistency across components
                if (!localStorage.getItem('laTandaWeb3Auth')) {
                    localStorage.setItem('laTandaWeb3Auth', authData);
                    console.log('📦 Auth data synchronized to localStorage');
                }
            }
            
            // Check KYC completion with multiple patterns
            let kycCompleted = false;
            
            // Pattern 1: General KYC data (check both storage types)
            const kycData = localStorage.getItem('laTandaKYCData') || sessionStorage.getItem('laTandaKYCData');
            if (kycData) {
                const parsed = JSON.parse(kycData);
                if (parsed.completed || parsed.verification_level >= 1 || parsed.status === 'completed') {
                    kycCompleted = true;
                    console.log('✅ KYC completed (general pattern):', parsed);
                    
                    // Sync to localStorage for consistency
                    if (!localStorage.getItem('laTandaKYCData')) {
                        localStorage.setItem('laTandaKYCData', kycData);
                        console.log('📦 KYC data synchronized to localStorage');
                    }
                }
            }
            
            // Pattern 2: User-specific KYC data
            if (this.userState.userData) {
                const userKycKey = `kyc_status_${this.userState.userData.id}`;
                const userKycData = localStorage.getItem(userKycKey);
                if (userKycData) {
                    const parsed = JSON.parse(userKycData);
                    if (parsed.completed || parsed.verification_level >= 1 || parsed.status === 'completed') {
                        kycCompleted = true;
                        console.log('✅ KYC completed (user-specific pattern):', parsed);
                    }
                }
            }
            
            // Pattern 3: Check all localStorage keys for KYC
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('kyc') || key.includes('KYC')) {
                    const data = localStorage.getItem(key);
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.completed || parsed.verification_level >= 1 || parsed.status === 'completed') {
                            kycCompleted = true;
                            console.log('✅ KYC completed (pattern search):', key, parsed);
                            break;
                        }
                    } catch (e) {
                        // Skip non-JSON data
                    }
                }
            }
            
            this.userState.kycCompleted = kycCompleted;
            if (kycCompleted) {
                this.updateKYCStatus('success');
            }
            
            // Check wallet connection (check both storage types)
            const walletData = localStorage.getItem('laTandaWalletData') || sessionStorage.getItem('laTandaWalletData');
            if (walletData) {
                this.userState.walletConnected = true;
                this.updateWalletStatus('success');
                console.log('✅ Wallet connected');
                
                // Sync to localStorage for consistency
                if (!localStorage.getItem('laTandaWalletData')) {
                    localStorage.setItem('laTandaWalletData', walletData);
                    console.log('📦 Wallet data synchronized to localStorage');
                }
            }
            
            // Update status for new components based on KYC completion
            if (this.userState.kycCompleted) {
                this.updateCommissionsStatus('success');
                this.updateTokensStatus('success');
                this.updateMarketplaceStatus('success');
                console.log('✅ Advanced features unlocked');
            }
            
            // Update navigation based on state
            this.updateNavigationState();
            
            console.log('📊 Final user state:', this.userState);
            
        } catch (error) {
            console.error('❌ Error loading user state:', error);
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
        const result = (() => {
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
                case 'commissions':
                    return this.userState.authenticated && this.userState.kycCompleted;
                case 'tokens':
                    return this.userState.authenticated && this.userState.kycCompleted;
                case 'marketplace':
                    return this.userState.authenticated && this.userState.kycCompleted;
                case 'security':
                    return this.userState.authenticated;
                case 'dashboard':
                    return this.userState.authenticated && this.userState.kycCompleted && this.userState.walletConnected;
                default:
                    return false;
            }
        })();
        
        console.log(`🔐 Access check for ${section}: ${result} (auth: ${this.userState.authenticated}, kyc: ${this.userState.kycCompleted}, wallet: ${this.userState.walletConnected})`);
        return result;
    }
    
    showAccessDenied(section) {
        const messages = {
            kyc: 'Debes autenticarte primero para acceder al registro KYC',
            wallet: 'Completa tu registro KYC para acceder a la wallet',
            groups: 'Completa tu registro KYC para acceder a los grupos',
            commissions: 'Completa tu registro KYC para acceder al sistema de comisiones',
            tokens: 'Completa tu registro KYC para acceder al sistema de tokens',
            marketplace: 'Completa tu registro KYC para acceder al marketplace',
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
            groups: 'Grupos & Tandas Avanzado',
            commissions: 'Sistema de Comisiones 90/10',
            tokens: 'LTD Token Economics',
            marketplace: 'Marketplace & Social',
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
                this.injectAPIAdapter(frame);
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
            case 'AUTH_ERROR':
                this.handleAuthError(data);
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
        console.log('🎉 Auth Success received:', data);
        
        this.userState.authenticated = true;
        this.userState.userData = data.user;
        this.updateAuthStatus('success');
        this.updateUserInfo(data.user);
        
        // Handle KYC status from auth component
        if (data.kycCompleted) {
            this.userState.kycCompleted = true;
            this.updateKYCStatus('success');
            
            // Update all component statuses since KYC unlocks advanced features
            this.updateCommissionsStatus('success');
            this.updateTokensStatus('success');
            this.updateMarketplaceStatus('success');
            
            console.log('✅ KYC already completed for user');
        }
        
        this.updateNavigationState();
        
        // Store auth data in both storage types for consistency
        const authData = {
            user: data.user,
            loginTime: Date.now(),
            kycCompleted: data.kycCompleted || false,
            kycLevel: data.kycLevel || 0
        };
        
        localStorage.setItem('laTandaWeb3Auth', JSON.stringify(authData));
        sessionStorage.setItem('laTandaWeb3Auth', JSON.stringify(authData));
        
        this.showNotification('¡Autenticación exitosa! 🎉', 'success');
        
        // Navigate based on KYC status
        if (data.kycCompleted) {
            setTimeout(() => {
                this.navigateToSection('wallet');
            }, 2000);
        } else {
            setTimeout(() => {
                this.navigateToSection('kyc');
            }, 2000);
        }
    }
    
    handleAuthError(data) {
        console.error('❌ Auth Error received:', data);
        this.showNotification('Error en la autenticación: ' + (data.error || 'Error desconocido'), 'error');
    }
    
    handleKYCCompleted(data) {
        console.log('🎉 KYC Completed!', data);
        
        this.userState.kycCompleted = true;
        this.updateKYCStatus('success');
        
        // Store KYC data with multiple patterns for reliability
        localStorage.setItem('laTandaKYCData', JSON.stringify({...data, completed: true, status: 'completed'}));
        
        if (this.userState.userData) {
            const userKycKey = `kyc_status_${this.userState.userData.id}`;
            localStorage.setItem(userKycKey, JSON.stringify({...data, completed: true, status: 'completed'}));
        }
        
        // Update all component statuses since KYC unlocks advanced features
        this.updateCommissionsStatus('success');
        this.updateTokensStatus('success');
        this.updateMarketplaceStatus('success');
        
        // Force navigation state update
        this.updateNavigationState();
        
        this.showNotification('¡Registro KYC completado! 🎉 Funciones avanzadas desbloqueadas', 'success');
        
        // Auto-navigate to wallet with a longer delay to show the success state
        setTimeout(() => {
            this.navigateToSection('wallet');
        }, 3000);
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
    
    updateCommissionsStatus(status) {
        this.updateStatusIndicator('commissionsStatus', status);
    }
    
    updateTokensStatus(status) {
        this.updateStatusIndicator('tokensStatus', status);
    }
    
    updateMarketplaceStatus(status) {
        this.updateStatusIndicator('marketplaceStatus', status);
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
        console.log('👤 Updating user info:', user);
        
        const userInfo = document.getElementById('userInfo');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (userInfo && user) {
            // Make sure user info is visible
            userInfo.style.display = 'flex';
            userInfo.style.visibility = 'visible';
            
            if (userAvatar) {
                const avatarText = user.name ? user.name.charAt(0).toUpperCase() : 
                                 user.email ? user.email.charAt(0).toUpperCase() : 'U';
                userAvatar.textContent = avatarText;
                console.log('✅ Avatar updated:', avatarText);
            }
            
            if (userName) {
                const displayName = user.name || user.email || 'Usuario';
                userName.textContent = displayName;
                console.log('✅ Username updated:', displayName);
            }
            
            console.log('✅ User info display updated');
        } else {
            console.log('❌ Cannot update user info - missing elements or user data');
            if (!userInfo) console.log('❌ userInfo element not found');
            if (!user) console.log('❌ user data not provided');
        }
    }
    
    updateNavigationState() {
        console.log('🔄 Updating navigation state...');
        
        // Update navigation link states based on user progress
        const navLinks = document.querySelectorAll('.nav-link');
        console.log(`🔗 Found ${navLinks.length} navigation links`);
        
        navLinks.forEach(link => {
            const section = link.dataset.section;
            const canAccess = this.canAccessSection(section);
            
            console.log(`🔍 Section: ${section}, Can Access: ${canAccess}`);
            
            if (canAccess) {
                link.classList.remove('disabled');
                link.style.opacity = '1';
                link.style.pointerEvents = 'auto';
                link.style.cursor = 'pointer';
                
                // Remove any disabled attributes
                link.removeAttribute('disabled');
            } else {
                link.classList.add('disabled');
                link.style.opacity = '0.5';
                link.style.pointerEvents = 'none';
                link.style.cursor = 'not-allowed';
            }
        });
        
        console.log('✅ Navigation state updated');
    }
    
    refreshNavigationListeners() {
        // Only refresh the navigation click listeners without full setup
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            // Only add listener if it's not disabled and doesn't already have one
            if (!link.classList.contains('disabled') && !link.hasAttribute('data-listener-added')) {
                const handleClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const section = link.dataset.section;
                    console.log(`🔍 Navigation clicked: ${section}`);
                    
                    if (section && this.canAccessSection(section)) {
                        this.navigateToSection(section);
                    } else {
                        this.showAccessDenied(section);
                    }
                };
                
                link.addEventListener('click', handleClick);
                link.setAttribute('data-listener-added', 'true');
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
    
    // API Adapter Integration Methods
    ensureAPIAdapter() {
        // Ensure API adapter scripts are loaded
        if (typeof window.laTandaAPIAdapter === 'undefined') {
            this.loadAPIAdapterScripts();
        }
    }
    
    loadAPIAdapterScripts() {
        // Load API endpoints config
        const configScript = document.createElement('script');
        configScript.src = 'api-endpoints-config.js';
        configScript.onload = () => {
            // Load API adapter after config
            const adapterScript = document.createElement('script');
            adapterScript.src = 'api-adapter.js';
            document.head.appendChild(adapterScript);
        };
        document.head.appendChild(configScript);
    }
    
    injectAPIAdapter(iframe) {
        // Inject API adapter into iframe when it loads
        try {
            iframe.addEventListener('load', () => {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                
                // Inject API adapter scripts into iframe
                const configScript = iframeDoc.createElement('script');
                configScript.src = '../api-endpoints-config.js';
                
                const adapterScript = iframeDoc.createElement('script');
                adapterScript.src = '../api-adapter.js';
                
                iframeDoc.head.appendChild(configScript);
                
                configScript.onload = () => {
                    iframeDoc.head.appendChild(adapterScript);
                };
                
                console.log(`🔄 API Adapter injected into ${iframe.id}`);
            });
        } catch (error) {
            console.warn('Cannot inject API adapter into iframe:', error);
        }
    }
    
    // Test API connectivity
    async testAPIConnectivity() {
        try {
            if (window.laTandaAPIAdapter) {
                const results = await window.laTandaAPIAdapter.testRealEndpoints();
                console.table(results);
                return results;
            } else {
                console.warn('API Adapter not available');
                return null;
            }
        } catch (error) {
            console.error('API connectivity test failed:', error);
            return null;
        }
    }
    
    // Cleanup method for troubleshooting
    cleanupEventListeners() {
        console.log('🧹 Cleaning up event listeners...');
        
        // Remove all existing navigation event listeners
        document.querySelectorAll('.nav-link').forEach(link => {
            // Clone and replace to remove all event listeners
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });
        
        // Re-setup clean event listeners
        this.setupEventListeners();
        
        console.log('✅ Event listeners cleaned up and re-setup');
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

// Add global method for troubleshooting
window.cleanupApp = function() {
    if (window.app && window.app.cleanupEventListeners) {
        window.app.cleanupEventListeners();
    }
};