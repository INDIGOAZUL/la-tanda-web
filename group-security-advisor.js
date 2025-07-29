/**
 * La Tanda - Sistema de Advertencias de Seguridad para Grupos
 * Funcionalidad: Advertencias y recomendaciones cuando usuarios se unen a grupos
 * Versión: 1.0.0
 * 
 * PROPÓSITO: Aconsejar a usuarios y coordinadores sobre mejores prácticas de seguridad
 * antes de unirse o aceptar miembros en grupos de tandas.
 */

class GroupSecurityAdvisor {
    constructor() {
        this.API_BASE = 'https://api.latanda.online';
        this.currentUser = null;
        
        // Tipos de advertencias
        this.WARNING_TYPES = {
            NEW_MEMBER_JOINING: 'new_member_joining',
            COORDINATOR_ACCEPTING: 'coordinator_accepting',
            HIGH_AMOUNT_GROUP: 'high_amount_group',
            NEW_COORDINATOR: 'new_coordinator',
            LARGE_GROUP: 'large_group'
        };
        
        // Niveles de riesgo
        this.RISK_LEVELS = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical',
            FROZEN: 'frozen',
            BLACKLISTED: 'blacklisted'
        };
        
        // Estados de cuenta y grupos
        this.ACCOUNT_STATUS = {
            ACTIVE: 'active',
            FROZEN: 'frozen',
            SUSPENDED: 'suspended',
            BLACKLISTED: 'blacklisted',
            UNDER_REVIEW: 'under_review'
        };
        
