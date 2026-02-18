/**
 * La Tanda - i18next Implementation with Backend Language Preferences
 * Version: 2.0.0 (Enhanced with backend sync)
 *
 * Features:
 * - Backend-stored language preferences for authenticated users
 * - Graceful fallback to localStorage → navigator → default
 * - Automatic sync on login/logout events
 * - Non-blocking page load (async language detection)
 * - Error handling and retry logic
 * - Floating language selector UI
 */

// Configuration
const I18N_CONFIG = {
    API_BASE_URL: 'https://latanda.online',
    ENDPOINTS: {
        USER_PROFILE: '/api/users/me',
        USER_PREFERENCES: '/api/users/preferences'
    },
    STORAGE_KEYS: {
        AUTH_TOKEN: 'latanda_auth_token',  // Primary auth token
        ALT_AUTH_TOKEN: 'latanda_token',   // Alternative token location
        LANGUAGE: 'latanda_language'
    },
    SUPPORTED_LANGUAGES: ['en', 'es', 'pt'],
    DEFAULT_LANGUAGE: 'es',
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    REQUEST_TIMEOUT: 5000      // 5 seconds
};

// Language preference cache
let languageCache = {
    value: null,
    timestamp: null,
    isAuthenticated: false
};

/**
 * Get authentication token from localStorage
 * Checks both primary and alternative token locations
 */
function getAuthToken() {
    return localStorage.getItem(I18N_CONFIG.STORAGE_KEYS.AUTH_TOKEN) ||
           localStorage.getItem(I18N_CONFIG.STORAGE_KEYS.ALT_AUTH_TOKEN);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    const token = getAuthToken();
    return !!token;
}

/**
 * Make API request with timeout
 */
