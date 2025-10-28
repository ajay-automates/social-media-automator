-- Migration: Add Post Templates & Saved Drafts
-- Description: Allows users to save posts as reusable templates
-- Date: 2025-10-28

-- ============================================
-- 1. Create post_templates table
-- ============================================

CREATE TABLE IF NOT EXISTS post_templates (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  text TEXT NOT NULL,
  image_url TEXT,
  
  -- Platform & category
  platforms TEXT[] NOT NULL DEFAULT '{}',
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  use_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  shared_with UUID[], -- For team sharing (Business plan)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT template_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT template_text_not_empty CHECK (LENGTH(TRIM(text)) > 0)
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX idx_templates_user_id ON post_templates(user_id);
CREATE INDEX idx_templates_category ON post_templates(category);
CREATE INDEX idx_templates_favorite ON post_templates(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_templates_created_at ON post_templates(created_at DESC);
CREATE INDEX idx_templates_use_count ON post_templates(use_count DESC);
CREATE INDEX idx_templates_search ON post_templates USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || text));

-- ============================================
-- 3. Enable Row Level Security
-- ============================================

ALTER TABLE post_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own templates
CREATE POLICY "Users can view own templates"
  ON post_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own templates
CREATE POLICY "Users can create own templates"
  ON post_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON post_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON post_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Users can view shared templates (Business plan feature)
CREATE POLICY "Users can view shared templates"
  ON post_templates FOR SELECT
  USING (
    auth.uid() = ANY(shared_with) OR 
    (is_shared = true AND auth.uid() IS NOT NULL)
  );

-- ============================================
-- 4. Create function to update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_template_timestamp
  BEFORE UPDATE ON post_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updated_at();

-- ============================================
-- 5. Create function to increment use count
-- ============================================

CREATE OR REPLACE FUNCTION increment_template_use_count(template_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE post_templates
  SET 
    use_count = use_count + 1,
    last_used_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Add helpful comments
-- ============================================

COMMENT ON TABLE post_templates IS 'Stores reusable post templates for users';
COMMENT ON COLUMN post_templates.name IS 'Template name (e.g., "Welcome Message")';
COMMENT ON COLUMN post_templates.description IS 'Optional description of template purpose';
COMMENT ON COLUMN post_templates.text IS 'Template content with optional variables like {{name}}';
COMMENT ON COLUMN post_templates.platforms IS 'Array of platforms this template is for';
COMMENT ON COLUMN post_templates.category IS 'Template category (promotional, educational, etc.)';
COMMENT ON COLUMN post_templates.tags IS 'Array of tags for filtering';
COMMENT ON COLUMN post_templates.use_count IS 'Number of times template has been used';
COMMENT ON COLUMN post_templates.is_favorite IS 'Whether user has marked as favorite';
COMMENT ON COLUMN post_templates.is_shared IS 'Whether template is shared with team (Business plan)';
COMMENT ON COLUMN post_templates.shared_with IS 'Array of user IDs who can access this template';

-- ============================================
-- 7. Insert sample templates (optional)
-- ============================================

-- Uncomment to add sample templates for testing
/*
INSERT INTO post_templates (user_id, name, description, text, platforms, category, tags) VALUES
  (
    'YOUR_USER_ID_HERE',
    'Welcome Post',
    'Standard welcome message for new followers',
    'Welcome to our community! 🎉 We''re excited to have you here. Follow us for daily tips on {{topic}}.',
    ARRAY['linkedin', 'twitter'],
    'engagement',
    ARRAY['welcome', 'introduction']
  ),
  (
    'YOUR_USER_ID_HERE',
    'Product Launch',
    'Announcing new product or feature',
    '🚀 Exciting news! We''re launching {{product_name}} today. {{description}} Learn more: {{link}}',
    ARRAY['linkedin', 'twitter', 'instagram'],
    'promotional',
    ARRAY['launch', 'announcement', 'product']
  ),
  (
    'YOUR_USER_ID_HERE',
    'Tip of the Day',
    'Daily educational tip',
    '💡 Tip of the Day: {{tip_content}} What''s your favorite productivity hack? Share below! 👇',
    ARRAY['linkedin', 'twitter'],
    'educational',
    ARRAY['tips', 'education', 'daily']
  );
*/

-- ============================================
-- Migration Complete
-- ============================================

-- Verification queries
DO $$ 
BEGIN
  RAISE NOTICE '✅ Post templates migration completed successfully!';
  RAISE NOTICE '📊 Table created: post_templates';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '📈 Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Implement backend service (services/templates.js)';
  RAISE NOTICE '   2. Add API endpoints to server.js';
  RAISE NOTICE '   3. Create frontend UI components';
  RAISE NOTICE '   4. Test template creation and usage';
END $$;
