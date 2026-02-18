/**
 * ============================================
 * LA TANDA - USER SYNC SERVICE
 * Centralized user data management
 * Version: 1.0
 * ============================================
 *
 * This file provides a single source of truth for user data
 * across all pages in the La Tanda system.
 *
 * Usage:
 *   - Include this script in all pages BEFORE other scripts
 *   - Use LaTandaUser.get() to get user data
 *   - Use LaTandaUser.update(data) to update user data
 *   - Use LaTandaUser.sync() to sync with API
 */

(function(window) {
    'use strict';

    const STORAGE_KEY = 'latanda_user';
    const API_BASE = 'https://latanda.online';

    // Legacy keys to check (for backwards compatibility)
    const LEGACY_KEYS = ['user_id', 'latanda_user_id', 'userId', 'latanda_user_data'];

    const LaTandaUser = {
        _data: null,
        _listeners: [],

        /**
         * Initialize - call on page load
         */
        init: function() {
            this._loadFromStorage();
            this._migrateLegacyKeys();
            return this;
        },

        /**
         * Get user data or specific property
         * @param {string} key - Optional property name
         * @returns {any} User data or property value
         */
        get: function(key) {
            if (!this._data) {
                this._loadFromStorage();
            }
            if (key) {
                return this._data ? this._data[key] : null;
            }
            return this._data;
        },

        /**
         * Get user ID (convenience method)
         * @returns {string|null} User ID
         */
        getId: function() {
            return this.get('id') || this.get('user_id') || null;
        },

        /**
         * Check if user is logged in
         * @returns {boolean}
         */
        isLoggedIn: function() {
            const id = this.getId();
            return id && !id.startsWith('demo_user_');
        },

        /**
         * Update user data locally
         * @param {object} data - Data to merge
         */
        update: function(data) {
            if (!this._data) {
                this._data = {};
            }
            Object.assign(this._data, data);
            this._saveToStorage();
            this._notifyListeners();
        },

        /**
         * Sync user data with API
         * @returns {Promise<object>} Updated user data
         */
        sync: async function() {
            const userId = this.getId();
            if (!userId) {
                return null;
            }

            try {
                const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE}/api/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();

                if (result.success && result.user) {
                    // Merge API data with existing local data
                    this.update({
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email,
                        phone: result.user.phone || '',
                        location: result.user.location || '',
                        bio: result.user.bio || '',
                        avatar_url: result.user.avatar_url || '',
                        created_at: result.user.created_at,
                        last_login: result.user.last_login
                    });
                    return this._data;
                }
            } catch (error) {
            }
            return this._data;
        },

        /**
         * Save changes to API
         * @param {object} data - Data to save
         * @returns {Promise<boolean>} Success
         */
        save: async function(data) {
            const userId = this.getId();
            if (!userId) {
                return false;
            }

            try {
                const response = await fetch(`${API_BASE}/api/user/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (result.success) {
                    this.update(result.user);
                    return true;
                }
            } catch (error) {
            }
            return false;
        },

        /**
         * Clear user data (logout)
         */
        clear: function() {
            this._data = null;
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);
            // Clear legacy keys
            LEGACY_KEYS.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            localStorage.removeItem('auth_token');
            this._notifyListeners();
        },

        /**
         * Add listener for user data changes
         * @param {function} callback
         */
        onChange: function(callback) {
            if (typeof callback === 'function') {
                this._listeners.push(callback);
            }
        },

        /**
         * Get user initials for avatar
         * @returns {string}
         */
        getInitials: function() {
            const name = this.get('name');
            if (!name) return '--';
            const parts = name.trim().split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        },

        // Private methods
        _loadFromStorage: function() {
            const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    this._data = JSON.parse(stored);
                    // Detect and reject demo users
                    if (this._data.id && this._data.id.startsWith('demo_user_')) {
                        this.clear();
                        return;
                    }
                } catch (e) {
                    this._data = null;
                }
            }
        },

        _saveToStorage: function() {
            if (this._data) {
                const json = JSON.stringify(this._data);
                localStorage.setItem(STORAGE_KEY, json);
                // Also set legacy key for backwards compatibility
                if (this._data.id) {
                    localStorage.setItem('user_id', this._data.id);
                }
            }
        },

        _migrateLegacyKeys: function() {
            // If we don't have data, try to load from legacy keys
            if (!this._data || !this._data.id) {
                for (const key of LEGACY_KEYS) {
                    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
                    if (value) {
                        try {
                            const parsed = JSON.parse(value);
                            if (parsed && (parsed.id || parsed.user_id)) {
                                this._data = {
                                    id: parsed.id || parsed.user_id,
                                    name: parsed.name,
                                    email: parsed.email
                                };
                                this._saveToStorage();
                                break;
                            }
                        } catch (e) {
                            // If it's just an ID string
                            if (value && !value.startsWith('{')) {
                                this._data = { id: value };
                                this._saveToStorage();
                                break;
                            }
                        }
                    }
                }
            }
        },

        _notifyListeners: function() {
            this._listeners.forEach(cb => {
                try {
                    cb(this._data);
                } catch (e) {
                }
            });
        }
    };

    // Initialize on load
    LaTandaUser.init();

    // Expose globally
    window.LaTandaUser = LaTandaUser;

    // Also expose as module if supported
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LaTandaUser;
    }

})(window);
