/**
 * La Tanda Sidebar Events Module v1.2
 * Handles all sidebar event delegation and interactions
 * Fixed: Wait for sidebar element before binding events
 */

const SidebarEvents = {
    initialized: false,
    boundHandler: null,

    init() {
        if (this.initialized) return;
        
        // Wait for sidebar to be in DOM
        this.waitForSidebar().then(() => {
            this.bindEvents();
            this.restoreCollapsedState();
            this.initialized = true;
        });
    },

    async waitForSidebar() {
        let attempts = 0;
        while (!document.getElementById("sidebar") && attempts < 50) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
    },

    bindEvents() {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");

        if (!sidebar) {
            return;
        }


        // Event delegation on sidebar
        this.boundHandler = this.handleClick.bind(this);
        sidebar.addEventListener("click", this.boundHandler);

        // Overlay click closes sidebar
        if (overlay) {
            overlay.addEventListener("click", () => {
                SidebarUI.close();
            });
        }

        // ESC key closes sidebar
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && SidebarUI.isOpen) {
                SidebarUI.close();
            }
        });

        // Handle hamburger menu click (delegated from header)
        document.addEventListener("click", (e) => {
            const menuBtn = e.target.closest("#menuToggle, .hamburger-menu, .menu-toggle");
            if (menuBtn) {
                e.preventDefault();
                SidebarUI.toggle();
            }
        });

        // Swipe gesture support for mobile
        this.setupSwipeGestures(sidebar);
    },

    handleClick(e) {
        // Handle collapsible section titles
        const collapsibleTitle = e.target.closest(".nav-section-title.collapsible");
        if (collapsibleTitle) {
            e.preventDefault();
            e.stopPropagation();
            const section = collapsibleTitle.closest(".nav-section[data-collapsible]");
            if (section) {
                this.toggleSection(section);
            }
            return;
        }

        // Handle logout button
        const logoutBtn = e.target.closest("#sidebarLogoutBtn");
        if (logoutBtn) {
            e.preventDefault();
            this.handleLogout();
            return;
        }

        // Handle nav item clicks
        const navItem = e.target.closest(".nav-item");
        if (navItem) {
            // Update active state
            if (window.SidebarNavigation) {
                SidebarNavigation.setActive(navItem);
            }
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                setTimeout(() => SidebarUI.close(), 200);
            }
        }
    },

    toggleSection(section) {
        if (!section) return;
        
        section.classList.toggle("collapsed");
        
        // Save state to localStorage
        const sectionId = section.id;
        const isCollapsed = section.classList.contains("collapsed");
        localStorage.setItem("sidebar_" + sectionId, isCollapsed ? "collapsed" : "expanded");
        
    },

    restoreCollapsedState() {
        const collapsibleSections = document.querySelectorAll(".nav-section[data-collapsible]");
        collapsibleSections.forEach(section => {
            const savedState = localStorage.getItem("sidebar_" + section.id);
            if (savedState === "expanded") {
                section.classList.remove("collapsed");
            }
        });
    },

    handleLogout() {
        if (confirm("¿Estás seguro que deseas cerrar sesión?")) {
            localStorage.removeItem("token");
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            localStorage.removeItem("userEmail");
            window.location.href = "auth-enhanced.html";
        }
    },

    setupSwipeGestures(sidebar) {
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener("touchstart", (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener("touchend", (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    },

    handleSwipe(startX, endX) {
        const swipeThreshold = 100;
        const diff = endX - startX;

        if (startX < 50 && diff > swipeThreshold && !SidebarUI.isOpen) {
            SidebarUI.open();
        }
        
        if (diff < -swipeThreshold && SidebarUI.isOpen) {
            SidebarUI.close();
        }
    },

    destroy() {
        const sidebar = document.getElementById("sidebar");
        if (sidebar && this.boundHandler) {
            sidebar.removeEventListener("click", this.boundHandler);
        }
        this.initialized = false;
    }
};

window.SidebarEvents = SidebarEvents;
