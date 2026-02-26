/**
 * 🏗️ CREATE GROUP FORM HANDLER
 * Maneja el formulario de creación de grupos con validación completa
 * Integra con el sistema completo de tandas
 */

class CreateGroupFormHandler {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.validationErrors = {};
        
        this.init();
    }
    
    init() {
        console.log('🏗️ Initializing Create Group Form Handler...');
        
        this.setupFormNavigation();
        this.setupFormValidation();
        this.setupCollapsibles();
        this.setupCharacterCounters();
        
        console.log('✅ Create Group Form Handler ready!');
    }
    
    setupFormNavigation() {
        const nextButton = document.getElementById('next-step');
        const prevButton = document.getElementById('previous-step');
        
        if (nextButton) {
            nextButton.addEventListener('click', () => this.nextStep());
        }
        
        if (prevButton) {
            prevButton.addEventListener('click', () => this.previousStep());
        }
    }
    
    setupFormValidation() {
        // Real-time validation for key fields
        const form = document.getElementById('create-group-form');
        if (!form) return;
        
        const fields = [
            'group-name',
            'group-description', 
            'contribution',
            'max-participants'
        ];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldId));
                field.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });
    }
    
    setupCollapsibles() {
        window.toggleCollapsible = (header) => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.collapsible-icon');
            
            if (content.classList.contains('expanded')) {
                content.classList.remove('expanded');
                icon.style.transform = 'rotate(0deg)';
            } else {
                content.classList.add('expanded');
                icon.style.transform = 'rotate(180deg)';
            }
        };
    }
    
    setupCharacterCounters() {
        const descriptionField = document.getElementById('group-description');
        const counter = document.getElementById('desc-count');
        
        if (descriptionField && counter) {
            descriptionField.addEventListener('input', () => {
                const count = descriptionField.value.length;
                counter.textContent = count;
                
                if (count > 250) {
                    counter.style.color = '#f87171';
                    descriptionField.value = descriptionField.value.substring(0, 250);
                } else {
                    counter.style.color = '';
                }
            });
        }
    }
    
    nextStep() {
        // Validate current step
        if (!this.validateCurrentStep()) {
            return;
        }
        
        // Save current step data
        this.saveCurrentStepData();
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepDisplay();
            
            if (this.currentStep === this.totalSteps) {
                this.generateConfirmationSummary();
            }
        } else {
            // Final step - create group
            this.createGroup();
        }
    }
    
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }
    
    updateStepDisplay() {
        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        const progressPercent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
        }
        
        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        // Show/hide step containers
        document.querySelectorAll('.step-container').forEach((container, index) => {
            const stepNumber = index + 1;
            if (stepNumber === this.currentStep) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        });
        
        // Update navigation buttons
        const prevButton = document.getElementById('previous-step');
        const nextButton = document.getElementById('next-step');
        
        if (prevButton) {
            prevButton.style.display = this.currentStep === 1 ? 'none' : 'flex';
        }
        
        if (nextButton) {
            const nextText = nextButton.querySelector('span');
            if (this.currentStep === this.totalSteps) {
                nextText.textContent = 'Crear Grupo';
                nextButton.innerHTML = `<i class="fas fa-plus-circle"></i><span>Crear Grupo</span>`;
            } else {
                nextText.textContent = 'Continuar';
                nextButton.innerHTML = `<span>Continuar</span><i class="fas fa-arrow-right"></i>`;
            }
        }
    }
    
    validateCurrentStep() {
        let isValid = true;
        
        switch (this.currentStep) {
            case 1:
                isValid = this.validateStep1();
                break;
            case 2:
                isValid = this.validateStep2();
                break;
            case 3:
                isValid = this.validateStep3();
                break;
            case 4:
                isValid = this.validateStep4();
                break;
        }
        
        return isValid;
    }
    
    validateStep1() {
        let isValid = true;
        
        // Group name
        if (!this.validateField('group-name')) isValid = false;
        
        // Group description
        if (!this.validateField('group-description')) isValid = false;
        
        // Group type
        const groupType = document.getElementById('group-type').value;
        if (!groupType) {
            this.showFieldError('group-type', 'Selecciona un tipo de grupo');
            isValid = false;
        }
        
        // Location
        const location = document.getElementById('location').value.trim();
        if (!location || location.length < 3) {
            this.showFieldError('location', 'La ubicación debe tener al menos 3 caracteres');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateStep2() {
        let isValid = true;
        
        // Contribution
        if (!this.validateField('contribution')) isValid = false;
        
        // Max participants
        if (!this.validateField('max-participants')) isValid = false;
        
        // Payment frequency
        const frequency = document.getElementById('payment-frequency').value;
        if (!frequency) {
            this.showFieldError('payment-frequency', 'Selecciona una frecuencia de pago');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateStep3() {
        // Optional step - basic validation
        const penaltyAmount = document.getElementById('penalty-amount').value;
        if (penaltyAmount && (isNaN(penaltyAmount) || penaltyAmount < 0)) {
            this.showFieldError('penalty-amount', 'Monto de multa debe ser un número válido');
            return false;
        }
        
        const gracePeriod = document.getElementById('grace-period').value;
        if (gracePeriod && (isNaN(gracePeriod) || gracePeriod < 0 || gracePeriod > 15)) {
            this.showFieldError('grace-period', 'Período de gracia debe ser entre 0 y 15 días');
            return false;
        }
        
        return true;
    }
    
    validateStep4() {
        const acceptTerms = document.getElementById('accept-terms').checked;
        if (!acceptTerms) {
            this.showFieldError('accept-terms', 'Debes aceptar los términos y condiciones');
            return false;
        }
        
        return true;
    }
    
    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return true;
        
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        switch (fieldId) {
            case 'group-name':
                if (!value || value.length < 3) {
                    errorMessage = 'El nombre debe tener al menos 3 caracteres';
                    isValid = false;
                } else if (value.length > 50) {
                    errorMessage = 'El nombre no puede exceder 50 caracteres';
                    isValid = false;
                }
                break;
                
            case 'group-description':
                if (!value || value.length < 10) {
                    errorMessage = 'La descripción debe tener al menos 10 caracteres';
                    isValid = false;
                } else if (value.length > 250) {
                    errorMessage = 'La descripción no puede exceder 250 caracteres';
                    isValid = false;
                }
                break;
                
            case 'contribution':
                const contribution = parseFloat(value);
                if (!value || isNaN(contribution)) {
                    errorMessage = 'La contribución es requerida';
                    isValid = false;
                } else if (contribution < 100) {
                    errorMessage = 'La contribución mínima es L. 100';
                    isValid = false;
                } else if (contribution > 50000) {
                    errorMessage = 'La contribución máxima es L. 50,000';
                    isValid = false;
                }
                break;
                
            case 'max-participants':
                const maxParticipants = parseInt(value);
                if (!value || isNaN(maxParticipants)) {
                    errorMessage = 'El número de participantes es requerido';
                    isValid = false;
                } else if (maxParticipants < 2) {
                    errorMessage = 'Mínimo 2 participantes';
                    isValid = false;
                } else if (maxParticipants > 50) {
                    errorMessage = 'Máximo 50 participantes';
                    isValid = false;
                }
                break;
        }
        
        if (!isValid) {
            this.showFieldError(fieldId, errorMessage);
        } else {
            this.clearFieldError(fieldId);
        }
        
        return isValid;
    }
    
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field) {
            field.classList.add('error');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        this.validationErrors[fieldId] = message;
    }
    
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field) {
            field.classList.remove('error');
        }
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        delete this.validationErrors[fieldId];
    }
    
    saveCurrentStepData() {
        switch (this.currentStep) {
            case 1:
                this.formData.name = document.getElementById('group-name').value.trim();
                this.formData.description = document.getElementById('group-description').value.trim();
                this.formData.type = document.getElementById('group-type').value;
                this.formData.location = document.getElementById('location').value.trim();
                this.formData.virtualMeetings = document.querySelector('input[name="virtual-meetings"]:checked').value;
                break;
                
            case 2:
                this.formData.contribution = document.getElementById('contribution').value;
                this.formData.maxParticipants = document.getElementById('max-participants').value;
                this.formData.paymentFrequency = document.getElementById('payment-frequency').value;
                this.formData.startDate = document.getElementById('start-date').value;
                this.formData.earlyWithdrawals = document.getElementById('early-withdrawals').checked;
                this.formData.insuranceRequired = document.getElementById('insurance-required').checked;
                this.formData.latePenalties = document.getElementById('late-penalties').checked;
                break;
                
            case 3:
                this.formData.requireKYC = document.getElementById('require-id').checked;
                this.formData.requireIncome = document.getElementById('require-income').checked;
                this.formData.requireReferences = document.getElementById('require-references').checked;
                this.formData.requireMinTrustScore = document.getElementById('require-min-trust-score').checked;
                this.formData.rules = document.getElementById('group-rules').value.trim();
                this.formData.penaltyAmount = document.getElementById('penalty-amount').value;
                this.formData.gracePeriod = document.getElementById('grace-period').value;
                this.formData.autoSuspend = document.getElementById('auto-suspend').checked;
                this.formData.requireGuarantor = document.getElementById('require-guarantor').checked;
                this.formData.notifyPaymentReminder = document.getElementById('notify-payment-reminder').checked;
                this.formData.notifyMeetingReminder = document.getElementById('notify-meeting-reminder').checked;
                this.formData.notifyTurnUpdate = document.getElementById('notify-turn-update').checked;
                this.formData.notifyNewMembers = document.getElementById('notify-new-members').checked;
                break;
        }
    }
    
    generateConfirmationSummary() {
        const summaryContainer = document.getElementById('confirmationSummary');
        if (!summaryContainer) return;
        
        const summary = `
            <div class="confirmation-sections">
                <div class="confirmation-section">
                    <h4><i class="fas fa-info-circle"></i> Información Básica</h4>
                    <div class="confirmation-grid">
                        <div class="confirmation-item">
                            <span class="item-label">Nombre:</span>
                            <span class="item-value">${this.formData.name}</span>
                        </div>
                        <div class="confirmation-item">
                            <span class="item-label">Tipo:</span>
                            <span class="item-value">${this.getTypeLabel(this.formData.type)}</span>
                        </div>
                        <div class="confirmation-item">
                            <span class="item-label">Ubicación:</span>
                            <span class="item-value">${this.formData.location}</span>
                        </div>
                        <div class="confirmation-item">
                            <span class="item-label">Reuniones Virtuales:</span>
                            <span class="item-value">${this.formData.virtualMeetings === 'yes' ? 'Sí' : 'No'}</span>
                        </div>
                    </div>
                    <div class="confirmation-description">
                        <span class="item-label">Descripción:</span>
                        <p>${this.formData.description}</p>
                    </div>
                </div>
                
                <div class="confirmation-section">
                    <h4><i class="fas fa-dollar-sign"></i> Configuración Financiera</h4>
                    <div class="confirmation-grid">
                        <div class="confirmation-item">
                            <span class="item-label">Contribución:</span>
                            <span class="item-value">L. ${parseFloat(this.formData.contribution).toLocaleString()}</span>
                        </div>
                        <div class="confirmation-item">
                            <span class="item-label">Máx. Participantes:</span>
                            <span class="item-value">${this.formData.maxParticipants} personas</span>
                        </div>
                        <div class="confirmation-item">
                            <span class="item-label">Frecuencia:</span>
                            <span class="item-value">${this.getFrequencyLabel(this.formData.paymentFrequency)}</span>
                        </div>
                        <div class="confirmation-item">
                            <span class="item-label">Fecha de Inicio:</span>
                            <span class="item-value">${this.formData.startDate || 'No especificada'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="confirmation-section">
                    <h4><i class="fas fa-shield-alt"></i> Configuración Avanzada</h4>
                    <div class="confirmation-features">
                        ${this.renderConfirmationFeatures()}
                    </div>
                </div>
                
                <div class="confirmation-totals">
                    <div class="total-item">
                        <span class="total-label">Total por Ciclo:</span>
                        <span class="total-value">L. ${(parseFloat(this.formData.contribution) * parseInt(this.formData.maxParticipants)).toLocaleString()}</span>
                    </div>
                    <div class="total-item">
                        <span class="total-label">Duración Estimada:</span>
                        <span class="total-value">${this.calculateEstimatedDuration()}</span>
                    </div>
                </div>
            </div>
        `;
        
        summaryContainer.innerHTML = summary;
    }
    
    renderConfirmationFeatures() {
        const features = [];
        
        if (this.formData.requireKYC) features.push('Verificación de identidad requerida');
        if (this.formData.earlyWithdrawals) features.push('Retiros anticipados permitidos');
        if (this.formData.latePenalties) features.push('Multas por pagos tardíos');
        if (this.formData.autoSuspend) features.push('Suspensión automática tras 3 faltas');
        if (this.formData.notifyPaymentReminder) features.push('Recordatorios de pago automáticos');
        
        if (features.length === 0) {
            return '<span class="no-features">Configuración básica</span>';
        }
        
        return features.map(feature => `<div class="feature-item"><i class="fas fa-check"></i> ${feature}</div>`).join('');
    }
    
    calculateEstimatedDuration() {
        const participants = parseInt(this.formData.maxParticipants);
        const frequency = this.formData.paymentFrequency;
        
        const frequencyDays = {
            'weekly': 7,
            'biweekly': 14,
            'monthly': 30
        };
        
        const totalDays = participants * (frequencyDays[frequency] || 30);
        const totalMonths = Math.round(totalDays / 30);
        
        if (totalMonths < 12) {
            return `${totalMonths} meses`;
        } else {
            const years = Math.floor(totalMonths / 12);
            const remainingMonths = totalMonths % 12;
            return remainingMonths > 0 ? `${years} años y ${remainingMonths} meses` : `${years} años`;
        }
    }
    
    async createGroup() {
        try {
            // Show loading state
            const nextButton = document.getElementById('next-step');
            if (nextButton) {
                nextButton.disabled = true;
                nextButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Creando Grupo...</span>';
            }
            
            // Create group using the complete system
            if (!window.laTandaSystemComplete) {
                throw new Error('Sistema no inicializado');
            }
            
            const newGroup = await window.laTandaSystemComplete.createRealGroup(this.formData);
            
            if (newGroup) {
                // Success - redirect to groups view
                this.showSuccessMessage(newGroup);
                
                setTimeout(() => {
                    if (window.groupsIntegration) {
                        window.groupsIntegration.switchTab('groups');
                    }
                    this.resetForm();
                }, 2000);
            }
            
        } catch (error) {
            console.error('Error creating group:', error);
            this.showErrorMessage(error.message);
            
            // Reset button
            const nextButton = document.getElementById('next-step');
            if (nextButton) {
                nextButton.disabled = false;
                nextButton.innerHTML = '<i class="fas fa-plus-circle"></i><span>Crear Grupo</span>';
            }
        }
    }
    
    showSuccessMessage(group) {
        const summaryContainer = document.getElementById('confirmationSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="success-message">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>¡Grupo Creado Exitosamente!</h3>
                    <p>El grupo "${group.name}" ha sido creado y está listo para recibir miembros.</p>
                    <div class="success-details">
                        <div class="detail-item">
                            <span>ID del Grupo:</span>
                            <span>${group.id}</span>
                        </div>
                        <div class="detail-item">
                            <span>Estado:</span>
                            <span>Reclutando miembros</span>
                        </div>
                    </div>
                    <p class="redirect-message">Serás redirigido a tus grupos en unos segundos...</p>
                </div>
            `;
        }
    }
    
    showErrorMessage(message) {
        const summaryContainer = document.getElementById('confirmationSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Error al Crear Grupo</h3>
                    <p>${message}</p>
                    <p>Por favor, revisa los datos e intenta nuevamente.</p>
                </div>
            `;
        }
    }
    
    resetForm() {
        this.currentStep = 1;
        this.formData = {};
        this.validationErrors = {};
        
        const form = document.getElementById('create-group-form');
        if (form) {
            form.reset();
        }
        
        this.updateStepDisplay();
    }
    
    getTypeLabel(type) {
        const labels = {
            'familiar': 'Familiar',
            'laboral': 'Laboral',
            'comunitario': 'Comunitario',
            'comercial': 'Comercial'
        };
        return labels[type] || type;
    }
    
    getFrequencyLabel(frequency) {
        const labels = {
            'weekly': 'Semanal',
            'biweekly': 'Quincenal',
            'monthly': 'Mensual'
        };
        return labels[frequency] || frequency;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the create section to be visible
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const createSection = document.getElementById('create');
                if (createSection && createSection.classList.contains('active')) {
                    if (!window.createGroupFormHandler) {
                        window.createGroupFormHandler = new CreateGroupFormHandler();
                    }
                }
            }
        });
    });
    
    const createSection = document.getElementById('create');
    if (createSection) {
        observer.observe(createSection, { attributes: true });
    }
});

console.log('🏗️ Create Group Form Handler loaded!');