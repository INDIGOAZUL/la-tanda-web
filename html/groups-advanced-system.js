/**
 * Sistema de Grupos & Tandas Avanzado v3.0
 * Alineado con La Tanda Web3 Platform
 * Funcionalidades completas con estilo unificado
 */

class AdvancedGroupsSystemV3 {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = this.loadUserData();
        
        // Initialize API proxy for hybrid real+simulated API calls
        this.apiProxy = window.apiProxy || window.EnhancedAPIProxy || new window.EnhancedAPIProxy();
        
        // Estado del sistema con persistencia
        this.groups = [];
        this.tandas = this.loadTandasData();
        this.matches = this.loadMatchesData();
        this.notifications = this.loadNotificationsData();
        this.activities = this.loadActivitiesData();
        
        // Cargar grupos de forma asíncrona
        this.initializeGroups();
        
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
    
    async initializeGroups() {
        try {
            console.log('🔄 Inicializando carga de grupos desde API...');
            this.groups = await this.loadGroupsData();
            
            // Listen for new group creation events
            window.addEventListener('groupCreated', (event) => {
                console.log('🔄 Nuevo grupo creado, actualizando lista...', event.detail);
                this.refreshGroupsAfterCreation(event.detail);
            });
            
            // Actualizar estadísticas después de cargar grupos
            this.userStats = this.calculateUserStats();
            
            // Actualizar UI si ya está renderizada
            if (document.querySelector('.main-content')) {
                this.updateDashboard();
                this.loadGroupsContent();
            }
            
            console.log('✅ Grupos inicializados:', this.groups.length);
        } catch (error) {
            console.error('❌ Error inicializando grupos:', error);
        }
    }
    
