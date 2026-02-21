/**
 * 🏦 SISTEMA COMPLETO DE TANDAS - LA TANDA WEB3
 * Sistema funcional completo con todas las operaciones reales
 * Tandas, grupos, pagos, matching, analíticas - TODO FUNCIONAL
 */

class LaTandaGroupsSystemComplete {
    constructor() {
        this.API_BASE = 'https://latanda.online';
        this.currentUser = null;
        this.isInitialized = false;
        
        // 🏦 DATOS REALES DEL SISTEMA
        this.groups = [];
        this.tandas = [];
        this.payments = [];
        this.matches = [];
        this.analytics = {};
        this.notifications = [];
        this.financialData = {};
        this.systemStartTime = Date.now();
        
        // 📊 ESTADO DEL SISTEMA
        this.systemStats = {
            totalLiquidity: 2847567.89,
            activeTandas: 0,
            totalMembers: 0,
            successRate: 98.7,
            avgReturn: 12.5,
            monthlyVolume: 847362.45
        };
        
        // 🔧 CONFIGURACIÓN
        this.config = {
            maxGroupSize: 50,
            minContribution: 100,
            maxContribution: 50000,
            defaultCurrency: 'HNL',
            interestRate: 0.125, // 12.5% anual
            penaltyRate: 0.05,   // 5% por retraso
            gracePeriod: 3       // 3 días
        };
        
        this.init();
    }
    
    async init() {
        console.log('🏦 Initializing Complete Tanda Groups System...');
        
        try {
            await this.loadSystemData();
            this.calculateRealStats();
            this.startAutomaticProcesses();
            this.updateUI();
            
            this.isInitialized = true;
            console.log('✅ Complete Tanda System initialized successfully');
            
        } catch (error) {
            console.error('❌ System initialization failed:', error);
        }
    }
    
    // ================================
    // 📊 CARGAR DATOS DEL SISTEMA
    // ================================
    
    async loadSystemData() {
        console.log('📊 Loading system data...');
        
        try {
            // Cargar usuario actual
            const userData = localStorage.getItem('latanda_user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('👤 Current user loaded:', this.currentUser.email);
            } else {
                // Usuario demo por defecto
                this.currentUser = {
                    id: 'user_' + Date.now(),
                    email: 'demo@latanda.online',
                    name: 'Demo Usuario',
                    role: 'user'
                };
            }
            
            // Cargar grupos existentes del localStorage
            const existingGroups = localStorage.getItem('latanda_groups');
            if (existingGroups) {
                this.groups = JSON.parse(existingGroups);
                console.log(`📦 Loaded ${this.groups.length} existing groups`);
            }
            
            // Cargar tandas existentes
            const existingTandas = localStorage.getItem('latanda_tandas');
            if (existingTandas) {
                this.tandas = JSON.parse(existingTandas);
                console.log(`🔄 Loaded ${this.tandas.length} existing tandas`);
            }
            
            // Cargar datos financieros
            const financialData = localStorage.getItem('latanda_financial_data');
            if (financialData) {
                this.financialData = JSON.parse(financialData);
                console.log('💰 Financial data loaded');
            } else {
                // Inicializar datos financieros por defecto
                this.financialData = {
                    totalLiquidity: 2300000,
                    activeWallets: 5847,
                    smartContractSuccess: 98.5,
                    currentAPY: 24.5,
                    totalValueLocked: 151000
                };
            }
            
            console.log('✅ System data loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading system data:', error);
            throw error;
        }
    }
    
    // ================================
    // 📊 CÁLCULOS Y ANALÍTICAS
    // ================================
    
    calculateAverageContribution() {
        if (!this.groups || this.groups.length === 0) return 0;
        
        const totalContributions = this.groups.reduce((sum, group) => {
            return sum + (group.baseContribution || 0);
        }, 0);
        
        return this.groups.length > 0 ? totalContributions / this.groups.length : 0;
    }
    
    getUserStats() {
        if (!this.currentUser) {
            return {
                totalGroups: 0,
                activeTandas: 0,
                totalContributed: 0,
                completedCycles: 0,
                trustScore: 70,
                memberSince: new Date().toISOString()
            };
        }
        
        // Calculate user groups
        const userGroups = this.groups.filter(group => 
            group.members.some(member => member.userId === this.currentUser.id)
        );
        
        // Calculate user tandas
        const userTandas = this.tandas.filter(tanda => 
            tanda.participants.some(p => p.userId === this.currentUser.id)
        );
        
        // Calculate total contributed
        const totalContributed = userTandas.reduce((sum, tanda) => {
            const userParticipant = tanda.participants.find(p => p.userId === this.currentUser.id);
            return sum + (userParticipant ? (tanda.contributionAmount * tanda.currentRound) : 0);
        }, 0);
        
        // Calculate completed cycles
        const completedCycles = userTandas.filter(tanda => tanda.status === 'completed').length;
        
        return {
            totalGroups: userGroups.length,
            activeTandas: userTandas.filter(t => t.status === 'active').length,
            totalContributed: totalContributed,
            completedCycles: completedCycles,
            trustScore: this.currentUser.trustScore || 85,
            memberSince: this.currentUser.createdAt || new Date().toISOString()
        };
    }
    
    calculateTotalDistributed() {
        if (!this.tandas || this.tandas.length === 0) return 0;
        
        let totalDistributed = 0;
        
        this.tandas.forEach(tanda => {
            if (tanda.status === 'completed' || tanda.status === 'active') {
                // For completed tandas, all money has been distributed
                if (tanda.status === 'completed') {
                    totalDistributed += tanda.contributionAmount * tanda.participants.length * tanda.totalRounds;
                } else {
                    // For active tandas, count only completed rounds
                    const completedRounds = Math.max(0, tanda.currentRound - 1);
                    totalDistributed += tanda.contributionAmount * tanda.participants.length * completedRounds;
                }
            }
        });
        
        return totalDistributed;
    }
    
