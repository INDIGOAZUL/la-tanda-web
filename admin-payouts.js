// ============================================
// ADMIN PAYOUTS MANAGEMENT
// Sistema de Gestión de Desembolsos de Tandas
// ============================================

(function() {
    'use strict';

    const API_BASE = window.API_BASE_URL || 'https://latanda.online';

    // XSS prevention helper (v4.1.0)
    function escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Inject CSS for payouts section
    const style = document.createElement('style');
    style.textContent = `
        .payouts-section {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 16px;
            padding: 24px;
            margin-top: 24px;
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
        }

        .payouts-tabs {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .payout-tab-btn {
            padding: 10px 20px;
            border: 1px solid rgba(0, 255, 255, 0.3);
            background: transparent;
            color: var(--text-secondary);
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .payout-tab-btn:hover {
            background: rgba(0, 255, 255, 0.1);
            color: var(--primary-color);
        }

        .payout-tab-btn.active {
            background: rgba(0, 255, 255, 0.2);
            border-color: var(--primary-color);
            color: var(--primary-color);
        }

        .payout-card {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
        }

        .payout-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }

        .payout-card-title h4 {
            color: var(--text-primary);
            margin: 0 0 4px 0;
            font-size: 1.1rem;
        }

        .payout-card-title p {
            color: var(--text-secondary);
            margin: 0;
            font-size: 0.85rem;
        }

        .payout-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .payout-status.pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .payout-status.auto_approved { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .payout-status.needs_review { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .payout-status.processing { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
        .payout-status.awaiting_confirmation { background: rgba(236, 72, 153, 0.2); color: #ec4899; }
        .payout-status.completed { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .payout-status.rejected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .payout-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 16px;
        }

        .payout-detail-item {
            background: rgba(0, 0, 0, 0.2);
            padding: 12px;
            border-radius: 8px;
        }

        .payout-detail-item label {
            display: block;
            color: var(--text-secondary);
            font-size: 0.75rem;
            margin-bottom: 4px;
        }

        .payout-detail-item span {
            color: var(--text-primary);
            font-size: 0.95rem;
            font-weight: 500;
        }

        .payout-method-info {
            background: rgba(0, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 255, 0.1);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }

        .payout-method-info h5 {
            color: var(--primary-color);
            margin: 0 0 12px 0;
            font-size: 0.9rem;
        }

        .payout-method-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.85rem;
        }

        .payout-method-row .label { color: var(--text-secondary); }
        .payout-method-row .value {
            color: var(--text-primary);
            font-family: monospace;
        }

        .payout-method-row .value .copy-btn {
            background: none;
            border: none;
            color: var(--primary-color);
            cursor: pointer;
            margin-left: 8px;
            font-size: 0.8rem;
        }

        .payout-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .payout-btn {
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }

        .payout-btn-approve {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .payout-btn-approve:hover {
            background: rgba(16, 185, 129, 0.3);
        }

        .payout-btn-process {
            background: rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .payout-btn-process:hover {
            background: rgba(139, 92, 246, 0.3);
        }

        .payout-btn-reject {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .payout-btn-reject:hover {
            background: rgba(239, 68, 68, 0.3);
        }

        /* Process Modal */
        .process-payout-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }

        .process-payout-modal.active {
            display: flex;
        }

        .process-modal-content {
            background: var(--bg-secondary);
            border-radius: 16px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }

        .process-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .process-modal-header h3 {
            color: var(--text-primary);
            margin: 0;
        }

        .process-modal-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 1.5rem;
            cursor: pointer;
        }

        .proof-upload-area {
            border: 2px dashed rgba(0, 255, 255, 0.3);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin-bottom: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .proof-upload-area:hover {
            border-color: var(--primary-color);
            background: rgba(0, 255, 255, 0.05);
        }

        .proof-upload-area.has-file {
            border-color: var(--success-color);
            background: rgba(16, 185, 129, 0.1);
        }

        .no-payouts {
            text-align: center;
            padding: 40px;
            color: var(--text-secondary);
        }

        .no-payouts i {
            font-size: 3rem;
            margin-bottom: 16px;
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);

    // HTML for payouts section
    function createPayoutsSection() {
        const appealsSection = document.querySelector('.appeals-section');
        if (!appealsSection) {
            return;
        }

        const payoutsHTML = `
        <div class="payouts-section">
            <div class="section-header">
                <div>
                    <h2 class="section-title"><i class="fas fa-hand-holding-usd"></i> Desembolsos de Tandas</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Gestión de pagos a beneficiarios</p>
                </div>
                <button class="refresh-btn" onclick="AdminPayouts.loadPayouts()">
                    <i class="fas fa-sync-alt"></i>
                    Actualizar
                </button>
            </div>

            <div class="payouts-tabs">
                <button class="payout-tab-btn active" onclick="AdminPayouts.switchTab('pending')" data-tab="pending">
                    <i class="fas fa-clock"></i> Pendientes (<span id="payouts-pending-count">0</span>)
                </button>
                <button class="payout-tab-btn" onclick="AdminPayouts.switchTab('approved')" data-tab="approved">
                    <i class="fas fa-check"></i> Aprobados (<span id="payouts-approved-count">0</span>)
                </button>
                <button class="payout-tab-btn" onclick="AdminPayouts.switchTab('processing')" data-tab="processing">
                    <i class="fas fa-spinner"></i> Procesando (<span id="payouts-processing-count">0</span>)
                </button>
                <button class="payout-tab-btn" onclick="AdminPayouts.switchTab('completed')" data-tab="completed">
                    <i class="fas fa-check-circle"></i> Completados
                </button>
            </div>

            <div id="payoutsContainer">
                <div class="loading" style="margin: 40px auto; display: block;"></div>
            </div>
        </div>

        <!-- Process Payout Modal -->
        <div class="process-payout-modal" id="processPayoutModal">
            <div class="process-modal-content">
                <div class="process-modal-header">
                    <h3><i class="fas fa-paper-plane"></i> Procesar Desembolso</h3>
                    <button class="process-modal-close" onclick="AdminPayouts.closeProcessModal()">&times;</button>
                </div>
                <div id="processPayoutInfo"></div>
                <div class="form-group" style="margin-top: 16px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">
                        Comprobante de Transferencia
                    </label>
                    <div class="proof-upload-area" onclick="document.getElementById('payoutProofInput').click()">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: var(--primary-color);"></i>
                        <p style="margin: 8px 0 0 0; color: var(--text-secondary);">
                            Arrastra imagen o haz clic para subir
                        </p>
                        <p id="proofFileName" style="margin: 8px 0 0 0; color: var(--success-color); display: none;"></p>
                    </div>
                    <input type="file" id="payoutProofInput" accept="image/*" style="display: none;" onchange="AdminPayouts.handleProofUpload(this)">
                </div>
                <div class="form-group" style="margin-top: 16px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">
                        Notas (opcional)
                    </label>
                    <textarea id="payoutProcessNotes" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); min-height: 80px; resize: vertical;" placeholder="Referencia de transferencia, comentarios..."></textarea>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button class="payout-btn" style="flex: 1; background: rgba(100,100,100,0.3); color: var(--text-secondary);" onclick="AdminPayouts.closeProcessModal()">
                        Cancelar
                    </button>
                    <button class="payout-btn payout-btn-process" style="flex: 1;" onclick="AdminPayouts.executeProcess()">
                        <i class="fas fa-check"></i> Confirmar Transferencia
                    </button>
                </div>
            </div>
        </div>
        `;

        appealsSection.insertAdjacentHTML('afterend', payoutsHTML);
    }

    // State
    let currentTab = 'pending';
    let payoutsData = [];
    let currentPayoutId = null;
    let uploadedProofFile = null;

    // Load payouts from API
    async function loadPayouts() {
        const container = document.getElementById('payoutsContainer');
        if (!container) return;

        container.innerHTML = '<div class="loading" style="margin: 40px auto;"></div>';

        try {
            const response = await fetch(`${API_BASE}/api/admin/payouts/pending`, { headers: { 'Authorization': 'Bearer ' + getAuthToken() } });
            const result = await response.json();

            if (result.success) {
                payoutsData = result.data.payout_requests || [];
                updateCounts();
                renderPayouts();
            } else {
                container.innerHTML = '<div class="no-payouts"><i class="fas fa-exclamation-circle"></i><p>Error al cargar desembolsos</p></div>';
            }
        } catch (error) {
            container.innerHTML = '<div class="no-payouts"><i class="fas fa-exclamation-circle"></i><p>Error de conexion</p></div>';
        }
    }

    // Update tab counts
    function updateCounts() {
        const pending = payoutsData.filter(p => p.status === 'pending' || p.status === 'needs_review').length;
        const approved = payoutsData.filter(p => p.status === 'auto_approved' || p.status === 'approved').length;
        const processing = payoutsData.filter(p => p.status === 'processing' || p.status === 'awaiting_confirmation').length;

        document.getElementById('payouts-pending-count').textContent = pending;
        document.getElementById('payouts-approved-count').textContent = approved;
        document.getElementById('payouts-processing-count').textContent = processing;
    }

    // Switch tab
    function switchTab(tab) {
        currentTab = tab;
        document.querySelectorAll('.payout-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        renderPayouts();
    }

    // Filter payouts by tab
    function getFilteredPayouts() {
        switch (currentTab) {
            case 'pending':
                return payoutsData.filter(p => p.status === 'pending' || p.status === 'needs_review');
            case 'approved':
                return payoutsData.filter(p => p.status === 'auto_approved' || p.status === 'approved');
            case 'processing':
                return payoutsData.filter(p => p.status === 'processing' || p.status === 'awaiting_confirmation');
            case 'completed':
                return payoutsData.filter(p => p.status === 'completed');
            default:
                return payoutsData;
        }
    }

    // Render payouts
    function renderPayouts() {
        const container = document.getElementById('payoutsContainer');
        if (!container) return;

        const filtered = getFilteredPayouts();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="no-payouts">
                    <i class="fas fa-inbox"></i>
                    <p>No hay desembolsos ${currentTab === 'pending' ? 'pendientes' : 'en esta categoria'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(payout => renderPayoutCard(payout)).join('');
    }

    // Render single payout card
    function renderPayoutCard(payout) {
        const method = payout.payout_method_snapshot || {};
        const statusLabels = {
            'pending': 'Pendiente',
            'needs_review': 'Requiere Revision',
            'auto_approved': 'Auto-Aprobado',
            'approved': 'Aprobado',
            'processing': 'Procesando',
            'awaiting_confirmation': 'Esperando Confirmacion',
            'completed': 'Completado',
            'rejected': 'Rechazado'
        };

        let methodInfo = '';
        if (method.method_type === 'bank_transfer') {
            methodInfo = `
                <div class="payout-method-row">
                    <span class="label">Banco:</span>
                    <span class="value">${escapeHtml(method.bank_name || 'N/A')}</span>
                </div>
                <div class="payout-method-row">
                    <span class="label">Cuenta:</span>
                    <span class="value">${escapeHtml(method.bank_account_number || 'N/A')} <button class="copy-btn" data-action="copy" data-copy="${escapeHtml(method.bank_account_number || '')}"><i class="fas fa-copy"></i></button></span>
                </div>
                <div class="payout-method-row">
                    <span class="label">Tipo:</span>
                    <span class="value">${method.bank_account_type === 'ahorro' ? 'Ahorro' : 'Corriente'}</span>
                </div>
                <div class="payout-method-row">
                    <span class="label">Titular:</span>
                    <span class="value">${escapeHtml(method.bank_account_holder || 'N/A')}</span>
                </div>
            `;
        } else if (method.method_type === 'mobile_money') {
            methodInfo = `
                <div class="payout-method-row">
                    <span class="label">Telefono Tigo:</span>
                    <span class="value">${escapeHtml(method.tigo_phone || 'N/A')} <button class="copy-btn" data-action="copy" data-copy="${escapeHtml(method.tigo_phone || '')}"><i class="fas fa-copy"></i></button></span>
                </div>
                <div class="payout-method-row">
                    <span class="label">Nombre:</span>
                    <span class="value">${escapeHtml(method.tigo_name || 'N/A')}</span>
                </div>
            `;
        } else if (method.method_type === 'crypto') {
            methodInfo = `
                <div class="payout-method-row">
                    <span class="label">Red:</span>
                    <span class="value">${escapeHtml(method.crypto_network || 'N/A')}</span>
                </div>
                <div class="payout-method-row">
                    <span class="label">Direccion:</span>
                    <span class="value" style="font-size: 0.75rem;">${escapeHtml(method.crypto_address || 'N/A')} <button class="copy-btn" data-action="copy" data-copy="${escapeHtml(method.crypto_address || '')}"><i class="fas fa-copy"></i></button></span>
                </div>
            `;
        }

        let actions = '';
        if (payout.status === 'pending' || payout.status === 'needs_review') {
            actions = `
                <button class="payout-btn payout-btn-approve" data-action="approve" data-payout-id="${escapeHtml(payout.id)}">
                    <i class="fas fa-check"></i> Aprobar
                </button>
                <button class="payout-btn payout-btn-reject" data-action="reject" data-payout-id="${escapeHtml(payout.id)}">
                    <i class="fas fa-times"></i> Rechazar
                </button>
            `;
        } else if (payout.status === 'auto_approved' || payout.status === 'approved') {
            actions = `
                <button class="payout-btn payout-btn-process" data-action="process" data-payout-id="${escapeHtml(payout.id)}">
                    <i class="fas fa-paper-plane"></i> Procesar Pago
                </button>
            `;
        } else if (payout.status === 'awaiting_confirmation') {
            actions = `
                <span style="color: var(--warning-color);">
                    <i class="fas fa-clock"></i> Esperando que el usuario confirme recepcion
                </span>
            `;
        }

        const methodIcon = method.method_type === 'bank_transfer' ? 'fa-university' :
                          method.method_type === 'mobile_money' ? 'fa-mobile-alt' : 'fa-bitcoin';

        return `
            <div class="payout-card">
                <div class="payout-card-header">
                    <div class="payout-card-title">
                        <h4>${escapeHtml(payout.group_name || 'Grupo')} - Ciclo ${payout.cycle_number || 1}</h4>
                        <p>${escapeHtml(payout.user_name || payout.user_email || 'Usuario')}</p>
                    </div>
                    <span class="payout-status ${payout.status}">${statusLabels[payout.status] || payout.status}</span>
                </div>

                <div class="payout-details">
                    <div class="payout-detail-item">
                        <label>Monto Bruto</label>
                        <span>L. ${parseFloat(payout.gross_amount || 0).toLocaleString('es-HN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="payout-detail-item">
                        <label>Comision Coord.</label>
                        <span>L. ${parseFloat(payout.coordinator_fee || 0).toLocaleString('es-HN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="payout-detail-item">
                        <label>Comision Plat.</label>
                        <span>L. ${parseFloat(payout.platform_fee || 0).toLocaleString('es-HN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="payout-detail-item" style="background: rgba(16, 185, 129, 0.1);">
                        <label>Monto a Pagar</label>
                        <span style="color: #10b981; font-size: 1.1rem;">L. ${parseFloat(payout.net_amount || 0).toLocaleString('es-HN', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>

                <div class="payout-method-info">
                    <h5><i class="fas ${methodIcon}"></i> ${method.method_type === 'bank_transfer' ? 'Transferencia Bancaria' : method.method_type === 'mobile_money' ? 'Tigo Money' : 'Criptomoneda'}</h5>
                    ${methodInfo}
                </div>

                <div class="payout-actions">
                    ${actions}
                </div>
            </div>
        `;
    }

    // Approve payout
    async function approvePayout(payoutId) {
        if (!confirm('¿Aprobar este desembolso?')) return;

        try {
            const response = await fetch(`${API_BASE}/api/admin/payouts/${payoutId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() }
            });

            const result = await response.json();

            if (result.success) {
                alert('Desembolso aprobado');
                loadPayouts();
            } else {
                alert('Error: ' + (result.data?.error?.message || 'No se pudo aprobar'));
            }
        } catch (error) {
            alert('Error de conexion');
        }
    }

    // Reject payout
    async function rejectPayout(payoutId) {
        const reason = prompt('Razon del rechazo:');
        if (!reason) return;

        try {
            const response = await fetch(`${API_BASE}/api/admin/payouts/${payoutId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
                body: JSON.stringify({ rejection_reason: reason })
            });

            const result = await response.json();

            if (result.success) {
                alert('Desembolso rechazado');
                loadPayouts();
            } else {
                alert('Error: ' + (result.data?.error?.message || 'No se pudo rechazar'));
            }
        } catch (error) {
            alert('Error de conexion');
        }
    }

    // Open process modal
    function openProcessModal(payoutId) {
        currentPayoutId = payoutId;
        const payout = payoutsData.find(p => p.id === payoutId);
        if (!payout) return;

        const method = payout.payout_method_snapshot || {};
        let methodDetails = '';

        if (method.method_type === 'bank_transfer') {
            methodDetails = `
                <p><strong>Banco:</strong> ${method.bank_name}</p>
                <p><strong>Cuenta:</strong> ${method.bank_account_number}</p>
                <p><strong>Titular:</strong> ${method.bank_account_holder}</p>
            `;
        } else if (method.method_type === 'mobile_money') {
            methodDetails = `
                <p><strong>Tigo Money:</strong> ${method.tigo_phone}</p>
                <p><strong>Nombre:</strong> ${method.tigo_name}</p>
            `;
        } else if (method.method_type === 'crypto') {
            methodDetails = `
                <p><strong>Red:</strong> ${method.crypto_network}</p>
                <p><strong>Direccion:</strong> ${method.crypto_address}</p>
            `;
        }

        document.getElementById('processPayoutInfo').innerHTML = `
            <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="color: var(--text-secondary); margin: 0 0 8px 0;">Beneficiario</p>
                <p style="color: var(--text-primary); font-size: 1.1rem; margin: 0 0 16px 0;">${escapeHtml(payout.user_name || payout.user_email || 'Usuario')}</p>
                <p style="color: var(--text-secondary); margin: 0 0 8px 0;">Monto a transferir</p>
                <p style="color: #10b981; font-size: 1.5rem; font-weight: 700; margin: 0;">L. ${parseFloat(payout.net_amount || 0).toLocaleString('es-HN', {minimumFractionDigits: 2})}</p>
            </div>
            <div style="background: rgba(0, 255, 255, 0.05); padding: 16px; border-radius: 8px; border: 1px solid rgba(0, 255, 255, 0.1);">
                <p style="color: var(--primary-color); margin: 0 0 12px 0; font-weight: 600;">Datos de Pago</p>
                ${methodDetails}
            </div>
        `;

        // Reset upload state
        uploadedProofFile = null;
        document.getElementById('proofFileName').style.display = 'none';
        document.querySelector('.proof-upload-area').classList.remove('has-file');
        document.getElementById('payoutProcessNotes').value = '';

        document.getElementById('processPayoutModal').classList.add('active');
    }

    // Close process modal
    function closeProcessModal() {
        document.getElementById('processPayoutModal').classList.remove('active');
        currentPayoutId = null;
        uploadedProofFile = null;
    }

    // Handle proof upload
    function handleProofUpload(input) {
        if (input.files && input.files[0]) {
            uploadedProofFile = input.files[0];
            document.getElementById('proofFileName').textContent = uploadedProofFile.name;
            document.getElementById('proofFileName').style.display = 'block';
            document.querySelector('.proof-upload-area').classList.add('has-file');
        }
    }

    // Execute process
    async function executeProcess() {
        if (!currentPayoutId) return;

        const notes = document.getElementById('payoutProcessNotes').value;

        // Create form data for file upload
        const formData = new FormData();
        formData.append('notes', notes);

        if (uploadedProofFile) {
            formData.append('proof', uploadedProofFile);
        }

        try {
            const response = await fetch(`${API_BASE}/api/admin/payouts/${currentPayoutId}/process`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                alert('Desembolso procesado. El usuario sera notificado para confirmar recepcion.');
                closeProcessModal();
                loadPayouts();
            } else {
                alert('Error: ' + (result.data?.error?.message || 'No se pudo procesar'));
            }
        } catch (error) {
            alert('Error de conexion');
        }
    }

    // Copy to clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Visual feedback could be added here
        });
    }

    // Initialize
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createPayoutsSection();
                loadPayouts();
            });
        } else {
            createPayoutsSection();
            loadPayouts();
        }
    }

    // Export to window
    window.AdminPayouts = {
        loadPayouts,
        switchTab,
        approvePayout,
        rejectPayout,
        openProcessModal,
        closeProcessModal,
        handleProofUpload,
        executeProcess,
        copyToClipboard
    };

    init();
})();

// Enhanced executeProcess with OCR feedback

    // v4.1.0: Delegated click handler for payout actions
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === 'copy') {
            const text = btn.dataset.copy || '';
            navigator.clipboard.writeText(text).then(function() {
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(function() { btn.innerHTML = '<i class="fas fa-copy"></i>'; }, 1500);
            });
        } else if (action === 'approve') {
            AdminPayouts.approvePayout(btn.dataset.payoutId);
        } else if (action === 'reject') {
            AdminPayouts.rejectPayout(btn.dataset.payoutId);
        } else if (action === 'process') {
            AdminPayouts.openProcessModal(btn.dataset.payoutId);
        }
    });

    window.AdminPayouts.executeProcess = async function() {
    if (!currentPayoutId) return;
    
    const notes = document.getElementById("payoutProcessNotes").value;
    const btn = document.querySelector(".payout-btn-process");
    const originalText = btn.innerHTML;
    btn.innerHTML = "<i class=\"fas fa-spinner fa-spin\"></i> Procesando...";
    btn.disabled = true;
    
    try {
        // Convert file to base64 if uploaded
        let proofImage = null;
        if (uploadedProofFile) {
            proofImage = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(uploadedProofFile);
            });
        }
        
        const response = await fetch(API_BASE + "/api/admin/payouts/" + currentPayoutId + "/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                proof_image: proofImage,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show OCR verification result
            const ocr = result.data.ocr_verification;
            let message = "Desembolso procesado.";
            
            if (ocr && ocr.performed) {
                const confidencePercent = Math.round(ocr.confidence * 100);
                if (ocr.confidence >= 0.67) {
                    message += "\n\n✅ Verificacion OCR: " + confidencePercent + "% de confianza";
                    message += "\nCoincidencias: " + (ocr.matches.join(", ") || "ninguna");
                } else {
                    message += "\n\n⚠️ Verificacion OCR: " + confidencePercent + "% de confianza";
                    message += "\nCoincidencias: " + (ocr.matches.join(", ") || "ninguna");
                    message += "\nNo coincide: " + (ocr.mismatches.join(", ") || "ninguno");
                    message += "\n\nPor favor verifica manualmente que el pago se realizo correctamente.";
                }
            }
            
            alert(message);
            closeProcessModal();
            loadPayouts();
        } else {
            alert("Error: " + (result.data?.error?.message || "No se pudo procesar"));
        }
    } catch (error) {
        alert("Error de conexion");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};
