import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaPlus, FaEdit, FaTrash, FaVial, FaHistory, FaCog, FaCheck, FaTimes, FaCopy } from 'react-icons/fa';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import PlatformChip from '../components/ui/PlatformChip';

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [activeTab, setActiveTab] = useState('webhooks'); // 'webhooks' or 'logs'
  const [testing, setTesting] = useState(null);
  
  // Available events and platforms
  const [availableEvents, setAvailableEvents] = useState([]);
  const allPlatforms = ['linkedin', 'twitter', 'reddit', 'telegram', 'tiktok', 'youtube'];

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    enabled: true,
    events: ['post.success', 'post.failed'],
    platforms: [],
    secret: '',
    retry_enabled: true,
    max_retries: 3,
    retry_delay_seconds: 5
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadWebhooks(),
        loadLogs(),
        loadEvents()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const loadWebhooks = async () => {
    try {
      const response = await api.get('/webhooks');
      setWebhooks(response.data.webhooks);
      
      const statsResponse = await api.get('/webhooks/stats');
      setStats(statsResponse.data.stats);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await api.get('/webhooks/logs?limit=100');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await api.get('/webhooks/events');
      setAvailableEvents(response.data.events);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      showError('Name and URL are required');
      return;
    }

    try {
      await api.post('/webhooks', formData);
      showSuccess('Webhook created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to create webhook');
    }
  };

  const handleEdit = async () => {
    if (!selectedWebhook) return;

    try {
      await api.put(`/webhooks/${selectedWebhook.id}`, formData);
      showSuccess('Webhook updated successfully!');
      setShowEditModal(false);
      setSelectedWebhook(null);
      resetForm();
      await loadData();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update webhook');
    }
  };

  const handleDelete = async (webhookId) => {
    if (!confirm('Delete this webhook? This action cannot be undone.')) return;

    try {
      await api.delete(`/webhooks/${webhookId}`);
      showSuccess('Webhook deleted successfully!');
      await loadData();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete webhook');
    }
  };

  const handleTest = async (webhookId, webhookName) => {
    setTesting(webhookId);
    try {
      const response = await api.post(`/webhooks/${webhookId}/test`);
      if (response.data.success) {
        showSuccess(`Test webhook sent to ${webhookName}! Check your endpoint.`);
      } else {
        showError(`Test failed: ${response.data.error || 'Unknown error'}`);
      }
      await loadLogs(); // Refresh logs
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to test webhook');
    } finally {
      setTesting(null);
    }
  };

  const toggleEvent = (event) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const openEditModal = (webhook) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      enabled: webhook.enabled,
      events: webhook.events || [],
      platforms: webhook.platforms || [],
      secret: webhook.secret || '',
      retry_enabled: webhook.retry_enabled,
      max_retries: webhook.max_retries,
      retry_delay_seconds: webhook.retry_delay_seconds
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      enabled: true,
      events: ['post.success', 'post.failed'],
      platforms: [],
      secret: '',
      retry_enabled: true,
      max_retries: 3,
      retry_delay_seconds: 5
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-[#38383a] border-t-[#0a84ff] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#98989d] font-medium">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] py-8 px-4">
      <AnimatedBackground />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3" style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
              letterSpacing: '-0.5px'
            }}>
              🔔 Webhooks
            </h1>
            <p className="text-[#98989d] mt-2 text-sm font-medium">
              Connect to Zapier, Make, and 1000+ apps
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="ios-button flex items-center gap-2"
          >
            <FaPlus />
            Add Webhook
          </motion.button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1c1c1e] border border-[#38383a] rounded-xl p-6"
          >
            <div className="text-[#98989d] text-sm font-semibold uppercase tracking-wide mb-2">Total Webhooks</div>
            <div className="text-4xl font-bold text-white">{webhooks.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1c1c1e] border border-[#38383a] rounded-xl p-6"
          >
            <div className="text-[#98989d] text-sm font-semibold uppercase tracking-wide mb-2">Active</div>
            <div className="text-4xl font-bold text-[#0a84ff]">{webhooks.filter(w => w.enabled).length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1c1c1e] border border-[#38383a] rounded-xl p-6"
          >
            <div className="text-[#98989d] text-sm font-semibold uppercase tracking-wide mb-2">Total Triggers</div>
            <div className="text-4xl font-bold text-white">
              {stats.reduce((sum, s) => sum + (s.total_triggers || 0), 0)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1c1c1e] border border-[#38383a] rounded-xl p-6"
          >
            <div className="text-[#98989d] text-sm font-semibold uppercase tracking-wide mb-2">Success Rate</div>
            <div className="text-4xl font-bold text-[#32d74b]">
              {stats.length > 0 
                ? Math.round(stats.reduce((sum, s) => sum + (s.success_rate || 0), 0) / stats.length)
                : 0}%
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'webhooks'
                ? 'bg-[#0a84ff] text-white'
                : 'bg-[#3a3a3c] text-[#98989d] hover:bg-[#48484a]'
            }`}
          >
            <FaBell className="inline mr-2" />
            Webhooks ({webhooks.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'logs'
                ? 'bg-[#0a84ff] text-white'
                : 'bg-[#3a3a3c] text-[#98989d] hover:bg-[#48484a]'
            }`}
          >
            <FaHistory className="inline mr-2" />
            Logs ({logs.length})
          </button>
        </div>

        {/* Webhooks List */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            {webhooks.length === 0 ? (
              <div className="bg-[#1c1c1e] border border-[#38383a] rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-xl font-bold text-white mb-2">No Webhooks Configured</h3>
                <p className="text-[#98989d] mb-6">
                  Create a webhook to get notifications in Zapier, Slack, Discord, or any other service
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="ios-button"
                >
                  <FaPlus className="inline mr-2" />
                  Create Your First Webhook
                </button>
              </div>
            ) : (
              webhooks.map((webhook, index) => {
                const stat = stats.find(s => s.id === webhook.id);
                
                return (
                  <motion.div
                    key={webhook.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#1c1c1e] border border-[#38383a] rounded-xl p-6 hover:border-[#48484a] transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-white">{webhook.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            webhook.enabled 
                              ? 'bg-[#32d74b]/20 text-[#32d74b]' 
                              : 'bg-[#636366]/20 text-[#98989d]'
                          }`}>
                            {webhook.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <code className="bg-[#2c2c2e] border border-[#38383a] px-3 py-1.5 rounded-lg text-sm text-[#0a84ff] font-mono">
                            {webhook.url.length > 60 ? webhook.url.substring(0, 60) + '...' : webhook.url}
                          </code>
                          <button
                            onClick={() => copyToClipboard(webhook.url)}
                            className="text-[#98989d] hover:text-white transition p-1.5"
                            title="Copy URL"
                          >
                            <FaCopy />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-[#98989d] text-xs font-semibold uppercase tracking-wide mb-1">Events</div>
                            <div className="text-white font-bold">{webhook.events?.length || 0}</div>
                          </div>
                          <div>
                            <div className="text-[#98989d] text-xs font-semibold uppercase tracking-wide mb-1">Total Triggers</div>
                            <div className="text-white font-bold">{stat?.total_triggers || 0}</div>
                          </div>
                          <div>
                            <div className="text-[#98989d] text-xs font-semibold uppercase tracking-wide mb-1">Success Rate</div>
                            <div className="text-[#32d74b] font-bold">{stat?.success_rate || 0}%</div>
                          </div>
                        </div>

                        {webhook.events && webhook.events.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {webhook.events.map(event => (
                              <span 
                                key={event}
                                className="px-2.5 py-1 bg-[#2c2c2e] border border-[#38383a] rounded-md text-xs text-[#98989d]"
                              >
                                {event}
                              </span>
                            ))}
                          </div>
                        )}

                        {webhook.platforms && webhook.platforms.length > 0 && (
                          <div>
                            <div className="text-[#98989d] text-xs font-semibold uppercase tracking-wide mb-2">Platform Filter:</div>
                            <div className="flex flex-wrap gap-2">
                              {webhook.platforms.map(platform => (
                                <PlatformChip key={platform} platform={platform} size="xs" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTest(webhook.id, webhook.name)}
                          disabled={testing === webhook.id}
                          className="ios-button-secondary px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          {testing === webhook.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Testing...
                            </>
                          ) : (
                            <>
                              <FaVial />
                              Test
                            </>
                          )}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openEditModal(webhook)}
                          className="ios-button-secondary px-4 py-2 text-sm flex items-center gap-2"
                        >
                          <FaEdit />
                          Edit
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(webhook.id)}
                          className="bg-[#ff453a] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#ff6259] transition flex items-center gap-2"
                        >
                          <FaTrash />
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="bg-[#1c1c1e] border border-[#38383a] rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-bold text-white mb-2">No Webhook Logs</h3>
                <p className="text-[#98989d]">
                  Webhook activity will appear here once they start triggering
                </p>
              </div>
            ) : (
              logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`bg-[#1c1c1e] border rounded-xl p-4 ${
                    log.success 
                      ? 'border-[#32d74b]/30' 
                      : 'border-[#ff453a]/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          log.success 
                            ? 'bg-[#32d74b]/20 text-[#32d74b]' 
                            : 'bg-[#ff453a]/20 text-[#ff453a]'
                        }`}>
                          {log.success ? '✓ SUCCESS' : '✗ FAILED'}
                        </span>
                        <span className="text-[#98989d] text-sm">{log.event_type}</span>
                        <span className="text-[#636366] text-xs">
                          {new Date(log.sent_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-[#98989d] text-xs mb-1">Status Code</div>
                          <div className="text-white font-semibold">{log.status_code || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-[#98989d] text-xs mb-1">Response Time</div>
                          <div className="text-white font-semibold">{log.response_time_ms || 0}ms</div>
                        </div>
                        <div>
                          <div className="text-[#98989d] text-xs mb-1">Attempt</div>
                          <div className="text-white font-semibold">
                            {log.attempt_number}{log.is_retry && ' (retry)'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#98989d] text-xs mb-1">Post ID</div>
                          <div className="text-white font-semibold">{log.post_id || 'Test'}</div>
                        </div>
                      </div>

                      {log.error_message && (
                        <div className="mt-3 p-3 bg-[#ff453a]/10 border border-[#ff453a]/30 rounded-lg">
                          <div className="text-[#ff453a] text-sm font-mono">{log.error_message}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <WebhookModal
        show={showCreateModal || showEditModal}
        isEdit={showEditModal}
        formData={formData}
        setFormData={setFormData}
        availableEvents={availableEvents}
        allPlatforms={allPlatforms}
        toggleEvent={toggleEvent}
        togglePlatform={togglePlatform}
        onSave={showEditModal ? handleEdit : handleCreate}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedWebhook(null);
          resetForm();
        }}
      />
    </div>
  );
}

// Webhook Modal Component
function WebhookModal({ show, isEdit, formData, setFormData, availableEvents, allPlatforms, toggleEvent, togglePlatform, onSave, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 ios-modal-overlay flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ios-modal max-w-2xl w-full my-8"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
        }}
      >
        <div className="ios-modal-header">
          <div className="flex items-center justify-between">
            <h2 className="ios-modal-title">{isEdit ? 'Edit' : 'Create'} Webhook</h2>
            <button onClick={onClose} className="text-[#98989d] hover:text-white transition p-2">
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        <div className="ios-modal-content space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="ios-filter-label">Webhook Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Zapier Success Hook"
              className="ios-input"
            />
          </div>

          {/* URL */}
          <div>
            <label className="ios-filter-label">Webhook URL *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://hooks.zapier.com/..."
              className="ios-input font-mono text-sm"
            />
            <p className="text-xs text-[#636366] mt-1">Must start with http:// or https://</p>
          </div>

          {/* Events */}
          <div>
            <label className="ios-filter-label">Trigger Events ({formData.events.length} selected)</label>
            <div className="grid grid-cols-1 gap-2">
              {availableEvents.map(event => (
                <button
                  key={event.value}
                  onClick={() => toggleEvent(event.value)}
                  className={`text-left px-4 py-3 rounded-lg border transition ${
                    formData.events.includes(event.value)
                      ? 'bg-[#0a84ff]/20 border-[#0a84ff] text-white'
                      : 'bg-[#2c2c2e] border-[#38383a] text-[#98989d] hover:bg-[#3a3a3c]'
                  }`}
                >
                  <div className="font-semibold text-sm">{event.label}</div>
                  <div className="text-xs opacity-70 mt-1">{event.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Platform Filter */}
          <div>
            <label className="ios-filter-label">Platform Filter (optional)</label>
            <p className="text-xs text-[#636366] mb-3">Leave empty to trigger for all platforms</p>
            <div className="flex flex-wrap gap-2">
              {allPlatforms.map(platform => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`ios-platform-chip ${formData.platforms.includes(platform) ? 'selected' : ''}`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Secret */}
          <div>
            <label className="ios-filter-label">Secret (optional)</label>
            <input
              type="text"
              value={formData.secret}
              onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
              placeholder="Your secret key for HMAC signature"
              className="ios-input font-mono text-sm"
            />
            <p className="text-xs text-[#636366] mt-1">For verifying webhook authenticity (HMAC SHA256)</p>
          </div>

          {/* Retry Settings */}
          <div className="bg-[#2c2c2e] border border-[#38383a] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <label className="text-white font-semibold">Enable Retry on Failure</label>
              <button
                onClick={() => setFormData(prev => ({ ...prev, retry_enabled: !prev.retry_enabled }))}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                  formData.retry_enabled ? 'bg-[#0a84ff]' : 'bg-[#48484a]'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                    formData.retry_enabled ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.retry_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[#98989d] text-xs font-semibold mb-1 block">Max Retries</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.max_retries}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_retries: parseInt(e.target.value) }))}
                    className="ios-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-[#98989d] text-xs font-semibold mb-1 block">Delay (seconds)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.retry_delay_seconds}
                    onChange={(e) => setFormData(prev => ({ ...prev, retry_delay_seconds: parseInt(e.target.value) }))}
                    className="ios-input text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              className="flex-1 ios-button"
            >
              {isEdit ? 'Update' : 'Create'} Webhook
            </button>
            <button
              onClick={onClose}
              className="flex-1 ios-button-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

