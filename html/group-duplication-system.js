/**
 * 📋 GROUP DUPLICATION SYSTEM - v1.4.0
 * Allows users to duplicate existing groups to create new ones
 *
 * Features:
 * - One-click duplicate button on group cards
 * - Confirmation modal with preview
 * - Auto-fill Create Group form with duplicated data
 * - Adjustable fields before creation
 * - Duplicate counter tracking
 */

class GroupDuplicationSystem {
    constructor() {
        this.duplicateQueue = null;
        this.modal = null;

        this.init();
    }

    init() {
        console.log('📋 Initializing Group Duplication System...');

        this.createDuplicateModal();
        this.injectDuplicateButtons();

        console.log('✅ Group Duplication System ready!');
    }

    // ============================================
    // MODAL CREATION
    // ============================================

    createDuplicateModal() {
        // Check if already exists
        if (document.getElementById('duplicate-confirmation-modal')) {
            this.modal = document.getElementById('duplicate-confirmation-modal');
            return;
        }

        const modalHTML = `
            <div id="duplicate-confirmation-modal" class="duplicate-modal" style="display: none;">
                <div class="duplicate-modal-overlay" onclick="groupDuplication.closeDuplicateModal()"></div>
                <div class="duplicate-modal-content">
                    <div class="duplicate-modal-header">
                        <h3>
                            <i class="fas fa-copy"></i>
                            Duplicar Grupo
                        </h3>
                        <button class="duplicate-modal-close" onclick="groupDuplication.closeDuplicateModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="duplicate-modal-body">
                        <div class="duplicate-info">
                            <div class="duplicate-info-item">
                                <i class="fas fa-info-circle"></i>
                                <div>
                                    <strong>¿Qué se duplicará?</strong>
                                    <p>Se copiará la configuración del grupo incluyendo: contribución, frecuencia, número de participantes, reglas y políticas.</p>
                                </div>
                            </div>

                            <div class="duplicate-info-item">
                                <i class="fas fa-edit"></i>
                                <div>
                                    <strong>¿Puedo modificar?</strong>
                                    <p>Sí, podrás ajustar todos los campos en el formulario antes de crear el nuevo grupo.</p>
                                </div>
                            </div>
                        </div>

                        <div class="duplicate-preview" id="duplicate-preview">
                            <h4>Vista Previa del Grupo a Duplicar</h4>
                            <div id="duplicate-preview-content"></div>
                        </div>
                    </div>

                    <div class="duplicate-modal-footer">
                        <button class="duplicate-btn-secondary" onclick="groupDuplication.closeDuplicateModal()">
                            <i class="fas fa-times"></i>
                            Cancelar
                        </button>
                        <button class="duplicate-btn-primary" onclick="groupDuplication.confirmDuplicate()">
                            <i class="fas fa-copy"></i>
                            Duplicar y Editar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('duplicate-confirmation-modal');
    }

    // ============================================
    // INJECT DUPLICATE BUTTONS
    // ============================================

    injectDuplicateButtons() {
        // This will be called periodically to add buttons to dynamically loaded groups
        this.addButtonsToExistingGroups();

        // Set up observer for dynamically loaded content
        this.setupGroupsObserver();

        console.log('✅ Duplicate buttons injected');
    }

    addButtonsToExistingGroups() {
        // Find all group cards (adjust selector based on actual HTML structure)
        const groupCards = document.querySelectorAll('[data-group-id], .group-item');

        // Skip tanda cards - they have their own actions
        // Tandas should not be duplicated from this system

        groupCards.forEach(card => {
            // Check if button already exists
            if (card.querySelector('.duplicate-group-btn')) {
                return;
            }

            // Find the actions container or create one
            let actionsContainer = card.querySelector('.group-actions, .card-actions');

            if (!actionsContainer) {
                // Try to find a good place to insert the button
                const header = card.querySelector('.group-header, .card-header, .tanda-header');
                if (header) {
                    actionsContainer = document.createElement('div');
                    actionsContainer.className = 'group-actions-duplicate';
                    actionsContainer.style.cssText = 'display: flex; gap: 0.5rem; margin-top: 0.75rem;';
                    header.appendChild(actionsContainer);
                }
            }

            if (actionsContainer) {
                const duplicateBtn = document.createElement('button');
                duplicateBtn.className = 'duplicate-group-btn action-btn btn-sm';
                duplicateBtn.innerHTML = '<i class="fas fa-copy"></i> Duplicar';
                duplicateBtn.style.cssText = 'background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8)); border: 1px solid rgba(59, 130, 246, 0.3);';

                duplicateBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const groupData = this.extractGroupDataFromCard(card);
                    this.showDuplicateModal(groupData);
                };

                actionsContainer.appendChild(duplicateBtn);
            }
        });
    }

    setupGroupsObserver() {
        // Observe DOM changes to add buttons to dynamically loaded groups
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const callback = (mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Re-inject buttons when DOM changes
                    setTimeout(() => this.addButtonsToExistingGroups(), 500);
                    break;
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }

    // ============================================
    // DATA EXTRACTION
    // ============================================

    extractGroupDataFromCard(card) {
        // Try to get group ID
        const groupId = card.getAttribute('data-group-id') || card.getAttribute('data-tanda-id') ||
                       card.getAttribute('data-id') ||
                       card.id;

        // Try to extract data from card elements
        const groupData = {
            id: groupId,
            name: this.extractText(card, '.group-name, .card-title, .tanda-name, h3, h4') || 'Grupo Sin Nombre',
            description: this.extractText(card, '.group-description, .card-description, .tanda-description, p') || '',
            type: this.extractAttribute(card, '.group-type, .badge', 'data-type') || 'general',
            contribution: this.extractNumber(card, '.contribution, .amount, .monthly-amount') || 0,
            maxParticipants: this.extractNumber(card, '.max-participants, .members-count, .total-members') || 10,
            frequency: this.extractAttribute(card, '.frequency', 'data-frequency') ||
                      this.extractFrequencyFromText(card) || 'monthly',
            location: this.extractText(card, '.location, .group-location') || '',
            penalty: this.extractNumber(card, '.penalty, .late-fee') || 0,
            gracePeriod: this.extractNumber(card, '.grace-period') || 3
        };

        // Try to get from global groups data if available
        if (window.laTandaSystemComplete && window.laTandaSystemComplete.groups) {
            const fullGroup = window.laTandaSystemComplete.groups.find(g => g.id === groupId);
            if (fullGroup) {
                return this.mapGroupToFormData(fullGroup);
            }
        }

        return groupData;
    }

    extractText(card, selector) {
        const element = card.querySelector(selector);
        return element ? element.textContent.trim() : null;
    }

    extractNumber(card, selector) {
        const element = card.querySelector(selector);
        if (!element) return null;

        const text = element.textContent.trim();
        const number = parseFloat(text.replace(/[^\d.]/g, ''));
        return isNaN(number) ? null : number;
    }

    extractAttribute(card, selector, attribute) {
        const element = card.querySelector(selector);
        return element ? element.getAttribute(attribute) : null;
    }

    extractFrequencyFromText(card) {
        const text = card.textContent.toLowerCase();
        if (text.includes('semanal') || text.includes('weekly')) return 'weekly';
        if (text.includes('quincenal') || text.includes('biweekly')) return 'biweekly';
        if (text.includes('mensual') || text.includes('monthly')) return 'monthly';
        return null;
    }

    mapGroupToFormData(group) {
        return {
            id: group.id,
            name: group.name || group.group_name || '',
            description: group.description || '',
            type: group.type || group.group_type || 'general',
            contribution: parseFloat(group.contribution_amount || group.contribution || 0),
            maxParticipants: parseInt(group.max_members || group.max_participants || 10),
            frequency: group.frequency || group.payment_frequency || 'monthly',
            location: group.location || '',
            virtualMeetings: group.virtual_meetings || false,
            penalty: parseFloat(group.late_payment_penalty || group.penalty_amount || 0),
            gracePeriod: parseInt(group.grace_period || 3),
            rules: group.rules || [],
            settings: group.settings || {}
        };
    }

    // ============================================
    // MODAL INTERACTIONS
    // ============================================

    showDuplicateModal(groupData) {
        if (!this.modal) return;

        this.duplicateQueue = groupData;

        // Render preview
        this.renderDuplicatePreview(groupData);

        // Show modal
        this.modal.style.display = 'flex';

        // Add animation
        setTimeout(() => {
            this.modal.classList.add('show');
        }, 10);

        console.log('📋 Showing duplicate modal for:', groupData);
    }

    renderDuplicatePreview(data) {
        const preview = document.getElementById('duplicate-preview-content');
        if (!preview) return;

        preview.innerHTML = `
            <div class="duplicate-preview-grid">
                <div class="preview-item">
                    <span class="preview-label">Nombre</span>
                    <span class="preview-value">${data.name}</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Tipo</span>
                    <span class="preview-value">${this.formatGroupType(data.type)}</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Contribución</span>
                    <span class="preview-value">L. ${data.contribution.toLocaleString('es-HN')}</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Participantes</span>
                    <span class="preview-value">${data.maxParticipants}</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Frecuencia</span>
                    <span class="preview-value">${this.formatFrequency(data.frequency)}</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Total del Fondo</span>
                    <span class="preview-value">L. ${(data.contribution * data.maxParticipants).toLocaleString('es-HN')}</span>
                </div>
            </div>
        `;
    }

    formatGroupType(type) {
        const types = {
            'general': 'General',
            'savings': 'Ahorros',
            'investment': 'Inversión',
            'emergency': 'Emergencia',
            'business': 'Negocio',
            'family': 'Familiar'
        };
        return types[type] || 'General';
    }

    formatFrequency(frequency) {
        const frequencies = {
            'weekly': 'Semanal',
            'biweekly': 'Quincenal',
            'monthly': 'Mensual'
        };
        return frequencies[frequency] || 'Mensual';
    }

    closeDuplicateModal() {
        if (!this.modal) return;

        this.modal.classList.remove('show');

        setTimeout(() => {
            this.modal.style.display = 'none';
            this.duplicateQueue = null;
        }, 300);
    }

    // ============================================
    // DUPLICATE CONFIRMATION
    // ============================================

    confirmDuplicate() {
        if (!this.duplicateQueue) {
            console.error('No group data to duplicate');
            return;
        }

        console.log('✅ Duplicating group:', this.duplicateQueue);

        // Close modal
        this.closeDuplicateModal();

        // Navigate to Create Group tab
        this.switchToCreateGroup();

        // Wait for tab to load, then fill form
        setTimeout(() => {
            this.fillCreateGroupForm(this.duplicateQueue);
        }, 500);
    }

    switchToCreateGroup() {
        // Try multiple methods to switch to Create Group tab
        if (typeof switchTab === 'function') {
            switchTab('create');
        } else if (typeof window.switchTab === 'function') {
            window.switchTab('create');
        } else {
            // Manual tab switch
            const createTab = document.querySelector('[data-tab="create"]');
            if (createTab) {
                createTab.click();
            }
        }
    }

    fillCreateGroupForm(data) {
        console.log('📝 Filling form with duplicated data:', data);

        // Add duplicate suffix to name
        const newName = `${data.name} (Copia)`;

        // Fill Step 1: Basic Info
        this.fillField('group-name', newName);
        this.fillField('group-description', data.description);
        this.fillField('group-type', data.type);
        this.fillField('group-location', data.location);

        if (data.virtualMeetings) {
            this.checkField('virtual-meetings');
        }

        // Fill Step 2: Financial Settings
        this.fillField('contribution-amount', data.contribution);
        this.fillField('max-participants', data.maxParticipants);
        this.fillField('payment-frequency', data.frequency);

        // Set start date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.fillField('start-date', tomorrow.toISOString().split('T')[0]);

        // Fill Step 3: Rules
        this.fillField('late-payment-penalty', data.penalty || 0);
        this.fillField('grace-period', data.gracePeriod || 3);

        // Show notification
        this.showDuplicateNotification(newName);

        // Trigger form updates (for live preview and suggestions)
        this.triggerFormUpdates();

        console.log('✅ Form filled with duplicated data');
    }

    fillField(id, value) {
        const field = document.getElementById(id);
        if (field) {
            field.value = value;

            // Trigger events
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    checkField(id) {
        const field = document.getElementById(id);
        if (field && field.type === 'checkbox') {
            field.checked = true;
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    triggerFormUpdates() {
        // Trigger preview and suggestions updates
        if (window.createGroupFormHandler) {
            if (window.createGroupFormHandler.updatePreview) {
                window.createGroupFormHandler.updatePreview();
            }
        }

        if (window.smartSuggestions) {
            if (window.smartSuggestions.refresh) {
                window.smartSuggestions.refresh();
            }
        }
    }

    showDuplicateNotification(groupName) {
        const notification = document.createElement('div');
        notification.className = 'duplicate-notification';
        notification.innerHTML = `
            <i class="fas fa-copy"></i>
            <div>
                <strong>Grupo duplicado exitosamente</strong>
                <p>Revisa y ajusta los campos antes de crear "${groupName}"</p>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            max-width: 400px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(59, 130, 246, 0.5);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            color: var(--text-primary);
            animation: slideInFromRight 0.5s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutToRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // ============================================
    // PUBLIC API
    // ============================================

    duplicateGroup(groupId) {
        // Public method to duplicate a group by ID
        if (window.laTandaSystemComplete && window.laTandaSystemComplete.groups) {
            const group = window.laTandaSystemComplete.groups.find(g => g.id === groupId);
            if (group) {
                const groupData = this.mapGroupToFormData(group);
                this.showDuplicateModal(groupData);
            } else {
                console.error('Group not found:', groupId);
            }
        }
    }

    refreshButtons() {
        this.addButtonsToExistingGroups();
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.GroupDuplicationSystem = GroupDuplicationSystem;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.groupDuplication = new GroupDuplicationSystem();
        });
    } else {
        window.groupDuplication = new GroupDuplicationSystem();
    }
}
