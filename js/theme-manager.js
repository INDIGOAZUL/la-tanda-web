/**
 * LA TANDA - Theme Manager
 * Handles dark/light theme switching, persistence, and system preference detection
 */

class ThemeManager {
    constructor() {
        this.storageKey = 'lt-theme-preference';
        this.themes = {
            DARK: 'dark',
            LIGHT: 'light'
        };
        this.init();
    }

    init() {
        // Get saved preference or use system default
        const savedTheme = localStorage.getItem(this.storageKey);
        const systemPreference = window.matchMedia('(prefers-color-scheme: light)').matches 
            ? this.themes.LIGHT 
            : this.themes.DARK;
        
        const initialTheme = savedTheme || systemPreference;
        this.setTheme(initialTheme);

        // Add event listener to toggle button
        document.addEventListener('DOMContentLoaded', () => {
            const toggleBtn = document.getElementById('themeToggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => this.toggleTheme());
            }
        });

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? this.themes.LIGHT : this.themes.DARK);
            }
        });
    }

    setTheme(theme) {
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.removeAttribute('data-theme');
        
        // Set new theme
        root.setAttribute('data-theme', theme);
        
        // Save preference
        localStorage.setItem(this.storageKey, theme);
        
        // Dispatch event for other components to react
        const event = new CustomEvent('themeChange', { detail: { theme } });
        window.dispatchEvent(event);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === this.themes.DARK ? this.themes.LIGHT : this.themes.DARK;
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme');
    }

    resetToSystem() {
        localStorage.removeItem(this.storageKey);
        const systemPreference = window.matchMedia('(prefers-color-scheme: light)').matches 
            ? this.themes.LIGHT 
            : this.themes.DARK;
        this.setTheme(systemPreference);
    }
}

// Initialize theme manager immediately to prevent flash of wrong theme
const themeManager = new ThemeManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
