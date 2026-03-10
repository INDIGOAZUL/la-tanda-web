(function () {
    'use strict';

    var KEY = 'lt_role_app_badge_count';
    var EVENT = 'lt-role-app-badge';

    function parseCount(raw) {
        var n = parseInt(raw, 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }

    function applyBadge(count) {
        var badge = document.getElementById('roleApplicationBadge');
        if (!badge) return;

        if (count > 0) {
            badge.style.display = 'inline-flex';
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.setAttribute('aria-label', count + ' aplicaciones pendientes de rol');
        } else {
            badge.style.display = 'none';
            badge.textContent = '0';
            badge.removeAttribute('aria-label');
        }
    }

    function syncFromStorage() {
        applyBadge(parseCount(localStorage.getItem(KEY)));
    }

    window.addEventListener('storage', function (event) {
        if (event.key === KEY) {
            applyBadge(parseCount(event.newValue));
        }
    });

    window.addEventListener(EVENT, function (event) {
        var nextCount = event && event.detail ? event.detail.count : 0;
        applyBadge(parseCount(nextCount));
    });

    window.updateRoleApplicationBadge = function (nextCount) {
        var count = parseCount(nextCount);
        localStorage.setItem(KEY, String(count));
        applyBadge(count);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncFromStorage);
    } else {
        syncFromStorage();
    }
})();
