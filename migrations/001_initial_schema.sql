-- Social Media Automator Database Schema
-- Run this in your Supabase SQL Editor

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  image_url TEXT,
  platforms TEXT[] NOT NULL,
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'posted', 'failed', 'partial', 'draft')),
  schedule_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  posted_at TIMESTAMPTZ,
  results JSONB,
  error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_schedule_time ON posts(schedule_time);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_platforms ON posts USING GIN(platforms);

-- Create post_analytics table for detailed tracking
CREATE TABLE IF NOT EXISTS post_analytics (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_post_id TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_post_id ON post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_analytics_platform ON post_analytics(platform);

-- Create view for platform statistics
CREATE OR REPLACE VIEW platform_stats AS
SELECT 
  platform,
  COUNT(*) as total_posts,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_posts,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_posts,
  ROUND(AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100, 2) as success_rate
FROM post_analytics
GROUP BY platform;

-- Create view for daily activity
CREATE OR REPLACE VIEW daily_activity AS
SELECT 
  DATE(posted_at) as date,
  COUNT(*) as total_posts,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_posts,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_posts
FROM post_analytics
GROUP BY DATE(posted_at)
ORDER BY date DESC;

-- Enable Row Level Security (RLS) - optional for added security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for service role)
CREATE POLICY "Enable all operations for service role"
  ON posts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for service role on analytics"
  ON post_analytics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert test data (optional - remove in production)
-- INSERT INTO posts (text, platforms, schedule_time, status)
-- VALUES ('Test post', ARRAY['linkedin'], NOW(), 'posted');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📊 Tables: posts, post_analytics';
  RAISE NOTICE '📈 Views: platform_stats, daily_activity';
END $$;

