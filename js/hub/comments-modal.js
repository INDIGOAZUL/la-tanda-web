/**
 * LA TANDA - Comments Modal
 * Modal para ver y agregar comentarios en el feed social
 * Version: 1.5.0
 * Added: 2026-01-25
 */

const CommentsModal = {
    modal: null,
    currentEventId: null,
    comments: [],
    isLoading: false,

    init() {
        this.createModal();
        this.attachEventListeners();
    },

    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('commentsModal');
        if (existing) existing.remove();

        const modalHTML = `
            <div class="comments-modal-overlay" id="commentsModal">
                <div class="comments-modal">
                    <div class="comments-modal-header">
                        <h3>Comentarios</h3>
                        <button class="comments-modal-close" id="commentsModalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="comments-modal-body" id="commentsModalBody">
                        <div class="comments-loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Cargando comentarios...</span>
                        </div>
                    </div>
                    <div class="comments-modal-footer">
                        <form class="comments-form" id="commentsForm">
                            <div class="comments-input-wrapper">
                                <textarea
                                    id="commentInput"
                                    placeholder="Escribe un comentario..."
                                    maxlength="500"
                                    rows="1"
                                ></textarea>
                                <span class="char-count"><span id="charCount">0</span>/500</span>
                            </div>
                            <button type="submit" class="comments-submit-btn" id="commentSubmitBtn" disabled>
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('commentsModal');
    },

    attachEventListeners() {
        // Close button
        document.getElementById('commentsModalClose')?.addEventListener('click', () => this.close());

        // Click outside to close
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                this.close();
            }
        });

        // Form submission
        document.getElementById('commentsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitComment();
        });

        // Character count
        const input = document.getElementById('commentInput');
        const charCount = document.getElementById('charCount');
        const submitBtn = document.getElementById('commentSubmitBtn');

        input?.addEventListener('input', () => {
            const len = input.value.length;
            charCount.textContent = len;
            submitBtn.disabled = len === 0 || len > 500;

            // Auto-resize textarea
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });
    },

    async open(eventId) {
        if (!eventId) return;

        this.currentEventId = eventId;
        this.comments = [];
        this.modal?.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Reset form
        const input = document.getElementById('commentInput');
        const charCount = document.getElementById('charCount');
        if (input) {
            input.value = '';
            input.style.height = 'auto';
        }
        if (charCount) charCount.textContent = '0';
        document.getElementById('commentSubmitBtn').disabled = true;

        await this.loadComments();
    },

    close() {
        this.modal?.classList.remove('active');
        document.body.style.overflow = '';
        this.currentEventId = null;
    },

    async loadComments() {
        if (this.isLoading) return;
        this.isLoading = true;

        const body = document.getElementById('commentsModalBody');
        body.innerHTML = `
            <div class="comments-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Cargando comentarios...</span>
            </div>
        `;

        try {
            const response = await fetch(`/api/feed/social/${this.currentEventId}/comments`);
            const result = await response.json();

            if (result.success) {
                this.comments = result.data.comments || [];
                this.renderComments();
            } else {
                this.renderError();
            }
        } catch (error) {

            this.renderError();
        } finally {
            this.isLoading = false;
        }
    },

    renderComments() {
        const body = document.getElementById('commentsModalBody');

        if (this.comments.length === 0) {
            body.innerHTML = `
                <div class="comments-empty">
                    <i class="far fa-comment"></i>
                    <p>No hay comentarios aun</p>
                    <span>Se el primero en comentar</span>
                </div>
            `;
            return;
        }

        body.innerHTML = `
            <div class="comments-list">
                ${this.comments.map(c => this.renderComment(c)).join('')}
            </div>
        `;

        // Attach reply/delete handlers
        body.querySelectorAll('.comment-reply-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleReply(btn.dataset.id, btn.dataset.name));
        });

        body.querySelectorAll('.comment-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleDelete(btn.dataset.id));
        });

        // Attach click handlers for mentions and hashtags
        body.querySelectorAll('.mention-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const handle = link.dataset.handle;
                if (window.SocialFeed && window.SocialFeed.showUserProfileByHandle) {
                    window.SocialFeed.showUserProfileByHandle(handle, link);
                }
            });
        });

        body.querySelectorAll('.hashtag-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tag = link.dataset.tag;
                this.close();
                if (window.SocialFeed && window.SocialFeed.filterByHashtag) {
                    window.SocialFeed.filterByHashtag(tag);
                }
            });
        });
    },

    renderComment(comment, isReply = false) {
        const user = comment.user || {};
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        const currentUserId = this.getCurrentUserId();
        const canDelete = currentUserId && user.id === currentUserId;

        const avatarContent = user.avatar_url
            ? `<img src="${this.escapeHtml(user.avatar_url)}" alt="${this.escapeHtml(user.name)}">`
            : `<span>${user.initials || '??'}</span>`;

        const repliesHTML = (comment.replies && comment.replies.length > 0)
            ? `<div class="comment-replies">
                ${comment.replies.map(r => this.renderComment(r, true)).join('')}
               </div>`
            : '';

        return `
            <div class="comment ${isReply ? 'comment-reply' : ''}" data-id="${comment.id}">
                <div class="comment-avatar ${user.avatar_url ? '' : 'initials'}">
                    ${avatarContent}
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${this.escapeHtml(user.name || 'Usuario')}</span>
                        ${user.verified ? '<i class="fas fa-check-circle comment-verified"></i>' : ''}
                        <span class="comment-time">${this.escapeHtml(comment.time_ago)}</span>
                    </div>
                    <p class="comment-text">${this.parseContent(comment.content)}</p>
                    <div class="comment-actions">
                        ${!isReply && token ? `
                            <button class="comment-action-btn comment-reply-btn" data-id="${comment.id}" data-name="${this.escapeHtml(user.name)}">
                                <i class="fas fa-reply"></i> Responder
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button class="comment-action-btn comment-delete-btn" data-id="${comment.id}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${repliesHTML}
            </div>
        `;
    },

    handleReply(parentId, parentName) {
        const input = document.getElementById('commentInput');
        if (input) {
            input.value = `@${parentName} `;
            input.focus();
            input.dataset.parentId = parentId;
        }
    },

    async handleDelete(commentId) {
        if (!confirm('Eliminar este comentario?')) return;

        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`/api/feed/social/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success) {
                // Reload comments
                await this.loadComments();
                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showSuccess('Comentario eliminado');
                }
            } else {
                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showError(result.data?.error?.message || 'Error al eliminar');
                }
            }
        } catch (error) {

        }
    },

    async submitComment() {
        const input = document.getElementById('commentInput');
        const content = input?.value.trim();
        const parentId = input?.dataset.parentId || null;

        if (!content) return;

        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) {
            if (window.LaTandaPopup) {
                window.LaTandaPopup.showError('Inicia sesion para comentar');
            }
            return;
        }

        const submitBtn = document.getElementById('commentSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch(`/api/feed/social/${this.currentEventId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content,
                    parent_id: parentId
                })
            });

            const result = await response.json();

            if (result.success) {
                // Reset input
                input.value = '';
                input.style.height = 'auto';
                delete input.dataset.parentId;
                document.getElementById('charCount').textContent = '0';

                // Reload comments
                await this.loadComments();

                // Scroll to bottom
                const body = document.getElementById('commentsModalBody');
                body.scrollTop = body.scrollHeight;

                // Update comment count in feed
                this.updateFeedCommentCount(1);

                // Close modal after successful comment
                this.close();
            } else {
                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showError(result.data?.error?.message || 'Error al comentar');
                }
            }
        } catch (error) {

            if (window.LaTandaPopup) {
                window.LaTandaPopup.showError('Error de conexion');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    },

    updateFeedCommentCount(delta) {
        const card = document.querySelector(`.social-card[data-event-id="${this.currentEventId}"]`);
        if (!card) return;

        const commentBtn = card.querySelector('.comment-btn span');
        if (commentBtn) {
            const current = parseInt(commentBtn.textContent) || 0;
            commentBtn.textContent = Math.max(0, current + delta) || '';
        }
    },

    getCurrentUserId() {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId;
        } catch {
            return null;
        }
    },

    renderError() {
        const body = document.getElementById('commentsModalBody');
        body.innerHTML = `
            <div class="comments-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar comentarios</p>
                <button onclick="CommentsModal.loadComments()" class="btn-retry">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    },

    escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },

    parseContent(text) {
        if (!text) return '';
        let escaped = this.escapeHtml(text);
        // Parse @mentions
        escaped = escaped.replace(/@([\w\-\.]+)/g, '<a href="#" class="mention-link" data-handle="$1">@$1</a>');
        // Parse #hashtags
        escaped = escaped.replace(/#([\wáéíóúñÁÉÍÓÚÑ]+)/g, '<a href="#" class="hashtag-link" data-tag="$1">#$1</a>');
        return escaped;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    CommentsModal.init();
});

// Make globally available
window.CommentsModal = CommentsModal;
