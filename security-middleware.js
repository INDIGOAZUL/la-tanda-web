/**
 * LA TANDA - Security Middleware
 * Rate limiting, security headers, and request validation
 * Created: 2025-12-12
 *
 * NOTE: In PM2 cluster mode (2+ instances), this in-memory rate limiter is per-worker.
 * Nginx is the primary rate limiter (zones: login 5r/min, api 5r/s, general 10r/s)
 * and enforces limits across all workers. This middleware provides defense-in-depth only.
 */

// Rate limiting store (in-memory)
const rateLimitStore = new Map();

// Rate limit configurations per endpoint type
const RATE_LIMITS = {
    // Authentication endpoints - strict limits
    auth: {
        windowMs: 15 * 60 * 1000,  // 15 minutes
        maxRequests: 20,           // 20 requests per window
        endpoints: ["/api/auth/login", "/api/auth/register", "/api/auth/request-reset", "/api/auth/send-verification", "/api/auth/check-duplicates"]
    },
    // Admin endpoints - moderate limits
    admin: {
        windowMs: 60 * 1000,       // 1 minute
        maxRequests: 60,           // 60 requests per minute
        endpoints: ["/api/admin/"]
    },
    // Financial endpoints - strict limits
    financial: {
        windowMs: 60 * 1000,       // 1 minute
        maxRequests: 30,           // 30 requests per minute
        endpoints: ["/api/wallet/withdraw", "/api/wallet/deposit", "/api/contributions", "/api/upload/"]
    },
    // General API - relaxed limits
    general: {
        windowMs: 60 * 1000,       // 1 minute
        maxRequests: 100,          // 100 requests per minute
        endpoints: ["default"]
    }
};

// Security headers configuration
const SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Permissions-Policy": "geolocation=(self), microphone=(), camera=(self)"
};

// Admin endpoints that require authentication
const PROTECTED_ADMIN_ENDPOINTS = [
    "/api/admin/dashboard/stats",
    "/api/admin/deposits/pending",
    "/api/admin/deposits/confirm",
    "/api/admin/deposits/reject",
    "/api/admin/contributions/pending",
    "/api/admin/payouts/pending",
    "/api/admin/payouts/history"
];

// Get client IP from request
function getClientIP(req) {
    return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
           req.headers["x-real-ip"] || 
           req.socket?.remoteAddress || 
           "unknown";
}

// Get rate limit config for endpoint
function getRateLimitConfig(pathname) {
    for (const [type, config] of Object.entries(RATE_LIMITS)) {
        if (type === "general") continue;
        for (const endpoint of config.endpoints) {
            if (pathname.startsWith(endpoint)) {
                return { type, ...config };
            }
        }
    }
    return { type: "general", ...RATE_LIMITS.general };
}

// Check rate limit
function checkRateLimit(ip, pathname) {
    const config = getRateLimitConfig(pathname);
    const key = `${ip}:${config.type}`;
    const now = Date.now();
    
    // Clean up old entries
    if (rateLimitStore.size > 10000) {
        for (const [k, v] of rateLimitStore) {
            if (now - v.windowStart > v.windowMs * 2) {
                rateLimitStore.delete(k);
            }
        }
    }
    
    let record = rateLimitStore.get(key);
    
    if (!record || now - record.windowStart > config.windowMs) {
        record = {
            windowStart: now,
            windowMs: config.windowMs,
            count: 1,
            maxRequests: config.maxRequests
        };
        rateLimitStore.set(key, record);
        return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
    }
    
    record.count++;
    
    if (record.count > config.maxRequests) {
        const resetIn = config.windowMs - (now - record.windowStart);
        return { 
            allowed: false, 
            remaining: 0, 
            resetIn,
            retryAfter: Math.ceil(resetIn / 1000)
        };
    }
    
    return { 
        allowed: true, 
        remaining: config.maxRequests - record.count,
        resetIn: config.windowMs - (now - record.windowStart)
    };
}

