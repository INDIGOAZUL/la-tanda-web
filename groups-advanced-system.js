/**
 * La Tanda - Sistema de Grupos & Tandas Avanzado
 * Gestión completa de grupos cooperativos con auto-matching
 * Versión: 2.0.0
 */

class AdvancedGroupsSystem {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = this.getCurrentUser();
        
        // Estado del sistema
        this.groups = [];
        this.tandas = [];
        this.matches = [];
        this.userStats = {
            totalGroups: 0,
            totalTandas: 0,
            totalSavings: 0,
            activeMatches: 0,
            trustScore: 0,
            completionRate: 0
        };
        
        // Algoritmo de matching
        this.matchingWeights = {
            location: 0.3,
            ageGroup: 0.2,
            experience: 0.25,
            trustScore: 0.15,
            contribution: 0.1
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.setupEventListeners();
            await this.loadUserData();
            await this.loadGroups();
            await this.loadTandas();
            this.updateDashboard();
            
            console.log('🏢 Advanced Groups System initialized');
        } catch (error) {
            console.error('❌ Error initializing groups system:', error);
            this.showNotification('Error inicializando el sistema de grupos', 'error');
        }
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Create group form
        const createGroupForm = document.getElementById('createGroupForm');
        if (createGroupForm) {
            createGroupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateGroup();
            });
        }
        
        // Matching preferences form
        const matchingForm = document.getElementById('matchingPreferencesForm');
        if (matchingForm) {
            matchingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateMatchingPreferences();
            });
        }
        
        // Search functionality
        const searchInput = document.getElementById('searchGroupName');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.searchAvailableGroups();
            }, 300));
        }
        
        // Filter changes
        document.querySelectorAll('[id^="filter"]').forEach(filter => {
            filter.addEventListener('change', () => {
                this.searchAvailableGroups();
            });
        });
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        // Load section-specific data
        this.loadSectionData(tabName);
    }
    
    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'join-group':
                await this.loadAvailableGroups();
                break;
            case 'manage-tandas':
                await this.loadTandasManagement();
                break;
            case 'matching':
                await this.loadMatchingSuggestions();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
        }
    }
    
    async loadUserData() {
        try {
            // Cargar datos del usuario desde localStorage o API
            const userData = this.getCurrentUser();
            if (userData) {
                this.currentUser = userData;
                await this.loadUserStats();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    async loadUserStats() {
        try {
            // En un entorno real, esto vendría de la API
            const mockStats = {
                totalGroups: 3,
                totalTandas: 8,
                totalSavings: 24500,
                activeMatches: 5,
                trustScore: 92,
                completionRate: 85
            };
            
            this.userStats = mockStats;
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }
    
    updateStatsDisplay() {
        document.getElementById('totalGroups').textContent = this.userStats.totalGroups;
        document.getElementById('totalTandas').textContent = this.userStats.totalTandas;
        document.getElementById('totalSavings').textContent = `$${this.userStats.totalSavings.toLocaleString()}`;
        document.getElementById('activeMatches').textContent = this.userStats.activeMatches;
        document.getElementById('trustScore').textContent = `${this.userStats.trustScore}%`;
        document.getElementById('completionRate').textContent = `${this.userStats.completionRate}%`;
    }
    
    async loadGroups() {
        try {
            // Cargar grupos del usuario
            const mockGroups = [
                {
                    id: 'group_001',
                    name: 'Cooperativa Central',
                    type: 'business',
                    status: 'active',
                    members: 12,
                    maxMembers: 15,
                    contribution: 1500,
                    cycle_duration: 12,
                    current_cycle: 3,
                    total_saved: 54000,
                    next_payment: '2024-02-15',
                    trust_score: 95,
                    completion_rate: 88
                },
                {
                    id: 'group_002',
                    name: 'Familia Extendida',
                    type: 'family',
                    status: 'active',
                    members: 8,
                    maxMembers: 10,
                    contribution: 800,
                    cycle_duration: 10,
                    current_cycle: 1,
                    total_saved: 6400,
                    next_payment: '2024-02-10',
                    trust_score: 100,
                    completion_rate: 100
                },
                {
                    id: 'group_003',
                    name: 'Profesionales Tech',
                    type: 'professional',
                    status: 'pending',
                    members: 5,
                    maxMembers: 12,
                    contribution: 2000,
                    cycle_duration: 12,
                    current_cycle: 0,
                    total_saved: 0,
                    next_payment: null,
                    trust_score: 0,
                    completion_rate: 0
                }
            ];
            
            this.groups = mockGroups;
            this.displayMyGroups();
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    }
    
    displayMyGroups() {
        const container = document.getElementById('myGroupsList');
        if (!container) return;
        
        if (this.groups.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">🏢</div>
                    <h3>No tienes grupos activos</h3>
                    <p>Crea tu primer grupo o únete a uno existente</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.groups.map(group => `
            <div class="group-card" onclick="openGroupDetails('${group.id}')">
                <div class="group-header">
                    <div style="display: flex; align-items: center;">
                        <div class="group-icon">${this.getGroupIcon(group.type)}</div>
                        <div class="group-info">
                            <h3>${group.name}</h3>
                            <p>${this.getGroupTypeLabel(group.type)} • ${group.members}/${group.maxMembers} miembros</p>
                        </div>
                    </div>
                    <div class="group-status status-${group.status}">
                        ${this.getStatusLabel(group.status)}
                    </div>
                </div>
                
                <div class="group-stats">
                    <div class="stat">
                        <div class="stat-value">$${group.contribution}</div>
                        <div class="stat-label">Contribución</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${group.current_cycle}</div>
                        <div class="stat-label">Ciclo Actual</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">$${group.total_saved.toLocaleString()}</div>
                        <div class="stat-label">Total Ahorrado</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${group.trust_score}%</div>
                        <div class="stat-label">Confianza</div>
                    </div>
                </div>
                
                ${group.next_payment ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.calculateProgress(group.next_payment)}%"></div>
                    </div>
                    <p style="font-size: 14px; color: rgba(255, 255, 255, 0.6); margin-top: 10px;">
                        Próximo pago: ${this.formatDate(group.next_payment)}
                    </p>
                ` : ''}
            </div>
        `).join('');
    }
    
    async loadTandas() {
        try {
            const mockTandas = [
                {
                    id: 'tanda_001',
                    group_id: 'group_001',
                    group_name: 'Cooperativa Central',
                    cycle: 3,
                    position: 8,
                    total_positions: 12,
                    status: 'active',
                    amount: 18000,
                    next_turn: '2024-08-15',
                    payments_made: 7,
                    payments_remaining: 5
                },
                {
                    id: 'tanda_002',
                    group_id: 'group_002',
                    group_name: 'Familia Extendida',
                    cycle: 1,
                    position: 3,
                    total_positions: 8,
                    status: 'active',
                    amount: 6400,
                    next_turn: '2024-05-10',
                    payments_made: 2,
                    payments_remaining: 6
                }
            ];
            
            this.tandas = mockTandas;
            this.displayActiveTandas();
        } catch (error) {
            console.error('Error loading tandas:', error);
        }
    }
    
    displayActiveTandas() {
        const container = document.getElementById('activeTandasList');
        if (!container) return;
        
        if (this.tandas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔄</div>
                    <h3>No tienes tandas activas</h3>
                    <p>Las tandas aparecerán aquí cuando participes en ciclos activos</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.tandas.map(tanda => `
            <div class="group-card" onclick="openTandaDetails('${tanda.id}')">
                <div class="group-header">
                    <div class="group-info">
                        <h3>${tanda.group_name}</h3>
                        <p>Ciclo ${tanda.cycle} • Posición ${tanda.position}/${tanda.total_positions}</p>
                    </div>
                    <div class="group-status status-${tanda.status}">
                        ${this.getStatusLabel(tanda.status)}
                    </div>
                </div>
                
                <div class="group-stats">
                    <div class="stat">
                        <div class="stat-value">$${tanda.amount.toLocaleString()}</div>
                        <div class="stat-label">Monto Total</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${tanda.payments_made}</div>
                        <div class="stat-label">Pagos Hechos</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${tanda.payments_remaining}</div>
                        <div class="stat-label">Pagos Restantes</div>
                    </div>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(tanda.payments_made / tanda.total_positions) * 100}%"></div>
                </div>
                <p style="font-size: 14px; color: rgba(255, 255, 255, 0.6); margin-top: 10px;">
                    Tu turno: ${this.formatDate(tanda.next_turn)}
                </p>
            </div>
        `).join('');
    }
    
    updateDashboard() {
        this.updateStatsDisplay();
        this.displayMyGroups();
        this.displayActiveTandas();
    }
    
    async handleCreateGroup() {
        try {
            const formData = this.getCreateGroupFormData();
            
            if (!formData) {
                this.showNotification('Por favor completa todos los campos requeridos', 'error');
                return;
            }
            
            // Mostrar modal de confirmación
            this.showCreateGroupPreview(formData);
            
        } catch (error) {
            console.error('Error creating group:', error);
            this.showNotification('Error al crear el grupo', 'error');
        }
    }
    
    getCreateGroupFormData() {
        const form = document.getElementById('createGroupForm');
        const formData = new FormData(form);
        
        return {
            name: document.getElementById('groupName').value,
            type: document.getElementById('groupType').value,
            baseContribution: parseFloat(document.getElementById('baseContribution').value),
            maxParticipants: parseInt(document.getElementById('maxParticipants').value),
            cycleDuration: parseInt(document.getElementById('cycleDuration').value),
            privacyLevel: document.getElementById('privacyLevel').value,
            description: document.getElementById('groupDescription').value,
            features: {
                autoMatching: document.getElementById('autoMatching').checked,
                dynamicContribution: document.getElementById('dynamicContribution').checked,
                emergencyFund: document.getElementById('emergencyFund').checked,
                latePaymentProtection: document.getElementById('latePaymentProtection').checked
            }
        };
    }
    
    showCreateGroupPreview(groupData) {
        const modal = document.getElementById('createGroupModal');
        const preview = document.getElementById('createGroupPreview');
        
        preview.innerHTML = `
            <div class="group-card">
                <div class="group-header">
                    <div style="display: flex; align-items: center;">
                        <div class="group-icon">${this.getGroupIcon(groupData.type)}</div>
                        <div class="group-info">
                            <h3>${groupData.name}</h3>
                            <p>${this.getGroupTypeLabel(groupData.type)} • Hasta ${groupData.maxParticipants} miembros</p>
                        </div>
                    </div>
                    <div class="group-status status-pending">Nuevo</div>
                </div>
                
                <div class="group-stats">
                    <div class="stat">
                        <div class="stat-value">$${groupData.baseContribution}</div>
                        <div class="stat-label">Contribución Base</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${groupData.cycleDuration}</div>
                        <div class="stat-label">Duración (meses)</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${groupData.privacyLevel}</div>
                        <div class="stat-label">Privacidad</div>
                    </div>
                </div>
                
                <p style="margin-top: 20px; color: rgba(255, 255, 255, 0.7);">
                    ${groupData.description}
                </p>
                
                <div style="margin-top: 20px;">
                    <h4 style="margin-bottom: 10px;">Características Habilitadas:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${Object.entries(groupData.features).filter(([key, value]) => value).map(([key, value]) => `
                            <span style="padding: 4px 12px; background: rgba(99, 102, 241, 0.2); border-radius: 20px; font-size: 12px;">
                                ${this.getFeatureLabel(key)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Store form data for confirmation
        this.pendingGroupData = groupData;
    }
    
    async confirmCreateGroup() {
        try {
            const groupData = this.pendingGroupData;
            
            // Simulate API call
            await this.delay(1500);
            
            // Create new group object
            const newGroup = {
                id: 'group_' + Date.now(),
                name: groupData.name,
                type: groupData.type,
                status: 'pending',
                members: 1,
                maxMembers: groupData.maxParticipants,
                contribution: groupData.baseContribution,
                cycle_duration: groupData.cycleDuration,
                current_cycle: 0,
                total_saved: 0,
                next_payment: null,
                trust_score: 0,
                completion_rate: 0,
                features: groupData.features,
                description: groupData.description,
                privacy_level: groupData.privacyLevel,
                created_at: new Date().toISOString(),
                created_by: this.currentUser.id
            };
            
            // Add to groups list
            this.groups.push(newGroup);
            
            // Update display
            this.displayMyGroups();
            this.updateUserStats();
            
            // Close modal and clear form
            this.closeCreateGroupModal();
            this.clearCreateGroupForm();
            
            // Switch to dashboard
            this.switchTab('dashboard');
            
            this.showNotification('¡Grupo creado exitosamente!', 'success');
            
        } catch (error) {
            console.error('Error confirming group creation:', error);
            this.showNotification('Error al crear el grupo', 'error');
        }
    }
    
    async updateUserStats() {
        this.userStats.totalGroups = this.groups.length;
        this.updateStatsDisplay();
    }
    
    closeCreateGroupModal() {
        document.getElementById('createGroupModal').classList.remove('active');
        this.pendingGroupData = null;
    }
    
    clearCreateGroupForm() {
        document.getElementById('createGroupForm').reset();
    }
    
    async loadAvailableGroups() {
        try {
            // Simulate loading available groups
            const mockAvailableGroups = [
                {
                    id: 'available_001',
                    name: 'Emprendedores Unidos',
                    type: 'business',
                    members: 8,
                    maxMembers: 12,
                    contribution: 1200,
                    cycle_duration: 12,
                    privacy_level: 'public',
                    trust_score: 87,
                    completion_rate: 92,
                    match_score: 85
                },
                {
                    id: 'available_002',
                    name: 'Comunidad Verde',
                    type: 'community',
                    members: 15,
                    maxMembers: 20,
                    contribution: 800,
                    cycle_duration: 10,
                    privacy_level: 'semi-private',
                    trust_score: 94,
                    completion_rate: 89,
                    match_score: 78
                },
                {
                    id: 'available_003',
                    name: 'Médicos Asociados',
                    type: 'professional',
                    members: 6,
                    maxMembers: 10,
                    contribution: 2500,
                    cycle_duration: 12,
                    privacy_level: 'private',
                    trust_score: 96,
                    completion_rate: 95,
                    match_score: 92
                }
            ];
            
            this.availableGroups = mockAvailableGroups;
            this.displayAvailableGroups();
            
        } catch (error) {
            console.error('Error loading available groups:', error);
        }
    }
    
    displayAvailableGroups() {
        const container = document.getElementById('availableGroupsList');
        if (!container) return;
        
        if (this.availableGroups.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                    <h3>No se encontraron grupos</h3>
                    <p>Ajusta tus filtros de búsqueda o crea un nuevo grupo</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.availableGroups.map(group => `
            <div class="group-card" onclick="requestJoinGroup('${group.id}')">
                <div class="group-header">
                    <div style="display: flex; align-items: center;">
                        <div class="group-icon">${this.getGroupIcon(group.type)}</div>
                        <div class="group-info">
                            <h3>${group.name}</h3>
                            <p>${this.getGroupTypeLabel(group.type)} • ${group.members}/${group.maxMembers} miembros</p>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                        <div class="group-status status-success">
                            Match ${group.match_score}%
                        </div>
                        <div class="group-status" style="background: rgba(255, 255, 255, 0.1);">
                            ${this.getPrivacyLabel(group.privacy_level)}
                        </div>
                    </div>
                </div>
                
                <div class="group-stats">
                    <div class="stat">
                        <div class="stat-value">$${group.contribution}</div>
                        <div class="stat-label">Contribución</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${group.cycle_duration}</div>
                        <div class="stat-label">Duración</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${group.trust_score}%</div>
                        <div class="stat-label">Confianza</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${group.completion_rate}%</div>
                        <div class="stat-label">Completación</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); requestJoinGroup('${group.id}')">
                        <span>🤝</span> Solicitar Unirse
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Utility methods
    getCurrentUser() {
        const authData = localStorage.getItem('laTandaWeb3Auth') || sessionStorage.getItem('laTandaWeb3Auth');
        if (authData) {
            return JSON.parse(authData).user;
        }
        return {
            id: 'demo_user_001',
            name: 'Usuario Demo',
            email: 'user@example.com'
        };
    }
    
    getGroupIcon(type) {
        const icons = {
            family: '👨‍👩‍👧‍👦',
            business: '🏢',
            community: '🏘️',
            professional: '👔',
            mixed: '🌟'
        };
        return icons[type] || '👥';
    }
    
    getGroupTypeLabel(type) {
        const labels = {
            family: 'Familiar',
            business: 'Empresarial',  
            community: 'Comunitario',
            professional: 'Profesional',
            mixed: 'Mixto'
        };
        return labels[type] || type;
    }
    
    getStatusLabel(status) {
        const labels = {
            active: 'Activo',
            pending: 'Pendiente',
            completed: 'Completado',
            paused: 'Pausado'
        };
        return labels[status] || status;
    }
    
    getPrivacyLabel(privacy) {
        const labels = {
            public: 'Público',
            private: 'Privado',
            'semi-private': 'Semi-privado'
        };
        return labels[privacy] || privacy;
    }
    
    getFeatureLabel(feature) {
        const labels = {
            autoMatching: 'Auto-matching',
            dynamicContribution: 'Contribuciones dinámicas',
            emergencyFund: 'Fondo emergencia',
            latePaymentProtection: 'Protección pagos tardíos'
        };
        return labels[feature] || feature;
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    calculateProgress(nextPaymentDate) {
        const now = new Date();
        const paymentDate = new Date(nextPaymentDate);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        
        return Math.min((currentDay / totalDays) * 100, 100);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            font-weight: 500;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for UI interactions
function showCreateGroupModal() {
    document.getElementById('createGroupModal').classList.add('active');
}

function closeCreateGroupModal() {
    window.groupsSystem.closeCreateGroupModal();
}

function confirmCreateGroup() {
    window.groupsSystem.confirmCreateGroup();
}

function clearCreateGroupForm() {
    window.groupsSystem.clearCreateGroupForm();
}

function openGroupDetails(groupId) {
    console.log('Opening group details for:', groupId);
    // Implement group details modal
}

function openTandaDetails(tandaId) {
    console.log('Opening tanda details for:', tandaId);
    // Implement tanda details modal
}

function requestJoinGroup(groupId) {
    console.log('Requesting to join group:', groupId);
    window.groupsSystem.showNotification('Solicitud enviada exitosamente', 'success');
}

function searchAvailableGroups() {
    if (window.groupsSystem) {
        window.groupsSystem.loadAvailableGroups();
    }
}

function startNewTandaCycle() {
    console.log('Starting new tanda cycle');
    window.groupsSystem.showNotification('Nuevo ciclo de tanda iniciado', 'success');
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.groupsSystem = new AdvancedGroupsSystem();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedGroupsSystem;
}