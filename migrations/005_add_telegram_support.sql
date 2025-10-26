-- Migration 005: Add Telegram platform support
-- ====================================================================================

-- 1. Update the platform CHECK constraint to include 'telegram'
-- ====================================================================================

ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

ALTER TABLE user_accounts 
ADD CONSTRAINT user_accounts_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'instagram', 'telegram'));

-- ====================================================================================
-- VERIFY
-- ====================================================================================

-- Check the constraint was updated
SELECT 
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints 
WHERE table_name = 'user_accounts' 
  AND constraint_name = 'user_accounts_platform_check';

-- Expected output: Should show platform IN ('linkedin', 'twitter', 'instagram', 'telegram')

-- ====================================================================================
-- NOTES
-- ====================================================================================

-- This migration allows the 'telegram' platform to be inserted into user_accounts table
-- No existing data is affected
-- The constraint now allows 4 platforms instead of 3

