-- Migration: Add account labels and default account support
-- Description: Allow users to label their accounts and set default accounts per platform

-- Add account_label column to user_accounts table
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS account_label TEXT DEFAULT 'Main Account';

-- Add is_default column to user_accounts table
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create index for faster queries by user and platform
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_platform ON user_accounts(user_id, platform);

-- Create index for default accounts
CREATE INDEX IF NOT EXISTS idx_user_accounts_default ON user_accounts(is_default) WHERE is_default = true;

-- Update existing accounts to have "Main Account" label
UPDATE user_accounts 
SET account_label = 'Main Account'
WHERE account_label IS NULL;

-- Set first account per platform as default for each user
WITH ranked_accounts AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id, platform ORDER BY created_at) as rn
  FROM user_accounts
)
UPDATE user_accounts ua
SET is_default = true
FROM ranked_accounts ra
WHERE ua.id = ra.id AND ra.rn = 1;

