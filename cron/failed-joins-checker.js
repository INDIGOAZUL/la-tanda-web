#!/usr/bin/env node
/**
 * Failed Group Joins Checker
 * Runs daily to check unresolved failed joins and notify admins
 *
 * Usage: node failed-joins-checker.js
 * Cron: 0 8 * * * cd /var/www/latanda.online && node cron/failed-joins-checker.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/latanda.online/.env' });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'latanda_production',
    user: process.env.DB_USER || 'latanda_admin',
    password: process.env.DB_PASSWORD
});

async function checkFailedJoins() {
    console.log('[CRON] Starting failed joins check at', new Date().toISOString());

    try {
        // Get unresolved failed joins stats
        const statsResult = await pool.query(`
            SELECT
                COUNT(*) as total_unresolved,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
                COUNT(*) FILTER (WHERE retry_count >= max_retries) as max_retries_reached,
                COUNT(DISTINCT user_id) as affected_users,
                COUNT(DISTINCT group_id) as affected_groups
            FROM failed_group_joins
            WHERE resolved = false
        `);

        const stats = statsResult.rows[0];
        console.log('[CRON] Stats:', stats);

        // If there are unresolved issues, create notification for admin
        if (parseInt(stats.total_unresolved) > 0) {
            const message = `⚠️ Reporte de Errores de Unión:\n\n` +
                `• Total sin resolver: ${stats.total_unresolved}\n` +
                `• Nuevos hoy: ${stats.new_today}\n` +
                `• Con máx reintentos: ${stats.max_retries_reached}\n` +
                `• Usuarios afectados: ${stats.affected_users}\n` +
                `• Grupos afectados: ${stats.affected_groups}\n\n` +
                `Por favor revisa el panel de administración.`;

            // Get admin users to notify
            const adminsResult = await pool.query(`
                SELECT user_id, email FROM users
                WHERE user_id IN (SELECT admin_id FROM groups)
                OR email LIKE '%@latanda%'
                LIMIT 5
            `);

            for (const admin of adminsResult.rows) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, title, message, data, created_at)
                    VALUES ($1, 'admin_alert', 'Errores de Unión Pendientes', $2, $3, NOW())
                `, [
                    admin.user_id,
                    message,
                    JSON.stringify({
                        total_unresolved: stats.total_unresolved,
                        new_today: stats.new_today,
                        link: '/admin-panel-v2.html#failed-joins'
                    })
                ]);
                console.log('[CRON] Notification sent to:', admin.email);
            }
        } else {
            console.log('[CRON] No unresolved failed joins. All good!');
        }

        // Auto-resolve old entries (> 30 days)
        const autoResolveResult = await pool.query(`
            UPDATE failed_group_joins
            SET resolved = true,
                resolved_at = NOW(),
                resolved_by = 'system_cron',
                resolution_type = 'auto_expired'
            WHERE resolved = false
            AND created_at < NOW() - INTERVAL '30 days'
            RETURNING id
        `);

        if (autoResolveResult.rowCount > 0) {
            console.log('[CRON] Auto-resolved', autoResolveResult.rowCount, 'old entries');
        }

        // Try auto-retry for entries with retry_count < max_retries
        const retryableResult = await pool.query(`
            SELECT fgj.*, u.name as user_name
            FROM failed_group_joins fgj
            JOIN users u ON fgj.user_id = u.user_id
            WHERE fgj.resolved = false
            AND fgj.retry_count < fgj.max_retries
            AND fgj.user_id IS NOT NULL
            AND fgj.group_id IS NOT NULL
            AND fgj.created_at > NOW() - INTERVAL '7 days'
            LIMIT 10
        `);

        for (const fj of retryableResult.rows) {
            try {
                // Check if already member
                const memberCheck = await pool.query(
                    "SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND status = 'active'",
                    [fj.group_id, fj.user_id]
                );

                if (memberCheck.rows.length > 0) {
                    // Already member, mark as resolved
                    await pool.query(`
                        UPDATE failed_group_joins
                        SET resolved = true, resolved_at = NOW(), resolved_by = 'system_cron', resolution_type = 'auto_already_member'
                        WHERE id = $1
                    `, [fj.id]);
                    console.log('[CRON] Auto-resolved (already member):', fj.id);
                } else {
                    // Try to add
                    await pool.query(`
                        INSERT INTO group_members (group_id, user_id, role, status, notes)
                        VALUES ($1, $2, 'member', 'active', 'Added by cron auto-retry')
                    `, [fj.group_id, fj.user_id]);

                    await pool.query(`
                        UPDATE failed_group_joins
                        SET resolved = true, resolved_at = NOW(), resolved_by = 'system_cron', resolution_type = 'auto_retry_success', retry_count = retry_count + 1
                        WHERE id = $1
                    `, [fj.id]);
                    console.log('[CRON] Auto-retry success:', fj.id, fj.user_name);
                }
            } catch (err) {
                // Update retry count on failure
                await pool.query(`
                    UPDATE failed_group_joins
                    SET retry_count = retry_count + 1,
                        error_details = COALESCE(error_details, '{}'::jsonb) || jsonb_build_object('cron_retry_error', $1, 'cron_retry_at', NOW())
                    WHERE id = $2
                `, [err.message, fj.id]);
                console.log('[CRON] Auto-retry failed for:', fj.id, err.message);
            }
        }

        console.log('[CRON] Check completed at', new Date().toISOString());

    } catch (error) {
        console.error('[CRON] Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkFailedJoins();
