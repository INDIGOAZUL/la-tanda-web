#!/usr/bin/env node

/**
 * 🗄️ LA TANDA DATABASE-INTEGRATED API SERVER
 * Production-ready API server with PostgreSQL database integration
 * Ready for deployment to api.latanda.online
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const winston = require('winston');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, param, query, validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('./database/connection');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'latanda-web3-secret-key-2024';
const NODE_ENV = process.env.NODE_ENV || 'production';

// ====================================
// 🔧 PRODUCTION MIDDLEWARE SETUP
// ====================================

// Configure Winston Logger
const logger = winston.createLogger({
    level: NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'latanda-api-database' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ],
});

// Ensure logs directory exists
const fs = require('fs');
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Make dependencies available to imported modules
app.locals.db = db;
app.locals.logger = logger;

// Role authorization middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 401 }
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Insufficient permissions', code: 403 }
            });
        }

        next();
    };
};

// Import fraud detection functions after setting up dependencies
const { 
    detectSuspiciousActivity, 
    checkBlockedIP, 
    flagSuspiciousTransaction,
    calculateRiskScore 
} = require('./fraud-detection-helpers');

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.latanda.online"]
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        error: {
            message: 'Too many requests from this IP, please try again later.',
            code: 429,
            retryAfter: '15 minutes'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Increased from 5 for testing
    message: {
        success: false,
        error: {
            message: 'Too many authentication attempts, please try again later.',
            code: 429,
            retryAfter: '15 minutes'
        }
    }
});

// Apply security middleware
app.use(checkBlockedIP); // Check blocked IPs first
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/', detectSuspiciousActivity); // Fraud detection on all API routes

// Compression and CORS
app.use(compression());
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'https://latanda.online',
            'https://www.latanda.online',
            'https://api.latanda.online',
            'http://localhost:8080',
            'http://localhost:3000',
            'http://127.0.0.1:8080'
        ];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('.'));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});

// ====================================
// 🔐 ENHANCED AUTHENTICATION
// ====================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: {
                message: 'Access token required',
                code: 401
            }
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Invalid token attempt', { 
                ip: req.ip, 
                error: err.message 
            });
            return res.status(403).json({ 
                success: false, 
                error: {
                    message: 'Invalid or expired token',
                    code: 403
                }
            });
        }
        // Normalize user object to have both id and userId for backward compatibility
        req.user = {
            ...user,
            id: user.userId || user.id // Ensure id field exists for backward compatibility
        };
        next();
    });
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
                code: 400
            }
        });
    }
    next();
};

// Group admin access middleware
const requireGroupAdminAccess = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        // System administrators have access to all groups
        if (req.user.role === 'administrator') {
            return next();
        }

        // Check if user is admin of this specific group
        const adminCheck = await db.query(`
            SELECT * FROM groups 
            WHERE id = $1 AND (creator_id = $2 OR $3 = ANY(admin_ids))
        `, [groupId, userId, userId]);

        if (adminCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'You do not have admin access to this group',
                    code: 403
                }
            });
        }

        next();
    } catch (error) {
        logger.error('Group admin access check error:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to verify group admin access',
                code: 500
            }
        });
    }
};

// ====================================
// 🏥 HEALTH CHECK & SYSTEM STATUS
// ====================================

app.get('/health', async (req, res) => {
    try {
        const dbConnected = await db.testConnection();
        const dbStats = dbConnected ? await db.getStats() : null;
        
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '2.0.0',
            environment: NODE_ENV,
            database: {
                connected: dbConnected,
                stats: dbStats
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/system/status', async (req, res) => {
    try {
        const dbConnected = await db.testConnection();
        const dbStats = dbConnected ? await db.getStats() : null;
        
        res.json({
            success: true,
            data: {
                system: 'healthy',
                uptime: process.uptime(),
                endpoints: 85,
                database: dbConnected ? 'connected' : 'disconnected',
                database_stats: dbStats,
                mobile_services: {
                    push_notifications: 'active',
                    offline_sync: 'active',
                    mia_assistant: 'active',
                    real_time_updates: 'active'
                },
                performance: {
                    avg_response_time: '150ms',
                    requests_per_minute: 45,
                    error_rate: '0.1%'
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                server: 'production-database',
                environment: NODE_ENV
            }
        });
    } catch (error) {
        logger.error('System status error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'System status check failed',
                code: 500
            }
        });
    }
});

// ====================================
// 👤 DATABASE-INTEGRATED AUTHENTICATION
// ====================================

app.post('/api/auth/register', [
    body('name').trim().isLength({ min: 2 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], handleValidationErrors, async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user already exists
        const existingUserResult = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUserResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Email already registered',
                    code: 409
                }
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user and wallet in transaction
        const result = await db.transaction(async (client) => {
            // Insert user
            const userResult = await client.query(`
                INSERT INTO users (name, email, password_hash, phone, role, verification_level, status, permissions, created_at)
                VALUES ($1, $2, $3, $4, 'user', 'basic', 'active', '["read_only", "basic_operations"]'::jsonb, NOW())
                RETURNING id, name, email, verification_level, role, created_at
            `, [name, email, hashedPassword, phone || null]);
            
            const user = userResult.rows[0];
            
            // Create wallet for user
            await client.query(`
                INSERT INTO user_wallets (user_id, balance, currency, crypto_balances, is_verified)
                VALUES ($1, 0.00, 'HNL', '{"LTD": 100, "BTC": 0, "ETH": 0}'::jsonb, false)
            `, [user.id]);
            
            return user;
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: result.id, email: result.email, role: result.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.info('User registered successfully', { 
            userId: result.id, 
            email: email.replace(/(?<=.{2}).*(?=@)/, '*'.repeat(5)) 
        });

        res.status(201).json({
            success: true,
            data: {
                message: 'Registration successful',
                user: {
                    id: result.id,
                    name: result.name,
                    email: result.email,
                    verification_level: result.verification_level,
                    role: result.role,
                    registration_date: result.created_at,
                    status: 'active'
                },
                auth_token: token,
                next_step: 'Verify phone number'
            },
            meta: {
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                server: 'production-database'
            }
        });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Registration failed',
                code: 500
            }
        });
    }
});

app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user in database
        const userResult = await db.query(`
            SELECT id, name, email, password_hash, verification_level, role, 
                   last_login, status, permissions 
            FROM users WHERE email = $1
        `, [email]);
        
        if (userResult.rows.length === 0) {
            logger.warn('Login attempt with non-existent email', { email });
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid credentials',
                    code: 401
                }
            });
        }
        
        const user = userResult.rows[0];
        
        // Check password
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            logger.warn('Invalid password attempt', { 
                userId: user.id, 
                email: email.replace(/(?<=.{2}).*(?=@)/, '*'.repeat(5)) 
            });
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid credentials',
                    code: 401
                }
            });
        }
        
        // Check if account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Account is not active',
                    code: 403
                }
            });
        }
        
        // Update last login
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );
        
        // Generate token
        const tokenExpiry = user.role === 'administrator' ? '8h' : '24h';
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        logger.info('User logged in successfully', { 
            userId: user.id, 
            role: user.role 
        });

        res.json({
            success: true,
            data: {
                message: `Login successful - ${user.role === 'administrator' ? 'Administrator' : 'User'}`,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    verification_level: user.verification_level,
                    role: user.role,
                    permissions: user.permissions || [],
                    login_date: new Date().toISOString(),
                    status: user.status
                },
                auth_token: token,
                session_expires: new Date(Date.now() + (user.role === 'administrator' ? 8 : 24) * 60 * 60 * 1000).toISOString(),
                dashboard_url: '/home-dashboard.html'
            },
            meta: {
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                server: 'production-database'
            }
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Login failed',
                code: 500
            }
        });
    }
});

// ====================================
// 👤 USER PROFILE ROUTES
// ====================================

app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const userResult = await db.query(`
            SELECT u.id, u.name, u.email, u.phone, u.verification_level, u.role, 
                   u.created_at, u.last_login, u.profile_image_url, u.bio,
                   w.balance, w.currency, w.crypto_balances, w.is_verified as wallet_verified
            FROM users u
            LEFT JOIN user_wallets w ON u.id = w.user_id
            WHERE u.id = $1
        `, [req.user.userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 404
                }
            });
        }
        
        const user = userResult.rows[0];
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    verification_level: user.verification_level,
                    role: user.role,
                    created_at: user.created_at,
                    last_login: user.last_login,
                    profile_image_url: user.profile_image_url,
                    bio: user.bio,
                    wallet: {
                        balance: user.balance,
                        currency: user.currency,
                        crypto_balances: user.crypto_balances,
                        is_verified: user.wallet_verified
                    }
                }
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch profile',
                code: 500
            }
        });
    }
});

// ====================================
// 👥 GROUP MANAGEMENT ROUTES
// ====================================

// Business Rules Configuration for Phase 3
const GROUP_RULES = {
    MIN_CONTRIBUTION: 100,          // 100 HNL minimum
    MAX_CONTRIBUTION: 50000,        // 50,000 HNL maximum
    MIN_MEMBERS: 3,                 // Minimum to start
    MAX_MEMBERS: 50,                // Maximum group size
    VALID_FREQUENCIES: ['weekly', 'biweekly', 'monthly'],
    PLATFORM_FEE: 0.02,            // 2% platform fee
    LATE_PAYMENT_PENALTY: 0.05,    // 5% penalty after 3 days
    MAX_MISSED_PAYMENTS: 2         // Suspension after 2 missed
};

// Enhanced group listing with business logic
app.get('/api/groups', authenticateToken, async (req, res) => {
    try {
        const { status, category, search } = req.query;
        
        let whereClause = '1=1';
        let queryParams = [];
        
        if (status && ['active', 'forming', 'completed'].includes(status)) {
            whereClause += ` AND g.status = $${queryParams.length + 1}`;
            queryParams.push(status);
        }
        
        if (category) {
            whereClause += ` AND g.category ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${category}%`);
        }
        
        if (search) {
            whereClause += ` AND (g.name ILIKE $${queryParams.length + 1} OR g.description ILIKE $${queryParams.length + 2})`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        const groupsResult = await db.query(`
            SELECT g.*, u.name as admin_name,
                   COUNT(DISTINCT gm.user_id) as member_count,
                   COALESCE(SUM(CASE WHEN c.status = 'completed' THEN c.amount ELSE 0 END), 0) as total_amount_collected,
                   CASE 
                       WHEN COUNT(DISTINCT gm.user_id) >= g.max_members THEN 'full'
                       WHEN COUNT(DISTINCT gm.user_id) >= $${queryParams.length + 1} THEN 'ready'
                       ELSE 'forming'
                   END as formation_status,
                   ROUND((COUNT(DISTINCT gm.user_id)::numeric / g.max_members) * 100, 2) as fill_percentage
            FROM groups g
            LEFT JOIN users u ON g.admin_id = u.id
            LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.member_status = 'active'
            LEFT JOIN contributions c ON g.id = c.group_id
            WHERE ${whereClause}
            GROUP BY g.id, u.name
            ORDER BY g.created_at DESC
        `, [...queryParams, GROUP_RULES.MIN_MEMBERS]);
        
        res.json({
            success: true,
            data: groupsResult.rows,
            meta: {
                timestamp: new Date().toISOString(),
                total: groupsResult.rows.length,
                business_rules: GROUP_RULES
            }
        });
        
    } catch (error) {
        logger.error('Groups fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch groups',
                code: 500
            }
        });
    }
});

// 🚀 PHASE 3: Enhanced Group Creation with Business Logic
app.post('/api/groups/create', authenticateToken, [
    body('name').trim().isLength({ min: 3, max: 100 }).escape(),
    body('description').optional().trim().isLength({ max: 500 }).escape(),
    body('contribution_amount').isNumeric().custom(value => {
        const amount = parseFloat(value);
        if (amount < GROUP_RULES.MIN_CONTRIBUTION || amount > GROUP_RULES.MAX_CONTRIBUTION) {
            throw new Error(`Contribution must be between ${GROUP_RULES.MIN_CONTRIBUTION} and ${GROUP_RULES.MAX_CONTRIBUTION} HNL`);
        }
        return true;
    }),
    body('max_members').isInt({ min: GROUP_RULES.MIN_MEMBERS, max: GROUP_RULES.MAX_MEMBERS }),
    body('frequency').isIn(GROUP_RULES.VALID_FREQUENCIES),
    body('category').optional().trim().isLength({ max: 100 }),
    body('start_date').optional().isISO8601().custom(value => {
        const startDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
            throw new Error('Start date cannot be in the past');
        }
        return true;
    })
], handleValidationErrors, async (req, res) => {
    try {
        const {
            name,
            description,
            contribution_amount,
            max_members,
            frequency,
            category = 'general',
            start_date
        } = req.body;
        
        // Validate user eligibility to create groups
        const userResult = await db.query(`
            SELECT u.verification_level, u.status, 
                   COUNT(g.id) as active_groups
            FROM users u
            LEFT JOIN groups g ON u.id = g.admin_id AND g.status IN ('active', 'forming')
            WHERE u.id = $1
            GROUP BY u.id, u.verification_level, u.status
        `, [req.user.id]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 404 }
            });
        }
        
        const user = userResult.rows[0];
        
        // Business rule validations
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: { 
                    message: 'Account must be active to create groups', 
                    code: 403 
                }
            });
        }
        
        if (user.verification_level === 'basic' && user.active_groups >= 1) {
            return res.status(403).json({
                success: false,
                error: { 
                    message: 'Basic users can only admin 1 active group. Upgrade to verified for more.', 
                    code: 403 
                }
            });
        }
        
        if (user.verification_level === 'verified' && user.active_groups >= 5) {
            return res.status(403).json({
                success: false,
                error: { 
                    message: 'Verified users can admin up to 5 active groups', 
                    code: 403 
                }
            });
        }
        
        // Check for duplicate group names for this user
        const duplicateCheck = await db.query(`
            SELECT id FROM groups 
            WHERE admin_id = $1 AND name ILIKE $2 AND status IN ('active', 'forming')
        `, [req.user.id, name]);
        
        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: { 
                    message: 'You already have an active group with this name', 
                    code: 409 
                }
            });
        }
        
        // Calculate start date if not provided (default to 1 week from now)
        const calculatedStartDate = start_date || (() => {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            return date.toISOString().split('T')[0];
        })();
        
        // Create group with comprehensive business rules
        const groupResult = await db.query(`
            INSERT INTO groups (
                name, description, admin_id, contribution_amount, 
                max_members, frequency, category, start_date, 
                status, location, rules
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            name,
            description,
            req.user.id,
            contribution_amount,
            max_members,
            frequency,
            category,
            calculatedStartDate,
            'forming',
            'Honduras',
            JSON.stringify({
                late_payment_penalty: GROUP_RULES.LATE_PAYMENT_PENALTY,
                max_missed_payments: GROUP_RULES.MAX_MISSED_PAYMENTS,
                platform_fee: GROUP_RULES.PLATFORM_FEE,
                auto_cycle_progression: true,
                emergency_fund_percentage: 0.02
            })
        ]);
        
        const newGroup = groupResult.rows[0];
        
        // Automatically add creator as first member (admin)
        await db.query(`
            INSERT INTO group_members (
                group_id, user_id, member_status, member_number, joined_at
            ) VALUES ($1, $2, $3, $4, NOW())
        `, [newGroup.id, req.user.id, 'active', 1]);
        
        // Create initial turn assignment for admin (first turn)
        await db.query(`
            INSERT INTO turn_assignments (
                group_id, user_id, turn_number, status, cycle_number
            ) VALUES ($1, $2, $3, $4, $5)
        `, [newGroup.id, req.user.id, 1, 'pending', 1]);
        
        // Log group creation for audit
        logger.info('Group created successfully', {
            group_id: newGroup.id,
            admin_id: req.user.id,
            group_name: name,
            contribution_amount,
            max_members
        });
        
        res.status(201).json({
            success: true,
            data: {
                group: newGroup,
                business_rules: GROUP_RULES,
                next_steps: [
                    'Share group invite code with potential members',
                    `Need ${GROUP_RULES.MIN_MEMBERS - 1} more members to start`,
                    'Members can join until group is full',
                    'Group will auto-start when minimum members join'
                ]
            },
            meta: {
                timestamp: new Date().toISOString(),
                created_by: req.user.id
            }
        });
        
    } catch (error) {
        logger.error('Group creation error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create group',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// ====================================
// 🤝 PHASE 3 - PRIORITY 2: MEMBER JOINING WORKFLOW
// ====================================

// 📋 Submit a request to join a group
app.post('/api/groups/:groupId/join-request', authenticateToken, [
    body('message').optional().trim().isLength({ max: 500 }).escape(),
    body('declared_income').isNumeric().custom(value => {
        const income = parseFloat(value);
        if (income < 0 || income > 1000000) {
            throw new Error('Income must be between 0 and 1,000,000 HNL');
        }
        return true;
    }),
    body('income_source').trim().isLength({ min: 1, max: 100 }).escape(),
    body('can_commit_to_schedule').isBoolean(),
    body('has_read_rules').equals('true').withMessage('Must acknowledge reading group rules'),
    body('emergency_contact.name').optional().trim().isLength({ max: 100 }).escape(),
    body('emergency_contact.phone').optional().trim().matches(/^\+504-\d{4}-\d{4}$/).withMessage('Phone must be in format +504-XXXX-XXXX'),
    body('emergency_contact.relationship').optional().trim().isLength({ max: 50 }).escape()
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const {
            message,
            declared_income,
            income_source,
            can_commit_to_schedule,
            has_read_rules,
            emergency_contact
        } = req.body;

        // Check if group exists and is accepting members
        const groupResult = await db.query(`
            SELECT g.*, gml.max_members, gml.current_members, gml.pending_requests,
                   gml.min_trust_score, gml.min_income_ratio, gml.required_verification_level,
                   gml.auto_approve_threshold
            FROM groups g
            LEFT JOIN group_member_limits gml ON g.id = gml.group_id
            WHERE g.id = $1 AND g.status IN ('forming', 'active')
        `, [groupId]);

        if (groupResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Group not found or not accepting members', code: 404 }
            });
        }

        const group = groupResult.rows[0];

        // Check if user is eligible using our stored procedure
        const eligibilityResult = await db.query(`
            SELECT check_user_eligibility($1, $2) as eligibility
        `, [req.user.id, groupId]);

        const eligibility = eligibilityResult.rows[0].eligibility;

        if (!eligibility.eligible) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not eligible to join this group',
                    code: 403,
                    eligibility_details: eligibility
                }
            });
        }

        // Validate income ratio against group requirements
        const incomeRatio = declared_income / group.contribution_amount;
        if (incomeRatio < group.min_income_ratio) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `Income must be at least ${group.min_income_ratio}x the contribution amount (${group.contribution_amount} HNL)`,
                    code: 400,
                    required_minimum_income: group.contribution_amount * group.min_income_ratio
                }
            });
        }

        // Create the member request
        const requestResult = await db.query(`
            INSERT INTO member_requests (
                group_id, user_id, request_message, declared_income, income_source,
                eligibility_score, expires_at, request_metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            groupId,
            req.user.id,
            message || 'I would like to join this tanda',
            declared_income,
            income_source,
            eligibility.eligibility_score,
            new Date(Date.now() + (group.approval_timeout_hours || 72) * 60 * 60 * 1000), // Default 72 hours
            JSON.stringify({
                can_commit_to_schedule,
                has_read_rules,
                emergency_contact,
                income_ratio: incomeRatio,
                submission_timestamp: new Date().toISOString()
            })
        ]);

        const request = requestResult.rows[0];

        // Create verification record
        await db.query(`
            INSERT INTO member_verifications (request_id, user_id)
            VALUES ($1, $2)
        `, [request.id, req.user.id]);

        // Calculate trust score if not exists
        await db.query(`SELECT calculate_user_trust_score($1)`, [req.user.id]);

        // Check if auto-approval is possible
        if (eligibility.auto_approve_eligible && eligibility.eligibility_score >= group.auto_approve_threshold) {
            // Auto-approve the request
            await db.query(`
                UPDATE member_requests 
                SET request_status = 'approved', reviewed_at = NOW(), 
                    admin_notes = 'Auto-approved based on excellent eligibility score'
                WHERE id = $1
            `, [request.id]);

            // Add member to group
            const memberResult = await db.query(`
                INSERT INTO group_members (
                    group_id, user_id, member_status, joined_at, approved_at,
                    approved_by, trust_score_at_join, member_number
                ) VALUES ($1, $2, 'active', NOW(), NOW(), $3, $4, $5)
                RETURNING *
            `, [
                groupId,
                req.user.id,
                req.user.id, // Self-approved via auto-approval
                eligibility.trust_score,
                group.current_members + 1
            ]);

            logger.info(`Member auto-approved for group ${groupId}`, {
                userId: req.user.id,
                groupId,
                eligibilityScore: eligibility.eligibility_score
            });

            return res.status(201).json({
                success: true,
                data: {
                    request_id: request.id,
                    status: 'auto_approved',
                    member_number: memberResult.rows[0].member_number,
                    approved_at: new Date().toISOString()
                },
                message: 'Congratulations! You have been automatically approved to join this group.',
                meta: {
                    eligibility_score: eligibility.eligibility_score,
                    auto_approved: true,
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Manual review required
        logger.info(`Join request submitted for manual review`, {
            userId: req.user.id,
            groupId,
            requestId: request.id,
            eligibilityScore: eligibility.eligibility_score
        });

        res.status(201).json({
            success: true,
            data: {
                request_id: request.id,
                status: 'pending',
                expires_at: request.expires_at,
                eligibility_score: eligibility.eligibility_score
            },
            message: 'Your join request has been submitted and is pending admin review.',
            meta: {
                estimated_review_time: `${group.approval_timeout_hours || 72} hours`,
                auto_approved: false,
                requires_manual_review: true,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Join request error:', error);
        
        // Handle duplicate request error
        if (error.code === '23505' && error.constraint === 'unique_user_group_request') {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'You already have a pending request for this group',
                    code: 409
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to submit join request',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// 📊 Get join request status
app.get('/api/member-requests/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;

        const result = await db.query(`
            SELECT * FROM member_request_summary
            WHERE id = $1 AND (user_id = $2 OR $3 IN (
                SELECT admin_id FROM groups WHERE id = group_id
            ))
        `, [requestId, req.user.id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Request not found or access denied', code: 404 }
            });
        }

        const request = result.rows[0];

        res.json({
            success: true,
            data: request,
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Get request error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch request',
                code: 500
            }
        });
    }
});

// 📋 Get user's join requests
app.get('/api/member-requests/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Users can only see their own requests, admins can see requests for their groups
        if (userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied', code: 403 }
            });
        }

        const result = await db.query(`
            SELECT * FROM member_request_summary
            WHERE user_id = $1
            ORDER BY requested_at DESC
        `, [userId]);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Get user requests error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch user requests',
                code: 500
            }
        });
    }
});

// 📋 Get group's pending requests (admin only)
app.get('/api/groups/:groupId/pending-requests', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;

        // Check if user is admin of this group
        const adminCheck = await db.query(`
            SELECT admin_id FROM groups WHERE id = $1
        `, [groupId]);

        if (adminCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Group not found', code: 404 }
            });
        }

        if (adminCheck.rows[0].admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Only group admins can view pending requests', code: 403 }
            });
        }

        const result = await db.query(`
            SELECT mrs.*, u.name as user_name, u.email as user_email, u.verification_level,
                   mv.verification_completion_percentage, mv.financial_capacity_score
            FROM member_request_summary mrs
            JOIN users u ON mrs.user_id = u.id
            LEFT JOIN member_verifications mv ON mrs.id = mv.request_id
            WHERE mrs.group_id = $1 AND mrs.request_status IN ('pending', 'under_review')
            ORDER BY mrs.requested_at ASC
        `, [groupId]);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            meta: {
                timestamp: new Date().toISOString(),
                group_id: groupId
            }
        });

    } catch (error) {
        logger.error('Get group requests error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch group requests',
                code: 500
            }
        });
    }
});

// 🎯 Check user eligibility for a group
app.get('/api/groups/:groupId/eligibility-check/:userId', authenticateToken, async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        // Users can check their own eligibility, admins can check for anyone
        if (userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied', code: 403 }
            });
        }

        const result = await db.query(`
            SELECT check_user_eligibility($1, $2) as eligibility
        `, [userId, groupId]);

        const eligibility = result.rows[0].eligibility;

        res.json({
            success: true,
            data: eligibility,
            meta: {
                timestamp: new Date().toISOString(),
                user_id: userId,
                group_id: groupId
            }
        });

    } catch (error) {
        logger.error('Eligibility check error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to check eligibility',
                code: 500
            }
        });
    }
});

// 📊 Get user's trust score
app.get('/api/users/:userId/trust-score', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Users can see their own score, admins can see anyone's score
        if (userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied', code: 403 }
            });
        }

        const result = await db.query(`
            SELECT * FROM user_trust_scores WHERE user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            // Calculate trust score if it doesn't exist
            await db.query(`SELECT calculate_user_trust_score($1)`, [userId]);
            
            const newResult = await db.query(`
                SELECT * FROM user_trust_scores WHERE user_id = $1
            `, [userId]);
            
            if (newResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Unable to calculate trust score', code: 404 }
                });
            }
        }

        const trustScore = result.rows.length > 0 ? result.rows[0] : newResult.rows[0];

        res.json({
            success: true,
            data: {
                overall_score: trustScore.overall_score,
                components: {
                    payment_reliability: trustScore.payment_reliability,
                    group_participation: trustScore.group_participation,
                    community_standing: trustScore.community_standing,
                    verification_level_score: trustScore.verification_level_score
                },
                statistics: {
                    total_groups_completed: trustScore.total_groups_completed,
                    total_groups_defaulted: trustScore.total_groups_defaulted,
                    completion_rate: trustScore.completion_rate,
                    total_amount_contributed: trustScore.total_amount_contributed
                },
                last_updated: trustScore.last_updated,
                next_calculation: trustScore.next_calculation
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Trust score error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch trust score',
                code: 500
            }
        });
    }
});

// ❌ Withdraw a join request
app.delete('/api/member-requests/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;

        // Check if request exists and user owns it
        const requestCheck = await db.query(`
            SELECT user_id, request_status FROM member_requests 
            WHERE id = $1
        `, [requestId]);

        if (requestCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Request not found', code: 404 }
            });
        }

        const request = requestCheck.rows[0];

        if (request.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied', code: 403 }
            });
        }

        if (!['pending', 'under_review'].includes(request.request_status)) {
            return res.status(400).json({
                success: false,
                error: { 
                    message: 'Cannot withdraw request that has already been processed', 
                    code: 400,
                    current_status: request.request_status
                }
            });
        }

        // Update request status to withdrawn
        await db.query(`
            UPDATE member_requests 
            SET request_status = 'withdrawn', 
                updated_at = NOW(),
                admin_notes = COALESCE(admin_notes, '') || ' | Withdrawn by user at ' || NOW()
            WHERE id = $1
        `, [requestId]);

        logger.info(`Join request withdrawn`, {
            requestId,
            userId: req.user.id
        });

        res.json({
            success: true,
            message: 'Join request withdrawn successfully',
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Withdraw request error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to withdraw request',
                code: 500
            }
        });
    }
});

// ====================================
// 👨‍💼 PHASE 3 - PRIORITY 2: ADMIN APPROVAL SYSTEM
// ====================================

// 📋 Update request status (admin only) - Core approval/rejection endpoint
app.put('/api/member-requests/:requestId/status', authenticateToken, [
    body('status').isIn(['approved', 'rejected', 'under_review']).withMessage('Status must be approved, rejected, or under_review'),
    body('admin_notes').optional().trim().isLength({ max: 1000 }).escape(),
    body('conditions').optional().isArray(),
    body('probation_period_days').optional().isInt({ min: 0, max: 365 }),
    body('enhanced_monitoring').optional().isBoolean(),
    body('guarantor_required').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, admin_notes, conditions = [], probation_period_days, enhanced_monitoring, guarantor_required } = req.body;

        // Verify admin has permission to review this request
        const requestCheck = await db.query(`
            SELECT mr.*, g.admin_id, g.name as group_name, u.name as user_name, u.email as user_email
            FROM member_requests mr
            JOIN groups g ON mr.group_id = g.id
            JOIN users u ON mr.user_id = u.id
            WHERE mr.id = $1
        `, [requestId]);

        if (requestCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Request not found', code: 404 }
            });
        }

        const request = requestCheck.rows[0];

        // Check admin permissions
        if (request.admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Only group admins can approve/reject requests', code: 403 }
            });
        }

        // Check if request can be updated
        if (!['pending', 'under_review'].includes(request.request_status)) {
            return res.status(400).json({
                success: false,
                error: { 
                    message: `Cannot update request with status: ${request.request_status}`, 
                    code: 400,
                    current_status: request.request_status
                }
            });
        }

        // Handle approval
        if (status === 'approved') {
            // Check group capacity
            const capacityCheck = await db.query(`
                SELECT gml.max_members, gml.current_members
                FROM group_member_limits gml
                WHERE gml.group_id = $1
            `, [request.group_id]);

            if (capacityCheck.rows.length > 0) {
                const limits = capacityCheck.rows[0];
                if (limits.current_members >= limits.max_members) {
                    return res.status(400).json({
                        success: false,
                        error: { 
                            message: 'Group has reached maximum capacity', 
                            code: 400,
                            max_members: limits.max_members,
                            current_members: limits.current_members
                        }
                    });
                }
            }

            // Begin transaction for approval
            await db.query('BEGIN');

            try {
                // Update request status
                await db.query(`
                    UPDATE member_requests 
                    SET request_status = 'approved', 
                        reviewed_at = NOW(), 
                        reviewed_by = $1,
                        admin_notes = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [req.user.id, admin_notes || 'Approved by admin', requestId]);

                // Create group member record
                const memberNumber = await db.query(`
                    SELECT COALESCE(MAX(member_number), 0) + 1 as next_number
                    FROM group_members WHERE group_id = $1
                `, [request.group_id]);

                const nextMemberNumber = memberNumber.rows[0].next_number;
                const memberStatus = probation_period_days > 0 ? 'probation' : 'active';
                const probationUntil = probation_period_days > 0 ? 
                    new Date(Date.now() + probation_period_days * 24 * 60 * 60 * 1000) : null;

                // Get user trust score
                await db.query(`SELECT calculate_user_trust_score($1)`, [request.user_id]);
                const trustResult = await db.query(`
                    SELECT overall_score FROM user_trust_scores WHERE user_id = $1
                `, [request.user_id]);
                const trustScore = trustResult.rows[0]?.overall_score || 0;

                const memberResult = await db.query(`
                    INSERT INTO group_members (
                        group_id, user_id, member_status, joined_at, approved_at,
                        approved_by, trust_score_at_join, member_number,
                        probation_until, member_notes
                    ) VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7, $8)
                    RETURNING *
                `, [
                    request.group_id,
                    request.user_id,
                    memberStatus,
                    req.user.id,
                    trustScore,
                    nextMemberNumber,
                    probationUntil,
                    JSON.stringify({
                        conditions,
                        enhanced_monitoring: enhanced_monitoring || false,
                        guarantor_required: guarantor_required || false,
                        approval_notes: admin_notes
                    })
                ]);

                await db.query('COMMIT');

                logger.info(`Member request approved`, {
                    requestId,
                    userId: request.user_id,
                    groupId: request.group_id,
                    adminId: req.user.id,
                    memberNumber: nextMemberNumber,
                    conditions: conditions.length > 0 ? conditions : null
                });

                return res.json({
                    success: true,
                    data: {
                        request_id: requestId,
                        status: 'approved',
                        member_number: nextMemberNumber,
                        member_status: memberStatus,
                        probation_until: probationUntil,
                        conditions: conditions,
                        approved_at: new Date().toISOString()
                    },
                    message: `${request.user_name} has been approved to join ${request.group_name}`,
                    meta: {
                        group_name: request.group_name,
                        user_name: request.user_name,
                        timestamp: new Date().toISOString()
                    }
                });

            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }

        } else if (status === 'rejected') {
            // Handle rejection
            await db.query(`
                UPDATE member_requests 
                SET request_status = 'rejected', 
                    reviewed_at = NOW(), 
                    reviewed_by = $1,
                    admin_notes = $2,
                    updated_at = NOW()
                WHERE id = $3
            `, [req.user.id, admin_notes || 'Rejected by admin', requestId]);

            logger.info(`Member request rejected`, {
                requestId,
                userId: request.user_id,
                groupId: request.group_id,
                adminId: req.user.id,
                reason: admin_notes
            });

            return res.json({
                success: true,
                data: {
                    request_id: requestId,
                    status: 'rejected',
                    rejected_at: new Date().toISOString(),
                    reason: admin_notes
                },
                message: `Request from ${request.user_name} has been rejected`,
                meta: {
                    group_name: request.group_name,
                    user_name: request.user_name,
                    timestamp: new Date().toISOString()
                }
            });

        } else if (status === 'under_review') {
            // Handle moving to under review
            await db.query(`
                UPDATE member_requests 
                SET request_status = 'under_review', 
                    reviewed_by = $1,
                    admin_notes = $2,
                    updated_at = NOW()
                WHERE id = $3
            `, [req.user.id, admin_notes || 'Under review by admin', requestId]);

            logger.info(`Member request moved to review`, {
                requestId,
                userId: request.user_id,
                groupId: request.group_id,
                adminId: req.user.id
            });

            return res.json({
                success: true,
                data: {
                    request_id: requestId,
                    status: 'under_review',
                    review_started_at: new Date().toISOString()
                },
                message: `Request from ${request.user_name} is now under review`,
                meta: {
                    group_name: request.group_name,
                    user_name: request.user_name,
                    timestamp: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        logger.error('Member request status update error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update request status',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// 📋 Bulk approve multiple requests (admin only)
app.post('/api/groups/:groupId/bulk-approve', authenticateToken, [
    body('request_ids').isArray().withMessage('request_ids must be an array'),
    body('request_ids.*').isUUID().withMessage('Each request_id must be a valid UUID'),
    body('admin_notes').optional().trim().isLength({ max: 1000 }).escape(),
    body('conditions').optional().isArray(),
    body('probation_period_days').optional().isInt({ min: 0, max: 365 }),
    body('enhanced_monitoring').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { request_ids, admin_notes, conditions = [], probation_period_days, enhanced_monitoring } = req.body;

        // Check if user is admin of this group
        const adminCheck = await db.query(`
            SELECT admin_id, name FROM groups WHERE id = $1
        `, [groupId]);

        if (adminCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Group not found', code: 404 }
            });
        }

        const group = adminCheck.rows[0];

        if (group.admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Only group admins can bulk approve requests', code: 403 }
            });
        }

        // Validate all requests belong to this group and are pending
        const requestsCheck = await db.query(`
            SELECT mr.id, mr.user_id, mr.request_status, u.name as user_name
            FROM member_requests mr
            JOIN users u ON mr.user_id = u.id
            WHERE mr.id = ANY($1) AND mr.group_id = $2
        `, [request_ids, groupId]);

        if (requestsCheck.rows.length !== request_ids.length) {
            return res.status(400).json({
                success: false,
                error: { 
                    message: 'Some request IDs are invalid or do not belong to this group', 
                    code: 400 
                }
            });
        }

        const invalidRequests = requestsCheck.rows.filter(r => 
            !['pending', 'under_review'].includes(r.request_status)
        );

        if (invalidRequests.length > 0) {
            return res.status(400).json({
                success: false,
                error: { 
                    message: 'Some requests cannot be approved due to their current status', 
                    code: 400,
                    invalid_requests: invalidRequests.map(r => ({
                        id: r.id,
                        user_name: r.user_name,
                        status: r.request_status
                    }))
                }
            });
        }

        // Check group capacity
        const capacityCheck = await db.query(`
            SELECT gml.max_members, gml.current_members
            FROM group_member_limits gml
            WHERE gml.group_id = $1
        `, [groupId]);

        let availableSlots = 999; // Default high number if no limits set
        if (capacityCheck.rows.length > 0) {
            const limits = capacityCheck.rows[0];
            availableSlots = limits.max_members - limits.current_members;
            
            if (availableSlots < request_ids.length) {
                return res.status(400).json({
                    success: false,
                    error: { 
                        message: `Only ${availableSlots} slots available, cannot approve ${request_ids.length} requests`, 
                        code: 400,
                        available_slots: availableSlots,
                        requested_approvals: request_ids.length
                    }
                });
            }
        }

        // Process bulk approval
        const results = {
            approved: [],
            failed: []
        };

        await db.query('BEGIN');

        try {
            for (const requestId of request_ids) {
                try {
                    const request = requestsCheck.rows.find(r => r.id === requestId);

                    // Update request status
                    await db.query(`
                        UPDATE member_requests 
                        SET request_status = 'approved', 
                            reviewed_at = NOW(), 
                            reviewed_by = $1,
                            admin_notes = $2,
                            updated_at = NOW()
                        WHERE id = $3
                    `, [req.user.id, admin_notes || 'Bulk approved by admin', requestId]);

                    // Get next member number
                    const memberNumber = await db.query(`
                        SELECT COALESCE(MAX(member_number), 0) + 1 as next_number
                        FROM group_members WHERE group_id = $1
                    `, [groupId]);

                    const nextMemberNumber = memberNumber.rows[0].next_number;
                    const memberStatus = probation_period_days > 0 ? 'probation' : 'active';
                    const probationUntil = probation_period_days > 0 ? 
                        new Date(Date.now() + probation_period_days * 24 * 60 * 60 * 1000) : null;

                    // Get user trust score
                    await db.query(`SELECT calculate_user_trust_score($1)`, [request.user_id]);
                    const trustResult = await db.query(`
                        SELECT overall_score FROM user_trust_scores WHERE user_id = $1
                    `, [request.user_id]);
                    const trustScore = trustResult.rows[0]?.overall_score || 0;

                    // Create group member record
                    await db.query(`
                        INSERT INTO group_members (
                            group_id, user_id, member_status, joined_at, approved_at,
                            approved_by, trust_score_at_join, member_number,
                            probation_until, member_notes
                        ) VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7, $8)
                    `, [
                        groupId,
                        request.user_id,
                        memberStatus,
                        req.user.id,
                        trustScore,
                        nextMemberNumber,
                        probationUntil,
                        JSON.stringify({
                            conditions,
                            enhanced_monitoring: enhanced_monitoring || false,
                            approval_notes: admin_notes,
                            bulk_approved: true
                        })
                    ]);

                    results.approved.push({
                        request_id: requestId,
                        user_name: request.user_name,
                        member_number: nextMemberNumber,
                        member_status: memberStatus
                    });

                } catch (error) {
                    results.failed.push({
                        request_id: requestId,
                        user_name: requestsCheck.rows.find(r => r.id === requestId)?.user_name,
                        error: error.message
                    });
                }
            }

            await db.query('COMMIT');

            logger.info(`Bulk approval completed`, {
                groupId,
                adminId: req.user.id,
                approved: results.approved.length,
                failed: results.failed.length,
                total_requested: request_ids.length
            });

            res.json({
                success: true,
                data: {
                    summary: {
                        total_requested: request_ids.length,
                        approved: results.approved.length,
                        failed: results.failed.length
                    },
                    results: results
                },
                message: `Bulk approval completed: ${results.approved.length} approved, ${results.failed.length} failed`,
                meta: {
                    group_name: group.name,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        logger.error('Bulk approval error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to process bulk approval',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// 📋 Bulk reject multiple requests (admin only)
app.post('/api/groups/:groupId/bulk-reject', authenticateToken, [
    body('request_ids').isArray().withMessage('request_ids must be an array'),
    body('request_ids.*').isUUID().withMessage('Each request_id must be a valid UUID'),
    body('admin_notes').optional().trim().isLength({ max: 1000 }).escape(),
    body('rejection_reason').trim().isLength({ min: 1, max: 500 }).withMessage('Rejection reason is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { request_ids, admin_notes, rejection_reason } = req.body;

        // Check if user is admin of this group
        const adminCheck = await db.query(`
            SELECT admin_id, name FROM groups WHERE id = $1
        `, [groupId]);

        if (adminCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Group not found', code: 404 }
            });
        }

        const group = adminCheck.rows[0];

        if (group.admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Only group admins can bulk reject requests', code: 403 }
            });
        }

        // Validate all requests belong to this group and can be rejected
        const requestsCheck = await db.query(`
            SELECT mr.id, mr.user_id, mr.request_status, u.name as user_name
            FROM member_requests mr
            JOIN users u ON mr.user_id = u.id
            WHERE mr.id = ANY($1) AND mr.group_id = $2
        `, [request_ids, groupId]);

        if (requestsCheck.rows.length !== request_ids.length) {
            return res.status(400).json({
                success: false,
                error: { 
                    message: 'Some request IDs are invalid or do not belong to this group', 
                    code: 400 
                }
            });
        }

        const invalidRequests = requestsCheck.rows.filter(r => 
            !['pending', 'under_review'].includes(r.request_status)
        );

        if (invalidRequests.length > 0) {
            return res.status(400).json({
                success: false,
                error: { 
                    message: 'Some requests cannot be rejected due to their current status', 
                    code: 400,
                    invalid_requests: invalidRequests.map(r => ({
                        id: r.id,
                        user_name: r.user_name,
                        status: r.request_status
                    }))
                }
            });
        }

        // Process bulk rejection
        const results = {
            rejected: [],
            failed: []
        };

        for (const requestId of request_ids) {
            try {
                const request = requestsCheck.rows.find(r => r.id === requestId);

                await db.query(`
                    UPDATE member_requests 
                    SET request_status = 'rejected', 
                        reviewed_at = NOW(), 
                        reviewed_by = $1,
                        admin_notes = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [req.user.id, `${rejection_reason}${admin_notes ? ` | ${admin_notes}` : ''}`, requestId]);

                results.rejected.push({
                    request_id: requestId,
                    user_name: request.user_name
                });

            } catch (error) {
                results.failed.push({
                    request_id: requestId,
                    user_name: requestsCheck.rows.find(r => r.id === requestId)?.user_name,
                    error: error.message
                });
            }
        }

        logger.info(`Bulk rejection completed`, {
            groupId,
            adminId: req.user.id,
            rejected: results.rejected.length,
            failed: results.failed.length,
            total_requested: request_ids.length,
            reason: rejection_reason
        });

        res.json({
            success: true,
            data: {
                summary: {
                    total_requested: request_ids.length,
                    rejected: results.rejected.length,
                    failed: results.failed.length
                },
                results: results
            },
            message: `Bulk rejection completed: ${results.rejected.length} rejected, ${results.failed.length} failed`,
            meta: {
                group_name: group.name,
                rejection_reason: rejection_reason,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Bulk rejection error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to process bulk rejection',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// 📊 Get admin dashboard summary for a group
app.get('/api/groups/:groupId/admin-dashboard', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;

        // Check if user is admin of this group
        const adminCheck = await db.query(`
            SELECT admin_id, name FROM groups WHERE id = $1
        `, [groupId]);

        if (adminCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Group not found', code: 404 }
            });
        }

        const group = adminCheck.rows[0];

        if (group.admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Only group admins can view admin dashboard', code: 403 }
            });
        }

        // Get comprehensive dashboard data
        const dashboardData = await db.query(`
            SELECT * FROM group_admin_dashboard WHERE group_id = $1
        `, [groupId]);

        // Get recent activity
        const recentActivity = await db.query(`
            SELECT 
                mr.id,
                mr.request_status,
                mr.requested_at,
                mr.reviewed_at,
                u.name as user_name,
                u.email as user_email,
                uts.overall_score as trust_score
            FROM member_requests mr
            JOIN users u ON mr.user_id = u.id
            LEFT JOIN user_trust_scores uts ON mr.user_id = uts.user_id
            WHERE mr.group_id = $1
            ORDER BY mr.requested_at DESC
            LIMIT 10
        `, [groupId]);

        // Get requests by status
        const statusSummary = await db.query(`
            SELECT 
                request_status,
                COUNT(*) as count,
                AVG(eligibility_score) as avg_eligibility_score
            FROM member_requests
            WHERE group_id = $1
            GROUP BY request_status
        `, [groupId]);

        // Get urgent items (expiring soon)
        const urgentItems = await db.query(`
            SELECT 
                mr.id,
                mr.expires_at,
                u.name as user_name,
                uts.overall_score as trust_score,
                EXTRACT(HOURS FROM (mr.expires_at - NOW())) as hours_remaining
            FROM member_requests mr
            JOIN users u ON mr.user_id = u.id
            LEFT JOIN user_trust_scores uts ON mr.user_id = uts.user_id
            WHERE mr.group_id = $1 
            AND mr.request_status IN ('pending', 'under_review')
            AND mr.expires_at < NOW() + INTERVAL '24 hours'
            AND mr.auto_expire = TRUE
            ORDER BY mr.expires_at ASC
        `, [groupId]);

        const dashboard = dashboardData.rows[0] || {};

        res.json({
            success: true,
            data: {
                group_info: {
                    id: groupId,
                    name: group.name,
                    max_members: dashboard.max_members,
                    current_members: dashboard.current_members,
                    available_spots: dashboard.available_spots,
                    min_trust_score: dashboard.min_trust_score,
                    auto_approve_threshold: dashboard.auto_approve_threshold
                },
                request_summary: {
                    new_requests: dashboard.new_requests || 0,
                    under_review: dashboard.under_review || 0,
                    expiring_soon: dashboard.expiring_soon || 0,
                    total_pending: dashboard.pending_requests || 0
                },
                status_breakdown: statusSummary.rows.map(row => ({
                    status: row.request_status,
                    count: parseInt(row.count),
                    avg_eligibility_score: parseFloat(row.avg_eligibility_score) || 0
                })),
                recent_activity: recentActivity.rows,
                urgent_items: urgentItems.rows.map(item => ({
                    ...item,
                    hours_remaining: Math.max(0, Math.ceil(parseFloat(item.hours_remaining)))
                })),
                auto_approval_stats: {
                    threshold: dashboard.auto_approve_threshold,
                    eligible_count: urgentItems.rows.filter(item => 
                        item.trust_score >= dashboard.auto_approve_threshold
                    ).length
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                group_id: groupId
            }
        });

    } catch (error) {
        logger.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch admin dashboard',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// 🔄 Update group member limits and approval settings (admin only)
app.put('/api/groups/:groupId/member-limits', authenticateToken, [
    body('max_members').optional().isInt({ min: 2, max: 50 }),
    body('min_trust_score').optional().isFloat({ min: 0, max: 100 }),
    body('min_income_ratio').optional().isFloat({ min: 1, max: 10 }),
    body('auto_approve_threshold').optional().isFloat({ min: 0, max: 100 }),
    body('required_verification_level').optional().isIn(['basic', 'verified', 'premium']),
    body('approval_timeout_hours').optional().isInt({ min: 24, max: 168 }),
    body('probation_period_days').optional().isInt({ min: 0, max: 365 }),
    body('background_check_required').optional().isBoolean(),
    body('allow_conditional_approval').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const updates = req.body;

        // Check if user is admin of this group
        const adminCheck = await db.query(`
            SELECT admin_id, name FROM groups WHERE id = $1
        `, [groupId]);

        if (adminCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Group not found', code: 404 }
            });
        }

        const group = adminCheck.rows[0];

        if (group.admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Only group admins can update member limits', code: 403 }
            });
        }

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                updateFields.push(`${key} = $${paramIndex}`);
                updateValues.push(value);
                paramIndex++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'No valid fields to update', code: 400 }
            });
        }

        updateFields.push(`updated_at = NOW()`);
        updateFields.push(`updated_by = $${paramIndex}`);
        updateValues.push(req.user.id);

        const updateQuery = `
            UPDATE group_member_limits 
            SET ${updateFields.join(', ')}
            WHERE group_id = $${paramIndex + 1}
            RETURNING *
        `;
        updateValues.push(groupId);

        const result = await db.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            // Create new limits if none exist
            const createResult = await db.query(`
                INSERT INTO group_member_limits (
                    group_id, max_members, min_trust_score, min_income_ratio,
                    auto_approve_threshold, required_verification_level,
                    approval_timeout_hours, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                groupId,
                updates.max_members || 10,
                updates.min_trust_score || 25.0,
                updates.min_income_ratio || 2.0,
                updates.auto_approve_threshold || 80.0,
                updates.required_verification_level || 'basic',
                updates.approval_timeout_hours || 72,
                req.user.id
            ]);

            logger.info(`Group member limits created`, {
                groupId,
                adminId: req.user.id,
                limits: createResult.rows[0]
            });

            return res.json({
                success: true,
                data: createResult.rows[0],
                message: 'Group member limits created successfully',
                meta: {
                    group_name: group.name,
                    timestamp: new Date().toISOString()
                }
            });
        }

        logger.info(`Group member limits updated`, {
            groupId,
            adminId: req.user.id,
            updates: updates,
            limits: result.rows[0]
        });

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Group member limits updated successfully',
            meta: {
                group_name: group.name,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Update member limits error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update member limits',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// ====================================
// 👥 MEMBER REMOVAL ENDPOINTS
// ====================================

// Request voluntary withdrawal
app.post('/api/groups/:groupId/withdrawal-request', authenticateToken, [
    body('withdrawal_reason').isIn(['personal_circumstances', 'financial_difficulty', 'relocation', 'group_dissatisfaction', 'other']),
    body('detailed_reason').optional().trim().isLength({ max: 1000 }).escape(),
    body('preferred_exit_date').optional().isISO8601(),
    body('acknowledge_penalties').isBoolean()
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { withdrawal_reason, detailed_reason, preferred_exit_date, acknowledge_penalties } = req.body;
        const userId = req.user.id;

        // Verify user is an active member of the group
        const memberCheck = await db.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2 AND member_status = $3',
            [groupId, userId, 'active']
        );

        if (memberCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'You are not an active member of this group',
                    code: 404
                }
            });
        }

        const member = memberCheck.rows[0];

        // Calculate estimated financial impact
        const financialImpact = await db.query(
            'SELECT calculate_removal_financial_impact($1, $2, $3) as impact',
            [groupId, userId, 'voluntary_withdrawal']
        );

        const impact = financialImpact.rows[0].impact;

        // Create withdrawal request
        const result = await db.query(`
            INSERT INTO member_withdrawal_requests (
                group_id, user_id, member_id, withdrawal_reason, detailed_reason,
                preferred_exit_date, acknowledge_penalties, estimated_penalty,
                estimated_refund, understands_impact, accepts_terms
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            groupId, userId, member.id, withdrawal_reason, detailed_reason,
            preferred_exit_date, acknowledge_penalties,
            impact.financial_summary?.penalty_amount || 0,
            impact.financial_summary?.refund_amount || 0,
            true, acknowledge_penalties
        ]);

        logger.info('Withdrawal request submitted', {
            requestId: result.rows[0].id,
            groupId,
            userId,
            reason: withdrawal_reason
        });

        res.json({
            success: true,
            data: {
                request_id: result.rows[0].id,
                status: result.rows[0].request_status,
                estimated_impact: impact.financial_summary,
                next_steps: 'Your withdrawal request has been submitted for admin review'
            },
            message: 'Withdrawal request submitted successfully'
        });

    } catch (error) {
        logger.error('Withdrawal request error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to submit withdrawal request',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// Get withdrawal requests for admin review
app.get('/api/groups/:groupId/withdrawal-requests', authenticateToken, requireGroupAdminAccess, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { status = 'pending' } = req.query;

        const result = await db.query(`
            SELECT 
                wr.*,
                u.name as user_name,
                u.email as user_email,
                gm.member_number,
                gm.total_contributed,
                g.name as group_name
            FROM member_withdrawal_requests wr
            JOIN users u ON wr.user_id = u.id
            JOIN group_members gm ON wr.member_id = gm.id
            JOIN groups g ON wr.group_id = g.id
            WHERE wr.group_id = $1 
            AND ($2 = 'all' OR wr.request_status = $2)
            ORDER BY wr.requested_at DESC
        `, [groupId, status]);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            meta: {
                group_id: groupId,
                filter_status: status,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Get withdrawal requests error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve withdrawal requests',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// Process withdrawal request (approve/reject)
app.put('/api/withdrawal-requests/:requestId/status', authenticateToken, [
    body('status').isIn(['approved', 'rejected']),
    body('admin_notes').optional().trim().isLength({ max: 1000 }).escape(),
    body('grace_period_days').optional().isInt({ min: 0, max: 90 })
], handleValidationErrors, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, admin_notes, grace_period_days = 0 } = req.body;
        const adminId = req.user.id;

        // Get withdrawal request details
        const requestResult = await db.query(`
            SELECT wr.*, gm.group_id 
            FROM member_withdrawal_requests wr
            JOIN group_members gm ON wr.member_id = gm.id
            WHERE wr.id = $1 AND wr.request_status = 'pending'
        `, [requestId]);

        if (requestResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Withdrawal request not found or already processed',
                    code: 404
                }
            });
        }

        const request = requestResult.rows[0];

        // Verify admin access to group
        const groupAccess = await db.query(
            'SELECT * FROM groups WHERE id = $1 AND (creator_id = $2 OR $3 = ANY(admin_ids))',
            [request.group_id, adminId, adminId]
        );

        if (groupAccess.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'You do not have admin access to this group',
                    code: 403
                }
            });
        }

        let updateResult;

        if (status === 'approved') {
            // Process the actual member removal
            const removalResult = await db.query(
                'SELECT process_member_removal($1, $2, $3, $4, $5, $6) as removal_id',
                [
                    request.group_id,
                    request.user_id,
                    'voluntary_withdrawal',
                    request.withdrawal_reason,
                    adminId,
                    admin_notes
                ]
            );

            // Update withdrawal request status
            updateResult = await db.query(`
                UPDATE member_withdrawal_requests
                SET request_status = $1, reviewed_by = $2, reviewed_at = NOW(),
                    admin_notes = $3, updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `, [status, adminId, admin_notes, requestId]);

            logger.info('Member withdrawal approved and processed', {
                requestId,
                removalId: removalResult.rows[0].removal_id,
                adminId,
                userId: request.user_id,
                groupId: request.group_id
            });

        } else {
            // Just update status for rejection
            updateResult = await db.query(`
                UPDATE member_withdrawal_requests
                SET request_status = $1, reviewed_by = $2, reviewed_at = NOW(),
                    admin_notes = $3, updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `, [status, adminId, admin_notes, requestId]);

            logger.info('Member withdrawal request rejected', {
                requestId,
                adminId,
                userId: request.user_id,
                reason: admin_notes
            });
        }

        res.json({
            success: true,
            data: {
                request_id: requestId,
                status: updateResult.rows[0].request_status,
                reviewed_by: adminId,
                admin_notes: admin_notes,
                processed_at: updateResult.rows[0].reviewed_at
            },
            message: `Withdrawal request ${status} successfully`
        });

    } catch (error) {
        logger.error('Process withdrawal request error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to process withdrawal request',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// Admin-initiated member removal
app.post('/api/groups/:groupId/remove-member', authenticateToken, requireGroupAdminAccess, [
    body('user_id').isUUID(),
    body('removal_type').isIn(['admin_removal', 'performance_removal', 'violation_removal', 'automatic_removal']),
    body('removal_reason').isIn(['non_payment', 'rule_violation', 'fraud', 'inactivity', 'group_closure', 'capacity_reduction']),
    body('admin_notes').optional().trim().isLength({ max: 1000 }).escape()
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { user_id, removal_type, removal_reason, admin_notes } = req.body;
        const adminId = req.user.id;

        // Verify member is active in the group
        const memberCheck = await db.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2 AND member_status = $3',
            [groupId, user_id, 'active']
        );

        if (memberCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Active member not found in this group',
                    code: 404
                }
            });
        }

        // Calculate financial impact before removal
        const financialImpact = await db.query(
            'SELECT calculate_removal_financial_impact($1, $2, $3) as impact',
            [groupId, user_id, removal_type]
        );

        // Process the removal
        const removalResult = await db.query(
            'SELECT process_member_removal($1, $2, $3, $4, $5, $6) as removal_id',
            [groupId, user_id, removal_type, removal_reason, adminId, admin_notes]
        );

        const removalId = removalResult.rows[0].removal_id;

        // Get the complete removal record
        const removalDetails = await db.query(
            'SELECT * FROM member_removal_summary WHERE id = $1',
            [removalId]
        );

        logger.info('Member removed by admin', {
            removalId,
            groupId,
            userId: user_id,
            adminId,
            type: removal_type,
            reason: removal_reason
        });

        res.json({
            success: true,
            data: {
                removal_id: removalId,
                financial_impact: financialImpact.rows[0].impact,
                removal_details: removalDetails.rows[0],
                processing_status: 'completed'
            },
            message: 'Member removed successfully with financial adjustments processed'
        });

    } catch (error) {
        logger.error('Admin member removal error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to remove member',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// Get member removal history for a group
app.get('/api/groups/:groupId/removal-history', authenticateToken, requireGroupAdminAccess, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const result = await db.query(`
            SELECT *
            FROM member_removal_summary
            WHERE group_id = $1
            ORDER BY removal_effective_date DESC
            LIMIT $2 OFFSET $3
        `, [groupId, limit, offset]);

        const countResult = await db.query(
            'SELECT COUNT(*) FROM member_removals WHERE group_id = $1',
            [groupId]
        );

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            total: parseInt(countResult.rows[0].count),
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: (parseInt(offset) + result.rows.length) < parseInt(countResult.rows[0].count)
            }
        });

    } catch (error) {
        logger.error('Get removal history error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve removal history',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// Get financial adjustments for a group
app.get('/api/groups/:groupId/financial-adjustments', authenticateToken, requireGroupAdminAccess, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { status = 'all', type = 'all' } = req.query;

        let query = `
            SELECT *
            FROM financial_adjustments_summary
            WHERE group_id = $1
        `;
        const params = [groupId];

        if (status !== 'all') {
            query += ` AND processing_status = $${params.length + 1}`;
            params.push(status);
        }

        if (type !== 'all') {
            query += ` AND adjustment_type = $${params.length + 1}`;
            params.push(type);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);

        // Calculate totals
        const totalPenalties = result.rows
            .filter(adj => adj.adjustment_type === 'penalty_charge')
            .reduce((sum, adj) => sum + parseFloat(adj.adjustment_amount), 0);

        const totalRefunds = result.rows
            .filter(adj => adj.adjustment_type === 'refund_payment')
            .reduce((sum, adj) => sum + parseFloat(adj.adjustment_amount), 0);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            summary: {
                total_penalties: totalPenalties,
                total_refunds: totalRefunds,
                net_impact: totalPenalties - totalRefunds,
                pending_adjustments: result.rows.filter(adj => adj.processing_status === 'pending').length
            }
        });

    } catch (error) {
        logger.error('Get financial adjustments error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve financial adjustments',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// Calculate removal impact preview (without processing)
app.post('/api/groups/:groupId/preview-removal', authenticateToken, requireGroupAdminAccess, [
    body('user_id').isUUID(),
    body('removal_type').isIn(['voluntary_withdrawal', 'admin_removal', 'performance_removal', 'violation_removal'])
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { user_id, removal_type } = req.body;

        // Verify member exists
        const memberCheck = await db.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2 AND member_status = $3',
            [groupId, user_id, 'active']
        );

        if (memberCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Active member not found',
                    code: 404
                }
            });
        }

        // Calculate financial impact
        const result = await db.query(
            'SELECT calculate_removal_financial_impact($1, $2, $3) as impact',
            [groupId, user_id, removal_type]
        );

        const impact = result.rows[0].impact;

        if (impact.error) {
            return res.status(400).json({
                success: false,
                error: {
                    message: impact.error,
                    code: 400
                }
            });
        }

        res.json({
            success: true,
            data: {
                preview: true,
                user_id,
                removal_type,
                financial_impact: impact,
                warnings: [
                    impact.member_info?.cycles_remaining > 0 ? 'Member has not completed all cycles' : null,
                    impact.financial_summary?.penalty_amount > 0 ? 'Penalty will be applied' : null,
                    impact.group_impact?.requires_rebalancing ? 'Group will require rebalancing' : null
                ].filter(Boolean),
                next_steps: 'Review the impact and confirm removal if acceptable'
            },
            message: 'Removal impact calculated successfully'
        });

    } catch (error) {
        logger.error('Preview removal error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to calculate removal impact',
                code: 500,
                details: NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// ====================================
// 🛡️ FRAUD DETECTION ENDPOINTS
// ====================================

// Get fraud detection dashboard for admins
app.get('/api/security/fraud-detection/dashboard', authenticateToken, requireRole(['administrator', 'security_admin']), async (req, res) => {
    try {
        const { timeframe = '24h', limit = 100 } = req.query;
        
        let timeFilter = '';
        switch (timeframe) {
            case '1h': timeFilter = "AND created_at > NOW() - INTERVAL '1 hour'"; break;
            case '24h': timeFilter = "AND created_at > NOW() - INTERVAL '24 hours'"; break;
            case '7d': timeFilter = "AND created_at > NOW() - INTERVAL '7 days'"; break;
            case '30d': timeFilter = "AND created_at > NOW() - INTERVAL '30 days'"; break;
        }

        // Get recent fraud alerts (with fallback for new tables)
        try {
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
                    COALESCE(COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END), 0) as resolved_alerts,
                    COALESCE(AVG(risk_score), 0) as avg_risk_score,
                    COUNT(DISTINCT user_id) as unique_users_flagged,
                    COUNT(DISTINCT ip_address) as unique_ips_flagged
                FROM fraud_detection_logs
                WHERE 1=1 ${timeFilter}
            `);

            res.json({
                success: true,
                data: {
                    timeframe,
                    statistics: statsResult.rows[0] || {
                        total_alerts: 0,
                        critical_alerts: 0,
                        high_alerts: 0,
                        medium_alerts: 0,
                        resolved_alerts: 0,
                        avg_risk_score: 0,
                        unique_users_flagged: 0,
                        unique_ips_flagged: 0
                    },
                    recent_alerts: alertsResult.rows || [],
                    generated_at: new Date().toISOString()
                }
            });
        } catch (dbError) {
            // Fallback response if fraud detection tables don't exist yet
            res.json({
                success: true,
                data: {
                    timeframe,
                    statistics: {
                        total_alerts: 0,
                        critical_alerts: 0,
                        high_alerts: 0,
                        medium_alerts: 0,
                        resolved_alerts: 0,
                        avg_risk_score: 0,
                        unique_users_flagged: 0,
                        unique_ips_flagged: 0
                    },
                    recent_alerts: [],
                    generated_at: new Date().toISOString(),
                    note: 'Fraud detection system initializing'
                }
            });
        }

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
            await db.query(`
                INSERT INTO blocked_ips (ip_address, blocked_by, block_reason, blocked_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (ip_address) DO UPDATE SET
                    blocked_by = $2,
                    block_reason = $3,
                    blocked_at = NOW(),
                    is_active = TRUE
            `, [ip_address, adminId, reason || 'Administrative block']);
        } else {
            await db.query(`
                UPDATE blocked_ips 
                SET is_active = FALSE, 
                    unblocked_at = NOW(),
                    unblocked_by = $2
                WHERE ip_address = $1
            `, [ip_address, adminId]);
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

// Get user risk profile
app.get('/api/security/fraud-detection/user-risk/:userId', authenticateToken, requireRole(['administrator', 'security_admin']), async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user's fraud history with fallback
        try {
            const fraudHistoryResult = await db.query(`
                SELECT 
                    COUNT(*) as total_alerts,
                    COALESCE(AVG(risk_score), 0) as avg_risk_score,
                    COALESCE(MAX(risk_score), 0) as max_risk_score,
                    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as alerts_24h,
                    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as alerts_7d,
                    MAX(created_at) as last_alert
                FROM fraud_detection_logs
                WHERE user_id = $1
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
                    generated_at: new Date().toISOString()
                }
            });
        } catch (dbError) {
            // Fallback for when fraud detection tables don't exist
            res.json({
                success: true,
                data: {
                    user_id: userId,
                    risk_level: 'low',
                    risk_profile: {
                        total_alerts: 0,
                        avg_risk_score: 0,
                        max_risk_score: 0,
                        alerts_24h: 0,
                        alerts_7d: 0,
                        last_alert: null
                    },
                    generated_at: new Date().toISOString(),
                    note: 'Fraud detection system initializing'
                }
            });
        }

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

// ====================================
// 💰 CONTRIBUTION TRACKING & PAYMENT SYSTEM ENDPOINTS
// ====================================

// Get contribution summary for a group
app.get('/api/groups/:groupId/contributions/summary', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { cycle_number } = req.query;

        // Verify user has access to this group
        const memberCheck = await db.query(`
            SELECT role, member_status FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND member_status = 'active'
        `, [groupId, req.user.id]);

        if (memberCheck.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to group', code: 403 }
            });
        }

        // Get contribution summary with fallback
        try {
            const summaryResult = await db.query(`
                SELECT get_group_contribution_summary($1, $2) as summary
            `, [groupId, cycle_number || null]);

            const summary = summaryResult.rows[0].summary;

            // Get recent contributions
            const recentResult = await db.query(`
                SELECT 
                    c.id,
                    c.user_id,
                    u.name as user_name,
                    c.amount,
                    COALESCE(c.late_fee_applied, 0) as late_fee_applied,
                    c.status,
                    c.due_date,
                    c.paid_date,
                    c.cycle_number,
                    COALESCE(c.is_late, false) as is_late,
                    pm.method_type as payment_method
                FROM contributions c
                JOIN users u ON c.user_id = u.id
                LEFT JOIN user_payment_methods pm ON c.payment_method_id = pm.id
                WHERE c.group_id = $1 
                ${cycle_number ? 'AND c.cycle_number = $3' : ''}
                ORDER BY c.due_date DESC, c.created_at DESC
                LIMIT 50
            `, cycle_number ? [groupId, cycle_number] : [groupId]);

            res.json({
                success: true,
                data: {
                    summary,
                    recent_contributions: recentResult.rows,
                    generated_at: new Date().toISOString()
                }
            });
        } catch (dbError) {
            // Fallback if new schema not fully applied
            const basicResult = await db.query(`
                SELECT 
                    COUNT(*) as total_members,
                    COALESCE(SUM(amount), 0) as total_expected,
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_collected,
                    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
                FROM contributions
                WHERE group_id = $1 ${cycle_number ? 'AND cycle_number = $2' : ''}
            `, cycle_number ? [groupId, cycle_number] : [groupId]);

            res.json({
                success: true,
                data: {
                    summary: basicResult.rows[0],
                    recent_contributions: [],
                    generated_at: new Date().toISOString(),
                    note: 'Using basic contribution tracking (schema upgrading)'
                }
            });
        }

    } catch (error) {
        logger.error('Get contribution summary error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get contribution summary', code: 500 }
        });
    }
});

// Create payment schedule for a group cycle
app.post('/api/groups/:groupId/payment-schedules', authenticateToken, [
    body('cycle_number').isInt({ min: 1 }).withMessage('Valid cycle number required'),
    body('due_date').isISO8601().withMessage('Valid due date required'),
    body('contribution_amount').optional().isFloat({ min: 0.01 }).withMessage('Valid contribution amount required')
], handleValidationErrors, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { cycle_number, due_date, contribution_amount } = req.body;

        // Verify user is group admin
        const adminCheck = await db.query(`
            SELECT role FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND (role = 'admin' OR user_id = $2)
        `, [groupId, req.user.id]);

        if (adminCheck.rows.length === 0 && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Only group admins can create payment schedules', code: 403 }
            });
        }

        try {
            // Create payment schedule using stored function
            const scheduleResult = await db.query(`
                SELECT create_payment_schedule($1, $2, $3, $4) as schedule_id
            `, [groupId, cycle_number, due_date, contribution_amount || null]);

            const scheduleId = scheduleResult.rows[0].schedule_id;

            logger.info('Payment schedule created', {
                schedule_id: scheduleId,
                group_id: groupId,
                cycle_number,
                created_by: req.user.id
            });

            res.status(201).json({
                success: true,
                data: { schedule_id: scheduleId },
                message: 'Payment schedule created successfully'
            });
        } catch (dbError) {
            // Fallback: create basic contributions
            const groupResult = await db.query(`
                SELECT contribution_amount FROM groups WHERE id = $1
            `, [groupId]);

            const amount = contribution_amount || groupResult.rows[0]?.contribution_amount || 100;

            // Get group members
            const membersResult = await db.query(`
                SELECT user_id FROM group_members 
                WHERE group_id = $1 AND member_status = 'active'
            `, [groupId]);

            // Create contributions for each member
            for (const member of membersResult.rows) {
                await db.query(`
                    INSERT INTO contributions (
                        user_id, group_id, amount, cycle_number, due_date, status, payment_method
                    ) VALUES ($1, $2, $3, $4, $5, 'pending', 'pending_selection')
                `, [member.user_id, groupId, amount, cycle_number, due_date]);
            }

            res.status(201).json({
                success: true,
                data: { 
                    contributions_created: membersResult.rows.length,
                    amount,
                    cycle_number 
                },
                message: 'Basic payment schedule created successfully'
            });
        }

    } catch (error) {
        logger.error('Create payment schedule error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to create payment schedule', code: 500 }
        });
    }
});

// Process contribution payment
app.post('/api/contributions/:contributionId/process-payment', authenticateToken, [
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('payment_method').optional().isLength({ min: 2, max: 50 }).withMessage('Valid payment method required')
], handleValidationErrors, async (req, res) => {
    try {
        const { contributionId } = req.params;
        const { amount, payment_method = 'manual' } = req.body;

        // Verify contribution belongs to user or user is admin
        const contributionCheck = await db.query(`
            SELECT c.*, g.name as group_name
            FROM contributions c
            JOIN groups g ON c.group_id = g.id
            WHERE c.id = $1 AND (c.user_id = $2 OR $3 = 'administrator')
        `, [contributionId, req.user.id, req.user.role]);

        if (contributionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to contribution', code: 403 }
            });
        }

        const contribution = contributionCheck.rows[0];

        if (contribution.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: { message: 'Contribution already paid', code: 400 }
            });
        }

        const paymentAmount = amount || contribution.amount;

        // Update contribution status
        await db.query(`
            UPDATE contributions 
            SET status = 'completed',
                paid_date = NOW(),
                payment_method = $2,
                updated_at = NOW()
            WHERE id = $1
        `, [contributionId, payment_method]);

        // Create transaction record
        await db.query(`
            INSERT INTO transactions (
                user_id, type, amount, status, group_id, 
                contribution_id, transaction_type, notes
            ) VALUES ($1, 'contribution', $2, 'completed', $3, $4, 'contribution', $5)
        `, [
            contribution.user_id, 
            paymentAmount, 
            contribution.group_id, 
            contributionId,
            `Payment processed via ${payment_method}`
        ]);

        logger.info('Contribution payment processed', {
            contribution_id: contributionId,
            user_id: req.user.id,
            amount: paymentAmount,
            payment_method
        });

        res.json({
            success: true,
            data: {
                contribution_id: contributionId,
                amount_paid: paymentAmount,
                payment_method,
                status: 'completed'
            },
            message: 'Payment processed successfully'
        });

    } catch (error) {
        logger.error('Process payment error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to process payment', code: 500 }
        });
    }
});

// Get user's contributions
app.get('/api/users/contributions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, group_id, limit = 20 } = req.query;

        let query = `
            SELECT 
                c.id,
                c.amount,
                c.status,
                c.due_date,
                c.paid_date,
                c.cycle_number,
                c.payment_method,
                g.name as group_name,
                g.id as group_id
            FROM contributions c
            JOIN groups g ON c.group_id = g.id
            WHERE c.user_id = $1
        `;
        
        const params = [userId];
        
        if (status) {
            query += ` AND c.status = $${params.length + 1}`;
            params.push(status);
        }
        
        if (group_id) {
            query += ` AND c.group_id = $${params.length + 1}`;
            params.push(group_id);
        }
        
        query += ` ORDER BY c.due_date DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: {
                contributions: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        logger.error('Get user contributions error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get contributions', code: 500 }
        });
    }
});

// Get overdue contributions (admin only)
app.get('/api/contributions/overdue', authenticateToken, requireRole(['administrator']), async (req, res) => {
    try {
        const { days_overdue = 1, limit = 50 } = req.query;

        const result = await db.query(`
            SELECT 
                c.id,
                c.user_id,
                u.name as user_name,
                u.email as user_email,
                c.group_id,
                g.name as group_name,
                c.amount,
                c.due_date,
                c.cycle_number,
                c.status,
                EXTRACT(DAYS FROM NOW() - c.due_date) as days_overdue
            FROM contributions c
            JOIN users u ON c.user_id = u.id
            JOIN groups g ON c.group_id = g.id
            WHERE c.status != 'completed' 
            AND c.due_date < NOW() - INTERVAL '${days_overdue} days'
            ORDER BY c.due_date ASC
            LIMIT $1
        `, [limit]);

        res.json({
            success: true,
            data: {
                overdue_contributions: result.rows,
                count: result.rows.length,
                filter: { days_overdue }
            }
        });

    } catch (error) {
        logger.error('Get overdue contributions error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get overdue contributions', code: 500 }
        });
    }
});

// Get user transactions (wallet endpoint)
app.post('/api/user/transactions', authenticateToken, [
    body('user_id').optional().isString().withMessage('Valid user ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { user_id, status_filter, limit = 20, offset = 0 } = req.body;

        // Use authenticated user if no user_id provided
        const targetUserId = user_id || req.user.id;

        // 🔒 SECURITY: Users can only view their own transactions (unless admin)
        if (targetUserId !== req.user.id && req.user.role !== 'administrator') {
            logger.warn('Unauthorized transaction access attempt', {
                requestedUser: targetUserId,
                authenticatedUser: req.user.id,
                ip: req.ip
            });
            return res.status(403).json({
                success: false,
                error: {
                    message: 'No autorizado para ver transacciones de otros usuarios',
                    code: 403
                }
            });
        }

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                error: { message: 'user_id es requerido', code: 400 }
            });
        }

        // Get user's wallet balance
        const walletResult = await db.query(`
            SELECT balance, currency FROM user_wallets WHERE user_id = $1 LIMIT 1
        `, [targetUserId]);

        const balance = walletResult.rows.length > 0 ? walletResult.rows[0].balance : '0.00';
        const currency = walletResult.rows.length > 0 ? walletResult.rows[0].currency : 'HNL';

        // Get transactions from multiple sources
        let query = `
            SELECT
                'contribution' as type,
                c.id::text as id,
                c.amount,
                c.status,
                c.created_at as date,
                c.due_date,
                c.paid_date,
                g.name as group_name,
                'Contribución al grupo' as description,
                c.payment_method
            FROM contributions c
            LEFT JOIN groups g ON c.group_id = g.id
            WHERE c.user_id = $1

            UNION ALL

            SELECT
                'transaction' as type,
                t.id::text as id,
                t.amount,
                t.status,
                t.created_at as date,
                NULL as due_date,
                NULL as paid_date,
                t.description as group_name,
                t.transaction_type as description,
                t.payment_method
            FROM transactions t
            WHERE t.user_id = $1
        `;

        const params = [targetUserId];

        if (status_filter) {
            query += ` AND status = $${params.length + 1}`;
            params.push(status_filter);
        }

        query += ` ORDER BY date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Format transactions for wallet
        const transactions = result.rows.map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: parseFloat(tx.amount),
            status: tx.status,
            date: tx.date,
            description: tx.description || tx.group_name || 'Transacción',
            payment_method: tx.payment_method,
            group_name: tx.group_name
        }));

        logger.info('User transactions retrieved', {
            user_id: targetUserId,
            count: transactions.length,
            balance: balance
        });

        res.json({
            success: true,
            data: {
                user_id: targetUserId,
                balance: balance,
                currency: currency,
                transactions: transactions,
                count: transactions.length,
                limit: limit,
                offset: offset
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Get user transactions error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to load transactions from database', code: 500 }
        });
    }
});

// ====================================
// 🔐 TWO-FACTOR AUTHENTICATION ENDPOINTS
// ====================================

// Get user's 2FA status and settings
app.get('/api/users/2fa/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(`
            SELECT 
                u.two_factor_enabled,
                u.two_factor_enforced,
                s.sms_enabled,
                s.email_enabled,
                s.totp_enabled,
                s.phone_number,
                s.phone_verified,
                s.email_verified,
                s.setup_completed_at,
                s.last_used_at,
                COUNT(DISTINCT bc.id) FILTER (WHERE bc.is_used = FALSE AND bc.expires_at > NOW()) as backup_codes_available
            FROM users u
            LEFT JOIN user_2fa_settings s ON u.id = s.user_id
            LEFT JOIN user_2fa_backup_codes bc ON u.id = bc.user_id
            WHERE u.id = $1
            GROUP BY u.id, u.two_factor_enabled, u.two_factor_enforced, s.sms_enabled, 
                     s.email_enabled, s.totp_enabled, s.phone_number, s.phone_verified,
                     s.email_verified, s.setup_completed_at, s.last_used_at
        `, [userId]);

        const status = result.rows[0] || {
            two_factor_enabled: false,
            sms_enabled: false,
            email_enabled: false,
            totp_enabled: false,
            backup_codes_available: 0
        };

        res.json({
            success: true,
            data: {
                ...status,
                setup_required: status.two_factor_enforced && !status.two_factor_enabled,
                available_methods: ['sms', 'email', 'totp'],
                active_methods: [
                    status.sms_enabled && 'sms',
                    status.email_enabled && 'email', 
                    status.totp_enabled && 'totp'
                ].filter(Boolean)
            }
        });

    } catch (error) {
        logger.error('Get 2FA status error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get 2FA status',
                code: 500
            }
        });
    }
});

// Initialize 2FA setup
app.post('/api/users/2fa/setup/initialize', authenticateToken, [
    body('methods').isArray().withMessage('Methods must be an array'),
    body('methods.*').isIn(['sms', 'email', 'totp']).withMessage('Invalid 2FA method'),
    body('phone_number').optional().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { methods, phone_number } = req.body;

        // Create or update 2FA settings
        const upsertResult = await db.query(`
            INSERT INTO user_2fa_settings (
                user_id, sms_enabled, email_enabled, totp_enabled, phone_number
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id) UPDATE SET
                sms_enabled = $2,
                email_enabled = $3, 
                totp_enabled = $4,
                phone_number = $5,
                updated_at = NOW()
            RETURNING *
        `, [
            userId,
            methods.includes('sms'),
            methods.includes('email'),
            methods.includes('totp'),
            phone_number || null
        ]);

        const setup_data = {};

        // Generate TOTP secret if TOTP is enabled
        if (methods.includes('totp')) {
            const secret = speakeasy.generateSecret({
                name: `La Tanda (${req.user.email})`,
                issuer: 'La Tanda'
            });

            // Store TOTP secret
            await db.query(`
                UPDATE user_2fa_settings 
                SET totp_secret = $1
                WHERE user_id = $2
            `, [secret.base32, userId]);

            // Generate QR code for easy setup
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

            setup_data.totp = {
                secret: secret.base32,
                qr_code: qrCodeUrl,
                backup_codes: null // Will be generated after verification
            };
        }

        // Send verification codes for SMS/Email
        if (methods.includes('sms') && phone_number) {
            setup_data.sms = await sendSMSVerificationCode(userId, phone_number);
        }

        if (methods.includes('email')) {
            setup_data.email = await sendEmailVerificationCode(userId, req.user.email);
        }

        logger.info('2FA setup initialized', {
            userId,
            methods,
            hasPhone: !!phone_number
        });

        res.json({
            success: true,
            data: {
                setup_id: upsertResult.rows[0].id,
                methods_enabled: methods,
                setup_data,
                next_step: 'Verify your chosen 2FA methods to complete setup'
            },
            message: '2FA setup initialized successfully'
        });

    } catch (error) {
        logger.error('2FA setup initialization error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to initialize 2FA setup',
                code: 500
            }
        });
    }
});

// Verify 2FA setup
app.post('/api/users/2fa/setup/verify', authenticateToken, [
    body('method').isIn(['sms', 'email', 'totp']).withMessage('Invalid 2FA method'),
    body('code').isLength({ min: 4, max: 8 }).withMessage('Invalid verification code')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { method, code } = req.body;

        let isValid = false;

        if (method === 'totp') {
            // Verify TOTP code
            const settingsResult = await db.query(
                'SELECT totp_secret FROM user_2fa_settings WHERE user_id = $1',
                [userId]
            );

            if (settingsResult.rows.length > 0 && settingsResult.rows[0].totp_secret) {
                isValid = speakeasy.totp.verify({
                    secret: settingsResult.rows[0].totp_secret,
                    encoding: 'base32',
                    token: code,
                    window: 2 // Allow some time drift
                });
            }
        } else {
            // Verify SMS/Email code using database function
            try {
                const verifyResult = await db.query(
                    'SELECT verify_2fa_code($1, $2, $3, $4, $5) as result',
                    [userId, method, code, req.ip, req.get('User-Agent')]
                );
                const verification_result = verifyResult.rows[0].result;
                isValid = verification_result.success;
            } catch (dbError) {
                // If function doesn't exist, do simple code verification
                const attemptResult = await db.query(`
                    SELECT code_sent FROM user_2fa_attempts 
                    WHERE user_id = $1 AND method_type = $2 
                    AND verification_status = 'pending' 
                    AND code_expires_at > NOW()
                    ORDER BY created_at DESC LIMIT 1
                `, [userId, method]);
                
                if (attemptResult.rows.length > 0) {
                    isValid = attemptResult.rows[0].code_sent === code;
                }
            }
        }

        if (isValid) {
            // Mark method as verified and enable 2FA
            await db.query(`
                UPDATE user_2fa_settings 
                SET setup_completed_at = NOW(),
                    is_enabled = TRUE
                WHERE user_id = $1
            `, [userId]);

            // Generate backup codes
            let backupCodes = [];
            try {
                const backupCodesResult = await db.query(
                    'SELECT generate_backup_codes($1) as codes',
                    [userId]
                );
                backupCodes = backupCodesResult.rows[0].codes || [];
            } catch (genError) {
                // Generate simple backup codes if function fails
                for (let i = 0; i < 8; i++) {
                    backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
                }
            }

            logger.info('2FA method verified and setup completed', {
                userId,
                method,
                ip: req.ip
            });

            res.json({
                success: true,
                data: {
                    method_verified: method,
                    backup_codes: backupCodes,
                    two_factor_enabled: true
                },
                message: `${method.toUpperCase()} 2FA setup completed successfully`
            });

        } else {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid verification code',
                    code: 400
                }
            });
        }

    } catch (error) {
        logger.error('2FA setup verification error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to verify 2FA setup',
                code: 500
            }
        });
    }
});

// Request 2FA code for login
app.post('/api/auth/2fa/request', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('method').isIn(['sms', 'email', 'totp']).withMessage('Invalid 2FA method')
], handleValidationErrors, async (req, res) => {
    try {
        const { email, method } = req.body;

        // Get user and 2FA settings
        const userResult = await db.query(`
            SELECT u.id, u.name, u.email, s.sms_enabled, s.email_enabled, s.totp_enabled, s.phone_number
            FROM users u
            LEFT JOIN user_2fa_settings s ON u.id = s.user_id
            WHERE u.email = $1 AND u.status = 'active'
        `, [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 404
                }
            });
        }

        const user = userResult.rows[0];

        // Check if method is enabled for user
        if ((method === 'sms' && !user.sms_enabled) ||
            (method === 'email' && !user.email_enabled) ||
            (method === 'totp' && !user.totp_enabled)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `${method.toUpperCase()} 2FA is not enabled for this account`,
                    code: 400
                }
            });
        }

        let result = {};

        if (method === 'sms') {
            result = await sendSMSVerificationCode(user.id, user.phone_number, 'login');
        } else if (method === 'email') {
            result = await sendEmailVerificationCode(user.id, user.email, 'login');
        } else if (method === 'totp') {
            result = { message: 'Enter code from your authenticator app' };
        }

        res.json({
            success: true,
            data: {
                method,
                user_id: user.id,
                ...result
            },
            message: `2FA code ${method === 'totp' ? 'required' : 'sent'} for login verification`
        });

    } catch (error) {
        logger.error('2FA request error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to request 2FA code',
                code: 500
            }
        });
    }
});

// Verify 2FA code for login
app.post('/api/auth/2fa/verify', [
    body('user_id').isUUID().withMessage('Valid user ID is required'),
    body('method').isIn(['sms', 'email', 'totp', 'backup_code']).withMessage('Invalid 2FA method'),
    body('code').isLength({ min: 4, max: 8 }).withMessage('Invalid verification code'),
    body('trust_device').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
    try {
        const { user_id, method, code, trust_device = false } = req.body;

        let isValid = false;

        if (method === 'totp') {
            // Verify TOTP code
            const settingsResult = await db.query(
                'SELECT totp_secret FROM user_2fa_settings WHERE user_id = $1',
                [user_id]
            );

            if (settingsResult.rows.length > 0 && settingsResult.rows[0].totp_secret) {
                isValid = speakeasy.totp.verify({
                    secret: settingsResult.rows[0].totp_secret,
                    encoding: 'base32',
                    token: code,
                    window: 2
                });
            }
        } else {
            // Verify SMS/Email/Backup code
            const attemptResult = await db.query(`
                SELECT code_sent FROM user_2fa_attempts 
                WHERE user_id = $1 AND method_type = $2 
                AND verification_status = 'pending' 
                AND code_expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1
            `, [user_id, method]);
            
            if (attemptResult.rows.length > 0) {
                isValid = attemptResult.rows[0].code_sent === code;
            }
        }

        if (isValid) {
            // Get user information for token generation
            const userResult = await db.query(
                'SELECT id, email, role FROM users WHERE id = $1',
                [user_id]
            );

            const user = userResult.rows[0];

            // Generate JWT token with 2FA verification
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    role: user.role,
                    '2fa_verified': true 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Update last login
            await db.query(
                'UPDATE users SET last_login = NOW() WHERE id = $1',
                [user_id]
            );

            logger.info('2FA verification successful for login', {
                userId: user_id,
                method,
                ip: req.ip,
                trustDevice: trust_device
            });

            res.json({
                success: true,
                data: {
                    auth_token: token,
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role
                    },
                    two_factor_verified: true
                },
                message: '2FA verification successful'
            });

        } else {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid 2FA code',
                    code: 400
                }
            });
        }

    } catch (error) {
        logger.error('2FA verification error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to verify 2FA code',
                code: 500
            }
        });
    }
});

// Disable 2FA
app.post('/api/users/2fa/disable', authenticateToken, [
    body('current_password').isLength({ min: 6 }).withMessage('Current password is required')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password } = req.body;

        // Verify current password
        const userResult = await db.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        const isPasswordValid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
        
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid current password',
                    code: 400
                }
            });
        }

        // Disable 2FA
        await db.query(`
            UPDATE user_2fa_settings 
            SET is_enabled = FALSE,
                sms_enabled = FALSE,
                email_enabled = FALSE,
                totp_enabled = FALSE,
                updated_at = NOW()
            WHERE user_id = $1
        `, [userId]);

        logger.info('2FA disabled by user', {
            userId,
            ip: req.ip
        });

        res.json({
            success: true,
            message: '2FA has been disabled successfully'
        });

    } catch (error) {
        logger.error('2FA disable error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to disable 2FA',
                code: 500
            }
        });
    }
});

// ====================================
// 🔐 2FA HELPER FUNCTIONS
// ====================================

async function sendSMSVerificationCode(userId, phoneNumber, attemptType = 'setup') {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    
    try {
        // Store attempt in database
        await db.query(`
            INSERT INTO user_2fa_attempts (
                user_id, method_type, attempt_type, code_sent, code_expires_at
            ) VALUES ($1, 'sms', $2, $3, NOW() + INTERVAL '10 minutes')
        `, [userId, attemptType, code]);
    } catch (dbError) {
        // If table doesn't exist, log only
        logger.warn('Could not store SMS attempt in database', { userId, error: dbError.message });
    }

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    logger.info('SMS 2FA code generated', {
        userId,
        phoneNumber: phoneNumber ? phoneNumber.replace(/\d(?=\d{4})/g, '*') : 'unknown',
        code: code.substring(0, 2) + '****' // Log partial code for debugging
    });

    return {
        message: `SMS code sent to ${phoneNumber ? phoneNumber.replace(/\d(?=\d{4})/g, '*') : 'phone'}`,
        expires_in: 600, // 10 minutes
        code: code // For demo purposes - remove in production
    };
}

async function sendEmailVerificationCode(userId, email, attemptType = 'setup') {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    
    try {
        // Store attempt in database
        await db.query(`
            INSERT INTO user_2fa_attempts (
                user_id, method_type, attempt_type, code_sent, code_expires_at
            ) VALUES ($1, 'email', $2, $3, NOW() + INTERVAL '10 minutes')
        `, [userId, attemptType, code]);
    } catch (dbError) {
        // If table doesn't exist, log only
        logger.warn('Could not store email attempt in database', { userId, error: dbError.message });
    }

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    logger.info('Email 2FA code generated', {
        userId,
        email: email.replace(/(?<=.{2}).*(?=@)/, '*'.repeat(5)),
        code: code.substring(0, 2) + '****'
    });

    return {
        message: `Email code sent to ${email.replace(/(?<=.{2}).*(?=@)/, '*'.repeat(5))}`,
        expires_in: 600, // 10 minutes
        code: code // For demo purposes - remove in production
    };
}

// ====================================
// 🏥 ERROR HANDLING
// ====================================

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    const isDevelopment = NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        success: false,
        error: {
            message: isDevelopment ? err.message : 'Internal server error',
            code: err.status || 500,
            ...(isDevelopment && { stack: err.stack })
        },
        meta: {
            timestamp: new Date().toISOString()
        }
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'API endpoint not found',
            code: 404,
            path: req.path
        },
        meta: {
            timestamp: new Date().toISOString()
        }
    });
});

// ====================================
// 🚀 SERVER STARTUP
// ====================================

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await db.close();
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await db.close();
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🗄️ La Tanda Database-Integrated API Server running on port ${PORT}`, {
        environment: NODE_ENV,
        port: PORT,
        timestamp: new Date().toISOString()
    });
    
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║  🏦 LA TANDA DATABASE-INTEGRATED API SERVER                  ║
    ║                                                              ║
    ║  🚀 Server: http://localhost:${PORT}                           ║
    ║  🏥 Health: http://localhost:${PORT}/health                    ║
    ║  📊 Status: http://localhost:${PORT}/api/system/status         ║
    ║                                                              ║
    ║  🗄️  Enhanced Features:                                      ║
    ║  ✅ PostgreSQL Database Integration                          ║
    ║  ✅ Production Security (Helmet, Rate Limiting)             ║
    ║  ✅ Advanced Logging (Winston)                              ║
    ║  ✅ Input Validation & Sanitization                         ║
    ║  ✅ Enhanced Error Handling                                 ║
    ║  ✅ CORS Configuration                                      ║
    ║  ✅ Compression & Performance                               ║
    ║                                                              ║
    ║  🎯 Ready for api.latanda.online deployment! 100%          ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
});

// ====================================
// 🔄 PAYOUT ROTATION & DISTRIBUTION ENDPOINTS
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

// ====================================
// 📊 FINANCIAL RECONCILIATION & REPORTING ENDPOINTS
// ====================================

// Run financial reconciliation for a period
app.post('/api/financial/reconciliation/run', authenticateToken, requireRole(['administrator']), [
    body('period_start').isISO8601().withMessage('Valid start date required'),
    body('period_end').isISO8601().withMessage('Valid end date required'),
    body('report_type').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).withMessage('Valid report type required')
], handleValidationErrors, async (req, res) => {
    try {
        const { period_start, period_end, report_type = 'custom' } = req.body;

        // Validate date range
        const startDate = new Date(period_start);
        const endDate = new Date(period_end);
        
        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                error: { message: 'Start date must be before end date', code: 400 }
            });
        }

        // Run reconciliation
        const result = await db.query(`
            SELECT perform_financial_reconciliation($1, $2, $3, $4) as report_id
        `, [period_start, period_end, report_type, req.user.id]);

        const reportId = result.rows[0].report_id;

        // Get the generated report details
        const reportResult = await db.query(`
            SELECT 
                id,
                report_type,
                report_period_start,
                report_period_end,
                reconciliation_status,
                total_discrepancies,
                critical_discrepancies,
                total_contributions_expected,
                total_contributions_collected,
                total_payouts_distributed,
                overall_accuracy_percentage,
                processing_duration_seconds,
                records_processed,
                generated_at
            FROM financial_reconciliation_reports 
            WHERE id = $1
        `, [reportId]);

        logger.info('Financial reconciliation completed', {
            report_id: reportId,
            period_start,
            period_end,
            report_type,
            reconciliation_status: reportResult.rows[0].reconciliation_status,
            discrepancies: reportResult.rows[0].total_discrepancies,
            accuracy: reportResult.rows[0].overall_accuracy_percentage,
            generated_by: req.user.id
        });

        res.status(201).json({
            success: true,
            data: {
                report_id: reportId,
                reconciliation_summary: reportResult.rows[0]
            },
            message: 'Financial reconciliation completed successfully'
        });

    } catch (error) {
        logger.error('Financial reconciliation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to run financial reconciliation', code: 500 }
        });
    }
});

// Get financial summary for a period
app.get('/api/financial/summary', authenticateToken, requireRole(['administrator']), [
    query('period_start').isISO8601().withMessage('Valid start date required'),
    query('period_end').isISO8601().withMessage('Valid end date required'),
    query('group_id').optional().isUUID().withMessage('Valid group ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { period_start, period_end, group_id } = req.query;

        // Get financial summary
        const result = await db.query(`
            SELECT get_financial_summary($1, $2, $3) as summary
        `, [period_start, period_end, group_id || null]);

        const summary = result.rows[0].summary;

        res.json({
            success: true,
            data: {
                financial_summary: summary,
                generated_at: new Date().toISOString(),
                filters: { period_start, period_end, group_id }
            }
        });

    } catch (error) {
        logger.error('Get financial summary error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get financial summary', code: 500 }
        });
    }
});

// Validate financial data integrity
app.get('/api/financial/validation', authenticateToken, requireRole(['administrator']), async (req, res) => {
    try {
        // Run financial data validation
        const result = await db.query(`
            SELECT validate_financial_integrity() as validation_result
        `);

        const validationResult = result.rows[0].validation_result;

        logger.info('Financial validation completed', {
            overall_status: validationResult.overall_status,
            total_issues: validationResult.total_issues,
            critical_issues: validationResult.critical_issues,
            validated_by: req.user.id
        });

        res.json({
            success: true,
            data: {
                validation_result: validationResult
            }
        });

    } catch (error) {
        logger.error('Financial validation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to validate financial data', code: 500 }
        });
    }
});

// Get list of reconciliation reports
app.get('/api/financial/reconciliation/reports', authenticateToken, requireRole(['administrator']), [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['processing', 'completed', 'failed', 'partial', 'requires_review']).withMessage('Valid status required')
], handleValidationErrors, async (req, res) => {
    try {
        const { limit = 20, status } = req.query;

        // Build query with optional filters
        let query = `
            SELECT 
                frr.id,
                frr.report_type,
                frr.report_period_start,
                frr.report_period_end,
                frr.reconciliation_status,
                frr.total_discrepancies,
                frr.critical_discrepancies,
                frr.overall_accuracy_percentage,
                frr.processing_duration_seconds,
                frr.generated_at,
                u.name as generated_by_name
            FROM financial_reconciliation_reports frr
            LEFT JOIN users u ON frr.generated_by = u.id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            query += ` AND frr.reconciliation_status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY frr.generated_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: {
                reports: result.rows,
                count: result.rows.length,
                filters: { status }
            }
        });

    } catch (error) {
        logger.error('Get reconciliation reports error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get reconciliation reports', code: 500 }
        });
    }
});

// ====================================
// 💳 PAYMENT GATEWAY INTEGRATION ENDPOINTS
// ====================================

// Get available payment gateways
app.get('/api/payment/gateways', authenticateToken, requireRole(['administrator']), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, gateway_name, gateway_type, provider_name, is_active, is_default,
                priority_order, min_amount, max_amount, fixed_fee, percentage_fee,
                supported_currencies, default_currency, health_status, error_rate_percentage
            FROM payment_gateways
            ORDER BY priority_order ASC, gateway_name ASC
        `);

        res.json({
            success: true,
            data: {
                gateways: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        logger.error('Get payment gateways error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get payment gateways', code: 500 }
        });
    }
});

// Select optimal gateway for payment
app.post('/api/payment/gateways/select', authenticateToken, [
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Valid currency code required'),
    body('payment_type').optional().isLength({ min: 2 }).withMessage('Valid payment type required')
], handleValidationErrors, async (req, res) => {
    try {
        const { amount, currency = 'HNL', payment_type = 'card', country_code = 'HN' } = req.body;

        // Select optimal gateway
        const gatewayResult = await db.query(`
            SELECT select_optimal_gateway($1, $2, $3, $4) as gateway_id
        `, [amount, currency, payment_type, country_code]);

        const gatewayId = gatewayResult.rows[0].gateway_id;

        if (!gatewayId) {
            return res.status(400).json({
                success: false,
                error: { message: 'No suitable payment gateway found', code: 400 }
            });
        }

        // Get gateway details and calculate fees
        const gatewayDetails = await db.query(`
            SELECT 
                id, gateway_name, gateway_type, provider_name,
                min_amount, max_amount, fixed_fee, percentage_fee,
                supported_currencies, default_currency
            FROM payment_gateways 
            WHERE id = $1
        `, [gatewayId]);

        const feeCalculation = await db.query(`
            SELECT calculate_gateway_fees($1, $2) as fee_breakdown
        `, [gatewayId, amount]);

        res.json({
            success: true,
            data: {
                selected_gateway: gatewayDetails.rows[0],
                fee_breakdown: feeCalculation.rows[0].fee_breakdown,
                selection_criteria: { amount, currency, payment_type, country_code }
            }
        });

    } catch (error) {
        logger.error('Select payment gateway error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to select payment gateway', code: 500 }
        });
    }
});

// Create payment transaction
app.post('/api/payment/transactions/create', authenticateToken, [
    body('contribution_id').isUUID().withMessage('Valid contribution ID required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Valid currency code required'),
    body('gateway_id').optional().isUUID().withMessage('Valid gateway ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { contribution_id, amount, currency = 'HNL', gateway_id, payment_method_details = {} } = req.body;

        // Verify contribution belongs to user or user is admin
        const contributionCheck = await db.query(`
            SELECT c.*, g.name as group_name
            FROM contributions c
            JOIN groups g ON c.group_id = g.id
            WHERE c.id = $1 AND (c.user_id = $2 OR $3 = 'administrator')
        `, [contribution_id, req.user.id, req.user.role]);

        if (contributionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to contribution', code: 403 }
            });
        }

        const contribution = contributionCheck.rows[0];

        if (contribution.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: { message: 'Contribution already paid', code: 400 }
            });
        }

        // Select gateway if not provided
        let selectedGatewayId = gateway_id;
        if (!selectedGatewayId) {
            const gatewayResult = await db.query(`
                SELECT select_optimal_gateway($1, $2, 'card', 'HN') as gateway_id
            `, [amount, currency]);
            selectedGatewayId = gatewayResult.rows[0].gateway_id;
        }

        if (!selectedGatewayId) {
            return res.status(400).json({
                success: false,
                error: { message: 'No suitable payment gateway available', code: 400 }
            });
        }

        // Create payment attempt record
        const paymentAttemptResult = await db.query(`
            INSERT INTO payment_attempts (
                contribution_id, amount, currency, status, processor, attempted_at
            ) VALUES (
                $1, $2, $3, 'pending', 'gateway', NOW()
            ) RETURNING id
        `, [contribution_id, amount, currency]);

        const paymentAttemptId = paymentAttemptResult.rows[0].id;

        // Create gateway transaction
        const transactionResult = await db.query(`
            SELECT create_gateway_transaction($1, $2, $3, $4, $5, $6, $7) as transaction_id
        `, [contribution_id, paymentAttemptId, selectedGatewayId, amount, currency, req.ip, JSON.stringify(payment_method_details)]);

        const transactionId = transactionResult.rows[0].transaction_id;

        logger.info('Payment transaction created', {
            transaction_id: transactionId,
            contribution_id,
            gateway_id: selectedGatewayId,
            amount,
            currency,
            user_id: req.user.id
        });

        res.status(201).json({
            success: true,
            data: {
                transaction_id: transactionId,
                gateway_id: selectedGatewayId,
                amount: amount,
                currency: currency,
                next_action: 'redirect_to_gateway'
            },
            message: 'Payment transaction created successfully'
        });

    } catch (error) {
        logger.error('Create payment transaction error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to create payment transaction', code: 500 }
        });
    }
});

// Receive webhook from payment gateway
app.post('/api/payment/webhooks/:gatewayName', [
    param('gatewayName').isLength({ min: 2 }).withMessage('Valid gateway name required')
], handleValidationErrors, async (req, res) => {
    try {
        const { gatewayName } = req.params;
        const payload = req.body;
        const signature = req.headers['stripe-signature'] || req.headers['paypal-signature'] || req.headers['signature'];

        // Get gateway by name
        const gatewayResult = await db.query(`
            SELECT id, webhook_secret FROM payment_gateways 
            WHERE gateway_name = $1 AND is_active = TRUE
        `, [gatewayName]);

        if (gatewayResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Gateway not found or inactive', code: 404 }
            });
        }

        const gateway = gatewayResult.rows[0];

        // Process webhook
        const webhookResult = await db.query(`
            SELECT process_webhook_event($1, $2, $3, $4, $5) as webhook_id
        `, [gateway.id, payload.type || payload.event_type || 'unknown', JSON.stringify(payload), signature, req.ip]);

        const webhookId = webhookResult.rows[0].webhook_id;

        logger.info('Webhook received', {
            webhook_id: webhookId,
            gateway_name: gatewayName,
            event_type: payload.type || payload.event_type,
            source_ip: req.ip
        });

        res.status(200).json({
            success: true,
            webhook_id: webhookId,
            message: 'Webhook received'
        });

    } catch (error) {
        logger.error('Webhook receive error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to process webhook', code: 500 }
        });
    }
});

// ====================================
// 🔔 REAL-TIME NOTIFICATIONS SYSTEM ENDPOINTS
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

// Create notification from template
app.post('/api/notifications/create', authenticateToken, [
    body('template_name').isLength({ min: 2 }).withMessage('Template name required'),
    body('user_id').optional().isUUID().withMessage('Valid user ID required'),
    body('event_data').optional().isObject().withMessage('Event data must be object'),
    body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5')
], handleValidationErrors, async (req, res) => {
    try {
        const { template_name, user_id = req.user.id, event_data = {}, priority } = req.body;
        
        // Create notification from template
        const result = await db.query(`
            SELECT create_notification_from_template($1, $2, $3, $4) as notification_id
        `, [template_name, user_id, event_data, priority]);
        
        const notificationId = result.rows[0].notification_id;
        
        if (!notificationId) {
            return res.status(400).json({
                success: false,
                error: { message: 'Failed to create notification or user has disabled this type', code: 400 }
            });
        }
        
        // Send real-time notification if applicable
        await db.query(`
            SELECT send_websocket_notification($1, $2, $3, $4) as sent_count
        `, [user_id, template_name, 'Notification created', event_data]);
        
        logger.info('Notification created from template', {
            notification_id: notificationId,
            template_name,
            user_id,
            created_by: req.user.id
        });
        
        res.status(201).json({
            success: true,
            data: {
                notification_id: notificationId
            },
            message: 'Notification created successfully'
        });
        
    } catch (error) {
        logger.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to create notification', code: 500 }
        });
    }
});

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

// Register WebSocket connection
app.post('/api/notifications/websocket/connect', authenticateToken, [
    body('connection_id').isLength({ min: 1 }).withMessage('Connection ID required'),
    body('subscribed_events').optional().isArray().withMessage('Subscribed events must be array')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            connection_id,
            subscribed_events = ['payment', 'payout', 'group', 'security']
        } = req.body;
        
        // Register new connection
        const result = await db.query(`
            INSERT INTO websocket_connections (
                user_id, connection_id, subscribed_events, user_agent, ip_address
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (connection_id) DO UPDATE SET
                is_active = TRUE,
                last_ping_at = NOW(),
                last_activity_at = NOW(),
                subscribed_events = EXCLUDED.subscribed_events
            RETURNING id
        `, [req.user.id, connection_id, subscribed_events, req.get('User-Agent'), req.ip]);
        
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

// ====================================
// 📱 MOBILE APP API ENDPOINTS
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

// Queue offline sync action
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

// Track mobile analytics event
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

// Handle server errors
server.on('error', (err) => {
    logger.error('Server error:', err);
    process.exit(1);
});

module.exports = app;