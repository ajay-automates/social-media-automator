-- Migration: Add Bluesky platform support
-- Description: Update user_accounts table to allow 'bluesky' as a valid platform
-- Date: 2025-11-08

-- Drop the existing constraint
ALTER TABLE user_accounts DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

-- Add updated constraint with bluesky
ALTER TABLE user_accounts ADD CONSTRAINT user_accounts_platform_check 
  CHECK (platform IN (
    'linkedin',
    'twitter',
    'instagram',
    'facebook',
    'youtube',
    'tiktok',
    'telegram',
    'slack',
    'discord',
    'reddit',
    'pinterest',
    'medium',
    'devto',
    'tumblr',
    'mastodon',
    'bluesky'
  ));

-- Add comment
COMMENT ON CONSTRAINT user_accounts_platform_check ON user_accounts IS 'Valid social media platforms including Bluesky (AT Protocol social network)';

