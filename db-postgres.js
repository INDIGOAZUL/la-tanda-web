/**
 * LA TANDA - PostgreSQL Database Module
 * Replaces fs.readFileSync/writeFileSync with PostgreSQL queries
 * Version: 1.0.0
 * Date: 2025-11-14
 */

const { Pool } = require('pg');
const crypto = require('crypto');

// v4.3.0: Timing-safe string comparison
function safeCompare(a, b) {
    const bufA = crypto.createHash('sha256').update(String(a)).digest();
    const bufB = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(bufA, bufB);
}
const fs = require('fs');
const path = require('path');

// PostgreSQL connection pool
// Load environment variables
require("dotenv").config({ path: "/var/www/latanda.online/.env" });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'latanda_production',
    password: process.env.DB_PASSWORD,
    user: process.env.DB_USER || (() => { throw new Error('DB_USER env variable is required'); })(),
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Logging
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const log = (level, message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...data };
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    
    const logFile = path.join(logsDir, 'db-postgres.log');
    // fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n'); // Removed: blocks event loop
};

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        log('error', 'PostgreSQL connection failed', { error: err.message });
    } else {
        log('info', 'PostgreSQL connected successfully', { time: res.rows[0].now });
    }
});

// ============================================
// USER OPERATIONS
// ============================================

const getUsers = async () => {
    try {
        const result = await pool.query(`
            SELECT 
                user_id as id,
                telegram_id,
                name,
                email,
                phone,
                verification_level,
                registration_date,
                status,
                total_contributions,
                avatar_url,
                push_token,
                app_version,
                device_type,
                last_app_access,
                notification_preferences,
                app_settings
            FROM users
            ORDER BY created_at DESC
        `);
        
        // Parse JSONB fields back to objects
        return result.rows.map(row => ({
            ...row,
            notification_preferences: row.notification_preferences || {},
            app_settings: row.app_settings || {}
        }));
    } catch (error) {
        log('error', 'getUsers failed', { error: error.message });
        throw error;
    }
};

const getUserById = async (userId) => {
    try {
        const result = await pool.query(`
            SELECT 
                user_id as id,
                telegram_id,
                name,
                email,
                phone,
                verification_level,
                registration_date,
                status,
                total_contributions,
                avatar_url,
                push_token,
                app_version,
                device_type,
                last_app_access,
                notification_preferences,
                app_settings
            FROM users
            WHERE user_id = $1
        `, [userId]);
        
        if (result.rows.length === 0) return null;
        
        const user = result.rows[0];
        return {
            ...user,
            notification_preferences: user.notification_preferences || {},
            app_settings: user.app_settings || {}
        };
    } catch (error) {
        log('error', 'getUserById failed', { userId, error: error.message });
        throw error;
    }
};

const createUser = async (userData) => {
    try {
        const result = await pool.query(`
            INSERT INTO users (
                user_id, telegram_id, name, email, phone,
                verification_level, registration_date, status,
                total_contributions, avatar_url, push_token,
                app_version, device_type, last_app_access,
                notification_preferences, app_settings, password_hash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING user_id as id
        `, [
            userData.id,
            userData.telegram_id || null,
            userData.name,
            userData.email || null,
            userData.phone || null,
            userData.verification_level || 'basic',
            userData.registration_date || new Date().toISOString(),
            userData.status || 'active',
            userData.total_contributions || 0,
            userData.avatar_url || null,
            userData.push_token || null,
            userData.app_version || null,
            userData.device_type || null,
            userData.last_app_access || null,
            JSON.stringify(userData.notification_preferences || {}),
            JSON.stringify(userData.app_settings || {}),
            userData.password_hash || null
        ]);
        
        log('info', 'User created', { userId: result.rows[0].id });
        return result.rows[0].id;
    } catch (error) {
        log('error', 'createUser failed', { userData, error: error.message });
        throw error;
    }
};

const updateUser = async (userId, updates) => {
    try {
        const setClauses = [];
        const values = [];
        let paramIndex = 1;
        
        // Build dynamic UPDATE query
        // v4.3.0: Column allowlist prevents SQL injection via dynamic keys
        const ALLOWED_USER_COLS = ['name', 'email', 'phone', 'status', 'avatar_url',
            'notification_preferences', 'app_settings', 'verification_level',
            'gender', 'birth_date', 'location', 'bio', 'handle', 'role',
            'password_hash', 'password_reset_token', 'password_reset_expires',
            'email_verification_code', 'email_verified', 'failed_login_attempts',
            'last_login', 'updated_at'];
        Object.keys(updates).forEach(key => {
            if (key === 'id') return; // Don't update primary key
            
            const dbKey = key === 'id' ? 'user_id' : key;
            if (!ALLOWED_USER_COLS.includes(dbKey)) return;
            setClauses.push(`"${dbKey}" = $${paramIndex}`);
            
            // Handle JSONB fields
            if (key === 'notification_preferences' || key === 'app_settings') {
                values.push(JSON.stringify(updates[key]));
            } else {
                values.push(updates[key]);
            }
            paramIndex++;
        });
        
        values.push(userId);
        
        const query = `
            UPDATE users 
            SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $${paramIndex}
            RETURNING user_id
        `;
        
        await pool.query(query, values);
        log('info', 'User updated', { userId });
    } catch (error) {
        log('error', 'updateUser failed', { userId, error: error.message });
        throw error;
    }
};

// ============================================
// GROUP OPERATIONS

// ============================================
// USER AUTHENTICATION OPERATIONS
// ============================================

