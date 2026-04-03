/**
 * LA TANDA - Header Sync v2.0
 * LTD balance + rewards pill data sync
 */
const HeaderSync = {
    intervals: {},
    isVisible: true,
    pausedAt: null,

    getToken() { return localStorage.getItem("auth_token") || localStorage.getItem("authToken") || null; },
    getHeaders() { var t = this.getToken(); return t ? { "Authorization": "Bearer " + t } : {}; },

    start() {
        document.addEventListener("visibilitychange", () => this.handleVisibility());
        this.intervals.balance = setInterval(() => { if (this.isVisible) this.syncBalance(); }, 60000);
        this.intervals.pill = setInterval(() => { if (this.isVisible) this.syncPill(); }, 120000);
        this.intervals.notif = setInterval(() => { if (this.isVisible) this.syncNotifications(); }, 60000);
        this.syncAll();
    },

    stop() { Object.values(this.intervals).forEach(clearInterval); this.intervals = {}; },

    handleVisibility() {
        if (document.hidden) { this.isVisible = false; this.pausedAt = Date.now(); }
        else { this.isVisible = true; if (this.pausedAt && Date.now() - this.pausedAt > 30000) this.syncAll(); this.pausedAt = null; }
    },

    async syncAll() {
        await Promise.all([this.syncBalance(), this.syncPill(), this.syncNotifications()]);
    },

    async syncBalance() {
        var token = this.getToken();
        if (!token) return;
        try {
            // Use JWT auth only — no user_id in URL
            var res = await fetch("/api/wallet/balance", { headers: this.getHeaders() });
            var data = await res.json();
            if (data.success) {
                var ltd = parseFloat(data.data?.ltd_balance || data.data?.balances?.ltd_tokens || data.data?.crypto_balances?.LTD || 0);
                // Update header balance display
                var headerEl = document.getElementById("headerLtdBalance");
                var dropdownEl = document.getElementById("dropdownLtdBalance");
                if (headerEl) headerEl.textContent = ltd.toFixed(1) + " LTD";
                if (dropdownEl) dropdownEl.textContent = ltd.toFixed(1);
                // Cache
                try { localStorage.setItem("_ltd_balance", ltd); } catch(e) {}
            }
        } catch(e) {
            // Use cached balance as fallback
            try {
                var cached = parseFloat(localStorage.getItem("_ltd_balance")) || 0;
                var el = document.getElementById("headerLtdBalance");
                if (el && el.textContent === "0 LTD") el.textContent = cached.toFixed(1) + " LTD";
            } catch(e2) {}
        }
    },

    async syncPill() {
        var token = this.getToken();
        if (!token) return;
        try {
            var res = await fetch("/api/rewards/summary", { headers: this.getHeaders() });
            var r = await res.json();
            if (!r.success) return;
            var d = r.data;
            var pendingCount = 0;
            var msgs = [];

            if (d.mining.can_claim) { msgs.push({ icon: "fa-hammer", text: "Minar ahora", cls: "rp-mine" }); pendingCount++; }
            if (d.streak.claimable_ltd > 0) { msgs.push({ icon: "fa-fire", text: "Racha: +" + d.streak.claimable_ltd + " LTD", cls: "rp-claim" }); pendingCount += d.streak.claimable.length; }
            if (d.onboarding.pending > 0 && d.onboarding.completed < d.onboarding.total) { msgs.push({ icon: "fa-rocket", text: d.onboarding.completed + "/" + d.onboarding.total + " onboarding", cls: "rp-claim" }); pendingCount++; }
            msgs.push({ icon: "fa-coins", text: d.balance.toFixed(1) + " LTD", cls: "rp-idle" });

            // Update mobile pill
            this._updatePill("rewardsPillMobile", "rewardsPillMobileText", "rewardsPillMobileBadge", msgs, pendingCount);
            // Update home-dashboard pill if exists
            this._updatePill("rewardsPill", "rewardsPillText", "rewardsPillBadge", msgs, pendingCount);
        } catch(e) {}
    },

    _updatePill(pillId, textId, badgeId, msgs, pendingCount) {
        var pill = document.getElementById(pillId);
        var textEl = document.getElementById(textId);
        var badgeEl = document.getElementById(badgeId);
        if (!pill || !textEl) return;

        var msg = msgs[0];
        pill.className = "lt-rewards-pill lt-mobile-pill " + msg.cls;
        textEl.textContent = msg.text;
        var icon = pill.querySelector(".lt-rp-icon");
        if (icon) icon.className = "fas " + msg.icon + " lt-rp-icon";
        if (badgeEl) { if (pendingCount > 0) { badgeEl.textContent = pendingCount; badgeEl.style.display = ""; } else { badgeEl.style.display = "none"; } }

        // Rotate if multiple
        if (msgs.length > 1 && !pill._rotating) {
            pill._rotating = true;
            var idx = 0;
            setInterval(function() {
                idx = (idx + 1) % msgs.length;
                var m = msgs[idx];
                pill.className = "lt-rewards-pill lt-mobile-pill " + m.cls;
                textEl.textContent = m.text;
                if (icon) icon.className = "fas " + m.icon + " lt-rp-icon";
            }, 5000);
        }
    },

    syncNotifications() {
        if (window.notificationCenter) {
            var count = window.notificationCenter.unreadCount || 0;
            var badge = document.getElementById("notifBadge");
            if (badge) { badge.textContent = count > 0 ? (count > 99 ? "99+" : count) : ""; }
        }
    },

    forceRefresh(type) {
        if (type === "balance") return this.syncBalance();
        if (type === "pill") return this.syncPill();
        return this.syncAll();
    }
};
window.HeaderSync = HeaderSync;
