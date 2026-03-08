
// ============================================
// COORDINATOR PANEL - Group Statistics
// ============================================

// Additional CSS for Coordinator Panel
const coordinatorPanelStyles = document.createElement('style');
coordinatorPanelStyles.textContent = `
/* Coordinator Stats Panel */
.coordinator-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    padding: 16px 24px;
    background: rgba(6, 182, 212, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.coord-stat {
    text-align: center;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.coord-stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--tanda-cyan, #00d9ff);
    display: block;
}

.coord-stat-label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.coord-stat.warning .coord-stat-value {
    color: #f59e0b;
}

.coord-stat.success .coord-stat-value {
    color: #10b981;
}

.coord-stat.danger .coord-stat-value {
    color: #ef4444;
}

/* Quick Actions */
.coordinator-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 24px;
    background: rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.coord-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #ccc;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}

.coord-action-btn:hover {
    background: rgba(6, 182, 212, 0.2);
    border-color: var(--tanda-cyan, #00d9ff);
    color: white;
}

.coord-action-btn.primary {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    border-color: transparent;
    color: white;
}

.coord-action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);

/* Settings Tab Styles */
.settings-panel {
    padding: 20px;
}

.settings-section {
    margin-bottom: 24px;
}

.settings-section h3 {
    color: var(--tanda-cyan, #00d9ff);
    font-size: 1rem;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    margin-bottom: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-info {
    flex: 1;
}

.setting-label {
    color: #fff;
    font-size: 0.9rem;
    margin-bottom: 4px;
}

.setting-description {
    color: #888;
    font-size: 0.75rem;
}

/* Toggle Switch */
.toggle-switch {
    position: relative;
    width: 48px;
    height: 26px;
    flex-shrink: 0;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    transition: 0.3s;
    border-radius: 26px;
}

.toggle-slider:before {
    position: absolute;
    content: ;
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: #888;
    transition: 0.3s;
    border-radius: 50%;
}

input:checked + .toggle-slider {
    background-color: var(--tanda-cyan, #00d9ff);
}

input:checked + .toggle-slider:before {
    transform: translateX(22px);
    background-color: #fff;
}

.settings-save-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    border: none;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    margin-top: 16px;
    transition: all 0.2s;
}

.settings-save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.settings-save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.settings-status {
    text-align: center;
    padding: 8px;
    border-radius: 8px;
    margin-top: 12px;
    font-size: 0.85rem;
}

.settings-status.success {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.settings-status.error {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}
}
`;
document.head.appendChild(coordinatorPanelStyles);

// Escape user data for safe innerHTML insertion
function _cpEscapeHtml(text) {
    if (text == null) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Fetch group statistics for coordinator
async function fetchGroupStats(groupId) {
    const apiBase = window.API_BASE_URL || 'https://latanda.online';
    var authHeaders = (typeof getAuthHeaders === 'function') ? getAuthHeaders() : {};
    var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
    if (!authHeaders['Authorization'] && token) {
        authHeaders['Authorization'] = 'Bearer ' + token;
    }

    try {
        // Fetch multiple data sources in parallel (JWT auth, no user_id param needed)
        const [membersRes, statsRes, financesRes] = await Promise.all([
            fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/members', { headers: authHeaders }),
            fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/stats', { headers: authHeaders }).catch(() => null),
            fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/finances/summary', { headers: authHeaders }).catch(() => null)
        ]);

        const membersData = await membersRes.json();
        const statsData = statsRes ? await statsRes.json().catch(() => ({})) : {};
        const financesData = financesRes ? await financesRes.json().catch(() => ({})) : {};

        const members = membersData.success ? (membersData.data.members || membersData.data || []) : [];
        const activeMembers = members.filter(m => m.status === 'active').length;
        const pendingMembers = members.filter(m => m.status === 'pending').length;

        return {
            totalMembers: members.length,
            activeMembers: activeMembers,
            pendingMembers: pendingMembers,
            totalCollected: financesData.data?.total_collected || statsData.data?.total_collected || 0,
            pendingPayments: financesData.data?.pending_payments || statsData.data?.pending_payments || 0,
            completedCycles: statsData.data?.completed_cycles || 0,
            activeTandas: statsData.data?.active_tandas || 0
        };
    } catch (err) {
        // Failed to fetch group stats
        return {
            totalMembers: 0,
            activeMembers: 0,
            pendingMembers: 0,
            totalCollected: 0,
            pendingPayments: 0,
            completedCycles: 0,
            activeTandas: 0
        };
    }
}

// Render coordinator stats panel HTML
function renderCoordinatorStats(stats) {
    return `
        <div class="coordinator-stats">
            <div class="coord-stat success">
                <span class="coord-stat-value">${_cpEscapeHtml(stats.activeMembers)}</span>
                <span class="coord-stat-label">Miembros Activos</span>
            </div>
            <div class="coord-stat ${stats.pendingMembers > 0 ? 'warning' : ''}">
                <span class="coord-stat-value">${_cpEscapeHtml(stats.pendingMembers)}</span>
                <span class="coord-stat-label">Solicitudes</span>
            </div>
            <div class="coord-stat">
                <span class="coord-stat-value">L. ${_cpEscapeHtml(parseFloat(stats.totalCollected || 0).toLocaleString())}</span>
                <span class="coord-stat-label">Recaudado</span>
            </div>
            <div class="coord-stat ${stats.pendingPayments > 0 ? 'danger' : 'success'}">
                <span class="coord-stat-value">${_cpEscapeHtml(stats.pendingPayments)}</span>
                <span class="coord-stat-label">Pagos Pendientes</span>
            </div>
        </div>
        <div class="coordinator-actions">
            <button class="coord-action-btn primary" data-action="coord-send-reminder">
                &#x1F514; Enviar Recordatorio de Pago
            </button>
        </div>
    `;
}

// Send payment reminder to all members with pending payments
async function sendPaymentReminder(groupId) {
    if (!groupId) return;

    var proceed = (typeof showConfirm === 'function')
        ? await showConfirm('Enviar recordatorio de pago a todos los miembros con pagos pendientes?')
        : confirm('Enviar recordatorio?');
    if (!proceed) return;

    const apiBase = window.API_BASE_URL || 'https://latanda.online';
    var authHeaders = (typeof getAuthHeaders === 'function') ? getAuthHeaders() : {};
    var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
    if (!authHeaders['Authorization'] && token) {
        authHeaders['Authorization'] = 'Bearer ' + token;
    }
    authHeaders['Content-Type'] = 'application/json';

    try {
        showNotification('Enviando recordatorios...', 'info');

        const response = await fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/notifications/payment-reminders', {
            method: 'POST',
            headers: authHeaders
        });

        const data = await response.json();

        if (data.success) {
            var count = data.data?.sent_count || 0;
            showNotification(count > 0 ? 'Recordatorios enviados a ' + count + ' miembros' : 'Todos los miembros estan al dia', count > 0 ? 'success' : 'info');
        } else {
            showNotification(data.data?.error?.message || 'Error al enviar recordatorios', 'error');
        }
    } catch (err) {
        showNotification('Error de conexion', 'error');
    }
}



