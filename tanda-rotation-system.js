/**
 * La Tanda - Rotation System with Lottery
 * Traditional tanda rotation management with fair turn assignment
 * Version: 1.0.0
 */

class TandaRotationSystem {
    constructor() {
        this.groupRotations = new Map(); // groupId -> rotation data
        this.lotteryHistory = new Map(); // groupId -> lottery history
        this.memberTurns = new Map(); // groupId -> member turn assignments
        
        console.log('🎲 Tanda Rotation System initialized');
    }

    /**
     * Initialize rotation for a new group
     */
    initializeGroupRotation(groupId, members, rotationType = 'lottery') {
        try {
            console.log(`🎲 Initializing rotation for group ${groupId} with ${members.length} members`);
            
            const rotation = {
                groupId: groupId,
                members: [...members], // Copy array
                totalMembers: members.length,
                rotationType: rotationType,
                currentCycle: 0,
                isComplete: false,
                createdAt: new Date().toISOString(),
                turnOrder: [],
                remainingMembers: [...members],
                completedTurns: []
            };

            // Assign turn order based on rotation type
            switch (rotationType) {
                case 'lottery':
                    rotation.turnOrder = this.conductLottery(groupId, members);
                    break;
                case 'sequential':
                    rotation.turnOrder = this.assignSequentialOrder(members);
                    break;
                case 'contribution_based':
                    rotation.turnOrder = this.assignContributionBasedOrder(groupId, members);
                    break;
                case 'needs_based':
                    rotation.turnOrder = this.assignNeedsBasedOrder(members);
                    break;
                default:
                    rotation.turnOrder = this.conductLottery(groupId, members);
            }

            this.groupRotations.set(groupId, rotation);
            this.memberTurns.set(groupId, new Map());

            // Store individual member turn numbers
            rotation.turnOrder.forEach((member, index) => {
                this.memberTurns.get(groupId).set(member.userId, {
                    turnNumber: index + 1,
                    position: index,
                    status: 'pending',
                    assignedAt: new Date().toISOString(),
                    expectedPayoutDate: this.calculateExpectedPayoutDate(index, 'weekly'),
                    lotteryNumber: member.lotteryNumber
                });
            });

            console.log(`✅ Rotation initialized: ${rotation.turnOrder.length} turns assigned`);
            return rotation;
            
        } catch (error) {
            console.error('Error initializing group rotation:', error);
            throw error;
        }
    }

    /**
     * Conduct lottery to determine turn order
     */
    conductLottery(groupId, members) {
        console.log(`🎲 Conducting lottery for ${members.length} members`);
        
        // Generate lottery numbers for each member
        const lotteryParticipants = members.map(memberId => ({
            userId: memberId,
            lotteryNumber: this.generateLotteryNumber(),
            drawnAt: new Date().toISOString()
        }));

        // Sort by lottery number (ascending = first turn)
        const sortedParticipants = lotteryParticipants.sort((a, b) => a.lotteryNumber - b.lotteryNumber);

        // Record lottery history
        const lotteryRecord = {
            groupId: groupId,
            conductedAt: new Date().toISOString(),
            participants: lotteryParticipants,
            result: sortedParticipants,
            method: 'random_number_generation'
        };

        if (!this.lotteryHistory.has(groupId)) {
            this.lotteryHistory.set(groupId, []);
        }
        this.lotteryHistory.get(groupId).push(lotteryRecord);

        console.log('🎯 Lottery results:');
        sortedParticipants.forEach((participant, index) => {
            console.log(`  ${index + 1}. ${participant.userId} (Number: ${participant.lotteryNumber})`);
        });

        return sortedParticipants;
    }

    /**
     * Generate a random lottery number
     */
    generateLotteryNumber() {
        // Generate number between 1-1000 for fair distribution
        return Math.floor(Math.random() * 1000) + 1;
    }

    /**
     * Assign sequential order (first come, first served)
     */
    assignSequentialOrder(members) {
        return members.map((memberId, index) => ({
            userId: memberId,
            lotteryNumber: index + 1,
            drawnAt: new Date().toISOString(),
            method: 'sequential'
        }));
    }

    /**
     * Assign order based on contribution history
     */
    assignContributionBasedOrder(groupId, members) {
        // Get contribution history if available
        const contributions = window.contributionTracker ? 
            window.contributionTracker.getGroupBalances(groupId) : {};

        return members
            .map(memberId => ({
                userId: memberId,
                totalContributions: contributions[memberId] || 0,
                lotteryNumber: contributions[memberId] || 0,
                drawnAt: new Date().toISOString(),
                method: 'contribution_based'
            }))
            .sort((a, b) => b.totalContributions - a.totalContributions); // Highest contributor first
    }

