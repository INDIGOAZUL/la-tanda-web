// =============================================
// NOTIFICATIONS UTILITIES
// Date: 2025-11-25
// =============================================

// SendGrid is available but not configured yet
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const notificationTypes = {
    payment_reminder: {
        icon: '💰',
        color: '#f59e0b',
        emailEnabled: true
    },
    payment_received: {
        icon: '✅',
        color: '#10b981',
        emailEnabled: false
    },
    member_joined: {
        icon: '👋',
        color: '#8b5cf6',
        emailEnabled: false
    },
    group_update: {
        icon: '📢',
        color: '#3b82f6',
        emailEnabled: false
    },
    turn_assigned: {
        icon: '🎯',
        color: '#ec4899',
        emailEnabled: true
    },
    invitation: {
        icon: '📩',
        color: '#6366f1',
        emailEnabled: true
    },
    // ========== PAYOUT NOTIFICATIONS ==========
    payout_ready: {
        icon: "🎉",
        color: "#16a34a",
        emailEnabled: true
    },
    payout_requested: {
        icon: "📤",
        color: "#8b5cf6",
        emailEnabled: true
    },
    payout_approved: {
        icon: "✅",
        color: "#10b981",
        emailEnabled: true
    },
    payout_processed: {
        icon: "💸",
        color: "#059669",
        emailEnabled: true
    },
    payout_confirmed: {
        icon: "🎊",
        color: "#16a34a",
        emailEnabled: false
    },
    payout_rejected: {
        icon: "❌",
        color: "#ef4444",
        emailEnabled: true
    },
    payout_reminder: {
        icon: "⏰",
        color: "#f59e0b",
        emailEnabled: true
    },
    // ========== LOTTERY NOTIFICATIONS ==========
    lottery_scheduled: {
        icon: "📅",
        color: "#8b5cf6",
        emailEnabled: true
    },
    lottery_starting: {
        icon: "🎰",
        color: "#f59e0b",
        emailEnabled: false
    },
    lottery_completed: {
        icon: "🎉",
        color: "#10b981",
        emailEnabled: true
    },
    lottery_turn_assigned: {
        icon: "🎯",
        color: "#ec4899",
        emailEnabled: true
    },
    lottery_skipped: {
        icon: "⚠️",
        color: "#f59e0b",
        emailEnabled: true
    },
    lottery_failed: {
        icon: "❌",
        color: "#ef4444",
        emailEnabled: true
    },
    // ========== RECRUITMENT NOTIFICATIONS ==========
    recruitment_starting: {
        icon: "🚀",
        color: "#8b5cf6",
        emailEnabled: false
    },
    recruitment_halfway: {
        icon: "📢",
        color: "#3b82f6",
        emailEnabled: false
    },
    recruitment_almost_full: {
        icon: "🔥",
        color: "#f59e0b",
        emailEnabled: false
    },
    recruitment_urgent: {
        icon: "⏰",
        color: "#ef4444",
        emailEnabled: true
    },
    recruitment_reminder: {
        icon: "📣",
        color: "#6366f1",
        emailEnabled: false
    },
    referral_success: {
        icon: "🎉",
        color: "#10b981",
        emailEnabled: true
    },
    // ========== GROUP FULL NOTIFICATIONS ==========
    // ========== PAYMENT STATUS NOTIFICATIONS ==========
    payment_due_soon: {
        icon: "⏰",
        color: "#f59e0b",
        emailEnabled: true
    },
    payment_late: {
        icon: "⚠️",
        color: "#ef4444",
        emailEnabled: true
    },
    suspension_warning: {
        icon: "🚨",
        color: "#dc2626",
        emailEnabled: true
    },
    member_suspended: {
        icon: "🔒",
        color: "#7f1d1d",
        emailEnabled: true
    },
    member_reactivated: {
        icon: "✅",
        color: "#10b981",
        emailEnabled: true
    },
    group_full: {
        icon: "🎉",
        color: "#10b981",
        emailEnabled: true
    },
    group_full_member: {
        icon: "👥",
        color: "#6366f1",
        emailEnabled: false
    },
    tanda_starting: {
        icon: "🚀",
        color: "#f59e0b",
        emailEnabled: true
    },
    tanda_scheduled: {
        icon: "📅",
        color: "#8b5cf6",
        emailEnabled: true
    },
    // ========== DISTRIBUTION NOTIFICATIONS ==========
    distribution_executed: {
        icon: "💰",
        color: "#10b981",
        emailEnabled: true
    }
};

// Dummy to close - actual lottery_turn_assigned removed
const _dummy = {
    _lottery_turn_assigned_OLD: {
        icon: "🎯",
        color: "#ec4899",
        emailEnabled: true
    }
};

