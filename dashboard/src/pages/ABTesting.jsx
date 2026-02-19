import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVial, FaPlus, FaTrash, FaClock, FaCheck, FaTimes, FaChartBar, FaEye } from 'react-icons/fa';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import PlatformChip from '../components/ui/PlatformChip';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ABTesting() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [expandedTest, setExpandedTest] = useState(null);
  const [insights, setInsights] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    test_type: 'caption',
    platforms: [],
    test_duration_hours: 48,
    variations: [
      { name: 'A', caption: '', hashtags: '', schedule_time: '' },
      { name: 'B', caption: '', hashtags: '', schedule_time: '' }
    ]
  });

  const allPlatforms = ['linkedin', 'twitter', 'reddit', 'telegram', 'tiktok', 'youtube', 'discord', 'slack'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTests(),
        loadInsights()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async () => {
    try {
      const response = await api.get('/api/ab-tests');
      setTests(response.data.tests || []);
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await api.get('/api/ab-tests/insights');
      setInsights(response.data);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      showError('Test name is required');
      return;
    }

    if (formData.platforms.length === 0) {
      showError('Select at least one platform');
      return;
    }

    if (formData.variations.some(v => !v.caption.trim())) {
      showError('All variations must have a caption');
      return;
    }

    try {
      const payload = {
        ...formData,
        platforms: formData.platforms,
        variations: formData.variations.map((v, i) => ({
          name: String.fromCharCode(65 + i),
          caption: v.caption,
          hashtags: v.hashtags ? v.hashtags.split(',').map(h => h.trim()) : [],
          schedule_time: v.schedule_time ? new Date(v.schedule_time).toISOString() : null
        }))
      };

      await api.post('/api/ab-tests', payload);
      showSuccess('A/B test created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to create test');
    }
  };

  const handleDeclareWinner = async (testId, variationId) => {
    try {
      await api.post(`/api/ab-tests/${testId}/declare-winner`, { variation_id: variationId });
      showSuccess('Winner declared! Variation will be reused.');
      await loadData();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to declare winner');
    }
  };

  const handleCancelTest = async (testId) => {
    if (!window.confirm('Are you sure you want to cancel this test?')) return;

    try {
      await api.post(`/api/ab-tests/${testId}/cancel`);
      showSuccess('Test cancelled successfully');
      await loadData();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to cancel test');
    }
  };

  const addVariation = () => {
    if (formData.variations.length < 5) {
      setFormData({
        ...formData,
        variations: [
          ...formData.variations,
          { name: String.fromCharCode(65 + formData.variations.length), caption: '', hashtags: '', schedule_time: '' }
        ]
      });
    }
  };

  const removeVariation = (index) => {
    if (formData.variations.length > 2) {
      setFormData({
        ...formData,
        variations: formData.variations.filter((_, i) => i !== index)
      });
    }
  };

  const updateVariation = (index, field, value) => {
    const updated = [...formData.variations];
    updated[index][field] = value;
    setFormData({ ...formData, variations: updated });
  };

  const togglePlatform = (platform) => {
    setFormData({
      ...formData,
      platforms: formData.platforms.includes(platform)
        ? formData.platforms.filter(p => p !== platform)
        : [...formData.platforms, platform]
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      test_type: 'caption',
      platforms: [],
      test_duration_hours: 48,
      variations: [
        { name: 'A', caption: '', hashtags: '', schedule_time: '' },
        { name: 'B', caption: '', hashtags: '', schedule_time: '' }
      ]
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors.active;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
        <AnimatedBackground />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading A/B tests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <FaVial className="text-purple-400" />
              A/B Testing
            </h1>
            <p className="text-gray-400">Test content variations to optimize engagement</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            <FaPlus /> Create Test
          </motion.button>
        </motion.div>

        {/* Insights Cards */}
        {insights && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Total Tests</div>
              <div className="text-3xl font-bold text-white mt-1">{insights.total_tests || 0}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Active</div>
              <div className="text-3xl font-bold text-green-400 mt-1">{insights.active_tests || 0}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Completed</div>
              <div className="text-3xl font-bold text-blue-400 mt-1">{insights.completed_tests || 0}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Avg Winner Lift</div>
              <div className="text-3xl font-bold text-purple-400 mt-1">
                {insights.avg_winner_lift ? `${insights.avg_winner_lift}%` : 'N/A'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tests List */}
        {tests.length === 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
          >
            <FaVial className="text-5xl text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No A/B tests yet</h3>
            <p className="text-gray-400 mb-6">Create your first test to start comparing content variations</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <FaPlus /> Create Test
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {tests.map((test, idx) => (
              <motion.div
                key={test.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{test.name}</h3>
                      {test.description && (
                        <p className="text-gray-400 text-sm mb-3">{test.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(test.status)}`}>
                          {test.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {test.variation_count} variations
                        </span>
                        <span className="text-xs text-gray-400">
                          {test.test_duration_hours} hours
                        </span>
                        <div className="flex gap-2">
                          {test.platforms?.map(p => (
                            <PlatformChip key={p} platform={p} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedTest === test.id ? 180 : 0 }}
                      className="text-gray-400"
                    >
                      <FaChartBar />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedTest === test.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 bg-black/20 p-6"
                    >
                      {/* Variations */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-white mb-3">Variations</h4>
                        <div className="space-y-3">
                          {test.variations?.map((variation, vidx) => (
                            <div key={variation.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-white">
                                  Variation {variation.variation_name}
                                </span>
                                {variation.is_winner && (
                                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-500/30">
                                    ⭐ WINNER
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-400 text-sm mb-2">{variation.caption}</p>
                              {variation.hashtags && variation.hashtags.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  Hashtags: {variation.hashtags.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      {test.status === 'active' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleCancelTest(test.id)}
                            className="flex-1 px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <FaTimes className="inline mr-2" /> Cancel Test
                          </button>
                        </div>
                      )}

                      {test.status === 'completed' && (
                        <div className="flex gap-3">
                          {test.variations?.map(variation => (
                            <button
                              key={variation.id}
                              onClick={() => handleDeclareWinner(test.id, variation.id)}
                              disabled={variation.is_winner}
                              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                variation.is_winner
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30 cursor-default'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                              }`}
                            >
                              <FaCheck className="inline mr-2" /> Apply Variation {variation.variation_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Test Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-900 border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-96 overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Create A/B Test</h2>

              {/* Test Name */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-2">Test Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Caption A vs B"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What are you testing?"
                  rows="2"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                />
              </div>

              {/* Platforms */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">Select Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {allPlatforms.map(platform => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        formData.platforms.includes(platform)
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-2">Test Duration (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="336"
                  value={formData.test_duration_hours}
                  onChange={(e) => setFormData({ ...formData, test_duration_hours: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>

              {/* Variations */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-white">Variations</label>
                  {formData.variations.length < 5 && (
                    <button
                      onClick={addVariation}
                      className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      + Add
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {formData.variations.map((variation, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-white font-semibold">Variation {String.fromCharCode(65 + idx)}</span>
                        {formData.variations.length > 2 && (
                          <button
                            onClick={() => removeVariation(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={variation.caption}
                        onChange={(e) => updateVariation(idx, 'caption', e.target.value)}
                        placeholder="Caption text"
                        rows="2"
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white placeholder-gray-500 text-sm mb-2"
                      />
                      <input
                        type="text"
                        value={variation.hashtags}
                        onChange={(e) => updateVariation(idx, 'hashtags', e.target.value)}
                        placeholder="Hashtags (comma-separated)"
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white placeholder-gray-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50"
                >
                  Create Test
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
