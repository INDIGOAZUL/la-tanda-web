/* ============================================
   🌍 LANGUAGE SWITCHER
   ============================================ */

const translations = {
    es: { welcome: 'Bienvenido', settings: 'Configuración', save: 'Guardar' },
    en: { welcome: 'Welcome', settings: 'Settings', save: 'Save' },
    en: { welcome: 'Willkommen', settings: 'Einstellungen', save: 'Speichern' }
};

function setLanguage(lang) {
    localStorage.setItem('language', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang]?.[key]) el.textContent = translations[lang][key];
    });
}

(function() {
    const saved = localStorage.getItem('language') || 'es';
    setLanguage(saved);
    
    // Add switcher to header
    const header = document.querySelector('.lt-header-right');
    if (header) {
        const langBtn = document.createElement('select');
        langBtn.innerHTML = '<option value="es">🇭🇳 ES</option><option value="en">🇺🇸 EN</option><option value="de">🇩🇪 DE</option>';
        langBtn.value = saved;
        langBtn.style.cssText = 'background:#1e293b;color:#fff;border:1px solid #334155;padding:4px 8px;border-radius:4px;cursor:pointer;';
        langBtn.onchange = (e) => setLanguage(e.target.value);
        header.appendChild(langBtn);
    }
})();
