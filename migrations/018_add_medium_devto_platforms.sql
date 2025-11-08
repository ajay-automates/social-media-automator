-- Migration 018: Add Medium and Dev.to to supported platforms
-- This updates the CHECK constraint to allow 'medium' and 'devto' as valid platform values

-- Drop the existing CHECK constraint
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

-- Add new CHECK constraint with medium and devto included
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
  'devto'
));

-- Update constraint comment
COMMENT ON CONSTRAINT user_accounts_platform_check ON user_accounts IS 
'Supported platforms: linkedin, twitter, telegram, slack, discord, reddit, instagram, facebook, youtube, tiktok, pinterest, medium, devto';

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'user_accounts'::regclass 
AND conname = 'user_accounts_platform_check';

