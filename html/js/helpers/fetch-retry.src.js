/**
 * LA TANDA — Fetch Retry Helper v1.0
 * M16: fetchWithRetry with exponential backoff + AbortController timeout
 */
(function() {
    'use strict';

    /**
     * Fetch with automatic retry and timeout
     * @param {string} url
     * @param {object} options - standard fetch options + { maxRetries, timeout, retryOn }
     * @returns {Promise<Response>}
     */
    window.fetchWithRetry = function(url, options) {
        var opts = options || {};
        var maxRetries = opts.maxRetries != null ? opts.maxRetries : 2;
        var timeout = opts.timeout != null ? opts.timeout : 15000;
        // Only retry on network errors and 5xx, not on 4xx
        var retryOn = opts.retryOn || function(attempt, error, response) {
            if (error) return true; // network error
            if (response && response.status >= 500) return true; // server error
            return false;
        };

        function attempt(n) {
            // Create AbortController for timeout
            var controller = new AbortController();
            var timer = setTimeout(function() { controller.abort(); }, timeout);

            var fetchOpts = Object.assign({}, opts, { signal: controller.signal });
            // Clean custom props
            delete fetchOpts.maxRetries;
            delete fetchOpts.timeout;
            delete fetchOpts.retryOn;

            return fetch(url, fetchOpts).then(function(response) {
                clearTimeout(timer);
                if (n < maxRetries && retryOn(n, null, response)) {
                    return wait(n).then(function() { return attempt(n + 1); });
                }
                return response;
            }).catch(function(error) {
                clearTimeout(timer);
                if (n < maxRetries && retryOn(n, error, null)) {
                    return wait(n).then(function() { return attempt(n + 1); });
                }
                throw error;
            });
        }

        function wait(n) {
            // Exponential backoff: 1s, 2s, 4s... with jitter
            var delay = Math.min(1000 * Math.pow(2, n), 8000);
            delay += Math.random() * 500;
            return new Promise(function(resolve) { setTimeout(resolve, delay); });
        }

        return attempt(0);
    };

    /**
     * Convenience: JSON fetch with retry + auth token
     * @param {string} url
     * @param {object} options
     * @returns {Promise<object>} parsed JSON
     */
    window.ltFetch = function(url, options) {
        var opts = options || {};
        var token = null;
        try { token = localStorage.getItem('auth_token') || localStorage.getItem('authToken'); } catch(e) {}

        var headers = Object.assign({
            'Content-Type': 'application/json'
        }, opts.headers || {});

        if (token && !headers['Authorization']) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        return window.fetchWithRetry(url, Object.assign({}, opts, {
            headers: headers
        })).then(function(res) {
            if (res.status === 401) {
                // Token expired — redirect to login
                try { localStorage.removeItem('auth_token'); } catch(e) {}
                window.location.href = '/auth-enhanced.html';
                throw new Error('Session expired');
            }
            return res.json();
        });
    };
})();
