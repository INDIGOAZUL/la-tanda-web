/**
 * Theme Toggle Module - Dark/Light Theme Switcher
 * La Tanda Platform
 * 
 * Copyright (c) 2026 思捷娅科技 (SJYKJ) — MIT License
 */

(function() {
    'use strict';
    
    const THEME_KEY = 'theme_preference';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';
    
    // Light theme overrides
    const LIGHT_OVERRIDES = {
        '--ds-bg-base': '#f8fafc',
        '--ds-bg-surface': 'rgba(0,0,0,0.02)',
        '--ds-bg-surface-hover': 'rgba(0,0,0,0.04)',
        '--ds-bg-elevated': 'rgba(255,255,255,0.95)',
        '--ds-bg-overlay': 'rgba(255,255,255,0.9)',
        '--ds-bg-input': 'rgba(0,0,0,0.05)',
        '--ds-text-primary': '#0f172a',
        '--ds-text-secondary': '#475569',
        '--ds-text-muted': '#64748b',
        '--ds-text-inverse': '#f8fafc',
        '--ds-border': 'rgba(0,0,0,0.08)',
        '--ds-border-hover': 'rgba(0,0,0,0.15)'
    };
    
    let currentTheme = DARK_THEME;
    
    // Get saved preference
    function getSavedTheme() {
        try {
            const saved = localStorage.getItem(THEME_KEY);
            if (saved === LIGHT_THEME || saved === DARK_THEME) {
                return saved;
            }
        } catch (e) {}
        return null;
    }
    
    // Save preference
    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {}
    }
    
    // Apply light theme overrides
    function applyLightTheme() {
        const root = document.documentElement;
        for (const [prop, value] of Object.entries(LIGHT_OVERRIDES)) {
            root.style.setProperty(prop, value);
        }
        document.body.classList.add('light-theme');
    }
    
    // Remove light theme overrides
    function applyDarkTheme() {
        const root = document.documentElement;
        for (const prop of Object.keys(LIGHT_OVERRIDES)) {
            root.style.removeProperty(prop);
        }
        document.body.classList.remove('light-theme');
    }
    
    // Toggle theme
    function toggleTheme() {
        if (currentTheme === DARK_THEME) {
            currentTheme = LIGHT_THEME;
            applyLightTheme();
        } else {
            currentTheme = DARK_THEME;
            applyDarkTheme();
        }
        saveTheme(currentTheme);
        updateToggleIcon();
    }
    
    // Update toggle button icon
    function updateToggleIcon() {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            if (currentTheme === LIGHT_THEME) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }
    
    // Initialize theme
    function init() {
        // Check saved preference or system preference
        const saved = getSavedTheme();
        if (saved) {
            currentTheme = saved;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            currentTheme = LIGHT_THEME;
        }
        
        // Apply initial theme
        if (currentTheme === LIGHT_THEME) {
            applyLightTheme();
        }
        
        // Wire up toggle button
        const toggleBtn = document.getElementById('themeToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleTheme);
        }
        
        updateToggleIcon();
        
        // Prevent flash of wrong theme
        document.documentElement.classList.add('theme-ready');
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose globally
    window.ThemeToggle = {
        toggle: toggleTheme,
        getTheme: function() { return currentTheme; },
        setTheme: function(theme) {
            currentTheme = theme;
            if (theme === LIGHT_THEME) {
                applyLightTheme();
            } else {
                applyDarkTheme();
            }
            saveTheme(currentTheme);
            updateToggleIcon();
        }
    };
    
})();
