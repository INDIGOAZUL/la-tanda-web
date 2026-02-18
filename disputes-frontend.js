
// ============================================
// DISPUTES SYSTEM FRONTEND
// ============================================

// CSS for Disputes
// XSS prevention helper (v3.99.0)
function escapeHtmlDF(text) {
    const div = document.createElement("div");
    div.textContent = String(text != null ? text : "");
    return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const disputesStyles = document.createElement('style');
disputesStyles.textContent = `
/* Disputes Modal */
.disputes-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10002;
    padding: 20px;
}

.disputes-modal-content {
    background: var(--tanda-darker, #1a1a2e);
    border-radius: 16px;
    max-width: 600px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    border: 1px solid var(--tanda-purple, #a855f7);
    box-shadow: 0 25px 50px -12px rgba(168, 85, 247, 0.25);
}

.disputes-header {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.1));
}

.disputes-header h2 {
    margin: 0;
    color: var(--tanda-purple, #a855f7);
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 10px;
}

.disputes-body {
    padding: 24px;
}

/* Create Dispute Form */
.dispute-form-group {
    margin-bottom: 20px;
}

.dispute-form-group label {
    display: block;
    margin-bottom: 8px;
    color: #ccc;
    font-weight: 500;
}

.dispute-form-group select,
.dispute-form-group textarea,
.dispute-form-group input {
    width: 100%;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 0.95rem;
}

.dispute-form-group select:focus,
.dispute-form-group textarea:focus,
.dispute-form-group input:focus {
    outline: none;
    border-color: var(--tanda-purple, #a855f7);
}

.dispute-form-group textarea {
    min-height: 100px;
    resize: vertical;
}

/* Dispute Type Options */
.dispute-type-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.dispute-type-option {
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
}

.dispute-type-option:hover {
    background: rgba(168, 85, 247, 0.1);
    border-color: rgba(168, 85, 247, 0.3);
}

.dispute-type-option.selected {
    background: rgba(168, 85, 247, 0.2);
    border-color: var(--tanda-purple, #a855f7);
}

.dispute-type-option .type-icon {
    font-size: 1.5rem;
    margin-bottom: 6px;
}

.dispute-type-option .type-label {
    font-size: 0.85rem;
    color: #ccc;
}

/* Disputes List */
.disputes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.dispute-item {
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.dispute-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
}

.dispute-type-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.dispute-type-badge.missing_payment { background: #ef4444; color: white; }
.dispute-type-badge.wrong_amount { background: #f59e0b; color: white; }
.dispute-type-badge.delayed { background: #3b82f6; color: white; }
.dispute-type-badge.not_received { background: #8b5cf6; color: white; }
.dispute-type-badge.fraud { background: #dc2626; color: white; }
.dispute-type-badge.other { background: #6b7280; color: white; }

.dispute-status-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
}

.dispute-status-badge.pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.dispute-status-badge.in_review { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.dispute-status-badge.resolved { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.dispute-status-badge.rejected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

.dispute-description {
    color: #ccc;
    font-size: 0.9rem;
    margin-bottom: 10px;
    line-height: 1.5;
}

.dispute-meta {
    font-size: 0.8rem;
    color: #666;
}

.dispute-resolution {
    margin-top: 12px;
    padding: 12px;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 8px;
    border-left: 3px solid #10b981;
}

.dispute-resolution-label {
    font-size: 0.75rem;
    color: #10b981;
    font-weight: 600;
    margin-bottom: 4px;
}

.dispute-resolution-text {
    color: #ccc;
    font-size: 0.85rem;
}

/* Coordinator Dispute Actions */
.dispute-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-review {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
}

.btn-resolve {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
}

/* Report Problem Button */
.btn-report-problem {
    background: transparent;
    border: 1px solid rgba(168, 85, 247, 0.5);
    color: #a855f7;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
}

.btn-report-problem:hover {
    background: rgba(168, 85, 247, 0.1);
    border-color: #a855f7;
}
`;
document.head.appendChild(disputesStyles);

// Dispute type labels
const disputeTypeLabels = {
    'missing_payment': { icon: '&#x2753;', label: 'Pago no registrado' },
    'wrong_amount': { icon: '&#x1F4B0;', label: 'Monto incorrecto' },
    'delayed': { icon: '&#x23F0;', label: 'Pago atrasado' },
    'not_received': { icon: '&#x274C;', label: 'No recibido' },
    'fraud': { icon: '&#x26A0;', label: 'Fraude' },
    'other': { icon: '&#x2754;', label: 'Otro' }
};

const disputeStatusLabels = {
    'pending': 'Pendiente',
    'in_review': 'En revision',
    'resolved': 'Resuelto',
    'rejected': 'Rechazado'
};

// Open create dispute modal
function openCreateDisputeModal(groupId, groupName, paymentId, payoutRequestId) {
    const modal = document.createElement('div');
    modal.className = 'disputes-modal';
    modal.id = 'createDisputeModal';

    modal.innerHTML = `
        <div class="disputes-modal-content">
            <div class="disputes-header">
                <h2>&#x26A0; Reportar Problema</h2>
                <button class="close-member-modal" onclick="closeDisputeModal()">&times;</button>
            </div>
            <div class="disputes-body">
                <p style="color: #888; margin-bottom: 20px;">
                    Reporta un problema con un pago en <strong>${escapeHtmlDF(groupName)}</strong>
                </p>

                <div class="dispute-form-group">
                    <label>Tipo de problema</label>
                    <div class="dispute-type-options" id="disputeTypeOptions">
                        ${Object.entries(disputeTypeLabels).map(([type, info]) => `
                            <div class="dispute-type-option" data-type="${type}" onclick="selectDisputeType('${type}')">
                                <div class="type-icon">${info.icon}</div>
                                <div class="type-label">${info.label}</div>
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="disputeType" value="">
                </div>

                <div class="dispute-form-group">
                    <label>Descripcion del problema</label>
                    <textarea id="disputeDescription" placeholder="Describe detalladamente el problema..."></textarea>
                </div>

                <div class="dispute-form-group">
                    <label>URL de evidencia (opcional)</label>
                    <input type="text" id="disputeEvidence" placeholder="Link a captura de pantalla o comprobante">
                </div>

                <input type="hidden" id="disputeGroupId" value="${groupId}">
                <input type="hidden" id="disputePaymentId" value="${paymentId || ''}">
                <input type="hidden" id="disputePayoutId" value="${payoutRequestId || ''}">

                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button class="btn-cancel" style="flex: 1;" onclick="closeDisputeModal()">Cancelar</button>
                    <button class="btn-resolve" style="flex: 1;" onclick="submitDispute()">Enviar Reporte</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeDisputeModal();
    });
}

