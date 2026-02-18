/**
 * 🌐 SISTEMA DE TRADUCCIÓN PARA LA TANDA CHAIN
 * Solución híbrida: Archivos estáticos + API externa para contenido dinámico
 */

class LaTandaTranslationSystem {
    constructor() {
        this.currentLanguage = 'es'; // Español por defecto
        this.fallbackLanguage = 'es';
        this.apiProvider = 'google'; // google, azure, aws
        this.translations = {};
        this.supportedLanguages = {
            'es': { name: 'Español', flag: '🇪🇸', rtl: false },
            'en': { name: 'English', flag: '🇺🇸', rtl: false },
            'pt': { name: 'Português', flag: '🇧🇷', rtl: false },
            'fr': { name: 'Français', flag: '🇫🇷', rtl: false },
            'zh': { name: '中文', flag: '🇨🇳', rtl: false },
            'ar': { name: 'العربية', flag: '🇸🇦', rtl: true }
        };
        
        this.init();
    }

    async init() {
        console.log('🌐 Initializing La Tanda Translation System...');
        
        // Detectar idioma del navegador
        this.detectBrowserLanguage();
        
        // Cargar traducciones estáticas
        await this.loadStaticTranslations();
        
        // Aplicar traducciones a la página
        this.applyTranslations();
        
        console.log('✅ Translation system ready!');
    }

    detectBrowserLanguage() {
        const browserLang = navigator.language.split('-')[0];
        if (this.supportedLanguages[browserLang]) {
            this.currentLanguage = browserLang;
        }
        
        // Verificar localStorage
        const savedLang = localStorage.getItem('latanda_language');
        if (savedLang && this.supportedLanguages[savedLang]) {
            this.currentLanguage = savedLang;
        }
        
        console.log('🌍 Language detected:', this.currentLanguage);
    }

    async loadStaticTranslations() {
        try {
            const response = await fetch(`/translations/${this.currentLanguage}.json`);
            if (response.ok) {
                this.translations = await response.json();
                console.log('📚 Static translations loaded');
            } else {
                console.warn('⚠️ Falling back to Spanish translations');
                const fallbackResponse = await fetch(`/translations/${this.fallbackLanguage}.json`);
                this.translations = await fallbackResponse.json();
            }
        } catch (error) {
            console.error('❌ Error loading translations:', error);
            this.translations = this.getDefaultTranslations();
        }
    }

    // ============================================
    // TRADUCCIÓN ESTÁTICA (Archivos JSON)
    // ============================================
    
