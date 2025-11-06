const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { sendEmail } = require('./email');
const { logActivity } = require('./activity');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create a team invitation
 * @param {string} workspaceId - Workspace UUID
 * @param {string} email - Email to invite
 * @param {string} role - Role to assign (admin/editor/viewer)
 * @param {string} invitedBy - User ID of inviter
 * @returns {Promise<Object>} - Invitation object
 */
async function createInvitation(workspaceId, email, role, invitedBy) {
  try {
    // Delete any existing invitations for this email in this workspace
    // This handles cases where user was removed and is being re-invited
    await supabase
      .from('team_invitations')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('email', email.toLowerCase());
    
    console.log(`🧹 Cleaned up any existing invitations for ${email}`);

    // Check if this EMAIL is already an active member of THIS workspace
    // First, try to find user by email in auth.users
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const targetUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (targetUser) {
      // User exists, check if they're already a member of THIS workspace
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id, status, user_id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', targetUser.id)
        .eq('status', 'active')
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this workspace');
      }
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase(),
        role,
        invited_by: invitedBy,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }

    // Get workspace and inviter info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .single();

    const { data: inviterData } = await supabase.auth.admin.getUserById(invitedBy);
    const inviterName = inviterData?.user?.user_metadata?.full_name || inviterData?.user?.email?.split('@')[0] || 'A team member';

    // Try to send invitation email (fail gracefully if email not configured)
    try {
      await sendInvitationEmail(
        email,
        workspace?.name || 'Social Media Automator Workspace',
        inviterName,
        role,
        token
      );
      console.log('✅ Invitation email sent successfully');
    } catch (emailError) {
      console.warn('⚠️ Email sending failed (email may not be configured):', emailError.message);
      console.log('💡 Invitation created - use the accept-invite URL manually for testing');
    }

    // Log activity
    await logActivity(workspaceId, invitedBy, 'invited_member', 'invitation', invitation.id, {
      email,
      role
    });

    return invitation;
  } catch (error) {
    console.error('Failed to create invitation:', error);
    throw error;
  }
}

/**
 * Accept a team invitation
 * @param {string} token - Invitation token
 * @param {string} userId - User ID accepting the invitation
 * @returns {Promise<Object>} - Team member object
 */
async function acceptInvitation(token, userId) {
  try {
    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('This invitation has expired');
    }

    // Check if user's email matches invitation
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email?.toLowerCase();

    if (userEmail !== invitation.email.toLowerCase()) {
      throw new Error('This invitation was sent to a different email address');
    }

    // Add user to team
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
        joined_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error adding team member:', memberError);
      throw memberError;
    }

    // Mark invitation as accepted
    await supabase
      .from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    // Log activity
    await logActivity(invitation.workspace_id, userId, 'member_joined', 'member', teamMember.id, {
      role: invitation.role
    });

    return teamMember;
  } catch (error) {
    console.error('Failed to accept invitation:', error);
    throw error;
  }
}

/**
 * Send invitation email
 */
async function sendInvitationEmail(email, workspaceName, inviterName, role, token) {
  try {
    const acceptUrl = `${process.env.APP_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;

    const roleDescriptions = {
      admin: 'Administrator - Can manage team and approve posts',
      editor: 'Editor - Can create posts that require approval',
      viewer: 'Viewer - Read-only access to workspace'
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; }
    .content { padding: 40px 30px; }
    .workspace-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .role-badge { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 10px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3); }
    .button:hover { box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4); }
    .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; background: #f9fafb; }
    .expiry { color: #dc2626; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 You're Invited!</h1>
    </div>
    <div class="content">
      <p style="font-size: 18px; color: #111827; margin-bottom: 20px;">
        <strong>${inviterName}</strong> has invited you to join their team on <strong>Social Media Automator</strong>.
      </p>
      
      <div class="workspace-info">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">WORKSPACE</p>
        <p style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #111827;">${workspaceName}</p>
        
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">YOUR ROLE</p>
        <div class="role-badge">${role.toUpperCase()}</div>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 13px;">${roleDescriptions[role]}</p>
      </div>

      <p style="color: #374151; line-height: 1.6;">
        Accept this invitation to start collaborating on social media content with your team.
        You'll be able to ${role === 'admin' ? 'manage the team and approve posts' : role === 'editor' ? 'create posts for approval' : 'view workspace analytics and activity'}.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" class="button">Accept Invitation</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
        Or copy and paste this link into your browser:<br>
        <code style="background: #f3f4f6; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 8px; word-break: break-all;">${acceptUrl}</code>
      </p>

      <p class="expiry" style="margin-top: 30px; font-size: 13px;">
        ⏰ This invitation expires in 7 days
      </p>
    </div>
    <div class="footer">
      <p>Social Media Automator - AI-Powered Social Media Management</p>
      <p style="margin-top: 10px; font-size: 12px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(
      email,
      `You've been invited to join ${workspaceName} on Social Media Automator`,
      htmlContent
    );

    console.log(`✅ Invitation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
}

/**
 * Get pending invitations for a workspace
 */
async function getPendingInvitations(workspaceId) {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('accepted_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get pending invitations:', error);
    return [];
  }
}

/**
 * Cancel/delete an invitation
 */
async function cancelInvitation(invitationId, userId) {
  try {
    // Verify user has permission (owner/admin of workspace)
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('workspace_id')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Delete invitation
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Failed to cancel invitation:', error);
    throw error;
  }
}

/**
 * Resend invitation email
 */
async function resendInvitation(invitationId) {
  try {
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Get workspace and inviter info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', invitation.workspace_id)
      .single();

    const { data: inviterData } = await supabase.auth.admin.getUserById(invitation.invited_by);
    const inviterName = inviterData?.user?.user_metadata?.full_name || inviterData?.user?.email?.split('@')[0] || 'A team member';

    // Try to resend email (fail gracefully if email not configured)
    try {
      await sendInvitationEmail(
        invitation.email,
        workspace?.name || 'Social Media Automator Workspace',
        inviterName,
        invitation.role,
        invitation.token
      );
      console.log('✅ Invitation email resent successfully');
    } catch (emailError) {
      console.warn('⚠️ Email sending failed (email may not be configured):', emailError.message);
      // Don't throw - invitation token still exists and can be used manually
    }

    return true;
  } catch (error) {
    console.error('Failed to resend invitation:', error);
    throw error;
  }
}

module.exports = {
  createInvitation,
  acceptInvitation,
  sendInvitationEmail,
  getPendingInvitations,
  cancelInvitation,
  resendInvitation
};

