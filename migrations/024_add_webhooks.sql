-- =====================================================
-- Webhook Notifications System
-- Send webhooks to Zapier, Make, and other services
-- =====================================================

-- 1. Webhook Endpoints (user webhook configurations)
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Endpoint details
  name VARCHAR(100) NOT NULL, -- User-friendly name (e.g., "Zapier Success Hook")
  url TEXT NOT NULL, -- Webhook URL
  enabled BOOLEAN DEFAULT true,
  
  -- Event triggers
  events TEXT[] DEFAULT ARRAY['post.success', 'post.failed'], -- Which events trigger this webhook
  
  -- Platform filters (optional - empty means all platforms)
  platforms TEXT[], -- Only trigger for specific platforms
  
  -- Security
  secret VARCHAR(255), -- Optional secret for HMAC signature
  
  -- Retry configuration
  retry_enabled BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 5, -- Delay between retries
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  total_triggers INTEGER DEFAULT 0,
  successful_triggers INTEGER DEFAULT 0,
  failed_triggers INTEGER DEFAULT 0,
  
  CONSTRAINT valid_url CHECK (url LIKE 'http%')
);

-- 2. Webhook Logs (history of all webhook calls)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  webhook_id BIGINT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL, -- 'post.success', 'post.failed', 'post.recycled', etc.
  post_id BIGINT REFERENCES posts(id) ON DELETE SET NULL,
  
  -- Request details
  url TEXT NOT NULL,
  method VARCHAR(10) DEFAULT 'POST',
  payload JSONB, -- Full webhook payload
  headers JSONB, -- Request headers
  
  -- Response details
  status_code INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  
  -- Retry tracking
  attempt_number INTEGER DEFAULT 1,
  is_retry BOOLEAN DEFAULT false,
  
  -- Timing
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER, -- How long the webhook took
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user ON webhook_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_enabled ON webhook_endpoints(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user ON webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_post ON webhook_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_sent_at ON webhook_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_success ON webhook_logs(success);

-- 4. RLS Policies
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Webhook endpoints policies
CREATE POLICY "Users can view their own webhooks"
  ON webhook_endpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhooks"
  ON webhook_endpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
  ON webhook_endpoints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
  ON webhook_endpoints FOR DELETE
  USING (auth.uid() = user_id);

-- Webhook logs policies
CREATE POLICY "Users can view their own webhook logs"
  ON webhook_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_endpoints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_endpoints_timestamp
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_endpoints_updated_at();

-- 6. Available Events Documentation
COMMENT ON TABLE webhook_endpoints IS 'User webhook endpoint configurations for notifications';
COMMENT ON TABLE webhook_logs IS 'History of all webhook calls with responses';

COMMENT ON COLUMN webhook_endpoints.events IS 'Available events: post.success, post.failed, post.scheduled, post.recycled, post.deleted, content.generated, analytics.insight';

-- 7. Helper view for webhook stats
CREATE OR REPLACE VIEW webhook_stats AS
SELECT 
  w.id,
  w.user_id,
  w.name,
  w.enabled,
  w.total_triggers,
  w.successful_triggers,
  w.failed_triggers,
  CASE 
    WHEN w.total_triggers > 0 THEN
      ROUND((w.successful_triggers::DECIMAL / w.total_triggers::DECIMAL) * 100, 2)
    ELSE 0
  END as success_rate,
  w.last_triggered_at,
  COUNT(DISTINCT wl.id) FILTER (WHERE wl.sent_at >= NOW() - INTERVAL '24 hours') as triggers_last_24h,
  COUNT(DISTINCT wl.id) FILTER (WHERE wl.sent_at >= NOW() - INTERVAL '7 days') as triggers_last_7d
FROM webhook_endpoints w
LEFT JOIN webhook_logs wl ON w.id = wl.webhook_id
GROUP BY w.id, w.user_id, w.name, w.enabled, w.total_triggers, w.successful_triggers, w.failed_triggers, w.last_triggered_at;

COMMENT ON VIEW webhook_stats IS 'Webhook statistics with recent activity';

