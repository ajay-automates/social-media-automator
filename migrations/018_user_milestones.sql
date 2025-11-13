-- ============================================
-- User Milestones Tracking
-- ============================================
-- Migration: 018
-- Description: Add milestone tracking for onboarding and engagement
-- Date: November 13, 2025
--
-- This migration adds tables to track user milestones including:
--   - Email verification
--   - First account connection
--   - First post creation
--   - Post count milestones (10, 50, 100 posts)
-- ============================================

-- Create user_milestones table
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_milestone UNIQUE(user_id, milestone_type)
);

-- Milestone types:
-- 'email_verified' - Email address verified
-- 'first_account_connected' - First social account connected
-- 'first_post_created' - First post created
-- 'posts_10' - 10 posts milestone
-- 'posts_50' - 50 posts milestone
-- 'posts_100' - 100 posts milestone
-- 'onboarding_completed' - Full onboarding flow completed

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id
ON user_milestones(user_id);

CREATE INDEX IF NOT EXISTS idx_user_milestones_milestone_type
ON user_milestones(milestone_type);

CREATE INDEX IF NOT EXISTS idx_user_milestones_achieved_at
ON user_milestones(achieved_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_milestones_email_sent
ON user_milestones(email_sent)
WHERE email_sent = false;

-- Create view for user milestone progress
CREATE OR REPLACE VIEW user_milestone_progress AS
SELECT
  u.id as user_id,
  u.email,
  COUNT(CASE WHEN um.milestone_type = 'email_verified' THEN 1 END) as email_verified,
  COUNT(CASE WHEN um.milestone_type = 'first_account_connected' THEN 1 END) as first_account_connected,
  COUNT(CASE WHEN um.milestone_type = 'first_post_created' THEN 1 END) as first_post_created,
  COUNT(CASE WHEN um.milestone_type IN ('posts_10', 'posts_50', 'posts_100') THEN 1 END) as post_milestones,
  COUNT(CASE WHEN um.milestone_type = 'onboarding_completed' THEN 1 END) as onboarding_completed,
  MAX(CASE WHEN um.milestone_type = 'email_verified' THEN um.achieved_at END) as email_verified_at,
  MAX(CASE WHEN um.milestone_type = 'first_account_connected' THEN um.achieved_at END) as first_account_at,
  MAX(CASE WHEN um.milestone_type = 'first_post_created' THEN um.achieved_at END) as first_post_at,
  MAX(CASE WHEN um.milestone_type = 'onboarding_completed' THEN um.achieved_at END) as onboarding_completed_at,
  ROUND((
    (COUNT(CASE WHEN um.milestone_type = 'email_verified' THEN 1 END)::numeric +
     COUNT(CASE WHEN um.milestone_type = 'first_account_connected' THEN 1 END)::numeric +
     COUNT(CASE WHEN um.milestone_type = 'first_post_created' THEN 1 END)::numeric) / 3.0 * 100
  ), 0) as onboarding_progress_percent
FROM auth.users u
LEFT JOIN user_milestones um ON u.id = um.user_id
GROUP BY u.id, u.email;

-- Function to record a milestone
CREATE OR REPLACE FUNCTION record_milestone(
  p_user_id UUID,
  p_milestone_type TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  milestone_data JSONB
) AS $$
DECLARE
  v_existing_milestone UUID;
  v_milestone_record user_milestones;
BEGIN
  -- Check if milestone already exists
  SELECT id INTO v_existing_milestone
  FROM user_milestones
  WHERE user_id = p_user_id AND milestone_type = p_milestone_type
  LIMIT 1;

  IF v_existing_milestone IS NOT NULL THEN
    -- Milestone already recorded
    SELECT
      FALSE,
      'Milestone already achieved',
      jsonb_build_object(
        'user_id', p_user_id,
        'milestone_type', p_milestone_type,
        'already_exists', true
      )
    INTO success, message, milestone_data;
  ELSE
    -- Record new milestone
    INSERT INTO user_milestones (user_id, milestone_type, metadata)
    VALUES (p_user_id, p_milestone_type, p_metadata)
    RETURNING * INTO v_milestone_record;

    SELECT
      TRUE,
      'Milestone recorded successfully',
      jsonb_build_object(
        'user_id', v_milestone_record.user_id,
        'milestone_type', v_milestone_record.milestone_type,
        'achieved_at', v_milestone_record.achieved_at,
        'id', v_milestone_record.id
      )
    INTO success, message, milestone_data;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's milestones
CREATE OR REPLACE FUNCTION get_user_milestones(p_user_id UUID)
RETURNS TABLE(
  milestone_type TEXT,
  achieved_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.milestone_type,
    um.achieved_at,
    um.email_sent,
    um.metadata
  FROM user_milestones um
  WHERE um.user_id = p_user_id
  ORDER BY um.achieved_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON user_milestones TO authenticated;
GRANT INSERT ON user_milestones TO authenticated;
GRANT UPDATE ON user_milestones TO authenticated;
GRANT SELECT ON user_milestone_progress TO authenticated;

-- Add comment
COMMENT ON TABLE user_milestones IS 'Tracks user achievements and milestones for onboarding and engagement metrics';
COMMENT ON FUNCTION record_milestone IS 'Records a user milestone achievement';
COMMENT ON FUNCTION get_user_milestones IS 'Retrieves all milestones for a user';