        this.init();
    }
    
    async init() {
        this.loadUserData();
        this.setupEventListeners();
    }
    
    loadUserData() {
        const authData = localStorage.getItem('laTandaWeb3Auth');
        if (authData) {
            this.currentUser = JSON.parse(authData).user;
        }
    }
    
    setupEventListeners() {
        // Interceptar acciones de unirse a grupos
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('join-group-btn')) {
                this.handleJoinGroupAttempt(e.target);
            }
            if (e.target.classList.contains('accept-member-btn')) {
                this.handleAcceptMemberAttempt(e.target);
            }
        });
    }
    
    /**
     * CORE: Advertencia cuando usuario quiere unirse a un grupo
     */
    async handleJoinGroupAttempt(button) {
        const groupId = button.dataset.groupId;
        
        try {
            // Obtener información del grupo
            const groupInfo = await this.getGroupInfo(groupId);
            
            // Evaluar riesgo
            const riskAssessment = this.evaluateJoinRisk(groupInfo);
            
            // VERIFICAR SI ESTÁ BLOQUEADO POR CONGELAMIENTO
            const hasBlockingRisk = riskAssessment.risks.some(risk => risk.blockAction);
            
            if (hasBlockingRisk) {
                // Mostrar advertencia de cuenta congelada/bloqueada
                this.showFrozenAccountWarning(groupInfo);
                return;
            }
            
            // Mostrar advertencia si es necesario
            if (riskAssessment.showWarning) {
                const userDecision = await this.showJoinWarning(groupInfo, riskAssessment);
                
                if (userDecision.proceed) {
                    await this.proceedWithJoin(groupId, userDecision.acknowledgments);
                } else {
                    this.showNotification('👍 Buena decisión. Te recomendamos conocer mejor al grupo antes de unirte.', 'info');
                }
            } else {
                // Proceder normalmente
                await this.proceedWithJoin(groupId, []);
            }
            
        } catch (error) {
            this.showNotification('Error al evaluar el grupo: ' + error.message, 'error');
        }
    }
    
    /**
     * CORE: Advertencia cuando coordinador va a aceptar un miembro
     */
    async handleAcceptMemberAttempt(button) {
        const memberId = button.dataset.memberId;
        const groupId = button.dataset.groupId;
        
        try {
            // Obtener información del miembro candidato
            const memberInfo = await this.getMemberInfo(memberId);
            const groupInfo = await this.getGroupInfo(groupId);
            
            // Evaluar riesgo
            const riskAssessment = this.evaluateAcceptanceRisk(memberInfo, groupInfo);
            
            // Mostrar advertencia si es necesario
            if (riskAssessment.showWarning) {
                const coordinatorDecision = await this.showAcceptanceWarning(memberInfo, groupInfo, riskAssessment);
                
                if (coordinatorDecision.proceed) {
                    await this.proceedWithAcceptance(memberId, groupId, coordinatorDecision.acknowledgments);
                } else {
                    this.showNotification('👍 Es prudente conocer mejor a los miembros antes de aceptarlos.', 'info');
                }
            } else {
                // Proceder normalmente
                await this.proceedWithAcceptance(memberId, groupId, []);
            }
            
        } catch (error) {
            this.showNotification('Error al evaluar el miembro: ' + error.message, 'error');
        }
    }
    
    /**
     * Evaluar riesgo de unirse a un grupo
     */
    evaluateJoinRisk(groupInfo) {
        const risks = [];
        let riskLevel = this.RISK_LEVELS.LOW;
        let showWarning = false;
        
        // VERIFICAR ESTADO DEL COORDINADOR
        if (groupInfo.coordinator_status === this.ACCOUNT_STATUS.FROZEN) {
            risks.push({
                type: 'coordinator_frozen',
                message: 'El coordinador de este grupo tiene su cuenta CONGELADA por incumplimientos',
                level: this.RISK_LEVELS.FROZEN,
                severity: 'critical',
                blockAction: true
            });
            riskLevel = this.RISK_LEVELS.FROZEN;
            showWarning = true;
        }
        
        if (groupInfo.coordinator_status === this.ACCOUNT_STATUS.BLACKLISTED) {
            risks.push({
                type: 'coordinator_blacklisted',
                message: 'El coordinador está en LISTA NEGRA por fraude confirmado',
                level: this.RISK_LEVELS.BLACKLISTED,
                severity: 'critical',
                blockAction: true
            });
            riskLevel = this.RISK_LEVELS.BLACKLISTED;
            showWarning = true;
        }
        
        // VERIFICAR HISTORIAL DE INCUMPLIMIENTOS DEL COORDINADOR
        if (groupInfo.coordinator_failed_payments && groupInfo.coordinator_failed_payments > 2) {
            risks.push({
                type: 'coordinator_payment_issues',
                message: `El coordinador ha faltado ${groupInfo.coordinator_failed_payments} pagos en grupos anteriores`,
                level: this.RISK_LEVELS.HIGH,
                severity: 'high'
            });
            riskLevel = this.RISK_LEVELS.HIGH;
            showWarning = true;
        }
        
        // VERIFICAR ADVERTENCIAS PÚBLICAS
        if (groupInfo.coordinator_public_warnings && groupInfo.coordinator_public_warnings > 5) {
            risks.push({
                type: 'coordinator_multiple_warnings',
                message: `El coordinador tiene ${groupInfo.coordinator_public_warnings} advertencias públicas de otros usuarios`,
                level: this.RISK_LEVELS.HIGH,
                severity: 'high'
            });
            riskLevel = this.RISK_LEVELS.HIGH;
            showWarning = true;
        }
        
        // Verificar si el coordinador es nuevo
        if (groupInfo.coordinator_days_active < 30) {
            risks.push({
                type: 'new_coordinator',
                message: 'El coordinador del grupo es relativamente nuevo en la plataforma',
                level: this.RISK_LEVELS.MEDIUM
            });
            riskLevel = this.RISK_LEVELS.MEDIUM;
            showWarning = true;
        }
        
        // Verificar cantidad alta de dinero
        if (groupInfo.contribution_amount > 1000) {
            risks.push({
                type: 'high_amount',
                message: 'Este grupo maneja cantidades altas de dinero',
                level: this.RISK_LEVELS.HIGH
            });
            riskLevel = this.RISK_LEVELS.HIGH;
            showWarning = true;
        }
        
        // Verificar grupo muy grande
        if (groupInfo.member_count > 20) {
            risks.push({
                type: 'large_group',
                message: 'Este es un grupo muy grande, puede ser más difícil conocer a todos',
                level: this.RISK_LEVELS.MEDIUM
            });
            if (riskLevel === this.RISK_LEVELS.LOW) riskLevel = this.RISK_LEVELS.MEDIUM;
            showWarning = true;
        }
        
        // Verificar si no hay miembros verificados
        if (groupInfo.verified_members_count === 0) {
            risks.push({
                type: 'no_verified_members',
                message: 'Ningún miembro del grupo tiene verificación completa',
                level: this.RISK_LEVELS.HIGH
            });
            riskLevel = this.RISK_LEVELS.HIGH;
            showWarning = true;
        }
        
        return {
            risks,
            riskLevel,
            showWarning,
            recommendedActions: this.getRecommendedActions(risks)
        };
    }
    
    /**
     * Evaluar riesgo de aceptar un miembro
     */
    evaluateAcceptanceRisk(memberInfo, groupInfo) {
        const risks = [];
        let riskLevel = this.RISK_LEVELS.LOW;
        let showWarning = false;
        
        // Verificar si el usuario es muy nuevo
        if (memberInfo.days_since_registration < 7) {
            risks.push({
                type: 'new_user',
                message: 'Este usuario se registró hace menos de una semana',
                level: this.RISK_LEVELS.HIGH
            });
            riskLevel = this.RISK_LEVELS.HIGH;
            showWarning = true;
        }
        
        // Verificar perfil incompleto
        if (!memberInfo.phone_verified || !memberInfo.email_verified) {
            risks.push({
                type: 'unverified_profile',
                message: 'El usuario no ha verificado completamente su perfil',
                level: this.RISK_LEVELS.MEDIUM
            });
            if (riskLevel === this.RISK_LEVELS.LOW) riskLevel = this.RISK_LEVELS.MEDIUM;
            showWarning = true;
        }
        
        // Verificar historial de grupos
        if (memberInfo.groups_left_count > 3) {
            risks.push({
                type: 'frequent_leaver',
                message: 'Este usuario ha salido de varios grupos anteriormente',
                level: this.RISK_LEVELS.MEDIUM
            });
            if (riskLevel === this.RISK_LEVELS.LOW) riskLevel = this.RISK_LEVELS.MEDIUM;
            showWarning = true;
        }
        
        // Verificar si no tiene foto de perfil
        if (!memberInfo.avatar_url || memberInfo.avatar_url.includes('default')) {
            risks.push({
                type: 'no_profile_photo',
                message: 'El usuario no tiene una foto de perfil personalizada',
                level: this.RISK_LEVELS.LOW
            });
            showWarning = true;
        }
        
        return {
            risks,
            riskLevel,
            showWarning,
            recommendedActions: this.getRecommendedActionsForMember(risks)
        };
    }
    
    /**
     * Mostrar advertencia para unirse a grupo
     */
    async showJoinWarning(groupInfo, riskAssessment) {
        return new Promise((resolve) => {
            const modal = this.createWarningModal({
                title: '⚠️ Consejos de Seguridad - Únete al Grupo',
                subtitle: `Antes de unirte a "${groupInfo.name}"`,
                risks: riskAssessment.risks,
                recommendations: riskAssessment.recommendedActions,
                riskLevel: riskAssessment.riskLevel,
                proceedText: 'Entiendo y quiero unirme',
                cancelText: 'Mejor me espero'
            });
            
            const proceedBtn = modal.querySelector('#proceedBtn');
            const cancelBtn = modal.querySelector('#cancelBtn');
            const acknowledgmentCheckboxes = modal.querySelectorAll('.acknowledgment-checkbox');
            
            proceedBtn.onclick = () => {
                const acknowledgments = Array.from(acknowledgmentCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.dataset.acknowledgment);
                
                if (acknowledgments.length < acknowledgmentCheckboxes.length) {
                    this.showNotification('Debes confirmar que has leído todas las recomendaciones', 'warning');
                    return;
                }
                
                modal.remove();
                resolve({ proceed: true, acknowledgments });
            };
            
            cancelBtn.onclick = () => {
                modal.remove();
                resolve({ proceed: false, acknowledgments: [] });
            };
            
            document.body.appendChild(modal);
        });
    }
    
    /**
     * Mostrar advertencia para aceptar miembro
     */
    async showAcceptanceWarning(memberInfo, groupInfo, riskAssessment) {
        return new Promise((resolve) => {
            const modal = this.createWarningModal({
                title: '⚠️ Consejos de Seguridad - Aceptar Miembro',
                subtitle: `Antes de aceptar a "${memberInfo.name}" en tu grupo`,
                risks: riskAssessment.risks,
                recommendations: riskAssessment.recommendedActions,
                riskLevel: riskAssessment.riskLevel,
                proceedText: 'Entiendo y quiero aceptar',
                cancelText: 'Mejor reviso más'
            });
            
            const proceedBtn = modal.querySelector('#proceedBtn');
            const cancelBtn = modal.querySelector('#cancelBtn');
            const acknowledgmentCheckboxes = modal.querySelectorAll('.acknowledgment-checkbox');
            
            proceedBtn.onclick = () => {
                const acknowledgments = Array.from(acknowledgmentCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.dataset.acknowledgment);
                
                if (acknowledgments.length < acknowledgmentCheckboxes.length) {
                    this.showNotification('Debes confirmar que has leído todas las recomendaciones', 'warning');
                    return;
                }
                
                modal.remove();
                resolve({ proceed: true, acknowledgments });
            };
            
            cancelBtn.onclick = () => {
                modal.remove();
                resolve({ proceed: false, acknowledgments: [] });
            };
            
            document.body.appendChild(modal);
        });
    }
    
    /**
     * Crear modal de advertencia
     */
    createWarningModal(config) {
        const modal = document.createElement('div');
        modal.className = `security-warning-modal risk-${config.riskLevel}`;
        
        const risksHTML = config.risks.map(risk => `
            <div class="risk-item risk-${risk.level}">
                <div class="risk-icon">
                    ${this.getRiskIcon(risk.level)}
                </div>
                <div class="risk-content">
                    <p>${risk.message}</p>
                </div>
            </div>
        `).join('');
        
        const recommendationsHTML = config.recommendations.map((rec, index) => `
            <div class="recommendation-item">
                <label class="recommendation-checkbox">
                    <input type="checkbox" class="acknowledgment-checkbox" data-acknowledgment="${rec.id}">
                    <span class="checkmark"></span>
                    <span class="recommendation-text">${rec.text}</span>
                </label>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="warning-header">
                    <h2>${config.title}</h2>
                    <p class="warning-subtitle">${config.subtitle}</p>
                </div>
                
                <div class="warning-body">
                    <div class="risks-section">
                        <h3>🚨 Factores a considerar:</h3>
                        <div class="risks-list">
                            ${risksHTML}
                        </div>
                    </div>
                    
                    <div class="recommendations-section">
                        <h3>💡 Nuestras recomendaciones:</h3>
                        <div class="recommendations-list">
                            ${recommendationsHTML}
                        </div>
                    </div>
                    
                    <div class="security-tips">
                        <div class="tip-box">
                            <h4>🛡️ Consejos de Seguridad</h4>
                            <ul>
                                <li>Conoce personalmente a los miembros del grupo cuando sea posible</li>
                                <li>Comienza con cantidades pequeñas hasta generar confianza</li>
                                <li>Verifica que el coordinador tenga experiencia previa</li>
                                <li>Pregunta por referencias de otros miembros</li>
                                <li>Mantén registros de todas las transacciones</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="warning-actions">
                    <button id="cancelBtn" class="btn-secondary">
                        ${config.cancelText}
                    </button>
                    <button id="proceedBtn" class="btn-primary" disabled>
                        ${config.proceedText}
                    </button>
                </div>
            </div>
        `;
        
        // Habilitar botón solo cuando se marquen todas las confirmaciones
        const checkboxes = modal.querySelectorAll('.acknowledgment-checkbox');
        const proceedBtn = modal.querySelector('#proceedBtn');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                proceedBtn.disabled = !allChecked;
                proceedBtn.classList.toggle('enabled', allChecked);
            });
        });
        
        return modal;
    }
    
    /**
     * Obtener recomendaciones basadas en riesgos
     */
    getRecommendedActions(risks) {
        const actions = [];
        
        if (risks.some(r => r.type === 'new_coordinator')) {
            actions.push({
                id: 'verify_coordinator',
                text: 'He verificado el perfil del coordinador y me siento cómodo con su experiencia'
            });
        }
        
        if (risks.some(r => r.type === 'high_amount')) {
            actions.push({
                id: 'understand_amount',
                text: 'Entiendo que este grupo maneja cantidades altas y estoy preparado financieramente'
            });
        }
        
        if (risks.some(r => r.type === 'large_group')) {
            actions.push({
                id: 'accept_large_group',
                text: 'Comprendo que en grupos grandes es más difícil conocer a todos los miembros'
            });
        }
        
        if (risks.some(r => r.type === 'no_verified_members')) {
            actions.push({
                id: 'accept_unverified',
                text: 'Acepto que los miembros del grupo pueden no estar completamente verificados'
            });
        }
        
        // Acción general siempre presente
        actions.push({
            id: 'general_understanding',
            text: 'He leído y entiendo todos los consejos de seguridad de La Tanda'
        });
        
        return actions;
    }
    
    /**
     * Obtener recomendaciones para aceptar miembros
     */
    getRecommendedActionsForMember(risks) {
        const actions = [];
        
        if (risks.some(r => r.type === 'new_user')) {
            actions.push({
                id: 'verify_new_user',
                text: 'He considerado que este usuario es nuevo y tomaré precauciones adicionales'
            });
        }
        
        if (risks.some(r => r.type === 'unverified_profile')) {
            actions.push({
                id: 'accept_unverified_profile',
                text: 'Acepto que el perfil del usuario no está completamente verificado'
            });
        }
        
        if (risks.some(r => r.type === 'frequent_leaver')) {
            actions.push({
                id: 'understand_history',
                text: 'He revisado el historial del usuario y entiendo los riesgos'
            });
        }
        
        // Acción general siempre presente
        actions.push({
            id: 'coordinator_responsibility',
            text: 'Entiendo mi responsabilidad como coordinador de velar por la seguridad del grupo'
        });
        
        return actions;
    }
    
    /**
     * SISTEMA DE CONGELAMIENTO Y ADVERTENCIAS
     */
    async freezeCoordinatorAccount(coordinatorId, reason, evidence) {
        try {
            const response = await fetch(`${this.API_BASE}/api/security/freeze-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    coordinator_id: coordinatorId,
                    reason: reason,
                    evidence: evidence,
                    freeze_type: 'AUTOMATIC_SYSTEM',
                    initiated_by: 'SECURITY_SYSTEM',
                    timestamp: new Date().toISOString()
                })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.createPublicWarning(coordinatorId, reason, 'ACCOUNT_FROZEN');
                return true;
            }
            throw new Error(result.message);
            
        } catch (error) {
            console.error('Error freezing coordinator account:', error);
            return false;
        }
    }
    
    async createPublicWarning(userId, reason, severity) {
        try {
            const response = await fetch(`${this.API_BASE}/api/security/public-warning`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    user_id: userId,
                    warning_type: severity,
                    reason: reason,
                    public_visibility: true,
                    auto_generated: true,
                    timestamp: new Date().toISOString()
                })
            });
            
            return await response.json();
            
        } catch (error) {
            console.error('Error creating public warning:', error);
            return { success: false };
        }
    }
    
    async checkAccountFrozenStatus(userId) {
        try {
            const response = await fetch(`${this.API_BASE}/api/security/account-status/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const result = await response.json();
            return result.success ? result.data : { status: 'active' };
            
        } catch (error) {
            console.error('Error checking account status:', error);
            return { status: 'active' };
        }
    }
    
    showFrozenAccountWarning(groupInfo) {
        const modal = document.createElement('div');
        modal.className = 'security-warning-modal risk-frozen';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="warning-header frozen-header">
                    <h2>🧊 CUENTA CONGELADA</h2>
                    <p class="warning-subtitle">No puedes unirte a este grupo</p>
                </div>
                
                <div class="warning-body">
                    <div class="frozen-alert">
                        <div class="frozen-icon">🚨</div>
                        <div class="frozen-message">
                            <h3>Coordinador Sancionado</h3>
                            <p>El coordinador de este grupo ha sido automáticamente congelado por el sistema debido a:</p>
                            <ul>
                                <li><strong>Faltas a pagos:</strong> ${groupInfo.coordinator_failed_payments || 0} incumplimientos</li>
                                <li><strong>Advertencias públicas:</strong> ${groupInfo.coordinator_public_warnings || 0} reportes</li>
                                <li><strong>Estado:</strong> Recursos congelados hasta resolver situación</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="security-advice">
                        <h4>🛡️ Nuestra Recomendación</h4>
                        <p>Por tu seguridad, busca grupos con coordinadores confiables y verificados. Los recursos de este coordinador están congelados hasta que resuelva los problemas pendientes.</p>
                    </div>
                </div>
                
                <div class="warning-actions">
                    <button id="closeBtn" class="btn-primary">
                        Entendido, buscaré otro grupo
                    </button>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('#closeBtn');
        closeBtn.onclick = () => modal.remove();
        
        document.body.appendChild(modal);
        return modal;
    }
    
    /**
     * UTILITY METHODS
     */
    getRiskIcon(level) {
        const icons = {
            [this.RISK_LEVELS.LOW]: '⚠️',
            [this.RISK_LEVELS.MEDIUM]: '🔶',
            [this.RISK_LEVELS.HIGH]: '🔴',
            [this.RISK_LEVELS.CRITICAL]: '🚨'
        };
        return icons[level] || '⚠️';
    }
    
    async getGroupInfo(groupId) {
        try {
            const response = await fetch(`${this.API_BASE}/api/groups/${groupId}/security-info`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const result = await response.json();
            return result.success ? result.data : null;
            
        } catch (error) {
            console.error('Error getting group info:', error);
            throw error;
        }
    }
    
    async getMemberInfo(memberId) {
        try {
            const response = await fetch(`${this.API_BASE}/api/users/${memberId}/security-info`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const result = await response.json();
            return result.success ? result.data : null;
            
        } catch (error) {
            console.error('Error getting member info:', error);
            throw error;
        }
    }
    
    async proceedWithJoin(groupId, acknowledgments) {
        try {
            // Log de la acción con advertencias mostradas
            await this.logSecurityAction('GROUP_JOIN_WITH_WARNINGS', {
                group_id: groupId,
                user_id: this.currentUser.id,
                acknowledged_warnings: acknowledgments,
                timestamp: new Date().toISOString()
            });
            
            // Proceder con la unión normal
            const response = await fetch(`${this.API_BASE}/api/registration/groups/join/${groupId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    user_id: this.currentUser.id,
                    security_acknowledgments: acknowledgments
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('¡Te has unido al grupo exitosamente! 🎉', 'success');
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            this.showNotification('Error al unirse al grupo: ' + error.message, 'error');
        }
    }
    
    async proceedWithAcceptance(memberId, groupId, acknowledgments) {
        try {
            // Log de la acción con advertencias mostradas
            await this.logSecurityAction('MEMBER_ACCEPTANCE_WITH_WARNINGS', {
                member_id: memberId,
                group_id: groupId,
                coordinator_id: this.currentUser.id,
                acknowledged_warnings: acknowledgments,
                timestamp: new Date().toISOString()
            });
            
            // Proceder con la aceptación normal
            const response = await fetch(`${this.API_BASE}/api/registration/groups/accept-member`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    member_id: memberId,
                    group_id: groupId,
                    coordinator_id: this.currentUser.id,
                    security_acknowledgments: acknowledgments
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Miembro aceptado en el grupo exitosamente! 🎉', 'success');
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            this.showNotification('Error al aceptar miembro: ' + error.message, 'error');
        }
    }
    
    async logSecurityAction(action, data) {
        try {
            await fetch(`${this.API_BASE}/api/audit/security-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    action: action,
                    data: data,
                    user_agent: navigator.userAgent,
                    ip_address: 'client_side' // Se detectará en el servidor
                })
            });
        } catch (error) {
            console.error('Error logging security action:', error);
        }
    }
    
    getAuthToken() {
        const authData = localStorage.getItem('laTandaWeb3Auth');
        return authData ? JSON.parse(authData).auth_token : null;
    }
    
    showNotification(message, type = 'info') {
        // Usar el sistema de notificaciones existente
        if (window.auth && window.auth.showNotification) {
            window.auth.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Exportar el sistema
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GroupSecurityAdvisor;
}

// Auto-inicializar si se carga en el navegador
if (typeof window !== 'undefined') {
    window.GroupSecurityAdvisor = GroupSecurityAdvisor;
    
    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        window.groupSecurityAdvisor = new GroupSecurityAdvisor();
    });
}