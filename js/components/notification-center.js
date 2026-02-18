// ===== NOTIFICATION CENTER v2.4 - XSS Hardened =====
// Updated: 2026-02-11
// Features: API sync, type-based colors, toast system, preferences modal

class NotificationCenter {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.currentFilter = "all";
        this.userId = this.resolveUserId();
        this.storageKey = "notifications_" + this.userId;
        this.apiBase = window.API_BASE_URL || "";
        this.pollingInterval = null;
        this.pollingEnabled = true;
        this.pollIntervalMs = 60000;
        this.preferences = null;

        this.init();
    }

    resolveUserId() {
        const directId = localStorage.getItem("latanda_user_id") || sessionStorage.getItem("userId");
        if (directId) return directId;
        
        try {
            const userData = localStorage.getItem("latanda_user_data") || localStorage.getItem("latanda_user");
            if (userData) {
                const parsed = JSON.parse(userData);
                if (parsed.id) return parsed.id;
                if (parsed.user_id) return parsed.user_id;
                if (parsed.userId) return parsed.userId;
            }
        } catch (e) {
        }
        
        return "demo-user";
    }

    init() {
        this.createPanel();
        this.createToastContainer();
        this.createPreferencesModal();
        this.attachEventListeners();
        this.loadNotificationsFromAPI();
        this.startPolling();
        this.initPushSubscription();
    }

    getAuthHeaders() {
        const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || "";
        return token ? { "Authorization": "Bearer " + token } : {};
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text != null ? text : '');
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    async loadNotificationsFromAPI() {
        try {
            const response = await fetch(this.apiBase + "/api/notifications?user_id=" + encodeURIComponent(this.userId) + "&limit=50", {
                method: "GET",
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" })
            });

            if (!response.ok) throw new Error("API error: " + response.status);

            const result = await response.json();

            if (result.success && result.data && result.data.notifications) {
                this.notifications = result.data.notifications.map(n => ({
                    id: n.id,
                    type: this.mapNotificationType(n.type),
                    icon: n.icon || this.getIconForType(n.type),
                    title: n.title,
                    message: n.message,
                    time: n.created_at,
                    read: n.read || false,
                    data: n.data || {},
                    originalType: n.type,
                    urgent: this.isUrgentType(n.type)
                }));

                this.unreadCount = result.data.unread || this.notifications.filter(n => !n.read).length;
                this.saveToLocalStorage();
                this.updateUnreadCount();
                this.renderNotifications();
                return true;
            } else {
                throw new Error("Invalid API response");
            }
        } catch (error) {
            this.loadFromLocalStorage();
            return false;
        }
    }

    mapNotificationType(apiType) {
        const typeMap = {
            "lottery_scheduled": "tandas", "lottery_result": "tandas", "lottery_turn_assigned": "tandas",
            "payment_received": "transactions", "payment_sent": "transactions", "payment_due": "transactions",
            "deposit_confirmed": "transactions", "withdrawal_completed": "transactions", "withdrawal_requested": "transactions",
            "tanda_joined": "tandas", "tanda_created": "tandas",
            "group_invited": "social", "member_joined": "social", "member_left": "social", "achievement": "social",
            "security_alert": "system", "system_notice": "system"
        };
        return typeMap[apiType] || "system";
    }

    isUrgentType(apiType) {
        return ["security_alert", "payment_due", "payment_overdue", "suspension_warning"].includes(apiType);
    }

    getIconForType(type) {
        const iconMap = {
            "lottery_scheduled": "📅", "lottery_result": "🎰", "lottery_turn_assigned": "🎯",
            "payment_received": "💰", "payment_sent": "📤", "payment_due": "⏰",
            "deposit_confirmed": "✅", "withdrawal_completed": "💸", "withdrawal_requested": "📤",
            "tanda_joined": "👥", "tanda_created": "🆕", "group_invited": "💌",
            "member_joined": "🎉", "member_left": "👋", "achievement": "🏆",
            "security_alert": "🚨", "system_notice": "📢"
        };
        return iconMap[type] || "🔔";
    }

    getNavigationUrl(notification) {
        const data = notification.data || {};
        const type = notification.originalType || notification.type;
        
        if (type.includes("withdrawal") || type.includes("deposit")) {
            return "my-wallet.html?tab=transactions";
        }
        if (type.includes("payment")) {
            return "my-wallet.html?tab=transactions";
        }
        if (type.includes("tanda") || type.includes("lottery") || type.includes("group")) {
            if (data.group_id) return "groups-advanced-system.html?group=" + encodeURIComponent(data.group_id);
            return "groups-advanced-system.html";
        }
        if (type.includes("member") || type.includes("social") || type.includes("invited")) {
            if (data.group_id) return "groups-advanced-system.html?group=" + encodeURIComponent(data.group_id);
            return "groups-advanced-system.html";
        }
        if (type.includes("security")) {
            return "settings.html?tab=security";
        }
        return null;
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try { this.notifications = JSON.parse(stored); } catch (e) { this.notifications = []; }
        } else {
            this.notifications = [];
        }
        this.updateUnreadCount();
        this.renderNotifications();
    }

    saveToLocalStorage() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.notifications)); } catch (e) {}
    }

    startPolling() {
        if (!this.pollingEnabled) return;
        this.pollingInterval = setInterval(() => this.loadNotificationsFromAPI(), this.pollIntervalMs);
    }

    stopPolling() {
        if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
    }

    createPanel() {
        const panel = document.createElement("div");
        panel.id = "notificationPanel";
        panel.className = "notification-panel";
        panel.innerHTML = `
            <div class="notification-header">
                <h3><i class="fas fa-bell"></i> Notificaciones</h3>
                <div class="notification-header-actions">
                    <button class="prefs-settings-btn" title="Preferencias" id="openPrefsBtn">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="refresh-notifications-btn" title="Actualizar">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="mark-all-read-btn">Marcar todo leído</button>
                    <button class="close-notification-panel"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="notification-tabs">
                <button class="notification-tab active" data-filter="all">Todo</button>
                <button class="notification-tab" data-filter="transactions">Transacciones</button>
                <button class="notification-tab" data-filter="tandas">Tandas</button>
                <button class="notification-tab" data-filter="social">Social</button>
                <button class="notification-tab" data-filter="system">Sistema</button>
            </div>
            <div class="notification-list" id="notificationList">
                <div class="notification-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>
            </div>
            <div class="notification-footer">
                <span class="notification-sync-status"><i class="fas fa-database"></i> Sincronizado</span>
            </div>
        `;
        document.body.appendChild(panel);
    }

    createToastContainer() {
        if (document.getElementById("toastContainer")) return;
        const container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    createPreferencesModal() {
        if (document.getElementById("notificationPrefsOverlay")) return;
        
        const overlay = document.createElement("div");
        overlay.id = "notificationPrefsOverlay";
        overlay.className = "notification-preferences-overlay";
        overlay.innerHTML = `
            <div class="notification-preferences-modal">
                <div class="prefs-modal-header">
                    <h3><i class="fas fa-sliders-h"></i> Preferencias de Notificaciones</h3>
                    <button class="prefs-modal-close" id="closePrefsBtn"><i class="fas fa-times"></i></button>
                </div>
                <div class="prefs-modal-body" id="prefsModalBody">
                    <div class="prefs-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
                <div class="prefs-modal-footer">
                    <span class="prefs-saved-indicator" id="prefsSavedIndicator">
                        <i class="fas fa-check"></i> Guardado
                    </span>
                    <button class="prefs-btn prefs-btn-secondary" id="cancelPrefsBtn">Cancelar</button>
                    <button class="prefs-btn prefs-btn-primary" id="savePrefsBtn">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) this.closePreferences();
        });
    }

    attachEventListeners() {
        document.querySelectorAll(".notification-tab").forEach(tab => {
            tab.addEventListener("click", (e) => {
                document.querySelectorAll(".notification-tab").forEach(t => t.classList.remove("active"));
                e.target.classList.add("active");
                this.currentFilter = e.target.dataset.filter;
                this.renderNotifications();
            });
        });

        const closeBtn = document.querySelector(".close-notification-panel");
        if (closeBtn) closeBtn.addEventListener("click", () => this.toggle());

        const refreshBtn = document.querySelector(".refresh-notifications-btn");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", async () => {
                refreshBtn.classList.add("spinning");
                await this.loadNotificationsFromAPI();
                refreshBtn.classList.remove("spinning");
            });
        }

        const markAllBtn = document.querySelector(".mark-all-read-btn");
        if (markAllBtn) markAllBtn.addEventListener("click", () => this.markAllAsRead());

        const panel = document.getElementById("notificationPanel");
        if (panel) {
            panel.addEventListener("click", (e) => {
                if (e.target.id === "notificationPanel") this.toggle();
            });
        }

        // Preferences buttons
        const openPrefsBtn = document.getElementById("openPrefsBtn");
        if (openPrefsBtn) openPrefsBtn.addEventListener("click", () => this.openPreferences());

        const closePrefsBtn = document.getElementById("closePrefsBtn");
        if (closePrefsBtn) closePrefsBtn.addEventListener("click", () => this.closePreferences());

        const cancelPrefsBtn = document.getElementById("cancelPrefsBtn");
        if (cancelPrefsBtn) cancelPrefsBtn.addEventListener("click", () => this.closePreferences());

        const savePrefsBtn = document.getElementById("savePrefsBtn");
        if (savePrefsBtn) savePrefsBtn.addEventListener("click", () => this.savePreferences());
    }

    renderNotifications() {
        const list = document.getElementById("notificationList");
        if (!list) return;

        const filtered = this.currentFilter === "all"
            ? this.notifications
            : this.notifications.filter(n => n.type === this.currentFilter);

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="notification-empty">
                    <div class="notification-empty-icon">🔔</div>
                    <p class="notification-empty-text">No hay notificaciones</p>
                    <p class="notification-empty-subtext">Cuando recibas notificaciones, aparecerán aquí</p>
                </div>
            `;
            return;
        }

        list.innerHTML = filtered.map(notification => {
            const navUrl = this.getNavigationUrl(notification);
            const classes = [
                "notification-item",
                !notification.read ? "unread" : "",
                navUrl ? "clickable" : "",
                notification.urgent ? "urgent" : "",
                "type-" + notification.type
            ].filter(Boolean).join(" ");
            
            return `
                <div class="${classes}" data-id="${this.escapeHtml(String(notification.id))}" data-nav="${this.escapeHtml(navUrl || '')}" data-type="${this.escapeHtml(notification.type)}">
                    <div class="notification-icon">${this.escapeHtml(notification.icon)}</div>
                    <div class="notification-content">
                        <h4 class="notification-title">${this.escapeHtml(notification.title)}</h4>
                        <p class="notification-message">${this.escapeHtml(notification.message)}</p>
                        <span class="notification-time">${this.getTimeAgo(notification.time)}</span>
                    </div>
                    ${!notification.read ? `<button class="notification-mark-read" data-id="${this.escapeHtml(String(notification.id))}">✓</button>` : ""}
                </div>
            `;
        }).join("");

        list.querySelectorAll(".notification-mark-read").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.markAsRead(btn.dataset.id);
            });
        });

        list.querySelectorAll(".notification-item").forEach(item => {
            item.addEventListener("click", () => {
                const notifId = item.dataset.id;
                const navUrl = item.dataset.nav;
                this.markAsRead(notifId);
                if (navUrl && navUrl !== "null" && navUrl !== "") {
                    window.location.href = navUrl;
                }
            });
        });
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return "Ahora mismo";
        if (seconds < 3600) return "Hace " + Math.floor(seconds / 60) + " min";
        if (seconds < 86400) return "Hace " + Math.floor(seconds / 3600) + " h";
        if (seconds < 604800) return "Hace " + Math.floor(seconds / 86400) + " d";
        return date.toLocaleDateString("es-HN");
    }

    toggle() {
        const panel = document.getElementById("notificationPanel");
        if (panel) {
            panel.classList.toggle("active");
            if (panel.classList.contains("active")) {
                this.loadNotificationsFromAPI();
            }
        }
    }

    async markAsRead(notificationId) {
        const notification = this.notifications.find(n => String(n.id) === String(notificationId));
        if (!notification || notification.read) return;

        notification.read = true;
        this.updateUnreadCount();
        this.renderNotifications();
        this.saveToLocalStorage();

        try {
            await fetch(this.apiBase + "/api/notifications/read/" + notificationId, {
                method: "POST",
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" }),
                body: JSON.stringify({ user_id: this.userId })
            });
        } catch (error) {
        }
    }

    async markAllAsRead() {
        const unread = this.notifications.filter(n => !n.read);
        if (unread.length === 0) return;

        this.notifications.forEach(n => n.read = true);
        this.updateUnreadCount();
        this.renderNotifications();
        this.saveToLocalStorage();

        try {
            await fetch(this.apiBase + "/api/notifications/read-all", {
                method: "POST",
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" }),
                body: JSON.stringify({ user_id: this.userId })
            });
        } catch (error) {
        }
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.updateBadge();
    }

    updateBadge() {
        const badge = document.querySelector("#notifBadge, .notification-badge, .notification-dot, .lt-badge, #notificationCount");
        if (badge) {
            badge.textContent = this.unreadCount > 99 ? "99+" : this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? "flex" : "none";
            if (this.unreadCount >= 5) {
                badge.classList.add("urgent");
            } else {
                badge.classList.remove("urgent");
            }
        }
    }

    async refresh() {
        return await this.loadNotificationsFromAPI();
    }

    // ===== PREFERENCES MODAL =====

    async openPreferences() {
        const overlay = document.getElementById("notificationPrefsOverlay");
        if (overlay) {
            overlay.classList.add("active");
            await this.loadPreferences();
        }
    }

    closePreferences() {
        const overlay = document.getElementById("notificationPrefsOverlay");
        if (overlay) {
            overlay.classList.remove("active");
        }
    }

    async loadPreferences() {
        const body = document.getElementById("prefsModalBody");
        if (!body) return;

        body.innerHTML = `<div class="prefs-loading"><i class="fas fa-spinner fa-spin"></i> Cargando preferencias...</div>`;

        try {
            const response = await fetch(this.apiBase + "/api/notifications/preferences", {
                method: "GET",
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" })
            });

            if (!response.ok) throw new Error("Error loading preferences");

            const result = await response.json();
            this.preferences = result.data || result;
            this.renderPreferencesForm();
        } catch (error) {
            body.innerHTML = `
                <div class="prefs-loading" style="color: #ef4444;">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar preferencias</p>
                    <button class="prefs-btn prefs-btn-secondary" onclick="window.notificationCenter.loadPreferences()">Reintentar</button>
                </div>
            `;
        }
    }

    renderPreferencesForm() {
        const body = document.getElementById("prefsModalBody");
        if (!body || !this.preferences) return;

        const p = this.preferences;
        
        body.innerHTML = `
            <div class="prefs-section">
                <div class="prefs-section-title">
                    <i class="fas fa-bell"></i> Tipos de Notificaciones
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">💰</span> Recordatorios de Pago</div>
                        <div class="prefs-item-desc">Recibe avisos cuando se acerque tu fecha de pago</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_payment_reminders" ${p.payment_reminders ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">👥</span> Actualizaciones de Grupos</div>
                        <div class="prefs-item-desc">Cambios en tus grupos y tandas activas</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_group_updates" ${p.group_updates ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">🎉</span> Actividad de Miembros</div>
                        <div class="prefs-item-desc">Cuando alguien se une o sale de tus grupos</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_member_activity" ${p.member_activity ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">📢</span> Marketing y Promociones</div>
                        <div class="prefs-item-desc">Ofertas especiales y novedades de La Tanda</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_marketing" ${p.marketing ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="prefs-section">
                <div class="prefs-section-title">
                    <i class="fas fa-paper-plane"></i> Canales de Notificación
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">📧</span> Notificaciones por Email</div>
                        <div class="prefs-item-desc">Recibe notificaciones importantes en tu correo</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_email_enabled" ${p.email_enabled ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">🔔</span> Notificaciones Push</div>
                        <div class="prefs-item-desc">Alertas en tu dispositivo aunque no estés en la app</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_push_enabled" ${p.push_enabled ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
            </div>
        `;
    }

    async savePreferences() {
        const saveBtn = document.getElementById("savePrefsBtn");
        const indicator = document.getElementById("prefsSavedIndicator");
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;
        }

        const newPrefs = {
            payment_reminders: document.getElementById("pref_payment_reminders")?.checked ?? true,
            group_updates: document.getElementById("pref_group_updates")?.checked ?? true,
            member_activity: document.getElementById("pref_member_activity")?.checked ?? true,
            marketing: document.getElementById("pref_marketing")?.checked ?? false,
            email_enabled: document.getElementById("pref_email_enabled")?.checked ?? true,
            push_enabled: document.getElementById("pref_push_enabled")?.checked ?? true
        };

        try {
            const response = await fetch(this.apiBase + "/api/notifications/preferences", {
                method: "PUT",
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" }),
                body: JSON.stringify(newPrefs)
            });

            if (!response.ok) throw new Error("Error saving preferences");

            const result = await response.json();
            this.preferences = result.data?.preferences || result.preferences || newPrefs;

            // Show success
            if (indicator) {
                indicator.classList.add("show");
                setTimeout(() => indicator.classList.remove("show"), 2000);
            }

            this.showToast({ type: "success", message: "Preferencias guardadas correctamente" });

            // Handle push toggle side effects
            if (newPrefs.push_enabled) {
                this.subscribeToPush();
            } else {
                this.unsubscribeFromPush();
            }

            // Close modal after short delay
            setTimeout(() => this.closePreferences(), 1500);

        } catch (error) {
            this.showToast({ type: "error", title: "Error", message: "No se pudieron guardar las preferencias" });
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i class="fas fa-save"></i> Guardar`;
            }
        }
    }

    // ===== WEB PUSH SUBSCRIPTION =====

    initPushSubscription() {
        if (!("Notification" in window) || !("PushManager" in window)) return;
        if (Notification.permission === "denied") return;

        // If already granted, silently subscribe
        if (Notification.permission === "granted") {
            this.subscribeToPush();
            return;
        }

        // Check if banner was dismissed in last 7 days
        const dismissed = localStorage.getItem("push_banner_dismissed");
        if (dismissed && (Date.now() - parseInt(dismissed, 10)) < 604800000) return;

        // Show subtle banner after 10 seconds
        setTimeout(() => this.showPushBanner(), 10000);
    }

    showPushBanner() {
        if (document.getElementById("pushBanner")) return;
        if (Notification.permission !== "default") return;

        // Inject CSS if not already present
        if (!document.getElementById("pushBannerStyles")) {
            const style = document.createElement("style");
            style.id = "pushBannerStyles";
            style.textContent = `
                .push-permission-banner {
                    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
                    z-index: 9998; background: rgba(20, 25, 35, 0.95);
                    border: 1px solid rgba(0, 255, 255, 0.3); border-radius: 12px;
                    padding: 12px 16px; max-width: 420px; width: calc(100% - 32px);
                    animation: pushSlideUp 0.3s ease;
                }
                .push-banner-content {
                    display: flex; align-items: center; gap: 10px;
                    color: #e0e0e0; font-size: 13px;
                }
                .push-banner-content i.fa-bell { color: #00ffff; font-size: 18px; flex-shrink: 0; }
                .push-banner-btn {
                    background: linear-gradient(135deg, #00ffff, #0088ff); color: #000;
                    border: none; border-radius: 8px; padding: 6px 14px;
                    font-weight: 600; cursor: pointer; white-space: nowrap; font-size: 12px;
                }
                .push-banner-dismiss {
                    background: none; border: none; color: #666; cursor: pointer;
                    padding: 4px; flex-shrink: 0;
                }
                @keyframes pushSlideUp {
                    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        const banner = document.createElement("div");
        banner.id = "pushBanner";
        banner.className = "push-permission-banner";
        banner.innerHTML = `
            <div class="push-banner-content">
                <i class="fas fa-bell"></i>
                <span>Activa las notificaciones para no perderte nada</span>
                <button class="push-banner-btn" id="pushBannerAccept">Activar</button>
                <button class="push-banner-dismiss" id="pushBannerDismiss">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById("pushBannerAccept").addEventListener("click", async () => {
            banner.remove();
            var permission = await Notification.requestPermission();
            if (permission === "granted") {
                await this.subscribeToPush();
                this.showToast({ type: "success", message: "Notificaciones push activadas" });
            }
        });
        document.getElementById("pushBannerDismiss").addEventListener("click", () => {
            banner.remove();
            localStorage.setItem("push_banner_dismissed", String(Date.now()));
        });
    }

    async subscribeToPush() {
        try {
            var reg = await navigator.serviceWorker.ready;
            var existing = await reg.pushManager.getSubscription();
            if (existing) return; // Already subscribed

            var resp = await fetch(this.apiBase + "/api/push/vapid-key");
            var result = await resp.json();
            var publicKey = result.data ? result.data.publicKey : result.publicKey;
            if (!publicKey) return;

            var sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(publicKey)
            });

            var p256dh = sub.getKey("p256dh");
            var auth = sub.getKey("auth");
            if (!p256dh || !auth) return;

            await fetch(this.apiBase + "/api/push/subscribe", {
                method: "POST",
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" }),
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(p256dh))),
                        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(auth)))
                    }
                })
            });
        } catch (err) {
            // Silent fail — push is optional
        }
    }

    async unsubscribeFromPush() {
        try {
            var reg = await navigator.serviceWorker.ready;
            var sub = await reg.pushManager.getSubscription();
            if (sub) {
                var endpoint = sub.endpoint;
                await sub.unsubscribe();
                await fetch(this.apiBase + "/api/push/unsubscribe", {
                    method: "DELETE",
                    headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" }),
                    body: JSON.stringify({ endpoint: endpoint })
                });
            }
        } catch (err) {
            // Silent fail
        }
    }

    urlBase64ToUint8Array(base64String) {
        var padding = "=".repeat((4 - base64String.length % 4) % 4);
        var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        var raw = atob(base64);
        var arr = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
    }

    // ===== TOAST SYSTEM =====

    showToast(options) {
        const { type = "info", title = "", message = "", duration = 5000, action = null } = typeof options === "string" ? { message: options } : options;

        const container = document.getElementById("toastContainer");
        if (!container) return;

        const icons = {
            success: "<i class='fas fa-check-circle'></i>",
            error: "<i class='fas fa-exclamation-circle'></i>",
            warning: "<i class='fas fa-exclamation-triangle'></i>",
            info: "<i class='fas fa-info-circle'></i>"
        };

        const toast = document.createElement("div");
        toast.className = "toast " + type;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ""}
                <div class="toast-message">${this.escapeHtml(message)}</div>
                ${action ? `<div class="toast-action"><button class="toast-action-btn">${this.escapeHtml(action.label)}</button></div>` : ""}
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
        `;

        container.appendChild(toast);

        toast.querySelector(".toast-close").addEventListener("click", () => this.dismissToast(toast));

        if (action && action.onClick) {
            toast.querySelector(".toast-action-btn")?.addEventListener("click", () => {
                action.onClick();
                this.dismissToast(toast);
            });
        }

        if (duration > 0) {
            setTimeout(() => this.dismissToast(toast), duration);
        }

        return toast;
    }

    dismissToast(toast) {
        if (!toast || toast.classList.contains("exiting")) return;
        toast.classList.add("exiting");
        setTimeout(() => toast.remove(), 300);
    }
}

// Initialize
let notificationCenter;
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        notificationCenter = new NotificationCenter();
        window.notificationCenter = notificationCenter;
    });
} else {
    notificationCenter = new NotificationCenter();
    window.notificationCenter = notificationCenter;
}

// Global functions
window.showToast = function(options) {
    if (window.notificationCenter) return window.notificationCenter.showToast(options);
};

window.openNotificationPreferences = function() {
    if (window.notificationCenter) window.notificationCenter.openPreferences();
};

// Update badge when header loads
document.addEventListener("headerLoaded", function() {
    if (window.notificationCenter) window.notificationCenter.updateBadge();
});

setTimeout(function() {
    if (window.notificationCenter) window.notificationCenter.updateBadge();
}, 2000);
