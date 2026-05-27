import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import { FaLinkedin, FaTwitter } from 'react-icons/fa';

const SUPPORTED_PLATFORMS = ['linkedin', 'twitter'];

const platformCards = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Publish professional posts and build authority with your personal brand.',
    Icon: FaLinkedin,
    accent: '#0A66C2',
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    description: 'Turn ideas into concise posts and threads for the startup and AI crowd.',
    Icon: FaTwitter,
    accent: '#1DA1F2',
  },
];

export default function ConnectAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected') || params.get('success');
    const error = params.get('error');
    const message = params.get('message');

    if (connected && SUPPORTED_PLATFORMS.includes(connected)) {
      showSuccess(`${formatPlatformName(connected)} connected successfully!`);
      loadAccounts();
      trackFirstAccountMilestone();
      window.history.replaceState({}, '', '/connect-accounts');
    }

    if (error) {
      showError(message || `Failed to connect account: ${error}`);
      window.history.replaceState({}, '', '/connect-accounts');
    }
  }, []);

  const visibleAccounts = accounts.filter(account => SUPPORTED_PLATFORMS.includes(account.platform));

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      const accountsData = response.data?.accounts || response.data || [];
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      console.error('Error loading accounts:', err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const trackFirstAccountMilestone = async () => {
    try {
      const response = await api.get('/accounts');
      const accountsData = response.data?.accounts || response.data || [];
      const currentAccounts = Array.isArray(accountsData) ? accountsData : [];
      if (currentAccounts.filter(account => SUPPORTED_PLATFORMS.includes(account.platform)).length === 1) {
        await api.post('/milestones/track', { milestone_type: 'first_account_connected' });
      }
    } catch {
      // Milestones should never block account connection.
    }
  };

  const connectPlatform = async (platform) => {
    try {
      const response = await api.post(`/auth/${platform}/url`);
      const authUrl = response.data?.authUrl || response.data?.oauthUrl || response.data?.url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        showError(`Failed to generate ${formatPlatformName(platform)} auth URL`);
      }
    } catch (err) {
      console.error(`Error connecting ${platform}:`, err);
      showError(err.response?.data?.error || `Failed to connect ${formatPlatformName(platform)}`);
    }
  };

  const disconnectAccount = async (account) => {
    if (!account?.id || !account?.platform) return;
    if (!confirm(`Disconnect ${formatPlatformName(account.platform)} account "${getAccountLabel(account)}"?`)) return;

    try {
      const response = await api.delete(`/user/accounts/${account.platform}/${account.id}`);
      if (response.data.success) {
        showSuccess(`${formatPlatformName(account.platform)} disconnected successfully`);
        loadAccounts();
      }
    } catch (err) {
      console.error('Error disconnecting account:', err);
      showError(err.response?.data?.error || 'Failed to disconnect account');
    }
  };

  const startEditLabel = (account) => {
    setEditingAccountId(account.id);
    setEditLabel(getAccountLabel(account));
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
      const response = await api.put(`/user/accounts/${accountId}/label`, { label: editLabel.trim() });
      if (response.data.success) {
        showSuccess('Account label updated');
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
      showError('This is already the default account');
      return;
    }

    try {
      const response = await api.put(`/user/accounts/${accountId}/set-default`);
      if (response.data.success) {
        showSuccess('Default account updated');
        loadAccounts();
      }
    } catch (err) {
      console.error('Error setting default account:', err);
      showError(err.response?.data?.error || 'Failed to set default account');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#22d3ee] mb-2">Creator channels</p>
        <h1 className="font-display text-4xl text-white mb-2">Connect LinkedIn and X</h1>
        <p className="text-[#a1a1aa] max-w-2xl">
          This product is now focused on turning ideas and AI news into strong posts for the two channels that matter most for AI and startup creators.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {platformCards.map((platform) => {
          const connectedCount = visibleAccounts.filter(account => account.platform === platform.id).length;
          const Icon = platform.Icon;

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/[0.08]"
                  style={{ background: `${platform.accent}22`, color: platform.accent }}
                >
                  <Icon className="text-2xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h2 className="text-lg font-semibold text-white">{platform.name}</h2>
                    {connectedCount > 0 && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {connectedCount} connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#a1a1aa] mb-5">{platform.description}</p>
                  <button
                    onClick={() => connectPlatform(platform.id)}
                    className="bg-[#22d3ee] text-[#0a0a0b] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#06b6d4] transition-colors"
                  >
                    Connect {platform.name}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Connected Accounts</h2>
            <p className="text-sm text-[#a1a1aa]">Only LinkedIn and X accounts are shown.</p>
          </div>
          <span className="text-sm text-[#52525b]">{visibleAccounts.length} active</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#a1a1aa]">Loading accounts...</div>
        ) : visibleAccounts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-white font-medium mb-1">No creator channels connected yet</p>
            <p className="text-sm text-[#a1a1aa]">Connect LinkedIn or X to start publishing.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {visibleAccounts.map((account) => (
              <div key={account.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-semibold text-white">{formatPlatformName(account.platform)}</span>
                    {account.is_default && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20">
                        Default
                      </span>
                    )}
                  </div>
                  {editingAccountId === account.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        value={editLabel}
                        onChange={(event) => setEditLabel(event.target.value)}
                        className="bg-[#18181b] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:border-[#22d3ee] focus:outline-none"
                      />
                      <button onClick={() => saveLabel(account.id)} className="text-sm text-[#22d3ee]">Save</button>
                      <button onClick={cancelEditLabel} className="text-sm text-[#a1a1aa]">Cancel</button>
                    </div>
                  ) : (
                    <p className="text-sm text-[#a1a1aa]">{getAccountLabel(account)}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditLabel(account)}
                    className="px-3 py-1.5 rounded-lg text-sm text-[#a1a1aa] hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => toggleDefault(account.id, account.is_default)}
                    className="px-3 py-1.5 rounded-lg text-sm text-[#a1a1aa] hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    Make default
                  </button>
                  <button
                    onClick={() => disconnectAccount(account)}
                    className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatPlatformName(platform) {
  if (platform === 'twitter') return 'X / Twitter';
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

function getAccountLabel(account) {
  return account.account_label || account.account_name || account.username || 'Main Account';
}
