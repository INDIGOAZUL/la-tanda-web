/**
 * Admin Reports - Content Moderation Interface
 * Manages content reports and moderation actions
 */

const AdminReports = {
    currentStatus: 'pending',
    currentPage: 1,
    limit: 20,
    reports: [],
    stats: {},

    init() {
        this.loadStats();
        this.loadReports();
        this.attachHandlers();
    },

    attachHandlers() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const status = e.currentTarget.dataset.status;
                this.switchTab(status);
            });
        });

        // Refresh button
        const btnRefresh = document.getElementById('btnRefresh');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => this.refresh());
        }

        // Pagination
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        if (btnPrev) {
            btnPrev.addEventListener('click', () => this.prevPage());
        }
        if (btnNext) {
            btnNext.addEventListener('click', () => this.nextPage());
        }

        // Modal close
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.closeModal());
        }
    },

    async loadStats() {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            // Load stats for all statuses
            const statuses = ['pending', 'reviewed', 'dismissed', 'actioned'];
            const promises = statuses.map(status =>
                fetch(`/api/admin/reports?status=${status}&limit=1`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.json())
            );

            const results = await Promise.all(promises);

            statuses.forEach((status, i) => {
                if (results[i].success && results[i].data) {
                    const total = results[i].data.pagination?.total || 0;
                    this.stats[status] = total;

                    const statEl = document.getElementById(`stat${this.capitalize(status)}`);
                    if (statEl) statEl.textContent = total;

                    if (status === 'pending') {
                        const badgeEl = document.getElementById('badgePending');
                        if (badgeEl) badgeEl.textContent = total;
                    }
                }
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    async loadReports() {
        const listEl = document.getElementById('reportsList');
        if (!listEl) return;

        listEl.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><span>Cargando reportes...</span></div>';

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            const offset = (this.currentPage - 1) * this.limit;
            const response = await fetch(`/api/admin/reports?status=${this.currentStatus}&limit=${this.limit}&offset=${offset}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al cargar reportes');
            }

            this.reports = result.data.reports || [];
            const pagination = result.data.pagination || {};

            if (this.reports.length === 0) {
                listEl.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><span>No hay reportes en esta categoría</span></div>';
                document.getElementById('pagination').style.display = 'none';
                return;
            }

            listEl.innerHTML = this.reports.map(report => this.renderReportCard(report)).join('');

            // Update pagination
            this.updatePagination(pagination);

            // Attach click handlers to cards
            listEl.querySelectorAll('.report-card').forEach(card => {
                card.addEventListener('click', () => {
                    const reportId = card.dataset.reportId;
                    const report = this.reports.find(r => r.id === reportId);
                    if (report) this.openReportDetail(report);
                });
            });

        } catch (error) {
            console.error('Error loading reports:', error);
            listEl.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><span>Error al cargar reportes</span></div>';
        }
    },

    renderReportCard(report) {
        const reasonLabels = {
            spam: 'Spam',
            harassment: 'Acoso',
            inappropriate: 'Inapropiado',
            misinformation: 'Desinformación',
            other: 'Otro'
        };

        const contentType = report.content_type === 'post' ? 'Publicación' : 'Comentario';
        const contentPreview = this.escapeHtml(report.content_preview || '(sin contenido)');
        const timeAgo = this.getTimeAgo(report.created_at);

        return `
            <div class="report-card" data-report-id="${this.escapeHtml(report.id)}">
                <div class="report-card-header">
                    <div class="report-meta">
                        <span class="report-id">#${this.escapeHtml(report.id.substring(0, 8))}</span>
                        <span class="report-reason">
                            <i class="fas fa-flag"></i>
                            ${reasonLabels[report.reason] || report.reason}
                        </span>
                        <span class="report-time">
                            <i class="far fa-clock"></i> ${timeAgo}
                        </span>
                    </div>
                    <span class="report-badge ${report.status}">${this.capitalize(report.status)}</span>
                </div>
                <div class="report-card-body">
                    <div class="report-content-type">
                        <i class="fas fa-${report.content_type === 'post' ? 'comment-alt' : 'reply'}"></i>
                        ${contentType}
                    </div>
                    <div class="report-content-preview">${contentPreview}</div>
                    ${report.description ? `<div class="report-description">"${this.escapeHtml(report.description)}"</div>` : ''}
                </div>
                <div class="report-card-footer">
                    <div class="reporter-info">
                        <i class="fas fa-user"></i>
                        Reportado por: ${this.escapeHtml(report.reporter_name || 'Usuario')}
                    </div>
                </div>
            </div>
        `;
    },

    openReportDetail(report) {
        const modal = document.getElementById('reportDetailModal');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');
        if (!modal || !modalBody || !modalFooter) return;

        const reasonLabels = {
            spam: 'Spam o contenido engañoso',
            harassment: 'Acoso o intimidación',
            inappropriate: 'Contenido inapropiado',
            misinformation: 'Desinformación',
            other: 'Otro'
        };

        const contentType = report.content_type === 'post' ? 'Publicación' : 'Comentario';

        modalBody.innerHTML = `
            <div class="detail-section">
                <h4>Información del Reporte</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">ID</span>
                        <span class="detail-value">${this.escapeHtml(report.id)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estado</span>
                        <span class="detail-value">
                            <span class="report-badge ${report.status}">${this.capitalize(report.status)}</span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Tipo de Contenido</span>
                        <span class="detail-value">${contentType}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Razón</span>
                        <span class="detail-value">${reasonLabels[report.reason] || report.reason}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Reportado por</span>
                        <span class="detail-value">${this.escapeHtml(report.reporter_name || 'Usuario')} (${this.escapeHtml(report.reporter_email || '')})</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha</span>
                        <span class="detail-value">${new Date(report.created_at).toLocaleString('es-HN')}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>Contenido Reportado</h4>
                <div class="detail-content">${this.escapeHtml(report.content_preview || '(sin contenido)')}</div>
            </div>

            ${report.description ? `
                <div class="detail-section">
                    <h4>Descripción del Reporte</h4>
                    <div class="detail-content">${this.escapeHtml(report.description)}</div>
                </div>
            ` : ''}

            ${report.resolution_note ? `
                <div class="detail-section">
                    <h4>Nota de Resolución</h4>
                    <div class="detail-content">${this.escapeHtml(report.resolution_note)}</div>
                </div>
            ` : ''}
        `;

        // Show action buttons only for pending reports
        if (report.status === 'pending') {
            modalFooter.innerHTML = `
                <textarea class="resolution-note" id="resolutionNote" placeholder="Nota de resolución (opcional)"></textarea>
                <button class="btn-action btn-dismiss" onclick="AdminReports.resolveReport('${report.id}', 'dismiss')">
                    <i class="fas fa-times"></i> Desestimar
                </button>
                <button class="btn-action btn-warn" onclick="AdminReports.resolveReport('${report.id}', 'warn')">
                    <i class="fas fa-exclamation-triangle"></i> Advertir
                </button>
                <button class="btn-action btn-hide" onclick="AdminReports.resolveReport('${report.id}', 'hide')">
                    <i class="fas fa-eye-slash"></i> Ocultar Contenido
                </button>
            `;
        } else {
            modalFooter.innerHTML = `
                <button class="btn-action btn-dismiss" onclick="AdminReports.closeModal()">
                    Cerrar
                </button>
            `;
        }

        modal.style.display = 'flex';
    },

    async resolveReport(reportId, action) {
        const noteEl = document.getElementById('resolutionNote');
        const note = noteEl ? noteEl.value.trim() : '';

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            if (!token) {
                alert('Debes iniciar sesión');
                return;
            }

            const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: action,
                    resolution_note: note || null
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al resolver reporte');
            }

            alert('Reporte resuelto exitosamente');
            this.closeModal();
            this.refresh();

        } catch (error) {
            console.error('Error resolving report:', error);
            alert('Error al resolver el reporte: ' + error.message);
        }
    },

    closeModal() {
        const modal = document.getElementById('reportDetailModal');
        if (modal) modal.style.display = 'none';
    },

    switchTab(status) {
        this.currentStatus = status;
        this.currentPage = 1;

        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.status === status);
        });

        this.loadReports();
    },

    updatePagination(pagination) {
        const paginationEl = document.getElementById('pagination');
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        const pageInfo = document.getElementById('pageInfo');

        if (!paginationEl) return;

        const total = pagination.total || 0;
        const totalPages = Math.ceil(total / this.limit);

        if (totalPages <= 1) {
            paginationEl.style.display = 'none';
            return;
        }

        paginationEl.style.display = 'flex';

        if (btnPrev) btnPrev.disabled = this.currentPage === 1;
        if (btnNext) btnNext.disabled = this.currentPage >= totalPages;
        if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
    },

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadReports();
        }
    },

    nextPage() {
        this.currentPage++;
        this.loadReports();
    },

    refresh() {
        this.loadStats();
        this.loadReports();
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Hace un momento';
        if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
        if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
        if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} días`;
        return date.toLocaleDateString('es-HN');
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    AdminReports.init();
});