function selectDisputeType(type) {
    document.querySelectorAll('.dispute-type-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.type === type);
    });
    document.getElementById('disputeType').value = type;
}

function closeDisputeModal() {
    const modal = document.getElementById('createDisputeModal');
    if (modal) modal.remove();

    const viewModal = document.getElementById('viewDisputesModal');
    if (viewModal) viewModal.remove();

    const resolveModal = document.getElementById('resolveDisputeModal');
    if (resolveModal) resolveModal.remove();
}

async function submitDispute() {
    const type = document.getElementById('disputeType').value;
    const description = document.getElementById('disputeDescription').value;
    const evidenceUrl = document.getElementById('disputeEvidence').value;
    const groupId = document.getElementById('disputeGroupId').value;
    const paymentId = document.getElementById('disputePaymentId').value;
    const payoutId = document.getElementById('disputePayoutId').value;
    const userId = localStorage.getItem('user_id');
    const apiBase = window.API_BASE_URL || 'https://latanda.online';

    if (!type) {
        showNotification('Selecciona el tipo de problema', 'error');
        return;
    }

    if (!description || description.length < 10) {
        showNotification('Describe el problema con al menos 10 caracteres', 'error');
        return;
    }

    try {
        const response = await fetch(apiBase + '/api/disputes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                group_id: groupId,
                payment_id: paymentId || null,
                payout_request_id: payoutId || null,
                type: type,
                description: description,
                evidence_url: evidenceUrl || null
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Reporte enviado exitosamente', 'success');
            closeDisputeModal();
        } else {
            showNotification(data.error || 'Error al enviar reporte', 'error');
        }
    } catch (err) {
        showNotification('Error de conexion', 'error');
    }
}

