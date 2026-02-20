
// ============================================
// DISPUTES SYSTEM FRONTEND
// ============================================

// XSS prevention helper
function _dispEscapeHtml(text) {
    if (text == null) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// CSS for Disputes
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

// Allowlisted dispute types for CSS class usage
const _validDisputeTypes = ['missing_payment', 'wrong_amount', 'delayed', 'not_received', 'fraud', 'other'];
const _validDisputeStatuses = ['pending', 'in_review', 'resolved', 'rejected'];

function _safeDisputeTypeClass(type) {
    return _validDisputeTypes.includes(type) ? type : 'other';
}

function _safeDisputeStatusClass(status) {
    return _validDisputeStatuses.includes(status) ? status : 'pending';
}

// Open create dispute modal
function openCreateDisputeModal(groupId, groupName, paymentId, payoutRequestId) {
    var modal = document.createElement('div');
    modal.className = 'disputes-modal';
    modal.id = 'createDisputeModal';

    modal.innerHTML = `
        <div class="disputes-modal-content">
            <div class="disputes-header">
                <h2>&#x26A0; Reportar Problema</h2>
                <button class="close-member-modal" data-action="dispute-close-modal">&times;</button>
            </div>
            <div class="disputes-body">
                <p style="color: #888; margin-bottom: 20px;">
                    Reporta un problema con un pago en <strong>${_dispEscapeHtml(groupName)}</strong>
                </p>

                <div class="dispute-form-group">
                    <label>Tipo de problema</label>
                    <div class="dispute-type-options" id="disputeTypeOptions">
                        ${Object.entries(disputeTypeLabels).map(([type, info]) => `
                            <div class="dispute-type-option" data-type="${_dispEscapeHtml(type)}" data-action="dispute-select-type">
                                <div class="type-icon">${info.icon}</div>
                                <div class="type-label">${_dispEscapeHtml(info.label)}</div>
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

                <input type="hidden" id="disputeGroupId" value="${_dispEscapeHtml(groupId)}">
                <input type="hidden" id="disputePaymentId" value="${_dispEscapeHtml(paymentId || '')}">
                <input type="hidden" id="disputePayoutId" value="${_dispEscapeHtml(payoutRequestId || '')}">

                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button class="btn-cancel" style="flex: 1;" data-action="dispute-close-modal">Cancelar</button>
                    <button class="btn-resolve" style="flex: 1;" data-action="dispute-submit">Enviar Reporte</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeDisputeModal();
    });
}

function selectDisputeType(type) {
    document.querySelectorAll('.dispute-type-option').forEach(function(opt) {
        opt.classList.toggle('selected', opt.dataset.type === type);
    });
    var typeInput = document.getElementById('disputeType');
    if (typeInput) typeInput.value = type;
}

function closeDisputeModal() {
    var modal = document.getElementById('createDisputeModal');
    if (modal) modal.remove();

    var viewModal = document.getElementById('viewDisputesModal');
    if (viewModal) viewModal.remove();

    var resolveModal = document.getElementById('resolveDisputeModal');
    if (resolveModal) resolveModal.remove();
}

