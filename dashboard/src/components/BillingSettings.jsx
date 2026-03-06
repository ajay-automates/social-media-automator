import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import { FaRobot, FaFileAlt, FaUsers } from 'react-icons/fa';

export default function BillingSettings() {
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const response = await api.get('/billing/usage');
      setBillingData(response.data);
    } catch (err) {
      console.error('Error loading billing data:', err);
      showError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await api.post('/billing/portal');
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        showError('Failed to open billing portal');
      }
    } catch (err) {
      console.error('Error opening portal:', err);
      showError('Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-[#111113] border border-white/[0.06] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#111113] border border-white/[0.06] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="text-center py-12">
        <p className="text-[#a1a1aa]">Failed to load billing information</p>
      </div>
    );
  }

  const { plan, subscription, usage } = billingData;
  const isFree = plan && plan.name === 'free';
  
  // Safety checks
  if (!plan || !usage) {
    return (
      <div className="text-center py-12">
        <p className="text-[#52525b]">Failed to load billing information</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getProgressColor = (percentage) => {
    if (percentage === Infinity) return 'bg-green-500';
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLimit = (value) => {
    if (value === Infinity) return '∞';
    return value;
  };

  const calculatePercentage = (used, limit) => {
    if (limit === Infinity || limit === 0) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-[#0a0a0b]/40 border border-[#22d3ee]/30 rounded-2xl p-6 text-white"
      >
        <div className="absolute inset-0 bg-[#111113] from-white/10 via-transparent to-transparent"></div>
        <div className="relative flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">{plan.displayName} Plan</h3>
            <p className="text-[#22d3ee]">${plan.price}/{isFree ? 'free' : 'month'}</p>
          </div>
          <span className="bg-[#18181b] px-4 py-1.5 rounded-full text-sm font-semibold border border-white/30">
            {subscription.status === 'trialing' ? 'Trial' : 'Active'}
          </span>
        </div>
        {!isFree && (
          <div className="relative border-t border-white/[0.08] pt-4">
            <p className="text-sm text-blue-100">
              {subscription.trialEndsAt
                ? `Trial ends on ${formatDate(subscription.trialEndsAt)}`
                : `Next billing: ${formatDate(subscription.currentPeriodEnd)}`}
            </p>
            <button
              onClick={handleManageSubscription}
              className="mt-3 bg-white/90 text-[#0a0a0b] px-5 py-2.5 rounded-lg font-semibold hover:bg-white transition-all"
            >
              Manage Subscription
            </button>
          </div>
        )}
      </motion.div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Posts Usage */}
        <div className="group relative overflow-hidden bg-[#111113] border border-white/[0.06] rounded-xl p-6 hover:border-[#22d3ee]/20 transition-all duration-300">
          <div className="absolute inset-0 bg-[#111113] from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex justify-between items-center mb-4">
            <h4 className="font-semibold text-white">Posts</h4>
            <FaFileAlt className="text-3xl text-[#22d3ee]" />
          </div>
          <div className="relative mb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#a1a1aa]">
                {usage.posts.used} / {formatLimit(usage.posts.limit)}
              </span>
              <span className="text-white font-semibold">
                {usage.posts.remaining}
              </span>
            </div>
            <div className="w-full bg-[#18181b] rounded-full h-2.5 border border-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(
                  calculatePercentage(usage.posts.used, usage.posts.limit)
                )}`}
                style={{
                  width: `${Math.min(100, calculatePercentage(usage.posts.used, usage.posts.limit))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Accounts Usage */}
        <div className="group relative overflow-hidden bg-[#111113] border border-white/[0.06] rounded-xl p-6 hover:border-[#22d3ee]/20 transition-all duration-300">
          <div className="absolute inset-0 bg-[#111113] from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex justify-between items-center mb-4">
            <h4 className="font-semibold text-white">Accounts</h4>
            <FaUsers className="text-3xl text-[#a1a1aa]" />
          </div>
          <div className="relative mb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#a1a1aa]">
                {usage.accounts.used} / {formatLimit(usage.accounts.limit)}
              </span>
            </div>
            <div className="w-full bg-[#18181b] rounded-full h-2.5 border border-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(
                  calculatePercentage(usage.accounts.used, usage.accounts.limit)
                )}`}
                style={{
                  width: `${Math.min(100, calculatePercentage(usage.accounts.used, usage.accounts.limit))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* AI Usage */}
        <div className="group relative overflow-hidden bg-[#111113] border border-white/[0.06] rounded-xl p-6 hover:border-green-400/30 transition-all duration-300">
          <div className="absolute inset-0 bg-[#111113] from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex justify-between items-center mb-4">
            <h4 className="font-semibold text-white">AI Generations</h4>
            <FaRobot className="text-3xl text-green-400" />
          </div>
          <div className="relative mb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#a1a1aa]">
                {usage.ai.used} / {formatLimit(usage.ai.limit)}
              </span>
              <span className="text-white font-semibold">
                {usage.ai.remaining}
              </span>
            </div>
            <div className="w-full bg-[#18181b] rounded-full h-2.5 border border-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(
                  calculatePercentage(usage.ai.used, usage.ai.limit)
                )}`}
                style={{
                  width: `${Math.min(100, calculatePercentage(usage.ai.used, usage.ai.limit))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA for Free Users */}
      {isFree && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden bg-[#22d3ee] rounded-2xl p-6 border border-[#22d3ee]/20"
        >
          <div className="absolute inset-0 bg-[#111113] from-white/5 via-transparent to-transparent"></div>
          <div className="relative">
            <h3 className="text-xl font-bold text-white mb-3">
              ✨ Upgrade to Pro and Unlock All Features
            </h3>
            <p className="text-[#a1a1aa] mb-4">
              Get unlimited posts, AI generations, and more with Pro.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                'Unlimited posts',
                '3 social accounts',
                '100 AI generations/month',
                'CSV bulk upload',
                'All platforms',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-[#a1a1aa]">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="/pricing"
              className="inline-block bg-[#22d3ee] text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
            >
              View Pricing Plans →
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