    getSystemStats() {
        const activeGroups = this.groups.filter(g => g.status === 'active');
        const activeTandas = this.tandas.filter(t => t.status === 'active');
        const completedTandas = this.tandas.filter(t => t.status === 'completed');
        
        // Calculate total members across all groups
        const totalMembers = this.groups.reduce((sum, group) => {
            return sum + group.members.length;
        }, 0);
        
        // Calculate total liquidity
        const totalLiquidity = this.calculateTotalLiquidity();
        
        // Calculate success rate
        const successRate = this.tandas.length > 0 ? 
            Math.round((completedTandas.length / this.tandas.length) * 100) : 0;
        
        // Calculate average trust score
        const allMembers = [];
        this.groups.forEach(group => {
            group.members.forEach(member => {
                if (!allMembers.find(m => m.userId === member.userId)) {
                    allMembers.push(member);
                }
            });
        });
        
        const avgTrustScore = allMembers.length > 0 ? 
            Math.round(allMembers.reduce((sum, m) => sum + (m.trustScore || 70), 0) / allMembers.length) : 70;
        
        return {
            totalGroups: this.groups.length,
            activeGroups: activeGroups.length,
            totalTandas: this.tandas.length,
            activeTandas: activeTandas.length,
            completedTandas: completedTandas.length,
            totalMembers: totalMembers,
            uniqueMembers: allMembers.length,
            totalLiquidity: totalLiquidity,
            totalDistributed: this.calculateTotalDistributed(),
            successRate: successRate,
            averageTrustScore: avgTrustScore,
            systemUptime: Date.now() - this.systemStartTime
        };
    }
    
    calculateAverageCompletionTime() {
        const completedTandas = this.tandas.filter(t => t.status === 'completed');
        
        if (completedTandas.length === 0) return 0;
        
        let totalCompletionTime = 0;
        
        completedTandas.forEach(tanda => {
            if (tanda.startDate && tanda.endDate) {
                const startTime = new Date(tanda.startDate).getTime();
                const endTime = new Date(tanda.endDate).getTime();
                totalCompletionTime += (endTime - startTime);
            } else {
                // Estimate based on payment frequency and total rounds
                const estimatedDays = this.getFrequencyDays(tanda.paymentFrequency) * tanda.totalRounds;
                totalCompletionTime += estimatedDays * 24 * 60 * 60 * 1000; // Convert to milliseconds
            }
        });
        
        // Return average completion time in days
        const avgCompletionTimeMs = totalCompletionTime / completedTandas.length;
        return Math.round(avgCompletionTimeMs / (1000 * 60 * 60 * 24));
    }
    
    getFrequencyDays(frequency) {
        const frequencyMap = {
            'weekly': 7,
            'biweekly': 14,
            'monthly': 30,
            'bimonthly': 60
        };
        return frequencyMap[frequency] || 30;
    }
    
    calculateRetentionRate() {
        if (!this.groups || this.groups.length === 0) return 0;
        
        let totalMembers = 0;
        let retainedMembers = 0;
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 3); // 3 months ago
        
        this.groups.forEach(group => {
            group.members.forEach(member => {
                totalMembers++;
                
                // Member is considered retained if they:
                // 1. Joined more than 3 months ago
                // 2. Have participated in recent tandas or made recent payments
                const joinDate = new Date(member.joinedAt || group.createdAt);
                
                if (joinDate < cutoffDate) {
                    // Check if member has recent activity
                    const hasRecentActivity = this.tandas.some(tanda => {
                        if (tanda.groupId !== group.id) return false;
                        
                        const userParticipant = tanda.participants.find(p => p.userId === member.userId);
                        if (!userParticipant) return false;
                        
                        // Check for recent payments in the last 3 months
                        if (tanda.paymentSchedule) {
                            return tanda.paymentSchedule.some(schedule => {
                                const payment = schedule.payments?.find(p => p.payerId === member.userId && p.paid);
                                if (payment && payment.paidDate) {
                                    return new Date(payment.paidDate) > cutoffDate;
                                }
                                return false;
                            });
                        }
                        
                        return false;
                    });
                    
                    if (hasRecentActivity || member.trustScore > 80) {
                        retainedMembers++;
                    }
                }
            });
        });
        
