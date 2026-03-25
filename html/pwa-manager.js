/**
 * 📱 LA TANDA - PWA MANAGER
 * Handles installation prompts, updates, and offline detection
 * Version: 2.1.0 - Console stripped
 */

class PWAManager {
    constructor() {
        this.installPrompt = null;
        this.isOnline = navigator.onLine;
        this.serviceWorkerRegistration = null;
        this.init();
    }

    init() {
        this.loadStyles();
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOnlineDetection();
    }

    loadStyles() {
        if (!document.querySelector('link[href*="pwa-styles.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'pwa-styles.css?v=' + Date.now();
            document.head.appendChild(link);
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js?v=1769528307');
                this.serviceWorkerRegistration = registration;

                registration.update();
                setInterval(() => registration.update(), 60 * 60 * 1000);

                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event.data);
                });
            } catch (error) {
            }
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.installPrompt = event;
            this.showInstallUI();
        });

        window.addEventListener('appinstalled', () => {
            this.installPrompt = null;
            this.hideInstallUI();
            this.showNotification('¡La Tanda instalada exitosamente! 🎉', 'success');
        });
    }

    showInstallUI() {
        // Create top banner
        if (!document.getElementById('pwa-install-banner')) {
            const banner = document.createElement('div');
            banner.id = 'pwa-install-banner';
            banner.className = 'pwa-install-banner';
            banner.innerHTML = `
                <div class="pwa-install-content">
                    <div class="pwa-install-icon">📲</div>
                    <div class="pwa-install-text">
                        <strong>¡Instala La Tanda!</strong>
                        <p>Accede más rápido desde tu pantalla de inicio</p>
                    </div>
                    <button class="pwa-install-button" id="pwa-banner-install-btn">
                        Instalar App
                    </button>
                    <button class="pwa-install-close" id="pwa-banner-close-btn">
                        ×
                    </button>
                </div>
            `;
            document.body.appendChild(banner);

            // Add event listeners
            document.getElementById('pwa-banner-install-btn').onclick = () => this.promptInstall();
            document.getElementById('pwa-banner-close-btn').onclick = () => this.dismissBanner();

            setTimeout(() => banner.classList.add('pwa-install-visible'), 100);
        }

        // Create floating button
        if (!document.getElementById('pwa-floating-install')) {
            const floatingBtn = document.createElement('button');
            floatingBtn.id = 'pwa-floating-install';
            floatingBtn.className = 'pwa-floating-install';
            floatingBtn.innerHTML = '📲<span class="pwa-floating-install-tooltip">Instalar App</span>';
            floatingBtn.onclick = () => this.promptInstall();
            document.body.appendChild(floatingBtn);
        }
    }

    dismissBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.remove('pwa-install-visible');
            setTimeout(() => banner.remove(), 300);
        }
        // Keep floating button visible
    }

    hideInstallUI() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.remove('pwa-install-visible');
            setTimeout(() => banner.remove(), 300);
        }
        const floatingBtn = document.getElementById('pwa-floating-install');
        if (floatingBtn) floatingBtn.remove();
    }

    async promptInstall() {
        if (!this.installPrompt) {
            this.showNotification('Usa el menú del navegador para instalar', 'info');
            return;
        }

        this.installPrompt.prompt();
        const { outcome } = await this.installPrompt.userChoice;

        if (outcome === 'accepted') {
            this.showNotification('¡Gracias por instalar La Tanda!', 'success');
        }
        this.installPrompt = null;
    }

    setupOnlineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOnlineIndicator(true);
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineIndicator(false);
        });

        if (!navigator.onLine) {
            this.updateOnlineIndicator(false);
        }
    }

    updateOnlineIndicator(online) {
        let indicator = document.getElementById('pwa-online-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pwa-online-indicator';
            document.body.appendChild(indicator);
        }
        indicator.className = `pwa-online-indicator ${online ? 'online' : 'offline'}`;
        indicator.textContent = online ? '🌐 Online' : '📡 Sin conexión';
        indicator.style.display = online ? 'none' : 'flex';
    }

    showNotification(message, type = 'info') {
        if (window.LaTandaPopup) {
            if (type === 'success') window.LaTandaPopup.showSuccess(message);
            else if (type === 'error') window.LaTandaPopup.showError(message);
            else window.LaTandaPopup.showInfo(message);
        } else {
        }
    }

    handleServiceWorkerMessage(data) {
    }

    isAppInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    getStatus() {
        return {
            online: this.isOnline,
            installed: this.isAppInstalled(),
            serviceWorkerActive: !!this.serviceWorkerRegistration,
            installPromptAvailable: !!this.installPrompt
        };
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWAManager);
} else {
    initPWAManager();
}

function initPWAManager() {
    window.pwaManager = new PWAManager();
    window.getPWAStatus = () => window.pwaManager.getStatus();
}

window.PWAManager = PWAManager;
