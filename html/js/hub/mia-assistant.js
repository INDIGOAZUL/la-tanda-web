/**
 * LA TANDA - MIA Assistant
 * Widget de asistente virtual flotante para el Hub Inteligente
 * Version: 1.0.0
 */

const MiaAssistant = {
    widget: null,
    isExpanded: false,
    isMinimized: false,
    quickActions: [
        { id: "check-balance", icon: "fa-wallet", label: "Ver balance", handler: () => window.location.href = "wallet.html" },
        { id: "pay-tanda", icon: "fa-money-bill", label: "Pagar tanda", handler: () => window.location.href = "groups-advanced-system.html" },
        { id: "play-lottery", icon: "fa-ticket-alt", label: "Jugar loteria", handler: () => window.location.href = "lottery-predictor.html" },
        { id: "mine-ltd", icon: "fa-hammer", label: "Minar LTD", handler: () => document.getElementById("mining-section")?.scrollIntoView({behavior: "smooth"}) },
        { id: "sell-product", icon: "fa-store", label: "Vender producto", handler: () => window.location.href = "marketplace-social.html?action=create" }
    ],

    init() {
        this.createWidget();
        this.attachEventHandlers();
    },

    createWidget() {
        // Create widget container
        this.widget = document.createElement("div");
        this.widget.id = "mia-assistant-widget";
        this.widget.className = "mia-widget";
        this.widget.innerHTML = this.getWidgetHTML();
        document.body.appendChild(this.widget);
    },

    getWidgetHTML() {
        return `
            <div class="mia-widget-minimized" id="miaMinimized">
                <div class="mia-avatar">
                    <img src="img/mia-avatar.svg" alt="MIA" class="mia-avatar-img">
                    <div class="mia-avatar-fallback" style="display: none;">
                        <i class="fas fa-robot"></i>
                    </div>
                </div>
                <div class="mia-indicator"></div>
            </div>

            <div class="mia-widget-expanded" id="miaExpanded">
                <div class="mia-header">
                    <div class="mia-header-left">
                        <div class="mia-avatar-small">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="mia-header-info">
                            <span class="mia-name">MIA</span>
                            <span class="mia-status">Asistente IA</span>
                        </div>
                    </div>
                    <div class="mia-header-actions">
                        <button class="mia-btn-minimize" onclick="MiaAssistant.minimize()">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="mia-btn-close" onclick="MiaAssistant.collapse()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="mia-body">
                    <div class="mia-greeting">
                        <p>Hola! Soy MIA, tu asistente virtual.</p>
                        <p>Que puedo hacer por ti hoy?</p>
                    </div>

                    <div class="mia-quick-actions">
                        <h4>Acciones rapidas:</h4>
                        <div class="mia-actions-grid">
                            ${this.quickActions.map(action => `
                                <button class="mia-action-btn" data-action="${action.id}">
                                    <i class="fas ${action.icon}"></i>
                                    <span>${action.label}</span>
                                </button>
                            `).join("")}
                        </div>
                    </div>

                    <div class="mia-input-area">
                        <input type="text" class="mia-input" placeholder="Escribe tu pregunta..." id="miaInput">
                        <button class="mia-send-btn" onclick="MiaAssistant.sendMessage()">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    attachEventHandlers() {
        // Avatar image error handler (replaces inline onerror)
        const avatarImg = this.widget.querySelector('.mia-avatar-img');
        if (avatarImg) {
            avatarImg.addEventListener('error', function() {
                this.style.display = 'none';
                const fallback = this.nextElementSibling;
                if (fallback) fallback.style.display = 'flex';
            });
        }

        // Click on minimized widget to expand
        const minimized = document.getElementById("miaMinimized");
        if (minimized) {
            minimized.addEventListener("click", () => this.expand());
        }

        // Quick action buttons
        const actionBtns = this.widget.querySelectorAll(".mia-action-btn");
        actionBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const actionId = btn.dataset.action;
                const action = this.quickActions.find(a => a.id === actionId);
                if (action && action.handler) {
                    action.handler();
                    this.collapse();
                }
            });
        });

        // Input enter key
        const input = document.getElementById("miaInput");
        if (input) {
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    this.sendMessage();
                }
            });
        }

        // Close on click outside
        document.addEventListener("click", (e) => {
            if (this.isExpanded && !this.widget.contains(e.target)) {
                this.collapse();
            }
        });
    },

    expand() {
        this.isExpanded = true;
        this.isMinimized = false;
        this.widget.classList.add("expanded");
        this.widget.classList.remove("minimized");

        const input = document.getElementById("miaInput");
        if (input) {
            setTimeout(() => input.focus(), 300);
        }
    },

    collapse() {
        this.isExpanded = false;
        this.isMinimized = false;
        this.widget.classList.remove("expanded", "minimized");
    },

    minimize() {
        this.isMinimized = true;
        this.isExpanded = false;
        this.widget.classList.add("minimized");
        this.widget.classList.remove("expanded");
    },


    conversationHistory: [],
    isLoading: false,

    async sendMessage() {
        const input = document.getElementById("miaInput");
        if (!input || !input.value.trim() || this.isLoading) return;

        const message = input.value.trim();
        input.value = "";

        this.addMessageToChat("user", message);
        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch("/api/mia/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "") },
                body: JSON.stringify({
                    message: message,
                    conversationHistory: this.conversationHistory.slice(-10)
                })
            });
            const data = await response.json();
            if (data.success && data.data.response) {
                this.addMessageToChat("assistant", data.data.response);
                this.conversationHistory.push(
                    { role: "user", content: message },
                    { role: "assistant", content: data.data.response }
                );
            } else {
                this.addMessageToChat("assistant", "Lo siento, hubo un error. Intenta de nuevo.");
            }
        } catch (error) {

            this.addMessageToChat("assistant", "Lo siento, no pude conectarme.");
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    },

    addMessageToChat(role, content) {
        const container = this.widget.querySelector(".mia-greeting");
        if (!container) return;
        const msgClass = role === "user" ? "mia-user-msg" : "mia-assistant-msg";
        container.innerHTML += "<div class=\"" + msgClass + "\"><p>" + this.escapeHtml(content) + "</p></div>";
        container.scrollTop = container.scrollHeight;
    },

    showLoading() {
        const container = this.widget.querySelector(".mia-greeting");
        if (container) {
            container.innerHTML += "<div id=\"miaLoadingMsg\" class=\"mia-assistant-msg\"><p><i class=\"fas fa-spinner fa-spin\"></i> MIA está pensando...</p></div>";
            container.scrollTop = container.scrollHeight;
        }
    },

    hideLoading() {
        const el = document.getElementById("miaLoadingMsg");
        if (el) el.remove();
    },

    showResponse(response) {
        this.addMessageToChat("assistant", response);
    },

    // Show notification indicator
    showNotification() {
        const indicator = this.widget.querySelector(".mia-indicator");
        if (indicator) {
            indicator.classList.add("active");
        }
    },

    // Hide notification indicator
    hideNotification() {
        const indicator = this.widget.querySelector(".mia-indicator");
        if (indicator) {
            indicator.classList.remove("active");
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
};

// Auto-initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    // Delay init to not block page load
    setTimeout(() => {
        MiaAssistant.init();
    }, 2000);
});

// Export
window.MiaAssistant = MiaAssistant;
