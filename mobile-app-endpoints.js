/**
 * 📱 LA TANDA MOBILE APP API ENDPOINTS
 * Complete mobile app support with offline sync, push notifications, and analytics
 */

const { body, param, query } = require('express-validator');

// ====================================
// 📱 MOBILE DEVICE MANAGEMENT ENDPOINTS
// ====================================

// Register mobile device
app.post('/api/mobile/devices/register', authenticateToken, [
    body('device_token').isLength({ min: 1 }).withMessage('Device token required'),
    body('device_type').isIn(['ios', 'android', 'web', 'tablet']).withMessage('Valid device type required'),
    body('device_id').isLength({ min: 1 }).withMessage('Device ID required'),
    body('device_name').optional().isLength({ max: 100 }).withMessage('Device name too long'),
    body('push_token').optional().isLength({ min: 1 }).withMessage('Valid push token required'),
    body('app_version').optional().isLength({ max: 20 }).withMessage('App version too long')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            device_token, device_type, device_id, device_name,
            push_token, app_version, device_metadata = {}
        } = req.body;

        // Register device using stored function
        const result = await db.query(`
            SELECT register_mobile_device($1, $2, $3, $4, $5, $6, $7, $8) as device_id
        `, [
            req.user.id, device_token, device_type, device_id,
            device_name, push_token, app_version, JSON.stringify(device_metadata)
        ]);

        const deviceId = result.rows[0].device_id;

        // Get device details
        const deviceDetails = await db.query(`
            SELECT 
                id, device_token, device_type, device_name,
                app_version, is_active, last_sync_at,
                sync_version, pending_sync_count
            FROM mobile_devices 
            WHERE id = $1
        `, [deviceId]);

        logger.info('Mobile device registered', {
            device_id: deviceId,
            device_type,
            user_id: req.user.id,
            app_version
        });

        res.status(201).json({
            success: true,
            data: {
                device: deviceDetails.rows[0]
            },
            message: 'Mobile device registered successfully'
        });

    } catch (error) {
        logger.error('Register mobile device error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to register mobile device', code: 500 }
        });
    }
});

// Get user's mobile devices
app.get('/api/mobile/devices', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, device_token, device_type, device_name, device_model,
                app_version, push_enabled, is_active, last_activity_at,
                last_sync_at, sync_version, pending_sync_count,
                registered_at
            FROM mobile_devices 
            WHERE user_id = $1 
            ORDER BY last_activity_at DESC
        `, [req.user.id]);

        res.json({
            success: true,
            data: {
                devices: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        logger.error('Get mobile devices error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get mobile devices', code: 500 }
        });
    }
});

// Update device settings
app.put('/api/mobile/devices/:deviceId/settings', authenticateToken, [
    param('deviceId').isUUID().withMessage('Valid device ID required'),
    body('push_enabled').optional().isBoolean().withMessage('Push enabled must be boolean'),
    body('language_preference').optional().isLength({ min: 2, max: 10 }).withMessage('Valid language required'),
    body('theme_preference').optional().isIn(['light', 'dark', 'system']).withMessage('Valid theme required'),
    body('biometric_enabled').optional().isBoolean().withMessage('Biometric enabled must be boolean')
], handleValidationErrors, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const updateFields = req.body;

        // Verify device belongs to user
        const deviceCheck = await db.query(`
            SELECT id FROM mobile_devices 
            WHERE id = $1 AND user_id = $2
        `, [deviceId, req.user.id]);

        if (deviceCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Device not found', code: 404 }
            });
        }

        // Build dynamic update query
        const fields = Object.keys(updateFields);
        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'No fields to update', code: 400 }
            });
        }

        const values = Object.values(updateFields);
        const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');

        const updateQuery = `
            UPDATE mobile_devices 
            SET ${setClause}, updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;

        const result = await db.query(updateQuery, [deviceId, req.user.id, ...values]);

        res.json({
            success: true,
            data: {
                device: result.rows[0]
            },
            message: 'Device settings updated successfully'
        });

    } catch (error) {
        logger.error('Update device settings error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update device settings', code: 500 }
        });
    }
});

// ====================================
// 🔄 OFFLINE SYNC ENDPOINTS
// ====================================

