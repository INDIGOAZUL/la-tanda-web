/**
 * 🔒 Rate Limiting Middleware for Node.js HTTP Server
 *
 * Prevents brute force attacks and API abuse
 * Works with vanilla Node.js http.createServer()
 */

class RateLimiter {
    constructor() {
        // Store requests by IP address
        this.requests = new Map();

        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Rate limit configurations by endpoint pattern
     */
    static LIMITS = {
        // Authentication endpoints - strict
        auth: {
            windowMs: 15 * 60 * 1000,  // 15 minutes
            max: 5,                     // 5 attempts
            message: 'Too many login attempts. Please try again in 15 minutes.'
        },

        // Withdrawal endpoints - moderate
        withdrawal: {
            windowMs: 60 * 60 * 1000,  // 1 hour
            max: 10,                    // 10 withdrawals per hour
            message: 'Withdrawal limit reached. Please try again later.'
        },

        // Admin endpoints - moderate
        admin: {
            windowMs: 1 * 60 * 1000,   // 1 minute
            max: 60,                    // 60 requests per minute
            message: 'Admin rate limit exceeded. Please slow down.'
        },

        // General API - permissive
        general: {
            windowMs: 15 * 60 * 1000,  // 15 minutes
            max: 100,                   // 100 requests
            message: 'Too many requests. Please try again later.'
        }
    };

    /**
     * Determine which limit applies to this endpoint
     */
    getLimitConfig(path) {
        if (path.includes('/api/auth/login') ||
            path.includes('/api/admin/login') ||
            path.includes('/api/auth/verify')) {
            return RateLimiter.LIMITS.auth;
        }

        if (path.includes('/api/wallet/withdraw')) {
            return RateLimiter.LIMITS.withdrawal;
        }

        if (path.startsWith('/api/admin/')) {
            return RateLimiter.LIMITS.admin;
        }

        return RateLimiter.LIMITS.general;
    }

    /**
     * Get unique identifier for request (IP + endpoint)
     */
    getRequestKey(ip, path) {
        const limitConfig = this.getLimitConfig(path);

        // Use different keys for different endpoint types
        if (path.includes('/api/auth/login')) {
            return `${ip}:auth:login`;
        }
        if (path.includes('/api/wallet/withdraw')) {
            return `${ip}:withdrawal`;
        }
        if (path.startsWith('/api/admin/')) {
            return `${ip}:admin:${path}`;
        }

        return `${ip}:general`;
    }

    /**
     * Check if request should be rate limited
     */
    shouldLimit(req) {
        const ip = this.getClientIP(req);
        const path = req.url;
        const now = Date.now();

        const limitConfig = this.getLimitConfig(path);
        const key = this.getRequestKey(ip, path);

        // Get or create request history for this key
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }

        const requestHistory = this.requests.get(key);

        // Remove old requests outside the time window
        const windowStart = now - limitConfig.windowMs;
        const recentRequests = requestHistory.filter(time => time > windowStart);

        // Update request history
        this.requests.set(key, recentRequests);

        // Check if limit exceeded
        if (recentRequests.length >= limitConfig.max) {
            const oldestRequest = Math.min(...recentRequests);
            const retryAfter = Math.ceil((oldestRequest + limitConfig.windowMs - now) / 1000);

            return {
                limited: true,
                message: limitConfig.message,
                retryAfter: retryAfter,
                limit: limitConfig.max,
                remaining: 0,
                resetTime: new Date(oldestRequest + limitConfig.windowMs).toISOString()
            };
        }

        // Add current request to history
        recentRequests.push(now);
        this.requests.set(key, recentRequests);

        return {
            limited: false,
            limit: limitConfig.max,
            remaining: limitConfig.max - recentRequests.length,
            resetTime: new Date(now + limitConfig.windowMs).toISOString()
        };
    }

    /**
     * Get client IP address from request
     */
    getClientIP(req) {
        // Check X-Forwarded-For header (for proxies/load balancers)
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }

        // Check X-Real-IP header
        const realIP = req.headers['x-real-ip'];
        if (realIP) {
            return realIP;
        }

        // Fall back to socket address
        return req.socket.remoteAddress || req.connection.remoteAddress;
    }

    /**
     * Create rate limit response
     */
    createRateLimitResponse(limitInfo) {
        return {
            success: false,
            data: {
                error: {
                    code: 429,
                    message: limitInfo.message,
                    details: {
                        retry_after_seconds: limitInfo.retryAfter,
                        limit: limitInfo.limit,
                        remaining: limitInfo.remaining,
                        reset_time: limitInfo.resetTime
                    },
                    timestamp: new Date().toISOString()
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                rate_limited: true
            }
        };
    }

    /**
     * Add rate limit headers to response
     */
    addRateLimitHeaders(res, limitInfo) {
        res.setHeader('X-RateLimit-Limit', limitInfo.limit);
        res.setHeader('X-RateLimit-Remaining', limitInfo.remaining);
        res.setHeader('X-RateLimit-Reset', limitInfo.resetTime);

        if (limitInfo.limited) {
            res.setHeader('Retry-After', limitInfo.retryAfter);
        }
    }

    /**
     * Cleanup old request history
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // Keep history for max 1 hour

        for (const [key, requests] of this.requests.entries()) {
            const recentRequests = requests.filter(time => (now - time) < maxAge);

            if (recentRequests.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, recentRequests);
            }
        }

        console.log(`[Rate Limiter] Cleanup: ${this.requests.size} active rate limit keys`);
    }

    /**
     * Get statistics
     */
    getStats() {
        const stats = {
            active_keys: this.requests.size,
            total_requests_tracked: 0,
            by_type: {
                auth: 0,
                withdrawal: 0,
                admin: 0,
                general: 0
            }
        };

        for (const [key, requests] of this.requests.entries()) {
            stats.total_requests_tracked += requests.length;

            if (key.includes(':auth:')) stats.by_type.auth += requests.length;
            else if (key.includes(':withdrawal')) stats.by_type.withdrawal += requests.length;
            else if (key.includes(':admin:')) stats.by_type.admin += requests.length;
            else stats.by_type.general += requests.length;
        }

        return stats;
    }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Middleware function to check rate limits
 * Returns true if request should be blocked
 */
function checkRateLimit(req, res) {
    const limitInfo = rateLimiter.shouldLimit(req);

    // Add rate limit headers to response
    rateLimiter.addRateLimitHeaders(res, limitInfo);

    // If rate limited, send 429 response
    if (limitInfo.limited) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rateLimiter.createRateLimitResponse(limitInfo), null, 2));
        return true;  // Request blocked
    }

    return false;  // Request allowed
}

/**
 * Get rate limiter statistics
 */
function getRateLimiterStats() {
    return rateLimiter.getStats();
}

module.exports = {
    checkRateLimit,
    getRateLimiterStats,
    rateLimiter
};
