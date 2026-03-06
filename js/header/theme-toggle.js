/**
 * LA TANDA - Theme Toggle
 * Dark/Light theme switcher
 * @version 1.0
 */

const LaTandaTheme = {
    THEME_KEY: 'latanda_theme',
    
    /**
     * Initialize theme toggle
     */
    init() {
        // Apply theme early to prevent flash
        this.applyStoredTheme();
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.THEME_KEY)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
        
        // Wait for header to be loaded
        if (document.getElementById('themeToggle')) {
            this.attachToggleHandler();
        } else {
            document.addEventListener('headerLoaded', () => this.attachToggleHandler());
        }
    },
    
    /**
     * Apply stored theme or system preference
     */
    applyStoredTheme() {
        const stored = localStorage.getItem(this.THEME_KEY);
        const theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        this.setTheme(theme, false);
    },
    
    /**
     * Set theme
     */
    setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (save) {
            localStorage.setItem(this.THEME_KEY, theme);
        }
        this.updateIcon(theme);
    },
    
    /**
     * Toggle theme
     */
    toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
    },
    
    /**
     * Update toggle icon
     */
    updateIcon(theme) {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    },
    
    /**
     * Attach click handler to toggle button
     */
    attachToggleHandler() {
        const toggle = document.getElementById('themeToggle');
        if (toggle && !toggle.hasAttribute('data-theme-initialized')) {
            toggle.addEventListener('click', () => this.toggle());
            toggle.setAttribute('data-theme-initialized', 'true');
        }
    }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => LaTandaTheme.init());

window.LaTandaTheme = LaTandaTheme;