async function submitDispute() {
    var type = document.getElementById('disputeType').value;
    var description = document.getElementById('disputeDescription').value;
    var evidenceUrl = document.getElementById('disputeEvidence').value;
    var groupId = document.getElementById('disputeGroupId').value;
    var paymentId = document.getElementById('disputePaymentId').value;
    var payoutId = document.getElementById('disputePayoutId').value;
    var userId = localStorage.getItem('user_id');
    var apiBase = window.API_BASE_URL || 'https://latanda.online';

    if (!type) {
        showNotification('Selecciona el tipo de problema', 'error');
        return;
    }

    if (!description || description.length < 10) {
        showNotification('Describe el problema con al menos 10 caracteres', 'error');
        return;
    }

    try {
        var response = await fetch(apiBase + '/api/disputes', {
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

        var data = await response.json();

        if (data.success) {
            showNotification('Reporte enviado exitosamente', 'success');
            closeDisputeModal();
        } else {
            showNotification('Error al enviar reporte', 'error');
        }
    } catch (err) {
        showNotification('Error de conexion', 'error');
    }
}

// View user's disputes
async function viewMyDisputes() {
    var userId = localStorage.getItem('user_id');
    var apiBase = window.API_BASE_URL || 'https://latanda.online';

    try {
        var response = await fetch(apiBase + '/api/disputes?user_id=' + encodeURIComponent(userId));
        var data = await response.json();

        var disputes = data.success ? data.data.disputes : [];

        var modal = document.createElement('div');
        modal.className = 'disputes-modal';
        modal.id = 'viewDisputesModal';

        modal.innerHTML = `
            <div class="disputes-modal-content">
                <div class="disputes-header">
                    <h2>&#x1F4CB; Mis Reportes</h2>
                    <button class="close-member-modal" data-action="dispute-close-modal">&times;</button>
                </div>
                <div class="disputes-body">
                    ${disputes.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <div style="font-size: 3rem; margin-bottom: 16px;">&#x2714;</div>
                            <p>No tienes reportes de problemas</p>
                        </div>
                    ` : `
                        <div class="disputes-list">
                            ${disputes.map(function(d) { return renderDisputeItem(d, false); }).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeDisputeModal();
        });

    } catch (err) {
        showNotification('Error al cargar reportes', 'error');
    }
}

// View group disputes (Coordinator)
async function viewGroupDisputes(groupId, groupName) {
    var userId = localStorage.getItem('user_id');
    var apiBase = window.API_BASE_URL || 'https://latanda.online';

    try {
        var response = await fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/disputes?user_id=' + encodeURIComponent(userId));
        var data = await response.json();

        if (!data.success) {
            showNotification('Error al cargar disputas', 'error');
            return;
        }

        var disputes = data.data.disputes || [];
        var pendingCount = parseInt(data.data.pending_count, 10) || 0;
        var inReviewCount = parseInt(data.data.in_review_count, 10) || 0;

        var modal = document.createElement('div');
        modal.className = 'disputes-modal';
        modal.id = 'viewDisputesModal';

        modal.innerHTML = `
            <div class="disputes-modal-content" style="max-width: 700px;">
                <div class="disputes-header">
                    <h2>&#x1F6A8; Disputas - ${_dispEscapeHtml(groupName)}</h2>
                    <button class="close-member-modal" data-action="dispute-close-modal">&times;</button>
                </div>
                <div style="padding: 12px 24px; background: rgba(0,0,0,0.2); display: flex; gap: 16px; font-size: 0.85rem;">
                    <span style="color: #f59e0b;">Pendientes: ${_dispEscapeHtml(pendingCount)}</span>
                    <span style="color: #3b82f6;">En revision: ${_dispEscapeHtml(inReviewCount)}</span>
                    <span style="color: #888;">Total: ${_dispEscapeHtml(disputes.length)}</span>
                </div>
                <div class="disputes-body">
                    ${disputes.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <div style="font-size: 3rem; margin-bottom: 16px;">&#x2714;</div>
                            <p>No hay disputas en este grupo</p>
                        </div>
                    ` : `
                        <div class="disputes-list">
                            ${disputes.map(function(d) { return renderDisputeItem(d, true, groupId); }).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeDisputeModal();
        });

    } catch (err) {
        showNotification('Error al cargar disputas', 'error');
    }
}

function renderDisputeItem(dispute, isCoordinator, groupId) {
    var typeInfo = disputeTypeLabels[dispute.type] || { icon: '?', label: dispute.type };
    var safeTypeClass = _safeDisputeTypeClass(dispute.type);
    var safeStatusClass = _safeDisputeStatusClass(dispute.status);

    return `
        <div class="dispute-item" data-dispute-id="${_dispEscapeHtml(dispute.id)}">
            <div class="dispute-item-header">
                <span class="dispute-type-badge ${safeTypeClass}">${_dispEscapeHtml(typeInfo.label)}</span>
                <span class="dispute-status-badge ${safeStatusClass}">${_dispEscapeHtml(disputeStatusLabels[dispute.status] || dispute.status)}</span>
            </div>
            ${isCoordinator && dispute.user_name ? `
                <div style="font-size: 0.85rem; color: #888; margin-bottom: 8px;">
                    Reportado por: <strong style="color: white;">${_dispEscapeHtml(dispute.user_name)}</strong>
                </div>
            ` : ''}
            <div class="dispute-description">${_dispEscapeHtml(dispute.description)}</div>
            ${dispute.evidence_url ? `
                <div style="margin-bottom: 10px;">
                    <a href="${_dispEscapeHtml(dispute.evidence_url)}" target="_blank" rel="noopener noreferrer" style="color: var(--tanda-cyan); font-size: 0.85rem;">
                        &#x1F4CE; Ver evidencia
                    </a>
                </div>
            ` : ''}
            <div class="dispute-meta">
                ${dispute.group_name ? `Grupo: ${_dispEscapeHtml(dispute.group_name)} | ` : ''}
                Creado: ${_dispEscapeHtml(new Date(dispute.created_at).toLocaleDateString('es-HN'))}
            </div>
            ${dispute.resolution ? `
                <div class="dispute-resolution">
                    <div class="dispute-resolution-label">Resolucion:</div>
                    <div class="dispute-resolution-text">${_dispEscapeHtml(dispute.resolution)}</div>
                </div>
            ` : ''}
            ${isCoordinator && ['pending', 'in_review'].includes(dispute.status) ? `
                <div class="dispute-actions">
                    ${dispute.status === 'pending' ? `
                        <button class="btn-review" data-action="dispute-mark-review" data-dispute-id="${_dispEscapeHtml(dispute.id)}">
                            Marcar en Revision
                        </button>
                    ` : ''}
                    <button class="btn-resolve" data-action="dispute-open-resolve" data-dispute-id="${_dispEscapeHtml(dispute.id)}" data-group-id="${_dispEscapeHtml(groupId)}">
                        Resolver
                    </button>
                    <button class="btn-reject" data-action="dispute-open-reject" data-dispute-id="${_dispEscapeHtml(dispute.id)}" data-group-id="${_dispEscapeHtml(groupId)}">
                        Rechazar
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

async function updateDisputeStatus(disputeId, status) {
    var userId = localStorage.getItem('user_id');
    var apiBase = window.API_BASE_URL || 'https://latanda.online';

    try {
        var response = await fetch(apiBase + '/api/disputes/' + encodeURIComponent(disputeId) + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinator_id: userId, status: status })
        });

        var data = await response.json();

        if (data.success) {
            showNotification('Estado actualizado', 'success');
            // Refresh the dispute item
            var item = document.querySelector('[data-dispute-id="' + CSS.escape(disputeId) + '"]');
            if (item) {
                var badge = item.querySelector('.dispute-status-badge');
                if (badge) {
                    var safeClass = _safeDisputeStatusClass(status);
                    badge.className = 'dispute-status-badge ' + safeClass;
                    badge.textContent = disputeStatusLabels[status] || status;
                }
            }
        } else {
            showNotification('Error al actualizar', 'error');
        }
    } catch (err) {
        showNotification('Error de conexion', 'error');
    }
}

