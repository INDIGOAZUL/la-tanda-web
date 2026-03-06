/**
 * LA TANDA - Early Theme Application
 * Prevents flash of wrong theme on page load
 * MUST be included in <head> before CSS loads
 * Version: 1.0.0
 */

(function() {
    'use strict';
    
    const THEME_KEY = 'la-tanda-theme';
    const DARK = 'dark';
    const LIGHT = 'light';
    
    // Get theme from localStorage or system preference
    function getInitialTheme() {
        let theme = null;
        
        // Try localStorage
        try {
            theme = localStorage.getItem(THEME_KEY);
        } catch (e) {}
        
        // Fall back to system preference
        if (!theme) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                theme = LIGHT;
            } else {
                theme = DARK;
            }
        }
        
        return theme;
    }
    
    // Apply theme immediately
    const theme = getInitialTheme();
    document.documentElement.setAttribute('data-theme', theme);
    
})();
