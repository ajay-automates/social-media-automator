import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showError } from './ui/Toast';

export default function MilestoneChecklist() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedAnimations, setCompletedAnimations] = useState({});

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const response = await api.get('/milestones/progress');
      if (response.data.success) {
        setProgress(response.data.progress);
      }
    } catch (err) {
      console.error('Error loading milestone progress:', err);
      showError('Failed to load milestone progress');
    } finally {
      setLoading(false);
    }
  };

  // Define milestones
  const milestones = [
    {
      id: 'email_verified',
      title: 'Verify Email',
      description: 'Confirm your email address',
      emoji: '✉️',
      icon: '✓',
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'first_account_connected',
      title: 'Connect First Account',
      description: 'Link your first social media account',
      emoji: '🔗',
      icon: '✓',
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'first_post_created',
      title: 'Publish First Post',
      description: 'Create and publish your first post',
      emoji: '🚀',
      icon: '✓',
      color: 'from-purple-400 to-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="mb-8 relative z-10">
        <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-gray-700/50 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-700/50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const completedCount = milestones.filter(m => progress[m.id] === 1).length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);
  const allCompleted = progressPercent === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 relative z-10"
    >
      <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎯</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Onboarding Checklist</h2>
              <p className="text-sm text-gray-300 mt-1">Complete these steps to get the most out of Social Media Automator</p>
            </div>
          </div>
          {allCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="text-5xl mb-2">🎉</div>
              <p className="text-sm font-semibold text-green-400">All Set!</p>
            </motion.div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-300">Progress</p>
            <p className="text-sm font-bold text-blue-400">{progressPercent}%</p>
          </div>
          <div className="w-full bg-gray-800/50 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-3">
          {milestones.map((milestone, index) => {
            const isCompleted = progress[milestone.id] === 1;
            const completedAt = progress[`${milestone.id}_at`];

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${isCompleted
                    ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/50'
                    : 'bg-white/5 border-white/10 group-hover:border-white/20'
                  }
                `}>
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCompleted ? 1 : 0.9,
                        rotate: isCompleted ? 360 : 0
                      }}
                      transition={{ duration: 0.4 }}
                      className={`
                        flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-lg
                        ${isCompleted
                          ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-500'
                          : 'border-white/30 group-hover:border-white/50'
                        }
                      `}
                    >
                      {isCompleted ? '✓' : <span className="text-white/30">·</span>}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`
                          text-base font-semibold
                          ${isCompleted ? 'text-green-400' : 'text-white'}
                        `}>
                          {milestone.title}
                        </h3>
                        <span className="text-lg">{milestone.emoji}</span>
                      </div>
                      <p className="text-sm text-gray-400">{milestone.description}</p>
                      {isCompleted && completedAt && (
                        <p className="text-xs text-green-400 mt-2">
                          ✓ Completed on {new Date(completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0 text-2xl">
                      {isCompleted ? '✨' : '→'}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Completion Message */}
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg text-center"
          >
            <p className="text-green-400 font-semibold mb-2">🎊 You're All Set!</p>
            <p className="text-sm text-gray-300">
              You've completed all the essential steps. Now start creating amazing content and watch your social media grow!
            </p>
          </motion.div>
        )}

        {/* Help Text */}
        {!allCompleted && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-sm text-gray-400 text-center"
          >
            Complete your onboarding journey to unlock all features
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
