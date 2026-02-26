/**
 * Sistema de Grupos & Tandas Avanzado v3.0
 * Alineado con La Tanda Web3 Platform
 * Funcionalidades completas con estilo unificado
 */

class AdvancedGroupsSystemV3 {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = this.loadUserData();
        
        // Estado del sistema con persistencia
        this.groups = this.loadGroupsData();
        this.tandas = this.loadTandasData();
        this.matches = this.loadMatchesData();
        this.notifications = this.loadNotificationsData();
        this.activities = this.loadActivitiesData();
        
        // Estadísticas calculadas dinámicamente
        this.userStats = this.calculateUserStats();
        
        // Sistema de navegación
        this.currentTab = 'dashboard';
        
        // Inicializar tema guardado
        this.initTheme();
        
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
        console.log('🏦 Sistema de Grupos & Tandas Avanzado v3.0 - Iniciando...');
        
        try {
            this.setupEventListeners();
            this.updateDashboard();
            this.loadRecentActivity();
            this.initializeFormHandlers();
            
            console.log('✅ Sistema inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar sistema:', error);
        }
    }
    
    // ================================
    // DATA MANAGEMENT SYSTEM
    // ================================
    
    loadUserData() {
        const savedData = localStorage.getItem('latanda_user_data');
        if (savedData) {
            return JSON.parse(savedData);
        }
        
        const defaultUser = {
            id: 'user_001',
            name: 'Usuario Activo',
            email: 'coordinador.principal@latanda.online',
            phone: '+504 9999-9999',
            location: 'Tegucigalpa, Honduras',
            avatar: 'fas fa-user-circle',
            joinDate: '2024-01-15',
            trustScore: 94,
            completedTandas: 12,
            preferences: {
                theme: localStorage.getItem('theme-preference') || 'light',
                notifications: {
                    push: true,
                    email: false,
                    payments: true,
                    newMembers: true
                }
            }
        };
        
        this.saveUserData(defaultUser);
        return defaultUser;
    }
    
    saveUserData(userData) {
        localStorage.setItem('latanda_user_data', JSON.stringify(userData));
        this.currentUser = userData;
    }
    
    loadGroupsData() {
        const savedGroups = localStorage.getItem('latanda_groups_data');
        if (savedGroups) {
            return JSON.parse(savedGroups);
        }
        
        const defaultGroups = this.getMockGroups();
        this.saveGroupsData(defaultGroups);
        return defaultGroups;
    }
    
    saveGroupsData(groups) {
        localStorage.setItem('latanda_groups_data', JSON.stringify(groups));
    }
    
    loadTandasData() {
        const savedTandas = localStorage.getItem('latanda_tandas_data');
        if (savedTandas) {
            return JSON.parse(savedTandas);
        }
        
        const defaultTandas = this.getMockTandas();
        this.saveTandasData(defaultTandas);
        return defaultTandas;
    }
    
    saveTandasData(tandas) {
        localStorage.setItem('latanda_tandas_data', JSON.stringify(tandas));
    }

    // ================================
    // MOCK DATA GENERATORS
    // ================================

    getMockGroups() {
        return [
            {
                id: 'group_001',
                name: 'Grupo Alpha',
                description: 'Cooperativa familiar del barrio norte',
                type: 'familiar',
                location: 'Tegucigalpa Norte',
                coordinator: this.currentUser.id,
                members: [
                    { id: 'user_001', name: 'Usuario Activo', role: 'coordinator', joinDate: '2024-01-15', status: 'active' },
                    { id: 'user_002', name: 'Juan Pérez', role: 'member', joinDate: '2024-01-18', status: 'active' },
                    { id: 'user_003', name: 'María López', role: 'member', joinDate: '2024-01-20', status: 'active' },
                    { id: 'user_004', name: 'Carlos Mendoza', role: 'member', joinDate: '2024-01-22', status: 'active' },
                    { id: 'user_005', name: 'Ana Rivera', role: 'member', joinDate: '2024-01-25', status: 'active' },
                    { id: 'user_006', name: 'Luis García', role: 'member', joinDate: '2024-01-28', status: 'active' },
                    { id: 'user_007', name: 'Sofia Hernández', role: 'member', joinDate: '2024-02-01', status: 'active' },
                    { id: 'user_008', name: 'Pedro Martínez', role: 'member', joinDate: '2024-02-05', status: 'active' }
                ],
                maxMembers: 10,
                contribution: 500,
                frequency: 'monthly',
                status: 'active',
                createdAt: '2024-01-15',
                currentCycle: 2,
                totalCycles: 10,
                rules: ['Puntualidad en pagos obligatoria', 'Participación en reuniones mensuales', 'Respeto mutuo entre miembros'],
                rating: 4.8,
                trustScore: 95,
                totalSavings: 4000,
                performance: 95
            },
            {
                id: 'group_002',
                name: 'Grupo Beta',
                description: 'Tanda laboral de compañeros',
                type: 'laboral',
                location: 'Comayagüela Centro',
                coordinator: this.currentUser.id,
                members: [
                    { id: 'user_001', name: 'Usuario Activo', role: 'coordinator', joinDate: '2024-02-01', status: 'active' },
                    { id: 'user_009', name: 'Roberto Flores', role: 'member', joinDate: '2024-02-03', status: 'active' },
                    { id: 'user_010', name: 'Elena Vargas', role: 'member', joinDate: '2024-02-05', status: 'active' },
                    { id: 'user_011', name: 'Miguel Torres', role: 'member', joinDate: '2024-02-08', status: 'active' },
                    { id: 'user_012', name: 'Carmen Ruiz', role: 'member', joinDate: '2024-02-10', status: 'active' }
                ],
                maxMembers: 8,
                contribution: 300,
                frequency: 'biweekly',
                status: 'active',
                createdAt: '2024-02-01',
                currentCycle: 1,
                totalCycles: 8,
                rules: ['Pagos cada 15 días', 'Comunicación por WhatsApp', 'Reuniones virtuales permitidas'],
                rating: 4.6,
                trustScore: 92,
                totalSavings: 1500,
                performance: 92
            },
            {
                id: 'group_003',
                name: 'Grupo Gamma',
                description: 'Cooperativa comunitaria',
                type: 'comunitario',
                location: 'Tegucigalpa Sur',
                coordinator: 'user_013',
                members: [
                    { id: 'user_001', name: 'Usuario Activo', role: 'member', joinDate: '2024-01-10', status: 'active' },
                    { id: 'user_013', name: 'Andrea Sánchez', role: 'coordinator', joinDate: '2024-01-05', status: 'active' },
                    { id: 'user_014', name: 'José Morales', role: 'member', joinDate: '2024-01-12', status: 'active' }
                ],
                maxMembers: 15,
                contribution: 800,
                frequency: 'monthly',
                status: 'paused',
                createdAt: '2024-01-05',
                currentCycle: 0,
                totalCycles: 15,
                rules: ['Contribución alta requiere estabilidad', 'Reuniones presenciales obligatorias'],
                rating: 4.9,
                trustScore: 97,
                totalSavings: 2400,
                performance: 89
            }
        ];
    }

    getMockTandas() {
        return [
            {
                id: 'tanda_001',
                groupId: 'group_001',
                groupName: 'Grupo Alpha',
                participants: [
                    { userId: 'user_001', position: 3, amount: 2400, status: 'active', turnDate: '2024-03-15' },
                    { userId: 'user_002', position: 1, amount: 2400, status: 'completed', turnDate: '2024-01-15' },
                    { userId: 'user_003', position: 2, amount: 2400, status: 'completed', turnDate: '2024-02-15' },
                    { userId: 'user_004', position: 4, amount: 2400, status: 'pending', turnDate: '2024-04-15' },
                    { userId: 'user_005', position: 5, amount: 2400, status: 'pending', turnDate: '2024-05-15' },
                    { userId: 'user_006', position: 6, amount: 2400, status: 'pending', turnDate: '2024-06-15' },
                    { userId: 'user_007', position: 7, amount: 2400, status: 'pending', turnDate: '2024-07-15' },
                    { userId: 'user_008', position: 8, amount: 2400, status: 'pending', turnDate: '2024-08-15' }
                ],
                currentPosition: 2,
                totalPositions: 8,
                monthlyAmount: 300,
                totalAmount: 2400,
                status: 'active',
                startDate: '2024-01-15',
                nextPaymentDate: '2024-01-15'
            },
            {
                id: 'tanda_002',
                groupId: 'group_002',
                groupName: 'Grupo Beta',
                participants: [
                    { userId: 'user_001', position: 1, amount: 1500, status: 'current', turnDate: '2024-01-01' },
                    { userId: 'user_009', position: 2, amount: 1500, status: 'pending', turnDate: '2024-02-01' },
                    { userId: 'user_010', position: 3, amount: 1500, status: 'pending', turnDate: '2024-03-01' },
                    { userId: 'user_011', position: 4, amount: 1500, status: 'pending', turnDate: '2024-04-01' },
                    { userId: 'user_012', position: 5, amount: 1500, status: 'pending', turnDate: '2024-05-01' }
                ],
                currentPosition: 1,
                totalPositions: 5,
                monthlyAmount: 300,
                totalAmount: 1500,
                status: 'active',
                startDate: '2024-01-01',
                nextPaymentDate: '2024-01-15'
            },
            {
                id: 'tanda_003',
                groupId: 'group_003',
                groupName: 'Grupo Gamma',
                participants: [
                    { userId: 'user_001', position: 7, amount: 9600, status: 'active', turnDate: '2024-08-01' },
                    { userId: 'user_013', position: 1, amount: 9600, status: 'completed', turnDate: '2024-02-01' },
                    { userId: 'user_014', position: 2, amount: 9600, status: 'completed', turnDate: '2024-03-01' }
                ],
                currentPosition: 2,
                totalPositions: 12,
                monthlyAmount: 800,
                totalAmount: 9600,
                status: 'active',
                startDate: '2024-01-01',
                nextPaymentDate: '2024-01-20'
            }
        ];
    }

    getMockMatches() {
        return [
            {
                id: 'match_001',
                type: 'group',
                targetId: 'group_004',
                targetName: 'Grupo Delta',
                compatibilityScore: 95,
                reasons: ['Ubicación similar', 'Monto compatible', 'Horarios coincidentes'],
                status: 'pending'
            },
            {
                id: 'match_002',
                type: 'user',
                targetId: 'user_015',
                targetName: 'Ana González',
                compatibilityScore: 92,
                reasons: ['Experiencia en tandas', 'Buen historial crediticio', 'Ubicación cercana'],
                status: 'pending'
            }
        ];
    }

    getMockNotifications() {
        return [
            {
                id: 'notif_001',
                type: 'payment_reminder',
                title: 'Recordatorio de Pago',
                message: 'Tu pago del Grupo Alpha vence en 3 días',
                groupId: 'group_001',
                isRead: false,
                createdAt: new Date().toISOString(),
                priority: 'high'
            },
            {
                id: 'notif_002',
                type: 'turn_notification',
                title: 'Tu Turno Próximo',
                message: 'Tu turno en Tanda Beta comienza mañana',
                tandaId: 'tanda_002',
                isRead: false,
                createdAt: new Date().toISOString(),
                priority: 'high'
            },
            {
                id: 'notif_003',
                type: 'new_member',
                title: 'Nuevo Miembro',
                message: 'María López se unió al Grupo Gamma',
                groupId: 'group_003',
                isRead: true,
                createdAt: new Date().toISOString(),
                priority: 'medium'
            }
        ];
    }

    getMockActivities() {
        return [
            {
                id: 'activity_001',
                type: 'payment',
                description: 'Juan Pérez realizó su pago del Grupo Alpha',
                groupId: 'group_001',
                userId: 'user_002',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                icon: 'fas fa-check-circle',
                status: 'success'
            },
            {
                id: 'activity_002',
                type: 'turn_start',
                description: 'Tu turno en Tanda Beta comienza mañana',
                tandaId: 'tanda_002',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                icon: 'fas fa-clock',
                status: 'warning'
            },
            {
                id: 'activity_003',
                type: 'member_join',
                description: 'María López se unió al Grupo Gamma',
                groupId: 'group_003',
                userId: 'user_003',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                icon: 'fas fa-user-plus',
                status: 'info'
            },
            {
                id: 'activity_004',
                type: 'payment_reminder',
                description: 'Recordatorio: Pago de Grupo Delta vence en 2 días',
                groupId: 'group_004',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                icon: 'fas fa-exclamation-triangle',
                status: 'alert'
            }
        ];
    }
    
    loadMatchesData() {
        const savedMatches = localStorage.getItem('latanda_matches_data');
        if (savedMatches) {
            return JSON.parse(savedMatches);
        }
        
        const defaultMatches = this.getMockMatches();
        this.saveMatchesData(defaultMatches);
        return defaultMatches;
    }
    
    saveMatchesData(matches) {
        localStorage.setItem('latanda_matches_data', JSON.stringify(matches));
    }
    
    loadNotificationsData() {
        const savedNotifications = localStorage.getItem('latanda_notifications_data');
        if (savedNotifications) {
            return JSON.parse(savedNotifications);
        }
        
        const defaultNotifications = this.getMockNotifications();
        this.saveNotificationsData(defaultNotifications);
        return defaultNotifications;
    }
    
    saveNotificationsData(notifications) {
        localStorage.setItem('latanda_notifications_data', JSON.stringify(notifications));
    }
    
    loadActivitiesData() {
        const savedActivities = localStorage.getItem('latanda_activities_data');
        if (savedActivities) {
            return JSON.parse(savedActivities);
        }
        
        const defaultActivities = this.getMockActivities();
        this.saveActivitiesData(defaultActivities);
        return defaultActivities;
    }
    
    saveActivitiesData(activities) {
        localStorage.setItem('latanda_activities_data', JSON.stringify(activities));
    }
    
    calculateUserStats() {
        return {
            totalGroups: this.groups?.length || 0,
            totalTandas: this.tandas?.length || 0,
            totalSavings: this.calculateTotalSavings(),
            activeMatches: this.matches?.length || 0,
            trustScore: this.currentUser?.trustScore || 94,
            completionRate: this.calculateCompletionRate()
        };
    }

    // ================================
    // HELPER CALCULATION FUNCTIONS
    // ================================

    calculateTotalSavings() {
        if (!this.tandas || !Array.isArray(this.tandas)) return 0;
        return this.tandas.reduce((total, tanda) => {
            const userParticipation = tanda.participants?.find(p => p.userId === this.currentUser?.id);
            return total + (userParticipation?.amount || 0);
        }, 0);
    }

    calculateCompletionRate() {
        if (!this.tandas || !Array.isArray(this.tandas)) return 98;
        const completedTandas = this.tandas.filter(t => t.status === 'completed').length;
        const totalTandas = this.tandas.length;
        return totalTandas > 0 ? Math.round((completedTandas / totalTandas) * 100) : 98;
    }

    calculateActiveMatches() {
        if (!this.matches || !Array.isArray(this.matches)) return 8;
        return this.matches.filter(m => m.status === 'pending').length;
    }

    calculateTrustScore() {
        return this.currentUser?.trustScore || 94;
    }

    calculateMonthlyGrowth() {
        // Simple mock calculation - in real app would analyze historical data
        return 15;
    }

    getUpcomingPayments() {
        if (!this.tandas || !Array.isArray(this.tandas)) return [];
        return this.tandas.filter(t => t.status === 'active').map(t => ({
            tandaId: t.id,
            amount: t.monthlyAmount,
            dueDate: t.nextPaymentDate
        }));
    }

    calculateAvgTandaPerformance() {
        if (!this.tandas || !Array.isArray(this.tandas)) return 95;
        // Mock calculation - in real app would analyze performance metrics
        return 95;
    }
    
    
    initTheme() {
        const savedTheme = this.currentUser?.preferences?.theme || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            const themeBtn = document.querySelector('.header-action-btn i.fa-moon');
            if (themeBtn) themeBtn.className = 'fas fa-sun';
        }
    }
    
    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                if (tabName) this.switchTab(tabName);
            });
        });

        // Interactive statistics cards
        document.querySelectorAll('.stat-card.interactive').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleStatCardClick(card);
            });
        });
        
        // Window resize for responsive updates
        window.addEventListener('resize', this.debounce(() => {
            this.updateResponsiveLayout();
        }, 300));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch(e.key) {
                    case '1': this.switchTab('dashboard'); break;
                    case '2': this.switchTab('groups'); break;
                    case '3': this.switchTab('create'); break;
                    case '4': this.switchTab('tandas'); break;
                    case '5': this.switchTab('matching'); break;
                    case '6': this.switchTab('analytics'); break;
                }
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            // Check if click is outside any dropdown
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                    const card = menu.closest('.group-card');
                    if (card) card.classList.remove('dropdown-active');
                });
            }
        });
    }
    
    switchTab(tabName) {
        console.log(`🔄 Cambiando a pestaña: ${tabName}`);
        
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName)?.classList.add('active');
        
        this.currentTab = tabName;
        
        // Initialize multi-step form when create tab is accessed
        if (tabName === 'create') {
            // Wait for DOM to be fully rendered
            setTimeout(() => {
                this.initializeMultiStepForm();
            }, 300);
        } else {
            // Reset initialization flag when leaving create tab
            this.isMultiStepInitialized = false;
        }
        
        // Load content for specific tabs
        this.loadTabContent(tabName);
    }
    
    async loadTabContent(tabName) {
        switch(tabName) {
            case 'groups':
                // Clear any static content first
                const groupsList = document.getElementById('groupsList');
                if (groupsList) {
                    groupsList.innerHTML = '<div class="loading-spinner">Cargando grupos...</div>';
                }
                await this.loadGroupsContent();
                break;
            case 'create':
                // this.loadCreateGroupForm(); // DISABLED - Using static HTML instead
                break;
            case 'tandas':
                await this.loadTandasContent();
                break;
            case 'matching':
                await this.loadMatchingContent();
                break;
            case 'analytics':
                await this.loadAnalyticsContent();
                break;
        }
    }
    
    async loadUserData() {
        try {
            // Simular carga de datos del usuario
            await this.delay(500);
            
            // Actualizar estadísticas en tiempo real
            this.updateStats();
            
            console.log('✅ Datos de usuario cargados');
        } catch (error) {
            console.error('❌ Error cargando datos de usuario:', error);
        }
    }
    
    async loadGroups() {
        try {
            // Simular carga de grupos con datos más completos
            this.groups = [
                {
                    id: 'group_1',
                    name: 'Cooperativa Familiar',
                    description: 'Grupo de ahorro familiar para metas a largo plazo',
                    type: 'family',
                    members: 8,
                    maxMembers: 12,
                    contribution: 1500,
                    totalSavings: 84000,
                    status: 'active',
                    isOwner: true,
                    isAdmin: true,
                    performance: 95,
                    trustScore: 92,
                    nextMeeting: '2025-02-15',
                    location: 'Tegucigalpa',
                    frequency: 'monthly',
                    created: new Date('2024-01-20'),
                    avatar: '👨‍👩‍👧‍👦',
                    tags: ['familiar', 'ahorro', 'largo-plazo']
                },
                {
                    id: 'group_2', 
                    name: 'Tanda Profesionales',
                    description: 'Red de profesionales independientes con metas empresariales',
                    type: 'professional',
                    members: 10,
                    maxMembers: 10,
                    contribution: 2000,
                    totalSavings: 120000,
                    status: 'active',
                    isOwner: false,
                    isAdmin: false,
                    performance: 88,
                    trustScore: 96,
                    nextMeeting: '2025-02-20',
                    location: 'San Pedro Sula',
                    frequency: 'bi-weekly',
                    created: new Date('2024-02-15'),
                    avatar: '💼',
                    tags: ['profesional', 'negocios', 'emprendimiento']
                },
                {
                    id: 'group_3',
                    name: 'Grupo Comunitario Norte',
                    description: 'Grupo comunitario del sector norte de la ciudad',
                    type: 'community',
                    members: 15,
                    maxMembers: 20,
                    contribution: 1000,
                    totalSavings: 180000,
                    status: 'completed',
                    isOwner: false,
                    isAdmin: false,
                    performance: 100,
                    trustScore: 94,
                    nextMeeting: null,
                    location: 'Tegucigalpa Norte',
                    frequency: 'weekly',
                    created: new Date('2024-01-10'),
                    avatar: '🏘️',
                    tags: ['comunidad', 'vecinos', 'completado']
                },
                {
                    id: 'group_4',
                    name: 'Tanda Juventud',
                    description: 'Grupo de jóvenes ahorrando para estudios y proyectos',
                    type: 'youth',
                    members: 6,
                    maxMembers: 12,
                    contribution: 800,
                    totalSavings: 28800,
                    status: 'recruiting',
                    isOwner: true,
                    isAdmin: true,
                    performance: 0, // Nuevo grupo
                    trustScore: 0,
                    nextMeeting: '2025-02-12',
                    location: 'Online',
                    frequency: 'monthly',
                    created: new Date('2025-01-05'),
                    avatar: '👥',
                    tags: ['juventud', 'estudiantes', 'nuevo']
                }
            ];
            
            console.log('✅ Grupos cargados:', this.groups.length);
        } catch (error) {
            console.error('❌ Error cargando grupos:', error);
        }
    }
    
    async loadTandas() {
        try {
            // Simular carga de tandas
            this.tandas = [
                {
                    id: 'tanda_1',
                    groupId: 'group_1',
                    groupName: 'Cooperativa Familiar',
                    cycle: 3,
                    position: 2,
                    amount: 12000,
                    status: 'active',
                    nextPayment: new Date('2024-08-15'),
                    progress: 65
                },
                {
                    id: 'tanda_2',
                    groupId: 'group_2',
                    groupName: 'Tanda Profesionales',
                    cycle: 1,
                    position: 7,
                    amount: 20000,
                    status: 'waiting',
                    nextPayment: new Date('2024-09-01'),
                    progress: 30
                }
            ];
            
            console.log('✅ Tandas cargadas:', this.tandas.length);
        } catch (error) {
            console.error('❌ Error cargando tandas:', error);
        }
    }
    
    updateDashboard() {
        // Recalcular estadísticas con datos reales
        this.userStats = this.calculateUserStats();
        
        // Actualizar elementos del dashboard con datos reales
        this.updateStatCards();
        this.loadRecentActivity();
        this.updateQuickActions();
        
        console.log('📊 Dashboard actualizado con datos reales:', this.userStats);
    }
    
    updateStatCards() {
        // Actualizar tarjetas de estadísticas con animaciones
        this.animateStatCounter('totalGroups', this.userStats.totalGroups);
        this.animateStatCounter('totalTandas', this.userStats.totalTandas);
        this.animateStatValue('totalSavings', this.userStats.totalSavings, 'L. ', true);
        this.animateStatCounter('activeMatches', this.userStats.activeMatches);
        this.animateStatValue('trustScore', this.userStats.trustScore, '', false, '%');
        this.animateStatValue('completionRate', this.userStats.completionRate, '', false, '%');
        
        // Actualizar trends basados en datos históricos
        this.updateStatTrends();
    }
    
    // ================================
    // FORM HANDLING SYSTEM
    // ================================
    
    initializeFormHandlers() {
        // Inicializar validación en tiempo real para formularios
        this.setupCreateGroupFormValidation();
        this.setupProfileFormHandling();
        this.setupNotificationPreferences();
        
        console.log('📝 Sistema de formularios inicializado');
    }
    
    setupCreateGroupFormValidation() {
        const form = document.getElementById('create-group-form');
        if (!form) return;
        
        // Validación en tiempo real
        form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });
        
        // Auto-guardado de borrador
        let autoSaveTimer;
        form.addEventListener('input', () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                this.saveFormDraft();
            }, 1000);
        });
    }
    
    validateField(field) {
        const fieldId = field.id;
        const value = field.value.trim();
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (!errorElement) return;
        
        let isValid = true;
        let errorMessage = '';
        
        switch (fieldId) {
            case 'group-name':
                if (value.length < 3) {
                    isValid = false;
                    errorMessage = 'El nombre debe tener al menos 3 caracteres';
                } else if (this.groups.some(g => g.name.toLowerCase() === value.toLowerCase())) {
                    isValid = false;
                    errorMessage = 'Ya existe un grupo con este nombre';
                }
                break;
                
            case 'group-description':
                if (value.length < 10) {
                    isValid = false;
                    errorMessage = 'La descripción debe tener al menos 10 caracteres';
                }
                break;
                
            case 'contribution':
                const amount = parseFloat(value);
                if (amount < 100) {
                    isValid = false;
                    errorMessage = 'La contribución mínima es L. 100';
                } else if (amount > 50000) {
                    isValid = false;
                    errorMessage = 'La contribución máxima es L. 50,000';
                }
                break;
                
            case 'max-participants':
                const maxParticipants = parseInt(value);
                if (maxParticipants < 2) {
                    isValid = false;
                    errorMessage = 'Mínimo 2 participantes';
                } else if (maxParticipants > 50) {
                    isValid = false;
                    errorMessage = 'Máximo 50 participantes';
                }
                break;
        }
        
        // Mostrar/ocultar error
        errorElement.textContent = errorMessage;
        errorElement.style.display = isValid ? 'none' : 'block';
        field.classList.toggle('error', !isValid);
        
        return isValid;
    }
    
    saveFormDraft() {
        const formData = this.getCreateGroupFormData();
        if (formData && Object.keys(formData).length > 0) {
            localStorage.setItem('create-group-draft', JSON.stringify(formData));
            console.log('💾 Borrador guardado automáticamente');
        }
    }
    
    loadFormDraft() {
        const draft = localStorage.getItem('create-group-draft');
        if (draft) {
            const formData = JSON.parse(draft);
            this.populateCreateGroupForm(formData);
            console.log('📄 Borrador cargado');
        }
    }
    
    setupProfileFormHandling() {
        // Manejar cambios en el perfil
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn[onclick*="saveProfile"]')) {
                this.handleProfileSave();
            }
        });
    }
    
    handleProfileSave() {
        const profileForm = document.querySelector('.profile-form');
        if (!profileForm) return;
        
        const formData = new FormData(profileForm);
        const updatedUser = {
            ...this.currentUser,
            name: formData.get('name') || this.currentUser.name,
            email: formData.get('email') || this.currentUser.email,
            phone: formData.get('phone') || this.currentUser.phone,
            location: formData.get('location') || this.currentUser.location
        };
        
        this.saveUserData(updatedUser);
        this.updateDashboard();
        
        console.log('👤 Perfil actualizado:', updatedUser);
    }
    
    setupNotificationPreferences() {
        // Manejar cambios en preferencias de notificación
        document.addEventListener('change', (e) => {
            if (e.target.matches('.settings-container input[type="checkbox"]')) {
                this.handleNotificationPreferenceChange(e.target);
            }
        });
    }
    
    handleNotificationPreferenceChange(checkbox) {
        const preference = checkbox.closest('.setting-item')?.querySelector('span')?.textContent;
        const isEnabled = checkbox.checked;
        
        // Actualizar preferencias del usuario
        if (this.currentUser.preferences) {
            this.currentUser.preferences.notifications = {
                ...this.currentUser.preferences.notifications,
                [preference]: isEnabled
            };
            
            this.saveUserData(this.currentUser);
            console.log(`🔔 Preferencia ${preference}: ${isEnabled ? 'activada' : 'desactivada'}`);
        }
    }
    
    updateStats() {
        // Calcular estadísticas basadas en datos reales con verificación defensiva
        this.userStats.totalGroups = (this.groups && Array.isArray(this.groups)) ? this.groups.filter(g => g.status === 'active').length : 0;
        this.userStats.totalTandas = (this.tandas && Array.isArray(this.tandas)) ? this.tandas.length : 0;
        this.userStats.totalSavings = (this.tandas && Array.isArray(this.tandas)) ? this.tandas.reduce((sum, t) => sum + (t.totalAmount || 0), 0) : 0;
        
        // Calcular matches activos basado en compatibilidad con otros grupos
        this.userStats.activeMatches = this.calculateActiveMatches();
        
        // Calcular score de confianza basado en historial de pagos y participación
        this.userStats.trustScore = this.calculateTrustScore();
        
        // Calcular tasa de completación basado en tandas completadas vs iniciadas
        this.userStats.completionRate = this.calculateCompletionRate();
        
        // Calcular estadísticas adicionales
        this.userStats.monthlyGrowth = this.calculateMonthlyGrowth();
        this.userStats.upcomingPayments = this.getUpcomingPayments();
        this.userStats.avgTandaPerformance = this.calculateAvgTandaPerformance();
    }

    // ========================================
    // 📊 CÁLCULO DE ESTADÍSTICAS DINÁMICAS
    // ========================================

    calculateActiveMatches() {
        // Calcular matches basado en grupos disponibles y criterios de compatibilidad
        const availableGroups = this.groups.filter(g => g.status === 'recruiting');
        const userProfile = this.currentUser;
        
        // Simular matching inteligente basado en ubicación, tipo de grupo, etc.
        let matches = 0;
        availableGroups.forEach(group => {
            if (group.location === userProfile.location || group.type === 'community') {
                matches++;
            }
        });
        
        // Agregar matches de tandas disponibles
        const availableTandas = this.tandas.filter(t => t.status === 'upcoming');
        matches += Math.floor(availableTandas.length * 0.6); // 60% compatibility rate
        
        return Math.max(matches, 3); // Minimum 3 matches for demo
    }

    calculateTrustScore() {
        const completedTandas = this.tandas.filter(t => t.status === 'completed').length;
        const totalTandas = this.tandas.length;
        const activeGroups = this.groups.filter(g => g.status === 'active').length;
        
        // Base score on completion rate and active participation
        let baseScore = totalTandas > 0 ? (completedTandas / totalTandas) * 100 : 85;
        
        // Bonus for active participation
        baseScore += Math.min(activeGroups * 2, 10); // Max 10 bonus points
        
        // Penalty simulation for late payments (random factor for demo)
        const latePenalty = Math.random() * 5; // 0-5% penalty
        
        return Math.max(Math.min(Math.round(baseScore - latePenalty), 100), 70);
    }

    calculateCompletionRate() {
        const completedTandas = this.tandas.filter(t => t.status === 'completed').length;
        const totalTandas = this.tandas.length;
        
        if (totalTandas === 0) return 95; // Default high completion rate for new users
        
        const rate = (completedTandas / totalTandas) * 100;
        return Math.max(Math.round(rate), 85); // Minimum 85% for good UX
    }

    calculateMonthlyGrowth() {
        // Simular crecimiento mensual basado en actividad reciente
        const activeGroups = this.groups.filter(g => g.status === 'active').length;
        const recentTandas = this.tandas.filter(t => 
            new Date(t.createdDate || '2025-01-01') > new Date('2024-12-01')
        ).length;
        
        return Math.max(activeGroups * 3 + recentTandas * 2, 8);
    }

    getUpcomingPayments() {
        // Calcular pagos pendientes próximos
        return this.tandas.filter(t => 
            t.status === 'active' && t.paymentsPending > 0
        ).reduce((sum, t) => sum + t.paymentsPending, 0);
    }

    calculateAvgTandaPerformance() {
        const activeTandas = this.tandas.filter(t => t.status === 'active');
        if (activeTandas.length === 0) return 90;
        
        const avgProgress = activeTandas.reduce((sum, t) => sum + t.progress, 0) / activeTandas.length;
        return Math.round(avgProgress);
    }

    updateStatTrends() {
        // Calcular trends dinámicamente basado en datos históricos
        const currentMonth = new Date().getMonth();
        const previousMonth = currentMonth - 1 < 0 ? 11 : currentMonth - 1;
        
        // Simular datos históricos (en implementación real, estos vendrían de la base de datos)
        const historicalData = {
            groups: { current: this.userStats.totalGroups, previous: Math.max(1, this.userStats.totalGroups - 1) },
            tandas: { current: this.userStats.totalTandas, previous: Math.max(1, this.userStats.totalTandas - 1) },
            savings: { current: this.userStats.totalSavings, previous: Math.max(1000, this.userStats.totalSavings * 0.85) },
            matches: { current: this.userStats.activeMatches, previous: Math.max(1, this.userStats.activeMatches - 2) },
            trustScore: { current: this.userStats.trustScore, previous: Math.max(80, this.userStats.trustScore - 2) },
            completionRate: { current: this.userStats.completionRate, previous: Math.max(85, this.userStats.completionRate - 1) }
        };
        
        // Actualizar cada trend en el DOM
        this.updateTrendDisplay('totalGroups', historicalData.groups);
        this.updateTrendDisplay('totalTandas', historicalData.tandas);
        this.updateTrendDisplay('totalSavings', historicalData.savings);
        this.updateTrendDisplay('activeMatches', historicalData.matches);
        this.updateTrendDisplay('trustScore', historicalData.trustScore);
        this.updateTrendDisplay('completionRate', historicalData.completionRate);
    }
    
    updateTrendDisplay(statId, data) {
        const statCard = document.querySelector(`[data-action="navigate"] #${statId}`);
        if (!statCard) return;
        
        const trendElement = statCard.closest('.stat-card').querySelector('.stat-trend');
        if (!trendElement) return;
        
        const percentageChange = ((data.current - data.previous) / data.previous) * 100;
        const isPositive = percentageChange >= 0;
        const trendIcon = trendElement.querySelector('i');
        const trendValue = trendElement.querySelector('span');
        
        // Actualizar clase de trend (positive/negative)
        trendElement.className = `stat-trend ${isPositive ? 'positive' : 'negative'}`;
        
        // Actualizar icono
        if (trendIcon) {
            trendIcon.className = `fas fa-arrow-${isPositive ? 'up' : 'down'}`;
        }
        
        // Actualizar valor con formateo mejorado
        if (trendValue) {
            trendValue.textContent = `${isPositive ? '+' : ''}${Math.round(percentageChange)}%`;
        }
    }

    // ========================================
    // 🎨 FUNCIONES DE ANIMACIÓN Y UI
    // ========================================

    animateStatCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let currentValue = 0;
        const increment = targetValue / 30; // 30 frames de animación
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                element.textContent = targetValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue);
            }
        }, 50);
    }

    animateStatValue(elementId, targetValue, prefix = '', useCommas = false, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let currentValue = 0;
        const increment = targetValue / 30;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                const finalValue = useCommas ? targetValue.toLocaleString() : targetValue;
                element.textContent = `${prefix}${finalValue}${suffix}`;
                clearInterval(timer);
            } else {
                const displayValue = useCommas ? Math.floor(currentValue).toLocaleString() : Math.floor(currentValue);
                element.textContent = `${prefix}${displayValue}${suffix}`;
            }
        }, 50);
    }

    loadDashboardCharts() {
        // Crear mini-gráficos para el dashboard
        this.createSavingsChart();
        // this.createPerformanceChart(); // Temporarily disabled
        // this.createTrendChart(); // Temporarily disabled
    }

    createSavingsChart() {
        const chartContainer = document.querySelector('.savings-chart-container');
        if (!chartContainer) return;
        
        const months = ['Ene', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const savings = [1200, 2400, 3600, 4800, 6000, 7200];
        
        // Simple SVG chart
        const svgChart = `
            <svg width="100%" height="60" viewBox="0 0 300 60" class="savings-mini-chart">
                <polyline points="0,50 50,40 100,30 150,20 200,15 250,10" 
                         fill="none" stroke="var(--tanda-cyan)" stroke-width="2"/>
                <circle cx="250" cy="10" r="3" fill="var(--tanda-cyan)"/>
            </svg>
        `;
        
        if (!document.querySelector('.savings-mini-chart')) {
            chartContainer.innerHTML = svgChart;
        }
    }

    updateQuickActions() {
        // Actualizar notificaciones badge
        const notificationBadge = document.querySelector('.notification-badge');
        if (notificationBadge) {
            const pendingNotifications = this.getPendingNotifications();
            notificationBadge.textContent = pendingNotifications.length;
            notificationBadge.style.display = pendingNotifications.length > 0 ? 'block' : 'none';
        }
    }

    loadUpcomingEvents() {
        // Eventos próximos para mostrar en dashboard
        const upcomingEvents = [
            { type: 'payment', title: 'Pago Tanda Profesionales', date: 'Mañana', amount: 'L. 1,500' },
            { type: 'meeting', title: 'Reunión Cooperativa Familiar', date: 'Viernes', time: '7:00 PM' },
            { type: 'deadline', title: 'Cierre inscripciones Tanda Nueva', date: '3 días', status: 'urgent' }
        ];

        // Agregar eventos al dashboard si hay un contenedor
        const eventsContainer = document.querySelector('.upcoming-events-container');
        if (eventsContainer && !eventsContainer.innerHTML.trim()) {
            eventsContainer.innerHTML = `
                <h4><i class="fas fa-calendar-alt"></i> Próximos Eventos</h4>
                <div class="events-list">
                    ${upcomingEvents.map(event => `
                        <div class="event-item ${event.status || ''}">
                            <div class="event-icon">
                                <i class="fas fa-${this.getEventIcon(event.type)}"></i>
                            </div>
                            <div class="event-details">
                                <div class="event-title">${event.title}</div>
                                <div class="event-meta">${event.date} ${event.time || ''} ${event.amount || ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    getEventIcon(type) {
        const icons = {
            payment: 'money-bill-wave',
            meeting: 'users',
            deadline: 'clock',
            notification: 'bell'
        };
        return icons[type] || 'calendar';
    }

    loadRecentActivity() {
        // Generar actividad reciente basada en datos reales
        const recentActivities = this.generateRecentActivities();
        const activityList = document.getElementById('recentActivityList');
        
        if (!activityList) return;
        
        // Mostrar solo las últimas 3 actividades en el dashboard
        const limitedActivities = recentActivities.slice(0, 3);
        
        console.log('🔍 Loading recent activities:', limitedActivities);
        
        activityList.innerHTML = limitedActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${activity.icon} ${activity.iconColor}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${activity.title || 'Sin título'}</strong> ${activity.description || 'Sin descripción'}</p>
                    <span class="activity-time">${activity.timeAgo || 'Tiempo desconocido'}</span>
                </div>
            </div>
        `).join('');
    }

    generateRecentActivities() {
        // Generar actividades basadas en datos reales de grupos y tandas
        const activities = [];
        const now = new Date();
        
        // Actividades de grupos activos
        this.groups.forEach(group => {
            if (group.status === 'active') {
                // Create activity even if no lastActivity, with fallback timestamp
                const timestamp = group.lastActivity ? new Date(group.lastActivity) : new Date(now - Math.random() * 24 * 60 * 60 * 1000);
                activities.push({
                    id: `group_${group.id}`,
                    type: 'group',
                    title: 'Actividad de Grupo',
                    description: `en "${group.name || 'Grupo Sin Nombre'}"`,
                    icon: 'users',
                    iconColor: 'text-tanda-cyan',
                    timestamp: timestamp,
                    timeAgo: this.getTimeAgo(timestamp)
                });
            }
        });
        
        // Actividades de tandas
        this.tandas.forEach(tanda => {
            // Pagos recibidos
            if (tanda.status === 'active') {
                const timestamp = tanda.lastPayment ? new Date(tanda.lastPayment) : new Date(now - Math.random() * 12 * 60 * 60 * 1000);
                activities.push({
                    id: `payment_${tanda.id}`,
                    type: 'payment',
                    title: 'Pago recibido',
                    description: `de L. ${(tanda.amount || tanda.totalAmount || 1500).toLocaleString()} en "${tanda.groupName || tanda.name || 'Tanda'}"`,
                    icon: 'money-bill-wave',
                    iconColor: 'text-green-400',
                    timestamp: timestamp,
                    timeAgo: this.getTimeAgo(timestamp)
                });
            }
            
            // Tandas completadas
            if (tanda.status === 'completed') {
                activities.push({
                    id: `completed_${tanda.id}`,
                    type: 'completion',
                    title: 'Tanda completada',
                    description: `exitosamente en "${tanda.groupName || tanda.name || 'Tanda'}"`,
                    icon: 'trophy',
                    iconColor: 'text-yellow-400',
                    timestamp: new Date(tanda.completedDate || now),
                    timeAgo: this.getTimeAgo(new Date(tanda.completedDate || now))
                });
            }
        });
        
        // Agregar algunas actividades sintéticas si no hay suficientes
        if (activities.length < 5) {
            activities.push(
                {
                    id: 'new_member_1',
                    type: 'member',
                    title: 'Nuevo miembro',
                    description: 'se unió al grupo "Cooperativa Familiar"',
                    icon: 'user-plus',
                    iconColor: 'text-tanda-cyan',
                    timestamp: new Date(now - 2 * 60 * 60 * 1000), // 2 horas atrás
                    timeAgo: 'Hace 2 horas'
                },
                {
                    id: 'system_update',
                    type: 'system',
                    title: 'Sistema actualizado',
                    description: 'con nuevas funcionalidades de seguridad',
                    icon: 'shield-alt',
                    iconColor: 'text-blue-400',
                    timestamp: new Date(now - 6 * 60 * 60 * 1000), // 6 horas atrás
                    timeAgo: 'Hace 6 horas'
                }
            );
        }
        
        // Ordenar por timestamp descendente (más reciente primero)
        return activities.sort((a, b) => b.timestamp - a.timestamp);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        return date.toLocaleDateString('es-HN');
    }

    viewFullActivity() {
        console.log('📋 Opening full activity view...');
        
        // Generar todas las actividades recientes
        const allActivities = this.generateRecentActivities();
        
        const modal = this.createModal('full-activity', '📋 Historial Completo de Actividad', `
            <div class="full-activity-container">
                <div class="activity-filters">
                    <div class="filter-group">
                        <label>Filtrar por tipo:</label>
                        <select id="activityTypeFilter" onchange="advancedGroupsSystem.filterActivitiesByType(this.value)">
                            <option value="all">Todas las actividades</option>
                            <option value="payment">💰 Pagos</option>
                            <option value="group">👥 Grupos</option>
                            <option value="completion">🏆 Completaciones</option>
                            <option value="member">👤 Miembros</option>
                            <option value="system">🔧 Sistema</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Período:</label>
                        <select id="activityPeriodFilter" onchange="advancedGroupsSystem.filterActivitiesByPeriod(this.value)">
                            <option value="all">Todo el tiempo</option>
                            <option value="today">Hoy</option>
                            <option value="week">Esta semana</option>
                            <option value="month">Este mes</option>
                        </select>
                    </div>
                </div>
                
                <div class="activity-stats">
                    <div class="stat-item">
                        <span class="stat-value">${allActivities.length}</span>
                        <span class="stat-label">Total Actividades</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${allActivities.filter(a => a.type === 'payment').length}</span>
                        <span class="stat-label">Pagos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${allActivities.filter(a => a.type === 'completion').length}</span>
                        <span class="stat-label">Completaciones</span>
                    </div>
                </div>
                
                <div class="full-activity-list" id="fullActivityList">
                    ${this.renderActivityList(allActivities)}
                </div>
            </div>
        `, true);
        
        // Add custom styling for the full activity modal
        modal.style.maxWidth = '800px';
        modal.style.width = '95%';
        
        // Add modal actions
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.exportActivityReport()">
                <i class="fas fa-download"></i> Exportar Reporte
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
        
        this.showNotification('success', 'Historial de actividad cargado exitosamente');
    }

    renderActivityList(activities) {
        if (activities.length === 0) {
            return `
                <div class="empty-activity-state">
                    <div class="empty-icon">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <h4>No hay actividades</h4>
                    <p>No se encontraron actividades para los filtros seleccionados.</p>
                </div>
            `;
        }
        
        return activities.map(activity => `
            <div class="activity-item enhanced" data-activity-id="${activity.id}" data-activity-type="${activity.type}">
                <div class="activity-icon">
                    <i class="fas fa-${activity.icon} ${activity.iconColor}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-main">
                        <p><strong>${activity.title}</strong> ${activity.description}</p>
                        <span class="activity-time">${activity.timeAgo}</span>
                    </div>
                    <div class="activity-actions">
                        <button class="btn btn-xs btn-outline" onclick="advancedGroupsSystem.viewActivityDetails('${activity.id}')">
                            <i class="fas fa-eye"></i> Detalles
                        </button>
                    </div>
                </div>
                <div class="activity-timestamp">
                    ${activity.timestamp.toLocaleDateString('es-HN', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>
        `).join('');
    }

    filterActivitiesByType(type) {
        console.log('🔍 Filtering activities by type:', type);
        const allActivities = this.generateRecentActivities();
        const filteredActivities = type === 'all' ? allActivities : allActivities.filter(a => a.type === type);
        
        const listContainer = document.getElementById('fullActivityList');
        if (listContainer) {
            listContainer.innerHTML = this.renderActivityList(filteredActivities);
        }
        
        this.showNotification('info', `Filtrado por: ${this.getActivityTypeLabel(type)}`);
    }

    filterActivitiesByPeriod(period) {
        console.log('📅 Filtering activities by period:', period);
        const allActivities = this.generateRecentActivities();
        const now = new Date();
        let filteredActivities = allActivities;
        
        switch(period) {
            case 'today':
                filteredActivities = allActivities.filter(a => 
                    a.timestamp.toDateString() === now.toDateString()
                );
                break;
            case 'week':
                const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                filteredActivities = allActivities.filter(a => a.timestamp >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
                filteredActivities = allActivities.filter(a => a.timestamp >= monthAgo);
                break;
        }
        
        const listContainer = document.getElementById('fullActivityList');
        if (listContainer) {
            listContainer.innerHTML = this.renderActivityList(filteredActivities);
        }
        
        this.showNotification('info', `Período: ${this.getPeriodLabel(period)}`);
    }

    getActivityTypeLabel(type) {
        const labels = {
            all: 'Todas las actividades',
            payment: 'Solo pagos',
            group: 'Solo grupos',
            completion: 'Solo completaciones',
            member: 'Solo miembros',
            system: 'Solo sistema'
        };
        return labels[type] || type;
    }

    getPeriodLabel(period) {
        const labels = {
            all: 'Todo el tiempo',
            today: 'Solo hoy',
            week: 'Esta semana',
            month: 'Este mes'
        };
        return labels[period] || period;
    }

    viewActivityDetails(activityId) {
        console.log('🔍 Viewing details for activity:', activityId);
        this.showNotification('info', 'Funcionalidad de detalles de actividad en desarrollo');
    }

    exportActivityReport() {
        console.log('📊 Exporting activity report...');
        this.showNotification('success', 'Reporte de actividad exportado exitosamente');
    }

    // ========================================
    // 🎯 HEADER FUNCTIONALITY
    // ========================================

    showQuickSearch() {
        console.log('🔍 [Enhanced] Opening quick search...');
        
        const overlay = document.getElementById('quickSearchOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            
            // Trigger animation
            setTimeout(() => {
                overlay.classList.add('active');
                // Focus on search input
                const searchInput = document.getElementById('quickSearchInput');
                if (searchInput) {
                    searchInput.focus();
                    this.setupQuickSearchInput(searchInput);
                }
            }, 10);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeQuickSearch();
                }
            });
            
            // Close on escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    this.closeQuickSearch();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }
    }
    
    closeQuickSearch() {
        console.log('🔍 [Enhanced] Closing quick search...');
        const overlay = document.getElementById('quickSearchOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }
    
    setupQuickSearchInput(input) {
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.performQuickSearch(query);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    this.executeSearch(query);
                }
            }
        });
    }
    
    performQuickSearch(query) {
        const resultsContainer = document.getElementById('quickSearchResults');
        if (!resultsContainer) return;
        
        if (!query) {
            resultsContainer.innerHTML = `
                <div class="search-suggestions">
                    <div class="suggestion-category">
                        <h4>Búsquedas rápidas</h4>
                        <div class="suggestion-item" onclick="advancedGroupsSystem.quickSearchAction('groups-active')">
                            <i class="fas fa-users"></i>
                            <span>Grupos activos</span>
                        </div>
                        <div class="suggestion-item" onclick="advancedGroupsSystem.quickSearchAction('tandas-pending')">
                            <i class="fas fa-clock"></i>
                            <span>Tandas pendientes</span>
                        </div>
                        <div class="suggestion-item" onclick="advancedGroupsSystem.quickSearchAction('payments-due')">
                            <i class="fas fa-credit-card"></i>
                            <span>Pagos vencidos</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Simulate search results
        const mockResults = this.getMockSearchResults(query);
        
        resultsContainer.innerHTML = `
            <div class="search-results-list">
                <div class="results-header">
                    <h4>Resultados para "${query}"</h4>
                    <span class="results-count">${mockResults.length} encontrados</span>
                </div>
                ${mockResults.map(result => `
                    <div class="search-result-item" onclick="advancedGroupsSystem.selectSearchResult('${result.id}', '${result.type}')">
                        <div class="result-icon">
                            <i class="fas fa-${result.icon}"></i>
                        </div>
                        <div class="result-content">
                            <div class="result-title">${result.title}</div>
                            <div class="result-description">${result.description}</div>
                        </div>
                        <div class="result-type">${result.type}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    quickSearchAction(action) {
        this.closeQuickSearch();
        switch (action) {
            case 'groups-active':
                this.switchTab('groups');
                this.showNotification('info', '📊 Mostrando grupos activos');
                break;
            case 'tandas-pending':
                this.switchTab('tandas');
                this.showNotification('info', '⏰ Mostrando tandas pendientes');
                break;
            case 'payments-due':
                this.switchTab('tandas');
                this.showNotification('warning', '💳 Mostrando pagos vencidos');
                break;
        }
    }
    
    getMockSearchResults(query) {
        const allItems = [
            { id: '1', type: 'grupo', title: 'Empresarios Unidos', description: '8/10 miembros - L. 800', icon: 'users' },
            { id: '2', type: 'tanda', title: 'Tanda Familiar 2024', description: 'Ciclo activo - Próximo pago en 3 días', icon: 'coins' },
            { id: '3', type: 'miembro', title: 'María González', description: 'Coordinadora - Confiabilidad 98%', icon: 'user' },
            { id: '4', type: 'grupo', title: 'Estudiantes UNAH', description: '12/15 miembros - L. 200', icon: 'users' },
            { id: '5', type: 'pago', title: 'Pago pendiente - Grupo Oficina', description: 'Vence en 2 días - L. 500', icon: 'credit-card' }
        ];
        
        return allItems.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    selectSearchResult(id, type) {
        this.closeQuickSearch();
        this.showNotification('info', `🔍 Navegando a ${type}: ${id}`);
        // Here you would implement navigation to the specific item
    }
    
    executeSearch(query) {
        this.closeQuickSearch();
        this.showNotification('info', `🔍 Ejecutando búsqueda: "${query}"`);
        // Here you would implement full search functionality
    }

    performQuickSearch(query) {
        console.log('🔍 Searching for:', query);
        const suggestions = document.getElementById('searchSuggestions');
        if (!suggestions) return;
        
        if (query.length < 2) {
            suggestions.innerHTML = '';
            return;
        }
        
        // Enhanced search with real data simulation
        const searchResults = this.getSearchResults(query);
        suggestions.innerHTML = searchResults.map(item => `
            <div class="suggestion-item" onclick="advancedGroupsSystem.selectSearchResult('${item.type}', '${item.id}')">
                <i class="fas fa-${item.icon}"></i>
                <div class="suggestion-content">
                    <span class="suggestion-title">${item.title}</span>
                    <span class="suggestion-desc">${item.description}</span>
                </div>
                <i class="fas fa-arrow-right suggestion-action"></i>
            </div>
        `).join('');
    }
    
    getSearchResults(query) {
        const mockData = [
            { id: '1', type: 'group', icon: 'users', title: `Cooperativa ${query}`, description: '12 miembros activos' },
            { id: '2', type: 'tanda', icon: 'sync-alt', title: `Tanda ${query}`, description: 'L. 1,500 - Mensual' },
            { id: '3', type: 'member', icon: 'user', title: `${query} Hernández`, description: 'Coordinador - Score 95%' },
            { id: '4', type: 'group', icon: 'users', title: `Grupo ${query} Norte`, description: '8 miembros - Activo' }
        ];
        return mockData.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }
    
    selectSearchResult(type, id) {
        console.log(`📍 Selected ${type} with ID: ${id}`);
        this.closeModal();
        this.showNotification('info', `Navegando a ${type} seleccionado...`);
        // Navigate based on type
        if (type === 'group') switchTab('groups');
        else if (type === 'tanda') switchTab('tandas');
    }

    toggleTheme() {
        console.log('🎨 [Enhanced] Toggling theme...');
        const isDarkMode = document.body.classList.toggle('dark-theme');
        
        // Update theme icon with smooth transition
        const themeBtn = document.querySelector('.header-action-btn i.fa-moon, .header-action-btn i.fa-sun');
        if (themeBtn) {
            themeBtn.style.transform = 'rotate(180deg) scale(0.8)';
            setTimeout(() => {
                themeBtn.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
                themeBtn.style.transform = 'rotate(0deg) scale(1)';
            }, 150);
        }
        
        // Show theme indicator
        this.showThemeIndicator(isDarkMode ? 'Tema oscuro activado' : 'Tema claro activado');
        
        // Update CSS variables for theme
        const root = document.documentElement;
        if (isDarkMode) {
            root.style.setProperty('--bg-primary', '#0a0a0a');
            root.style.setProperty('--bg-secondary', '#1a1a1a');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
        } else {
            root.style.setProperty('--bg-primary', '#0f172a');
            root.style.setProperty('--bg-secondary', '#1e293b');
            root.style.setProperty('--text-primary', '#f8fafc');
            root.style.setProperty('--text-secondary', 'rgba(248, 250, 252, 0.7)');
        }
        
        // Save preference in user data
        if (this.currentUser && this.currentUser.preferences) {
            this.currentUser.preferences.theme = isDarkMode ? 'dark' : 'light';
            this.saveUserData(this.currentUser);
        }
        
        // Also save in localStorage for immediate access
        localStorage.setItem('theme-preference', isDarkMode ? 'dark' : 'light');
        
        this.showNotification('success', `Tema ${isDarkMode ? 'oscuro' : 'claro'} activado`);
    }
    
    showThemeIndicator(message) {
        const indicator = document.getElementById('themeToggleIndicator');
        const indicatorText = document.getElementById('themeIndicatorText');
        
        if (indicator && indicatorText) {
            indicatorText.textContent = message;
            indicator.style.display = 'block';
            indicator.classList.add('show');
            
            setTimeout(() => {
                indicator.classList.remove('show');
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }, 2000);
        }
    }

    showUserMenu() {
        console.log('👤 [Enhanced] Opening user menu...');
        
        const overlay = document.getElementById('userMenuOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            // Trigger animation
            setTimeout(() => {
                overlay.classList.add('active');
            }, 10);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeUserMenu();
                }
            });
            
            // Close on escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    this.closeUserMenu();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }
    }
    
    closeUserMenu() {
        console.log('👤 [Enhanced] Closing user menu...');
        const overlay = document.getElementById('userMenuOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }
    
    // Enhanced User Menu Actions
    openProfile() {
        console.log('👤 Opening profile section...');
        this.closeUserMenu();
        this.switchTab('profile');
    }
    
    openWalletSettings() {
        console.log('💰 Opening wallet section...');
        this.closeUserMenu();
        this.switchTab('wallet');
    }
    
    openVerification() {
        console.log('✅ Opening KYC verification section...');
        this.closeUserMenu();
        // KYC verification is integrated in profile section
        this.switchTab('profile');
        setTimeout(() => {
            const kycCard = document.querySelector('.profile-card:last-child');
            if (kycCard) kycCard.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
    
    openNotificationSettings() {
        console.log('🔔 Opening settings section...');
        this.closeUserMenu();
        this.switchTab('settings');
    }
    
    openSecuritySettings() {
        console.log('🔒 Opening security settings...');
        this.closeUserMenu();
        this.switchTab('settings');
        setTimeout(() => {
            const securityCard = document.querySelector('.settings-card:nth-child(2)');
            if (securityCard) securityCard.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
    
    openPrivacySettings() {
        console.log('🛡️ Opening privacy settings...');
        this.closeUserMenu();
        this.switchTab('settings');
        setTimeout(() => {
            const securityCard = document.querySelector('.settings-card:nth-child(2)');
            if (securityCard) securityCard.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
    
    openHelp() {
        console.log('❓ Opening help center...');
        this.closeUserMenu();
        this.switchTab('help');
    }
    
    openFeedback() {
        console.log('💬 Opening feedback section...');
        this.closeUserMenu();
        this.switchTab('help');
        setTimeout(() => {
            const feedbackCard = document.querySelector('.help-card.feedback-card');
            if (feedbackCard) feedbackCard.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
    
    // Feedback function
    sendFeedback() {
        const feedbackForm = document.getElementById('feedbackForm');
        if (!feedbackForm) {
            this.showNotification('error', 'Formulario de feedback no encontrado');
            return;
        }
        
        const formData = new FormData(feedbackForm);
        const feedbackData = {
            type: formData.get('feedback-type') || 'suggestion',
            subject: feedbackForm.querySelector('input[placeholder*="brevemente"]')?.value || 'Sin asunto',
            message: feedbackForm.querySelector('textarea')?.value || 'Sin mensaje',
            timestamp: new Date().toISOString(),
            userId: this.currentUser?.id || 'anonymous'
        };
        
        // Simulate API call
        this.showNotification('info', '📤 Enviando feedback...');
        
        setTimeout(() => {
            this.showNotification('success', '✅ Feedback enviado correctamente. ¡Gracias por tu comentario!');
            
            // Clear form
            if (feedbackForm.querySelector('input')) feedbackForm.querySelector('input').value = '';
            if (feedbackForm.querySelector('textarea')) feedbackForm.querySelector('textarea').value = '';
            if (feedbackForm.querySelector('select')) feedbackForm.querySelector('select').selectedIndex = 0;
            
            // Add activity record
            this.addActivity('feedback', 'Feedback enviado', 'just-now', { type: feedbackData.type, subject: feedbackData.subject });
        }, 1500);
    }
    
    logout() {
        this.closeUserMenu();
        const confirmLogout = confirm('¿Estás seguro de que quieres cerrar sesión?');
        if (confirmLogout) {
            this.showNotification('info', '👋 Cerrando sesión...');
            
            // Only clear user-specific data, preserve groups and system data
            const dataToPreserve = {
                groups: localStorage.getItem('latanda_groups_data'),
                tandas: localStorage.getItem('latanda_tandas_data'),
                systemSettings: localStorage.getItem('latanda_system_settings'),
                theme: localStorage.getItem('latanda_theme')
            };
            
            // Clear all localStorage
            localStorage.clear();
            
            // Restore preserved data
            Object.entries(dataToPreserve).forEach(([key, value]) => {
                if (value) {
                    localStorage.setItem(`latanda_${key === 'groups' ? 'groups_data' : 
                                                   key === 'tandas' ? 'tandas_data' :
                                                   key === 'systemSettings' ? 'system_settings' :
                                                   key === 'theme' ? 'theme' : key}`, value);
                }
            });
            
            setTimeout(() => {
                window.location.href = 'home-dashboard.html';
            }, 1500);
        }
    }
    
    // ============================================
    // COMPREHENSIVE MODAL FUNCTIONALITY
    // ============================================
    
    showModal(modalId) {
        console.log('🎯 [MODAL DEBUG] Attempting to show modal:', modalId);
        const modal = document.getElementById(modalId);
        
        if (!modal) {
            console.error('❌ [MODAL ERROR] Modal element not found:', modalId);
            console.log('🔍 [MODAL DEBUG] Available modals:', Array.from(document.querySelectorAll('[id$="Modal"]')).map(m => m.id));
            return;
        }
        
        console.log('✅ [MODAL DEBUG] Modal element found:', modal);
        console.log('📏 [MODAL DEBUG] Modal current styles:', {
            display: modal.style.display,
            visibility: modal.style.visibility,
            opacity: modal.style.opacity
        });
        
        // Ensure modal is visible and properly positioned
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.zIndex = '10000';
        modal.style.opacity = '0';
        modal.style.visibility = 'visible';
        
        console.log('⚙️ [MODAL DEBUG] Modal styles applied, forcing reflow...');
        
        // Force reflow
        modal.offsetHeight;
        
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.classList.add('active');
            console.log('✅ [MODAL DEBUG] Modal should now be visible:', modalId);
            console.log('📊 [MODAL DEBUG] Final modal state:', {
                display: modal.style.display,
                visibility: modal.style.visibility,
                opacity: modal.style.opacity,
                hasActiveClass: modal.classList.contains('active'),
                computedDisplay: window.getComputedStyle(modal).display,
                computedVisibility: window.getComputedStyle(modal).visibility,
                computedOpacity: window.getComputedStyle(modal).opacity
            });
            
            // Scroll to top of modal content
            const modalContainer = modal.querySelector('.modal-container');
            if (modalContainer) {
                modalContainer.scrollTop = 0;
                console.log('📜 [MODAL DEBUG] Modal container scrolled to top');
            }
        }, 10);
        
        // Close on ESC key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modalId);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modalId);
            }
        });
    }
    
    closeModal(modalId) {
        console.log('🚫 Closing modal:', modalId);
        
        // If no specific modal ID provided, close all modals
        if (!modalId) {
            const allModals = document.querySelectorAll('.modal-overlay');
            allModals.forEach(modal => {
                modal.classList.remove('active');
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.style.display = 'none';
                    modal.style.visibility = 'hidden';
                }, 300);
            });
            return;
        }
        
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.visibility = 'hidden';
                console.log('✅ Modal closed:', modalId);
            }, 300);
        } else {
            console.error('❌ Modal not found for closing:', modalId);
        }
    }
    
    initializeProfileForm() {
        console.log('📋 Profile form initialized');
    }
    
    initializeWalletModal() {
        console.log('💰 Wallet modal initialized');
    }
    
    switchWalletTab(tabName) {
        console.log('💰 Switching wallet tab:', tabName);
    }
    
    switchSettingsTab(tabName) {
        console.log('⚙️ Switching settings tab:', tabName);
    }
    
    saveSettings() {
        console.log('💾 Settings saved');
        this.showNotification('success', '✅ Configuración guardada exitosamente');
        this.closeModal('settingsModal');
    }
    
    initializeHelpCenter() {
        console.log('❓ Help center initialized');
    }
    
    initializeFeedbackForm() {
        console.log('💬 Feedback form initialized');
    }
    
    showNotificationSettings() {
        const modal = this.createModal('notification-settings', '🔔 Configuración de Notificaciones', `
            <div class="settings-container">
                <div class="settings-section">
                    <h4>Notificaciones Push</h4>
                    <div class="setting-item">
                        <span>Pagos pendientes</span>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span>Nuevos grupos disponibles</span>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span>Invitaciones a grupos</span>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>Frecuencia de Notificaciones</h4>
                    <select class="form-control">
                        <option>Inmediata</option>
                        <option>Cada hora</option>
                        <option>Diaria</option>
                        <option>Semanal</option>
                    </select>
                </div>
            </div>
        `);
        modal.style.maxWidth = '500px';
    }
    
    showSecuritySettings() {
        const modal = this.createModal('security-settings', '🔒 Configuración de Seguridad', `
            <div class="settings-container">
                <div class="settings-section">
                    <h4>Autenticación de Dos Factores</h4>
                    <div class="setting-item">
                        <span>2FA habilitado</span>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>Cambiar Contraseña</h4>
                    <input type="password" class="form-control" placeholder="Contraseña actual">
                    <input type="password" class="form-control" placeholder="Nueva contraseña">
                    <input type="password" class="form-control" placeholder="Confirmar nueva contraseña">
                </div>
            </div>
        `);
        modal.style.maxWidth = '500px';
    }
    
    showPrivacySettings() {
        const modal = this.createModal('privacy-settings', '🔐 Configuración de Privacidad', `
            <div class="settings-container">
                <div class="settings-section">
                    <h4>Visibilidad del Perfil</h4>
                    <div class="setting-item">
                        <span>Perfil público</span>
                        <label class="toggle-switch">
                            <input type="checkbox">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span>Mostrar estadísticas</span>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `);
        modal.style.maxWidth = '500px';
    }

    editProfile() {
        console.log('🔧 Opening Edit Profile modal');
        this.closeUserMenu();
        this.showModal('editProfileModal');
    }
    
    saveProfile() {
        const profileInputs = document.querySelectorAll('.profile-form input');
        const updatedUser = { ...this.currentUser };
        
        profileInputs.forEach(input => {
            const fieldName = input.getAttribute('name') || input.id;
            if (input.value.trim()) {
                updatedUser[fieldName] = input.value.trim();
            }
        });
        
        this.saveUserData(updatedUser);
        this.updateDashboard();
        
        // Add activity record
        this.addActivity('profile', 'Perfil actualizado', 'just-now');
        
        this.closeModal();
        this.showNotification('success', 'Perfil actualizado exitosamente');
    }

    // Missing sharing functions
    shareViaTelegram(groupId, groupName) {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`¡Únete al grupo "${groupName}" en La Tanda Honduras!`)}`;
        window.open(telegramUrl, '_blank');
        this.showNotification('info', '📱 Abriendo Telegram...');
    }

    shareOnSocialMedia(platform, groupId, groupName) {
        let shareUrl = '';
        const currentUrl = encodeURIComponent(window.location.href);
        const shareText = encodeURIComponent(`¡Únete al grupo "${groupName}" en La Tanda Honduras!`);
        
        switch(platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${currentUrl}&text=${shareText}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`;
                break;
            case 'instagram':
                // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
                this.copyToClipboard(window.location.href);
                this.showNotification('info', '📱 Enlace copiado. Pégalo en Instagram Stories');
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
            this.showNotification('info', `📱 Compartiendo en ${platform}...`);
        }
    }
    
    // ================================
    // ACTIVITY TRACKING SYSTEM
    // ================================
    
    addActivity(type, description, timestamp = null, details = {}) {
        const activity = {
            id: Date.now(),
            type,
            description,
            timestamp: timestamp || new Date().toISOString(),
            details,
            read: false
        };
        
        this.activities.unshift(activity);
        
        // Keep only last 50 activities
        if (this.activities.length > 50) {
            this.activities = this.activities.slice(0, 50);
        }
        
        this.saveActivitiesData(this.activities);
        
        // Update activity display if on dashboard
        if (this.currentTab === 'dashboard') {
            this.loadRecentActivity();
        }
        
        console.log('📝 Nueva actividad registrada:', activity);
    }
    
    addNotification(type, title, message, priority = 'normal') {
        const notification = {
            id: Date.now(),
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            priority,
            read: false
        };
        
        this.notifications.unshift(notification);
        this.saveNotificationsData(this.notifications);
        
        // Update notification badge
        this.updateNotificationBadge();
        
        console.log('🔔 Nueva notificación:', notification);
        return notification;
    }
    
    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-dot');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }
    
    markNotificationAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotificationsData(this.notifications);
            this.updateNotificationBadge();
        }
    }
    
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotificationsData(this.notifications);
        this.updateNotificationBadge();
        
        // Refresh notification center if open
        const notificationsList = document.getElementById('notificationsList');
        if (notificationsList) {
            this.showNotifications();
        }
        
        this.showNotification('success', 'Todas las notificaciones marcadas como leídas');
    }

    viewNotificationSettings() {
        this.closeModal();
        const modal = this.createModal('notification-settings', '🔔 Configuración de Notificaciones', `
            <div class="settings-container">
                <div class="settings-section">
                    <h4>Notificaciones Push</h4>
                    <div class="setting-item">
                        <span>Pagos pendientes</span>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span>Nuevos miembros</span>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span>Reuniones programadas</span>
                        <label class="toggle-switch">
                            <input type="checkbox">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>Notificaciones por Email</h4>
                    <div class="setting-item">
                        <span>Resumen semanal</span>
                        <label class="toggle-switch">
                            <input type="checkbox">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span>Alertas de seguridad</span>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `);
    }

    viewSecuritySettings() {
        this.closeModal();
        const modal = this.createModal('security-settings', '🛡️ Seguridad y Privacidad', `
            <div class="security-container">
                <div class="security-section">
                    <h4>Autenticación</h4>
                    <button class="security-btn" onclick="advancedGroupsSystem.changePassword()">
                        <i class="fas fa-key"></i> Cambiar Contraseña
                    </button>
                    <button class="security-btn" onclick="advancedGroupsSystem.setup2FA()">
                        <i class="fas fa-mobile-alt"></i> Configurar 2FA
                    </button>
                </div>
                <div class="security-section">
                    <h4>Privacidad</h4>
                    <div class="setting-item">
                        <span>Perfil público</span>
                        <label class="toggle-switch">
                            <input type="checkbox">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span>Mostrar actividad</span>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="security-section">
                    <h4>Sesiones Activas</h4>
                    <div class="session-item">
                        <i class="fas fa-desktop"></i>
                        <span>Navegador actual</span>
                        <small>Activa ahora</small>
                    </div>
                </div>
            </div>
        `);
    }
    
    changePassword() {
        this.showNotification('info', 'Función de cambio de contraseña disponible próximamente');
    }
    
    setup2FA() {
        this.showNotification('info', 'Configuración 2FA disponible próximamente');
    }

    viewHelpCenter() {
        this.closeModal();
        const modal = this.createModal('help-center', '❓ Centro de Ayuda', `
            <div class="help-container">
                <div class="help-categories">
                    <div class="help-category" onclick="advancedGroupsSystem.showFAQ()">
                        <i class="fas fa-question-circle"></i>
                        <h4>Preguntas Frecuentes</h4>
                        <p>Encuentra respuestas a las dudas más comunes</p>
                    </div>
                    <div class="help-category" onclick="advancedGroupsSystem.showUserGuide()">
                        <i class="fas fa-book"></i>
                        <h4>Guía de Usuario</h4>
                        <p>Aprende a usar todas las funciones</p>
                    </div>
                    <div class="help-category" onclick="advancedGroupsSystem.contactSupport()">
                        <i class="fas fa-headset"></i>
                        <h4>Contactar Soporte</h4>
                        <p>Obtén ayuda personalizada</p>
                    </div>
                    <div class="help-category" onclick="advancedGroupsSystem.reportBug()">
                        <i class="fas fa-bug"></i>
                        <h4>Reportar Problema</h4>
                        <p>Ayúdanos a mejorar la plataforma</p>
                    </div>
                </div>
            </div>
        `, true);
    }
    
    showFAQ() {
        this.showNotification('info', 'Sección de preguntas frecuentes próximamente');
    }
    
    showUserGuide() {
        this.showNotification('info', 'Guía de usuario disponible próximamente');
    }
    
    contactSupport() {
        this.showNotification('info', 'Soporte técnico: soporte@latanda.online');
    }
    
    reportBug() {
        this.showNotification('info', 'Función de reporte de errores próximamente');
    }

    logout() {
        this.closeModal();
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            // Only clear user-specific data, preserve groups and system data
            const dataToPreserve = {
                groups: localStorage.getItem('latanda_groups_data'),
                tandas: localStorage.getItem('latanda_tandas_data'),
                systemSettings: localStorage.getItem('latanda_system_settings'),
                theme: localStorage.getItem('latanda_theme')
            };
            
            // Clear all localStorage
            localStorage.clear();
            
            // Restore preserved data
            Object.entries(dataToPreserve).forEach(([key, value]) => {
                if (value) {
                    localStorage.setItem(`latanda_${key === 'groups' ? 'groups_data' : 
                                                   key === 'tandas' ? 'tandas_data' :
                                                   key === 'systemSettings' ? 'system_settings' :
                                                   key === 'theme' ? 'theme' : key}`, value);
                }
            });
            
            this.showNotification('success', 'Sesión cerrada exitosamente');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    }

    // ========================================
    // 🔔 ENHANCED NOTIFICATIONS SYSTEM
    // ========================================

    showNotifications() {
        console.log('🔔 [Enhanced] Opening notifications center...');
        
        const overlay = document.getElementById('notificationsPanel');
        if (overlay) {
            overlay.style.display = 'flex';
            
            // Load notifications
            this.loadNotificationsList();
            
            // Setup filter buttons
            this.setupNotificationFilters();
            
            // Trigger animation
            setTimeout(() => {
                overlay.classList.add('active');
            }, 10);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeNotifications();
                }
            });
            
            // Close on escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    this.closeNotifications();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }
    }
    
    closeNotifications() {
        console.log('🔔 [Enhanced] Closing notifications center...');
        const overlay = document.getElementById('notificationsPanel');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }
    
    loadNotificationsList() {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;
        
        const notifications = this.getEnhancedNotifications();
        
        notificationsList.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? '<button class="btn-mark-read" onclick="advancedGroupsSystem.markAsRead(\'' + notification.id + '\')"><i class="fas fa-check"></i></button>' : ''}
                    <button class="btn-delete" onclick="advancedGroupsSystem.deleteNotification(\'' + notification.id + '\')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }
    
    setupNotificationFilters() {
        const filters = document.querySelectorAll('.notification-filter');
        filters.forEach(filter => {
            filter.addEventListener('click', () => {
                // Remove active from all filters
                filters.forEach(f => f.classList.remove('active'));
                // Add active to clicked filter
                filter.classList.add('active');
                // Apply filter
                this.filterNotifications(filter.dataset.filter);
            });
        });
    }
    
    filterNotifications(type) {
        const notifications = document.querySelectorAll('.notification-item');
        notifications.forEach(item => {
            if (type === 'all') {
                item.style.display = 'flex';
            } else {
                item.style.display = item.classList.contains(type) ? 'flex' : 'none';
            }
        });
    }
    
    markAsRead(notificationId) {
        const item = document.querySelector(`[data-id="${notificationId}"]`);
        if (item) {
            item.classList.remove('unread');
            item.classList.add('read');
            const markButton = item.querySelector('.btn-mark-read');
            if (markButton) markButton.remove();
        }
        this.showNotification('success', 'Notificación marcada como leída');
    }
    
    markAllAsRead() {
        const unreadItems = document.querySelectorAll('.notification-item.unread');
        unreadItems.forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            const markButton = item.querySelector('.btn-mark-read');
            if (markButton) markButton.remove();
        });
        this.showNotification('success', 'Todas las notificaciones marcadas como leídas');
    }
    
    deleteNotification(notificationId) {
        const item = document.querySelector(`[data-id="${notificationId}"]`);
        if (item) {
            item.style.opacity = '0';
            item.style.transform = 'translateX(100%)';
            setTimeout(() => {
                item.remove();
            }, 300);
        }
    }

    getEnhancedNotifications() {
        return [
            {
                id: 'payment_reminder_1',
                type: 'payment',
                category: 'payments',
                priority: 'high',
                title: 'Pago Pendiente',
                message: 'Tienes un pago de L. 1,500 pendiente en "Tanda Profesionales"',
                time: 'Hace 2 horas',
                isRead: false
            },
            {
                id: 'group_invitation_1',
                type: 'invitation',
                category: 'groups',
                priority: 'medium',
                title: 'Nueva Invitación',
                message: 'Te han invitado a unirte al grupo "Cooperativa Norte"',
                time: 'Hace 4 horas',
                isRead: false
            },
            {
                id: 'system_update_1',
                type: 'system',
                category: 'system',
                priority: 'low',
                title: 'Actualización del Sistema',
                message: 'Nueva versión disponible con mejoras de seguridad',
                time: 'Hace 1 día',
                isRead: true
            },
            {
                id: 'tanda_completed_1',
                type: 'completion',
                category: 'urgent',
                priority: 'high',
                title: 'Tanda Completada',
                message: 'La tanda "Ahorro Familiar" ha sido completada exitosamente',
                time: 'Hace 2 días',
                isRead: false
            }
        ];
    }

    renderNotificationsList(notifications) {
        if (notifications.length === 0) {
            return `
                <div class="empty-notifications">
                    <div class="empty-icon">
                        <i class="fas fa-bell-slash"></i>
                    </div>
                    <h4>No hay notificaciones</h4>
                    <p>Estás al día con todas tus actividades</p>
                </div>
            `;
        }

        return notifications.map(notification => `
            <div class="notification-item ${notification.type} ${notification.isRead ? 'read' : 'unread'}" data-category="${notification.category}">
                <div class="notification-priority ${notification.priority}"></div>
                <div class="notification-icon">
                    <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h4>${notification.title}</h4>
                        <span class="notification-time">${notification.time}</span>
                    </div>
                    <p>${notification.message}</p>
                </div>
                <div class="notification-actions">
                    <button class="btn-notification-action" onclick="advancedGroupsSystem.handleNotification('${notification.id}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-notification-dismiss" onclick="advancedGroupsSystem.dismissNotification('${notification.id}')" title="Descartar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterNotifications(category) {
        document.querySelectorAll('.notification-filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${category}"]`).classList.add('active');
        
        const allNotifications = document.querySelectorAll('.notification-item');
        allNotifications.forEach(item => {
            item.style.display = (category === 'all' || item.dataset.category === category) ? 'flex' : 'none';
        });
    }

    handleNotification(notificationId) {
        console.log('👆 Handling notification:', notificationId);
        this.closeModal();
        this.showNotification('info', 'Notificación procesada');
    }

    dismissNotification(notificationId) {
        const notificationElement = document.querySelector(`[onclick*="${notificationId}"]`).closest('.notification-item');
        if (notificationElement) {
            notificationElement.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notificationElement.remove(), 300);
        }
    }

    markAllAsRead() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
        });
        document.querySelector('.notification-dot').style.display = 'none';
        this.showNotification('success', 'Todas las notificaciones marcadas como leídas');
    }

    configureNotifications() {
        this.closeModal();
        this.showNotification('info', 'Configuración de notificaciones en desarrollo');
    }

    exportNotifications() {
        this.showNotification('success', 'Reporte de notificaciones exportado');
    }

    updateFinancialSummary() {
        const financialSummary = {
            totalInvested: 15600,
            totalReturns: 18200,
            pendingPayments: 3000,
            nextPayout: { amount: 1500, date: '15 Feb 2025' }
        };

        // Actualizar resumen financiero si existe el contenedor
        const summaryContainer = document.querySelector('.financial-summary-container');
        if (summaryContainer && !summaryContainer.innerHTML.trim()) {
            summaryContainer.innerHTML = `
                <h4><i class="fas fa-chart-pie"></i> Resumen Financiero</h4>
                <div class="financial-grid">
                    <div class="financial-item">
                        <div class="financial-label">Total Invertido</div>
                        <div class="financial-value">L. ${financialSummary.totalInvested.toLocaleString()}</div>
                    </div>
                    <div class="financial-item">
                        <div class="financial-label">Retornos</div>
                        <div class="financial-value positive">L. ${financialSummary.totalReturns.toLocaleString()}</div>
                    </div>
                    <div class="financial-item">
                        <div class="financial-label">Próximo Pago</div>
                        <div class="financial-value">L. ${financialSummary.nextPayout.amount.toLocaleString()}</div>
                        <div class="financial-date">${financialSummary.nextPayout.date}</div>
                    </div>
                </div>
            `;
        }
    }

    calculateMonthlyGrowth() {
        // Simulación de cálculo de crecimiento mensual
        return 12.5; // 12.5% de crecimiento
    }

    getUpcomingPayments() {
        // Pagos próximos del usuario
        return this.tandas.filter(tanda => {
            const nextPaymentDate = new Date(tanda.nextPayment);
            const today = new Date();
            const diffDays = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 7 && diffDays >= 0;
        });
    }

    calculateAvgTandaPerformance() {
        if (!this.tandas.length) return 0;
        const totalPerformance = this.tandas.reduce((sum, tanda) => sum + (tanda.performance || 85), 0);
        return Math.round(totalPerformance / this.tandas.length);
    }

    getPendingNotifications() {
        return [
            { type: 'payment', message: 'Pago pendiente en Tanda Profesionales' },
            { type: 'invitation', message: 'Invitación para unirse a Cooperativa Norte' },
            { type: 'reminder', message: 'Reunión grupal mañana a las 7 PM' }
        ];
    }
    
    loadRecentActivity() {
        const activities = [
            {
                icon: 'fas fa-user-plus',
                iconClass: 'text-tanda-cyan',
                text: '<strong>Nuevo miembro</strong> se unió al grupo "Cooperativa Familiar"',
                time: 'Hace 2 horas'
            },
            {
                icon: 'fas fa-money-bill-wave',
                iconClass: 'text-green-400',
                text: '<strong>Pago recibido</strong> de L. 1,500 en "Tanda Profesionales"',
                time: 'Hace 4 horas'
            },
            {
                icon: 'fas fa-trophy',
                iconClass: 'text-yellow-400',
                text: '<strong>Tanda completada</strong> exitosamente en "Grupo Comunitario"',
                time: 'Hace 1 día'
            }
        ];
        
        const activityList = document.querySelector('.activity-list');
        if (activityList) {
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${activity.icon} ${activity.iconClass}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${activity.text}</p>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            `).join('');
        }
    }
    
    async loadGroupsContent() {
        const groupsList = document.getElementById('groupsList');
        if (!groupsList) return;
        
        console.log('🔍 Loading groups content. Total groups:', this.groups.length);
        console.log('🔍 Groups data:', this.groups);
        
        if (this.groups.length === 0) {
            groupsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No tienes grupos activos</h3>
                    <p>Crea tu primer grupo o únete a uno existente para comenzar a ahorrar</p>
                    <div class="empty-actions">
                        <button class="btn btn-primary" onclick="advancedGroupsSystem.switchTab('create')">
                            <i class="fas fa-plus"></i>
                            Crear Mi Primer Grupo
                        </button>
                        <button class="btn btn-secondary" onclick="advancedGroupsSystem.switchTab('matching')">
                            <i class="fas fa-search"></i>
                            Buscar Grupos
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Filtrar grupos si hay filtros activos
        const filteredGroups = this.getFilteredGroups();
        
        console.log('🔍 Filtered groups:', filteredGroups);
        console.log('🔍 Filtered groups count:', filteredGroups.length);
        
        groupsList.innerHTML = filteredGroups.map(group => `
            <div class="group-card enhanced" data-group-id="${group.id}">
                <div class="group-card-content">
                    <div class="group-card-header">
                    <div class="group-avatar">
                        <span class="avatar-emoji">${group.avatar || '👥'}</span>
                        ${group.isOwner ? '<div class="owner-badge"><i class="fas fa-crown"></i></div>' : ''}
                    </div>
                    
                    <div class="group-info-section">
                        <div class="group-title-row">
                            <h3 class="group-name">${group.name || 'Grupo Sin Nombre'}</h3>
                            <div class="group-status status-${group.status || 'active'}">
                                <span class="status-dot"></span>
                                ${this.getStatusLabel(group.status || 'active')}
                            </div>
                        </div>
                        <p class="group-description">${group.description || 'Sin descripción'}</p>
                        <div class="group-meta">
                            <span class="group-type"><i class="fas fa-tag"></i> ${this.getGroupTypeLabel(group.type || 'familiar')}</span>
                            <span class="group-location"><i class="fas fa-map-marker-alt"></i> ${group.location || 'Ubicación no especificada'}</span>
                            <span class="group-frequency"><i class="fas fa-clock"></i> ${this.getFrequencyLabel(group.frequency || 'monthly')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="group-stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${Array.isArray(group.members) ? group.members.length : (group.members || 0)}/${group.maxMembers || 10}</div>
                            <div class="stat-label">Miembros</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">L. ${(group.contribution || 0).toLocaleString()}</div>
                            <div class="stat-label">Contribución</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">L. ${(group.totalSavings || 0).toLocaleString()}</div>
                            <div class="stat-label">Total Ahorrado</div>
                        </div>
                        ${group.performance > 0 ? `
                        <div class="stat-item">
                            <div class="stat-value">${group.performance}%</div>
                            <div class="stat-label">Rendimiento</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="group-progress-section">
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${((Array.isArray(group.members) ? group.members.length : (group.members || 0)) / (group.maxMembers || 10)) * 100}%"></div>
                            </div>
                            <span class="progress-text">${Math.round(((Array.isArray(group.members) ? group.members.length : (group.members || 0)) / (group.maxMembers || 10)) * 100)}% Completo</span>
                        </div>
                        ${group.trustScore > 0 ? `
                        <div class="trust-score-display">
                            <i class="fas fa-shield-alt"></i>
                            <span>${group.trustScore}% Confianza</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${group.nextMeeting ? `
                    <div class="next-meeting-card">
                        <div class="meeting-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="meeting-details">
                            <span class="meeting-label">Próxima reunión</span>
                            <span class="meeting-date">${this.formatDate(group.nextMeeting)}</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="group-tags-section">
                        ${group.tags && group.tags.length ? group.tags.map(tag => `<span class="tag-item">#${tag}</span>`).join('') : '<span class="tag-item">#general</span>'}
                    </div>
                </div>
                
                <div class="group-card-footer">
                    <div class="group-actions-footer">
                        <div class="button-stack">
                            <button class="btn btn-primary btn-sm btn-icon-only" onclick="advancedGroupsSystem.viewGroupDetails('${group.id}')" title="Ver Detalles del Grupo">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${group.isAdmin ? `
                            <button class="btn btn-secondary btn-sm btn-icon-only" onclick="advancedGroupsSystem.manageGroup('${group.id}')" title="Administrar Grupo">
                                <i class="fas fa-cog"></i>
                            </button>
                            ` : ''}
                            <button class="btn btn-success btn-sm btn-icon-only" onclick="advancedGroupsSystem.shareGroup('${group.id}')" title="Compartir Grupo">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    <div class="secondary-actions">
                        <div class="dropdown">
                            <button class="btn btn-ghost btn-sm dropdown-toggle" onclick="advancedGroupsSystem.toggleGroupActions('${group.id}')">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu" id="actions-${group.id}">
                                <a href="#" onclick="advancedGroupsSystem.viewGroupTandasFromGroup('${group.id}')">
                                    <i class="fas fa-sync-alt"></i> Ver Tandas (${group.activeTandas || 2})
                                </a>
                                <a href="#" onclick="advancedGroupsSystem.exportGroupData('${group.id}')">
                                    <i class="fas fa-download"></i> Exportar Datos del Grupo
                                </a>
                                ${group.status === 'active' ? `
                                <a href="#" onclick="advancedGroupsSystem.leaveGroup('${group.id}')" class="danger">
                                    <i class="fas fa-sign-out-alt"></i> Salir del Grupo
                                </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Initialize group interactions after content is loaded
        setTimeout(() => {
            if (typeof initializeGroupFilters === 'function') initializeGroupFilters();
            if (typeof initializeGroupSearch === 'function') initializeGroupSearch();
            if (typeof initializeGroupSort === 'function') initializeGroupSort();
            if (typeof updateFilterCounts === 'function') updateFilterCounts();
            console.log('✅ Group interactions initialized');
        }, 100);
    }

    // ========================================
    // 🔧 FUNCIONES AUXILIARES PARA GRUPOS
    // ========================================

    addGroupsControls() {
        const groupsSection = document.getElementById('groups');
        if (!groupsSection) return;
        
        const existingControls = groupsSection.querySelector('.groups-controls');
        if (existingControls) return; // Ya existen los controles
        
        const controlsHTML = `
            <div class="groups-controls">
                <div class="search-filters">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="groupsSearch" placeholder="Buscar grupos..." 
                               onkeyup="advancedGroupsSystem.filterGroups()">
                    </div>
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-filter="all" onclick="advancedGroupsSystem.filterGroupsByStatus('all')">
                            Todos
                        </button>
                        <button class="filter-btn" data-filter="active" onclick="advancedGroupsSystem.filterGroupsByStatus('active')">
                            Activos
                        </button>
                        <button class="filter-btn" data-filter="recruiting" onclick="advancedGroupsSystem.filterGroupsByStatus('recruiting')">
                            Reclutando
                        </button>
                        <button class="filter-btn" data-filter="completed" onclick="advancedGroupsSystem.filterGroupsByStatus('completed')">
                            Completados
                        </button>
                    </div>
                </div>
                <div class="view-options">
                    <button class="view-btn active" data-view="grid" onclick="advancedGroupsSystem.setGroupsView('grid')">
                        <i class="fas fa-th"></i>
                    </button>
                    <button class="view-btn" data-view="list" onclick="advancedGroupsSystem.setGroupsView('list')">
                        <i class="fas fa-list"></i>
                    </button>
                </div>
            </div>
        `;
        
        const sectionHeader = groupsSection.querySelector('.section-header');
        if (sectionHeader) {
            sectionHeader.insertAdjacentHTML('afterend', controlsHTML);
        }
    }

    getFilteredGroups() {
        let filtered = [...this.groups];
        
        // Filtrar por búsqueda
        const searchTerm = document.getElementById('groupsSearch')?.value?.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(group => 
                group.name.toLowerCase().includes(searchTerm) ||
                group.description.toLowerCase().includes(searchTerm) ||
                group.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        // Filtrar por estado
        const activeFilter = document.querySelector('.filter-tab.active')?.getAttribute('data-filter');
        if (activeFilter && activeFilter !== 'all') {
            filtered = filtered.filter(group => group.status === activeFilter);
        }
        
        return filtered;
    }

    getFrequencyLabel(frequency) {
        const labels = {
            'weekly': 'Semanal',
            'bi-weekly': 'Quincenal', 
            'monthly': 'Mensual',
            'quarterly': 'Trimestral'
        };
        return labels[frequency] || frequency;
    }

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('es-HN', options);
    }

    // ========================================
    // 🎯 FUNCIONES INTERACTIVAS DE GRUPOS
    // ========================================

    filterGroups() {
        this.loadGroupsContent();
    }

    filterGroupsByStatus(status) {
        // Actualizar botón activo
        document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.filter-tab[data-filter="${status}"]`).classList.add('active');
        
        this.loadGroupsContent();
    }

    setGroupsView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        const groupsList = document.getElementById('groupsList');
        if (groupsList) {
            groupsList.className = view === 'list' ? 'groups-list' : 'groups-grid';
        }
    }

    viewGroupDetails(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const modal = this.createModal('group-details', `${group.avatar} ${group.name}`, `
            <div class="group-details-container">
                <div class="group-hero">
                    <div class="group-avatar-large">${group.avatar}</div>
                    <div class="group-info">
                        <h2>${group.name}</h2>
                        <p class="group-description">${group.description}</p>
                        <div class="group-badges">
                            <span class="badge badge-status-${group.status}">${this.getStatusLabel(group.status)}</span>
                            <span class="badge badge-type-${group.type}">${this.getGroupTypeLabel(group.type)}</span>
                            ${group.isOwner ? '<span class="badge badge-owner">Coordinador</span>' : ''}
                        </div>
                    </div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-card">
                        <div class="detail-card-header">
                            <h4><i class="fas fa-chart-bar"></i> Estadísticas del Grupo</h4>
                        </div>
                        <div class="stats-list">
                            <div class="stat-row">
                                <div class="stat-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Miembros Activos</span>
                                    <span class="stat-value">${Array.isArray(group.members) ? group.members.length : group.members}/${group.maxMembers}</span>
                                </div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-icon">
                                    <i class="fas fa-money-bill-wave"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Contribución ${this.getFrequencyLabel(group.frequency)}</span>
                                    <span class="stat-value">L. ${group.contribution.toLocaleString()}</span>
                                </div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-icon">
                                    <i class="fas fa-piggy-bank"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Total Ahorrado</span>
                                    <span class="stat-value">L. ${group.totalSavings.toLocaleString()}</span>
                                </div>
                            </div>
                            ${group.performance > 0 ? `
                            <div class="stat-row">
                                <div class="stat-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Rendimiento</span>
                                    <span class="stat-value">${group.performance}%</span>
                                </div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Score de Confianza</span>
                                    <span class="stat-value">${group.trustScore}%</span>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <div class="detail-card-header">
                            <h4><i class="fas fa-info-circle"></i> Información General</h4>
                        </div>
                        <div class="info-list">
                            <div class="info-row">
                                <div class="info-icon">
                                    <i class="fas fa-map-marker-alt"></i>
                                </div>
                                <div class="info-content">
                                    <span class="info-label">Ubicación</span>
                                    <span class="info-value">${group.location}</span>
                                </div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div class="info-content">
                                    <span class="info-label">Frecuencia</span>
                                    <span class="info-value">${this.getFrequencyLabel(group.frequency)}</span>
                                </div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">
                                    <i class="fas fa-calendar-plus"></i>
                                </div>
                                <div class="info-content">
                                    <span class="info-label">Fecha de Creación</span>
                                    <span class="info-value">${this.formatDate(group.created)}</span>
                                </div>
                            </div>
                            ${group.nextMeeting ? `
                            <div class="info-row">
                                <div class="info-icon">
                                    <i class="fas fa-calendar-alt"></i>
                                </div>
                                <div class="info-content">
                                    <span class="info-label">Próxima Reunión</span>
                                    <span class="info-value">${this.formatDate(group.nextMeeting)}</span>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Members Section -->
                <div class="detail-card members-detail-card">
                    <div class="detail-card-header">
                        <h4><i class="fas fa-users"></i> Miembros del Grupo (${Array.isArray(group.members) ? group.members.length : group.members})</h4>
                    </div>
                    <div class="members-grid-details">
                        ${this.generateGroupDetailsMembersList(group)}
                    </div>
                </div>
                
                ${group.tags && group.tags.length > 0 ? `
                <div class="group-tags-section">
                    <h4><i class="fas fa-tags"></i> Categorías</h4>
                    <div class="tags-container">
                        ${group.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `, true);

        modal.querySelector('.modal-actions').innerHTML = `
            ${group.isAdmin ? `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.closeModal(); advancedGroupsSystem.manageGroup('${groupId}')">
                <i class="fas fa-cog"></i> Administrar Grupo
            </button>
            ` : ''}
            <button class="btn btn-info" onclick="advancedGroupsSystem.closeModal(); advancedGroupsSystem.viewGroupTandasFromGroup('${groupId}')">
                <i class="fas fa-sync-alt"></i> Ver Tandas (${group.activeTandas || 2})
            </button>
            <button class="btn btn-success" onclick="advancedGroupsSystem.shareGroup('${groupId}')">
                <i class="fas fa-share-alt"></i> Compartir Grupo
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
    }

    manageGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group || !group.isAdmin) {
            this.showNotification('⚠️ No tienes permisos para administrar este grupo', 'warning');
            return;
        }

        this.switchTab('groups'); // Ir a la sección de grupos
        setTimeout(() => this.showMembersManagement(groupId), 300);
    }

    viewGroupTandas(groupId) {
        this.switchTab('tandas');
        // Filtrar tandas por grupo específico
        setTimeout(() => this.loadTandasContent(groupId), 300);
    }

    toggleGroupActions(groupId) {
        const menu = document.getElementById(`actions-${groupId}`);
        if (menu) {
            const isShowing = menu.classList.contains('show');
            const groupCard = menu.closest('.group-card');
            
            // Cerrar todos los menús abiertos primero
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                m.classList.remove('show');
                const card = m.closest('.group-card');
                if (card) card.classList.remove('dropdown-active');
            });
            
            // Si no estaba showing, mostrarlo
            if (!isShowing) {
                menu.classList.add('show');
                if (groupCard) groupCard.classList.add('dropdown-active');
            }
        }
    }

    shareGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const memberCount = Array.isArray(group.members) ? group.members.length : group.members;
        const shareText = `¡Únete al grupo "${group.name}"! Ahorra L. ${group.contribution.toLocaleString()} ${this.getFrequencyLabel(group.frequency).toLowerCase()} con ${memberCount} miembros. #LaTandaHonduras`;
        
        if (navigator.share) {
            navigator.share({
                title: `Grupo: ${group.name}`,
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copiar al portapapeles
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('📋 Información del grupo copiada al portapapeles', 'success');
            });
        }
        
        this.toggleGroupActions(groupId);
    }

    exportGroupData(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const data = {
            group: group,
            exportDate: new Date().toISOString(),
            members: this.getGroupMembers(groupId),
            tandas: this.tandas.filter(t => t.groupId === groupId)
        };

        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `grupo_${group.name.toLowerCase().replace(/\s+/g, '_')}.json`, 'application/json');
        this.showNotification('📊 Datos del grupo exportados exitosamente', 'success');
        this.toggleGroupActions(groupId);
    }

    leaveGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        if (group.isOwner) {
            this.showNotification('⚠️ Como coordinador, debes transferir el liderazgo antes de salir', 'warning');
            return;
        }

        const confirmModal = this.createModal('confirm-leave', '⚠️ Confirmar Salida', `
            <div class="confirm-container">
                <p>¿Estás seguro de que quieres salir del grupo <strong>"${group.name}"</strong>?</p>
                <div class="warning-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Esta acción no se puede deshacer. Perderás acceso a todas las tandas activas.</span>
                </div>
            </div>
        `, true);

        confirmModal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-danger" onclick="advancedGroupsSystem.confirmLeaveGroup('${groupId}')">
                <i class="fas fa-sign-out-alt"></i> Sí, Salir del Grupo
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    }

    confirmLeaveGroup(groupId) {
        // Remover el grupo de la lista
        this.groups = this.groups.filter(g => g.id !== groupId);
        
        // CRITICAL: Save the updated groups array to localStorage
        this.saveGroupsData(this.groups);
        
        this.closeModal();
        this.loadGroupsContent();
        this.updateDashboard();
        
        this.showNotification('✅ Has salido del grupo exitosamente', 'success');
    }

    getGroupMembers(groupId) {
        // Mock data - en producción vendría de la API
        return [
            { id: 1, name: "Carlos Hernández", email: "carlos@example.com", status: "active", role: "coordinator" },
            { id: 2, name: "Ana García", email: "ana@example.com", status: "active", role: "member" },
            { id: 3, name: "Luis Martinez", email: "luis@example.com", status: "pending", role: "member" }
        ];
    }
    
    loadCreateGroupForm() {
        const createForm = document.querySelector('.create-group-form');
        if (!createForm) return;
        
        createForm.innerHTML = `
            <div class="form-container enhanced">
                <div class="form-progress">
                    <div class="progress-steps">
                        <div class="step active" data-step="1">
                            <span class="step-number">1</span>
                            <span class="step-label">Básico</span>
                        </div>
                        <div class="step" data-step="2">
                            <span class="step-number">2</span>
                            <span class="step-label">Configuración</span>
                        </div>
                        <div class="step" data-step="3">
                            <span class="step-number">3</span>
                            <span class="step-label">Avanzado</span>
                        </div>
                        <div class="step" data-step="4">
                            <span class="step-number">4</span>
                            <span class="step-label">Confirmación</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 25%"></div>
                    </div>
                </div>

                <form id="createGroupForm" onsubmit="advancedGroupsSystem.handleFormSubmit(event)">
                    
                    <!-- PASO 1: Información Básica -->
                    <div class="form-step active" data-step="1">
                        <div class="step-header">
                            <h2><i class="fas fa-info-circle"></i> Información Básica</h2>
                            <p>Define los aspectos fundamentales de tu grupo cooperativo</p>
                        </div>

                        <div class="form-section">
                            <div class="form-group">
                                <label for="groupName">Nombre del Grupo *</label>
                                <input type="text" id="groupName" name="name" required 
                                       placeholder="Ej: Cooperativa Familiar Norte"
                                       oninput="advancedGroupsSystem.validateField(this)">
                                <div class="field-help">Escoge un nombre descriptivo y fácil de recordar</div>
                            </div>

                            <div class="form-group">
                                <label for="groupDescription">Descripción del Grupo *</label>
                                <textarea id="groupDescription" name="description" required 
                                         placeholder="Describe el propósito y objetivos del grupo..."
                                         rows="3" maxlength="250"
                                         oninput="advancedGroupsSystem.validateField(this)"></textarea>
                                <div class="field-help">
                                    <span id="descriptionCounter">0/250</span> caracteres
                                </div>
                            </div>

                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="groupType">Tipo de Grupo *</label>
                                    <select id="groupType" name="type" required onchange="advancedGroupsSystem.updateGroupTypeInfo(this)">
                                        <option value="">Seleccionar tipo...</option>
                                        <option value="family">👨‍👩‍👧‍👦 Familiar</option>
                                        <option value="business">💼 Empresarial</option>
                                        <option value="community">🏘️ Comunitario</option>
                                        <option value="professional">👔 Profesional</option>
                                        <option value="youth">👥 Juvenil</option>
                                        <option value="women">👩 Mujeres</option>
                                    </select>
                                    <div id="typeInfo" class="field-info"></div>
                                </div>

                                <div class="form-group">
                                    <label for="groupLocation">Ubicación *</label>
                                    <input type="text" id="groupLocation" name="location" required 
                                           placeholder="Ej: Tegucigalpa, Comayagüela"
                                           list="locations">
                                    <datalist id="locations">
                                        <option value="Tegucigalpa">
                                        <option value="San Pedro Sula">
                                        <option value="Choloma">
                                        <option value="La Ceiba">
                                        <option value="El Progreso">
                                        <option value="Choluteca">
                                        <option value="Comayagua">
                                        <option value="Puerto Cortés">
                                        <option value="La Lima">
                                        <option value="Danlí">
                                    </datalist>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>¿Permites reuniones virtuales?</label>
                                <div class="radio-group">
                                    <label class="radio-option">
                                        <input type="radio" name="allowVirtual" value="yes" checked>
                                        <span class="radio-custom"></span>
                                        Sí, permitir reuniones online
                                    </label>
                                    <label class="radio-option">
                                        <input type="radio" name="allowVirtual" value="no">
                                        <span class="radio-custom"></span>
                                        Solo reuniones presenciales
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="step-actions">
                            <button type="button" class="btn btn-primary" onclick="advancedGroupsSystem.nextStep()">
                                Continuar <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>

                    <!-- PASO 2: Configuración Financiera -->
                    <div class="form-step" data-step="2">
                        <div class="step-header">
                            <h2><i class="fas fa-coins"></i> Configuración Financiera</h2>
                            <p>Define los aspectos económicos y de participación</p>
                        </div>

                        <div class="form-section">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="baseContribution">Contribución Base (L.) *</label>
                                    <input type="number" id="baseContribution" name="contribution" 
                                           min="100" max="50000" step="50" required 
                                           placeholder="1500"
                                           oninput="advancedGroupsSystem.calculateProjections(this)">
                                    <div class="field-help">Monto que cada miembro aporta por ciclo</div>
                                </div>

                                <div class="form-group">
                                    <label for="maxParticipants">Máximo Participantes *</label>
                                    <input type="number" id="maxParticipants" name="maxParticipants" 
                                           min="5" max="25" required placeholder="12"
                                           oninput="advancedGroupsSystem.calculateProjections(this)">
                                    <div class="field-help">Número máximo de miembros en el grupo</div>
                                </div>
                            </div>

                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="cycleDuration">Frecuencia de Pago *</label>
                                    <select id="cycleDuration" name="cycleDuration" required 
                                            onchange="advancedGroupsSystem.calculateProjections(this)">
                                        <option value="">Seleccionar frecuencia...</option>
                                        <option value="weekly">📅 Semanal</option>
                                        <option value="bi-weekly">📅 Quincenal</option>
                                        <option value="monthly">📅 Mensual</option>
                                        <option value="quarterly">📅 Trimestral</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="startDate">Fecha de Inicio</label>
                                    <input type="date" id="startDate" name="startDate" 
                                           min="${new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>

                            <div class="projection-card" id="projectionCard" style="display: none;">
                                <h4><i class="fas fa-calculator"></i> Proyección Financiera</h4>
                                <div class="projection-grid">
                                    <div class="projection-item">
                                        <span class="label">Total por Ciclo:</span>
                                        <span class="value" id="totalPerCycle">L. 0</span>
                                    </div>
                                    <div class="projection-item">
                                        <span class="label">Duración Total:</span>
                                        <span class="value" id="totalDuration">0 ciclos</span>
                                    </div>
                                    <div class="projection-item">
                                        <span class="label">Beneficio Máximo:</span>
                                        <span class="value" id="maxBenefit">L. 0</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Opciones Adicionales</label>
                                <div class="checkbox-group">
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="allowEarlyWithdraw" value="true">
                                        <span class="checkbox-custom"></span>
                                        Permitir retiros anticipados (con penalización)
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="requireInsurance" value="true">
                                        <span class="checkbox-custom"></span>
                                        Requerir seguro de participación
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="allowLateFees" value="true">
                                        <span class="checkbox-custom"></span>
                                        Aplicar multas por pagos tardíos
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="step-actions">
                            <button type="button" class="btn btn-secondary" onclick="advancedGroupsSystem.prevStep()">
                                <i class="fas fa-arrow-left"></i> Anterior
                            </button>
                            <button type="button" class="btn btn-primary" onclick="advancedGroupsSystem.nextStep()">
                                Continuar <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>

                    <!-- PASO 3: Configuración Avanzada -->
                    <div class="form-step" data-step="3">
                        <div class="step-header">
                            <h2><i class="fas fa-shield-alt"></i> Configuración Avanzada</h2>
                            <p>Establece reglas y políticas del grupo</p>
                        </div>

                        <div class="form-section">
                            <div class="form-group">
                                <label>Requisitos de Ingreso</label>
                                <div class="requirements-grid">
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="requireIdVerification" value="true" checked>
                                        <span class="checkbox-custom"></span>
                                        Verificación de identidad obligatoria
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="requireIncomeProof" value="true">
                                        <span class="checkbox-custom"></span>
                                        Comprobante de ingresos
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="requireReferences" value="true">
                                        <span class="checkbox-custom"></span>
                                        Referencias personales (mín. 2)
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="requireMinTrustScore" value="true">
                                        <span class="checkbox-custom"></span>
                                        Puntaje mínimo de confianza: 70%
                                    </label>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="groupRules">Reglas del Grupo</label>
                                <textarea id="groupRules" name="rules" rows="4" 
                                         placeholder="Define las reglas específicas del grupo...">• Puntualidad en pagos es obligatoria
• Participación en reuniones mensuales
• Respeto mutuo entre miembros
• Comunicación transparente sobre dificultades financieras</textarea>
                            </div>

                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="penaltyAmount">Multa por Retraso (L.)</label>
                                    <input type="number" id="penaltyAmount" name="penaltyAmount" 
                                           min="0" max="500" step="25" placeholder="50">
                                    <div class="field-help">Multa aplicada por pagos tardíos</div>
                                </div>

                                <div class="form-group">
                                    <label for="gracePeriod">Período de Gracia (días)</label>
                                    <input type="number" id="gracePeriod" name="gracePeriod" 
                                           min="0" max="15" placeholder="3">
                                    <div class="field-help">Días adicionales sin multa</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Notificaciones Automáticas</label>
                                <div class="checkbox-group">
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="notifyPaymentReminder" value="true" checked>
                                        <span class="checkbox-custom"></span>
                                        Recordatorio de pagos (3 días antes)
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="notifyMeetingReminder" value="true" checked>
                                        <span class="checkbox-custom"></span>
                                        Recordatorio de reuniones
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" name="notifyTurnUpdate" value="true" checked>
                                        <span class="checkbox-custom"></span>
                                        Actualización de turnos de cobro
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="step-actions">
                            <button type="button" class="btn btn-secondary" onclick="advancedGroupsSystem.prevStep()">
                                <i class="fas fa-arrow-left"></i> Anterior
                            </button>
                            <button type="button" class="btn btn-primary" onclick="advancedGroupsSystem.nextStep()">
                                Continuar <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>

                    <!-- PASO 4: Confirmación -->
                    <div class="form-step" data-step="4">
                        <div class="step-header">
                            <h2><i class="fas fa-check-circle"></i> Confirmación y Resumen</h2>
                            <p>Revisa todos los detalles antes de crear el grupo</p>
                        </div>

                        <div class="confirmation-summary" id="confirmationSummary">
                            <!-- El resumen se generará dinámicamente -->
                        </div>

                        <div class="terms-section">
                            <label class="checkbox-option">
                                <input type="checkbox" id="acceptTerms" required>
                                <span class="checkbox-custom"></span>
                                Acepto los <a href="#" onclick="advancedGroupsSystem.showTermsModal()">términos y condiciones</a> 
                                de La Tanda Honduras
                            </label>
                        </div>

                        <div class="step-actions">
                            <button type="button" class="btn btn-secondary" onclick="advancedGroupsSystem.prevStep()">
                                <i class="fas fa-arrow-left"></i> Anterior
                            </button>
                            <button type="submit" class="btn btn-success btn-lg">
                                <i class="fas fa-plus-circle"></i> Crear Grupo
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        `;
        
        // Inicializar validaciones y eventos del formulario
        this.initFormValidation();
        this.currentStep = 1;
    }

    // ========================================
    // 📝 FUNCIONES DEL FORMULARIO CREAR GRUPO
    // ========================================

    initFormValidation() {
        // Contador de caracteres para descripción
        const descriptionField = document.getElementById('groupDescription');
        if (descriptionField) {
            descriptionField.addEventListener('input', (e) => {
                const counter = document.getElementById('descriptionCounter');
                if (counter) {
                    counter.textContent = `${e.target.value.length}/250`;
                }
            });
        }

        // Validación en tiempo real
        document.querySelectorAll('input[required], select[required]').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldGroup = field.closest('.form-group');
        
        // Limpiar estado anterior
        fieldGroup.classList.remove('valid', 'invalid');
        
        if (field.hasAttribute('required') && !value) {
            fieldGroup.classList.add('invalid');
            return false;
        }
        
        // Validaciones específicas
        switch(field.name) {
            case 'name':
                if (value.length < 3) {
                    fieldGroup.classList.add('invalid');
                    return false;
                }
                break;
            case 'description':
                if (value.length < 10) {
                    fieldGroup.classList.add('invalid');
                    return false;
                }
                break;
            case 'contribution':
                if (value < 100 || value > 50000) {
                    fieldGroup.classList.add('invalid');
                    return false;
                }
                break;
            case 'maxParticipants':
                if (value < 5 || value > 25) {
                    fieldGroup.classList.add('invalid');
                    return false;
                }
                break;
        }
        
        fieldGroup.classList.add('valid');
        return true;
    }

    updateGroupTypeInfo(select) {
        const typeInfo = document.getElementById('typeInfo');
        const typeDescriptions = {
            family: 'Grupos familiares enfocados en metas compartidas y apoyo mutuo.',
            business: 'Orientado a empresarios y comerciantes para crecimiento de negocios.',
            community: 'Para miembros de una comunidad específica o vecindario.',
            professional: 'Red de profesionales independientes con objetivos similares.',
            youth: 'Grupos de jóvenes ahorrando para estudios y proyectos personales.',
            women: 'Empoderamiento financiero y apoyo entre mujeres emprendedoras.'
        };
        
        if (typeInfo && typeDescriptions[select.value]) {
            typeInfo.innerHTML = `<i class="fas fa-info-circle"></i> ${typeDescriptions[select.value]}`;
        }
    }

    calculateProjections() {
        const contribution = parseFloat(document.getElementById('baseContribution')?.value) || 0;
        const maxParticipants = parseInt(document.getElementById('maxParticipants')?.value) || 0;
        const frequency = document.getElementById('cycleDuration')?.value;
        
        if (contribution > 0 && maxParticipants > 0 && frequency) {
            const projectionCard = document.getElementById('projectionCard');
            const totalPerCycle = contribution * maxParticipants;
            const totalDuration = maxParticipants;
            const maxBenefit = totalPerCycle;
            
            document.getElementById('totalPerCycle').textContent = `L. ${totalPerCycle.toLocaleString()}`;
            document.getElementById('totalDuration').textContent = `${totalDuration} ciclos`;
            document.getElementById('maxBenefit').textContent = `L. ${maxBenefit.toLocaleString()}`;
            
            projectionCard.style.display = 'block';
        }
    }

    // OLD IMPLEMENTATION - DISABLED (conflicts with new multi-step form)
    /*
    nextStep() {
        if (!this.validateCurrentStep()) {
            return;
        }
        
        if (this.currentStep < 4) {
            this.currentStep++;
            this.updateStepDisplay();
            
            if (this.currentStep === 4) {
                this.generateConfirmationSummary();
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }
    */

    // OLD IMPLEMENTATION - DISABLED (conflicts with new multi-step form)
    /*
    validateCurrentStep() {
        const currentStepElement = document.querySelector(`.step-container[data-step="${this.currentStep}"]`);
        if (!currentStepElement) return true;
        
        const requiredFields = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            this.showNotification('⚠️ Por favor completa todos los campos requeridos', 'warning');
        }
        
        return isValid;
    }
    */

    // OLD IMPLEMENTATION - DISABLED (conflicts with new multi-step form)
    /*
    updateStepDisplay() {
        // Actualizar pasos de progreso
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
            step.classList.toggle('completed', index + 1 < this.currentStep);
        });
        
        // Actualizar barra de progreso
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${(this.currentStep / 4) * 100}%`;
        }
        
        // Mostrar/ocultar pasos del formulario - FIXED
        document.querySelectorAll('.step-container').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
        });
        
        // Scroll al inicio del formulario
        const formContainer = document.querySelector('.create-group-form');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    */

    generateConfirmationSummary() {
        const form = document.getElementById('createGroupForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const summary = document.getElementById('confirmationSummary');
        summary.innerHTML = `
            <div class="summary-grid">
                <div class="summary-section">
                    <h4><i class="fas fa-info-circle"></i> Información Básica</h4>
                    <div class="summary-item">
                        <span class="label">Nombre:</span>
                        <span class="value">${data.name}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Tipo:</span>
                        <span class="value">${this.getGroupTypeLabel(data.type)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Ubicación:</span>
                        <span class="value">${data.location}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Descripción:</span>
                        <span class="value">${data.description}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h4><i class="fas fa-coins"></i> Configuración Financiera</h4>
                    <div class="summary-item">
                        <span class="label">Contribución:</span>
                        <span class="value">L. ${parseInt(data.contribution).toLocaleString()}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Máx. Participantes:</span>
                        <span class="value">${data.maxParticipants} personas</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Frecuencia:</span>
                        <span class="value">${this.getFrequencyLabel(data.cycleDuration)}</span>
                    </div>
                    ${data.startDate ? `
                    <div class="summary-item">
                        <span class="label">Inicio:</span>
                        <span class="value">${this.formatDate(data.startDate)}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="summary-section">
                    <h4><i class="fas fa-shield-alt"></i> Configuración Avanzada</h4>
                    <div class="summary-item">
                        <span class="label">Multa por retraso:</span>
                        <span class="value">L. ${data.penaltyAmount || 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Período de gracia:</span>
                        <span class="value">${data.gracePeriod || 0} días</span>
                    </div>
                    ${data.rules ? `
                    <div class="summary-item">
                        <span class="label">Reglas personalizadas:</span>
                        <span class="value">Definidas</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="summary-section">
                    <h4><i class="fas fa-calculator"></i> Proyección</h4>
                    <div class="highlight-box">
                        <div class="highlight-item">
                            <span class="label">Total por ciclo:</span>
                            <span class="value primary">L. ${(parseInt(data.contribution) * parseInt(data.maxParticipants)).toLocaleString()}</span>
                        </div>
                        <div class="highlight-item">
                            <span class="label">Duración completa:</span>
                            <span class="value">${data.maxParticipants} ${this.getFrequencyLabel(data.cycleDuration).toLowerCase()}s</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleFormSubmit(event) {
        event.preventDefault();
        
        if (this.currentStep !== 4) {
            this.nextStep();
            return;
        }
        
        // Validar términos y condiciones
        const acceptTerms = document.getElementById('acceptTerms');
        if (!acceptTerms.checked) {
            this.showNotification('⚠️ Debes aceptar los términos y condiciones', 'warning');
            return;
        }
        
        this.createGroup(event);
    }

    showTermsModal() {
        this.createModal('terms-modal', '📋 Términos y Condiciones', `
            <div class="terms-content">
                <h4>Términos y Condiciones - La Tanda Honduras</h4>
                
                <div class="terms-section">
                    <h5>1. Aceptación de los Términos</h5>
                    <p>Al crear un grupo en La Tanda Honduras, aceptas cumplir con estos términos y condiciones.</p>
                </div>
                
                <div class="terms-section">
                    <h5>2. Responsabilidades del Coordinador</h5>
                    <ul>
                        <li>Administrar el grupo de manera transparente y justa</li>
                        <li>Mantener registros precisos de todos los pagos</li>
                        <li>Comunicar cambios importantes a todos los miembros</li>
                        <li>Resolver disputas de manera imparcial</li>
                    </ul>
                </div>
                
                <div class="terms-section">
                    <h5>3. Compromisos Financieros</h5>
                    <ul>
                        <li>Los pagos deben realizarse en las fechas acordadas</li>
                        <li>Las multas por retraso se aplicarán según las reglas del grupo</li>
                        <li>Los fondos se distribuirán según el orden establecido</li>
                    </ul>
                </div>
                
                <div class="terms-section">
                    <h5>4. Privacidad y Seguridad</h5>
                    <p>La información personal se protege según nuestra política de privacidad. Los datos financieros se cifran y almacenan de forma segura.</p>
                </div>
                
                <div class="terms-section">
                    <h5>5. Resolución de Disputas</h5>
                    <p>Las disputas se resolverán primero a nivel de grupo. Si no se resuelve, se puede escalar al sistema de mediación de La Tanda Honduras.</p>
                </div>
            </div>
        `, true);
    }

    // ========================================
    // 🏗️ FUNCIONES ESENCIALES FALTANTES
    // ========================================

    async createGroup(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        console.log('📝 Creando nuevo grupo:', data);
        
        try {
            // Simular creación del grupo
            await this.delay(1000);
            
            const newGroup = {
                id: `group_${Date.now()}`,
                name: data.name,
                description: data.description,
                type: data.type,
                coordinator: this.currentUser.id,
                members: [
                    { 
                        id: this.currentUser.id, 
                        name: this.currentUser.name, 
                        role: 'coordinator', 
                        joinDate: new Date().toISOString().split('T')[0], 
                        status: 'active' 
                    }
                ],
                maxMembers: parseInt(data.maxParticipants),
                contribution: parseInt(data.contribution),
                totalSavings: 0,
                status: 'recruiting',
                isOwner: true,
                isAdmin: true,
                performance: 0,
                trustScore: 0,
                nextMeeting: data.startDate,
                location: data.location,
                frequency: data.cycleDuration,
                createdAt: new Date().toISOString().split('T')[0],
                rating: 0,
                currentCycle: 0,
                totalCycles: parseInt(data.maxParticipants),
                rules: data.rules ? data.rules.split(',').map(r => r.trim()) : ['Puntualidad en pagos obligatoria', 'Respeto mutuo entre miembros'],
                avatar: this.getGroupAvatar(data.type),
                tags: this.generateTags(data.type, data.name)
            };
            
            this.groups.push(newGroup);
            this.userStats.totalGroups++;
            
            // CRITICAL: Save the updated groups array to localStorage
            this.saveGroupsData(this.groups);
            
            this.showNotification('✅ Grupo creado exitosamente', 'success');
            this.closeModal();
            this.switchTab('groups');
            
            console.log('✅ Grupo creado:', newGroup);
        } catch (error) {
            console.error('❌ Error creando grupo:', error);
            this.showNotification('❌ Error al crear el grupo', 'error');
        }
    }

    getGroupAvatar(type) {
        const avatars = {
            family: '👨‍👩‍👧‍👦',
            business: '💼',
            community: '🏘️',
            professional: '👔',
            youth: '👥',
            women: '👩'
        };
        return avatars[type] || '👥';
    }

    generateTags(type, name) {
        const baseTags = {
            family: ['familiar', 'ahorro', 'familia'],
            business: ['empresarial', 'negocios', 'comercio'],
            community: ['comunitario', 'vecinos', 'local'],
            professional: ['profesional', 'trabajo', 'carrera'],
            youth: ['juventud', 'estudiantes', 'futuro'],
            women: ['mujeres', 'empoderamiento', 'red']
        };
        
        let tags = baseTags[type] || ['general'];
        if (name.toLowerCase().includes('norte')) tags.push('norte');
        if (name.toLowerCase().includes('sur')) tags.push('sur');
        
        return tags;
    }

    // ========================================
    // 🔧 FUNCIONES AUXILIARES CRÍTICAS
    // ========================================

    getGroupTypeLabel(type) {
        const types = {
            family: 'Familiar',
            business: 'Empresarial', 
            community: 'Comunitario',
            professional: 'Profesional',
            youth: 'Juvenil',
            women: 'Mujeres'
        };
        return types[type] || type;
    }
    
    getStatusLabel(status) {
        const statuses = {
            active: '✅ Activo',
            completed: '🏆 Completado',
            recruiting: '📢 Reclutando',
            paused: '⏸️ Pausado',
            waiting: '⏳ Esperando'
        };
        return statuses[status] || status;
    }

    createModal(id, title, content, large = false) {
        // Remover modal existente
        const existingModal = document.getElementById(`modal-${id}`);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = `modal-${id}`;
        modal.className = `modal ${large ? 'large' : ''}`;
        modal.innerHTML = `
            <div class="modal-overlay" onclick="advancedGroupsSystem.closeModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="advancedGroupsSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-actions">
                    <!-- Actions will be added dynamically -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        
        return modal;
    }

    closeModal() {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            setTimeout(() => activeModal.remove(), 300);
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Crear notificación visual
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.remove()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Agregar al contenedor de notificaciones
        let container = document.querySelector('.notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto-remover después del tiempo especificado
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    handleStatCardClick(card) {
        const action = card.getAttribute('data-action');
        const target = card.getAttribute('data-target');
        const filter = card.getAttribute('data-filter');
        
        console.log(`📊 Stat card clicked: action=${action}, target=${target}, filter=${filter}`);
        
        switch (action) {
            case 'navigate':
                this.navigateFromStat(target, filter);
                break;
            case 'modal':
                this.showStatModal(target);
                break;
            default:
                console.warn('Unknown stat card action:', action);
        }
    }
    
    navigateFromStat(target, filter = null) {
        console.log(`🧭 Navegando desde stat-card a: ${target}${filter ? ` (filter: ${filter})` : ''}`);
        
        // Navigate to the target tab
        this.switchTab(target);
        
        // Apply filter if specified (simple implementation)
        if (filter) {
            setTimeout(() => {
                console.log(`🔍 Aplicando filtro: ${filter} en sección: ${target}`);
                // Simple filter implementation - could be enhanced later
            }, 100);
        }
        
        // Show success notification
        const displayNames = {
            'groups': 'Mis Grupos',
            'tandas': 'Gestión de Tandas', 
            'matching': 'Matching Inteligente',
            'analytics': 'Analíticas'
        };
        
        const displayName = displayNames[target] || target;
        this.showNotification(`Navegando a ${displayName}${filter ? ` (${filter})` : ''}`, 'info');
    }
    
    showStatModal(modalType) {
        switch (modalType) {
            case 'financial-details':
                this.showFinancialDetailsModal();
                break;
            case 'reputation-details':
                this.showReputationDetailsModal();
                break;
            default:
                console.warn('Unknown modal type:', modalType);
        }
    }
    
    showFinancialDetailsModal() {
        const modal = this.createModal('financial-details', '💰 Detalles Financieros', `
            <div class="financial-details-container">
                <div class="financial-summary-grid">
                    <div class="financial-card">
                        <div class="financial-icon"><i class="fas fa-piggy-bank"></i></div>
                        <div class="financial-info">
                            <div class="financial-value">L. 24,500</div>
                            <div class="financial-label">Total Ahorrado</div>
                        </div>
                    </div>
                    <div class="financial-card">
                        <div class="financial-icon"><i class="fas fa-calendar-check"></i></div>
                        <div class="financial-info">
                            <div class="financial-value">L. 3,200</div>
                            <div class="financial-label">Próximo Cobro</div>
                        </div>
                    </div>
                    <div class="financial-card">
                        <div class="financial-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="financial-info">
                            <div class="financial-value">+15%</div>
                            <div class="financial-label">Crecimiento Mensual</div>
                        </div>
                    </div>
                </div>
                
                <div class="financial-breakdown">
                    <h4><i class="fas fa-list"></i> Desglose por Grupo</h4>
                    <div class="breakdown-list">
                        <div class="breakdown-item">
                            <div class="breakdown-info">
                                <span class="breakdown-group">Cooperativa Familiar</span>
                                <span class="breakdown-amount">L. 12,000</span>
                            </div>
                            <div class="breakdown-progress">
                                <div class="progress-bar" style="width: 75%"></div>
                            </div>
                        </div>
                        <div class="breakdown-item">
                            <div class="breakdown-info">
                                <span class="breakdown-group">Tanda Profesionales</span>
                                <span class="breakdown-amount">L. 8,500</span>
                            </div>
                            <div class="breakdown-progress">
                                <div class="progress-bar" style="width: 60%"></div>
                            </div>
                        </div>
                        <div class="breakdown-item">
                            <div class="breakdown-info">
                                <span class="breakdown-group">Grupo Comunitario</span>
                                <span class="breakdown-amount">L. 4,000</span>
                            </div>
                            <div class="breakdown-progress">
                                <div class="progress-bar" style="width: 40%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="financial-projections">
                    <h4><i class="fas fa-crystal-ball"></i> Proyecciones</h4>
                    <div class="projection-grid">
                        <div class="projection-item">
                            <span class="projection-period">3 meses</span>
                            <span class="projection-amount">L. 32,500</span>
                        </div>
                        <div class="projection-item">
                            <span class="projection-period">6 meses</span>
                            <span class="projection-amount">L. 45,200</span>
                        </div>
                        <div class="projection-item">
                            <span class="projection-period">1 año</span>
                            <span class="projection-amount">L. 78,000</span>
                        </div>
                    </div>
                </div>
            </div>
        `);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
            <button class="btn btn-primary" onclick="advancedGroupsSystem.downloadFinancialReport()">
                <i class="fas fa-download"></i> Descargar Reporte
            </button>
        `;
    }
    
    showReputationDetailsModal() {
        const modal = this.createModal('reputation-details', '🛡️ Score de Confianza', `
            <div class="reputation-details-container">
                <div class="reputation-score-display">
                    <div class="score-circle">
                        <div class="score-value">94%</div>
                        <div class="score-label">Excelente</div>
                    </div>
                    <div class="score-breakdown">
                        <div class="score-factor">
                            <span class="factor-name">Puntualidad en Pagos</span>
                            <div class="factor-bar">
                                <div class="factor-progress" style="width: 98%"></div>
                                <span class="factor-score">98%</span>
                            </div>
                        </div>
                        <div class="score-factor">
                            <span class="factor-name">Participación Activa</span>
                            <div class="factor-bar">
                                <div class="factor-progress" style="width: 95%"></div>
                                <span class="factor-score">95%</span>
                            </div>
                        </div>
                        <div class="score-factor">
                            <span class="factor-name">Colaboración</span>
                            <div class="factor-bar">
                                <div class="factor-progress" style="width: 88%"></div>
                                <span class="factor-score">88%</span>
                            </div>
                        </div>
                        <div class="score-factor">
                            <span class="factor-name">Recomendaciones</span>
                            <div class="factor-bar">
                                <div class="factor-progress" style="width: 92%"></div>
                                <span class="factor-score">92%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="reputation-history">
                    <h4><i class="fas fa-history"></i> Historial de Confianza</h4>
                    <div class="history-timeline">
                        <div class="history-item positive">
                            <div class="history-icon"><i class="fas fa-check-circle"></i></div>
                            <div class="history-content">
                                <span class="history-action">Pago puntual completado</span>
                                <span class="history-date">Hace 3 días</span>
                            </div>
                            <span class="history-points">+2 puntos</span>
                        </div>
                        <div class="history-item positive">
                            <div class="history-icon"><i class="fas fa-users"></i></div>
                            <div class="history-content">
                                <span class="history-action">Nuevo miembro referido</span>
                                <span class="history-date">Hace 1 semana</span>
                            </div>
                            <span class="history-points">+5 puntos</span>
                        </div>
                        <div class="history-item positive">
                            <div class="history-icon"><i class="fas fa-trophy"></i></div>
                            <div class="history-content">
                                <span class="history-action">Tanda completada exitosamente</span>
                                <span class="history-date">Hace 2 semanas</span>
                            </div>
                            <span class="history-points">+10 puntos</span>
                        </div>
                    </div>
                </div>
                
                <div class="reputation-tips">
                    <h4><i class="fas fa-lightbulb"></i> Consejos para Mejorar</h4>
                    <div class="tips-list">
                        <div class="tip-item">
                            <i class="fas fa-clock"></i>
                            <span>Mantén puntualidad en todos los pagos</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-handshake"></i>
                            <span>Refiere nuevos miembros confiables</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-comments"></i>
                            <span>Participa activamente en las reuniones</span>
                        </div>
                    </div>
                </div>
            </div>
        `);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
    }
    
    getTabDisplayName(tabName) {
        const displayNames = {
            'groups': 'Mis Grupos',
            'tandas': 'Gestión de Tandas', 
            'matching': 'Matching Inteligente',
            'analytics': 'Analíticas y Reportes'
        };
        return displayNames[tabName] || tabName;
    }
    
    applyFilter(tab, filter) {
        // Apply filter based on tab and filter type
        console.log(`🔍 Applying filter: ${filter} to tab: ${tab}`);
        
        if (tab === 'groups' && filter === 'active') {
            // Filter to show only active groups
            const groupCards = document.querySelectorAll('.group-card');
            groupCards.forEach(card => {
                const status = card.querySelector('.status')?.textContent?.toLowerCase();
                if (status && status.includes('activo')) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }
    
    downloadFinancialReport() {
        const reportData = this.generateFinancialReport();
        this.downloadFile(reportData, 'reporte-financiero-latanda.pdf', 'application/pdf');
        this.showNotification('success', 'Reporte financiero descargado exitosamente');
        this.closeModal();
    }
    
    generateFinancialReport() {
        // Simulate PDF generation
        return 'Reporte Financiero La Tanda - ' + new Date().toLocaleDateString();
    }
    
    // ========================================
    // 🎨 TANDAS CARD V2 HELPER FUNCTIONS
    // ========================================
    
    getTandaStatusIcon(status) {
        const icons = {
            'active': 'play-circle',
            'completed': 'check-circle', 
            'upcoming': 'clock'
        };
        return icons[status] || 'info-circle';
    }
    
    getTandaPrimaryAction(tanda) {
        switch(tanda.status) {
            case 'active':
                if (tanda.paymentsPending > 0) {
                    return {
                        label: 'Gestionar Pagos',
                        icon: 'exclamation-triangle',
                        class: 'urgent',
                        onclick: `advancedGroupsSystem.managePendingPayments('${tanda.id}')`,
                        disabled: false
                    };
                }
                return {
                    label: 'Registrar Pago', 
                    icon: 'money-bill-wave',
                    class: 'success',
                    onclick: `advancedGroupsSystem.recordTandaPayment('${tanda.id}')`,
                    disabled: false
                };
            case 'upcoming':
                return {
                    label: 'Iniciar Tanda',
                    icon: 'play',
                    class: 'primary',
                    onclick: `advancedGroupsSystem.startTanda('${tanda.id}')`,
                    disabled: false
                };
            case 'completed':
                return {
                    label: 'Ver Resumen',
                    icon: 'chart-bar', 
                    class: 'info',
                    onclick: `advancedGroupsSystem.viewTandaSummary('${tanda.id}')`,
                    disabled: false
                };
            default:
                return {
                    label: 'Ver Detalles',
                    icon: 'eye',
                    class: 'secondary',
                    onclick: `advancedGroupsSystem.viewTandaDetails('${tanda.id}')`,
                    disabled: false
                };
        }
    }
    
    renderProgressStatus(tanda) {
        switch(tanda.status) {
            case 'active':
                return `<span class="status-active">🟢 En Progreso</span>`;
            case 'completed':
                return `<span class="status-completed">✅ Completada</span>`;
            case 'upcoming':
                return `<span class="status-upcoming">🕒 Próximamente</span>`;
            default:
                return `<span class="status-unknown">❓ Estado Desconocido</span>`;
        }
    }
    
    renderProgressSteps(tanda) {
        let steps = '';
        for (let i = 1; i <= tanda.totalRounds; i++) {
            const stepClass = i <= tanda.currentRound ? 'completed' : 
                             i === tanda.currentRound + 1 ? 'current' : 'pending';
            steps += `<div class="progress-step ${stepClass}" data-round="${i}"></div>`;
        }
        return steps;
    }
    
    renderCriticalInfo(tanda, daysToNext) {
        if (tanda.status === 'active') {
            if (tanda.paymentsPending > 0) {
                return `
                    <div class="critical-alert urgent">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>${tanda.paymentsPending} pago${tanda.paymentsPending > 1 ? 's' : ''} pendiente${tanda.paymentsPending > 1 ? 's' : ''}</span>
                    </div>`;
            }
            return `
                <div class="critical-info normal">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <span>Próximo: ${tanda.nextBeneficiary}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${daysToNext >= 0 ? `En ${daysToNext} días` : `Hace ${Math.abs(daysToNext)} días`}</span>
                    </div>
                </div>`;
        } else if (tanda.status === 'upcoming') {
            const startDays = this.calculateDaysToStart(tanda);
            return `
                <div class="critical-info upcoming">
                    <i class="fas fa-rocket"></i>
                    <span>Inicia en ${startDays} días</span>
                </div>`;
        } else if (tanda.status === 'completed') {
            return `
                <div class="critical-info completed">
                    <i class="fas fa-trophy"></i>
                    <span>Tanda exitosa • ${tanda.participants} participantes</span>
                </div>`;
        }
        return '';
    }
    
    renderExpandedDetails(tanda) {
        return `
            <div class="expanded-details-grid">
                <div class="detail-row">
                    <span class="detail-label">💰 Total acumulado:</span>
                    <span class="detail-value">L. ${tanda.totalAmount.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👥 Participantes:</span>
                    <span class="detail-value">${tanda.participants} miembros</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📅 Frecuencia:</span>
                    <span class="detail-value">${this.getFrequencyLabel(tanda.paymentFrequency)}</span>
                </div>
                ${tanda.status === 'active' ? `
                <div class="detail-row">
                    <span class="detail-label">📋 Próximo pago:</span>
                    <span class="detail-value">${new Date(tanda.nextPaymentDate).toLocaleDateString('es-HN')}</span>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    renderTandaActionMenu(tanda) {
        const baseActions = [
            { icon: 'edit', label: 'Editar', onclick: `advancedGroupsSystem.editTanda('${tanda.id}')` },
            { icon: 'share', label: 'Compartir', onclick: `advancedGroupsSystem.shareTanda('${tanda.id}')` },
            { icon: 'copy', label: 'Duplicar', onclick: `advancedGroupsSystem.duplicateTanda('${tanda.id}')` }
        ];
        
        if (tanda.status === 'active') {
            baseActions.push(
                { icon: 'bell', label: 'Recordatorios', onclick: `advancedGroupsSystem.sendPaymentReminders('${tanda.id}')` },
                { icon: 'pause', label: 'Pausar', onclick: `advancedGroupsSystem.pauseTanda('${tanda.id}')`, class: 'warning' }
            );
        }
        
        if (tanda.status !== 'completed') {
            baseActions.push(
                { separator: true },
                { icon: 'archive', label: 'Archivar', onclick: `advancedGroupsSystem.archiveTanda('${tanda.id}')`, class: 'warning' },
                { icon: 'times', label: 'Cancelar', onclick: `advancedGroupsSystem.cancelTanda('${tanda.id}')`, class: 'danger' }
            );
        }
        
        return baseActions.map(action => {
            if (action.separator) return '<div class="menu-separator"></div>';
            return `
                <div class="menu-item ${action.class || ''}" onclick="${action.onclick}">
                    <i class="fas fa-${action.icon}"></i>
                    <span>${action.label}</span>
                </div>`;
        }).join('');
    }
    
    calculateDaysToNext(tanda) {
        if (!tanda.nextPaymentDate) return 0;
        const today = new Date();
        const nextDate = new Date(tanda.nextPaymentDate);
        const diffTime = nextDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    calculateDaysToStart(tanda) {
        if (!tanda.startDate) return 0;
        const today = new Date();
        const startDate = new Date(tanda.startDate);
        const diffTime = startDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    getFrequencyLabel(frequency) {
        const labels = {
            'weekly': 'Semanal',
            'biweekly': 'Quincenal', 
            'monthly': 'Mensual'
        };
        return labels[frequency] || frequency;
    }
    
    toggleTandaDetails(tandaId) {
        console.log('🔄 Toggling tanda details for:', tandaId);
        const card = document.querySelector(`[data-tanda-id="${tandaId}"]`);
        const details = card?.querySelector('.tanda-expandable-details');
        const trigger = details?.querySelector('.details-trigger i');
        
        console.log('📋 Found elements:', { card: !!card, details: !!details, trigger: !!trigger });
        
        if (details) {
            const isExpanded = details.getAttribute('data-expanded') === 'true';
            const newState = !isExpanded;
            details.setAttribute('data-expanded', newState.toString());
            console.log('✅ Details toggled:', { was: isExpanded, now: newState });
            
            if (trigger) {
                trigger.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
                console.log('🔄 Arrow rotated:', isExpanded ? '0deg' : '180deg');
            }
        } else {
            console.error('❌ Could not find expandable details for tanda:', tandaId);
        }
    }
    
    toggleTandaActionsMenu(tandaId) {
        // Close all other menus first
        document.querySelectorAll('.dropdown-menu-enhanced').forEach(menu => {
            if (menu.getAttribute('data-tanda') !== tandaId) {
                menu.classList.remove('show');
            }
        });
        
        // Toggle current menu
        const menu = document.querySelector(`.dropdown-menu-enhanced[data-tanda="${tandaId}"]`);
        if (menu) {
            menu.classList.toggle('show');
        }
    }
    
    // ========================================
    // 📱 MOBILE TOUCH SUPPORT
    // ========================================
    
    addMobileTouchSupport(cards) {
        console.log('📱 Adding mobile touch support to', cards.length, 'cards');
        
        cards.forEach(card => {
            const tandaId = card.getAttribute('data-tanda-id');
            
            // Add touch feedback
            card.addEventListener('touchstart', (e) => {
                card.style.transform = 'scale(0.98)';
            });
            
            card.addEventListener('touchend', (e) => {
                card.style.transform = '';
            });
            
            // Improve dropdown behavior on mobile
            const dropdownTrigger = card.querySelector('.dropdown-trigger');
            if (dropdownTrigger) {
                dropdownTrigger.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                });
            }
            
            // Add swipe gesture for quick actions
            let startX, startY;
            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            });
            
            card.addEventListener('touchend', (e) => {
                if (!startX || !startY) return;
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const deltaX = endX - startX;
                const deltaY = endY - startY;
                
                // Detect horizontal swipe
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                        // Swipe right - show primary action
                        this.triggerPrimaryAction(tandaId);
                    } else {
                        // Swipe left - show menu
                        this.toggleTandaActionsMenu(tandaId);
                    }
                }
                
                startX = null;
                startY = null;
            });
        });
        
        // Add global touch handling for closing menus
        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.dropdown-enhanced')) {
                document.querySelectorAll('.dropdown-menu-enhanced.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }
    
    triggerPrimaryAction(tandaId) {
        console.log('👆 Triggering primary action for:', tandaId);
        const card = document.querySelector(`[data-tanda-id="${tandaId}"]`);
        const primaryBtn = card?.querySelector('.btn-primary-action');
        if (primaryBtn) {
            primaryBtn.click();
            // Visual feedback
            primaryBtn.style.transform = 'scale(1.1)';
            setTimeout(() => {
                primaryBtn.style.transform = '';
            }, 150);
        }
    }

    // ========================================
    // 🔍 FILTRADO DE TANDAS
    // ========================================
    
    filterTandasByStatus(status) {
        console.log('🔍 FILTER CLICKED: Filtering tandas by status:', status);
        console.log('🔍 Function context:', this);
        
        try {
            // Update active filter button
            this.updateFilterButtons('status', status);
            console.log('✅ Filter buttons updated');
            
            // Get current group filter
            const groupSelect = document.getElementById('group-filter');
            const currentGroupFilter = groupSelect ? groupSelect.value : '';
            console.log('🎯 Current group filter:', currentGroupFilter);
            
            // Apply combined filters
            this.applyTandasFilters(status, currentGroupFilter);
            console.log('✅ Filters applied');
            
            // Update URL without reload (for back/forward support)
            this.updateURLParams({ status: status === 'all' ? null : status });
            
            this.showNotification('success', `Filtro aplicado: ${this.getStatusFilterLabel(status)}`);
            console.log('✅ Filter operation completed successfully');
        } catch (error) {
            console.error('❌ Error in filterTandasByStatus:', error);
            this.showNotification('error', 'Error al aplicar filtro: ' + error.message);
        }
    }
    
    filterTandasByGroup(groupId) {
        console.log('🔍 Filtering tandas by group:', groupId);
        
        // Get current status filter
        const currentStatusFilter = this.getCurrentStatusFilter();
        
        // Apply combined filters
        this.applyTandasFilters(currentStatusFilter, groupId);
        
        // Update URL without reload
        this.updateURLParams({ group: groupId || null });
        
        const groupName = groupId ? this.getGroupName(groupId) : 'Todos los grupos';
        this.showNotification('success', `Grupo seleccionado: ${groupName}`);
    }
    
    applyTandasFilters(statusFilter, groupFilter) {
        console.log('🎯 APPLY FILTERS: Applying combined filters:', { status: statusFilter, group: groupFilter });
        
        // Get all tandas data
        const allTandas = this.getAllTandasData();
        console.log('📊 Total tandas available:', allTandas.length);
        console.log('📊 All tandas statuses:', allTandas.map(t => `${t.name}: ${t.status}`));
        
        // Apply status filter
        let filteredTandas = this.filterTandasByStatusLogic(allTandas, statusFilter);
        console.log(`📊 After status filter (${statusFilter}):`, filteredTandas.length);
        console.log('📊 Filtered tandas:', filteredTandas.map(t => `${t.name}: ${t.status}`));
        
        // Apply group filter
        if (groupFilter) {
            const beforeGroupFilter = filteredTandas.length;
            filteredTandas = filteredTandas.filter(tanda => tanda.groupId === groupFilter);
            console.log(`📊 After group filter (${groupFilter}): ${filteredTandas.length} (was ${beforeGroupFilter})`);
        }
        
        console.log(`🎯 FINAL RESULT: ${filteredTandas.length} tandas match criteria`);
        
        // Re-render tandas grid with filtered results
        this.renderFilteredTandas(filteredTandas, statusFilter, groupFilter);
        
        // Update stats with filtered data
        const stats = this.calculateTandasStats(filteredTandas);
        this.updateTandasStats(stats);
    }
    
    filterTandasByStatusLogic(tandas, statusFilter) {
        switch(statusFilter) {
            case 'all':
                return tandas;
            case 'active':
                return tandas.filter(tanda => tanda.status === 'active');
            case 'pending-payments':
                return tandas.filter(tanda => 
                    tanda.status === 'active' && tanda.paymentsPending > 0
                );
            case 'completed':
                return tandas.filter(tanda => tanda.status === 'completed');
            case 'upcoming':
                return tandas.filter(tanda => tanda.status === 'upcoming');
            default:
                return tandas;
        }
    }
    
    renderFilteredTandas(filteredTandas, statusFilter, groupFilter) {
        console.log('🎨 RENDER FILTERED: Starting render of filtered tandas');
        const tandasGrid = document.querySelector('.tandas-grid');
        if (!tandasGrid) {
            console.error('❌ tandas-grid element not found');
            return;
        }
        
        console.log('✅ tandas-grid found, proceeding with render');
        
        if (filteredTandas.length === 0) {
            console.log('📭 No filtered tandas, showing empty state');
            tandasGrid.innerHTML = this.renderEmptyFilterState(statusFilter, groupFilter);
            return;
        }
        
        console.log(`🎨 Rendering ${filteredTandas.length} filtered tandas`);
        
        // Render filtered tandas with V2 cards
        tandasGrid.innerHTML = filteredTandas.map((tanda, index) => {
            console.log(`🃏 Rendering filtered card ${index + 1}:`, tanda.name);
            return this.renderTandaCard(tanda);
        }).join('');
        
        console.log('✅ Filtered tandas HTML updated');
        
        // Re-add mobile touch support
        setTimeout(() => {
            const renderedCards = document.querySelectorAll('.tanda-card-v2');
            console.log(`📱 Adding touch support to ${renderedCards.length} rendered cards`);
            this.addMobileTouchSupport(renderedCards);
        }, 100);
    }
    
    renderEmptyFilterState(statusFilter, groupFilter) {
        const statusLabel = this.getStatusFilterLabel(statusFilter);
        const groupName = groupFilter ? this.getGroupName(groupFilter) : null;
        
        let message = `No se encontraron tandas`;
        if (statusFilter !== 'all' && groupName) {
            message += ` con estado "${statusLabel}" en el grupo "${groupName}"`;
        } else if (statusFilter !== 'all') {
            message += ` con estado "${statusLabel}"`;
        } else if (groupName) {
            message += ` en el grupo "${groupName}"`;
        }
        
        return `
            <div class="empty-filter-state">
                <div class="empty-icon">
                    <i class="fas fa-filter"></i>
                </div>
                <h3>Sin resultados</h3>
                <p>${message}</p>
                <div class="empty-actions">
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.clearTandasFilters()">
                        <i class="fas fa-times"></i> Limpiar filtros
                    </button>
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.showCreateTandaModal()">
                        <i class="fas fa-plus"></i> Nueva Tanda
                    </button>
                </div>
            </div>
        `;
    }
    
    clearTandasFilters() {
        console.log('🧹 Clearing all tanda filters');
        
        // Reset filter buttons
        this.updateFilterButtons('status', 'all');
        
        // Reset group selector
        const groupSelect = document.getElementById('group-filter');
        if (groupSelect) {
            groupSelect.value = '';
        }
        
        // Show all tandas
        this.loadTandasContent();
        
        // Clear URL params
        this.updateURLParams({ status: null, group: null });
        
        this.showNotification('success', 'Filtros eliminados - mostrando todas las tandas');
    }
    
    updateFilterButtons(filterType, activeValue) {
        const filterButtons = document.querySelectorAll(`[data-filter]`);
        filterButtons.forEach(btn => {
            const btnFilter = btn.getAttribute('data-filter');
            if (btnFilter === activeValue) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    getCurrentStatusFilter() {
        const activeBtn = document.querySelector('.filter-btn.active[data-filter]');
        return activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
    }
    
    getStatusFilterLabel(status) {
        const labels = {
            'all': 'Todas',
            'active': 'Activas', 
            'pending-payments': 'Con Pagos Pendientes',
            'completed': 'Completadas',
            'upcoming': 'Próximamente'
        };
        return labels[status] || status;
    }
    
    getGroupName(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        return group ? `${group.avatar} ${group.name}` : 'Grupo desconocido';
    }
    
    getAllTandasData() {
        // Return the same mock data used in loadTandasContent
        return [
            {
                id: 'tanda_1',
                name: 'Tanda Enero 2025',
                groupId: 'group_1', 
                groupName: 'Cooperativa Familiar',
                groupAvatar: '👨‍👩‍👧‍👦',
                status: 'active',
                progress: 75,
                currentRound: 3,
                totalRounds: 4,
                roundAmount: 6000,
                totalAmount: 24000,
                nextPaymentDate: '2025-01-15',
                nextBeneficiary: 'María Rodriguez',
                paymentsPending: 2,
                participants: 4,
                paymentFrequency: 'monthly'
            },
            {
                id: 'tanda_2',
                name: 'Tanda Profesionales Q4',
                groupId: 'group_2',
                groupName: 'Red Profesional TGU',
                groupAvatar: '👔',
                status: 'active', 
                progress: 50,
                currentRound: 2,
                totalRounds: 4,
                roundAmount: 12000,
                totalAmount: 48000,
                nextPaymentDate: '2025-01-20',
                nextBeneficiary: 'Carlos López',
                paymentsPending: 1,
                participants: 4,
                paymentFrequency: 'monthly'
            },
            {
                id: 'tanda_3',
                name: 'Tanda Comunitaria Diciembre',
                groupId: 'group_3',
                groupName: 'Grupo Comunitario',
                groupAvatar: '🏘️',
                status: 'completed',
                progress: 100,
                currentRound: 6,
                totalRounds: 6,
                roundAmount: 3000,
                totalAmount: 18000,
                completedDate: '2024-12-30',
                participants: 6,
                paymentFrequency: 'biweekly'
            },
            {
                id: 'tanda_4',
                name: 'Tanda Familiar Febrero',
                groupId: 'group_1',
                groupName: 'Cooperativa Familiar',
                groupAvatar: '👨‍👩‍👧‍👦',
                status: 'upcoming',
                progress: 0,
                currentRound: 0,
                totalRounds: 4,
                roundAmount: 6000,
                totalAmount: 24000,
                startDate: '2025-02-01',
                participants: 4,
                paymentFrequency: 'monthly'
            },
            {
                id: 'tanda_5',
                name: 'Tanda Express Semanal',
                groupId: 'group_4',
                groupName: 'Emprendedores Unidos',
                groupAvatar: '💼',
                status: 'active',
                progress: 25,
                currentRound: 1,
                totalRounds: 4,
                roundAmount: 4000,
                totalAmount: 16000,
                nextPaymentDate: '2025-01-12',
                nextBeneficiary: 'Ana García',
                paymentsPending: 3,
                participants: 4,
                paymentFrequency: 'weekly'
            }
        ];
    }
    
    updateTandasStats(stats) {
        // Update the stats section if it exists
        const statsContainer = document.querySelector('.tandas-stats');
        if (statsContainer && stats) {
            statsContainer.innerHTML = this.renderTandasStats(stats);
        }
    }
    
    updateURLParams(params) {
        const url = new URL(window.location);
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.replaceState({}, '', url);
    }

    // Placeholder methods for new tanda actions
    managePendingPayments(tandaId) {
        console.log('💰 Opening payment management for tanda:', tandaId);
        
        const tanda = this.getAllTandasData().find(t => t.id === tandaId);
        if (!tanda) {
            this.showNotification('error', 'Tanda no encontrada');
            return;
        }
        
        // Get pending payments data
        const pendingPayments = this.getPendingPaymentsForTanda(tandaId);
        
        // Get all participants for comprehensive view
        const allParticipants = this.getAllParticipantsForTanda(tandaId);
        const paidParticipants = allParticipants.filter(p => p.status === 'paid');
        const overduePayments = pendingPayments.filter(p => p.isOverdue);
        
        const modal = this.createModal('manage-payments', `💰 Gestionar Pagos - ${tanda.name}`, `
            <div class="payments-management-container">
                <div class="tanda-payment-header">
                    <div class="tanda-info-summary">
                        <div class="tanda-avatar">${tanda.groupAvatar}</div>
                        <div class="tanda-details">
                            <h3>${tanda.name}</h3>
                            <p>${tanda.groupName}</p>
                            <div class="payment-cycle-info">
                                <span class="cycle-current">Ronda ${tanda.currentRound}/${tanda.totalRounds}</span>
                                <span class="amount-info">L. ${tanda.roundAmount.toLocaleString()} por participante</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="payments-stats">
                        <div class="stat-card success">
                            <div class="stat-value">${paidParticipants.length}</div>
                            <div class="stat-label">Ya Pagaron</div>
                        </div>
                        <div class="stat-card ${pendingPayments.length > 0 ? 'warning' : 'success'}">
                            <div class="stat-value">${pendingPayments.length}</div>
                            <div class="stat-label">Pendientes</div>
                        </div>
                        <div class="stat-card ${overduePayments.length > 0 ? 'urgent' : 'neutral'}">
                            <div class="stat-value">${overduePayments.length}</div>
                            <div class="stat-label">Vencidos</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">L. ${(pendingPayments.length * tanda.roundAmount).toLocaleString()}</div>
                            <div class="stat-label">Monto Pendiente</div>
                        </div>
                    </div>
                </div>
                
                <!-- Payment View Toggle -->
                <div class="payment-view-controls">
                    <div class="view-toggle-buttons">
                        <button class="btn btn-sm view-toggle active" data-view="pending" onclick="advancedGroupsSystem.switchPaymentView('pending', '${tandaId}')">
                            <i class="fas fa-exclamation-triangle"></i> Solo Pendientes (${pendingPayments.length})
                        </button>
                        <button class="btn btn-sm view-toggle" data-view="all" onclick="advancedGroupsSystem.switchPaymentView('all', '${tandaId}')">
                            <i class="fas fa-users"></i> Todos los Participantes (${allParticipants.length})
                        </button>
                        <button class="btn btn-sm view-toggle" data-view="paid" onclick="advancedGroupsSystem.switchPaymentView('paid', '${tandaId}')">
                            <i class="fas fa-check-circle"></i> Solo Pagados (${paidParticipants.length})
                        </button>
                    </div>
                    
                    <div class="payment-filters">
                        <select class="form-select form-select-sm" id="riskLevelFilter" onchange="advancedGroupsSystem.filterByRiskLevel(this.value)">
                            <option value="">Todos los Niveles</option>
                            <option value="low">🟢 Bajo Riesgo</option>
                            <option value="medium">🟡 Riesgo Medio</option>
                            <option value="high">🟠 Alto Riesgo</option>
                            <option value="critical">🔴 Crítico</option>
                        </select>
                    </div>
                </div>
                
                <!-- Dynamic Participants List -->
                <div class="participants-list-container" id="participants-list-container">
                    ${this.renderParticipantsList(pendingPayments, 'pending', tandaId)}
                </div>
                
                <div class="bulk-payment-actions">
                    <h4><i class="fas fa-tasks"></i> Acciones Masivas</h4>
                    <div class="bulk-actions-grid">
                        <button class="btn btn-info" onclick="advancedGroupsSystem.sendBulkReminders('${tandaId}')">
                            <i class="fas fa-megaphone"></i> Enviar Recordatorios a Todos
                        </button>
                        <button class="btn btn-warning" onclick="advancedGroupsSystem.generatePaymentReport('${tandaId}')">
                            <i class="fas fa-file-alt"></i> Generar Reporte
                        </button>
                        <button class="btn btn-primary" onclick="advancedGroupsSystem.scheduleAutomaticReminders('${tandaId}')">
                            <i class="fas fa-robot"></i> Programar Recordatorios
                        </button>
                    </div>
                </div>
                
                <div class="payment-history-section">
                    <h4><i class="fas fa-history"></i> Historial de Pagos Recientes</h4>
                    <div class="recent-payments">
                        ${this.getRecentPayments(tandaId).map(payment => `
                            <div class="payment-history-item">
                                <div class="payment-participant">
                                    <i class="fas fa-user"></i>
                                    ${payment.participantName}
                                </div>
                                <div class="payment-amount">L. ${payment.amount.toLocaleString()}</div>
                                <div class="payment-date">${payment.date}</div>
                                <div class="payment-method">
                                    <i class="fas fa-${payment.method === 'cash' ? 'money-bill' : payment.method === 'transfer' ? 'university' : 'mobile-alt'}"></i>
                                    ${payment.methodLabel}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `, true);
        
        // Add custom styling and event handlers
        modal.style.maxWidth = '900px';
        modal.style.width = '95%';
        
        // Add modal actions
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.refreshPaymentStatus('${tandaId}')">
                <i class="fas fa-sync"></i> Actualizar Estado
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
        
        this.showNotification('success', 'Gestión de pagos cargada exitosamente');
    }
    
    // Enhanced participants list rendering
    renderParticipantsList(participants, viewType, tandaId) {
        let title, icon, emptyMessage;
        
        switch(viewType) {
            case 'pending':
                title = 'Participantes con Pagos Pendientes';
                icon = 'exclamation-triangle text-warning';
                emptyMessage = '¡Excelente! Todos los participantes han pagado.';
                break;
            case 'paid':
                title = 'Participantes que Ya Pagaron';
                icon = 'check-circle text-success';
                emptyMessage = 'Aún no hay pagos registrados para esta ronda.';
                break;
            case 'all':
                title = 'Todos los Participantes';
                icon = 'users';
                emptyMessage = 'No hay participantes en esta tanda.';
                break;
        }
        
        if (participants.length === 0) {
            return `
                <div class="participants-section">
                    <h4><i class="fas ${icon}"></i> ${title}</h4>
                    <div class="empty-participants-state">
                        <div class="empty-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h5>${emptyMessage}</h5>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="participants-section">
                <h4><i class="fas ${icon}"></i> ${title} (${participants.length})</h4>
                
                ${participants.map(participant => {
                    if (viewType === 'pending' || (viewType === 'all' && participant.status === 'pending')) {
                        return this.renderPendingParticipant(participant, tandaId);
                    } else {
                        return this.renderPaidParticipant(participant);
                    }
                }).join('')}
            </div>
        `;
    }
    
    renderPendingParticipant(payment, tandaId) {
        const riskColorMap = {
            low: 'success',
            medium: 'warning', 
            high: 'danger',
            critical: 'critical'
        };
        
        const riskLabelMap = {
            low: '🟢 Bajo',
            medium: '🟡 Medio',
            high: '🟠 Alto', 
            critical: '🔴 Crítico'
        };
        
        return `
            <div class="payment-item ${payment.isOverdue ? 'overdue' : ''} risk-${payment.riskLevel}" 
                 data-payment-id="${payment.id}" data-risk="${payment.riskLevel}">
                <div class="participant-info">
                    <div class="participant-avatar">
                        ${payment.avatar || '<i class="fas fa-user"></i>'}
                    </div>
                    <div class="participant-details">
                        <div class="participant-header">
                            <h5>${payment.participantName}</h5>
                            <span class="risk-badge risk-${payment.riskLevel}">
                                ${riskLabelMap[payment.riskLevel]} Riesgo
                            </span>
                        </div>
                        <p class="payment-status ${payment.isOverdue ? 'overdue' : 'pending'}">
                            <i class="fas fa-clock"></i>
                            ${payment.isOverdue ? 'Vencido' : 'Pendiente'}
                            ${payment.daysOverdue > 0 ? ` (${payment.daysOverdue} días)` : ''}
                            ${payment.escalated ? ' • <span class="escalated">Escalado</span>' : ''}
                        </p>
                        <div class="contact-info">
                            <span><i class="fas fa-phone"></i> ${payment.phone}</span>
                            ${payment.email ? `<span><i class="fas fa-envelope"></i> ${payment.email}</span>` : ''}
                        </div>
                        ${payment.notes ? `
                        <div class="payment-notes">
                            <i class="fas fa-sticky-note"></i>
                            <span>${payment.notes}</span>
                        </div>
                        ` : ''}
                        ${payment.lastReminder ? `
                        <div class="last-reminder">
                            <i class="fas fa-bell"></i>
                            <span>Último recordatorio: ${payment.lastReminder}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="payment-amount">
                    <div class="amount-display">
                        <span class="currency">L.</span>
                        <span class="amount">${payment.amount.toLocaleString()}</span>
                    </div>
                    <div class="due-date ${payment.isOverdue ? 'overdue' : ''}">
                        ${payment.isOverdue ? 'Vencido:' : 'Vence:'} ${payment.dueDate}
                    </div>
                </div>
                
                <div class="payment-actions">
                    <button class="btn btn-success btn-sm" onclick="advancedGroupsSystem.markPaymentReceived('${payment.id}', '${tandaId}')">
                        <i class="fas fa-check"></i> Marcar Pagado
                    </button>
                    <button class="btn btn-info btn-sm" onclick="advancedGroupsSystem.sendPaymentReminder('${payment.id}', '${tandaId}')">
                        <i class="fas fa-bell"></i> Recordar
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-secondary btn-sm dropdown-toggle" onclick="advancedGroupsSystem.togglePaymentActions('${payment.id}')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu" id="payment-actions-${payment.id}">
                            <a href="#" onclick="advancedGroupsSystem.contactParticipant('${payment.id}')">
                                <i class="fas fa-phone"></i> Contactar Directamente
                            </a>
                            <a href="#" onclick="advancedGroupsSystem.viewParticipantHistory('${payment.id}')">
                                <i class="fas fa-history"></i> Ver Historial
                            </a>
                            <a href="#" onclick="advancedGroupsSystem.extendPaymentDeadline('${payment.id}')">
                                <i class="fas fa-calendar-plus"></i> Extender Plazo
                            </a>
                            <a href="#" onclick="advancedGroupsSystem.addPaymentNote('${payment.id}')" class="text-info">
                                <i class="fas fa-sticky-note"></i> Agregar Nota
                            </a>
                            <a href="#" onclick="advancedGroupsSystem.applyLateFee('${payment.id}')" class="text-warning">
                                <i class="fas fa-exclamation-triangle"></i> Aplicar Mora
                            </a>
                            ${payment.isOverdue ? `
                            <div class="dropdown-divider"></div>
                            <a href="#" onclick="advancedGroupsSystem.escalatePayment('${payment.id}')" class="text-danger">
                                <i class="fas fa-gavel"></i> Escalar Caso
                            </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPaidParticipant(participant) {
        return `
            <div class="payment-item paid" data-participant-id="${participant.id}">
                <div class="participant-info">
                    <div class="participant-avatar">
                        ${participant.avatar || '<i class="fas fa-user"></i>'}
                    </div>
                    <div class="participant-details">
                        <div class="participant-header">
                            <h5>${participant.name}</h5>
                            <span class="status-badge success">
                                <i class="fas fa-check-circle"></i> Pagado
                            </span>
                        </div>
                        <p class="payment-status paid">
                            <i class="fas fa-check"></i>
                            Pagó el ${participant.paidDate}
                        </p>
                        <div class="contact-info">
                            <span><i class="fas fa-phone"></i> ${participant.phone}</span>
                            ${participant.email ? `<span><i class="fas fa-envelope"></i> ${participant.email}</span>` : ''}
                        </div>
                        <div class="payment-method-info">
                            <i class="fas fa-${participant.paymentMethod === 'cash' ? 'money-bill' : participant.paymentMethod === 'transfer' ? 'university' : 'mobile-alt'}"></i>
                            <span>Método: ${participant.paymentMethod === 'cash' ? 'Efectivo' : participant.paymentMethod === 'transfer' ? 'Transferencia' : 'Pago Móvil'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="payment-amount">
                    <div class="amount-display success">
                        <span class="currency">L.</span>
                        <span class="amount">${participant.amount.toLocaleString()}</span>
                    </div>
                    <div class="paid-date">
                        <i class="fas fa-check-circle"></i>
                        Completado
                    </div>
                </div>
                
                <div class="payment-actions">
                    <button class="btn btn-outline-info btn-sm" onclick="advancedGroupsSystem.viewPaymentDetails('${participant.id}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="advancedGroupsSystem.sendPaymentConfirmation('${participant.id}')">
                        <i class="fas fa-receipt"></i> Comprobante
                    </button>
                </div>
            </div>
        `;
    }
    
    // View switching functionality
    switchPaymentView(viewType, tandaId) {
        console.log('🔄 Switching to view:', viewType);
        
        // Update active button
        document.querySelectorAll('.view-toggle').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
        
        const allParticipants = this.getAllParticipantsForTanda(tandaId);
        const container = document.getElementById('participants-list-container');
        
        let participantsToShow;
        switch(viewType) {
            case 'pending':
                participantsToShow = this.getPendingPaymentsForTanda(tandaId);
                break;
            case 'paid':
                participantsToShow = allParticipants.filter(p => p.status === 'paid');
                break;
            case 'all':
            default:
                participantsToShow = allParticipants;
                break;
        }
        
        container.innerHTML = this.renderParticipantsList(participantsToShow, viewType, tandaId);
        this.showNotification('info', `Vista cambiada: ${this.getViewTypeLabel(viewType)}`);
    }
    
    getViewTypeLabel(viewType) {
        const labels = {
            'pending': 'Solo Pendientes',
            'paid': 'Solo Pagados', 
            'all': 'Todos los Participantes'
        };
        return labels[viewType] || 'Vista desconocida';
    }
    
    filterByRiskLevel(riskLevel) {
        console.log('🎯 Filtering by risk level:', riskLevel);
        
        const paymentItems = document.querySelectorAll('.payment-item');
        
        paymentItems.forEach(item => {
            if (!riskLevel || item.dataset.risk === riskLevel) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
        
        const visibleCount = document.querySelectorAll('.payment-item[style="display: flex;"], .payment-item:not([style*="display: none"])').length;
        this.showNotification('info', `Filtro aplicado: ${visibleCount} participantes visibles`);
    }
    
    // Additional payment management functions  
    viewParticipantHistory(paymentId) {
        console.log('📜 Viewing participant history:', paymentId);
        this.showNotification('info', 'Cargando historial del participante...');
    }
    
    addPaymentNote(paymentId) {
        console.log('📝 Adding payment note:', paymentId);
        this.showNotification('info', 'Abriendo editor de notas...');
    }
    
    viewPaymentDetails(participantId) {
        console.log('🔍 Viewing payment details:', participantId);
        this.showNotification('info', 'Mostrando detalles del pago...');
    }
    
    sendPaymentConfirmation(participantId) {
        console.log('📧 Sending payment confirmation:', participantId);
        this.showNotification('success', 'Comprobante de pago enviado');
    }
    
    // Support functions for payment management
    getPendingPaymentsForTanda(tandaId) {
        // Enhanced mock data with more realistic scenarios
        return [
            {
                id: 'payment_1',
                participantName: 'María Rodriguez',
                phone: '+504 9876-5432',
                email: 'maria.rodriguez@email.com',
                isOverdue: true,
                daysOverdue: 3,
                dueDate: '2025-01-12',
                status: 'pending',
                amount: 6000,
                lastReminder: '2025-01-10',
                paymentMethod: null,
                notes: 'Prometió pagar este fin de semana',
                riskLevel: 'high',
                participantId: 'part_1',
                avatar: '👩‍💼'
            },
            {
                id: 'payment_2',
                participantName: 'Carlos López',
                phone: '+504 8765-4321',
                email: null,
                isOverdue: false,
                daysOverdue: 0,
                dueDate: '2025-01-15',
                status: 'pending',
                amount: 6000,
                lastReminder: null,
                paymentMethod: null,
                notes: 'Siempre paga a tiempo',
                riskLevel: 'low',
                participantId: 'part_2',
                avatar: '👨‍💻'
            },
            {
                id: 'payment_3',
                participantName: 'Ana García',
                phone: '+504 7654-3210',
                email: 'ana.garcia@email.com',
                isOverdue: true,
                daysOverdue: 1,
                dueDate: '2025-01-14',
                status: 'pending',
                amount: 6000,
                lastReminder: '2025-01-13',
                paymentMethod: null,
                notes: 'Dificultades temporales',
                riskLevel: 'medium',
                participantId: 'part_3',
                avatar: '👩‍🏫'
            },
            {
                id: 'payment_4',
                participantName: 'Roberto Mendez',
                phone: '+504 7890-1234',
                email: 'roberto.mendez@email.com',
                isOverdue: true,
                daysOverdue: 7,
                status: 'pending',
                amount: 6000,
                lastReminder: '2025-01-07',
                paymentMethod: null,
                notes: 'No contesta llamadas',
                riskLevel: 'critical',
                participantId: 'part_4',
                avatar: '👨‍🔧',
                dueDate: '2025-01-08',
                escalated: true
            }
        ];
    }
    
    getAllParticipantsForTanda(tandaId) {
        // Complete participant list including those who have paid
        return [
            // Paid participants
            {
                id: 'part_paid_1',
                name: 'Luis Hernández',
                phone: '+504 9999-8888',
                email: 'luis.hernandez@email.com',
                status: 'paid',
                paidDate: '2025-01-08',
                paymentMethod: 'transfer',
                amount: 6000,
                avatar: '👨‍⚕️'
            },
            {
                id: 'part_paid_2', 
                name: 'Carmen Flores',
                phone: '+504 8888-7777',
                email: 'carmen.flores@email.com',
                status: 'paid',
                paidDate: '2025-01-07',
                paymentMethod: 'cash',
                amount: 6000,
                avatar: '👩‍🎨'
            },
            // Pending participants (from getPendingPaymentsForTanda)
            ...this.getPendingPaymentsForTanda(tandaId).map(p => ({
                id: p.participantId,
                name: p.participantName,
                phone: p.phone,
                email: p.email,
                status: 'pending',
                amount: p.amount,
                avatar: p.avatar,
                isOverdue: p.isOverdue,
                daysOverdue: p.daysOverdue,
                dueDate: p.dueDate
            }))
        ];
    }
    
    getRecentPayments(tandaId) {
        // Mock data for recent payments
        return [
            {
                participantName: 'Luis Hernández',
                amount: 6000,
                date: '2025-01-08',
                method: 'transfer',
                methodLabel: 'Transferencia'
            },
            {
                participantName: 'Carmen Flores',
                amount: 6000,
                date: '2025-01-07',
                method: 'cash',
                methodLabel: 'Efectivo'
            },
            {
                participantName: 'Pedro Martínez',
                amount: 6000,
                date: '2025-01-06',
                method: 'mobile',
                methodLabel: 'Pago Móvil'
            }
        ];
    }
    
    // Payment action functions
    markPaymentReceived(paymentId, tandaId) {
        console.log('✅ Marking payment as received:', paymentId);
        
        const modal = this.createModal('confirm-payment', '✅ Confirmar Pago Recibido', `
            <div class="payment-confirmation">
                <div class="confirmation-icon">
                    <i class="fas fa-check-circle text-success"></i>
                </div>
                <h4>¿Confirmar pago recibido?</h4>
                <p>Esta acción marcará el pago como completado y actualizará el estado de la tanda.</p>
                
                <div class="payment-details-form">
                    <div class="form-group">
                        <label>Método de pago:</label>
                        <select class="form-control" id="paymentMethod">
                            <option value="cash">Efectivo</option>
                            <option value="transfer">Transferencia Bancaria</option>
                            <option value="mobile">Pago Móvil</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Notas adicionales (opcional):</label>
                        <textarea class="form-control" id="paymentNotes" placeholder="Ej: Pago recibido el día de hoy..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Fecha del pago:</label>
                        <input type="date" class="form-control" id="paymentDate" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
            </div>
        `);
        
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-success" onclick="advancedGroupsSystem.confirmPaymentReceived('${paymentId}', '${tandaId}')">
                <i class="fas fa-check"></i> Confirmar Pago
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    }
    
    confirmPaymentReceived(paymentId, tandaId) {
        const method = document.getElementById('paymentMethod').value;
        const notes = document.getElementById('paymentNotes').value;
        const date = document.getElementById('paymentDate').value;
        
        console.log('💰 Payment confirmed:', { paymentId, tandaId, method, notes, date });
        
        this.closeModal();
        this.showNotification('success', 'Pago registrado exitosamente');
        
        // Refresh the payment management view
        setTimeout(() => {
            this.managePendingPayments(tandaId);
        }, 1000);
    }
    
    sendPaymentReminder(paymentId, tandaId) {
        console.log('🔔 Sending payment reminder for:', paymentId);
        
        const modal = this.createModal('payment-reminder', '🔔 Enviar Recordatorio', `
            <div class="reminder-config">
                <h4>Selecciona el método de recordatorio:</h4>
                
                <div class="reminder-options">
                    <div class="reminder-option" onclick="advancedGroupsSystem.selectReminderMethod('sms')">
                        <i class="fas fa-sms"></i>
                        <h5>SMS</h5>
                        <p>Mensaje de texto directo</p>
                    </div>
                    
                    <div class="reminder-option" onclick="advancedGroupsSystem.selectReminderMethod('whatsapp')">
                        <i class="fab fa-whatsapp"></i>
                        <h5>WhatsApp</h5>
                        <p>Mensaje por WhatsApp</p>
                    </div>
                    
                    <div class="reminder-option" onclick="advancedGroupsSystem.selectReminderMethod('call')">
                        <i class="fas fa-phone"></i>
                        <h5>Llamada</h5>
                        <p>Llamada telefónica</p>
                    </div>
                    
                    <div class="reminder-option" onclick="advancedGroupsSystem.selectReminderMethod('email')">
                        <i class="fas fa-envelope"></i>
                        <h5>Email</h5>
                        <p>Correo electrónico</p>
                    </div>
                </div>
                
                <div class="reminder-message">
                    <label>Mensaje personalizado:</label>
                    <textarea class="form-control" id="reminderMessage" placeholder="Hola [NOMBRE], te recordamos que tienes un pago pendiente de L. [MONTO] para la tanda [TANDA]. Fecha límite: [FECHA].">Hola, te recordamos que tienes un pago pendiente de tu tanda. Por favor, realiza tu aporte a la brevedad posible.</textarea>
                </div>
            </div>
        `);
        
        this.selectedPaymentId = paymentId;
        this.selectedTandaId = tandaId;
        
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.sendSelectedReminder()">
                <i class="fas fa-paper-plane"></i> Enviar Recordatorio
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    }
    
    selectReminderMethod(method) {
        document.querySelectorAll('.reminder-option').forEach(opt => opt.classList.remove('selected'));
        event.currentTarget.classList.add('selected');
        this.selectedReminderMethod = method;
    }
    
    sendSelectedReminder() {
        const message = document.getElementById('reminderMessage').value;
        const method = this.selectedReminderMethod || 'sms';
        
        console.log('📤 Sending reminder:', { 
            method, 
            paymentId: this.selectedPaymentId,
            tandaId: this.selectedTandaId,
            message 
        });
        
        this.closeModal();
        this.showNotification('success', `Recordatorio enviado por ${method.toUpperCase()}`);
        
        // Show follow-up notification
        setTimeout(() => {
            this.showNotification('info', 'El participante será notificado en los próximos minutos');
        }, 2000);
    }
    
    // Additional payment management functions
    togglePaymentActions(paymentId) {
        const menu = document.getElementById(`payment-actions-${paymentId}`);
        if (menu) {
            // Close other open menus
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });
            menu.classList.toggle('show');
        }
    }
    
    contactParticipant(paymentId) {
        console.log('📞 Contacting participant:', paymentId);
        this.showNotification('info', 'Abriendo opciones de contacto...');
        // Implementation for contacting participant
    }
    
    extendPaymentDeadline(paymentId) {
        console.log('📅 Extending payment deadline:', paymentId);
        this.showNotification('info', 'Extendiendo plazo de pago...');
        // Implementation for extending deadline
    }
    
    applyLateFee(paymentId) {
        console.log('💸 Applying late fee:', paymentId);
        this.showNotification('warning', 'Aplicando mora por atraso...');
        // Implementation for applying late fees
    }
    
    escalatePayment(paymentId) {
        console.log('⚡ Escalating payment issue:', paymentId);
        this.showNotification('error', 'Escalando caso de pago...');
        // Implementation for escalating payment issues
    }
    
    // Bulk actions
    sendBulkReminders(tandaId) {
        console.log('📢 Sending bulk reminders for tanda:', tandaId);
        this.showNotification('info', 'Enviando recordatorios masivos...');
        
        setTimeout(() => {
            this.showNotification('success', 'Recordatorios enviados a todos los participantes con pagos pendientes');
        }, 2000);
    }
    
    generatePaymentReport(tandaId) {
        console.log('📊 Generating payment report for tanda:', tandaId);
        this.showNotification('info', 'Generando reporte de pagos...');
        
        setTimeout(() => {
            this.showNotification('success', 'Reporte generado y descargado');
        }, 3000);
    }
    
    scheduleAutomaticReminders(tandaId) {
        console.log('🤖 Scheduling automatic reminders for tanda:', tandaId);
        this.showNotification('info', 'Programando recordatorios automáticos...');
        
        setTimeout(() => {
            this.showNotification('success', 'Recordatorios automáticos configurados');
        }, 2000);
    }
    
    refreshPaymentStatus(tandaId) {
        console.log('🔄 Refreshing payment status for tanda:', tandaId);
        this.showNotification('info', 'Actualizando estado de pagos...');
        
        setTimeout(() => {
            this.managePendingPayments(tandaId);
            this.showNotification('success', 'Estado de pagos actualizado');
        }, 1500);
    }
    
    viewTandaSummary(tandaId) {
        this.showNotification('info', 'Cargando resumen de tanda completada...');
        console.log('📊 Viewing summary for tanda:', tandaId);
        // Implementation for viewing tanda summary
    }

    showNotifications() {
        console.log('🔔 Mostrando notificaciones');
        
        const notifications = this.getPendingNotifications();
        
        const modal = this.createModal('notifications', '🔔 Notificaciones', `
            <div class="notifications-list">
                ${notifications.length > 0 ? 
                    notifications.map(notif => `
                        <div class="notification-item ${notif.type}">
                            <div class="notification-icon">
                                <i class="fas fa-${this.getNotificationIcon(notif.type)}"></i>
                            </div>
                            <div class="notification-text">
                                <div class="notification-message">${notif.message}</div>
                                <div class="notification-time">${notif.time || 'Hace un momento'}</div>
                            </div>
                        </div>
                    `).join('')
                    : '<div class="empty-notifications">No tienes notificaciones nuevas</div>'
                }
            </div>
        `);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
    }

    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    updateResponsiveLayout() {
        // Actualizar layout responsivo
        const container = document.querySelector('.container');
        if (container) {
            const width = window.innerWidth;
            container.classList.toggle('mobile', width < 768);
            container.classList.toggle('tablet', width >= 768 && width < 1024);
        }
    }

    // ========================================
    // 🔧 FUNCIONES TANDAS Y MATCHING PLACEHOLDER
    // ========================================

    async loadTandasContent(groupId = null) {
        console.log('📊 Cargando contenido de tandas V2', groupId ? `para grupo ${groupId}` : '');
        console.log('🎨 Using new tanda-card-v2 design system');
        
        // Update stats counters
        this.updateTandasStats();
        
        const tandasList = document.getElementById('tandasList');
        if (!tandasList) return;

        // Datos simulados de tandas completos
        const allTandas = [
            {
                id: 'tanda_1',
                name: 'Tanda Enero 2025',
                groupId: 'group_1', 
                groupName: 'Cooperativa Familiar',
                groupAvatar: '👨‍👩‍👧‍👦',
                status: 'active',
                progress: 75,
                currentRound: 3,
                totalRounds: 4,
                roundAmount: 6000,
                totalAmount: 24000,
                nextPaymentDate: '2025-01-15',
                nextBeneficiary: 'María Rodriguez',
                paymentsPending: 2,
                participants: 4,
                paymentFrequency: 'monthly'
            },
            {
                id: 'tanda_2',
                name: 'Tanda Profesionales Q4',
                groupId: 'group_2',
                groupName: 'Red Profesional TGU',
                groupAvatar: '👔',
                status: 'active', 
                progress: 50,
                currentRound: 2,
                totalRounds: 4,
                roundAmount: 12000,
                totalAmount: 48000,
                nextPaymentDate: '2025-01-20',
                nextBeneficiary: 'Carlos López',
                paymentsPending: 1,
                participants: 4,
                paymentFrequency: 'monthly'
            },
            {
                id: 'tanda_3',
                name: 'Tanda Comunitaria Diciembre',
                groupId: 'group_3',
                groupName: 'Grupo Comunitario',
                groupAvatar: '🏘️',
                status: 'completed',
                progress: 100,
                currentRound: 6,
                totalRounds: 6,
                roundAmount: 3000,
                totalAmount: 18000,
                completedDate: '2024-12-30',
                participants: 6,
                paymentFrequency: 'biweekly'
            },
            {
                id: 'tanda_4',
                name: 'Tanda Familiar Febrero',
                groupId: 'group_1',
                groupName: 'Cooperativa Familiar',
                groupAvatar: '👨‍👩‍👧‍👦',
                status: 'upcoming',
                progress: 0,
                currentRound: 0,
                totalRounds: 4,
                roundAmount: 6000,
                totalAmount: 24000,
                startDate: '2025-02-01',
                participants: 4,
                paymentFrequency: 'monthly'
            },
            {
                id: 'tanda_5',
                name: 'Tanda Express Semanal',
                groupId: 'group_4',
                groupName: 'Emprendedores Unidos',
                groupAvatar: '💼',
                status: 'active',
                progress: 25,
                currentRound: 1,
                totalRounds: 4,
                roundAmount: 4000,
                totalAmount: 16000,
                nextPaymentDate: '2025-01-12',
                nextBeneficiary: 'Ana García',
                paymentsPending: 3,
                participants: 4,
                paymentFrequency: 'weekly'
            }
        ];

        // Filtrar tandas por grupo si se especifica
        const filteredTandas = groupId ? 
            allTandas.filter(tanda => tanda.groupId === groupId) : 
            allTandas;

        // Generar estadísticas del dashboard
        const stats = this.calculateTandasStats(filteredTandas);
        
        // Renderizar solo las tarjetas de tandas (sin duplicar la estructura)
        console.log('🎨 Rendering', filteredTandas.length, 'tandas with clean design');
        
        // Limpiar el loading state
        const loadingState = document.getElementById('tandasLoading');
        if (loadingState) {
            loadingState.remove();
        }
        
        // Renderizar solo las tarjetas de tandas
        if (filteredTandas.length > 0) {
            tandasList.innerHTML = filteredTandas.map((tanda, index) => {
                console.log(`🃏 Rendering card ${index + 1}:`, tanda.name);
                return this.renderTandaCard(tanda);
            }).join('');
        } else {
            tandasList.innerHTML = this.renderEmptyTandasState();
        }
        
        // Post-render verification
        setTimeout(() => {
            const renderedCards = document.querySelectorAll('.tanda-card-v2');
            console.log('✅ Post-render verification:', renderedCards.length, 'V2 cards found');
            
            // Add event listeners for mobile touch events
            this.addMobileTouchSupport(renderedCards);
        }, 100);

        // Actualizar breadcrumb si hay filtro por grupo
        if (groupId) {
            this.updateTandasBreadcrumb(groupId);
        }
    }

    async loadMatchingContent() {
        console.log('🔍 Cargando contenido de matching');
        this.showNotification('🔍 Cargando sistema de matching inteligente...', 'info');

        const matchingContainer = document.getElementById('matchingContainer');
        if (!matchingContainer) return;

        try {
            // Mostrar loading
            matchingContainer.innerHTML = this.getLoadingHTML('Analizando perfiles compatibles...');

            // Simular delay para carga de datos
            await new Promise(resolve => setTimeout(resolve, 1500));

            const matchingHTML = this.renderMatchingInterface();
            matchingContainer.innerHTML = matchingHTML;
            
            // Debug: verificar botones
            const connectButtons = matchingContainer.querySelectorAll('[onclick*="connectWithMatch"]');
            const detailButtons = matchingContainer.querySelectorAll('[onclick*="viewMatchDetails"]');
            console.log(`🔘 Botones encontrados - Conectar: ${connectButtons.length}, Detalles: ${detailButtons.length}`);

            // Inicializar funcionalidad
            this.initializeMatchingFeatures();
            
            this.showNotification('✨ Sistema de matching cargado exitosamente', 'success');
            console.log('✅ Matching content loaded successfully');

        } catch (error) {
            console.error('❌ Error loading matching content:', error);
            this.showNotification('❌ Error cargando sistema de matching', 'error');
            matchingContainer.innerHTML = this.getErrorHTML('Error cargando matching');
        }
    }

    async loadAnalyticsContent() {
        console.log('📈 Cargando contenido de analíticas');
        this.showNotification('🔄 Cargando analíticas...', 'info');

        const analyticsContainer = document.getElementById('analyticsContainer');
        if (!analyticsContainer) return;

        try {
            // Mostrar loading
            analyticsContainer.innerHTML = this.getLoadingHTML('Generando reportes y gráficos...');

            // Simular delay para carga de datos
            await new Promise(resolve => setTimeout(resolve, 1500));

            const analyticsHTML = this.renderAnalyticsInterface();
            analyticsContainer.innerHTML = analyticsHTML;

            // Inicializar funcionalidades de analíticas
            this.initializeAnalyticsFeatures();
            
            this.showNotification('📊 Analíticas cargadas exitosamente', 'success');
            console.log('✅ Analytics content loaded successfully');

        } catch (error) {
            console.error('❌ Error loading analytics content:', error);
            this.showNotification('❌ Error cargando analíticas', 'error');
            analyticsContainer.innerHTML = this.getErrorHTML('Error cargando analíticas');
        }
    }

    renderAnalyticsInterface() {
        const financialData = this.getFinancialAnalytics();
        const participationData = this.getParticipationAnalytics();
        const performanceData = this.getPerformanceAnalytics();

        return `
            <div class="analytics-interface">
                <!-- Analytics Header -->
                <div class="analytics-header">
                    <div class="analytics-summary">
                        <h2>📊 Tu Rendimiento Financiero</h2>
                        <p>Análisis completo de tu actividad en tandas y grupos cooperativos</p>
                        <div class="summary-period">
                            <label for="analyticsPeriod">Período:</label>
                            <select class="form-select" id="analyticsPeriod" onchange="advancedGroupsSystem.updateAnalyticsPeriod(this.value)">
                                <option value="all">Todo el tiempo</option>
                                <option value="year" selected>Este año (2025)</option>
                                <option value="quarter">Último trimestre</option>
                                <option value="month">Este mes</option>
                            </select>
                            <button class="btn btn-primary" onclick="advancedGroupsSystem.exportAnalytics()">
                                <i class="fas fa-download"></i>
                                <span>Exportar Reporte</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Key Performance Indicators -->
                <div class="analytics-kpis">
                    <div class="kpi-grid">
                        <div class="kpi-card primary">
                            <div class="kpi-icon">💰</div>
                            <div class="kpi-content">
                                <div class="kpi-value">L. ${financialData.totalSaved.toLocaleString()}</div>
                                <div class="kpi-label">Total Ahorrado</div>
                                <div class="kpi-change positive">+${financialData.savingsGrowth}% vs mes anterior</div>
                            </div>
                        </div>
                        <div class="kpi-card success">
                            <div class="kpi-icon">✅</div>
                            <div class="kpi-content">
                                <div class="kpi-value">${performanceData.completedTandas}</div>
                                <div class="kpi-label">Tandas Completadas</div>
                                <div class="kpi-change positive">+${performanceData.completionRate}% éxito</div>
                            </div>
                        </div>
                        <div class="kpi-card info">
                            <div class="kpi-icon">⭐</div>
                            <div class="kpi-content">
                                <div class="kpi-value">${performanceData.averageRating}</div>
                                <div class="kpi-label">Calificación Promedio</div>
                                <div class="kpi-change positive">+${performanceData.ratingGrowth}% este mes</div>
                            </div>
                        </div>
                        <div class="kpi-card warning">
                            <div class="kpi-icon">🎯</div>
                            <div class="kpi-content">
                                <div class="kpi-value">${participationData.activeParticipations}</div>
                                <div class="kpi-label">Participaciones Activas</div>
                                <div class="kpi-change neutral">En ${participationData.activeGroups} grupos</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts and Graphs Section -->
                <div class="analytics-charts">
                    <div class="charts-grid">
                        <!-- Financial Growth Chart -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>💹 Crecimiento de Ahorros</h3>
                                <div class="chart-controls">
                                    <button class="chart-btn active" onclick="advancedGroupsSystem.switchChart('savings', 'monthly')">Mensual</button>
                                    <button class="chart-btn" onclick="advancedGroupsSystem.switchChart('savings', 'weekly')">Semanal</button>
                                </div>
                            </div>
                            <div class="chart-container">
                                <div class="chart-placeholder" id="savingsChart">
                                    ${this.generateSavingsChart(financialData.monthlyData)}
                                </div>
                            </div>
                        </div>

                        <!-- Participation Distribution -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>📊 Distribución de Participaciones</h3>
                            </div>
                            <div class="chart-container">
                                <div class="chart-placeholder" id="participationChart">
                                    ${this.generateParticipationChart(participationData)}
                                </div>
                            </div>
                        </div>

                        <!-- Performance Timeline -->
                        <div class="chart-card full-width">
                            <div class="chart-header">
                                <h3>⏱️ Timeline de Participación</h3>
                            </div>
                            <div class="chart-container">
                                <div class="timeline-chart" id="performanceTimeline">
                                    ${this.generatePerformanceTimeline(performanceData.timeline)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Analytics Tables -->
                <div class="analytics-tables">
                    <div class="tables-grid">
                        <!-- Groups Performance -->
                        <div class="table-card">
                            <div class="table-header">
                                <h3>👥 Rendimiento por Grupo</h3>
                                <button class="btn btn-secondary btn-sm" onclick="advancedGroupsSystem.exportGroupsReport()">
                                    <i class="fas fa-file-excel"></i>
                                    Exportar
                                </button>
                            </div>
                            <div class="table-container">
                                <table class="analytics-table">
                                    <thead>
                                        <tr>
                                            <th>Grupo</th>
                                            <th>Total Ahorrado</th>
                                            <th>Participaciones</th>
                                            <th>Estado</th>
                                            <th>ROI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${participationData.groupsData.map(group => `
                                        <tr>
                                            <td>
                                                <div class="group-cell">
                                                    <span class="group-icon">${group.icon}</span>
                                                    <span class="group-name">${group.name}</span>
                                                </div>
                                            </td>
                                            <td class="amount">L. ${group.totalSaved.toLocaleString()}</td>
                                            <td>
                                                <span class="participation-count">${group.participations}</span>
                                                <span class="participation-type">${group.type}</span>
                                            </td>
                                            <td>
                                                <span class="status-badge ${group.status}">${group.statusLabel}</span>
                                            </td>
                                            <td class="roi ${group.roi > 0 ? 'positive' : 'neutral'}">${group.roi}%</td>
                                        </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Recent Activity -->
                        <div class="table-card">
                            <div class="table-header">
                                <h3>📈 Actividad Reciente</h3>
                                <button class="btn btn-secondary btn-sm" onclick="window.advancedGroupsSystem?.viewFullActivity()">
                                    Ver Todo
                                </button>
                            </div>
                            <div class="activity-list">
                                ${performanceData.recentActivity.map(activity => `
                                <div class="activity-item-analytics">
                                    <div class="activity-icon-analytics ${activity.type}">
                                        <i class="fas fa-${activity.icon}"></i>
                                    </div>
                                    <div class="activity-content-analytics">
                                        <div class="activity-text">${activity.text}</div>
                                        <div class="activity-meta">
                                            <span class="activity-date">${activity.date}</span>
                                            <span class="activity-amount">L. ${activity.amount?.toLocaleString() || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div class="activity-status ${activity.status}">
                                        ${activity.statusLabel}
                                    </div>
                                </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Analytics Insights -->
                <div class="analytics-insights">
                    <div class="insights-header">
                        <h3>💡 Insights y Recomendaciones</h3>
                        <p>Análisis inteligente de tu comportamiento financiero</p>
                    </div>
                    <div class="insights-grid">
                        ${this.generateInsights(financialData, participationData, performanceData).map(insight => `
                        <div class="insight-card ${insight.type}">
                            <div class="insight-icon">
                                <i class="fas fa-${insight.icon}"></i>
                            </div>
                            <div class="insight-content">
                                <h4>${insight.title}</h4>
                                <p>${insight.description}</p>
                                ${insight.action ? `
                                <div class="insight-action">
                                    <button class="btn btn-accent btn-sm insight-btn" data-action="${insight.actionText?.toLowerCase().replace(/\s+/g, '-')}" onclick="${insight.action}">
                                        ${insight.actionText}
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ========================================
    // 📊 ANALYTICS DATA GENERATION
    // ========================================

    getFinancialAnalytics() {
        return {
            totalSaved: 24500,
            savingsGrowth: 12.5,
            monthlyData: [
                { month: 'Ene', amount: 1200, target: 1500 },
                { month: 'Feb', amount: 1800, target: 1500 },
                { month: 'Mar', amount: 2200, target: 2000 },
                { month: 'Abr', amount: 1950, target: 2000 },
                { month: 'May', amount: 2400, target: 2500 },
                { month: 'Jun', amount: 2800, target: 2500 },
                { month: 'Jul', amount: 3200, target: 3000 },
                { month: 'Ago', amount: 2900, target: 3000 }
            ],
            weeklyData: [
                { month: 'S1', amount: 300, target: 375 },
                { month: 'S2', amount: 450, target: 375 },
                { month: 'S3', amount: 550, target: 500 },
                { month: 'S4', amount: 488, target: 500 },
                { month: 'S5', amount: 600, target: 625 },
                { month: 'S6', amount: 700, target: 625 },
                { month: 'S7', amount: 800, target: 750 },
                { month: 'S8', amount: 725, target: 750 }
            ],
            expectedReturns: 28750,
            riskLevel: 'Bajo'
        };
    }

    getParticipationAnalytics() {
        return {
            activeParticipations: 5,
            activeGroups: 3,
            groupsData: [
                {
                    name: 'Emprendedores Zona Norte',
                    icon: '💼',
                    totalSaved: 8500,
                    participations: 2,
                    type: 'tandas',
                    status: 'active',
                    statusLabel: 'Activo',
                    roi: 8.5
                },
                {
                    name: 'Cooperativa Familiar',
                    icon: '👨‍👩‍👧‍👦',
                    totalSaved: 12000,
                    participations: 3,
                    type: 'grupo',
                    status: 'active',
                    statusLabel: 'Activo',
                    roi: 12.3
                },
                {
                    name: 'Bay Islands Tourism',
                    icon: '🏝️',
                    totalSaved: 4000,
                    participations: 1,
                    type: 'tanda',
                    status: 'pending',
                    statusLabel: 'Pendiente',
                    roi: 0
                }
            ],
            distribution: {
                tandas: 60,
                grupos: 30,
                individual: 10
            }
        };
    }

    getPerformanceAnalytics() {
        return {
            completedTandas: 7,
            completionRate: 98,
            averageRating: 4.8,
            ratingGrowth: 5.2,
            timeline: [
                {
                    date: '2025-01',
                    event: 'Ingreso a Cooperativa Familiar',
                    type: 'join',
                    amount: 1500,
                    status: 'completed'
                },
                {
                    date: '2025-03',
                    event: 'Primera tanda completada',
                    type: 'complete',
                    amount: 3000,
                    status: 'completed'
                },
                {
                    date: '2025-05',
                    event: 'Ingreso a Emprendedores',
                    type: 'join',
                    amount: 2500,
                    status: 'active'
                },
                {
                    date: '2025-07',
                    event: 'Meta de L.20,000 alcanzada',
                    type: 'milestone',
                    amount: 20000,
                    status: 'completed'
                }
            ],
            recentActivity: [
                {
                    text: 'Pago recibido de "Emprendedores Zona Norte"',
                    date: 'Hace 2 horas',
                    amount: 1500,
                    type: 'payment',
                    icon: 'dollar-sign',
                    status: 'success',
                    statusLabel: 'Completado'
                },
                {
                    text: 'Contribución enviada a "Cooperativa Familiar"',
                    date: 'Hace 1 día',
                    amount: 1200,
                    type: 'contribution',
                    icon: 'arrow-up',
                    status: 'success',
                    statusLabel: 'Enviado'
                },
                {
                    text: 'Unión a "Bay Islands Tourism"',
                    date: 'Hace 3 días',
                    amount: null,
                    type: 'join',
                    icon: 'user-plus',
                    status: 'pending',
                    statusLabel: 'Pendiente'
                },
                {
                    text: 'Tanda "Vacaciones 2024" completada',
                    date: 'Hace 1 semana',
                    amount: 5000,
                    type: 'completion',
                    icon: 'check-circle',
                    status: 'success',
                    statusLabel: 'Completado'
                }
            ]
        };
    }

    generateSavingsChart(monthlyData) {
        const maxAmount = Math.max(...monthlyData.map(m => Math.max(m.amount, m.target)));
        
        return `
            <div class="savings-chart">
                <div class="chart-legend">
                    <div class="legend-item">
                        <span class="legend-color actual"></span>
                        <span>Ahorrado Real</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color target"></span>
                        <span>Meta</span>
                    </div>
                </div>
                <div class="chart-bars">
                    ${monthlyData.map(month => `
                    <div class="chart-bar-group">
                        <div class="chart-bar-container">
                            <div class="chart-bar target" style="height: ${(month.target / maxAmount) * 100}%"></div>
                            <div class="chart-bar actual" style="height: ${(month.amount / maxAmount) * 100}%"></div>
                        </div>
                        <div class="chart-bar-label">${month.month}</div>
                        <div class="chart-bar-value">L. ${month.amount.toLocaleString()}</div>
                    </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    generateParticipationChart(participationData) {
        const total = participationData.distribution.tandas + participationData.distribution.grupos + participationData.distribution.individual;
        
        return `
            <div class="participation-chart">
                <div class="pie-chart">
                    <div class="pie-slice tandas" style="--percentage: ${(participationData.distribution.tandas / total) * 100}%"></div>
                    <div class="pie-slice grupos" style="--percentage: ${(participationData.distribution.grupos / total) * 100}%"></div>
                    <div class="pie-slice individual" style="--percentage: ${(participationData.distribution.individual / total) * 100}%"></div>
                    <div class="pie-center">
                        <span class="pie-total">${participationData.activeParticipations}</span>
                        <span class="pie-label">Total</span>
                    </div>
                </div>
                <div class="pie-legend">
                    <div class="pie-legend-item">
                        <span class="pie-color tandas"></span>
                        <span>Tandas (${participationData.distribution.tandas}%)</span>
                    </div>
                    <div class="pie-legend-item">
                        <span class="pie-color grupos"></span>
                        <span>Grupos (${participationData.distribution.grupos}%)</span>
                    </div>
                    <div class="pie-legend-item">
                        <span class="pie-color individual"></span>
                        <span>Individual (${participationData.distribution.individual}%)</span>
                    </div>
                </div>
            </div>
        `;
    }

    generatePerformanceTimeline(timeline) {
        return `
            <div class="performance-timeline">
                ${timeline.map((event, index) => `
                <div class="timeline-item ${event.status}">
                    <div class="timeline-marker">
                        <div class="timeline-icon ${event.type}">
                            <i class="fas fa-${this.getTimelineIcon(event.type)}"></i>
                        </div>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-event">${event.event}</span>
                            <span class="timeline-date">${event.date}</span>
                        </div>
                        ${event.amount ? `
                        <div class="timeline-amount">
                            <i class="fas fa-lempira-sign"></i>
                            L. ${event.amount.toLocaleString()}
                        </div>
                        ` : ''}
                    </div>
                    ${index < timeline.length - 1 ? '<div class="timeline-connector"></div>' : ''}
                </div>
                `).join('')}
            </div>
        `;
    }

    getTimelineIcon(type) {
        const icons = {
            join: 'user-plus',
            complete: 'check-circle',
            milestone: 'trophy',
            payment: 'dollar-sign'
        };
        return icons[type] || 'circle';
    }

    generateInsights(financialData, participationData, performanceData) {
        return [
            {
                type: 'success',
                icon: 'chart-line',
                title: '¡Excelente Progreso!',
                description: `Has superado tu meta mensual por ${financialData.savingsGrowth}%. Mantén este ritmo para alcanzar L. ${financialData.expectedReturns.toLocaleString()} este año.`,
                action: 'window.advancedGroupsSystem?.setNewSavingsGoal()',
                actionText: 'Aumentar Meta'
            },
            {
                type: 'warning',
                icon: 'diversify',
                title: 'Diversifica tus Inversiones',
                description: 'El 60% de tus ahorros están en tandas. Considera unirte a más grupos cooperativos para reducir riesgo.',
                action: 'window.advancedGroupsSystem?.getMatchRequirements()',
                actionText: 'Explorar Grupos'
            },
            {
                type: 'info',
                icon: 'star',
                title: 'Rating Excepcional',
                description: `Tu calificación de ${performanceData.averageRating}/5.0 te posiciona en el top 10% de participantes más confiables.`,
                action: null,
                actionText: null
            },
            {
                type: 'tip',
                icon: 'lightbulb',
                title: 'Oportunidad de Crecimiento',
                description: 'Basado en tu historial, podrías incrementar tus contribuciones en un 20% sin afectar tu flujo de caja.',
                action: 'window.advancedGroupsSystem?.calculateOptimalContribution()',
                actionText: 'Calcular Óptimo'
            }
        ];
    }

    // ========================================
    // 📊 ANALYTICS FUNCTIONALITY
    // ========================================

    initializeAnalyticsFeatures() {
        console.log('📊 Inicializando funcionalidades de analíticas...');
        
        // Add interactive features for charts
        this.addChartInteractivity();
        
        // Initialize export functions
        this.setupAnalyticsExports();
        
        // Add legend click event delegation
        this.setupLegendInteractivity();
        
        // Add activity buttons event delegation
        this.setupActivityButtonsInteractivity();
        
        console.log('✅ Analytics features initialized');
    }

    setupLegendInteractivity() {
        // Remove existing legend listeners to prevent duplicates
        if (this.legendEventListener) {
            document.removeEventListener('click', this.legendEventListener);
        }
        
        // Use event delegation to handle legend clicks
        this.legendEventListener = (e) => {
            const legendItem = e.target.closest('.legend-item.interactive');
            if (legendItem) {
                const seriesType = legendItem.getAttribute('data-series');
                if (seriesType) {
                    console.log(`🔄 Legend clicked: ${seriesType}`);
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleChartSeries(seriesType);
                }
            }
        };
        
        document.addEventListener('click', this.legendEventListener);
        console.log('✅ Legend interactivity setup complete');
    }

    setupActivityButtonsInteractivity() {
        // Remove existing activity button listeners to prevent duplicates
        if (this.activityButtonEventListener) {
            document.removeEventListener('click', this.activityButtonEventListener);
        }
        
        // Use event delegation to handle activity buttons
        this.activityButtonEventListener = (e) => {
            // Handle "Ver Todo" button in Recent Activity
            if (e.target.textContent?.trim() === 'Ver Todo' && e.target.closest('.table-header')) {
                console.log('📈 Ver Todo button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.viewFullActivity();
                return;
            }
            
            // Handle other analytics action buttons
            const insightBtn = e.target.closest('.insight-btn');
            if (insightBtn && insightBtn.dataset.action) {
                console.log(`📊 Insight button clicked: ${insightBtn.dataset.action}`);
                e.preventDefault();
                e.stopPropagation();
                
                switch (insightBtn.dataset.action) {
                    case 'aumentar-meta':
                        this.setNewSavingsGoal();
                        break;
                    case 'calcular-óptimo':
                        this.calculateOptimalContribution();
                        break;
                    case 'explorar-grupos':
                        this.getMatchRequirements();
                        break;
                    default:
                        console.log(`Unknown action: ${insightBtn.dataset.action}`);
                }
            }
        };
        
        document.addEventListener('click', this.activityButtonEventListener);
        console.log('✅ Activity buttons interactivity setup complete');
    }

    addChartInteractivity() {
        // Add hover effects and click handlers for charts
        const chartBars = document.querySelectorAll('.chart-bar');
        chartBars.forEach(bar => {
            bar.addEventListener('mouseenter', (e) => {
                // Show tooltip with detailed info
                this.showChartTooltip(e.target);
            });
            
            bar.addEventListener('mouseleave', () => {
                this.hideChartTooltip();
            });
        });
    }

    setupAnalyticsExports() {
        // Prepare export functionality
        this.analyticsExportReady = true;
    }

    updateAnalyticsPeriod(period) {
        console.log(`📅 Actualizando período de analíticas: ${period}`);
        this.showNotification(`📊 Actualizando vista para: ${this.getPeriodLabel(period)}`, 'info');
        
        // Simulate data update
        setTimeout(() => {
            this.showNotification('✅ Datos actualizados exitosamente', 'success');
        }, 1000);
    }

    getPeriodLabel(period) {
        const labels = {
            all: 'Todo el tiempo',
            year: 'Este año',
            quarter: 'Último trimestre',
            month: 'Este mes'
        };
        return labels[period] || period;
    }

    switchChart(chartType, viewType) {
        console.log(`📈 Cambiando vista del gráfico ${chartType} a ${viewType}`);
        
        // Update chart button states - find buttons in the current chart context
        const chartContainer = event.target.closest('.chart-card');
        const buttons = chartContainer.querySelectorAll('.chart-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        if (chartType === 'savings') {
            this.updateSavingsChart(viewType);
        }
        
        // Show notification with appropriate message
        const viewLabel = viewType === 'monthly' ? 'Mensual' : 'Semanal';
        this.showNotification(`📊 Vista cambiada a ${viewLabel}`, 'info', 2000);
    }

    updateSavingsChart(viewType) {
        const financialData = this.getFinancialAnalytics();
        const chartData = viewType === 'monthly' ? financialData.monthlyData : financialData.weeklyData;
        
        // Find the chart container and update it
        const chartContainer = document.querySelector('.savings-chart');
        if (chartContainer) {
            // Update the chart with new data
            chartContainer.innerHTML = this.generateChartHTML(chartData);
            
            // Add smooth transition animation
            chartContainer.style.opacity = '0';
            setTimeout(() => {
                chartContainer.style.opacity = '1';
            }, 150);
        }
    }

    generateChartHTML(chartData) {
        const maxAmount = Math.max(...chartData.map(m => Math.max(m.amount, m.target)));
        
        return `
            <div class="chart-legend">
                <div class="legend-item interactive" data-series="actual">
                    <span class="legend-color actual"></span>
                    <span>Ahorrado Real</span>
                    <i class="legend-toggle-icon fas fa-eye"></i>
                </div>
                <div class="legend-item interactive" data-series="target">
                    <span class="legend-color target"></span>
                    <span>Meta</span>
                    <i class="legend-toggle-icon fas fa-eye"></i>
                </div>
            </div>
            <div class="chart-bars">
                ${chartData.map(period => `
                <div class="chart-bar-group">
                    <div class="chart-bar-container">
                        <div class="chart-bar target" style="height: ${(period.target / maxAmount) * 100}%"></div>
                        <div class="chart-bar actual" style="height: ${(period.amount / maxAmount) * 100}%"></div>
                    </div>
                    <div class="chart-bar-label">${period.month}</div>
                    <div class="chart-bar-value actual-value">L. ${period.amount.toLocaleString()}</div>
                    <div class="chart-bar-value target-value" style="display: none;">Meta: L. ${period.target.toLocaleString()}</div>
                </div>
                `).join('')}
            </div>
        `;
    }

    toggleChartSeries(seriesType) {
        console.log(`🔄 Toggling chart series: ${seriesType}`);
        
        const legendItem = document.querySelector(`.legend-item[data-series="${seriesType}"]`);
        const chartBars = document.querySelectorAll(`.chart-bar.${seriesType}`);
        const chartValues = document.querySelectorAll(`.${seriesType}-value`);
        const toggleIcon = legendItem.querySelector('.legend-toggle-icon');
        
        // Check current visibility state
        const isHidden = legendItem.classList.contains('series-hidden');
        
        if (isHidden) {
            // Show series
            legendItem.classList.remove('series-hidden');
            toggleIcon.className = 'legend-toggle-icon fas fa-eye';
            
            chartBars.forEach(bar => {
                bar.style.opacity = '1';
                bar.style.visibility = 'visible';
            });
            
            if (seriesType === 'actual') {
                chartValues.forEach(value => value.style.display = 'block');
                // Hide target values when showing actual
                document.querySelectorAll('.target-value').forEach(value => value.style.display = 'none');
            } else {
                chartValues.forEach(value => value.style.display = 'block');
                // Hide actual values when showing target
                document.querySelectorAll('.actual-value').forEach(value => value.style.display = 'none');
            }
            
            this.showNotification(`👁️ Serie "${seriesType === 'actual' ? 'Ahorrado Real' : 'Meta'}" mostrada`, 'info', 1500);
            
        } else {
            // Hide series
            legendItem.classList.add('series-hidden');
            toggleIcon.className = 'legend-toggle-icon fas fa-eye-slash';
            
            chartBars.forEach(bar => {
                bar.style.opacity = '0.2';
                bar.style.visibility = 'visible'; // Keep visible but transparent
            });
            
            chartValues.forEach(value => value.style.display = 'none');
            
            // Show the other series values when one is hidden
            if (seriesType === 'actual') {
                document.querySelectorAll('.target-value').forEach(value => value.style.display = 'block');
            } else {
                document.querySelectorAll('.actual-value').forEach(value => value.style.display = 'block');
            }
            
            this.showNotification(`🙈 Serie "${seriesType === 'actual' ? 'Ahorrado Real' : 'Meta'}" oculta`, 'info', 1500);
        }
        
        // Add visual feedback
        legendItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            legendItem.style.transform = 'scale(1)';
        }, 150);
    }

    exportAnalytics() {
        console.log('📥 Exportando reporte de analíticas...');
        this.showNotification('📊 Generando reporte completo...', 'info');
        
        // Simulate export process
        setTimeout(() => {
            this.showNotification('✅ Reporte exportado exitosamente', 'success');
        }, 2000);
    }

    exportGroupsReport() {
        console.log('📥 Exportando reporte de grupos...');
        this.showNotification('📋 Generando reporte de rendimiento por grupo...', 'info');
        
        setTimeout(() => {
            this.showNotification('✅ Reporte de grupos descargado', 'success');
        }, 1500);
    }

    viewFullActivity() {
        console.log('👁️ Mostrando actividad completa...');
        
        const fullActivity = this.getFullActivityHistory();
        
        this.showModal({
            title: '📈 Historial Completo de Actividad',
            content: `
                <div class="full-activity-modal">
                    <div class="activity-header">
                        <div class="activity-summary">
                            <div class="summary-stat">
                                <span class="stat-number">${fullActivity.totalTransactions}</span>
                                <span class="stat-label">Transacciones</span>
                            </div>
                            <div class="summary-stat">
                                <span class="stat-number">L. ${fullActivity.totalAmount.toLocaleString()}</span>
                                <span class="stat-label">Monto Total</span>
                            </div>
                            <div class="summary-stat">
                                <span class="stat-number">${fullActivity.activeDays}</span>
                                <span class="stat-label">Días Activos</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="activity-filters">
                        <button class="filter-btn active" onclick="advancedGroupsSystem.filterActivity('all')">
                            <i class="fas fa-list"></i> Todas
                        </button>
                        <button class="filter-btn" onclick="advancedGroupsSystem.filterActivity('payments')">
                            <i class="fas fa-dollar-sign"></i> Pagos
                        </button>
                        <button class="filter-btn" onclick="advancedGroupsSystem.filterActivity('contributions')">
                            <i class="fas fa-arrow-up"></i> Contribuciones
                        </button>
                        <button class="filter-btn" onclick="advancedGroupsSystem.filterActivity('completions')">
                            <i class="fas fa-check-circle"></i> Completadas
                        </button>
                    </div>
                    
                    <div class="full-activity-list" id="fullActivityList">
                        ${this.renderActivityList(fullActivity.activities)}
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'Exportar CSV',
                    class: 'btn-primary',
                    onclick: 'advancedGroupsSystem.exportActivityHistory()'
                },
                {
                    text: 'Cerrar',
                    class: 'btn-secondary',
                    onclick: 'advancedGroupsSystem.hideModal()'
                }
            ]
        });
    }

    getFullActivityHistory() {
        const activities = [
            {
                text: 'Pago recibido de "Emprendedores Zona Norte"',
                date: '2025-08-10 14:30',
                dateLabel: 'Hace 2 horas',
                amount: 1500,
                type: 'payment',
                icon: 'dollar-sign',
                status: 'success',
                statusLabel: 'Completado',
                group: 'Emprendedores Zona Norte'
            },
            {
                text: 'Contribución enviada a "Cooperativa Familiar"',
                date: '2025-08-09 09:15',
                dateLabel: 'Hace 1 día',
                amount: 1200,
                type: 'contribution',
                icon: 'arrow-up',
                status: 'success',
                statusLabel: 'Enviado',
                group: 'Cooperativa Familiar'
            },
            {
                text: 'Unión a "Bay Islands Tourism"',
                date: '2025-08-07 16:45',
                dateLabel: 'Hace 3 días',
                amount: null,
                type: 'join',
                icon: 'user-plus',
                status: 'pending',
                statusLabel: 'Pendiente',
                group: 'Bay Islands Tourism'
            },
            {
                text: 'Tanda "Vacaciones 2024" completada',
                date: '2025-08-03 11:00',
                dateLabel: 'Hace 1 semana',
                amount: 5000,
                type: 'completion',
                icon: 'trophy',
                status: 'success',
                statusLabel: 'Completada',
                group: 'Vacaciones 2024'
            },
            {
                text: 'Pago recibido de "Cooperativa Familiar"',
                date: '2025-08-01 13:20',
                dateLabel: 'Hace 9 días',
                amount: 1200,
                type: 'payment',
                icon: 'dollar-sign',
                status: 'success',
                statusLabel: 'Completado',
                group: 'Cooperativa Familiar'
            },
            {
                text: 'Contribución enviada a "Emprendedores Zona Norte"',
                date: '2025-07-28 10:30',
                dateLabel: 'Hace 13 días',
                amount: 1500,
                type: 'contribution',
                icon: 'arrow-up',
                status: 'success',
                statusLabel: 'Enviado',
                group: 'Emprendedores Zona Norte'
            },
            {
                text: 'Tanda "Compras Navideñas" iniciada',
                date: '2025-07-25 15:45',
                dateLabel: 'Hace 16 días',
                amount: 2000,
                type: 'join',
                icon: 'play-circle',
                status: 'active',
                statusLabel: 'Activa',
                group: 'Compras Navideñas'
            },
            {
                text: 'Meta de L.20,000 alcanzada',
                date: '2025-07-20 18:00',
                dateLabel: 'Hace 21 días',
                amount: 20000,
                type: 'milestone',
                icon: 'flag-checkered',
                status: 'success',
                statusLabel: 'Logrado',
                group: null
            }
        ];
        
        return {
            activities: activities,
            totalTransactions: activities.length,
            totalAmount: activities.filter(a => a.amount).reduce((sum, a) => sum + a.amount, 0),
            activeDays: 30
        };
    }

    renderActivityList(activities) {
        return activities.map(activity => `
            <div class="full-activity-item" data-type="${activity.type}">
                <div class="activity-icon-full ${activity.type}">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-content-full">
                    <div class="activity-main">
                        <div class="activity-text-full">${activity.text}</div>
                        <div class="activity-date-full">${activity.date}</div>
                    </div>
                    <div class="activity-details">
                        ${activity.amount ? `<span class="activity-amount-full">L. ${activity.amount.toLocaleString()}</span>` : ''}
                        ${activity.group ? `<span class="activity-group">${activity.group}</span>` : ''}
                        <span class="activity-status-full ${activity.status}">${activity.statusLabel}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterActivity(type) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        const activityItems = document.querySelectorAll('.full-activity-item');
        
        activityItems.forEach(item => {
            if (type === 'all') {
                item.style.display = 'flex';
            } else {
                const itemType = item.dataset.type;
                const shouldShow = (
                    (type === 'payments' && itemType === 'payment') ||
                    (type === 'contributions' && itemType === 'contribution') ||
                    (type === 'completions' && (itemType === 'completion' || itemType === 'milestone'))
                );
                item.style.display = shouldShow ? 'flex' : 'none';
            }
        });
        
        this.showNotification(`📋 Filtro aplicado: ${this.getFilterLabel(type)}`, 'info', 1500);
    }

    getFilterLabel(type) {
        const labels = {
            'all': 'Todas las actividades',
            'payments': 'Solo pagos recibidos',
            'contributions': 'Solo contribuciones',
            'completions': 'Solo completadas'
        };
        return labels[type] || 'Todas';
    }

    exportActivityHistory() {
        console.log('📥 Exportando historial de actividad...');
        this.showNotification('📊 Generando archivo CSV...', 'info');
        
        // Simulate CSV generation
        setTimeout(() => {
            this.showNotification('✅ Historial exportado exitosamente', 'success');
        }, 2000);
    }

    setNewSavingsGoal() {
        console.log('🎯 Configurando nueva meta de ahorros...');
        
        const currentGoal = 28750;
        const currentSaved = 24500;
        const suggestedGoal = Math.round(currentGoal * 1.15);
        
        this.showModal({
            title: '🎯 Configurar Nueva Meta de Ahorros',
            content: `
                <div class="savings-goal-modal">
                    <div class="current-progress">
                        <h4>📊 Progreso Actual</h4>
                        <div class="progress-stats">
                            <div class="stat-item">
                                <span class="stat-label">Meta Actual</span>
                                <span class="stat-value">L. ${currentGoal.toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Ahorrado</span>
                                <span class="stat-value success">L. ${currentSaved.toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Progreso</span>
                                <span class="stat-value">${Math.round((currentSaved/currentGoal)*100)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="goal-suggestions">
                        <h4>💡 Metas Sugeridas</h4>
                        <div class="goal-options">
                            <button class="goal-option-btn" onclick="advancedGroupsSystem.selectGoal(${Math.round(currentGoal * 1.1)})">
                                <div class="goal-amount">L. ${Math.round(currentGoal * 1.1).toLocaleString()}</div>
                                <div class="goal-label">Conservadora (+10%)</div>
                                <div class="goal-timeline">12 meses</div>
                            </button>
                            <button class="goal-option-btn recommended" onclick="advancedGroupsSystem.selectGoal(${suggestedGoal})">
                                <div class="goal-amount">L. ${suggestedGoal.toLocaleString()}</div>
                                <div class="goal-label">Recomendada (+15%)</div>
                                <div class="goal-timeline">12 meses</div>
                                <div class="recommended-badge">✨ Recomendada</div>
                            </button>
                            <button class="goal-option-btn" onclick="advancedGroupsSystem.selectGoal(${Math.round(currentGoal * 1.25)})">
                                <div class="goal-amount">L. ${Math.round(currentGoal * 1.25).toLocaleString()}</div>
                                <div class="goal-label">Ambiciosa (+25%)</div>
                                <div class="goal-timeline">15 meses</div>
                            </button>
                        </div>
                    </div>
                    
                    <div class="custom-goal">
                        <h4>🎨 Meta Personalizada</h4>
                        <div class="custom-input-group">
                            <label for="customGoalInput">Ingresa tu meta personalizada:</label>
                            <div class="input-with-prefix">
                                <span class="currency-prefix">L.</span>
                                <input type="number" id="customGoalInput" placeholder="${suggestedGoal}" min="${currentSaved}" max="100000" step="100">
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="advancedGroupsSystem.selectCustomGoal()">
                                Establecer Meta
                            </button>
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'Cancelar',
                    class: 'btn-secondary',
                    onclick: 'advancedGroupsSystem.hideModal()'
                }
            ]
        });
    }

    selectGoal(amount) {
        console.log(`🎯 Meta seleccionada: L. ${amount.toLocaleString()}`);
        this.hideModal();
        this.showNotification(`🎯 Nueva meta establecida: L. ${amount.toLocaleString()}`, 'success', 3000);
        
        // Simulate saving to backend
        setTimeout(() => {
            this.showNotification('📊 Meta sincronizada con el servidor', 'info', 2000);
        }, 1000);
    }

    selectCustomGoal() {
        const customInput = document.getElementById('customGoalInput');
        const amount = parseInt(customInput.value);
        
        if (!amount || amount < 24500) {
            this.showNotification('❌ La meta debe ser mayor a tus ahorros actuales', 'error', 3000);
            return;
        }
        
        if (amount > 100000) {
            this.showNotification('❌ Meta demasiado alta. Máximo: L. 100,000', 'error', 3000);
            return;
        }
        
        this.selectGoal(amount);
    }

    calculateOptimalContribution() {
        console.log('🧮 Calculando contribución óptima...');
        this.showNotification('🧮 Analizando tu capacidad financiera...', 'info');
        
        // Simulate calculation delay
        setTimeout(() => {
            this.showOptimalContributionResults();
        }, 2500);
    }

    showOptimalContributionResults() {
        const currentContribution = 1500;
        const optimalContribution = 1800;
        const monthlyIncome = 15000;
        const expenses = 11200;
        const availableForSavings = monthlyIncome - expenses;
        
        this.showModal({
            title: '🧮 Análisis de Contribución Óptima',
            content: `
                <div class="contribution-analysis-modal">
                    <div class="financial-summary">
                        <h4>💰 Resumen Financiero</h4>
                        <div class="financial-breakdown">
                            <div class="breakdown-item">
                                <span class="breakdown-label">Ingreso Mensual</span>
                                <span class="breakdown-value income">L. ${monthlyIncome.toLocaleString()}</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Gastos Fijos</span>
                                <span class="breakdown-value expense">L. ${expenses.toLocaleString()}</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Disponible para Ahorro</span>
                                <span class="breakdown-value available">L. ${availableForSavings.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="contribution-comparison">
                        <h4>📊 Comparación de Contribuciones</h4>
                        <div class="comparison-grid">
                            <div class="comparison-card current">
                                <div class="card-header">
                                    <span class="card-title">Actual</span>
                                </div>
                                <div class="card-amount">L. ${currentContribution.toLocaleString()}</div>
                                <div class="card-percentage">${Math.round((currentContribution/availableForSavings)*100)}% del disponible</div>
                                <div class="card-impact">
                                    <div class="impact-item">
                                        <span>Ahorro anual:</span>
                                        <span>L. ${(currentContribution * 12).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="comparison-card optimal">
                                <div class="card-header">
                                    <span class="card-title">Óptima</span>
                                    <span class="optimization-badge">+${Math.round((optimalContribution/currentContribution - 1) * 100)}%</span>
                                </div>
                                <div class="card-amount">L. ${optimalContribution.toLocaleString()}</div>
                                <div class="card-percentage">${Math.round((optimalContribution/availableForSavings)*100)}% del disponible</div>
                                <div class="card-impact">
                                    <div class="impact-item">
                                        <span>Ahorro anual:</span>
                                        <span>L. ${(optimalContribution * 12).toLocaleString()}</span>
                                    </div>
                                    <div class="impact-item success">
                                        <span>Ganancia extra:</span>
                                        <span>L. ${((optimalContribution - currentContribution) * 12).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="optimization-recommendations">
                        <h4>💡 Recomendaciones Personalizadas</h4>
                        <div class="recommendations-list">
                            <div class="recommendation-item">
                                <i class="fas fa-chart-line recommendation-icon success"></i>
                                <div class="recommendation-content">
                                    <div class="recommendation-title">Incremento Gradual</div>
                                    <div class="recommendation-desc">Aumenta L. 100 cada mes hasta llegar a L. 1,800</div>
                                </div>
                            </div>
                            <div class="recommendation-item">
                                <i class="fas fa-users recommendation-icon info"></i>
                                <div class="recommendation-content">
                                    <div class="recommendation-title">Diversificación</div>
                                    <div class="recommendation-desc">Divide entre 2 tandas de L. 900 c/u para reducir riesgo</div>
                                </div>
                            </div>
                            <div class="recommendation-item">
                                <i class="fas fa-calendar-alt recommendation-icon warning"></i>
                                <div class="recommendation-content">
                                    <div class="recommendation-title">Frecuencia Óptima</div>
                                    <div class="recommendation-desc">Considera pagos quincenales de L. 900 para mejor flujo</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="implementation-options">
                        <h4>🚀 ¿Quieres implementar estos cambios?</h4>
                        <div class="implementation-buttons">
                            <button class="btn btn-primary" onclick="advancedGroupsSystem.implementOptimalContribution(${optimalContribution})">
                                <i class="fas fa-rocket"></i>
                                Implementar Ahora
                            </button>
                            <button class="btn btn-secondary" onclick="advancedGroupsSystem.scheduleContributionIncrease(${optimalContribution})">
                                <i class="fas fa-clock"></i>
                                Programar Incremento
                            </button>
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'Guardar Análisis',
                    class: 'btn-secondary',
                    onclick: 'advancedGroupsSystem.saveAnalysisReport()'
                },
                {
                    text: 'Cerrar',
                    class: 'btn-secondary',
                    onclick: 'advancedGroupsSystem.hideModal()'
                }
            ]
        });
    }

    implementOptimalContribution(amount) {
        console.log(`🚀 Implementando contribución óptima: L. ${amount}`);
        this.hideModal();
        this.showNotification(`🚀 Contribución actualizada a L. ${amount.toLocaleString()}`, 'success', 3000);
        
        setTimeout(() => {
            this.showNotification('📊 Cambios aplicados a todas tus tandas activas', 'info', 2500);
        }, 1500);
    }

    scheduleContributionIncrease(amount) {
        console.log(`📅 Programando incremento gradual a L. ${amount}`);
        this.hideModal();
        this.showNotification('📅 Incremento programado: +L. 100 cada mes', 'info', 3000);
        
        setTimeout(() => {
            this.showNotification('🔔 Recibirás recordatorios mensuales para el incremento', 'info', 2500);
        }, 1500);
    }

    saveAnalysisReport() {
        console.log('💾 Guardando reporte de análisis...');
        this.showNotification('💾 Reporte guardado en tu historial', 'success', 2000);
        
        setTimeout(() => {
            this.hideModal();
        }, 1000);
    }

    showChartTooltip(element) {
        // Implementation for chart tooltips
        console.log('📊 Mostrando tooltip del gráfico');
    }

    hideChartTooltip() {
        // Implementation for hiding tooltips
        console.log('📊 Ocultando tooltip del gráfico');
    }

    // ========================================
    // 📝 MULTI-STEP FORM FUNCTIONALITY
    // ========================================

    initializeMultiStepForm(retryCount = 0) {
        // Prevent multiple initializations
        if (this.isMultiStepInitialized && retryCount === 0) {
            console.log('⚠️ Multi-step form already initialized, skipping...');
            return;
        }
        
        console.log('🚀 INITIALIZING MULTI-STEP FORM - Attempt:', retryCount + 1);
        
        // Check if elements exist with more specific selectors
        const createSection = document.getElementById('create');
        const allSteps = createSection ? createSection.querySelectorAll('.step-container') : document.querySelectorAll('.step-container');
        const multiStepForm = document.querySelector('.multi-step-form');
        const createGroupForm = document.getElementById('create-group-form');
        
        console.log('📊 Found step containers:', allSteps.length);
        // console.log('📊 Create section exists:', !!createSection);
        // console.log('📊 Create section is active:', createSection?.classList.contains('active'));
        // console.log('📊 Multi-step form exists:', !!multiStepForm);
        
        // If no elements found and we haven't retried too many times, retry
        if (allSteps.length === 0 && retryCount < 5) {
            console.log('⚠️ No step containers found, retrying...');
            setTimeout(() => {
                this.initializeMultiStepForm(retryCount + 1);
            }, 200);
            return;
        }
        
        if (allSteps.length === 0) {
            console.error('❌ Could not find step containers after multiple attempts');
            return;
        }

        this.currentStep = 1;
        this.maxSteps = 4;
        this.formData = {};

        // Apply step visibility - Show only step 1 initially
        allSteps.forEach((step, index) => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            
            if (stepNum === 1) {
                step.classList.add('active');
                step.style.display = 'block';
                step.style.opacity = '1';
                step.style.visibility = 'visible';
                step.style.height = 'auto';
                console.log(`✅ Step ${stepNum} visible`);
            } else {
                step.classList.remove('active');
                step.style.display = 'none';
                step.style.opacity = '0';
                step.style.visibility = 'hidden';
                step.style.height = '0';
                console.log(`❌ Step ${stepNum} hidden`);
            }
        });

        // Initialize event listeners
        this.setupFormEventListeners();
        this.setupFormValidation();
        
        // Mark as initialized
        this.isMultiStepInitialized = true;
        
        console.log('✅ Multi-step form initialized successfully with', allSteps.length, 'steps');
    }

    setupFormEventListeners() {
        const nextBtn = document.getElementById('next-step');
        const prevBtn = document.getElementById('previous-step');
        const form = document.getElementById('create-group-form');

        // Store bound functions for proper event listener removal
        if (!this.boundNextStep) {
            this.boundNextStep = () => this.nextStep();
        }
        if (!this.boundPrevStep) {
            this.boundPrevStep = () => this.previousStep();
        }

        // Remove existing event listeners to prevent duplicates
        if (nextBtn) {
            nextBtn.removeEventListener('click', this.boundNextStep);
            nextBtn.addEventListener('click', this.boundNextStep);
        }

        if (prevBtn) {
            prevBtn.removeEventListener('click', this.boundPrevStep);
            prevBtn.addEventListener('click', this.boundPrevStep);
        }

        // Character counter for description
        const descTextarea = document.getElementById('group-description');
        const descCounter = document.getElementById('desc-count');
        if (descTextarea && descCounter) {
            descTextarea.addEventListener('input', (e) => {
                descCounter.textContent = e.target.value.length;
            });
        }

        // Auto-save form data and update navigation (only if not already initialized)
        if (form && !form.dataset.initialized) {
            form.dataset.initialized = 'true';
            
            form.addEventListener('change', () => {
                this.saveFormData();
                this.debouncedUpdateNavigation(); // Update button states
            });
            
            form.addEventListener('input', () => {
                this.debouncedUpdateNavigation(); // Real-time button state updates
            });
        }
        
        console.log('📝 Form event listeners set up successfully');
    }

    setupFormValidation() {
        const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
            
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    this.validateField(field);
                }
            });
        });
    }

    validateField(field) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'Este campo es obligatorio';
        }

        // Specific field validations
        if (isValid && field.id === 'group-name') {
            if (field.value.length < 3) {
                isValid = false;
                errorMessage = 'El nombre debe tener al menos 3 caracteres';
            } else if (field.value.length > 50) {
                isValid = false;
                errorMessage = 'El nombre no puede exceder 50 caracteres';
            } else if (!/^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/.test(field.value)) {
                isValid = false;
                errorMessage = 'El nombre solo puede contener letras, números, espacios, guiones y puntos';
            }
        }

        if (isValid && field.id === 'group-description') {
            if (field.value.length < 10) {
                isValid = false;
                errorMessage = 'La descripción debe tener al menos 10 caracteres';
            } else if (field.value.length > 250) {
                isValid = false;
                errorMessage = 'La descripción no puede exceder 250 caracteres';
            }
        }

        if (isValid && field.id === 'location') {
            if (field.value.length < 2) {
                isValid = false;
                errorMessage = 'La ubicación debe tener al menos 2 caracteres';
            }
        }

        if (isValid && field.id === 'contribution') {
            const value = parseFloat(field.value);
            if (isNaN(value) || value < 100) {
                isValid = false;
                errorMessage = 'La contribución mínima es L.100';
            } else if (value > 50000) {
                isValid = false;
                errorMessage = 'La contribución máxima es L.50,000';
            }
        }

        if (isValid && field.id === 'max-participants') {
            const value = parseInt(field.value);
            if (isNaN(value) || value < 2) {
                isValid = false;
                errorMessage = 'Mínimo 2 participantes';
            } else if (value > 50) {
                isValid = false;
                errorMessage = 'Máximo 50 participantes';
            }
        }

        if (isValid && field.id === 'penalty-amount') {
            const value = parseFloat(field.value);
            if (value !== '' && (!isNaN(value) && value < 0)) {
                isValid = false;
                errorMessage = 'La multa no puede ser negativa';
            } else if (value > 500) {
                isValid = false;
                errorMessage = 'La multa máxima es L.500';
            }
        }

        if (isValid && field.id === 'grace-period') {
            const value = parseInt(field.value);
            if (value !== '' && (!isNaN(value) && value < 0)) {
                isValid = false;
                errorMessage = 'El período de gracia no puede ser negativo';
            } else if (value > 15) {
                isValid = false;
                errorMessage = 'El período de gracia máximo es 15 días';
            }
        }

        // Update UI with enhanced feedback
        if (isValid) {
            formGroup.classList.remove('error');
            formGroup.classList.add('valid');
            if (errorElement) {
                errorElement.classList.remove('show');
                setTimeout(() => errorElement.textContent = '', 300);
            }
        } else {
            formGroup.classList.remove('valid');
            formGroup.classList.add('error');
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.classList.add('show');
            }
        }

        return isValid;
    }

    validateCurrentStep() {
        const currentContainer = document.querySelector(`.step-container[data-step="${this.currentStep}"]`);
        if (!currentContainer) return true;
        
        const requiredFields = currentContainer.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        let errorMessages = [];

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
                const label = field.closest('.form-group')?.querySelector('label')?.textContent || field.placeholder || 'Campo';
                errorMessages.push(label.replace(' *', ''));
            }
        });

        // Enhanced error feedback per Grok's recommendations
        if (!isValid) {
            const alertMessage = `Por favor, complete los siguientes campos obligatorios:\n• ${errorMessages.join('\n• ')}`;
            this.showNotification(alertMessage, 'warning', 8000);
            
            // Focus on first invalid field
            const firstInvalidField = currentContainer.querySelector('.form-group.error input, .form-group.error select, .form-group.error textarea');
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return isValid;
    }

    nextStep() {
        console.log(`🔄 Attempting to advance from step ${this.currentStep} to ${this.currentStep + 1}`);
        
        // Validate CURRENT step before advancing
        if (!this.validateCurrentStep()) {
            console.log('❌ Current step validation failed - STAYING on current step');
            this.showNotification('Por favor, corrige los errores antes de continuar', 'error');
            // DO NOT CHANGE this.currentStep - stay on current step!
            return false; // Explicitly return false to prevent any other actions
        }

        if (this.currentStep < this.maxSteps) {
            console.log(`✅ Step ${this.currentStep} validated, advancing...`);
            this.saveFormData();
            this.currentStep++;
            this.updateStepDisplay();
            
            // Small delay before updating navigation to let DOM settle
            setTimeout(() => {
                this.updateNavigation();
            }, 100);
            
            // Generate confirmation summary when reaching step 4
            if (this.currentStep === 4) {
                this.generateConfirmationSummary();
            }
            
            console.log(`✅ Successfully advanced to step ${this.currentStep}`);
            return true;
        }
        
        return false;
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            this.updateNavigation();
        }
    }

    updateStepDisplay() {
        console.log(`🔄 Updating step display to step ${this.currentStep}`);
        
        // Update progress bar steps
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });

        // Update step containers - ENSURE ONLY ONE IS VISIBLE
        document.querySelectorAll('.step-container').forEach(container => {
            container.classList.remove('active');
            container.style.display = 'none';
            container.style.opacity = '0';
            container.style.visibility = 'hidden';
            container.style.height = '0';
        });

        const currentContainer = document.querySelector(`.step-container[data-step="${this.currentStep}"]`);
        if (currentContainer) {
            currentContainer.classList.add('active');
            currentContainer.style.display = 'block';
            currentContainer.style.opacity = '1';
            currentContainer.style.visibility = 'visible';
            currentContainer.style.height = 'auto';
            console.log(`✅ Step ${this.currentStep} container is now active`);
        } else {
            console.error(`❌ Could not find step container for step ${this.currentStep}`);
        }

        // Update progress bar width - calculate percentage between steps
        const progressFill = document.querySelector('.progress-bar .progress-fill');
        if (progressFill) {
            // Calculate width as distance between step centers
            // Steps are positioned at: 0%, 33.33%, 66.66%, 100% 
            // So step 1->2 goes from 0% to 33.33%, etc.
            const progressWidth = ((this.currentStep - 1) / (this.maxSteps - 1)) * 100;
            progressFill.style.width = `${progressWidth}%`;
            console.log(`📊 Progress bar width: ${progressWidth}% (step ${this.currentStep}/${this.maxSteps})`);
        }

        // Smooth scroll to form
        const createSection = document.getElementById('create');
        if (createSection) {
            createSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updateNavigation() {
        const prevBtn = document.getElementById('previous-step');
        const nextBtn = document.getElementById('next-step');

        console.log(`🔧 Updating navigation for step ${this.currentStep}`);

        // Enhanced navigation state per Grok's recommendations
        if (prevBtn) {
            prevBtn.style.display = this.currentStep === 1 ? 'none' : 'flex';
            prevBtn.disabled = false; // Previous always enabled when visible
        }

        if (nextBtn) {
            // Check if current step is valid to enable/disable next button
            const canProceed = this.checkCurrentStepCompletion();
            console.log(`🔍 Can proceed from step ${this.currentStep}:`, canProceed);
            
            if (this.currentStep === this.maxSteps) {
                nextBtn.innerHTML = '<span>Crear Grupo</span><i class="fas fa-check"></i>';
                nextBtn.className = 'btn btn-success';
                nextBtn.onclick = () => this.submitForm();
            } else {
                nextBtn.innerHTML = '<span>Continuar</span><i class="fas fa-arrow-right"></i>';
                nextBtn.className = canProceed ? 'btn btn-primary' : 'btn btn-secondary';
                nextBtn.disabled = !canProceed;
                nextBtn.onclick = () => this.nextStep();
            }
        }
    }

    checkCurrentStepCompletion() {
        const currentContainer = document.querySelector(`.step-container[data-step="${this.currentStep}"]`);
        if (!currentContainer) return true;
        
        const requiredFields = currentContainer.querySelectorAll('input[required], select[required], textarea[required]');
        let allValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                allValid = false;
            }
        });
        
        return allValid;
    }

    // Debounced version of updateNavigation to prevent excessive calls
    debouncedUpdateNavigation() {
        if (this.navigationTimeout) {
            clearTimeout(this.navigationTimeout);
        }
        
        this.navigationTimeout = setTimeout(() => {
            this.updateNavigation();
        }, 100); // 100ms delay
    }

    saveFormData() {
        const form = document.getElementById('create-group-form');
        if (!form) return;

        const data = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                data[input.id] = input.checked;
            } else if (input.type === 'radio' && input.checked) {
                data[input.name] = input.value;
            } else if (input.type !== 'radio') {
                data[input.id] = input.value;
            }
        });

        this.formData = data;
        localStorage.setItem('create-group-draft', JSON.stringify(data));
    }

    async submitForm() {
        if (!this.validateCurrentStep()) {
            this.showNotification('Por favor, corrige los errores antes de crear el grupo', 'error');
            return;
        }

        this.saveFormData();
        
        try {
            this.showNotification('Creando grupo...', 'info');
            await this.delay(2000);
            
            // Create the new group object from form data
            const newGroup = {
                id: `group_${Date.now()}`,
                name: this.formData['group-name'],
                description: this.formData['group-description'],
                type: this.formData['group-type'],
                members: 1,
                maxMembers: parseInt(this.formData['max-participants'] || 12),
                contribution: parseInt(this.formData['contribution'] || 1500),
                totalSavings: 0,
                status: 'recruiting',
                isOwner: true,
                isAdmin: true,
                performance: 0,
                trustScore: 100, // Starting trust score
                nextMeeting: this.formData['start-date'] || new Date().toISOString().split('T')[0],
                location: this.formData['location'],
                frequency: this.formData['payment-frequency'],
                created: new Date(),
                avatar: this.getGroupAvatar(this.formData['group-type']),
                tags: this.generateTags(this.formData['group-type'], this.formData['group-name'])
            };
            
            // Add to groups array and update stats
            this.groups.push(newGroup);
            this.userStats.totalGroups++;
            
            // Update dashboard with new stats
            this.updateDashboard();
            
            localStorage.removeItem('create-group-draft');
            this.showNotification('¡Grupo creado exitosamente!', 'success', 5000);
            
            console.log('✅ Grupo creado via multi-step form:', newGroup);
            
            this.resetForm();
            this.switchTab('groups');
            
        } catch (error) {
            console.error('Error creating group:', error);
            this.showNotification('Error al crear el grupo. Inténtalo nuevamente.', 'error');
        }
    }

    generateConfirmationSummary() {
        const summaryContainer = document.getElementById('confirmationSummary');
        if (!summaryContainer || !this.formData) return;

        const getGroupTypeLabel = (type) => {
            const types = {
                'familiar': 'Familiar',
                'laboral': 'Laboral', 
                'comunitario': 'Comunitario',
                'comercial': 'Comercial'
            };
            return types[type] || type;
        };

        const getFrequencyLabel = (freq) => {
            const frequencies = {
                'weekly': 'Semanal',
                'biweekly': 'Quincenal',
                'monthly': 'Mensual'
            };
            return frequencies[freq] || freq;
        };

        const contribution = parseInt(this.formData['contribution']) || 0;
        const maxParticipants = parseInt(this.formData['max-participants']) || 0;
        const totalPerCycle = contribution * maxParticipants;

        summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-section">
                    <h4><i class="fas fa-info-circle"></i> Información Básica</h4>
                    <div class="summary-item">
                        <span class="label">Nombre:</span>
                        <span class="value">${this.formData['group-name'] || 'Sin especificar'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Tipo:</span>
                        <span class="value">${getGroupTypeLabel(this.formData['group-type'])}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Ubicación:</span>
                        <span class="value">${this.formData['location'] || 'Sin especificar'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Descripción:</span>
                        <span class="value">${this.formData['group-description'] || 'Sin descripción'}</span>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h4><i class="fas fa-dollar-sign"></i> Configuración Financiera</h4>
                    <div class="summary-item">
                        <span class="label">Contribución:</span>
                        <span class="value">L. ${contribution.toLocaleString()}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Máx. Participantes:</span>
                        <span class="value">${maxParticipants} personas</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Frecuencia:</span>
                        <span class="value">${getFrequencyLabel(this.formData['payment-frequency'])}</span>
                    </div>
                    ${this.formData['start-date'] ? `
                    <div class="summary-item">
                        <span class="label">Fecha de inicio:</span>
                        <span class="value">${this.formData['start-date']}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="summary-section">
                    <h4><i class="fas fa-shield-alt"></i> Configuración Avanzada</h4>
                    <div class="summary-item">
                        <span class="label">Multa por retraso:</span>
                        <span class="value">L. ${this.formData['penalty-amount'] || 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Período de gracia:</span>
                        <span class="value">${this.formData['grace-period'] || 0} días</span>
                    </div>
                    ${this.formData['group-rules'] ? `
                    <div class="summary-item">
                        <span class="label">Reglas personalizadas:</span>
                        <span class="value">Definidas</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="summary-section highlight">
                    <h4><i class="fas fa-calculator"></i> Proyección Financiera</h4>
                    <div class="highlight-box">
                        <div class="highlight-item">
                            <span class="label">Total por ciclo:</span>
                            <span class="value primary">L. ${totalPerCycle.toLocaleString()}</span>
                        </div>
                        <div class="highlight-item">
                            <span class="label">Duración completa:</span>
                            <span class="value">${maxParticipants} ciclos</span>
                        </div>
                        <div class="highlight-item">
                            <span class="label">Beneficio máximo:</span>
                            <span class="value success">L. ${totalPerCycle.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    resetForm() {
        this.currentStep = 1;
        this.formData = {};
        
        const form = document.getElementById('create-group-form');
        if (form) {
            form.reset();
        }
        
        document.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
        });
        
        document.querySelectorAll('.error-message.show').forEach(msg => {
            msg.classList.remove('show');
        });
        
        this.updateStepDisplay();
        this.updateNavigation();
    }

    // ========================================
    // 🔧 FUNCIONES AUXILIARES PARA ADMINISTRACIÓN DE GRUPOS
    // ========================================

    calculateActiveDays(createdDate) {
        const now = new Date();
        const created = new Date(createdDate);
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    generateMembersList(group) {
        let membersHtml = '';
        
        // Handle both cases: members as array of objects or members as number
        if (Array.isArray(group.members)) {
            // Case 1: members is array of member objects - use actual member data
            for (let i = 0; i < group.members.length; i++) {
                const member = group.members[i];
                const isOwner = member.role === 'coordinator' || (i === 0 && group.isOwner);
                const isAdmin = member.role === 'admin' || isOwner;
                const memberType = isOwner ? 'owner' : isAdmin ? 'admin' : 'member';
                const memberName = member.name || `Miembro ${i + 1}`;
                const memberAvatar = this.getMemberAvatar(member.name) || '👤';
            
                membersHtml += `
                    <div class="member-item">
                        <div class="member-avatar">${memberAvatar}</div>
                        <div class="member-info">
                            <div class="member-name">${memberName}</div>
                            <div class="member-role ${memberType}">
                                ${isOwner ? 'Coordinador' : isAdmin ? 'Administrador' : 'Miembro'}
                            </div>
                        </div>
                        <div class="member-status">
                            <span class="status-indicator active"></span>
                            <span class="status-text">Activo</span>
                        </div>
                    </div>
                `;
            }
        } else {
            // Case 2: members is a number - generate mock member data
            const memberTypes = ['owner', 'admin', 'member'];
            const memberNames = ['Ana García', 'Carlos López', 'María Rodriguez', 'Juan Pérez', 'Sofia Martínez', 'Carmen Ruiz', 'Diego Torres', 'Luis Mendoza'];
            const memberAvatars = ['👩‍💼', '👨‍💻', '👩‍🏫', '👨‍⚕️', '👩‍🎨', '👩‍⚖️', '👨‍🎯', '👨‍🔧'];
            
            const memberCount = typeof group.members === 'number' ? group.members : 8;
            
            for (let i = 0; i < memberCount; i++) {
                const isOwner = i === 0 && group.isOwner;
                const isAdmin = (i === 1 || isOwner) && group.isAdmin;
                const memberType = isOwner ? 'owner' : isAdmin ? 'admin' : 'member';
                const memberName = memberNames[i % memberNames.length] || `Miembro ${i + 1}`;
                const memberAvatar = memberAvatars[i % memberAvatars.length] || '👤';
                
                membersHtml += `
                    <div class="member-item">
                        <div class="member-avatar">${memberAvatar}</div>
                        <div class="member-info">
                            <div class="member-name">${memberName}</div>
                            <div class="member-role ${memberType}">
                                ${isOwner ? 'Coordinador' : isAdmin ? 'Administrador' : 'Miembro'}
                            </div>
                        </div>
                        <div class="member-status">
                            <span class="status-indicator active"></span>
                            <span class="status-text">Activo</span>
                        </div>
                    </div>
                `;
            }
        }
        
        return membersHtml || '<p class="no-members">No hay miembros para mostrar</p>';
    }
    
    // Helper function to get consistent member avatars
    getMemberAvatar(memberName) {
        const avatarMap = {
            'Usuario Activo': '👩‍💼',
            'Juan Pérez': '👨‍💻', 
            'María López': '👩‍🏫',
            'Carlos Mendoza': '👨‍⚕️',
            'Ana Rivera': '👩‍🎨',
            'Luis García': '👨‍🔧',
            'Sofia Hernández': '👩‍⚖️',
            'Pedro Martínez': '👨‍🎯',
            'Ana García': '👩‍💼',
            'Carlos López': '👨‍💻',
            'María Rodriguez': '👩‍🏫',
            'Sofia Martínez': '👩‍🎨',
            'Carmen Ruiz': '👩‍⚖️',
            'Diego Torres': '👨‍🎯',
            'Luis Mendoza': '👨‍🔧'
        };
        return avatarMap[memberName] || '👤';
    }

    generateGroupActivity(group) {
        // Simulamos actividad reciente del grupo
        const activities = [
            { type: 'payment', icon: 'fas fa-money-bill-wave', text: 'Pago recibido de L. 1,500', time: '2 horas', color: 'success' },
            { type: 'member', icon: 'fas fa-user-plus', text: 'Nuevo miembro se unió al grupo', time: '1 día', color: 'info' },
            { type: 'meeting', icon: 'fas fa-calendar', text: 'Reunión programada para mañana', time: '2 días', color: 'warning' },
            { type: 'achievement', icon: 'fas fa-trophy', text: 'Grupo alcanzó 90% de puntualidad', time: '3 días', color: 'success' }
        ];

        return activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.color}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.text}</p>
                    <span class="activity-time">Hace ${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    // Función mejorada para administrar grupos
    manageGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group || !group.isAdmin) {
            this.showNotification('⚠️ No tienes permisos para administrar este grupo', 'warning');
            return;
        }

        const modal = this.createModal('manage-group', `🔧 Administrar: ${group.name}`, `
            <div class="manage-group-container">
                <div class="management-tabs">
                    <button class="tab-btn active" onclick="advancedGroupsSystem.showManagementTab('members', '${groupId}')">
                        <i class="fas fa-users"></i> Miembros
                    </button>
                    <button class="tab-btn" onclick="advancedGroupsSystem.showManagementTab('settings', '${groupId}')">
                        <i class="fas fa-cog"></i> Configuración
                    </button>
                    <button class="tab-btn" onclick="advancedGroupsSystem.showManagementTab('finances', '${groupId}')">
                        <i class="fas fa-chart-line"></i> Finanzas
                    </button>
                    <button class="tab-btn" onclick="advancedGroupsSystem.showManagementTab('notifications', '${groupId}')">
                        <i class="fas fa-bell"></i> Notificaciones
                    </button>
                </div>
                
                <div id="management-content" class="management-content">
                    ${this.renderMembersManagement(group)}
                </div>
            </div>
        `);

        // Configurar botones del modal
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-success" onclick="advancedGroupsSystem.saveGroupChanges('${groupId}')">
                <i class="fas fa-save"></i> Guardar Cambios
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                Cerrar
            </button>
        `;
    }

    showManagementTab(tab, groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Actualizar botones activos
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick*="${tab}"]`).classList.add('active');

        // Mostrar contenido correspondiente
        const content = document.getElementById('management-content');
        switch(tab) {
            case 'members':
                content.innerHTML = this.renderMembersManagement(group);
                break;
            case 'settings':
                content.innerHTML = this.renderSettingsManagement(group);
                break;
            case 'finances':
                content.innerHTML = this.renderFinancesManagement(group);
                break;
            case 'notifications':
                content.innerHTML = this.renderNotificationsManagement(group);
                break;
        }
    }

    renderMembersManagement(group) {
        return `
            <div class="members-management">
                <div class="section-header">
                    <h4>Gestión de Miembros (${Array.isArray(group.members) ? group.members.length : group.members}/${group.maxMembers})</h4>
                    <button class="btn btn-primary btn-sm" onclick="advancedGroupsSystem.inviteMembers('${group.id}')">
                        <i class="fas fa-user-plus"></i> Invitar Miembros
                    </button>
                </div>
                
                <div class="members-list-management">
                    ${this.generateMembersManagementList(group)}
                </div>

                ${group.members < group.maxMembers ? `
                <div class="invite-section">
                    <h5>Invitar Nuevos Miembros</h5>
                    <div class="invite-form">
                        <input type="email" placeholder="Correo electrónico" class="form-control" id="invite-email">
                        <button class="btn btn-success" onclick="advancedGroupsSystem.sendInvitation('${group.id}')">
                            <i class="fas fa-paper-plane"></i> Enviar Invitación
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    generateMembersManagementList(group) {
        // Fixed member data - unique members only
        const membersData = [
            { name: 'Ana García (Tú)', avatar: '👩‍💼', email: 'ana@email.com', isOwner: true, isCurrentUser: true },
            { name: 'Carlos López', avatar: '👨‍💻', email: 'carlos@email.com', isOwner: false, isCurrentUser: false },
            { name: 'María Rodriguez', avatar: '👩‍🏫', email: 'maria@email.com', isOwner: false, isCurrentUser: false },
            { name: 'Juan Pérez', avatar: '👨‍⚕️', email: 'juan@email.com', isOwner: false, isCurrentUser: false },
            { name: 'Sofia Martínez', avatar: '👩‍🎨', email: 'sofia@email.com', isOwner: false, isCurrentUser: false },
            { name: 'Luis González', avatar: '👨‍🔧', email: 'luis@email.com', isOwner: false, isCurrentUser: false },
            { name: 'Carmen Ruiz', avatar: '👩‍⚖️', email: 'carmen@email.com', isOwner: false, isCurrentUser: false },
            { name: 'Diego Torres', avatar: '👨‍🎯', email: 'diego@email.com', isOwner: false, isCurrentUser: false }
        ];
        
        // Only show actual number of members (no duplicates)
        const actualMembersCount = Math.min(group.members || 8, membersData.length);
        let membersHtml = '';
        
        for (let i = 0; i < actualMembersCount; i++) {
            const member = membersData[i];
            const memberKey = `member_${i}`;
            
            membersHtml += `
                <div class="member-management-item" data-member-id="${memberKey}">
                    <div class="member-info-detailed">
                        <div class="member-avatar">${member.avatar}</div>
                        <div class="member-details">
                            <div class="member-name">${member.name}</div>
                            <div class="member-email">${member.email}</div>
                            <div class="member-badges">
                                ${member.isOwner ? '<span class="badge badge-owner">Coordinador</span>' : '<span class="badge badge-member">Miembro</span>'}
                                ${member.isCurrentUser ? '<span class="badge badge-current">Tú</span>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="member-actions">
                        ${!member.isCurrentUser ? `
                        <div class="role-selector">
                            <select class="form-select form-select-sm" onchange="advancedGroupsSystem.changeRole('${group.id}', '${memberKey}', this.value)">
                                <option value="member" ${!member.isOwner ? 'selected' : ''}>Miembro</option>
                                <option value="admin" ${member.isOwner ? 'selected' : ''}>Administrador</option>
                            </select>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="advancedGroupsSystem.removeMember('${group.id}', '${memberKey}')" title="Remover miembro">
                            <i class="fas fa-user-times"></i>
                        </button>
                        ` : '<span class="text-muted current-user">Tu cuenta</span>'}
                    </div>
                </div>
            `;
        }
        
        return membersHtml;
    }

    generateGroupDetailsMembersList(group) {
        let membersData = [];
        
        // Handle both cases: members as array of objects or members as number
        if (Array.isArray(group.members)) {
            // Use actual member data
            membersData = group.members.map((member, index) => ({
                name: member.name + (member.id === this.currentUser.id ? ' (Tú)' : ''),
                avatar: this.getMemberAvatar(member.name),
                email: `${member.name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
                isOwner: member.role === 'coordinator',
                isCurrentUser: member.id === this.currentUser.id,
                role: member.role === 'coordinator' ? 'Coordinador' : member.role === 'admin' ? 'Administrador' : 'Miembro'
            }));
        } else {
            // Generate mock member data 
            const mockMembers = [
                { name: 'Ana García (Tú)', avatar: '👩‍💼', email: 'ana@email.com', isOwner: true, isCurrentUser: true, role: 'Coordinador' },
                { name: 'Carlos López', avatar: '👨‍💻', email: 'carlos@email.com', isOwner: false, isCurrentUser: false, role: 'Miembro' },
                { name: 'María Rodriguez', avatar: '👩‍🏫', email: 'maria@email.com', isOwner: false, isCurrentUser: false, role: 'Miembro' },
                { name: 'Juan Pérez', avatar: '👨‍⚕️', email: 'juan@email.com', isOwner: false, isCurrentUser: false, role: 'Miembro' },
                { name: 'Sofia Martínez', avatar: '👩‍🎨', email: 'sofia@email.com', isOwner: false, isCurrentUser: false, role: 'Miembro' },
                { name: 'Luis González', avatar: '👨‍🔧', email: 'luis@email.com', isOwner: false, isCurrentUser: false, role: 'Miembro' },
                { name: 'Carmen Ruiz', avatar: '👩‍⚖️', email: 'carmen@email.com', isOwner: false, isCurrentUser: false, role: 'Miembro' },
                { name: 'Diego Torres', avatar: '👨‍🎯', email: 'diego@email.com', isOwner: false, isCurrentUser: false, role: 'Miembro' }
            ];
            membersData = mockMembers;
        }
        
        // Only show actual number of members (no duplicates)
        const memberCount = Array.isArray(group.members) ? group.members.length : (group.members || 8);
        const actualMembersCount = Math.min(memberCount, membersData.length);
        let membersHtml = '';
        
        for (let i = 0; i < actualMembersCount; i++) {
            const member = membersData[i];
            
            membersHtml += `
                <div class="member-detail-item" data-member-id="member_${i}">
                    <div class="member-avatar-detail">${member.avatar}</div>
                    <div class="member-info-detail">
                        <div class="member-name-detail">${member.name}</div>
                        <div class="member-email-detail">${member.email}</div>
                        <div class="member-role-detail">
                            <span class="role-badge ${member.isOwner ? 'role-owner' : 'role-member'}">
                                ${member.role}
                            </span>
                            ${member.isCurrentUser ? '<span class="current-badge">Tú</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }
        
        return membersHtml;
    }

    renderSettingsManagement(group) {
        return `
            <div class="settings-management">
                <div class="setting-section">
                    <h5>Información Básica</h5>
                    <div class="form-group">
                        <label>Nombre del Grupo</label>
                        <input type="text" class="form-control" value="${group.name}" id="group-name-edit">
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea class="form-control" id="group-description-edit">${group.description}</textarea>
                    </div>
                </div>

                <div class="setting-section">
                    <h5>Configuración Financiera</h5>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Contribución Base (L.)</label>
                            <input type="number" class="form-control" value="${group.contribution}" id="group-contribution-edit">
                        </div>
                        <div class="form-group">
                            <label>Máximo Miembros</label>
                            <input type="number" class="form-control" value="${group.maxMembers}" id="group-max-members-edit">
                        </div>
                    </div>
                </div>

                <div class="setting-section">
                    <h5>Configuración Avanzada</h5>
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="checkbox" checked> Permitir retiros anticipados
                            <span class="checkbox-custom"></span>
                            <span>Los miembros pueden retirar antes del ciclo completo</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" checked> Aplicar multas por retrasos
                            <span class="checkbox-custom"></span>
                            <span>Cobrar multa automática por pagos tardíos</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox"> Requerir aprobación para nuevos miembros
                            <span class="checkbox-custom"></span>
                            <span>Los administradores deben aprobar nuevos miembros</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    renderFinancesManagement(group) {
        return `
            <div class="finances-management">
                <div class="finance-overview">
                    <div class="finance-stats-grid">
                        <div class="finance-stat">
                            <div class="stat-icon"><i class="fas fa-piggy-bank"></i></div>
                            <div class="stat-info">
                                <span class="stat-value">L. ${group.totalSavings.toLocaleString()}</span>
                                <span class="stat-label">Total Acumulado</span>
                            </div>
                        </div>
                        <div class="finance-stat">
                            <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                            <div class="stat-info">
                                <span class="stat-value">${Math.round(group.performance)}%</span>
                                <span class="stat-label">Tasa de Pago</span>
                            </div>
                        </div>
                        <div class="finance-stat">
                            <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                            <div class="stat-info">
                                <span class="stat-value">0</span>
                                <span class="stat-label">Pagos Pendientes</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="finance-actions">
                    <h5>Acciones Financieras</h5>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="advancedGroupsSystem.recordPayment('${group.id}')">
                            <i class="fas fa-money-bill-wave"></i> Registrar Pago
                        </button>
                        <button class="btn btn-info" onclick="advancedGroupsSystem.generateFinanceReport('${group.id}')">
                            <i class="fas fa-chart-bar"></i> Generar Reporte
                        </button>
                        <button class="btn btn-warning" onclick="advancedGroupsSystem.sendPaymentReminders('${group.id}')">
                            <i class="fas fa-bell"></i> Enviar Recordatorios
                        </button>
                    </div>
                </div>

                <div class="recent-transactions">
                    <h5>Transacciones Recientes</h5>
                    <div class="transactions-list">
                        ${this.generateRecentTransactions(group)}
                    </div>
                </div>
            </div>
        `;
    }

    generateRecentTransactions(group) {
        const transactions = [
            { type: 'payment', member: 'Carlos López', amount: 1500, date: '2025-01-08', status: 'completed' },
            { type: 'payment', member: 'María Rodriguez', amount: 1500, date: '2025-01-07', status: 'completed' },
            { type: 'penalty', member: 'Juan Pérez', amount: 50, date: '2025-01-06', status: 'completed' },
            { type: 'payment', member: 'Sofia Martínez', amount: 1500, date: '2025-01-05', status: 'completed' }
        ];

        return transactions.map(tx => `
            <div class="transaction-item">
                <div class="transaction-icon ${tx.type}">
                    <i class="fas fa-${tx.type === 'payment' ? 'money-bill-wave' : 'exclamation-triangle'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">
                        ${tx.type === 'payment' ? 'Pago recibido' : 'Multa aplicada'} - ${tx.member || 'Miembro desconocido'}
                    </div>
                    <div class="transaction-date">${new Date(tx.date).toLocaleDateString('es-HN')}</div>
                </div>
                <div class="transaction-amount ${tx.type}">
                    ${tx.type === 'payment' ? '+' : '-'}L. ${tx.amount.toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    renderNotificationsManagement(group) {
        return `
            <div class="notifications-management">
                <div class="notification-settings">
                    <h5>Configuración de Notificaciones</h5>
                    <div class="notification-options">
                        <div class="notification-item">
                            <div class="notification-info">
                                <h6>Recordatorios de Pago</h6>
                                <p>Notificar a los miembros 3 días antes del vencimiento</p>
                            </div>
                            <div class="notification-toggle">
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="notification-item">
                            <div class="notification-info">
                                <h6>Nuevos Miembros</h6>
                                <p>Notificar cuando alguien se une al grupo</p>
                            </div>
                            <div class="notification-toggle">
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="notification-item">
                            <div class="notification-info">
                                <h6>Reuniones Programadas</h6>
                                <p>Recordatorios de reuniones y eventos del grupo</p>
                            </div>
                            <div class="notification-toggle">
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bulk-notifications">
                    <h5>Enviar Notificaciones</h5>
                    <div class="bulk-notification-form">
                        <div class="form-group">
                            <label>Mensaje</label>
                            <textarea class="form-control" placeholder="Escribe tu mensaje aquí..." rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Destinatarios</label>
                            <div class="checkbox-group">
                                <label class="checkbox-option">
                                    <input type="checkbox" checked>
                                    <span class="checkbox-custom"></span>
                                    <span>Todos los miembros</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox">
                                    <span class="checkbox-custom"></span>
                                    <span>Solo administradores</span>
                                </label>
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="advancedGroupsSystem.sendBulkNotification('${group.id}')">
                            <i class="fas fa-paper-plane"></i> Enviar Mensaje
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Función de navegación conectada: Desde Grupos → Gestión de Tandas
    viewGroupTandasFromGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        // Cerrar cualquier modal abierto
        this.closeModal();
        
        // Cambiar a la pestaña de Gestión de Tandas
        this.switchTab('tandas');
        
        // Aplicar filtro por grupo después de un pequeño delay
        setTimeout(() => {
            this.filterTandasByGroup(groupId);
            this.showNotification(`🔄 Mostrando tandas del grupo: ${group.name}`, 'info', 3000);
        }, 300);
    }

    // Función mejorada para ver tandas del grupo (DEPRECATED - usar viewGroupTandasFromGroup)
    viewGroupTandas(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const modal = this.createModal('group-tandas', `🔄 Tandas: ${group.name}`, `
            <div class="group-tandas-container">
                <div class="tandas-header">
                    <div class="tandas-stats">
                        <div class="stat-item">
                            <span class="stat-value">3</span>
                            <span class="stat-label">Tandas Activas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">2</span>
                            <span class="stat-label">Completadas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">L. ${(group.contribution * (Array.isArray(group.members) ? group.members.length : group.members)).toLocaleString()}</span>
                            <span class="stat-label">Valor por Tanda</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.createNewTanda('${groupId}')">
                        <i class="fas fa-plus"></i> Nueva Tanda
                    </button>
                </div>

                <div class="tandas-list">
                    ${this.generateGroupTandasList(group)}
                </div>
            </div>
        `);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                Cerrar
            </button>
        `;
    }

    generateGroupTandasList(group) {
        const tandas = [
            { id: 1, name: 'Tanda Enero 2025', status: 'active', progress: 75, currentRound: 3, totalRounds: 4, nextPayment: '2025-01-15' },
            { id: 2, name: 'Tanda Diciembre 2024', status: 'completed', progress: 100, currentRound: 4, totalRounds: 4, completedDate: '2024-12-30' },
            { id: 3, name: 'Tanda Febrero 2025', status: 'upcoming', progress: 0, currentRound: 0, totalRounds: 4, startDate: '2025-02-01' }
        ];

        return tandas.map(tanda => `
            <div class="tanda-item ${tanda.status}">
                <div class="tanda-info">
                    <h6>${tanda.name}</h6>
                    <div class="tanda-progress">
                        <div class="progress-bar-small">
                            <div class="progress-fill" style="width: ${tanda.progress}%"></div>
                        </div>
                        <span class="progress-text">${tanda.progress}% completado</span>
                    </div>
                    <div class="tanda-details">
                        <span class="detail-item">
                            <i class="fas fa-sync-alt"></i>
                            Ronda ${tanda.currentRound}/${tanda.totalRounds}
                        </span>
                        ${tanda.status === 'active' ? `
                        <span class="detail-item">
                            <i class="fas fa-calendar"></i>
                            Próximo pago: ${new Date(tanda.nextPayment).toLocaleDateString('es-HN')}
                        </span>
                        ` : ''}
                        ${tanda.status === 'completed' ? `
                        <span class="detail-item">
                            <i class="fas fa-check-circle"></i>
                            Completada: ${new Date(tanda.completedDate).toLocaleDateString('es-HN')}
                        </span>
                        ` : ''}
                        ${tanda.status === 'upcoming' ? `
                        <span class="detail-item">
                            <i class="fas fa-clock"></i>
                            Inicia: ${new Date(tanda.startDate).toLocaleDateString('es-HN')}
                        </span>
                        ` : ''}
                    </div>
                </div>
                <div class="tanda-actions">
                    <button class="btn btn-sm btn-primary" onclick="advancedGroupsSystem.viewTandaDetails('${tanda.id}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    ${tanda.status === 'active' ? `
                    <button class="btn btn-sm btn-success" onclick="advancedGroupsSystem.recordTandaPayment('${tanda.id}')">
                        <i class="fas fa-money-bill-wave"></i> Registrar Pago
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // 🎯 FUNCIONES DE ACCIÓN PARA BOTONES DE ADMINISTRACIÓN
    // ========================================

    // Acciones de gestión de miembros
    inviteMembers(groupId) {
        this.showNotification('📧 Función de invitación disponible próximamente', 'info');
    }

    sendInvitation(groupId) {
        const email = document.getElementById('invite-email')?.value;
        if (!email) {
            this.showNotification('⚠️ Por favor ingresa un correo electrónico', 'warning');
            return;
        }
        
        this.showNotification(`✅ Invitación enviada a ${email}`, 'success');
        document.getElementById('invite-email').value = '';
    }

    changeRole(groupId, memberId, newRole) {
        const roleName = newRole === 'admin' ? 'Administrador' : 'Miembro';
        this.showNotification(`✅ Rol cambiado a ${roleName}`, 'success');
    }

    removeMember(groupId, memberId) {
        const confirmModal = this.createModal('confirm-remove', '⚠️ Confirmar Acción', `
            <div class="confirmation-content">
                <p>¿Estás seguro de que deseas remover este miembro del grupo?</p>
                <p class="warning-text">Esta acción no se puede deshacer.</p>
            </div>
        `);

        confirmModal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-danger" onclick="advancedGroupsSystem.confirmRemoveMember('${groupId}', '${memberId}')">
                <i class="fas fa-trash"></i> Remover
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                Cancelar
            </button>
        `;
    }

    confirmRemoveMember(groupId, memberId) {
        // Actualizar la lista de miembros del grupo
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.members--;
        }
        
        this.showNotification('✅ Miembro removido del grupo', 'success');
        this.closeModal();
        
        // Refrescar la vista de administración
        setTimeout(() => {
            this.manageGroup(groupId);
        }, 500);
    }

    saveGroupChanges(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Obtener valores de los campos editables
        const nameField = document.getElementById('group-name-edit');
        const descField = document.getElementById('group-description-edit');
        const contributionField = document.getElementById('group-contribution-edit');
        const maxMembersField = document.getElementById('group-max-members-edit');

        if (nameField) group.name = nameField.value;
        if (descField) group.description = descField.value;
        if (contributionField) group.contribution = parseInt(contributionField.value);
        if (maxMembersField) group.maxMembers = parseInt(maxMembersField.value);

        this.showNotification('✅ Cambios guardados exitosamente', 'success');
        this.updateDashboard(); // Actualizar estadísticas
        this.closeModal();
        
        // Refrescar la lista de grupos
        if (this.currentTab === 'groups') {
            this.loadGroupsContent();
        }
    }

    // Acciones financieras
    recordPayment(groupId) {
        const modal = this.createModal('record-payment', '💰 Registrar Pago', `
            <div class="payment-form">
                <div class="form-group">
                    <label>Miembro</label>
                    <select class="form-control" id="payment-member">
                        <option value="">Seleccionar miembro...</option>
                        <option value="carlos">Carlos López</option>
                        <option value="maria">María Rodriguez</option>
                        <option value="juan">Juan Pérez</option>
                        <option value="sofia">Sofia Martínez</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Monto (L.)</label>
                    <input type="number" class="form-control" id="payment-amount" value="1500">
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" class="form-control" id="payment-date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Método de Pago</label>
                    <select class="form-control" id="payment-method">
                        <option value="cash">Efectivo</option>
                        <option value="transfer">Transferencia</option>
                        <option value="mobile">Pago Móvil</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notas (opcional)</label>
                    <textarea class="form-control" id="payment-notes" placeholder="Comentarios adicionales..."></textarea>
                </div>
            </div>
        `);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-success" onclick="advancedGroupsSystem.confirmRecordPayment('${groupId}')">
                <i class="fas fa-check"></i> Registrar Pago
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                Cancelar
            </button>
        `;
    }

    confirmRecordPayment(groupId) {
        const member = document.getElementById('payment-member')?.value;
        const amount = document.getElementById('payment-amount')?.value;
        
        if (!member || !amount) {
            this.showNotification('⚠️ Por favor completa todos los campos obligatorios', 'warning');
            return;
        }

        // Simular registro del pago
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.totalSavings += parseInt(amount);
        }

        this.showNotification(`✅ Pago de L. ${parseInt(amount).toLocaleString()} registrado exitosamente`, 'success');
        this.updateDashboard();
        this.closeModal();
    }

    generateFinanceReport(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Simular generación de reporte
        const reportData = {
            group: group,
            totalPayments: group.totalSavings,
            paymentRate: group.performance,
            memberCount: group.members,
            generatedDate: new Date()
        };

        // Crear blob con datos del reporte
        const reportContent = `
REPORTE FINANCIERO - ${group.name}
===============================
Fecha de generación: ${reportData.generatedDate.toLocaleDateString('es-HN')}

RESUMEN GENERAL:
- Total recaudado: L. ${reportData.totalPayments.toLocaleString()}
- Tasa de pago: ${reportData.paymentRate}%
- Miembros activos: ${reportData.memberCount}
- Contribución base: L. ${group.contribution.toLocaleString()}

ESTADÍSTICAS:
- Días activo: ${this.calculateActiveDays(group.created)} días
- Promedio mensual: L. ${Math.round(reportData.totalPayments / Math.max(1, this.calculateActiveDays(group.created) / 30)).toLocaleString()}
- Puntualidad: ${reportData.paymentRate}%

Generado por La Tanda Web3 Sistema
        `;

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${group.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('📊 Reporte financiero descargado', 'success');
    }

    sendPaymentReminders(groupId) {
        this.showNotification('📧 Recordatorios de pago enviados a todos los miembros', 'success');
    }

    sendBulkNotification(groupId) {
        const message = document.querySelector('.bulk-notification-form textarea')?.value;
        if (!message.trim()) {
            this.showNotification('⚠️ Por favor escribe un mensaje', 'warning');
            return;
        }

        this.showNotification('📧 Notificación enviada a todos los miembros seleccionados', 'success');
        document.querySelector('.bulk-notification-form textarea').value = '';
    }

    // Acciones de tandas
    createNewTanda(groupId) {
        const modal = this.createModal('create-tanda', '🔄 Nueva Tanda', `
            <div class="tanda-form">
                <div class="form-group">
                    <label>Nombre de la Tanda</label>
                    <input type="text" class="form-control" id="tanda-name" placeholder="Ej: Tanda Marzo 2025">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha de Inicio</label>
                        <input type="date" class="form-control" id="tanda-start-date" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Número de Rondas</label>
                        <input type="number" class="form-control" id="tanda-rounds" value="4" min="2" max="12">
                    </div>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea class="form-control" id="tanda-description" placeholder="Describe los objetivos de esta tanda..."></textarea>
                </div>
                <div class="form-group">
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="checkbox" id="tanda-auto-assign" checked>
                            <span class="checkbox-custom"></span>
                            <span>Asignación automática de turnos</span>
                        </label>
                    </div>
                </div>
            </div>
        `);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-success" onclick="advancedGroupsSystem.confirmCreateTanda('${groupId}')">
                <i class="fas fa-plus"></i> Crear Tanda
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                Cancelar
            </button>
        `;
    }

    confirmCreateTanda(groupId) {
        const name = document.getElementById('tanda-name')?.value;
        const startDate = document.getElementById('tanda-start-date')?.value;
        const rounds = document.getElementById('tanda-rounds')?.value;

        if (!name || !startDate || !rounds) {
            this.showNotification('⚠️ Por favor completa todos los campos obligatorios', 'warning');
            return;
        }

        this.showNotification(`✅ Tanda "${name}" creada exitosamente`, 'success');
        this.closeModal();
        
        // Refrescar vista de tandas del grupo
        setTimeout(() => {
            this.viewGroupTandas(groupId);
        }, 500);
    }

    viewTandaDetails(tandaId) {
        const modal = this.createModal('tanda-details', '🔍 Detalles de Tanda', `
            <div class="tanda-details-container">
                <div class="tanda-overview">
                    <h5>Tanda Enero 2025</h5>
                    <div class="tanda-status active">Activa</div>
                </div>
                
                <div class="tanda-progress-section">
                    <div class="progress-info">
                        <span>Progreso: Ronda 3 de 4</span>
                        <span>75% completado</span>
                    </div>
                    <div class="progress-bar-large">
                        <div class="progress-fill" style="width: 75%"></div>
                    </div>
                </div>

                <div class="tanda-rounds">
                    <h6>Historial de Rondas</h6>
                    <div class="rounds-list">
                        <div class="round-item completed">
                            <div class="round-info">
                                <span class="round-number">Ronda 1</span>
                                <span class="round-date">Dic 2024</span>
                            </div>
                            <div class="round-winner">
                                <span>Ganador: Ana García</span>
                                <span class="round-amount">L. 6,000</span>
                            </div>
                        </div>
                        <div class="round-item completed">
                            <div class="round-info">
                                <span class="round-number">Ronda 2</span>
                                <span class="round-date">Ene 2025</span>
                            </div>
                            <div class="round-winner">
                                <span>Ganador: Carlos López</span>
                                <span class="round-amount">L. 6,000</span>
                            </div>
                        </div>
                        <div class="round-item active">
                            <div class="round-info">
                                <span class="round-number">Ronda 3</span>
                                <span class="round-date">Feb 2025</span>
                            </div>
                            <div class="round-winner">
                                <span>Próximo: María Rodriguez</span>
                                <span class="round-amount">L. 6,000</span>
                            </div>
                        </div>
                        <div class="round-item pending">
                            <div class="round-info">
                                <span class="round-number">Ronda 4</span>
                                <span class="round-date">Mar 2025</span>
                            </div>
                            <div class="round-winner">
                                <span>Pendiente</span>
                                <span class="round-amount">L. 6,000</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.manageTandaRounds('${tandaId}')">
                <i class="fas fa-cog"></i> Gestionar Rondas
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                Cerrar
            </button>
        `;
    }

    recordTandaPayment(tandaId) {
        this.showNotification('💰 Registrando pago de tanda...', 'info');
        setTimeout(() => {
            this.showNotification('✅ Pago de tanda registrado exitosamente', 'success');
        }, 1000);
    }

    manageTandaRounds(tandaId) {
        this.showNotification('⚙️ Gestión de rondas disponible próximamente', 'info');
    }

    // Mejoras a funciones existentes de menú de tres puntos
    shareGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const modal = this.createModal('share-group', '📤 Compartir Grupo', `
            <div class="share-group-container">
                <!-- Preview Section -->
                <div class="share-preview-section">
                    <div class="share-preview-header">
                        <i class="fas fa-eye"></i>
                        Vista Previa de Invitación
                    </div>
                    <p>Así verán tu grupo las personas invitadas</p>
                    
                    <div class="group-preview-card">
                        <div class="preview-header">
                            <div class="preview-icon">
                                ${group.avatar}
                            </div>
                            <div class="preview-title">
                                <h4>${group.name}</h4>
                                <p>${group.description}</p>
                            </div>
                            <div class="preview-status-badge">
                                📢 ${this.getStatusLabel(group.status)}
                            </div>
                        </div>
                        
                        <div class="preview-details">
                            <div class="preview-detail">
                                <i class="fas fa-money-bill-wave"></i>
                                <span>L. ${group.contribution.toLocaleString()} Contribución ${this.getFrequencyLabel(group.frequency)}</span>
                            </div>
                            <div class="preview-detail">
                                <i class="fas fa-users"></i>
                                <span>${Array.isArray(group.members) ? group.members.length : group.members}/${group.maxMembers} Miembros Activos</span>
                            </div>
                            <div class="preview-detail">
                                <i class="fas fa-shield-alt"></i>
                                <span>${group.trustScore}% Score de Confianza</span>
                            </div>
                            <div class="preview-detail">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${group.location} Ubicación</span>
                            </div>
                        </div>
                        
                        <div class="preview-footer">
                            <i class="fas fa-heart"></i>
                            <span>Powered by La Tanda Honduras</span>
                        </div>
                    </div>
                </div>
                
                <!-- Share Methods Section -->
                <div class="share-methods-section">
                    <div class="share-methods-header">
                        <h4><i class="fas fa-share-alt"></i> Opciones de Compartir</h4>
                        <p>Elige cómo quieres invitar a nuevos miembros</p>
                    </div>
                    
                    <div class="share-methods-grid">
                        <div class="share-method" onclick="advancedGroupsSystem.shareViaWhatsApp('${groupId}')">
                            <div class="share-method-icon">
                                <i class="fab fa-whatsapp"></i>
                            </div>
                            <h5>WhatsApp</h5>
                            <p>Comparte por chat o grupos</p>
                        </div>
                        
                        <div class="share-method" onclick="advancedGroupsSystem.shareViaEmail('${groupId}')">
                            <div class="share-method-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <h5>Email</h5>
                            <p>Envía invitación formal</p>
                        </div>
                        
                        <div class="share-method" onclick="advancedGroupsSystem.shareViaTelegram('${groupId}')">
                            <div class="share-method-icon">
                                <i class="fab fa-telegram-plane"></i>
                            </div>
                            <h5>Telegram</h5>
                            <p>Comparte en chats y canales</p>
                        </div>
                        
                        <div class="share-method" onclick="advancedGroupsSystem.copyGroupLink('${groupId}')">
                            <div class="share-method-icon">
                                <i class="fas fa-link"></i>
                            </div>
                            <h5>Copiar Enlace</h5>
                            <p>Copia link directo al grupo</p>
                        </div>
                        
                        <div class="share-method" onclick="advancedGroupsSystem.generateQRCode('${groupId}')">
                            <div class="share-method-icon">
                                <i class="fas fa-qrcode"></i>
                            </div>
                            <h5>Código QR</h5>
                            <p>Genera código para escanear</p>
                        </div>
                        
                        <div class="share-method" onclick="advancedGroupsSystem.shareOnSocialMedia('${groupId}')">
                            <div class="share-method-icon">
                                <i class="fas fa-share-nodes"></i>
                            </div>
                            <h5>Redes Sociales</h5>
                            <p>Facebook, Twitter, Instagram</p>
                        </div>
                    </div>
                </div>
                
                <!-- Share Statistics -->
                <div class="share-stats">
                    <h4><i class="fas fa-chart-line"></i> Actividad de Invitaciones</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-value">15</span>
                            <span class="stat-label">Invitaciones Enviadas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">8</span>
                            <span class="stat-label">Miembros Unidos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">53%</span>
                            <span class="stat-label">Tasa de Conversión</span>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Copy Section -->
                <div class="quick-copy-section">
                    <input type="text" class="quick-copy-input" value="https://latanda.online/grupos/${groupId}" readonly>
                    <button class="quick-copy-btn" onclick="advancedGroupsSystem.copyGroupLink('${groupId}')">
                        <i class="fas fa-copy"></i>
                        Copiar Enlace Rápido
                    </button>
                </div>
            </div>
        `, true);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.copyGroupLink('${groupId}')">
                <i class="fas fa-copy"></i> Copiar Enlace Rápido
            </button>
            <button class="btn btn-success" onclick="advancedGroupsSystem.shareViaWhatsApp('${groupId}')">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
    }

    shareViaWhatsApp(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const memberCount = Array.isArray(group.members) ? group.members.length : group.members;
        const message = `¡Únete al grupo "${group.name}"! 🚀\n\n` +
                       `💰 Contribución: L. ${group.contribution.toLocaleString()}\n` +
                       `👥 Miembros: ${memberCount}/${group.maxMembers}\n` +
                       `🏆 Confianza: ${group.trustScore}%\n\n` +
                       `#LaTandaHonduras #AhorroColectivo`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        this.showNotification('📱 Abriendo WhatsApp...', 'info');
    }

    shareViaEmail(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Get consistent member count
        const memberCount = Array.isArray(group.members) ? group.members.length : (group.members || 0);
        
        const subject = `Invitación al grupo: ${group.name}`;
        
        const body = `Hola,\n\nTe invito a unirte a nuestro grupo de ahorro "${group.name}".\n\n` +
                    `Detalles:\n` +
                    `• Contribución: L. ${group.contribution.toLocaleString()}\n` +
                    `• Miembros actuales: ${memberCount}/${group.maxMembers}\n` +
                    `• Puntaje de confianza: ${group.trustScore}%\n\n` +
                    `¡Ahorra de forma segura y organizada con La Tanda Honduras!\n\n` +
                    `Saludos cordiales`;

        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
        
        this.showNotification('📧 Abriendo cliente de email...', 'info');
    }

    copyGroupLink(groupId) {
        const groupLink = `https://latanda.hn/group/${groupId}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(groupLink).then(() => {
                this.showNotification('🔗 Enlace copiado al portapapeles', 'success');
            });
        } else {
            // Fallback para navegadores más antiguos
            const textArea = document.createElement('textarea');
            textArea.value = groupLink;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                this.showNotification('🔗 Enlace copiado al portapapeles', 'success');
            } catch (err) {
                this.showNotification('❌ No se pudo copiar el enlace', 'error');
            }
            document.body.removeChild(textArea);
        }
    }

    generateQRCode(groupId) {
        this.showNotification('📱 Código QR disponible próximamente', 'info');
    }

    exportGroupData(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const modal = this.createModal('export-data', '📊 Exportar Datos', `
            <div class="export-data-container">
                <div class="export-options">
                    <h6>Selecciona qué datos exportar:</h6>
                    <div class="export-checkboxes">
                        <label class="checkbox-option">
                            <input type="checkbox" id="export-basic" checked>
                            <span class="checkbox-custom"></span>
                            <span>Información básica del grupo</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" id="export-members" checked>
                            <span class="checkbox-custom"></span>
                            <span>Lista de miembros</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" id="export-finances" checked>
                            <span class="checkbox-custom"></span>
                            <span>Datos financieros</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" id="export-transactions">
                            <span class="checkbox-custom"></span>
                            <span>Historial de transacciones</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" id="export-activity">
                            <span class="checkbox-custom"></span>
                            <span>Registro de actividad</span>
                        </label>
                    </div>
                </div>
                
                <div class="export-format">
                    <h6>Formato de exportación:</h6>
                    <div class="format-options">
                        <label class="radio-option">
                            <input type="radio" name="export-format" value="json" checked>
                            <span class="radio-custom"></span>
                            <span>JSON (para desarrolladores)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="export-format" value="csv">
                            <span class="radio-custom"></span>
                            <span>CSV (para Excel)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="export-format" value="txt">
                            <span class="radio-custom"></span>
                            <span>TXT (texto plano)</span>
                        </label>
                    </div>
                </div>
            </div>
        `);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-success" onclick="advancedGroupsSystem.confirmExportData('${groupId}')">
                <i class="fas fa-download"></i> Exportar
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                Cancelar
            </button>
        `;
    }

    confirmExportData(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Obtener opciones seleccionadas
        const includeBasic = document.getElementById('export-basic')?.checked;
        const includeMembers = document.getElementById('export-members')?.checked;
        const includeFinances = document.getElementById('export-finances')?.checked;
        const includeTransactions = document.getElementById('export-transactions')?.checked;
        const includeActivity = document.getElementById('export-activity')?.checked;
        
        const format = document.querySelector('input[name="export-format"]:checked')?.value || 'json';

        // Preparar datos para exportación
        const exportData = {
            exportInfo: {
                groupId: group.id,
                exportDate: new Date().toISOString(),
                exportedBy: 'Usuario Actual',
                format: format
            }
        };

        if (includeBasic) {
            exportData.basicInfo = {
                name: group.name,
                description: group.description,
                type: group.type,
                location: group.location,
                created: group.created,
                status: group.status
            };
        }

        if (includeMembers) {
            exportData.members = {
                count: group.members,
                maxMembers: group.maxMembers,
                // Datos simulados de miembros
                list: ['Ana García', 'Carlos López', 'María Rodriguez', 'Juan Pérez'].slice(0, group.members)
            };
        }

        if (includeFinances) {
            exportData.finances = {
                contribution: group.contribution,
                totalSavings: group.totalSavings,
                performance: group.performance,
                trustScore: group.trustScore
            };
        }

        if (includeTransactions) {
            exportData.transactions = [
                { date: '2025-01-08', member: 'Carlos López', amount: 1500, type: 'payment' },
                { date: '2025-01-07', member: 'María Rodriguez', amount: 1500, type: 'payment' }
            ];
        }

        if (includeActivity) {
            exportData.activity = [
                { date: '2025-01-08', type: 'payment', description: 'Pago recibido' },
                { date: '2025-01-07', type: 'member', description: 'Nuevo miembro' }
            ];
        }

        // Generar archivo según formato
        let fileContent, fileName, mimeType;
        
        switch (format) {
            case 'json':
                fileContent = JSON.stringify(exportData, null, 2);
                fileName = `${group.name}-datos.json`;
                mimeType = 'application/json';
                break;
            case 'csv':
                fileContent = this.convertToCSV(exportData);
                fileName = `${group.name}-datos.csv`;
                mimeType = 'text/csv';
                break;
            case 'txt':
                fileContent = this.convertToText(exportData);
                fileName = `${group.name}-datos.txt`;
                mimeType = 'text/plain';
                break;
        }

        // Descargar archivo
        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('📊 Datos exportados exitosamente', 'success');
        this.closeModal();
    }

    convertToCSV(data) {
        let csv = 'Campo,Valor\n';
        
        function addSection(obj, prefix = '') {
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    addSection(value, prefix + key + '.');
                } else if (Array.isArray(value)) {
                    csv += `${prefix}${key},${value.join(';')}\n`;
                } else {
                    csv += `${prefix}${key},${value}\n`;
                }
            }
        }
        
        addSection(data);
        return csv;
    }

    convertToText(data) {
        let text = `EXPORTACIÓN DE DATOS DEL GRUPO\n`;
        text += `================================\n`;
        text += `Fecha de exportación: ${new Date().toLocaleString('es-HN')}\n\n`;
        
        function addSection(obj, title, indent = '') {
            text += `${indent}${title}:\n`;
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    addSection(value, key, indent + '  ');
                } else if (Array.isArray(value)) {
                    text += `${indent}  ${key}: ${value.join(', ')}\n`;
                } else {
                    text += `${indent}  ${key}: ${value}\n`;
                }
            }
            text += '\n';
        }
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object') {
                addSection(value, key.toUpperCase());
            }
        }
        
        return text;
    }

    // ========================================
    // 🔄 FUNCIONES PARA GESTIÓN DE TANDAS COMPLETA
    // ========================================

    calculateTandasStats(tandas) {
        const activeTandas = tandas.filter(t => t.status === 'active');
        const completedTandas = tandas.filter(t => t.status === 'completed');
        const upcomingTandas = tandas.filter(t => t.status === 'upcoming');
        
        const totalAmount = tandas.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const pendingPayments = activeTandas.reduce((sum, t) => sum + (t.paymentsPending || 0), 0);
        
        return {
            total: tandas.length,
            active: activeTandas.length,
            completed: completedTandas.length,
            upcoming: upcomingTandas.length,
            totalAmount: totalAmount,
            pendingPayments: pendingPayments
        };
    }

    renderGroupFilter(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return '';
        
        return `
            <div class="group-filter-header">
                <div class="breadcrumb">
                    <a href="#" onclick="advancedGroupsSystem.switchTab('groups')" class="breadcrumb-item">
                        <i class="fas fa-users"></i> Mis Grupos
                    </a>
                    <i class="fas fa-chevron-right breadcrumb-separator"></i>
                    <span class="breadcrumb-item current">
                        ${group.avatar} ${group.name}
                    </span>
                    <i class="fas fa-chevron-right breadcrumb-separator"></i>
                    <span class="breadcrumb-item current">Tandas</span>
                </div>
                <div class="filter-actions">
                    <button class="btn btn-secondary btn-sm" onclick="advancedGroupsSystem.loadTandasContent()">
                        <i class="fas fa-times"></i> Quitar Filtro
                    </button>
                </div>
            </div>
        `;
    }

    renderAllTandasHeader() {
        return `
            <div class="tandas-header">
                <div class="header-content">
                    <h3><i class="fas fa-sync-alt"></i> Gestión de Tandas</h3>
                    <p class="header-subtitle">Administra tus tandas activas y ciclos de pago</p>
                </div>
            </div>
        `;
    }

    renderTandasStats(stats) {
        return `
            <div class="tandas-stats-overview">
                <div class="stat-card">
                    <div class="stat-icon active">
                        <i class="fas fa-sync-alt"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.active}</div>
                        <div class="stat-label">Tandas Activas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon completed">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.completed}</div>
                        <div class="stat-label">Completadas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon pending">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.pendingPayments}</div>
                        <div class="stat-label">Pagos Pendientes</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon total">
                        <i class="fas fa-coins"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">L. ${stats.totalAmount.toLocaleString()}</div>
                        <div class="stat-label">Valor Total</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTandasFilters() {
        return `
            <div class="tandas-filters">
                <div class="filter-group">
                    <label class="filter-label">Estado:</label>
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-filter="all" onclick="advancedGroupsSystem.filterTandasByStatus('all')">
                            Todas
                        </button>
                        <button class="filter-btn" data-filter="active" onclick="advancedGroupsSystem.filterTandasByStatus('active')">
                            Activas
                        </button>
                        <button class="filter-btn" data-filter="pending-payments" onclick="advancedGroupsSystem.filterTandasByStatus('pending-payments')">
                            Con Pagos Pendientes
                        </button>
                        <button class="filter-btn" data-filter="completed" onclick="advancedGroupsSystem.filterTandasByStatus('completed')">
                            Completadas
                        </button>
                    </div>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Grupo:</label>
                    <select class="form-select" id="group-filter" onchange="advancedGroupsSystem.filterTandasByGroup(this.value)">
                        <option value="">Todos los grupos</option>
                        ${this.groups.map(group => `
                            <option value="${group.id}">${group.avatar} ${group.name}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    renderTandaCard(tanda) {
        const statusClass = tanda.status;
        const progressWidth = tanda.progress || 0;
        const urgencyClass = this.getTandaUrgencyClass(tanda);
        const primaryAction = this.getTandaPrimaryAction(tanda);
        const statusIcon = this.getTandaStatusIcon(tanda.status);
        const daysToNext = this.calculateDaysToNext(tanda);
        
        return `
            <div class="tanda-card-v2 ${statusClass} ${urgencyClass}" data-tanda-id="${tanda.id}">
                <!-- Status Indicator -->
                <div class="tanda-status-indicator ${statusClass}">
                    <i class="fas fa-${statusIcon}"></i>
                </div>
                
                <!-- Main Content -->
                <div class="tanda-main-content">
                    <!-- Header Compact -->
                    <div class="tanda-compact-header">
                        <div class="tanda-identity">
                            <span class="group-avatar-lg">${tanda.groupAvatar}</span>
                            <div class="tanda-title-group">
                                <h5 class="tanda-title">${tanda.name}</h5>
                                <span class="group-subtitle">${tanda.groupName}</span>
                            </div>
                        </div>
                        <div class="tanda-amount-display">
                            <div class="amount-primary">L. ${tanda.roundAmount.toLocaleString()}</div>
                            <div class="amount-subtitle">por ronda</div>
                        </div>
                    </div>

                    <!-- Progress Section Enhanced -->
                    <div class="tanda-progress-enhanced">
                        <div class="progress-header">
                            <div class="progress-status">
                                ${this.renderProgressStatus(tanda)}
                            </div>
                            <div class="progress-metrics">
                                <span class="progress-rounds">${tanda.currentRound}/${tanda.totalRounds}</span>
                                <span class="progress-percentage">${progressWidth}%</span>
                            </div>
                        </div>
                        <div class="progress-bar-enhanced">
                            <div class="progress-track">
                                ${this.renderProgressSteps(tanda)}
                            </div>
                            <div class="progress-fill-animated" style="width: ${progressWidth}%"></div>
                        </div>
                    </div>

                    <!-- Critical Info Bar -->
                    <div class="tanda-critical-info">
                        ${this.renderCriticalInfo(tanda, daysToNext)}
                    </div>

                    <!-- Expandable Details -->
                    <div class="tanda-expandable-details" data-expanded="false">
                        <div class="details-trigger" onclick="advancedGroupsSystem.toggleTandaDetails('${tanda.id}')">
                            <span>Ver más detalles</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="details-content">
                            ${this.renderExpandedDetails(tanda)}
                        </div>
                    </div>
                </div>

                <!-- Actions Redesigned -->
                <div class="tanda-actions-v2">
                    <!-- Primary Action -->
                    <button class="btn-primary-action ${primaryAction.class}" 
                            onclick="${primaryAction.onclick}" 
                            ${primaryAction.disabled ? 'disabled' : ''}>
                        <i class="fas fa-${primaryAction.icon}"></i>
                        <span>${primaryAction.label}</span>
                    </button>
                    
                    <!-- Secondary Actions -->
                    <div class="secondary-actions">
                        <button class="btn-icon" onclick="advancedGroupsSystem.viewTandaDetails('${tanda.id}')" 
                                title="Ver detalles completos">
                            <i class="fas fa-eye"></i>
                        </button>
                        <div class="dropdown-enhanced">
                            <button class="btn-icon dropdown-trigger" 
                                    onclick="advancedGroupsSystem.toggleTandaActionsMenu('${tanda.id}')">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu-enhanced" data-tanda="${tanda.id}">
                                ${this.renderTandaActionMenu(tanda)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Hover Effects Layer -->
                <div class="tanda-hover-effects"></div>
            </div>
        `;
    }

    renderEmptyTandasState(groupId) {
        const group = groupId ? this.groups.find(g => g.id === groupId) : null;
        
        return `
            <div class="empty-state-tandas">
                <div class="empty-icon">🔄</div>
                <h3>${group ? `No hay tandas en ${group.name}` : 'No tienes tandas activas'}</h3>
                <p>${group ? `Este grupo aún no tiene tandas creadas` : 'Crea tu primera tanda o únete a una existente para comenzar a ahorrar'}</p>
                <div class="empty-actions">
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.showCreateTandaModal(${groupId ? `'${groupId}'` : 'null'})">
                        <i class="fas fa-plus"></i> ${group ? 'Crear Tanda en este Grupo' : 'Crear Mi Primera Tanda'}
                    </button>
                    ${!group ? `
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.switchTab('matching')">
                        <i class="fas fa-search"></i> Buscar Tandas para Unirse
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getTandaUrgencyClass(tanda) {
        if (tanda.status !== 'active') return '';
        
        if (tanda.paymentsPending > 0) {
            const paymentDate = new Date(tanda.nextPaymentDate);
            const today = new Date();
            const daysUntilPayment = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilPayment <= 3) return 'urgent';
            if (daysUntilPayment <= 7) return 'warning';
        }
        
        return '';
    }

    getTandaStatusLabel(status) {
        const labels = {
            active: 'Activa',
            completed: 'Completada', 
            upcoming: 'Próxima',
            paused: 'Pausada'
        };
        return labels[status] || status;
    }

    // Funciones de filtrado y navegación
    filterTandasByStatus(status) {
        // Actualizar botones activos
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${status}"]`).classList.add('active');
        
        // Aplicar filtro visual
        const tandaCards = document.querySelectorAll('.tanda-card');
        tandaCards.forEach(card => {
            if (status === 'all') {
                card.style.display = 'block';
            } else if (status === 'pending-payments') {
                const hasPendingPayments = card.querySelector('.detail-item.urgent');
                card.style.display = hasPendingPayments ? 'block' : 'none';
            } else {
                card.style.display = card.classList.contains(status) ? 'block' : 'none';
            }
        });
        
        this.showNotification(`📊 Mostrando tandas: ${status === 'all' ? 'todas' : this.getTandaStatusLabel(status)}`, 'info', 2000);
    }

    filterTandasByGroup(groupId) {
        if (groupId) {
            this.loadTandasContent(groupId);
        } else {
            this.loadTandasContent();
        }
    }

    // Funciones adicionales para tandas
    showCreateTandaModal(groupId = null) {
        const selectedGroup = groupId ? this.groups.find(g => g.id === groupId) : null;
        
        const modal = this.createModal('create-tanda-advanced', '🔄 Nueva Tanda', `
            <div class="create-tanda-form">
                <div class="form-group">
                    <label>Nombre de la Tanda <span class="required">*</span></label>
                    <input type="text" class="form-control" id="new-tanda-name" placeholder="Ej: Tanda Marzo 2025">
                </div>
                
                <div class="form-group">
                    <label>Grupo <span class="required">*</span></label>
                    <select class="form-control" id="new-tanda-group">
                        ${selectedGroup ? `
                        <option value="${selectedGroup.id}" selected>${selectedGroup.avatar} ${selectedGroup.name}</option>
                        ` : `
                        <option value="">Seleccionar grupo...</option>
                        ${this.groups.map(group => `
                            <option value="${group.id}">${group.avatar} ${group.name}</option>
                        `).join('')}
                        `}
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha de Inicio</label>
                        <input type="date" class="form-control" id="new-tanda-start" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Número de Rondas <span class="required">*</span></label>
                        <input type="number" class="form-control" id="new-tanda-rounds" value="4" min="2" max="12">
                    </div>
                </div>

                <div class="form-group">
                    <label>Monto por Ronda (L.) <span class="required">*</span></label>
                    <input type="number" class="form-control" id="new-tanda-amount" placeholder="6000" min="100">
                    <div class="help-text">Este será el monto que cada participante recibirá en su turno</div>
                </div>

                <div class="form-group">
                    <label>Frecuencia de Pago</label>
                    <select class="form-control" id="new-tanda-frequency">
                        <option value="weekly">Semanal</option>
                        <option value="biweekly">Quincenal</option>
                        <option value="monthly" selected>Mensual</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Descripción (opcional)</label>
                    <textarea class="form-control" id="new-tanda-description" rows="3" placeholder="Describe los objetivos de esta tanda..."></textarea>
                </div>

                <div class="form-group">
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="checkbox" id="tanda-auto-assign" checked>
                            <span class="checkbox-custom"></span>
                            <span>Asignación automática de turnos</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" id="tanda-notifications" checked>
                            <span class="checkbox-custom"></span>
                            <span>Enviar recordatorios automáticos</span>
                        </label>
                    </div>
                </div>
            </div>
        `);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-success" onclick="advancedGroupsSystem.confirmCreateAdvancedTanda()">
                <i class="fas fa-plus"></i> Crear Tanda
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                Cancelar
            </button>
        `;
    }

    confirmCreateAdvancedTanda() {
        const name = document.getElementById('new-tanda-name')?.value;
        const groupId = document.getElementById('new-tanda-group')?.value;
        const rounds = document.getElementById('new-tanda-rounds')?.value;
        const amount = document.getElementById('new-tanda-amount')?.value;

        if (!name || !groupId || !rounds || !amount) {
            this.showNotification('⚠️ Por favor completa todos los campos obligatorios', 'warning');
            return;
        }

        const group = this.groups.find(g => g.id === groupId);
        if (!group) {
            this.showNotification('❌ Grupo no válido', 'error');
            return;
        }

        this.showNotification(`✅ Tanda "${name}" creada exitosamente en ${group.name}`, 'success');
        this.closeModal();
        
        // Refrescar vista de tandas
        setTimeout(() => {
            this.loadTandasContent();
        }, 500);
    }

    startTanda(tandaId) {
        this.showNotification('🚀 Tanda iniciada exitosamente', 'success');
        setTimeout(() => {
            this.loadTandasContent();
        }, 1000);
    }

    toggleTandaActions(tandaId) {
        const menu = document.getElementById(`tanda-actions-${tandaId}`);
        if (menu) {
            menu.classList.toggle('show');
            
            // Cerrar otros menús abiertos
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });
        }
    }

    generateTandaReport(tandaId) {
        this.showNotification('📊 Generando reporte de tanda...', 'info');
        setTimeout(() => {
            this.showNotification('✅ Reporte de tanda descargado', 'success');
        }, 2000);
    }

    exportTandaData(tandaId) {
        this.showNotification('📤 Exportando datos de tanda...', 'info');
        setTimeout(() => {
            this.showNotification('✅ Datos de tanda exportados', 'success');
        }, 1500);
    }

    editTandaSettings(tandaId) {
        this.showNotification('⚙️ Editor de configuración de tanda disponible próximamente', 'info');
    }

    // ========================================
    // 🔧 UTILITY HELPER FUNCTIONS
    // ========================================

    getLoadingHTML(message = 'Cargando...') {
        return `
            <div class="loading-state">
                <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                </div>
                <div class="loading-message">
                    <h3><i class="fas fa-spinner fa-spin"></i> ${message}</h3>
                    <p>Por favor espera un momento...</p>
                </div>
            </div>
        `;
    }

    getErrorHTML(message = 'Ha ocurrido un error') {
        return `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="error-message">
                    <h3>❌ ${message}</h3>
                    <p>Intenta recargar la página o contacta al soporte si el problema persiste.</p>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-refresh"></i> Recargar Página
                    </button>
                </div>
            </div>
        `;
    }

    // ========================================
    // 🔍 MATCHING SYSTEM FUNCTIONALITY
    // ========================================

    renderMatchingInterface() {
        const matchingSuggestions = this.getMatchingSuggestions();
        const userPreferences = this.getUserMatchingPreferences();

        return `
            <div class="matching-interface">
                <!-- Matching Header -->
                <div class="matching-header">
                    <div class="compatibility-score">
                        <div class="score-circle">
                            <span class="score-number">${userPreferences.compatibilityScore}</span>
                        </div>
                        <div class="score-info">
                            <div class="score-label">Tu Score de Compatibilidad</div>
                            <div class="score-metrics">
                                <div class="metric">
                                    <span class="metric-label">Experiencia</span>
                                    <span class="metric-value">${userPreferences.experience}%</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Confianza</span>
                                    <span class="metric-value">${userPreferences.trustScore}%</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Actividad</span>
                                    <span class="metric-value">${userPreferences.activity}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="matching-actions">
                        <button class="btn btn-primary" onclick="advancedGroupsSystem.refreshMatches()">
                            <i class="fas fa-sync-alt"></i>
                            <span>Actualizar Matches</span>
                        </button>
                        <button class="btn btn-secondary" onclick="advancedGroupsSystem.editMatchingPreferences()">
                            <i class="fas fa-cog"></i>
                            <span>Configurar</span>
                        </button>
                    </div>
                </div>

                <!-- Matching Filters -->
                <div class="matching-filters">
                    <div class="filter-group">
                        <label>Tipo de Match</label>
                        <select class="form-select" id="matchType" onchange="advancedGroupsSystem.updateMatchingFilters()">
                            <option value="all">Todos los tipos</option>
                            <option value="groups">Grupos únicamente</option>
                            <option value="tandas">Tandas únicamente</option>
                            <option value="people">Personas únicamente</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Ubicación</label>
                        <select class="form-select" id="locationFilter" onchange="advancedGroupsSystem.updateMatchingFilters()">
                            <option value="bay-islands" selected>Bay Islands</option>
                            <option value="all">Toda Honduras</option>
                            <option value="tegucigalpa">Tegucigalpa</option>
                            <option value="sps">San Pedro Sula</option>
                            <option value="ceiba">La Ceiba</option>
                            <option value="choloma">Choloma</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Rango de Contribución</label>
                        <select class="form-select" id="amountFilter" onchange="advancedGroupsSystem.updateMatchingFilters()">
                            <option value="all">Cualquier monto</option>
                            <option value="low">L. 500 - 2,000</option>
                            <option value="medium">L. 2,000 - 10,000</option>
                            <option value="high">L. 10,000+</option>
                        </select>
                    </div>
                    <div class="results-count">
                        <span class="count-number">${matchingSuggestions.length}</span>
                        <span class="count-label">matches encontrados</span>
                    </div>
                </div>

                <!-- Matching Results -->
                <div class="matching-results">
                    <div class="results-header">
                        <h3>Matches Recomendados</h3>
                        <p>Basados en tu perfil y preferencias</p>
                    </div>
                    <div class="matches-grid" id="matchesGrid">
                        ${matchingSuggestions.map(match => this.renderMatchCard(match)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderOptimizedMatchCard(match) {
        const compatibilityColor = match.compatibility >= 90 ? '#00ffff' : 
                                 match.compatibility >= 75 ? '#7fff7f' : 
                                 match.compatibility >= 60 ? '#ffff7f' : '#ff7f7f';

        return `
            <div class="match-card optimized" data-match-id="${match.id}" data-type="${match.type}">
                <div class="match-card-header">
                    <div class="match-avatar-opt">
                        ${match.type === 'group' ? match.icon : match.type === 'tanda' ? '🔄' : '👤'}
                    </div>
                    <div class="compatibility-badge-opt" style="background: linear-gradient(135deg, ${compatibilityColor}33, ${compatibilityColor}11); border: 1px solid ${compatibilityColor}66;">
                        <span class="compatibility-percent-opt">${match.compatibility}%</span>
                    </div>
                </div>

                <div class="match-content-opt">
                    <h4 class="match-title-opt">${match.name}</h4>
                    <p class="match-subtitle-opt">${match.subtitle}</p>
                    
                    <div class="match-quick-stats">
                        <span class="quick-stat">📍 ${match.location}</span>
                        <span class="quick-stat">👥 ${match.members}</span>
                        <span class="quick-stat">⭐ ${match.rating}</span>
                        ${match.amount ? `<span class="quick-stat">💰 L. ${match.amount.toLocaleString()}</span>` : ''}
                    </div>

                    <div class="match-tags-opt">
                        ${match.tags.slice(0, 2).map(tag => `<span class="match-tag-opt">${tag}</span>`).join('')}
                        ${match.tags.length > 2 ? `<span class="match-tag-opt more">+${match.tags.length - 2}</span>` : ''}
                    </div>

                    <div class="match-key-reason">
                        <i class="fas fa-lightbulb"></i>
                        <span>${match.reasons[0]}</span>
                    </div>
                </div>

                <div class="match-actions-opt">
                    <button class="btn btn-primary slim" onclick="advancedGroupsSystem.connectWithMatch('${match.id}', '${match.type}')">
                        <i class="fas fa-handshake"></i>
                        ${match.type === 'group' ? 'Unirse' : match.type === 'tanda' ? 'Participar' : 'Conectar'}
                    </button>
                    <button class="btn btn-secondary slim" onclick="advancedGroupsSystem.viewMatchDetails('${match.id}', '${match.type}')">
                        <i class="fas fa-eye"></i>
                        Detalles
                    </button>
                    <button class="btn btn-icon slim" onclick="advancedGroupsSystem.saveMatch('${match.id}')" title="Guardar">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderMatchCard(match) {
        const compatibilityColor = match.compatibility >= 90 ? '#00ffff' : 
                                 match.compatibility >= 75 ? '#7fff7f' : 
                                 match.compatibility >= 60 ? '#ffff7f' : '#ff7f7f';

        return `
            <div class="match-card" data-match-id="${match.id}" data-type="${match.type}">
                <div class="match-header">
                    <div class="match-avatar">
                        ${match.type === 'group' ? match.icon : match.type === 'tanda' ? '🔄' : '👤'}
                    </div>
                    <div class="match-info">
                        <h4 class="match-title">${match.name}</h4>
                        <p class="match-subtitle">${match.subtitle}</p>
                    </div>
                    <div class="match-compatibility">
                        <div class="compatibility-badge" style="background: linear-gradient(135deg, ${compatibilityColor}33, ${compatibilityColor}11); border: 1px solid ${compatibilityColor}66;">
                            <span class="compatibility-percent">${match.compatibility}%</span>
                            <span class="compatibility-label">Match</span>
                        </div>
                    </div>
                </div>

                <div class="match-details">
                    <div class="match-tags">
                        ${match.tags.map(tag => `<span class="match-tag">${tag}</span>`).join('')}
                    </div>
                    
                    <div class="match-stats">
                        <div class="stat">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${match.location}</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-users"></i>
                            <span>${match.members} miembros</span>
                        </div>
                        ${match.type === 'tanda' ? `
                        <div class="stat">
                            <i class="fas fa-dollar-sign"></i>
                            <span>L. ${match.amount?.toLocaleString()}</span>
                        </div>
                        ` : ''}
                        <div class="stat">
                            <i class="fas fa-star"></i>
                            <span>${match.rating}/5.0</span>
                        </div>
                    </div>

                    <div class="match-reasons">
                        <div class="reasons-header">
                            <i class="fas fa-lightbulb"></i>
                            <span>¿Por qué este match?</span>
                        </div>
                        <div class="reasons-list">
                            ${match.reasons.map(reason => `<div class="reason">${reason}</div>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="match-actions">
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.connectWithMatch('${match.id}', '${match.type}')">
                        <i class="fas fa-handshake"></i>
                        ${match.type === 'group' ? 'Solicitar Unirse' : match.type === 'tanda' ? 'Participar' : 'Conectar'}
                    </button>
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.viewMatchDetails('${match.id}', '${match.type}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="btn btn-icon" onclick="advancedGroupsSystem.saveMatch('${match.id}')" title="Guardar para después">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getMatchingSuggestions() {
        return [
            {
                id: 'group-001',
                type: 'group',
                name: 'Emprendedores Zona Norte',
                subtitle: 'Grupo de empresarios y profesionales',
                icon: '💼',
                compatibility: 94,
                location: 'San Pedro Sula',
                members: 12,
                rating: 4.8,
                tags: ['Profesional', 'Emprendimiento', 'Zona Norte'],
                reasons: [
                    '✨ Perfil profesional similar al tuyo',
                    '📍 Ubicación cercana (15 km)',
                    '💰 Rango de ahorro compatible'
                ]
            },
            {
                id: 'tanda-001',
                type: 'tanda',
                name: 'Tanda Vacacional 2025',
                subtitle: 'Para vacaciones familiares',
                compatibility: 89,
                location: 'Tegucigalpa',
                members: 8,
                amount: 5000,
                rating: 4.9,
                tags: ['Familiar', 'Vacaciones', 'Corto Plazo'],
                reasons: [
                    '🎯 Objetivo similar: Ahorro para viajes',
                    '⏰ Duración de 6 meses (ideal para ti)',
                    '👥 Grupo pequeño y confiable'
                ]
            },
            {
                id: 'group-002',
                type: 'group',
                name: 'Mamás Emprendedoras TGU',
                subtitle: 'Red de apoyo para madres trabajadoras',
                icon: '👩‍💼',
                compatibility: 87,
                location: 'Tegucigalpa',
                members: 15,
                rating: 4.7,
                tags: ['Mujeres', 'Emprendimiento', 'Familia'],
                reasons: [
                    '👩‍👧‍👦 Perfil familiar compatible',
                    '💪 Enfoque en empoderamiento femenino',
                    '🤝 Red de apoyo mutuo'
                ]
            },
            {
                id: 'person-001',
                type: 'person',
                name: 'María Elena Rodríguez',
                subtitle: 'Contadora, experiencia en tandas',
                compatibility: 92,
                location: 'Tegucigalpa',
                members: 1,
                rating: 5.0,
                tags: ['Experta', 'Confiable', 'Local'],
                reasons: [
                    '🎓 Experiencia profesional en finanzas',
                    '⭐ Historial perfecto en tandas anteriores',
                    '📍 Vive en tu misma zona'
                ]
            },
            {
                id: 'tanda-002',
                type: 'tanda',
                name: 'Tanda Casa Propia 2025',
                subtitle: 'Ahorro para enganche de vivienda',
                compatibility: 91,
                location: 'Tegucigalpa',
                members: 6,
                amount: 15000,
                rating: 4.8,
                tags: ['Vivienda', 'Largo Plazo', 'Alto Monto'],
                reasons: [
                    '🏠 Meta de vivienda propia compatible',
                    '💎 Monto alto para objetivos serios',
                    '📈 Plan de 2 años bien estructurado'
                ]
            },
            {
                id: 'group-003',
                type: 'group',
                name: 'Jóvenes Profesionales',
                subtitle: 'Recién graduados y profesionales jóvenes',
                icon: '🎓',
                compatibility: 83,
                location: 'San Pedro Sula',
                members: 20,
                rating: 4.6,
                tags: ['Jóvenes', 'Profesionales', 'Networking'],
                reasons: [
                    '👨‍🎓 Rango de edad similar (25-35 años)',
                    '🚀 Enfoque en crecimiento profesional',
                    '💼 Oportunidades de networking'
                ]
            },
            {
                id: 'tanda-003',
                type: 'tanda',
                name: 'Tanda Emergencia',
                subtitle: 'Fondo de contingencia familiar',
                compatibility: 78,
                location: 'La Ceiba',
                members: 10,
                amount: 2500,
                rating: 4.5,
                tags: ['Emergencia', 'Corto Plazo', 'Seguridad'],
                reasons: [
                    '🛡️ Seguridad financiera familiar',
                    '⚡ Acceso rápido a fondos de emergencia',
                    '👥 Grupo de apoyo mutuo'
                ]
            },
            {
                id: 'group-004',
                type: 'group',
                name: 'Bay Islands Tourism Network',
                subtitle: 'Red de turismo y hospitalidad',
                icon: '🏝️',
                compatibility: 89,
                location: 'Bay Islands',
                members: 14,
                rating: 4.8,
                tags: ['Turismo', 'Hospitalidad', 'Islas'],
                reasons: [
                    '🏝️ Enfoque en industria turística local',
                    '🌊 Oportunidades en sector marítimo',
                    '🤝 Conexión con comunidad isleña'
                ]
            },
            {
                id: 'tanda-004',
                type: 'tanda',
                name: 'Tanda Boat Fund Roatán',
                subtitle: 'Para equipos de pesca y turismo',
                compatibility: 87,
                location: 'Bay Islands',
                members: 8,
                amount: 12000,
                rating: 4.9,
                tags: ['Marítimo', 'Equipos', 'Turismo'],
                reasons: [
                    '⛵ Enfoque en actividades marítimas',
                    '🎣 Inversión en equipos de trabajo',
                    '🏝️ Comunidad de Bay Islands'
                ]
            }
        ];
    }

    getUserMatchingPreferences() {
        return {
            compatibilityScore: 94,
            experience: 85,
            trustScore: 96,
            activity: 78,
            preferredAmount: 'medium',
            preferredDuration: 'short',
            location: 'tegucigalpa',
            interests: ['familia', 'profesional', 'vivienda']
        };
    }

    initializeMatchingFeatures() {
        console.log('🔧 Inicializando funcionalidades de matching...');
        
        // Add hover effects to match cards
        this.addMatchCardEffects();
        
        // Initialize filter functionality
        this.setupMatchingFilters();
        
        // Add keyboard shortcuts for matching
        this.setupMatchingKeyboardShortcuts();

        console.log('✅ Matching features initialized');
    }

    addMatchCardEffects() {
        const matchCards = document.querySelectorAll('.match-card');
        
        matchCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 10px 30px rgba(0, 255, 255, 0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
            });
        });
    }

    setupMatchingFilters() {
        const filters = ['matchType', 'locationFilter', 'amountFilter'];
        
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.updateMatchingFilters();
                });
            }
        });
    }

    setupMatchingKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (this.currentTab === 'matching') {
                switch(e.key) {
                    case 'r':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            this.refreshMatches();
                        }
                        break;
                    case 'f':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            document.getElementById('matchType')?.focus();
                        }
                        break;
                }
            }
        });
    }

    updateMatchingFilters() {
        console.log('🔍 Actualizando filtros de matching...');
        
        const matchType = document.getElementById('matchType')?.value;
        const locationFilter = document.getElementById('locationFilter')?.value;
        const amountFilter = document.getElementById('amountFilter')?.value;
        
        console.log('Filtros aplicados:', { matchType, locationFilter, amountFilter });
        
        // Filtrar y re-renderizar matches
        const filteredMatches = this.applyMatchingFilters(matchType, locationFilter, amountFilter);
        this.updateMatchesGrid(filteredMatches);
        
        this.showNotification(`🔍 Filtros aplicados: ${filteredMatches.length} matches encontrados`, 'info');
    }

    applyMatchingFilters(type, location, amount) {
        let matches = this.getMatchingSuggestions();
        
        // Filter by type
        if (type && type !== 'all') {
            matches = matches.filter(match => {
                if (type === 'groups') return match.type === 'group';
                if (type === 'tandas') return match.type === 'tanda';
                if (type === 'people') return match.type === 'person';
                return true;
            });
        }
        
        // Filter by location
        if (location && location !== 'all') {
            const locationMap = {
                'tegucigalpa': 'Tegucigalpa',
                'sps': 'San Pedro Sula',
                'ceiba': 'La Ceiba',
                'choloma': 'Choloma'
            };
            matches = matches.filter(match => 
                match.location === locationMap[location]
            );
        }
        
        // Filter by amount (for tandas)
        if (amount && amount !== 'all') {
            matches = matches.filter(match => {
                if (match.type !== 'tanda') return true;
                
                const matchAmount = match.amount || 0;
                switch(amount) {
                    case 'low': return matchAmount <= 2000;
                    case 'medium': return matchAmount > 2000 && matchAmount <= 10000;
                    case 'high': return matchAmount > 10000;
                    default: return true;
                }
            });
        }
        
        return matches;
    }

    updateMatchesGrid(matches) {
        const matchesGrid = document.getElementById('matchesGrid');
        if (matchesGrid) {
            matchesGrid.innerHTML = matches.map(match => this.renderMatchCard(match)).join('');
            this.addMatchCardEffects();
        }
    }

    refreshMatches() {
        console.log('🔄 Actualizando matches...');
        this.showNotification('🔄 Buscando nuevos matches...', 'info');
        
        setTimeout(() => {
            this.updateMatchingFilters();
            this.showNotification('✨ Matches actualizados exitosamente', 'success');
        }, 1500);
    }

    sortMatches() {
        const sortBy = document.getElementById('sortMatches')?.value;
        console.log('📊 Ordenando matches por:', sortBy);
        
        let matches = this.applyMatchingFilters(
            document.getElementById('matchType')?.value,
            document.getElementById('locationFilter')?.value,
            document.getElementById('amountFilter')?.value
        );
        
        matches.sort((a, b) => {
            switch(sortBy) {
                case 'compatibility':
                    return b.compatibility - a.compatibility;
                case 'activity':
                    return b.rating - a.rating;
                case 'location':
                    return a.location.localeCompare(b.location);
                case 'amount':
                    return (b.amount || 0) - (a.amount || 0);
                default:
                    return 0;
            }
        });
        
        this.updateMatchesGrid(matches);
        this.showNotification(`📊 Matches ordenados por ${sortBy}`, 'info');
    }

    connectWithMatch(matchId, matchType) {
        console.log('🤝 FUNCIÓN EJECUTADA - Conectando con match:', matchId, matchType);
        console.log('🤝 this.showModal existe?', typeof this.showModal === 'function');
        
        const matches = this.getMatchingSuggestions();
        const match = matches.find(m => m.id === matchId);
        
        if (!match) {
            this.showNotification('❌ Match no encontrado', 'error');
            return;
        }

        const actionText = matchType === 'group' ? 'solicitud de unión' : 
                          matchType === 'tanda' ? 'solicitud de participación' : 
                          'solicitud de conexión';
        
        const requirements = this.getMatchRequirements(match);
        const userProfile = this.getUserMatchingProfile();
        
        this.showModal({
            title: `🤝 ${matchType === 'group' ? 'Solicitar Unirse al Grupo' : matchType === 'tanda' ? 'Participar en Tanda' : 'Conectar'}`,
            content: `
                <div class="connect-match-modal">
                    <div class="match-connect-header">
                        <div class="match-preview">
                            <div class="match-avatar-preview">
                                ${match.type === 'group' ? match.icon : match.type === 'tanda' ? '🔄' : '👤'}
                            </div>
                            <div class="match-preview-info">
                                <h3>${match.name}</h3>
                                <p>${match.subtitle}</p>
                                <div class="match-location-compatibility">
                                    <span class="location">📍 ${match.location}</span>
                                    <span class="compatibility">${match.compatibility}% compatible</span>
                                </div>
                                <div class="compatibility-mini">
                                    ${match.compatibility}% Compatibilidad
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="connect-requirements">
                        <h4><i class="fas fa-clipboard-list"></i> Requisitos y Condiciones</h4>
                        <div class="requirements-grid">
                            ${requirements.map(req => `
                                <div class="requirement-item ${req.met ? 'met' : 'unmet'}">
                                    <i class="fas fa-${req.met ? 'check-circle' : 'exclamation-circle'}"></i>
                                    <span>${req.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="user-profile-preview">
                        <h4><i class="fas fa-user"></i> Tu Perfil que Compartiremos</h4>
                        <div class="profile-summary">
                            <div class="profile-stats">
                                <div class="profile-stat">
                                    <span class="stat-label">Experiencia:</span>
                                    <span class="stat-value">${userProfile.experience}%</span>
                                </div>
                                <div class="profile-stat">
                                    <span class="stat-label">Confiabilidad:</span>
                                    <span class="stat-value">${userProfile.trustScore}%</span>
                                </div>
                                <div class="profile-stat">
                                    <span class="stat-label">Tandas Completadas:</span>
                                    <span class="stat-value">${userProfile.completedTandas}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="match-connect-form">
                        <div class="form-group">
                            <label for="connectMessage">💬 Mensaje de Presentación:</label>
                            <textarea id="connectMessage" class="form-textarea" rows="4" 
                                placeholder="¡Hola! Me interesa mucho ${matchType === 'group' ? 'formar parte de este grupo' : 'participar en esta tanda'}. ${this.getPersonalizedMessage(match)}"></textarea>
                        </div>
                        
                        <div class="commitment-section">
                            <label class="checkbox-commitment">
                                <input type="checkbox" id="agreeTerms" required>
                                <span>✅ Acepto cumplir con las condiciones y compromisos de este ${matchType}</span>
                            </label>
                        </div>
                        
                        <div class="connection-steps">
                            <h4><i class="fas fa-route"></i> Pasos del Proceso:</h4>
                            <div class="steps-list">
                                <div class="step-item">
                                    <span class="step-number">1</span>
                                    <div class="step-content">
                                        <strong>Envío de Solicitud</strong>
                                        <p>Tu mensaje será enviado al coordinador del ${matchType}</p>
                                    </div>
                                </div>
                                <div class="step-item">
                                    <span class="step-number">2</span>
                                    <div class="step-content">
                                        <strong>Revisión (24-48h)</strong>
                                        <p>El coordinador evaluará tu perfil y mensaje</p>
                                    </div>
                                </div>
                                <div class="step-item">
                                    <span class="step-number">3</span>
                                    <div class="step-content">
                                        <strong>Respuesta y Contacto</strong>
                                        <p>Recibirás una respuesta por WhatsApp/SMS</p>
                                    </div>
                                </div>
                                <div class="step-item">
                                    <span class="step-number">4</span>
                                    <div class="step-content">
                                        <strong>Reunión/Integración</strong>
                                        <p>Participarás en reunión de bienvenida si eres aceptado</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="connect-info">
                            <div class="info-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>Tu información está protegida y solo se comparte con matches aprobados</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-bell"></i>
                                <span>Te notificaremos por WhatsApp y email sobre la respuesta</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-handshake"></i>
                                <span>Proceso 100% transparente y seguro</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'Cancelar',
                    class: 'btn-secondary',
                    onclick: 'advancedGroupsSystem.hideModal()'
                },
                {
                    text: `📨 Enviar ${actionText}`,
                    class: 'btn-primary',
                    onclick: `advancedGroupsSystem.sendMatchRequest('${matchId}', '${matchType}')`
                },
                {
                    text: '👁️ Ver Detalles',
                    class: 'btn-accent',
                    onclick: `advancedGroupsSystem.hideModal(); setTimeout(() => advancedGroupsSystem.viewMatchDetails('${matchId}', '${matchType}'), 300);`
                }
            ]
        });
    }

    sendMatchRequest(matchId, matchType) {
        console.log('📨 ENVIANDO solicitud de match:', matchId, matchType);
        
        // Validar que se cumplan los requisitos
        const agreeTerms = document.getElementById('agreeTerms');
        const connectMessage = document.getElementById('connectMessage');
        
        if (!agreeTerms || !agreeTerms.checked) {
            this.showNotification('⚠️ Debes aceptar las condiciones para continuar', 'warning');
            return;
        }
        
        if (!connectMessage || connectMessage.value.trim().length < 20) {
            this.showNotification('⚠️ Escribe un mensaje de presentación de al menos 20 caracteres', 'warning');
            return;
        }
        
        // Simular envío de solicitud
        this.hideModal();
        
        // Mostrar progreso de envío
        this.showModal({
            title: '📨 Enviando Solicitud...',
            content: `
                <div class="sending-progress">
                    <div class="progress-steps">
                        <div class="progress-step active">
                            <div class="step-icon">✅</div>
                            <div class="step-text">Validando información</div>
                        </div>
                        <div class="progress-step active">
                            <div class="step-icon">✅</div>
                            <div class="step-text">Preparando mensaje</div>
                        </div>
                        <div class="progress-step active">
                            <div class="step-icon">📨</div>
                            <div class="step-text">Enviando al coordinador</div>
                        </div>
                        <div class="progress-step">
                            <div class="step-icon">🔔</div>
                            <div class="step-text">Configurando notificaciones</div>
                        </div>
                    </div>
                    
                    <div class="sending-message">
                        <p>Tu solicitud está siendo enviada al coordinador del ${matchType}...</p>
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            `
        });
        
        // Simular tiempo de envío
        setTimeout(() => {
            this.hideModal();
            this.showSuccessModal(matchId, matchType);
            this.updateMatchCardStatus(matchId, 'pending');
        }, 2000);
    }
    
    showSuccessModal(matchId, matchType) {
        const match = this.getMatchingSuggestions().find(m => m.id === matchId);
        
        this.showModal({
            title: '🎉 ¡Solicitud Enviada Exitosamente!',
            content: `
                <div class="success-modal">
                    <div class="success-icon">✅</div>
                    <h3>Tu solicitud ha sido enviada</h3>
                    <p>El coordinador de <strong>"${match.name}"</strong> ha recibido tu mensaje.</p>
                    
                    <div class="next-steps">
                        <h4>🔔 Próximos Pasos:</h4>
                        <div class="step-list">
                            <div class="step">
                                <span class="step-icon">📱</span>
                                <span>Te notificaremos por WhatsApp cuando haya una respuesta</span>
                            </div>
                            <div class="step">
                                <span class="step-icon">⏰</span>
                                <span>Respuesta esperada en 24-48 horas</span>
                            </div>
                            <div class="step">
                                <span class="step-icon">💬</span>
                                <span>El coordinador puede contactarte directamente</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="contact-info">
                        <p><strong>📞 ¿Necesitas ayuda?</strong></p>
                        <p>Contáctanos al WhatsApp: +504 9999-9999</p>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: '🔍 Ver Otros Matches',
                    class: 'btn-secondary',
                    onclick: 'advancedGroupsSystem.hideModal()'
                },
                {
                    text: '👁️ Ver Detalles del Grupo',
                    class: 'btn-primary',
                    onclick: `advancedGroupsSystem.hideModal(); setTimeout(() => advancedGroupsSystem.viewMatchDetails('${matchId}', '${matchType}'), 300);`
                }
            ]
        });
    }
    
    updateMatchCardStatus(matchId, status) {
        const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
        if (matchCard) {
            const button = matchCard.querySelector('.btn-primary');
            if (button) {
                switch(status) {
                    case 'pending':
                        button.innerHTML = '<i class="fas fa-clock"></i> Solicitud Enviada';
                        button.classList.add('btn-warning');
                        button.classList.remove('btn-primary');
                        button.disabled = true;
                        break;
                    case 'accepted':
                        button.innerHTML = '<i class="fas fa-check"></i> Aceptado';
                        button.classList.add('btn-success');
                        button.classList.remove('btn-primary');
                        break;
                }
            }
        }
    }

    viewMatchDetails(matchId, matchType) {
        console.log('👁️ FUNCIÓN EJECUTADA - Viendo detalles del match:', matchId, matchType);
        console.log('👁️ this.showModal existe?', typeof this.showModal === 'function');
        
        const matches = this.getMatchingSuggestions();
        const match = matches.find(m => m.id === matchId);
        
        if (!match) {
            this.showNotification('❌ Match no encontrado', 'error');
            return;
        }

        const detailedInfo = this.getDetailedMatchInfo(match);
        const similarMatches = this.getSimilarMatches(matchId);
        
        this.showModal({
            title: `📋 ${match.name} - Información Completa`,
            size: 'large',
            content: `
                <div class="match-details-modal">
                    <div class="match-detail-header">
                        <div class="match-avatar-large">
                            ${match.type === 'group' ? match.icon : match.type === 'tanda' ? '🔄' : '👤'}
                        </div>
                        <div class="match-detail-info">
                            <h3>${match.name}</h3>
                            <p class="match-subtitle-large">${match.subtitle}</p>
                            <div class="match-detail-stats">
                                <div class="detail-stat">
                                    <span class="stat-icon">📍</span>
                                    <span class="stat-value">${match.location}</span>
                                </div>
                                <div class="detail-stat">
                                    <span class="stat-icon">⭐</span>
                                    <span class="stat-value">${match.rating}/5.0</span>
                                </div>
                                <div class="detail-stat">
                                    <span class="stat-icon">👥</span>
                                    <span class="stat-value">${match.members} miembros</span>
                                </div>
                                ${match.amount ? `
                                <div class="detail-stat">
                                    <span class="stat-icon">💰</span>
                                    <span class="stat-value">L. ${match.amount.toLocaleString()}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="compatibility-large">
                            <div class="compatibility-circle-large">
                                <span class="compatibility-percent-large">${match.compatibility}%</span>
                            </div>
                            <span class="compatibility-label-large">Compatible</span>
                        </div>
                    </div>
                    
                    <div class="match-description-section">
                        <h4>📄 Descripción:</h4>
                        <p>${detailedInfo.fullDescription}</p>
                    </div>
                    
                    <div class="match-details-grid">
                        <div class="detail-column">
                            <h4>📋 Información del ${match.type === 'group' ? 'Grupo' : 'Tanda'}:</h4>
                            <div class="info-list">
                                ${match.type === 'group' ? `
                                <div class="info-item">
                                    <span class="info-label">Tipo de Grupo:</span>
                                    <span class="info-value">${detailedInfo.groupType}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Fundado:</span>
                                    <span class="info-value">${detailedInfo.founded}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Reuniones:</span>
                                    <span class="info-value">${detailedInfo.meetingSchedule}</span>
                                </div>
                                ` : `
                                <div class="info-item">
                                    <span class="info-label">Duración:</span>
                                    <span class="info-value">${detailedInfo.duration}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Frecuencia de Pago:</span>
                                    <span class="info-value">${detailedInfo.paymentFrequency}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Inicio:</span>
                                    <span class="info-value">${detailedInfo.startDate}</span>
                                </div>
                                `}
                                <div class="info-item">
                                    <span class="info-label">Coordinador:</span>
                                    <span class="info-value">${detailedInfo.coordinator}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Experiencia:</span>
                                    <span class="info-value">${detailedInfo.coordinatorExperience}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-column">
                            <h4>🎯 Requisitos para Unirse:</h4>
                            <div class="requirements-list">
                                ${this.getMatchRequirements(match).map(req => `
                                <div class="requirement-item ${req.met ? 'met' : 'unmet'}">
                                    <i class="fas fa-${req.met ? 'check-circle' : 'exclamation-circle'}"></i>
                                    <span>${req.text}</span>
                                    ${!req.met ? '<span class="req-action">⚠️ Requerido</span>' : '<span class="req-ok">✅ Cumples</span>'}
                                </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="benefits-section">
                        <h4>💎 Beneficios de Unirse:</h4>
                        <div class="benefits-grid">
                            ${detailedInfo.benefits.map(benefit => `
                            <div class="benefit-item">
                                <span class="benefit-icon">${benefit.icon}</span>
                                <div class="benefit-text">
                                    <strong>${benefit.title}</strong>
                                    <p>${benefit.description}</p>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="contact-section">
                        <h4>📞 Información de Contacto:</h4>
                        <div class="contact-methods">
                            <div class="contact-method">
                                <span class="contact-icon">📱</span>
                                <span>WhatsApp: ${detailedInfo.whatsapp}</span>
                            </div>
                            <div class="contact-method">
                                <span class="contact-icon">📧</span>
                                <span>Email: ${detailedInfo.email}</span>
                            </div>
                            <div class="contact-method">
                                <span class="contact-icon">📍</span>
                                <span>Dirección: ${detailedInfo.address}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${similarMatches.length > 0 ? `
                    <div class="similar-matches-section">
                        <h4>🔍 Matches Similares:</h4>
                        <div class="similar-matches-grid">
                            ${similarMatches.map(similar => `
                            <div class="similar-match-card" onclick="advancedGroupsSystem.viewMatchDetails('${similar.id}', '${similar.type}')">
                                <div class="similar-avatar">${similar.type === 'group' ? similar.icon : similar.type === 'tanda' ? '🔄' : '👤'}</div>
                                <div class="similar-info">
                                    <strong>${similar.name}</strong>
                                    <p>${similar.compatibility}% compatible</p>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            `,
            buttons: [
                {
                    text: 'Cerrar',
                    class: 'btn-secondary',
                    onclick: 'advancedGroupsSystem.hideModal()'
                },
                {
                    text: '💾 Guardar Match',
                    class: 'btn-info',
                    onclick: `advancedGroupsSystem.saveMatch('${matchId}')`
                },
                {
                    text: `🤝 Solicitar Unirse`,
                    class: 'btn-primary',
                    onclick: `advancedGroupsSystem.hideModal(); setTimeout(() => advancedGroupsSystem.connectWithMatch('${matchId}', '${matchType}'), 300);`
                }
            ]
        });
    }

    getUserMatchingProfile() {
        return {
            experience: 85,
            trustScore: 96,
            completedTandas: 7,
            totalSavings: 35000,
            location: 'Tegucigalpa',
            memberSince: '2023-01-15',
            averageRating: 4.8
        };
    }

    getMatchRequirements(match) {
        const userProfile = this.getUserMatchingProfile();
        const requirements = [];

        // Basic requirements based on match type
        if (match.type === 'group' || match.type === 'tanda') {
            // Age requirement
            requirements.push({
                text: 'Ser mayor de 18 años',
                met: true, // Assume user meets this
                type: 'age'
            });

            // Identity verification
            requirements.push({
                text: 'Verificación de identidad completada',
                met: userProfile.trustScore >= 70,
                type: 'identity'
            });

            // Minimum savings requirement
            const minSavings = match.monthlyContribution * 3; // 3 months of contributions
            requirements.push({
                text: `Capacidad de ahorro mínima: L. ${minSavings.toLocaleString()}`,
                met: userProfile.totalSavings >= minSavings,
                type: 'savings'
            });

            // Trust score requirement
            const minTrustScore = match.trustRequirement || 75;
            requirements.push({
                text: `Puntaje de confianza mínimo: ${minTrustScore}%`,
                met: userProfile.trustScore >= minTrustScore,
                type: 'trust'
            });

            // Location requirement for groups
            if (match.type === 'group' && match.locationRequired) {
                const sameLocation = userProfile.location === match.location;
                requirements.push({
                    text: `Ubicación en ${match.location}`,
                    met: sameLocation,
                    type: 'location'
                });
            }

            // Experience requirement for advanced groups/tandas
            if (match.experienceRequired) {
                requirements.push({
                    text: `Experiencia mínima: ${match.experienceRequired} tandas completadas`,
                    met: userProfile.completedTandas >= match.experienceRequired,
                    type: 'experience'
                });
            }

            // Income verification for high-value groups
            if (match.monthlyContribution >= 2000) {
                requirements.push({
                    text: 'Comprobante de ingresos requerido',
                    met: userProfile.experience >= 80, // Using experience as proxy
                    type: 'income'
                });
            }

            // References requirement
            if (match.referencesRequired) {
                requirements.push({
                    text: `${match.referencesRequired} referencias personales`,
                    met: userProfile.averageRating >= 4.5,
                    type: 'references'
                });
            }

        } else if (match.type === 'person') {
            // Professional networking requirements
            requirements.push({
                text: 'Perfil profesional completado',
                met: true,
                type: 'profile'
            });

            requirements.push({
                text: 'Historial de tandas positivo',
                met: userProfile.averageRating >= 4.0,
                type: 'history'
            });
        }

        // Add specific requirements based on match tags
        if (match.tags?.includes('Premium')) {
            requirements.push({
                text: 'Membresía Premium activa',
                met: userProfile.experience >= 90,
                type: 'membership'
            });
        }

        if (match.tags?.includes('Empresarial')) {
            requirements.push({
                text: 'Verificación empresarial completada',
                met: userProfile.trustScore >= 85,
                type: 'business'
            });
        }

        return requirements;
    }

    getPersonalizedMessage(match) {
        if (match.type === 'tanda') {
            return `Tengo experiencia en ${this.getUserMatchingProfile().completedTandas} tandas completadas y mi objetivo actual es ${match.tags.includes('Vivienda') ? 'ahorrar para vivienda' : match.tags.includes('Vacaciones') ? 'ahorrar para vacaciones' : 'fortalecer mis ahorros'}.`;
        } else if (match.type === 'group') {
            return `Busco un grupo comprometido donde pueda aportar mi experiencia en ahorro cooperativo y aprender de otros miembros.`;
        } else {
            return `Me parece muy interesante tu experiencia profesional y creo que podríamos colaborar muy bien en proyectos de tandas.`;
        }
    }

    sendEnhancedMatchRequest(matchId, matchType) {
        const agreeTerms = document.getElementById('agreeTerms')?.checked;
        const message = document.getElementById('connectMessage')?.value || '';

        if (!agreeTerms) {
            this.showNotification('⚠️ Debes aceptar los términos y condiciones', 'warning');
            return;
        }

        console.log('📨 Enviando solicitud mejorada de match:', matchId);
        
        // Mostrar proceso de envío
        const modal = document.querySelector('.modal-content');
        if (modal) {
            modal.innerHTML = `
                <div class="sending-request-modal">
                    <div class="sending-animation">
                        <div class="sending-spinner">
                            <div class="spinner-ring"></div>
                        </div>
                        <h3>📨 Enviando Solicitud...</h3>
                        <div class="sending-steps">
                            <div class="step active">✅ Validando información</div>
                            <div class="step active">✅ Preparando perfil</div>
                            <div class="step active">✅ Enviando solicitud</div>
                            <div class="step">⏳ Notificando al destinatario</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Simular proceso de envío
        setTimeout(() => {
            const steps = document.querySelectorAll('.step');
            if (steps[3]) {
                steps[3].classList.add('active');
                steps[3].innerHTML = '✅ Solicitud enviada exitosamente';
            }

            setTimeout(() => {
                this.closeModal();
                this.showNotification('🎉 ¡Solicitud enviada exitosamente! Te notificaremos cuando recibas respuesta.', 'success');
                
                // Update match card to show pending status
                this.updateMatchCardStatus(matchId, 'pending');
                
                // Show follow-up actions
                setTimeout(() => {
                    this.showFollowUpActions(matchId, matchType);
                }, 2000);
                
            }, 1500);
        }, 2000);
    }

    updateMatchCardStatus(matchId, status) {
        const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
        if (matchCard) {
            const button = matchCard.querySelector('.btn-primary');
            if (button) {
                switch(status) {
                    case 'pending':
                        button.innerHTML = '<i class="fas fa-clock"></i> Solicitud Enviada';
                        button.classList.add('disabled', 'btn-pending');
                        button.disabled = true;
                        break;
                    case 'accepted':
                        button.innerHTML = '<i class="fas fa-check-circle"></i> ¡Aceptado!';
                        button.classList.add('btn-success');
                        break;
                    case 'declined':
                        button.innerHTML = '<i class="fas fa-times-circle"></i> No Aceptado';
                        button.classList.add('btn-declined');
                        break;
                }
            }

            // Add status indicator to card
            const statusIndicator = document.createElement('div');
            statusIndicator.className = `match-status-indicator ${status}`;
            statusIndicator.innerHTML = {
                'pending': '<i class="fas fa-clock"></i> Pendiente',
                'accepted': '<i class="fas fa-check-circle"></i> Aceptado',
                'declined': '<i class="fas fa-times-circle"></i> Rechazado'
            }[status] || '';
            
            const matchHeader = matchCard.querySelector('.match-header');
            if (matchHeader && !matchCard.querySelector('.match-status-indicator')) {
                matchHeader.appendChild(statusIndicator);
            }
        }
    }

    showFollowUpActions(matchId, matchType) {
        const matches = this.getMatchingSuggestions();
        const match = matches.find(m => m.id === matchId);
        
        this.showNotification(`
            <div class="follow-up-notification">
                <strong>📬 Próximos pasos:</strong><br>
                • Te notificaremos por email cuando ${match?.name} responda<br>
                • Puedes ver el estado en tu bandeja de solicitudes<br>
                • Mientras tanto, ¡sigue explorando más matches!
            </div>
        `, 'info', 8000);
    }

    getDetailedMatchInfo(match) {
        const baseInfo = {
            maxMembers: match.type === 'tanda' ? Math.min(match.members + 4, 20) : match.members + Math.floor(Math.random() * 10) + 5,
            reviewCount: Math.floor(Math.random() * 50) + 10,
            createdDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('es-HN')
        };

        if (match.type === 'tanda') {
            return {
                ...baseInfo,
                duration: match.tags.includes('Corto Plazo') ? '6 meses' : match.tags.includes('Largo Plazo') ? '2 años' : '12 meses',
                members: this.generateTandaMembers(match),
                recentActivity: this.generateTandaActivity()
            };
        } else {
            return {
                ...baseInfo,
                members: this.generateGroupMembers(match),
                recentActivity: this.generateGroupActivity()
            };
        }
    }

    generateTandaMembers(match) {
        const roles = ['Coordinador', 'Tesorero', 'Participante', 'Secretario'];
        const names = ['Ana García', 'Carlos Méndez', 'María López', 'José Rivera', 'Carmen Flores', 'Luis Ortega'];
        const avatars = ['👩‍💼', '👨‍💼', '👩‍🏫', '👨‍🔧', '👩‍⚕️', '👨‍🍳'];
        
        return Array.from({length: Math.min(match.members, 6)}, (_, i) => ({
            name: names[i % names.length],
            role: i === 0 ? 'Coordinador' : roles[Math.floor(Math.random() * (roles.length - 1)) + 1],
            avatar: avatars[i % avatars.length],
            rating: (4.2 + Math.random() * 0.8).toFixed(1)
        }));
    }

    generateGroupMembers(match) {
        const roles = ['Fundador', 'Administrador', 'Miembro Activo', 'Miembro Nuevo'];
        const names = ['Roberto Silva', 'Elena Castillo', 'Fernando Díaz', 'Sofía Morales', 'Diego Vargas', 'Lucia Herrera'];
        const avatars = ['👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍🏭', '👩‍🔬'];
        
        return Array.from({length: Math.min(match.members, 6)}, (_, i) => ({
            name: names[i % names.length],
            role: i === 0 ? 'Fundador' : roles[Math.floor(Math.random() * (roles.length - 1)) + 1],
            avatar: avatars[i % avatars.length],
            rating: (4.0 + Math.random() * 1.0).toFixed(1)
        }));
    }

    generateTandaActivity() {
        return [
            { icon: '💰', text: 'Pago mensual completado por todos los miembros', date: 'Hace 2 días' },
            { icon: '🎉', text: 'María López recibió su tanda del mes', date: 'Hace 5 días' },
            { icon: '👥', text: 'Reunión mensual completada', date: 'Hace 1 semana' },
            { icon: '📊', text: 'Informe financiero compartido', date: 'Hace 10 días' },
            { icon: '✅', text: 'Verificación de pagos completada', date: 'Hace 2 semanas' }
        ];
    }

    generateGroupActivity() {
        return [
            { icon: '🤝', text: 'Nuevo miembro aprobado y bienvenido', date: 'Hace 1 día' },
            { icon: '💡', text: 'Propuesta de nueva tanda presentada', date: 'Hace 3 días' },
            { icon: '📅', text: 'Próxima reunión programada', date: 'Hace 4 días' },
            { icon: '📈', text: 'Informe de rendimiento del grupo', date: 'Hace 1 semana' },
            { icon: '🎯', text: 'Meta de ahorro grupal alcanzada', date: 'Hace 2 semanas' }
        ];
    }

    getSimilarMatches(currentMatchId) {
        const allMatches = this.getMatchingSuggestions();
        const currentMatch = allMatches.find(m => m.id === currentMatchId);
        
        if (!currentMatch) return [];

        return allMatches
            .filter(match => match.id !== currentMatchId)
            .filter(match => 
                match.type === currentMatch.type || 
                match.location === currentMatch.location ||
                match.tags.some(tag => currentMatch.tags.includes(tag))
            )
            .slice(0, 3);
    }

    getMatchTypeLabel(type) {
        const labels = {
            'group': '👥 Grupo Cooperativo',
            'tanda': '🔄 Tanda Activa',
            'person': '👤 Persona Individual'
        };
        return labels[type] || 'Match';
    }

    quickSort(sortBy) {
        console.log('⚡ Quick sort by:', sortBy);
        
        // Update active sort button
        document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="advancedGroupsSystem.quickSort('${sortBy}')"]`)?.classList.add('active');
        
        // Apply sort
        this.currentSortBy = sortBy;
        this.updateMatchingFilters();
        
        this.showNotification(`📊 Ordenado por ${this.getSortLabel(sortBy)}`, 'info', 2000);
    }

    getSortLabel(sortBy) {
        const labels = {
            'compatibility': 'compatibilidad',
            'activity': 'actividad reciente',
            'location': 'cercanía',
            'amount': 'monto de ahorro'
        };
        return labels[sortBy] || sortBy;
    }

    setViewMode(mode) {
        console.log('👁️ Cambiando vista a:', mode);
        
        // Update active view button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="advancedGroupsSystem.setViewMode('${mode}')"]`)?.classList.add('active');
        
        const matchesGrid = document.getElementById('matchesGrid');
        if (matchesGrid) {
            matchesGrid.className = `matches-grid ${mode}`;
            
            // Re-render cards based on view mode
            const currentMatches = this.applyMatchingFilters(
                document.getElementById('matchType')?.value,
                document.getElementById('locationFilter')?.value,
                document.getElementById('amountFilter')?.value
            );
            
            if (mode === 'list') {
                matchesGrid.innerHTML = currentMatches.map(match => this.renderListMatchCard(match)).join('');
            } else if (mode === 'compact') {
                matchesGrid.innerHTML = currentMatches.map(match => this.renderCompactMatchCard(match)).join('');
            } else {
                matchesGrid.innerHTML = currentMatches.map(match => this.renderOptimizedMatchCard(match)).join('');
            }
            
            this.addMatchCardEffects();
        }
        
        this.showNotification(`👁️ Vista ${mode} activada`, 'info', 2000);
    }

    renderListMatchCard(match) {
        const compatibilityColor = match.compatibility >= 90 ? '#00ffff' : 
                                 match.compatibility >= 75 ? '#7fff7f' : 
                                 match.compatibility >= 60 ? '#ffff7f' : '#ff7f7f';

        return `
            <div class="match-card list-view" data-match-id="${match.id}" data-type="${match.type}">
                <div class="match-list-content">
                    <div class="match-list-left">
                        <div class="match-avatar-list">
                            ${match.type === 'group' ? match.icon : match.type === 'tanda' ? '🔄' : '👤'}
                        </div>
                        <div class="match-info-list">
                            <h4 class="match-title-list">${match.name}</h4>
                            <p class="match-subtitle-list">${match.subtitle}</p>
                            <div class="match-stats-inline">
                                <span>📍 ${match.location}</span>
                                <span>👥 ${match.members}</span>
                                <span>⭐ ${match.rating}</span>
                                ${match.amount ? `<span>💰 L. ${match.amount.toLocaleString()}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="match-list-center">
                        <div class="compatibility-badge-list" style="background: ${compatibilityColor}33; border: 1px solid ${compatibilityColor}66;">
                            ${match.compatibility}%
                        </div>
                        <div class="match-tags-inline">
                            ${match.tags.slice(0, 3).map(tag => `<span class="tag-inline">${tag}</span>`).join('')}
                        </div>
                    </div>
                    <div class="match-list-right">
                        <div class="match-actions-list">
                            <button class="btn btn-primary compact" onclick="advancedGroupsSystem.connectWithMatch('${match.id}', '${match.type}')">
                                <i class="fas fa-handshake"></i>
                                ${match.type === 'group' ? 'Unirse' : match.type === 'tanda' ? 'Participar' : 'Conectar'}
                            </button>
                            <button class="btn btn-secondary compact" onclick="advancedGroupsSystem.viewMatchDetails('${match.id}', '${match.type}')">
                                <i class="fas fa-eye"></i>
                                Ver
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCompactMatchCard(match) {
        return `
            <div class="match-card compact-view" data-match-id="${match.id}" data-type="${match.type}">
                <div class="match-compact-content">
                    <div class="match-compact-left">
                        <div class="match-avatar-compact">
                            ${match.type === 'group' ? match.icon : match.type === 'tanda' ? '🔄' : '👤'}
                        </div>
                        <div class="compatibility-compact">${match.compatibility}%</div>
                    </div>
                    <div class="match-compact-center">
                        <h5 class="match-title-compact">${match.name}</h5>
                        <div class="match-essential-info">
                            <span>📍 ${match.location}</span>
                            <span>👥 ${match.members}</span>
                            ${match.amount ? `<span>💰 L. ${(match.amount/1000).toFixed(0)}K</span>` : ''}
                        </div>
                    </div>
                    <div class="match-compact-right">
                        <button class="btn btn-primary micro" onclick="advancedGroupsSystem.connectWithMatch('${match.id}', '${match.type}')" title="${match.type === 'group' ? 'Solicitar unirse' : 'Participar'}">
                            <i class="fas fa-handshake"></i>
                        </button>
                        <button class="btn btn-secondary micro" onclick="advancedGroupsSystem.viewMatchDetails('${match.id}', '${match.type}')" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ========================================
    // 🎭 MODAL SYSTEM
    // ========================================

    showModal(options) {
        const { title, content, size = 'large', buttons = [] } = options;
        
        // Remove existing modal if any
        this.hideModal();
        
        const modalHTML = `
            <div class="modal-overlay" id="modalOverlay">
                <div class="modal-container ${size}" id="modalContainer">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="advancedGroupsSystem.hideModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        ${content}
                    </div>
                    ${buttons.length > 0 ? `
                    <div class="modal-footer">
                        ${buttons.map(btn => `
                            <button class="btn ${btn.class || 'btn-secondary'}" onclick="${btn.onclick || 'advancedGroupsSystem.hideModal()'}">
                                ${btn.icon ? `<i class="${btn.icon}"></i>` : ''}
                                <span>${btn.text}</span>
                            </button>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners
        const overlay = document.getElementById('modalOverlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideModal();
            }
        });
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            const container = document.getElementById('modalContainer');
            container.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    }

    hideModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.style.opacity = '0';
            const container = document.getElementById('modalContainer');
            container.style.transform = 'translate(-50%, -50%) scale(0.8)';
            
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // ========================================
    // 🔧 UTILITY FUNCTIONS
    // ========================================

    getLoadingHTML(message = 'Cargando...') {
        return `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
    }

    getErrorHTML(message = 'Ha ocurrido un error') {
        return `
            <div class="error-container">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="error-message">${message}</p>
                <button class="btn btn-secondary" onclick="advancedGroupsSystem.hideModal()">
                    <span>Cerrar</span>
                </button>
            </div>
        `;
    }
}

// ========================================
// 🌐 FUNCIONES GLOBALES DE INTERFAZ
// ========================================

function switchTab(tabName) {
    if (window.advancedGroupsSystem) {
        window.advancedGroupsSystem.switchTab(tabName);
    }
}

function showNotifications() {
    if (window.advancedGroupsSystem) {
        window.advancedGroupsSystem.showNotifications();
    }
}

// ========================================
// 🆕 NEW LAYOUT FUNCTIONALITY
// ========================================

// Filter functionality for Groups section
function initializeGroupFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('Filter tab clicked:', tab.dataset.filter);
            
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            const filter = tab.dataset.filter;
            
            // Filter group cards (they are dynamically generated)
            filterGroupCards(filter);
            
            // Update count badges
            updateFilterCounts();
        });
    });
}

// Function to filter dynamically loaded group cards
function filterGroupCards(filter) {
    const groupCards = document.querySelectorAll('.group-card');
    
    groupCards.forEach(card => {
        if (filter === 'all') {
            card.style.display = 'block';
        } else {
            // Check the group status from the card's status element
            const statusElement = card.querySelector('.group-status');
            if (statusElement) {
                const hasFilterClass = statusElement.classList.contains(`status-${filter}`);
                card.style.display = hasFilterClass ? 'block' : 'none';
            }
        }
    });
}

// Search functionality for groups
function initializeGroupSearch() {
    const searchInput = document.getElementById('groupsSearch');
    
    if (searchInput) {
        console.log('Search input found, adding event listener');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            console.log('Searching for:', searchTerm);
            
            // Search in dynamically loaded group cards
            searchGroupCards(searchTerm);
        });
    } else {
        console.log('Search input not found');
    }
}

// Function to search in dynamically loaded group cards
function searchGroupCards(searchTerm) {
    const groupCards = document.querySelectorAll('.group-card');
    
    groupCards.forEach(card => {
        const groupName = card.querySelector('.group-name')?.textContent.toLowerCase() || '';
        const groupDesc = card.querySelector('.group-description')?.textContent.toLowerCase() || '';
        
        if (searchTerm === '' || groupName.includes(searchTerm) || groupDesc.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Sort functionality for groups
function initializeGroupSort() {
    const sortSelect = document.getElementById('groupsSort');
    
    if (sortSelect) {
        console.log('Sort dropdown found, adding event listener');
        sortSelect.addEventListener('change', (e) => {
            const sortBy = e.target.value;
            console.log('Sorting by:', sortBy);
            
            // Sort dynamically loaded group cards
            sortGroupCards(sortBy);
        });
    } else {
        console.log('Sort dropdown not found');
    }
}

// Function to sort dynamically loaded group cards
function sortGroupCards(sortBy) {
    const groupsGrid = document.querySelector('.groups-grid');
    if (!groupsGrid) return;
    
    const groupCards = Array.from(groupsGrid.querySelectorAll('.group-card'));
    
    groupCards.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                const nameA = a.querySelector('.group-name')?.textContent || '';
                const nameB = b.querySelector('.group-name')?.textContent || '';
                return nameA.localeCompare(nameB);
            case 'members':
                const membersA = parseInt(a.querySelector('.stat-value')?.textContent.split('/')[0] || '0');
                const membersB = parseInt(b.querySelector('.stat-value')?.textContent.split('/')[0] || '0');
                return membersB - membersA;
            case 'amount':
                const statValues = a.querySelectorAll('.stat-value');
                const amountElementA = Array.from(statValues).find(el => el.textContent.includes('L.'));
                const amountA = parseInt(amountElementA?.textContent.replace(/[^\d]/g, '') || '0');
                
                const statValuesB = b.querySelectorAll('.stat-value');
                const amountElementB = Array.from(statValuesB).find(el => el.textContent.includes('L.'));
                const amountB = parseInt(amountElementB?.textContent.replace(/[^\d]/g, '') || '0');
                return amountB - amountA;
            default: // recent
                return 0;
        }
    });
    
    // Clear and re-append sorted cards
    groupsGrid.innerHTML = '';
    groupCards.forEach(card => groupsGrid.appendChild(card));
}

// Update filter count badges based on actual group data
function updateFilterCounts() {
    if (!window.advancedGroupsSystem || !window.advancedGroupsSystem.groups) return;
    
    const groups = window.advancedGroupsSystem.groups;
    
    const allCount = groups.length;
    const activeCount = groups.filter(g => g.status === 'active').length;
    const pausedCount = groups.filter(g => g.status === 'paused').length;
    const completedCount = groups.filter(g => g.status === 'completed').length;
    
    // Update count badges
    const allBadge = document.querySelector('[data-filter="all"] .count-badge');
    const activeBadge = document.querySelector('[data-filter="active"] .count-badge');
    const pausedBadge = document.querySelector('[data-filter="paused"] .count-badge');
    const completedBadge = document.querySelector('[data-filter="completed"] .count-badge');
    
    if (allBadge) allBadge.textContent = allCount;
    if (activeBadge) activeBadge.textContent = activeCount;
    if (pausedBadge) pausedBadge.textContent = pausedCount;
    if (completedBadge) completedBadge.textContent = completedCount;
    
    console.log('Filter counts updated:', { allCount, activeCount, pausedCount, completedCount });
}

// Activity feed interactions
function initializeActivityFeed() {
    const activityItems = document.querySelectorAll('.activity-item');
    
    activityItems.forEach(item => {
        item.addEventListener('click', () => {
            // Add click effect
            item.style.transform = 'scale(0.98)';
            setTimeout(() => {
                item.style.transform = 'scale(1)';
            }, 150);
            
            // You can add more interaction logic here
            console.log('Activity item clicked:', item.querySelector('.activity-text').textContent);
        });
    });
}

// Tanda card interactions
function initializeTandaCards() {
    const tandaCards = document.querySelectorAll('.tanda-card');
    
    tandaCards.forEach(card => {
        // Add hover effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
        
        // Handle action buttons
        const viewButton = card.querySelector('.btn-outline');
        const actionButton = card.querySelector('.btn-primary, .btn-success');
        
        if (viewButton) {
            viewButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const tandaNumber = card.querySelector('.tanda-number').textContent;
                console.log(`Ver detalles de tanda ${tandaNumber}`);
                // Add modal or navigation logic here
            });
        }
        
        if (actionButton) {
            actionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const tandaNumber = card.querySelector('.tanda-number').textContent;
                const action = actionButton.textContent.trim();
                console.log(`${action} para tanda ${tandaNumber}`);
                // Add specific action logic here
            });
        }
    });
}

// Overview card interactions
function initializeOverviewCards() {
    const overviewCards = document.querySelectorAll('.overview-card');
    
    overviewCards.forEach(card => {
        card.addEventListener('click', () => {
            // Add click animation
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 150);
            
            // Add navigation or modal logic here
            const cardLabel = card.querySelector('.card-label').textContent;
            console.log(`Clicked on: ${cardLabel}`);
        });
    });
    
    // Add navigation to stat cards in dashboard
    const statCards = document.querySelectorAll('.stat-card.interactive');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.dataset.target;
            const filter = card.dataset.filter;
            
            if (target && window.advancedGroupsSystem) {
                // Add click effect
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                    // Navigate to target section
                    window.advancedGroupsSystem.switchTab(target);
                    
                    // Apply filter if specified
                    if (filter && target === 'groups') {
                        setTimeout(() => {
                            const filterTab = document.querySelector(`[data-filter="${filter}"]`);
                            if (filterTab) filterTab.click();
                        }, 100);
                    }
                }, 150);
            }
        });
    });
}

// ========================================
// 🔥 NUEVAS FUNCIONES PARA TANDAS
// ========================================

// Dentro de la clase AdvancedGroupsSystemV3, agregar estas funciones:
AdvancedGroupsSystemV3.prototype.updateTandasStats = function() {
    // Actualizar estadísticas en tiempo real
    const activeTandasCount = document.getElementById('activeTandasCount');
    const upcomingTurns = document.getElementById('upcomingTurns');
    const pendingPayments = document.getElementById('pendingPayments');
    const totalExpected = document.getElementById('totalExpected');
    
    if (activeTandasCount) activeTandasCount.textContent = '3';
    if (upcomingTurns) upcomingTurns.textContent = '2';
    if (pendingPayments) pendingPayments.textContent = '1';
    if (totalExpected) totalExpected.textContent = 'L. 13,500';
};

AdvancedGroupsSystemV3.prototype.refreshTandas = function() {
    this.showNotification('info', '🔄 Actualizando tandas...');
    this.loadTandasContent();
    setTimeout(() => {
        this.showNotification('success', '✅ Tandas actualizadas correctamente');
    }, 1000);
};

AdvancedGroupsSystemV3.prototype.showTandaHistory = function() {
    this.createModal('tanda-history', '📋 Historial de Tandas', `
        <div class="tanda-history-container">
            <div class="history-filters">
                <select class="form-control">
                    <option>Todas las tandas</option>
                    <option>Completadas</option>
                    <option>Canceladas</option>
                </select>
                <input type="date" class="form-control" placeholder="Desde">
                <input type="date" class="form-control" placeholder="Hasta">
            </div>
            <div class="history-list">
                <div class="history-item completed">
                    <div class="history-info">
                        <h4>Tanda Navideña 2024</h4>
                        <p>Grupo Alpha • L. 2,400 • Posición 3/8</p>
                    </div>
                    <div class="history-status">
                        <span class="badge badge-success">Completada</span>
                        <span class="history-date">Dic 2024</span>
                    </div>
                </div>
            </div>
        </div>
    `, true);
};

AdvancedGroupsSystemV3.prototype.filterTandas = function() {
    const filter = document.getElementById('tandasStatusFilter')?.value || 'all';
    console.log('🔍 Filtrando tandas por estado:', filter);
    
    // Aplicar el filtro usando la función existente
    this.filterTandasByStatus(filter);
};

AdvancedGroupsSystemV3.prototype.sortTandas = function() {
    const sortBy = document.getElementById('tandasSortOrder')?.value || 'next-payment';
    console.log('🔄 Ordenando tandas por:', sortBy);
    // Apply the sorting using the existing sort logic
    this.sortTandasBy(sortBy);
};

AdvancedGroupsSystemV3.prototype.sortTandasBy = function(sortBy) {
    console.log('🔄 Aplicando orden por:', sortBy);
    
    const tandasList = document.getElementById('tandasList');
    if (!tandasList) return;
    
    // Get current filter state
    const statusFilter = document.getElementById('tandasStatusFilter')?.value || 'all';
    
    // Get tandas data (same mock data used in loadTandasContent)
    const allTandas = [
        {
            id: 'tanda_1',
            name: 'Tanda Enero 2025',
            groupId: 'group_1', 
            groupName: 'Cooperativa Familiar',
            groupAvatar: '👨‍👩‍👧‍👦',
            status: 'active',
            progress: 75,
            currentRound: 3,
            totalRounds: 4,
            roundAmount: 6000,
            totalAmount: 24000,
            nextPaymentDate: '2025-01-15',
            nextBeneficiary: 'María Rodriguez',
            paymentsPending: 2,
            participants: 4,
            paymentFrequency: 'monthly',
            turnPosition: 2
        },
        {
            id: 'tanda_2',
            name: 'Tanda Profesionales Q4',
            groupId: 'group_2',
            groupName: 'Red Profesional TGU',
            groupAvatar: '👔',
            status: 'active',
            progress: 50,
            currentRound: 2,
            totalRounds: 4,
            roundAmount: 12000,
            totalAmount: 48000,
            nextPaymentDate: '2025-01-20',
            nextBeneficiary: 'Carlos López',
            paymentsPending: 1,
            participants: 4,
            paymentFrequency: 'monthly',
            turnPosition: 7
        },
        {
            id: 'tanda_3',
            name: 'Tanda Comunitaria Diciembre',
            groupId: 'group_3',
            groupName: 'Grupo Comunitario',
            groupAvatar: '🏘️',
            status: 'completed',
            progress: 100,
            currentRound: 6,
            totalRounds: 6,
            roundAmount: 3000,
            totalAmount: 18000,
            completedDate: '2024-12-30',
            participants: 6,
            paymentFrequency: 'monthly',
            turnPosition: null
        },
        {
            id: 'tanda_4',
            name: 'Tanda Familiar Febrero',
            groupId: 'group_1',
            groupName: 'Cooperativa Familiar',
            groupAvatar: '👨‍👩‍👧‍👦',
            status: 'upcoming',
            progress: 0,
            currentRound: 0,
            totalRounds: 4,
            roundAmount: 6000,
            totalAmount: 24000,
            startDate: '2025-02-01',
            participants: 4,
            paymentFrequency: 'monthly',
            turnPosition: 1
        },
        {
            id: 'tanda_5',
            name: 'Tanda Express Semanal',
            groupId: 'group_4',
            groupName: 'Emprendedores Unidos',
            groupAvatar: '💼',
            status: 'active',
            progress: 25,
            currentRound: 1,
            totalRounds: 4,
            roundAmount: 4000,
            totalAmount: 16000,
            nextPaymentDate: '2025-01-12',
            nextBeneficiary: 'Ana García',
            paymentsPending: 3,
            participants: 4,
            paymentFrequency: 'weekly',
            turnPosition: 4
        }
    ];
    
    // Apply status filter first
    let filteredTandas = allTandas;
    if (statusFilter !== 'all') {
        filteredTandas = allTandas.filter(tanda => tanda.status === statusFilter);
    }
    
    // Apply sorting
    filteredTandas.sort((a, b) => {
        switch (sortBy) {
            case 'next-payment':
                // Sort by next payment date (earliest first)
                if (!a.nextPaymentDate && !b.nextPaymentDate) return 0;
                if (!a.nextPaymentDate) return 1;
                if (!b.nextPaymentDate) return -1;
                return new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate);
                
            case 'amount':
                // Sort by round amount (highest first)
                return b.roundAmount - a.roundAmount;
                
            case 'group-name':
                // Sort by group name alphabetically
                return a.groupName.localeCompare(b.groupName);
                
            case 'turn-position':
                // Sort by turn position (lowest first, nulls last)
                if (a.turnPosition === null && b.turnPosition === null) return 0;
                if (a.turnPosition === null) return 1;
                if (b.turnPosition === null) return -1;
                return a.turnPosition - b.turnPosition;
                
            default:
                return 0;
        }
    });
    
    // Render sorted results
    if (filteredTandas.length > 0) {
        tandasList.innerHTML = filteredTandas.map((tanda, index) => {
            return this.renderTandaCard(tanda);
        }).join('');
    } else {
        tandasList.innerHTML = this.renderEmptyFilterState(statusFilter, null);
    }
    
    // Show notification
    const sortLabels = {
        'next-payment': 'Próximo pago',
        'amount': 'Monto',
        'group-name': 'Nombre del grupo',
        'turn-position': 'Posición en turno'
    };
    
    this.showNotification('success', `Tandas ordenadas por: ${sortLabels[sortBy]}`);
};

AdvancedGroupsSystemV3.prototype.showUpcomingPayments = function() {
    this.createModal('upcoming-payments', '📅 Pagos Programados', `
        <div class="payments-calendar">
            <div class="calendar-header">
                <h3>Enero 2025</h3>
                <div class="calendar-nav">
                    <button class="btn btn-sm btn-outline">‹</button>
                    <button class="btn btn-sm btn-outline">›</button>
                </div>
            </div>
            <div class="payments-list">
                <div class="payment-item urgent">
                    <div class="payment-date">15 Ene</div>
                    <div class="payment-info">
                        <h4>Grupo Alpha</h4>
                        <p>L. 300.00 • Tanda #001</p>
                    </div>
                    <div class="payment-status">
                        <span class="badge badge-warning">Pendiente</span>
                    </div>
                </div>
                <div class="payment-item">
                    <div class="payment-date">20 Ene</div>
                    <div class="payment-info">
                        <h4>Grupo Beta</h4>
                        <p>L. 250.00 • Tanda #002</p>
                    </div>
                    <div class="payment-status">
                        <span class="badge badge-info">Programado</span>
                    </div>
                </div>
            </div>
        </div>
    `, true);
};

AdvancedGroupsSystemV3.prototype.calculateEarnings = function() {
    this.createModal('earnings-calculator', '🧮 Calculadora de Ganancias', `
        <div class="earnings-calculator">
            <div class="calculator-inputs">
                <div class="input-group">
                    <label>Monto mensual de tanda:</label>
                    <input type="number" id="monthlyAmount" value="500" class="form-control">
                </div>
                <div class="input-group">
                    <label>Número de participantes:</label>
                    <input type="number" id="participants" value="8" class="form-control">
                </div>
                <div class="input-group">
                    <label>Tu posición en la tanda:</label>
                    <input type="number" id="position" value="3" class="form-control">
                </div>
            </div>
            <div class="calculator-results">
                <div class="result-card">
                    <h4>Resultados de la Proyección</h4>
                    <div class="result-item">
                        <span>Total a recibir:</span>
                        <strong>L. 4,000.00</strong>
                    </div>
                    <div class="result-item">
                        <span>Total a pagar:</span>
                        <strong>L. 4,000.00</strong>
                    </div>
                    <div class="result-item">
                        <span>Meses hasta tu turno:</span>
                        <strong>3 meses</strong>
                    </div>
                    <div class="result-item">
                        <span>Ganancia estimada:</span>
                        <strong>L. 0.00</strong>
                    </div>
                </div>
            </div>
        </div>
    `, true);
};

AdvancedGroupsSystemV3.prototype.showPaymentHistory = function() {
    this.createModal('payment-history', '🧾 Historial de Pagos', `
        <div class="payment-history">
            <div class="history-filters">
                <select class="form-control">
                    <option>Últimos 6 meses</option>
                    <option>2024</option>
                    <option>2023</option>
                </select>
                <select class="form-control">
                    <option>Todos los grupos</option>
                    <option>Grupo Alpha</option>
                    <option>Grupo Beta</option>
                </select>
            </div>
            <div class="payments-table">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Grupo</th>
                            <th>Monto</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>15 Dic 2024</td>
                            <td>Grupo Alpha</td>
                            <td>L. 300.00</td>
                            <td><span class="badge badge-success">Pagado</span></td>
                        </tr>
                        <tr>
                            <td>15 Nov 2024</td>
                            <td>Grupo Alpha</td>
                            <td>L. 300.00</td>
                            <td><span class="badge badge-success">Pagado</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `, true);
};

AdvancedGroupsSystemV3.prototype.showTandaRules = function() {
    this.createModal('tanda-rules', '📖 Reglas y Políticas de Tandas', `
        <div class="tanda-rules">
            <div class="rules-section">
                <h4><i class="fas fa-gavel"></i> Reglas Generales</h4>
                <ul class="rules-list">
                    <li>Los pagos deben realizarse antes de la fecha límite</li>
                    <li>El orden de los turnos se respeta estrictamente</li>
                    <li>No se permiten cambios de turno sin autorización</li>
                    <li>Los miembros deben participar en todas las reuniones</li>
                </ul>
            </div>
            <div class="rules-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Sanciones</h4>
                <ul class="rules-list">
                    <li>Pago tardío: Multa de L. 50.00</li>
                    <li>Falta a reunión: Multa de L. 25.00</li>
                    <li>Abandono del grupo: Pérdida de aportes</li>
                </ul>
            </div>
            <div class="rules-section">
                <h4><i class="fas fa-shield-alt"></i> Garantías</h4>
                <ul class="rules-list">
                    <li>Seguro de participación incluido</li>
                    <li>Fondo de emergencia del 5%</li>
                    <li>Mediación en caso de disputas</li>
                </ul>
            </div>
        </div>
    `, true);
};


// Initialize all new functionality
function initializeNewFeatures() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeAllFeatures, 100);
        });
    } else {
        setTimeout(initializeAllFeatures, 100);
    }
}

function initializeAllFeatures() {
    try {
        initializeGroupFilters();
        initializeGroupSearch();
        initializeGroupSort();
        initializeActivityFeed();
        initializeTandaCards();
        initializeOverviewCards();
        
        console.log('✅ New layout features initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing new features:', error);
    }

// Initialize features after a short delay to ensure DOM is ready
setTimeout(() => {
    console.log('🔄 Initializing new layout features...');
    initializeNewFeatures();
}, 500);
}

// Collapsible sections functionality
function toggleCollapsible(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapsible-icon');
    
    header.classList.toggle('active');
    content.classList.toggle('expanded');
    
    // Update icon rotation
    if (content.classList.contains('expanded')) {
        icon.style.transform = 'rotate(180deg)';
    } else {
        icon.style.transform = 'rotate(0deg)';
    }
    
    // Smooth height animation
    if (content.classList.contains('expanded')) {
        content.style.maxHeight = content.scrollHeight + 'px';
    } else {
        content.style.maxHeight = '0px';
    }
}

// ==========================================
// WEB3 ANIMATIONS & EFFECTS
// ==========================================

// Flash Text Animation System
class Web3FlashText {
    constructor() {
        this.flashContainer = document.querySelector('.flash-text');
        this.flashWords = document.querySelectorAll('.flash-word');
        this.currentIndex = 0;
        this.interval = null;
        
        if (this.flashContainer && this.flashWords.length > 0) {
            this.startFlashAnimation();
        }
    }
    
    startFlashAnimation() {
        // Start cycling through flash words every 4 seconds
        this.interval = setInterval(() => {
            this.nextFlashWord();
        }, 4000);
    }
    
    nextFlashWord() {
        // Hide current word
        this.flashWords[this.currentIndex].classList.remove('active');
        
        // Move to next word (cycle back to 0 if at end)
        this.currentIndex = (this.currentIndex + 1) % this.flashWords.length;
        
        // Show next word
        this.flashWords[this.currentIndex].classList.add('active');
    }
    
    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

// Crypto Chart Animation System
class Web3ChartAnimations {
    constructor() {
        this.cryptoBars = document.querySelectorAll('.crypto-bar');
        this.animationDelay = 200; // Delay between each bar animation
        
        if (this.cryptoBars.length > 0) {
            this.initializeChartAnimations();
        }
    }
    
    initializeChartAnimations() {
        // Set initial heights to 0 for animation
        this.cryptoBars.forEach((bar, index) => {
            const targetHeight = bar.getAttribute('data-height') || '0';
            bar.style.height = '0%';
            
            // Animate each bar with delay
            setTimeout(() => {
                bar.style.height = targetHeight + '%';
                bar.style.setProperty('--final-height', targetHeight + '%');
                
                // Add glow effect on completion
                setTimeout(() => {
                    bar.classList.add('chart-complete');
                }, 500);
            }, index * this.animationDelay);
        });
    }
    
    // Method to update chart with new data
    updateChart(newData) {
        this.cryptoBars.forEach((bar, index) => {
            if (newData[index] !== undefined) {
                bar.style.height = newData[index] + '%';
                bar.setAttribute('data-height', newData[index]);
            }
        });
    }
}

// APY Counter Animation
class Web3CounterAnimations {
    constructor() {
        this.counters = document.querySelectorAll('.apy-value, .power-value, .portfolio-value');
        this.initializeCounters();
    }
    
    initializeCounters() {
        this.counters.forEach(counter => {
            this.animateCounter(counter);
        });
    }
    
    animateCounter(element) {
        const target = parseFloat(element.textContent.replace(/[^\d.]/g, ''));
        const prefix = element.textContent.replace(/[\d.]/g, '');
        const suffix = element.textContent.match(/[%]|[A-Z]+$/)?.[0] || '';
        
        let current = 0;
        const increment = target / 50; // 50 frames for smooth animation
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            element.textContent = prefix + current.toFixed(1) + suffix;
        }, 40); // 40ms per frame = 2 second total animation
    }
}

// Web3 Particle System
class Web3ParticleSystem {
    constructor() {
        this.particleContainer = document.querySelector('.web3-particles');
        this.particles = [];
        
        if (this.particleContainer) {
            this.initializeParticles();
        }
    }
    
    initializeParticles() {
        // Add extra floating particles dynamically
        const extraParticles = [
            { class: 'defi', emoji: '⚡', top: '15%', left: '75%' },
            { class: 'nft', emoji: '💎', top: '80%', right: '60%' },
            { class: 'dao', emoji: '🏛️', top: '45%', left: '5%' },
            { class: 'yield', emoji: '📈', top: '25%', right: '5%' }
        ];
        
        extraParticles.forEach(particle => {
            const el = document.createElement('div');
            el.className = `crypto-particle extra-particle ${particle.class}`;
            el.textContent = particle.emoji;
            el.style.top = particle.top;
            if (particle.left) el.style.left = particle.left;
            if (particle.right) el.style.right = particle.right;
            
            this.particleContainer.appendChild(el);
        });
    }
}

// Web3 Stats Live Updates
class Web3StatsUpdater {
    constructor() {
        this.statsElements = {
            tvl: document.querySelector('.portfolio-value.crypto-blue'),
            apy: document.querySelector('.apy-value'),
            power: document.querySelector('.power-value')
        };
        
        this.startLiveUpdates();
    }
    
    startLiveUpdates() {
        // Simulate live crypto stats updates every 10 seconds
        setInterval(() => {
            this.updateTVL();
            this.updateAPY();
            this.updateVotingPower();
        }, 10000);
    }
    
    updateTVL() {
        if (this.statsElements.tvl) {
            const currentTVL = 156000; // Base TVL
            const variation = (Math.random() - 0.5) * 10000; // ±5K variation
            const newTVL = Math.max(100000, currentTVL + variation);
            
            this.statsElements.tvl.textContent = `L. ${(newTVL / 1000).toFixed(0)}K`;
        }
    }
    
    updateAPY() {
        if (this.statsElements.apy) {
            const baseAPY = 18.7;
            const variation = (Math.random() - 0.5) * 2; // ±1% variation
            const newAPY = Math.max(12, Math.min(25, baseAPY + variation));
            
            this.statsElements.apy.textContent = `${newAPY.toFixed(1)}%`;
        }
    }
    
    updateVotingPower() {
        if (this.statsElements.power) {
            const basePower = 127;
            const variation = Math.floor((Math.random() - 0.5) * 20); // ±10 variation
            const newPower = Math.max(50, basePower + variation);
            
            this.statsElements.power.textContent = `${newPower} LTD`;
        }
    }
}

// Holographic Card Effects
class Web3HolographicEffects {
    constructor() {
        this.web3Cards = document.querySelectorAll('.web3-card');
        this.initializeHolographicEffects();
    }
    
    initializeHolographicEffects() {
        this.web3Cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                this.updateHolographicEffect(card, e);
            });
            
            card.addEventListener('mouseleave', () => {
                this.resetHolographicEffect(card);
            });
        });
    }
    
    updateHolographicEffect(card, event) {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        
        // Update gradient position based on mouse
        const gradientX = (x / rect.width) * 100;
        const gradientY = (y / rect.height) * 100;
        
        card.style.background = `
            linear-gradient(135deg, 
                rgba(0, 0, 0, 0.8) 0%, 
                rgba(15, 23, 42, 0.9) 50%,
                rgba(0, 0, 0, 0.8) 100%),
            radial-gradient(circle at ${gradientX}% ${gradientY}%, 
                rgba(0, 255, 255, 0.1) 0%, 
                transparent 50%)
        `;
    }
    
    resetHolographicEffect(card) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        card.style.background = `linear-gradient(135deg, 
            rgba(0, 0, 0, 0.8) 0%, 
            rgba(15, 23, 42, 0.9) 50%,
            rgba(0, 0, 0, 0.8) 100%)`;
    }
}

// Main Web3 Animation Manager
class Web3AnimationManager {
    constructor() {
        this.flashText = null;
        this.chartAnimations = null;
        this.counterAnimations = null;
        this.particleSystem = null;
        this.statsUpdater = null;
        this.holographicEffects = null;
        
        this.initialize();
    }
    
    initialize() {
        // Wait for DOM elements to be available
        setTimeout(() => {
            this.flashText = new Web3FlashText();
            this.chartAnimations = new Web3ChartAnimations();
            this.counterAnimations = new Web3CounterAnimations();
            this.particleSystem = new Web3ParticleSystem();
            this.statsUpdater = new Web3StatsUpdater();
            this.holographicEffects = new Web3HolographicEffects();
            
            console.log('🚀 Web3 Animations initialized successfully');
        }, 1000);
    }
    
    destroy() {
        if (this.flashText) this.flashText.destroy();
        if (this.statsUpdater) clearInterval(this.statsUpdater.interval);
    }
}

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando Sistema de Grupos & Tandas Avanzado v3.0...');
    window.advancedGroupsSystem = new AdvancedGroupsSystemV3();
    
    // Initialize Web3 animations
    window.web3AnimationManager = new Web3AnimationManager();
    
    console.log('✅ Sistema inicializado correctamente');
});
