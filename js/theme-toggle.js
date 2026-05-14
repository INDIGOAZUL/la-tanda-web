/* ============================================
   LA TANDA — THEME TOGGLE (JS)
   Issue #84 — Dark/Light Theme Toggle
   ============================================ */
(function () {
    'use strict';

    var STORAGE_KEY = 'latanda-theme';
    var DARK = 'dark';
    var LIGHT = 'light';

    /* ── Determine initial theme ── */
    function getPreferredTheme() {
        var stored = null;
        try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
        if (stored === DARK || stored === LIGHT) return stored;
        // System preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return LIGHT;
        }
        return DARK; // default
    }

    /* ── Apply theme to <html> ── */
    function applyTheme(theme, animate) {
        var root = document.documentElement;
        if (animate) {
            root.classList.add('theme-transition');
            // Remove transition class after animation completes
            clearTimeout(applyTheme._timer);
            applyTheme._timer = setTimeout(function () {
                root.classList.remove('theme-transition');
            }, 400);
        }
        root.setAttribute('data-theme', theme);
        // Update meta theme-color if present
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', theme === LIGHT ? '#f8fafc' : '#0f172a');
        }
    }

    /* ── Toggle between themes ── */
    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme') || DARK;
        var next = current === DARK ? LIGHT : DARK;
        applyTheme(next, true);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
        updateToggleIcons(next);
    }

    /* ── Update all toggle button icons ── */
    function updateToggleIcons(theme) {
        document.querySelectorAll('.lt-theme-toggle').forEach(function (btn) {
            btn.setAttribute('aria-label', theme === DARK ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            btn.setAttribute('title', theme === DARK ? 'Modo claro' : 'Modo oscuro');
        });
    }

    /* ── Create toggle button HTML ── */
    function createToggleHTML() {
        return '<button class="lt-theme-toggle" aria-label="Cambiar a modo claro" title="Modo claro">'
            + '<i class="fas fa-sun lt-theme-icon lt-theme-icon-sun"></i>'
            + '<i class="fas fa-moon lt-theme-icon lt-theme-icon-moon"></i>'
            + '</button>';
    }

    /* ── Insert toggle into header ── */
    function injectToggle() {
        // Avoid double injection
        if (document.querySelector('.lt-theme-toggle')) return;

        // Try the new header structure first
        var headerRight = document.querySelector('.lt-header-right');
        if (headerRight) {
            var notifBtn = headerRight.querySelector('#notificationsBtn');
            if (notifBtn) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = createToggleHTML();
                var btn = wrapper.firstElementChild;
                btn.addEventListener('click', toggleTheme);
                headerRight.insertBefore(btn, notifBtn);
                return;
            }
        }

        // Try legacy header
        var legacyRight = document.querySelector('.header-container .header-right, .latanda-header .header-right');
        if (legacyRight) {
            var wrapper2 = document.createElement('div');
            wrapper2.innerHTML = createToggleHTML();
            var btn2 = wrapper2.firstElementChild;
            btn2.addEventListener('click', toggleTheme);
            legacyRight.insertBefore(btn2, legacyRight.firstChild);
            return;
        }

        // Fallback: prepend to body
        var wrapper3 = document.createElement('div');
        wrapper3.innerHTML = createToggleHTML();
        var btn3 = wrapper3.firstElementChild;
        btn3.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;';
        btn3.addEventListener('click', toggleTheme);
        document.body.appendChild(btn3);
    }

    /* ── Initialize ── */
    var theme = getPreferredTheme();
    applyTheme(theme, false);

    // Apply ASAP (before DOMContentLoaded if possible)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            injectToggle();
            updateToggleIcons(theme);
        });
    } else {
        injectToggle();
        updateToggleIcons(theme);
    }

    // Also try after header loads (components-loader is async)
    document.addEventListener('headerLoaded', function () {
        setTimeout(function () {
            injectToggle();
            updateToggleIcons(document.documentElement.getAttribute('data-theme') || DARK);
        }, 100);
    });

    // Listen for system preference changes
    if (window.matchMedia) {
        try {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
                // Only auto-switch if user hasn't set a preference
                var stored = null;
                try { stored = localStorage.getItem(STORAGE_KEY); } catch (ex) {}
                if (!stored) {
                    var newTheme = e.matches ? DARK : LIGHT;
                    applyTheme(newTheme, true);
                    updateToggleIcons(newTheme);
                }
            });
        } catch (e) {
            // Safari <14 fallback
            window.matchMedia('(prefers-color-scheme: dark)').addListener(function (e) {
                var stored = null;
                try { stored = localStorage.getItem(STORAGE_KEY); } catch (ex) {}
                if (!stored) {
                    var newTheme = e.matches ? DARK : LIGHT;
                    applyTheme(newTheme, true);
                    updateToggleIcons(newTheme);
                }
            });
        }
    }

    // Expose for debugging
    window.LaTandaTheme = {
        toggle: toggleTheme,
        get: function () { return document.documentElement.getAttribute('data-theme') || DARK; },
        set: function (t) { applyTheme(t, true); try { localStorage.setItem(STORAGE_KEY, t); } catch (e) {} updateToggleIcons(t); }
    };
})();