// Get pending sync items
app.get('/api/mobile/sync/:deviceId/pending', authenticateToken, [
    param('deviceId').isUUID().withMessage('Valid device ID required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { limit = 50 } = req.query;

        // Verify device belongs to user
        const deviceCheck = await db.query(`
            SELECT id FROM mobile_devices 
            WHERE id = $1 AND user_id = $2
        `, [deviceId, req.user.id]);

        if (deviceCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Device not found', code: 404 }
            });
        }

        // Get pending sync items
        const result = await db.query(`
            SELECT 
                id, action_type, entity_type, entity_id,
                action_data, sequence_number, priority,
                created_at, scheduled_at
            FROM offline_sync_queue 
            WHERE device_id = $1 
            AND sync_status = 'pending'
            AND scheduled_at <= NOW()
            ORDER BY priority ASC, sequence_number ASC
            LIMIT $2
        `, [deviceId, limit]);

        res.json({
            success: true,
            data: {
                sync_items: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        logger.error('Get pending sync items error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get pending sync items', code: 500 }
        });
    }
});

// Queue offline action
app.post('/api/mobile/sync/:deviceId/queue', authenticateToken, [
    param('deviceId').isUUID().withMessage('Valid device ID required'),
    body('action_type').isIn(['create', 'update', 'delete', 'payment', 'join_group', 'leave_group', 'notification_read']).withMessage('Valid action type required'),
    body('entity_type').isIn(['contribution', 'group', 'user', 'notification', 'transaction']).withMessage('Valid entity type required'),
    body('entity_id').optional().isUUID().withMessage('Valid entity ID required'),
    body('action_data').isObject().withMessage('Action data must be object'),
    body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5')
], handleValidationErrors, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { action_type, entity_type, entity_id, action_data, priority = 3 } = req.body;

        // Verify device belongs to user
        const deviceCheck = await db.query(`
            SELECT id FROM mobile_devices 
            WHERE id = $1 AND user_id = $2
        `, [deviceId, req.user.id]);

        if (deviceCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Device not found', code: 404 }
            });
        }

        // Queue sync action
        const result = await db.query(`
            SELECT queue_offline_sync($1, $2, $3, $4, $5, $6, $7) as sync_id
        `, [req.user.id, deviceId, action_type, entity_type, entity_id, JSON.stringify(action_data), priority]);

        const syncId = result.rows[0].sync_id;

        logger.info('Offline action queued', {
            sync_id: syncId,
            action_type,
            entity_type,
            device_id: deviceId,
            user_id: req.user.id
        });

        res.status(201).json({
            success: true,
            data: {
                sync_id: syncId
            },
            message: 'Action queued for sync'
        });

    } catch (error) {
        logger.error('Queue offline action error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to queue offline action', code: 500 }
        });
    }
});

// Complete sync item
app.put('/api/mobile/sync/:deviceId/complete/:syncId', authenticateToken, [
    param('deviceId').isUUID().withMessage('Valid device ID required'),
    param('syncId').isUUID().withMessage('Valid sync ID required'),
    body('success').isBoolean().withMessage('Success status required'),
    body('error_message').optional().isLength({ max: 500 }).withMessage('Error message too long')
], handleValidationErrors, async (req, res) => {
    try {
        const { deviceId, syncId } = req.params;
        const { success, error_message } = req.body;

        // Verify sync item belongs to user's device
        const syncCheck = await db.query(`
            SELECT osq.id 
            FROM offline_sync_queue osq
            JOIN mobile_devices md ON osq.device_id = md.id
            WHERE osq.id = $1 AND md.id = $2 AND md.user_id = $3
        `, [syncId, deviceId, req.user.id]);

        if (syncCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Sync item not found', code: 404 }
            });
        }

        // Complete sync item
        await db.query(`
            SELECT complete_sync_item($1, $2, $3) as completed
        `, [syncId, success, error_message]);

        res.json({
            success: true,
            message: 'Sync item completed'
        });

    } catch (error) {
        logger.error('Complete sync item error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to complete sync item', code: 500 }
        });
    }
});

// ====================================
// 🔔 MOBILE PUSH NOTIFICATIONS ENDPOINTS
// ====================================

// Send push notification to user
app.post('/api/mobile/push/send', authenticateToken, requireRole(['administrator']), [
    body('user_id').isUUID().withMessage('Valid user ID required'),
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title required'),
    body('body').isLength({ min: 1, max: 200 }).withMessage('Body required'),
    body('action_type').optional().isLength({ min: 1 }).withMessage('Valid action type required'),
    body('action_data').optional().isObject().withMessage('Action data must be object'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'critical']).withMessage('Valid priority required')
], handleValidationErrors, async (req, res) => {
    try {
        const { user_id, title, body, action_type, action_data = {}, priority = 'normal' } = req.body;

        // Send push notification
        const result = await db.query(`
            SELECT send_mobile_push_notification($1, $2, $3, $4, $5, $6) as notification_id
        `, [user_id, title, body, action_type, JSON.stringify(action_data), priority]);

        const notificationId = result.rows[0].notification_id;

        if (!notificationId) {
            return res.status(400).json({
                success: false,
                error: { message: 'No active devices found for user', code: 400 }
            });
        }

        logger.info('Push notification sent', {
            notification_id: notificationId,
            user_id,
            title,
            sent_by: req.user.id
        });

        res.status(201).json({
            success: true,
            data: {
                notification_id: notificationId
            },
            message: 'Push notification sent successfully'
        });

    } catch (error) {
        logger.error('Send push notification error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to send push notification', code: 500 }
        });
    }
});

