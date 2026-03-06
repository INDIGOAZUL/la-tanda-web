/**
 * LA TANDA - Theme Toggle Manager
 * Handles dark/light theme switching with localStorage persistence
 * Version: 1.0.0
 */

(function() {
    'use strict';

    const THEME_KEY = 'la-tanda-theme';
    const THEME_ATTRIBUTE = 'data-theme';

    // Theme definitions
    const themes = {
        dark: {
            '--bg-primary': '#0f172a',
            '--bg-secondary': '#1e293b',
            '--bg-card': 'rgba(15, 23, 42, 0.6)',
            '--bg-accent': 'rgba(30, 41, 59, 0.8)',
            '--text-primary': '#f8fafc',
            '--text-secondary': 'rgba(255, 255, 255, 0.7)',
            '--text-muted': 'rgba(255, 255, 255, 0.5)',
            '--border-primary': 'rgba(255, 255, 255, 0.08)',
            '--border-card': 'rgba(0, 255, 255, 0.1)',
            '--border-accent': 'rgba(0, 255, 255, 0.2)',
            '--sidebar-bg': '#0f172a',
            '--input-bg': 'rgba(15, 23, 42, 0.8)',
            '--hover-bg': 'rgba(255, 255, 255, 0.05)',
            '--shadow-color': 'rgba(0, 0, 0, 0.3)',
            '--gradient-orb': 'rgba(0, 255, 255, 0.1)'
        },
        light: {
            '--bg-primary': '#f8fafc',
            '--bg-secondary': '#f1f5f9',
            '--bg-card': 'rgba(255, 255, 255, 0.9)',
            '--bg-accent': 'rgba(241, 245, 249, 0.9)',
            '--text-primary': '#1e293b',
            '--text-secondary': 'rgba(30, 41, 59, 0.7)',
            '--text-muted': 'rgba(30, 41, 59, 0.5)',
            '--border-primary': 'rgba(0, 0, 0, 0.08)',
            '--border-card': 'rgba(0, 212, 170, 0.2)',
            '--border-accent': 'rgba(0, 212, 170, 0.3)',
            '--sidebar-bg': '#ffffff',
            '--input-bg': 'rgba(255, 255, 255, 0.9)',
            '--hover-bg': 'rgba(0, 0, 0, 0.03)',
            '--shadow-color': 'rgba(0, 0, 0, 0.1)',
            '--gradient-orb': 'rgba(0, 212, 170, 0.08)'
        }
    };

    /**
     * Get the initial theme based on saved preference or system preference
     */
    function getInitialTheme() {
        // Check saved preference
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
            return savedTheme;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }

        return 'dark';
    }

    /**
     * Apply theme by setting CSS variables on :root
     */
    function applyTheme(themeName) {
        const root = document.documentElement;
        const theme = themes[themeName];

        if (!theme) return;

        // Set data attribute for CSS selectors
        root.setAttribute(THEME_ATTRIBUTE, themeName);

        // Apply CSS variables
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme['--bg-primary']);
        }
    }

    /**
     * Save theme preference to localStorage
     */
    function saveTheme(themeName) {
        localStorage.setItem(THEME_KEY, themeName);
    }

    /**
     * Toggle between dark and light themes
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute(THEME_ATTRIBUTE) || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        applyTheme(newTheme);
        saveTheme(newTheme);
        updateToggleIcon(newTheme);
    }

    /**
     * Update the toggle button icon
     */
    function updateToggleIcon(themeName) {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;

        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = themeName === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        toggleBtn.setAttribute('aria-label', 
            themeName === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
        );
    }

    /**
     * Create the theme toggle button HTML
     */
    function createToggleButton() {
        const currentTheme = document.documentElement.getAttribute(THEME_ATTRIBUTE) || 'dark';
        const iconClass = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        const label = currentTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

        return `
            <button class="lt-header-btn theme-toggle" id="themeToggle" aria-label="${label}">
                <i class="${iconClass}"></i>
            </button>
        `;
    }

    /**
     * Inject theme toggle button into header
     */
    function injectToggleButton() {
        const headerRight = document.querySelector('.lt-header-right');
        if (!headerRight) return;

        // Check if already exists
        if (document.getElementById('themeToggle')) return;

        // Create button element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createToggleButton();
        const toggleBtn = tempDiv.firstElementChild;

        // Insert before the first child (notifications button usually)
        const firstChild = headerRight.firstElementChild;
        if (firstChild) {
            headerRight.insertBefore(toggleBtn, firstChild);
        } else {
            headerRight.appendChild(toggleBtn);
        }

        // Add click handler
        toggleBtn.addEventListener('click', toggleTheme);
    }

    /**
     * Initialize theme system
     */
    function init() {
        // Apply initial theme immediately (before page renders to prevent flash)
        const initialTheme = getInitialTheme();
        applyTheme(initialTheme);

        // Inject toggle button when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectToggleButton);
        } else {
            injectToggleButton();
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            mediaQuery.addEventListener('change', (e) => {
                // Only apply if user hasn't set a preference
                if (!localStorage.getItem(THEME_KEY)) {
                    const newTheme = e.matches ? 'light' : 'dark';
                    applyTheme(newTheme);
                    updateToggleIcon(newTheme);
                }
            });
        }
    }

    // Expose API globally
    window.ThemeManager = {
        init,
        toggle: toggleTheme,
        setTheme: (theme) => {
            if (themes[theme]) {
                applyTheme(theme);
                saveTheme(theme);
                updateToggleIcon(theme);
            }
        },
        getCurrentTheme: () => document.documentElement.getAttribute(THEME_ATTRIBUTE) || 'dark'
    };

    // Auto-initialize
    init();
})();
