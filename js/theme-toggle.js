/**
 * LA TANDA - Theme Toggle
 * Dark/Light Theme Switcher with localStorage persistence
 * Bounty Implementation - Issue #84
 */

(function() {
    'use strict';
    
    // Theme state
    let currentTheme = 'dark';
    
    /**
     * Initialize theme on page load
     * Must run before CSS loads to prevent flash
     */
    function initTheme() {
        // Check localStorage first
        const stored = localStorage.getItem('lt-theme');
        
        if (stored) {
            currentTheme = stored;
        } else {
            // Check system preference
            const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
            currentTheme = prefersLight ? 'light' : 'dark';
        }
        
        // Apply theme immediately
        applyTheme(currentTheme);
    }
    
    /**
     * Apply theme to document
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        currentTheme = theme;
        
        // Update icon
        updateIcon(theme);
        
        // Save to localStorage
        localStorage.setItem('lt-theme', theme);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('lt-theme-change', { detail: { theme } }));
    }
    
    /**
     * Update toggle button icon
     */
    function updateIcon(theme) {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            if (theme === 'light') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }
    
    /**
     * Toggle between dark and light themes
     */
    function toggleTheme() {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        
        // Log for debugging
        console.log('[Theme Toggle] Switched to', newTheme, 'mode');
    }
    
    /**
     * Setup event listeners
     */
    function setupListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachToggleListener);
        } else {
            attachToggleListener();
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            // Only auto-switch if no user preference stored
            if (!localStorage.getItem('lt-theme')) {
                const newTheme = e.matches ? 'light' : 'dark';
                applyTheme(newTheme);
            }
        });
    }
    
    /**
     * Attach click listener to toggle button
     */
    function attachToggleListener() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleTheme);
            console.log('[Theme Toggle] Listener attached');
        } else {
            // Retry after a short delay (component might load asynchronously)
            setTimeout(attachToggleListener, 100);
        }
    }
    
    /**
     * Get current theme
     */
    function getTheme() {
        return currentTheme;
    }
    
    // Initialize immediately (before CSS loads)
    initTheme();
    
    // Setup listeners
    setupListeners();
    
    // Expose API for external use
    window.LaTandaTheme = {
        get: getTheme,
        set: applyTheme,
        toggle: toggleTheme
    };
    
    console.log('[Theme Toggle] Initialized - Current theme:', currentTheme);
})();
