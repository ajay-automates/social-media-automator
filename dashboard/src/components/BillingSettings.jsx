import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';

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
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load billing information</p>
      </div>
    );
  }

  const { plan, subscription, usage } = billingData;
  const isFree = plan.name === 'free';

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
        className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">{plan.displayName} Plan</h3>
            <p className="text-blue-100">${plan.price}/{isFree ? 'free' : 'month'}</p>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
            {subscription.status === 'trialing' ? 'Trial' : 'Active'}
          </span>
        </div>
        {!isFree && (
          <div className="border-t border-white/20 pt-4">
            <p className="text-sm text-blue-100">
              {subscription.trialEndsAt
                ? `Trial ends on ${formatDate(subscription.trialEndsAt)}`
                : `Next billing: ${formatDate(subscription.currentPeriodEnd)}`}
            </p>
            <button
              onClick={handleManageSubscription}
              className="mt-3 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Manage Subscription
            </button>
          </div>
        )}
      </motion.div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Posts Usage */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900">Posts</h4>
            <span className="text-2xl">📝</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                {usage.posts.used} / {formatLimit(usage.posts.limit)}
              </span>
              <span className="text-gray-900 font-semibold">
                {usage.posts.remaining}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(
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
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900">Accounts</h4>
            <span className="text-2xl">🔗</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                {usage.accounts.used} / {formatLimit(usage.accounts.limit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(
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
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900">AI Generations</h4>
            <span className="text-2xl">🤖</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                {usage.ai.used} / {formatLimit(usage.ai.limit)}
              </span>
              <span className="text-gray-900 font-semibold">
                {usage.ai.remaining}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(
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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Upgrade to Pro and Unlock All Features
          </h3>
          <p className="text-gray-700 mb-4">
            Get unlimited posts, AI generations, and more with Pro.
          </p>
          <ul className="space-y-2 mb-4">
            {[
              'Unlimited posts',
              '3 social accounts',
              '100 AI generations/month',
              'CSV bulk upload',
              'All platforms',
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="/pricing"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105"
          >
            View Pricing Plans
          </a>
        </div>
      )}
    </div>
  );
}
