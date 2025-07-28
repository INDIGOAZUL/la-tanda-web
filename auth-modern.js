/**
 * La Tanda Web3 Authentication System
 * Modern authentication with Web3 integration
 */

class LaTandaWeb3Auth {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.isLoading = false;
        this.currentUser = null;
        this.connectedWallet = null;
        this.web3Provider = null;
        
        // Validation patterns
        this.validationRules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\d{4}-?\d{4}$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.checkWeb3Availability();
        this.loadStoredSession();
        this.initializeAnimations();
        
        // Show loading overlay briefly
        this.showLoadingOverlay();
        setTimeout(() => this.hideLoadingOverlay(), 2000);
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabType = e.target.closest('.tab-btn').dataset.tab;
                this.switchTab(tabType);
            });
        });
        
        // Form submissions
        const loginForm = document.getElementById('loginFormElement');
        const registerForm = document.getElementById('registerFormElement');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }
        
        // Real-time validation
        this.setupRealTimeValidation();
        
        // Password strength
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
            });
        }
        
        // Phone formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        }
        
        // Password confirmation
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordConfirmation();
            });
        }
    }
    
    setupRealTimeValidation() {
        const inputs = document.querySelectorAll('.modern-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
            input.addEventListener('focus', () => this.addFocusEffect(input));
        });
    }
    
    addFocusEffect(input) {
        const wrapper = input.closest('.input-wrapper');
        if (wrapper) {
            wrapper.style.transform = 'scale(1.02)';
            wrapper.style.transition = 'transform 0.2s ease';
        }
        
        input.addEventListener('blur', () => {
            if (wrapper) {
                wrapper.style.transform = 'scale(1)';
            }
        }, { once: true });
    }
    
    switchTab(tabType) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');
        
        // Switch forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        
        const targetForm = tabType === 'login' ? 'loginForm' : 'registerForm';
        document.getElementById(targetForm).classList.add('active');
        
        // Clear errors
        this.clearAllErrors();
        
        // Add smooth transition effect
        this.addFormTransition();
    }
    
    addFormTransition() {
        const activeForm = document.querySelector('.auth-form.active');
        if (activeForm) {
            activeForm.style.opacity = '0';
            activeForm.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                activeForm.style.opacity = '1';
                activeForm.style.transform = 'translateY(0)';
                activeForm.style.transition = 'all 0.3s ease-out';
            }, 50);
        }
    }
    
    async handleLogin() {
        if (this.isLoading) return;
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        if (!this.validateLoginForm(email, password)) {
            return;
        }
        
        this.setButtonLoading('loginFormElement', true);
        
        try {
            if (email === 'demo@latanda.online' && password === 'demo123') {
                await this.loginDemoUser(email, rememberMe);
            } else {
                await this.loginRealUser(email, password, rememberMe);
            }
        } catch (error) {
            this.showNotification('Authentication failed. Please check your credentials.', 'error');
            console.error('Login error:', error);
        } finally {
            this.setButtonLoading('loginFormElement', false);
        }
    }
    
    async handleRegistration() {
        if (this.isLoading) return;
        
        const formData = this.getRegistrationFormData();
        
        if (!this.validateRegistrationForm(formData)) {
            return;
        }
        
        this.setButtonLoading('registerFormElement', true);
        
        try {
            const emailExists = await this.checkEmailExists(formData.email);
            if (emailExists) {
                this.showFieldError('registerEmail', 'This email is already registered');
                return;
            }
            
            const user = await this.createUser(formData);
            await this.loginUser(user);
            
            this.showNotification('Account created successfully! Welcome to La Tanda Web3.', 'success');
            
        } catch (error) {
            this.showNotification('Failed to create account. Please try again.', 'error');
            console.error('Registration error:', error);
        } finally {
            this.setButtonLoading('registerFormElement', false);
        }
    }
    
    getRegistrationFormData() {
        return {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('registerEmail').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('registerPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            userType: document.querySelector('input[name="userType"]:checked').value,
            termsAccepted: document.getElementById('termsAccepted').checked,
            marketingAccepted: document.getElementById('marketingAccepted').checked,
            web3Features: document.getElementById('web3Features').checked
        };
    }
    
    validateLoginForm(email, password) {
        let isValid = true;
        
        if (!email) {
            this.showFieldError('loginEmail', 'Email is required');
            isValid = false;
        } else if (!this.validationRules.email.test(email)) {
            this.showFieldError('loginEmail', 'Invalid email format');
            isValid = false;
        }
        
        if (!password) {
            this.showFieldError('loginPassword', 'Password is required');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateRegistrationForm(data) {
        let isValid = true;
        
        // Name validation
        if (!data.firstName || data.firstName.length < 2) {
            this.showFieldError('firstName', 'First name must be at least 2 characters');
            isValid = false;
        }
        
        if (!data.lastName || data.lastName.length < 2) {
            this.showFieldError('lastName', 'Last name must be at least 2 characters');
            isValid = false;
        }
        
        // Email validation
        if (!data.email) {
            this.showFieldError('registerEmail', 'Email is required');
            isValid = false;
        } else if (!this.validationRules.email.test(data.email)) {
            this.showFieldError('registerEmail', 'Invalid email format');
            isValid = false;
        }
        
        // Phone validation
        if (!data.phone) {
            this.showFieldError('phone', 'Phone number is required');
            isValid = false;
        } else if (!this.validationRules.phone.test(data.phone)) {
            this.showFieldError('phone', 'Format: 0000-0000');
            isValid = false;
        }
        
        // Password validation
        if (!data.password) {
            this.showFieldError('registerPassword', 'Password is required');
            isValid = false;
        } else if (data.password.length < 8) {
            this.showFieldError('registerPassword', 'Password must be at least 8 characters');
            isValid = false;
        }
        
        // Password confirmation
        if (data.password !== data.confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }
        
        // Terms acceptance
        if (!data.termsAccepted) {
            this.showNotification('You must accept the Terms of Service', 'error');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateField(input) {
        const value = input.value.trim();
        const fieldId = input.id;
        
        switch (input.type) {
            case 'email':
                return this.validateEmail(input);
            case 'tel':
                return this.validatePhone(input);
            case 'password':
                return this.validatePassword(input);
            default:
                if (!value && input.required) {
                    this.showFieldError(fieldId, 'This field is required');
                    return false;
                }
                return true;
        }
    }
    
    validateEmail(input) {
        const email = input.value.trim();
        const fieldId = input.id;
        
        if (!email && input.required) {
            this.showFieldError(fieldId, 'Email is required');
            return false;
        }
        
        if (email && !this.validationRules.email.test(email)) {
            this.showFieldError(fieldId, 'Invalid email format');
            return false;
        }
        
        this.clearError(input);
        return true;
    }
    
    validatePhone(input) {
        const phone = input.value.trim();
        const fieldId = input.id;
        
        if (!phone && input.required) {
            this.showFieldError(fieldId, 'Phone number is required');
            return false;
        }
        
        if (phone && !this.validationRules.phone.test(phone)) {
            this.showFieldError(fieldId, 'Format: 0000-0000');
            return false;
        }
        
        this.clearError(input);
        return true;
    }
    
    validatePassword(input) {
        const password = input.value;
        const fieldId = input.id;
        
        if (!password && input.required) {
            this.showFieldError(fieldId, 'Password is required');
            return false;
        }
        
        if (password && password.length < 8) {
            this.showFieldError(fieldId, 'Password must be at least 8 characters');
            return false;
        }
        
        this.clearError(input);
        return true;
    }
    
    validatePasswordConfirmation() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
            return false;
        }
        
        this.clearError(document.getElementById('confirmPassword'));
        return true;
    }
    
    updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;
        
        let strength = 0;
        let strengthLabel = 'Very Weak';
        
        // Calculate strength
        if (password.length >= 8) strength += 20;
        if (/[a-z]/.test(password)) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/\d/.test(password)) strength += 20;
        if (/[@$!%*?&]/.test(password)) strength += 20;
        
        // Update visual
        strengthBar.style.width = `${strength}%`;
        
        if (strength <= 20) {
            strengthLabel = 'Very Weak';
            strengthBar.style.background = '#EF4444';
        } else if (strength <= 40) {
            strengthLabel = 'Weak';
            strengthBar.style.background = '#F59E0B';
        } else if (strength <= 60) {
            strengthLabel = 'Fair';
            strengthBar.style.background = '#EAB308';
        } else if (strength <= 80) {
            strengthLabel = 'Good';
            strengthBar.style.background = '#22C55E';
        } else {
            strengthLabel = 'Strong';
            strengthBar.style.background = '#10B981';
        }
        
        strengthText.textContent = password ? strengthLabel : 'Password strength';
    }
    
    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length <= 8) {
            if (value.length > 4) {
                value = value.substring(0, 4) + '-' + value.substring(4);
            }
            input.value = value;
        }
    }
    
    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const button = input.parentNode.querySelector('.password-toggle');
        
        if (input.type === 'password') {
            input.type = 'text';
            button.innerHTML = `
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                </svg>
            `;
        } else {
            input.type = 'password';
            button.innerHTML = `
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
            `;
        }
    }
    
    // Web3 Integration
    async checkWeb3Availability() {
        if (typeof window.ethereum !== 'undefined') {
            console.log('Web3 wallet detected');
            this.web3Provider = window.ethereum;
        } else {
            console.log('No Web3 wallet detected');
        }
    }
    
    async connectWallet(walletType) {
        this.showNotification('Connecting to wallet...', 'info');
        
        try {
            switch (walletType) {
                case 'metamask':
                    await this.connectMetaMask();
                    break;
                case 'walletconnect':
                    await this.connectWalletConnect();
                    break;
                case 'binance':
                    await this.connectBinanceWallet();
                    break;
                default:
                    throw new Error('Unsupported wallet type');
            }
        } catch (error) {
            this.showNotification(`Failed to connect ${walletType}: ${error.message}`, 'error');
        }
    }
    
    async connectMetaMask() {
        if (!window.ethereum) {
            throw new Error('MetaMask not installed');
        }
        
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            this.connectedWallet = {
                type: 'metamask',
                address: accounts[0]
            };
            
            await this.loginWithWallet();
            this.showNotification('MetaMask connected successfully!', 'success');
        }
    }
    
    async connectWalletConnect() {
        // Placeholder for WalletConnect integration
        this.showNotification('WalletConnect integration coming soon!', 'info');
    }
    
    async connectBinanceWallet() {
        // Placeholder for Binance Wallet integration
        this.showNotification('Binance Wallet integration coming soon!', 'info');
    }
    
    async loginWithWallet() {
        if (!this.connectedWallet) return;
        
        const walletUser = {
            id: 'wallet_' + this.connectedWallet.address.slice(0, 8),
            address: this.connectedWallet.address,
            name: `Web3 User (${this.connectedWallet.address.slice(0, 6)}...)`,
            email: `${this.connectedWallet.address}@web3.latanda`,
            userType: 'member',
            isWeb3: true,
            joinDate: new Date().toISOString().split('T')[0],
            balance: 0,
            walletType: this.connectedWallet.type
        };
        
        await this.loginUser(walletUser);
    }
    
    async loginDemoUser(email, rememberMe) {
        await this.delay(1500);
        
        const demoUser = {
            id: 'demo_user_001',
            email: email,
            firstName: 'Demo',
            lastName: 'User',
            name: 'Demo User',
            phone: '0000-0000',
            userType: 'member',
            joinDate: '2024-01-15',
            isVerified: true,
            balance: 2500.00,
            groups: ['Central Cooperative', 'Family Group', 'Business Savings'],
            isDemo: true
        };
        
        await this.loginUser(demoUser, rememberMe);
        this.showNotification('Welcome! Demo session started successfully.', 'success');
    }
    
    async loginRealUser(email, password, rememberMe) {
        const response = await fetch(this.API_BASE + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, rememberMe })
        });
        
        if (!response.ok) {
            throw new Error('Login failed');
        }
        
        const data = await response.json();
        await this.loginUser(data.user, rememberMe);
        this.showNotification('Welcome back!', 'success');
    }
    
    async createUser(formData) {
        await this.delay(2000);
        
        const newUser = {
            id: 'user_' + Date.now(),
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            userType: formData.userType,
            joinDate: new Date().toISOString().split('T')[0],
            isVerified: false,
            balance: 0,
            groups: [],
            web3Enabled: formData.web3Features,
            preferences: {
                marketing: formData.marketingAccepted
            }
        };
        
        return newUser;
    }
    
    async checkEmailExists(email) {
        await this.delay(500);
        return email === 'demo@latanda.online';
    }
    
    async loginUser(user, rememberMe = false) {
        this.currentUser = user;
        
        const sessionData = {
            user: user,
            loginTime: Date.now(),
            rememberMe: rememberMe,
            connectedWallet: this.connectedWallet
        };
        
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('laTandaWeb3Auth', JSON.stringify(sessionData));
        
        await this.delay(500);
        
        // Redirect to main app (we'll create this next)
        window.location.href = 'index-modern.html';
    }
    
    loadStoredSession() {
        const sessionData = localStorage.getItem('laTandaWeb3Auth') || 
                           sessionStorage.getItem('laTandaWeb3Auth');
        
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                const timeDiff = Date.now() - data.loginTime;
                const maxAge = data.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
                
                if (timeDiff < maxAge) {
                    this.currentUser = data.user;
                    this.connectedWallet = data.connectedWallet;
                    window.location.href = 'index-modern.html';
                } else {
                    this.clearStoredSession();
                }
            } catch (error) {
                console.error('Error loading session:', error);
                this.clearStoredSession();
            }
        }
    }
    
    clearStoredSession() {
        localStorage.removeItem('laTandaWeb3Auth');
        sessionStorage.removeItem('laTandaWeb3Auth');
    }
    
    fillDemoCredentials() {
        document.getElementById('loginEmail').value = 'demo@latanda.online';
        document.getElementById('loginPassword').value = 'demo123';
        
        this.switchTab('login');
        this.showNotification('Demo credentials loaded. Ready to sign in!', 'info');
    }
    
    // UI Helper Methods
    setButtonLoading(formId, loading) {
        this.isLoading = loading;
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (loading) {
            submitBtn.classList.add('loading');
            this.showLoadingOverlay();
        } else {
            submitBtn.classList.remove('loading');
            this.hideLoadingOverlay();
        }
    }
    
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(fieldId + 'Error');
        
        if (field) {
            field.style.borderColor = 'var(--error-500)';
            field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        }
        
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
        
        // Add shake animation
        if (field) {
            field.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                field.style.animation = '';
            }, 500);
        }
    }
    
    clearError(input) {
        input.style.borderColor = 'var(--border-color)';
        input.style.boxShadow = '';
        
        const errorEl = document.getElementById(input.id + 'Error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }
    }
    
    clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
        
        document.querySelectorAll('.modern-input').forEach(input => {
            input.style.borderColor = 'var(--border-color)';
            input.style.boxShadow = '';
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
            font-weight: 500;
        `;
        
        if (type === 'success') {
            notification.style.background = 'rgba(16, 185, 129, 0.9)';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.background = 'rgba(239, 68, 68, 0.9)';
            notification.style.color = 'white';
        } else if (type === 'info') {
            notification.style.background = 'rgba(99, 102, 241, 0.9)';
            notification.style.color = 'white';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            // Animate progress bar
            const progressFill = overlay.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = '100%';
            }
        }
    }
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            const progressFill = overlay.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = '0%';
            }
        }
    }
    
    initializeAnimations() {
        // Add CSS for shake animation
        if (!document.getElementById('shakeAnimation')) {
            const style = document.createElement('style');
            style.id = 'shakeAnimation';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
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
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-content button {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.25rem;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s ease;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }
    
    .notification-content button:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
    }
`;
document.head.appendChild(notificationStyles);

// Initialize the authentication system
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new LaTandaWeb3Auth();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTandaWeb3Auth;
}