-- =====================================================
-- A/B Testing Engine
-- Test content variations to optimize engagement
-- =====================================================

-- 1. A/B Tests (parent test configuration)
CREATE TABLE IF NOT EXISTS ab_tests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Test details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  test_type VARCHAR(50) DEFAULT 'caption', -- 'caption', 'hashtags', 'image', 'time'
  
  -- Test configuration
  platforms TEXT[] NOT NULL, -- Which platforms to test on
  variation_count INTEGER DEFAULT 2, -- Number of variations (2-4)
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  
  -- Results
  winner_variation_id BIGINT, -- ID of winning variation
  winner_declared_at TIMESTAMPTZ,
  confidence_score DECIMAL(5,2), -- Statistical confidence (0-100)
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  test_duration_hours INTEGER DEFAULT 48, -- How long to run test
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Test Variations (individual variations in a test)
CREATE TABLE IF NOT EXISTS ab_test_variations (
  id BIGSERIAL PRIMARY KEY,
  test_id BIGINT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Variation details
  variation_name VARCHAR(100) NOT NULL, -- 'A', 'B', 'C', etc.
  post_id BIGINT REFERENCES posts(id) ON DELETE SET NULL,
  
  -- Content variations
  caption TEXT,
  hashtags TEXT[],
  image_url TEXT,
  post_time TIMESTAMPTZ,
  
  -- Performance metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
  
  -- Status
  posted BOOLEAN DEFAULT false,
  posted_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_test FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_tests_user ON ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_variations_test ON ab_test_variations(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_variations_post ON ab_test_variations(post_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_at ON ab_tests(created_at DESC);

-- 4. RLS Policies
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variations ENABLE ROW LEVEL SECURITY;

-- A/B Tests policies
CREATE POLICY "Users can view their own tests"
  ON ab_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tests"
  ON ab_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tests"
  ON ab_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tests"
  ON ab_tests FOR DELETE
  USING (auth.uid() = user_id);

-- Variations policies
CREATE POLICY "Users can view their own variations"
  ON ab_test_variations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own variations"
  ON ab_test_variations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own variations"
  ON ab_test_variations FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Function to update updated_at
CREATE OR REPLACE FUNCTION update_ab_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ab_tests_timestamp
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_ab_tests_updated_at();

-- 6. Helper view for test results
CREATE OR REPLACE VIEW ab_test_results AS
SELECT 
  t.id as test_id,
  t.user_id,
  t.name as test_name,
  t.status,
  t.platforms,
  t.started_at,
  t.completed_at,
  v.id as variation_id,
  v.variation_name,
  v.caption,
  v.total_engagement,
  v.engagement_rate,
  v.posted_at,
  -- Rank variations by engagement
  RANK() OVER (PARTITION BY t.id ORDER BY v.total_engagement DESC) as performance_rank
FROM ab_tests t
LEFT JOIN ab_test_variations v ON t.id = v.test_id
WHERE v.posted = true;

COMMENT ON TABLE ab_tests IS 'A/B test configurations for content optimization';
COMMENT ON TABLE ab_test_variations IS 'Individual variations in A/B tests with performance metrics';
COMMENT ON VIEW ab_test_results IS 'Test results with performance rankings';

