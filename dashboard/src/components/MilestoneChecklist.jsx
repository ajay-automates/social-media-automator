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
      } else {
        // Set default progress if endpoint doesn't return success
        setProgress({
          email_verified: 0,
          first_account_connected: 0,
          first_post_created: 0,
          post_milestones: 0,
          onboarding_completed: 0,
          email_verified_at: null,
          first_account_at: null,
          first_post_at: null,
          onboarding_completed_at: null,
          onboarding_progress_percent: 0
        });
      }
    } catch (err) {
      console.error('Error loading milestone progress:', err);
      // Don't show error - just silently set default progress
      // This handles cases where the database hasn't been migrated yet
      setProgress({
        email_verified: 0,
        first_account_connected: 0,
        first_post_created: 0,
        post_milestones: 0,
        onboarding_completed: 0,
        email_verified_at: null,
        first_account_at: null,
        first_post_at: null,
        onboarding_completed_at: null,
        onboarding_progress_percent: 0
      });
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
      color: 'bg-[#22d3ee]'
    },
    {
      id: 'first_account_connected',
      title: 'Connect First Account',
      description: 'Link your first social media account',
      emoji: '🔗',
      icon: '✓',
      color: ''
    },
    {
      id: 'first_post_created',
      title: 'Publish First Post',
      description: 'Create and publish your first post',
      emoji: '🚀',
      icon: '✓',
      color: 'bg-[#22d3ee]'
    }
  ];

  if (loading) {
    return (
      <div className="mb-8 relative z-10">
        <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-[#18181b] rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-[#18181b] rounded"></div>
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
      <div className="bg-[#0a0a0b]/10 border border-white/[0.08] rounded-2xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎯</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Onboarding Checklist</h2>
              <p className="text-sm text-[#a1a1aa] mt-1">Complete these steps to get the most out of Social Media Automator</p>
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
            <p className="text-sm font-medium text-[#a1a1aa]">Progress</p>
            <p className="text-sm font-bold text-[#22d3ee]">{progressPercent}%</p>
          </div>
          <div className="w-full bg-[#18181b] rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="bg-[#22d3ee] h-2 rounded-full"
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
                    ? 'bg-[#22d3ee] border-green-500/50'
                    : 'bg-[#18181b] border-white/[0.06] group-hover:border-white/[0.08]'
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
                          ? 'bg-[#0a0a0b] border-green-500'
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
                      <p className="text-sm text-[#a1a1aa]">{milestone.description}</p>
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
            className="mt-6 p-4 bg-[#22d3ee] border border-green-500/50 rounded-lg text-center"
          >
            <p className="text-green-400 font-semibold mb-2">🎊 You're All Set!</p>
            <p className="text-sm text-[#a1a1aa]">
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
            className="mt-6 text-sm text-[#a1a1aa] text-center"
          >
            Complete your onboarding journey to unlock all features
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
