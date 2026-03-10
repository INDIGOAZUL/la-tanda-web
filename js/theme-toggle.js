/**
 * Theme Toggle Module for La Tanda Web
 * Provides dark/light theme switching with persistence
 * Issue: https://github.com/INDIGOAZUL/la-tanda-web/issues/84
 * Bounty: 200 LTD
 */

(function() {
    'use strict';
    
    // Theme constants
    const THEME_KEY = 'la-tanda-theme';
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';
    
    /**
     * Get the user's preferred theme
     * Priority: localStorage > system preference > default (dark)
     * @returns {string} The theme name ('dark' or 'light')
     */
    function getPreferredTheme() {
        // Check localStorage first (using auth_token pattern)
        const stored = localStorage.getItem(THEME_KEY);
        if (stored) {
            return stored;
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return THEME_LIGHT;
        }
        
        // Default to dark theme
        return THEME_DARK;
    }
    
    /**
     * Apply theme to document
     * @param {string} theme - The theme to apply ('dark' or 'light')
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        updateToggleIcon(theme);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme }
        }));
    }
    
    /**
     * Save theme preference to localStorage
     * @param {string} theme - The theme to save
     */
    function saveTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
    }
    
    /**
     * Toggle between dark and light themes
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || THEME_DARK;
        const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        
        applyTheme(newTheme);
        saveTheme(newTheme);
    }
    
    /**
     * Update toggle button icon based on current theme
     * @param {string} theme - Current theme
     */
    function updateToggleIcon(theme) {
        const button = document.getElementById('theme-toggle');
        if (!button) return;
        
        // Spanish text for UI, English for code
        const isDark = theme === THEME_DARK;
        button.innerHTML = isDark ? '鈽€锔?' : '鈽?';
        button.setAttribute('aria-label', isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
        button.setAttribute('title', isDark ? 'Tema claro' : 'Tema oscuro');
    }
    
    /**
     * Create and insert theme toggle button into DOM
     */
    function createToggleButton() {
        // Check if button already exists
        if (document.getElementById('theme-toggle')) {
            return;
        }
        
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle-btn';
        button.setAttribute('type', 'button');
        
        // Spanish text for accessibility
        button.setAttribute('aria-label', 'Cambiar tema');
        button.setAttribute('title', 'Cambiar tema');
        
        // Initial icon
        button.innerHTML = '鈽€锔?';
        
        // Add click handler
        button.addEventListener('click', toggleTheme);
        
        // Insert into body
        document.body.appendChild(button);
    }
    
    /**
     * Initialize theme system
     */
    function init() {
        // Apply preferred theme
        const theme = getPreferredTheme();
        applyTheme(theme);
        
        // Create toggle button when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createToggleButton);
        } else {
            createToggleButton();
        }
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only apply if user hasn't manually set preference
                if (!localStorage.getItem(THEME_KEY)) {
                    applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
                }
            });
        }
    }
    
    // Initialize when script loads
    init();
    
    // Expose API for other modules
    window.ThemeManager = {
        toggle: toggleTheme,
        getTheme: () => document.documentElement.getAttribute('data-theme') || THEME_DARK,
        setTheme: applyTheme,
        onChange: (callback) => {
            window.addEventListener('themechange', (e) => callback(e.detail.theme));
        }
    };
})();
