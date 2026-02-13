/**
 * La Tanda - Marketplace & Social System
 * Sistema integrado de marketplace y red social con tokens LTD
 * Versión: 4.2.0 - Search, Filters & Skeletons
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
    
    // XSS prevention helper (v3.97.0 - Audit Round 22)
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text != null ? text : '');
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    async init() {
        // Show skeletons immediately while loading
        this.showAllSkeletons();
        try {
            this.setupEventListeners();

            // Load data in parallel for faster initialization
            await Promise.all([
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
            this.showNotification('Error inicializando el marketplace', 'error');
        }
    }

    // Load categories from API
    async loadCategories() {
        try {
            const response = await this.apiRequest('/api/marketplace/categories');
            const categories = response.data?.categories || response.categories;

            if (response.success && categories) {
                // Store as both array and object
                this.categoriesData = categories;

                // Convert to the frontend format (object with id: label)
                this.serviceCategories = {};
                categories.forEach(cat => {
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
                    totalProviders: parseInt(stats.total_providers) || this.marketStats.totalProviders,
                    avgRating: parseFloat(stats.avg_rating) || 4.8
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
            const subscription = response.data?.subscription || response.subscription;

            if (response.success && subscription) {
                this.subscriptionData = subscription;
                this.userSubscription = subscription.tier || 'free';

                // Log tanda member status
                if (subscription.is_tanda_benefit) {
                }


                // Update Tier Banner with subscription data
                if (typeof updateTierBannerFromSubscription === "function") {
                    updateTierBannerFromSubscription(this.userSubscription, subscription);
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
                        🎯 ${tier.name} <span style="font-size: 10px; opacity: 0.8;">GRATIS</span>
                    </span>
                `;

                // Show tanda benefit banner if not already shown
                this.showTandaBenefitBanner();
            } else {
                tierBadge.innerHTML = `
                    <span style="background: ${tierColors[this.userSubscription]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        ${tier.name}${this.userSubscription !== 'guest' && tier.price > 0 ? ` - L.${tier.price}/mes` : ''}
                    </span>
                `;
            }
        }

        // Update services tier banner
        this.updateServicesTierBanner();
    }

    // Update the tier info banner in Services section - Layered Model
    // Layers: Visitor -> Registered User -> Bonuses (Plan Paid + Tanda Member)
    updateServicesTierBanner() {
        const container = document.getElementById('tierInfoContent');
        if (!container) return;

        // Determine user layers
        const isGuest = this.isGuest;
        const isRegistered = !isGuest;
        const hasPaidPlan = ['plan', 'premium'].includes(this.userSubscription);
        const isTandaMember = this.userSubscription === 'tanda_member' || this.subscriptionData?.is_tanda_benefit;
        const paidTier = hasPaidPlan ? this.userSubscription : null;

        // Get user display info
        const userName = this.currentUser?.name || this.currentUser?.username || 'Usuario';
        const userInitial = userName.charAt(0).toUpperCase();

        // Build badges based on active layers
        let badgesHTML = '';

        if (isGuest) {
            badgesHTML = `<span class="tier-badge visitor">👁️ Visitante</span>`;
        } else {
            badgesHTML = `<span class="tier-badge registered">👤 Usuario</span>`;

            if (isTandaMember) {
                badgesHTML += `<span class="tier-badge tanda-member">🎯 Miembro Tanda</span>`;
            }

            if (hasPaidPlan) {
                const planLabel = paidTier === 'premium' ? '👑 Premium' : '⭐ Plan';
                badgesHTML += `<span class="tier-badge plan-paid">${planLabel}</span>`;
            }
        }

        // Determine benefits based on combined layers
        let benefits = [];
        let lockedBenefits = [];

        // Layer 1: Everyone (Visitors)
        benefits.push({ text: '👀 Explorar' });
        benefits.push({ text: '🛒 Comprar' });

        if (isGuest) {
            // Visitors can browse and buy, but need to register for more
            lockedBenefits.push({ text: '💬 Mensajes' });
            lockedBenefits.push({ text: '📅 Reservar' });
        } else {
            // Layer 2: Registered Users
            const msgLimit = isTandaMember || hasPaidPlan ? '💬 Mensajes ∞' : '💬 Mensajes (5/día)';
            benefits.push({ text: msgLimit });
            benefits.push({ text: '⭐ Favoritos' });

            if (isTandaMember || hasPaidPlan) {
                // Layer 3: Tanda Member OR Paid Plan benefits
                benefits.push({ text: '📅 Reservar' });
                benefits.push({ text: '✍️ Reseñas' });

                if (isTandaMember || paidTier === 'premium') {
                    benefits.push({ text: '🚀 Prioridad' });
                }

                if (isTandaMember) {
                    benefits.push({ text: '💵 Comisiones' });
                }

                if (paidTier === 'premium') {
                    benefits.push({ text: '💰 10% desc.' });
                }
            } else {
                // Free registered user - show what they could unlock
                lockedBenefits.push({ text: '📅 Reservar' });
                lockedBenefits.push({ text: '🚀 Prioridad' });
            }
        }

        // Build benefits HTML
        const benefitsHTML = benefits.map(b => `<span class="tier-benefit">✅ ${b.text}</span>`).join('');
        const lockedHTML = lockedBenefits.map(b => `<span class="tier-benefit locked">🔒 ${b.text}</span>`).join('');

        // Determine upgrade action
        let upgradeHTML = '';
        if (isGuest) {
            upgradeHTML = `
                <div class="tier-actions">
                    <button class="tier-upgrade-btn" onclick="goToLogin()">🚀 Crear Cuenta</button>
                </div>`;
        } else if (!isTandaMember && !hasPaidPlan) {
            upgradeHTML = `
                <div class="tier-actions">
                    <button class="tier-upgrade-btn tanda" onclick="window.location.href='grupos.html'" title="Únete a una tanda y obtén beneficios gratis">🎯 Unirse a Tanda</button>
                </div>`;
        }

        // Build status message
        let statusMsg = isGuest ? 'Regístrate para más beneficios' :
                        isTandaMember ? '¡Beneficios por ser miembro activo!' :
                        hasPaidPlan ? (paidTier === 'premium' ? 'Plan Premium' : 'Plan activo') :
                        'Cuenta gratuita';

        // Apply special styling for tanda members
        container.parentElement.style.cssText = isTandaMember ?
            'background: linear-gradient(135deg, rgba(0, 255, 255, 0.08), rgba(6, 182, 212, 0.05)); border: 1px solid rgba(0, 255, 255, 0.3);' : '';

        container.innerHTML = `
            <div class="tier-user-level">
                <div class="tier-user-avatar">${isGuest ? '👁️' : userInitial}</div>
                <div class="tier-user-info">
                    <span class="tier-user-name">${isGuest ? 'Visitante' : userName}</span>
                    <span class="tier-user-status">${statusMsg}</span>
                </div>
            </div>
            <div class="tier-badges">${badgesHTML}</div>
            <div class="tier-benefits">${benefitsHTML}${lockedHTML}</div>
            ${upgradeHTML}
        `;
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
            this.showNotification(`Necesitas ${tier.name} (L.${tier.price}/mes) para ${action}`, 'info');
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

        // Delegated click handler for data-action buttons (v3.97.0 - Audit Round 22)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const serviceId = btn.dataset.serviceId;
            const productId = btn.dataset.productId;
            const postId = btn.dataset.postId;
            const bookingId = btn.dataset.bookingId;

            e.stopPropagation();
            switch (action) {
                // Service actions
                case 'book': if (serviceId) bookService(serviceId); break;
                case 'share': if (serviceId) showShareModal(serviceId); else if (productId) showShareModal(productId, 'product'); break;
                // Product actions
                case 'buy': if (productId) buyProduct(productId); break;
                case 'contact-seller': {
                    const sellerId = btn.dataset.sellerId;
                    const sellerName = btn.dataset.sellerName;
                    const prodName = btn.dataset.productName;
                    if (productId) window.ms?.contactSeller(productId, sellerId, sellerName, prodName);
                    break;
                }
                case 'edit': if (productId) editProduct(productId); break;
                case 'delete': if (productId) deleteProduct(productId); break;
                // Post actions
                case 'like': if (postId) toggleLike(postId); break;
                case 'comments': if (postId) showComments(postId); break;
                case 'share-post': if (postId) sharePost(postId); break;
                // Booking actions
                case 'cancel-booking': if (bookingId) cancelBooking(bookingId); break;
                case 'contact-provider': if (bookingId) contactProvider(bookingId); break;
                case 'reschedule': if (bookingId) rescheduleBooking(bookingId); break;
                case 'leave-review': if (bookingId) leaveReview(bookingId); break;
                case 'rebook': if (bookingId) rebookService(bookingId); break;
            }

            // Conversation open-chat
            const chatItem = e.target.closest('[data-action="open-chat"]');
            if (chatItem) {
                const userId = chatItem.dataset.userId;
                const userName = chatItem.dataset.userName;
                const prodId = chatItem.dataset.productId || null;
                const prodTitle = chatItem.dataset.productTitle || '';
                window.ms?.openChat(userId, userName, prodId, prodTitle);
            }
        });

        // Delegated click for service/product cards (view detail)
        document.addEventListener('click', (e) => {
            const serviceCard = e.target.closest('.service-card[data-service-id]');
            if (serviceCard && !e.target.closest('[data-action]')) {
                viewService(serviceCard.dataset.serviceId);
                return;
            }
            const productCard = e.target.closest('.product-card[data-product-id]');
            if (productCard && !e.target.closest('[data-action]')) {
                viewProduct(productCard.dataset.productId);
            }
        });
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.dataset.tab) {
                tab.classList.remove('active');
            }
        });
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) tabBtn.classList.add('active');

        // Sync sidebar nav items
        document.querySelectorAll('.mp-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const sidebarItem = document.querySelector(`.mp-nav-item[onclick*="'${tabName}'"]`);
        if (sidebarItem) sidebarItem.classList.add('active');

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
                this.loadMyProducts();
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
            case 'messages':
                this.loadConversations();
                break;
            case 'reputation':
                this.loadReputationData();
                break;
        }
    }

    // Services section
    loadServicesSection() {
        this.updateServicesTierBanner();
        this.updateServicesStats();
        this.loadFeaturedServices();
        this.loadRecentServices();
    }

    // Update services stats in UI
    updateServicesStats() {
        const activeCount = document.getElementById('servicesActiveCount');
        const providersCount = document.getElementById('servicesProvidersCount');
        const bookingsCount = document.getElementById('servicesBookingsCount');
        const avgRating = document.getElementById('servicesAvgRating');

        if (activeCount) activeCount.textContent = this.marketStats.totalServices.toLocaleString();
        if (providersCount) providersCount.textContent = this.marketStats.totalProviders.toLocaleString();
        if (bookingsCount) bookingsCount.textContent = this.marketStats.totalTransactions.toLocaleString();
        if (avgRating) avgRating.textContent = (this.marketStats.avgRating || 4.8).toFixed(1);
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

    createServiceCard(service) {
        const categoryLabel = this.serviceCategories[service.category] || service.category;
        const priceLabel = service.priceType === 'hourly' ? `L.${service.price}/hora` :
                          service.priceType === 'fixed' ? `L.${service.price}` : 'Cotizar';

        // Calculate potential commission (5% default)
        const commissionPercent = service.referralCommission || 5;
        const estimatedCommission = service.priceType === 'hourly'
            ? (service.price * service.duration * commissionPercent / 100).toFixed(0)
            : (service.price * commissionPercent / 100).toFixed(0);

        return `
            <div class="service-card" data-service-id="${this.escapeHtml(service.id)}">
                <div class="service-image">
                    <span>${this.escapeHtml(service.image)}</span>
                    ${service.provider.verified ? '<div class="service-badge verified">Verificado</div>' : ''}
                    ${service.featured ? '<div class="service-badge featured">Destacado</div>' : ''}
                </div>
                <div class="service-info">
                    <div class="service-category">${this.escapeHtml(categoryLabel)}</div>
                    <div class="service-title">${this.escapeHtml(service.title)}</div>
                    <div class="service-description">${this.escapeHtml(service.description)}</div>
                    <div class="service-provider">
                        <div class="provider-avatar">${this.escapeHtml(service.provider.avatar)}</div>
                        <div class="provider-info">
                            <div class="provider-name">${this.escapeHtml(service.provider.name)}</div>
                            <div class="provider-rating">⭐ ${this.escapeHtml(service.provider.rating)} (${this.escapeHtml(service.provider.completedJobs)} trabajos)</div>
                        </div>
                    </div>
                    <div class="service-details">
                        <div class="service-price">${this.escapeHtml(priceLabel)}</div>
                        <div class="service-duration">⏱️ ~${this.escapeHtml(service.duration)}h</div>
                    </div>
                    <div class="service-availability">
                        📅 ${(service.availability || []).map(a => this.escapeHtml(a)).join(' | ')}
                    </div>
                    <div class="service-areas">
                        📍 ${(service.serviceAreas || []).map(a => this.escapeHtml(a)).join(', ')}
                    </div>
                    <div class="service-actions" style="display: flex; gap: 8px; margin-top: 12px;">
                        <button class="btn btn-primary" style="flex: 1;" data-action="book" data-service-id="${this.escapeHtml(service.id)}">
                            <span>📅</span> Reservar
                        </button>
                        <button class="btn btn-secondary share-btn" style="padding: 10px 14px;" data-action="share" data-service-id="${this.escapeHtml(service.id)}" title="Compartir y ganar L.${this.escapeHtml(estimatedCommission)}">
                            <span>💰</span>
                        </button>
                    </div>
                    ${!this.isGuest ? `
                    <div class="commission-hint" style="text-align: center; margin-top: 8px; font-size: 11px; color: rgba(0,255,255,0.7);">
                        💰 Gana L.${estimatedCommission} por cada reserva referida
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
            const bookings = response.data?.bookings || response.bookings;

            if (response.success) {
                // Handle both array and empty response
                this.bookings = (bookings || []).map(b => ({
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
                throw new Error(response.message || 'Error al cargar reservas');
            }
        } catch (error) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h3>Error cargando reservas</h3>
                    <p>Intenta de nuevo más tarde</p>
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
                        <div class="user-avatar">${this.escapeHtml(booking.service.charAt(0))}</div>
                        <div class="user-info">
                            <div class="user-name">${this.escapeHtml(booking.service)}</div>
                            <div class="post-time">Proveedor: ${this.escapeHtml(booking.provider)} • ${this.escapeHtml(booking.bookingCode || '')}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: #10B981;">L.${this.escapeHtml(booking.price.toLocaleString())}</div>
                            <div style="font-size: 12px; color: ${this.escapeHtml(status.color)};">${this.escapeHtml(status.label)}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px; margin-top: 10px; color: rgba(255,255,255,0.7); font-size: 14px; flex-wrap: wrap;">
                        <span>📅 ${this.escapeHtml(booking.scheduledAt.toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}</span>
                        <span>🕐 ${this.escapeHtml(booking.scheduledAt.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }))}</span>
                        <span>⏱️ ${this.escapeHtml(booking.duration)}h</span>
                    </div>
                    ${booking.address ? `<div style="margin-top: 8px; color: rgba(255,255,255,0.6); font-size: 13px;">📍 ${this.escapeHtml(booking.address)}</div>` : ''}
                    <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                        ${booking.status === 'pending' ? `
                            <button class="btn btn-danger" data-action="cancel-booking" data-booking-id="${this.escapeHtml(booking.id)}">Cancelar</button>
                            <button class="btn btn-secondary" data-action="contact-provider" data-booking-id="${this.escapeHtml(booking.id)}">Contactar</button>
                        ` : booking.status === 'confirmed' ? `
                            <button class="btn btn-secondary" data-action="reschedule" data-booking-id="${this.escapeHtml(booking.id)}">Reprogramar</button>
                            <button class="btn btn-secondary" data-action="contact-provider" data-booking-id="${this.escapeHtml(booking.id)}">Contactar</button>
                        ` : booking.status === 'completed' ? `
                            <button class="btn btn-primary" data-action="leave-review" data-booking-id="${this.escapeHtml(booking.id)}">Dejar Reseña</button>
                            <button class="btn btn-secondary" data-action="rebook" data-booking-id="${this.escapeHtml(booking.id)}">Reservar de Nuevo</button>
                        ` : `
                            <button class="btn btn-secondary" data-action="contact-provider" data-booking-id="${this.escapeHtml(booking.id)}">Contactar</button>
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
            const estimatedPrice = service.priceType === 'hourly'
                ? service.price * service.duration
                : service.price;
            const priceText = service.priceType === 'hourly'
                ? `L.${service.price}/hora × ${service.duration}h = L.${estimatedPrice}`
                : service.priceType === 'quote'
                    ? `Precio estimado: L.${service.price}+ (cotizar)`
                    : `L.${service.price}`;

            document.getElementById('bookingPrice').textContent = priceText;
            document.getElementById('bookingServiceId').value = serviceId;

            // Show provider rating if available
            const ratingEl = document.getElementById('bookingProviderRating');
            if (ratingEl) {
                ratingEl.innerHTML = `⭐ ${service.provider.rating} (${service.provider.completedJobs} trabajos)`;
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
    // =====================================================
    // SKELETON LOADING STATES
    // =====================================================
    
    createProductSkeleton() {
        return `
            <div class="product-card-skeleton">
                <div class="skeleton-image">📦</div>
                <div class="skeleton-title"></div>
                <div class="skeleton-price"></div>
                <div class="skeleton-meta">
                    <div class="skeleton-badge"></div>
                    <div class="skeleton-badge"></div>
                </div>
                <div class="skeleton-button"></div>
            </div>
        `;
    }

    showProductSkeletons(containerId, count = 4) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const skeletons = Array(count).fill(null).map(() => this.createProductSkeleton()).join("");
        container.innerHTML = skeletons;
    }

    showAllSkeletons() {
        this.showProductSkeletons("featuredProducts", 3);
        this.showProductSkeletons("recentProducts", 8);
        this.showProductSkeletons("featuredServices", 3);
        this.showProductSkeletons("recentServices", 6);
    }

    
    async loadMarketplaceData() {
        try {
            // Fetch products from real API
            const response = await this.apiRequest('/api/marketplace/products');

            // API returns { success, data: { products } }
            const products = response.data?.products || response.products;

            if (response.success && products && products.length > 0) {
                // Transform API response to frontend format
                this.products = products.map(p => ({
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
            const services = response.data?.services || response.services;

            if (response.success && services) {
                // Transform API response to frontend format
                this.services = services.map(s => ({
                    id: `srv_${s.service_id}`,
                    serviceId: s.service_id,
                    title: s.title,
                    description: s.description || s.short_description || '',
                    category: s.category_id,
                    priceType: s.price_type,
                    price: parseFloat(s.price),
                    priceMax: s.price_max ? parseFloat(s.price_max) : null,
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
        const el1 = document.getElementById('totalProducts'); if(el1) el1.textContent = this.marketStats.totalProducts.toLocaleString();
        const el2 = document.getElementById('totalSellers'); if(el2) el2.textContent = this.marketStats.totalSellers.toLocaleString();
        const el3 = document.getElementById('totalTransactions'); if(el3) el3.textContent = this.marketStats.totalTransactions.toLocaleString();
        const el4 = document.getElementById('totalVolume'); if(el4) el4.textContent = `${(this.marketStats.totalVolume / 1000).toFixed(1)}K`;
    }
    
    loadMarketplaceProducts() {
        this.loadFeaturedProducts();
        this.loadRecentProducts();
                this.loadMyProducts();
    }
    
    loadFeaturedProducts() {
        const container = document.getElementById('featuredProducts');
        if (!container) return;
        
        const featuredProducts = this.products.filter(p => p.featured);
        
        container.innerHTML = featuredProducts.map(product => this.createProductCard(product)).join('');
    }
    
    loadRecentProducts() {
        const container = document.getElementById('recentProducts');
        if (!container) return;
        
        const recentProducts = this.products
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 8);
        
        container.innerHTML = recentProducts.map(product => this.createProductCard(product)).join('');
    }
    
    createProductCard(product) {
        const priceUSD = (product.price * 0.0847).toFixed(2); // Assuming 1 LTD = $0.0847

        // Calculate potential commission (5% default)
        const commissionPercent = product.referralCommission || 5;
        const estimatedCommission = (product.price * commissionPercent / 100).toFixed(0);

        return `
            <div class="product-card" data-product-id="${this.escapeHtml(product.id)}">
                <div class="product-image" style="overflow: hidden;">
                    ${product.images && product.images.length > 0 && product.images[0].url ? `<img src="${this.escapeHtml(product.images[0].thumbnail || product.images[0].url)}" style="width: 100%; height: 100%; object-fit: cover;" alt="${this.escapeHtml(product.name)}">` : `<span>${this.escapeHtml(product.image || "📦")}</span>`}
                    ${product.featured ? '<div class="product-badge">Destacado</div>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-title">${this.escapeHtml(product.name)}</div>
                    <div class="product-description">${this.escapeHtml(product.description)}</div>
                    <div class="product-price">
                        <div>
                            <div class="price-ltd">${this.escapeHtml(product.price)} LTD</div>
                            <div class="price-usd">≈ $${this.escapeHtml(priceUSD)} USD</div>
                        </div>
                        <div style="text-align: right; color: ${product.quantity > 0 ? '#10B981' : '#EF4444'}; font-size: 12px;">
                            ${product.quantity > 0 ? `${this.escapeHtml(product.quantity)} disponibles` : 'Agotado'}
                        </div>
                    </div>
                    <div class="product-seller">
                        <div class="seller-avatar">${this.escapeHtml(product.seller.avatar)}</div>
                        <div class="seller-info">
                            <div class="seller-name">${this.escapeHtml(product.seller.name)}</div>
                            <div class="seller-rating">⭐ ${this.escapeHtml(product.seller.rating)}/5.0</div>
                        </div>
                    </div>
                    <div class="product-actions" style="display: flex; gap: 8px; margin-top: 10px;">
                        <button class="btn btn-primary" style="flex: 1;" data-action="buy" data-product-id="${this.escapeHtml(product.id)}">
                            <span>🛒</span> Comprar
                        </button>
                        <button class="btn btn-secondary" style="padding: 10px 14px;" data-action="contact-seller" data-product-id="${this.escapeHtml(product.id)}" data-seller-id="${this.escapeHtml(product.seller_id || product.seller?.id)}" data-seller-name="${this.escapeHtml(product.seller?.name)}" data-product-name="${this.escapeHtml(product.name)}" title="Contactar vendedor">
                            <span>💬</span>
                        </button>
                        <button class="btn btn-secondary share-btn" style="padding: 10px 14px;" data-action="share" data-product-id="${this.escapeHtml(product.id)}" title="Compartir y ganar L.${this.escapeHtml(estimatedCommission)}">
                            <span>💰</span>
                        </button>
                    </div>
                    ${!this.isGuest ? `
                    <div class="commission-hint" style="text-align: center; margin-top: 8px; font-size: 11px; color: rgba(0,255,255,0.7);">
                        💰 Gana L.${estimatedCommission} por cada venta referida
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
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
                    <div class="user-avatar">${this.escapeHtml(post.user.avatar)}</div>
                    <div class="user-info">
                        <div class="user-name">${this.escapeHtml(post.user.name)} ${typeIcons[post.type] || ''}</div>
                        <div class="post-time">${this.escapeHtml(timeAgo)}</div>
                    </div>
                </div>
                <div class="post-content">${this.escapeHtml(post.content)}</div>
                <div class="post-actions">
                    <button class="action-btn ${post.liked ? 'active' : ''}" data-action="like" data-post-id="${this.escapeHtml(post.id)}">
                        <span>👍</span> ${this.escapeHtml(post.likes)}
                    </button>
                    <button class="action-btn" data-action="comments" data-post-id="${this.escapeHtml(post.id)}">
                        <span>💬</span> ${this.escapeHtml(post.comments)}
                    </button>
                    <button class="action-btn" data-action="share-post" data-post-id="${this.escapeHtml(post.id)}">
                        <span>📤</span> ${this.escapeHtml(post.shares)}
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

    // =====================================================
    // SEARCH PRODUCTS WITH API FILTERS
    // =====================================================
    async searchProducts() {
        const searchTerm = document.getElementById("searchInput")?.value || "";
        const categoryFilter = document.getElementById("categoryFilter")?.value || "";
        const priceFilter = document.getElementById("priceFilter")?.value || "";
        const locationFilter = document.getElementById("locationFilter")?.value || "";

        // Build query params
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (categoryFilter) params.append("category", categoryFilter);
        if (locationFilter) params.append("location", locationFilter);
        
        // Parse price range
        if (priceFilter) {
            const [min, max] = priceFilter.split("-").map(Number);
            if (min) params.append("minPrice", min);
            if (max) params.append("maxPrice", max);
        }

        // Show loading state
        const recentContainer = document.getElementById("recentProducts");
        const featuredContainer = document.getElementById("featuredProducts");
        
        if (recentContainer) {
            this.showProductSkeletons("recentProducts", 4);
        }

        try {
            const url = `/api/marketplace/products?${params.toString()}`;
            
            const response = await this.apiRequest(url);
            const products = response.data?.products || response.products || [];

            // Map API response
            const mappedProducts = products.map(p => ({
                id: `prod_${p.id}`,
                productId: p.id,
                name: p.title,
                description: p.description || "",
                price: parseFloat(p.price) || 0,
                category: p.category_id,
                seller: p.seller_name || "Vendedor",
                rating: 4.5,
                sales: p.views_count || 0,
                featured: p.is_featured,
                image: this.getProductIcon(p.category_id, p.images),
                location: p.location || "Honduras"
            }));

            // Update results count
            const total = response.data?.total || mappedProducts.length;
            this.updateSearchResultsHeader(searchTerm, total);

            // Display results
            if (mappedProducts.length === 0) {
                if (recentContainer) {
                    this.showProductSkeletons("recentProducts", 4);
                }
                if (featuredContainer) featuredContainer.innerHTML = "";
                return;
            }

            // Split into featured and recent
            const featured = mappedProducts.filter(p => p.featured);
            const recent = mappedProducts;

            if (featuredContainer && featured.length > 0) {
                featuredContainer.innerHTML = featured.map(p => this.createProductCard(p)).join("");
            } else if (featuredContainer) {
                featuredContainer.innerHTML = "";
            }

            if (recentContainer) {
                recentContainer.innerHTML = recent.map(p => this.createProductCard(p)).join("");
            }


        } catch (error) {
            if (recentContainer) {
                this.showProductSkeletons("recentProducts", 4);
            }
        }
    }

    updateSearchResultsHeader(searchTerm, total) {
        // Update the card header to show search results
        const header = document.querySelector("#marketplace .card-title");
        const subtitle = document.querySelector("#marketplace .card-subtitle");
        
        if (searchTerm && header) {
            header.textContent = `Resultados para "${searchTerm}"`;
            if (subtitle) subtitle.textContent = `${total} producto${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;
        }
    }

    clearFilters() {
        document.getElementById("searchInput").value = "";
        document.getElementById("categoryFilter").value = "";
        document.getElementById("priceFilter").value = "";
        document.getElementById("locationFilter").value = "";
        
        // Reset headers
        const header = document.querySelector("#marketplace .card:last-of-type .card-title");
        const subtitle = document.querySelector("#marketplace .card:last-of-type .card-subtitle");
        if (header) header.textContent = "Últimos Productos";
        if (subtitle) subtitle.textContent = "Recién agregados al marketplace";
        
        // Reload all products
        this.loadMarketplaceProducts();
    }
    

    // =====================================================
    // MESSAGING METHODS
    // =====================================================

    currentChat = {
        otherUserId: null,
        otherUserName: null,
        productId: null,
        productTitle: null
    };

    async loadConversations() {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        container.innerHTML = `
            <div class="conversations-loading">
                <div class="pulse" style="font-size: 32px;">💬</div>
                <p>Cargando conversaciones...</p>
            </div>
        `;

        try {
            const response = await this.apiRequest('/api/marketplace/messages/conversations');
            const conversations = response.data?.conversations || response.conversations || [];

            if (conversations.length === 0) {
                container.innerHTML = `
                    <div class="empty-conversations">
                        <div class="icon">💬</div>
                        <h3>No tienes conversaciones</h3>
                        <p>Cuando contactes a un vendedor o recibas mensajes, aparecerán aquí</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = conversations.map(conv => this.createConversationItem(conv)).join('');

            // Update unread badge
            const totalUnread = conversations.reduce((sum, c) => sum + (c.has_unread ? 1 : 0), 0);
            this.updateUnreadBadge(totalUnread);

        } catch (error) {
            container.innerHTML = `
                <div class="empty-conversations">
                    <div class="icon">❌</div>
                    <h3>Error al cargar</h3>
                    <p>Intenta de nuevo más tarde</p>
                    <button class="btn btn-secondary" style="margin-top: 15px;" onclick="window.ms.loadConversations()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    createConversationItem(conv) {
        const initial = (conv.other_user_name || 'U').charAt(0).toUpperCase();
        const time = this.formatMessageTime(conv.created_at);
        const preview = conv.message ? (conv.message.length > 40 ? conv.message.substring(0, 40) + '...' : conv.message) : '';

        return `
            <div class="conversation-item ${conv.has_unread ? 'unread' : ''}"
                 data-action="open-chat" data-user-id="${this.escapeHtml(conv.other_user_id)}" data-user-name="${this.escapeHtml(conv.other_user_name || 'Usuario')}" data-product-id="${this.escapeHtml(conv.product_id || '')}" data-product-title="${this.escapeHtml(conv.product_title || '')}">
                <div class="conversation-avatar">${this.escapeHtml(initial)}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${this.escapeHtml(conv.other_user_name || 'Usuario')}</div>
                    <div class="conversation-preview">${this.escapeHtml(preview)}</div>
                    ${conv.product_title ? `<div class="conversation-product">📦 ${this.escapeHtml(conv.product_title)}</div>` : ''}
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${this.escapeHtml(time)}</div>
                    ${conv.has_unread ? '<div class="conversation-unread">Nuevo</div>' : ''}
                </div>
            </div>
        `;
    }

    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Ahora';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
        if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
        
        return date.toLocaleDateString('es-HN', { month: 'short', day: 'numeric' });
    }

    async openChat(otherUserId, otherUserName, productId, productTitle) {
        this.currentChat = { otherUserId, otherUserName, productId, productTitle };

        // Update chat header
        document.getElementById('chatUserName').textContent = otherUserName;
        document.getElementById('chatAvatar').textContent = otherUserName.charAt(0).toUpperCase();
        document.getElementById('chatProduct').textContent = productTitle ? '📦 ' + productTitle : '';

        // Show chat panel, hide conversations
        document.getElementById('conversationsPanel').style.display = 'none';
        document.getElementById('chatPanel').style.display = 'block';

        // Load messages
        await this.loadChatMessages();
    }

    closeChatPanel() {
        document.getElementById('chatPanel').style.display = 'none';
        document.getElementById('conversationsPanel').style.display = 'block';
        this.loadConversations(); // Refresh conversations
    }

    async loadChatMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        container.innerHTML = '<div class="chat-loading"><div class="pulse">💬</div></div>';

        try {
            let url = `/api/marketplace/messages/${this.currentChat.otherUserId}`;
            if (this.currentChat.productId) {
                url += `?product_id=${this.currentChat.productId}`;
            }

            const response = await this.apiRequest(url);
            const messages = response.data?.messages || response.messages || [];

            if (messages.length === 0) {
                container.innerHTML = `
                    <div class="chat-loading">
                        <p>No hay mensajes aún. ¡Envía el primero!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = messages.map(msg => this.createMessageBubble(msg)).join('');

            // Scroll to bottom
            container.scrollTop = container.scrollHeight;

        } catch (error) {
            container.innerHTML = `<div class="chat-loading">Error al cargar mensajes</div>`;
        }
    }

    createMessageBubble(msg) {
        const isSent = msg.sender_id === this.currentUser?.id;
        const time = this.formatMessageTime(msg.created_at);

        return `
            <div class="message-bubble ${isSent ? 'sent' : 'received'}">
                <div class="message-text">${this.escapeHtml(msg.message)}</div>
                <div class="message-time">${this.escapeHtml(time)}</div>
            </div>
        `;
    }

    async sendChatMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message || !this.currentChat.otherUserId) return;

        input.value = '';
        input.disabled = true;

        try {
            await this.apiRequest('/api/marketplace/messages', {
                method: 'POST',
                body: JSON.stringify({
                    recipient_id: this.currentChat.otherUserId,
                    message: message,
                    product_id: this.currentChat.productId
                })
            });

            // Reload messages
            await this.loadChatMessages();

        } catch (error) {
            this.showNotification('Error al enviar mensaje: ' + error.message, 'error');
            input.value = message; // Restore message
        } finally {
            input.disabled = false;
            input.focus();
        }
    }

    updateUnreadBadge(count) {
        const badge = document.getElementById('totalUnreadBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }

        // Also update tab badge
        const tab = document.querySelector('[data-tab="messages"]');
        if (tab) {
            if (count > 0) {
                tab.innerHTML = `💬 Mensajes <span class="tab-badge">${count}</span>`;
            } else {
                tab.innerHTML = '💬 Mensajes';
            }
        }
    }

    // Start a new conversation from a product
    async contactSeller(productId, sellerId, sellerName, productTitle) {
        if (this.isGuest) {
            this.showLoginPrompt('enviar mensajes');
            return;
        }

        this.currentChat = {
            otherUserId: sellerId,
            otherUserName: sellerName,
            productId: productId,
            productTitle: productTitle
        };

        // Switch to messages tab
        this.switchTab('messages');

        // Open chat directly
        setTimeout(() => {
            this.openChat(sellerId, sellerName, productId, productTitle);
        }, 100);
    }

    async loadMyProducts() {
        const container = document.getElementById('myProducts');
        if (!container) return;

        // Show loading state
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div class="pulse" style="font-size: 48px;">📦</div>
                <p style="color: rgba(255,255,255,0.6); margin-top: 15px;">Cargando tus productos...</p>
            </div>
        `;

        try {
            const response = await this.apiRequest('/api/marketplace/products/my');
            const products = response.data?.products || response.products || [];

            if (products.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <div style="font-size: 64px; margin-bottom: 20px;">🏪</div>
                        <h3 style="margin-bottom: 10px;">No tienes productos</h3>
                        <p style="color: rgba(255,255,255,0.6); margin-bottom: 20px;">Empieza a vender y gana LTD tokens</p>
                        <button class="btn btn-primary" onclick="showCreateProductModal()">
                            <span>➕</span> Publicar Producto
                        </button>
                    </div>
                `;
                return;
            }

            // Map API response to display format
            this.myProducts = products.map(p => ({
                id: `prod_${p.id}`,
                productId: p.id,
                name: p.title,
                description: p.description || '',
                price: parseFloat(p.price) || 0,
                quantity: p.quantity || 0,
                category: p.category_id || 'other',
                condition: p.condition || 'new',
                location: p.location || '',
                image: this.getCategoryIcon(p.category_id),
                images: p.images || [],
                featured: p.is_featured,
                views: p.views_count || 0,
                shippingAvailable: p.shipping_available,
                shippingPrice: parseFloat(p.shipping_price) || 0,
                referralCommission: parseFloat(p.referral_commission_percent) || 5,
                created: p.created_at
            }));

            container.innerHTML = this.myProducts.map(product => this.createMyProductCard(product)).join('');

        } catch (error) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h3 style="color: #EF4444;">Error al cargar productos</h3>
                    <p style="color: rgba(255,255,255,0.6); margin-bottom: 15px;">Intenta de nuevo</p>
                    <button class="btn btn-secondary" onclick="marketplace.loadMyProducts()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    createMyProductCard(product) {
        const priceUSD = (product.price * 0.0847).toFixed(2);
        const conditionLabels = {
            'new': 'Nuevo',
            'like_new': 'Como Nuevo',
            'used': 'Usado',
            'refurbished': 'Reacondicionado'
        };

        return `
            <div class="product-card" style="position: relative;">
                <div class="product-image" style="overflow: hidden;">
                    ${product.images && product.images.length > 0 && product.images[0].url ? `<img src="${this.escapeHtml(product.images[0].thumbnail || product.images[0].url)}" style="width: 100%; height: 100%; object-fit: cover;" alt="${this.escapeHtml(product.name)}">` : `<span>${this.escapeHtml(product.image || "📦")}</span>`}
                    ${product.featured ? '<div class="product-badge">Destacado</div>' : ''}
                    <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 12px; font-size: 11px;">
                        👁️ ${this.escapeHtml(product.views)} vistas
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-title">${this.escapeHtml(product.name)}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <div class="price-ltd">${this.escapeHtml(product.price)} LTD</div>
                            <div class="price-usd">≈ $${this.escapeHtml(priceUSD)} USD</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; color: ${product.quantity > 0 ? '#10B981' : '#EF4444'};">
                                ${product.quantity > 0 ? `${this.escapeHtml(product.quantity)} disponibles` : 'Agotado'}
                            </div>
                            <div style="font-size: 11px; color: rgba(255,255,255,0.5);">
                                ${this.escapeHtml(conditionLabels[product.condition] || 'Nuevo')}
                            </div>
                        </div>
                    </div>
                    ${product.location ? `
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 10px;">
                        📍 ${this.escapeHtml(product.location)}
                    </div>
                    ` : ''}
                    <div class="product-actions" style="display: flex; gap: 8px; margin-top: 10px;">
                        <button class="btn btn-secondary" style="flex: 1;" data-action="edit" data-product-id="${this.escapeHtml(product.productId)}">
                            <span>✏️</span> Editar
                        </button>
                        <button class="btn btn-secondary" style="padding: 10px 14px; background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.3);" data-action="delete" data-product-id="${this.escapeHtml(product.productId)}" title="Eliminar producto">
                            <span>🗑️</span>
                        </button>
                    </div>
                    <div style="text-align: center; margin-top: 8px; font-size: 11px; color: rgba(0,255,255,0.7);">
                        💰 Comisión referidos: ${product.referralCommission}%
                    </div>
                </div>
            </div>
        `;
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
                    <div class="user-avatar">${this.escapeHtml(order.product.charAt(0))}</div>
                    <div class="user-info">
                        <div class="user-name">${this.escapeHtml(order.product)}</div>
                        <div class="post-time">${type === 'purchases' ? 'Vendido por' : 'Comprado por'} ${this.escapeHtml(type === 'purchases' ? order.seller : order.buyer)}</div>
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
                    <div class="post-content">${review.comment}</div>
                </div>
            `).join('');
        }
    }
    
    async handleCreateProduct() {
        const submitBtn = document.getElementById('createProductBtn');
        const originalText = submitBtn.innerHTML;

        try {
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>⏳</span> Publicando...';

            // Collect form data
            const formData = {
                title: document.getElementById('productName').value.trim(),
                category_id: document.getElementById('productCategory').value,
                condition: document.getElementById('productCondition').value,
                price: parseFloat(document.getElementById('productPrice').value),
                quantity: parseInt(document.getElementById('productQuantity').value),
                location: document.getElementById('productLocation').value.trim() || 'Honduras',
                description: document.getElementById('productDescription').value.trim(),
                shipping_available: document.getElementById('productShipping').checked,
                shipping_price: parseFloat(document.getElementById('productShippingPrice')?.value) || 0,
                referral_commission_percent: parseInt(document.getElementById('productCommission').value)
            };

            // Validate required fields
            if (!formData.title || !formData.category_id || !formData.price || !formData.description) {
                this.showNotification('Por favor completa todos los campos requeridos', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            if (formData.price < 1) {
                this.showNotification('El precio debe ser mayor a 0', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            // Check seller's LTD balance for commission capacity
            try {
                const balanceCheck = await this.apiRequest('/api/marketplace/wallet/check-commission', {
                    method: 'POST',
                    body: JSON.stringify({
                        price: formData.price,
                        commission_percent: formData.referral_commission_percent
                    })
                });

                if (balanceCheck.success && balanceCheck.data?.warning) {
                    // Show warning but allow to continue
                    const proceed = confirm(
                        `⚠️ Aviso de Balance LTD\n\n${balanceCheck.data.warning}\n\n` +
                        `Balance actual: ${balanceCheck.data.balance} LTD\n` +
                        `Comision maxima: ${balanceCheck.data.maxCommission.toFixed(2)} LTD\n\n` +
                        `¿Deseas continuar de todas formas?`
                    );
                    if (!proceed) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                        return;
                    }
                }
            } catch (balanceError) {
                // Continue anyway if balance check fails
            }


            // Upload images first if any
            let uploadedImages = [];
            if (typeof selectedImages !== "undefined" && selectedImages.length > 0) {
                submitBtn.innerHTML = "<span>📷</span> Subiendo imágenes...";
                const uploadResult = await uploadProductImages();
                if (uploadResult.success && uploadResult.data?.images) {
                    uploadedImages = uploadResult.data.images;
                } else if (uploadResult.images) {
                    uploadedImages = uploadResult.images;
                } else if (!uploadResult.success) {
                    this.showNotification("Error subiendo imágenes: " + (uploadResult.data?.error?.message || "Intenta de nuevo"), "error");
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    return;
                }
                submitBtn.innerHTML = "<span>⏳</span> Publicando...";
            }

            // Add images to form data
            formData.images = uploadedImages.map(img => ({
                url: img.url,
                thumbnail: img.thumbnail
            }));

            // Call API to create product
            const response = await this.apiRequest('/api/marketplace/products', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            const product = response.product || response.data?.product;
            if (response.success && product) {
                // Add to local products array with frontend format
                const newProduct = {
                    id: `prod_${product.id}`,
                    productId: product.id,
                    name: product.title,
                    description: product.description,
                    category: product.category_id,
                    price: parseFloat(product.price),
                    quantity: product.quantity,
                    image: this.getProductIcon(product.category_id),
                    images: uploadedImages,
                    condition: product.condition,
                    location: product.location,
                    seller: {
                        id: this.currentUser?.id || product.seller_id,
                        name: this.currentUser?.name || 'Vendedor',
                        avatar: (this.currentUser?.name || 'V').charAt(0).toUpperCase(),
                        rating: 4.5
                    },
                    featured: false,
                    referralCommission: product.referral_commission_percent,
                    created: new Date()
                };

                this.products.unshift(newProduct);

                this.closeCreateProductModal();
                this.loadFeaturedProducts();
                this.loadRecentProducts();
                this.loadMyProducts();

                this.showNotification('¡Producto publicado exitosamente!', 'success');
            } else {
                throw new Error(response.error || 'Error al crear el producto');
            }

        } catch (error) {
            this.showNotification(error.message || 'Error al publicar el producto', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
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
        document.getElementById('createProductModal').classList.remove('active');
        document.getElementById('createProductForm').reset();
        if (typeof resetImageUpload === 'function') resetImageUpload();
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
    document.getElementById('createProductModal').classList.add('active');
}

function closeCreateProductModal() {
    if (window.marketplaceSystem) {
        window.marketplaceSystem.closeCreateProductModal();
    }
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

    const ms = window.marketplaceSystem;
    const product = ms.products.find(p => p.id === productId);
    if (!product) {
        ms.showNotification('Producto no encontrado', 'error');
        return;
    }

    // Create purchase modal
    const existingModal = document.getElementById('purchaseModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'purchaseModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2 class="modal-title">Comprar Producto</h2>
                <button class="close-btn" onclick="closePurchaseModal()">&times;</button>
            </div>
            <div style="padding: 20px;">
                <!-- Product Info -->
                <div style="display: flex; gap: 15px; margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                    <div style="font-size: 48px;">${product.image}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 16px;">${product.name}</div>
                        <div style="color: rgba(255,255,255,0.7); font-size: 13px;">${product.seller?.name || 'Vendedor'}</div>
                        <div style="color: #00FFFF; font-size: 20px; font-weight: 700; margin-top: 5px;">${product.price} LTD</div>
                        <div style="color: rgba(255,255,255,0.5); font-size: 12px;">≈ $${(product.price * 0.0847).toFixed(2)} USD</div>
                    </div>
                </div>

                <!-- Quantity -->
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Cantidad</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button type="button" onclick="adjustQuantity(-1)" class="btn btn-secondary" style="padding: 8px 15px;">-</button>
                        <input type="number" id="purchaseQuantity" value="1" min="1" max="${product.quantity}" style="width: 60px; text-align: center; padding: 8px;">
                        <button type="button" onclick="adjustQuantity(1)" class="btn btn-secondary" style="padding: 8px 15px;">+</button>
                        <span style="color: rgba(255,255,255,0.5); font-size: 12px;">(${product.quantity} disponibles)</span>
                    </div>
                </div>

                <!-- Payment Method -->
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Metodo de Pago *</label>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
                        <label class="payment-option" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer; border: 2px solid transparent;" onclick="selectPayment('efectivo')">
                            <input type="radio" name="paymentMethod" value="efectivo" style="width: 18px; height: 18px;">
                            <span style="font-size: 24px;">💵</span>
                            <div>
                                <div style="font-weight: 500;">Efectivo</div>
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5);">Pago al recibir el producto</div>
                            </div>
                        </label>
                        <label class="payment-option" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer; border: 2px solid transparent;" onclick="selectPayment('transferencia')">
                            <input type="radio" name="paymentMethod" value="transferencia" style="width: 18px; height: 18px;">
                            <span style="font-size: 24px;">🏦</span>
                            <div>
                                <div style="font-weight: 500;">Transferencia Bancaria</div>
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5);">BAC, Atlantida, Ficohsa, etc.</div>
                            </div>
                        </label>
                        <label class="payment-option" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer; border: 2px solid transparent;" onclick="selectPayment('tigo_money')">
                            <input type="radio" name="paymentMethod" value="tigo_money" style="width: 18px; height: 18px;">
                            <span style="font-size: 24px;">📱</span>
                            <div>
                                <div style="font-weight: 500;">Tigo Money</div>
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5);">Pago movil instantaneo</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Shipping/Pickup -->
                ${product.shippingAvailable ? `
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Entrega</label>
                    <div style="display: flex; gap: 10px; margin-top: 8px;">
                        <label style="flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer;">
                            <input type="radio" name="deliveryMethod" value="pickup" checked>
                            <span>Recoger (Gratis)</span>
                        </label>
                        <label style="flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer;">
                            <input type="radio" name="deliveryMethod" value="shipping">
                            <span>Envio (+${product.shippingPrice} LTD)</span>
                        </label>
                    </div>
                </div>
                ` : `
                <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 15px;">
                    <span style="color: rgba(255,255,255,0.7);">📍 Recoger en: ${product.location || 'Acordar con vendedor'}</span>
                </div>
                `}

                <!-- Notes -->
                <div class="form-group" style="margin-bottom: 20px;">
                    <label>Notas para el vendedor (opcional)</label>
                    <textarea id="purchaseNotes" rows="2" placeholder="Ej: Horario de entrega preferido..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; resize: none;"></textarea>
                </div>

                <!-- Total -->
                <div style="padding: 15px; background: linear-gradient(135deg, rgba(0,255,255,0.1), rgba(16,185,129,0.1)); border: 1px solid rgba(0,255,255,0.3); border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Subtotal:</span>
                        <span id="purchaseSubtotal">${product.price} LTD</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Envio:</span>
                        <span id="purchaseShipping">Gratis</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #00FFFF; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; margin-top: 10px;">
                        <span>Total:</span>
                        <span id="purchaseTotal">${product.price} LTD</span>
                    </div>
                </div>

                <!-- Actions -->
                <div style="display: flex; gap: 10px;">
                    <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="closePurchaseModal()">Cancelar</button>
                    <button type="button" class="btn btn-primary" style="flex: 2;" onclick="confirmPurchase('${productId}')" id="confirmPurchaseBtn">
                        <span>✅</span> Confirmar Compra
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Store product data for later use
    window.currentPurchaseProduct = product;
}

function closePurchaseModal() {
    document.getElementById('purchaseModal')?.remove();
    window.currentPurchaseProduct = null;
}

function selectPayment(method) {
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.style.borderColor = 'transparent';
    });
    const selected = document.querySelector(`input[value="${method}"]`);
    if (selected) {
        selected.checked = true;
        selected.closest('.payment-option').style.borderColor = '#00FFFF';
    }
}

function adjustQuantity(delta) {
    const input = document.getElementById('purchaseQuantity');
    const product = window.currentPurchaseProduct;
    if (!input || !product) return;

    let newVal = parseInt(input.value) + delta;
    newVal = Math.max(1, Math.min(newVal, product.quantity));
    input.value = newVal;

    // Update totals
    updatePurchaseTotal();
}

function updatePurchaseTotal() {
    const product = window.currentPurchaseProduct;
    if (!product) return;

    const quantity = parseInt(document.getElementById('purchaseQuantity')?.value) || 1;
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value || 'pickup';

    const subtotal = product.price * quantity;
    const shipping = (deliveryMethod === 'shipping' && product.shippingAvailable) ? product.shippingPrice : 0;
    const total = subtotal + shipping;

    document.getElementById('purchaseSubtotal').textContent = `${subtotal.toFixed(2)} LTD`;
    document.getElementById('purchaseShipping').textContent = shipping > 0 ? `${shipping.toFixed(2)} LTD` : 'Gratis';
    document.getElementById('purchaseTotal').textContent = `${total.toFixed(2)} LTD`;
}

async function confirmPurchase(productId) {
    const ms = window.marketplaceSystem;
    const product = window.currentPurchaseProduct;
    if (!ms || !product) return;

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (!paymentMethod) {
        ms.showNotification('Selecciona un metodo de pago', 'error');
        return;
    }

    const quantity = parseInt(document.getElementById('purchaseQuantity')?.value) || 1;
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value || 'pickup';
    const notes = document.getElementById('purchaseNotes')?.value || '';

    // Get referral code from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref') || null;

    const btn = document.getElementById('confirmPurchaseBtn');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Procesando...';

    try {
        // Call API to create order (includes referral code if present)
        const response = await ms.apiRequest(`/api/marketplace/products/${product.productId}/buy`, {
            method: 'POST',
            body: JSON.stringify({
                quantity,
                payment_method: paymentMethod,
                delivery_method: deliveryMethod,
                referral_code: referralCode,
                notes
            })
        });

        if (response.success) {
            closePurchaseModal();

            // Show success with payment instructions
            const paymentInstructions = {
                efectivo: '💵 Coordina con el vendedor para el pago en efectivo al momento de la entrega.',
                transferencia: '🏦 El vendedor te contactara con los datos bancarios para realizar la transferencia.',
                tigo_money: '📱 El vendedor te enviara su numero de Tigo Money para completar el pago.'
            };

            ms.showNotification('¡Orden creada exitosamente!', 'success');

            // Show payment instructions modal
            setTimeout(() => {
                alert(`✅ Orden #${response.data?.order?.id || 'Nueva'} creada!\n\n${paymentInstructions[paymentMethod]}\n\nEl vendedor sera notificado y te contactara pronto.`);
            }, 500);

            // Reload products to update quantities
            ms.loadMarketplaceData();
        } else {
            throw new Error(response.error || 'Error al crear la orden');
        }
    } catch (error) {
        ms.showNotification(error.message || 'Error al procesar la compra', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>✅</span> Confirmar Compra';
    }
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
        window.marketplaceSystem?.showNotification(`${service.title} - ${service.provider.name}`, 'info');
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

function contactProvider(bookingId) {
    // Find booking to get provider info
    const booking = window.marketplaceSystem?.bookings?.find(b => b.id === bookingId);
    if (booking) {
        window.marketplaceSystem?.showNotification(`Contactando a ${booking.provider}...`, 'info');
        // In future: open messaging modal
    } else {
        window.marketplaceSystem?.showNotification('Función de contacto en desarrollo', 'info');
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

// ===== PRODUCT MANAGEMENT FUNCTIONS =====

function editProduct(productId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;

    // Find the product in myProducts array
    const product = ms.myProducts?.find(p => p.productId == productId);
    if (!product) {
        ms.showNotification('Producto no encontrado', 'error');
        return;
    }

    // Remove existing modal if any
    document.getElementById('editProductModal')?.remove();

    // Create edit modal
    const modal = document.createElement('div');
    modal.id = 'editProductModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2 class="modal-title">Editar Producto</h2>
                <button class="close-btn" onclick="closeEditProductModal()">&times;</button>
            </div>
            <form id="editProductForm" onsubmit="event.preventDefault(); saveProductChanges(${productId});">
                <div class="form-grid">
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label>Nombre del Producto *</label>
                        <input type="text" id="editProductName" value="${product.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Categoria *</label>
                        <select id="editProductCategory" required>
                            <option value="electronics" ${product.category === 'electronics' ? 'selected' : ''}>Electronicos</option>
                            <option value="clothing" ${product.category === 'clothing' ? 'selected' : ''}>Ropa y Moda</option>
                            <option value="home" ${product.category === 'home' ? 'selected' : ''}>Hogar y Jardin</option>
                            <option value="vehicles" ${product.category === 'vehicles' ? 'selected' : ''}>Vehiculos</option>
                            <option value="food" ${product.category === 'food' ? 'selected' : ''}>Comida y Bebidas</option>
                            <option value="beauty" ${product.category === 'beauty' ? 'selected' : ''}>Belleza y Salud</option>
                            <option value="sports" ${product.category === 'sports' ? 'selected' : ''}>Deportes</option>
                            <option value="other" ${product.category === 'other' ? 'selected' : ''}>Otros</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Condicion *</label>
                        <select id="editProductCondition" required>
                            <option value="new" ${product.condition === 'new' ? 'selected' : ''}>Nuevo</option>
                            <option value="like_new" ${product.condition === 'like_new' ? 'selected' : ''}>Como Nuevo</option>
                            <option value="used" ${product.condition === 'used' ? 'selected' : ''}>Usado</option>
                            <option value="refurbished" ${product.condition === 'refurbished' ? 'selected' : ''}>Reacondicionado</option>
                        </select>
                    </div>
                </div>

                <div class="form-grid" style="margin-top: 15px;">
                    <div class="form-group">
                        <label>Precio (LTD) *</label>
                        <input type="number" id="editProductPrice" min="1" step="0.01" value="${product.price}" required>
                    </div>
                    <div class="form-group">
                        <label>Cantidad *</label>
                        <input type="number" id="editProductQuantity" min="0" value="${product.quantity}" required>
                    </div>
                    <div class="form-group">
                        <label>Ubicacion</label>
                        <input type="text" id="editProductLocation" value="${product.location || ''}" placeholder="Ej: Tegucigalpa">
                    </div>
                </div>

                <div class="form-group" style="margin-top: 15px;">
                    <label>Descripcion</label>
                    <textarea id="editProductDescription" rows="3" placeholder="Describe tu producto...">${product.description || ''}</textarea>
                </div>

                <div style="margin-top: 15px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="editProductShipping" ${product.shippingAvailable ? 'checked' : ''} style="width: 18px; height: 18px;" onchange="document.getElementById('editShippingPriceGroup').style.display = this.checked ? 'block' : 'none'">
                        <span>Ofrezco envio a domicilio</span>
                    </label>
                    <div id="editShippingPriceGroup" style="display: ${product.shippingAvailable ? 'block' : 'none'}; margin-top: 10px;">
                        <label>Costo de envio (LTD)</label>
                        <input type="number" id="editProductShippingPrice" min="0" step="0.01" value="${product.shippingPrice || 0}" style="width: 150px;">
                    </div>
                </div>

                <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, rgba(0,255,255,0.1), rgba(16,185,129,0.1)); border: 1px solid rgba(0,255,255,0.2); border-radius: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label>Comision Referidos:</label>
                        <select id="editProductCommission" style="width: 100px;">
                            <option value="3" ${product.referralCommission == 3 ? 'selected' : ''}>3%</option>
                            <option value="5" ${product.referralCommission == 5 ? 'selected' : ''}>5%</option>
                            <option value="8" ${product.referralCommission == 8 ? 'selected' : ''}>8%</option>
                            <option value="10" ${product.referralCommission == 10 ? 'selected' : ''}>10%</option>
                            <option value="15" ${product.referralCommission == 15 ? 'selected' : ''}>15%</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 25px;">
                    <button type="button" class="btn btn-secondary" onclick="closeEditProductModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" id="saveProductBtn">
                        <span>💾</span> Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeEditProductModal() {
    document.getElementById('editProductModal')?.remove();
}

async function saveProductChanges(productId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;

    const btn = document.getElementById('saveProductBtn');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Guardando...';

    const productData = {
        title: document.getElementById('editProductName').value,
        category_id: document.getElementById('editProductCategory').value,
        condition: document.getElementById('editProductCondition').value,
        price: parseFloat(document.getElementById('editProductPrice').value),
        quantity: parseInt(document.getElementById('editProductQuantity').value),
        location: document.getElementById('editProductLocation').value,
        description: document.getElementById('editProductDescription').value,
        shipping_available: document.getElementById('editProductShipping').checked,
        shipping_price: parseFloat(document.getElementById('editProductShippingPrice').value) || 0,
        referral_commission_percent: parseFloat(document.getElementById('editProductCommission').value)
    };

    try {
        const response = await ms.apiRequest(`/api/marketplace/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });

        if (response.success) {
            closeEditProductModal();
            ms.showNotification('Producto actualizado exitosamente', 'success');
            // Reload my products
            ms.loadMyProducts();
        } else {
            throw new Error(response.error || 'Error al actualizar');
        }
    } catch (error) {
        ms.showNotification(error.message || 'Error al actualizar el producto', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>💾</span> Guardar Cambios';
    }
}

async function deleteProduct(productId) {
    const ms = window.marketplaceSystem;
    if (!ms) return;

    // Find product to show name in confirmation
    const product = ms.myProducts?.find(p => p.productId == productId);
    const productName = product?.name || 'este producto';

    // Confirm deletion
    if (!confirm(`¿Estas seguro de que deseas eliminar "${productName}"?\n\nEsta accion no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await ms.apiRequest(`/api/marketplace/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            ms.showNotification('Producto eliminado exitosamente', 'success');
            // Reload my products
            ms.loadMyProducts();
        } else {
            throw new Error(response.error || 'Error al eliminar');
        }
    } catch (error) {
        ms.showNotification(error.message || 'Error al eliminar el producto', 'error');
    }
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
                            <div style="font-size: 32px; font-weight: 700; color: #10B981;">L.${estimatedCommission}</div>
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

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.marketplaceSystem = new MarketplaceSocialSystem();
    window.ms = window.marketplaceSystem; // Alias for convenience
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketplaceSocialSystem;
}