    translate(key, params = {}) {
        let translation = this.getNestedTranslation(key);
        
        if (!translation) {
            console.warn(`⚠️ Missing translation for: ${key}`);
            return key;
        }

        // Reemplazar parámetros
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{{${param}}}`, params[param]);
        });

        return translation;
    }

    getNestedTranslation(key) {
        const keys = key.split('.');
        let translation = this.translations;
        
        for (const k of keys) {
            if (translation && typeof translation === 'object' && k in translation) {
                translation = translation[k];
            } else {
                return null;
            }
        }
        
        return translation;
    }

    // ============================================
    // TRADUCCIÓN DINÁMICA (API Externa)
    // ============================================
    
    async translateText(text, targetLanguage = null) {
        const target = targetLanguage || this.currentLanguage;
        
        // Si ya está en el idioma objetivo, no traducir
        if (target === 'es' && this.isSpanish(text)) {
            return text;
        }

        try {
            // Cache check
            const cacheKey = `${text}_${target}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            let translatedText;
            
            switch (this.apiProvider) {
                case 'google':
                    translatedText = await this.googleTranslate(text, target);
                    break;
                case 'azure':
                    translatedText = await this.azureTranslate(text, target);
                    break;
                case 'aws':
                    translatedText = await this.awsTranslate(text, target);
                    break;
                default:
                    translatedText = text;
            }

            // Cache result
            this.saveToCache(cacheKey, translatedText);
            return translatedText;

        } catch (error) {
            console.error('❌ Translation API error:', error);
            return text; // Fallback to original text
        }
    }

    async googleTranslate(text, targetLanguage) {
        const API_KEY = this.getAPIKey('google');
        const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                target: targetLanguage,
                source: 'auto'
            })
        });

        const data = await response.json();
        return data.data.translations[0].translatedText;
    }

    async azureTranslate(text, targetLanguage) {
        const API_KEY = this.getAPIKey('azure');
        const region = 'eastus'; // Configure your region
        
        const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLanguage}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': API_KEY,
                'Ocp-Apim-Subscription-Region': region,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([{ text: text }])
        });

        const data = await response.json();
        return data[0].translations[0].text;
    }

    // ============================================
    // APLICAR TRADUCCIONES A LA UI
    // ============================================
    
    applyTranslations() {
        // Traducir elementos con atributo data-translate
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'button') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Aplicar RTL si es necesario
        const langConfig = this.supportedLanguages[this.currentLanguage];
        if (langConfig.rtl) {
            document.documentElement.dir = 'rtl';
            document.body.classList.add('rtl-layout');
        } else {
            document.documentElement.dir = 'ltr';
            document.body.classList.remove('rtl-layout');
        }
    }

    // ============================================
    // CAMBIO DE IDIOMA
    // ============================================
    
    async changeLanguage(newLanguage) {
        if (!this.supportedLanguages[newLanguage]) {
            console.warn(`⚠️ Unsupported language: ${newLanguage}`);
            return;
        }

        console.log(`🔄 Changing language to: ${newLanguage}`);
        
        this.currentLanguage = newLanguage;
        localStorage.setItem('latanda_language', newLanguage);
        
        // Recargar traducciones
        await this.loadStaticTranslations();
        this.applyTranslations();
        
        // Actualizar selector de idioma
        this.updateLanguageSelector();
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: newLanguage }
        }));

        console.log('✅ Language changed successfully');
    }

    // ============================================
    // UI HELPERS
    // ============================================
    
    createLanguageSelector() {
        const selector = document.createElement('div');
        selector.className = 'language-selector';
        selector.innerHTML = `
            <div class="language-dropdown">
                <button class="language-btn" onclick="translationSystem.toggleLanguageMenu()">
                    <span class="current-flag">${this.supportedLanguages[this.currentLanguage].flag}</span>
                    <span class="current-lang">${this.supportedLanguages[this.currentLanguage].name}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="language-menu" id="languageMenu">
                    ${Object.entries(this.supportedLanguages).map(([code, config]) => `
                        <div class="language-option" onclick="translationSystem.changeLanguage('${code}')">
                            <span class="lang-flag">${config.flag}</span>
                            <span class="lang-name">${config.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        return selector;
    }

    toggleLanguageMenu() {
        const menu = document.getElementById('languageMenu');
        menu.classList.toggle('show');
    }

    // ============================================
    // UTILIDADES
    // ============================================
    
    getAPIKey(provider) {
        // En producción, estas claves deben estar en variables de entorno
        const keys = {
            google: localStorage.getItem('google_translate_api_key') || 'YOUR_GOOGLE_API_KEY',
            azure: localStorage.getItem('azure_translate_api_key') || 'YOUR_AZURE_API_KEY',
            aws: localStorage.getItem('aws_translate_api_key') || 'YOUR_AWS_API_KEY'
        };
        
        return keys[provider];
    }

    isSpanish(text) {
        // Simple heuristic to detect Spanish text
        const spanishWords = ['el', 'la', 'de', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'del', 'los', 'las', 'que', 'pero'];
        const words = text.toLowerCase().split(/\s+/);
        const spanishWordCount = words.filter(word => spanishWords.includes(word)).length;
        return spanishWordCount / words.length > 0.3;
    }

    getFromCache(key) {
        const cache = JSON.parse(localStorage.getItem('translation_cache') || '{}');
        const entry = cache[key];
        
        if (entry && Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
            return entry.value;
        }
        
        return null;
    }

    saveToCache(key, value) {
        const cache = JSON.parse(localStorage.getItem('translation_cache') || '{}');
        cache[key] = {
            value: value,
            timestamp: Date.now()
        };
        
        // Mantener solo las últimas 1000 traducciones
        const entries = Object.entries(cache);
        if (entries.length > 1000) {
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const newCache = {};
            entries.slice(-1000).forEach(([k, v]) => {
                newCache[k] = v;
            });
            localStorage.setItem('translation_cache', JSON.stringify(newCache));
        } else {
            localStorage.setItem('translation_cache', JSON.stringify(cache));
        }
    }

    getDefaultTranslations() {
        return {
            nav: {
                dashboard: "Dashboard",
                groups: "Grupos",
                wallet: "Billetera",
                marketplace: "Mercado"
            },
            buttons: {
                create: "Crear",
                join: "Unirse",
                save: "Guardar",
                cancel: "Cancelar"
            },
            messages: {
                welcome: "Bienvenido a La Tanda Chain",
                loading: "Cargando...",
                error: "Error"
            }
        };
    }

    // ============================================
    // MISSING FUNCTIONS REQUIRED BY COMPONENTS
    // ============================================

    setupLanguageSelector() {
        console.log('🔧 Setting up language selector...');
        
        // Create language selector if it doesn't exist
        let selector = document.getElementById('language-selector');
        if (!selector) {
            selector = document.createElement('select');
            selector.id = 'language-selector';
            selector.className = 'language-selector';
            
            // Add to header if exists
            const header = document.querySelector('header, .header, .nav, .navbar');
            if (header) {
                header.appendChild(selector);
            }
        }
        
        // Clear and populate selector
        selector.innerHTML = '';
        Object.keys(this.supportedLanguages).forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = `${this.supportedLanguages[lang].flag} ${this.supportedLanguages[lang].name}`;
            option.selected = lang === this.currentLanguage;
            selector.appendChild(option);
        });
        
        // Add change event listener
        selector.addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });
        
        console.log('✅ Language selector setup complete');
    }

    translatePage() {
        console.log('🔄 Translating page...');
        this.applyTranslations();
        console.log('✅ Page translation complete');
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

// Crear instancia global
window.translationSystem = new LaTandaTranslationSystem();

// Funciones globales para uso en HTML
window.t = (key, params) => window.translationSystem.translate(key, params);
window.translateText = (text, lang) => window.translationSystem.translateText(text, lang);

console.log('🌐 La Tanda Translation System loaded!');