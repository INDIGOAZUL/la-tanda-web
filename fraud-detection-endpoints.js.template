/**
 * 🛡️ LA TANDA FRAUD DETECTION SYSTEM
 * Complete fraud detection implementation with real-time monitoring
 */

const crypto = require('crypto');

// Note: This file is imported into the main server, so these will be available there:
// const logger, db, app, requireRole, handleValidationErrors, body

// ====================================
// 🛡️ FRAUD DETECTION MIDDLEWARE
// ====================================

// Rate limiting for suspicious activity
const rateLimitAttempts = new Map();

function detectSuspiciousActivity(req, res, next) {
    // Import from main server context (will be available when imported)
    const logger = req.app.locals.logger || console;
    const db = req.app.locals.db;
    const userId = req.user?.id;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    const endpoint = req.originalUrl;

    // Skip fraud detection for health checks
    if (endpoint.includes('/health') || endpoint.includes('/status')) {
        return next();
    }

    const riskScore = calculateRiskScore(req);
    
    // Log suspicious activity
    if (riskScore >= 70) {
        logger.warn('High risk activity detected', {
            userId,
            ip,
            userAgent,
            endpoint,
            riskScore,
            timestamp: new Date().toISOString()
        });

        // Store in database for analysis
        if (userId && db) {
            db.query(`
                INSERT INTO fraud_detection_logs (
                    user_id, ip_address, user_agent, endpoint, risk_score, 
                    detection_reason, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [userId, ip, userAgent, endpoint, riskScore, 'High risk score detected']).catch(err => {
                // Silently handle database errors for fraud logging
                console.error('Fraud detection logging failed:', err.message);
            });
        }
    }

    // Block extremely high risk requests
    if (riskScore >= 90) {
        return res.status(429).json({
            success: false,
            error: {
                message: 'Request blocked due to suspicious activity',
                code: 429,
                risk_score: riskScore
            }
        });
    }

    req.riskScore = riskScore;
    next();
}

function calculateRiskScore(req) {
    let score = 0;
    const userId = req.user?.id;
    const ip = req.ip;
    const userAgent = req.get('User-Agent') || '';

    // IP-based scoring
    if (isVPNOrProxy(ip)) score += 20;
    if (isKnownMaliciousIP(ip)) score += 50;

    // User-Agent scoring
    if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) score += 30;
    if (userAgent.length < 10) score += 25;

    // Rate limiting check
    const key = userId || ip;
    const now = Date.now();
    const window = 60000; // 1 minute window
    
    if (!rateLimitAttempts.has(key)) {
        rateLimitAttempts.set(key, []);
    }

    const attempts = rateLimitAttempts.get(key);
    const recentAttempts = attempts.filter(time => now - time < window);
    
    if (recentAttempts.length > 10) score += 40;
    if (recentAttempts.length > 20) score += 60;

    // Update attempts
    recentAttempts.push(now);
    rateLimitAttempts.set(key, recentAttempts);

    // Time-based scoring (unusual hours)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5) score += 10; // Early morning activity

    return Math.min(score, 100);
}

function isVPNOrProxy(ip) {
    // Simple check for common VPN/proxy IP ranges
    const vpnRanges = ['10.', '172.', '192.168.'];
    return vpnRanges.some(range => ip.startsWith(range));
}

function isKnownMaliciousIP(ip) {
    // In production, this would check against threat intelligence feeds
    const maliciousIPs = ['127.0.0.1']; // Placeholder
    return maliciousIPs.includes(ip);
}

// ====================================
// 🛡️ FRAUD DETECTION HELPER FUNCTIONS
// ====================================
// Note: API endpoints are defined in the main server file

// Helper function for fraud detection dashboard logic
function getFraudDetectionDashboard(timeframe = '24h', limit = 100) {
    try {
        const { timeframe = '24h', limit = 100 } = req.query;
        
        let timeFilter = '';
        switch (timeframe) {
            case '1h': timeFilter = "AND created_at > NOW() - INTERVAL '1 hour'"; break;
            case '24h': timeFilter = "AND created_at > NOW() - INTERVAL '24 hours'"; break;
            case '7d': timeFilter = "AND created_at > NOW() - INTERVAL '7 days'"; break;
            case '30d': timeFilter = "AND created_at > NOW() - INTERVAL '30 days'"; break;
        }

        // Get recent fraud alerts
        const alertsResult = await db.query(`
            SELECT 
                f.id,
                f.user_id,
                u.name as user_name,
                u.email as user_email,
                f.ip_address,
                f.endpoint,
                f.risk_score,
                f.detection_reason,
                f.created_at,
                f.resolved_at,
                f.resolution_notes
            FROM fraud_detection_logs f
            LEFT JOIN users u ON f.user_id = u.id
            WHERE 1=1 ${timeFilter}
            ORDER BY f.created_at DESC
            LIMIT $1
        `, [limit]);

        // Get fraud statistics
        const statsResult = await db.query(`
            SELECT 
                COUNT(*) as total_alerts,
                COUNT(CASE WHEN risk_score >= 90 THEN 1 END) as critical_alerts,
                COUNT(CASE WHEN risk_score >= 70 AND risk_score < 90 THEN 1 END) as high_alerts,
                COUNT(CASE WHEN risk_score >= 50 AND risk_score < 70 THEN 1 END) as medium_alerts,
                COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END) as resolved_alerts,
                AVG(risk_score) as avg_risk_score,
                COUNT(DISTINCT user_id) as unique_users_flagged,
                COUNT(DISTINCT ip_address) as unique_ips_flagged
            FROM fraud_detection_logs
            WHERE 1=1 ${timeFilter}
        `);

        // Get top risk endpoints
        const endpointsResult = await db.query(`
            SELECT 
                endpoint,
                COUNT(*) as alert_count,
                AVG(risk_score) as avg_risk_score,
                MAX(risk_score) as max_risk_score
            FROM fraud_detection_logs
            WHERE 1=1 ${timeFilter}
            GROUP BY endpoint
            ORDER BY alert_count DESC
            LIMIT 10
        `);

        // Get suspicious IPs
        const suspiciousIPsResult = await db.query(`
            SELECT 
                ip_address,
                COUNT(*) as alert_count,
                AVG(risk_score) as avg_risk_score,
                MAX(risk_score) as max_risk_score,
                MAX(created_at) as last_seen
            FROM fraud_detection_logs
            WHERE 1=1 ${timeFilter}
            GROUP BY ip_address
            HAVING COUNT(*) > 1
            ORDER BY alert_count DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            data: {
                timeframe,
                statistics: statsResult.rows[0],
                recent_alerts: alertsResult.rows,
                top_risk_endpoints: endpointsResult.rows,
                suspicious_ips: suspiciousIPsResult.rows,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Fraud detection dashboard error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to load fraud detection dashboard',
                code: 500
            }
        });
    }
});

