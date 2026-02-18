/**
 * LA TANDA - Edge Swipe Navigation (Simplified)
 * Version: 1.5.0 - Ultra lightweight
 */

const EdgeSwipe = {
    isEnabled: false,
    leftSidebar: null,
    rightSidebar: null,
    overlay: null,

    init() {
        // Only on mobile
        if (window.innerWidth >= 1024) {
            return;
        }

        this.leftSidebar = document.getElementById('leftSidebar');
        this.rightSidebar = document.getElementById('rightSidebar');

        if (!this.leftSidebar && !this.rightSidebar) {
            return;
        }

        this.createOverlay();
        this.addCloseButtons();
        this.isEnabled = true;
    },

    createOverlay() {
        var existing = document.querySelector('.sidebar-overlay');
        if (existing) {
            this.overlay = existing;
        } else {
            this.overlay = document.createElement('div');
            this.overlay.className = 'sidebar-overlay';
            document.body.appendChild(this.overlay);
        }
        var self = this;
        this.overlay.onclick = function() { self.closeAll(); };
    },

    addCloseButtons() {
        var self = this;
        
        if (this.leftSidebar && !this.leftSidebar.querySelector('.sidebar-close-btn')) {
            var btn = document.createElement('button');
            btn.className = 'sidebar-close-btn';
            btn.innerHTML = '<i class="fas fa-times"></i>';
            btn.onclick = function(e) { e.stopPropagation(); self.closeLeft(); };
            this.leftSidebar.insertBefore(btn, this.leftSidebar.firstChild);
        }

        if (this.rightSidebar && !this.rightSidebar.querySelector('.sidebar-close-btn')) {
            var btn = document.createElement('button');
            btn.className = 'sidebar-close-btn';
            btn.innerHTML = '<i class="fas fa-times"></i>';
            btn.onclick = function(e) { e.stopPropagation(); self.closeRight(); };
            this.rightSidebar.insertBefore(btn, this.rightSidebar.firstChild);
        }
    },

    openLeft() {
        if (!this.leftSidebar) return;
        this.closeRight();
        this.leftSidebar.classList.add('active');
        if (this.overlay) this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeLeft() {
        if (this.leftSidebar) this.leftSidebar.classList.remove('active');
        if (!this.isAnyOpen()) {
            if (this.overlay) this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    openRight() {
        if (!this.rightSidebar) return;
        this.closeLeft();
        this.rightSidebar.classList.add('active');
        if (this.overlay) this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeRight() {
        if (this.rightSidebar) this.rightSidebar.classList.remove('active');
        if (!this.isAnyOpen()) {
            if (this.overlay) this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    closeAll() {
        if (this.leftSidebar) this.leftSidebar.classList.remove('active');
        if (this.rightSidebar) this.rightSidebar.classList.remove('active');
        if (this.overlay) this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    isAnyOpen() {
        return (this.leftSidebar && this.leftSidebar.classList.contains('active')) ||
               (this.rightSidebar && this.rightSidebar.classList.contains('active'));
    },

    toggleLeft() {
        if (this.leftSidebar && this.leftSidebar.classList.contains('active')) {
            this.closeLeft();
        } else {
            this.openLeft();
        }
    },

    toggleRight() {
        if (this.rightSidebar && this.rightSidebar.classList.contains('active')) {
            this.closeRight();
        } else {
            this.openRight();
        }
    }
};

// Init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { EdgeSwipe.init(); });
} else {
    EdgeSwipe.init();
}

window.EdgeSwipe = EdgeSwipe;
