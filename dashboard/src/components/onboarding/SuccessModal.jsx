import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { celebrateSuccess } from '../../utils/animations';

const platformIcons = {
  linkedin: '🔵',
  twitter: '🐦',
  telegram: '✈️',
  slack: '💼',
  discord: '💜',
  reddit: '🔴',
  devto: '👨‍💻',
  tumblr: '🎨',
  mastodon: '🐘',
  bluesky: '🦋'
};

const platformNames = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  telegram: 'Telegram',
  slack: 'Slack',
  discord: 'Discord',
  reddit: 'Reddit',
  devto: 'Dev.to',
  tumblr: 'Tumblr',
  mastodon: 'Mastodon',
  bluesky: 'Bluesky'
};

const tips = [
  {
    icon: '🎯',
    title: 'Use AI Caption Generator',
    description: 'Generate engaging captions for any topic in seconds with Claude AI'
  },
  {
    icon: '📅',
    title: 'Schedule Your Posts',
    description: 'Plan your content ahead and maintain consistent posting schedule'
  },
  {
    icon: '📊',
    title: 'Track Your Analytics',
    description: 'Monitor your post performance and engagement across all platforms'
  },
  {
    icon: '🎨',
    title: 'Create AI Images',
    description: 'Generate stunning visuals for your posts using Stability AI'
  },
  {
    icon: '#️⃣',
    title: 'Use Hashtag Generator',
    description: 'Get trending hashtags to boost your content discoverability'
  },
  {
    icon: '📤',
    title: 'Bulk Upload Posts',
    description: 'Upload multiple posts at once via CSV for maximum efficiency'
  }
];

export default function SuccessModal({ results = [], platformCount = 0 }) {
  const { finishOnboarding } = useOnboarding();
  const [timeSpent] = useState(Math.floor(Math.random() * 30) + 30); // 30-60 seconds
  const [showTips, setShowTips] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Trigger confetti celebration
    celebrateSuccess();

    // Show tips after 2 seconds
    const tipTimer = setTimeout(() => setShowTips(true), 2000);

    // Auto-dismiss countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss after 10 seconds
    const dismissTimer = setTimeout(() => {
      handleViewDashboard();
    }, 10000);

    return () => {
      clearTimeout(tipTimer);
      clearTimeout(dismissTimer);
      clearInterval(countdownInterval);
    };
  }, []);

  const handleViewDashboard = () => {
    finishOnboarding();
    window.location.href = '/dashboard';
  };

  const handlePostAnother = () => {
    finishOnboarding();
    window.location.href = '/create-post';
  };

  // Calculate success stats
  const successfulPosts = results.filter(r => r.success).length;
  const failedPosts = results.filter(r => !r.success).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative bg-gray-900/30 backdrop-blur-xl border-2 border-white/20 rounded-3xl shadow-2xl p-8 max-w-2xl w-full my-8"
      >
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-6"
        >
          <div className="text-8xl mb-4">🎉</div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-bold text-white mb-2"
          >
            Posted Successfully!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-300"
          >
            Your content is now live across {successfulPosts} platform{successfulPosts !== 1 ? 's' : ''}!
          </motion.p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="glass border border-white/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{successfulPosts}</div>
            <div className="text-sm text-gray-400">Posted</div>
          </div>
          <div className="glass border border-white/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{platformCount}</div>
            <div className="text-sm text-gray-400">Platforms</div>
          </div>
          <div className="glass border border-white/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{timeSpent}s</div>
            <div className="text-sm text-gray-400">Time Saved</div>
          </div>
        </motion.div>

        {/* Platform Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="glass border border-white/20 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto"
        >
          <h3 className="text-sm font-semibold text-purple-400 mb-3">✅ PLATFORM STATUS</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.success ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platformIcons[result.platform]}</span>
                  <span className="text-white font-medium">{platformNames[result.platform]}</span>
                </div>
                {result.success ? (
                  <div className="bg-green-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="bg-red-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pro Tips */}
        {showTips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <h3 className="text-sm font-semibold text-purple-400 mb-3">💡 WHAT'S NEXT?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tips.slice(0, 4).map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass border border-white/20 rounded-lg p-3 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{tip.icon}</span>
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-1">{tip.title}</h4>
                      <p className="text-xs text-gray-400">{tip.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePostAnother}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-green-500/50 transition-all"
          >
            📝 Post Another
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewDashboard}
            className="flex-1 glass border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
          >
            📊 View Dashboard
          </motion.button>
        </div>

        {/* Auto-dismiss Countdown */}
        {countdown > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-sm text-gray-400 mt-4"
          >
            Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
          </motion.p>
        )}

        {/* Celebration Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-xl p-4 text-center"
        >
          <p className="text-white font-semibold mb-1">🌟 Welcome to Social Media Automator!</p>
          <p className="text-sm text-gray-300">
            You just saved hours of manual posting. Imagine what you'll achieve next!
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

