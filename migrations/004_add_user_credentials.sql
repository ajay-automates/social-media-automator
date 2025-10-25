-- Migration 004: Add User Social Media Credentials
-- This adds your existing LinkedIn and Twitter credentials to your user account
-- User: ajaykumarreddynelavetla@gmail.com

-- ====================================================================================
-- STEP 1: Get the user_id for ajaykumarreddynelavetla@gmail.com
-- ====================================================================================

-- First, let's find the user_id
-- Run this query first to see the user_id:
SELECT id, email FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com';

-- ====================================================================================
-- STEP 2: Insert LinkedIn credentials
-- ====================================================================================

-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from the query above

INSERT INTO user_accounts (
  user_id,
  platform,
  platform_name,
  oauth_provider,
  access_token,
  refresh_token,
  token_expires_at,
  platform_user_id,
  platform_username,
  status,
  connected_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com'),
  'linkedin',
  'LinkedIn',
  'manual',  -- Manual entry, not OAuth
  'YOUR_LINKEDIN_ACCESS_TOKEN',  -- Will be replaced with actual token
  NULL,
  NULL,
  'manual_linkedin',
  'Ajay Kumar Reddy',
  'active',
  NOW()
)
ON CONFLICT (user_id, platform, platform_user_id) DO UPDATE
SET 
  access_token = EXCLUDED.access_token,
  status = 'active',
  connected_at = NOW();

-- ====================================================================================
-- STEP 3: Insert Twitter credentials
-- ====================================================================================

INSERT INTO user_accounts (
  user_id,
  platform,
  platform_name,
  oauth_provider,
  access_token,
  refresh_token,
  token_expires_at,
  platform_user_id,
  platform_username,
  status,
  connected_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com'),
  'twitter',
  'Twitter/X',
  'manual',  -- Manual entry, not OAuth
  'YOUR_TWITTER_ACCESS_TOKEN',  -- Will be replaced with actual token
  'YOUR_TWITTER_ACCESS_SECRET',  -- Will be replaced with actual secret
  NULL,
  'manual_twitter',
  'Ajay Kumar',
  'active',
  NOW()
)
ON CONFLICT (user_id, platform, platform_user_id) DO UPDATE
SET 
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  status = 'active',
  connected_at = NOW();

-- ====================================================================================
-- STEP 4: Verify the accounts were added
-- ====================================================================================

-- Check the user_accounts table
SELECT 
  ua.platform,
  ua.platform_name,
  ua.platform_username,
  ua.status,
  ua.connected_at,
  u.email
FROM user_accounts ua
JOIN auth.users u ON ua.user_id = u.id
WHERE u.email = 'ajaykumarreddynelavetla@gmail.com';

-- ====================================================================================
-- NOTES
-- ====================================================================================

-- After running this migration:
-- 1. Your LinkedIn and Twitter accounts will be connected to your user
-- 2. You can post to both platforms from the dashboard
-- 3. The accounts will show in the "Connected Accounts" section
-- 4. You can use the "Post Now" or "Schedule Post" features

-- To remove/disconnect an account later:
-- UPDATE user_accounts SET status = 'disconnected' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com')
-- AND platform = 'linkedin';

