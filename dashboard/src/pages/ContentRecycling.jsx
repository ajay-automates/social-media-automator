import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaRecycle, FaCog, FaHistory, FaPlay, FaChartLine, FaCheckCircle, FaClock } from 'react-icons/fa';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import PlatformChip from '../components/ui/PlatformChip';

export default function ContentRecycling() {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [recyclablePosts, setRecyclablePosts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [recycling, setRecycling] = useState(false);
  const [autoRecycling, setAutoRecycling] = useState(false);
  const [activeTab, setActiveTab] = useState('recyclable'); // 'recyclable' or 'history'

  // Settings state
  const [autoRecycleEnabled, setAutoRecycleEnabled] = useState(false);
  const [minimumAgeDays, setMinimumAgeDays] = useState(30);
  const [minimumSuccessRate, setMinimumSuccessRate] = useState(80);
  const [maxRecyclesPerPost, setMaxRecyclesPerPost] = useState(3);
  const [recycleIntervalDays, setRecycleIntervalDays] = useState(90);
  const [frequency, setFrequency] = useState('weekly');
  const [postsPerCycle, setPostsPerCycle] = useState(3);
  const [allowedPlatforms, setAllowedPlatforms] = useState(['linkedin', 'twitter']);

  const allPlatforms = ['linkedin', 'twitter', 'reddit', 'telegram', 'tiktok', 'youtube'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadSettings(),
        loadRecyclablePosts(),
        loadHistory()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/content-recycling/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.get('/content-recycling/settings');
      const s = response.data.settings;
      setSettings(s);
      
      // Update state
      setAutoRecycleEnabled(s.auto_recycle_enabled);
      setMinimumAgeDays(s.minimum_age_days);
      setMinimumSuccessRate(s.minimum_success_rate);
      setMaxRecyclesPerPost(s.max_recycles_per_post);
      setRecycleIntervalDays(s.recycle_interval_days);
      setFrequency(s.frequency);
      setPostsPerCycle(s.posts_per_cycle);
      setAllowedPlatforms(s.allowed_platforms || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadRecyclablePosts = async () => {
    try {
      const response = await api.get('/content-recycling/posts?limit=20');
      setRecyclablePosts(response.data.posts);
    } catch (error) {
      console.error('Error loading recyclable posts:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/content-recycling/history?limit=50');
      setHistory(response.data.history);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await api.put('/content-recycling/settings', {
        auto_recycle_enabled: autoRecycleEnabled,
        minimum_age_days: minimumAgeDays,
        minimum_success_rate: minimumSuccessRate,
        max_recycles_per_post: maxRecyclesPerPost,
        recycle_interval_days: recycleIntervalDays,
        frequency,
        posts_per_cycle: postsPerCycle,
        allowed_platforms: allowedPlatforms
      });

      showSuccess('Settings saved successfully!');
      setShowSettings(false);
      await loadData();
    } catch (error) {
      console.error('Error saving settings:', error);
      showError(error.response?.data?.error || 'Failed to save settings');
    }
  };

  const handleRecyclePost = async (postId) => {
    if (!confirm('Recycle this post? It will be scheduled to post again soon.')) {
      return;
    }

    setRecycling(true);
    try {
      await api.post(`/content-recycling/recycle/${postId}`);
      showSuccess('Post recycled successfully!');
      await loadData();
    } catch (error) {
      console.error('Error recycling post:', error);
      showError(error.response?.data?.error || 'Failed to recycle post');
    } finally {
      setRecycling(false);
    }
  };

  const handleAutoRecycle = async () => {
    if (!confirm('Trigger auto-recycle now? This will schedule your best posts based on your settings.')) {
      return;
    }

    setAutoRecycling(true);
    try {
      const response = await api.post('/content-recycling/auto-recycle');
      const { recycledCount, errorCount } = response.data;
      showSuccess(`Auto-recycled ${recycledCount} posts successfully!${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
      await loadData();
    } catch (error) {
      console.error('Error in auto-recycle:', error);
      showError(error.response?.data?.error || 'Failed to auto-recycle');
    } finally {
      setAutoRecycling(false);
    }
  };

  const togglePlatform = (platform) => {
    if (allowedPlatforms.includes(platform)) {
      setAllowedPlatforms(allowedPlatforms.filter(p => p !== platform));
    } else {
      setAllowedPlatforms([...allowedPlatforms, platform]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#22d3ee] mx-auto mb-4"></div>
          <p className="text-[#a1a1aa]">Loading Content Recycling...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 py-8 px-4 relative">
      

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-5xl">♻️</div>
              <div>
                <h1 className="text-4xl font-bold text-white">Content Recycling Engine</h1>
                <p className="text-[#a1a1aa] mt-1">Automatically repost your best-performing content</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#18181b] border border-[#22d3ee]/20 rounded-lg text-white hover:bg-white/[0.1] transition"
            >
              <FaCog />
              Settings
            </motion.button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111113] border border-[#22d3ee]/20 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <FaChartLine className="text-3xl text-[#a1a1aa]" />
                <div className="text-sm text-[#a1a1aa]">Available to Recycle</div>
              </div>
              <div className="text-4xl font-bold text-white">{stats.availableToRecycle}</div>
              <div className="text-xs text-[#52525b] mt-1">Posts ready to repost</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#111113] border border-green-400/30 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <FaCheckCircle className="text-3xl text-green-400" />
                <div className="text-sm text-[#a1a1aa]">Total Recycled</div>
              </div>
              <div className="text-4xl font-bold text-white">{stats.totalRecycled}</div>
              <div className="text-xs text-[#52525b] mt-1">All-time recycled posts</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#111113] border border-[#22d3ee]/20 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <FaClock className="text-3xl text-[#22d3ee]" />
                <div className="text-sm text-[#a1a1aa]">Recent (30 days)</div>
              </div>
              <div className="text-4xl font-bold text-white">{stats.recentRecycled}</div>
              <div className="text-xs text-[#52525b] mt-1">Posts recycled recently</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#111113] border border-orange-400/30 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <FaPlay className="text-3xl text-orange-400" />
                <div className="text-sm text-[#a1a1aa]">Auto-Recycle</div>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.autoRecycleEnabled ? `${stats.frequency} (${stats.postsPerCycle} posts)` : 'Disabled'}
              </div>
              <div className="text-xs text-[#52525b] mt-1">Automation status</div>
            </motion.div>
          </div>
        )}

        {/* Auto-Recycle Trigger */}
        <div className="mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAutoRecycle}
            disabled={autoRecycling || recyclablePosts.length === 0}
            className="w-full bg-[#22d3ee] text-white py-4 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {autoRecycling ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Auto-Recycling...
              </>
            ) : (
              <>
                <FaPlay />
                Trigger Auto-Recycle Now
              </>
            )}
          </motion.button>
          <p className="text-center text-[#a1a1aa] text-sm mt-2">
            Manually trigger auto-recycle to schedule your best posts immediately
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('recyclable')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              activeTab === 'recyclable'
                ? 'bg-[#06b6d4] text-white'
                : 'bg-[#18181b] text-[#a1a1aa] hover:bg-white/[0.1]'
            }`}
          >
            <FaRecycle className="inline mr-2" />
            Recyclable Posts ({recyclablePosts.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              activeTab === 'history'
                ? 'bg-[#06b6d4] text-white'
                : 'bg-[#18181b] text-[#a1a1aa] hover:bg-white/[0.1]'
            }`}
          >
            <FaHistory className="inline mr-2" />
            Recycling History ({history.length})
          </button>
        </div>

        {/* Recyclable Posts */}
        {activeTab === 'recyclable' && (
          <div className="space-y-4">
            {recyclablePosts.length === 0 ? (
              <div className="bg-[#18181b] border border-white/[0.06] rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Recyclable Posts Found</h3>
                <p className="text-[#a1a1aa] mb-4">
                  You need posts that are {settings?.minimum_age_days || 30}+ days old with {settings?.minimum_success_rate || 80}% success rate
                </p>
                <p className="text-[#52525b] text-sm">
                  Adjust your settings to see more recyclable posts
                </p>
              </div>
            ) : (
              recyclablePosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#18181b] border border-white/[0.06] rounded-xl p-6 hover:border-[#22d3ee]/30 transition"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-[#a1a1aa] mb-4">{post.text.substring(0, 200)}{post.text.length > 200 ? '...' : ''}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(Array.isArray(post.platforms) ? post.platforms : [post.platforms]).map(platform => (
                          <PlatformChip key={platform} platform={platform} />
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-[#a1a1aa] mb-1">Success Rate</div>
                          <div className="text-green-400 font-bold text-lg">{post.success_rate}%</div>
                        </div>
                        <div>
                          <div className="text-[#a1a1aa] mb-1">Days Since Post</div>
                          <div className="text-[#22d3ee] font-bold text-lg">{Math.floor(post.days_since_last_recycle)}</div>
                        </div>
                        <div>
                          <div className="text-[#a1a1aa] mb-1">Times Recycled</div>
                          <div className="text-[#a1a1aa] font-bold text-lg">{post.times_recycled}</div>
                        </div>
                        <div>
                          <div className="text-[#a1a1aa] mb-1">Posted Date</div>
                          <div className="text-[#a1a1aa] text-sm">{new Date(post.posted_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRecyclePost(post.id)}
                      disabled={recycling}
                      className="px-6 py-3 bg-[#22d3ee] text-white rounded-lg font-semibold transition disabled:opacity-50 whitespace-nowrap"
                    >
                      <FaRecycle className="inline mr-2" />
                      Recycle Now
                    </motion.button>
                  </div>

                  {post.image_url && (
                    <div className="mt-4">
                      <img src={post.image_url} alt="Post" className="rounded-lg max-h-48 object-cover" />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Recycling History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="bg-[#18181b] border border-white/[0.06] rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Recycling History</h3>
                <p className="text-[#a1a1aa]">
                  Your recycled posts will appear here
                </p>
              </div>
            ) : (
              history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#18181b] border border-white/[0.06] rounded-xl p-6"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.trigger_type === 'automatic' 
                            ? 'bg-[#22d3ee]/10 text-[#a1a1aa]' 
                            : 'bg-[#22d3ee]/10 text-[#22d3ee]'
                        }`}>
                          {item.trigger_type === 'automatic' ? '🤖 Auto' : '👆 Manual'}
                        </span>
                        <span className="text-[#a1a1aa] text-sm">
                          Recycled {new Date(item.recycled_at).toLocaleDateString()}
                        </span>
                      </div>

                      {item.original_post && (
                        <>
                          <p className="text-[#a1a1aa] mb-3">
                            {item.original_post.text.substring(0, 150)}{item.original_post.text.length > 150 ? '...' : ''}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.recycled_platforms.map(platform => (
                              <PlatformChip key={platform} platform={platform} />
                            ))}
                          </div>
                        </>
                      )}

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-[#a1a1aa] mb-1">Original Success</div>
                          <div className="text-green-400 font-bold">{item.original_success_rate}%</div>
                        </div>
                        <div>
                          <div className="text-[#a1a1aa] mb-1">Originally Posted</div>
                          <div className="text-[#a1a1aa] text-sm">{new Date(item.original_posted_at).toLocaleDateString()}</div>
                        </div>
                        {item.recycled_post && (
                          <div>
                            <div className="text-[#a1a1aa] mb-1">Status</div>
                            <div className={`text-sm font-semibold ${
                              item.recycled_post.status === 'posted' ? 'text-green-400' :
                              item.recycled_post.status === 'scheduled' ? 'text-[#22d3ee]' :
                              'text-yellow-400'
                            }`}>
                              {item.recycled_post.status.toUpperCase()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111113] border border-white/[0.06] rounded-xl p-8 w-full max-w-3xl my-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Recycling Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[#a1a1aa] hover:text-[#a1a1aa] text-3xl transition"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Auto-Recycle Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#18181b] rounded-lg border border-[#22d3ee]/20">
                <div>
                  <label className="text-lg font-semibold text-white">Enable Auto-Recycle</label>
                  <p className="text-sm text-[#a1a1aa]">Automatically schedule your best posts to be recycled</p>
                </div>
                <button
                  onClick={() => setAutoRecycleEnabled(!autoRecycleEnabled)}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                    autoRecycleEnabled ? 'bg-[#06b6d4]' : 'bg-[#18181b]'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      autoRecycleEnabled ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Recycling Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-4 py-3 bg-[#18181b] text-white border border-white/[0.06] rounded-lg focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Posts per Cycle */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Posts per Cycle: {postsPerCycle}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={postsPerCycle}
                  onChange={(e) => setPostsPerCycle(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-[#52525b] mt-1">How many posts to recycle each cycle</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Minimum Age */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Minimum Age (days): {minimumAgeDays}
                  </label>
                  <input
                    type="range"
                    min="7"
                    max="180"
                    value={minimumAgeDays}
                    onChange={(e) => setMinimumAgeDays(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-[#52525b] mt-1">Posts must be this old to recycle</p>
                </div>

                {/* Minimum Success Rate */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Min Success Rate: {minimumSuccessRate}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={minimumSuccessRate}
                    onChange={(e) => setMinimumSuccessRate(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-[#52525b] mt-1">Minimum success rate to qualify</p>
                </div>

                {/* Max Recycles */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Max Recycles: {maxRecyclesPerPost}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={maxRecyclesPerPost}
                    onChange={(e) => setMaxRecyclesPerPost(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-[#52525b] mt-1">Maximum times to recycle a post</p>
                </div>

                {/* Recycle Interval */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Interval (days): {recycleIntervalDays}
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="365"
                    value={recycleIntervalDays}
                    onChange={(e) => setRecycleIntervalDays(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-[#52525b] mt-1">Wait between recycling same post</p>
                </div>
              </div>

              {/* Allowed Platforms */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-3">
                  Allowed Platforms
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {allPlatforms.map(platform => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        allowedPlatforms.includes(platform)
                          ? 'bg-[#06b6d4] text-white'
                          : 'bg-[#18181b] text-[#a1a1aa]'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#52525b] mt-2">Posts will only be recycled on selected platforms</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={saveSettings}
                  className="flex-1 bg-[#22d3ee] text-white py-3 rounded-lg font-bold transition"
                >
                  Save Settings
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSettings(false)}
                  className="px-8 bg-[#18181b] text-white py-3 rounded-lg font-semibold hover:bg-[#18181b] transition"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

