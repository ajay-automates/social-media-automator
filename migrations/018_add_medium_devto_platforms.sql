-- Migration 018: Add Medium, Dev.to, and Tumblr to supported platforms
-- This updates the CHECK constraint to allow 'medium', 'devto', and 'tumblr' as valid platform values

-- Drop the existing CHECK constraint
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

-- Add new CHECK constraint with medium, devto, and tumblr included
ALTER TABLE user_accounts
ADD CONSTRAINT user_accounts_platform_check 
CHECK (platform IN (
  'linkedin', 
  'twitter', 
  'telegram', 
  'slack', 
  'discord', 
  'reddit', 
  'instagram', 
  'facebook', 
  'youtube', 
  'tiktok',
  'pinterest',
  'medium',
  'devto',
  'tumblr'
));

-- Update constraint comment
COMMENT ON CONSTRAINT user_accounts_platform_check ON user_accounts IS 
'Supported platforms: linkedin, twitter, telegram, slack, discord, reddit, instagram, facebook, youtube, tiktok, pinterest, medium, devto, tumblr';

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'user_accounts'::regclass 
AND conname = 'user_accounts_platform_check';

