-- Migration: Add Team Collaboration System
-- Description: Enable multi-user workspaces with role-based permissions and approval workflows

-- Workspaces table (one per account)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table (users belonging to workspaces)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Post approvals table (for approval workflow)
CREATE TABLE IF NOT EXISTS post_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id INTEGER NOT NULL,
  submitted_by UUID NOT NULL,
  reviewed_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table (track all team actions)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invitations table (email invitations to join workspace)
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);

-- Create queue table if it doesn't exist (for scheduled posts)
CREATE TABLE IF NOT EXISTS queue (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  platforms TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  schedule_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'posted', 'failed')),
  posted_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  variations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add workspace and approval columns to queue table
ALTER TABLE queue ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('draft', 'pending_review', 'approved', 'rejected'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_workspace ON team_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_post_approvals_status ON post_approvals(status);
CREATE INDEX IF NOT EXISTS idx_post_approvals_post ON post_approvals(post_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_workspace ON activity_log(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace ON team_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_queue_workspace ON queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_queue_created_by ON queue(created_by);
CREATE INDEX IF NOT EXISTS idx_queue_approval_status ON queue(approval_status);

-- Auto-create workspaces for all existing users
INSERT INTO workspaces (owner_id, name)
SELECT 
  id,
  COALESCE(email, 'My Workspace') || '''s Workspace'
FROM auth.users
WHERE id NOT IN (SELECT owner_id FROM workspaces);

-- Auto-add owners as team members
INSERT INTO team_members (workspace_id, user_id, role, status, joined_at)
SELECT w.id, w.owner_id, 'owner', 'active', NOW()
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.workspace_id = w.id AND tm.user_id = w.owner_id
);

-- Comment for future reference
COMMENT ON TABLE workspaces IS 'User workspaces for team collaboration';
COMMENT ON TABLE team_members IS 'Team members with role-based permissions';
COMMENT ON TABLE post_approvals IS 'Post approval workflow tracking';
COMMENT ON TABLE activity_log IS 'Audit log of all team actions';
COMMENT ON TABLE team_invitations IS 'Pending email invitations to join workspace';

