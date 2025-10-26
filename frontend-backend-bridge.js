/**
 * 🌉 LA TANDA FRONTEND-BACKEND BRIDGE
 * Bridges Web3 frontend components with deployed backend APIs
 * Handles data synchronization and real-time updates
 */

class FrontendBackendBridge {
    constructor() {
        this.api = window.LaTandaAPI;
        this.isConnected = false;
        this.syncInterval = null;
        this.lastSyncTime = null;
        
        // UI component references
        this.components = {
            auth: null,
            dashboard: null,
            groups: null,
            notifications: null,
            wallet: null
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🌉 Initializing Frontend-Backend Bridge...');
        
        // Check backend connectivity
        await this.checkBackendConnection();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize data sync
        this.startDataSync();
        
        // Initialize UI components
        this.initializeComponents();
        
        console.log('✅ Frontend-Backend Bridge ready!');
    }
    
    async checkBackendConnection() {
        try {
            const healthCheck = await this.api.getHealth();
            this.isConnected = healthCheck.status === 'healthy';
            
            if (this.isConnected) {
                console.log('✅ Backend connection established');
                this.updateConnectionStatus('connected');
            } else {
                console.warn('⚠️ Backend health check failed');
                this.updateConnectionStatus('degraded');
            }
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
        }
    }
    
    setupEventListeners() {
        // API events
        this.api.addEventListener('auth:login', (data) => {
            this.handleAuthLogin(data);
        });
        
        this.api.addEventListener('auth:logout', () => {
            this.handleAuthLogout();
        });
        
        this.api.addEventListener('group:created', (data) => {
            this.handleGroupCreated(data);
        });
        
        this.api.addEventListener('payment:processed', (data) => {
            this.handlePaymentProcessed(data);
        });
        
        // DOM events
        window.addEventListener('latanda:auth:login', (event) => {
            this.syncUserData();
        });
        
        window.addEventListener('latanda:group:joined', (event) => {
            this.refreshGroupData();
        });
        
        // Visibility change for sync optimization
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.performQuickSync();
            }
        });
    }
    
    initializeComponents() {
        // Initialize authentication component
        this.components.auth = {
            loginForm: document.querySelector('#loginForm'),
            registerForm: document.querySelector('#registerForm'),
            userProfile: document.querySelector('#userProfile')
        };
        
        // Initialize dashboard component
        this.components.dashboard = {
            container: document.querySelector('#dashboard'),
            userStats: document.querySelector('#userStats'),
            groupsList: document.querySelector('#groupsList'),
            recentActivity: document.querySelector('#recentActivity')
        };
        
        // Initialize groups component
        this.components.groups = {
            container: document.querySelector('#groupsSection'),
            createForm: document.querySelector('#createGroupForm'),
            groupsGrid: document.querySelector('#groupsGrid')
        };
        
        // Initialize notifications component
        this.components.notifications = {
            container: document.querySelector('#notificationsPanel'),
            unreadCount: document.querySelector('#unreadCount'),
            notificationsList: document.querySelector('#notificationsList')
        };
        
        this.setupComponentEventHandlers();
    }
    
    setupComponentEventHandlers() {
        // Login form handler
        if (this.components.auth.loginForm) {
            this.components.auth.loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e.target);
            });
        }
        
        // Register form handler
        if (this.components.auth.registerForm) {
            this.components.auth.registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(e.target);
            });
        }
        
        // Create group form handler
        if (this.components.groups.createForm) {
            this.components.groups.createForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleCreateGroup(e.target);
            });
        }
    }
    
    // Authentication handlers
    async handleLogin(form) {
        try {
            this.showLoadingState('login');
            
            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');
            
            const result = await this.api.login(email, password);
            
            if (result.success) {
                this.showSuccessMessage('Login successful!');
                this.hideAuthForms();
                await this.syncUserData();
            }
        } catch (error) {
            this.showErrorMessage(`Login failed: ${error.message}`);
        } finally {
            this.hideLoadingState('login');
        }
    }
    
    async handleRegister(form) {
        try {
            this.showLoadingState('register');
            
            const formData = new FormData(form);
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone')
            };
            
            const result = await this.api.register(userData);
            
            if (result.success) {
                this.showSuccessMessage('Registration successful! Please login.');
                this.showLoginForm();
            }
        } catch (error) {
            this.showErrorMessage(`Registration failed: ${error.message}`);
        } finally {
            this.hideLoadingState('register');
        }
    }
    
    async handleCreateGroup(form) {
        try {
            this.showLoadingState('createGroup');
            
            const formData = new FormData(form);
            const groupData = {
                name: formData.get('name'),
                contribution_amount: parseFloat(formData.get('amount')),
                max_members: parseInt(formData.get('maxMembers')),
                frequency: formData.get('frequency'),
                description: formData.get('description')
            };
            
            const result = await this.api.createGroup(groupData);
            
            if (result.success) {
                this.showSuccessMessage('Group created successfully!');
                form.reset();
                await this.refreshGroupData();
            }
        } catch (error) {
            this.showErrorMessage(`Failed to create group: ${error.message}`);
        } finally {
            this.hideLoadingState('createGroup');
        }
    }
    
    // Data synchronization
    async syncUserData() {
        if (!this.api.isAuthenticated()) return;
        
        try {
            // Sync user dashboard data
            if (this.components.dashboard.container) {
                const dashboardData = await this.api.getMobileDashboard();
                this.updateDashboard(dashboardData.data);
            }
            
            // Sync notifications
            await this.syncNotifications();
            
            // Sync groups
            await this.refreshGroupData();
            
            this.lastSyncTime = new Date();
            console.log('✅ User data synchronized');
            
        } catch (error) {
            console.error('❌ Data sync failed:', error);
        }
    }
    
    async syncNotifications() {
        try {
            const notificationsData = await this.api.getNotifications();
            this.updateNotifications(notificationsData.data);
        } catch (error) {
            console.error('❌ Notifications sync failed:', error);
        }
    }
    
    async refreshGroupData() {
        try {
            const groupsData = await this.api.getGroups();
            this.updateGroupsList(groupsData.data);
        } catch (error) {
            console.error('❌ Groups sync failed:', error);
        }
    }
    
    // UI Update methods
    updateDashboard(dashboardData) {
        if (!this.components.dashboard.container) return;
        
        // Update user stats
        if (this.components.dashboard.userStats) {
            this.components.dashboard.userStats.innerHTML = `
                <div class="stat-card">
                    <h3>Total Groups</h3>
                    <span class="stat-value">${dashboardData.stats?.total_groups || 0}</span>
                </div>
                <div class="stat-card">
                    <h3>Pending Contributions</h3>
                    <span class="stat-value">${dashboardData.stats?.pending_contributions || 0}</span>
                </div>
                <div class="stat-card">
                    <h3>Completed Payments</h3>
                    <span class="stat-value">${dashboardData.stats?.completed_payments || 0}</span>
                </div>
            `;
        }
        
        // Update groups list
        if (this.components.dashboard.groupsList && dashboardData.groups) {
            this.updateGroupsList({ groups: dashboardData.groups });
        }
    }
    
    updateNotifications(notificationsData) {
        if (!this.components.notifications.container) return;
        
        // Update unread count
        if (this.components.notifications.unreadCount) {
            const unreadCount = notificationsData.pagination?.unread_count || 0;
            this.components.notifications.unreadCount.textContent = unreadCount;
            this.components.notifications.unreadCount.style.display = unreadCount > 0 ? 'inline' : 'none';
        }
        
        // Update notifications list
        if (this.components.notifications.notificationsList && notificationsData.notifications) {
            this.components.notifications.notificationsList.innerHTML = notificationsData.notifications
                .map(notification => `
                    <div class="notification-item ${notification.is_read ? 'read' : 'unread'}" 
                         data-id="${notification.id}">
                        <div class="notification-content">
                            <h4>${notification.subject || notification.title}</h4>
                            <p>${notification.body}</p>
                            <small>${new Date(notification.created_at).toLocaleDateString()}</small>
                        </div>
                        ${!notification.is_read ? '<div class="unread-indicator"></div>' : ''}
                    </div>
                `).join('');
        }
    }
    
    updateGroupsList(groupsData) {
        if (!groupsData.groups) return;
        
        const groupsContainer = this.components.groups.groupsGrid || this.components.dashboard.groupsList;
        if (!groupsContainer) return;
        
        groupsContainer.innerHTML = groupsData.groups.map(group => `
            <div class="group-card" data-group-id="${group.id}">
                <div class="group-header">
                    <h3>${group.name}</h3>
                    <span class="group-status ${group.status}">${group.status}</span>
                </div>
                <div class="group-details">
                    <p><strong>Contribution:</strong> $${group.contribution_amount}</p>
                    <p><strong>Members:</strong> ${group.member_count}/${group.max_members}</p>
                    <p><strong>Frequency:</strong> ${group.frequency}</p>
                    <p><strong>Your Role:</strong> ${group.role}</p>
                </div>
                <div class="group-actions">
                    <button onclick="bridge.viewGroupDetails('${group.id}')" class="btn-primary">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // UI Helper methods
    updateConnectionStatus(status) {
        const indicator = document.querySelector('#connectionIndicator');
        if (indicator) {
            indicator.className = `connection-indicator ${status}`;
            indicator.title = `Backend: ${status}`;
        }
    }
    
    showLoadingState(operation) {
        const button = document.querySelector(`#${operation}Button`);
        if (button) {
            button.disabled = true;
            button.innerHTML = '⏳ Loading...';
        }
    }
    
    hideLoadingState(operation) {
        const button = document.querySelector(`#${operation}Button`);
        if (button) {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || 'Submit';
        }
    }
    
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }
    
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }
    
    showMessage(message, type = 'info') {
        // Create or update message container
        let messageContainer = document.querySelector('#messageContainer');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        messageEl.style.cssText = `
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        messageContainer.appendChild(messageEl);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }
    
    // Data sync management
    startDataSync() {
        // Sync every 30 seconds when authenticated
        this.syncInterval = setInterval(async () => {
            if (this.api.isAuthenticated() && document.visibilityState === 'visible') {
                await this.performQuickSync();
            }
        }, 30000);
    }
    
    async performQuickSync() {
        try {
            // Quick sync: only notifications and critical updates
            await this.syncNotifications();
            
            // Check for token refresh
            await this.api.refreshTokenIfNeeded();
            
        } catch (error) {
            console.warn('Quick sync failed:', error);
        }
    }
    
    // Public API methods for UI components
    async viewGroupDetails(groupId) {
        try {
            const groupData = await this.api.getGroupDetails(groupId);
            // Implementation would show group details modal or navigate to group page
            console.log('Group details:', groupData);
        } catch (error) {
            this.showErrorMessage(`Failed to load group details: ${error.message}`);
        }
    }
    
    async joinGroup(groupId) {
        try {
            const result = await this.api.joinGroup(groupId);
            if (result.success) {
                this.showSuccessMessage('Successfully joined group!');
                await this.refreshGroupData();
            }
        } catch (error) {
            this.showErrorMessage(`Failed to join group: ${error.message}`);
        }
    }
    
    // Authentication UI helpers
    hideAuthForms() {
        const authContainer = document.querySelector('#authContainer');
        const mainApp = document.querySelector('#mainApp');
        
        if (authContainer) authContainer.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
    }
    
    showLoginForm() {
        const loginForm = document.querySelector('#loginForm');
        const registerForm = document.querySelector('#registerForm');
        
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
    }
    
    // Event handlers for API events
    handleAuthLogin(data) {
        console.log('User logged in:', data.user);
        this.hideAuthForms();
    }
    
    handleAuthLogout() {
        console.log('User logged out');
        const authContainer = document.querySelector('#authContainer');
        const mainApp = document.querySelector('#mainApp');
        
        if (authContainer) authContainer.style.display = 'block';
        if (mainApp) mainApp.style.display = 'none';
    }
    
    handleGroupCreated(data) {
        console.log('Group created:', data.group);
        this.showSuccessMessage(`Group "${data.group.name}" created successfully!`);
    }
    
    handlePaymentProcessed(data) {
        console.log('Payment processed:', data.transaction);
        this.showSuccessMessage('Payment processed successfully!');
    }
}

// Initialize the bridge when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bridge = new FrontendBackendBridge();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendBackendBridge;
}

console.log('🌉 Frontend-Backend Bridge loaded!');