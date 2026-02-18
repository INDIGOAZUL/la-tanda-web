/**
 * Tanda Event Bus - Cross-Page Data Synchronization
 * Version: 1.0.0
 *
 * Provides real-time sync of tanda data across all pages using:
 * - localStorage events (cross-tab communication)
 * - Custom DOM events (same-page communication)
 * - Centralized state management
 */

class TandaEventBus {
    constructor() {
        this.API_BASE = 'https://latanda.online';
        this.events = new EventTarget();
        this.cache = {
            tandas: null,
            count: 0,
            lastFetch: null,
            ttl: 30000 // 30 seconds cache TTL
        };

        this.init();
        console.log('🚀 TandaEventBus initialized');
    }

    init() {
        // Listen for localStorage changes (cross-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'tanda_sync_event') {
                const event = JSON.parse(e.newValue);
                this.handleSyncEvent(event);
            }
        });

        // Listen for same-page custom events
        window.addEventListener('tandaCreated', (e) => this.onTandaCreated(e.detail));
        window.addEventListener('tandaUpdated', (e) => this.onTandaUpdated(e.detail));
        window.addEventListener('tandaDeleted', (e) => this.onTandaDeleted(e.detail));
    }

    /**
     * Broadcast event to all tabs/windows
     */
    broadcast(eventType, data) {
        const event = {
            type: eventType,
            data: data,
            timestamp: Date.now()
        };

        // Cross-tab sync via localStorage
        localStorage.setItem('tanda_sync_event', JSON.stringify(event));

        // Same-page sync via DOM events
        window.dispatchEvent(new CustomEvent(eventType, { detail: data }));

        console.log(`📡 [TandaEventBus] Broadcast: ${eventType}`, data);
    }

    /**
     * Handle sync events from other tabs
     */
    handleSyncEvent(event) {
        console.log(`📥 [TandaEventBus] Received: ${event.type}`, event.data);

        switch (event.type) {
            case 'tandaCreated':
                this.onTandaCreated(event.data);
                break;
            case 'tandaUpdated':
                this.onTandaUpdated(event.data);
                break;
            case 'tandaDeleted':
                this.onTandaDeleted(event.data);
                break;
            case 'tandasRefreshed':
                this.onTandasRefreshed(event.data);
                break;
        }
    }

    /**
     * Fetch tandas from API with caching
     */
    async fetchTandas(userId, forceRefresh = false) {
        const now = Date.now();

        // Return cache if valid and not forcing refresh
        if (!forceRefresh && this.cache.tandas && this.cache.lastFetch) {
            const age = now - this.cache.lastFetch;
            if (age < this.cache.ttl) {
                console.log(`💾 [TandaEventBus] Using cached data (age: ${age}ms)`);
                return this.cache.tandas;
            }
        }

        try {
            console.log(`📡 [TandaEventBus] Fetching tandas for user: ${userId}`);

            const response = await fetch(
                `${this.API_BASE}/api/tandas/my-tandas?user_id=${userId}`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = await response.json();

            if (result.success && result.data) {
                this.cache.tandas = result.data.tandas || [];
                this.cache.count = result.data.total || this.cache.tandas.length;
                this.cache.lastFetch = now;

                console.log(`✅ [TandaEventBus] Fetched ${this.cache.count} tandas`);

                // Broadcast refresh event
                this.broadcast('tandasRefreshed', {
                    tandas: this.cache.tandas,
                    count: this.cache.count
                });

                return this.cache.tandas;
            }

            throw new Error('Invalid API response');
        } catch (error) {
            console.error('❌ [TandaEventBus] Fetch failed:', error);
            return this.cache.tandas || [];
        }
    }

    /**
     * Get current tanda count (with cache)
     */
    async getCount(userId, forceRefresh = false) {
        if (!forceRefresh && this.cache.count !== null) {
            const age = Date.now() - (this.cache.lastFetch || 0);
            if (age < this.cache.ttl) {
                return this.cache.count;
            }
        }

        await this.fetchTandas(userId, forceRefresh);
        return this.cache.count;
    }

    /**
     * Event handlers
     */
    onTandaCreated(data) {
        console.log('✨ [TandaEventBus] Tanda created:', data);
        this.cache.count++;
        this.updateAllBadges(this.cache.count);
        this.invalidateCache();
    }

    onTandaUpdated(data) {
        console.log('🔄 [TandaEventBus] Tanda updated:', data);
        this.invalidateCache();
    }

    onTandaDeleted(data) {
        console.log('🗑️ [TandaEventBus] Tanda deleted:', data);
        if (this.cache.count > 0) {
            this.cache.count--;
        }
        this.updateAllBadges(this.cache.count);
        this.invalidateCache();
    }

    onTandasRefreshed(data) {
        console.log('🔄 [TandaEventBus] Tandas refreshed:', data);
        this.cache.tandas = data.tandas;
        this.cache.count = data.count;
        this.updateAllBadges(data.count);
    }

    /**
     * Update all badge elements on page
     */
    updateAllBadges(count) {
        const badges = document.querySelectorAll('.tandas-badge, #tandasBadge, [data-tanda-count]');
        badges.forEach(badge => {
            badge.textContent = count || '0';
            badge.style.display = count > 0 ? '' : 'none';
        });
        console.log(`🔢 [TandaEventBus] Updated ${badges.length} badges to: ${count}`);
    }

    /**
     * Invalidate cache
     */
    invalidateCache() {
        this.cache.lastFetch = null;
        console.log('♻️ [TandaEventBus] Cache invalidated');
    }

    /**
     * Subscribe to tanda events
     */
    on(eventType, callback) {
        window.addEventListener(eventType, (e) => callback(e.detail));
    }
}

// Global instance
window.tandaEventBus = new TandaEventBus();

console.log('✅ TandaEventBus loaded and ready!');
