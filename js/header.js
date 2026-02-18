/**
 * ============================================
 * LA TANDA - HEADER COMPONENT
 * Version: 1.1 - Fixed async initialization
 * ============================================
 */

class LaTandaHeader {
    constructor() {
        this.header = document.getElementById("mainHeader");
        if (!this.header) {
            return;
        }

        this.elements = {
            menuToggle: document.getElementById("menuToggle"),
            balanceToggle: document.getElementById("balanceToggle"),
            balanceIcon: document.getElementById("balanceIcon"),
            walletBalance: document.getElementById("walletBalance"),
            notifBadge: document.getElementById("notifBadge"),
            notificationsBtn: document.getElementById("notificationsBtn"),
            searchBtn: document.getElementById("searchBtn"),
            profileBtn: document.getElementById("profileBtn")
        };

        this.state = {
            balanceHidden: localStorage.getItem("balanceHidden") === "true",
            sidebarOpen: false
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUserData();
        this.restoreState();
        document.body.classList.add("has-lt-header");
    }

    bindEvents() {
        // Event delegation - single listener for all header clicks
        this.header.addEventListener("click", (e) => {
            const target = e.target.closest("[id]");
            if (!target) return;

            switch (target.id) {
                case "menuToggle":
                    this.toggleSidebar();
                    break;
                case "balanceToggle":
                    this.toggleBalance();
                    break;
                case "notificationsBtn":
                    this.openNotifications();
                    break;
                case "searchBtn":
                    this.openSearch();
                    break;
                case "profileBtn":
                    this.openProfile();
                    break;
            }
        });

        // Close sidebar when clicking outside
        document.addEventListener("click", (e) => {
            if (this.state.sidebarOpen && 
                !e.target.closest(".sidebar") && 
                !e.target.closest("#menuToggle")) {
                this.closeSidebar();
            }
        });

        // Keyboard shortcuts
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.state.sidebarOpen) {
                this.closeSidebar();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                this.openSearch();
            }
        });
    }

    restoreState() {
        if (this.state.balanceHidden) {
            this.elements.walletBalance?.classList.add("hidden");
            if (this.elements.balanceIcon) {
                this.elements.balanceIcon.className = "fas fa-eye-slash";
            }
        }
    }

    // ============================================
    // SIDEBAR
    // ============================================
    toggleSidebar() {
        this.state.sidebarOpen = !this.state.sidebarOpen;
        
        // Toggle classes on body and sidebar
        document.body.classList.toggle("sidebar-open", this.state.sidebarOpen);
        
        // Find and toggle the sidebar element
        const sidebar = document.querySelector(".sidebar");
        if (sidebar) {
            sidebar.classList.toggle("active", this.state.sidebarOpen);
            sidebar.classList.toggle("open", this.state.sidebarOpen);
        }
        
        // Also call legacy toggleMenu if it exists
        if (typeof window.toggleMenu === "function") {
            window.toggleMenu();
        }
        
    }

    closeSidebar() {
        this.state.sidebarOpen = false;
        document.body.classList.remove("sidebar-open");
        const sidebar = document.querySelector(".sidebar");
        if (sidebar) {
            sidebar.classList.remove("active", "open");
        }
    }

    // ============================================
    // BALANCE
    // ============================================
    toggleBalance() {
        this.state.balanceHidden = !this.state.balanceHidden;
        
        this.elements.walletBalance?.classList.toggle("hidden", this.state.balanceHidden);
        
        if (this.elements.balanceIcon) {
            this.elements.balanceIcon.className = this.state.balanceHidden 
                ? "fas fa-eye-slash" 
                : "fas fa-eye";
        }
        
        localStorage.setItem("balanceHidden", this.state.balanceHidden);
    }

    // ============================================
    // USER DATA
    // ============================================
    getAuthToken() {
        return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || null;
    }

    async loadUserData() {
        try {
            const userId = window.LaTandaUser ? window.LaTandaUser.getId() : (JSON.parse(localStorage.getItem("latanda_user") || "{}").id || localStorage.getItem("user_id"));
            if (!userId) return;

            const apiBase = window.API_BASE_URL || "https://latanda.online";
            const token = this.getAuthToken();
            const headers = token ? { "Authorization": "Bearer " + token } : {};
            const response = await fetch(`${apiBase}/api/wallet/balance?user_id=${userId}`, { headers });
            const data = await response.json();

            if (data.success && this.elements.walletBalance) {
                const balance = parseFloat(data.data?.balance || data.balance || 0);
                this.elements.walletBalance.textContent = `L. ${balance.toLocaleString("es-HN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
            }

            this.loadNotifications(userId);
        } catch (err) {
        }
    }

    async loadNotifications(userId) {
        try {
            const apiBase = window.API_BASE_URL || "https://latanda.online";
            const token = this.getAuthToken();
            const headers = token ? { "Authorization": "Bearer " + token } : {};
            const response = await fetch(`${apiBase}/api/notifications?user_id=${userId}&status=unread`, { headers });
            const data = await response.json();

            if (data.success && this.elements.notifBadge) {
                const count = data.data?.length || data.notifications?.length || 0;
                if (count > 0) {
                    this.elements.notifBadge.textContent = count > 99 ? "99+" : count;
                } else {
                    this.elements.notifBadge.textContent = "";
                }
            }
        } catch (err) {
            // Silently fail for notifications
        }
    }

    // ============================================
    // ACTIONS
    // ============================================
    openNotifications() {
        if (window.notificationCenter && typeof window.notificationCenter.toggle === "function") {
            window.notificationCenter.toggle();
            return;
        }
        if (typeof window.toggleNotificationCenter === "function") {
            window.toggleNotificationCenter();
            return;
        }
        window.location.href = "notificaciones.html";
    }

    openSearch() {
        if (typeof window.showQuickSearch === "function") {
            window.showQuickSearch();
            return;
        }
        if (typeof window.openSearchModal === "function") {
            window.openSearchModal();
            return;
        }
        const query = prompt("Buscar en La Tanda:");
        if (query) {
        }
    }

    openProfile() {
        if (typeof window.openProfileEditor === "function") {
            window.openProfileEditor();
            return;
        }
        if (typeof window.togglePreferences === "function") {
            window.togglePreferences();
            return;
        }
        window.location.href = "mi-perfil.html";
    }

    // ============================================
    // PUBLIC API
    // ============================================
    updateBalance(amount) {
        if (this.elements.walletBalance) {
            this.elements.walletBalance.textContent = `L. ${parseFloat(amount).toLocaleString("es-HN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    }

    updateNotificationCount(count) {
        if (this.elements.notifBadge) {
            this.elements.notifBadge.textContent = count > 0 ? (count > 99 ? "99+" : count) : "";
        }
    }

    refresh() {
        this.loadUserData();
    }
}

// ============================================
// INITIALIZE AFTER HEADER COMPONENT LOADS
// ============================================
let headerInitRetries = 0;
const MAX_HEADER_RETRIES = 30; // 3 segundos máximo (30 * 100ms)

function initLaTandaHeader() {
    // Check if header HTML is loaded
    const mainHeader = document.getElementById("mainHeader");
    if (mainHeader) {
        window.laTandaHeader = new LaTandaHeader();
    } else {
        headerInitRetries++;
        if (headerInitRetries < MAX_HEADER_RETRIES) {
            // Retry after a short delay
            setTimeout(initLaTandaHeader, 100);
        } else {
        }
    }
}

// Try to initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    // Give component loader time to fetch and inject header
    setTimeout(initLaTandaHeader, 500);
});

// Also listen for custom event from component loader
document.addEventListener("headerLoaded", () => {
    if (!window.laTandaHeader) {
        initLaTandaHeader();
    }
});

// Fallback: Initialize immediately if header already exists
if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(initLaTandaHeader, 500);
}
