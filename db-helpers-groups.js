const db = require('./db-postgres');

// Función simple - solo datos básicos
async function getGroupsByAdmin(adminId) {
    const result = await db.pool.query(
        `SELECT 
            group_id, name, contribution_amount, frequency,
            member_count, max_members, total_amount_collected,
            admin_id, status, created_at, location, description, category
        FROM groups
        WHERE admin_id = $1
        ORDER BY created_at DESC`,
        [adminId]
    );
    return result.rows;
}

// Función enriquecida - incluye rol, pagos, alertas, y status de tanda
async function getEnrichedGroupsByUser(userId) {
    const query = `
        WITH user_groups AS (
            -- All groups where user has ANY membership (active, suspended, pending, etc.)
            -- Creator/admin always sees their groups regardless of membership status
            -- Suspended/late members see the group with restricted view + alert
            SELECT DISTINCT ON (g.group_id)
                g.*,
                COALESCE(gm.role, CASE WHEN g.admin_id = $1 THEN 'creator' ELSE 'member' END) AS my_role,
                COALESCE(gm.status, 'active') AS my_membership_status,
                COALESCE(gm.joined_at, g.created_at) AS joined_at
            FROM groups g
            LEFT JOIN group_members gm ON g.group_id = gm.group_id AND gm.user_id = $1
            WHERE (
                -- User has any membership record (active, suspended, pending, etc.)
                gm.user_id IS NOT NULL
                -- OR user is the group admin/creator (even without group_members row)
                OR g.admin_id = $1
            )
            -- Exclude only permanently removed/rejected for non-admin members
            AND (
                g.admin_id = $1
                OR gm.role IN ('creator', 'coordinator')
                OR COALESCE(gm.status, 'active') NOT IN ('removed', 'rejected')
            )
            ORDER BY g.group_id, gm.joined_at ASC
        ),
        latest_tanda AS (
            SELECT DISTINCT ON (group_id)
                group_id,
                tanda_id,
                status AS tanda_status,
                previous_status AS tanda_previous_status
            FROM tandas
            ORDER BY group_id, created_at DESC
        ),
        position_stats AS (
            SELECT 
                group_id,
                SUM(COALESCE(num_positions, 1)) AS total_positions
            FROM group_members
            WHERE status = 'active'
            GROUP BY group_id
        ),
        group_stats AS (
            SELECT 
                group_id,
                COUNT(*) AS active_members
            FROM group_members
            WHERE status = 'active'
            GROUP BY group_id
        ),
        payment_stats AS (
            SELECT 
                c.group_id,
                c.user_id,
                MAX(COALESCE(c.paid_date, c.created_at)) AS last_payment_date,
                SUM(CASE WHEN c.status IN ('completed', 'coordinator_approved', 'archived') THEN c.amount ELSE 0 END) AS total_paid,
                COUNT(CASE WHEN c.status = 'pending' THEN 1 END) AS pending_payments,
                COUNT(DISTINCT CASE WHEN c.status IN ('completed', 'coordinator_approved', 'archived') THEN c.cycle_number END) AS cycles_paid
            FROM contributions c
            WHERE c.user_id = $1 AND c.status IN ('completed', 'coordinator_approved', 'archived', 'pending')
            GROUP BY c.group_id, c.user_id
        )
        SELECT 
            ug.group_id,
            ug.name,
            ug.description,
            ug.category,
            ug.location,
            ug.contribution_amount,
            ug.frequency,
            ug.max_members,
            COALESCE(lt.tanda_status, ug.status) AS status,
            lt.tanda_status,
            lt.tanda_previous_status,
            lt.tanda_id,
            ug.created_at,
            ug.total_amount_collected,
            ug.admin_id,
            ug.member_count,
            ug.lottery_executed,
            ug.lottery_executed_at,
            ug.lottery_scheduled_at,
            ug.start_date,
            ug.commission_rate,
            ug.current_cycle,
            ug.my_role,
            ug.my_membership_status,
            ug.joined_at,
            COALESCE(gs.active_members, 1) AS members_count,
            COALESCE(ps.last_payment_date, ug.created_at) AS last_payment_date,
            COALESCE(ps.total_paid, 0) AS my_total_paid,
            COALESCE(ps.pending_payments, 0) AS pending_payments,
            COALESCE(ps.cycles_paid, 0) AS cycles_paid,
            COALESCE(pos.total_positions, 1) AS total_positions
        FROM user_groups ug
        LEFT JOIN latest_tanda lt ON ug.group_id = lt.group_id
        LEFT JOIN position_stats pos ON ug.group_id = pos.group_id
        LEFT JOIN group_stats gs ON ug.group_id = gs.group_id
        LEFT JOIN payment_stats ps ON ug.group_id = ps.group_id
        ORDER BY ug.created_at DESC
    `;
    
    const result = await db.pool.query(query, [userId]);
    
    // Post-procesar para calcular estado de pago y alertas
    return result.rows.map(group => enrichGroupWithPaymentStatus(group));
}

