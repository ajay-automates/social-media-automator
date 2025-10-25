-- Migration 002: Multi-Tenant SaaS Architecture
-- This migration adds user isolation, user accounts, subscriptions, and usage tracking

-- ====================================================================================
-- 1. ADD USER_ID TO POSTS TABLE
-- ====================================================================================

-- Add user_id column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- ====================================================================================
-- 2. CREATE USER_ACCOUNTS TABLE (OAuth Credentials)
-- ====================================================================================

-- This table stores OAuth credentials for each user's social media accounts
CREATE TABLE IF NOT EXISTS user_accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'instagram')),
  platform_name TEXT,
  oauth_provider TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  platform_user_id TEXT,
  platform_username TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'expired')),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_platform ON user_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_user_accounts_status ON user_accounts(status);

-- ====================================================================================
-- 3. CREATE SUBSCRIPTIONS TABLE
-- ====================================================================================

-- This table tracks user subscription plans and billing info
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

-- ====================================================================================
-- 4. CREATE USAGE TRACKING TABLE
-- ====================================================================================

-- This table tracks monthly usage for enforcing plan limits
CREATE TABLE IF NOT EXISTS usage (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of the month (YYYY-MM-01)
  posts_count INT DEFAULT 0,
  ai_count INT DEFAULT 0,
  accounts_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_user_month ON usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_usage_month ON usage(month);

-- ====================================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================================================

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- ====================================================================================
-- 6. CREATE RLS POLICIES
-- ====================================================================================

-- Posts: Users can only see and modify their own posts
DROP POLICY IF EXISTS "Users see own posts" ON posts;
CREATE POLICY "Users see own posts" ON posts
  FOR ALL
  USING (auth.uid() = user_id);

-- User Accounts: Users can only see and modify their own connected accounts
DROP POLICY IF EXISTS "Users see own accounts" ON user_accounts;
CREATE POLICY "Users see own accounts" ON user_accounts
  FOR ALL
  USING (auth.uid() = user_id);

-- Subscriptions: Users can only see their own subscription
DROP POLICY IF EXISTS "Users see own subscription" ON subscriptions;
CREATE POLICY "Users see own subscription" ON subscriptions
  FOR ALL
  USING (auth.uid() = user_id);

-- Usage: Users can only see their own usage
DROP POLICY IF EXISTS "Users see own usage" ON usage;
CREATE POLICY "Users see own usage" ON usage
  FOR ALL
  USING (auth.uid() = user_id);

-- ====================================================================================
-- 7. CREATE FUNCTIONS FOR AUTOMATIC UPDATES
-- ====================================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_updated_at ON usage;
CREATE TRIGGER update_usage_updated_at
    BEFORE UPDATE ON usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================================
-- 8. CREATE DEFAULT SUBSCRIPTION FOR NEW USERS
-- ====================================================================================

-- Function to create default free subscription when user signs up
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users;
CREATE TRIGGER on_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_subscription();

-- ====================================================================================
-- 9. HELPER VIEWS FOR ANALYTICS
-- ====================================================================================

-- View for user subscription summary
CREATE OR REPLACE VIEW user_subscription_summary AS
SELECT 
    u.id as user_id,
    u.email,
    s.plan,
    s.status,
    s.current_period_end,
    s.created_at as subscription_created_at,
    COUNT(DISTINCT ua.id) as connected_accounts,
    COUNT(DISTINCT p.id) as total_posts
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN user_accounts ua ON u.id = ua.user_id AND ua.status = 'active'
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.email, s.plan, s.status, s.current_period_end, s.created_at;

-- ====================================================================================
-- 10. SEED DEFAULT DATA (Optional - for development)
-- ====================================================================================

-- You can add seed data here if needed for testing
-- For example, creating test users or default subscriptions

-- ====================================================================================
-- MIGRATION COMPLETE
-- ====================================================================================

-- To apply this migration:
-- 1. Copy this SQL file content
-- 2. Go to your Supabase Dashboard → SQL Editor
-- 3. Create a new query
-- 4. Paste the content
-- 5. Run the query
-- 6. Verify all tables and policies are created correctly

-- To verify the migration:
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

