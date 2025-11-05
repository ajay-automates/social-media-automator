-- Migration: Add Public Templates Support
-- Description: Allow templates to be marked as public and visible to all users
-- Date: 2025-11-05

-- ============================================
-- 1. Add is_public column
-- ============================================

ALTER TABLE post_templates 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- ============================================
-- 2. Update RLS policies for public templates
-- ============================================

-- Drop existing view policy to update it
DROP POLICY IF EXISTS "Users can view own templates" ON post_templates;

-- New policy: Users can view their own templates OR public templates
CREATE POLICY "Users can view own and public templates"
  ON post_templates FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_public = true
  );

-- ============================================
-- 3. Create index for public templates
-- ============================================

CREATE INDEX IF NOT EXISTS idx_templates_public 
ON post_templates(is_public) WHERE is_public = true;

-- ============================================
-- 4. Add comments
-- ============================================

COMMENT ON COLUMN post_templates.is_public IS 'Whether template is visible to all users as part of public library';

-- ============================================
-- Migration Complete
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Public templates migration completed successfully!';
  RAISE NOTICE '📚 Templates can now be marked as public';
  RAISE NOTICE '🔒 RLS policies updated to allow viewing public templates';
  RAISE NOTICE '📈 Index created for performance';
END $$;

