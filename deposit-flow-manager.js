/**
 * Deposit Flow Manager - La Tanda Fintech
 * Gestión del flujo de depósitos
 */

class DepositFlowManager {
    constructor() {
        this.API_BASE = 'https://latanda.online';
        this.currentDeposit = null;
        this.depositMethods = ['bank_transfer', 'mobile_money', 'crypto'];
        console.log('💰 Deposit Flow Manager initialized');
    }

    async initDeposit(userId, amount, method) {
        this.currentDeposit = {
            id: 'DEP-' + Date.now(),
            user_id: userId,
            amount: amount,
            method: method,
            status: 'initiated',
            created_at: new Date().toISOString(),
            steps: []
        };
        this.addStep('initiated', 'Depósito iniciado');
        return this.currentDeposit;
    }

    addStep(status, message) {
        if (this.currentDeposit) {
            this.currentDeposit.steps.push({
                status: status,
                message: message,
                timestamp: new Date().toISOString()
            });
            this.currentDeposit.status = status;
        }
    }

    async submitBankDeposit(depositData) {
        try {
            this.addStep('pending_transfer', 'Esperando transferencia bancaria');
            
            var response = await fetch(this.API_BASE + '/api/wallet/deposit/bank-transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                },
                body: JSON.stringify(depositData)
            });
            
            var result = await response.json();
            
            if (result.success) {
                this.currentDeposit = Object.assign(this.currentDeposit || {}, result.data);
                this.addStep('pending_transfer', 'Instrucciones de transferencia generadas');
                return { success: true, data: result.data };
            } else {
                this.addStep('failed', result.message || 'Error al procesar depósito');
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Deposit error:', error);
            this.addStep('failed', 'Error de conexión');
            return { success: false, message: 'Error de conexión' };
        }
    }

    async uploadReceipt(depositId, file) {
        try {
            this.addStep('uploading', 'Subiendo comprobante...');
            
            var formData = new FormData();
            formData.append('receipt', file);
            formData.append('deposit_id', depositId);
            
            var response = await fetch(this.API_BASE + '/api/deposit/upload-receipt', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                },
                body: formData
            });
            
            var result = await response.json();
            
            if (result.success) {
                this.addStep('processing', 'Comprobante recibido - En revisión');
                return { success: true, data: result.data };
            } else {
                this.addStep('upload_failed', result.message || 'Error al subir comprobante');
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.addStep('upload_failed', 'Error al subir comprobante');
            return { success: false, message: 'Error de conexión' };
        }
    }

    async trackDeposit(depositId) {
        try {
            var response = await fetch(this.API_BASE + '/api/deposit/track/' + depositId, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Track error:', error);
            return { success: false, message: 'Error al consultar estado' };
        }
    }

    getAvailableMethods() {
        return [
            { id: 'bank_transfer', name: 'Transferencia Bancaria', icon: '🏦', fee: '2%' },
            { id: 'mobile_money', name: 'Tigo/Claro Money', icon: '📱', fee: '1.5%' },
            { id: 'crypto', name: 'Criptomonedas', icon: '₿', fee: '0.5%' }
        ];
    }

    getCurrentDeposit() {
        return this.currentDeposit;
    }

    clearCurrentDeposit() {
        this.currentDeposit = null;
    }
}

window.DepositFlowManager = new DepositFlowManager();
console.log('✅ Deposit Flow Manager loaded');
