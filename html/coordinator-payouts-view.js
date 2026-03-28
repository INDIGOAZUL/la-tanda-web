

// ============================================
// COORDINATOR PAYOUTS VIEW
// ============================================

async function viewGroupPayouts(groupId, groupName) {
    const userId = localStorage.getItem('user_id');
    const apiBase = window.API_BASE_URL || 'https://latanda.online';

    try {
        const response = await fetch(apiBase + '/api/groups/' + groupId + '/payouts?user_id=' + userId);
        const data = await response.json();

        if (!data.success) {
            showNotification(data.error || 'Error al cargar payouts', 'error');
            return;
        }

        const payouts = data.data.payouts || [];
        const stats = data.data.stats || {};
        const isCoordinator = data.data.is_coordinator;
        const gName = groupName || data.data.group_name || 'Grupo';

        const statusLabels = {
            'pending': 'Pendiente',
            'approved': 'Aprobado',
            'processed': 'Procesado',
            'completed': 'Completado',
            'rejected': 'Rechazado',
            'cancelled': 'Cancelado'
        };

        const statusColors = {
            'pending': '#f59e0b',
            'approved': '#3b82f6',
            'processed': '#8b5cf6',
            'completed': '#10b981',
            'rejected': '#ef4444',
            'cancelled': '#6b7280'
        };

        // Build payouts HTML
        let payoutsHtml = '';
        if (payouts.length === 0) {
            payoutsHtml = '<div style="text-align: center; padding: 40px; color: #666;"><div style="font-size: 3rem; margin-bottom: 16px;">&#x1F4B8;</div><p>No hay solicitudes de cobro</p></div>';
        } else {
            payoutsHtml = '<div class="member-list">';
            payouts.forEach(function(p) {
                const color = statusColors[p.status] || '#666';
                const label = statusLabels[p.status] || p.status;

                payoutsHtml += '<div class="member-item" style="flex-direction: column; align-items: stretch;">';
                payoutsHtml += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
                payoutsHtml += '<div>';
                if (isCoordinator && p.user_name) {
                    payoutsHtml += '<strong style="color: white;">' + p.user_name + '</strong><br>';
                }
                payoutsHtml += '<span style="font-size: 1.25rem; color: var(--tanda-cyan);">L. ' + parseFloat(p.net_amount || 0).toLocaleString() + '</span>';
                payoutsHtml += '</div>';
                payoutsHtml += '<span style="padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; background: ' + color + '20; color: ' + color + ';">' + label + '</span>';
                payoutsHtml += '</div>';
                payoutsHtml += '<div style="font-size: 0.85rem; color: #888;">';
                payoutsHtml += 'Metodo: ' + (p.method_type || 'N/A') + (p.bank_name ? ' - ' + p.bank_name : '');
                payoutsHtml += '<br>Cuenta: ' + (p.account_number || 'N/A');
                payoutsHtml += '<br>Fecha: ' + new Date(p.created_at).toLocaleDateString('es-HN');
                payoutsHtml += '</div>';
                if (p.status === 'completed' || p.status === 'processed') {
                    payoutsHtml += '<button class="btn-report-problem" style="margin-top: 10px; align-self: flex-start;" onclick="openCreateDisputeModal(\'' + groupId + '\', \'' + gName.replace(/'/g, '') + '\', null, \'' + p.id + '\')">&#x26A0; Reportar Problema</button>';
                }
                payoutsHtml += '</div>';
            });
            payoutsHtml += '</div>';
        }

        const modal = document.createElement('div');
        modal.className = 'member-management-modal';
        modal.id = 'groupPayoutsModal';

        modal.innerHTML = '<div class="member-management-content" style="max-width: 800px;">' +
            '<div class="member-management-header">' +
            '<h2>&#x1F4B8; Cobros - ' + gName + '</h2>' +
            '<button class="close-member-modal" onclick="closePayoutsModal()">&#x2715;</button>' +
            '</div>' +
            '<div class="coordinator-stats">' +
            '<div class="coord-stat"><span class="coord-stat-value">' + stats.total + '</span><span class="coord-stat-label">Total</span></div>' +
            '<div class="coord-stat"><span class="coord-stat-value" style="color: #f59e0b;">' + stats.pending + '</span><span class="coord-stat-label">Pendientes</span></div>' +
            '<div class="coord-stat"><span class="coord-stat-value" style="color: #10b981;">' + stats.completed + '</span><span class="coord-stat-label">Completados</span></div>' +
            '<div class="coord-stat"><span class="coord-stat-value">L. ' + parseFloat(stats.total_amount || 0).toLocaleString() + '</span><span class="coord-stat-label">Monto Total</span></div>' +
            '</div>' +
            '<div class="member-management-body">' + payoutsHtml + '</div>' +
            '</div>';

        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) closePayoutsModal();
        });

    } catch (err) {
        console.error('Error loading payouts:', err);
        showNotification('Error al cargar cobros', 'error');
    }
}

function closePayoutsModal() {
    const modal = document.getElementById('groupPayoutsModal');
    if (modal) modal.remove();
}

console.log('Coordinator payouts view loaded');
