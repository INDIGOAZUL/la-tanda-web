/**
 * LA TANDA - Dashboard Polish JS
 * Keyboard shortcuts, scroll behavior, and performance optimizations
 * Version: 1.0.0
 * Added: 2026-01-26
 */

const DashboardPolish = {
    currentCardIndex: -1,
    cards: [],
    isKeyboardUser: false,

    init() {

        this.setupKeyboardDetection();
        this.setupKeyboardShortcuts();
        this.setupScrollBehavior();
        this.setupLazyLoading();
        this.setupSkipLink();
        this.addTooltips();

    },

    // ============================================
    // KEYBOARD DETECTION
    // ============================================
    setupKeyboardDetection() {
        // Detect keyboard vs mouse users for focus styling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('using-keyboard');
                this.isKeyboardUser = true;
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('using-keyboard');
            this.isKeyboardUser = false;
        });
    },

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (this.isTyping(e.target)) return;

            // Don't trigger if modifier keys are pressed (except for specific combos)
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            switch (e.key.toLowerCase()) {
                // Navigation
                case 'j':
                    e.preventDefault();
                    this.navigateCards('next');
                    break;
                case 'k':
                    e.preventDefault();
                    this.navigateCards('prev');
                    break;

                // Actions on current card
                case 'l':
                    e.preventDefault();
                    this.likeCurrentCard();
                    break;
                case 'b':
                    e.preventDefault();
                    this.bookmarkCurrentCard();
                    break;
                case 'c':
                    e.preventDefault();
                    this.commentCurrentCard();
                    break;
                case 'enter':
                    if (this.currentCardIndex >= 0) {
                        e.preventDefault();
                        this.openCurrentCard();
                    }
                    break;

                // Global shortcuts
                case 'n':
                    e.preventDefault();
                    this.openCompose();
                    break;
                case 'g':
                    // Wait for second key
                    this.waitForSecondKey();
                    break;
                case '/':
                    e.preventDefault();
                    this.focusSearch();
                    break;
                case '?':
                    e.preventDefault();
                    this.showShortcutsHelp();
                    break;
                case 'escape':
                    this.clearFocus();
                    break;
            }
        });
    },

    isTyping(element) {
        const tagName = element.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || element.isContentEditable;
    },

    // Card navigation
    navigateCards(direction) {
        this.cards = Array.from(document.querySelectorAll('.social-feed-card'));
        if (this.cards.length === 0) return;

        // Remove focus from current card
        if (this.currentCardIndex >= 0 && this.cards[this.currentCardIndex]) {
            this.cards[this.currentCardIndex].classList.remove('keyboard-focused');
        }

        // Calculate new index
        if (direction === 'next') {
            this.currentCardIndex = Math.min(this.currentCardIndex + 1, this.cards.length - 1);
        } else {
            this.currentCardIndex = Math.max(this.currentCardIndex - 1, 0);
        }

        // Focus new card
        const card = this.cards[this.currentCardIndex];
        if (card) {
            card.classList.add('keyboard-focused');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Announce for screen readers
            this.announceCard(card);
        }
    },

    announceCard(card) {
        const author = card.querySelector('.card-author-name')?.textContent || 'Usuario';
        const title = card.querySelector('.card-title')?.textContent || '';
        const announcement = `Publicación de ${author}: ${title}`;

        // Create or update live region
        let liveRegion = document.getElementById('card-announcer');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'card-announcer';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
            document.body.appendChild(liveRegion);
        }
        liveRegion.textContent = announcement;
    },

    likeCurrentCard() {
        if (this.currentCardIndex < 0) return;
        const card = this.cards[this.currentCardIndex];
        const likeBtn = card?.querySelector('.engagement-btn.like-btn, [data-action="like"]');
        if (likeBtn) likeBtn.click();
    },

    bookmarkCurrentCard() {
        if (this.currentCardIndex < 0) return;
        const card = this.cards[this.currentCardIndex];
        const bookmarkBtn = card?.querySelector('.engagement-btn.bookmark-btn, [data-action="bookmark"]');
        if (bookmarkBtn) bookmarkBtn.click();
    },

    commentCurrentCard() {
        if (this.currentCardIndex < 0) return;
        const card = this.cards[this.currentCardIndex];
        const commentBtn = card?.querySelector('.engagement-btn.comment-btn, [data-action="comment"]');
        if (commentBtn) commentBtn.click();
    },

    openCurrentCard() {
        if (this.currentCardIndex < 0) return;
        const card = this.cards[this.currentCardIndex];
        const link = card?.querySelector('a[href]');
        if (link) link.click();
    },

    openCompose() {
        if (window.MobileDrawer) {
            window.MobileDrawer.openCompose();
        } else if (window.LaTandaPopup) {
            window.LaTandaPopup.showInfo('Crear publicación próximamente');
        }
    },

    focusSearch() {
        const searchInput = document.querySelector('.search-input, [type="search"], #searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    },

    clearFocus() {
        if (this.currentCardIndex >= 0 && this.cards[this.currentCardIndex]) {
            this.cards[this.currentCardIndex].classList.remove('keyboard-focused');
        }
        this.currentCardIndex = -1;
        document.activeElement?.blur();
    },

    waitForSecondKey() {
        const handler = (e) => {
            document.removeEventListener('keydown', handler);

            switch (e.key.toLowerCase()) {
                case 'h':
                    e.preventDefault();
                    window.location.href = 'home-dashboard.html';
                    break;
                case 'p':
                    e.preventDefault();
                    window.location.href = 'profile.html';
                    break;
                case 'w':
                    e.preventDefault();
                    window.location.href = 'wallet.html';
                    break;
                case 't':
                    e.preventDefault();
                    window.location.href = 'groups-advanced-system.html';
                    break;
                case 'm':
                    e.preventDefault();
                    window.location.href = 'marketplace-search.html';
                    break;
            }
        };

        document.addEventListener('keydown', handler, { once: true });

        // Show hint
        this.showToast('g + h: Inicio, p: Perfil, w: Wallet, t: Tandas, m: Mercado', 2000);
    },

    showShortcutsHelp() {
        const shortcuts = `
            <div style="text-align:left;font-size:14px;line-height:1.8;">
                <h3 style="color:#00FFFF;margin-bottom:12px;">Atajos de Teclado</h3>
                <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;">
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">j</kbd><span>Siguiente publicación</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">k</kbd><span>Anterior publicación</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">l</kbd><span>Me gusta</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">b</kbd><span>Guardar</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">c</kbd><span>Comentar</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">n</kbd><span>Nueva publicación</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">/</kbd><span>Buscar</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">g h</kbd><span>Ir a Inicio</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">g p</kbd><span>Ir a Perfil</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">g w</kbd><span>Ir a Wallet</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">Esc</kbd><span>Quitar foco</span>
                    <kbd style="background:#333;padding:2px 8px;border-radius:4px;">?</kbd><span>Mostrar ayuda</span>
                </div>
            </div>
        `;

        if (window.LaTandaPopup && window.LaTandaPopup.showCustom) {
            window.LaTandaPopup.showCustom(shortcuts);
        } else {
            // Fallback: create modal
            this.showModal('Atajos de Teclado', shortcuts);
        }
    },

    showToast(message, duration = 3000) {
        let toast = document.getElementById('polish-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'polish-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(0, 0, 0, 0.9);
                color: #fff;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 9999;
                opacity: 0;
                transition: all 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, duration);
    },

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        modal.onclick = () => modal.remove();

        modal.innerHTML = `
            <div style="background: #1a1a2e; padding: 24px; border-radius: 12px; max-width: 400px; border: 1px solid rgba(0,255,255,0.2);" onclick="event.stopPropagation()">
                ${content}
                <button onclick="this.closest('div').parentElement.remove()" style="margin-top:16px;width:100%;padding:10px;background:#00FFFF;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Cerrar</button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    // ============================================
    // SCROLL BEHAVIOR
    // ============================================
    setupScrollBehavior() {
        const rightSidebar = document.querySelector('.right-sidebar-sticky');
        if (!rightSidebar) return;

        let lastScrollTop = 0;
        let sidebarTop = 0;
        const sidebarHeight = rightSidebar.offsetHeight;
        const viewportHeight = window.innerHeight;

        // Only apply if sidebar is taller than viewport
        if (sidebarHeight <= viewportHeight) return;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';

            if (scrollDirection === 'down') {
                // Scrolling down - stick to bottom
                const maxTop = sidebarHeight - viewportHeight;
                sidebarTop = Math.min(sidebarTop + (scrollTop - lastScrollTop), maxTop);
            } else {
                // Scrolling up - stick to top
                sidebarTop = Math.max(sidebarTop - (lastScrollTop - scrollTop), 0);
            }

            rightSidebar.style.transform = `translateY(-${sidebarTop}px)`;
            lastScrollTop = scrollTop;
        }, { passive: true });
    },

    // ============================================
    // LAZY LOADING
    // ============================================
    setupLazyLoading() {
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        if (images.length === 0) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px'
        });

        images.forEach(img => imageObserver.observe(img));
    },

    // ============================================
    // SKIP LINK
    // ============================================
    setupSkipLink() {
        // Check if skip link already exists
        if (document.querySelector('.skip-to-content')) return;

        const skipLink = document.createElement('a');
        skipLink.href = '#socialFeedContainer';
        skipLink.className = 'skip-to-content';
        skipLink.textContent = 'Saltar al contenido';
        document.body.insertBefore(skipLink, document.body.firstChild);
    },

    // ============================================
    // TOOLTIPS
    // ============================================
    addTooltips() {
        // Add tooltips to engagement buttons
        document.querySelectorAll('.engagement-btn').forEach(btn => {
            if (btn.classList.contains('like-btn')) {
                btn.setAttribute('data-tooltip', 'Me gusta (L)');
            } else if (btn.classList.contains('comment-btn')) {
                btn.setAttribute('data-tooltip', 'Comentar (C)');
            } else if (btn.classList.contains('bookmark-btn')) {
                btn.setAttribute('data-tooltip', 'Guardar (B)');
            } else if (btn.classList.contains('share-btn')) {
                btn.setAttribute('data-tooltip', 'Compartir');
            }
        });

        // Add tooltips to nav items
        document.querySelectorAll('.nav-menu-item').forEach(item => {
            const text = item.querySelector('span')?.textContent;
            if (text && !item.getAttribute('data-tooltip')) {
                // Only add if not already has tooltip
            }
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DashboardPolish.init());
} else {
    DashboardPolish.init();
}

// Re-initialize tooltips when new content is loaded
document.addEventListener('socialFeedLoaded', () => {
    DashboardPolish.addTooltips();
});

// Make globally available
window.DashboardPolish = DashboardPolish;
