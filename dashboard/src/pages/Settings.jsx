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

  const connectTikTok = async () => {
    try {
      const response = await api.post("/auth/tiktok/url");
      if (response.data.success) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("TikTok connection error:", error);
      toast.error("Failed to connect TikTok");
    }
  };
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
        {/* Connected Accounts Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connected Accounts</h2>
        <p className="text-gray-600 mb-6">Connect your social media accounts to get started.</p>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-gray-600 mb-4">No accounts connected yet</p>
            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectLinkedIn}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                <span>🔗</span> Connect LinkedIn
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectTwitter}
                className="bg-sky-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-sky-600 transition flex items-center gap-2"
              >
                <span>🐦</span> Connect Twitter
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectTelegram}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <span>📱</span> Connect Telegram
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectInstagram}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
              >
                <span>📷</span> Connect Instagram
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectFacebook}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                <span>📘</span> Connect Facebook
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectYouTube}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
              >
                <span>🎬</span> Connect YouTube
              </motion.button>
            </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectTikTok}
                className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center gap-2"
              >
                <span>🎵</span> Connect TikTok
              </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts && Array.isArray(accounts) && accounts.map((account, index) => (
              <div
                key={account?.id || `account-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {account?.platform === 'linkedin' && '🔗'}
                    {account?.platform === 'twitter' && '🐦'}
                    {account?.platform === 'telegram' && '📱'}
                    {account?.platform === 'instagram' && '📷'}
                    {account?.platform === 'facebook' && '📘'}
                    {account?.platform === "youtube" && "🎬"}
                    {account?.platform === "tiktok" && "🎵"}
                    {!account?.platform && '📱'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {account?.platform_name || (account?.platform ? account.platform.charAt(0).toUpperCase() + account.platform.slice(1) : 'Account')}
                    </div>
                    <div className="text-sm text-gray-600">{account?.platform_username || account?.username || account?.email || 'Connected'}</div>
                  </div>
                </div>
                {account?.id && (
                  <button
                    onClick={() => disconnectAccount(account)}
                    className="text-red-600 hover:text-red-700 font-medium transition"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Connect Buttons */}
        {accounts && Array.isArray(accounts) && accounts.length > 0 && (
          <div className="mt-6 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectLinkedIn}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              + Connect LinkedIn
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectTwitter}
              className="bg-sky-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-sky-600 transition"
            >
              + Connect Twitter
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectTelegram}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              + Connect Telegram
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectInstagram}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              + Connect Instagram
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectFacebook}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              + Connect Facebook
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectYouTube}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              + Connect YouTube
            </motion.button>
          </div>
        )}
      </div>

      {/* Telegram Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect Telegram Bot</h3>
            <p className="text-gray-600 mb-6">
              Enter your Telegram bot token and chat ID to connect.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
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
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
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
