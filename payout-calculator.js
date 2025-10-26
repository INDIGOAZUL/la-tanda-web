/**
 * La Tanda - Payout Calculation Engine
 * Advanced payout scheduling and calculation system
 * Version: 1.0.0
 */

class PayoutCalculator {
    constructor() {
        this.payoutStrategies = {
            'round_robin': this.calculateRoundRobinPayout.bind(this),
            'highest_contributor': this.calculateHighestContributorPayout.bind(this),
            'random': this.calculateRandomPayout.bind(this),
            'needs_based': this.calculateNeedsBasedPayout.bind(this)
        };
        
        console.log('🧮 Payout Calculator initialized');
    }

    /**
     * Calculate payout for a group based on strategy
     */
    calculatePayout(groupId, cycleNumber, strategy = 'round_robin') {
        const calculator = this.payoutStrategies[strategy];
        
        if (!calculator) {
            throw new Error(`Unknown payout strategy: ${strategy}`);
        }
        
        return calculator(groupId, cycleNumber);
    }

    /**
     * Round Robin Payout Strategy
     * Each member gets a turn in order
     */
    calculateRoundRobinPayout(groupId, cycleNumber) {
        const contributions = window.contributionTracker?.getGroupContributions(groupId) || [];
        const payouts = window.contributionTracker?.getGroupPayouts(groupId) || [];
        
        // Default contributors if no contributions exist
        const defaultContributors = ['user_1', 'user_2', 'user_3', 'user_4'];
        
        // Get all unique contributors
        const contributors = contributions.length > 0 ? 
            [...new Set(contributions.map(c => c.userId))] : 
            defaultContributors;
        
        // Determine who's next based on cycle number
        const recipientIndex = (cycleNumber - 1) % contributors.length;
        const recipient = contributors[recipientIndex];
        
        // Calculate total amount for this cycle
        const cycleContributions = contributions.filter(c => c.cycle_number === cycleNumber);
        const totalAmount = cycleContributions.length > 0 ? 
            cycleContributions.reduce((sum, c) => sum + c.amount, 0) : 
            2000; // Default amount for testing
        
        return {
            strategy: 'round_robin',
            recipient: recipient,
            amount: totalAmount,
            cycleNumber: cycleNumber,
            reason: `Turn ${recipientIndex + 1} of ${contributors.length} in round-robin rotation`,
            contributors: cycleContributions.length > 0 ? 
                cycleContributions.map(c => ({
                    userId: c.userId,
                    amount: c.amount,
                    contributionId: c.id
                })) : [{
                    userId: recipient,
                    amount: totalAmount,
                    contributionId: `mock_${cycleNumber}`
                }]
        };
    }

    /**
     * Highest Contributor Payout Strategy
     * Member with highest total contributions gets priority
     */
    calculateHighestContributorPayout(groupId, cycleNumber) {
        const contributions = window.contributionTracker.getGroupContributions(groupId);
        const balances = window.contributionTracker.getGroupBalances(groupId);
        
        // Find highest contributor who hasn't received payout recently
        const sortedContributors = Object.entries(balances)
            .sort(([,a], [,b]) => b - a);
        
        const recipient = sortedContributors[0]?.[0];
        
        // Calculate total amount for this cycle
        const cycleContributions = contributions.filter(c => c.cycle_number === cycleNumber);
        const totalAmount = cycleContributions.reduce((sum, c) => sum + c.amount, 0);
        
        return {
            strategy: 'highest_contributor',
            recipient: recipient,
            amount: totalAmount,
            cycleNumber: cycleNumber,
            reason: `Highest total contributor with ${balances[recipient]} HNL contributed`,
            contributors: cycleContributions.map(c => ({
                userId: c.userId,
                amount: c.amount,
                contributionId: c.id
            }))
        };
    }

    /**
     * Random Payout Strategy
     * Random selection among eligible members
     */
    calculateRandomPayout(groupId, cycleNumber) {
        const contributions = window.contributionTracker.getGroupContributions(groupId);
        const cycleContributions = contributions.filter(c => c.cycle_number === cycleNumber);
        
        // Get contributors for this cycle
        const cycleContributors = [...new Set(cycleContributions.map(c => c.userId))];
        
        // Random selection
        const randomIndex = Math.floor(Math.random() * cycleContributors.length);
        const recipient = cycleContributors[randomIndex];
        
        const totalAmount = cycleContributions.reduce((sum, c) => sum + c.amount, 0);
        
        return {
            strategy: 'random',
            recipient: recipient,
            amount: totalAmount,
            cycleNumber: cycleNumber,
            reason: `Randomly selected from ${cycleContributors.length} eligible contributors`,
            contributors: cycleContributions.map(c => ({
                userId: c.userId,
                amount: c.amount,
                contributionId: c.id
            }))
        };
    }

