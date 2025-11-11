-- Migration: Add Content Creation Agent
-- Description: Tables for AI-powered content generation, trend monitoring, and brand voice analysis
-- Run this in your Supabase SQL Editor

-- Content Agent Posts table (AI-generated content awaiting approval)
CREATE TABLE IF NOT EXISTS content_agent_posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  caption TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  image_url TEXT,
  hashtags TEXT[],
  scheduled_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'posted', 'expired')),
  quality_score INT CHECK (quality_score >= 0 AND quality_score <= 100),
  engagement_prediction INT CHECK (engagement_prediction >= 0 AND engagement_prediction <= 100),
  trend_source TEXT, -- 'google', 'reddit', 'twitter', 'manual', null
  trend_topic TEXT, -- The trending topic this was based on
  content_type TEXT, -- 'educational', 'promotional', 'engaging', 'trending', 'story'
  created_by TEXT DEFAULT 'ai-agent',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  post_id BIGINT REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Voice Profiles table (learns user's writing style)
CREATE TABLE IF NOT EXISTS brand_voice_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  tone TEXT, -- 'professional', 'casual', 'humorous', 'inspirational', 'technical'
  formality_level INT CHECK (formality_level >= 1 AND formality_level <= 10), -- 1=very casual, 10=very formal
  common_phrases JSONB, -- ["excited to share", "here's why", "let me show you"]
  avoided_words JSONB, -- Words user never uses
  avg_caption_length INT,
  avg_sentence_length INT,
  emoji_usage BOOLEAN DEFAULT false,
  emoji_frequency DECIMAL(3,2), -- 0.00 to 1.00 (emojis per 100 chars)
  hashtag_count_avg INT,
  hashtag_style TEXT, -- 'minimal', 'moderate', 'heavy'
  question_usage BOOLEAN DEFAULT false, -- Does user ask questions in posts?
  cta_style TEXT, -- 'direct', 'subtle', 'none' (call-to-action style)
  topics_of_interest JSONB, -- ["productivity", "SaaS", "marketing"]
  best_performing_topics JSONB, -- Topics with highest engagement
  posting_frequency TEXT, -- 'daily', 'weekly', 'sporadic'
  analyzed_post_count INT DEFAULT 0,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trend Alerts table (tracked trending topics)
CREATE TABLE IF NOT EXISTS trend_alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  trend_topic TEXT NOT NULL,
  trend_keyword TEXT NOT NULL,
  trend_source TEXT NOT NULL, -- 'google', 'reddit', 'twitter', 'linkedin'
  trend_score INT CHECK (trend_score >= 0 AND trend_score <= 100), -- Virality potential
  trend_volume INT, -- Search volume or mentions
  trend_category TEXT, -- 'technology', 'business', 'health', etc.
  user_niche_match_score INT CHECK (user_niche_match_score >= 0 AND user_niche_match_score <= 100),
  draft_caption TEXT,
  draft_platforms TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'dismissed', 'expired')),
  used_post_id BIGINT REFERENCES content_agent_posts(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ, -- Trends expire fast (usually 24-48 hours)
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Agent Settings table (user preferences for agent)
CREATE TABLE IF NOT EXISTS content_agent_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  auto_generate BOOLEAN DEFAULT false, -- Auto-generate content daily
  auto_schedule BOOLEAN DEFAULT false, -- Auto-schedule approved posts
  generation_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'manual'
  posts_per_week INT DEFAULT 7,
  preferred_platforms TEXT[], -- Default platforms for agent posts
  content_mix JSONB DEFAULT '{"educational": 40, "promotional": 30, "engaging": 20, "trending": 10}'::jsonb,
  trend_monitoring BOOLEAN DEFAULT true,
  trend_categories TEXT[], -- ['technology', 'business', 'marketing']
  require_approval BOOLEAN DEFAULT true, -- Posts need approval before scheduling
  min_quality_score INT DEFAULT 70, -- Only generate posts above this score
  avoid_topics TEXT[], -- Topics to avoid
  brand_keywords TEXT[], -- Must include these in generated content
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Generation Log table (track all generation attempts)
CREATE TABLE IF NOT EXISTS content_generation_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL, -- 'calendar', 'single', 'trend-based', 'manual'
  posts_requested INT,
  posts_generated INT,
  posts_approved INT,
  posts_rejected INT,
  avg_quality_score DECIMAL(5,2),
  topics_generated JSONB,
  trends_used JSONB,
  generation_time_seconds DECIMAL(6,2),
  ai_tokens_used INT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_agent_posts_user ON content_agent_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_agent_posts_workspace ON content_agent_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_agent_posts_scheduled ON content_agent_posts(scheduled_time) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_content_agent_posts_status ON content_agent_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_agent_posts_quality ON content_agent_posts(quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_brand_voice_user ON brand_voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_voice_workspace ON brand_voice_profiles(workspace_id);

CREATE INDEX IF NOT EXISTS idx_trend_alerts_user ON trend_alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trend_alerts_workspace ON trend_alerts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_trend_alerts_expires ON trend_alerts(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_trend_alerts_source ON trend_alerts(trend_source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_settings_user ON content_agent_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_content_settings_enabled ON content_agent_settings(enabled) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_generation_log_user ON content_generation_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_log_workspace ON content_generation_log(workspace_id);

-- Views for analytics
CREATE OR REPLACE VIEW content_agent_stats AS
SELECT
  user_id,
  COUNT(*) as total_generated,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
  SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted_count,
  ROUND(AVG(quality_score), 2) as avg_quality_score,
  ROUND(AVG(engagement_prediction), 2) as avg_engagement_prediction,
  COUNT(DISTINCT trend_source) as trend_sources_used
FROM content_agent_posts
GROUP BY user_id;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Content Creation Agent tables created successfully!';
  RAISE NOTICE '📊 Tables: content_agent_posts, brand_voice_profiles, trend_alerts, content_agent_settings, content_generation_log';
  RAISE NOTICE '📈 Views: content_agent_stats';
  RAISE NOTICE '🤖 Ready for AI-powered content generation!';
END $$;
