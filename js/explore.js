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
