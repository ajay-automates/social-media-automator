-- =====================================================
-- Hashtag Performance Tracker
-- Track which hashtags drive the most engagement
-- =====================================================

-- 1. Hashtag Performance (track individual hashtag metrics)
CREATE TABLE IF NOT EXISTS hashtag_performance (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Hashtag details
  hashtag VARCHAR(100) NOT NULL, -- Without # symbol, lowercase
  platform VARCHAR(50) NOT NULL, -- linkedin, twitter, instagram, etc.
  
  -- Usage statistics
  times_used INTEGER DEFAULT 1,
  first_used_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance metrics
  total_posts INTEGER DEFAULT 0,
  successful_posts INTEGER DEFAULT 0,
  failed_posts INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Engagement metrics
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  avg_engagement DECIMAL(10,2) DEFAULT 0,
  
  -- Trending status
  trending_up BOOLEAN DEFAULT false,
  trending_down BOOLEAN DEFAULT false,
  last_trend_check_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_hashtag_platform UNIQUE(user_id, hashtag, platform)
);

-- 2. Post Hashtags Junction (link posts to hashtags)
CREATE TABLE IF NOT EXISTS post_hashtags (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hashtag VARCHAR(100) NOT NULL, -- Without # symbol, lowercase
  platform VARCHAR(50) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_post_hashtag UNIQUE(post_id, hashtag, platform)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hashtag_performance_user ON hashtag_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_performance_platform ON hashtag_performance(platform);
CREATE INDEX IF NOT EXISTS idx_hashtag_performance_hashtag ON hashtag_performance(hashtag);
CREATE INDEX IF NOT EXISTS idx_hashtag_performance_success_rate ON hashtag_performance(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_performance_engagement ON hashtag_performance(avg_engagement DESC);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_user ON post_hashtags(user_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag);

-- 4. RLS Policies
ALTER TABLE hashtag_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

-- Hashtag performance policies
CREATE POLICY "Users can view their own hashtag performance"
  ON hashtag_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hashtag performance"
  ON hashtag_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hashtag performance"
  ON hashtag_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- Post hashtags policies
CREATE POLICY "Users can view their own post hashtags"
  ON post_hashtags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post hashtags"
  ON post_hashtags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Function to update updated_at
CREATE OR REPLACE FUNCTION update_hashtag_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hashtag_performance_timestamp
  BEFORE UPDATE ON hashtag_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_hashtag_performance_updated_at();

-- 6. Helper views
CREATE OR REPLACE VIEW top_hashtags AS
SELECT 
  user_id,
  platform,
  hashtag,
  times_used,
  success_rate,
  avg_engagement,
  total_engagement,
  RANK() OVER (PARTITION BY user_id, platform ORDER BY avg_engagement DESC) as engagement_rank,
  RANK() OVER (PARTITION BY user_id, platform ORDER BY success_rate DESC) as success_rank
FROM hashtag_performance
WHERE times_used >= 3 -- Minimum 3 uses for statistical relevance
ORDER BY avg_engagement DESC;

CREATE OR REPLACE VIEW trending_hashtags AS
SELECT 
  user_id,
  platform,
  hashtag,
  times_used,
  success_rate,
  avg_engagement,
  trending_up,
  trending_down,
  last_used_at
FROM hashtag_performance
WHERE trending_up = true OR trending_down = true
ORDER BY last_used_at DESC;

COMMENT ON TABLE hashtag_performance IS 'Performance metrics for each hashtag by platform';
COMMENT ON TABLE post_hashtags IS 'Junction table linking posts to hashtags';
COMMENT ON VIEW top_hashtags IS 'Top performing hashtags ranked by engagement and success rate';
COMMENT ON VIEW trending_hashtags IS 'Hashtags that are trending up or down';

