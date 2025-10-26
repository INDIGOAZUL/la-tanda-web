/**
 * La Tanda - Integrated Lottery System Manager
 * Complete lottery functionality with API integration
 * Version: 2.0.0
 */

class LotterySystemManager {
    constructor() {
        this.apiProxy = window.apiProxy;
        this.tandaRotationSystem = window.tandaRotationSystem;
        this.activeLotteries = new Map(); // groupId -> lottery data
        this.lotteryHistory = new Map(); // groupId -> lottery history array
        
        console.log('🎲 Lottery System Manager initialized');
    }

    /**
     * Conduct lottery with full API integration
     */
    async conductLottery(groupId, members, options = {}) {
        try {
            console.log(`🎲 Conducting lottery for group ${groupId} with ${members.length} members`);
            
            const lotteryData = {
                group_id: groupId,
                members: members,
                lottery_type: options.type || 'random_number',
                options: {
                    min_number: options.minNumber || 1,
                    max_number: options.maxNumber || 1000,
                    allow_duplicates: options.allowDuplicates || false,
                    validate_fairness: options.validateFairness !== false
                }
            };

            // Call API to conduct lottery
            const response = await this.apiProxy.makeRequest('/lottery/conduct', {
                method: 'POST',
                body: JSON.stringify(lotteryData)
            });

            if (response.success) {
                // Store lottery results locally
                this.activeLotteries.set(groupId, response.data);
                
                // Add to history
                if (!this.lotteryHistory.has(groupId)) {
                    this.lotteryHistory.set(groupId, []);
                }
                this.lotteryHistory.get(groupId).push({
                    ...response.data,
                    stored_at: new Date().toISOString()
                });

                // Integrate with rotation system
                if (this.tandaRotationSystem) {
                    const rotationData = this.convertApiToRotationFormat(response.data);
                    this.tandaRotationSystem.groupRotations.set(groupId, rotationData);
                    this.updateMemberTurns(groupId, response.data.results);
                }

                // Validate lottery results if requested
                if (options.validateFairness !== false) {
                    const validation = await this.validateLotteryResults(groupId, response.data.results);
                    response.data.validation = validation;
                }

                console.log(`✅ Lottery conducted successfully: ${response.data.lottery_id}`);
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Lottery failed');
            }

        } catch (error) {
            console.error('Error conducting lottery:', error);
            throw error;
        }
    }

    /**
     * Get lottery status for a group
     */
    async getLotteryStatus(groupId) {
        try {
            const response = await this.apiProxy.makeRequest(`/lottery/status?group_id=${groupId}`, {
                method: 'GET'
            });

            if (response.success) {
                // Update local cache
                this.activeLotteries.set(groupId, response.data);
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Failed to get lottery status');
            }

        } catch (error) {
            console.error('Error getting lottery status:', error);
            throw error;
        }
    }

    /**
     * Re-conduct lottery for remaining members
     */
    async reConductLottery(groupId, reason = 'User requested') {
        try {
            console.log(`🔄 Re-conducting lottery for group ${groupId}`);
            
            const currentStatus = await this.getLotteryStatus(groupId);
            
            // Get remaining members who haven't received payouts
            const allMembers = this.tandaRotationSystem?.groupRotations.get(groupId)?.members || [];
            const completedTurns = currentStatus.completed_turns || 0;
            const remainingMembers = allMembers.slice(completedTurns);

            if (remainingMembers.length === 0) {
                throw new Error('No remaining members to re-assign');
            }

            const relotteryData = {
                group_id: groupId,
                reason: reason,
                remaining_members: remainingMembers,
                preserve_completed: true
            };

            const response = await this.apiProxy.makeRequest('/lottery/reconduct', {
                method: 'POST',
                body: JSON.stringify(relotteryData)
            });

            if (response.success) {
                // Update local data
                const currentLottery = this.activeLotteries.get(groupId);
                if (currentLottery) {
                    // Update with new results for remaining members
                    this.updateLotteryWithNewResults(groupId, response.data.new_results, completedTurns);
                }

                // Add to history
                this.lotteryHistory.get(groupId)?.push({
                    ...response.data,
                    type: 'reconduct',
                    stored_at: new Date().toISOString()
                });

                console.log(`✅ Re-lottery completed: ${response.data.affected_members} members reassigned`);
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Re-lottery failed');
            }

        } catch (error) {
            console.error('Error re-conducting lottery:', error);
            throw error;
        }
    }

