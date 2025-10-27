import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';

export default function Settings() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      const accountsData = response.data?.accounts || response.data || [];
      setAccounts(accountsData);
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
      // This should redirect to OAuth flow
      window.location.href = '/api/auth/linkedin';
    } catch (err) {
      showError('Failed to connect LinkedIn');
    }
  };

  const connectTwitter = async () => {
    try {
      window.location.href = '/api/auth/twitter';
    } catch (err) {
      showError('Failed to connect Twitter');
    }
  };

  const connectTelegram = async () => {
    try {
      // Open modal for Telegram bot setup
      showError('Telegram setup - entering bot token required');
    } catch (err) {
      showError('Failed to connect Telegram');
    }
  };

  const disconnectAccount = async (accountId) => {
    try {
      await api.delete(`/accounts/${accountId}`);
      showSuccess('Account disconnected');
      loadAccounts();
    } catch (err) {
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
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(account => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {account.platform === 'linkedin' && '🔗'}
                    {account.platform === 'twitter' && '🐦'}
                    {account.platform === 'telegram' && '📱'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                    </div>
                    <div className="text-sm text-gray-600">{account.username || account.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => disconnectAccount(account.id)}
                  className="text-red-600 hover:text-red-700 font-medium transition"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Connect Buttons */}
        {accounts.length > 0 && (
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
          </div>
        )}
      </div>

      {/* Billing Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Billing</h2>
        <p className="text-gray-600 mb-4">Manage your subscription and billing information.</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Manage Billing
        </motion.button>
      </div>
    </motion.div>
  );
}
