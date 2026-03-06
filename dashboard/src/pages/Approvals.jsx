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
      if (error.response?.status === 403) {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-white/[0.06] border-t-[#22d3ee] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white mb-1">Post Approvals</h1>
        <p className="text-sm text-[#a1a1aa]">
          {pendingApprovals.length} {pendingApprovals.length === 1 ? 'post' : 'posts'} awaiting your review
        </p>
      </div>

      {/* Empty State */}
      {pendingApprovals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111113] border border-white/[0.06] rounded-xl p-12 text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" fill="none" stroke="#22d3ee" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">All Clear</h2>
          <p className="text-sm text-[#a1a1aa]">No posts pending approval</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
  );
}

function ApprovalCard({ approval, index, onPreview }) {
  const post = approval.post;
  const submitter = approval.submitter;
  const platforms = typeof post.platforms === 'string' ? JSON.parse(post.platforms) : post.platforms;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-[#111113] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-colors cursor-pointer"
      onClick={onPreview}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs font-bold flex-shrink-0">
            {submitter.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm text-white font-medium">{submitter.name}</p>
            <p className="text-xs text-[#52525b]">{submitter.email}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          Pending
        </span>
      </div>

      <p className="text-sm text-[#a1a1aa] line-clamp-3 mb-4">{post.text || 'No caption'}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {platforms && platforms.map((platform) => (
          <span
            key={platform}
            className="px-2 py-0.5 bg-[#22d3ee]/10 text-[#22d3ee] text-[11px] font-semibold rounded-full border border-[#22d3ee]/20"
          >
            {platform.toUpperCase()}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-[#52525b]">
        <span>Submitted {formatTimestamp(new Date(approval.submitted_at))}</span>
        <span className="text-[#22d3ee]">Review →</span>
      </div>
    </motion.div>
  );
}

function PreviewModal({ show, approval, feedback, setFeedback, onClose, onApprove, onReject, onRequestChanges, actionLoading }) {
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
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#111113] border border-white/[0.08] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-[#111113] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="font-display text-xl text-white">Review Post</h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Submitted by {submitter.name} · {formatTimestamp(new Date(approval.submitted_at))}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Platforms */}
            <div>
              <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-2">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {platforms && platforms.map((platform) => (
                  <span key={platform} className="px-2.5 py-1 bg-[#22d3ee]/10 text-[#22d3ee] text-xs font-semibold rounded-lg border border-[#22d3ee]/20">
                    {platform.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-2">Caption</p>
              <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4">
                <p className="text-sm text-[#a1a1aa] whitespace-pre-wrap">{post.text || 'No caption'}</p>
              </div>
            </div>

            {/* Variations */}
            {variations && Object.keys(variations).length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-2">Platform Variations</p>
                <div className="space-y-3">
                  {Object.entries(variations).map(([platform, text]) => (
                    <div key={platform} className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4">
                      <span className="inline-flex items-center px-2 py-0.5 bg-[#22d3ee]/10 text-[#22d3ee] text-xs font-semibold rounded border border-[#22d3ee]/20 mb-2">
                        {platform.toUpperCase()}
                      </span>
                      <p className="text-sm text-[#a1a1aa] whitespace-pre-wrap">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Time */}
            {post.schedule_time && (
              <div>
                <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-2">Scheduled For</p>
                <div className="bg-[#18181b] border border-white/[0.06] rounded-lg px-4 py-3">
                  <p className="text-sm text-[#a1a1aa]">
                    {new Date(post.schedule_time).toLocaleString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long',
                      day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Feedback */}
            <div>
              <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-2">
                Feedback <span className="normal-case">(required for rejection/changes)</span>
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add feedback for the creator..."
                rows={4}
                className="w-full bg-[#18181b] border border-white/[0.06] text-white text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors resize-none placeholder:text-[#52525b]"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <button
                onClick={onApprove}
                disabled={actionLoading}
                className="px-4 py-3 bg-[#22d3ee] text-[#0a0a0b] font-semibold rounded-lg hover:bg-[#06b6d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {actionLoading ? 'Processing...' : 'Approve Post'}
              </button>
              <button
                onClick={onRequestChanges}
                disabled={actionLoading || !feedback}
                className="px-4 py-3 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-semibold rounded-lg hover:bg-yellow-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {actionLoading ? 'Processing...' : 'Request Changes'}
              </button>
              <button
                onClick={onReject}
                disabled={actionLoading || !feedback}
                className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {actionLoading ? 'Processing...' : 'Reject Post'}
              </button>
            </div>

            <p className="text-xs text-[#52525b] text-center">Feedback is required when rejecting or requesting changes</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function formatTimestamp(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