const getUserByEmail = async (email) => {
    try {
        const result = await pool.query(
            'SELECT user_id as id, name, email, phone, password_hash, verification_level, status, avatar_url, role, notification_preferences, app_settings, email_verified FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );
        return result.rows[0] || null;
    } catch (error) {
        log('error', 'getUserByEmail failed', { email, error: error.message });
        throw error;
    }
};

const updateUserPassword = async (userId, passwordHash) => {
    try {
        await pool.query(
            'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [passwordHash, userId]
        );
        log('info', 'User password updated', { userId });
    } catch (error) {
        log('error', 'updateUserPassword failed', { userId, error: error.message });
        throw error;
    }
};

const setPasswordResetToken = async (userId, token, expiresAt) => {
    try {
        await pool.query(
            'UPDATE users SET password_reset_token = $1, password_reset_expires = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
            [token, expiresAt, userId]
        );
        log('info', 'Password reset token set', { userId });
    } catch (error) {
        log('error', 'setPasswordResetToken failed', { userId, error: error.message });
        throw error;
    }
};

const getUserByResetToken = async (token) => {
    try {
        const result = await pool.query(
            "SELECT user_id as id, email, password_reset_expires FROM users WHERE password_reset_token = $1",
            [token]
        );
        return result.rows[0] || null;
    } catch (error) {
        log("error", "getUserByResetToken failed", { error: error.message });
        throw error;
    }
};

const getPasswordResetToken = async (userId) => {
    try {
        const result = await pool.query(
            "SELECT password_reset_token as token, password_reset_expires as expires_at FROM users WHERE user_id = $1",
            [userId]
        );
        return result.rows[0] || null;
    } catch (error) {
        log("error", "getPasswordResetToken failed", { userId, error: error.message });
        throw error;
    }
};

// ============================================

const getGroups = async () => {
    try {
        const result = await pool.query(`
            SELECT 
                group_id as id,
                name,
                contribution_amount,
                frequency,
                member_count,
                max_members,
                total_amount_collected,
                admin_id,
                status,
                created_at,
                location,
                description,
                image_url,
                category,
                meeting_schedule,
                is_demo,
                start_date,
                commission_rate
            FROM groups
            ORDER BY created_at DESC
        `);
        
        return result.rows;
    } catch (error) {
        log('error', 'getGroups failed', { error: error.message });
        throw error;
    }
};

const getGroupById = async (groupId) => {
    try {
        const result = await pool.query(`
            SELECT 
                group_id as id,
                name,
                contribution_amount,
                frequency,
                member_count,
                max_members,
                total_amount_collected,
                admin_id,
                status,
                created_at,
                location,
                description,
                image_url,
                category,
                meeting_schedule,
                is_demo,
                start_date,
                commission_rate
            FROM groups
            WHERE group_id = $1
        `, [groupId]);
        
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        log('error', 'getGroupById failed', { groupId, error: error.message });
        throw error;
    }
};

const createGroup = async (groupData) => {
    try {
        const result = await pool.query(`
            INSERT INTO groups (
                group_id, name, contribution_amount, frequency,
                member_count, max_members, total_amount_collected,
                admin_id, status, created_at, location, description,
                image_url, category, meeting_schedule,
                is_demo, start_date, grace_period, penalty_amount,
                commission_rate
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING group_id as id
        `, [
            groupData.id,
            groupData.name,
            groupData.contribution_amount,
            groupData.frequency,
            groupData.member_count || 0,
            groupData.max_members || 12,
            groupData.total_amount_collected || 0,
            groupData.admin_id,
            groupData.status || 'active',
            groupData.created_at || new Date().toISOString(),
            groupData.location || null,
            groupData.description || null,
            groupData.image_url || null,
            groupData.category || null,
            groupData.meeting_schedule || null,
            groupData.is_demo || false,
            groupData.start_date || null,
            groupData.grace_period || 3,
            groupData.penalty_amount || 50,
            groupData.commission_rate !== undefined ? groupData.commission_rate : null
        ]);
        
        log('info', 'Group created', { groupId: result.rows[0].id });
        return result.rows[0].id;
    } catch (error) {
        log('error', 'createGroup failed', { groupData, error: error.message });
        throw error;
    }
};

const updateGroup = async (groupId, updates) => {
    try {
        const setClauses = [];
        const values = [];
        let paramIndex = 1;
        
        // v4.3.0: Column allowlist
        const ALLOWED_GROUP_COLS = ['name', 'description', 'contribution_amount',
            'max_members', 'frequency', 'location', 'status', 'type', 'privacy',
            'start_date', 'rules', 'coordinators', 'updated_at', 'commission_rate'];
        Object.keys(updates).forEach(key => {
            if (key === "id" || key === "updated_at") return;
            if (!ALLOWED_GROUP_COLS.includes(key)) return;
            setClauses.push('"' + key + '" = $' + paramIndex);
            values.push(updates[key]);
            paramIndex++;
        });
        
        if (setClauses.length === 0) {
            log("warn", "No fields to update", { groupId });
            return null;
        }
        
        values.push(groupId);
        
        const query = "UPDATE groups SET " + setClauses.join(", ") + ", updated_at = CURRENT_TIMESTAMP WHERE group_id = $" + paramIndex + " RETURNING group_id, name, status, contribution_amount, frequency, max_members, updated_at";
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            log("warn", "Group not found for update", { groupId });
            return null;
        }
        
        log("info", "Group updated", { groupId });
        return result.rows[0];
    } catch (error) {
        log("error", "updateGroup failed", { groupId, error: error.message });
        throw error;
    }
};


// ============================================
// GROUP MEMBERS OPERATIONS
// ============================================

const getGroupMembers = async (groupId) => {
    try {
        const result = await pool.query(`
            SELECT 
                gm.id,
                gm.group_id,
                gm.user_id,
                gm.role,
                gm.status,
                gm.joined_at,
                gm.left_at,
                gm.invited_by,
                gm.notes,
                COALESCE(u.name, 'Usuario') as name,
                u.email,
                u.phone,
                u.telegram_id,
                u.avatar_url
            FROM group_members gm
            LEFT JOIN users u ON gm.user_id = u.user_id
            WHERE gm.group_id = $1 AND gm.status = 'active'
            ORDER BY 
                CASE gm.role 
                    WHEN 'creator' THEN 1 
                    WHEN 'coordinator' THEN 2 
                    ELSE 3 
                END,
                gm.joined_at ASC
        `, [groupId]);
        
        log('info', 'Group members fetched', { groupId, count: result.rows.length });
        return result.rows;
    } catch (error) {
        log('error', 'getGroupMembers failed', { groupId, error: error.message });
        throw error;
    }
};

