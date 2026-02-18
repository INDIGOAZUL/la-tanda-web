/**
 * La Tanda Sidebar Navigation Module v1.0
 * Handles page tracking and active state management
 */

const SidebarNavigation = {
    currentPage: null,

    init() {
        this.detectCurrentPage();
        this.highlightActivePage();
    },

    detectCurrentPage() {
        // Get current page from URL
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '') || 'home-dashboard';
        
        // Handle hash-based routes
        const hash = window.location.hash;
        if (hash === '#create') {
            this.currentPage = 'create-tanda';
        } else {
            this.currentPage = filename;
        }
    },

    highlightActivePage() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Remove all active states
        sidebar.querySelectorAll('.nav-item.active').forEach(item => {
            item.classList.remove('active');
        });

        // Find and highlight current page
        const activeItem = sidebar.querySelector(`[data-page="${this.currentPage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    },

    setActive(navItem) {
        if (!navItem) return;

        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Remove previous active
        sidebar.querySelectorAll('.nav-item.active').forEach(item => {
            item.classList.remove('active');
        });

        // Set new active
        navItem.classList.add('active');
        
        // Update current page
        this.currentPage = navItem.dataset.page || null;
    },

    goTo(page) {
        const navItem = document.querySelector(`[data-page="${page}"]`);
        if (navItem) {
            window.location.href = navItem.href;
        }
    }
};

window.SidebarNavigation = SidebarNavigation;
