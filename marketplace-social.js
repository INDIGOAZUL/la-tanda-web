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

class MarketplaceSocialSystem {
    constructor() {
        this.API_BASE = 'https://latanda.online';
        this.currentUser = this.getCurrentUser();
        this.authToken = this.getAuthToken();
        this.isGuest = !this.currentUser || this.currentUser.id === 'guest';

        // System state
        this.products = [];
        this.services = [];
        this.posts = [];
        this.orders = [];
        this.reviews = [];
        this.badges = [];
        this.bookings = [];

        // Messaging state
        this.conversations = [];
        this.currentConversation = null;
        this.messages = [];
        this.unreadCount = 0;

        // Subscription tiers
        this.subscriptionTiers = {
            guest: {
                name: 'Invitado',
                price: 0,
                features: ['Explorar productos y servicios', 'Ver listados'],
                restrictions: ['No puede comprar', 'No puede reservar', 'No puede publicar']
            },
            free: {
                name: 'Gratis',
                price: 0,
                features: ['Crear cuenta', 'Guardar favoritos', 'Mensajería limitada (5/día)'],
                restrictions: ['No puede reservar servicios', 'Sin reseñas']
            },
            plan: {
                name: 'Plan',
                price: 99,
                features: ['Reservar servicios', 'Mensajería ilimitada', 'Publicar reseñas', 'Soporte prioritario'],
                restrictions: []
            },
            premium: {
                name: 'Premium',
                price: 299,
                features: ['Reservas prioritarias', 'Citas recurrentes', '10% descuento', 'Listados destacados', 'Soporte VIP'],
                restrictions: []
            },
            tanda_member: {
                name: 'Miembro Tanda',
                price: 0,
                badge: '🎯',
                features: [
                    'Acceso completo GRATIS',
                    'Listar productos y servicios',
                    'Promocionar listados',
                    'Reservas ilimitadas',
                    'Mensajería ilimitada',
                    'Comisiones de referidos',
                    'Soporte prioritario'
                ],
                restrictions: []
            }
        };

        // Current user subscription (default to free for logged users, guest for non-logged)
        this.userSubscription = this.isGuest ? 'guest' : (this.currentUser?.subscription || 'free');

        // Market statistics
        this.marketStats = {
            totalProducts: 1247,
            totalSellers: 342,
            totalTransactions: 5673,
            totalVolume: 89200,
            totalServices: 156,
            totalProviders: 89
        };

        // User reputation
        this.userReputation = {
            score: 4.8,
            reviews: 156,
            transactions: 156,
            successRate: 98.7,
            badges: 12,
            level: 'Gold'
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
                this.loadSocialData(),
                this.loadMarketplaceStats(),
                this.loadUserSubscription()
            ]);

            this.updateAllDisplays();
            this.updateGuestUI();
            this.updateSubscriptionUI();
            this.populateCategoryFilters();

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