// Calculate the due date for a given cycle index (0-based) based on group schedule
// Matches the calendar endpoint logic exactly
function getPaymentDueDate(startDate, frequency, cycleIndex) {
    var start = new Date(startDate);

    if (frequency === 'biweekly') {
        // Fixed dates: 15th and last day of each month
        var baseDay = start.getDate();
        var startOnSecondHalf = baseDay > 15;
        var curYear = start.getFullYear();
        var curMonth = start.getMonth();
        var onSecondHalf = startOnSecondHalf;

        for (var i = 0; i < cycleIndex; i++) {
            if (onSecondHalf) {
                curMonth++;
                if (curMonth > 11) { curMonth = 0; curYear++; }
            }
            onSecondHalf = !onSecondHalf;
        }

        if (!onSecondHalf) {
            return new Date(curYear, curMonth, 15);
        } else {
            var lastDay = new Date(curYear, curMonth + 1, 0).getDate();
            return new Date(curYear, curMonth, lastDay);
        }
    } else if (frequency === 'weekly') {
        // Every 7 days from start_date
        var d = new Date(start);
        d.setDate(d.getDate() + (cycleIndex * 7));
        return d;
    } else {
        // Monthly: same day each month (clamped to last day if needed)
        var anchorDay = start.getDate();
        var d = new Date(start);
        d.setMonth(d.getMonth() + cycleIndex);
        var maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        if (anchorDay > maxDay) d.setDate(maxDay);
        return d;
    }
}

