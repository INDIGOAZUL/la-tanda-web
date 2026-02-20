/**
 * GROUPS SYSTEM INTEGRATION
 * Conecta el sistema completo con la interfaz HTML existente
 * Integra todos los datos reales con elementos visuales
 */

// Standalone XSS prevention helper
function _gasiEscapeHtml(text) {
    if (text == null) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

class GroupsSystemIntegration {
    constructor() {
        this.system = null;
        this.currentTab = 'dashboard';
        this.isInitialized = false;

        this.init();
    }

    async init() {

        // Esperar a que el sistema completo este disponible
        await this.waitForSystem();

        // Configurar event listeners
        this.setupEventListeners();

        // Renderizar interfaz
        this.renderAllSections();

        this.isInitialized = true;
    }

    async waitForSystem() {
        return new Promise((resolve) => {
            const checkSystem = () => {
                if (window.laTandaSystemComplete && window.laTandaSystemComplete.isInitialized) {
                    this.system = window.laTandaSystemComplete;
                    resolve();
                } else {
                    setTimeout(checkSystem, 100);
                }
            };
            checkSystem();
        });
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // System events
        window.addEventListener('tandasDataUpdate', (e) => {
            this.handleDataUpdate(e.detail);
        });

        // Form submissions
        const createGroupForm = document.getElementById('create-group-form');
        if (createGroupForm) {
            this.setupCreateGroupForm(createGroupForm);
        }

        // Filter controls
        this.setupFilterControls();
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        var tabEl = document.querySelector('[data-tab="' + tabName + '"]');
        if (tabEl) tabEl.classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        var sectionEl = document.getElementById(tabName);
        if (sectionEl) sectionEl.classList.add('active');

        this.currentTab = tabName;

        // Render specific section
        this.renderSection(tabName);
    }

    renderAllSections() {
        this.renderDashboard();
        this.renderMyGroups();
        this.renderTandas();
        this.renderMatching();
        this.renderAnalytics();
    }

    // ================================
    // DASHBOARD RENDERING
    // ================================

    renderDashboard() {

        // Don't replace the existing Web3 dashboard, just ensure data is updated
        if (!this.system) return;

        const userStats = this.system.getUserStats();
        const systemStats = this.system.getSystemStats();


        // The dashboard already exists in the HTML with the Web3 styling
        // Just trigger any dynamic updates if needed
        this.updateDashboardStats(userStats, systemStats);
    }

    updateDashboardStats(userStats, systemStats) {
        // Update specific elements if they exist, but don't replace the whole dashboard
        const statElements = {
            'liquidityPool': systemStats.totalLiquidity,
            'activeWallets': systemStats.uniqueMembers,
            'smartContractSuccess': systemStats.successRate
        };

        Object.entries(statElements).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = typeof value === 'number' ?
                    (elementId === 'liquidityPool' ? 'L. ' + (value/1000000).toFixed(1) + 'M+' :
                     elementId === 'smartContractSuccess' ? value + '%' :
                     value.toLocaleString()) : String(value);
            }
        });

    }

    renderRecentActivity() {
        if (!this.system.recentActivity || this.system.recentActivity.length === 0) {
            return '<div class="no-activity">' +
                '<i class="fas fa-history"></i>' +
                '<p>No hay actividad reciente</p>' +
                '</div>';
        }

        return '<div class="activity-list">' +
            this.system.recentActivity.slice(0, 5).map(activity =>
                '<div class="activity-item">' +
                    '<div class="activity-icon">' +
                        '<i class="fas fa-' + _gasiEscapeHtml(this.getActivityIcon(activity.type)) + '"></i>' +
                    '</div>' +
                    '<div class="activity-content">' +
                        '<span class="activity-text">' + _gasiEscapeHtml(activity.description) + '</span>' +
                        '<span class="activity-time">' + _gasiEscapeHtml(this.formatTimeAgo(activity.timestamp)) + '</span>' +
                    '</div>' +
                '</div>'
            ).join('') +
            '</div>';
    }

    getActivityIcon(type) {
        const icons = {
            'payment': 'credit-card',
            'group_created': 'users',
            'tanda_started': 'play-circle',
            'tanda_completed': 'check-circle',
            'member_joined': 'user-plus'
        };
        return icons[type] || 'bell';
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Hace unos minutos';
        if (diffInHours < 24) return 'Hace ' + diffInHours + 'h';

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return 'Hace ' + diffInDays + 'd';

        return time.toLocaleDateString();
    }

    renderSection(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'groups':
                this.renderMyGroups();
                break;
            case 'tandas':
                this.renderTandas();
                break;
            case 'matching':
                this.renderMatching();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
        }
    }

    // ================================
    // MIS GRUPOS RENDERING
    // ================================

    renderMyGroups() {
        const container = document.getElementById('groupsList');
        if (!container || !this.system) return;

        // Get user's groups from the correct system
        const correctSystem = window.advancedGroupsSystem || this.system;
        const userGroups = correctSystem.groups.filter(group =>
            group.isOwner || group.isAdmin
        );


        if (userGroups.length === 0) {
            container.innerHTML = this.renderEmptyState('groups');
            return;
        }

        // Render groups
        container.innerHTML = userGroups.map(group => this.renderGroupCard(group)).join('');

        // Update filter counts
        this.updateFilterCounts(userGroups);
    }

    renderGroupCard(group) {
        // Handle both array and number formats for members
        const membersArray = Array.isArray(group.members) ? group.members : [];
        const membersCount = Array.isArray(group.members) ? group.members.length : (group.members || 0);

        const member = membersArray.find(m => m.userId === this.system.currentUser.id);
        const isAdmin = member?.role === 'admin' || group.isAdmin || group.isOwner;
        const maxMembers = group.maxParticipants || group.maxMembers || 1;
        const progress = Math.round((membersCount / maxMembers) * 100);

        var escapedGroupId = _gasiEscapeHtml(group.id);
        var escapedStatus = _gasiEscapeHtml(group.status);
        var contribution = group.baseContribution || group.contribution || group.contribution_amount || 0;

        return '<div class="group-card ' + escapedStatus + '" data-group-id="' + escapedGroupId + '">' +
                '<div class="group-header">' +
                    '<div class="group-avatar">' +
                        '<i class="fas fa-' + _gasiEscapeHtml(this.getGroupIcon(group.type)) + '"></i>' +
                    '</div>' +
                    '<div class="group-status status-' + escapedStatus + '">' +
                        '<i class="fas fa-circle"></i>' +
                        '<span>' + _gasiEscapeHtml(this.getStatusLabel(group.status)) + '</span>' +
                    '</div>' +
                    (isAdmin ? '<div class="admin-badge">Admin</div>' : '') +
                '</div>' +

                '<div class="group-info">' +
                    '<h3 class="group-name">' + _gasiEscapeHtml(group.name) + '</h3>' +
                    '<p class="group-description">' + _gasiEscapeHtml(group.description) + '</p>' +
                    '<div class="group-location">' +
                        '<i class="fas fa-map-marker-alt"></i>' +
                        '<span>' + _gasiEscapeHtml(group.location) + '</span>' +
                    '</div>' +
                '</div>' +

                '<div class="group-progress">' +
                    '<div class="progress-bar">' +
                        '<div class="progress-fill" style="width: ' + progress + '%"></div>' +
                    '</div>' +
                    '<span class="progress-text">' + _gasiEscapeHtml(String(membersCount)) + '/' + _gasiEscapeHtml(String(maxMembers)) + ' miembros</span>' +
                '</div>' +

                '<div class="group-stats">' +
                    '<div class="stat-item">' +
                        '<span class="stat-label">Cuota</span>' +
                        '<span class="stat-value">L. ' + _gasiEscapeHtml(String(Number(contribution).toLocaleString())) + '</span>' +
                    '</div>' +
                    '<div class="stat-item">' +
                        '<span class="stat-label">Frecuencia</span>' +
                        '<span class="stat-value">' + _gasiEscapeHtml(this.getFrequencyLabel(group.paymentFrequency || group.frequency)) + '</span>' +
                    '</div>' +
                    '<div class="stat-item">' +
                        '<span class="stat-label">Completados</span>' +
                        '<span class="stat-value">' + _gasiEscapeHtml(String(group.stats?.completedCycles || 0)) + '</span>' +
                    '</div>' +
                '</div>' +

                '<div class="group-actions">' +
                    '<button class="btn btn-sm btn-outline" data-action="gasi-view-group" data-group-id="' + escapedGroupId + '">' +
                        '<i class="fas fa-eye"></i> Ver' +
                    '</button>' +
                    (isAdmin ? '<button class="btn btn-sm btn-secondary" data-action="gasi-manage-group" data-group-id="' + escapedGroupId + '">' +
                        '<i class="fas fa-cog"></i> Administrar' +
                    '</button>' : '') +
                    this.renderGroupActionButton(group, member) +
                '</div>' +
            '</div>';
    }

    renderGroupActionButton(group, member) {
        var escapedGroupId = _gasiEscapeHtml(group.id);

        if (group.status === 'active') {
            // Check if user has pending payments
            var activeTanda = this.system.tandas.find(t =>
                t.groupId === group.id && t.status === 'active'
            );

            if (activeTanda) {
                var currentSchedule = activeTanda.paymentSchedule?.find(s => s.round === activeTanda.currentRound);
                var userPayment = currentSchedule?.payments?.find(p => p.payerId === this.system.currentUser.id);

                if (userPayment && !userPayment.paid) {
                    return '<button class="btn btn-sm btn-primary" data-action="gasi-make-payment" data-tanda-id="' + _gasiEscapeHtml(activeTanda.id) + '" data-round="' + _gasiEscapeHtml(String(activeTanda.currentRound)) + '">' +
                            '<i class="fas fa-credit-card"></i> Pagar L.' + _gasiEscapeHtml(String(Number(userPayment.amount).toLocaleString())) +
                        '</button>';
                }
            }

            return '<button class="btn btn-sm btn-success" disabled>' +
                    '<i class="fas fa-check"></i> Al dia' +
                '</button>';
        } else if (group.status === 'recruiting') {
            return '<button class="btn btn-sm btn-primary" data-action="gasi-start-group" data-group-id="' + escapedGroupId + '">' +
                    '<i class="fas fa-play"></i> Iniciar' +
                '</button>';
        }

        return '<button class="btn btn-sm btn-secondary" disabled>' +
                '<i class="fas fa-pause"></i> ' + _gasiEscapeHtml(this.getStatusLabel(group.status)) +
            '</button>';
    }

    // ================================
    // TANDAS RENDERING
    // ================================

    renderTandas() {
        // Use the API-based refreshTandas function if available
        if (typeof window.refreshTandas === "function") {
            window.refreshTandas();
            return;
        }

        const container = document.getElementById('tandasList');
        const loadingElement = document.getElementById('tandasLoading');

        if (!container || !this.system) return;

        // Hide loading
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // Get user's tandas
        const userTandas = this.system.tandas.filter(tanda =>
            tanda.participants.some(p => p.userId === this.system.currentUser.id)
        );


        if (userTandas.length === 0) {
            container.innerHTML = this.renderEmptyState('tandas');
            return;
        }

        container.innerHTML = userTandas.map(tanda => this.renderTandaCard(tanda)).join('');
    }

    renderTandaCard(tanda) {
        const userParticipant = tanda.participants.find(p => p.userId === this.system.currentUser.id);
        const currentSchedule = tanda.paymentSchedule?.find(s => s.round === tanda.currentRound);
        const userPayment = currentSchedule?.payments?.find(p => p.payerId === this.system.currentUser.id);

        const isMyTurn = currentSchedule?.recipient === this.system.currentUser.id;
        const nextPaymentDate = currentSchedule ? new Date(currentSchedule.dueDate).toLocaleDateString() : 'N/A';

        var escapedTandaId = _gasiEscapeHtml(tanda.id);
        var escapedStatus = _gasiEscapeHtml(tanda.status);
        var currentRound = Number(tanda.currentRound) || 0;
        var totalRounds = Number(tanda.totalRounds) || 1;
        var progressPct = (currentRound / totalRounds) * 100;
        var contributionAmount = Number(tanda.contributionAmount) || 0;

        return '<div class="tanda-card ' + escapedStatus + '" data-tanda-id="' + escapedTandaId + '">' +
                '<div class="tanda-header">' +
                    '<div class="tanda-status status-' + escapedStatus + '">' +
                        '<i class="fas fa-' + _gasiEscapeHtml(this.getTandaIcon(tanda.status)) + '"></i>' +
                        '<span>' + _gasiEscapeHtml(this.getStatusLabel(tanda.status)) + '</span>' +
                    '</div>' +
                    (isMyTurn ? '<div class="my-turn-badge">Mi Turno!</div>' : '') +
                '</div>' +

                '<div class="tanda-info">' +
                    '<h3 class="tanda-name">' + _gasiEscapeHtml(tanda.name) + '</h3>' +
                    '<p class="tanda-group">Grupo: ' + _gasiEscapeHtml(tanda.groupName) + '</p>' +
                '</div>' +

                '<div class="tanda-progress">' +
                    '<div class="round-progress">' +
                        '<span class="round-current">Ronda ' + _gasiEscapeHtml(String(currentRound)) + '</span>' +
                        '<span class="round-total">de ' + _gasiEscapeHtml(String(totalRounds)) + '</span>' +
                    '</div>' +
                    '<div class="progress-bar">' +
                        '<div class="progress-fill" style="width: ' + progressPct + '%"></div>' +
                    '</div>' +
                '</div>' +

                '<div class="tanda-details">' +
                    '<div class="detail-item">' +
                        '<span class="detail-label">Mi Posicion:</span>' +
                        '<span class="detail-value">#' + _gasiEscapeHtml(String(userParticipant?.paymentOrder || 'TBD')) + '</span>' +
                    '</div>' +
                    '<div class="detail-item">' +
                        '<span class="detail-label">Contribucion:</span>' +
                        '<span class="detail-value">L. ' + _gasiEscapeHtml(String(contributionAmount.toLocaleString())) + '</span>' +
                    '</div>' +
                    '<div class="detail-item">' +
                        '<span class="detail-label">Proximo Pago:</span>' +
                        '<span class="detail-value">' + _gasiEscapeHtml(nextPaymentDate) + '</span>' +
                    '</div>' +
                '</div>' +

                this.renderTandaPaymentSection(tanda, userPayment, isMyTurn) +

                '<div class="tanda-actions">' +
                    '<button class="btn btn-sm btn-outline" data-action="gasi-view-tanda" data-tanda-id="' + escapedTandaId + '">' +
                        '<i class="fas fa-info-circle"></i> Detalles' +
                    '</button>' +
                    this.renderTandaActionButton(tanda, userPayment, isMyTurn) +
                '</div>' +
            '</div>';
    }

    renderTandaPaymentSection(tanda, userPayment, isMyTurn) {
        if (tanda.status !== 'active') return '';

        if (isMyTurn) {
            var expectedAmount = Number(tanda.contributionAmount) * (tanda.participants.length - 1);
            return '<div class="payment-section my-turn">' +
                    '<div class="payment-alert">' +
                        '<i class="fas fa-money-bill-wave"></i>' +
                        '<span>Es tu turno de cobrar!</span>' +
                    '</div>' +
                    '<div class="expected-amount">' +
                        'Recibiras: L. ' + _gasiEscapeHtml(String(expectedAmount.toLocaleString())) +
                    '</div>' +
                '</div>';
        }

        if (userPayment) {
            var paymentAmount = Number(userPayment.amount) || 0;
            return '<div class="payment-section ' + (userPayment.paid ? 'paid' : 'pending') + '">' +
                    '<div class="payment-status">' +
                        '<i class="fas fa-' + (userPayment.paid ? 'check-circle' : 'clock') + '"></i>' +
                        '<span>' + (userPayment.paid ? 'Pagado' : 'Pendiente') + '</span>' +
                    '</div>' +
                    '<div class="payment-amount">' +
                        'L. ' + _gasiEscapeHtml(String(paymentAmount.toLocaleString())) +
                    '</div>' +
                    (userPayment.paid ?
                        '<div class="payment-date">Pagado: ' + _gasiEscapeHtml(new Date(userPayment.paidDate).toLocaleDateString()) + '</div>' :
                        ''
                    ) +
                '</div>';
        }

        return '';
    }

    renderTandaActionButton(tanda, userPayment, isMyTurn) {
        if (tanda.status !== 'active') return '';

        var escapedTandaId = _gasiEscapeHtml(tanda.id);

        if (isMyTurn) {
            return '<button class="btn btn-sm btn-success" data-action="gasi-collect-payout" data-tanda-id="' + escapedTandaId + '">' +
                    '<i class="fas fa-hand-holding-usd"></i> Cobrar' +
                '</button>';
        }

        if (userPayment && !userPayment.paid) {
            return '<button class="btn btn-sm btn-primary" data-action="gasi-make-payment" data-tanda-id="' + escapedTandaId + '" data-round="' + _gasiEscapeHtml(String(tanda.currentRound)) + '">' +
                    '<i class="fas fa-credit-card"></i> Pagar Ahora' +
                '</button>';
        }

        return '<button class="btn btn-sm btn-outline" disabled>' +
                '<i class="fas fa-check"></i> Completado' +
            '</button>';
    }

    // ================================
    // MATCHING RENDERING
    // ================================

    renderMatching() {
        // Siempre usar nuevo sistema PostgreSQL - NO fallback a formulario viejo
        if (typeof window.loadMatchingTab === 'function') {
            window.loadMatchingTab();
            return;
        }

        // Si loadMatchingTab no existe, mostrar carga y reintentar
        const container = document.getElementById('matchingContainer');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:60px;"><div class="spinner" style="width:50px;height:50px;border:4px solid #e5e7eb;border-top-color:#8b5cf6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto;"></div><p style="margin-top:20px;color:#6b7280;">Cargando sistema de matching...</p></div><style>@keyframes spin{to{transform:rotate(360deg);}}</style>';

        // Reintentar despues de 500ms
        setTimeout(() => {
            if (typeof window.loadMatchingTab === 'function') {
                window.loadMatchingTab();
            } else {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;"><i class="fas fa-exclamation-circle" style="font-size:48px;margin-bottom:16px;"></i><h3>Sistema de matching no disponible</h3><p>Por favor, recarga la pagina.</p><button data-action="gasi-reload-page" style="margin-top:16px;padding:10px 24px;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;">Recargar</button></div>';
            }
        }, 500);

        // NO ejecutar el codigo viejo debajo - return aqui
        return;

        // El codigo viejo del formulario ya no se ejecutara
        container.innerHTML = '<div class="matching-interface">' +
                '<div class="matching-preferences">' +
                    '<h3><i class="fas fa-sliders-h"></i> Configurar Preferencias</h3>' +
                    '<form id="matchingPreferencesForm" class="preferences-form">' +
                        '<div class="form-row">' +
                            '<div class="form-group">' +
                                '<label>Ubicacion Preferida</label>' +
                                '<input type="text" id="preferredLocation" placeholder="Ej: Tegucigalpa">' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label>Tipo de Grupo</label>' +
                                '<select id="preferredType">' +
                                    '<option value="">Cualquiera</option>' +
                                    '<option value="familiar">Familiar</option>' +
                                    '<option value="laboral">Laboral</option>' +
                                    '<option value="comunitario">Comunitario</option>' +
                                    '<option value="comercial">Comercial</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        '<div class="form-row">' +
                            '<div class="form-group">' +
                                '<label>Contribucion Minima (L.)</label>' +
                                '<input type="number" id="minContribution" placeholder="500" min="100">' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label>Contribucion Maxima (L.)</label>' +
                                '<input type="number" id="maxContribution" placeholder="5000" max="50000">' +
                            '</div>' +
                        '</div>' +
                        '<div class="form-row">' +
                            '<div class="form-group">' +
                                '<label>Frecuencia Preferida</label>' +
                                '<select id="preferredFrequency">' +
                                    '<option value="">Cualquiera</option>' +
                                    '<option value="weekly">Semanal</option>' +
                                    '<option value="biweekly">Quincenal</option>' +
                                    '<option value="monthly">Mensual</option>' +
                                '</select>' +
                            '</div>' +
                            '<div class="form-group checkbox-group">' +
                                '<label class="checkbox-option">' +
                                    '<input type="checkbox" id="virtualMeetings">' +
                                    '<span class="checkbox-custom"></span>' +
                                    '<span>Reuniones virtuales</span>' +
                                '</label>' +
                            '</div>' +
                        '</div>' +
                        '<button type="submit" class="btn btn-primary">' +
                            '<i class="fas fa-magic"></i> Buscar Matches' +
                        '</button>' +
                    '</form>' +
                '</div>' +

                '<div class="matching-results" id="matchingResults">' +
                    '<div class="no-matches">' +
                        '<i class="fas fa-search"></i>' +
                        '<h4>Busca Grupos Compatibles</h4>' +
                        '<p>Configura tus preferencias arriba y encuentra grupos perfectos para ti</p>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // Setup form handler
        this.setupMatchingForm();
    }

    setupMatchingForm() {
        const form = document.getElementById('matchingPreferencesForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const preferences = {
                location: document.getElementById('preferredLocation').value,
                type: document.getElementById('preferredType').value,
                minContribution: parseInt(document.getElementById('minContribution').value) || 0,
                maxContribution: parseInt(document.getElementById('maxContribution').value) || 50000,
                frequency: document.getElementById('preferredFrequency').value,
                virtualMeetings: document.getElementById('virtualMeetings').checked
            };

            await this.findMatches(preferences);
        });
    }

    async findMatches(preferences) {
        const resultsContainer = document.getElementById('matchingResults');
        if (!resultsContainer) return;

        // Show loading
        resultsContainer.innerHTML = '<div class="loading-matches">' +
                '<i class="fas fa-spinner fa-spin"></i>' +
                '<p>Buscando grupos compatibles...</p>' +
            '</div>';

        try {
            // Find matches using the system
            var matches = await this.system.findMatches(preferences);
        } catch (err) {
            resultsContainer.innerHTML = '<div class="no-matches">' +
                '<i class="fas fa-exclamation-triangle"></i>' +
                '<h4>Error al procesar la solicitud</h4>' +
                '<p>Intenta de nuevo mas tarde</p>' +
            '</div>';
            return;
        }

        // Render results
        if (!matches || matches.length === 0) {
            resultsContainer.innerHTML = '<div class="no-matches">' +
                    '<i class="fas fa-search-minus"></i>' +
                    '<h4>No se encontraron matches</h4>' +
                    '<p>Intenta ajustar tus preferencias para encontrar mas grupos</p>' +
                '</div>';
            return;
        }

        resultsContainer.innerHTML = '<div class="matches-header">' +
                '<h3><i class="fas fa-bullseye"></i> ' + _gasiEscapeHtml(String(matches.length)) + ' Grupos Encontrados</h3>' +
                '<p>Ordenados por compatibilidad</p>' +
            '</div>' +
            '<div class="matches-grid">' +
                matches.map(match => this.renderMatchCard(match)).join('') +
            '</div>';
    }

    renderMatchCard(match) {
        const group = match.group;
        const score = Number(match.score) || 0;
        const compatibility = Number(match.compatibility) || 0;
        var escapedGroupId = _gasiEscapeHtml(group.id);
        var membersCount = Array.isArray(group.members) ? group.members.length : (group.members || 0);
        var maxMembers = group.maxParticipants || group.maxMembers || 0;
        var contribution = group.baseContribution || group.contribution || group.contribution_amount || 0;

        return '<div class="match-card" data-group-id="' + escapedGroupId + '">' +
                '<div class="match-score">' +
                    '<div class="score-circle" style="--score: ' + score + '%">' +
                        '<span class="score-value">' + _gasiEscapeHtml(String(score)) + '%</span>' +
                        '<span class="score-label">Match</span>' +
                    '</div>' +
                    '<div class="compatibility-bar">' +
                        '<div class="compatibility-fill" style="width: ' + compatibility + '%"></div>' +
                        '<span class="compatibility-text">' + _gasiEscapeHtml(String(compatibility)) + '% Compatibilidad</span>' +
                    '</div>' +
                '</div>' +

                '<div class="match-info">' +
                    '<h4 class="match-name">' + _gasiEscapeHtml(group.name) + '</h4>' +
                    '<p class="match-description">' + _gasiEscapeHtml(group.description) + '</p>' +
                    '<div class="match-location">' +
                        '<i class="fas fa-map-marker-alt"></i>' +
                        '<span>' + _gasiEscapeHtml(group.location) + '</span>' +
                    '</div>' +
                '</div>' +

                '<div class="match-details">' +
                    '<div class="detail-row">' +
                        '<span class="detail-label">Contribucion:</span>' +
                        '<span class="detail-value">L. ' + _gasiEscapeHtml(String(Number(contribution).toLocaleString())) + '</span>' +
                    '</div>' +
                    '<div class="detail-row">' +
                        '<span class="detail-label">Frecuencia:</span>' +
                        '<span class="detail-value">' + _gasiEscapeHtml(this.getFrequencyLabel(group.paymentFrequency || group.frequency)) + '</span>' +
                    '</div>' +
                    '<div class="detail-row">' +
                        '<span class="detail-label">Miembros:</span>' +
                        '<span class="detail-value">' + _gasiEscapeHtml(String(membersCount)) + '/' + _gasiEscapeHtml(String(maxMembers)) + '</span>' +
                    '</div>' +
                '</div>' +

                '<div class="match-reasons">' +
                    '<h5>Por que es compatible?</h5>' +
                    '<ul>' +
                        (match.reasons || []).map(reason => '<li>' + _gasiEscapeHtml(reason) + '</li>').join('') +
                    '</ul>' +
                '</div>' +

                '<div class="match-actions">' +
                    '<button class="btn btn-outline btn-sm" data-action="gasi-view-group" data-group-id="' + escapedGroupId + '">' +
                        '<i class="fas fa-eye"></i> Ver Detalles' +
                    '</button>' +
                    '<button class="btn btn-primary btn-sm" data-action="gasi-join-group" data-group-id="' + escapedGroupId + '">' +
                        '<i class="fas fa-user-plus"></i> Unirse' +
                    '</button>' +
                '</div>' +
            '</div>';
    }

    // ================================
    // ANALYTICS RENDERING
    // ================================

    renderAnalytics() {
        const container = document.getElementById('analyticsContainer');
        if (!container || !this.system) return;

        var analytics;
        try {
            analytics = this.system.calculateRealAnalytics();
        } catch (err) {
            container.innerHTML = '<div class="no-data">Error al cargar analiticas</div>';
            return;
        }

        container.innerHTML = '<div class="analytics-overview">' +
                '<div class="analytics-cards">' +
                    this.renderAnalyticsCards(analytics) +
                '</div>' +

                '<div class="analytics-charts">' +
                    '<div class="chart-container">' +
                        '<h4><i class="fas fa-chart-line"></i> Volumen Mensual</h4>' +
                        this.renderVolumeChart(analytics.monthlyVolumeHistory) +
                    '</div>' +

                    '<div class="chart-container">' +
                        '<h4><i class="fas fa-chart-pie"></i> Distribucion de Contribuciones</h4>' +
                        this.renderContributionChart(analytics.contributionDistribution) +
                    '</div>' +
                '</div>' +

                '<div class="analytics-tables">' +
                    '<div class="table-container">' +
                        '<h4><i class="fas fa-map-marked-alt"></i> Distribucion Geografica</h4>' +
                        this.renderGeographicTable(analytics.geographicDistribution) +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    renderAnalyticsCards(analytics) {
        var totalGroups = Number(analytics.totalGroups) || 0;
        var activeTandas = Number(analytics.activeTandas) || 0;
        var totalLiquidity = Number(analytics.totalLiquidity) || 0;
        var successRate = Number(analytics.successRate) || 0;

        return '<div class="analytics-card">' +
                '<div class="card-icon">' +
                    '<i class="fas fa-users"></i>' +
                '</div>' +
                '<div class="card-content">' +
                    '<span class="card-value">' + _gasiEscapeHtml(String(totalGroups)) + '</span>' +
                    '<span class="card-label">Grupos Totales</span>' +
                '</div>' +
            '</div>' +

            '<div class="analytics-card">' +
                '<div class="card-icon">' +
                    '<i class="fas fa-coins"></i>' +
                '</div>' +
                '<div class="card-content">' +
                    '<span class="card-value">' + _gasiEscapeHtml(String(activeTandas)) + '</span>' +
                    '<span class="card-label">Tandas Activas</span>' +
                '</div>' +
            '</div>' +

            '<div class="analytics-card">' +
                '<div class="card-icon">' +
                    '<i class="fas fa-money-bill-wave"></i>' +
                '</div>' +
                '<div class="card-content">' +
                    '<span class="card-value">L. ' + _gasiEscapeHtml(String(totalLiquidity.toLocaleString())) + '</span>' +
                    '<span class="card-label">Liquidez Total</span>' +
                '</div>' +
            '</div>' +

            '<div class="analytics-card">' +
                '<div class="card-icon">' +
                    '<i class="fas fa-percentage"></i>' +
                '</div>' +
                '<div class="card-content">' +
                    '<span class="card-value">' + _gasiEscapeHtml(String(successRate)) + '%</span>' +
                    '<span class="card-label">Tasa de Exito</span>' +
                '</div>' +
            '</div>';
    }

    renderVolumeChart(volumeHistory) {
        if (!volumeHistory || volumeHistory.length === 0) {
            return '<div class="no-data">No hay datos disponibles</div>';
        }

        const maxVolume = Math.max(...volumeHistory.map(v => v.volume));

        return '<div class="volume-chart">' +
            volumeHistory.map(month => {
                var vol = Number(month.volume) || 0;
                var heightPct = maxVolume > 0 ? (vol / maxVolume) * 100 : 0;
                return '<div class="chart-bar">' +
                    '<div class="bar-fill" style="height: ' + heightPct + '%"></div>' +
                    '<div class="bar-label">' + _gasiEscapeHtml(month.month) + '</div>' +
                    '<div class="bar-value">L. ' + _gasiEscapeHtml(String(vol.toLocaleString())) + '</div>' +
                '</div>';
            }).join('') +
            '</div>';
    }

    renderContributionChart(distribution) {
        if (!distribution) return '<div class="no-data">No hay datos disponibles</div>';
        var total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

        return '<div class="contribution-chart">' +
            Object.entries(distribution).map(([range, count]) => {
                var pct = total > 0 ? (count / total) * 100 : 0;
                return '<div class="contribution-item">' +
                    '<span class="range-label">L. ' + _gasiEscapeHtml(range) + '</span>' +
                    '<div class="range-bar">' +
                        '<div class="range-fill" style="width: ' + pct + '%"></div>' +
                    '</div>' +
                    '<span class="range-count">' + _gasiEscapeHtml(String(count)) + ' grupos</span>' +
                '</div>';
            }).join('') +
            '</div>';
    }

    renderGeographicTable(distribution) {
        if (!distribution) return '<div class="no-data">No hay datos disponibles</div>';
        var total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

        return '<div class="geographic-table">' +
            '<table>' +
                '<thead>' +
                    '<tr>' +
                        '<th>Ubicacion</th>' +
                        '<th>Grupos</th>' +
                        '<th>Porcentaje</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    Object.entries(distribution).map(([location, count]) => {
                        var percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        return '<tr>' +
                            '<td>' + _gasiEscapeHtml(location) + '</td>' +
                            '<td>' + _gasiEscapeHtml(String(count)) + '</td>' +
                            '<td>' + _gasiEscapeHtml(String(percentage)) + '%</td>' +
                        '</tr>';
                    }).join('') +
                '</tbody>' +
            '</table>' +
            '</div>';
    }

    // ================================
    // HELPER FUNCTIONS
    // ================================

    renderEmptyState(type) {
        var states = {
            groups: {
                icon: 'fas fa-users',
                title: 'No tienes grupos',
                message: 'Unete a un grupo existente o crea uno nuevo',
                action: 'Crear Grupo',
                actionName: 'gasi-empty-create'
            },
            tandas: {
                icon: 'fas fa-coins',
                title: 'No tienes tandas activas',
                message: 'Unete a un grupo para participar en tandas',
                action: 'Ver Grupos',
                actionName: 'gasi-empty-groups'
            }
        };

        var state = states[type];
        if (!state) return '';

        return '<div class="empty-state">' +
                '<div class="empty-icon">' +
                    '<i class="' + _gasiEscapeHtml(state.icon) + '"></i>' +
                '</div>' +
                '<h3>' + _gasiEscapeHtml(state.title) + '</h3>' +
                '<p>' + _gasiEscapeHtml(state.message) + '</p>' +
                '<button class="btn btn-primary" data-action="' + _gasiEscapeHtml(state.actionName) + '">' +
                    _gasiEscapeHtml(state.action) +
                '</button>' +
            '</div>';
    }

    getGroupIcon(type) {
        const icons = {
            'familiar': 'home',
            'laboral': 'building',
            'comunitario': 'globe',
            'comercial': 'store'
        };
        return icons[type] || 'users';
    }

    getTandaIcon(status) {
        const icons = {
            'active': 'play-circle',
            'completed': 'check-circle',
            'recruiting': 'user-plus',
            'paused': 'pause-circle'
        };
        return icons[status] || 'circle';
    }

    getStatusLabel(status) {
        const labels = {
            'active': 'Activo',
            'completed': 'Completado',
            'recruiting': 'Reclutando',
            'paused': 'Pausado',
            'closed': 'Cerrado'
        };
        return labels[status] || 'Desconocido';
    }

    getFrequencyLabel(frequency) {
        const labels = {
            'weekly': 'Semanal',
            'biweekly': 'Quincenal',
            'monthly': 'Mensual',
            'bimonthly': 'Bimestral'
        };
        return labels[frequency] || 'No especificada';
    }

    updateFilterCounts(groups) {
        const counts = {
            all: groups.length,
            active: groups.filter(g => g.status === 'active').length,
            paused: groups.filter(g => g.status === 'paused').length,
            completed: groups.filter(g => g.status === 'completed').length
        };

        Object.entries(counts).forEach(([filter, count]) => {
            const badge = document.querySelector('[data-filter="' + filter + '"] .count-badge');
            if (badge) {
                badge.textContent = count;
            }
        });
    }

    handleDataUpdate(data) {
        this.renderSection(this.currentTab);
    }

    // ================================
    // ACTION HANDLERS
    // ================================

    async viewGroup(groupId) {
        // Implementation for viewing group details
    }

    async joinGroup(groupId) {
        try {
            var success = await this.system.joinGroup(groupId);
            if (success) {
                this.renderSection(this.currentTab);
            }
        } catch (err) {
            // Error al unirse al grupo - silent fail, UI stays consistent
        }
    }

    async startGroup(groupId) {
        try {
            var group = this.system.groups.find(g => g.id === groupId);
            if (!group) return;

            var activeTanda = this.system.tandas.find(t => t.groupId === groupId && t.status === 'recruiting');
            if (activeTanda) {
                await this.system.startTanda(activeTanda.id);
                this.renderSection(this.currentTab);
            }
        } catch (err) {
            // Error al iniciar grupo - silent fail
        }
    }

    async makePayment(tandaId, round) {
        try {
            var success = await this.system.makePayment(tandaId, round);
            if (success) {
                this.renderSection(this.currentTab);
            }
        } catch (err) {
            // Error al realizar pago - silent fail
        }
    }

    async collectTandaPayout(tandaId) {
        // Implementation for collecting tanda payout
    }

    async viewTandaDetails(tandaId) {
        // Implementation for viewing tanda details
    }

    setupCreateGroupForm(form) {
        // Implementation for create group form
    }

    setupFilterControls() {
        // Implementation for filter controls
    }
}

