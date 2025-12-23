-- =====================================================
-- Migration 028: Business Profiles
-- Adds business/company profile management for personalized content generation
-- =====================================================

-- ========== BUSINESS PROFILES TABLE ==========
-- Stores all business/company information for AI-powered content generation

CREATE TABLE IF NOT EXISTS business_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  business_name TEXT NOT NULL,
  business_type TEXT CHECK (business_type IN ('company', 'personal_brand', 'agency', 'nonprofit', 'other')),
  industry TEXT, -- 'saas', 'ecommerce', 'services', 'consulting', 'retail', 'healthcare', 'education', 'technology', 'finance', 'real_estate', 'other'
  description TEXT, -- What the business does (detailed)
  
  -- Contact Information
  website_url TEXT,
  email TEXT,
  phone TEXT,
  
  -- Social Links
  linkedin_url TEXT,
  twitter_handle TEXT,
  instagram_handle TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  tiktok_handle TEXT,
  other_social_links JSONB, -- {platform: url} for additional platforms
  
  -- Business Details
  tagline TEXT, -- Short tagline/slogan
  value_proposition TEXT, -- What makes them unique
  target_audience TEXT, -- Who they serve
  key_products_services JSONB, -- ["Product 1", "Service 2", ...]
  key_features_benefits JSONB, -- ["Feature 1", "Benefit 2", ...]
  
  -- Content Preferences
  content_themes JSONB, -- ["product_updates", "industry_news", "tips", "behind_scenes", "customer_stories", "team_spotlight"]
  brand_voice TEXT, -- 'professional', 'casual', 'friendly', 'technical', 'inspirational', 'humorous'
  tone_description TEXT, -- More detailed tone description
  
  -- Visual Assets
  logo_url TEXT,
  brand_colors JSONB, -- ["#FF5733", "#33FF57"] - primary brand colors
  brand_fonts TEXT,
  
  -- Content Generation Settings
  auto_include_cta BOOLEAN DEFAULT true,
  cta_text TEXT DEFAULT 'Learn more',
  preferred_hashtags JSONB, -- ["#business", "#innovation"] - hashtags to include
  avoid_words JSONB, -- Words to never use in generated content
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id) -- One business profile per user (can extend to multi-business later)
);

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_industry ON business_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_type ON business_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_business_profiles_is_active ON business_profiles(is_active) WHERE is_active = true;

-- ========== ROW LEVEL SECURITY ==========
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own business profile
CREATE POLICY "Users can view own business profile"
  ON business_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own business profile
CREATE POLICY "Users can insert own business profile"
  ON business_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own business profile
CREATE POLICY "Users can update own business profile"
  ON business_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own business profile
CREATE POLICY "Users can delete own business profile"
  ON business_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ========== TRIGGER FOR UPDATED_AT ==========
CREATE OR REPLACE FUNCTION update_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_business_profiles_updated_at();

-- ========== COMMENTS ==========
COMMENT ON TABLE business_profiles IS 'Stores business/company profiles for personalized AI content generation';
COMMENT ON COLUMN business_profiles.user_id IS 'Owner of the business profile';
COMMENT ON COLUMN business_profiles.business_type IS 'Type of business: company, personal_brand, agency, nonprofit, other';
COMMENT ON COLUMN business_profiles.industry IS 'Industry category for industry-specific content';
COMMENT ON COLUMN business_profiles.content_themes IS 'Array of content themes user wants to post about';
COMMENT ON COLUMN business_profiles.brand_voice IS 'Overall brand voice/tone for content generation';
COMMENT ON COLUMN business_profiles.key_products_services IS 'Array of main products/services to promote';
COMMENT ON COLUMN business_profiles.preferred_hashtags IS 'Hashtags to include in generated posts';
COMMENT ON COLUMN business_profiles.avoid_words IS 'Words/phrases to never use in generated content';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Business profiles table created successfully!';
  RAISE NOTICE '📊 Table: business_profiles';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '📈 Indexes created';
END $$;

