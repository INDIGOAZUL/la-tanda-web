const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');
const winston = require('winston');

// 物理修复 Issue #2: 实现分布式的、安全的 API 限流
let store;
try {
    const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    client.connect().catch(console.error);
    store = new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
    });
} catch (e) {
    winston.warn('Redis not available for rate limiting, falling back to MemoryStore');
}

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 10,
    store: store,
    message: { error: 'Too many authentication attempts, please try again in an hour' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    store: store,
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
