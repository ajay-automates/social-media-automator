import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import BillingSettings from '../components/BillingSettings';

export default function Settings() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [slackChannelName, setSlackChannelName] = useState('');
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [discordServerName, setDiscordServerName] = useState('');
  const [activeTab, setActiveTab] = useState('accounts');

  
  // Check if platform is already connected
  const isPlatformConnected = (platformName) => {
    return accounts.some(acc => acc.platform === platformName);
  };

  useEffect(() => {
    loadAccounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Check for Instagram and Facebook connection status in URL params
    const params = new URLSearchParams(window.location.search);
    const instagram = params.get('instagram');
    const facebook = params.get('facebook');
    const error = params.get('error');
    
    if (instagram === 'connected') {
      showSuccess('Instagram connected successfully!');
      loadAccounts();
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
    
    if (facebook === 'connected') {
      showSuccess('Facebook connected successfully!');
      loadAccounts();
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
    
    if (error && error.startsWith('instagram')) {
      const message = params.get('message') || 'Failed to connect Instagram';
      showError(message);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
    
    if (error && error.startsWith('facebook')) {
      const message = params.get('message') || 'Failed to connect Facebook';
      showError(message);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      const accountsData = response.data?.accounts || response.data || [];
      // Ensure accountsData is always an array
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      console.error('Error loading accounts:', err);
      // Silently handle error - just set empty array
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const connectLinkedIn = async () => {
    try {
      console.log('🔗 Attempting to connect LinkedIn...');
      const response = await api.post('/auth/linkedin/url');
      console.log('🔗 LinkedIn response:', response.data);
      if (response.data?.oauthUrl) {
        console.log('🔗 Redirecting to:', response.data.oauthUrl);
        window.location.href = response.data.oauthUrl;
      } else {
        console.error('🔗 No OAuth URL in response');
        showError('Failed to generate LinkedIn OAuth URL');
      }
    } catch (err) {
      console.error('LinkedIn connection error:', err);
      console.error('Error response:', err.response?.data);
      showError(err.response?.data?.error || 'Failed to connect LinkedIn');
    }
  };

  const connectTwitter = async () => {
    try {
      console.log('🐦 Attempting to connect Twitter...');
      const response = await api.post('/auth/twitter/url');
      console.log('🐦 Twitter response:', response.data);
      if (response.data?.oauthUrl) {
        console.log('🐦 Redirecting to:', response.data.oauthUrl);
        window.location.href = response.data.oauthUrl;
      } else {
        console.error('🐦 No OAuth URL in response');
        showError('Failed to generate Twitter OAuth URL');
      }
    } catch (err) {
      console.error('Twitter connection error:', err);
      console.error('Error response:', err.response?.data);
      showError(err.response?.data?.error || 'Failed to connect Twitter');
    }
  };

  const connectTelegram = async () => {
    setShowTelegramModal(true);
  };

  const connectReddit = async () => {
    try {
      const response = await api.post('/auth/reddit/url');
      if (response.data?.success && response.data?.oauthUrl) {
        window.location.href = response.data.oauthUrl;
      } else {
        showError('Failed to generate Reddit OAuth URL');
      }
    } catch (err) {
      console.error('Reddit connection error:', err);
      showError(err.response?.data?.error || 'Failed to connect Reddit');
    }
  };

  const connectInstagram = async () => {
    try {
      const response = await api.post('/auth/instagram/url');
      if (response.data?.oauthUrl) {
        window.location.href = response.data.oauthUrl;
      } else {
        showError('Failed to generate Instagram OAuth URL');
      }
    } catch (err) {
      console.error('Instagram connection error:', err);
      showError('Failed to connect Instagram');
    }
  };

  const connectFacebook = async () => {
    try {
      const response = await api.post('/auth/facebook/url');
      if (response.data?.oauthUrl) {
        window.location.href = response.data.oauthUrl;
      } else {
        showError('Failed to generate Facebook OAuth URL');
      }
    } catch (err) {
      console.error('Facebook connection error:', err);
      showError('Failed to connect Facebook');
    }
  };

  const connectYouTube = async () => {
    try {
      const response = await api.post('/auth/youtube/url');
      if (response.data?.oauthUrl) {
        window.location.href = response.data.oauthUrl;
      } else {
        showError('Failed to generate YouTube OAuth URL');
      }
    } catch (err) {
      console.error('YouTube connection error:', err);
      showError('Failed to connect YouTube');
    }
  };


  const connectTikTok = async () => {
    try {
      const response = await api.post('/auth/tiktok/url');
      if (response.data.success) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('TikTok connection error:', error);
      showError('Failed to connect TikTok');
    }
  };

  const handleTelegramConnect = async () => {
    try {
      await api.post('/auth/telegram/connect', {
        botToken: telegramBotToken,
        chatId: telegramChatId
      });
      showSuccess('Telegram connected successfully!');
      setShowTelegramModal(false);
      setTelegramBotToken('');
      setTelegramChatId('');
      loadAccounts();
    } catch (err) {
      console.error('Telegram connection error:', err);
      showError('Failed to connect Telegram');
    }
  };

  const connectSlack = () => {
    setShowSlackModal(true);
  };

  const handleSlackConnect = async () => {
    try {
      await api.post('/auth/slack/connect', {
        webhookUrl: slackWebhookUrl,
        channelName: slackChannelName
      });
      showSuccess('Slack connected successfully!');
      setShowSlackModal(false);
      setSlackWebhookUrl('');
      setSlackChannelName('');
      loadAccounts();
    } catch (err) {
      console.error('Slack connection error:', err);
      showError(err.response?.data?.error || 'Failed to connect Slack');
    }
  };

  const connectDiscord = () => {
    setShowDiscordModal(true);
  };

  const handleDiscordConnect = async () => {
    try {
      await api.post('/auth/discord/connect', {
        webhookUrl: discordWebhookUrl,
        serverName: discordServerName
      });
      showSuccess('Discord connected successfully!');
      setShowDiscordModal(false);
      setDiscordWebhookUrl('');
      setDiscordServerName('');
      loadAccounts();
    } catch (err) {
      console.error('Discord connection error:', err);
      showError(err.response?.data?.error || 'Failed to connect Discord');
    }
  };

  const disconnectAccount = async (account) => {
    try {
      await api.delete(`/user/accounts/${account.platform}/${account.id}`);
      showSuccess('Account disconnected');
      loadAccounts();
    } catch (err) {
      console.error('Disconnect error:', err);
      showError('Failed to disconnect account');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text text-transparent mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and platform connections.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`${
              activeTab === 'accounts'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all`}
          >
            Connected Accounts
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`${
              activeTab === 'billing'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all`}
          >
            Billing & Usage
          </button>
        </nav>
      </div>

      {activeTab === 'accounts' && (
        <>
        {/* Connected Accounts Section */}
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Connected Accounts</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-gray-600 mb-2 text-lg font-medium">No accounts connected yet</p>
            <p className="text-sm text-gray-500">Connect your first platform below to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {accounts.map((account, idx) => (
              <div key={idx} className="border-2 border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl drop-shadow-sm">
                      {account?.platform === 'linkedin' && '💼'}
                      {account?.platform === 'twitter' && '🐦'}
                      {account?.platform === 'telegram' && '✈️'}
                      {account?.platform === 'slack' && '💬'}
                      {account?.platform === 'discord' && '🎮'}
                      {account?.platform === 'reddit' && '🔴'}
                      {account?.platform === 'instagram' && '📷'}
                      {account?.platform === 'facebook' && '📘'}
                      {account?.platform === 'youtube' && '🎬'}
                      {account?.platform === 'tiktok' && '🎵'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-100 text-lg">
                        {account?.platform_name || (account?.platform ? account.platform.charAt(0).toUpperCase() + account.platform.slice(1) : 'Account')}
                      </h4>
                      <p className="text-sm text-gray-400 mt-1 font-medium">{account?.platform_username || account?.username || 'Connected'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                          <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                  {account?.id && (
                    <button onClick={() => disconnectAccount(account)} className="text-red-600 hover:text-white hover:bg-red-600 font-semibold text-sm px-4 py-2 rounded-lg border-2 border-red-200 hover:border-red-600 transition-all duration-200">
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Connect New Platform Section */}
        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">Connect New Platform</h3>
          <p className="text-sm text-gray-400 mb-4">Add more platforms to expand your reach.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {!isPlatformConnected('linkedin') && (
            <button onClick={connectLinkedIn} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-400/50 rounded-xl hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">💼</span>
              <span className="font-semibold text-sm text-white">LinkedIn</span>
            </button>
            )}
            {!isPlatformConnected('twitter') && (
            <button onClick={connectTwitter} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-sky-500 to-sky-600 border-2 border-sky-400/50 rounded-xl hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">🐦</span>
              <span className="font-semibold text-sm text-white">Twitter</span>
            </button>
            )}
            {!isPlatformConnected('telegram') && (
            <button onClick={connectTelegram} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-cyan-500 to-cyan-600 border-2 border-cyan-400/50 rounded-xl hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">✈️</span>
              <span className="font-semibold text-sm text-white">Telegram</span>
            </button>
            )}
            {!isPlatformConnected('slack') && (
            <button onClick={connectSlack} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-400/50 rounded-xl hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">💬</span>
              <span className="font-semibold text-sm text-white">Slack</span>
            </button>
            )}
            {!isPlatformConnected('discord') && (
            <button onClick={connectDiscord} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-400/50 rounded-xl hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">🎮</span>
              <span className="font-semibold text-sm text-white">Discord</span>
            </button>
            )}
            {!isPlatformConnected('reddit') && (
            <button onClick={connectReddit} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-400/50 rounded-xl hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">🔴</span>
              <span className="font-semibold text-sm text-white">Reddit</span>
            </button>
            )}
            {!isPlatformConnected('instagram') && (
            <button onClick={connectInstagram} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-400/50 rounded-xl hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">📷</span>
              <span className="font-semibold text-sm text-white">Instagram</span>
            </button>
            )}
            {!isPlatformConnected('facebook') && (
            <button onClick={connectFacebook} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-500/50 rounded-xl hover:border-blue-400 hover:shadow-lg hover:shadow-blue-600/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">📘</span>
              <span className="font-semibold text-sm text-white">Facebook</span>
            </button>
            )}
            {!isPlatformConnected('youtube') && (
            <button onClick={connectYouTube} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400/50 rounded-xl hover:border-red-300 hover:shadow-lg hover:shadow-red-500/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">🎬</span>
              <span className="font-semibold text-sm text-white">YouTube</span>
            </button>
            )}
            {!isPlatformConnected('tiktok') && (
            <button onClick={connectTikTok} className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600/50 rounded-xl hover:border-gray-500 hover:shadow-lg hover:shadow-gray-700/50 hover:scale-105 transition-all duration-200">
              <span className="text-4xl">🎵</span>
              <span className="font-semibold text-sm text-white">TikTok</span>
            </button>
            )}
          </div>
        </div>
        </div>
        </>
      )}

      {activeTab === 'billing' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <BillingSettings />
        </div>
      )}

      {/* Telegram Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Connect Telegram</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from @BotFather on Telegram
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="-1001234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your channel or group chat ID
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTelegramModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTelegramConnect}
                className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition"
              >
                Connect
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Slack Modal */}
      {showSlackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Connect Slack</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Slack: Your Workspace → Apps → Incoming Webhooks
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name (Optional)
                </label>
                <input
                  type="text"
                  value={slackChannelName}
                  onChange={(e) => setSlackChannelName(e.target.value)}
                  placeholder="#general"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSlackModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSlackConnect}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition"
              >
                Connect
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Discord Modal */}
      {showDiscordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Connect Discord</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="text"
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-700 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Discord: Server Settings → Integrations → Webhooks → New Webhook
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Server/Channel Name (Optional)
                </label>
                <input
                  type="text"
                  value={discordServerName}
                  onChange={(e) => setDiscordServerName(e.target.value)}
                  placeholder="My Discord Server"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-700 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscordModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscordConnect}
                className="flex-1 px-4 py-2 bg-indigo-700 text-white rounded-lg font-medium hover:bg-indigo-800 transition"
              >
                Connect
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
