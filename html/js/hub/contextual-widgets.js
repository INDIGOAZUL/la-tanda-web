/**
 * LA TANDA - Contextual Widgets System
 * Dynamic right sidebar widgets based on active page
 * Version: 1.2.0
 */

const ContextualWidgets = {

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    container: null,
    currentPage: null,
    promoInterval: null,
    promoCurrentIndex: 0,

    // Static promo/event data (ready for future API connection)
    promoData: [
        {
            badge: 'Evento',
            badgeType: 'evento',
            icon: 'fas fa-dice',
            title: 'Sorteo Especial',
            desc: 'Premios dobles este fin de semana',
            url: '/lottery-predictor.html'
        },
        {
            badge: 'Nuevo',
            badgeType: 'nuevo',
            icon: 'fas fa-store',
            title: 'Marketplace Abierto',
            desc: 'Publica y vende tus productos',
            url: '/marketplace-social.html'
        },
        {
            badge: 'Promo',
            badgeType: 'promo',
            icon: 'fas fa-coins',
            title: 'Mineria Diaria',
            desc: 'Gana LTD por actividad diaria',
            url: '/mineria.html'
        },
        {
            badge: 'Comunidad',
            badgeType: 'comunidad',
            icon: 'fas fa-users',
            title: 'Crea tu Tanda',
            desc: 'Invita amigos y ahorra juntos',
            url: '/groups-advanced-system.html'
        },
        {
            badge: 'IA',
            badgeType: 'ia',
            icon: 'fas fa-robot',
            title: 'Preguntale a MIA',
            desc: 'Tu asistente inteligente',
            url: '/mia.html'
        }
    ],

    init(containerId = 'contextualWidgets') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            return;
        }

        // Detect current page
        this.currentPage = this.detectCurrentPage();