const addGroupMember = async (memberData) => {
    try {
        const { group_id, user_id, role = 'member', invited_by, notes } = memberData;
        
        const result = await pool.query(`
            INSERT INTO group_members (group_id, user_id, role, status, invited_by, notes)
            VALUES ($1, $2, $3, 'active', $4, $5)
            ON CONFLICT (group_id, user_id) DO UPDATE SET
                status = 'active',
                role = EXCLUDED.role,
                joined_at = CURRENT_TIMESTAMP
            RETURNING id, group_id, user_id, role, status, turn_position, joined_at, num_positions
        `, [group_id, user_id, role, invited_by, notes]);
        
        log('info', 'Group member added', { group_id, user_id, role });
        return result.rows[0];
    } catch (error) {
        log('error', 'addGroupMember failed', { memberData, error: error.message });
        throw error;
    }
};

const updateGroupMember = async (groupId, userId, updates) => {
    try {
        const setClauses = [];
        const values = [];
        let paramIndex = 1;
        
        // v4.3.0: Column allowlist
        const ALLOWED_MEMBER_COLS = ['role', 'status', 'turn_position', 'num_positions',
            'is_anonymous', 'display_name', 'updated_at'];
        Object.keys(updates).forEach(key => {
            if (!ALLOWED_MEMBER_COLS.includes(key)) return;
            setClauses.push(`"${key}" = $${paramIndex}`);
            values.push(updates[key]);
            paramIndex++;
        });
        
        values.push(groupId, userId);
        
        const result = await pool.query(`
            UPDATE group_members 
            SET ${setClauses.join(', ')}
            WHERE group_id = $${paramIndex} AND user_id = $${paramIndex + 1}
            RETURNING id, group_id, user_id, role, status, turn_position, num_positions
        `, values);
        
        log('info', 'Group member updated', { groupId, userId });
        return result.rows[0];
    } catch (error) {
        log('error', 'updateGroupMember failed', { groupId, userId, error: error.message });
        throw error;
    }
};

const removeGroupMember = async (groupId, userId) => {
    try {
        const result = await pool.query(`
            UPDATE group_members 
            SET status = 'left', left_at = CURRENT_TIMESTAMP
            WHERE group_id = $1 AND user_id = $2
            RETURNING id, group_id, user_id, role, status
        `, [groupId, userId]);
        
        log('info', 'Group member removed', { groupId, userId });
        return result.rows[0];
    } catch (error) {
        log('error', 'removeGroupMember failed', { groupId, userId, error: error.message });
        throw error;
    }
};


// ============================================
// CONTRIBUTIONS/PAYMENTS OPERATIONS
// ============================================

