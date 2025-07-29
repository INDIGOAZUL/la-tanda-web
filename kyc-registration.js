/**
 * La Tanda KYC Registration System
 * Advanced Multi-Step Registration with KYC Verification
 */

class LaTandaKYCSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = {};
        this.uploadedFiles = {};
        this.validationRules = {};
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        try {
            this.initializeValidationRules();
            this.initializeEventListeners();
            this.initializeParticles();
            this.initializeFormState();
            this.updateProgress();
            this.isInitialized = true;
            console.log('KYC Registration System initialized successfully');
        } catch (error) {
            console.error('Error initializing KYC system:', error);
            this.showNotification('Error initializing system', 'error');
        }
    }
    
    initializeValidationRules() {
        this.validationRules = {
            firstName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                message: 'Nombre debe contener solo letras'
            },
            lastName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                message: 'Apellido debe contener solo letras'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email debe tener formato válido'
            },
            phone: {
                required: true,
                pattern: /^[\d\-]+$/,
                minLength: 9, // 8 digits + 1 dash = 9 characters (0000-0000)
                message: 'Teléfono debe tener formato válido (ej: 0000-0000)'
            },
            birthDate: {
                required: true,
                customValidation: this.validateAge,
                message: 'Debes ser mayor de 18 años'
            },
            country: {
                required: true,
                message: 'Selecciona tu país'
            },
            password: {
                required: true,
                minLength: 8,
                customValidation: this.validatePassword,
                message: 'Contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número'
            },
            confirmPassword: {
                required: true,
                customValidation: this.validatePasswordConfirm,
                message: 'Las contraseñas no coinciden'
            },
            employmentStatus: {
                required: true,
                message: 'Selecciona tu estado laboral'
            },
            monthlyIncome: {
                required: true,
                message: 'Selecciona tu rango de ingresos'
            }
        };
    }
    
    initializeEventListeners() {
        // Form submissions
        document.getElementById('basicInfoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBasicInfoSubmit();
        });
        
        document.getElementById('kycForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleKYCSubmit();
        });
        
        document.getElementById('financialForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFinancialSubmit();
        });
        
        // Real-time validation
        this.addRealTimeValidation();
        
        // File upload handlers
        this.initializeFileUploads();
        
        // Password strength
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.updatePasswordStrength());
        }
        
        // Phone input formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
        }
        
        // User type selection
        const userTypeInputs = document.querySelectorAll('input[name="userType"]');
        userTypeInputs.forEach(input => {
            input.addEventListener('change', () => this.handleUserTypeChange());
        });
    }
    
    addRealTimeValidation() {
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }
    
    initializeFileUploads() {
        // Document upload
        this.setupFileUpload('documentUpload', 'documentFile', 'document');
        
        // Selfie upload
        this.setupFileUpload('selfieUpload', 'selfieFile', 'selfie');
        
        // Address proof upload
        this.setupFileUpload('addressUpload', 'addressFile', 'address');
    }
    
    setupFileUpload(zoneId, inputId, type) {
        const zone = document.getElementById(zoneId);
        const input = document.getElementById(inputId);
        
        if (!zone || !input) return;
        
        // Click to upload
        zone.addEventListener('click', () => input.click());
        
        // File input change
        input.addEventListener('change', (e) => this.handleFileSelect(e, type));
        
        // Drag and drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files } }, type);
            }
        });
    }
    
    initializeParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Random animation delay
            particle.style.animationDelay = `${Math.random() * 8}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    initializeFormState() {
        // Load saved form data from localStorage
        const savedData = localStorage.getItem('laTandaKYCData');
        if (savedData) {
            try {
                this.formData = JSON.parse(savedData);
                this.populateFormData();
            } catch (error) {
                console.warn('Error loading saved form data:', error);
            }
        }
        
        // Auto-save form data
        setInterval(() => this.saveFormData(), 30000); // Save every 30 seconds
    }
    
    // Form Submission Handlers
    async handleBasicInfoSubmit() {
        const form = document.getElementById('basicInfoForm');
        const formData = new FormData(form);
        
        // Validate all fields
        let isValid = true;
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'birthDate', 'country', 'password', 'confirmPassword'];
        const invalidFields = [];
        
        for (const field of requiredFields) {
            const input = document.getElementById(field);
            if (!this.validateField(input)) {
                isValid = false;
                invalidFields.push(field);
            }
        }
        
        if (!isValid) {
            console.log('Invalid fields:', invalidFields);
            this.showNotification(`Por favor corrige: ${invalidFields.join(', ')}`, 'error');
            return;
        }
        
        // Save form data
        for (const [key, value] of formData.entries()) {
            this.formData[key] = value;
        }
        
        this.saveFormData();
        this.showNotification('Información básica guardada. Avanzando...', 'success');
        this.nextStep();
    }
    
    async handleKYCSubmit() {
        // Validate required documents
        if (!this.uploadedFiles.document) {
            this.showNotification('Debes subir tu documento de identidad', 'error');
            return;
        }
        
        if (!this.uploadedFiles.selfie) {
            this.showNotification('Debes subir una selfie con tu documento', 'error');
            return;
        }
        
        // Save KYC data
        const form = document.getElementById('kycForm');
        const formData = new FormData(form);
        
        for (const [key, value] of formData.entries()) {
            this.formData[key] = value;
        }
        
        this.formData.uploadedFiles = this.uploadedFiles;
        this.saveFormData();
        this.nextStep();
    }
    
    async handleFinancialSubmit() {
        const form = document.getElementById('financialForm');
        const formData = new FormData(form);
        
        // Validate required fields
        const employmentStatus = document.getElementById('employmentStatus');
        const monthlyIncome = document.getElementById('monthlyIncome');
        
        let isValid = true;
        
        if (!this.validateField(employmentStatus)) isValid = false;
        if (!this.validateField(monthlyIncome)) isValid = false;
        
        if (!isValid) {
            this.showNotification('Por favor completa los campos requeridos', 'error');
            return;
        }
        
        // Save financial data
        for (const [key, value] of formData.entries()) {
            this.formData[key] = value;
        }
        
        // Collect checkbox values
        const notifications = [];
        document.querySelectorAll('input[name="notifications"]:checked').forEach(checkbox => {
            notifications.push(checkbox.value);
        });
        this.formData.notifications = notifications;
        
        const privacy = [];
        document.querySelectorAll('input[name="privacy"]:checked').forEach(checkbox => {
            privacy.push(checkbox.value);
        });
        this.formData.privacy = privacy;
        
        const marketing = [];
        document.querySelectorAll('input[name="marketing"]:checked').forEach(checkbox => {
            marketing.push(checkbox.value);
        });
        this.formData.marketing = marketing;
        
        this.saveFormData();
        this.nextStep();
        this.startVerificationProcess();
    }
    
    // File Handling
    handleFileSelect(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file
        if (!this.validateFile(file, type)) return;
        
        // Store file
        this.uploadedFiles[type] = file;
        
        // Show preview
        this.showFilePreview(file, type);
        
        this.showNotification(`${this.getFileTypeLabel(type)} cargado exitosamente`, 'success');
    }
    
    validateFile(file, type) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = type === 'selfie' 
            ? ['image/jpeg', 'image/png', 'image/webp']
            : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        
        if (file.size > maxSize) {
            this.showNotification('El archivo es demasiado grande (máximo 10MB)', 'error');
            return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Tipo de archivo no permitido', 'error');
            return false;
        }
        
        return true;
    }
    
    showFilePreview(file, type) {
        const preview = document.getElementById(`${type}Preview`);
        const img = document.getElementById(`${type}PreviewImg`);
        const fileName = document.getElementById(`${type}FileName`);
        const fileSize = document.getElementById(`${type}FileSize`);
        
        if (!preview || !img || !fileName || !fileSize) return;
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            // For PDF files, show a placeholder
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="50" text-anchor="middle" x="50">📄</text></svg>';
            preview.style.display = 'block';
        }
        
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
    }
    
    removeFile(type) {
        delete this.uploadedFiles[type];
        const preview = document.getElementById(`${type}Preview`);
        const input = document.getElementById(`${type}File`);
        
        if (preview) preview.style.display = 'none';
        if (input) input.value = '';
        
        this.showNotification(`${this.getFileTypeLabel(type)} eliminado`, 'info');
    }
    
    getFileTypeLabel(type) {
        const labels = {
            document: 'Documento de identidad',
            selfie: 'Selfie de verificación',
            address: 'Comprobante de dirección'
        };
        return labels[type] || type;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Validation Functions
    validateField(input) {
        if (!input) return true;
        
        const fieldName = input.name || input.id;
        const rule = this.validationRules[fieldName];
        
        if (!rule) return true;
        
        const value = input.value.trim();
        
        // Required validation
        if (rule.required && !value) {
            this.showFieldError(input, 'Este campo es requerido');
            return false;
        }
        
        if (!value && !rule.required) return true; // Skip other validations if field is empty and not required
        
        // Length validation
        if (rule.minLength && value.length < rule.minLength) {
            this.showFieldError(input, `Mínimo ${rule.minLength} caracteres`);
            return false;
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
            this.showFieldError(input, `Máximo ${rule.maxLength} caracteres`);
            return false;
        }
        
        // Pattern validation - fix for phone field
        if (rule.pattern && !rule.pattern.test(value)) {
            // Special handling for phone field with dashes
            if (fieldName === 'phone') {
                const phoneDigits = value.replace(/\D/g, '');
                if (phoneDigits.length < 8) {
                    this.showFieldError(input, 'Teléfono debe tener 8 dígitos');
                    return false;
                }
            } else {
                this.showFieldError(input, rule.message);
                return false;
            }
        }
        
        // Custom validation
        if (rule.customValidation) {
            const customResult = rule.customValidation.call(this, value, input);
            if (customResult !== true) {
                this.showFieldError(input, customResult || rule.message);
                return false;
            }
        }
        
        // Clear any existing errors
        this.clearFieldError(input);
        input.classList.add('success');
        return true;
    }
    
    validateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            calculatedAge--;
        }
        
        if (calculatedAge >= 18) {
            return true;
        } else {
            return `Debes ser mayor de 18 años (tienes ${calculatedAge} años)`;
        }
    }
    
    validatePassword(password) {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;
        
        if (!isLongEnough) return 'Mínimo 8 caracteres';
        if (!hasUpper) return 'Debe incluir mayúscula';
        if (!hasLower) return 'Debe incluir minúscula';
        if (!hasNumber) return 'Debe incluir número';
        
        return true;
    }
    
    validatePasswordConfirm(confirmPassword) {
        const password = document.getElementById('password').value;
        return password === confirmPassword ? true : 'Las contraseñas no coinciden';
    }
    
    showFieldError(input, message) {
        input.classList.remove('success');
        input.classList.add('error');
        
        const errorElement = document.getElementById(`${input.id}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }
    
    clearFieldError(input) {
        input.classList.remove('error');
        
        const errorElement = document.getElementById(`${input.id}Error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }
    
    // Password Strength
    updatePasswordStrength() {
        const password = document.getElementById('password').value;
        const strengthMeter = document.getElementById('passwordStrength');
        
        if (!strengthMeter) return;
        
        let strength = 0;
        let strengthClass = '';
        
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        
        switch (strength) {
            case 0:
            case 1:
                strengthClass = 'weak';
                break;
            case 2:
                strengthClass = 'fair';
                break;
            case 3:
            case 4:
                strengthClass = 'good';
                break;
            case 5:
                strengthClass = 'strong';
                break;
        }
        
        strengthMeter.className = `password-strength ${strengthClass}`;
    }
    
    // Phone Formatting
    formatPhoneNumber(event) {
        let value = event.target.value.replace(/\D/g, '');
        
        // Allow up to 8 digits for Honduras format (standard mobile: 8 digits)
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
        // Format as XXXX-XXXX for 8 digits, or X-XXX-XXXX for landlines
        if (value.length >= 5) {
            // Mobile format: 9XXX-XXXX (when starting with 9)
            if (value.startsWith('9') && value.length === 8) {
                value = value.replace(/(\d{4})(\d{4})/, '$1-$2');
            } else if (value.length >= 4) {
                value = value.replace(/(\d{4})(\d{1,4})/, '$1-$2');
            }
        } else if (value.length >= 4) {
            value = value.replace(/(\d{4})(\d{1,4})/, '$1-$2');
        }
        
        event.target.value = value;
        
        // Clear any existing validation errors
        this.clearFieldError(event.target);
    }
    
    // User Type Change
    handleUserTypeChange() {
        const selectedType = document.querySelector('input[name="userType"]:checked').value;
        this.formData.userType = selectedType;
        
        // Show additional information for coordinators
        if (selectedType === 'coordinator') {
            this.showNotification('Como coordinador, tendrás acceso a herramientas avanzadas de gestión', 'info');
        }
    }
    
    // Step Navigation
    nextStep() {
        if (this.currentStep >= this.totalSteps) return;
        
        this.hideCurrentStep();
        this.currentStep++;
        this.showCurrentStep();
        this.updateProgress();
        this.scrollToTop();
    }
    
    previousStep() {
        if (this.currentStep <= 1) return;
        
        this.hideCurrentStep();
        this.currentStep--;
        this.showCurrentStep();
        this.updateProgress();
        this.scrollToTop();
    }
    
    showCurrentStep() {
        const step = document.getElementById(`step${this.currentStep}`);
        if (step) {
            step.classList.add('active');
        }
        
        // Update step indicators
        document.querySelectorAll('.step').forEach((stepEl, index) => {
            stepEl.classList.remove('active', 'completed');
            if (index + 1 < this.currentStep) {
                stepEl.classList.add('completed');
            } else if (index + 1 === this.currentStep) {
                stepEl.classList.add('active');
            }
        });
    }
    
    hideCurrentStep() {
        const step = document.getElementById(`step${this.currentStep}`);
        if (step) {
            step.classList.remove('active');
        }
    }
    
    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            const percentage = (this.currentStep / this.totalSteps) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }
    
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Verification Process
    async startVerificationProcess() {
        this.showNotification('Iniciando proceso de verificación...', 'info');
        
        // Simulate verification steps
        setTimeout(() => this.updateVerificationStep('kyc', 'completed'), 2000);
        setTimeout(() => this.updateVerificationStep('profile', 'processing'), 3000);
        setTimeout(() => this.updateVerificationStep('profile', 'completed'), 5000);
        setTimeout(() => this.updateVerificationStep('approval', 'processing'), 6000);
        setTimeout(() => this.completeVerification(), 8000);
    }
    
    updateVerificationStep(stepId, status) {
        const step = document.getElementById(`${stepId}Progress`);
        if (!step) return;
        
        step.className = `progress-item ${status}`;
        
        const icon = step.querySelector('.progress-icon');
        if (icon) {
            switch (status) {
                case 'completed':
                    icon.innerHTML = '✅';
                    break;
                case 'processing':
                    icon.innerHTML = '🔄';
                    break;
                default:
                    icon.innerHTML = '⏳';
            }
        }
    }
    
    completeVerification() {
        const icon = document.getElementById('verificationIcon');
        const title = document.getElementById('verificationTitle');
        const message = document.getElementById('verificationMessage');
        const continueBtn = document.getElementById('continueBtn');
        
        if (icon) {
            icon.innerHTML = '<div class="success-icon" style="font-size: 40px;">✅</div>';
        }
        
        if (title) {
            title.textContent = '¡Verificación Completada!';
        }
        
        if (message) {
            message.textContent = 'Tu cuenta ha sido verificada exitosamente';
        }
        
        if (continueBtn) {
            continueBtn.disabled = false;
            continueBtn.textContent = 'Continuar al Dashboard';
        }
        
        this.updateVerificationStep('approval', 'completed');
        this.showNotification('¡Verificación completada exitosamente!', 'success');
        
        // Auto-advance to final step
        setTimeout(() => this.nextStep(), 2000);
    }
    
    checkStatus() {
        this.showNotification('Verificando estado...', 'info');
        // Simulate status check
        setTimeout(() => {
            this.showNotification('Estado actualizado', 'success');
        }, 1000);
    }
    
    continueToNext() {
        if (this.currentStep < this.totalSteps) {
            this.nextStep();
        } else {
            // Redirect to dashboard
            window.location.href = 'web3-dashboard.html';
        }
    }
    
    // Password Toggle
    togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        const toggle = field.parentNode.querySelector('.password-toggle .toggle-icon');
        
        if (field.type === 'password') {
            field.type = 'text';
            toggle.textContent = '🙈';
        } else {
            field.type = 'password';
            toggle.textContent = '👁️';
        }
    }
    
    // Data Management
    saveFormData() {
        try {
            localStorage.setItem('laTandaKYCData', JSON.stringify(this.formData));
        } catch (error) {
            console.warn('Error saving form data:', error);
        }
    }
    
    populateFormData() {
        Object.keys(this.formData).forEach(key => {
            const input = document.getElementById(key);
            if (input && this.formData[key]) {
                if (input.type === 'radio' || input.type === 'checkbox') {
                    if (input.value === this.formData[key]) {
                        input.checked = true;
                    }
                } else {
                    input.value = this.formData[key];
                }
            }
        });
    }
    
    clearSavedData() {
        localStorage.removeItem('laTandaKYCData');
        this.formData = {};
        this.uploadedFiles = {};
    }
    
    // Utility Functions
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            maxWidth: '300px',
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            transform: 'translateX(100%)',
            opacity: '0'
        });
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = 'rgba(14, 203, 129, 0.9)';
                break;
            case 'error':
                notification.style.background = 'rgba(246, 70, 93, 0.9)';
                break;
            case 'warning':
                notification.style.background = 'rgba(240, 185, 11, 0.9)';
                break;
            default:
                notification.style.background = 'rgba(46, 134, 171, 0.9)';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    // API Simulation Functions
    async submitRegistration() {
        try {
            this.showNotification('Enviando datos de registro...', 'info');
            
            // Simulate API call
            const response = await this.simulateAPICall('/api/register', this.formData);
            
            if (response.success) {
                this.showNotification('Registro enviado exitosamente', 'success');
                return response;
            } else {
                throw new Error(response.message || 'Error en el registro');
            }
        } catch (error) {
            this.showNotification('Error al enviar registro: ' + error.message, 'error');
            throw error;
        }
    }
    
    async uploadFiles() {
        try {
            this.showNotification('Subiendo archivos...', 'info');
            
            // Simulate file upload
            const response = await this.simulateAPICall('/api/upload', this.uploadedFiles);
            
            if (response.success) {
                this.showNotification('Archivos subidos exitosamente', 'success');
                return response;
            } else {
                throw new Error(response.message || 'Error subiendo archivos');
            }
        } catch (error) {
            this.showNotification('Error subiendo archivos: ' + error.message, 'error');
            throw error;
        }
    }
    
    simulateAPICall(endpoint, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate successful response
                resolve({
                    success: true,
                    message: 'Operation successful',
                    data: data
                });
            }, 1000 + Math.random() * 2000); // 1-3 seconds delay
        });
    }
    
    // Camera and Biometric Methods
    async openCamera() {
        try {
            this.showNotification('Abriendo cámara...', 'info');
            
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });
            
            // Create camera modal
            this.showCameraModal(stream);
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showNotification('Error accediendo a la cámara. Por favor verifica los permisos.', 'error');
            
            // Fallback to file selection
            setTimeout(() => {
                this.selectSelfieFile();
            }, 2000);
        }
    }
    
    showCameraModal(stream) {
        // Create camera modal HTML
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.innerHTML = `
            <div class="camera-modal-content">
                <div class="camera-header">
                    <h3>📷 Tomar Selfie con Documento</h3>
                    <button class="close-camera" onclick="kycSystem.closeCameraModal()">✕</button>
                </div>
                <div class="camera-view">
                    <video id="cameraVideo" autoplay playsinline></video>
                    <div class="camera-overlay">
                        <div class="face-guide"></div>
                        <p>Sostén tu documento junto a tu cara</p>
                    </div>
                </div>
                <div class="camera-actions">
                    <button class="camera-btn secondary" onclick="kycSystem.closeCameraModal()">Cancelar</button>
                    <button class="camera-btn primary" onclick="kycSystem.capturePhoto()">📸 Capturar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Start video stream
        const video = document.getElementById('cameraVideo');
        video.srcObject = stream;
        this.currentStream = stream;
    }
    
    capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        // Convert to blob
        canvas.toBlob((blob) => {
            const file = new File([blob], 'selfie-capture.jpg', { type: 'image/jpeg' });
            this.handleCapturedPhoto(file);
        }, 'image/jpeg', 0.8);
    }
    
    handleCapturedPhoto(file) {
        this.uploadedFiles.selfie = file;
        this.showFilePreview(file, 'selfie');
        this.closeCameraModal();
        this.showNotification('Selfie capturada exitosamente', 'success');
    }
    
    closeCameraModal() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
        }
        
        const modal = document.querySelector('.camera-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    selectSelfieFile() {
        const input = document.getElementById('selfieFile');
        if (input) {
            input.click();
        }
    }
    
    async scanFace() {
        this.showNotification('Iniciando escaneo biométrico...', 'info');
        
        try {
            // Simulate biometric scanning
            const loadingModal = this.createLoadingModal('🔍 Escaneando rostro...', 'Verificando características biométricas');
            
            setTimeout(() => {
                loadingModal.remove();
                this.showNotification('Escaneo biométrico completado', 'success');
                
                // Simulate successful scan
                this.uploadedFiles.biometric = {
                    type: 'biometric_scan',
                    confidence: 98.5,
                    timestamp: new Date().toISOString()
                };
                
                // Show biometric result
                this.showBiometricResult();
                
            }, 3000);
            
        } catch (error) {
            console.error('Error in biometric scan:', error);
            this.showNotification('Error en escaneo biométrico', 'error');
        }
    }
    
    createLoadingModal(title, description) {
        const modal = document.createElement('div');
        modal.className = 'loading-modal';
        modal.innerHTML = `
            <div class="loading-modal-content">
                <div class="loading-animation">
                    <div class="scanning-circle"></div>
                </div>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
    
    showBiometricResult() {
        const resultHtml = `
            <div class="biometric-result">
                <div class="biometric-header">
                    <h4>✅ Verificación Biométrica Exitosa</h4>
                </div>
                <div class="biometric-stats">
                    <div class="stat-item">
                        <span class="stat-label">Confianza:</span>
                        <span class="stat-value">98.5%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Estado:</span>
                        <span class="stat-value success">Verificado</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add to selfie preview area
        const selfiePreview = document.getElementById('selfiePreview');
        if (selfiePreview) {
            selfiePreview.innerHTML = resultHtml;
            selfiePreview.style.display = 'block';
        }
    }
}

// Initialize the KYC system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.kycSystem = new LaTandaKYCSystem();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.kycSystem) {
        // Auto-save when page becomes visible again
        window.kycSystem.saveFormData();
    }
});

// Handle beforeunload to save data
window.addEventListener('beforeunload', () => {
    if (window.kycSystem) {
        window.kycSystem.saveFormData();
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTandaKYCSystem;
}