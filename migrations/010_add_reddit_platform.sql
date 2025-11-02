-- Migration 010: Add Reddit Platform Support
-- This migration updates the platform constraint to include Reddit and adds platform_metadata column

-- Drop existing constraint
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

-- Add new constraint with Reddit support (includes all current platforms)
ALTER TABLE user_accounts 
ADD CONSTRAINT user_accounts_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'telegram', 'slack', 'discord', 'reddit', 'instagram', 'facebook', 'youtube', 'tiktok'));

-- Add platform_metadata column if not exists (for storing platform-specific data like moderated subreddits)
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS platform_metadata JSONB;

-- Add comment for documentation
COMMENT ON CONSTRAINT user_accounts_platform_check ON user_accounts IS 'Supported platforms: linkedin, twitter, telegram, slack, discord, reddit, instagram, facebook, youtube, tiktok';
COMMENT ON COLUMN user_accounts.platform_metadata IS 'Platform-specific metadata (e.g., Reddit moderated subreddits, additional config)';

-- Success message
SELECT 'Migration 010 completed: Reddit platform support added with platform_metadata column' AS status;

