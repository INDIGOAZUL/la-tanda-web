/**
 * CREATE GROUP FORM HANDLER
 * Maneja el formulario de creacion de grupos con validacion completa
 * Integra con el sistema completo de tandas
 * Version: 1.3.0
 * Date: 2026-02-19
 *
 * Changelog v1.3.0:
 * - Security audit: all user data escaped in innerHTML
 * - error.message replaced with generic Spanish messages
 * - Inline onclick handlers eliminated (collapsible, retry)
 * - Delegated click handler for data-action="cgf-*"
 * - getTypeLabel/getFrequencyLabel fallbacks escaped
 * - showSuccessMessage escapes group.name and group.id
 *
 * Changelog v1.2.6:
 * - BYPASS integration.js cache issue
 * - Direct DOM manipulation for tab switching
 * - Guaranteed to work even with cached JS files
 *
 * Changelog v1.2.5:
 * - Fixed button staying in loading state forever
 * - Added explicit button reset before tab switch
 */

// Standalone escape helper for use outside the class
function _cgfEscapeHtml(text) {
    if (text == null) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

class CreateGroupFormHandler {
    // XSS prevention helper
    escapeHtml(text) {
        return _cgfEscapeHtml(text);
    }

    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.validationErrors = {};

        this.init();
    }

    init() {

        this.initializeRequiredFields();
        this.setupFormNavigation();
        this.setupFormValidation();
        this.setupCollapsibles();
        this.setupCharacterCounters();

    }

    initializeRequiredFields() {
        // Convert all required fields to data-required pattern
        // This allows us to dynamically enable/disable validation per step
        const form = document.getElementById('create-group-form');
        if (!form) return;

        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.setAttribute('data-required', 'true');
            field.removeAttribute('required');
        });


        // Now enable required only for step 1 (current step)
        this.updateStepDisplay();
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
        // Delegated handler replaces inline onclick="toggleCollapsible(this)"
        // HTML collapsible headers should use data-action="cgf-toggle-collapsible"
        // Legacy support: also handle clicks on .collapsible-header elements
        const form = document.getElementById('create-group-form');
        if (!form) return;

        form.addEventListener('click', (e) => {
            const header = e.target.closest('.collapsible-header, [data-action="cgf-toggle-collapsible"]');
            if (!header) return;

            const content = header.nextElementSibling;
            if (!content) return;
            const icon = header.querySelector('.collapsible-icon');

            if (content.classList.contains('expanded')) {
                content.classList.remove('expanded');
                if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                content.classList.add('expanded');
                if (icon) icon.style.transform = 'rotate(180deg)';
            }
        });
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
            progressFill.style.width = progressPercent + '%';
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
        // FIX: Use data-step attribute instead of index to handle non-sequential steps
        document.querySelectorAll('.step-container').forEach((container) => {
            const stepNumber = parseInt(container.getAttribute('data-step'));
            if (stepNumber === this.currentStep) {
                container.classList.add('active');
                // Enable required validation for THIS step only
                container.querySelectorAll('[data-required="true"]').forEach(field => {
                    field.setAttribute('required', 'required');
                });
            } else {
                container.classList.remove('active');
                // Disable required validation for OTHER steps
                container.querySelectorAll('[required]').forEach(field => {
                    field.removeAttribute('required');
                    field.setAttribute('data-required', 'true'); // Remember it was required
                });
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
                if (nextText) nextText.textContent = 'Crear Grupo';
                nextButton.innerHTML = '<i class="fas fa-plus-circle"></i><span>Crear Grupo</span>';
            } else {
                if (nextText) nextText.textContent = 'Continuar';
                nextButton.innerHTML = '<span>Continuar</span><i class="fas fa-arrow-right"></i>';
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
            this.showFieldError('location', 'La ubicacion debe tener al menos 3 caracteres');
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
        const frequencyField = document.getElementById('payment-frequency');
        if (frequencyField) {
            const frequency = frequencyField.value;
            if (!frequency) {
                this.showFieldError('payment-frequency', 'Selecciona una frecuencia de pago');
                isValid = false;
            } else {
                this.clearFieldError('payment-frequency');
            }
        }

        return isValid;
    }

    validateStep3() {
        // Optional step - basic validation
        const penaltyAmount = document.getElementById('penalty-amount').value;
        if (penaltyAmount && (isNaN(penaltyAmount) || penaltyAmount < 0)) {
            this.showFieldError('penalty-amount', 'Monto de multa debe ser un numero valido');
            return false;
        }

        const gracePeriod = document.getElementById('grace-period').value;
        if (gracePeriod && (isNaN(gracePeriod) || gracePeriod < 0 || gracePeriod > 15)) {
            this.showFieldError('grace-period', 'Periodo de gracia debe ser entre 0 y 15 dias');
            return false;
        }

        return true;
    }

    validateStep4() {
        const acceptTerms = document.getElementById('accept-terms').checked;
        if (!acceptTerms) {
            this.showFieldError('accept-terms', 'Debes aceptar los terminos y condiciones');
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
                    errorMessage = 'La descripcion debe tener al menos 10 caracteres';
                    isValid = false;
                } else if (value.length > 250) {
                    errorMessage = 'La descripcion no puede exceder 250 caracteres';
                    isValid = false;
                }
                break;

            case 'contribution':
                const contribution = parseFloat(value);
                if (!value || isNaN(contribution)) {
                    errorMessage = 'La contribucion es requerida';
                    isValid = false;
                } else if (contribution < 100) {
                    errorMessage = 'La contribucion minima es L. 100';
                    isValid = false;
                } else if (contribution > 50000) {
                    errorMessage = 'La contribucion maxima es L. 50,000';
                    isValid = false;
                }
                break;

            case 'max-participants':
                const maxParticipants = parseInt(value);
                if (!value || isNaN(maxParticipants)) {
                    errorMessage = 'El numero de participantes es requerido';
                    isValid = false;
                } else if (maxParticipants < 2) {
                    errorMessage = 'Minimo 2 participantes';
                    isValid = false;
                } else if (maxParticipants > 50) {
                    errorMessage = 'Maximo 50 participantes';
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
        const errorElement = document.getElementById(fieldId + '-error');

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
        const errorElement = document.getElementById(fieldId + '-error');

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

        // Parse numeric values safely for display
        var contributionNum = parseFloat(this.formData.contribution);
        var participantsNum = parseInt(this.formData.maxParticipants);
        var contributionDisplay = (!isNaN(contributionNum) && isFinite(contributionNum)) ? contributionNum.toLocaleString() : '0';
        var participantsDisplay = (!isNaN(participantsNum) && isFinite(participantsNum)) ? String(participantsNum) : '0';
        var totalPerCycle = (!isNaN(contributionNum) && !isNaN(participantsNum)) ? (contributionNum * participantsNum).toLocaleString() : '0';

        var summary = '<div class="confirmation-sections">'
            + '<div class="confirmation-section">'
            + '<h4><i class="fas fa-info-circle"></i> Informacion Basica</h4>'
            + '<div class="confirmation-grid">'
            + '<div class="confirmation-item">'
            + '<span class="item-label">Nombre:</span>'
            + '<span class="item-value">' + this.escapeHtml(this.formData.name) + '</span>'
            + '</div>'
            + '<div class="confirmation-item">'
            + '<span class="item-label">Tipo:</span>'
            + '<span class="item-value">' + this.escapeHtml(this.getTypeLabel(this.formData.type)) + '</span>'
            + '</div>'
            + '<div class="confirmation-item">'
            + '<span class="item-label">Ubicacion:</span>'
            + '<span class="item-value">' + this.escapeHtml(this.formData.location) + '</span>'
            + '</div>'
            + '<div class="confirmation-item">'
            + '<span class="item-label">Reuniones Virtuales:</span>'
            + '<span class="item-value">' + (this.formData.virtualMeetings === 'yes' ? 'Si' : 'No') + '</span>'
            + '</div>'
            + '</div>'
            + '<div class="confirmation-description">'
            + '<span class="item-label">Descripcion:</span>'
            + '<p>' + this.escapeHtml(this.formData.description) + '</p>'
            + '</div>'
            + '</div>'

            + '<div class="confirmation-section">'
            + '<h4><i class="fas fa-dollar-sign"></i> Configuracion Financiera</h4>'
            + '<div class="confirmation-grid">'
            + '<div class="confirmation-item">'
            + '<span class="item-label">Contribucion:</span>'
            + '<span class="item-value">L. ' + this.escapeHtml(contributionDisplay) + '</span>'
            + '</div>'
            + '<div class="confirmation-item">'
            + '<span class="item-label">Max. Participantes:</span>'
            + '<span class="item-value">' + this.escapeHtml(participantsDisplay) + ' personas</span>'
            + '</div>'
            + '<div class="confirmation-item">'
            + '<span class="item-label">Frecuencia:</span>'
            + '<span class="item-value">' + this.escapeHtml(this.getFrequencyLabel(this.formData.paymentFrequency)) + '</span>'
            + '</div>'
            + '<div class="confirmation-item">'
            + '<span class="item-label">Fecha de Inicio:</span>'
            + '<span class="item-value">' + this.escapeHtml(this.formData.startDate || 'No especificada') + '</span>'
            + '</div>'
            + '</div>'
            + '</div>'

            + '<div class="confirmation-section">'
            + '<h4><i class="fas fa-shield-alt"></i> Configuracion Avanzada</h4>'
            + '<div class="confirmation-features">'
            + this.renderConfirmationFeatures()
            + '</div>'
            + '</div>'

            + '<div class="confirmation-totals">'
            + '<div class="total-item">'
            + '<span class="total-label">Total por Ciclo:</span>'
            + '<span class="total-value">L. ' + this.escapeHtml(totalPerCycle) + '</span>'
            + '</div>'
            + '<div class="total-item">'
            + '<span class="total-label">Duracion Estimada:</span>'
            + '<span class="total-value">' + this.escapeHtml(this.calculateEstimatedDuration()) + '</span>'
            + '</div>'
            + '</div>'
            + '</div>';

        summaryContainer.innerHTML = summary;
    }

    renderConfirmationFeatures() {
        var features = [];

        if (this.formData.requireKYC) features.push('Verificacion de identidad requerida');
        if (this.formData.earlyWithdrawals) features.push('Retiros anticipados permitidos');
        if (this.formData.latePenalties) features.push('Multas por pagos tardios');
        if (this.formData.autoSuspend) features.push('Suspension automatica tras 3 faltas');
        if (this.formData.notifyPaymentReminder) features.push('Recordatorios de pago automaticos');

        if (features.length === 0) {
            return '<span class="no-features">Configuracion basica</span>';
        }

        // Features are hardcoded strings (not user data), safe without escaping
        return features.map(function(feature) { return '<div class="feature-item"><i class="fas fa-check"></i> ' + feature + '</div>'; }).join('');
    }

    calculateEstimatedDuration() {
        var participants = parseInt(this.formData.maxParticipants);
        var frequency = this.formData.paymentFrequency;

        var frequencyDays = {
            'weekly': 7,
            'biweekly': 14,
            'monthly': 30
        };

        var totalDays = participants * (frequencyDays[frequency] || 30);
        var totalMonths = Math.round(totalDays / 30);

        if (totalMonths < 12) {
            return totalMonths + ' meses';
        } else {
            var years = Math.floor(totalMonths / 12);
            var remainingMonths = totalMonths % 12;
            return remainingMonths > 0 ? years + ' anos y ' + remainingMonths + ' meses' : years + ' anos';
        }
    }

    async createGroup() {
        try {
            // Show loading state
            var nextButton = document.getElementById('next-step');
            if (nextButton) {
                nextButton.disabled = true;
                nextButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Creando Grupo...</span>';
            }

            // Create group using the complete system
            if (!window.laTandaSystemComplete) {
                throw new Error('Sistema no inicializado');
            }

            var newGroup = await window.laTandaSystemComplete.createRealGroup(this.formData);

            if (newGroup) {
                // Success - redirect to groups view
                this.showSuccessMessage(newGroup);

                var self = this;
                setTimeout(async function() {
                    // Reset button state
                    var btn = document.getElementById('next-step');
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-plus-circle"></i><span>Crear Grupo</span>';
                    }

                    // DIRECT CALL to switchTab to bypass integration.js cache issue

                    // Hide all content sections
                    document.querySelectorAll('.content-section').forEach(function(section) {
                        section.classList.remove('active');
                    });

                    // Show My Groups section
                    var groupsSection = document.getElementById('groups');
                    if (groupsSection) {
                        groupsSection.classList.add('active');
                    }

                    // Update nav tabs
                    document.querySelectorAll('.nav-tab').forEach(function(tab) {
                        tab.classList.remove('active');
                    });
                    var groupsTab = document.querySelector('[data-tab="groups"]');
                    if (groupsTab) {
                        groupsTab.classList.add('active');
                    }

                    self.resetForm();
                }, 2000);
            }

        } catch (error) {
            // Generic error message — never expose error.message to UI
            this.showErrorMessage();

            // Reset button
            var nextButton = document.getElementById('next-step');
            if (nextButton) {
                nextButton.disabled = false;
                nextButton.innerHTML = '<i class="fas fa-plus-circle"></i><span>Crear Grupo</span>';
            }
        }
    }

    showSuccessMessage(group) {
        var summaryContainer = document.getElementById('confirmationSummary');
        if (summaryContainer) {
            var safeName = this.escapeHtml(group && group.name ? group.name : '');
            var safeId = this.escapeHtml(group && group.id ? group.id : '');

            summaryContainer.innerHTML = '<div class="success-message">'
                + '<div class="success-icon">'
                + '<i class="fas fa-check-circle"></i>'
                + '</div>'
                + '<h3>Grupo Creado Exitosamente!</h3>'
                + '<p>El grupo "' + safeName + '" ha sido creado y esta listo para recibir miembros.</p>'
                + '<div class="success-details">'
                + '<div class="detail-item">'
                + '<span>ID del Grupo:</span>'
                + '<span>' + safeId + '</span>'
                + '</div>'
                + '<div class="detail-item">'
                + '<span>Estado:</span>'
                + '<span>Reclutando miembros</span>'
                + '</div>'
                + '</div>'
                + '<p class="redirect-message">Seras redirigido a tus grupos en unos segundos...</p>'
                + '</div>';
        }
    }

    showErrorMessage() {
        var summaryContainer = document.getElementById('confirmationSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = '<div class="error-message">'
                + '<div class="error-icon">'
                + '<i class="fas fa-exclamation-circle"></i>'
                + '</div>'
                + '<h3>Error al Crear Grupo</h3>'
                + '<p>Ocurrio un error al crear el grupo. Por favor, revisa los datos e intenta nuevamente.</p>'
                + '<button type="button" data-action="cgf-retry">Intentar de nuevo</button>'
                + '</div>';
        }
    }

    resetForm() {
        this.currentStep = 1;
        this.formData = {};
        this.validationErrors = {};

        var form = document.getElementById('create-group-form');
        if (form) {
            form.reset();
        }

        this.updateStepDisplay();
    }

    getTypeLabel(type) {
        var labels = {
            'familiar': 'Familiar',
            'laboral': 'Laboral',
            'comunitario': 'Comunitario',
            'comercial': 'Comercial'
        };
        // Return from allowlist only; fallback is escaped by caller
        return labels[type] || String(type || '');
    }

    getFrequencyLabel(frequency) {
        var labels = {
            'weekly': 'Semanal',
            'biweekly': 'Quincenal',
            'monthly': 'Mensual'
        };
        // Return from allowlist only; fallback is escaped by caller
        return labels[frequency] || String(frequency || '');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the create section to be visible
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                var createSection = document.getElementById('create');
                if (createSection && createSection.classList.contains('active')) {
                    if (!window.createGroupFormHandler) {
                        window.createGroupFormHandler = new CreateGroupFormHandler();
                    }
                }
            }
        });
    });

    var createSection = document.getElementById('create');
    if (createSection) {
        observer.observe(createSection, { attributes: true });
    }
});

// Delegated click handler for all cgf-* data-action attributes
document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');
    if (!action || action.indexOf('cgf-') !== 0) return;

    var handler = window.createGroupFormHandler;
    if (!handler) return;

    switch (action) {
        case 'cgf-next-step':
            handler.nextStep();
            break;
        case 'cgf-prev-step':
            handler.previousStep();
            break;
        case 'cgf-retry':
            // Go back to step 4 (confirmation) and regenerate summary
            handler.generateConfirmationSummary();
            break;
        case 'cgf-toggle-collapsible':
            // Handled inside setupCollapsibles via form-scoped listener
            break;
    }
});
