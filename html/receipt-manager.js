/**
 * Receipt Manager - La Tanda Fintech
 * Gestión de recibos y comprobantes de transacciones
 * Version 2.0 - Enhanced with PDF generation
 */

class ReceiptManager {
    constructor() {
        this.API_BASE = 'https://latanda.online';
        this.receipts = JSON.parse(localStorage.getItem('latanda_receipts') || '[]');
        console.log('📄 Receipt Manager initialized');
    }

    async generateReceipt(transaction) {
        const receipt = {
            id: 'REC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            transaction_id: transaction.id,
            user_id: transaction.user_id || (typeof walletInstance !== 'undefined' ? walletInstance.getCurrentUserId() : 'unknown'),
            type: transaction.type,
            amount: parseFloat(transaction.amount) || 0,
            currency: transaction.currency || 'USD',
            description: transaction.description || this.getDefaultDescription(transaction),
            status: transaction.status,
            created_at: new Date().toISOString(),
            transaction_date: transaction.date || transaction.created_at || new Date().toISOString(),
            reference_number: transaction.reference_number || this.generateReference(),
            details: {
                fee: parseFloat(transaction.fee) || 0,
                net_amount: (parseFloat(transaction.amount) || 0) - (parseFloat(transaction.fee) || 0),
                method: transaction.method || transaction.payment_method || 'N/A',
                bank_name: transaction.bank_name || null,
                account_number: transaction.account_number ? '****' + transaction.account_number.slice(-4) : null
            }
        };

        this.receipts.push(receipt);
        this.saveReceipts();

        return receipt;
    }

    getDefaultDescription(transaction) {
        const typeLabels = {
            'deposit': 'Depósito a wallet',
            'withdrawal': 'Retiro de wallet',
            'transfer': 'Transferencia',
            'payment': 'Pago realizado',
            'contribution': 'Contribución a tanda'
        };
        return typeLabels[transaction.type] || 'Transacción';
    }

