-- ============================================
-- Migration: Social Reports Table
-- Date: 2026-03-05
-- Bounty: #51 - Content Report/Flag System
-- ============================================

-- Create social_reports table
CREATE TABLE IF NOT EXISTS social_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    event_id UUID REFERENCES social_feed(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES social_comments(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    reviewed_by VARCHAR(50) REFERENCES users(user_id),
    reviewed_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_event_or_comment CHECK (
        (event_id IS NOT NULL AND comment_id IS NULL) OR 
        (event_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Index for admin queue queries
CREATE INDEX IF NOT EXISTS idx_social_reports_status ON social_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_reports_reporter ON social_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_event ON social_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_comment ON social_reports(comment_id);

-- Unique constraint: one report per user per content
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_reports_unique_event 
    ON social_reports(reporter_id, event_id) WHERE event_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_reports_unique_comment 
    ON social_reports(reporter_id, comment_id) WHERE comment_id IS NOT NULL;

-- Add is_hidden column to social_feed if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_feed' AND column_name = 'is_hidden') THEN
        ALTER TABLE social_feed ADD COLUMN is_hidden BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add is_hidden column to social_comments if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'is_hidden') THEN
        ALTER TABLE social_comments ADD COLUMN is_hidden BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Migration complete