// View user's disputes
async function viewMyDisputes() {
    const userId = localStorage.getItem('user_id');
    const apiBase = window.API_BASE_URL || 'https://latanda.online';

    try {
        const response = await fetch(apiBase + '/api/disputes?user_id=' + userId);
        const data = await response.json();

        const disputes = data.success ? data.data.disputes : [];

        const modal = document.createElement('div');
        modal.className = 'disputes-modal';
        modal.id = 'viewDisputesModal';

        modal.innerHTML = `
            <div class="disputes-modal-content">
                <div class="disputes-header">
                    <h2>&#x1F4CB; Mis Reportes</h2>
                    <button class="close-member-modal" onclick="closeDisputeModal()">&times;</button>
                </div>
                <div class="disputes-body">
                    ${disputes.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <div style="font-size: 3rem; margin-bottom: 16px;">&#x2714;</div>
                            <p>No tienes reportes de problemas</p>
                        </div>
                    ` : `
                        <div class="disputes-list">
                            ${disputes.map(d => renderDisputeItem(d, false)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDisputeModal();
        });

    } catch (err) {
        showNotification('Error al cargar reportes', 'error');
    }
}

// View group disputes (Coordinator)
async function viewGroupDisputes(groupId, groupName) {
    const userId = localStorage.getItem('user_id');
    const apiBase = window.API_BASE_URL || 'https://latanda.online';

    try {
        const response = await fetch(apiBase + '/api/groups/' + groupId + '/disputes?user_id=' + userId);
        const data = await response.json();

        if (!data.success) {
            showNotification(data.error || 'Error al cargar disputas', 'error');
            return;
        }

        const disputes = data.data.disputes || [];

        const modal = document.createElement('div');
        modal.className = 'disputes-modal';
        modal.id = 'viewDisputesModal';

        modal.innerHTML = `
            <div class="disputes-modal-content" style="max-width: 700px;">
                <div class="disputes-header">
                    <h2>&#x1F6A8; Disputas - ${escapeHtmlDF(groupName)}</h2>
                    <button class="close-member-modal" onclick="closeDisputeModal()">&times;</button>
                </div>
                <div style="padding: 12px 24px; background: rgba(0,0,0,0.2); display: flex; gap: 16px; font-size: 0.85rem;">
                    <span style="color: #f59e0b;">Pendientes: ${data.data.pending_count || 0}</span>
                    <span style="color: #3b82f6;">En revision: ${data.data.in_review_count || 0}</span>
                    <span style="color: #888;">Total: ${disputes.length}</span>
                </div>
                <div class="disputes-body">
                    ${disputes.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <div style="font-size: 3rem; margin-bottom: 16px;">&#x2714;</div>
                            <p>No hay disputas en este grupo</p>
                        </div>
                    ` : `
                        <div class="disputes-list">
                            ${disputes.map(d => renderDisputeItem(d, true, groupId)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDisputeModal();
        });

    } catch (err) {
        showNotification('Error al cargar disputas', 'error');
    }
}

function renderDisputeItem(dispute, isCoordinator, groupId) {
    const typeInfo = disputeTypeLabels[dispute.type] || { icon: '?', label: dispute.type };

    return `
        <div class="dispute-item" data-dispute-id="${dispute.id}">
            <div class="dispute-item-header">
                <span class="dispute-type-badge ${dispute.type}">${typeInfo.label}</span>
                <span class="dispute-status-badge ${dispute.status}">${disputeStatusLabels[dispute.status]}</span>
            </div>
            ${isCoordinator && dispute.user_name ? `
                <div style="font-size: 0.85rem; color: #888; margin-bottom: 8px;">
                    Reportado por: <strong style="color: white;">${dispute.user_name}</strong>
                </div>
            ` : ''}
            <div class="dispute-description">${dispute.description}</div>
            ${dispute.evidence_url ? `
                <div style="margin-bottom: 10px;">
                    <a href="${dispute.evidence_url}" target="_blank" style="color: var(--tanda-cyan); font-size: 0.85rem;">
                        &#x1F4CE; Ver evidencia
                    </a>
                </div>
            ` : ''}
            <div class="dispute-meta">
                ${dispute.group_name ? `Grupo: ${dispute.group_name} | ` : ''}
                Creado: ${new Date(dispute.created_at).toLocaleDateString('es-HN')}
            </div>
            ${dispute.resolution ? `
                <div class="dispute-resolution">
                    <div class="dispute-resolution-label">Resolucion:</div>
                    <div class="dispute-resolution-text">${dispute.resolution}</div>
                </div>
            ` : ''}
            ${isCoordinator && ['pending', 'in_review'].includes(dispute.status) ? `
                <div class="dispute-actions">
                    ${dispute.status === 'pending' ? `
                        <button class="btn-review" onclick="updateDisputeStatus('${dispute.id}', 'in_review')">
                            Marcar en Revision
                        </button>
                    ` : ''}
                    <button class="btn-resolve" onclick="openResolveDisputeModal('${dispute.id}', '${groupId}')">
                        Resolver
                    </button>
                    <button class="btn-reject" onclick="openResolveDisputeModal('${dispute.id}', '${groupId}', true)">
                        Rechazar
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

async function updateDisputeStatus(disputeId, status) {
    const userId = localStorage.getItem('user_id');
    const apiBase = window.API_BASE_URL || 'https://latanda.online';

    try {
        const response = await fetch(apiBase + '/api/disputes/' + disputeId + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinator_id: userId, status })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Estado actualizado', 'success');
            // Refresh the dispute item
            const item = document.querySelector(`[data-dispute-id="${disputeId}"]`);
            if (item) {
                const badge = item.querySelector('.dispute-status-badge');
                if (badge) {
                    badge.className = 'dispute-status-badge ' + status;
                    badge.textContent = disputeStatusLabels[status];
                }
            }
        } else {
            showNotification(data.error || 'Error al actualizar', 'error');
        }
    } catch (err) {
        showNotification('Error de conexion', 'error');
    }
}

