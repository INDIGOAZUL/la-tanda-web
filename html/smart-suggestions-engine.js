/**
 * 💡 SMART SUGGESTIONS ENGINE - v1.3.0
 * Intelligent recommendation system for group creation
 *
 * Features:
 * - Risk assessment based on contribution amounts
 * - Frequency recommendations
 * - Participant optimization
 * - Best practices tips
 * - Auto-apply suggestions
 */

class SmartSuggestionsEngine {
    constructor(formHandler) {
        this.formHandler = formHandler;
        this.suggestions = [];
        this.suggestionsPanel = null;
        this.updateTimer = null;

        this.init();
    }

    init() {
        console.log('💡 Initializing Smart Suggestions Engine...');

        this.createSuggestionsPanel();
        this.setupUpdateListeners();

        console.log('✅ Smart Suggestions Engine ready!');
    }

    // ============================================
    // UI CREATION
    // ============================================

    createSuggestionsPanel() {
        // Check if already exists
        if (document.getElementById('suggestions-panel')) {
            this.suggestionsPanel = document.getElementById('suggestions-panel');
            return;
        }

        const panelHTML = `
            <div id="suggestions-panel" class="suggestions-panel collapsed">
                <div class="suggestions-header">
                    <h4>
                        <i class="fas fa-lightbulb"></i>
                        Sugerencias Inteligentes
                        <span id="suggestions-count" class="suggestions-count" style="display: none;">0</span>
                    </h4>
                    <button class="suggestions-toggle" onclick="smartSuggestions.togglePanel()">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                </div>

                <div class="suggestions-body" id="suggestions-body">
                    <div class="suggestions-empty">
                        <i class="fas fa-check-circle"></i>
                        <p>Todo se ve bien. Completa el formulario para recibir sugerencias personalizadas.</p>
                    </div>
                </div>
            </div>
        `;

        // Insert into DOM
        const createGroupTab = document.getElementById('create-group-tab');
        if (createGroupTab) {
            createGroupTab.insertAdjacentHTML('beforeend', panelHTML);
            this.suggestionsPanel = document.getElementById('suggestions-panel');
        }
    }

