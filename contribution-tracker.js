/**
 * La Tanda - Contribution Tracking System
 * Real-time contribution management and payout calculations
 * Version: 1.0.0
 */

class ContributionTracker {
    constructor() {
        this.API_BASE = 'https://api.latanda.online/api';
        this.contributions = new Map(); // groupId -> contributions array
        this.payoutSchedules = new Map(); // groupId -> payout schedule
        this.memberBalances = new Map(); // groupId -> member balances
        
        console.log('💰 Contribution Tracker initialized');
    }

    /**
     * Track a new contribution to a group
     */
    async recordContribution(groupId, userId, amount, paymentMethod = 'bank_transfer') {
        try {
            console.log(`💰 Recording contribution: ${amount} HNL for group ${groupId}`);
            
            // Check if API proxy is available
            if (!window.apiProxy) {
                throw new Error('API proxy not available');
            }
            
            // Use API proxy for CORS-safe requests
            const paymentData = await window.apiProxy.makeRequest('/payments/process', {
                method: 'POST',
                body: JSON.stringify({
                    amount: amount,
                    currency: 'HNL',
                    payment_method: paymentMethod,
                    description: `Contribución Tanda - Grupo ${groupId}`,
                    group_id: groupId,
                    user_id: userId
                })
            });
            
            console.log(`📊 Payment API response:`, paymentData);
            
            if (paymentData && paymentData.success) {
                // Create contribution record
                let cycleNumber = 1;
                try {
                    cycleNumber = await this.getCurrentCycle(groupId);
                } catch (error) {
                    console.warn('Could not get current cycle, using default:', error);
                    cycleNumber = 1;
                }

                const contribution = {
                    id: paymentData.data.id,
                    groupId: groupId,
                    userId: userId,
                    amount: amount,
                    currency: 'HNL',
                    status: paymentData.data.status,
                    transaction_date: paymentData.data.transaction_date,
                    confirmation_code: paymentData.data.confirmation_code,
                    payment_method: paymentMethod,
                    cycle_number: cycleNumber,
                    created_at: new Date().toISOString()
                };

                // Store contribution
                if (!this.contributions.has(groupId)) {
                    this.contributions.set(groupId, []);
                }
                this.contributions.get(groupId).push(contribution);

                // Update member balance
                try {
                    await this.updateMemberBalance(groupId, userId, amount);
                } catch (error) {
                    console.warn('Could not update member balance:', error);
                }

                // Check if cycle is complete
                try {
                    await this.checkCycleCompletion(groupId);
                } catch (error) {
                    console.warn('Could not check cycle completion:', error);
                }

                return {
                    success: true,
                    contribution: contribution,
                    payment_data: paymentData.data
                };
            } else {
                throw new Error(paymentData.message || 'Payment processing failed');
            }
        } catch (error) {
            console.error('Error recording contribution:', error);
            throw error;
        }
    }

    /**
     * Get current cycle number for a group
     */
    async getCurrentCycle(groupId) {
        try {
            // This would typically come from the group's metadata
            // For now, calculate based on contributions
            const groupContributions = this.contributions.get(groupId) || [];
            
            // Use default member count to avoid API calls during contribution recording
            const defaultMemberCount = 4;
            
            const totalContributions = groupContributions.length;
            
            return Math.floor(totalContributions / defaultMemberCount) + 1;
        } catch (error) {
            console.warn('Error calculating current cycle:', error);
            return 1;
        }
    }

    /**
     * Update member balance for a group
     */
    async updateMemberBalance(groupId, userId, amount) {
        if (!this.memberBalances.has(groupId)) {
            this.memberBalances.set(groupId, new Map());
        }
        
        const groupBalances = this.memberBalances.get(groupId);
        const currentBalance = groupBalances.get(userId) || 0;
        groupBalances.set(userId, currentBalance + amount);
        
        console.log(`💰 Updated balance for user ${userId}: ${currentBalance + amount} HNL`);
    }

    /**
     * Check if a cycle is complete and trigger payout
     */
    async checkCycleCompletion(groupId) {
        try {
            const group = await this.getGroupDetails(groupId);
            const contributions = this.contributions.get(groupId) || [];
            const currentCycle = await this.getCurrentCycle(groupId);
            
            // Count contributions for current cycle
            const cycleContributions = contributions.filter(c => c.cycle_number === currentCycle);
            
            // If all members have contributed for this cycle
            if (cycleContributions.length >= group.member_count) {
                console.log(`🎉 Cycle ${currentCycle} complete for group ${groupId}`);
                await this.triggerPayout(groupId, currentCycle);
            }
        } catch (error) {
            console.error('Error checking cycle completion:', error);
        }
    }