// Global instance
window.groupsIntegration = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.groupsIntegration = new GroupsSystemIntegration();
});

// Global helper function
window.switchTab = function(tabName) {
    if (window.groupsIntegration) {
        window.groupsIntegration.switchTab(tabName);
    }
};

// Delegated click handler for all gasi-* data-action buttons
document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');
    if (!action || action.indexOf('gasi-') !== 0) return;

    var gi = window.groupsIntegration;
    if (!gi) return;

    var groupId = target.getAttribute('data-group-id');
    var tandaId = target.getAttribute('data-tanda-id');
    var round = target.getAttribute('data-round');

    switch (action) {
        case 'gasi-view-group':
            if (groupId) gi.viewGroup(groupId);
            break;
        case 'gasi-manage-group':
            if (groupId && typeof window.manageGroup === 'function') {
                window.manageGroup(groupId);
            }
            break;
        case 'gasi-join-group':
            if (groupId) gi.joinGroup(groupId);
            break;
        case 'gasi-start-group':
            if (groupId) gi.startGroup(groupId);
            break;
        case 'gasi-make-payment':
            if (tandaId && round) gi.makePayment(tandaId, parseInt(round));
            break;
        case 'gasi-collect-payout':
            if (tandaId) gi.collectTandaPayout(tandaId);
            break;
        case 'gasi-view-tanda':
            if (tandaId) gi.viewTandaDetails(tandaId);
            break;
        case 'gasi-reload-page':
            location.reload();
            break;
        case 'gasi-empty-create':
            gi.switchTab('create');
            break;
        case 'gasi-empty-groups':
            gi.switchTab('groups');
            break;
    }
});
