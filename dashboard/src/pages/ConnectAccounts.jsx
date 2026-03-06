import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import {
  FaLinkedin,
  FaTwitter,
  FaTiktok,
  FaYoutube,
  FaPinterest,
  FaReddit,
  FaDiscord,
  FaSlack,
  FaTelegram,
  FaMedium,
  FaTumblr,
  FaQuora
} from 'react-icons/fa';
import { SiBluesky, SiMastodon } from 'react-icons/si';

export default function ConnectAccounts() {
  const navigate = useNavigate();
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
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonPlatform, setComingSoonPlatform] = useState('');
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [showDevToModal, setShowDevToModal] = useState(false);
  const [devToApiKey, setDevToApiKey] = useState('');
  const [showMastodonModal, setShowMastodonModal] = useState(false);
  const [mastodonAccessToken, setMastodonAccessToken] = useState('');
  const [mastodonInstanceUrl, setMastodonInstanceUrl] = useState('mastodon.social');
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [blueskyHandle, setBlueskyHandle] = useState('');
  const [blueskyAppPassword, setBlueskyAppPassword] = useState('');


  // Check if platform is already connected
  const isPlatformConnected = (platformName) => {
    return accounts.some(acc => acc.platform === platformName);
  };

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Check for platform connection status in URL params
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const success = params.get('success');
    const error = params.get('error');
    const message = params.get('message');

    // Check if we're returning from OAuth during onboarding
    const wasOnboarding = localStorage.getItem('sma_oauth_onboarding');

    if (wasOnboarding && (connected || success)) {
      // OAuth completed during onboarding - resume tutorial at step 2
      localStorage.setItem('sma_resume_onboarding_step', '2');
      localStorage.removeItem('sma_oauth_onboarding');
      navigate('/');
      return;
    }

    // Handle successful connections (normal flow)
    if (connected && success) {
      showSuccess(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
      loadAccounts();
      trackFirstAccountMilestone();
      window.history.replaceState({}, '', '/connect-accounts');
    }

    // Handle errors
    if (error) {
      const errorMessage = message || `Failed to connect platform: ${error}`;
      showError(errorMessage);
      window.history.replaceState({}, '', '/connect-accounts');
    }
  }, []);

  const trackFirstAccountMilestone = async () => {
    try {
      // Get current accounts
      const response = await api.get('/accounts');
      const accountsData = response.data?.accounts || response.data || [];
      const currentAccounts = Array.isArray(accountsData) ? accountsData : [];

      // Check if this is the first account (only 1 account exists)
      if (currentAccounts.length === 1) {
        await api.post('/milestones/track', {
          milestone_type: 'first_account_connected'
        });
      }
    } catch (err) {
      console.error('Error tracking milestone:', err);
      // Don't fail if milestone tracking fails
    }
  };

  const loadAccounts = async () => {
    try {
      console.log('👤 Loading connected accounts...');
      const response = await api.get('/accounts');
      console.log('👤 API Response:', response.data);
      
      const accountsData = response.data?.accounts || response.data || [];
      // Ensure accountsData is always an array
      const accountsArray = Array.isArray(accountsData) ? accountsData : [];
      console.log(`👤 Found ${accountsArray.length} connected accounts`);
      setAccounts(accountsArray);
    } catch (err) {
      console.error('❌ Error loading accounts:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      // Set empty array on error
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const connectLinkedIn = async () => {
    try {
      const response = await api.post('/auth/linkedin/url');
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        showError('Failed to generate LinkedIn auth URL');
      }
    } catch (err) {
      console.error('Error connecting LinkedIn:', err);
      showError(err.response?.data?.error || 'Failed to connect LinkedIn');
    }
  };

  const connectTwitter = async () => {
    try {
      console.log('🐦 Requesting Twitter auth URL...');
      const response = await api.post('/auth/twitter/url');
      console.log('🐦 Response:', response.data);

      if (response.data.authUrl) {
        console.log('🐦 Redirecting to:', response.data.authUrl);
        window.location.href = response.data.authUrl;
      } else {
        console.error('🐦 No authUrl in response:', response.data);
        showError('Failed to generate Twitter auth URL');
      }
    } catch (err) {
      console.error('🐦 Error connecting Twitter:', err);
      console.error('🐦 Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to connect Twitter';
      showError(errorMsg);
    }
  };

  const connectReddit = async () => {
    try {
      const response = await api.post('/auth/reddit/url');
      if (response.data.oauthUrl) {
        window.location.href = response.data.oauthUrl;
      } else {
        showError('Failed to generate Reddit auth URL');
      }
    } catch (err) {
      console.error('Error connecting Reddit:', err);
      showError(err.response?.data?.error || 'Failed to connect Reddit');
    }
  };

  const connectYouTube = async () => {
    try {
      const response = await api.post('/auth/youtube/url');
      if (response.data.success && response.data.oauthUrl) {
        window.location.href = response.data.oauthUrl;
      } else {
        showError('Failed to generate YouTube auth URL');
      }
    } catch (err) {
      console.error('Error connecting YouTube:', err);
      showError(err.response?.data?.error || 'Failed to connect YouTube');
    }
  };

  const connectPinterest = async () => {
    try {
      const response = await api.post('/auth/pinterest/url');
      if (response.data.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        showError('Failed to generate Pinterest auth URL');
      }
    } catch (err) {
      console.error('Error connecting Pinterest:', err);
      showError(err.response?.data?.error || 'Failed to connect Pinterest');
    }
  };

  const connectTikTok = async () => {
    try {
      const response = await api.post('/auth/tiktok/url');
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        showError('Failed to generate TikTok auth URL');
      }
    } catch (err) {
      console.error('Error connecting TikTok:', err);
      showError(err.response?.data?.error || 'Failed to connect TikTok');
    }
  };

  const connectMedium = async () => {
    try {
      const response = await api.post('/auth/medium/url');
      if (response.data.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        showError('Failed to generate Medium auth URL');
      }
    } catch (err) {
      console.error('Error connecting Medium:', err);
      showError(err.response?.data?.error || 'Failed to connect Medium');
    }
  };

  const connectTelegram = () => {
    setShowTelegramModal(true);
  };

  const connectSlack = () => {
    setShowSlackModal(true);
  };

  const connectDiscord = () => {
    setShowDiscordModal(true);
  };

  const connectDevTo = () => {
    setShowDevToModal(true);
  };

  const connectTumblr = async () => {
    try {
      const response = await api.post('/auth/tumblr/url');
      if (response.data.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        showError('Failed to generate Tumblr auth URL');
      }
    } catch (err) {
      console.error('Error connecting Tumblr:', err);
      showError(err.response?.data?.error || 'Failed to connect Tumblr');
    }
  };

  const connectMastodon = () => {
    setShowMastodonModal(true);
  };

  const handleMastodonConnect = async () => {
    if (!mastodonAccessToken.trim() || !mastodonInstanceUrl.trim()) {
      showError('Please fill in all fields');
      return;
    }

    try {
      const response = await api.post('/auth/mastodon/connect', {
        accessToken: mastodonAccessToken,
        instanceUrl: mastodonInstanceUrl
      });

      if (response.data.success) {
        showSuccess('Mastodon connected successfully!');
        setShowMastodonModal(false);
        setMastodonAccessToken('');
        setMastodonInstanceUrl('mastodon.social');
        loadAccounts();
      }
    } catch (err) {
      console.error('Error connecting Mastodon:', err);
      showError(err.response?.data?.error || 'Failed to connect Mastodon');
    }
  };

  const connectBluesky = () => {
    setShowBlueskyModal(true);
  };

  const handleBlueskyConnect = async () => {
    if (!blueskyHandle.trim() || !blueskyAppPassword.trim()) {
      showError('Please fill in all fields');
      return;
    }

    try {
      const response = await api.post('/auth/bluesky/connect', {
        handle: blueskyHandle,
        appPassword: blueskyAppPassword
      });

      if (response.data.success) {
        showSuccess('Bluesky connected successfully!');
        setShowBlueskyModal(false);
        setBlueskyHandle('');
        setBlueskyAppPassword('');
        loadAccounts();
      }
    } catch (err) {
      console.error('Error connecting Bluesky:', err);
      showError(err.response?.data?.error || 'Failed to connect Bluesky');
    }
  };

  const handleComingSoon = (platform) => {
    setComingSoonPlatform(platform);
    setShowComingSoonModal(true);
  };

  const handleTelegramConnect = async () => {
    if (!telegramBotToken.trim() || !telegramChatId.trim()) {
      showError('Please fill in all fields');
      return;
    }

    try {
      const response = await api.post('/auth/telegram/connect', {
        botToken: telegramBotToken,
        chatId: telegramChatId
      });

      if (response.data.success) {
        showSuccess('Telegram connected successfully!');
        setShowTelegramModal(false);
        setTelegramBotToken('');
        setTelegramChatId('');
        loadAccounts();
      }
    } catch (err) {
      console.error('Error connecting Telegram:', err);
      showError(err.response?.data?.error || 'Failed to connect Telegram');
    }
  };

  const handleSlackConnect = async () => {
    if (!slackWebhookUrl.trim()) {
      showError('Please enter a webhook URL');
      return;
    }

    try {
      const response = await api.post('/auth/slack/connect', {
        webhookUrl: slackWebhookUrl,
        channelName: slackChannelName || 'general'
      });

      if (response.data.success) {
        showSuccess('Slack connected successfully!');
        setShowSlackModal(false);
        setSlackWebhookUrl('');
        setSlackChannelName('');
        loadAccounts();
      }
    } catch (err) {
      console.error('Error connecting Slack:', err);
      showError(err.response?.data?.error || 'Failed to connect Slack');
    }
  };

  const handleDiscordConnect = async () => {
    if (!discordWebhookUrl.trim()) {
      showError('Please enter a webhook URL');
      return;
    }

    try {
      const response = await api.post('/auth/discord/connect', {
        webhookUrl: discordWebhookUrl,
        serverName: discordServerName || 'My Server'
      });

      if (response.data.success) {
        showSuccess('Discord connected successfully!');
        setShowDiscordModal(false);
        setDiscordWebhookUrl('');
        setDiscordServerName('');
        loadAccounts();
      }
    } catch (err) {
      console.error('Error connecting Discord:', err);
      showError(err.response?.data?.error || 'Failed to connect Discord');
    }
  };

  const handleDevToConnect = async () => {
    if (!devToApiKey.trim()) {
      showError('Please enter your Dev.to API key');
      return;
    }

    try {
      const response = await api.post('/auth/devto/connect', {
        apiKey: devToApiKey
      });

      if (response.data.success) {
        showSuccess('Dev.to connected successfully!');
        setShowDevToModal(false);
        setDevToApiKey('');
        loadAccounts();
      }
    } catch (err) {
      console.error('Error connecting Dev.to:', err);
      showError(err.response?.data?.error || 'Failed to connect Dev.to');
    }
  };

  const disconnectAccount = async (account) => {
    if (!account || !account.id || !account.platform) {
      console.error('No account, ID, or platform provided for disconnection');
      return;
    }

    if (!confirm(`Are you sure you want to disconnect your ${account.platform} account?`)) {
      return;
    }

    try {
      const response = await api.delete(`/user/accounts/${account.platform}/${account.id}`);
      if (response.data.success) {
        showSuccess(`${account.platform} disconnected successfully!`);
        loadAccounts();
      }
    } catch (err) {
      console.error('Error disconnecting account:', err);
      const errorMsg = err.response?.data?.error || 'Failed to disconnect account';
      showError(errorMsg);
    }
  };

  const startEditLabel = (account) => {
    setEditingAccountId(account.id);
    setEditLabel(account.account_label || 'Main Account');
  };

  const cancelEditLabel = () => {
    setEditingAccountId(null);
    setEditLabel('');
  };

  const saveLabel = async (accountId) => {
    if (!editLabel.trim()) {
      showError('Label cannot be empty');
      return;
    }

    try {
      const response = await api.put(`/user/accounts/${accountId}/label`, {
        label: editLabel.trim()
      });

      if (response.data.success) {
        showSuccess('Account label updated!');
        setEditingAccountId(null);
        setEditLabel('');
        loadAccounts();
      }
    } catch (err) {
      console.error('Error updating label:', err);
      showError(err.response?.data?.error || 'Failed to update label');
    }
  };

  const toggleDefault = async (accountId, currentDefault) => {
    if (currentDefault) {
      showError('This is already your default account for this platform');
      return;
    }

    try {
      const response = await api.put(`/user/accounts/${accountId}/set-default`);

      if (response.data.success) {
        showSuccess('Default account updated!');
        loadAccounts();
      }
    } catch (err) {
      console.error('Error setting default:', err);
      showError(err.response?.data?.error || 'Failed to set default account');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Connect Accounts</h1>
        <p className="text-[#a1a1aa]">Connect your social media accounts to start posting</p>
      </div>

      {/* Connected Accounts Section */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-[#a1a1aa] mb-4">Connected Accounts</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22d3ee] mx-auto"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-[#a1a1aa] mb-2 text-lg font-medium">No accounts connected yet</p>
            <p className="text-sm text-[#52525b]">Connect your first platform below to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {accounts.map((account, idx) => {
              // Get platform-specific gradient
              const platformGradients = {
                linkedin: 'bg-[#22d3ee]/10',
                twitter: ' to-transparent',
                telegram: 'bg-[#22d3ee]/10',
                slack: 'bg-[#22d3ee]/10',
                discord: ' to-transparent',
                reddit: ' to-transparent',
                youtube: ' to-transparent',
                tiktok: 'bg-[#18181b]/50'
              };

              const gradient = platformGradients[account?.platform] || 'bg-[#18181b]/50';

              return (
                <div
                  key={idx}
                  className={`group relative overflow-hidden border border-white/[0.06] bg-[#111113] ${gradient} rounded-xl p-6 hover:scale-[1.02] hover:border-white/[0.08] transition-all duration-300`}
                >
                  {/* Glossy shine effect */}
                  <div className="absolute inset-0 bg-[#111113] from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Icon with glow effect */}
                      <div className="relative">
                        <div className="absolute inset-0  opacity-50">
                          {account?.platform === 'linkedin' && <FaLinkedin className="text-5xl text-[#22d3ee]" />}
                          {account?.platform === 'twitter' && <FaTwitter className="text-5xl text-sky-500" />}
                          {account?.platform === 'telegram' && <FaTelegram className="text-5xl text-[#22d3ee]" />}
                          {account?.platform === 'slack' && <FaSlack className="text-5xl text-[#22d3ee]" />}
                          {account?.platform === 'discord' && <FaDiscord className="text-5xl text-indigo-500" />}
                          {account?.platform === 'reddit' && <FaReddit className="text-5xl text-orange-500" />}
                          {account?.platform === 'youtube' && <FaYoutube className="text-5xl text-red-500" />}
                          {account?.platform === 'pinterest' && <FaPinterest className="text-5xl text-red-600" />}
                          {account?.platform === 'tiktok' && <FaTiktok className="text-5xl text-[#a1a1aa]" />}
                          {account?.platform === 'medium' && <FaMedium className="text-5xl text-[#a1a1aa]" />}
                          {account?.platform === 'devto' && <FaMedium className="text-5xl text-white" />}
                          {account?.platform === 'tumblr' && <FaTumblr className="text-5xl text-[#22d3ee]" />}
                          {account?.platform === 'mastodon' && <SiMastodon className="text-5xl text-[#22d3ee]" />}
                          {account?.platform === 'bluesky' && <SiBluesky className="text-5xl text-[#22d3ee]" />}
                        </div>
                        <div className="relative text-5xl drop-shadow-lg">
                          {account?.platform === 'linkedin' && <FaLinkedin className="text-[#22d3ee]" />}
                          {account?.platform === 'twitter' && <FaTwitter className="text-sky-400" />}
                          {account?.platform === 'telegram' && <FaTelegram className="text-[#22d3ee]" />}
                          {account?.platform === 'slack' && <FaSlack className="text-[#a1a1aa]" />}
                          {account?.platform === 'discord' && <FaDiscord className="text-indigo-400" />}
                          {account?.platform === 'reddit' && <FaReddit className="text-orange-400" />}
                          {account?.platform === 'youtube' && <FaYoutube className="text-red-400" />}
                          {account?.platform === 'pinterest' && <FaPinterest className="text-red-500" />}
                          {account?.platform === 'tiktok' && <FaTiktok className="text-[#a1a1aa]" />}
                          {account?.platform === 'medium' && <FaMedium className="text-white" />}
                          {account?.platform === 'devto' && <FaMedium className="text-white" />}
                          {account?.platform === 'tumblr' && <FaTumblr className="text-[#22d3ee]" />}
                          {account?.platform === 'mastodon' && <SiMastodon className="text-[#a1a1aa]" />}
                          {account?.platform === 'bluesky' && <SiBluesky className="text-[#22d3ee]" />}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h4 className="font-bold text-white text-lg mb-1">
                          {account?.platform_name || (account?.platform ? account.platform.charAt(0).toUpperCase() + account.platform.slice(1) : 'Account')}
                        </h4>

                        {/* Account Label */}
                        {editingAccountId === account.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="bg-[#18181b] border border-white/[0.06] text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors focus:border-[#22d3ee]"
                              placeholder="Account label"
                              autoFocus
                            />
                            <button
                              onClick={() => saveLabel(account.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditLabel}
                              className="bg-[#18181b] hover:bg-[#18181b] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-[#a1a1aa] font-semibold">
                              {account?.account_label || 'Main Account'}
                            </p>
                            <button
                              onClick={() => startEditLabel(account)}
                              className="text-[#22d3ee] hover:text-[#22d3ee] transition"
                              title="Edit label"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <p className="text-xs text-[#a1a1aa] mt-1">{account?.platform_username || account?.username || 'Connected'}</p>

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30">
                            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Active
                          </span>

                          {/* Default Badge */}
                          {account.is_default ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-[#22d3ee] text-yellow-200 border border-yellow-400/50">
                              <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleDefault(account.id, account.is_default)}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#18181b] text-[#a1a1aa] border border-white/[0.06] hover:bg-[#22d3ee]/20 hover:border-[#22d3ee]/30 hover:text-[#22d3ee] transition"
                              title="Set as default account for this platform"
                            >
                              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Set as Default
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {account?.id && (
                      <button
                        onClick={() => disconnectAccount(account)}
                        className="group/btn relative overflow-hidden text-red-400 hover:text-white font-semibold text-sm px-5 py-2.5 rounded-lg border border-red-500/30 hover:border-red-500 bg-red-500/10 hover:bg-red-500 transition-all duration-300"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Disconnect
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Connect New Platform Section - Restructured */}
        <div className="border-t border-white/[0.06] pt-6 space-y-8">

          {/* Section 1: Available to Connect (10 Working Platforms) */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold text-white">Available to Connect</h3>
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-400/30">
                ✓ NOW
              </span>
            </div>
            <p className="text-sm text-[#a1a1aa] mb-4">Connect instantly to these 10 platforms.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* LinkedIn - Working */}
              {!isPlatformConnected('linkedin') && (
                <button onClick={connectLinkedIn} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border border-[#22d3ee]/30 rounded-xl hover:border-[#22d3ee]/60 hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaLinkedin className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-semibold text-sm text-white">LinkedIn</span>
                </button>
              )}

              {/* Twitter - Working */}
              {!isPlatformConnected('twitter') && (
                <button onClick={connectTwitter} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border-2 border-sky-400/50 rounded-xl hover:border-sky-300 hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaTwitter className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-semibold text-sm text-white">Twitter / X</span>
                </button>
              )}

              {/* Telegram - Working */}
              {!isPlatformConnected('telegram') && (
                <button onClick={connectTelegram} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border-2 border-cyan-400/50 rounded-xl hover:border-cyan-300 hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaTelegram className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-semibold text-sm text-white">Telegram</span>
                </button>
              )}

              {/* Slack - Working */}
              {!isPlatformConnected('slack') && (
                <button onClick={connectSlack} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border border-[#22d3ee]/30 rounded-xl hover:border-[#22d3ee]/40 hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaSlack className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-semibold text-sm text-white">Slack</span>
                </button>
              )}

              {/* Discord - Working */}
              {!isPlatformConnected('discord') && (
                <button onClick={connectDiscord} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border-2 border-indigo-400/50 rounded-xl hover:border-indigo-300 hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaDiscord className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-bold text-sm text-white">Discord</span>
                </button>
              )}

              {/* Reddit - Working */}
              {!isPlatformConnected('reddit') && (
                <button onClick={connectReddit} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border-2 border-orange-400/50 rounded-xl hover:border-orange-300 hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaReddit className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-bold text-sm text-white">Reddit</span>
                </button>
              )}

              {/* YouTube - Working */}
              {!isPlatformConnected('youtube') && (
                <button onClick={connectYouTube} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border-2 border-red-400/50 rounded-xl hover:border-red-300 hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaYoutube className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-bold text-sm text-white">YouTube</span>
                </button>
              )}

              {/* Pinterest - Working */}
              {!isPlatformConnected('pinterest') && (
                <button onClick={() => handleComingSoon('Pinterest')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border-2 border-red-500/50 rounded-xl hover:border-red-400 hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaPinterest className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-bold text-sm text-white">Pinterest</span>
                </button>
              )}

              {/* TikTok - Working */}
              {!isPlatformConnected('tiktok') && (
                <button onClick={() => handleComingSoon('TikTok')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#18181b] border border-white/[0.06] rounded-xl hover:border-white/[0.12]  hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaTiktok className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-bold text-sm text-white">TikTok</span>
                </button>
              )}



              {/* Dev.to - Working */}
              {!isPlatformConnected('devto') && (
                <button onClick={connectDevTo} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#18181b] border border-white/[0.06] rounded-xl hover:border-white/[0.06]  hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaMedium className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-bold text-sm text-white">Dev.to</span>
                </button>
              )}

              {/* Tumblr - Working */}
              {!isPlatformConnected('tumblr') && (
                <button onClick={connectTumblr} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border border-[#22d3ee]/50 rounded-xl hover:border-[#22d3ee] hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FaTumblr className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-bold text-sm text-white">Tumblr</span>
                </button>
              )}

              {/* Mastodon - Working */}
              {!isPlatformConnected('mastodon') && (
                <button onClick={connectMastodon} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border border-[#22d3ee]/30 rounded-xl hover:border-[#22d3ee] hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <SiMastodon className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-bold text-sm text-white">Mastodon</span>
                </button>
              )}

              {/* Bluesky - Working */}
              {!isPlatformConnected('bluesky') && (
                <button onClick={connectBluesky} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-[#0a0a0b] border border-[#22d3ee]/30 rounded-xl hover:border-[#22d3ee]/60 hover:scale-105 transition-all duration-200">
                  <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <SiBluesky className="relative text-4xl text-white drop-shadow-lg" />
                  <span className="relative font-bold text-sm text-white">Bluesky</span>
                </button>
              )}
            </div>
          </div>




        </div>
      </div>

      {/* Telegram Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Connect Telegram</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="Enter your Telegram bot token"
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Enter your Telegram chat ID"
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTelegramConnect}
                className="flex-1 bg-[#06b6d4] text-white px-4 py-2 rounded-lg hover:bg-[#06b6d4] font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setShowTelegramModal(false)}
                className="flex-1 bg-[#18181b] text-white px-4 py-2 rounded-lg hover:bg-white/[0.1] font-medium"
              >
                Cancel
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
            className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Connect Slack</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Webhook URL
                </label>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:ring-2 focus:ring-[#22d3ee]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Channel Name (Optional)
                </label>
                <input
                  type="text"
                  value={slackChannelName}
                  onChange={(e) => setSlackChannelName(e.target.value)}
                  placeholder="e.g., general"
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:ring-2 focus:ring-[#22d3ee]/20"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSlackConnect}
                className="flex-1 bg-[#06b6d4] text-white px-4 py-2 rounded-lg hover:bg-[#06b6d4] font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setShowSlackModal(false)}
                className="flex-1 bg-[#18181b] text-white px-4 py-2 rounded-lg hover:bg-white/[0.1] font-medium"
              >
                Cancel
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
            className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Connect Discord</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Webhook URL
                </label>
                <input
                  type="text"
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Server Name (Optional)
                </label>
                <input
                  type="text"
                  value={discordServerName}
                  onChange={(e) => setDiscordServerName(e.target.value)}
                  placeholder="e.g., My Server"
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDiscordConnect}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setShowDiscordModal(false)}
                className="flex-1 bg-[#18181b] text-white px-4 py-2 rounded-lg hover:bg-white/[0.1] font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dev.to Modal */}
      {showDevToModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaMedium className="text-2xl" />
              Connect Dev.to
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  API Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={devToApiKey}
                  onChange={(e) => setDevToApiKey(e.target.value)}
                  placeholder="Q3QMaaq53dyqJsebtZ6ry14N"
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:ring-2 focus:ring-[#22d3ee]/20"
                />
                <p className="text-xs text-[#a1a1aa] mt-1">
                  Get your API key from <a href="https://dev.to/settings/extensions" target="_blank" rel="noopener noreferrer" className="text-[#a1a1aa] hover:underline">Dev.to Settings → Extensions</a>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDevToConnect}
                className="flex-1 bg-[#06b6d4] text-white px-4 py-2 rounded-lg hover:bg-[#06b6d4] font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setShowDevToModal(false)}
                className="flex-1 bg-[#18181b] text-white px-4 py-2 rounded-lg hover:bg-white/[0.1] font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mastodon Modal */}
      {showMastodonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <SiMastodon className="text-2xl text-[#a1a1aa]" />
              Connect Mastodon
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Instance URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={mastodonInstanceUrl}
                  onChange={(e) => setMastodonInstanceUrl(e.target.value)}
                  placeholder="mastodon.social"
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:ring-2 focus:ring-[#22d3ee]/20"
                />
                <p className="text-xs text-[#a1a1aa] mt-1">
                  Your Mastodon instance (e.g., mastodon.social, mastodon.online)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Access Token <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={mastodonAccessToken}
                  onChange={(e) => setMastodonAccessToken(e.target.value)}
                  placeholder="Your access token"
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:ring-2 focus:ring-[#22d3ee]/20"
                />
                <p className="text-xs text-[#a1a1aa] mt-1">
                  Create an app at: <code className="bg-[#18181b] px-1 rounded">https://[your-instance]/settings/applications</code>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleMastodonConnect}
                className="flex-1 bg-[#06b6d4] text-white px-4 py-2 rounded-lg hover:bg-[#06b6d4] font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setShowMastodonModal(false)}
                className="flex-1 bg-[#18181b] text-white px-4 py-2 rounded-lg hover:bg-white/[0.1] font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bluesky Modal */}
      {showBlueskyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <SiBluesky className="text-2xl text-[#22d3ee]" />
              Connect Bluesky
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Handle <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={blueskyHandle}
                  onChange={(e) => setBlueskyHandle(e.target.value)}
                  placeholder="username.bsky.social"
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors"
                />
                <p className="text-xs text-[#a1a1aa] mt-1">
                  Your Bluesky handle (e.g., ajay.bsky.social)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  App Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={blueskyAppPassword}
                  onChange={(e) => setBlueskyAppPassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] text-white rounded-lg focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors"
                />
                <p className="text-xs text-[#a1a1aa] mt-1">
                  Create at: <a href="https://bsky.app/settings/app-passwords" target="_blank" rel="noopener noreferrer" className="text-[#22d3ee] hover:underline">Settings → App Passwords</a>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBlueskyConnect}
                className="flex-1 bg-[#06b6d4] text-white px-4 py-2 rounded-lg hover:bg-[#06b6d4] font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setShowBlueskyModal(false)}
                className="flex-1 bg-[#18181b] text-white px-4 py-2 rounded-lg hover:bg-white/[0.1] font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111113] border border-white/[0.06] rounded-xl p-8 max-w-md w-full text-center"
          >
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-white mb-2">{comingSoonPlatform} Integration</h3>
            <p className="text-[#a1a1aa] mb-6">
              We're working hard to bring {comingSoonPlatform} integration to you soon. Stay tuned for updates!
            </p>
            <button
              onClick={() => setShowComingSoonModal(false)}
              className="bg-[#06b6d4] text-white px-6 py-2 rounded-lg hover:bg-[#06b6d4] font-medium"
            >
              Got it!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