const getGroupContributions = async (groupId, options = {}) => {
    try {
        const { status, limit = 50, offset = 0 } = options;
        let query = `
            SELECT 
                c.id,
                c.user_id,
                c.group_id,
                c.amount,
                c.payment_method,
                c.status,
                c.transaction_id,
                c.confirmation_code,
                c.notes,
                c.due_date,
                c.paid_date,
                c.cycle_number,
                c.created_at,
                c.verified_by,
                c.verification_method,
                COALESCE(u.name, 'Usuario') as user_name,
                u.email as user_email,
                u.avatar_url as user_avatar,
                COALESCE(v.name, 'Sistema') as verified_by_name
            FROM contributions c
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN users v ON c.verified_by = v.user_id
            WHERE c.group_id = $1
        `;
        
        const params = [groupId];
        let paramIndex = 2;
        
        if (status) {
            query += ` AND c.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        
        query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        // Get totals
        const totalsQuery = `
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_completed,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
            FROM contributions
            WHERE group_id = $1
        `;
        const totalsResult = await pool.query(totalsQuery, [groupId]);
        
        log('info', 'Group contributions fetched', { groupId, count: result.rows.length });
        return {
            contributions: result.rows,
            totals: totalsResult.rows[0]
        };
    } catch (error) {
        log('error', 'getGroupContributions failed', { groupId, error: error.message });
        throw error;
    }
};

const createContribution = async (contributionData) => {
    try {
        const {
            user_id,
            group_id,
            amount,
            payment_method,
            status = 'pending',
            transaction_id,
            confirmation_code,
            notes,
            due_date,
            cycle_number = 1
        } = contributionData;
        
        const result = await pool.query(`
            INSERT INTO contributions (
                user_id, group_id, amount, payment_method, status,
                transaction_id, confirmation_code, notes, due_date, cycle_number
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, user_id, group_id, amount, payment_method, status, cycle_number, created_at
        `, [user_id, group_id, amount, payment_method, status, transaction_id, confirmation_code, notes, due_date, cycle_number]);
        
        log('info', 'Contribution created', { id: result.rows[0].id, group_id, user_id, amount });
        return result.rows[0];
    } catch (error) {
        log('error', 'createContribution failed', { contributionData, error: error.message });
        throw error;
    }
};

const updateContribution = async (contributionId, updates) => {
    try {
        const setClauses = [];
        const values = [];
        let paramIndex = 1;
        
        // v4.3.0: Column allowlist
        const ALLOWED_CONTRIB_COLS = ['status', 'payment_method', 'proof_url',
            'verified_by', 'verified_at', 'paid_date', 'notes', 'updated_at'];
        Object.keys(updates).forEach(key => {
            if (key === 'id') return;
            if (!ALLOWED_CONTRIB_COLS.includes(key)) return;
            setClauses.push(`"${key}" = $${paramIndex}`);
            values.push(updates[key]);
            paramIndex++;
        });
        
        values.push(contributionId);
        
        const result = await pool.query(`
            UPDATE contributions 
            SET ${setClauses.join(', ')}, updated_at = NOW()
            WHERE id = $${paramIndex}
            RETURNING id, user_id, group_id, amount, payment_method, status, cycle_number, proof_url, verified_by, verified_at
        `, values);
        
        log('info', 'Contribution updated', { contributionId });
        return result.rows[0];
    } catch (error) {
        log('error', 'updateContribution failed', { contributionId, error: error.message });
        throw error;
    }
};


// ============================================
// GROUP INVITATIONS OPERATIONS
// ============================================

const createGroupInvitation = async (invitationData) => {
    try {
        const { group_id, inviter_id, invitee_email, invitee_phone, invitee_name, invitee_user_id = null, message, is_reusable = false, max_uses = null } = invitationData;
        
        const result = await pool.query(`
            INSERT INTO group_invitations (group_id, inviter_id, invitee_email, invitee_phone, invitee_name, invitee_user_id, message, is_reusable, max_uses)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, group_id, inviter_id, invitee_email, invitee_name, status, created_at, expires_at
        `, [group_id, inviter_id, invitee_email, invitee_phone, invitee_name, invitee_user_id, message, is_reusable, max_uses]);
        
        log('info', 'Group invitation created', { id: result.rows[0].id, group_id });
        return result.rows[0];
    } catch (error) {
        log('error', 'createGroupInvitation failed', { error: error.message });
        throw error;
    }
};

const getGroupInvitations = async (groupId, status = null) => {
    try {
        let query = `
            SELECT 
                gi.*,
                COALESCE(u.name, 'Usuario') as inviter_name,
                g.name as group_name
            FROM group_invitations gi
            LEFT JOIN users u ON gi.inviter_id = u.user_id
            LEFT JOIN groups g ON gi.group_id = g.group_id
            WHERE gi.group_id = $1
        `;
        const params = [groupId];
        
        if (status) {
            query += ' AND gi.status = $2';
            params.push(status);
        }
        
        query += ' ORDER BY gi.created_at DESC';
        
        const result = await pool.query(query, params);
        log('info', 'Group invitations fetched', { groupId, count: result.rows.length });
        return result.rows;
    } catch (error) {
        log('error', 'getGroupInvitations failed', { groupId, error: error.message });
        throw error;
    }
};

const getInvitationByToken = async (token) => {
    try {
        const result = await pool.query(`
            SELECT 
                gi.*,
                g.name as group_name,
                g.contribution_amount,
                g.frequency,
                COALESCE(u.name, 'Usuario') as inviter_name
            FROM group_invitations gi
            LEFT JOIN groups g ON gi.group_id = g.group_id
            LEFT JOIN users u ON gi.inviter_id = u.user_id
            WHERE gi.token = $1
        `, [token]);
        
        return result.rows[0] || null;
    } catch (error) {
        log('error', 'getInvitationByToken failed', { error: error.message });
        throw error;
    }
};

const updateInvitationStatus = async (invitationId, status) => {
    try {
        const result = await pool.query(`
            UPDATE group_invitations 
            SET status = $1, responded_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, group_id, status, responded_at
        `, [status, invitationId]);
        
        log('info', 'Invitation status updated', { invitationId, status });
        return result.rows[0];
    } catch (error) {
        log('error', 'updateInvitationStatus failed', { error: error.message });
        throw error;
    }
};


// ============================================
// EXPORT MODULE
// ============================================

// ========== TANDAS FUNCTIONS ==========

const getTandas = async () => {
    try {
        const result = await pool.query(`
            SELECT 
                tanda_id as id,
                name,
                contribution_amount,
                total_per_turn,
                frequency,
                coordinator_id,
                group_id,
                status,
                current_turn,
                total_turns,
                turns_order,
                created_at,
                updated_at,
                completed_at,
                is_demo,
                start_date,
                commission_rate
            FROM tandas t LEFT JOIN users u ON t.coordinator_id = u.user_id
            ORDER BY created_at DESC
        `);
        return result.rows;
    } catch (error) {
        log('error', 'getTandas failed', { error: error.message });
        throw error;
    }
};

const getTandasByUser = async (userId) => {
    try {
        const result = await pool.query(`
            SELECT
                t.tanda_id as id,
                t.name,
                t.contribution_amount,
                t.total_per_turn,
                t.frequency,
                t.coordinator_id,
                t.group_id,
                t.status,
                t.current_turn,
                t.total_turns,
                t.turns_order,
                t.created_at,
                t.is_demo,
                u.name as coordinator_name,
                g.member_count as group_member_count,
                g.lottery_executed,
                g.lottery_executed_at,
                g.lottery_scheduled_at,
                g.start_date
            FROM tandas t
            LEFT JOIN users u ON t.coordinator_id = u.user_id
            LEFT JOIN groups g ON t.group_id = g.group_id
            WHERE $1 = ANY(t.turns_order) OR t.coordinator_id = $1 OR (t.status IN ('recruiting', 'pending') AND t.group_id IN (SELECT group_id FROM group_members WHERE user_id = $1 AND status = 'active'))
            ORDER BY t.created_at DESC
        `, [userId]);
        return result.rows;
    } catch (error) {
        log('error', 'getTandasByUser failed', { error: error.message });
        throw error;
    }
};

const getTandaById = async (tandaId) => {
    try {
        const result = await pool.query(`
            SELECT t.tanda_id, t.name, t.contribution_amount, t.total_per_turn, t.frequency, t.coordinator_id, t.group_id, t.status, t.current_turn, t.total_turns, t.turns_order, t.created_at, t.updated_at, t.completed_at, t.is_demo, t.scheduled_start_at, t.lottery_scheduled_at, t.lottery_executed_at, t.lottery_countdown_seconds, t.previous_status, u.user_id, u.name AS coordinator_name, u.email AS coordinator_email, u.phone AS coordinator_phone, u.avatar_url AS coordinator_avatar, u.role AS coordinator_role, u.status AS coordinator_status FROM tandas t LEFT JOIN users u ON t.coordinator_id = u.user_id WHERE tanda_id = $1
        `, [tandaId]);
        return result.rows[0] || null;
    } catch (error) {
        log('error', 'getTandaById failed', { error: error.message });
        throw error;
    }
};

const createTanda = async (tandaData) => {
    try {
        const result = await pool.query(`
            INSERT INTO tandas (
                tanda_id, name, contribution_amount, total_per_turn, frequency,
                coordinator_id, group_id, status, current_turn, total_turns,
                turns_order, is_demo,
                start_date,
                commission_rate
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING tanda_id, name, contribution_amount, total_per_turn, frequency, coordinator_id, group_id, status, current_turn, total_turns, start_date, created_at
        `, [
            tandaData.id || 'tanda_' + Date.now(),
            tandaData.name,
            tandaData.contribution_amount || 100,
            tandaData.total_per_turn || (tandaData.contribution_amount * (tandaData.turns_order?.length || 1)),
            tandaData.frequency || 'monthly',
            tandaData.coordinator_id,
            tandaData.group_id || null,
            tandaData.status || 'active',
            tandaData.current_turn !== undefined ? tandaData.current_turn : 1,
            tandaData.total_turns || tandaData.turns_order?.length || 0,
            tandaData.turns_order || [],
            tandaData.is_demo || false
        ]);
        return result.rows[0];
    } catch (error) {
        log('error', 'createTanda failed', { error: error.message });
        throw error;
    }
};

// ============================================
// EMAIL VERIFICATION FUNCTIONS
// ============================================

const setEmailVerificationCode = async (userId, code, expiresAt) => {
    try {
        await pool.query(
            `UPDATE users SET email_verification_code = $1, email_verification_expires = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3`,
            [code, expiresAt, userId]
        );
        log("info", "Email verification code set", { userId });
    } catch (error) {
        log("error", "setEmailVerificationCode failed", { userId, error: error.message });
        throw error;
    }
};

const verifyEmailCode = async (userId, code) => {
    try {
        const result = await pool.query(
            `SELECT email_verification_code, email_verification_expires FROM users WHERE user_id = $1`,
            [userId]
        );
        
        if (!result.rows[0]) {
            return { valid: false, reason: "Usuario no encontrado" };
        }
        
        const user = result.rows[0];
        
        if (!user.email_verification_code) {
            return { valid: false, reason: "No hay código de verificación pendiente" };
        }
        
        if (new Date() > new Date(user.email_verification_expires)) {
            return { valid: false, reason: "El código ha expirado" };
        }
        
        if (!safeCompare(user.email_verification_code, code)) {
            return { valid: false, reason: "Código incorrecto" };
        }
        
        // Mark email as verified
        await pool.query(
            `UPDATE users SET email_verified = TRUE, email_verification_code = NULL, email_verification_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
            [userId]
        );
        
        log("info", "Email verified successfully", { userId });
        return { valid: true };
    } catch (error) {
        log("error", "verifyEmailCode failed", { userId, error: error.message });
        throw error;
    }
};

// ============================================
// DUPLICATE ACCOUNT DETECTION
// ============================================

const findSimilarAccounts = async (email, name, phone, excludeUserId = null) => {
    try {
        const normalizedEmail = (email || "").toLowerCase().trim();
        const normalizedName = (name || "").toLowerCase().trim();
        const normalizedPhone = (phone || "").replace(/[^0-9]/g, "");

        let query = "SELECT user_id as id, name, email, phone, status, email_verified, created_at, last_app_access, " +
            "CASE WHEN LOWER(email) = $1 THEN true ELSE false END as email_match, " +
            "CASE WHEN $2 <> '' AND similarity(LOWER(name), $2) > 0.8 THEN true ELSE false END as name_match, " +
            "CASE WHEN $3 <> '' AND regexp_replace(phone, '[^0-9]', '', 'g') = $3 THEN true ELSE false END as phone_match, " +
            "CASE WHEN $2 <> '' THEN similarity(LOWER(name), $2) ELSE 0 END as name_similarity " +
            "FROM users WHERE (LOWER(email) = $1 OR ($2 <> '' AND similarity(LOWER(name), $2) > 0.8) OR ($3 <> '' AND regexp_replace(phone, '[^0-9]', '', 'g') = $3))";

        const params = [normalizedEmail, normalizedName, normalizedPhone];

        if (excludeUserId) {
            query += " AND user_id <> $4";
            params.push(excludeUserId);
        }

        query += " ORDER BY created_at ASC";

        const result = await pool.query(query, params);

        const accounts = result.rows.map(row => {
            const matchReasons = [];
            if (row.email_match) matchReasons.push("email");
            if (row.name_match) matchReasons.push("name (" + Math.round(row.name_similarity * 100) + "% similar)");
            if (row.phone_match) matchReasons.push("phone");

            return {
                id: row.id,
                name: row.name,
                email: row.email,
                phone: row.phone,
                status: row.status,
                email_verified: row.email_verified,
                created_at: row.created_at,
                last_access: row.last_app_access,
                match_reasons: matchReasons
            };
        });

        log("info", "findSimilarAccounts completed", { email: normalizedEmail, foundCount: accounts.length });
        return accounts;
    } catch (error) {
        log("error", "findSimilarAccounts failed", { error: error.message });
        throw error;
    }
};

const getAccountDataSummary = async (userId) => {
    try {
        const walletResult = await pool.query("SELECT COALESCE(balance, 0) as balance FROM user_wallets WHERE user_id = $1", [userId]);
        const contribResult = await pool.query("SELECT COUNT(*) as count FROM contributions WHERE user_id = $1", [userId]);
        const groupsResult = await pool.query("SELECT COUNT(*) as count FROM group_members WHERE user_id = $1", [userId]);

        return {
            balance: walletResult.rows[0]?.balance || 0,
            contributions: parseInt(contribResult.rows[0]?.count || 0),
            groups: parseInt(groupsResult.rows[0]?.count || 0)
        };
    } catch (error) {
        log("error", "getAccountDataSummary failed", { userId, error: error.message });
        throw error;
    }
};

const deleteAccountSafe = async (userId) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM notifications WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM contributions WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM group_members WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM user_wallets WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM audit_logs WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM users WHERE user_id = $1", [userId]);
        await client.query("COMMIT");
        log("info", "Account deleted successfully", { userId });
        return { success: true };
    } catch (error) {
        await client.query("ROLLBACK");
        log("error", "deleteAccountSafe failed", { userId, error: error.message });
        throw error;
    } finally {
        client.release();
    }
};