    /**
     * Needs-Based Payout Strategy
     * Based on member's financial need/score
     */
    calculateNeedsBasedPayout(groupId, cycleNumber) {
        // This would integrate with member profiles and need assessments
        // For now, simplified version
        
        const contributions = window.contributionTracker.getGroupContributions(groupId);
        const cycleContributions = contributions.filter(c => c.cycle_number === cycleNumber);
        
        // Mock needs scoring (in real system, this would come from member profiles)
        const needsScores = {
            'user_1': 85,  // High need
            'user_2': 60,  // Medium need
            'user_3': 40,  // Lower need
            'user_4': 75   // High need
        };
        
        // Get contributors for this cycle and their needs scores
        const cycleContributors = [...new Set(cycleContributions.map(c => c.userId))];
        const eligibleContributors = cycleContributors
            .map(userId => ({
                userId,
                needsScore: needsScores[userId] || 50
            }))
            .sort((a, b) => b.needsScore - a.needsScore);
        
        const recipient = eligibleContributors[0]?.userId;
        const totalAmount = cycleContributions.reduce((sum, c) => sum + c.amount, 0);
        
        return {
            strategy: 'needs_based',
            recipient: recipient,
            amount: totalAmount,
            cycleNumber: cycleNumber,
            reason: `Highest financial need score: ${needsScores[recipient] || 0}/100`,
            contributors: cycleContributions.map(c => ({
                userId: c.userId,
                amount: c.amount,
                contributionId: c.id
            }))
        };
    }

    /**
     * Calculate optimal payout schedule for entire group cycle
     */
    calculateFullCycleSchedule(groupId, strategy = 'round_robin') {
        const contributions = window.contributionTracker.getGroupContributions(groupId);
        const stats = window.contributionTracker.getContributionStats(groupId);
        
        const schedule = [];
        
        // Calculate payouts for each completed cycle
        for (let cycle = 1; cycle <= stats.currentCycle; cycle++) {
            try {
                const payout = this.calculatePayout(groupId, cycle, strategy);
                schedule.push(payout);
            } catch (error) {
                console.warn(`Could not calculate payout for cycle ${cycle}:`, error);
            }
        }
        
        return {
            groupId: groupId,
            strategy: strategy,
            totalCycles: stats.currentCycle,
            schedule: schedule,
            totalAmount: schedule.reduce((sum, p) => sum + p.amount, 0),
            summary: {
                completed: schedule.filter(p => p.amount > 0).length,
                pending: Math.max(0, stats.currentCycle - schedule.length),
                averagePayout: schedule.length > 0 ? 
                    schedule.reduce((sum, p) => sum + p.amount, 0) / schedule.length : 0
            }
        };
    }

    /**
     * Validate payout calculation
     */
    validatePayout(payout) {
        if (!payout) {
            return {
                isValid: false,
                validations: {
                    hasRecipient: false,
                    hasPositiveAmount: false,
                    hasValidCycle: false,
                    hasContributors: false
                },
                errors: ['Payout object is null or undefined']
            };
        }

        const validations = {
            hasRecipient: !!payout.recipient,
            hasPositiveAmount: payout.amount > 0,
            hasValidCycle: payout.cycleNumber > 0,
            hasContributors: payout.contributors && payout.contributors.length > 0
        };
        
        const isValid = Object.values(validations).every(v => v);
        
        return {
            isValid: isValid,
            validations: validations,
            errors: Object.entries(validations)
                .filter(([key, value]) => !value)
                .map(([key]) => `Invalid ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        };
    }

    /**
     * Generate payout report
     */
    generatePayoutReport(groupId) {
        const stats = window.contributionTracker.getContributionStats(groupId);
        const schedule = this.calculateFullCycleSchedule(groupId);
        const payouts = window.contributionTracker.getGroupPayouts(groupId);
        
        return {
            groupId: groupId,
            generatedAt: new Date().toISOString(),
            statistics: stats,
            schedule: schedule,
            actualPayouts: payouts,
            performance: {
                payoutEfficiency: payouts.length > 0 ? 
                    (payouts.filter(p => p.status === 'completed').length / payouts.length) * 100 : 0,
                averagePayoutTime: '2-3 business days', // Mock data
                totalProcessed: payouts.reduce((sum, p) => 
                    p.status === 'completed' ? sum + p.amount : sum, 0)
            }
        };
    }

    /**
     * Simulate payout calculation for testing
     */
    simulatePayoutCalculation(groupId, cycles = 3, strategy = 'round_robin') {
        console.log(`🧮 Simulating payout calculation for ${cycles} cycles`);
        
        const results = [];
        
        for (let cycle = 1; cycle <= cycles; cycle++) {
            try {
                const payout = this.calculatePayout(groupId, cycle, strategy);
                const validation = this.validatePayout(payout);
                
                results.push({
                    cycle: cycle,
                    payout: payout,
                    validation: validation
                });
                
                console.log(`Cycle ${cycle}: ${payout.amount} HNL → ${payout.recipient}`);
            } catch (error) {
                console.warn(`Cycle ${cycle} calculation failed:`, error);
            }
        }
        
        return results;
    }
}

// Global instance
window.payoutCalculator = new PayoutCalculator();