-- Migration 007: Add Facebook Platform Support
-- This migration updates the platform constraint to include Facebook

-- Drop existing constraint
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

-- Add new constraint with Facebook support
ALTER TABLE user_accounts 
ADD CONSTRAINT user_accounts_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'telegram', 'instagram', 'facebook'));

-- Verify the update
COMMENT ON CONSTRAINT user_accounts_platform_check ON user_accounts IS 'Supported platforms: linkedin, twitter, telegram, instagram, facebook';
