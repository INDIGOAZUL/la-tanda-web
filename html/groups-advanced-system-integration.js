/**
 * 🔗 GROUPS SYSTEM INTEGRATION
 * Conecta el sistema completo con la interfaz HTML existente
 * Integra todos los datos reales con elementos visuales
 */

class GroupsSystemIntegration {
    constructor() {
        this.system = null;
        this.currentTab = 'dashboard';
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        console.log('🔗 Initializing Groups System Integration...');
        
        // Esperar a que el sistema completo esté disponible
        await this.waitForSystem();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Renderizar interfaz
        this.renderAllSections();
        
        this.isInitialized = true;
        console.log('✅ Groups System Integration ready!');
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
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
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
        console.log('📊 Dashboard render called - preserving existing Web3 dashboard');
        
        // Don't replace the existing Web3 dashboard, just ensure data is updated
        if (!this.system) return;
        
        const userStats = this.system.getUserStats();
        const systemStats = this.system.getSystemStats();
        
        console.log('📊 Dashboard stats available:', userStats, systemStats);
        
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
                    (elementId === 'liquidityPool' ? `L. ${(value/1000000).toFixed(1)}M+` : 
                     elementId === 'smartContractSuccess' ? `${value}%` : 
                     value.toLocaleString()) : value;
            }
        });
        
        console.log('📊 Dashboard stats updated with real data');
    }
    
    renderRecentActivity() {
        if (!this.system.recentActivity || this.system.recentActivity.length === 0) {
            return `
                <div class="no-activity">
                    <i class="fas fa-history"></i>
                    <p>No hay actividad reciente</p>
                </div>
            `;
        }
        
        return `
            <div class="activity-list">
                ${this.system.recentActivity.slice(0, 5).map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                        </div>
                        <div class="activity-content">
                            <span class="activity-text">${activity.description}</span>
                            <span class="activity-time">${this.formatTimeAgo(activity.timestamp)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
        if (diffInHours < 24) return `Hace ${diffInHours}h`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `Hace ${diffInDays}d`;
        
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
        
        console.log('📋 Rendering user groups:', userGroups.length);
        
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
        const progress = Math.round((membersCount / (group.maxParticipants || group.maxMembers || 1)) * 100);
        
        return `
            <div class="group-card ${group.status}" data-group-id="${group.id}">
                <div class="group-header">
                    <div class="group-avatar">
                        <i class="fas fa-${this.getGroupIcon(group.type)}"></i>
                    </div>
                    <div class="group-status status-${group.status}">
                        <i class="fas fa-circle"></i>
                        <span>${this.getStatusLabel(group.status)}</span>
                    </div>
                    ${isAdmin ? '<div class="admin-badge">Admin</div>' : ''}
                </div>
                
                <div class="group-info">
                    <h3 class="group-name">${group.name}</h3>
                    <p class="group-description">${group.description}</p>
                    <div class="group-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${group.location}</span>
                    </div>
                </div>
                
                <div class="group-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${membersCount}/${group.maxParticipants || group.maxMembers} miembros</span>
                </div>
                
                <div class="group-stats">
                    <div class="stat-item">
                        <span class="stat-label">Cuota</span>
                        <span class="stat-value">L. ${(group.baseContribution || group.contribution || group.contribution_amount || 0).toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Frecuencia</span>
                        <span class="stat-value">${this.getFrequencyLabel(group.paymentFrequency || group.frequency)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Completados</span>
                        <span class="stat-value">${group.stats?.completedCycles || 0}</span>
                    </div>
                </div>
                
                <div class="group-actions">
                    <button class="btn btn-sm btn-outline" onclick="groupsIntegration.viewGroup('${group.id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    ${this.renderGroupActionButton(group, member)}
                </div>
            </div>
        `;
    }
    
    renderGroupActionButton(group, member) {
        if (group.status === 'active') {
            // Check if user has pending payments
            const activeTanda = this.system.tandas.find(t => 
                t.groupId === group.id && t.status === 'active'
            );
            
            if (activeTanda) {
                const currentSchedule = activeTanda.paymentSchedule?.find(s => s.round === activeTanda.currentRound);
                const userPayment = currentSchedule?.payments?.find(p => p.payerId === this.system.currentUser.id);
                
                if (userPayment && !userPayment.paid) {
                    return `
                        <button class="btn btn-sm btn-primary" onclick="groupsIntegration.makePayment('${activeTanda.id}', ${activeTanda.currentRound})">
                            <i class="fas fa-credit-card"></i> Pagar L.${userPayment.amount}
                        </button>
                    `;
                }
            }
            
            return `
                <button class="btn btn-sm btn-success" disabled>
                    <i class="fas fa-check"></i> Al día
                </button>
            `;
        } else if (group.status === 'recruiting') {
            return `
                <button class="btn btn-sm btn-primary" onclick="groupsIntegration.startGroup('${group.id}')">
                    <i class="fas fa-play"></i> Iniciar
                </button>
            `;
        }
        
        return `
            <button class="btn btn-sm btn-secondary" disabled>
                <i class="fas fa-pause"></i> ${this.getStatusLabel(group.status)}
            </button>
        `;
    }
    
    // ================================
    // TANDAS RENDERING
    // ================================
    
    renderTandas() {
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
        
        console.log('💰 Rendering user tandas:', userTandas.length);
        
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
        
        return `
            <div class="tanda-card ${tanda.status}" data-tanda-id="${tanda.id}">
                <div class="tanda-header">
                    <div class="tanda-status status-${tanda.status}">
                        <i class="fas fa-${this.getTandaIcon(tanda.status)}"></i>
                        <span>${this.getStatusLabel(tanda.status)}</span>
                    </div>
                    ${isMyTurn ? '<div class="my-turn-badge">Mi Turno!</div>' : ''}
                </div>
                
                <div class="tanda-info">
                    <h3 class="tanda-name">${tanda.name}</h3>
                    <p class="tanda-group">Grupo: ${tanda.groupName}</p>
                </div>
                
                <div class="tanda-progress">
                    <div class="round-progress">
                        <span class="round-current">Ronda ${tanda.currentRound}</span>
                        <span class="round-total">de ${tanda.totalRounds}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(tanda.currentRound / tanda.totalRounds) * 100}%"></div>
                    </div>
                </div>
                
                <div class="tanda-details">
                    <div class="detail-item">
                        <span class="detail-label">Mi Posición:</span>
                        <span class="detail-value">#${userParticipant?.paymentOrder || 'TBD'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Contribución:</span>
                        <span class="detail-value">L. ${tanda.contributionAmount.toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Próximo Pago:</span>
                        <span class="detail-value">${nextPaymentDate}</span>
                    </div>
                </div>
                
                ${this.renderTandaPaymentSection(tanda, userPayment, isMyTurn)}
                
                <div class="tanda-actions">
                    <button class="btn btn-sm btn-outline" onclick="groupsIntegration.viewTandaDetails('${tanda.id}')">
                        <i class="fas fa-info-circle"></i> Detalles
                    </button>
                    ${this.renderTandaActionButton(tanda, userPayment, isMyTurn)}
                </div>
            </div>
        `;
    }
    
    renderTandaPaymentSection(tanda, userPayment, isMyTurn) {
        if (tanda.status !== 'active') return '';
        
        if (isMyTurn) {
            const expectedAmount = tanda.contributionAmount * (tanda.participants.length - 1);
            return `
                <div class="payment-section my-turn">
                    <div class="payment-alert">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>¡Es tu turno de cobrar!</span>
                    </div>
                    <div class="expected-amount">
                        Recibirás: L. ${expectedAmount.toLocaleString()}
                    </div>
                </div>
            `;
        }
        
        if (userPayment) {
            return `
                <div class="payment-section ${userPayment.paid ? 'paid' : 'pending'}">
                    <div class="payment-status">
                        <i class="fas fa-${userPayment.paid ? 'check-circle' : 'clock'}"></i>
                        <span>${userPayment.paid ? 'Pagado' : 'Pendiente'}</span>
                    </div>
                    <div class="payment-amount">
                        L. ${userPayment.amount.toLocaleString()}
                    </div>
                    ${userPayment.paid ? 
                        `<div class="payment-date">Pagado: ${new Date(userPayment.paidDate).toLocaleDateString()}</div>` : 
                        ''
                    }
                </div>
            `;
        }
        
        return '';
    }
    
    renderTandaActionButton(tanda, userPayment, isMyTurn) {
        if (tanda.status !== 'active') return '';
        
        if (isMyTurn) {
            return `
                <button class="btn btn-sm btn-success" onclick="groupsIntegration.collectTandaPayout('${tanda.id}')">
                    <i class="fas fa-hand-holding-usd"></i> Cobrar
                </button>
            `;
        }
        
        if (userPayment && !userPayment.paid) {
            return `
                <button class="btn btn-sm btn-primary" onclick="groupsIntegration.makePayment('${tanda.id}', ${tanda.currentRound})">
                    <i class="fas fa-credit-card"></i> Pagar Ahora
                </button>
            `;
        }
        
        return `
            <button class="btn btn-sm btn-outline" disabled>
                <i class="fas fa-check"></i> Completado
            </button>
        `;
    }
    
    // ================================
    // MATCHING RENDERING
    // ================================
    
    renderMatching() {
        const container = document.getElementById('matchingContainer');
        if (!container || !this.system) return;
        
        container.innerHTML = `
            <div class="matching-interface">
                <div class="matching-preferences">
                    <h3><i class="fas fa-sliders-h"></i> Configurar Preferencias</h3>
                    <form id="matchingPreferencesForm" class="preferences-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ubicación Preferida</label>
                                <input type="text" id="preferredLocation" placeholder="Ej: Tegucigalpa">
                            </div>
                            <div class="form-group">
                                <label>Tipo de Grupo</label>
                                <select id="preferredType">
                                    <option value="">Cualquiera</option>
                                    <option value="familiar">Familiar</option>
                                    <option value="laboral">Laboral</option>
                                    <option value="comunitario">Comunitario</option>
                                    <option value="comercial">Comercial</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Contribución Mínima (L.)</label>
                                <input type="number" id="minContribution" placeholder="500" min="100">
                            </div>
                            <div class="form-group">
                                <label>Contribución Máxima (L.)</label>
                                <input type="number" id="maxContribution" placeholder="5000" max="50000">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Frecuencia Preferida</label>
                                <select id="preferredFrequency">
                                    <option value="">Cualquiera</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="biweekly">Quincenal</option>
                                    <option value="monthly">Mensual</option>
                                </select>
                            </div>
                            <div class="form-group checkbox-group">
                                <label class="checkbox-option">
                                    <input type="checkbox" id="virtualMeetings">
                                    <span class="checkbox-custom"></span>
                                    <span>Reuniones virtuales</span>
                                </label>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-magic"></i> Buscar Matches
                        </button>
                    </form>
                </div>
                
                <div class="matching-results" id="matchingResults">
                    <div class="no-matches">
                        <i class="fas fa-search"></i>
                        <h4>Busca Grupos Compatibles</h4>
                        <p>Configura tus preferencias arriba y encuentra grupos perfectos para ti</p>
                    </div>
                </div>
            </div>
        `;
        
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
        resultsContainer.innerHTML = `
            <div class="loading-matches">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Buscando grupos compatibles...</p>
            </div>
        `;
        
        // Find matches using the system
        const matches = await this.system.findMatches(preferences);
        
        // Render results
        if (matches.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-matches">
                    <i class="fas fa-search-minus"></i>
                    <h4>No se encontraron matches</h4>
                    <p>Intenta ajustar tus preferencias para encontrar más grupos</p>
                </div>
            `;
            return;
        }
        
        resultsContainer.innerHTML = `
            <div class="matches-header">
                <h3><i class="fas fa-bullseye"></i> ${matches.length} Grupos Encontrados</h3>
                <p>Ordenados por compatibilidad</p>
            </div>
            <div class="matches-grid">
                ${matches.map(match => this.renderMatchCard(match)).join('')}
            </div>
        `;
    }
    
    renderMatchCard(match) {
        const group = match.group;
        const score = match.score;
        const compatibility = match.compatibility;
        
        return `
            <div class="match-card" data-group-id="${group.id}">
                <div class="match-score">
                    <div class="score-circle" style="--score: ${score}%">
                        <span class="score-value">${score}%</span>
                        <span class="score-label">Match</span>
                    </div>
                    <div class="compatibility-bar">
                        <div class="compatibility-fill" style="width: ${compatibility}%"></div>
                        <span class="compatibility-text">${compatibility}% Compatibilidad</span>
                    </div>
                </div>
                
                <div class="match-info">
                    <h4 class="match-name">${group.name}</h4>
                    <p class="match-description">${group.description}</p>
                    <div class="match-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${group.location}</span>
                    </div>
                </div>
                
                <div class="match-details">
                    <div class="detail-row">
                        <span class="detail-label">Contribución:</span>
                        <span class="detail-value">L. ${(group.baseContribution || group.contribution || group.contribution_amount || 0).toLocaleString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Frecuencia:</span>
                        <span class="detail-value">${this.getFrequencyLabel(group.paymentFrequency || group.frequency)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Miembros:</span>
                        <span class="detail-value">${Array.isArray(group.members) ? group.members.length : (group.members || 0)}/${group.maxParticipants || group.maxMembers}</span>
                    </div>
                </div>
                
                <div class="match-reasons">
                    <h5>¿Por qué es compatible?</h5>
                    <ul>
                        ${match.reasons.map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="match-actions">
                    <button class="btn btn-outline btn-sm" onclick="groupsIntegration.viewGroup('${group.id}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="groupsIntegration.joinGroup('${group.id}')">
                        <i class="fas fa-user-plus"></i> Unirse
                    </button>
                </div>
            </div>
        `;
    }
    
    // ================================
    // ANALYTICS RENDERING
    // ================================
    
    renderAnalytics() {
        const container = document.getElementById('analyticsContainer');
        if (!container || !this.system) return;
        
        const analytics = this.system.calculateRealAnalytics();
        
        container.innerHTML = `
            <div class="analytics-overview">
                <div class="analytics-cards">
                    ${this.renderAnalyticsCards(analytics)}
                </div>
                
                <div class="analytics-charts">
                    <div class="chart-container">
                        <h4><i class="fas fa-chart-line"></i> Volumen Mensual</h4>
                        ${this.renderVolumeChart(analytics.monthlyVolumeHistory)}
                    </div>
                    
                    <div class="chart-container">
                        <h4><i class="fas fa-chart-pie"></i> Distribución de Contribuciones</h4>
                        ${this.renderContributionChart(analytics.contributionDistribution)}
                    </div>
                </div>
                
                <div class="analytics-tables">
                    <div class="table-container">
                        <h4><i class="fas fa-map-marked-alt"></i> Distribución Geográfica</h4>
                        ${this.renderGeographicTable(analytics.geographicDistribution)}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAnalyticsCards(analytics) {
        return `
            <div class="analytics-card">
                <div class="card-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="card-content">
                    <span class="card-value">${analytics.totalGroups}</span>
                    <span class="card-label">Grupos Totales</span>
                </div>
            </div>
            
            <div class="analytics-card">
                <div class="card-icon">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="card-content">
                    <span class="card-value">${analytics.activeTandas}</span>
                    <span class="card-label">Tandas Activas</span>
                </div>
            </div>
            
            <div class="analytics-card">
                <div class="card-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="card-content">
                    <span class="card-value">L. ${analytics.totalLiquidity.toLocaleString()}</span>
                    <span class="card-label">Liquidez Total</span>
                </div>
            </div>
            
            <div class="analytics-card">
                <div class="card-icon">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="card-content">
                    <span class="card-value">${analytics.successRate}%</span>
                    <span class="card-label">Tasa de Éxito</span>
                </div>
            </div>
        `;
    }
    
    renderVolumeChart(volumeHistory) {
        if (!volumeHistory || volumeHistory.length === 0) {
            return '<div class="no-data">No hay datos disponibles</div>';
        }
        
        const maxVolume = Math.max(...volumeHistory.map(v => v.volume));
        
        return `
            <div class="volume-chart">
                ${volumeHistory.map(month => `
                    <div class="chart-bar">
                        <div class="bar-fill" style="height: ${(month.volume / maxVolume) * 100}%"></div>
                        <div class="bar-label">${month.month}</div>
                        <div class="bar-value">L. ${month.volume.toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderContributionChart(distribution) {
        const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
        
        return `
            <div class="contribution-chart">
                ${Object.entries(distribution).map(([range, count]) => `
                    <div class="contribution-item">
                        <span class="range-label">L. ${range}</span>
                        <div class="range-bar">
                            <div class="range-fill" style="width: ${total > 0 ? (count / total) * 100 : 0}%"></div>
                        </div>
                        <span class="range-count">${count} grupos</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderGeographicTable(distribution) {
        return `
            <div class="geographic-table">
                <table>
                    <thead>
                        <tr>
                            <th>Ubicación</th>
                            <th>Grupos</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(distribution).map(([location, count]) => {
                            const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
                            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                            
                            return `
                                <tr>
                                    <td>${location}</td>
                                    <td>${count}</td>
                                    <td>${percentage}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // ================================
    // HELPER FUNCTIONS
    // ================================
    
    renderEmptyState(type) {
        const states = {
            groups: {
                icon: 'fas fa-users',
                title: 'No tienes grupos',
                message: 'Únete a un grupo existente o crea uno nuevo',
                action: 'Crear Grupo',
                actionClick: "groupsIntegration.switchTab('create')"
            },
            tandas: {
                icon: 'fas fa-coins',
                title: 'No tienes tandas activas',
                message: 'Únete a un grupo para participar en tandas',
                action: 'Ver Grupos',
                actionClick: "groupsIntegration.switchTab('groups')"
            }
        };
        
        const state = states[type];
        
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="${state.icon}"></i>
                </div>
                <h3>${state.title}</h3>
                <p>${state.message}</p>
                <button class="btn btn-primary" onclick="${state.actionClick}">
                    ${state.action}
                </button>
            </div>
        `;
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
        return labels[status] || status;
    }
    
    getFrequencyLabel(frequency) {
        const labels = {
            'weekly': 'Semanal',
            'biweekly': 'Quincenal',
            'monthly': 'Mensual',
            'bimonthly': 'Bimestral'
        };
        return labels[frequency] || frequency;
    }
    
    updateFilterCounts(groups) {
        const counts = {
            all: groups.length,
            active: groups.filter(g => g.status === 'active').length,
            paused: groups.filter(g => g.status === 'paused').length,
            completed: groups.filter(g => g.status === 'completed').length
        };
        
        Object.entries(counts).forEach(([filter, count]) => {
            const badge = document.querySelector(`[data-filter="${filter}"] .count-badge`);
            if (badge) {
                badge.textContent = count;
            }
        });
    }
    
    handleDataUpdate(data) {
        console.log('📊 Data updated, re-rendering current section');
        this.renderSection(this.currentTab);
    }
    
    // ================================
    // ACTION HANDLERS
    // ================================
    
    async viewGroup(groupId) {
        // Implementation for viewing group details
        console.log('👁️ Viewing group:', groupId);
    }
    
    async joinGroup(groupId) {
        const success = await this.system.joinGroup(groupId);
        if (success) {
            this.renderSection(this.currentTab);
        }
    }
    
    async startGroup(groupId) {
        const group = this.system.groups.find(g => g.id === groupId);
        if (!group) return;
        
        const activeTanda = this.system.tandas.find(t => t.groupId === groupId && t.status === 'recruiting');
        if (activeTanda) {
            await this.system.startTanda(activeTanda.id);
            this.renderSection(this.currentTab);
        }
    }
    
    async makePayment(tandaId, round) {
        const success = await this.system.makePayment(tandaId, round);
        if (success) {
            this.renderSection(this.currentTab);
        }
    }
    
    async collectTandaPayout(tandaId) {
        // Implementation for collecting tanda payout
        console.log('💰 Collecting payout for tanda:', tandaId);
    }
    
    async viewTandaDetails(tandaId) {
        // Implementation for viewing tanda details
        console.log('📋 Viewing tanda details:', tandaId);
    }
    
    setupCreateGroupForm(form) {
        // Implementation for create group form
        console.log('📝 Setting up create group form');
    }
    
    setupFilterControls() {
        // Implementation for filter controls
        console.log('🔍 Setting up filter controls');
    }
}

// Global functions for HTML onclick handlers
window.groupsIntegration = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.groupsIntegration = new GroupsSystemIntegration();
});

// Global helper functions
window.switchTab = function(tabName) {
    if (window.groupsIntegration) {
        window.groupsIntegration.switchTab(tabName);
    }
};

console.log('🔗 Groups System Integration loaded!');