-- Migration 009: Add Discord Platform Support
-- This migration updates the platform constraint to include Discord

-- Drop existing constraint
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

-- Add new constraint with Discord support (includes all current platforms)
ALTER TABLE user_accounts 
ADD CONSTRAINT user_accounts_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'telegram', 'slack', 'discord', 'instagram', 'facebook', 'youtube', 'tiktok'));

-- Verify the update
COMMENT ON CONSTRAINT user_accounts_platform_check ON user_accounts IS 'Supported platforms: linkedin, twitter, telegram, slack, discord, instagram, facebook, youtube, tiktok';

-- Success message
SELECT 'Migration 009 completed: Discord platform support added' AS status;