// Apply security headers to response
function applySecurityHeaders(res) {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
        res.setHeader(header, value);
    }
}

// Check if admin endpoint requires authentication
function requiresAdminAuth(pathname) {
    return PROTECTED_ADMIN_ENDPOINTS.some(ep => pathname.startsWith(ep));
}

// Export functions
module.exports = {
    getClientIP,
    checkRateLimit,
    applySecurityHeaders,
    requiresAdminAuth,
    SECURITY_HEADERS,
    RATE_LIMITS,
    PROTECTED_ADMIN_ENDPOINTS
};



// =============================================================================
// INPUT SANITIZATION
// =============================================================================

/**
 * Sanitizes a string by removing potentially dangerous HTML/JS
 */
function sanitizeString(str) {
    if (typeof str !== "string") return str;
    
    // Remove script tags and their contents
    let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    
    // Remove iframe tags
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
    
    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, "");
    
    // Escape HTML entities
    sanitized = sanitized
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    
    return sanitized;
}

/**
 * Recursively sanitizes all string values in an object
 */
function sanitizeData(data) {
    if (data === null || data === undefined) return data;
    
    if (typeof data === "string") {
        return sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }
    
    if (typeof data === "object") {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            const sanitizedKey = typeof key === "string" ? sanitizeString(key) : key;
            sanitized[sanitizedKey] = sanitizeData(value);
        }
        return sanitized;
    }
    
    return data;
}

/**
 * Validates email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone format (Honduras)
 */
function isValidPhone(phone) {
    const phoneRegex = /^(\+?504)?[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ""));
}

// Add to exports
module.exports.sanitizeString = sanitizeString;
module.exports.sanitizeData = sanitizeData;
module.exports.isValidEmail = isValidEmail;
module.exports.isValidPhone = isValidPhone;

// ===========================================
// PATH TRAVERSAL PROTECTION
// ===========================================

/**
 * Validates and sanitizes file paths to prevent path traversal attacks
 * @param {string} filename - The filename to validate
 * @param {string} allowedDir - The allowed base directory
 * @returns {object} { valid: boolean, sanitized: string, error?: string }
 */
function validateFilePath(filename, allowedDir) {
    if (!filename || typeof filename !== "string") {
        return { valid: false, sanitized: null, error: "Filename is required" };
    }
    
    // Remove any path traversal attempts
    const dangerous = ["../", "..\\", "..", "%2e%2e", "%252e"];
    let sanitized = filename;
    
    for (const pattern of dangerous) {
        while (sanitized.toLowerCase().includes(pattern.toLowerCase())) {
            sanitized = sanitized.replace(new RegExp(pattern, "gi"), "");
        }
    }
    
    // Only allow alphanumeric, dash, underscore, and dot
    sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    
    // Prevent hidden files
    if (sanitized.startsWith(".")) {
        sanitized = "_" + sanitized.substring(1);
    }
    
    // Limit length
    if (sanitized.length > 255) {
        sanitized = sanitized.substring(0, 255);
    }
    
    // Ensure it stays within allowed directory
    const path = require("path");
    const fullPath = path.join(allowedDir, sanitized);
    const resolvedPath = path.resolve(fullPath);
    
    if (!resolvedPath.startsWith(path.resolve(allowedDir))) {
        return { valid: false, sanitized: null, error: "Path traversal attempt detected" };
    }
    
    return { valid: true, sanitized: sanitized, fullPath: resolvedPath };
}

module.exports.validateFilePath = validateFilePath;

// ===========================================
// MIME TYPE / BASE64 VALIDATION
// ===========================================

// Allowed MIME types for uploads
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp"
];

const ALLOWED_DOCUMENT_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    "application/pdf"
];

/**
 * Validates base64 image/document data
 * @param {string} base64String - The base64 encoded data (with or without data URI prefix)
 * @param {string} type - "image" or "document"
 * @returns {object} { valid: boolean, mimeType?: string, error?: string }
 */
