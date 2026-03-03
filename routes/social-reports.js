/**
 * Content Report API Routes
 * Implements bounty #51 - Content Report/Flag System
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const db = require('../database/connection');
const auth = require('../middleware/auth');
const router = express.Router();

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

// Valid report reasons
const VALID_REASONS = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'];

/**
 * POST /api/social/report
 * Submit a content report
 */
router.post('/social/report', [
    auth,
    body('event_id').optional().isUUID(),
    body('comment_id').optional().isUUID(),
    body('reason').isIn(VALID_REASONS).withMessage('Invalid reason'),
    body('description').optional().trim().isLength({ max: 1000 })
], handleValidationErrors, async (req, res) => {
    try {
        const { event_id, comment_id, reason, description } = req.body;
        const reporter_id = req.user.userId;

        // Must provide either event_id or comment_id
        if (!event_id && !comment_id) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Must provide either event_id or comment_id',
                    code: 400
                }
            });
        }

        // Check if already reported by this user
        const existingReport = await db.query(
            `SELECT id FROM social_reports 
             WHERE reporter_id = $1 
             AND (($2::uuid IS NOT NULL AND event_id = $2) OR ($3::uuid IS NOT NULL AND comment_id = $3))`,
            [reporter_id, event_id || null, comment_id || null]
        );

        if (existingReport.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'You have already reported this content',
                    code: 409
                }
            });
        }

        // Create report
        const result = await db.query(
            `INSERT INTO social_reports (reporter_id, event_id, comment_id, reason, description, status, created_at)
             VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
             RETURNING id, reporter_id, event_id, comment_id, reason, description, status, created_at`,
            [reporter_id, event_id || null, comment_id || null, reason, description || null]
        );

        res.status(201).json({
            success: true,
            data: {
                report: result.rows[0],
                message: 'Report submitted successfully'
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Report submission error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to submit report',
                code: 500
            }
        });
    }
});

/**
 * GET /api/social/reports
 * Get reports submitted by current user
 */
router.get('/social/reports', auth, async (req, res) => {
    try {
        const reporter_id = req.user.userId;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT r.*, 
                    e.content as event_content,
                    c.content as comment_content
             FROM social_reports r
             LEFT JOIN social_feed e ON r.event_id = e.id
             LEFT JOIN social_comments c ON r.comment_id = c.id
             WHERE r.reporter_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [reporter_id, limit, offset]
        );

        const countResult = await db.query(
            'SELECT COUNT(*) FROM social_reports WHERE reporter_id = $1',
            [reporter_id]
        );

        res.json({
            success: true,
            data: {
                reports: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].count),
                    pages: Math.ceil(countResult.rows[0].count / limit)
                }
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve reports',
                code: 500
            }
        });
    }
});

/**
 * GET /api/admin/reports
 * Admin: Get all reports with filtering
 */
router.get('/admin/reports', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Admin access required',
                    code: 403
                }
            });
        }

        const { status, reason, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` AND r.status = $${paramIndex++}`;
            params.push(status);
        }

        if (reason) {
            whereClause += ` AND r.reason = $${paramIndex++}`;
            params.push(reason);
        }

        params.push(limit, offset);

        const result = await db.query(
            `SELECT r.*, 
                    u.name as reporter_name,
                    u.email as reporter_email,
                    e.content as event_content,
                    e.author_id as event_author_id,
                    c.content as comment_content,
                    c.author_id as comment_author_id,
                    au.name as resolver_name
             FROM social_reports r
             LEFT JOIN users u ON r.reporter_id = u.user_id
             LEFT JOIN social_feed e ON r.event_id = e.id
             LEFT JOIN social_comments c ON r.comment_id = c.id
             LEFT JOIN users au ON r.resolved_by = au.user_id
             ${whereClause}
             ORDER BY r.created_at DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            params
        );

        // Get counts by status
        const statsResult = await db.query(
            `SELECT status, COUNT(*) as count 
             FROM social_reports 
             GROUP BY status`
        );

        res.json({
            success: true,
            data: {
                reports: result.rows,
                stats: statsResult.rows.reduce((acc, row) => {
                    acc[row.status] = parseInt(row.count);
                    return acc;
                }, {}),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Admin get reports error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve reports',
                code: 500
            }
        });
    }
});

/**
 * PUT /api/admin/reports/:id
 * Admin: Update report status
 */
router.put('/admin/reports/:id', [
    auth,
    param('id').isUUID(),
    body('status').isIn(['reviewing', 'resolved', 'dismissed']),
    body('admin_notes').optional().trim()
], handleValidationErrors, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Admin access required',
                    code: 403
                }
            });
        }

        const { id } = req.params;
        const { status, admin_notes } = req.body;
        const resolved_by = req.user.userId;

        const result = await db.query(
            `UPDATE social_reports 
             SET status = $1, 
                 admin_notes = COALESCE($2, admin_notes), 
                 resolved_by = CASE WHEN $1 IN ('resolved', 'dismissed') THEN $3 ELSE resolved_by END,
                 resolved_at = CASE WHEN $1 IN ('resolved', 'dismissed') THEN NOW() ELSE resolved_at END
             WHERE id = $4
             RETURNING *`,
            [status, admin_notes, resolved_by, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Report not found',
                    code: 404
                }
            });
        }

        res.json({
            success: true,
            data: {
                report: result.rows[0],
                message: 'Report updated successfully'
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update report',
                code: 500
            }
        });
    }
});

/**
 * GET /api/admin/reports/stats
 * Admin: Get report statistics
 */
router.get('/admin/reports/stats', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Admin access required',
                    code: 403
                }
            });
        }

        const stats = await db.query(
            `SELECT 
                status,
                reason,
                COUNT(*) as count,
                DATE_TRUNC('day', created_at) as date
             FROM social_reports
             GROUP BY status, reason, DATE_TRUNC('day', created_at)
             ORDER BY date DESC`
        );

        const totalResult = await db.query(
            'SELECT COUNT(*) as total FROM social_reports'
        );

        const pendingResult = await db.query(
            "SELECT COUNT(*) as pending FROM social_reports WHERE status = 'pending'"
        );

        res.json({
            success: true,
            data: {
                total: parseInt(totalResult.rows[0].total),
                pending: parseInt(pendingResult.rows[0].pending),
                breakdown: stats.rows
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve statistics',
                code: 500
            }
        });
    }
});

module.exports = router;
