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
        report_frequency: reportFrequency,
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
      showError(err.response?.data?.error || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white mb-1">Settings</h1>
        <p className="text-[#a1a1aa] text-sm">Manage your account preferences and billing</p>
      </div>

      <div className="space-y-4">
        {/* Billing Section */}
        <section className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
          <BillingSettings />
        </section>

        {/* Email Reports Section */}
        <section className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="14" height="14" fill="none" stroke="#22d3ee" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Email Reports</h2>
              <p className="text-sm text-[#a1a1aa]">Receive analytics summaries delivered to your inbox</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggle row */}
            <div className="flex items-center justify-between p-4 bg-[#18181b] border border-white/[0.06] rounded-xl">
              <div>
                <p className="text-sm font-medium text-white">Enable weekly reports</p>
                <p className="text-xs text-[#52525b] mt-0.5">Receive email summaries of your posting activity</p>
              </div>
              <button
                onClick={() => setEmailReportsEnabled(!emailReportsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  emailReportsEnabled ? 'bg-[#22d3ee]' : 'bg-[#111113]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    emailReportsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {emailReportsEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Email input */}
                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#18181b] border border-white/[0.06] text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-[#52525b] focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors"
                  />
                </div>

                {/* Frequency select */}
                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Report frequency</label>
                  <select
                    value={reportFrequency}
                    onChange={(e) => setReportFrequency(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/[0.06] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors"
                  >
                    <option value="weekly">Weekly (Every Monday)</option>
                    <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly (1st of each month)</option>
                  </select>
                </div>

                {/* Info box */}
                <div className="flex items-start gap-2.5 p-3.5 bg-[#22d3ee]/[0.04] border border-[#22d3ee]/[0.12] rounded-lg">
                  <svg width="14" height="14" fill="none" stroke="#22d3ee" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    You'll receive a weekly summary with your posting stats, success rates, and top-performing platforms — sent every Monday at 9 AM.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={saveEmailSettings}
                    disabled={saving}
                    className="flex-1 bg-[#22d3ee] text-[#0a0a0b] text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#06b6d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save settings'}
                  </button>
                  <button
                    onClick={sendTestReport}
                    disabled={sendingTest || !reportEmail}
                    className="flex-1 bg-white/[0.06] border border-white/[0.08] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white/[0.1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingTest ? 'Sending...' : 'Send test email'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