    setupUpdateListeners() {
        // Listen to form changes
        const formInputs = [
            'group-name',
            'contribution-amount',
            'max-participants',
            'payment-frequency',
            'start-date',
            'group-type',
            'late-payment-penalty',
            'grace-period'
        ];

        formInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.scheduleUpdate());
                element.addEventListener('change', () => this.scheduleUpdate());
            }
        });

        console.log('✅ Suggestions update listeners attached');
    }

    scheduleUpdate() {
        // Debounce updates
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }

        this.updateTimer = setTimeout(() => {
            this.generateSuggestions();
            this.renderSuggestions();
        }, 500); // 500ms debounce
    }

    // ============================================
    // SUGGESTIONS GENERATION ENGINE
    // ============================================

    generateSuggestions() {
        this.suggestions = [];

        // Get current form data
        const formData = this.getFormData();

        // Run all suggestion rules
        this.checkContributionAmount(formData);
        this.checkParticipantCount(formData);
        this.checkFrequency(formData);
        this.checkTotalPool(formData);
        this.checkStartDate(formData);
        this.checkPenaltySettings(formData);
        this.checkGroupType(formData);
        this.provideOptimizationTips(formData);

        console.log(`💡 Generated ${this.suggestions.length} suggestions`, this.suggestions);
    }

    getFormData() {
        return {
            name: document.getElementById('group-name')?.value || '',
            contribution: parseFloat(document.getElementById('contribution-amount')?.value) || 0,
            maxParticipants: parseInt(document.getElementById('max-participants')?.value) || 0,
            frequency: document.getElementById('payment-frequency')?.value || '',
            startDate: document.getElementById('start-date')?.value || '',
            type: document.getElementById('group-type')?.value || '',
            penalty: parseFloat(document.getElementById('late-payment-penalty')?.value) || 0,
            gracePeriod: parseInt(document.getElementById('grace-period')?.value) || 0
        };
    }

    // ============================================
    // SUGGESTION RULES
    // ============================================

    checkContributionAmount(data) {
        if (data.contribution === 0) return;

        // Rule 1: Very low contribution
        if (data.contribution < 200) {
            this.addSuggestion({
                type: 'warning',
                title: 'Contribución muy baja',
                message: `L. ${data.contribution} puede ser difícil de gestionar y atraer participantes. Se recomienda un mínimo de L. 200 para mayor efectividad.`,
                icon: 'exclamation-triangle',
                risk: 'medium',
                actions: [
                    {
                        label: 'Ajustar a L. 500',
                        value: 500,
                        field: 'contribution-amount'
                    },
                    {
                        label: 'Ajustar a L. 1,000',
                        value: 1000,
                        field: 'contribution-amount'
                    }
                ]
            });
        }

        // Rule 2: Very high contribution
        if (data.contribution > 5000) {
            this.addSuggestion({
                type: 'info',
                title: 'Contribución alta detectada',
                message: `L. ${data.contribution.toLocaleString('es-HN')} requiere participantes con capacidad financiera sólida. Considera reducir si quieres más participantes.`,
                icon: 'info-circle',
                risk: 'low',
                details: {
                    title: 'Recomendaciones',
                    items: [
                        'Verificar capacidad de pago de participantes',
                        'Considerar seguro o garantías adicionales',
                        'Establecer proceso de verificación riguroso'
                    ]
                }
            });
        }

        // Rule 3: Sweet spot recommendation
        if (data.contribution >= 500 && data.contribution <= 2000) {
            this.addSuggestion({
                type: 'success',
                title: 'Monto óptimo seleccionado',
                message: `L. ${data.contribution.toLocaleString('es-HN')} es un monto equilibrado que atrae participantes comprometidos y es manejable para la mayoría.`,
                icon: 'check-circle',
                risk: 'low'
            });
        }
    }

    checkParticipantCount(data) {
        if (data.maxParticipants === 0) return;

        // Rule 1: Too few participants
        if (data.maxParticipants < 5) {
            this.addSuggestion({
                type: 'warning',
                title: 'Pocos participantes',
                message: `${data.maxParticipants} participantes pueden crear un grupo vulnerable. Se recomienda mínimo 5 participantes para mejor estabilidad.`,
                icon: 'users',
                risk: 'medium',
                actions: [
                    {
                        label: 'Ajustar a 8 participantes',
                        value: 8,
                        field: 'max-participants'
                    },
                    {
                        label: 'Ajustar a 12 participantes',
                        value: 12,
                        field: 'max-participants'
                    }
                ]
            });
        }

        // Rule 2: Too many participants
        if (data.maxParticipants > 15) {
            this.addSuggestion({
                type: 'info',
                title: 'Grupo grande detectado',
                message: `${data.maxParticipants} participantes requieren coordinación sólida. Considera dividir en múltiples grupos más pequeños.`,
                icon: 'users',
                risk: 'medium',
                details: {
                    title: 'Consideraciones',
                    items: [
                        'Mayor dificultad de coordinación',
                        'Tiempo de espera más largo para recibir fondos',
                        'Mayor riesgo de incumplimientos'
                    ]
                }
            });
        }

        // Rule 3: Optimal range
        if (data.maxParticipants >= 8 && data.maxParticipants <= 12) {
            this.addSuggestion({
                type: 'success',
                title: 'Tamaño de grupo óptimo',
                message: `${data.maxParticipants} participantes es un tamaño ideal que balancea diversidad con manejabilidad.`,
                icon: 'check-circle',
                risk: 'low'
            });
        }
    }

    checkFrequency(data) {
        if (!data.frequency || data.contribution === 0 || data.maxParticipants === 0) return;

        const totalPool = data.contribution * data.maxParticipants;

        // Rule 1: Weekly for large amounts
        if (data.frequency === 'weekly' && totalPool > 10000) {
            this.addSuggestion({
                type: 'tip',
                title: 'Considera frecuencia quincenal',
                message: `Para un fondo total de L. ${totalPool.toLocaleString('es-HN')}, pagos quincenales o mensuales pueden ser más manejables.`,
                icon: 'calendar',
                risk: 'low',
                actions: [
                    {
                        label: 'Cambiar a quincenal',
                        value: 'biweekly',
                        field: 'payment-frequency'
                    },
                    {
                        label: 'Cambiar a mensual',
                        value: 'monthly',
                        field: 'payment-frequency'
                    }
                ]
            });
        }

        // Rule 2: Monthly for low amounts
        if (data.frequency === 'monthly' && data.contribution < 500) {
            this.addSuggestion({
                type: 'tip',
                title: 'Frecuencia semanal recomendada',
                message: `Para contribuciones pequeñas (L. ${data.contribution}), pagos semanales mantienen el compromiso y momentum del grupo.`,
                icon: 'calendar-alt',
                risk: 'low',
                actions: [
                    {
                        label: 'Cambiar a semanal',
                        value: 'weekly',
                        field: 'payment-frequency'
                    }
                ]
            });
        }
    }

    checkTotalPool(data) {
        if (data.contribution === 0 || data.maxParticipants === 0) return;

        const totalPool = data.contribution * data.maxParticipants;

        // Rule 1: Very large pool
        if (totalPool > 50000) {
            this.addSuggestion({
                type: 'warning',
                title: 'Fondo total muy alto',
                message: `L. ${totalPool.toLocaleString('es-HN')} requiere medidas de seguridad avanzadas y verificación rigurosa de participantes.`,
                icon: 'shield-alt',
                risk: 'high',
                details: {
                    title: 'Medidas recomendadas',
                    items: [
                        'Contratos legales firmados',
                        'Verificación de identidad completa',
                        'Seguro de grupo o garantías',
                        'Cuenta bancaria específica para el grupo'
                    ]
                }
            });
        }

        // Rule 2: Optimal pool
        if (totalPool >= 5000 && totalPool <= 25000) {
            this.addSuggestion({
                type: 'success',
                title: 'Fondo total equilibrado',
                message: `L. ${totalPool.toLocaleString('es-HN')} es un monto manejable que permite crecimiento sin riesgos excesivos.`,
                icon: 'piggy-bank',
                risk: 'low'
            });
        }
    }

    checkStartDate(data) {
        if (!data.startDate) return;

        const startDate = new Date(data.startDate);
        const today = new Date();
        const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

        // Rule 1: Too soon
        if (daysUntilStart < 3 && daysUntilStart >= 0) {
            this.addSuggestion({
                type: 'warning',
                title: 'Poco tiempo de preparación',
                message: `El grupo inicia en ${daysUntilStart} días. Considera dar más tiempo para reclutar y verificar participantes.`,
                icon: 'clock',
                risk: 'medium',
                actions: [
                    {
                        label: 'Postponer 1 semana',
                        value: this.getDatePlusDays(7),
                        field: 'start-date'
                    },
                    {
                        label: 'Postponer 2 semanas',
                        value: this.getDatePlusDays(14),
                        field: 'start-date'
                    }
                ]
            });
        }

        // Rule 2: In the past
        if (daysUntilStart < 0) {
            this.addSuggestion({
                type: 'warning',
                title: 'Fecha de inicio en el pasado',
                message: `La fecha seleccionada ya pasó. Por favor selecciona una fecha futura.`,
                icon: 'exclamation-triangle',
                risk: 'high',
                actions: [
                    {
                        label: 'Usar mañana',
                        value: this.getDatePlusDays(1),
                        field: 'start-date'
                    },
                    {
                        label: 'Próximo lunes',
                        value: this.getNextMonday(),
                        field: 'start-date'
                    }
                ]
            });
        }

        // Rule 3: Optimal timeframe
        if (daysUntilStart >= 7 && daysUntilStart <= 14) {
            this.addSuggestion({
                type: 'success',
                title: 'Tiempo de preparación adecuado',
                message: `${daysUntilStart} días es un tiempo óptimo para organizar el grupo y reclutar participantes.`,
                icon: 'calendar-check',
                risk: 'low'
            });
        }
    }

    checkPenaltySettings(data) {
        if (data.penalty === 0) return;

        // Rule 1: Penalty too low
        if (data.penalty < data.contribution * 0.05) {
            this.addSuggestion({
                type: 'tip',
                title: 'Penalidad puede ser muy baja',
                message: `L. ${data.penalty} puede no ser suficiente incentivo. Se recomienda 5-10% de la contribución (L. ${(data.contribution * 0.05).toFixed(2)} - L. ${(data.contribution * 0.10).toFixed(2)}).`,
                icon: 'percentage',
                risk: 'low',
                actions: [
                    {
                        label: `Ajustar a 5% (L. ${(data.contribution * 0.05).toFixed(2)})`,
                        value: (data.contribution * 0.05).toFixed(2),
                        field: 'late-payment-penalty'
                    },
                    {
                        label: `Ajustar a 10% (L. ${(data.contribution * 0.10).toFixed(2)})`,
                        value: (data.contribution * 0.10).toFixed(2),
                        field: 'late-payment-penalty'
                    }
                ]
            });
        }

        // Rule 2: Penalty too high
        if (data.penalty > data.contribution * 0.20) {
            this.addSuggestion({
                type: 'warning',
                title: 'Penalidad muy alta',
                message: `L. ${data.penalty} (${((data.penalty / data.contribution) * 100).toFixed(0)}%) puede desincentivar participación. Se recomienda máximo 20%.`,
                icon: 'hand-paper',
                risk: 'medium',
                actions: [
                    {
                        label: `Reducir a 10% (L. ${(data.contribution * 0.10).toFixed(2)})`,
                        value: (data.contribution * 0.10).toFixed(2),
                        field: 'late-payment-penalty'
                    }
                ]
            });
        }
    }

    checkGroupType(data) {
        if (!data.type || data.contribution === 0) return;

        // Rule: Mismatched type and amount
        if (data.type === 'savings' && data.contribution < 500) {
            this.addSuggestion({
                type: 'tip',
                title: 'Tipo de grupo y monto',
                message: `Para un grupo de "Ahorros", considera contribuciones más altas (mínimo L. 500) para acumular fondos significativos.`,
                icon: 'piggy-bank',
                risk: 'low'
            });
        }

        if (data.type === 'emergency' && data.contribution < 300) {
            this.addSuggestion({
                type: 'tip',
                title: 'Fondo de emergencia',
                message: `Para emergencias, se recomienda mínimo L. 300 por persona para cubrir gastos imprevistos efectivamente.`,
                icon: 'medkit',
                risk: 'low'
            });
        }
    }

    provideOptimizationTips(data) {
        // Only show if form is substantially filled
        if (data.contribution > 0 && data.maxParticipants > 0 && data.frequency) {

            const totalPool = data.contribution * data.maxParticipants;

            // General optimization tip
            if (this.suggestions.filter(s => s.type === 'warning').length === 0) {
                this.addSuggestion({
                    type: 'tip',
                    title: 'Mejora la confianza del grupo',
                    message: 'Considera agregar una descripción detallada y reglas claras para atraer participantes comprometidos.',
                    icon: 'star',
                    risk: 'low'
                });
            }
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    getDatePlusDays(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    getNextMonday() {
        const date = new Date();
        const day = date.getDay();
        const daysUntilMonday = (1 + 7 - day) % 7 || 7;
        date.setDate(date.getDate() + daysUntilMonday);
        return date.toISOString().split('T')[0];
    }

    addSuggestion(suggestion) {
        this.suggestions.push({
            id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...suggestion
        });
    }

    // ============================================
    // RENDERING
    // ============================================

    renderSuggestions() {
        const body = document.getElementById('suggestions-body');
        const count = document.getElementById('suggestions-count');

        if (!body) return;

        // Update count
        if (count) {
            count.textContent = this.suggestions.length;
            count.style.display = this.suggestions.length > 0 ? 'inline-flex' : 'none';
        }

        // Auto-expand if has suggestions
        if (this.suggestions.length > 0 && this.suggestionsPanel) {
            this.suggestionsPanel.classList.remove('collapsed');
        }

        // Render empty state or suggestions
        if (this.suggestions.length === 0) {
            body.innerHTML = `
                <div class="suggestions-empty">
                    <i class="fas fa-check-circle"></i>
                    <p>Todo se ve bien. Completa el formulario para recibir sugerencias personalizadas.</p>
                </div>
            `;
            return;
        }

        // Render suggestions
        const suggestionsHTML = this.suggestions.map(s => this.renderSuggestion(s)).join('');
        body.innerHTML = suggestionsHTML;
    }

    renderSuggestion(suggestion) {
        const actionsHTML = suggestion.actions
            ? `<div class="suggestion-actions">
                ${suggestion.actions.map(action => `
                    <button class="suggestion-btn suggestion-btn-primary"
                            onclick="smartSuggestions.applySuggestion('${action.field}', '${action.value}')">
                        <i class="fas fa-magic"></i>
                        ${action.label}
                    </button>
                `).join('')}
               </div>`
            : '';

        const detailsHTML = suggestion.details
            ? `<div class="suggestion-details">
                <div class="suggestion-details-title">${suggestion.details.title}</div>
                <ul class="suggestion-details-list">
                    ${suggestion.details.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
               </div>`
            : '';

        const riskHTML = suggestion.risk
            ? `<span class="risk-badge risk-${suggestion.risk}">
                <i class="fas fa-shield-alt"></i>
                Riesgo: ${suggestion.risk === 'low' ? 'Bajo' : suggestion.risk === 'medium' ? 'Medio' : 'Alto'}
               </span>`
            : '';

        return `
            <div class="suggestion-item type-${suggestion.type}" data-id="${suggestion.id}">
                <div class="suggestion-header">
                    <i class="suggestion-icon fas fa-${suggestion.icon}"></i>
                    <div class="suggestion-content">
                        <h5 class="suggestion-title">${suggestion.title}</h5>
                        <p class="suggestion-message">${suggestion.message}</p>
                        ${riskHTML}
                        ${detailsHTML}
                        ${actionsHTML}
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // ACTIONS
    // ============================================

    applySuggestion(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (!field) {
            console.error(`Field ${fieldId} not found`);
            return;
        }

        // Apply the value
        field.value = value;

        // Trigger change event
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true }));

        // Show feedback
        this.showAppliedFeedback(field);

        // Re-generate suggestions
        setTimeout(() => {
            this.generateSuggestions();
            this.renderSuggestions();
        }, 300);

        console.log(`✅ Applied suggestion: ${fieldId} = ${value}`);
    }

    showAppliedFeedback(field) {
        // Add temporary highlight
        field.style.transition = 'all 0.3s ease';
        field.style.background = 'rgba(16, 185, 129, 0.2)';
        field.style.borderColor = '#10b981';

        setTimeout(() => {
            field.style.background = '';
            field.style.borderColor = '';
        }, 2000);
    }

    togglePanel() {
        if (this.suggestionsPanel) {
            this.suggestionsPanel.classList.toggle('collapsed');

            const icon = this.suggestionsPanel.querySelector('.suggestions-toggle i');
            if (icon) {
                icon.className = this.suggestionsPanel.classList.contains('collapsed')
                    ? 'fas fa-chevron-up'
                    : 'fas fa-chevron-down';
            }
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================

    refresh() {
        this.generateSuggestions();
        this.renderSuggestions();
    }

    getSuggestions() {
        return this.suggestions;
    }

    clearSuggestions() {
        this.suggestions = [];
        this.renderSuggestions();
    }
}

// Initialize when form handler is ready
if (typeof window !== 'undefined') {
    window.SmartSuggestionsEngine = SmartSuggestionsEngine;

    // Auto-initialize after form handler
    if (window.createGroupFormHandler) {
        window.smartSuggestions = new SmartSuggestionsEngine(window.createGroupFormHandler);
    } else {
        // Wait for form handler to be ready
        document.addEventListener('DOMContentLoaded', () => {
            if (window.createGroupFormHandler) {
                window.smartSuggestions = new SmartSuggestionsEngine(window.createGroupFormHandler);
            }
        });
    }
}
