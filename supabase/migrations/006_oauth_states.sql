-- Create OAuth states table for PKCE persistence
CREATE TABLE IF NOT EXISTS oauth_states (
  id SERIAL PRIMARY KEY,
  state VARCHAR(500) UNIQUE NOT NULL,
  code_verifier TEXT NOT NULL,
  user_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oauth_states_state ON oauth_states(state);
CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);
