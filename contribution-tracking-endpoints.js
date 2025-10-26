/**
 * 💰 LA TANDA CONTRIBUTION TRACKING & PAYMENT SYSTEM
 * Complete contribution tracking and payment processing API endpoints
 */

// ====================================
// 💰 CONTRIBUTION TRACKING ENDPOINTS
// ====================================

// Get contribution summary for a group
app.get('/api/groups/:groupId/contributions/summary', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { cycle_number } = req.query;

        // Verify user has access to this group
        const memberCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND status = 'active'
        `, [groupId, req.user.id]);

        if (memberCheck.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to group', code: 403 }
            });
        }

        // Get contribution summary
        const summaryResult = await db.query(`
            SELECT get_group_contribution_summary($1, $2) as summary
        `, [groupId, cycle_number || null]);

        const summary = summaryResult.rows[0].summary;

        // Get recent contributions
        const recentResult = await db.query(`
            SELECT 
                c.id,
                c.user_id,
                u.name as user_name,
                c.amount,
                c.late_fee_applied,
                c.status,
                c.due_date,
                c.paid_date,
                c.cycle_number,
                c.is_late,
                pm.method_type as payment_method
            FROM contributions c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN user_payment_methods pm ON c.payment_method_id = pm.id
            WHERE c.group_id = $1 
            ${cycle_number ? 'AND c.cycle_number = $3' : ''}
            ORDER BY c.due_date DESC, c.created_at DESC
            LIMIT 50
        `, cycle_number ? [groupId, cycle_number] : [groupId]);

        res.json({
            success: true,
            data: {
                summary,
                recent_contributions: recentResult.rows,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Get contribution summary error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get contribution summary', code: 500 }
        });
    }
});

// Create payment schedule for a group cycle
app.post('/api/groups/:groupId/payment-schedules', authenticateToken, [
    body('cycle_number').isInt({ min: 1 }).withMessage('Valid cycle number required'),
    body('due_date').isISO8601().withMessage('Valid due date required'),
    body('contribution_amount').optional().isFloat({ min: 0.01 }).withMessage('Valid contribution amount required')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { cycle_number, due_date, contribution_amount } = req.body;

        // Verify user is group admin
        const adminCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND role = 'admin'
        `, [groupId, req.user.id]);

        if (adminCheck.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Only group admins can create payment schedules', code: 403 }
            });
        }

        // Create payment schedule
        const scheduleResult = await db.query(`
            SELECT create_payment_schedule($1, $2, $3, $4) as schedule_id
        `, [groupId, cycle_number, due_date, contribution_amount || null]);

        const scheduleId = scheduleResult.rows[0].schedule_id;

        // Get created schedule details
        const scheduleDetails = await db.query(`
            SELECT ps.*, 
                   COUNT(c.id) as member_count,
                   g.name as group_name
            FROM payment_schedules ps
            JOIN groups g ON ps.group_id = g.id
            LEFT JOIN contributions c ON ps.id = c.payment_schedule_id
            WHERE ps.id = $1
            GROUP BY ps.id, g.name
        `, [scheduleId]);

        logger.info('Payment schedule created', {
            schedule_id: scheduleId,
            group_id: groupId,
            cycle_number,
            created_by: req.user.id
        });

        res.status(201).json({
            success: true,
            data: {
                schedule: scheduleDetails.rows[0],
                schedule_id: scheduleId
            },
            message: 'Payment schedule created successfully'
        });

    } catch (error) {
        logger.error('Create payment schedule error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to create payment schedule', code: 500 }
        });
    }
});