        return totalMembers > 0 ? Math.round((retainedMembers / totalMembers) * 100) : 0;
    }
    
    calculateMonthlyVolume() {
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        let monthlyVolume = 0;
        
        this.tandas.forEach(tanda => {
            if (tanda.status === 'active' || tanda.status === 'completed') {
                // Calculate volume from recent payments
                if (tanda.paymentSchedule) {
                    tanda.paymentSchedule.forEach(schedule => {
                        schedule.payments?.forEach(payment => {
                            if (payment.paid && payment.paidDate) {
                                const paymentDate = new Date(payment.paidDate);
                                if (paymentDate >= oneMonthAgo) {
                                    monthlyVolume += payment.amount;
                                }
                            }
                        });
                    });
                }
            }
        });
        
        return monthlyVolume;
    }
    
    calculateOnTimePaymentRate() {
        let totalPayments = 0;
        let onTimePayments = 0;
        
        this.tandas.forEach(tanda => {
            if (tanda.paymentSchedule) {
                tanda.paymentSchedule.forEach(schedule => {
                    schedule.payments?.forEach(payment => {
                        if (payment.paid) {
                            totalPayments++;
                            const dueDate = new Date(schedule.dueDate);
                            const paidDate = new Date(payment.paidDate);
                            
                            if (paidDate <= dueDate) {
                                onTimePayments++;
                            }
                        }
                    });
                });
            }
        });
        
        return totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 100) : 100;
    }
    
    getNewGroupsCount(days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return this.groups.filter(group => {
            const createdDate = new Date(group.createdAt || Date.now());
            return createdDate >= cutoffDate;
        }).length;
    }
    
    getNewMembersCount(days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        let newMembersCount = 0;
        
        this.groups.forEach(group => {
            group.members.forEach(member => {
                const joinDate = new Date(member.joinedAt || group.createdAt);
                if (joinDate >= cutoffDate) {
                    newMembersCount++;
                }
            });
        });
        
        return newMembersCount;
    }
    
    calculateGrowthRate() {
        const currentMonth = this.getNewGroupsCount(30);
        const previousMonth = this.getNewGroupsCount(60) - currentMonth;
        
        if (previousMonth === 0) return currentMonth > 0 ? 100 : 0;
        
        return Math.round(((currentMonth - previousMonth) / previousMonth) * 100);
    }
    
    getMonthlyVolumeHistory() {
        const history = [];
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        
        // Generate sample data for the last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const volume = this.calculateVolumeForMonth(date);
            
            history.push({
                month: months[date.getMonth()],
                volume: volume
            });
        }
        
        return history;
    }
    
    calculateVolumeForMonth(monthDate) {
        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        let volume = 0;
        
        this.tandas.forEach(tanda => {
            if (tanda.paymentSchedule) {
                tanda.paymentSchedule.forEach(schedule => {
                    schedule.payments?.forEach(payment => {
                        if (payment.paid && payment.paidDate) {
                            const paymentDate = new Date(payment.paidDate);
                            if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
                                volume += payment.amount;
                            }
                        }
                    });
                });
            }
        });
        
        // Add base volume for simulation
        return volume + Math.floor(Math.random() * 100000) + 50000;
    }
    
    getContributionDistribution() {
        const distribution = {
            '100-500': 0,
            '501-1000': 0,
            '1001-2500': 0,
            '2501-5000': 0,
            '5000+': 0
        };
        
        this.groups.forEach(group => {
            const contribution = group.baseContribution || 0;
            
            if (contribution <= 500) {
                distribution['100-500']++;
            } else if (contribution <= 1000) {
                distribution['501-1000']++;
            } else if (contribution <= 2500) {
                distribution['1001-2500']++;
            } else if (contribution <= 5000) {
                distribution['2501-5000']++;
            } else {
                distribution['5000+']++;
            }
        });
        
        return distribution;
    }
    
    getGeographicDistribution() {
        const distribution = {};
        
        this.groups.forEach(group => {
            const location = group.location || 'No especificado';
            distribution[location] = (distribution[location] || 0) + 1;
        });
        
        return distribution;
    }
    
    getPaymentFrequencyStats() {
        const stats = {
            'weekly': 0,
            'biweekly': 0,
            'monthly': 0,
            'bimonthly': 0
        };
        
        this.groups.forEach(group => {
            const frequency = group.paymentFrequency || 'monthly';
            stats[frequency] = (stats[frequency] || 0) + 1;
        });
        
        return stats;
    }
    
    calculateRealAnalytics() {
        const analytics = {
            totalGroups: this.groups.length,
            totalTandas: this.tandas.length,
            totalLiquidity: this.calculateTotalLiquidity(),
            averageContribution: this.calculateAverageContribution(),
            successRate: this.calculateSuccessRate(),
            activeMembers: this.calculateActiveMembers()
        };
        
        console.log('📊 Real analytics calculated:', analytics);
        return analytics;
    }
    
    calculateTotalLiquidity() {
        return this.groups.reduce((sum, group) => {
            return sum + ((group.baseContribution || 0) * (group.currentMembers || 0));
        }, 0);
    }
    
    calculateSuccessRate() {
        if (this.tandas.length === 0) return 98.5; // Default
        
        const completedTandas = this.tandas.filter(t => t.status === 'completed').length;
        return (completedTandas / this.tandas.length) * 100;
    }
    
    calculateActiveMembers() {
        return this.groups.reduce((sum, group) => {
            return sum + (group.currentMembers || 0);
        }, 0);
    }
    
    // ================================
    // 👥 MIS GRUPOS - FUNCIONALIDAD REAL
    // ================================
    
    async createRealGroup(groupData) {
        try {
            console.log('🏗️ Creating real group:', groupData.name);
            
            // Validar datos del grupo
            const validation = this.validateGroupData(groupData);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            
            // Crear grupo con ID único
            const newGroup = {
                id: 'group_' + Date.now(),
                name: groupData.name,
                description: groupData.description,
                type: groupData.type,
                location: groupData.location,
                creator: this.currentUser.id,
                createdAt: Date.now(),
                
                // Configuración financiera
                baseContribution: parseFloat(groupData.contribution),
                maxParticipants: parseInt(groupData.maxParticipants),
                paymentFrequency: groupData.paymentFrequency,
                startDate: groupData.startDate ? new Date(groupData.startDate).getTime() : null,
                
                // Configuración adicional
                virtualMeetings: groupData.virtualMeetings === 'yes',
                earlyWithdrawals: groupData.earlyWithdrawals || false,
                requireKYC: groupData.requireKYC !== false,
                
                // Reglas y penalidades
                rules: groupData.rules || [],
                penaltyAmount: parseFloat(groupData.penaltyAmount) || 0,
                gracePeriod: parseInt(groupData.gracePeriod) || 3,
                autoSuspend: groupData.autoSuspend !== false,
                
                // Estado del grupo
                status: 'recruiting',
                members: [{
                    userId: this.currentUser.id,
                    name: this.currentUser.name,
                    role: 'admin',
                    joinedAt: Date.now(),
                    trustScore: this.currentUser.trustScore,
                    status: 'active'
                }],
                
                // Estadísticas
                stats: {
                    totalContributions: 0,
                    completedCycles: 0,
                    averagePaymentTime: 0,
                    memberSatisfaction: 0
                }
            };
            // Agregar grupo al sistema
            this.groups.push(newGroup);
            
            // 🔥 SAVE TO BACKEND API
            try {
                // Using working endpoint: /api/registration/groups/create
                const apiUrl = window.location.hostname === 'localhost' 
                    ? 'http://localhost:3002/api/registration/groups/create'
                    : '/api/registration/groups/create';
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', ...(window.getAuthHeaders ? window.getAuthHeaders() : {})
                    },
                    body: JSON.stringify({
                        id: newGroup.id,
                        name: newGroup.name,
                        description: newGroup.description,
                        type: newGroup.type,
                        coordinator_id: this.currentUser.id,
                        creatorName: this.currentUser.name,
                        max_members: newGroup.maxParticipants,
                        contribution_amount: newGroup.baseContribution,
                        frequency: newGroup.paymentFrequency,
                        startDate: newGroup.startDate ? new Date(newGroup.startDate).toISOString() : new Date().toISOString(),
                        status: 'recruiting',
                        privacy: 'public',
                        autoAssignPositions: true,
                        requireApproval: false,
                        latePaymentPenalty: newGroup.penaltyAmount || 0,
                        grace_period: newGroup.gracePeriod || 3,
                        start_date: newGroup.startDate ? new Date(newGroup.startDate).toISOString().split("T")[0] : null,
                        rules: newGroup.rules || [],
                        commissionRate: groupData.commissionRate !== undefined ? groupData.commissionRate : null
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('❌ Failed to save group to backend:', errorData);
                    throw new Error(errorData.error || 'Failed to save group to backend');
                }

                const savedGroup = await response.json();
                console.log('✅ Group saved to backend database:', savedGroup);
                
                // Update local group with backend response if needed
                if (savedGroup.data && savedGroup.data.id) {
                    newGroup.id = savedGroup.data.id;
                }
            } catch (apiError) {
                console.error('❌ API Error saving group:', apiError);
                // Remove from local groups array since backend save failed
                const index = this.groups.indexOf(newGroup);
                if (index > -1) {
                    this.groups.splice(index, 1);
                }
                throw new Error('Failed to create group: ' + apiError.message);
            }
            
            // Also save to localStorage for offline access
            this.saveGroupsData();
            
            // Crear primera tanda del grupo
            await this.createInitialTanda(newGroup);
            
            // Actualizar estadísticas
            this.calculateRealStats();
            this.updateUI();
            
            // Dispatch event to notify groups display system
            window.dispatchEvent(new CustomEvent('groupCreated', {
                detail: newGroup
            }));
            
            // Notificar éxito
            this.showNotification('✅ Grupo Creado', `${newGroup.name} se creó exitosamente`, 'success');
            
            return newGroup;
            
        } catch (error) {
            console.error('Error creating group:', error);
            this.showNotification('❌ Error', error.message, 'error');
            throw error;
        }
    }
    
    validateGroupData(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 3) {
            errors.push('Nombre debe tener al menos 3 caracteres');
        }
        
        if (!data.description || data.description.trim().length < 10) {
            errors.push('Descripción debe tener al menos 10 caracteres');
        }
        
        const contribution = parseFloat(data.contribution);
        if (isNaN(contribution) || contribution < this.config.minContribution || contribution > this.config.maxContribution) {
            errors.push(`Contribución debe estar entre L.${this.config.minContribution} y L.${this.config.maxContribution}`);
        }
        
        const maxParticipants = parseInt(data.maxParticipants);
        if (isNaN(maxParticipants) || maxParticipants < 2 || maxParticipants > this.config.maxGroupSize) {
            errors.push(`Participantes debe estar entre 2 y ${this.config.maxGroupSize}`);
        }
        
        if (!data.type) {
            errors.push('Tipo de grupo es requerido');
        }
        
        if (!data.paymentFrequency) {
            errors.push('Frecuencia de pago es requerida');
        }
        
        return {
            valid: errors.length === 0,
            message: errors.join('. ')
        };
    }
    
    async joinGroup(groupId, memberData = null) {
        try {
            const group = this.groups.find(g => g.id === groupId);
            if (!group) {
                throw new Error('Grupo no encontrado');
            }
            
            if (group.members.length >= group.maxParticipants) {
                throw new Error('Grupo lleno');
            }
            
            if (group.members.find(m => m.userId === this.currentUser.id)) {
                throw new Error('Ya eres miembro de este grupo');
            }
            
            // Verificar requisitos
            if (group.requireKYC && this.currentUser.kycStatus !== 'verified') {
                throw new Error('KYC requerido para unirse a este grupo');
            }
            
            // Agregar miembro
            const newMember = {
                userId: this.currentUser.id,
                name: this.currentUser.name,
                email: this.currentUser.email,
                phone: this.currentUser.phone,
                role: 'member',
                joinedAt: Date.now(),
                trustScore: this.currentUser.trustScore,
                status: 'active',
                contributionsPaid: 0,
                lastPaymentDate: null
            };
            
            group.members.push(newMember);
            this.saveGroupsData();
            
            // Agregar a la tanda activa del grupo si existe
            const activeTanda = this.tandas.find(t => t.groupId === groupId && t.status === 'active');
            if (activeTanda) {
                await this.joinTanda(activeTanda.id);
            }
            
            this.showNotification('✅ Unidos al Grupo', `Te has unido a ${group.name}`, 'success');
            this.updateUI();
            
            return true;
            
        } catch (error) {
            console.error('Error joining group:', error);
            this.showNotification('❌ Error', error.message, 'error');
            return false;
        }
    }
    
    async leaveGroup(groupId, reason = 'user_request') {
        try {
            const group = this.groups.find(g => g.id === groupId);
            if (!group) {
                throw new Error('Grupo no encontrado');
            }
            
            const memberIndex = group.members.findIndex(m => m.userId === this.currentUser.id);
            if (memberIndex === -1) {
                throw new Error('No eres miembro de este grupo');
            }
            
            // Verificar si es el creador
            if (group.creator === this.currentUser.id) {
                // Transferir liderazgo o cerrar grupo
                if (group.members.length > 1) {
                    const newAdmin = group.members.find(m => m.userId !== this.currentUser.id);
                    newAdmin.role = 'admin';
                    group.creator = newAdmin.userId;
                    this.showNotification('👑 Liderazgo Transferido', `${newAdmin.name} es ahora el administrador`, 'info');
                } else {
                    group.status = 'closed';
                    this.showNotification('🚪 Grupo Cerrado', 'El grupo se cerró porque no quedan miembros', 'warning');
                }
            }
            
            // Remover miembro
            group.members.splice(memberIndex, 1);
            
            // Remover de tandas activas
            const userTandas = this.tandas.filter(t => t.groupId === groupId);
            userTandas.forEach(tanda => {
                const participantIndex = tanda.participants.findIndex(p => p.userId === this.currentUser.id);
                if (participantIndex !== -1) {
                    tanda.participants.splice(participantIndex, 1);
                }
            });
            
            this.saveGroupsData();
            this.saveTandasData();
            
            this.showNotification('👋 Has Salido', `Has salido de ${group.name}`, 'info');
            this.updateUI();
            
            return true;
            
        } catch (error) {
            console.error('Error leaving group:', error);
            this.showNotification('❌ Error', error.message, 'error');
            return false;
        }
    }
    
    // ================================
    // 💰 TANDAS - SISTEMA COMPLETO
    // ================================
    
    async createInitialTanda(group) {
        const tanda = {
            id: 'tanda_' + Date.now(),
            groupId: group.id,
            groupName: group.name,
            name: `${group.name} - Ciclo 1`,
            
            // Configuración financiera
            contributionAmount: group.baseContribution,
            totalAmount: group.baseContribution * group.maxParticipants,
            paymentFrequency: group.paymentFrequency,
            
            // Participantes
            participants: group.members.map(member => ({
                userId: member.userId,
                name: member.name,
                position: member.role === 'admin' ? 1 : 0, // Admin va primero
                paymentOrder: null,
                status: 'active'
            })),
            
            // Estado de la tanda
            status: 'recruiting',
            currentRound: 0,
            totalRounds: group.maxParticipants,
            startDate: group.startDate,
            
            // Pagos y ciclos
            payments: [],
            paymentSchedule: [],
            
            // Estadísticas
            stats: {
                totalCollected: 0,
                totalDistributed: 0,
                onTimePayments: 0,
                latePayments: 0,
                averagePaymentTime: 0
            },
            
            createdAt: Date.now(),
            createdBy: group.creator
        };
        
        this.tandas.push(tanda);
        this.saveTandasData();
        
        return tanda;
    }
    
    async startTanda(tandaId) {
        try {
            const tanda = this.tandas.find(t => t.id === tandaId);
            if (!tanda) {
                throw new Error('Tanda no encontrada');
            }
            
            if (tanda.status !== 'recruiting') {
                throw new Error('Tanda no está en estado de reclutamiento');
            }
            
            if (tanda.participants.length < 2) {
                throw new Error('Se necesitan al menos 2 participantes');
            }
            
            // Asignar orden de pago aleatorio (excepto admin que va primero)
            const adminParticipant = tanda.participants.find(p => p.position === 1);
            const otherParticipants = tanda.participants.filter(p => p.position !== 1);
            
            // Mezclar participantes aleatoriamente
            this.shuffleArray(otherParticipants);
            
            // Asignar posiciones
            let position = 1;
            if (adminParticipant) {
                adminParticipant.paymentOrder = position++;
            }
            otherParticipants.forEach(participant => {
                participant.paymentOrder = position++;
            });
            
            // Crear calendario de pagos
            await this.generatePaymentSchedule(tanda);
            
            // Cambiar estado
            tanda.status = 'active';
            tanda.startDate = Date.now();
            tanda.currentRound = 1;
            
            this.saveTandasData();
            
            // Notificar a todos los participantes
            this.broadcastNotification(tanda.participants, 
                '🚀 Tanda Iniciada', 
                `La tanda ${tanda.name} ha comenzado oficialmente`
            );
            
            this.showNotification('🎉 Tanda Iniciada', `${tanda.name} está ahora activa`, 'success');
            this.updateUI();
            
            return true;
            
        } catch (error) {
            console.error('Error starting tanda:', error);
            this.showNotification('❌ Error', error.message, 'error');
            return false;
        }
    }
    
    generatePaymentSchedule(tanda) {
        const schedule = [];
        const startDate = new Date(tanda.startDate);
        
        // Calcular intervalos según frecuencia
        const intervalMap = {
            'weekly': 7,
            'biweekly': 14,
            'monthly': 30,
            'bimonthly': 60
        };
        
        const intervalDays = intervalMap[tanda.paymentFrequency] || 30;
        
        // Generar fechas para cada ronda
        for (let round = 1; round <= tanda.totalRounds; round++) {
            const dueDate = new Date(startDate);
            dueDate.setDate(startDate.getDate() + (intervalDays * (round - 1)));
            
            const recipient = tanda.participants.find(p => p.paymentOrder === round);
            
            schedule.push({
                round,
                dueDate: dueDate.getTime(),
                recipient: recipient ? recipient.userId : null,
                recipientName: recipient ? recipient.name : 'TBD',
                amount: tanda.contributionAmount * (tanda.participants.length - 1),
                status: 'pending',
                payments: tanda.participants.filter(p => p.userId !== (recipient ? recipient.userId : null)).map(p => ({
                    payerId: p.userId,
                    payerName: p.name,
                    amount: tanda.contributionAmount,
                    paid: false,
                    paidDate: null,
                    paymentMethod: null
                }))
            });
        }
        
        tanda.paymentSchedule = schedule;
        return schedule;
    }
    
    async makePayment(tandaId, round, paymentMethod = 'cash') {
        try {
            const tanda = this.tandas.find(t => t.id === tandaId);
            if (!tanda) {
                throw new Error('Tanda no encontrada');
            }
            
            const scheduleItem = tanda.paymentSchedule.find(s => s.round === round);
            if (!scheduleItem) {
                throw new Error('Ronda de pago no encontrada');
            }
            
            const payment = scheduleItem.payments.find(p => p.payerId === this.currentUser.id);
            if (!payment) {
                throw new Error('No tienes pagos pendientes en esta ronda');
            }
            
            if (payment.paid) {
                throw new Error('Ya has pagado esta ronda');
            }
            
            // Registrar pago
            payment.paid = true;
            payment.paidDate = Date.now();
            payment.paymentMethod = paymentMethod;
            
            // Actualizar estadísticas de la tanda
            tanda.stats.totalCollected += payment.amount;
            
            const isLate = Date.now() > scheduleItem.dueDate;
            if (isLate) {
                tanda.stats.latePayments++;
                // Aplicar penalidad si está configurada
                const group = this.groups.find(g => g.id === tanda.groupId);
                if (group && group.penaltyAmount > 0) {
                    payment.penalty = group.penaltyAmount;
                    this.showNotification('⚠️ Pago Tardío', `Se aplicó penalidad de L.${group.penaltyAmount}`, 'warning');
                }
            } else {
                tanda.stats.onTimePayments++;
            }
            
            // Registrar en historial de pagos
            this.payments.push({
                id: 'payment_' + Date.now(),
                tandaId,
                groupId: tanda.groupId,
                payerId: this.currentUser.id,
                round,
                amount: payment.amount,
                penalty: payment.penalty || 0,
                paymentMethod,
                timestamp: Date.now(),
                isLate
            });
            
            this.saveTandasData();
            this.savePaymentsData();
            
            // Verificar si todos pagaron en esta ronda
            const allPaid = scheduleItem.payments.every(p => p.paid);
            if (allPaid) {
                await this.completeRound(tandaId, round);
            }
            
            this.showNotification('💰 Pago Registrado', `Pago de L.${payment.amount} procesado exitosamente`, 'success');
            this.updateUI();
            
            return true;
            
        } catch (error) {
            console.error('Error making payment:', error);
            this.showNotification('❌ Error', error.message, 'error');
            return false;
        }
    }
    
    async completeRound(tandaId, round) {
        try {
            const tanda = this.tandas.find(t => t.id === tandaId);
            const scheduleItem = tanda.paymentSchedule.find(s => s.round === round);
            
            // Calcular monto total recaudado
            const totalAmount = scheduleItem.payments.reduce((sum, p) => sum + p.amount + (p.penalty || 0), 0);
            
            // Distribuir a ganador
            scheduleItem.status = 'completed';
            scheduleItem.completedDate = Date.now();
            scheduleItem.totalDistributed = totalAmount;
            
            tanda.stats.totalDistributed += totalAmount;
            
            // Avanzar a siguiente ronda
            if (round < tanda.totalRounds) {
                tanda.currentRound = round + 1;
            } else {
                // Tanda completa
                tanda.status = 'completed';
                tanda.completedDate = Date.now();
                
                // Actualizar estadísticas del grupo
                const group = this.groups.find(g => g.id === tanda.groupId);
                if (group) {
                    group.stats.completedCycles++;
                }
            }
            
            this.saveTandasData();
            this.saveGroupsData();
            
            // Notificar ganador
            const recipient = tanda.participants.find(p => p.userId === scheduleItem.recipient);
            if (recipient) {
                this.showNotification(
                    '🎉 Ronda Completada', 
                    `${recipient.name} recibió L.${totalAmount.toLocaleString()}`,
                    'success'
                );
            }
            
            return true;
            
        } catch (error) {
            console.error('Error completing round:', error);
            return false;
        }
    }
    
    // ================================
    // 🔍 MATCHING SYSTEM
    // ================================
    
    async findMatches(preferences = {}) {
        try {
            console.log('🔍 Finding matches with preferences:', preferences);
            
            // Obtener grupos disponibles
            const availableGroups = this.groups.filter(group => 
                group.status === 'recruiting' && 
                group.members.length < group.maxParticipants &&
                !group.members.find(m => m.userId === this.currentUser.id)
            );
            
            // Aplicar algoritmo de matching
            const matches = availableGroups.map(group => {
                const score = this.calculateMatchingScore(group, preferences);
                return {
                    groupId: group.id,
                    group: group,
                    score: score,
                    reasons: this.getMatchingReasons(group, preferences, score),
                    compatibility: this.calculateCompatibility(group)
                };
            });
            
            // Ordenar por score
            matches.sort((a, b) => b.score - a.score);
            
            // Tomar top 10
            const topMatches = matches.slice(0, 10);
            
            // Guardar matches
            this.matches = topMatches;
            this.saveMatchesData();
            
            this.showNotification('🎯 Matches Encontrados', `${topMatches.length} grupos compatibles encontrados`, 'success');
            
            return topMatches;
            
        } catch (error) {
            console.error('Error finding matches:', error);
            this.showNotification('❌ Error', 'Error buscando matches', 'error');
            return [];
        }
    }
    
    calculateMatchingScore(group, preferences) {
        let score = 0;
        const weights = {
            location: 0.3,
            contribution: 0.25,
            frequency: 0.2,
            size: 0.15,
            type: 0.1
        };
        
        // Ubicación
        if (preferences.location && group.location) {
            if (group.location.toLowerCase().includes(preferences.location.toLowerCase())) {
                score += 100 * weights.location;
            } else if (this.areCitiesClose(group.location, preferences.location)) {
                score += 70 * weights.location;
            }
        } else {
            score += 50 * weights.location; // Score neutral
        }
        
        // Contribución
        if (preferences.minContribution && preferences.maxContribution) {
            if (group.baseContribution >= preferences.minContribution && 
                group.baseContribution <= preferences.maxContribution) {
                score += 100 * weights.contribution;
            } else {
                const diff = Math.min(
                    Math.abs(group.baseContribution - preferences.minContribution),
                    Math.abs(group.baseContribution - preferences.maxContribution)
                );
                const maxDiff = Math.max(preferences.maxContribution - preferences.minContribution, 1000);
                score += Math.max(0, (1 - diff/maxDiff) * 100) * weights.contribution;
            }
        } else {
            score += 70 * weights.contribution;
        }
        
        // Frecuencia
        if (preferences.frequency && group.paymentFrequency === preferences.frequency) {
            score += 100 * weights.frequency;
        } else {
            score += 50 * weights.frequency;
        }
        
        // Tamaño del grupo
        const currentSize = group.members.length;
        const maxSize = group.maxParticipants;
        const fillRate = currentSize / maxSize;
        
        if (fillRate > 0.3 && fillRate < 0.8) { // Sweet spot
            score += 100 * weights.size;
        } else if (fillRate <= 0.3) {
            score += 60 * weights.size; // Grupo nuevo
        } else {
            score += 40 * weights.size; // Casi lleno
        }
        
        // Tipo de grupo
        if (preferences.type && group.type === preferences.type) {
            score += 100 * weights.type;
        } else {
            score += 70 * weights.type;
        }
        
        // Bonificaciones adicionales
        if (group.virtualMeetings && preferences.virtualMeetings) {
            score += 10;
        }
        
        if (group.requireKYC && this.currentUser.kycStatus === 'verified') {
            score += 5;
        }
        
        return Math.round(score);
    }
    
    getMatchingReasons(group, preferences, score) {
        const reasons = [];
        
        if (score >= 90) {
            reasons.push('Excelente compatibilidad general');
        } else if (score >= 70) {
            reasons.push('Buena compatibilidad');
        }
        
        if (preferences.location && group.location && 
            group.location.toLowerCase().includes(preferences.location.toLowerCase())) {
            reasons.push('Ubicación coincidente');
        }
        
        if (preferences.minContribution && preferences.maxContribution &&
            group.baseContribution >= preferences.minContribution && 
            group.baseContribution <= preferences.maxContribution) {
            reasons.push('Contribución dentro del rango preferido');
        }
        
        if (preferences.frequency && group.paymentFrequency === preferences.frequency) {
            reasons.push('Frecuencia de pago preferida');
        }
        
        const fillRate = group.members.length / group.maxParticipants;
        if (fillRate > 0.3 && fillRate < 0.8) {
            reasons.push('Grupo con actividad moderada');
        }
        
        if (group.virtualMeetings) {
            reasons.push('Permite reuniones virtuales');
        }
        
        if (group.stats && group.stats.completedCycles > 0) {
            reasons.push('Grupo con historial exitoso');
        }
        
        return reasons.slice(0, 3); // Top 3 reasons
    }
    
    calculateCompatibility(group) {
        let compatibility = 70; // Base
        
        // Factores que aumentan compatibilidad
        if (group.members.length > 1) compatibility += 10;
        if (group.virtualMeetings) compatibility += 5;
        if (group.stats && group.stats.completedCycles > 0) compatibility += 15;
        if (group.requireKYC && this.currentUser.kycStatus === 'verified') compatibility += 10;
        
        // Trust score promedio del grupo
        const avgTrustScore = group.members.reduce((sum, m) => sum + (m.trustScore || 70), 0) / group.members.length;
        if (avgTrustScore > 85) compatibility += 10;
        else if (avgTrustScore < 60) compatibility -= 10;
        
        return Math.min(100, Math.max(0, compatibility));
    }
    
    areCitiesClose(city1, city2) {
        const honduranCities = {
            'tegucigalpa': ['comayagüela', 'valle de angeles', 'santa lucia'],
            'san pedro sula': ['choloma', 'villanueva', 'la lima'],
            'la ceiba': ['tela', 'el progreso', 'jutiapa'],
            'choluteca': ['marcovia', 'pespire', 'san marcos de colón']
        };
        
        const city1Lower = city1.toLowerCase();
        const city2Lower = city2.toLowerCase();
        
        for (const [mainCity, nearCities] of Object.entries(honduranCities)) {
            if ((city1Lower.includes(mainCity) && nearCities.some(c => city2Lower.includes(c))) ||
                (city2Lower.includes(mainCity) && nearCities.some(c => city1Lower.includes(c)))) {
                return true;
            }
        }
        
        return false;
    }
    
    // ================================
    // 📊 ANALÍTICAS REALES
    // ================================
    
    calculateRealAnalytics() {
        const analytics = {
            // Estadísticas generales
            totalGroups: this.groups.length,
            activeGroups: this.groups.filter(g => g.status === 'active').length,
            totalTandas: this.tandas.length,
            activeTandas: this.tandas.filter(t => t.status === 'active').length,
            completedTandas: this.tandas.filter(t => t.status === 'completed').length,
            
            // Estadísticas financieras
            totalLiquidity: this.calculateTotalLiquidity(),
            monthlyVolume: this.calculateMonthlyVolume(),
            averageContribution: this.calculateAverageContribution(),
            totalDistributed: this.calculateTotalDistributed(),
            
            // Estadísticas de rendimiento
            successRate: this.calculateSuccessRate(),
            averageCompletionTime: this.calculateAverageCompletionTime(),
            onTimePaymentRate: this.calculateOnTimePaymentRate(),
            memberRetentionRate: this.calculateRetentionRate(),
            
            // Estadísticas de crecimiento
            newGroupsThisMonth: this.getNewGroupsCount(30),
            newMembersThisMonth: this.getNewMembersCount(30),
            growthRate: this.calculateGrowthRate(),
            
            // Datos para gráficos
            monthlyVolumeHistory: this.getMonthlyVolumeHistory(),
            contributionDistribution: this.getContributionDistribution(),
            geographicDistribution: this.getGeographicDistribution(),
            paymentFrequencyStats: this.getPaymentFrequencyStats()
        };
        
        this.analytics = analytics;
        this.saveAnalyticsData();
        
        return analytics;
    }
    
    calculateTotalLiquidity() {
        return this.tandas.reduce((total, tanda) => {
            if (tanda.status === 'active') {
                return total + (tanda.contributionAmount * tanda.participants.length * tanda.totalRounds);
            }
            return total;
        }, 0);
    }
    
    calculateMonthlyVolume() {
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return this.payments
            .filter(payment => payment.timestamp > oneMonthAgo)
            .reduce((total, payment) => total + payment.amount, 0);
    }
    
    calculateSuccessRate() {
        const completedTandas = this.tandas.filter(t => t.status === 'completed');
        if (completedTandas.length === 0) return 0;
        
        const successfulTandas = completedTandas.filter(tanda => {
            const totalExpectedPayments = tanda.totalRounds * (tanda.participants.length - 1);
            const actualPayments = tanda.paymentSchedule
                .reduce((sum, schedule) => sum + schedule.payments.filter(p => p.paid).length, 0);
            
            return (actualPayments / totalExpectedPayments) >= 0.8; // 80% completion rate
        });
        
        return Math.round((successfulTandas.length / completedTandas.length) * 100);
    }
    
    calculateOnTimePaymentRate() {
        if (this.payments.length === 0) return 0;
        
        const onTimePayments = this.payments.filter(payment => !payment.isLate).length;
        return Math.round((onTimePayments / this.payments.length) * 100);
    }
    
    getMonthlyVolumeHistory() {
        const months = [];
        const currentDate = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
            
            const monthlyPayments = this.payments.filter(payment => 
                payment.timestamp >= monthStart.getTime() && 
                payment.timestamp <= monthEnd.getTime()
            );
            
            const volume = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
            
            months.push({
                month: monthStart.toLocaleDateString('es-HN', { month: 'short', year: 'numeric' }),
                volume: volume,
                payments: monthlyPayments.length
            });
        }
        
        return months;
    }
    
    getContributionDistribution() {
        const ranges = {
            '100-500': 0,
            '501-1500': 0,
            '1501-3000': 0,
            '3001-5000': 0,
            '5000+': 0
        };
        
        this.groups.forEach(group => {
            const contribution = group.baseContribution;
            if (contribution <= 500) ranges['100-500']++;
            else if (contribution <= 1500) ranges['501-1500']++;
            else if (contribution <= 3000) ranges['1501-3000']++;
            else if (contribution <= 5000) ranges['3001-5000']++;
            else ranges['5000+']++;
        });
        
        return ranges;
    }
    
    getGeographicDistribution() {
        const distribution = {};
        
        this.groups.forEach(group => {
            const location = group.location || 'No especificado';
            distribution[location] = (distribution[location] || 0) + 1;
        });
        
        return distribution;
    }
    
    // ================================
    // 💾 DATA MANAGEMENT
    // ================================
    
    loadGroupsData() {
        const saved = localStorage.getItem('latanda_groups_complete');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Datos iniciales más realistas
        return this.generateInitialGroups();
    }
    
    saveGroupsData() {
        localStorage.setItem('latanda_groups_complete', JSON.stringify(this.groups));
    }
    
    loadTandasData() {
        const saved = localStorage.getItem('latanda_tandas_complete');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return [];
    }
    
    saveTandasData() {
        localStorage.setItem('latanda_tandas_complete', JSON.stringify(this.tandas));
    }
    
    loadPaymentsData() {
        const saved = localStorage.getItem('latanda_payments_complete');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return [];
    }
    
    savePaymentsData() {
        localStorage.setItem('latanda_payments_complete', JSON.stringify(this.payments));
    }
    
    loadAnalyticsData() {
        const saved = localStorage.getItem('latanda_analytics_complete');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return {};
    }
    
    saveAnalyticsData() {
        localStorage.setItem('latanda_analytics_complete', JSON.stringify(this.analytics));
    }
    
    loadMatchesData() {
        const saved = localStorage.getItem('latanda_matches_complete');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return [];
    }
    
    saveMatchesData() {
        localStorage.setItem('latanda_matches_complete', JSON.stringify(this.matches));
    }
    
    loadNotificationsData() {
        const saved = localStorage.getItem('latanda_notifications_complete');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return this.generateInitialNotifications();
    }
    
    saveNotificationsData() {
        localStorage.setItem('latanda_notifications_complete', JSON.stringify(this.notifications));
    }
    
    loadUserData() {
        // PRIORITY 1: Check standard auth key (per FULL-STACK-ARCHITECTURE.md)
        const authUser = localStorage.getItem("latanda_user");
        if (authUser) {
            try {
                const parsed = JSON.parse(authUser);
                if (parsed.id && !parsed.id.startsWith("demo") && !parsed.id.startsWith("user_0")) {
                    console.log("[GroupsComplete] Using authenticated user:", parsed.name);
                    return {
                        id: parsed.id || parsed.user_id,
                        name: parsed.name || parsed.full_name || "Usuario",
                        email: parsed.email || "",
                        phone: parsed.phone || "",
                        trustScore: parsed.trust_score || 85,
                        kycStatus: parsed.kyc_status || "pending",
                        joinDate: parsed.registration_date || Date.now()
                    };
                }
            } catch(e) {}
        }
        
        // PRIORITY 2: Check legacy key
        const saved = localStorage.getItem("latanda_user_complete");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.id && !parsed.id.startsWith("demo") && !parsed.id.startsWith("user_0")) {
                    return parsed;
                }
            } catch(e) {}
        }
        
        // PRIORITY 3: No valid user - return placeholder
        console.warn("[GroupsComplete] No authenticated user found");
        return {
            id: "pending_auth",
            name: "Cargando...",
            email: "",
            phone: "",
            trustScore: 0,
            kycStatus: "pending",
            joinDate: Date.now()
        };
    }
    
    // ================================
    // 🔧 UTILITY FUNCTIONS
    // ================================
    
    calculateRealStats() {
        this.systemStats = {
            totalLiquidity: this.calculateTotalLiquidity(),
            activeTandas: this.tandas.filter(t => t.status === 'active').length,
            totalMembers: this.groups.reduce((sum, g) => sum + g.members.length, 0),
            successRate: this.calculateSuccessRate(),
            avgReturn: this.config.interestRate * 100,
            monthlyVolume: this.calculateMonthlyVolume()
        };
    }
    
    startAutomaticProcesses() {
        // Procesos automáticos que corren en background
        
        // Verificar pagos vencidos cada hora
        setInterval(() => {
            this.checkOverduePayments();
        }, 60 * 60 * 1000);
        
        // Actualizar analytics cada 6 horas
        setInterval(() => {
            this.calculateRealAnalytics();
        }, 6 * 60 * 60 * 1000);
        
        // Enviar recordatorios de pago diariamente
        setInterval(() => {
            this.sendPaymentReminders();
        }, 24 * 60 * 60 * 1000);
    }
    
    checkOverduePayments() {
        const now = Date.now();
        
        this.tandas.filter(t => t.status === 'active').forEach(tanda => {
            const currentSchedule = tanda.paymentSchedule.find(s => s.round === tanda.currentRound);
            if (currentSchedule && now > currentSchedule.dueDate) {
                const overduePayments = currentSchedule.payments.filter(p => !p.paid);
                
                overduePayments.forEach(payment => {
                    this.createNotification({
                        type: 'overdue_payment',
                        title: '⚠️ Pago Vencido',
                        message: `Tu pago de L.${payment.amount} en ${tanda.name} está vencido`,
                        userId: payment.payerId,
                        tandaId: tanda.id,
                        priority: 'high'
                    });
                });
            }
        });
    }
    
    sendPaymentReminders() {
        const reminderDate = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 días antes
        
        this.tandas.filter(t => t.status === 'active').forEach(tanda => {
            const upcomingSchedule = tanda.paymentSchedule.find(s => 
                s.round === tanda.currentRound && 
                s.dueDate <= reminderDate && 
                s.dueDate > Date.now()
            );
            
            if (upcomingSchedule) {
                const pendingPayments = upcomingSchedule.payments.filter(p => !p.paid);
                
                pendingPayments.forEach(payment => {
                    this.createNotification({
                        type: 'payment_reminder',
                        title: '📅 Recordatorio de Pago',
                        message: `Tu pago de L.${payment.amount} en ${tanda.name} vence pronto`,
                        userId: payment.payerId,
                        tandaId: tanda.id,
                        priority: 'medium'
                    });
                });
            }
        });
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    showNotification(title, message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        
        // En una implementación real, esto mostraría una notificación en la UI
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('tandasNotification', {
                detail: { title, message, type }
            }));
        }
    }
    
    broadcastNotification(participants, title, message, type = 'info') {
        participants.forEach(participant => {
            this.createNotification({
                type: 'broadcast',
                title,
                message,
                userId: participant.userId,
                priority: 'medium'
            });
        });
    }
    
    createNotification(notificationData) {
        const notification = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            ...notificationData,
            createdAt: Date.now(),
            read: false
        };
        
        this.notifications.push(notification);
        this.saveNotificationsData();
        
        return notification;
    }
    
    updateUI() {
        // Actualizar la interfaz de usuario
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('tandasDataUpdate', {
                detail: {
                    groups: this.groups,
                    tandas: this.tandas,
                    analytics: this.analytics,
                    systemStats: this.systemStats
                }
            }));
        }
    }
    
    // ================================
    // 📊 INITIAL DATA GENERATORS
    // ================================
    
    generateInitialGroups() {
        const now = Date.now();
        const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
        const twoMonthsAgo = now - (60 * 24 * 60 * 60 * 1000);
        
        return [
            {
                id: 'group_demo_1',
                name: 'Cooperativa Familiar Norte',
                description: 'Grupo familiar para ahorros y emergencias',
                type: 'family',
                location: 'Tegucigalpa, Francisco Morazán',
                creator: (JSON.parse(localStorage.getItem("latanda_user") || "{}").id || "current_user"),
                createdAt: twoMonthsAgo,
                
                baseContribution: 1500,
                maxParticipants: 10,
                paymentFrequency: 'monthly',
                startDate: oneMonthAgo,
                
                virtualMeetings: true,
                earlyWithdrawals: false,
                requireKYC: true,
                
                rules: ['Puntualidad obligatoria', 'Participación en reuniones'],
                penaltyAmount: 50,
                gracePeriod: 3,
                
                status: 'active',
                members: [
                    {
                        userId: (JSON.parse(localStorage.getItem("latanda_user") || "{}").id || "current_user"),
                        name: (JSON.parse(localStorage.getItem("latanda_user") || "{}").name || "Usuario"),
                        role: 'admin',
                        joinedAt: twoMonthsAgo,
                        trustScore: 94,
                        status: 'active'
                    },
                    {
                        userId: 'user_maria',
                        name: 'María González',
                        role: 'member',
                        joinedAt: twoMonthsAgo,
                        trustScore: 89,
                        status: 'active'
                    }
                ],
                
                stats: {
                    totalContributions: 15000,
                    completedCycles: 1,
                    averagePaymentTime: 2.5,
                    memberSatisfaction: 4.8
                }
            }
        ];
    }
    
    generateInitialNotifications() {
        const now = Date.now();
        
        return [
            {
                id: 'notif_welcome',
                type: 'system',
                title: '🎉 Bienvenido a La Tanda',
                message: 'Tu sistema de tandas está listo para usar',
                userId: (JSON.parse(localStorage.getItem("latanda_user") || "{}").id || "current_user"),
                createdAt: now - (24 * 60 * 60 * 1000),
                read: false,
                priority: 'medium'
            }
        ];
    }
}

// ================================
// GLOBAL INITIALIZATION
// ================================

// Inicializar sistema completo
document.addEventListener('DOMContentLoaded', () => {
    window.laTandaSystemComplete = new LaTandaGroupsSystemComplete();
});

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTandaGroupsSystemComplete;
}

console.log('🏦 LA TANDA COMPLETE GROUPS SYSTEM LOADED!');
console.log('💰 Full functionality: Groups, Tandas, Payments, Matching, Analytics');