function openResolveDisputeModal(disputeId, groupId, isReject) {
    var modal = document.createElement('div');
    modal.className = 'confirm-dialog';
    modal.id = 'resolveDisputeModal';

    modal.innerHTML = `
        <div class="confirm-dialog-content">
            <h3>${isReject ? 'Rechazar' : 'Resolver'} Disputa</h3>
            <p style="color: #888;">Proporciona una explicacion para el usuario.</p>
            <textarea id="disputeResolution" placeholder="${isReject ? 'Razon del rechazo...' : 'Como se resolvio el problema...'}" style="width: 100%; min-height: 100px; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; margin-bottom: 16px;"></textarea>
            <div class="confirm-dialog-actions">
                <button class="btn-cancel" data-action="dispute-close-resolve-modal">Cancelar</button>
                <button class="${isReject ? 'btn-reject' : 'btn-resolve'}" data-action="dispute-confirm-resolve" data-dispute-id="${_dispEscapeHtml(disputeId)}" data-group-id="${_dispEscapeHtml(groupId)}" data-is-reject="${isReject ? 'true' : 'false'}">
                    ${isReject ? 'Rechazar' : 'Resolver'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function resolveDispute(disputeId, groupId, isReject) {
    var resolution = document.getElementById('disputeResolution').value;
    var userId = localStorage.getItem('user_id');
    var apiBase = window.API_BASE_URL || 'https://latanda.online';

    if (!resolution || resolution.length < 5) {
        showNotification('Proporciona una explicacion', 'error');
        return;
    }

    try {
        var response = await fetch(apiBase + '/api/disputes/' + encodeURIComponent(disputeId) + '/resolve', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                coordinator_id: userId,
                status: isReject ? 'rejected' : 'resolved',
                resolution: resolution
            })
        });

        var data = await response.json();

        if (data.success) {
            showNotification('Disputa ' + (isReject ? 'rechazada' : 'resuelta'), 'success');
            var resolveModal = document.getElementById('resolveDisputeModal');
            if (resolveModal) resolveModal.remove();
            // Refresh disputes view
            closeDisputeModal();
            // Re-open if we have groupId
            if (groupId) {
                setTimeout(function() { viewGroupDisputes(groupId, ''); }, 300);
            }
        } else {
            showNotification('Error al procesar', 'error');
        }
    } catch (err) {
        showNotification('Error de conexion', 'error');
    }
}

// Add disputes tab to coordinator panel
if (window.memberManagement) {
    var originalRenderCoordinatorStats = window.renderCoordinatorStats;
    if (originalRenderCoordinatorStats) {
        window.renderCoordinatorStats = function(stats) {
            var html = originalRenderCoordinatorStats(stats);

            // Add disputes button to coordinator actions
            html = html.replace(
                '</div>\n        <div class="coordinator-actions">',
                '</div>\n        <div class="coordinator-actions">'
            );

            // Try to add disputes button with data-action instead of inline onclick
            if (html.includes('class="coordinator-actions"')) {
                var safeGroupId = _dispEscapeHtml(window.memberManagement?.currentGroupId || '');
                html = html.replace(
                    '&#x1F4C4; Exportar Reporte',
                    '&#x1F4C4; Exportar Reporte</button>\n            <button class="coord-action-btn" data-action="dispute-view-group" data-group-id="' + safeGroupId + '">&#x1F6A8; Ver Disputas</button'
                );
            }

            return html;
        };
    }
}

// Delegated click handler for all dispute actions
document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');

    switch (action) {
        case 'dispute-close-modal':
            closeDisputeModal();
            break;

        case 'dispute-select-type':
            var type = target.getAttribute('data-type');
            if (type) selectDisputeType(type);
            break;

        case 'dispute-submit':
            submitDispute();
            break;

        case 'dispute-mark-review': {
            var disputeId = target.getAttribute('data-dispute-id');
            if (disputeId) updateDisputeStatus(disputeId, 'in_review');
            break;
        }

        case 'dispute-open-resolve': {
            var dId = target.getAttribute('data-dispute-id');
            var gId = target.getAttribute('data-group-id');
            if (dId) openResolveDisputeModal(dId, gId, false);
            break;
        }

        case 'dispute-open-reject': {
            var dIdR = target.getAttribute('data-dispute-id');
            var gIdR = target.getAttribute('data-group-id');
            if (dIdR) openResolveDisputeModal(dIdR, gIdR, true);
            break;
        }

        case 'dispute-close-resolve-modal': {
            var resolveModal = document.getElementById('resolveDisputeModal');
            if (resolveModal) resolveModal.remove();
            break;
        }

        case 'dispute-confirm-resolve': {
            var resDisputeId = target.getAttribute('data-dispute-id');
            var resGroupId = target.getAttribute('data-group-id');
            var isReject = target.getAttribute('data-is-reject') === 'true';
            if (resDisputeId) resolveDispute(resDisputeId, resGroupId, isReject);
            break;
        }

        case 'dispute-view-group': {
            var viewGroupId = target.getAttribute('data-group-id');
            if (viewGroupId) viewGroupDisputes(viewGroupId, 'Grupo');
            break;
        }

        default:
            break;
    }
});
