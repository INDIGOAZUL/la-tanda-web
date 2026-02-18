/**
 * LA TANDA - Contextual Alerts
 * Sistema de alertas contextuales para el Hub Inteligente
 * Version: 1.0.0
 */

const HubContextualAlerts = {
    container: null,
    dismissedAlerts: new Set(),
    autoDismissDelay: 10000, // 10 segundos

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {

            return;
        }

        // Load dismissed alerts from localStorage
        const stored = localStorage.getItem("hub_dismissed_alerts");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.dismissedAlerts = new Set(parsed);
            } catch(e) {}
        }

    },

    render(alerts) {
        if (!this.container) return;
        if (!alerts || alerts.length === 0) {
            this.container.innerHTML = "";
            this.container.style.display = "none";
            return;
        }

        // Filter out dismissed alerts
        const activeAlerts = alerts.filter(a => !this.dismissedAlerts.has(a.type + "_" + a.message));

        if (activeAlerts.length === 0) {
            this.container.innerHTML = "";
            this.container.style.display = "none";
            return;
        }

        this.container.style.display = "block";
        this.container.innerHTML = `
            <div class="hub-alerts-banner">
                ${activeAlerts.map((alert, index) => this.renderAlert(alert, index)).join("")}
            </div>
        `;

        this.attachEventHandlers();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    renderAlert(alert, index) {
        const priorityClass = this.getPriorityClass(alert.priority);
        const alertId = this.escapeHtml(alert.type + "_" + alert.message);
        const safeIcon = this.escapeHtml(alert.icon);
        const safeColor = this.escapeHtml(alert.color);
        const safeMessage = this.escapeHtml(alert.message);
        const safeUrl = this.escapeHtml(alert.action_url || '');

        return `
            <div class="hub-alert ${priorityClass}" data-alert-id="${alertId}" data-index="${index}">
                <div class="alert-content" data-action-url="${safeUrl}">
                    <i class="fas ${safeIcon}" style="color: ${safeColor}"></i>
                    <span class="alert-message">${safeMessage}</span>
                </div>
                <button class="alert-dismiss" data-dismiss-id="${alertId}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    },

    getPriorityClass(priority) {
        const classes = {
            "urgent": "alert-urgent",
            "opportunity": "alert-opportunity",
            "info": "alert-info",
            "reward": "alert-reward"
        };
        return classes[priority] || "alert-info";
    },

    handleAction(actionUrl) {
        if (!actionUrl) return;
        if (actionUrl.startsWith("#")) {
            const id = actionUrl.replace(/[^a-zA-Z0-9_-]/g, '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        } else if (actionUrl.startsWith("/") && !actionUrl.startsWith("//")) {
            // Safe relative URL (v3.96.0 - H4: block protocol-relative //evil.com)
            window.location.href = actionUrl;
        } else {
            // Validate absolute URL origin (v3.96.0 - H4: prevent latanda.online.evil.com bypass)
            try {
                const parsed = new URL(actionUrl);
                if (parsed.origin === 'https://latanda.online') {
                    window.location.href = actionUrl;
                }
            } catch (e) {
                // Invalid URL — ignore
            }
        }
    },

    dismiss(alertId, event) {
        if (event) {
            event.stopPropagation();
        }

        this.dismissedAlerts.add(alertId);

        // Save to localStorage (expires after 24 hours by clearing on new day)
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem("hub_alerts_date");
        if (storedDate !== today) {
            this.dismissedAlerts.clear();
            localStorage.setItem("hub_alerts_date", today);
        }
        localStorage.setItem("hub_dismissed_alerts", JSON.stringify([...this.dismissedAlerts]));

        // Animate out
        const alertElement = this.container.querySelector(`[data-alert-id="${alertId}"]`);
        if (alertElement) {
            alertElement.classList.add("dismissing");
            setTimeout(() => {
                alertElement.remove();
                // Check if any alerts left
                const remaining = this.container.querySelectorAll(".hub-alert:not(.dismissing)");
                if (remaining.length === 0) {
                    this.container.style.display = "none";
                }
            }, 300);
        }
    },

    dismissAll() {
        const alerts = this.container.querySelectorAll(".hub-alert");
        alerts.forEach(alert => {
            const alertId = alert.dataset.alertId;
            this.dismissedAlerts.add(alertId);
        });
        localStorage.setItem("hub_dismissed_alerts", JSON.stringify([...this.dismissedAlerts]));
        this.container.innerHTML = "";
        this.container.style.display = "none";
    },

    attachEventHandlers() {
        // Event delegation for action clicks and dismiss buttons
        this.container.addEventListener('click', (e) => {
            const dismissBtn = e.target.closest('[data-dismiss-id]');
            if (dismissBtn) {
                e.stopPropagation();
                this.dismiss(dismissBtn.dataset.dismissId);
                return;
            }
            const actionEl = e.target.closest('[data-action-url]');
            if (actionEl) {
                this.handleAction(actionEl.dataset.actionUrl);
            }
        });

        // Auto-dismiss non-urgent alerts after delay
        const nonUrgentAlerts = this.container.querySelectorAll(".hub-alert:not(.alert-urgent)");
        nonUrgentAlerts.forEach(alert => {
            setTimeout(() => {
                if (alert.parentElement) {
                    const alertId = alert.dataset.alertId;
                    this.dismiss(alertId);
                }
            }, this.autoDismissDelay + (parseInt(alert.dataset.index) * 2000));
        });
    }
};

// Export
window.HubContextualAlerts = HubContextualAlerts;