    /**
     * Assign order based on financial need
     */
    assignNeedsBasedOrder(members) {
        // Mock needs assessment (in real system, would come from member profiles)
        const needsScores = {
            'user_1': 85,
            'user_2': 60,
            'user_3': 40,
            'user_4': 75,
            'user_5': 95
        };

        return members
            .map(memberId => ({
                userId: memberId,
                needsScore: needsScores[memberId] || 50,
                lotteryNumber: needsScores[memberId] || 50,
                drawnAt: new Date().toISOString(),
                method: 'needs_based'
            }))
            .sort((a, b) => b.needsScore - a.needsScore); // Highest need first
    }

    /**
     * Calculate expected payout date based on turn position
     */
    calculateExpectedPayoutDate(turnPosition, frequency) {
        const now = new Date();
        let weeksToAdd = 0;

        switch (frequency) {
            case 'weekly':
                weeksToAdd = turnPosition;
                break;
            case 'biweekly':
                weeksToAdd = turnPosition * 2;
                break;
            case 'monthly':
                weeksToAdd = turnPosition * 4;
                break;
            default:
                weeksToAdd = turnPosition;
        }

        const payoutDate = new Date(now);
        payoutDate.setDate(payoutDate.getDate() + (weeksToAdd * 7));
        
        return payoutDate.toISOString().split('T')[0];
    }

    /**
     * Get next member to receive payout
     */
    getNextPayoutRecipient(groupId) {
        const rotation = this.groupRotations.get(groupId);
        
        if (!rotation) {
            throw new Error(`No rotation found for group ${groupId}`);
        }

        // Find next member who hasn't received payout
        const nextTurn = rotation.turnOrder.find(turn => 
            !rotation.completedTurns.includes(turn.userId)
        );

        if (!nextTurn) {
            return null; // All members have received their turn
        }

        return {
            userId: nextTurn.userId,
            turnNumber: rotation.completedTurns.length + 1,
            lotteryNumber: nextTurn.lotteryNumber,
            totalTurns: rotation.totalMembers,
            isLastTurn: rotation.completedTurns.length + 1 === rotation.totalMembers
        };
    }

    /**
     * Record payout completion for a member
     */
    recordPayoutCompletion(groupId, userId, payoutAmount) {
        const rotation = this.groupRotations.get(groupId);
        
        if (!rotation) {
            throw new Error(`No rotation found for group ${groupId}`);
        }

        // Mark turn as completed
        if (!rotation.completedTurns.includes(userId)) {
            rotation.completedTurns.push(userId);
            rotation.currentCycle = rotation.completedTurns.length;
        }

        // Update member turn status
        const memberTurns = this.memberTurns.get(groupId);
        if (memberTurns && memberTurns.has(userId)) {
            const memberTurn = memberTurns.get(userId);
            memberTurn.status = 'completed';
            memberTurn.completedAt = new Date().toISOString();
            memberTurn.payoutAmount = payoutAmount;
        }

        // Check if rotation is complete
        if (rotation.completedTurns.length === rotation.totalMembers) {
            rotation.isComplete = true;
            rotation.completedAt = new Date().toISOString();
            console.log(`🎉 Rotation completed for group ${groupId}`);
        }

        console.log(`✅ Payout recorded: ${userId} received ${payoutAmount} HNL (Turn ${rotation.completedTurns.length}/${rotation.totalMembers})`);
        
        return {
            turnCompleted: true,
            rotationComplete: rotation.isComplete,
            nextRecipient: rotation.isComplete ? null : this.getNextPayoutRecipient(groupId)
        };
    }

    /**
     * Get rotation status for a group
     */
    getRotationStatus(groupId) {
        const rotation = this.groupRotations.get(groupId);
        
        if (!rotation) {
            return null;
        }

        const memberTurns = this.memberTurns.get(groupId);
        const lotteryHistory = this.lotteryHistory.get(groupId) || [];

        return {
            groupId: groupId,
            rotationType: rotation.rotationType,
            totalMembers: rotation.totalMembers,
            currentCycle: rotation.currentCycle,
            completedTurns: rotation.completedTurns.length,
            remainingTurns: rotation.totalMembers - rotation.completedTurns.length,
            isComplete: rotation.isComplete,
            progress: (rotation.completedTurns.length / rotation.totalMembers) * 100,
            nextRecipient: rotation.isComplete ? null : this.getNextPayoutRecipient(groupId),
            turnOrder: rotation.turnOrder,
            memberTurns: memberTurns ? Object.fromEntries(memberTurns) : {},
            lotteryHistory: lotteryHistory
        };
    }

