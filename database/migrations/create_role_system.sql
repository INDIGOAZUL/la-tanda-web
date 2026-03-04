-- Role System Database Schema
-- Issue #13 - Admin Role Management Panel
-- Creates tables for role applications and audit logs

-- Create role_applications table
CREATE TABLE IF NOT EXISTS role_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    requested_role VARCHAR(50) NOT NULL CHECK (requested_role IN ('verified_user', 'active_member', 'coordinator', 'moderator', 'admin', 'administrator')),
    current_role VARCHAR(50) NOT NULL DEFAULT 'user',
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by VARCHAR(50) REFERENCES users(user_id),
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate pending applications
    CONSTRAINT unique_pending_application UNIQUE (user_id, requested_role, status)
);

-- Create role_audit_logs table
CREATE TABLE IF NOT EXISTS role_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    previous_role VARCHAR(50),
    new_role VARCHAR(50) NOT NULL,
    changed_by VARCHAR(50) REFERENCES users(user_id),
    change_method VARCHAR(20) NOT NULL CHECK (change_method IN ('auto', 'application', 'manual')),
    reason TEXT,
    application_id UUID REFERENCES role_applications(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_applications_user ON role_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_role_applications_status ON role_applications(status);
CREATE INDEX IF NOT EXISTS idx_role_applications_created ON role_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_applications_reviewed_by ON role_applications(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_role_audit_logs_user ON role_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_logs_changed_by ON role_audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_role_audit_logs_created ON role_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_audit_logs_application ON role_audit_logs(application_id);

-- Add role column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'verified_user', 'active_member', 'coordinator', 'moderator', 'admin', 'administrator', 'super_admin'));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_role_applications_updated_at ON role_applications;
CREATE TRIGGER trigger_role_applications_updated_at
    BEFORE UPDATE ON role_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT ON role_applications TO authenticated_users;
GRANT SELECT, UPDATE ON role_applications TO admin_users;
GRANT ALL ON role_applications TO super_admin;

GRANT SELECT ON role_audit_logs TO authenticated_users;
GRANT SELECT, INSERT ON role_audit_logs TO admin_users;
GRANT ALL ON role_audit_logs TO super_admin;

-- Comments
COMMENT ON TABLE role_applications IS 'User applications for role upgrades';
COMMENT ON TABLE role_audit_logs IS 'Audit trail for all role changes';
COMMENT ON COLUMN role_applications.change_method IS 'How the role was changed: auto (system), application (user request), manual (admin assignment)';
