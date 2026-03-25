/* ================================
   🌟 LA TANDA CHAIN SHARED COMPONENTS JS
   ================================ */

// Pages that are not yet ready for production - show "Coming Soon" badge
const COMING_SOON_PAGES = [
    "marketplace-social.html",
    "web3-dashboard.html",
    "trading.html",
    "lending.html",
    "bridge.html",
    "staking.html",
    "governance.html",
    "nft-memberships.html",
    "ltd-token-economics.html"
];

// Inject Coming Soon CSS
(function() {
    const style = document.createElement("style");
    style.textContent = `
        .coming-soon-badge {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 10px;
            margin-left: 6px;
            font-weight: 600;
            text-transform: uppercase;
            white-space: nowrap;
        }
        .nav-link.coming-soon {
            opacity: 0.6;
            cursor: not-allowed !important;
            pointer-events: none;
        }
        .footer-links a.coming-soon {
            opacity: 0.6;
            cursor: not-allowed !important;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
})();

// ===========================================
// LA TANDA AUTH MODULE v1.0.0
// Centralized Authentication Utilities
// ===========================================
window.LaTandaAuth = {
    // Get JWT token
    getToken: function() {
        return localStorage.getItem('auth_token')
            || sessionStorage.getItem('auth_token')
            
            || null;
    },

    // Get auth headers for API calls
    getHeaders: function() {
        const token = this.getToken();
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    },

    // Get current user ID (with fallbacks)
    getUserId: function() {
        // URL params (testing)
        const urlParams = new URLSearchParams(window.location.search);
        const urlUserId = urlParams.get('user_id') || urlParams.get('userId');
        if (urlUserId) return String(urlUserId);

        // Primary: latanda_user object
        const userJson = localStorage.getItem('latanda_user') || sessionStorage.getItem('latanda_user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                if (user.id) return String(user.id);
                if (user.user_id) return String(user.user_id);
            } catch(e) {}
        }

        // Fallbacks
        return localStorage.getItem('latanda_user_id')
            || localStorage.getItem('userId')
            || localStorage.getItem('user_id')
            || null;
    },

    // Get user data object
    getUserData: function() {
        try {
            const data = localStorage.getItem('latanda_user');
            return data ? JSON.parse(data) : null;
        } catch(e) { return null; }
    },

    // Check if authenticated
    isAuthenticated: function() {
        return !!this.getToken() && !!this.getUserId();
    },

    // Clear auth (logout)
    clear: function() {
        ['auth_token', 'latanda_auth_token', 'latanda_user', 'latanda_user_id', 'userId', 'user_id'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }
};

// Admin auth (separate from user auth)
window.LaTandaAdminAuth = {
    getToken: function() {
        return localStorage.getItem('admin_token');
    },
    getHeaders: function() {
        const token = this.getToken();
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    },
    isAuthenticated: function() {
        const token = this.getToken();
        return token && token.length === 64 && /^[a-f0-9]+$/.test(token);
    },
    clear: function() {
        localStorage.removeItem('admin_token');
    }
};

// BACKWARD COMPATIBILITY ALIASES
window.getAuthHeaders = function() { return LaTandaAuth.getHeaders(); };
window.getCurrentUserId = function() { return LaTandaAuth.getUserId(); };

// XSS prevention helper (v3.99.0)
function escapeHtmlSC(text) {
    const div = document.createElement('div');
    div.textContent = String(text != null ? text : '');
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

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
        if (path.includes('my-wallet')) return 'wallet';
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
                                <a href="my-wallet.html" class="nav-link ${this.currentPage === 'wallet' ? 'active' : ''}">
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
                                <a href="web3-dashboard.html" class="nav-link coming-soon ${this.currentPage === 'defi' ? 'active' : ''}">
                                    <i class="fas fa-coins"></i>
                                    <span data-translate="nav.defi">DeFi</span>
                                    <span class="coming-soon-badge">Próximamente</span>
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
                                <a href="https://twitter.com/TandaWeb3" target="_blank" class="social-link" title="Twitter">
                                    <i class="fab fa-twitter"></i>
                                </a>
                                <a href="#" class="social-link" title="Discord">
                                    <i class="fab fa-discord"></i>
                                </a>
                                <a href="https://t.me/lataboratory" target="_blank" class="social-link" title="Telegram">
                                    <i class="fab fa-telegram"></i>
                                </a>
                                <a href="https://github.com/INDIGOAZUL/la-tanda-web" target="_blank" class="social-link" title="GitHub">
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
                                <li><a href="my-wallet.html">
                                    <i class="fas fa-wallet"></i>
                                    <span data-translate="nav.wallet">Wallet Web3</span>
                                </a></li>
                                <li><a href="marketplace-social.html">
                                    <i class="fas fa-store"></i>
                                    <span data-translate="nav.marketplace">Marketplace</span>
                                </a></li>
                                <li><a href="web3-dashboard.html" class="coming-soon">
                                    <i class="fas fa-coins"></i>
                                    <span data-translate="nav.defi">DeFi Hub</span>
                                    <span class="coming-soon-badge">Próximamente</span>
                                </a></li>
                                <li><a href="kyc-registration.html">
                                    <i class="fas fa-user-check"></i>
                                    <span data-translate="nav.kyc_verification">Verificación KYC</span>
                                </a></li>
                                <li><a href="lottery-predictor.html">
                                    <i class="fas fa-dice"></i>
                                    <span>Predictor Loteria</span>
                                </a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h4 data-translate="footer.ecosystem">Ecosistema</h4>
                            <ul class="footer-links">
                                <li><a href="ltd-token-economics.html" class="coming-soon">
                                    <i class="fas fa-coins"></i>
                                    <span data-translate="footer.tokenomics">Tokenomics LTD</span>
                                    <span class="coming-soon-badge">Próximamente</span>
                                </a></li>
                                <li><a href="governance.html" class="coming-soon">
                                    <i class="fas fa-vote-yea"></i>
                                    <span data-translate="footer.governance">Governance</span>
                                    <span class="coming-soon-badge">Próximamente</span>
                                </a></li>
                                <li><a href="staking.html" class="coming-soon">
                                    <i class="fas fa-piggy-bank"></i>
                                    <span data-translate="footer.staking">Staking</span>
                                    <span class="coming-soon-badge">Próximamente</span>
                                </a></li>
                                <li><a href="nft-memberships.html" class="coming-soon">
                                    <i class="fas fa-certificate"></i>
                                    <span data-translate="footer.nft">NFT Membresías</span>
                                    <span class="coming-soon-badge">Próximamente</span>
                                </a></li>
                                <li><a href="bridge.html" class="coming-soon">
                                    <i class="fas fa-exchange-alt"></i>
                                    <span data-translate="footer.bridge">Cross-Chain Bridge</span>
                                    <span class="coming-soon-badge">Próximamente</span>
                                </a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h4 data-translate="footer.resources">Recursos</h4>
                            <ul class="footer-links">
                                <li><a href="/docs/" target="_blank">
                                    <i class="fas fa-book"></i>
                                    <span data-translate="footer.docs">Documentación</span>
                                </a></li>
                                <li><a href="/docs/" target="_blank">
                                    <i class="fas fa-code"></i>
                                    <span data-translate="footer.api">API Docs</span>
                                </a></li>
                                <li><a href="/docs/" target="_blank">
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
                                <li><a href="help-center.html">
                                    <i class="fas fa-users"></i>
                                    <span data-translate="footer.community">Comunidad</span>
                                </a></li>
                                <li><a href="contact.html">
                                    <i class="fas fa-envelope"></i>
                                    <span data-translate="footer.contact">Contacto</span>
                                </a></li>
                                <li><a href="contact.html">
                                    <i class="fas fa-bug"></i>
                                    <span data-translate="footer.bug_report">Reportar Bug</span>
                                </a></li>
                                <li><a href="contact.html">
                                    <i class="fas fa-lightbulb"></i>
                                    <span data-translate="footer.feature_request">Sugerir Función</span>
                                </a></li>
                            </ul>
                        </div>
                    </div>

                    <div class="footer-bottom">
                        <div class="footer-bottom-left">
                            <div class="copyright">
                                © 2024-2025 <strong>Ray-Banks LLC</strong>. <span data-translate="footer.rights">Todos los derechos reservados.</span>
                            </div>
                            <div class="footer-sub-info" style="margin-top: 8px; font-size: 0.85rem; opacity: 0.8;">
                                <span data-translate="footer.operating_as">Operating as</span> <strong>Latanda Financial Services</strong> | La Tanda Chain Protocol
                            </div>
                            <div class="footer-links" style="display: flex; gap: 24px; margin-top: 12px;">
                                <a href="privacy-policy.html" data-translate="footer.privacy">Política de Privacidad</a>
                                <a href="terms-of-service.html" data-translate="footer.terms">Términos de Servicio</a>
                                <a href="privacy-policy.html" data-translate="footer.cookies">Política de Cookies</a>
                            </div>
                        </div>

                        <div class="footer-bottom-right">
                            <div class="footer-company-info" style="text-align: right; margin-bottom: 12px;">
                                <div style="font-size: 0.85rem; opacity: 0.9;">
                                    <strong>Ray-Banks LLC</strong>
                                </div>
                                <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 4px;">
                                    New Mexico LLC | EIN: 37-2158338
                                </div>
                            </div>
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
    }

    // Wallet Connection Functions
    setupWalletConnection() {
        // Initialize wallet connection functionality
        this.walletConnected = localStorage.getItem('walletConnected') === 'true';
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
        // Delegate to NotificationCenter if available (PostgreSQL API sync)
        if (window.notificationCenter) {
            window.notificationCenter.toggle();
            return;
        }
        
        let panel = document.getElementById("notifications-panel");
        
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "notifications-panel";
            panel.className = "notifications-panel";
            panel.innerHTML = `
                <div class="notifications-header">
                    <h3>Notificaciones</h3>
                    <button onclick="laTandaComponents.toggleNotifications()" class="close-btn">&times;</button>
                </div>
                <div class="notifications-list" id="notifications-list">
                    <div class="notification-empty">No tienes notificaciones nuevas</div>
                </div>
            `;
            document.body.appendChild(panel);
            
            if (!document.getElementById("notifications-styles")) {
                const style = document.createElement("style");
                style.id = "notifications-styles";
                style.textContent = `
                    .notifications-panel {
                        position: fixed; top: 70px; right: 20px; width: 320px; max-height: 400px;
                        background: var(--bg-card, #1a1a2e); border: 1px solid var(--border-accent, #4a9eff);
                        border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); z-index: 10001;
                        display: none; overflow: hidden;
                    }
                    .notifications-panel.active { display: block; animation: slideDown 0.3s ease; }
                    .notifications-header {
                        display: flex; justify-content: space-between; align-items: center;
                        padding: 15px; border-bottom: 1px solid var(--border-color, #333);
                    }
                    .notifications-header h3 { margin: 0; color: var(--text-primary, #fff); font-size: 16px; }
                    .notifications-header .close-btn {
                        background: none; border: none; color: var(--text-secondary, #888);
                        font-size: 24px; cursor: pointer;
                    }
                    .notifications-list { max-height: 320px; overflow-y: auto; padding: 10px; }
                    .notification-empty { text-align: center; padding: 30px; color: var(--text-secondary, #888); }
                    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                `;
                document.head.appendChild(style);
            }
        }
        
        panel.classList.toggle("active");
        
        if (panel.classList.contains("active")) {
            setTimeout(() => {
                document.addEventListener("click", function closePanel(e) {
                    if (!panel.contains(e.target) && !e.target.closest(".header-action-btn")) {
                        panel.classList.remove("active");
                        document.removeEventListener("click", closePanel);
                    }
                });
            }, 100);
        }
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
        let modal = document.getElementById("search-modal");
        
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "search-modal";
            modal.className = "search-modal";
            modal.innerHTML = `
                <div class="search-modal-content">
                    <div class="search-header">
                        <input type="text" id="global-search-input" placeholder="Buscar grupos, tandas, usuarios..." autofocus>
                        <button onclick="laTandaComponents.toggleSearch()" class="close-btn">&times;</button>
                    </div>
                    <div class="search-results" id="search-results">
                        <div class="search-hint">Escribe para buscar...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            if (!document.getElementById("search-styles")) {
                const style = document.createElement("style");
                style.id = "search-styles";
                style.textContent = `
                    .search-modal {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0,0,0,0.8); z-index: 10002; display: none;
                        justify-content: center; padding-top: 100px;
                    }
                    .search-modal.active { display: flex; animation: fadeIn 0.2s ease; }
                    .search-modal-content {
                        width: 90%; max-width: 600px; background: var(--bg-card, #1a1a2e);
                        border-radius: 16px; overflow: hidden; max-height: 70vh;
                    }
                    .search-header { display: flex; padding: 15px; border-bottom: 1px solid var(--border-color, #333); }
                    .search-header input {
                        flex: 1; background: var(--bg-tertiary, #0a0a15); border: 1px solid var(--border-color, #333);
                        border-radius: 8px; padding: 12px 15px; color: var(--text-primary, #fff); font-size: 16px;
                    }
                    .search-header .close-btn {
                        background: none; border: none; color: var(--text-secondary, #888);
                        font-size: 28px; cursor: pointer; margin-left: 10px;
                    }
                    .search-results { padding: 15px; max-height: 50vh; overflow-y: auto; }
                    .search-hint { text-align: center; color: var(--text-secondary, #888); padding: 20px; }
                    .search-result-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
                    .search-result-item:hover { background: var(--bg-tertiary, rgba(74, 158, 255, 0.1)); }
                    .search-result-item i { font-size: 18px; color: var(--accent-primary, #4a9eff); width: 24px; text-align: center; }
                    .search-result-content { flex: 1; }
                    .search-result-title { color: var(--text-primary, #fff); font-weight: 500; }
                    .search-result-subtitle { color: var(--text-secondary, #888); font-size: 12px; margin-top: 2px; }
                    .search-results-count { color: var(--text-secondary, #888); font-size: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color, #333); margin-bottom: 8px; }
                    .search-result-arrow { color: var(--text-secondary, #666); font-size: 12px; }
                    .search-error { color: var(--danger-color, #ef4444); }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `;
                document.head.appendChild(style);
            }
            
            let searchTimeout;
            document.getElementById("global-search-input").addEventListener("input", (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                const results = document.getElementById("search-results");
                if (query.length < 2) {
                    results.innerHTML = '<div class="search-hint">Escribe al menos 2 caracteres...</div>';
                    return;
                }
                results.innerHTML = '<div class="search-hint">Buscando...</div>';
                searchTimeout = setTimeout(() => this.performGlobalSearch(query, results), 300);
            });
            
            modal.addEventListener("keydown", (e) => {
                if (e.key === "Escape") this.toggleSearch();
            });
        }
        
        modal.classList.toggle("active");
        if (modal.classList.contains("active")) {
            document.getElementById("global-search-input").focus();
        }
    }

    // Global Search Implementation - PostgreSQL API
    async performGlobalSearch(query, resultsContainer) {
        try {
            const apiBase = window.API_BASE_URL || "";
            const userId = localStorage.getItem("latanda_user_id") || "";
            
            const response = await fetch(
                apiBase + "/api/search?q=" + encodeURIComponent(query) + "&user_id=" + encodeURIComponent(userId) + "&limit=10"
            );
            
            if (!response.ok) {
                throw new Error("Search API error: " + response.status);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || "Search failed");
            }
            
            const results = data.data.results;
            let allResults = [];
            
            // Combine all result types
            if (results.groups) {
                results.groups.forEach(g => {
                    allResults.push({
                        type: "group",
                        icon: "users",
                        title: g.title,
                        subtitle: g.subtitle + (g.members ? " - " + g.members + " miembros" : ""),
                        url: "groups-advanced-system.html?group=" + g.id
                    });
                });
            }
            
            if (results.tandas) {
                results.tandas.forEach(t => {
                    allResults.push({
                        type: "tanda",
                        icon: "sync-alt",
                        title: t.title,
                        subtitle: t.subtitle + (t.contribution ? " - L." + t.contribution : ""),
                        url: "groups-advanced-system.html?tanda=" + t.id
                    });
                });
            }
            
            if (results.users) {
                results.users.forEach(u => {
                    allResults.push({
                        type: "user",
                        icon: "user",
                        title: u.title,
                        subtitle: u.subtitle + (u.trustScore ? " - Score: " + u.trustScore + "%" : ""),
                        url: "groups-advanced-system.html?member=" + u.id
                    });
                });
            }
            
            if (results.transactions) {
                results.transactions.forEach(tx => {
                    allResults.push({
                        type: "transaction",
                        icon: tx.title.includes("Deposito") ? "arrow-down" : "arrow-up",
                        title: tx.title,
                        subtitle: tx.subtitle,
                        url: "my-wallet.html?tab=transactions&id=" + tx.id
                    });
                });
            }
            
            // Render results
            if (allResults.length === 0) {
                resultsContainer.innerHTML = '<div class="search-hint">No se encontraron resultados para "' + escapeHtmlSC(query) + '"</div>';
                return;
            }
            
            let html = '<div class="search-results-count">' + data.data.total + ' resultado' + (data.data.total !== 1 ? 's' : '') + '</div>';
            allResults.forEach(r => {
                html += '<div class="search-result-item" data-search-url="' + escapeHtmlSC(r.url) + '">';
                html += '<i class="fas fa-' + r.icon + '"></i>';
                html += '<div class="search-result-content">';
                html += '<div class="search-result-title">' + escapeHtmlSC(r.title) + '</div>';
                html += '<div class="search-result-subtitle">' + escapeHtmlSC(r.subtitle) + '</div>';
                html += '</div>';
                html += '<i class="fas fa-chevron-right search-result-arrow"></i>';
                html += '</div>';
            });
            resultsContainer.innerHTML = html;
                // Delegated click for search results (v3.99.0)
                resultsContainer.querySelectorAll('[data-search-url]').forEach(item => {
                    item.addEventListener('click', function() {
                        const url = this.dataset.searchUrl;
                        if (url && url.startsWith('/')) window.location.href = url;
                    });
                });
            
        } catch (error) {
            resultsContainer.innerHTML = '<div class="search-hint search-error">Error en la busqueda. Intenta de nuevo.</div>';
        }
    }

    // Mobile Menu Functions
    setupMobileMenu() {
        if (!document.getElementById("mobile-menu-styles")) {
            const style = document.createElement("style");
            style.id = "mobile-menu-styles";
            style.textContent = `
                .mobile-menu-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.8); z-index: 9999; display: none;
                }
                .mobile-menu-overlay.active { display: block; }
                .mobile-menu {
                    position: fixed; top: 0; left: -280px; width: 280px; height: 100%;
                    background: var(--bg-card, #1a1a2e); z-index: 10000;
                    transition: left 0.3s ease; padding: 20px; overflow-y: auto;
                }
                .mobile-menu.active { left: 0; }
                .mobile-menu-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color, #333);
                }
                .mobile-menu-header h3 { margin: 0; color: var(--text-primary, #fff); }
                .mobile-menu-close {
                    background: none; border: none; color: var(--text-secondary, #888);
                    font-size: 28px; cursor: pointer;
                }
                .mobile-nav-link {
                    display: block; padding: 15px; color: var(--text-primary, #fff);
                    text-decoration: none; border-radius: 8px; margin-bottom: 5px;
                    transition: background 0.2s;
                }
                .mobile-nav-link:hover { background: var(--bg-tertiary, #0a0a15); }
                @media (min-width: 769px) { .hamburger-btn { display: none !important; } }
            `;
            document.head.appendChild(style);
        }
        
        if (!document.getElementById("mobile-menu-overlay")) {
            const overlay = document.createElement("div");
            overlay.id = "mobile-menu-overlay";
            overlay.className = "mobile-menu-overlay";
            overlay.onclick = () => this.closeMobileMenu();
            
            const menu = document.createElement("div");
            menu.id = "mobile-menu";
            menu.className = "mobile-menu";
            menu.innerHTML = `
                <div class="mobile-menu-header">
                    <h3>La Tanda</h3>
                    <button class="mobile-menu-close" onclick="laTandaComponents.closeMobileMenu()">&times;</button>
                </div>
                <nav>
                    <a href="home-dashboard.html" class="mobile-nav-link">Dashboard</a>
                    <a href="groups-advanced-system.html" class="mobile-nav-link">Grupos</a>
                    <a href="my-wallet.html" class="mobile-nav-link">Wallet</a>
                    <a href="mi-perfil.html" class="mobile-nav-link">Perfil</a>
                    <a href="configuracion.html" class="mobile-nav-link">Configuracion</a>
                </nav>
            `;
            
            document.body.appendChild(overlay);
            document.body.appendChild(menu);
        }
        
        const hamburger = document.querySelector(".hamburger-btn");
        if (hamburger) {
            hamburger.onclick = () => this.openMobileMenu();
        }
    }
    
    openMobileMenu() {
        document.getElementById("mobile-menu-overlay")?.classList.add("active");
        document.getElementById("mobile-menu")?.classList.add("active");
        document.body.style.overflow = "hidden";
    }
    
    closeMobileMenu() {
        document.getElementById("mobile-menu-overlay")?.classList.remove("active");
        document.getElementById("mobile-menu")?.classList.remove("active");
        document.body.style.overflow = "";
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
window.laTandaComponents = null;

document.addEventListener('DOMContentLoaded', function() {
    laTandaComponents = new LaTandaComponents();
    window.laTandaComponents = laTandaComponents;
    
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

// Global 401 Handler - Improved to handle token expiration gracefully
(function() {
    const originalFetch = window.fetch;
    let authRedirectPending = false;

    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        if (response.status === 401 && !authRedirectPending) {
            const currentPage = window.location.pathname;
            const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');

            // Skip redirect for admin pages (they have their own login modal)
            if (currentPage.includes('admin')) {
                return response;
            }

            // Skip redirect for auth endpoints (login, register)
            if (url && (url.includes('/auth/') || url.includes('/login') || url.includes('/register'))) {
                return response;
            }

            // Skip redirect for non-critical background endpoints (sidebar widgets, notifications, dashboard, payouts)
            if (url && (url.includes('/notifications/') || url.includes('/dashboard/summary') || url.includes('/wallet/balance') || url.includes('/payout-methods') || url.includes('/payout/') || url.includes('/payments/methods') || url.includes('/hub/summary') || url.includes('/mining/status') || url.includes('/marketplace/'))) {
                return response;
            }

            // Check if we have a token at all
            const hasToken = localStorage.getItem('auth_token');

            if (!hasToken) {
                // No token and a primary API call returned 401 - redirect once
                authRedirectPending = true;
                if (!currentPage.includes('auth')) {
                    localStorage.setItem('redirect_after_auth', currentPage);
                }
                window.location.href = '/auth-enhanced.html';
                return response;
            }

            // We have a token but got 401 - likely expired
            // Only redirect once even if multiple calls fail
            authRedirectPending = true;

            if (typeof window.showToast === 'function') {
                window.showToast('Tu sesion ha expirado. Por favor inicia sesion de nuevo.', 'warning');
            }

            setTimeout(() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('latanda_auth_token');
                if (!currentPage.includes('auth')) {
                    localStorage.setItem('redirect_after_auth', currentPage);
                }
                window.location.href = '/auth-enhanced.html';
            }, 2000);
        }

        return response;
    };
})();