    /**
     * Validate lottery results for fairness
     */
    async validateLotteryResults(groupId, results) {
        try {
            const validationData = {
                group_id: groupId,
                results: results,
                validation_type: 'comprehensive'
            };

            const response = await this.apiProxy.makeRequest('/lottery/validate', {
                method: 'POST',
                body: JSON.stringify(validationData)
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Validation failed');
            }

        } catch (error) {
            console.error('Error validating lottery:', error);
            return {
                is_valid: false,
                error: error.message,
                fairness_score: 0
            };
        }
    }

    /**
     * Assign turns based on lottery results
     */
    async assignTurns(groupId, lotteryResults) {
        try {
            const turnData = {
                group_id: groupId,
                lottery_results: lotteryResults
            };

            const response = await this.apiProxy.makeRequest('/turns/assign', {
                method: 'POST',
                body: JSON.stringify(turnData)
            });

            if (response.success) {
                console.log(`✅ Turns assigned: ${response.data.total_turns} members`);
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Turn assignment failed');
            }

        } catch (error) {
            console.error('Error assigning turns:', error);
            throw error;
        }
    }

    /**
     * Complete a member's turn and update system
     */
    async completeTurn(groupId, userId, payoutAmount) {
        try {
            const turnData = {
                group_id: groupId,
                user_id: userId,
                payout_amount: payoutAmount,
                completed_at: new Date().toISOString()
            };

            const response = await this.apiProxy.makeRequest('/turns/complete', {
                method: 'POST',
                body: JSON.stringify(turnData)
            });

            if (response.success) {
                // Update local rotation system
                if (this.tandaRotationSystem) {
                    this.tandaRotationSystem.recordPayoutCompletion(groupId, userId, payoutAmount);
                }

                // Update lottery status
                const currentLottery = this.activeLotteries.get(groupId);
                if (currentLottery) {
                    currentLottery.completed_turns = (currentLottery.completed_turns || 0) + 1;
                    currentLottery.remaining_turns = currentLottery.total_members - currentLottery.completed_turns;
                    currentLottery.progress_percentage = (currentLottery.completed_turns / currentLottery.total_members) * 100;
                    currentLottery.is_complete = currentLottery.completed_turns >= currentLottery.total_members;
                }

                console.log(`✅ Turn completed: ${userId} received ${payoutAmount}`);
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Turn completion failed');
            }

        } catch (error) {
            console.error('Error completing turn:', error);
            throw error;
        }
    }

    /**
     * Get member's turn information
     */
    async getMemberTurnInfo(groupId, userId) {
        try {
            const response = await this.apiProxy.makeRequest(`/turns/member-info?group_id=${groupId}&user_id=${userId}`, {
                method: 'GET'
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Failed to get member info');
            }

        } catch (error) {
            console.error('Error getting member turn info:', error);
            throw error;
        }
    }

    /**
     * Get next member to receive payout
     */
    getNextPayoutRecipient(groupId) {
        const lottery = this.activeLotteries.get(groupId);
        if (!lottery || !lottery.results) {
            return null;
        }

        const completedTurns = lottery.completed_turns || 0;
        if (completedTurns >= lottery.total_participants) {
            return null; // All turns completed
        }

        const nextResult = lottery.results[completedTurns];
        return {
            user_id: nextResult.user_id,
            turn_number: nextResult.turn_position,
            lottery_number: nextResult.lottery_number,
            total_turns: lottery.total_participants,
            is_last_turn: completedTurns + 1 === lottery.total_participants
        };
    }

    /**
     * Generate comprehensive lottery report
     */
    generateLotteryReport(groupId) {
        const lottery = this.activeLotteries.get(groupId);
        const history = this.lotteryHistory.get(groupId) || [];
        
        if (!lottery) {
            throw new Error(`No lottery found for group ${groupId}`);
        }

        return {
            group_id: groupId,
            generated_at: new Date().toISOString(),
            lottery_summary: {
                lottery_id: lottery.lottery_id,
                conducted_at: lottery.conducted_at,
                method: lottery.lottery_method,
                total_participants: lottery.total_participants,
                fairness_score: lottery.fairness_score || 0
            },
            progress: {
                completed_turns: lottery.completed_turns || 0,
                remaining_turns: lottery.remaining_turns || lottery.total_participants,
                progress_percentage: lottery.progress_percentage || 0,
                is_complete: lottery.is_complete || false
            },
            turn_order: lottery.results?.map((result, index) => ({
                position: result.turn_position,
                user_id: result.user_id,
                lottery_number: result.lottery_number,
                status: index < (lottery.completed_turns || 0) ? 'completed' : 'pending',
                drawn_at: result.drawn_at
            })) || [],
            next_recipient: this.getNextPayoutRecipient(groupId),
            validation: lottery.validation || null,
            history: {
                total_lotteries: history.length,
                relotteries: history.filter(h => h.type === 'reconduct').length,
                last_activity: history[history.length - 1]?.stored_at || lottery.conducted_at
            },
            statistics: {
                average_lottery_number: lottery.results ? 
                    lottery.results.reduce((sum, r) => sum + r.lottery_number, 0) / lottery.results.length : 0,
                number_distribution: this.analyzeLotteryDistribution(lottery.results || []),
                fairness_analysis: lottery.validation?.statistical_analysis || null
            }
        };
    }

    /**
     * Convert API response format to rotation system format
     */
    convertApiToRotationFormat(apiData) {
        return {
            groupId: apiData.group_id,
            members: apiData.results.map(r => r.user_id),
            totalMembers: apiData.total_participants,
            rotationType: 'lottery',
            currentCycle: 0,
            isComplete: false,
            createdAt: apiData.conducted_at,
            turnOrder: apiData.results.map(r => ({
                userId: r.user_id,
                lotteryNumber: r.lottery_number,
                drawnAt: r.drawn_at
            })),
            remainingMembers: apiData.results.map(r => r.user_id),
            completedTurns: []
        };
    }

    /**
     * Update member turns in rotation system
     */
    updateMemberTurns(groupId, results) {
        if (!this.tandaRotationSystem) return;

        const memberTurns = new Map();
        results.forEach((result, index) => {
            memberTurns.set(result.user_id, {
                turnNumber: result.turn_position,
                position: index,
                status: 'pending',
                assignedAt: result.drawn_at,
                expectedPayoutDate: this.calculateExpectedPayoutDate(index, 'weekly'),
                lotteryNumber: result.lottery_number
            });
        });

        this.tandaRotationSystem.memberTurns.set(groupId, memberTurns);
    }

    /**
     * Update lottery with new results (for re-lottery)
     */
    updateLotteryWithNewResults(groupId, newResults, completedTurns) {
        const lottery = this.activeLotteries.get(groupId);
        if (!lottery) return;

        // Update results array with new lottery numbers for remaining members
        newResults.forEach((newResult, index) => {
            const originalIndex = completedTurns + index;
            if (lottery.results[originalIndex]) {
                lottery.results[originalIndex].lottery_number = newResult.lottery_number;
                lottery.results[originalIndex].drawn_at = newResult.drawn_at;
                lottery.results[originalIndex].is_redrawn = true;
            }
        });

        // Re-sort remaining results
        const completedResults = lottery.results.slice(0, completedTurns);
        const remainingResults = lottery.results.slice(completedTurns);
        remainingResults.sort((a, b) => a.lottery_number - b.lottery_number);
        
        // Reassign turn positions
        remainingResults.forEach((result, index) => {
            result.turn_position = completedTurns + index + 1;
        });

        lottery.results = [...completedResults, ...remainingResults];
    }

    /**
     * Calculate expected payout date
     */
    calculateExpectedPayoutDate(turnPosition, frequency) {
        const now = new Date();
        let weeksToAdd = 0;

        switch (frequency) {
            case 'weekly': weeksToAdd = turnPosition; break;
            case 'biweekly': weeksToAdd = turnPosition * 2; break;
            case 'monthly': weeksToAdd = turnPosition * 4; break;
            default: weeksToAdd = turnPosition;
        }

        const payoutDate = new Date(now);
        payoutDate.setDate(payoutDate.getDate() + (weeksToAdd * 7));
        
        return payoutDate.toISOString().split('T')[0];
    }

    /**
     * Analyze lottery number distribution
     */
    analyzeLotteryDistribution(results) {
        if (!results || results.length === 0) {
            return { status: 'no_data', quality: 'unknown' };
        }

        const numbers = results.map(r => r.lottery_number);
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        const stdDev = Math.sqrt(variance);

        return {
            mean: mean.toFixed(2),
            variance: variance.toFixed(2),
            standard_deviation: stdDev.toFixed(2),
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            range: Math.max(...numbers) - Math.min(...numbers),
            quality: stdDev > 200 ? 'good' : stdDev > 100 ? 'acceptable' : 'low'
        };
    }

    /**
     * Check if group has active lottery
     */
    hasActiveLottery(groupId) {
        return this.activeLotteries.has(groupId);
    }

    /**
     * Get lottery history for group
     */
    getLotteryHistory(groupId) {
        return this.lotteryHistory.get(groupId) || [];
    }

    /**
     * Clear lottery data for group
     */
    clearGroupLottery(groupId) {
        this.activeLotteries.delete(groupId);
        this.lotteryHistory.delete(groupId);
        console.log(`🧹 Lottery data cleared for group ${groupId}`);
    }
}

// Global instance
window.lotterySystemManager = new LotterySystemManager();

console.log('🎲 Lottery System Manager loaded and ready');