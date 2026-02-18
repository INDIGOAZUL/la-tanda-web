/**
 * LA TANDA - Sidebar Widgets
 * Dynamic "Who to Follow" and "Trending" widgets
 * Version: 1.2.0
 * Added: 2026-01-26
 */

const SidebarWidgets = {
    // Default trending topics (fallback when API is unavailable)
    defaultTrending: [
        { category: 'Predicciones', topic: '#Predictor', count: 0, tab: 'loteria' },
        { category: 'General', topic: '#LaTanda', count: 0, tab: 'todos' },
        { category: 'Entretenimiento', topic: '#LoteriaTanda', count: 0, tab: 'loteria' }
    ],

    async init() {
await Promise.all([
            this.loadSuggestions(),
            this.loadTrending()
        ]);
},

    async loadSuggestions() {
        const container = document.getElementById('whoToFollowList');
        if (!container) return;

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch('/api/feed/social/suggestions?limit=3', { headers });
            const data = await response.json();

            if (data.success && data.data.suggestions.length > 0) {
                this.renderSuggestions(container, data.data.suggestions);
            } else {
}
        } catch (error) {
        }
    },

    renderSuggestions(container, suggestions) {
        container.innerHTML = suggestions.map(user => `
            <div class="who-to-follow-item" data-user-id="${this.escapeHtml(user.id)}">
                <div class="who-to-follow-avatar" ${user.avatar_url && this.safeAvatarUrl(user.avatar_url) ? `style="background-image:url('${this.safeAvatarUrl(user.avatar_url)}');background-size:cover;background-position:center;"` : ''}>
                    ${user.avatar_url && this.safeAvatarUrl(user.avatar_url) ? '' : this.escapeHtml(user.initials)}
                </div>
                <div class="who-to-follow-info">
                    <div class="who-to-follow-name">
                        ${this.escapeHtml(user.name)}
                        ${user.verified ? '<i class="fas fa-check-circle" style="color:#00FFFF;font-size:12px;margin-left:4px;"></i>' : ''}
                    </div>
                    <div class="who-to-follow-handle">${this.escapeHtml(user.handle)}</div>
                </div>
                <button class="who-to-follow-btn" onclick="SidebarWidgets.toggleFollow('${this.escapeHtml(user.id)}', this)">
                    Seguir
                </button>
            </div>
        `).join('');
    },

    async toggleFollow(userId, button) {
        if (button.classList.contains('following')) {
            this.unfollowUser(userId, button);
        } else {
            this.followUser(userId, button);
        }
    },

    async followUser(userId, button) {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) {
            window.LaTandaPopup?.showInfo('Inicia sesion para seguir usuarios');
            return;
        }

        button.disabled = true;

        try {
            const response = await fetch(`/api/feed/social/follow/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                button.textContent = 'Siguiendo';
                button.classList.add('following');
                button.setAttribute('onclick', `SidebarWidgets.toggleFollow('${userId}', this)`);
                window.LaTandaPopup?.showSuccess('Usuario seguido');
            } else {
                window.LaTandaPopup?.showError(data.message || 'Error al seguir');
            }
        } catch (error) {
            window.LaTandaPopup?.showError('Error de conexion');
        }

        button.disabled = false;
    },

    async unfollowUser(userId, button) {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;

        button.disabled = true;

        try {
            const response = await fetch(`/api/feed/social/follow/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                button.textContent = 'Seguir';
                button.classList.remove('following');
                button.setAttribute('onclick', `SidebarWidgets.toggleFollow('${userId}', this)`);
                window.LaTandaPopup?.showSuccess('Dejaste de seguir');
            } else {
                window.LaTandaPopup?.showError(data.message || 'Error');
            }
        } catch (error) {
            window.LaTandaPopup?.showError('Error de conexion');
        }

        button.disabled = false;
    },

    async loadOneSuggestion() {
        const container = document.getElementById('whoToFollowList');
        if (!container) return;

        const currentCount = container.querySelectorAll('.who-to-follow-item').length;
        if (currentCount >= 3) return;

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Get existing user IDs to exclude
            const existingIds = Array.from(container.querySelectorAll('.who-to-follow-item'))
                .map(el => el.dataset.userId);

            const response = await fetch('/api/feed/social/suggestions?limit=5', { headers });
            const data = await response.json();

            if (data.success && data.data.suggestions.length > 0) {
                // Find a user not already in the list
                const newUser = data.data.suggestions.find(u => !existingIds.includes(u.id));
                if (newUser) {
                    const html = `
                        <div class="who-to-follow-item" data-user-id="${this.escapeHtml(newUser.id)}" style="opacity:0;transform:translateX(-20px);">
                            <div class="who-to-follow-avatar" ${newUser.avatar_url && this.safeAvatarUrl(newUser.avatar_url) ? `style="background-image:url('${this.safeAvatarUrl(newUser.avatar_url)}');background-size:cover;background-position:center;"` : ''}>
                                ${newUser.avatar_url && this.safeAvatarUrl(newUser.avatar_url) ? '' : this.escapeHtml(newUser.initials)}
                            </div>
                            <div class="who-to-follow-info">
                                <div class="who-to-follow-name">
                                    ${this.escapeHtml(newUser.name)}
                                    ${newUser.verified ? '<i class="fas fa-check-circle" style="color:#00FFFF;font-size:12px;margin-left:4px;"></i>' : ''}
                                </div>
                                <div class="who-to-follow-handle">${this.escapeHtml(newUser.handle)}</div>
                            </div>
                            <button class="who-to-follow-btn" onclick="SidebarWidgets.toggleFollow('${this.escapeHtml(newUser.id)}', this)">
                                Seguir
                            </button>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', html);

                    // Animate in
                    requestAnimationFrame(() => {
                        const newItem = container.lastElementChild;
                        newItem.style.transition = 'all 0.3s ease';
                        newItem.style.opacity = '1';
                        newItem.style.transform = 'translateX(0)';
                    });
                }
            }
        } catch (error) {
        }
    },

    async loadTrending() {
        const container = document.getElementById('trendingList');
        if (!container) return;

        try {
            const response = await fetch('/api/feed/social/trending?limit=10');
            const data = await response.json();

            if (data.success && data.data.topics && data.data.topics.length > 0) {
                this.renderTrending(container, data.data.topics.slice(0, 3));
            } else {
                this.renderTrending(container, this.defaultTrending);
            }
        } catch (error) {
            this.renderTrending(container, this.defaultTrending);
        }
    },

    renderTrending(container, topics) {
        container.innerHTML = topics.map(topic => `
            <div class="trending-item" data-tab="${this.escapeHtml(topic.tab)}">
                <div class="trending-category">${this.escapeHtml(topic.category)} · Trending</div>
                <div class="trending-topic">${this.escapeHtml(topic.topic)}</div>
                ${topic.count > 0 ? `<div class="trending-count">${topic.count} publicaciones</div>` : ''}
            </div>
        `).join('');
    },

    goToTab(tabName) {
        const tab = document.querySelector(`.feed-tab[data-tab="${tabName}"]`);
        if (tab) {
            tab.click();
            // Scroll to feed
            const feed = document.getElementById('socialFeedContainer');
            if (feed) {
                feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    // Sanitize avatar URL - only allow https:// or /uploads/ paths (v3.96.0 - M5)
    safeAvatarUrl(url) {
        if (!url) return '';
        const clean = String(url).replace(/[^a-zA-Z0-9/._\-:?=&%]/g, '');
        if (clean.startsWith('https://') || clean.startsWith('/uploads/')) return this.escapeHtml(clean);
        return '';
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SidebarWidgets.init());
} else {
    SidebarWidgets.init();
}

// Make globally available
window.SidebarWidgets = SidebarWidgets;
