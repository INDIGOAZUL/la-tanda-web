/**
 * 🛡️ LA TANDA FRAUD DETECTION HELPERS
 * Helper functions for fraud detection system
 */

const crypto = require('crypto');

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

    return { riskScore, indicators: suspiciousIndicators };
}

function generateDeviceFingerprint(req) {
    const components = [
        req.get('User-Agent') || '',
        req.get('Accept-Language') || '',
        req.ip || '',
        req.get('Accept-Encoding') || ''
    ].join('|');
    
    return crypto.createHash('sha256').update(components).digest('hex');
}

function detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
}

module.exports = {
    detectSuspiciousActivity,
    checkBlockedIP,
    flagSuspiciousTransaction,
    calculateRiskScore,
    generateDeviceFingerprint,
    detectDeviceType
};