function enrichGroupWithPaymentStatus(group) {
    const today = new Date();

    let daysInterval = 30; // monthly default
    if (group.frequency === 'weekly') daysInterval = 7;
    else if (group.frequency === 'biweekly') daysInterval = 14;

    let nextPaymentDue;
    const cyclesPaid = parseInt(group.cycles_paid) || 0;

    // Schedule-based calculation using the same logic as the calendar endpoint
    if (group.start_date) {
        // cyclesPaid = number of completed cycles, so next due = schedule date at index cyclesPaid
        nextPaymentDue = getPaymentDueDate(group.start_date, group.frequency, cyclesPaid);
    } else {
        // Fallback for groups without start_date: last payment + interval
        const hasPayments = group.my_total_paid > 0;
        if (!hasPayments) {
            nextPaymentDue = new Date(group.created_at);
        } else {
            const lastPayment = new Date(group.last_payment_date);
            nextPaymentDue = new Date(lastPayment);
            nextPaymentDue.setDate(nextPaymentDue.getDate() + daysInterval);
        }
    }

    // Calculate payment status with grace period
    const gracePeriod = 3;
    const dueWithGrace = new Date(nextPaymentDue);
    dueWithGrace.setDate(dueWithGrace.getDate() + gracePeriod);

    let paymentStatus = 'up_to_date';
    let daysLate = 0;

    if (today > dueWithGrace) {
        paymentStatus = 'late';
        daysLate = Math.floor((today - dueWithGrace) / (1000 * 60 * 60 * 24));

        // Auto-suspend after 5 days late (8 days after original due date)
        const autoSuspendDays = 5;
        if (daysLate >= autoSuspendDays) {
            paymentStatus = 'suspended';
        }
    } else if (today > nextPaymentDue) {
        paymentStatus = 'pending';
        daysLate = Math.floor((today - nextPaymentDue) / (1000 * 60 * 60 * 24));
    }

    // If there are pending contributions in DB, mark as pending
    if (group.pending_payments > 0) {
        paymentStatus = 'pending';
    }

    // Generate alerts
    const alerts = [];

    if (paymentStatus === 'up_to_date') {
        const daysUntilDue = Math.floor((nextPaymentDue - today) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 3 && daysUntilDue > 0) {
            alerts.push({
                type: 'payment_due',
                severity: 'warning',
                message: `Tu pago vence en ${daysUntilDue} d\u00eda${daysUntilDue !== 1 ? 's' : ''}`
            });
        }
    } else if (paymentStatus === 'late') {
        const daysUntilSuspend = 5 - daysLate;
        if (daysUntilSuspend > 0) {
            alerts.push({
                type: 'payment_overdue',
                severity: 'danger',
                message: `Pago atrasado (${daysLate}d). Suspensi\u00f3n en ${daysUntilSuspend} d\u00eda${daysUntilSuspend !== 1 ? 's' : ''}`
            });
        } else {
            alerts.push({
                type: 'payment_overdue',
                severity: 'danger',
                message: `Tienes un pago atrasado (${daysLate} d\u00eda${daysLate !== 1 ? 's' : ''})`
            });
        }
    } else if (paymentStatus === 'suspended') {
        alerts.push({
            type: 'member_suspended',
            severity: 'danger',
            message: 'Tu membres\u00eda est\u00e1 suspendida por falta de pago'
        });
    } else if (paymentStatus === 'pending' && group.pending_payments > 0) {
        alerts.push({
            type: 'payment_pending',
            severity: 'info',
            message: `Tienes ${group.pending_payments} pago${group.pending_payments !== 1 ? 's' : ''} pendiente${group.pending_payments !== 1 ? 's' : ''}`
        });
    }

    return {
        ...group,
        my_payment_status: paymentStatus,
        my_days_late: daysLate,
        my_next_payment_due: nextPaymentDue.toISOString(),
        my_total_paid: parseFloat(group.my_total_paid || 0),
        my_alerts: alerts,
        has_active_tanda: !!group.tanda_id,
        my_turn_number: null,
        turns_until_mine: null
    };
}

// Get public groups available for joining (excluding user's own groups)
async function getPublicGroups(excludeUserId = null) {
    let query = `
        SELECT
            g.group_id as id,
            g.name,
            g.contribution_amount,
            g.frequency,
            g.member_count,
            g.max_members,
            g.total_amount_collected,
            g.admin_id,
            g.status,
            g.created_at,
            g.location,
            g.description,
            g.image_url,
            g.category,
            g.meeting_schedule,
            u.name as admin_name
        FROM groups g
        LEFT JOIN users u ON g.admin_id = u.user_id
        WHERE g.status = 'active'
        AND g.member_count < g.max_members
        AND g.is_demo = false
    `;

    const params = [];

    if (excludeUserId) {
        query += `
            AND g.admin_id != $1
            AND g.group_id NOT IN (
                SELECT group_id FROM group_members 
                WHERE user_id = $1 AND status IN ('active', 'pending', 'removed', 'rejected')
            )
        `;
        params.push(excludeUserId);
    }

    query += ' ORDER BY g.created_at DESC';

    const result = await db.pool.query(query, params);
    return result.rows;
}

module.exports = { 
    getGroupsByAdmin, 
    getEnrichedGroupsByUser,
    getPublicGroups
};
