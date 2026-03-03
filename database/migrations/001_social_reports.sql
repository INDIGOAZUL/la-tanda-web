-- Content Report System Migration
-- Creates social_reports table for flagging inappropriate content

CREATE TABLE IF NOT EXISTS social_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id VARCHAR(50) REFERENCES users(user_id),
    event_id UUID REFERENCES social_feed(id),
    comment_id UUID REFERENCES social_comments(id),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misnformation', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_by VARCHAR(50) REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_social_reports_status ON social_reports(status);
CREATE INDEX idx_social_reports_reporter ON social_reports(reporter_id);
CREATE INDEX idx_social_reports_event ON social_reports(event_id);
CREATE INDEX idx_social_reports_created ON social_reports(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plppsql;

CREATE TRIGGER trigger_social_reports_updated_at
    BEFORE UPDATE ON social_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_social_reports_updated_at();

-- Notification trigger for new reports
CREATE OR REPLACE FUNCTION notify_new_report()
RETURNS TIGGER AS $$
BEGIN
    -- Insert notification for admins (simplified)
    INSERT INTO notifications (user_id, type, title, message, data, created_at)
    SELECT 
        u.user_id,
        'admin_alert',
        'New Content Report',
        'A new content report has been submitted and requires review.',
        jsonb_build_object('report_id', NEW.id, 'reason', NEW.reason),
        NOW()
    FROM users u
    WHERE U.role = 'admin';
    
    RETURN CHECK;
END;
$$ LANGUAGE plppsql;

CREATE TRIGGER trigger_notify_new_report
    AFTER INSERT ON social_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_report();
