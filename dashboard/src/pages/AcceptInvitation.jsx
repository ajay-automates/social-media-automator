import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) setError('Invalid invitation link');
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!token) { setError('Invalid invitation token'); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/team/accept-invite', { token });
      if (response.data.success) {
        setSuccess(true);
        toast.success('Successfully joined workspace!');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to accept invitation';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111113] border border-white/[0.06] rounded-2xl max-w-md w-full p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" fill="none" stroke="#22d3ee" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl text-white mb-1">Team Invitation</h1>
          <p className="text-sm text-[#a1a1aa]">You've been invited to collaborate</p>
        </div>

        {success ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center mx-auto">
              <svg width="20" height="20" fill="none" stroke="#22d3ee" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Welcome to the team!</h2>
            <p className="text-sm text-[#a1a1aa]">You've joined the workspace. Redirecting to dashboard...</p>
            <div className="flex justify-center gap-1.5 pt-1">
              {[0, 150, 300].map((delay) => (
                <div key={delay} className="w-1.5 h-1.5 bg-[#22d3ee] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }}/>
              ))}
            </div>
          </motion.div>
        ) : error ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-500/[0.06] border border-red-500/20 rounded-xl">
              <svg width="16" height="16" fill="none" stroke="#f87171" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-red-400 mb-2">{error}</p>
                <ul className="text-xs text-[#52525b] space-y-1">
                  <li>· The invitation may have expired</li>
                  <li>· The invitation may have already been used</li>
                  <li>· You may need to log in first</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-white/[0.1] transition-colors"
            >
              Go to login
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="p-4 bg-[#18181b] border border-white/[0.06] rounded-xl text-sm text-[#a1a1aa] leading-relaxed">
              You've been invited to join a workspace on Social Media Automator. Click below to accept and start collaborating with your team.
            </div>
            <button
              onClick={handleAcceptInvitation}
              disabled={loading || !token}
              className="w-full bg-[#22d3ee] text-[#0a0a0b] font-semibold py-2.5 rounded-lg hover:bg-[#06b6d4] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3"/>
                    <path d="M21 12a9 9 0 00-9-9"/>
                  </svg>
                  Accepting...
                </>
              ) : 'Accept invitation'}
            </button>
            <p className="text-xs text-[#52525b] text-center">
              By accepting, you agree to collaborate on this workspace
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
