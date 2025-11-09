import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import RoleBadge from '../components/RoleBadge';
import { toast } from 'react-hot-toast';

export default function Approvals() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts/pending-approvals');
      if (response.data.success) {
        setPendingApprovals(response.data.approvals || []);
      }
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      // Check if it's a permission error (403)
      if (error.response?.status === 403) {
        console.log('ℹ️ User does not have permission to view approvals (Editor/Viewer role)');
        setPendingApprovals([]);
      } else {
        toast.error('Failed to load pending approvals');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    if (!confirm('Approve this post?')) return;

    setActionLoading(true);
    try {
      const response = await api.post(`/posts/${postId}/approve`);
      if (response.data.success) {
        toast.success('Post approved!');
        setShowPreview(false);
        setSelectedPost(null);
        loadPendingApprovals();
      }
    } catch (error) {
      console.error('Failed to approve post:', error);
      toast.error(error.response?.data?.error || 'Failed to approve post');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (postId) => {
    if (!feedback || feedback.trim().length < 3) {
      toast.error('Please provide feedback before rejecting');
      return;
    }

    if (!confirm('Reject this post? The creator will be notified with your feedback.')) return;

    setActionLoading(true);
    try {
      const response = await api.post(`/posts/${postId}/reject`, { feedback });
      if (response.data.success) {
        toast.success('Post rejected');
        setShowPreview(false);
        setSelectedPost(null);
        setFeedback('');
        loadPendingApprovals();
      }
    } catch (error) {
      console.error('Failed to reject post:', error);
      toast.error(error.response?.data?.error || 'Failed to reject post');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async (postId) => {
    if (!feedback || feedback.trim().length < 5) {
      toast.error('Please provide specific feedback for changes');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.post(`/posts/${postId}/request-changes`, { feedback });
      if (response.data.success) {
        toast.success('Changes requested');
        setShowPreview(false);
        setSelectedPost(null);
        setFeedback('');
        loadPendingApprovals();
      }
    } catch (error) {
      console.error('Failed to request changes:', error);
      toast.error(error.response?.data?.error || 'Failed to request changes');
    } finally {
      setActionLoading(false);
    }
  };

  const openPreview = (approval) => {
    setSelectedPost(approval);
    setFeedback('');
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedPost(null);
    setFeedback('');
  };

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
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            Post Approvals
          </h1>
          <p className="text-gray-400">
            {pendingApprovals.length} {pendingApprovals.length === 1 ? 'post' : 'posts'} awaiting your review
          </p>
        </div>

        {/* Empty State */}
        {pendingApprovals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-xl border-2 border-gray-700/50 rounded-2xl p-12 text-center"
          >
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Clear!</h2>
            <p className="text-gray-400">No posts pending approval</p>
          </motion.div>
        ) : (
          /* Approval Cards Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingApprovals.map((approval, index) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                index={index}
                onPreview={() => openPreview(approval)}
              />
            ))}
          </div>
        )}

        {/* Preview Modal */}
        <PreviewModal
          show={showPreview}
          approval={selectedPost}
          feedback={feedback}
          setFeedback={setFeedback}
          onClose={closePreview}
          onApprove={() => handleApprove(selectedPost?.post_id)}
          onReject={() => handleReject(selectedPost?.post_id)}
          onRequestChanges={() => handleRequestChanges(selectedPost?.post_id)}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
}

// Approval Card Component
function ApprovalCard({ approval, index, onPreview }) {
  const post = approval.post;
  const submitter = approval.submitter;
  const platforms = typeof post.platforms === 'string' ? JSON.parse(post.platforms) : post.platforms;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-800/50 backdrop-blur-xl border-2 border-yellow-500/30 rounded-xl p-6 shadow-xl hover:border-yellow-500/60 transition-all cursor-pointer"
      onClick={onPreview}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-bold">
            {submitter.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-semibold">{submitter.name}</p>
            <p className="text-gray-400 text-xs">{submitter.email}</p>
          </div>
        </div>
        <div className="bg-yellow-500/20 px-3 py-1 rounded-full">
          <span className="text-yellow-300 text-xs font-bold">⏳ PENDING</span>
        </div>
      </div>

      {/* Caption Preview */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-4">
          {post.text || 'No caption'}
        </p>
      </div>

      {/* Platforms */}
      <div className="flex flex-wrap gap-2 mb-4">
        {platforms && platforms.map((platform) => (
          <span
            key={platform}
            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30"
          >
            {platform.toUpperCase()}
          </span>
        ))}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Submitted {formatTimestamp(new Date(approval.submitted_at))}
        </span>
        <span className="text-purple-400 font-semibold">Click to review →</span>
      </div>
    </motion.div>
  );
}

// Preview Modal Component
function PreviewModal({
  show,
  approval,
  feedback,
  setFeedback,
  onClose,
  onApprove,
  onReject,
  onRequestChanges,
  actionLoading
}) {
  if (!show || !approval) return null;

  const post = approval.post;
  const submitter = approval.submitter;
  const platforms = typeof post.platforms === 'string' ? JSON.parse(post.platforms) : post.platforms;
  const variations = post.variations ? (typeof post.variations === 'string' ? JSON.parse(post.variations) : post.variations) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 border-2 border-purple-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Post</h2>
              <p className="text-purple-100 text-sm mt-1">
                Submitted by {submitter.name} • {formatTimestamp(new Date(approval.submitted_at))}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-900 dark:text-white hover:bg-white/10 rounded-lg p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Platforms */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-2">PLATFORMS</h3>
              <div className="flex flex-wrap gap-2">
                {platforms && platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-300 text-sm font-semibold rounded-lg border border-blue-500/30"
                  >
                    {platform.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-2">CAPTION</h3>
              <div className="bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{post.text || 'No caption'}</p>
              </div>
            </div>

            {/* Variations (if any) */}
            {variations && Object.keys(variations).length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-2">PLATFORM-SPECIFIC VARIATIONS</h3>
                <div className="space-y-3">
                  {Object.entries(variations).map(([platform, text]) => (
                    <div key={platform} className="bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded">
                          {platform.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Time */}
            {post.schedule_time && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-2">SCHEDULED FOR</h3>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <p className="text-purple-300 font-semibold">
                    📅 {new Date(post.schedule_time).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Feedback Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-2">FEEDBACK (Optional for approval, required for rejection/changes)</h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add feedback for the creator..."
                rows={4}
                className="w-full bg-gray-900/50 border-2 border-gray-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <motion.button
                onClick={onApprove}
                disabled={actionLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-gray-900 dark:text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : '✅ Approve Post'}
              </motion.button>

              <motion.button
                onClick={onRequestChanges}
                disabled={actionLoading || !feedback}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-gray-900 dark:text-white font-bold rounded-lg shadow-lg hover:shadow-yellow-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : '⚠️ Request Changes'}
              </motion.button>

              <motion.button
                onClick={onReject}
                disabled={actionLoading || !feedback}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-gray-900 dark:text-white font-bold rounded-lg shadow-lg hover:shadow-red-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : '❌ Reject Post'}
              </motion.button>
            </div>

            <p className="text-gray-500 text-xs text-center mt-4">
              * Feedback is required when rejecting or requesting changes
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper function
function formatTimestamp(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
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

