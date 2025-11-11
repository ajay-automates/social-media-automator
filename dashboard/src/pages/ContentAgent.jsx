import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import { staggerContainer } from '../utils/animations';
import Card3D from '../components/ui/Card3D';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import {
  FaRobot,
  FaFire,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaCalendar,
  FaMagic,
  FaChartLine,
  FaLightbulb,
  FaClock
} from 'react-icons/fa';

export default function ContentAgent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [brandVoice, setBrandVoice] = useState(null);
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState(null);

  // Generation settings
  const [days, setDays] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin', 'twitter']);
  const [niches, setNiches] = useState(['SaaS', 'AI', 'productivity']);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load generated posts
      const postsRes = await api.get('/content-agent/posts?status=pending');
      if (postsRes.data.success) {
        setGeneratedPosts(postsRes.data.posts);
      }

      // Load brand voice
      const voiceRes = await api.get('/content-agent/brand-voice');
      if (voiceRes.data.success) {
        setBrandVoice(voiceRes.data.brandVoice);
      }

      // Load trends
      const trendsRes = await api.get('/content-agent/trends?limit=10');
      if (trendsRes.data.success) {
        setTrends(trendsRes.data.trends);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/content-agent/generate', {
        days,
        platforms: selectedPlatforms,
        niches
      });

      if (response.data.success) {
        showSuccess(`Generated ${response.data.posts.length} posts!`);
        setGeneratedPosts(response.data.posts);
        setStats(response.data.stats);
        if (response.data.brandVoice) {
          setBrandVoice(response.data.brandVoice);
        }
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (postId) => {
    try {
      const response = await api.post(`/content-agent/approve/${postId}`);
      if (response.data.success) {
        showSuccess('Post approved and scheduled!');
        setGeneratedPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to approve post');
    }
  };

  const handleReject = async (postId) => {
    try {
      const response = await api.delete(`/content-agent/reject/${postId}`);
      if (response.data.success) {
        showSuccess('Post rejected');
        setGeneratedPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to reject post');
    }
  };

  const analyzeBrandVoice = async () => {
    try {
      const response = await api.post('/content-agent/brand-voice/analyze');
      if (response.data.success) {
        setBrandVoice(response.data.brandVoice);
        showSuccess('Brand voice analyzed!');
      } else {
        showError(response.data.message || 'Not enough posts to analyze');
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to analyze brand voice');
    }
  };

  return (
    <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8">
      <AnimatedBackground />

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto space-y-6 relative z-10"
      >
        {/* Header */}
        <motion.div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <FaRobot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                  Content Creation Agent
                </h1>
                <p className="text-gray-400">AI-powered content generation for your social media</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card3D className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Posts Generated</p>
                  <p className="text-3xl font-bold text-white">{stats.postsGenerated}</p>
                </div>
                <FaMagic className="w-8 h-8 text-gray-400" />
              </div>
            </Card3D>

            <Card3D className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Quality Score</p>
                  <p className="text-3xl font-bold text-white">{stats.avgQualityScore}/100</p>
                </div>
                <FaChartLine className="w-8 h-8 text-gray-400" />
              </div>
            </Card3D>

            <Card3D className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Generation Time</p>
                  <p className="text-3xl font-bold text-white">{stats.generationTime}s</p>
                </div>
                <FaClock className="w-8 h-8 text-gray-400" />
              </div>
            </Card3D>

            <Card3D className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Trends Used</p>
                  <p className="text-3xl font-bold text-white">{stats.trendingTopicsUsed}</p>
                </div>
                <FaFire className="w-8 h-8 text-gray-400" />
              </div>
            </Card3D>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Generator */}
          <div className="lg:col-span-2 space-y-6">

            {/* Generator Card */}
            <Card3D gradient="from-gray-800/80 via-gray-900/60 to-black/80" shadowColor="rgba(107, 114, 128, 0.3)" className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaMagic className="text-gray-400" />
                Generate Content Calendar
              </h2>

              <div className="space-y-4">
                {/* Days Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Days
                  </label>
                  <div className="flex gap-2">
                    {[7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          days === d
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {d} days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Platforms
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['linkedin', 'twitter', 'instagram', 'facebook'].map(platform => (
                      <button
                        key={platform}
                        onClick={() => {
                          setSelectedPlatforms(prev =>
                            prev.includes(platform)
                              ? prev.filter(p => p !== platform)
                              : [...prev, platform]
                          );
                        }}
                        className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                          selectedPlatforms.includes(platform)
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Niches */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Niches (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={niches.join(', ')}
                    onChange={(e) => setNiches(e.target.value.split(',').map(n => n.trim()))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., SaaS, AI, productivity"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating {days} days of content...
                    </>
                  ) : (
                    <>
                      <FaMagic />
                      Generate {days}-Day Calendar
                    </>
                  )}
                </button>
              </div>
            </Card3D>

            {/* Generated Posts */}
            <Card3D gradient="from-gray-800/80 via-gray-900/60 to-black/80" shadowColor="rgba(107, 114, 128, 0.3)" className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaCalendar className="text-gray-400" />
                Generated Posts ({generatedPosts.length})
              </h2>

              {generatedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <FaLightbulb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No posts generated yet</p>
                  <p className="text-sm text-gray-500">Click "Generate Calendar" to create AI-powered content</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {generatedPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{post.topic}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Quality: {post.quality_score}/100</span>
                            <span>•</span>
                            <span>Engagement: {post.engagement_prediction}/100</span>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded-full">
                          {post.content_type}
                        </span>
                      </div>

                      {/* Caption Preview */}
                      <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                        {post.caption}
                      </p>

                      {/* Hashtags */}
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.hashtags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="text-xs text-gray-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Platforms & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex gap-2">
                          {post.platforms.map(platform => (
                            <span
                              key={platform}
                              className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded capitalize"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(post.id)}
                            className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded transition-all flex items-center gap-1"
                          >
                            <FaCheckCircle />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(post.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded transition-all flex items-center gap-1"
                          >
                            <FaTimesCircle />
                            Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card3D>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Brand Voice */}
            <Card3D gradient="from-gray-800/80 via-gray-900/60 to-black/80" shadowColor="rgba(107, 114, 128, 0.3)" className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaEdit className="text-gray-400" />
                Brand Voice
              </h2>

              {brandVoice ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Tone</p>
                    <p className="text-white capitalize">{brandVoice.tone}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Formality</p>
                    <p className="text-white">{brandVoice.formality_level}/10</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Length</p>
                    <p className="text-white">{brandVoice.avg_caption_length} chars</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Emoji Usage</p>
                    <p className="text-white">{brandVoice.emoji_usage ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Posts Analyzed</p>
                    <p className="text-white">{brandVoice.analyzed_post_count}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm mb-3">No brand voice analyzed yet</p>
                  <button
                    onClick={analyzeBrandVoice}
                    className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all"
                  >
                    Analyze Now
                  </button>
                </div>
              )}
            </Card3D>

            {/* Trending Topics */}
            <Card3D gradient="from-gray-800/80 via-gray-900/60 to-black/80" shadowColor="rgba(107, 114, 128, 0.3)" className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaFire className="text-gray-400" />
                Trending Topics
              </h2>

              {trends.length > 0 ? (
                <div className="space-y-3">
                  {trends.slice(0, 5).map((trend, index) => (
                    <div
                      key={trend.id}
                      className="p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-white text-sm font-medium flex-1">
                          {trend.trend_topic}
                        </p>
                        <span className="text-xs text-gray-400 ml-2">
                          {trend.trend_score}/100
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 capitalize">
                        {trend.trend_source}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">
                  No trends available
                </p>
              )}
            </Card3D>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
