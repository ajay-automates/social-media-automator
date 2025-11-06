const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Log a team activity action
 * @param {string} workspaceId - Workspace UUID
 * @param {string} userId - User UUID who performed the action
 * @param {string} action - Action type (e.g., 'invited_member', 'post_created')
 * @param {string} resourceType - Type of resource (e.g., 'post', 'member')
 * @param {string} resourceId - ID of the resource
 * @param {Object} details - Additional details as JSON
 */
async function logActivity(workspaceId, userId, action, resourceType = null, resourceId = null, details = {}) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId?.toString(),
        details
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
}

/**
 * Get activity feed for a workspace
 * @param {string} workspaceId - Workspace UUID
 * @param {number} limit - Number of items to return (default 50)
 * @returns {Promise<Array>} - Array of activity items with user info
 */
async function getActivityFeed(workspaceId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting activity feed:', error);
      return [];
    }

    // Get user details for each activity (could be optimized with a join)
    const activities = await Promise.all(
      (data || []).map(async (activity) => {
        // Get user info from auth.users
        const { data: userData } = await supabase.auth.admin.getUserById(activity.user_id);
        
        return {
          ...activity,
          user_email: userData?.user?.email || 'Unknown user',
          user_name: userData?.user?.user_metadata?.full_name || userData?.user?.email?.split('@')[0] || 'User'
        };
      })
    );

    return activities;
  } catch (error) {
    console.error('Failed to get activity feed:', error);
    return [];
  }
}

/**
 * Format activity for display
 * @param {Object} activity - Activity object
 * @returns {string} - Human-readable activity description
 */
function formatActivity(activity) {
  const { action, user_name, details, resource_type } = activity;

  const templates = {
    invited_member: `${user_name} invited ${details?.email} as ${details?.role}`,
    member_joined: `${user_name} joined the workspace`,
    member_removed: `${user_name} removed ${details?.removed_user} from the team`,
    role_changed: `${user_name} changed ${details?.target_user}'s role to ${details?.new_role}`,
    post_created: `${user_name} created post "${details?.post_title || 'Untitled'}"`,
    post_submitted: `${user_name} submitted "${details?.post_title || 'Untitled'}" for review`,
    post_approved: `${user_name} approved "${details?.post_title || 'Untitled'}"`,
    post_rejected: `${user_name} rejected "${details?.post_title || 'Untitled'}"`,
    post_published: `${user_name} posted "${details?.post_title || 'Untitled'}" to ${details?.platforms?.join(', ')}`,
    post_scheduled: `${user_name} scheduled "${details?.post_title || 'Untitled'}" for ${details?.schedule_time}`,
    post_deleted: `${user_name} deleted "${details?.post_title || 'Untitled'}"`,
    changes_requested: `${user_name} requested changes on "${details?.post_title || 'Untitled'}"`
  };

  return templates[action] || `${user_name} performed ${action}`;
}

/**
 * Get pending approvals count for a workspace
 */
async function getPendingApprovalsCount(workspaceId) {
  try {
    const { data, error } = await supabase
      .from('post_approvals')
      .select('id')
      .eq('status', 'pending')
      .limit(100);

    if (error) {
      console.error('Error getting pending approvals count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Failed to get pending approvals count:', error);
    return 0;
  }
}

module.exports = {
  logActivity,
  getActivityFeed,
  formatActivity,
  getPendingApprovalsCount
};