// Block/unblock IP address
app.post('/api/security/fraud-detection/block-ip', authenticateToken, requireRole(['administrator', 'security_admin']), [
    body('ip_address').isIP().withMessage('Valid IP address required'),
    body('action').isIn(['block', 'unblock']).withMessage('Action must be block or unblock'),
    body('reason').optional().isLength({ min: 5, max: 255 }).withMessage('Reason must be 5-255 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { ip_address, action, reason } = req.body;
        const adminId = req.user.id;

        if (action === 'block') {
            // Add to blocked IPs
            await db.query(`
                INSERT INTO blocked_ips (ip_address, blocked_by, block_reason, blocked_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (ip_address) UPDATE SET
                    blocked_by = $2,
                    block_reason = $3,
                    blocked_at = NOW(),
                    is_active = TRUE
            `, [ip_address, adminId, reason || 'Administrative block']);

            logger.info('IP address blocked', {
                ip_address,
                blocked_by: adminId,
                reason
            });
        } else {
            // Remove from blocked IPs
            await db.query(`
                UPDATE blocked_ips 
                SET is_active = FALSE, 
                    unblocked_at = NOW(),
                    unblocked_by = $2
                WHERE ip_address = $1
            `, [ip_address, adminId]);

            logger.info('IP address unblocked', {
                ip_address,
                unblocked_by: adminId
            });
        }

        res.json({
            success: true,
            message: `IP address ${ip_address} has been ${action}ed successfully`
        });

    } catch (error) {
        logger.error('IP block/unblock error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update IP block status',
                code: 500
            }
        });
    }
});

// Resolve fraud alert
app.post('/api/security/fraud-detection/resolve-alert', authenticateToken, requireRole(['administrator', 'security_admin']), [
    body('alert_id').isUUID().withMessage('Valid alert ID required'),
    body('resolution').isIn(['false_positive', 'confirmed_fraud', 'user_educated', 'system_updated']).withMessage('Invalid resolution type'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { alert_id, resolution, notes } = req.body;
        const adminId = req.user.id;

        await db.query(`
            UPDATE fraud_detection_logs 
            SET resolved_at = NOW(),
                resolved_by = $2,
                resolution_type = $3,
                resolution_notes = $4
            WHERE id = $1
        `, [alert_id, adminId, resolution, notes]);

        logger.info('Fraud alert resolved', {
            alert_id,
            resolution,
            resolved_by: adminId
        });

        res.json({
            success: true,
            message: 'Fraud alert resolved successfully'
        });

    } catch (error) {
        logger.error('Fraud alert resolution error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to resolve fraud alert',
                code: 500
            }
        });
    }
});

