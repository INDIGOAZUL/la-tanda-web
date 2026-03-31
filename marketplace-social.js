/**
 * La Tanda - Marketplace & Social System
 * Sistema integrado de marketplace y red social con tokens LTD
 * Versión: 4.0.0
 *
 * Features:
 * - Guest access (browse without login)
 * - Subscription tiers: Free, Plan (L.99/mo), Premium (L.299/mo)
 * - Service categories with booking system
 * - Connected to real PostgreSQL backend APIs
 */

// Tier limits mirror (client-side, used before API responds)
function getTierLimitsClient(tier) {
    const tiers = {
        free: { label: 'Gratis', max_listings: 5, max_bookings_month: 3, max_messages_day: 10, can_mixed_store: false, layouts: ['classic'], themes: ['dark'], booking_discount: 0, referral_commission: 0, can_featured: false, featured_per_month: 0, max_batch_stock: 1, analytics_level: 'basic', platform_commission: 5, referral_bonus: 0 },
        plan: { label: 'Plan', max_listings: 25, max_bookings_month: 15, max_messages_day: 50, can_mixed_store: false, layouts: ['classic', 'showcase', 'compact'], themes: ['dark', 'cyan', 'gold'], booking_discount: 0, referral_commission: 3, can_featured: false, featured_per_month: 0, max_batch_stock: 10, analytics_level: 'revenue', platform_commission: 3, referral_bonus: 5 },
        premium: { label: 'Premium', max_listings: -1, max_bookings_month: -1, max_messages_day: -1, can_mixed_store: true, layouts: ['classic', 'showcase', 'compact'], themes: ['dark', 'cyan', 'gold', 'green', 'coral', 'purple'], booking_discount: 10, referral_commission: 5, can_featured: true, featured_per_month: 3, max_batch_stock: 50, analytics_level: 'full', platform_commission: 1, referral_bonus: 10 },
        tanda_member: { label: 'Tanda', max_listings: -1, max_bookings_month: -1, max_messages_day: -1, can_mixed_store: true, layouts: ['classic', 'showcase', 'compact'], themes: ['dark', 'cyan', 'gold', 'green', 'coral', 'purple'], booking_discount: 10, referral_commission: 5, can_featured: true, featured_per_month: 3, max_batch_stock: 50, analytics_level: 'full', platform_commission: 0, referral_bonus: 10 }
    };
    return tiers[tier] || tiers.free;
}

class MarketplaceSocialSystem {
    constructor() {
        this.API_BASE = 'https://latanda.online';
        this.currentUser = this.getCurrentUser();
        this.authToken = this.getAuthToken();
        this.isGuest = !this.currentUser || this.currentUser.id === 'guest';

        // System state
        this.products = [];
        this.services = [];
        this.bookings = [];

        // Messaging state
        this.conversations = [];
        this.currentConversation = null;
        this.messages = [];
        this.unreadCount = 0;

        // Current user subscription (default to free for logged users, guest for non-logged)
        this.userSubscription = this.isGuest ? 'guest' : (this.currentUser?.subscription || 'free');

        // Market statistics
        this.marketStats = {
            totalProducts: 0,
            totalSellers: 0,
            totalTransactions: 0,
            totalVolume: 0,
            totalServices: 0,
            totalProviders: 0
        };

        // Product categories
        this.categories = {
            electronics: '📱 Electrónicos',
            clothing: '👕 Ropa y Moda',
            home: '🏠 Hogar y Jardín',
            food: '🍕 Comida y Bebidas',
            digital: '💻 Productos Digitales'
        };

        // Service categories (new)
        this.serviceCategories = {
            cleaning: '🧹 Limpieza del Hogar',
            repairs: '🔧 Reparaciones',
            gardening: '🌱 Jardinería',
            tutoring: '📚 Tutorías',
            beauty: '💅 Belleza',
            moving: '📦 Mudanzas',
            other_services: '⚙️ Otros Servicios'
        };

        this.init();
    }
    
    async init() {
        setupMarketplaceDelegatedListeners();
        try {
            this.setupEventListeners();

            // Load data in parallel for faster initialization
            await Promise.allSettled([
                this.loadCategories(),
                this.loadMarketplaceData(),
                this.loadServicesData(),
                this.loadMarketplaceStats(),
                this.loadUserSubscription()
            ]);

            this.updateAllDisplays();
            this.updateGuestUI();
            this.populateCategoryFilters();
            this._updateCartBadge();

        } catch (error) {
            // Non-blocking: individual sections handle their own errors
        }
    }

    // Load categories from API
    async loadCategories() {
        try {
            const response = await this.apiRequest('/api/marketplace/categories');

            const cats = response.data?.categories || response.categories;
            if (response.success && cats) {
                // Store as both array and object
                this.categoriesData = cats;

                // Convert to the frontend format (object with id: label)
                this.serviceCategories = {};
                cats.forEach(cat => {
                    this.serviceCategories[cat.category_id] = `${cat.icon} ${cat.name_es}`;
                });

            }
        } catch (error) {
            // Keep default categories defined in constructor
        }
    }

    // Load marketplace stats from API
    async loadMarketplaceStats() {
        try {
            const response = await this.apiRequest('/api/marketplace/stats');

            const stats = response.data?.stats || response.stats;
            if (response.success && stats) {
                this.marketStats = {
                    totalProducts: parseInt(stats.total_products) || this.marketStats.totalProducts,
                    totalSellers: parseInt(stats.total_providers) || this.marketStats.totalSellers,
                    totalTransactions: parseInt(stats.total_bookings) || this.marketStats.totalTransactions,
                    totalVolume: parseFloat(stats.total_volume) || this.marketStats.totalVolume,
                    totalServices: parseInt(stats.total_services) || this.marketStats.totalServices,
                    totalProviders: parseInt(stats.total_providers) || this.marketStats.totalProviders
                };
            }
        } catch (error) {
        }
    }

    // Load user subscription from API
    async loadUserSubscription() {
        if (!this.authToken) return;

        try {
            const response = await this.apiRequest('/api/marketplace/subscription');
            const data = response.data || response;
            const sub = data.subscription;
            if (response.success && sub) {
                this.subscriptionData = sub;
                this.userSubscription = sub.tier || 'free';
                this.tierLimits = data.limits || getTierLimitsClient(this.userSubscription);
                this.tierUsage = data.usage || { listings: 0, products: 0, services: 0, bookings_this_month: 0, messages_today: 0 };
            }
        } catch (error) {
            this.userSubscription = 'free';
            this.subscriptionData = null;
            this.tierLimits = getTierLimitsClient('free');
            this.tierUsage = { listings: 0, products: 0, services: 0, bookings_this_month: 0, messages_today: 0 };
        }
        this.updateTierBadge();
    }

    // Populate category filter dropdowns with API data
    populateCategoryFilters() {
        const serviceCategoryFilter = document.getElementById('serviceCategoryFilter');
        if (serviceCategoryFilter && this.categoriesData) {
            serviceCategoryFilter.innerHTML = '<option value="">Todas las Categorías</option>';
            this.categoriesData.forEach(cat => {
                if (cat.is_active) {
                    serviceCategoryFilter.innerHTML += `
                        <option value="${this.escapeHtml(String(cat.category_id))}">${this.escapeHtml(cat.icon || '')} ${this.escapeHtml(cat.name_es || '')}</option>
                    `;
                }
            });
        }
    }

    // Guest access UI updates
    updateGuestUI() {
        const guestBanner = document.getElementById('guestBanner');
        if (guestBanner) {
            guestBanner.style.display = this.isGuest ? 'flex' : 'none';
        }
    }

    // Check tier gate for an action. Returns true if allowed, false if blocked (shows prompt).
    checkTierGate(action, context = {}) {
        if (this.isGuest) return true; // guests handled separately
        const limits = this.tierLimits || getTierLimitsClient(this.userSubscription);
        const usage = this.tierUsage || {};
        let blocked = false;
        let message = '';

        switch (action) {
            case 'create_listing': {
                if (limits.max_listings !== -1 && (usage.listings || 0) >= limits.max_listings) {
                    blocked = true;
                    message = 'Has alcanzado el limite de ' + limits.max_listings + ' publicaciones para tu plan.';
                }
                break;
            }
            case 'book_service': {
                if (limits.max_bookings_month !== -1 && (usage.bookings_this_month || 0) >= limits.max_bookings_month) {
                    blocked = true;
                    message = 'Has alcanzado el limite de ' + limits.max_bookings_month + ' reservas/mes para tu plan.';
                }
                break;
            }
            case 'send_message': {
                if (limits.max_messages_day !== -1 && (usage.messages_today || 0) >= limits.max_messages_day) {
                    blocked = true;
                    message = 'Has alcanzado el limite de ' + limits.max_messages_day + ' mensajes/dia para tu plan.';
                }
                break;
            }
            case 'mixed_store': {
                if (!limits.can_mixed_store) {
                    blocked = true;
                    message = 'Las tiendas mixtas requieren Plan Premium o ser miembro de una tanda.';
                }
                break;
            }
            case 'select_layout': {
                if (context.layout && !limits.layouts.includes(context.layout)) {
                    blocked = true;
                    message = 'El layout "' + this.escapeHtml(context.layoutLabel || context.layout) + '" requiere un plan superior.';
                }
                break;
            }
            case 'select_theme': {
                if (context.theme && !limits.themes.includes(context.theme)) {
                    blocked = true;
                    message = 'El tema "' + this.escapeHtml(context.themeLabel || context.theme) + '" requiere un plan superior.';
                }
                break;
            }
            case 'featured_listing': {
                if (!limits.can_featured) {
                    blocked = true;
                    message = 'Los listados destacados requieren Plan Premium o ser miembro de una tanda.';
                }
                break;
            }
        }

        if (blocked) {
            this.showUpgradePrompt(action, message);
            return false;
        }
        return true;
    }

    // Show upgrade prompt bottom sheet
    showUpgradePrompt(reason, message) {
        // Remove any existing prompt
        document.querySelector('.tier-upgrade-prompt')?.remove();
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const prompt = document.createElement('div');
        prompt.className = 'tier-upgrade-prompt';
        prompt.innerHTML = `
            <div class="tier-prompt-content">
                <div class="tier-prompt-icon">🔒</div>
                <div class="tier-prompt-text">${esc(message)}</div>
                <div class="tier-prompt-actions">
                    <button class="tier-prompt-btn tier-prompt-upgrade" data-action="open-upgrade-modal">Mejorar Plan</button>
                    <button class="tier-prompt-btn tier-prompt-close" data-action="close-tier-prompt">Cerrar</button>
                </div>
                <div class="tier-prompt-hint">O unete a una tanda para acceso Premium gratis</div>
            </div>
        `;
        document.body.appendChild(prompt);
        // Auto-dismiss after 10s
        setTimeout(() => prompt.remove(), 10000);
    }

    // Open full upgrade modal with tier comparison
    openUpgradeModal() {
        document.querySelector('.upgrade-overlay')?.remove();
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const currentTier = this.userSubscription || 'free';
        const isTanda = currentTier === 'tanda_member';

        const features = [
            { name: 'Publicaciones', free: '5', plan: '25', premium: 'Ilimitado' },
            { name: 'Reservas/mes', free: '3', plan: '15', premium: 'Ilimitado' },
            { name: 'Mensajes/dia', free: '10', plan: '50', premium: 'Ilimitado' },
            { name: 'Layouts', free: '1', plan: '3', premium: 'Todos' },
            { name: 'Temas', free: '1', plan: '3', premium: '6' },
            { name: 'Tienda mixta', free: '—', plan: '—', premium: 'Si' },
            { name: 'Descuento reservas', free: '0%', plan: '0%', premium: '10%' },
            { name: 'Comision referidos', free: '0%', plan: '3%', premium: '5%' },
            { name: 'Destacados/mes', free: '0', plan: '0', premium: '3' }
        ];

        let featuresHtml = features.map(f => `
            <tr>
                <td class="upgrade-feature-name">${esc(f.name)}</td>
                <td class="upgrade-feature-val${currentTier === 'free' ? ' upgrade-current' : ''}">${esc(f.free)}</td>
                <td class="upgrade-feature-val${currentTier === 'plan' ? ' upgrade-current' : ''}">${esc(f.plan)}</td>
                <td class="upgrade-feature-val${currentTier === 'premium' || isTanda ? ' upgrade-current' : ''}">${esc(f.premium)}</td>
            </tr>
        `).join('');

        const overlay = document.createElement('div');
        overlay.className = 'upgrade-overlay ds-overlay';
        overlay.innerHTML = `
            <div class="upgrade-modal">
                <div class="upgrade-modal-header">
                    <h3>Elige tu plan</h3>
                    <button class="upgrade-modal-close" data-action="close-upgrade-modal">&times;</button>
                </div>
                <div class="upgrade-tiers-step" id="upgradeTiersStep">
                    ${isTanda ? '<div class="upgrade-tanda-badge">Incluido con tu Tanda</div>' : ''}
                    <div class="upgrade-tier-cards">
                        <div class="upgrade-tier-card${currentTier === 'free' ? ' upgrade-tier-active' : ''}">
                            <div class="upgrade-tier-name">Gratis</div>
                            <div class="upgrade-tier-price">L. 0</div>
                            <div class="upgrade-tier-period">para siempre</div>
                            ${currentTier === 'free' ? '<div class="upgrade-tier-current">Plan actual</div>' : '<button class="upgrade-tier-btn" data-action="select-upgrade-tier" data-id="free">Seleccionar</button>'}
                        </div>
                        <div class="upgrade-tier-card upgrade-tier-popular${currentTier === 'plan' ? ' upgrade-tier-active' : ''}">
                            <div class="upgrade-tier-badge-pop">Popular</div>
                            <div class="upgrade-tier-name">Plan</div>
                            <div class="upgrade-tier-price">L. 99</div>
                            <div class="upgrade-tier-period">/mes</div>
                            ${currentTier === 'plan' ? '<div class="upgrade-tier-current">Plan actual</div>' : '<button class="upgrade-tier-btn upgrade-tier-btn-primary" data-action="select-upgrade-tier" data-id="plan">Seleccionar</button>'}
                        </div>
                        <div class="upgrade-tier-card${currentTier === 'premium' || isTanda ? ' upgrade-tier-active' : ''}">
                            <div class="upgrade-tier-name">Premium</div>
                            <div class="upgrade-tier-price">L. 299</div>
                            <div class="upgrade-tier-period">/mes</div>
                            ${isTanda ? '<div class="upgrade-tier-current">Incluido con Tanda</div>' : currentTier === 'premium' ? '<div class="upgrade-tier-current">Plan actual</div>' : '<button class="upgrade-tier-btn upgrade-tier-btn-premium" data-action="select-upgrade-tier" data-id="premium">Seleccionar</button>'}
                        </div>
                    </div>
                    <table class="upgrade-features-table">
                        <thead><tr><th></th><th>Gratis</th><th>Plan</th><th>Premium</th></tr></thead>
                        <tbody>${featuresHtml}</tbody>
                    </table>
                    <div class="upgrade-tanda-promo">Unete a una tanda y obtiene Premium gratis</div>
                </div>
                <div class="upgrade-payment-step" id="upgradePaymentStep" style="display:none;">
                    <button class="upgrade-back-btn" data-action="upgrade-back-to-tiers"><i class="fas fa-arrow-left"></i> Volver</button>
                    <div class="upgrade-pay-summary" id="upgradePaySummary"></div>
                    <div class="upgrade-pay-methods">
                        <label class="upgrade-pay-option">
                            <input type="radio" name="upgradePayMethod" value="wallet" checked>
                            <span>Wallet (Saldo actual: L. <span id="upgradeWalletBal">...</span>)</span>
                        </label>
                        <label class="upgrade-pay-option">
                            <input type="radio" name="upgradePayMethod" value="cash">
                            <span>Efectivo (se genera codigo de referencia)</span>
                        </label>
                    </div>
                    <button class="upgrade-confirm-btn" data-action="confirm-upgrade" id="upgradeConfirmBtn">Confirmar Pago</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        // Load wallet balance
        this.apiRequest('/api/wallet/balance').then(r => {
            const bal = document.getElementById('upgradeWalletBal');
            if (bal) bal.textContent = parseFloat(r.data?.balance || r.balance || 0).toFixed(2);
        }).catch(() => {});
    }

    // Select a tier in upgrade modal → show payment step
    async selectUpgradeTier(tier) {
        const prices = { free: 0, plan: 99, premium: 299 };
        const labels = { free: 'Gratis', plan: 'Plan', premium: 'Premium' };
        this._pendingUpgradeTier = tier;

        if (tier === 'free') {
            // Downgrade confirmation
            const confirmed = await this.showConfirm('Deseas cambiar a plan Gratis? Perderas los beneficios al finalizar el periodo actual.');
            if (!confirmed) return;
            this.confirmUpgrade();
            return;
        }

        document.getElementById('upgradeTiersStep').style.display = 'none';
        document.getElementById('upgradePaymentStep').style.display = 'block';
        document.getElementById('upgradePaySummary').innerHTML = `
            <div class="upgrade-pay-tier">${this.escapeHtml(labels[tier])}</div>
            <div class="upgrade-pay-price">L. ${prices[tier]}/mes</div>
        `;
    }

    // Confirm the upgrade payment
    async confirmUpgrade() {
        const tier = this._pendingUpgradeTier;
        if (!tier) return;
        const btn = document.getElementById('upgradeConfirmBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

        const method = document.querySelector('input[name="upgradePayMethod"]:checked')?.value || 'wallet';

        try {
            const response = await this.apiRequest('/api/marketplace/subscription/upgrade', {
                method: 'POST',
                body: JSON.stringify({ tier, payment: { method } })
            });
            if (response.success) {
                const sub = response.data?.subscription || response.subscription;
                if (sub?.reference_code) {
                    this.showNotification('Referencia: ' + sub.reference_code + '. Realiza el pago para activar tu plan.', 'info');
                } else {
                    const labels = { free: 'Gratis', plan: 'Plan', premium: 'Premium' };
                    this.showNotification((labels[tier] || tier) + ' activado exitosamente', 'success');
                }
                document.querySelector('.upgrade-overlay')?.remove();
                await this.loadUserSubscription();
                // Refresh store if on Mi Tienda
                if (document.getElementById('my-store')?.classList.contains('active')) {
                    this.loadMyStore();
                }
            } else {
                this.showNotification(response.message || 'Error al procesar la suscripcion', 'error');
            }
        } catch (error) {
            this.showNotification('Error al procesar la suscripcion', 'error');
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Confirmar Pago'; }
    }

    // Update tier badge in header
    updateTierBadge() {
        let badge = document.getElementById('mpTierBadge');
        if (this.isGuest || !this.userSubscription || this.userSubscription === 'guest') {
            if (badge) badge.remove();
            return;
        }
        const tier = this.userSubscription;
        const colors = { free: '#6b7280', plan: '#f59e0b', premium: '#ff6b35', tanda_member: '#10b981' };
        const labels = { free: 'Free', plan: 'Plan', premium: 'Premium', tanda_member: 'Tanda' };
        if (!badge) {
            badge = document.createElement('button');
            badge.id = 'mpTierBadge';
            badge.className = 'mp-tier-badge';
            badge.setAttribute('data-action', 'open-upgrade-modal');
            const headerRight = document.querySelector('.mp-header-right');
            if (headerRight) headerRight.prepend(badge);
        }
        badge.style.setProperty('--tier-color', colors[tier] || colors.free);
        badge.textContent = labels[tier] || 'Free';
    }

    // Render tier progress card for Mi Tienda dashboard
    renderTierProgressCard() {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const tier = this.userSubscription || 'free';
        const limits = this.tierLimits || getTierLimitsClient(tier);
        const usage = this.tierUsage || {};
        const labels = { free: 'Gratis', plan: 'Plan', premium: 'Premium', tanda_member: 'Tanda Member' };
        const icons = { free: '🆓', plan: '⭐', premium: '👑', tanda_member: '🤝' };
        const isTanda = tier === 'tanda_member';
        const isUnlimited = tier === 'premium' || isTanda;

        const expiresAt = this.subscriptionData?.expires_at;
        const expiryText = expiresAt && tier !== 'free' ? 'Vence: ' + new Date(expiresAt).toLocaleDateString('es-HN') : '';

        const listBar = isUnlimited ? '<span class="tier-prog-unlimited">Ilimitado</span>'
            : `<div class="tier-prog-bar"><div class="tier-prog-fill" style="width:${Math.min(100, ((usage.listings || 0) / limits.max_listings) * 100)}%"></div></div><span class="tier-prog-label">${usage.listings || 0}/${limits.max_listings}</span>`;
        const bookBar = isUnlimited ? '<span class="tier-prog-unlimited">Ilimitado</span>'
            : `<div class="tier-prog-bar"><div class="tier-prog-fill" style="width:${Math.min(100, ((usage.bookings_this_month || 0) / limits.max_bookings_month) * 100)}%"></div></div><span class="tier-prog-label">${usage.bookings_this_month || 0}/${limits.max_bookings_month}</span>`;

        return `<div class="tier-progress-card">
            <div class="tier-prog-header">
                <span class="tier-prog-icon">${icons[tier] || '🆓'}</span>
                <span class="tier-prog-title">${esc(labels[tier] || 'Gratis')}</span>
                ${expiryText ? '<span class="tier-prog-expiry">' + esc(expiryText) + '</span>' : ''}
            </div>
            <div class="tier-prog-row"><span class="tier-prog-name">Publicaciones</span>${listBar}</div>
            <div class="tier-prog-row"><span class="tier-prog-name">Reservas/mes</span>${bookBar}</div>
            ${!isUnlimited ? '<button class="tier-prog-upgrade-btn" data-action="open-upgrade-modal">Mejorar Plan</button>' : ''}
        </div>`;
    }

    // Show login prompt for guests
    showLoginPrompt(action) {
        const modal = document.getElementById('loginPromptModal');
        if (modal) {
            document.getElementById('loginAction').textContent = action;
            modal.classList.add('active');
        } else {
            this.showNotification(`Inicia sesión para ${action}`, 'info');
        }
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filterProducts();
            }, 300));
        }
        
        // Filter changes
        document.querySelectorAll('[id$="Filter"]').forEach(filter => {
            filter.addEventListener('change', () => {
                this.filterProducts();
            });
        });
        
        // Create product form
        const createProductForm = document.getElementById('createProductForm');
        if (createProductForm) {
            createProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateProduct();
            });
        }
        
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.dataset.tab) tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const section = document.getElementById(tabName);
        if (section) section.classList.add('active');

        // Load section-specific data
        this.loadSectionData(tabName);
    }
    
    async loadSectionData(section) {
        switch (section) {
            case 'marketplace':
                this.loadMarketplaceProducts();
                break;
            case 'my-store':
                this.loadMyStore();
                break;
            case 'bookings':
                this.loadMyPurchases();
                break;
            case 'messages':
                this.loadConversations();
                // v4.2.0: Delegated listener for conversation items
                document.addEventListener('click', (e) => {
                    const convItem = e.target.closest('[data-action="open-conv"]');
                    if (convItem) {
                        const otherId = convItem.dataset.otherId;
                        const productId = convItem.dataset.productId || null;
                        const otherName = convItem.dataset.otherName;
                        this.openConversation(otherId, productId, otherName);
                    }
                });
                break;
        }
    }

    formatPrice(price, currency, suffix) {
        const sym = currency === 'USD' ? '$' : 'L.';
        const formatted = currency === 'USD' ? price.toLocaleString('en-US') : price.toLocaleString();
        return suffix ? `${sym}${formatted}${suffix}` : `${sym}${formatted}`;
    }

    createServiceCard(service) {
        const categoryLabel = this.serviceCategories[service.category] || service.category;
        const cur = service.currency || 'HNL';
        const priceLabel = service.priceType === 'hourly' ? this.formatPrice(service.price, cur, '/hora') :
                          service.priceType === 'fixed' ? this.formatPrice(service.price, cur) : 'Cotizar';

        // Calculate potential commission (5% default)
        const commissionPercent = service.referralCommission || 5;
        const estimatedCommission = service.priceType === 'hourly'
            ? (service.price * service.duration * commissionPercent / 100).toFixed(0)
            : (service.price * commissionPercent / 100).toFixed(0);

        return `
            <div class="service-card" data-action="view-service" data-id="${this.escapeHtml(service.id)}">
                <div class="service-image">
                    <span>${service.image}</span>
                    ${service.provider.verified ? '<div class="service-badge verified">Verificado</div>' : ''}
                    ${service.featured ? '<div class="service-badge featured">Destacado</div>' : ''}
                </div>
                <div class="service-info">
                    <div class="service-category">${this.escapeHtml(categoryLabel)}</div>
                    <div class="service-title">${this.escapeHtml(service.title)}</div>
                    <div class="service-description">${this.escapeHtml(service.description)}</div>
                    <div class="service-provider">
                        <div class="provider-avatar">${service.provider.avatar}</div>
                        <div class="provider-info">
                            <div class="provider-name">${this.escapeHtml(service.provider.name)}</div>
                            <div class="provider-rating">⭐ ${this.escapeHtml(service.provider.rating)} (${this.escapeHtml(service.provider.completedJobs)} trabajos)</div>
                        </div>
                    </div>
                    <div class="service-details">
                        <div class="service-price">${priceLabel}</div>
                        <div class="service-duration">⏱️ ~${service.duration}h</div>
                    </div>
                    <div class="service-availability">
                        📅 ${service.availability.join(' | ')}
                    </div>
                    <div class="service-areas">
                        📍 ${service.serviceAreas.join(', ')}
                    </div>
                    <div class="service-actions" style="display: flex; gap: 8px; margin-top: 12px;">
                        <button class="btn btn-primary ds-btn ds-btn-primary" style="flex: 1;" data-action="book-service" data-id="${this.escapeHtml(service.id)}">
                            <span>📅</span> Reservar
                        </button>
                        <button class="btn btn-secondary ds-btn ds-btn-secondary share-btn" style="padding: 10px 14px;" data-action="share-service" data-id="${this.escapeHtml(service.id)}" title="Compartir y ganar ${this.formatPrice(parseFloat(estimatedCommission), cur)}">
                            <span>💰</span>
                        </button>
                    </div>
                    ${!this.isGuest ? ((this.tierLimits || getTierLimitsClient(this.userSubscription)).referral_commission > 0
                        ? `<div class="commission-hint" style="text-align: center; margin-top: 8px; font-size: 11px; color: rgba(0,255,255,0.7);">
                            💰 Gana ${this.formatPrice(parseFloat(estimatedCommission), cur)} por cada reserva referida
                        </div>`
                        : `<div class="commission-hint" style="text-align: center; margin-top: 8px; font-size: 11px; color: rgba(255,255,255,0.4);">
                            Mejora tu plan para ganar comisiones por referidos
                        </div>`) : ''}
                </div>
            </div>
        `;
    }

    // =====================================================
    // MIS COMPRAS (Unified Purchases Tab)
    // =====================================================
    async loadMyPurchases() {
        if (!this.authToken) {
            const pc = document.getElementById('mcProductsContent');
            const sc = document.getElementById('mcServicesContent');
            const loginHtml = '<div class="mc-empty"><i class="fas fa-lock"></i><h3>Inicia sesion para ver tus compras</h3><button class="btn btn-primary ds-btn ds-btn-primary" style="margin-top:12px;" onclick="goToLogin()">Iniciar Sesion</button></div>';
            if (pc) pc.innerHTML = loginHtml;
            if (sc) sc.innerHTML = loginHtml;
            return;
        }
        await Promise.all([this._loadBuyerProductOrders(), this.loadBookingsData()]);
    }

    async _loadBuyerProductOrders() {
        const container = document.getElementById('mcProductsContent');
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.5);"><i class="fas fa-spinner fa-spin"></i> Cargando pedidos...</div>';
        try {
            const response = await this.apiRequest('/api/marketplace/product-orders?role=buyer&limit=30');
            if (!response.success) throw new Error('No se pudieron cargar los pedidos');
            const orders = response.orders || response.data?.orders || [];
            this._buyerOrders = orders;
            if (orders.length === 0) {
                container.innerHTML = '<div class="mc-empty"><i class="fas fa-shopping-bag"></i><h3>Sin pedidos de productos</h3><p>Explora el marketplace para encontrar productos</p></div>';
                return;
            }
            const esc = this.escapeHtml.bind(this);
            container.innerHTML = orders.map(o => this._renderBuyerOrderCard(o, esc)).join('');
        } catch (err) {
            container.innerHTML = '<div class="mc-empty"><i class="fas fa-exclamation-circle"></i><h3>Error cargando pedidos</h3><button class="btn btn-secondary ds-btn ds-btn-secondary" style="margin-top:8px;" data-action="retry-purchases">Reintentar</button></div>';
        }
    }

    _renderBuyerOrderCard(o, esc) {
        const statusLabels = { pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado' };
        const img = (o.product_images && Array.isArray(o.product_images) && o.product_images[0]) ? esc(o.product_images[0]) : '';
        const imgTag = img ? `<img src="${img}" class="mc-order-img" alt="">` : '<div class="mc-order-img" style="display:flex;align-items:center;justify-content:center;font-size:1.4rem;">📦</div>';
        const total = parseFloat(o.total_price) || 0;
        const date = new Date(o.created_at).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
        const status = o.status || 'pending';
        const dispute = o.dispute_id ? `<span class="mc-dispute-badge">Disputa</span>` : '';
        let actions = '';
        if (status === 'pending') actions = `<button class="mc-btn-danger ds-btn ds-btn-danger" data-action="mc-buyer-cancel" data-id="${o.id}">Cancelar</button>`;
        else if (status === 'shipped') actions = `<button class="mc-btn-success ds-btn ds-btn-success" data-action="mc-buyer-confirm" data-id="${o.id}">Confirmar Recepcion</button>`;
        else if (status === 'delivered') {
            actions = `<button class="mc-btn-primary ds-btn ds-btn-primary" data-action="mc-product-review" data-id="${o.id}" data-product-id="${o.product_id}">Resena</button>`;
            if (!o.dispute_id) actions += `<button class="mc-btn-danger ds-btn ds-btn-danger" data-action="mc-open-dispute-form" data-order-id="${o.id}">Disputa</button>`;
        }
        return `<div class="mc-order-card ds-card ds-card-static" data-status="${esc(status)}" data-action="mc-order-detail" data-id="${o.id}">
            ${imgTag}
            <div class="mc-order-info">
                <p class="mc-order-title">${esc(o.product_title || 'Producto')}</p>
                <p class="mc-order-meta">${esc(o.seller_name || '')} &middot; ${date} &middot; x${o.quantity || 1} ${dispute}</p>
                <div class="mc-order-actions" onclick="event.stopPropagation();">${actions}</div>
            </div>
            <div class="mc-order-right">
                <div class="mc-order-price">L. ${window.ltFormatNumber ? ltFormatNumber(total, 2) : total.toLocaleString('es-HN', {minimumFractionDigits:2})}</div>
                <span class="mc-order-status mc-status-${esc(status)}">${statusLabels[status] || status}</span>
            </div>
        </div>`;
    }

    switchPurchaseTab(tabName) {
        document.querySelectorAll('.mc-tab').forEach(t => t.classList.toggle('active', t.dataset.mcTab === tabName));
        document.querySelectorAll('.mc-content').forEach(c => c.classList.remove('active'));
        const target = tabName === 'products' ? 'mcProductsContent' : 'mcServicesContent';
        document.getElementById(target)?.classList.add('active');
    }

    _filterBuyerOrders(status) {
        const container = document.getElementById('mcProductsContent');
        if (!container || !this._buyerOrders) return;
        const filtered = status ? this._buyerOrders.filter(o => o.status === status) : this._buyerOrders;
        if (filtered.length === 0) {
            container.innerHTML = '<div class="mc-empty"><i class="fas fa-filter"></i><p>Sin pedidos con este estado</p></div>';
            return;
        }
        const esc = this.escapeHtml.bind(this);
        container.innerHTML = filtered.map(o => this._renderBuyerOrderCard(o, esc)).join('');
    }

    // =====================================================
    // SHOPPING CART (sessionStorage)
    // =====================================================
    _getCart() { try { return JSON.parse(sessionStorage.getItem('mp_cart') || '[]'); } catch { return []; } }
    _saveCart(items) { sessionStorage.setItem('mp_cart', JSON.stringify(items)); this._updateCartBadge(); }
    _addToCart(product, quantity) {
        const items = this._getCart();
        const pid = String(product.productId || product.id);
        const existing = items.find(i => i.product_id === pid);
        if (existing) {
            existing.quantity = Math.min(existing.quantity + quantity, existing.max_qty);
        } else {
            items.push({
                product_id: pid,
                title: product.name || product.title || 'Producto',
                price: product.price,
                currency: product.currency || 'HNL',
                quantity: quantity,
                max_qty: Math.min(product.quantity || 10, 10),
                image: (product.images && product.images[0]) || product.image || '',
                seller_id: product.seller?.userId || product.seller_id || '',
                seller_name: product.seller?.name || product.seller_name || ''
            });
        }
        this._saveCart(items);
        this.showNotification(t('marketplace.added_to_cart',{defaultValue:'Agregado al carrito'}), 'success');
    }
    _removeFromCart(productId) {
        const items = this._getCart().filter(i => i.product_id !== String(productId));
        this._saveCart(items);
    }
    _updateCartQty(productId, qty) {
        const items = this._getCart();
        const item = items.find(i => i.product_id === String(productId));
        if (item) { item.quantity = Math.max(1, Math.min(qty, item.max_qty)); this._saveCart(items); }
    }
    _clearCart() { sessionStorage.removeItem('mp_cart'); this._updateCartBadge(); }
    _getCartCount() { return this._getCart().reduce((s, i) => s + i.quantity, 0); }
    _updateCartBadge() {
        const badge = document.getElementById('mcCartBadge');
        if (!badge) return;
        const count = this._getCartCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    openCartModal() {
        const existing = document.getElementById('mcCartOverlay');
        if (existing) existing.remove();
        const items = this._getCart();
        const esc = this.escapeHtml.bind(this);
        const overlay = document.createElement('div');
        overlay.id = 'mcCartOverlay';
        overlay.className = 'mc-cart-overlay ds-overlay';
        let itemsHtml = '';
        if (items.length === 0) {
            itemsHtml = '<div class="mc-cart-empty"><i class="fas fa-shopping-cart"></i><p>Tu carrito esta vacio</p></div>';
        } else {
            itemsHtml = items.map(i => {
                const imgTag = i.image ? `<img src="${esc(i.image)}" class="mc-cart-item-img" alt="">` : '<div class="mc-cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:1rem;">📦</div>';
                return `<div class="mc-cart-item" data-product-id="${esc(i.product_id)}">
                    ${imgTag}
                    <div class="mc-cart-item-info">
                        <div class="mc-cart-item-title">${esc(i.title)}</div>
                        <div class="mc-cart-item-price">L. ${window.ltFormatNumber ? ltFormatNumber(i.price, 2) : parseFloat(i.price).toLocaleString('es-HN',{minimumFractionDigits:2})} x ${i.quantity}</div>
                    </div>
                    <input type="number" class="mc-cart-item-qty" value="${i.quantity}" min="1" max="${i.max_qty}" data-action="mc-cart-qty" data-product-id="${esc(i.product_id)}">
                    <button class="mc-cart-item-remove" data-action="mc-cart-remove" data-product-id="${esc(i.product_id)}"><i class="fas fa-times"></i></button>
                </div>`;
            }).join('');
        }
        const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
        overlay.innerHTML = `<div class="mc-cart-modal">
            <div class="mc-cart-header"><h3><i class="fas fa-shopping-cart"></i> Carrito (${items.length})</h3><button class="mc-cart-close" data-action="mc-close-cart"><i class="fas fa-times"></i></button></div>
            <div class="mc-cart-body">${itemsHtml}</div>
            ${items.length > 0 ? `<div class="mc-cart-footer">
                <div class="mc-cart-total"><span>Total</span><span>L. ${window.ltFormatNumber ? ltFormatNumber(total, 2) : total.toLocaleString('es-HN', {minimumFractionDigits:2})}</span></div>
                <div class="mc-cart-payment">
                    <select id="mcCartPayment"><option value="wallet">Wallet LTD</option><option value="cash">Efectivo</option></select>
                </div>
                <div class="mc-cart-actions">
                    <button class="mc-cart-continue" data-action="mc-close-cart">Seguir Comprando</button>
                    <button class="mc-cart-checkout" data-action="mc-checkout">Pagar (${items.length})</button>
                </div>
            </div>` : ''}
        </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    async handleCartCheckout() {
        const items = this._getCart();
        if (items.length === 0) return;
        const paymentMethod = document.getElementById('mcCartPayment')?.value || 'cash';
        const checkoutBtn = document.querySelector('[data-action="mc-checkout"]');
        if (checkoutBtn) { checkoutBtn.disabled = true; checkoutBtn.textContent = 'Procesando...'; }
        let success = 0, failed = 0;
        for (let i = 0; i < items.length; i++) {
            if (checkoutBtn) checkoutBtn.textContent = `Procesando ${i + 1} de ${items.length}...`;
            try {
                const resp = await this.apiRequest(`/api/marketplace/products/${items[i].product_id}/buy`, {
                    method: 'POST',
                    body: JSON.stringify({ product_id: items[i].product_id, quantity: items[i].quantity, payment_method: paymentMethod })
                });
                if (resp.success || resp.order) success++;
                else failed++;
            } catch { failed++; }
        }
        document.getElementById('mcCartOverlay')?.remove();
        if (failed === 0) {
            this._clearCart();
            this.showNotification(`${success} pedido(s) creado(s) exitosamente`, 'success');
            mpNavigate('bookings');
            this.loadMyPurchases();
        } else {
            // Keep failed items in cart
            const successIds = new Set();
            const cart = this._getCart();
            // Remove all since we can't know which succeeded vs failed item-by-item
            // (sequential order matches), clear all on partial success too
            this._clearCart();
            this.showNotification(`${success} exitoso(s), ${failed} fallido(s)`, failed > 0 ? 'error' : 'success');
            mpNavigate('bookings');
            this.loadMyPurchases();
        }
    }

    // =====================================================
    // ORDER DETAIL + TRACKING
    // =====================================================
    async openOrderDetail(orderId) {
        const existing = document.getElementById('mcDetailOverlay');
        if (existing) existing.remove();
        try {
            const resp = await this.apiRequest(`/api/marketplace/product-orders/${orderId}`);
            if (!resp.success) throw new Error('No se pudo cargar el pedido');
            const o = resp.order || resp.data?.order;
            if (!o) throw new Error('No data');
            const esc = this.escapeHtml.bind(this);
            const statusLabels = { pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado' };
            const img = (o.product_images && Array.isArray(o.product_images) && o.product_images[0]) ? o.product_images[0] : '';
            const total = parseFloat(o.total_price) || 0;
            const createdDate = new Date(o.created_at).toLocaleDateString('es-HN', { day: 'numeric', month: 'long', year: 'numeric' });
            const steps = this._buildTimeline(o);
            let actions = '';
            if (o.status === 'pending') actions = `<button class="mc-btn-danger ds-btn ds-btn-danger" data-action="mc-buyer-cancel" data-id="${o.id}">Cancelar Pedido</button>`;
            else if (o.status === 'shipped') actions = `<button class="mc-btn-success ds-btn ds-btn-success" data-action="mc-buyer-confirm" data-id="${o.id}">Confirmar Recepcion</button>`;
            else if (o.status === 'delivered') {
                actions = `<button class="mc-btn-primary ds-btn ds-btn-primary" data-action="mc-product-review" data-id="${o.id}" data-product-id="${o.product_id}">Dejar Resena</button>`;
                if (!o.dispute_id) actions += `<button class="mc-btn-danger ds-btn ds-btn-danger" data-action="mc-open-dispute-form" data-order-id="${o.id}">Abrir Disputa</button>`;
            }
            const disputeInfo = o.dispute_id ? `<div class="mc-detail-section"><h4>Disputa</h4><div class="mc-detail-row"><span>Estado</span><span class="mc-dispute-status mc-dstatus-${esc(o.dispute_status || 'open')}">${esc(o.dispute_status || 'open')}</span></div><button class="btn btn-sm" style="margin-top:6px;padding:6px 12px;font-size:0.8rem;background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.3);border-radius:6px;cursor:pointer;" data-action="mc-view-dispute" data-id="${o.dispute_id}">Ver Disputa</button></div>` : '';
            const overlay = document.createElement('div');
            overlay.id = 'mcDetailOverlay';
            overlay.className = 'mc-detail-overlay ds-overlay';
            overlay.innerHTML = `<div class="mc-detail-modal">
                <div class="mc-detail-header"><h3>Pedido #${o.id}</h3><button class="mc-detail-close" data-action="mc-close-detail"><i class="fas fa-times"></i></button></div>
                <div class="mc-detail-body">
                    <div class="mc-detail-product">
                        ${img ? `<img src="${esc(img)}" alt="">` : '<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);border-radius:8px;font-size:2rem;">📦</div>'}
                        <div class="mc-detail-product-info">
                            <h4>${esc(o.product_title || 'Producto')}</h4>
                            <p>${o.quantity || 1} x L. ${window.ltFormatNumber ? ltFormatNumber(o.unit_price || 0, 2) : parseFloat(o.unit_price || 0).toLocaleString('es-HN',{minimumFractionDigits:2})}</p>
                            <p style="color:#10B981;font-weight:700;">Total: L. ${window.ltFormatNumber ? ltFormatNumber(total, 2) : total.toLocaleString('es-HN', {minimumFractionDigits:2})}</p>
                        </div>
                    </div>
                    <div class="mc-detail-section">
                        <h4>Informacion</h4>
                        <div class="mc-detail-row"><span>Vendedor</span><span>${esc(o.seller_name || '')}</span></div>
                        <div class="mc-detail-row"><span>Fecha</span><span>${createdDate}</span></div>
                        <div class="mc-detail-row"><span>Pago</span><span>${esc(o.payment_method || 'cash')}</span></div>
                        ${o.tracking_number ? `<div class="mc-detail-row"><span>Rastreo</span><span style="color:#8B5CF6;">${esc(o.tracking_number)}</span></div>` : ''}
                        <div class="mc-detail-row"><span>Estado</span><span class="mc-order-status mc-status-${esc(o.status)}">${statusLabels[o.status] || o.status}</span></div>
                    </div>
                    <div class="mc-detail-section"><h4>Seguimiento</h4><div class="mc-detail-timeline">${steps}</div></div>
                    ${disputeInfo}
                    <div class="mc-detail-actions" onclick="event.stopPropagation();">${actions}</div>
                </div>
            </div>`;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        } catch (err) {
            this.showNotification('Error cargando detalle del pedido', 'error');
        }
    }

    _buildTimeline(o) {
        const statusOrder = ['pending', 'paid', 'shipped', 'delivered'];
        const labels = { pending: 'Pedido creado', paid: 'Pago confirmado', shipped: 'Enviado', delivered: 'Entregado' };
        const currentIdx = statusOrder.indexOf(o.status);
        const isCancelled = o.status === 'cancelled';
        const isRefunded = o.status === 'refunded';
        let html = '';
        statusOrder.forEach((s, i) => {
            const cls = isCancelled || isRefunded ? '' : (i < currentIdx ? 'done' : i === currentIdx ? 'active' : '');
            const dateStr = (i === 0) ? new Date(o.created_at).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : (cls === 'done' || cls === 'active') ? (o.updated_at ? new Date(o.updated_at).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' }) : '') : '';
            html += `<div class="mc-tl-step ${cls}"><div class="mc-tl-dot"></div><div class="mc-tl-label">${labels[s]}</div>${dateStr ? `<div class="mc-tl-date">${dateStr}</div>` : ''}${s === 'shipped' && o.tracking_number && (cls === 'done' || cls === 'active') ? `<div class="mc-tl-tracking">Rastreo: ${this.escapeHtml(o.tracking_number)}</div>` : ''}</div>`;
        });
        if (isCancelled) html += `<div class="mc-tl-step error"><div class="mc-tl-dot"></div><div class="mc-tl-label">Cancelado</div><div class="mc-tl-date">${o.updated_at ? new Date(o.updated_at).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' }) : ''}</div></div>`;
        if (isRefunded) html += `<div class="mc-tl-step error"><div class="mc-tl-dot"></div><div class="mc-tl-label" style="color:#A855F7;">Reembolsado</div><div class="mc-tl-date">${o.updated_at ? new Date(o.updated_at).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' }) : ''}</div></div>`;
        return html;
    }

    // =====================================================
    // BUYER ORDER ACTIONS
    // =====================================================
    async handleBuyerOrderAction(orderId, action) {
        const labels = { cancel: 'Cancelar este pedido?', confirm_delivery: 'Confirmar que recibiste este pedido?' };
        const confirmed = await this.showConfirm(labels[action] || 'Confirmar?');
        if (!confirmed) return;
        try {
            const resp = await this.apiRequest(`/api/marketplace/product-orders/${orderId}/buyer-action`, {
                method: 'PUT', body: JSON.stringify({ action })
            });
            if (resp.success) {
                this.showNotification(action === 'cancel' ? 'Pedido cancelado' : 'Recepcion confirmada', 'success');
                document.getElementById('mcDetailOverlay')?.remove();
                this._loadBuyerProductOrders();
            } else {
                throw new Error(resp.error || 'Error');
            }
        } catch (err) {
            this.showNotification(err.message || 'Error al procesar accion', 'error');
        }
    }

    openProductReview(orderId, productId) {
        const existing = document.getElementById('mcReviewOverlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'mcReviewOverlay';
        overlay.className = 'mc-review-overlay ds-overlay';
        overlay.innerHTML = `<div class="mc-review-modal">
            <h3 style="margin:0 0 12px;color:#fff;">Dejar Resena</h3>
            <p style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin:0 0 8px;">Califica tu experiencia con este producto</p>
            <div class="mc-review-stars" id="mcReviewStars">
                ${[1,2,3,4,5].map(n => `<i class="far fa-star" data-rating="${n}"></i>`).join('')}
            </div>
            <textarea id="mcReviewComment" placeholder="Comentario (opcional)" maxlength="1000"></textarea>
            <button class="mc-review-submit" data-action="mc-submit-review" data-order-id="${orderId}" data-product-id="${productId}">Enviar Resena</button>
            <button style="width:100%;margin-top:6px;padding:8px;background:none;border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:rgba(255,255,255,0.6);cursor:pointer;" data-action="mc-close-review">Cancelar</button>
        </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        // Star interaction
        const starsContainer = document.getElementById('mcReviewStars');
        let selectedRating = 0;
        starsContainer.addEventListener('click', (e) => {
            const star = e.target.closest('[data-rating]');
            if (!star) return;
            selectedRating = parseInt(star.dataset.rating);
            starsContainer.querySelectorAll('i').forEach((s, i) => {
                s.className = i < selectedRating ? 'fas fa-star active' : 'far fa-star';
            });
        });
        overlay._getSelectedRating = () => selectedRating;
    }

    async _submitProductReview(orderId, productId) {
        const overlay = document.getElementById('mcReviewOverlay');
        if (!overlay) return;
        const rating = overlay._getSelectedRating ? overlay._getSelectedRating() : 0;
        if (rating === 0) { this.showNotification('Selecciona una calificacion', 'error'); return; }
        const comment = document.getElementById('mcReviewComment')?.value?.trim() || '';
        try {
            const resp = await this.apiRequest('/api/marketplace/reviews', {
                method: 'POST', body: JSON.stringify({ order_id: parseInt(orderId), product_id: parseInt(productId), overall_rating: rating, comment })
            });
            if (resp.success) {
                overlay.remove();
                this.showNotification('Resena enviada', 'success');
                this._loadBuyerProductOrders();
            } else {
                throw new Error(resp.error || 'Error');
            }
        } catch (err) {
            this.showNotification(err.message || 'Error al enviar resena', 'error');
        }
    }

    // =====================================================
    // DISPUTES
    // =====================================================
    openDisputeModal(orderId, bookingId) {
        const existing = document.getElementById('mcDisputeOverlay');
        if (existing) existing.remove();
        const reasonOptions = [
            { value: 'wrong_item', label: 'Articulo incorrecto' },
            { value: 'damaged', label: 'Articulo danado' },
            { value: 'not_received', label: 'No recibido' },
            { value: 'not_as_described', label: 'No coincide con descripcion' },
            { value: 'seller_unresponsive', label: 'Vendedor no responde' },
            { value: 'service_issue', label: 'Problema con servicio' },
            { value: 'other', label: 'Otro' }
        ];
        const overlay = document.createElement('div');
        overlay.id = 'mcDisputeOverlay';
        overlay.className = 'mc-dispute-overlay ds-overlay';
        overlay.innerHTML = `<div class="mc-dispute-modal">
            <div class="mc-dispute-header"><h3><i class="fas fa-exclamation-triangle"></i> Abrir Disputa</h3><button class="mc-detail-close" data-action="mc-close-dispute-form"><i class="fas fa-times"></i></button></div>
            <div class="mc-dispute-body mc-dispute-form">
                <label>Razon</label>
                <select id="mcDisputeReason">${reasonOptions.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}</select>
                <label>Descripcion</label>
                <textarea id="mcDisputeDesc" placeholder="Describe el problema en detalle..." maxlength="1000"></textarea>
                <input type="hidden" id="mcDisputeOrderId" value="${orderId || ''}">
                <input type="hidden" id="mcDisputeBookingId" value="${bookingId || ''}">
                <button class="mc-dispute-submit" data-action="mc-submit-dispute">Enviar Disputa</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    async _submitDispute() {
        const reason = document.getElementById('mcDisputeReason')?.value;
        const description = document.getElementById('mcDisputeDesc')?.value?.trim();
        const orderId = document.getElementById('mcDisputeOrderId')?.value;
        const bookingId = document.getElementById('mcDisputeBookingId')?.value;
        if (!description) { this.showNotification('Describe el problema', 'error'); return; }
        const body = { reason, description };
        if (orderId) body.order_id = parseInt(orderId);
        else if (bookingId) body.booking_id = parseInt(bookingId);
        try {
            const resp = await this.apiRequest('/api/marketplace/disputes', { method: 'POST', body: JSON.stringify(body) });
            if (resp.success) {
                document.getElementById('mcDisputeOverlay')?.remove();
                this.showNotification('Disputa creada', 'success');
                this._loadBuyerProductOrders();
            } else {
                throw new Error(resp.error || 'Error');
            }
        } catch (err) {
            this.showNotification(err.message || 'Error al crear disputa', 'error');
        }
    }

    async openDisputesList() {
        const existing = document.getElementById('mcDisputeOverlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'mcDisputeOverlay';
        overlay.className = 'mc-dispute-overlay ds-overlay';
        overlay.innerHTML = `<div class="mc-dispute-modal">
            <div class="mc-dispute-header"><h3>Mis Disputas</h3><button class="mc-detail-close" data-action="mc-close-dispute-form"><i class="fas fa-times"></i></button></div>
            <div class="mc-dispute-body"><div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);"><i class="fas fa-spinner fa-spin"></i> Cargando...</div></div>
        </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        try {
            const resp = await this.apiRequest('/api/marketplace/disputes');
            const disputes = resp.disputes || resp.data?.disputes || [];
            const body = overlay.querySelector('.mc-dispute-body');
            if (disputes.length === 0) {
                body.innerHTML = '<div class="mc-empty"><i class="fas fa-check-circle"></i><p>No tienes disputas</p></div>';
                return;
            }
            const esc = this.escapeHtml.bind(this);
            const statusLabels = { open: 'Abierta', seller_response: 'Respuesta del vendedor', resolved: 'Resuelta', closed: 'Cerrada' };
            body.innerHTML = disputes.map(d => {
                const title = d.product_title || d.service_title || `Disputa #${d.id}`;
                const date = new Date(d.created_at).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
                return `<div class="mc-dispute-card" data-status="${esc(d.status)}" data-action="mc-view-dispute" data-id="${d.id}">
                    <div class="mc-dispute-title">${esc(title)}</div>
                    <div class="mc-dispute-meta">${date} &middot; <span class="mc-dispute-status mc-dstatus-${esc(d.status)}">${statusLabels[d.status] || d.status}</span></div>
                </div>`;
            }).join('');
        } catch {
            overlay.querySelector('.mc-dispute-body').innerHTML = '<div class="mc-empty"><i class="fas fa-exclamation-circle"></i><p>Error cargando disputas</p></div>';
        }
    }

    async openDisputeDetail(disputeId) {
        try {
            const resp = await this.apiRequest(`/api/marketplace/disputes/${disputeId}`);
            const d = resp.dispute || resp.data?.dispute;
            if (!d) throw new Error('No data');
            const esc = this.escapeHtml.bind(this);
            const statusLabels = { open: 'Abierta', seller_response: 'Respuesta del vendedor', resolved: 'Resuelta', closed: 'Cerrada' };
            const reasonLabels = { wrong_item: 'Articulo incorrecto', damaged: 'Danado', not_received: 'No recibido', not_as_described: 'No coincide', seller_unresponsive: 'Vendedor no responde', service_issue: 'Problema con servicio', other: 'Otro' };
            const existing = document.getElementById('mcDisputeOverlay');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'mcDisputeOverlay';
            overlay.className = 'mc-dispute-overlay ds-overlay';
            let actionsHtml = '';
            if (d.status === 'open' && d.respondent_id === this.userId) {
                actionsHtml = `<div class="mc-dispute-respond"><h4 style="color:rgba(255,255,255,0.5);font-size:0.8rem;text-transform:uppercase;">Tu respuesta</h4><textarea id="mcDisputeResponse" placeholder="Escribe tu respuesta..." maxlength="2000"></textarea><button data-action="mc-respond-dispute" data-id="${d.id}">Enviar Respuesta</button></div>`;
            }
            if (d.status === 'resolved') {
                actionsHtml += `<button style="width:100%;margin-top:12px;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:rgba(255,255,255,0.8);cursor:pointer;" data-action="mc-close-dispute" data-id="${d.id}">Cerrar Disputa</button>`;
            }
            const evidenceHtml = d.evidence_images && Array.isArray(d.evidence_images) && d.evidence_images.length > 0
                ? `<div class="mc-dispute-evidence">${d.evidence_images.map(img => `<img src="${esc(img)}" alt="Evidencia">`).join('')}</div>` : '';
            overlay.innerHTML = `<div class="mc-dispute-modal">
                <div class="mc-dispute-header"><h3>Disputa #${d.id}</h3><button class="mc-detail-close" data-action="mc-close-dispute-form"><i class="fas fa-times"></i></button></div>
                <div class="mc-dispute-body">
                    <div class="mc-dispute-detail-section">
                        <h4>Estado</h4>
                        <span class="mc-dispute-status mc-dstatus-${esc(d.status)}">${statusLabels[d.status] || d.status}</span>
                    </div>
                    <div class="mc-dispute-detail-section">
                        <h4>Razon</h4><p>${reasonLabels[d.reason] || esc(d.reason)}</p>
                    </div>
                    <div class="mc-dispute-detail-section">
                        <h4>Descripcion</h4><p>${esc(d.description)}</p>
                        ${evidenceHtml}
                    </div>
                    ${d.product_title ? `<div class="mc-dispute-detail-section"><h4>Producto</h4><p>${esc(d.product_title)}</p></div>` : ''}
                    ${d.respondent_message ? `<div class="mc-dispute-detail-section"><h4>Respuesta del vendedor</h4><p>${esc(d.respondent_message)}</p><p style="font-size:0.75rem;color:rgba(255,255,255,0.4);">${d.respondent_at ? new Date(d.respondent_at).toLocaleDateString('es-HN') : ''}</p></div>` : ''}
                    ${d.resolution ? `<div class="mc-dispute-detail-section"><h4>Resolucion</h4><p>${esc(d.resolution_notes || d.resolution)}</p>${d.refund_amount > 0 ? `<p style="color:#10B981;">Reembolso: L. ${window.ltFormatNumber ? ltFormatNumber(d.refund_amount, 2) : parseFloat(d.refund_amount).toLocaleString('es-HN',{minimumFractionDigits:2})}</p>` : ''}</div>` : ''}
                    ${actionsHtml}
                </div>
            </div>`;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        } catch {
            this.showNotification('Error cargando disputa', 'error');
        }
    }

    async _respondToDispute(disputeId) {
        const msg = document.getElementById('mcDisputeResponse')?.value?.trim();
        if (!msg) { this.showNotification('Escribe tu respuesta', 'error'); return; }
        try {
            const resp = await this.apiRequest(`/api/marketplace/disputes/${disputeId}/respond`, { method: 'PUT', body: JSON.stringify({ message: msg }) });
            if (resp.success) {
                this.showNotification('Respuesta enviada', 'success');
                this.openDisputeDetail(disputeId);
            } else throw new Error(resp.error || 'Algo salio mal');
        } catch (err) { this.showNotification(err.message || 'Algo salio mal', 'error'); }
    }

    async _closeDispute(disputeId) {
        try {
            const resp = await this.apiRequest(`/api/marketplace/disputes/${disputeId}/close`, { method: 'PUT', body: JSON.stringify({}) });
            if (resp.success) {
                this.showNotification('Disputa cerrada', 'success');
                document.getElementById('mcDisputeOverlay')?.remove();
            } else throw new Error(resp.error || 'Algo salio mal');
        } catch (err) { this.showNotification(err.message || 'Algo salio mal', 'error'); }
    }

    // Booking system
    async loadBookingsData() {
        const container = document.getElementById('mcServicesContent');
        if (!container) return;

        // Show loading state
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                <div style="font-size: 32px; margin-bottom: 10px;">⏳</div>
                <p>Cargando reservas...</p>
            </div>
        `;

        try {
            // Fetch bookings from API (requires auth)
            if (!this.authToken) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                        <div style="font-size: 48px; margin-bottom: 20px;">📅</div>
                        <h3>Inicia sesión para ver tus reservas</h3>
                        <p>Crea una cuenta gratis para empezar a reservar servicios</p>
                        <button class="btn btn-primary ds-btn ds-btn-primary" style="margin-top: 15px;" onclick="goToLogin()">Iniciar Sesión</button>
                    </div>
                `;
                return;
            }

            const response = await this.apiRequest('/api/marketplace/bookings');

            if (response.success && response.bookings) {
                this.bookings = response.bookings.map(b => ({
                    id: b.booking_id,
                    bookingCode: b.booking_code,
                    serviceId: b.service_id,
                    service: b.service_title || 'Servicio',
                    provider: b.provider_name || 'Proveedor',
                    providerId: b.provider_id,
                    scheduledAt: new Date(`${b.scheduled_date}T${b.scheduled_time}`),
                    duration: parseFloat(b.duration_hours) || 1,
                    status: b.status,
                    price: parseFloat(b.quoted_price) || 0,
                    currency: b.currency || 'HNL',
                    finalPrice: b.final_price ? parseFloat(b.final_price) : null,
                    paymentStatus: b.payment_status,
                    address: b.service_address,
                    notes: b.customer_notes
                }));

                if (this.bookings.length === 0) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                            <div style="font-size: 48px; margin-bottom: 20px;">📅</div>
                            <h3>No tienes reservas aún</h3>
                            <p>Explora los servicios disponibles y haz tu primera reserva</p>
                            <button class="btn btn-primary ds-btn ds-btn-primary" style="margin-top: 15px;" onclick="window.marketplaceSystem.switchTab('services')">Ver Servicios</button>
                        </div>
                    `;
                    return;
                }

                this.renderBookings(container);
            } else {
                throw new Error('No bookings data returned');
            }
        } catch (error) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h3>Error cargando reservas</h3>
                    <p>Intenta de nuevo mas tarde.</p>
                    <button class="btn btn-secondary ds-btn ds-btn-secondary" style="margin-top: 15px;" data-action="retry-bookings">Reintentar</button>
                </div>
            `;
        }
    }

    renderBookings(container) {
        const statusLabels = {
            pending: { label: '⏳ Pendiente', color: '#F59E0B' },
            confirmed: { label: '✅ Confirmado', color: '#10B981' },
            in_progress: { label: '🔄 En Progreso', color: '#3B82F6' },
            completed: { label: '✔️ Completado', color: '#10B981' },
            cancelled: { label: '❌ Cancelado', color: '#EF4444' }
        };

        container.innerHTML = this.bookings.map(booking => {
            const status = statusLabels[booking.status] || statusLabels.pending;

            return `
                <div class="social-post">
                    <div class="post-header">
                        <div class="user-avatar">${booking.service.charAt(0)}</div>
                        <div class="user-info">
                            <div class="user-name">${booking.service}</div>
                            <div class="post-time">Proveedor: ${booking.provider} • ${booking.bookingCode || ''}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: #10B981;">${this.formatPrice(booking.price, booking.currency || 'HNL')}</div>
                            <div style="font-size: 12px; color: ${status.color};">${status.label}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px; margin-top: 10px; color: rgba(255,255,255,0.7); font-size: 14px; flex-wrap: wrap;">
                        <span>📅 ${booking.scheduledAt.toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span>🕐 ${booking.scheduledAt.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>⏱️ ${booking.duration}h</span>
                    </div>
                    ${booking.address ? `<div style="margin-top: 8px; color: rgba(255,255,255,0.6); font-size: 13px;">📍 ${booking.address}</div>` : ''}
                    <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                        ${booking.status === 'pending' ? `
                            <button class="btn btn-danger ds-btn ds-btn-danger" data-action="cancel-booking" data-id="${this.escapeHtml(booking.id)}">Cancelar</button>
                            <button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="contact-provider" data-id="${this.escapeHtml(booking.id)}">Contactar</button>
                        ` : booking.status === 'confirmed' ? `
                            <button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="reschedule-booking" data-id="${this.escapeHtml(booking.id)}">Reprogramar</button>
                            <button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="contact-provider" data-id="${this.escapeHtml(booking.id)}">Contactar</button>
                        ` : booking.status === 'completed' ? `
                            <button class="btn btn-primary ds-btn ds-btn-primary" data-action="leave-review" data-id="${this.escapeHtml(booking.id)}">Dejar Reseña</button>
                            <button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="rebook-service" data-id="${this.escapeHtml(booking.id)}">Reservar de Nuevo</button>
                        ` : `
                            <button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="contact-provider" data-id="${this.escapeHtml(booking.id)}">Contactar</button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Book a service - open for all logged-in users (free tier included)
    openBookingModal(serviceId) {
        // Guests need to login first
        if (this.isGuest) {
            this.showLoginPrompt('reservar servicios');
            return;
        }
        // Tier gate: booking limit
        if (!this.checkTierGate('book_service')) return;

        const service = this.services.find(s => s.id === serviceId);
        if (!service) {
            this.showNotification(t('marketplace.service_not_found',{defaultValue:'Servicio no encontrado'}), 'error');
            return;
        }

        const modal = document.getElementById('bookingModal');
        if (modal) {
            // Set service info
            document.getElementById('bookingServiceName').textContent = service.title;
            document.getElementById('bookingProviderName').textContent = service.provider.name;

            // Calculate and display price
            const cur = service.currency || 'HNL';
            const estimatedPrice = service.priceType === 'hourly'
                ? service.price * service.duration
                : service.price;
            const priceText = service.priceType === 'hourly'
                ? `${this.formatPrice(service.price, cur, '/hora')} × ${service.duration}h = ${this.formatPrice(estimatedPrice, cur)}`
                : service.priceType === 'quote'
                    ? `Precio estimado: ${this.formatPrice(service.price, cur)}+ (cotizar)`
                    : this.formatPrice(service.price, cur);

            document.getElementById('bookingPrice').textContent = priceText;
            document.getElementById('bookingServiceId').value = serviceId;

            // Show platform commission info
            const commEl = document.getElementById('bookingCommission');
            if (commEl) {
                const sellerTier = this.userSubscription || 'free';
                const commPct = getTierLimitsClient(sellerTier).platform_commission || 0;
                if (commPct > 0) {
                    const fee = Math.round(estimatedPrice * commPct) / 100;
                    commEl.textContent = 'Comision: ' + commPct + '% (L. ' + fee.toFixed(2) + ')';
                    commEl.style.display = '';
                } else {
                    commEl.innerHTML = '<span class="mc-commission-zero">Sin comision</span>';
                    commEl.style.display = '';
                }
            }

            // Show provider rating if available
            const ratingEl = document.getElementById('bookingProviderRating');
            if (ratingEl) {
                ratingEl.innerHTML = `⭐ ${this.escapeHtml(service.provider.rating)} (${this.escapeHtml(service.provider.completedJobs)} trabajos)`;
            }

            // Set min date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateInput = document.getElementById('bookingDate');
            if (dateInput) {
                dateInput.min = tomorrow.toISOString().split('T')[0];
                // Set max date to 30 days from now
                const maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + 30);
                dateInput.max = maxDate.toISOString().split('T')[0];
            }

            modal.classList.add('active');
        }
    }

    async submitBooking() {
        const serviceId = document.getElementById('bookingServiceId').value;
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const notes = document.getElementById('bookingNotes').value;
        const address = document.getElementById('bookingAddress')?.value || '';

        if (!date || !time) {
            this.showNotification('Por favor selecciona fecha y hora', 'error');
            return;
        }

        const service = this.services.find(s => s.id === serviceId);
        if (!service) {
            this.showNotification(t('marketplace.service_not_found',{defaultValue:'Servicio no encontrado'}), 'error');
            return;
        }

        // Check auth
        if (!this.authToken) {
            this.showLoginPrompt('crear reservas');
            return;
        }

        // Show loading
        const submitBtn = document.querySelector('#bookingModal .btn-primary');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }

        try {
            // Calculate price
            const quotedPrice = service.priceType === 'hourly'
                ? service.price * service.duration
                : service.price;

            // POST to real API
            const response = await this.apiRequest('/api/marketplace/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    service_id: service.serviceId || parseInt(serviceId.replace('srv_', '')),
                    scheduled_date: date,
                    scheduled_time: time,
                    duration_hours: service.duration,
                    quoted_price: quotedPrice,
                    service_address: address,
                    customer_notes: notes
                })
            });

            if (response.success) {
                this.closeBookingModal();
                this.showNotification('¡Reserva creada exitosamente! El proveedor confirmará pronto.', 'success');

                // Refresh bookings and switch to tab
                await this.loadBookingsData();
                this.switchTab('bookings');
            } else {
                throw new Error(response.error || 'Error al crear reserva');
            }
        } catch (error) {
            this.showNotification('Error al crear la reserva. Intenta de nuevo.', 'error');
        } finally {
            // Reset button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText || 'Reservar';
            }
        }
    }
    
    async loadMarketplaceData() {
        try {
            // Fetch products from real API
            const response = await this.apiRequest('/api/marketplace/products');

            const prods = response.data?.products || response.products;
            if (response.success && prods) {
                // Transform API response to frontend format
                this.products = prods.map(p => ({
                    id: `prod_${p.id}`,
                    productId: p.id,  // For referrals API
                    name: p.title,
                    description: p.description || '',
                    category: p.category_id,
                    categoryName: p.category_name,
                    price: parseFloat(p.price),
                    currency: p.currency || 'LTD',
                    quantity: p.quantity || 0,
                    image: this.getProductIcon(p.category_id, p.images),
                    images: p.images || [],
                    condition: p.condition || 'new',
                    location: p.location,
                    shippingAvailable: p.shipping_available,
                    shippingPrice: parseFloat(p.shipping_price) || 0,
                    seller: {
                        id: p.seller_id,
                        name: p.seller_name || 'Vendedor',
                        avatar: (p.seller_name || 'V').charAt(0).toUpperCase(),
                        avatarUrl: p.seller_avatar,
                        rating: p.avg_rating ? parseFloat(p.avg_rating) : null
                    },
                    featured: p.is_featured || false,
                    referralEnabled: p.referral_enabled,
                    referralCommission: parseFloat(p.referral_commission_percent) || 5,
                    views: p.views_count || 0,
                    created: new Date(p.created_at)
                }));

            } else {
                this.products = this.getFallbackProducts();
            }
        } catch (error) {
            this.products = this.getFallbackProducts();
        }
    }

    // Get product icon based on category or images
    getProductIcon(category, images) {
        // If images array has emoji-like content, use first one
        if (images && images.length > 0) {
            const icons = {
                'phone': '📱', 'jacket': '🧥', 'coffee': '☕', 'laptop': '💻',
                'headphones': '🎧', 'bed': '🛏️', 'camera': '📷', 'watch': '⌚',
                'shoes': '👟', 'bag': '👜', 'book': '📚', 'game': '🎮'
            };
            return icons[images[0]] || '📦';
        }
        // Fallback to category icons
        const categoryIcons = {
            'electronics': '📱', 'clothing': '👔', 'food': '🍽️', 'services': '💼',
            'home': '🏠', 'vehicles': '🚗', 'sports': '⚽', 'beauty': '💄'
        };
        return categoryIcons[category] || '📦';
    }

    // Fallback products if API fails
    getFallbackProducts() {
        return [
            {
                id: 'prod_1', productId: 1, name: 'Producto de Ejemplo',
                description: 'Cargando productos...', category: 'general',
                price: 100, quantity: 1, image: '📦',
                seller: { id: 'demo', name: 'Demo', avatar: 'D', rating: 5.0 },
                featured: false, created: new Date()
            }
        ];
    }
    
    async loadServicesData() {
        try {
            // Fetch services from real API
            const response = await this.apiRequest('/api/marketplace/services');

            const svcs = response.data?.services || response.services;
            if (response.success && svcs) {
                // Transform API response to frontend format
                this.services = svcs.map(s => ({
                    id: `srv_${s.service_id}`,
                    serviceId: s.service_id,
                    title: s.title,
                    description: s.description || s.short_description || '',
                    category: s.category_id,
                    priceType: s.price_type,
                    price: parseFloat(s.price),
                    priceMax: s.price_max ? parseFloat(s.price_max) : null,
                    currency: s.currency || 'HNL',
                    duration: parseFloat(s.duration_hours) || 1,
                    image: s.category_icon || this.getCategoryIcon(s.category_id),
                    images: s.images || [],
                    provider: {
                        id: `prov_${s.provider_id}`,
                        providerId: s.provider_id,
                        name: s.provider_name || s.provider_user_name || 'Proveedor',
                        avatar: (s.provider_name || s.provider_user_name || 'P').charAt(0).toUpperCase(),
                        image: s.provider_image,
                        rating: parseFloat(s.provider_rating) || 0,
                        completedJobs: s.provider_jobs || 0,
                        verified: s.provider_verified || false
                    },
                    availability: this.parseAvailability(s.availability),
                    featured: s.is_featured || false,
                    serviceAreas: s.service_areas || [s.city || 'Tegucigalpa'],
                    avgRating: parseFloat(s.avg_rating) || 0,
                    totalReviews: s.total_reviews || 0,
                    bookingCount: s.booking_count || 0,
                    categoryName: s.category_name || s.category_id
                }));

            } else {
                this.services = this.getFallbackServices();
            }
        } catch (error) {
            // Use fallback data on error
            this.services = this.getFallbackServices();
        }
    }

    // Parse availability JSON to readable format
    parseAvailability(availability) {
        if (!availability || typeof availability !== 'object') {
            return ['Horario flexible'];
        }

        const days = {
            monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
            thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom'
        };

        const result = [];
        for (const [day, times] of Object.entries(availability)) {
            if (times && times.length > 0) {
                result.push(`${days[day] || day}: ${times.join(', ')}`);
            }
        }

        return result.length > 0 ? result : ['Horario flexible'];
    }

    // Fallback services for when API fails
    getFallbackServices() {
        return [
            {
                id: 'srv_demo_001',
                title: 'Limpieza Profunda del Hogar',
                description: 'Servicio completo de limpieza: pisos, baños, cocina, ventanas.',
                category: 'cleaning',
                priceType: 'hourly',
                price: 150,
                duration: 3,
                image: '🧹',
                provider: { id: 'prov_demo_001', name: 'LimpiaHogar Pro', avatar: 'L', rating: 4.9, completedJobs: 234, verified: true },
                availability: ['Lun-Vie 8am-6pm'],
                featured: true,
                serviceAreas: ['Tegucigalpa']
            },
            {
                id: 'srv_demo_002',
                title: 'Reparación de Electrodomésticos',
                description: 'Reparamos lavadoras, refrigeradores, aires acondicionados y más.',
                category: 'repairs',
                priceType: 'fixed',
                price: 350,
                duration: 2,
                image: '🔧',
                provider: { id: 'prov_demo_002', name: 'TecniService HN', avatar: 'T', rating: 4.7, completedJobs: 156, verified: true },
                availability: ['Lun-Sáb 7am-7pm'],
                featured: true,
                serviceAreas: ['Tegucigalpa']
            }
        ];
    }

    
    updateAllDisplays() {
        this.loadMarketplaceProducts();
    }
    
    // ALG-04 T3: Search products/services with query from search bar
    searchProducts() {
        const desktopInput = document.getElementById('mpSearchInputDesktop');
        const mobileInput = document.getElementById('mpSearchInput');
        const query = (desktopInput?.value || mobileInput?.value || '').trim();

        // Read filter dropdowns
        const categoryVal = document.getElementById('categoryFilter')?.value || '';
        const locationVal = document.getElementById('locationFilter')?.value || '';
        const priceVal = document.getElementById('priceFilter')?.value || '';

        // If no query and no filters, do nothing
        if (!query && !categoryVal && !locationVal && !priceVal) return;

        // Switch to products tab and load with search param
        this._expTab = 'exp-productos';
        this._expOffset = 0;
        this._expSearchQuery = query || null;

        // Apply category from dropdown if set
        if (categoryVal) {
            this._expCategory = categoryVal;
        } else {
            this._expCategory = null;
        }

        // Store price filter for URL building
        this._expMinPrice = null;
        this._expMaxPrice = null;
        if (priceVal) {
            const parts = priceVal.split('-');
            this._expMinPrice = parseInt(parts[0]) || null;
            this._expMaxPrice = parts[1] ? parseInt(parts[1]) : null;
        }

        // Update tab UI
        const tabs = document.querySelectorAll('.exp-tab');
        tabs.forEach(t => t.classList.remove('active'));
        const prodTab = document.querySelector('[data-exp-tab="exp-productos"]');
        if (prodTab) prodTab.classList.add('active');

        // Reset category pills to "Todos"
        document.querySelectorAll('.exp-pill').forEach(p => p.classList.remove('active'));
        const todosP = document.querySelector('.exp-pill[data-value=""]');
        if (todosP) todosP.classList.add('active');

        // Navigate to explore section
        this.switchSection?.('explore');
        this.loadExplorarFeed('exp-productos', false);
    }

    // ALG-04 T3: Autocomplete
    _setupAutocomplete() {
        if (this._autocompleteSetup) return;
        this._autocompleteSetup = true;
        const inputs = [
            document.getElementById('mpSearchInputDesktop'),
            document.getElementById('mpSearchInput')
        ].filter(Boolean);

        inputs.forEach(input => {
            let dropdown = input.parentElement.querySelector('.mp-autocomplete');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.className = 'mp-autocomplete';
                input.parentElement.style.position = 'relative';
                input.parentElement.appendChild(dropdown);
            }

            let debounceTimer = null;
            input.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                const q = input.value.trim();
                if (q.length < 2) { dropdown.style.display = 'none'; return; }
                debounceTimer = setTimeout(async () => {
                    try {
                        const resp = await this.apiRequest('/api/marketplace/search/suggest?q=' + encodeURIComponent(q));
                        const suggestions = resp?.data?.suggestions || resp?.suggestions || [];
                        if (suggestions.length === 0) { dropdown.style.display = 'none'; return; }
                        dropdown.innerHTML = suggestions.map(s =>
                            '<div class="mp-ac-item" data-value="' + this.escapeHtml(s.suggestion) + '">' +
                            '<i class="fas fa-search mp-ac-icon"></i>' +
                            '<span>' + this.escapeHtml(s.suggestion) + '</span>' +
                            (s.source === 'popular' ? '<span class="mp-ac-badge">Popular</span>' : '') +
                            '</div>'
                        ).join('');
                        dropdown.style.display = 'block';
                    } catch (_) { dropdown.style.display = 'none'; }
                }, 300);
            });

            // Click on suggestion
            dropdown.addEventListener('click', (e) => {
                const item = e.target.closest('.mp-ac-item');
                if (!item) return;
                const val = item.dataset.value;
                input.value = val;
                // Also sync the other input
                inputs.forEach(i => { if (i !== input) i.value = val; });
                dropdown.style.display = 'none';
                this.searchProducts();
            });

            // Hide on outside click
            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });

            // Hide on Escape
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') dropdown.style.display = 'none';
            });
        });
    }

    loadMarketplaceProducts() {
        this._expOffset = 0;
        this._expTab = 'exp-tiendas';
        this._expLoading = false;
        this._expCategory = null;
        this._expSearchQuery = null;
        this._expTabsSetup = false;
        this._expCurrentPanel = 'inicio';
        this._setupExpSubtabs();
        this._setupAutocomplete();
        this._buildExplorarInicio();
    }

    _setupExpSubtabs() {
        if (this._expTabsSetup) return;
        this._expTabsSetup = true;

        // Category pills — per-panel containers
        const setupPills = (containerId, tab) => {
            const c = document.getElementById(containerId);
            if (!c) return;
            c.addEventListener('click', (e) => {
                const pill = e.target.closest('.exp-pill');
                if (!pill || pill.classList.contains('active')) return;
                c.querySelectorAll('.exp-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this._expCategory = pill.dataset.value || null;
                this._expOffset = 0;
                this._expSearchQuery = null;
                this._expMinPrice = null;
                this._expMaxPrice = null;
                this.loadExplorarFeed(this._expTab, false);
            });
        };
        setupPills('expCategoryPills', 'exp-tiendas');
        setupPills('expCategoryPillsProd', 'exp-productos');
        setupPills('expCategoryPillsSvc', 'exp-servicios');
    }


    async _loadDynamicCategoryPills(containerId, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        try {
            const resp = await this.apiRequest('/api/marketplace/categories/' + type);
            const cats = resp.data?.categories || resp.categories || [];
            let html = '<button class="exp-pill active" data-value="">Todos</button>';
            cats.forEach(c => {
                html += '<button class="exp-pill" data-value="' + this.escapeHtml(String(c.category_id)) + '">' + this.escapeHtml(c.icon || '') + ' ' + this.escapeHtml(c.name_es || '') + ' <span style="font-size:10px;opacity:0.5;">(' + c.count + ')</span></button>';
            });
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<button class="exp-pill active" data-value="">Todos</button>';
        }
    }

    async _loadDynamicCityPills(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        try {
            const resp = await this.apiRequest('/api/marketplace/providers/cities');
            const cities = resp.data?.cities || resp.cities || [];
            let html = '<button class="exp-pill active" data-value="">Todos</button>';
            cities.forEach(c => {
                html += '<button class="exp-pill" data-value="' + this.escapeHtml(c.city) + '">' + this.escapeHtml(c.city) + ' <span style="font-size:10px;opacity:0.5;">(' + c.count + ')</span></button>';
            });
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<button class="exp-pill active" data-value="">Todos</button>';
        }
    }

    _loadExpCategoryPills(tab, containerId) {
        const container = document.getElementById(containerId || 'expCategoryPills');
        if (!container) return;
        if (tab === 'exp-tiendas') {
            container.innerHTML = '<button class="exp-pill active" data-value="">Todos</button><span class="exp-pill" style="opacity:0.4;cursor:default;">Cargando...</span>';
            this._loadDynamicCityPills(containerId || 'expCategoryPills');
            return;
        } else if (tab === 'exp-productos' || tab === 'exp-recientes') {
            container.innerHTML = '<button class="exp-pill active" data-value="">Todos</button><span class="exp-pill" style="opacity:0.4;cursor:default;">...</span>';
            this._loadDynamicCategoryPills(containerId || 'expCategoryPillsProd', 'products');
        } else if (tab === 'exp-servicios') {
            container.innerHTML = '<button class="exp-pill active" data-value="">Todos</button><span class="exp-pill" style="opacity:0.4;cursor:default;">...</span>';
            this._loadDynamicCategoryPills(containerId || 'expCategoryPillsSvc', 'services');
        } else {
            container.innerHTML = '<button class="exp-pill active" data-value="">Todos</button>';
        }
    }

    _buildExplorarInicio() {
        const container = document.getElementById('expInicioContent');
        if (!container) return;
        const esc = (v) => this.escapeHtml(String(v || ''));

        let html = '';

        // Inner tabs: Categorias | Tiendas Destacadas | Productos Populares
        html += `<div class="exp-inner-tabs">
            <button class="exp-inner-tab exp-inner-active" data-action="exp-inner-tab" data-inner="categorias"><i class="fas fa-th-large"></i> Categorias</button>
            <button class="exp-inner-tab" data-action="exp-inner-tab" data-inner="tiendas-dest"><i class="fas fa-star"></i> Tiendas</button>
            <button class="exp-inner-tab" data-action="exp-inner-tab" data-inner="productos-pop"><i class="fas fa-fire"></i> Productos</button>
        </div>`;

        // Panel: Categorias
        const cats = this.categoriesData || [];
        let catGrid = '';
        if (cats.length > 0) {
            catGrid = cats.slice(0, 8).map(c =>
                '<div class="exp-cat-item" data-action="exp-cat-filter" data-cat-id="' + esc(String(c.category_id)) + '" data-cat-name="' + esc(c.name_es || c.name || '') + '">' +
                '<div class="exp-cat-icon">' + esc(c.icon || '') + '</div>' +
                '<div class="exp-cat-name">' + esc(c.name_es || c.name || '') + '</div>' +
                '</div>'
            ).join('');
        } else {
            catGrid = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--ds-text-muted,rgba(255,255,255,0.35));font-size:13px;">Cargando categorias...</div>';
        }
        html += '<div class="exp-inner-panel" data-inner-panel="categorias"><div class="exp-cat-grid">' + catGrid + '</div></div>';

        // Panel: Tiendas Destacadas
        html += `<div class="exp-inner-panel" data-inner-panel="tiendas-dest" style="display:none">
            <div id="expFeaturedStores" class="exp-inicio-scroll">
                <div class="exp-skeleton" style="min-width:260px;height:80px;border-radius:12px;"></div>
                <div class="exp-skeleton" style="min-width:260px;height:80px;border-radius:12px;"></div>
                <div class="exp-skeleton" style="min-width:260px;height:80px;border-radius:12px;"></div>
            </div>
            <div style="text-align:right;margin-top:8px;"><button class="exp-inicio-link" data-action="exp-subtab" data-subtab="tiendas">Ver todas las tiendas &rarr;</button></div>
        </div>`;

        // Panel: Productos Populares
        html += `<div class="exp-inner-panel" data-inner-panel="productos-pop" style="display:none">
            <div id="expPopularProducts" class="exp-inicio-scroll">
                <div class="exp-skeleton" style="min-width:260px;height:80px;border-radius:12px;"></div>
                <div class="exp-skeleton" style="min-width:260px;height:80px;border-radius:12px;"></div>
                <div class="exp-skeleton" style="min-width:260px;height:80px;border-radius:12px;"></div>
            </div>
            <div style="text-align:right;margin-top:8px;"><button class="exp-inicio-link" data-action="exp-subtab" data-subtab="productos">Ver todos los productos &rarr;</button></div>
        </div>`;

        // Quick actions — below inner tabs
        html += `<div style="margin-top:20px;">
            <div class="exp-inicio-header" style="margin-bottom:10px;"><div class="exp-inicio-title"><i class="fas fa-bolt"></i> Acciones rapidas</div></div>
            <div class="exp-quick-actions">
                <div class="exp-quick-card" data-action="exp-subtab" data-subtab="productos">
                    <div class="exp-quick-icon" style="background:rgba(139,92,246,0.15);color:var(--ds-purple,#8B5CF6);"><i class="fas fa-shopping-cart"></i></div>
                    <div class="exp-quick-label">Comprar</div>
                    <div class="exp-quick-sub">Productos y ofertas</div>
                </div>
                <div class="exp-quick-card" data-action="exp-sell-product">
                    <div class="exp-quick-icon" style="background:rgba(16,185,129,0.15);color:var(--ds-green,#10B981);"><i class="fas fa-tag"></i></div>
                    <div class="exp-quick-label">Vender</div>
                    <div class="exp-quick-sub">Publica tu producto</div>
                </div>
                <div class="exp-quick-card" data-action="exp-subtab" data-subtab="servicios">
                    <div class="exp-quick-icon" style="background:rgba(59,130,246,0.15);color:var(--ds-blue,#3B82F6);"><i class="fas fa-wrench"></i></div>
                    <div class="exp-quick-label">Servicios</div>
                    <div class="exp-quick-sub">Encuentra profesionales</div>
                </div>
            </div>
        </div>`;

        container.innerHTML = html;

        // Load async data for tiendas + productos panels
        this._loadInicioStores();
        this._loadInicioProducts();
    }

    _openCategoryDetail(catId, catName) {
        const container = document.getElementById('expInicioContent');
        if (!container) return;
        const esc = (v) => this.escapeHtml(String(v || ''));
        const catIcon = (this.categoriesData || []).find(c => String(c.category_id) === String(catId))?.icon || '';

        let html = '';

        // Back button + category title
        html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">';
        html += '<button data-action="exp-cat-back" style="background:none;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 12px;color:var(--ds-text-secondary,rgba(255,255,255,0.6));cursor:pointer;font-size:14px;display:flex;align-items:center;gap:6px;font-family:inherit;transition:border-color 0.2s;"><i class="fas fa-arrow-left"></i></button>';
        html += '<div style="flex:1;"><div style="font-size:18px;font-weight:700;color:var(--ds-text-primary,#fff);display:flex;align-items:center;gap:8px;">' + esc(catIcon) + ' ' + esc(catName) + '</div></div>';
        html += '</div>';

        // Inner tabs: Productos | Servicios
        html += '<div class="exp-inner-tabs">';
        html += '<button class="exp-cat-inner-tab exp-inner-tab exp-inner-active" data-action="exp-cat-inner" data-cat-inner="cat-productos"><i class="fas fa-box"></i> Productos</button>';
        html += '<button class="exp-cat-inner-tab exp-inner-tab" data-action="exp-cat-inner" data-cat-inner="cat-servicios"><i class="fas fa-wrench"></i> Servicios</button>';
        html += '</div>';

        // Products panel
        html += '<div class="exp-cat-detail-panel" data-cat-detail="cat-productos">';
        html += '<div id="expCatProducts" class="exp-feed"><div class="exp-skeleton"></div><div class="exp-skeleton"></div><div class="exp-skeleton"></div></div>';
        html += '<div id="expCatProductsMore" class="exp-load-more" style="display:none;"><button data-action="exp-cat-load-more" data-cat-type="productos" class="exp-load-more-btn">Cargar mas</button></div>';
        html += '</div>';

        // Services panel
        html += '<div class="exp-cat-detail-panel" data-cat-detail="cat-servicios" style="display:none">';
        html += '<div id="expCatServices" class="exp-feed"><div class="exp-skeleton"></div><div class="exp-skeleton"></div><div class="exp-skeleton"></div></div>';
        html += '<div id="expCatServicesMore" class="exp-load-more" style="display:none;"><button data-action="exp-cat-load-more" data-cat-type="servicios" class="exp-load-more-btn">Cargar mas</button></div>';
        html += '</div>';

        container.innerHTML = html;

        // Store state for pagination
        this._catDetailId = catId;
        this._catDetailName = catName;
        this._catProdOffset = 0;
        this._catSvcOffset = 0;

        // Load both feeds
        this._loadCategoryFeed('productos', false);
        this._loadCategoryFeed('servicios', false);
    }

    async _loadCategoryFeed(type, append) {
        const catId = this._catDetailId;
        if (!catId) return;
        const limit = 10;
        const isProd = type === 'productos';
        const containerId = isProd ? 'expCatProducts' : 'expCatServices';
        const moreId = isProd ? 'expCatProductsMore' : 'expCatServicesMore';
        const offset = isProd ? this._catProdOffset : this._catSvcOffset;

        const container = document.getElementById(containerId);
        const moreEl = document.getElementById(moreId);
        if (!container) return;

        if (!append) {
            container.innerHTML = '<div class="exp-skeleton"></div><div class="exp-skeleton"></div>';
        }

        let url = isProd
            ? '/api/marketplace/products?limit=' + limit + '&offset=' + offset + '&category=' + encodeURIComponent(catId)
            : '/api/marketplace/services?limit=' + limit + '&offset=' + offset + '&category=' + encodeURIComponent(catId);

        try {
            const resp = await this.apiRequest(url);
            const d = resp.data || resp;
            const items = isProd ? (d.products || []) : (d.services || []);

            if (items.length === 0 && !append) {
                const emptyLabel = isProd ? 'productos' : 'servicios';
                container.innerHTML = '<div class="exp-empty"><div class="exp-empty-icon">' + (isProd ? '📦' : '🔧') + '</div><div class="exp-empty-text">Sin ' + emptyLabel + ' en esta categoria</div></div>';
                if (moreEl) moreEl.style.display = 'none';
                return;
            }

            const tab = isProd ? 'exp-productos' : 'exp-servicios';
            const html = items.map(item => this._renderExpCard(item, tab)).join('');

            if (append) {
                container.insertAdjacentHTML('beforeend', html);
            } else {
                container.innerHTML = html;
            }

            if (isProd) this._catProdOffset += items.length;
            else this._catSvcOffset += items.length;

            if (moreEl) moreEl.style.display = items.length >= limit ? '' : 'none';
        } catch (err) {
            if (!append) {
                container.innerHTML = '<div class="exp-empty"><div class="exp-empty-icon">⚠️</div><div class="exp-empty-text">Error al cargar</div></div>';
            }
            if (moreEl) moreEl.style.display = 'none';
        }
    }

    async _loadInicioStores() {
        const container = document.getElementById('expFeaturedStores');
        if (!container) return;
        try {
            const resp = await this.apiRequest('/api/marketplace/providers?limit=6&offset=0');
            const providers = resp.data?.providers || resp.providers || [];
            if (providers.length === 0) {
                container.innerHTML = '<div style="padding:16px;color:var(--ds-text-muted,rgba(255,255,255,0.35));font-size:13px;">Sin tiendas disponibles aun.</div>';
                return;
            }
            container.innerHTML = providers.map(item => this._renderExpCard(item, 'exp-tiendas')).join('');
        } catch (e) {
            container.innerHTML = '<div style="padding:16px;color:var(--ds-text-muted,rgba(255,255,255,0.35));font-size:13px;">Error al cargar tiendas.</div>';
        }
    }

    async _loadInicioProducts() {
        const container = document.getElementById('expPopularProducts');
        if (!container) return;
        try {
            const resp = await this.apiRequest('/api/marketplace/products?limit=6&offset=0');
            const products = resp.data?.products || resp.products || [];
            if (products.length === 0) {
                container.innerHTML = '<div style="padding:16px;color:var(--ds-text-muted,rgba(255,255,255,0.35));font-size:13px;">Sin productos disponibles aun.</div>';
                return;
            }
            container.innerHTML = products.map(item => this._renderExpCard(item, 'exp-productos')).join('');
        } catch (e) {
            container.innerHTML = '<div style="padding:16px;color:var(--ds-text-muted,rgba(255,255,255,0.35));font-size:13px;">Error al cargar productos.</div>';
        }
    }

    async loadExplorarFeed(tab, append) {
        if (this._expLoading) return;
        this._expLoading = true;
        // Route to correct per-panel container
        let containerId = 'expFeedContainer';
        let loadMoreId = 'expLoadMore';
        if (tab === 'exp-productos' || tab === 'exp-recientes') { containerId = 'expFeedContainerProd'; loadMoreId = 'expLoadMoreProd'; }
        else if (tab === 'exp-servicios') { containerId = 'expFeedContainerSvc'; loadMoreId = 'expLoadMoreSvc'; }
        const container = document.getElementById(containerId);
        const loadMoreEl = document.getElementById(loadMoreId);
        if (!container) { this._expLoading = false; return; }
        const limit = 10;

        if (!append) {
            this._expOffset = 0;
            container.innerHTML = '<div class="exp-skeleton"></div><div class="exp-skeleton"></div><div class="exp-skeleton"></div>';
        }

        let url = '';
        const cat = this._expCategory;
        if (tab === 'exp-tiendas') {
            url = '/api/marketplace/providers?limit=' + limit + '&offset=' + this._expOffset;
            if (cat) url += '&city=' + encodeURIComponent(cat);
            if (this._expShopType) url += '&shop_type=' + encodeURIComponent(this._expShopType);
        } else if (tab === 'exp-productos' || tab === 'exp-recientes') {
            url = '/api/marketplace/products?limit=' + limit + '&offset=' + this._expOffset;
            if (cat) url += '&category=' + encodeURIComponent(cat);
            if (this._expSearchQuery) url += '&search=' + encodeURIComponent(this._expSearchQuery);
            if (this._expMinPrice) url += '&minPrice=' + this._expMinPrice;
            if (this._expMaxPrice) url += '&maxPrice=' + this._expMaxPrice;
        } else if (tab === 'exp-servicios') {
            url = '/api/marketplace/services?limit=' + limit + '&offset=' + this._expOffset;
            if (cat) url += '&category=' + encodeURIComponent(cat);
            if (this._expSearchQuery) url += '&search=' + encodeURIComponent(this._expSearchQuery);
        }

        try {
            const resp = await this.apiRequest(url);
            const d = resp.data || resp;
            let items = [];
            if (tab === 'exp-tiendas') items = d.providers || [];
            else if (tab === 'exp-servicios') items = d.services || [];
            else items = d.products || [];

            if (items.length === 0) {
                if (!append) {
                    container.innerHTML = '<div class="exp-empty"><div class="exp-empty-icon">📭</div><div class="exp-empty-text">No se encontraron resultados</div></div>';
                }
                if (loadMoreEl) loadMoreEl.style.display = 'none';
                this._expLoading = false;
                return;
            }

            const html = items.map(item => this._renderExpCard(item, tab)).join('');
            if (append) {
                container.insertAdjacentHTML('beforeend', html);
            } else {
                container.innerHTML = html;
            }
            this._expOffset += items.length;
            if (loadMoreEl) loadMoreEl.style.display = items.length >= limit ? '' : 'none';
        } catch (err) {
            if (!append) {
                container.innerHTML = '<div class="exp-empty"><div class="exp-empty-icon">⚠️</div><div class="exp-empty-text">Error al cargar datos</div><button class="exp-retry-btn" data-action="exp-retry">Reintentar</button></div>';
            }
            if (loadMoreEl) loadMoreEl.style.display = 'none';
        }
        this._expLoading = false;
    }

    _imgUrl(path) {
        if (!path) return path;
        // Cache bust for images that may have been 404 cached by browser
        return path + (path.includes('?') ? '&' : '?') + 'v=' + (window._imgCacheBust || '1');
    }

    _renderExpCard(item, tab) {
        const esc = (v) => this.escapeHtml(String(v || ''));
        if (tab === 'exp-tiendas') {
            const avatar = item.logo_image || item.profile_image || item.avatar_url;
            const initial = (item.business_name || 'T').charAt(0).toUpperCase();
            const avatarHtml = avatar
                ? '<img src="' + esc(avatar) + '" alt="" loading="lazy">'
                : '<span class="tc-avatar-initial">' + esc(initial) + '</span>';
            const verified = item.is_verified ? '<span class="tc-badge-verified"><i class="fas fa-check-circle"></i> Verificado</span>' : '';
            const rating = Number(item.avg_rating || 0).toFixed(1);
            const reviews = parseInt(item.total_reviews || 0);
            const jobs = parseInt(item.completed_jobs || 0);
            const responseRate = parseInt(item.response_rate || 0);
            const city = item.city || '';
            const shopTypeMap = { services: 'Servicios', products: 'Productos', mixed: 'Mixta' };
            const shopTypeIcon = { services: 'fa-wrench', products: 'fa-box', mixed: 'fa-store' };
            const shopLabel = shopTypeMap[item.shop_type] || 'Tienda';
            const shopIcon = shopTypeIcon[item.shop_type] || 'fa-store';
            const theme = item.store_theme || 'dark';
            const themeGradients = {
                dark: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                cyan: 'linear-gradient(135deg, #0c4a6e, #155e75)',
                gold: 'linear-gradient(135deg, #451a03, #78350f)',
                green: 'linear-gradient(135deg, #052e16, #14532d)',
                coral: 'linear-gradient(135deg, #450a0a, #7f1d1d)',
                purple: 'linear-gradient(135deg, #3b0764, #581c87)'
            };
            const coverBg = item.cover_image
                ? 'background-image:url(' + esc(item.cover_image) + ');background-size:cover;background-position:center;'
                : 'background:' + (themeGradients[theme] || themeGradients.dark) + ';';
            const desc = item.description ? esc(item.description.length > 60 ? item.description.substring(0, 60) + '...' : item.description) : '';

            return '<div class="tc-card" data-handle="' + esc(item.handle) + '">' +
                '<div class="tc-cover" style="' + coverBg + '">' +
                    '<div class="tc-cover-overlay"></div>' +
                    (verified ? '<div class="tc-cover-badge">' + verified + '</div>' : '') +
                    '<div class="tc-cover-type"><i class="fas ' + shopIcon + '"></i> ' + esc(shopLabel) + '</div>' +
                '</div>' +
                '<div class="tc-body">' +
                    '<div class="tc-avatar">' + avatarHtml + '</div>' +
                    '<div class="tc-info">' +
                        '<div class="tc-name">' + esc(item.business_name) + '</div>' +
                        (city ? '<div class="tc-location"><i class="fas fa-map-marker-alt"></i> ' + esc(city) + '</div>' : '') +
                        (desc ? '<div class="tc-desc">' + desc + '</div>' : '') +
                    '</div>' +
                '</div>' +
                '<div class="tc-stats">' +
                    '<div class="tc-stat"><div class="tc-stat-value">' + (rating === '0.0' ? '--' : rating) + '</div><div class="tc-stat-label"><i class="fas fa-star" style="color:var(--ds-amber,#F59E0B);"></i> Rating</div></div>' +
                    '<div class="tc-stat"><div class="tc-stat-value">' + jobs + '</div><div class="tc-stat-label"><i class="fas fa-briefcase"></i> Trabajos</div></div>' +
                    '<div class="tc-stat"><div class="tc-stat-value">' + (responseRate > 0 ? responseRate + '%' : '--') + '</div><div class="tc-stat-label"><i class="fas fa-bolt"></i> Respuesta</div></div>' +
                '</div>' +
                '<div class="tc-actions">' +
                    '<button class="tc-action-primary" data-action="exp-view-tienda" data-handle="' + esc(item.handle) + '"><i class="fas fa-eye"></i> Ver tienda</button>' +
                    '<button class="tc-action-icon" data-action="exp-share-tienda" data-handle="' + esc(item.handle) + '" data-name="' + esc(item.business_name) + '" title="Compartir"><i class="fas fa-share-alt"></i></button>' +
                '</div>' +
            '</div>';
        }

        if (tab === 'exp-servicios') {
            const sValidImgs = (item.images || []).map(i => typeof i === 'object' ? i.url : i).filter(u => u && (u.startsWith('/') || u.startsWith('http')));
            let sImgHtml = '';
            if (sValidImgs.length > 1) {
                const scId = 'scarousel_' + item.service_id;
                const sSlides = sValidImgs.map(u => '<div class="sd-carousel-slide"><img src="' + esc(this._imgUrl(u)) + '" alt="" loading="lazy"></div>').join('');
                const sDots = sValidImgs.map((_, i) => '<button class="sd-carousel-dot' + (i === 0 ? ' active' : '') + '" data-slide="' + i + '"></button>').join('');
                sImgHtml = '<div class="sd-carousel" id="' + scId + '" data-current="0" data-total="' + sValidImgs.length + '">' +
                    '<div class="sd-carousel-track">' + sSlides + '</div>' +
                    '<button class="sd-carousel-btn sd-carousel-prev" data-action="carousel-prev" data-carousel="' + scId + '"><i class="fas fa-chevron-left"></i></button>' +
                    '<button class="sd-carousel-btn sd-carousel-next" data-action="carousel-next" data-carousel="' + scId + '"><i class="fas fa-chevron-right"></i></button>' +
                    '<div class="sd-carousel-dots">' + sDots + '</div>' +
                    '<div class="sd-carousel-counter">1/' + sValidImgs.length + '</div>' +
                '</div>';
            } else if (sValidImgs.length === 1) {
                sImgHtml = '<img src="' + esc(this._imgUrl(sValidImgs[0])) + '" alt="" loading="lazy">';
            } else {
                sImgHtml = '<div class="sc-img-placeholder"><i class="fas ' + (item.category_icon ? 'fa-tag' : 'fa-wrench') + '"></i></div>';
            }
            const price = Number(item.price || 0);
            const fmt = window.ltFormatNumber ? ltFormatNumber(price) : price.toLocaleString('es-HN');
            const priceMax = Number(item.price_max || 0);
            const fmtMax = window.ltFormatNumber ? ltFormatNumber(priceMax) : priceMax.toLocaleString('es-HN');
            const priceLabel = item.price_type === 'fixed' ? 'L. ' + fmt
                : item.price_type === 'range' ? 'L. ' + fmt + ' - ' + fmtMax
                : item.price_type === 'hourly' ? 'L. ' + fmt + '/hora'
                : 'Consultar';
            const priceTag = item.price_type === 'hourly' ? 'por hora' : (item.price_type === 'range' ? 'rango' : '');
            const rating = Number(item.avg_rating || 0).toFixed(1);
            const reviews = parseInt(item.total_reviews || 0);
            const bookings = parseInt(item.booking_count || 0);
            const duration = item.duration_hours ? Number(item.duration_hours) : null;
            const durationLabel = duration ? (duration < 1 ? Math.round(duration * 60) + ' min' : duration + 'h') : '';
            const isFeatured = item.is_featured;
            const provName = item.provider_name || '';
            const provVerified = item.provider_verified;
            const provImg = item.provider_image;
            const city = item.city || '';
            const catLabel = item.category_name ? (esc(item.category_icon || '') + ' ' + esc(item.category_name)) : '';

            const scHasCarousel = sValidImgs.length > 1;
            return '<div class="sc-card" data-action="exp-view-servicio" data-id="' + esc(item.service_id) + '">' +
                (scHasCarousel ? sImgHtml : '<div class="sc-img">' + sImgHtml) +
                    (isFeatured ? '<div class="sc-featured"><i class="fas fa-star"></i> Destacado</div>' : '') +
                    (catLabel ? '<div class="sc-cat-badge">' + catLabel + '</div>' : '') +
                (scHasCarousel ? '' : '</div>') +
                '<div class="sc-body">' +
                    '<div class="sc-price-row">' +
                        '<div class="sc-price">' + priceLabel + '</div>' +
                        (priceTag ? '<span class="sc-price-tag">' + esc(priceTag) + '</span>' : '') +
                    '</div>' +
                    '<div class="sc-title">' + esc(item.title) + '</div>' +
                    '<div class="sc-stats-row">' +
                        '<span class="sc-stat"><i class="fas fa-star" style="color:var(--ds-amber,#F59E0B);"></i> ' + (rating === '0.0' ? '--' : rating) + (reviews > 0 ? ' (' + reviews + ')' : '') + '</span>' +
                        (bookings > 0 ? '<span class="sc-stat"><i class="fas fa-calendar-check"></i> ' + bookings + ' reservas</span>' : '') +
                        (durationLabel ? '<span class="sc-stat"><i class="far fa-clock"></i> ' + esc(durationLabel) + '</span>' : '') +
                    '</div>' +
                    '<div class="sc-provider">' +
                        (provImg ? '<img src="' + esc(provImg) + '" alt="" class="sc-provider-avatar">' : '<span class="sc-provider-dot"></span>') +
                        '<span>' + esc(provName) + '</span>' +
                        (provVerified ? '<i class="fas fa-check-circle" style="color:var(--ds-green,#10B981);font-size:11px;" title="Verificado"></i>' : '') +
                        (city ? '<span class="sc-city"><i class="fas fa-map-marker-alt"></i> ' + esc(city) + '</span>' : '') +
                    '</div>' +
                '</div>' +
            '</div>';
        }
        // Products (exp-productos, exp-recientes)
        const pValidImgs = (item.images || []).map(i => typeof i === 'object' ? i.url : i).filter(u => u && (u.startsWith('/') || u.startsWith('http')));
        const pImgSrc = pValidImgs.length > 0 ? pValidImgs[0] : null;
        let pImgHtml = '';
        if (pValidImgs.length > 1) {
            const pcId = 'pcarousel_' + item.id;
            const pSlides = pValidImgs.map(u => '<div class="sd-carousel-slide"><img src="' + esc(this._imgUrl(u)) + '" alt="" loading="lazy"></div>').join('');
            const pDots = pValidImgs.map((_, i) => '<button class="sd-carousel-dot' + (i === 0 ? ' active' : '') + '" data-slide="' + i + '"></button>').join('');
            pImgHtml = '<div class="sd-carousel" id="' + pcId + '" data-current="0" data-total="' + pValidImgs.length + '">' +
                '<div class="sd-carousel-track">' + pSlides + '</div>' +
                '<button class="sd-carousel-btn sd-carousel-prev" data-action="carousel-prev" data-carousel="' + pcId + '"><i class="fas fa-chevron-left"></i></button>' +
                '<button class="sd-carousel-btn sd-carousel-next" data-action="carousel-next" data-carousel="' + pcId + '"><i class="fas fa-chevron-right"></i></button>' +
                '<div class="sd-carousel-dots">' + pDots + '</div>' +
                '<div class="sd-carousel-counter">1/' + pValidImgs.length + '</div>' +
            '</div>';
        } else if (pImgSrc) {
            pImgHtml = '<img src="' + esc(this._imgUrl(pImgSrc)) + '" alt="" loading="lazy">';
        } else {
            pImgHtml = '<div class="pc-img-placeholder"><i class="fas fa-box"></i></div>';
        }
        const condMap = { new: 'Nuevo', used: 'Usado', like_new: 'Como nuevo', good: 'Bueno', refurbished: 'Reacondicionado' };
        const cond = condMap[item.condition] || '';
        const condClass = item.condition === 'new' ? 'pc-cond-new' : (item.condition === 'used' ? 'pc-cond-used' : 'pc-cond-other');
        const price = Number(item.price || 0);
        const fmt = window.ltFormatNumber ? ltFormatNumber(price) : price.toLocaleString('es-HN');
        const qty = parseInt(item.quantity || 0);
        const isFeatured = item.is_featured;
        const hasShipping = item.shipping_available;
        const catLabel = item.category_name ? (esc(item.category_icon || '') + ' ' + esc(item.category_name)) : '';
        const sellerName = item.seller_name || '';
        const sellerAvatar = item.seller_avatar;
        const imgCount = Array.isArray(item.images) ? item.images.length : 0;

        const pcHasCarousel = pValidImgs.length > 1;
        return '<div class="pc-card" data-action="exp-view-producto" data-id="' + esc(item.id) + '">' +
            (pcHasCarousel ? pImgHtml : '<div class="pc-img">' + pImgHtml) +
                (isFeatured ? '<div class="pc-featured"><i class="fas fa-star"></i></div>' : '') +
                (pcHasCarousel ? '' : (imgCount > 1 ? '<div class="pc-img-count"><i class="fas fa-images"></i> ' + imgCount + '</div>' : '')) +
                (cond ? '<div class="pc-condition ' + condClass + '">' + esc(cond) + '</div>' : '') +
            (pcHasCarousel ? '' : '</div>') +
            '<div class="pc-body">' +
                '<div class="pc-price">L. ' + fmt + '</div>' +
                '<div class="pc-title">' + esc(item.title) + '</div>' +
                '<div class="pc-meta">' +
                    (catLabel ? '<span class="pc-cat">' + catLabel + '</span>' : '') +
                    (hasShipping ? '<span class="pc-ship"><i class="fas fa-truck"></i> Envio</span>' : '') +
                    (qty > 0 && qty <= 3 ? '<span class="pc-low-stock"><i class="fas fa-exclamation-circle"></i> Poco stock</span>' : '') +
                    (qty === 0 ? '<span class="pc-sold-out">Agotado</span>' : '') +
                '</div>' +
                (sellerName ? '<div class="pc-seller">' +
                    (sellerAvatar ? '<img src="' + esc(sellerAvatar) + '" alt="" class="pc-seller-avatar">' : '<span class="pc-seller-dot"></span>') +
                    '<span>' + esc(sellerName) + '</span>' +
                '</div>' : '') +
            '</div>' +
        '</div>';
    }
    
    
    // filterProducts(), matchesPriceRange(), displayFilteredProducts() removed in v4.25.2 audit (dead code — Explorar uses loadExplorarFeed)

    createProductCard(product) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const cur = product.currency || 'HNL';
        const priceLabel = this.formatPrice(product.price, cur);
        const condLabels = { new: 'Nuevo', like_new: 'Como nuevo', good: 'Bueno', acceptable: 'Aceptable', used: 'Usado', refurbished: 'Reacondicionado' };
        const condLabel = condLabels[product.condition] || '';
        const stockLabel = product.quantity > 0 ? `${product.quantity} disponible${product.quantity > 1 ? 's' : ''}` : 'Agotado';
        const stockColor = product.quantity > 0 ? '#10B981' : '#EF4444';

        const imgSrc = product.images && product.images.length > 0
            ? (typeof product.images[0] === 'object' ? product.images[0].url : product.images[0])
            : null;
        const imgHtml = imgSrc && imgSrc.startsWith('http')
            ? `<img src="${esc(imgSrc)}" alt="" style="width:100%;height:100%;object-fit:cover;" loading="lazy">`
            : `<span style="font-size:48px;">${product.image || '📦'}</span>`;

        const ratingHtml = product.seller.rating
            ? `⭐ ${Number(product.seller.rating).toFixed(1)}`
            : '<span style="color:rgba(255,255,255,0.4);">Sin resenas</span>';

        const descText = (product.description || '').length > 100
            ? product.description.substring(0, 100) + '...'
            : (product.description || '');

        const commissionPercent = product.referralCommission || 5;
        const estimatedCommission = (product.price * commissionPercent / 100).toFixed(0);

        return `
            <div class="service-card" data-id="${esc(product.id)}">
                <div class="service-image" style="display:flex;align-items:center;justify-content:center;overflow:hidden;">
                    ${imgHtml}
                    ${condLabel ? `<div class="service-badge" style="background:rgba(139,92,246,0.9);">${esc(condLabel)}</div>` : ''}
                    ${product.is_featured ? '<div class="boost-badge"><i class="fas fa-rocket"></i> Impulsado</div>' : ''}
                </div>
                <div class="service-info">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <span style="font-size:12px;color:${stockColor};font-weight:600;">${esc(stockLabel)}</span>
                    </div>
                    <div class="service-title">${esc(product.name)}</div>
                    <div class="service-description">${esc(descText)}</div>
                    <div class="service-provider">
                        <div class="provider-avatar">${esc(product.seller.avatar)}</div>
                        <div class="provider-info">
                            <div class="provider-name">${esc(product.seller.name)}</div>
                            <div class="provider-rating">${ratingHtml}</div>
                        </div>
                    </div>
                    <div class="service-details">
                        <div class="service-price">${priceLabel}</div>
                    </div>
                    <div class="service-actions" style="display:flex;gap:8px;margin-top:12px;">
                        ${product.quantity > 0 ? `
                        <button class="btn btn-primary ds-btn ds-btn-primary" style="flex:1;" data-action="buy-product" data-id="${esc(product.id)}">
                            Comprar
                        </button>
                        <button class="btn btn-secondary ds-btn ds-btn-secondary" style="padding:10px 14px;" data-action="add-to-cart" data-id="${esc(product.id)}" title="Agregar al carrito">
                            <i class="fas fa-cart-plus"></i>
                        </button>` : `
                        <button class="btn btn-secondary ds-btn ds-btn-secondary" style="flex:1;opacity:0.5;" disabled>Agotado</button>`}
                        <button class="btn btn-secondary ds-btn ds-btn-secondary share-btn" style="padding:10px 14px;" data-action="share-product" data-id="${esc(product.id)}" title="Compartir y ganar ${this.formatPrice(parseFloat(estimatedCommission), cur)}">
                            <span>💰</span>
                        </button>
                    </div>
                    ${!this.isGuest ? ((this.tierLimits || getTierLimitsClient(this.userSubscription)).referral_commission > 0
                        ? `<div class="commission-hint" style="text-align:center;margin-top:8px;font-size:11px;color:rgba(0,255,255,0.7);">
                            💰 Gana ${this.formatPrice(parseFloat(estimatedCommission), cur)} por cada venta referida
                        </div>`
                        : `<div class="commission-hint" style="text-align:center;margin-top:8px;font-size:11px;color:rgba(255,255,255,0.4);">
                            Mejora tu plan para ganar comisiones por referidos
                        </div>`) : ''}
                </div>
            </div>
        `;
    }

    async loadMyStore() {
        const container = document.getElementById('myStoreContent');
        if (!container) return;

        const token = this.getAuthToken();
        if (!token) {
            container.innerHTML = `<div class="store-login-prompt">
                <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
                <h3 style="color: #fff; margin-bottom: 8px;">Inicia sesion</h3>
                <p>Necesitas una cuenta para crear tu tienda.</p>
            </div>`;
            return;
        }

        container.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">Cargando...</div>';

        try {
            const res = await this.apiRequest('/api/marketplace/providers/me');
            if (res.success && res.data?.provider) {
                this.renderStoreDashboard(res.data.provider);
            } else {
                this.renderStoreOnboarding();
            }
        } catch (err) {
            this.renderStoreOnboarding();
        }
    }

    async renderStoreOnboarding() {
        const container = document.getElementById('myStoreContent');
        if (!container) return;

        // Fetch total provider count for early adopter banner (H4 fix: single request)
        let totalProviders = 0;
        try {
            const res = await this.apiRequest('/api/marketplace/providers?limit=100&offset=0');
            totalProviders = res.data?.providers?.length || 0;
        } catch (e) { /* proceed without count */ }

        let earlyBannerHtml = '';
        if (totalProviders < 50) {
            const remaining = 50 - totalProviders;
            const pct = Math.round((totalProviders / 50) * 100);
            earlyBannerHtml = `<div class="early-adopter-banner">
                <div class="ea-title">Sorteo Early Seller</div>
                <div class="ea-desc">Los primeros 50 vendedores participan en un sorteo exclusivo de 1,000 LTD tokens</div>
                <div class="early-adopter-progress"><div class="early-adopter-progress-bar" style="width: ${pct}%;"></div></div>
                <div class="early-adopter-spots">${this.escapeHtml(String(totalProviders))}/50 registrados &mdash; Quedan ${this.escapeHtml(String(remaining))} lugares</div>
            </div>`;
        } else {
            earlyBannerHtml = `<div style="text-align:center;color:rgba(255,255,255,0.5);font-size:13px;margin-bottom:16px;">Ya somos ${this.escapeHtml(String(totalProviders))} vendedores en La Tanda</div>`;
        }

        this._earlyBannerHtml = earlyBannerHtml;

        container.innerHTML = `<div class="store-onboarding">
            ${earlyBannerHtml}
            <div class="store-onboarding-icon">🏪</div>
            <h2>Crea tu Tienda</h2>
            <div class="store-subtitle">Selecciona que vas a ofrecer. El tipo de tienda no se puede cambiar despues. Layout y tema si.</div>
            <div class="store-type-grid">
                <div class="store-type-card" data-action="select-shop-type" data-id="services">
                    <div class="store-type-icon">🔧</div>
                    <div class="store-type-name">Servicios</div>
                    <div class="store-type-desc">Freelance, consultorias, reparaciones</div>
                </div>
                <div class="store-type-card" data-action="select-shop-type" data-id="products">
                    <div class="store-type-icon">📦</div>
                    <div class="store-type-name">Productos</div>
                    <div class="store-type-desc">Productos fisicos, inventario, ventas</div>
                </div>
                <div class="store-type-card store-type-locked" data-action="select-shop-type" data-id="mixed">
                    <div class="store-type-lock">🔒</div>
                    <div class="store-type-icon">🏬</div>
                    <div class="store-type-name">Mixta</div>
                    <div class="store-type-desc">Servicios y productos</div>
                    <div class="store-type-premium">Premium</div>
                </div>
            </div>
        </div>`;
    }

    // Layout + Theme pickers merged into Quick Setup form below
    renderStoreLayoutPicker() { this.renderStoreOnboardingForm(); }
    renderStoreThemePicker() { this.renderStoreOnboardingForm(); }

    // ===================== ONBOARDING FORM (Step 4) =====================
    renderStoreOnboardingForm() {
        const container = document.getElementById('myStoreContent');
        if (!container) return;

        const shopType = this._selectedShopType;
        const typeLabel = shopType === 'services' ? '🔧 Servicios' : '📦 Productos';
        const layoutLabels = { classic: 'Clasica', showcase: 'Escaparate', compact: 'Tarjeta' };
        const layoutLabel = layoutLabels[this._selectedLayout] || 'Clasica';
        const themeLabels = { dark: 'Oscuro', cyan: 'Cyan', gold: 'Dorado', green: 'Verde', coral: 'Coral', purple: 'Purpura' };
        const themeLabel = themeLabels[this._selectedTheme] || 'Oscuro';

        container.innerHTML = `<div class="store-onboarding">
            ${this._earlyBannerHtml || ''}
            <div class="store-type-selected">
                <span class="store-type-chip">${typeLabel}</span>
                <span class="store-type-chip">🎨 ${this.escapeHtml(layoutLabel)}</span>
                <span class="store-type-chip">🎨 ${this.escapeHtml(themeLabel)}</span>
                <button class="store-type-change" data-action="change-theme">Cambiar</button>
            </div>
            <form id="storeOnboardingForm">
                <div class="store-form-group">
                    <label>Nombre del negocio *</label>
                    <input type="text" id="storeNameInput" required maxlength="255" placeholder="Ej: TechStore Honduras">
                </div>
                <div class="store-form-group">
                    <label>Descripcion *</label>
                    <textarea id="storeDescInput" required maxlength="2000" placeholder="Describe tu negocio, productos o servicios..."></textarea>
                </div>
                <div class="store-form-row">
                    <div class="store-form-group">
                        <label>Telefono</label>
                        <input type="tel" id="storePhoneInput" maxlength="20" placeholder="+504 9999-9999">
                    </div>
                    <div class="store-form-group">
                        <label>WhatsApp</label>
                        <input type="tel" id="storeWhatsappInput" maxlength="20" placeholder="+504 9999-9999">
                    </div>
                </div>
                <div class="store-form-group">
                    <label>Email de contacto</label>
                    <input type="email" id="storeEmailInput" maxlength="255" placeholder="contacto@minegocio.com">
                </div>
                <div class="store-form-row">
                    <div class="store-form-group">
                        <label>Ciudad</label>
                        <input type="text" id="storeCityInput" maxlength="100" placeholder="Tegucigalpa" value="Tegucigalpa">
                    </div>
                    <div class="store-form-group">
                        <label>Barrio / Zona</label>
                        <input type="text" id="storeNeighborhoodInput" maxlength="100" placeholder="Ej: Col. Kennedy">
                    </div>
                </div>
                <div class="store-form-group">
                    <label>Areas de servicio (separadas por coma)</label>
                    <input type="text" id="storeAreasInput" placeholder="Tegucigalpa, SPS, Comayagua">
                </div>
                <button type="submit" class="store-btn-create" id="storeCreateBtn">Crear mi Tienda \u2192</button>
                <div class="so-cta-note" style="margin-top:8px;">Links sociales se pueden agregar despues desde el dashboard.</div>
            </form>
        </div>`;

        const form = document.getElementById('storeOnboardingForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('storeCreateBtn');
                btn.disabled = true;
                btn.textContent = 'Creando...';

                const serviceAreas = document.getElementById('storeAreasInput').value
                    .split(',').map(s => s.trim()).filter(Boolean);

                const socialLinks = {};

                try {
                    const res = await this.apiRequest('/api/marketplace/providers/register', {
                        method: 'POST',
                        body: JSON.stringify({
                            business_name: document.getElementById('storeNameInput').value.trim(),
                            description: document.getElementById('storeDescInput').value.trim(),
                            phone: document.getElementById('storePhoneInput').value.trim() || undefined,
                            whatsapp: document.getElementById('storeWhatsappInput').value.trim() || undefined,
                            email: document.getElementById('storeEmailInput').value.trim() || undefined,
                            city: document.getElementById('storeCityInput').value.trim() || 'Tegucigalpa',
                            neighborhood: document.getElementById('storeNeighborhoodInput').value.trim() || undefined,
                            service_areas: serviceAreas.length ? serviceAreas : undefined,
                            social_links: Object.keys(socialLinks).length ? socialLinks : undefined,
                            shop_type: this._selectedShopType,
                            store_layout: this._selectedLayout || 'classic',
                            store_theme: this._selectedTheme || 'dark'
                        })
                    });

                    if (res.success) {
                        const providerId = res.data?.provider?.provider_id;
                        const isEarly = providerId && providerId <= 50;
                        const typeLabel2 = this._selectedShopType === 'services' ? '🔧 Servicios' : '📦 Productos';
                        container.innerHTML = `<div class="store-success">
                            <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
                            <h2 style="color: #fff; margin-bottom: 8px;">Tu tienda esta lista</h2>
                            <p style="color: rgba(255,255,255,0.6); margin-bottom: 8px;">Tu perfil de vendedor fue creado exitosamente.</p>
                            <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin-bottom: 16px;">Tipo: ${typeLabel2}</p>
                            ${isEarly ? `<div class="store-success-badge">🎁 Eres el vendedor #${this.escapeHtml(String(providerId))} &mdash; Inscrito en el sorteo Early Seller de 1,000 LTD</div>` : ''}
                            <button class="store-btn-create" data-action="view-my-store" style="max-width: 280px; margin: 20px auto 0;">Ver mi Tienda</button>
                        </div>`;
                    } else {
                        this.showNotification(t('marketplace.create_store_error',{defaultValue:'Error al crear la tienda'}), 'error');
                        btn.disabled = false;
                        btn.textContent = 'Crear mi Tienda';
                    }
                } catch (err) {
                    this.showNotification(t('marketplace.create_store_error',{defaultValue:'Error al crear la tienda'}), 'error');
                    btn.disabled = false;
                    btn.textContent = 'Crear mi Tienda';
                }
            });
        }
    }

    // ===================== DASHBOARD HELPERS =====================
    async _fetchStoreData(provider) {
        const shopType = provider.shop_type || 'services';
        const showServices = shopType === 'services' || shopType === 'mixed';
        const showProducts = shopType === 'products' || shopType === 'mixed';
        let services = [];
        let products = [];
        let reviews = [];

        // Always fetch both — orphan items need to be visible for deletion
        try {
            const providerDetail = await this.apiRequest(`/api/marketplace/providers/${provider.provider_id}`);
            if (providerDetail.success && providerDetail.data?.provider?.services) {
                services = providerDetail.data.provider.services;
            }
        } catch (e) { /* ok */ }

        try {
            const prodRes = await this.apiRequest(`/api/marketplace/products?sellerId=${provider.user_id}&limit=20`);
            if (prodRes.success && prodRes.data?.products) {
                products = prodRes.data.products;
            }
        } catch (e) { /* ok */ }

        try {
            const revRes = await this.apiRequest(`/api/marketplace/providers/${provider.provider_id}/reviews?limit=5`);
            if (revRes.success && revRes.data?.reviews) {
                reviews = revRes.data.reviews;
            }
        } catch (e) { /* ok */ }

        // Fetch seller orders
        let orders = [];
        try {
            const ordRes = await this.apiRequest('/api/marketplace/product-orders?role=seller&limit=50');
            if (ordRes.success && ordRes.data?.orders) {
                orders = ordRes.data.orders;
            }
        } catch (e) { /* ok */ }

        // Fetch seller bookings (service reservations)
        let bookings = [];
        if (showServices) {
            try {
                const bkRes = await this.apiRequest('/api/marketplace/bookings?role=provider&limit=50');
                if (bkRes.success) {
                    bookings = bkRes.data?.bookings || bkRes.bookings || [];
                }
            } catch (e) { /* ok — may fail for new providers */ }
        }

        return { services, products, reviews, orders, bookings, showServices, showProducts };
    }

    _buildStoreItemCards(items, type) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        if (items.length === 0) {
            return `<div class="store-empty">No tienes ${type === 'services' ? 'servicios' : 'productos'} aun. Agrega uno para empezar.</div>`;
        }
        return items.map((item, index) => {
            const icon = type === 'services' ? '🔧' : '📦';
            const imgSrc = item.images && item.images[0] ? (typeof item.images[0] === 'object' ? item.images[0].url : item.images[0]) : null;
            const img = imgSrc ? `<img src="${esc(imgSrc)}" alt="">` : icon;
            const meta = type === 'services'
                ? `${item.price_type === 'fixed' ? `L. ${esc(item.price)}` : esc(item.price_type)} · ${esc(item.booking_count || 0)} reservas`
                : `L. ${esc(item.price)} · ${esc(item.quantity || 0)} en stock`;
            const catLabel = item.category_name ? `${esc(item.category_icon || '')} ${esc(item.category_name)}` : '';
            const itemId = type === 'services' ? item.service_id : item.id;
            const featuredClass = item.featured ? ' featured-active' : '';
            return `<div class="store-item-card">
                <div class="store-item-img">${img}</div>
                <div class="store-item-info">
                    ${catLabel ? `<div class="store-item-category">${catLabel}</div>` : ''}
                    <div class="store-item-title">${esc(item.title)}</div>
                    <div class="store-item-meta">${meta}</div>
                </div>
                <div class="store-item-actions">
                    <button class="store-item-action-btn${featuredClass}" data-action="toggle-featured" data-type="${esc(type)}" data-id="${esc(itemId)}" data-featured="${item.featured ? 'true' : 'false'}" title="Destacar">\u2605</button>
                    <button class="store-item-action-btn" data-action="move-item-up" data-type="${esc(type)}" data-id="${esc(itemId)}" data-order="${esc(item.display_order || 0)}" title="Subir">\u2191</button>
                    <button class="store-item-action-btn" data-action="move-item-down" data-type="${esc(type)}" data-id="${esc(itemId)}" data-order="${esc(item.display_order || 0)}" title="Bajar">\u2193</button>
                </div>
            </div>`;
        }).join('');
    }

    _buildContactItems(provider) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const socialLinks = provider.social_links || {};
        let items = '';
        if (provider.phone) items += `<div class="store-contact-item"><span class="store-contact-icon">📞</span> ${esc(provider.phone)}</div>`;
        if (provider.whatsapp) items += `<div class="store-contact-item"><span class="store-contact-icon">💬</span> ${esc(provider.whatsapp)}</div>`;
        if (provider.email) items += `<div class="store-contact-item"><span class="store-contact-icon">📧</span> ${esc(provider.email)}</div>`;
        if (socialLinks.website) items += `<div class="store-contact-item"><span class="store-contact-icon">🌐</span> ${esc(socialLinks.website)}</div>`;
        if (socialLinks.github) items += `<div class="store-contact-item"><span class="store-contact-icon">🐙</span> ${esc(socialLinks.github)}</div>`;
        if (socialLinks.linkedin) items += `<div class="store-contact-item"><span class="store-contact-icon">💼</span> ${esc(socialLinks.linkedin)}</div>`;
        return items || '<div class="store-empty">No hay informacion de contacto.</div>';
    }

    _buildBadgesHtml(provider) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const shopType = provider.shop_type || 'services';
        const typeIcon = shopType === 'products' ? '📦' : shopType === 'mixed' ? '🏬' : '🔧';
        const typeLabel = shopType === 'products' ? 'Productos' : shopType === 'mixed' ? 'Mixta' : 'Servicios';
        let badges = '';
        if (provider.is_verified) badges += '<span class="store-badge-verified">✓ Verificado</span>';
        if (provider.provider_id <= 50) badges += '<span class="store-badge-early">🎁 Early Seller</span>';
        badges += `<span class="store-badge-type">${typeIcon} ${esc(typeLabel)}</span>`;
        // Tier badge
        const tier = this.userSubscription || 'free';
        if (tier !== 'free' && tier !== 'guest') {
            const tierLabels = { plan: 'Plan', premium: 'Premium', tanda_member: 'Tanda' };
            const tierClasses = { plan: 'store-badge-plan', premium: 'store-badge-premium', tanda_member: 'store-badge-tanda' };
            badges += `<span class="${tierClasses[tier] || 'store-badge-plan'}">${esc(tierLabels[tier] || tier)}</span>`;
        }
        return badges;
    }

    // ===================== DASHBOARD DISPATCHER =====================
    async renderStoreDashboard(provider) {
        const container = document.getElementById('myStoreContent');
        if (!container) return;
        this._currentProvider = provider;
        const layout = provider.store_layout || 'classic';
        const theme = provider.store_theme || 'dark';
        const storeData = await this._fetchStoreData(provider);

        // Fetch seller analytics for plan+ tiers
        const tierLimits = getTierLimitsClient(this.userSubscription || 'free');
        if (tierLimits.analytics_level !== 'basic') {
            try {
                const analyticsRes = await this.apiRequest('/api/marketplace/seller/analytics');
                if (analyticsRes.success) {
                    storeData.analytics = analyticsRes.data;
                }
            } catch (e) { /* ok */ }
        }
        storeData.analyticsLevel = tierLimits.analytics_level;

        // All layouts now use unified tabbed dashboard
        this._renderTabbedDashboard(container, provider, storeData, theme);
        // Fetch portfolio state once (M11 fix: was fetched 2-3 times)
        try {
            const cvRes = await this.apiRequest('/api/marketplace/portfolio/cv/me');
            this._currentPortfolio = cvRes.data?.portfolio || null;
        } catch { this._currentPortfolio = null; }

        // Portfolio banner + CTA (v4.5.0 / v4.6.0) — only for showcase/compact; V2 classic has inline quick actions
        if (layout !== 'classic') {
            const handle = provider.handle;
            if (handle) {
                const esc = (v) => this.escapeHtml(String(v ?? ''));
                const dashboard = container.querySelector('.store-dashboard');
                if (dashboard) {
                    const banner = document.createElement('div');
                    banner.className = 'store-portfolio-banner';
                    banner.innerHTML = `<span>Tu portafolio publico:</span> <a href="/tienda/${esc(handle)}" target="_blank">latanda.online/tienda/${esc(handle)}</a> <button data-action="copy-portfolio-url" data-url="https://latanda.online/tienda/${esc(handle)}">Copiar</button>`;
                    dashboard.insertBefore(banner, dashboard.firstChild);
                }
            }
            const dashboard2 = container.querySelector('.store-dashboard');
            if (dashboard2) {
                const cta = document.createElement('div');
                cta.className = 'store-portfolio-cta';
                cta.innerHTML = `<button class="store-btn-portfolio" data-action="open-portfolio-maker">${this._currentPortfolio ? 'Editar Portafolio / CV' : 'Crear Portafolio / CV'}</button>`;
                const banner2 = dashboard2.querySelector('.store-portfolio-banner');
                if (banner2) { banner2.after(cta); } else { dashboard2.insertBefore(cta, dashboard2.firstChild); }
            }
        }
    }

    // ===================== PORTFOLIO / CV MAKER (v4.6.0) =====================

    async openPortfolioMaker() {
        const container = document.getElementById('myStoreContent');
        if (!container) return;
        const esc = (v) => this.escapeHtml(String(v ?? ''));

        // Use cached portfolio or fetch if not loaded yet
        let portfolio = this._currentPortfolio || null;
        let userName = '', userEmail = '';
        if (!portfolio) {
            try {
                const res = await this.apiRequest('/api/marketplace/portfolio/cv/me');
                portfolio = res.data?.portfolio || null;
                this._currentPortfolio = portfolio;
            } catch { /* use defaults */ }
        }
        userName = portfolio?.full_name || '';
        userEmail = portfolio?.email || '';

        // If no name/email from portfolio, fetch from provider
        if (!userName && this._currentProvider) {
            userName = this._currentProvider.user_name || this._currentProvider.business_name || '';
        }

        this._portfolioData = {
            professional_title: portfolio?.professional_title || '',
            summary: portfolio?.summary || '',
            experience: portfolio?.experience || [],
            education: portfolio?.education || [],
            skills: portfolio?.skills || [],
            certifications: portfolio?.certifications || [],
            projects: portfolio?.projects || [],
            languages: portfolio?.languages || [],
            allow_downloads: portfolio?.allow_downloads || false,
            is_public: portfolio?.is_public !== false
        };

        const pd = this._portfolioData;
        this._cvFile = null;
        container.innerHTML = `
        <div class="portfolio-maker">
            <div class="portfolio-maker-header">
                <button class="portfolio-back-btn" data-action="back-to-store">&larr; Volver a Mi Tienda</button>
                <h2>Mi Portafolio Profesional</h2>
            </div>
            <div class="cv-import-section">
                <h3>Importar CV existente</h3>
                <div class="cv-upload-zone" id="cvUploadZone" data-action="import-cv-file">
                    <div class="cv-upload-zone-text">Arrastra tu CV aqui o haz click para seleccionar<br><small>PDF, max 5MB</small></div>
                </div>
                <input type="file" id="cvFileInput" accept="application/pdf" style="display:none">
                <div class="cv-file-preview" id="cvFilePreview" style="display:none"></div>
                <button class="cv-upload-btn" id="cvUploadBtn" data-action="process-cv-upload" disabled>Importar y extraer datos</button>
                <div class="cv-ai-spinner" id="cvParseSpinner" style="display:none"><span class="cv-spinner-dot"></span> Analizando CV con IA...</div>
                <div class="cv-import-result" id="cvImportResult" style="display:none"></div>
            </div>
            <div class="portfolio-identity">
                <div class="portfolio-identity-row"><span class="portfolio-id-label">Nombre:</span> <span class="portfolio-id-value">${esc(userName)}</span></div>
                <div class="portfolio-identity-row"><span class="portfolio-id-label">Email:</span> <span class="portfolio-id-value">${esc(userEmail)}</span></div>
                <div class="portfolio-identity-note">Datos vinculados a tu cuenta (no editables)</div>
            </div>
            <div class="portfolio-field">
                <label>Titulo profesional</label>
                <input type="text" id="cvTitle" maxlength="255" placeholder="Ej: Desarrollador Full Stack, Disenadora Grafica..." value="${esc(pd.professional_title)}">
            </div>
            <div class="portfolio-field">
                <label>Resumen profesional</label>
                <textarea id="cvSummary" maxlength="2000" rows="4" placeholder="Describe tu perfil profesional, experiencia y objetivos...">${esc(pd.summary)}</textarea>
                <button class="cv-ai-btn" data-action="generate-cv-summary" title="Generar resumen con IA">Generar con IA</button>
                <div class="cv-ai-spinner" id="cvSummarySpinner" style="display:none"><span class="cv-spinner-dot"></span> Generando resumen...</div>
            </div>
            <div id="cvSections">
                ${this._renderCvSection('experience', 'Experiencia', pd.experience)}
                ${this._renderCvSection('education', 'Educacion', pd.education)}
                ${this._renderCvSection('skills', 'Habilidades', pd.skills)}
                ${this._renderCvSection('certifications', 'Certificaciones', pd.certifications)}
                ${this._renderCvSection('projects', 'Proyectos', pd.projects)}
                ${this._renderCvSection('languages', 'Idiomas', pd.languages)}
            </div>
            <div class="portfolio-config">
                <label class="portfolio-toggle"><input type="checkbox" id="cvPublic" ${pd.is_public ? 'checked' : ''}> Portafolio publico</label>
                <label class="portfolio-toggle"><input type="checkbox" id="cvDownloads" ${pd.allow_downloads ? 'checked' : ''}> Permitir descargas de CV</label>
            </div>
            <div class="portfolio-actions">
                <button class="portfolio-btn-cancel" data-action="back-to-store">Cancelar</button>
                <button class="portfolio-btn-save" data-action="save-portfolio">Guardar</button>
            </div>
        </div>`;
        this._setupCvDropzone();
    }

    _setupCvDropzone() {
        const zone = document.getElementById('cvUploadZone');
        const fileInput = document.getElementById('cvFileInput');
        if (!zone || !fileInput) return;

        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('dragover'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer?.files?.[0];
            if (file) this._handleCvFileSelect(file);
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files?.[0]) this._handleCvFileSelect(fileInput.files[0]);
        });
    }

    _handleCvFileSelect(file) {
        const preview = document.getElementById('cvFilePreview');
        const uploadBtn = document.getElementById('cvUploadBtn');
        const result = document.getElementById('cvImportResult');
        if (!preview || !uploadBtn) return;

        if (file.type !== 'application/pdf') {
            this.showNotification('Solo se aceptan archivos PDF', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('El archivo es muy grande. Maximo 5MB.', 'error');
            return;
        }

        this._cvFile = file;
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        preview.innerHTML = `<span class="cv-file-name">${esc(file.name)}</span> <small>(${(file.size / 1024).toFixed(0)} KB)</small>`;
        preview.style.display = 'block';
        uploadBtn.disabled = false;
        if (result) { result.style.display = 'none'; result.textContent = ''; }
    }

    async processCvUpload() {
        if (!this._cvFile) return;
        const spinner = document.getElementById('cvParseSpinner');
        const uploadBtn = document.getElementById('cvUploadBtn');
        const result = document.getElementById('cvImportResult');
        if (spinner) spinner.style.display = 'flex';
        if (uploadBtn) uploadBtn.disabled = true;
        if (result) { result.style.display = 'none'; result.className = 'cv-import-result'; }

        try {
            const formData = new FormData();
            formData.append('file', this._cvFile);

            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            const response = await fetch(`${this.API_BASE}/api/marketplace/portfolio/cv/parse`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al procesar');

            const parsed = data.data?.portfolio || {};
            // Merge parsed data into current portfolio
            if (parsed.professional_title) { this._portfolioData.professional_title = parsed.professional_title; const el = document.getElementById('cvTitle'); if (el) el.value = parsed.professional_title; }
            if (parsed.summary) { this._portfolioData.summary = parsed.summary; const el = document.getElementById('cvSummary'); if (el) el.value = parsed.summary; }
            const sections = ['experience', 'education', 'skills', 'certifications', 'projects', 'languages'];
            sections.forEach(key => {
                if (Array.isArray(parsed[key]) && parsed[key].length) {
                    this._portfolioData[key] = parsed[key];
                    const listEl = document.getElementById('cvItems-' + key);
                    if (listEl) listEl.innerHTML = this._renderCvItems(key, parsed[key]);
                    // Update count in section header
                    const header = document.querySelector(`.portfolio-section[data-section="${key}"] .portfolio-section-label`);
                    if (header) {
                        const labels = { experience: 'Experiencia', education: 'Educacion', skills: 'Habilidades', certifications: 'Certificaciones', projects: 'Proyectos', languages: 'Idiomas' };
                        header.textContent = `${labels[key] || key} (${parsed[key].length})`;
                    }
                }
            });

            if (result) { result.textContent = 'Datos extraidos exitosamente'; result.className = 'cv-import-result cv-import-success'; result.style.display = 'block'; }
            this.showNotification('CV importado exitosamente', 'success');
        } catch (err) {
            if (result) { result.textContent = 'Error al analizar el CV. Intenta con otro archivo.'; result.className = 'cv-import-result cv-import-error'; result.style.display = 'block'; }
            this.showNotification('Error al importar CV', 'error');
        } finally {
            if (spinner) spinner.style.display = 'none';
            if (uploadBtn) uploadBtn.disabled = false;
        }
    }

    async generateAISummary() {
        const spinner = document.getElementById('cvSummarySpinner');
        const summaryEl = document.getElementById('cvSummary');
        const btn = document.querySelector('[data-action="generate-cv-summary"]');
        if (spinner) spinner.style.display = 'flex';
        if (btn) btn.disabled = true;

        try {
            // Collect current data from fields
            const title = document.getElementById('cvTitle')?.value || '';
            const pd = this._portfolioData;
            const response = await this.apiRequest('/api/marketplace/portfolio/cv/generate-summary', {
                method: 'POST',
                body: JSON.stringify({
                    professional_title: title,
                    experience: pd.experience || [],
                    skills: pd.skills || [],
                    education: pd.education || []
                })
            });

            const summary = response.data?.summary || '';
            if (summary && summaryEl) {
                summaryEl.value = summary;
                this._portfolioData.summary = summary;
            }
            this.showNotification('Resumen generado', 'success');
        } catch {
            this.showNotification('Error al generar resumen', 'error');
        } finally {
            if (spinner) spinner.style.display = 'none';
            if (btn) btn.disabled = false;
        }
    }

    _renderCvSection(key, label, items) {
        const count = Array.isArray(items) ? items.length : 0;
        return `
        <div class="portfolio-section" data-section="${key}">
            <div class="portfolio-section-header" data-action="toggle-cv-section" data-section="${key}">
                <span class="portfolio-section-arrow">&#9654;</span>
                <span class="portfolio-section-label">${label} (${count})</span>
            </div>
            <div class="portfolio-section-body" style="display:none">
                <div class="cv-items-list" id="cvItems-${key}">
                    ${this._renderCvItems(key, items)}
                </div>
                <button class="cv-add-btn" data-action="add-cv-item" data-section="${key}">+ Agregar</button>
            </div>
        </div>`;
    }

    _renderCvItems(key, items) {
        if (!Array.isArray(items) || !items.length) return '<div class="cv-empty">Sin elementos</div>';
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        return items.map((item, i) => {
            switch (key) {
                case 'experience': return `<div class="cv-item"><div class="cv-item-main"><strong>${esc(item.position)}</strong> en ${esc(item.company)}<br><small>${esc(item.start_date || '')} - ${item.current ? 'Presente' : esc(item.end_date || '')}</small>${item.description ? `<p class="cv-item-desc">${esc(item.description)}</p>` : ''}</div><div class="cv-item-actions"><button data-action="edit-cv-item" data-section="${key}" data-index="${i}" title="Editar">&#9998;</button><button data-action="remove-cv-item" data-section="${key}" data-index="${i}" title="Eliminar">&times;</button></div></div>`;
                case 'education': return `<div class="cv-item"><div class="cv-item-main"><strong>${esc(item.degree)}</strong> - ${esc(item.field || '')}<br><small>${esc(item.institution)} | ${item.start_year || ''}${item.end_year ? ' - ' + item.end_year : ''}</small></div><div class="cv-item-actions"><button data-action="edit-cv-item" data-section="${key}" data-index="${i}" title="Editar">&#9998;</button><button data-action="remove-cv-item" data-section="${key}" data-index="${i}" title="Eliminar">&times;</button></div></div>`;
                case 'skills': return `<div class="cv-item cv-skill-chip"><span>${esc(item.name)}</span><span class="cv-skill-level cv-level-${esc(item.level)}">${esc(item.level)}</span><button data-action="remove-cv-item" data-section="${key}" data-index="${i}" title="Eliminar">&times;</button></div>`;
                case 'certifications': return `<div class="cv-item"><div class="cv-item-main"><strong>${esc(item.name)}</strong><br><small>${esc(item.issuer)}${item.year ? ' (' + item.year + ')' : ''}</small>${item.url ? `<br><a href="${esc(item.url)}" target="_blank" rel="noopener">Ver certificado</a>` : ''}</div><div class="cv-item-actions"><button data-action="edit-cv-item" data-section="${key}" data-index="${i}" title="Editar">&#9998;</button><button data-action="remove-cv-item" data-section="${key}" data-index="${i}" title="Eliminar">&times;</button></div></div>`;
                case 'projects': return `<div class="cv-item"><div class="cv-item-main"><strong>${esc(item.title)}</strong>${item.description ? `<p class="cv-item-desc">${esc(item.description)}</p>` : ''}${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">Ver proyecto</a>` : ''}</div><div class="cv-item-actions"><button data-action="edit-cv-item" data-section="${key}" data-index="${i}" title="Editar">&#9998;</button><button data-action="remove-cv-item" data-section="${key}" data-index="${i}" title="Eliminar">&times;</button></div></div>`;
                case 'languages': return `<div class="cv-item cv-skill-chip"><span>${esc(item.language)}</span><span class="cv-skill-level cv-level-${esc(item.level)}">${esc(item.level)}</span><button data-action="remove-cv-item" data-section="${key}" data-index="${i}" title="Eliminar">&times;</button></div>`;
                default: return '';
            }
        }).join('');
    }

    _getCvInlineForm(key, item) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const val = (k) => item ? esc(item[k] || '') : '';
        switch (key) {
            case 'experience': return `
                <div class="cv-inline-form" data-section="${key}">
                    <input type="text" data-field="company" placeholder="Empresa" maxlength="255" value="${val('company')}">
                    <input type="text" data-field="position" placeholder="Puesto" maxlength="255" value="${val('position')}">
                    <div class="cv-form-row"><input type="month" data-field="start_date" value="${val('start_date')}"><input type="month" data-field="end_date" value="${val('end_date')}" ${item?.current ? 'disabled' : ''}></div>
                    <label class="cv-form-check"><input type="checkbox" data-field="current" ${item?.current ? 'checked' : ''}> Trabajo actual</label>
                    <textarea data-field="description" placeholder="Descripcion (opcional)" maxlength="1000" rows="2">${val('description')}</textarea>
                    <div class="cv-form-btns"><button data-action="confirm-cv-item" data-section="${key}">Guardar</button><button data-action="cancel-cv-form" data-section="${key}">Cancelar</button></div>
                </div>`;
            case 'education': return `
                <div class="cv-inline-form" data-section="${key}">
                    <input type="text" data-field="institution" placeholder="Institucion" maxlength="255" value="${val('institution')}">
                    <input type="text" data-field="degree" placeholder="Titulo/Grado" maxlength="255" value="${val('degree')}">
                    <input type="text" data-field="field" placeholder="Campo de estudio" maxlength="255" value="${val('field')}">
                    <div class="cv-form-row"><input type="number" data-field="start_year" placeholder="Inicio" min="1950" max="2050" value="${item?.start_year || ''}"><input type="number" data-field="end_year" placeholder="Fin" min="1950" max="2050" value="${item?.end_year || ''}"></div>
                    <div class="cv-form-btns"><button data-action="confirm-cv-item" data-section="${key}">Guardar</button><button data-action="cancel-cv-form" data-section="${key}">Cancelar</button></div>
                </div>`;
            case 'skills': return `
                <div class="cv-inline-form" data-section="${key}">
                    <input type="text" data-field="name" placeholder="Habilidad" maxlength="100" value="${val('name')}">
                    <select data-field="level"><option value="basico" ${item?.level === 'basico' ? 'selected' : ''}>Basico</option><option value="intermedio" ${(!item || item?.level === 'intermedio') ? 'selected' : ''}>Intermedio</option><option value="avanzado" ${item?.level === 'avanzado' ? 'selected' : ''}>Avanzado</option><option value="experto" ${item?.level === 'experto' ? 'selected' : ''}>Experto</option></select>
                    <div class="cv-form-btns"><button data-action="confirm-cv-item" data-section="${key}">Guardar</button><button data-action="cancel-cv-form" data-section="${key}">Cancelar</button></div>
                </div>`;
            case 'certifications': return `
                <div class="cv-inline-form" data-section="${key}">
                    <input type="text" data-field="name" placeholder="Nombre del certificado" maxlength="255" value="${val('name')}">
                    <input type="text" data-field="issuer" placeholder="Emisor" maxlength="255" value="${val('issuer')}">
                    <input type="number" data-field="year" placeholder="Ano" min="1950" max="2050" value="${item?.year || ''}">
                    <input type="url" data-field="url" placeholder="URL del certificado (opcional)" maxlength="500" value="${val('url')}">
                    <div class="cv-form-btns"><button data-action="confirm-cv-item" data-section="${key}">Guardar</button><button data-action="cancel-cv-form" data-section="${key}">Cancelar</button></div>
                </div>`;
            case 'projects': return `
                <div class="cv-inline-form" data-section="${key}">
                    <input type="text" data-field="title" placeholder="Titulo del proyecto" maxlength="255" value="${val('title')}">
                    <textarea data-field="description" placeholder="Descripcion" maxlength="1000" rows="2">${val('description')}</textarea>
                    <input type="url" data-field="url" placeholder="URL del proyecto (opcional)" maxlength="500" value="${val('url')}">
                    <div class="cv-form-btns"><button data-action="confirm-cv-item" data-section="${key}">Guardar</button><button data-action="cancel-cv-form" data-section="${key}">Cancelar</button></div>
                </div>`;
            case 'languages': return `
                <div class="cv-inline-form" data-section="${key}">
                    <input type="text" data-field="language" placeholder="Idioma" maxlength="100" value="${val('language')}">
                    <select data-field="level"><option value="basico" ${item?.level === 'basico' ? 'selected' : ''}>Basico</option><option value="intermedio" ${(!item || item?.level === 'intermedio') ? 'selected' : ''}>Intermedio</option><option value="avanzado" ${item?.level === 'avanzado' ? 'selected' : ''}>Avanzado</option><option value="nativo" ${item?.level === 'nativo' ? 'selected' : ''}>Nativo</option></select>
                    <div class="cv-form-btns"><button data-action="confirm-cv-item" data-section="${key}">Guardar</button><button data-action="cancel-cv-form" data-section="${key}">Cancelar</button></div>
                </div>`;
            default: return '';
        }
    }

    _collectCvFormData(form, key) {
        const get = (f) => { const el = form.querySelector(`[data-field="${f}"]`); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };
        switch (key) {
            case 'experience': return { company: get('company'), position: get('position'), start_date: get('start_date'), end_date: get('end_date'), current: get('current'), description: get('description') };
            case 'education': return { institution: get('institution'), degree: get('degree'), field: get('field'), start_year: parseInt(get('start_year')) || null, end_year: parseInt(get('end_year')) || null };
            case 'skills': return { name: get('name'), level: get('level') };
            case 'certifications': return { name: get('name'), issuer: get('issuer'), year: parseInt(get('year')) || null, url: get('url') || null };
            case 'projects': return { title: get('title'), description: get('description'), url: get('url') || null };
            case 'languages': return { language: get('language'), level: get('level') };
            default: return {};
        }
    }

    _refreshCvSection(key) {
        const listEl = document.getElementById(`cvItems-${key}`);
        if (!listEl) return;
        listEl.innerHTML = this._renderCvItems(key, this._portfolioData[key]);
        // Update count in header
        const sec = listEl.closest('.portfolio-section');
        if (sec) {
            const label = sec.querySelector('.portfolio-section-label');
            const count = (this._portfolioData[key] || []).length;
            const names = { experience: 'Experiencia', education: 'Educacion', skills: 'Habilidades', certifications: 'Certificaciones', projects: 'Proyectos', languages: 'Idiomas' };
            if (label) label.textContent = `${names[key] || key} (${count})`;
        }
    }

    handleToggleCvSection(sectionKey) {
        const sec = document.querySelector(`.portfolio-section[data-section="${sectionKey}"]`);
        if (!sec) return;
        const body = sec.querySelector('.portfolio-section-body');
        const arrow = sec.querySelector('.portfolio-section-arrow');
        if (body) {
            const open = body.style.display !== 'none';
            body.style.display = open ? 'none' : 'block';
            if (arrow) arrow.innerHTML = open ? '&#9654;' : '&#9660;';
        }
    }

    handleAddCvItem(sectionKey) {
        const listEl = document.getElementById(`cvItems-${sectionKey}`);
        if (!listEl) return;
        // Remove existing inline form
        const existing = listEl.parentElement.querySelector('.cv-inline-form');
        if (existing) existing.remove();
        this._cvEditIndex = null;
        const formHtml = this._getCvInlineForm(sectionKey, null);
        listEl.insertAdjacentHTML('afterend', formHtml);
        // Disable end_date when "current" is checked (experience)
        if (sectionKey === 'experience') {
            const form = listEl.parentElement.querySelector('.cv-inline-form');
            const chk = form?.querySelector('[data-field="current"]');
            const endDate = form?.querySelector('[data-field="end_date"]');
            if (chk && endDate) chk.addEventListener('change', () => { endDate.disabled = chk.checked; if (chk.checked) endDate.value = ''; });
        }
    }

    handleEditCvItem(sectionKey, index) {
        const items = this._portfolioData[sectionKey];
        if (!items || !items[index]) return;
        const listEl = document.getElementById(`cvItems-${sectionKey}`);
        if (!listEl) return;
        const existing = listEl.parentElement.querySelector('.cv-inline-form');
        if (existing) existing.remove();
        this._cvEditIndex = index;
        const formHtml = this._getCvInlineForm(sectionKey, items[index]);
        listEl.insertAdjacentHTML('afterend', formHtml);
        if (sectionKey === 'experience') {
            const form = listEl.parentElement.querySelector('.cv-inline-form');
            const chk = form?.querySelector('[data-field="current"]');
            const endDate = form?.querySelector('[data-field="end_date"]');
            if (chk && endDate) chk.addEventListener('change', () => { endDate.disabled = chk.checked; if (chk.checked) endDate.value = ''; });
        }
    }

    handleConfirmCvItem(sectionKey) {
        const sec = document.querySelector(`.portfolio-section[data-section="${sectionKey}"]`);
        if (!sec) return;
        const form = sec.querySelector('.cv-inline-form');
        if (!form) return;
        const data = this._collectCvFormData(form, sectionKey);
        // Basic validation
        const required = { experience: ['company', 'position'], education: ['institution', 'degree'], skills: ['name'], certifications: ['name', 'issuer'], projects: ['title'], languages: ['language'] };
        const missing = (required[sectionKey] || []).some(f => !data[f]);
        if (missing) { this.showNotification(t('forms.complete_required',{defaultValue:'Completa los campos obligatorios'}), 'error'); return; }
        if (!this._portfolioData[sectionKey]) this._portfolioData[sectionKey] = [];
        if (this._cvEditIndex != null) {
            this._portfolioData[sectionKey][this._cvEditIndex] = data;
        } else {
            this._portfolioData[sectionKey].push(data);
        }
        this._cvEditIndex = null;
        form.remove();
        this._refreshCvSection(sectionKey);
    }

    handleCancelCvForm(sectionKey) {
        const sec = document.querySelector(`.portfolio-section[data-section="${sectionKey}"]`);
        if (!sec) return;
        const form = sec.querySelector('.cv-inline-form');
        if (form) form.remove();
        this._cvEditIndex = null;
    }

    handleRemoveCvItem(sectionKey, index) {
        if (!this._portfolioData[sectionKey]) return;
        this._portfolioData[sectionKey].splice(index, 1);
        this._refreshCvSection(sectionKey);
    }

    async savePortfolio() {
        const title = document.getElementById('cvTitle');
        const summary = document.getElementById('cvSummary');
        const isPublic = document.getElementById('cvPublic');
        const allowDl = document.getElementById('cvDownloads');
        if (!title || !summary) return;
        const body = {
            professional_title: title.value.trim(),
            summary: summary.value.trim(),
            experience: this._portfolioData.experience || [],
            education: this._portfolioData.education || [],
            skills: this._portfolioData.skills || [],
            certifications: this._portfolioData.certifications || [],
            projects: this._portfolioData.projects || [],
            languages: this._portfolioData.languages || [],
            is_public: isPublic?.checked ?? true,
            allow_downloads: allowDl?.checked ?? false
        };
        try {
            await this.apiRequest('/api/marketplace/portfolio/cv/me', { method: 'PUT', body: JSON.stringify(body) });
            this.showNotification('Portafolio guardado', 'success');
            this.loadMyStore();
        } catch {
            this.showNotification('Error al guardar el portafolio', 'error');
        }
    }

    async downloadPortfolioPDF() {
        if (typeof window.jspdf === 'undefined') { this.showNotification('jsPDF no disponible', 'error'); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pd = this._portfolioData;
        const provider = this._currentProvider;
        const name = provider?.user_name || provider?.business_name || 'Portafolio';
        const pageW = doc.internal.pageSize.getWidth();
        let y = 20;

        const checkPage = (need) => { if (y + need > 275) { doc.addPage(); y = 20; } };
        const addSection = (title, content) => {
            if (!content || (Array.isArray(content) && !content.length)) return;
            checkPage(15);
            doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 200, 200);
            doc.text(title, 15, y); y += 2;
            doc.setDrawColor(0, 200, 200); doc.line(15, y, pageW - 15, y); y += 6;
            doc.setTextColor(50, 50, 50); doc.setFont(undefined, 'normal'); doc.setFontSize(10);
        };

        // Header with avatar
        let avatarDataUrl = null;
        const avatarUrl = provider?.profile_image;
        if (avatarUrl && (avatarUrl.startsWith('/uploads/') || avatarUrl.startsWith('https://'))) {
            try {
                const fullUrl = avatarUrl.startsWith('/') ? `${location.origin}${avatarUrl}` : avatarUrl;
                const resp = await fetch(fullUrl);
                const blob = await resp.blob();
                avatarDataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
            } catch { /* no avatar in PDF */ }
        }

        let textX = 15;
        if (avatarDataUrl) {
            try { doc.addImage(avatarDataUrl, 'JPEG', 15, y - 5, 25, 25); textX = 45; } catch { /* skip avatar */ }
        }

        doc.setFontSize(22); doc.setFont(undefined, 'bold'); doc.setTextColor(30, 30, 30);
        doc.text(name, textX, y); y += 8;
        if (pd.professional_title) { doc.setFontSize(12); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100); doc.text(pd.professional_title, textX, y); y += 8; }
        if (avatarDataUrl) y = Math.max(y, 45);
        doc.setDrawColor(0, 200, 200); doc.setLineWidth(0.5); doc.line(15, y, pageW - 15, y); y += 8;

        // Summary
        if (pd.summary) { addSection('Resumen Profesional'); const lines = doc.splitTextToSize(pd.summary, pageW - 30); checkPage(lines.length * 5); doc.text(lines, 15, y); y += lines.length * 5 + 5; }

        // Experience
        if (pd.experience?.length) {
            addSection('Experiencia Laboral');
            pd.experience.forEach(e => {
                checkPage(20);
                doc.setFont(undefined, 'bold'); doc.text(`${e.position} - ${e.company}`, 15, y); y += 5;
                doc.setFont(undefined, 'normal'); doc.setTextColor(120, 120, 120); doc.text(`${e.start_date || ''} - ${e.current ? 'Presente' : (e.end_date || '')}`, 15, y); y += 5;
                if (e.description) { doc.setTextColor(50, 50, 50); const dl = doc.splitTextToSize(e.description, pageW - 30); checkPage(dl.length * 4.5); doc.text(dl, 15, y); y += dl.length * 4.5; }
                y += 3;
            });
        }

        // Education
        if (pd.education?.length) {
            addSection('Educacion');
            pd.education.forEach(e => {
                checkPage(12);
                doc.setFont(undefined, 'bold'); doc.text(`${e.degree}${e.field ? ' - ' + e.field : ''}`, 15, y); y += 5;
                doc.setFont(undefined, 'normal'); doc.text(`${e.institution} | ${e.start_year || ''}${e.end_year ? ' - ' + e.end_year : ''}`, 15, y); y += 7;
            });
        }

        // Skills
        if (pd.skills?.length) {
            addSection('Habilidades');
            const skillText = pd.skills.map(s => `${s.name} (${s.level})`).join('  |  ');
            const sl = doc.splitTextToSize(skillText, pageW - 30);
            checkPage(sl.length * 5);
            doc.text(sl, 15, y); y += sl.length * 5 + 3;
        }

        // Certifications
        if (pd.certifications?.length) {
            addSection('Certificaciones');
            pd.certifications.forEach(c => {
                checkPage(8);
                doc.setFont(undefined, 'bold'); doc.text(`${c.name} - ${c.issuer}${c.year ? ' (' + c.year + ')' : ''}`, 15, y); y += 6;
                doc.setFont(undefined, 'normal');
            });
        }

        // Projects
        if (pd.projects?.length) {
            addSection('Proyectos');
            pd.projects.forEach(p => {
                checkPage(15);
                doc.setFont(undefined, 'bold'); doc.text(p.title, 15, y); y += 5;
                doc.setFont(undefined, 'normal');
                if (p.description) { const pl = doc.splitTextToSize(p.description, pageW - 30); checkPage(pl.length * 4.5); doc.text(pl, 15, y); y += pl.length * 4.5; }
                if (p.url) { doc.setTextColor(0, 100, 200); doc.text(p.url, 15, y); y += 5; doc.setTextColor(50, 50, 50); }
                y += 3;
            });
        }

        // Languages
        if (pd.languages?.length) {
            addSection('Idiomas');
            const langText = pd.languages.map(l => `${l.language} (${l.level})`).join('  |  ');
            doc.text(langText, 15, y); y += 7;
        }

        // Footer
        const handle = this._currentProvider?.handle;
        const footerY = 285;
        doc.setFontSize(8); doc.setTextColor(150, 150, 150);
        doc.text('Documento para uso profesional unicamente. Prohibida su redistribucion sin autorizacion.', 15, footerY);
        if (handle) doc.text(`Generado desde latanda.online/tienda/${handle} - ${new Date().toLocaleDateString('es-HN')}`, 15, footerY + 4);

        doc.save(`CV-${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        this.showNotification('CV descargado', 'success');
    }

    // ===================== CLASSIC V2 LAYOUT (Shopify-inspired) =====================

    _renderTabbedDashboard(container, provider, storeData, theme) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const activeTab = this._activeStoreTab || sessionStorage.getItem('store_active_tab') || 'resumen';
        const isActive = (tab) => tab === activeTab ? ' sd-tab-active' : '';
        const isVisible = (tab) => tab === activeTab ? '' : ' style="display:none"';

        // Cover is rendered in the header wrapper (background-image)

        container.innerHTML = `<div class="store-dashboard sd-tabbed" data-theme="${esc(theme)}">
            ${this._buildDashboardHeader(provider, esc)}
            <div class="sd-tabs">
                <button class="sd-tab${isActive('resumen')}" data-action="store-tab" data-tab="resumen"><i class="fas fa-chart-pie"></i> <span>Resumen</span></button>
                <button class="sd-tab${isActive('publicaciones')}" data-action="store-tab" data-tab="publicaciones"><i class="fas fa-box"></i> <span>Publicaciones</span></button>
                <button class="sd-tab${isActive('pedidos')}" data-action="store-tab" data-tab="pedidos"><i class="fas fa-clipboard-list"></i> <span>Pedidos</span></button>
                <button class="sd-tab${isActive('config')}" data-action="store-tab" data-tab="config"><i class="fas fa-cog"></i> <span>Config</span></button>
            </div>
            <input type="file" id="coverFileInput" accept="image/jpeg,image/png,image/webp" style="display:none">
            <input type="file" id="logoFileInput" accept="image/jpeg,image/png,image/webp" style="display:none">

            <div class="sd-tab-panel" id="sdTabResumen"${isVisible('resumen')}>
                ${this._buildResumenSubtabs(provider, storeData, esc)}
            </div>

            <div class="sd-tab-panel" id="sdTabPublicaciones"${isVisible('publicaciones')}>
                ${this._buildPublicacionesSubtabs(storeData, provider, esc)}
            </div>

            <div class="sd-tab-panel" id="sdTabPedidos"${isVisible('pedidos')}>
                ${this._buildPedidosSubtabs(storeData, provider, esc)}
            </div>

            <div class="sd-tab-panel" id="sdTabConfig"${isVisible('config')}>
                ${this._buildConfigSubtabs(provider, storeData, esc)}
            </div>
        </div>`;

        // Cover upload handler
        const logoInput = document.getElementById('logoFileInput');
        if (logoInput) {
            logoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 3 * 1024 * 1024) { this.showNotification('La imagen excede 3MB', 'error'); return; }
                const formData = new FormData();
                formData.append('image', file);
                try {
                    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
                    const resp = await fetch('/api/marketplace/providers/logo-image', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: formData });
                    const result = await resp.json();
                    if (result.success) { this.showNotification('Logo actualizado', 'success'); this.loadMyStore(); }
                    else { this.showNotification(result.data?.error?.message || 'Error al subir logo', 'error'); }
                } catch (err) { this.showNotification('Error de conexion', 'error'); }
                logoInput.value = '';
            });
        }

        const coverInput = document.getElementById('coverFileInput');
        if (coverInput) {
            coverInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { this.showNotification('La imagen excede 5MB', 'error'); return; }
                const formData = new FormData();
                formData.append('image', file);
                try {
                    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
                    const resp = await fetch('/api/marketplace/providers/cover-image', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: formData });
                    const result = await resp.json();
                    if (result.success) { this.showNotification('Portada actualizada', 'success'); this.loadMyStore(); }
                    else { this.showNotification(result.data?.error?.message || 'Error al subir portada', 'error'); }
                } catch (err) { this.showNotification('Error de conexion', 'error'); }
                coverInput.value = '';
            });
        }

        // Sticky header — hide on scroll down, show on scroll up
        const headerWrapper = container.querySelector('.sd-header-wrapper');
        if (headerWrapper) {
            headerWrapper.classList.add('sd-header-sticky');
            let lastScrollY = 0;
            window.addEventListener('scroll', function() {
                const currentY = window.scrollY;
                if (currentY > lastScrollY && currentY > 200) {
                    headerWrapper.classList.add('sd-header-hidden');
                } else {
                    headerWrapper.classList.remove('sd-header-hidden');
                }
                lastScrollY = currentY;
            }, { passive: true });
        }

        this._loadChainBalance();
        this._loadReferralDashboard();
    }

    _renderDashboardClassicV2(container, provider, storeData, theme) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const header = this._buildDashboardHeader(provider, esc);
        const quickActions = this._buildQuickActionsToolbar(provider, esc);
        const analytics = this._buildAnalyticsSummary(provider, storeData, esc);
        const preview = this._buildStorePreviewCard(provider, esc);
        const listings = this._buildTabbedListings(storeData, provider, esc);
        const reviews = this._buildRecentReviews(storeData.reviews || [], esc);
        const themes = this._buildThemeBrowser(provider, esc);
        const contactItems = this._buildContactItems(provider);
        const tierCard = this.renderTierProgressCard();

        // Enhanced analytics for plan+ tiers
        let sellerAnalytics = '';
        if (storeData.analytics && storeData.analyticsLevel !== 'basic') {
            const a = storeData.analytics;
            const summary = a.summary || {};
            let extraCards = '';
            extraCards += `<div class="sd-analytics-card">
                <div class="sd-analytics-icon sd-icon-ventas"><i class="fas fa-coins"></i></div>
                <div class="sd-analytics-body">
                    <div class="sd-analytics-value">L. ${window.ltFormatNumber ? ltFormatNumber(summary.total_revenue || 0) : parseFloat(summary.total_revenue || 0).toLocaleString('es-HN')}</div>
                    <div class="sd-analytics-label">Ingresos totales</div>
                    <div class="sd-analytics-sub">${esc(String(summary.total_orders || 0))} pedidos</div>
                </div>
            </div>`;
            const pendingCount = parseInt(summary.pending_orders || 0);
            extraCards += `<div class="sd-analytics-card${pendingCount > 0 ? ' sd-analytics-warning' : ''}">
                <div class="sd-analytics-icon sd-icon-actividad"><i class="fas fa-clock"></i></div>
                <div class="sd-analytics-body">
                    <div class="sd-analytics-value">${esc(String(pendingCount))}</div>
                    <div class="sd-analytics-label">Pedidos pendientes</div>
                    <div class="sd-analytics-sub">${pendingCount > 0 ? 'Requieren atencion' : 'Todo al dia'}</div>
                </div>
            </div>`;
            sellerAnalytics += `<div class="sd-analytics">${extraCards}</div>`;
            // Revenue chart
            sellerAnalytics += `<div class="sd-section-header"><div class="sd-section-title"><i class="fas fa-chart-bar"></i> Ventas (30 dias)</div></div>`;
            sellerAnalytics += this._buildRevenueChart(a.revenue_last_30d || [], esc);
            // Top products (full tier only)
            if (storeData.analyticsLevel === 'full') {
                sellerAnalytics += `<div class="sd-section-header"><div class="sd-section-title"><i class="fas fa-trophy"></i> Productos Top</div></div>`;
                sellerAnalytics += this._buildTopProductsTable(a.top_products || [], esc);
            }
        }

        const chainCard = this._buildChainBalanceCard(esc);
        const referralDash = this._buildReferralDashboard(esc);

        const setupBanner = this._buildSetupBanner(provider, storeData);

        container.innerHTML = `<div class="store-dashboard" data-layout="classic" data-theme="${esc(theme)}">
            ${setupBanner}
            ${header}
            ${tierCard}
            ${chainCard}
            ${quickActions}
            ${analytics}
            ${sellerAnalytics}
            ${referralDash}
            ${preview}
            ${listings}
            ${reviews}
            ${themes}
            <div class="sd-contact">
                <div class="sd-section-header">
                    <div class="sd-section-title"><i class="fas fa-address-book"></i> Contacto</div>
                    <button class="sd-section-btn" data-action="edit-store">Editar</button>
                </div>
                <div class="store-contact-grid">${contactItems}</div>
            </div>
        </div>`;

        // Cover image upload handler
        const coverInput = document.getElementById('coverFileInput');
        if (coverInput) {
            coverInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { this.showNotification('La imagen excede 5MB', 'error'); return; }
                const formData = new FormData();
                formData.append('image', file);
                try {
                    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
                    const resp = await fetch('/api/marketplace/providers/cover-image', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: formData
                    });
                    const result = await resp.json();
                    if (result.success) {
                        this.showNotification('Portada actualizada', 'success');
                        this.loadMyStore();
                    } else {
                        this.showNotification(result.data?.error?.message || 'Error al subir portada', 'error');
                    }
                } catch (err) {
                    this.showNotification('Error de conexion', 'error');
                }
                coverInput.value = '';
            });
        }

        // Load chain balance and referral data asynchronously
        this._loadChainBalance();
        this._loadReferralDashboard();
    }


    // Phase B: Guided first-use banner
    _buildSetupBanner(provider, storeData) {
        // Check setup completion
        let checklist = null;
        try { checklist = JSON.parse(localStorage.getItem('store_setup_checklist')); } catch(e) {}
        if (!checklist) {
            // Infer checklist from data
            const hasListings = (storeData.services?.length || 0) + (storeData.products?.length || 0) > 0;
            const hasContact = !!(provider.whatsapp || provider.email || provider.phone);
            checklist = {
                add_listing: hasListings,
                complete_contact: hasContact,
                share_store: false,
                create_portfolio: false
            };
            try { localStorage.setItem('store_setup_checklist', JSON.stringify(checklist)); } catch(e) {}
        }

        // Auto-update based on current data
        const hasListings = (storeData.services?.length || 0) + (storeData.products?.length || 0) > 0;
        const hasContact = !!(provider.whatsapp || provider.email || provider.phone);
        if (hasListings) checklist.add_listing = true;
        if (hasContact) checklist.complete_contact = true;
        try { localStorage.setItem('store_setup_checklist', JSON.stringify(checklist)); } catch(e) {}

        const done = Object.values(checklist).filter(Boolean).length;
        const total = Object.keys(checklist).length;

        if (done >= total) {
            // All done — show completion + share prompt
            const handle = provider.handle;
            if (!handle) return '';
            return `<div class="sd-setup-banner sd-setup-complete">
                <div class="sd-setup-icon">\u2705</div>
                <div class="sd-setup-text">
                    <strong>Tu tienda esta completa</strong>
                    <span>Comparte tu link para atraer clientes:</span>
                </div>
                <button class="sd-setup-action" data-action="sd-share-store" data-url="https://latanda.online/tienda/${this.escapeHtml(handle)}">Compartir \u2192</button>
            </div>`;
        }

        // Find next incomplete step
        const steps = [
            { key: 'add_listing', label: 'Agrega tu primer producto o servicio', action: 'goto-publicaciones' },
            { key: 'complete_contact', label: 'Completa tu perfil de contacto', action: 'goto-config' },
            { key: 'share_store', label: 'Comparte tu tienda con un amigo', action: 'goto-config' },
            { key: 'create_portfolio', label: 'Crea tu portafolio/CV', action: 'open-portfolio-maker' }
        ];
        let nextStep = steps.find(s => !checklist[s.key]) || steps[0];
        const pct = Math.round((done / total) * 100);
        const bars = Array.from({length: total}, (_, i) => `<span class="sd-setup-bar-seg${i < done ? ' done' : ''}"></span>`).join('');

        return `<div class="sd-setup-banner">
            <div class="sd-setup-progress">
                <div class="sd-setup-progress-label">\u{1F680} Completa tu tienda \u2014 ${done} de ${total}</div>
                <div class="sd-setup-bar">${bars}</div>
            </div>
            <div class="sd-setup-next">
                <span>Siguiente: ${this.escapeHtml(nextStep.label)}</span>
                <button class="sd-setup-action" data-action="${nextStep.action}">Continuar \u2192</button>
            </div>
        </div>`;
    }

    _buildDashboardHeader(provider, esc) {
        const initial = (provider.business_name || provider.user_name || 'T').charAt(0).toUpperCase();
        const avatarHtml = (provider.logo_image || provider.profile_image)
            ? `<img src="${esc(provider.logo_image || provider.profile_image)}" alt="">`
            : esc(initial);
        const badges = this._buildBadgesHtml(provider);
        const loc = [provider.city, provider.neighborhood].filter(Boolean).join(', ');
        const since = provider.created_at ? (window.ltFormatDate ? ltFormatDate(provider.created_at, 'medium') : new Date(provider.created_at).toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })) : '';
        const hasCover = !!provider.cover_image;
        const coverClass = hasCover ? ' sd-header-with-cover' : '';
        const coverStyle = hasCover ? ` style="background-image:url('${esc(provider.cover_image)}')"` : '';
        return `<div class="sd-header-wrapper${coverClass}"${coverStyle}>
            <div class="sd-header">
                <div class="sd-header-avatar">${avatarHtml}</div>
                <div class="sd-header-info">
                    <div class="sd-header-name">${esc(provider.business_name || 'Mi Tienda')}</div>
                    <div class="sd-header-badges">${badges}</div>
                    <div class="sd-header-meta">
                        ${loc ? `<span><i class="fas fa-map-marker-alt"></i> ${esc(loc)}</span>` : ''}
                        ${since ? `<span><i class="far fa-calendar-alt"></i> ${esc(since)}</span>` : ''}
                    </div>
                </div>
                <div class="sd-header-actions">
                    <button class="sd-header-btn" data-action="store-tab" data-tab="config"><i class="fas fa-pen"></i> Editar</button>
                    ${provider.handle ? `<a class="sd-header-btn sd-header-btn-view" href="/tienda/${esc(provider.handle)}" target="_blank"><i class="fas fa-external-link-alt"></i> Ver Tienda</a>` : ''}
                </div>
            </div>
        </div>`;
    }

    _buildQuickActionsToolbar(provider, esc) {
        const shopType = provider.shop_type || 'services';
        const handle = provider.handle;
        let btns = '';
        if (shopType !== 'products') {
            btns += `<button class="sd-quick-btn sd-quick-btn-primary" data-action="add-service"><i class="fas fa-plus"></i> Servicio</button>`;
        }
        if (shopType !== 'services') {
            btns += `<button class="sd-quick-btn sd-quick-btn-primary" data-action="add-product"><i class="fas fa-plus"></i> Producto</button>`;
        }
        if (handle) {
            btns += `<button class="sd-quick-btn" data-action="sd-share-store" data-url="https://latanda.online/tienda/${esc(handle)}"><i class="fas fa-share-alt"></i> Compartir</button>`;
        }
        if (handle) {
            btns += `<a class="sd-quick-btn" href="/tienda/${esc(handle)}" target="_blank"><i class="fas fa-eye"></i> Ver Tienda</a>`;
        }
        btns += `<button class="sd-quick-btn" data-action="open-portfolio-maker"><i class="fas fa-file-alt"></i> Portafolio</button>`;
        return `<div class="sd-quick-actions">${btns}</div>`;
    }


    _buildResumenSubtabs(provider, storeData, esc) {
        const a = storeData.analytics || {};
        const hasAnalytics = storeData.analytics && storeData.analyticsLevel !== 'basic';
        const hasFull = storeData.analyticsLevel === 'full';
        const savedSub = (() => { try { return sessionStorage.getItem('resumen_subtab') || 'general'; } catch(e) { return 'general'; } })();
        const isSubActive = (t) => t === savedSub ? ' sd-subtab-active' : '';
        const isSubVisible = (t) => t === savedSub ? '' : ' style="display:none"';
        const fmt = (n) => window.ltFormatNumber ? ltFormatNumber(n) : Number(n).toLocaleString('es-HN', {maximumFractionDigits: 0});

        // ---- GENERAL panel ----
        const setupBanner = this._buildSetupBanner(provider, storeData);
        const generalPanel = setupBanner + this._buildAnalyticsSummary(provider, storeData, esc);

        // ---- VENTAS panel ----
        let ventasPanel = '';
        if (hasAnalytics) {
            const rev30 = a.revenue_last_30d || [];
            const totalRev = rev30.reduce((s, d) => s + (parseFloat(d.revenue) || 0), 0);
            const totalOrders = parseInt(a.summary?.total_orders || 0);
            const avgOrder = totalOrders > 0 ? totalRev / totalOrders : 0;
            const pendingOrders = parseInt(a.summary?.pending_orders || 0);
            ventasPanel += `<div class="sd-analytics sd-analytics-3col">
                <div class="sd-analytics-card">
                    <div class="sd-analytics-icon sd-icon-ventas"><i class="fas fa-coins"></i></div>
                    <div class="sd-analytics-body">
                        <div class="sd-analytics-value">L. ${fmt(totalRev)}</div>
                        <div class="sd-analytics-label">Ingresos 30d</div>
                        <div class="sd-analytics-sub">${totalRev > 0 ? 'Ultimos 30 dias' : 'Sin ingresos aun'}</div>
                    </div>
                </div>
                <div class="sd-analytics-card">
                    <div class="sd-analytics-icon sd-icon-actividad"><i class="fas fa-shopping-cart"></i></div>
                    <div class="sd-analytics-body">
                        <div class="sd-analytics-value">${esc(String(totalOrders))}</div>
                        <div class="sd-analytics-label">Pedidos</div>
                        <div class="sd-analytics-sub">${pendingOrders > 0 ? '<span style="color:var(--ds-amber,#F59E0B);">' + pendingOrders + ' pendiente' + (pendingOrders !== 1 ? 's' : '') + '</span>' : 'Todo al dia'}</div>
                    </div>
                </div>
                <div class="sd-analytics-card">
                    <div class="sd-analytics-icon sd-icon-rating"><i class="fas fa-receipt"></i></div>
                    <div class="sd-analytics-body">
                        <div class="sd-analytics-value">L. ${fmt(avgOrder)}</div>
                        <div class="sd-analytics-label">Ticket promedio</div>
                        <div class="sd-analytics-sub">${totalOrders > 0 ? 'Por pedido' : '--'}</div>
                    </div>
                </div>
            </div>`;
            ventasPanel += `<div class="sd-section-header" style="margin-top:8px;"><div class="sd-section-title"><i class="fas fa-chart-bar"></i> Ingresos diarios</div></div>`;
            ventasPanel += this._buildRevenueChart(rev30, esc);
        } else {
            ventasPanel += `<div class="sd-empty-state-card">
                <div class="sd-empty-icon"><i class="fas fa-chart-bar"></i></div>
                <div class="sd-empty-title">Analiticas de ventas</div>
                <div class="sd-empty-desc">Disponible con plan Emprendedor o superior. Incluye ingresos diarios, pedidos y ticket promedio.</div>
                <button class="sd-empty-cta" data-action="store-tab" data-tab="config"><i class="fas fa-arrow-up"></i> Ver planes</button>
            </div>`;
        }

        // ---- PRODUCTOS panel ----
        let productosPanel = '';
        if (hasFull) {
            const topProds = a.top_products || [];
            const totalProds = (storeData.products?.length || 0);
            const activeProds = storeData.products?.filter(p => p.status === 'active')?.length || totalProds;
            const withSales = topProds.filter(p => parseInt(p.total_orders) > 0).length;
            productosPanel += `<div class="sd-analytics" style="grid-template-columns:repeat(2,1fr);margin-bottom:18px;">
                <div class="sd-analytics-card">
                    <div class="sd-analytics-icon sd-icon-rendimiento"><i class="fas fa-box-open"></i></div>
                    <div class="sd-analytics-body">
                        <div class="sd-analytics-value">${esc(String(totalProds))}</div>
                        <div class="sd-analytics-label">Total productos</div>
                        <div class="sd-analytics-sub">${activeProds} activo${activeProds !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div class="sd-analytics-card">
                    <div class="sd-analytics-icon sd-icon-ventas"><i class="fas fa-fire"></i></div>
                    <div class="sd-analytics-body">
                        <div class="sd-analytics-value">${esc(String(withSales))}</div>
                        <div class="sd-analytics-label">Con ventas</div>
                        <div class="sd-analytics-sub">${totalProds > 0 ? Math.round((withSales/totalProds)*100) + '% conversion' : 'Sin productos'}</div>
                    </div>
                </div>
            </div>`;
            productosPanel += `<div class="sd-section-header"><div class="sd-section-title"><i class="fas fa-trophy"></i> Ranking de ventas</div></div>`;
            productosPanel += `<div class="sd-table-scroll">`;
            productosPanel += this._buildTopProductsTable(topProds, esc);
            productosPanel += `</div>`;
        } else {
            productosPanel += `<div class="sd-empty-state-card">
                <div class="sd-empty-icon"><i class="fas fa-trophy"></i></div>
                <div class="sd-empty-title">Ranking de productos</div>
                <div class="sd-empty-desc">Disponible con plan Profesional. Ve cuales productos generan mas ingresos y pedidos.</div>
                <button class="sd-empty-cta" data-action="store-tab" data-tab="config"><i class="fas fa-arrow-up"></i> Ver planes</button>
            </div>`;
        }

        // Subtitle badges for sub-tabs
        const ventasBadge = hasAnalytics && parseInt(a.summary?.pending_orders || 0) > 0 ? ` <span class="sd-subtab-badge">${a.summary.pending_orders}</span>` : '';

        return `<div class="sd-subtabs-container">
            <div class="sd-subtabs-nav">
                <button class="sd-subtab${isSubActive('general')}" data-action="resumen-subtab" data-subtab="general">
                    <i class="fas fa-chart-pie"></i> <span>General</span>
                </button>
                <button class="sd-subtab${isSubActive('ventas')}" data-action="resumen-subtab" data-subtab="ventas">
                    <i class="fas fa-chart-bar"></i> <span>Ventas</span>${ventasBadge}
                </button>
                <button class="sd-subtab${isSubActive('productos')}" data-action="resumen-subtab" data-subtab="productos">
                    <i class="fas fa-trophy"></i> <span>Productos</span>
                </button>
            </div>
            <div class="sd-subtab-panel" data-panel="general"${isSubVisible('general')}>
                ${generalPanel}
            </div>
            <div class="sd-subtab-panel" data-panel="ventas"${isSubVisible('ventas')}>
                ${ventasPanel}
            </div>
            <div class="sd-subtab-panel" data-panel="productos"${isSubVisible('productos')}>
                ${productosPanel}
            </div>
        </div>`;
    }

    _buildAnalyticsSummary(provider, storeData, esc) {
        const rating = Number(provider.avg_rating || 0).toFixed(1);
        const jobs = parseInt(provider.completed_jobs || 0);
        const reviews = parseInt(provider.total_reviews || 0);
        const responseRate = parseInt(provider.response_rate || 100);
        const responseTime = provider.response_time_hours ? `${Number(provider.response_time_hours).toFixed(0)}h` : '<1h';
        const totalItems = (storeData.services?.length || 0) + (storeData.products?.length || 0);

        return `<div class="sd-analytics">
            <div class="sd-analytics-card sd-clickable" data-action="resumen-subtab" data-subtab="ventas" title="Ver ventas">
                <div class="sd-analytics-icon sd-icon-ventas"><i class="fas fa-briefcase"></i></div>
                <div class="sd-analytics-body">
                    <div class="sd-analytics-value">${esc(String(jobs))}</div>
                    <div class="sd-analytics-label">Trabajos completados</div>
                    <div class="sd-analytics-sub">${esc(String(totalItems))} publicacion${totalItems !== 1 ? 'es' : ''} activa${totalItems !== 1 ? 's' : ''}</div>
                </div>
            </div>
            <div class="sd-analytics-card">
                <div class="sd-analytics-icon sd-icon-rating"><i class="fas fa-star"></i></div>
                <div class="sd-analytics-body">
                    <div class="sd-analytics-value">${rating === '0.0' ? '--' : esc(rating)}</div>
                    <div class="sd-analytics-label">Rating promedio</div>
                    <div class="sd-analytics-sub">${reviews > 0 ? esc(String(reviews)) + ' resena' + (reviews !== 1 ? 's' : '') : '<span style="opacity:0.7;">Completa pedidos para recibir resenas</span>'}</div>
                </div>
            </div>
            <div class="sd-analytics-card sd-clickable" data-action="store-tab" data-tab="publicaciones" title="Ver publicaciones">
                <div class="sd-analytics-icon sd-icon-actividad"><i class="fas fa-chart-line"></i></div>
                <div class="sd-analytics-body">
                    <div class="sd-analytics-value">${esc(String(totalItems))}</div>
                    <div class="sd-analytics-label">Publicaciones</div>
                    <div class="sd-analytics-sub">${storeData.showServices ? esc(String(storeData.services?.length || 0)) + ' servicio' + ((storeData.services?.length || 0) !== 1 ? 's' : '') : ''}${storeData.showServices && storeData.showProducts ? ' · ' : ''}${storeData.showProducts ? esc(String(storeData.products?.length || 0)) + ' producto' + ((storeData.products?.length || 0) !== 1 ? 's' : '') : ''}</div>
                </div>
            </div>
            <div class="sd-analytics-card sd-clickable" data-action="store-tab" data-tab="pedidos" title="Ver pedidos">
                <div class="sd-analytics-icon sd-icon-rendimiento"><i class="fas fa-bolt"></i></div>
                <div class="sd-analytics-body">
                    <div class="sd-analytics-value">${esc(String(responseRate))}%</div>
                    <div class="sd-analytics-label">Tasa de respuesta</div>
                    <div class="sd-analytics-sub">Tiempo: ${esc(responseTime)}</div>
                </div>
            </div>
        </div>`;
    }

    _buildStorePreviewCard(provider, esc) {
        const handle = provider.handle;
        if (!handle) return '';
        const initial = (provider.business_name || 'T').charAt(0).toUpperCase();
        const avatarHtml = provider.profile_image
            ? `<img src="${esc(provider.profile_image)}" alt="">`
            : esc(initial);
        const rating = Number(provider.avg_rating || 0).toFixed(1);
        const jobs = parseInt(provider.completed_jobs || 0);
        const reviews = parseInt(provider.total_reviews || 0);
        return `<div class="sd-preview-section">
            <div class="sd-preview-label"><i class="fas fa-eye"></i> Asi ven los clientes tu tienda</div>
            <div class="sd-preview-card">
                <div class="sd-preview-header">
                    <div class="sd-preview-avatar">${avatarHtml}</div>
                    <div class="sd-preview-name">${esc(provider.business_name || 'Mi Tienda')}</div>
                </div>
                <div class="sd-preview-stats">
                    <div class="sd-preview-stat"><div class="sd-preview-stat-value">${rating === '0.0' ? '--' : esc(rating)}</div><div class="sd-preview-stat-label">Rating</div></div>
                    <div class="sd-preview-stat"><div class="sd-preview-stat-value">${esc(String(jobs))}</div><div class="sd-preview-stat-label">Trabajos</div></div>
                    <div class="sd-preview-stat"><div class="sd-preview-stat-value">${esc(String(reviews))}</div><div class="sd-preview-stat-label">Resenas</div></div>
                </div>
                <div class="sd-preview-footer">
                    <a class="sd-preview-link" href="/tienda/${esc(handle)}" target="_blank"><i class="fas fa-external-link-alt"></i> Ver tienda</a>
                </div>
            </div>
        </div>`;
    }


    _buildPublicacionesSubtabs(storeData, provider, esc) {
        const { services, products, orders, showServices, showProducts } = storeData;
        const shopType = provider.shop_type || 'services';
        const sCount = services?.length || 0;
        const pCount = products?.length || 0;
        const oCount = orders?.length || 0;
        const pendingOrders = (orders || []).filter(o => o.status === 'pending' || o.status === 'paid').length;

        // Determine default sub-tab
        const savedPubSub = (() => { try { return sessionStorage.getItem('pub_subtab') || (showServices ? 'servicios' : 'productos'); } catch(e) { return 'servicios'; } })();
        const isActive = (t) => t === savedPubSub ? ' sd-subtab-active' : '';
        const isVisible = (t) => t === savedPubSub ? '' : ' style="display:none"';

        // ---- SERVICIOS panel ----
        let serviciosPanel = '';
        if (showServices) {
            serviciosPanel += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
                <div style="font-size:13px;color:var(--ds-text-secondary,rgba(255,255,255,0.5));">${sCount} servicio${sCount !== 1 ? 's' : ''} publicado${sCount !== 1 ? 's' : ''}</div>
                <button class="sd-quick-btn sd-quick-btn-primary" data-action="add-service" style="padding:8px 16px;font-size:13px;"><i class="fas fa-plus"></i> Nuevo Servicio</button>
            </div>`;
            if (sCount > 0) {
                serviciosPanel += services.map(s => this._buildEnhancedItemCard(s, 'services', esc)).join('');
            } else {
                serviciosPanel += this._buildEmptyListingState('services', esc);
            }
        } else if (sCount > 0) {
            // Shop type doesn't match but items exist — show with delete option
            serviciosPanel += '<div style="font-size:13px;color:var(--ds-text-secondary,rgba(255,255,255,0.5));margin-bottom:14px;">' + sCount + ' servicio' + (sCount !== 1 ? 's' : '') + ' (tipo de tienda: ' + esc(shopType) + ')</div>';
            serviciosPanel += services.map(s => this._buildEnhancedItemCard(s, 'services', esc)).join('');
        } else {
            serviciosPanel += '<div class="sd-empty-state-card"><div class="sd-empty-icon"><i class="fas fa-wrench"></i></div><div class="sd-empty-title">Tienda de productos</div><div class="sd-empty-desc">Tu tienda esta configurada como tipo Productos. Para ofrecer servicios, cambia el tipo en Config.</div><button class="sd-empty-cta" data-action="store-tab" data-tab="config"><i class="fas fa-cog"></i> Ir a Config</button></div>';
        }

        // ---- PRODUCTOS panel ----
        let productosPanel = '';
        if (showProducts) {
            productosPanel += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
                <div style="font-size:13px;color:var(--ds-text-secondary,rgba(255,255,255,0.5));">${pCount} producto${pCount !== 1 ? 's' : ''} publicado${pCount !== 1 ? 's' : ''}</div>
                <button class="sd-quick-btn sd-quick-btn-primary" data-action="add-product" style="padding:8px 16px;font-size:13px;"><i class="fas fa-plus"></i> Nuevo Producto</button>
            </div>`;
            if (pCount > 0) {
                productosPanel += products.map(p => this._buildEnhancedItemCard(p, 'products', esc)).join('');
            } else {
                productosPanel += this._buildEmptyListingState('products', esc);
            }
        } else if (pCount > 0) {
            // Shop type doesn't match but items exist — show with delete option
            productosPanel += '<div style="font-size:13px;color:var(--ds-text-secondary,rgba(255,255,255,0.5));margin-bottom:14px;">' + pCount + ' producto' + (pCount !== 1 ? 's' : '') + ' (tipo de tienda: ' + esc(shopType) + ')</div>';
            productosPanel += products.map(p => this._buildEnhancedItemCard(p, 'products', esc)).join('');
        } else {
            productosPanel += '<div class="sd-empty-state-card"><div class="sd-empty-icon"><i class="fas fa-box"></i></div><div class="sd-empty-title">Tienda de servicios</div><div class="sd-empty-desc">Tu tienda esta configurada como tipo Servicios. Para vender productos, cambia el tipo en Config.</div><button class="sd-empty-cta" data-action="store-tab" data-tab="config"><i class="fas fa-cog"></i> Ir a Config</button></div>';
        }

        // ---- PEDIDOS panel ----
        let pedidosPanel = this._buildOrdersTab(orders || [], esc);

        // Badges
        const sBadge = sCount > 0 ? ` <span class="sd-subtab-badge" style="background:var(--ds-blue,#3B82F6);color:#fff;">${sCount}</span>` : '';
        const pBadge = pCount > 0 ? ` <span class="sd-subtab-badge" style="background:var(--ds-green,#10B981);color:#fff;">${pCount}</span>` : '';
        const oBadge = pendingOrders > 0 ? ` <span class="sd-subtab-badge">${pendingOrders}</span>` : (oCount > 0 ? ` <span class="sd-subtab-badge" style="background:rgba(255,255,255,0.15);color:var(--ds-text-secondary,rgba(255,255,255,0.5));">${oCount}</span>` : '');

        // Build nav — hide tabs for shop types that don't apply
        let tabs = '';
        if (showServices || sCount > 0) {
            tabs += `<button class="sd-subtab${isActive('servicios')}" data-action="pub-subtab" data-subtab="servicios">
                <i class="fas fa-wrench"></i> <span>Servicios</span>${sBadge}
            </button>`;
        }
        if (showProducts || pCount > 0) {
            tabs += `<button class="sd-subtab${isActive('productos')}" data-action="pub-subtab" data-subtab="productos">
                <i class="fas fa-box"></i> <span>Productos</span>${pBadge}
            </button>`;
        }
        tabs += `<button class="sd-subtab${isActive('pedidos')}" data-action="pub-subtab" data-subtab="pedidos">
            <i class="fas fa-shopping-bag"></i> <span>Pedidos</span>${oBadge}
        </button>`;

        // For single-type stores, auto-select the available type
        const adjustedSaved = savedPubSub === 'servicios' && !showServices ? 'productos' : (savedPubSub === 'productos' && !showProducts ? 'servicios' : savedPubSub);

        return `<div class="sd-subtabs-container">
            <div class="sd-subtabs-nav">${tabs}</div>
            ${(showServices || sCount > 0) ? `<div class="sd-subtab-panel" data-panel="servicios"${isVisible('servicios')}>${serviciosPanel}</div>` : ''}
            ${(showProducts || pCount > 0) ? `<div class="sd-subtab-panel" data-panel="productos"${isVisible('productos')}>${productosPanel}</div>` : ''}
            <div class="sd-subtab-panel" data-panel="pedidos"${isVisible('pedidos')}>
                ${pedidosPanel}
            </div>
        </div>`;
    }

    _buildTabbedListings(storeData, provider, esc) {
        const { services, products, orders, showServices, showProducts } = storeData;
        if (!showServices && !showProducts) return '';

        const sCount = services?.length || 0;
        const pCount = products?.length || 0;
        const oCount = orders?.length || 0;
        const pendingOrders = (orders || []).filter(o => o.status === 'pending' || o.status === 'paid').length;
        const shopType = provider.shop_type || 'services';

        let tabs = '';
        let contents = '';
        const firstTab = showServices ? 'services' : 'products';

        if (showServices) {
            tabs += `<button class="sd-listings-tab${firstTab === 'services' ? ' active' : ''}" data-action="sd-switch-tab" data-tab="services">
                <i class="fas fa-wrench"></i> Servicios <span class="sd-listings-count">${esc(String(sCount))}</span>
            </button>`;
            const sCards = sCount > 0 ? services.map(s => this._buildEnhancedItemCard(s, 'services', esc)).join('') : this._buildEmptyListingState('services', esc);
            contents += `<div class="sd-listings-content${firstTab === 'services' ? ' active' : ''}" data-tab="services">${sCards}</div>`;
        }
        if (showProducts) {
            tabs += `<button class="sd-listings-tab${firstTab === 'products' ? ' active' : ''}" data-action="sd-switch-tab" data-tab="products">
                <i class="fas fa-box"></i> Productos <span class="sd-listings-count">${esc(String(pCount))}</span>
            </button>`;
            const pCards = pCount > 0 ? products.map(p => this._buildEnhancedItemCard(p, 'products', esc)).join('') : this._buildEmptyListingState('products', esc);
            contents += `<div class="sd-listings-content${firstTab === 'products' ? ' active' : ''}" data-tab="products">${pCards}</div>`;
        }

        // Orders tab
        const pendingBadge = pendingOrders > 0 ? `<span class="sd-listings-count sd-order-badge-pending">${esc(String(pendingOrders))}</span>` : '';
        tabs += `<button class="sd-listings-tab" data-action="sd-switch-tab" data-tab="orders">
            <i class="fas fa-shopping-bag"></i> Pedidos ${pendingBadge}
        </button>`;
        contents += `<div class="sd-listings-content" data-tab="orders">${this._buildOrdersTab(orders || [], esc)}</div>`;

        return `<div class="sd-listings">
            <div class="sd-listings-tabs">${tabs}</div>
            ${contents}
        </div>`;
    }

    _buildEnhancedItemCard(item, type, esc) {
        const itemId = type === 'services' ? item.service_id : item.id;
        const rawImg = item.images && item.images[0] ? (typeof item.images[0] === 'object' ? item.images[0].url : item.images[0]) : null;
        const imgSrc = rawImg && (rawImg.startsWith('/') || rawImg.startsWith('http')) ? rawImg : null;
        const validImgs = (item.images || []).map(i => typeof i === 'object' ? i.url : i).filter(u => u && (u.startsWith('/') || u.startsWith('http')));

        let imgHtml = '';
        if (validImgs.length > 1) {
            const cId = 'carousel_' + (type === 'services' ? 's' : 'p') + '_' + itemId;
            const slides = validImgs.map(u => '<div class="sd-carousel-slide"><img src="' + esc(this._imgUrl(u)) + '" alt="" loading="lazy"></div>').join('');
            const dots = validImgs.map((_, i) => '<button class="sd-carousel-dot' + (i === 0 ? ' active' : '') + '" data-slide="' + i + '"></button>').join('');
            imgHtml = '<div class="sd-carousel" id="' + cId + '" data-current="0" data-total="' + validImgs.length + '">' +
                '<div class="sd-carousel-track">' + slides + '</div>' +
                '<button class="sd-carousel-btn sd-carousel-prev" data-action="carousel-prev" data-carousel="' + cId + '"><i class="fas fa-chevron-left"></i></button>' +
                '<button class="sd-carousel-btn sd-carousel-next" data-action="carousel-next" data-carousel="' + cId + '"><i class="fas fa-chevron-right"></i></button>' +
                '<div class="sd-carousel-dots">' + dots + '</div>' +
                '<div class="sd-carousel-counter">1/' + validImgs.length + '</div>' +
            '</div>';
        } else if (imgSrc) {
            imgHtml = '<img src="' + esc(this._imgUrl(imgSrc)) + '" alt="" loading="lazy">';
        } else {
            imgHtml = '<div class="sd-item-img-placeholder"><i class="fas ' + (type === 'services' ? 'fa-wrench' : 'fa-box') + '"></i></div>';
        }
        const featuredClass = item.featured ? ' featured-active' : '';

        let priceHtml = '';
        let statusHtml = '';
        let metaHtml = '';
        let stockHtml = '';

        if (type === 'services') {
            priceHtml = item.price_type === 'fixed' ? `L. ${esc(String(item.price))}` : esc(item.price_type || 'Consultar');
            metaHtml = `${esc(String(item.booking_count || 0))} reservas`;
            statusHtml = `<span class="sd-item-status active">Activo</span>`;
        } else {
            priceHtml = `L. ${esc(String(item.price))}`;
            const qty = parseInt(item.quantity || 0);
            stockHtml = `<input type="number" class="sd-inline-stock" data-product-id="${esc(String(itemId))}" value="${qty}" min="0" max="10000" title="Stock">`;
            if (qty === 0) {
                statusHtml = `<span class="sd-item-status soldout">Agotado</span>`;
            } else if (qty <= 3) {
                statusHtml = `<span class="sd-item-status sd-stock-low">Poco stock</span>`;
            } else {
                statusHtml = `<span class="sd-item-status active">${esc(String(qty))} disp.</span>`;
            }
            metaHtml = `${esc(String(qty))} en stock`;
        }

        const hasCarousel = validImgs.length > 1;
        return `<div class="sd-item-card${hasCarousel ? ' sd-item-card-visual' : ''}">
            ${hasCarousel ? '<div class="sd-item-carousel-wrap">' + imgHtml + '</div>' : '<div class="sd-item-image">' + imgHtml + '</div>'}
            <div class="sd-item-body">
                <div class="sd-item-title">${esc(item.title)}</div>
                <div class="sd-item-price">${priceHtml}</div>
                <div class="sd-item-meta">${metaHtml}</div>
                ${stockHtml}
            </div>
            ${statusHtml}
            <div class="sd-item-actions">
                <button class="sd-item-action" data-action="edit-item" data-type="${esc(type)}" data-id="${esc(String(itemId))}" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="sd-item-action sd-item-action-danger" data-action="delete-item" data-type="${esc(type)}" data-id="${esc(String(itemId))}" title="Eliminar"><i class="fas fa-trash"></i></button>
                <button class="sd-item-action${featuredClass}" data-action="toggle-featured" data-type="${esc(type)}" data-id="${esc(String(itemId))}" data-featured="${item.featured ? 'true' : 'false'}" title="Destacar"><i class="fas fa-star"></i></button>
                <button class="sd-item-action boost-btn" data-action="boost-item" data-type="${type === 'services' ? 'service' : 'product'}" data-id="${esc(String(itemId))}" title="Impulsar"><i class="fas fa-rocket"></i></button>
                <button class="sd-item-action" data-action="move-item-up" data-type="${esc(type)}" data-id="${esc(String(itemId))}" data-order="${esc(String(item.display_order || 0))}" title="Subir"><i class="fas fa-arrow-up"></i></button>
            </div>
        </div>`;
    }

    _buildEmptyListingState(type, esc) {
        const isService = type === 'services';
        return `<div class="sd-empty">
            <div class="sd-empty-icon">${isService ? '\u{1f527}' : '\u{1f4e6}'}</div>
            <div class="sd-empty-title">Sin ${isService ? 'servicios' : 'productos'} aun</div>
            <div class="sd-empty-desc">${isService ? 'Publica un servicio y empieza a recibir reservas. Tus clientes ya estan aqui.' : 'Publica tu primer producto y empieza a ganar LTD. Control de stock automatico.'}</div>
            <button class="sd-empty-cta" data-action="${isService ? 'add-service' : 'add-product'}"><i class="fas fa-plus"></i> Agregar ${isService ? 'servicio' : 'producto'}</button>
        </div>`;
    }


    _buildPedidosSubtabs(storeData, provider, esc) {
        const { orders, bookings, reviews, showServices, showProducts } = storeData;
        const oCount = orders?.length || 0;
        const bCount = bookings?.length || 0;
        const rCount = reviews?.length || 0;
        const pendingOrders = (orders || []).filter(o => o.status === 'pending' || o.status === 'paid').length;
        const pendingBookings = (bookings || []).filter(b => b.status === 'pending' || b.status === 'confirmed').length;
        const pendingTotal = pendingOrders + pendingBookings;

        const savedSub = (() => { try { return sessionStorage.getItem('ped_subtab') || (showServices ? 'reservas' : 'ordenes'); } catch(e) { return 'reservas'; } })();
        const isActive = (t) => t === savedSub ? ' sd-subtab-active' : '';
        const isVisible = (t) => t === savedSub ? '' : ' style="display:none"';

        // ---- RESERVAS panel ----
        let reservasPanel = '';
        if (showServices) {
            reservasPanel = this._buildBookingsPanel(bookings || [], esc);
        } else {
            reservasPanel = '<div class="sd-empty-state-card"><div class="sd-empty-icon"><i class="fas fa-calendar-check"></i></div><div class="sd-empty-title">Sin servicios activos</div><div class="sd-empty-desc">Las reservas aparecen cuando ofreces servicios. Configura tu tienda como tipo Servicios o Mixta.</div></div>';
        }

        // ---- ORDENES panel ----
        let ordenesPanel = '';
        if (showProducts) {
            ordenesPanel = this._buildOrdersTab(orders || [], esc);
        } else {
            ordenesPanel = '<div class="sd-empty-state-card"><div class="sd-empty-icon"><i class="fas fa-shopping-bag"></i></div><div class="sd-empty-title">Sin productos activos</div><div class="sd-empty-desc">Los pedidos aparecen cuando vendes productos. Configura tu tienda como tipo Productos o Mixta.</div></div>';
        }

        // ---- RESENAS panel ----
        let resenasPanel = this._buildReviewsSummary(reviews || [], provider, esc);

        // Badges
        const bBadge = pendingBookings > 0 ? ` <span class="sd-subtab-badge">${pendingBookings}</span>` : (bCount > 0 ? ` <span class="sd-subtab-badge" style="background:rgba(255,255,255,0.15);color:var(--ds-text-secondary,rgba(255,255,255,0.5));">${bCount}</span>` : '');
        const oBadge = pendingOrders > 0 ? ` <span class="sd-subtab-badge">${pendingOrders}</span>` : (oCount > 0 ? ` <span class="sd-subtab-badge" style="background:rgba(255,255,255,0.15);color:var(--ds-text-secondary,rgba(255,255,255,0.5));">${oCount}</span>` : '');
        const rBadge = rCount > 0 ? ` <span class="sd-subtab-badge" style="background:rgba(245,158,11,0.2);color:var(--ds-amber,#F59E0B);">${rCount}</span>` : '';

        let tabs = '';
        if (showServices) {
            tabs += `<button class="sd-subtab${isActive('reservas')}" data-action="ped-subtab" data-subtab="reservas"><i class="fas fa-calendar-check"></i> <span>Reservas</span>${bBadge}</button>`;
        }
        if (showProducts) {
            tabs += `<button class="sd-subtab${isActive('ordenes')}" data-action="ped-subtab" data-subtab="ordenes"><i class="fas fa-shopping-bag"></i> <span>Ordenes</span>${oBadge}</button>`;
        }
        tabs += `<button class="sd-subtab${isActive('resenas')}" data-action="ped-subtab" data-subtab="resenas"><i class="fas fa-star"></i> <span>Resenas</span>${rBadge}</button>`;

        return `<div class="sd-subtabs-container">
            <div class="sd-subtabs-nav">${tabs}</div>
            ${showServices ? `<div class="sd-subtab-panel" data-panel="reservas"${isVisible('reservas')}>${reservasPanel}</div>` : ''}
            ${showProducts ? `<div class="sd-subtab-panel" data-panel="ordenes"${isVisible('ordenes')}>${ordenesPanel}</div>` : ''}
            <div class="sd-subtab-panel" data-panel="resenas"${isVisible('resenas')}>${resenasPanel}</div>
        </div>`;
    }

    _buildBookingsPanel(bookings, esc) {
        const statusLabels = { pending: 'Pendiente', confirmed: 'Confirmada', in_progress: 'En Progreso', completed: 'Completada', cancelled: 'Cancelada', no_show: 'No Asistio' };
        const statusColors = { pending: 'var(--ds-amber,#f59e0b)', confirmed: 'var(--ds-cyan,#06b6d4)', in_progress: 'var(--ds-blue,#3b82f6)', completed: 'var(--ds-green,#10b981)', cancelled: 'var(--ds-red,#ef4444)', no_show: 'var(--ds-text-muted,#94a3b8)' };

        if (!bookings || bookings.length === 0) {
            return '<div class="sd-empty-state-card"><div class="sd-empty-icon"><i class="fas fa-calendar-check"></i></div><div class="sd-empty-title">Sin reservas aun</div><div class="sd-empty-desc">Cuando alguien reserve tu servicio, aparecera aqui. Comparte tu tienda para recibir reservas.</div></div>';
        }

        const pending = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
        const completed = bookings.filter(b => b.status === 'completed');
        const cancelled = bookings.filter(b => b.status === 'cancelled' || b.status === 'no_show');

        let html = `<div class="sd-analytics" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
            <div class="sd-analytics-card"><div class="sd-analytics-icon" style="background:rgba(245,158,11,0.15);color:var(--ds-amber,#F59E0B);"><i class="fas fa-clock"></i></div><div class="sd-analytics-body"><div class="sd-analytics-value">${pending.length}</div><div class="sd-analytics-label">Activas</div></div></div>
            <div class="sd-analytics-card"><div class="sd-analytics-icon" style="background:rgba(16,185,129,0.15);color:var(--ds-green,#10B981);"><i class="fas fa-check"></i></div><div class="sd-analytics-body"><div class="sd-analytics-value">${completed.length}</div><div class="sd-analytics-label">Completadas</div></div></div>
            <div class="sd-analytics-card"><div class="sd-analytics-icon" style="background:rgba(239,68,68,0.15);color:var(--ds-red,#EF4444);"><i class="fas fa-times"></i></div><div class="sd-analytics-body"><div class="sd-analytics-value">${cancelled.length}</div><div class="sd-analytics-label">Canceladas</div></div></div>
        </div>`;

        const cards = bookings.slice(0, 20).map(b => {
            const dateStr = b.scheduled_date ? new Date(b.scheduled_date + 'T12:00:00').toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            const timeStr = b.scheduled_time ? b.scheduled_time.substring(0, 5) : '';
            const color = statusColors[b.status] || statusColors.pending;
            const label = statusLabels[b.status] || esc(b.status);
            const price = parseFloat(b.quoted_price || 0);
            let actionsHtml = '';
            if (b.status === 'pending') {
                actionsHtml = `<div class="sd-order-actions"><button class="sd-order-btn" style="background:var(--ds-green,#10B981);color:#fff;" data-action="update-booking-status" data-booking-id="${esc(String(b.booking_id))}" data-new-status="confirmed">Confirmar</button><button class="sd-order-btn" style="background:var(--ds-red,#EF4444);color:#fff;margin-left:6px;" data-action="update-booking-status" data-booking-id="${esc(String(b.booking_id))}" data-new-status="cancelled">Rechazar</button></div>`;
            } else if (b.status === 'confirmed') {
                actionsHtml = `<div class="sd-order-actions"><button class="sd-order-btn" style="background:var(--ds-blue,#3B82F6);color:#fff;" data-action="update-booking-status" data-booking-id="${esc(String(b.booking_id))}" data-new-status="completed">Completar</button></div>`;
            }
            return `<div class="sd-order-card" style="border-left-color:${color};">
                <div class="sd-order-info" style="flex:1;">
                    <div class="sd-order-product">${esc(b.service_title || 'Servicio')}</div>
                    <div class="sd-order-buyer"><i class="fas fa-user"></i> ${esc(b.customer_name || b.user_name || 'Cliente')}</div>
                    <div class="sd-order-date"><i class="far fa-calendar"></i> ${esc(dateStr)}${timeStr ? ' · ' + esc(timeStr) : ''}</div>
                </div>
                <div class="sd-order-right">
                    <div class="sd-order-total">L. ${window.ltFormatNumber ? ltFormatNumber(price) : price.toLocaleString('es-HN')}</div>
                    <span class="sd-order-status" style="background:${color}20;color:${color};">${label}</span>
                </div>
                ${actionsHtml}
            </div>`;
        }).join('');

        return html + `<div class="sd-orders-list">${cards}</div>`;
    }

    _buildReviewsSummary(reviews, provider, esc) {
        const rating = Number(provider.avg_rating || 0);
        const totalReviews = parseInt(provider.total_reviews || reviews.length || 0);

        // Rating summary card
        let html = `<div style="display:flex;align-items:center;gap:20px;padding:20px;background:var(--ds-bg-elevated,rgba(255,255,255,0.04));border-radius:14px;margin-bottom:20px;flex-wrap:wrap;">
            <div style="text-align:center;min-width:80px;">
                <div style="font-size:36px;font-weight:700;color:var(--ds-text-primary,#fff);line-height:1;">${rating > 0 ? rating.toFixed(1) : '--'}</div>
                <div style="color:var(--ds-amber,#F59E0B);font-size:16px;margin:4px 0;">${'\u2605'.repeat(Math.round(rating))}${'\u2606'.repeat(5 - Math.round(rating))}</div>
                <div style="font-size:12px;color:var(--ds-text-secondary,rgba(255,255,255,0.5));">${totalReviews} resena${totalReviews !== 1 ? 's' : ''}</div>
            </div>
            <div style="flex:1;min-width:150px;">
                ${[5,4,3,2,1].map(star => {
                    const count = reviews.filter(r => Math.round(Number(r.rating || 0)) === star).length;
                    const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="font-size:12px;color:var(--ds-text-secondary,rgba(255,255,255,0.5));min-width:14px;">' + star + '</span><div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:var(--ds-amber,#F59E0B);border-radius:3px;transition:width 0.3s;"></div></div><span style="font-size:11px;color:var(--ds-text-muted,rgba(255,255,255,0.35));min-width:24px;text-align:right;">' + count + '</span></div>';
                }).join('')}
            </div>
        </div>`;

        // Reviews list
        if (!reviews || reviews.length === 0) {
            html += '<div class="sd-empty-state-card"><div class="sd-empty-icon"><i class="fas fa-star"></i></div><div class="sd-empty-title">Sin resenas aun</div><div class="sd-empty-desc">Completa pedidos y reservas para que tus clientes dejen resenas. Las buenas resenas atraen mas clientes.</div></div>';
        } else {
            html += this._buildRecentReviews(reviews, esc);
        }

        return html;
    }

    _buildRecentReviews(reviews, esc) {
        if (!reviews || reviews.length === 0) return '';
        const cards = reviews.slice(0, 3).map(r => {
            const stars = '\u2605'.repeat(Math.round(Number(r.rating || 0)));
            const initial = ((r.reviewer_name || r.user_name || 'U').charAt(0)).toUpperCase();
            const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' }) : '';
            const text = (r.comment || r.review_text || '').length > 120 ? (r.comment || r.review_text || '').substring(0, 120) + '...' : (r.comment || r.review_text || '');
            return `<div class="sd-review-card">
                <div class="sd-review-avatar">${esc(initial)}</div>
                <div class="sd-review-body">
                    <div class="sd-review-top">
                        <span class="sd-review-author">${esc(r.reviewer_name || r.user_name || 'Usuario')}</span>
                        <span class="sd-review-stars">${stars}</span>
                        <span class="sd-review-date">${esc(dateStr)}</span>
                    </div>
                    ${text ? `<div class="sd-review-text">${esc(text)}</div>` : ''}
                </div>
            </div>`;
        }).join('');
        return `<div class="sd-reviews">
            <div class="sd-reviews-header"><i class="fas fa-comment-dots"></i> Resenas recientes</div>
            ${cards}
        </div>`;
    }


    _buildConfigSubtabs(provider, storeData, esc) {
        const savedSub = (() => { try { return sessionStorage.getItem('cfg_subtab') || 'negocio'; } catch(e) { return 'negocio'; } })();
        const isActive = (t) => t === savedSub ? ' sd-subtab-active' : '';
        const isVisible = (t) => t === savedSub ? '' : ' style="display:none"';

        // ---- NEGOCIO panel ----
        let negocioPanel = `<div class="sd-config-section">
            <div class="sd-section-header"><div class="sd-section-title"><i class="fas fa-image"></i> Portada</div></div>
            <div class="sd-cover-config">
                ${provider.cover_image
                    ? '<span style="color:#94a3b8;font-size:0.82rem;">Tu portada se muestra arriba.</span> <button class="sd-form-btn sd-form-btn-primary" data-action="upload-cover" style="display:inline-flex;padding:6px 14px;font-size:0.78rem;"><i class="fas fa-camera"></i> Cambiar</button> <button class="sd-danger-btn" data-action="remove-cover" style="padding:6px 14px;font-size:0.78rem;"><i class="fas fa-trash"></i> Eliminar</button>'
                    : '<button class="sd-form-btn sd-form-btn-primary" data-action="upload-cover"><i class="fas fa-image"></i> Subir Portada</button><span style="color:#64748b;font-size:0.78rem;margin-left:8px;">Recomendado: 1200x400px</span>'
                }
            </div>
        </div>
        <div class="sd-config-section">
            <div class="sd-section-header"><div class="sd-section-title"><i class="fas fa-store-alt"></i> Logo de Tienda</div></div>
            <div class="sd-logo-config">
                <div class="sd-logo-preview">
                    ${provider.logo_image
                        ? '<img src="' + esc(provider.logo_image) + '" alt="Logo" class="sd-logo-img">'
                        : '<div class="sd-logo-placeholder"><i class="fas fa-store"></i></div>'
                    }
                </div>
                <div class="sd-logo-actions">
                    <button class="sd-form-btn sd-form-btn-primary" data-action="upload-logo" style="padding:8px 16px;font-size:0.82rem;"><i class="fas fa-camera"></i> ${provider.logo_image ? 'Cambiar Logo' : 'Subir Logo'}</button>
                    ${provider.logo_image ? '<button class="sd-danger-btn" data-action="remove-logo" style="padding:8px 16px;font-size:0.82rem;"><i class="fas fa-trash"></i> Eliminar</button>' : ''}
                    <div style="font-size:0.75rem;color:var(--ds-text-muted,rgba(255,255,255,0.35));margin-top:6px;">Recomendado: 256x256px. Se muestra en cards y perfil de tu tienda.</div>
                </div>
            </div>
        </div>
        <div class="sd-config-section">
            <div class="sd-section-header"><div class="sd-section-title"><i class="fas fa-store"></i> Informacion del Negocio</div></div>
            <div class="sd-inline-form" id="sdEditForm">
                <div class="sd-form-row">
                    <label>Nombre</label>
                    <input type="text" id="sdEditName" class="sd-form-input" value="${esc(provider.business_name || '')}" maxlength="255">
                </div>
                <div class="sd-form-row">
                    <label>Descripcion</label>
                    <textarea id="sdEditDesc" class="sd-form-input" rows="3" maxlength="2000">${esc(provider.description || '')}</textarea>
                </div>
                <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);margin:12px 0 8px;display:flex;align-items:center;gap:6px;"><i class="fas fa-store" style="color:var(--store-accent-primary,#8B5CF6);"></i> Contacto del Negocio (publico)</div>
                <div class="sd-form-grid">
                    <div class="sd-form-row">
                        <label>Telefono del negocio</label>
                        <input type="tel" id="sdEditBusinessPhone" class="sd-form-input" value="${esc(provider.business_phone || '')}" maxlength="20" placeholder="+504 0000-0000">
                    </div>
                    <div class="sd-form-row">
                        <label>WhatsApp</label>
                        <input type="tel" id="sdEditWhatsapp" class="sd-form-input" value="${esc(provider.whatsapp || '')}" maxlength="20" placeholder="+504 0000-0000">
                    </div>
                </div>
                <div class="sd-form-row">
                    <label>Email de contacto</label>
                    <input type="email" id="sdEditEmail" class="sd-form-input" value="${esc(provider.email || '')}" maxlength="255">
                </div>
                <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);margin:16px 0 8px;display:flex;align-items:center;gap:6px;"><i class="fas fa-user-lock" style="color:rgba(255,255,255,0.3);"></i> Telefono Personal (privado, opcional)</div>
                <div class="sd-form-row">
                    <label>Telefono personal</label>
                    <input type="tel" id="sdEditPhone" class="sd-form-input" value="${esc(provider.phone || '')}" maxlength="20" placeholder="No visible publicamente" style="border-style:dashed;">
                </div>
                <div class="sd-form-grid">
                    <div class="sd-form-row">
                        <label>Ciudad</label>
                        <input type="text" id="sdEditCity" class="sd-form-input" value="${esc(provider.city || '')}" maxlength="100">
                    </div>
                    <div class="sd-form-row">
                        <label>Barrio / Zona</label>
                        <input type="text" id="sdEditNeighborhood" class="sd-form-input" value="${esc(provider.neighborhood || '')}" maxlength="100">
                    </div>
                </div>
                <div class="sd-form-row">
                    <label>Areas de servicio (separadas por coma)</label>
                    <input type="text" id="sdEditAreas" class="sd-form-input" value="${esc((provider.service_areas || []).join(', '))}" placeholder="Tegucigalpa, SPS, Comayagua">
                </div>
                <div class="sd-form-row">
                    <label>Links Sociales</label>
                    <div class="sd-form-grid">
                        <input type="url" id="sdEditWebsite" class="sd-form-input" value="${esc(provider.social_links?.website || '')}" placeholder="https://mi-sitio.com" maxlength="500">
                        <input type="url" id="sdEditGithub" class="sd-form-input" value="${esc(provider.social_links?.github || '')}" placeholder="https://github.com/user" maxlength="500">
                        <input type="url" id="sdEditLinkedin" class="sd-form-input" value="${esc(provider.social_links?.linkedin || '')}" placeholder="https://linkedin.com/in/user" maxlength="500">
                    </div>
                </div>
                <div class="sd-form-actions">
                    <button class="sd-form-btn sd-form-btn-primary" data-action="save-store-info"><i class="fas fa-save"></i> Guardar Cambios</button>
                </div>
            </div>
        </div>
        <div class="sd-config-section">
            <div class="sd-section-header"><div class="sd-section-title"><i class="far fa-clock"></i> Horario de Atencion</div></div>
            <div class="sd-inline-form" id="sdHoursForm">
                ${(() => {
                    const days = [['monday','Lunes'],['tuesday','Martes'],['wednesday','Miercoles'],['thursday','Jueves'],['friday','Viernes'],['saturday','Sabado'],['sunday','Domingo']];
                    const hours = provider.business_hours || {};
                    return days.map(([key, label]) => {
                        const h = hours[key];
                        const isOpen = h && h.open;
                        return '<div class="sd-form-row" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
                            '<label style="min-width:80px;font-size:13px;">' + label + '</label>' +
                            '<input type="time" class="sd-form-input sd-hours-open" data-day="' + key + '" value="' + (isOpen ? h.open : '09:00') + '" style="max-width:110px;">' +
                            '<span style="color:rgba(255,255,255,0.3);">-</span>' +
                            '<input type="time" class="sd-form-input sd-hours-close" data-day="' + key + '" value="' + (isOpen ? h.close : '17:00') + '" style="max-width:110px;">' +
                            '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:rgba(255,255,255,0.5);"><input type="checkbox" class="sd-hours-active" data-day="' + key + '"' + (isOpen ? ' checked' : '') + '> Abierto</label>' +
                        '</div>';
                    }).join('');
                })()}
                <div class="sd-form-actions">
                    <button class="sd-form-btn sd-form-btn-primary" data-action="save-hours"><i class="fas fa-save"></i> Guardar Horario</button>
                </div>
            </div>
        </div>
        <div class="sd-config-section">
            <div class="sd-section-header"><div class="sd-section-title"><i class="fas fa-credit-card"></i> Metodos de Pago</div></div>
            <div class="sd-inline-form">
                ${(() => {
                    const methods = [['wallet_ltd','LTD Wallet','fa-coins'],['bank_transfer','Transferencia Bancaria','fa-university'],['crypto','Criptomonedas','fa-bitcoin'],['cash','Efectivo','fa-money-bill'],['mobile_money','Tigo/Claro Money','fa-mobile-alt'],['paypal','PayPal','fa-paypal'],['card','Tarjeta','fa-credit-card']];
                    const current = provider.payment_methods || [];
                    return '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + methods.map(([id, label, icon]) => {
                        const checked = current.includes(id);
                        return '<label class="sd-pay-check' + (checked ? ' sd-pay-active' : '') + '" style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,' + (checked ? '0.2' : '0.08') + ');background:rgba(255,255,255,' + (checked ? '0.06' : '0.02') + ');cursor:pointer;font-size:13px;color:rgba(255,255,255,' + (checked ? '0.8' : '0.5') + ');transition:all 0.2s;"><input type="checkbox" class="sd-pay-method" value="' + id + '"' + (checked ? ' checked' : '') + ' style="display:none;"><i class="fas ' + icon + '" style="color:var(--store-accent-primary,#8B5CF6);"></i> ' + label + '</label>';
                    }).join('') + '</div>';
                })()}
                <div class="sd-form-actions">
                    <button class="sd-form-btn sd-form-btn-primary" data-action="save-payments"><i class="fas fa-save"></i> Guardar Metodos</button>
                </div>
            </div>
        </div>
        <div class="sd-config-section">
            <div class="sd-section-header"><div class="sd-section-title"><i class="fas fa-shield-alt"></i> Politicas</div></div>
            <div class="sd-inline-form">
                <div class="sd-form-row"><label>Garantia</label><input type="text" id="sdPolWarranty" class="sd-form-input" value="${esc(provider.policies?.warranty || '')}" placeholder="Ej: 30 dias de soporte incluidos" maxlength="300"></div>
                <div class="sd-form-row"><label>Reembolso</label><input type="text" id="sdPolRefund" class="sd-form-input" value="${esc(provider.policies?.refund || '')}" placeholder="Ej: Reembolso completo si no se inicia" maxlength="300"></div>
                <div class="sd-form-row"><label>Entrega</label><input type="text" id="sdPolDelivery" class="sd-form-input" value="${esc(provider.policies?.delivery || '')}" placeholder="Ej: Entrega iterativa con demos semanales" maxlength="300"></div>
                <div class="sd-form-actions">
                    <button class="sd-form-btn sd-form-btn-primary" data-action="save-policies"><i class="fas fa-save"></i> Guardar Politicas</button>
                </div>
            </div>
        </div>
        <div class="sd-config-section">
            <div class="sd-section-header"><div class="sd-section-title"><i class="fas fa-question-circle"></i> Preguntas Frecuentes</div></div>
            <div class="sd-inline-form" id="sdFaqForm">
                ${(() => {
                    const faqs = provider.faq || [];
                    let html = '';
                    faqs.forEach((item, i) => {
                        html += '<div class="sd-faq-row" style="margin-bottom:12px;padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06);">' +
                            '<input type="text" class="sd-form-input sd-faq-q" value="' + esc(item.q || '') + '" placeholder="Pregunta" style="margin-bottom:6px;">' +
                            '<textarea class="sd-form-input sd-faq-a" rows="2" placeholder="Respuesta">' + esc(item.a || '') + '</textarea>' +
                            '<button data-action="remove-faq" data-index="' + i + '" style="background:none;border:none;color:#ef4444;font-size:12px;cursor:pointer;margin-top:4px;"><i class="fas fa-trash"></i> Eliminar</button>' +
                        '</div>';
                    });
                    return html;
                })()}
                <button data-action="add-faq" style="background:rgba(255,255,255,0.05);border:1px dashed rgba(255,255,255,0.15);border-radius:10px;padding:10px;width:100%;color:rgba(255,255,255,0.5);cursor:pointer;font-size:13px;margin-bottom:12px;font-family:inherit;"><i class="fas fa-plus"></i> Agregar pregunta</button>
                <div class="sd-form-actions">
                    <button class="sd-form-btn sd-form-btn-primary" data-action="save-faq"><i class="fas fa-save"></i> Guardar FAQ</button>
                </div>
            </div>
        </div>
        <div class="sd-danger-zone" style="margin-top:24px;">
            <div class="sd-section-header"><div class="sd-section-title" style="color:#ef4444;"><i class="fas fa-exclamation-triangle"></i> Zona de Peligro</div></div>
            <p style="color:#94a3b8;font-size:0.82rem;margin-bottom:12px;">Eliminar tu tienda desactiva todos tus productos y servicios.</p>
            <button class="sd-danger-btn" data-action="delete-store">Eliminar mi Tienda</button>
        </div>`;

        // ---- APARIENCIA panel ----
        const aparienciaPanel = this._buildThemeBrowser(provider, esc);

        // ---- PLAN panel ----
        const planPanel = `${this.renderTierProgressCard()}
            ${this._buildChainBalanceCard(esc)}
            ${this._buildReferralDashboard(esc)}`;

        return `<div class="sd-subtabs-container">
            <div class="sd-subtabs-nav">
                <button class="sd-subtab${isActive('negocio')}" data-action="cfg-subtab" data-subtab="negocio">
                    <i class="fas fa-store"></i> <span>Negocio</span>
                </button>
                <button class="sd-subtab${isActive('apariencia')}" data-action="cfg-subtab" data-subtab="apariencia">
                    <i class="fas fa-palette"></i> <span>Apariencia</span>
                </button>
                <button class="sd-subtab${isActive('plan')}" data-action="cfg-subtab" data-subtab="plan">
                    <i class="fas fa-crown"></i> <span>Plan</span>
                </button>
            </div>
            <div class="sd-subtab-panel" data-panel="negocio"${isVisible('negocio')}>
                ${negocioPanel}
            </div>
            <div class="sd-subtab-panel" data-panel="apariencia"${isVisible('apariencia')}>
                ${aparienciaPanel}
            </div>
            <div class="sd-subtab-panel" data-panel="plan"${isVisible('plan')}>
                ${planPanel}
            </div>
        </div>`;
    }

    _buildThemeBrowser(provider, esc) {
        const currentTheme = provider.store_theme || 'dark';
        const currentLayout = provider.store_layout || 'classic';
        const themes = [
            { id: 'dark', label: 'Oscuro', c1: '#8B5CF6', c2: '#06B6D4', bg: '#1e1b4b' },
            { id: 'cyan', label: 'Cyan', c1: '#06B6D4', c2: '#14B8A6', bg: '#0c4a6e' },
            { id: 'gold', label: 'Dorado', c1: '#F59E0B', c2: '#D97706', bg: '#451a03' },
            { id: 'green', label: 'Verde', c1: '#10B981', c2: '#059669', bg: '#052e16' },
            { id: 'coral', label: 'Coral', c1: '#EF4444', c2: '#F97316', bg: '#450a0a' },
            { id: 'purple', label: 'Purpura', c1: '#A855F7', c2: '#7C3AED', bg: '#3b0764' }
        ];
        const layouts = [
            { id: 'classic', label: 'Clasica', icon: '\u{1f4cb}', desc: 'Completa con todas las secciones' },
            { id: 'showcase', label: 'Escaparate', icon: '\u{1f5bc}', desc: 'Galeria destacada' },
            { id: 'compact', label: 'Tarjeta', icon: '\u{1f4c7}', desc: 'Minimalista y directa' }
        ];

        const themeCards = themes.map(t => {
            const isActive = t.id === currentTheme;
            return `<div class="sd-theme-card${isActive ? ' active' : ''}" data-theme-id="${esc(t.id)}">
                <div class="sd-theme-preview" style="background:${t.bg};">
                    <div class="sd-theme-preview-bar" style="background:linear-gradient(90deg,${t.c1},${t.c2});"></div>
                    <div class="sd-theme-preview-dot" style="background:${t.c1};"></div>
                    <div class="sd-theme-preview-lines">
                        <div class="sd-theme-preview-line" style="width:30px;background:${t.c1};opacity:0.5;"></div>
                        <div class="sd-theme-preview-line" style="width:20px;background:${t.c2};opacity:0.4;"></div>
                    </div>
                </div>
                <div class="sd-theme-name">${esc(t.label)}</div>
                <button class="sd-theme-btn ${isActive ? 'active-btn' : 'apply-btn'}" data-action="${isActive ? '' : 'sd-apply-theme'}" data-theme="${esc(t.id)}" ${isActive ? 'disabled' : ''}>${isActive ? 'Activo' : 'Aplicar'}</button>
            </div>`;
        }).join('');

        const layoutCards = layouts.map(l => {
            const isActive = l.id === currentLayout;
            return `<div class="sd-layout-card${isActive ? ' active' : ''}">
                <div class="sd-layout-icon">${l.icon}</div>
                <div class="sd-layout-name">${esc(l.label)}</div>
                <div class="sd-layout-desc">${esc(l.desc)}</div>
                <button class="sd-theme-btn ${isActive ? 'active-btn' : 'apply-btn'}" data-action="${isActive ? '' : 'sd-apply-layout'}" data-layout="${esc(l.id)}" ${isActive ? 'disabled' : ''}>${isActive ? 'Activa' : 'Aplicar'}</button>
            </div>`;
        }).join('');

        return `<div class="sd-themes" id="sdThemeBrowser">
            <div class="sd-themes-header"><i class="fas fa-palette"></i> Personaliza tu Tienda</div>
            <div class="sd-themes-sub">Elige un tema de color y un layout para tu tienda.</div>
            <div class="sd-themes-label">Temas de color</div>
            <div class="sd-themes-grid">${themeCards}</div>
            <div class="sd-themes-label">Layouts</div>
            <div class="sd-themes-grid">${layoutCards}</div>
        </div>`;
    }

    async applyThemeInline(themeId) {
        const validThemes = ['dark', 'cyan', 'gold', 'green', 'coral', 'purple'];
        if (!validThemes.includes(themeId)) return;
        try {
            const res = await this.apiRequest('/api/marketplace/providers/me', {
                method: 'PUT',
                body: JSON.stringify({ store_theme: themeId })
            });
            if (res.success) {
                this.showNotification('Tema aplicado', 'success');
                this.loadMyStore();
            } else {
                this.showNotification(t('marketplace.theme_error',{defaultValue:'Error al aplicar tema'}), 'error');
            }
        } catch (err) {
            this.showNotification(t('marketplace.theme_error',{defaultValue:'Error al aplicar tema'}), 'error');
        }
    }

    async applyLayoutInline(layoutId) {
        const validLayouts = ['classic', 'showcase', 'compact'];
        if (!validLayouts.includes(layoutId)) return;
        try {
            const res = await this.apiRequest('/api/marketplace/providers/me', {
                method: 'PUT',
                body: JSON.stringify({ store_layout: layoutId })
            });
            if (res.success) {
                this.showNotification('Layout aplicado', 'success');
                this.loadMyStore();
            } else {
                this.showNotification(t('marketplace.layout_error',{defaultValue:'Error al cambiar layout'}), 'error');
            }
        } catch (err) {
            this.showNotification(t('marketplace.layout_error',{defaultValue:'Error al cambiar layout'}), 'error');
        }
    }

    switchListingTab(tabName) {
        const container = document.querySelector('.sd-listings');
        if (!container) return;
        container.querySelectorAll('.sd-listings-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
        container.querySelectorAll('.sd-listings-content').forEach(c => c.classList.toggle('active', c.dataset.tab === tabName));
    }

    // ===================== SHOWCASE LAYOUT =====================
    _renderDashboardShowcase(container, provider, storeData, theme) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const badges = this._buildBadgesHtml(provider);
        const loc = [provider.city, provider.neighborhood].filter(Boolean).join(', ');
        const contactItems = this._buildContactItems(provider);
        const { services, products, reviews, showServices, showProducts } = storeData;

        // Collect images for gallery from services + products (M6 fix: handle image objects)
        const allImages = [];
        services.forEach(s => { if (s.images) s.images.forEach(img => { const url = typeof img === 'object' ? img.url : img; allImages.push({ url, title: s.title }); }); });
        products.forEach(p => { if (p.images) p.images.forEach(img => { const url = typeof img === 'object' ? img.url : img; allImages.push({ url, title: p.title }); }); });
        const galleryItems = allImages.slice(0, 6);

        let galleryHtml = '';
        if (galleryItems.length > 0) {
            galleryHtml = `<div class="store-section">
                <div class="store-section-header"><div class="store-section-title">Galeria (${galleryItems.length})</div></div>
                <div class="store-gallery-grid">
                    ${galleryItems.map(g => `<div class="store-gallery-item">
                        <img src="${esc(g.url)}" alt="${esc(g.title)}">
                        <div class="store-gallery-overlay"><span>${esc(g.title)}</span></div>
                    </div>`).join('')}
                </div>
            </div>`;
        }

        let testimonialsHtml = '';
        if (reviews.length > 0) {
            testimonialsHtml = `<div class="store-section">
                <div class="store-section-header"><div class="store-section-title">Testimonios (${reviews.length})</div></div>
                <div class="store-testimonials-list">
                    ${reviews.map(r => `<div class="store-testimonial-card">
                        <div class="store-testimonial-header">
                            <div class="store-testimonial-avatar">${r.reviewer_avatar ? `<img src="${esc(r.reviewer_avatar)}" alt="">` : esc((r.reviewer_name || '?').charAt(0))}</div>
                            <div class="store-testimonial-info">
                                <div class="store-testimonial-name">${esc(r.reviewer_name)}</div>
                                <div class="store-testimonial-rating">${'\u2b50'.repeat(Math.min(Math.max(Math.round(r.overall_rating || 0), 0), 5))}</div>
                            </div>
                        </div>
                        ${r.comment ? `<div class="store-testimonial-text">${esc(r.comment)}</div>` : ''}
                    </div>`).join('')}
                </div>
            </div>`;
        } else {
            testimonialsHtml = `<div class="store-section">
                <div class="store-section-header"><div class="store-section-title">Testimonios</div></div>
                <div class="store-empty">Aun no hay resenas. Tus clientes podran dejar testimonios aqui.</div>
            </div>`;
        }

        // Use shared builders for full feature parity with Classic V2
        const quickActions = this._buildQuickActionsToolbar(provider, esc);
        const listings = this._buildTabbedListings(storeData, provider, esc);
        const themes = this._buildThemeBrowser(provider, esc);
        const referralDash = this._buildReferralDashboard(esc);
        const tierCard = this.renderTierProgressCard();

        // Enhanced analytics for plan+ tiers
        let sellerAnalytics = '';
        if (storeData.analytics && storeData.analyticsLevel !== 'basic') {
            const a = storeData.analytics;
            const summary = a.summary || {};
            sellerAnalytics += `<div class="sd-analytics"><div class="sd-analytics-card">
                <div class="sd-analytics-icon sd-icon-ventas"><i class="fas fa-coins"></i></div>
                <div class="sd-analytics-body">
                    <div class="sd-analytics-value">L. ${window.ltFormatNumber ? ltFormatNumber(summary.total_revenue || 0) : parseFloat(summary.total_revenue || 0).toLocaleString('es-HN')}</div>
                    <div class="sd-analytics-label">Ingresos totales</div>
                </div>
            </div></div>`;
        }

        const setupBanner2 = this._buildSetupBanner(provider, storeData);
        container.innerHTML = `<div class="store-dashboard" data-layout="showcase" data-theme="${esc(theme)}">
            ${setupBanner2}
            ${tierCard}
            <div class="store-showcase-hero">
                <div class="store-showcase-hero-content">
                    <div class="store-name">${esc(provider.business_name || 'Mi Tienda')} ${badges}</div>
                    ${loc ? `<div class="store-location" style="margin-top:4px;"><i class="fas fa-map-marker-alt"></i> ${esc(loc)}</div>` : ''}
                    <div class="store-showcase-mini-stats">
                        <span class="store-stat-rating"><i class="fas fa-star"></i> ${esc(provider.avg_rating || '0')}</span>
                        <span class="store-stat-jobs">${esc(provider.completed_jobs || 0)} trabajos</span>
                        <span class="store-stat-reviews">${esc(provider.total_reviews || 0)} resenas</span>
                    </div>
                </div>
                <div class="store-actions">
                    <button class="store-btn-edit" data-action="edit-store"><i class="fas fa-pen"></i> Editar</button>
                </div>
            </div>

            ${quickActions}
            ${sellerAnalytics}
            ${galleryHtml}
            ${listings}
            ${testimonialsHtml}
            ${referralDash}
            ${themes}

            <div class="store-section">
                <div class="store-section-header">
                    <div class="store-section-title">Contacto</div>
                    <button class="store-section-btn" data-action="edit-store">Editar</button>
                </div>
                <div class="store-contact-grid">${contactItems}</div>
            </div>
        </div>`;

        // Load async data
        this._loadReferralDashboard();
    }

    // ===================== COMPACT LAYOUT =====================
    _renderDashboardCompact(container, provider, storeData, theme) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const initial = (provider.business_name || provider.user_name || 'T').charAt(0).toUpperCase();
        const avatarHtml = provider.profile_image
            ? `<img src="${esc(provider.profile_image)}" alt="">`
            : esc(initial);
        const badges = this._buildBadgesHtml(provider);
        const contactItems = this._buildContactItems(provider);

        // Use shared builders for full feature parity with Classic V2
        const quickActions = this._buildQuickActionsToolbar(provider, esc);
        const listings = this._buildTabbedListings(storeData, provider, esc);
        const themes = this._buildThemeBrowser(provider, esc);
        const referralDash = this._buildReferralDashboard(esc);
        const tierCard = this.renderTierProgressCard();

        const totalItems = (storeData.services?.length || 0) + (storeData.products?.length || 0);

        const setupBanner3 = this._buildSetupBanner(provider, storeData);
        container.innerHTML = `<div class="store-dashboard" data-layout="compact" data-theme="${esc(theme)}">
            ${setupBanner3}
            ${tierCard}
            <div class="store-compact-card">
                <div class="store-compact-avatar">${avatarHtml}</div>
                <div class="store-compact-name">${esc(provider.business_name || 'Mi Tienda')}</div>
                <div class="store-compact-badges">${badges}</div>
                ${provider.description ? `<div class="store-compact-desc">${esc(provider.description.length > 120 ? provider.description.slice(0, 120) + '...' : provider.description)}</div>` : ''}
                <div class="store-compact-stats">
                    <div class="store-compact-stat"><span class="store-stat-rating"><i class="fas fa-star"></i> ${esc(provider.avg_rating || '0')}</span><small>Rating</small></div>
                    <div class="store-compact-stat"><span class="store-stat-jobs">${esc(provider.completed_jobs || 0)}</span><small>Trabajos</small></div>
                    <div class="store-compact-stat"><span class="store-stat-reviews">${esc(String(totalItems))}</span><small>Listados</small></div>
                </div>
            </div>

            ${quickActions}
            ${listings}
            ${referralDash}
            ${themes}

            <div class="store-section">
                <div class="store-section-header">
                    <div class="store-section-title">Contacto</div>
                </div>
                <div class="store-contact-grid">${contactItems}</div>
            </div>
        </div>`;

        // Load async data
        this._loadReferralDashboard();
    }
    // ===================== EDIT STORE MODAL =====================
    openEditStoreModal() {
        const provider = this._currentProvider;
        if (!provider) return;

        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const socialLinks = provider.social_links || {};
        const serviceAreas = Array.isArray(provider.service_areas) ? provider.service_areas.join(', ') : '';
        const currentLayout = provider.store_layout || 'classic';
        const currentTheme = provider.store_theme || 'dark';

        const overlay = document.createElement('div');
        overlay.className = 'store-edit-overlay ds-overlay';
        overlay.id = 'storeEditOverlay';
        const editTypeIcon = (provider.shop_type || 'services') === 'products' ? '📦' : (provider.shop_type || 'services') === 'mixed' ? '🏬' : '🔧';
        const editTypeLabel = (provider.shop_type || 'services') === 'products' ? 'Productos' : (provider.shop_type || 'services') === 'mixed' ? 'Mixta' : 'Servicios';

        const layouts = [
            { id: 'classic', label: 'Clasica' },
            { id: 'showcase', label: 'Escaparate' },
            { id: 'compact', label: 'Tarjeta' }
        ];
        const themes = [
            { id: 'dark', label: 'Oscuro', c1: '#8B5CF6', c2: '#06B6D4' },
            { id: 'cyan', label: 'Cyan', c1: '#06B6D4', c2: '#14B8A6' },
            { id: 'gold', label: 'Dorado', c1: '#F59E0B', c2: '#D97706' },
            { id: 'green', label: 'Verde', c1: '#10B981', c2: '#059669' },
            { id: 'coral', label: 'Coral', c1: '#EF4444', c2: '#F97316' },
            { id: 'purple', label: 'Purpura', c1: '#A855F7', c2: '#7C3AED' }
        ];

        const layoutPickerHtml = layouts.map(l =>
            `<button type="button" class="store-edit-layout-opt${l.id === currentLayout ? ' active' : ''}" data-action="pick-edit-layout" data-id="${l.id}">${esc(l.label)}</button>`
        ).join('');

        const themePickerHtml = themes.map(t =>
            `<button type="button" class="store-edit-theme-opt${t.id === currentTheme ? ' active' : ''}" data-action="pick-edit-theme" data-id="${t.id}"><span class="store-edit-swatch" style="background:${t.c1};"></span> ${esc(t.label)}</button>`
        ).join('');

        overlay.innerHTML = `<div class="store-edit-modal">
            <h3>Editar Tienda</h3>
            <div class="store-edit-type-info">${editTypeIcon} Tipo: ${esc(editTypeLabel)} &mdash; No se puede cambiar</div>

            <div class="store-edit-picker-section">
                <label>Layout</label>
                <div class="store-edit-layout-picker">${layoutPickerHtml}</div>
            </div>
            <div class="store-edit-picker-section">
                <label>Tema de color</label>
                <div class="store-edit-theme-picker">${themePickerHtml}</div>
            </div>

            <form id="storeEditForm">
                <div class="store-form-group">
                    <label>Logo / Imagen de perfil</label>
                    <div class="store-edit-avatar-section">
                        <div class="store-edit-avatar-preview" id="editStoreAvatarPreview">
                            ${provider.profile_image ? `<img src="${esc(provider.profile_image)}" alt="">` : `<span>${esc((provider.business_name || 'T').charAt(0).toUpperCase())}</span>`}
                        </div>
                        <div class="store-edit-avatar-actions">
                            <button type="button" class="store-btn-upload" id="editStoreAvatarBtn">Cambiar logo</button>
                            <input type="file" id="editStoreAvatarInput" accept="image/*" style="display:none">
                            <div class="store-edit-avatar-hint">JPG, PNG o WebP. Max 2 MB.</div>
                        </div>
                    </div>
                </div>
                <div class="store-form-group">
                    <label>Nombre del negocio *</label>
                    <input type="text" id="editStoreName" required maxlength="255" value="${esc(provider.business_name || '')}">
                </div>
                <div class="store-form-group">
                    <label>Descripcion</label>
                    <textarea id="editStoreDesc" maxlength="2000">${esc(provider.description || '')}</textarea>
                </div>
                <div class="store-form-row">
                    <div class="store-form-group">
                        <label>Telefono</label>
                        <input type="tel" id="editStorePhone" maxlength="20" value="${esc(provider.phone || '')}">
                    </div>
                    <div class="store-form-group">
                        <label>WhatsApp</label>
                        <input type="tel" id="editStoreWhatsapp" maxlength="20" value="${esc(provider.whatsapp || '')}">
                    </div>
                </div>
                <div class="store-form-group">
                    <label>Email de contacto</label>
                    <input type="email" id="editStoreEmail" maxlength="255" value="${esc(provider.email || '')}">
                </div>
                <div class="store-form-row">
                    <div class="store-form-group">
                        <label>Ciudad</label>
                        <input type="text" id="editStoreCity" maxlength="100" value="${esc(provider.city || '')}">
                    </div>
                    <div class="store-form-group">
                        <label>Barrio / Zona</label>
                        <input type="text" id="editStoreNeighborhood" maxlength="100" value="${esc(provider.neighborhood || '')}">
                    </div>
                </div>
                <div class="store-form-group">
                    <label>Areas de servicio (separadas por coma)</label>
                    <input type="text" id="editStoreAreas" value="${esc(serviceAreas)}">
                </div>
                <div class="store-form-section">Links sociales</div>
                <div class="store-form-group">
                    <label>Sitio Web</label>
                    <input type="url" id="editStoreWebsite" maxlength="500" value="${esc(socialLinks.website || '')}">
                </div>
                <div class="store-form-row">
                    <div class="store-form-group">
                        <label>GitHub</label>
                        <input type="url" id="editStoreGithub" maxlength="500" value="${esc(socialLinks.github || '')}">
                    </div>
                    <div class="store-form-group">
                        <label>LinkedIn</label>
                        <input type="url" id="editStoreLnkdin" maxlength="500" value="${esc(socialLinks.linkedin || '')}">
                    </div>
                </div>
                <div class="store-edit-actions">
                    <button type="button" class="store-btn-cancel" data-action="close-edit-store">Cancelar</button>
                    <button type="submit" class="store-btn-save" id="editStoreSaveBtn">Guardar Cambios</button>
                </div>
            </form>
        </div>`;

        document.body.appendChild(overlay);

        // Close on overlay click (outside modal)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // Profile image upload handler
        let pendingProfileImage = null;
        const avatarBtn = document.getElementById('editStoreAvatarBtn');
        const avatarInput = document.getElementById('editStoreAvatarInput');
        const avatarPreview = document.getElementById('editStoreAvatarPreview');
        if (avatarBtn && avatarInput) {
            avatarBtn.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    this.showNotification('Solo se permiten imagenes', 'error');
                    return;
                }
                if (file.size > 2 * 1024 * 1024) {
                    this.showNotification('Imagen muy grande (max 2 MB)', 'error');
                    return;
                }
                avatarBtn.disabled = true;
                avatarBtn.textContent = 'Subiendo...';
                try {
                    const compressed = await this._compressImage(file, 400, 400, 0.85);
                    const formData = new FormData();
                    formData.append('images', compressed, 'profile.' + (file.name.split('.').pop() || 'jpg'));
                    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
                    const uploadRes = await fetch('/api/marketplace/services/upload-images', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: formData
                    });
                    const uploadData = await uploadRes.json();
                    if (uploadData.success && uploadData.data?.urls?.length) {
                        pendingProfileImage = uploadData.data.urls[0];
                        avatarPreview.innerHTML = `<img src="${this.escapeHtml(pendingProfileImage)}" alt="">`;
                        avatarBtn.textContent = 'Cambiar logo';
                    } else {
                        this.showNotification(t('messages.image_upload_error',{defaultValue:'Error al subir imagen'}), 'error');
                        avatarBtn.textContent = 'Cambiar logo';
                    }
                } catch (err) {
                    this.showNotification(t('messages.image_upload_error',{defaultValue:'Error al subir imagen'}), 'error');
                    avatarBtn.textContent = 'Cambiar logo';
                }
                avatarBtn.disabled = false;
            });
        }

        const editForm = document.getElementById('storeEditForm');
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const saveBtn = document.getElementById('editStoreSaveBtn');
                saveBtn.disabled = true;
                saveBtn.textContent = 'Guardando...';

                const areas = document.getElementById('editStoreAreas').value
                    .split(',').map(s => s.trim()).filter(Boolean);

                const newSocialLinks = {};
                const website = document.getElementById('editStoreWebsite').value.trim();
                const github = document.getElementById('editStoreGithub').value.trim();
                const linkedin = document.getElementById('editStoreLnkdin').value.trim();
                if (website) newSocialLinks.website = website;
                if (github) newSocialLinks.github = github;
                if (linkedin) newSocialLinks.linkedin = linkedin;

                // Get selected layout and theme from active buttons
                const activeLayout = overlay.querySelector('.store-edit-layout-opt.active');
                const activeTheme = overlay.querySelector('.store-edit-theme-opt.active');
                let selectedLayout = activeLayout ? activeLayout.dataset.id : currentLayout;
                let selectedTheme = activeTheme ? activeTheme.dataset.id : currentTheme;

                // Tier gate: revert to current if user can't use selected option
                if (selectedLayout !== currentLayout && !this.checkTierGate('select_layout', { layout: selectedLayout })) {
                    selectedLayout = currentLayout;
                }
                if (selectedTheme !== currentTheme && !this.checkTierGate('select_theme', { theme: selectedTheme })) {
                    selectedTheme = currentTheme;
                }

                const updateBody = {
                    business_name: document.getElementById('editStoreName').value.trim(),
                    description: document.getElementById('editStoreDesc').value.trim(),
                    phone: document.getElementById('editStorePhone').value.trim() || null,
                    whatsapp: document.getElementById('editStoreWhatsapp').value.trim() || null,
                    email: document.getElementById('editStoreEmail').value.trim() || null,
                    city: document.getElementById('editStoreCity').value.trim() || null,
                    neighborhood: document.getElementById('editStoreNeighborhood').value.trim() || null,
                    service_areas: areas.length ? areas : null,
                    social_links: Object.keys(newSocialLinks).length ? newSocialLinks : {},
                    store_layout: selectedLayout,
                    store_theme: selectedTheme
                };
                if (pendingProfileImage) {
                    updateBody.profile_image = pendingProfileImage;
                }

                try {
                    const res = await this.apiRequest('/api/marketplace/providers/me', {
                        method: 'PUT',
                        body: JSON.stringify(updateBody)
                    });

                    if (res.success) {
                        overlay.remove();
                        this.showNotification('Tienda actualizada', 'success');
                        this.loadMyStore();
                    } else {
                        this.showNotification(t('messages.save_error',{defaultValue:'Error al guardar'}), 'error');
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Guardar Cambios';
                    }
                } catch (err) {
                    this.showNotification(t('messages.save_error',{defaultValue:'Error al guardar'}), 'error');
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Guardar Cambios';
                }
            });
        }
    }

    async handleCreateProduct() {
        const overlay = document.getElementById('productCreateOverlay');
        if (!overlay) return;
        const submitBtn = overlay.querySelector('[data-action="submit-product"]');
        if (!submitBtn) return;
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>&#9203;</span> Publicando...';

            const getVal = (id) => (overlay.querySelector('#' + id)?.value || '').trim();
            const formData = {
                title: getVal('cpTitle'),
                category_id: getVal('cpCategory'),
                condition: getVal('cpCondition'),
                price: parseFloat(getVal('cpPrice')) || 0,
                currency: getVal('cpCurrency') || 'HNL',
                quantity: parseInt(getVal('cpQuantity')) || 1,
                location: getVal('cpLocation') || 'Honduras',
                description: getVal('cpDescription'),
                shipping_available: overlay.querySelector('#cpShipping')?.checked || false,
                shipping_price: parseFloat(getVal('cpShippingPrice')) || 0,
                referral_commission_percent: parseInt(getVal('cpCommission')) || 5
            };

            if (!formData.title || !formData.category_id || !formData.description) {
                this.showNotification(t('forms.complete_all_required',{defaultValue:'Por favor completa todos los campos requeridos'}), 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            if (formData.title.length > 200) {
                this.showNotification('El titulo no puede exceder 200 caracteres', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            if (formData.price < 0 || formData.price > 1000000) {
                this.showNotification('Precio invalido (0 - 1,000,000)', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            // Upload images first if any
            let imageUrls = [];
            if (this._images?.product?.length) {
                const uploadResult = await this._uploadImages('product');
                if (uploadResult && uploadResult.success && uploadResult.data?.images) {
                    imageUrls = uploadResult.data.images.map(img => img.url);
                    formData.images = imageUrls;
                }
            }

            const response = await this.apiRequest('/api/marketplace/products', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response.success) {
                overlay.remove();
                this._images.product = [];
                this.showNotification('Producto publicado exitosamente', 'success');
                this.loadMyStore();
            } else {
                this.showNotification(t('marketplace.publish_product_error',{defaultValue:'Error al publicar el producto'}), 'error');
            }
        } catch (error) {
            this.showNotification(t('marketplace.publish_product_error',{defaultValue:'Error al publicar el producto'}), 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    }
    
    getCategoryIcon(category) {
        const icons = {
            electronics: '📱',
            clothing: '👕',
            home: '🏠',
            services: '⚙️',
            food: '🍕',
            digital: '💻'
        };
        return icons[category] || '📦';
    }
    
    closeCreateProductModal() {
        document.getElementById('productCreateOverlay')?.remove();
    }
    
    closeBookingModal() {
        document.getElementById('bookingModal')?.classList.remove('active');
        document.getElementById('bookingForm')?.reset();
    }
    
    // Utility methods

    // XSS prevention helper (v4.0.0)
    escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    getCurrentUser() {
        // Check multiple auth storage keys for compatibility
        const authData = localStorage.getItem('latanda_user') ||
                         localStorage.getItem('laTandaWeb3Auth') ||
                         sessionStorage.getItem('laTandaWeb3Auth');
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                return parsed.user || parsed;
            } catch (e) {
            }
        }
        return null; // Return null for guests instead of demo user
    }

    getAuthToken() {
        // Check multiple token storage keys
        return localStorage.getItem('auth_token') ||
               localStorage.getItem('latanda_token') ||
               sessionStorage.getItem('auth_token');
    }

    // API helper with auth headers
    async apiRequest(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffInMs = now - new Date(date);
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInMinutes < 60) {
            return `Hace ${diffInMinutes} min`;
        } else if (diffInHours < 24) {
            return `Hace ${diffInHours}h`;
        } else {
            return `Hace ${diffInDays}d`;
        }
    }
    
    showConfirm(message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar') {
        return new Promise((resolve) => {
            const existing = document.getElementById('mpConfirmOverlay');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'mpConfirmOverlay';
            overlay.className = 'modal active';
            overlay.innerHTML = `
                <div class="modal-content" style="max-width:400px;text-align:center;">
                    <div style="padding:24px;">
                        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                        <p style="font-size:16px;margin-bottom:24px;color:rgba(255,255,255,0.9);">${this.escapeHtml(message)}</p>
                        <div style="display:flex;gap:12px;justify-content:center;">
                            <button class="btn btn-secondary ds-btn ds-btn-secondary" id="mpConfirmCancel">${this.escapeHtml(cancelLabel)}</button>
                            <button class="btn btn-danger ds-btn ds-btn-danger" id="mpConfirmOk">${this.escapeHtml(confirmLabel)}</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            const close = (val) => { overlay.remove(); resolve(val); };
            overlay.querySelector('#mpConfirmOk').addEventListener('click', () => close(true));
            overlay.querySelector('#mpConfirmCancel').addEventListener('click', () => close(false));
            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#8B5CF6'};
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
    

    // =====================================================
    // MESSAGING SYSTEM
    // =====================================================

    /**
     * Load all conversations for the current user
     */
    async loadConversations() {
        if (this.isGuest) {
            this.renderGuestMessagesPrompt();
            return;
        }

        const container = document.getElementById("conversationsList");
        if (!container) return;

        container.innerHTML = `
            <div class="conversations-loading">
                <div class="pulse" style="font-size: 32px;">💬</div>
                <p>Cargando conversaciones...</p>
            </div>
        `;

        try {
            const response = await this.apiRequest("/api/marketplace/messages/conversations");
            this.conversations = response.conversations || [];

            // Also fetch unread count
            await this.updateUnreadBadge();

            this.renderConversations();
        } catch (error) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                    <h3>Error al cargar mensajes</h3>
                    <p>Intenta de nuevo mas tarde.</p>
                    <button class="btn btn-secondary ds-btn ds-btn-secondary" style="margin-top: 15px;" data-action="retry-conversations">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Render conversations list
     */
    renderConversations() {
        const container = document.getElementById("conversationsList");
        if (!container) return;

        if (this.conversations.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">💬</div>
                    <h3>Sin conversaciones</h3>
                    <p>Cuando contactes a un vendedor o alguien te escriba, aparecerá aquí</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.conversations.map(conv => this.createConversationItem(conv)).join("");
    }

    /**
     * Create a conversation list item
     */
    createConversationItem(conv) {
        const initial = (conv.other_user_name || "U").charAt(0).toUpperCase();
        const timeAgo = this.getTimeAgo(conv.created_at);
        const unreadClass = conv.has_unread ? "has-unread" : "";
        const safeProductTitle = conv.product_title ? this.escapeHtml(conv.product_title) : "";
        const productInfo = safeProductTitle ? `<div class="conv-product">📦 ${safeProductTitle}</div>` : "";
        const safeName = this.escapeHtml(conv.other_user_name || "Usuario");
        const safeMsg = this.escapeHtml(this.truncateText(conv.message, 50));
        const safeOtherId = this.escapeHtml(conv.other_user_id || "");

        return `
            <div class="conversation-item ${unreadClass}" data-action="open-conv" data-other-id="${safeOtherId}" data-product-id="${conv.product_id || ""}" data-other-name="${safeName}">
                <div class="conv-avatar">${initial}</div>
                <div class="conv-content">
                    <div class="conv-header">
                        <span class="conv-name">${safeName}</span>
                        <span class="conv-time">${this.escapeHtml(timeAgo)}</span>
                    </div>
                    ${productInfo}
                    <div class="conv-preview">${safeMsg}</div>
                </div>
                ${conv.has_unread ? '<div class="conv-unread-dot"></div>' : ""}
            </div>
        `;
    }

    /**
     * Open a conversation and load messages
     */
    async openConversation(otherUserId, productId, otherUserName) {
        this.currentConversation = {
            otherUserId,
            productId,
            otherUserName
        };

        // Show chat panel, hide conversations list on mobile
        const chatPanel = document.getElementById("chatPanel");
        const convPanel = document.getElementById("conversationsPanel");
        if (chatPanel) chatPanel.style.display = "flex";
        if (convPanel && window.innerWidth < 768) convPanel.style.display = "none";

        // Update chat header
        document.getElementById("chatAvatar").textContent = (otherUserName || "U").charAt(0).toUpperCase();
        document.getElementById("chatUserName").textContent = otherUserName || "Usuario";

        const productEl = document.getElementById("chatProduct");
        if (productEl) {
            const conv = this.conversations.find(c => c.other_user_id === otherUserId && c.product_id === productId);
            productEl.textContent = conv?.product_title ? `📦 ${conv.product_title}` : "";
        }

        // Load messages
        await this.loadMessages(otherUserId, productId);
    }

    /**
     * Load messages for a conversation
     */
    async loadMessages(otherUserId, productId) {
        const container = document.getElementById("chatMessages");
        if (!container) return;

        container.innerHTML = `
            <div class="chat-loading">
                <div class="pulse">💬</div>
                <p>Cargando mensajes...</p>
            </div>
        `;

        try {
            let url = `/api/marketplace/messages/${otherUserId}`;
            if (productId) url += `?product_id=${productId}`;

            const response = await this.apiRequest(url);
            this.messages = response.messages || [];

            this.renderMessages();

            // Mark messages as read
            await this.markMessagesRead(otherUserId, productId);

            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        } catch (error) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                    <p>Error al cargar mensajes</p>
                </div>
            `;
        }
    }

    /**
     * Render messages in chat panel
     */
    renderMessages() {
        const container = document.getElementById("chatMessages");
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                    <div style="font-size: 32px; margin-bottom: 10px;">👋</div>
                    <p>Inicia la conversación</p>
                </div>
            `;
            return;
        }

        const currentUserId = this.currentUser?.user_id || this.currentUser?.id;
        container.innerHTML = this.messages.map(msg => {
            const isMine = msg.sender_id === currentUserId;
            const timeAgo = this.getTimeAgo(msg.created_at);

            return `
                <div class="chat-message ${isMine ? "sent" : "received"}">
                    <div class="message-bubble">
                        ${msg.message}
                    </div>
                    <div class="message-time">${timeAgo}</div>
                </div>
            `;
        }).join("");

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Send a chat message
     */
    async sendChatMessage() {
        if (!this.currentConversation) {
            this.showNotification("No hay conversación activa", "error");
            return;
        }
        // Tier gate: daily message limit
        if (!this.checkTierGate('send_message')) return;

        const input = document.getElementById("messageInput");
        const message = input?.value?.trim();

        if (!message) return;

        // Disable input while sending
        if (input) {
            input.disabled = true;
            input.value = "";
        }

        try {
            const response = await this.apiRequest("/api/marketplace/messages", {
                method: "POST",
                body: JSON.stringify({
                    recipient_id: this.currentConversation.otherUserId,
                    message: message,
                    product_id: this.currentConversation.productId || null
                })
            });

            // Add message to list
            this.messages.push(response.message);
            this.renderMessages();

            // Scroll to bottom
            const container = document.getElementById("chatMessages");
            if (container) container.scrollTop = container.scrollHeight;

        } catch (error) {
            this.showNotification("Error al enviar mensaje", "error");
            // Restore the message to input
            if (input) input.value = message;
        } finally {
            if (input) input.disabled = false;
            input?.focus();
        }
    }

    /**
     * Close chat panel and return to conversations list
     */
    closeChatPanel() {
        const chatPanel = document.getElementById("chatPanel");
        const convPanel = document.getElementById("conversationsPanel");

        if (chatPanel) chatPanel.style.display = "none";
        if (convPanel) convPanel.style.display = "block";

        this.currentConversation = null;

        // Refresh conversations to update unread status
        this.loadConversations();
    }

    /**
     * Mark messages as read
     */
    async markMessagesRead(otherUserId, productId) {
        try {
            await this.apiRequest("/api/marketplace/messages/read", {
                method: "PUT",
                body: JSON.stringify({
                    other_user_id: otherUserId,
                    product_id: productId || null
                })
            });
            await this.updateUnreadBadge();
        } catch (error) {
        }
    }

    /**
     * Update unread message badge
     */
    async updateUnreadBadge() {
        try {
            const response = await this.apiRequest("/api/marketplace/messages/unread");
            this.unreadCount = response.unread_count || 0;

            const badge = document.getElementById("totalUnreadBadge");
            if (badge) {
                badge.textContent = this.unreadCount;
                badge.style.display = this.unreadCount > 0 ? "flex" : "none";
            }

            // Also update nav badge if exists
            const navBadge = document.querySelector('.mp-nav-item[onclick*="messages"] .nav-badge');
            if (navBadge) {
                navBadge.textContent = this.unreadCount;
                navBadge.style.display = this.unreadCount > 0 ? "flex" : "none";
            }
        } catch (error) {
        }
    }

    /**
     * Start a new conversation with a seller (from product page)
     */
    async startConversation(sellerId, productId, sellerName) {
        if (this.isGuest) {
            this.showLoginPrompt("enviar mensajes");
            return;
        }

        // Navigate to messages section
        this.switchTab("messages");

        // Wait for section to load, then open the conversation
        setTimeout(() => {
            this.openConversation(sellerId, productId, sellerName);
        }, 300);
    }

    /**
     * Render guest prompt for messages section
     */
    renderGuestMessagesPrompt() {
        const container = document.getElementById("conversationsList");
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
                <h3>Inicia sesión para ver tus mensajes</h3>
                <p style="margin-bottom: 20px;">Crea una cuenta o inicia sesión para contactar vendedores y ver tus conversaciones</p>
                <button class="btn btn-primary ds-btn ds-btn-primary" onclick="goToLogin()">
                    Iniciar Sesión
                </button>
            </div>
        `;
    }

    /**
     * Truncate text helper
     */
    truncateText(text, maxLength) {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }

    // =============================================
    // Image helpers (shared for products & services)
    // =============================================

    _compressImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => resolve(file);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    }

    _handleImageSelect(files, contextKey) {
        if (!this._images) this._images = {};
        if (!this._images[contextKey]) this._images[contextKey] = [];
        const MAX = 5;
        const arr = Array.from(files);

        if (this._images[contextKey].length + arr.length > MAX) {
            this.showNotification('Maximo ' + MAX + ' imagenes permitidas', 'error');
            return;
        }

        for (const file of arr) {
            if (this._images[contextKey].length >= MAX) break;
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                this.showNotification('Solo se permiten JPEG, PNG, WebP o GIF', 'error');
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('La imagen excede 5MB', 'error');
                continue;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                // Read dimensions for display
                const img = new Image();
                img.onload = () => {
                    const lowRes = img.width < 400 || img.height < 400;
                    this._images[contextKey].push({ file, preview: e.target.result, width: img.width, height: img.height, lowRes });
                    this._renderImagePreviews(contextKey);
                };
                img.onerror = () => {
                    this._images[contextKey].push({ file, preview: e.target.result, width: 0, height: 0, lowRes: false });
                    this._renderImagePreviews(contextKey);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    _renderImagePreviews(contextKey) {
        const container = document.getElementById(contextKey + 'ImagePreviews');
        if (!container) return;
        const imgs = this._images?.[contextKey] || [];
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        container.innerHTML = imgs.map((img, i) => {
            const badge = i === 0 ? '<span class="img-badge img-badge-primary">Principal</span>' : '<span class="img-badge">' + (i + 1) + '</span>';
            const dims = (img.width && img.height) ? '<span class="img-dimensions">' + img.width + 'x' + img.height + (img.lowRes ? ' \u26A0' : ' \u2713') + '</span>' : '';
            const lowClass = img.lowRes ? ' low-res' : '';
            return '<div class="store-image-preview' + lowClass + '" draggable="true" data-img-idx="' + i + '" data-context="' + esc(contextKey) + '">' +
                '<div class="drag-handle" title="Arrastrar para reordenar">\u2801\u2801\u2801</div>' +
                '<img loading="lazy" src="' + img.preview + '" alt="">' +
                badge + dims +
                '<button type="button" class="store-image-preview-remove" data-action="remove-' + esc(contextKey) + '-image" data-index="' + i + '">\u00D7</button>' +
            '</div>';
        }).join('');

        // Setup drag-to-reorder
        this._setupImageReorder(container, contextKey);

        // Update dropzone text
        const dropzone = document.getElementById(contextKey + 'Dropzone');
        if (dropzone) {
            const textEl = dropzone.querySelector('.store-image-dropzone-text');
            const remaining = 5 - imgs.length;
            if (textEl) {
                textEl.textContent = imgs.length > 0
                    ? imgs.length + ' imagen(es) - Puedes agregar ' + remaining + ' mas'
                    : 'Haz clic o arrastra imagenes aqui';
            }
        }
    }

    // Drag-to-reorder images
    _setupImageReorder(container, contextKey) {
        let dragIdx = null;
        container.querySelectorAll('.store-image-preview').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                dragIdx = parseInt(el.dataset.imgIdx);
                el.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                container.querySelectorAll('.store-image-preview').forEach(p => p.classList.remove('drop-target'));
            });
            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                container.querySelectorAll('.store-image-preview').forEach(p => p.classList.remove('drop-target'));
                el.classList.add('drop-target');
            });
            el.addEventListener('drop', (e) => {
                e.preventDefault();
                const dropIdx = parseInt(el.dataset.imgIdx);
                if (dragIdx !== null && dragIdx !== dropIdx && this._images?.[contextKey]) {
                    const arr = this._images[contextKey];
                    const item = arr.splice(dragIdx, 1)[0];
                    arr.splice(dropIdx, 0, item);
                    this._renderImagePreviews(contextKey);
                }
                dragIdx = null;
            });
        });
    }

    _removeImage(contextKey, index) {
        if (!this._images?.[contextKey]) return;
        this._images[contextKey].splice(index, 1);
        this._renderImagePreviews(contextKey);
    }

    async _uploadImages(contextKey) {
        const imgs = this._images?.[contextKey];
        if (!imgs || imgs.length === 0) return { success: true, data: { images: [] } };

        // Show uploading indicator
        const container = document.getElementById(contextKey + 'ImagePreviews');
        if (container) container.querySelectorAll('.store-image-preview').forEach(p => p.classList.add('uploading'));

        const formData = new FormData();
        for (let i = 0; i < imgs.length; i++) {
            const compressed = await this._compressImage(imgs[i].file);
            formData.append('images', compressed, compressed.name);
            // Mark each as compressed
            const previewEl = container?.children[i];
            if (previewEl) { const b = previewEl.querySelector('.img-badge'); if (b) b.textContent = '\u2713'; }
        }

        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        const endpoint = contextKey === 'service'
            ? '/api/marketplace/services/upload-images'
            : '/api/marketplace/products/upload-images';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        return await response.json();
    }

    async _loadCategories(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        try {
            const data = await this.apiRequest('/api/marketplace/categories');
            if (data.success && data.data?.categories?.length) {
                select.innerHTML = '<option value="">Seleccionar...</option>' +
                    data.data.categories
                        .filter(c => c.is_active !== false)
                        .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))
                        .map(c => '<option value="' + this.escapeHtml(c.category_id) + '">' +
                            this.escapeHtml((c.icon || '') + ' ' + (c.name_es || c.name)) + '</option>')
                        .join('');
            }
        } catch {
            // Keep fallback options if API fails
        }
    }

    _setupDropzone(dropzoneId, fileInputId, contextKey) {
        const dropzone = document.getElementById(dropzoneId);
        const fileInput = document.getElementById(fileInputId);
        if (!dropzone || !fileInput) return;

        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            this._handleImageSelect(e.target.files, contextKey);
            fileInput.value = '';
        });
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                this._handleImageSelect(e.dataTransfer.files, contextKey);
            }
        });
    }

    // =============================================
    // Create Service Modal
    // =============================================

    openCreateServiceModal() {
        document.getElementById('serviceCreateOverlay')?.remove();
        if (!this._images) this._images = {};
        this._images.service = [];

        const overlay = document.createElement('div');
        overlay.className = 'store-edit-overlay ds-overlay';
        overlay.id = 'serviceCreateOverlay';
        overlay.innerHTML = `
            <div class="store-edit-modal">
                <div class="store-edit-header">
                    <h3>Nuevo Servicio</h3>
                    <button data-action="close-create-service">&times;</button>
                </div>
                <div class="store-create-form">
                    <div class="store-form-group">
                        <label>Categoria *</label>
                        <select id="csCategory"></select>
                    </div>
                    <div class="store-form-group">
                        <label>Titulo del Servicio *</label>
                        <input type="text" id="csTitle" maxlength="200" placeholder="Ej: Reparacion de computadoras a domicilio">
                    </div>
                    <div class="store-form-group">
                        <label>Descripcion Corta</label>
                        <input type="text" id="csShortDesc" maxlength="160" placeholder="Resumen en una linea (max 160 caracteres)">
                    </div>
                    <div class="store-form-row">
                        <div class="store-form-group">
                            <label>Tipo de Precio *</label>
                            <select id="csPriceType">
                                <option value="fixed">Precio Fijo</option>
                                <option value="hourly">Por Hora</option>
                                <option value="quote">Negociable</option>
                                <option value="free">Gratis</option>
                            </select>
                        </div>
                        <div class="store-form-group" id="csCurrencyGroup">
                            <label>Moneda</label>
                            <select id="csCurrency">
                                <option value="HNL" selected>HNL (Lempiras)</option>
                                <option value="USD">USD (Dolares)</option>
                                <option value="LTD">LTD (Tokens)</option>
                            </select>
                        </div>
                    </div>
                    <div class="store-form-row" id="csPriceRow">
                        <div class="store-form-group">
                            <label>Precio *</label>
                            <input type="number" id="csPrice" min="0" max="1000000" step="0.01" placeholder="0.00">
                        </div>
                        <div class="store-form-group">
                            <label>Precio Maximo (opcional)</label>
                            <input type="number" id="csPriceMax" min="0" max="1000000" step="0.01" placeholder="Para rangos">
                        </div>
                        <div class="store-form-group">
                            <label>Duracion (hrs)</label>
                            <input type="number" id="csDuration" min="0.5" max="720" step="0.5" value="1">
                        </div>
                    </div>
                    <div class="store-form-group">
                        <label>Descripcion Completa *</label>
                        <textarea id="csDescription" rows="4" maxlength="2000" placeholder="Describe tu servicio en detalle: que incluye, experiencia, garantias..."></textarea>
                    </div>
                    <div class="store-form-group">
                        <label>Imagenes (max. 5)</label>
                        <div class="store-image-dropzone" id="serviceDropzone">
                            <input type="file" id="serviceFileInput" accept="image/jpeg,image/png,image/webp,image/gif" multiple style="display:none">
                            <div class="store-image-dropzone-icon">&#128247;</div>
                            <div class="store-image-dropzone-text">Haz clic o arrastra imagenes aqui</div>
                            <div class="store-image-dropzone-hint">JPEG, PNG, WebP o GIF \u2014 Max 5MB. Recomendado: 800x600px o mayor.</div>
                        </div>
                        <div class="store-image-previews" id="serviceImagePreviews"></div>
                    </div>
                    <div class="store-form-group">
                        <label>Etiquetas (separadas por coma)</label>
                        <input type="text" id="csTags" placeholder="Ej: rapido, profesional, garantizado">
                    </div>
                    <div class="store-form-actions">
                        <button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="close-create-service">Cancelar</button>
                        <button class="btn btn-primary ds-btn ds-btn-primary" data-action="submit-service">&#128736; Publicar Servicio</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this._loadCategories('csCategory');
        this._setupDropzone('serviceDropzone', 'serviceFileInput', 'service');

        // Price type toggle
        const priceTypeSelect = overlay.querySelector('#csPriceType');
        if (priceTypeSelect) {
            priceTypeSelect.addEventListener('change', () => {
                const hidden = (priceTypeSelect.value === 'quote' || priceTypeSelect.value === 'free');
                const priceRow = document.getElementById('csPriceRow');
                const currencyGroup = document.getElementById('csCurrencyGroup');
                if (priceRow) priceRow.style.display = hidden ? 'none' : '';
                if (currencyGroup) currencyGroup.style.display = hidden ? 'none' : '';
            });
        }

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    async handleCreateService() {
        const overlay = document.getElementById('serviceCreateOverlay');
        if (!overlay) return;
        const submitBtn = overlay.querySelector('[data-action="submit-service"]');
        if (!submitBtn) return;
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>&#9203;</span> Publicando...';

            const getVal = (id) => (overlay.querySelector('#' + id)?.value || '').trim();
            const priceType = getVal('csPriceType');
            const tags = getVal('csTags').split(',').map(t => t.trim()).filter(t => t);

            const formData = {
                title: getVal('csTitle'),
                category_id: getVal('csCategory'),
                price_type: priceType,
                price: (priceType === 'quote' || priceType === 'free') ? null : (parseFloat(getVal('csPrice')) || null),
                price_max: parseFloat(getVal('csPriceMax')) || null,
                currency: getVal('csCurrency') || 'HNL',
                duration_hours: parseFloat(getVal('csDuration')) || 1,
                short_description: getVal('csShortDesc'),
                description: getVal('csDescription'),
                tags: tags
            };

            if (!formData.title || !formData.category_id || !formData.description) {
                this.showNotification(t('forms.complete_all_required',{defaultValue:'Por favor completa todos los campos requeridos'}), 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            if (formData.title.length > 200) {
                this.showNotification('El titulo no puede exceder 200 caracteres', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            if ((priceType === 'fixed' || priceType === 'hourly') && (!formData.price || formData.price <= 0)) {
                this.showNotification('Ingresa un precio valido', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            if (formData.price && (formData.price < 0 || formData.price > 1000000)) {
                this.showNotification('Precio invalido (0 - 1,000,000)', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            // Upload images if any
            if (this._images?.service?.length) {
                const uploadResult = await this._uploadImages('service');
                if (uploadResult && uploadResult.success && uploadResult.data?.images) {
                    formData.images = uploadResult.data.images.map(img => img.url);
                }
            }

            const response = await this.apiRequest('/api/marketplace/services', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response.success) {
                overlay.remove();
                this._images.service = [];
                this.showNotification('Servicio publicado exitosamente', 'success');
                this.loadMyStore();
            } else {
                this.showNotification(t('marketplace.create_service_error',{defaultValue:'Error al crear servicio'}), 'error');
            }
        } catch (error) {
            this.showNotification(t('marketplace.create_service_error',{defaultValue:'Error al crear servicio'}), 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    }

    // =============================================
    // Create Product Modal
    // =============================================

    openCreateProductModal() {
        document.getElementById('productCreateOverlay')?.remove();
        if (!this._images) this._images = {};
        this._images.product = [];

        const overlay = document.createElement('div');
        overlay.className = 'store-edit-overlay ds-overlay';
        overlay.id = 'productCreateOverlay';
        overlay.innerHTML = `
            <div class="store-edit-modal">
                <div class="store-edit-header">
                    <h3>Nuevo Producto</h3>
                    <button data-action="close-create-product">&times;</button>
                </div>
                <div class="store-create-form">
                    <div class="store-form-row">
                        <div class="store-form-group">
                            <label>Categoria *</label>
                            <select id="cpCategory"></select>
                        </div>
                        <div class="store-form-group">
                            <label>Condicion *</label>
                            <select id="cpCondition">
                                <option value="new">Nuevo</option>
                                <option value="like_new">Como Nuevo</option>
                                <option value="used">Usado</option>
                                <option value="refurbished">Regular</option>
                            </select>
                        </div>
                    </div>
                    <div class="store-form-group">
                        <label>Nombre del Producto *</label>
                        <input type="text" id="cpTitle" maxlength="200" placeholder="Ej: iPhone 14 Pro Max 256GB">
                    </div>
                    <div class="store-form-row">
                        <div class="store-form-group">
                            <label>Precio *</label>
                            <input type="number" id="cpPrice" min="0" max="1000000" step="0.01" placeholder="0.00">
                        </div>
                        <div class="store-form-group">
                            <label>Moneda</label>
                            <select id="cpCurrency">
                                <option value="HNL" selected>HNL</option>
                                <option value="USD">USD</option>
                                <option value="LTD">LTD</option>
                            </select>
                        </div>
                        <div class="store-form-group">
                            <label>Cantidad *</label>
                            <input type="number" id="cpQuantity" min="1" max="10000" value="1">
                        </div>
                    </div>
                    <div class="store-form-group">
                        <label>Ubicacion</label>
                        <input type="text" id="cpLocation" placeholder="Ej: Tegucigalpa">
                    </div>
                    <div class="store-form-group">
                        <label>Descripcion *</label>
                        <textarea id="cpDescription" rows="3" maxlength="2000" placeholder="Describe tu producto: caracteristicas, estado, incluye..."></textarea>
                    </div>
                    <div class="store-form-group">
                        <label>Imagenes (max. 5)</label>
                        <div class="store-image-dropzone" id="productDropzone">
                            <input type="file" id="productFileInput" accept="image/jpeg,image/png,image/webp,image/gif" multiple style="display:none">
                            <div class="store-image-dropzone-icon">&#128247;</div>
                            <div class="store-image-dropzone-text">Haz clic o arrastra imagenes aqui</div>
                            <div class="store-image-dropzone-hint">JPEG, PNG, WebP o GIF \u2014 Max 5MB. Recomendado: 800x600px o mayor.</div>
                        </div>
                        <div class="store-image-previews" id="productImagePreviews"></div>
                    </div>
                    <div class="store-form-toggle">
                        <label>
                            <input type="checkbox" id="cpShipping" style="width:18px;height:18px;">
                            <span>Ofrezco envio a domicilio</span>
                        </label>
                        <div id="cpShippingPriceGroup" style="display:none;margin-top:10px;">
                            <label style="font-size:13px;color:#94a3b8;">Costo de envio</label>
                            <input type="number" id="cpShippingPrice" min="0" step="0.01" placeholder="0.00" style="width:150px;">
                        </div>
                    </div>
                    <div class="store-form-referral">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                            <span style="font-size:18px;">&#128176;</span>
                            <span style="font-weight:500;font-size:14px;">Programa de Referidos</span>
                        </div>
                        <p style="font-size:12px;color:#94a3b8;margin:0 0 10px;">
                            Otros usuarios ganan comision por cada venta que refieran.
                        </p>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <label style="margin:0;font-size:13px;">Comision:</label>
                            <select id="cpCommission" style="width:90px;">
                                <option value="2">2%</option>
                                <option value="3">3%</option>
                                <option value="5" selected>5%</option>
                                <option value="8">8%</option>
                                <option value="10">10%</option>
                                <option value="15">15%</option>
                            </select>
                            <span style="font-size:11px;color:#64748b;">del precio de venta</span>
                        </div>
                    </div>
                    <div class="store-form-actions">
                        <button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="close-create-product">Cancelar</button>
                        <button class="btn btn-primary ds-btn ds-btn-primary" data-action="submit-product">&#128230; Publicar Producto</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this._loadCategories('cpCategory');
        this._setupDropzone('productDropzone', 'productFileInput', 'product');

        // Shipping toggle
        const shippingCheckbox = overlay.querySelector('#cpShipping');
        if (shippingCheckbox) {
            shippingCheckbox.addEventListener('change', () => {
                const group = document.getElementById('cpShippingPriceGroup');
                if (group) group.style.display = shippingCheckbox.checked ? 'block' : 'none';
            });
        }

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    // ===================== EDIT PRODUCT MODAL =====================
    openEditProductModal(productId) {
        document.getElementById('productEditOverlay')?.remove();
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const overlay = document.createElement('div');
        overlay.id = 'productEditOverlay';
        overlay.className = 'store-edit-overlay ds-overlay';
        overlay.innerHTML = `<div class="store-edit-modal">
            <div class="store-edit-modal-header"><h3>Editar Producto</h3><button data-action="close-edit-product" class="store-edit-close">&times;</button></div>
            <div class="store-create-form" id="editProductForm">
                <div class="store-form-loading" id="epLoading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        this._loadEditProductData(productId);
    }

    async _loadEditProductData(productId) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        try {
            const res = await this.apiRequest(`/api/marketplace/products/${productId}`);
            if (!res.success) throw new Error('No encontrado');
            const p = res.data.product || res.data;
            const form = document.getElementById('editProductForm');
            if (!form) return;
            const images = Array.isArray(p.images) ? p.images : [];
            const imgPreviews = images.map((img, i) => {
                const url = typeof img === 'object' ? img.url : img;
                return `<div class="store-image-preview"><img src="${esc(url)}" alt=""><button class="store-image-remove" data-action="remove-edit-product-image" data-index="${i}">&times;</button></div>`;
            }).join('');
            form.innerHTML = `
                <div class="store-form-group"><label>Titulo *</label><input type="text" id="epTitle" maxlength="200" value="${esc(p.title || '')}"></div>
                <div class="store-form-row">
                    <div class="store-form-group"><label>Categoria</label><select id="epCategory"></select></div>
                    <div class="store-form-group"><label>Condicion</label><select id="epCondition"><option value="new"${p.condition === 'new' ? ' selected' : ''}>Nuevo</option><option value="like_new"${p.condition === 'like_new' ? ' selected' : ''}>Como nuevo</option><option value="used"${p.condition === 'used' ? ' selected' : ''}>Usado</option></select></div>
                </div>
                <div class="store-form-row">
                    <div class="store-form-group"><label>Precio *</label><input type="number" id="epPrice" min="0" max="1000000" step="0.01" value="${esc(String(p.price || ''))}"></div>
                    <div class="store-form-group"><label>Moneda</label><select id="epCurrency"><option value="HNL"${p.currency === 'HNL' ? ' selected' : ''}>HNL</option><option value="USD"${p.currency === 'USD' ? ' selected' : ''}>USD</option><option value="LTD"${p.currency === 'LTD' ? ' selected' : ''}>LTD</option></select></div>
                    <div class="store-form-group"><label>Cantidad *</label><input type="number" id="epQuantity" min="0" max="10000" value="${esc(String(p.quantity || 0))}"></div>
                </div>
                <div class="store-form-group"><label>Ubicacion</label><input type="text" id="epLocation" maxlength="100" value="${esc(p.location || '')}"></div>
                <div class="store-form-group"><label>Descripcion *</label><textarea id="epDescription" rows="4" maxlength="2000">${esc(p.description || '')}</textarea></div>
                <div class="store-form-group"><label>Imagenes actuales</label><div class="store-image-previews" id="epImagePreviews">${imgPreviews}</div>
                    <div class="store-image-dropzone" id="editProductDropzone"><input type="file" id="editProductFileInput" accept="image/jpeg,image/png,image/webp" multiple style="display:none"><div class="store-image-dropzone-text">Agregar mas imagenes</div></div>
                </div>
                <div class="store-form-row">
                    <div class="store-form-group"><label><input type="checkbox" id="epShipping"${p.shipping_available ? ' checked' : ''}> Envio disponible</label></div>
                    <div class="store-form-group" id="epShippingPriceGroup" style="display:${p.shipping_available ? 'block' : 'none'}"><label>Precio envio</label><input type="number" id="epShippingPrice" min="0" step="0.01" value="${esc(String(p.shipping_price || ''))}"></div>
                </div>
                <div class="store-form-group"><label>Comision referido (%)</label><select id="epReferral"><option value="0"${(!p.referral_commission_percent || p.referral_commission_percent == 0) ? ' selected' : ''}>Sin comision</option><option value="2"${p.referral_commission_percent == 2 ? ' selected' : ''}>2%</option><option value="5"${p.referral_commission_percent == 5 ? ' selected' : ''}>5%</option><option value="10"${p.referral_commission_percent == 10 ? ' selected' : ''}>10%</option><option value="15"${p.referral_commission_percent == 15 ? ' selected' : ''}>15%</option></select></div>
                <input type="hidden" id="epProductId" value="${esc(String(productId))}">
                <input type="hidden" id="epExistingImages" value='${JSON.stringify(images).replace(/'/g, "&#39;")}'>
                <div class="store-form-actions">
                    <button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="close-edit-product">Cancelar</button>
                    <button class="btn btn-primary ds-btn ds-btn-primary" data-action="submit-edit-product"><i class="fas fa-save"></i> Guardar Cambios</button>
                </div>`;
            this._setupDropzone('editProductDropzone', 'editProductFileInput', 'editProduct');
            // Load categories and pre-select current (M7 fix)
            this._loadCategories('epCategory').then(() => {
                const sel = document.getElementById('epCategory');
                if (sel && p.category_id) sel.value = String(p.category_id);
            });
            const shipCb = document.getElementById('epShipping');
            if (shipCb) shipCb.addEventListener('change', () => {
                const g = document.getElementById('epShippingPriceGroup');
                if (g) g.style.display = shipCb.checked ? 'block' : 'none';
            });
        } catch (err) {
            const form = document.getElementById('editProductForm');
            if (form) form.innerHTML = '<div class="sd-empty"><div class="sd-empty-title">Error al cargar producto</div></div>';
        }
    }

    async handleEditProduct() {
        const productId = document.getElementById('epProductId')?.value;
        const title = document.getElementById('epTitle')?.value?.trim();
        const price = parseFloat(document.getElementById('epPrice')?.value);
        const quantity = parseInt(document.getElementById('epQuantity')?.value);
        const description = document.getElementById('epDescription')?.value?.trim();
        if (!title || !price || isNaN(quantity) || !description) {
            this.showNotification(t('forms.complete_required',{defaultValue:'Completa los campos obligatorios'}), 'error');
            return;
        }
        let images = [];
        try { images = JSON.parse(document.getElementById('epExistingImages')?.value || '[]'); } catch(e) { console.warn('Error parsing product images:', e.message); }
        if (this._editProductImages?.length) {
            const uploaded = await this._uploadImages(this._editProductImages, 'product');
            if (uploaded) images = images.concat(uploaded);
        }
        try {
            const res = await this.apiRequest(`/api/marketplace/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title, description, price, quantity,
                    category_id: document.getElementById('epCategory')?.value || null,
                    currency: document.getElementById('epCurrency')?.value || 'HNL',
                    condition: document.getElementById('epCondition')?.value || 'new',
                    location: document.getElementById('epLocation')?.value?.trim() || null,
                    images,
                    shipping_available: document.getElementById('epShipping')?.checked || false,
                    shipping_price: parseFloat(document.getElementById('epShippingPrice')?.value) || 0,
                    referral_commission_percent: parseInt(document.getElementById('epReferral')?.value) || 0
                })
            });
            if (res.success) {
                document.getElementById('productEditOverlay')?.remove();
                this.showNotification('Producto actualizado', 'success');
                this.loadMyStore();
            } else {
                this.showNotification(t('messages.update_error',{defaultValue:'Error al actualizar'}), 'error');
            }
        } catch (err) {
            this.showNotification('Error al actualizar producto', 'error');
        }
    }

    // ===================== EDIT SERVICE MODAL =====================
    openEditServiceModal(serviceId) {
        document.getElementById('serviceEditOverlay')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'serviceEditOverlay';
        overlay.className = 'store-edit-overlay ds-overlay';
        overlay.innerHTML = `<div class="store-edit-modal">
            <div class="store-edit-modal-header"><h3>Editar Servicio</h3><button data-action="close-edit-service" class="store-edit-close">&times;</button></div>
            <div class="store-create-form" id="editServiceForm">
                <div class="store-form-loading" id="esLoading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        this._loadEditServiceData(serviceId);
    }

    async _loadEditServiceData(serviceId) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        try {
            const res = await this.apiRequest(`/api/marketplace/services/${serviceId}`);
            if (!res.success) throw new Error('No encontrado');
            const s = res.data.service || res.data;
            const form = document.getElementById('editServiceForm');
            if (!form) return;
            const images = Array.isArray(s.images) ? s.images : [];
            const imgPreviews = images.map((img, i) => {
                const url = typeof img === 'object' ? img.url : img;
                return `<div class="store-image-preview"><img src="${esc(url)}" alt=""><button class="store-image-remove" data-action="remove-edit-service-image" data-index="${i}">&times;</button></div>`;
            }).join('');
            const tags = Array.isArray(s.tags) ? s.tags.join(', ') : (s.tags || '');
            form.innerHTML = `
                <div class="store-form-group"><label>Titulo *</label><input type="text" id="esTitle" maxlength="200" value="${esc(s.title || '')}"></div>
                <div class="store-form-group"><label>Categoria</label><select id="esCategory"></select></div>
                <div class="store-form-group"><label>Descripcion Corta</label><input type="text" id="esShortDesc" maxlength="160" value="${esc(s.short_description || '')}"></div>
                <div class="store-form-row">
                    <div class="store-form-group"><label>Tipo de Precio *</label><select id="esPriceType"><option value="fixed"${s.price_type === 'fixed' ? ' selected' : ''}>Precio Fijo</option><option value="hourly"${s.price_type === 'hourly' ? ' selected' : ''}>Por Hora</option><option value="quote"${s.price_type === 'quote' ? ' selected' : ''}>Negociable</option><option value="free"${s.price_type === 'free' ? ' selected' : ''}>Gratis</option></select></div>
                    <div class="store-form-group"><label>Moneda</label><select id="esCurrency"><option value="HNL"${(s.currency || 'HNL') === 'HNL' ? ' selected' : ''}>HNL</option><option value="USD"${s.currency === 'USD' ? ' selected' : ''}>USD</option><option value="LTD"${s.currency === 'LTD' ? ' selected' : ''}>LTD</option></select></div>
                </div>
                <div class="store-form-row">
                    <div class="store-form-group"><label>Precio *</label><input type="number" id="esPrice" min="0" max="1000000" step="0.01" value="${esc(String(s.price || ''))}"></div>
                    <div class="store-form-group"><label>Duracion (hrs)</label><input type="number" id="esDuration" min="0.5" max="720" step="0.5" value="${esc(String(s.duration_hours || 1))}"></div>
                </div>
                <div class="store-form-group"><label>Descripcion Completa *</label><textarea id="esDescription" rows="4" maxlength="2000">${esc(s.description || '')}</textarea></div>
                <div class="store-form-group"><label>Imagenes actuales</label><div class="store-image-previews" id="esImagePreviews">${imgPreviews}</div>
                    <div class="store-image-dropzone" id="editServiceDropzone"><input type="file" id="editServiceFileInput" accept="image/jpeg,image/png,image/webp" multiple style="display:none"><div class="store-image-dropzone-text">Agregar mas imagenes</div></div>
                </div>
                <div class="store-form-group"><label>Etiquetas (separadas por coma)</label><input type="text" id="esTags" value="${esc(tags)}"></div>
                <input type="hidden" id="esServiceId" value="${esc(String(serviceId))}">
                <input type="hidden" id="esExistingImages" value='${JSON.stringify(images).replace(/'/g, "&#39;")}'>
                <div class="store-form-actions">
                    <button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="close-edit-service">Cancelar</button>
                    <button class="btn btn-primary ds-btn ds-btn-primary" data-action="submit-edit-service"><i class="fas fa-save"></i> Guardar Cambios</button>
                </div>`;
            this._setupDropzone('editServiceDropzone', 'editServiceFileInput', 'editService');
            // Load categories and pre-select current (M8 fix)
            this._loadCategories('esCategory').then(() => {
                const sel = document.getElementById('esCategory');
                if (sel && s.category_id) sel.value = String(s.category_id);
            });
        } catch (err) {
            const form = document.getElementById('editServiceForm');
            if (form) form.innerHTML = '<div class="sd-empty"><div class="sd-empty-title">Error al cargar servicio</div></div>';
        }
    }

    async handleEditService() {
        const serviceId = document.getElementById('esServiceId')?.value;
        const title = document.getElementById('esTitle')?.value?.trim();
        const price = parseFloat(document.getElementById('esPrice')?.value);
        const description = document.getElementById('esDescription')?.value?.trim();
        if (!title || !description) {
            this.showNotification(t('forms.complete_required',{defaultValue:'Completa los campos obligatorios'}), 'error');
            return;
        }
        let images = [];
        try { images = JSON.parse(document.getElementById('esExistingImages')?.value || '[]'); } catch(e) { console.warn('Error parsing service images:', e.message); }
        if (this._editServiceImages?.length) {
            const uploaded = await this._uploadImages(this._editServiceImages, 'service');
            if (uploaded) images = images.concat(uploaded);
        }
        const tagsRaw = document.getElementById('esTags')?.value || '';
        const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
        try {
            const res = await this.apiRequest(`/api/marketplace/services/${serviceId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title, description,
                    category_id: document.getElementById('esCategory')?.value || null,
                    short_description: document.getElementById('esShortDesc')?.value?.trim() || null,
                    price_type: document.getElementById('esPriceType')?.value || 'fixed',
                    price: price || 0,
                    currency: document.getElementById('esCurrency')?.value || 'HNL',
                    duration_hours: parseFloat(document.getElementById('esDuration')?.value) || 1,
                    images, tags
                })
            });
            if (res.success) {
                document.getElementById('serviceEditOverlay')?.remove();
                this.showNotification('Servicio actualizado', 'success');
                this.loadMyStore();
            } else {
                this.showNotification(t('messages.update_error',{defaultValue:'Error al actualizar'}), 'error');
            }
        } catch (err) {
            this.showNotification('Error al actualizar servicio', 'error');
        }
    }

    // ===================== DELETE ITEM =====================
    async deleteItem(type, id) {
        const confirmed = await this.showConfirm('Eliminar este listado? Esta accion no se puede deshacer.');
        if (!confirmed) return;
        try {
            if (type === 'products') {
                const res = await this.apiRequest(`/api/marketplace/products/${id}`, { method: 'DELETE' });
                if (res.success) { this.showNotification('Producto eliminado', 'success'); this.loadMyStore(); }
                else this.showNotification(t('messages.delete_error',{defaultValue:'Error al eliminar'}), 'error');
            } else {
                const res = await this.apiRequest(`/api/marketplace/services/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'inactive' }) });
                if (res.success) { this.showNotification('Servicio desactivado', 'success'); this.loadMyStore(); }
                else this.showNotification('Error al desactivar', 'error');
            }
        } catch (err) {
            this.showNotification(t('messages.delete_error',{defaultValue:'Error al eliminar'}), 'error');
        }
    }

    // ===================== FEATURED BOOST =====================
    async openBoostModal(itemType, itemId) {
        const esc = this.escapeHtml.bind(this);
        document.getElementById('boostOverlay')?.remove();

        // Check active boosts for this item
        let activeBoosts = [];
        try {
            const res = await this.apiRequest('/api/marketplace/featured-boost/active');
            if (res.success) activeBoosts = res.data?.boosts || [];
        } catch (err) { console.warn('Error loading boosts:', err.message); }
        const current = activeBoosts.find(b => b.item_type === itemType && String(b.item_id) === String(itemId));

        // Fetch wallet balance
        let balance = 0;
        try {
            const bal = await this.apiRequest('/api/wallet/balance');
            balance = parseFloat(bal.data?.balance || bal.data?.crypto_balances?.LTD || bal.balance || 0);
        } catch (err) { console.warn('Error loading balance:', err.message); }

        const overlay = document.createElement('div');
        overlay.id = 'boostOverlay';
        overlay.className = 'boost-modal';
        overlay.innerHTML = `<div class="boost-modal-content">
            <div class="modal-header"><h2 class="modal-title"><i class="fas fa-rocket"></i> Impulsar Articulo</h2><button class="close-btn" data-action="close-boost-modal">&times;</button></div>
            <div style="padding:20px;">
                ${current ? `<div class="boost-active-badge"><i class="fas fa-check-circle"></i> Impulso activo — ${Math.ceil(parseFloat(current.remaining_days))} dias restantes</div>` : ''}
                <p style="color:rgba(255,255,255,0.7);font-size:13px;margin-bottom:16px;">Tu articulo aparecera destacado en la tienda y resultados de busqueda.</p>
                <div class="boost-tiers">
                    <div class="boost-tier-card ds-card" data-action="boost-select-tier" data-type="${esc(itemType)}" data-id="${esc(String(itemId))}" data-duration="3">
                        <div class="boost-tier-days">3 dias</div>
                        <div class="boost-tier-price">25 LTD</div>
                    </div>
                    <div class="boost-tier-card ds-card boost-tier-recommended" data-action="boost-select-tier" data-type="${esc(itemType)}" data-id="${esc(String(itemId))}" data-duration="7">
                        <div class="boost-tier-badge">Recomendado</div>
                        <div class="boost-tier-days">7 dias</div>
                        <div class="boost-tier-price">50 LTD</div>
                    </div>
                    <div class="boost-tier-card ds-card" data-action="boost-select-tier" data-type="${esc(itemType)}" data-id="${esc(String(itemId))}" data-duration="14">
                        <div class="boost-tier-days">14 dias</div>
                        <div class="boost-tier-price">100 LTD</div>
                    </div>
                </div>
                <div style="text-align:center;margin-top:12px;font-size:13px;color:rgba(255,255,255,0.5);">Saldo LTD: <strong>${balance.toFixed(2)}</strong></div>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    async _purchaseBoost(itemType, itemId, duration) {
        try {
            const res = await this.apiRequest('/api/marketplace/featured-boost', {
                method: 'POST',
                body: JSON.stringify({ item_type: itemType, item_id: parseInt(itemId), duration })
            });
            if (res.success) {
                document.getElementById('boostOverlay')?.remove();
                this.showNotification('Articulo impulsado exitosamente', 'success');
                this.loadMyStore();
            } else {
                this.showNotification(res.error || 'Error al impulsar', 'error');
            }
        } catch (err) {
            this.showNotification(err.message || 'Error al procesar el impulso', 'error');
        }
    }

    // ===================== CHAIN BALANCE =====================
    async _fetchChainBalance() {
        try {
            const res = await this.apiRequest('/api/marketplace/wallet/chain-balance');
            return res.success ? res.data : null;
        } catch { return null; }
    }

    async _linkChainAddress(address) {
        try {
            const res = await this.apiRequest('/api/marketplace/wallet/link-address', {
                method: 'PUT',
                body: JSON.stringify({ wallet_address: address })
            });
            if (res.success) {
                this.showNotification('Direccion vinculada', 'success');
                return true;
            }
            this.showNotification(res.error || 'Error al vincular', 'error');
            return false;
        } catch (err) {
            this.showNotification(err.message || 'Error al vincular', 'error');
            return false;
        }
    }

    _buildChainBalanceCard(esc) {
        return `<div class="chain-balance-card" id="chainBalanceCard">
            <div class="chain-balance-header"><i class="fas fa-link"></i> La Tanda Chain (on-chain)</div>
            <div class="chain-balance-body" id="chainBalBody">
                <div style="text-align:center;color:rgba(255,255,255,0.5);padding:12px;"><i class="fas fa-spinner fa-spin"></i> Consultando...</div>
            </div>
        </div>`;
    }

    async _loadChainBalance() {
        const body = document.getElementById('chainBalBody');
        if (!body) return;
        const data = await this._fetchChainBalance();
        const esc = this.escapeHtml.bind(this);
        if (!data || data.wallet_address === null) {
            body.innerHTML = `<div class="chain-link-form">
                <p style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:8px;">Vincula tu direccion de La Tanda Chain</p>
                <div style="display:flex;gap:8px;">
                    <input type="text" id="chainAddrInput" class="chain-link-input" placeholder="ltd1..." maxlength="59">
                    <button class="btn btn-primary ds-btn ds-btn-primary" id="chainLinkBtn" style="white-space:nowrap;padding:6px 12px;font-size:13px;">Vincular</button>
                </div>
            </div>`;
            document.getElementById('chainLinkBtn')?.addEventListener('click', async () => {
                const addr = document.getElementById('chainAddrInput')?.value?.trim();
                if (!addr) return;
                const ok = await this._linkChainAddress(addr);
                if (ok) this._loadChainBalance();
            });
        } else if (data.chain_balance === null) {
            body.innerHTML = `<div style="text-align:center;padding:8px;">
                <div class="chain-address">${esc(data.wallet_address)}</div>
                <div style="color:rgba(255,255,255,0.5);font-size:12px;">Cadena no disponible</div>
            </div>`;
        } else {
            body.innerHTML = `<div style="text-align:center;padding:8px;">
                <div style="font-size:22px;font-weight:700;color:#10B981;">${window.ltFormatNumber ? ltFormatNumber(data.chain_balance, 2) : parseFloat(data.chain_balance).toLocaleString('es-HN', { minimumFractionDigits: 2 })} LTD</div>
                <div class="chain-address">${esc(data.wallet_address)}</div>
                <button class="chain-refresh-btn" id="chainRefreshBtn" title="Actualizar"><i class="fas fa-sync-alt"></i></button>
            </div>`;
            document.getElementById('chainRefreshBtn')?.addEventListener('click', () => this._loadChainBalance());
        }
    }

    // ===================== REFERRAL DASHBOARD =====================
    _buildReferralDashboard(esc) {
        return `<div class="sd-section" id="referralDashboard">
            <div class="sd-section-header"><i class="fas fa-users"></i> Referidos</div>
            <div id="referralDashBody" style="padding:12px;text-align:center;color:rgba(255,255,255,0.5);"><i class="fas fa-spinner fa-spin"></i></div>
        </div>`;
    }

    async _loadReferralDashboard() {
        const body = document.getElementById('referralDashBody');
        if (!body) return;
        try {
            const res = await this.apiRequest('/api/marketplace/referrals/my-code');
            const stats = res.data || res;
            const code = stats.referral_code || '';
            const totalEarnings = parseFloat((parseFloat(stats.approved_earnings || 0) + parseFloat(stats.paid_earnings || 0)) || 0).toFixed(2);
            const totalConversions = parseInt(stats.total_conversions || 0);
            const pendingEarnings = parseFloat(stats.pending_earnings || 0).toFixed(2);
            const esc = this.escapeHtml.bind(this);
            body.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                    <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:10px;text-align:center;">
                        <div style="font-size:18px;font-weight:700;color:#10B981;">${totalEarnings} LTD</div>
                        <div style="font-size:11px;color:rgba(255,255,255,0.6);">Ganancias totales</div>
                    </div>
                    <div style="background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.3);border-radius:8px;padding:10px;text-align:center;">
                        <div style="font-size:18px;font-weight:700;color:#06B6D4;">${totalConversions}</div>
                        <div style="font-size:11px;color:rgba(255,255,255,0.6);">Conversiones</div>
                    </div>
                </div>
                ${code ? `<div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:10px;display:flex;align-items:center;gap:8px;">
                    <code style="flex:1;font-size:13px;color:#F59E0B;">${esc(code)}</code>
                    <button class="btn" id="copyRefCode" style="padding:4px 10px;font-size:12px;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.4);border-radius:6px;color:#F59E0B;cursor:pointer;"><i class="fas fa-copy"></i></button>
                </div>` : ''}`;
            document.getElementById('copyRefCode')?.addEventListener('click', () => {
                navigator.clipboard.writeText(code).then(() => this.showNotification('Codigo copiado', 'success')).catch(() => {});
            });
        } catch {
            body.innerHTML = '<div style="color:rgba(255,255,255,0.5);font-size:13px;">Error al cargar referidos</div>';
        }
    }

    // ===================== ORDERS TAB =====================
    _buildOrdersTab(orders, esc) {
        const statusLabels = { pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado' };
        const statusColors = { pending: 'pending', paid: 'paid', shipped: 'shipped', delivered: 'delivered', cancelled: 'cancelled', refunded: 'refunded' };
        if (!orders || orders.length === 0) {
            return `<div class="sd-empty"><div class="sd-empty-icon"><i class="fas fa-shopping-bag"></i></div><div class="sd-empty-title">No tienes pedidos aun</div><div class="sd-empty-desc">Cuando alguien compre tus productos, los veras aqui.</div></div>`;
        }
        const filterHtml = `<div class="sd-order-filter-row"><select class="sd-order-filter" data-action="filter-orders">
            <option value="all">Todos</option><option value="pending">Pendientes</option><option value="paid">Pagados</option><option value="shipped">Enviados</option><option value="delivered">Entregados</option><option value="cancelled">Cancelados</option></select></div>`;
        const cards = orders.map(o => {
            const imgSrc = o.product_images && o.product_images[0] ? (typeof o.product_images[0] === 'object' ? o.product_images[0].url : o.product_images[0]) : null;
            const imgHtml = imgSrc ? `<img src="${esc(imgSrc)}" alt="" class="sd-order-img">` : `<div class="sd-order-img sd-order-img-placeholder"><i class="fas fa-box"></i></div>`;
            const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            const statusClass = statusColors[o.status] || 'pending';
            const statusLabel = statusLabels[o.status] || esc(o.status);
            let actionsHtml = '';
            if (o.status === 'pending') {
                actionsHtml = `<button class="sd-order-btn sd-order-btn-confirm" data-action="update-order-status" data-order-id="${esc(String(o.id))}" data-new-status="paid">Confirmar Pago</button>`;
            } else if (o.status === 'paid') {
                actionsHtml = `<div class="sd-order-tracking"><input type="text" class="sd-order-tracking-input" placeholder="# Seguimiento (opcional)" data-order-id="${esc(String(o.id))}"><button class="sd-order-btn sd-order-btn-ship" data-action="update-order-status" data-order-id="${esc(String(o.id))}" data-new-status="shipped">Enviar</button></div>`;
            } else if (o.status === 'shipped') {
                actionsHtml = `<button class="sd-order-btn sd-order-btn-deliver" data-action="update-order-status" data-order-id="${esc(String(o.id))}" data-new-status="delivered">Confirmar Entrega</button>`;
            }
            return `<div class="sd-order-card" data-order-status="${esc(o.status)}">
                ${imgHtml}
                <div class="sd-order-info">
                    <div class="sd-order-product">${esc(o.product_title || 'Producto')}</div>
                    <div class="sd-order-buyer"><i class="fas fa-user"></i> ${esc(o.buyer_name || 'Comprador')}</div>
                    <div class="sd-order-date">${esc(dateStr)}</div>
                </div>
                <div class="sd-order-right">
                    <div class="sd-order-amount">${esc(String(o.quantity || 1))} x L. ${esc((window.ltFormatNumber ? ltFormatNumber(o.unit_price || 0) : String(parseFloat(o.unit_price || 0).toLocaleString('es-HN'))))}</div>
                    <div class="sd-order-total">L. ${esc((window.ltFormatNumber ? ltFormatNumber(o.total_price || 0) : String(parseFloat(o.total_price || 0).toLocaleString('es-HN'))))}</div>
                    <span class="sd-order-status sd-order-${statusClass}">${statusLabel}</span>
                </div>
                ${actionsHtml ? `<div class="sd-order-actions">${actionsHtml}</div>` : ''}
            </div>`;
        }).join('');
        return filterHtml + `<div class="sd-orders-list" id="sdOrdersList">${cards}</div>`;
    }

    async handleUpdateOrderStatus(orderId, newStatus) {
        let trackingNumber = null;
        if (newStatus === 'shipped') {
            const input = document.querySelector(`.sd-order-tracking-input[data-order-id="${orderId}"]`);
            trackingNumber = input?.value?.trim() || null;
        }
        try {
            const res = await this.apiRequest(`/api/marketplace/product-orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus, tracking_number: trackingNumber })
            });
            if (res.success) {
                this.showNotification('Estado actualizado', 'success');
                this.loadMyStore();
            } else {
                this.showNotification(t('marketplace.order_update_error',{defaultValue:'Error al actualizar pedido'}), 'error');
            }
        } catch (err) {
            this.showNotification(t('marketplace.order_update_error',{defaultValue:'Error al actualizar pedido'}), 'error');
        }
    }

    filterOrders(status) {
        const list = document.getElementById('sdOrdersList');
        if (!list) return;
        list.querySelectorAll('.sd-order-card').forEach(card => {
            if (status === 'all' || card.dataset.orderStatus === status) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // ===================== SELLER ANALYTICS =====================
    _buildRevenueChart(dailyData, esc) {
        if (!dailyData || dailyData.length === 0) {
            return `<div class="sd-chart-empty">Sin ventas en los ultimos 30 dias</div>`;
        }
        const maxRev = Math.max(...dailyData.map(d => parseFloat(d.revenue) || 0), 1);
        const bars = dailyData.map((d, i) => {
            const rev = parseFloat(d.revenue) || 0;
            const heightPct = Math.max(2, (rev / maxRev) * 100);
            const dateLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
            const showLabel = i % Math.max(1, Math.floor(dailyData.length / 6)) === 0;
            return `<div class="sd-chart-col">
                <div class="sd-chart-bar" style="height:${heightPct}%" title="L. ${window.ltFormatNumber ? ltFormatNumber(rev) : rev.toLocaleString('es-HN')} - ${dateLabel}">
                    <span class="sd-chart-tooltip">L. ${window.ltFormatNumber ? ltFormatNumber(rev) : rev.toLocaleString('es-HN')}<br>${esc(dateLabel)}</span>
                </div>
                ${showLabel ? `<span class="sd-chart-label">${esc(dateLabel)}</span>` : '<span class="sd-chart-label"></span>'}
            </div>`;
        }).join('');
        return `<div class="sd-chart">
            <div class="sd-chart-ymax">L. ${window.ltFormatNumber ? ltFormatNumber(maxRev) : maxRev.toLocaleString('es-HN')}</div>
            <div class="sd-chart-bars">${bars}</div>
        </div>`;
    }

    _buildTopProductsTable(products, esc) {
        if (!products || products.length === 0 || products.every(p => parseInt(p.total_orders) === 0)) {
            return `<div class="sd-chart-empty">Sin productos vendidos aun</div>`;
        }
        const rankColors = ['sd-top-rank-1', 'sd-top-rank-2', 'sd-top-rank-3'];
        const rows = products.filter(p => parseInt(p.total_orders) > 0).slice(0, 5).map((p, i) => {
            return `<tr>
                <td class="sd-top-rank ${rankColors[i] || ''}">${i + 1}</td>
                <td>${esc(p.title)}</td>
                <td>${esc(String(p.total_orders))}</td>
                <td>L. ${window.ltFormatNumber ? ltFormatNumber(p.total_revenue || 0) : parseFloat(p.total_revenue || 0).toLocaleString('es-HN')}</td>
            </tr>`;
        }).join('');
        return `<table class="sd-top-products">
            <thead><tr><th>#</th><th>Producto</th><th>Pedidos</th><th>Ingresos</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for UI interactions
function showCreateProductModal() {
    if (window.marketplaceSystem?.isGuest) {
        window.marketplaceSystem.showLoginPrompt('publicar productos');
        return;
    }
    if (window.marketplaceSystem) {
        window.marketplaceSystem.openCreateProductModal();
    }
}

function closeCreateProductModal() {
    document.getElementById('productCreateOverlay')?.remove();
}

function showCreateServiceModal() {
    if (window.marketplaceSystem?.isGuest) {
        window.marketplaceSystem.showLoginPrompt('ofrecer servicios');
        return;
    }
    if (window.marketplaceSystem) {
        window.marketplaceSystem.openCreateServiceModal();
    }
}

function closeCreateServiceModal() {
    document.getElementById('serviceCreateOverlay')?.remove();
}

async function viewProduct(productId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;
    const esc = (v) => ms.escapeHtml(String(v ?? ''));
    try {
        const resp = await ms.apiRequest('/api/marketplace/products/' + encodeURIComponent(productId));
        const p = resp?.data?.product || resp?.product || resp?.data;
        if (!p) { ms.showNotification(t('marketplace.product_not_found',{defaultValue:'Producto no encontrado'}), 'error'); return; }

        // Parse images
        let imgs = p.images || [];
        if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch { imgs = []; } }
        if (!Array.isArray(imgs)) imgs = [];
        const validProdImgs = imgs.map(i => typeof i === 'object' ? i.url : i).filter(u => u && (u.startsWith('/') || u.startsWith('http'))); const mainImg = validProdImgs.length > 0 ? validProdImgs[0] : null;

        const condMap = { new: 'Nuevo', used: 'Usado', like_new: 'Como nuevo', refurbished: 'Reacondicionado', good: 'Bueno', acceptable: 'Aceptable' };
        const condLabel = condMap[p.condition] || '';
        const stockColor = (p.quantity > 0) ? '#10B981' : '#EF4444';
        const stockLabel = (p.quantity > 0) ? (p.quantity + ' disponible' + (p.quantity > 1 ? 's' : '')) : 'Agotado';
        const price = (window.ltFormatCurrency ? ltFormatCurrency(Number(p.price || 0)) : (window.ltFormatCurrency ? ltFormatCurrency(p.price || 0) : 'L. ' + Number(p.price || 0).toLocaleString('es-HN')));
        const sellerName = esc(p.seller_name || p.seller?.name || 'Vendedor');

        // Gallery thumbnails
        const gallery = imgs.length > 1 ? '<div style="display:flex;gap:6px;margin-top:8px;overflow-x:auto;">' +
            imgs.map((img, i) => {
                const src = typeof img === 'object' ? img.url : img;
                return '<img src="' + esc(src) + '" style="width:52px;height:52px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid ' + (i === 0 ? 'var(--mp-orange,#FF6B35)' : 'transparent') + ';" onclick="this.closest(\'.vp-modal\').querySelector(\'.vp-main-img\').src=this.src" loading="lazy">';
            }).join('') + '</div>' : '';

        const existing = document.getElementById('vpOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'vpOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:16px;';
        overlay.innerHTML = '<div class="vp-modal" style="background:#1a1f2e;border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;border:1px solid rgba(255,255,255,0.1);">' +
            '<div style="position:relative;">' +
                (mainImg ? '<img class="vp-main-img" src="' + esc(mainImg) + '" style="width:100%;height:260px;object-fit:cover;border-radius:16px 16px 0 0;">' : '<div style="width:100%;height:160px;display:flex;align-items:center;justify-content:center;font-size:64px;background:rgba(255,255,255,0.05);border-radius:16px 16px 0 0;">📦</div>') +
                '<button onclick="document.getElementById(\'vpOverlay\').remove()" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;">✕</button>' +
                (condLabel ? '<span style="position:absolute;top:12px;left:12px;background:rgba(139,92,246,0.9);color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;">' + esc(condLabel) + '</span>' : '') +
            '</div>' +
            '<div style="padding:16px;">' +
                gallery +
                '<h2 style="color:#fff;margin:12px 0 4px;font-size:18px;">' + esc(p.title || p.name) + '</h2>' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                    '<span style="color:var(--mp-orange,#FF6B35);font-size:22px;font-weight:700;">' + price + '</span>' +
                    '<span style="color:' + stockColor + ';font-size:13px;font-weight:600;">' + stockLabel + '</span>' +
                '</div>' +
                '<div style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:16px;line-height:1.5;">' + esc(p.description || '') + '</div>' +
                '<div style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(255,255,255,0.05);border-radius:10px;margin-bottom:16px;">' +
                    '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#FF6B35,#ff8c5a);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">' + sellerName.charAt(0) + '</div>' +
                    '<div><div style="color:#fff;font-size:14px;font-weight:600;">' + sellerName + '</div>' +
                    (p.seller_city ? '<div style="color:rgba(255,255,255,0.5);font-size:12px;">📍 ' + esc(p.seller_city || p.location || '') + '</div>' : '') +
                    '</div>' +
                '</div>' +
                (p.quantity > 0 ? '<div style="display:flex;gap:8px;">' +
                    '<button class="ds-btn ds-btn-primary" style="flex:1;padding:12px;font-size:15px;" onclick="document.getElementById(\'vpOverlay\').remove(); buyProduct(\'' + esc(p.id) + '\')">Comprar ahora</button>' +
                    '<button class="ds-btn ds-btn-secondary" style="padding:12px 16px;" data-action="add-to-cart" data-id="' + esc(p.id) + '"><i class="fas fa-cart-plus"></i></button>' +
                '</div>' : '<button class="ds-btn ds-btn-secondary" style="width:100%;padding:12px;opacity:0.5;" disabled>Agotado</button>') +
            '</div>' +
        '</div>';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
    } catch (err) {
        ms.showNotification('Error al cargar producto', 'error');
        console.warn('viewProduct error:', err.message);
    }
}

async function buyProduct(productId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;
    if (ms.isGuest) { ms.showLoginPrompt('comprar productos'); return; }

    const product = ms.products.find(p => String(p.id) === String(productId) || String(p.productId) === String(productId));
    if (!product) { ms.showNotification(t('marketplace.product_not_found',{defaultValue:'Producto no encontrado'}), 'error'); return; }
    if (product.quantity < 1) { ms.showNotification('Producto agotado', 'error'); return; }

    const esc = ms.escapeHtml.bind(ms);
    const maxQty = Math.min(product.quantity, 10);
    const cur = product.currency || 'HNL';
    const unitPrice = product.price;

    const existing = document.getElementById('purchaseModal');
    if (existing) existing.remove();

    const qtyOptions = Array.from({ length: maxQty }, (_, i) => i + 1)
        .map(n => `<option value="${n}">${n}</option>`).join('');

    const modal = document.createElement('div');
    modal.id = 'purchaseModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:460px;">
            <div class="modal-header">
                <h2 class="modal-title">🛒 Confirmar Compra</h2>
                <button class="close-btn" id="purchaseClose">&times;</button>
            </div>
            <div style="padding:20px;">
                <div style="display:flex;gap:16px;margin-bottom:20px;align-items:center;">
                    <div style="font-size:48px;flex-shrink:0;">${product.image || '📦'}</div>
                    <div>
                        <div style="font-size:16px;font-weight:600;">${esc(product.name)}</div>
                        <div style="color:rgba(255,255,255,0.6);font-size:13px;">${esc(product.seller.name)}</div>
                        <div style="color:#10B981;font-weight:700;font-size:18px;margin-top:4px;">${ms.formatPrice(unitPrice, cur)}</div>
                    </div>
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;margin-bottom:6px;font-weight:500;">Cantidad</label>
                    <select id="purchaseQty" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:white;">
                        ${qtyOptions}
                    </select>
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;margin-bottom:6px;font-weight:500;">Metodo de pago</label>
                    <select id="purchasePayment" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:white;">
                        <option value="wallet">Wallet LTD</option>
                        <option value="cash">Efectivo</option>
                    </select>
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;margin-bottom:6px;font-weight:500;">Notas (opcional)</label>
                    <textarea id="purchaseNotes" rows="2" placeholder="Instrucciones de entrega, etc." style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:white;resize:vertical;"></textarea>
                </div>
                <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:14px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:13px;color:rgba(255,255,255,0.7);">Total</div>
                    <div id="purchaseTotal" style="font-size:28px;font-weight:700;color:#10B981;">${ms.formatPrice(unitPrice, cur)}</div>
                    <div id="purchaseCommission" class="mc-commission-line" style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;"></div>
                </div>
                <div style="display:flex;gap:12px;">
                    <button class="btn btn-secondary ds-btn ds-btn-secondary" id="purchaseAddCartBtn" style="flex:1;"><i class="fas fa-cart-plus"></i> Al Carrito</button>
                    <button class="btn btn-primary ds-btn ds-btn-primary" id="purchaseConfirmBtn" style="flex:1;">Comprar Ahora</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const totalEl = document.getElementById('purchaseTotal');
    const commEl = document.getElementById('purchaseCommission');
    const qtyEl = document.getElementById('purchaseQty');
    // Show platform commission info
    const sellerTier = ms.userSubscription || 'free';
    const commPercent = getTierLimitsClient(sellerTier).platform_commission || 0;
    function updateCommissionDisplay() {
        const total = unitPrice * parseInt(qtyEl.value);
        totalEl.textContent = ms.formatPrice(total, cur);
        if (commPercent > 0) {
            const fee = Math.round(total * commPercent) / 100;
            commEl.textContent = 'Comision de plataforma: ' + commPercent + '% (L. ' + fee.toFixed(2) + ')';
        } else {
            commEl.innerHTML = '<span class="mc-commission-zero">Sin comision</span>';
        }
    }
    updateCommissionDisplay();
    qtyEl.addEventListener('change', updateCommissionDisplay);

    const closeModal = () => modal.remove();
    document.getElementById('purchaseClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Add to cart button
    document.getElementById('purchaseAddCartBtn').addEventListener('click', () => {
        const qty = parseInt(qtyEl.value) || 1;
        ms._addToCart(product, qty);
        closeModal();
    });

    document.getElementById('purchaseConfirmBtn').addEventListener('click', async () => {
        const confirmBtn = document.getElementById('purchaseConfirmBtn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Procesando...';

        try {
            const apiId = product.productId || product.id;
            const response = await ms.apiRequest(`/api/marketplace/products/${encodeURIComponent(apiId)}/buy`, {
                method: 'POST',
                body: JSON.stringify({
                    product_id: apiId,
                    quantity: parseInt(qtyEl.value),
                    payment_method: document.getElementById('purchasePayment').value,
                    notes: document.getElementById('purchaseNotes').value.trim()
                })
            });

            if (response.success || response.order) {
                closeModal();
                ms.showNotification('Compra realizada exitosamente', 'success');
                ms.loadMarketplaceData();
            } else {
                throw new Error(response.error || 'Error al procesar compra');
            }
        } catch (err) {
            ms.showNotification(err.message || 'Error al procesar la compra', 'error');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirmar Compra';
        }
    });
}

function toggleLike(postId) {
    if (window.marketplaceSystem?.isGuest) {
        window.marketplaceSystem.showLoginPrompt('dar like');
        return;
    }
    window.marketplaceSystem?.showNotification(t('messages.coming_soon',{defaultValue:'Funcion disponible proximamente'}), 'info');
}

function showComments(postId) {
    window.marketplaceSystem?.showNotification(t('messages.coming_soon',{defaultValue:'Funcion disponible proximamente'}), 'info');
}

function sharePost(postId) {
    window.marketplaceSystem?.showNotification(t('messages.coming_soon',{defaultValue:'Funcion disponible proximamente'}), 'info');
}

// Service-related global functions
async function viewService(serviceId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;
    const esc = (v) => ms.escapeHtml(String(v ?? ''));
    try {
        const resp = await ms.apiRequest('/api/marketplace/services/' + encodeURIComponent(serviceId));
        const s = resp?.data?.service || resp?.service || resp?.data;
        if (!s) { ms.showNotification(t('marketplace.service_not_found',{defaultValue:'Servicio no encontrado'}), 'error'); return; }

        let imgs = s.images || [];
        if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch { imgs = []; } }
        if (!Array.isArray(imgs)) imgs = [];
        const mainImg = imgs.length > 0 ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : null;

        const priceLabel = s.price_type === 'fixed' ? ((window.ltFormatCurrency ? ltFormatCurrency(Number(s.price || 0)) : (window.ltFormatCurrency ? ltFormatCurrency(s.price || 0) : 'L. ' + Number(s.price || 0).toLocaleString('es-HN'))))
            : s.price_type === 'range' ? ((window.ltFormatCurrency ? ltFormatCurrency(Number(s.price || 0)) : (window.ltFormatCurrency ? ltFormatCurrency(s.price || 0) : 'L. ' + Number(s.price || 0).toLocaleString('es-HN'))) + ' - ' + Number(s.price_max || 0).toLocaleString('es-HN'))
            : s.price_type === 'hourly' ? ((window.ltFormatCurrency ? ltFormatCurrency(Number(s.price || 0)) : (window.ltFormatCurrency ? ltFormatCurrency(s.price || 0) : 'L. ' + Number(s.price || 0).toLocaleString('es-HN'))) + '/hora')
            : 'Consultar';
        const provName = esc(s.provider_name || s.provider?.name || 'Proveedor');
        const rating = s.avg_rating ? ('⭐ ' + Number(s.avg_rating).toFixed(1) + ' (' + (s.total_reviews || 0) + ')') : 'Sin resenas';
        const duration = s.duration_minutes ? (s.duration_minutes + ' min') : '';

        const existing = document.getElementById('vsOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'vsOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:16px;';
        overlay.innerHTML = '<div style="background:#1a1f2e;border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;border:1px solid rgba(255,255,255,0.1);">' +
            '<div style="position:relative;">' +
                (function() {
                    var validImgs = imgs.map(function(i) { return typeof i === 'object' ? i.url : i; }).filter(function(u) { return u && (u.startsWith('/') || u.startsWith('http')); });
                    if (validImgs.length > 1) {
                        return '<div style="position:relative;overflow:hidden;border-radius:16px 16px 0 0;" id="vsCarousel" data-current="0" data-total="' + validImgs.length + '">' +
                            '<div style="display:flex;transition:transform 0.3s;" class="vs-track">' + validImgs.map(function(u) { return '<img src="' + esc(u) + '" style="min-width:100%;height:260px;object-fit:cover;">'; }).join('') + '</div>' +
                            '<button onclick="var c=document.getElementById(\'vsCarousel\');var t=parseInt(c.dataset.total);var cur=(parseInt(c.dataset.current)-1+t)%t;c.dataset.current=cur;c.querySelector(\'.vs-track\').style.transform=\'translateX(-\'+cur*100+\'%)\';c.querySelector(\'.vs-counter\').textContent=(cur+1)+\'/\'+t;" style="position:absolute;top:50%;left:8px;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.5);border:none;color:#fff;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">‹</button>' +
                            '<button onclick="var c=document.getElementById(\'vsCarousel\');var t=parseInt(c.dataset.total);var cur=(parseInt(c.dataset.current)+1)%t;c.dataset.current=cur;c.querySelector(\'.vs-track\').style.transform=\'translateX(-\'+cur*100+\'%)\';c.querySelector(\'.vs-counter\').textContent=(cur+1)+\'/\'+t;" style="position:absolute;top:50%;right:8px;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.5);border:none;color:#fff;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">›</button>' +
                            '<span class="vs-counter" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.5);color:#fff;padding:2px 8px;border-radius:6px;font-size:12px;">1/' + validImgs.length + '</span>' +
                        '</div>';
                    } else if (mainImg) {
                        return '<img src="' + esc(mainImg) + '" style="width:100%;height:260px;object-fit:cover;border-radius:16px 16px 0 0;">';
                    } else {
                        return '<div style="width:100%;height:120px;display:flex;align-items:center;justify-content:center;font-size:54px;background:rgba(255,255,255,0.05);border-radius:16px 16px 0 0;">🛠️</div>';
                    }
                })() +
                '<button onclick="document.getElementById(\'vsOverlay\').remove()" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;">✕</button>' +
            '</div>' +
            '<div style="padding:16px;">' +
                '<h2 style="color:#fff;margin:0 0 6px;font-size:18px;">' + esc(s.title) + '</h2>' +
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">' +
                    '<span style="color:var(--mp-orange,#FF6B35);font-size:20px;font-weight:700;">' + priceLabel + '</span>' +
                    (duration ? '<span style="color:rgba(255,255,255,0.5);font-size:13px;">⏱ ' + duration + '</span>' : '') +
                    '<span style="color:rgba(255,255,255,0.5);font-size:13px;">' + rating + '</span>' +
                '</div>' +
                (s.short_description ? '<div style="color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:8px;">' + esc(s.short_description) + '</div>' : '') +
                '<div style="color:rgba(255,255,255,0.5);font-size:13px;margin-bottom:16px;line-height:1.5;">' + esc(s.description || '') + '</div>' +
                (s.tags ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">' + (Array.isArray(s.tags) ? s.tags : []).map(t => '<span style="background:rgba(255,107,53,0.15);color:#FF6B35;padding:3px 10px;border-radius:12px;font-size:12px;">' + esc(t) + '</span>').join('') + '</div>' : '') +
                '<div style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(255,255,255,0.05);border-radius:10px;margin-bottom:16px;">' +
                    '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#FF6B35,#ff8c5a);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">' + provName.charAt(0) + '</div>' +
                    '<div style="color:#fff;font-size:14px;font-weight:600;">' + provName + '</div>' +
                '</div>' +
                (function() {
                    var ctaLabel, ctaIcon, ctaOnclick;
                    if (s.price_type === 'fixed') { ctaLabel = '🤝 Contratar'; ctaOnclick = "document.getElementById('vsOverlay').remove(); bookService(" + parseInt(serviceId) + ")"; }
                    else if (s.price_type === 'hourly' || s.price_type === 'quote' || s.price_type === 'negotiable') { ctaLabel = '📋 Solicitar Cotizacion'; ctaOnclick = "document.getElementById('vsOverlay').remove(); if(window.marketplaceSystem) window.marketplaceSystem.openMessageModal && window.marketplaceSystem.openMessageModal()"; }
                    else if (s.price_type === 'free') { ctaLabel = '📅 Agendar'; ctaOnclick = "document.getElementById('vsOverlay').remove(); bookService(" + parseInt(serviceId) + ")"; }
                    else { ctaLabel = '✉️ Contactar'; ctaOnclick = "document.getElementById('vsOverlay').remove(); if(window.marketplaceSystem) window.marketplaceSystem.openMessageModal && window.marketplaceSystem.openMessageModal()"; }
                    return '<button class="ds-btn ds-btn-primary" style="width:100%;padding:12px;font-size:15px;" onclick="' + ctaOnclick + '">' + ctaLabel + '</button>';
                })() +
            '</div>' +
        '</div>';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
    } catch (err) {
        ms.showNotification('Error al cargar servicio', 'error');
        console.warn('viewService error:', err.message);
    }
}

function bookService(serviceId) {
    if (window.marketplaceSystem) {
        window.marketplaceSystem.openBookingModal(serviceId);
    }
}

function closeBookingModal() {
    document.getElementById('bookingModal')?.classList.remove('active');
}

function submitBooking() {
    if (window.marketplaceSystem) {
        window.marketplaceSystem.submitBooking();
    }
}

function confirmBooking(bookingId) {
    window.marketplaceSystem?.showNotification('El proveedor confirmará la reserva', 'info');
}

async function cancelBooking(bookingId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;

    const confirmed = await ms.showConfirm('¿Estas seguro de que deseas cancelar esta reserva?', 'Cancelar reserva', 'Volver');
    if (!confirmed) return;

    try {
        const response = await ms.apiRequest(`/api/marketplace/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'cancelled',
                cancellation_reason: 'Cancelado por el cliente'
            })
        });

        if (response?.success) {
            ms.showNotification('Reserva cancelada exitosamente', 'success');
            ms.loadBookingsData();
        } else {
            throw new Error(response?.error || 'Error al cancelar');
        }
    } catch (error) {
        ms.showNotification('Error al cancelar la reserva', 'error');
    }
}

async function rescheduleBooking(bookingId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;

    const booking = ms.bookings?.find(b => String(b.id) === String(bookingId));
    if (!booking) { ms.showNotification(t('marketplace.booking_not_found',{defaultValue:'Reserva no encontrada'}), 'error'); return; }

    const confirmed = await ms.showConfirm(
        'Se cancelara la reserva actual y podras crear una nueva con diferente fecha/hora.',
        'Reprogramar', 'Volver'
    );
    if (!confirmed) return;

    try {
        const response = await ms.apiRequest(`/api/marketplace/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'cancelled',
                cancellation_reason: 'Reprogramado por cliente'
            })
        });

        if (response?.success) {
            ms.showNotification('Reserva cancelada. Selecciona nueva fecha.', 'info');
            await ms.loadBookingsData();
            // Find matching service in services list
            const service = ms.services?.find(s => String(s.serviceId) === String(booking.serviceId));
            if (service) {
                ms.openBookingModal(service.id);
            } else {
                ms.showNotification('Servicio no encontrado. Busca el servicio y reserva de nuevo.', 'info');
            }
        } else {
            throw new Error(response?.error || 'Error al cancelar');
        }
    } catch (err) {
        ms.showNotification('Error al reprogramar la reserva', 'error');
    }
}

async function contactProvider(bookingId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;

    const booking = ms.bookings?.find(b => String(b.id) === String(bookingId));
    if (!booking || !booking.providerId) {
        ms.showNotification('No se encontró información del proveedor', 'error');
        return;
    }

    try {
        const response = await ms.apiRequest(`/api/marketplace/providers/${encodeURIComponent(booking.providerId)}`);
        if (!response.success || !response.data?.provider) {
            ms.showNotification('No se pudo cargar el proveedor', 'error');
            return;
        }

        const provider = response.data.provider;
        const socialLinks = provider.social_links || {};

        // Build contact links
        const links = [];
        if (provider.whatsapp) {
            const phone = provider.whatsapp.replace(/[^0-9+]/g, '');
            const msg = encodeURIComponent(`Hola, te contacto desde La Tanda sobre mi reserva #${booking.bookingCode || bookingId}`);
            links.push(`<a href="https://wa.me/${phone}?text=${msg}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(37,211,102,0.15); border: 1px solid rgba(37,211,102,0.3); border-radius: 10px; color: #25D366; text-decoration: none; font-weight: 600; transition: background 0.2s, transform 0.2s;"><span style="font-size: 24px;">💬</span> WhatsApp</a>`);
        }
        if (provider.email) {
            const subject = encodeURIComponent(`Consulta - Reserva #${booking.bookingCode || bookingId}`);
            links.push(`<a href="mailto:${ms.escapeHtml(provider.email)}?subject=${subject}" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 10px; color: #3B82F6; text-decoration: none; font-weight: 600; transition: background 0.2s, transform 0.2s;"><span style="font-size: 24px;">📧</span> ${ms.escapeHtml(provider.email)}</a>`);
        }
        if (socialLinks.github) {
            links.push(`<a href="${ms.escapeHtml(socialLinks.github)}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #E6EDF3; text-decoration: none; font-weight: 600; transition: background 0.2s, transform 0.2s;"><span style="font-size: 24px;">🐙</span> GitHub</a>`);
        }
        if (socialLinks.linkedin) {
            links.push(`<a href="${ms.escapeHtml(socialLinks.linkedin)}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(10,102,194,0.15); border: 1px solid rgba(10,102,194,0.3); border-radius: 10px; color: #0A66C2; text-decoration: none; font-weight: 600; transition: background 0.2s, transform 0.2s;"><span style="font-size: 24px;">💼</span> LinkedIn</a>`);
        }
        if (socialLinks.website) {
            let hostname = socialLinks.website;
            try { hostname = new URL(socialLinks.website).hostname; } catch { /* invalid URL, show raw */ }
            links.push(`<a href="${ms.escapeHtml(socialLinks.website)}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.25); border-radius: 10px; color: #00FFFF; text-decoration: none; font-weight: 600; transition: background 0.2s, transform 0.2s;"><span style="font-size: 24px;">🌐</span> ${ms.escapeHtml(hostname)}</a>`);
        }

        if (links.length === 0) {
            ms.showNotification('Este proveedor no tiene información de contacto disponible', 'info');
            return;
        }

        // Remove existing modal if any
        const existing = document.getElementById('contactProviderModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'contactProviderModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 440px;">
                <div class="modal-header">
                    <h2 class="modal-title">Contactar Proveedor</h2>
                    <button class="close-btn" data-action="close-contact-modal">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #00FFFF, #10B981); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 22px; font-weight: 700; color: #0f172a;">
                            ${ms.escapeHtml((provider.business_name || 'P').charAt(0))}
                        </div>
                        <div style="font-size: 18px; font-weight: 700;">${ms.escapeHtml(provider.business_name || provider.user_name || 'Proveedor')}</div>
                        ${provider.is_verified ? '<div style="color: #10B981; font-size: 13px; margin-top: 4px;">✅ Verificado</div>' : ''}
                        <div style="color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 4px;">⭐ ${ms.escapeHtml(String(provider.avg_rating || 0))} · ${ms.escapeHtml(String(provider.completed_jobs || 0))} trabajos</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${links.join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close handlers
        const closeModal = () => modal.remove();
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('[data-action="close-contact-modal"]')) {
                closeModal();
            }
        });
    } catch (err) {
        ms.showNotification('Error al cargar información del proveedor', 'error');
    }
}

function leaveReview(bookingId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;
    if (ms.isGuest) { ms.showLoginPrompt('dejar resenas'); return; }

    const booking = ms.bookings?.find(b => String(b.id) === String(bookingId));
    if (!booking) { ms.showNotification(t('marketplace.booking_not_found',{defaultValue:'Reserva no encontrada'}), 'error'); return; }

    const esc = ms.escapeHtml.bind(ms);
    const existing = document.getElementById('reviewModal');
    if (existing) existing.remove();

    const starRow = (name, label) => `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <span style="font-size:13px;color:rgba(255,255,255,0.8);min-width:120px;">${esc(label)}</span>
            <div class="rv-stars" data-name="${esc(name)}" data-value="0" style="display:flex;gap:4px;cursor:pointer;">
                ${[1,2,3,4,5].map(n => `<span data-star="${n}" style="font-size:22px;color:rgba(255,255,255,0.25);transition:color 0.15s;">★</span>`).join('')}
            </div>
        </div>`;

    const modal = document.createElement('div');
    modal.id = 'reviewModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:480px;">
            <div class="modal-header">
                <h2 class="modal-title">⭐ Dejar Resena</h2>
                <button class="close-btn" id="reviewClose">&times;</button>
            </div>
            <div style="padding:20px;">
                <div style="margin-bottom:16px;padding:12px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:10px;">
                    <div style="font-weight:600;">${esc(booking.service)}</div>
                    <div style="color:rgba(255,255,255,0.6);font-size:13px;">Proveedor: ${esc(booking.provider)}</div>
                </div>
                ${starRow('overall_rating', 'General')}
                ${starRow('quality_rating', 'Calidad')}
                ${starRow('punctuality_rating', 'Puntualidad')}
                ${starRow('communication_rating', 'Comunicacion')}
                ${starRow('value_rating', 'Valor')}
                <div style="margin-top:16px;margin-bottom:12px;">
                    <label style="display:block;margin-bottom:6px;font-weight:500;">Comentario</label>
                    <textarea id="reviewComment" rows="3" placeholder="Comparte tu experiencia..." style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:white;resize:vertical;"></textarea>
                </div>
                <div style="display:flex;gap:12px;margin-top:20px;">
                    <button class="btn btn-secondary ds-btn ds-btn-secondary" id="reviewCancelBtn" style="flex:1;">Cancelar</button>
                    <button class="btn btn-primary ds-btn ds-btn-primary" id="reviewSubmitBtn" style="flex:1;">Enviar Resena</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Star click handlers
    modal.querySelectorAll('.rv-stars').forEach(row => {
        row.addEventListener('click', (e) => {
            const starEl = e.target.closest('[data-star]');
            if (!starEl) return;
            const val = parseInt(starEl.dataset.star);
            row.dataset.value = val;
            row.querySelectorAll('[data-star]').forEach(s => {
                s.style.color = parseInt(s.dataset.star) <= val ? '#FBBF24' : 'rgba(255,255,255,0.25)';
            });
        });
    });

    const closeModal = () => modal.remove();
    document.getElementById('reviewClose').addEventListener('click', closeModal);
    document.getElementById('reviewCancelBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    document.getElementById('reviewSubmitBtn').addEventListener('click', async () => {
        const ratings = {};
        let allFilled = true;
        modal.querySelectorAll('.rv-stars').forEach(row => {
            const val = parseInt(row.dataset.value);
            if (val < 1) allFilled = false;
            ratings[row.dataset.name] = val;
        });

        if (!allFilled) {
            ms.showNotification('Selecciona todas las calificaciones (1-5 estrellas)', 'error');
            return;
        }

        const submitBtn = document.getElementById('reviewSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            const response = await ms.apiRequest('/api/marketplace/reviews', {
                method: 'POST',
                body: JSON.stringify({
                    booking_id: booking.id,
                    ...ratings,
                    comment: document.getElementById('reviewComment').value.trim()
                })
            });

            if (response.success || response.review) {
                closeModal();
                ms.showNotification('Resena enviada exitosamente', 'success');
                ms.loadBookingsData();
            } else {
                throw new Error(response.error || 'Error al enviar resena');
            }
        } catch (err) {
            ms.showNotification(err.message || 'Error al enviar la resena', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Resena';
        }
    });
}

function rebookService(bookingId) {
    const booking = window.marketplaceSystem?.bookings?.find(b => b.id === bookingId);
    if (booking && booking.serviceId) {
        const service = window.marketplaceSystem?.services?.find(s => s.serviceId === booking.serviceId);
        if (service) {
            window.marketplaceSystem?.openBookingModal(service.id);
            return;
        }
    }
    window.marketplaceSystem?.showNotification('Error al encontrar el servicio', 'error');
}

// Share modal for referral links
async function showShareModal(itemId, type = 'service') {
    const ms = window.marketplaceSystem;
    if (!ms) return;

    if (ms.isGuest) {
        ms.showLoginPrompt('compartir y ganar comisiones');
        return;
    }

    // Find item (service or product)
    let item, itemTitle, itemImage, itemOwner, itemPrice;
    if (type === 'product') {
        item = ms.products.find(p => p.id === itemId);
        if (!item) return;
        itemTitle = item.name;
        itemImage = item.image;
        itemOwner = item.seller?.name || 'Vendedor';
        itemPrice = item.price;
    } else {
        item = ms.services.find(s => s.id === itemId);
        if (!item) return;
        itemTitle = item.title;
        itemImage = item.image;
        itemOwner = item.provider?.name || 'Proveedor';
        itemPrice = item.priceType === 'hourly' ? (item.price * item.duration) : item.price;
    }

    // Get or generate referral code
    try {
        const apiId = item.serviceId || item.productId || itemId.replace(/^(srv_|prod_)/, '');
        const response = await ms.apiRequest(`/api/marketplace/referrals/link/${apiId}?type=${type}`);

        if (response.success) {
            const referralLink = response.referral_link;
            const referralCode = response.referral_code;

            // Calculate commission
            const commissionPercent = item.referralCommission || 5;
            const estimatedCommission = (itemPrice * commissionPercent / 100).toFixed(0);
            const actionText = type === 'product' ? 'venta' : 'reserva';

            // Create modal — all user data escaped
            const esc = ms.escapeHtml.bind(ms);
            const safeImage = esc(String(itemImage || ''));
            const safeTitle = esc(String(itemTitle || ''));
            const safeOwner = esc(String(itemOwner || ''));
            const safeLink = esc(String(referralLink || ''));
            const safeCode = esc(String(referralCode || ''));
            const encodedLink = encodeURIComponent(referralLink);
            const encodedTitle = encodeURIComponent(itemTitle);

            const modal = document.createElement('div');
            modal.id = 'shareModal';
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2 class="modal-title">Compartir y Ganar</h2>
                        <button class="close-btn" data-action="close-share-modal">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 48px; margin-bottom: 10px;">${safeImage}</div>
                            <div style="font-size: 18px; font-weight: 600;">${safeTitle}</div>
                            <div style="color: rgba(255,255,255,0.7);">${safeOwner}</div>
                        </div>

                        <div style="background: linear-gradient(135deg, rgba(0,255,255,0.1), rgba(16,185,129,0.1)); border: 1px solid rgba(0,255,255,0.3); border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
                            <div style="font-size: 14px; color: rgba(255,255,255,0.7);">Ganas por cada ${actionText}</div>
                            <div style="font-size: 32px; font-weight: 700; color: #10B981;">${ms.formatPrice(parseFloat(estimatedCommission), item.currency || 'HNL')}</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.5);">${commissionPercent}% de comision</div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Tu link de referido:</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="referralLinkInput" value="${safeLink}" readonly
                                       style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; font-size: 12px;">
                                <button data-action="copy-referral-link" class="btn btn-secondary ds-btn ds-btn-secondary" style="padding: 12px 16px;">
                                    📋
                                </button>
                            </div>
                            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">
                                Codigo: ${safeCode}
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                            <button data-action="share-whatsapp" class="share-social-btn" style="background: #25D366;">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button data-action="share-telegram" class="share-social-btn" style="background: #0088cc;">
                                <i class="fab fa-telegram-plane"></i>
                            </button>
                            <button data-action="share-facebook" class="share-social-btn" style="background: #1877F2;">
                                <i class="fab fa-facebook-f"></i>
                            </button>
                            <button data-action="share-twitter" class="share-social-btn" style="background: #1DA1F2;">
                                <i class="fab fa-twitter"></i>
                            </button>
                        </div>

                        <div style="text-align: center; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                            <a href="commission-system.html" style="color: #00FFFF; text-decoration: none; font-size: 14px;">
                                Ver mi panel de comisiones
                            </a>
                        </div>
                    </div>
                </div>
            `;

            // Add CSS for social buttons if not exists
            if (!document.getElementById('shareModalStyles')) {
                const style = document.createElement('style');
                style.id = 'shareModalStyles';
                style.textContent = `
                    .share-social-btn {
                        padding: 14px;
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-size: 20px;
                        cursor: pointer;
                        transition: transform 0.2s, filter 0.2s;
                    }
                    .share-social-btn:hover {
                        transform: scale(1.05);
                        filter: brightness(1.1);
                    }
                `;
                document.head.appendChild(style);
            }

            // Delegated click listener for share modal actions
            modal.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (!action) return;
                switch (action) {
                    case 'close-share-modal': closeShareModal(); break;
                    case 'copy-referral-link': copyReferralLink(); break;
                    case 'share-whatsapp': shareToWhatsApp(encodedLink, encodedTitle); break;
                    case 'share-telegram': shareToTelegram(encodedLink, encodedTitle); break;
                    case 'share-facebook': shareToFacebook(encodedLink); break;
                    case 'share-twitter': shareToTwitter(encodedLink, encodedTitle); break;
                }
            });

            document.body.appendChild(modal);
        } else {
            throw new Error(response.error || 'Error generating referral link');
        }
    } catch (error) {
        ms.showNotification('Error generando link de referido', 'error');
    }
}

function closeShareModal() {
    document.getElementById('shareModal')?.remove();
}

function copyReferralLink() {
    const input = document.getElementById('referralLinkInput');
    if (input) {
        input.select();
        document.execCommand('copy');
        window.marketplaceSystem?.showNotification('Link copiado al portapapeles', 'success');
    }
}

function shareToWhatsApp(link, title) {
    const text = `¡Mira este servicio en La Tanda! ${decodeURIComponent(title)}\n${decodeURIComponent(link)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function shareToTelegram(link, title) {
    window.open(`https://t.me/share/url?url=${link}&text=${title}`, '_blank');
}

function shareToFacebook(link) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`, '_blank');
}

function shareToTwitter(link, title) {
    const text = `¡Mira este servicio en La Tanda! ${decodeURIComponent(title)}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${link}`, '_blank');
}

function closeLoginPromptModal() {
    document.getElementById('loginPromptModal')?.classList.remove('active');
}

function goToLogin() {
    window.location.href = 'auth-enhanced.html?redirect=marketplace-social.html';
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

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// v4.4.0: Delegated click handler for marketplace actions (moved out of CSS template)
function setupMarketplaceDelegatedListeners() {
    // Change events for select elements
    document.addEventListener('change', (e) => {
        const sel = e.target.closest('select[data-action]');
        if (!sel) return;
        if (sel.dataset.action === 'filter-orders') {
            const filterVal = sel.value || 'all';
            const ordersList = sel.closest('.sd-subtab-panel, .sd-tab-panel')?.querySelector('#sdOrdersList');
            if (ordersList) {
                ordersList.querySelectorAll('.sd-order-card').forEach(card => {
                    card.style.display = (filterVal === 'all' || card.dataset.orderStatus === filterVal) ? '' : 'none';
                });
            }
        }
    });
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) {
            // Check if click is on a tc-card but not on an action button
            const tcCard = e.target.closest('.tc-card');
            if (tcCard && !e.target.closest('.tc-action-primary, .tc-action-icon')) {
                const h = tcCard.dataset.handle;
                if (h) window.location.href = '/tienda/' + encodeURIComponent(h);
            }
            return;
        }
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        switch (action) {
            case 'view-service': if (typeof viewService === 'function') viewService(id); break;
            case 'book-service': e.stopPropagation(); if (typeof bookService === 'function') bookService(id); break;
            case 'share-service': e.stopPropagation(); if (typeof showShareModal === 'function') showShareModal(id); break;
            case 'view-product': if (typeof viewProduct === 'function') viewProduct(id); break;
            case 'buy-product': e.stopPropagation(); if (typeof buyProduct === 'function') buyProduct(id); break;
            case 'add-to-cart': {
                e.stopPropagation();
                const msCart = window.marketplaceSystem;
                if (!msCart) break;
                if (msCart.isGuest) { msCart.showLoginPrompt('agregar al carrito'); break; }
                let cartProduct = msCart.products?.find(p => String(p.id) === String(id) || String(p.productId) === String(id));
                if (cartProduct) {
                    msCart._addToCart(cartProduct, 1);
                    msCart.showNotification(t('marketplace.added_to_cart',{defaultValue:'Agregado al carrito'}), 'success');
                } else {
                    // Product from Explorar feed — fetch from API
                    try {
                        const pr = await msCart.apiRequest('/api/marketplace/products/' + encodeURIComponent(id));
                        const pd = pr?.data?.product || pr?.product;
                        if (pd) { msCart._addToCart(pd, 1); msCart.showNotification(t('marketplace.added_to_cart',{defaultValue:'Agregado al carrito'}), 'success'); }
                        else msCart.showNotification(t('marketplace.product_not_found',{defaultValue:'Producto no encontrado'}), 'error');
                    } catch { msCart.showNotification('Error al agregar', 'error'); }
                }
                break;
            }
            case 'share-product': e.stopPropagation(); if (typeof showShareModal === 'function') showShareModal(id, 'product'); break;
            case 'toggle-like': if (typeof toggleLike === 'function') toggleLike(id); break;
            case 'show-comments': if (typeof showComments === 'function') showComments(id); break;
            case 'share-post': if (typeof sharePost === 'function') sharePost(id); break;
            case 'cancel-booking': if (typeof cancelBooking === 'function') cancelBooking(id); break;
            case 'contact-provider': if (typeof contactProvider === 'function') contactProvider(id); break;
            case 'reschedule-booking': if (typeof rescheduleBooking === 'function') rescheduleBooking(id); break;
            case 'leave-review': if (typeof leaveReview === 'function') leaveReview(id); break;
            case 'rebook-service': if (typeof rebookService === 'function') rebookService(id); break;
            case 'edit-store': { window.marketplaceSystem._activeStoreTab = 'config'; try { sessionStorage.setItem('store_active_tab', 'config'); } catch(e) {} window.marketplaceSystem.loadMyStore(); break; }
            case 'close-edit-store': document.getElementById('storeEditOverlay')?.remove(); break;
            case 'view-my-store': window.marketplaceSystem?.loadMyStore(); break;
            case 'select-shop-type': {
                const ms = window.marketplaceSystem;
                if (!ms) break;
                if (id === 'mixed') {
                    if (!ms.checkTierGate('mixed_store')) break;
                    ms._selectedShopType = id;
                    ms.renderStoreLayoutPicker();
                } else if (id === 'services' || id === 'products') {
                    ms._selectedShopType = id;
                    ms.renderStoreLayoutPicker();
                }
                break;
            }
            case 'change-shop-type': {
                const ms2 = window.marketplaceSystem;
                if (ms2) ms2.renderStoreOnboarding();
                break;
            }
            case 'select-layout': {
                const msL = window.marketplaceSystem;
                const layoutLabels = { classic: 'Clasica', showcase: 'Escaparate', compact: 'Tarjeta' };
                if (msL && (id === 'classic' || id === 'showcase' || id === 'compact')) {
                    if (!msL.checkTierGate('select_layout', { layout: id, layoutLabel: layoutLabels[id] })) break;
                    msL._selectedLayout = id;
                    msL.renderStoreThemePicker();
                }
                break;
            }
            case 'change-layout': {
                const msL2 = window.marketplaceSystem;
                if (msL2) msL2.renderStoreLayoutPicker();
                break;
            }
            case 'select-theme': {
                const msT = window.marketplaceSystem;
                const validThemes = ['dark', 'cyan', 'gold', 'green', 'coral', 'purple'];
                const themeLabels = { dark: 'Oscuro', cyan: 'Cyan', gold: 'Dorado', green: 'Verde', coral: 'Coral', purple: 'Purpura' };
                if (msT && validThemes.includes(id)) {
                    if (!msT.checkTierGate('select_theme', { theme: id, themeLabel: themeLabels[id] })) break;
                    msT._selectedTheme = id;
                    msT.renderStoreOnboardingForm();
                }
                break;
            }
            case 'change-theme': {
                const msT2 = window.marketplaceSystem;
                if (msT2) msT2.renderStoreThemePicker();
                break;
            }
            case 'pick-edit-layout': {
                const container = btn.closest('.store-edit-layout-picker');
                if (container) {
                    container.querySelectorAll('.store-edit-layout-opt').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
                break;
            }
            case 'pick-edit-theme': {
                const container2 = btn.closest('.store-edit-theme-picker');
                if (container2) {
                    container2.querySelectorAll('.store-edit-theme-opt').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
                break;
            }
            case 'add-service': {
                const ms3 = window.marketplaceSystem;
                if (ms3?.isGuest) { ms3.showLoginPrompt('ofrecer servicios'); break; }
                if (ms3?._currentProvider?.shop_type === 'products') {
                    ms3.showNotification('Tu tienda es de tipo Productos. No puedes crear servicios.', 'error');
                } else if (ms3) {
                    if (!ms3.checkTierGate('create_listing')) break;
                    ms3.openCreateServiceModal();
                }
                break;
            }
            case 'add-product': {
                const ms4 = window.marketplaceSystem;
                if (ms4?.isGuest) { ms4.showLoginPrompt('publicar productos'); break; }
                if (ms4?._currentProvider?.shop_type === 'services') {
                    // Removed: unhelpful message for service-only stores
                } else if (ms4) {
                    if (!ms4.checkTierGate('create_listing')) break;
                    ms4.openCreateProductModal();
                }
                break;
            }
            case 'close-create-service': {
                document.getElementById('serviceCreateOverlay')?.remove();
                break;
            }
            case 'close-create-product': {
                document.getElementById('productCreateOverlay')?.remove();
                break;
            }
            case 'edit-item': {
                const msEdit = window.marketplaceSystem;
                if (!msEdit) break;
                const editType = btn.dataset.type;
                const editId = btn.dataset.id;
                if (editType === 'products') msEdit.openEditProductModal(editId);
                else if (editType === 'services') msEdit.openEditServiceModal(editId);
                break;
            }
            case 'delete-item': {
                const msDel = window.marketplaceSystem;
                if (!msDel) break;
                msDel.deleteItem(btn.dataset.type, btn.dataset.id);
                break;
            }
            case 'boost-item': {
                const msBoost = window.marketplaceSystem;
                if (!msBoost) break;
                msBoost.openBoostModal(btn.dataset.type, btn.dataset.id);
                break;
            }
            case 'close-boost-modal': {
                document.getElementById('boostOverlay')?.remove();
                break;
            }
            case 'boost-select-tier': {
                const msBS = window.marketplaceSystem;
                if (!msBS) break;
                msBS._purchaseBoost(btn.dataset.type, btn.dataset.id, parseInt(btn.dataset.duration));
                break;
            }
            case 'close-edit-product': {
                document.getElementById('productEditOverlay')?.remove();
                break;
            }
            case 'close-edit-service': {
                document.getElementById('serviceEditOverlay')?.remove();
                break;
            }
            case 'submit-edit-product': {
                window.marketplaceSystem?.handleEditProduct();
                break;
            }
            case 'submit-edit-service': {
                window.marketplaceSystem?.handleEditService();
                break;
            }
            case 'remove-edit-product-image': {
                const epIdx = parseInt(btn.dataset.index);
                const epImagesEl = document.getElementById('epExistingImages');
                if (!isNaN(epIdx) && epImagesEl) {
                    try {
                        const imgs = JSON.parse(epImagesEl.value || '[]');
                        imgs.splice(epIdx, 1);
                        epImagesEl.value = JSON.stringify(imgs);
                        btn.closest('.store-image-preview')?.remove();
                    } catch(e) { console.warn('Error removing product image:', e.message); }
                }
                break;
            }
            case 'remove-edit-service-image': {
                const esIdx = parseInt(btn.dataset.index);
                const esImagesEl = document.getElementById('esExistingImages');
                if (!isNaN(esIdx) && esImagesEl) {
                    try {
                        const imgs = JSON.parse(esImagesEl.value || '[]');
                        imgs.splice(esIdx, 1);
                        esImagesEl.value = JSON.stringify(imgs);
                        btn.closest('.store-image-preview')?.remove();
                    } catch(e) { console.warn('Error removing service image:', e.message); }
                }
                break;
            }
            case 'update-order-status': {
                const orderId = btn.dataset.orderId;
                const newStatus = btn.dataset.newStatus;
                if (orderId && newStatus) window.marketplaceSystem?.handleUpdateOrderStatus(orderId, newStatus);
                break;
            }
            case 'filter-orders': {
                const filterVal = btn.value || 'all';
                const ordersList = btn.closest('.sd-subtab-panel, .sd-listings-content, .sd-tab-panel')?.querySelector('#sdOrdersList');
                if (ordersList) {
                    ordersList.querySelectorAll('.sd-order-card').forEach(card => {
                        const status = card.dataset.orderStatus;
                        card.style.display = (filterVal === 'all' || status === filterVal) ? '' : 'none';
                    });
                }
                break;
            }
            case 'submit-service': {
                window.marketplaceSystem?.handleCreateService();
                break;
            }
            case 'submit-product': {
                window.marketplaceSystem?.handleCreateProduct();
                break;
            }
            case 'remove-service-image': {
                const idx = parseInt(btn.dataset.index);
                if (!isNaN(idx)) window.marketplaceSystem?._removeImage('service', idx);
                break;
            }
            case 'remove-product-image': {
                const idx2 = parseInt(btn.dataset.index);
                if (!isNaN(idx2)) window.marketplaceSystem?._removeImage('product', idx2);
                break;
            }
            case 'copy-portfolio-url': {
                const url = btn.dataset.url;
                if (url && navigator.clipboard) {
                    navigator.clipboard.writeText(url).then(() => {
                        window.marketplaceSystem?.showNotification(t('messages.url_copied',{defaultValue:'URL copiada al portapapeles'}), 'success');
                    }).catch(() => {
                        window.marketplaceSystem?.showNotification(t('messages.copy_failed',{defaultValue:'No se pudo copiar'}), 'error');
                    });
                }
                break;
            }
            case 'sd-switch-tab': {
                const tabName = btn.dataset.tab;
                if (tabName) window.marketplaceSystem?.switchListingTab(tabName);
                break;
            }
            case 'sd-apply-theme': {
                const themeId = btn.dataset.theme;
                if (themeId && window.marketplaceSystem) {
                    if (!window.marketplaceSystem.checkTierGate('select_theme', { theme: themeId })) break;
                    window.marketplaceSystem.applyThemeInline(themeId);
                }
                break;
            }
            case 'sd-apply-layout': {
                const layoutId = btn.dataset.layout || btn.closest('[data-layout]')?.dataset.layout;
                if (layoutId && window.marketplaceSystem) {
                    if (!window.marketplaceSystem.checkTierGate('select_layout', { layout: layoutId })) break;
                    window.marketplaceSystem.applyLayoutInline(layoutId);
                }
                break;
            }
            case 'sd-share-store': {
                const shareUrl = btn.dataset.url;
                if (shareUrl && navigator.share) {
                    navigator.share({ title: 'Mi Tienda en La Tanda', url: shareUrl }).catch(() => {});
                } else if (shareUrl && navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        window.marketplaceSystem?.showNotification(t('messages.url_copied',{defaultValue:'URL copiada al portapapeles'}), 'success');
                    }).catch(() => {
                        window.marketplaceSystem?.showNotification(t('messages.copy_failed',{defaultValue:'No se pudo copiar'}), 'error');
                    });
                }
                break;
            }
            case 'goto-pub-pedidos': {
                // Navigate to Publicaciones > Pedidos
                if (window.marketplaceSystem) window.marketplaceSystem._activeStoreTab = 'publicaciones';
                try { sessionStorage.setItem('store_active_tab', 'publicaciones'); sessionStorage.setItem('pub_subtab', 'pedidos'); } catch(e) {}
                if (window.marketplaceSystem) window.marketplaceSystem.loadMyStore();
                break;
            }
            case 'exp-subtab': {
                const expSub = btn.getAttribute('data-subtab');
                const subtabsNav = document.querySelector('#explorarSubtabs .sd-subtabs-nav');
                if (subtabsNav) {
                    subtabsNav.querySelectorAll('.sd-subtab').forEach(t => t.classList.remove('sd-subtab-active'));
                    const target = subtabsNav.querySelector('[data-subtab="' + expSub + '"]');
                    if (target) target.classList.add('sd-subtab-active');
                }
                document.querySelectorAll('#explorarSubtabs > .sd-subtab-panel').forEach(p => p.style.display = 'none');
                const expPanel = document.querySelector('#explorarSubtabs .sd-subtab-panel[data-panel="' + expSub + '"]');
                if (expPanel) expPanel.style.display = '';

                const ms = window.marketplaceSystem;
                if (ms && expSub !== 'inicio') {
                    const tabMap = { tiendas: 'exp-tiendas', productos: 'exp-productos', servicios: 'exp-servicios' };
                    ms._expTab = tabMap[expSub] || 'exp-tiendas';
                    ms._expOffset = 0;
                    ms._expCategory = null;
                    ms._expSearchQuery = null;
                    if (expSub === 'tiendas') ms._expShopType = null;
                    // Load pills for the panel
                    const pillsMap = { tiendas: 'expCategoryPills', productos: 'expCategoryPillsProd', servicios: 'expCategoryPillsSvc' };
                    ms._loadExpCategoryPills(ms._expTab, pillsMap[expSub]);
                    ms.loadExplorarFeed(ms._expTab, false);
                }
                break;
            }
            case 'carousel-prev':
            case 'carousel-next': {
                const carouselId = btn.dataset.carousel;
                const carousel = document.getElementById(carouselId);
                if (!carousel) break;
                const total = parseInt(carousel.dataset.total);
                let current = parseInt(carousel.dataset.current);
                current = action === 'carousel-next' ? (current + 1) % total : (current - 1 + total) % total;
                carousel.dataset.current = current;
                carousel.querySelector('.sd-carousel-track').style.transform = 'translateX(-' + (current * 100) + '%)';
                carousel.querySelectorAll('.sd-carousel-dot').forEach((d, i) => d.classList.toggle('active', i === current));
                const counter = carousel.querySelector('.sd-carousel-counter');
                if (counter) counter.textContent = (current + 1) + '/' + total;
                e.stopPropagation();
                break;
            }
            case 'exp-inner-tab': {
                const innerTarget = btn.dataset.inner;
                const innerNav = btn.closest('.exp-inner-tabs');
                if (innerNav) {
                    innerNav.querySelectorAll('.exp-inner-tab').forEach(t => t.classList.remove('exp-inner-active'));
                    btn.classList.add('exp-inner-active');
                }
                const inicioContent = document.getElementById('expInicioContent');
                if (inicioContent) {
                    inicioContent.querySelectorAll('.exp-inner-panel').forEach(p => p.style.display = 'none');
                    const targetPanel = inicioContent.querySelector('.exp-inner-panel[data-inner-panel="' + innerTarget + '"]');
                    if (targetPanel) targetPanel.style.display = '';
                }
                break;
            }
            case 'exp-cat-filter': {
                const catId = btn.dataset.catId;
                const catName = btn.dataset.catName;
                const ms2 = window.marketplaceSystem;
                if (ms2 && catId) {
                    ms2._openCategoryDetail(catId, catName);
                }
                break;
            }
            case 'exp-cat-back': {
                // Return to Inicio from category detail
                const ms2b = window.marketplaceSystem;
                if (ms2b) ms2b._buildExplorarInicio();
                break;
            }
            case 'exp-cat-inner': {
                const catInner = btn.dataset.catInner;
                const catContainer = document.getElementById('expInicioContent');
                if (!catContainer) break;
                catContainer.querySelectorAll('.exp-cat-inner-tab').forEach(t => t.classList.remove('exp-inner-active'));
                btn.classList.add('exp-inner-active');
                catContainer.querySelectorAll('.exp-cat-detail-panel').forEach(p => p.style.display = 'none');
                const targetP = catContainer.querySelector('.exp-cat-detail-panel[data-cat-detail="' + catInner + '"]');
                if (targetP) targetP.style.display = '';
                break;
            }
            case 'cfg-subtab': {
                const cfgSub = btn.getAttribute('data-subtab');
                try { sessionStorage.setItem('cfg_subtab', cfgSub); } catch(e) {}
                btn.closest('.sd-subtabs-nav').querySelectorAll('.sd-subtab').forEach(t => t.classList.remove('sd-subtab-active'));
                btn.classList.add('sd-subtab-active');
                btn.closest('.sd-subtabs-container').querySelectorAll('.sd-subtab-panel').forEach(p => p.style.display = 'none');
                const cfgPanel = btn.closest('.sd-subtabs-container').querySelector(`.sd-subtab-panel[data-panel="${cfgSub}"]`);
                if (cfgPanel) cfgPanel.style.display = '';
                // Re-trigger chain balance and referral load when switching to Plan
                if (cfgSub === 'plan' && window.marketplaceSystem) {
                    window.marketplaceSystem._loadChainBalance();
                    window.marketplaceSystem._loadReferralDashboard();
                }
                break;
            }
            case 'ped-subtab': {
                const pedSub = btn.getAttribute('data-subtab');
                try { sessionStorage.setItem('ped_subtab', pedSub); } catch(e) {}
                btn.closest('.sd-subtabs-nav').querySelectorAll('.sd-subtab').forEach(t => t.classList.remove('sd-subtab-active'));
                btn.classList.add('sd-subtab-active');
                btn.closest('.sd-subtabs-container').querySelectorAll('.sd-subtab-panel').forEach(p => p.style.display = 'none');
                const pedPanel = btn.closest('.sd-subtabs-container').querySelector(`.sd-subtab-panel[data-panel="${pedSub}"]`);
                if (pedPanel) pedPanel.style.display = '';
                break;
            }
            case 'update-booking-status': {
                const bkId = btn.dataset.bookingId;
                const bkStatus = btn.dataset.newStatus;
                if (bkId && bkStatus && window.marketplaceSystem) {
                    btn.disabled = true;
                    btn.textContent = '...';
                    try {
                        const bkRes = await window.marketplaceSystem.apiRequest('/api/marketplace/bookings/' + bkId + '/status', {
                            method: 'PUT',
                            body: JSON.stringify({ status: bkStatus })
                        });
                        if (bkRes.success) {
                            window.marketplaceSystem.showNotification('Reserva actualizada', 'success');
                            window.marketplaceSystem.loadMyStore();
                        } else {
                            window.marketplaceSystem.showNotification(bkRes.data?.error?.message || 'Error', 'error');
                            btn.disabled = false;
                            btn.textContent = bkStatus === 'confirmed' ? 'Confirmar' : bkStatus === 'completed' ? 'Completar' : 'Rechazar';
                        }
                    } catch (err) {
                        window.marketplaceSystem.showNotification('Error de conexion', 'error');
                        btn.disabled = false;
                    }
                }
                break;
            }
            case 'pub-subtab': {
                const pubSub = btn.getAttribute('data-subtab');
                try { sessionStorage.setItem('pub_subtab', pubSub); } catch(e) {}
                btn.closest('.sd-subtabs-nav').querySelectorAll('.sd-subtab').forEach(t => t.classList.remove('sd-subtab-active'));
                btn.classList.add('sd-subtab-active');
                btn.closest('.sd-subtabs-container').querySelectorAll('.sd-subtab-panel').forEach(p => p.style.display = 'none');
                const pubPanel = btn.closest('.sd-subtabs-container').querySelector(`.sd-subtab-panel[data-panel="${pubSub}"]`);
                if (pubPanel) pubPanel.style.display = '';
                break;
            }
            case 'resumen-subtab': {
                const sub = btn.getAttribute('data-subtab');
                try { sessionStorage.setItem('resumen_subtab', sub); } catch(e) {}
                btn.closest('.sd-subtabs-nav').querySelectorAll('.sd-subtab').forEach(t => t.classList.remove('sd-subtab-active'));
                btn.classList.add('sd-subtab-active');
                btn.closest('.sd-subtabs-container').querySelectorAll('.sd-subtab-panel').forEach(p => p.style.display = 'none');
                const targetPanel = btn.closest('.sd-subtabs-container').querySelector(`.sd-subtab-panel[data-panel="${sub}"]`);
                if (targetPanel) targetPanel.style.display = '';
                break;
            }
            case 'store-tab': {
                const tab = btn.getAttribute('data-tab');
                if (window.marketplaceSystem) window.marketplaceSystem._activeStoreTab = tab;
                try { sessionStorage.setItem('store_active_tab', tab); } catch(e) {}
                document.querySelectorAll('.sd-tab').forEach(t => t.classList.remove('sd-tab-active'));
                btn.classList.add('sd-tab-active');
                document.querySelectorAll('.sd-tab-panel').forEach(p => p.style.display = 'none');
                var panelMap = { resumen: 'sdTabResumen', publicaciones: 'sdTabPublicaciones', pedidos: 'sdTabPedidos', config: 'sdTabConfig' };
                var panel = document.getElementById(panelMap[tab]);
                if (panel) panel.style.display = '';
                break;
            }
            case 'goto-publicaciones': {
                if (window.marketplaceSystem) { window.marketplaceSystem._activeStoreTab = 'publicaciones'; }
                try { sessionStorage.setItem('store_active_tab', 'publicaciones'); } catch(e) {}
                if (window.marketplaceSystem) window.marketplaceSystem.loadMyStore();
                break;
            }
            case 'goto-config': {
                if (window.marketplaceSystem) { window.marketplaceSystem._activeStoreTab = 'config'; }
                try { sessionStorage.setItem('store_active_tab', 'config'); } catch(e) {}
                if (window.marketplaceSystem) window.marketplaceSystem.loadMyStore();
                break;
            }
            case 'save-store-info': {
                const ms = window.marketplaceSystem;
                if (!ms) break;
                const getVal = (id) => (document.getElementById(id)?.value || '').trim();
                const business_phone = getVal('sdEditBusinessPhone');
                const areas = getVal('sdEditAreas').split(',').map(s => s.trim()).filter(Boolean);
                const links = {};
                if (getVal('sdEditWebsite')) links.website = getVal('sdEditWebsite');
                if (getVal('sdEditGithub')) links.github = getVal('sdEditGithub');
                if (getVal('sdEditLinkedin')) links.linkedin = getVal('sdEditLinkedin');
                const body = {
                    business_name: getVal('sdEditName'), description: getVal('sdEditDesc'),
                    phone: getVal('sdEditPhone') || undefined,
                    business_phone: business_phone || undefined, whatsapp: getVal('sdEditWhatsapp') || undefined,
                    email: getVal('sdEditEmail') || undefined, city: getVal('sdEditCity') || undefined,
                    neighborhood: getVal('sdEditNeighborhood') || undefined,
                    service_areas: areas.length ? areas : undefined,
                    social_links: Object.keys(links).length ? links : undefined
                };
                if (!body.business_name || !body.description) {
                    ms.showNotification('Nombre y descripcion son requeridos', 'error'); break;
                }
                btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                ms.apiRequest('/api/marketplace/providers/me', { method: 'PUT', body: JSON.stringify(body) }).then(res => {
                    if (res.success) {
                        ms.showNotification('Informacion actualizada', 'success');
                        try { var cl = JSON.parse(localStorage.getItem('store_setup_checklist') || '{}'); cl.complete_contact = true; localStorage.setItem('store_setup_checklist', JSON.stringify(cl)); } catch(e) {}
                        ms.loadMyStore();
                    } else {
                        ms.showNotification(res.data?.error?.message || 'Error al guardar', 'error');
                        btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
                    }
                }).catch(() => { ms.showNotification('Error de conexion', 'error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios'; });
                break;
            }
            case 'upload-cover': {
                document.getElementById('coverFileInput')?.click();
                break;
            }
            case 'remove-cover': {
                if (confirm('Eliminar imagen de portada?')) {
                    window.marketplaceSystem?.apiRequest('/api/marketplace/providers/me', {
                        method: 'PUT', body: JSON.stringify({ cover_image: null })
                    }).then(() => window.marketplaceSystem?.loadMyStore()).catch(() => {});
                }
                break;
            }
            case 'save-hours': {
                const ms = window.marketplaceSystem;
                if (!ms) break;
                const hours = {};
                document.querySelectorAll('.sd-hours-active').forEach(cb => {
                    const day = cb.dataset.day;
                    if (cb.checked) {
                        const open = document.querySelector('.sd-hours-open[data-day="' + day + '"]')?.value || '09:00';
                        const close = document.querySelector('.sd-hours-close[data-day="' + day + '"]')?.value || '17:00';
                        hours[day] = { open, close };
                    } else {
                        hours[day] = null;
                    }
                });
                try {
                    const res = await ms.apiRequest('/api/marketplace/providers/me', { method: 'PUT', body: JSON.stringify({ business_hours: hours }) });
                    if (res.success) ms.showNotification('Horario guardado', 'success');
                    else ms.showNotification('Error al guardar', 'error');
                } catch (e) { ms.showNotification('Error de conexion', 'error'); }
                break;
            }
            case 'save-payments': {
                const ms = window.marketplaceSystem;
                if (!ms) break;
                const methods = [];
                document.querySelectorAll('.sd-pay-method:checked').forEach(cb => methods.push(cb.value));
                try {
                    const res = await ms.apiRequest('/api/marketplace/providers/me', { method: 'PUT', body: JSON.stringify({ payment_methods: methods }) });
                    if (res.success) { ms.showNotification('Metodos guardados', 'success'); ms.loadMyStore(); }
                    else ms.showNotification('Error al guardar', 'error');
                } catch (e) { ms.showNotification('Error de conexion', 'error'); }
                break;
            }
            case 'save-policies': {
                const ms = window.marketplaceSystem;
                if (!ms) break;
                const policies = {
                    warranty: document.getElementById('sdPolWarranty')?.value?.trim() || '',
                    refund: document.getElementById('sdPolRefund')?.value?.trim() || '',
                    delivery: document.getElementById('sdPolDelivery')?.value?.trim() || ''
                };
                // Remove empty keys
                Object.keys(policies).forEach(k => { if (!policies[k]) delete policies[k]; });
                try {
                    const res = await ms.apiRequest('/api/marketplace/providers/me', { method: 'PUT', body: JSON.stringify({ policies }) });
                    if (res.success) ms.showNotification('Politicas guardadas', 'success');
                    else ms.showNotification('Error al guardar', 'error');
                } catch (e) { ms.showNotification('Error de conexion', 'error'); }
                break;
            }
            case 'save-faq': {
                const ms = window.marketplaceSystem;
                if (!ms) break;
                const faqItems = [];
                document.querySelectorAll('.sd-faq-row').forEach(row => {
                    const q = row.querySelector('.sd-faq-q')?.value?.trim();
                    const a = row.querySelector('.sd-faq-a')?.value?.trim();
                    if (q && a) faqItems.push({ q, a });
                });
                try {
                    const res = await ms.apiRequest('/api/marketplace/providers/me', { method: 'PUT', body: JSON.stringify({ faq: faqItems }) });
                    if (res.success) ms.showNotification('FAQ guardado', 'success');
                    else ms.showNotification('Error al guardar', 'error');
                } catch (e) { ms.showNotification('Error de conexion', 'error'); }
                break;
            }
            case 'add-faq': {
                const faqForm = document.getElementById('sdFaqForm');
                if (!faqForm) break;
                const addBtn = faqForm.querySelector('[data-action="add-faq"]');
                const newRow = document.createElement('div');
                newRow.className = 'sd-faq-row';
                newRow.style.cssText = 'margin-bottom:12px;padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06);';
                newRow.innerHTML = '<input type="text" class="sd-form-input sd-faq-q" value="" placeholder="Pregunta" style="margin-bottom:6px;"><textarea class="sd-form-input sd-faq-a" rows="2" placeholder="Respuesta"></textarea><button data-action="remove-faq" style="background:none;border:none;color:#ef4444;font-size:12px;cursor:pointer;margin-top:4px;"><i class="fas fa-trash"></i> Eliminar</button>';
                faqForm.insertBefore(newRow, addBtn);
                break;
            }
            case 'remove-faq': {
                btn.closest('.sd-faq-row')?.remove();
                break;
            }
            case 'delete-store': {
                const storeName = window.marketplaceSystem?._currentProvider?.business_name || 'Mi Tienda';
                const confirmed = prompt('Escribe "' + storeName + '" para confirmar:');
                if (confirmed === storeName) {
                    window.marketplaceSystem?.apiRequest('/api/marketplace/providers/me', { method: 'DELETE' }).then(res => {
                        if (res.success) { window.marketplaceSystem.showNotification('Tienda eliminada', 'success'); window.marketplaceSystem._currentProvider = null; window.marketplaceSystem.loadMyStore(); }
                        else { window.marketplaceSystem.showNotification('Error al eliminar', 'error'); }
                    }).catch(() => window.marketplaceSystem?.showNotification('Error de conexion', 'error'));
                } else if (confirmed !== null) {
                    window.marketplaceSystem?.showNotification('El nombre no coincide', 'error');
                }
                break;
            }
            case 'sd-scroll-themes': { // Legacy — redirects to Config tab
                if (window.marketplaceSystem) { window.marketplaceSystem._activeStoreTab = 'config'; }
                try { sessionStorage.setItem('store_active_tab', 'config'); } catch(e) {}
                if (window.marketplaceSystem) window.marketplaceSystem.loadMyStore();
                break;
            }
            case 'sd-scroll-themes-OLD': {
                const themeBrowser = document.getElementById('sdThemeBrowser');
                if (themeBrowser) themeBrowser.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;
            }
            case 'open-portfolio-maker': {
                window.marketplaceSystem?.openPortfolioMaker();
                break;
            }
            case 'back-to-store': {
                window.marketplaceSystem?.loadMyStore();
                break;
            }
            case 'toggle-cv-section': {
                const secKey = btn.dataset.section;
                if (secKey) window.marketplaceSystem?.handleToggleCvSection(secKey);
                break;
            }
            case 'add-cv-item': {
                const secKey2 = btn.dataset.section;
                if (secKey2) window.marketplaceSystem?.handleAddCvItem(secKey2);
                break;
            }
            case 'edit-cv-item': {
                const secKey3 = btn.dataset.section;
                const idx3 = parseInt(btn.dataset.index);
                if (secKey3 && !isNaN(idx3)) window.marketplaceSystem?.handleEditCvItem(secKey3, idx3);
                break;
            }
            case 'remove-cv-item': {
                const secKey4 = btn.dataset.section;
                const idx4 = parseInt(btn.dataset.index);
                if (secKey4 && !isNaN(idx4)) window.marketplaceSystem?.handleRemoveCvItem(secKey4, idx4);
                break;
            }
            case 'confirm-cv-item': {
                const secKey5 = btn.dataset.section;
                if (secKey5) window.marketplaceSystem?.handleConfirmCvItem(secKey5);
                break;
            }
            case 'cancel-cv-form': {
                const secKey6 = btn.dataset.section;
                if (secKey6) window.marketplaceSystem?.handleCancelCvForm(secKey6);
                break;
            }
            case 'save-portfolio': {
                window.marketplaceSystem?.savePortfolio();
                break;
            }
            case 'download-cv-pdf': {
                window.marketplaceSystem?.downloadPortfolioPDF();
                break;
            }
            case 'import-cv-file': {
                document.getElementById('cvFileInput')?.click();
                break;
            }
            case 'process-cv-upload': {
                window.marketplaceSystem?.processCvUpload();
                break;
            }
            case 'generate-cv-summary': {
                window.marketplaceSystem?.generateAISummary();
                break;
            }
            case 'toggle-featured': {
                const msF = window.marketplaceSystem;
                if (!msF) break;
                const fType = btn.dataset.type;
                const fId = btn.dataset.id;
                const wasFeatured = btn.dataset.featured === 'true';
                const fEndpoint = fType === 'services' ? '/api/marketplace/services/' + fId : '/api/marketplace/products/' + fId;
                btn.disabled = true;
                msF.apiRequest(fEndpoint, { method: 'PATCH', body: JSON.stringify({ featured: !wasFeatured }) })
                    .then(() => { msF.showNotification(wasFeatured ? 'Quitado de destacados' : 'Marcado como destacado', 'success'); msF.loadMyStore(); })
                    .catch(() => { msF.showNotification(t('messages.update_error',{defaultValue:'Error al actualizar'}), 'error'); btn.disabled = false; });
                break;
            }
            case 'move-item-up':
            case 'move-item-down': {
                const msM = window.marketplaceSystem;
                if (!msM) break;
                const mType = btn.dataset.type;
                const mId = btn.dataset.id;
                const currentOrder = parseInt(btn.dataset.order) || 0;
                const newOrder = action === 'move-item-up' ? Math.max(0, currentOrder - 1) : currentOrder + 1;
                const mEndpoint = mType === 'services' ? '/api/marketplace/services/' + mId : '/api/marketplace/products/' + mId;
                btn.disabled = true;
                msM.apiRequest(mEndpoint, { method: 'PATCH', body: JSON.stringify({ display_order: newOrder }) })
                    .then(() => { msM.loadMyStore(); })
                    .catch(() => { msM.showNotification('Error al reordenar', 'error'); btn.disabled = false; });
                break;
            }
            case 'exp-tienda-type': {
                const shopType = btn.dataset.shopType || '';
                const ms2t = window.marketplaceSystem;
                if (ms2t) {
                    ms2t._expShopType = shopType || null;
                    ms2t._expOffset = 0;
                    // Update inner tab active state
                    const typeTabs = document.getElementById('tiendasTypeTabs');
                    if (typeTabs) {
                        typeTabs.querySelectorAll('.exp-inner-tab').forEach(t => t.classList.remove('exp-inner-active'));
                        btn.classList.add('exp-inner-active');
                    }
                    ms2t.loadExplorarFeed('exp-tiendas', false);
                }
                break;
            }
            case 'exp-cat-load-more': {
                const catType = btn.dataset.catType;
                const msC = window.marketplaceSystem;
                if (msC && catType) msC._loadCategoryFeed(catType, true);
                break;
            }
            case 'exp-load-more-prod': {
                const msEP = window.marketplaceSystem;
                if (msEP) msEP.loadExplorarFeed('exp-productos', true);
                break;
            }
            case 'exp-load-more-svc': {
                const msES = window.marketplaceSystem;
                if (msES) msES.loadExplorarFeed('exp-servicios', true);
                break;
            }
            case 'exp-load-more': {
                const msE = window.marketplaceSystem;
                if (msE) msE.loadExplorarFeed(msE._expTab, true);
                break;
            }
            case 'exp-sell-product': {
                const msE2 = window.marketplaceSystem;
                if (msE2?.isGuest) { msE2.showLoginPrompt('vender productos'); break; }
                if (msE2) {
                    if (!msE2.checkTierGate('create_listing')) break;
                    msE2.openCreateProductModal();
                }
                break;
            }
            case 'upload-logo': {
                const logoInput = document.getElementById('logoFileInput');
                if (logoInput) logoInput.click();
                break;
            }
            case 'remove-logo': {
                const msRL = window.marketplaceSystem;
                if (!msRL) break;
                if (!confirm('Eliminar el logo de tu tienda?')) break;
                try {
                    const res = await msRL.apiRequest('/api/marketplace/providers/me', {
                        method: 'PUT',
                        body: JSON.stringify({ logo_image: null })
                    });
                    if (res.success) { msRL.showNotification('Logo eliminado', 'success'); msRL.loadMyStore(); }
                    else { msRL.showNotification('Error al eliminar logo', 'error'); }
                } catch (err) { msRL.showNotification('Error de conexion', 'error'); }
                break;
            }
            case 'exp-share-tienda': {
                const shareHandle = btn.dataset.handle;
                const shareName = btn.dataset.name || 'Tienda';
                const shareUrl = 'https://latanda.online/tienda/' + encodeURIComponent(shareHandle);
                if (navigator.share) {
                    navigator.share({ title: shareName + ' en La Tanda', url: shareUrl }).catch(() => {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        window.marketplaceSystem?.showNotification('Link copiado', 'success');
                    }).catch(() => {});
                }
                e.stopPropagation();
                break;
            }
            case 'exp-view-tienda': {
                const handle = btn.dataset.handle || btn.closest('.tc-card')?.dataset?.handle;
                if (handle) window.location.href = '/tienda/' + encodeURIComponent(handle);
                break;
            }
            case 'exp-view-producto': {
                if (typeof viewProduct === 'function') viewProduct(id);
                break;
            }
            case 'exp-view-servicio': {
                if (typeof viewService === 'function') viewService(id);
                break;
            }
            case 'exp-retry': {
                const msR = window.marketplaceSystem;
                if (msR && !msR._expLoading) msR.loadExplorarFeed(msR._expTab, false);
                break;
            }
            case 'retry-bookings': {
                window.marketplaceSystem?.loadBookingsData();
                break;
            }
            case 'retry-purchases': {
                window.marketplaceSystem?.loadMyPurchases();
                break;
            }
            case 'mc-switch-tab': {
                const mcTab = btn.dataset.mcTab;
                if (mcTab) window.marketplaceSystem?.switchPurchaseTab(mcTab);
                break;
            }
            case 'mc-order-detail': {
                window.marketplaceSystem?.openOrderDetail(id);
                break;
            }
            case 'mc-buyer-cancel': {
                window.marketplaceSystem?.handleBuyerOrderAction(id, 'cancel');
                break;
            }
            case 'mc-buyer-confirm': {
                window.marketplaceSystem?.handleBuyerOrderAction(id, 'confirm_delivery');
                break;
            }
            case 'mc-product-review': {
                const prodId = btn.dataset.productId;
                window.marketplaceSystem?.openProductReview(id, prodId);
                break;
            }
            case 'mc-submit-review': {
                const sOrderId = btn.dataset.orderId;
                const sProdId = btn.dataset.productId;
                window.marketplaceSystem?._submitProductReview(sOrderId, sProdId);
                break;
            }
            case 'mc-close-review': {
                document.getElementById('mcReviewOverlay')?.remove();
                break;
            }
            case 'mc-open-dispute-form': {
                const disputeOrderId = btn.dataset.orderId;
                const disputeBookingId = btn.dataset.bookingId;
                window.marketplaceSystem?.openDisputeModal(disputeOrderId, disputeBookingId);
                break;
            }
            case 'mc-submit-dispute': {
                window.marketplaceSystem?._submitDispute();
                break;
            }
            case 'mc-close-dispute-form': {
                document.getElementById('mcDisputeOverlay')?.remove();
                break;
            }
            case 'mc-open-disputes': {
                window.marketplaceSystem?.openDisputesList();
                break;
            }
            case 'mc-view-dispute': {
                window.marketplaceSystem?.openDisputeDetail(id);
                break;
            }
            case 'mc-respond-dispute': {
                window.marketplaceSystem?._respondToDispute(id);
                break;
            }
            case 'mc-close-dispute': {
                window.marketplaceSystem?._closeDispute(id);
                break;
            }
            case 'mc-close-detail': {
                document.getElementById('mcDetailOverlay')?.remove();
                break;
            }
            case 'open-cart': {
                window.marketplaceSystem?.openCartModal();
                break;
            }
            case 'mc-close-cart': {
                document.getElementById('mcCartOverlay')?.remove();
                break;
            }
            case 'mc-cart-remove': {
                const rmPid = btn.dataset.productId;
                if (rmPid) { window.marketplaceSystem?._removeFromCart(rmPid); window.marketplaceSystem?.openCartModal(); }
                break;
            }
            case 'mc-checkout': {
                window.marketplaceSystem?.handleCartCheckout();
                break;
            }
            case 'retry-conversations': {
                window.marketplaceSystem?.loadConversations();
                break;
            }
            // Tier/subscription actions
            case 'close-tier-prompt': {
                btn.closest('.tier-upgrade-prompt')?.remove();
                break;
            }
            case 'open-upgrade-modal': {
                const msUp = window.marketplaceSystem;
                if (msUp && !msUp.isGuest) msUp.openUpgradeModal();
                else if (msUp) msUp.showLoginPrompt('ver planes');
                break;
            }
            case 'close-upgrade-modal': {
                btn.closest('.upgrade-overlay')?.remove();
                break;
            }
            case 'select-upgrade-tier': {
                window.marketplaceSystem?.selectUpgradeTier(id);
                break;
            }
            case 'upgrade-back-to-tiers': {
                const tiersStep = document.getElementById('upgradeTiersStep');
                const payStep = document.getElementById('upgradePaymentStep');
                if (tiersStep) tiersStep.style.display = 'block';
                if (payStep) payStep.style.display = 'none';
                break;
            }
            case 'confirm-upgrade': {
                window.marketplaceSystem?.confirmUpgrade();
                break;
            }
        }
    });
}

// Delegated change handlers for order filters and inline stock
document.addEventListener('change', (e) => {
    // Buyer order status filter
    if (e.target.classList.contains('mc-filter')) {
        window.marketplaceSystem?._filterBuyerOrders(e.target.value);
        return;
    }
    // Cart quantity change
    if (e.target.dataset.action === 'mc-cart-qty') {
        const pid = e.target.dataset.productId;
        const qty = parseInt(e.target.value) || 1;
        if (pid) {
            window.marketplaceSystem?._updateCartQty(pid, qty);
            window.marketplaceSystem?.openCartModal();
        }
        return;
    }
    // Order filter dropdown
    if (e.target.classList.contains('sd-order-filter')) {
        window.marketplaceSystem?.filterOrders(e.target.value);
        return;
    }
    // Inline stock update
    if (e.target.classList.contains('sd-inline-stock')) {
        const ms = window.marketplaceSystem;
        if (!ms) return;
        const productId = e.target.dataset.productId;
        const newQty = parseInt(e.target.value);
        if (!productId || isNaN(newQty) || newQty < 0 || newQty > 10000) return;
        ms.apiRequest(`/api/marketplace/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: newQty })
        }).then(res => {
            if (res.success) ms.showNotification('Stock actualizado', 'success');
            else ms.showNotification(t('marketplace.stock_error',{defaultValue:'Error al actualizar stock'}), 'error');
        }).catch(() => ms.showNotification(t('marketplace.stock_error',{defaultValue:'Error al actualizar stock'}), 'error'));
    }
});

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.marketplaceSystem = new MarketplaceSocialSystem();
    window.ms = window.marketplaceSystem; // Alias for shorter references
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketplaceSocialSystem;
}
// Build version stamp — check console to verify deploys
window._imgCacheBust = Date.now();
console.log('%c[La Tanda] marketplace v4.25.10-imgfix loaded', 'color: #8B5CF6; font-weight: bold;');
