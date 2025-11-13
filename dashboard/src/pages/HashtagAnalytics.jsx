import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHashtag, FaChartBar, FaArrowUp, FaArrowDown, FaFire, FaClock } from 'react-icons/fa';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function HashtagAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [topHashtags, setTopHashtags] = useState([]);
  const [worstHashtags, setWorstHashtags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showAnalyzing, setShowAnalyzing] = useState(false);

  const platforms = ['linkedin', 'twitter', 'instagram', 'facebook', 'reddit', 'telegram', 'tiktok', 'youtube'];
  const platformColors = {
    linkedin: '#0A66C2',
    twitter: '#1DA1F2',
    instagram: '#E1306C',
    facebook: '#1877F2',
    reddit: '#FF4500',
    telegram: '#0088CC',
    tiktok: '#000000',
    youtube: '#FF0000',
    discord: '#5865F2',
    slack: '#E01E5A'
  };

  useEffect(() => {
    loadData();
  }, [selectedPlatform]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAnalytics(),
        loadTopHashtags(),
        loadWorstHashtags(),
        loadSuggestions()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load hashtag analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const params = selectedPlatform ? `?platform=${selectedPlatform}` : '';
      const response = await api.get(`/api/hashtags/analytics${params}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadTopHashtags = async () => {
    try {
      const params = selectedPlatform ? `?platform=${selectedPlatform}&limit=10` : '?limit=10';
      const response = await api.get(`/api/hashtags/top${params}`);
      setTopHashtags(response.data.hashtags || []);
    } catch (error) {
      console.error('Error loading top hashtags:', error);
    }
  };

  const loadWorstHashtags = async () => {
    try {
      const params = selectedPlatform ? `?platform=${selectedPlatform}&limit=8` : '?limit=8';
      const response = await api.get(`/api/hashtags/worst${params}`);
      setWorstHashtags(response.data.hashtags || []);
    } catch (error) {
      console.error('Error loading worst hashtags:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const platform = selectedPlatform || 'linkedin';
      const response = await api.get(`/api/hashtags/suggestions?platform=${platform}`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleAnalyzeTrends = async () => {
    setShowAnalyzing(true);
    try {
      await api.post('/api/hashtags/analyze-trends');
      showSuccess('Trends analyzed successfully!');
      await loadData();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to analyze trends');
    } finally {
      setShowAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
        <AnimatedBackground />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading hashtag analytics...</div>
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
              <FaHashtag className="text-blue-400" />
              Hashtag Analytics
            </h1>
            <p className="text-gray-400">Track and optimize your hashtag performance</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyzeTrends}
            disabled={showAnalyzing}
            className={`px-6 py-3 ${showAnalyzing ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'} text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
          >
            {showAnalyzing ? 'Analyzing...' : 'Analyze Trends'}
          </motion.button>
        </motion.div>

        {/* Platform Filter */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          <button
            onClick={() => setSelectedPlatform(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPlatform === null
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All Platforms
          </button>
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                selectedPlatform === platform
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {platform}
            </button>
          ))}
        </motion.div>

        {/* Stats Cards */}
        {analytics && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Total Hashtags</div>
              <div className="text-3xl font-bold text-white mt-1">{analytics.total_hashtags || 0}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Total Uses</div>
              <div className="text-3xl font-bold text-blue-400 mt-1">{analytics.total_uses || 0}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Avg Success Rate</div>
              <div className="text-3xl font-bold text-green-400 mt-1">
                {analytics.avg_success_rate ? `${analytics.avg_success_rate.toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Total Engagement</div>
              <div className="text-3xl font-bold text-purple-400 mt-1">
                {analytics.total_engagement || 0}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Hashtags */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FaArrowUp className="text-green-400" />
            Top Performing Hashtags
          </h2>

          {topHashtags.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No hashtag data yet. Start posting to see analytics!
            </div>
          ) : (
            <div className="space-y-3">
              {topHashtags.map((hashtag, idx) => (
                <motion.div
                  key={hashtag.hashtag}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-black/30 rounded-lg p-4 border border-green-500/20 hover:border-green-500/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">#{idx + 1}</span>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{hashtag.hashtag}</h4>
                        <p className="text-sm text-gray-400">{hashtag.platform}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{hashtag.success_rate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-400">Success Rate</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Used</span>
                      <div className="text-white font-semibold">{hashtag.times_used}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Successful</span>
                      <div className="text-green-400 font-semibold">{hashtag.successful_posts}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Engagement</span>
                      <div className="text-blue-400 font-semibold">{hashtag.total_engagement || 0}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bottom Section: Worst + Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Worst Hashtags */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FaArrowDown className="text-red-400" />
              Avoid These Hashtags
            </h2>

            {worstHashtags.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No low-performing hashtags yet
              </div>
            ) : (
              <div className="space-y-3">
                {worstHashtags.map((hashtag, idx) => (
                  <motion.div
                    key={hashtag.hashtag}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-black/30 rounded-lg p-4 border border-red-500/20 hover:border-red-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{hashtag.hashtag}</h4>
                        <p className="text-xs text-gray-400">{hashtag.platform}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-red-400 font-bold">{hashtag.success_rate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-400">{hashtag.times_used} uses</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Smart Suggestions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FaFire className="text-yellow-400" />
              Recommended Hashtags
            </h2>

            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No recommendations yet. Build your posting history!
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((hashtag, idx) => (
                  <motion.button
                    key={hashtag}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      navigator.clipboard.writeText(`#${hashtag}`);
                      showSuccess(`Copied #${hashtag}`);
                    }}
                    className="w-full text-left px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all"
                  >
                    <span className="text-white font-semibold">#{hashtag}</span>
                    <span className="text-xs text-gray-400 float-right">Click to copy</span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Performance Breakdown by Platform */}
        {analytics && analytics.platform_breakdown && analytics.platform_breakdown.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Performance by Platform</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400">Platform</th>
                    <th className="text-center py-3 px-4 text-gray-400">Hashtags</th>
                    <th className="text-center py-3 px-4 text-gray-400">Uses</th>
                    <th className="text-center py-3 px-4 text-gray-400">Success Rate</th>
                    <th className="text-right py-3 px-4 text-gray-400">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.platform_breakdown.map((platform, idx) => (
                    <tr key={platform.platform} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white font-semibold capitalize">{platform.platform}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{platform.hashtag_count}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{platform.total_uses}</td>
                      <td className="py-3 px-4 text-center text-green-400">{platform.avg_success_rate.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right text-blue-400">{platform.total_engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
