/**
 * LA TANDA - Header UI v2.0
 * Minimal — balance + notifications display updates
 */
const HeaderUI = {
    init() {
        // Restore cached balance immediately
        try {
            var cached = parseFloat(localStorage.getItem("_ltd_balance")) || 0;
            var el = document.getElementById("headerLtdBalance");
            if (el && cached > 0) el.textContent = cached.toFixed(1) + " LTD";
        } catch(e) {}
    },

    updateNotifCount(count) {
        var badge = document.getElementById("notifBadge");
        if (!badge) return;
        badge.textContent = count > 0 ? (count > 99 ? "99+" : count) : "";
    },

    showToast(message, type) {
        var toast = document.createElement("div");
        toast.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:10px;font-size:0.82rem;font-weight:600;z-index:9999;transition:opacity 0.3s;color:white;background:" + (type==="error" ? "#ef4444" : type==="success" ? "#22c55e" : "#1e293b") + ";border:1px solid rgba(255,255,255,0.1)";
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(function() { toast.style.opacity = "0"; setTimeout(function() { toast.remove(); }, 300); }, 3000);
    }
};
window.HeaderUI = HeaderUI;