// Get payment schedules for a group
app.get('/api/groups/:groupId/payment-schedules', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { status, limit = 20 } = req.query;

        // Verify user has access to this group
        const memberCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND status = 'active'
        `, [groupId, req.user.id]);

        if (memberCheck.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to group', code: 403 }
            });
        }

        // Build query with optional status filter
        let query = `
            SELECT ps.*,
                   COUNT(c.id) as total_contributions,
                   COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_contributions,
                   COUNT(CASE WHEN c.is_late = TRUE THEN 1 END) as late_contributions
            FROM payment_schedules ps
            LEFT JOIN contributions c ON ps.id = c.payment_schedule_id
            WHERE ps.group_id = $1
        `;
        
        const params = [groupId];
        
        if (status) {
            query += ` AND ps.status = $${params.length + 1}`;
            params.push(status);
        }
        
        query += `
            GROUP BY ps.id
            ORDER BY ps.cycle_number DESC, ps.due_date DESC
            LIMIT $${params.length + 1}
        `;
        params.push(limit);

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: {
                schedules: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        logger.error('Get payment schedules error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get payment schedules', code: 500 }
        });
    }
});

// ====================================
// 💳 PAYMENT METHOD MANAGEMENT ENDPOINTS
// ====================================

// Get user's payment methods
app.get('/api/users/payment-methods', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(`
            SELECT 
                id,
                method_type,
                provider,
                account_name,
                LEFT(account_number, 4) || '****' as masked_account_number,
                is_verified,
                is_default,
                is_active,
                daily_limit,
                monthly_limit,
                last_used_at,
                created_at
            FROM user_payment_methods
            WHERE user_id = $1 AND is_active = true
            ORDER BY is_default DESC, priority_order ASC
        `, [userId]);

        res.json({
            success: true,
            data: {
                payment_methods: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        logger.error('Get payment methods error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get payment methods', code: 500 }
        });
    }
});

// Add new payment method
app.post('/api/users/payment-methods', authenticateToken, [
    body('method_type').isIn(['bank_account', 'credit_card', 'debit_card', 'mobile_money', 'crypto_wallet', 'cash']).withMessage('Valid payment method type required'),
    body('provider').isLength({ min: 2, max: 100 }).withMessage('Provider name required'),
    body('account_name').isLength({ min: 2, max: 255 }).withMessage('Account name required'),
    body('account_number').isLength({ min: 4, max: 100 }).withMessage('Account number required')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { method_type, provider, account_name, account_number, is_default } = req.body;

        // If setting as default, unset other defaults
        if (is_default) {
            await db.query(`
                UPDATE user_payment_methods 
                SET is_default = FALSE 
                WHERE user_id = $1
            `, [userId]);
        }

        // Insert new payment method (account_number should be encrypted in production)
        const result = await db.query(`
            INSERT INTO user_payment_methods (
                user_id, method_type, provider, account_name, 
                account_number, is_default, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, true)
            RETURNING id, method_type, provider, account_name, is_default
        `, [userId, method_type, provider, account_name, account_number, is_default || false]);

        logger.info('Payment method added', {
            user_id: userId,
            method_type,
            provider,
            payment_method_id: result.rows[0].id
        });

        res.status(201).json({
            success: true,
            data: {
                payment_method: result.rows[0]
            },
            message: 'Payment method added successfully'
        });

    } catch (error) {
        logger.error('Add payment method error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to add payment method', code: 500 }
        });
    }
});

// ====================================
// 💸 PAYMENT PROCESSING ENDPOINTS
// ====================================

// Process contribution payment
app.post('/api/contributions/:contributionId/process-payment', authenticateToken, [
    body('payment_method_id').optional().isUUID().withMessage('Valid payment method ID required'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('processor').optional().isLength({ min: 2, max: 100 }).withMessage('Valid processor name required')
], handleValidationErrors, async (req, res) => {
    try {
        const { contributionId } = req.params;
        const { payment_method_id, amount, processor = 'manual' } = req.body;

        // Verify contribution belongs to user or user is admin
        const contributionCheck = await db.query(`
            SELECT c.*, g.name as group_name
            FROM contributions c
            JOIN groups g ON c.group_id = g.id
            WHERE c.id = $1 AND (c.user_id = $2 OR $3 = 'administrator')
        `, [contributionId, req.user.id, req.user.role]);

        if (contributionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to contribution', code: 403 }
            });
        }

        const contribution = contributionCheck.rows[0];

        if (contribution.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: { message: 'Contribution already paid', code: 400 }
            });
        }

        // Process payment
        const paymentResult = await db.query(`
            SELECT process_contribution_payment($1, $2, $3, $4) as result
        `, [contributionId, payment_method_id, amount, processor]);

        const result = paymentResult.rows[0].result;

        if (result.success) {
            logger.info('Contribution payment processed', {
                contribution_id: contributionId,
                user_id: req.user.id,
                amount: result.amount_paid,
                processor
            });

            res.json({
                success: true,
                data: result,
                message: 'Payment processed successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: { message: result.error, code: 400 }
            });
        }

    } catch (error) {
        logger.error('Process payment error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to process payment', code: 500 }
        });
    }
});

// Get contribution details with payment history
app.get('/api/contributions/:contributionId/details', authenticateToken, async (req, res) => {
    try {
        const { contributionId } = req.params;

        // Get contribution details
        const contributionResult = await db.query(`
            SELECT 
                c.*,
                u.name as user_name,
                u.email as user_email,
                g.name as group_name,
                pm.method_type as payment_method,
                pm.provider as payment_provider,
                ps.due_date as schedule_due_date,
                ps.grace_period_days,
                ps.late_fee_amount,
                ps.late_fee_percentage
            FROM contributions c
            JOIN users u ON c.user_id = u.id
            JOIN groups g ON c.group_id = g.id
            LEFT JOIN user_payment_methods pm ON c.payment_method_id = pm.id
            LEFT JOIN payment_schedules ps ON c.payment_schedule_id = ps.id
            WHERE c.id = $1
        `, [contributionId]);

        if (contributionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Contribution not found', code: 404 }
            });
        }

        const contribution = contributionResult.rows[0];

        // Verify access
        if (contribution.user_id !== req.user.id && req.user.role !== 'administrator') {
            // Check if user is group admin
            const adminCheck = await db.query(`
                SELECT role FROM group_members 
                WHERE group_id = $1 AND user_id = $2 AND role = 'admin'
            `, [contribution.group_id, req.user.id]);

            if (adminCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Access denied to contribution', code: 403 }
                });
            }
        }

        // Get payment attempts
        const attemptsResult = await db.query(`
            SELECT 
                id,
                attempt_number,
                amount,
                status,
                failure_reason,
                attempted_at,
                completed_at,
                processor
            FROM payment_attempts
            WHERE contribution_id = $1
            ORDER BY attempted_at DESC
        `, [contributionId]);

        // Get status history
        const historyResult = await db.query(`
            SELECT 
                from_status,
                to_status,
                reason,
                change_type,
                changed_at
            FROM contribution_status_history
            WHERE contribution_id = $1
            ORDER BY changed_at DESC
        `, [contributionId]);

        // Get late payment info if applicable
        let latePaymentInfo = null;
        if (contribution.is_late) {
            const lateResult = await db.query(`
                SELECT * FROM late_payment_tracking
                WHERE contribution_id = $1
            `, [contributionId]);
            
            if (lateResult.rows.length > 0) {
                latePaymentInfo = lateResult.rows[0];
            }
        }

        res.json({
            success: true,
            data: {
                contribution,
                payment_attempts: attemptsResult.rows,
                status_history: historyResult.rows,
                late_payment_info: latePaymentInfo
            }
        });

    } catch (error) {
        logger.error('Get contribution details error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get contribution details', code: 500 }
        });
    }
});

// Calculate and apply late fees
app.post('/api/contributions/:contributionId/calculate-late-fees', authenticateToken, requireRole(['administrator', 'group_admin']), async (req, res) => {
    try {
        const { contributionId } = req.params;

        // Calculate late fees
        const result = await db.query(`
            SELECT calculate_late_fees($1) as late_fee
        `, [contributionId]);

        const lateFee = result.rows[0].late_fee;

        logger.info('Late fees calculated', {
            contribution_id: contributionId,
            late_fee: lateFee,
            calculated_by: req.user.id
        });

        res.json({
            success: true,
            data: {
                contribution_id: contributionId,
                late_fee_applied: lateFee
            },
            message: lateFee > 0 ? 'Late fees applied' : 'No late fees applicable'
        });

    } catch (error) {
        logger.error('Calculate late fees error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to calculate late fees', code: 500 }
        });
    }
});

// Get overdue contributions (admin only)
app.get('/api/contributions/overdue', authenticateToken, requireRole(['administrator']), async (req, res) => {
    try {
        const { days_overdue = 1, limit = 50 } = req.query;

        const result = await db.query(`
            SELECT 
                c.id,
                c.user_id,
                u.name as user_name,
                u.email as user_email,
                c.group_id,
                g.name as group_name,
                c.amount,
                c.late_fee_applied,
                c.due_date,
                c.cycle_number,
                c.status,
                EXTRACT(DAYS FROM NOW() - c.due_date) as days_overdue,
                lpt.total_penalty,
                lpt.collection_status
            FROM contributions c
            JOIN users u ON c.user_id = u.id
            JOIN groups g ON c.group_id = g.id
            LEFT JOIN late_payment_tracking lpt ON c.id = lpt.contribution_id
            WHERE c.status != 'completed' 
            AND c.due_date < NOW() - INTERVAL '${days_overdue} days'
            ORDER BY c.due_date ASC
            LIMIT $1
        `, [limit]);

        res.json({
            success: true,
            data: {
                overdue_contributions: result.rows,
                count: result.rows.length,
                filter: { days_overdue }
            }
        });

    } catch (error) {
        logger.error('Get overdue contributions error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get overdue contributions', code: 500 }
        });
    }
});

module.exports = {
    // Export any utility functions if needed
};