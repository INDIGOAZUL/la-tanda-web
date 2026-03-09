/**
 * Theme Toggle Module
 * Handles dark/light theme switching with localStorage persistence
 */

const ThemeToggle = {
    THEME_KEY: 'la-tanda-theme',
    
    init() {
        // Apply theme early before render to prevent flash
        this.applyStoredTheme();
        
        // Listen for toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.THEME_KEY)) {
                this.setTheme(e.matches ? 'light' : 'dark');
            }
        });
    },
    
    getSystemPreference() {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    },
    
    applyStoredTheme() {
        const stored = localStorage.getItem(this.THEME_KEY);
        const theme = stored || this.getSystemPreference();
        this.setTheme(theme, false);
    },
    
    setTheme(theme, persist = true) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update icon
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        if (persist) {
            localStorage.setItem(this.THEME_KEY, theme);
        }
    },
    
    toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
    }
};

// Auto-init when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeToggle.init());
} else {
    ThemeToggle.init();
}
