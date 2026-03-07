// Theme Toggle Module
(function() {
    'use strict';

    // Theme storage key
    const THEME_KEY = 'theme';

    // Get current theme
    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'dark';
    }

    // Set theme
    function setTheme(theme) {
        // Save to localStorage
        localStorage.setItem(THEME_KEY, theme);

        // Apply to document
        document.documentElement.setAttribute('data-theme', theme);

        // Update button icon
        updateButtonIcon(theme);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    // Toggle theme
    function toggleTheme() {
        const current = getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
    }

    // Update button icon
    function updateButtonIcon(theme) {
        const button = document.getElementById('theme-toggle-btn');
        if (!button) return;

        button.innerHTML = theme === 'dark'
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    }

    // Initialize
    function init() {
        // Get current theme from localStorage (already applied by early-theme.js)
        const theme = getTheme();

        // Update button icon on load
        updateButtonIcon(theme);

        // Find or create toggle button
        let button = document.getElementById('theme-toggle-btn');

        if (!button) {
            // Create button
            button = document.createElement('button');
            button.id = 'theme-toggle-btn';
            button.className = 'theme-toggle';
            button.setAttribute('aria-label', 'Toggle dark/light theme');
            button.style.cssText = `
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: transform 0.2s;
            `;
            button.innerHTML = theme === 'dark'
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';

            // Add click handler
            button.addEventListener('click', toggleTheme);

            // Insert into header
            const headerNav = document.querySelector('.header-nav, nav');
            if (headerNav) {
                headerNav.appendChild(button);
            }
        }

        // Listen for keyboard shortcuts (optional: Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                toggleTheme();
            }
        });
    }

    // Expose to global scope for manual control
    window.themeToggle = {
        toggle: toggleTheme,
        set: setTheme,
        get: getTheme
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
