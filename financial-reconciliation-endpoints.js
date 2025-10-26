/**
 * 📊 LA TANDA AUTOMATED FINANCIAL RECONCILIATION SYSTEM
 * Complete financial reconciliation and reporting API endpoints
 */

const { body, param, query } = require('express-validator');

// ====================================
// 📊 FINANCIAL RECONCILIATION ENDPOINTS
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

// Get reconciliation report details
app.get('/api/financial/reconciliation/reports/:reportId', authenticateToken, requireRole(['administrator']), [
    param('reportId').isUUID().withMessage('Valid report ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { reportId } = req.params;

        // Get report details
        const reportResult = await db.query(`
            SELECT 
                frr.*,
                generated_user.name as generated_by_name,
                reviewed_user.name as reviewed_by_name
            FROM financial_reconciliation_reports frr
            LEFT JOIN users generated_user ON frr.generated_by = generated_user.id
            LEFT JOIN users reviewed_user ON frr.reviewed_by = reviewed_user.id
            WHERE frr.id = $1
        `, [reportId]);

        if (reportResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Reconciliation report not found', code: 404 }
            });
        }

        const report = reportResult.rows[0];

        // Get associated discrepancies
        const discrepanciesResult = await db.query(`
            SELECT 
                fd.*,
                g.name as group_name,
                resolved_user.name as resolved_by_name
            FROM financial_discrepancies fd
            LEFT JOIN groups g ON fd.group_id = g.id
            LEFT JOIN users resolved_user ON fd.resolved_by = resolved_user.id
            WHERE fd.reconciliation_report_id = $1
            ORDER BY fd.severity DESC, fd.detected_at DESC
        `, [reportId]);

        res.json({
            success: true,
            data: {
                report: report,
                discrepancies: discrepanciesResult.rows,
                summary: {
                    total_discrepancies: report.total_discrepancies,
                    critical_discrepancies: report.critical_discrepancies,
                    accuracy_percentage: report.overall_accuracy_percentage,
                    processing_duration: report.processing_duration_seconds,
                    status: report.reconciliation_status
                }
            }
        });

    } catch (error) {
        logger.error('Get reconciliation report error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get reconciliation report', code: 500 }
        });
    }
});

// Get list of reconciliation reports
app.get('/api/financial/reconciliation/reports', authenticateToken, requireRole(['administrator']), [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['processing', 'completed', 'failed', 'partial', 'requires_review']).withMessage('Valid status required'),
    query('report_type').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).withMessage('Valid report type required')
], handleValidationErrors, async (req, res) => {
    try {
        const { limit = 20, status, report_type } = req.query;

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

        if (report_type) {
            query += ` AND frr.report_type = $${params.length + 1}`;
            params.push(report_type);
        }

        query += ` ORDER BY frr.generated_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);

        // Get summary statistics
        const statsResult = await db.query(`
            SELECT 
                COUNT(*) as total_reports,
                COUNT(*) FILTER (WHERE reconciliation_status = 'completed') as completed_reports,
                COUNT(*) FILTER (WHERE reconciliation_status = 'requires_review') as reports_needing_review,
                COUNT(*) FILTER (WHERE critical_discrepancies > 0) as reports_with_critical_issues,
                AVG(overall_accuracy_percentage) as average_accuracy
            FROM financial_reconciliation_reports
        `);

        res.json({
            success: true,
            data: {
                reports: result.rows,
                count: result.rows.length,
                statistics: statsResult.rows[0],
                filters: { status, report_type }
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

// ====================================
// 🔍 DISCREPANCY MANAGEMENT ENDPOINTS
// ====================================

// Get financial discrepancies
app.get('/api/financial/discrepancies', authenticateToken, requireRole(['administrator']), [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid severity required'),
    query('status').optional().isIn(['open', 'investigating', 'resolved', 'escalated', 'waived']).withMessage('Valid status required'),
    query('report_id').optional().isUUID().withMessage('Valid report ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { limit = 20, severity, status, report_id } = req.query;

        // Build query with optional filters
        let query = `
            SELECT 
                fd.*,
                frr.report_type,
                frr.report_period_start,
                frr.report_period_end,
                g.name as group_name,
                resolved_user.name as resolved_by_name
            FROM financial_discrepancies fd
            JOIN financial_reconciliation_reports frr ON fd.reconciliation_report_id = frr.id
            LEFT JOIN groups g ON fd.group_id = g.id
            LEFT JOIN users resolved_user ON fd.resolved_by = resolved_user.id
            WHERE 1=1
        `;

        const params = [];

        if (severity) {
            query += ` AND fd.severity = $${params.length + 1}`;
            params.push(severity);
        }

        if (status) {
            query += ` AND fd.resolution_status = $${params.length + 1}`;
            params.push(status);
        }

        if (report_id) {
            query += ` AND fd.reconciliation_report_id = $${params.length + 1}`;
            params.push(report_id);
        }

        query += ` ORDER BY fd.severity DESC, fd.detected_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);

        // Get summary statistics
        const statsResult = await db.query(`
            SELECT 
                COUNT(*) as total_discrepancies,
                COUNT(*) FILTER (WHERE resolution_status = 'open') as open_discrepancies,
                COUNT(*) FILTER (WHERE severity = 'critical') as critical_discrepancies,
                COUNT(*) FILTER (WHERE resolution_status = 'resolved') as resolved_discrepancies
            FROM financial_discrepancies
            ${report_id ? 'WHERE reconciliation_report_id = $1' : ''}
        `, report_id ? [report_id] : []);

        res.json({
            success: true,
            data: {
                discrepancies: result.rows,
                count: result.rows.length,
                statistics: statsResult.rows[0],
                filters: { severity, status, report_id }
            }
        });

    } catch (error) {
        logger.error('Get financial discrepancies error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get financial discrepancies', code: 500 }
        });
    }
});