const mergeAccounts = async (targetId, sourceId) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("UPDATE user_wallets SET balance = balance + COALESCE((SELECT balance FROM user_wallets WHERE user_id = $1), 0), updated_at = CURRENT_TIMESTAMP WHERE user_id = $2", [sourceId, targetId]);
        await client.query("UPDATE contributions SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2", [targetId, sourceId]);
        await client.query("UPDATE group_members SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND group_id NOT IN (SELECT group_id FROM group_members WHERE user_id = $1 AND status = 'active')", [targetId, sourceId]);
        await client.query("UPDATE notifications SET user_id = $1 WHERE user_id = $2", [targetId, sourceId]);
        await client.query("DELETE FROM group_members WHERE user_id = $1", [sourceId]);
        await client.query("DELETE FROM user_wallets WHERE user_id = $1", [sourceId]);
        await client.query("DELETE FROM audit_logs WHERE user_id = $1", [sourceId]);
        await client.query("DELETE FROM users WHERE user_id = $1", [sourceId]);
        await client.query("COMMIT");
        log("info", "Accounts merged successfully", { targetId, sourceId });
        return { success: true };
    } catch (error) {
        await client.query("ROLLBACK");
        log("error", "mergeAccounts failed", { targetId, sourceId, error: error.message });
        throw error;
    } finally {
        client.release();
    }
};

