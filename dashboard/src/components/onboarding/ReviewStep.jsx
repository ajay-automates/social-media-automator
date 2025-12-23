import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import api from '../../lib/api';
import { showError } from '../ui/Toast';

// Platform icons and names
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

export default function ReviewStep() {
  const { prevStep, firstPostData, completeOnboarding, updateProgress } = useOnboarding();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);

  useEffect(() => {
    fetchAccounts();
    checkBusinessProfile();
  }, []);

  const checkBusinessProfile = async () => {
    try {
      const response = await api.get('/business/profile');
      setHasBusinessProfile(response.data.success && response.data.hasProfile);
    } catch (err) {
      console.error('Error checking business profile:', err);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/accounts');
      // Handle different response formats
      const accountsData = response.data?.accounts || response.data || [];
      const accounts = Array.isArray(accountsData) ? accountsData : [];
      setConnectedAccounts(accounts);
      // Pre-select all connected platforms
      setSelectedPlatforms(accounts.map(acc => acc.platform));
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      showError('Failed to load connected accounts');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePostNow = async () => {
    if (selectedPlatforms.length === 0) {
      showError('Please select at least one platform');
      return;
    }

    setPosting(true);

    try {
      // Upload image first if present
      let imageUrl = null;
      if (firstPostData?.image) {
        const imageFormData = new FormData();
        imageFormData.append('image', firstPostData.image);
        
        try {
          const uploadResponse = await api.post('/upload/image', imageFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          imageUrl = uploadResponse.data.url;
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          showError('Failed to upload image');
          setPosting(false);
          return;
        }
      }

      // Send post request with correct format
      const response = await api.post('/post/now', {
        text: firstPostData?.caption || '',
        platforms: selectedPlatforms,
        imageUrl: imageUrl
      });

      // Update onboarding progress after a brief delay to avoid React warning
      setTimeout(() => {
        updateProgress({ hasCreatedFirstPost: true });

        // Complete onboarding and pass results
        completeOnboarding({
          success: true,
          results: response.data.results,
          platformCount: selectedPlatforms.length
        });
      }, 100);
    } catch (error) {
      console.error('❌ Failed to post:', error);
      console.error('❌ Error response:', error.response?.data);
      showError(error.response?.data?.error || 'Failed to create post');
      setPosting(false);
    }
  };

  const handleSchedule = () => {
    // For now, just post immediately (can be enhanced later)
    handlePostNow();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gray-900/30 backdrop-blur-xl border-2 border-white/20 rounded-3xl shadow-2xl p-8 max-w-3xl w-full my-8"
      >
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-400 font-semibold">STEP 3 of 3</span>
            <span className="text-sm text-green-400 font-semibold">✨ Final Step!</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '66%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Review & Post
        </h2>
        <p className="text-gray-300 mb-6">
          Almost there! Review your post and hit the button to share it across all your platforms.
        </p>

        {/* Business Profile Suggestion */}
        {!hasBusinessProfile && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏢</span>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">Set Up Your Business Profile</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Generate personalized posts about your business automatically! Set up your business profile to unlock AI-powered content generation.
                </p>
                <a
                  href="/business"
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/business';
                  }}
                >
                  Set Up Business Profile →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Post Preview */}
        <div className="glass border-2 border-white/20 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-purple-400 mb-3">📝 YOUR POST</h3>
          <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
            <p className="text-white whitespace-pre-wrap">{firstPostData.caption}</p>
          </div>
          {firstPostData.imagePreview && (
            <div className="rounded-xl overflow-hidden">
              <img
                src={firstPostData.imagePreview}
                alt="Post preview"
                className="w-full h-48 object-cover"
              />
            </div>
          )}
        </div>

        {/* Selected Platforms */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-400">
                🚀 POSTING TO ({selectedPlatforms.length} selected)
              </h3>
              <button
                onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-all"
              >
                {showAllPlatforms ? 'Hide' : 'Show All'} Platforms
              </button>
            </div>

            {/* Selected Platforms Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              {connectedAccounts.map((account) => {
                const isSelected = selectedPlatforms.includes(account.platform);
                return (
                  <motion.button
                    key={account.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => togglePlatform(account.platform)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-green-500/20 border-green-400'
                        : 'glass border-white/20 opacity-50'
                    }`}
                  >
                    <div className="text-3xl mb-1">{platformIcons[account.platform]}</div>
                    <div className="text-white text-xs font-semibold">{platformNames[account.platform]}</div>
                    {isSelected && (
                      <div className="mt-2 bg-green-500 rounded-full mx-auto w-5 h-5 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Upsell: Add More Platforms */}
            {showAllPlatforms && connectedAccounts.length < 10 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Want to reach more people?</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      You've connected {connectedAccounts.length} out of 10 available platforms. Connect more to maximize your reach!
                    </p>
                    <button
                      onClick={() => window.location.href = '/connect-accounts'}
                      className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                    >
                      + Connect More Platforms
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {/* Primary Action: Post Now */}
          <motion.button
            whileHover={{ scale: posting ? 1 : 1.02 }}
            whileTap={{ scale: posting ? 1 : 0.98 }}
            onClick={handlePostNow}
            disabled={posting || selectedPlatforms.length === 0}
            className={`w-full px-8 py-5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              posting
                ? 'bg-gray-700 cursor-wait'
                : selectedPlatforms.length > 0
                ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-xl hover:shadow-green-500/50'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {posting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span>Posting to {selectedPlatforms.length} platforms...</span>
              </>
            ) : (
              <>
                <span>🚀 Post Now to {selectedPlatforms.length} Platforms</span>
              </>
            )}
          </motion.button>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={prevStep}
              disabled={posting}
              className="glass border border-white/20 text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Edit Post
            </button>
            <button
              onClick={handleSchedule}
              disabled={posting || selectedPlatforms.length === 0}
              className="flex-1 glass border border-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📅 Schedule for Later
            </button>
          </div>
        </div>

        {/* Posting Indicator */}
        {posting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              <div className="flex-1">
                <h4 className="text-white font-semibold">Posting in progress...</h4>
                <p className="text-sm text-gray-300">
                  Sharing your content to {selectedPlatforms.length} platforms. This may take a few seconds.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

