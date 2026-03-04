-- Content Report System - Database Schema
-- Issue #51 - La Tanda Web
-- Creates social_reports table for content moderation

-- Create social_reports table
CREATE TABLE IF NOT EXISTS social_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    event_id UUID REFERENCES social_feed(id),
    comment_id UUID REFERENCES social_comments(id),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    reviewed_by VARCHAR(50) REFERENCES users(user_id),
    reviewed_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT report_target_check CHECK (
        (event_id IS NOT NULL AND comment_id IS NULL) OR
        (event_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT unique_user_content_report UNIQUE (reporter_id, event_id, comment_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_reports_reporter ON social_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_event ON social_reports(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_reports_comment ON social_reports(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_reports_status ON social_reports(status);
CREATE INDEX IF NOT EXISTS idx_social_reports_created ON social_reports(created_at DESC);

-- Add is_hidden flag to social_feed for auto-hide feature (bonus)
ALTER TABLE social_feed ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_social_feed_hidden ON social_feed(is_hidden) WHERE is_hidden = TRUE;

-- Add is_hidden flag to social_comments for auto-hide feature (bonus)
ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_social_comments_hidden ON social_comments(is_hidden) WHERE is_hidden = TRUE;

-- Function to auto-hide content when it receives 3+ unique reports (bonus feature)
CREATE OR REPLACE FUNCTION auto_hide_reported_content()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
BEGIN
    -- Count unique reports for this content
    IF NEW.event_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT reporter_id) INTO report_count
        FROM social_reports
        WHERE event_id = NEW.event_id AND status = 'pending';

        -- Auto-hide if 3+ unique reports
        IF report_count >= 3 THEN
            UPDATE social_feed SET is_hidden = TRUE WHERE id = NEW.event_id;
        END IF;
    ELSIF NEW.comment_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT reporter_id) INTO report_count
        FROM social_reports
        WHERE comment_id = NEW.comment_id AND status = 'pending';

        -- Auto-hide if 3+ unique reports
        IF report_count >= 3 THEN
            UPDATE social_comments SET is_hidden = TRUE WHERE id = NEW.comment_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-hide content on new report (bonus feature)
DROP TRIGGER IF EXISTS trigger_auto_hide_content ON social_reports;
CREATE TRIGGER trigger_auto_hide_content
    AFTER INSERT ON social_reports
    FOR EACH ROW
    EXECUTE FUNCTION auto_hide_reported_content();

-- Grant permissions
GRANT SELECT, INSERT ON social_reports TO authenticated_users;
GRANT SELECT, UPDATE ON social_reports TO admin_users;
GRANT ALL ON social_reports TO super_admin;

-- Comments
COMMENT ON TABLE social_reports IS 'Content moderation reports for posts and comments';
COMMENT ON COLUMN social_reports.reason IS 'Report reason: spam, harassment, inappropriate, misinformation, other';
COMMENT ON COLUMN social_reports.status IS 'Report status: pending, reviewed, dismissed, actioned';
COMMENT ON COLUMN social_reports.resolution_note IS 'Admin notes on how the report was resolved';
