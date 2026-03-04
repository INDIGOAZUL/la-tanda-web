/**
 * Role Management API Endpoints
 * Issue #13 - Admin Role Management Panel
 * Provides endpoints for role applications, assignments, and audit logs
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'latanda_production',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Role hierarchy for validation
const ROLE_HIERARCHY = {
    'user': 1,
    'verified_user': 2,
    'active_member': 3,
    'coordinator': 4,
    'moderator': 5,
    'admin': 6,
    'administrator': 7,
    'super_admin': 8
};

// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
    const userRole = req.user?.role || 'user';
    const roleLevel = ROLE_HIERARCHY[userRole] || 0;

    if (roleLevel < ROLE_HIERARCHY['admin']) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
};

// GET /api/admin/roles/applications - Get all role applications with filters
router.get('/applications', requireAdmin, async (req, res) => {
    try {
        const { status, role, user_id, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT
                ra.id,
                ra.user_id,
                u.name as user_name,
                u.email as user_email,
                ra.current_role,
                ra.requested_role,
                ra.reason,
                ra.status,
                ra.reviewed_by,
                reviewer.name as reviewer_name,
                ra.reviewed_at,
                ra.review_note,
                ra.created_at,
                ra.updated_at
            FROM role_applications ra
            JOIN users u ON ra.user_id = u.user_id
            LEFT JOIN users reviewer ON ra.reviewed_by = reviewer.user_id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND ra.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (role) {
            query += ` AND ra.requested_role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        if (user_id) {
            query += ` AND ra.user_id = $${paramIndex}`;
            params.push(user_id);
            paramIndex++;
        }

        query += ` ORDER BY ra.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM role_applications ra WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (status) {
            countQuery += ` AND ra.status = $${countParamIndex}`;
            countParams.push(status);
            countParamIndex++;
        }

        if (role) {
            countQuery += ` AND ra.requested_role = $${countParamIndex}`;
            countParams.push(role);
            countParamIndex++;
        }

        if (user_id) {
            countQuery += ` AND ra.user_id = $${countParamIndex}`;
            countParams.push(user_id);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            applications: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + result.rows.length) < total
            }
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// PUT /api/admin/roles/applications/:id/approve - Approve role application
router.put('/applications/:id/approve', requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const { review_note } = req.body;
        const adminId = req.user.id;

        // Get application details
        const appResult = await client.query(
            'SELECT * FROM role_applications WHERE id = $1 AND status = $2',
            [id, 'pending']
        );

        if (appResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Application not found or already processed' });
        }

        const application = appResult.rows[0];

        // Update application status
        await client.query(
            `UPDATE role_applications
             SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_note = $3
             WHERE id = $4`,
            ['approved', adminId, review_note, id]
        );

        // Update user role
        await client.query(
            'UPDATE users SET role = $1 WHERE user_id = $2',
            [application.requested_role, application.user_id]
        );

        // Create audit log
        await client.query(
            `INSERT INTO role_audit_logs (user_id, previous_role, new_role, changed_by, change_method, reason, application_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [application.user_id, application.current_role, application.requested_role, adminId, 'application', review_note, id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Application approved successfully',
            application: {
                id,
                user_id: application.user_id,
                new_role: application.requested_role
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving application:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// PUT /api/admin/roles/applications/:id/reject - Reject role application
router.put('/applications/:id/reject', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { review_note } = req.body;
        const adminId = req.user.id;

        const result = await pool.query(
            `UPDATE role_applications
             SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_note = $3
             WHERE id = $4 AND status = $5
             RETURNING *`,
            ['rejected', adminId, review_note, id, 'pending']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Application not found or already processed' });
        }

        res.json({
            success: true,
            message: 'Application rejected successfully',
            application: result.rows[0]
        });
    } catch (error) {
        console.error('Error rejecting application:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/admin/roles/assign - Manually assign role to user
router.post('/assign', requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { user_id, new_role, reason } = req.body;
        const adminId = req.user.id;

        if (!user_id || !new_role) {
            return res.status(400).json({ success: false, error: 'user_id and new_role are required' });
        }

        // Validate role
        if (!ROLE_HIERARCHY[new_role]) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }

        // Get current user role
        const userResult = await client.query(
            'SELECT role FROM users WHERE user_id = $1',
            [user_id]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const currentRole = userResult.rows[0].role || 'user';

        // Update user role
        await client.query(
            'UPDATE users SET role = $1 WHERE user_id = $2',
            [new_role, user_id]
        );

        // Create audit log
        await client.query(
            `INSERT INTO role_audit_logs (user_id, previous_role, new_role, changed_by, change_method, reason)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user_id, currentRole, new_role, adminId, 'manual', reason]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Role assigned successfully',
            user_id,
            previous_role: currentRole,
            new_role
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error assigning role:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// GET /api/admin/roles/users - Get all users with their roles
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const { role, search, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT
                user_id as id,
                name,
                email,
                role,
                created_at,
                last_login,
                status
            FROM users
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (role) {
            query += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        if (search) {
            query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (role) {
            countQuery += ` AND role = $${countParamIndex}`;
            countParams.push(role);
            countParamIndex++;
        }

        if (search) {
            countQuery += ` AND (name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            users: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + result.rows.length) < total
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/admin/roles/audit-logs - Get role change audit logs
router.get('/audit-logs', requireAdmin, async (req, res) => {
    try {
        const { user_id, changed_by, method, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT
                ral.id,
                ral.user_id,
                u.name as user_name,
                ral.previous_role,
                ral.new_role,
                ral.changed_by,
                admin.name as admin_name,
                ral.change_method,
                ral.reason,
                ral.created_at
            FROM role_audit_logs ral
            JOIN users u ON ral.user_id = u.user_id
            LEFT JOIN users admin ON ral.changed_by = admin.user_id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (user_id) {
            query += ` AND ral.user_id = $${paramIndex}`;
            params.push(user_id);
            paramIndex++;
        }

        if (changed_by) {
            query += ` AND ral.changed_by = $${paramIndex}`;
            params.push(changed_by);
            paramIndex++;
        }

        if (method) {
            query += ` AND ral.change_method = $${paramIndex}`;
            params.push(method);
            paramIndex++;
        }

        query += ` ORDER BY ral.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM role_audit_logs ral WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (user_id) {
            countQuery += ` AND ral.user_id = $${countParamIndex}`;
            countParams.push(user_id);
            countParamIndex++;
        }

        if (changed_by) {
            countQuery += ` AND ral.changed_by = $${countParamIndex}`;
            countParams.push(changed_by);
            countParamIndex++;
        }

        if (method) {
            countQuery += ` AND ral.change_method = $${countParamIndex}`;
            countParams.push(method);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            logs: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + result.rows.length) < total
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/admin/roles/stats - Get role statistics
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        // Get role distribution
        const roleDistribution = await pool.query(`
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
            ORDER BY count DESC
        `);

        // Get pending applications count
        const pendingApps = await pool.query(`
            SELECT COUNT(*) as count
            FROM role_applications
            WHERE status = 'pending'
        `);

        // Get recent role changes (last 30 days)
        const recentChanges = await pool.query(`
            SELECT COUNT(*) as count
            FROM role_audit_logs
            WHERE created_at >= NOW() - INTERVAL '30 days'
        `);

        // Get application approval rate
        const approvalRate = await pool.query(`
            SELECT
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(*) as total
            FROM role_applications
            WHERE status IN ('approved', 'rejected')
        `);

        res.json({
            success: true,
            stats: {
                roleDistribution: roleDistribution.rows,
                pendingApplications: parseInt(pendingApps.rows[0].count),
                recentChanges: parseInt(recentChanges.rows[0].count),
                approvalRate: approvalRate.rows[0]
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/admin/roles/export - Export audit logs to CSV
router.get('/export', requireAdmin, async (req, res) => {
    try {
        const { format = 'csv', start_date, end_date } = req.query;

        let query = `
            SELECT
                ral.id,
                ral.user_id,
                u.name as user_name,
                u.email as user_email,
                ral.previous_role,
                ral.new_role,
                ral.changed_by,
                admin.name as admin_name,
                ral.change_method,
                ral.reason,
                ral.created_at
            FROM role_audit_logs ral
            JOIN users u ON ral.user_id = u.user_id
            LEFT JOIN users admin ON ral.changed_by = admin.user_id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (start_date) {
            query += ` AND ral.created_at >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            query += ` AND ral.created_at <= $${paramIndex}`;
            params.push(end_date);
        }

        query += ' ORDER BY ral.created_at DESC';

        const result = await pool.query(query, params);

        if (format === 'csv') {
            // Generate CSV
            const headers = ['ID', 'User ID', 'User Name', 'User Email', 'Previous Role', 'New Role', 'Changed By', 'Admin Name', 'Method', 'Reason', 'Date'];
            const rows = result.rows.map(row => [
                row.id,
                row.user_id,
                row.user_name,
                row.user_email,
                row.previous_role,
                row.new_role,
                row.changed_by,
                row.admin_name,
                row.change_method,
                row.reason || '',
                row.created_at
            ]);

            const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="role_audit_logs_${Date.now()}.csv"`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                logs: result.rows
            });
        }
    } catch (error) {
        console.error('Error exporting logs:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
