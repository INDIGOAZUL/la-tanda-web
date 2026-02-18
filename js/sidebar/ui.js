/**
 * La Tanda Sidebar UI Module v1.0
 * Handles sidebar DOM manipulation and visual state
 */

const SidebarUI = {
    isOpen: false,

    open() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (!sidebar) return;

        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.isOpen = true;
        
        // Emit event for other modules
        if (window.EventBus) {
            window.EventBus.emit('sidebar:opened');
        }
        
    },

    close() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (!sidebar) return;

        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        this.isOpen = false;
        
        // Emit event for other modules
        if (window.EventBus) {
            window.EventBus.emit('sidebar:closed');
        }
        
    },

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    updateBadge(id, value) {
        const badge = document.getElementById(id);
        if (badge) {
            badge.textContent = value;
            badge.style.display = value > 0 ? 'inline-block' : 'none';
        }
    },

    showLoading(show = true) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('loading', show);
        }
    }
};

window.SidebarUI = SidebarUI;

// Global toggle function for backward compatibility
window.toggleMenu = function() {
    SidebarUI.toggle();
};