function validateBase64(base64String, type = "image") {
    if (!base64String || typeof base64String !== "string") {
        return { valid: false, error: "Base64 data is required" };
    }
    
    const allowedTypes = type === "document" ? ALLOWED_DOCUMENT_TYPES : ALLOWED_IMAGE_TYPES;
    let mimeType = null;
    let base64Data = base64String;
    
    // Check for data URI prefix
    const dataUriMatch = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (dataUriMatch) {
        mimeType = dataUriMatch[1].toLowerCase();
        base64Data = base64String.split(",")[1];
    } else {
        // Try to detect from magic bytes
        try {
            const buffer = Buffer.from(base64Data.substring(0, 16), "base64");
            
            // JPEG: FF D8 FF
            if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
                mimeType = "image/jpeg";
            }
            // PNG: 89 50 4E 47
            else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
                mimeType = "image/png";
            }
            // GIF: 47 49 46 38
            else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
                mimeType = "image/gif";
            }
            // PDF: 25 50 44 46 (%PDF)
            else if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
                mimeType = "application/pdf";
            }
            // WebP: 52 49 46 46 (RIFF)
            else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
                mimeType = "image/webp";
            }
        } catch (e) {
            return { valid: false, error: "Invalid base64 encoding" };
        }
    }
    
    if (!mimeType) {
        return { valid: false, error: "Could not detect file type" };
    }
    
    if (!allowedTypes.includes(mimeType)) {
        return { valid: false, error: "File type not allowed: " + mimeType, detectedType: mimeType };
    }
    
    // Validate base64 is properly formatted
    try {
        const decoded = Buffer.from(base64Data, "base64");
        if (decoded.length === 0) {
            return { valid: false, error: "Empty file data" };
        }
        // Max 10MB
        if (decoded.length > 10 * 1024 * 1024) {
            return { valid: false, error: "File too large (max 10MB)" };
        }
    } catch (e) {
        return { valid: false, error: "Invalid base64 encoding" };
    }
    
    return { valid: true, mimeType: mimeType };
}

module.exports.validateBase64 = validateBase64;
module.exports.ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;
module.exports.ALLOWED_DOCUMENT_TYPES = ALLOWED_DOCUMENT_TYPES;

// ===========================================
// TOKEN BLACKLIST (Redis-based)
// ===========================================

const redis = require("redis");
let redisClient = null;
let redisConnected = false;

// Initialize Redis connection for token blacklist
async function initTokenBlacklist() {
    try {
        redisClient = redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || "localhost",
                port: process.env.REDIS_PORT || 6379
            },
            password: process.env.REDIS_PASSWORD || undefined
        });
        
        redisClient.on("error", (err) => {
            redisConnected = false;
        });
        
        redisClient.on("connect", () => {
            redisConnected = true;
        });
        
        await redisClient.connect();
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Add a token to the blacklist
 * @param {string} token - The JWT token to blacklist
 * @param {number} expiresInSeconds - Time until token naturally expires
 * @returns {Promise<boolean>}
 */
async function blacklistToken(token, expiresInSeconds = 86400) {
    if (!redisConnected || !redisClient) {
        return false;
    }
    
    try {
        // Store token hash (not full token) for security
        const crypto = require("crypto");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        
        // Set with expiration matching token expiry
        await redisClient.setEx(
            "blacklist:" + tokenHash,
            expiresInSeconds,
            "1"
        );
        
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Check if a token is blacklisted
 * @param {string} token - The JWT token to check
 * @returns {Promise<boolean>} - True if blacklisted
 */
async function isTokenBlacklisted(token) {
    if (!redisConnected || !redisClient) {
        return false; // Allow if Redis is down (fail open for availability)
    }
    
    try {
        const crypto = require("crypto");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        
        const result = await redisClient.get("blacklist:" + tokenHash);
        return result === "1";
    } catch (err) {
        return false;
    }
}

module.exports.initTokenBlacklist = initTokenBlacklist;
module.exports.blacklistToken = blacklistToken;
module.exports.isTokenBlacklisted = isTokenBlacklisted;