// Resolve financial discrepancy
app.post('/api/financial/discrepancies/:discrepancyId/resolve', authenticateToken, requireRole(['administrator']), [
    param('discrepancyId').isUUID().withMessage('Valid discrepancy ID required'),
    body('resolution_method').isLength({ min: 2, max: 100 }).withMessage('Resolution method required'),
    body('resolution_notes').optional().isLength({ max: 1000 }).withMessage('Resolution notes must be under 1000 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { discrepancyId } = req.params;
        const { resolution_method, resolution_notes } = req.body;

        // Check if discrepancy exists and is not already resolved
        const discrepancyCheck = await db.query(`
            SELECT id, resolution_status, discrepancy_type, severity
            FROM financial_discrepancies 
            WHERE id = $1
        `, [discrepancyId]);

        if (discrepancyCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Discrepancy not found', code: 404 }
            });
        }

        const discrepancy = discrepancyCheck.rows[0];

        if (discrepancy.resolution_status === 'resolved') {
            return res.status(400).json({
                success: false,
                error: { message: 'Discrepancy already resolved', code: 400 }
            });
        }

        // Update discrepancy resolution
        await db.query(`
            UPDATE financial_discrepancies 
            SET resolution_status = 'resolved',
                resolution_method = $1,
                resolution_notes = $2,
                resolved_by = $3,
                resolved_at = NOW(),
                updated_at = NOW()
            WHERE id = $4
        `, [resolution_method, resolution_notes, req.user.id, discrepancyId]);

        // Log audit trail
        await db.query(`
            INSERT INTO financial_audit_trail (
                operation_type, entity_type, entity_id,
                operation_description, operation_metadata,
                performed_by
            ) VALUES (
                'manual_correction', 'discrepancy', $1,
                'Financial discrepancy resolved manually',
                $2,
                $3
            )
        `, [
            discrepancyId,
            JSON.stringify({
                discrepancy_type: discrepancy.discrepancy_type,
                severity: discrepancy.severity,
                resolution_method,
                resolution_notes
            }),
            req.user.id
        ]);

        logger.info('Financial discrepancy resolved', {
            discrepancy_id: discrepancyId,
            discrepancy_type: discrepancy.discrepancy_type,
            severity: discrepancy.severity,
            resolution_method,
            resolved_by: req.user.id
        });

        res.json({
            success: true,
            data: {
                discrepancy_id: discrepancyId,
                resolution_method,
                resolved_at: new Date().toISOString()
            },
            message: 'Discrepancy resolved successfully'
        });

    } catch (error) {
        logger.error('Resolve discrepancy error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to resolve discrepancy', code: 500 }
        });
    }
});

// ====================================
// 📈 FINANCIAL REPORTING ENDPOINTS
// ====================================

// Get financial audit trail
app.get('/api/financial/audit-trail', authenticateToken, requireRole(['administrator']), [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('operation_type').optional().isLength({ min: 2 }).withMessage('Valid operation type required'),
    query('entity_type').optional().isLength({ min: 2 }).withMessage('Valid entity type required'),
    query('start_date').optional().isISO8601().withMessage('Valid start date required'),
    query('end_date').optional().isISO8601().withMessage('Valid end date required')
], handleValidationErrors, async (req, res) => {
    try {
        const { limit = 50, operation_type, entity_type, start_date, end_date } = req.query;

        // Build query with optional filters
        let query = `
            SELECT 
                fat.*,
                performed_user.name as performed_by_name,
                verified_user.name as verified_by_name,
                g.name as group_name
            FROM financial_audit_trail fat
            LEFT JOIN users performed_user ON fat.performed_by = performed_user.id
            LEFT JOIN users verified_user ON fat.verified_by = verified_user.id
            LEFT JOIN groups g ON fat.group_id = g.id
            WHERE 1=1
        `;

        const params = [];

        if (operation_type) {
            query += ` AND fat.operation_type = $${params.length + 1}`;
            params.push(operation_type);
        }

        if (entity_type) {
            query += ` AND fat.entity_type = $${params.length + 1}`;
            params.push(entity_type);
        }

        if (start_date) {
            query += ` AND fat.operation_timestamp >= $${params.length + 1}`;
            params.push(start_date);
        }

        if (end_date) {
            query += ` AND fat.operation_timestamp <= $${params.length + 1}`;
            params.push(end_date);
        }

        query += ` ORDER BY fat.operation_timestamp DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: {
                audit_trail: result.rows,
                count: result.rows.length,
                filters: { operation_type, entity_type, start_date, end_date }
            }
        });

    } catch (error) {
        logger.error('Get audit trail error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get audit trail', code: 500 }
        });
    }
});

module.exports = {
    // Export any utility functions if needed
};