/**
 * LA TANDA - User Mini Profile + Profile Viewer Modal
 * Hover card para mostrar perfil rapido de usuarios
 * + Modal fullscreen con tabs: Posts, Seguidores, Siguiendo
 * Version: 2.0.0
 * Added: 2026-01-25
 * Updated: 2026-02-09 - ProfileViewerModal con tabs
 */

const UserMiniProfile = {
    popup: null,
    currentUserId: null,
    hideTimeout: null,
    pinned: false,
    cache: new Map(),
    CACHE_TTL: 60000, // 1 minute

    init() {
        this.createPopup();
        this.attachEventListeners();
    },

    createPopup() {
        const existing = document.getElementById('userMiniProfile');
        if (existing) existing.remove();

        const popupHTML = `
            <div class="user-mini-profile" id="userMiniProfile">
                <div class="mini-profile-content">
                    <div class="mini-profile-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHTML);
        this.popup = document.getElementById('userMiniProfile');
    },

    attachEventListeners() {
        // Use event delegation on the social feed container
        document.addEventListener('mouseenter', (e) => {
            const avatar = e.target && e.target.closest && e.target.closest('.actor-avatar[data-user-id]');
            if (avatar) {
                this.show(avatar);
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            const avatar = e.target && e.target.closest && e.target.closest('.actor-avatar[data-user-id]');
            if (avatar) {
                this.scheduleHide();
            }
        }, true);

        // Keep popup visible when hovering over it
        this.popup?.addEventListener('mouseenter', () => {
            this.cancelHide();
        });

        this.popup?.addEventListener('mouseleave', () => {
            if (!this.pinned) this.scheduleHide();
        });

        // Click outside to close pinned popup
        document.addEventListener('click', (e) => {
            if (!this.pinned) return;
            if (this.popup && !this.popup.contains(e.target) && !e.target.closest('.mention-link')) {
                this.pinned = false;
                this.hide();
            }
        });
    },

    async show(avatarElement) {
        const userId = avatarElement.dataset.userId;
        if (!userId || userId === 'null') return;

        this.cancelHide();
        this.currentUserId = userId;

        // Position popup
        const rect = avatarElement.getBoundingClientRect();
        const popupWidth = 280;
        const popupHeight = 200;

        let left = rect.left + (rect.width / 2) - (popupWidth / 2);
        let top = rect.bottom + 8;

        // Keep within viewport
        if (left < 10) left = 10;
        if (left + popupWidth > window.innerWidth - 10) {
            left = window.innerWidth - popupWidth - 10;
        }
        if (top + popupHeight > window.innerHeight - 10) {
            top = rect.top - popupHeight - 8;
        }

        this.popup.style.left = `${left}px`;
        this.popup.style.top = `${top}px`;
        this.popup.classList.add('active');

        // Load profile data
        await this.loadProfile(userId);
    },

    // Show pinned popup (for mention clicks — stays until click-outside)
    async showPinned(element, userId) {
        if (!userId || userId === 'null') return;
        element.dataset.userId = userId;
        this.pinned = true;
        this.popup?.classList.add('pinned');
        await this.show(element);
    },

    scheduleHide() {
        if (this.pinned) return;
        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, 300);
    },

    cancelHide() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    },

    hide() {
        this.popup?.classList.remove('active');
        this.popup?.classList.remove('pinned');
        this.currentUserId = null;
        this.pinned = false;
    },

    async loadProfile(userId) {
        const content = this.popup.querySelector('.mini-profile-content');

        // Check cache
        const cached = this.cache.get(userId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            this.renderProfile(cached.data);
            return;
        }

        // Show loading
        content.innerHTML = `
            <div class="mini-profile-loading">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        `;

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
            const response = await fetch(`/api/feed/social/user/${userId}/profile`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            const result = await response.json();

            if (result.success && this.currentUserId === userId) {
                // Cache the result
                this.cache.set(userId, {
                    data: result.data,
                    timestamp: Date.now()
                });
                this.renderProfile(result.data);
            } else if (!result.success) {
                this.renderError();
            }
        } catch (error) {
            this.renderError();
        }
    },

    renderProfile(data) {
        const content = this.popup.querySelector('.mini-profile-content');
        const user = data.user;
        const stats = data.stats;
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');

        const avatarContent = user.avatar_url
            ? `<img src="${this.escapeHtml(user.avatar_url)}" alt="${this.escapeHtml(user.name)}">`
            : `<span>${this.getInitials(user.name)}</span>`;

        const followBtnHTML = token && !data.is_self
            ? `<button class="mini-profile-follow-btn ${data.is_following ? 'following' : ''}" data-user-id="${this.escapeHtml(user.id)}">
                ${data.is_following ? '<i class="fas fa-check"></i> Siguiendo' : '<i class="fas fa-plus"></i> Seguir'}
               </button>`
            : '';

        content.innerHTML = `
            <div class="mini-profile-header">
                <div class="mini-profile-avatar ${user.avatar_url ? '' : 'initials'}">
                    ${avatarContent}
                    ${user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                </div>
                <div class="mini-profile-info">
                    <span class="mini-profile-name">${this.escapeHtml(user.name)}</span>
                    ${user.bio ? `<p class="mini-profile-bio">${this.escapeHtml(user.bio)}</p>` : ''}
                </div>
            </div>
            <div class="mini-profile-stats">
                <div class="mini-stat clickable" data-tab="posts" data-user-id="${this.escapeHtml(user.id)}">
                    <span class="stat-value">${stats.posts}</span>
                    <span class="stat-label">Posts</span>
                </div>
                <div class="mini-stat clickable" data-tab="followers" data-user-id="${this.escapeHtml(user.id)}">
                    <span class="stat-value">${stats.followers}</span>
                    <span class="stat-label">Seguidores</span>
                </div>
                <div class="mini-stat clickable" data-tab="following" data-user-id="${this.escapeHtml(user.id)}">
                    <span class="stat-value">${stats.following}</span>
                    <span class="stat-label">Siguiendo</span>
                </div>
            </div>
            ${followBtnHTML}
        `;

        // Attach follow button handler
        const followBtn = content.querySelector('.mini-profile-follow-btn');
        if (followBtn) {
            followBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFollow(user.id, followBtn);
            });
        }

        // Attach stat click handlers
        content.querySelectorAll('.mini-stat.clickable').forEach(stat => {
            stat.addEventListener('click', () => {
                const tab = stat.dataset.tab;
                const userId = stat.dataset.userId;
                this.hide();
                ProfileViewerModal.open(userId, tab);
            });
        });
    },

    async toggleFollow(userId, button) {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;

        const isFollowing = button.classList.contains('following');
        const method = isFollowing ? 'DELETE' : 'POST';

        // Optimistic UI update
        button.classList.toggle('following');
        button.innerHTML = isFollowing
            ? '<i class="fas fa-plus"></i> Seguir'
            : '<i class="fas fa-check"></i> Siguiendo';

        try {
            const response = await fetch(`/api/feed/social/follow/${userId}`, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (!result.success) {
                // Revert on error
                button.classList.toggle('following');
                button.innerHTML = isFollowing
                    ? '<i class="fas fa-check"></i> Siguiendo'
                    : '<i class="fas fa-plus"></i> Seguir';
            } else {
                // Update cache
                const cached = this.cache.get(userId);
                if (cached) {
                    cached.data.is_following = !isFollowing;
                    cached.data.stats.followers += isFollowing ? -1 : 1;
                }
            }
        } catch (error) {
            // Revert
            button.classList.toggle('following');
            button.innerHTML = isFollowing
                ? '<i class="fas fa-check"></i> Siguiendo'
                : '<i class="fas fa-plus"></i> Seguir';
        }
    },

    renderError() {
        const content = this.popup.querySelector('.mini-profile-content');
        content.innerHTML = `
            <div class="mini-profile-error">
                <i class="fas fa-user-slash"></i>
                <span>Perfil no disponible</span>
            </div>
        `;
    },

    getInitials(name) {
        if (!name) return '??';
        const parts = name.split(' ');
        return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    },

    escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
};


// ============================================
// ProfileViewerModal — Posts, Seguidores, Siguiendo tabs
// ============================================
const ProfileViewerModal = {
    overlay: null,
    userId: null,
    activeTab: 'posts',
    loading: false,
    data: { posts: [], followers: [], following: [] },
    pagination: { posts: null, followers: null, following: null },
    profileCache: null,

    open(userId, tab) {
        if (!userId) return;
        this.userId = userId;
        this.activeTab = tab || 'posts';
        this.data = { posts: [], followers: [], following: [] };
        this.pagination = { posts: null, followers: null, following: null };
        this.profileCache = null;
        this.createModal();
        this.loadHeader();
        this.loadTabContent();
        document.body.style.overflow = 'hidden';
    },

    close() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            setTimeout(() => {
                this.overlay?.remove();
                this.overlay = null;
            }, 200);
        }
        document.body.style.overflow = '';
        this.userId = null;
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
    },

    createModal() {
        const existing = document.getElementById('profileViewerOverlay');
        if (existing) existing.remove();

        const html = `
            <div class="profile-viewer-overlay" id="profileViewerOverlay">
                <div class="profile-viewer-modal">
                    <div class="profile-viewer-close" id="pvClose">
                        <i class="fas fa-times"></i>
                    </div>
                    <div class="profile-viewer-header" id="pvHeader">
                        <div class="pv-header-loading">
                            <div class="pv-avatar-placeholder"></div>
                            <div class="pv-name-placeholder"></div>
                        </div>
                    </div>
                    <div class="profile-viewer-tabs">
                        <button class="pv-tab ${this.activeTab === 'posts' ? 'active' : ''}" data-tab="posts">
                            <span class="pv-tab-label">Posts</span>
                            <span class="pv-tab-count" id="pvCountPosts">-</span>
                        </button>
                        <button class="pv-tab ${this.activeTab === 'followers' ? 'active' : ''}" data-tab="followers">
                            <span class="pv-tab-label">Seguidores</span>
                            <span class="pv-tab-count" id="pvCountFollowers">-</span>
                        </button>
                        <button class="pv-tab ${this.activeTab === 'following' ? 'active' : ''}" data-tab="following">
                            <span class="pv-tab-label">Siguiendo</span>
                            <span class="pv-tab-count" id="pvCountFollowing">-</span>
                        </button>
                    </div>
                    <div class="profile-viewer-body" id="pvBody">
                        <div class="pv-loading"><i class="fas fa-spinner fa-spin"></i></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.overlay = document.getElementById('profileViewerOverlay');

        // Animate in
        requestAnimationFrame(() => this.overlay.classList.add('active'));

        // Close button
        document.getElementById('pvClose').addEventListener('click', () => this.close());

        // Backdrop click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Tab clicks
        this.overlay.querySelectorAll('.pv-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Infinite scroll
        const body = document.getElementById('pvBody');
        body.addEventListener('scroll', () => {
            if (this.loading) return;
            const pag = this.pagination[this.activeTab];
            if (!pag || !pag.has_more) return;
            if (body.scrollTop + body.clientHeight >= body.scrollHeight - 100) {
                this.loadMore();
            }
        });

        // Escape key
        this._escHandler = (e) => {
            if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this._escHandler);
    },

    switchTab(tab) {
        if (tab === this.activeTab) return;
        this.activeTab = tab;

        this.overlay.querySelectorAll('.pv-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        if (this.data[tab].length > 0) {
            this.renderContent();
        } else {
            this.loadTabContent();
        }
    },

    async loadHeader() {
        const cached = UserMiniProfile.cache.get(this.userId);
        if (cached && Date.now() - cached.timestamp < UserMiniProfile.CACHE_TTL) {
            this.profileCache = cached.data;
            this.renderHeader(cached.data);
            return;
        }

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
            const res = await fetch(`/api/feed/social/user/${this.userId}/profile`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const result = await res.json();
            if (result.success) {
                this.profileCache = result.data;
                UserMiniProfile.cache.set(this.userId, {
                    data: result.data,
                    timestamp: Date.now()
                });
                this.renderHeader(result.data);
            }
        } catch (e) { /* header stays as placeholder */ }
    },

    renderHeader(data) {
        const header = document.getElementById('pvHeader');
        if (!header) return;

        const user = data.user;
        const esc = UserMiniProfile.escapeHtml.bind(UserMiniProfile);
        const initials = UserMiniProfile.getInitials(user.name);

        const avatarContent = user.avatar_url
            ? `<img src="${esc(user.avatar_url)}" alt="${esc(user.name)}">`
            : `<span class="pv-avatar-initials">${initials}</span>`;

        header.innerHTML = `
            <div class="pv-header-info">
                <div class="pv-header-avatar ${user.avatar_url ? '' : 'initials'}">
                    ${avatarContent}
                    ${user.verified ? '<i class="fas fa-check-circle pv-verified"></i>' : ''}
                </div>
                <div class="pv-header-text">
                    <span class="pv-header-name">${esc(user.name)}</span>
                    ${user.bio ? `<p class="pv-header-bio">${esc(user.bio)}</p>` : ''}
                </div>
            </div>
        `;

        const stats = data.stats;
        const cp = document.getElementById('pvCountPosts');
        const cf = document.getElementById('pvCountFollowers');
        const cg = document.getElementById('pvCountFollowing');
        if (cp) cp.textContent = this.formatCount(stats.posts);
        if (cf) cf.textContent = this.formatCount(stats.followers);
        if (cg) cg.textContent = this.formatCount(stats.following);
    },

    async loadTabContent() {
        const body = document.getElementById('pvBody');
        if (!body) return;

        this.loading = true;
        body.innerHTML = '<div class="pv-loading"><i class="fas fa-spinner fa-spin"></i></div>';

        const tab = this.activeTab;
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        try {
            const res = await fetch(`/api/feed/social/user/${this.userId}/${tab}?limit=20&offset=0`, { headers });
            const result = await res.json();

            if (result.success) {
                const items = tab === 'posts' ? result.data.posts : result.data.users;
                this.data[tab] = items;
                this.pagination[tab] = result.data.pagination;
                this.renderContent();

                // Update count
                const key = tab.charAt(0).toUpperCase() + tab.slice(1);
                const countEl = document.getElementById('pvCount' + key);
                if (countEl) countEl.textContent = this.formatCount(result.data.pagination.total);
            } else {
                body.innerHTML = '<div class="pv-empty"><i class="fas fa-exclamation-circle"></i><span>Error al cargar</span></div>';
            }
        } catch (error) {
            body.innerHTML = '<div class="pv-empty"><i class="fas fa-exclamation-circle"></i><span>Error de conexion</span></div>';
        }

        this.loading = false;
    },

    async loadMore() {
        const tab = this.activeTab;
        const pag = this.pagination[tab];
        if (!pag || !pag.has_more || this.loading) return;

        this.loading = true;
        const body = document.getElementById('pvBody');

        const loader = document.createElement('div');
        loader.className = 'pv-loading-more';
        loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        body?.appendChild(loader);

        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const newOffset = pag.offset + pag.limit;

        try {
            const res = await fetch(`/api/feed/social/user/${this.userId}/${tab}?limit=20&offset=${newOffset}`, { headers });
            const result = await res.json();

            loader.remove();

            if (result.success) {
                const items = tab === 'posts' ? result.data.posts : result.data.users;
                this.data[tab] = this.data[tab].concat(items);
                this.pagination[tab] = result.data.pagination;
                this.appendItems(items);
            }
        } catch (error) {
            loader.remove();
        }

        this.loading = false;
    },

    renderContent() {
        const body = document.getElementById('pvBody');
        if (!body) return;

        const tab = this.activeTab;
        const items = this.data[tab];

        if (!items || items.length === 0) {
            const emptyMessages = {
                posts: 'No hay publicaciones aun',
                followers: 'Aun no tiene seguidores',
                following: 'Aun no sigue a nadie'
            };
            const emptyIcons = {
                posts: 'fa-pen-to-square',
                followers: 'fa-users',
                following: 'fa-user-plus'
            };
            body.innerHTML = `<div class="pv-empty"><i class="fas ${emptyIcons[tab]}"></i><span>${emptyMessages[tab]}</span></div>`;
            return;
        }

        body.innerHTML = tab === 'posts'
            ? items.map(p => this.renderPostCard(p)).join('')
            : items.map(u => this.renderUserCard(u)).join('');
    },

    appendItems(items) {
        const body = document.getElementById('pvBody');
        if (!body) return;

        const tab = this.activeTab;
        const html = tab === 'posts'
            ? items.map(p => this.renderPostCard(p)).join('')
            : items.map(u => this.renderUserCard(u)).join('');

        body.insertAdjacentHTML('beforeend', html);
    },

    renderPostCard(post) {
        const esc = UserMiniProfile.escapeHtml.bind(UserMiniProfile);
        const text = post.description || post.title || '';
        const truncated = text.length > 200 ? text.substring(0, 200) + '...' : text;

        let thumbnail = '';
        if (post.image_url) {
            thumbnail = `<div class="pv-post-thumb"><img src="${esc(post.image_url)}" alt="" loading="lazy"></div>`;
        }

        return `
            <div class="pv-post-card">
                <div class="pv-post-content">
                    <p class="pv-post-text">${esc(truncated)}</p>
                    <div class="pv-post-meta">
                        <span class="pv-post-time">${esc(post.time_ago)}</span>
                        <span class="pv-post-stats">
                            <i class="fas fa-heart"></i> ${post.engagement.likes}
                            <i class="fas fa-comment"></i> ${post.engagement.comments}
                        </span>
                    </div>
                </div>
                ${thumbnail}
            </div>
        `;
    },

    renderUserCard(user) {
        const esc = UserMiniProfile.escapeHtml.bind(UserMiniProfile);
        const initials = UserMiniProfile.getInitials(user.name);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');

        const avatarContent = user.avatar_url
            ? `<img src="${esc(user.avatar_url)}" alt="${esc(user.name)}" loading="lazy">`
            : `<span class="pv-user-initials">${initials}</span>`;

        const bio = user.bio
            ? `<p class="pv-user-bio">${esc(user.bio.length > 80 ? user.bio.substring(0, 80) + '...' : user.bio)}</p>`
            : '';

        let followBtn = '';
        if (token && !user.is_self) {
            followBtn = `<button class="pv-follow-btn ${user.is_following ? 'following' : ''}" data-user-id="${esc(user.id)}">
                ${user.is_following ? 'Siguiendo' : 'Seguir'}
            </button>`;
        }

        return `
            <div class="pv-user-card" data-user-id="${esc(user.id)}">
                <div class="pv-user-avatar ${user.avatar_url ? '' : 'initials'}" data-user-id="${esc(user.id)}">
                    ${avatarContent}
                </div>
                <div class="pv-user-info" data-user-id="${esc(user.id)}">
                    <span class="pv-user-name">${esc(user.name)} ${user.verified ? '<i class="fas fa-check-circle pv-verified-sm"></i>' : ''}</span>
                    ${user.handle ? `<span class="pv-user-handle">@${esc(user.handle)}</span>` : ''}
                    ${bio}
                </div>
                ${followBtn}
            </div>
        `;
    },

    formatCount(n) {
        if (n === undefined || n === null) return '-';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(n);
    },

    _initDelegation() {
        document.addEventListener('click', (e) => {
            // Follow button inside profile viewer
            const followBtn = e.target.closest('.pv-follow-btn');
            if (followBtn && this.overlay) {
                e.stopPropagation();
                this._handleFollowClick(followBtn);
                return;
            }

            // Click on user card to navigate to that user's profile
            const userCard = e.target.closest('.pv-user-card');
            if (userCard && this.overlay && !e.target.closest('.pv-follow-btn')) {
                const userId = userCard.dataset.userId;
                if (userId && userId !== this.userId) {
                    this.open(userId, 'posts');
                }
                return;
            }
        });
    },

    async _handleFollowClick(button) {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;

        const userId = button.dataset.userId;
        const isFollowing = button.classList.contains('following');
        const method = isFollowing ? 'DELETE' : 'POST';

        button.classList.toggle('following');
        button.textContent = isFollowing ? 'Seguir' : 'Siguiendo';

        try {
            const res = await fetch(`/api/feed/social/follow/${userId}`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();

            if (!result.success) {
                button.classList.toggle('following');
                button.textContent = isFollowing ? 'Siguiendo' : 'Seguir';
            } else {
                UserMiniProfile.cache.delete(userId);
                UserMiniProfile.cache.delete(this.userId);
            }
        } catch (error) {
            button.classList.toggle('following');
            button.textContent = isFollowing ? 'Siguiendo' : 'Seguir';
        }
    }
};


// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UserMiniProfile.init();
    ProfileViewerModal._initDelegation();
});

// Make globally available
window.UserMiniProfile = UserMiniProfile;
window.ProfileViewerModal = ProfileViewerModal;
