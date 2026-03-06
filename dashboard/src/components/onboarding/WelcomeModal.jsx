import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function WelcomeModal() {
  const { nextStep, skipOnboarding, skipCount } = useOnboarding();
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleSkip = () => {
    if (skipCount === 0) {
      // First attempt - show confirmation
      setShowSkipConfirm(true);
    } else if (skipCount === 1) {
      // Second attempt - stronger warning
      setShowSkipConfirm(true);
    } else {
      // Third attempt - allow skip
      skipOnboarding();
    }
  };

  const confirmSkip = () => {
    // Defer state update to next tick to avoid render-phase update warning
    setTimeout(() => {
      skipOnboarding();
    }, 0);
  };

  const cancelSkip = () => {
    setShowSkipConfirm(false);
  };

  const steps = [
    { icon: '✅', text: 'Connect Your Accounts', completed: false },
    { icon: '⭕', text: 'Create Your First Post', completed: false },
    { icon: '⭕', text: 'Post to All Platforms', completed: false }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative bg-[#111113] border border-white/[0.08] rounded-3xl p-12 max-w-2xl w-full overflow-hidden"
      >
        {/* Gradient Background Effect */}
        <div className="absolute inset-0 bg-[#0a0a0b]/10 via-transparent pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Welcome Emoji */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-8xl text-center mb-6"
          >
            🎉
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-bold text-white text-center mb-4"
          >
            Welcome to Social Media Automator!
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-[#a1a1aa] text-center mb-8"
          >
            Let's get you posting in <span className="text-[#22d3ee] font-semibold">3 simple steps</span>
          </motion.p>

          {/* Time Estimate */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-10"
          >
            <span className="text-sm text-[#a1a1aa] font-semibold bg-[#22d3ee]/10 px-4 py-2 rounded-full border border-[#22d3ee]/20">
              ⏱️ Takes only 2 minutes
            </span>
          </motion.div>

          {/* Steps List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-4 mb-10"
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-4 bg-[#18181b] border border-white/[0.06] rounded-xl p-4 hover:bg-[#111113] transition-all"
              >
                <span className="text-3xl">{step.icon}</span>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{step.text}</h3>
                  <p className="text-[#a1a1aa] text-sm">Step {index + 1} of 3</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {/* Primary CTA */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={nextStep}
              className="flex-1 bg-[#22d3ee] text-white px-8 py-5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>

            {/* Skip Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSkip}
              className="glass border border-white/[0.08] text-[#a1a1aa] px-8 py-5 rounded-xl font-medium text-lg hover:bg-[#111113] transition-all"
            >
              Skip Tutorial
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Skip Confirmation Modal */}
      <AnimatePresence>
        {showSkipConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#111113] border border-white/[0.08] rounded-2xl p-8 max-w-md mx-4"
            >
              <div className="text-5xl text-center mb-4">🤔</div>
              <h3 className="text-2xl font-bold text-white text-center mb-3">
                {skipCount === 0 ? 'Are you sure?' : 'Last chance!'}
              </h3>
              <p className="text-[#a1a1aa] text-center mb-6">
                {skipCount === 0 
                  ? 'This guided tour only takes 2 minutes and helps you post to all 10 platforms instantly.'
                  : 'You\'re missing out on our step-by-step guide that makes your first post effortless!'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelSkip}
                  className="flex-1 bg-[#22d3ee] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all"
                >
                  {skipCount === 0 ? 'Continue Tutorial' : 'Give It a Try'}
                </button>
                <button
                  onClick={confirmSkip}
                  className="flex-1 glass border border-white/[0.08] text-[#a1a1aa] px-6 py-3 rounded-lg font-medium hover:bg-[#111113] transition-all"
                >
                  Skip Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

