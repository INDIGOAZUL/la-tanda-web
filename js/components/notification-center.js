// ===== NOTIFICATION CENTER v2.9 - Intelligence Layer =====
// Updated: 2026-03-04
// Features: API sync, type-based colors, toast system, preferences modal
// Phase 2: Dual push (VAPID + FCM), smart push permission timing

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
        this.fcmSupported = false;
        this.fcmMessaging = null;

        this.initFirebase();
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
            const response = await fetch(this.apiBase + "/api/notifications?limit=50", {
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
            // Transactions
            "payment_reminder": "transactions", "payment_received": "transactions",
            "payment_recorded": "transactions", "payment_sent": "transactions",
            "payment_due": "transactions", "payment_due_soon": "transactions",
            "payment_late": "transactions", "mora_applied": "transactions",
            "deposit_confirmed": "transactions", "deposit_rejected": "transactions",
            "withdrawal_completed": "transactions", "withdrawal_requested": "transactions",
            "payout_ready": "transactions", "payout_requested": "transactions",
            "payout_approved": "transactions", "payout_processed": "transactions",
            "payout_confirmed": "transactions", "payout_rejected": "transactions",
            "payout_reminder": "transactions", "distribution_executed": "transactions",
            "commission_request": "transactions", "commission_response": "transactions",
            // Tandas
            "lottery_scheduled": "tandas", "lottery_starting": "tandas",
            "lottery_completed": "tandas", "lottery_turn_assigned": "tandas",
            "lottery_executed": "tandas", "lottery_cancelled": "tandas",
            "lottery_reset": "tandas", "lottery_result": "tandas",
            "lottery_skipped": "tandas", "lottery_failed": "tandas",
            "turn_assigned": "tandas", "turn_updated": "tandas",
            "tanda_joined": "tandas", "tanda_created": "tandas",
            "tanda_starting": "tandas", "tanda_scheduled": "tandas",
            // Social
            "group_update": "social", "group_joined": "social",
            "group_rejected": "social", "group_invitation": "social",
            "group_invited": "social", "group_full": "social",
            "group_full_member": "social", "invitation": "social",
            "member_joined": "social", "member_left": "social",
            "member_request_pending": "social", "member_auto_approved": "social",
            "member_approved": "social", "membership_reactivated": "social",
            "member_suspended": "social", "member_reactivated": "social",
            "extension_requested": "social", "extension_approved": "social",
            "extension_rejected": "social", "mention": "social",
            "achievement": "social", "referral_success": "social",
            // System
            "security_alert": "system", "system_notice": "system",
            "compliance_alert": "system", "suspension_warning": "system",
            "suspension_recommended": "system", "join_error": "system",
            "kyc_approved": "system", "kyc_pending_review": "system",
            "recruitment_starting": "system", "recruitment_halfway": "system",
            "recruitment_almost_full": "system", "recruitment_urgent": "system",
            "recruitment_reminder": "system"
        };
        return typeMap[apiType] || "system";
    }

    isUrgentType(apiType) {
        return ["security_alert", "payment_due", "payment_overdue", "suspension_warning",
            "mora_applied", "suspension_recommended", "compliance_alert", "payment_late"].includes(apiType);
    }

    getIconForType(type) {
        const iconMap = {
            "payment_reminder": "💰", "payment_received": "✅", "payment_recorded": "📝",
            "payment_sent": "📤", "payment_due": "⏰", "payment_due_soon": "⏰",
            "payment_late": "⚠️", "mora_applied": "⚠️",
            "deposit_confirmed": "✅", "deposit_rejected": "❌",
            "withdrawal_completed": "💸", "withdrawal_requested": "📤",
            "suspension_warning": "🚨", "suspension_recommended": "⚠️",
            "member_suspended": "🔒", "member_reactivated": "✅",
            "compliance_alert": "🚨",
            "group_update": "📢", "group_joined": "✅", "group_rejected": "❌",
            "group_invitation": "💌", "group_invited": "💌",
            "group_full": "🎉", "group_full_member": "👥",
            "join_error": "⚠️",
            "member_joined": "👋", "member_request_pending": "📋",
            "member_auto_approved": "⚡", "member_approved": "✅",
            "membership_reactivated": "🔓", "mention": "💬",
            "invitation": "📩",
            "commission_request": "💼", "commission_response": "📩",
            "turn_assigned": "🎯", "turn_updated": "🔄",
            "tanda_starting": "🚀", "tanda_scheduled": "📅",
            "tanda_joined": "👥", "tanda_created": "🆕",
            "lottery_scheduled": "📅", "lottery_starting": "🎰",
            "lottery_completed": "🎉", "lottery_turn_assigned": "🎯",
            "lottery_executed": "🎲", "lottery_cancelled": "🚫",
            "lottery_reset": "🔄", "lottery_result": "🎰",
            "lottery_skipped": "⚠️", "lottery_failed": "❌",
            "extension_requested": "📝", "extension_approved": "✅",
            "extension_rejected": "❌",
            "payout_ready": "🎉", "payout_requested": "📤",
            "payout_approved": "✅", "payout_processed": "💸",
            "payout_confirmed": "🎊", "payout_rejected": "❌",
            "payout_reminder": "⏰", "distribution_executed": "💰",
            "kyc_approved": "🛡️", "kyc_pending_review": "🔍",
            "recruitment_starting": "🚀", "recruitment_halfway": "📢",
            "recruitment_almost_full": "🔥", "recruitment_urgent": "⏰",
            "recruitment_reminder": "📣", "referral_success": "🎉",
            "achievement": "🏆",
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
                body: JSON.stringify({})
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
                body: JSON.stringify({})
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
                    <i class="fas fa-bell"></i> Notificaciones
                </div>
                
                <div class="prefs-item prefs-master-toggle">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">🔔</span> Silenciar todo</div>
                        <div class="prefs-item-desc">Desactivar todas las notificaciones</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_silenciar_todo" ${p.silenciar_todo ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div class="prefs-section">
                <div class="prefs-section-title">
                    <i class="fas fa-list"></i> Categorías
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">💳</span> Pagos y cobros</div>
                        <div class="prefs-item-desc">Recordatorios, recibos, depósitos</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_category_payments" ${p.category_payments !== false ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">👥</span> Grupos</div>
                        <div class="prefs-item-desc">Miembros, ciclos, turnos</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_category_groups" ${p.category_groups !== false ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">🛒</span> Marketplace</div>
                        <div class="prefs-item-desc">Pedidos, mensajes, ventas</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_category_marketplace" ${p.category_marketplace !== false ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
                
                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">❤️</span> Social</div>
                        <div class="prefs-item-desc">Likes, comentarios, menciones</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_category_social" ${p.category_social !== false ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
            </div>
            
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

            <div class="prefs-section">
                <div class="prefs-section-title">
                    <i class="fas fa-moon"></i> Horario Silencioso
                </div>

                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">🌙</span> Activar horario silencioso</div>
                        <div class="prefs-item-desc">Las notificaciones no urgentes se enviarán al finalizar el horario</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_quiet_hours_enabled" ${p.quiet_hours_enabled ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>

                <div class="prefs-quiet-hours-range" id="quietHoursRange" style="display:${p.quiet_hours_enabled ? 'flex' : 'none'}">
                    <div class="prefs-time-select">
                        <label for="pref_quiet_hours_start">Desde:</label>
                        <select id="pref_quiet_hours_start">${this._buildHourOptions(p.quiet_hours_start != null ? p.quiet_hours_start : 22)}</select>
                    </div>
                    <div class="prefs-time-select">
                        <label for="pref_quiet_hours_end">Hasta:</label>
                        <select id="pref_quiet_hours_end">${this._buildHourOptions(p.quiet_hours_end != null ? p.quiet_hours_end : 7)}</select>
                    </div>
                </div>
            </div>

            <div class="prefs-section">
                <div class="prefs-section-title">
                    <i class="fas fa-newspaper"></i> Resumen Diario
                </div>

                <div class="prefs-item">
                    <div class="prefs-item-info">
                        <div class="prefs-item-label"><span class="prefs-icon">📋</span> Recibir resumen diario</div>
                        <div class="prefs-item-desc">Recibe un resumen de notificaciones no urgentes cada mañana a las 7:00 AM</div>
                    </div>
                    <label class="prefs-toggle">
                        <input type="checkbox" id="pref_digest_enabled" ${p.digest_enabled ? "checked" : ""}>
                        <span class="prefs-toggle-slider"></span>
                    </label>
                </div>
            </div>
        `;

        // Wire quiet hours toggle visibility
        this._wireQuietHoursToggle();
    }

    _wireQuietHoursToggle() {
        const toggle = document.getElementById("pref_quiet_hours_enabled");
        const range = document.getElementById("quietHoursRange");
        if (toggle && range) {
            toggle.addEventListener("change", () => {
                range.style.display = toggle.checked ? "flex" : "none";
            });
        }

        // Wire master silence toggle (bounty #87)
        const silenciarToggle = document.getElementById("pref_silenciar_todo");
        if (silenciarToggle) {
            silenciarToggle.addEventListener("change", () => {
                const isSilenced = silenciarToggle.checked;
                // Disable all category toggles
                const categories = ['pref_category_payments', 'pref_category_groups', 'pref_category_marketplace', 'pref_category_social'];
                categories.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.disabled = isSilenced;
                });
            });
        }
    }

    _buildHourOptions(selected) {
        const labels = [];
        for (let h = 0; h < 24; h++) {
            const ampm = h === 0 ? '12:00 AM' : h < 12 ? h + ':00 AM' : h === 12 ? '12:00 PM' : (h - 12) + ':00 PM';
            labels.push('<option value="' + h + '"' + (h === selected ? ' selected' : '') + '>' + ampm + '</option>');
        }
        return labels.join('');
    }

    async savePreferences() {
        const saveBtn = document.getElementById("savePrefsBtn");
        const indicator = document.getElementById("prefsSavedIndicator");
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;
        }

        const newPrefs = {
            // Master toggle
            silenciar_todo: document.getElementById("pref_silenciar_todo")?.checked ?? false,
            // Categories (bounty #87)
            category_payments: document.getElementById("pref_category_payments")?.checked ?? true,
            category_groups: document.getElementById("pref_category_groups")?.checked ?? true,
            category_marketplace: document.getElementById("pref_category_marketplace")?.checked ?? true,
            category_social: document.getElementById("pref_category_social")?.checked ?? true,
            // Legacy
            payment_reminders: document.getElementById("pref_payment_reminders")?.checked ?? true,
            group_updates: document.getElementById("pref_group_updates")?.checked ?? true,
            member_activity: document.getElementById("pref_member_activity")?.checked ?? true,
            marketing: document.getElementById("pref_marketing")?.checked ?? false,
            email_enabled: document.getElementById("pref_email_enabled")?.checked ?? true,
            push_enabled: document.getElementById("pref_push_enabled")?.checked ?? true,
            quiet_hours_enabled: document.getElementById("pref_quiet_hours_enabled")?.checked ?? false,
            quiet_hours_start: parseInt(document.getElementById("pref_quiet_hours_start")?.value ?? "22", 10),
            quiet_hours_end: parseInt(document.getElementById("pref_quiet_hours_end")?.value ?? "7", 10),
            digest_enabled: document.getElementById("pref_digest_enabled")?.checked ?? false,
            digest_frequency: document.getElementById("pref_digest_enabled")?.checked ? 'daily' : 'off'
        };

        // Handle master toggle - disable all categories if silenced
        if (newPrefs.silenciar_todo) {
            newPrefs.category_payments = false;
            newPrefs.category_groups = false;
            newPrefs.category_marketplace = false;
            newPrefs.category_social = false;
        }

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

    // ===== FIREBASE CLOUD MESSAGING =====

    async initFirebase() {
        if (!window._LT_FIREBASE_CONFIG) return;
        try {
            // Dynamically load Firebase compat SDK if not already present
            if (typeof firebase === 'undefined') {
                await this._loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
                await this._loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
            }
            if (typeof firebase === 'undefined' || !firebase.messaging) return;
            if (!firebase.apps.length) {
                firebase.initializeApp(window._LT_FIREBASE_CONFIG);
            }
            this.fcmMessaging = firebase.messaging();
            this.fcmSupported = true;
            // Send config to service worker for background message handling
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'FIREBASE_CONFIG',
                    config: window._LT_FIREBASE_CONFIG
                });
            }
        } catch (e) {
            // Firebase not available — VAPID-only mode
        }
    }

    _loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
            var s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = resolve; // Don't block on CDN failure
            document.head.appendChild(s);
        });
    }

    // ===== WEB PUSH SUBSCRIPTION =====

    initPushSubscription() {
        if (!("Notification" in window) || !("PushManager" in window)) return;
        
        // Respect explicit denial (bounty #87)
        if (Notification.permission === "denied") return;
        if (localStorage.getItem("push_permission_denied") === "true") return;

        // If already granted, silently subscribe
        if (Notification.permission === "granted") {
            this.subscribeToPush();
            return;
        }

        // Don't ask if user previously dismissed or asked
        if (localStorage.getItem("push_permission_asked") === "true") return;

        // Smart push permission timing — max 3 prompts with progressive delay
        const promptCount = parseInt(localStorage.getItem("push_prompt_count") || "0", 10);
        if (promptCount >= 3) return;

        const dismissed = localStorage.getItem("push_banner_dismissed");
        if (dismissed) {
            const elapsed = Date.now() - parseInt(dismissed, 10);
            // 1st dismiss → wait 1 day, 2nd → wait 7 days
            const waitMs = promptCount <= 1 ? 86400000 : 604800000;
            if (elapsed < waitMs) return;
        }

        // Delay: 30s on first visit, 15s on subsequent
        const delay = promptCount === 0 ? 30000 : 15000;
        setTimeout(() => this.showPushBanner(), delay);
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
                <span>Recibe alertas de pagos, cobros y actividad de tu grupo</span>
                <button class="push-banner-btn" id="pushBannerAccept">Activar</button>
                <button class="push-banner-btn push-banner-dismiss-text" id="pushBannerDismiss">Ahora no</button>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById("pushBannerAccept").addEventListener("click", async () => {
            banner.remove();
            localStorage.setItem("push_permission_asked", "true");
            var permission = await Notification.requestPermission();
            if (permission === "granted") {
                await this.subscribeToPush();
                this.showToast({ type: "success", message: "Notificaciones activadas — te avisaremos de pagos y turnos" });
            } else if (permission === "denied") {
                // Store that user explicitly denied
                localStorage.setItem("push_permission_denied", "true");
            }
        });
        document.getElementById("pushBannerDismiss").addEventListener("click", () => {
            banner.remove();
            const count = parseInt(localStorage.getItem("push_prompt_count") || "0", 10);
            localStorage.setItem("push_prompt_count", String(count + 1));
            localStorage.setItem("push_banner_dismissed", String(Date.now()));
        });
    }

    async subscribeToPush() {
        try {
            var reg = await navigator.serviceWorker.ready;
            var existing = await reg.pushManager.getSubscription();

            // VAPID subscription
            if (!existing) {
                var resp = await fetch(this.apiBase + "/api/push/vapid-key");
                var result = await resp.json();
                var publicKey = result.data ? result.data.publicKey : result.publicKey;
                if (publicKey) {
                    var sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
                    });

                    var p256dh = sub.getKey("p256dh");
                    var auth = sub.getKey("auth");
                    if (p256dh && auth) {
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
                    }
                }
            }

            // FCM registration (alongside VAPID)
            if (this.fcmSupported && this.fcmMessaging) {
                try {
                    var fcmToken = await this.fcmMessaging.getToken({
                        serviceWorkerRegistration: reg
                    });
                    if (fcmToken) {
                        await fetch(this.apiBase + "/api/push/fcm-register", {
                            method: "POST",
                            headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" }),
                            body: JSON.stringify({ token: fcmToken, device_type: "web" })
                        });
                    }
                } catch (e) {
                    // FCM token failed — VAPID still works
                }
            }
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

            // Also unregister FCM token
            if (this.fcmSupported && this.fcmMessaging) {
                try {
                    var fcmToken = await this.fcmMessaging.getToken();
                    if (fcmToken) {
                        await this.fcmMessaging.deleteToken();
                        await fetch(this.apiBase + "/api/push/fcm-unregister", {
                            method: "DELETE",
                            headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" }),
                            body: JSON.stringify({ token: fcmToken })
                        });
                    }
                } catch (e) {}
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
