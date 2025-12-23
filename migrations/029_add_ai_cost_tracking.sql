-- Migration: Add AI Cost Tracking Table
-- Tracks API costs to enforce spending limits

CREATE TABLE IF NOT EXISTS ai_cost_tracking (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT, -- e.g., 'caption_generation', 'calendar_generation', 'auto_fill'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date queries
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_date ON ai_cost_tracking(date);
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_user_id ON ai_cost_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_date_user ON ai_cost_tracking(date, user_id);

-- Enable RLS
ALTER TABLE ai_cost_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own cost records
CREATE POLICY "Users can view their own cost tracking"
  ON ai_cost_tracking FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Service role can insert/update (for backend tracking)
-- Note: Service role bypasses RLS by default, but explicit policy is good practice

DO $$
BEGIN
  RAISE NOTICE '✅ AI cost tracking table created with indexes and RLS policies.';
END $$;

