/**
 * LA TANDA - API Client
 * Fetch wrapper with retry, timeout, and error handling
 * @version 1.0
 */

const LaTandaAPI = {
    baseURL: window.API_BASE_URL || "https://latanda.online",
    timeout: 10000,
    retries: 2,
    pendingRequests: new Map(),

    /**
     * Make API request with deduplication
     */
    async fetch(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const key = url + JSON.stringify(options);

        // Deduplicate concurrent requests
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }

        const promise = this._fetchWithRetry(url, options);
        this.pendingRequests.set(key, promise);

        try {
            return await promise;
        } finally {
            this.pendingRequests.delete(key);
        }
    },

    async _fetchWithRetry(url, options, attempt = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                "Authorization": "Bearer " + (localStorage.getItem("auth_token") || localStorage.getItem("authToken") || ""),
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }

            return await response.json();

        } catch (error) {
            clearTimeout(timeoutId);

            if (attempt < this.retries && error.name !== "AbortError") {
                await this._delay(1000 * (attempt + 1));
                return this._fetchWithRetry(url, options, attempt + 1);
            }

            return null;
        }
    },

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Convenience methods
    get(endpoint) {
        return this.fetch(endpoint, { method: "GET" });
    },

    post(endpoint, data) {
        return this.fetch(endpoint, {
            method: "POST",
            body: JSON.stringify(data)
        });
    }
};

window.LaTandaAPI = LaTandaAPI;
