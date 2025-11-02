-- Migration 008: Add Slack Platform Support
-- This migration updates the platform constraint to include Slack

-- Drop existing constraint
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

-- Add new constraint with Slack support (includes all current platforms)
ALTER TABLE user_accounts 
ADD CONSTRAINT user_accounts_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'telegram', 'slack', 'instagram', 'facebook', 'youtube', 'tiktok'));

-- Verify the update
COMMENT ON CONSTRAINT user_accounts_platform_check ON user_accounts IS 'Supported platforms: linkedin, twitter, telegram, slack, instagram, facebook, youtube, tiktok';

-- Success message
SELECT 'Migration 008 completed: Slack platform support added' AS status;