// ===== DEPOSIT OPERATIONS (v4.7.0) =====

const createDeposit = async (depositData) => {
    try {
        const result = await pool.query(`
            INSERT INTO deposits (
                id, user_id, type, status, amount, net_amount, transaction_fee,
                currency, reference_number, bank_name, bank_code, user_account_number,
                crypto_currency, deposit_address, network, confirmations_required,
                current_confirmations, carrier, phone_number, sms_code,
                instructions, receptor_bank_details, status_history,
                monitoring_active, qr_code, expires_at, estimated_completion
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
                $24, $25, $26, $27
            )
            RETURNING id
        `, [
            depositData.id,
            depositData.user_id,
            depositData.type,
            depositData.status || 'pending_transfer',
            depositData.amount || null,
            depositData.net_amount || null,
            depositData.transaction_fee || null,
            depositData.currency || 'HNL',
            depositData.reference_number || null,
            depositData.bank_name || null,
            depositData.bank_code || null,
            depositData.user_account_number || null,
            depositData.crypto_currency || null,
            depositData.deposit_address || null,
            depositData.network || null,
            depositData.confirmations_required || 0,
            depositData.current_confirmations || 0,
            depositData.carrier || null,
            depositData.phone_number || null,
            depositData.sms_code || null,
            depositData.instructions ? JSON.stringify(depositData.instructions) : null,
            depositData.receptor_bank_details ? JSON.stringify(depositData.receptor_bank_details) : null,
            depositData.status_history ? JSON.stringify(depositData.status_history) : '[]',
            depositData.monitoring_active || false,
            depositData.qr_code || null,
            depositData.expires_at || null,
            depositData.estimated_completion || null
        ]);
        log('info', 'Deposit created', { depositId: result.rows[0].id, type: depositData.type });
        return result.rows[0].id;
    } catch (error) {
        log('error', 'createDeposit failed', { depositId: depositData.id, error: error.message });
        throw error;
    }
};

const getDepositById = async (depositId) => {
    try {
        const result = await pool.query(`
            SELECT id, user_id, type, status, amount, net_amount, transaction_fee,
                   currency, reference_number, bank_name, bank_code, user_account_number,
                   crypto_currency, deposit_address, network, confirmations_required,
                   current_confirmations, carrier, phone_number, sms_code,
                   instructions, receptor_bank_details, receipt, status_history,
                   modification_history, extension_history,
                   confirmed_by, confirmed_at, admin_notes, received_amount,
                   rejected_by, rejected_at, rejection_reason,
                   status_updated_by, receipt_upload_notes,
                   extension_count, extension_hours, extended_at,
                   monitoring_active, qr_code, expires_at, estimated_completion,
                   created_at, updated_at
            FROM deposits
            WHERE id = $1
        `, [depositId]);
        if (result.rows.length === 0) return null;
        return result.rows[0];
    } catch (error) {
        log('error', 'getDepositById failed', { depositId, error: error.message });
        throw error;
    }
};

const getDepositByIdAndUser = async (depositId, userId) => {
    try {
        const result = await pool.query(`
            SELECT id, user_id, type, status, amount, net_amount, transaction_fee,
                   currency, reference_number, bank_name, bank_code, user_account_number,
                   instructions, receptor_bank_details, receipt, status_history,
                   modification_history, extension_history,
                   extension_count, extension_hours, extended_at,
                   expires_at, estimated_completion, created_at, updated_at
            FROM deposits
            WHERE id = $1 AND user_id = $2
        `, [depositId, userId]);
        if (result.rows.length === 0) return null;
        return result.rows[0];
    } catch (error) {
        log('error', 'getDepositByIdAndUser failed', { depositId, userId, error: error.message });
        throw error;
    }
};

