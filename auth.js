/**
 * La Tanda Authentication System - Complete Auth Logic
 * Sistema de autenticación completo para el ecosistema La Tanda
 */

class LaTandaAuth {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.isLoading = false;
        this.currentUser = null;
        this.validationRules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\+504\s?\d{4}-?\d{4}$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.loadStoredSession();
        this.initializePasswordStrength();
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabType = e.target.dataset.tab;
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
        
        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        }
        
        // Password strength checking
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }
        
        // Password confirmation
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', (e) => {
                this.validatePasswordConfirmation();
            });
        }
        
        // Real-time validation
        this.setupRealTimeValidation();
    }
    
    setupFormValidation() {
        // Setup validation for all form inputs
        const inputs = document.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearError(input);
            });
        });
    }
    
    setupRealTimeValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.value) {
                    this.validateEmail(input);
                }
            });
        });
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
        
        // Clear previous errors
        this.clearAllErrors();
    }
    
    async handleLogin() {
        if (this.isLoading) return;
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validate inputs
        if (!this.validateLoginForm(email, password)) {
            return;
        }
        
        this.setLoading(true, 'loginFormElement');
        
        try {
            // Check for demo account
            if (email === 'user@example.com' && password === 'REMOVED_CREDENTIAL') {
                await this.loginDemoUser(email, rememberMe);
            } else {
                await this.loginRealUser(email, password, rememberMe);
            }
        } catch (error) {
            this.showError('Credenciales inválidas. Verifica tu email y contraseña.');
            console.error('Login error:', error);
        } finally {
            this.setLoading(false, 'loginFormElement');
        }
    }
    
    async handleRegistration() {
        if (this.isLoading) return;
        
        const formData = this.getRegistrationFormData();
        
        // Validate all fields
        if (!this.validateRegistrationForm(formData)) {
            return;
        }
        
        this.setLoading(true, 'registerFormElement');
        
        try {
            // Check if email already exists
            const emailExists = await this.checkEmailExists(formData.email);
            if (emailExists) {
                this.showFieldError('registerEmail', 'Este email ya está registrado');
                return;
            }
            
            // Create new user
            const user = await this.createUser(formData);
            await this.loginUser(user);
            
            this.showSuccess('¡Cuenta creada exitosamente! Bienvenido a La Tanda.');
            
        } catch (error) {
            this.showError('Error al crear la cuenta. Intenta de nuevo.');
            console.error('Registration error:', error);
        } finally {
            this.setLoading(false, 'registerFormElement');
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
            marketingAccepted: document.getElementById('marketingAccepted').checked
        };
    }
    
    validateLoginForm(email, password) {
        let isValid = true;
        
        if (!email) {
            this.showFieldError('loginEmail', 'El email es requerido');
            isValid = false;
        } else if (!this.validationRules.email.test(email)) {
            this.showFieldError('loginEmail', 'Formato de email inválido');
            isValid = false;
        }
        
        if (!password) {
            this.showFieldError('loginPassword', 'La contraseña es requerida');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError('loginPassword', 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateRegistrationForm(data) {
        let isValid = true;
        
        // Name validation
        if (!data.firstName || data.firstName.length < 2) {
            this.showFieldError('firstName', 'Nombre debe tener al menos 2 caracteres');
            isValid = false;
        }
        
        if (!data.lastName || data.lastName.length < 2) {
            this.showFieldError('lastName', 'Apellido debe tener al menos 2 caracteres');
            isValid = false;
        }
        
        // Email validation
        if (!data.email) {
            this.showFieldError('registerEmail', 'El email es requerido');
            isValid = false;
        } else if (!this.validationRules.email.test(data.email)) {
            this.showFieldError('registerEmail', 'Formato de email inválido');
            isValid = false;
        }
        
        // Phone validation
        if (!data.phone) {
            this.showFieldError('phone', 'El teléfono es requerido');
            isValid = false;
        } else if (!this.validationRules.phone.test(data.phone)) {
            this.showFieldError('phone', 'Formato: +504 0000-0000');
            isValid = false;
        }
        
        // Password validation
        if (!data.password) {
            this.showFieldError('registerPassword', 'La contraseña es requerida');
            isValid = false;
        } else if (data.password.length < 8) {
            this.showFieldError('registerPassword', 'Mínimo 8 caracteres');
            isValid = false;
        }
        
        // Password confirmation
        if (data.password !== data.confirmPassword) {
            this.showFieldError('confirmPassword', 'Las contraseñas no coinciden');
            isValid = false;
        }
        
        // Terms acceptance
        if (!data.termsAccepted) {
            this.showError('Debes aceptar los términos y condiciones');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.name || input.id;
        
        switch (input.type) {
            case 'email':
                return this.validateEmail(input);
            case 'tel':
                return this.validatePhone(input);
            case 'password':
                return this.validatePassword(input);
            default:
                if (!value && input.required) {
                    this.showFieldError(input.id, 'Este campo es requerido');
                    return false;
                }
                return true;
        }
    }
    
    validateEmail(input) {
        const email = input.value.trim();
        const fieldId = input.id;
        
        if (!email) {
            if (input.required) {
                this.showFieldError(fieldId, 'El email es requerido');
                return false;
            }
            return true;
        }
        
        if (!this.validationRules.email.test(email)) {
            this.showFieldError(fieldId, 'Formato de email inválido');
            return false;
        }
        
        this.clearError(input);
        return true;
    }
    
    validatePhone(input) {
        const phone = input.value.trim();
        const fieldId = input.id;
        
        if (!phone) {
            this.showFieldError(fieldId, 'El teléfono es requerido');
            return false;
        }
        
        if (!this.validationRules.phone.test(phone)) {
            this.showFieldError(fieldId, 'Formato: +504 0000-0000');
            return false;
        }
        
        this.clearError(input);
        return true;
    }
    
    validatePassword(input) {
        const password = input.value;
        const fieldId = input.id;
        
        if (!password) {
            this.showFieldError(fieldId, 'La contraseña es requerida');
            return false;
        }
        
        if (password.length < 8) {
            this.showFieldError(fieldId, 'Mínimo 8 caracteres');
            return false;
        }
        
        this.clearError(input);
        return true;
    }
    
    validatePasswordConfirmation() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Las contraseñas no coinciden');
            return false;
        }
        
        this.clearError(document.getElementById('confirmPassword'));
        return true;
    }
    
    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength');
        if (!strengthIndicator) return;
        
        let strength = 0;
        let feedback = [];
        
        // Length check
        if (password.length >= 8) strength++;
        else feedback.push('al menos 8 caracteres');
        
        // Lowercase check
        if (/[a-z]/.test(password)) strength++;
        else feedback.push('una minúscula');
        
        // Uppercase check
        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('una mayúscula');
        
        // Number check
        if (/\d/.test(password)) strength++;
        else feedback.push('un número');
        
        // Special character check
        if (/[@$!%*?&]/.test(password)) strength++;
        else feedback.push('un carácter especial');
        
        // Update UI
        const strengthLevels = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
        const strengthColors = ['#f44336', '#ff9800', '#ffc107', '#4caf50', '#2e7d32'];
        
        strengthIndicator.textContent = password ? 
            `Seguridad: ${strengthLevels[strength - 1] || 'Muy débil'}` : '';
        strengthIndicator.style.color = strengthColors[strength - 1] || '#f44336';
        
        if (feedback.length > 0 && password) {
            strengthIndicator.textContent += ` (Falta: ${feedback.join(', ')})`;
        }
    }
    
    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        // Add country code if not present
        if (value && !value.startsWith('504')) {
            value = '504' + value;
        }
        
        // Format as +504 0000-0000
        if (value.length >= 3) {
            value = value.substring(0, 11); // Limit to 11 digits (504 + 8 digits)
            const formatted = '+' + value.substring(0, 3) + ' ' + 
                            value.substring(3, 7) + 
                            (value.length > 7 ? '-' + value.substring(7) : '');
            input.value = formatted;
        }
    }
    
    async loginDemoUser(email, rememberMe) {
        // Simulate API delay
        await this.delay(1500);
        
        const demoUser = {
            id: 'demo_user_001',
            email: email,
            firstName: 'Usuario',
            lastName: 'Demo',
            name: 'Usuario Demo',
            phone: '+504 0000-0000',
            userType: 'member',
            joinDate: '2024-01-15',
            isVerified: true,
            balance: 2500.00,
            groups: ['Cooperativa Central', 'Grupo Familiar', 'Ahorro Empresarial']
        };
        
        await this.loginUser(demoUser, rememberMe);
        this.showSuccess('¡Bienvenido! Sesión demo iniciada correctamente.');
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
        this.showSuccess('¡Bienvenido de vuelta!');
    }
    
    async createUser(formData) {
        // Simulate API call - in production this would be a real API call
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
            preferences: {
                marketing: formData.marketingAccepted
            }
        };
        
        return newUser;
    }
    
    async checkEmailExists(email) {
        // In production, this would check against the real database
        await this.delay(500);
        
        // For demo purposes, assume demo email exists
        return email === 'user@example.com';
    }
    
    async loginUser(user, rememberMe = false) {
        this.currentUser = user;
        
        // Store session
        const sessionData = {
            user: user,
            loginTime: Date.now(),
            rememberMe: rememberMe
        };
        
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('laTandaAuth', JSON.stringify(sessionData));
        
        // Redirect to main app
        await this.delay(500);
        window.location.href = 'index.html';
    }
    
    loadStoredSession() {
        const sessionData = localStorage.getItem('laTandaAuth') || 
                           sessionStorage.getItem('laTandaAuth');
        
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                const timeDiff = Date.now() - data.loginTime;
                
                // Session expires after 24 hours (or 7 days if remember me)
                const maxAge = data.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
                
                if (timeDiff < maxAge) {
                    this.currentUser = data.user;
                    // Auto redirect to main app if already logged in
                    window.location.href = 'index.html';
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
        localStorage.removeItem('laTandaAuth');
        sessionStorage.removeItem('laTandaAuth');
    }
    
    fillDemoCredentials() {
        document.getElementById('loginEmail').value = 'user@example.com';
        document.getElementById('loginPassword').value = 'REMOVED_CREDENTIAL';
        
        // Switch to login tab if on register
        this.switchTab('login');
        
        this.showInfo('Credenciales demo cargadas. ¡Listo para iniciar sesión!');
    }
    
    setLoading(loading, formId) {
        this.isLoading = loading;
        const form = document.getElementById(formId);
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        if (loading) {
            form.classList.add('loading');
            loadingOverlay.style.display = 'flex';
            
            // Update button text
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                btnText.style.display = 'none';
                btnLoading.style.display = 'inline';
            }
        } else {
            form.classList.remove('loading');
            loadingOverlay.style.display = 'none';
            
            // Restore button text
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }
        }
    }
    
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(fieldId + 'Error');
        
        if (field) {
            field.classList.add('error');
        }
        
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }
    
    clearError(input) {
        input.classList.remove('error');
        const errorEl = document.getElementById(input.id + 'Error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }
    
    clearAllErrors() {
        document.querySelectorAll('.input-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        document.querySelectorAll('input').forEach(input => {
            input.classList.remove('error');
        });
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showInfo(message) {
        this.showNotification(message, 'info');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    initializePasswordStrength() {
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize authentication system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new LaTandaAuth();
});