/**
 * ============================================
 * 🎨 TANDAS UI RENDERER - v2.0.0
 * Renderizado de interfaz de tandas
 * ============================================
 */

class TandasUIRenderer {
    constructor() {
        this.dataManager = null;
        this.currentView = 'grid'; // grid or list

        console.log('🎨 Tandas UI Renderer initialized');
        this.init();
    }

    /**
     * Initialize UI Renderer
     */
    init() {
        // Get data manager reference
        this.dataManager = window.tandasDataManager;

        if (!this.dataManager) {
            console.error('❌ Data Manager not found');
            return;
        }

        // Listen for data updates
        window.addEventListener('tandas-data-updated', (event) => {
            this.renderAll(event.detail);
        });

        console.log('✅ UI Renderer ready');
    }

    /**
     * Render all UI components
     */
    renderAll(data) {
        this.renderStats(data.stats);
        this.renderTandas(data.tandas);
        this.updateCount(data.count);
    }

    /**
     * Render statistics cards
     */
    renderStats(stats) {
        // Active tandas
        const statActive = document.getElementById('stat-active');
        if (statActive) {
            statActive.textContent = stats.active;
        }

        // Next payment
        const statNextPayment = document.getElementById('stat-next-payment');
        const statNextDate = document.getElementById('stat-next-date');

        if (statNextPayment && stats.nextPayment) {
            statNextPayment.textContent = this.dataManager.formatCurrency(stats.nextPayment);
        } else if (statNextPayment) {
            statNextPayment.textContent = '-';
        }

        if (statNextDate && stats.nextPaymentDate) {
            const relativeDate = this.dataManager.formatRelativeDate(stats.nextPaymentDate);
            statNextDate.innerHTML = `<i class="fas fa-calendar"></i> ${relativeDate}`;
        } else if (statNextDate) {
            statNextDate.innerHTML = '<i class="fas fa-calendar"></i> -';
        }

        // Completed tandas
        const statCompleted = document.getElementById('stat-completed');
        if (statCompleted) {
            statCompleted.textContent = stats.completed;
        }

        // Total earnings
        const statEarnings = document.getElementById('stat-earnings');
        if (statEarnings) {
            statEarnings.textContent = this.dataManager.formatCurrency(stats.totalEarnings);
        }

        console.log('📊 Stats rendered');
    }

    /**
     * Render tandas grid/list
     */
    renderTandas(tandas) {
        const grid = document.getElementById('tandas-grid');
        const loading = document.getElementById('loading-state');
        const empty = document.getElementById('empty-state');

        if (!grid) return;

        // Hide loading
        if (loading) loading.style.display = 'none';

        // Show/hide empty state
        if (tandas.length === 0) {
            grid.style.display = 'none';
            if (empty) empty.style.display = 'block';
            return;
        }

        // Hide empty state and show grid
        if (empty) empty.style.display = 'none';
        grid.style.display = this.currentView === 'grid' ? 'grid' : 'flex';

        // Update grid class
        grid.className = this.currentView === 'grid' ? 'tandas-grid' : 'tandas-list';

        // Render cards
        grid.innerHTML = tandas.map(tanda => this.renderTandaCard(tanda)).join('');

        console.log(`🎨 Rendered ${tandas.length} tanda cards in ${this.currentView} view`);
    }

    /**
     * Render individual tanda card
     */
    renderTandaCard(tanda) {
        const statusClass = tanda.status.toLowerCase();
        const statusLabel = this.getStatusLabel(tanda.status);
        const frequencyLabel = this.getFrequencyLabel(tanda.payment_frequency);

        return `
            <div class="tanda-card" data-tanda-id="${tanda.id}" onclick="tandasEventHandlers.handleTandaClick('${tanda.id}')">
                <!-- Header -->
                <div class="tanda-header">
                    <div class="tanda-title-group">
                        <h3>${this.escapeHtml(tanda.name)}</h3>
                        <div class="tanda-meta">
                            <i class="fas fa-calendar-alt"></i> ${frequencyLabel}
                            ${tanda.is_coordinator ? ' • <i class="fas fa-crown" style="color: #fbbf24;"></i> Coordinador' : ''}
                        </div>
                    </div>
                    <span class="tanda-status-badge ${statusClass}">${statusLabel}</span>
                </div>

                <!-- Amount -->
                <div class="tanda-amount">
                    <div>
                        <div class="amount-label">Contribución por ronda</div>
                        <div class="amount-value">${this.dataManager.formatCurrency(tanda.contribution_per_round)}</div>
                    </div>
                </div>

                <!-- Progress (only for active tandas) -->
                ${tanda.status === 'active' ? `
                    <div class="tanda-progress-section">
                        <div class="progress-header">
                            <span class="progress-label">Progreso</span>
                            <span class="progress-percentage">${tanda.completion_percentage}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${tanda.completion_percentage}%"></div>
                        </div>
                    </div>
                ` : ''}

                <!-- Details -->
                <div class="tanda-details">
                    <div class="detail-item">
                        <span class="detail-label">Participantes</span>
                        <span class="detail-value">${tanda.current_participants}/${tanda.participant_count}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Ronda actual</span>
                        <span class="detail-value">${tanda.current_round}/${tanda.participant_count}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Mi posición</span>
                        <span class="detail-value">#${tanda.my_position}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">${tanda.status === 'completed' ? 'Finalizado' : 'Próximo pago'}</span>
                        <span class="detail-value">${tanda.next_payment_date ? this.dataManager.formatRelativeDate(tanda.next_payment_date) : '-'}</span>
                    </div>
                </div>

                <!-- Actions -->
                <div class="tanda-actions">
                    ${this.renderTandaActions(tanda)}
                </div>
            </div>
        `;
    }

