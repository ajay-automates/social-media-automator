-- Migration 003: Fix User Signup Trigger
-- This fixes the "Database error saving new user" issue
-- The problem: RLS policies were blocking the automatic subscription creation

-- ====================================================================================
-- FIX 1: Update the subscription creation function to properly bypass RLS
-- ====================================================================================

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users;
DROP FUNCTION IF EXISTS create_default_subscription();

-- Recreate the function with proper permissions
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER 
SECURITY DEFINER -- This makes it run with superuser privileges
SET search_path = public
AS $$
BEGIN
    -- Insert default subscription, bypassing RLS
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create default subscription for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_subscription();

-- ====================================================================================
-- FIX 2: Add a policy to allow the trigger to insert subscriptions
-- ====================================================================================

-- This policy allows inserts during user creation
DROP POLICY IF EXISTS "Allow subscription creation on signup" ON subscriptions;
CREATE POLICY "Allow subscription creation on signup"
    ON subscriptions
    FOR INSERT
    WITH CHECK (true);  -- Allow all inserts (the trigger will handle this)

-- Keep the existing policy for SELECT/UPDATE/DELETE
DROP POLICY IF EXISTS "Users see own subscription" ON subscriptions;
CREATE POLICY "Users see own subscription" 
    ON subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own subscription" 
    ON subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ====================================================================================
-- VERIFICATION
-- ====================================================================================

-- Check that the function exists
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'create_default_subscription';

-- Check that the trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'on_user_created_subscription';

-- Check the policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'subscriptions';

-- ====================================================================================
-- MIGRATION COMPLETE
-- ====================================================================================

-- To apply this fix:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Paste this entire file
-- 4. Run the query
-- 5. Try signing up again - it should work now!