    /**
     * Get member's turn information
     */
    getMemberTurnInfo(groupId, userId) {
        const memberTurns = this.memberTurns.get(groupId);
        
        if (!memberTurns || !memberTurns.has(userId)) {
            return null;
        }

        const turnInfo = memberTurns.get(userId);
        const rotation = this.groupRotations.get(groupId);
        
        return {
            ...turnInfo,
            isNext: rotation && this.getNextPayoutRecipient(groupId)?.userId === userId,
            turnsUntilPayout: Math.max(0, turnInfo.turnNumber - (rotation?.currentCycle || 0) - 1)
        };
    }

    /**
     * Re-conduct lottery (if needed due to disputes)
     */
    reConductLottery(groupId, reason = 'Dispute resolution') {
        const rotation = this.groupRotations.get(groupId);
        
        if (!rotation) {
            throw new Error(`No rotation found for group ${groupId}`);
        }

        console.log(`🔄 Re-conducting lottery for group ${groupId}. Reason: ${reason}`);
        
        // Only re-assign remaining members
        const remainingMembers = rotation.members.filter(memberId => 
            !rotation.completedTurns.includes(memberId)
        );

        if (remainingMembers.length === 0) {
            throw new Error('No remaining members to re-assign');
        }

        // Conduct new lottery for remaining members
        const newLotteryResults = this.conductLottery(groupId + '_rerun', remainingMembers);
        
        // Update turn order, keeping completed turns in place
        const completedTurns = rotation.turnOrder.filter(turn => 
            rotation.completedTurns.includes(turn.userId)
        );

        rotation.turnOrder = [...completedTurns, ...newLotteryResults];
        
        // Update member turn assignments
        const memberTurns = this.memberTurns.get(groupId);
        newLotteryResults.forEach((member, index) => {
            const newTurnNumber = rotation.completedTurns.length + index + 1;
            memberTurns.set(member.userId, {
                ...memberTurns.get(member.userId),
                turnNumber: newTurnNumber,
                position: newTurnNumber - 1,
                lotteryNumber: member.lotteryNumber,
                reassignedAt: new Date().toISOString(),
                reassignmentReason: reason
            });
        });

        console.log(`✅ Lottery re-conducted: ${newLotteryResults.length} remaining turns reassigned`);
        
        return this.getRotationStatus(groupId);
    }

    /**
     * Generate rotation report
     */
    generateRotationReport(groupId) {
        const status = this.getRotationStatus(groupId);
        
        if (!status) {
            throw new Error(`No rotation found for group ${groupId}`);
        }

        return {
            groupId: groupId,
            generatedAt: new Date().toISOString(),
            rotationSummary: {
                type: status.rotationType,
                totalMembers: status.totalMembers,
                completedTurns: status.completedTurns,
                progress: status.progress.toFixed(1) + '%',
                isComplete: status.isComplete
            },
            turnOrder: status.turnOrder.map((turn, index) => ({
                position: index + 1,
                userId: turn.userId,
                lotteryNumber: turn.lotteryNumber,
                status: status.memberTurns[turn.userId]?.status || 'pending',
                expectedDate: status.memberTurns[turn.userId]?.expectedPayoutDate
            })),
            lotteryDetails: status.lotteryHistory[0] || null,
            statistics: {
                averageLotteryNumber: status.turnOrder.reduce((sum, turn) => sum + turn.lotteryNumber, 0) / status.turnOrder.length,
                fairnessScore: this.calculateFairnessScore(status.turnOrder),
                timeToCompletion: status.isComplete ? 
                    this.calculateCompletionTime(groupId) : 
                    this.estimateCompletionTime(groupId)
            }
        };
    }

    /**
     * Calculate fairness score of lottery
     */
    calculateFairnessScore(turnOrder) {
        // Simple fairness metric based on lottery number distribution
        const numbers = turnOrder.map(turn => turn.lotteryNumber);
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        
        // Higher variance = more fair distribution (less predictable)
        return Math.min(100, (variance / 1000) * 100);
    }

    /**
     * Estimate completion time
     */
    estimateCompletionTime(groupId) {
        const rotation = this.groupRotations.get(groupId);
        if (!rotation) return null;

        const remainingTurns = rotation.totalMembers - rotation.completedTurns.length;
        const weeksRemaining = remainingTurns; // Assuming weekly frequency
        
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + (weeksRemaining * 7));
        
        return completionDate.toISOString().split('T')[0];
    }

    /**
     * Calculate actual completion time
     */
    calculateCompletionTime(groupId) {
        const rotation = this.groupRotations.get(groupId);
        if (!rotation || !rotation.isComplete) return null;

        const startDate = new Date(rotation.createdAt);
        const endDate = new Date(rotation.completedAt);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return `${diffDays} days`;
    }
}

// Global instance
window.tandaRotationSystem = new TandaRotationSystem();