    /**
     * Render tanda actions based on status
     */
    renderTandaActions(tanda) {
        switch (tanda.status) {
            case 'recruiting':
                // Only coordinator can start the tanda
                if (tanda.is_coordinator) {
                    return `
                        <button class="action-btn btn-success btn-sm" onclick="event.stopPropagation(); tandasEventHandlers.handleStartTanda('${tanda.id}')">
                            <i class="fas fa-play"></i> Iniciar Tanda
                        </button>
                        <button class="action-btn btn-secondary btn-sm" onclick="event.stopPropagation(); tandasEventHandlers.handleViewDetails('${tanda.id}')">
                            <i class="fas fa-users"></i> Invitar
                        </button>
                    `;
                } else {
                    return `
                        <button class="action-btn btn-primary btn-sm" onclick="event.stopPropagation(); tandasEventHandlers.handleViewDetails('${tanda.id}')">
                            <i class="fas fa-eye"></i> Ver Detalles
                        </button>
                        <span class="text-muted" style="font-size: 0.85rem; color: #94a3b8;">
                            <i class="fas fa-clock"></i> Esperando inicio
                        </span>
                    `;
                }

            case 'active':
                return `
                    <button class="action-btn btn-primary btn-sm" onclick="event.stopPropagation(); tandasEventHandlers.handleViewDetails('${tanda.id}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    <button class="action-btn btn-secondary btn-sm" onclick="event.stopPropagation(); tandasEventHandlers.handleMakePayment('${tanda.id}')">
                        <i class="fas fa-dollar-sign"></i> Pagar
                    </button>
                `;

            case 'pending':
                return `
                    <button class="action-btn btn-primary btn-sm" onclick="event.stopPropagation(); tandasEventHandlers.handleViewDetails('${tanda.id}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    <button class="action-btn btn-secondary btn-sm" onclick="event.stopPropagation(); tandasEventHandlers.handleLeaveTanda('${tanda.id}')">
                        <i class="fas fa-sign-out-alt"></i> Salir
                    </button>
                `;

            case 'completed':
                return `
                    <button class="action-btn btn-primary btn-sm" onclick="event.stopPropagation(); tandasEventHandlers.handleViewDetails('${tanda.id}')">
                        <i class="fas fa-history"></i> Ver Historial
                    </button>
                    <button class="action-btn btn-secondary btn-sm" onclick="event.stopPropagation(); tandasEventHandlers.handleDuplicate('${tanda.id}')">
                        <i class="fas fa-copy"></i> Duplicar
                    </button>
                `;

            default:
                return '';
        }
    }

    /**
     * Update tandas count
     */
    updateCount(count) {
        const countEl = document.getElementById('tandas-count');
        if (countEl) {
            countEl.textContent = count;
        }
    }

    /**
     * Get status label in Spanish
     */
    getStatusLabel(status) {
        const labels = {
            'recruiting': 'Reclutando',
            'active': 'Activa',
            'pending': 'Pendiente',
            'completed': 'Completada',
            'cancelled': 'Cancelada'
        };
        return labels[status] || status;
    }

    /**
     * Get frequency label in Spanish
     */
    getFrequencyLabel(frequency) {
        const labels = {
            'weekly': 'Semanal',
            'biweekly': 'Quincenal',
            'monthly': 'Mensual',
            'quarterly': 'Trimestral'
        };
        return labels[frequency] || frequency;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Switch view mode (grid/list)
     */
    switchView(view) {
        this.currentView = view;

        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });

        // Re-render tandas
        if (this.dataManager) {
            const tandas = this.dataManager.getFilteredTandas();
            this.renderTandas(tandas);
        }

        console.log(`🔄 Switched to ${view} view`);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        // Remove existing notification
        const existing = document.querySelector('.tandas-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `tandas-notification ${type}`;

        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';

        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutToRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loading = document.getElementById('loading-state');
        const grid = document.getElementById('tandas-grid');
        const empty = document.getElementById('empty-state');

        if (loading) loading.style.display = 'block';
        if (grid) grid.style.display = 'none';
        if (empty) empty.style.display = 'none';
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = document.getElementById('loading-state');
        if (loading) loading.style.display = 'none';
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.TandasUIRenderer = TandasUIRenderer;
    console.log('🌐 Tandas UI Renderer class available globally');
}
