/**
 * La Tanda - Tandas Manager
 * Gestión de tandas tradicionales hondureñas
 */

class TandasManager {
    constructor() {
        this.tandas = new Map();
        this.participants = new Map();
        this.payments = new Map();
        this.currentRound = 1;
        
        console.log('🔄 Tandas Manager initialized');
    }

    /**
     * Create a new tanda
     */
    createTanda(tandaData) {
        const tandaId = 'tanda_' + Date.now();
        
        const tanda = {
            id: tandaId,
            name: tandaData.name,
            description: tandaData.description || '',
            totalAmount: tandaData.totalAmount,
            participantCount: tandaData.participantCount,
            paymentFrequency: tandaData.paymentFrequency || 'monthly',
            startDate: tandaData.startDate,
            endDate: this.calculateEndDate(tandaData.startDate, tandaData.participantCount, tandaData.paymentFrequency),
            status: 'pending',
            currentRound: 1,
            participants: [],
            paymentSchedule: [],
            createdAt: new Date().toISOString(),
            createdBy: tandaData.createdBy || 'system'
        };

        this.tandas.set(tandaId, tanda);
        this.generatePaymentSchedule(tanda);
        
        console.log('✅ Tanda created:', tandaId);
        return tanda;
    }

    /**
     * Add participant to tanda
     */
    addParticipant(tandaId, participantData) {
        const tanda = this.tandas.get(tandaId);
        if (!tanda) {
            throw new Error('Tanda not found');
        }

        if (tanda.participants.length >= tanda.participantCount) {
            throw new Error('Tanda is full');
        }

        const participant = {
            id: 'participant_' + Date.now(),
            userId: participantData.userId,
            name: participantData.name,
            email: participantData.email,
            phone: participantData.phone,
            position: tanda.participants.length + 1,
            joinedAt: new Date().toISOString(),
            paymentStatus: 'pending'
        };

        tanda.participants.push(participant);
        this.participants.set(participant.id, participant);

        // If tanda is full, activate it
        if (tanda.participants.length === tanda.participantCount) {
            tanda.status = 'active';
            console.log('🚀 Tanda is now active:', tandaId);
        }

        console.log('👥 Participant added to tanda:', tandaId);
        return participant;
    }

    /**
     * Process payment for tanda
     */
    processPayment(tandaId, participantId, paymentData) {
        const tanda = this.tandas.get(tandaId);
        if (!tanda) {
            throw new Error('Tanda not found');
        }

        const participant = tanda.participants.find(p => p.id === participantId);
        if (!participant) {
            throw new Error('Participant not found');
        }

        const payment = {
            id: 'payment_' + Date.now(),
            tandaId: tandaId,
            participantId: participantId,
            amount: paymentData.amount,
            round: tanda.currentRound,
            paymentDate: new Date().toISOString(),
            status: 'completed',
            method: paymentData.method || 'cash',
            notes: paymentData.notes || ''
        };

        this.payments.set(payment.id, payment);
        participant.paymentStatus = 'paid';

        console.log('💰 Payment processed for tanda:', tandaId);
        return payment;
    }

    /**
     * Get tanda by ID
     */
    getTanda(tandaId) {
        return this.tandas.get(tandaId);
    }

    /**
     * Get all tandas
     */
    getAllTandas() {
        return Array.from(this.tandas.values());
    }

    /**
     * Get tandas by participant
     */
    getTandasByParticipant(userId) {
        return Array.from(this.tandas.values()).filter(tanda => 
            tanda.participants.some(p => p.userId === userId)
        );
    }

    /**
     * Calculate end date based on frequency and participant count
     */
    calculateEndDate(startDate, participantCount, frequency) {
        const start = new Date(startDate);
        let months = 0;

        switch (frequency) {
            case 'weekly':
                months = participantCount * 0.25; // 4 weeks = 1 month
                break;
            case 'biweekly':
                months = participantCount * 0.5; // 2 weeks = 0.5 month
                break;
            case 'monthly':
            default:
                months = participantCount;
                break;
        }

        const endDate = new Date(start);
        endDate.setMonth(endDate.getMonth() + months);
        return endDate.toISOString();
    }

    /**
     * Generate payment schedule for tanda
     */
    generatePaymentSchedule(tanda) {
        const schedule = [];
        const startDate = new Date(tanda.startDate);

        for (let round = 1; round <= tanda.participantCount; round++) {
            const paymentDate = new Date(startDate);
            
            switch (tanda.paymentFrequency) {
                case 'weekly':
                    paymentDate.setDate(paymentDate.getDate() + (round - 1) * 7);
                    break;
                case 'biweekly':
                    paymentDate.setDate(paymentDate.getDate() + (round - 1) * 14);
                    break;
                case 'monthly':
                default:
                    paymentDate.setMonth(paymentDate.getMonth() + (round - 1));
                    break;
            }

            schedule.push({
                round: round,
                paymentDate: paymentDate.toISOString(),
                recipientPosition: round,
                status: 'pending'
            });
        }

        tanda.paymentSchedule = schedule;
        return schedule;
    }

    /**
     * Get next payment date for tanda
     */
    getNextPaymentDate(tandaId) {
        const tanda = this.tandas.get(tandaId);
        if (!tanda) return null;

        const nextSchedule = tanda.paymentSchedule.find(s => s.status === 'pending');
        return nextSchedule ? nextSchedule.paymentDate : null;
    }

    /**
     * Get payment history for tanda
     */
    getPaymentHistory(tandaId) {
        return Array.from(this.payments.values())
            .filter(payment => payment.tandaId === tandaId)
            .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    }

    /**
     * Update tanda status
     */
    updateTandaStatus(tandaId, status) {
        const tanda = this.tandas.get(tandaId);
        if (!tanda) {
            throw new Error('Tanda not found');
        }

        tanda.status = status;
        tanda.updatedAt = new Date().toISOString();

        console.log(`📊 Tanda status updated to ${status}:`, tandaId);
        return tanda;
    }

    /**
     * Get tanda statistics
     */
    getTandaStats(tandaId) {
        const tanda = this.tandas.get(tandaId);
        if (!tanda) return null;

        const payments = this.getPaymentHistory(tandaId);
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const expectedTotal = tanda.totalAmount * tanda.participantCount;

        return {
            tandaId: tandaId,
            totalParticipants: tanda.participants.length,
            maxParticipants: tanda.participantCount,
            currentRound: tanda.currentRound,
            totalPaid: totalPaid,
            expectedTotal: expectedTotal,
            completionPercentage: (totalPaid / expectedTotal) * 100,
            status: tanda.status,
            nextPaymentDate: this.getNextPaymentDate(tandaId)
        };
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.tandasManager = new TandasManager();
    console.log('🌐 Tandas Manager loaded and available globally');
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TandasManager;
}