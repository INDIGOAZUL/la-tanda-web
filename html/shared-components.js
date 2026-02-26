/* ================================
   🌟 LA TANDA CHAIN SHARED COMPONENTS JS
   ================================ */

class LaTandaComponents {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.walletConnected = false;
        this.notifications = [];
        this.init();
    }

    init() {
        this.setupWalletConnection();
        this.setupNotifications();
        this.setupThemeToggle();
        this.setupMobileMenu();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('home-dashboard')) return 'home';
        if (path.includes('groups-advanced-system')) return 'groups';
        if (path.includes('tanda-wallet')) return 'wallet';
        if (path.includes('marketplace-social')) return 'marketplace';
        if (path.includes('web3-dashboard')) return 'defi';
        if (path.includes('kyc-registration')) return 'kyc';
        return 'home';
    }

    createHeader() {
        return `
            <header class="latanda-header">
                <div class="header-container">
                    <a href="home-dashboard.html" class="header-brand">
                        <div class="brand-logo">
                            <img src="La Tanda logos (3).png" alt="La Tanda Logo" onerror="this.style.display='none'; this.parentElement.innerHTML='LT';">
                        </div>
                        <div class="brand-info">
                            <h1>La Tanda</h1>
                            <p data-translate="dashboard.web3_protocol">Web3 Protocol</p>
                        </div>
                    </a>

                    <nav class="header-nav">
                        <ul class="nav-links">
                            <li>
                                <a href="home-dashboard.html" class="nav-link ${this.currentPage === 'home' ? 'active' : ''}">
                                    <i class="fas fa-home"></i>
                                    <span data-translate="nav.dashboard">Dashboard</span>
                                </a>
                            </li>
                            <li>
                                <a href="groups-advanced-system.html" class="nav-link ${this.currentPage === 'groups' ? 'active' : ''}">
                                    <i class="fas fa-users"></i>
                                    <span data-translate="nav.groups">Grupos</span>
                                </a>
                            </li>
                            <li>
                                <a href="tanda-wallet.html" class="nav-link ${this.currentPage === 'wallet' ? 'active' : ''}">
                                    <i class="fas fa-wallet"></i>
                                    <span data-translate="nav.wallet">Wallet</span>
                                </a>
                            </li>
                            <li>
                                <a href="marketplace-social.html" class="nav-link ${this.currentPage === 'marketplace' ? 'active' : ''}">
                                    <i class="fas fa-store"></i>
                                    <span data-translate="nav.marketplace">Marketplace</span>
                                </a>
                            </li>
                            <li>
                                <a href="web3-dashboard.html" class="nav-link ${this.currentPage === 'defi' ? 'active' : ''}">
                                    <i class="fas fa-coins"></i>
                                    <span data-translate="nav.defi">DeFi</span>
                                </a>
                            </li>
                        </ul>
                    </nav>

                    <div class="header-actions">
                        <!-- Language Selector -->
                        <div id="headerLanguageSelector" class="header-language-selector">
                            <!-- Generated dynamically by translation system -->
                        </div>

                        <!-- Notifications -->
                        <button class="header-action-btn" onclick="laTandaComponents.toggleNotifications()" 
                                title="Notificaciones" data-translate-title="nav.notifications">
                            <i class="fas fa-bell"></i>
                            <span class="notification-badge" id="notificationCount" style="display: none;">0</span>
                        </button>

                        <!-- Search -->
                        <button class="header-action-btn" onclick="laTandaComponents.toggleSearch()" 
                                title="Buscar" data-translate-title="common.search">
                            <i class="fas fa-search"></i>
                        </button>

                        <!-- Theme Toggle -->
                        <button class="header-action-btn" onclick="laTandaComponents.toggleTheme()" 
                                title="Cambiar tema" data-translate-title="settings.change_theme">
                            <i class="fas fa-moon" id="themeIcon"></i>
                        </button>

                        <!-- Wallet Connection -->
                        <div id="walletSection">
                            ${this.walletConnected ? this.createWalletInfo() : this.createWalletConnectButton()}
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    createWalletConnectButton() {
        return `
            <button class="wallet-connect-btn" onclick="laTandaComponents.connectWallet()">
                <i class="fas fa-wallet"></i>
                <span data-translate="wallet.connect_wallet">Conectar Wallet</span>
            </button>
        `;
    }

    createWalletInfo() {
        return `
            <div class="wallet-info" onclick="laTandaComponents.toggleWalletDetails()">
                <div class="wallet-address">0x1234...5678</div>
                <div class="wallet-balance">24,567.89 LTD</div>
            </div>
        `;
    }

    createFooter() {
        return `
            <footer class="latanda-footer">
                <div class="footer-container">
                    <div class="footer-content">
                        <div class="footer-brand">
                            <div class="footer-brand-info">
                                <div class="footer-logo">
                                    <img src="La Tanda logos (3).png" alt="La Tanda Logo" onerror="this.style.display='none'; this.parentElement.innerHTML='LT';">
                                </div>
                                <div class="footer-brand-text">
                                    <h3>La Tanda Chain</h3>
                                    <p data-translate="footer.tagline">Web3 DeFi Ecosystem</p>
                                </div>
                            </div>
                            <p class="footer-description" data-translate="footer.description">
                                La primera plataforma descentralizada que combina las tradiciones financieras latinoamericanas 
                                con la tecnología blockchain más avanzada.
                            </p>
                            <div class="footer-social">
                                <a href="#" class="social-link" title="Twitter">
                                    <i class="fab fa-twitter"></i>
                                </a>
                                <a href="#" class="social-link" title="Discord">
                                    <i class="fab fa-discord"></i>
                                </a>
                                <a href="#" class="social-link" title="Telegram">
                                    <i class="fab fa-telegram"></i>
                                </a>
                                <a href="#" class="social-link" title="GitHub">
                                    <i class="fab fa-github"></i>
                                </a>
                                <a href="#" class="social-link" title="Medium">
                                    <i class="fab fa-medium"></i>
                                </a>
                            </div>
                        </div>

                        <div class="footer-section">
                            <h4 data-translate="footer.platform">Plataforma</h4>
                            <ul class="footer-links">
                                <li><a href="groups-advanced-system.html">
                                    <i class="fas fa-users"></i>
                                    <span data-translate="nav.groups">Grupos & Tandas</span>
                                </a></li>
                                <li><a href="tanda-wallet.html">
                                    <i class="fas fa-wallet"></i>
                                    <span data-translate="nav.wallet">Wallet Web3</span>
                                </a></li>
                                <li><a href="marketplace-social.html">
                                    <i class="fas fa-store"></i>
                                    <span data-translate="nav.marketplace">Marketplace</span>
                                </a></li>
                                <li><a href="web3-dashboard.html">
                                    <i class="fas fa-coins"></i>
                                    <span data-translate="nav.defi">DeFi Hub</span>
                                </a></li>
                                <li><a href="kyc-registration.html">
                                    <i class="fas fa-user-check"></i>
                                    <span data-translate="nav.kyc_verification">Verificación KYC</span>
                                </a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h4 data-translate="footer.ecosystem">Ecosistema</h4>
                            <ul class="footer-links">
                                <li><a href="ltd-token-economics.html">
                                    <i class="fas fa-coins"></i>
                                    <span data-translate="footer.tokenomics">Tokenomics LTD</span>
                                </a></li>
                                <li><a href="governance.html">
                                    <i class="fas fa-vote-yea"></i>
                                    <span data-translate="footer.governance">Governance</span>
                                </a></li>
                                <li><a href="staking.html">
                                    <i class="fas fa-piggy-bank"></i>
                                    <span data-translate="footer.staking">Staking</span>
                                </a></li>
                                <li><a href="nft-memberships.html">
                                    <i class="fas fa-certificate"></i>
                                    <span data-translate="footer.nft">NFT Membresías</span>
                                </a></li>
                                <li><a href="bridge.html">
                                    <i class="fas fa-exchange-alt"></i>
                                    <span data-translate="footer.bridge">Cross-Chain Bridge</span>
                                </a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h4 data-translate="footer.resources">Recursos</h4>
                            <ul class="footer-links">
                                <li><a href="documentation.html">
                                    <i class="fas fa-book"></i>
                                    <span data-translate="footer.docs">Documentación</span>
                                </a></li>
                                <li><a href="api-documentation.html">
                                    <i class="fas fa-code"></i>
                                    <span data-translate="footer.api">API Docs</span>
                                </a></li>
                                <li><a href="security-audit.html">
                                    <i class="fas fa-shield-alt"></i>
                                    <span data-translate="footer.security">Auditoría de Seguridad</span>
                                </a></li>
                                <li><a href="whitepaper.html">
                                    <i class="fas fa-file-alt"></i>
                                    <span data-translate="footer.whitepaper">Whitepaper</span>
                                </a></li>
                                <li><a href="roadmap.html">
                                    <i class="fas fa-route"></i>
                                    <span data-translate="footer.roadmap">Roadmap</span>
                                </a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h4 data-translate="footer.support">Soporte</h4>
                            <ul class="footer-links">
                                <li><a href="help-center.html">
                                    <i class="fas fa-question-circle"></i>
                                    <span data-translate="footer.help">Centro de Ayuda</span>
                                </a></li>
                                <li><a href="community.html">
                                    <i class="fas fa-users"></i>
                                    <span data-translate="footer.community">Comunidad</span>
                                </a></li>
                                <li><a href="contact.html">
                                    <i class="fas fa-envelope"></i>
                                    <span data-translate="footer.contact">Contacto</span>
                                </a></li>
                                <li><a href="bug-report.html">
                                    <i class="fas fa-bug"></i>
                                    <span data-translate="footer.bug_report">Reportar Bug</span>
                                </a></li>
                                <li><a href="feature-request.html">
                                    <i class="fas fa-lightbulb"></i>
                                    <span data-translate="footer.feature_request">Sugerir Función</span>
                                </a></li>
                            </ul>
                        </div>
                    </div>

                    <div class="footer-bottom">
                        <div class="footer-bottom-left">
                            <div class="copyright">
                                © 2024 La Tanda Chain. <span data-translate="footer.rights">Todos los derechos reservados.</span>
                            </div>
                            <div class="footer-links" style="display: flex; gap: 24px; margin: 0;">
                                <a href="privacy-policy.html" data-translate="footer.privacy">Política de Privacidad</a>
                                <a href="terms-of-service.html" data-translate="footer.terms">Términos de Servicio</a>
                                <a href="cookie-policy.html" data-translate="footer.cookies">Política de Cookies</a>
                            </div>
                        </div>

                        <div class="footer-bottom-right">
                            <div class="network-status">
                                <div class="status-dot"></div>
                                <span data-translate="footer.network_status">La Tanda Chain: Operativo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }

    // Wallet Functions
    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                this.walletConnected = true;
                this.updateWalletSection();
                this.showNotification('success', 'Wallet conectada exitosamente');
            } else {
                this.showNotification('error', 'MetaMask no está instalado');
            }
        } catch (error) {
            console.error('Error conectando wallet:', error);
            this.showNotification('error', 'Error al conectar wallet');
        }
    }

    updateWalletSection() {
        const walletSection = document.getElementById('walletSection');
        if (walletSection) {
            walletSection.innerHTML = this.walletConnected ? 
                this.createWalletInfo() : 
                this.createWalletConnectButton();
        }
    }

    toggleWalletDetails() {
        // Implementation for wallet details modal
        console.log('Toggle wallet details');
    }

    // Wallet Connection Functions
    setupWalletConnection() {
        // Initialize wallet connection functionality
        this.walletConnected = localStorage.getItem('walletConnected') === 'true';
        console.log('Wallet connection setup completed');
    }

    // Theme Functions
    setupThemeToggle() {
        const savedTheme = localStorage.getItem('latanda-theme') || 'dark';
        this.applyTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = localStorage.getItem('latanda-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem('latanda-theme', newTheme);
    }

    applyTheme(theme) {
        const body = document.body;
        const themeIcon = document.getElementById('themeIcon');
        
        if (theme === 'light') {
            body.style.setProperty('--bg-primary', '#f8fafc');
            body.style.setProperty('--bg-secondary', '#e2e8f0');
            body.style.setProperty('--text-primary', '#1e293b');
            body.style.setProperty('--text-secondary', '#64748b');
            body.style.setProperty('--bg-card', 'rgba(255, 255, 255, 0.8)');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
        } else {
            body.style.setProperty('--bg-primary', '#0f172a');
            body.style.setProperty('--bg-secondary', '#1e293b');
            body.style.setProperty('--text-primary', '#f8fafc');
            body.style.setProperty('--text-secondary', 'rgba(248, 250, 252, 0.7)');
            body.style.setProperty('--bg-card', 'rgba(15, 23, 42, 0.6)');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
        }
    }

    // Notification Functions
    setupNotifications() {
        this.notifications = [
            { id: 1, type: 'info', title: 'Nuevo grupo disponible', message: 'Se ha creado un nuevo grupo en tu zona', timestamp: Date.now() - 1000000 },
            { id: 2, type: 'success', title: 'Pago recibido', message: 'Has recibido tu turno de tanda', timestamp: Date.now() - 2000000 },
            { id: 3, type: 'warning', title: 'Pago pendiente', message: 'Tu contribución vence mañana', timestamp: Date.now() - 300000 }
        ];
        this.updateNotificationCount();
    }

    toggleNotifications() {
        // Implementation for notifications dropdown
        console.log('Toggle notifications');
    }

    updateNotificationCount() {
        const badge = document.getElementById('notificationCount');
        if (badge && this.notifications.length > 0) {
            badge.textContent = this.notifications.length;
            badge.style.display = 'block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-accent);
            border-radius: 12px;
            padding: 16px;
            color: var(--text-primary);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Search Functions
    toggleSearch() {
        // Implementation for search modal
        console.log('Toggle search');
    }

    // Mobile Menu Functions
    setupMobileMenu() {
        // Implementation for mobile hamburger menu
        console.log('Setup mobile menu');
    }

    // Initialization
    renderHeader() {
        const headerContainer = document.getElementById('latanda-header');
        if (headerContainer) {
            headerContainer.innerHTML = this.createHeader();
        } else {
            // Insert at the beginning of body if no container exists
            document.body.insertAdjacentHTML('afterbegin', this.createHeader());
        }
    }

    renderFooter() {
        const footerContainer = document.getElementById('latanda-footer');
        if (footerContainer) {
            footerContainer.innerHTML = this.createFooter();
        } else {
            // Insert at the end of body if no container exists
            document.body.insertAdjacentHTML('beforeend', this.createFooter());
        }
    }
}

// Initialize shared components
let laTandaComponents;

document.addEventListener('DOMContentLoaded', function() {
    laTandaComponents = new LaTandaComponents();
    
    // Auto-render components if containers exist
    if (document.getElementById('latanda-header') || document.querySelector('.auto-header')) {
        laTandaComponents.renderHeader();
    }
    
    if (document.getElementById('latanda-footer') || document.querySelector('.auto-footer')) {
        laTandaComponents.renderFooter();
    }
    
    // Integrate with translation system if available
    if (window.translationSystem) {
        setTimeout(() => {
            window.translationSystem.translatePage();
        }, 100);
    }
});