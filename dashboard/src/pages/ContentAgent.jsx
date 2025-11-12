import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
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
  FaClock,
  FaSync
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

  // Keyword-based generation
  const [customKeyword, setCustomKeyword] = useState('');
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [previewPosts, setPreviewPosts] = useState([]);
  const [previewContext, setPreviewContext] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Trending refresh
  const [trendsRefreshing, setTrendsRefreshing] = useState(false);

  // News agent
  const [news, setNews] = useState({});
  const [newsLoading, setNewsLoading] = useState(false);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState(null);

  // News-based post generation
  const [newsGenerationModal, setNewsGenerationModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [newsPostMode, setNewsPostMode] = useState('single'); // 'single' or 'multiple'
  const [newsPostCount, setNewsPostCount] = useState(3);
  const [newsMultipleAngles, setNewsMultipleAngles] = useState(true);
  const [newsSchedulingMode, setNewsSchedulingMode] = useState('today'); // 'today' or 'spread'
  const [newsSpreadInterval, setNewsSpreadInterval] = useState(1); // days
  const [newsStartDate, setNewsStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newsPostTime, setNewsPostTime] = useState('09:00');
  const [newsGenerating, setNewsGenerating] = useState(false);
  const [newsGeneratedPosts, setNewsGeneratedPosts] = useState([]);
  const [showNewsPostPreview, setShowNewsPostPreview] = useState(false);

  // Post editing
  const [editingPost, setEditingPost] = useState(null);
  const [editingCaption, setEditingCaption] = useState('');
  const [editingHashtags, setEditingHashtags] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Batch operations
  const [selectedPostIds, setSelectedPostIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

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

      // Load trending news
      loadTrendingNews();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingNews = async () => {
    setNewsLoading(true);
    try {
      // Initial load uses cache, refresh=false by default
      const response = await api.get('/news/trending?limit=30');
      if (response.data.success) {
        setNews(response.data.news || {});
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setNewsLoading(false);
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

  // Post editing handlers
  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditingCaption(post.caption);
    setEditingHashtags((post.hashtags || []).join(', '));
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      const { data, error } = await supabase
        .from('content_agent_posts')
        .update({
          caption: editingCaption,
          hashtags: editingHashtags.split(',').map(tag => tag.trim()).filter(tag => tag)
        })
        .eq('id', editingPost.id)
        .select()
        .single();

      if (error) {
        showError(error.message);
        return;
      }

      setGeneratedPosts(prev =>
        prev.map(p => p.id === editingPost.id ? data : p)
      );

      showSuccess('Post updated successfully');
      setShowEditModal(false);
      setEditingPost(null);
    } catch (error) {
      showError('Failed to save edit');
    }
  };

  // Batch operation handlers
  const togglePostSelect = (postId) => {
    const newSelection = new Set(selectedPostIds);
    if (newSelection.has(postId)) {
      newSelection.delete(postId);
    } else {
      newSelection.add(postId);
    }
    setSelectedPostIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPostIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(generatedPosts.map(p => p.id));
      setSelectedPostIds(allIds);
      setSelectAll(true);
    }
  };

  const batchApprove = async () => {
    if (selectedPostIds.size === 0) {
      showError('No posts selected');
      return;
    }

    try {
      let approved = 0;
      for (const postId of selectedPostIds) {
        try {
          await api.post(`/content-agent/approve/${postId}`);
          approved++;
        } catch (error) {
          console.error(`Failed to approve post ${postId}`);
        }
      }

      showSuccess(`Approved ${approved}/${selectedPostIds.size} posts`);
      setGeneratedPosts(prev => prev.filter(p => !selectedPostIds.has(p.id)));
      setSelectedPostIds(new Set());
      setSelectAll(false);
    } catch (error) {
      showError('Failed to batch approve posts');
    }
  };

  const batchReject = async () => {
    if (selectedPostIds.size === 0) {
      showError('No posts selected');
      return;
    }

    try {
      let rejected = 0;
      for (const postId of selectedPostIds) {
        try {
          await api.delete(`/content-agent/reject/${postId}`);
          rejected++;
        } catch (error) {
          console.error(`Failed to reject post ${postId}`);
        }
      }

      showSuccess(`Rejected ${rejected}/${selectedPostIds.size} posts`);
      setGeneratedPosts(prev => prev.filter(p => !selectedPostIds.has(p.id)));
      setSelectedPostIds(new Set());
      setSelectAll(false);
    } catch (error) {
      showError('Failed to batch reject posts');
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

  const handleTrendingClick = (trendTopic) => {
    if (!niches.includes(trendTopic)) {
      setNiches(prev => [...prev, trendTopic]);
      showSuccess(`Added "${trendTopic}" to your niches`);
    }
  };

  const handleGenerateFromKeyword = async () => {
    if (!customKeyword.trim()) {
      showError('Please enter a keyword');
      return;
    }

    setKeywordLoading(true);
    try {
      const response = await api.post('/content-agent/generate-from-keyword', {
        keyword: customKeyword.trim(),
        days,
        platforms: selectedPlatforms
      });

      if (response.data.success) {
        setPreviewPosts(response.data.posts || []);
        setPreviewContext(response.data.trendingContext || '');
        setShowPreview(true);
        showSuccess(`Generated 7-day preview for "${customKeyword}"`);
      }
    } catch (error) {
      showError(error.response?.data?.error || `Failed to generate content for "${customKeyword}"`);
    } finally {
      setKeywordLoading(false);
    }
  };

  const handleApproveKeywordPosts = async () => {
    try {
      // Approve all preview posts
      let approved = 0;
      for (const post of previewPosts) {
        try {
          await api.post(`/content-agent/approve/${post.id}`);
          approved++;
        } catch (error) {
          console.error(`Failed to approve post ${post.id}`);
        }
      }

      showSuccess(`Approved ${approved} posts from keyword "${customKeyword}"`);
      setShowPreview(false);
      setCustomKeyword('');
      setPreviewPosts([]);
      setPreviewContext('');
      await loadData();
    } catch (error) {
      showError('Failed to approve posts');
    }
  };

  const handleRefreshTrends = async () => {
    setTrendsRefreshing(true);
    try {
      // Call monitor trends endpoint to fetch fresh trending data
      const response = await api.post('/content-agent/trends/monitor', {
        niches: niches.length > 0 ? niches : ['general']
      });

      if (response.data.success) {
        // Reload the trends to show updated data
        const trendsRes = await api.get('/content-agent/trends?limit=10');
        if (trendsRes.data.success) {
          setTrends(trendsRes.data.trends);
          showSuccess(`Updated! Found ${trendsRes.data.trends.length} trending topics for today`);
        }
      }
    } catch (error) {
      console.error('Error refreshing trends:', error);
      showError(error.response?.data?.error || 'Failed to refresh trends');
    } finally {
      setTrendsRefreshing(false);
    }
  };

  const handleOpenNewsLink = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleUseNewsForContent = (newsArticle) => {
    // Open news generation modal instead of just setting keyword
    setSelectedArticle(newsArticle);
    setNewsGenerationModal(true);
    showSuccess(`Selected: "${newsArticle.title.substring(0, 50)}..."`);
  };

  const handleGenerateNewsPost = async () => {
    if (!selectedArticle) {
      showError('No article selected');
      return;
    }

    if (newsPostMode === 'single') {
      // Generate single post
      setNewsGenerating(true);
      try {
        const response = await api.post('/news/generate-posts', {
          article: selectedArticle,
          count: 1,
          multipleAngles: false,
          platforms: selectedPlatforms
        });

        if (response.data.success && response.data.posts.length > 0) {
          setNewsGeneratedPosts(response.data.posts);
          setNewsPostMode('options');
          showSuccess(`Generated post in ${response.data.generationTime}s`);
        } else {
          showError('Failed to generate post');
        }
      } catch (error) {
        showError(error.response?.data?.error || 'Error generating post');
      } finally {
        setNewsGenerating(false);
      }
    } else {
      // Generate multiple posts
      setNewsGenerating(true);
      try {
        const response = await api.post('/news/generate-posts', {
          article: selectedArticle,
          count: parseInt(newsPostCount),
          multipleAngles: newsMultipleAngles,
          platforms: selectedPlatforms
        });

        if (response.data.success && response.data.posts.length > 0) {
          setNewsGeneratedPosts(response.data.posts);
          setShowNewsPostPreview(true);
          showSuccess(`Generated ${response.data.count} posts in ${response.data.generationTime}s`);
        } else {
          showError('Failed to generate posts');
        }
      } catch (error) {
        showError(error.response?.data?.error || 'Error generating posts');
      } finally {
        setNewsGenerating(false);
      }
    }
  };

  const handlePostNewsNow = async () => {
    if (newsGeneratedPosts.length === 0) {
      showError('No posts to post');
      return;
    }

    try {
      let posted = 0;

      for (const post of newsGeneratedPosts) {
        try {
          // Post immediately using /post/now endpoint
          const response = await api.post('/post/now', {
            text: post.caption,
            platforms: selectedPlatforms,
            hashtags: post.hashtags,
            video: null
          });

          if (response.data.success) {
            posted++;
          } else {
            console.error(`Failed to post ${post.id}:`, response.data.error);
          }
        } catch (error) {
          console.error(`Failed to post ${post.id}:`, error);
        }
      }

      showSuccess(`Posted ${posted}/${newsGeneratedPosts.length} posts immediately`);
      setNewsGenerationModal(false);
      setSelectedArticle(null);
      setNewsGeneratedPosts([]);
      setShowNewsPostPreview(false);
      setNewsPostMode('single');
      await loadData();
    } catch (error) {
      showError('Failed to post immediately');
    }
  };

  const handleScheduleNewsPosts = async () => {
    if (newsGeneratedPosts.length === 0) {
      showError('No posts to schedule');
      return;
    }

    try {
      let approved = 0;

      // Calculate schedule times based on selected options
      const now = new Date();
      const scheduleTime = new Date(now.getTime() + 30000); // 30 seconds from now by default

      for (let idx = 0; idx < newsGeneratedPosts.length; idx++) {
        const post = newsGeneratedPosts[idx];
        try {
          // Calculate schedule time for this post
          let postScheduleTime = new Date(scheduleTime);

          if (newsSchedulingMode === 'spread' && newsGeneratedPosts.length > 1) {
            // Spread posts across days
            const daysOffset = idx * newsSpreadInterval;
            const [year, month, day] = newsStartDate.split('-');
            const baseDate = new Date(year, month - 1, day);
            const [hours, minutes] = newsPostTime.split(':');
            postScheduleTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + daysOffset, hours, minutes);
          } else {
            // Post all today
            const [hours, minutes] = newsPostTime.split(':');
            postScheduleTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            // If time has passed, schedule for tomorrow
            if (postScheduleTime < now) {
              postScheduleTime.setDate(postScheduleTime.getDate() + 1);
            }
          }

          // Update post with scheduled_time and platforms before approval
          const { data: updatedPost, error: updateError } = await supabase
            .from('content_agent_posts')
            .update({
              scheduled_time: postScheduleTime.toISOString(),
              platforms: selectedPlatforms
            })
            .eq('id', post.id)
            .select()
            .single();

          if (updateError) {
            console.error(`Failed to update post ${post.id}:`, updateError);
            continue;
          }

          // Now approve the post
          await api.post(`/content-agent/approve/${post.id}`);
          approved++;
        } catch (error) {
          console.error(`Failed to approve post ${post.id}:`, error);
        }
      }

      showSuccess(`Scheduled ${approved}/${newsGeneratedPosts.length} posts`);
      setNewsGenerationModal(false);
      setSelectedArticle(null);
      setNewsGeneratedPosts([]);
      setShowNewsPostPreview(false);
      setNewsPostMode('single');
      await loadData();
    } catch (error) {
      showError('Failed to schedule posts');
    }
  };

  const handleRefreshNews = async () => {
    setNewsLoading(true);
    try {
      // Pass refresh=true to bypass cache and get fresh news
      const response = await api.get('/news/trending?limit=30&refresh=true');
      if (response.data.success) {
        setNews(response.data.news || {});
        showSuccess(`Updated! Found ${response.data.total} news articles`);
      }
    } catch (error) {
      showError('Failed to refresh news');
    } finally {
      setNewsLoading(false);
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
            <Card3D hover3D={false} className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Posts Generated</p>
                  <p className="text-3xl font-bold text-white">{stats.postsGenerated}</p>
                </div>
                <FaMagic className="w-8 h-8 text-gray-400" />
              </div>
            </Card3D>

            <Card3D hover3D={false} className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Quality Score</p>
                  <p className="text-3xl font-bold text-white">{stats.avgQualityScore}/100</p>
                </div>
                <FaChartLine className="w-8 h-8 text-gray-400" />
              </div>
            </Card3D>

            <Card3D hover3D={false} className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Generation Time</p>
                  <p className="text-3xl font-bold text-white">{stats.generationTime}s</p>
                </div>
                <FaClock className="w-8 h-8 text-gray-400" />
              </div>
            </Card3D>

            <Card3D hover3D={false} className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
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
            <Card3D hover3D={false} gradient="from-blue-950/40 via-slate-900/40 to-blue-950/40" shadowColor="rgba(30, 58, 138, 0.2)" className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
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

                {/* Custom Keyword Input */}
                <div className="border-t border-white/10 pt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Or Generate from Keyword
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleGenerateFromKeyword()}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="e.g., cricket, technology, AI"
                    />
                    <button
                      onClick={handleGenerateFromKeyword}
                      disabled={keywordLoading || !customKeyword.trim()}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {keywordLoading ? 'Loading...' : 'Preview'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter a single keyword to generate posts with latest Internet data
                  </p>
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
            <Card3D hover3D={false} gradient="from-blue-950/40 via-slate-900/40 to-blue-950/40" shadowColor="rgba(30, 58, 138, 0.2)" className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
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
                <>
                  {/* Batch Actions */}
                  {selectedPostIds.size > 0 && (
                    <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                      <span className="text-sm text-blue-300">{selectedPostIds.size} post{selectedPostIds.size !== 1 ? 's' : ''} selected</span>
                      <div className="flex gap-2">
                        <button
                          onClick={batchApprove}
                          className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded transition-all hover:bg-green-500/30"
                        >
                          Approve All
                        </button>
                        <button
                          onClick={batchReject}
                          className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded transition-all hover:bg-red-500/30"
                        >
                          Reject All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Select All Checkbox */}
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <label className="text-sm text-gray-400 cursor-pointer">Select All</label>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {generatedPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white/5 border rounded-lg p-4 transition-all ${
                        selectedPostIds.has(post.id)
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-white/10'
                      }`}
                    >
                      {/* Post Header with Checkbox */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedPostIds.has(post.id)}
                            onChange={() => togglePostSelect(post.id)}
                            className="w-4 h-4 mt-1 rounded cursor-pointer"
                          />
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">{post.topic}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span>Quality: {post.quality_score}/100</span>
                              <span>•</span>
                              <span>Engagement: {post.engagement_prediction}/100</span>
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded-full">
                          {post.content_type}
                        </span>
                      </div>

                      {/* Caption Preview */}
                      <p className="text-gray-300 text-sm mb-3 line-clamp-3 ml-7">
                        {post.caption}
                      </p>

                      {/* Hashtags */}
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3 ml-7">
                          {post.hashtags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="text-xs text-gray-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Platforms & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10 ml-7">
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
                            onClick={() => handleEditPost(post)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded transition-all hover:bg-blue-500/30 flex items-center gap-1"
                          >
                            <FaEdit />
                            Edit
                          </button>
                          <button
                            onClick={() => handleApprove(post.id)}
                            className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded transition-all hover:bg-green-500/30 flex items-center gap-1"
                          >
                            <FaCheckCircle />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(post.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded transition-all hover:bg-red-500/30 flex items-center gap-1"
                          >
                            <FaTimesCircle />
                            Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                </>
              )}
            </Card3D>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Brand Voice */}
            <Card3D hover3D={false} gradient="from-blue-950/40 via-slate-900/40 to-blue-950/40" shadowColor="rgba(30, 58, 138, 0.2)" className="bg-white/10 backdrop-blur-md border border-white/20 p-6">
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

          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Preview Header */}
              <div className="sticky top-0 bg-slate-900/95 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    7-Day Preview: {customKeyword}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Review generated posts before scheduling
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-6 space-y-6">
                {/* Context Section */}
                {previewContext && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <h3 className="text-cyan-300 font-semibold mb-2">
                      About "{customKeyword}"
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {previewContext}
                    </p>
                  </div>
                )}

                {/* Posts Preview */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">
                    Generated Posts ({previewPosts.length})
                  </h3>
                  <div className="space-y-4">
                    {previewPosts.length > 0 ? (
                      previewPosts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-colors"
                        >
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-semibold">{post.topic}</h4>
                                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                                  Day {index + 1}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>Quality: {post.quality_score}/100</span>
                                <span>•</span>
                                <span>Engagement: {post.engagement_prediction}/100</span>
                                <span>•</span>
                                <span className="capitalize">{post.content_type}</span>
                              </div>
                            </div>
                          </div>

                          {/* Caption */}
                          <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                            {post.caption}
                          </p>

                          {/* Hashtags */}
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {post.hashtags.slice(0, 8).map((tag, i) => (
                                <span key={i} className="text-xs text-cyan-400">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Platforms */}
                          {post.platforms && post.platforms.length > 0 && (
                            <div className="flex gap-2 pt-3 border-t border-white/10">
                              {post.platforms.map((platform) => (
                                <span
                                  key={platform}
                                  className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded capitalize"
                                >
                                  {platform}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No posts generated</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Actions */}
              <div className="sticky bottom-0 bg-slate-900/95 border-t border-white/10 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleApproveKeywordPosts}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-colors flex items-center gap-2"
                >
                  <FaCheckCircle />
                  Schedule All {previewPosts.length} Posts
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Trending News Section */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mt-12 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              📰 Trending News Today
            </h2>
            <button
              onClick={handleRefreshNews}
              disabled={newsLoading}
              className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh news"
            >
              <FaSync className={newsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <p className="text-gray-400 max-w-2xl">
            Real-time news and articles from today's trending topics. Click "Open Link" to read the full article or "Use This" to generate content based on the news.
          </p>

          {newsLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading today's news...</p>
            </div>
          ) : Object.keys(news).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(news).map(([category, categoryData]) => {
                const articles = categoryData?.articles || [];
                if (!articles || articles.length === 0) return null;

                const categoryLabels = {
                  technology: 'Technology & Innovation',
                  business: 'Business & Finance',
                  sports: 'Sports & Entertainment',
                  world: 'World & Politics',
                  lifestyle: 'Lifestyle & Culture'
                };

                const categoryColors = {
                  technology: 'from-purple-500/20 to-blue-500/20 border-purple-500/30',
                  business: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
                  sports: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
                  world: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
                  lifestyle: 'from-pink-500/20 to-rose-500/20 border-pink-500/30'
                };

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gradient-to-br ${categoryColors[category] || categoryColors.technology} backdrop-blur-md border rounded-2xl p-6 space-y-4`}
                  >
                    <h3 className="text-xl font-bold text-white">
                      {categoryLabels[category] || 'News'}
                    </h3>

                    <div className="space-y-3">
                      {articles.slice(0, 2).map((article, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                          <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                            {article.description || article.source}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenNewsLink(article.url)}
                              className="flex-1 px-3 py-1.5 bg-blue-500/30 text-blue-300 text-xs rounded hover:bg-blue-500/50 transition-all flex items-center justify-center gap-1"
                            >
                              <span>🔗</span> Open
                            </button>
                            <button
                              onClick={() => handleUseNewsForContent(article)}
                              className="flex-1 px-3 py-1.5 bg-cyan-500/30 text-cyan-300 text-xs rounded hover:bg-cyan-500/50 transition-all flex items-center justify-center gap-1"
                            >
                              <span>✨</span> Use
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {article.source}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-400">No news available yet. Click refresh to load today's trending news.</p>
            </div>
          )}
        </motion.div>

        {/* News Generation Modal */}
        {newsGenerationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setNewsGenerationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-slate-900/95 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  📰 Generate Posts from News
                </h2>
                <button
                  onClick={() => setNewsGenerationModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Article Info */}
                {selectedArticle && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <h3 className="text-cyan-300 font-semibold mb-2">Selected Article</h3>
                    <p className="text-white font-medium">{selectedArticle.title}</p>
                    <p className="text-gray-400 text-sm mt-2">{selectedArticle.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Source: {selectedArticle.source}</p>
                  </div>
                )}

                {/* Single Post Preview */}
                {newsPostMode === 'options' && newsGeneratedPosts.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-bold text-white">Quick Preview</h3>
                    <div>
                      <p className="text-gray-300 text-sm mb-3">{newsGeneratedPosts[0].caption}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {newsGeneratedPosts[0].hashtags?.slice(0, 6).map((tag, i) => (
                          <span key={i} className="text-xs text-cyan-400">{tag}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded">Quality: {newsGeneratedPosts[0].quality_score}/100</span>
                        <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded">Engagement: {newsGeneratedPosts[0].engagement_prediction}/100</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <button
                        onClick={() => {setNewsPostMode('multiple'); setNewsGeneratedPosts([]);}}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                      >
                        Generate More Posts
                      </button>
                    </div>
                  </div>
                )}

                {/* Generate Options */}
                {(newsPostMode === 'single' || (newsPostMode === 'multiple' && newsGeneratedPosts.length === 0)) && (
                  <div className="space-y-4">
                    {newsPostMode === 'single' ? (
                      <div className="text-center py-6 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 mb-4">Ready to generate a quick post?</p>
                        <button
                          onClick={handleGenerateNewsPost}
                          disabled={newsGenerating}
                          className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                        >
                          {newsGenerating ? '⏳ Generating...' : '✨ Generate Post (3-5s)'}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Number of Posts</label>
                          <select
                            value={newsPostCount}
                            onChange={(e) => setNewsPostCount(parseInt(e.target.value))}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          >
                            {[3, 5, 7, 10].map(num => <option key={num} value={num}>{num} posts</option>)}
                          </select>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="multiAngles"
                            checked={newsMultipleAngles}
                            onChange={(e) => setNewsMultipleAngles(e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor="multiAngles" className="text-sm text-gray-300">
                            Different angles (educational, opinion, news, case study, etc.)
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Scheduling</label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="scheduling"
                                value="today"
                                checked={newsSchedulingMode === 'today'}
                                onChange={(e) => setNewsSchedulingMode(e.target.value)}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-300">Post all today</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="scheduling"
                                value="spread"
                                checked={newsSchedulingMode === 'spread'}
                                onChange={(e) => setNewsSchedulingMode(e.target.value)}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-300">Spread across days</span>
                            </label>
                          </div>

                          {newsSchedulingMode === 'spread' && (
                            <div className="mt-3 space-y-2 ml-6">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Interval (days)</label>
                                <select
                                  value={newsSpreadInterval}
                                  onChange={(e) => setNewsSpreadInterval(parseInt(e.target.value))}
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white"
                                >
                                  {[1, 2, 3].map(days => <option key={days} value={days}>Every {days} day(s)</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={newsStartDate}
                                  onChange={(e) => setNewsStartDate(e.target.value)}
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Time</label>
                                <input
                                  type="time"
                                  value={newsPostTime}
                                  onChange={(e) => setNewsPostTime(e.target.value)}
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={handleGenerateNewsPost}
                          disabled={newsGenerating}
                          className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all disabled:opacity-50"
                        >
                          {newsGenerating ? `⏳ Generating ${newsPostCount} posts...` : `✨ Generate ${newsPostCount} Posts`}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Platform Selection */}
                {(newsPostMode === 'options' || showNewsPostPreview) && newsGeneratedPosts.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Post to Platforms</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['linkedin', 'twitter', 'facebook', 'instagram', 'tiktok'].map(platform => (
                        <button
                          key={platform}
                          onClick={() => {
                            setSelectedPlatforms(prev =>
                              prev.includes(platform)
                                ? prev.filter(p => p !== platform)
                                : [...prev, platform]
                            );
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            selectedPlatforms.includes(platform)
                              ? 'bg-cyan-600 text-white border border-cyan-400'
                              : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {platform === 'linkedin' && '💼'}
                          {platform === 'twitter' && '𝕏'}
                          {platform === 'facebook' && '👍'}
                          {platform === 'instagram' && '📷'}
                          {platform === 'tiktok' && '🎵'}
                          {' ' + platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Multiple Posts */}
                {showNewsPostPreview && newsGeneratedPosts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Generated Posts ({newsGeneratedPosts.length})</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {newsGeneratedPosts.map((post, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <p className="text-sm text-white mb-2">{post.caption}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.hashtags?.slice(0, 5).map((tag, i) => (
                              <span key={i} className="text-xs text-cyan-400">{tag}</span>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500">Quality: {post.quality_score}/100 | Engagement: {post.engagement_prediction}/100</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="sticky bottom-0 bg-slate-900/95 border-t border-white/10 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => setNewsGenerationModal(false)}
                  className="px-6 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                {(newsPostMode === 'options' || showNewsPostPreview) && newsGeneratedPosts.length > 0 && (
                  <>
                    <button
                      onClick={handlePostNewsNow}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      🚀 Post Now
                    </button>
                    <button
                      onClick={handleScheduleNewsPosts}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      <FaCheckCircle />
                      Schedule {newsGeneratedPosts.length} Post{newsGeneratedPosts.length !== 1 ? 's' : ''}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Post Edit Modal */}
        <AnimatePresence>
          {showEditModal && editingPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900/95 border border-white/20 rounded-2xl w-full max-w-2xl shadow-2xl"
              >
                {/* Modal Header */}
                <div className="bg-slate-900/95 border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FaEdit className="text-blue-400" />
                      Edit Post
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {editingPost.topic}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Current Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-xs text-gray-400 uppercase mb-1">Quality Score</p>
                      <p className="text-xl font-bold text-white">{editingPost.quality_score}/100</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-xs text-gray-400 uppercase mb-1">Engagement Prediction</p>
                      <p className="text-xl font-bold text-white">{editingPost.engagement_prediction}/100</p>
                    </div>
                  </div>

                  {/* Content Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Content Type
                    </label>
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 capitalize">
                      {editingPost.content_type}
                    </div>
                  </div>

                  {/* Caption Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Caption ({editingCaption.length} characters)
                    </label>
                    <textarea
                      value={editingCaption}
                      onChange={(e) => setEditingCaption(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="6"
                      placeholder="Edit your post caption..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tip: Keep captions concise and engaging for better performance
                    </p>
                  </div>

                  {/* Hashtags Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hashtags (comma-separated)
                    </label>
                    <textarea
                      value={editingHashtags}
                      onChange={(e) => setEditingHashtags(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="3"
                      placeholder="e.g., #AI, #Technology, #Innovation"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current hashtags: {editingHashtags.split(',').filter(t => t.trim()).length}
                    </p>
                  </div>

                  {/* Platforms Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Posting Platforms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {editingPost.platforms && editingPost.platforms.map(platform => (
                        <span
                          key={platform}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm capitalize flex items-center gap-1"
                        >
                          {platform === 'linkedin' && '💼'}
                          {platform === 'twitter' && '𝕏'}
                          {platform === 'facebook' && '👍'}
                          {platform === 'instagram' && '📷'}
                          {platform === 'tiktok' && '🎵'}
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Created Info */}
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-xs text-gray-400">
                    <p>Created: {new Date(editingPost.created_at).toLocaleDateString()} at {new Date(editingPost.created_at).toLocaleTimeString()}</p>
                    {editingPost.source && <p>Source: {editingPost.source}</p>}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="sticky bottom-0 bg-slate-900/95 border-t border-white/10 px-6 py-4 flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <FaCheckCircle />
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
