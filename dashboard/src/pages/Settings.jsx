import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import BillingSettings from '../components/BillingSettings';
import { 
  FaLinkedin, 
  FaTwitter, 
  FaInstagram, 
  FaFacebook, 
  FaTiktok, 
  FaYoutube, 
  FaReddit, 
  FaDiscord, 
  FaSlack, 
  FaTelegram,
  FaPinterest,
  FaWhatsapp,
  FaSnapchat,
  FaMedium,
  FaTwitch,
  FaTumblr,
  FaVk,
  FaQuora
} from 'react-icons/fa';
import { SiThreads, SiBluesky, SiMastodon } from 'react-icons/si';

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
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonPlatform, setComingSoonPlatform] = useState('');

  
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

  const handleComingSoon = (platformName) => {
    setComingSoonPlatform(platformName);
    setShowComingSoonModal(true);
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
      <div className="mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`relative overflow-hidden flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'accounts'
                ? 'bg-blue-500/30 backdrop-blur-lg border-2 border-blue-400/50 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-800/30 backdrop-blur-sm border-2 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-gray-700/30 hover:border-white/20'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 ${activeTab === 'accounts' ? 'opacity-100' : ''} transition-opacity`}></div>
            <span className="relative">Connected Accounts</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`relative overflow-hidden flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'billing'
                ? 'bg-purple-500/30 backdrop-blur-lg border-2 border-purple-400/50 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gray-800/30 backdrop-blur-sm border-2 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-gray-700/30 hover:border-white/20'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 ${activeTab === 'billing' ? 'opacity-100' : ''} transition-opacity`}></div>
            <span className="relative">Billing & Usage</span>
          </button>
        </nav>
      </div>

      {activeTab === 'accounts' && (
        <>
        {/* Connected Accounts Section */}
        <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {accounts.map((account, idx) => {
              // Get platform-specific gradient
              const platformGradients = {
                linkedin: 'from-blue-600/20 via-blue-500/10 to-transparent',
                twitter: 'from-sky-600/20 via-sky-500/10 to-transparent',
                telegram: 'from-cyan-600/20 via-cyan-500/10 to-transparent',
                slack: 'from-purple-600/20 via-purple-500/10 to-transparent',
                discord: 'from-indigo-600/20 via-indigo-500/10 to-transparent',
                reddit: 'from-orange-600/20 via-orange-500/10 to-transparent',
                instagram: 'from-pink-600/20 via-pink-500/10 to-transparent',
                facebook: 'from-blue-700/20 via-blue-600/10 to-transparent',
                youtube: 'from-red-600/20 via-red-500/10 to-transparent',
                tiktok: 'from-gray-700/20 via-gray-600/10 to-transparent'
              };
              
              const gradient = platformGradients[account?.platform] || 'from-gray-600/20 via-gray-500/10 to-transparent';
              
              return (
                <div 
                  key={idx} 
                  className={`group relative overflow-hidden border-2 border-white/10 bg-gradient-to-br ${gradient} backdrop-blur-xl rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:border-white/20 transition-all duration-300`}
                >
                  {/* Glossy shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Icon with glow effect */}
                      <div className="relative">
                        <div className="absolute inset-0 blur-xl opacity-50">
                          {account?.platform === 'linkedin' && <FaLinkedin className="text-5xl text-blue-500" />}
                          {account?.platform === 'twitter' && <FaTwitter className="text-5xl text-sky-500" />}
                          {account?.platform === 'telegram' && <FaTelegram className="text-5xl text-cyan-500" />}
                          {account?.platform === 'slack' && <FaSlack className="text-5xl text-purple-500" />}
                          {account?.platform === 'discord' && <FaDiscord className="text-5xl text-indigo-500" />}
                          {account?.platform === 'reddit' && <FaReddit className="text-5xl text-orange-500" />}
                          {account?.platform === 'instagram' && <FaInstagram className="text-5xl text-pink-500" />}
                          {account?.platform === 'facebook' && <FaFacebook className="text-5xl text-blue-600" />}
                          {account?.platform === 'youtube' && <FaYoutube className="text-5xl text-red-500" />}
                          {account?.platform === 'tiktok' && <FaTiktok className="text-5xl text-gray-300" />}
                        </div>
                        <div className="relative text-5xl drop-shadow-lg">
                          {account?.platform === 'linkedin' && <FaLinkedin className="text-blue-400" />}
                          {account?.platform === 'twitter' && <FaTwitter className="text-sky-400" />}
                          {account?.platform === 'telegram' && <FaTelegram className="text-cyan-400" />}
                          {account?.platform === 'slack' && <FaSlack className="text-purple-400" />}
                          {account?.platform === 'discord' && <FaDiscord className="text-indigo-400" />}
                          {account?.platform === 'reddit' && <FaReddit className="text-orange-400" />}
                          {account?.platform === 'instagram' && <FaInstagram className="text-pink-400" />}
                          {account?.platform === 'facebook' && <FaFacebook className="text-blue-500" />}
                          {account?.platform === 'youtube' && <FaYoutube className="text-red-400" />}
                          {account?.platform === 'tiktok' && <FaTiktok className="text-gray-300" />}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-white text-lg mb-1">
                          {account?.platform_name || (account?.platform ? account.platform.charAt(0).toUpperCase() + account.platform.slice(1) : 'Account')}
                        </h4>
                        <p className="text-sm text-gray-300 font-medium">{account?.platform_username || account?.username || 'Connected'}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30 backdrop-blur-sm">
                            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                    {account?.id && (
                      <button 
                        onClick={() => disconnectAccount(account)} 
                        className="group/btn relative overflow-hidden text-red-400 hover:text-white font-semibold text-sm px-5 py-2.5 rounded-lg border-2 border-red-500/30 hover:border-red-500 bg-red-500/10 hover:bg-red-500 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50"
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
        
        {/* Connect New Platform Section */}
        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">Connect New Platform</h3>
          <p className="text-sm text-gray-400 mb-4">Add more platforms to expand your reach.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* LinkedIn - Working */}
            {!isPlatformConnected('linkedin') && (
            <button onClick={connectLinkedIn} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-400/50 rounded-xl hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaLinkedin className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">LinkedIn</span>
            </button>
            )}
            
            {/* Twitter - Working */}
            {!isPlatformConnected('twitter') && (
            <button onClick={connectTwitter} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-sky-500 to-sky-600 border-2 border-sky-400/50 rounded-xl hover:border-sky-300 hover:shadow-2xl hover:shadow-sky-500/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaTwitter className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Twitter / X</span>
            </button>
            )}
            
            {/* Instagram - Working */}
            {!isPlatformConnected('instagram') && (
            <button onClick={connectInstagram} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-400/50 rounded-xl hover:border-pink-300 hover:shadow-2xl hover:shadow-pink-500/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaInstagram className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Instagram</span>
            </button>
            )}
            
            {/* Facebook - Working */}
            {!isPlatformConnected('facebook') && (
            <button onClick={connectFacebook} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-500/50 rounded-xl hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaFacebook className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Facebook</span>
            </button>
            )}
            
            {/* Telegram - Working */}
            {!isPlatformConnected('telegram') && (
            <button onClick={connectTelegram} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-cyan-500 to-cyan-600 border-2 border-cyan-400/50 rounded-xl hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaTelegram className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Telegram</span>
            </button>
            )}
            
            {/* Slack - Working */}
            {!isPlatformConnected('slack') && (
            <button onClick={connectSlack} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-400/50 rounded-xl hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaSlack className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Slack</span>
            </button>
            )}
            
            {/* Discord - Working */}
            {!isPlatformConnected('discord') && (
            <button onClick={connectDiscord} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-400/50 rounded-xl hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaDiscord className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-bold text-sm text-white">Discord</span>
            </button>
            )}
            
            {/* Reddit - Working */}
            {!isPlatformConnected('reddit') && (
            <button onClick={connectReddit} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-400/50 rounded-xl hover:border-orange-300 hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaReddit className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-bold text-sm text-white">Reddit</span>
            </button>
            )}
            
            {/* YouTube - Working */}
            {!isPlatformConnected('youtube') && (
            <button onClick={connectYouTube} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400/50 rounded-xl hover:border-red-300 hover:shadow-2xl hover:shadow-red-500/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaYoutube className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-bold text-sm text-white">YouTube</span>
            </button>
            )}
            
            {/* TikTok - Working */}
            {!isPlatformConnected('tiktok') && (
            <button onClick={connectTikTok} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600/50 rounded-xl hover:border-gray-500 hover:shadow-2xl hover:shadow-gray-700/50 hover:scale-105 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaTiktok className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-bold text-sm text-white">TikTok</span>
            </button>
            )}
            
            {/* Coming Soon Platforms - Keep Solid Bold Colors */}
            <button onClick={() => handleComingSoon('Pinterest')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400/50 rounded-xl hover:border-red-300 hover:shadow-2xl hover:shadow-red-500/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaPinterest className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Pinterest</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
            
            <button onClick={() => handleComingSoon('WhatsApp')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-400/50 rounded-xl hover:border-green-300 hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaWhatsapp className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">WhatsApp</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
            
            <button onClick={() => handleComingSoon('Snapchat')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-yellow-300/50 rounded-xl hover:border-yellow-200 hover:shadow-2xl hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaSnapchat className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Snapchat</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
            
            <button onClick={() => handleComingSoon('Medium')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700/50 rounded-xl hover:border-gray-600 hover:shadow-2xl hover:shadow-gray-800/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaMedium className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Medium</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
            
            <button onClick={() => handleComingSoon('Twitch')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-purple-600 to-purple-700 border-2 border-purple-500/50 rounded-xl hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-600/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaTwitch className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Twitch</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
            
            <button onClick={() => handleComingSoon('Threads')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800/50 rounded-xl hover:border-gray-700 hover:shadow-2xl hover:shadow-gray-900/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <SiThreads className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Threads</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
            
            <button onClick={() => handleComingSoon('Bluesky')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-sky-400 to-sky-500 border-2 border-sky-300/50 rounded-xl hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-400/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <SiBluesky className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Bluesky</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
            
            <button onClick={() => handleComingSoon('Mastodon')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-indigo-500/50 rounded-xl hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-600/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <SiMastodon className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Mastodon</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
            
            <button onClick={() => handleComingSoon('Tumblr')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-blue-700 to-indigo-800 border-2 border-blue-600/50 rounded-xl hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-700/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaTumblr className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Tumblr</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
            
            <button onClick={() => handleComingSoon('Quora')} className="group relative overflow-hidden flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-red-600 to-red-700 border-2 border-red-500/50 rounded-xl hover:border-red-400 hover:shadow-2xl hover:shadow-red-600/50 hover:scale-105 transition-all duration-200 opacity-75 hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FaQuora className="relative text-4xl text-white drop-shadow-lg" />
              <span className="relative font-semibold text-sm text-white">Quora</span>
              <span className="relative text-xs text-white/80">Coming Soon</span>
            </button>
          </div>
        </div>
        </div>
        </>
      )}

      {activeTab === 'billing' && (
        <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg p-6">
          <BillingSettings />
        </div>
      )}

      {/* Telegram Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Connect Telegram</h3>
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
            className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Connect Slack</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get this from Slack: Your Workspace → Apps → Incoming Webhooks
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Channel Name (Optional)
                </label>
                <input
                  type="text"
                  value={slackChannelName}
                  onChange={(e) => setSlackChannelName(e.target.value)}
                  placeholder="#general"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400"
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
            className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Connect Discord</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="text"
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get this from Discord: Server Settings → Integrations → Webhooks → New Webhook
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Server/Channel Name (Optional)
                </label>
                <input
                  type="text"
                  value={discordServerName}
                  onChange={(e) => setDiscordServerName(e.target.value)}
                  placeholder="My Discord Server"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
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

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl p-6 max-w-md w-full text-center"
          >
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {comingSoonPlatform} Integration
            </h3>
            <p className="text-gray-300 mb-4">
              We're working hard to bring {comingSoonPlatform} integration to you!
            </p>
            <p className="text-sm text-gray-400 mb-6">
              This feature is currently under development. Check back soon for updates or contact support if you'd like to be notified when it's ready.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowComingSoonModal(false)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
