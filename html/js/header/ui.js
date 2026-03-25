/**
 * LA TANDA - Header UI Manager
 * DOM manipulation and visual updates
 * @version 1.0
 */

const HeaderUI = {
    elements: null,

    /**
     * Initialize UI element references
     */
    init() {
        this.elements = {
            walletBalance: document.getElementById("walletBalance"),
            dropdownBalance: document.getElementById("dropdownBalance"),
            dropdownBalanceUsd: document.getElementById("dropdownBalanceUsd"),
            notifBadge: document.getElementById("notifBadge"),
            balanceIcon: document.getElementById("balanceIcon"),
            mainHeader: document.getElementById("mainHeader")
        };

        // Subscribe to events
        if (window.LaTandaEvents) {
            window.LaTandaEvents.on("balance:updated", (data) => this.updateBalance(data));
            window.LaTandaEvents.on("notifications:updated", (data) => this.updateNotifCount(data.count));
        }

    },

    /**
     * Update balance display
     */
    updateBalance(data) {
        if (!data || data.amount === undefined) return;

        const formatted = this.formatCurrency(data.amount, data.currency || "HNL");
        
        // Update header balance
        if (this.elements.walletBalance) {
            this.elements.walletBalance.textContent = formatted;
        }
        
        // Update dropdown balance
        if (this.elements.dropdownBalance) {
            this.elements.dropdownBalance.textContent = formatted;
        }
        
        // Update USD equivalent (rough estimate)
        if (this.elements.dropdownBalanceUsd) {
            const usdRate = 0.04; // Approx HNL to USD
            const usd = data.amount * usdRate;
            this.elements.dropdownBalanceUsd.textContent = "≈ $" + usd.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + " USD";
        }
    },

    /**
     * Update notification badge
     */
    updateNotifCount(count) {
        if (!this.elements.notifBadge) return;
        
        if (count > 0) {
            this.elements.notifBadge.textContent = count > 99 ? "99+" : count;
            this.elements.notifBadge.classList.add("has-notifications");
        } else {
            this.elements.notifBadge.textContent = "";
            this.elements.notifBadge.classList.remove("has-notifications");
        }
    },

    /**
     * Show loading state on an element
     */
    showLoading(elementId, show) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        if (show) {
            el.classList.add("lt-loading");
            el.setAttribute("data-original-text", el.textContent);
            el.textContent = "...";
        } else {
            el.classList.remove("lt-loading");
            const original = el.getAttribute("data-original-text");
            if (original) el.textContent = original;
        }
    },

    /**
     * Toggle balance visibility
     */
    toggleBalanceVisibility(hidden) {
        if (this.elements.walletBalance) {
            this.elements.walletBalance.style.visibility = hidden ? "hidden" : "visible";
        }
        if (this.elements.balanceIcon) {
            this.elements.balanceIcon.className = hidden ? "fas fa-eye-slash" : "fas fa-eye";
        }
    },

    /**
     * Format currency
     */
    formatCurrency(amount, currency) {
        const symbols = { "HNL": "L.", "USD": "$", "LTD": "Ł" };
        const symbol = symbols[currency] || "L.";
        return symbol + " " + parseFloat(amount).toLocaleString("es-HN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    /**
     * Show toast notification
     */
    showToast(message, type) {
        // Simple toast implementation
        const toast = document.createElement("div");
        toast.className = "lt-toast lt-toast-" + (type || "info");
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add("lt-toast-show");
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove("lt-toast-show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

window.HeaderUI = HeaderUI;
