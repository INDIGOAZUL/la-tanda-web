/**
 * La Tanda - Gestor de Tandas Tradicionales
 * Funcionalidad completa: búsqueda, filtros, gestión de grupos
 * Integrado con el sistema de advertencias de seguridad
 */

class TandasManager {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = null;
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalPages = 1;
        this.currentTab = 'discover';
        this.currentRequestsTab = 'pending';
        this.activeFilters = {};
        this.searchQuery = '';
        this.savedSearches = [];
        
        // Mock data para demo
        this.mockGroups = this.generateMockGroups();
        this.mockUserGroups = this.generateMockUserGroups();
        this.mockRequests = this.generateMockRequests();
        
        this.init();
    }
    
    async init() {
        this.loadUserData();
        this.setupEventListeners();
        await this.loadGroups();
        this.setupSearchFunctionality();
        this.loadSavedSearches();
    }
    
    loadUserData() {
        const authData = localStorage.getItem('laTandaWeb3Auth');
        if (authData) {
            this.currentUser = JSON.parse(authData).user;
        }
    }
    
    setupEventListeners() {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('tandas-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = e.target.value;
                    this.performSearch();
                }, 300);
            });
        }
        
        // Event listeners para filtros
        document.addEventListener('change', (e) => {
            if (e.target.matches('[id$="-filter"]')) {
                this.applyFilters();
            }
        });
        
        // Tecla Enter en búsqueda
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
    }
    
    setupSearchFunctionality() {
        // Autocompletado de búsqueda
        const searchInput = document.getElementById('tandas-search');
        if (searchInput) {
            searchInput.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });
            
            searchInput.addEventListener('blur', () => {
                setTimeout(() => this.hideSearchSuggestions(), 200);
            });
        }
    }
    
    /**
     * FUNCIONALIDAD DE BÚSQUEDA AVANZADA
     */
    async performSearch() {
        const query = this.searchQuery.toLowerCase().trim();
        
        if (!query) {
            await this.loadGroups();
            return;
        }
        
        let filteredGroups = this.mockGroups.filter(group => {
            // Búsqueda por nombre
            if (group.name.toLowerCase().includes(query)) return true;
            
            // Búsqueda por ID
            if (group.id.toLowerCase().includes(query)) return true;
            
            // Búsqueda por coordinador
            if (group.coordinator_name.toLowerCase().includes(query)) return true;
            if (group.coordinator_id.toLowerCase().includes(query)) return true;
            
            // Búsqueda por ubicación
            if (group.location.toLowerCase().includes(query)) return true;
            
            // Búsqueda por descripción
            if (group.description.toLowerCase().includes(query)) return true;
            
            // Búsqueda por tipo
            if (group.category.toLowerCase().includes(query)) return true;
            
            return false;
        });
        
        // Aplicar filtros adicionales
        filteredGroups = this.applyActiveFilters(filteredGroups);
        
        this.renderGroups(filteredGroups);
        this.updatePagination(filteredGroups.length);
        
        // Resaltar términos de búsqueda
        this.highlightSearchTerms(query);
    }
    
    showSearchSuggestions() {
        const searchInput = document.getElementById('tandas-search');
        const suggestions = this.generateSearchSuggestions();
        
        if (suggestions.length === 0) return;
        
        let suggestionsHTML = `
            <div class="search-suggestions" id="search-suggestions">
                <div class="suggestions-header">Sugerencias de búsqueda</div>
                ${suggestions.map(suggestion => `
                    <div class="suggestion-item" onclick="tandasManager.selectSuggestion('${suggestion.query}')">
                        <div class="suggestion-icon">${suggestion.icon}</div>
                        <div class="suggestion-content">
                            <div class="suggestion-text">${suggestion.text}</div>
                            <div class="suggestion-type">${suggestion.type}</div>
                        </div>
                    </div>
                `).join('')}
                <div class="suggestions-footer">
                    <button onclick="tandasManager.showAdvancedSearch()" class="advanced-search-link">
                        Búsqueda avanzada
                    </button>
                </div>
            </div>
        `;
        
        // Remover sugerencias existentes
        const existingSuggestions = document.getElementById('search-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }
        
        // Agregar nuevas sugerencias
        searchInput.parentNode.insertAdjacentHTML('afterend', suggestionsHTML);
    }
    
    generateSearchSuggestions() {
        const recentSearches = JSON.parse(localStorage.getItem('recent_searches') || '[]');
        const popularGroups = this.mockGroups.slice(0, 3);
        const suggestions = [];
        
        // Búsquedas recientes
        recentSearches.slice(0, 3).forEach(search => {
            suggestions.push({
                query: search,
                text: search,
                type: 'Búsqueda reciente',
                icon: '🕐'
            });
        });
        
        // Grupos populares
        popularGroups.forEach(group => {
            suggestions.push({
                query: group.name,
                text: group.name,
                type: 'Grupo popular',
                icon: '🔥'
            });
        });
        
        // Búsquedas sugeridas
        const suggestedSearches = [
            { query: 'familiar tegucigalpa', text: 'Grupos familiares en Tegucigalpa', type: 'Sugerencia', icon: '💡' },
            { query: 'empresarial 1000', text: 'Grupos empresariales L.1000+', type: 'Sugerencia', icon: '💡' },
            { query: 'semanal', text: 'Tandas semanales', type: 'Sugerencia', icon: '💡' }
        ];
        
        suggestions.push(...suggestedSearches);
        
        return suggestions.slice(0, 8);
    }
    
    selectSuggestion(query) {
        const searchInput = document.getElementById('tandas-search');
        searchInput.value = query;
        this.searchQuery = query;
        this.performSearch();
        this.hideSearchSuggestions();
        
        // Guardar en búsquedas recientes
        this.addToRecentSearches(query);
    }
    
    addToRecentSearches(query) {
        let recentSearches = JSON.parse(localStorage.getItem('recent_searches') || '[]');
        recentSearches = recentSearches.filter(search => search !== query);
        recentSearches.unshift(query);
        recentSearches = recentSearches.slice(0, 10);
        localStorage.setItem('recent_searches', JSON.stringify(recentSearches));
    }
    
    hideSearchSuggestions() {
        const suggestions = document.getElementById('search-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
    }
    
    /**
     * FUNCIONALIDAD DE FILTROS AVANZADOS
     */
    toggleAdvancedSearch() {
        const filtersPanel = document.getElementById('advanced-filters');
        const button = document.querySelector('.advanced-btn');
        const icon = button.querySelector('svg');
        
        if (filtersPanel.style.display === 'none') {
            filtersPanel.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
            button.textContent = 'Ocultar Filtros';
            button.appendChild(icon);
        } else {
            filtersPanel.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
            button.textContent = 'Búsqueda Avanzada';
            button.appendChild(icon);
        }
    }
    
    applyFilters() {
        this.activeFilters = {
            type: document.getElementById('group-type-filter')?.value || '',
            contribution: document.getElementById('contribution-filter')?.value || '',
            location: document.getElementById('location-filter')?.value || '',
            status: document.getElementById('status-filter')?.value || '',
            coordinatorExp: document.getElementById('coordinator-exp-filter')?.value || '',
            frequency: document.getElementById('frequency-filter')?.value || ''
        };
        
        this.performSearch();
    }
    
    applyActiveFilters(groups) {
        return groups.filter(group => {
            // Filtro por tipo
            if (this.activeFilters.type && group.category !== this.activeFilters.type) {
                return false;
            }
            
            // Filtro por contribución
            if (this.activeFilters.contribution) {
                const [min, max] = this.parseContributionRange(this.activeFilters.contribution);
                if (group.contribution_amount < min || (max && group.contribution_amount > max)) {
                    return false;
                }
            }
            
            // Filtro por ubicación
            if (this.activeFilters.location && group.location_key !== this.activeFilters.location) {
                return false;
            }
            
            // Filtro por estado
            if (this.activeFilters.status && group.status !== this.activeFilters.status) {
                return false;
            }
            
            // Filtro por experiencia del coordinador
            if (this.activeFilters.coordinatorExp) {
                const expLevel = this.getCoordinatorExperienceLevel(group.coordinator_days_active);
                if (expLevel !== this.activeFilters.coordinatorExp) {
                    return false;
                }
            }
            
            // Filtro por frecuencia
            if (this.activeFilters.frequency && group.frequency !== this.activeFilters.frequency) {
                return false;
            }
            
            return true;
        });
    }
    
    parseContributionRange(range) {
        const ranges = {
            '0-500': [0, 500],
            '500-1000': [500, 1000],
            '1000-2500': [1000, 2500],
            '2500-5000': [2500, 5000],
            '5000+': [5000, null]
        };
        return ranges[range] || [0, null];
    }
    
    getCoordinatorExperienceLevel(days) {
        if (days < 180) return 'new';
        if (days < 730) return 'experienced';
        if (days < 1825) return 'veteran';
        return 'master';
    }
    
    clearAllFilters() {
        // Limpiar todos los selects
        document.querySelectorAll('[id$="-filter"]').forEach(select => {
            select.value = '';
        });
        
        // Limpiar búsqueda
        document.getElementById('tandas-search').value = '';
        
        this.activeFilters = {};
        this.searchQuery = '';
        this.loadGroups();
    }
    
    clearSearch() {
        document.getElementById('tandas-search').value = '';
        this.searchQuery = '';
        this.performSearch();
    }
    
    /**
     * GESTIÓN DE PESTAÑAS
     */
    switchTab(tabName) {
        // Actualizar botones de pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Actualizar paneles
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-panel`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Cargar contenido específico de la pestaña
        switch(tabName) {
            case 'discover':
                this.loadGroups();
                break;
            case 'my-groups':
                this.loadMyGroups();
                break;
            case 'coordinating':
                this.loadCoordinatingGroups();
                break;
            case 'requests':
                this.loadRequests();
                break;
        }
    }
    
    switchRequestsTab(tabName) {
        document.querySelectorAll('.requests-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.currentRequestsTab = tabName;
        this.loadRequests();
    }
    
    /**
     * CARGA DE DATOS
     */
    async loadGroups() {
        try {
            // En producción, esto sería una llamada real a la API
            const groups = this.applyActiveFilters(this.mockGroups);
            this.renderGroups(groups);
            this.updatePagination(groups.length);
            this.updateQuickStats();
        } catch (error) {
            console.error('Error loading groups:', error);
            this.showNotification('Error al cargar grupos', 'error');
        }
    }
    
    async loadMyGroups() {
        const myGroupsContainer = document.getElementById('my-groups-list');
        const myGroups = this.mockUserGroups;
        
        if (myGroups.length === 0) {
            myGroupsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No tienes grupos activos</h3>
                    <p>Explora y únete a grupos que te interesen</p>
                    <button class="cta-btn" onclick="tandasManager.switchTab('discover')">
                        Descubrir Grupos
                    </button>
                </div>
            `;
            return;
        }
        
        const groupsHTML = myGroups.map(group => this.renderMyGroupCard(group)).join('');
        myGroupsContainer.innerHTML = `<div class="my-groups-grid">${groupsHTML}</div>`;
    }
    
    async loadCoordinatingGroups() {
        const coordinatingContainer = document.getElementById('coordinating-groups');
        const coordinatingGroups = this.mockUserGroups.filter(group => group.role === 'coordinator');
        
        if (coordinatingGroups.length === 0) {
            coordinatingContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👑</div>
                    <h3>No coordinas ningún grupo</h3>
                    <p>Crea tu propio grupo y conviértete en coordinador</p>
                    <button class="cta-btn" onclick="tandasManager.showCreateGroup()">
                        Crear Grupo
                    </button>
                </div>
            `;
            return;
        }
        
        const groupsHTML = coordinatingGroups.map(group => this.renderCoordinatingGroupCard(group)).join('');
        coordinatingContainer.innerHTML = `<div class="coordinating-grid">${groupsHTML}</div>`;
    }
    
    async loadRequests() {
        const requestsContainer = document.getElementById('requests-list');
        const requests = this.mockRequests.filter(req => req.type === this.currentRequestsTab);
        
        if (requests.length === 0) {
            requestsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📨</div>
                    <h3>No hay solicitudes ${this.getRequestsTabLabel()}</h3>
                    <p>Las solicitudes aparecerán aquí cuando las tengas</p>
                </div>
            `;
            return;
        }
        
        const requestsHTML = requests.map(request => this.renderRequestCard(request)).join('');
        requestsContainer.innerHTML = requestsHTML;
    }
    
    /**
     * RENDERIZADO DE COMPONENTES
     */
    renderGroups(groups) {
        const container = document.getElementById('groups-grid');
        
        if (groups.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No se encontraron grupos</h3>
                    <p>Intenta ajustar tus filtros de búsqueda</p>
                    <button class="clear-filters-btn" onclick="tandasManager.clearAllFilters()">
                        Limpiar Filtros
                    </button>
                </div>
            `;
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedGroups = groups.slice(startIndex, endIndex);
        
        const groupsHTML = paginatedGroups.map(group => this.renderGroupCard(group)).join('');
        container.innerHTML = groupsHTML;
    }
    
    renderGroupCard(group) {
        const riskLevel = this.calculateGroupRisk(group);
        const riskBadge = this.getRiskBadge(riskLevel);
        
        return `
            <div class="group-card ${riskLevel}" data-group-id="${group.id}">
                <div class="group-header">
                    <div class="group-image">
                        <img src="${group.image_url}" alt="${group.name}" onerror="this.src='/default-group.png'">
                        <div class="group-type-badge">${this.getTypeIcon(group.category)}</div>
                    </div>
                    <div class="group-status ${group.status}">
                        ${this.getStatusLabel(group.status)}
                    </div>
                </div>
                
                <div class="group-content">
                    <div class="group-title-section">
                        <h4 class="group-name">${group.name}</h4>
                        ${riskBadge}
                    </div>
                    
                    <div class="group-coordinator">
                        <img src="${group.coordinator_avatar}" alt="Coordinador" class="coordinator-avatar">
                        <div class="coordinator-info">
                            <span class="coordinator-name">${group.coordinator_name}</span>
                            <span class="coordinator-exp">${this.getExperienceLabel(group.coordinator_days_active)}</span>
                        </div>
                    </div>
                    
                    <div class="group-details">
                        <div class="detail-row">
                            <span class="detail-label">💰 Contribución:</span>
                            <span class="detail-value">L. ${group.contribution_amount.toLocaleString()} ${this.getFrequencyLabel(group.frequency)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">👥 Miembros:</span>
                            <span class="detail-value">${group.member_count}/${group.max_members}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">📍 Ubicación:</span>
                            <span class="detail-value">${group.location}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">📅 Reuniones:</span>
                            <span class="detail-value">${group.meeting_schedule}</span>
                        </div>
                    </div>
                    
                    <div class="group-description">
                        <p>${group.description}</p>
                    </div>
                    
                    <div class="group-stats">
                        <div class="stat-item">
                            <span class="stat-number">L. ${group.total_amount_collected.toLocaleString()}</span>
                            <span class="stat-label">Total Recaudado</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${group.verified_members_count}</span>
                            <span class="stat-label">Verificados</span>
                        </div>
                    </div>
                </div>
                
                <div class="group-actions">
                    <button class="group-btn primary join-group-btn" 
                            data-group-id="${group.id}"
                            onclick="tandasManager.requestJoinGroup('${group.id}')">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2v20m10-10H2"/>
                        </svg>
                        Unirse al Grupo
                    </button>
                    <button class="group-btn secondary" onclick="tandasManager.viewGroupDetails('${group.id}')">
                        Ver Detalles
                    </button>
                    <button class="group-btn tertiary" onclick="tandasManager.shareGroup('${group.id}')">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderMyGroupCard(group) {
        return `
            <div class="my-group-card">
                <div class="my-group-header">
                    <img src="${group.image_url}" alt="${group.name}" class="my-group-image">
                    <div class="my-group-info">
                        <h4>${group.name}</h4>
                        <span class="my-group-role">${group.role === 'coordinator' ? '👑 Coordinador' : '👤 Miembro'}</span>
                    </div>
                    <div class="my-group-status ${group.status}">
                        ${this.getStatusLabel(group.status)}
                    </div>
                </div>
                
                <div class="my-group-stats">
                    <div class="my-stat">
                        <span class="my-stat-value">L. ${group.my_contribution.toLocaleString()}</span>
                        <span class="my-stat-label">Mi Contribución</span>
                    </div>
                    <div class="my-stat">
                        <span class="my-stat-value">L. ${group.my_earned.toLocaleString()}</span>
                        <span class="my-stat-label">Ganado</span>
                    </div>
                    <div class="my-stat">
                        <span class="my-stat-value">${group.my_position}</span>
                        <span class="my-stat-label">Mi Posición</span>
                    </div>
                </div>
                
                <div class="my-group-actions">
                    <button class="group-btn primary" onclick="tandasManager.openGroupDashboard('${group.id}')">
                        Abrir Dashboard
                    </button>
                    <button class="group-btn secondary" onclick="tandasManager.viewMyGroupDetails('${group.id}')">
                        Ver Detalles
                    </button>
                </div>
            </div>
        `;
    }
    
    renderCoordinatingGroupCard(group) {
        return `
            <div class="coordinating-card">
                <div class="coordinating-header">
                    <img src="${group.image_url}" alt="${group.name}" class="coordinating-image">
                    <div class="coordinating-info">
                        <h4>${group.name}</h4>
                        <span class="coordinating-members">${group.member_count}/${group.max_members} miembros</span>
                    </div>
                    <div class="coordinating-notifications">
                        ${group.pending_requests > 0 ? `<span class="notification-dot">${group.pending_requests}</span>` : ''}
                    </div>
                </div>
                
                <div class="coordinating-stats">
                    <div class="coord-stat">
                        <span class="coord-stat-label">Recaudado Este Mes</span>
                        <span class="coord-stat-value">L. ${group.monthly_collection.toLocaleString()}</span>
                    </div>
                    <div class="coord-stat">
                        <span class="coord-stat-label">Próximo Pago</span>
                        <span class="coord-stat-value">${group.next_payment_date}</span>
                    </div>
                </div>
                
                <div class="coordinating-actions">
                    <button class="group-btn primary" onclick="tandasManager.openCoordinatorPanel('${group.id}')">
                        Panel de Control
                    </button>
                    <button class="group-btn secondary" onclick="tandasManager.manageMembers('${group.id}')">
                        Gestionar Miembros
                    </button>
                </div>
            </div>
        `;
    }
    
    renderRequestCard(request) {
        return `
            <div class="request-card ${request.status}">
                <div class="request-header">
                    <img src="${request.user_avatar}" alt="${request.user_name}" class="request-avatar">
                    <div class="request-info">
                        <h4>${request.user_name}</h4>
                        <span class="request-group">${request.group_name}</span>
                    </div>
                    <div class="request-time">${request.time_ago}</div>
                </div>
                
                <div class="request-content">
                    <p class="request-message">${request.message || 'Solicitud para unirse al grupo'}</p>
                    <div class="request-details">
                        <span class="request-detail">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Experiencia: ${request.user_experience}
                        </span>
                        <span class="request-detail">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            Calificación: ${request.user_rating}/5
                        </span>
                    </div>
                </div>
                
                <div class="request-actions">
                    ${request.type === 'pending' ? `
                        <button class="request-btn accept accept-member-btn" 
                                data-member-id="${request.user_id}"
                                data-group-id="${request.group_id}"
                                onclick="tandasManager.acceptMemberRequest('${request.id}')">
                            Aceptar
                        </button>
                        <button class="request-btn reject" onclick="tandasManager.rejectMemberRequest('${request.id}')">
                            Rechazar
                        </button>
                    ` : request.type === 'sent' ? `
                        <button class="request-btn secondary" onclick="tandasManager.cancelRequest('${request.id}')">
                            Cancelar
                        </button>
                    ` : `
                        <span class="request-status-text">${request.status_text}</span>
                    `}
                </div>
            </div>
        `;
    }
    
    /**
     * ACCIONES DE GRUPOS
     */
    async requestJoinGroup(groupId) {
        try {
            const group = this.mockGroups.find(g => g.id === groupId);
            if (!group) {
                this.showNotification('Grupo no encontrado', 'error');
                return;
            }
            
            // Integrar con el sistema de advertencias de seguridad
            if (window.groupSecurityAdvisor) {
                const mockGroupInfo = {
                    id: group.id,
                    name: group.name,
                    contribution_amount: group.contribution_amount,
                    coordinator_days_active: group.coordinator_days_active,
                    member_count: group.member_count,
                    verified_members_count: group.verified_members_count
                };
                
                const riskAssessment = window.groupSecurityAdvisor.evaluateJoinRisk(mockGroupInfo);
                
                if (riskAssessment.showWarning) {
                    const userDecision = await window.groupSecurityAdvisor.showJoinWarning(mockGroupInfo, riskAssessment);
                    
                    if (!userDecision.proceed) {
                        return; // Usuario decidió no proceder
                    }
                }
            }
            
            // Proceder con la solicitud
            this.showNotification('Solicitud enviada exitosamente! El coordinador la revisará pronto.', 'success');
            this.addToRecentSearches(group.name);
            
        } catch (error) {
            console.error('Error requesting to join group:', error);
            this.showNotification('Error al enviar solicitud', 'error');
        }
    }
    
    async acceptMemberRequest(requestId) {
        try {
            const request = this.mockRequests.find(r => r.id === requestId);
            if (!request) {
                this.showNotification('Solicitud no encontrada', 'error');
                return;
            }
            
            // Integrar con el sistema de advertencias de seguridad
            if (window.groupSecurityAdvisor) {
                const mockMemberInfo = {
                    id: request.user_id,
                    name: request.user_name,
                    days_since_registration: request.user_days_registered || 30,
                    phone_verified: request.user_phone_verified || true,
                    email_verified: request.user_email_verified || true,
                    groups_left_count: request.user_groups_left || 0,
                    avatar_url: request.user_avatar
                };
                
                const mockGroupInfo = { id: request.group_id, name: request.group_name };
                const riskAssessment = window.groupSecurityAdvisor.evaluateAcceptanceRisk(mockMemberInfo, mockGroupInfo);
                
                if (riskAssessment.showWarning) {
                    const coordinatorDecision = await window.groupSecurityAdvisor.showAcceptanceWarning(mockMemberInfo, mockGroupInfo, riskAssessment);
                    
                    if (!coordinatorDecision.proceed) {
                        return; // Coordinador decidió no proceder
                    }
                }
            }
            
            // Proceder con la aceptación
            this.showNotification('Miembro aceptado exitosamente! 🎉', 'success');
            this.loadRequests(); // Recargar solicitudes
            this.updateQuickStats();
            
        } catch (error) {
            console.error('Error accepting member request:', error);
            this.showNotification('Error al aceptar miembro', 'error');
        }
    }
    
    async rejectMemberRequest(requestId) {
        const reason = prompt('¿Razón del rechazo? (opcional)');
        this.showNotification('Solicitud rechazada', 'info');
        this.loadRequests();
    }
    
    /**
     * FUNCIONES DE UTILIDAD
     */
    calculateGroupRisk(group) {
        let riskScore = 0;
        
        if (group.coordinator_days_active < 30) riskScore += 3;
        else if (group.coordinator_days_active < 180) riskScore += 1;
        
        if (group.contribution_amount > 2500) riskScore += 2;
        else if (group.contribution_amount > 1000) riskScore += 1;
        
        if (group.verified_members_count === 0) riskScore += 2;
        
        if (group.member_count > 20) riskScore += 1;
        
        if (riskScore >= 4) return 'high-risk';
        if (riskScore >= 2) return 'medium-risk';
        return 'low-risk';
    }
    
    getRiskBadge(riskLevel) {
        const badges = {
            'high-risk': '<span class="risk-badge high">⚠️ Alto riesgo</span>',
            'medium-risk': '<span class="risk-badge medium">🔶 Riesgo medio</span>',
            'low-risk': ''
        };
        return badges[riskLevel] || '';
    }
    
    getTypeIcon(type) {
        const icons = {
            family: '👨‍👩‍👧‍👦',
            business: '💼',
            community: '🏘️',
            student: '🎓',
            professional: '👔',
            women: '👩',
            men: '👨'
        };
        return icons[type] || '👥';
    }
    
    getStatusLabel(status) {
        const labels = {
            recruiting: '🟢 Reclutando',
            active: '🔵 Activo',
            full: '🟡 Completo',
            paused: '🟠 Pausado'
        };
        return labels[status] || status;
    }
    
    getExperienceLabel(days) {
        if (days < 180) return '🆕 Nuevo';
        if (days < 730) return '⭐ Experimentado';
        if (days < 1825) return '🏆 Veterano';
        return '👑 Maestro';
    }
    
    getFrequencyLabel(frequency) {
        const labels = {
            weekly: 'semanal',
            biweekly: 'quincenal',
            monthly: 'mensual',
            custom: 'personalizada'
        };
        return labels[frequency] || frequency;
    }
    
    getRequestsTabLabel() {
        const labels = {
            pending: 'pendientes',
            sent: 'enviadas',
            history: 'en el historial'
        };
        return labels[this.currentRequestsTab] || '';
    }
    
    updatePagination(totalItems) {
        this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('groups-pagination');
        
        if (this.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        paginationContainer.querySelector('.page-info').textContent = 
            `Página ${this.currentPage} de ${this.totalPages}`;
        
        const prevBtn = paginationContainer.querySelector('.page-btn:first-child');
        const nextBtn = paginationContainer.querySelector('.page-btn:last-child');
        
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.totalPages;
    }
    
    updateQuickStats() {
        // Actualizar estadísticas rápidas
        document.getElementById('total-groups').textContent = this.mockGroups.length;
        document.getElementById('my-groups').textContent = this.mockUserGroups.length;
        document.getElementById('coordinating').textContent = 
            this.mockUserGroups.filter(g => g.role === 'coordinator').length;
        
        const totalSavings = this.mockUserGroups.reduce((sum, group) => sum + group.my_earned, 0);
        document.getElementById('total-savings').textContent = `L. ${totalSavings.toLocaleString()}`;
    }
    
    highlightSearchTerms(query) {
        // Implementar resaltado de términos de búsqueda
        if (!query) return;
        
        const groupCards = document.querySelectorAll('.group-card');
        groupCards.forEach(card => {
            const textElements = card.querySelectorAll('.group-name, .coordinator-name, .group-description');
            textElements.forEach(element => {
                const originalText = element.textContent;
                const highlightedText = originalText.replace(
                    new RegExp(query, 'gi'),
                    match => `<mark class="search-highlight">${match}</mark>`
                );
                element.innerHTML = highlightedText;
            });
        });
    }
    
    /**
     * NAVEGACIÓN Y PAGINACIÓN
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.performSearch();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.performSearch();
        }
    }
    
    /**
     * GENERACIÓN DE DATOS MOCK
     */
    generateMockGroups() {
        const groupTypes = ['family', 'business', 'community', 'student', 'professional', 'women', 'men'];
        const locations = [
            { key: 'tegucigalpa', name: 'Tegucigalpa' },
            { key: 'san-pedro-sula', name: 'San Pedro Sula' },
            { key: 'la-ceiba', name: 'La Ceiba' },
            { key: 'choloma', name: 'Choloma' },
            { key: 'online', name: '💻 Virtual' }
        ];
        const statuses = ['recruiting', 'active', 'full'];
        const frequencies = ['weekly', 'biweekly', 'monthly'];
        
        const groups = [];
        
        for (let i = 1; i <= 127; i++) {
            const type = groupTypes[Math.floor(Math.random() * groupTypes.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
            
            groups.push({
                id: `group_${i.toString().padStart(3, '0')}`,
                name: this.generateGroupName(type),
                category: type,
                contribution_amount: this.generateContribution(),
                frequency: frequency,
                member_count: Math.floor(Math.random() * 20) + 3,
                max_members: Math.floor(Math.random() * 10) + 15,
                total_amount_collected: Math.floor(Math.random() * 50000) + 5000,
                coordinator_name: this.generatePersonName(),
                coordinator_id: `user_${Math.floor(Math.random() * 1000) + 1}`,
                coordinator_avatar: `https://ui-avatars.com/api/?name=${this.generatePersonName()}&background=random`,
                coordinator_days_active: Math.floor(Math.random() * 1000) + 1,
                status: status,
                created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                location: location.name,
                location_key: location.key,
                description: this.generateDescription(type),
                image_url: `https://picsum.photos/300/200?random=${i}`,
                meeting_schedule: this.generateMeetingSchedule(),
                verified_members_count: Math.floor(Math.random() * 15)
            });
        }
        
        return groups;
    }
    
    generateMockUserGroups() {
        return [
            {
                id: 'group_001',
                name: 'Ahorro Familiar Pérez',
                role: 'coordinator',
                status: 'active',
                image_url: 'https://picsum.photos/300/200?random=1001',
                member_count: 8,
                max_members: 12,
                my_contribution: 2400,
                my_earned: 9600,
                my_position: 3,
                monthly_collection: 19200,
                next_payment_date: '15 Feb 2024',
                pending_requests: 2
            },
            {
                id: 'group_045',
                name: 'Emprendedores Unidos',
                role: 'member',
                status: 'active',
                image_url: 'https://picsum.photos/300/200?random=1002',
                member_count: 15,
                max_members: 20,
                my_contribution: 1200,
                my_earned: 0,
                my_position: 12,
                monthly_collection: 18000,
                next_payment_date: '20 Feb 2024'
            },
            {
                id: 'group_089',
                name: 'Profesionales SPS',
                role: 'member',
                status: 'recruiting',
                image_url: 'https://picsum.photos/300/200?random=1003',
                member_count: 6,
                max_members: 15,
                my_contribution: 800,
                my_earned: 2400,
                my_position: 4,
                monthly_collection: 4800,
                next_payment_date: '25 Feb 2024'
            }
        ];
    }
    
    generateMockRequests() {
        return [
            {
                id: 'req_001',
                type: 'pending',
                user_id: 'user_501',
                user_name: 'María González',
                user_avatar: 'https://ui-avatars.com/api/?name=María González&background=random',
                user_experience: 'Nuevo (2 meses)',
                user_rating: 4.2,
                user_days_registered: 60,
                user_phone_verified: true,
                user_email_verified: true,
                user_groups_left: 0,
                group_id: 'group_001',
                group_name: 'Ahorro Familiar Pérez',
                message: 'Hola, me interesa mucho participar en su grupo familiar. Tengo experiencia previa en tandas.',
                time_ago: 'Hace 2 horas',
                status: 'pending'
            },
            {
                id: 'req_002',
                type: 'pending',
                user_id: 'user_502',
                user_name: 'Carlos Rodríguez',
                user_avatar: 'https://ui-avatars.com/api/?name=Carlos Rodríguez&background=random',
                user_experience: 'Experimentado (1 año)',
                user_rating: 4.8,
                user_days_registered: 365,
                user_phone_verified: true,
                user_email_verified: true,
                user_groups_left: 1,
                group_id: 'group_001',
                group_name: 'Ahorro Familiar Pérez',
                message: 'Buenos días, soy muy responsable con los pagos y me gustaría formar parte del grupo.',
                time_ago: 'Hace 5 horas',
                status: 'pending'
            },
            {
                id: 'req_003',
                type: 'sent',
                user_id: 'current_user',
                user_name: 'Mi Solicitud',
                group_id: 'group_078',
                group_name: 'Mujeres Emprendedoras',
                message: 'Solicitud enviada para unirse al grupo',
                time_ago: 'Hace 1 día',
                status: 'pending'
            }
        ];
    }
    
    generateGroupName(type) {
        const names = {
            family: ['Ahorro Familiar', 'Familia Unida', 'Círculo Familiar', 'Grupo Familiar'],
            business: ['Emprendedores Unidos', 'Negociantes', 'Empresarios', 'Comerciantes Unidos'],
            community: ['Vecinos Solidarios', 'Comunidad Activa', 'Barrio Unido', 'Solidaridad Comunitaria'],
            student: ['Estudiantes Unidos', 'Futuros Profesionales', 'Universitarios', 'Jóvenes Ahorradores'],
            professional: ['Profesionales', 'Círculo Profesional', 'Ejecutivos', 'Profesionistas Unidos'],
            women: ['Mujeres Emprendedoras', 'Círculo Femenino', 'Mujeres Unidos', 'Hermanas'],
            men: ['Hombres Unidos', 'Hermanos', 'Caballeros', 'Varones Unidos']
        };
        
        const baseName = names[type][Math.floor(Math.random() * names[type].length)];
        const suffixes = ['2024', 'Plus', 'Premium', 'Elite', 'Gold', 'VIP', 'Pro'];
        
        if (Math.random() > 0.7) {
            return `${baseName} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
        }
        
        return baseName;
    }
    
    generatePersonName() {
        const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Elena', 'Miguel', 'Rosa', 'Antonio', 'Isabel'];
        const lastNames = ['García', 'Rodríguez', 'González', 'Hernández', 'López', 'Martínez', 'Pérez', 'Sánchez', 'Ramírez'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${lastName}`;
    }
    
    generateContribution() {
        const amounts = [100, 200, 300, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000];
        return amounts[Math.floor(Math.random() * amounts.length)];
    }
    
    generateDescription(type) {
        const descriptions = {
            family: 'Grupo familiar enfocado en el ahorro conjunto para metas comunes y apoyo mutuo.',
            business: 'Empresarios y emprendedores unidos para capitalización y crecimiento de negocios.',
            community: 'Vecinos de la comunidad que se apoyan mutuamente para mejorar su situación financiera.',
            student: 'Estudiantes universitarios ahorrando para educación y proyectos estudiantiles.',
            professional: 'Profesionales establecidos con metas de inversión y ahorro a largo plazo.',
            women: 'Mujeres empoderadas trabajando juntas hacia la independencia financiera.',
            men: 'Grupo masculino enfocado en disciplina financiera y apoyo entre hermanos.'
        };
        
        return descriptions[type] || 'Grupo de ahorro tradicional con enfoque en responsabilidad y confianza mutua.';
    }
    
    generateMeetingSchedule() {
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados', 'Domingos'];
        const times = ['9:00 AM', '2:00 PM', '4:00 PM', '6:00 PM', '7:00 PM'];
        
        const day = days[Math.floor(Math.random() * days.length)];
        const time = times[Math.floor(Math.random() * times.length)];
        
        return `${day} ${time}`;
    }
    
    /**
     * FUNCIONES DE NOTIFICACIÓN
     */
    showNotification(message, type = 'info') {
        if (window.auth && window.auth.showNotification) {
            window.auth.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    /**
     * FUNCIONES ADICIONALES (stubs para funcionalidad futura)
     */
    showCreateGroup() {
        this.showNotification('Función de crear grupo próximamente disponible', 'info');
    }
    
    toggleFilters() {
        this.toggleAdvancedSearch();
    }
    
    viewGroupDetails(groupId) {
        this.showNotification(`Abriendo detalles del grupo ${groupId}...`, 'info');
    }
    
    shareGroup(groupId) {
        navigator.clipboard.writeText(`${window.location.origin}?group=${groupId}`)
            .then(() => this.showNotification('Enlace copiado al portapapeles', 'success'))
            .catch(() => this.showNotification('Error al copiar enlace', 'error'));
    }
    
    viewMyGroupDetails(groupId) {
        this.showNotification(`Abriendo mis detalles del grupo ${groupId}...`, 'info');
    }
    
    openGroupDashboard(groupId) {
        this.showNotification(`Abriendo dashboard del grupo ${groupId}...`, 'info');
    }
    
    openCoordinatorPanel(groupId) {
        this.showNotification(`Abriendo panel de coordinador para ${groupId}...`, 'info');
    }
    
    manageMembers(groupId) {
        this.showNotification(`Abriendo gestión de miembros para ${groupId}...`, 'info');
    }
    
    cancelRequest(requestId) {
        this.showNotification('Solicitud cancelada', 'info');
        this.loadRequests();
    }
    
    saveCurrentSearch() {
        const searchData = {
            query: this.searchQuery,
            filters: this.activeFilters,
            name: this.searchQuery || 'Búsqueda sin nombre',
            date: new Date().toISOString()
        };
        
        this.savedSearches.push(searchData);
        localStorage.setItem('saved_searches', JSON.stringify(this.savedSearches));
        this.showNotification('Búsqueda guardada exitosamente', 'success');
    }
    
    loadSavedSearches() {
        this.savedSearches = JSON.parse(localStorage.getItem('saved_searches') || '[]');
    }
}

// Inicializar el gestor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.tandasManager = new TandasManager();
});