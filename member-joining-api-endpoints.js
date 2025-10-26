/**
 * La Tanda - Member Joining Workflow API Endpoints
 * Complete API implementation for member management system
 * Version: 1.0.0
 * Date: 2025-08-02
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'latanda',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Middleware for file uploads
const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Admin authorization middleware
const requireAdmin = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT admin_id FROM groups WHERE id = $1',
            [groupId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        if (result.rows[0].admin_id !== userId) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin authorization error:', error);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

// =====================================================================
// 1. MEMBER REQUEST MANAGEMENT
// =====================================================================

/**
 * POST /api/groups/:groupId/join-request
 * Submit a request to join a group
 */
router.post('/groups/:groupId/join-request', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { groupId } = req.params;
        const userId = req.user.id;
        const {
            message,
            declaredIncome,
            incomeSource,
            canCommitToSchedule,
            hasReadRules,
            emergencyContact
        } = req.body;

        // Check if user already has a pending request or is already a member
        const existingCheck = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM member_requests WHERE user_id = $1 AND group_id = $2 AND request_status IN ('pending', 'under_review')) as pending_requests,
                (SELECT COUNT(*) FROM group_members WHERE user_id = $1 AND group_id = $2) as existing_member
        `, [userId, groupId]);

        const { pending_requests, existing_member } = existingCheck.rows[0];

        if (pending_requests > 0) {
            return res.status(409).json({ 
                error: 'You already have a pending request for this group' 
            });
        }

        if (existing_member > 0) {
            return res.status(409).json({ 
                error: 'You are already a member of this group' 
            });
        }

        // Check group capacity
        const capacityCheck = await client.query(`
            SELECT 
                gml.max_members,
                gml.current_members,
                gml.approval_timeout_hours
            FROM group_member_limits gml
            WHERE gml.group_id = $1
        `, [groupId]);

        if (capacityCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found or not configured' });
        }

        const { max_members, current_members, approval_timeout_hours } = capacityCheck.rows[0];

        if (current_members >= max_members) {
            return res.status(409).json({ 
                error: 'Group is at maximum capacity',
                details: { current_members, max_members }
            });
        }

        // Calculate eligibility score
        const eligibilityResult = await client.query(
            'SELECT check_user_eligibility($1, $2) as eligibility',
            [userId, groupId]
        );

        const eligibility = eligibilityResult.rows[0].eligibility;

        if (!eligibility.eligible) {
            return res.status(400).json({
                error: 'User not eligible for this group',
                eligibility: eligibility
            });
        }

        // Create the member request
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (approval_timeout_hours || 72));

        const requestResult = await client.query(`
            INSERT INTO member_requests (
                group_id, user_id, request_message, declared_income, 
                income_source, eligibility_score, risk_score, expires_at,
                request_metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            groupId, userId, message, declaredIncome, incomeSource,
            eligibility.eligibility_score, 0.00, expiresAt,
            JSON.stringify({
                canCommitToSchedule,
                hasReadRules,
                emergencyContact,
                submittedAt: new Date().toISOString()
            })
        ]);

        const request = requestResult.rows[0];

        // Create initial verification record
        await client.query(`
            INSERT INTO member_verifications (request_id, user_id)
            VALUES ($1, $2)
        `, [request.id, userId]);

        // If eligible for auto-approval, approve immediately
        if (eligibility.auto_approve_eligible) {
            await client.query(`
                UPDATE member_requests 
                SET request_status = 'approved', reviewed_at = NOW(), admin_notes = 'Auto-approved based on eligibility score'
                WHERE id = $1
            `, [request.id]);

            // Create group member record
            const memberNumber = await getNextMemberNumber(client, groupId);
            await client.query(`
                INSERT INTO group_members (
                    group_id, user_id, member_status, member_number, 
                    approved_at, trust_score_at_join
                ) VALUES ($1, $2, 'active', $3, NOW(), $4)
            `, [groupId, userId, memberNumber, eligibility.trust_score]);

            request.request_status = 'approved';
            request.auto_approved = true;
        }

        await client.query('COMMIT');

        // Send notifications to group admin
        await sendAdminNotification(groupId, 'new_member_request', {
            requestId: request.id,
            userId: userId,
            autoApproved: eligibility.auto_approve_eligible
        });

        res.status(201).json({
            success: true,
            request: request,
            eligibility: eligibility,
            autoApproved: eligibility.auto_approve_eligible
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating member request:', error);
        res.status(500).json({ error: 'Failed to create member request' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/member-requests/user/:userId
 * Get all join requests for a user
 */
router.get('/member-requests/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, groupId } = req.query;

        // Users can only see their own requests, unless they're admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        let query = `
            SELECT * FROM member_request_summary 
            WHERE user_id = $1
        `;
        let params = [userId];

        if (status) {
            query += ` AND request_status = $${params.length + 1}`;
            params.push(status);
        }

        if (groupId) {
            query += ` AND group_id = $${params.length + 1}`;
            params.push(groupId);
        }

        query += ' ORDER BY requested_at DESC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            requests: result.rows
        });

    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

/**
 * GET /api/member-requests/group/:groupId
 * Get all join requests for a group (admin only)
 */
router.get('/member-requests/group/:groupId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { status, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT * FROM member_request_summary 
            WHERE group_id = $1
        `;
        let params = [groupId];

        if (status) {
            query += ` AND request_status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY 
            CASE 
                WHEN request_status = 'pending' THEN 1
                WHEN request_status = 'under_review' THEN 2
                ELSE 3
            END,
            requested_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) as total FROM member_requests WHERE group_id = $1' + 
            (status ? ' AND request_status = $2' : ''),
            status ? [groupId, status] : [groupId]
        );

        res.json({
            success: true,
            requests: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Error fetching group requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

/**
 * PUT /api/member-requests/:requestId/status
 * Update request status (admin only)
 */
router.put('/member-requests/:requestId/status', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { requestId } = req.params;
        const { status, adminNotes, conditions } = req.body;
        const adminId = req.user.id;

        // Get request details and verify admin access
        const requestResult = await client.query(`
            SELECT mr.*, g.admin_id 
            FROM member_requests mr
            JOIN groups g ON mr.group_id = g.id
            WHERE mr.id = $1
        `, [requestId]);

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestResult.rows[0];

        if (request.admin_id !== adminId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        if (!['approved', 'rejected', 'under_review'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Update request status
        const updateResult = await client.query(`
            UPDATE member_requests 
            SET request_status = $1, reviewed_at = NOW(), reviewed_by = $2, admin_notes = $3
            WHERE id = $4
            RETURNING *
        `, [status, adminId, adminNotes, requestId]);

        const updatedRequest = updateResult.rows[0];

        // If approved, create group member record
        if (status === 'approved') {
            // Check if member slot is still available
            const capacityCheck = await client.query(`
                SELECT current_members, max_members 
                FROM group_member_limits 
                WHERE group_id = $1
            `, [request.group_id]);

            const { current_members, max_members } = capacityCheck.rows[0];
            
            if (current_members >= max_members) {
                await client.query('ROLLBACK');
                return res.status(409).json({ 
                    error: 'Group is now at maximum capacity' 
                });
            }

            // Get user's trust score
            const trustResult = await client.query(
                'SELECT overall_score FROM user_trust_scores WHERE user_id = $1',
                [request.user_id]
            );

            const trustScore = trustResult.rows[0]?.overall_score || 0.00;

            // Create group member
            const memberNumber = await getNextMemberNumber(client, request.group_id);
            await client.query(`
                INSERT INTO group_members (
                    group_id, user_id, member_status, member_number,
                    approved_at, approved_by, trust_score_at_join, member_notes
                ) VALUES ($1, $2, 'active', $3, NOW(), $4, $5, $6)
            `, [
                request.group_id, request.user_id, memberNumber, 
                adminId, trustScore, conditions ? JSON.stringify(conditions) : null
            ]);

            // Send welcome notification to user
            await sendUserNotification(request.user_id, 'membership_approved', {
                groupId: request.group_id,
                adminNotes: adminNotes
            });
        } else if (status === 'rejected') {
            // Send rejection notification to user
            await sendUserNotification(request.user_id, 'membership_rejected', {
                groupId: request.group_id,
                adminNotes: adminNotes
            });
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            request: updatedRequest,
            memberCreated: status === 'approved'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating request status:', error);
        res.status(500).json({ error: 'Failed to update request status' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/member-requests/:requestId
 * Withdraw a join request (user only)
 */
router.delete('/member-requests/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const result = await pool.query(`
            UPDATE member_requests 
            SET request_status = 'withdrawn', updated_at = NOW()
            WHERE id = $1 AND user_id = $2 AND request_status IN ('pending', 'under_review')
            RETURNING *
        `, [requestId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Request not found or cannot be withdrawn' 
            });
        }

        res.json({
            success: true,
            message: 'Request withdrawn successfully'
        });

    } catch (error) {
        console.error('Error withdrawing request:', error);
        res.status(500).json({ error: 'Failed to withdraw request' });
    }
});

// =====================================================================
// 2. VERIFICATION MANAGEMENT
// =====================================================================

/**
 * POST /api/member-requests/:requestId/verify-phone
 * Initiate phone verification
 */
router.post('/member-requests/:requestId/verify-phone', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { phoneNumber } = req.body;
        const userId = req.user.id;

        // Verify user owns this request
        const requestCheck = await pool.query(
            'SELECT user_id FROM member_requests WHERE id = $1',
            [requestId]
        );

        if (requestCheck.rows.length === 0 || requestCheck.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Update verification record
        await pool.query(`
            UPDATE member_verifications 
            SET phone_verification_code = $1, phone_verification_attempts = phone_verification_attempts + 1
            WHERE request_id = $2
        `, [verificationCode, requestId]);

        // In production, send SMS here
        // await sendSMS(phoneNumber, `Your La Tanda verification code is: ${verificationCode}`);

        // For demo purposes, return the code (remove in production)
        res.json({
            success: true,
            message: 'Verification code sent',
            // Remove this in production:
            debugCode: verificationCode
        });

    } catch (error) {
        console.error('Error initiating phone verification:', error);
        res.status(500).json({ error: 'Failed to initiate phone verification' });
    }
});

/**
 * POST /api/member-requests/:requestId/verify-phone/confirm
 * Confirm phone verification
 */
router.post('/member-requests/:requestId/verify-phone/confirm', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { requestId } = req.params;
        const { verificationCode } = req.body;
        const userId = req.user.id;

        // Verify code
        const verificationResult = await client.query(`
            SELECT mv.*, mr.user_id 
            FROM member_verifications mv
            JOIN member_requests mr ON mv.request_id = mr.id
            WHERE mv.request_id = $1 AND mr.user_id = $2 AND mv.phone_verification_code = $3
        `, [requestId, userId, verificationCode]);

        if (verificationResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Update verification status
        await client.query(`
            UPDATE member_verifications 
            SET phone_verified_at = NOW()
            WHERE request_id = $1
        `, [requestId]);

        // Update member request phone verification status
        await client.query(`
            UPDATE member_requests 
            SET phone_verified = TRUE, updated_at = NOW()
            WHERE id = $1
        `, [requestId]);

        // Update user's phone verification status
        await client.query(`
            UPDATE users 
            SET phone = $1, updated_at = NOW()
            WHERE id = $2
        `, [req.body.phoneNumber || null, userId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Phone verification completed successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error confirming phone verification:', error);
        res.status(500).json({ error: 'Failed to confirm phone verification' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/member-requests/:requestId/upload-documents
 * Upload verification documents
 */
router.post('/member-requests/:requestId/upload-documents', 
    authenticateToken, 
    upload.single('document'), 
    async (req, res) => {
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { requestId } = req.params;
        const { documentType, metadata } = req.body;
        const userId = req.user.id;

        // Verify user owns this request
        const requestCheck = await client.query(
            'SELECT user_id FROM member_requests WHERE id = $1',
            [requestId]
        );

        if (requestCheck.rows.length === 0 || requestCheck.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // In production, upload to cloud storage (Cloudinary, AWS S3, etc.)
        const documentUrl = `/uploads/${req.file.filename}`;
        
        const documentInfo = {
            id: uuidv4(),
            type: documentType,
            filename: req.file.originalname,
            url: documentUrl,
            size: req.file.size,
            uploadedAt: new Date().toISOString(),
            metadata: metadata ? JSON.parse(metadata) : {},
            verified: false
        };

        // Update verification record with document info
        await client.query(`
            UPDATE member_verifications 
            SET uploaded_documents = uploaded_documents || $1::jsonb
            WHERE request_id = $2
        `, [JSON.stringify([documentInfo]), requestId]);

        // Update verification status based on document type
        if (documentType === 'identity_document') {
            await client.query(`
                UPDATE member_verifications 
                SET identity_document_type = $1, identity_document_number = $2
                WHERE request_id = $3
            `, [
                documentInfo.metadata.documentType, 
                documentInfo.metadata.documentNumber, 
                requestId
            ]);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Document uploaded successfully',
            document: documentInfo
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/member-requests/:requestId/verification-status
 * Get verification status for a request
 */
router.get('/member-requests/:requestId/verification-status', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT 
                mr.user_id,
                mr.phone_verified,
                mr.email_verified,
                mr.identity_verified,
                mv.*
            FROM member_requests mr
            LEFT JOIN member_verifications mv ON mr.id = mv.request_id
            WHERE mr.id = $1
        `, [requestId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const verification = result.rows[0];

        // Users can only see their own verification, admins can see all
        if (verification.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Calculate completion percentage
        const completionFactors = [
            verification.phone_verified,
            verification.email_verified,
            verification.identity_verified,
            verification.income_verification_status === 'verified',
            verification.fraud_check_status === 'passed'
        ];

        const completionPercentage = (completionFactors.filter(Boolean).length / completionFactors.length) * 100;

        res.json({
            success: true,
            verification: {
                ...verification,
                completion_percentage: completionPercentage
            }
        });

    } catch (error) {
        console.error('Error fetching verification status:', error);
        res.status(500).json({ error: 'Failed to fetch verification status' });
    }
});

// =====================================================================
// 3. TRUST SCORE MANAGEMENT
// =====================================================================

/**
 * GET /api/users/:userId/trust-score
 * Get user's current trust score
 */
router.get('/users/:userId/trust-score', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Users can see their own score, admins can see any score
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(`
            SELECT 
                uts.*,
                u.name,
                u.verification_level,
                u.kyc_status
            FROM user_trust_scores uts
            JOIN users u ON uts.user_id = u.id
            WHERE uts.user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            // Calculate trust score if it doesn't exist
            await pool.query('SELECT calculate_user_trust_score($1)', [userId]);
            
            // Fetch the newly calculated score
            const newResult = await pool.query(`
                SELECT 
                    uts.*,
                    u.name,
                    u.verification_level,
                    u.kyc_status
                FROM user_trust_scores uts
                JOIN users u ON uts.user_id = u.id
                WHERE uts.user_id = $1
            `, [userId]);

            if (newResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.json({
                success: true,
                trustScore: newResult.rows[0],
                isNew: true
            });
        }

        res.json({
            success: true,
            trustScore: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching trust score:', error);
        res.status(500).json({ error: 'Failed to fetch trust score' });
    }
});

/**
 * POST /api/users/:userId/trust-score/recalculate
 * Force recalculation of trust score (admin only)
 */
router.post('/users/:userId/trust-score/recalculate', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId } = req.params;

        const result = await pool.query(
            'SELECT calculate_user_trust_score($1) as new_score',
            [userId]
        );

        const newScore = result.rows[0].new_score;

        res.json({
            success: true,
            message: 'Trust score recalculated',
            newScore: newScore
        });

    } catch (error) {
        console.error('Error recalculating trust score:', error);
        res.status(500).json({ error: 'Failed to recalculate trust score' });
    }
});

/**
 * GET /api/users/:userId/trust-score/history
 * Get trust score history and trends
 */
router.get('/users/:userId/trust-score/history', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Users can see their own history, admins can see any history
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(`
            SELECT 
                score_history,
                overall_score,
                last_updated,
                calculated_at
            FROM user_trust_scores
            WHERE user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Trust score not found' });
        }

        const trustScore = result.rows[0];
        const history = trustScore.score_history || [];

        // Calculate trends
        const trend = history.length > 1 ? 
            history[history.length - 1].score - history[history.length - 2].score : 0;

        res.json({
            success: true,
            currentScore: trustScore.overall_score,
            history: history,
            trend: trend,
            lastUpdated: trustScore.last_updated
        });

    } catch (error) {
        console.error('Error fetching trust score history:', error);
        res.status(500).json({ error: 'Failed to fetch trust score history' });
    }
});

/**
 * POST /api/users/:userId/reviews
 * Submit a review for a user (group members only)
 */
router.post('/users/:userId/reviews', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { userId } = req.params;
        const reviewerId = req.user.id;
        const {
            groupId,
            overallRating,
            categories,
            comment,
            reviewType = 'standard'
        } = req.body;

        // Verify reviewer and reviewed user are/were in the same group
        const membershipCheck = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM group_members WHERE user_id = $1 AND group_id = $3) as reviewer_member,
                (SELECT COUNT(*) FROM group_members WHERE user_id = $2 AND group_id = $3) as reviewed_member
        `, [reviewerId, userId, groupId]);

        const { reviewer_member, reviewed_member } = membershipCheck.rows[0];

        if (reviewer_member === 0 || reviewed_member === 0) {
            return res.status(403).json({ 
                error: 'Both users must be members of the same group to submit review' 
            });
        }

        // Check if review already exists
        const existingReview = await client.query(`
            SELECT id FROM member_reviews 
            WHERE reviewer_id = $1 AND reviewed_user_id = $2 AND group_id = $3
        `, [reviewerId, userId, groupId]);

        if (existingReview.rows.length > 0) {
            return res.status(409).json({ error: 'Review already exists for this user in this group' });
        }

        // Create review
        const reviewResult = await client.query(`
            INSERT INTO member_reviews (
                reviewer_id, reviewed_user_id, group_id, overall_rating,
                communication_rating, reliability_rating, leadership_rating, cooperation_rating,
                review_comment, review_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            reviewerId, userId, groupId, overallRating,
            categories.communication, categories.reliability, 
            categories.leadership, categories.cooperation,
            comment, reviewType
        ]);

        // Recalculate trust score for reviewed user
        await client.query('SELECT calculate_user_trust_score($1)', [userId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            review: reviewResult.rows[0],
            message: 'Review submitted successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    } finally {
        client.release();
    }
});

// =====================================================================
// 4. GROUP ADMINISTRATION
// =====================================================================

/**
 * GET /api/groups/:groupId/pending-requests
 * Get all pending join requests for a group
 */
router.get('/groups/:groupId/pending-requests', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { groupId } = req.params;

        const result = await pool.query(`
            SELECT * FROM member_request_summary
            WHERE group_id = $1 AND request_status IN ('pending', 'under_review')
            ORDER BY 
                CASE WHEN expires_at < NOW() + INTERVAL '24 hours' THEN 1 ELSE 2 END,
                requested_at ASC
        `, [groupId]);

        res.json({
            success: true,
            pendingRequests: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
});

/**
 * POST /api/groups/:groupId/member-limits
 * Set member limits and eligibility criteria
 */
router.post('/groups/:groupId/member-limits', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { groupId } = req.params;
        const adminId = req.user.id;
        const {
            maxMembers,
            minTrustScore,
            minIncomeRatio,
            autoApproveThreshold,
            requiredVerificationLevel,
            approvalTimeoutHours,
            requiredVerifications,
            locationRestrictions,
            backgroundCheckRequired
        } = req.body;

        const result = await pool.query(`
            INSERT INTO group_member_limits (
                group_id, max_members, min_trust_score, min_income_ratio,
                auto_approve_threshold, required_verification_level, 
                approval_timeout_hours, required_verifications,
                location_restrictions, background_check_required,
                updated_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (group_id) DO UPDATE SET
                max_members = EXCLUDED.max_members,
                min_trust_score = EXCLUDED.min_trust_score,
                min_income_ratio = EXCLUDED.min_income_ratio,
                auto_approve_threshold = EXCLUDED.auto_approve_threshold,
                required_verification_level = EXCLUDED.required_verification_level,
                approval_timeout_hours = EXCLUDED.approval_timeout_hours,
                required_verifications = EXCLUDED.required_verifications,
                location_restrictions = EXCLUDED.location_restrictions,
                background_check_required = EXCLUDED.background_check_required,
                updated_at = NOW(),
                updated_by = EXCLUDED.updated_by,
                rules_version = group_member_limits.rules_version + 1
            RETURNING *
        `, [
            groupId, maxMembers, minTrustScore, minIncomeRatio,
            autoApproveThreshold, requiredVerificationLevel,
            approvalTimeoutHours, JSON.stringify(requiredVerifications || []),
            JSON.stringify(locationRestrictions || []), backgroundCheckRequired,
            adminId
        ]);

        res.json({
            success: true,
            memberLimits: result.rows[0]
        });

    } catch (error) {
        console.error('Error setting member limits:', error);
        res.status(500).json({ error: 'Failed to set member limits' });
    }
});

