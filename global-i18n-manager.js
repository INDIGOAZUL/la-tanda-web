/**
 * La Tanda - Global i18n Manager
 * Centralized translation system with persistent language selection
 * Version: 2.0.0
 */

class GlobalI18nManager {
    constructor() {
        this.currentLanguage = 'en'; // Default to English (as per unification)
        this.fallbackLanguage = 'en';
        this.translations = {};
        this.supportedLanguages = {
            'en': {
                name: 'English',
                nativeName: 'English',
                flag: '🇺🇸',
                rtl: false
            },
            'es': {
                name: 'Spanish',
                nativeName: 'Español',
                flag: '🇭🇳', // Honduras flag (target market)
                rtl: false
            },
            'pt': {
                name: 'Portuguese',
                nativeName: 'Português',
                flag: '🇧🇷',
                rtl: false
            }
        };

        this.storageKey = 'latanda_language';
        this.initialized = false;
    }

    /**
     * Initialize the translation system
     */
    async init() {
        if (this.initialized) {
            console.log('⚠️ [i18n] Already initialized');
            return;
        }

        console.log('🌐 [i18n] Initializing Global Translation System...');

        // Load saved language preference or detect
        this.loadLanguagePreference();

        // Load translation files
        await this.loadTranslations();

        // Apply translations to page
        this.applyTranslations();

        // Create language selector UI
        this.createLanguageSelector();

        // Listen for language changes across tabs
        this.setupStorageListener();

        this.initialized = true;
        console.log('✅ [i18n] Translation system ready!', this.currentLanguage);

        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('i18n:ready', {
            detail: { language: this.currentLanguage }
        }));
    }

    /**
     * Load language preference from localStorage or detect from browser
     */
    loadLanguagePreference() {
        // 1. Check localStorage first (user preference)
        const savedLang = localStorage.getItem(this.storageKey);
        if (savedLang && this.supportedLanguages[savedLang]) {
            this.currentLanguage = savedLang;
            console.log('📌 [i18n] Using saved preference:', savedLang);
            return;
        }

        // 2. Detect from browser settings
        const browserLang = navigator.language.split('-')[0];
        if (this.supportedLanguages[browserLang]) {
            this.currentLanguage = browserLang;
            console.log('🌍 [i18n] Detected browser language:', browserLang);
            return;
        }

        // 3. Use default (English)
        console.log('🌐 [i18n] Using default language:', this.fallbackLanguage);
    }

    /**
     * Load translation JSON files
     */
    async loadTranslations() {
        try {
            const response = await fetch(`/translations/${this.currentLanguage}.json`);
            if (response.ok) {
                this.translations = await response.json();
                console.log('📚 [i18n] Translations loaded:', this.currentLanguage);
            } else {
                throw new Error(`Failed to load ${this.currentLanguage}.json`);
            }
        } catch (error) {
            console.warn('⚠️ [i18n] Loading fallback translations');
            try {
                const fallbackResponse = await fetch(`/translations/${this.fallbackLanguage}.json`);
                this.translations = await fallbackResponse.json();
            } catch (fallbackError) {
                console.error('❌ [i18n] Failed to load translations:', fallbackError);
                this.translations = this.getEmergencyTranslations();
            }
        }
    }

    /**
     * Get nested translation value
     */
    translate(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`⚠️ [i18n] Missing translation: ${key}`);
                return key;
            }
        }

        // Replace parameters
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            Object.keys(params).forEach(param => {
                value = value.replace(new RegExp(`{${param}}`, 'g'), params[param]);
            });
        }

        return value;
    }

    /**
     * Short alias for translate
     */
    t(key, params = {}) {
        return this.translate(key, params);
    }

    /**
     * Apply translations to page elements
     */
    applyTranslations() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Translate elements with data-i18n-html (allows HTML content)
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            element.innerHTML = this.translate(key);
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;

        // Update RTL if needed
        if (this.supportedLanguages[this.currentLanguage].rtl) {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }

        console.log('✅ [i18n] Page translated to:', this.currentLanguage);
    }

    /**
     * Change language
     */
    async setLanguage(langCode) {
        if (!this.supportedLanguages[langCode]) {
            console.error('❌ [i18n] Unsupported language:', langCode);
            return false;
        }

        if (langCode === this.currentLanguage) {
            console.log('ℹ️ [i18n] Already using:', langCode);
            return true;
        }

        console.log('🔄 [i18n] Changing language to:', langCode);

        this.currentLanguage = langCode;
        localStorage.setItem(this.storageKey, langCode);

        // HYBRID APPROACH: Reload page to apply full translation
        // This ensures all hardcoded text is replaced with translated version
        console.log('🔄 [i18n] Reloading page to apply full translation...');
        window.location.reload();

        return true;
    }

    /**
     * Create global language selector UI (page-specific)
     */
    createLanguageSelector() {
        // Check if selector already exists
        if (document.getElementById('global-language-selector') ||
            document.getElementById('settings-language-selector')) {
            return;
        }

        // Determine current page
        const currentPath = window.location.pathname;
        const isIndexPage = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/') || currentPath.includes('/index.html');
        const isSettingsPage = currentPath.includes('configuracion.html');

        // Only create selector on index or settings pages
        if (isIndexPage) {
            console.log('🌐 [i18n] Creating header language selector (index page)');
            this.createHeaderLanguageSelector();
        } else if (isSettingsPage) {
            console.log('🌐 [i18n] Creating settings language selector');
            this.createSettingsLanguageSelector();
        } else {
            console.log('🌐 [i18n] No selector needed on this page, using stored preference');
            // Don't create any selector, just apply translations
            return;
        }
    }

    /**
     * Create language selector for header integration (index.html)
     */
    createHeaderLanguageSelector() {
        const selectorHTML = `
            <div id="global-language-selector" class="language-selector-widget">
                <button class="language-selector-btn" id="language-selector-btn" aria-label="Select Language">
                    <span class="current-lang-flag">${this.supportedLanguages[this.currentLanguage].flag}</span>
                    <span class="current-lang-code">${this.currentLanguage.toUpperCase()}</span>
                    <svg class="chevron-down" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                <div class="language-dropdown" id="language-dropdown">
                    ${Object.entries(this.supportedLanguages).map(([code, lang]) => `
                        <button class="language-option ${code === this.currentLanguage ? 'active' : ''}"
                                data-lang="${code}"
                                aria-label="Select ${lang.name}">
                            <span class="lang-flag">${lang.flag}</span>
                            <span class="lang-name">${lang.nativeName}</span>
                            ${code === this.currentLanguage ? '<span class="checkmark">✓</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Inject CSS
        this.injectStyles();

        // Append to body
        document.body.insertAdjacentHTML('beforeend', selectorHTML);

        // Setup event listeners after DOM update
        setTimeout(() => {
            this.setupLanguageSelectorEvents();
        }, 0);

        console.log('✅ [i18n] Header language selector created');
    }

    /**
     * Create language selector for settings page (configuracion.html)
     */
    createSettingsLanguageSelector() {
        // Look for settings panel
        const settingsPanel = document.querySelector('.settings-panel, .user-settings, .preferences-panel, main, .main-content');

        if (!settingsPanel) {
            console.warn('⚠️ [i18n] Settings panel not found, using header style');
            this.createHeaderLanguageSelector();
            return;
        }

        const selectorHTML = `
            <div id="settings-language-selector" class="settings-language-section">
                <h3 class="settings-section-title">
                    <span class="section-icon">🌐</span>
                    Language / Idioma
                </h3>
                <div class="settings-language-options">
                    ${Object.entries(this.supportedLanguages).map(([code, lang]) => `
                        <button class="settings-language-option ${code === this.currentLanguage ? 'active' : ''}"
                                data-lang="${code}"
                                aria-label="Select ${lang.name}">
                            <span class="lang-flag-large">${lang.flag}</span>
                            <div class="lang-info">
                                <span class="lang-name-primary">${lang.nativeName}</span>
                                <span class="lang-name-secondary">${lang.name}</span>
                            </div>
                            ${code === this.currentLanguage ? '<span class="checkmark-circle">✓</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Insert at beginning of settings panel
        settingsPanel.insertAdjacentHTML('afterbegin', selectorHTML);
        this.injectSettingsStyles();

        // Setup event listeners after DOM update
        setTimeout(() => {
            this.setupLanguageSelectorEvents();
        }, 0);

        console.log('✅ [i18n] Settings language selector created');
    }

    /**
     * Inject language selector styles
     */
    injectStyles() {
        if (document.getElementById('global-i18n-styles')) {
            return;
        }

        const styles = `
            <style id="global-i18n-styles">
                .language-selector-widget {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }

                .language-selector-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 12px;
                    padding: 8px 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .language-selector-btn:hover {
                    background: rgba(255, 255, 255, 1);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
                    transform: translateY(-1px);
                }

                .current-lang-flag {
                    font-size: 20px;
                    line-height: 1;
                }

                .current-lang-code {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                }

                .chevron-down {
                    color: #64748b;
                    transition: transform 0.2s ease;
                }

                .language-selector-btn.active .chevron-down {
                    transform: rotate(180deg);
                }

                .language-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    min-width: 180px;
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.2s ease;
                    overflow: hidden;
                }

                .language-dropdown.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .language-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    text-align: left;
                }

                .language-option:hover {
                    background: rgba(0, 255, 255, 0.1);
                }

                .language-option.active {
                    background: rgba(0, 255, 255, 0.15);
                }

                .lang-flag {
                    font-size: 20px;
                }

                .lang-name {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    color: #1e293b;
                }

                .checkmark {
                    color: #00d4aa;
                    font-weight: 700;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .language-selector-widget {
                        top: 10px;
                        right: 10px;
                    }

                    .language-selector-btn {
                        padding: 6px 10px;
                    }

                    .current-lang-code {
                        display: none;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Inject settings page language selector styles
     */
    injectSettingsStyles() {
        if (document.getElementById('global-i18n-settings-styles')) {
            return;
        }

        const styles = `
            <style id="global-i18n-settings-styles">
                .settings-language-section {
                    margin-bottom: 32px;
                    padding: 24px;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 255, 255, 0.1);
                    border-radius: 12px;
                }

                .settings-section-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 0 0 20px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #f8fafc;
                }

                .section-icon {
                    font-size: 24px;
                }

                .settings-language-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                }

                .settings-language-option {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: rgba(30, 41, 59, 0.6);
                    border: 2px solid rgba(148, 163, 184, 0.1);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }

                .settings-language-option:hover {
                    background: rgba(30, 41, 59, 0.8);
                    border-color: rgba(0, 255, 255, 0.3);
                    transform: translateY(-2px);
                }

                .settings-language-option.active {
                    background: rgba(0, 255, 255, 0.1);
                    border-color: rgba(0, 255, 255, 0.5);
                }

                .lang-flag-large {
                    font-size: 32px;
                }

                .lang-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .lang-name-primary {
                    font-size: 16px;
                    font-weight: 600;
                    color: #f8fafc;
                }

                .lang-name-secondary {
                    font-size: 13px;
                    color: rgba(248, 250, 252, 0.6);
                }

                .checkmark-circle {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #00d4aa;
                    border-radius: 50%;
                    color: #0f172a;
                    font-weight: 700;
                    font-size: 16px;
                    flex-shrink: 0;
                }

                @media (max-width: 768px) {
                    .settings-language-options {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Setup language selector event listeners
     */
    setupLanguageSelectorEvents() {
        const btn = document.getElementById('language-selector-btn');
        const dropdown = document.getElementById('language-dropdown');

        // Header version event listeners
        if (btn && dropdown) {
            // Toggle dropdown
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('show');

                if (isOpen) {
                    dropdown.classList.remove('show');
                    btn.classList.remove('active');
                } else {
                    dropdown.classList.add('show');
                    btn.classList.add('active');
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                dropdown.classList.remove('show');
                btn.classList.remove('active');
            });

            // Language selection from dropdown
            dropdown.querySelectorAll('.language-option').forEach(option => {
                option.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const langCode = option.getAttribute('data-lang');
                    await this.setLanguage(langCode);
                    dropdown.classList.remove('show');
                    btn.classList.remove('active');
                });
            });
        }

        // Settings version event listeners
        document.querySelectorAll('.settings-language-option').forEach(option => {
            option.addEventListener('click', async (e) => {
                e.stopPropagation();
                const langCode = option.getAttribute('data-lang');
                await this.setLanguage(langCode);
            });
        });
    }

    /**
     * Update language selector UI after language change
     */
    updateLanguageSelectorUI() {
        const flagSpan = document.querySelector('.current-lang-flag');
        const codeSpan = document.querySelector('.current-lang-code');

        if (flagSpan) {
            flagSpan.textContent = this.supportedLanguages[this.currentLanguage].flag;
        }
        if (codeSpan) {
            codeSpan.textContent = this.currentLanguage.toUpperCase();
        }

        // Update active state in dropdown
        document.querySelectorAll('.language-option').forEach(option => {
            const langCode = option.getAttribute('data-lang');
            if (!langCode || !this.supportedLanguages[langCode]) {
                return; // Skip if invalid language code
            }

            if (langCode === this.currentLanguage) {
                option.classList.add('active');
                option.innerHTML = `
                    <span class="lang-flag">${this.supportedLanguages[langCode].flag}</span>
                    <span class="lang-name">${this.supportedLanguages[langCode].nativeName}</span>
                    <span class="checkmark">✓</span>
                `;
            } else {
                option.classList.remove('active');
                option.innerHTML = `
                    <span class="lang-flag">${this.supportedLanguages[langCode].flag}</span>
                    <span class="lang-name">${this.supportedLanguages[langCode].nativeName}</span>
                `;
            }
        });
    }

    /**
     * Listen for language changes in other tabs
     */
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                const newLang = e.newValue;
                if (newLang !== this.currentLanguage) {
                    console.log('🔄 [i18n] Language changed in another tab:', newLang);
                    this.setLanguage(newLang);
                }
            }
        });
    }

    /**
     * Emergency fallback translations
     */
    getEmergencyTranslations() {
        return {
            common: {
                welcome: 'Welcome',
                home: 'Home',
                settings: 'Settings',
                logout: 'Logout'
            }
        };
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

// Create global instance
window.i18n = new GlobalI18nManager();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.i18n.init();
    });
} else {
    window.i18n.init();
}

// Expose translate function globally
window.t = (key, params) => window.i18n.translate(key, params);

console.log('✅ [i18n] Global i18n Manager loaded');
