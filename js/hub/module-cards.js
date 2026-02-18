function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/**
 * LA TANDA - Module Cards
 * Renderizado de tarjetas de modulos para el Hub Inteligente
 * Version: 1.0.0
 */

const HubModuleCards = {
    container: null,

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {

            return;
        }
    },

    formatCurrency(amount, currency) {
        const num = parseFloat(amount) || 0;
        if (currency === "LTD") {
            return num.toFixed(2) + " LTD";
        }
        return "L. " + num.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatTimeUntil(dateString) {
        const target = new Date(dateString);
        const now = new Date();
        const diff = target - now;

        if (diff <= 0) return "Ahora";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return days + "d " + (hours % 24) + "h";
        }
        return hours + "h " + minutes + "m";
    },

    render(data) {
        if (!this.container || !data) return;

        this.container.innerHTML = `
            <div class="hub-modules-grid">
                ${this.renderFinanzasCard(data)}
                ${this.renderMercadoCard(data)}
                ${this.renderLoteriaCard(data)}
                ${this.renderMineriaCard(data)}
            </div>
        `;

        // Add click handlers
        this.attachEventHandlers();
    },

    renderFinanzasCard(data) {
        const wallet = data.wallet || {};
        const tandas = data.tandas || {};
        const ltdBalance = this.formatCurrency(wallet.ltd_balance, "LTD");
        const activeTandas = tandas.active_count || 0;
        const nextPayment = tandas.next_payment;

        let nextPaymentText = "Sin pagos pendientes";
        if (nextPayment && nextPayment.date) {
            const date = new Date(nextPayment.date);
            nextPaymentText = "Proximo: " + date.toLocaleDateString("es-HN", { day: "numeric", month: "short" });
        }

        return `
            <div class="hub-module-card" data-module="finanzas" onclick="window.location.href='groups-advanced-system.html'">
                <div class="module-card-header">
                    <div class="module-icon finanzas">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <span class="module-title">FINANZAS</span>
                </div>
                <div class="module-card-body">
                    <div class="module-stat-main">
                        <span class="stat-value">${escapeHtml(String(ltdBalance))}</span>
                        <span class="stat-label">Balance</span>
                    </div>
                    <div class="module-stat-secondary">
                        <div class="stat-row">
                            <i class="fas fa-users"></i>
                            <span>${escapeHtml(String(activeTandas))} tandas activas</span>
                        </div>
                        <div class="stat-row">
                            <i class="fas fa-calendar"></i>
                            <span>${escapeHtml(nextPaymentText)}</span>
                        </div>
                    </div>
                </div>
                <div class="module-card-action">
                    <span>Ver tandas</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    },

    renderMercadoCard(data) {
        const marketplace = data.marketplace || {};
        const products = marketplace.products || 0;
        const salesToday = marketplace.sales_today || 0;
        const pendingOrders = marketplace.pending_orders || 0;

        return `
            <div class="hub-module-card" data-module="mercado" onclick="window.location.href='marketplace-social.html'">
                <div class="module-card-header">
                    <div class="module-icon mercado">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <span class="module-title">MERCADO</span>
                    ${pendingOrders > 0 ? `<span class="module-badge alert">${pendingOrders}</span>` : ""}
                </div>
                <div class="module-card-body">
                    <div class="module-stat-main">
                        <span class="stat-value">${products}</span>
                        <span class="stat-label">Productos</span>
                    </div>
                    <div class="module-stat-secondary">
                        <div class="stat-row">
                            <i class="fas fa-shopping-cart"></i>
                            <span>${salesToday} ventas hoy</span>
                        </div>
                        <div class="stat-row">
                            <i class="fas fa-eye"></i>
                            <span>${marketplace.views_today || 0} vistas</span>
                        </div>
                    </div>
                </div>
                <div class="module-card-action">
                    <span>Ver marketplace</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    },

    renderLoteriaCard(data) {
        const lottery = data.lottery || {};
        const hotNumbers = lottery.hot_numbers || [45, 23, 8];
        const spinsLeft = lottery.spins_left || 0;
        const nextDraw = lottery.next_draw;

        const timeUntilDraw = nextDraw ? this.formatTimeUntil(nextDraw) : "---";

        return `
            <div class="hub-module-card" data-module="loteria" onclick="window.location.href='lottery-predictor.html'">
                <div class="module-card-header">
                    <div class="module-icon loteria">
                        <i class="fas fa-ticket-alt"></i>
                    </div>
                    <span class="module-title">LOTERIA</span>
                    ${spinsLeft > 0 ? `<span class="module-badge reward">${spinsLeft}</span>` : ""}
                </div>
                <div class="module-card-body">
                    <div class="module-stat-main hot-numbers">
                        ${hotNumbers.slice(0, 3).map(n => `<span class="hot-number">${n}</span>`).join("")}
                    </div>
                    <div class="module-stat-secondary">
                        <div class="stat-row">
                            <i class="fas fa-fire"></i>
                            <span>Numeros calientes</span>
                        </div>
                        <div class="stat-row">
                            <i class="fas fa-clock"></i>
                            <span>Sorteo: ${timeUntilDraw}</span>
                        </div>
                    </div>
                </div>
                <div class="module-card-action">
                    <span>Jugar ahora</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    },

    renderMineriaCard(data) {
        const mining = data.mining || {};
        const tier = mining.tier_display || "Bronce";
        const streak = mining.streak || 0;
        const dailyReward = mining.daily_reward || 0.5;

        const tierColors = {
            "Bronce": "#cd7f32",
            "Plata": "#c0c0c0",
            "Oro": "#ffd700"
        };
        const tierColor = tierColors[tier] || "#cd7f32";

        return `
            <div class="hub-module-card" data-module="mineria" onclick="document.getElementById('miningSection')?.scrollIntoView({behavior: 'smooth'})">
                <div class="module-card-header">
                    <div class="module-icon mineria">
                        <i class="fas fa-hammer"></i>
                    </div>
                    <span class="module-title">MINERIA</span>
                </div>
                <div class="module-card-body">
                    <div class="module-stat-main">
                        <span class="stat-value tier-badge" style="color: ${tierColor}">${escapeHtml(tier)}</span>
                        <span class="stat-label">Tier actual</span>
                    </div>
                    <div class="module-stat-secondary">
                        <div class="stat-row">
                            <i class="fas fa-fire"></i>
                            <span>${streak} dias de racha</span>
                        </div>
                        <div class="stat-row">
                            <i class="fas fa-coins"></i>
                            <span>+${dailyReward.toFixed(1)} LTD/dia</span>
                        </div>
                    </div>
                </div>
                <div class="module-card-action">
                    <span>Minar ahora</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    },

    attachEventHandlers() {
        // Cards already have onclick handlers in the HTML
        // Add hover effects via CSS
    }
};

// Export
window.HubModuleCards = HubModuleCards;
