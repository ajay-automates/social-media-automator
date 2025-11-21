import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BillingSettings from '../components/BillingSettings';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';

export default function Settings() {
  const [emailReportsEnabled, setEmailReportsEnabled] = useState(false);
  const [reportEmail, setReportEmail] = useState('');
  const [reportFrequency, setReportFrequency] = useState('weekly');
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      const response = await api.get('/user/profile');
      const user = response.data?.user || response.data;

      setEmailReportsEnabled(user.email_reports_enabled || false);
      setReportEmail(user.report_email || user.email || '');
      setReportFrequency(user.report_frequency || 'weekly');
    } catch (err) {
      console.error('Error loading email settings:', err);
    }
  };

  const saveEmailSettings = async () => {
    setSaving(true);
    try {
      await api.put('/user/email-preferences', {
        email_reports_enabled: emailReportsEnabled,
        report_email: reportEmail,
        report_frequency: reportFrequency
      });

      showSuccess('Email report settings saved!');
    } catch (err) {
      console.error('Error saving settings:', err);
      showError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const sendTestReport = async () => {
    if (!reportEmail || !reportEmail.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }

    setSendingTest(true);
    try {
      await api.post('/reports/test-email', { email: reportEmail });
      showSuccess(`Test email sent to ${reportEmail}! Check your inbox.`);
    } catch (err) {
      console.error('Error sending test:', err);
      const errorMsg = err.response?.data?.error || 'Failed to send test email';
      showError(errorMsg);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-300">Manage your billing and usage</p>
      </div>

      {/* Billing Section */}
      <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg p-6 mb-6">
        <BillingSettings />
      </div>

      {/* Email Reports Section */}
      <div className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-lg border-2 border-white/20 rounded-2xl shadow-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">📧</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Email Reports</h2>
              <p className="text-gray-300">Get weekly analytics summaries delivered to your inbox</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800/40 backdrop-blur-sm border border-white/10 rounded-xl">
              <div>
                <h3 className="font-semibold text-white mb-1">Enable Weekly Reports</h3>
                <p className="text-sm text-gray-400">Receive email summaries of your posting activity</p>
              </div>
              <button
                onClick={() => setEmailReportsEnabled(!emailReportsEnabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${emailReportsEnabled ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${emailReportsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            {emailReportsEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-5"
              >
                {/* Email Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all shadow-lg"
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Report Frequency
                  </label>
                  <select
                    value={reportFrequency}
                    onChange={(e) => setReportFrequency(e.target.value)}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all shadow-lg"
                  >
                    <option value="weekly">Weekly (Every Monday)</option>
                    <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly (1st of each month)</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveEmailSettings}
                    disabled={saving}
                    className="group/btn relative flex-1 bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-xl border-2 border-blue-400/40 text-white px-6 py-3 rounded-xl hover:from-blue-600/50 hover:to-purple-600/50 font-semibold transition-all shadow-xl hover:shadow-blue-500/40 overflow-hidden disabled:opacity-50"
                    title="Save your email report preferences"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    <span className="relative">
                      {saving ? 'Saving...' : '💾 Save Settings'}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={sendTestReport}
                    disabled={sendingTest || !reportEmail}
                    className="group/btn relative flex-1 bg-gray-800/60 backdrop-blur-lg border-2 border-white/20 text-gray-200 px-6 py-3 rounded-xl hover:bg-gray-700/60 font-semibold transition-all shadow-lg overflow-hidden disabled:opacity-50"
                    title="Send a test email to verify your settings"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    <span className="relative">
                      {sendingTest ? 'Sending...' : '✉️ Send Test Email'}
                    </span>
                  </motion.button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-200 flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <span>
                      <strong>What you'll receive:</strong> A beautiful HTML email with your weekly stats, success rates, and top performing platforms. Reports are sent every Monday at 9 AM.
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