            const sub = response.data?.subscription || response.subscription;
            if (response.success && sub) {
                this.subscriptionData = sub;
                this.userSubscription = sub.tier || 'free';

                // Log tanda member status
                if (sub.is_tanda_benefit) {
                }

            }
        } catch (error) {
            this.userSubscription = 'free';
            this.subscriptionData = null;
        }
    }

    // Populate category filter dropdowns with API data
    populateCategoryFilters() {
        const serviceCategoryFilter = document.getElementById('serviceCategoryFilter');
        if (serviceCategoryFilter && this.categoriesData) {
            serviceCategoryFilter.innerHTML = '<option value="">Todas las Categorías</option>';
            this.categoriesData.forEach(cat => {
                if (cat.is_active) {
                    serviceCategoryFilter.innerHTML += `
                        <option value="${cat.category_id}">${cat.icon} ${cat.name_es}</option>
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

        // Show/hide elements based on guest status
        document.querySelectorAll('[data-requires-auth]').forEach(el => {
            if (this.isGuest) {
                el.classList.add('guest-restricted');
            } else {
                el.classList.remove('guest-restricted');
            }
        });
    }

    // Subscription tier UI updates
    updateSubscriptionUI() {
        const tierBadge = document.getElementById('userTierBadge');
        if (tierBadge) {
            const tier = this.subscriptionTiers[this.userSubscription];
            const tierColors = {
                guest: '#6B7280',
                free: '#10B981',
                plan: '#8B5CF6',
                premium: '#F59E0B',
                tanda_member: '#00FFFF'
            };

            // Special badge for tanda members
            if (this.userSubscription === 'tanda_member') {
                tierBadge.innerHTML = `
                    <span style="background: linear-gradient(135deg, #00FFFF, #7FFFD8); color: #0f172a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(0, 255, 255, 0.3);">
                        🎯 ${this.escapeHtml(tier.name)} <span style="font-size: 10px; opacity: 0.8;">GRATIS</span>
                    </span>
                `;

                // Show tanda benefit banner if not already shown
                this.showTandaBenefitBanner();
            } else {
                tierBadge.innerHTML = `
                    <span style="background: ${tierColors[this.userSubscription]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        ${this.escapeHtml(tier.name)}${this.userSubscription !== 'guest' && tier.price > 0 ? ` - L.${tier.price}/mes` : ''}
                    </span>
                `;
            }
        }
    }

    // Show special banner for tanda members
    showTandaBenefitBanner() {
        // Only show once per session
        if (sessionStorage.getItem('tanda_benefit_shown')) return;

        const banner = document.createElement('div');
        banner.id = 'tandaBenefitBanner';
        banner.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(127, 255, 216, 0.1));
            border: 1px solid rgba(0, 255, 255, 0.4);
            border-radius: 16px;
            padding: 16px 24px;
            z-index: 9999;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 255, 255, 0.2);
            max-width: 90%;
            text-align: center;
            animation: slideDown 0.5s ease-out;
        `;

        const tandaDetails = this.subscriptionData?.tanda_status?.details;
        const detailsText = tandaDetails ?
            `(${tandaDetails.groups_created || 0} tandas creadas, ${tandaDetails.active_memberships || 0} membresías activas)` : '';

        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <span style="font-size: 28px;">🎯</span>
                <div>
                    <div style="font-weight: 600; color: #00FFFF; font-size: 16px;">¡Acceso Completo al Marketplace!</div>
                    <div style="color: rgba(255,255,255,0.8); font-size: 13px;">
                        Como miembro activo de La Tanda, tienes acceso GRATIS a todas las funciones ${detailsText}
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove(); sessionStorage.setItem('tanda_benefit_shown', 'true');"
                        style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">
                    Entendido
                </button>
            </div>
        `;

        document.body.appendChild(banner);

        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (banner.parentElement) {
                banner.style.animation = 'slideUp 0.3s ease-out forwards';
                setTimeout(() => banner.remove(), 300);
            }
            sessionStorage.setItem('tanda_benefit_shown', 'true');
        }, 8000);
    }

    // Check if user can perform action based on tier
    // Updated: All logged-in users can book/buy, tanda_member/premium gets extra perks
    canPerformAction(action) {
        const tierPermissions = {
            guest: ['browse', 'view'],
            free: ['browse', 'view', 'favorite', 'message', 'buy', 'book', 'review'],
            plan: ['browse', 'view', 'favorite', 'message', 'buy', 'book', 'review', 'priority_support'],
            premium: ['browse', 'view', 'favorite', 'message', 'buy', 'book', 'review', 'priority_book', 'recurring', 'discount', 'priority_support', 'featured_listing', 'list_service', 'promote'],
            tanda_member: ['browse', 'view', 'favorite', 'message', 'buy', 'book', 'review', 'priority_book', 'recurring', 'priority_support', 'featured_listing', 'list_service', 'promote', 'referral_commission']
        };
        return tierPermissions[this.userSubscription]?.includes(action) || false;
    }

    // Check if user is a tanda member (has free full access)
    isTandaMember() {
        return this.userSubscription === 'tanda_member' || this.subscriptionData?.is_tanda_benefit === true;
    }

    // Show upgrade prompt
    showUpgradePrompt(requiredTier, action) {
        const tier = this.subscriptionTiers[requiredTier];
        const modal = document.getElementById('upgradeModal');
        if (modal) {
            document.getElementById('upgradeRequiredTier').textContent = tier.name;
            document.getElementById('upgradePrice').textContent = `L.${tier.price}/mes`;
            document.getElementById('upgradeAction').textContent = action;
            document.getElementById('upgradeFeatures').innerHTML = tier.features.map(f => `<li>✅ ${f}</li>`).join('');
            modal.classList.add('active');
        } else {
            this.showNotification(`Necesitas ${this.escapeHtml(tier.name)} (L.${tier.price}/mes) para ${action}`, 'info');
        }
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
        
        // Subtab navigation (for orders)
        document.querySelectorAll('[data-subtab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const subtabName = e.target.dataset.subtab;
                if (subtabName) {
                    this.switchSubtab(subtabName);
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
        
        // Create post form
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreatePost();
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
    
    switchSubtab(subtabName) {
        // Update subtab buttons
        document.querySelectorAll('[data-subtab]').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-subtab="${subtabName}"]`).classList.add('active');
        
        // Load subtab content
        this.loadOrdersData(subtabName);
    }
    
    async loadSectionData(section) {
        switch (section) {
            case 'marketplace':
                this.loadMarketplaceProducts();
                break;
            case 'services':
                this.loadServicesSection();
                break;
            case 'social':
                this.loadSocialFeed();
                break;
            case 'my-store':
                this.loadMyStore();
                break;
            case 'orders':
                this.loadOrdersData('purchases');
                break;
            case 'bookings':
                this.loadBookingsData();
                break;
            case 'community':
                this.loadCommunityData();
                break;
            case 'reputation':
                this.loadReputationData();
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

    // Services section
    loadServicesSection() {
        this.loadFeaturedServices();
        this.loadRecentServices();
    }

    loadFeaturedServices() {
        const container = document.getElementById('featuredServices');
        if (!container) return;

        const featuredServices = this.services.filter(s => s.featured);
        container.innerHTML = featuredServices.map(service => this.createServiceCard(service)).join('');
    }

    loadRecentServices() {
        const container = document.getElementById('recentServices');
        if (!container) return;

        container.innerHTML = this.services.map(service => this.createServiceCard(service)).join('');
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
                        <button class="btn btn-primary" style="flex: 1;" data-action="book-service" data-id="${this.escapeHtml(service.id)}">
                            <span>📅</span> Reservar
                        </button>
                        <button class="btn btn-secondary share-btn" style="padding: 10px 14px;" data-action="share-service" data-id="${this.escapeHtml(service.id)}" title="Compartir y ganar ${this.formatPrice(parseFloat(estimatedCommission), cur)}">
                            <span>💰</span>
                        </button>
                    </div>
                    ${!this.isGuest ? `
                    <div class="commission-hint" style="text-align: center; margin-top: 8px; font-size: 11px; color: rgba(0,255,255,0.7);">
                        💰 Gana ${this.formatPrice(parseFloat(estimatedCommission), cur)} por cada reserva referida
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    filterServices() {
        const searchTerm = document.getElementById('serviceSearchInput')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('serviceCategoryFilter')?.value || '';

        let filteredServices = this.services.filter(service => {
            const matchesSearch = service.title.toLowerCase().includes(searchTerm) ||
                                service.description.toLowerCase().includes(searchTerm) ||
                                service.provider.name.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || service.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });

        this.displayFilteredServices(filteredServices);
    }

    displayFilteredServices(services) {
        const container = document.getElementById('recentServices');
        if (!container) return;

        if (services.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                    <h3>No se encontraron servicios</h3>
                    <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = services.map(service => this.createServiceCard(service)).join('');
    }

    // Booking system
    async loadBookingsData() {
        const container = document.getElementById('bookingsContent');
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
                        <button class="btn btn-primary" style="margin-top: 15px;" onclick="goToLogin()">Iniciar Sesión</button>
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
                            <button class="btn btn-primary" style="margin-top: 15px;" onclick="window.marketplaceSystem.switchTab('services')">Ver Servicios</button>
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
                    <p>${error.message || 'Intenta de nuevo más tarde'}</p>
                    <button class="btn btn-secondary" style="margin-top: 15px;" onclick="window.marketplaceSystem.loadBookingsData()">Reintentar</button>
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
                            <button class="btn btn-danger" data-action="cancel-booking" data-id="${this.escapeHtml(booking.id)}">Cancelar</button>
                            <button class="btn btn-secondary" data-action="contact-provider" data-id="${this.escapeHtml(booking.id)}">Contactar</button>
                        ` : booking.status === 'confirmed' ? `
                            <button class="btn btn-secondary" data-action="reschedule-booking" data-id="${this.escapeHtml(booking.id)}">Reprogramar</button>
                            <button class="btn btn-secondary" data-action="contact-provider" data-id="${this.escapeHtml(booking.id)}">Contactar</button>
                        ` : booking.status === 'completed' ? `
                            <button class="btn btn-primary" data-action="leave-review" data-id="${this.escapeHtml(booking.id)}">Dejar Reseña</button>
                            <button class="btn btn-secondary" data-action="rebook-service" data-id="${this.escapeHtml(booking.id)}">Reservar de Nuevo</button>
                        ` : `
                            <button class="btn btn-secondary" data-action="contact-provider" data-id="${this.escapeHtml(booking.id)}">Contactar</button>
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

        const service = this.services.find(s => s.id === serviceId);
        if (!service) {
            this.showNotification('Servicio no encontrado', 'error');
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
            this.showNotification('Servicio no encontrado', 'error');
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
            this.showNotification(error.message || 'Error al crear la reserva. Intenta de nuevo.', 'error');
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
                        rating: 4.5 // TODO: Implement product reviews
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

    async loadSocialData() {
        try {
            // Cargar posts mock
            const mockPosts = [
                {
                    id: 'post_001',
                    user: {
                        id: 'user_001',
                        name: 'María González',
                        avatar: 'M'
                    },
                    content: '¡Acabo de completar mi primera tanda con éxito! 🎉 La experiencia ha sido increíble y he conocido personas maravillosas en el proceso.',
                    type: 'achievement',
                    timestamp: new Date('2024-02-16T10:30:00'),
                    likes: 23,
                    comments: 5,
                    shares: 2
                },
                {
                    id: 'post_002',
                    user: {
                        id: 'user_002',
                        name: 'Carlos Ruiz',
                        avatar: 'C'
                    },
                    content: '¿Alguien ha probado el nuevo sistema de staking? Me gustaría saber sus experiencias antes de participar.',
                    type: 'question',
                    timestamp: new Date('2024-02-16T09:15:00'),
                    likes: 12,
                    comments: 8,
                    shares: 1
                },
                {
                    id: 'post_003',
                    user: {
                        id: 'user_003',
                        name: 'Ana Silva',
                        avatar: 'A'
                    },
                    content: 'Consejo del día: Siempre diversifica tus participaciones en tandas. No pongas todos los huevos en la misma canasta 💡',
                    type: 'tip',
                    timestamp: new Date('2024-02-15T16:45:00'),
                    likes: 45,
                    comments: 12,
                    shares: 8
                }
            ];
            
            this.posts = mockPosts;
        } catch (error) {
        }
    }
    
    updateAllDisplays() {
        this.updateMarketStats();
        this.loadMarketplaceProducts();
        this.loadServicesSection();
        this.loadSocialFeed();
    }
    
    updateMarketStats() {
        const el1 = document.getElementById('totalProducts');
        const el2 = document.getElementById('totalSellers');
        const el3 = document.getElementById('totalTransactions');
        const el4 = document.getElementById('totalVolume');
        if (el1) el1.textContent = this.marketStats.totalProducts.toLocaleString();
        if (el2) el2.textContent = this.marketStats.totalSellers.toLocaleString();
        if (el3) el3.textContent = this.marketStats.totalTransactions.toLocaleString();
        if (el4) el4.textContent = `${(this.marketStats.totalVolume / 1000).toFixed(1)}K`;
    }
    
    loadMarketplaceProducts() {
        this._expOffset = 0;
        this._expTab = 'exp-tiendas';
        this._expLoading = false;
        this._expCategory = null;
        this._expTabsSetup = false;
        this._setupExpTabs();
        this._loadExpCategoryPills('exp-tiendas');
        this.loadExplorarFeed('exp-tiendas', false);
    }

    _setupExpTabs() {
        if (this._expTabsSetup) return;
        this._expTabsSetup = true;
        const tabsContainer = document.querySelector('.exp-tabs');
        if (!tabsContainer) return;
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.exp-tab');
            if (!tab || tab.classList.contains('active')) return;
            tabsContainer.querySelectorAll('.exp-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.dataset.expTab;
            this._expTab = tabId;
            this._expOffset = 0;
            this._expCategory = null;
            this._loadExpCategoryPills(tabId);
            this.loadExplorarFeed(tabId, false);
        });

        const pillsContainer = document.getElementById('expCategoryPills');
        if (pillsContainer) {
            pillsContainer.addEventListener('click', (e) => {
                const pill = e.target.closest('.exp-pill');
                if (!pill || pill.classList.contains('active')) return;
                pillsContainer.querySelectorAll('.exp-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this._expCategory = pill.dataset.value || null;
                this._expOffset = 0;
                this.loadExplorarFeed(this._expTab, false);
            });
        }
    }

    _loadExpCategoryPills(tab) {
        const container = document.getElementById('expCategoryPills');
        if (!container) return;
        if (tab === 'exp-tiendas') {
            const cities = ['Todos', 'Tegucigalpa', 'San Pedro Sula', 'La Ceiba', 'Comayagua', 'Choluteca'];
            container.innerHTML = cities.map((c, i) =>
                '<button class="exp-pill' + (i === 0 ? ' active' : '') + '" data-value="' + (i === 0 ? '' : this.escapeHtml(c)) + '">' + this.escapeHtml(c) + '</button>'
            ).join('');
        } else {
            const cats = this.categoriesData || [];
            let html = '<button class="exp-pill active" data-value="">Todos</button>';
            cats.forEach(c => {
                html += '<button class="exp-pill" data-value="' + this.escapeHtml(String(c.category_id)) + '">' + this.escapeHtml(c.icon || '') + ' ' + this.escapeHtml(c.name_es || c.name || '') + '</button>';
            });
            container.innerHTML = html;
        }
    }

    async loadExplorarFeed(tab, append) {
        if (this._expLoading) return;
        this._expLoading = true;
        const container = document.getElementById('expFeedContainer');
        const loadMoreEl = document.getElementById('expLoadMore');
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
        } else if (tab === 'exp-productos' || tab === 'exp-recientes') {
            url = '/api/marketplace/products?limit=' + limit + '&offset=' + this._expOffset;
            if (cat) url += '&category=' + encodeURIComponent(cat);
        } else if (tab === 'exp-servicios') {
            url = '/api/marketplace/services?limit=' + limit + '&offset=' + this._expOffset;
            if (cat) url += '&category=' + encodeURIComponent(cat);
        }

        try {
            const resp = await this.apiRequest(url);
            const d = resp.data || resp;
            let items = [];
            if (tab === 'exp-tiendas') items = d.providers || [];
            else if (tab === 'exp-servicios') items = d.services || [];
            else items = d.products || [];

            if (items.length === 0 && !append) {
                container.innerHTML = '<div class="exp-empty"><div class="exp-empty-icon">📭</div><div class="exp-empty-text">No se encontraron resultados</div></div>';
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

    _renderExpCard(item, tab) {
        const esc = (v) => this.escapeHtml(String(v || ''));
        if (tab === 'exp-tiendas') {
            const avatar = item.profile_image || item.avatar_url;
            const initial = (item.business_name || 'T').charAt(0).toUpperCase();
            const avatarHtml = avatar
                ? '<img src="' + esc(avatar) + '" alt="" loading="lazy">'
                : '<span class="exp-card-initial">' + esc(initial) + '</span>';
            const verified = item.is_verified ? ' <span class="exp-verified" title="Verificado">✓</span>' : '';
            const rating = item.avg_rating ? ('<span>⭐ ' + Number(item.avg_rating).toFixed(1) + '</span>') : '';
            const reviews = item.total_reviews ? ('<span>(' + esc(item.total_reviews) + ')</span>') : '';
            const city = item.city ? ('<span>📍 ' + esc(item.city) + '</span>') : '';
            const shopType = item.shop_type === 'services' ? 'Servicios' : item.shop_type === 'products' ? 'Productos' : 'Tienda';
            return '<div class="exp-card" data-action="exp-view-tienda" data-handle="' + esc(item.handle) + '">' +
                '<div class="exp-card-avatar">' + avatarHtml + '</div>' +
                '<div class="exp-card-body">' +
                    '<div class="exp-card-title">' + esc(item.business_name) + verified + '</div>' +
                    '<div class="exp-card-meta">' + rating + reviews + city + '</div>' +
                    '<div class="exp-card-badge">' + esc(shopType) + '</div>' +
                '</div>' +
                '<div class="exp-card-action"><span class="exp-arrow">→</span></div>' +
            '</div>';
        }
        if (tab === 'exp-servicios') {
            const img = (Array.isArray(item.images) && item.images.length > 0)
                ? '<img src="' + esc(typeof item.images[0] === 'object' ? item.images[0].url : item.images[0]) + '" alt="" loading="lazy">'
                : '<span class="exp-card-icon">🛠️</span>';
            const priceLabel = item.price_type === 'fixed' ? ('L. ' + Number(item.price || 0).toLocaleString('es-HN')) : item.price_type === 'range' ? ('L. ' + Number(item.price || 0).toLocaleString('es-HN') + ' - ' + Number(item.price_max || 0).toLocaleString('es-HN')) : (item.price_type === 'hourly' ? ('L. ' + Number(item.price || 0).toLocaleString('es-HN') + '/hora') : 'Consultar');
            const rating = item.avg_rating ? ('⭐ ' + Number(item.avg_rating).toFixed(1)) : '';
            const catPill = item.category_name ? ('<div class="exp-card-badge">' + esc(item.category_icon || '') + ' ' + esc(item.category_name) + '</div>') : '';
            return '<div class="exp-card" data-action="exp-view-servicio" data-id="' + esc(item.service_id) + '">' +
                '<div class="exp-card-avatar">' + img + '</div>' +
                '<div class="exp-card-body">' +
                    '<div class="exp-card-title">' + esc(item.title) + '</div>' +
                    '<div class="exp-card-sub"><span class="exp-card-price">' + priceLabel + '</span>' + (rating ? ' · ' + rating : '') + '</div>' +
                    catPill +
                '</div>' +
                '<div class="exp-card-action"><span class="exp-arrow">→</span></div>' +
            '</div>';
        }
        // Products (exp-productos, exp-recientes)
        const pImg = (Array.isArray(item.images) && item.images.length > 0)
            ? '<img src="' + esc(typeof item.images[0] === 'object' ? item.images[0].url : item.images[0]) + '" alt="" loading="lazy">'
            : '<span class="exp-card-icon">📦</span>';
        const condMap = { new: 'Nuevo', used: 'Usado', refurbished: 'Reacondicionado' };
        const cond = condMap[item.condition] || '';
        const catPill = item.category_name ? ('<div class="exp-card-badge">' + esc(item.category_icon || '') + ' ' + esc(item.category_name) + '</div>') : '';
        return '<div class="exp-card" data-action="exp-view-producto" data-id="' + esc(item.id) + '">' +
            '<div class="exp-card-avatar">' + pImg + '</div>' +
            '<div class="exp-card-body">' +
                '<div class="exp-card-title">' + esc(item.title) + '</div>' +
                '<div class="exp-card-sub"><span class="exp-card-price">L. ' + Number(item.price || 0).toLocaleString('es-HN') + '</span>' + (cond ? ' · ' + esc(cond) : '') + '</div>' +
                catPill +
            '</div>' +
            '<div class="exp-card-action"><span class="exp-arrow">→</span></div>' +
        '</div>';
    }
    
    loadSocialFeed() {
        const container = document.getElementById('socialFeed');
        if (!container) return;
        
        const sortedPosts = this.posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        container.innerHTML = sortedPosts.map(post => this.createPostCard(post)).join('');
    }
    
    createPostCard(post) {
        const timeAgo = this.getTimeAgo(post.timestamp);
        const typeIcons = {
            achievement: '🏆',
            question: '❓',
            tip: '💡',
            announcement: '📢',
            general: '💬'
        };
        
        return `
            <div class="social-post">
                <div class="post-header">
                    <div class="user-avatar">${post.user.avatar}</div>
                    <div class="user-info">
                        <div class="user-name">${post.user.name} ${typeIcons[post.type] || ''}</div>
                        <div class="post-time">${timeAgo}</div>
                    </div>
                </div>
                <div class="post-content">${this.escapeHtml(post.content)}</div>
                <div class="post-actions">
                    <button class="action-btn ${post.liked ? 'active' : ''}" data-action="toggle-like" data-id="${this.escapeHtml(post.id)}">
                        <span>👍</span> ${this.escapeHtml(post.likes)}
                    </button>
                    <button class="action-btn" data-action="show-comments" data-id="${this.escapeHtml(post.id)}">
                        <span>💬</span> ${this.escapeHtml(post.comments)}
                    </button>
                    <button class="action-btn" data-action="share-post" data-id="${this.escapeHtml(post.id)}">
                        <span>📤</span> ${post.shares}
                    </button>
                </div>
            </div>
        `;
    }
    
    filterProducts() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const priceFilter = document.getElementById('priceFilter')?.value || '';
        const locationFilter = document.getElementById('locationFilter')?.value || '';
        
        let filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                product.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            const matchesPrice = this.matchesPriceRange(product.price, priceFilter);
            
            return matchesSearch && matchesCategory && matchesPrice;
        });
        
        this.displayFilteredProducts(filteredProducts);
    }
    
    matchesPriceRange(price, priceFilter) {
        if (!priceFilter) return true;
        
        const [min, max] = priceFilter.includes('-') 
            ? priceFilter.split('-').map(Number)
            : priceFilter === '1000+' 
                ? [1000, Infinity]
                : [0, Infinity];
        
        return price >= min && price <= max;
    }
    
    displayFilteredProducts(products) {
        const container = document.getElementById('recentProducts');
        if (!container) return;
        
        if (products.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                    <h3>No se encontraron productos</h3>
                    <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
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

        // Fetch total provider count for early adopter banner
        let totalProviders = 0;
        try {
            const res = await this.apiRequest('/api/marketplace/providers?limit=1&offset=0');
            if (res.success && res.data?.providers) {
                const countRes = await this.apiRequest('/api/marketplace/providers?limit=100&offset=0');
                totalProviders = countRes.data?.providers?.length || 0;
            }
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
            <div class="store-subtitle">Selecciona que vas a ofrecer. Esta eleccion no se puede cambiar despues.</div>
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

    // ===================== LAYOUT PICKER (Onboarding Step 2) =====================
    renderStoreLayoutPicker() {
        const container = document.getElementById('myStoreContent');
        if (!container) return;
        const typeLabel = this._selectedShopType === 'services' ? '🔧 Servicios' : '📦 Productos';
        container.innerHTML = `<div class="store-onboarding">
            ${this._earlyBannerHtml || ''}
            <div class="store-type-selected">
                <span class="store-type-chip">${typeLabel}</span>
                <button class="store-type-change" data-action="change-shop-type">Cambiar</button>
            </div>
            <div class="store-onboarding-icon">🎨</div>
            <h2>Elige el estilo de tu tienda</h2>
            <div class="store-subtitle">Puedes cambiarlo despues.</div>
            <div class="store-layout-grid">
                <div class="store-layout-card" data-action="select-layout" data-id="classic">
                    <div class="store-layout-preview">
                        <div class="slp-header"><div class="slp-avatar"></div><div class="slp-lines"><div class="slp-line w60"></div><div class="slp-line w40"></div></div></div>
                        <div class="slp-stats"><span></span><span></span><span></span><span></span></div>
                        <div class="slp-section"><div class="slp-line w80"></div><div class="slp-line w50"></div></div>
                    </div>
                    <div class="store-layout-name">Clasica</div>
                    <div class="store-layout-desc">Header, estadisticas, secciones</div>
                </div>
                <div class="store-layout-card" data-action="select-layout" data-id="showcase">
                    <div class="store-layout-preview">
                        <div class="slp-banner"><div class="slp-line w60" style="background:rgba(6,182,212,0.4);"></div></div>
                        <div class="slp-gallery"><span></span><span></span><span></span><span></span></div>
                        <div class="slp-section"><div class="slp-line w40"></div></div>
                    </div>
                    <div class="store-layout-name">Escaparate</div>
                    <div class="store-layout-desc">Banner, galeria, testimonios</div>
                </div>
                <div class="store-layout-card" data-action="select-layout" data-id="compact">
                    <div class="store-layout-preview slp-compact-prev">
                        <div class="slp-avatar-lg"></div>
                        <div class="slp-line w40" style="margin:0 auto;"></div>
                        <div class="slp-mini-stats"><span></span><span></span><span></span></div>
                        <div class="slp-btns"><span></span><span></span></div>
                    </div>
                    <div class="store-layout-name">Tarjeta</div>
                    <div class="store-layout-desc">Compacta, tipo red social</div>
                </div>
            </div>
        </div>`;
    }

    // ===================== THEME PICKER (Onboarding Step 3) =====================
    renderStoreThemePicker() {
        const container = document.getElementById('myStoreContent');
        if (!container) return;
        const typeLabel = this._selectedShopType === 'services' ? '🔧 Servicios' : '📦 Productos';
        const layoutLabels = { classic: 'Clasica', showcase: 'Escaparate', compact: 'Tarjeta' };
        const layoutLabel = layoutLabels[this._selectedLayout] || 'Clasica';
        container.innerHTML = `<div class="store-onboarding">
            ${this._earlyBannerHtml || ''}
            <div class="store-type-selected">
                <span class="store-type-chip">${typeLabel}</span>
                <span class="store-type-chip">🎨 ${this.escapeHtml(layoutLabel)}</span>
                <button class="store-type-change" data-action="change-layout">Cambiar</button>
            </div>
            <div class="store-onboarding-icon">🎨</div>
            <h2>Elige tu tema de color</h2>
            <div class="store-subtitle">Puedes cambiarlo despues.</div>
            <div class="store-theme-grid">
                <div class="store-theme-card" data-action="select-theme" data-id="dark">
                    <div class="store-theme-swatch"><span style="background:#8B5CF6;"></span><span style="background:#06B6D4;"></span></div>
                    <div class="store-theme-name">Oscuro</div>
                </div>
                <div class="store-theme-card" data-action="select-theme" data-id="cyan">
                    <div class="store-theme-swatch"><span style="background:#06B6D4;"></span><span style="background:#14B8A6;"></span></div>
                    <div class="store-theme-name">Cyan / Tech</div>
                </div>
                <div class="store-theme-card" data-action="select-theme" data-id="gold">
                    <div class="store-theme-swatch"><span style="background:#F59E0B;"></span><span style="background:#D97706;"></span></div>
                    <div class="store-theme-name">Dorado</div>
                </div>
                <div class="store-theme-card" data-action="select-theme" data-id="green">
                    <div class="store-theme-swatch"><span style="background:#10B981;"></span><span style="background:#059669;"></span></div>
                    <div class="store-theme-name">Verde / Eco</div>
                </div>
                <div class="store-theme-card" data-action="select-theme" data-id="coral">
                    <div class="store-theme-swatch"><span style="background:#EF4444;"></span><span style="background:#F97316;"></span></div>
                    <div class="store-theme-name">Rojo / Coral</div>
                </div>
                <div class="store-theme-card" data-action="select-theme" data-id="purple">
                    <div class="store-theme-swatch"><span style="background:#A855F7;"></span><span style="background:#7C3AED;"></span></div>
                    <div class="store-theme-name">Purpura</div>
                </div>
            </div>
        </div>`;
    }

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
                <div class="store-form-section">Links sociales (opcional)</div>
                <div class="store-form-group">
                    <label>Sitio Web</label>
                    <input type="url" id="storeLinkWebsite" maxlength="500" placeholder="https://mi-sitio.com">
                </div>
                <div class="store-form-row">
                    <div class="store-form-group">
                        <label>GitHub</label>
                        <input type="url" id="storeLinkGithub" maxlength="500" placeholder="https://github.com/user">
                    </div>
                    <div class="store-form-group">
                        <label>LinkedIn</label>
                        <input type="url" id="storeLinkLinkedin" maxlength="500" placeholder="https://linkedin.com/in/user">
                    </div>
                </div>
                <button type="submit" class="store-btn-create" id="storeCreateBtn">Crear mi Tienda</button>
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
                const website = document.getElementById('storeLinkWebsite').value.trim();
                const github = document.getElementById('storeLinkGithub').value.trim();
                const linkedin = document.getElementById('storeLinkLinkedin').value.trim();
                if (website) socialLinks.website = website;
                if (github) socialLinks.github = github;
                if (linkedin) socialLinks.linkedin = linkedin;

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
                        this.showNotification('Error al crear la tienda', 'error');
                        btn.disabled = false;
                        btn.textContent = 'Crear mi Tienda';
                    }
                } catch (err) {
                    this.showNotification('Error al crear la tienda', 'error');
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

        if (showServices) {
            try {
                const providerDetail = await this.apiRequest(`/api/marketplace/providers/${provider.provider_id}`);
                if (providerDetail.success && providerDetail.data?.provider?.services) {
                    services = providerDetail.data.provider.services;
                }
            } catch (e) { /* ok */ }
        }

        if (showProducts) {
            try {
                const prodRes = await this.apiRequest(`/api/marketplace/products?sellerId=${provider.user_id}&limit=20`);
                if (prodRes.success && prodRes.data?.products) {
                    products = prodRes.data.products;
                }
            } catch (e) { /* ok */ }
        }

        try {
            const revRes = await this.apiRequest(`/api/marketplace/providers/${provider.provider_id}/reviews?limit=5`);
            if (revRes.success && revRes.data?.reviews) {
                reviews = revRes.data.reviews;
            }
        } catch (e) { /* ok */ }

        return { services, products, reviews, showServices, showProducts };
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
        switch (layout) {
            case 'showcase': this._renderDashboardShowcase(container, provider, storeData, theme); break;
            case 'compact':  this._renderDashboardCompact(container, provider, storeData, theme); break;
            default:         this._renderDashboardClassic(container, provider, storeData, theme); break;
        }
        // Portfolio banner (v4.5.0)
        const handle = provider.handle;
        if (handle) {
            const esc = (v) => this.escapeHtml(String(v ?? ''));
            const dashboard = container.querySelector('.store-dashboard');
            if (dashboard) {
                const banner = document.createElement('div');
                banner.className = 'store-portfolio-banner';
                banner.innerHTML = `<span>Tu portafolio publico:</span> <a href="/negocio/${esc(handle)}" target="_blank">latanda.online/negocio/${esc(handle)}</a> <button data-action="copy-portfolio-url" data-url="https://latanda.online/negocio/${esc(handle)}">Copiar</button>`;
                dashboard.insertBefore(banner, dashboard.firstChild);
            }
        }
        // Portfolio / CV CTA (v4.6.0)
        try {
            const cvRes = await this.apiRequest('/api/marketplace/portfolio/cv/me');
            this._currentPortfolio = cvRes.data?.portfolio || null;
        } catch { this._currentPortfolio = null; }
        const dashboard2 = container.querySelector('.store-dashboard');
        if (dashboard2) {
            const cta = document.createElement('div');
            cta.className = 'store-portfolio-cta';
            cta.innerHTML = `<button class="store-btn-portfolio" data-action="open-portfolio-maker">${this._currentPortfolio ? 'Editar Portafolio / CV' : 'Crear Portafolio / CV'}</button>`;
            const banner2 = dashboard2.querySelector('.store-portfolio-banner');
            if (banner2) { banner2.after(cta); } else { dashboard2.insertBefore(cta, dashboard2.firstChild); }
        }
    }

    // ===================== PORTFOLIO / CV MAKER (v4.6.0) =====================

    async openPortfolioMaker() {
        const container = document.getElementById('myStoreContent');
        if (!container) return;
        const esc = (v) => this.escapeHtml(String(v ?? ''));

        // Fetch user identity + portfolio
        let portfolio = this._currentPortfolio || null;
        let userName = '', userEmail = '';
        try {
            const res = await this.apiRequest('/api/marketplace/portfolio/cv/me');
            portfolio = res.data?.portfolio || null;
            userName = portfolio?.full_name || '';
            userEmail = portfolio?.email || '';
        } catch { /* use defaults */ }

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
        if (missing) { this.showNotification('Completa los campos obligatorios', 'error'); return; }
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
        if (handle) doc.text(`Generado desde latanda.online/negocio/${handle} - ${new Date().toLocaleDateString('es-HN')}`, 15, footerY + 4);

        doc.save(`CV-${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        this.showNotification('CV descargado', 'success');
    }

    // ===================== CLASSIC LAYOUT =====================
    _renderDashboardClassic(container, provider, storeData, theme) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const initial = (provider.business_name || provider.user_name || 'T').charAt(0).toUpperCase();
        const avatarHtml = provider.profile_image
            ? `<img src="${esc(provider.profile_image)}" alt="">`
            : esc(initial);
        const badges = this._buildBadgesHtml(provider);
        const loc = [provider.city, provider.neighborhood].filter(Boolean).join(', ');
        const contactItems = this._buildContactItems(provider);
        const { services, products, showServices, showProducts } = storeData;
        const servicesHtml = this._buildStoreItemCards(services, 'services');
        const productsHtml = this._buildStoreItemCards(products, 'products');

        container.innerHTML = `<div class="store-dashboard" data-layout="classic" data-theme="${esc(theme)}">
            <div class="store-header">
                <div class="store-avatar">${avatarHtml}</div>
                <div class="store-info">
                    <div class="store-name">${esc(provider.business_name || 'Mi Tienda')} ${badges}</div>
                    ${loc ? `<div class="store-location">📍 ${esc(loc)}</div>` : ''}
                </div>
                <div class="store-actions">
                    <button class="store-btn-edit" data-action="edit-store">✏️ Editar Tienda</button>
                </div>
            </div>

            <div class="store-stats-grid">
                <div class="store-stat-card">
                    <div class="store-stat-value store-stat-rating">⭐ ${esc(provider.avg_rating || '0')}</div>
                    <div class="store-stat-label">Rating</div>
                </div>
                <div class="store-stat-card">
                    <div class="store-stat-value store-stat-jobs">${esc(provider.completed_jobs || 0)}</div>
                    <div class="store-stat-label">Trabajos</div>
                </div>
                <div class="store-stat-card">
                    <div class="store-stat-value store-stat-reviews">${esc(provider.total_reviews || 0)}</div>
                    <div class="store-stat-label">Resenas</div>
                </div>
                <div class="store-stat-card">
                    <div class="store-stat-value store-stat-response">${esc(provider.response_rate || 100)}%</div>
                    <div class="store-stat-label">Respuesta</div>
                </div>
            </div>

            ${showServices ? `<div class="store-section">
                <div class="store-section-header">
                    <div class="store-section-title">Mis Servicios (${services.length})</div>
                    <button class="store-section-btn" data-action="add-service">+ Agregar</button>
                </div>
                ${servicesHtml}
            </div>` : ''}

            ${showProducts ? `<div class="store-section">
                <div class="store-section-header">
                    <div class="store-section-title">Mis Productos (${products.length})</div>
                    <button class="store-section-btn" data-action="add-product">+ Agregar</button>
                </div>
                ${productsHtml}
            </div>` : ''}

            <div class="store-section">
                <div class="store-section-header">
                    <div class="store-section-title">Informacion de Contacto</div>
                    <button class="store-section-btn" data-action="edit-store">Editar</button>
                </div>
                <div class="store-contact-grid">${contactItems}</div>
            </div>
        </div>`;
    }

    // ===================== SHOWCASE LAYOUT =====================
    _renderDashboardShowcase(container, provider, storeData, theme) {
        const esc = (v) => this.escapeHtml(String(v ?? ''));
        const badges = this._buildBadgesHtml(provider);
        const loc = [provider.city, provider.neighborhood].filter(Boolean).join(', ');
        const contactItems = this._buildContactItems(provider);
        const { services, products, reviews, showServices, showProducts } = storeData;
        const servicesHtml = this._buildStoreItemCards(services, 'services');
        const productsHtml = this._buildStoreItemCards(products, 'products');

        // Collect images for gallery from services + products
        const allImages = [];
        services.forEach(s => { if (s.images) s.images.forEach(img => allImages.push({ url: img, title: s.title })); });
        products.forEach(p => { if (p.images) p.images.forEach(img => allImages.push({ url: img, title: p.title })); });
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
                                <div class="store-testimonial-rating">${'⭐'.repeat(Math.min(Math.max(Math.round(r.overall_rating || 0), 0), 5))}</div>
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

        container.innerHTML = `<div class="store-dashboard" data-layout="showcase" data-theme="${esc(theme)}">
            <div class="store-showcase-hero">
                <div class="store-showcase-hero-content">
                    <div class="store-name">${esc(provider.business_name || 'Mi Tienda')} ${badges}</div>
                    ${loc ? `<div class="store-location" style="margin-top:4px;">📍 ${esc(loc)}</div>` : ''}
                    <div class="store-showcase-mini-stats">
                        <span class="store-stat-rating">⭐ ${esc(provider.avg_rating || '0')}</span>
                        <span class="store-stat-jobs">${esc(provider.completed_jobs || 0)} trabajos</span>
                        <span class="store-stat-reviews">${esc(provider.total_reviews || 0)} resenas</span>
                    </div>
                </div>
                <div class="store-actions">
                    <button class="store-btn-edit" data-action="edit-store">✏️ Editar</button>
                </div>
            </div>

            ${galleryHtml}
            ${testimonialsHtml}

            ${showServices ? `<div class="store-section">
                <div class="store-section-header">
                    <div class="store-section-title">Servicios (${services.length})</div>
                    <button class="store-section-btn" data-action="add-service">+ Agregar</button>
                </div>
                ${servicesHtml}
            </div>` : ''}

            ${showProducts ? `<div class="store-section">
                <div class="store-section-header">
                    <div class="store-section-title">Productos (${products.length})</div>
                    <button class="store-section-btn" data-action="add-product">+ Agregar</button>
                </div>
                ${productsHtml}
            </div>` : ''}

            <div class="store-section">
                <div class="store-section-header">
                    <div class="store-section-title">Contacto</div>
                    <button class="store-section-btn" data-action="edit-store">Editar</button>
                </div>
                <div class="store-contact-grid">${contactItems}</div>
            </div>
        </div>`;
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
        const { services, products, showServices, showProducts } = storeData;

        // Unified items list
        const allItems = [];
        if (showServices) services.forEach(s => allItems.push({ ...s, _type: 'service' }));
        if (showProducts) products.forEach(p => allItems.push({ ...p, _type: 'product' }));
        const itemsHtml = allItems.length > 0
            ? allItems.map(item => {
                const icon = item._type === 'service' ? '🔧' : '📦';
                const img = item.images && item.images[0] ? `<img src="${esc(item.images[0])}" alt="">` : icon;
                const meta = item._type === 'service'
                    ? `${item.price_type === 'fixed' ? `L. ${esc(item.price)}` : esc(item.price_type)}`
                    : `L. ${esc(item.price)}`;
                return `<div class="store-item-card">
                    <div class="store-item-img">${img}</div>
                    <div class="store-item-info">
                        <div class="store-item-title">${esc(item.title)}</div>
                        <div class="store-item-meta">${meta}</div>
                    </div>
                </div>`;
            }).join('')
            : '<div class="store-empty">No tienes listados aun.</div>';

        // Action buttons
        const actionBtns = [];
        actionBtns.push('<button class="store-compact-action-btn" data-action="edit-store">✏️ Editar</button>');
        if (showServices) actionBtns.push('<button class="store-compact-action-btn" data-action="add-service">+ Servicio</button>');
        if (showProducts) actionBtns.push('<button class="store-compact-action-btn" data-action="add-product">+ Producto</button>');

        container.innerHTML = `<div class="store-dashboard" data-layout="compact" data-theme="${esc(theme)}">
            <div class="store-compact-card">
                <div class="store-compact-avatar">${avatarHtml}</div>
                <div class="store-compact-name">${esc(provider.business_name || 'Mi Tienda')}</div>
                <div class="store-compact-badges">${badges}</div>
                ${provider.description ? `<div class="store-compact-desc">${esc(provider.description.length > 120 ? provider.description.slice(0, 120) + '...' : provider.description)}</div>` : ''}
                <div class="store-compact-stats">
                    <div class="store-compact-stat"><span class="store-stat-rating">⭐ ${esc(provider.avg_rating || '0')}</span><small>Rating</small></div>
                    <div class="store-compact-stat"><span class="store-stat-jobs">${esc(provider.completed_jobs || 0)}</span><small>Trabajos</small></div>
                    <div class="store-compact-stat"><span class="store-stat-reviews">${esc(provider.total_reviews || 0)}</span><small>Listados</small></div>
                </div>
                <div class="store-compact-actions">${actionBtns.join('')}</div>
            </div>

            <div class="store-section">
                <div class="store-section-header"><div class="store-section-title">Listados (${allItems.length})</div></div>
                ${itemsHtml}
            </div>

            <div class="store-section">
                <div class="store-section-header">
                    <div class="store-section-title">Contacto</div>
                </div>
                <div class="store-contact-grid">${contactItems}</div>
            </div>
        </div>`;
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
        overlay.className = 'store-edit-overlay';
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
                        this.showNotification('Error al subir imagen', 'error');
                        avatarBtn.textContent = 'Cambiar logo';
                    }
                } catch (err) {
                    this.showNotification('Error al subir imagen', 'error');
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
                const selectedLayout = activeLayout ? activeLayout.dataset.id : currentLayout;
                const selectedTheme = activeTheme ? activeTheme.dataset.id : currentTheme;

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
                        this.showNotification('Error al guardar', 'error');
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Guardar Cambios';
                    }
                } catch (err) {
                    this.showNotification('Error al guardar', 'error');
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Guardar Cambios';
                }
            });
        }
    }

    loadOrdersData(type = 'purchases') {
        const container = document.getElementById('ordersContent');
        if (!container) return;
        
        // Mock orders data
        const mockOrders = [
            {
                id: 'order_001',
                product: 'Smartphone Premium',
                seller: 'TechStore',
                buyer: 'Mi Usuario',
                amount: 850,
                status: 'completed',
                date: new Date('2024-02-10'),
                type: 'purchase'
            },
            {
                id: 'order_002',
                product: 'Café Premium',
                seller: 'Mi Tienda',
                buyer: 'Ana Silva',
                amount: 45,
                status: 'pending',
                date: new Date('2024-02-15'),
                type: 'sale'
            }
        ];
        
        const filteredOrders = mockOrders.filter(order => 
            type === 'purchases' ? order.type === 'purchase' : order.type === 'sale'
        );
        
        container.innerHTML = filteredOrders.map(order => `
            <div class="social-post">
                <div class="post-header">
                    <div class="user-avatar">${order.product.charAt(0)}</div>
                    <div class="user-info">
                        <div class="user-name">${order.product}</div>
                        <div class="post-time">${type === 'purchases' ? 'Vendido por' : 'Comprado por'} ${type === 'purchases' ? order.seller : order.buyer}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: #10B981;">${order.amount} LTD</div>
                        <div style="font-size: 12px; color: ${order.status === 'completed' ? '#10B981' : '#F59E0B'};">
                            ${order.status === 'completed' ? '✅ Completado' : '⏳ Pendiente'}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    loadCommunityData() {
        // Load community statistics and events
        const topContributors = [
            { name: 'María González', avatar: 'M', contributions: 45, reputation: 4.9 },
            { name: 'Carlos Ruiz', avatar: 'C', contributions: 38, reputation: 4.8 },
            { name: 'Ana Silva', avatar: 'A', contributions: 32, reputation: 4.7 }
        ];
        
        const container = document.getElementById('topContributors');
        if (container) {
            container.innerHTML = topContributors.map(user => `
                <div style="display: flex; justify-content: between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="user-avatar" style="width: 40px; height: 40px; font-size: 16px;">${user.avatar}</div>
                        <div>
                            <div style="font-weight: 600;">${user.name}</div>
                            <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">${user.contributions} contribuciones</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #8B5CF6; font-weight: 600;">⭐ ${user.reputation}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    loadReputationData() {
        // Load user badges
        const badges = [
            { name: 'Primera Venta', icon: '🎯', earned: true },
            { name: 'Vendedor Confiable', icon: '🛡️', earned: true },
            { name: 'Cliente Frecuente', icon: '🛒', earned: true },
            { name: 'Contributor Activo', icon: '💬', earned: true },
            { name: 'Mentor Comunidad', icon: '👨‍🏫', earned: false },
            { name: 'Influencer', icon: '⭐', earned: false }
        ];
        
        const container = document.getElementById('userBadges');
        if (container) {
            container.innerHTML = badges.map(badge => `
                <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, ${badge.earned ? '0.1' : '0.03'}); border-radius: 12px; opacity: ${badge.earned ? '1' : '0.5'};">
                    <div style="font-size: 32px; margin-bottom: 8px;">${badge.icon}</div>
                    <div style="font-size: 12px; font-weight: 600;">${badge.name}</div>
                </div>
            `).join('');
        }
        
        // Load recent reviews
        const reviews = [
            { reviewer: 'Ana Silva', rating: 5, comment: 'Excelente vendedor, producto tal como se describe.', date: new Date('2024-02-10') },
            { reviewer: 'Carlos Ruiz', rating: 5, comment: 'Muy profesional y rápida entrega.', date: new Date('2024-02-08') },
            { reviewer: 'María González', rating: 4, comment: 'Buena experiencia, recomendado.', date: new Date('2024-02-05') }
        ];
        
        const reviewsContainer = document.getElementById('recentReviews');
        if (reviewsContainer) {
            reviewsContainer.innerHTML = reviews.map(review => `
                <div class="social-post">
                    <div class="post-header">
                        <div class="user-avatar">${review.reviewer.charAt(0)}</div>
                        <div class="user-info">
                            <div class="user-name">${review.reviewer}</div>
                            <div class="post-time">${this.getTimeAgo(review.date)}</div>
                        </div>
                        <div style="color: #F59E0B;">
                            ${'⭐'.repeat(review.rating)}
                        </div>
                    </div>
                    <div class="post-content">${this.escapeHtml(review.comment)}</div>
                </div>
            `).join('');
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
                this.showNotification('Por favor completa todos los campos requeridos', 'error');
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
                this.showNotification('Error al publicar el producto', 'error');
            }
        } catch (error) {
            this.showNotification('Error al publicar el producto', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    }
    
    async handleCreatePost() {
        try {
            const content = document.getElementById('postContent').value;
            const type = document.getElementById('postType').value;
            
            if (!content.trim()) {
                this.showNotification('Por favor escribe algo para compartir', 'error');
                return;
            }
            
            // Simulate post creation
            const newPost = {
                id: 'post_' + Date.now(),
                user: {
                    id: this.currentUser.id,
                    name: this.currentUser.name,
                    avatar: this.currentUser.name.charAt(0).toUpperCase()
                },
                content: content,
                type: type,
                timestamp: new Date(),
                likes: 0,
                comments: 0,
                shares: 0
            };
            
            this.posts.unshift(newPost);
            
            this.closeCreatePostModal();
            this.loadSocialFeed();
            
            this.showNotification('¡Post publicado exitosamente!', 'success');
            
        } catch (error) {
            this.showNotification('Error al crear el post', 'error');
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
    
    closeCreatePostModal() {
        document.getElementById('createPostModal').classList.remove('active');
        document.getElementById('createPostForm').reset();
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
                    <p>${error.message || "Intenta de nuevo más tarde"}</p>
                    <button class="btn btn-secondary" style="margin-top: 15px;" onclick="window.marketplaceSystem.loadConversations()">
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
                <button class="btn btn-primary" onclick="goToLogin()">
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
                this._images[contextKey].push({ file, preview: e.target.result });
                this._renderImagePreviews(contextKey);
            };
            reader.readAsDataURL(file);
        }
    }

    _renderImagePreviews(contextKey) {
        const container = document.getElementById(contextKey + 'ImagePreviews');
        if (!container) return;
        const imgs = this._images?.[contextKey] || [];
        container.innerHTML = imgs.map((img, i) =>
            '<div class="store-image-preview">' +
                '<img loading="lazy" src="' + img.preview + '" alt="">' +
                '<button type="button" class="store-image-preview-remove" data-action="remove-' + this.escapeHtml(contextKey) + '-image" data-index="' + i + '">&times;</button>' +
            '</div>'
        ).join('');

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

    _removeImage(contextKey, index) {
        if (!this._images?.[contextKey]) return;
        this._images[contextKey].splice(index, 1);
        this._renderImagePreviews(contextKey);
    }

    async _uploadImages(contextKey) {
        const imgs = this._images?.[contextKey];
        if (!imgs || imgs.length === 0) return { success: true, data: { images: [] } };

        const formData = new FormData();
        for (const img of imgs) {
            const compressed = await this._compressImage(img.file);
            formData.append('images', compressed, compressed.name);
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
                        .filter(c => c.is_active)
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
        overlay.className = 'store-edit-overlay';
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
                            <div class="store-image-dropzone-hint">JPEG, PNG, WebP o GIF - Max 5MB cada una</div>
                        </div>
                        <div class="store-image-previews" id="serviceImagePreviews"></div>
                    </div>
                    <div class="store-form-group">
                        <label>Etiquetas (separadas por coma)</label>
                        <input type="text" id="csTags" placeholder="Ej: rapido, profesional, garantizado">
                    </div>
                    <div class="store-form-actions">
                        <button class="btn btn-secondary" data-action="close-create-service">Cancelar</button>
                        <button class="btn btn-primary" data-action="submit-service">&#128736; Publicar Servicio</button>
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
                this.showNotification('Por favor completa todos los campos requeridos', 'error');
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
                this.showNotification('Error al crear servicio', 'error');
            }
        } catch (error) {
            this.showNotification('Error al crear servicio', 'error');
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
        overlay.className = 'store-edit-overlay';
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
                            <div class="store-image-dropzone-hint">JPEG, PNG, WebP o GIF - Max 5MB cada una</div>
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
                        <button class="btn btn-secondary" data-action="close-create-product">Cancelar</button>
                        <button class="btn btn-primary" data-action="submit-product">&#128230; Publicar Producto</button>
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

function showCreatePostModal() {
    if (window.marketplaceSystem?.isGuest) {
        window.marketplaceSystem.showLoginPrompt('crear publicaciones');
        return;
    }
    document.getElementById('createPostModal').classList.add('active');
}

function closeCreatePostModal() {
    if (window.marketplaceSystem) {
        window.marketplaceSystem.closeCreatePostModal();
    }
}

function viewProduct(productId) {
    window.marketplaceSystem?.showNotification('Vista de producto en desarrollo', 'info');
}

function buyProduct(productId) {
    if (window.marketplaceSystem?.isGuest) {
        window.marketplaceSystem.showLoginPrompt('comprar productos');
        return;
    }
    window.marketplaceSystem?.showNotification('¡Producto agregado al carrito!', 'success');
}

function toggleLike(postId) {
    if (window.marketplaceSystem?.isGuest) {
        window.marketplaceSystem.showLoginPrompt('dar like');
        return;
    }
    window.marketplaceSystem?.showNotification('¡Like agregado!', 'success');
}

function showComments(postId) {
    window.marketplaceSystem?.showNotification('Comentarios en desarrollo', 'info');
}

function sharePost(postId) {
    window.marketplaceSystem?.showNotification('¡Post compartido!', 'success');
}

// Service-related global functions
function viewService(serviceId) {
    const service = window.marketplaceSystem?.services.find(s => s.id === serviceId);
    if (service) {
        window.marketplaceSystem?.showNotification(`${this.escapeHtml(service.title)} - ${this.escapeHtml(service.provider.name)}`, 'info');
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
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
        return;
    }

    try {
        const response = await window.marketplaceSystem?.apiRequest(`/api/marketplace/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'cancelled',
                cancellation_reason: 'Cancelado por el cliente'
            })
        });

        if (response?.success) {
            window.marketplaceSystem?.showNotification('Reserva cancelada exitosamente', 'success');
            window.marketplaceSystem?.loadBookingsData();
        } else {
            throw new Error(response?.error || 'Error al cancelar');
        }
    } catch (error) {
        window.marketplaceSystem?.showNotification(error.message || 'Error al cancelar la reserva', 'error');
    }
}

function rescheduleBooking(bookingId) {
    window.marketplaceSystem?.showNotification('Función de reprogramar en desarrollo', 'info');
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
            links.push(`<a href="${ms.escapeHtml(socialLinks.website)}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.25); border-radius: 10px; color: #00FFFF; text-decoration: none; font-weight: 600; transition: background 0.2s, transform 0.2s;"><span style="font-size: 24px;">🌐</span> ${ms.escapeHtml(new URL(socialLinks.website).hostname)}</a>`);
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
    window.marketplaceSystem?.showNotification('Sistema de reseñas en desarrollo', 'info');
    // In future: open review modal
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

            // Create modal
            const modal = document.createElement('div');
            modal.id = 'shareModal';
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2 class="modal-title">💰 Compartir y Ganar</h2>
                        <button class="close-btn" onclick="closeShareModal()">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 48px; margin-bottom: 10px;">${itemImage}</div>
                            <div style="font-size: 18px; font-weight: 600;">${itemTitle}</div>
                            <div style="color: rgba(255,255,255,0.7);">${itemOwner}</div>
                        </div>

                        <div style="background: linear-gradient(135deg, rgba(0,255,255,0.1), rgba(16,185,129,0.1)); border: 1px solid rgba(0,255,255,0.3); border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
                            <div style="font-size: 14px; color: rgba(255,255,255,0.7);">Ganas por cada ${actionText}</div>
                            <div style="font-size: 32px; font-weight: 700; color: #10B981;">${ms.formatPrice(parseFloat(estimatedCommission), item.currency || 'HNL')}</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.5);">${commissionPercent}% de comisión</div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Tu link de referido:</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="referralLinkInput" value="${referralLink}" readonly
                                       style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; font-size: 12px;">
                                <button onclick="copyReferralLink()" class="btn btn-secondary" style="padding: 12px 16px;">
                                    📋
                                </button>
                            </div>
                            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">
                                Código: ${referralCode}
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                            <button onclick="shareToWhatsApp('${encodeURIComponent(referralLink)}', '${encodeURIComponent(itemTitle)}')"
                                    class="share-social-btn" style="background: #25D366;">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button onclick="shareToTelegram('${encodeURIComponent(referralLink)}', '${encodeURIComponent(itemTitle)}')"
                                    class="share-social-btn" style="background: #0088cc;">
                                <i class="fab fa-telegram-plane"></i>
                            </button>
                            <button onclick="shareToFacebook('${encodeURIComponent(referralLink)}')"
                                    class="share-social-btn" style="background: #1877F2;">
                                <i class="fab fa-facebook-f"></i>
                            </button>
                            <button onclick="shareToTwitter('${encodeURIComponent(referralLink)}', '${encodeURIComponent(itemTitle)}')"
                                    class="share-social-btn" style="background: #1DA1F2;">
                                <i class="fab fa-twitter"></i>
                            </button>
                        </div>

                        <div style="text-align: center; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                            <a href="commission-system.html" style="color: #00FFFF; text-decoration: none; font-size: 14px;">
                                📊 Ver mi panel de comisiones →
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
                        transition: all 0.2s;
                    }
                    .share-social-btn:hover {
                        transform: scale(1.05);
                        filter: brightness(1.1);
                    }
                `;
                document.head.appendChild(style);
            }

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

// Subscription functions
function showUpgradeModal() {
    document.getElementById('subscriptionModal')?.classList.add('active');
}

function closeUpgradeModal() {
    document.getElementById('upgradeModal')?.classList.remove('active');
}

function closeSubscriptionModal() {
    document.getElementById('subscriptionModal')?.classList.remove('active');
}

function selectPlan(tier) {
    window.marketplaceSystem?.showNotification(`Plan ${tier} seleccionado. Redirigiendo al pago...`, 'success');
    closeSubscriptionModal();
}

function closeLoginPromptModal() {
    document.getElementById('loginPromptModal')?.classList.remove('active');
}

function goToLogin() {
    window.location.href = 'auth-enhanced.html?redirect=marketplace-social.html';
}

// Filter services
function filterServices() {
    if (window.marketplaceSystem) {
        window.marketplaceSystem.filterServices();
    }
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
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        switch (action) {
            case 'view-service': if (typeof viewService === 'function') viewService(id); break;
            case 'book-service': e.stopPropagation(); if (typeof bookService === 'function') bookService(id); break;
            case 'share-service': e.stopPropagation(); if (typeof showShareModal === 'function') showShareModal(id); break;
            case 'view-product': if (typeof viewProduct === 'function') viewProduct(id); break;
            case 'buy-product': e.stopPropagation(); if (typeof buyProduct === 'function') buyProduct(id); break;
            case 'share-product': e.stopPropagation(); if (typeof showShareModal === 'function') showShareModal(id, 'product'); break;
            case 'toggle-like': if (typeof toggleLike === 'function') toggleLike(id); break;
            case 'show-comments': if (typeof showComments === 'function') showComments(id); break;
            case 'share-post': if (typeof sharePost === 'function') sharePost(id); break;
            case 'cancel-booking': if (typeof cancelBooking === 'function') cancelBooking(id); break;
            case 'contact-provider': if (typeof contactProvider === 'function') contactProvider(id); break;
            case 'reschedule-booking': if (typeof rescheduleBooking === 'function') rescheduleBooking(id); break;
            case 'leave-review': if (typeof leaveReview === 'function') leaveReview(id); break;
            case 'rebook-service': if (typeof rebookService === 'function') rebookService(id); break;
            case 'edit-store': window.marketplaceSystem?.openEditStoreModal(); break;
            case 'close-edit-store': document.getElementById('storeEditOverlay')?.remove(); break;
            case 'view-my-store': window.marketplaceSystem?.loadMyStore(); break;
            case 'select-shop-type': {
                const ms = window.marketplaceSystem;
                if (!ms) break;
                if (id === 'mixed') {
                    ms.showNotification('Tipo Mixta disponible proximamente con Premium', 'info');
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
                if (msL && (id === 'classic' || id === 'showcase' || id === 'compact')) {
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
                if (msT && validThemes.includes(id)) {
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
                    ms3.openCreateServiceModal();
                }
                break;
            }
            case 'add-product': {
                const ms4 = window.marketplaceSystem;
                if (ms4?.isGuest) { ms4.showLoginPrompt('publicar productos'); break; }
                if (ms4?._currentProvider?.shop_type === 'services') {
                    ms4.showNotification('Tu tienda es de tipo Servicios. No puedes crear productos.', 'error');
                } else if (ms4) {
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
                        window.marketplaceSystem?.showNotification('URL copiada al portapapeles', 'success');
                    }).catch(() => {
                        window.marketplaceSystem?.showNotification('No se pudo copiar', 'error');
                    });
                }
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
                const fEndpoint = fType === 'services' ? '/services/' + fId : '/products/' + fId;
                btn.disabled = true;
                msF.apiRequest(fEndpoint, { method: 'PATCH', body: JSON.stringify({ featured: !wasFeatured }) })
                    .then(() => { msF.showNotification(wasFeatured ? 'Quitado de destacados' : 'Marcado como destacado', 'success'); msF.loadMyStore(); })
                    .catch(() => { msF.showNotification('Error al actualizar', 'error'); btn.disabled = false; });
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
                const mEndpoint = mType === 'services' ? '/services/' + mId : '/products/' + mId;
                btn.disabled = true;
                msM.apiRequest(mEndpoint, { method: 'PATCH', body: JSON.stringify({ display_order: newOrder }) })
                    .then(() => { msM.loadMyStore(); })
                    .catch(() => { msM.showNotification('Error al reordenar', 'error'); btn.disabled = false; });
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
                if (msE2) msE2.openCreateProductModal();
                break;
            }
            case 'exp-view-tienda': {
                const handle = btn.dataset.handle;
                if (handle) window.location.href = '/negocio/' + encodeURIComponent(handle);
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
                if (msR) msR.loadExplorarFeed(msR._expTab, false);
                break;
            }
        }
    });
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.marketplaceSystem = new MarketplaceSocialSystem();
    window.ms = window.marketplaceSystem; // Alias for shorter references
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketplaceSocialSystem;
}