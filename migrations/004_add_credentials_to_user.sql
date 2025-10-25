-- Migration 004: Add LinkedIn and Twitter Credentials to User Account
-- User: ajaykumarreddynelavetla@gmail.com
-- This connects your existing LinkedIn and Twitter credentials to your SaaS account

-- ====================================================================================
-- STEP 1: Find your user_id
-- ====================================================================================

-- First, let's see your user details
SELECT id, email, created_at FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com';

-- Copy the 'id' value from above - you'll need it!

-- ====================================================================================
-- STEP 2: Add LinkedIn Account
-- ====================================================================================

-- Replace the access_token with your actual LinkedIn token from .env
-- (Currently it's a placeholder in .env, you'll need to add your real token)

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
  'manual',
  'YOUR_REAL_LINKEDIN_ACCESS_TOKEN_HERE',  -- ⚠️ Replace this with your real LinkedIn token
  NULL,
  NULL,
  'ajay_kumar_reddy',
  'Ajay Kumar Reddy',
  'active',
  NOW()
)
ON CONFLICT (user_id, platform, platform_user_id) 
DO UPDATE SET 
  access_token = EXCLUDED.access_token,
  status = 'active',
  connected_at = NOW();

-- ====================================================================================
-- STEP 3: Add Twitter Account
-- ====================================================================================

-- Replace the tokens with your actual Twitter credentials from .env

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
  'manual',
  'YOUR_REAL_TWITTER_ACCESS_TOKEN_HERE',    -- ⚠️ Replace this
  'YOUR_REAL_TWITTER_ACCESS_SECRET_HERE',   -- ⚠️ Replace this
  NULL,
  'ajay_automates',
  'Ajay Kumar',
  'active',
  NOW()
)
ON CONFLICT (user_id, platform, platform_user_id) 
DO UPDATE SET 
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  status = 'active',
  connected_at = NOW();

-- ====================================================================================
-- STEP 4: Verify Accounts Were Added
-- ====================================================================================

-- Check your connected accounts
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

-- You should see 2 rows (LinkedIn and Twitter)

-- ====================================================================================
-- ALTERNATIVE: Quick Test with Temporary Tokens
-- ====================================================================================

-- If you want to test without real tokens, you can add them with placeholders
-- and update them later when you have real credentials:

/*
INSERT INTO user_accounts (user_id, platform, platform_name, oauth_provider, access_token, refresh_token, platform_user_id, platform_username, status)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com'), 'linkedin', 'LinkedIn', 'manual', 'temp_linkedin_token', NULL, 'temp_linkedin', 'Ajay Kumar Reddy', 'active'),
  ((SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com'), 'twitter', 'Twitter/X', 'manual', 'temp_twitter_token', 'temp_twitter_secret', 'temp_twitter', 'Ajay Kumar', 'active')
ON CONFLICT (user_id, platform, platform_user_id) DO NOTHING;
*/

-- ====================================================================================
-- NOTES
-- ====================================================================================

-- After running this migration:
-- 1. Your dashboard will show LinkedIn and Twitter as "Connected"
-- 2. You can create posts and select these platforms
-- 3. The posting will use these credentials
-- 4. You can update credentials anytime by running UPDATE queries

-- To update LinkedIn token later:
/*
UPDATE user_accounts 
SET access_token = 'new_linkedin_token',
    connected_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com')
  AND platform = 'linkedin';
*/

-- To update Twitter tokens later:
/*
UPDATE user_accounts 
SET access_token = 'new_twitter_token',
    refresh_token = 'new_twitter_secret',
    connected_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com')
  AND platform = 'twitter';
*/

