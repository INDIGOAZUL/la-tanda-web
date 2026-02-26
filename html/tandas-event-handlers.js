/**
 * ============================================
 * 🎮 TANDAS EVENT HANDLERS - v2.0.0
 * Manejadores de eventos e interacciones
 * ============================================
 */

class TandasEventHandlers {
    constructor() {
        this.dataManager = null;
        this.uiRenderer = null;

        console.log('🎮 Tandas Event Handlers initialized');
        this.init();
    }

    /**
     * Initialize event handlers
     */
    init() {
        // Get manager references
        this.dataManager = window.tandasDataManager;
        this.uiRenderer = window.tandasUIRenderer;

        if (!this.dataManager || !this.uiRenderer) {
            console.error('❌ Managers not found');
            return;
        }

        // Setup event listeners
        this.setupSearchListener();
        this.setupFilterListeners();
        this.setupViewToggle();

        console.log('✅ Event Handlers ready');
    }

    /**
     * Setup search input listener
     */
    setupSearchListener() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.dataManager.searchTandas(e.target.value);
            }, 300); // Debounce 300ms
        });

        console.log('🔍 Search listener attached');
    }

    /**
     * Setup filter button listeners
     */
    setupFilterListeners() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (!filterButtons.length) return;

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Apply filter
                const filter = btn.dataset.filter;
                this.dataManager.filterByStatus(filter);
            });
        });

        console.log('🔘 Filter listeners attached');
    }

    /**
     * Setup view toggle listeners
     */
    setupViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        if (!viewButtons.length) return;

        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.uiRenderer.switchView(view);
            });
        });

        console.log('👁️ View toggle listeners attached');
    }

    /**
     * Handle tanda card click
     */
    handleTandaClick(tandaId) {
        console.log('📌 Tanda clicked:', tandaId);
        this.handleViewDetails(tandaId);
    }

    /**
     * Handle view details action
     */
    handleViewDetails(tandaId) {
        const tanda = this.dataManager.getTandaById(tandaId);
        if (!tanda) {
            console.error('Tanda not found:', tandaId);
            return;
        }

        console.log('👁️ Viewing details for:', tanda.name);

        // For now, show detailed modal
        this.showTandaDetailsModal(tanda);
    }

    /**
     * Show tanda details modal
     */
    showTandaDetailsModal(tanda) {
        // Create modal HTML
        const modalHtml = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
                    <!-- Header -->
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-hand-holding-usd"></i>
                            ${tanda.name}
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="modal-body">
                        <div class="tanda-details-grid">
                            <div class="detail-row">
                                <span class="detail-label">Estado</span>
                                <span class="tanda-status-badge ${tanda.status}">${this.uiRenderer.getStatusLabel(tanda.status)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Descripción</span>
                                <span class="detail-value">${tanda.description || 'Sin descripción'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Contribución por ronda</span>
                                <span class="detail-value">${this.dataManager.formatCurrency(tanda.contribution_per_round)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Total de la tanda</span>
                                <span class="detail-value">${this.dataManager.formatCurrency(tanda.total_amount)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Frecuencia de pago</span>
                                <span class="detail-value">${this.uiRenderer.getFrequencyLabel(tanda.payment_frequency)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Participantes</span>
                                <span class="detail-value">${tanda.current_participants}/${tanda.participant_count}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Ronda actual</span>
                                <span class="detail-value">${tanda.current_round}/${tanda.participant_count}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Mi posición</span>
                                <span class="detail-value">#${tanda.my_position}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Fecha de inicio</span>
                                <span class="detail-value">${this.dataManager.formatDate(tanda.start_date)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Fecha de finalización</span>
                                <span class="detail-value">${this.dataManager.formatDate(tanda.end_date)}</span>
                            </div>
                            ${tanda.next_payment_date ? `
                                <div class="detail-row">
                                    <span class="detail-label">Próximo pago</span>
                                    <span class="detail-value">${this.dataManager.formatDate(tanda.next_payment_date)}</span>
                                </div>
                            ` : ''}
                            ${tanda.is_coordinator ? `
                                <div class="detail-row">
                                    <span class="detail-label">Rol</span>
                                    <span class="detail-value"><i class="fas fa-crown" style="color: #fbbf24;"></i> Coordinador</span>
                                </div>
                            ` : ''}
                        </div>

                        ${tanda.participants && tanda.participants.length > 0 ? `
                            <div style="margin-top: 1.5rem;">
                                <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Participantes</h4>
                                <div class="participants-list">
                                    ${tanda.participants.map(p => `
                                        <div class="participant-item">
                                            <span class="participant-position">#${p.position}</span>
                                            <span class="participant-name">${p.name}</span>
                                            <span class="participant-status ${p.status}">${this.getParticipantStatusLabel(p.status)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Footer -->
                    <div class="modal-footer">
                        <button class="action-btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cerrar
                        </button>
                        ${tanda.status === 'active' ? `
                            <button class="action-btn btn-primary" onclick="tandasEventHandlers.handleMakePayment('${tanda.id}'); this.closest('.modal-overlay').remove();">
                                <i class="fas fa-dollar-sign"></i> Realizar Pago
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * Handle make payment action
     */
    handleMakePayment(tandaId) {
        const tanda = this.dataManager.getTandaById(tandaId);
        if (!tanda) return;

        console.log('💰 Make payment for:', tanda.name);

        // Show payment modal
        this.showPaymentModal(tanda);
    }

    /**
     * Show payment modal
     */
    showPaymentModal(tanda) {
        const modalHtml = `
            <div class="modal-overlay" id="payment-modal" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-dollar-sign"></i>
                            Realizar Pago
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="modal-body">
                        <div class="payment-info" style="background: rgba(0, 255, 255, 0.1); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; border: 1px solid rgba(0, 255, 255, 0.2);">
                            <div style="margin-bottom: 0.5rem;">
                                <strong style="color: var(--text-primary);">Tanda:</strong> ${tanda.name}
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <strong style="color: var(--text-primary);">Ronda actual:</strong> ${tanda.current_round}
                            </div>
                            <div>
                                <strong style="color: var(--text-primary);">Monto a pagar:</strong>
                                <span style="color: var(--tanda-cyan); font-size: 1.25rem; font-weight: 700;">${this.dataManager.formatCurrency(tanda.contribution_per_round)}</span>
                            </div>
                        </div>

                        <form id="payment-form">
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-weight: 600;">Método de pago</label>
                                <select id="payment-method" required style="width: 100%; padding: 0.75rem; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 10px; color: var(--text-primary);">
                                    <option value="">Seleccionar método</option>
                                    <option value="cash">Efectivo</option>
                                    <option value="bank_transfer">Transferencia bancaria</option>
                                    <option value="crypto">Criptomoneda</option>
                                </select>
                            </div>

                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-weight: 600;">Notas (opcional)</label>
                                <textarea id="payment-notes" rows="3" placeholder="Añadir notas sobre este pago..." style="width: 100%; padding: 0.75rem; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 10px; color: var(--text-primary); resize: vertical;"></textarea>
                            </div>
                        </form>
                    </div>

                    <div class="modal-footer">
                        <button class="action-btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button class="action-btn btn-primary" onclick="tandasEventHandlers.confirmPayment('${tanda.id}')">
                            <i class="fas fa-check"></i> Confirmar Pago
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * Confirm payment
     */
    async confirmPayment(tandaId) {
        const method = document.getElementById('payment-method')?.value;
        const notes = document.getElementById('payment-notes')?.value;

        if (!method) {
            this.uiRenderer.showNotification('Por favor selecciona un método de pago', 'error');
            return;
        }

        console.log('💰 Confirming payment...');

        // Close modal
        document.getElementById('payment-modal')?.remove();

        // Show loading
        this.uiRenderer.showLoading();

        // Process payment
        const result = await this.dataManager.makePayment(tandaId, {
            method: method,
            notes: notes
        });

        // Hide loading
        this.uiRenderer.hideLoading();

        if (result.success) {
            this.uiRenderer.showNotification('Pago procesado exitosamente', 'success');
        } else {
            this.uiRenderer.showNotification(`Error: ${result.error}`, 'error');
        }
    }


    /**
     * Handle start tanda action (coordinator only)
     */
    async handleStartTanda(tandaId) {
        const tanda = this.dataManager.getTandaById(tandaId);
        if (!tanda) return;

        console.log('🚀 Start tanda:', tanda.name);

        // Show confirmation
        this.showConfirmModal(
            'Iniciar Tanda',
            '¿Estás seguro de que quieres iniciar "' + tanda.name + '"? Una vez iniciada, comenzará el ciclo de pagos y cobros.',
            async () => {
                this.uiRenderer.showLoading();

                try {
                    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
                    const response = await fetch('/api/tandas/start', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '')
                        },
                        body: JSON.stringify({
                            tanda_id: tandaId,
                            user_id: userId
                        })
                    });

                    const result = await response.json();

                    this.uiRenderer.hideLoading();

                    if (result.success) {
                        this.uiRenderer.showNotification('¡Tanda iniciada exitosamente! El primer turno ha comenzado.', 'success');
                        // Refresh data
                        await this.dataManager.fetchTandas();
                    } else {
                        const errorMsg = (result.data && result.data.error && result.data.error.message) || 'No se pudo iniciar la tanda';
                        this.uiRenderer.showNotification('Error: ' + errorMsg, 'error');
                    }
                } catch (error) {
                    this.uiRenderer.hideLoading();
                    this.uiRenderer.showNotification('Error de conexión: ' + error.message, 'error');
                }
            }
        );
    }

    /**
     * Handle leave tanda action
     */
    handleLeaveTanda(tandaId) {
        const tanda = this.dataManager.getTandaById(tandaId);
        if (!tanda) return;

        console.log('🚪 Leave tanda:', tanda.name);

        // Show confirmation
        this.showConfirmModal(
            'Salir de Tanda',
            `¿Estás seguro de que quieres salir de "${tanda.name}"? Esta acción no se puede deshacer.`,
            async () => {
                this.uiRenderer.showLoading();

                const result = await this.dataManager.leaveTanda(tandaId);

                this.uiRenderer.hideLoading();

                if (result.success) {
                    this.uiRenderer.showNotification('Has salido de la tanda exitosamente', 'success');
                } else {
                    this.uiRenderer.showNotification(`Error: ${result.error}`, 'error');
                }
            }
        );
    }

    /**
     * Handle duplicate tanda action
     */
    handleDuplicate(tandaId) {
        const tanda = this.dataManager.getTandaById(tandaId);
        if (!tanda) return;

        console.log('📋 Duplicate tanda:', tanda.name);

        // Redirect to create tanda page with pre-filled data
        const params = new URLSearchParams({
            template: tandaId,
            name: `${tanda.name} (Copia)`,
            amount: tanda.contribution_per_round,
            participants: tanda.participant_count,
            frequency: tanda.payment_frequency
        });

        window.location.href = `create-tanda.html?${params.toString()}`;
    }

    /**
     * Show confirmation modal
     */
    showConfirmModal(title, message, onConfirm) {
        const modalHtml = `
            <div class="modal-overlay" id="confirm-modal" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 450px;">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-exclamation-triangle" style="color: #f97316;"></i>
                            ${title}
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="modal-body">
                        <p style="color: var(--text-secondary); line-height: 1.6;">${message}</p>
                    </div>

                    <div class="modal-footer">
                        <button class="action-btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button class="action-btn btn-danger" onclick="
                            this.closest('.modal-overlay').remove();
                            (${onConfirm.toString()})();
                        ">
                            <i class="fas fa-check"></i> Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * Get participant status label
     */
    getParticipantStatusLabel(status) {
        const labels = {
            'paid': 'Pagado',
            'pending': 'Pendiente',
            'upcoming': 'Próximo',
            'joined': 'Unido',
            'late': 'Retrasado'
        };
        return labels[status] || status;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.TandasEventHandlers = TandasEventHandlers;
    console.log('🌐 Tandas Event Handlers class available globally');
}
