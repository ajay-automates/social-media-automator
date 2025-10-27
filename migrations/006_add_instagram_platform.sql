-- Migration 006: Add Instagram Platform Support
-- This migration updates the platform constraint to include Instagram

-- Drop existing constraint
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

-- Add new constraint with Instagram support
ALTER TABLE user_accounts 
ADD CONSTRAINT user_accounts_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'telegram', 'instagram'));

-- Verify the update
COMMENT ON CONSTRAINT user_accounts_platform_check ON user_accounts IS 'Supported platforms: linkedin, twitter, telegram, instagram';
