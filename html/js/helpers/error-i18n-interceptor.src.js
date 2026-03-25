/**
 * LA TANDA — Error i18n Interceptor v1.0
 * Phase 4: Maps API error_code to translated string via t()
 * Patches window.fetch to auto-translate error responses
 */
(function() {
    'use strict';
    if (window._errorI18nPatched) return;
    window._errorI18nPatched = true;

    // Translate an API error response object in-place
    window._translateApiError = function(data) {
        if (!data || !data.data || !data.data.error) return data;
        var err = data.data.error;
        if (err.error_code && typeof window.t === 'function') {
            var translated = window.t('errors.' + err.error_code, { defaultValue: '' });
            if (translated && translated !== 'errors.' + err.error_code) {
                err.message = translated;
            }
        }
        return data;
    };
})();