// Get user risk profile
app.get('/api/security/fraud-detection/user-risk/:userId', authenticateToken, requireRole(['administrator', 'security_admin']), async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user's fraud history
        const fraudHistoryResult = await db.query(`
            SELECT 
                COUNT(*) as total_alerts,
                AVG(risk_score) as avg_risk_score,
                MAX(risk_score) as max_risk_score,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as alerts_24h,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as alerts_7d,
                MAX(created_at) as last_alert
            FROM fraud_detection_logs
            WHERE user_id = $1
        `, [userId]);

        // Get user's recent activity
        const activityResult = await db.query(`
            SELECT endpoint, COUNT(*) as count, MAX(created_at) as last_access
            FROM fraud_detection_logs
            WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
            GROUP BY endpoint
            ORDER BY count DESC
            LIMIT 10
        `, [userId]);

        // Get user's IP history
        const ipHistoryResult = await db.query(`
            SELECT 
                ip_address,
                COUNT(*) as usage_count,
                MIN(created_at) as first_seen,
                MAX(created_at) as last_seen,
                AVG(risk_score) as avg_risk_score
            FROM fraud_detection_logs
            WHERE user_id = $1
            GROUP BY ip_address
            ORDER BY usage_count DESC
            LIMIT 10
        `, [userId]);

        const riskProfile = fraudHistoryResult.rows[0];
        let riskLevel = 'low';
        
        if (riskProfile.avg_risk_score > 70) riskLevel = 'high';
        else if (riskProfile.avg_risk_score > 40) riskLevel = 'medium';

        res.json({
            success: true,
            data: {
                user_id: userId,
                risk_level: riskLevel,
                risk_profile: riskProfile,
                recent_activity: activityResult.rows,
                ip_history: ipHistoryResult.rows,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('User risk profile error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to load user risk profile',
                code: 500
            }
        });
    }
});

// Real-time fraud monitoring WebSocket endpoint
app.get('/api/security/fraud-detection/live-monitoring', authenticateToken, requireRole(['administrator', 'security_admin']), (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ 
        type: 'connection', 
        message: 'Connected to fraud detection monitoring',
        timestamp: new Date().toISOString()
    })}\n\n`);

    // Set up interval to send live updates
    const interval = setInterval(async () => {
        try {
            // Get recent high-risk alerts
            const result = await db.query(`
                SELECT COUNT(*) as count
                FROM fraud_detection_logs
                WHERE created_at > NOW() - INTERVAL '1 minute'
                AND risk_score >= 70
            `);

            const alertCount = result.rows[0].count;
            
            if (alertCount > 0) {
                res.write(`data: ${JSON.stringify({
                    type: 'alert',
                    count: alertCount,
                    message: `${alertCount} high-risk alert(s) in the last minute`,
                    timestamp: new Date().toISOString()
                })}\n\n`);
            }

        } catch (error) {
            logger.error('Live monitoring error:', error);
        }
    }, 60000); // Check every minute

    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
    });
});

// ====================================
// 🛡️ HELPER FUNCTIONS
// ====================================

// Middleware to check if IP is blocked
function checkBlockedIP(req, res, next) {
    const ip = req.ip;
    const db = req.app.locals.db;
    const logger = req.app.locals.logger || console;
    
    if (!db) {
        return next(); // Continue if no database connection
    }
    
    db.query(`
        SELECT COUNT(*) as count
        FROM blocked_ips
        WHERE ip_address = $1 AND is_active = TRUE
    `, [ip]).then(result => {
        if (result.rows[0].count > 0) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied - IP address blocked',
                    code: 403
                }
            });
        }
        next();
    }).catch(error => {
        logger.error('Blocked IP check error:', error);
        next(); // Continue on error to avoid blocking legitimate users
    });
}

// Function to automatically flag suspicious transactions
async function flagSuspiciousTransaction(userId, transactionData) {
    const suspiciousIndicators = [];
    let riskScore = 0;

    // Check transaction amount
    if (transactionData.amount > 10000) {
        suspiciousIndicators.push('Large transaction amount');
        riskScore += 30;
    }

    // Check time of transaction
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5) {
        suspiciousIndicators.push('Unusual time');
        riskScore += 20;
    }

    // Check frequency
    const recentTransactions = await db.query(`
        SELECT COUNT(*) as count
        FROM transactions
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'
    `, [userId]);

    if (recentTransactions.rows[0].count > 5) {
        suspiciousIndicators.push('High frequency transactions');
        riskScore += 40;
    }

    // Log if suspicious
    if (riskScore >= 50) {
        await db.query(`
            INSERT INTO fraud_detection_logs (
                user_id, endpoint, risk_score, detection_reason, 
                transaction_data, created_at
            ) VALUES ($1, 'transaction', $2, $3, $4, NOW())
        `, [
            userId, 
            riskScore, 
            suspiciousIndicators.join(', '),
            JSON.stringify(transactionData)
        ]);

        logger.warn('Suspicious transaction flagged', {
            userId,
            riskScore,
            indicators: suspiciousIndicators,
            transactionData
        });
    }

    return { riskScore, indicators: suspiciousIndicators };
}

module.exports = {
    detectSuspiciousActivity,
    checkBlockedIP,
    flagSuspiciousTransaction,
    calculateRiskScore
};