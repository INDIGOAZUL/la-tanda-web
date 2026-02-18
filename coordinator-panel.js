
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

// Fetch group statistics for coordinator
async function fetchGroupStats(groupId) {
    const apiBase = window.API_BASE_URL || 'https://latanda.online';
    const userId = localStorage.getItem('user_id');

    try {
        // Fetch multiple data sources in parallel
        const [membersRes, statsRes, financesRes] = await Promise.all([
            fetch(apiBase + '/api/groups/' + groupId + '/members?user_id=' + userId),
            fetch(apiBase + '/api/groups/' + groupId + '/stats?user_id=' + userId).catch(() => null),
            fetch(apiBase + '/api/groups/' + groupId + '/finances/summary?user_id=' + userId).catch(() => null)
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
        console.error('Error fetching group stats:', err);
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
                <span class="coord-stat-value">${stats.activeMembers}</span>
                <span class="coord-stat-label">Miembros Activos</span>
            </div>
            <div class="coord-stat ${stats.pendingMembers > 0 ? 'warning' : ''}">
                <span class="coord-stat-value">${stats.pendingMembers}</span>
                <span class="coord-stat-label">Solicitudes</span>
            </div>
            <div class="coord-stat">
                <span class="coord-stat-value">L. ${parseFloat(stats.totalCollected || 0).toLocaleString()}</span>
                <span class="coord-stat-label">Recaudado</span>
            </div>
            <div class="coord-stat ${stats.pendingPayments > 0 ? 'danger' : 'success'}">
                <span class="coord-stat-value">${stats.pendingPayments}</span>
                <span class="coord-stat-label">Pagos Pendientes</span>
            </div>
        </div>
        <div class="coordinator-actions">
            <button class="coord-action-btn primary" onclick="sendPaymentReminder('${window.memberManagement?.currentGroupId}')">
                &#x1F514; Enviar Recordatorio
            </button>
            <button class="coord-action-btn" onclick="viewGroupFinances('${window.memberManagement?.currentGroupId}')">
                &#x1F4B0; Ver Finanzas
            </button>
            <button class="coord-action-btn" onclick="exportGroupReport('${window.memberManagement?.currentGroupId}')">
                &#x1F4C4; Exportar Reporte
            </button>
        </div>
    `;
}

// Send payment reminder to all members with pending payments
async function sendPaymentReminder(groupId) {
    if (!groupId) return;

    const apiBase = window.API_BASE_URL || 'https://latanda.online';
    const userId = localStorage.getItem('user_id');

    try {
        showNotification('Enviando recordatorios...', 'info');

        const response = await fetch(apiBase + '/api/groups/' + groupId + '/notifications/payment-reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinator_id: userId })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Recordatorios enviados a ' + (data.data?.sent_count || 0) + ' miembros', 'success');
        } else {
            showNotification(data.error || 'Error al enviar recordatorios', 'error');
        }
    } catch (err) {
        console.error('Error sending reminders:', err);
        showNotification('Error de conexion', 'error');
    }
}

// View group finances
function viewGroupFinances(groupId) {
    if (!groupId) return;

    // Close member management modal
    if (window.memberManagement) {
        window.memberManagement.closeModal();
    }

    // Navigate to group finances view
    if (typeof manageGroup === 'function') {
        manageGroup(groupId);
    } else {
        showNotification('Navegando a finanzas del grupo...', 'info');
        sessionStorage.setItem('selected_group_id', groupId);
        if (typeof switchTab === 'function') {
            switchTab('tandas');
        }
    }
}

// Export group report
async function exportGroupReport(groupId) {
    if (!groupId) return;

    const apiBase = window.API_BASE_URL || 'https://latanda.online';

    try {
        showNotification('Generando reporte...', 'info');

        // Try to open the export endpoint
        window.open(apiBase + '/api/groups/' + groupId + '/export/summary?format=pdf', '_blank');

        showNotification('Reporte generado', 'success');
    } catch (err) {
        console.error('Error exporting report:', err);
        showNotification('Error al exportar reporte', 'error');
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
            fetchGroupStats(groupId)
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
                    <h2>Panel de Coordinador - ${groupName}</h2>
                    <button class="close-member-modal" onclick="memberManagement.closeModal()">&#x2715;</button>
                </div>
                ${renderCoordinatorStats(stats)}
                <div class="member-management-tabs">
                    <button class="member-tab active" onclick="memberManagement.switchTab('pending')">
                        Solicitudes Pendientes
                        ${this.pendingMembers.length > 0 ? '<span class="pending-count-badge">' + this.pendingMembers.length + '</span>' : ''}
                    </button>
                    <button class="member-tab" onclick="memberManagement.switchTab('active')">
                        Miembros Activos (${this.activeMembers.filter(m => m.status === 'active').length})
                    </button>
                    <button class="member-tab" onclick="memberManagement.switchTab('settings')">
                        ⚙️ Configuracion
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

console.log('Coordinator Panel module loaded');
