/**
 * Invitation Card Generator
 * Creates beautiful promotional cards for sharing group invitations
 * Version: 1.0.0
 */

(function() {
    'use strict';

    // Benefits to highlight
    const BENEFITS = [
        {
            icon: '🛒',
            title: 'Marketplace Social',
            desc: 'Compras grupales con descuentos exclusivos'
        },
        {
            icon: '🎰',
            title: 'Predictor de Lotería',
            desc: 'Acceso gratis a predicciones La Diaria'
        },
        {
            icon: '💰',
            title: 'Ahorro Organizado',
            desc: 'Sistema seguro de tandas digitales'
        },
        {
            icon: '📊',
            title: 'Dashboard Personal',
            desc: 'Seguimiento de pagos y turnos en tiempo real'
        }
    ];

    // Card themes
    const THEMES = {
        purple: { name: 'Púrpura', class: '' },
        gold: { name: 'Dorado', class: 'theme-gold' },
        green: { name: 'Verde', class: 'theme-green' },
        dark: { name: 'Oscuro', class: 'theme-dark' }
    };

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Generate invitation card HTML
     */
    function generateCardHTML(options) {
        const {
            groupName = 'Grupo de Ahorro',
            groupDesc = 'Únete a nuestra tanda',
            contribution = 0,
            frequency = 'mensual',
            members = 0,
            maxMembers = 10,
            inviteLink = '',
            inviterName = 'Un amigo',
            theme = 'purple'
        } = options;

        const themeClass = THEMES[theme]?.class || '';
        const spotsLeft = maxMembers - members;
        const frequencyLabel = {
            'weekly': 'Semanal',
            'biweekly': 'Quincenal',
            'monthly': 'Mensual'
        }[frequency] || frequency;

        // Select 3 benefits to display
        const displayBenefits = BENEFITS.slice(0, 3);

        let benefitsHTML = displayBenefits.map(function(b) {
            return '<li>' +
                '<div class="benefit-icon">' + b.icon + '</div>' +
                '<div class="benefit-text">' +
                    '<div class="benefit-title">' + b.title + '</div>' +
                    '<p class="benefit-desc">' + b.desc + '</p>' +
                '</div>' +
            '</li>';
        }).join('');

        return '<div class="invitation-card ' + themeClass + '" id="invitationCardPreview">' +
            '<div class="invitation-card-header">' +
                '<div class="invitation-card-logo">💫</div>' +
                '<h2 class="invitation-card-title">¡Únete a La Tanda!</h2>' +
                '<p class="invitation-card-subtitle">' + escapeHtml(inviterName) + ' te invita</p>' +
            '</div>' +

            '<div class="invitation-card-body">' +
                '<h3 class="invitation-card-group-name">' + escapeHtml(groupName) + '</h3>' +
                '<p class="invitation-card-group-desc">' + escapeHtml(groupDesc) + '</p>' +

                '<div class="invitation-card-stats">' +
                    '<div class="stat-item">' +
                        '<div class="stat-value">L.' + contribution.toLocaleString() + '</div>' +
                        '<div class="stat-label">' + frequencyLabel + '</div>' +
                    '</div>' +
                    '<div class="stat-item">' +
                        '<div class="stat-value">' + members + '/' + maxMembers + '</div>' +
                        '<div class="stat-label">Miembros</div>' +
                    '</div>' +
                    '<div class="stat-item">' +
                        '<div class="stat-value">' + spotsLeft + '</div>' +
                        '<div class="stat-label">Lugares</div>' +
                    '</div>' +
                '</div>' +

                '<ul class="invitation-card-benefits">' + benefitsHTML + '</ul>' +

                '<a href="' + escapeHtml(inviteLink) + '" class="invitation-card-cta" target="_blank">' +
                    '¡Quiero Unirme! 🚀' +
                '</a>' +
            '</div>' +

            '<div class="invitation-card-footer">' +
                '<p class="invitation-card-footer-text">' +
                    'Powered by <strong>La Tanda</strong> • Ahorro Digital Seguro' +
                '</p>' +
            '</div>' +
        '</div>';
    }

    /**
     * Show invitation card modal
     */
    function showCardModal(options) {
        // Remove existing modal if any
        var existingModal = document.getElementById('invitationCardModal');
        if (existingModal) existingModal.remove();

        var cardHTML = generateCardHTML(options);
        var currentTheme = options.theme || 'purple';

        var modalHTML = '<div class="invitation-card-modal" id="invitationCardModal" onclick="InvitationCardGenerator.closeModal(event)">' +
            '<div class="invitation-card-modal-content" onclick="event.stopPropagation()">' +
                '<button class="invitation-card-modal-close" onclick="InvitationCardGenerator.closeModal()">&times;</button>' +

                '<div class="theme-selector" style="margin-bottom: 1rem;">' +
                    '<div class="theme-option purple ' + (currentTheme === 'purple' ? 'active' : '') + '" ' +
                         'onclick="InvitationCardGenerator.changeTheme(\'purple\')" title="Púrpura"></div>' +
                    '<div class="theme-option gold ' + (currentTheme === 'gold' ? 'active' : '') + '" ' +
                         'onclick="InvitationCardGenerator.changeTheme(\'gold\')" title="Dorado"></div>' +
                    '<div class="theme-option green ' + (currentTheme === 'green' ? 'active' : '') + '" ' +
                         'onclick="InvitationCardGenerator.changeTheme(\'green\')" title="Verde"></div>' +
                    '<div class="theme-option dark ' + (currentTheme === 'dark' ? 'active' : '') + '" ' +
                         'onclick="InvitationCardGenerator.changeTheme(\'dark\')" title="Oscuro"></div>' +
                '</div>' +

                cardHTML +

                '<div class="share-buttons-container">' +
                    '<button class="share-btn share-btn-whatsapp" onclick="InvitationCardGenerator.shareWhatsApp()">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
                        ' WhatsApp' +
                    '</button>' +
                    '<button class="share-btn share-btn-telegram" onclick="InvitationCardGenerator.shareTelegram()">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>' +
                        ' Telegram' +
                    '</button>' +
                    '<button class="share-btn share-btn-facebook" onclick="InvitationCardGenerator.shareFacebook()">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
                        ' Facebook' +
                    '</button>' +
                    '<button class="share-btn share-btn-copy" id="copyLinkBtn" onclick="InvitationCardGenerator.copyLink()">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
                        ' Copiar Link' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';

        // Store current options for theme changes
        window._currentCardOptions = options;
    }

    /**
     * Close the modal
     */
    function closeModal(event) {
        if (event && event.target && !event.target.classList.contains('invitation-card-modal')) {
            return;
        }
        var modal = document.getElementById('invitationCardModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }

    /**
     * Change card theme
     */
    function changeTheme(theme) {
        if (!window._currentCardOptions) return;

        window._currentCardOptions.theme = theme;

        // Update theme selector active state
        document.querySelectorAll('.theme-option').forEach(function(el) {
            el.classList.remove('active');
        });
        var themeEl = document.querySelector('.theme-option.' + theme);
        if (themeEl) themeEl.classList.add('active');

        // Regenerate card with new theme
        var cardContainer = document.getElementById('invitationCardPreview');
        if (cardContainer) {
            var newCard = generateCardHTML(window._currentCardOptions);
            cardContainer.outerHTML = newCard;
        }
    }

    /**
     * Generate share text
     */
    function generateShareText(options) {
        var frequencyLabel = {
            'weekly': 'semanal',
            'biweekly': 'quincenal',
            'monthly': 'mensual'
        }[options.frequency] || options.frequency;

        return '🌟 ¡Únete a ' + (options.groupName || 'nuestro grupo') + '!\n\n' +
            '💰 Aporte: L.' + (options.contribution?.toLocaleString() || 0) + ' ' + frequencyLabel + '\n' +
            '👥 ' + (options.members || 0) + '/' + (options.maxMembers || 10) + ' miembros\n\n' +
            '✨ Beneficios exclusivos:\n' +
            '🛒 Marketplace Social\n' +
            '🎰 Predictor de Lotería gratis\n' +
            '📊 Dashboard personal\n\n' +
            '👉 Únete aquí: ' + options.inviteLink + '\n\n' +
            'Powered by La Tanda ✨';
    }

    /**
     * Share via WhatsApp
     */
    function shareWhatsApp() {
        var options = window._currentCardOptions;
        if (!options) return;

        var text = generateShareText(options);
        var url = 'https://wa.me/?text=' + encodeURIComponent(text);
        window.open(url, '_blank');
    }

    /**
     * Share via Telegram
     */
    function shareTelegram() {
        var options = window._currentCardOptions;
        if (!options) return;

        var text = generateShareText(options);
        var url = 'https://t.me/share/url?url=' + encodeURIComponent(options.inviteLink) + '&text=' + encodeURIComponent(text);
        window.open(url, '_blank');
    }

    /**
     * Share via Facebook
     */
    function shareFacebook() {
        var options = window._currentCardOptions;
        if (!options) return;

        var url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(options.inviteLink);
        window.open(url, '_blank', 'width=600,height=400');
    }

    /**
     * Copy link to clipboard
     */
    function copyLink() {
        var options = window._currentCardOptions;
        if (!options || !options.inviteLink) return;

        navigator.clipboard.writeText(options.inviteLink).then(function() {
            var btn = document.getElementById('copyLinkBtn');
            if (btn) {
                btn.classList.add('copied');
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ¡Copiado!';
                setTimeout(function() {
                    btn.classList.remove('copied');
                    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copiar Link';
                }, 2000);
            }
        }).catch(function(err) {
            console.error('Error copying link:', err);
        });
    }

    // Export to global scope
    window.InvitationCardGenerator = {
        generate: generateCardHTML,
        show: showCardModal,
        closeModal: closeModal,
        changeTheme: changeTheme,
        shareWhatsApp: shareWhatsApp,
        shareTelegram: shareTelegram,
        shareFacebook: shareFacebook,
        copyLink: copyLink,
        THEMES: THEMES,
        BENEFITS: BENEFITS
    };

})();
