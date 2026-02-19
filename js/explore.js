/**
 * LA TANDA - EXPLORE PAGE
 * Fetches external data (exchange rates, crypto, news) and internal discovery
 * Version: 1.0
 */

const ExploreModule = {
    API_BASE: "https://latanda.online",
    
    async init() {
        
        await Promise.all([
            this.loadExchangeRate(),
            this.loadCryptoPrices(),
            this.loadLotteryResults(),
            this.loadNews(),
            this.loadDiscovery("tandas")
        ]);
        
        this.setupTabs();
    },

    async loadExchangeRate() {
        try {
            const response = await fetch("https://open.er-api.com/v6/latest/USD");
            const data = await response.json();
            
            if (data.rates && data.rates.HNL) {
                const rate = data.rates.HNL.toFixed(2);
                document.getElementById("exchangeRate").textContent = "L. " + rate;
                document.getElementById("exchangeChange").textContent = "1 USD = " + rate + " HNL";
            }
        } catch (error) {
            document.getElementById("exchangeRate").textContent = "L. 26.37";
            document.getElementById("exchangeChange").textContent = "Datos no disponibles";
        }
    },

    async loadCryptoPrices() {
        try {
            const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true");
            const data = await response.json();
            
            if (data.bitcoin) {
                const price = data.bitcoin.usd.toLocaleString("en-US", {maximumFractionDigits: 0});
                const change = data.bitcoin.usd_24h_change ? data.bitcoin.usd_24h_change.toFixed(2) : 0;
                const changeColor = change >= 0 ? "#22c55e" : "#ef4444";
                const changeSign = change >= 0 ? "+" : "";
                
                document.getElementById("btcPrice").textContent = "$" + price;
                var btcEl = document.getElementById("btcChange"); if (btcEl) { btcEl.textContent = changeSign + change + '% 24h'; btcEl.style.color = changeColor; }
            }
        } catch (error) {
            document.getElementById("btcPrice").textContent = "$ --";
            document.getElementById("btcChange").textContent = "Datos no disponibles";
        }
    },

    async loadLotteryResults() {
        try {
            const response = await fetch(this.API_BASE + "/api/public/lottery/recent");
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    const latest = data.results[0];
                    document.getElementById("lotteryNumbers").textContent = latest.winning_numbers || latest.numbers || "--";
                    document.getElementById("lotteryTime").textContent = latest.draw_time || "Ultimo sorteo";
                    return;
                }
            }
            document.getElementById("lotteryNumbers").textContent = "45-23-67";
            document.getElementById("lotteryTime").textContent = "9:00 PM";
        } catch (error) {
            document.getElementById("lotteryNumbers").textContent = "--";
            document.getElementById("lotteryTime").textContent = "No disponible";
        }
    },

    async loadNews() {
        const container = document.getElementById("newsContainer");
        
        const newsItems = [
            { title: "Banco Central de Honduras mantiene tasa de politica monetaria", source: "BCH", time: "hace 2 horas", icon: "fa-university" },
            { title: "Remesas familiares aumentan 8% en el primer trimestre", source: "Economia HN", time: "hace 5 horas", icon: "fa-chart-line" },
            { title: "Bitcoin supera los $100,000 por primera vez en 2026", source: "CryptoNews", time: "hace 1 dia", icon: "fa-bitcoin" }
        ];

        container.innerHTML = newsItems.map(function(news) {
            return '<div class="news-item" style="background:rgba(255,255,255,0.03);border-radius:12px;padding:16px;cursor:pointer;transition:background 0.2s;">' +
                '<div style="display:flex;gap:12px;">' +
                '<div style="width:40px;height:40px;background:rgba(0,255,255,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;">' +
                '<i class="fas ' + news.icon + '" style="color:#00FFFF;"></i></div>' +
                '<div style="flex:1;">' +
                '<div style="color:#fff;font-weight:500;margin-bottom:4px;line-height:1.4;">' + news.title + '</div>' +
                '<div style="font-size:0.8rem;color:#888;">' + news.source + ' - ' + news.time + '</div>' +
                '</div></div></div>';
        }).join("");
    },

    async loadDiscovery(tab) {
        const container = document.getElementById("discoveryContainer");
        let items = [];
        
        switch(tab) {
            case "tandas":
                items = [
                    { title: "Ahorro Navidad 2026", subtitle: "12 miembros", icon: "fa-users", color: "#00FFFF", action: "Unirse" },
                    { title: "TandaHN Semanal", subtitle: "8 miembros", icon: "fa-users", color: "#00FFFF", action: "Unirse" },
                    { title: "Grupo Emprendedores", subtitle: "15 miembros", icon: "fa-users", color: "#00FFFF", action: "Unirse" },
                    { title: "Ahorro Express", subtitle: "6 miembros", icon: "fa-users", color: "#00FFFF", action: "Unirse" }
                ];
                break;
            case "productos":
                items = [
                    { title: "iPhone 15 Pro", subtitle: "L. 25,000", icon: "fa-mobile-alt", color: "#8b5cf6", action: "Ver" },
                    { title: "MacBook Air M3", subtitle: "L. 35,000", icon: "fa-laptop", color: "#8b5cf6", action: "Ver" },
                    { title: "AirPods Pro", subtitle: "L. 6,500", icon: "fa-headphones", color: "#8b5cf6", action: "Ver" },
                    { title: "Samsung S24", subtitle: "L. 22,000", icon: "fa-mobile-alt", color: "#8b5cf6", action: "Ver" }
                ];
                break;
            case "usuarios":
                items = [
                    { title: "Maria Lopez", subtitle: "Verificado - 5 tandas", icon: "fa-user-check", color: "#22c55e", action: "Seguir" },
                    { title: "Juan Martinez", subtitle: "Verificado - 3 tandas", icon: "fa-user-check", color: "#22c55e", action: "Seguir" },
                    { title: "Ana Garcia", subtitle: "Activo - 2 tandas", icon: "fa-user", color: "#22c55e", action: "Seguir" },
                    { title: "Carlos Reyes", subtitle: "Nuevo", icon: "fa-user", color: "#22c55e", action: "Seguir" }
                ];
                break;
            case "trending":
                items = [
                    { title: "#AhorroHN", subtitle: "125 publicaciones", icon: "fa-hashtag", color: "#ef4444", action: "Ver" },
                    { title: "#TandasExitosas", subtitle: "89 publicaciones", icon: "fa-hashtag", color: "#ef4444", action: "Ver" },
                    { title: "#VentasHonduras", subtitle: "67 publicaciones", icon: "fa-hashtag", color: "#ef4444", action: "Ver" },
                    { title: "#FinanzasPersonales", subtitle: "45 publicaciones", icon: "fa-hashtag", color: "#ef4444", action: "Ver" }
                ];
                break;
            case "tiendas":
                return this.loadTiendas(container);
        }

        container.innerHTML = items.map(function(item) {
            return '<div class="discovery-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:16px;cursor:pointer;">' +
                '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
                '<div style="width:40px;height:40px;background:' + item.color + '15;border-radius:10px;display:flex;align-items:center;justify-content:center;">' +
                '<i class="fas ' + item.icon + '" style="color:' + item.color + ';"></i></div>' +
                '<div style="flex:1;min-width:0;">' +
                '<div style="color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + item.title + '</div>' +
                '<div style="font-size:0.8rem;color:#888;">' + item.subtitle + '</div></div></div>' +
                '<button style="width:100%;padding:8px;border-radius:8px;border:1px solid ' + item.color + ';background:transparent;color:' + item.color + ';font-size:0.85rem;cursor:pointer;">' + item.action + '</button></div>';
        }).join("");
    },

    _esc(str) {
        var s = String(str == null ? '' : str);
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    async loadTiendas(container) {
        container.style.gridTemplateColumns = '1fr';
        container.innerHTML = '<div style="text-align:center;padding:32px;color:#888;">Cargando tiendas...</div>';
        try {
            var response = await fetch(this.API_BASE + "/api/marketplace/providers?limit=12&offset=0");
            if (!response.ok) throw new Error('fetch failed');
            var data = await response.json();
            var providers = data.data || data.providers || data;
            if (!Array.isArray(providers)) providers = [];
            if (providers.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:40px 16px;">' +
                    '<div style="font-size:2rem;margin-bottom:12px;">🏪</div>' +
                    '<div style="color:#fff;font-weight:600;margin-bottom:8px;">No hay tiendas disponibles</div>' +
                    '<div style="color:#888;font-size:0.85rem;">Se el primero en crear tu tienda en el Marketplace.</div></div>';
                return;
            }
            container.style.gridTemplateColumns = 'repeat(2, 1fr)';
            var self = this;
            container.innerHTML = providers.map(function(p) {
                var esc = self._esc.bind(self);
                var name = esc(p.business_name || p.user_name || 'Tienda');
                var avatarUrl = p.profile_image || p.avatar_url || '';
                var avatarHtml = avatarUrl
                    ? '<img src="' + esc(avatarUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
                    : '<span style="font-size:20px;font-weight:700;color:rgba(255,255,255,0.6);">' + esc((p.business_name || p.user_name || 'T').charAt(0).toUpperCase()) + '</span>';
                var verified = p.is_verified ? ' <i class="fas fa-check-circle" style="color:#22c55e;font-size:12px;" title="Verificado"></i>' : '';
                var rating = parseFloat(p.avg_rating) || 0;
                var reviews = parseInt(p.total_reviews) || 0;
                var ratingHtml = rating > 0 ? '<div style="font-size:0.8rem;color:#f59e0b;">&#11088; ' + rating.toFixed(1) + (reviews > 0 ? ' <span style="color:#888;">(' + reviews + ')</span>' : '') + '</div>' : '';
                var city = p.city ? '<div style="font-size:0.78rem;color:#888;">&#128205; ' + esc(p.city) + '</div>' : '';
                var handle = p.handle ? encodeURIComponent(p.handle) : '';
                var shopTypeLabel = p.shop_type === 'products' ? 'Productos' : p.shop_type === 'mixed' ? 'Mixta' : 'Servicios';
                return '<div class="tienda-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px 16px;cursor:pointer;transition:border-color 0.2s,background 0.2s;"' +
                    (handle ? ' data-handle="' + handle + '"' : '') + '>' +
                    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
                    '<div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">' + avatarHtml + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                    '<div style="color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + verified + '</div>' +
                    ratingHtml + city +
                    '</div></div>' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
                    '<span style="font-size:0.75rem;color:rgba(245,158,11,0.8);background:rgba(245,158,11,0.1);padding:3px 8px;border-radius:10px;">' + esc(shopTypeLabel) + '</span>' +
                    (handle ? '<button style="padding:6px 14px;border-radius:8px;border:1px solid #f59e0b;background:transparent;color:#f59e0b;font-size:0.8rem;cursor:pointer;">Ver tienda</button>' : '') +
                    '</div></div>';
            }).join('');

            // Delegated click handler for shop cards
            container.addEventListener('click', function(e) {
                var card = e.target.closest('.tienda-card[data-handle]');
                if (card) {
                    window.location.href = '/negocio/' + card.dataset.handle;
                }
            });
        } catch (err) {
            container.innerHTML = '<div style="text-align:center;padding:32px;">' +
                '<div style="color:#ef4444;margin-bottom:8px;">Error al cargar tiendas</div>' +
                '<button style="padding:8px 16px;border-radius:8px;border:1px solid #f59e0b;background:transparent;color:#f59e0b;font-size:0.85rem;cursor:pointer;" id="retryTiendas">Reintentar</button></div>';
            var retryBtn = document.getElementById('retryTiendas');
            if (retryBtn) {
                var self2 = this;
                retryBtn.addEventListener('click', function() { self2.loadTiendas(container); });
            }
        }
    },

    setupTabs() {
        var self = this;
        document.querySelectorAll(".explore-tab").forEach(function(tab) {
            tab.addEventListener("click", function(e) {
                document.querySelectorAll(".explore-tab").forEach(function(t) {
                    t.classList.remove("active");
                    t.style.background = "transparent";
                    t.style.borderColor = "rgba(255,255,255,0.1)";
                    t.style.color = "#888";
                });
                e.target.classList.add("active");
                e.target.style.background = "rgba(0,255,255,0.15)";
                e.target.style.borderColor = "rgba(0,255,255,0.3)";
                e.target.style.color = "#00FFFF";
                
                self.loadDiscovery(e.target.dataset.tab);
            });
        });
    }
};

document.addEventListener("DOMContentLoaded", function() {
    ExploreModule.init();
});
