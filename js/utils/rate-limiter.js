/**
 * Rate Limiting Utility for La Tanda Platform
 *
 * Prevents API rate limit errors (429) by:
 * - Implementing exponential backoff for failed requests
 * - Queuing requests to prevent overwhelming the server
 * - Debouncing high-frequency calls
 * - Caching responses to reduce API calls
 *
 * Usage:
 *   const rateLimiter = new RateLimiter({ maxRetries: 3, baseDelay: 1000 });
 *   const data = await rateLimiter.fetch('/api/endpoint', options);
 */

class RateLimiter {
    constructor(config = {}) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            baseDelay: config.baseDelay || 1000,  // 1 second
            maxDelay: config.maxDelay || 30000,   // 30 seconds
            maxQueueSize: config.maxQueueSize || 50,
            cacheTTL: config.cacheTTL || 60000,   // 1 minute
            ...config
        };

        this.requestQueue = [];
        this.processing = false;
        this.cache = new Map();
        this.debounceTimers = new Map();
    }

    /**
     * Exponential backoff calculation
     * @param {number} attempt - Current retry attempt (0-indexed)
     * @returns {number} Delay in milliseconds
     */
    calculateBackoff(attempt) {
        const delay = Math.min(
            this.config.baseDelay * Math.pow(2, attempt),
            this.config.maxDelay
        );
        // Add jitter to prevent thundering herd
        return delay + (Math.random() * 1000);
    }

    /**
     * Fetch with automatic retry and exponential backoff
     * @param {string} url - API endpoint
     * @param {object} options - Fetch options
     * @param {number} attempt - Current attempt number
     * @returns {Promise} Response data
     */
    async fetchWithRetry(url, options = {}, attempt = 0) {
        try {
            const response = await fetch(url, options);

            // Handle rate limiting (429)
            if (response.status === 429) {
                if (attempt >= this.config.maxRetries) {
                    throw new Error(`Rate limit exceeded after ${attempt} retries`);
                }

                const retryAfter = response.headers.get('Retry-After');
                const delay = retryAfter
                    ? parseInt(retryAfter) * 1000
                    : this.calculateBackoff(attempt);

                console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`);

                await this.sleep(delay);
                return this.fetchWithRetry(url, options, attempt + 1);
            }

            // Handle other errors with exponential backoff
            if (!response.ok && attempt < this.config.maxRetries) {
                const delay = this.calculateBackoff(attempt);
                console.warn(`Request failed (${response.status}). Retrying in ${delay}ms`);
                await this.sleep(delay);
                return this.fetchWithRetry(url, options, attempt + 1);
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            if (attempt >= this.config.maxRetries) {
                console.error(`Request failed after ${attempt} retries:`, error);
                throw error;
            }

            const delay = this.calculateBackoff(attempt);
            console.warn(`Network error. Retrying in ${delay}ms`);
            await this.sleep(delay);
            return this.fetchWithRetry(url, options, attempt + 1);
        }
    }

    /**
     * Fetch with caching
     * @param {string} url - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise} Cached or fresh data
     */
    async fetchWithCache(url, options = {}) {
        const cacheKey = `${url}-${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
            return cached.data;
        }

        const data = await this.fetchWithRetry(url, options);

        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    /**
     * Add request to queue
     * @param {Function} requestFn - Function that returns a Promise
     * @returns {Promise} Queued request result
     */
    enqueue(requestFn) {
        return new Promise((resolve, reject) => {
            if (this.requestQueue.length >= this.config.maxQueueSize) {
                reject(new Error('Request queue full'));
                return;
            }

            this.requestQueue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Process queued requests one at a time
     */
    async processQueue() {
        if (this.processing || this.requestQueue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.requestQueue.length > 0) {
            const { requestFn, resolve, reject } = this.requestQueue.shift();

            try {
                const result = await requestFn();
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // Small delay between requests to prevent rate limiting
            await this.sleep(100);
        }

        this.processing = false;
    }

    /**
     * Debounce function calls
     * @param {string} key - Unique identifier for the debounced function
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Debounce delay in milliseconds
     */
    debounce(key, fn, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        const timer = setTimeout(() => {
            fn();
            this.debounceTimers.delete(key);
        }, delay);

        this.debounceTimers.set(key, timer);
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {object} Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateLimiter;
}

// Make available globally
window.RateLimiter = RateLimiter;

