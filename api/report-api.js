/**
 * Content Report System - Backend API
 * Issue #51 - La Tanda Web
 *
 * Implements content moderation endpoints:
 * - POST /api/feed/social/report - Submit report
 * - GET /api/admin/reports - List pending reports
 * - POST /api/admin/reports/:id/resolve - Resolve report
 */

// This file should be integrated into the main API file
// (integrated-api-complete-95-endpoints.js or similar)

// Rate limiting configuration for reports
const REPORT_RATE_LIMIT = {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10 // 10 reports per day per user
};

// ============================================================================
// USER ENDPOINT: Submit Report
// ============================================================================

/**
 * POST /api/feed/social/report
 * Submit a content report
 *
 * Body: {
 *   event_id?: UUID,
 *   comment_id?: UUID,
 *   reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other',
 *   description?: string
 * }
 *
 * Rate limit: 10 reports per day per user
 */
async function submitReport(req, res) {
    try {
        const { event_id, comment_id, reason, description } = req.body;
        const reporter_id = req.user.user_id;

        // Validation
        if (!event_id && !comment_id) {
            return res.status(400).json({
                success: false,
                error: 'Debe especificar event_id o comment_id'
            });
        }

        if (event_id && comment_id) {
            return res.status(400).json({
                success: false,
                error: 'Solo puede reportar un post o un comentario, no ambos'
            });
        }

        const validReasons = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                error: 'Razón inválida. Debe ser: spam, harassment, inappropriate, misinformation, o other'
            });
        }

        // Check rate limit (10 reports per day)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentReportsQuery = `
            SELECT COUNT(*) as count
            FROM social_reports
            WHERE reporter_id = $1 AND created_at > $2
        `;
        const recentReports = await pool.query(recentReportsQuery, [reporter_id, oneDayAgo]);

        if (parseInt(recentReports.rows[0].count) >= 10) {
            return res.status(429).json({
                success: false,
                error: 'Has alcanzado el límite de 10 reportes por día'
            });
        }

        // Check if content exists
        if (event_id) {
            const eventCheck = await pool.query(
                'SELECT id FROM social_feed WHERE id = $1',
                [event_id]
            );
            if (eventCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Publicación no encontrada'
                });
            }
        }

        if (comment_id) {
            const commentCheck = await pool.query(
                'SELECT id FROM social_comments WHERE id = $1',
                [comment_id]
            );
            if (commentCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Comentario no encontrado'
                });
            }
        }

        // Check for duplicate report (same user + same content)
        const duplicateCheck = await pool.query(
            `SELECT id FROM social_reports
             WHERE reporter_id = $1
             AND (event_id = $2 OR comment_id = $3)`,
            [reporter_id, event_id, comment_id]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Ya has reportado este contenido anteriormente'
            });
        }

        // Insert report
        const insertQuery = `
            INSERT INTO social_reports (
                reporter_id, event_id, comment_id, reason, description
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `;

        const result = await pool.query(insertQuery, [
            reporter_id,
            event_id || null,
            comment_id || null,
            reason,
            description || null
        ]);

        // Log the report
        console.log(`[REPORT] User ${reporter_id} reported ${event_id ? 'post' : 'comment'} ${event_id || comment_id} for ${reason}`);

        res.json({
            success: true,
            data: {
                report_id: result.rows[0].id,
                created_at: result.rows[0].created_at,
                message: 'Reporte enviado exitosamente. Nuestro equipo lo revisará pronto.'
            }
        });

    } catch (error) {
        console.error('[ERROR] Submit report:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar el reporte'
        });
    }
}

// ============================================================================
// ADMIN ENDPOINT: List Reports
// ============================================================================

/**
 * GET /api/admin/reports
 * List pending reports with pagination
 *
 * Query params:
 *   - status: 'pending' | 'reviewed' | 'dismissed' | 'actioned' (default: 'pending')
 *   - limit: number (default: 20, max: 100)
 *   - offset: number (default: 0)
 *
 * Requires: admin, administrator, or super_admin role
 */
async function listReports(req, res) {
    try {
        const { status = 'pending', limit = 20, offset = 0 } = req.query;
        const userRole = req.user.role;

        // Check admin permission
        const adminRoles = ['admin', 'administrator', 'super_admin', 'moderator'];
        if (!adminRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado. Se requiere rol de administrador.'
            });
        }

        // Validate status
        const validStatuses = ['pending', 'reviewed', 'dismissed', 'actioned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Estado inválido'
            });
        }

        // Validate pagination
        const limitNum = Math.min(parseInt(limit) || 20, 100);
        const offsetNum = parseInt(offset) || 0;

        // Query reports with content preview and reporter info
        const query = `
            SELECT
                r.id,
                r.reporter_id,
                r.event_id,
                r.comment_id,
                r.reason,
                r.description,
                r.status,
                r.reviewed_by,
                r.reviewed_at,
                r.resolution_note,
                r.created_at,
                u.name as reporter_name,
                u.email as reporter_email,
                CASE
                    WHEN r.event_id IS NOT NULL THEN sf.event_title
                    WHEN r.comment_id IS NOT NULL THEN sc.content
                END as content_preview,
                CASE
                    WHEN r.event_id IS NOT NULL THEN sf.actor_id
                    WHEN r.comment_id IS NOT NULL THEN sc.user_id
                END as content_author_id,
                CASE
                    WHEN r.event_id IS NOT NULL THEN 'post'
                    WHEN r.comment_id IS NOT NULL THEN 'comment'
                END as content_type
            FROM social_reports r
            LEFT JOIN users u ON r.reporter_id = u.user_id
            LEFT JOIN social_feed sf ON r.event_id = sf.id
            LEFT JOIN social_comments sc ON r.comment_id = sc.id
            WHERE r.status = $1
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [status, limitNum, offsetNum]);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM social_reports
            WHERE status = $1
        `;
        const countResult = await pool.query(countQuery, [status]);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: {
                reports: result.rows,
                pagination: {
                    total,
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: offsetNum + limitNum < total
                }
            }
        });

    } catch (error) {
        console.error('[ERROR] List reports:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener reportes'
        });
    }
}

// ============================================================================
// ADMIN ENDPOINT: Resolve Report
// ============================================================================

/**
 * POST /api/admin/reports/:id/resolve
 * Resolve a report
 *
 * Body: {
 *   action: 'dismiss' | 'warn' | 'hide',
 *   resolution_note?: string
 * }
 *
 * Requires: admin, administrator, or super_admin role
 */
async function resolveReport(req, res) {
    try {
        const { id } = req.params;
        const { action, resolution_note } = req.body;
        const reviewer_id = req.user.user_id;
        const userRole = req.user.role;

        // Check admin permission
        const adminRoles = ['admin', 'administrator', 'super_admin', 'moderator'];
        if (!adminRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado. Se requiere rol de administrador.'
            });
        }

        // Validate action
        const validActions = ['dismiss', 'warn', 'hide'];
        if (!action || !validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Acción inválida. Debe ser: dismiss, warn, o hide'
            });
        }

        // Get report details
        const reportQuery = `
            SELECT * FROM social_reports WHERE id = $1
        `;
        const reportResult = await pool.query(reportQuery, [id]);

        if (reportResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Reporte no encontrado'
            });
        }

        const report = reportResult.rows[0];

        // Determine new status based on action
        let newStatus = 'reviewed';
        if (action === 'dismiss') {
            newStatus = 'dismissed';
        } else if (action === 'hide') {
            newStatus = 'actioned';

            // Hide the content
            if (report.event_id) {
                await pool.query(
                    'UPDATE social_feed SET is_hidden = TRUE WHERE id = $1',
                    [report.event_id]
                );
            } else if (report.comment_id) {
                await pool.query(
                    'UPDATE social_comments SET is_hidden = TRUE WHERE id = $1',
                    [report.comment_id]
                );
            }
        } else if (action === 'warn') {
            newStatus = 'actioned';
            // TODO: Send warning notification to content author
        }

        // Update report
        const updateQuery = `
            UPDATE social_reports
            SET status = $1,
                reviewed_by = $2,
                reviewed_at = NOW(),
                resolution_note = $3
            WHERE id = $4
            RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [
            newStatus,
            reviewer_id,
            resolution_note || null,
            id
        ]);

        // BONUS: Notify reporter (if notification system exists)
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, link)
                 VALUES ($1, 'report_resolved', 'Reporte Resuelto', $2, NULL)`,
                [
                    report.reporter_id,
                    `Tu reporte ha sido revisado. Acción tomada: ${action === 'dismiss' ? 'Desestimado' : action === 'hide' ? 'Contenido ocultado' : 'Advertencia enviada'}`
                ]
            );
        } catch (notifError) {
            console.log('[INFO] Notification system not available or error:', notifError.message);
        }

        console.log(`[REPORT] Admin ${reviewer_id} resolved report ${id} with action: ${action}`);

        res.json({
            success: true,
            data: {
                report: updateResult.rows[0],
                message: 'Reporte resuelto exitosamente'
            }
        });

    } catch (error) {
        console.error('[ERROR] Resolve report:', error);
        res.status(500).json({
            success: false,
            error: 'Error al resolver el reporte'
        });
    }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

module.exports = {
    submitReport,
    listReports,
    resolveReport,
    REPORT_RATE_LIMIT
};

// ============================================================================
// INTEGRATION INSTRUCTIONS
// ============================================================================

/*
To integrate these endpoints into your main API file:

1. Add to your Express app:

const { submitReport, listReports, resolveReport, REPORT_RATE_LIMIT } = require('./report-api');
const rateLimit = require('express-rate-limit');

// Rate limiter for reports
const reportLimiter = rateLimit(REPORT_RATE_LIMIT);

// User endpoint
app.post('/api/feed/social/report', authenticateToken, reportLimiter, submitReport);

// Admin endpoints
app.get('/api/admin/reports', authenticateToken, listReports);
app.post('/api/admin/reports/:id/resolve', authenticateToken, resolveReport);

2. Ensure you have the following middleware:
   - authenticateToken: JWT authentication middleware
   - pool: PostgreSQL connection pool

3. Run the database migration:
   psql -U your_user -d your_database -f database/migrations/create_social_reports.sql
*/
