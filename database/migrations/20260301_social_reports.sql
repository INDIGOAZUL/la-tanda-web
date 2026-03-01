-- Migration: Social Reports / Content Flag System
-- Issue: #51 | Date: 2026-03-01

CREATE TABLE IF NOT EXISTS social_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
    event_id UUID REFERENCES social_feed(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES social_comments(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'acoso', 'inapropiado', 'desinformacion', 'otro')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    reviewed_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast pending queries
CREATE INDEX IF NOT EXISTS idx_social_reports_status ON social_reports(status);
CREATE INDEX IF NOT EXISTS idx_social_reports_reporter ON social_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_event ON social_reports(event_id);

-- Add is_hidden column to social_feed if not exists
ALTER TABLE social_feed ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_social_feed_hidden ON social_feed(is_hidden) WHERE is_hidden = TRUE;
