/**
 * 🔍 Audit Logging System for La Tanda
 *
 * Logs all security-relevant events for compliance and forensics
 * FASE 4: Admin & Seguridad - Day 3-4
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
    constructor(databasePath = '/root/database.json') {
        this.databasePath = databasePath;
        this.retentionDays = 90; // Keep logs for 90 days
    }

    /**
     * Event types for audit logging
     */
    static EVENT_TYPES = {
        // Authentication events
        AUTH_LOGIN_SUCCESS: 'auth.login.success',
        AUTH_LOGIN_FAILURE: 'auth.login.failure',
        AUTH_LOGOUT: 'auth.logout',
        AUTH_PASSWORD_CHANGE: 'auth.password_change',
        AUTH_PASSWORD_RESET_REQUEST: 'auth.password_reset_request',
        AUTH_PASSWORD_RESET_COMPLETE: 'auth.password_reset_complete',

        // 2FA events
        AUTH_2FA_ENABLED: 'auth.2fa.enabled',
        AUTH_2FA_DISABLED: 'auth.2fa.disabled',
        AUTH_2FA_SUCCESS: 'auth.2fa.success',
        AUTH_2FA_FAILURE: 'auth.2fa.failure',

        // Rate limiting events
        RATE_LIMIT_EXCEEDED: 'security.rate_limit.exceeded',

        // Admin actions
        ADMIN_USER_CREATED: 'admin.user.created',
        ADMIN_USER_UPDATED: 'admin.user.updated',
        ADMIN_USER_DELETED: 'admin.user.deleted',
        ADMIN_USER_SUSPENDED: 'admin.user.suspended',
        ADMIN_USER_UNSUSPENDED: 'admin.user.unsuspended',
        ADMIN_ROLE_CHANGED: 'admin.role.changed',

        // Withdrawal events
        WITHDRAWAL_REQUESTED: 'withdrawal.requested',
        WITHDRAWAL_APPROVED: 'withdrawal.approved',
        WITHDRAWAL_REJECTED: 'withdrawal.rejected',
        WITHDRAWAL_COMPLETED: 'withdrawal.completed',

        // Security events
        SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
        SECURITY_ACCESS_DENIED: 'security.access_denied',
        SECURITY_TOKEN_EXPIRED: 'security.token.expired'
    };

    /**
     * Severity levels
     */
    static SEVERITY = {
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
        CRITICAL: 'critical'
    };

    /**
     * Log an audit event
     */
    async log(eventType, data = {}) {
        try {
            const auditEntry = {
                id: this.generateAuditId(),
                event_type: eventType,
                timestamp: new Date().toISOString(),
                severity: this.determineSeverity(eventType),
                user_id: data.user_id || null,
                user_email: data.user_email || null,
                ip_address: data.ip_address || null,
                user_agent: data.user_agent || null,
                endpoint: data.endpoint || null,
                method: data.method || null,
                status_code: data.status_code || null,
                details: data.details || {},
                metadata: {
                    server: process.env.SERVER_NAME || 'production-168.231.67.201',
                    version: '2.0.0',
                    environment: process.env.NODE_ENV || 'production'
                }
            };

            // Write to database
            await this.writeToDatabase(auditEntry);

            // Console log for immediate visibility
            this.consoleLog(auditEntry);

            return auditEntry;
        } catch (error) {
            console.error('[Audit Logger] Error logging event:', error.message);
            // Don't throw - audit logging should never break the application
            return null;
        }
    }

    /**
     * Determine severity based on event type
     */
    determineSeverity(eventType) {
        // Critical events
        if (eventType.includes('suspended') ||
            eventType.includes('deleted') ||
            eventType.includes('suspicious') ||
            eventType === AuditLogger.EVENT_TYPES.AUTH_2FA_DISABLED) {
            return AuditLogger.SEVERITY.CRITICAL;
        }

        // Error events
        if (eventType.includes('failure') ||
            eventType.includes('denied') ||
            eventType.includes('rejected') ||
            eventType.includes('exceeded')) {
            return AuditLogger.SEVERITY.ERROR;
        }

        // Warning events
        if (eventType.includes('reset') ||
            eventType.includes('expired') ||
            eventType.includes('rate_limit')) {
            return AuditLogger.SEVERITY.WARNING;
        }

        // Default to info
        return AuditLogger.SEVERITY.INFO;
    }

    /**
     * Write audit entry to database
     */
    async writeToDatabase(auditEntry) {
        try {
            // Read current database
            const dbData = JSON.parse(fs.readFileSync(this.databasePath, 'utf8'));

            // Initialize audit_logs array if it doesn't exist
            if (!dbData.audit_logs) {
                dbData.audit_logs = [];
            }

            // Add new audit entry
            dbData.audit_logs.push(auditEntry);

            // Clean up old entries (retention policy)
            dbData.audit_logs = this.applyRetentionPolicy(dbData.audit_logs);

            // Write back to database
            fs.writeFileSync(this.databasePath, JSON.stringify(dbData, null, 2), 'utf8');

        } catch (error) {
            console.error('[Audit Logger] Database write error:', error.message);
        }
    }

    /**
     * Apply retention policy (keep only last 90 days)
     */
    applyRetentionPolicy(auditLogs) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

        return auditLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= cutoffDate;
        });
    }

    /**
     * Console log for immediate visibility
     */
    consoleLog(auditEntry) {
        const severityEmoji = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            critical: '🚨'
        };

        const emoji = severityEmoji[auditEntry.severity] || 'ℹ️';
        console.log(`${emoji} [AUDIT] ${auditEntry.event_type} | User: ${auditEntry.user_email || 'anonymous'} | IP: ${auditEntry.ip_address || 'unknown'}`);
    }

    /**
     * Generate unique audit ID
     */
    generateAuditId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Query audit logs
     */
    async query(filters = {}) {
        try {
            const dbData = JSON.parse(fs.readFileSync(this.databasePath, 'utf8'));
            let logs = dbData.audit_logs || [];

            // Apply filters
            if (filters.event_type) {
                logs = logs.filter(log => log.event_type === filters.event_type);
            }

            if (filters.user_id) {
                logs = logs.filter(log => log.user_id === filters.user_id);
            }

            if (filters.severity) {
                logs = logs.filter(log => log.severity === filters.severity);
            }

            if (filters.start_date) {
                const startDate = new Date(filters.start_date);
                logs = logs.filter(log => new Date(log.timestamp) >= startDate);
            }

            if (filters.end_date) {
                const endDate = new Date(filters.end_date);
                logs = logs.filter(log => new Date(log.timestamp) <= endDate);
            }

            // Sort by timestamp (newest first)
            logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Apply limit
            const limit = filters.limit || 100;
            logs = logs.slice(0, limit);

            return logs;

        } catch (error) {
            console.error('[Audit Logger] Query error:', error.message);
            return [];
        }
    }

    /**
     * Get audit statistics
     */
    async getStats(days = 7) {
        try {
            const dbData = JSON.parse(fs.readFileSync(this.databasePath, 'utf8'));
            const logs = dbData.audit_logs || [];

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const recentLogs = logs.filter(log =>
                new Date(log.timestamp) >= cutoffDate
            );

            const stats = {
                total_events: recentLogs.length,
                by_severity: {},
                by_event_type: {},
                by_user: {},
                recent_critical: []
            };

            // Count by severity
            recentLogs.forEach(log => {
                stats.by_severity[log.severity] = (stats.by_severity[log.severity] || 0) + 1;
                stats.by_event_type[log.event_type] = (stats.by_event_type[log.event_type] || 0) + 1;

                if (log.user_email) {
                    stats.by_user[log.user_email] = (stats.by_user[log.user_email] || 0) + 1;
                }

                if (log.severity === 'critical') {
                    stats.recent_critical.push({
                        event_type: log.event_type,
                        timestamp: log.timestamp,
                        user: log.user_email || 'anonymous'
                    });
                }
            });

            // Limit recent critical to last 10
            stats.recent_critical = stats.recent_critical.slice(0, 10);

            return stats;

        } catch (error) {
            console.error('[Audit Logger] Stats error:', error.message);
            return null;
        }
    }
}