    generateReference() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return 'LT' + timestamp + random;
    }

    saveReceipts() {
        if (this.receipts.length > 100) {
            this.receipts = this.receipts.slice(-100);
        }
        localStorage.setItem('latanda_receipts', JSON.stringify(this.receipts));
    }

    getReceipt(receiptId) {
        return this.receipts.find(r => r.id === receiptId);
    }

    getReceiptByTransaction(transactionId) {
        return this.receipts.find(r => r.transaction_id === transactionId);
    }

    formatCurrency(amount, currency) {
        const symbols = { 'USD': '$', 'HNL': 'L.', 'LTD': 'LTD' };
        const symbol = symbols[currency] || currency + ' ';
        return symbol + ' ' + parseFloat(amount).toLocaleString('es-HN', { minimumFractionDigits: 2 });
    }

    getTypeLabel(type) {
        const labels = {
            'deposit': 'Depósito',
            'withdrawal': 'Retiro',
            'transfer': 'Transferencia',
            'payment': 'Pago',
            'contribution': 'Contribución',
            'reward': 'Recompensa'
        };
        return labels[type] || type;
    }

    getStatusLabel(status) {
        const labels = {
            'completed': 'Completado',
            'pending': 'Pendiente',
            'processing': 'Procesando',
            'failed': 'Fallido',
            'cancelled': 'Cancelado'
        };
        return labels[status] || status;
    }

    viewReceipt(transactionOrId) {
        let receipt;

        if (typeof transactionOrId === 'string') {
            receipt = this.getReceipt(transactionOrId) || this.getReceiptByTransaction(transactionOrId);
        } else {
            receipt = this.getReceiptByTransaction(transactionOrId.id);
            if (!receipt) {
                receipt = this.generateReceipt(transactionOrId);
            }
        }

        if (!receipt) {
            if (typeof walletInstance !== 'undefined') walletInstance.showError('Recibo no encontrado');
            return;
        }

        this.showReceiptModal(receipt);
    }

    showReceiptModal(receipt) {
        const existing = document.getElementById('receiptModal');
        if (existing) existing.remove();

        const typeColor = (receipt.type === 'deposit' || receipt.type === 'reward') ? '#28a745' : '#333';
        const statusColor = receipt.status === 'completed' ? '#28a745' : receipt.status === 'pending' ? '#ffc107' : '#dc3545';
        const sign = (receipt.type === 'deposit' || receipt.type === 'reward') ? '+' : '-';

        const modal = document.createElement('div');
        modal.id = 'receiptModal';
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content receipt-modal" style="max-width: 400px;">
                <div class="modal-header" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; text-align: center; padding: 20px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">🧾</div>
                    <h3 style="margin: 0; font-size: 18px;">Comprobante de Transacción</h3>
                    <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">La Tanda Fintech</div>
                </div>

                <div class="modal-body" style="padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 28px; font-weight: bold; color: ${typeColor};">
                            ${sign}${this.formatCurrency(receipt.amount, receipt.currency)}
                        </div>
                        <div style="font-size: 14px; color: #666;">${this.getTypeLabel(receipt.type)}</div>
                    </div>

                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #666;">Estado:</span>
                            <span style="font-weight: 500; color: ${statusColor};">${this.getStatusLabel(receipt.status)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #666;">Fecha:</span>
                            <span style="font-weight: 500;">${new Date(receipt.transaction_date).toLocaleString('es-HN')}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #666;">Referencia:</span>
                            <span style="font-weight: 500; font-family: monospace;">${receipt.reference_number}</span>
                        </div>
                    </div>

                    <div style="text-align: center; padding: 10px; border-top: 1px dashed #ddd; margin-top: 15px;">
                        <div style="font-size: 10px; color: #999;">ID: ${receipt.id}</div>
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; gap: 10px; padding: 15px; border-top: 1px solid #eee;">
                    <button onclick="window.ReceiptManager.downloadReceiptPDF('${receipt.id}')" class="btn-primary" style="flex: 1;">
                        <i class="fas fa-download"></i> Descargar PDF
                    </button>
                    <button onclick="document.getElementById('receiptModal').remove()" class="btn-secondary" style="flex: 1;">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    downloadReceiptPDF(receiptId) {
        const receipt = this.getReceipt(receiptId);
        if (!receipt) {
            if (typeof walletInstance !== 'undefined') walletInstance.showError('Recibo no encontrado');
            return;
        }

        const typeColor = (receipt.type === 'deposit' || receipt.type === 'reward') ? '#28a745' : '#333';
        const sign = (receipt.type === 'deposit' || receipt.type === 'reward') ? '+' : '-';
        const printWindow = window.open('', '_blank');

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Recibo ${receipt.reference_number}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; }
        .receipt { border: 2px solid #1a1a2e; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; text-align: center; padding: 25px; }
        .header h1 { font-size: 20px; margin-bottom: 5px; }
        .body { padding: 25px; }
        .amount { text-align: center; margin-bottom: 20px; }
        .amount .value { font-size: 32px; font-weight: bold; color: ${typeColor}; }
        .amount .type { font-size: 14px; color: #666; }
        .details { background: #f8f9fa; border-radius: 8px; padding: 15px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .footer { text-align: center; padding: 15px; border-top: 1px dashed #ddd; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div style="font-size: 40px; margin-bottom: 10px;">🧾</div>
            <h1>Comprobante de Transacción</h1>
            <div style="font-size: 12px; opacity: 0.8;">La Tanda Fintech</div>
        </div>
        <div class="body">
            <div class="amount">
                <div class="value">${sign}${this.formatCurrency(receipt.amount, receipt.currency)}</div>
                <div class="type">${this.getTypeLabel(receipt.type)}</div>
            </div>
            <div class="details">
                <div class="detail-row"><span>Estado:</span><span>${this.getStatusLabel(receipt.status)}</span></div>
                <div class="detail-row"><span>Fecha:</span><span>${new Date(receipt.transaction_date).toLocaleString('es-HN')}</span></div>
                <div class="detail-row"><span>Referencia:</span><span>${receipt.reference_number}</span></div>
            </div>
        </div>
        <div class="footer"><div>ID: ${receipt.id}</div><div>www.latanda.online</div></div>
    </div>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    }
}

window.ReceiptManager = new ReceiptManager();
console.log('✅ Receipt Manager loaded');
