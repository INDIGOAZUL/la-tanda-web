/**
 * LA TANDA - Header Events Manager
 * Event delegation and keyboard shortcuts
 * @version 1.1 - Fixed: Check for parent elements with closest()
 */

const HeaderEvents = {
    boundHandler: null,

    /**
     * Initialize event listeners
     */
    init() {
        const mainHeader = document.getElementById("mainHeader");
        if (!mainHeader) {
            return;
        }

        // Single click handler with delegation
        this.boundHandler = (e) => this.handleClick(e);
        mainHeader.addEventListener("click", this.boundHandler);

        // Keyboard shortcuts
        document.addEventListener("keydown", (e) => this.handleKeyboard(e));

        // Close dropdowns when clicking outside
        document.addEventListener("click", (e) => {
            if (!e.target.closest("#mainHeader")) {
                window.HeaderDropdown && window.HeaderDropdown.closeAll();
            }
        });

    },

    /**
     * Handle click events with delegation
     * Uses closest() to check for specific selectors
     */
    handleClick(e) {
        // Check for wallet area click (including children like walletBalance)
        if (e.target.closest("#walletArea")) {
            e.stopPropagation();
            window.HeaderDropdown && window.HeaderDropdown.toggle();
            return;
        }

        // Check for dropdown close button
        if (e.target.closest("#walletDropdownClose")) {
            e.stopPropagation();
            window.HeaderDropdown && window.HeaderDropdown.close();
            return;
        }

        // Check for menu toggle
        if (e.target.closest("#menuToggle")) {
            e.stopPropagation();
            this.toggleSidebar();
            return;
        }

        // Check for balance toggle
        if (e.target.closest("#balanceToggle")) {
            e.stopPropagation();
            this.toggleBalance();
            return;
        }

        // Check for notifications button
        if (e.target.closest("#notificationsBtn")) {
            e.stopPropagation();
            this.openNotifications();
            return;
        }

        // Check for search button
        if (e.target.closest("#searchBtn")) {
            e.stopPropagation();
            this.openSearch();
            return;
        }

        // Check for profile button
        if (e.target.closest("#profileBtn")) {
            e.stopPropagation();
            this.openProfile();
            return;
        }
    },

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Escape to close modals
        if (e.key === "Escape") {
            window.HeaderDropdown && window.HeaderDropdown.close();
        }

        // Ctrl+K for search
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            this.openSearch();
        }
    },

    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        const sidebar = document.querySelector(".sidebar");
        if (sidebar) {
            sidebar.classList.toggle("active");
            document.body.classList.toggle("sidebar-open");
        }
        
        // Call legacy function if exists
        if (typeof window.toggleMenu === "function") {
            window.toggleMenu();
        }
        
    },

    /**
     * Toggle balance visibility
     */
    toggleBalance() {
        const hidden = localStorage.getItem("balanceHidden") === "true";
        const newState = !hidden;
        localStorage.setItem("balanceHidden", newState);
        window.HeaderUI && window.HeaderUI.toggleBalanceVisibility(newState);
    },

    /**
     * Open notifications panel
     */
    openNotifications() {
        if (window.notificationCenter && window.notificationCenter.toggle) {
            window.notificationCenter.toggle();
        } else if (typeof window.toggleNotificationCenter === "function") {
            window.toggleNotificationCenter();
        } else {
            window.location.href = "notificaciones.html";
        }
    },

    /**
     * Open search
     */
    openSearch() {
        if (typeof window.laTandaComponents !== "undefined" && typeof window.laTandaComponents.toggleSearch === "function") {
            window.laTandaComponents.toggleSearch();
        } else if (typeof window.showQuickSearch === "function" && false) {
            window.showQuickSearch();
        } else if (typeof window.openSearchModal === "function") {
            window.openSearchModal();
        } else {
            const query = prompt("Buscar en La Tanda:");
            
        }
    },

    /**
     * Open profile
     */
    openProfile() {
        if (typeof window.openProfileEditor === "function") {
            window.openProfileEditor();
        } else if (typeof window.togglePreferences === "function") {
            window.togglePreferences();
        } else {
            window.location.href = "mi-perfil.html";
        }
    },

    /**
     * Cleanup event listeners
     */
    destroy() {
        const mainHeader = document.getElementById("mainHeader");
        if (mainHeader && this.boundHandler) {
            mainHeader.removeEventListener("click", this.boundHandler);
        }
    }
};

window.HeaderEvents = HeaderEvents;