const updateDepositStatus = async (depositId, newStatus, extraFields = {}) => {
    try {
        const setClauses = ['status = $1', 'updated_at = NOW()'];
        const values = [newStatus];
        let paramIndex = 2;

        const ALLOWED_EXTRA = [
            'confirmed_by', 'confirmed_at', 'admin_notes', 'received_amount',
            'rejected_by', 'rejected_at', 'rejection_reason',
            'status_updated_by', 'receipt_upload_notes'
        ];

        for (const [key, val] of Object.entries(extraFields)) {
            if (!ALLOWED_EXTRA.includes(key)) continue;
            setClauses.push(`"${key}" = $${paramIndex}`);
            values.push(val);
            paramIndex++;
        }

        // Append to status_history
        const historyEntry = JSON.stringify({
            to: newStatus,
            reason: extraFields.reason || '',
            timestamp: new Date().toISOString(),
            updated_by: extraFields.updated_by || 'system'
        });
        setClauses.push(`status_history = status_history || $${paramIndex}::jsonb`);
        values.push(historyEntry);
        paramIndex++;

        values.push(depositId);
        const query = `UPDATE deposits SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING id, status`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) return null;
        log('info', 'Deposit status updated', { depositId, newStatus });
        return result.rows[0];
    } catch (error) {
        log('error', 'updateDepositStatus failed', { depositId, newStatus, error: error.message });
        throw error;
    }
};

const getPendingDeposits = async () => {
    try {
        const result = await pool.query(`
            SELECT id, user_id, type, status, amount, net_amount, transaction_fee,
                   bank_name, bank_code, reference_number, user_account_number,
                   receipt, status_history, expires_at, estimated_completion, created_at
            FROM deposits
            WHERE status IN ('pending_transfer', 'processing')
            ORDER BY created_at ASC
        `);
        return result.rows;
    } catch (error) {
        log('error', 'getPendingDeposits failed', { error: error.message });
        throw error;
    }
};

const updateDepositReceipt = async (depositId, receiptData, statusUpdatedBy) => {
    try {
        const result = await pool.query(`
            UPDATE deposits
            SET receipt = $1::jsonb,
                status = 'processing',
                status_updated_by = $2,
                receipt_upload_notes = 'Usuario subió comprobante de pago',
                status_history = status_history || $3::jsonb,
                updated_at = NOW()
            WHERE id = $4
            RETURNING id, status
        `, [
            JSON.stringify(receiptData),
            statusUpdatedBy || 'user_receipt_upload',
            JSON.stringify({ to: 'processing', reason: 'receipt_uploaded', timestamp: new Date().toISOString(), updated_by: 'user' }),
            depositId
        ]);
        if (result.rows.length === 0) return null;
        log('info', 'Deposit receipt updated', { depositId });
        return result.rows[0];
    } catch (error) {
        log('error', 'updateDepositReceipt failed', { depositId, error: error.message });
        throw error;
    }
};