// Get push notification history
app.get('/api/mobile/push/history', authenticateToken, [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isLength({ min: 2 }).withMessage('Valid status required')
], handleValidationErrors, async (req, res) => {
    try {
        const { limit = 20, status } = req.query;

        let query = `
            SELECT 
                mpn.id, mpn.title, mpn.body, mpn.action_type,
                mpn.priority, mpn.delivery_status, mpn.scheduled_at,
                mpn.sent_at, mpn.delivered_at, mpn.is_opened,
                md.device_name, md.device_type
            FROM mobile_push_notifications mpn
            LEFT JOIN mobile_devices md ON mpn.device_id = md.id
            WHERE mpn.user_id = $1
        `;

        const params = [req.user.id];

        if (status) {
            query += ` AND mpn.delivery_status = $2`;
            params.push(status);
        }

        query += ` ORDER BY mpn.scheduled_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: {
                notifications: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        logger.error('Get push notification history error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get push notification history', code: 500 }
        });
    }
});

// Mark push notification as opened
app.put('/api/mobile/push/:notificationId/opened', authenticateToken, [
    param('notificationId').isUUID().withMessage('Valid notification ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { notificationId } = req.params;

        // Update notification as opened
        const result = await db.query(`
            UPDATE mobile_push_notifications 
            SET is_opened = TRUE, opened_at = NOW()
            WHERE id = $1 AND user_id = $2
        `, [notificationId, req.user.id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Notification not found', code: 404 }
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as opened'
        });

    } catch (error) {
        logger.error('Mark notification as opened error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to mark notification as opened', code: 500 }
        });
    }
});

// ====================================
// 📊 MOBILE ANALYTICS ENDPOINTS
// ====================================

// Track mobile event
app.post('/api/mobile/analytics/track', authenticateToken, [
    body('device_id').isUUID().withMessage('Valid device ID required'),
    body('session_id').isUUID().withMessage('Valid session ID required'),
    body('event_type').isLength({ min: 1 }).withMessage('Event type required'),
    body('event_category').isIn(['app_lifecycle', 'user_interaction', 'performance', 'error', 'business']).withMessage('Valid event category required'),
    body('event_name').isLength({ min: 1 }).withMessage('Event name required'),
    body('event_properties').optional().isObject().withMessage('Event properties must be object'),
    body('screen_name').optional().isLength({ max: 100 }).withMessage('Screen name too long')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            device_id, session_id, event_type, event_category, event_name,
            event_properties = {}, screen_name, app_version
        } = req.body;

        // Verify device belongs to user
        const deviceCheck = await db.query(`
            SELECT id FROM mobile_devices 
            WHERE id = $1 AND user_id = $2
        `, [device_id, req.user.id]);

        if (deviceCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Device not found', code: 404 }
            });
        }

        // Track event
        const result = await db.query(`
            SELECT track_mobile_event($1, $2, $3, $4, $5, $6, $7, $8, $9) as analytics_id
        `, [
            req.user.id, device_id, session_id, event_type, event_category,
            event_name, JSON.stringify(event_properties), screen_name, app_version
        ]);

        res.status(201).json({
            success: true,
            data: {
                analytics_id: result.rows[0].analytics_id
            },
            message: 'Event tracked successfully'
        });

    } catch (error) {
        logger.error('Track mobile event error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to track event', code: 500 }
        });
    }
});

// ====================================
// 📱 MOBILE-OPTIMIZED DATA ENDPOINTS
// ====================================

// Get mobile dashboard data
app.get('/api/mobile/dashboard', authenticateToken, async (req, res) => {
    try {
        // Get user's groups with minimal data for mobile
        const groupsResult = await db.query(`
            SELECT 
                g.id, g.name, g.contribution_amount, g.frequency,
                g.max_members, g.current_cycle, g.status,
                gm.role, gm.joined_at,
                COUNT(gm2.id) as member_count
            FROM groups g
            JOIN group_members gm ON g.id = gm.group_id
            LEFT JOIN group_members gm2 ON g.id = gm2.group_id
            WHERE gm.user_id = $1 AND gm.status = 'active'
            GROUP BY g.id, gm.role, gm.joined_at
            ORDER BY gm.joined_at DESC
            LIMIT 10
        `, [req.user.id]);

        // Get recent contributions
        const contributionsResult = await db.query(`
            SELECT 
                c.id, c.amount, c.status, c.due_date, c.paid_date,
                g.name as group_name
            FROM contributions c
            JOIN groups g ON c.group_id = g.id
            WHERE c.user_id = $1
            ORDER BY c.due_date DESC
            LIMIT 5
        `, [req.user.id]);

        // Get notifications count
        const notificationsResult = await db.query(`
            SELECT COUNT(*) as unread_count
            FROM notifications 
            WHERE user_id = $1 AND is_read = FALSE AND is_archived = FALSE
        `, [req.user.id]);

        // Get recent transactions
        const transactionsResult = await db.query(`
            SELECT 
                gt.id, gt.amount, gt.currency, gt.transaction_status,
                gt.initiated_at, pg.gateway_name
            FROM gateway_transactions gt
            JOIN payment_gateways pg ON gt.gateway_id = pg.id
            JOIN contributions c ON gt.contribution_id = c.id
            WHERE c.user_id = $1
            ORDER BY gt.initiated_at DESC
            LIMIT 3
        `, [req.user.id]);

        res.json({
            success: true,
            data: {
                user_summary: {
                    id: req.user.id,
                    name: req.user.name,
                    email: req.user.email,
                    unread_notifications: parseInt(notificationsResult.rows[0].unread_count)
                },
                groups: groupsResult.rows,
                recent_contributions: contributionsResult.rows,
                recent_transactions: transactionsResult.rows,
                stats: {
                    total_groups: groupsResult.rows.length,
                    pending_contributions: contributionsResult.rows.filter(c => c.status === 'pending').length,
                    completed_payments: contributionsResult.rows.filter(c => c.status === 'completed').length
                }
            }
        });

    } catch (error) {
        logger.error('Get mobile dashboard error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get mobile dashboard data', code: 500 }
        });
    }
});

// Get mobile-optimized group details
app.get('/api/mobile/groups/:groupId', authenticateToken, [
    param('groupId').isUUID().withMessage('Valid group ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;

        // Verify user is member of group
        const memberCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND status = 'active'
        `, [groupId, req.user.id]);

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to group', code: 403 }
            });
        }

        const userRole = memberCheck.rows[0].role;

        // Get group details
        const groupResult = await db.query(`
            SELECT 
                g.*,
                u.name as admin_name,
                COUNT(gm.id) as member_count
            FROM groups g
            JOIN users u ON g.admin_id = u.id
            LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'active'
            WHERE g.id = $1
            GROUP BY g.id, u.name
        `, [groupId]);

        // Get members (limited info for privacy)
        const membersResult = await db.query(`
            SELECT 
                gm.user_id, gm.role, gm.joined_at,
                u.name,
                CASE WHEN gm.user_id = $2 THEN u.email ELSE NULL END as email
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = $1 AND gm.status = 'active'
            ORDER BY gm.joined_at ASC
        `, [groupId, req.user.id]);

        // Get user's contributions for this group
        const contributionsResult = await db.query(`
            SELECT 
                c.id, c.amount, c.status, c.due_date, c.paid_date,
                c.payment_method, c.cycle_number
            FROM contributions c
            WHERE c.group_id = $1 AND c.user_id = $2
            ORDER BY c.due_date DESC
            LIMIT 10
        `, [groupId, req.user.id]);

        // Get payout rotation info
        const payoutResult = await db.query(`
            SELECT 
                pr.cycle_number, pr.payout_amount, pr.payout_status,
                pr.scheduled_date, pr.actual_payout_date,
                u.name as recipient_name
            FROM payout_rotation pr
            JOIN users u ON pr.member_id = u.id
            WHERE pr.group_id = $1
            ORDER BY pr.cycle_number DESC
            LIMIT 5
        `, [groupId]);

        res.json({
            success: true,
            data: {
                group: groupResult.rows[0],
                user_role: userRole,
                members: membersResult.rows,
                user_contributions: contributionsResult.rows,
                recent_payouts: payoutResult.rows
            }
        });

    } catch (error) {
        logger.error('Get mobile group details error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get group details', code: 500 }
        });
    }
});

module.exports = {
    // Export any utility functions if needed
};