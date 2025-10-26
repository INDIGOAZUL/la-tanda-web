/**
 * 🔄 LA TANDA PAYOUT ROTATION & DISTRIBUTION SYSTEM
 * Complete payout rotation management API endpoints
 */

const { body, param, query } = require('express-validator');

// ====================================
// 🔄 PAYOUT ROTATION MANAGEMENT ENDPOINTS
// ====================================

// Initialize payout rotation for a group
app.post('/api/groups/:groupId/rotation/initialize', authenticateToken, [
    param('groupId').isUUID().withMessage('Valid group ID required'),
    body('rotation_type').optional().isIn(['sequential', 'random', 'volunteer', 'lottery', 'priority_based']).withMessage('Valid rotation type required')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { rotation_type = 'sequential' } = req.body;

        // Verify user is group admin or system admin
        const adminCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND role = 'admin'
            UNION
            SELECT 'administrator' as role WHERE $3 = 'administrator'
        `, [groupId, req.user.id, req.user.role]);

        if (adminCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: { message: 'Only group admins can initialize rotation', code: 403 }
            });
        }

        // Initialize rotation
        const result = await db.query(`
            SELECT initialize_payout_rotation($1, $2) as result
        `, [groupId, rotation_type]);

        const rotationResult = result.rows[0].result;

        if (rotationResult.success) {
            logger.info('Payout rotation initialized', {
                group_id: groupId,
                rotation_type,
                total_members: rotationResult.total_members,
                cycles_created: rotationResult.cycles_created,
                initialized_by: req.user.id
            });

            res.status(201).json({
                success: true,
                data: rotationResult,
                message: 'Payout rotation initialized successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: { message: rotationResult.error, code: 400 }
            });
        }

    } catch (error) {
        logger.error('Initialize rotation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to initialize rotation', code: 500 }
        });
    }
});

// Get rotation status for a group
app.get('/api/groups/:groupId/rotation/status', authenticateToken, [
    param('groupId').isUUID().withMessage('Valid group ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;

        // Verify user has access to this group
        const memberCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND member_status = 'active'
        `, [groupId, req.user.id]);

        if (memberCheck.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to group', code: 403 }
            });
        }

        // Get rotation status
        const result = await db.query(`
            SELECT get_rotation_status($1) as status
        `, [groupId]);

        const rotationStatus = result.rows[0].status;

        res.json({
            success: true,
            data: {
                rotation_status: rotationStatus,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Get rotation status error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get rotation status', code: 500 }
        });
    }
});

// Get detailed rotation schedule for a group
app.get('/api/groups/:groupId/rotation/schedule', authenticateToken, [
    param('groupId').isUUID().withMessage('Valid group ID required'),
    query('include_completed').optional().isBoolean().withMessage('Include completed must be boolean')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { include_completed = false } = req.query;

        // Verify user has access to this group
        const memberCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND member_status = 'active'
        `, [groupId, req.user.id]);

        if (memberCheck.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to group', code: 403 }
            });
        }

        // Build query with optional completed filter
        let query = `
            SELECT 
                pr.id,
                pr.cycle_number,
                pr.rotation_position,
                pr.member_id,
                u.name as member_name,
                u.email as member_email,
                pr.scheduled_payout_date,
                pr.actual_payout_date,
                pr.payout_amount,
                pr.collected_amount,
                pr.required_amount,
                pr.collection_progress,
                pr.payout_status,
                pr.payout_method,
                pr.member_confirmed,
                pr.member_confirmed_at,
                pr.created_at
            FROM payout_rotation pr
            JOIN users u ON pr.member_id = u.id
            WHERE pr.group_id = $1
        `;

        const params = [groupId];

        if (!include_completed) {
            query += ` AND pr.payout_status != 'completed'`;
        }

        query += ` ORDER BY pr.rotation_position ASC, pr.cycle_number ASC`;

        const result = await db.query(query, params);

        // Get group rotation settings
        const groupSettings = await db.query(`
            SELECT 
                rotation_type,
                auto_payout_enabled,
                payout_threshold_percentage,
                allow_early_payout,
                payout_grace_period_days,
                next_payout_cycle,
                next_payout_member
            FROM groups 
            WHERE id = $1
        `, [groupId]);

        res.json({
            success: true,
            data: {
                rotation_schedule: result.rows,
                group_settings: groupSettings.rows[0] || {},
                total_cycles: result.rows.length,
                include_completed
            }
        });

    } catch (error) {
        logger.error('Get rotation schedule error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get rotation schedule', code: 500 }
        });
    }
});

// Check payout readiness for a specific cycle
app.get('/api/groups/:groupId/rotation/cycle/:cycleNumber/readiness', authenticateToken, [
    param('groupId').isUUID().withMessage('Valid group ID required'),
    param('cycleNumber').isInt({ min: 1 }).withMessage('Valid cycle number required')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId, cycleNumber } = req.params;

        // Verify user has access to this group
        const memberCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND member_status = 'active'
        `, [groupId, req.user.id]);

        if (memberCheck.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to group', code: 403 }
            });
        }

        // Check payout readiness
        const result = await db.query(`
            SELECT check_payout_readiness($1, $2) as readiness
        `, [groupId, parseInt(cycleNumber)]);

        const readinessResult = result.rows[0].readiness;

        res.json({
            success: true,
            data: readinessResult
        });

    } catch (error) {
        logger.error('Check payout readiness error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to check payout readiness', code: 500 }
        });
    }
});