// Render appropriate widgets
        this.render();
    },

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('home-dashboard')) return 'inicio';
        if (path.includes('explorar')) return 'explorar';
        if (path.includes('trabajo')) return 'trabajo';
        if (path.includes('creator-hub')) return 'creator';
        if (path.includes('guardados')) return 'guardados';
        if (path.includes('mensajes')) return 'mensajes';
        if (path.includes('mineria')) return 'mineria';
        if (path.includes('lottery') || path.includes('predictor')) return 'loteria';
        if (path.includes('marketplace')) return 'mercado';
        if (path.includes('mia')) return 'mia';
        return 'inicio';
    },

    render() {
        if (!this.container) return;

        const widgets = this.getWidgetsForPage(this.currentPage);
        this.container.innerHTML = widgets;

        // Initialize any dynamic content
        this.initDynamicContent();
    },

    getWidgetsForPage(page) {
        const widgetTemplates = {
            inicio: this.renderInicioWidgets(),
            explorar: this.renderExplorarWidgets(),
            trabajo: this.renderTrabajoWidgets(),
            creator: this.renderCreatorWidgets(),
            guardados: this.renderGuardadosWidgets(),
            mensajes: this.renderMensajesWidgets(),
            mineria: this.renderMineriaWidgets(),
            loteria: this.renderLoteriaWidgets(),
            mercado: this.renderMercadoWidgets(),
            mia: this.renderMiaWidgets()
        };

        return widgetTemplates[page] || widgetTemplates.inicio;
    },

    // ============ WIDGET TEMPLATES ============

    renderInicioWidgets() {
        const slidesHTML = this.promoData.map((promo, i) => `
            <div class="promo-slide${i === 0 ? ' active' : ''}" data-url="${promo.url}" data-index="${i}">
                <div class="promo-badge promo-badge--${promo.badgeType}">${promo.badge}</div>
                <div class="promo-icon"><i class="${promo.icon}"></i></div>
                <div class="promo-text">
                    <h5>${promo.title}</h5>
                    <p>${promo.desc}</p>
                </div>
            </div>
        `).join('');

        return `
            <div class="widget-card promo-carousel" id="promoCarousel">
                <div class="promo-slides" id="promoSlides">
                    ${slidesHTML}
                </div>
                <div class="promo-dots" id="promoDots"></div>
            </div>
        `;
    },

    // --- Promo Carousel Logic ---

    initPromoCarousel() {
        const carousel = document.getElementById('promoCarousel');
        if (!carousel) return;

        this.promoCurrentIndex = 0;
        this.buildPromoDots();

        // Click on slides to navigate
        const slides = carousel.querySelectorAll('.promo-slide');
        slides.forEach(slide => {
            slide.addEventListener('click', () => {
                const url = slide.dataset.url;
                if (url) window.location.href = url;
            });
        });

        // Auto-rotate every 5 seconds
        this.startPromoRotation();

        // Pause on hover
        carousel.addEventListener('mouseenter', () => this.stopPromoRotation());
        carousel.addEventListener('mouseleave', () => this.startPromoRotation());
    },

    buildPromoDots() {
        const dotsContainer = document.getElementById('promoDots');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = this.promoData.map((_, i) =>
            `<span class="promo-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
        ).join('');

        dotsContainer.querySelectorAll('.promo-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goToPromo(parseInt(dot.dataset.index));
            });
        });
    },

    goToPromo(index) {
        const slides = document.querySelectorAll('#promoSlides .promo-slide');
        const dots = document.querySelectorAll('#promoDots .promo-dot');
        if (!slides.length) return;

        // Clamp index
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');

        this.promoCurrentIndex = index;
    },

    nextPromo() {
        this.goToPromo(this.promoCurrentIndex + 1);
    },

    startPromoRotation() {
        this.stopPromoRotation();
        this.promoInterval = setInterval(() => this.nextPromo(), 5000);
    },

    stopPromoRotation() {
        if (this.promoInterval) {
            clearInterval(this.promoInterval);
            this.promoInterval = null;
        }
    },

    renderExplorarWidgets() {
        return `
            <div class="widget-card">
                <h4><i class="fas fa-search"></i> Búsqueda Rápida</h4>
                <input type="text" class="widget-search" placeholder="Buscar en La Tanda..." id="quickSearch">
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-fire"></i> Trending Ahora</h4>
                <div class="trending-list" id="trendingExplore">
                    <div class="trending-item hot">
                        <span class="trend-rank">1</span>
                        <span class="trend-topic">#CriptoHonduras</span>
                        <span class="trend-count">2.1K</span>
                    </div>
                    <div class="trending-item">
                        <span class="trend-rank">2</span>
                        <span class="trend-topic">#TandasDigitales</span>
                        <span class="trend-count">1.8K</span>
                    </div>
                    <div class="trending-item">
                        <span class="trend-rank">3</span>
                        <span class="trend-topic">#LTDToken</span>
                        <span class="trend-count">1.2K</span>
                    </div>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-tags"></i> Categorías</h4>
                <div class="category-tags">
                    <span class="tag">Tecnología</span>
                    <span class="tag">Finanzas</span>
                    <span class="tag">Negocios</span>
                    <span class="tag">Cripto</span>
                    <span class="tag">Empleo</span>
                </div>
            </div>
        `;
    },

    renderTrabajoWidgets() {
        return `
            <div class="widget-card">
                <h4><i class="fas fa-filter"></i> Filtros</h4>
                <div class="filter-options">
                    <label><input type="checkbox" checked> Tiempo completo</label>
                    <label><input type="checkbox" checked> Medio tiempo</label>
                    <label><input type="checkbox" checked> Freelance</label>
                    <label><input type="checkbox"> Remoto</label>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-building"></i> Empresas Destacadas</h4>
                <div class="company-list">
                    <div class="company-item">
                        <i class="fas fa-briefcase"></i>
                        <span>TechHN Solutions</span>
                    </div>
                    <div class="company-item">
                        <i class="fas fa-briefcase"></i>
                        <span>Banco Atlántida</span>
                    </div>
                    <div class="company-item">
                        <i class="fas fa-briefcase"></i>
                        <span>Grupo Terra</span>
                    </div>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-chart-bar"></i> Estadísticas</h4>
                <div class="job-stats">
                    <div class="stat-item">
                        <span class="stat-num">234</span>
                        <span class="stat-label">Empleos activos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-num">56</span>
                        <span class="stat-label">Nuevos hoy</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderCreatorWidgets() {
        return `
            <div class="widget-card">
                <h4><i class="fas fa-chart-line"></i> Tus Métricas</h4>
                <div class="creator-stats">
                    <div class="metric">
                        <span class="metric-value">0</span>
                        <span class="metric-label">Vistas hoy</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">0</span>
                        <span class="metric-label">Seguidores</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">0</span>
                        <span class="metric-label">Engagement</span>
                    </div>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-lightbulb"></i> Tips del Día</h4>
                <div class="tips-content">
                    <p>💡 Publica contenido regularmente para aumentar tu visibilidad</p>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-trophy"></i> Logros</h4>
                <div class="achievements">
                    <span class="achievement locked"><i class="fas fa-star"></i></span>
                    <span class="achievement locked"><i class="fas fa-heart"></i></span>
                    <span class="achievement locked"><i class="fas fa-fire"></i></span>
                </div>
            </div>
        `;
    },

    renderGuardadosWidgets() {
        return `
            <div class="widget-card">
                <h4><i class="fas fa-folder"></i> Colecciones</h4>
                <div class="collections-list">
                    <div class="collection-item">
                        <i class="fas fa-bookmark"></i>
                        <span>Todos</span>
                        <span class="count">0</span>
                    </div>
                    <div class="collection-item">
                        <i class="fas fa-shopping-bag"></i>
                        <span>Productos</span>
                        <span class="count">0</span>
                    </div>
                    <div class="collection-item">
                        <i class="fas fa-briefcase"></i>
                        <span>Empleos</span>
                        <span class="count">0</span>
                    </div>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-clock"></i> Recientes</h4>
                <p class="empty-state">No hay guardados recientes</p>
            </div>
        `;
    },

    renderMensajesWidgets() {
        return `
            <div class="widget-card">
                <h4><i class="fas fa-users"></i> Contactos Frecuentes</h4>
                <div class="contacts-list" id="frequentContacts">
                    <p class="empty-state">Inicia una conversación</p>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-circle" style="color: #00ff88;"></i> En Línea</h4>
                <div class="online-list" id="onlineUsers">
                    <p class="empty-state">Nadie en línea</p>
                </div>
            </div>
        `;
    },

    renderMineriaWidgets() {
        return `
            <div class="widget-card">
                <h4><i class="fas fa-chart-line"></i> Tu Progreso</h4>
                <div class="mining-progress">
                    <p>Racha actual: <strong>0 días</strong></p>
                    <p>Mejor racha: <strong>0 días</strong></p>
                    <p>Próximo bonus: <strong>7 días</strong></p>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-trophy"></i> Top Mineros</h4>
                <div class="leaderboard" id="miningLeaderboard">
                    <div class="leader-item">
                        <span class="rank">🥇</span>
                        <span class="name">Usuario1</span>
                        <span class="score">365 días</span>
                    </div>
                    <div class="leader-item">
                        <span class="rank">🥈</span>
                        <span class="name">Usuario2</span>
                        <span class="score">280 días</span>
                    </div>
                    <div class="leader-item">
                        <span class="rank">🥉</span>
                        <span class="name">Usuario3</span>
                        <span class="score">195 días</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderLoteriaWidgets() {
        return `
            <div class="widget-card">
                <h4><i class="fas fa-fire"></i> Números Calientes</h4>
                <div class="hot-numbers" id="hotNumbers">
                    <span class="hot-num">45</span>
                    <span class="hot-num">23</span>
                    <span class="hot-num">18</span>
                    <span class="hot-num">67</span>
                    <span class="hot-num">92</span>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-clock"></i> Próximo Sorteo</h4>
                <div class="next-draw">
                    <span class="draw-time" id="nextDrawTime">--:--</span>
                    <span class="draw-label">Turno 3pm</span>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-link"></i> Jaladores</h4>
                <div class="jaladores-preview" id="jaladoresPreview">
                    <p>Selecciona un número para ver sus jaladores</p>
                </div>
            </div>
        `;
    },

    renderMercadoWidgets() {
        return `
            <div class="widget-card">
                <h4><i class="fas fa-tags"></i> Categorías</h4>
                <div class="category-list">
                    <a href="#" class="cat-item">Electrónica</a>
                    <a href="#" class="cat-item">Ropa</a>
                    <a href="#" class="cat-item">Hogar</a>
                    <a href="#" class="cat-item">Vehículos</a>
                    <a href="#" class="cat-item">Servicios</a>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-bolt"></i> Ofertas Flash</h4>
                <div class="flash-sales" id="flashSales">
                    <p class="empty-state">No hay ofertas activas</p>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-history"></i> Visto Recientemente</h4>
                <div class="recent-views" id="recentViews">
                    <p class="empty-state">Sin historial</p>
                </div>
            </div>
        `;
    },

    renderMiaWidgets() {
        return `
            <div class="widget-card">
                <h4><i class="fas fa-robot"></i> MIA Stats</h4>
                <div class="mia-stats">
                    <p>Conversaciones: <strong>0</strong></p>
                    <p>Preguntas hoy: <strong>0</strong></p>
                </div>
            </div>

            <div class="widget-card">
                <h4><i class="fas fa-lightbulb"></i> Preguntas Sugeridas</h4>
                <div class="suggested-questions">
                    <button class="suggestion-btn" onclick="window.location.href='/mia.html?q=' + encodeURIComponent('¿Qué son las tandas?')">¿Qué son las tandas?</button>
                    <button class="suggestion-btn" onclick="window.location.href='/mia.html?q=' + encodeURIComponent('¿Cómo funciona el token LTD?')">¿Cómo funciona LTD?</button>
                    <button class="suggestion-btn" onclick="window.location.href='/mia.html?q=' + encodeURIComponent('¿Cómo uso el predictor?')">¿Cómo uso el predictor?</button>
                </div>
            </div>
        `;
    },

    // ============ DYNAMIC CONTENT ============

    initDynamicContent() {
        if (this.currentPage === 'inicio') {
            this.initPromoCarousel();
        }
    },

    async loadBalance() {
        const balanceEl = document.getElementById('widgetBalance');
        if (!balanceEl) return;

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            if (!token) {
                balanceEl.textContent = '0.00';
                return;
            }

            const res = await fetch('/api/wallet/balance', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (res.ok) {
                const data = await res.json();
                balanceEl.textContent = (data.data?.ltd_balance || 0).toFixed(2);
            }
        } catch (e) {
        }
    },

    async loadSuggestions() {
        const listEl = document.getElementById("suggestionsList");
        if (!listEl) return;

        const fallbackUsers = [
            { id: "1", display_name: "Maria Lopez", username: "marialopez" },
            { id: "2", display_name: "Juan Martinez", username: "juanm" },
            { id: "3", display_name: "Carlos Reyes", username: "creyes" }
        ];

        let users = fallbackUsers;

        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken");
            const res = await fetch("/api/feed/social/suggestions", {
                headers: token ? { "Authorization": "Bearer " + token } : {}
            });

            if (res.ok) {
                const data = await res.json();
                const apiUsers = data.data?.suggestions || data.suggestions || [];
                if (apiUsers.length > 0) {
                    users = apiUsers;
                }
            }
        } catch (e) {
}

        listEl.innerHTML = users.slice(0, 3).map(u => `
            <div class="suggestion-item">
                <div class="suggestion-avatar">${ContextualWidgets.escapeHtml((u.display_name || u.name || "U").charAt(0).toUpperCase())}</div>
                <div class="suggestion-info">
                    <div class="suggestion-name">${ContextualWidgets.escapeHtml(u.display_name || u.name || "Usuario")}</div>
                    <div class="suggestion-handle">@${ContextualWidgets.escapeHtml(u.username || "user")}</div>
                </div>
                <button class="suggestion-follow-btn" data-follow-user-id="${ContextualWidgets.escapeHtml(u.id)}">Seguir</button>
            </div>
        `).join("");

        // Delegated click listener for follow buttons (v3.96.0 - H3)
        listEl.querySelectorAll('.suggestion-follow-btn[data-follow-user-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                ContextualWidgets.followUser(this.getAttribute('data-follow-user-id'), this);
            });
        });
    },

    async followUser(userId, btn) {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;

        try {
            btn.disabled = true;
            btn.textContent = 'Siguiendo';
            btn.style.background = 'rgba(0,255,255,0.15)';
            btn.style.color = '#00FFFF';

            await fetch('/api/feed/social/follow/' + encodeURIComponent(userId), {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
        } catch (e) {
            btn.textContent = 'Seguir';
            btn.style.background = '';
            btn.style.color = '';
            btn.disabled = false;
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ContextualWidgets.init());
} else {
    ContextualWidgets.init();
}

// Export
window.ContextualWidgets = ContextualWidgets;
