/**
 * Theme Toggle Manager for La Tanda Web
 * Implements dark/light theme switching with system preference detection
 */

(function() {
    'use strict';

    const ThemeManager = {
        STORAGE_KEY: 'la-tanda-theme',
        THEME_LIGHT: 'light',
        THEME_DARK: 'dark',

        init() {
            this.applyTheme(this.getTheme());
            this.setupToggleButton();
            this.listenToSystemChanges();
        },

        getTheme() {
            const savedTheme = localStorage.getItem(this.STORAGE_KEY);
            if (savedTheme) return savedTheme;
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return this.THEME_DARK;
            }
            return this.THEME_LIGHT;
        },

        setTheme(theme) {
            localStorage.setItem(this.STORAGE_KEY, theme);
            this.applyTheme(theme);
        },

        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            const toggleBtn = document.getElementById('theme-toggle');
            if (toggleBtn) {
                toggleBtn.innerHTML = theme === this.THEME_DARK ? '☀️' : '🌙';
            }
        },

        toggle() {
            const currentTheme = this.getTheme();
            const newTheme = currentTheme === this.THEME_DARK ? this.THEME_LIGHT : this.THEME_DARK;
            this.setTheme(newTheme);
        },

        setupToggleButton() {
            let toggleBtn = document.getElementById('theme-toggle');
            if (!toggleBtn) {
                toggleBtn = document.createElement('button');
                toggleBtn.id = 'theme-toggle';
                toggleBtn.innerHTML = '🌙';
                toggleBtn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999;width:44px;height:44px;border-radius:50%;border:2px solid #ddd;background:#fff;cursor:pointer;font-size:20px;';
                document.body.appendChild(toggleBtn);
            }
            toggleBtn.addEventListener('click', () => this.toggle());
        },

        listenToSystemChanges() {
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (!localStorage.getItem(this.STORAGE_KEY)) {
                        this.applyTheme(e.matches ? this.THEME_DARK : this.THEME_LIGHT);
                    }
                });
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
    } else {
        ThemeManager.init();
    }
    window.ThemeManager = ThemeManager;
})();
