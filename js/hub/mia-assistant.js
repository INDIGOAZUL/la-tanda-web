/**
 * LA TANDA - MIA Assistant Widget
 * Floating AI assistant for the Hub
 * Version: 2.0.0 — Phase 1 audit upgrade
 */

const MiaAssistant = {
    widget: null,
    isExpanded: false,
    isMinimized: false,
    conversationHistory: [],
    isLoading: false,
    STORAGE_KEY: 'mia_chat_history',
    MAX_MESSAGES: 50,

    quickActions: [
        { id: "check-balance", icon: "fa-wallet", label: "Ver balance", handler: () => window.location.href = "wallet.html" },
        { id: "pay-tanda", icon: "fa-money-bill", label: "Pagar tanda", handler: () => window.location.href = "groups-advanced-system.html" },
        { id: "play-lottery", icon: "fa-ticket-alt", label: "Jugar loteria", handler: () => window.location.href = "lottery-predictor.html" },
        { id: "mine-ltd", icon: "fa-hammer", label: "Minar LTD", handler: () => document.getElementById("mining-section")?.scrollIntoView({behavior: "smooth"}) },
        { id: "sell-product", icon: "fa-store", label: "Vender producto", handler: () => window.location.href = "marketplace-social.html?action=create" }
    ],

    init() {
        this.loadHistory();
        this.initVoice();
        this.createWidget();
        this.attachEventHandlers();
    },

    // ===== PERSISTENCE =====
    loadHistory() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    this.conversationHistory = parsed.slice(-this.MAX_MESSAGES);
                }
            }
        } catch (e) { /* ignore corrupt data */ }
    },

    saveHistory() {
        try {
            const toSave = this.conversationHistory.slice(-this.MAX_MESSAGES);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) { /* localStorage full or unavailable */ }
    },

    clearHistory() {
        this.conversationHistory = [];
        localStorage.removeItem(this.STORAGE_KEY);
        const container = this.widget.querySelector(".mia-chat-messages");
        if (container) container.innerHTML = '';
        this.showGreeting();
    },

    // ===== WIDGET HTML =====
    createWidget() {
        this.widget = document.createElement("div");
        this.widget.id = "mia-assistant-widget";
        this.widget.className = "mia-widget";
        this.widget.innerHTML = this.getWidgetHTML();
        document.body.appendChild(this.widget);
        // Render saved messages
        if (this.conversationHistory.length > 0) {
            this.renderSavedMessages();
        }
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
                        <div class="mia-avatar-small"><i class="fas fa-robot"></i></div>
                        <div class="mia-header-info">
                            <span class="mia-name">MIA</span>
                            <span class="mia-status">Asistente IA</span>
                        </div>
                    </div>
                    <div class="mia-header-actions">
                        <button class="mia-btn-clear" onclick="MiaAssistant.clearHistory()" title="Limpiar chat">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <button class="mia-btn-minimize" onclick="MiaAssistant.minimize()">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="mia-btn-close" onclick="MiaAssistant.collapse()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="mia-body">
                    <div class="mia-chat-messages" id="miaChatMessages">
                        <div class="mia-greeting" id="miaGreeting">
                            <p>Hola! Soy MIA, tu asistente virtual.</p>
                            <p>Que puedo hacer por ti hoy?</p>
                        </div>
                    </div>

                    <div class="mia-quick-actions" id="miaQuickActions">
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
                        <button class="mia-mic-btn" onclick="MiaAssistant.toggleVoice()" id="miaMicBtn" title="Entrada de voz">
                            <i class="fas fa-microphone"></i>
                        </button>
                        <button class="mia-send-btn" onclick="MiaAssistant.sendMessage()" id="miaSendBtn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // ===== RENDERING =====
    renderSavedMessages() {
        const container = this.widget.querySelector("#miaChatMessages");
        const greeting = this.widget.querySelector("#miaGreeting");
        if (greeting) greeting.style.display = 'none';

        for (const msg of this.conversationHistory) {
            this.renderMessage(msg.role, msg.content, msg.actions, msg.timestamp, false);
        }
    },

    showGreeting() {
        const greeting = this.widget.querySelector("#miaGreeting");
        if (greeting) greeting.style.display = '';
    },

    renderMessage(role, content, actions, timestamp, scroll) {
        const container = this.widget.querySelector("#miaChatMessages");
        if (!container) return;

        // Hide greeting on first message
        const greeting = this.widget.querySelector("#miaGreeting");
        if (greeting) greeting.style.display = 'none';

        const msgDiv = document.createElement("div");
        msgDiv.className = "mia-msg mia-msg-" + role;

        // Message content
        const contentDiv = document.createElement("div");
        contentDiv.className = "mia-msg-content";
        if (role === "assistant") {
            contentDiv.innerHTML = this.formatMarkdown(content);
        } else {
            contentDiv.textContent = content;
        }
        msgDiv.appendChild(contentDiv);

        // Action buttons
        if (role === "assistant" && actions && actions.length > 0) {
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "mia-msg-actions";
            for (const action of actions) {
                const btn = document.createElement("a");
                btn.className = "mia-action-link";
                btn.href = action.url || "#";
                btn.innerHTML = '<i class="fas ' + (action.icon || 'fa-arrow-right') + '"></i> ' + this.escapeHtml(action.label);
                actionsDiv.appendChild(btn);
            }
            msgDiv.appendChild(actionsDiv);
        }

        // Timestamp
        const timeDiv = document.createElement("div");
        timeDiv.className = "mia-msg-time";
        timeDiv.textContent = this.formatTime(timestamp || Date.now());
        msgDiv.appendChild(timeDiv);

        container.appendChild(msgDiv);
        if (scroll !== false) container.scrollTop = container.scrollHeight;
    },

    formatMarkdown(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        let html = div.innerHTML;
        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        // Lists (lines starting with - or *)
        html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
        if (html.includes('<li>')) {
            html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        }
        return '<p>' + html + '</p>';
    },

    formatTime(ts) {
        if (!ts) return '';
        const date = new Date(ts);
        const now = Date.now();
        const diffMs = now - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'ahora';
        if (diffMin < 60) return 'hace ' + diffMin + 'm';
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs < 24) return 'hace ' + diffHrs + 'h';
        return date.toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
    },

    // ===== TYPING INDICATOR =====
    showTyping() {
        const container = this.widget.querySelector("#miaChatMessages");
        if (!container) return;
        const existing = document.getElementById("miaTyping");
        if (existing) return;
        const typing = document.createElement("div");
        typing.className = "mia-typing";
        typing.id = "miaTyping";
        typing.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    },

    hideTyping() {
        const el = document.getElementById("miaTyping");
        if (el) el.remove();
    },

    // ===== MESSAGING =====
    async sendMessage() {
        const input = document.getElementById("miaInput");
        const sendBtn = document.getElementById("miaSendBtn");
        if (!input || !input.value.trim() || this.isLoading) return;

        const message = input.value.trim();
        input.value = "";

        const userTs = Date.now();
        this.renderMessage("user", message, null, userTs, true);
        this.isLoading = true;
        if (sendBtn) sendBtn.disabled = true;
        this.showTyping();

        try {
            const response = await fetch("/api/mia/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + (localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "")
                },
                body: JSON.stringify({
                    message: message,
                    conversationHistory: this.conversationHistory.slice(-10)
                })
            });

            this.hideTyping();
            const data = await response.json();

            if (data.success && data.data.response) {
                const assistantTs = Date.now();
                const actions = data.data.actions || [];
                this.renderMessage("assistant", data.data.response, actions, assistantTs, true);

                this.conversationHistory.push(
                    { role: "user", content: message, timestamp: userTs },
                    { role: "assistant", content: data.data.response, actions: actions, timestamp: assistantTs }
                );
                // Cap history
                if (this.conversationHistory.length > this.MAX_MESSAGES) {
                    this.conversationHistory = this.conversationHistory.slice(-this.MAX_MESSAGES);
                }
                this.saveHistory();
            } else {
                this.renderMessage("assistant", "Lo siento, hubo un error. Intenta de nuevo.", null, Date.now(), true);
            }
        } catch (error) {
            this.hideTyping();
            this.renderMessage("assistant", "Lo siento, no pude conectarme.", null, Date.now(), true);
        } finally {
            this.isLoading = false;
            if (sendBtn) sendBtn.disabled = false;
            input.focus();
        }
    },

    // ===== UI STATE =====
    attachEventHandlers() {
        const avatarImg = this.widget.querySelector('.mia-avatar-img');
        if (avatarImg) {
            avatarImg.addEventListener('error', function() {
                this.style.display = 'none';
                const fallback = this.nextElementSibling;
                if (fallback) fallback.style.display = 'flex';
            });
        }

        document.getElementById("miaMinimized")?.addEventListener("click", () => this.expand());

        this.widget.querySelectorAll(".mia-action-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const action = this.quickActions.find(a => a.id === btn.dataset.action);
                if (action?.handler) { action.handler(); this.collapse(); }
            });
        });

        document.getElementById("miaInput")?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.sendMessage();
        });

        document.addEventListener("click", (e) => {
            if (this.isExpanded && !this.widget.contains(e.target)) this.collapse();
        });
    },

    expand() {
        this.isExpanded = true;
        this.isMinimized = false;
        this.widget.classList.add("expanded");
        this.widget.classList.remove("minimized");
        setTimeout(() => {
            const input = document.getElementById("miaInput");
            if (input) input.focus();
            const container = this.widget.querySelector("#miaChatMessages");
            if (container) container.scrollTop = container.scrollHeight;
        }, 300);
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

    showNotification() {
        const indicator = this.widget.querySelector(".mia-indicator");
        if (indicator) indicator.classList.add("active");
    },

    hideNotification() {
        const indicator = this.widget.querySelector(".mia-indicator");
        if (indicator) indicator.classList.remove("active");
    },

    // v4.25.13 audit round 30: restored escapeHtml body (was empty, fell into voice section)
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    },

    // ===== VOICE INPUT =====
    recognition: null,
    isRecording: false,

    initVoice() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            const btn = document.getElementById('miaMicBtn');
            if (btn) btn.style.display = 'none';
            return;
        }
        this.recognition = new SR();
        this.recognition.lang = 'es-HN';
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.continuous = false;

        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            const input = document.getElementById('miaInput');
            if (input) input.value = transcript;
            if (event.results[event.results.length - 1].isFinal) {
                this.stopVoice();
                if (transcript.trim()) setTimeout(() => this.sendMessage(), 300);
            }
        };

        this.recognition.onerror = () => this.stopVoice();
        this.recognition.onend = () => this.stopVoice();
    },

    toggleVoice() {
        if (this.isRecording) this.stopVoice();
        else this.startVoice();
    },

    startVoice() {
        if (!this.recognition) return;
        try {
            this.recognition.start();
            this.isRecording = true;
            const btn = document.getElementById('miaMicBtn');
            if (btn) { btn.classList.add('recording'); btn.querySelector('i').className = 'fas fa-stop'; }
            const input = document.getElementById('miaInput');
            if (input) input.placeholder = 'Habla ahora...';
        } catch (e) { this.stopVoice(); }
    },

    stopVoice() {
        if (this.recognition && this.isRecording) {
            try { this.recognition.stop(); } catch (e) {}
        }
        this.isRecording = false;
        const btn = document.getElementById('miaMicBtn');
        if (btn) { btn.classList.remove('recording'); btn.querySelector('i').className = 'fas fa-microphone'; }
        const input = document.getElementById('miaInput');
        if (input) input.placeholder = 'Escribe tu pregunta...';
    }
};

// Auto-initialize
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => MiaAssistant.init(), 2000);
});

window.MiaAssistant = MiaAssistant;
