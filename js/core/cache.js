/**
 * LA TANDA - Cache Manager
 * In-memory cache with TTL
 * @version 1.0
 */

const LaTandaCache = {
    storage: new Map(),
    
    // Default TTL values (in ms)
    defaultTTL: {
        balance: 30 * 1000,         // 30 seconds
        notifications: 60 * 1000,   // 60 seconds
        user: 5 * 60 * 1000,        // 5 minutes
        rates: 5 * 60 * 1000,       // 5 minutes
        static: 60 * 60 * 1000      // 1 hour
    },

    /**
     * Get cached value if not expired
     */
    get(key) {
        const item = this.storage.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.storage.delete(key);
            return null;
        }
        
        return item.data;
    },

    /**
     * Set value with TTL
     */
    set(key, data, ttl) {
        const duration = ttl || this.defaultTTL[key] || 30000;
        this.storage.set(key, {
            data: data,
            expires: Date.now() + duration,
            created: Date.now()
        });
    },

    /**
     * Check if key exists and is valid
     */
    has(key) {
        return this.get(key) !== null;
    },

    /**
     * Delete a specific key
     */
    delete(key) {
        this.storage.delete(key);
    },

    /**
     * Clear all cache or specific pattern
     */
    clear(pattern) {
        if (!pattern) {
            this.storage.clear();
            return;
        }

        // Clear keys matching pattern
        for (const key of this.storage.keys()) {
            if (key.includes(pattern)) {
                this.storage.delete(key);
            }
        }
    },

    /**
     * Get remaining TTL for a key
     */
    ttl(key) {
        const item = this.storage.get(key);
        if (!item) return 0;
        const remaining = item.expires - Date.now();
        return remaining > 0 ? remaining : 0;
    },

    /**
     * Get cache stats
     */
    stats() {
        return {
            size: this.storage.size,
            keys: Array.from(this.storage.keys())
        };
    }
};

window.LaTandaCache = LaTandaCache;
