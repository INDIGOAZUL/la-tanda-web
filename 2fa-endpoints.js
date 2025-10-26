/**
 * 🔐 LA TANDA TWO-FACTOR AUTHENTICATION API ENDPOINTS
 * Complete 2FA implementation with SMS, Email, and TOTP support
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

// ====================================
// 🔐 2FA SETUP ENDPOINTS
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
        let verification_result = {};

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
            const verifyResult = await db.query(
                'SELECT verify_2fa_code($1, $2, $3, $4, $5) as result',
                [userId, method, code, req.ip, req.get('User-Agent')]
            );

            verification_result = verifyResult.rows[0].result;
            isValid = verification_result.success;
        }

        if (isValid) {
            // Mark method as verified and generate backup codes
            await db.query(`
                UPDATE user_2fa_settings 
                SET ${method === 'sms' ? 'phone_verified' : method === 'email' ? 'email_verified' : 'totp_setup_at'} = NOW(),
                    setup_completed_at = CASE 
                        WHEN setup_completed_at IS NULL THEN NOW() 
                        ELSE setup_completed_at 
                    END
                WHERE user_id = $1
            `, [userId]);

            // Generate backup codes if this is the first method setup
            const backupCodesResult = await db.query(
                'SELECT generate_backup_codes($1) as codes',
                [userId]
            );

            const backupCodes = backupCodesResult.rows[0].codes;

            // Enable 2FA for user
            await db.query(`
                UPDATE user_2fa_settings 
                SET is_enabled = TRUE
                WHERE user_id = $1
            `, [userId]);

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

// ====================================
// 🔐 2FA AUTHENTICATION ENDPOINTS  
// ====================================

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
        let verification_result = {};

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
            // Verify SMS/Email/Backup code using database function
            const verifyResult = await db.query(
                'SELECT verify_2fa_code($1, $2, $3, $4, $5) as result',
                [user_id, method, code, req.ip, req.get('User-Agent')]
            );

            verification_result = verifyResult.rows[0].result;
            isValid = verification_result.success;
        }

        if (isValid) {
            // Get user information for token generation
            const userResult = await db.query(
                'SELECT id, email, role FROM users WHERE id = $1',
                [user_id]
            );

            const user = userResult.rows[0];

            // Generate JWT token
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

            // Handle trusted device
            let device_trust_token = null;
            if (trust_device) {
                const deviceFingerprint = generateDeviceFingerprint(req);
                device_trust_token = await addTrustedDevice(user_id, deviceFingerprint, req);
            }

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
                    two_factor_verified: true,
                    device_trusted: trust_device,
                    device_trust_token
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

// ====================================
// 🔐 2FA MANAGEMENT ENDPOINTS
// ====================================

// Disable 2FA
app.post('/api/users/2fa/disable', authenticateToken, [
    body('current_password').isLength({ min: 6 }).withMessage('Current password is required'),
    body('confirmation_code').isLength({ min: 4, max: 8 }).withMessage('2FA confirmation code required')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, confirmation_code } = req.body;

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

        // Verify 2FA confirmation code
        const verifyResult = await db.query(
            'SELECT verify_2fa_code($1, $2, $3) as result',
            [userId, 'totp', confirmation_code] // Prefer TOTP for disable confirmation
        );

        if (!verifyResult.rows[0].result.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid 2FA confirmation code',
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

        // Revoke all trusted devices
        await db.query(`
            UPDATE user_trusted_devices 
            SET is_revoked = TRUE, 
                revoked_at = NOW(),
                revoked_reason = '2FA disabled by user'
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

// Generate new backup codes
app.post('/api/users/2fa/backup-codes/regenerate', authenticateToken, [
    body('confirmation_code').isLength({ min: 4, max: 8 }).withMessage('2FA confirmation required')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { confirmation_code } = req.body;

        // Verify 2FA is enabled
        const settingsResult = await db.query(
            'SELECT is_enabled FROM user_2fa_settings WHERE user_id = $1',
            [userId]
        );

        if (!settingsResult.rows[0]?.is_enabled) {
            return res.status(400).json({
                success: false,
                error: {
                    message: '2FA is not enabled',
                    code: 400
                }
            });
        }

        // Verify confirmation code
        const verifyResult = await db.query(
            'SELECT verify_2fa_code($1, $2, $3) as result',
            [userId, 'totp', confirmation_code]
        );

        if (!verifyResult.rows[0].result.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid confirmation code',
                    code: 400
                }
            });
        }

        // Generate new backup codes
        const backupCodesResult = await db.query(
            'SELECT generate_backup_codes($1) as codes',
            [userId]
        );

        logger.info('Backup codes regenerated', {
            userId,
            ip: req.ip
        });

        res.json({
            success: true,
            data: {
                backup_codes: backupCodesResult.rows[0].codes,
                generated_at: new Date().toISOString()
            },
            message: 'New backup codes generated successfully'
        });

    } catch (error) {
        logger.error('Backup codes regeneration error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to regenerate backup codes',
                code: 500
            }
        });
    }
});

// ====================================
// 🔐 HELPER FUNCTIONS
// ====================================

async function sendSMSVerificationCode(userId, phoneNumber, attemptType = 'setup') {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    
    // Store attempt in database
    await db.query(`
        INSERT INTO user_2fa_attempts (
            user_id, method_type, attempt_type, code_sent, code_expires_at
        ) VALUES ($1, 'sms', $2, $3, NOW() + INTERVAL '10 minutes')
    `, [userId, attemptType, code]);

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    logger.info('SMS 2FA code generated', {
        userId,
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        code: code.substring(0, 2) + '****' // Log partial code for debugging
    });

    return {
        message: `SMS code sent to ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`,
        expires_in: 600 // 10 minutes
    };
}

async function sendEmailVerificationCode(userId, email, attemptType = 'setup') {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    
    // Store attempt in database
    await db.query(`
        INSERT INTO user_2fa_attempts (
            user_id, method_type, attempt_type, code_sent, code_expires_at
        ) VALUES ($1, 'email', $2, $3, NOW() + INTERVAL '10 minutes')
    `, [userId, attemptType, code]);

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    logger.info('Email 2FA code generated', {
        userId,
        email: email.replace(/(?<=.{2}).*(?=@)/, '*'.repeat(5)),
        code: code.substring(0, 2) + '****'
    });

    return {
        message: `Email code sent to ${email.replace(/(?<=.{2}).*(?=@)/, '*'.repeat(5))}`,
        expires_in: 600 // 10 minutes
    };
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

async function addTrustedDevice(userId, deviceFingerprint, req) {
    const deviceInfo = {
        user_agent: req.get('User-Agent'),
        ip: req.ip,
        device_type: detectDeviceType(req.get('User-Agent'))
    };

    await db.query(`
        INSERT INTO user_trusted_devices (
            user_id, device_fingerprint, device_name, device_type,
            user_agent, first_seen_ip, last_seen_ip, trust_expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '30 days')
        ON CONFLICT (user_id, device_fingerprint) UPDATE SET
            last_used_at = NOW(),
            last_seen_ip = $7,
            is_trusted = TRUE,
            is_revoked = FALSE,
            trust_expires_at = NOW() + INTERVAL '30 days'
    `, [
        userId,
        deviceFingerprint,
        `${deviceInfo.device_type} Device`,
        deviceInfo.device_type,
        deviceInfo.user_agent,
        deviceInfo.ip,
        deviceInfo.ip
    ]);

    return crypto.randomBytes(32).toString('hex'); // Device trust token
}

function detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
}

module.exports = {
    sendSMSVerificationCode,
    sendEmailVerificationCode,
    generateDeviceFingerprint,
    addTrustedDevice
};