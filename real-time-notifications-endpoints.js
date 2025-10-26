/**
 * 🔔 LA TANDA REAL-TIME NOTIFICATIONS SYSTEM
 * Complete notification management and WebSocket integration API endpoints
 */

const { body, param, query } = require('express-validator');

// ====================================
// 🔔 NOTIFICATION MANAGEMENT ENDPOINTS
// ====================================

// Get user notifications
app.get('/api/notifications', authenticateToken, [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('status').optional().isIn(['read', 'unread', 'all']).withMessage('Valid status required'),
    query('category').optional().isLength({ min: 2 }).withMessage('Valid category required'),
    query('type').optional().isLength({ min: 2 }).withMessage('Valid type required')
], handleValidationErrors, async (req, res) => {
    try {
        const { limit = 20, offset = 0, status = 'all', category, type } = req.query;
        
        // Build query with filters
        let query = `
            SELECT 
                n.id,
                n.subject,
                n.body,
                n.notification_type,
                n.event_type,
                n.event_category,
                n.priority_level,
                n.is_read,
                n.is_archived,
                n.delivery_status,
                n.scheduled_at,
                n.sent_at,
                n.delivered_at,
                n.read_at,
                n.action_url,
                n.expires_at,
                n.created_at,
                nt.template_name
            FROM notifications n
            LEFT JOIN notification_templates nt ON n.template_id = nt.id
            WHERE n.user_id = $1
        `;
        
        const params = [req.user.id];
        let paramIndex = 2;
        
        // Add status filter
        if (status === 'read') {
            query += ` AND n.is_read = TRUE`;
        } else if (status === 'unread') {
            query += ` AND n.is_read = FALSE`;
        }
        
        // Add category filter
        if (category) {
            query += ` AND n.event_category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        
        // Add type filter
        if (type) {
            query += ` AND n.notification_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        
        // Add archived filter (exclude by default)
        query += ` AND n.is_archived = FALSE`;
        
        // Add ordering and pagination
        query += ` ORDER BY n.priority_level ASC, n.created_at DESC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        // Get count for pagination
        const countResult = await db.query(`
            SELECT COUNT(*) as total 
            FROM notifications 
            WHERE user_id = $1 AND is_archived = FALSE
        `, [req.user.id]);
        
        // Get unread count
        const unreadResult = await db.query(`
            SELECT COUNT(*) as unread_count 
            FROM notifications 
            WHERE user_id = $1 AND is_read = FALSE AND is_archived = FALSE
        `, [req.user.id]);
        
        res.json({
            success: true,
            data: {
                notifications: result.rows,
                pagination: {
                    total: parseInt(countResult.rows[0].total),
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    unread_count: parseInt(unreadResult.rows[0].unread_count)
                },
                filters: { status, category, type }
            }
        });
        
    } catch (error) {
        logger.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get notifications', code: 500 }
        });
    }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', authenticateToken, [
    param('notificationId').isUUID().withMessage('Valid notification ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        // Verify notification belongs to user
        const notificationCheck = await db.query(`
            SELECT id FROM notifications 
            WHERE id = $1 AND user_id = $2
        `, [notificationId, req.user.id]);
        
        if (notificationCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Notification not found', code: 404 }
            });
        }
        
        // Mark as read
        await db.query(`
            UPDATE notifications 
            SET is_read = TRUE, read_at = NOW()
            WHERE id = $1 AND user_id = $2
        `, [notificationId, req.user.id]);
        
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
        
    } catch (error) {
        logger.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to mark notification as read', code: 500 }
        });
    }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            UPDATE notifications 
            SET is_read = TRUE, read_at = NOW()
            WHERE user_id = $1 AND is_read = FALSE
        `, [req.user.id]);
        
        res.json({
            success: true,
            data: {
                updated_count: result.rowCount
            },
            message: 'All notifications marked as read'
        });
        
    } catch (error) {
        logger.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to mark all notifications as read', code: 500 }
        });
    }
});