/**
 * Create a notification in the database
 */
const createNotification = async (pool, userId, type, title, message, data) => {
    data = data || {};
    try {
        const result = await pool.query(
            'INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, type, title, message, JSON.stringify(data)]
        );
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

/**
 * Get notifications for a user
 */
const getNotifications = async (pool, userId, options) => {
    options = options || {};
    var limit = options.limit || 50;
    var offset = options.offset || 0;
    var unreadOnly = options.unreadOnly || false;
    
    try {
        var whereClause = 'WHERE user_id = $1';
        if (unreadOnly) {
            whereClause += ' AND read_at IS NULL';
        }
        
        var result = await pool.query(
            'SELECT id, user_id, type, title, message, data, read_at, created_at FROM notifications ' + whereClause + ' ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [userId, limit, offset]
        );
        
        var countResult = await pool.query(
            'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE read_at IS NULL) as unread FROM notifications WHERE user_id = $1',
            [userId]
        );
        
        return {
            notifications: result.rows.map(function(n) {
                var typeInfo = notificationTypes[n.type] || { icon: '🔔', color: '#6b7280' };
                return {
                    id: n.id,
                    type: n.type,
                    icon: typeInfo.icon,
                    color: typeInfo.color,
                    title: n.title,
                    message: n.message,
                    data: n.data,
                    read: n.read_at !== null,
                    read_at: n.read_at,
                    created_at: n.created_at,
                    time_ago: getTimeAgo(n.created_at)
                };
            }),
            total: parseInt(countResult.rows[0].total),
            unread: parseInt(countResult.rows[0].unread)
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Mark notification as read
 */
const markAsRead = async (pool, notificationId, userId) => {
    try {
        var result = await pool.query(
            'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
            [notificationId, userId]
        );
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (pool, userId) => {
    try {
        var result = await pool.query(
            'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL RETURNING id',
            [userId]
        );
        return { marked: result.rowCount };
    } catch (error) {
        throw error;
    }
};

/**
 * Get notification preferences for a user
 */
const getPreferences = async (pool, userId) => {
    try {
        var result = await pool.query(
            'SELECT id, user_id, payment_reminders, group_updates, member_activity, marketing, email_enabled, push_enabled, created_at, updated_at FROM notification_preferences WHERE user_id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            // Create default preferences
            var insertResult = await pool.query(
                'INSERT INTO notification_preferences (user_id) VALUES ($1) RETURNING *',
                [userId]
            );
            return insertResult.rows[0];
        }
        
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

/**
 * Update notification preferences
 */
const updatePreferences = async (pool, userId, preferences) => {
    try {
        var fields = [];
        var values = [userId];
        var paramIndex = 2;
        
        var allowedFields = ['payment_reminders', 'group_updates', 'member_activity', 'marketing', 'email_enabled', 'push_enabled'];
        
        allowedFields.forEach(function(field) {
            if (preferences[field] !== undefined) {
                fields.push(field + ' = $' + paramIndex);
                values.push(preferences[field]);
                paramIndex++;
            }
        });
        
        if (fields.length === 0) {
            return getPreferences(pool, userId);
        }
        
        fields.push('updated_at = NOW()');
        
        var result = await pool.query(
            'UPDATE notification_preferences SET ' + fields.join(', ') + ' WHERE user_id = $1 RETURNING *',
            values
        );
        
        if (result.rows.length === 0) {
            // Create if doesn't exist
            return getPreferences(pool, userId);
        }
        
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

/**
 * Helper: Get time ago string
 */
function getTimeAgo(date) {
    var seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return 'Hace ' + Math.floor(seconds / 60) + ' min';
    if (seconds < 86400) return 'Hace ' + Math.floor(seconds / 3600) + ' h';
    if (seconds < 604800) return 'Hace ' + Math.floor(seconds / 86400) + ' d';
    
    return new Date(date).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

/**
 * Send email notification (placeholder - needs SendGrid config)
 */
const sendEmailNotification = async (to, subject, htmlContent) => {
    // TODO: Configure SendGrid API key
    // Email not sent - SendGrid not configured
    
    /* When SendGrid is configured:
    const msg = {
        to: to,
        from: 'noreply@latanda.online',
        subject: subject,
        html: htmlContent
    };
    await sgMail.send(msg);
    */
    
    return { sent: false, reason: 'SendGrid not configured' };
};

module.exports = {
    notificationTypes: notificationTypes,
    createNotification: createNotification,
    getNotifications: getNotifications,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    getPreferences: getPreferences,
    updatePreferences: updatePreferences,
    sendEmailNotification: sendEmailNotification
};
