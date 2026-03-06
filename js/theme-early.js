/**
 * LA TANDA - Early Theme Loader
 * Applies theme BEFORE page render to prevent flash
 * Must be placed in <head> before any CSS
 */
(function() {
    'use strict';
    
    const THEME_KEY = 'la-tanda-theme';
    
    function getInitialTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
            return savedTheme;
        }
        
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        
        return 'dark';
    }
    
    // Apply theme immediately
    const theme = getInitialTheme();
    document.documentElement.setAttribute('data-theme', theme);
})();
