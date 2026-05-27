import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import api from '../../lib/api';
import { showError, showSuccess } from '../ui/Toast';
import PlatformChip from '../ui/PlatformChip';

const platformNames = {
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter'
};

const workingPlatforms = ['linkedin', 'twitter'];

export default function ConnectAccountsStep() {
  const { nextStep, prevStep, updateProgress } = useOnboarding();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      // Handle different response formats
      const accountsData = response.data?.accounts || response.data || [];
      const accounts = Array.isArray(accountsData)
        ? accountsData.filter(account => workingPlatforms.includes(account.platform))
        : [];
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

  const handlePlatformClick = (platform) => {
    if (isPlatformConnected(platform)) return;

    if (workingPlatforms.includes(platform)) {
      handleOAuthConnect(platform);
    }
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#111113] border border-white/[0.08] rounded-3xl p-8 max-w-4xl w-full my-8"
      >
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a1a1aa] font-semibold">STEP 1 of 3</span>
            <span className="text-sm text-[#a1a1aa]">{connectedAccounts.length} / 2 platforms</span>
          </div>
          <div className="h-2 bg-[#18181b] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(connectedAccounts.length / 2) * 100}%` }}
              className="h-full bg-[#22d3ee]"
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Connect Your Accounts
        </h2>
        <p className="text-[#a1a1aa] mb-8">
          {connectedAccounts.length === 0
            ? 'Connect LinkedIn or X to continue.'
            : `Great! ${connectedAccounts.length} connected. Continue when you are ready.`}
        </p>

        {/* Platform Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#22d3ee]"></div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {workingPlatforms.map((platform, index) => {
              const isConnected = isPlatformConnected(platform);
              return (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PlatformChip
                    platform={platform}
                    selected={isConnected}
                    onClick={() => !isConnected && handlePlatformClick(platform)}
                    size="md"
                  />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={prevStep}
            className="glass border border-white/[0.08] text-[#a1a1aa] px-8 py-4 rounded-xl font-medium hover:bg-[#111113] transition-all"
          >
            ← Back
          </button>
          <button
            onClick={nextStep}
            disabled={!canContinue}
            className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              canContinue
                ? 'bg-[#22d3ee] text-white'
                : 'bg-[#18181b] text-[#a1a1aa] cursor-not-allowed'
            }`}
          >
            <span>{canContinue ? 'Continue' : 'Connect at least 1 platform'}</span>
            {canContinue && <span>→</span>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
