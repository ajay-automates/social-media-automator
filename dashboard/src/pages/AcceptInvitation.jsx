import React, { useState, useEffect } from 'react';
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
    if (!token) {
      setError('Invalid invitation link');
    }
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!token) {
      setError('Invalid invitation token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/team/accept-invite', { token });
      
      if (response.data.success) {
        setSuccess(true);
        toast.success('Successfully joined workspace!');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      const errorMessage = error.response?.data?.error || 'Failed to accept invitation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800/50 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Team Invitation
          </h1>
        </div>

        {/* Success State */}
        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white">Welcome to the team!</h2>
            <p className="text-gray-400">
              You've successfully joined the workspace. Redirecting you to the dashboard...
            </p>
            <div className="flex items-center justify-center gap-2 text-purple-400">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </motion.div>
        ) : error ? (
          /* Error State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white">Invitation Error</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm">
                {error}
              </p>
            </div>
            <div className="space-y-2 text-gray-400 text-sm">
              <p>Possible reasons:</p>
              <ul className="list-disc list-inside text-left space-y-1">
                <li>This invitation has expired</li>
                <li>This invitation has already been used</li>
                <li>The invitation link is invalid</li>
                <li>You need to log in first</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:opacity-90 transition"
            >
              Go to Login
            </button>
          </motion.div>
        ) : (
          /* Initial State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <p className="text-gray-300 mb-2">
                You've been invited to join a workspace on Social Media Automator!
              </p>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mt-4">
                <p className="text-purple-300 text-sm">
                  Click the button below to accept the invitation and start collaborating with your team.
                </p>
              </div>
            </div>

            <button
              onClick={handleAcceptInvitation}
              disabled={loading || !token}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Accepting Invitation...</span>
                </div>
              ) : (
                'Accept Invitation'
              )}
            </button>

            <p className="text-gray-500 text-xs text-center">
              By accepting, you agree to collaborate with your team on this workspace
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