// Extend MemberManagement to include coordinator stats
if (window.memberManagement) {
    const originalOpenModal = window.memberManagement.openModal.bind(window.memberManagement);

    window.memberManagement.openModal = async function(groupId, groupName) {
        this.currentGroupId = groupId;

        // Fetch data including stats
        const [pending, active, stats] = await Promise.all([
            this.fetchPendingMembers(groupId),
            this.fetchActiveMembers(groupId),
            fetchGroupStats(groupId),
            this.fetchGroupSettings(groupId)
        ]);

        this.pendingMembers = pending || [];
        this.activeMembers = active || [];
        this.groupStats = stats;

        const modal = document.createElement('div');
        modal.className = 'member-management-modal';
        modal.id = 'memberManagementModal';
        modal.innerHTML = `
            <div class="member-management-content">
                <div class="member-management-header">
                    <h2>Panel de Coordinador - ${_cpEscapeHtml(groupName)}</h2>
                    <button class="close-member-modal" data-action="close-member-modal">&#x2715;</button>
                </div>
                ${renderCoordinatorStats(stats)}
                <div class="member-management-tabs">
                    <button class="member-tab active" data-action="coord-switch-tab" data-tab="pending">
                        Solicitudes Pendientes
                        ${this.pendingMembers.length > 0 ? '<span class="pending-count-badge">' + _cpEscapeHtml(this.pendingMembers.length) + '</span>' : ''}
                    </button>
                    <button class="member-tab" data-action="coord-switch-tab" data-tab="active">
                        Miembros Activos (${_cpEscapeHtml(this.activeMembers.filter(m => m.status === 'active').length)})
                    </button>
                    <button class="member-tab" data-action="coord-switch-tab" data-tab="settings">
                        &#x2699;&#xFE0F; Configuracion
                    </button>
                </div>
                <div class="member-management-body">
                    <div id="pendingMembersTab" class="member-list">
                        ${this.renderPendingMembers()}
                    </div>
                    <div id="activeMembersTab" class="member-list" style="display: none;">
                        ${this.renderActiveMembers()}
                    </div>
                    <div id="settingsTab" class="settings-panel" style="display: none;">
                        ${this.renderSettings()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    };
}

// Delegated click handler for coordinator panel actions
document.addEventListener('click', function(e) {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.getAttribute('data-action');
    const groupId = window.memberManagement?.currentGroupId;

    switch (action) {
        case 'coord-send-reminder':
            sendPaymentReminder(groupId);
            break;

        case 'close-member-modal':
            if (window.memberManagement) {
                window.memberManagement.closeModal();
            }
            break;

        case 'coord-switch-tab': {
            const tab = actionEl.getAttribute('data-tab');
            if (tab && window.memberManagement) {
                window.memberManagement.switchTab(tab);
            }
            break;
        }
    }
});
