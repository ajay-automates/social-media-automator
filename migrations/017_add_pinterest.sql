-- ============================================
-- Pinterest Platform Support
-- ============================================
-- Migration: 017
-- Description: Add Pinterest platform support to Social Media Automator
-- Date: November 8, 2025
--
-- This migration adds Pinterest to the existing user_accounts table.
-- No schema changes needed - Pinterest uses the existing columns:
--   - user_id (FK to users)
--   - platform = 'pinterest'
--   - platform_user_id (Pinterest username)
--   - platform_username (Pinterest username)
--   - access_token (OAuth token)
--   - refresh_token (OAuth refresh token)
--   - token_expires_at (Token expiry timestamp)
--   - platform_metadata (JSON with profile_image, account_type, etc.)
-- ============================================

-- Add documentation comment
COMMENT ON TABLE user_accounts IS 'Stores OAuth credentials for all social platforms including LinkedIn, Twitter, Instagram, Facebook, YouTube, TikTok, Reddit, Discord, Slack, Telegram, and Pinterest (11 platforms total)';

-- Optional: Add index for faster Pinterest account queries
CREATE INDEX IF NOT EXISTS idx_user_accounts_pinterest 
ON user_accounts(user_id, platform) 
WHERE platform = 'pinterest';

-- Optional: Add index for Pinterest username lookups
CREATE INDEX IF NOT EXISTS idx_user_accounts_pinterest_username 
ON user_accounts(platform_username) 
WHERE platform = 'pinterest';

-- ============================================
-- Verification Query (run manually to check)
-- ============================================
-- SELECT 
--   COUNT(*) as pinterest_accounts,
--   COUNT(DISTINCT user_id) as unique_users
-- FROM user_accounts 
-- WHERE platform = 'pinterest';
-- ============================================