    async init() {
        console.log('🏦 Sistema de Grupos & Tandas Avanzado v3.0 - Iniciando...');
        
        try {
            this.setupEventListeners();
            this.updateDashboard();
            this.loadRecentActivity();
            this.initializeFormHandlers();
            this.updateNotificationCount();
            
            // Start real-time updates for dynamic dashboard
            this.startPeriodicUpdates();
            
            // Start real-time notifications simulation (for development)
            // this.simulateRealTimeNotifications();
            
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
            location: 'La Tanda Chain Network',
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
    
    async loadGroupsData() {
        console.log('📂 Cargando grupos usando API Proxy híbrido...');
        
        try {
            // Check which method is available on the proxy
            const requestMethod = this.apiProxy.request ? 'request' : 'makeRequest';
            console.log('🔍 Usando método:', requestMethod);
            console.log('🔍 Llamando endpoint: /api/groups');
            console.log('🔍 API Proxy instance:', this.apiProxy);
            
            const result = await this.apiProxy[requestMethod]('/api/groups');
            console.log('🔍 Raw result from API Proxy:', result);
            
            if (result.success) {
                // DEBUG: Log complete result structure
                console.log('🔍 DEBUG - Complete result:', result);
                console.log('🔍 DEBUG - result.data:', result.data);
                console.log('🔍 DEBUG - result.data.groups:', result.data.groups);
                console.log('🔍 DEBUG - typeof result.data:', typeof result.data);
                console.log('🔍 DEBUG - Array.isArray(result.data):', Array.isArray(result.data));
                
                // Handle different data structures from API
                let groupsData = [];
                if (result.data && Array.isArray(result.data)) {
                    groupsData = result.data;
                } else if (result.data && result.data.groups && Array.isArray(result.data.groups)) {
                    groupsData = result.data.groups;
                } else {
                    console.warn('⚠️ Unexpected data structure, using empty array');
                    groupsData = [];
                }
                
                console.log('✅ Grupos cargados desde API Proxy:', groupsData.length, 'grupos');
                console.log('🔍 Fuente de datos:', result.meta?.source || 'unknown');
                console.log('🔍 DEBUG - groupsData:', groupsData);
                if (groupsData.length > 0) {
                    console.log('📋 IDs de grupos obtenidos:', groupsData.map(g => g.id || g._id));
                }
                
                // Map API data format to frontend format
                const mappedGroups = groupsData.map(group => ({
                    ...group,
                    // Map API fields to frontend expected fields
                    members: group.member_count || group.members,
                    maxMembers: group.max_members || group.maxMembers,
                    contribution: group.contribution_amount || group.contribution,
                    totalSavings: group.total_amount_collected || group.totalSavings,
                    created: group.created_at ? new Date(group.created_at) : group.created,
                    // Add missing frontend fields with defaults
                    tags: group.tags || [group.category || 'general'],
                    avatar: group.avatar || this.getGroupAvatar(group.category || 'general'),
                    isOwner: group.admin_id === (this.currentUser?.id || 'user_001'),
                    isAdmin: group.admin_id === (this.currentUser?.id || 'user_001'),
                    trustScore: group.trust_score || 85,
                    performance: group.performance || 100
                }));
                
                console.log('🔄 Datos mapeados para frontend:', mappedGroups.length, 'grupos');
                
                // INTEGRATE: Add locally created groups
                const localGroups = this.getLocallyCreatedGroups();
                if (localGroups.length > 0) {
                    console.log('🔄 Integrando grupos creados localmente:', localGroups.length, 'grupos');
                    mappedGroups.push(...localGroups);
                    console.log('✅ Total grupos después de integración:', mappedGroups.length, 'grupos');
                }
                
                // Update group statistics counters
                this.updateGroupStatistics(mappedGroups);
                
                return mappedGroups;
            } else {
                console.error('❌ Error en respuesta de API Proxy:', result);
                return [];
            }
        } catch (error) {
            console.error('❌ Error cargando grupos desde API Proxy:', error);
            console.log('🔄 Fallback: cargando desde localStorage...');
            
            // Fallback a localStorage como último recurso
            const savedGroups = localStorage.getItem('latanda_groups_data');
            if (savedGroups) {
                try {
                    const parsed = JSON.parse(savedGroups);
                    console.log('✅ Grupos cargados desde localStorage (fallback):', parsed.length, 'grupos');
                    return parsed;
                } catch (parseError) {
                    console.error('❌ Error parseando localStorage:', parseError);
                }
            }
            
            return [];
        }
    }
    
    getLocallyCreatedGroups() {
        console.log('🔍 Buscando grupos creados localmente...');
        
        try {
            // Check different localStorage keys where groups might be stored
            const possibleKeys = [
                'latanda_created_groups',
                'latanda_user_groups', 
                'user_created_groups',
                'tanda_groups_created',
                'groups_created_locally'
            ];
            
            let allLocalGroups = [];
            
            for (const key of possibleKeys) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        const groups = Array.isArray(parsed) ? parsed : [parsed];
                        console.log(`✅ Found ${groups.length} grupos in ${key}`);
                        allLocalGroups.push(...groups);
                    } catch (e) {
                        console.warn(`⚠️ Error parsing ${key}:`, e);
                    }
                }
            }
            
            // Also check if there are any groups in the main groups array
            if (this.groups && Array.isArray(this.groups)) {
                const locallyCreated = this.groups.filter(g => g.isLocallyCreated || g.createdLocally);
                if (locallyCreated.length > 0) {
                    console.log(`✅ Found ${locallyCreated.length} locally created grupos in this.groups`);
                    allLocalGroups.push(...locallyCreated);
                }
            }
            
            console.log(`📊 Total grupos creados localmente encontrados: ${allLocalGroups.length}`);
            
            // Format local groups to match expected structure
            return allLocalGroups.map(group => ({
                ...group,
                id: group.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                isLocallyCreated: true,
                source: 'localStorage',
                // Add missing fields with defaults
                members: group.members || group.currentMembers || 1,
                maxMembers: group.maxMembers || group.max_members || 10,
                contribution: group.contribution || group.contributionAmount || 0,
                totalSavings: group.totalSavings || group.total_savings || 0,
                status: group.status || 'active',
                trustScore: group.trustScore || 90,
                performance: group.performance || 100,
                avatar: group.avatar || this.getGroupAvatar(group.category || 'general'),
                isOwner: true,
                isAdmin: true
            }));
            
        } catch (error) {
            console.error('❌ Error obteniendo grupos creados localmente:', error);
            return [];
        }
    }
    
    async refreshGroupsAfterCreation(newGroup) {
        try {
            console.log('🔄 Refreshing groups after creation:', newGroup.name);
            
            // Add the new group to our local array if not already there
            const existingIndex = this.groups.findIndex(g => g.id === newGroup.id);
            if (existingIndex === -1) {
                this.groups.unshift(newGroup); // Add to beginning of array
                console.log('✅ Added new group to local array');
            }
            
            // Update statistics
            this.updateGroupStatistics(this.groups);
            
            // Re-render the groups list without API reload
            this.renderGroupsWithoutAPIReload();
            
            // Show success notification
            this.showNotification('✅ Grupo creado exitosamente', `${newGroup.name} está listo para recibir miembros`, 'success');
            
        } catch (error) {
            console.error('❌ Error refreshing groups after creation:', error);
        }
    }
    
    updateGroupStatistics(groups) {
        console.log('📊 Actualizando estadísticas de grupos...');
        
        try {
            // Calculate real statistics from groups data
            const stats = {
                all: groups.length,
                active: groups.filter(g => g.status === 'active').length,
                paused: groups.filter(g => g.status === 'paused' || g.status === 'reclutando').length,
                completed: groups.filter(g => g.status === 'completed' || g.status === 'completado').length
            };
            
            console.log('📊 Estadísticas calculadas:', stats);
            
            // Update UI elements
            const updateElement = (id, value) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                    console.log(`✅ Updated ${id}: ${value}`);
                } else {
                    console.warn(`⚠️ Element not found: ${id}`);
                }
            };
            
            updateElement('groups-count-all', stats.all);
            updateElement('groups-count-active', stats.active);
            updateElement('groups-count-paused', stats.paused);
            updateElement('groups-count-completed', stats.completed);
            
            console.log('✅ Estadísticas de grupos actualizadas correctamente');
            
        } catch (error) {
            console.error('❌ Error actualizando estadísticas:', error);
        }
    }
    
    saveGroupsData(groups) {
        try {
            console.log('💾 Guardando grupos en localStorage:', groups.length, 'grupos');
            localStorage.setItem('latanda_groups_data', JSON.stringify(groups));
            console.log('✅ Grupos guardados exitosamente');
            
            // Verificar inmediatamente que se guardaron
            const saved = localStorage.getItem('latanda_groups_data');
            const parsed = JSON.parse(saved);
            console.log('🔍 Verificación: Se guardaron', parsed.length, 'grupos');
        } catch (error) {
            console.error('❌ Error guardando grupos:', error);
        }
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
    
    loadMatchesData() {
        const savedMatches = localStorage.getItem('latanda_matches_data');
        if (savedMatches) {
            return JSON.parse(savedMatches);
        }
        
        const defaultMatches = [];
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
        
        const defaultNotifications = this.getEnhancedNotifications();
        this.saveNotificationsData(defaultNotifications);
        return defaultNotifications;
    }
    
    saveNotificationsData(notifications) {
        localStorage.setItem('latanda_notifications_data', JSON.stringify(notifications));
    }

    getMockGroups() {
        return [
            {
                id: 'group_1',
                name: 'Grupo Alpha',
                description: 'Cooperativa familiar del barrio norte',
                type: 'family',
                members: 8,
                maxMembers: 10,
                contribution: 500,
                totalSavings: 4000,
                status: 'active',
                isOwner: true,
                isAdmin: true,
                performance: 95,
                trustScore: 95,
                nextMeeting: '2025-02-15',
                location: 'Tegucigalpa Norte',
                frequency: 'monthly',
                created: new Date('2024-11-20'),
                avatar: '👥',
                tags: ['familiar', 'general'],
                coordinatorName: 'María González',
                memberNumber: null, // Es coordinador, no tiene número de miembro
                activeTandas: 2
            },
            {
                id: 'group_2', 
                name: 'Tanda Profesionales',
                description: 'Red de profesionales independientes con metas empresariales',
                type: 'professional',
                members: 6,
                maxMembers: 10,
                contribution: 1200,
                totalSavings: 7200,
                status: 'active',
                isOwner: false,
                isAdmin: false,
                performance: 88,
                trustScore: 92,
                nextMeeting: '2025-02-20',
                location: 'Centro Tegucigalpa',
                frequency: 'monthly',
                created: new Date('2024-10-15'),
                avatar: '💼',
                tags: ['professional', 'business'],
                coordinatorName: 'Carlos Mendoza',
                memberNumber: 3,
                activeTandas: 1
            },
            {
                id: 'group_3',
                name: 'Emprendedores Unidos',
                description: 'Grupo de emprendedores para financiar proyectos',
                type: 'business',
                members: 5,
                maxMembers: 8,
                contribution: 800,
                totalSavings: 3200,
                status: 'active',
                isOwner: false,
                isAdmin: false,
                performance: 90,
                trustScore: 85,
                nextMeeting: '2025-02-10',
                location: 'Comayagüela',
                frequency: 'bi-weekly',
                created: new Date('2024-12-01'),
                avatar: '🚀',
                tags: ['business', 'startup'],
                coordinatorName: 'Ana Rivera',
                memberNumber: 5,
                activeTandas: 1
            }
        ];
    }
    
    getMockTandas() {
        return [
            {
                id: 'tanda_1',
                name: 'Tanda Familiar',
                groupId: 'group_1',
                groupName: 'Grupo Alpha',
                description: 'Ahorro mensual para emergencias familiares',
                contribution: 1500,
                frequency: 'monthly',
                totalMembers: 8,
                currentRound: 3,
                totalRounds: 8,
                startDate: '2024-10-01',
                endDate: '2025-05-01',
                nextPaymentDate: '2025-02-05',
                status: 'active',
                myPosition: 5,
                myNextTurn: '2025-04-01',
                totalAmount: 12000,
                collectedAmount: 4500,
                isMyTurn: false,
                coordinator: 'María González',
                type: 'standard',
                payments: [
                    { memberId: 1, memberName: 'Juan Pérez', round: 1, amount: 1500, paid: true, date: '2024-10-01' },
                    { memberId: 2, memberName: 'Ana García', round: 1, amount: 1500, paid: true, date: '2024-10-01' },
                    { memberId: 3, memberName: 'Carlos López', round: 1, amount: 1500, paid: true, date: '2024-10-01' },
                    { memberId: 1, memberName: 'Juan Pérez', round: 2, amount: 1500, paid: true, date: '2024-11-01' },
                    { memberId: 2, memberName: 'Ana García', round: 2, amount: 1500, paid: true, date: '2024-11-01' },
                    { memberId: 3, memberName: 'Carlos López', round: 2, amount: 1500, paid: false, date: '2024-11-01' },
                    { memberId: 1, memberName: 'Juan Pérez', round: 3, amount: 1500, paid: true, date: '2025-01-01' },
                    { memberId: 2, memberName: 'Ana García', round: 3, amount: 1500, paid: false, date: '2025-01-01' }
                ]
            },
            {
                id: 'tanda_2',
                name: 'Tanda Profesionales',
                groupId: 'group_2',
                groupName: 'Tanda Profesionales',
                description: 'Red de profesionales para inversión conjunta',
                contribution: 2500,
                frequency: 'monthly',
                totalMembers: 6,
                currentRound: 2,
                totalRounds: 6,
                startDate: '2024-12-01',
                endDate: '2025-05-01',
                nextPaymentDate: '2025-02-01',
                status: 'active',
                myPosition: 3,
                myNextTurn: '2025-03-01',
                totalAmount: 15000,
                collectedAmount: 5000,
                isMyTurn: false,
                coordinator: 'Roberto Martínez',
                type: 'business',
                payments: [
                    { memberId: 1, memberName: 'Roberto Martínez', round: 1, amount: 2500, paid: true, date: '2024-12-01' },
                    { memberId: 2, memberName: 'Laura Sánchez', round: 1, amount: 2500, paid: true, date: '2024-12-01' },
                    { memberId: 1, memberName: 'Roberto Martínez', round: 2, amount: 2500, paid: true, date: '2025-01-01' },
                    { memberId: 2, memberName: 'Laura Sánchez', round: 2, amount: 2500, paid: false, date: '2025-01-01' }
                ]
            },
            {
                id: 'tanda_3',
                name: 'Ahorro Vacaciones',
                groupId: 'group_3',
                groupName: 'Amigos de la Universidad',
                description: 'Fondo conjunto para vacaciones de verano',
                contribution: 1000,
                frequency: 'monthly',
                totalMembers: 5,
                currentRound: 1,
                totalRounds: 5,
                startDate: '2025-01-15',
                endDate: '2025-05-15',
                nextPaymentDate: '2025-02-15',
                status: 'active',
                myPosition: 4,
                myNextTurn: '2025-04-15',
                totalAmount: 5000,
                collectedAmount: 1000,
                isMyTurn: false,
                coordinator: 'Sandra Morales',
                type: 'leisure',
                payments: [
                    { memberId: 1, memberName: 'Sandra Morales', round: 1, amount: 1000, paid: true, date: '2025-01-15' },
                    { memberId: 2, memberName: 'Miguel Rivera', round: 1, amount: 1000, paid: false, date: '2025-01-15' }
                ]
            }
        ];
    }
    
    loadActivitiesData() {
        const savedActivities = localStorage.getItem('latanda_activities_data');
        if (savedActivities) {
            return JSON.parse(savedActivities);
        }
        
        const defaultActivities = this.getRecentActivities();
        this.saveActivitiesData(defaultActivities);
        return defaultActivities;
    }
    
    saveActivitiesData(activities) {
        localStorage.setItem('latanda_activities_data', JSON.stringify(activities));
    }
    
    getRecentActivities() {
        return [
            {
                id: 'activity_1',
                type: 'payment_received',
                title: 'Pago Recibido',
                description: 'Has recibido L. 2,500 de la tanda "Profesionales TI"',
                amount: 2500,
                icon: 'dollar-sign',
                timestamp: Date.now() - 1000 * 60 * 30, // 30 minutos ago
                status: 'success',
                groupName: 'Tanda Profesionales',
                tandaName: 'Profesionales TI'
            },
            {
                id: 'activity_2',
                type: 'payment_sent',
                title: 'Contribución Enviada',
                description: 'Contribución de L. 1,500 enviada a "Tanda Familiar"',
                amount: 1500,
                icon: 'arrow-up',
                timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 horas ago
                status: 'success',
                groupName: 'Grupo Alpha',
                tandaName: 'Tanda Familiar'
            },
            {
                id: 'activity_3',
                type: 'group_joined',
                title: 'Nuevo Grupo',
                description: 'Te has unido al grupo "Cooperativa Norte"',
                amount: null,
                icon: 'user-plus',
                timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 día ago
                status: 'info',
                groupName: 'Cooperativa Norte',
                tandaName: null
            },
            {
                id: 'activity_4',
                type: 'reminder',
                title: 'Recordatorio de Pago',
                description: 'Tu contribución de L. 1,000 vence mañana',
                amount: 1000,
                icon: 'clock',
                timestamp: Date.now() - 1000 * 60 * 60 * 6, // 6 horas ago
                status: 'warning',
                groupName: 'Amigos Universidad',
                tandaName: 'Ahorro Vacaciones'
            },
            {
                id: 'activity_5',
                type: 'tanda_completed',
                title: 'Tanda Completada',
                description: 'La tanda "Emergencias 2024" ha sido completada exitosamente',
                amount: 8000,
                icon: 'check-circle',
                timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 días ago
                status: 'success',
                groupName: 'Grupo Familiar',
                tandaName: 'Emergencias 2024'
            },
            {
                id: 'activity_6',
                type: 'invitation_received',
                title: 'Nueva Invitación',
                description: 'Has sido invitado a unirte a "Empresarios Locales"',
                amount: null,
                icon: 'envelope',
                timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 días ago
                status: 'info',
                groupName: 'Empresarios Locales',
                tandaName: null
            },
            {
                id: 'activity_7',
                type: 'achievement',
                title: 'Logro Desbloqueado',
                description: 'Has alcanzado 6 meses consecutivos de pagos puntuales',
                amount: null,
                icon: 'trophy',
                timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 semana ago
                status: 'success',
                groupName: null,
                tandaName: null
            },
            {
                id: 'activity_8',
                type: 'system_update',
                title: 'Actualización del Sistema',
                description: 'Nueva versión disponible con mejoras de seguridad',
                amount: null,
                icon: 'download',
                timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 días ago
                status: 'info',
                groupName: null,
                tandaName: null
            }
        ];
    }
    
    calculateUserStats() {
        // Calcular valores básicos primero
        const basicStats = {
            totalGroups: this.groups?.length || 0,
            totalTandas: this.tandas?.length || 0,
            totalSavings: this.calculateTotalSavings(),
            activeMatches: this.matches?.length || 0,
            trustScore: this.currentUser?.trustScore || 94,
            completionRate: 0, // Se calculará después
            // Web3 Platform Stats
            liquidityPoolTotal: 0,
            activeWallets: 0,
            contractSuccessRate: 0,
            portfolioAPY: 0,
            portfolioTVL: 0,
            portfolioGrowth: 0
        };

        // Calcular completion rate después de tener stats básicos
        try {
            basicStats.completionRate = this.calculateCompletionRate();
        } catch (error) {
            console.warn('Error calculating completion rate:', error);
            basicStats.completionRate = 98;
        }

        // Calcular Web3 stats que dependen de otros valores
        try {
            basicStats.liquidityPoolTotal = this.calculateLiquidityPool();
            basicStats.activeWallets = this.calculateActiveWallets();
            basicStats.contractSuccessRate = this.calculateContractSuccess();
            basicStats.portfolioAPY = this.calculatePortfolioAPY(basicStats);
            basicStats.portfolioTVL = this.calculatePortfolioTVL();
            basicStats.portfolioGrowth = this.calculatePortfolioGrowth();
        } catch (error) {
            console.warn('Error calculating Web3 stats:', error);
        }

        return basicStats;
    }

    // ================================
    // WEB3 PLATFORM CALCULATIONS
    // ================================
    
    calculateLiquidityPool() {
        // Simulate dynamic liquidity based on groups and tandas
        const basePool = 1700000; // L. 1.7M base (actualizado para coincidir con el display)
        const groupContribution = this.groups.reduce((total, group) => {
            const contribution = parseFloat(group.contribution_amount || group.contribution || 0);
            const members = parseInt(group.member_count || group.participants?.length || 1);
            return total + (contribution * members);
        }, 0);
        const tandaBonus = (this.tandas?.length || 0) * 50000; // Each tanda adds 50K
        const dailyGrowth = Math.floor(Math.random() * 25000); // Realistic daily growth
        
        const total = basePool + groupContribution + tandaBonus + dailyGrowth;
        return Math.max(basePool, total); // Ensure minimum base pool
    }
    
    calculateActiveWallets() {
        // Base users + growth simulation  
        const baseWallets = 4233; // Updated to match display
        const growth = Math.floor(Math.random() * 100 + 14); // Controlled growth
        const groupBonus = this.groups.reduce((total, group) => {
            const members = parseInt(group.member_count || group.participants?.length || 0);
            return total + members;
        }, 0);
        
        const total = baseWallets + growth + groupBonus;
        return Math.max(baseWallets, total);
    }
    
    calculateContractSuccess() {
        // High success rate with slight variation
        const baseRate = 98.2;
        const variation = (Math.random() - 0.5) * 0.6; // ±0.3%
        return Math.min(99.9, Math.max(97.0, baseRate + variation));
    }
    
    calculatePortfolioAPY(stats = null) {
        // Dynamic APY based on performance
        const baseAPY = 22.0;
        const completionRate = stats?.completionRate || this.userStats?.completionRate || 95;
        const performanceBonus = completionRate > 95 ? 2.5 : 0;
        const marketBonus = Math.random() * 3; // Market conditions
        
        return baseAPY + performanceBonus + marketBonus;
    }
    
    calculatePortfolioTVL() {
        // Total Value Locked calculation - Fixed to prevent NaN
        const userTVL = this.calculateTotalSavings() || 0;
        const baseTVL = 214000; // Base TVL aligned with display
        
        // If user has no activity, show base TVL
        if (userTVL === 0 || (this.tandas?.length || 0) === 0) {
            return baseTVL;
        }
        
        const platformMultiplier = 8; // Realistic multiplier
        const bonus = Math.floor(Math.random() * 5000); // Controlled volatility
        
        const calculated = userTVL * platformMultiplier + bonus;
        return Math.max(baseTVL, calculated);
    }
    
    calculatePortfolioGrowth() {
        // Growth percentage based on history - Fixed to prevent NaN
        const baseGrowth = 9.7; // Base growth aligned with display
        const tandaCount = this.tandas?.length || 0;
        const activityBonus = tandaCount * 0.3;
        
        // Safe calculation of trust bonus
        const trustScore = this.currentUser?.trustScore || 85;
        const trustBonus = Math.max(0, (trustScore - 80) * 0.1);
        
        // For users with no tandas, show realistic base growth
        if (tandaCount === 0) {
            return baseGrowth + (Math.random() * 2 - 1); // ±1% variation
        }
        
        const total = baseGrowth + activityBonus + trustBonus;
        return Math.max(0.1, total); // Ensure positive growth
    }
    
    calculateTotalSavings() {
        if (!this.tandas || this.tandas.length === 0) return 24500;
        
        return this.tandas.reduce((total, tanda) => {
            const paidAmount = tanda.payments?.filter(p => p.paid).length || 0;
            return total + (paidAmount * tanda.contribution);
        }, 0);
    }
    
    calculateCompletionRate() {
        // Verificar que tandas esté definido
        if (!this.tandas || this.tandas.length === 0) return 98;
        
        const totalPayments = this.tandas.reduce((total, tanda) => total + (tanda.payments?.length || 0), 0);
        const paidPayments = this.tandas.reduce((total, tanda) => 
            total + (tanda.payments?.filter(p => p.paid).length || 0), 0);
        
        return totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 98;
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
            if (!e.target.closest('.dropdown') && !e.target.closest('.dropdown-menu')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                    const card = menu.closest('.group-card');
                    if (card) card.classList.remove('dropdown-active');
                    
                    // Restaurar el menú a su posición original si fue movido
                    if (menu.dataset.originalParent) {
                        const originalParent = document.getElementById(menu.dataset.originalParent);
                        if (originalParent) {
                            originalParent.appendChild(menu);
                            delete menu.dataset.originalParent;
                            // Resetear estilos inline
                            menu.style.position = '';
                            menu.style.left = '';
                            menu.style.top = '';
                            menu.style.zIndex = '';
                        }
                    }
                });
            }
        });

        // Cerrar dropdowns en scroll/resize para evitar positioning issues
        window.addEventListener('scroll', () => {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
                const card = menu.closest('.group-card');
                if (card) card.classList.remove('dropdown-active');
                
                // Restaurar posición original
                if (menu.dataset.originalParent) {
                    const originalParent = document.getElementById(menu.dataset.originalParent);
                    if (originalParent) {
                        originalParent.appendChild(menu);
                        delete menu.dataset.originalParent;
                        menu.style.position = '';
                        menu.style.left = '';
                        menu.style.top = '';
                        menu.style.zIndex = '';
                    }
                }
            });
        });

        window.addEventListener('resize', () => {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
                const card = menu.closest('.group-card');
                if (card) card.classList.remove('dropdown-active');
                
                // Restaurar posición original
                if (menu.dataset.originalParent) {
                    const originalParent = document.getElementById(menu.dataset.originalParent);
                    if (originalParent) {
                        originalParent.appendChild(menu);
                        delete menu.dataset.originalParent;
                        menu.style.position = '';
                        menu.style.left = '';
                        menu.style.top = '';
                        menu.style.zIndex = '';
                    }
                }
            });
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
                await this.loadGroupsContent(false); // No forzar recarga al cambiar pestaña
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
            // COMENTADO: Este código sobrescribía los grupos creados por el usuario
            // con datos hardcodeados que causaban que se perdieran los grupos reales
            
            /*
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
            */
            
            // Ahora los grupos se cargan desde localStorage en loadStoredGroups()
            console.log('✅ loadGroups() - función comentada para preservar grupos del usuario');
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
        // Actualizar tarjetas de estadísticas principales con animaciones
        this.animateStatCounter('totalGroups', this.userStats.totalGroups);
        this.animateStatCounter('totalTandas', this.userStats.totalTandas);
        this.animateStatValue('totalSavings', this.userStats.totalSavings, 'L. ', true);
        this.animateStatCounter('activeMatches', this.userStats.activeMatches);
        this.animateStatValue('trustScore', this.userStats.trustScore, '', false, '%');
        this.animateStatValue('completionRate', this.userStats.completionRate, '', false, '%');
        
        // Actualizar Web3 Platform Stats con animaciones avanzadas
        this.animateWeb3Stats();
        
        // Actualizar trends basados en datos históricos
        this.updateStatTrends();
        
        // Actualizar tendencias Web3 específicas
        this.updateWeb3Trends();
        
        // Actualizar métricas del protocolo DeFi
        this.updateProtocolStats();
        
        // Actualizar progreso DeFi del usuario
        this.updateDeFiProgress();
        
        // Actualizar métricas del ecosistema DAO
        this.updateDAOMetrics();
    }

    // ================================
    // WEB3 ANIMATIONS SYSTEM
    // ================================
    
    animateWeb3Stats() {
        // Liquidity Pool Total  
        this.animateCounterUp('liquidityPoolTotal', this.userStats.liquidityPoolTotal, {
            duration: 2000,
            prefix: 'L. ',
            format: 'currency',
            decimals: 1,
            suffix: 'M+'
        });
        
        // Active Wallets
        this.animateCounterUp('activeWallets', this.userStats.activeWallets, {
            duration: 1500,
            format: 'number',
            separator: ','
        });
        
        // Contract Success Rate
        this.animateCounterUp('contractSuccess', this.userStats.contractSuccessRate, {
            duration: 1800,
            format: 'percentage',
            decimals: 1,
            suffix: '%'
        });
        
        // Portfolio Stats
        this.animateCounterUp('portfolioAPY', this.userStats.portfolioAPY, {
            duration: 1200,
            prefix: '+',
            suffix: '%',
            decimals: 1
        });
        
        this.animateCounterUp('portfolioTVL', this.userStats.portfolioTVL, {
            duration: 1600,
            prefix: 'L. ',
            format: 'currency',
            decimals: 1,  // Show 1 decimal for better precision
            suffix: 'K'
        });
        
        this.animateCounterUp('portfolioGrowth', this.userStats.portfolioGrowth, {
            duration: 1400,
            prefix: '+',
            suffix: '%',
            decimals: 1
        });
    }
    
    animateCounterUp(elementId, targetValue, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Prevent NaN values and ensure valid numbers
        if (isNaN(targetValue) || !isFinite(targetValue)) {
            console.warn(`Invalid targetValue for ${elementId}:`, targetValue);
            targetValue = 0;
        }
        
        const {
            duration = 2000,
            prefix = '',
            suffix = '',
            decimals = 0,
            format = 'number',
            separator = ','
        } = options;
        
        const startValue = 0;
        const increment = targetValue / (duration / 16); // 60fps
        let currentValue = startValue;
        
        const timer = setInterval(() => {
            currentValue += increment;
            
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            
            let displayValue = currentValue;
            
            // Format the value
            switch (format) {
                case 'currency':
                    if (suffix === 'M+') {
                        displayValue = (currentValue / 1000000).toFixed(decimals);
                    } else if (suffix === 'K') {
                        displayValue = (currentValue / 1000).toFixed(decimals);
                    } else {
                        displayValue = currentValue.toFixed(decimals);
                    }
                    break;
                case 'percentage':
                    displayValue = currentValue.toFixed(decimals);
                    break;
                case 'number':
                default:
                    displayValue = Math.floor(currentValue);
                    if (separator && displayValue >= 1000) {
                        displayValue = displayValue.toLocaleString();
                    }
                    break;
            }
            
            element.textContent = prefix + displayValue + suffix;
            
            // Add pulse effect on significant milestones
            if (Math.floor(currentValue) % Math.floor(targetValue / 4) === 0) {
                element.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 150);
            }
        }, 16);
        
        // Add glowing effect during animation
        element.classList.add('animating');
        setTimeout(() => {
            element.classList.remove('animating');
        }, duration);
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
    
    getCreateGroupFormData() {
        const form = document.getElementById('createGroupForm');
        if (!form) return null;
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
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
        // Verificar que userStats esté inicializado
        if (!this.userStats) {
            this.userStats = {};
        }
        
        // Calcular estadísticas basadas en datos reales
        this.userStats.totalGroups = this.groups ? this.groups.filter(g => g.status === 'active').length : 0;
        this.userStats.totalTandas = this.tandas ? this.tandas.length : 0;
        this.userStats.totalSavings = this.tandas ? this.tandas.reduce((sum, t) => sum + (t.amount * (t.progress / 100)), 0) : 0;
        
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
        // Verificar que groups esté definido
        if (!this.groups) {
            return 0;
        }
        
        // Calcular matches basado en grupos disponibles y criterios de compatibilidad
        const availableGroups = this.groups.filter(g => g.status === 'recruiting');
        const userProfile = this.currentUser;
        
        // Simular matching inteligente basado en ubicación, tipo de grupo, etc.
        let matches = 0;
        availableGroups.forEach(group => {
            if (group.location === userProfile?.location || group.type === 'community') {
                matches++;
            }
        });
        
        // Agregar matches de tandas disponibles
        if (this.tandas) {
            const availableTandas = this.tandas.filter(t => t.status === 'upcoming');
            matches += Math.floor(availableTandas.length * 0.6); // 60% compatibility rate
        }
        
        return Math.max(matches, 3); // Minimum 3 matches for demo
    }

    calculateTrustScore() {
        const completedTandas = this.tandas ? this.tandas.filter(t => t.status === 'completed').length : 0;
        const totalTandas = this.tandas ? this.tandas.length : 0;
        const activeGroups = this.groups ? this.groups.filter(g => g.status === 'active').length : 0;
        
        // Base score on completion rate and active participation
        let baseScore = totalTandas > 0 ? (completedTandas / totalTandas) * 100 : 85;
        
        // Bonus for active participation
        baseScore += Math.min(activeGroups * 2, 10); // Max 10 bonus points
        
        // Penalty simulation for late payments (random factor for demo)
        const latePenalty = Math.random() * 5; // 0-5% penalty
        
        return Math.max(Math.min(Math.round(baseScore - latePenalty), 100), 70);
    }

    calculateCompletionRate() {
        // Verificar que tandas esté definido y sea un array
        if (!this.tandas || !Array.isArray(this.tandas) || this.tandas.length === 0) {
            return 95; // Default high completion rate for new users
        }
        
        const completedTandas = this.tandas.filter(t => t.status === 'completed').length;
        const totalTandas = this.tandas.length;
        
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

    updateWeb3Trends() {
        // Tendencias específicas para las métricas Web3 con valores más realistas
        const web3Trends = {
            liquidity: { current: 15.2, variance: 2.0 },  // +15.2% base
            wallets: { current: 44.8, variance: 5.0 },    // +44.8% base  
            contracts: { current: 0.3, variance: 0.1 }    // +0.3% base (contratos son muy estables)
        };

        // Calcular variaciones realistas
        const liquidityTrend = web3Trends.liquidity.current + (Math.random() - 0.5) * web3Trends.liquidity.variance;
        const walletsTrend = web3Trends.wallets.current + (Math.random() - 0.5) * web3Trends.wallets.variance;
        const contractsTrend = web3Trends.contracts.current + (Math.random() - 0.5) * web3Trends.contracts.variance;

        // Actualizar elementos en el DOM
        this.updateWeb3TrendElement('liquidityTrend', liquidityTrend);
        this.updateWeb3TrendElement('walletsTrend', walletsTrend);  
        this.updateWeb3TrendElement('successTrend', contractsTrend);
    }

    updateWeb3TrendElement(elementId, trendValue) {
        const trendElement = document.getElementById(elementId);
        if (!trendElement) return;

        const isPositive = trendValue >= 0;
        const trendIcon = trendElement.querySelector('i');
        const trendSpan = trendElement.querySelector('span');

        // Actualizar classe del elemento
        trendElement.className = `stat-trend ${isPositive ? 'positive' : 'negative'}`;

        // Actualizar ícono de flecha
        if (trendIcon) {
            trendIcon.className = `fas fa-arrow-${isPositive ? 'up' : 'down'}`;
        }

        // Actualizar valor con formato consistente
        if (trendSpan) {
            trendSpan.textContent = `${isPositive ? '+' : ''}${Math.abs(trendValue).toFixed(1)}%`;
        }
    }

    updateProtocolStats() {
        // Actualizar métricas del protocolo con datos realistas pero dinámicos
        const protocolStats = {
            uptime: { base: 99.7, variance: 0.2 },
            blockTime: { base: 2.1, variance: 0.3 },  
            gasFees: { base: 0.02, variance: 0.01 }
        };

        // Contract Uptime - siempre alta pero con variación mínima
        const uptime = Math.max(99.0, protocolStats.uptime.base + (Math.random() - 0.5) * protocolStats.uptime.variance);
        this.updateProtocolStat('Contract Uptime', `${uptime.toFixed(1)}%`);

        // Block Time - variación realista
        const blockTime = Math.max(1.8, protocolStats.blockTime.base + (Math.random() - 0.5) * protocolStats.blockTime.variance);
        this.updateProtocolStat('Avg Block Time', `${blockTime.toFixed(1)}s`);

        // Gas Fees - variación basada en uso de red
        const networkLoad = (this.groups.length + this.tandas.length) / 100;
        const baseFee = protocolStats.gasFees.base;
        const dynamicFee = baseFee + (networkLoad * 0.005) + (Math.random() - 0.5) * protocolStats.gasFees.variance;
        this.updateProtocolStat('Tarifas de Gas', `L ${Math.max(0.01, dynamicFee).toFixed(2)}`);
    }

    updateProtocolStat(label, value) {
        const protocolStats = document.querySelectorAll('.protocol-stat');
        protocolStats.forEach(stat => {
            const statLabel = stat.querySelector('.stat-label-crypto');
            const statValue = stat.querySelector('.stat-value-crypto');
            if (statLabel && statLabel.textContent.includes(label.split(' ')[0])) {
                statValue.textContent = value;
                // Add update animation
                statValue.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    statValue.style.transform = 'scale(1)';
                }, 200);
            }
        });
    }

    updateDeFiProgress() {
        // Calcular nivel DeFi del usuario basado en métricas reales
        const userLevel = this.calculateUserDeFiLevel();
        const progressData = this.getDeFiLevelData(userLevel);

        // Actualizar display del nivel actual
        const currentLevelSpan = document.querySelector('.current-level');
        if (currentLevelSpan) {
            currentLevelSpan.textContent = `Nivel Actual: ${progressData.icon} ${progressData.name} (${progressData.progressToNext}% al siguiente nivel)`;
        }

        // Actualizar barra de progreso
        const progressBar = document.querySelector('.progress-bar.defi-progress');
        if (progressBar) {
            progressBar.style.width = `${progressData.progressToNext}%`;
        }

        // Actualizar milestones
        this.updateProgressMilestones(userLevel);
    }

    calculateUserDeFiLevel() {
        let score = 0;
        
        // Base score from trust and participation
        score += (this.currentUser.trustScore || 85) * 0.5;
        score += this.groups.length * 15;
        score += this.tandas.length * 10;
        
        // Experience multipliers
        if (this.userStats.totalSavings > 10000) score += 20;
        if (this.userStats.totalSavings > 50000) score += 30;
        if (this.userStats.completionRate > 95) score += 25;
        
        // Activity bonus
        const recentActivity = this.activities.filter(a => 
            new Date() - new Date(a.timestamp) < 30 * 24 * 60 * 60 * 1000 // 30 days
        ).length;
        score += recentActivity * 2;

        // Determine level (1-10)
        if (score >= 250) return 10; // Experto DeFi
        if (score >= 150) return 5;  // Yield Farmer  
        return 1; // Crypto Rookie
    }

    getDeFiLevelData(level) {
        const levelMap = {
            1: { name: 'Principiante', icon: '🌱', progressToNext: Math.random() * 50 + 25 },
            5: { name: 'Yield Farmer', icon: '⚡', progressToNext: Math.random() * 50 + 25 },
            10: { name: 'Experto DeFi', icon: '👑', progressToNext: 100 }
        };
        
        return levelMap[level] || levelMap[1];
    }

    updateProgressMilestones(currentLevel) {
        const milestones = document.querySelectorAll('.milestone');
        milestones.forEach((milestone, index) => {
            const levelNum = index === 0 ? 1 : index === 1 ? 5 : 10;
            milestone.className = 'milestone';
            
            if (levelNum <= currentLevel) {
                milestone.classList.add('achieved');
            } else if (levelNum === currentLevel) {
                milestone.classList.add('current');
            }
        });
    }

    updateDAOMetrics() {
        // Calcular métricas del ecosistema DAO dinámicamente
        const totalTransactions = this.activities.length + this.tandas.length * 10;
        const networkHealth = Math.max(90, 94.7 + (Math.random() - 0.5) * 2);
        
        // Protocol security increase per transaction
        const securityIncrease = Math.max(0.1, 0.2 + (Math.random() - 0.5) * 0.1);
        this.updateDAOMetric('Protocol security', `+${securityIncrease.toFixed(1)}%`);
        
        // Network Health
        this.updateDAOMetric('Network Health', `${networkHealth.toFixed(1)}%`);
        
        // Liquidity multiplier based on network activity
        const liquidityMultiplier = Math.max(2, 3 + (this.groups.length / 10));
        this.updateDAOMetric('Liquidity multiplier', `${liquidityMultiplier.toFixed(1)}x`);
        
        // Update progress rings
        this.updateProgressRing('.progress-ring', networkHealth);
    }

    updateDAOMetric(label, value) {
        const daoMetrics = document.querySelectorAll('.dao-metric');
        daoMetrics.forEach(metric => {
            const metricLabel = metric.querySelector('.metric-label');
            const metricValue = metric.querySelector('.metric-value');
            if (metricLabel && metricLabel.textContent.includes(label.split(' ')[0])) {
                metricValue.textContent = value;
                // Add glow effect for updates
                metricValue.style.textShadow = '0 0 10px currentColor';
                setTimeout(() => {
                    metricValue.style.textShadow = '';
                }, 1000);
            }
        });
    }

    updateProgressRing(selector, percentage) {
        const progressRing = document.querySelector(selector);
        if (progressRing) {
            const progressValue = progressRing.querySelector('.progress-value');
            if (progressValue) {
                progressValue.textContent = `${percentage.toFixed(1)}%`;
            }
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
        
        activityList.innerHTML = limitedActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${activity.icon} ${activity.iconColor}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${activity.title}</strong> ${activity.description}</p>
                    <span class="activity-time">${activity.timeAgo}</span>
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
            if (group.status === 'active' && group.lastActivity) {
                activities.push({
                    id: `group_${group.id}`,
                    type: 'group',
                    title: 'Actividad de Grupo',
                    description: `en "${group.name}"`,
                    icon: 'users',
                    iconColor: 'text-tanda-cyan',
                    timestamp: new Date(group.lastActivity),
                    timeAgo: this.getTimeAgo(new Date(group.lastActivity))
                });
            }
        });
        
        // Actividades de tandas
        this.tandas.forEach(tanda => {
            // Pagos recibidos
            if (tanda.status === 'active' && tanda.lastPayment) {
                activities.push({
                    id: `payment_${tanda.id}`,
                    type: 'payment',
                    title: 'Pago recibido',
                    description: `de L. ${(tanda.amount || 1500).toLocaleString()} en "${tanda.name}"`,
                    icon: 'money-bill-wave',
                    iconColor: 'text-green-400',
                    timestamp: new Date(tanda.lastPayment),
                    timeAgo: this.getTimeAgo(new Date(tanda.lastPayment))
                });
            }
            
            // Tandas completadas
            if (tanda.status === 'completed') {
                activities.push({
                    id: `completed_${tanda.id}`,
                    type: 'completion',
                    title: 'Tanda completada',
                    description: `exitosamente en "${tanda.name}"`,
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
        console.log('🔍 Opening quick search...');
        
        // Crear overlay de búsqueda en lugar de modal
        this.createQuickSearchOverlay();
    }

    createQuickSearchOverlay() {
        // Verificar si ya existe
        if (document.querySelector('.quick-search-overlay')) {
            return;
        }

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'quick-search-overlay';
        overlay.innerHTML = `
            <div class="search-container">
                <div class="search-header">
                    <div class="search-input-container">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" 
                               class="search-input" 
                               placeholder="Buscar grupos, tandas, miembros..." 
                               autofocus>
                        <button class="search-close" onclick="advancedGroupsSystem.closeQuickSearch()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="search-results" id="search-results">
                    <div class="search-suggestions">
                        <div class="suggestion-category">
                            <h4><i class="fas fa-clock"></i> Búsquedas recientes</h4>
                            <div class="suggestion-items">
                                <div class="suggestion-item" onclick="advancedGroupsSystem.performSearch('Grupo Alpha')">
                                    <i class="fas fa-users"></i>
                                    <span>Grupo Alpha</span>
                                </div>
                                <div class="suggestion-item" onclick="advancedGroupsSystem.performSearch('Tanda Familiar')">
                                    <i class="fas fa-sync-alt"></i>
                                    <span>Tanda Familiar</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="suggestion-category">
                            <h4><i class="fas fa-fire"></i> Populares</h4>
                            <div class="suggestion-items">
                                <div class="suggestion-item" onclick="advancedGroupsSystem.performSearch('grupos activos')">
                                    <i class="fas fa-chart-line"></i>
                                    <span>Grupos activos</span>
                                </div>
                                <div class="suggestion-item" onclick="advancedGroupsSystem.performSearch('tandas completadas')">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Tandas completadas</span>
                                </div>
                                <div class="suggestion-item" onclick="advancedGroupsSystem.performSearch('pagos pendientes')">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span>Pagos pendientes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar al body
        document.body.appendChild(overlay);

        // Animar entrada
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        // Configurar búsqueda en tiempo real
        const searchInput = overlay.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.performRealTimeSearch(e.target.value);
        });

        // Cerrar con Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeQuickSearch();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    closeQuickSearch() {
        const overlay = document.querySelector('.quick-search-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }

    performRealTimeSearch(query) {
        if (!query.trim()) {
            // Mostrar sugerencias por defecto
            return;
        }

        const resultsContainer = document.getElementById('search-results');
        
        // Simular búsqueda
        const results = this.searchContent(query);
        
        resultsContainer.innerHTML = `
            <div class="search-results-list">
                <h4><i class="fas fa-search"></i> Resultados para "${query}"</h4>
                ${results.length > 0 ? 
                    results.map(result => `
                        <div class="search-result-item" onclick="advancedGroupsSystem.openSearchResult('${result.type}', '${result.id}')">
                            <div class="result-icon">
                                <i class="fas fa-${result.icon}"></i>
                            </div>
                            <div class="result-content">
                                <h5>${result.title}</h5>
                                <p>${result.description}</p>
                                <span class="result-type">${result.type}</span>
                            </div>
                        </div>
                    `).join('') 
                    : '<div class="no-results"><i class="fas fa-search"></i><p>No se encontraron resultados</p></div>'
                }
            </div>
        `;
    }

    searchContent(query) {
        const allContent = [
            { id: 'group_1', type: 'Grupo', title: 'Grupo Alpha', description: 'Cooperativa familiar del barrio norte', icon: 'users' },
            { id: 'group_2', type: 'Grupo', title: 'Tanda Profesionales', description: 'Red profesional de emprendedores', icon: 'users' },
            { id: 'tanda_1', type: 'Tanda', title: 'Tanda Familiar', description: 'Tanda mensual de L. 1,500', icon: 'sync-alt' },
            { id: 'user_1', type: 'Miembro', title: 'Carlos López', description: 'Miembro activo desde 2024', icon: 'user' },
        ];

        return allContent.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    performSearch(query) {
        console.log('🔍 Performing search for:', query);
        this.closeQuickSearch();
        this.showNotification('info', `Buscando: ${query}`);
    }

    openSearchResult(type, id) {
        this.closeQuickSearch();
        
        if (type === 'Grupo') {
            this.switchTab('groups');
            setTimeout(() => this.viewGroupDetails(id), 300);
        } else if (type === 'Tanda') {
            this.switchTab('tandas');
        } else if (type === 'Miembro') {
            this.viewMemberProfile(`${id}_member_0`, 'group_1');
        }
    }

    showQuickSearchModal() {
        // Función original como modal (backup)
        const modal = this.createModal('quick-search', '🔍 Búsqueda Rápida', `
            <div class="quick-search-container">
                <div class="search-input-container">
                    <input type="text" id="quickSearchInput" placeholder="Buscar grupos, tandas, miembros..." class="search-input" autofocus>
                    <div class="search-suggestions" id="searchSuggestions"></div>
                </div>
                
                <div class="search-filters">
                    <button class="search-filter-btn active" data-filter="all">
                        <i class="fas fa-globe"></i> Todo
                    </button>
                    <button class="search-filter-btn" data-filter="groups">
                        <i class="fas fa-users"></i> Grupos
                    </button>
                    <button class="search-filter-btn" data-filter="tandas">
                        <i class="fas fa-sync-alt"></i> Tandas
                    </button>
                    <button class="search-filter-btn" data-filter="members">
                        <i class="fas fa-user"></i> Miembros
                    </button>
                </div>
                
                <div class="recent-searches">
                    <h4><i class="fas fa-history"></i> Búsquedas Recientes</h4>
                    <div class="recent-search-list">
                        <div class="recent-search-item">Cooperativa Norte</div>
                        <div class="recent-search-item">Tanda Profesionales</div>
                        <div class="recent-search-item">Carlos Hernández</div>
                    </div>
                </div>
            </div>
        `, true);
        
        // Add search functionality
        setTimeout(() => {
            const searchInput = document.getElementById('quickSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.performQuickSearch(e.target.value);
                });
            }
        }, 100);
        
        modal.style.maxWidth = '600px';
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
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
        console.log('🌙 Toggling theme...');
        const isDarkMode = document.body.classList.toggle('dark-theme');
        
        // Update theme icon
        const themeBtn = document.querySelector('.header-action-btn i.fa-moon, .header-action-btn i.fa-sun');
        if (themeBtn) {
            themeBtn.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        
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
        if (!this.currentUser.preferences) {
            this.currentUser.preferences = {};
        }
        this.currentUser.preferences.theme = isDarkMode ? 'dark' : 'light';
        this.saveUserData(this.currentUser);
        
        // Also save in localStorage for immediate access
        localStorage.setItem('theme-preference', isDarkMode ? 'dark' : 'light');
        
        this.showNotification('success', `Tema ${isDarkMode ? 'oscuro' : 'claro'} activado`);
    }

    showUserMenu() {
        console.log('👤 Opening user menu...');
        
        // Verificar si ya hay un dropdown abierto
        const existingDropdown = document.querySelector('.user-dropdown-floating');
        if (existingDropdown) {
            this.closeUserDropdown();
            return;
        }
        
        // Crear dropdown flotante en lugar de modal
        this.createUserDropdown();
    }

    createUserDropdown() {
        // Encontrar el botón de usuario
        const userButton = document.querySelector('.header-action-btn[onclick*="showUserMenu"]');
        if (!userButton) return;

        // Crear el dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown-floating';
        dropdown.id = 'user-dropdown';
        
        dropdown.innerHTML = `
            <div class="user-dropdown-header">
                <div class="user-avatar-large">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-info">
                    <h3>${this.currentUser.name}</h3>
                    <p>${this.currentUser.email}</p>
                    <div class="user-status">
                        <span class="status-dot active"></span>
                        En línea
                    </div>
                </div>
            </div>
            
            <div class="user-dropdown-content">
                <div class="user-stats-mini">
                    <div class="stat-mini">
                        <span class="stat-number">${this.userStats.totalGroups}</span>
                        <span class="stat-label">Grupos</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-number">${this.userStats.trustScore}%</span>
                        <span class="stat-label">Confianza</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-number">L. ${this.formatNumber(this.userStats.totalSavings)}</span>
                        <span class="stat-label">Ahorros</span>
                    </div>
                </div>
                
                <div class="user-dropdown-divider"></div>
                
                <div class="user-menu-options">
                    <a href="#" onclick="advancedGroupsSystem.showProfile()" class="user-menu-item">
                        <i class="fas fa-user"></i>
                        <span>Ver Perfil</span>
                    </a>
                    <a href="#" onclick="advancedGroupsSystem.editProfile()" class="user-menu-item">
                        <i class="fas fa-edit"></i>
                        <span>Editar Perfil</span>
                    </a>
                    <a href="#" onclick="advancedGroupsSystem.viewSettings()" class="user-menu-item">
                        <i class="fas fa-cog"></i>
                        <span>Configuración</span>
                    </a>
                    <a href="#" onclick="advancedGroupsSystem.viewSecuritySettings()" class="user-menu-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>Seguridad</span>
                    </a>
                    <a href="#" onclick="advancedGroupsSystem.viewNotificationSettings()" class="user-menu-item">
                        <i class="fas fa-bell"></i>
                        <span>Notificaciones</span>
                    </a>
                    <a href="#" onclick="advancedGroupsSystem.viewHelpCenter()" class="user-menu-item">
                        <i class="fas fa-question-circle"></i>
                        <span>Centro de Ayuda</span>
                    </a>
                </div>
                
                <div class="user-dropdown-divider"></div>
                
                <div class="user-menu-options">
                    <a href="#" onclick="advancedGroupsSystem.switchAccount()" class="user-menu-item">
                        <i class="fas fa-users"></i>
                        <span>Cambiar Cuenta</span>
                    </a>
                    <a href="#" onclick="advancedGroupsSystem.logout()" class="user-menu-item danger">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Cerrar Sesión</span>
                    </a>
                </div>
            </div>
        `;
        
        // Obtener posición del botón
        const buttonRect = userButton.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calcular posición óptima
        const dropdownWidth = 320;
        const dropdownHeight = 500;
        
        const showAbove = buttonRect.bottom + dropdownHeight > viewportHeight;
        const showLeft = buttonRect.right - dropdownWidth < 0;
        
        const topPosition = showAbove 
            ? buttonRect.top - dropdownHeight - 10 
            : buttonRect.bottom + 10;
            
        const leftPosition = showLeft 
            ? buttonRect.left 
            : buttonRect.right - dropdownWidth;
        
        // Agregar al body y posicionar
        document.body.appendChild(dropdown);
        
        dropdown.style.cssText = `
            position: fixed !important;
            top: ${Math.max(10, topPosition)}px !important;
            left: ${Math.max(10, Math.min(leftPosition, viewportWidth - dropdownWidth - 10))}px !important;
            z-index: 999999 !important;
            width: ${dropdownWidth}px !important;
            max-height: ${Math.min(dropdownHeight, viewportHeight - 20)}px !important;
            background: rgba(15, 23, 42, 0.98) !important;
            border: 2px solid rgba(0, 255, 255, 0.5) !important;
            border-radius: 20px !important;
            box-shadow: 
                0 25px 80px rgba(0, 0, 0, 0.9),
                0 0 0 1px rgba(0, 255, 255, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(24px) saturate(180%) !important;
            overflow-y: auto !important;
            transform: translateZ(0) !important;
            animation: userDropdownSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        
        if (showAbove) {
            dropdown.classList.add('show-above');
        }
        
        // Agregar listener para cerrar al hacer clic fuera
        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target) && !userButton.contains(e.target)) {
                this.closeUserDropdown();
                document.removeEventListener('click', closeDropdown);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 100);
        
        console.log('✅ User dropdown flotante mostrado');
    }

    closeUserDropdown() {
        const dropdown = document.querySelector('.user-dropdown-floating');
        if (dropdown) {
            dropdown.style.animation = 'userDropdownSlideOut 0.2s ease-in forwards';
            setTimeout(() => {
                dropdown.remove();
            }, 200);
        }
    }

    // Funciones adicionales para el dropdown de usuario
    viewSettings() {
        this.closeUserDropdown();
        const modal = this.createModal('settings', '⚙️ Configuración', `
            <div class="settings-container">
                <div class="settings-section">
                    <h3><i class="fas fa-palette"></i> Apariencia</h3>
                    <div class="setting-item">
                        <label>Tema</label>
                        <select class="form-control">
                            <option value="light">Claro</option>
                            <option value="dark">Oscuro</option>
                            <option value="auto">Automático</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Idioma</label>
                        <select class="form-control">
                            <option value="es">Español</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><i class="fas fa-bell"></i> Notificaciones</h3>
                    <div class="setting-item">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" checked>
                            <span class="checkmark"></span>
                            Notificaciones push
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" checked>
                            <span class="checkmark"></span>
                            Recordatorios de pagos
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="checkbox-wrapper">
                            <input type="checkbox">
                            <span class="checkmark"></span>
                            Notificaciones por email
                        </label>
                    </div>
                </div>
            </div>
        `, true);
        
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.saveSettings()">
                <i class="fas fa-save"></i> Guardar
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    }

    saveSettings() {
        this.showNotification('success', 'Configuración guardada exitosamente');
        this.closeModal();
    }

    viewNotificationSettings() {
        this.closeUserDropdown();
        this.showNotification('info', 'Configuración de notificaciones - Próximamente');
    }

    switchAccount() {
        this.closeUserDropdown();
        this.showNotification('info', 'Cambio de cuenta - Próximamente');
    }

    logout() {
        this.closeUserDropdown();
        if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
            this.showNotification('success', 'Sesión cerrada exitosamente');
            // Aquí se podría redirigir a la página de login
            setTimeout(() => {
                window.location.href = 'auth-enhanced.html';
            }, 1500);
        }
    }

    showProfile() {
        this.closeUserDropdown();
        this.showUserProfile();
    }

    showUserProfile() {
        const modal = this.createModal('user-profile', '👤 Mi Perfil', `
            <div class="user-profile-container">
                <div class="profile-header">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-large">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="advancedGroupsSystem.changeProfilePhoto()">
                            <i class="fas fa-camera"></i> Cambiar Foto
                        </button>
                    </div>
                    <div class="profile-info">
                        <h2>${this.currentUser.name}</h2>
                        <p class="profile-email">${this.currentUser.email}</p>
                        <div class="profile-badges">
                            <span class="badge badge-success">Verificado</span>
                            <span class="badge badge-info">Miembro Premium</span>
                        </div>
                    </div>
                </div>

                <div class="profile-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${this.userStats.totalGroups}</span>
                            <span class="stat-label">Grupos</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-sync-alt"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${this.userStats.totalTandas}</span>
                            <span class="stat-label">Tandas</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${this.userStats.trustScore}%</span>
                            <span class="stat-label">Confianza</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">L. ${this.formatNumber(this.userStats.totalSavings)}</span>
                            <span class="stat-label">Ahorros</span>
                        </div>
                    </div>
                </div>

                <div class="profile-details">
                    <div class="profile-section">
                        <h3><i class="fas fa-info-circle"></i> Información Personal</h3>
                        <div class="profile-field">
                            <label>Nombre Completo</label>
                            <span>${this.currentUser.name}</span>
                        </div>
                        <div class="profile-field">
                            <label>Email</label>
                            <span>${this.currentUser.email}</span>
                        </div>
                        <div class="profile-field">
                            <label>Teléfono</label>
                            <span>${this.currentUser.phone || '+504 9999-9999'}</span>
                        </div>
                        <div class="profile-field">
                            <label>Ubicación</label>
                            <span>${this.currentUser.location || 'La Tanda Chain Network'}</span>
                        </div>
                        <div class="profile-field">
                            <label>Miembro desde</label>
                            <span>${this.currentUser.joinDate || '2024-01-15'}</span>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3><i class="fas fa-chart-line"></i> Actividad Reciente</h3>
                        <div class="activity-list">
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-plus-circle"></i>
                                </div>
                                <div class="activity-content">
                                    <p>Se unió al Grupo Alpha</p>
                                    <span class="activity-time">Hace 2 días</span>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-money-bill"></i>
                                </div>
                                <div class="activity-content">
                                    <p>Realizó pago de tanda</p>
                                    <span class="activity-time">Hace 3 días</span>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-star"></i>
                                </div>
                                <div class="activity-content">
                                    <p>Recibió calificación 5 estrellas</p>
                                    <span class="activity-time">Hace 1 semana</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `, true);

        modal.style.maxWidth = '800px';
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.editProfile()">
                <i class="fas fa-edit"></i> Editar Perfil
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
    }

    changeProfilePhoto() {
        this.showNotification('info', 'Función de cambio de foto - Próximamente');
    }

    showUserMenuModal() {
        // Función original como modal (backup)
        const modal = this.createModal('user-menu', '👤 Menú de Usuario', `
            <div class="user-menu-container">
                <div class="user-profile-section">
                    <div class="user-avatar-large">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="user-info">
                        <h3>Usuario Activo</h3>
                        <p>coordinador.principal@latanda.online</p>
                        <div class="user-stats-mini">
                            <span class="mini-stat">3 Grupos</span>
                            <span class="mini-stat">5 Tandas</span>
                            <span class="mini-stat">94% Confianza</span>
                        </div>
                    </div>
                </div>
                
                <div class="user-menu-actions">
                    <button class="user-menu-btn" onclick="advancedGroupsSystem.editProfile()">
                        <i class="fas fa-user-edit"></i> Editar Perfil
                    </button>
                    <button class="user-menu-btn" onclick="advancedGroupsSystem.viewNotificationSettings()">
                        <i class="fas fa-bell"></i> Configurar Notificaciones
                    </button>
                    <button class="user-menu-btn" onclick="advancedGroupsSystem.viewSecuritySettings()">
                        <i class="fas fa-shield-alt"></i> Seguridad y Privacidad
                    </button>
                    <button class="user-menu-btn" onclick="advancedGroupsSystem.viewHelpCenter()">
                        <i class="fas fa-question-circle"></i> Centro de Ayuda
                    </button>
                    <hr class="menu-divider">
                    <button class="user-menu-btn danger" onclick="advancedGroupsSystem.logout()">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </div>
        `, true);
        
        modal.style.maxWidth = '500px';
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
    }

    editProfile() {
        this.closeModal();
        const modal = this.createModal('edit-profile', '👤 Editar Perfil', `
            <div class="profile-edit-container">
                <div class="profile-photo-section">
                    <div class="profile-photo-preview">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <button class="btn btn-outline btn-sm">
                        <i class="fas fa-camera"></i> Cambiar Foto
                    </button>
                </div>
                <form class="profile-form">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" value="Usuario Activo" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" value="coordinador.principal@latanda.online" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" value="+504 9999-9999" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Ubicación</label>
                        <input type="text" value="La Tanda Chain Network" class="form-control">
                    </div>
                </form>
            </div>
        `, true);
        
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.saveProfile()">
                <i class="fas fa-save"></i> Guardar Cambios
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
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
        console.log('🔔 Showing enhanced notifications center...');
        
        // Crear dropdown flotante de notificaciones
        this.createNotificationsDropdown();
    }

    createNotificationsDropdown() {
        // Verificar si ya hay un dropdown abierto
        const existingDropdown = document.querySelector('.notifications-dropdown-floating');
        if (existingDropdown) {
            this.closeNotificationsDropdown();
            return;
        }

        // Encontrar el botón de notificaciones
        const notificationButton = document.querySelector('.header-action-btn[onclick*="showNotifications"]');
        if (!notificationButton) return;

        const notifications = this.getEnhancedNotifications();
        
        const modal = this.createModal('notifications', '🔔 Centro de Notificaciones', `
            <div class="notifications-center">
                <div class="notification-filters">
                    <button class="notification-filter-btn active" data-filter="all" onclick="advancedGroupsSystem.filterNotifications('all')">
                        <i class="fas fa-bell"></i> Todas (${notifications.length})
                    </button>
                    <button class="notification-filter-btn" data-filter="urgent" onclick="advancedGroupsSystem.filterNotifications('urgent')">
                        <i class="fas fa-exclamation-triangle"></i> Urgentes
                    </button>
                    <button class="notification-filter-btn" data-filter="payments" onclick="advancedGroupsSystem.filterNotifications('payments')">
                        <i class="fas fa-money-bill"></i> Pagos
                    </button>
                    <button class="notification-filter-btn" data-filter="groups" onclick="advancedGroupsSystem.filterNotifications('groups')">
                        <i class="fas fa-users"></i> Grupos
                    </button>
                </div>
                
                <div class="notifications-settings">
                    <button class="btn btn-sm btn-outline" onclick="advancedGroupsSystem.configureNotifications()">
                        <i class="fas fa-cog"></i> Configurar
                    </button>
                </div>
                
                <div class="notifications-list" id="notificationsList">
                    ${this.renderNotificationsList(notifications)}
                </div>
            </div>
        `, true);
        
        modal.style.maxWidth = '700px';
        modal.style.width = '95%';
        
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-warning" onclick="advancedGroupsSystem.markAllAsRead()">
                <i class="fas fa-check-double"></i> Marcar Todo Leído
            </button>
            <button class="btn btn-info" onclick="advancedGroupsSystem.exportNotifications()">
                <i class="fas fa-download"></i> Exportar
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
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
            setTimeout(() => {
                notificationElement.remove();
                this.updateNotificationCount();
            }, 300);
        }
    }

    updateNotificationCount() {
        const unreadNotifications = this.getEnhancedNotifications().filter(n => !n.isRead);
        const notificationDot = document.querySelector('.notification-dot');
        
        if (notificationDot) {
            if (unreadNotifications.length > 0) {
                notificationDot.textContent = unreadNotifications.length;
                notificationDot.style.display = 'flex';
            } else {
                notificationDot.style.display = 'none';
            }
        }
    }

    markAllAsRead() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
        });
        this.updateNotificationCount();
        this.showNotification('success', 'Todas las notificaciones marcadas como leídas');
    }

    configureNotifications() {
        this.closeModal();
        
        const modal = this.createModal('notification-settings', '⚙️ Configuración de Notificaciones', `
            <div class="notification-settings-container">
                <div class="setting-group">
                    <h4><i class="fas fa-bell"></i> Preferencias de Notificación</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" checked> Notificaciones de pagos pendientes
                        </label>
                        <span class="setting-description">Recibir alertas cuando tengas pagos vencidos</span>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" checked> Invitaciones a grupos
                        </label>
                        <span class="setting-description">Notificar cuando te inviten a un nuevo grupo</span>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" checked> Actualizaciones del sistema
                        </label>
                        <span class="setting-description">Informar sobre nuevas funcionalidades</span>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox"> Notificaciones por email
                        </label>
                        <span class="setting-description">Enviar resumen diario por correo electrónico</span>
                    </div>
                </div>
                
                <div class="setting-group">
                    <h4><i class="fas fa-clock"></i> Horarios de Notificación</h4>
                    <div class="time-settings">
                        <div class="time-setting">
                            <label>Hora de inicio:</label>
                            <input type="time" value="08:00">
                        </div>
                        <div class="time-setting">
                            <label>Hora de fin:</label>
                            <input type="time" value="22:00">
                        </div>
                    </div>
                </div>
                
                <div class="setting-group">
                    <h4><i class="fas fa-volume-up"></i> Sonido y Vibración</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" checked> Sonido de notificación
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" checked> Vibración (móvil)
                        </label>
                    </div>
                </div>
            </div>
        `, true);
        
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-outline" onclick="advancedGroupsSystem.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="advancedGroupsSystem.saveNotificationSettings()">Guardar Configuración</button>
        `;
    }
    
    saveNotificationSettings() {
        this.closeModal();
        this.showNotification('success', 'Configuración de notificaciones guardada correctamente');
    }

    simulateRealTimeNotifications() {
        // Simulate new notifications arriving every 30 seconds for demonstration
        setInterval(() => {
            const randomNotifications = [
                {
                    id: `new_payment_${Date.now()}`,
                    type: 'payment',
                    category: 'payments',
                    priority: 'high',
                    title: 'Nuevo Pago Recibido',
                    message: 'Has recibido L. 2,000 de tu tanda "Profesionales TI"',
                    time: 'Ahora',
                    isRead: false
                },
                {
                    id: `new_invitation_${Date.now()}`,
                    type: 'invitation',
                    category: 'groups',
                    priority: 'medium',
                    title: 'Nueva Solicitud',
                    message: 'María González quiere unirse a tu grupo "Ahorro Familiar"',
                    time: 'Hace 1 minuto',
                    isRead: false
                },
                {
                    id: `reminder_${Date.now()}`,
                    type: 'reminder',
                    category: 'urgent',
                    priority: 'high',
                    title: 'Recordatorio de Pago',
                    message: 'Tu contribución de L. 1,500 vence mañana',
                    time: 'Hace 2 minutos',
                    isRead: false
                }
            ];

            // Randomly select a notification to "arrive"
            if (Math.random() > 0.7) { // 30% chance every interval
                const newNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
                this.addNewNotification(newNotification);
                this.updateNotificationCount();
                
                // Show a brief toast notification
                this.showNotification('info', `📧 ${newNotification.title}`, 3000);
                
                // Play notification sound if browser allows
                this.playNotificationSound();
            }
        }, 30000); // Every 30 seconds
    }

    addNewNotification(notification) {
        // In a real app, this would sync with backend
        console.log('📧 Nueva notificación recibida:', notification);
    }

    playNotificationSound() {
        // Create a subtle notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('🔇 Sonido de notificación no disponible');
        }
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
    
    async loadGroupsContent(forceRefresh = false) {
        const groupsList = document.getElementById('groupsList');
        if (!groupsList) return;

        // Solo refrescar desde API si se fuerza o no hay datos
        if (forceRefresh || !this.groups || this.groups.length === 0) {
            console.log('🔄 Refrescando grupos desde API...');
            this.groups = await this.loadGroupsData();
        } else {
            console.log('📋 Usando grupos en cache (evitando recarga automática)');
        }
        
        // Agregar controles de filtros y búsqueda
        this.addGroupsControls();
        
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
        
        groupsList.innerHTML = filteredGroups.map(group => `
            <div class="group-card enhanced" id="group-card-${group.id}" data-group-id="${group.id}">
                <div class="group-card-content">
                    <div class="group-card-header">
                    <div class="group-avatar">
                        <span class="avatar-emoji">${group.avatar}</span>
                        ${group.isOwner ? '<div class="owner-badge"><i class="fas fa-crown"></i></div>' : ''}
                    </div>
                    
                    <div class="group-info-section">
                        <div class="group-title-row">
                            <h3 class="group-name">${group.name}</h3>
                            <div class="group-status status-${group.status}">
                                <span class="status-dot"></span>
                                ${this.getStatusLabel(group.status)}
                            </div>
                        </div>
                        <p class="group-description">${group.description}</p>
                        <div class="group-meta">
                            <span class="group-type"><i class="fas fa-tag"></i> ${this.getGroupTypeLabel(group.type)}</span>
                            <span class="group-location"><i class="fas fa-map-marker-alt"></i> ${group.location}</span>
                            <span class="group-frequency"><i class="fas fa-clock"></i> ${this.getFrequencyLabel(group.frequency)}</span>
                        </div>
                        
                        <div class="group-roles-info">
                            ${group.isOwner ? `
                                <span class="coordinator-badge">
                                    <i class="fas fa-crown"></i> Eres el Coordinador
                                </span>
                            ` : `
                                <span class="member-info">
                                    <i class="fas fa-user"></i> Miembro #${group.memberNumber || Math.floor(Math.random() * 8) + 2}
                                    <span class="coordinator-name">Coordinador: ${group.coordinatorName || 'María González'}</span>
                                </span>
                            `}
                        </div>
                    </div>
                </div>
                
                <div class="group-stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${group.members}/${group.maxMembers}</div>
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
                                <div class="progress-fill" style="width: ${(group.members / group.maxMembers) * 100}%"></div>
                            </div>
                            <span class="progress-text">${Math.round((group.members / group.maxMembers) * 100)}% Completo</span>
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
                        ${(group.tags || []).map(tag => `<span class="tag-item">#${tag}</span>`).join('')}
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
                        <div class="dropdown" id="dropdown-container-${group.id}">
                            <button class="btn btn-ghost btn-sm dropdown-toggle" onclick="advancedGroupsSystem.toggleGroupActions('${group.id}')">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu" id="actions-${group.id}">
                                <a href="#" onclick="advancedGroupsSystem.viewGroupTandasFromGroup('${group.id}')">
                                    <i class="fas fa-sync-alt"></i> Ver Tandas (${this.getGroupTandasCount(group.id)})
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
        console.log('🔍 getFilteredGroups - Total grupos disponibles:', this.groups.length);
        this.groups.forEach(group => console.log(`  - ${group.name} (status: ${group.status}, admin: ${group.admin_id})`));
        
        let filtered = [...this.groups];
        
        // Filtrar por búsqueda
        const searchTerm = document.getElementById('groupsSearch')?.value?.toLowerCase();
        if (searchTerm) {
            console.log('🔍 Aplicando filtro de búsqueda:', searchTerm);
            filtered = filtered.filter(group => 
                group.name.toLowerCase().includes(searchTerm) ||
                group.description.toLowerCase().includes(searchTerm) ||
                (group.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
            );
            console.log('🔍 Después del filtro de búsqueda:', filtered.length, 'grupos');
        }
        
        // Filtrar por estado
        const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter');
        console.log('🔍 Filtro activo de estado:', activeFilter);
        if (activeFilter && activeFilter !== 'all') {
            const beforeCount = filtered.length;
            filtered = filtered.filter(group => group.status === activeFilter);
            console.log(`🔍 Después del filtro de estado (${activeFilter}):`, filtered.length, 'grupos (antes:', beforeCount, ')');
        }
        
        console.log('🔍 Grupos finales a mostrar:', filtered.length);
        filtered.forEach(group => console.log(`  ✅ ${group.name} (isOwner: ${group.isOwner})`));
        
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
        this.loadGroupsContent(false); // No refrescar desde API, solo re-renderizar
    }

    filterGroupsByStatus(status) {
        // Actualizar botón activo
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${status}"]`).classList.add('active');
        
        this.loadGroupsContent(false); // No refrescar desde API, solo re-renderizar
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
                                    <span class="stat-value">${group.members}/${group.maxMembers}</span>
                                </div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-icon">
                                    <i class="fas fa-money-bill-wave"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Contribución ${this.getFrequencyLabel(group.frequency)}</span>
                                    <span class="stat-value">${this.formatCurrency(group.contribution)}</span>
                                </div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-icon">
                                    <i class="fas fa-piggy-bank"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Total Ahorrado</span>
                                    <span class="stat-value">${this.formatCurrency(group.totalSavings)}</span>
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
                        <h4><i class="fas fa-users"></i> Miembros del Grupo (${group.members})</h4>
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
                <i class="fas fa-sync-alt"></i> Ver Tandas (${this.getGroupTandasCount(groupId)})
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
        
        if (!menu) return;

        const isShowing = menu.classList.contains('show');
        
        // Cerrar todos los menús primero y limpiar dropdowns flotantes
        document.querySelectorAll('.dropdown-menu.show').forEach(m => {
            m.classList.remove('show', 'dropdown-floating');
            m.style.display = 'none';
            
            // Si está en el body, devolverlo a su container original
            if (m.parentElement === document.body) {
                const menuId = m.id; // actions-group_1
                const groupIdFromMenu = menuId.replace('actions-', '');
                const originalContainer = document.querySelector(`#dropdown-container-${groupIdFromMenu}`);
                if (originalContainer) {
                    originalContainer.appendChild(m);
                }
            }
        });

        if (!isShowing) {
            // MOVER DROPDOWN FUERA DEL BOX DEL GRUPO
            const container = menu.parentElement;
            const button = container.querySelector('.dropdown-toggle');
            
            // Obtener posición del botón relative a la ventana
            const buttonRect = button.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // Decidir si mostrar arriba o abajo del botón
            const showAbove = buttonRect.bottom + 200 > viewportHeight;
            
            // Mover el dropdown al body para evitar overflow del grupo
            document.body.appendChild(menu);
            
            // Calcular posición exacta
            const menuHeight = 150; // Altura estimada del menu
            const topPosition = showAbove 
                ? buttonRect.top - menuHeight - 10 // Arriba del botón
                : buttonRect.bottom + 5; // Abajo del botón
            
            // Posicionamiento fijo relativo a la ventana
            menu.style.cssText = `
                position: fixed !important;
                top: ${topPosition}px !important;
                left: ${buttonRect.right - 200}px !important;
                right: auto !important;
                z-index: 999999 !important;
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                min-width: 200px !important;
                max-width: 250px !important;
                background: rgba(15, 23, 42, 0.95) !important;
                border: 2px solid rgba(0, 255, 255, 0.4) !important;
                border-radius: 12px !important;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8) !important;
                backdrop-filter: blur(16px) !important;
                transform: none !important;
                margin: 0 !important;
                padding: 8px 0 !important;
            `;
            
            // Agregar clase de posicionamiento
            menu.classList.add('show', 'dropdown-floating');
            if (showAbove) {
                menu.classList.add('show-above');
            }
            
            // Agregar listener para cerrar al hacer clic fuera
            const closeDropdown = (e) => {
                if (!menu.contains(e.target) && !button.contains(e.target)) {
                    menu.classList.remove('show', 'dropdown-floating');
                    menu.style.display = 'none';
                    // Devolver el menu a su container original
                    container.appendChild(menu);
                    document.removeEventListener('click', closeDropdown);
                }
            };
            
            setTimeout(() => {
                document.addEventListener('click', closeDropdown);
            }, 100);
            
            console.log('✅ Dropdown flotante mostrado para grupo:', groupId);
            console.log('📍 Posición:', { 
                top: topPosition, 
                left: buttonRect.right - 200,
                showAbove: showAbove 
            });
        }
    }

    shareGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const shareText = `¡Únete al grupo "${group.name}"! Ahorra L. ${(group.contribution || 0).toLocaleString()} ${this.getFrequencyLabel(group.frequency).toLowerCase()} con ${group.members} miembros. #LaTandaChain`;
        
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

        // Generar datos completos del grupo
        const tandas = this.generateSimpleTandas(group);
        const members = this.generateGroupMembers(group);
        const transactions = this.generateGroupTransactions(group);
        
        const data = {
            // Información básica del grupo
            grupoInfo: {
                id: group.id,
                nombre: group.name,
                descripcion: group.description,
                tipo: group.type,
                ubicacion: group.location,
                frecuencia: group.frequency,
                estado: group.status,
                fechaCreacion: group.createdAt || new Date().toISOString(),
                coordinador: group.isOwner ? 'Usuario Actual' : group.coordinatorName || 'Sin especificar'
            },
            
            // Estadísticas del grupo
            estadisticas: {
                totalMiembros: group.members,
                maximoMiembros: group.maxMembers,
                contribucionPorMiembro: group.contribution,
                totalAhorrado: group.totalSavings,
                rendimiento: group.performance || 0,
                tasaCumplimiento: this.calculateSimpleCompletion(tandas)
            },
            
            // Lista de miembros
            miembros: members,
            
            // Tandas activas
            tandas: tandas,
            
            // Transacciones
            transacciones: transactions,
            
            // Metadatos de exportación
            exportInfo: {
                fechaExportacion: new Date().toISOString(),
                version: '3.0',
                exportadoPor: 'Sistema La Tanda Web3'
            }
        };

        const jsonContent = JSON.stringify(data, null, 2);
        const fileName = `grupo_${group.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(jsonContent, fileName, 'application/json');
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
        const group = this.groups.find(g => g.id === groupId);
        if (!group) {
            this.showNotification('❌ Grupo no encontrado', 'error');
            return;
        }

        // Simular proceso de salida del grupo
        this.showNotification('🔄 Procesando salida del grupo...', 'info');
        
        setTimeout(() => {
            // Validar si hay pagos pendientes
            const tandas = this.generateSimpleTandas(group);
            const hasPendingPayments = tandas.some(tanda => tanda.status === 'active');
            
            if (hasPendingPayments && group.members > 3) {
                this.showNotification('⚠️ Hay tandas activas. Se notificará al coordinador para reorganizar los pagos.', 'warning');
            }
            
            // Crear reporte de salida
            const exitReport = {
                groupId: group.id,
                groupName: group.name,
                exitDate: new Date().toISOString(),
                memberName: 'Usuario Actual',
                totalContributed: group.contribution * (Math.floor(Math.random() * 10) + 3),
                finalBalance: group.contribution * 0.95, // Pequeña retención administrativa
                reason: 'Salida voluntaria'
            };

            // Remover el grupo de la lista
            this.groups = this.groups.filter(g => g.id !== groupId);
            
            // Actualizar interfaz
            this.closeModal();
            this.loadGroupsContent();
            this.updateDashboard();
            
            // Mostrar confirmación con detalles
            this.showDetailedExitConfirmation(exitReport);
            
        }, 1500);
    }

    showDetailedExitConfirmation(exitReport) {
        const modal = this.createModal('exit-confirmation', '✅ Salida Exitosa', `
            <div class="exit-confirmation-container">
                <div class="exit-success-header">
                    <i class="fas fa-check-circle exit-success-icon"></i>
                    <h3>Has salido del grupo exitosamente</h3>
                </div>
                
                <div class="exit-details">
                    <h6>Resumen de tu participación:</h6>
                    <div class="exit-stats">
                        <div class="exit-stat">
                            <span class="exit-label">Grupo:</span>
                            <span class="exit-value">${exitReport.groupName}</span>
                        </div>
                        <div class="exit-stat">
                            <span class="exit-label">Total Contribuido:</span>
                            <span class="exit-value">L. ${exitReport.totalContributed.toLocaleString()}</span>
                        </div>
                        <div class="exit-stat">
                            <span class="exit-label">Balance Final:</span>
                            <span class="exit-value">L. ${exitReport.finalBalance.toLocaleString()}</span>
                        </div>
                        <div class="exit-stat">
                            <span class="exit-label">Fecha de Salida:</span>
                            <span class="exit-value">${new Date(exitReport.exitDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div class="exit-notes">
                    <p><i class="fas fa-info-circle"></i> <strong>Nota:</strong> Tu balance final será transferido a tu wallet en las próximas 24 horas.</p>
                    <p><i class="fas fa-users"></i> El coordinador será notificado para reorganizar las tandas activas.</p>
                </div>
            </div>
        `, true);
        
        setTimeout(() => {
            this.showNotification('💰 Tu balance será transferido en 24 horas', 'info');
        }, 3000);
    }

    // ========================================
    // 🚀 NUEVAS FUNCIONES PARA GRUPOS MEJORADOS
    // ========================================

    quickMessage(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        this.showModal({
            title: `💬 Mensaje Rápido - ${group.name}`,
            content: `
                <div class="quick-message-form">
                    <div class="message-templates">
                        <h5>Plantillas Rápidas:</h5>
                        <div class="template-buttons">
                            <button class="template-btn" onclick="document.getElementById('quickMessage').value='¡Hola a todos! ¿Cómo van con sus ahorros este mes?'">
                                👋 Saludo general
                            </button>
                            <button class="template-btn" onclick="document.getElementById('quickMessage').value='Recordatorio: El pago mensual vence mañana.'">
                                ⏰ Recordatorio de pago
                            </button>
                            <button class="template-btn" onclick="document.getElementById('quickMessage').value='¡Felicidades por alcanzar nuestra meta! 🎉'">
                                🎉 Celebración
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Mensaje:</label>
                        <textarea id="quickMessage" class="form-control" rows="4" placeholder="Escribe tu mensaje aquí..."></textarea>
                    </div>
                    
                    <div class="message-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="sendNotification" checked>
                            <span>Enviar notificación push</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="scheduleMessage">
                            <span>Programar mensaje</span>
                        </label>
                    </div>
                </div>
            `,
            buttons: [
                { text: 'Cancelar', class: 'btn-secondary', onclick: 'advancedGroupsSystem.hideModal()' },
                { text: 'Enviar Mensaje', class: 'btn-primary', onclick: 'advancedGroupsSystem.sendQuickMessage("' + groupId + '")' }
            ]
        });
    }

    sendQuickMessage(groupId) {
        const message = document.getElementById('quickMessage').value;
        if (!message.trim()) {
            this.showNotification('⚠️ Por favor escribe un mensaje', 'warning');
            return;
        }

        // Simular envío
        setTimeout(() => {
            this.hideModal();
            this.showNotification('✅ Mensaje enviado a todos los miembros del grupo', 'success');
        }, 1000);
    }

    quickPayment(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        this.showModal({
            title: `💳 Pago Rápido - ${group.name}`,
            content: `
                <div class="quick-payment-form">
                    <div class="payment-summary">
                        <div class="payment-info">
                            <h5>Contribución mensual:</h5>
                            <span class="amount-large">L. ${group.contribution?.toLocaleString() || 0}</span>
                        </div>
                        <div class="due-date">
                            <span>Vence: 15 de este mes</span>
                        </div>
                    </div>
                    
                    <div class="payment-methods">
                        <h5>Método de pago:</h5>
                        <div class="method-grid">
                            <div class="payment-method" data-method="card">
                                <i class="fas fa-credit-card"></i>
                                <span>Tarjeta de Crédito</span>
                                <div class="method-badge">Rápido</div>
                            </div>
                            <div class="payment-method" data-method="bank">
                                <i class="fas fa-university"></i>
                                <span>Transferencia Bancaria</span>
                                <div class="method-badge">Seguro</div>
                            </div>
                            <div class="payment-method" data-method="wallet">
                                <i class="fas fa-wallet"></i>
                                <span>Wallet Digital</span>
                                <div class="method-badge">Instantáneo</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="payment-note">
                        <label>Nota (opcional):</label>
                        <input type="text" id="paymentNote" class="form-control" placeholder="Pago correspondiente a...">
                    </div>
                </div>
            `,
            buttons: [
                { text: 'Cancelar', class: 'btn-secondary', onclick: 'advancedGroupsSystem.hideModal()' },
                { text: 'Procesar Pago', class: 'btn-primary', onclick: 'advancedGroupsSystem.processQuickPayment("' + groupId + '")' }
            ]
        });
    }

    processQuickPayment(groupId) {
        // Simular procesamiento de pago
        const modal = document.querySelector('.modal-content');
        modal.innerHTML = `
            <div class="payment-processing">
                <div class="processing-animation">
                    <div class="payment-loader"></div>
                </div>
                <h4>Procesando pago...</h4>
                <p>Por favor espera mientras verificamos tu pago</p>
            </div>
        `;
        
        setTimeout(() => {
            this.hideModal();
            this.showNotification('✅ Pago procesado exitosamente', 'success');
            this.loadGroupsContent(); // Actualizar las tarjetas
        }, 3000);
    }

    schedulePayment(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        this.showModal({
            title: `📅 Programar Pago - ${group.name}`,
            content: `
                <div class="schedule-payment-form">
                    <div class="schedule-options">
                        <h5>Programar pago automático:</h5>
                        <div class="frequency-options">
                            <label class="radio-option">
                                <input type="radio" name="frequency" value="monthly" checked>
                                <span>Mensual</span>
                                <div class="option-description">Cada mes en la fecha seleccionada</div>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="frequency" value="biweekly">
                                <span>Quincenal</span>
                                <div class="option-description">Cada 15 días</div>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="frequency" value="weekly">
                                <span>Semanal</span>
                                <div class="option-description">Cada semana</div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="schedule-details">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Fecha de inicio:</label>
                                <input type="date" id="startDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Monto:</label>
                                <input type="number" id="amount" class="form-control" value="${group.contribution || 0}" min="1">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Método de pago predeterminado:</label>
                            <select id="defaultMethod" class="form-control">
                                <option value="card">Tarjeta de crédito ****1234</option>
                                <option value="bank">Cuenta bancaria ****5678</option>
                                <option value="wallet">Wallet digital</option>
                            </select>
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                { text: 'Cancelar', class: 'btn-secondary', onclick: 'advancedGroupsSystem.hideModal()' },
                { text: 'Programar Pago', class: 'btn-primary', onclick: 'advancedGroupsSystem.confirmSchedulePayment("' + groupId + '")' }
            ]
        });
    }

    confirmSchedulePayment(groupId) {
        this.hideModal();
        this.showNotification('✅ Pago automático programado exitosamente', 'success');
    }

    favoriteGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.isFavorite = !group.isFavorite;
            this.showNotification(
                group.isFavorite ? '❤️ Grupo agregado a favoritos' : '💔 Grupo removido de favoritos', 
                'info'
            );
            this.loadGroupsContent(); // Recargar para mostrar cambio visual
        }
    }

    muteGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.isMuted = !group.isMuted;
            this.showNotification(
                group.isMuted ? '🔕 Notificaciones silenciadas' : '🔔 Notificaciones activadas', 
                'info'
            );
        }
    }

    pinGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.isPinned = !group.isPinned;
            this.showNotification(
                group.isPinned ? '📌 Grupo fijado' : '📌 Grupo desfijado', 
                'info'
            );
            this.loadGroupsContent(); // Recargar para mostrar en orden correcto
        }
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
                                de La Tanda Chain
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
                            <span class="value">${data.maxParticipants} ciclos ${this.getFrequencyLabel(data.cycleDuration).toLowerCase()}s</span>
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
                <h4>Términos y Condiciones - La Tanda Chain</h4>
                
                <div class="terms-section">
                    <h5>1. Aceptación de los Términos</h5>
                    <p>Al crear un grupo en La Tanda Chain, aceptas cumplir con estos términos y condiciones.</p>
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
                    <p>Las disputas se resolverán primero a nivel de grupo. Si no se resuelve, se puede escalar al sistema de mediación de La Tanda Chain.</p>
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
            // Validación avanzada pre-creación
            const validationResult = await this.validateGroupCreation(data);
            if (!validationResult.isValid) {
                this.showNotification(`❌ ${validationResult.message}`, 'error');
                return;
            }

            // Mostrar progreso de creación
            this.showCreationProgress();
            
            // Simular análisis de riesgo y compatibilidad
            await this.performRiskAnalysis(data);
            await this.delay(800);
            
            // Generar configuración optimizada
            const optimizedConfig = await this.generateOptimizedConfig(data);
            
            // Preparar datos para la API
            const apiData = {
                name: data.name,
                contribution_amount: parseInt(data.contribution),
                frequency: data.paymentFrequency,
                max_members: parseInt(data.maxParticipants),
                coordinator_id: this.currentUser?.id || 'user_001',
                location: data.location || 'La Tanda Chain Network',
                description: data.description || `Grupo ${data.name} - ${data.paymentFrequency}`,
                category: data.type || 'general'
            };
            
            console.log('🚀 Enviando a API:', apiData);
            console.log('🔧 API Proxy disponible:', !!this.apiProxy);
            console.log('🔧 Métodos API Proxy:', Object.keys(this.apiProxy || {}));
            
            // Crear grupo usando el API Proxy híbrido
            const requestMethod = this.apiProxy.request ? 'request' : 'makeRequest';
            console.log('🔧 Método a usar:', requestMethod);
            
            const result = await this.apiProxy[requestMethod]('/api/registration/groups/create', {
                method: 'POST',
                body: apiData
            });
            
            console.log('📥 Respuesta completa de la API:', result);
            console.log('📥 result.success:', result.success);
            console.log('📥 result.data:', result.data);
            
            if (result.success && result.data && result.data.group) {
                const newGroup = result.data.group;
                console.log('✅ Grupo creado exitosamente en API:', newGroup);
                
                // Agregar propiedades adicionales del frontend
                const enhancedGroup = {
                    ...newGroup,
                    // Mapear campos de la API al formato del frontend
                    id: newGroup.id,
                    members: newGroup.member_count,
                    maxMembers: newGroup.max_members,
                    contribution: newGroup.contribution_amount,
                    totalSavings: newGroup.total_amount_collected,
                    isOwner: true,
                    isAdmin: true,
                    performance: 100,
                    trustScore: 85,
                    created: new Date(newGroup.created_at),
                    avatar: this.getGroupAvatar(newGroup.category),
                    tags: this.generateTags(newGroup.category, newGroup.name),
                    // Propiedades avanzadas del frontend
                    riskLevel: optimizedConfig.riskLevel,
                    expectedROI: optimizedConfig.expectedROI,
                    smartContract: optimizedConfig.contractAddress,
                    autoOptimization: data.autoOptimization || false,
                    notifications: {
                        email: true,
                        sms: data.smsNotifications || false,
                        push: true
                    },
                    security: {
                        multiSigRequired: data.multiSig || false,
                        biometricAuth: data.biometricAuth || false,
                        insuranceEnabled: data.insuranceRequired || false
                    },
                    aiInsights: optimizedConfig.insights
                };
                
                // Actualizar la lista local
                this.groups.push(enhancedGroup);
                this.userStats.totalGroups++;
                
                // Guardar también en localStorage como backup
                this.saveGroupsData(this.groups);
                
                // Crear entrada en historial
                this.addToHistory('group_created', {
                    groupId: newGroup.id,
                    groupName: newGroup.name,
                    timestamp: new Date()
                });

                // Mostrar éxito con detalles
                this.showCreationSuccess(enhancedGroup);
                
                this.closeModal();
                
                console.log('🔄 Cambiando a pestaña groups para mostrar el nuevo grupo...');
                this.switchTab('groups');
                
                // Actualizar la UI con los nuevos datos
                this.updateDashboard();
                
                console.log('🔄 Forzando recarga adicional de grupos después de 1 segundo...');
                setTimeout(() => {
                    this.loadGroupsContent();
                }, 1000);
                
                console.log('✅ Grupo creado con configuración optimizada:', newGroup);
            } else {
                // Error de la API
                const errorMessage = result.data?.error?.message || 'Error desconocido de la API';
                console.error('❌ Error de API al crear grupo:', result);
                this.showNotification(`❌ Error al crear grupo: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('❌ Error creando grupo:', error);
            this.showNotification('❌ Error al crear el grupo: ' + error.message, 'error');
        }
    }

    async validateGroupCreation(data) {
        // Validaciones avanzadas
        if (!data.name || data.name.length < 3) {
            return { isValid: false, message: 'El nombre debe tener al menos 3 caracteres' };
        }

        if (!data.description || data.description.length < 10) {
            return { isValid: false, message: 'La descripción debe ser más detallada' };
        }

        if (parseInt(data.contribution) < 100) {
            return { isValid: false, message: 'La contribución mínima es L. 100' };
        }

        if (parseInt(data.maxParticipants) < 2) {
            return { isValid: false, message: 'Se necesitan al menos 2 participantes' };
        }

        // Verificar nombre duplicado
        const nameExists = this.groups.some(group => 
            group.name.toLowerCase() === data.name.toLowerCase()
        );
        
        if (nameExists) {
            return { isValid: false, message: 'Ya existe un grupo con ese nombre' };
        }

        return { isValid: true };
    }

    async performRiskAnalysis(data) {
        const factors = {
            contribution: parseInt(data.contribution),
            maxParticipants: parseInt(data.maxParticipants),
            type: data.type,
            hasInsurance: data.insuranceRequired,
            frequency: data.paymentFrequency
        };

        // Simulación de análisis de riesgo
        await this.delay(600);
        console.log('🔍 Análisis de riesgo completado:', factors);
    }

    async generateOptimizedConfig(data) {
        // Generar configuración optimizada basada en datos
        const config = {
            riskLevel: this.calculateRiskLevel(data),
            expectedROI: this.calculateExpectedROI(data),
            contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
            insights: this.generateAIInsights(data)
        };

        await this.delay(400);
        return config;
    }

    calculateRiskLevel(data) {
        let risk = 'low';
        const contribution = parseInt(data.contribution);
        const participants = parseInt(data.maxParticipants);

        if (contribution > 5000 || participants > 20) risk = 'medium';
        if (contribution > 10000 || participants > 30) risk = 'high';

        return risk;
    }

    calculateExpectedROI(data) {
        const base = 12; // 12% base APY
        let modifier = 0;

        if (data.type === 'comercial') modifier += 3;
        if (data.insuranceRequired) modifier += 1;
        if (data.paymentFrequency === 'weekly') modifier += 2;

        return (base + modifier + Math.random() * 5).toFixed(1);
    }

    generateAIInsights(data) {
        const insights = [];
        
        if (parseInt(data.contribution) > 2000) {
            insights.push('💡 Contribución alta detectada - considera seguro opcional');
        }
        
        if (data.type === 'familiar') {
            insights.push('👨‍👩‍👧‍👦 Grupos familiares tienen 95% más éxito');
        }
        
        if (data.paymentFrequency === 'weekly') {
            insights.push('⚡ Pagos semanales mejoran liquidez en 40%');
        }

        return insights;
    }

    showCreationProgress() {
        const modal = this.createModal('creation-progress', '🔄 Creando Grupo', `
            <div class="creation-progress-container">
                <div class="progress-steps">
                    <div class="progress-step active">
                        <div class="step-icon">✓</div>
                        <span>Validando datos</span>
                    </div>
                    <div class="progress-step processing">
                        <div class="step-icon">🔍</div>
                        <span>Análisis de riesgo</span>
                    </div>
                    <div class="progress-step">
                        <div class="step-icon">⚙️</div>
                        <span>Optimizando configuración</span>
                    </div>
                    <div class="progress-step">
                        <div class="step-icon">🚀</div>
                        <span>Finalizando</span>
                    </div>
                </div>
                
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 25%; animation: progressAnimation 3s ease-in-out forwards;"></div>
                    </div>
                    <div class="progress-text">Procesando...</div>
                </div>

                <div class="ai-analysis">
                    <div class="analysis-item">
                        <i class="fas fa-brain"></i>
                        <span>IA analizando compatibilidad de miembros...</span>
                    </div>
                    <div class="analysis-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>Evaluando factores de riesgo...</span>
                    </div>
                    <div class="analysis-item">
                        <i class="fas fa-chart-line"></i>
                        <span>Optimizando configuración financiera...</span>
                    </div>
                </div>
            </div>
        `);

        // Simular progreso automático
        setTimeout(() => {
            const steps = modal.querySelectorAll('.progress-step');
            steps[1].classList.add('active');
            steps[1].classList.remove('processing');
            
            if (steps[2]) {
                steps[2].classList.add('processing');
            }
        }, 800);

        setTimeout(() => {
            const steps = modal.querySelectorAll('.progress-step');
            steps[2].classList.add('active');
            steps[2].classList.remove('processing');
            
            if (steps[3]) {
                steps[3].classList.add('processing');
            }
        }, 1600);

        setTimeout(() => {
            const steps = modal.querySelectorAll('.progress-step');
            steps[3].classList.add('active');
            steps[3].classList.remove('processing');
        }, 2400);
    }

    showCreationSuccess(group) {
        const modal = this.createModal('creation-success', '🎉 Grupo Creado Exitosamente', `
            <div class="creation-success-container">
                <div class="success-header">
                    <div class="success-icon">🎉</div>
                    <h2>${group.name}</h2>
                    <p>Tu grupo ha sido creado y está listo para recibir miembros</p>
                </div>

                <div class="group-summary">
                    <div class="summary-item">
                        <span class="label">Tipo:</span>
                        <span class="value">${group.type}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Contribución:</span>
                        <span class="value">L. ${group.contribution.toLocaleString()}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Máximo Miembros:</span>
                        <span class="value">${group.maxMembers}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">ROI Esperado:</span>
                        <span class="value">${group.expectedROI}% APY</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Nivel de Riesgo:</span>
                        <span class="value risk-${group.riskLevel}">${group.riskLevel.toUpperCase()}</span>
                    </div>
                </div>

                <div class="ai-insights-section">
                    <h3>💡 Insights de IA</h3>
                    <div class="insights-list">
                        ${group.aiInsights.map(insight => `
                            <div class="insight-item">
                                ${insight}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="next-steps">
                    <h3>🚀 Próximos Pasos</h3>
                    <div class="steps-list">
                        <div class="step-item">
                            <i class="fas fa-user-plus"></i>
                            <span>Invitar miembros al grupo</span>
                        </div>
                        <div class="step-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Programar primera reunión</span>
                        </div>
                        <div class="step-item">
                            <i class="fas fa-file-contract"></i>
                            <span>Revisar contrato inteligente</span>
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.inviteMembers('${group.id}')">
                        <i class="fas fa-user-plus"></i> Invitar Miembros
                    </button>
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.shareGroup('${group.id}')">
                        <i class="fas fa-share-alt"></i> Compartir
                    </button>
                </div>
            </div>
        `);
    }

    // Funciones auxiliares para creación de grupos
    addToHistory(type, data) {
        if (!this.userHistory) {
            this.userHistory = [];
        }
        
        this.userHistory.unshift({
            type,
            data,
            timestamp: new Date(),
            id: `history_${Date.now()}`
        });

        // Mantener solo los últimos 50 elementos
        if (this.userHistory.length > 50) {
            this.userHistory = this.userHistory.slice(0, 50);
        }

        console.log('📝 Entrada añadida al historial:', { type, data });
    }

    inviteMembers(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const modal = this.createModal('invite-members', `👥 Invitar Miembros - ${group.name}`, `
            <div class="invite-members-container">
                <div class="invite-header">
                    <p>Invita personas de confianza para formar tu grupo cooperativo</p>
                </div>

                <div class="invite-methods">
                    <div class="method-tabs">
                        <button class="method-tab active" onclick="advancedGroupsSystem.switchInviteMethod('contacts')">
                            <i class="fas fa-address-book"></i> Contactos
                        </button>
                        <button class="method-tab" onclick="advancedGroupsSystem.switchInviteMethod('link')">
                            <i class="fas fa-link"></i> Enlace de Invitación
                        </button>
                        <button class="method-tab" onclick="advancedGroupsSystem.switchInviteMethod('qr')">
                            <i class="fas fa-qrcode"></i> Código QR
                        </button>
                    </div>

                    <div class="method-content">
                        <!-- Contactos -->
                        <div class="invite-method active" data-method="contacts">
                            <div class="search-contacts">
                                <input type="text" placeholder="Buscar contactos..." class="form-control" id="contact-search">
                                <i class="fas fa-search"></i>
                            </div>
                            
                            <div class="contacts-list">
                                ${this.generateContactsList()}
                            </div>

                            <div class="manual-invite">
                                <h4>O agregar manualmente:</h4>
                                <div class="manual-form">
                                    <input type="text" placeholder="Nombre completo" class="form-control" id="manual-name">
                                    <input type="email" placeholder="Email" class="form-control" id="manual-email">
                                    <input type="tel" placeholder="Teléfono" class="form-control" id="manual-phone">
                                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.addManualContact()">
                                        <i class="fas fa-plus"></i> Añadir
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Enlace -->
                        <div class="invite-method" data-method="link">
                            <div class="link-generator">
                                <h4>Enlace de Invitación</h4>
                                <p>Comparte este enlace para que las personas se unan directamente</p>
                                
                                <div class="link-options">
                                    <label class="checkbox-option">
                                        <input type="checkbox" id="require-approval" checked>
                                        <span class="checkbox-custom"></span>
                                        <span>Requerir aprobación manual</span>
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" id="link-expiration">
                                        <span class="checkbox-custom"></span>
                                        <span>Enlace con expiración (7 días)</span>
                                    </label>
                                </div>

                                <div class="generated-link">
                                    <input type="text" readonly value="https://latanda.online/join/${groupId}" class="form-control" id="invite-link">
                                    <button class="btn btn-primary" onclick="advancedGroupsSystem.copyInviteLink()">
                                        <i class="fas fa-copy"></i> Copiar
                                    </button>
                                </div>

                                <div class="social-share">
                                    <h5>Compartir en:</h5>
                                    <div class="social-buttons">
                                        <button class="social-btn whatsapp" onclick="advancedGroupsSystem.shareToWhatsApp('${groupId}')">
                                            <i class="fab fa-whatsapp"></i> WhatsApp
                                        </button>
                                        <button class="social-btn telegram" onclick="advancedGroupsSystem.shareToTelegram('${groupId}')">
                                            <i class="fab fa-telegram"></i> Telegram
                                        </button>
                                        <button class="social-btn facebook" onclick="advancedGroupsSystem.shareToFacebook('${groupId}')">
                                            <i class="fab fa-facebook"></i> Facebook
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Código QR -->
                        <div class="invite-method" data-method="qr">
                            <div class="qr-generator">
                                <h4>Código QR</h4>
                                <p>Permite a las personas escanear y unirse instantáneamente</p>
                                
                                <div class="qr-code">
                                    <div class="qr-placeholder">
                                        <i class="fas fa-qrcode"></i>
                                        <p>Código QR del grupo</p>
                                    </div>
                                </div>

                                <div class="qr-actions">
                                    <button class="btn btn-primary" onclick="advancedGroupsSystem.downloadQR('${groupId}')">
                                        <i class="fas fa-download"></i> Descargar QR
                                    </button>
                                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.printQR('${groupId}')">
                                        <i class="fas fa-print"></i> Imprimir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="invite-summary">
                    <h4>Invitaciones Pendientes</h4>
                    <div class="pending-invites" id="pending-invites">
                        <p class="empty-state">No hay invitaciones pendientes</p>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.sendInvitations('${groupId}')">
                        <i class="fas fa-paper-plane"></i> Enviar Invitaciones
                    </button>
                </div>
            </div>
        `);
    }

    generateContactsList() {
        const sampleContacts = [
            { name: 'María González', phone: '+504 9988-7766', email: 'maria@example.com', trusted: true },
            { name: 'Carlos Rodríguez', phone: '+504 8877-6655', email: 'carlos@example.com', trusted: true },
            { name: 'Ana Morales', phone: '+504 7766-5544', email: 'ana@example.com', trusted: false },
            { name: 'Luis Hernández', phone: '+504 6655-4433', email: 'luis@example.com', trusted: true },
            { name: 'Sofia Martínez', phone: '+504 5544-3322', email: 'sofia@example.com', trusted: false }
        ];

        return sampleContacts.map(contact => `
            <div class="contact-item ${contact.trusted ? 'trusted' : ''}">
                <div class="contact-avatar">
                    ${contact.name.charAt(0)}
                </div>
                <div class="contact-info">
                    <div class="contact-name">
                        ${contact.name}
                        ${contact.trusted ? '<i class="fas fa-shield-alt trust-badge" title="Contacto de confianza"></i>' : ''}
                    </div>
                    <div class="contact-details">
                        <span>${contact.phone}</span>
                        <span>${contact.email}</span>
                    </div>
                </div>
                <div class="contact-actions">
                    <label class="checkbox-option">
                        <input type="checkbox" class="contact-checkbox" data-contact='${JSON.stringify(contact)}'>
                        <span class="checkbox-custom"></span>
                    </label>
                </div>
            </div>
        `).join('');
    }

    switchInviteMethod(method) {
        // Actualizar tabs
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.method-tab[onclick*="${method}"]`).classList.add('active');

        // Actualizar contenido
        document.querySelectorAll('.invite-method').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelector(`.invite-method[data-method="${method}"]`).classList.add('active');
    }

    copyInviteLink() {
        const linkInput = document.getElementById('invite-link');
        linkInput.select();
        document.execCommand('copy');
        this.showNotification('📋 Enlace copiado al portapapeles', 'success');
    }

    shareToWhatsApp(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        const message = `¡Te invito a unirte a mi grupo de tandas "${group.name}"! 🤝\n\nContribución: L. ${group.contribution.toLocaleString()}\nMiembros: ${group.maxMembers} máximo\n\nÚnete aquí: https://latanda.online/join/${groupId}`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    shareToTelegram(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        const message = `¡Únete a mi grupo de tandas "${group.name}"! 💰\n\nContribución: L. ${group.contribution.toLocaleString()}\n\nhttps://latanda.online/join/${groupId}`;
        
        const telegramUrl = `https://t.me/share/url?url=https://latanda.online/join/${groupId}&text=${encodeURIComponent(message)}`;
        window.open(telegramUrl, '_blank');
    }

    shareToFacebook(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=https://latanda.online/join/${groupId}`;
        window.open(facebookUrl, '_blank');
    }

    sendInvitations(groupId) {
        const selectedContacts = [];
        document.querySelectorAll('.contact-checkbox:checked').forEach(checkbox => {
            const contact = JSON.parse(checkbox.dataset.contact);
            selectedContacts.push(contact);
        });

        if (selectedContacts.length === 0) {
            this.showNotification('⚠️ Selecciona al menos un contacto', 'warning');
            return;
        }

        // Simular envío de invitaciones
        this.showNotification(`📧 Invitaciones enviadas a ${selectedContacts.length} contactos`, 'success');
        this.closeModal();

        console.log('📧 Invitaciones enviadas:', selectedContacts);
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

    openKYC() {
        console.log('🆔 Iniciando proceso de verificación KYC...');
        
        const kycModalContent = `
            <div class="kyc-verification-modal">
                <div class="kyc-header">
                    <div class="kyc-icon">
                        <i class="fas fa-id-card"></i>
                    </div>
                    <h3>Verificación de Identidad KYC</h3>
                    <p class="kyc-subtitle">Aumenta tu nivel de seguridad y desbloquea funciones avanzadas</p>
                </div>

                <div class="kyc-benefits">
                    <div class="benefit-item">
                        <i class="fas fa-shield-alt text-success"></i>
                        <span>Aumenta tu seguridad al 95%+</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-coins text-warning"></i>
                        <span>Límites de transacción más altos</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-crown text-purple"></i>
                        <span>Acceso a funciones VIP</span>
                    </div>
                </div>

                <div class="kyc-steps">
                    <h4>📋 Documentos Requeridos:</h4>
                    <div class="document-checklist">
                        <div class="document-item">
                            <i class="fas fa-id-badge"></i>
                            <div>
                                <strong>Documento de Identidad</strong>
                                <p>Cédula de identidad o pasaporte válido</p>
                            </div>
                        </div>
                        <div class="document-item">
                            <i class="fas fa-file-invoice"></i>
                            <div>
                                <strong>Comprobante de Domicilio</strong>
                                <p>Recibo de servicios públicos (últimos 3 meses)</p>
                            </div>
                        </div>
                        <div class="document-item">
                            <i class="fas fa-camera"></i>
                            <div>
                                <strong>Selfie con Documento</strong>
                                <p>Foto clara sosteniendo tu documento de identidad</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="kyc-actions">
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.startKYCProcess()">
                        <i class="fas fa-upload"></i> Subir Documentos
                    </button>
                </div>
            </div>
        `;

        this.showModal({
            title: '🆔 Verificación KYC',
            content: kycModalContent,
            size: 'large'
        });
    }

    showAudit() {
        console.log('🔍 Mostrando auditoría de seguridad...');
        
        const auditModalContent = `
            <div class="security-audit-modal">
                <div class="audit-header">
                    <div class="audit-icon">
                        <i class="fas fa-search-dollar"></i>
                    </div>
                    <h3>Auditoría de Seguridad Blockchain</h3>
                    <p class="audit-subtitle">Smart Contracts auditados por firmas de seguridad reconocidas</p>
                </div>

                <div class="audit-results">
                    <div class="audit-score">
                        <div class="score-circle-large">
                            <div class="score-value">98.2%</div>
                            <div class="score-label">Security Score</div>
                        </div>
                    </div>

                    <div class="audit-details">
                        <div class="audit-item passed">
                            <i class="fas fa-check-circle"></i>
                            <div class="audit-info">
                                <strong>Reentrancy Protection</strong>
                                <span class="audit-status">PASSED</span>
                                <p>Contratos protegidos contra ataques de reentrada</p>
                            </div>
                        </div>

                        <div class="audit-item passed">
                            <i class="fas fa-check-circle"></i>
                            <div class="audit-info">
                                <strong>Access Control</strong>
                                <span class="audit-status">PASSED</span>
                                <p>Permisos y roles implementados correctamente</p>
                            </div>
                        </div>

                        <div class="audit-item passed">
                            <i class="fas fa-check-circle"></i>
                            <div class="audit-info">
                                <strong>Integer Overflow</strong>
                                <span class="audit-status">PASSED</span>
                                <p>SafeMath implementado en todas las operaciones</p>
                            </div>
                        </div>

                        <div class="audit-item warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div class="audit-info">
                                <strong>Gas Optimization</strong>
                                <span class="audit-status">MINOR</span>
                                <p>Optimizaciones menores recomendadas</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="audit-firms">
                    <h4>🏛️ Auditado por:</h4>
                    <div class="firms-list">
                        <div class="firm-item">
                            <i class="fas fa-certificate"></i>
                            <span><strong>ConsenSys Diligence</strong> - Smart Contract Audit</span>
                        </div>
                        <div class="firm-item">
                            <i class="fas fa-certificate"></i>
                            <span><strong>OpenZeppelin</strong> - Security Review</span>
                        </div>
                        <div class="firm-item">
                            <i class="fas fa-certificate"></i>
                            <span><strong>Trail of Bits</strong> - Penetration Testing</span>
                        </div>
                    </div>
                </div>

                <div class="audit-actions">
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.downloadAuditReport()">
                        <i class="fas fa-download"></i> Descargar Reporte
                    </button>
                </div>
            </div>
        `;

        this.showModal({
            title: '🔍 Auditoría de Seguridad',
            content: auditModalContent,
            size: 'large'
        });
    }

    startKYCProcess() {
        console.log('📤 Iniciando proceso de subida de documentos KYC...');
        
        // Cerrar modal actual
        this.closeModal();
        
        // Mostrar notificación
        this.showNotification('Redirigiendo a la página de verificación KYC...', 'info');
        
        // Simular redirección al sistema KYC
        setTimeout(() => {
            // En un sistema real, esto redirigiría al módulo KYC
            // window.location.href = 'kyc-registration.html';
            
            // Para el demo, mostramos un modal de confirmación
            const confirmModalContent = `
                <div class="kyc-redirect-modal">
                    <div class="redirect-icon">
                        <i class="fas fa-external-link-alt"></i>
                    </div>
                    <h3>Redirección a KYC</h3>
                    <p>Te redirigiremos al módulo de verificación KYC donde podrás:</p>
                    <ul>
                        <li>📷 Subir fotos de tu documento</li>
                        <li>📄 Cargar comprobante de domicilio</li>
                        <li>🤳 Tomar selfie de verificación</li>
                        <li>⏱️ Completar verificación en 5-10 minutos</li>
                    </ul>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button class="btn btn-primary" onclick="advancedGroupsSystem.redirectToKYC()">
                            <i class="fas fa-arrow-right"></i> Continuar
                        </button>
                    </div>
                </div>
            `;
            
            this.showModal({
                title: '🆔 Verificación KYC',
                content: confirmModalContent,
                size: 'medium'
            });
        }, 1000);
    }

    downloadAuditReport() {
        console.log('📥 Iniciando descarga de reporte de auditoría...');
        
        // Mostrar notificación de descarga
        this.showNotification('Preparando reporte de auditoría para descarga...', 'info');
        
        // Simular descarga de archivo
        setTimeout(() => {
            // En un sistema real, esto descargaría el PDF del reporte
            const reportData = `
REPORTE DE AUDITORÍA DE SEGURIDAD
La Tanda Web3 Smart Contracts
=====================================

📅 Fecha: ${new Date().toLocaleDateString()}
🔒 Score de Seguridad: 98.2%
🏛️ Auditado por: ConsenSys, OpenZeppelin, Trail of Bits

RESULTADOS:
✅ Reentrancy Protection: PASSED
✅ Access Control: PASSED  
✅ Integer Overflow: PASSED
⚠️ Gas Optimization: MINOR ISSUES

DETALLES COMPLETOS:
Para ver el reporte completo, visita:
https://latanda.online/security-audit-report.pdf
            `.trim();
            
            // Crear y descargar archivo de texto
            const blob = new Blob([reportData], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `latanda-security-audit-${new Date().getFullYear()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showNotification('Reporte de auditoría descargado exitosamente', 'success');
            
            // Cerrar modal después de un momento
            setTimeout(() => {
                this.closeModal();
            }, 2000);
        }, 1500);
    }

    redirectToKYC() {
        console.log('🔄 Redirigiendo al módulo KYC...');
        
        // Cerrar modal
        this.closeModal();
        
        // En un sistema real, redirigiría al módulo KYC
        // Por ahora simulamos el proceso
        this.showNotification('Redirigiendo al sistema de verificación KYC...', 'info');
        
        setTimeout(() => {
            // Simular redirección
            if (window.location.pathname.includes('groups-advanced-system')) {
                // Cambiar a la página de KYC si existe
                const kycExists = document.querySelector('a[href*="kyc"]');
                if (kycExists) {
                    window.location.href = 'kyc-registration.html';
                } else {
                    this.showNotification('Módulo KYC próximamente disponible. Sistema en desarrollo.', 'warning');
                }
            }
        }, 1500);
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
            const isShowing = menu.classList.contains('show');
            const toggleButton = menu.previousElementSibling;
            
            // Close other open menus
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                m.classList.remove('show');
                const card = m.closest('.group-card');
                if (card) card.classList.remove('dropdown-active');
            });
            
            if (!isShowing && toggleButton) {
                // Obtener posición del botón para positioning fijo
                const rect = toggleButton.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                
                // Posicionar el menú en coordenadas fijas - ARRIBA Y A LA IZQUIERDA por defecto
                const menuWidth = 180;
                const menuHeight = 150;
                
                // Posición por defecto: justo arriba de los tres puntos
                let left = rect.left + scrollLeft - menuWidth + 30; // Alineado con el botón
                let top = rect.top + scrollTop - menuHeight - 5;    // Justo arriba del botón
                
                // Ajustar si se sale de la pantalla por la izquierda
                if (left < 10) {
                    left = rect.right + scrollLeft + 10;
                }
                
                // Ajustar si se sale de la pantalla por arriba - mover al lado
                if (top < 10) {
                    top = rect.top + scrollTop; // Alineado verticalmente con el botón
                    left = rect.right + scrollLeft + 10; // Al lado derecho del botón
                }
                
                // Último ajuste: si aún se sale por la derecha
                if (left + menuWidth > window.innerWidth + scrollLeft) {
                    left = window.innerWidth + scrollLeft - menuWidth - 10;
                }
                
                // Aplicar posición
                menu.style.left = `${left}px`;
                menu.style.top = `${top}px`;
                
                menu.classList.add('show');
            }
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
        
        // Renderizar la interfaz completa de Gestión de Tandas con debug info
        console.log('🎨 Rendering', filteredTandas.length, 'tandas with V2 design');
        
        tandasList.innerHTML = `
            <!-- Dashboard Header -->
            <div class="tandas-dashboard-header">
                ${groupId ? this.renderGroupFilter(groupId) : this.renderAllTandasHeader()}
                ${this.renderTandasStats(stats)}
                ${this.renderTandasFilters()}
            </div>

            <!-- Tandas Grid V2 -->
            <div class="tandas-grid">
                ${filteredTandas.length > 0 ? 
                    filteredTandas.map((tanda, index) => {
                        console.log(`🃏 Rendering card ${index + 1}:`, tanda.name);
                        return this.renderTandaCard(tanda);
                    }).join('') :
                    this.renderEmptyTandasState(groupId)
                }
            </div>

            <!-- Floating Action Button -->
            <div class="fab-container">
                <button class="fab" onclick="advancedGroupsSystem.showCreateTandaModal()" title="Nueva Tanda">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        
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

    updateTandasBreadcrumb(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Crear o actualizar breadcrumb
        let breadcrumb = document.querySelector('.tandas-breadcrumb');
        if (!breadcrumb) {
            breadcrumb = document.createElement('div');
            breadcrumb.className = 'tandas-breadcrumb';
            const tandasList = document.getElementById('tandasList');
            if (tandasList) {
                tandasList.parentNode.insertBefore(breadcrumb, tandasList);
            }
        }

        breadcrumb.innerHTML = `
            <div class="breadcrumb-container">
                <button class="btn btn-ghost btn-sm" onclick="advancedGroupsSystem.clearTandasFilter()">
                    <i class="fas fa-arrow-left"></i> Todas las Tandas
                </button>
                <span class="breadcrumb-separator">→</span>
                <span class="breadcrumb-current">
                    <i class="fas fa-filter"></i> Tandas de "${group.name}"
                </span>
            </div>
        `;
    }

    clearTandasFilter() {
        // Remover breadcrumb
        const breadcrumb = document.querySelector('.tandas-breadcrumb');
        if (breadcrumb) {
            breadcrumb.remove();
        }
        
        // Recargar todas las tandas
        this.loadTandasContent();
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
        const predictiveData = this.getPredictiveAnalytics();
        const riskMetrics = this.getRiskAnalytics();
        const trendData = this.getTrendAnalytics();

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

                <!-- Advanced Analytics Sections -->
                <div class="advanced-analytics">
                    <!-- Predictive Analytics -->
                    <div class="analytics-section">
                        <div class="section-header">
                            <h3>🔮 Análisis Predictivo</h3>
                            <p>Proyecciones basadas en tu historial financiero</p>
                        </div>
                        <div class="predictive-grid">
                            <div class="prediction-card">
                                <div class="prediction-icon">📈</div>
                                <div class="prediction-content">
                                    <h4>Ahorro Proyectado (6 meses)</h4>
                                    <div class="prediction-value">L. ${predictiveData.sixMonthProjection.toLocaleString()}</div>
                                    <div class="prediction-confidence">Confianza: ${predictiveData.confidence}%</div>
                                    <div class="prediction-trend ${predictiveData.trend}">${predictiveData.trendLabel}</div>
                                </div>
                            </div>
                            <div class="prediction-card">
                                <div class="prediction-icon">🎯</div>
                                <div class="prediction-content">
                                    <h4>Meta Recomendada</h4>
                                    <div class="prediction-value">L. ${predictiveData.recommendedGoal.toLocaleString()}</div>
                                    <div class="prediction-timeline">En ${predictiveData.timeToGoal} meses</div>
                                    <div class="prediction-strategy">Estrategia: ${predictiveData.strategy}</div>
                                </div>
                            </div>
                            <div class="prediction-card">
                                <div class="prediction-icon">⚡</div>
                                <div class="prediction-content">
                                    <h4>Velocidad de Ahorro</h4>
                                    <div class="prediction-value">L. ${predictiveData.savingsRate.toLocaleString()}/mes</div>
                                    <div class="prediction-change ${predictiveData.rateChange > 0 ? 'positive' : 'negative'}">
                                        ${predictiveData.rateChange > 0 ? '+' : ''}${predictiveData.rateChange}% vs promedio
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Risk Analysis -->
                    <div class="analytics-section">
                        <div class="section-header">
                            <h3>⚠️ Análisis de Riesgo</h3>
                            <p>Evaluación de tu perfil de riesgo financiero</p>
                        </div>
                        <div class="risk-assessment">
                            <div class="risk-score-container">
                                <div class="risk-score">
                                    <div class="score-circle">
                                        <div class="score-value">${riskMetrics.overallScore}</div>
                                        <div class="score-max">/100</div>
                                    </div>
                                    <div class="score-label">Puntuación de Riesgo</div>
                                    <div class="score-category ${riskMetrics.riskLevel}">${riskMetrics.riskLabel}</div>
                                </div>
                                <div class="risk-factors">
                                    ${riskMetrics.factors.map(factor => `
                                    <div class="risk-factor">
                                        <div class="factor-header">
                                            <span class="factor-name">${factor.name}</span>
                                            <span class="factor-score ${factor.level}">${factor.score}/10</span>
                                        </div>
                                        <div class="factor-bar">
                                            <div class="factor-progress ${factor.level}" style="width: ${factor.score * 10}%"></div>
                                        </div>
                                        <div class="factor-description">${factor.description}</div>
                                    </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Trend Analysis -->
                    <div class="analytics-section">
                        <div class="section-header">
                            <h3>📊 Análisis de Tendencias</h3>
                            <p>Patrones en tu comportamiento financiero</p>
                        </div>
                        <div class="trends-container">
                            <div class="trend-charts">
                                <div class="trend-chart">
                                    <h4>Participación Mensual</h4>
                                    <div class="mini-chart" id="participationTrend">
                                        ${this.generateTrendChart(trendData.participation, 'participation')}
                                    </div>
                                </div>
                                <div class="trend-chart">
                                    <h4>Frecuencia de Pagos</h4>
                                    <div class="mini-chart" id="paymentTrend">
                                        ${this.generateTrendChart(trendData.payments, 'payments')}
                                    </div>
                                </div>
                                <div class="trend-chart">
                                    <h4>Diversificación</h4>
                                    <div class="mini-chart" id="diversificationTrend">
                                        ${this.generateTrendChart(trendData.diversification, 'diversification')}
                                    </div>
                                </div>
                            </div>
                            <div class="trend-insights">
                                <h4>🔍 Patrones Detectados</h4>
                                <div class="pattern-list">
                                    ${trendData.patterns.map(pattern => `
                                    <div class="pattern-item ${pattern.type}">
                                        <div class="pattern-icon">${pattern.icon}</div>
                                        <div class="pattern-content">
                                            <div class="pattern-title">${pattern.title}</div>
                                            <div class="pattern-description">${pattern.description}</div>
                                            <div class="pattern-impact ${pattern.impact}">${pattern.impactLabel}</div>
                                        </div>
                                    </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Analytics Insights -->
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

    getPredictiveAnalytics() {
        return {
            sixMonthProjection: 45000,
            confidence: 87,
            trend: 'positive',
            trendLabel: 'Tendencia alcista',
            recommendedGoal: 50000,
            timeToGoal: 8,
            strategy: 'Incremento gradual',
            savingsRate: 7500,
            rateChange: 15.3,
            monthlyPredictions: [
                { month: 'Sep 2025', amount: 32000, confidence: 92 },
                { month: 'Oct 2025', amount: 35500, confidence: 89 },
                { month: 'Nov 2025', amount: 39000, confidence: 85 },
                { month: 'Dic 2025', amount: 42500, confidence: 82 },
                { month: 'Ene 2026', amount: 46000, confidence: 78 },
                { month: 'Feb 2026', amount: 49500, confidence: 75 }
            ]
        };
    }

    getRiskAnalytics() {
        return {
            overallScore: 25,
            riskLevel: 'low',
            riskLabel: 'Riesgo Bajo',
            factors: [
                {
                    name: 'Diversificación',
                    score: 8,
                    level: 'excellent',
                    description: 'Excelente diversificación en múltiples grupos'
                },
                {
                    name: 'Historial de Pagos',
                    score: 9,
                    level: 'excellent', 
                    description: '98% de puntualidad en contribuciones'
                },
                {
                    name: 'Liquidez',
                    score: 7,
                    level: 'good',
                    description: 'Buen margen de liquidez disponible'
                },
                {
                    name: 'Concentración',
                    score: 6,
                    level: 'moderate',
                    description: 'Concentración moderada en pocos grupos grandes'
                },
                {
                    name: 'Volatilidad',
                    score: 3,
                    level: 'low',
                    description: 'Baja volatilidad en patrones de ahorro'
                }
            ],
            recommendations: [
                'Considera unirte a 1-2 grupos adicionales para mayor diversificación',
                'Mantén tu excelente historial de pagos puntuales',
                'Evalúa aumentar tu contribución mensual en 10-15%'
            ]
        };
    }

    getTrendAnalytics() {
        return {
            participation: {
                data: [65, 72, 68, 75, 82, 78, 85, 89, 92, 88, 94, 96],
                trend: 'increasing',
                change: 47.7
            },
            payments: {
                data: [88, 92, 85, 94, 97, 89, 96, 98, 95, 99, 97, 100],
                trend: 'stable',
                change: 13.6
            },
            diversification: {
                data: [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8],
                trend: 'increasing',
                change: 166.7
            },
            patterns: [
                {
                    icon: '📈',
                    type: 'positive',
                    title: 'Crecimiento Consistente',
                    description: 'Tu actividad de ahorro ha aumentado 47% en los últimos 12 meses',
                    impact: 'high',
                    impactLabel: 'Alto Impacto'
                },
                {
                    icon: '🎯',
                    type: 'neutral',
                    title: 'Pagos Puntuales',
                    description: 'Mantienes un 97% de puntualidad en tus contribuciones',
                    impact: 'medium',
                    impactLabel: 'Impacto Medio'
                },
                {
                    icon: '🔄',
                    type: 'info',
                    title: 'Diversificación Activa',
                    description: 'Has incrementado tu participación en diferentes tipos de tandas',
                    impact: 'medium',
                    impactLabel: 'Impacto Medio'
                },
                {
                    icon: '📊',
                    type: 'warning',
                    title: 'Oportunidad de Optimización',
                    description: 'Podrías maximizar tus returns participando en tandas de mayor valor',
                    impact: 'low',
                    impactLabel: 'Bajo Impacto'
                }
            ]
        };
    }

    generateTrendChart(data, type) {
        const maxValue = Math.max(...data.data);
        const minValue = Math.min(...data.data);
        const range = maxValue - minValue;
        
        return `
            <div class="trend-chart-container">
                <div class="trend-line">
                    ${data.data.map((value, index) => {
                        const percentage = range === 0 ? 50 : ((value - minValue) / range) * 100;
                        const x = (index / (data.data.length - 1)) * 100;
                        return `<div class="trend-point" style="left: ${x}%; bottom: ${percentage}%" data-value="${value}"></div>`;
                    }).join('')}
                    <svg class="trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                            points="${data.data.map((value, index) => {
                                const percentage = range === 0 ? 50 : ((value - minValue) / range) * 100;
                                const x = (index / (data.data.length - 1)) * 100;
                                return `${x},${100 - percentage}`;
                            }).join(' ')}"
                            fill="none"
                            stroke="var(--tanda-cyan)"
                            stroke-width="2"
                            opacity="0.8"
                        />
                    </svg>
                </div>
                <div class="trend-stats">
                    <div class="trend-change ${data.trend}">
                        ${data.change > 0 ? '+' : ''}${data.change}%
                    </div>
                    <div class="trend-label">${data.trend === 'increasing' ? 'Creciendo' : data.trend === 'decreasing' ? 'Decreciendo' : 'Estable'}</div>
                </div>
            </div>
        `;
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
            
            console.log('🚀 Multi-step form: Creando grupo via API real...');
            console.log('📋 Datos del formulario:', this.formData);
            
            // Preparar datos para la API (mismo formato que createGroup)
            const apiData = {
                name: this.formData['group-name'],
                contribution_amount: parseInt(this.formData['contribution'] || 1500),
                frequency: this.formData['payment-frequency'],
                max_members: parseInt(this.formData['max-participants'] || 12),
                coordinator_id: this.currentUser?.id || 'user_001',
                location: this.formData['location'] || 'La Tanda Chain Network',
                description: this.formData['group-description'] || `Grupo ${this.formData['group-name']} - ${this.formData['payment-frequency']}`,
                category: this.formData['group-type'] || 'general'
            };
            
            console.log('🚀 Multi-step: Enviando a API:', apiData);
            console.log('🔧 Multi-step: API Proxy disponible:', !!this.apiProxy);
            
            // Crear grupo usando el API Proxy híbrido (misma lógica que createGroup)
            const requestMethod = this.apiProxy.request ? 'request' : 'makeRequest';
            console.log('🔧 Multi-step: Método a usar:', requestMethod);
            
            const result = await this.apiProxy[requestMethod]('/api/registration/groups/create', {
                method: 'POST',
                body: apiData
            });
            
            console.log('📥 Multi-step: Respuesta completa de la API:', result);
            console.log('📥 Multi-step: result.success:', result.success);
            console.log('📥 Multi-step: result.data:', result.data);
            
            if (result.success && result.data && result.data.group) {
                const newGroup = result.data.group;
                console.log('✅ Multi-step: Grupo creado exitosamente en API:', newGroup);
                
                // Agregar propiedades adicionales del frontend (mismo mapeo que createGroup)
                const enhancedGroup = {
                    ...newGroup,
                    // Mapear campos de la API al formato del frontend
                    id: newGroup.id,
                    members: newGroup.member_count,
                    maxMembers: newGroup.max_members,
                    contribution: newGroup.contribution_amount,
                    totalSavings: newGroup.total_amount_collected,
                    isOwner: true,
                    isAdmin: true,
                    performance: 100,
                    trustScore: 85,
                    created: new Date(newGroup.created_at),
                    avatar: this.getGroupAvatar(newGroup.category),
                    tags: this.generateTags(newGroup.category, newGroup.name),
                    // Propiedades del formulario multi-step
                    nextMeeting: this.formData['start-date'] || new Date().toISOString().split('T')[0],
                    frequency: this.formData['payment-frequency']
                };
                
                // Actualizar la lista local
                this.groups.push(enhancedGroup);
                this.userStats.totalGroups++;
                
                // Guardar también en localStorage como backup
                this.saveGroupsData(this.groups);
                
                localStorage.removeItem('create-group-draft');
                this.showNotification('¡Grupo creado exitosamente!', 'success', 5000);
                
                console.log('✅ Multi-step: Grupo creado con configuración optimizada:', newGroup);
            } else {
                // Error de la API
                const errorMessage = result.data?.error?.message || 'Error desconocido de la API';
                console.error('❌ Multi-step: Error de API al crear grupo:', result);
                this.showNotification(`❌ Error al crear grupo: ${errorMessage}`, 'error');
                return;
            }
            
            this.resetForm();
            
            console.log('🔄 Multi-step: Cambiando a pestaña groups para mostrar el nuevo grupo...');
            this.switchTab('groups');
            
            // Actualizar la UI con los nuevos datos
            this.updateDashboard();
            
            console.log('🔄 Multi-step: Forzando recarga adicional de grupos después de 1 segundo...');
            setTimeout(() => {
                this.loadGroupsContent();
            }, 1000);
            
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
        // Simulamos una lista de miembros
        const memberTypes = ['owner', 'admin', 'member'];
        const memberNames = ['Ana García', 'Carlos López', 'María Rodriguez', 'Juan Pérez', 'Sofia Martínez'];
        const memberAvatars = ['👩‍💼', '👨‍💻', '👩‍🏫', '👨‍⚕️', '👩‍🎨'];
        
        let membersHtml = '';
        for (let i = 0; i < group.members; i++) {
            const isOwner = i === 0 && group.isOwner;
            const isAdmin = (i === 1 || isOwner) && group.isAdmin;
            const memberType = isOwner ? 'owner' : isAdmin ? 'admin' : 'member';
            const memberName = memberNames[i % memberNames.length];
            const memberAvatar = memberAvatars[i % memberAvatars.length];
            
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
        
        return membersHtml || '<p class="no-members">No hay miembros para mostrar</p>';
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
        console.log('🔧 Iniciando administración de grupo:', groupId);
        const group = this.groups.find(g => g.id === groupId);
        console.log('🔍 Grupo encontrado:', group ? group.name : 'NO ENCONTRADO');
        console.log('🔍 Es admin:', group ? group.isAdmin : 'N/A');
        
        if (!group || !group.isAdmin) {
            console.warn('⚠️ Sin permisos o grupo no encontrado');
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

        // Asegurar que el modal tenga la estructura correcta con botones visibles
        console.log('⏰ Configurando modal en 100ms...');
        setTimeout(() => {
            console.log('🔍 Buscando .modal-actions en el modal...');
            const modalActions = modal.querySelector('.modal-actions');
            if (modalActions) {
                console.log('✅ Modal actions encontrado, configurando...');
                modalActions.innerHTML = `
                    <button class="btn btn-success" onclick="advancedGroupsSystem.saveGroupChanges('${groupId}')">
                        <i class="fas fa-save"></i> Guardar Cambios
                    </button>
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                `;
                
                // Forzar visibilidad
                modalActions.style.display = 'flex';
                modalActions.style.position = 'sticky';
                modalActions.style.bottom = '0';
                modalActions.style.zIndex = '999999';
                modalActions.style.background = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))';
                modalActions.style.backdropFilter = 'blur(20px)';
                modalActions.style.borderTop = '2px solid rgba(0, 255, 255, 0.3)';
                
                console.log('✅ Modal actions configurados y forzados como visibles');
            } else {
                console.warn('⚠️ No se encontró .modal-actions en el modal');
                console.log('🔍 Elementos disponibles en modal:', modal.innerHTML.substring(0, 200));
            }
        }, 100);
        
        console.log('🎯 Modal de administración creado exitosamente para:', group.name);
    }

    showManagementTab(tab, groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) {
            console.error('❌ Grupo no encontrado:', groupId);
            return;
        }

        console.log('🔄 Cambiando a tab:', tab, 'para grupo:', groupId);

        // Actualizar botones activos
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        // Buscar el botón específico para este tab
        const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
            btn.onclick && btn.onclick.toString().includes(`'${tab}'`)
        );
        
        if (targetBtn) {
            targetBtn.classList.add('active');
        } else {
            console.warn('⚠️ No se encontró botón para tab:', tab);
        }

        // Mostrar contenido correspondiente
        const content = document.getElementById('management-content');
        if (!content) {
            console.error('❌ No se encontró elemento #management-content');
            return;
        }

        try {
            switch(tab) {
                case 'members':
                    console.log('📋 Renderizando gestión de miembros');
                    content.innerHTML = this.renderMembersManagement(group);
                    this.updateModalActions(groupId, 'members');
                    break;
                case 'settings':
                    console.log('⚙️ Renderizando configuración');
                    content.innerHTML = this.renderSettingsManagement(group);
                    // Configurar botones específicos para configuración
                    this.updateModalActions(groupId, 'settings');
                    break;
                case 'finances':
                    console.log('💰 Renderizando finanzas');
                    content.innerHTML = this.renderFinancesManagement(group);
                    this.updateModalActions(groupId, 'finances');
                    break;
                case 'notifications':
                    console.log('🔔 Renderizando notificaciones');
                    content.innerHTML = this.renderNotificationsManagement(group);
                    this.updateModalActions(groupId, 'notifications');
                    break;
                default:
                    console.error('❌ Tab no reconocido:', tab);
            }
        } catch (error) {
            console.error('❌ Error renderizando tab:', tab, error);
            content.innerHTML = `<div class="error-message">Error cargando ${tab}</div>`;
        }
    }

    renderMembersManagement(group) {
        return `
            <div class="members-management">
                <div class="section-header">
                    <h4>Gestión de Miembros (${group.members}/${group.maxMembers})</h4>
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
        // Generar datos de miembros basados en el grupo específico
        const baseMembers = [
            { name: 'Carlos López', avatar: '👨‍💻', email: 'carlos@email.com' },
            { name: 'María Rodriguez', avatar: '👩‍🏫', email: 'maria@email.com' },
            { name: 'Juan Pérez', avatar: '👨‍⚕️', email: 'juan@email.com' },
            { name: 'Sofia Martínez', avatar: '👩‍🎨', email: 'sofia@email.com' },
            { name: 'Luis González', avatar: '👨‍🔧', email: 'luis@email.com' },
            { name: 'Carmen Ruiz', avatar: '👩‍⚖️', email: 'carmen@email.com' },
            { name: 'Diego Torres', avatar: '👨‍🎯', email: 'diego@email.com' }
        ];

        const membersData = [];
        
        // Si eres coordinador de este grupo, apareces primero como coordinador
        if (group.isOwner) {
            membersData.push({
                name: 'Ana García (Tú)',
                avatar: '👩‍💼',
                email: 'ana@email.com',
                isOwner: true,
                isCurrentUser: true,
                role: 'Coordinador'
            });
        } else {
            // Si no eres coordinador, el coordinador real aparece primero
            membersData.push({
                name: group.coordinatorName || 'Coordinador',
                avatar: '👑',
                email: `${(group.coordinatorName || 'coordinador').toLowerCase().replace(' ', '.')}@email.com`,
                isOwner: true,
                isCurrentUser: false,
                role: 'Coordinador'
            });
        }

        // Agregar otros miembros hasta completar el número total
        const remainingSlots = Math.min(group.members - 1, baseMembers.length);
        for (let i = 0; i < remainingSlots; i++) {
            const baseMember = baseMembers[i];
            const isCurrentUserSlot = !group.isOwner && i === (group.memberNumber - 2); // -2 porque el coordinador ocupa slot 0 y memberNumber empieza en 1
            
            membersData.push({
                name: isCurrentUserSlot ? `${baseMember.name} (Tú)` : baseMember.name,
                avatar: baseMember.avatar,
                email: baseMember.email,
                isOwner: false,
                isCurrentUser: isCurrentUserSlot,
                role: 'Miembro'
            });
        }
        
        // Only show actual number of members (no duplicates)
        const actualMembersCount = Math.min(group.members || 8, membersData.length);
        let membersHtml = '';
        
        for (let i = 0; i < actualMembersCount; i++) {
            const member = membersData[i];
            
            const memberId = `${group.id}_member_${i}`;
            
            membersHtml += `
                <div class="member-detail-item clickable-member" 
                     data-member-id="${memberId}"
                     onclick="advancedGroupsSystem.viewMemberProfile('${memberId}', '${group.id}')"
                     title="Ver perfil de ${member.name}">
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
                    <div class="member-access-indicator">
                        <i class="fas fa-eye" title="Acceso al perfil disponible"></i>
                    </div>
                </div>
            `;
        }
        
        return membersHtml;
    }

    // ========================================
    // 👤 SISTEMA DE PERFILES DE MIEMBROS
    // ========================================
    
    viewMemberProfile(memberId, groupId) {
        // Verificar que el usuario es miembro del grupo
        const group = this.groups.find(g => g.id === groupId);
        if (!group) {
            this.showNotification('❌ Grupo no encontrado', 'error');
            return;
        }

        // Solo miembros del grupo pueden ver perfiles
        const isGroupMember = true; // Usuario siempre es miembro si está en la vista de detalles
        
        if (!isGroupMember) {
            this.showNotification('🔒 Solo los miembros del grupo pueden ver perfiles', 'warning');
            return;
        }

        // Obtener datos del miembro
        const memberData = this.getMemberData(memberId, groupId);
        if (!memberData) {
            this.showNotification('❌ Miembro no encontrado', 'error');
            return;
        }

        this.showMemberProfileModal(memberData, group);
    }

    getMemberData(memberId, groupId) {
        // Simular base de datos de miembros con información detallada
        const membersDatabase = {
            [`${groupId}_member_0`]: {
                id: 'user_001',
                name: 'Ana García',
                displayName: 'Ana García (Tú)',
                avatar: '👩‍💼',
                email: 'ana@email.com',
                phone: '+504 9999-1111',
                role: 'Coordinador',
                isCurrentUser: true,
                joinDate: '2024-11-20',
                trustScore: 96,
                completedTandas: 12,
                totalContributed: 36000,
                groupsCount: 3,
                location: 'Tegucigalpa Norte',
                bio: 'Coordinadora con experiencia en grupos familiares. Enfocada en el ahorro responsable.',
                achievements: ['🏆 Coordinadora Estrella', '💎 Confianza Total', '🎯 Meta 100% Cumplida'],
                lastActivity: '2025-01-21',
                status: 'online'
            },
            [`${groupId}_member_1`]: {
                id: 'user_002',
                name: 'Carlos López',
                displayName: 'Carlos López',
                avatar: '👨‍💻',
                email: 'carlos@email.com',
                phone: '+504 9999-2222',
                role: 'Miembro',
                isCurrentUser: false,
                joinDate: '2024-12-01',
                trustScore: 89,
                completedTandas: 5,
                totalContributed: 15000,
                groupsCount: 2,
                location: 'Tegucigalpa Centro',
                bio: 'Profesional en TI interesado en inversiones grupales y ahorro sistemático.',
                achievements: ['💻 Tech Leader', '🤝 Buen Colaborador'],
                lastActivity: '2025-01-20',
                status: 'offline'
            },
            [`${groupId}_member_2`]: {
                id: 'user_003',
                name: 'María Rodriguez',
                displayName: 'María Rodriguez',
                avatar: '👩‍🏫',
                email: 'maria@email.com',
                phone: '+504 9999-3333',
                role: 'Miembro',
                isCurrentUser: false,
                joinDate: '2024-12-05',
                trustScore: 92,
                completedTandas: 8,
                totalContributed: 24000,
                groupsCount: 2,
                location: 'Comayagüela',
                bio: 'Educadora comprometida con el crecimiento financiero familiar.',
                achievements: ['🎓 Mentora Financiera', '📚 Educadora'],
                lastActivity: '2025-01-21',
                status: 'online'
            }
        };

        return membersDatabase[memberId] || null;
    }

    showMemberProfileModal(member, group) {
        const statusIcon = member.status === 'online' ? '🟢' : '⚪';
        const timeAgo = member.status === 'online' ? 'En línea ahora' : 'Última vez: ' + member.lastActivity;

        const modal = this.createModal('member-profile', `👤 Perfil de ${member.name}`, `
            <div class="member-profile-container">
                <div class="member-profile-header">
                    <div class="member-avatar-large">${member.avatar}</div>
                    <div class="member-profile-info">
                        <h3>${member.displayName}</h3>
                        <div class="member-status">
                            <span class="status-indicator">${statusIcon}</span>
                            <span class="status-text">${timeAgo}</span>
                        </div>
                        <div class="member-role-main">
                            <span class="role-badge-large ${member.role === 'Coordinador' ? 'role-owner' : 'role-member'}">
                                ${member.role} en ${group.name}
                            </span>
                        </div>
                    </div>
                    <div class="trust-score-display">
                        <div class="trust-circle">
                            <span class="trust-number">${member.trustScore}%</span>
                        </div>
                        <span class="trust-label">Confianza</span>
                    </div>
                </div>

                <div class="member-profile-stats">
                    <div class="stat-card">
                        <div class="stat-value">${member.completedTandas}</div>
                        <div class="stat-label">Tandas Completadas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">L. ${member.totalContributed.toLocaleString()}</div>
                        <div class="stat-label">Total Contribuido</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${member.groupsCount}</div>
                        <div class="stat-label">Grupos Activos</div>
                    </div>
                </div>

                <div class="member-profile-details">
                    <div class="detail-section">
                        <h5><i class="fas fa-user"></i> Información Personal</h5>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${member.email}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Teléfono:</span>
                                <span class="detail-value">${member.phone}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Ubicación:</span>
                                <span class="detail-value">${member.location}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Miembro desde:</span>
                                <span class="detail-value">${new Date(member.joinDate).toLocaleDateString('es-HN')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h5><i class="fas fa-quote-left"></i> Biografía</h5>
                        <p class="member-bio">${member.bio}</p>
                    </div>

                    <div class="detail-section">
                        <h5><i class="fas fa-trophy"></i> Logros</h5>
                        <div class="achievements-list">
                            ${member.achievements.map(achievement => `
                                <span class="achievement-badge">${achievement}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>

                ${!member.isCurrentUser ? `
                <div class="member-actions">
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.sendMessageToMember('${member.id}')">
                        <i class="fas fa-envelope"></i> Enviar Mensaje
                    </button>
                    <button class="btn btn-info" onclick="advancedGroupsSystem.viewMemberActivity('${member.id}', '${group.id}')">
                        <i class="fas fa-chart-line"></i> Ver Actividad
                    </button>
                </div>
                ` : `
                <div class="current-user-note">
                    <i class="fas fa-info-circle"></i>
                    <span>Este es tu perfil tal como lo ven otros miembros del grupo</span>
                </div>
                `}
            </div>
        `, true);
    }

    sendMessageToMember(memberId) {
        this.showNotification('💬 Función de mensajería en desarrollo', 'info');
        console.log('Enviando mensaje a miembro:', memberId);
    }

    viewMemberActivity(memberId, groupId) {
        this.showNotification('📊 Función de actividad en desarrollo', 'info');
        console.log('Viendo actividad de miembro:', memberId, 'en grupo:', groupId);
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

    updateModalActions(groupId, tabType) {
        const modalActions = document.querySelector('.modal-actions');
        if (!modalActions) {
            console.warn('⚠️ No se encontró .modal-actions');
            return;
        }

        console.log('🔧 Actualizando botones del modal para:', tabType);

        switch (tabType) {
            case 'settings':
                modalActions.innerHTML = `
                    <button class="btn btn-success" onclick="advancedGroupsSystem.saveGroupChanges('${groupId}')">
                        <i class="fas fa-save"></i> Guardar Cambios
                    </button>
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                `;
                break;
            case 'members':
                modalActions.innerHTML = `
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.inviteMembers('${groupId}')">
                        <i class="fas fa-user-plus"></i> Invitar Miembros
                    </button>
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                `;
                break;
            default:
                modalActions.innerHTML = `
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                `;
        }
    }

    renderFinancesManagement(group) {
        return `
            <div class="finances-management">
                <div class="finance-overview">
                    <div class="finance-stats-grid">
                        <div class="finance-stat">
                            <div class="stat-icon"><i class="fas fa-piggy-bank"></i></div>
                            <div class="stat-info">
                                <span class="stat-value">L. ${(group.totalSavings || 0).toLocaleString()}</span>
                                <span class="stat-label">Total Acumulado</span>
                            </div>
                        </div>
                        <div class="finance-stat">
                            <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                            <div class="stat-info">
                                <span class="stat-value">${Math.round(group.performance || 0)}%</span>
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

    // Función helper para detectar grupos nuevos
    isNewGroup(group) {
        // Criterios para considerar un grupo como "nuevo":
        const createdDate = new Date(group.created_at || group.createdAt || Date.now());
        const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        
        return (
            daysSinceCreation <= 7 || // Creado en los últimos 7 días
            (group.totalSavings || group.total_amount_collected || 0) === 0 || // Sin ahorros
            group.members <= 1 || // Solo tiene 1 miembro (el coordinador)
            group.member_count <= 1
        );
    }

    // Función helper para identificar grupos de ejemplo/demostración
    isExampleGroup(group) {
        const exampleGroupIds = ['group_001', 'group_002', 'group_ce8b59b2d5c97212'];
        const exampleNames = ['Grupo Ahorro Familiar', 'Emprendedores Unidos'];
        
        return (
            exampleGroupIds.includes(group.id) ||
            exampleNames.includes(group.name)
        );
    }

    generateRecentTransactions(group) {
        // Detectar si es un grupo nuevo (creado recientemente o sin historial)
        const isNewGroup = this.isNewGroup(group);
        
        if (isNewGroup) {
            // Grupo nuevo: sin transacciones
            return `
                <div class="empty-transactions">
                    <div class="empty-icon">📊</div>
                    <p>No hay transacciones aún</p>
                    <span class="empty-subtitle">Las transacciones aparecerán cuando los miembros realicen pagos</span>
                </div>
            `;
        }
        
        // Grupos con historial: usar ejemplos solo para grupos de demostración
        const transactions = this.isExampleGroup(group) ? [
            { type: 'payment', member: 'Carlos López', amount: 1500, date: '2025-01-08', status: 'completed' },
            { type: 'payment', member: 'María Rodriguez', amount: 1500, date: '2025-01-07', status: 'completed' },
            { type: 'penalty', member: 'Juan Pérez', amount: 50, date: '2025-01-06', status: 'completed' },
            { type: 'payment', member: 'Sofia Martínez', amount: 1500, date: '2025-01-05', status: 'completed' }
        ] : [];

        return transactions.map(tx => `
            <div class="transaction-item">
                <div class="transaction-icon ${tx.type}">
                    <i class="fas fa-${tx.type === 'payment' ? 'money-bill-wave' : 'exclamation-triangle'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">
                        ${tx.type === 'payment' ? 'Pago recibido' : 'Multa aplicada'} - ${tx.member}
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

        console.log('👁️ Viewing tandas for group:', groupId);
        
        // Generar datos limitados para evitar problemas de memoria
        const tandas = this.generateSimpleTandas(group);
        
        const modal = this.createModal('group-tandas-detailed', `🔄 Tandas - ${group.name}`, `
            <div class="group-tandas-detailed-container">
                <div class="tandas-header">
                    <div class="group-info-summary">
                        <div class="group-avatar-small">${group.avatar}</div>
                        <div class="group-details">
                            <h3>${group.name}</h3>
                            <p>${tandas.length} tandas activas • ${group.members} participantes</p>
                        </div>
                    </div>
                    
                    <div class="tandas-stats-summary">
                        <div class="stat-item">
                            <span class="stat-value">L. ${this.calculateSimpleTotal(tandas).toLocaleString()}</span>
                            <span class="stat-label">Total Contribuido</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">L. ${this.calculateSimplePending(tandas).toLocaleString()}</span>
                            <span class="stat-label">Pagos Pendientes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${this.calculateSimpleCompletion(tandas)}%</span>
                            <span class="stat-label">Tasa Cumplimiento</span>
                        </div>
                    </div>
                </div>

                <div class="tandas-list-detailed">
                    ${tandas.map(tanda => this.renderSimpleTanda(tanda, group)).join('')}
                </div>

                ${tandas.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-sync-alt"></i>
                        <h4>No hay tandas activas</h4>
                        <p>Este grupo aún no ha iniciado ninguna tanda</p>
                        <button class="btn btn-primary" onclick="advancedGroupsSystem.createNewTanda('${groupId}')">
                            <i class="fas fa-plus"></i> Crear Primera Tanda
                        </button>
                    </div>
                ` : ''}
            </div>
        `, true);

        // Configurar botones del modal
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.exportTandasReport('${groupId}')">
                <i class="fas fa-download"></i> Exportar Reporte
            </button>
            <button class="btn btn-success" onclick="advancedGroupsSystem.createNewTanda('${groupId}')">
                <i class="fas fa-plus"></i> Nueva Tanda
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
    }

    generateDetailedTandas(group) {
        const tandas = [];
        const tandaCount = group.activeTandas || 2;
        
        for (let i = 1; i <= tandaCount; i++) {
            const participants = this.generateTandaParticipants(group);
            tandas.push({
                id: `tanda_${group.id}_${i}`,
                name: `Tanda ${i} - ${group.name}`,
                groupId: group.id,
                groupName: group.name,
                startDate: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)), // i meses atrás
                participants: participants,
                currentRound: Math.min(i + 2, participants.length),
                totalRounds: participants.length,
                roundAmount: group.contribution,
                status: i === 1 ? 'active' : 'completed',
                frequency: group.frequency || 'monthly',
                nextPaymentDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
                completedPayments: this.generateCompletedPayments(participants, i),
                pendingPayments: this.generatePendingPayments(participants)
            });
        }
        
        return tandas;
    }

    generateTandaParticipants(group) {
        const sampleNames = [
            'María González', 'Carlos Rodríguez', 'Ana Morales', 'Luis Hernández',
            'Sofia Martínez', 'Diego López', 'Carmen Vargas', 'Roberto Silva',
            'Patricia Ruiz', 'Fernando Castro', 'Claudia Jiménez', 'Miguel Torres'
        ];
        
        const participantCount = Math.min(group.maxMembers, group.members + Math.floor(Math.random() * 3));
        const participants = [];
        
        for (let i = 0; i < participantCount; i++) {
            participants.push({
                id: `participant_${i}`,
                name: sampleNames[i % sampleNames.length],
                role: i === 0 ? 'coordinator' : 'participant',
                joinDate: new Date(Date.now() - (Math.random() * 90 * 24 * 60 * 60 * 1000)),
                totalContributed: group.contribution * (Math.floor(Math.random() * 3) + 1),
                paymentStatus: Math.random() > 0.1 ? 'up_to_date' : 'pending',
                trustScore: 75 + Math.floor(Math.random() * 25),
                position: i + 1
            });
        }
        
        return participants;
    }

    generateCompletedPayments(participants, tandaNumber) {
        const payments = [];
        const completedRounds = Math.min(tandaNumber + 1, participants.length - 1);
        
        for (let round = 1; round <= completedRounds; round++) {
            const recipient = participants[round - 1];
            const roundPayments = participants.map(participant => ({
                participantId: participant.id,
                participantName: participant.name,
                amount: participant.role === 'coordinator' ? participants.length * 1500 : 1500,
                date: new Date(Date.now() - ((completedRounds - round + 1) * 30 * 24 * 60 * 60 * 1000)),
                status: 'completed',
                round: round,
                recipient: recipient.name
            }));
            
            payments.push(...roundPayments);
        }
        
        return payments;
    }

    generatePendingPayments(participants) {
        return participants.filter(p => p.paymentStatus === 'pending').map(participant => ({
            participantId: participant.id,
            participantName: participant.name,
            amount: 1500,
            dueDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
            status: 'pending',
            daysOverdue: Math.random() > 0.5 ? Math.floor(Math.random() * 5) : 0
        }));
    }

    calculateTotalContributions(tandas) {
        return tandas.reduce((total, tanda) => {
            return total + tanda.completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        }, 0);
    }

    calculatePendingPayments(tandas) {
        return tandas.reduce((total, tanda) => {
            return total + tanda.pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
        }, 0);
    }

    calculateCompletionRateForTandas(tandas) {
        if (!tandas || tandas.length === 0) return 0;
        
        const totalPayments = tandas.reduce((sum, tanda) => 
            sum + (tanda.completedPayments?.length || 0) + (tanda.pendingPayments?.length || 0), 0);
        const completedPayments = tandas.reduce((sum, tanda) => 
            sum + (tanda.completedPayments?.length || 0), 0);
        
        return totalPayments > 0 ? Math.round((completedPayments / totalPayments) * 100) : 0;
    }

    renderDetailedTanda(tanda, group) {
        const nextRecipient = tanda.participants[tanda.currentRound - 1];
        const progress = (tanda.currentRound / tanda.totalRounds) * 100;
        
        return `
            <div class="tanda-card-detailed">
                <div class="tanda-header">
                    <div class="tanda-info">
                        <h4>${tanda.name}</h4>
                        <div class="tanda-meta">
                            <span class="tanda-status status-${tanda.status}">${tanda.status === 'active' ? 'Activa' : 'Completada'}</span>
                            <span class="tanda-frequency">${tanda.frequency === 'monthly' ? 'Mensual' : 'Semanal'}</span>
                        </div>
                    </div>
                    
                    <div class="tanda-progress">
                        <div class="progress-circle">
                            <div class="progress-value">${Math.round(progress)}%</div>
                        </div>
                    </div>
                </div>

                <div class="tanda-stats">
                    <div class="stat-group">
                        <span class="stat-label">Ronda Actual</span>
                        <span class="stat-value">${tanda.currentRound}/${tanda.totalRounds}</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Monto por Ronda</span>
                        <span class="stat-value">L. ${tanda.roundAmount.toLocaleString()}</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Total Recaudado</span>
                        <span class="stat-value">L. ${(tanda.completedPayments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}</span>
                    </div>
                </div>

                ${tanda.status === 'active' ? `
                    <div class="current-round">
                        <h5>Ronda Actual</h5>
                        <div class="recipient-info">
                            <span class="recipient-avatar">${nextRecipient?.name?.charAt(0) || 'U'}</span>
                            <div class="recipient-details">
                                <strong>${nextRecipient?.name || 'Por determinar'}</strong>
                                <p>Recibirá: L. ${(tanda.roundAmount * tanda.participants.length).toLocaleString()}</p>
                            </div>
                        </div>
                        ${tanda.pendingPayments.length > 0 ? `
                            <div class="pending-alert">
                                <i class="fas fa-exclamation-triangle"></i>
                                ${tanda.pendingPayments.length} pago(s) pendiente(s)
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="participants-summary">
                    <h5>Participantes (${tanda.participants.length})</h5>
                    <div class="participants-grid">
                        ${tanda.participants.map(participant => `
                            <div class="participant-item">
                                <div class="participant-avatar">${participant.name.charAt(0)}</div>
                                <div class="participant-info">
                                    <span class="participant-name">${participant.name}</span>
                                    <span class="participant-role">${participant.role === 'coordinator' ? 'Coordinador' : 'Participante'}</span>
                                    <span class="participant-status status-${participant.paymentStatus}">
                                        ${participant.paymentStatus === 'up_to_date' ? '✅ Al día' : '⏰ Pendiente'}
                                    </span>
                                </div>
                                <div class="participant-stats">
                                    <div class="trust-score">
                                        <span class="score-value">${participant.trustScore}%</span>
                                        <span class="score-label">Confianza</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tanda-actions">
                    <button class="btn btn-outline btn-sm" onclick="advancedGroupsSystem.viewTandaDetails('${tanda.id}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    ${tanda.status === 'active' ? `
                        <button class="btn btn-primary btn-sm" onclick="advancedGroupsSystem.manageTandaPayments('${tanda.id}')">
                            <i class="fas fa-money-bill"></i> Gestionar Pagos
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="advancedGroupsSystem.exportTandaData('${tanda.id}')">
                        <i class="fas fa-download"></i> Exportar
                    </button>
                </div>
            </div>
        `;
    }

    // ================================
    // PAYMENT MANAGEMENT SYSTEM  
    // ================================
    
    manageTandaPayments(tandaId) {
        console.log('💰 Managing payments for tanda:', tandaId);
        
        // Datos mock de pagos para la tanda
        const tandaPaymentData = this.generateTandaPaymentData(tandaId);
        
        const modal = this.createModal('tanda-payments', `💰 Gestión de Pagos - ${tandaPaymentData.name}`, `
            <div class="tanda-payments-container">
                <!-- Header con información de la tanda -->
                <div class="tanda-payment-header">
                    <div class="tanda-info">
                        <h3>${tandaPaymentData.name}</h3>
                        <div class="tanda-meta">
                            <span class="badge badge-${tandaPaymentData.status === 'active' ? 'success' : 'warning'}">
                                ${tandaPaymentData.status === 'active' ? 'Activa' : 'Completada'}
                            </span>
                            <span>Contribución: L. ${tandaPaymentData.contribution.toLocaleString()}</span>
                            <span>Período: ${tandaPaymentData.currentPeriod}/${tandaPaymentData.totalPeriods}</span>
                        </div>
                    </div>
                    <div class="payment-summary">
                        <div class="summary-card">
                            <span class="summary-label">Total Recaudado</span>
                            <span class="summary-value text-success">L. ${tandaPaymentData.totalCollected.toLocaleString()}</span>
                        </div>
                        <div class="summary-card">
                            <span class="summary-label">Pendiente</span>
                            <span class="summary-value text-warning">L. ${tandaPaymentData.totalPending.toLocaleString()}</span>
                        </div>
                        <div class="summary-card">
                            <span class="summary-label">% Completado</span>
                            <span class="summary-value">${tandaPaymentData.completionPercentage}%</span>
                        </div>
                    </div>
                </div>

                <!-- Filtros y acciones rápidas -->
                <div class="payment-controls">
                    <div class="filter-controls">
                        <select class="form-control" onchange="advancedGroupsSystem.filterPaymentsByStatus(this.value)">
                            <option value="all">Todos los estados</option>
                            <option value="paid">Pagados</option>
                            <option value="pending">Pendientes</option>
                            <option value="overdue">Atrasados</option>
                        </select>
                        <select class="form-control" onchange="advancedGroupsSystem.filterPaymentsByPeriod(this.value)">
                            <option value="current">Período actual</option>
                            <option value="all">Todos los períodos</option>
                            <option value="1">Período 1</option>
                            <option value="2">Período 2</option>
                            <option value="3">Período 3</option>
                        </select>
                    </div>
                    <div class="action-controls">
                        <button class="btn btn-primary btn-sm" onclick="advancedGroupsSystem.recordPayment('${tandaId}')">
                            <i class="fas fa-plus"></i> Registrar Pago
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="advancedGroupsSystem.sendPaymentReminders('${tandaId}')">
                            <i class="fas fa-bell"></i> Recordatorios
                        </button>
                        <button class="btn btn-success btn-sm" onclick="advancedGroupsSystem.processDistribution('${tandaId}')">
                            <i class="fas fa-hand-holding-usd"></i> Procesar Reparto
                        </button>
                    </div>
                </div>

                <!-- Tabla de pagos por miembro -->
                <div class="payments-table-container">
                    <table class="payments-table">
                        <thead>
                            <tr>
                                <th>Miembro</th>
                                <th>Período Actual</th>
                                <th>Total Contribuido</th>
                                <th>Estado</th>
                                <th>Último Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="payments-table-body">
                            ${tandaPaymentData.members.map(member => `
                                <tr class="payment-row ${member.status}" data-member-id="${member.id}">
                                    <td>
                                        <div class="member-info">
                                            <div class="member-avatar">${member.avatar}</div>
                                            <div class="member-details">
                                                <span class="member-name">${member.name}</span>
                                                ${member.isCurrentUser ? '<span class="current-user-badge">Tú</span>' : ''}
                                                ${member.isCoordinator ? '<span class="coordinator-badge">Coordinador</span>' : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="payment-status">
                                            <span class="payment-amount ${member.currentPayment.status}">
                                                L. ${member.currentPayment.amount.toLocaleString()}
                                            </span>
                                            <span class="payment-date">${member.currentPayment.date || 'Pendiente'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="total-contributed">L. ${member.totalContributed.toLocaleString()}</span>
                                        <small class="contribution-percentage">${member.contributionPercentage}% completo</small>
                                    </td>
                                    <td>
                                        <span class="status-badge status-${member.status}">
                                            ${member.status === 'paid' ? 'Al día' : 
                                              member.status === 'pending' ? 'Pendiente' : 
                                              member.status === 'overdue' ? 'Atrasado' : 'Parcial'}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="last-payment">${member.lastPayment}</span>
                                    </td>
                                    <td>
                                        <div class="payment-actions">
                                            ${member.status !== 'paid' ? `
                                                <button class="btn btn-sm btn-success" onclick="advancedGroupsSystem.markAsPaid('${member.id}', '${tandaId}')" title="Marcar como pagado">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                            ` : ''}
                                            <button class="btn btn-sm btn-outline" onclick="advancedGroupsSystem.viewMemberPaymentHistory('${member.id}', '${tandaId}')" title="Ver historial">
                                                <i class="fas fa-history"></i>
                                            </button>
                                            ${member.status === 'overdue' ? `
                                                <button class="btn btn-sm btn-warning" onclick="advancedGroupsSystem.sendPersonalReminder('${member.id}', '${tandaId}')" title="Enviar recordatorio">
                                                    <i class="fas fa-exclamation-triangle"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Resumen de períodos -->
                <div class="periods-summary">
                    <h4><i class="fas fa-calendar-alt"></i> Historial de Períodos</h4>
                    <div class="periods-timeline">
                        ${tandaPaymentData.periodsHistory.map(period => `
                            <div class="period-item ${period.status}">
                                <div class="period-number">${period.number}</div>
                                <div class="period-info">
                                    <span class="period-date">${period.date}</span>
                                    <span class="period-beneficiary">Beneficiario: ${period.beneficiary}</span>
                                    <span class="period-amount">L. ${period.amount.toLocaleString()}</span>
                                </div>
                                <div class="period-status">
                                    <span class="status-badge status-${period.status}">
                                        ${period.status === 'completed' ? 'Completado' : 
                                          period.status === 'current' ? 'Actual' : 'Pendiente'}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `, true);

        modal.style.maxWidth = '1200px';
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.exportPaymentReport('${tandaId}')">
                <i class="fas fa-file-excel"></i> Exportar Reporte
            </button>
            <button class="btn btn-outline" onclick="advancedGroupsSystem.printPaymentSummary('${tandaId}')">
                <i class="fas fa-print"></i> Imprimir
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
    }

    generateTandaPaymentData(tandaId) {
        const tandaNames = ['Tanda Familiar', 'Tanda Profesional', 'Tanda Emprendedores'];
        const tandaName = tandaNames[Math.floor(Math.random() * tandaNames.length)];
        const contribution = [1000, 1500, 2000, 2500][Math.floor(Math.random() * 4)];
        const totalMembers = 8;
        const currentPeriod = 3;
        const totalPeriods = totalMembers;

        // Generar datos de miembros con pagos
        const memberNames = [
            { name: 'Ana García (Tú)', avatar: '👩‍💼', isCurrentUser: true, isCoordinator: true },
            { name: 'Carlos López', avatar: '👨‍💻', isCurrentUser: false, isCoordinator: false },
            { name: 'María Rodríguez', avatar: '👩‍🏫', isCurrentUser: false, isCoordinator: false },
            { name: 'Juan Pérez', avatar: '👨‍⚕️', isCurrentUser: false, isCoordinator: false },
            { name: 'Sofia Martínez', avatar: '👩‍🎨', isCurrentUser: false, isCoordinator: false },
            { name: 'Luis González', avatar: '👨‍🔧', isCurrentUser: false, isCoordinator: false },
            { name: 'Carmen Ruiz', avatar: '👩‍⚖️', isCurrentUser: false, isCoordinator: false },
            { name: 'Diego Torres', avatar: '👨‍🎯', isCurrentUser: false, isCoordinator: false }
        ];

        const statuses = ['paid', 'pending', 'overdue', 'partial'];
        const members = memberNames.map((member, index) => {
            const periodsContributed = Math.max(1, currentPeriod - Math.floor(Math.random() * 2));
            const status = index === 0 ? 'paid' : statuses[Math.floor(Math.random() * statuses.length)];
            const totalContributed = periodsContributed * contribution;
            const contributionPercentage = Math.round((totalContributed / (contribution * totalPeriods)) * 100);

            return {
                id: `member_${index}`,
                name: member.name,
                avatar: member.avatar,
                isCurrentUser: member.isCurrentUser,
                isCoordinator: member.isCoordinator,
                status: status,
                currentPayment: {
                    amount: status === 'paid' ? contribution : status === 'partial' ? contribution * 0.5 : 0,
                    status: status,
                    date: status === 'paid' ? '2024-08-15' : null
                },
                totalContributed: totalContributed,
                contributionPercentage: contributionPercentage,
                lastPayment: status === 'pending' ? 'Nunca' : '2024-08-15'
            };
        });

        const totalCollected = members.reduce((sum, member) => sum + member.totalContributed, 0);
        const totalExpected = contribution * totalMembers * currentPeriod;
        const totalPending = totalExpected - totalCollected;
        const completionPercentage = Math.round((totalCollected / totalExpected) * 100);

        // Generar historial de períodos
        const periodsHistory = [];
        for (let i = 1; i <= totalPeriods; i++) {
            const beneficiary = memberNames[i - 1]?.name || `Miembro ${i}`;
            periodsHistory.push({
                number: i,
                date: i < currentPeriod ? `2024-0${6 + i}-15` : i === currentPeriod ? '2024-08-15 (Actual)' : 'Pendiente',
                beneficiary: beneficiary,
                amount: contribution * totalMembers,
                status: i < currentPeriod ? 'completed' : i === currentPeriod ? 'current' : 'pending'
            });
        }

        return {
            id: tandaId,
            name: tandaName,
            contribution: contribution,
            currentPeriod: currentPeriod,
            totalPeriods: totalPeriods,
            status: 'active',
            totalCollected: totalCollected,
            totalPending: totalPending,
            completionPercentage: completionPercentage,
            members: members,
            periodsHistory: periodsHistory
        };
    }

    // Payment management actions
    markAsPaid(memberId, tandaId) {
        console.log(`✅ Marking member ${memberId} as paid for tanda ${tandaId}`);
        this.showNotification('success', 'Pago registrado exitosamente');
        // Refresh the payment table
        this.manageTandaPayments(tandaId);
    }

    viewMemberPaymentHistory(memberId, tandaId) {
        const modal = this.createModal('payment-history', '📊 Historial de Pagos', `
            <div class="payment-history-container">
                <div class="member-header">
                    <div class="member-avatar">👨‍💻</div>
                    <div class="member-info">
                        <h3>Carlos López</h3>
                        <p>Miembro desde: Enero 2024</p>
                    </div>
                </div>
                
                <div class="payment-timeline">
                    ${[
                        { date: '2024-08-15', amount: 1500, status: 'paid', period: 3 },
                        { date: '2024-07-15', amount: 1500, status: 'paid', period: 2 },
                        { date: '2024-06-15', amount: 1500, status: 'paid', period: 1 }
                    ].map(payment => `
                        <div class="timeline-item">
                            <div class="timeline-marker ${payment.status}"></div>
                            <div class="timeline-content">
                                <div class="payment-details">
                                    <span class="payment-amount">L. ${payment.amount.toLocaleString()}</span>
                                    <span class="payment-period">Período ${payment.period}</span>
                                </div>
                                <div class="payment-date">${payment.date}</div>
                                <div class="payment-status status-${payment.status}">
                                    ${payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `, true);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        `;
    }

    recordPayment(tandaId) {
        const modal = this.createModal('record-payment', '💰 Registrar Nuevo Pago', `
            <div class="record-payment-container">
                <form class="payment-form">
                    <div class="form-group">
                        <label>Miembro</label>
                        <select class="form-control" required>
                            <option value="">Seleccionar miembro...</option>
                            <option value="member_1">Carlos López</option>
                            <option value="member_2">María Rodríguez</option>
                            <option value="member_3">Juan Pérez</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Monto</label>
                        <input type="number" class="form-control" placeholder="1500" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Fecha de Pago</label>
                        <input type="date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Método de Pago</label>
                        <select class="form-control" required>
                            <option value="cash">Efectivo</option>
                            <option value="transfer">Transferencia</option>
                            <option value="mobile">Pago móvil</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Notas (opcional)</label>
                        <textarea class="form-control" rows="3" placeholder="Agregar observaciones..."></textarea>
                    </div>
                </form>
            </div>
        `, true);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-primary" onclick="advancedGroupsSystem.savePaymentRecord('${tandaId}')">
                <i class="fas fa-save"></i> Registrar Pago
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    }

    savePaymentRecord(tandaId) {
        this.showNotification('success', 'Pago registrado exitosamente');
        this.closeModal();
        // Refresh payment management
        setTimeout(() => this.manageTandaPayments(tandaId), 300);
    }

    makePayment(tandaId) {
        console.log('💳 Processing payment for tanda:', tandaId);
        
        const modal = this.createModal('make-payment', '💳 Realizar Pago', `
            <div class="payment-form-container">
                <div class="payment-summary">
                    <h4>Resumen de Pago</h4>
                    <div class="payment-details">
                        <div class="detail-row">
                            <span>Monto a pagar:</span>
                            <strong>L. 1,500.00</strong>
                        </div>
                        <div class="detail-row">
                            <span>Período:</span>
                            <strong>Febrero 2025</strong>
                        </div>
                        <div class="detail-row">
                            <span>Fecha límite:</span>
                            <strong>2025-02-05</strong>
                        </div>
                    </div>
                </div>
                
                <div class="payment-methods">
                    <h4>Método de Pago</h4>
                    <div class="payment-options">
                        <div class="payment-option">
                            <input type="radio" id="bank-transfer" name="payment-method" value="bank" checked>
                            <label for="bank-transfer">
                                <i class="fas fa-university"></i>
                                <span>Transferencia Bancaria</span>
                            </label>
                        </div>
                        <div class="payment-option">
                            <input type="radio" id="mobile-wallet" name="payment-method" value="mobile">
                            <label for="mobile-wallet">
                                <i class="fas fa-mobile-alt"></i>
                                <span>Billetera Móvil</span>
                            </label>
                        </div>
                        <div class="payment-option">
                            <input type="radio" id="cash" name="payment-method" value="cash">
                            <label for="cash">
                                <i class="fas fa-money-bill"></i>
                                <span>Efectivo</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="payment-notes">
                    <label for="payment-note">Nota (opcional):</label>
                    <textarea id="payment-note" placeholder="Agregar nota sobre este pago..."></textarea>
                </div>
            </div>
        `, true);
        
        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-outline" onclick="advancedGroupsSystem.closeModal()">Cancelar</button>
            <button class="btn btn-success" onclick="advancedGroupsSystem.confirmPayment('${tandaId}')">
                <i class="fas fa-credit-card"></i>
                Confirmar Pago
            </button>
        `;
    }

    confirmPayment(tandaId) {
        console.log('✅ Confirming payment for tanda:', tandaId);
        
        this.closeModal();
        this.showNotification('success', '💳 Pago procesado exitosamente');
        
        // Simulate API call delay
        setTimeout(() => {
            this.showNotification('info', '📧 Comprobante enviado por correo');
        }, 2000);
    }

    processDistribution(tandaId) {
        const modal = this.createModal('process-distribution', '🎯 Procesar Reparto de Tanda', `
            <div class="distribution-container">
                <div class="distribution-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Estás a punto de procesar el reparto del período actual. Esta acción no se puede deshacer.</p>
                </div>
                
                <div class="distribution-details">
                    <div class="detail-item">
                        <span class="label">Beneficiario del período:</span>
                        <span class="value">Ana García (Tú)</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Monto total a recibir:</span>
                        <span class="value">L. 12,000</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Contribuciones recibidas:</span>
                        <span class="value">7 de 8 miembros</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Monto pendiente:</span>
                        <span class="value text-warning">L. 1,500</span>
                    </div>
                </div>
                
                <div class="distribution-options">
                    <label class="checkbox-option">
                        <input type="radio" name="distribution_type" value="full" checked>
                        <span>Procesar con el monto completo (esperar pagos pendientes)</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="radio" name="distribution_type" value="partial">
                        <span>Procesar con el monto actual (L. 10,500)</span>
                    </label>
                </div>
            </div>
        `, true);

        modal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-success" onclick="advancedGroupsSystem.confirmDistribution('${tandaId}')">
                <i class="fas fa-check"></i> Confirmar Reparto
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    }

    confirmDistribution(tandaId) {
        this.showNotification('success', 'Reparto procesado exitosamente');
        this.closeModal();
        this.addActivity('tanda', 'Reparto de tanda procesado', 'just-now');
    }

    // Payment filtering functions
    filterPaymentsByStatus(status) {
        console.log('🔍 Filtering payments by status:', status);
        const rows = document.querySelectorAll('.payment-row');
        rows.forEach(row => {
            if (status === 'all' || row.classList.contains(status)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    filterPaymentsByPeriod(period) {
        console.log('🔍 Filtering payments by period:', period);
        // For now, show all rows as this is demonstration data
        this.showNotification('info', `Filtro aplicado: Período ${period}`);
    }

    // Export and reporting functions
    exportPaymentReport(tandaId) {
        console.log('📊 Exporting payment report for tanda:', tandaId);
        this.showNotification('success', 'Reporte de pagos exportado exitosamente');
        this.addActivity('export', 'Reporte de pagos exportado', 'just-now');
    }

    printPaymentSummary(tandaId) {
        console.log('🖨️ Printing payment summary for tanda:', tandaId);
        window.print();
        this.addActivity('print', 'Resumen de pagos impreso', 'just-now');
    }

    sendPersonalReminder(memberId, tandaId) {
        console.log(`📢 Sending personal reminder to member ${memberId} for tanda ${tandaId}`);
        this.showNotification('success', 'Recordatorio enviado exitosamente');
        this.addActivity('notification', 'Recordatorio de pago enviado', 'just-now');
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
                            <span class="stat-value">L. ${(group.contribution * group.members).toLocaleString()}</span>
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

    async saveGroupChanges(groupId) {
        console.log('🚨 FUNCIÓN saveGroupChanges LLAMADA CON groupId:', groupId);
        console.log('💾 [GUARDAR] Iniciando guardado para grupo:', groupId);
        const group = this.groups.find(g => g.id === groupId);
        if (!group) {
            console.error('❌ [GUARDAR] Grupo no encontrado para guardar');
            return;
        }

        console.log('✅ [GUARDAR] Grupo encontrado:', group.name);

        // Obtener valores de los campos editables
        const nameField = document.getElementById('group-name-edit');
        const descField = document.getElementById('group-description-edit');
        const contributionField = document.getElementById('group-contribution-edit');
        const maxMembersField = document.getElementById('group-max-members-edit');

        console.log('🔍 [GUARDAR] Campos encontrados:', {
            name: !!nameField,
            description: !!descField,
            contribution: !!contributionField,
            maxMembers: !!maxMembersField
        });

        if (nameField) console.log('📝 [GUARDAR] Valor actual nombre:', nameField.value);
        if (descField) console.log('📝 [GUARDAR] Valor actual descripción:', descField.value);
        if (contributionField) console.log('📝 [GUARDAR] Valor actual contribución:', contributionField.value);
        if (maxMembersField) console.log('📝 [GUARDAR] Valor actual max miembros:', maxMembersField.value);

        // Preparar datos para actualizar
        const updatedData = {};
        let hasChanges = false;

        if (nameField && nameField.value !== group.name) {
            updatedData.name = nameField.value;
            group.name = nameField.value;
            hasChanges = true;
        }
        if (descField && descField.value !== group.description) {
            updatedData.description = descField.value;
            group.description = descField.value;
            hasChanges = true;
        }
        if (contributionField && parseInt(contributionField.value) !== group.contribution) {
            updatedData.contribution_amount = parseInt(contributionField.value);
            group.contribution = parseInt(contributionField.value);
            hasChanges = true;
        }
        if (maxMembersField && parseInt(maxMembersField.value) !== group.maxMembers) {
            updatedData.max_members = parseInt(maxMembersField.value);
            group.maxMembers = parseInt(maxMembersField.value);
            hasChanges = true;
        }

        if (!hasChanges) {
            console.log('ℹ️ [GUARDAR] No hay cambios para guardar');
            this.showNotification('ℹ️ No hay cambios para guardar', 'info');
            return;
        }

        console.log('📝 [GUARDAR] Cambios detectados:', updatedData);
        console.log('📝 [GUARDAR] Valores anteriores del grupo:', {
            name: group.name,
            description: group.description,
            contribution: group.contribution,
            maxMembers: group.maxMembers
        });

        try {
            // Usar el endpoint UPDATE de la API
            console.log('🚀 Guardando cambios en la API usando endpoint UPDATE');
            this.showNotification('⏳ Guardando cambios...', 'info');
            
            // Intentar guardar en la API primero
            try {
                const apiResponse = await this.apiProxy.makeRequest(`/api/groups/${groupId}/update`, {
                    method: 'PUT',
                    body: updatedData
                });
                
                if (apiResponse.success) {
                    console.log('✅ Cambios guardados en la API exitosamente:', apiResponse.group);
                    
                    // Actualizar el objeto local con la respuesta de la API
                    Object.assign(group, apiResponse.group);
                    
                    // Guardar también localmente como respaldo
                    this.saveGroupsData(this.groups);
                    
                    this.showNotification('✅ Cambios guardados exitosamente', 'success');
                } else {
                    throw new Error(apiResponse.error || 'Error desconocido de la API');
                }
                
            } catch (apiError) {
                console.warn('⚠️ Error en API, guardando localmente como respaldo:', apiError.message);
                
                // Fallback: guardar localmente
                this.saveGroupsData(this.groups);
                this.showNotification('⚠️ Cambios guardados localmente (API no disponible)', 'warning');
            }
            
            this.updateDashboard(); // Actualizar estadísticas
            this.closeModal();
            
            // Actualizar la UI sin recargar desde API para evitar sobrescribir
            if (this.currentTab === 'groups') {
                this.renderGroupsWithoutAPIReload();
            }
            
        } catch (error) {
            console.error('❌ Error guardando cambios:', error);
            this.showNotification('❌ Error al guardar cambios', 'error');
        }
    }

    renderGroupsWithoutAPIReload() {
        console.log('🔄 [RENDER] Renderizando grupos sin recargar desde API');
        const groupsList = document.getElementById('groupsList');
        if (!groupsList) {
            console.warn('⚠️ [RENDER] No se encontró #groupsList');
            return;
        }

        // Agregar controles de filtros y búsqueda
        this.addGroupsControls();
        
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

        // Renderizar grupos usando los datos locales actuales
        const filteredGroups = this.getFilteredGroups();
        console.log('📋 [RENDER] Renderizando', filteredGroups.length, 'grupos filtrados');
        
        // Usar el mismo HTML que loadGroupsContent (copiado directamente)
        groupsList.innerHTML = filteredGroups.map(group => `
            <div class="group-card enhanced" id="group-card-${group.id}" data-group-id="${group.id}">
                <div class="group-card-content">
                    <div class="group-card-header">
                    <div class="group-avatar">
                        <span class="avatar-emoji">${group.avatar}</span>
                        ${group.isOwner ? '<div class="owner-badge"><i class="fas fa-crown"></i></div>' : ''}
                    </div>
                    
                    <div class="group-info-section">
                        <div class="group-title-row">
                            <h3 class="group-name">${group.name}</h3>
                            <div class="group-status status-${group.status}">
                                <span class="status-dot"></span>
                                ${this.getStatusLabel(group.status)}
                            </div>
                        </div>
                        <p class="group-description">${group.description}</p>
                        <div class="group-meta">
                            <span class="group-type"><i class="fas fa-tag"></i> ${this.getGroupTypeLabel(group.type)}</span>
                            <span class="group-location"><i class="fas fa-map-marker-alt"></i> ${group.location}</span>
                            <span class="group-frequency"><i class="fas fa-clock"></i> ${this.getFrequencyLabel(group.frequency)}</span>
                        </div>
                        
                        <div class="group-roles-info">
                            ${group.isOwner ? `
                                <span class="coordinator-badge">
                                    <i class="fas fa-crown"></i> Eres el Coordinador
                                </span>
                            ` : `
                                <span class="member-role">
                                    Miembro #${Math.floor(Math.random() * group.maxMembers) + 1}
                                </span>
                                <span class="coordinator-info">Coordinador: ${group.coordinatorName || 'María González'}</span>
                            `}
                        </div>
                    </div>
                    </div>
                    
                    <div class="group-card-stats">
                        <div class="stat">
                            <span class="stat-value">${group.members}/${group.maxMembers}</span>
                            <span class="stat-label">Miembros</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">L. ${(group.contribution || 0).toLocaleString()}</span>
                            <span class="stat-label">Contribución</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">L. ${(group.totalSavings || 0).toLocaleString()}</span>
                            <span class="stat-label">Total Ahorrado</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${Math.round(group.performance || 0)}%</span>
                            <span class="stat-label">Rendimiento</span>
                        </div>
                    </div>
                    
                    <div class="group-card-footer">
                        <div class="group-actions">
                            <button class="btn btn-primary btn-sm btn-icon-only" onclick="advancedGroupsSystem.viewGroupDetails('${group.id}')" title="Ver Detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${group.isAdmin ? `
                            <button class="btn btn-secondary btn-sm btn-icon-only" onclick="advancedGroupsSystem.manageGroup('${group.id}')" title="Administrar Grupo">
                                <i class="fas fa-cog"></i>
                            </button>
                            ` : ''}
                            <div class="dropdown" id="dropdown-container-${group.id}">
                                <button class="btn btn-ghost btn-sm dropdown-toggle" onclick="advancedGroupsSystem.toggleGroupActions('${group.id}')">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="dropdown-menu" id="actions-${group.id}">
                                    <a href="#" onclick="advancedGroupsSystem.viewGroupTandasFromGroup('${group.id}')">
                                        <i class="fas fa-sync-alt"></i> Ver Tandas (${this.getGroupTandasCount(group.id)})
                                    </a>
                                    <a href="#" onclick="advancedGroupsSystem.exportGroupData('${group.id}')">
                                        <i class="fas fa-download"></i> Exportar Datos del Grupo
                                    </a>
                                    ${group.status === 'active' ? `
                                    <a href="#" onclick="advancedGroupsSystem.shareGroup('${group.id}')">
                                        <i class="fas fa-share-alt"></i> Compartir Grupo
                                    </a>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="group-tags">
                            ${(group.tags || []).map(tag => `<span class="group-tag">#${tag}</span>`).join('')}
                        </div>
                        
                        <div class="group-progress">
                            <div class="progress-info">
                                <span class="progress-text">${Math.round((group.members / group.maxMembers) * 100)}% Completo</span>
                                <span class="trust-score">${group.trustScore || 85}% Confianza</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.round((group.members / group.maxMembers) * 100)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('✅ [RENDER] Grupos renderizados exitosamente sin recargar API');
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
        // Buscar información de la tanda
        const tandaData = {
            id: tandaId,
            name: 'Tanda Enero 2025',
            status: 'active',
            currentRound: 3,
            totalRounds: 4,
            progress: 75,
            coordinator: 'María González',
            groupName: 'Grupo Alpha',
            nextWinner: 'María Rodriguez',
            nextAmount: 6000,
            participants: ['Ana García', 'Carlos López', 'María Rodriguez', 'Luis Hernández'],
            isUserCoordinator: Math.random() > 0.6,
            userRole: Math.random() > 0.6 ? 'Coordinador' : 'Participante #' + (Math.floor(Math.random() * 4) + 1)
        };

        const modal = this.createModal('tanda-details', '🔍 Detalles de Tanda', `
            <div class="tanda-details-container">
                <div class="tanda-overview">
                    <div class="tanda-header-info">
                        <h5>${tandaData.name}</h5>
                        <div class="tanda-status ${tandaData.status}">${tandaData.status === 'active' ? 'Activa' : 'Inactiva'}</div>
                    </div>
                    
                    <div class="tanda-roles-section">
                        <div class="coordinator-info">
                            <span class="role-label">
                                <i class="fas fa-crown"></i> Coordinador:
                            </span>
                            <span class="coordinator-name">${tandaData.coordinator}</span>
                        </div>
                        <div class="user-role">
                            <span class="role-label">Tu rol:</span>
                            <span class="user-role-badge ${tandaData.isUserCoordinator ? 'coordinator' : 'participant'}">
                                ${tandaData.userRole}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="tanda-progress-section">
                    <div class="progress-info">
                        <span>Progreso: Ronda ${tandaData.currentRound} de ${tandaData.totalRounds}</span>
                        <span>${tandaData.progress}% completado</span>
                    </div>
                    <div class="progress-bar-large">
                        <div class="progress-fill" style="width: ${tandaData.progress}%"></div>
                    </div>
                </div>
                
                <div class="participants-section">
                    <h6><i class="fas fa-users"></i> Participantes (${tandaData.participants.length})</h6>
                    <div class="participants-list">
                        ${tandaData.participants.map((participant, index) => `
                            <div class="participant-item">
                                <div class="participant-avatar">${participant.charAt(0)}</div>
                                <div class="participant-info">
                                    <span class="participant-name">${participant}</span>
                                    <span class="participant-status">
                                        ${index < tandaData.currentRound - 1 ? 
                                            '<i class="fas fa-check-circle text-success"></i> Ya cobró' : 
                                            index === tandaData.currentRound - 1 ? 
                                                '<i class="fas fa-hourglass-half text-warning"></i> Próximo' :
                                                '<i class="fas fa-clock text-secondary"></i> Pendiente'
                                        }
                                    </span>
                                </div>
                            </div>
                        `).join('')}
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
                                <span>${group.members}/${group.maxMembers} Miembros Activos</span>
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
                            <span>Powered by La Tanda Chain</span>
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

        const message = `¡Únete al grupo "${group.name}"! 🚀\n\n` +
                       `💰 Contribución: L. ${group.contribution.toLocaleString()}\n` +
                       `👥 Miembros: ${group.members}/${group.maxMembers}\n` +
                       `🏆 Confianza: ${group.trustScore}%\n\n` +
                       `#LaTandaChain #AhorroColectivo`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        this.showNotification('📱 Abriendo WhatsApp...', 'info');
    }

    shareViaEmail(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const subject = `Invitación al grupo: ${group.name}`;
        const body = `Hola,\n\nTe invito a unirte a nuestro grupo de ahorro "${group.name}".\n\n` +
                    `Detalles:\n` +
                    `• Contribución: L. ${group.contribution.toLocaleString()}\n` +
                    `• Miembros actuales: ${group.members}/${group.maxMembers}\n` +
                    `• Puntaje de confianza: ${group.trustScore}%\n\n` +
                    `¡Ahorra de forma segura y organizada con La Tanda Chain!\n\n` +
                    `Saludos cordiales`;

        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
        
        this.showNotification('📧 Abriendo cliente de email...', 'info');
    }

    shareViaTelegram(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const groupUrl = `${window.location.origin}/groups-advanced-system.html?join=${groupId}`;
        const message = `🏦 *${group.name}*\n\n` +
                       `${group.description}\n\n` +
                       `📊 *Detalles del grupo:*\n` +
                       `👥 Miembros: ${group.members}/${group.maxMembers}\n` +
                       `💰 Contribución: L. ${group.contribution.toLocaleString()}\n` +
                       `⭐ Confianza: ${group.trustScore}%\n\n` +
                       `¡Únete a nuestro grupo de ahorro!\n\n` +
                       `${groupUrl}`;

        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(groupUrl)}&text=${encodeURIComponent(message)}`;
        window.open(telegramUrl, '_blank');
        
        this.showNotification('📱 Compartiendo en Telegram...', 'info');
    }

    shareOnSocialMedia(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const modal = this.createModal('social-media-share', '🌐 Compartir en Redes Sociales', `
            <div class="social-media-container">
                <div class="social-platforms">
                    <div class="social-platform facebook" onclick="advancedGroupsSystem.shareOnFacebook('${groupId}')">
                        <div class="social-icon">
                            <i class="fab fa-facebook-f"></i>
                        </div>
                        <div class="social-info">
                            <h4>Facebook</h4>
                            <p>Comparte en tu timeline o grupos</p>
                        </div>
                        <div class="social-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>

                    <div class="social-platform twitter" onclick="advancedGroupsSystem.shareOnTwitter('${groupId}')">
                        <div class="social-icon">
                            <i class="fab fa-twitter"></i>
                        </div>
                        <div class="social-info">
                            <h4>Twitter / X</h4>
                            <p>Publica un tweet sobre el grupo</p>
                        </div>
                        <div class="social-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>

                    <div class="social-platform instagram" onclick="advancedGroupsSystem.shareOnInstagram('${groupId}')">
                        <div class="social-icon">
                            <i class="fab fa-instagram"></i>
                        </div>
                        <div class="social-info">
                            <h4>Instagram</h4>
                            <p>Comparte en stories o posts</p>
                        </div>
                        <div class="social-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>

                    <div class="social-platform linkedin" onclick="advancedGroupsSystem.shareOnLinkedIn('${groupId}')">
                        <div class="social-icon">
                            <i class="fab fa-linkedin-in"></i>
                        </div>
                        <div class="social-info">
                            <h4>LinkedIn</h4>
                            <p>Comparte profesionalmente</p>
                        </div>
                        <div class="social-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>

                    <div class="social-platform whatsapp" onclick="advancedGroupsSystem.shareViaWhatsApp('${groupId}')">
                        <div class="social-icon">
                            <i class="fab fa-whatsapp"></i>
                        </div>
                        <div class="social-info">
                            <h4>WhatsApp</h4>
                            <p>Comparte por chat individual o grupos</p>
                        </div>
                        <div class="social-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>

                    <div class="social-platform copy-link" onclick="advancedGroupsSystem.copyGroupLink('${groupId}')">
                        <div class="social-icon">
                            <i class="fas fa-link"></i>
                        </div>
                        <div class="social-info">
                            <h4>Copiar Enlace</h4>
                            <p>Copia el enlace para compartir donde quieras</p>
                        </div>
                        <div class="social-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>
                </div>

                <div class="social-preview">
                    <h4>📝 Vista Previa del Mensaje</h4>
                    <div class="preview-card">
                        <div class="preview-header">
                            <div class="preview-avatar">${group.avatar}</div>
                            <div class="preview-title">
                                <h5>${group.name}</h5>
                                <span>Grupo de Ahorro • La Tanda Chain</span>
                            </div>
                        </div>
                        <div class="preview-content">
                            <p>${group.description}</p>
                            <div class="preview-stats">
                                <span><i class="fas fa-users"></i> ${group.members}/${group.maxMembers} miembros</span>
                                <span><i class="fas fa-coins"></i> L. ${group.contribution.toLocaleString()}</span>
                                <span><i class="fas fa-star"></i> ${group.trustScore}% confianza</span>
                            </div>
                        </div>
                        <div class="preview-footer">
                            <button class="preview-btn">Únete al Grupo</button>
                        </div>
                    </div>
                </div>
            </div>
        `, true);

        modal.style.maxWidth = '800px';
        modal.querySelector('.modal-actions').style.display = 'none';
    }

    shareOnFacebook(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const groupUrl = `${window.location.origin}/groups-advanced-system.html?join=${groupId}`;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(groupUrl)}`;
        
        window.open(facebookUrl, '_blank', 'width=600,height=400');
        this.showNotification('📘 Compartiendo en Facebook...', 'info');
    }

    shareOnTwitter(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const groupUrl = `${window.location.origin}/groups-advanced-system.html?join=${groupId}`;
        const text = `🏦 Únete a "${group.name}" - Grupo de ahorro seguro\n\n` +
                    `💰 Contribución: L. ${group.contribution.toLocaleString()}\n` +
                    `👥 ${group.members}/${group.maxMembers} miembros\n` +
                    `⭐ ${group.trustScore}% confianza\n\n` +
                    `#LaTandaChain #AhorroSeguro #CooperativaDigital`;

        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(groupUrl)}`;
        
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        this.showNotification('🐦 Compartiendo en Twitter...', 'info');
    }

    shareOnInstagram(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Instagram no permite compartir enlaces directos, así que copiamos el texto y abrimos Instagram
        const groupUrl = `${window.location.origin}/groups-advanced-system.html?join=${groupId}`;
        const text = `🏦 ${group.name}\n\n` +
                    `${group.description}\n\n` +
                    `💰 Contribución: L. ${group.contribution.toLocaleString()}\n` +
                    `👥 Miembros: ${group.members}/${group.maxMembers}\n` +
                    `⭐ Confianza: ${group.trustScore}%\n\n` +
                    `Enlace: ${groupUrl}\n\n` +
                    `#LaTandaChain #AhorroSeguro #CooperativaDigital`;

        // Copiar texto al portapapeles
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('📋 Texto copiado. Abriendo Instagram...', 'info');
            // Abrir Instagram web
            window.open('https://www.instagram.com/', '_blank');
        }).catch(() => {
            this.showNotification('📱 Abre Instagram y comparte manualmente', 'info');
        });
    }

    shareOnLinkedIn(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const groupUrl = `${window.location.origin}/groups-advanced-system.html?join=${groupId}`;
        const title = `Únete al grupo de ahorro: ${group.name}`;
        const summary = `${group.description}\n\nContribución: L. ${group.contribution.toLocaleString()} | Miembros: ${group.members}/${group.maxMembers} | Confianza: ${group.trustScore}%`;

        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(groupUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
        
        window.open(linkedInUrl, '_blank', 'width=600,height=400');
        this.showNotification('💼 Compartiendo en LinkedIn...', 'info');
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
        const group = this.groups.find(g => g.id === groupId);
        if (!group) {
            this.showNotification('error', 'Grupo no encontrado');
            return;
        }

        // URL del grupo para compartir
        const groupUrl = `${window.location.origin}/groups-advanced-system.html?join=${groupId}`;
        
        const modal = this.createModal('qr-code-generator', '📱 Código QR del Grupo', `
            <div class="qr-code-container">
                <div class="qr-group-info">
                    <div class="qr-group-header">
                        <div class="qr-group-avatar">${group.avatar}</div>
                        <div class="qr-group-details">
                            <h3>${group.name}</h3>
                            <p>${group.description}</p>
                            <div class="qr-group-stats">
                                <span><i class="fas fa-users"></i> ${group.members}/${group.maxMembers} miembros</span>
                                <span><i class="fas fa-coins"></i> L. ${group.contribution.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="qr-code-section">
                    <div class="qr-code-display" id="qrCodeDisplay">
                        ${this.generateQRCodeSVG(groupUrl)}
                    </div>
                    <div class="qr-code-info">
                        <p><i class="fas fa-info-circle"></i> Escanea este código para unirte al grupo</p>
                        <div class="qr-url">
                            <input type="text" value="${groupUrl}" id="qrGroupUrl" readonly>
                            <button class="btn btn-sm btn-outline" onclick="advancedGroupsSystem.copyQRUrl('${groupId}')">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="qr-actions">
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.downloadQRCode('${groupId}')">
                        <i class="fas fa-download"></i> Descargar PNG
                    </button>
                    <button class="btn btn-secondary" onclick="advancedGroupsSystem.printQRCode('${groupId}')">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button class="btn btn-primary" onclick="advancedGroupsSystem.shareQRCode('${groupId}')">
                        <i class="fas fa-share"></i> Compartir QR
                    </button>
                </div>
            </div>
        `, true);
        
        // Actualizar el estilo del modal para QR
        modal.style.maxWidth = '500px';
        modal.querySelector('.modal-actions').style.display = 'none';
    }

    generateQRCodeSVG(url) {
        // Generar QR code usando una implementación simple SVG
        const size = 200;
        const modules = 25; // Simplicidad para demo
        const moduleSize = size / modules;
        
        let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="${size}" height="${size}" fill="white"/>`;
        
        // Generar patrón de QR simple (esto es una demostración - en producción usarías una librería real)
        for (let row = 0; row < modules; row++) {
            for (let col = 0; col < modules; col++) {
                // Patrón pseudo-aleatorio basado en la URL
                const seed = url.length + row * modules + col;
                if ((seed * 7 + row * 3 + col * 2) % 3 === 0) {
                    const x = col * moduleSize;
                    const y = row * moduleSize;
                    svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
                }
            }
        }
        
        // Esquinas de posicionamiento
        const cornerSize = moduleSize * 7;
        const positions = [
            {x: 0, y: 0},
            {x: size - cornerSize, y: 0},
            {x: 0, y: size - cornerSize}
        ];
        
        positions.forEach(pos => {
            svg += `<rect x="${pos.x}" y="${pos.y}" width="${cornerSize}" height="${cornerSize}" fill="black"/>`;
            svg += `<rect x="${pos.x + moduleSize}" y="${pos.y + moduleSize}" width="${cornerSize - 2*moduleSize}" height="${cornerSize - 2*moduleSize}" fill="white"/>`;
            svg += `<rect x="${pos.x + 2*moduleSize}" y="${pos.y + 2*moduleSize}" width="${cornerSize - 4*moduleSize}" height="${cornerSize - 4*moduleSize}" fill="black"/>`;
        });
        
        svg += '</svg>';
        return svg;
    }

    copyQRUrl(groupId) {
        const urlInput = document.getElementById('qrGroupUrl');
        urlInput.select();
        document.execCommand('copy');
        this.showNotification('success', '🔗 Enlace copiado al portapapeles');
    }

    downloadQRCode(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        const qrElement = document.getElementById('qrCodeDisplay');
        if (!qrElement) return;
        
        // Crear canvas para generar imagen PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 300;
        
        // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Convertir SVG a imagen y descargar
        const svgData = new XMLSerializer().serializeToString(qrElement.querySelector('svg'));
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 50, 50, 200, 200);
            
            // Descargar
            const link = document.createElement('a');
            link.download = `QR-${group.name.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL();
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        
        this.showNotification('success', '📱 Código QR descargado');
    }

    printQRCode(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        const qrElement = document.getElementById('qrCodeDisplay');
        if (!qrElement) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Código QR - ${group.name}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 20px;
                        background: white;
                    }
                    .qr-print { 
                        margin: 20px auto;
                        max-width: 400px;
                    }
                    .group-info {
                        margin-bottom: 20px;
                        padding: 20px;
                        border: 2px solid #00FFFF;
                        border-radius: 10px;
                    }
                    .qr-code {
                        margin: 20px 0;
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="qr-print">
                    <div class="group-info">
                        <h1>${group.name}</h1>
                        <p>${group.description}</p>
                        <p><strong>Miembros:</strong> ${group.members}/${group.maxMembers}</p>
                        <p><strong>Contribución:</strong> L. ${group.contribution.toLocaleString()}</p>
                    </div>
                    <div class="qr-code">
                        ${qrElement.innerHTML}
                    </div>
                    <p><strong>Escanea el código QR para unirte al grupo</strong></p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        
        this.showNotification('success', '🖨️ Preparando impresión del código QR');
    }

    shareQRCode(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        const groupUrl = `${window.location.origin}/groups-advanced-system.html?join=${groupId}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Únete al grupo: ${group.name}`,
                text: `${group.description}\nMiembros: ${group.members}/${group.maxMembers}\nContribución: L. ${group.contribution.toLocaleString()}`,
                url: groupUrl
            }).then(() => {
                this.showNotification('success', '✅ Código QR compartido');
            }).catch(() => {
                this.fallbackShareQR(groupId);
            });
        } else {
            this.fallbackShareQR(groupId);
        }
    }

    fallbackShareQR(groupId) {
        this.closeModal();
        setTimeout(() => this.shareGroup(groupId), 300);
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

    // ========================================
    // 🔧 FUNCIONES DE FILTRADO Y ORDENAMIENTO DE TANDAS
    // ========================================
    
    filterTandasByStatus(status) {
        console.log('🔍 Filtrando tandas por estado:', status);
        
        // Actualizar botones activos
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-filter="${status}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        // Aplicar filtro lógico
        this.currentStatusFilter = status;
        this.applyTandasFilters();
        
        this.showNotification(`🔍 Filtro aplicado: ${this.getStatusFilterLabel(status)}`, 'info');
    }

    sortTandasBy(criteria) {
        console.log('📊 Ordenando tandas por:', criteria);
        
        this.currentSortCriteria = criteria;
        this.applyTandasFilters();
        
        this.showNotification(`📊 Tandas ordenadas por ${this.getSortCriteriaLabel(criteria)}`, 'info');
    }

    applyTandasFilters() {
        // Recargar el contenido con los filtros aplicados
        this.loadTandasContent();
    }

    getStatusFilterLabel(status) {
        const labels = {
            'all': 'Todas las tandas',
            'active': 'Tandas activas',
            'pending-payments': 'Con pagos pendientes',
            'completed': 'Tandas completadas',
            'paused': 'Tandas pausadas'
        };
        return labels[status] || status;
    }

    getSortCriteriaLabel(criteria) {
        const labels = {
            'date': 'fecha de creación',
            'progress': 'progreso',
            'amount': 'monto',
            'members': 'número de miembros',
            'name': 'nombre alfabético'
        };
        return labels[criteria] || criteria;
    }

    // ========================================
    // 🔧 FUNCIONES DE ACCIONES DE TANDAS (Dropdown)
    // ========================================
    
    editTanda(tandaId) {
        console.log('✏️ Editando tanda:', tandaId);
        this.showNotification('✏️ Abriendo editor de tanda...', 'info');
        
        const modal = this.createModal('edit-tanda', '✏️ Editar Tanda', `
            <div class="edit-tanda-container">
                <p><i class="fas fa-wrench"></i> Función de edición en desarrollo</p>
                <p>Tanda ID: ${tandaId}</p>
            </div>
        `);
    }

    shareTanda(tandaId) {
        console.log('📤 Compartiendo tanda:', tandaId);
        const shareText = `¡Únete a esta tanda! Ahorra de manera segura y organizada. #LaTandaChain`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Invitación a Tanda',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('📋 Información de tanda copiada al portapapeles', 'success');
            });
        }
    }

    duplicateTanda(tandaId) {
        console.log('🔄 Duplicando tanda:', tandaId);
        this.showNotification('🔄 Creando copia de la tanda...', 'info');
        // Lógica de duplicación aquí
    }

    setTandaReminder(tandaId) {
        console.log('⏰ Configurando recordatorio para tanda:', tandaId);
        this.showNotification('⏰ Recordatorio configurado', 'success');
    }

    sendPaymentReminders(tandaId) {
        console.log('📢 Enviando recordatorios de pago para tanda:', tandaId);
        this.showNotification('📢 Recordatorios enviados a participantes', 'success');
    }

    pauseTanda(tandaId) {
        console.log('⏸️ Pausando tanda:', tandaId);
        this.showNotification('⏸️ Tanda pausada temporalmente', 'warning');
    }

    archiveTanda(tandaId) {
        console.log('📦 Archivando tanda:', tandaId);
        this.showNotification('📦 Tanda archivada', 'info');
    }

    cancelTanda(tandaId) {
        console.log('❌ Cancelando tanda:', tandaId);
        const confirmModal = this.createModal('confirm-cancel', '⚠️ Cancelar Tanda', `
            <div class="confirm-container">
                <p>¿Estás seguro de que quieres cancelar esta tanda?</p>
                <div class="warning-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Esta acción no se puede deshacer.</span>
                </div>
            </div>
        `, true);
        
        confirmModal.querySelector('.modal-actions').innerHTML = `
            <button class="btn btn-danger" onclick="advancedGroupsSystem.confirmCancelTanda('${tandaId}')">
                <i class="fas fa-times"></i> Sí, Cancelar
            </button>
            <button class="btn btn-secondary" onclick="advancedGroupsSystem.closeModal()">
                <i class="fas fa-arrow-left"></i> No, Mantener
            </button>
        `;
    }

    confirmCancelTanda(tandaId) {
        console.log('✅ Confirmando cancelación de tanda:', tandaId);
        this.closeModal();
        this.showNotification('❌ Tanda cancelada', 'error');
        // Remover de la lista, etc.
    }

    // Funciones de filtrado y navegación (mantenidas para compatibilidad)
    filterTandasByStatusOld(status) {
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
                            <option value="all">Toda La Red</option>
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

        // Return empty requirements if match is not provided
        if (!match || !match.type) {
            return requirements;
        }

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

    // ========================================
    // 🔄 REAL-TIME UPDATE SYSTEM
    // ========================================

    animateChartBars() {
        const bars = document.querySelectorAll('.chart-bar');
        bars.forEach((bar, index) => {
            setTimeout(() => {
                const height = Math.random() * 80 + 20; // Random height 20-100%
                bar.style.height = `${height}%`;
                bar.style.transform = 'scaleY(1)';
                
                // Add glow effect based on performance
                if (height > 70) {
                    bar.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.6)';
                } else if (height > 40) {
                    bar.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.5)';
                } else {
                    bar.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.4)';
                }
            }, index * 100);
        });
    }

    startPeriodicUpdates() {
        // Update stats every 8 seconds to simulate live market data
        setInterval(() => {
            this.updateStatsDisplay();
            this.animateWeb3Stats();
        }, 8000);
        
        // Update chart bars every 12 seconds
        setInterval(() => {
            this.animateChartBars();
        }, 12000);
        
        // Simulate portfolio fluctuations every 3 seconds
        setInterval(() => {
            this.updatePortfolioMetrics();
        }, 3000);
    }

    updatePortfolioMetrics() {
        // Simulate small portfolio value changes
        const portfolioElement = document.querySelector('.portfolio-value');
        if (portfolioElement) {
            const currentValue = this.userStats.portfolioTVL;
            const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
            const newValue = currentValue * (1 + fluctuation);
            
            portfolioElement.textContent = `L. ${this.formatNumber(newValue)}`;
            
            // Add visual indicator for changes
            portfolioElement.style.animation = 'none';
            setTimeout(() => {
                portfolioElement.style.animation = fluctuation > 0 ? 
                    'portfolio-up 0.5s ease-out' : 'portfolio-down 0.5s ease-out';
            }, 10);
        }

        // Update APY with realistic fluctuations
        const apyElement = document.querySelector('.apy-value');
        if (apyElement) {
            const baseAPY = 9.7;
            const apyFluctuation = (Math.random() - 0.5) * 0.4; // ±0.2% fluctuation
            const newAPY = baseAPY + apyFluctuation;
            
            apyElement.textContent = `+${newAPY.toFixed(1)}%`;
            apyElement.style.color = newAPY > baseAPY ? '#22c55e' : '#ef4444';
        }
    }

    // ========================================
    // 🔧 MISSING FUNCTIONS FIX
    // ========================================

    openKYC() {
        console.log('🆔 Abriendo sistema KYC...');
        
        this.showModal({
            title: '🆔 Verificación KYC',
            content: `
                <div class="kyc-modal-content">
                    <div class="kyc-header">
                        <div class="kyc-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h4>Verificación de Identidad</h4>
                        <p>Completa tu verificación KYC para acceder a todas las funcionalidades</p>
                    </div>
                    
                    <div class="kyc-status">
                        <div class="status-item">
                            <span class="status-icon verified"><i class="fas fa-check"></i></span>
                            <span>Información básica</span>
                        </div>
                        <div class="status-item">
                            <span class="status-icon verified"><i class="fas fa-check"></i></span>
                            <span>Número de teléfono</span>
                        </div>
                        <div class="status-item">
                            <span class="status-icon pending"><i class="fas fa-clock"></i></span>
                            <span>Verificación de documento</span>
                        </div>
                        <div class="status-item">
                            <span class="status-icon pending"><i class="fas fa-clock"></i></span>
                            <span>Verificación facial</span>
                        </div>
                    </div>
                    
                    <div class="kyc-actions">
                        <button class="btn btn-primary" onclick="window.open('/kyc-registration.html', '_blank')">
                            <i class="fas fa-external-link-alt"></i>
                            Continuar Verificación
                        </button>
                        <button class="btn btn-secondary" onclick="advancedGroupsSystem.hideModal()">
                            <i class="fas fa-times"></i>
                            Cerrar
                        </button>
                    </div>
                </div>
            `,
            size: 'medium'
        });
    }

    showAudit() {
        console.log('📊 Mostrando auditoría del sistema...');
        
        this.showModal({
            title: '📊 Auditoría del Sistema',
            content: `
                <div class="audit-modal-content">
                    <div class="audit-header">
                        <div class="audit-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <h4>Auditoría de Seguridad</h4>
                        <p>Reporte completo de la seguridad y transparencia del sistema</p>
                    </div>
                    
                    <div class="audit-stats">
                        <div class="audit-stat">
                            <span class="stat-number">98.5%</span>
                            <span class="stat-label">Smart Contract Success</span>
                            <span class="stat-trend positive">↗ +2.1%</span>
                        </div>
                        <div class="audit-stat">
                            <span class="stat-number">100%</span>
                            <span class="stat-label">Funds Security</span>
                            <span class="stat-trend positive">✓ Secured</span>
                        </div>
                        <div class="audit-stat">
                            <span class="stat-number">24/7</span>
                            <span class="stat-label">Monitoring</span>
                            <span class="stat-trend">🟢 Active</span>
                        </div>
                    </div>
                    
                    <div class="audit-details">
                        <h5>Últimas Auditorías</h5>
                        <div class="audit-item">
                            <span class="audit-date">2024-08-20</span>
                            <span class="audit-type">Smart Contracts</span>
                            <span class="audit-result success">✅ Aprobado</span>
                        </div>
                        <div class="audit-item">
                            <span class="audit-date">2024-08-15</span>
                            <span class="audit-type">Security Infrastructure</span>
                            <span class="audit-result success">✅ Aprobado</span>
                        </div>
                        <div class="audit-item">
                            <span class="audit-date">2024-08-10</span>
                            <span class="audit-type">Financial Reserves</span>
                            <span class="audit-result success">✅ Aprobado</span>
                        </div>
                    </div>
                    
                    <div class="audit-actions">
                        <button class="btn btn-primary" onclick="alert('Descargando reporte completo...')">
                            <i class="fas fa-download"></i>
                            Descargar Reporte
                        </button>
                        <button class="btn btn-secondary" onclick="advancedGroupsSystem.hideModal()">
                            <i class="fas fa-times"></i>
                            Cerrar
                        </button>
                    </div>
                </div>
            `,
            size: 'large'
        });
    }

    // ========================================
    // 🔧 FUNCIONES OPTIMIZADAS PARA TANDAS (MEMORY-SAFE)
    // ========================================
    
    getGroupTandasCount(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return 0;
        
        // Calcular número de tandas dinámicamente basado en las reglas del sistema
        const tandas = this.generateSimpleTandas(group);
        return tandas.length;
    }

    generateSimpleTandas(group) {
        // Solo generar tandas si el grupo tiene suficientes miembros
        if (group.members <= 1) {
            return [];
        }
        
        // Para grupos recién creados, no generar tandas automáticamente
        const isNewGroup = !group.created || (new Date() - new Date(group.created) < 24 * 60 * 60 * 1000);
        if (isNewGroup && group.members < 3) {
            return [];
        }
        
        // Solo generar una tanda si el grupo es viable
        return [
            {
                id: `tanda-${group.id}-1`,
                name: `Tanda de ${group.name}`,
                groupId: group.id,
                position: 1,
                totalAmount: group.contribution * group.members,
                contributionPerCycle: group.contribution,
                currentCycle: 1,
                totalCycles: group.members,
                status: group.members >= 3 ? 'ready' : 'forming',
                beneficiary: group.admin_name || 'Coordinador',
                nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                participants: group.members
            }
        ];
    }

    calculateSimpleTotal(tandas) {
        return tandas.reduce((total, tanda) => total + (tanda.contributionPerCycle * tanda.currentCycle), 0);
    }

    calculateSimplePending(tandas) {
        return tandas.reduce((total, tanda) => {
            const pending = tanda.totalAmount - (tanda.contributionPerCycle * tanda.currentCycle);
            return total + Math.max(0, pending);
        }, 0);
    }

    calculateSimpleCompletion(tandas) {
        if (tandas.length === 0) return 0;
        const totalProgress = tandas.reduce((total, tanda) => {
            return total + (tanda.currentCycle / tanda.totalCycles);
        }, 0);
        return Math.round((totalProgress / tandas.length) * 100);
    }

    renderSimpleTanda(tanda, group) {
        const progressPercentage = (tanda.currentCycle / tanda.totalCycles) * 100;
        const isCompleted = tanda.currentCycle >= tanda.totalCycles;
        
        return `
            <div class="tanda-card-detailed">
                <div class="tanda-header">
                    <div class="tanda-info">
                        <h4>${tanda.name}</h4>
                        <div class="tanda-meta">
                            <span class="tanda-position">Posición ${tanda.position}</span>
                            <span class="tanda-status status-${tanda.status}">
                                ${tanda.status === 'active' ? '🟢 Activa' : 
                                  tanda.status === 'pending' ? '🟡 Pendiente' : 
                                  '🔴 Finalizada'}
                            </span>
                        </div>
                    </div>
                    <div class="tanda-beneficiary">
                        <span class="beneficiary-label">Beneficiario Actual:</span>
                        <span class="beneficiary-name">${tanda.beneficiary}</span>
                    </div>
                </div>

                <div class="tanda-progress-section">
                    <div class="progress-info">
                        <span>Progreso: ${tanda.currentCycle}/${tanda.totalCycles} ciclos</span>
                        <span class="progress-percentage">${Math.round(progressPercentage)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>

                <div class="tanda-stats">
                    <div class="stat-item">
                        <span class="stat-label">Monto Total</span>
                        <span class="stat-value">L. ${tanda.totalAmount.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Por Ciclo</span>
                        <span class="stat-value">L. ${tanda.contributionPerCycle.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Participantes</span>
                        <span class="stat-value">${tanda.participants}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Próximo Pago</span>
                        <span class="stat-value">${tanda.nextPaymentDate}</span>
                    </div>
                </div>

                <div class="tanda-actions">
                    <button class="btn btn-sm btn-primary" onclick="advancedGroupsSystem.viewTandaDetails('${tanda.id}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    ${tanda.status === 'active' ? `
                        <button class="btn btn-sm btn-success" onclick="advancedGroupsSystem.makePayment('${tanda.id}')">
                            <i class="fas fa-credit-card"></i> Hacer Pago
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ========================================
    // 🔧 FUNCIONES AUXILIARES PARA EXPORTAR DATOS
    // ========================================
    
    generateGroupMembers(group) {
        const memberNames = ['María González', 'Carlos Hernández', 'Ana Martínez', 'Luis García', 'Carmen López', 'José Rodríguez', 'Patricia Morales', 'Miguel Santos'];
        const roles = ['Coordinador', 'Participante', 'Tesorero', 'Secretario'];
        
        return Array.from({length: Math.min(group.members, 8)}, (_, i) => ({
            id: `member-${group.id}-${i + 1}`,
            nombre: memberNames[i] || `Miembro ${i + 1}`,
            rol: i === 0 && group.isOwner ? 'Coordinador' : 'Participante',
            fechaIngreso: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            contribucionTotal: group.contribution * (Math.floor(Math.random() * 10) + 1),
            estado: Math.random() > 0.1 ? 'Activo' : 'Pendiente',
            telefono: `+504 ${Math.floor(Math.random() * 90000000) + 10000000}`,
            email: `${memberNames[i]?.toLowerCase().replace(' ', '.') || `miembro${i + 1}`}@email.com`
        }));
    }

    generateGroupTransactions(group) {
        const transactionTypes = ['Contribución', 'Pago de Tanda', 'Bonificación', 'Multa', 'Interés'];
        const memberNames = ['María González', 'Carlos Hernández', 'Ana Martínez', 'Luis García'];
        
        return Array.from({length: Math.min(15, group.members * 3)}, (_, i) => ({
            id: `tx-${group.id}-${i + 1}`,
            fecha: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            tipo: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
            monto: Math.floor(Math.random() * group.contribution * 2) + (group.contribution * 0.5),
            de: memberNames[Math.floor(Math.random() * memberNames.length)],
            para: Math.random() > 0.5 ? 'Fondo Común' : memberNames[Math.floor(Math.random() * memberNames.length)],
            estado: Math.random() > 0.1 ? 'Completada' : 'Pendiente',
            descripcion: `Transacción de ${transactionTypes[Math.floor(Math.random() * transactionTypes.length)].toLowerCase()}`
        }));
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

    // ================================
    // UTILITY METHODS
    // ================================
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num.toLocaleString();
        }
    }
    
    // Safe formatting function for currency
    formatCurrency(amount) {
        const value = Number(amount) || 0;
        return `L. ${value.toLocaleString()}`;
    }
    
    // Calculate how many payments per month based on frequency
    getPaymentsPerMonth(frequency) {
        const frequencies = {
            'weekly': 4,      // 4 pagos por mes
            'biweekly': 2,    // 2 pagos por mes (quincenales)
            'monthly': 1      // 1 pago por mes
        };
        return frequencies[frequency] || 1;
    }

    updateStatsDisplay() {
        try {
            // Recalcular estadísticas
            this.userStats = this.calculateUserStats();
            
            // Actualizar elementos en el dashboard si existen
            const elements = {
                totalGroups: document.querySelector('.stat-value[data-stat="totalGroups"]'),
                totalTandas: document.querySelector('.stat-value[data-stat="totalTandas"]'),
                totalSavings: document.querySelector('.stat-value[data-stat="totalSavings"]'),
                trustScore: document.querySelector('.stat-value[data-stat="trustScore"]')
            };

            Object.keys(elements).forEach(key => {
                const element = elements[key];
                if (element && this.userStats[key] !== undefined) {
                    if (key === 'totalSavings') {
                        element.textContent = `L. ${this.formatNumber(this.userStats[key])}`;
                    } else if (key === 'trustScore') {
                        element.textContent = `${this.userStats[key]}%`;
                    } else {
                        element.textContent = this.userStats[key];
                    }
                }
            });
        } catch (error) {
            console.warn('Error updating stats display:', error);
        }
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

function openKYC() {
    if (window.advancedGroupsSystem && typeof window.advancedGroupsSystem.openKYC === 'function') {
        window.advancedGroupsSystem.openKYC();
    } else {
        setTimeout(() => {
            if (window.advancedGroupsSystem && typeof window.advancedGroupsSystem.openKYC === 'function') {
                window.advancedGroupsSystem.openKYC();
            } else {
                alert('Sistema aún no está listo. Por favor, espera unos segundos y prueba de nuevo.');
            }
        }, 1000);
    }
}

function showAudit() {
    if (window.advancedGroupsSystem && typeof window.advancedGroupsSystem.showAudit === 'function') {
        window.advancedGroupsSystem.showAudit();
    } else {
        setTimeout(() => {
            if (window.advancedGroupsSystem && typeof window.advancedGroupsSystem.showAudit === 'function') {
                window.advancedGroupsSystem.showAudit();
            } else {
                alert('Sistema aún no está listo. Por favor, espera unos segundos y prueba de nuevo.');
            }
        }, 1000);
    }
}

function toggleCollapsible(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapsible-icon');
    
    header.classList.toggle('active');
    content.classList.toggle('expanded');
    
    if (content.classList.contains('expanded')) {
        content.style.maxHeight = content.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.style.maxHeight = '0px';
        icon.style.transform = 'rotate(0deg)';
    }
}

// Initialize system when DOM is loaded
// Asegurar que el sistema esté disponible inmediatamente
window.advancedGroupsSystem = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando Sistema de Grupos & Tandas Avanzado v3.0...');
    try {
        window.advancedGroupsSystem = new AdvancedGroupsSystemV3();
        console.log('✅ Sistema inicializado correctamente');
        
        // Exponer globalmente para acceso inmediato
        if (typeof window !== 'undefined') {
            window.advancedGroupsSystem = window.advancedGroupsSystem;
        }
    } catch (error) {
        console.error('❌ Error al inicializar sistema:', error);
        // Crear un sistema dummy para evitar errores
        window.advancedGroupsSystem = {
            showNotification: () => console.log('Sistema no inicializado'),
            makePayment: () => console.log('Sistema no inicializado'),
            showNotifications: () => console.log('Sistema no inicializado')
        };
    }
});

// Función de seguridad para verificar que el sistema esté listo
function ensureSystemReady(callback) {
    if (window.advancedGroupsSystem && typeof window.advancedGroupsSystem.showNotification === 'function') {
        callback();
    } else {
        setTimeout(() => ensureSystemReady(callback), 100);
    }
}


// Función para limpiar datos y recargar con coordinadores
function refreshGroupData() {
    localStorage.removeItem('latanda_groups_data');
    window.location.reload();
}

// Auto-ejecutar al cargar la página una sola vez
// COMENTADO: Esto causaba que se borraran los grupos creados por el usuario
// if (!localStorage.getItem('coordinator_data_refreshed')) {
//     localStorage.setItem('coordinator_data_refreshed', 'true');
//     localStorage.removeItem('latanda_groups_data');
//     console.log('🔄 Datos de coordinador actualizados');
// }

// Marcar como inicializado para evitar futuras limpiezas automáticas
if (!localStorage.getItem('coordinator_data_refreshed')) {
    localStorage.setItem('coordinator_data_refreshed', 'true');
    console.log('🔄 Sistema de coordinador inicializado correctamente');
}

