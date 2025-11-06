const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Permission definitions
const PERMISSIONS = {
  create_post: ['owner', 'admin', 'editor'],
  post_now: ['owner', 'admin'], // Editors cannot post directly
  approve_post: ['owner', 'admin'],
  edit_any_post: ['owner', 'admin'],
  edit_own_post: ['owner', 'admin', 'editor'],
  delete_any_post: ['owner', 'admin'],
  delete_own_post: ['owner', 'admin', 'editor'],
  invite_member: ['owner', 'admin'],
  remove_member: ['owner'], // Only owner can remove members
  change_role: ['owner'], // Only owner can change roles
  manage_accounts: ['owner', 'admin'],
  view_analytics: ['owner', 'admin', 'editor', 'viewer'],
  bulk_upload: ['owner', 'admin', 'editor']
};

/**
 * Get user's workspace and role
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - { workspace_id, role, workspace_name, workspace }
 */
async function getUserWorkspace(userId) {
  try {
    // Get ALL workspaces the user is a member of
    const { data: memberships, error } = await supabase
      .from('team_members')
      .select(`
        workspace_id,
        role,
        status,
        joined_at,
        workspaces (
          id,
          name,
          owner_id
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false }); // Most recent first

    if (error || !memberships || memberships.length === 0) {
      console.error('getUserWorkspace error:', error);
      return null;
    }

    // If user is a member of multiple workspaces, prioritize:
    // 1. Workspace where they're NOT the owner (their team workspace)
    // 2. Most recently joined workspace
    // 3. First workspace (fallback)
    
    let selectedMembership = memberships[0]; // Default to most recent
    
    if (memberships.length > 1) {
      // Find workspace where user is NOT the owner (invited workspace)
      const invitedWorkspace = memberships.find(m => m.workspaces.owner_id !== userId);
      if (invitedWorkspace) {
        selectedMembership = invitedWorkspace;
        console.log(`👥 User ${userId} is member of ${memberships.length} workspaces, using invited workspace`);
      }
    }

    return {
      workspace_id: selectedMembership.workspace_id,
      role: selectedMembership.role,
      workspace_name: selectedMembership.workspaces.name,
      workspace: selectedMembership.workspaces,
      is_owner: selectedMembership.workspaces.owner_id === userId
    };
  } catch (error) {
    console.error('Error getting user workspace:', error);
    return null;
  }
}

/**
 * Check if user has permission for an action
 * @param {string} userId - User ID
 * @param {string} action - Action to check (e.g., 'create_post', 'post_now')
 * @param {string} resourceOwnerId - Optional: ID of resource owner (for own vs any checks)
 * @returns {Promise<boolean>} - True if user has permission
 */
async function checkPermission(userId, action, resourceOwnerId = null) {
  try {
    const workspace = await getUserWorkspace(userId);
    
    if (!workspace) {
      return false;
    }

    const { role } = workspace;

    // Handle "own" vs "any" permissions
    if (action.includes('own') && resourceOwnerId) {
      // Check if user is the resource owner
      const isOwner = resourceOwnerId === userId;
      if (!isOwner) {
        // Not the owner, so check if they have "any" permission
        const anyAction = action.replace('own', 'any');
        return PERMISSIONS[anyAction]?.includes(role) || false;
      }
    }

    // Check if role has permission for this action
    return PERMISSIONS[action]?.includes(role) || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Express middleware to require minimum role
 * @param {string} minRole - Minimum required role ('owner', 'admin', 'editor', 'viewer')
 */
function requireRole(minRole) {
  const roleHierarchy = {
    viewer: 1,
    editor: 2,
    admin: 3,
    owner: 4
  };

  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const workspace = await getUserWorkspace(userId);
      
      if (!workspace) {
        return res.status(403).json({
          success: false,
          error: 'No workspace access'
        });
      }

      const userRoleLevel = roleHierarchy[workspace.role] || 0;
      const requiredLevel = roleHierarchy[minRole] || 0;

      if (userRoleLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          error: `Requires ${minRole} role or higher`,
          currentRole: workspace.role
        });
      }

      // Attach workspace info to request for downstream use
      req.workspace = workspace;
      req.userRole = workspace.role;

      next();
    } catch (error) {
      console.error('requireRole middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
}

/**
 * Check if user has specific permission
 * Express middleware for granular permission checking
 */
function requirePermission(action) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const hasAccess = await checkPermission(userId, action);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: ${action}`
        });
      }

      next();
    } catch (error) {
      console.error('requirePermission middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
}

/**
 * Get all team members for a workspace
 */
async function getTeamMembers(workspaceId) {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting team members:', error);
    return [];
  }
}

module.exports = {
  getUserWorkspace,
  checkPermission,
  requireRole,
  requirePermission,
  getTeamMembers,
  PERMISSIONS
};

