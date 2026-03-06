-- Migration: Add Platform Analytics Tables
-- Stores daily snapshots and per-post metrics pulled from each platform's API

CREATE TABLE IF NOT EXISTS platform_daily_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  followers BIGINT DEFAULT 0,
  followers_delta BIGINT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  views_delta BIGINT DEFAULT 0,
  total_likes BIGINT DEFAULT 0,
  likes_delta BIGINT DEFAULT 0,
  total_comments BIGINT DEFAULT 0,
  comments_delta BIGINT DEFAULT 0,
  total_posts BIGINT DEFAULT 0,
  extra_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, date)
);

ALTER TABLE platform_daily_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can access own snapshots"
  ON platform_daily_snapshots FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_platform_snapshots_user_date
  ON platform_daily_snapshots(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_platform_snapshots_user_platform
  ON platform_daily_snapshots(user_id, platform, date DESC);


CREATE TABLE IF NOT EXISTS platform_post_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  title TEXT,
  post_url TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, platform_post_id)
);

ALTER TABLE platform_post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can access own post metrics"
  ON platform_post_metrics FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_platform_posts_user_platform
  ON platform_post_metrics(user_id, platform, published_at DESC);