async function makeAPIRequest(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), I18N_CONFIG.REQUEST_TIMEOUT);

    try {
        const response = await fetch(`${I18N_CONFIG.API_BASE_URL}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('API request timeout');
        }
        throw error;
    }
}

/**
 * Fetch user language preference from backend
 * Returns null if unavailable or on error
 */
async function fetchUserLanguageFromBackend() {
    const token = getAuthToken();

    if (!token) {
        console.debug('[i18n] No auth token - skipping backend language fetch');
        return null;
    }

    try {
        console.log('[i18n] Fetching user language preference from backend...');

        const data = await makeAPIRequest(I18N_CONFIG.ENDPOINTS.USER_PROFILE, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Handle different response structures
        const language = data.user?.preferred_language ||
                        data.data?.user?.preferred_language ||
                        data.preferred_language ||
                        null;

        if (language && I18N_CONFIG.SUPPORTED_LANGUAGES.includes(language)) {
            console.log(`[i18n] Backend language preference: ${language}`);

            // Update cache
            languageCache = {
                value: language,
                timestamp: Date.now(),
                isAuthenticated: true
            };

            return language;
        }

        console.warn('[i18n] Backend returned invalid or missing language preference');
        return null;
    } catch (error) {
        console.warn('[i18n] Failed to fetch user language preference from backend:', error.message);
        return null;
    }
}

/**
 * Save user language preference to backend
 */
async function saveUserLanguageToBackend(language) {
    const token = getAuthToken();

    if (!token) {
        console.debug('[i18n] No auth token - skipping backend language save');
        return false;
    }

    try {
        console.log(`[i18n] Saving language preference to backend: ${language}`);

        await makeAPIRequest(I18N_CONFIG.ENDPOINTS.USER_PREFERENCES, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ preferred_language: language })
        });

        console.log('[i18n] Language preference saved to backend successfully');

        // Update cache
        languageCache = {
            value: language,
            timestamp: Date.now(),
            isAuthenticated: true
        };

        return true;
    } catch (error) {
        console.error('[i18n] Failed to save language preference to backend:', error.message);
        return false;
    }
}

/**
 * Get cached language preference if valid
 */
function getCachedLanguage() {
    if (!languageCache.value || !languageCache.timestamp) {
        return null;
    }

    const age = Date.now() - languageCache.timestamp;
    if (age > I18N_CONFIG.CACHE_TTL) {
        console.debug('[i18n] Language cache expired');
        return null;
    }

    // Verify cache matches auth state
    if (languageCache.isAuthenticated !== isAuthenticated()) {
        console.debug('[i18n] Language cache invalidated - auth state changed');
        return null;
    }

    console.debug(`[i18n] Using cached language: ${languageCache.value}`);
    return languageCache.value;
}

/**
 * Invalidate language cache
 */
function invalidateLanguageCache() {
    console.debug('[i18n] Language cache invalidated');
    languageCache = {
        value: null,
        timestamp: null,
        isAuthenticated: false
    };
}

/**
 * Get user language preference with fallback chain
 * Priority: Cache → Backend → localStorage → navigator → default
 */
async function getUserLanguagePreference() {
    console.log('[i18n] Detecting user language preference...');

    // 1. Check cache first (fastest)
    const cachedLang = getCachedLanguage();
    if (cachedLang) {
        return cachedLang;
    }

    // 2. If authenticated, try backend
    if (isAuthenticated()) {
        const backendLang = await fetchUserLanguageFromBackend();
        if (backendLang) {
            // Sync with localStorage for offline fallback
            localStorage.setItem(I18N_CONFIG.STORAGE_KEYS.LANGUAGE, backendLang);
            return backendLang;
        }
    }

    // 3. Fallback to localStorage
    const storedLang = localStorage.getItem(I18N_CONFIG.STORAGE_KEYS.LANGUAGE);
    if (storedLang && I18N_CONFIG.SUPPORTED_LANGUAGES.includes(storedLang)) {
        console.log(`[i18n] Using localStorage language: ${storedLang}`);

        // Cache for subsequent calls
        languageCache = {
            value: storedLang,
            timestamp: Date.now(),
            isAuthenticated: isAuthenticated()
        };

        return storedLang;
    }

    // 4. Fallback to browser language
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang) {
        // Extract base language code (e.g., 'es' from 'es-MX')
        const baseLang = browserLang.split('-')[0];
        if (I18N_CONFIG.SUPPORTED_LANGUAGES.includes(baseLang)) {
            console.log(`[i18n] Using browser language: ${baseLang}`);

            // Cache for subsequent calls
            languageCache = {
                value: baseLang,
                timestamp: Date.now(),
                isAuthenticated: false
            };

            return baseLang;
        }
    }

    // 5. Final fallback to default
    console.log(`[i18n] Using default language: ${I18N_CONFIG.DEFAULT_LANGUAGE}`);
    return I18N_CONFIG.DEFAULT_LANGUAGE;
}

/**
 * Update language selector button to reflect current language
 */
function updateLanguageSelectorButton(lang) {
    const languages = {
        'en': { name: 'English', flag: '🇺🇸' },
        'es': { name: 'Español', flag: '🇭🇳' },
        'pt': { name: 'Português', flag: '🇧🇷' }
    };

    const toggle = document.getElementById('i18n-toggle');
    if (!toggle || !languages[lang]) return;

    const flagEl = toggle.querySelector('.i18n-flag');
    const codeEl = toggle.querySelector('.i18n-code');

    if (flagEl) flagEl.textContent = languages[lang].flag;
    if (codeEl) codeEl.textContent = lang.toUpperCase();

    document.querySelectorAll('.i18n-option').forEach(option => {
        const optLang = option.getAttribute('data-lang');
        const checkMark = option.querySelector('.i18n-check');

        if (optLang === lang) {
            option.classList.add('active');
            if (!checkMark) {
                option.insertAdjacentHTML('beforeend', '<span class="i18n-check">✓</span>');
            }
        } else {
            option.classList.remove('active');
            if (checkMark) checkMark.remove();
        }
    });
}

/**
 * Change language and sync to backend if authenticated
 */
async function changeLanguage(newLanguage) {
    console.log(`[i18n] Changing language to: ${newLanguage}`);

    // Validate language
    if (!I18N_CONFIG.SUPPORTED_LANGUAGES.includes(newLanguage)) {
        console.error(`[i18n] Unsupported language: ${newLanguage}`);
        return false;
    }

    try {
        // Always update localStorage as backup
        localStorage.setItem(I18N_CONFIG.STORAGE_KEYS.LANGUAGE, newLanguage);

        // Update backend if authenticated (don't block on this)
        if (isAuthenticated()) {
            saveUserLanguageToBackend(newLanguage).catch(error => {
                console.warn('[i18n] Backend language save failed (non-blocking):', error);
            });
        } else {
            // Update cache for non-authenticated users
            languageCache = {
                value: newLanguage,
                timestamp: Date.now(),
                isAuthenticated: false
            };
        }

        // Change language in i18next
        if (typeof i18next !== 'undefined') {
            await i18next.changeLanguage(newLanguage);
            console.log(`[i18n] Language changed successfully to: ${newLanguage}`);

            // Retranslate page
            translatePage();

            // Update language selector button
            updateLanguageSelectorButton(newLanguage);

            // Dispatch event for components to react
            document.dispatchEvent(new CustomEvent('i18n:languageChanged', {
                detail: { language: newLanguage }
            }));
        }

        return true;
    } catch (error) {
        console.error('[i18n] Failed to change language:', error);
        return false;
    }
}

/**
 * Handle login event - fetch and apply user's language preference
 */
async function handleLogin() {
    console.log('[i18n] Login detected - fetching user language preference');

    // Invalidate cache to force fresh fetch
    invalidateLanguageCache();

    try {
        const userLang = await getUserLanguagePreference();

        // Apply language if different from current
        if (typeof i18next !== 'undefined' && userLang !== i18next.language) {
            await changeLanguage(userLang);
        }
    } catch (error) {
        console.error('[i18n] Error handling login language sync:', error);
    }
}

/**
 * Handle logout event - fall back to localStorage/browser default
 */
function handleLogout() {
    console.log('[i18n] Logout detected - resetting language preference');

    // Invalidate cache
    invalidateLanguageCache();

    // Keep localStorage language but remove backend association
    const storedLang = localStorage.getItem(I18N_CONFIG.STORAGE_KEYS.LANGUAGE);
    if (storedLang && I18N_CONFIG.SUPPORTED_LANGUAGES.includes(storedLang)) {
        console.log(`[i18n] Maintaining localStorage language after logout: ${storedLang}`);
    }
}

/**
 * Initialize i18next with backend-aware language detection
 */
async function initializeI18next() {
    console.log('[i18n] Initializing i18next with backend language detection...');

    try {
        // Get user language preference (async but non-blocking)
        const userLang = await getUserLanguagePreference();

        console.log(`[i18n] Initializing with language: ${userLang}`);

        // Initialize i18next
        await i18next
            .use(i18nextHttpBackend)
            .use(i18nextBrowserLanguageDetector)
            .init({
                lng: userLang,
                fallbackLng: I18N_CONFIG.DEFAULT_LANGUAGE,
                supportedLngs: I18N_CONFIG.SUPPORTED_LANGUAGES,
                debug: false,
                backend: {
                    loadPath: '/translations/{{lng}}.json',
                    crossDomain: false
                },
                detection: {
                    // Disable automatic detection since we handle it manually
                    order: [],
                    caches: []
                },
                interpolation: {
                    escapeValue: false
                },
                initImmediate: false
            });

        console.log('✅ [i18n] i18next initialized successfully');
        console.log(`🌐 [i18n] Active language: ${i18next.language}`);

        // Translate page
        translatePage();

        // Create language selector
        createLanguageSelector();

        // Dispatch ready event
        document.dispatchEvent(new CustomEvent('i18n:ready', {
            detail: {
                language: i18next.language,
                isAuthenticated: isAuthenticated()
            }
        }));

        return true;
    } catch (error) {
        console.error('❌ [i18n] Failed to initialize:', error);
        return false;
    }
}

/**
 * Translate all elements on the page
 */
function translatePage() {
    const selectors = ['[data-i18n]', '[data-translate]'];
    let totalTranslated = 0;

    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);

        elements.forEach(element => {
            const key = element.getAttribute('data-i18n') || element.getAttribute('data-translate');
            const translation = i18next.t(key);

            if (translation && translation !== key) {
                // Handle different element types
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.placeholder) {
                        element.placeholder = translation;
                    } else {
                        element.value = translation;
                    }
                } else {
                    element.textContent = translation;
                }
                totalTranslated++;
            }
        });
    });

    console.log(`[i18n] Translated ${totalTranslated} elements`);
}

/**
 * Create floating language selector UI
 */
function createLanguageSelector() {
    // Check if selector already exists
    if (document.getElementById('i18next-language-selector')) {
        return;
    }

    // Only show selector on index and configuracion pages
    const currentPath = window.location.pathname;
    const isIndexPage = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/');
    const isSettingsPage = currentPath.includes('configuracion.html');

    if (!isIndexPage && !isSettingsPage) {
        console.log('🌐 [i18n] Language selector not needed on this page');
        return;
    }

    const languages = {
        'en': { name: 'English', flag: '🇺🇸' },
        'es': { name: 'Español', flag: '🇭🇳' },
        'pt': { name: 'Português', flag: '🇧🇷' }
    };

    const currentLang = i18next.language || 'en';

    // Create HTML
    const selectorHTML = `
        <div id="i18next-language-selector" class="i18n-selector">
            <button class="i18n-btn" id="i18n-toggle" aria-label="Select Language">
                <span class="i18n-flag">${languages[currentLang].flag}</span>
                <span class="i18n-code">${currentLang.toUpperCase()}</span>
                <svg class="i18n-chevron" width="12" height="12" viewBox="0 0 12 12">
                    <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <div class="i18n-dropdown" id="i18n-dropdown">
                ${Object.entries(languages).map(([code, lang]) => `
                    <button class="i18n-option ${code === currentLang ? 'active' : ''}"
                            data-lang="${code}">
                        <span class="i18n-flag">${lang.flag}</span>
                        <span class="i18n-name">${lang.name}</span>
                        ${code === currentLang ? '<span class="i18n-check">✓</span>' : ''}
                    </button>
                `).join('')}
            </div>
        </div>

        <style>
            .i18n-selector {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                font-family: 'Inter', system-ui, sans-serif;
            }

            .i18n-btn {
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

            .i18n-btn:hover {
                background: rgba(255, 255, 255, 1);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
                transform: translateY(-1px);
            }

            .i18n-flag {
                font-size: 20px;
                line-height: 1;
            }

            .i18n-code {
                font-size: 14px;
                font-weight: 600;
                color: #1e293b;
            }

            .i18n-chevron {
                color: #64748b;
                transition: transform 0.2s ease;
            }

            .i18n-btn.active .i18n-chevron {
                transform: rotate(180deg);
            }

            .i18n-dropdown {
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

            .i18n-dropdown.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .i18n-option {
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

            .i18n-option:hover {
                background: rgba(0, 255, 255, 0.1);
            }

            .i18n-option.active {
                background: rgba(0, 255, 255, 0.15);
            }

            .i18n-name {
                flex: 1;
                font-size: 14px;
                font-weight: 500;
                color: #1e293b;
            }

            .i18n-check {
                color: #00d4aa;
                font-weight: 700;
                font-size: 16px;
            }

            @media (max-width: 768px) {
                .i18n-selector {
                    top: 10px;
                    right: 10px;
                }
            }
        </style>
    `;

    // Insert into page
    document.body.insertAdjacentHTML('beforeend', selectorHTML);

    // Setup event listeners
    const btn = document.getElementById('i18n-toggle');
    const dropdown = document.getElementById('i18n-dropdown');

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        btn.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
        btn.classList.remove('active');
    });

    // Language selection
    const options = document.querySelectorAll('.i18n-option');
    console.log(`🔍 [i18n] Found ${options.length} language options`);

    options.forEach(option => {
        option.addEventListener('click', (e) => {
            console.log('🖱️ [i18n] Language option clicked!');
            e.stopPropagation();
            const langCode = option.getAttribute('data-lang');
            console.log('🔄 [i18n] Selected language:', langCode);
            changeLanguage(langCode);
        });
    });

    console.log('✅ [i18n] Language selector created with event listeners attached');
}

/**
 * Setup event listeners for auth state changes
 */
function setupAuthEventListeners() {
    // Listen for login events
    document.addEventListener('auth:login', handleLogin);
    document.addEventListener('user:login', handleLogin);

    // Listen for logout events
    document.addEventListener('auth:logout', handleLogout);
    document.addEventListener('user:logout', handleLogout);

    // Listen for token changes in localStorage
    window.addEventListener('storage', (e) => {
        if (e.key === I18N_CONFIG.STORAGE_KEYS.AUTH_TOKEN ||
            e.key === I18N_CONFIG.STORAGE_KEYS.ALT_AUTH_TOKEN) {
            if (e.newValue && !e.oldValue) {
                // Login detected
                handleLogin();
            } else if (!e.newValue && e.oldValue) {
                // Logout detected
                handleLogout();
            }
        }
    });

    console.log('[i18n] Auth event listeners registered');
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupAuthEventListeners();
        initializeI18next();
    });
} else {
    setupAuthEventListeners();
    initializeI18next();
}

/**
 * Export public API
 */
window.LaTandaI18n = {
    changeLanguage,
    getCurrentLanguage: () => i18next?.language || I18N_CONFIG.DEFAULT_LANGUAGE,
    isReady: () => typeof i18next !== 'undefined' && i18next.isInitialized,
    translate: (key, options) => i18next?.t(key, options),
    getUserLanguagePreference,
    invalidateCache: invalidateLanguageCache,
    config: I18N_CONFIG
};

console.log('[i18n] LaTandaI18n module loaded');
