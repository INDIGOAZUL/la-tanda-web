/**
 * Admin Role Management Dashboard
 * Issue #13 - La Tanda Web
 * Handles all role management functionality
 */

class RoleManagementDashboard {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentTab = 'applications';
        this.selectedApplications = new Set();
        this.currentApplication = null;
        this.currentAction = null;
        this.refreshInterval = null;

        this.init();
    }

    async init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    checkAuth() {
        const token = localStorage.getItem('latanda_auth_token');
        if (!token) {
            window.location.href = '/auth-enhanced.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }

        const user = JSON.parse(localStorage.getItem('latanda_user') || '{}');
        const adminName = user.name || 'Admin';
        document.getElementById('adminName').textContent = adminName;
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshCurrentTab());

        // Applications filters
        document.getElementById('statusFilter').addEventListener('change', () => this.loadApplications());
        document.getElementById('roleFilter').addEventListener('change', () => this.loadApplications());
        document.getElementById('bulkApproveBtn').addEventListener('click', () => this.bulkApprove());

        // Users filters
        document.getElementById('userSearch').addEventListener('input', this.debounce(() => this.loadUsers(), 500));
        document.getElementById('userRoleFilter').addEventListener('change', () => this.loadUsers());

        // Assign role form
        document.getElementById('assignRoleForm').addEventListener('submit', (e) => this.handleAssignRole(e));

        // Audit filters
        document.getElementById('auditMethodFilter').addEventListener('change', () => this.loadAuditLogs());
        document.getElementById('auditStartDate').addEventListener('change', () => this.loadAuditLogs());
        document.getElementById('auditEndDate').addEventListener('change', () => this.loadAuditLogs());
        document.getElementById('exportAuditBtn').addEventListener('click', () => this.exportAuditLogs());

        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        document.getElementById('approveBtn').addEventListener('click', () => this.openNoteModal('approve'));
        document.getElementById('rejectBtn').addEventListener('click', () => this.openNoteModal('reject'));
        document.getElementById('submitReviewBtn').addEventListener('click', () => this.submitReview());

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Load tab data
        this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'applications':
                await this.loadApplications();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'audit':
                await this.loadAuditLogs();
                break;
            case 'stats':
                await this.loadStats();
                break;
        }
    }

    async loadInitialData() {
        await this.loadApplications();
        await this.updatePendingBadge();
    }

    async refreshCurrentTab() {
        const btn = document.getElementById('refreshBtn');
        btn.classList.add('spinning');

        await this.loadTabData(this.currentTab);
        await this.updatePendingBadge();

        setTimeout(() => btn.classList.remove('spinning'), 500);
        this.showToast('Datos actualizados', 'success');
    }

    startAutoRefresh() {
        // Auto-refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.updatePendingBadge();
            if (this.currentTab === 'applications') {
                this.loadApplications();
            }
        }, 30000);
    }

    async updatePendingBadge() {
        try {
            const response = await this.apiRequest('/api/admin/roles/stats');
            if (response.success) {
                const badge = document.getElementById('pendingBadge');
                badge.textContent = response.stats.pendingApplications;
                badge.style.display = response.stats.pendingApplications > 0 ? 'inline-block' : 'none';
            }
        } catch (error) {
            console.error('Error updating badge:', error);
        }
    }

    async loadApplications(offset = 0) {
        const status = document.getElementById('statusFilter').value;
        const role = document.getElementById('roleFilter').value;
        const limit = 50;

        const params = new URLSearchParams({ limit, offset });
        if (status) params.append('status', status);
        if (role) params.append('role', role);

        try {
            const response = await this.apiRequest(`/api/admin/roles/applications?${params}`);

            if (response.success) {
                this.renderApplications(response.applications);
                this.renderPagination('applicationsPagination', response.pagination, (newOffset) => this.loadApplications(newOffset));
            }
        } catch (error) {
            this.showError('Error al cargar solicitudes');
        }
    }

    renderApplications(applications) {
        const container = document.getElementById('applicationsList');

        if (applications.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No hay solicitudes</p></div>';
            return;
        }

        container.innerHTML = applications.map(app => `
            <div class="application-card ${app.status}" data-id="${app.id}">
                <div class="app-header">
                    <div class="app-user">
                        <i class="fas fa-user-circle"></i>
                        <div>
                            <strong>${this.escapeHtml(app.user_name)}</strong>
                            <small>${this.escapeHtml(app.user_email)}</small>
                        </div>
                    </div>
                    <div class="app-status">
                        <span class="status-badge ${app.status}">${this.getStatusText(app.status)}</span>
                    </div>
                </div>
                <div class="app-body">
                    <div class="app-roles">
                        <span class="role-badge">${this.getRoleText(app.current_role)}</span>
                        <i class="fas fa-arrow-right"></i>
                        <span class="role-badge highlight">${this.getRoleText(app.requested_role)}</span>
                    </div>
                    <div class="app-reason">
                        <strong>Razón:</strong>
                        <p>${this.escapeHtml(app.reason)}</p>
                    </div>
                    ${app.review_note ? `
                        <div class="app-review">
                            <strong>Nota de revisión:</strong>
                            <p>${this.escapeHtml(app.review_note)}</p>
                            <small>Por ${this.escapeHtml(app.reviewer_name)} - ${this.formatDate(app.reviewed_at)}</small>
                        </div>
                    ` : ''}
                </div>
                <div class="app-footer">
                    <small><i class="fas fa-clock"></i> ${this.formatDate(app.created_at)}</small>
                    ${app.status === 'pending' ? `
                        <div class="app-actions">
                            <input type="checkbox" class="app-checkbox" data-id="${app.id}">
                            <button class="btn-sm btn-success" onclick="dashboard.reviewApplication('${app.id}')">
                                <i class="fas fa-eye"></i> Revisar
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Setup checkbox listeners
        container.querySelectorAll('.app-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedApplications.add(e.target.dataset.id);
                } else {
                    this.selectedApplications.delete(e.target.dataset.id);
                }
                document.getElementById('bulkApproveBtn').disabled = this.selectedApplications.size === 0;
            });
        });
    }

    async reviewApplication(id) {
        try {
            const response = await this.apiRequest(`/api/admin/roles/applications?user_id=${id}`);
            const app = response.applications.find(a => a.id === id);

            if (!app) {
                this.showError('Solicitud no encontrada');
                return;
            }

            this.currentApplication = app;

            const modalBody = document.getElementById('reviewModalBody');
            modalBody.innerHTML = `
                <div class="review-details">
                    <div class="detail-row">
                        <strong>Usuario:</strong>
                        <span>${this.escapeHtml(app.user_name)} (${this.escapeHtml(app.user_email)})</span>
                    </div>
                    <div class="detail-row">
                        <strong>Rol actual:</strong>
                        <span class="role-badge">${this.getRoleText(app.current_role)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Rol solicitado:</strong>
                        <span class="role-badge highlight">${this.getRoleText(app.requested_role)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Razón:</strong>
                        <p>${this.escapeHtml(app.reason)}</p>
                    </div>
                    <div class="detail-row">
                        <strong>Fecha de solicitud:</strong>
                        <span>${this.formatDate(app.created_at)}</span>
                    </div>
                </div>
            `;

            document.getElementById('reviewModal').classList.add('show');
        } catch (error) {
            this.showError('Error al cargar solicitud');
        }
    }

    openNoteModal(action) {
        this.currentAction = action;
        document.getElementById('noteModalTitle').textContent =
            action === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud';
        document.getElementById('reviewNote').value = '';
        document.getElementById('noteModal').classList.add('show');
    }

    async submitReview() {
        const note = document.getElementById('reviewNote').value.trim();

        if (!note) {
            this.showError('Por favor ingrese una nota');
            return;
        }

        if (!this.currentApplication) return;

        try {
            const endpoint = `/api/admin/roles/applications/${this.currentApplication.id}/${this.currentAction}`;
            const response = await this.apiRequest(endpoint, 'PUT', { review_note: note });

            if (response.success) {
                this.showToast(`Solicitud ${this.currentAction === 'approve' ? 'aprobada' : 'rechazada'}`, 'success');
                this.closeModal();
                await this.loadApplications();
                await this.updatePendingBadge();
            }
        } catch (error) {
            this.showError('Error al procesar solicitud');
        }
    }

    async bulkApprove() {
        if (this.selectedApplications.size === 0) return;

        if (!confirm(`¿Aprobar ${this.selectedApplications.size} solicitudes?`)) return;

        const note = prompt('Nota de aprobación (opcional):') || 'Aprobación masiva';

        try {
            const promises = Array.from(this.selectedApplications).map(id =>
                this.apiRequest(`/api/admin/roles/applications/${id}/approve`, 'PUT', { review_note: note })
            );

            await Promise.all(promises);

            this.showToast(`${this.selectedApplications.size} solicitudes aprobadas`, 'success');
            this.selectedApplications.clear();
            await this.loadApplications();
            await this.updatePendingBadge();
        } catch (error) {
            this.showError('Error en aprobación masiva');
        }
    }

    async loadUsers(offset = 0) {
        const search = document.getElementById('userSearch').value;
        const role = document.getElementById('userRoleFilter').value;
        const limit = 50;

        const params = new URLSearchParams({ limit, offset });
        if (search) params.append('search', search);
        if (role) params.append('role', role);

        try {
            const response = await this.apiRequest(`/api/admin/roles/users?${params}`);

            if (response.success) {
                this.renderUsers(response.users);
                this.renderPagination('usersPagination', response.pagination, (newOffset) => this.loadUsers(newOffset));
            }
        } catch (error) {
            this.showError('Error al cargar usuarios');
        }
    }

    renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No se encontraron usuarios</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="user-cell">
                        <i class="fas fa-user-circle"></i>
                        <strong>${this.escapeHtml(user.name)}</strong>
                    </div>
                </td>
                <td>${this.escapeHtml(user.email || 'N/A')}</td>
                <td><span class="role-badge">${this.getRoleText(user.role)}</span></td>
                <td>${this.formatDate(user.created_at)}</td>
                <td><span class="status-badge ${user.status}">${user.status}</span></td>
                <td>
                    <button class="btn-sm btn-primary" onclick="dashboard.quickAssignRole('${user.id}', '${user.role}')">
                        <i class="fas fa-user-tag"></i> Cambiar Rol
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async quickAssignRole(userId, currentRole) {
        const newRole = prompt(`Rol actual: ${this.getRoleText(currentRole)}\n\nNuevo rol (user, verified_user, active_member, coordinator, moderator, admin):`);

        if (!newRole) return;

        const reason = prompt('Razón del cambio:');
        if (!reason) return;

        try {
            const response = await this.apiRequest('/api/admin/roles/assign', 'POST', {
                user_id: userId,
                new_role: newRole,
                reason
            });

            if (response.success) {
                this.showToast('Rol asignado correctamente', 'success');
                await this.loadUsers();
            }
        } catch (error) {
            this.showError('Error al asignar rol');
        }
    }

    async handleAssignRole(e) {
        e.preventDefault();

        const userId = document.getElementById('assignUserId').value.trim();
        const newRole = document.getElementById('assignRole').value;
        const reason = document.getElementById('assignReason').value.trim();

        try {
            const response = await this.apiRequest('/api/admin/roles/assign', 'POST', {
                user_id: userId,
                new_role: newRole,
                reason
            });

            if (response.success) {
                this.showToast('Rol asignado correctamente', 'success');
                document.getElementById('assignRoleForm').reset();
            }
        } catch (error) {
            this.showError('Error al asignar rol');
        }
    }

    async loadAuditLogs(offset = 0) {
        const method = document.getElementById('auditMethodFilter').value;
        const startDate = document.getElementById('auditStartDate').value;
        const endDate = document.getElementById('auditEndDate').value;
        const limit = 100;

        const params = new URLSearchParams({ limit, offset });
        if (method) params.append('method', method);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        try {
            const response = await this.apiRequest(`/api/admin/roles/audit-logs?${params}`);

            if (response.success) {
                this.renderAuditLogs(response.logs);
                this.renderPagination('auditPagination', response.pagination, (newOffset) => this.loadAuditLogs(newOffset));
            }
        } catch (error) {
            this.showError('Error al cargar registros');
        }
    }

    renderAuditLogs(logs) {
        const tbody = document.getElementById('auditTableBody');

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay registros</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${this.formatDate(log.created_at)}</td>
                <td>${this.escapeHtml(log.user_name)}</td>
                <td><span class="role-badge">${this.getRoleText(log.previous_role)}</span></td>
                <td><span class="role-badge highlight">${this.getRoleText(log.new_role)}</span></td>
                <td><span class="method-badge ${log.change_method}">${this.getMethodText(log.change_method)}</span></td>
                <td>${this.escapeHtml(log.admin_name || 'Sistema')}</td>
                <td>${this.escapeHtml(log.reason || 'N/A')}</td>
            </tr>
        `).join('');
    }

    async exportAuditLogs() {
        const startDate = document.getElementById('auditStartDate').value;
        const endDate = document.getElementById('auditEndDate').value;

        const params = new URLSearchParams({ format: 'csv' });
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        try {
            const token = localStorage.getItem('latanda_auth_token');
            const url = `${this.API_BASE}/api/admin/roles/export?${params}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `audit_logs_${Date.now()}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);

                this.showToast('Exportación completada', 'success');
            }
        } catch (error) {
            this.showError('Error al exportar');
        }
    }

    async loadStats() {
        try {
            const response = await this.apiRequest('/api/admin/roles/stats');

            if (response.success) {
                const stats = response.stats;

                document.getElementById('statPendingApps').textContent = stats.pendingApplications;
                document.getElementById('statRecentChanges').textContent = stats.recentChanges;

                const approvalRate = stats.approvalRate.total > 0
                    ? Math.round((stats.approvalRate.approved / stats.approvalRate.total) * 100)
                    : 0;
                document.getElementById('statApprovalRate').textContent = approvalRate + '%';

                const totalUsers = stats.roleDistribution.reduce((sum, r) => sum + parseInt(r.count), 0);
                document.getElementById('statTotalUsers').textContent = totalUsers;

                this.renderRoleDistribution(stats.roleDistribution);
            }
        } catch (error) {
            this.showError('Error al cargar estadísticas');
        }
    }

    renderRoleDistribution(distribution) {
        const container = document.getElementById('roleDistribution');
        const total = distribution.reduce((sum, r) => sum + parseInt(r.count), 0);

        container.innerHTML = distribution.map(role => {
            const percentage = total > 0 ? Math.round((role.count / total) * 100) : 0;
            return `
                <div class="role-stat">
                    <div class="role-stat-header">
                        <span class="role-badge">${this.getRoleText(role.role)}</span>
                        <strong>${role.count}</strong>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <small>${percentage}%</small>
                </div>
            `;
        }).join('');
    }

    renderPagination(containerId, pagination, callback) {
        const container = document.getElementById(containerId);

        if (pagination.total <= pagination.limit) {
            container.innerHTML = '';
            return;
        }

        const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
        const totalPages = Math.ceil(pagination.total / pagination.limit);

        let html = '<div class="pagination-controls">';

        if (currentPage > 1) {
            html += `<button class="page-btn" data-offset="${(currentPage - 2) * pagination.limit}">Anterior</button>`;
        }

        html += `<span class="page-info">Página ${currentPage} de ${totalPages}</span>`;

        if (pagination.hasMore) {
            html += `<button class="page-btn" data-offset="${currentPage * pagination.limit}">Siguiente</button>`;
        }

        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => callback(parseInt(btn.dataset.offset)));
        });
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        this.currentApplication = null;
        this.currentAction = null;
    }

    async apiRequest(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('latanda_auth_token');

        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(this.API_BASE + endpoint, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    getRoleText(role) {
        const roles = {
            'user': 'Usuario',
            'verified_user': 'Usuario Verificado',
            'active_member': 'Miembro Activo',
            'coordinator': 'Coordinador',
            'moderator': 'Moderador',
            'admin': 'Administrador',
            'administrator': 'Administrador Principal',
            'super_admin': 'Super Admin'
        };
        return roles[role] || role;
    }

    getStatusText(status) {
        const statuses = {
            'pending': 'Pendiente',
            'approved': 'Aprobada',
            'rejected': 'Rechazada'
        };
        return statuses[status] || status;
    }

    getMethodText(method) {
        const methods = {
            'auto': 'Automático',
            'application': 'Solicitud',
            'manual': 'Manual'
        };
        return methods[method] || method;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('es-HN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize dashboard
const dashboard = new RoleManagementDashboard();
