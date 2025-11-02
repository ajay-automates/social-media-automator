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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and platform connections.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`${
              activeTab === 'accounts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Connected Accounts
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`${
              activeTab === 'billing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Billing & Usage
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'accounts' && (
        <>
        {/* Connected Accounts Section - Professional Design */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connected Accounts</h2>
        <p className="text-gray-600 mb-6">Manage your connected social media accounts.</p>
                
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-gray-600 mb-2 text-lg font-medium">No accounts connected yet</p>
            <p className="text-gray-500 text-sm">Connect your first platform below to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {accounts.map((account, idx) => {
              const platformConfig = {
                linkedin: { name: 'LinkedIn', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '💼' },
                twitter: { name: 'Twitter', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: '🐦' },
                telegram: { name: 'Telegram', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: '✈️' },
                slack: { name: 'Slack', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '💬' },
                discord: { name: 'Discord', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: '🎮' },
                reddit: { name: 'Reddit', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🔴' },
                instagram: { name: 'Instagram', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', icon: '📷' },
                facebook: { name: 'Facebook', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: '📘' },
                youtube: { name: 'YouTube', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: '🎬' },
                tiktok: { name: 'TikTok', bg: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-300', icon: '🎵' }
              };
              const config = platformConfig[account?.platform] || { name: 'Account', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '📱' };
              
              return (
                <div key={idx} className={"border-2 " + config.border + " " + config.bg + " rounded-xl p-6 hover:shadow-md transition-shadow"}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{config.icon}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{config.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{account?.platform_username || account?.username || 'Connected'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                    {account?.id && (
                      <button onClick={() => disconnectAccount(account)} className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Connect New Platform Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect New Platform</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <button onClick={connectLinkedIn} className="flex flex-col items-center gap-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"><span className="text-3xl">💼</span><span className="font-semibold text-sm">LinkedIn</span></button>
            <button onClick={connectTwitter} className="flex flex-col items-center gap-2 p-4 bg-sky-50 border-2 border-sky-200 rounded-lg hover:border-sky-400 hover:shadow-md transition-all"><span className="text-3xl">🐦</span><span className="font-semibold text-sm">Twitter</span></button>
            <button onClick={connectTelegram} className="flex flex-col items-center gap-2 p-4 bg-cyan-50 border-2 border-cyan-200 rounded-lg hover:border-cyan-400 hover:shadow-md transition-all"><span className="text-3xl">✈️</span><span className="font-semibold text-sm">Telegram</span></button>
            <button onClick={connectSlack} className="flex flex-col items-center gap-2 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all"><span className="text-3xl">💬</span><span className="font-semibold text-sm">Slack</span></button>
            <button onClick={connectDiscord} className="flex flex-col items-center gap-2 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:shadow-md transition-all"><span className="text-3xl">🎮</span><span className="font-semibold text-sm">Discord</span></button>
            <button onClick={connectReddit} className="flex flex-col items-center gap-2 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all"><span className="text-3xl">🔴</span><span className="font-semibold text-sm">Reddit</span></button>
            <button onClick={connectInstagram} className="flex flex-col items-center gap-2 p-4 bg-pink-50 border-2 border-pink-200 rounded-lg hover:border-pink-400 hover:shadow-md transition-all"><span className="text-3xl">📷</span><span className="font-semibold text-sm">Instagram</span></button>
            <button onClick={connectFacebook} className="flex flex-col items-center gap-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"><span className="text-3xl">📘</span><span className="font-semibold text-sm">Facebook</span></button>
            <button onClick={connectYouTube} className="flex flex-col items-center gap-2 p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-md transition-all"><span className="text-3xl">🎬</span><span className="font-semibold text-sm">YouTube</span></button>
            <button onClick={connectTikTok} className="flex flex-col items-center gap-2 p-4 bg-gray-50 border-2 border-gray-300 rounded-lg hover:border-gray-900 hover:shadow-md transition-all"><span className="text-3xl">🎵</span><span className="font-semibold text-sm">TikTok</span></button>
          </div>
        </div>
        </div>

            <p className="text-gray-600 mb-6">
              Enter your Discord incoming webhook URL to connect a channel.
            </p>
            
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

        </>
      )}

      {activeTab === 'billing' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <BillingSettings />
        </div>
      )}
    </motion.div>
  );
}
// Force rebuild - YouTube button added
// Build timestamp: 1761762481
