// ============================================
// PAYOUT SYSTEM - FRONTEND
// Sistema de Cobro de Tandas
// ============================================

// Inject CSS styles for payout modals
(function injectPayoutStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Payout Methods Section */
        .payout-methods-section {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #86efac;
        }

        .payout-methods-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .payout-methods-header h3 {
            margin: 0;
            color: #166534;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .add-payout-method-btn {
            background: #16a34a;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .add-payout-method-btn:hover {
            background: #15803d;
        }

        .payout-method-card {
            background: white;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            border: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .payout-method-card.default {
            border-color: #16a34a;
            box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
        }

        .payout-method-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .payout-method-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .payout-method-icon.bank { background: #dbeafe; }
        .payout-method-icon.tigo { background: #fef3c7; }
        .payout-method-icon.crypto { background: #f3e8ff; }

        .payout-method-details h4 {
            margin: 0 0 4px 0;
            font-size: 1rem;
            color: #1f2937;
        }

        .payout-method-details p {
            margin: 0;
            font-size: 0.85rem;
            color: #6b7280;
        }

        .default-badge {
            background: #16a34a;
            color: white;
            font-size: 0.7rem;
            padding: 2px 8px;
            border-radius: 12px;
            margin-left: 8px;
        }

        .payout-method-actions {
            display: flex;
            gap: 8px;
        }

        .payout-method-actions button {
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            background: white;
            cursor: pointer;
            font-size: 0.8rem;
        }

        .payout-method-actions button:hover {
            background: #f3f4f6;
        }

        .payout-method-actions .delete-btn:hover {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #dc2626;
        }

        /* Payout Modal */
        .payout-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
        }

        .payout-modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .payout-modal {
            background: white;
            border-radius: 16px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            transform: translateY(20px);
            transition: transform 0.3s;
        }

        .payout-modal-overlay.active .payout-modal {
            transform: translateY(0);
        }

        .payout-modal-header {
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .payout-modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
            color: #1f2937;
        }

        .payout-modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
        }

        .payout-modal-body {
            padding: 20px;
        }

        .payout-form-group {
            margin-bottom: 16px;
        }

        .payout-form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #374151;
        }

        .payout-form-group input,
        .payout-form-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
        }

        .payout-form-group input:focus,
        .payout-form-group select:focus {
            outline: none;
            border-color: #16a34a;
            box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
        }

        .method-type-selector {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }

        .method-type-option {
            flex: 1;
            padding: 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .method-type-option:hover {
            border-color: #16a34a;
        }

        .method-type-option.selected {
            border-color: #16a34a;
            background: #f0fdf4;
        }

        .method-type-option .icon {
            font-size: 2rem;
            margin-bottom: 8px;
        }

        .method-type-option .label {
            font-weight: 500;
            color: #374151;
        }

        .payout-modal-footer {
            padding: 16px 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        .payout-btn {
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            border: none;
        }

        .payout-btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }

        .payout-btn-primary {
            background: #16a34a;
            color: white;
        }

        .payout-btn-primary:hover {
            background: #15803d;
        }

        /* Collect Tanda Button */
        .collect-tanda-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            border: 2px solid #f59e0b;
        }

        .collect-tanda-section h3 {
            color: #92400e;
            margin: 0 0 8px 0;
        }

        .collect-tanda-section p {
            color: #a16207;
            margin: 0 0 16px 0;
        }

        .collect-tanda-amount {
            font-size: 2rem;
            font-weight: bold;
            color: #166534;
            margin-bottom: 16px;
        }

        .collect-tanda-btn {
            background: #16a34a;
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.1rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .collect-tanda-btn:hover {
            background: #15803d;
        }

        .collect-tanda-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }

        /* Payout Status */
        .payout-status-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }

        .payout-status-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .payout-status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }

        .payout-status-badge.pending { background: #fef3c7; color: #92400e; }
        .payout-status-badge.auto_approved { background: #dbeafe; color: #1e40af; }
        .payout-status-badge.processing { background: #e0e7ff; color: #4338ca; }
        .payout-status-badge.awaiting_confirmation { background: #fce7f3; color: #9d174d; }
        .payout-status-badge.completed { background: #d1fae5; color: #065f46; }
        .payout-status-badge.rejected { background: #fee2e2; color: #991b1b; }

        .no-payout-methods {
            text-align: center;
            padding: 40px 20px;
            color: #6b7280;
        }

        .no-payout-methods .icon {
            font-size: 3rem;
            margin-bottom: 16px;
        }
    `;
    document.head.appendChild(style);
})();

// Global state
window.PayoutSystem = {
    currentGroupId: null,
    currentUserId: null,
    payoutMethods: [],
    eligibility: null
};

// Get user ID from various sources
function getPayoutUserId() {
    try {
        const latandaUser = localStorage.getItem('latanda_user');
        if (latandaUser) {
            const userData = JSON.parse(latandaUser);
            if (userData.user_id) return userData.user_id;
            if (userData.id) return userData.id;
        }
    } catch(e) { /* localStorage parse error */ }
    return localStorage.getItem('latanda_user_id') ||
           sessionStorage.getItem('latanda_user_id') ||
           localStorage.getItem('userId') ||
           window.currentUserId;
}

// Load payout methods

// XSS prevention helper (v4.0.0)
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
async function loadPayoutMethods() {
    const userId = getPayoutUserId();
    if (!userId) return [];

    try {
        const apiBase = window.API_BASE_URL || 'https://latanda.online';
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        const response = await fetch(`${apiBase}/api/users/payout-methods?user_id=${userId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await response.json();

        if (result.success) {
            window.PayoutSystem.payoutMethods = result.data.payout_methods;
            return result.data.payout_methods;
        }
    } catch (error) {
        /* Network or parse error loading payout methods */
    }
    return [];
}

// Render payout methods section
function renderPayoutMethodsSection(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const methods = window.PayoutSystem.payoutMethods;

    let html = `
        <div class="payout-methods-section">
            <div class="payout-methods-header">
                <h3><span>💳</span> Mis Métodos de Cobro</h3>
                <button class="add-payout-method-btn" data-action="payout-add-method">
                    <span>+</span> Agregar
                </button>
            </div>
            <div class="payout-methods-list">
    `;

    if (methods.length === 0) {
        html += `
            <div class="no-payout-methods">
                <div class="icon">💰</div>
                <p>No tienes métodos de cobro registrados</p>
                <p style="font-size: 0.9rem;">Agrega uno para poder recibir tus tandas</p>
            </div>
        `;
    } else {
        methods.forEach(method => {
            const icon = method.method_type === 'bank_transfer' ? '🏦' :
                        method.method_type === 'mobile_money' ? '📱' : '₿';
            const iconClass = method.method_type === 'bank_transfer' ? 'bank' :
                             method.method_type === 'mobile_money' ? 'tigo' : 'crypto';

            let details = '';
            if (method.method_type === 'bank_transfer') {
                details = `${escapeHtml(method.bank_name)} - ****${escapeHtml(method.bank_account_number?.slice(-4) || '')}`;
            } else if (method.method_type === 'mobile_money') {
                details = `Tigo Money: ${escapeHtml(method.tigo_phone)}`;
            } else {
                details = `${escapeHtml(method.crypto_network)}: ${escapeHtml(method.crypto_address?.slice(0,10) || '')}...`;
            }

            html += `
                <div class="payout-method-card ${method.is_default ? 'default' : ''}">
                    <div class="payout-method-info">
                        <div class="payout-method-icon ${iconClass}">${icon}</div>
                        <div class="payout-method-details">
                            <h4>
                                ${method.method_type === 'bank_transfer' ? 'Transferencia Bancaria' :
                                  method.method_type === 'mobile_money' ? 'Tigo Money' : 'Criptomoneda'}
                                ${method.is_default ? '<span class="default-badge">Predeterminado</span>' : ''}
                            </h4>
                            <p>${details}</p>
                        </div>
                    </div>
                    <div class="payout-method-actions">
                        ${!method.is_default ? `<button data-action="payout-set-default" data-method-id="${escapeHtml(method.id)}">Predeterminado</button>` : ''}
                        <button class="delete-btn" data-action="payout-delete-method" data-method-id="${escapeHtml(method.id)}">Eliminar</button>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    container.innerHTML = html;
}

// Add payout method modal HTML
function getPayoutMethodModalHTML() {
    return `
        <div class="payout-modal-overlay" id="payoutMethodModal">
            <div class="payout-modal">
                <div class="payout-modal-header">
                    <h3>Agregar Método de Cobro</h3>
                    <button class="payout-modal-close" data-action="payout-close-modal">&times;</button>
                </div>
                <div class="payout-modal-body">
                    <div class="method-type-selector">
                        <div class="method-type-option" data-type="bank_transfer" data-action="payout-select-type">
                            <div class="icon">🏦</div>
                            <div class="label">Banco</div>
                        </div>
                        <div class="method-type-option" data-type="mobile_money" data-action="payout-select-type">
                            <div class="icon">📱</div>
                            <div class="label">Tigo Money</div>
                        </div>
                        <div class="method-type-option" data-type="crypto" data-action="payout-select-type">
                            <div class="icon">₿</div>
                            <div class="label">Crypto</div>
                        </div>
                    </div>

                    <div id="bankFields" style="display: none;">
                        <div class="payout-form-group">
                            <label>Banco</label>
                            <select id="bankName">
                                <option value="">Selecciona el banco</option>
                                <option value="Banco Atlántida">Banco Atlántida</option>
                                <option value="BAC Honduras">BAC Honduras</option>
                                <option value="Banco Ficohsa">Banco Ficohsa</option>
                                <option value="Banco de Occidente">Banco de Occidente</option>
                                <option value="Banpaís">Banpaís</option>
                                <option value="Banco Lafise">Banco Lafise</option>
                                <option value="Davivienda">Davivienda</option>
                            </select>
                        </div>
                        <div class="payout-form-group">
                            <label>Número de Cuenta</label>
                            <input type="text" id="bankAccountNumber" placeholder="Ej: 1234567890">
                        </div>
                        <div class="payout-form-group">
                            <label>Tipo de Cuenta</label>
                            <select id="bankAccountType">
                                <option value="ahorro">Ahorro</option>
                                <option value="corriente">Corriente</option>
                            </select>
                        </div>
                        <div class="payout-form-group">
                            <label>Titular de la Cuenta</label>
                            <input type="text" id="bankAccountHolder" placeholder="Nombre completo">
                        </div>
                    </div>

                    <div id="tigoFields" style="display: none;">
                        <div class="payout-form-group">
                            <label>Número Tigo Money</label>
                            <input type="tel" id="tigoPhone" placeholder="+504 9999-9999">
                        </div>
                        <div class="payout-form-group">
                            <label>Nombre del Titular</label>
                            <input type="text" id="tigoName" placeholder="Nombre completo">
                        </div>
                    </div>

                    <div id="cryptoFields" style="display: none;">
                        <div class="payout-form-group">
                            <label>Red</label>
                            <select id="cryptoNetwork">
                                <option value="ethereum">Ethereum (ERC-20)</option>
                                <option value="polygon">Polygon</option>
                                <option value="bitcoin">Bitcoin</option>
                            </select>
                        </div>
                        <div class="payout-form-group">
                            <label>Dirección de Wallet</label>
                            <input type="text" id="cryptoAddress" placeholder="0x... o bc1...">
                        </div>
                    </div>

                    <div class="payout-form-group">
                        <label>
                            <input type="checkbox" id="setAsDefault"> Establecer como predeterminado
                        </label>
                    </div>
                </div>
                <div class="payout-modal-footer">
                    <button class="payout-btn payout-btn-secondary" data-action="payout-close-modal">Cancelar</button>
                    <button class="payout-btn payout-btn-primary" data-action="payout-save-method">Guardar</button>
                </div>
            </div>
        </div>
    `;
}

// Collect Tanda Modal HTML
function getCollectTandaModalHTML() {
    return `
        <div class="payout-modal-overlay" id="collectTandaModal">
            <div class="payout-modal">
                <div class="payout-modal-header">
                    <h3>🎉 Cobrar mi Tanda</h3>
                    <button class="payout-modal-close" data-action="payout-close-collect">&times;</button>
                </div>
                <div class="payout-modal-body" id="collectTandaContent">
                    <!-- Content will be loaded dynamically -->
                </div>
            </div>
        </div>
    `;
}

// Initialize modals
function initPayoutModals() {
    if (!document.getElementById('payoutMethodModal')) {
        document.body.insertAdjacentHTML('beforeend', getPayoutMethodModalHTML());
    }
    if (!document.getElementById('collectTandaModal')) {
        document.body.insertAdjacentHTML('beforeend', getCollectTandaModalHTML());
    }
}

// Open add payout method modal
window.openAddPayoutMethodModal = function() {
    initPayoutModals();
    document.getElementById('payoutMethodModal').classList.add('active');
    selectMethodType('bank_transfer');
};

// Close modal
window.closePayoutMethodModal = function() {
    document.getElementById('payoutMethodModal').classList.remove('active');
};

// Select method type
window.selectMethodType = function(type) {
    document.querySelectorAll('.method-type-option').forEach(el => {
        el.classList.remove('selected');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');

    document.getElementById('bankFields').style.display = type === 'bank_transfer' ? 'block' : 'none';
    document.getElementById('tigoFields').style.display = type === 'mobile_money' ? 'block' : 'none';
    document.getElementById('cryptoFields').style.display = type === 'crypto' ? 'block' : 'none';

    window.PayoutSystem.selectedMethodType = type;
};

// Save payout method
window.savePayoutMethod = async function() {
    const userId = getPayoutUserId();
    const type = window.PayoutSystem.selectedMethodType;

    const data = {
        user_id: userId,
        method_type: type,
        is_default: document.getElementById('setAsDefault').checked
    };

    if (type === 'bank_transfer') {
        data.bank_name = document.getElementById('bankName').value;
        data.bank_account_number = document.getElementById('bankAccountNumber').value;
        data.bank_account_type = document.getElementById('bankAccountType').value;
        data.bank_account_holder = document.getElementById('bankAccountHolder').value;

        if (!data.bank_name || !data.bank_account_number || !data.bank_account_holder) {
            alert('Por favor completa todos los campos del banco');
            return;
        }
    } else if (type === 'mobile_money') {
        data.tigo_phone = document.getElementById('tigoPhone').value;
        data.tigo_name = document.getElementById('tigoName').value;

        if (!data.tigo_phone || !data.tigo_name) {
            alert('Por favor completa todos los campos de Tigo Money');
            return;
        }
    } else if (type === 'crypto') {
        data.crypto_network = document.getElementById('cryptoNetwork').value;
        data.crypto_address = document.getElementById('cryptoAddress').value;

        if (!data.crypto_address) {
            alert('Por favor ingresa la dirección de wallet');
            return;
        }
    }

    try {
        const apiBase = window.API_BASE_URL || 'https://latanda.online';
        const payToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        const response = await fetch(`${apiBase}/api/users/payout-methods`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(payToken ? { 'Authorization': `Bearer ${payToken}` } : {}) },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            closePayoutMethodModal();
            await loadPayoutMethods();
            renderPayoutMethodsSection('payoutMethodsContainer');
            if (window.showSuccess) window.showSuccess('Método de cobro agregado');
        } else {
            alert('Error al guardar el método de cobro');
        }
    } catch (error) {
        alert('Error al guardar el método de cobro');
    }
};

// Set default payout method
window.setDefaultPayoutMethod = async function(methodId) {
    try {
        const apiBase = window.API_BASE_URL || 'https://latanda.online';
        const defToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        const response = await fetch(`${apiBase}/api/users/payout-methods/${methodId}/default`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(defToken ? { 'Authorization': `Bearer ${defToken}` } : {}) }
        });

        const result = await response.json();

        if (result.success) {
            await loadPayoutMethods();
            renderPayoutMethodsSection('payoutMethodsContainer');
        }
    } catch (error) {
        /* Network error setting default method */
    }
};

// Delete payout method
window.deletePayoutMethod = async function(methodId) {
    if (!confirm('¿Eliminar este método de cobro?')) return;

    try {
        const apiBase = window.API_BASE_URL || 'https://latanda.online';
        const delToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        const response = await fetch(`${apiBase}/api/users/payout-methods/${methodId}`, {
            method: 'DELETE',
            headers: delToken ? { 'Authorization': `Bearer ${delToken}` } : {}
        });

        const result = await response.json();

        if (result.success) {
            await loadPayoutMethods();
            renderPayoutMethodsSection('payoutMethodsContainer');
        }
    } catch (error) {
        /* Network error deleting payout method */
    }
};

// Check payout eligibility
window.checkPayoutEligibility = async function(groupId) {
    const userId = getPayoutUserId();
    if (!userId || !groupId) return null;

    try {
        const apiBase = window.API_BASE_URL || 'https://latanda.online';
        const eligToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        if (!eligToken) return null;
        const response = await fetch(`${apiBase}/api/groups/${encodeURIComponent(groupId)}/payout/eligibility`, {
            headers: { 'Authorization': `Bearer ${eligToken}` }
        });
        if (!response.ok) return null;
        const result = await response.json();

        if (result.success) {
            window.PayoutSystem.eligibility = result.data;
            return result.data;
        }
    } catch (error) {
        /* Network error checking eligibility */
    }
    return null;
};

// Render collect tanda section
window.renderCollectTandaSection = function(containerId, groupId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const eligibility = window.PayoutSystem.eligibility;

    if (!eligibility || !eligibility.is_beneficiary) {
        container.innerHTML = '';
        return;
    }

    if (eligibility.existing_request) {
        // Show status of existing request
        const status = eligibility.existing_request.status;
        const statusLabels = {
            'pending': 'Pendiente',
            'auto_approved': 'Aprobado',
            'processing': 'Procesando',
            'awaiting_confirmation': 'Esperando tu confirmación',
            'completed': 'Completado',
            'rejected': 'Rechazado'
        };

        container.innerHTML = `
            <div class="payout-status-card">
                <div class="payout-status-header">
                    <h3>Estado de tu Cobro</h3>
                    <span class="payout-status-badge ${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</span>
                </div>
                <p>Monto: <strong>L. ${parseFloat(eligibility.existing_request.net_amount).toLocaleString('es-HN', {minimumFractionDigits: 2})}</strong></p>
                ${status === 'awaiting_confirmation' ? `
                    <button class="collect-tanda-btn" data-action="payout-confirm-receipt" data-group-id="${escapeHtml(groupId)}" data-request-id="${escapeHtml(eligibility.existing_request.id)}">
                        ✓ Confirmar que recibí el pago
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }

    if (!eligibility.cycle_complete) {
        container.innerHTML = `
            <div class="payout-status-card">
                <h3>Tu Turno de Cobrar</h3>
                <p>El ciclo aún no está completo. Faltan ${eligibility.members_count - eligibility.contributions_received} contribuciones.</p>
                <div style="margin-top: 12px; background: #f3f4f6; border-radius: 8px; height: 8px; overflow: hidden;">
                    <div style="background: #16a34a; height: 100%; width: ${(eligibility.contributions_received / eligibility.members_count) * 100}%;"></div>
                </div>
            </div>
        `;
        return;
    }

    // Eligible to collect!
    container.innerHTML = `
        <div class="collect-tanda-section">
            <h3>🎉 ¡Tu tanda está lista!</h3>
            <p>Todos han contribuido. Puedes cobrar tu tanda ahora.</p>
            <div class="collect-tanda-amount">
                L. ${eligibility.amounts.net.toLocaleString('es-HN', {minimumFractionDigits: 2})}
            </div>
            <p style="font-size: 0.85rem; margin-bottom: 16px;">
                (Monto bruto: L. ${eligibility.amounts.gross.toLocaleString('es-HN', {minimumFractionDigits: 2})} - Comisiones: L. ${(eligibility.amounts.coordinator_fee + eligibility.amounts.platform_fee).toLocaleString('es-HN', {minimumFractionDigits: 2})})
            </p>
            <button class="collect-tanda-btn" data-action="payout-collect-tanda" data-group-id="${escapeHtml(groupId)}">
                💰 Cobrar mi Tanda
            </button>
        </div>
    `;
};

// Open collect tanda modal
window.openCollectTandaModal = async function(groupId) {
    initPayoutModals();
    const modal = document.getElementById('collectTandaModal');
    const content = document.getElementById('collectTandaContent');

    await loadPayoutMethods();
    const methods = window.PayoutSystem.payoutMethods;
    const eligibility = window.PayoutSystem.eligibility;

    if (methods.length === 0) {
        // Force registration
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">💳</div>
                <h3>Registra tu método de cobro</h3>
                <p style="color: #6b7280; margin-bottom: 20px;">
                    Para poder recibir tu tanda, primero debes registrar cómo quieres que te paguemos.
                </p>
                <button class="payout-btn payout-btn-primary" data-action="payout-add-method-from-collect">
                    Agregar Método de Cobro
                </button>
            </div>
        `;
    } else {
        // Show confirmation with method selection
        const defaultMethod = methods.find(m => m.is_default) || methods[0];

        content.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 16px;">💰</div>
                <h3>Confirmar Cobro de Tanda</h3>
                <div class="collect-tanda-amount" style="margin: 20px 0;">
                    L. ${eligibility.amounts.net.toLocaleString('es-HN', {minimumFractionDigits: 2})}
                </div>

                <div style="text-align: left; margin: 20px 0;">
                    <label style="font-weight: 500; margin-bottom: 8px; display: block;">Método de pago:</label>
                    <select id="selectedPayoutMethod" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #d1d5db;">
                        ${methods.map(m => `
                            <option value="${escapeHtml(m.id)}" ${m.id === defaultMethod.id ? 'selected' : ''}>
                                ${m.method_type === 'bank_transfer' ? '🏦 ' + escapeHtml(m.bank_name) + ' - ****' + escapeHtml(m.bank_account_number?.slice(-4) || '') :
                                  m.method_type === 'mobile_money' ? '📱 Tigo: ' + escapeHtml(m.tigo_phone) :
                                  '₿ ' + escapeHtml(m.crypto_network) + ': ' + escapeHtml(m.crypto_address?.slice(0,10) || '') + '...'}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 20px;">
                    El pago será procesado y recibirás una notificación cuando esté listo.
                </p>

                <button class="payout-btn payout-btn-primary" style="width: 100%;" data-action="payout-request" data-group-id="${escapeHtml(groupId)}">
                    ✓ Confirmar y Solicitar Cobro
                </button>
            </div>
        `;
    }

    modal.classList.add('active');
};

window.closeCollectTandaModal = function() {
    document.getElementById('collectTandaModal').classList.remove('active');
};

// Request payout
window.requestPayout = async function(groupId) {
    const userId = getPayoutUserId();
    const payoutMethodId = document.getElementById('selectedPayoutMethod').value;

    try {
        const apiBase = window.API_BASE_URL || 'https://latanda.online';
        const reqToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        const response = await fetch(`${apiBase}/api/groups/${encodeURIComponent(groupId)}/payout/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(reqToken ? { 'Authorization': `Bearer ${reqToken}` } : {}) },
            body: JSON.stringify({
                payout_method_id: payoutMethodId
            })
        });

        const result = await response.json();

        if (result.success) {
            closeCollectTandaModal();
            if (window.showSuccess) {
                window.showSuccess(result.data.auto_approved ?
                    '¡Solicitud aprobada! El pago será procesado pronto.' :
                    'Solicitud enviada. Pendiente de revisión.');
            }
            // Refresh eligibility
            await checkPayoutEligibility(groupId);
            renderCollectTandaSection('collectTandaContainer', groupId);
        } else {
            alert('No se pudo procesar la solicitud de cobro');
        }
    } catch (error) {
        alert('Error al solicitar cobro');
    }
};

// Confirm receipt
window.confirmPayoutReceipt = async function(groupId, payoutRequestId) {
    if (!confirm('¿Confirmas que recibiste el pago de tu tanda?')) return;

    const userId = getPayoutUserId();

    try {
        const apiBase = window.API_BASE_URL || 'https://latanda.online';
        const confToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        const response = await fetch(`${apiBase}/api/groups/${encodeURIComponent(groupId)}/payout/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(confToken ? { 'Authorization': `Bearer ${confToken}` } : {}) },
            body: JSON.stringify({
                payout_request_id: payoutRequestId
            })
        });

        const result = await response.json();

        if (result.success) {
            if (window.showSuccess) window.showSuccess('¡Recepción confirmada! Ciclo cerrado.');
            await checkPayoutEligibility(groupId);
            renderCollectTandaSection('collectTandaContainer', groupId);
        } else {
            alert('No se pudo confirmar la recepción del pago');
        }
    } catch (error) {
        alert('Error al confirmar la recepción');
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadPayoutMethods();
});


// ============================================
// AUTO-INITIALIZATION
// ============================================

// Initialize payout system when page is ready
async function initPayoutSystem() {

    // Wait for DOM to be ready
    if (document.readyState !== "complete") {
        await new Promise(resolve => {
            window.addEventListener("load", resolve);
        });
    }

    // Load user payout methods
    await loadPayoutMethods();

    // Always render methods section (it shows "add method" if empty)
    renderPayoutMethodsSection("payoutMethodsContainer");

    // Check if we have a selected group or tandas data
    // We will check eligibility for each group the user has
    setTimeout(async () => {
        // Get groups from tandasData if available
        if (window.tandasData && window.tandasData.length > 0) {
            // Find the first active group where user might be beneficiary
            for (const tanda of window.tandasData) {
                if (tanda.status === "active" || tanda.status === "collecting") {
                    const groupId = tanda.group_id || tanda.tanda_id?.split("_")[0];
                    if (groupId) {
                        const eligibility = await checkPayoutEligibility(groupId);
                        if (eligibility && eligibility.is_beneficiary) {
                            window.PayoutSystem.currentGroupId = groupId;
                            renderCollectTandaSection("collectTandaContainer", groupId);
                            break;
                        }
                    }
                }
            }
        }
    }, 2000); // Wait for tandas to load

}

// Hook into the refreshTandas function to also update payout eligibility
const originalRefreshTandas = window.refreshTandas;
if (typeof originalRefreshTandas === "function") {
    window.refreshTandas = async function() {
        await originalRefreshTandas.apply(this, arguments);
        // Re-check payout eligibility after tandas refresh
        setTimeout(async () => {
            if (window.tandasData && window.tandasData.length > 0) {
                for (const tanda of window.tandasData) {
                    if (tanda.status === "active" || tanda.status === "collecting") {
                        const groupId = tanda.group_id || tanda.tanda_id?.split("_")[0];
                        if (groupId) {
                            const eligibility = await checkPayoutEligibility(groupId);
                            if (eligibility && eligibility.is_beneficiary) {
                                window.PayoutSystem.currentGroupId = groupId;
                                renderCollectTandaSection("collectTandaContainer", groupId);
                                break;
                            }
                        }
                    }
                }
            }
        }, 500);
    };
}

// Start initialization
initPayoutSystem();

// ============================================
// DELEGATED CLICK HANDLER
// ============================================
document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');

    switch (action) {
        case 'payout-add-method':
            openAddPayoutMethodModal();
            break;
        case 'payout-close-modal':
            closePayoutMethodModal();
            break;
        case 'payout-select-type':
            var type = btn.getAttribute('data-type');
            if (type) selectMethodType(type);
            break;
        case 'payout-save-method':
            savePayoutMethod();
            break;
        case 'payout-close-collect':
            closeCollectTandaModal();
            break;
        case 'payout-set-default':
            var methodId = btn.getAttribute('data-method-id');
            if (methodId) setDefaultPayoutMethod(methodId);
            break;
        case 'payout-delete-method':
            var delMethodId = btn.getAttribute('data-method-id');
            if (delMethodId) deletePayoutMethod(delMethodId);
            break;
        case 'payout-request':
            var groupId = btn.getAttribute('data-group-id');
            if (groupId) requestPayout(groupId);
            break;
        case 'payout-confirm-receipt':
            var grpId = btn.getAttribute('data-group-id');
            var reqId = btn.getAttribute('data-request-id');
            if (grpId && reqId) confirmPayoutReceipt(grpId, reqId);
            break;
        case 'payout-collect-tanda':
            var collectGroupId = btn.getAttribute('data-group-id');
            if (collectGroupId) openCollectTandaModal(collectGroupId);
            break;
        case 'payout-add-method-from-collect':
            closeCollectTandaModal();
            openAddPayoutMethodModal();
            break;
    }
});
