/**
 * La Tanda - Marketplace & Social System
 * Sistema integrado de marketplace y red social con tokens LTD
 * Versión: 2.0.0
 */

class MarketplaceSocialSystem {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = this.getCurrentUser();
        
        // System state
        this.products = [];
        this.posts = [];
        this.orders = [];
        this.reviews = [];
        this.badges = [];
        
        // Market statistics
        this.marketStats = {
            totalProducts: 1247,
            totalSellers: 342,
            totalTransactions: 5673,
            totalVolume: 89200
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
            electronics: '<i class="fas fa-mobile-alt"></i> Electrónicos',
            clothing: '<i class="fas fa-tshirt"></i> Ropa y Moda',
            home: '<i class="fas fa-home"></i> Hogar y Jardín',
            services: '<i class="fas fa-cogs"></i> Servicios',
            food: '<i class="fas fa-pizza-slice"></i> Comida y Bebidas',
            digital: '<i class="fas fa-laptop"></i> Productos Digitales'
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.setupEventListeners();
            await this.loadMarketplaceData();
            await this.loadSocialData();
            this.updateAllDisplays();
            
            console.log('[Marketplace] Marketplace & Social System initialized');
        } catch (error) {
            console.error('[Marketplace] Error initializing marketplace system:', error);
            this.showNotification('Error inicializando el marketplace', 'error');
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
            if (tab.dataset.tab) {
                tab.classList.remove('active');
            }
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
            case 'social':
                this.loadSocialFeed();
                break;
            case 'my-store':
                this.loadMyProducts();
                break;
            case 'orders':
                this.loadOrdersData('purchases');
                break;
            case 'community':
                this.loadCommunityData();
                break;
            case 'reputation':
                this.loadReputationData();
                break;
        }
    }
    
    async loadMarketplaceData() {
        try {
            // Cargar productos mock
            const mockProducts = [
                {
                    id: 'prod_001',
                    name: 'Smartphone Premium',
                    description: 'Último modelo con tecnología avanzada y cámara profesional.',
                    category: 'electronics',
                    price: 850,
                    quantity: 5,
                    image: '<i class="fas fa-mobile-alt"></i>',
                    seller: {
                        id: 'seller_001',
                        name: 'TechStore',
                        avatar: 'T',
                        rating: 4.9
                    },
                    featured: true,
                    created: new Date('2024-02-10')
                },
                {
                    id: 'prod_002',
                    name: 'Chaqueta de Cuero',
                    description: 'Chaqueta de cuero genuino, perfecta para el invierno.',
                    category: 'clothing',
                    price: 320,
                    quantity: 3,
                    image: '<i class="fas fa-tshirt"></i>',
                    seller: {
                        id: 'seller_002',
                        name: 'Fashion Plus',
                        avatar: 'F',
                        rating: 4.7
                    },
                    featured: true,
                    created: new Date('2024-02-12')
                },
                {
                    id: 'prod_003',
                    name: 'Servicio de Programación',
                    description: 'Desarrollo de aplicaciones web y móviles personalizadas.',
                    category: 'services',
                    price: 1200,
                    quantity: 1,
                    image: '<i class="fas fa-laptop"></i>',
                    seller: {
                        id: 'seller_003',
                        name: 'DevPro',
                        avatar: 'D',
                        rating: 5.0
                    },
                    featured: false,
                    created: new Date('2024-02-15')
                },
                {
                    id: 'prod_004',
                    name: 'Café Premium',
                    description: 'Café orgánico de granos seleccionados, tostado artesanal.',
                    category: 'food',
                    price: 45,
                    quantity: 20,
                    image: '<i class="fas fa-coffee"></i>',
                    seller: {
                        id: 'seller_004',
                        name: 'Coffee Corner',
                        avatar: 'C',
                        rating: 4.8
                    },
                    featured: false,
                    created: new Date('2024-02-16')
                }
            ];
            
            this.products = mockProducts;
        } catch (error) {
            console.error('Error loading marketplace data:', error);
        }
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
                    content: '¡Acabo de completar mi primera tanda con éxito! <i class="fas fa-trophy"></i> La experiencia ha sido increíble y he conocido personas maravillosas en el proceso.',
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
                    content: 'Consejo del día: Siempre diversifica tus participaciones en tandas. No pongas todos los huevos en la misma canasta <i class="fas fa-lightbulb"></i>',
                    type: 'tip',
                    timestamp: new Date('2024-02-15T16:45:00'),
                    likes: 45,
                    comments: 12,
                    shares: 8
                }
            ];
            
            this.posts = mockPosts;
        } catch (error) {
            console.error('Error loading social data:', error);
        }
    }
    
    updateAllDisplays() {
        this.updateMarketStats();
        this.loadMarketplaceProducts();
        this.loadSocialFeed();
    }
    
    updateMarketStats() {
        document.getElementById('totalProducts').textContent = this.marketStats.totalProducts.toLocaleString();
        document.getElementById('totalSellers').textContent = this.marketStats.totalSellers.toLocaleString();
        document.getElementById('totalTransactions').textContent = this.marketStats.totalTransactions.toLocaleString();
        document.getElementById('totalVolume').textContent = `${(this.marketStats.totalVolume / 1000).toFixed(1)}K`;
    }
    
    loadMarketplaceProducts() {
        this.loadFeaturedProducts();
        this.loadRecentProducts();
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
        
        return `
            <div class="product-card" onclick="viewProduct('${product.id}')">
                <div class="product-image">
                    <span>${product.image}</span>
                    ${product.featured ? '<div class="product-badge">Destacado</div>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-title">${product.name}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-price">
                        <div>
                            <div class="price-ltd">${product.price} LTD</div>
                            <div class="price-usd">≈ $${priceUSD} USD</div>
                        </div>
                        <div style="text-align: right; color: ${product.quantity > 0 ? '#10B981' : '#EF4444'}; font-size: 12px;">
                            ${product.quantity > 0 ? `${product.quantity} disponibles` : 'Agotado'}
                        </div>
                    </div>
                    <div class="product-seller">
                        <div class="seller-avatar">${product.seller.avatar}</div>
                        <div class="seller-info">
                            <div class="seller-name">${product.seller.name}</div>
                            <div class="seller-rating"><i class="fas fa-star" style="color: #F59E0B;"></i> ${product.seller.rating}/5.0</div>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="event.stopPropagation(); buyProduct('${product.id}')">
                        <i class="fas fa-shopping-cart"></i> Comprar Ahora
                    </button>
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
            achievement: '<i class="fas fa-trophy"></i>',
            question: '<i class="fas fa-question-circle"></i>',
            tip: '<i class="fas fa-lightbulb"></i>',
            announcement: '<i class="fas fa-bullhorn"></i>',
            general: '<i class="fas fa-comments"></i>'
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
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    <button class="action-btn ${post.liked ? 'active' : ''}" onclick="toggleLike('${post.id}')">
                        <i class="fas fa-thumbs-up"></i> ${post.likes}
                    </button>
                    <button class="action-btn" onclick="showComments('${post.id}')">
                        <i class="fas fa-comment"></i> ${post.comments}
                    </button>
                    <button class="action-btn" onclick="sharePost('${post.id}')">
                        <i class="fas fa-share"></i> ${post.shares}
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
                    <div style="font-size: 48px; margin-bottom: 20px;"><i class="fas fa-search"></i></div>
                    <h3>No se encontraron productos</h3>
                    <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
    }
    
    loadMyProducts() {
        // Simulate user's products
        const myProducts = this.products.slice(0, 3).map(product => ({
            ...product,
            seller: {
                id: this.currentUser.id,
                name: 'Mi Tienda',
                avatar: 'U',
                rating: 4.8
            }
        }));
        
        const container = document.getElementById('myProducts');
        if (container) {
            container.innerHTML = myProducts.map(product => this.createProductCard(product)).join('');
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
                            ${order.status === 'completed' ? '<i class="fas fa-check-circle"></i> Completado' : '<i class="fas fa-clock"></i> Pendiente'}
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
                        <div style="color: #8B5CF6; font-weight: 600;"><i class="fas fa-star"></i> ${user.reputation}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    loadReputationData() {
        // Load user badges
        const badges = [
            { name: 'Primera Venta', icon: '<i class="fas fa-bullseye"></i>', earned: true },
            { name: 'Vendedor Confiable', icon: '<i class="fas fa-shield-alt"></i>', earned: true },
            { name: 'Cliente Frecuente', icon: '<i class="fas fa-shopping-cart"></i>', earned: true },
            { name: 'Contributor Activo', icon: '<i class="fas fa-comment"></i>', earned: true },
            { name: 'Mentor Comunidad', icon: '<i class="fas fa-chalkboard-teacher"></i>', earned: false },
            { name: 'Influencer', icon: '<i class="fas fa-star"></i>', earned: false }
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
                            ${'<i class="fas fa-star" style="color: #F59E0B;"></i>'.repeat(review.rating)}
                        </div>
                    </div>
                    <div class="post-content">${review.comment}</div>
                </div>
            `).join('');
        }
    }
    
    async handleCreateProduct() {
        try {
            const formData = {
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                price: parseFloat(document.getElementById('productPrice').value),
                quantity: parseInt(document.getElementById('productQuantity').value),
                description: document.getElementById('productDescription').value
            };
            
            if (!formData.name || !formData.category || !formData.price || !formData.quantity || !formData.description) {
                this.showNotification('Por favor completa todos los campos', 'error');
                return;
            }
            
            // Simulate product creation
            const newProduct = {
                id: 'prod_' + Date.now(),
                ...formData,
                image: this.getCategoryIcon(formData.category),
                seller: {
                    id: this.currentUser.id,
                    name: this.currentUser.name,
                    avatar: this.currentUser.name.charAt(0).toUpperCase(),
                    rating: 4.8
                },
                featured: false,
                created: new Date()
            };
            
            this.products.unshift(newProduct);
            
            this.closeCreateProductModal();
            this.loadMyProducts();
            this.loadRecentProducts();
            
            this.showNotification('¡Producto creado exitosamente!', 'success');
            
        } catch (error) {
            console.error('Error creating product:', error);
            this.showNotification('Error al crear el producto', 'error');
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
            console.error('Error creating post:', error);
            this.showNotification('Error al crear el post', 'error');
        }
    }
    
    getCategoryIcon(category) {
        const icons = {
            electronics: '<i class="fas fa-mobile-alt"></i>',
            clothing: '<i class="fas fa-tshirt"></i>',
            home: '<i class="fas fa-home"></i>',
            services: '<i class="fas fa-cogs"></i>',
            food: '<i class="fas fa-pizza-slice"></i>',
            digital: '<i class="fas fa-laptop"></i>'
        };
        return icons[category] || '<i class="fas fa-box"></i>';
    }
    
    closeCreateProductModal() {
        document.getElementById('createProductModal').classList.remove('active');
        document.getElementById('createProductForm').reset();
    }
    
    closeCreatePostModal() {
        document.getElementById('createPostModal').classList.remove('active');
        document.getElementById('createPostForm').reset();
    }
    
    // Utility methods
    getCurrentUser() {
        const authData = localStorage.getItem('laTandaWeb3Auth') || sessionStorage.getItem('laTandaWeb3Auth');
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                return parsed.user || parsed;
            } catch (error) {
                console.error('[Marketplace] Error parsing auth data:', error);
                // Clear invalid auth data
                localStorage.removeItem('laTandaWeb3Auth');
                sessionStorage.removeItem('laTandaWeb3Auth');
            }
        }
        return {
            id: 'demo_user_001',
            name: 'Usuario Demo',
            email: 'demo@latanda.online'
        };
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

    /**
     * SISTEMA COMPLETO DE COMPRAS
     */
    
    showProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showNotification('Producto no encontrado', 'error');
            return;
        }

        const modal = this.createProductModal(product);
        document.body.appendChild(modal);
        
        // Agregar event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.buy-now-btn').addEventListener('click', () => {
            modal.remove();
            this.initiatePurchase(productId);
        });
        
        modal.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            this.addToCart(productId);
            modal.remove();
        });
    }
    
    createProductModal(product) {
        const modal = document.createElement('div');
        modal.className = 'product-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content product-detail">
                <div class="modal-header">
                    <h2>${product.name}</h2>
                    <button class="close-modal">✕</button>
                </div>
                <div class="product-detail-content">
                    <div class="product-image-large">
                        <span style="font-size: 120px;">${product.image}</span>
                    </div>
                    <div class="product-info-detailed">
                        <div class="product-price-section">
                            <div class="product-price-main">L ${product.price.toLocaleString()}</div>
                            <div class="product-price-usd">~$${(product.price * 0.04).toFixed(2)} USD</div>
                        </div>
                        <div class="seller-info">
                            <div class="seller-avatar">${product.seller.avatar}</div>
                            <div class="seller-details">
                                <div class="seller-name">${product.seller.name}</div>
                                <div class="seller-rating">
                                    ${'★'.repeat(Math.floor(product.seller.rating))} ${product.seller.rating}/5
                                </div>
                            </div>
                        </div>
                        <div class="product-description">
                            <h3>Descripción</h3>
                            <p>${product.description}</p>
                        </div>
                        <div class="product-quantity-selector">
                            <label>Cantidad:</label>
                            <input type="number" id="quantity" value="1" min="1" max="${product.quantity}" style="width: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <span class="stock-info">(${product.quantity} disponibles)</span>
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-primary buy-now-btn">
                                💳 Comprar Ahora
                            </button>
                            <button class="btn btn-secondary add-to-cart-btn">
                                🛒 Agregar al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar estilos del modal
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        return modal;
    }
    
    async initiatePurchase(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                this.showNotification('Producto no encontrado', 'error');
                return;
            }

            // Mostrar modal de confirmación de compra
            const purchaseModal = this.createPurchaseModal(product);
            document.body.appendChild(purchaseModal);
            
        } catch (error) {
            console.error('Error initiating purchase:', error);
            this.showNotification('Error al iniciar la compra', 'error');
        }
    }
    
    createPurchaseModal(product) {
        const modal = document.createElement('div');
        modal.className = 'purchase-modal';
        
        const total = product.price;
        const ltdTokens = Math.floor(total * 0.1); // 10% LTD tokens como recompensa
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content purchase-confirmation">
                <div class="modal-header">
                    <h2>🛒 Confirmar Compra</h2>
                    <button class="close-purchase-modal">✕</button>
                </div>
                <div class="purchase-summary">
                    <div class="product-summary">
                        <span class="product-icon">${product.image}</span>
                        <div class="product-details">
                            <h3>${product.name}</h3>
                            <p>Vendido por: ${product.seller.name}</p>
                        </div>
                        <div class="price-details">L ${product.price.toLocaleString()}</div>
                    </div>
                    
                    <div class="payment-breakdown">
                        <div class="breakdown-item">
                            <span>Subtotal:</span>
                            <span>L ${product.price.toLocaleString()}</span>
                        </div>
                        <div class="breakdown-item">
                            <span>Comisión de plataforma (2%):</span>
                            <span>L ${(product.price * 0.02).toFixed(2)}</span>
                        </div>
                        <div class="breakdown-item total">
                            <span><strong>Total:</strong></span>
                            <span><strong>L ${(product.price * 1.02).toFixed(2)}</strong></span>
                        </div>
                        <div class="ltd-reward">
                            <span>🪙 Ganarás:</span>
                            <span class="reward-amount">${ltdTokens} LTD Tokens</span>
                        </div>
                    </div>
                    
                    <div class="payment-method">
                        <h3>Método de Pago</h3>
                        <div class="payment-options">
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="wallet" checked>
                                <span>💳 Cartera La Tanda</span>
                                <span class="balance">Balance: L 2,450</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="card">
                                <span>💰 Tarjeta de Crédito</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="ltd">
                                <span>🪙 LTD Tokens</span>
                                <span class="balance">Balance: 150 LTD</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="purchase-actions">
                        <button class="btn btn-secondary close-purchase-modal">Cancelar</button>
                        <button class="btn btn-primary confirm-purchase-btn">
                            ✅ Confirmar Compra
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Event listeners
        modal.querySelector('.close-purchase-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelectorAll('.close-purchase-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.querySelector('.confirm-purchase-btn').addEventListener('click', () => {
            this.processPurchase(product, modal);
        });
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        return modal;
    }
    
    async processPurchase(product, modal) {
        try {
            this.showNotification('🔄 Procesando compra...', 'info');
            
            const paymentMethod = modal.querySelector('input[name="paymentMethod"]:checked').value;
            
            // Simular procesamiento de pago
            await this.processPayment(product, paymentMethod);
            
            // Crear orden
            const order = await this.createOrder(product, paymentMethod);
            
            // Agregar LTD tokens como recompensa
            await this.rewardLTDTokens(Math.floor(product.price * 0.1));
            
            modal.remove();
            
            // Mostrar confirmación de compra exitosa
            this.showPurchaseSuccess(order);
            
        } catch (error) {
            console.error('Error processing purchase:', error);
            this.showNotification('Error procesando la compra: ' + error.message, 'error');
        }
    }
    
    async processPayment(product, method) {
        // Simular procesamiento de pago
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const total = product.price * 1.02; // Include platform fee
        
        switch (method) {
            case 'wallet':
                // Verificar balance suficiente
                const walletBalance = 2450; // Simulated balance
                if (walletBalance < total) {
                    throw new Error('Saldo insuficiente en la cartera');
                }
                break;
                
            case 'ltd':
                const ltdBalance = 150; // Simulated LTD balance
                const ltdRequired = Math.ceil(product.price / 10); // 1 LTD = 10 L
                if (ltdBalance < ltdRequired) {
                    throw new Error('LTD Tokens insuficientes');
                }
                break;
                
            case 'card':
                // Simular validación de tarjeta
                if (Math.random() < 0.1) { // 10% chance of failure for demo
                    throw new Error('Pago rechazado por el banco');
                }
                break;
        }
        
        return {
            success: true,
            transactionId: 'tx_' + Date.now(),
            method: method,
            amount: total
        };
    }
    
    async createOrder(product, paymentMethod) {
        const order = {
            id: 'order_' + Date.now(),
            productId: product.id,
            productName: product.name,
            sellerId: product.seller.id,
            sellerName: product.seller.name,
            buyerId: this.currentUser.id,
            buyerName: this.currentUser.name,
            quantity: 1,
            unitPrice: product.price,
            total: product.price * 1.02,
            paymentMethod: paymentMethod,
            status: 'confirmed',
            orderDate: new Date(),
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };
        
        // Guardar orden en localStorage
        const orders = JSON.parse(localStorage.getItem('marketplace_orders') || '[]');
        orders.unshift(order);
        localStorage.setItem('marketplace_orders', JSON.stringify(orders));
        
        return order;
    }
    
    async rewardLTDTokens(amount) {
        try {
            // Simular award de tokens LTD
            const currentTokens = parseInt(localStorage.getItem('ltd_tokens') || '0');
            const newBalance = currentTokens + amount;
            localStorage.setItem('ltd_tokens', newBalance.toString());
            
            this.showNotification(`🪙 +${amount} LTD Tokens ganados!`, 'success');
            
        } catch (error) {
            console.error('Error rewarding LTD tokens:', error);
        }
    }
    
    showPurchaseSuccess(order) {
        const successModal = document.createElement('div');
        successModal.className = 'success-modal';
        successModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content purchase-success">
                <div class="success-animation">
                    <div class="checkmark">✅</div>
                </div>
                <h2>¡Compra Exitosa!</h2>
                <p>Tu orden <strong>#${order.id}</strong> ha sido confirmada</p>
                <div class="order-details">
                    <div class="detail-item">
                        <span>Producto:</span>
                        <span>${order.productName}</span>
                    </div>
                    <div class="detail-item">
                        <span>Total pagado:</span>
                        <span>L ${order.total.toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <span>Entrega estimada:</span>
                        <span>${order.estimatedDelivery.toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="success-actions">
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Continuar Comprando
                    </button>
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove(); window.marketplaceSystem.switchTab('orders')">
                        Ver Mis Órdenes
                    </button>
                </div>
            </div>
        `;
        
        successModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10002;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        document.body.appendChild(successModal);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (successModal.parentNode) {
                successModal.remove();
            }
        }, 10000);
    }
    
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Simular agregar al carrito
        const cart = JSON.parse(localStorage.getItem('marketplace_cart') || '[]');
        const existingItem = cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                productId: productId,
                productName: product.name,
                price: product.price,
                quantity: 1,
                seller: product.seller.name
            });
        }
        
        localStorage.setItem('marketplace_cart', JSON.stringify(cart));
        
        this.showNotification(`${product.name} agregado al carrito`, 'success');
        this.updateCartCounter();
    }
    
    updateCartCounter() {
        const cart = JSON.parse(localStorage.getItem('marketplace_cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCounters = document.querySelectorAll('.cart-counter');
        cartCounters.forEach(counter => {
            counter.textContent = totalItems;
            counter.style.display = totalItems > 0 ? 'inline' : 'none';
        });
    }
}

// Global functions for UI interactions
function showCreateProductModal() {
    document.getElementById('createProductModal').classList.add('active');
}

function closeCreateProductModal() {
    if (window.marketplaceSystem) {
        window.marketplaceSystem.closeCreateProductModal();
    }
}

function showCreatePostModal() {
    document.getElementById('createPostModal').classList.add('active');
}

function closeCreatePostModal() {
    if (window.marketplaceSystem) {
        window.marketplaceSystem.closeCreatePostModal();
    }
}

function viewProduct(productId) {
    if (window.marketplaceSystem) {
        window.marketplaceSystem.showProductModal(productId);
    }
}

function buyProduct(productId) {
    if (window.marketplaceSystem) {
        window.marketplaceSystem.initiatePurchase(productId);
    }
}

function toggleLike(postId) {
    console.log('Toggling like for post:', postId);
    window.marketplaceSystem?.showNotification('¡Like agregado!', 'success');
}

function showComments(postId) {
    console.log('Showing comments for post:', postId);
    window.marketplaceSystem?.showNotification('Comentarios en desarrollo', 'info');
}

function sharePost(postId) {
    console.log('Sharing post:', postId);
    window.marketplaceSystem?.showNotification('¡Post compartido!', 'success');
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
    window.marketplaceSystem = new MarketplaceSocialSystem();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketplaceSocialSystem;
}