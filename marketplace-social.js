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
            electronics: '📱 Electrónicos',
            clothing: '👕 Ropa y Moda',
            home: '🏠 Hogar y Jardín',
            services: '⚙️ Servicios',
            food: '🍕 Comida y Bebidas',
            digital: '💻 Productos Digitales'
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.setupEventListeners();
            await this.loadMarketplaceData();
            await this.loadSocialData();
            this.updateAllDisplays();
            
            console.log('🛍️ Marketplace & Social System initialized');
        } catch (error) {
            console.error('❌ Error initializing marketplace system:', error);
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
                    image: '📱',
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
                    image: '🧥',
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
                    image: '💻',
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
                    image: '☕',
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
                            <div class="seller-rating">⭐ ${product.seller.rating}/5.0</div>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="event.stopPropagation(); buyProduct('${product.id}')">
                        <span>🛒</span> Comprar Ahora
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
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    <button class="action-btn ${post.liked ? 'active' : ''}" onclick="toggleLike('${post.id}')">
                        <span>👍</span> ${post.likes}
                    </button>
                    <button class="action-btn" onclick="showComments('${post.id}')">
                        <span>💬</span> ${post.comments}
                    </button>
                    <button class="action-btn" onclick="sharePost('${post.id}')">
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
    }
    
    closeCreatePostModal() {
        document.getElementById('createPostModal').classList.remove('active');
        document.getElementById('createPostForm').reset();
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
    console.log('Viewing product:', productId);
    window.marketplaceSystem?.showNotification('Vista de producto en desarrollo', 'info');
}

function buyProduct(productId) {
    console.log('Buying product:', productId);
    window.marketplaceSystem?.showNotification('¡Producto agregado al carrito!', 'success');
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