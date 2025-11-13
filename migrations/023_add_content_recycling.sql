-- =====================================================
-- Content Recycling Engine
-- Automatically repost best-performing content
-- =====================================================

-- 1. Content Recycling Settings (per user)
CREATE TABLE IF NOT EXISTS content_recycling_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feature toggle
  auto_recycle_enabled BOOLEAN DEFAULT false,
  
  -- Recycling rules
  minimum_age_days INTEGER DEFAULT 30, -- Posts must be at least 30 days old
  minimum_success_rate DECIMAL(5,2) DEFAULT 80.0, -- Minimum 80% success rate
  minimum_engagement_score INTEGER DEFAULT 70, -- Minimum engagement score (0-100)
  max_recycles_per_post INTEGER DEFAULT 3, -- Max times a post can be recycled
  recycle_interval_days INTEGER DEFAULT 90, -- Wait 90 days before recycling same post again
  
  -- Schedule settings
  frequency VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'bi-weekly', 'monthly'
  posts_per_cycle INTEGER DEFAULT 3, -- How many posts to recycle per cycle
  
  -- Platform preferences
  allowed_platforms TEXT[] DEFAULT ARRAY['linkedin', 'twitter', 'instagram', 'facebook'], -- Which platforms to recycle on
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_recycling_settings UNIQUE(user_id)
);

-- 2. Content Recycling History (track recycled posts)
CREATE TABLE IF NOT EXISTS content_recycling_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Original post details
  original_post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  original_posted_at TIMESTAMPTZ,
  original_success_rate DECIMAL(5,2),
  
  -- Recycled post details
  recycled_post_id BIGINT REFERENCES posts(id) ON DELETE SET NULL,
  recycled_at TIMESTAMPTZ DEFAULT NOW(),
  recycled_platforms TEXT[],
  
  -- Performance tracking
  original_engagement INTEGER DEFAULT 0,
  recycled_engagement INTEGER DEFAULT 0,
  performance_comparison DECIMAL(5,2), -- % difference in performance
  
  -- How it was triggered
  trigger_type VARCHAR(50) DEFAULT 'manual', -- 'manual' or 'automatic'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_original_post FOREIGN KEY (original_post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_recycled_post FOREIGN KEY (recycled_post_id) REFERENCES posts(id) ON DELETE SET NULL
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recycling_settings_user ON content_recycling_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_recycling_history_user ON content_recycling_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recycling_history_original_post ON content_recycling_history(original_post_id);
CREATE INDEX IF NOT EXISTS idx_recycling_history_recycled_post ON content_recycling_history(recycled_post_id);
CREATE INDEX IF NOT EXISTS idx_recycling_history_recycled_at ON content_recycling_history(recycled_at DESC);

-- 4. RLS Policies
ALTER TABLE content_recycling_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recycling_history ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Users can view their own recycling settings"
  ON content_recycling_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recycling settings"
  ON content_recycling_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recycling settings"
  ON content_recycling_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recycling settings"
  ON content_recycling_settings FOR DELETE
  USING (auth.uid() = user_id);

-- History policies
CREATE POLICY "Users can view their own recycling history"
  ON content_recycling_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recycling history"
  ON content_recycling_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recycling_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recycling_settings_timestamp
  BEFORE UPDATE ON content_recycling_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_recycling_settings_updated_at();

-- 6. Helper view for recyclable posts
CREATE OR REPLACE VIEW recyclable_posts AS
SELECT 
  p.id,
  p.user_id,
  p.text,
  p.platforms,
  p.posted_at,
  p.image_url,
  -- Calculate success rate
  CASE 
    WHEN COUNT(pa.id) > 0 THEN
      ROUND((COUNT(CASE WHEN pa.success = true THEN 1 END)::DECIMAL / COUNT(pa.id)::DECIMAL) * 100, 2)
    ELSE 0
  END as success_rate,
  -- Count previous recycles
  COUNT(DISTINCT crh.id) as times_recycled,
  -- Last recycled date
  MAX(crh.recycled_at) as last_recycled_at,
  -- Days since last recycle (or since original post if never recycled)
  CASE 
    WHEN MAX(crh.recycled_at) IS NOT NULL THEN
      EXTRACT(DAY FROM NOW() - MAX(crh.recycled_at))
    ELSE
      EXTRACT(DAY FROM NOW() - p.posted_at)
  END as days_since_last_recycle
FROM posts p
LEFT JOIN post_analytics pa ON p.id = pa.post_id
LEFT JOIN content_recycling_history crh ON p.id = crh.original_post_id
WHERE 
  p.status = 'posted'
  AND p.posted_at IS NOT NULL
  AND p.text IS NOT NULL
  AND p.text != ''
GROUP BY p.id, p.user_id, p.text, p.platforms, p.posted_at, p.image_url;

COMMENT ON TABLE content_recycling_settings IS 'User settings for automatic content recycling';
COMMENT ON TABLE content_recycling_history IS 'History of all recycled posts with performance tracking';
COMMENT ON VIEW recyclable_posts IS 'View of posts eligible for recycling with performance metrics';