/**
 * GET /api/groups/:groupId/eligibility-check/:userId
 * Check if a user is eligible to join a group
 */
router.get('/groups/:groupId/eligibility-check/:userId', authenticateToken, async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        const result = await pool.query(
            'SELECT check_user_eligibility($1, $2) as eligibility',
            [userId, groupId]
        );

        const eligibility = result.rows[0].eligibility;

        res.json({
            success: true,
            eligibility: eligibility
        });

    } catch (error) {
        console.error('Error checking user eligibility:', error);
        res.status(500).json({ error: 'Failed to check user eligibility' });
    }
});

/**
 * POST /api/groups/:groupId/bulk-approve
 * Bulk approve multiple requests
 */
router.post('/groups/:groupId/bulk-approve', authenticateToken, requireAdmin, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { groupId } = req.params;
        const { requestIds, adminNotes } = req.body;
        const adminId = req.user.id;

        if (!Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({ error: 'Request IDs array is required' });
        }

        // Check group capacity
        const capacityResult = await client.query(`
            SELECT current_members, max_members 
            FROM group_member_limits 
            WHERE group_id = $1
        `, [groupId]);

        const { current_members, max_members } = capacityResult.rows[0];
        const availableSlots = max_members - current_members;

        if (requestIds.length > availableSlots) {
            return res.status(409).json({ 
                error: `Only ${availableSlots} slots available, but ${requestIds.length} requests selected` 
            });
        }

        const approvedMembers = [];
        const failedApprovals = [];

        for (const requestId of requestIds) {
            try {
                // Get request details
                const requestResult = await client.query(
                    'SELECT * FROM member_requests WHERE id = $1 AND group_id = $2',
                    [requestId, groupId]
                );

                if (requestResult.rows.length === 0) {
                    failedApprovals.push({ requestId, error: 'Request not found' });
                    continue;
                }

                const request = requestResult.rows[0];

                // Update request status
                await client.query(`
                    UPDATE member_requests 
                    SET request_status = 'approved', reviewed_at = NOW(), 
                        reviewed_by = $1, admin_notes = $2
                    WHERE id = $3
                `, [adminId, adminNotes, requestId]);

                // Create group member
                const memberNumber = await getNextMemberNumber(client, groupId);
                
                // Get user's trust score
                const trustResult = await client.query(
                    'SELECT overall_score FROM user_trust_scores WHERE user_id = $1',
                    [request.user_id]
                );

                const trustScore = trustResult.rows[0]?.overall_score || 0.00;

                await client.query(`
                    INSERT INTO group_members (
                        group_id, user_id, member_status, member_number,
                        approved_at, approved_by, trust_score_at_join
                    ) VALUES ($1, $2, 'active', $3, NOW(), $4, $5)
                `, [groupId, request.user_id, memberNumber, adminId, trustScore]);

                approvedMembers.push({
                    requestId,
                    userId: request.user_id,
                    memberNumber
                });

                // Send notification to user
                await sendUserNotification(request.user_id, 'membership_approved', {
                    groupId: groupId,
                    adminNotes: adminNotes
                });

            } catch (error) {
                console.error(`Error approving request ${requestId}:`, error);
                failedApprovals.push({ requestId, error: error.message });
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            approved: approvedMembers,
            failed: failedApprovals,
            summary: {
                totalRequests: requestIds.length,
                successful: approvedMembers.length,
                failed: failedApprovals.length
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error bulk approving requests:', error);
        res.status(500).json({ error: 'Failed to bulk approve requests' });
    } finally {
        client.release();
    }
});

// =====================================================================
// 5. ANALYTICS AND REPORTING
// =====================================================================

/**
 * GET /api/analytics/member-requests/summary
 * Get summary statistics for member requests
 */
router.get('/analytics/member-requests/summary', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { startDate, endDate, groupId } = req.query;

        let whereClause = 'WHERE 1=1';
        let params = [];

        if (startDate) {
            whereClause += ` AND requested_at >= $${params.length + 1}`;
            params.push(startDate);
        }

        if (endDate) {
            whereClause += ` AND requested_at <= $${params.length + 1}`;
            params.push(endDate);
        }

        if (groupId) {
            whereClause += ` AND group_id = $${params.length + 1}`;
            params.push(groupId);
        }

        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_requests,
                COUNT(*) FILTER (WHERE request_status = 'pending') as pending_requests,
                COUNT(*) FILTER (WHERE request_status = 'approved') as approved_requests,
                COUNT(*) FILTER (WHERE request_status = 'rejected') as rejected_requests,
                COUNT(*) FILTER (WHERE request_status = 'expired') as expired_requests,
                AVG(eligibility_score) as avg_eligibility_score,
                AVG(EXTRACT(EPOCH FROM (reviewed_at - requested_at))/3600) FILTER (WHERE reviewed_at IS NOT NULL) as avg_review_time_hours
            FROM member_requests
            ${whereClause}
        `, params);

        const summary = result.rows[0];

        // Calculate approval rate
        const totalProcessed = parseInt(summary.approved_requests) + parseInt(summary.rejected_requests);
        const approvalRate = totalProcessed > 0 ? 
            (parseInt(summary.approved_requests) / totalProcessed * 100).toFixed(2) : 0;

        res.json({
            success: true,
            summary: {
                ...summary,
                approval_rate: parseFloat(approvalRate)
            }
        });

    } catch (error) {
        console.error('Error fetching member request summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

/**
 * GET /api/analytics/trust-scores/distribution
 * Get trust score distribution across the platform
 */
router.get('/analytics/trust-scores/distribution', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                AVG(overall_score) as avg_score,
                MIN(overall_score) as min_score,
                MAX(overall_score) as max_score,
                COUNT(*) FILTER (WHERE overall_score >= 80) as excellent_users,
                COUNT(*) FILTER (WHERE overall_score >= 60 AND overall_score < 80) as good_users,
                COUNT(*) FILTER (WHERE overall_score >= 40 AND overall_score < 60) as average_users,
                COUNT(*) FILTER (WHERE overall_score < 40) as poor_users
            FROM user_trust_scores
        `);

        const distribution = result.rows[0];

        res.json({
            success: true,
            distribution: {
                ...distribution,
                score_ranges: {
                    excellent: { min: 80, max: 100, count: parseInt(distribution.excellent_users) },
                    good: { min: 60, max: 79, count: parseInt(distribution.good_users) },
                    average: { min: 40, max: 59, count: parseInt(distribution.average_users) },
                    poor: { min: 0, max: 39, count: parseInt(distribution.poor_users) }
                }
            }
        });

    } catch (error) {
        console.error('Error fetching trust score distribution:', error);
        res.status(500).json({ error: 'Failed to fetch distribution' });
    }
});

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

async function getNextMemberNumber(client, groupId) {
    const result = await client.query(
        'SELECT COALESCE(MAX(member_number), 0) + 1 as next_number FROM group_members WHERE group_id = $1',
        [groupId]
    );
    return result.rows[0].next_number;
}

async function sendAdminNotification(groupId, type, data) {
    // Implementation would integrate with notification service
    console.log(`Admin notification for group ${groupId}: ${type}`, data);
}

async function sendUserNotification(userId, type, data) {
    // Implementation would integrate with notification service
    console.log(`User notification for user ${userId}: ${type}`, data);
}

// Cron job to expire old requests (would be better to use a proper job scheduler)
setInterval(async () => {
    try {
        const result = await pool.query('SELECT expire_old_requests()');
        const expiredCount = result.rows[0].expire_old_requests;
        if (expiredCount > 0) {
            console.log(`Expired ${expiredCount} old member requests`);
        }
    } catch (error) {
        console.error('Error expiring old requests:', error);
    }
}, 60 * 60 * 1000); // Run every hour

module.exports = router;