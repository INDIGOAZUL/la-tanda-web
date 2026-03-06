/**
 * LA TANDA - Theme Init (Inline)
 * Must be inlined in <head> before CSS loads to prevent flash
 * Copy this content directly into HTML files
 */
(function() {
    'use strict';
    try {
        var stored = localStorage.getItem('lt-theme');
        var theme;
        
        if (stored) {
            theme = stored;
        } else {
            // Check system preference
            var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
            theme = prefersLight ? 'light' : 'dark';
        }
        
        // Apply immediately
        document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
        // Fallback to dark
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();