function openResolveDisputeModal(disputeId, groupId, isReject) {
    const modal = document.createElement('div');
    modal.className = 'confirm-dialog';
    modal.id = 'resolveDisputeModal';

    modal.innerHTML = `
        <div class="confirm-dialog-content">
            <h3>${isReject ? 'Rechazar' : 'Resolver'} Disputa</h3>
            <p style="color: #888;">Proporciona una explicacion para el usuario.</p>
            <textarea id="disputeResolution" placeholder="${isReject ? 'Razon del rechazo...' : 'Como se resolvio el problema...'}" style="width: 100%; min-height: 100px; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; margin-bottom: 16px;"></textarea>
            <div class="confirm-dialog-actions">
                <button class="btn-cancel" onclick="document.getElementById('resolveDisputeModal').remove()">Cancelar</button>
                <button class="${isReject ? 'btn-reject' : 'btn-resolve'}" onclick="resolveDispute('${disputeId}', '${groupId}', ${isReject})">
                    ${isReject ? 'Rechazar' : 'Resolver'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function resolveDispute(disputeId, groupId, isReject) {
    const resolution = document.getElementById('disputeResolution').value;
    const userId = localStorage.getItem('user_id');
    const apiBase = window.API_BASE_URL || 'https://latanda.online';

    if (!resolution || resolution.length < 5) {
        showNotification('Proporciona una explicacion', 'error');
        return;
    }

    try {
        const response = await fetch(apiBase + '/api/disputes/' + disputeId + '/resolve', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                coordinator_id: userId,
                status: isReject ? 'rejected' : 'resolved',
                resolution: resolution
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Disputa ' + (isReject ? 'rechazada' : 'resuelta'), 'success');
            document.getElementById('resolveDisputeModal').remove();
            // Refresh disputes view
            closeDisputeModal();
            // Re-open if we have groupId
            if (groupId) {
                setTimeout(() => viewGroupDisputes(groupId, ''), 300);
            }
        } else {
            showNotification(data.error || 'Error al procesar', 'error');
        }
    } catch (err) {
        showNotification('Error de conexion', 'error');
    }
}

// Add disputes tab to coordinator panel
if (window.memberManagement) {
    const originalRenderCoordinatorStats = window.renderCoordinatorStats;
    if (originalRenderCoordinatorStats) {
        window.renderCoordinatorStats = function(stats) {
            let html = originalRenderCoordinatorStats(stats);

            // Add disputes button to coordinator actions
            html = html.replace(
                '</div>\n        <div class="coordinator-actions">',
                '</div>\n        <div class="coordinator-actions">'
            );

            // Try to add disputes button
            if (html.includes('class="coordinator-actions"')) {
                html = html.replace(
                    '&#x1F4C4; Exportar Reporte',
                    '&#x1F4C4; Exportar Reporte</button>\n            <button class="coord-action-btn" onclick="viewGroupDisputes(\'' + (window.memberManagement?.currentGroupId || '') + '\', \'Grupo\')">&#x1F6A8; Ver Disputas</button'
                );
            }

            return html;
        };
    }
}

