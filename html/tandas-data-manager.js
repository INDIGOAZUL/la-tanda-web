/**
 * ============================================
 * 📊 TANDAS DATA MANAGER - v2.0.0
 * Gestión de datos de tandas con API integration
 * ============================================
 */

class TandasDataManager {
    constructor() {
        this.API_BASE_URL = 'https://api.latanda.online/api';
        this.tandas = [];
        this.filteredTandas = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.userData = null;
        this.stats = {
            active: 0,
            pending: 0,
            completed: 0,
            totalEarnings: 0,
            nextPayment: null,
            nextPaymentDate: null
        };

        console.log('📊 Tandas Data Manager initialized');
        this.init();
    }

    /**
     * Initialize data manager
     */
    async init() {
        try {
            // Get user data from localStorage or session
            this.userData = this.getUserData();

            if (!this.userData || !this.userData.user_id) {
                console.warn('⚠️ No user data found, using default');
                this.userData = { user_id: 'user_test_123' };
            }

            // Load tandas from API
            await this.loadTandas();

            console.log('✅ Tandas Data Manager ready');
        } catch (error) {
            console.error('❌ Error initializing Tandas Data Manager:', error);
        }
    }

    /**
     * Get user data from localStorage
     */
    getUserData() {
        try {
            const userData = localStorage.getItem('latanda_user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    /**
     * Load tandas from API
     */
    async loadTandas() {
        try {
            console.log('🔄 Loading tandas from API...');

            const response = await fetch(`${this.API_BASE_URL}/tandas/my-tandas?user_id=${this.userData.user_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.tandas = data.tandas || [];
                this.filteredTandas = [...this.tandas];
                this.calculateStats();

                console.log(`✅ Loaded ${this.tandas.length} tandas`);

                // Trigger UI update
                this.notifyDataChange();
            } else {
                console.error('❌ API returned error:', data.message);
                this.tandas = [];
                this.filteredTandas = [];
            }

        } catch (error) {
            console.error('❌ Error loading tandas:', error);

            // Fallback to mock data for development
            console.log('📝 Loading mock data as fallback...');
            this.loadMockData();
        }
    }

    /**
     * Load mock data for development/testing
     */
    loadMockData() {
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);

        this.tandas = [
            {
                id: 'tanda_1',
                name: 'Tanda Familiar Octubre',
                description: 'Tanda mensual con la familia',
                total_amount: 5000,
                contribution_per_round: 500,
                participant_count: 10,
                current_participants: 10,
                payment_frequency: 'monthly',
                start_date: '2025-10-01',
                end_date: '2026-08-01',
                status: 'active',
                current_round: 3,
                my_position: 5,
                next_payment_date: nextWeek.toISOString().split('T')[0],
                completion_percentage: 30,
                is_coordinator: true,
                participants: [
                    { name: 'María García', position: 1, status: 'paid' },
                    { name: 'Juan López', position: 2, status: 'paid' },
                    { name: 'Ana Martínez', position: 3, status: 'pending' },
                    { name: 'Carlos Rodríguez', position: 4, status: 'pending' },
                    { name: 'Tú', position: 5, status: 'upcoming' }
                ],
                created_at: '2025-09-15T10:00:00Z',
                updated_at: '2025-11-05T10:00:00Z'
            },
            {
                id: 'tanda_2',
                name: 'Tanda Trabajo Quincenal',
                description: 'Tanda con compañeros de trabajo',
                total_amount: 2400,
                contribution_per_round: 400,
                payment_frequency: 'biweekly',
                participant_count: 6,
                current_participants: 6,
                start_date: '2025-11-01',
                end_date: '2026-02-01',
                status: 'active',
                current_round: 1,
                my_position: 3,
                next_payment_date: '2025-11-15',
                completion_percentage: 16,
                is_coordinator: false,
                participants: [
                    { name: 'Roberto Silva', position: 1, status: 'upcoming' },
                    { name: 'Laura Díaz', position: 2, status: 'upcoming' },
                    { name: 'Tú', position: 3, status: 'upcoming' }
                ],
                created_at: '2025-10-20T14:00:00Z',
                updated_at: '2025-11-05T10:00:00Z'
            },
            {
                id: 'tanda_3',
                name: 'Tanda Vecinos',
                description: 'Tanda semanal del barrio',
                total_amount: 800,
                contribution_per_round: 200,
                payment_frequency: 'weekly',
                participant_count: 4,
                current_participants: 3,
                start_date: '2025-12-01',
                end_date: '2025-12-29',
                status: 'pending',
                current_round: 0,
                my_position: 2,
                next_payment_date: '2025-12-01',
                completion_percentage: 0,
                is_coordinator: false,
                participants: [
                    { name: 'Pedro Hernández', position: 1, status: 'joined' },
                    { name: 'Tú', position: 2, status: 'joined' },
                    { name: 'Sofía González', position: 3, status: 'joined' }
                ],
                created_at: '2025-11-01T09:00:00Z',
                updated_at: '2025-11-05T10:00:00Z'
            },
            {
                id: 'tanda_4',
                name: 'Tanda Ahorro Anual',
                description: 'Tanda completada del año pasado',
                total_amount: 12000,
                contribution_per_round: 1000,
                payment_frequency: 'monthly',
                participant_count: 12,
                current_participants: 12,
                start_date: '2024-01-01',
                end_date: '2024-12-31',
                status: 'completed',
                current_round: 12,
                my_position: 8,
                next_payment_date: null,
                completion_percentage: 100,
                is_coordinator: true,
                total_received: 12000,
                participants: [],
                created_at: '2023-12-10T12:00:00Z',
                updated_at: '2025-01-05T10:00:00Z'
            }
        ];

        this.filteredTandas = [...this.tandas];
        this.calculateStats();
        this.notifyDataChange();

        console.log('✅ Mock data loaded');
    }

    /**
     * Calculate statistics
     */
    calculateStats() {
        this.stats = {
            active: this.tandas.filter(t => t.status === 'active').length,
            pending: this.tandas.filter(t => t.status === 'pending').length,
            completed: this.tandas.filter(t => t.status === 'completed').length,
            totalEarnings: 0,
            nextPayment: null,
            nextPaymentDate: null
        };

        // Calculate total earnings from completed tandas
        this.stats.totalEarnings = this.tandas
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.total_received || t.total_amount), 0);

        // Find next payment date
        const activeTandas = this.tandas
            .filter(t => t.status === 'active' && t.next_payment_date)
            .sort((a, b) => new Date(a.next_payment_date) - new Date(b.next_payment_date));

        if (activeTandas.length > 0) {
            const nextTanda = activeTandas[0];
            this.stats.nextPayment = nextTanda.contribution_per_round;
            this.stats.nextPaymentDate = nextTanda.next_payment_date;
        }

        console.log('📊 Stats calculated:', this.stats);
    }

    /**
     * Filter tandas by status
     */
    filterByStatus(status) {
        this.currentFilter = status;
        this.applyFilters();
    }

    /**
     * Search tandas by name
     */
    searchTandas(query) {
        this.currentSearch = query.toLowerCase().trim();
        this.applyFilters();
    }

    /**
     * Apply all filters
     */
    applyFilters() {
        let result = [...this.tandas];

        // Apply status filter
        if (this.currentFilter !== 'all') {
            result = result.filter(t => t.status === this.currentFilter);
        }

        // Apply search filter
        if (this.currentSearch) {
            result = result.filter(t =>
                t.name.toLowerCase().includes(this.currentSearch) ||
                (t.description && t.description.toLowerCase().includes(this.currentSearch))
            );
        }

        this.filteredTandas = result;
        this.notifyDataChange();

        console.log(`🔍 Filters applied: ${result.length} tandas found`);
    }

    /**
     * Get tanda by ID
     */
    getTandaById(tandaId) {
        return this.tandas.find(t => t.id === tandaId);
    }

    /**
     * Get filtered tandas
     */
    getFilteredTandas() {
        return this.filteredTandas;
    }

    /**
     * Get statistics
     */
    getStats() {
        return this.stats;
    }

    /**
     * Make payment for tanda
     */
    async makePayment(tandaId, paymentData) {
        try {
            console.log('💰 Processing payment for tanda:', tandaId);

            const response = await fetch(`${this.API_BASE_URL}/tandas/make-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tanda_id: tandaId,
                    user_id: this.userData.user_id,
                    ...paymentData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Reload tandas to get updated data
                await this.loadTandas();
                console.log('✅ Payment processed successfully');
                return { success: true, data: data };
            } else {
                throw new Error(data.message || 'Payment failed');
            }

        } catch (error) {
            console.error('❌ Error processing payment:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Leave tanda
     */
    async leaveTanda(tandaId) {
        try {
            console.log('🚪 Leaving tanda:', tandaId);

            const response = await fetch(`${this.API_BASE_URL}/tandas/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tanda_id: tandaId,
                    user_id: this.userData.user_id
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Remove from local array
                this.tandas = this.tandas.filter(t => t.id !== tandaId);
                this.applyFilters();
                this.calculateStats();

                console.log('✅ Left tanda successfully');
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to leave tanda');
            }

        } catch (error) {
            console.error('❌ Error leaving tanda:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get payment history for tanda
     */
    async getPaymentHistory(tandaId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/tandas/payment-history?tanda_id=${tandaId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.success ? data.payments : [];

        } catch (error) {
            console.error('❌ Error getting payment history:', error);
            return [];
        }
    }

    /**
     * Notify data change to UI
     */
    notifyDataChange() {
        // Dispatch custom event for UI to listen
        window.dispatchEvent(new CustomEvent('tandas-data-updated', {
            detail: {
                tandas: this.filteredTandas,
                stats: this.stats,
                count: this.filteredTandas.length
            }
        }));
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        if (!dateString) return '-';

        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-HN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    /**
     * Format relative date (e.g., "en 5 días")
     */
    formatRelativeDate(dateString) {
        if (!dateString) return '-';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`;
        } else if (diffDays === 0) {
            return 'Hoy';
        } else if (diffDays === 1) {
            return 'Mañana';
        } else if (diffDays <= 7) {
            return `en ${diffDays} días`;
        } else {
            return this.formatDate(dateString);
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.TandasDataManager = TandasDataManager;
    console.log('🌐 Tandas Data Manager class available globally');
}
