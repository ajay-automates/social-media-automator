
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import { NoActivityEmpty } from '../components/ui/EmptyState';
import { toast } from 'react-hot-toast';

export default function Team() {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members'); // members, activity
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite modal state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading team data...');

      // Load workspace info
      const workspaceRes = await api.get('/workspace/info').catch(err => {
        console.error('❌ Workspace API failed:', err.response?.data || err.message);
        return null;
      });

      if (workspaceRes?.data?.success) {
        console.log('✅ Workspace loaded:', workspaceRes.data.workspace);
        setWorkspace(workspaceRes.data.workspace);
      } else {
        console.warn('⚠️ Workspace not loaded, might not be initialized yet');
        setWorkspace({ role: 'editor', workspace_name: 'Your Workspace' });
      }

      // Load team members
      const membersRes = await api.get('/team/members').catch(err => {
        console.error('❌ Members API failed:', err.response?.data || err.message);
        return null;
      });

      if (membersRes?.data?.success) {
        console.log('✅ Team members loaded:', membersRes.data.members.length);
        setMembers(membersRes.data.members || []);
      }

      // Load invitations ONLY if user is Owner/Admin
      if (workspaceRes?.data?.workspace?.role === 'owner' || workspaceRes?.data?.workspace?.role === 'admin') {
        const invitationsRes = await api.get('/team/invitations').catch(err => {
          console.log('ℹ️ Invitations not loaded:', err.response?.status);
          return { data: { invitations: [] } };
        });

        setInvitations(invitationsRes.data?.invitations || []);
      } else {
        console.log('ℹ️ Skipping invitations - user is not Owner/Admin');
        setInvitations([]);
      }

      // Load activity feed
      const activityRes = await api.get('/activity?limit=50').catch(err => {
        console.error('❌ Activity API failed:', err.response?.data || err.message);
        return null;
      });

      if (activityRes?.data?.success) {
        console.log('✅ Activity feed loaded:', activityRes.data.activities.length);
        setActivities(activityRes.data.activities || []);
      }

      console.log('✅ Team data loading complete!');
    } catch (error) {
      console.error('❌ Fatal error loading team data:', error);
      // Don't show error toast - page still works
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRole) {
      toast.error('Please enter email and select a role');
      return;
    }

    setInviting(true);
    try {
      const response = await api.post('/team/invite', {
        email: inviteEmail,
        role: inviteRole
      });

      if (response.data.success) {
        toast.success(`Invitation sent to ${inviteEmail} `);
        setInviteEmail('');
        setInviteRole('editor');
        setShowInviteModal(false);
        loadTeamData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team ? `)) {
      return;
    }

    try {
      const response = await api.delete(`/ team / members / ${userId} `);
      if (response.data.success) {
        toast.success(`${memberName} removed from team`);
        loadTeamData();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleChangeRole = async (userId, newRole, memberName) => {
    try {
      const response = await api.put(`/ team / members / ${userId}/role`, { role: newRole });
      if (response.data.success) {
        toast.success(`${memberName}'s role updated to ${newRole}`);
        loadTeamData();
      }
    } catch (error) {
      console.error('Failed to change role:', error);
      toast.error(error.response?.data?.error || 'Failed to change role');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      const response = await api.delete(`/team/invitations/${invitationId}`);
      if (response.data.success) {
        toast.success('Invitation cancelled');
        loadTeamData();
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      const response = await api.post(`/team/invitations/${invitationId}/resend`);
      if (response.data.success) {
        toast.success('Invitation resent');
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const isOwner = workspace?.role === 'owner';
  const canInvite = workspace?.role === 'owner' || workspace?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                Team Management
              </h1>
              <p className="text-gray-400">
                {workspace?.workspace_name || 'Your Workspace'} • {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
            </div>

            {canInvite && (
              <motion.button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + Invite Team Member
              </motion.button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 px-4 font-semibold transition-colors ${activeTab === 'members'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            Team Members ({members.length})
          </button>
          {/* Only show invitations tab for Owner/Admin */}
          {canInvite && invitations.length > 0 && (
            <button
              onClick={() => setActiveTab('invitations')}
              className={`pb-3 px-4 font-semibold transition-colors relative ${activeTab === 'invitations'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Pending Invitations ({invitations.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-4 font-semibold transition-colors ${activeTab === 'activity'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            Activity Feed
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isOwner={isOwner}
                    currentUserRole={workspace?.role}
                    onRemove={() => handleRemoveMember(member.user_id, member.name)}
                    onChangeRole={(newRole) => handleChangeRole(member.user_id, newRole, member.name)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'invitations' && (
            <motion.div
              key="invitations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {invitations.map((invitation) => (
                  <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    onCancel={() => handleCancelInvitation(invitation.id)}
                    onResend={() => handleResendInvitation(invitation.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ActivityFeed activities={activities} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invite Modal */}
        <InviteModal
          show={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteRole={inviteRole}
          setInviteRole={setInviteRole}
          onSubmit={handleInviteMember}
          inviting={inviting}
        />
      </div>
    </div>
  );
}

// Member Card Component
function MemberCard({ member, isOwner, currentUserRole, onRemove, onChangeRole }) {
  const [changingRole, setChangingRole] = useState(false);

  const canRemove = isOwner && member.role !== 'owner';
  const canChangeRole = isOwner && member.role !== 'owner';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800/50 backdrop-blur-xl border-2 border-gray-700/50 rounded-xl p-6 shadow-xl hover:border-purple-500/50 transition-all"
    >
      {/* Avatar & Name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
          {member.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{member.name || 'Unknown'}</h3>
          <p className="text-gray-400 text-sm break-all">{member.email}</p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mb-4">
        <RoleBadge role={member.role} />
      </div>

      {/* Joined Date */}
      <p className="text-gray-500 text-xs mb-4">
        Joined {new Date(member.joined_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        {canChangeRole && (
          <select
            value={member.role}
            onChange={(e) => {
              setChangingRole(true);
              onChangeRole(e.target.value);
              setTimeout(() => setChangingRole(false), 1000);
            }}
            disabled={changingRole}
            className="flex-1 bg-gray-700/50 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 transition disabled:opacity-50"
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        )}

        {canRemove && (
          <button
            onClick={onRemove}
            className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-600/30 transition text-sm font-semibold"
          >
            Remove
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Invitation Card Component
function InvitationCard({ invitation, onCancel, onResend }) {
  const daysLeft = Math.ceil((new Date(invitation.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
  const [showToken, setShowToken] = useState(false);
  const inviteUrl = `${window.location.origin}/accept-invite?token=${invitation.token}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800/50 backdrop-blur-xl border-2 border-yellow-500/30 rounded-xl p-6 shadow-xl"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
          📧
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold">{invitation.email}</h3>
          <div className="mt-2">
            <RoleBadge role={invitation.role} size="sm" />
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
        <p className="text-yellow-300 text-sm">
          ⏳ Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
        </p>
      </div>

      {/* Show Invitation URL for local testing */}
      <div className="mb-4">
        <button
          onClick={() => setShowToken(!showToken)}
          className="text-xs text-blue-400 hover:text-blue-300 transition"
        >
          {showToken ? '🔒 Hide' : '🔗 Show'} Invitation Link
        </button>
        {showToken && (
          <div className="mt-2 bg-gray-900/50 border border-gray-700 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-2">Copy this URL and send to the invitee:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="flex-1 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600"
              />
              <button
                onClick={() => copyToClipboard(inviteUrl)}
                className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs rounded hover:bg-blue-600/30 transition"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onResend}
          className="flex-1 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/50 rounded-lg hover:bg-purple-600/30 transition text-sm font-semibold"
        >
          Resend
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-600/30 transition text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// Activity Feed Component
function ActivityFeed({ activities }) {
  if (activities.length === 0) {
    return <NoActivityEmpty />;
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border-2 border-gray-700/50 rounded-xl overflow-hidden">
      <div className="divide-y divide-gray-700/50">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                {getActivityIcon(activity.action)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">
                  {activity.formatted || activity.action}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {formatTimestamp(new Date(activity.created_at))}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Invite Modal Component
function InviteModal({ show, onClose, inviteEmail, setInviteEmail, inviteRole, setInviteRole, onSubmit, inviting }) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 border-2 border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Invite Team Member
          </h2>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-gray-700/50 border-2 border-gray-600 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                required
              />
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-gray-700/50 border-2 border-gray-600 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 transition"
              >
                <option value="admin">Admin - Can manage team and approve posts</option>
                <option value="editor">Editor - Can create posts that require approval</option>
                <option value="viewer">Viewer - Read-only access</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                disabled={inviting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition font-semibold disabled:opacity-50"
                disabled={inviting}
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper functions
function getActivityIcon(action) {
  const icons = {
    invited_member: '📧',
    member_joined: '👋',
    member_removed: '👋',
    role_changed: '🔄',
    post_created: '✏️',
    post_submitted: '📝',
    post_approved: '✅',
    post_rejected: '❌',
    post_published: '🚀',
    post_scheduled: '📅',
    post_deleted: '🗑️',
    workspace_renamed: '✨'
  };
  return icons[action] || '📌';
}

function formatTimestamp(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

