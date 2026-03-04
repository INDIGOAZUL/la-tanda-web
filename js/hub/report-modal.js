/**
 * Content Report Modal - Frontend Component
 * Issue #51 - La Tanda Web
 *
 * Adds report functionality to social feed posts and comments
 */

// Add to social-feed.js or create as separate module

const ReportModal = {
    currentReportTarget: null, // { type: 'post'|'comment', id: UUID }

    init() {
        this.createModal();
        this.attachHandlers();
    },

    createModal() {
        const modalHTML = `
            <div id="reportModal" class="report-modal" style="display: none;">
                <div class="report-modal-overlay"></div>
                <div class="report-modal-content">
                    <div class="report-modal-header">
                        <h3>Reportar Contenido</h3>
                        <button class="report-modal-close" id="reportModalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="report-modal-body">
                        <p class="report-modal-description">
                            ¿Por qué estás reportando este contenido?
                        </p>
                        <select id="reportReason" class="report-reason-select">
                            <option value="">Selecciona una razón</option>
                            <option value="spam">Spam o contenido engañoso</option>
                            <option value="harassment">Acoso o intimidación</option>
                            <option value="inappropriate">Contenido inapropiado</option>
                            <option value="misinformation">Desinformación</option>
                            <option value="other">Otro</option>
                        </select>
                        <textarea
                            id="reportDescription"
                            class="report-description-textarea"
                            placeholder="Descripción adicional (opcional)"
                            maxlength="500"
                        ></textarea>
                        <div class="report-char-count">
                            <span id="reportCharCount">0</span>/500
                        </div>
                    </div>
                    <div class="report-modal-footer">
                        <button class="report-cancel-btn" id="reportCancelBtn">
                            Cancelar
                        </button>
                        <button class="report-submit-btn" id="reportSubmitBtn">
                            Enviar Reporte
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insert modal into DOM
        if (!document.getElementById('reportModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    },

    attachHandlers() {
        const modal = document.getElementById('reportModal');
        const overlay = modal?.querySelector('.report-modal-overlay');
        const closeBtn = document.getElementById('reportModalClose');
        const cancelBtn = document.getElementById('reportCancelBtn');
        const submitBtn = document.getElementById('reportSubmitBtn');
        const textarea = document.getElementById('reportDescription');
        const charCount = document.getElementById('reportCharCount');

        if (overlay) overlay.addEventListener('click', () => this.close());
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());
        if (submitBtn) submitBtn.addEventListener('click', () => this.submit());

        if (textarea && charCount) {
            textarea.addEventListener('input', () => {
                charCount.textContent = textarea.value.length;
            });
        }
    },

    open(type, id) {
        this.currentReportTarget = { type, id };
        const modal = document.getElementById('reportModal');
        if (modal) {
            modal.style.display = 'flex';
            // Reset form
            document.getElementById('reportReason').value = '';
            document.getElementById('reportDescription').value = '';
            document.getElementById('reportCharCount').textContent = '0';
        }
    },

    close() {
        const modal = document.getElementById('reportModal');
        if (modal) {
            modal.style.display = 'none';
            this.currentReportTarget = null;
        }
    },

    async submit() {
        const reason = document.getElementById('reportReason').value;
        const description = document.getElementById('reportDescription').value;
        const submitBtn = document.getElementById('reportSubmitBtn');

        if (!reason) {
            alert('Por favor selecciona una razón para el reporte');
            return;
        }

        if (!this.currentReportTarget) {
            alert('Error: No se pudo identificar el contenido a reportar');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            const body = {
                reason,
                description: description || null
            };

            if (this.currentReportTarget.type === 'post') {
                body.event_id = this.currentReportTarget.id;
            } else {
                body.comment_id = this.currentReportTarget.id;
            }

            const response = await fetch('https://latanda.online/api/feed/social/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.close();
                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showSuccess('Reporte enviado exitosamente');
                } else {
                    alert('Reporte enviado exitosamente. Nuestro equipo lo revisará pronto.');
                }
            } else {
                throw new Error(data.error || 'Error al enviar el reporte');
            }

        } catch (error) {
            console.error('Error submitting report:', error);
            if (window.LaTandaPopup) {
                window.LaTandaPopup.showError(error.message || 'Error al enviar el reporte');
            } else {
                alert(error.message || 'Error al enviar el reporte. Intenta de nuevo.');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Reporte';
        }
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ReportModal.init());
} else {
    ReportModal.init();
}

// Export for use in social-feed.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportModal;
}