// Create singleton instance
const auditLogger = new AuditLogger();

/**
 * Convenience methods for common audit events
 */
const auditLog = {
    // Authentication
    loginSuccess: (userId, userEmail, ip, userAgent) =>
        auditLogger.log(AuditLogger.EVENT_TYPES.AUTH_LOGIN_SUCCESS, {
            user_id: userId,
            user_email: userEmail,
            ip_address: ip,
            user_agent: userAgent,
            details: { success: true }
        }),

    loginFailure: (email, ip, userAgent, reason = 'Invalid credentials') =>
        auditLogger.log(AuditLogger.EVENT_TYPES.AUTH_LOGIN_FAILURE, {
            user_email: email,
            ip_address: ip,
            user_agent: userAgent,
            details: { reason }
        }),

    // Rate limiting
    rateLimitExceeded: (ip, endpoint, limit) =>
        auditLogger.log(AuditLogger.EVENT_TYPES.RATE_LIMIT_EXCEEDED, {
            ip_address: ip,
            endpoint: endpoint,
            details: { limit }
        }),

    // Admin actions
    userSuspended: (adminId, adminEmail, targetUserId, targetUserEmail, reason) =>
        auditLogger.log(AuditLogger.EVENT_TYPES.ADMIN_USER_SUSPENDED, {
            user_id: adminId,
            user_email: adminEmail,
            details: {
                target_user_id: targetUserId,
                target_user_email: targetUserEmail,
                reason
            }
        }),

    // Withdrawals
    withdrawalRequested: (userId, userEmail, amount, address, ip) =>
        auditLogger.log(AuditLogger.EVENT_TYPES.WITHDRAWAL_REQUESTED, {
            user_id: userId,
            user_email: userEmail,
            ip_address: ip,
            details: {
                amount,
                destination_address: address
            }
        })
};

module.exports = {
    AuditLogger,
    auditLogger,
    auditLog
};