    /**
     * Trigger payout for completed cycle
     */
    async triggerPayout(groupId, cycleNumber) {
        try {
            const group = await this.getGroupDetails(groupId);
            const contributions = this.contributions.get(groupId) || [];
            const cycleContributions = contributions.filter(c => c.cycle_number === cycleNumber);
            
            // Calculate total payout amount
            const totalAmount = cycleContributions.reduce((sum, c) => sum + c.amount, 0);
            
            // Determine payout recipient (typically first contributor of cycle)
            const recipient = cycleContributions[0]?.userId;
            
            if (recipient) {
                // Create payout record
                const payout = {
                    id: `payout_${Date.now()}`,
                    groupId: groupId,
                    recipientId: recipient,
                    amount: totalAmount,
                    cycleNumber: cycleNumber,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    contributions: cycleContributions.map(c => c.id)
                };

                console.log(`💸 Payout triggered: ${totalAmount} HNL to user ${recipient}`);
                
                // Store payout
                if (!this.payoutSchedules.has(groupId)) {
                    this.payoutSchedules.set(groupId, []);
                }
                this.payoutSchedules.get(groupId).push(payout);

                // In a real system, this would trigger actual money transfer
                // For now, we'll mark it as processed
                setTimeout(() => {
                    payout.status = 'completed';
                    console.log(`✅ Payout completed: ${totalAmount} HNL to user ${recipient}`);
                }, 2000);

                return payout;
            }
        } catch (error) {
            console.error('Error triggering payout:', error);
            throw error;
        }
    }

    /**
     * Get group details from API
     */
    async getGroupDetails(groupId) {
        try {
            const data = await window.apiProxy.makeRequest('/groups', {
                method: 'GET'
            });
            
            if (data.success) {
                return data.data.find(group => group.id === groupId) || {
                    id: groupId,
                    name: "Test Group",
                    member_count: 4,
                    contribution_amount: 500,
                    frequency: "weekly"
                };
            }
            return {
                id: groupId,
                name: "Test Group",
                member_count: 4,
                contribution_amount: 500,
                frequency: "weekly"
            };
        } catch (error) {
            console.error('Error fetching group details:', error);
            return {
                id: groupId,
                name: "Test Group",
                member_count: 4,
                contribution_amount: 500,
                frequency: "weekly"
            };
        }
    }

    /**
     * Get contribution history for a group
     */
    getGroupContributions(groupId) {
        return this.contributions.get(groupId) || [];
    }

    /**
     * Get member balances for a group
     */
    getGroupBalances(groupId) {
        const balances = this.memberBalances.get(groupId);
        return balances ? Object.fromEntries(balances) : {};
    }

    /**
     * Get payout history for a group
     */
    getGroupPayouts(groupId) {
        return this.payoutSchedules.get(groupId) || [];
    }

    /**
     * Calculate next payout recipient
     */
    getNextPayoutRecipient(groupId) {
        const payouts = this.getGroupPayouts(groupId);
        const completedPayouts = payouts.filter(p => p.status === 'completed');
        
        // Simple round-robin: next person in line
        // In a real system, this would be more sophisticated
        return `user_${(completedPayouts.length % 10) + 1}`;
    }

    /**
     * Get contribution statistics for a group
     */
    getContributionStats(groupId) {
        const contributions = this.getGroupContributions(groupId);
        const payouts = this.getGroupPayouts(groupId);
        
        return {
            totalContributions: contributions.length,
            totalAmount: contributions.reduce((sum, c) => sum + c.amount, 0),
            completedPayouts: payouts.filter(p => p.status === 'completed').length,
            pendingPayouts: payouts.filter(p => p.status === 'pending').length,
            currentCycle: Math.max(...contributions.map(c => c.cycle_number), 0),
            averageContribution: contributions.length > 0 ? 
                contributions.reduce((sum, c) => sum + c.amount, 0) / contributions.length : 0
        };
    }

    /**
     * Simulate a contribution for testing
     */
    async simulateContribution(groupId, userId, amount) {
        console.log(`🧪 Simulating contribution: ${amount} HNL from user ${userId}`);
        
        try {
            const result = await this.recordContribution(groupId, userId, amount, 'test');
            console.log('✅ Contribution simulation successful:', result);
            return result;
        } catch (error) {
            console.error('❌ Contribution simulation failed:', error);
            throw error;
        }
    }
}

// Global instance
window.contributionTracker = new ContributionTracker();