import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import api from '../../lib/api';
import { showError, showSuccess } from '../ui/Toast';
import {
  FaLinkedin,
  FaTwitter,
  FaTelegram,
  FaSlack,
  FaDiscord,
  FaReddit,
  FaTumblr
} from 'react-icons/fa';
import { SiBluesky, SiMastodon } from 'react-icons/si';

// Platform icons mapping
const platformIcons = {
  linkedin: FaLinkedin,
  twitter: FaTwitter,
  telegram: FaTelegram,
  slack: FaSlack,
  discord: FaDiscord,
  reddit: FaReddit,
  devto: null, // Special case - use text
  tumblr: FaTumblr,
  mastodon: SiMastodon,
  bluesky: SiBluesky
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

// Platform colors (matching their brand colors)
const platformColors = {
  linkedin: 'from-blue-600 to-blue-700',
  twitter: 'from-blue-400 to-blue-500',
  telegram: 'from-blue-500 to-blue-600',
  slack: 'from-purple-500 to-purple-600',
  discord: 'from-indigo-600 to-indigo-700',
  reddit: 'from-orange-500 to-orange-600',
  devto: 'from-gray-700 to-gray-800',
  tumblr: 'from-blue-900 to-gray-900',
  mastodon: 'from-purple-600 to-purple-700',
  bluesky: 'from-sky-400 to-sky-500'
};

// Working platforms (10 total)
const workingPlatforms = ['linkedin', 'twitter', 'telegram', 'slack', 'discord', 'reddit', 'devto', 'tumblr', 'mastodon', 'bluesky'];

export default function ConnectAccountsStep() {
  const { nextStep, prevStep, updateProgress } = useOnboarding();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Platform-specific modals
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [showDevtoModal, setShowDevtoModal] = useState(false);
  const [showMastodonModal, setShowMastodonModal] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);

  // Token inputs
  const [telegramToken, setTelegramToken] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [devtoToken, setDevtoToken] = useState('');
  const [mastodonInstance, setMastodonInstance] = useState('');
  const [mastodonToken, setMastodonToken] = useState('');
  const [blueskyHandle, setBlueskyHandle] = useState('');
  const [blueskyPassword, setBlueskyPassword] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      // Handle different response formats
      const accountsData = response.data?.accounts || response.data || [];
      const accounts = Array.isArray(accountsData) ? accountsData : [];
      setConnectedAccounts(accounts);
      
      // Update onboarding progress
      if (accounts.length > 0) {
        updateProgress({ hasConnectedAccount: true });
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setConnectedAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthConnect = async (platform) => {
    try {
      const response = await api.post(`/auth/${platform}/url`);
      
      if (response.data.authUrl || response.data.oauthUrl) {
        const authUrl = response.data.authUrl || response.data.oauthUrl;
        // Store onboarding flag so we can resume after OAuth
        localStorage.setItem('sma_oauth_onboarding', 'true');
        window.location.href = authUrl;
      } else {
        showError(`Failed to generate ${platformNames[platform]} auth URL`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || `Failed to connect ${platformNames[platform]}`;
      showError(errorMsg);
    }
  };

  const handleTokenConnect = async (platform, data) => {
    try {
      await api.post(`/auth/${platform}/connect`, data);
      showSuccess(`${platformNames[platform]} connected successfully!`);
      
      // Close modals
      setShowTelegramModal(false);
      setShowSlackModal(false);
      setShowDiscordModal(false);
      setShowDevtoModal(false);
      setShowMastodonModal(false);
      setShowBlueskyModal(false);
      
      // Refresh accounts
      fetchAccounts();
    } catch (error) {
      showError(`Failed to connect ${platformNames[platform]}`);
      console.error(error);
    }
  };

  const handlePlatformClick = (platform) => {
    if (isPlatformConnected(platform)) return;

    // OAuth platforms
    if (['linkedin', 'twitter', 'reddit', 'tumblr'].includes(platform)) {
      handleOAuthConnect(platform);
    }
    // Token/Webhook platforms
    else if (platform === 'telegram') setShowTelegramModal(true);
    else if (platform === 'slack') setShowSlackModal(true);
    else if (platform === 'discord') setShowDiscordModal(true);
    else if (platform === 'devto') setShowDevtoModal(true);
    else if (platform === 'mastodon') setShowMastodonModal(true);
    else if (platform === 'bluesky') setShowBlueskyModal(true);
  };

  const isPlatformConnected = (platform) => {
    return connectedAccounts.some(acc => acc.platform === platform);
  };

  const canContinue = connectedAccounts.length > 0;

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
        className="relative bg-gray-900/30 backdrop-blur-xl border-2 border-white/20 rounded-3xl shadow-2xl p-8 max-w-4xl w-full my-8"
      >
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-400 font-semibold">STEP 1 of 3</span>
            <span className="text-sm text-gray-400">{connectedAccounts.length} / 10 platforms</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(connectedAccounts.length / 10) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Connect Your Accounts
        </h2>
        <p className="text-gray-300 mb-8">
          {connectedAccounts.length === 0 
            ? 'Choose at least one platform to continue. You can add more later!'
            : `Great! ${connectedAccounts.length} connected. Add more or continue to the next step.`}
        </p>

        {/* Platform Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
            {workingPlatforms.map((platform, index) => {
              const isConnected = isPlatformConnected(platform);
              return (
                <motion.button
                  key={platform}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: isConnected ? 1 : 1.05, y: isConnected ? 0 : -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlatformClick(platform)}
                  disabled={isConnected}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    isConnected
                      ? 'bg-green-500/20 border-green-400 cursor-default'
                      : `bg-gradient-to-br ${platformColors[platform]} border-white/20 hover:border-white/40 hover:shadow-lg`
                  }`}
                >
                  <div className="text-4xl mb-2 flex justify-center">
                    {platformIcons[platform] ? (
                      // Render icon component
                      <span className="inline-block text-white">
                        {(() => {
                          const IconComponent = platformIcons[platform];
                          return <IconComponent className="w-10 h-10 text-white" />;
                        })()}
                      </span>
                    ) : (
                      // Special case for devto - use text
                      <span className="inline-block font-bold text-white text-sm">Dev.to</span>
                    )}
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{platformNames[platform]}</div>
                  {isConnected && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={prevStep}
            className="glass border border-white/20 text-gray-300 px-8 py-4 rounded-xl font-medium hover:bg-white/10 transition-all"
          >
            ← Back
          </button>
          <button
            onClick={nextStep}
            disabled={!canContinue}
            className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              canContinue
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/50'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>{canContinue ? 'Continue' : 'Connect at least 1 platform'}</span>
            {canContinue && <span>→</span>}
          </button>
        </div>

        {/* Token Input Modals */}
        {showTelegramModal && (
          <TokenInputModal
            title="Connect Telegram"
            description="Enter your Telegram Bot Token"
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            value={telegramToken}
            onChange={setTelegramToken}
            onSubmit={() => handleTokenConnect('telegram', { token: telegramToken })}
            onClose={() => setShowTelegramModal(false)}
          />
        )}

        {showSlackModal && (
          <TokenInputModal
            title="Connect Slack"
            description="Enter your Slack Webhook URL"
            placeholder="https://hooks.slack.com/services/..."
            value={slackWebhook}
            onChange={setSlackWebhook}
            onSubmit={() => handleTokenConnect('slack', { webhookUrl: slackWebhook })}
            onClose={() => setShowSlackModal(false)}
          />
        )}

        {showDiscordModal && (
          <TokenInputModal
            title="Connect Discord"
            description="Enter your Discord Webhook URL"
            placeholder="https://discord.com/api/webhooks/..."
            value={discordWebhook}
            onChange={setDiscordWebhook}
            onSubmit={() => handleTokenConnect('discord', { webhookUrl: discordWebhook })}
            onClose={() => setShowDiscordModal(false)}
          />
        )}

        {showDevtoModal && (
          <TokenInputModal
            title="Connect Dev.to"
            description="Enter your Dev.to API Token"
            placeholder="your-dev-to-api-token"
            value={devtoToken}
            onChange={setDevtoToken}
            onSubmit={() => handleTokenConnect('devto', { token: devtoToken })}
            onClose={() => setShowDevtoModal(false)}
          />
        )}

        {showMastodonModal && (
          <MastodonModal
            instance={mastodonInstance}
            token={mastodonToken}
            onInstanceChange={setMastodonInstance}
            onTokenChange={setMastodonToken}
            onSubmit={() => handleTokenConnect('mastodon', { instance: mastodonInstance, accessToken: mastodonToken })}
            onClose={() => setShowMastodonModal(false)}
          />
        )}

        {showBlueskyModal && (
          <BlueskyModal
            handle={blueskyHandle}
            password={blueskyPassword}
            onHandleChange={setBlueskyHandle}
            onPasswordChange={setBlueskyPassword}
            onSubmit={() => handleTokenConnect('bluesky', { handle: blueskyHandle, appPassword: blueskyPassword })}
            onClose={() => setShowBlueskyModal(false)}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// Helper Component: Token Input Modal
function TokenInputModal({ title, description, placeholder, value, onChange, onSubmit, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900/90 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 mb-4">{description}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 mb-4 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              value.trim()
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Connect
          </button>
          <button
            onClick={onClose}
            className="glass border border-white/20 text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper Component: Mastodon Modal
function MastodonModal({ instance, token, onInstanceChange, onTokenChange, onSubmit, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900/90 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-2xl font-bold text-white mb-2">Connect Mastodon</h3>
        <p className="text-gray-300 mb-4">Enter your Mastodon instance and access token</p>
        <input
          type="text"
          value={instance}
          onChange={(e) => onInstanceChange(e.target.value)}
          placeholder="mastodon.social"
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 mb-3 focus:border-blue-500 focus:outline-none"
        />
        <input
          type="text"
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="Access Token"
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 mb-4 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            disabled={!instance.trim() || !token.trim()}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              instance.trim() && token.trim()
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Connect
          </button>
          <button
            onClick={onClose}
            className="glass border border-white/20 text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper Component: Bluesky Modal
function BlueskyModal({ handle, password, onHandleChange, onPasswordChange, onSubmit, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900/90 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-2xl font-bold text-white mb-2">Connect Bluesky</h3>
        <p className="text-gray-300 mb-4">Enter your Bluesky handle and app password</p>
        <input
          type="text"
          value={handle}
          onChange={(e) => onHandleChange(e.target.value)}
          placeholder="username.bsky.social"
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 mb-3 focus:border-blue-500 focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="App Password"
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 mb-4 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            disabled={!handle.trim() || !password.trim()}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              handle.trim() && password.trim()
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Connect
          </button>
          <button
            onClick={onClose}
            className="glass border border-white/20 text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

