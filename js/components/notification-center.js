// ===== NOTIFICATION CENTER v3.0 =====
// Updated: 2026-03-11
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
        this.loadedAll = false;
        this.timeRefreshInterval = null;
        this._apiLoaded = false;

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

        // v4.25.7: Skip API calls if not authenticated
        if (this.userId === "demo-user") {
            this.loadFromLocalStorage();
            return;
        }
        this.attachEventListeners();
        this.loadNotificationsFromAPI();
        this.startPolling();
        this.initPushSubscription();

        // v4.16.12: Refresh time labels every 60s (M6)
        this.timeRefreshInterval = setInterval(() => {
            const panel = document.getElementById("notificationPanel");
            if (panel && panel.classList.contains("active")) {
                document.querySelectorAll(".notification-item").forEach(item => {
                    const id = item.dataset.id;
                    const n = this.notifications.find(x => String(x.id) === String(id));
                    const timeEl = item.querySelector(".notification-time");
                    if (n && timeEl) timeEl.textContent = this.getTimeAgo(n.time);
                });
            }
        }, 60000);

        // v4.16.12: Auto-open panel if redirected from notificaciones.html
        if (new URLSearchParams(window.location.search).get('open') === 'notifications') {
            setTimeout(() => this.openPanel(), 1500);
            const url = new URL(window.location);
            url.searchParams.delete('open');
            window.history.replaceState({}, '', url);
        }
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

    async loadNotificationsFromAPI(append) {
        try {
            const offset = append ? this.notifications.length : 0;
            const response = await fetch(this.apiBase + "/api/notifications?limit=50&offset=" + offset, {
                method: "GET",
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" })
            });

            if (!response.ok) throw new Error("API error: " + response.status);

            const result = await response.json();

            if (result.success && result.data && result.data.notifications) {
                const mapped = result.data.notifications.map(n => ({
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

                if (append) {
                    // Deduplicate by id
                    const existingIds = new Set(this.notifications.map(n => n.id));
                    const newItems = mapped.filter(n => !existingIds.has(n.id));
                    this.notifications = this.notifications.concat(newItems);
                    this.loadedAll = newItems.length < 50;
                } else {
                    this.notifications = mapped;
                    this.loadedAll = mapped.length < 50;
                    this._apiLoaded = true;
                }

                const prevUnread = this.unreadCount;
                this.unreadCount = result.data.unread || this.notifications.filter(n => !n.read).length;
                if (this.unreadCount > prevUnread && prevUnread > 0) {
                    this.playNotificationSound();
                }
                this.saveToLocalStorage();
                this.updateUnreadCount();
                this.renderNotifications();
                this._updateSyncStatus(true);
                return true;
            } else {
                throw new Error("Invalid API response");
            }
        } catch (error) {
            this.loadFromLocalStorage();
            this._updateSyncStatus(false);
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
            "recruitment_reminder": "system",
            // v4.16.12: Social
            "new_follower": "social", "social_repost": "social",
            "social_like": "social", "social_comment": "social",
            // v4.16.12: Loans
            "loan_payment": "transactions", "loan_payment_request": "transactions",
            "loan_coordinator_alert": "transactions", "loan_plan_created": "transactions",
            "loan_plan_defaulted": "transactions",
            // v4.16.12: Group intelligence
            "group_milestone": "social", "creator_nudge": "system",
            "creator_nudge_verify": "system", "creator_nudge_empty": "system",
            "creator_nudge_progress": "system", "creator_nudge_almost": "system",
            "creator_nudge_pending": "system",
            // v4.16.12: Other
            "turn_reminder": "tandas", "suspension_recommendation": "system"
        };
        return typeMap[apiType] || "system";
    }

    isUrgentType(apiType) {
        return ["security_alert", "payment_due", "payment_overdue", "suspension_warning",
            "mora_applied", "suspension_recommended", "compliance_alert", "payment_late",
            "loan_plan_defaulted", "suspension_recommendation", "loan_coordinator_alert"].includes(apiType);
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
            "security_alert": "🚨", "system_notice": "📢",
            // v4.16.12
            "new_follower": "👤", "social_repost": "🔄",
            "social_like": "❤️", "social_comment": "💬",
            "loan_payment": "💳", "loan_payment_request": "📋",
            "loan_coordinator_alert": "⚠️", "loan_plan_created": "📝",
            "loan_plan_defaulted": "🚨",
            "group_milestone": "🎯", "creator_nudge": "💡",
            "creator_nudge_verify": "📧", "creator_nudge_empty": "👥",
            "creator_nudge_progress": "📊", "creator_nudge_almost": "🔥",
            "creator_nudge_pending": "📋",
            "turn_reminder": "⏰", "suspension_recommendation": "🚨"
        };
        return iconMap[type] || "🔔";
    }

    getNavigationUrl(notification) {
        const data = notification.data || {};
        const type = notification.originalType || notification.type;
        const gid = data.group_id ? encodeURIComponent(data.group_id) : '';
        const groupUrl = gid ? 'groups-advanced-system.html?group=' + gid : 'groups-advanced-system.html';

        // Wallet / financial → wallet page
        const walletTypes = ['deposit_confirmed', 'deposit_rejected', 'withdrawal_completed',
            'withdrawal_requested', 'payout_ready', 'payout_requested', 'payout_approved',
            'payout_processed', 'payout_confirmed', 'payout_rejected', 'payout_reminder'];
        if (walletTypes.includes(type)) return 'my-wallet.html?tab=transactions';

        // Payment types → group context (not wallet)
        const paymentTypes = ['payment_reminder', 'payment_received', 'payment_recorded',
            'payment_sent', 'payment_due', 'payment_due_soon', 'payment_late',
            'mora_applied', 'distribution_executed', 'commission_request', 'commission_response',
            'loan_payment', 'loan_payment_request', 'loan_coordinator_alert',
            'loan_plan_created', 'loan_plan_defaulted'];
        if (paymentTypes.includes(type)) return groupUrl;

        // Tanda / lottery / group
        const tandaTypes = ['lottery_scheduled', 'lottery_starting', 'lottery_completed',
            'lottery_turn_assigned', 'lottery_executed', 'lottery_cancelled', 'lottery_reset',
            'lottery_result', 'lottery_skipped', 'lottery_failed', 'turn_assigned', 'turn_updated',
            'turn_reminder', 'tanda_joined', 'tanda_created', 'tanda_starting', 'tanda_scheduled',
            'group_update', 'group_joined', 'group_rejected', 'group_invitation', 'group_invited',
            'group_full', 'group_full_member', 'group_milestone', 'invitation'];
        if (tandaTypes.includes(type)) return groupUrl;

        // Member management → group context
        const memberTypes = ['member_joined', 'member_left', 'member_request_pending',
            'member_auto_approved', 'member_approved', 'membership_reactivated',
            'member_suspended', 'member_reactivated', 'extension_requested',
            'extension_approved', 'extension_rejected', 'suspension_warning',
            'suspension_recommended', 'suspension_recommendation'];
        if (memberTypes.includes(type)) return groupUrl;

        // Social → home feed
        const socialTypes = ['new_follower', 'social_repost', 'social_like', 'social_comment'];
        if (socialTypes.includes(type)) return 'home-dashboard.html';

        // Creator nudges → groups page
        if (type.startsWith('creator_nudge')) return groupUrl;
        if (type.startsWith('recruitment_')) return groupUrl;

        // Security
        if (type === 'security_alert' || type === 'compliance_alert') return 'mi-perfil.html';

        // Achievement / referral
        if (type === 'achievement' || type === 'referral_success') return 'mi-perfil.html';

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
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.notifications.slice(0, 100))); } catch (e) {}
    }

    startPolling() {
        if (!this.pollingEnabled) return;
        this.pollingInterval = setInterval(() => this.loadNotificationsFromAPI(), this.pollIntervalMs);

        // v4.16.12: Auto-toast latest unread notification on page load (improve discovery)
        setTimeout(() => {
            try {
                const unread = (this.notifications || []).filter(n => !n.read);
                if (unread.length > 0 && this._apiLoaded && !sessionStorage.getItem('_nc_toast_shown')) {
                    const latest = unread[0];
                    const icon = this.getIconForType(latest.type || latest.originalType);
                    const isUrgent = this.isUrgentType(latest.type || latest.originalType);
                    this.showToast({
                        type: isUrgent ? 'warning' : 'info',
                        title: icon + ' ' + (latest.title || 'Nueva notificacion'),
                        message: latest.message || '',
                        duration: 5000,
                        action: { label: 'Ver', onClick: () => this.openPanel() }
                    });
                    sessionStorage.setItem('_nc_toast_shown', '1');
                }
            } catch (_) {}
        }, 3000);
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
                <div class="nc-header-top">
                    <h3><i class="fas fa-bell"></i> Notificaciones</h3>
                    <div class="notification-header-actions">
                        <button class="prefs-settings-btn" title="Preferencias" id="openPrefsBtn">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="refresh-notifications-btn" title="Actualizar">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="close-notification-panel"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <button class="mark-all-read-btn"><i class="fas fa-check-double"></i> Marcar todo leido</button>
            </div>
            <div class="notification-tabs">
                <button class="notification-tab active" data-filter="all">Todo <span class="tab-count" id="ncTabAll"></span></button>
                <button class="notification-tab" data-filter="transactions">Pagos <span class="tab-count" id="ncTabTransactions"></span></button>
                <button class="notification-tab" data-filter="tandas">Tandas <span class="tab-count" id="ncTabTandas"></span></button>
                <button class="notification-tab" data-filter="social">Social <span class="tab-count" id="ncTabSocial"></span></button>
                <button class="notification-tab" data-filter="system">Sistema <span class="tab-count" id="ncTabSystem"></span></button>
            </div>
            <div class="notification-list" id="notificationList">
                <div class="notification-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>
            </div>
            <div class="notification-footer">
                <button class="nc-load-more-btn" id="ncLoadMoreBtn" style="display:none">Cargar anteriores</button>
                <span class="notification-sync-status"><i class="fas fa-check-circle" style="color:#10b981"></i> Sincronizado</span>
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
                const btn = e.target.closest(".notification-tab");
                if (!btn) return;
                document.querySelectorAll(".notification-tab").forEach(t => t.classList.remove("active"));
                btn.classList.add("active");
                this.currentFilter = btn.dataset.filter;
                this.renderNotifications();
            });
        });

        const closeBtn = document.querySelector(".close-notification-panel");
        if (closeBtn) closeBtn.addEventListener("click", () => {
            const panel = document.getElementById("notificationPanel");
            if (panel) panel.classList.remove("active");
            this._hideBackdrop();
        });

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

        // Panel click-outside handled by backdrop overlay (H5)

        // Load More button
        const loadMoreBtn = document.getElementById("ncLoadMoreBtn");
        if (loadMoreBtn) loadMoreBtn.addEventListener("click", () => this.loadMore());

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

        let filtered = this.currentFilter === "all"
            ? this.notifications
            : this.notifications.filter(n => n.type === this.currentFilter);

        // v4.30: Full grouping engine (by type + target_id within 24h)
        filtered = this.buildGroups(filtered);

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
            const isGroup = notification._isGroup;
            const classes = [
                "notification-item",
                !notification.read ? "unread" : "",
                navUrl ? "clickable" : "",
                notification.urgent ? "urgent" : "",
                "type-" + notification.type,
                isGroup ? "nc-grouped" : ""
            ].filter(Boolean).join(" ");

            const groupBadge = isGroup
                ? `<span class="nc-group-count">${notification._groupCount}</span>`
                : '';

            return `
                <div class="${classes}" data-id="${this.escapeHtml(String(notification.id))}" data-nav="${this.escapeHtml(navUrl || '')}" data-type="${this.escapeHtml(notification.type)}" data-is-group="${isGroup ? '1' : '0'}">
                    <div class="notification-icon">${this.escapeHtml(notification.icon)}${groupBadge}</div>
                    <div class="notification-content">
                        <h4 class="notification-title">${this.escapeHtml(notification.title)}</h4>
                        <p class="notification-message">${this.escapeHtml(notification.message)}</p>
                        ${(function(ctx){ return ctx ? '<span class="notification-context">' + ctx + '</span>' : '';})(this.escapeHtml(this.getContextLine(notification)))}
                        <span class="notification-time">${this.getTimeAgo(notification.time)}</span>
                        ${(!notification._actionsCompleted) ? this._renderInlineActions(notification) : ''}
                    </div>
                    ${!notification.read ? `<button class="notification-mark-read" data-id="${this.escapeHtml(String(notification.id))}" title="Marcar leido">✓</button>` : ""}
                    <button class="notification-delete" data-id="${this.escapeHtml(String(notification.id))}" title="Eliminar">×</button>
                </div>
            `;
        }).join("");

        // Show/hide Load More button
        const loadMoreBtn = document.getElementById("ncLoadMoreBtn");
        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.loadedAll ? 'none' : 'block';
        }

        // Mark-read buttons
        list.querySelectorAll(".notification-mark-read").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.markAsRead(btn.dataset.id);
                this._broadcastBadgeUpdate();
            });
        });

        // Delete buttons
        list.querySelectorAll(".notification-delete").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.deleteNotification(btn.dataset.id);
            });
        });

        // Inline action buttons (feature 2)
        list.querySelectorAll(".nc-inline-action").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const notifId = btn.dataset.notifId;
                const actionIdx = parseInt(btn.dataset.actionIdx, 10);
                this._handleInlineAction(notifId, actionIdx);
            });
        });

        // Item click — navigate
        list.querySelectorAll(".notification-item").forEach(item => {
            item.addEventListener("click", (evt) => {
                // Don't navigate if an inline action was clicked
                if (evt.target.closest(".nc-inline-action")) return;
                const notifId = item.dataset.id;
                const navUrl = item.dataset.nav;
                this.markAsRead(notifId);
                this._broadcastBadgeUpdate();
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

    // v4.25.7: Build context subtitle from notification data
    getContextLine(notification) {
        const d = notification.data || {};
        const type = notification.originalType || notification.type || '';
        const parts = [];

        // Group name
        if (d.group_name) parts.push(d.group_name);

        // Cycle info
        if (d.cycle_number) parts.push('Ciclo ' + d.cycle_number);

        // Amount
        if (d.amount && typeof d.amount === 'number') {
            parts.push('L. ' + d.amount.toLocaleString('es-HN'));
        } else if (d.amount_owed && typeof d.amount_owed === 'number') {
            parts.push('Deuda: L. ' + d.amount_owed.toLocaleString('es-HN'));
        }

        // Days late
        if (d.days_late && d.days_late > 0 && type.includes('late')) {
            parts.push(d.days_late + ' dia' + (d.days_late !== 1 ? 's' : '') + ' de atraso');
        }

        // Turn info
        if (d.turn) parts.push('Turno #' + d.turn + (d.total ? '/' + d.total : ''));

        // Loan deduction
        if (d.loan_deduction && d.loan_deduction > 0) {
            parts.push('Descuento prestamo: L. ' + d.loan_deduction.toLocaleString('es-HN'));
        }

        return parts.length > 0 ? parts.join(' · ') : '';
    }

    // v4.16.12: Update unread counts per tab
    _updateTabCounts() {
        const unread = this.notifications.filter(n => !n.read);
        const counts = { all: unread.length, transactions: 0, tandas: 0, social: 0, system: 0 };
        unread.forEach(n => { if (counts[n.type] !== undefined) counts[n.type]++; });
        ['all', 'transactions', 'tandas', 'social', 'system'].forEach(k => {
            const el = document.getElementById('ncTab' + k.charAt(0).toUpperCase() + k.slice(1));
            if (el) {
                el.textContent = counts[k] > 0 ? counts[k] : '';
                el.style.display = counts[k] > 0 ? 'inline' : 'none';
            }
        });
    }

    // v4.16.12: Sync status accuracy (M7)
    _updateSyncStatus(online) {
        const el = document.querySelector('.notification-sync-status');
        if (el) {
            if (online) {
                el.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981"></i> Sincronizado';
            } else {
                el.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#f59e0b"></i> Sin conexion (datos locales)';
            }
        }
    }

    // v4.16.12: Load more (H1 pagination)
    async loadMore() {
        if (this.loadedAll) return;
        const btn = document.getElementById('ncLoadMoreBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Cargando...'; }
        await this.loadNotificationsFromAPI(true);
        if (btn) { btn.disabled = false; btn.textContent = 'Cargar anteriores'; }
    }

    // v4.16.12: Open panel (was called but undefined)
    openPanel() {
        const panel = document.getElementById("notificationPanel");
        if (panel && !panel.classList.contains("active")) {
            panel.classList.add("active");
            this.loadNotificationsFromAPI();
            this._showBackdrop();
        }
    }

    // v4.16.12: Play subtle notification sound (reuses AudioContext)
    playNotificationSound() {
        try {
            if (!this._audioCtx) {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this._audioCtx;
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (_) {}
    }

    toggle() {
        const panel = document.getElementById("notificationPanel");
        if (panel) {
            const isOpening = !panel.classList.contains("active");
            panel.classList.toggle("active");
            if (isOpening) {
                this.loadNotificationsFromAPI();
                this._showBackdrop();
            } else {
                this._hideBackdrop();
            }
        }
    }

    _showBackdrop() {
        if (document.getElementById("ncBackdrop")) return;
        const bd = document.createElement("div");
        bd.id = "ncBackdrop";
        bd.className = "nc-backdrop";
        bd.addEventListener("click", () => this.toggle());
        document.body.appendChild(bd);
        requestAnimationFrame(() => bd.classList.add("active"));
    }

    _hideBackdrop() {
        const bd = document.getElementById("ncBackdrop");
        if (bd) {
            bd.classList.remove("active");
            setTimeout(() => bd.remove(), 300);
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
        if (this._markingAllRead) return;
        this._markingAllRead = true;
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
        this._markingAllRead = false;
        }
        this._markingAllRead = false;
    }

    async deleteNotification(notificationId) {
        // Remove from local array
        this.notifications = this.notifications.filter(n => String(n.id) !== String(notificationId));
        this.updateUnreadCount();
        this.renderNotifications();
        this.saveToLocalStorage();

        // Delete from server (non-blocking)
        try {
            await fetch(this.apiBase + "/api/notifications/" + encodeURIComponent(notificationId), {
                method: "DELETE",
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" })
            });
        } catch (_) {}
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.updateBadge();
        this._updateTabCounts();
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
                    <button class="prefs-btn prefs-btn-secondary nc-retry-btn">Reintentar</button>
                </div>
            `;
            // v4.25.7: Wire retry button via addEventListener (no inline onclick)
            setTimeout(() => {
                const retryBtn = document.querySelector(".nc-retry-btn");
                if (retryBtn) retryBtn.addEventListener("click", () => this.loadPreferences());
            }, 0);
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
                <div style="font-size:0.78rem;color:#94a3b8;margin:-8px 0 12px;padding:0 4px;line-height:1.4;">
                    Estos controles afectan notificaciones push y email. Las notificaciones dentro de la app siempre se muestran.
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

            this.showToast({ type: "success", message: t("messages.prefs_saved", {defaultValue:"Preferencias guardadas correctamente"}) });

            // Handle push toggle side effects
            if (newPrefs.push_enabled) {
                this.subscribeToPush();
            } else {
                this.unsubscribeFromPush();
            }

            // Close modal after short delay
            setTimeout(() => this.closePreferences(), 1500);

        } catch (error) {
            this.showToast({ type: "error", title: "Error", message: t("messages.prefs_save_error", {defaultValue:"No se pudieron guardar las preferencias"}) });
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
        if (Notification.permission === "denied") return;

        // If already granted, silently subscribe
        if (Notification.permission === "granted") {
            this.subscribeToPush();
            return;
        }

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
                <span>Activa las notificaciones para no perderte pagos y turnos</span>
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
                this.showToast({ type: "success", message: t("messages.push_enabled", {defaultValue:"Notificaciones activadas — te avisaremos de pagos y turnos"}) });
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

    // ===== FEATURE 1: NOTIFICATION GROUPING ENGINE (v4.30) =====
    // Groups notifications by composite key: originalType + target_id within a 24-hour window.
    // Extends existing basic grouping (turn_updated / recruitment types) to full spec.

    buildGroups(notifications) {
        const WINDOW_MS = 24 * 60 * 60 * 1000; // 24-hour window
        const now = Date.now();
        const groups = [];
        const visited = new Set();

        notifications.forEach((n, idx) => {
            if (visited.has(idx)) return;

            const type = n.originalType || n.type || '';
            const targetId = (n.data && (n.data.group_id || n.data.target_id || n.data.tanda_id)) || null;
            const nTime = new Date(n.time).getTime();

            // Skip if older than 24h — show as individual
            if (now - nTime > WINDOW_MS || !targetId) {
                groups.push({ ...n, _isGroup: false });
                visited.add(idx);
                return;
            }

            // Find siblings: same type + same target within 24h window
            const siblings = [n];
            for (let j = idx + 1; j < notifications.length; j++) {
                if (visited.has(j)) continue;
                const m = notifications[j];
                const mType = m.originalType || m.type || '';
                const mTargetId = (m.data && (m.data.group_id || m.data.target_id || m.data.tanda_id)) || null;
                const mTime = new Date(m.time).getTime();
                if (mType === type && mTargetId === targetId && Math.abs(nTime - mTime) <= WINDOW_MS) {
                    siblings.push(m);
                    visited.add(j);
                }
            }
            visited.add(idx);

            if (siblings.length < 2) {
                // Single notification — no grouping needed
                groups.push({ ...n, _isGroup: false });
                return;
            }

            // Build group entry
            const actors = [...new Set(siblings.map(s => (s.data && (s.data.actor_name || s.data.member_name)) || '').filter(Boolean))];
            const actorLabel = actors.length === 0 ? ''
                : actors.length <= 2 ? actors.join(', ')
                : actors.slice(0, 2).join(', ') + ' +' + (actors.length - 2) + ' más';

            const groupEntry = {
                ...n,
                _isGroup: true,
                _groupMembers: siblings.map(s => s.id),
                _groupCount: siblings.length,
                _expanded: false,
                _siblings: siblings,
                title: actorLabel
                    ? actorLabel + ' ' + (n.title || '')
                    : '(' + siblings.length + ' notificaciones) ' + (n.title || ''),
                read: siblings.every(s => s.read)
            };
            groups.push(groupEntry);
        });

        return groups;
    }

    async markGroupAsRead(groupEntry) {
        if (!groupEntry._isGroup) return this.markAsRead(groupEntry.id);
        // Optimistically mark all members
        groupEntry._siblings.forEach(s => {
            const n = this.notifications.find(x => String(x.id) === String(s.id));
            if (n) n.read = true;
        });
        this.updateUnreadCount();
        this.renderNotifications();
        this.saveToLocalStorage();
        // Fire API calls for each member
        await Promise.allSettled(groupEntry._siblings.map(s =>
            fetch(this.apiBase + "/api/notifications/read/" + s.id, {
                method: "POST",
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" }),
                body: JSON.stringify({})
            })
        ));
    }

    // ===== FEATURE 2: INLINE ACTIONS =====
    // Renders action buttons for actionable notification types.
    // Uses optimistic UI: button → loading → success/error.

    _getInlineActions(notification) {
        const type = notification.originalType || '';
        const data = notification.data || {};
        const actions = [];

        if (type === 'group_invitation' || type === 'group_invited' || type === 'invitation') {
            actions.push({
                label: 'Aceptar',
                icon: 'fas fa-check',
                style: 'success',
                endpoint: '/api/groups/' + encodeURIComponent(data.group_id || '') + '/invitations/accept',
                method: 'POST',
                payload: {}
            });
            actions.push({
                label: 'Rechazar',
                icon: 'fas fa-times',
                style: 'danger',
                endpoint: '/api/groups/' + encodeURIComponent(data.group_id || '') + '/invitations/reject',
                method: 'POST',
                payload: {}
            });
        }

        if (type === 'payment_due' || type === 'payment_due_soon' || type === 'payment_reminder') {
            actions.push({
                label: 'Registrar Pago',
                icon: 'fas fa-wallet',
                style: 'primary',
                endpoint: '/api/groups/' + encodeURIComponent(data.group_id || '') + '/payments',
                method: 'POST',
                payload: { amount: data.amount, cycle_number: data.cycle_number }
            });
        }

        if (type === 'marketplace_order_confirmation') {
            actions.push({
                label: 'Confirmar',
                icon: 'fas fa-check-double',
                style: 'success',
                endpoint: '/api/marketplace/orders/' + encodeURIComponent(data.order_id || '') + '/confirm',
                method: 'POST',
                payload: {}
            });
        }

        if (type === 'member_request_pending') {
            actions.push({
                label: 'Aprobar',
                icon: 'fas fa-user-check',
                style: 'success',
                endpoint: '/api/groups/' + encodeURIComponent(data.group_id || '') + '/members/' + encodeURIComponent(data.member_id || '') + '/approve',
                method: 'POST',
                payload: {}
            });
            actions.push({
                label: 'Rechazar',
                icon: 'fas fa-user-times',
                style: 'danger',
                endpoint: '/api/groups/' + encodeURIComponent(data.group_id || '') + '/members/' + encodeURIComponent(data.member_id || '') + '/reject',
                method: 'POST',
                payload: {}
            });
        }

        return actions;
    }

    _renderInlineActions(notification) {
        const actions = this._getInlineActions(notification);
        if (actions.length === 0 || notification.read) return '';

        const btns = actions.map((a, i) =>
            `<button class="nc-inline-action nc-action-${a.style}" data-action-idx="${i}" data-notif-id="${this.escapeHtml(String(notification.id))}">
                <i class="${a.icon}"></i> ${this.escapeHtml(a.label)}
            </button>`
        ).join('');

        return `<div class="nc-inline-actions">${btns}</div>`;
    }

    async _handleInlineAction(notificationId, actionIdx) {
        const notification = this.notifications.find(n => String(n.id) === String(notificationId));
        if (!notification) return;

        const actions = this._getInlineActions(notification);
        const action = actions[actionIdx];
        if (!action) return;

        // Find the button element for optimistic UI
        const btn = document.querySelector(
            `.nc-inline-action[data-notif-id="${CSS.escape(String(notificationId))}"][data-action-idx="${actionIdx}"]`
        );
        const originalHtml = btn ? btn.innerHTML : '';

        // Snapshot current state for rollback
        const wasRead = notification.read;

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
            }

            const response = await fetch(this.apiBase + action.endpoint, {
                method: action.method,
                headers: Object.assign({}, this.getAuthHeaders(), { "Content-Type": "application/json" }),
                body: JSON.stringify(action.payload)
            });

            if (!response.ok) throw new Error("API error: " + response.status);

            // Success — mark notification as read and remove actions
            notification.read = true;
            notification._actionsCompleted = true;
            this.updateUnreadCount();
            this.renderNotifications();
            this.saveToLocalStorage();
            this._broadcastBadgeUpdate();
            this.showToast({ type: "success", message: "Acción completada correctamente" });

        } catch (err) {
            // Rollback UI
            notification.read = wasRead;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
            this.showToast({ type: "error", title: "Error", message: "No se pudo completar la acción. Inténtalo de nuevo." });
        }
    }

    // ===== FEATURE 4: CROSS-PAGE BADGE CONSISTENCY =====
    // Uses BroadcastChannel for same-origin cross-tab sync.
    // Falls back to storage events for older browsers.

    _initBadgeSync() {
        // BroadcastChannel for instant cross-tab sync
        try {
            this._bc = new BroadcastChannel('notifications');
            this._bc.onmessage = (evt) => {
                if (evt.data && evt.data.type === 'BADGE_UPDATE') {
                    this.unreadCount = evt.data.count;
                    this._applyBadgeUI(this.unreadCount);
                }
            };
        } catch (_) {
            // Fallback: storage event
            window.addEventListener('storage', (evt) => {
                if (evt.key === '_nc_badge_count') {
                    const count = parseInt(evt.newValue || '0', 10);
                    this._applyBadgeUI(count);
                }
            });
        }
    }

    _broadcastBadgeUpdate() {
        const count = this.unreadCount;
        // BroadcastChannel
        try {
            if (this._bc) this._bc.postMessage({ type: 'BADGE_UPDATE', count });
        } catch (_) {}
        // Storage event fallback (picked up by other tabs without BroadcastChannel)
        try { localStorage.setItem('_nc_badge_count', String(count)); } catch (_) {}
    }

    _applyBadgeUI(count) {
        // 1) Notification panel badge
        const badge = document.querySelector("#notifBadge, .notification-badge, .notification-dot, .lt-badge, #notificationCount");
        if (badge) {
            badge.textContent = count > 99 ? "99+" : count;
            badge.style.display = count > 0 ? "flex" : "none";
            badge.classList.toggle("urgent", count >= 5);
        }

        // 2) Sidebar widget (js/sidebar-widgets.js exports window.sidebarWidgets)
        try {
            const swBadge = document.querySelector(".sidebar-notification-badge, #sidebarNotifBadge");
            if (swBadge) {
                swBadge.textContent = count > 99 ? "99+" : count;
                swBadge.style.display = count > 0 ? "flex" : "none";
            }
        } catch (_) {}

        // 3) Mobile bottom-nav badge
        try {
            const mobileNavBadge = document.querySelector(".mobile-notif-badge, #mobileNotifBadge");
            if (mobileNavBadge) {
                mobileNavBadge.textContent = count > 99 ? "99+" : count;
                mobileNavBadge.style.display = count > 0 ? "inline-flex" : "none";
            }
        } catch (_) {}

        // 4) Document title — append (N) when unread > 0
        try {
            const baseTitle = document.title.replace(/^\(\d+\)\s*/, '');
            document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
        } catch (_) {}
    }
}

// Initialize singleton
let notificationCenter;
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        notificationCenter = new NotificationCenter();
        window.notificationCenter = notificationCenter;
        notificationCenter._initBadgeSync();
    });
} else {
    notificationCenter = new NotificationCenter();
    window.notificationCenter = notificationCenter;
    notificationCenter._initBadgeSync();
}

// Global functions — maintain existing public API
window.showToast = function(options) {
    if (window.notificationCenter) return window.notificationCenter.showToast(options);
};

window.openNotificationPreferences = function() {
    if (window.notificationCenter) window.notificationCenter.openPreferences();
};

// Update badge when header loads
document.addEventListener("headerLoaded", function() {
    if (window.notificationCenter) {
        window.notificationCenter.updateBadge();
        window.notificationCenter._broadcastBadgeUpdate();
    }
});

setTimeout(function() {
    if (window.notificationCenter) {
        window.notificationCenter.updateBadge();
        window.notificationCenter._broadcastBadgeUpdate();
    }
}, 2000);

