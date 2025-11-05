import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
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

export default function ConnectAccounts() {
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
    
    // Handle successful connections
    if (connected && success) {
      showSuccess(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
      loadAccounts();
      window.history.replaceState({}, '', '/connect-accounts');
    } else if (params.get('instagram') === 'connected') {
      showSuccess('Instagram connected successfully!');
      loadAccounts();
      window.history.replaceState({}, '', '/connect-accounts');
    } else if (params.get('facebook') === 'connected') {
      showSuccess('Facebook connected successfully!');
      loadAccounts();
      window.history.replaceState({}, '', '/connect-accounts');
    }
    
    // Handle errors
    if (error) {
      const errorMessage = message || `Failed to connect platform: ${error}`;
      showError(errorMessage);
      window.history.replaceState({}, '', '/connect-accounts');
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
      const response = await api.post('/auth/twitter/url');
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        showError('Failed to generate Twitter auth URL');
      }
    } catch (err) {
      console.error('Error connecting Twitter:', err);
      showError(err.response?.data?.error || 'Failed to connect Twitter');
    }
  };

  const connectInstagram = async () => {
    try {
      const response = await api.post('/auth/instagram/url');
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        showError('Failed to generate Instagram auth URL');
      }
    } catch (err) {
      console.error('Error connecting Instagram:', err);
      showError(err.response?.data?.error || 'Failed to connect Instagram');
    }
  };

  const connectFacebook = async () => {
    try {
      const response = await api.post('/auth/facebook/url');
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        showError('Failed to generate Facebook auth URL');
      }
    } catch (err) {
      console.error('Error connecting Facebook:', err);
      showError(err.response?.data?.error || 'Failed to connect Facebook');
    }
  };

  const connectReddit = async () => {
    try {
      const response = await api.post('/auth/reddit/url');
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
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
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        showError('Failed to generate YouTube auth URL');
      }
    } catch (err) {
      console.error('Error connecting YouTube:', err);
      showError(err.response?.data?.error || 'Failed to connect YouTube');
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

  const connectTelegram = () => {
    setShowTelegramModal(true);
  };

  const connectSlack = () => {
    setShowSlackModal(true);
  };

  const connectDiscord = () => {
    setShowDiscordModal(true);
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
      await api.post('/accounts/telegram', {
        bot_token: telegramBotToken,
        chat_id: telegramChatId
      });
      
      showSuccess('Telegram connected successfully!');
      setShowTelegramModal(false);
      setTelegramBotToken('');
      setTelegramChatId('');
      loadAccounts();
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
      await api.post('/accounts/slack', {
        webhook_url: slackWebhookUrl,
        channel_name: slackChannelName || 'general'
      });
      
      showSuccess('Slack connected successfully!');
      setShowSlackModal(false);
      setSlackWebhookUrl('');
      setSlackChannelName('');
      loadAccounts();
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
      await api.post('/accounts/discord', {
        webhook_url: discordWebhookUrl,
        server_name: discordServerName || 'My Server'
      });
      
      showSuccess('Discord connected successfully!');
      setShowDiscordModal(false);
      setDiscordWebhookUrl('');
      setDiscordServerName('');
      loadAccounts();
    } catch (err) {
      console.error('Error connecting Discord:', err);
      showError(err.response?.data?.error || 'Failed to connect Discord');
    }
  };

  const disconnectAccount = async (account) => {
    if (!account || !account.id) {
      console.error('No account or ID provided for disconnection');
      return;
    }
    
    if (!confirm(`Are you sure you want to disconnect your ${account.platform} account?`)) {
      return;
    }

    try {
      await api.delete(`/accounts/${account.id}`);
      showSuccess(`${account.platform} disconnected successfully!`);
      loadAccounts();
    } catch (err) {
      console.error('Error disconnecting account:', err);
      const errorMsg = err.response?.data?.error || 'Failed to disconnect account';
      showError(errorMsg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Connect Accounts</h1>
        <p className="text-gray-300">Connect your social media accounts to start posting</p>
      </div>

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
            <p className="text-gray-400 mb-2 text-lg font-medium">No accounts connected yet</p>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="Enter your Telegram bot token"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Enter your Telegram chat ID"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTelegramConnect}
                className="flex-1 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setShowTelegramModal(false)}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-medium"
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
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Channel Name (Optional)
                </label>
                <input
                  type="text"
                  value={slackChannelName}
                  onChange={(e) => setSlackChannelName(e.target.value)}
                  placeholder="e.g., general"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSlackConnect}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setShowSlackModal(false)}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-medium"
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
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Server Name (Optional)
                </label>
                <input
                  type="text"
                  value={discordServerName}
                  onChange={(e) => setDiscordServerName(e.target.value)}
                  placeholder="e.g., My Server"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-medium"
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
            className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl p-8 max-w-md w-full text-center"
          >
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-white mb-2">{comingSoonPlatform} Integration</h3>
            <p className="text-gray-300 mb-6">
              We're working hard to bring {comingSoonPlatform} integration to you soon. Stay tuned for updates!
            </p>
            <button
              onClick={() => setShowComingSoonModal(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Got it!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

