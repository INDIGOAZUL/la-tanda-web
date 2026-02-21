
// ============================================
// MEMBER MANAGEMENT FRONTEND
// ============================================

// XSS prevention helper
function _mmEscapeHtml(text) {
    if (text == null) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// CSS Styles for Member Management
const memberManagementStyles = `
<style>
/* Coordinator Badge */
.badge-role.coordinator, .badge-role.admin, .badge-role.creator {
    background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
    color: white !important;
    font-weight: 600;
}

.badge-role.member {
    background: linear-gradient(135deg, #10b981, #059669) !important;
    color: white !important;
}

/* Pending Count Badge */
.pending-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: #ef4444;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 6px;
    animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* Member Management Modal */
.member-management-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
}

.member-management-content {
    background: var(--tanda-darker, #1a1a2e);
    border-radius: 16px;
    max-width: 700px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    border: 1px solid var(--tanda-cyan, #00d9ff);
    box-shadow: 0 25px 50px -12px rgba(0, 217, 255, 0.25);
}

.member-management-header {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    background: var(--tanda-darker, #1a1a2e);
    z-index: 10;
}

.member-management-header h2 {
    margin: 0;
    color: var(--tanda-cyan, #00d9ff);
    font-size: 1.25rem;
}

.close-member-modal {
    background: transparent;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
}

.close-member-modal:hover {
    color: #ef4444;
}

.member-management-tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
}

.member-tab {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
}

.member-tab:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
}

.member-tab.active {
    color: var(--tanda-cyan, #00d9ff);
    border-bottom-color: var(--tanda-cyan, #00d9ff);
    background: rgba(0, 217, 255, 0.1);
}

.member-management-body {
    padding: 20px 24px;
}

/* Member List */
.member-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.member-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s;
}

.member-item:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(0, 217, 255, 0.3);
}

.member-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--tanda-cyan), var(--tanda-purple, #a855f7));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: white;
    flex-shrink: 0;
}

.member-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.member-info {
    flex: 1;
    min-width: 0;
}

.member-name {
    font-weight: 600;
    color: white;
    margin-bottom: 4px;
}

.member-email {
    font-size: 0.85rem;
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-meta {
    font-size: 0.8rem;
    color: #666;
    margin-top: 4px;
}

.member-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

.btn-approve {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-approve:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-reject, .btn-remove {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-reject:hover,
.role-select {
    padding: 6px 10px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    background: rgba(0,0,0,0.3);
    color: #fff;
    font-size: 0.85rem;
    cursor: pointer;
    margin-right: 8px;
}

.role-select:hover {
    border-color: var(--tanda-cyan, #00d9ff);
}

.member-actions-extended {
    display: flex;
    align-items: center;
    gap: 8px;
}

.creator-badge {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #000;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}


.btn-remove:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.empty-state-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.5;
}

.empty-state-text {
    font-size: 1rem;
    color: #888;
}

/* Confirmation Dialog */
.confirm-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
}

.confirm-dialog-content {
    background: var(--tanda-darker, #1a1a2e);
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.confirm-dialog h3 {
    margin: 0 0 16px;
    color: white;
}

.confirm-dialog p {
    color: #888;
    margin-bottom: 20px;
}

.confirm-dialog textarea {
    width: 100%;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    resize: vertical;
    min-height: 80px;
    margin-bottom: 16px;
}

.confirm-dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.btn-cancel {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #888;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
}

.btn-cancel:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
}

/* Coordinator Action Button in Card */
.btn-manage-members {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.btn-manage-members:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', memberManagementStyles);

// ============================================
// MEMBER MANAGEMENT CLASS
// ============================================
class MemberManagement {
    constructor() {
        this.currentGroupId = null;
        this.pendingMembers = [];
        this.activeMembers = [];
        this.isCoordinator = false;
    }

    // XSS prevention helper
    escapeHtml(text) {
        return _mmEscapeHtml(text);
    }

    // Check if current user is coordinator of a group
    async checkCoordinatorStatus(groupId, userId) {
        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
            var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            const response = await fetch(`${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members`, { headers: headers });
            // If we get a 403, user is not coordinator
            // If we get success or 404, user IS coordinator
            return response.status !== 403;
        } catch (err) {
            return false;
        }
    }

    // Fetch pending members for a group (uses /members endpoint and filters by status)
    async fetchPendingMembers(groupId) {
        try {
            const url = `${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members`;
            const response = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '') }
            });
            const data = await response.json();
            if (data.success) {
                const allMembers = data.data.members || data.data || [];
                // Filter only pending members and map to expected format
                this.pendingMembers = allMembers
                    .filter(m => m.status === 'pending')
                    .map(m => ({
                        user_id: m.user_id,
                        user_name: m.name || m.display_name,
                        display_name: m.display_name || m.name,
                        user_email: m.email,
                        profile_image_url: m.avatar_url,
                        requested_at: m.joined_at
                    }));
                return this.pendingMembers;
            }
            return [];
        } catch (err) {
            return [];
        }
    }

    // Fetch active members for a group
    async fetchActiveMembers(groupId) {
        try {
            const response = await fetch(`${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members`, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '') }
            });
            const data = await response.json();
            if (data.success) {
                this.activeMembers = data.data.members || data.data || [];
                return this.activeMembers;
            }
            return [];
        } catch (err) {
            return [];
        }
    }

    // Fetch group approval settings
    async fetchGroupSettings(groupId) {
        try {
            const apiBase = window.API_BASE_URL || 'https://latanda.online';
            const response = await fetch(`${apiBase}/api/groups/${encodeURIComponent(groupId)}/settings`, {
                headers: {
                    'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '')
                }
            });
            const data = await response.json();
            if (data.success && data.data) {
                this.groupSettings = data.data.approval_settings || {};
            } else {
                this.groupSettings = {};
            }
        } catch (err) {
            this.groupSettings = {};
        }
    }

    // Approve a pending member
    async approveMember(groupId, memberId, position = null) {
        const coordinatorId = localStorage.getItem('user_id');
        try {
            const response = await fetch(`${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '') },
                body: JSON.stringify({ coordinator_id: coordinatorId, position })
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Miembro aprobado exitosamente', 'success');
                return true;
            } else {
                showNotification('Error al aprobar miembro', 'error');
                return false;
            }
        } catch (err) {
            showNotification('Error de conexion', 'error');
            return false;
        }
    }

    // Reject a pending member
    async rejectMember(groupId, memberId, reason = '') {
        const coordinatorId = localStorage.getItem('user_id');
        try {
            const response = await fetch(`${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '') },
                body: JSON.stringify({ coordinator_id: coordinatorId, reason })
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Solicitud rechazada', 'success');
                return true;
            } else {
                showNotification('Error al rechazar solicitud', 'error');
                return false;
            }
        } catch (err) {
            showNotification('Error de conexion', 'error');
            return false;
        }
    }

    // Remove an active member
    async removeMember(groupId, memberId, reason = '') {
        const coordinatorId = localStorage.getItem('user_id');
        try {
            const response = await fetch(`${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/remove?coordinator_id=${encodeURIComponent(coordinatorId)}&reason=${encodeURIComponent(reason)}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Miembro removido exitosamente', 'success');
                return true;
            } else {
                showNotification('Error al remover miembro', 'error');
                return false;
            }
        } catch (err) {
            showNotification('Error de conexion', 'error');
            return false;
        }
    }

    // Open member management modal
    async openModal(groupId, groupName) {
        this.currentGroupId = groupId;

        try {
            // Fetch data (all have internal try/catch)
            await Promise.all([
                this.fetchPendingMembers(groupId),
                this.fetchActiveMembers(groupId),
                this.fetchGroupSettings(groupId)
            ]);
        } catch (err) {
            // Prevent unhandled rejection from triggering global-error-handler logout
        }

        const modal = document.createElement('div');
        modal.className = 'member-management-modal';
        modal.id = 'memberManagementModal';

        var pendingHtml = '', activeHtml = '';
        try { pendingHtml = this.renderPendingMembers(); } catch(e) { pendingHtml = '<p style="color:#94a3b8;padding:16px">Error al cargar solicitudes</p>'; }
        try { activeHtml = this.renderActiveMembers(); } catch(e) { activeHtml = '<p style="color:#94a3b8;padding:16px">Error al cargar miembros</p>'; }

        modal.innerHTML = `
            <div class="member-management-content">
                <div class="member-management-header">
                    <h2>Gestion de Miembros - ${this.escapeHtml(groupName)}</h2>
                    <button class="close-member-modal" data-action="mm-close">&times;</button>
                </div>
                <div class="member-management-tabs">
                    <button class="member-tab active" data-action="mm-switch-tab" data-tab="pending">
                        Solicitudes Pendientes
                        ${this.pendingMembers.length > 0 ? `<span class="pending-count-badge">${parseInt(this.pendingMembers.length, 10)}</span>` : ''}
                    </button>
                    <button class="member-tab" data-action="mm-switch-tab" data-tab="active">
                        Miembros Activos (${parseInt(this.activeMembers.length, 10)})
                    </button>
                </div>
                <div class="member-management-body">
                    <div id="pendingMembersTab" class="member-list">
                        ${pendingHtml}
                    </div>
                    <div id="activeMembersTab" class="member-list" style="display: none;">
                        ${activeHtml}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    closeModal() {
        const modal = document.getElementById('memberManagementModal');
        if (modal) modal.remove();
    }

    switchTab(tab) {
        const pendingTab = document.getElementById('pendingMembersTab');
        const activeTab = document.getElementById('activeMembersTab');
        const settingsTab = document.getElementById('settingsTab');
        const tabs = document.querySelectorAll('.member-tab');

        tabs.forEach((t, i) => {
            t.classList.toggle('active',
                (tab === 'pending' && i === 0) ||
                (tab === 'active' && i === 1) ||
                (tab === 'settings' && i === 2)
            );
        });

        if (pendingTab) pendingTab.style.display = tab === 'pending' ? 'flex' : 'none';
        if (activeTab) activeTab.style.display = tab === 'active' ? 'flex' : 'none';
        if (settingsTab) settingsTab.style.display = tab === 'settings' ? 'block' : 'none';
    }

    // Render settings panel
    renderSettings() {
        const settings = this.groupSettings || {};
        return `
            <div class="settings-inner">
                <div class="settings-section">
                    <h3>Auto-Aprobacion</h3>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Auto-aprobar invitados</div>
                            <div class="setting-description">Aprobar automaticamente a usuarios invitados por miembros</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-auto-invited" ${settings.auto_approve_invited ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Auto-aprobar KYC verificado</div>
                            <div class="setting-description">Aprobar automaticamente a usuarios con identidad verificada</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-auto-kyc" ${settings.auto_approve_kyc_verified ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Auto-aprobar email verificado</div>
                            <div class="setting-description">Aprobar automaticamente a usuarios con email confirmado</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-auto-email" ${settings.auto_approve_email_verified ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Notificaciones</h3>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Notificar nuevas solicitudes</div>
                            <div class="setting-description">Recibir notificacion cuando alguien solicite unirse</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-notify-request" ${settings.notify_admin_on_request !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Notificar al usuario</div>
                            <div class="setting-description">Enviar notificacion cuando se apruebe/rechace</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-notify-user" ${settings.notify_user_on_decision !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <button class="settings-save-btn" data-action="mm-save-settings">
                    Guardar Configuracion
                </button>
                <div id="settingsStatus"></div>
            </div>
        `;
    }

    // Save settings to API
    async saveSettings() {
        const btn = document.querySelector('.settings-save-btn');
        const statusDiv = document.getElementById('settingsStatus');

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Guardando...';
        }

        const newSettings = {
            auto_approve_invited: document.getElementById('setting-auto-invited')?.checked || false,
            auto_approve_kyc_verified: document.getElementById('setting-auto-kyc')?.checked || false,
            auto_approve_email_verified: document.getElementById('setting-auto-email')?.checked || false,
            notify_admin_on_request: document.getElementById('setting-notify-request')?.checked || false,
            notify_user_on_decision: document.getElementById('setting-notify-user')?.checked || false,
            require_manual_approval: true
        };

        try {
            const apiBase = window.API_BASE_URL || 'https://latanda.online';
            const response = await fetch(`${apiBase}/api/groups/${encodeURIComponent(this.currentGroupId)}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '')
                },
                body: JSON.stringify({ approval_settings: newSettings })
            });

            const data = await response.json();

            if (data.success) {
                this.groupSettings = newSettings;
                if (statusDiv) {
                    statusDiv.className = 'settings-status success';
                    statusDiv.textContent = 'Configuracion guardada';
                }
                if (typeof showNotification === 'function') {
                    showNotification('Configuracion guardada', 'success');
                }
            } else {
                if (statusDiv) {
                    statusDiv.className = 'settings-status error';
                    statusDiv.textContent = 'Error al guardar configuracion';
                }
            }
        } catch (err) {
            if (statusDiv) {
                statusDiv.className = 'settings-status error';
                statusDiv.textContent = 'Error de conexion';
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Guardar Configuracion';
        }

        setTimeout(() => {
            if (statusDiv) {
                statusDiv.textContent = '';
                statusDiv.className = '';
            }
        }, 3000);
    }

    renderPendingMembers() {
        if (this.pendingMembers.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">&#x2714;</div>
                    <div class="empty-state-text">No hay solicitudes pendientes</div>
                </div>
            `;
        }

        return this.pendingMembers.map(member => {
            const safeName = this.escapeHtml(member.user_name || member.display_name || 'Usuario');
            const safeEmail = this.escapeHtml(member.user_email || 'Sin email');
            const safeId = this.escapeHtml(member.user_id);
            const safeImgUrl = this.escapeHtml(member.profile_image_url || '');
            const initial = (member.user_name || member.display_name || 'U').charAt(0).toUpperCase();
            const safeInitial = this.escapeHtml(initial);
            const dateStr = member.requested_at ? new Date(member.requested_at).toLocaleDateString('es-HN') : '';

            return `
            <div class="member-item" data-member-id="${safeId}">
                <div class="member-avatar">
                    ${member.profile_image_url
                        ? `<img src="${safeImgUrl}" alt="${safeName}">`
                        : safeInitial
                    }
                </div>
                <div class="member-info">
                    <div class="member-name">${safeName}</div>
                    <div class="member-email">${safeEmail}</div>
                    <div class="member-meta">Solicitud: ${this.escapeHtml(dateStr)}</div>
                </div>
                <div class="member-actions">
                    <button class="btn-approve" data-action="mm-approve" data-member-id="${safeId}">
                        Aprobar
                    </button>
                    <button class="btn-reject" data-action="mm-reject" data-member-id="${safeId}">
                        Rechazar
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    renderActiveMembers() {
        const userId = localStorage.getItem('user_id');
        const filteredMembers = this.activeMembers.filter(m => m.user_id !== userId && m.status === 'active');

        if (filteredMembers.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">&#x1F465;</div>
                    <div class="empty-state-text">No hay otros miembros en el grupo</div>
                </div>
            `;
        }

        return filteredMembers.map(member => {
            const safeName = this.escapeHtml(member.name || member.display_name || 'Usuario');
            const safeEmail = this.escapeHtml(member.email || 'Sin email');
            const safeId = this.escapeHtml(member.user_id);
            const safeImgUrl = this.escapeHtml(member.profile_image_url || '');
            const safeRole = this.escapeHtml(member.role || 'member');
            const initial = (member.name || member.display_name || 'U').charAt(0).toUpperCase();
            const safeInitial = this.escapeHtml(initial);
            const dateStr = member.joined_at ? new Date(member.joined_at).toLocaleDateString('es-HN') : '';

            return `
            <div class="member-item" data-member-id="${safeId}">
                <div class="member-avatar">
                    ${member.profile_image_url
                        ? `<img src="${safeImgUrl}" alt="${safeName}">`
                        : safeInitial
                    }
                </div>
                <div class="member-info">
                    <div class="member-name">${safeName}</div>
                    <div class="member-email">${safeEmail}</div>
                    <div class="member-meta">
                        Rol: ${safeRole} |
                        Desde: ${this.escapeHtml(dateStr)}
                    </div>
                </div>
                <div class="member-actions-extended">
                    ${member.role !== 'creator' ? `
                        <select class="role-select" data-action="mm-role-change" data-member-id="${safeId}">
                            <option value="member" ${member.role === 'member' ? 'selected' : ''}>Miembro</option>
                            <option value="coordinator" ${member.role === 'coordinator' ? 'selected' : ''}>Coordinador</option>
                        </select>
                        <button class="btn-remove" data-action="mm-remove" data-member-id="${safeId}" data-member-name="${safeName}">
                            Remover
                        </button>
                    ` : `
                        <span class="creator-badge">Creador</span>
                    `}
                </div>
            </div>
            `;
        }).join('');
    }

    async handleApprove(memberId) {
        const success = await this.approveMember(this.currentGroupId, memberId);
        if (success) {
            // Remove from pending list and refresh UI
            this.pendingMembers = this.pendingMembers.filter(m => m.user_id !== memberId);
            var pendingTabEl = document.getElementById('pendingMembersTab');
            if (pendingTabEl) pendingTabEl.innerHTML = this.renderPendingMembers();

            // Update tab badge
            const pendingTab = document.querySelector('.member-tab');
            if (pendingTab) {
                const badge = pendingTab.querySelector('.pending-count-badge');
                if (this.pendingMembers.length > 0) {
                    if (badge) {
                        badge.textContent = this.pendingMembers.length;
                    } else {
                        pendingTab.insertAdjacentHTML('beforeend', `<span class="pending-count-badge">${parseInt(this.pendingMembers.length, 10)}</span>`);
                    }
                } else if (badge) {
                    badge.remove();
                }
            }

            // Refresh active members
            await this.fetchActiveMembers(this.currentGroupId);
            var activeTabEl = document.getElementById('activeMembersTab');
            if (activeTabEl) activeTabEl.innerHTML = this.renderActiveMembers();
        }
    }

    handleReject(memberId) {
        this.showConfirmDialog(
            'Rechazar Solicitud',
            'Esta seguro que desea rechazar esta solicitud?',
            true,
            async (reason) => {
                const success = await this.rejectMember(this.currentGroupId, memberId, reason);
                if (success) {
                    this.pendingMembers = this.pendingMembers.filter(m => m.user_id !== memberId);
                    var pendingTabEl = document.getElementById('pendingMembersTab');
                    if (pendingTabEl) pendingTabEl.innerHTML = this.renderPendingMembers();

                    // Update tab badge
                    const pendingTab = document.querySelector('.member-tab');
                    if (pendingTab) {
                        const badge = pendingTab.querySelector('.pending-count-badge');
                        if (this.pendingMembers.length > 0) {
                            if (badge) badge.textContent = this.pendingMembers.length;
                        } else if (badge) {
                            badge.remove();
                        }
                    }
                }
            }
        );
    }

    handleRemove(memberId, memberName) {
        const safeName = _mmEscapeHtml(memberName);
        this.showConfirmDialog(
            'Remover Miembro',
            'Esta seguro que desea remover a ' + safeName + ' del grupo? Esta accion no se puede deshacer.',
            true,
            async (reason) => {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    showNotification('Debes iniciar sesion', 'error');
                    return;
                }

                const apiBase = window.API_BASE_URL || 'https://latanda.online';
                try {
                    const response = await fetch(apiBase + '/api/groups/' + encodeURIComponent(this.currentGroupId) + '/members/' + encodeURIComponent(memberId), {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        }
                    });

                    const data = await response.json();

                    if (data.success) {
                        showNotification('Miembro removido exitosamente', 'success');
                        this.activeMembers = this.activeMembers.filter(m => m.user_id !== memberId);
                        var activeTabEl = document.getElementById('activeMembersTab');
                        if (activeTabEl) activeTabEl.innerHTML = this.renderActiveMembers();

                        // Update active count
                        const activeTab = document.querySelectorAll('.member-tab')[1];
                        if (activeTab) {
                            activeTab.textContent = 'Miembros Activos (' + this.activeMembers.filter(m => m.status === 'active').length + ')';
                        }
                    } else {
                        showNotification('Error al remover miembro', 'error');
                    }
                } catch (error) {
                    showNotification('Error de conexion', 'error');
                }
            }
        );
    }

    // ============================================
    // ROLE & STATUS MANAGEMENT
    // ============================================

    async handleRoleChange(memberId, newRole) {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            showNotification('Debes iniciar sesion', 'error');
            return;
        }

        const apiBase = window.API_BASE_URL || 'https://latanda.online';
        try {
            const response = await fetch(apiBase + '/api/groups/' + encodeURIComponent(this.currentGroupId) + '/members/' + encodeURIComponent(memberId) + '/role', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ role: newRole })
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Rol actualizado a ' + (newRole === 'coordinator' ? 'Coordinador' : 'Miembro'), 'success');
                const member = this.activeMembers.find(m => m.user_id === memberId);
                if (member) member.role = newRole;
                var activeTabEl = document.getElementById('activeMembersTab');
                if (activeTabEl) activeTabEl.innerHTML = this.renderActiveMembers();
            } else {
                showNotification('Error al cambiar rol', 'error');
                var activeTabEl2 = document.getElementById('activeMembersTab');
                if (activeTabEl2) activeTabEl2.innerHTML = this.renderActiveMembers();
            }
        } catch (error) {
            showNotification('Error de conexion', 'error');
            var activeTabEl3 = document.getElementById('activeMembersTab');
            if (activeTabEl3) activeTabEl3.innerHTML = this.renderActiveMembers();
        }
    }

    async handleStatusChange(memberId, newStatus, memberName) {
        const action = newStatus === 'suspended' ? 'suspender' : 'activar';
        const safeName = _mmEscapeHtml(memberName);

        this.showConfirmDialog(
            (newStatus === 'suspended' ? 'Suspender' : 'Activar') + ' Miembro',
            'Esta seguro de ' + action + ' a ' + safeName + '?',
            false,
            async () => {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    showNotification('Debes iniciar sesion', 'error');
                    return;
                }

                const apiBase = window.API_BASE_URL || 'https://latanda.online';
                try {
                    const response = await fetch(apiBase + '/api/groups/' + encodeURIComponent(this.currentGroupId) + '/members/' + encodeURIComponent(memberId) + '/status', {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ status: newStatus })
                    });

                    const data = await response.json();

                    if (data.success) {
                        showNotification('Miembro ' + (action === 'suspender' ? 'suspendido' : 'activado') + ' exitosamente', 'success');
                        const member = this.activeMembers.find(m => m.user_id === memberId);
                        if (member) member.status = newStatus;
                        var activeTabEl = document.getElementById('activeMembersTab');
                        if (activeTabEl) activeTabEl.innerHTML = this.renderActiveMembers();
                    } else {
                        showNotification('Error al cambiar estado', 'error');
                    }
                } catch (error) {
                    showNotification('Error de conexion', 'error');
                }
            }
        );
    }

    showConfirmDialog(title, message, showReason, onConfirm) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-dialog-content">
                <h3>${_mmEscapeHtml(title)}</h3>
                <p>${_mmEscapeHtml(message)}</p>
                ${showReason ? '<textarea id="confirmReason" placeholder="Razon (opcional)..."></textarea>' : ''}
                <div class="confirm-dialog-actions">
                    <button class="btn-cancel" data-action="mm-confirm-cancel">Cancelar</button>
                    <button class="btn-reject" data-action="mm-confirm-ok">Confirmar</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('[data-action="mm-confirm-ok"]').addEventListener('click', () => {
            const reason = showReason ? dialog.querySelector('#confirmReason').value : '';
            dialog.remove();
            onConfirm(reason);
        });

        dialog.querySelector('[data-action="mm-confirm-cancel"]').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.remove();
        });
    }
}

// Initialize global instance
window.memberManagement = new MemberManagement();

// Function to open member management (called from group card)
function openMemberManagement(groupId, groupName) {
    window.memberManagement.openModal(groupId, groupName).catch(function(err) {
        // Prevent unhandled rejection from triggering global-error-handler logout
    });
}

// Safe wrapper to handle special characters in group names
function openMemberManagementSafe(button) {
    const groupId = button.getAttribute('data-group-id');
    const groupName = button.getAttribute('data-group-name') || 'Grupo';
    openMemberManagement(groupId, groupName);
}

// ============================================
// DELEGATED CLICK HANDLER
// ============================================
document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');
    if (!action || !action.startsWith('mm-')) return;

    var memberId, memberName;

    switch (action) {
        case 'mm-close':
            window.memberManagement.closeModal();
            break;

        case 'mm-switch-tab':
            var tab = target.getAttribute('data-tab');
            if (tab) window.memberManagement.switchTab(tab);
            break;

        case 'mm-approve':
            memberId = target.getAttribute('data-member-id');
            if (memberId) window.memberManagement.handleApprove(memberId);
            break;

        case 'mm-reject':
            memberId = target.getAttribute('data-member-id');
            if (memberId) window.memberManagement.handleReject(memberId);
            break;

        case 'mm-remove':
            memberId = target.getAttribute('data-member-id');
            memberName = target.getAttribute('data-member-name') || 'este miembro';
            if (memberId) window.memberManagement.handleRemove(memberId, memberName);
            break;

        case 'mm-save-settings':
            window.memberManagement.saveSettings();
            break;

        case 'mm-confirm-cancel':
            // Handled by direct listener in showConfirmDialog
            break;

        case 'mm-confirm-ok':
            // Handled by direct listener in showConfirmDialog
            break;
    }
});

// Delegated change handler for role select
document.addEventListener('change', function(e) {
    var target = e.target.closest('[data-action="mm-role-change"]');
    if (!target) return;
    var memberId = target.getAttribute('data-member-id');
    var newRole = target.value;
    if (memberId && newRole) {
        window.memberManagement.handleRoleChange(memberId, newRole);
    }
});