const confirmDepositWithWalletCredit = async (depositId, adminData, netAmount, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Lock deposit row
        const dep = await client.query(
            'SELECT id, status, net_amount FROM deposits WHERE id = $1 FOR UPDATE',
            [depositId]
        );
        if (!dep.rows.length) {
            await client.query('ROLLBACK');
            return { success: false, error: 'Depósito no encontrado' };
        }
        if (dep.rows[0].status !== 'pending_transfer' && dep.rows[0].status !== 'processing') {
            await client.query('ROLLBACK');
            return { success: false, error: 'Solo se pueden confirmar depósitos pendientes o en proceso' };
        }

        // Update deposit to confirmed
        await client.query(
            `UPDATE deposits SET status = 'confirmed', confirmed_by = $1, confirmed_at = NOW(),
             admin_notes = $2, received_amount = $3, updated_at = NOW(),
             status_history = status_history || $4::jsonb
             WHERE id = $5`,
            [
                adminData.confirmed_by,
                adminData.admin_notes || '',
                adminData.received_amount || dep.rows[0].net_amount,
                JSON.stringify({ to: 'confirmed', reason: 'admin_manual_confirmation', timestamp: new Date().toISOString(), updated_by: adminData.confirmed_by }),
                depositId
            ]
        );

        // Credit user wallet (create if not exists)
        await client.query(
            `INSERT INTO user_wallets (user_id, balance, currency)
             VALUES ($1, $2, 'HNL')
             ON CONFLICT (user_id) DO UPDATE SET balance = user_wallets.balance + $2, updated_at = NOW()`,
            [userId, netAmount]
        );

        // Record in wallet_transactions
        await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, currency, description, status, created_at)
             VALUES ($1, 'deposit', $2, 'HNL', $3, 'completed', NOW())`,
            [userId, netAmount, `Depósito confirmado - ${depositId}`]
        );

        await client.query('COMMIT');
        log('info', 'Deposit confirmed with wallet credit', { depositId, userId, netAmount });
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        log('error', 'confirmDepositWithWalletCredit failed', { depositId, userId, error: error.message });
        return { success: false, error: 'Error interno al confirmar depósito' };
    } finally {
        client.release();
    }
};

const rejectDeposit = async (depositId, adminData) => {
    try {
        const result = await pool.query(`
            UPDATE deposits
            SET status = 'failed',
                rejected_by = $1,
                rejected_at = NOW(),
                rejection_reason = $2,
                admin_notes = $3,
                updated_at = NOW(),
                status_history = status_history || $4::jsonb
            WHERE id = $5 AND status IN ('pending_transfer', 'processing')
            RETURNING id, status, user_id
        `, [
            adminData.rejected_by,
            adminData.rejection_reason,
            adminData.admin_notes || '',
            JSON.stringify({ to: 'failed', reason: adminData.rejection_reason, timestamp: new Date().toISOString(), updated_by: adminData.rejected_by }),
            depositId
        ]);
        if (result.rows.length === 0) return null;
        log('info', 'Deposit rejected', { depositId });
        return result.rows[0];
    } catch (error) {
        log('error', 'rejectDeposit failed', { depositId, error: error.message });
        throw error;
    }
};

const cancelDeposit = async (depositId, userId, reason) => {
    try {
        const result = await pool.query(`
            UPDATE deposits
            SET status = 'cancelled',
                updated_at = NOW(),
                status_history = status_history || $1::jsonb
            WHERE id = $2 AND user_id = $3 AND status = 'pending_transfer'
            RETURNING id, status
        `, [
            JSON.stringify({ to: 'cancelled', reason: reason || 'cancelled_by_user', timestamp: new Date().toISOString(), updated_by: 'user' }),
            depositId,
            userId
        ]);
        if (result.rows.length === 0) return null;
        log('info', 'Deposit cancelled', { depositId, userId });
        return result.rows[0];
    } catch (error) {
        log('error', 'cancelDeposit failed', { depositId, error: error.message });
        throw error;
    }
};

const modifyDeposit = async (depositId, userId, newData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Lock and fetch current deposit
        const dep = await client.query(
            `SELECT id, amount, net_amount, transaction_fee, reference_number, user_account_number
             FROM deposits WHERE id = $1 AND user_id = $2 AND status = 'pending_transfer' FOR UPDATE`,
            [depositId, userId]
        );
        if (!dep.rows.length) {
            await client.query('ROLLBACK');
            return null;
        }

        const old = dep.rows[0];
        const newAmount = newData.new_amount;
        const feeAmount = newAmount * 0.02;
        const newReference = `BT${Date.now()}`;

        await client.query(`
            UPDATE deposits
            SET amount = $1, net_amount = $2, transaction_fee = $3,
                reference_number = $4,
                user_account_number = COALESCE($5, user_account_number),
                updated_at = NOW(),
                modification_history = modification_history || $6::jsonb
            WHERE id = $7
        `, [
            newAmount,
            newAmount - feeAmount,
            feeAmount,
            newReference,
            newData.new_account_number || null,
            JSON.stringify({
                old_amount: parseFloat(old.amount),
                old_account_number: old.user_account_number,
                old_reference: old.reference_number,
                modified_at: new Date().toISOString(),
                reason: 'user_modification'
            }),
            depositId
        ]);

        await client.query('COMMIT');
        log('info', 'Deposit modified', { depositId, oldAmount: old.amount, newAmount });
        return {
            id: depositId,
            old_amount: parseFloat(old.amount),
            new_amount: newAmount,
            old_reference: old.reference_number,
            new_reference: newReference,
            net_amount: newAmount - feeAmount,
            transaction_fee: feeAmount
        };
    } catch (error) {
        await client.query('ROLLBACK');
        log('error', 'modifyDeposit failed', { depositId, error: error.message });
        throw error;
    } finally {
        client.release();
    }
};

const extendDeposit = async (depositId, userId, extensionHours) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const dep = await client.query(
            `SELECT id, expires_at, extension_count
             FROM deposits WHERE id = $1 AND user_id = $2 AND status = 'pending_transfer' FOR UPDATE`,
            [depositId, userId]
        );
        if (!dep.rows.length) {
            await client.query('ROLLBACK');
            return { found: false };
        }

        const deposit = dep.rows[0];
        if (deposit.extension_count && deposit.extension_count >= 1) {
            await client.query('ROLLBACK');
            return { found: true, already_extended: true };
        }

        const currentExpiry = new Date(deposit.expires_at || Date.now() + 24*60*60*1000);
        const newExpiry = new Date(currentExpiry.getTime() + (extensionHours * 60 * 60 * 1000));

        await client.query(`
            UPDATE deposits
            SET expires_at = $1,
                extension_count = COALESCE(extension_count, 0) + 1,
                extension_hours = $2,
                extended_at = NOW(),
                updated_at = NOW(),
                extension_history = extension_history || $3::jsonb
            WHERE id = $4
        `, [
            newExpiry.toISOString(),
            extensionHours,
            JSON.stringify({
                extended_at: new Date().toISOString(),
                hours_added: extensionHours,
                old_expiry: currentExpiry.toISOString(),
                new_expiry: newExpiry.toISOString()
            }),
            depositId
        ]);

        await client.query('COMMIT');
        log('info', 'Deposit extended', { depositId, extensionHours });
        return {
            found: true,
            already_extended: false,
            old_expiry: currentExpiry.toISOString(),
            new_expiry: newExpiry.toISOString(),
            extension_count: (deposit.extension_count || 0) + 1
        };
    } catch (error) {
        await client.query('ROLLBACK');
        log('error', 'extendDeposit failed', { depositId, error: error.message });
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    // Invitation operations
    createGroupInvitation,
    getGroupInvitations,
    getInvitationByToken,
    updateInvitationStatus,

    // Contribution operations
    getGroupContributions,
    createContribution,
    updateContribution,

    // Group members operations
    getGroupMembers,
    addGroupMember,
    updateGroupMember,
    removeGroupMember,

    pool,

    // User operations
    getUsers,
    getUserById,
    createUser,
    updateUser,
    getUserByEmail,
    updateUserPassword,
    setPasswordResetToken,
    getPasswordResetToken,
    getUserByResetToken,

    // Email verification
    setEmailVerificationCode,
    verifyEmailCode,

    // Group operations
    getGroups,
    getGroupById,
    createGroup,
    updateGroup,

    // Tanda operations
    getTandas,
    getTandasByUser,
    getTandaById,
    createTanda,

    // Duplicate detection
    findSimilarAccounts,
    getAccountDataSummary,
    deleteAccountSafe,
    mergeAccounts,

    // Deposit operations (v4.7.0)
    createDeposit,
    getDepositById,
    getDepositByIdAndUser,
    updateDepositStatus,
    getPendingDeposits,
    updateDepositReceipt,
    confirmDepositWithWalletCredit,
    rejectDeposit,
    cancelDeposit,
    modifyDeposit,
    extendDeposit,

    // Utility
    log
};
