/**
 * LA TANDA - Event Bus
 * Simple PubSub for component communication
 * @version 1.0
 */

const LaTandaEvents = {
    subscribers: new Map(),

    /**
     * Subscribe to an event
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }
        this.subscribers.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    },

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        const subs = this.subscribers.get(event);
        if (subs) {
            subs.delete(callback);
        }
    },

    /**
     * Emit an event with data
     */
    emit(event, data) {
        const subs = this.subscribers.get(event);
        if (subs) {
            subs.forEach(cb => {
                try {
                    cb(data);
                } catch (err) {
                    console.error("[EventBus] Error in subscriber:", event, err);
                }
            });
        }
    },

    /**
     * Subscribe once - auto-unsubscribe after first call
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        return this.on(event, wrapper);
    },

    /**
     * Clear all subscribers for an event
     */
    clear(event) {
        if (event) {
            this.subscribers.delete(event);
        } else {
            this.subscribers.clear();
        }
    }
};

window.LaTandaEvents = LaTandaEvents;