// ====================================
// 💰 PAYOUT DISTRIBUTION ENDPOINTS
// ====================================

// Process payout distribution for a cycle
app.post('/api/groups/:groupId/rotation/cycle/:cycleNumber/distribute', authenticateToken, requireRole(['administrator', 'group_admin']), [
    param('groupId').isUUID().withMessage('Valid group ID required'),
    param('cycleNumber').isInt({ min: 1 }).withMessage('Valid cycle number required'),
    body('override_threshold').optional().isBoolean().withMessage('Override threshold must be boolean'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be under 500 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId, cycleNumber } = req.params;
        const { override_threshold = false, notes } = req.body;

        // Verify user is group admin (if not system admin)
        if (req.user.role !== 'administrator') {
            const adminCheck = await db.query(`
                SELECT role FROM group_members 
                WHERE group_id = $1 AND user_id = $2 AND role = 'admin'
            `, [groupId, req.user.id]);

            if (adminCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Only group admins can process payouts', code: 403 }
                });
            }
        }

        // Process payout distribution
        const result = await db.query(`
            SELECT process_payout_distribution($1, $2, $3, $4) as result
        `, [groupId, parseInt(cycleNumber), req.user.id, override_threshold]);

        const distributionResult = result.rows[0].result;

        if (distributionResult.success) {
            // Add notes if provided
            if (notes) {
                await db.query(`
                    UPDATE payout_distribution_history 
                    SET notes = $1 
                    WHERE id = $2
                `, [notes, distributionResult.distribution_id]);
            }

            logger.info('Payout distribution processed', {
                group_id: groupId,
                cycle_number: cycleNumber,
                member_id: distributionResult.member_id,
                payout_amount: distributionResult.payout_amount,
                distribution_id: distributionResult.distribution_id,
                processed_by: req.user.id,
                override_used: override_threshold
            });

            res.json({
                success: true,
                data: distributionResult,
                message: 'Payout distribution processed successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: { message: distributionResult.error, code: 400 }
            });
        }

    } catch (error) {
        logger.error('Process payout distribution error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to process payout distribution', code: 500 }
        });
    }
});

// Get payout distribution history for a group
app.get('/api/groups/:groupId/rotation/distributions', authenticateToken, [
    param('groupId').isUUID().withMessage('Valid group ID required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']).withMessage('Valid status required')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { limit = 20, status } = req.query;

        // Verify user has access to this group
        const memberCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND member_status = 'active'
        `, [groupId, req.user.id]);

        if (memberCheck.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to group', code: 403 }
            });
        }

        // Build query with optional status filter
        let query = `
            SELECT 
                pdh.id,
                pdh.distribution_type,
                pdh.amount_distributed,
                pdh.fee_amount,
                pdh.net_amount,
                pdh.status,
                pdh.failure_reason,
                pdh.retry_count,
                pdh.initiated_at,
                pdh.completed_at,
                pdh.authorization_level,
                pdh.notes,
                pr.cycle_number,
                pr.rotation_position,
                u.name as member_name,
                u.email as member_email,
                auth_user.name as authorized_by_name
            FROM payout_distribution_history pdh
            JOIN payout_rotation pr ON pdh.payout_rotation_id = pr.id
            JOIN users u ON pr.member_id = u.id
            LEFT JOIN users auth_user ON pdh.authorized_by = auth_user.id
            WHERE pr.group_id = $1
        `;

        const params = [groupId];

        if (status) {
            query += ` AND pdh.status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY pdh.initiated_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: {
                distributions: result.rows,
                count: result.rows.length,
                filters: { status }
            }
        });

    } catch (error) {
        logger.error('Get payout distributions error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get payout distributions', code: 500 }
        });
    }
});

