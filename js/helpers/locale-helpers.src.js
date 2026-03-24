/**
 * LA TANDA — Locale Helpers v1.0
 * M10: Locale-aware date/number/currency formatting
 * Uses browser locale with es-HN fallback
 */
(function() {
    'use strict';

    // Detect user locale: browser preference → es-HN fallback
    var userLocale = (navigator.languages && navigator.languages[0]) || navigator.language || 'es-HN';

    /**
     * Format a date string or Date object
     * @param {string|Date} date - ISO string or Date
     * @param {string} style - 'short' (19 mar), 'medium' (19 mar 2026), 'long' (19 de marzo de 2026), 'time' (3:45 PM)
     * @returns {string}
     */
    window.ltFormatDate = function(date, style) {
        if (!date) return '';
        var d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return String(date);

        var opts;
        switch (style) {
            case 'short':
                opts = { day: 'numeric', month: 'short' };
                break;
            case 'long':
                opts = { day: 'numeric', month: 'long', year: 'numeric' };
                break;
            case 'time':
                opts = { hour: 'numeric', minute: '2-digit', hour12: true };
                break;
            case 'datetime':
                opts = { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' };
                break;
            case 'relative':
                return _relativeTime(d);
            case 'medium':
            default:
                opts = { day: 'numeric', month: 'short', year: 'numeric' };
                break;
        }

        try {
            return d.toLocaleDateString(userLocale, opts);
        } catch(e) {
            return d.toLocaleDateString('es-HN', opts);
        }
    };

    /**
     * Format a number with locale-aware separators
     * @param {number} num
     * @param {number} decimals - min fraction digits (default 0)
     * @returns {string}
     */
    window.ltFormatNumber = function(num, decimals) {
        var n = parseFloat(num);
        if (!Number.isFinite(n)) return '0';
        var opts = decimals != null ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : {};
        try {
            return n.toLocaleString(userLocale, opts);
        } catch(e) {
            return n.toLocaleString('es-HN', opts);
        }
    };

    /**
     * Format currency (L. prefix for HNL)
     * @param {number} amount
     * @param {string} currency - 'HNL' (default), future: 'USD', 'GTQ', etc.
     * @returns {string}
     */
    window.ltFormatCurrency = function(amount, currency) {
        var n = parseFloat(amount);
        if (!Number.isFinite(n)) return 'L. 0.00';
        var code = currency || 'HNL';
        var prefix = code === 'HNL' ? 'L. ' : code === 'USD' ? '$ ' : code + ' ';
        try {
            return prefix + n.toLocaleString(userLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch(e) {
            return prefix + n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    };

    // Relative time helper (hace 5 min, hace 2 horas, etc.)
    function _relativeTime(d) {
        var now = Date.now();
        var diff = Math.floor((now - d.getTime()) / 1000);
        if (diff < 60) return 'Ahora';
        if (diff < 3600) return 'Hace ' + Math.floor(diff / 60) + ' min';
        if (diff < 86400) return 'Hace ' + Math.floor(diff / 3600) + 'h';
        if (diff < 604800) return 'Hace ' + Math.floor(diff / 86400) + 'd';
        return window.ltFormatDate(d, 'medium');
    }

    // Expose locale for debugging
    window._ltLocale = userLocale;
})();
