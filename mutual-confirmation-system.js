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
        this.pendingConfirmations = [];
        this.confirmationHistory = [];
        
        // Estados de confirmación
        this.CONFIRMATION_STATUS = {
            PENDING: 'pending',
            APPROVED: 'approved',
            REJECTED: 'rejected',
            EXPIRED: 'expired',
            MUTUAL_CONFIRMED: 'mutual_confirmed'
        };
        
        // Tipos de confirmación
        this.CONFIRMATION_TYPES = {
            COORDINATOR_TO_PARTICIPANT: 'coord_to_participant',
            PARTICIPANT_TO_COORDINATOR: 'participant_to_coord',
            MEMBER_TO_MEMBER: 'member_to_member'
        };
        
        this.init();
    }
    
    async init() {
        this.loadUserData();
        this.setupEventListeners();
        this.loadPendingConfirmations();
        this.startPeriodicChecks();
    }
    
    loadUserData() {
        const authData = localStorage.getItem('laTandaWeb3Auth');
        if (authData) {
            this.currentUser = JSON.parse(authData).user;
        }
    }
    
    setupEventListeners() {
        // Event listeners para UI de confirmaciones
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('confirm-btn')) {
                this.handleConfirmation(e.target);
            }
            if (e.target.classList.contains('reject-btn')) {
                this.handleRejection(e.target);
            }
            if (e.target.classList.contains('request-confirmation-btn')) {
                this.handleConfirmationRequest(e.target);
            }
        });
    }
    
    /**
     * CORE FUNCTIONALITY: Solicitar confirmación mutua
     */
    async requestMutualConfirmation(targetUserId, confirmationType, groupId = null, message = '') {
        try {
            const confirmationData = {
                requester_id: this.currentUser.id,
                target_user_id: targetUserId,
                confirmation_type: confirmationType,
                group_id: groupId,
                message: message,
                request_timestamp: new Date().toISOString(),
                expiry_timestamp: this.calculateExpiryTime(),
                status: this.CONFIRMATION_STATUS.PENDING
            };
            
            const response = await fetch(this.API_BASE + '/api/confirmation/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(confirmationData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Solicitud de confirmación enviada exitosamente', 'success');
                this.logConfirmationActivity('REQUEST_SENT', confirmationData);
                await this.sendNotificationToUser(targetUserId, confirmationData);
                return result.data.confirmation_id;
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            this.showNotification('Error al enviar solicitud de confirmación: ' + error.message, 'error');
            throw error;
        }
    }
    
    /**
     * CORE FUNCTIONALITY: Procesar confirmación recibida
     */
    async processConfirmation(confirmationId, action, comments = '') {
        try {
            const confirmationData = {
                confirmation_id: confirmationId,
                user_id: this.currentUser.id,
                action: action, // 'approve' | 'reject'
                comments: comments,
                processed_timestamp: new Date().toISOString()
            };
            
            const response = await fetch(this.API_BASE + '/api/confirmation/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(confirmationData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Verificar si se completó la confirmación mutua
                const isMutualComplete = await this.checkMutualConfirmationComplete(confirmationId);
                
                if (isMutualComplete) {
                    await this.activateMutualConfirmation(confirmationId);
                }
                
                this.showNotification(`Confirmación ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`, 'success');
                this.logConfirmationActivity('CONFIRMATION_PROCESSED', confirmationData);
                await this.updateUI();
                
                return result.data;
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            this.showNotification('Error al procesar confirmación: ' + error.message, 'error');
            throw error;
        }
    }
    
    /**
     * Verificar si la confirmación mutua está completa
     */
    async checkMutualConfirmationComplete(confirmationId) {
        try {
            const response = await fetch(this.API_BASE + `/api/confirmation/mutual-status/${confirmationId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const result = await response.json();
            return result.success && result.data.is_mutual_complete;
            
        } catch (error) {
            console.error('Error checking mutual confirmation:', error);
            return false;
        }
    }
    
    /**
     * Activar confirmación mutua completada
     */
    async activateMutualConfirmation(confirmationId) {
        try {
            const response = await fetch(this.API_BASE + '/api/confirmation/activate-mutual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    confirmation_id: confirmationId,
                    activated_by: this.currentUser.id,
                    activated_timestamp: new Date().toISOString()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('🎉 ¡Confirmación mutua completada! Ambos usuarios están verificados.', 'success');
                this.logConfirmationActivity('MUTUAL_ACTIVATED', { confirmation_id: confirmationId });
                
                // Actualizar nivel de confianza de ambos usuarios
                await this.updateTrustLevel(result.data.participants);
                
                // Enviar notificaciones de éxito
                await this.notifyMutualConfirmationComplete(result.data);
            }
            
        } catch (error) {
            console.error('Error activating mutual confirmation:', error);
        }
    }
    
    /**
     * Cargar confirmaciones pendientes
     */
    async loadPendingConfirmations() {
        try {
            const response = await fetch(this.API_BASE + `/api/confirmation/pending/${this.currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.pendingConfirmations = result.data.confirmations;
                this.renderPendingConfirmations();
            }
            
        } catch (error) {
            console.error('Error loading pending confirmations:', error);
        }
    }
    
    /**
     * Renderizar confirmaciones pendientes en UI
     */
    renderPendingConfirmations() {
        const container = document.getElementById('pendingConfirmationsContainer');
        if (!container) return;
        
        if (this.pendingConfirmations.length === 0) {
            container.innerHTML = `
                <div class="no-confirmations">
                    <div class="empty-state">
                        <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <h3>No hay confirmaciones pendientes</h3>
                        <p>Todas tus confirmaciones están al día</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const confirmationsHTML = this.pendingConfirmations.map(confirmation => {
            const isIncoming = confirmation.target_user_id === this.currentUser.id;
            const otherUser = isIncoming ? confirmation.requester : confirmation.target_user;
            
            return `
                <div class="confirmation-card" data-confirmation-id="${confirmation.id}">
                    <div class="confirmation-header">
                        <div class="user-info">
                            <img src="${otherUser.avatar_url || '/default-avatar.png'}" alt="${otherUser.name}" class="user-avatar">
                            <div class="user-details">
                                <h4>${otherUser.name}</h4>
                                <span class="user-role">${this.getTypeLabel(confirmation.confirmation_type)}</span>
                            </div>
                        </div>
                        <div class="confirmation-status ${confirmation.status}">
                            ${this.getStatusBadge(confirmation.status)}
                        </div>
                    </div>
                    
                    <div class="confirmation-content">
                        <p class="confirmation-message">${confirmation.message || 'Solicitud de confirmación mutua'}</p>
                        <div class="confirmation-details">
                            <span class="detail-item">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                ${this.formatDate(confirmation.request_timestamp)}
                            </span>
                            ${confirmation.group_name ? `
                                <span class="detail-item">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-1c0-2.66 5.33-4 8-4s8 1.34 8 4v1H4z"/>
                                    </svg>
                                    ${confirmation.group_name}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${isIncoming && confirmation.status === this.CONFIRMATION_STATUS.PENDING ? `
                        <div class="confirmation-actions">
                            <button class="confirm-btn" data-confirmation-id="${confirmation.id}">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                </svg>
                                Confirmar
                            </button>
                            <button class="reject-btn" data-confirmation-id="${confirmation.id}">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                                </svg>
                                Rechazar
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="confirmations-list">
                <h3>Confirmaciones Pendientes (${this.pendingConfirmations.length})</h3>
                ${confirmationsHTML}
            </div>
        `;
    }
    
    /**
     * Manejadores de eventos UI
     */
    async handleConfirmation(button) {
        const confirmationId = button.dataset.confirmationId;
        const comments = await this.promptForComments('¿Algún comentario adicional para esta confirmación?');
        
        try {
            await this.processConfirmation(confirmationId, 'approve', comments);
        } catch (error) {
            console.error('Error handling confirmation:', error);
        }
    }
    
    async handleRejection(button) {
        const confirmationId = button.dataset.confirmationId;
        const reason = await this.promptForComments('Por favor, proporciona una razón para el rechazo:', true);
        
        if (!reason) {
            this.showNotification('Se requiere una razón para rechazar la confirmación', 'warning');
            return;
        }
        
        try {
            await this.processConfirmation(confirmationId, 'reject', reason);
        } catch (error) {
            console.error('Error handling rejection:', error);
        }
    }
    
    async handleConfirmationRequest(button) {
        const targetUserId = button.dataset.targetUserId;
        const confirmationType = button.dataset.confirmationType;
        const groupId = button.dataset.groupId;
        
        const message = await this.promptForComments('Mensaje para la solicitud de confirmación (opcional):');
        
        try {
            await this.requestMutualConfirmation(targetUserId, confirmationType, groupId, message);
        } catch (error) {
            console.error('Error handling confirmation request:', error);
        }
    }
    
    /**
     * SECURITY: Validar confianza mutua antes de acciones críticas
     */
    async validateMutualTrust(userId1, userId2, action) {
        try {
            const response = await fetch(this.API_BASE + '/api/confirmation/validate-trust', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    user_1: userId1,
                    user_2: userId2,
                    action: action,
                    validation_timestamp: new Date().toISOString()
                })
            });
            
            const result = await response.json();
            return result.success && result.data.is_trusted;
            
        } catch (error) {
            console.error('Error validating mutual trust:', error);
            return false;
        }
    }
    
    /**
     * Actualizar nivel de confianza del usuario
     */
    async updateTrustLevel(participants) {
        try {
            const response = await fetch(this.API_BASE + '/api/users/trust-level/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    participants: participants,
                    update_reason: 'mutual_confirmation_completed',
                    update_timestamp: new Date().toISOString()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.logConfirmationActivity('TRUST_LEVEL_UPDATED', result.data);
            }
            
        } catch (error) {
            console.error('Error updating trust level:', error);
        }
    }
    
    /**
     * UTILITY METHODS
     */
    calculateExpiryTime() {
        const now = new Date();
        now.setHours(now.getHours() + 72); // 72 horas para responder
        return now.toISOString();
    }
    
    getTypeLabel(type) {
        const labels = {
            [this.CONFIRMATION_TYPES.COORDINATOR_TO_PARTICIPANT]: 'Coordinador → Participante',
            [this.CONFIRMATION_TYPES.PARTICIPANT_TO_COORDINATOR]: 'Participante → Coordinador',
            [this.CONFIRMATION_TYPES.MEMBER_TO_MEMBER]: 'Miembro → Miembro'
        };
        return labels[type] || 'Confirmación';
    }
    
    getStatusBadge(status) {
        const badges = {
            [this.CONFIRMATION_STATUS.PENDING]: '<span class="badge pending">Pendiente</span>',
            [this.CONFIRMATION_STATUS.APPROVED]: '<span class="badge approved">Aprobado</span>',
            [this.CONFIRMATION_STATUS.REJECTED]: '<span class="badge rejected">Rechazado</span>',
            [this.CONFIRMATION_STATUS.EXPIRED]: '<span class="badge expired">Expirado</span>',
            [this.CONFIRMATION_STATUS.MUTUAL_CONFIRMED]: '<span class="badge mutual-confirmed">Confirmación Mutua ✓</span>'
        };
        return badges[status] || '<span class="badge unknown">Desconocido</span>';
    }
    
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('es-HN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    async promptForComments(message, required = false) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirmation-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>${message}</h3>
                    <textarea id="confirmationComments" placeholder="Escribe aquí..." rows="4"></textarea>
                    <div class="modal-actions">
                        <button id="cancelBtn" class="btn-secondary">Cancelar</button>
                        <button id="submitBtn" class="btn-primary">Enviar</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const textarea = modal.querySelector('#confirmationComments');
            const cancelBtn = modal.querySelector('#cancelBtn');
            const submitBtn = modal.querySelector('#submitBtn');
            
            cancelBtn.onclick = () => {
                modal.remove();
                resolve(required ? null : '');
            };
            
            submitBtn.onclick = () => {
                const value = textarea.value.trim();
                if (required && !value) {
                    this.showNotification('Este campo es requerido', 'warning');
                    return;
                }
                modal.remove();
                resolve(value);
            };
            
            textarea.focus();
        });
    }
    
    async sendNotificationToUser(userId, confirmationData) {
        try {
            const notificationData = {
                recipient_id: userId,
                title: '🔔 Nueva Solicitud de Confirmación',
                message: `${this.currentUser.name} te ha enviado una solicitud de confirmación mutua`,
                type: 'mutual_confirmation_request',
                data: {
                    confirmation_id: confirmationData.confirmation_id,
                    requester_name: this.currentUser.name,
                    confirmation_type: confirmationData.confirmation_type
                },
                priority: 'high'
            };
            
            await fetch(this.API_BASE + '/api/notifications/send/immediate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(notificationData)
            });
            
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
    
    async notifyMutualConfirmationComplete(data) {
        try {
            const participants = data.participants;
            
            for (const participant of participants) {
                const notificationData = {
                    recipient_id: participant.user_id,
                    title: '🎉 Confirmación Mutua Completada',
                    message: 'La confirmación mutua ha sido completada exitosamente. Tu nivel de confianza ha aumentado.',
                    type: 'mutual_confirmation_complete',
                    data: {
                        confirmation_id: data.confirmation_id,
                        new_trust_level: participant.new_trust_level
                    },
                    priority: 'high'
                };
                
                await fetch(this.API_BASE + '/api/notifications/send/immediate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    },
                    body: JSON.stringify(notificationData)
                });
            }
            
        } catch (error) {
            console.error('Error sending completion notifications:', error);
        }
    }
    
    logConfirmationActivity(action, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            user_id: this.currentUser.id,
            action: action,
            data: data
        };
        
        // Log local para debugging
        console.log('Confirmation Activity:', logEntry);
        
        // Enviar al servidor para auditoria
        fetch(this.API_BASE + '/api/audit/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(logEntry)
        }).catch(error => console.error('Error logging activity:', error));
    }
    
    startPeriodicChecks() {
        // Verificar confirmaciones pendientes cada 5 minutos
        setInterval(() => {
            this.loadPendingConfirmations();
        }, 5 * 60 * 1000);
        
        // Verificar expiración de confirmaciones cada hora
        setInterval(() => {
            this.checkExpiredConfirmations();
        }, 60 * 60 * 1000);
    }
    
    async checkExpiredConfirmations() {
        try {
            const response = await fetch(this.API_BASE + '/api/confirmation/check-expired', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    user_id: this.currentUser.id,
                    check_timestamp: new Date().toISOString()
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.data.expired_count > 0) {
                this.showNotification(`${result.data.expired_count} confirmación(es) han expirado`, 'info');
                await this.updateUI();
            }
            
        } catch (error) {
            console.error('Error checking expired confirmations:', error);
        }
    }
    
    async updateUI() {
        await this.loadPendingConfirmations();
        // Trigger other UI updates as needed
        document.dispatchEvent(new CustomEvent('confirmationUpdate'));
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
    module.exports = MutualConfirmationSystem;
}

// Auto-inicializar si se carga en el navegador
if (typeof window !== 'undefined') {
    window.MutualConfirmationSystem = MutualConfirmationSystem;
    
    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        window.mutualConfirmation = new MutualConfirmationSystem();
    });
}