// Confirm payout receipt by member
app.post('/api/groups/:groupId/rotation/cycle/:cycleNumber/confirm', authenticateToken, [
    param('groupId').isUUID().withMessage('Valid group ID required'),
    param('cycleNumber').isInt({ min: 1 }).withMessage('Valid cycle number required'),
    body('confirmation_notes').optional().isLength({ max: 500 }).withMessage('Notes must be under 500 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId, cycleNumber } = req.params;
        const { confirmation_notes } = req.body;

        // Verify this is the member who should receive this payout
        const rotationCheck = await db.query(`
            SELECT id, member_id, payout_status, payout_amount, member_confirmed
            FROM payout_rotation 
            WHERE group_id = $1 AND cycle_number = $2 AND member_id = $3
        `, [groupId, parseInt(cycleNumber), req.user.id]);

        if (rotationCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: { message: 'You are not the recipient for this payout cycle', code: 403 }
            });
        }

        const rotation = rotationCheck.rows[0];

        if (rotation.payout_status !== 'completed') {
            return res.status(400).json({
                success: false,
                error: { message: 'Payout has not been completed yet', code: 400 }
            });
        }

        if (rotation.member_confirmed) {
            return res.status(400).json({
                success: false,
                error: { message: 'Payout already confirmed', code: 400 }
            });
        }

        // Update confirmation
        await db.query(`
            UPDATE payout_rotation 
            SET member_confirmed = TRUE,
                member_confirmed_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
        `, [rotation.id]);

        // Add confirmation notes to distribution history if provided
        if (confirmation_notes) {
            await db.query(`
                UPDATE payout_distribution_history 
                SET metadata = metadata || jsonb_build_object('member_confirmation_notes', $1)
                WHERE payout_rotation_id = $2
            `, [confirmation_notes, rotation.id]);
        }

        logger.info('Payout receipt confirmed', {
            group_id: groupId,
            cycle_number: cycleNumber,
            member_id: req.user.id,
            payout_amount: rotation.payout_amount,
            confirmed_at: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                cycle_number: parseInt(cycleNumber),
                payout_amount: rotation.payout_amount,
                confirmed_at: new Date().toISOString()
            },
            message: 'Payout receipt confirmed successfully'
        });

    } catch (error) {
        logger.error('Confirm payout receipt error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to confirm payout receipt', code: 500 }
        });
    }
});

// Get user's payout history across all groups
app.get('/api/users/payouts', authenticateToken, [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['scheduled', 'ready', 'processing', 'completed', 'failed']).withMessage('Valid status required')
], handleValidationErrors, async (req, res) => {
    try {
        const { limit = 20, status } = req.query;

        // Build query with optional status filter
        let query = `
            SELECT 
                pr.id,
                pr.group_id,
                g.name as group_name,
                pr.cycle_number,
                pr.rotation_position,
                pr.scheduled_payout_date,
                pr.actual_payout_date,
                pr.payout_amount,
                pr.collected_amount,
                pr.collection_progress,
                pr.payout_status,
                pr.member_confirmed,
                pr.member_confirmed_at,
                pdh.amount_distributed,
                pdh.net_amount as actual_amount_received
            FROM payout_rotation pr
            JOIN groups g ON pr.group_id = g.id
            LEFT JOIN payout_distribution_history pdh ON pr.id = pdh.payout_rotation_id 
                AND pdh.status = 'completed'
            WHERE pr.member_id = $1
        `;

        const params = [req.user.id];

        if (status) {
            query += ` AND pr.payout_status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY pr.scheduled_payout_date DESC, pr.cycle_number DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);

        // Get summary statistics
        const statsResult = await db.query(`
            SELECT 
                COUNT(*) as total_payouts,
                COUNT(*) FILTER (WHERE payout_status = 'completed') as completed_payouts,
                COUNT(*) FILTER (WHERE payout_status = 'scheduled') as scheduled_payouts,
                COALESCE(SUM(CASE WHEN payout_status = 'completed' THEN payout_amount ELSE 0 END), 0) as total_received,
                COALESCE(AVG(CASE WHEN payout_status = 'completed' THEN payout_amount ELSE NULL END), 0) as average_payout
            FROM payout_rotation 
            WHERE member_id = $1
        `, [req.user.id]);

        res.json({
            success: true,
            data: {
                payouts: result.rows,
                count: result.rows.length,
                statistics: statsResult.rows[0],
                filters: { status }
            }
        });

    } catch (error) {
        logger.error('Get user payouts error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get user payouts', code: 500 }
        });
    }
});

module.exports = {
    // Export any utility functions if needed
};