// Archive notification
app.put('/api/notifications/:notificationId/archive', authenticateToken, [
    param('notificationId').isUUID().withMessage('Valid notification ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const result = await db.query(`
            UPDATE notifications 
            SET is_archived = TRUE
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
            message: 'Notification archived'
        });
        
    } catch (error) {
        logger.error('Archive notification error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to archive notification', code: 500 }
        });
    }
});

// ====================================
// ⚙️ NOTIFICATION PREFERENCES ENDPOINTS
// ====================================

// Get user notification preferences
app.get('/api/notifications/preferences', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT * FROM user_notification_preferences 
            WHERE user_id = $1
        `, [req.user.id]);
        
        let preferences;
        if (result.rows.length === 0) {
            // Create default preferences
            const createResult = await db.query(`
                INSERT INTO user_notification_preferences (user_id)
                VALUES ($1)
                RETURNING *
            `, [req.user.id]);
            preferences = createResult.rows[0];
        } else {
            preferences = result.rows[0];
        }
        
        res.json({
            success: true,
            data: {
                preferences: preferences
            }
        });
        
    } catch (error) {
        logger.error('Get notification preferences error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get notification preferences', code: 500 }
        });
    }
});

// Update user notification preferences
app.put('/api/notifications/preferences', authenticateToken, [
    body('email_enabled').optional().isBoolean().withMessage('Email enabled must be boolean'),
    body('sms_enabled').optional().isBoolean().withMessage('SMS enabled must be boolean'),
    body('push_enabled').optional().isBoolean().withMessage('Push enabled must be boolean'),
    body('in_app_enabled').optional().isBoolean().withMessage('In-app enabled must be boolean'),
    body('websocket_enabled').optional().isBoolean().withMessage('WebSocket enabled must be boolean'),
    body('payment_notifications').optional().isBoolean().withMessage('Payment notifications must be boolean'),
    body('payout_notifications').optional().isBoolean().withMessage('Payout notifications must be boolean'),
    body('group_notifications').optional().isBoolean().withMessage('Group notifications must be boolean'),
    body('security_notifications').optional().isBoolean().withMessage('Security notifications must be boolean'),
    body('email_address').optional().isEmail().withMessage('Valid email required'),
    body('phone_number').optional().isLength({ min: 8, max: 20 }).withMessage('Valid phone number required')
], handleValidationErrors, async (req, res) => {
    try {
        const updateFields = req.body;
        updateFields.updated_at = new Date();
        
        // Build dynamic update query
        const fields = Object.keys(updateFields);
        const values = Object.values(updateFields);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        
        const query = `
            UPDATE user_notification_preferences 
            SET ${setClause}
            WHERE user_id = $1
            RETURNING *
        `;
        
        const result = await db.query(query, [req.user.id, ...values]);
        
        if (result.rows.length === 0) {
            // Create if doesn't exist
            const createResult = await db.query(`
                INSERT INTO user_notification_preferences (user_id, ${fields.join(', ')})
                VALUES ($1, ${fields.map((_, index) => `$${index + 2}`).join(', ')})
                RETURNING *
            `, [req.user.id, ...values]);
            
            res.json({
                success: true,
                data: {
                    preferences: createResult.rows[0]
                },
                message: 'Notification preferences created'
            });
        } else {
            res.json({
                success: true,
                data: {
                    preferences: result.rows[0]
                },
                message: 'Notification preferences updated'
            });
        }
        
    } catch (error) {
        logger.error('Update notification preferences error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update notification preferences', code: 500 }
        });
    }
});

// ====================================
// 📨 NOTIFICATION SENDING ENDPOINTS
// ====================================

// Send custom notification (admin only)
app.post('/api/notifications/send', authenticateToken, requireRole(['administrator']), [
    body('user_id').optional().isUUID().withMessage('Valid user ID required'),
    body('group_id').optional().isUUID().withMessage('Valid group ID required'),
    body('template_name').optional().isLength({ min: 2 }).withMessage('Valid template name required'),
    body('subject').optional().isLength({ min: 1 }).withMessage('Subject required if no template'),
    body('body').isLength({ min: 1 }).withMessage('Body required'),
    body('notification_type').optional().isIn(['email', 'sms', 'push', 'in_app', 'websocket']).withMessage('Valid notification type required'),
    body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
    body('event_data').optional().isObject().withMessage('Event data must be object')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            user_id, group_id, template_name, subject, body,
            notification_type = 'in_app', priority = 3, event_data = {}
        } = req.body;
        
        let notification_id;
        
        if (template_name) {
            // Use template
            notification_id = await db.query(`
                SELECT create_notification_from_template($1, $2, $3, $4) as id
            `, [template_name, user_id, event_data, priority]);
            
            notification_id = notification_id.rows[0].id;
        } else {
            // Create custom notification
            const result = await db.query(`
                INSERT INTO notifications (
                    user_id, group_id, subject, body, notification_type,
                    event_type, event_category, priority_level, event_data
                ) VALUES ($1, $2, $3, $4, $5, 'custom', 'admin', $6, $7)
                RETURNING id
            `, [user_id, group_id, subject, body, notification_type, priority, event_data]);
            
            notification_id = result.rows[0].id;
        }
        
        if (!notification_id) {
            return res.status(400).json({
                success: false,
                error: { message: 'Failed to create notification', code: 400 }
            });
        }
        
        // Send real-time notification if applicable
        if (user_id && ['websocket', 'in_app'].includes(notification_type)) {
            await db.query(`
                SELECT send_websocket_notification($1, 'admin', $2, $3) as sent_count
            `, [user_id, body, event_data]);
        }
        
        logger.info('Custom notification sent', {
            notification_id,
            user_id,
            group_id,
            notification_type,
            sent_by: req.user.id
        });
        
        res.status(201).json({
            success: true,
            data: {
                notification_id: notification_id
            },
            message: 'Notification sent successfully'
        });
        
    } catch (error) {
        logger.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to send notification', code: 500 }
        });
    }
});

// ====================================
// 🔌 WEBSOCKET CONNECTION ENDPOINTS
// ====================================

// Register WebSocket connection
app.post('/api/notifications/websocket/connect', authenticateToken, [
    body('connection_id').isLength({ min: 1 }).withMessage('Connection ID required'),
    body('socket_id').optional().isLength({ min: 1 }).withMessage('Valid socket ID required'),
    body('device_type').optional().isLength({ min: 1 }).withMessage('Valid device type required'),
    body('subscribed_events').optional().isArray().withMessage('Subscribed events must be array')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            connection_id, socket_id, device_type = 'web',
            subscribed_events = ['payment', 'payout', 'group', 'security']
        } = req.body;
        
        // Remove existing inactive connections for this user
        await db.query(`
            DELETE FROM websocket_connections 
            WHERE user_id = $1 AND is_active = FALSE
        `, [req.user.id]);
        
        // Register new connection
        const result = await db.query(`
            INSERT INTO websocket_connections (
                user_id, connection_id, socket_id, device_type,
                subscribed_events, user_agent, ip_address
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (connection_id) DO UPDATE SET
                is_active = TRUE,
                last_ping_at = NOW(),
                last_activity_at = NOW(),
                subscribed_events = EXCLUDED.subscribed_events
            RETURNING id
        `, [
            req.user.id, connection_id, socket_id, device_type,
            subscribed_events, req.get('User-Agent'), req.ip
        ]);
        
        res.json({
            success: true,
            data: {
                connection_id: result.rows[0].id,
                subscribed_events: subscribed_events
            },
            message: 'WebSocket connection registered'
        });
        
    } catch (error) {
        logger.error('WebSocket connect error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to register WebSocket connection', code: 500 }
        });
    }
});

// Update WebSocket connection ping
app.put('/api/notifications/websocket/:connectionId/ping', authenticateToken, [
    param('connectionId').isUUID().withMessage('Valid connection ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { connectionId } = req.params;
        
        const result = await db.query(`
            UPDATE websocket_connections 
            SET last_ping_at = NOW(), last_activity_at = NOW()
            WHERE id = $1 AND user_id = $2
        `, [connectionId, req.user.id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Connection not found', code: 404 }
            });
        }
        
        res.json({
            success: true,
            message: 'Connection ping updated'
        });
        
    } catch (error) {
        logger.error('WebSocket ping error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update connection ping', code: 500 }
        });
    }
});

// Disconnect WebSocket
app.delete('/api/notifications/websocket/:connectionId', authenticateToken, [
    param('connectionId').isUUID().withMessage('Valid connection ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { connectionId } = req.params;
        
        const result = await db.query(`
            UPDATE websocket_connections 
            SET is_active = FALSE, disconnected_at = NOW()
            WHERE id = $1 AND user_id = $2
        `, [connectionId, req.user.id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Connection not found', code: 404 }
            });
        }
        
        res.json({
            success: true,
            message: 'WebSocket connection disconnected'
        });
        
    } catch (error) {
        logger.error('WebSocket disconnect error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to disconnect WebSocket', code: 500 }
        });
    }
});

// ====================================
// 📊 NOTIFICATION ANALYTICS ENDPOINTS
// ====================================

// Get notification statistics (admin only)
app.get('/api/notifications/stats', authenticateToken, requireRole(['administrator']), [
    query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Valid period required'),
    query('start_date').optional().isISO8601().withMessage('Valid start date required'),
    query('end_date').optional().isISO8601().withMessage('Valid end date required')
], handleValidationErrors, async (req, res) => {
    try {
        const { period = 'week', start_date, end_date } = req.query;
        
        // Calculate date range
        let dateFilter = '';
        const params = [];
        
        if (start_date && end_date) {
            dateFilter = 'WHERE n.created_at BETWEEN $1 AND $2';
            params.push(start_date, end_date);
        } else {
            const intervals = {
                day: '1 day',
                week: '7 days',
                month: '30 days',
                year: '365 days'
            };
            dateFilter = `WHERE n.created_at >= NOW() - INTERVAL '${intervals[period]}'`;
        }
        
        // Get comprehensive stats
        const statsQuery = `
            SELECT 
                COUNT(*) as total_notifications,
                COUNT(*) FILTER (WHERE n.is_read = true) as read_notifications,
                COUNT(*) FILTER (WHERE n.is_read = false) as unread_notifications,
                COUNT(*) FILTER (WHERE n.delivery_status = 'delivered') as delivered_notifications,
                COUNT(*) FILTER (WHERE n.delivery_status = 'failed') as failed_notifications,
                COUNT(DISTINCT n.user_id) as unique_recipients,
                AVG(EXTRACT(EPOCH FROM (n.read_at - n.created_at))) as avg_read_time_seconds,
                COUNT(*) FILTER (WHERE n.notification_type = 'email') as email_notifications,
                COUNT(*) FILTER (WHERE n.notification_type = 'sms') as sms_notifications,
                COUNT(*) FILTER (WHERE n.notification_type = 'push') as push_notifications,
                COUNT(*) FILTER (WHERE n.notification_type = 'in_app') as in_app_notifications,
                COUNT(*) FILTER (WHERE n.notification_type = 'websocket') as websocket_notifications
            FROM notifications n ${dateFilter}
        `;
        
        const statsResult = await db.query(statsQuery, params);
        
        // Get category breakdown
        const categoryQuery = `
            SELECT 
                n.event_category,
                COUNT(*) as count,
                COUNT(*) FILTER (WHERE n.is_read = true) as read_count
            FROM notifications n ${dateFilter}
            GROUP BY n.event_category
            ORDER BY count DESC
        `;
        
        const categoryResult = await db.query(categoryQuery, params);
        
        // Get daily breakdown for the period
        const dailyQuery = `
            SELECT 
                DATE(n.created_at) as date,
                COUNT(*) as count,
                COUNT(*) FILTER (WHERE n.is_read = true) as read_count
            FROM notifications n ${dateFilter}
            GROUP BY DATE(n.created_at)
            ORDER BY date DESC
            LIMIT 30
        `;
        
        const dailyResult = await db.query(dailyQuery, params);
        
        res.json({
            success: true,
            data: {
                overview: statsResult.rows[0],
                category_breakdown: categoryResult.rows,
                daily_breakdown: dailyResult.rows,
                period: period
            }
        });
        
    } catch (error) {
        logger.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get notification statistics', code: 500 }
        });
    }
});

module.exports = {
    // Export any utility functions if needed
};