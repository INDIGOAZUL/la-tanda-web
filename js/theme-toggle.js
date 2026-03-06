/**
 * LA TANDA - Theme Toggle System
 * Dark/Light theme switching with localStorage persistence
 * Version: 1.0.0
 * GitHub Issue: #84
 */

(function() {
    'use strict';
    
    // Theme configuration
    const THEME_KEY = 'la-tanda-theme';
    const DARK = 'dark';
    const LIGHT = 'light';
    
    /**
     * Get user's preferred color scheme from system
     */
    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return LIGHT;
        }
        return DARK;
    }
    
    /**
     * Get stored theme preference
     */
    function getStoredTheme() {
        try {
            return localStorage.getItem(THEME_KEY);
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Store theme preference
     */
    function setStoredTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.warn('Failed to save theme preference:', e);
        }
    }
    
    /**
     * Apply theme to document
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === LIGHT ? '#ffffff' : '#0d1117');
        }
        
        // Update toggle button icon
        updateToggleButton(theme);
    }
    
    /**
     * Update theme toggle button icon
     */
    function updateToggleButton(theme) {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;
        
        const icon = toggleBtn.querySelector('i');
        if (!icon) return;
        
        if (theme === LIGHT) {
            icon.className = 'fas fa-sun';
            toggleBtn.setAttribute('aria-label', 'Cambiar a modo oscuro');
        } else {
            icon.className = 'fas fa-moon';
            toggleBtn.setAttribute('aria-label', 'Cambiar a modo claro');
        }
    }
    
    /**
     * Toggle between themes
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || DARK;
        const newTheme = currentTheme === DARK ? LIGHT : DARK;
        
        applyTheme(newTheme);
        setStoredTheme(newTheme);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: newTheme } 
        }));
    }
    
    /**
     * Initialize theme system
     */
    function initTheme() {
        // Check for stored preference first
        let theme = getStoredTheme();
        
        // Fall back to system preference
        if (!theme) {
            theme = getSystemTheme();
        }
        
        // Apply theme
        applyTheme(theme);
        
        // Setup toggle button
        setupToggleButton();
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
                // Only auto-switch if no user preference stored
                if (!getStoredTheme()) {
                    applyTheme(e.matches ? LIGHT : DARK);
                }
            });
        }
    }
    
    /**
     * Setup theme toggle button
     */
    function setupToggleButton() {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) {
            // Retry after header loads
            setTimeout(setupToggleButton, 100);
            return;
        }
        
        toggleBtn.addEventListener('click', toggleTheme);
        
        // Initial icon update
        const currentTheme = document.documentElement.getAttribute('data-theme') || DARK;
        updateToggleButton(currentTheme);
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
    
    // Expose API
    window.LaTandaTheme = {
        toggle: toggleTheme,
        setTheme: applyTheme,
        getTheme: () => document.documentElement.getAttribute('data-theme') || DARK,
        init: initTheme
    };
    
})();
