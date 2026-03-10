/**
 * Dark/Light Theme Toggle for la-tanda-web
 * Issue: https://github.com/INDIGOAZUL/la-tanda-web/issues/84
 * Bounty: 200 LTD
 */

(function() {
    'use strict';
    
    const THEME_KEY = 'la-tanda-theme';
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';
    
    /**
     * Get the user's theme preference
     * Priority: localStorage > system preference > default (dark)
     */
    function getPreferredTheme() {
        // Check localStorage first
        const stored = localStorage.getItem(THEME_KEY);
        if (stored) {
            return stored;
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return THEME_LIGHT;
        }
        
        // Default to dark
        return THEME_DARK;
    }
    
    /**
     * Apply theme to document
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update toggle button icon
        updateToggleIcon(theme);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme }
        }));
    }
    
    /**
     * Save theme preference
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
     * Create and insert theme toggle button
     */
    function createToggleButton() {
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle dark/light theme');
        button.setAttribute('title', 'Toggle theme');
        button.innerHTML = `
            <span class="theme-icon theme-icon-sun">鈽€锔?/span>
            <span class="theme-icon theme-icon-moon">馃寵</span>
        `;
        
        button.addEventListener('click', toggleTheme);
        
        return button;
    }
    
    /**
     * Update toggle button icon based on current theme
     */
    function updateToggleIcon(theme) {
        const button = document.getElementById('theme-toggle');
        if (!button) return;
        
        const sunIcon = button.querySelector('.theme-icon-sun');
        const moonIcon = button.querySelector('.theme-icon-moon');
        
        if (theme === THEME_LIGHT) {
            sunIcon.style.display = 'inline';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline';
        }
    }
    
    /**
     * Initialize theme system
     */
    function init() {
        // Apply theme early (before page renders) to prevent flash
        const theme = getPreferredTheme();
        applyTheme(theme);
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', insertToggleButton);
        } else {
            insertToggleButton();
        }
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            mediaQuery.addEventListener('change', (e) => {
                // Only apply if user hasn't set a preference
                if (!localStorage.getItem(THEME_KEY)) {
                    applyTheme(e.matches ? THEME_LIGHT : THEME_DARK);
                }
            });
        }
    }
    
    /**
     * Insert toggle button into header
     */
    function insertToggleButton() {
        // Try to find header
        const header = document.querySelector('header, .header, [role="banner"]');
        
        if (header) {
            const button = createToggleButton();
            header.appendChild(button);
            
            // Update icon based on current theme
            const currentTheme = document.documentElement.getAttribute('data-theme') || THEME_DARK;
            updateToggleIcon(currentTheme);
        }
    }
    
    // Export for module usage
    window.ThemeToggle = {
        toggle: toggleTheme,
        getTheme: () => document.documentElement.getAttribute('data-theme'),
        setTheme: (theme) => {
            applyTheme(theme);
            saveTheme(theme);
        }
    };
    
    // Initialize
    init();
})();
