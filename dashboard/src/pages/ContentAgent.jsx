import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { showSuccess, showError } from '../components/ui/Toast';
import { staggerContainer } from '../utils/animations';
import PlatformChip from '../components/ui/PlatformChip';
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
import BrandVoiceCard from '../components/BrandVoiceCard';

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
  const [newsLastRefreshed, setNewsLastRefreshed] = useState(null);
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
        setNewsLastRefreshed(new Date());
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
      // Pass refresh=true to bypass cache and get FRESH news articles every time
      const response = await api.get('/news/trending?limit=30&refresh=true');
      if (response.data.success) {
        setNews(response.data.news || {});
        setNewsLastRefreshed(new Date());
        showSuccess(`✅ Fresh articles loaded! Found ${response.data.total} trending stories`);
      } else {
        showError('Failed to fetch news');
      }
    } catch (error) {
      console.error('News refresh error:', error);
      showError('Could not refresh news. Please try again.');
    } finally {
      setNewsLoading(false);
    }
  };

  return (
    <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8">
      

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto space-y-6 relative z-10"
      >
        {/* Header */}
        <motion.div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                <FaRobot className="w-8 h-8 text-cyan-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a0a0b] animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                  Content Creation Agent
                </h1>
                <p className="text-[#a1a1aa]">AI-powered content generation for your social media</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a1a1aa] text-sm">Posts Generated</p>
                  <p className="text-3xl font-bold text-white">{stats.postsGenerated}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <FaMagic className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a1a1aa] text-sm">Avg Quality Score</p>
                  <p className="text-3xl font-bold text-white">{stats.avgQualityScore}/100</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <FaChartLine className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a1a1aa] text-sm">Generation Time</p>
                  <p className="text-3xl font-bold text-white">{stats.generationTime}s</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <FaClock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a1a1aa] text-sm">Trends Used</p>
                  <p className="text-3xl font-bold text-white">{stats.trendingTopicsUsed}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-500/10">
                  <FaFire className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Generator */}
          <div className="lg:col-span-2 space-y-6">

            {/* Generator Card */}
            <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaMagic className="text-purple-400" />
                Generate Content Calendar
              </h2>

              <div className="space-y-4">
                {/* Days Selector */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Number of Days
                  </label>
                  <div className="flex gap-2">
                    {[7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                          days === d
                            ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md shadow-purple-500/20'
                            : 'bg-[#18181b] border border-white/[0.06] text-[#a1a1aa] hover:text-white hover:border-white/[0.12]'
                        }`}
                      >
                        {d} days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Platforms
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['linkedin', 'twitter', 'tiktok', 'telegram', 'slack', 'discord', 'reddit', 'devto', 'mastodon', 'bluesky'].map(platform => (
                      <PlatformChip
                        key={platform}
                        platform={platform}
                        selected={selectedPlatforms.includes(platform)}
                        onClick={() => {
                          setSelectedPlatforms(prev =>
                            prev.includes(platform)
                              ? prev.filter(p => p !== platform)
                              : [...prev, platform]
                          );
                        }}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>

                {/* Niches */}
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Your Niches (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={niches.join(', ')}
                    onChange={(e) => setNiches(e.target.value.split(',').map(n => n.trim()))}
                    className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#22d3ee]/20"
                    placeholder="e.g., SaaS, AI, productivity"
                  />
                </div>

                {/* Custom Keyword Input */}
                <div className="border-t border-white/[0.06] pt-4">
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2 flex items-center gap-1.5">
                    <FaLightbulb className="text-amber-400" size={12} />
                    Or Generate from Keyword
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleGenerateFromKeyword()}
                      className="flex-1 px-4 py-2 bg-[#18181b] border border-white/[0.06] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
                      placeholder="e.g., cricket, technology, AI"
                    />
                    <button
                      onClick={handleGenerateFromKeyword}
                      disabled={keywordLoading || !customKeyword.trim()}
                      className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      {keywordLoading ? 'Loading...' : 'Preview'}
                    </button>
                  </div>
                  <p className="text-xs text-[#52525b] mt-2">
                    Enter a single keyword to generate posts with latest Internet data
                  </p>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
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
            </div>

            {/* Generated Posts */}
            <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaCalendar className="text-cyan-400" />
                Generated Posts ({generatedPosts.length})
              </h2>

              {generatedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <FaLightbulb className="w-7 h-7 text-purple-400" />
                  </div>
                  <p className="text-white font-medium mb-1">No posts generated yet</p>
                  <p className="text-sm text-[#52525b]">Click "Generate Calendar" to create AI-powered content</p>
                </div>
              ) : (
                <>
                  {/* Batch Actions */}
                  {selectedPostIds.size > 0 && (
                    <div className="mb-4 p-4 bg-[#22d3ee]/10 border border-[#22d3ee]/20 rounded-lg flex items-center justify-between">
                      <span className="text-sm text-[#22d3ee]">{selectedPostIds.size} post{selectedPostIds.size !== 1 ? 's' : ''} selected</span>
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
                    <label className="text-sm text-[#a1a1aa] cursor-pointer">Select All</label>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {generatedPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-[#18181b] border rounded-lg p-4 transition-all ${
                        selectedPostIds.has(post.id)
                          ? 'border-[#22d3ee]/50 bg-[#22d3ee]/10'
                          : 'border-white/[0.06]'
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
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                post.quality_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                post.quality_score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>Q: {post.quality_score}</span>
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                                E: {post.engagement_prediction}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20 capitalize">
                          {post.content_type}
                        </span>
                      </div>

                      {/* Caption Preview */}
                      <p className="text-[#a1a1aa] text-sm mb-3 line-clamp-3 ml-7">
                        {post.caption}
                      </p>

                      {/* Hashtags */}
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3 ml-7">
                          {post.hashtags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="text-xs text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Platforms & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] ml-7">
                        <div className="flex gap-2">
                          {post.platforms.map(platform => (
                            <span
                              key={platform}
                              className="px-2 py-1 bg-[#18181b] text-[#a1a1aa] text-xs rounded capitalize"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="px-3 py-1 bg-[#22d3ee]/10 text-[#22d3ee] text-sm rounded transition-all hover:bg-[#22d3ee]/15 flex items-center gap-1"
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
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Brand Voice - Train My Voice */}
            <BrandVoiceCard brandVoice={brandVoice} onVoiceUpdated={setBrandVoice} />

          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 border border-white/[0.08] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Preview Header */}
              <div className="sticky top-0 bg-slate-900/95 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    7-Day Preview: {customKeyword}
                  </h2>
                  <p className="text-sm text-[#a1a1aa] mt-1">
                    Review generated posts before scheduling
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-[#a1a1aa] hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-6 space-y-6">
                {/* Context Section */}
                {previewContext && (
                  <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-lg p-4">
                    <h3 className="text-[#22d3ee] font-semibold mb-2">
                      About "{customKeyword}"
                    </h3>
                    <p className="text-[#a1a1aa] text-sm">
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
                          className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4 hover:bg-white/8 transition-colors"
                        >
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-semibold">{post.topic}</h4>
                                <span className="text-xs bg-[#22d3ee]/10 text-[#22d3ee] px-2 py-1 rounded">
                                  Day {index + 1}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                                <span>Quality: {post.quality_score}/100</span>
                                <span>•</span>
                                <span>Engagement: {post.engagement_prediction}/100</span>
                                <span>•</span>
                                <span className="capitalize">{post.content_type}</span>
                              </div>
                            </div>
                          </div>

                          {/* Caption */}
                          <p className="text-[#a1a1aa] text-sm mb-3 leading-relaxed">
                            {post.caption}
                          </p>

                          {/* Hashtags */}
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {post.hashtags.slice(0, 8).map((tag, i) => (
                                <span key={i} className="text-xs text-[#22d3ee]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Platforms */}
                          {post.platforms && post.platforms.length > 0 && (
                            <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                              {post.platforms.map((platform) => (
                                <span
                                  key={platform}
                                  className="px-2 py-1 bg-[#18181b] text-[#a1a1aa] text-xs rounded capitalize"
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
                        <p className="text-[#a1a1aa]">No posts generated</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Actions */}
              <div className="sticky bottom-0 bg-slate-900/95 border-t border-white/[0.06] px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-[#18181b] text-[#a1a1aa] rounded-lg hover:bg-[#111113] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleApproveKeywordPosts}
                  className="px-6 py-2 bg-[#22d3ee] text-white rounded-lg transition-colors flex items-center gap-2"
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
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Trending News Today
              </h2>
              {newsLastRefreshed && (
                <p className="text-sm text-[#52525b] mt-1">
                  Last refreshed: {new Date(newsLastRefreshed).toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={handleRefreshNews}
              disabled={newsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Refresh for fresh news articles"
            >
              <FaSync className={newsLoading ? 'animate-spin' : ''} size={14} />
              Refresh
            </button>
          </div>

          <p className="text-[#a1a1aa] max-w-2xl">
            Real-time news and articles from today's trending topics. Click refresh to get <span className="text-[#22d3ee] font-semibold">fresh articles</span>, "Open Link" to read full article, or "Use This" to generate content.
          </p>

          {newsLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#a1a1aa]">Loading today's news...</p>
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

                const categoryStyles = {
                  technology: { card: 'border-cyan-500/25 bg-gradient-to-b from-cyan-500/5 to-[#111113]', title: 'text-cyan-400', dot: 'bg-cyan-400' },
                  business:   { card: 'border-emerald-500/25 bg-gradient-to-b from-emerald-500/5 to-[#111113]', title: 'text-emerald-400', dot: 'bg-emerald-400' },
                  sports:     { card: 'border-orange-500/25 bg-gradient-to-b from-orange-500/5 to-[#111113]', title: 'text-orange-400', dot: 'bg-orange-400' },
                  world:      { card: 'border-purple-500/25 bg-gradient-to-b from-purple-500/5 to-[#111113]', title: 'text-purple-400', dot: 'bg-purple-400' },
                  lifestyle:  { card: 'border-pink-500/25 bg-gradient-to-b from-pink-500/5 to-[#111113]', title: 'text-pink-400', dot: 'bg-pink-400' },
                };
                const style = categoryStyles[category] || categoryStyles.technology;

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${style.card} border rounded-xl p-6 space-y-4`}
                  >
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${style.title}`}>
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      {categoryLabels[category] || 'News'}
                    </h3>

                    <div className="space-y-3">
                      {articles.slice(0, 2).map((article, idx) => (
                        <div key={idx} className="bg-[#0d0d0f] rounded-lg p-3 border border-white/[0.06] hover:border-white/[0.12] transition-all group">
                          <h4 className="text-sm font-semibold text-white mb-1.5 line-clamp-2 group-hover:text-white/90">
                            {article.title}
                          </h4>
                          <p className="text-xs text-[#52525b] mb-3 line-clamp-2">
                            {article.description || article.source}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenNewsLink(article.url)}
                              className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-[#a1a1aa] hover:text-white text-xs rounded-lg hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1.5 font-medium"
                            >
                              Open Link
                            </button>
                            <button
                              onClick={() => handleUseNewsForContent(article)}
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 font-medium ${style.dot === 'bg-cyan-400' ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : style.dot === 'bg-emerald-400' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : style.dot === 'bg-orange-400' ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : style.dot === 'bg-purple-400' ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'}`}
                            >
                              <FaMagic size={10} /> Use This
                            </button>
                          </div>
                          <p className="text-[10px] text-[#3f3f46] mt-2 uppercase tracking-wide">
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
            <div className="text-center py-12 bg-[#18181b] rounded-xl border border-white/[0.06]">
              <p className="text-[#a1a1aa]">No news available yet. Click refresh to load today's trending news.</p>
            </div>
          )}
        </motion.div>

        {/* News Generation Modal */}
        {newsGenerationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setNewsGenerationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 border border-white/[0.08] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-slate-900/95 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  📰 Generate Posts from News
                </h2>
                <button
                  onClick={() => setNewsGenerationModal(false)}
                  className="text-[#a1a1aa] hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Article Info */}
                {selectedArticle && (
                  <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-lg p-4">
                    <h3 className="text-[#22d3ee] font-semibold mb-2">Selected Article</h3>
                    <p className="text-white font-medium">{selectedArticle.title}</p>
                    <p className="text-[#a1a1aa] text-sm mt-2">{selectedArticle.description}</p>
                    <p className="text-xs text-[#52525b] mt-2">Source: {selectedArticle.source}</p>
                  </div>
                )}

                {/* Single Post Preview */}
                {newsPostMode === 'options' && newsGeneratedPosts.length > 0 && (
                  <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-bold text-white">Quick Preview</h3>
                    <div>
                      <p className="text-[#a1a1aa] text-sm mb-3">{newsGeneratedPosts[0].caption}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {newsGeneratedPosts[0].hashtags?.slice(0, 6).map((tag, i) => (
                          <span key={i} className="text-xs text-[#22d3ee]">{tag}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-[#111113] text-[#a1a1aa] text-xs rounded">Quality: {newsGeneratedPosts[0].quality_score}/100</span>
                        <span className="px-2 py-1 bg-[#111113] text-[#a1a1aa] text-xs rounded">Engagement: {newsGeneratedPosts[0].engagement_prediction}/100</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/[0.06]">
                      <button
                        onClick={() => {setNewsPostMode('multiple'); setNewsGeneratedPosts([]);}}
                        className="w-full px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06b6d4] transition-all"
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
                      <div className="text-center py-6 bg-[#18181b] rounded-lg border border-white/[0.06]">
                        <p className="text-[#a1a1aa] mb-4">Ready to generate a quick post?</p>
                        <button
                          onClick={handleGenerateNewsPost}
                          disabled={newsGenerating}
                          className="px-6 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06b6d4] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                        >
                          {newsGenerating ? '⏳ Generating...' : '✨ Generate Post (3-5s)'}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Number of Posts</label>
                          <select
                            value={newsPostCount}
                            onChange={(e) => setNewsPostCount(parseInt(e.target.value))}
                            className="w-full px-4 py-2 bg-[#18181b] border border-white/[0.06] rounded-lg text-white"
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
                          <label htmlFor="multiAngles" className="text-sm text-[#a1a1aa]">
                            Different angles (educational, opinion, news, case study, etc.)
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Scheduling</label>
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
                              <span className="text-sm text-[#a1a1aa]">Post all today</span>
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
                              <span className="text-sm text-[#a1a1aa]">Spread across days</span>
                            </label>
                          </div>

                          {newsSchedulingMode === 'spread' && (
                            <div className="mt-3 space-y-2 ml-6">
                              <div>
                                <label className="block text-xs text-[#a1a1aa] mb-1">Interval (days)</label>
                                <select
                                  value={newsSpreadInterval}
                                  onChange={(e) => setNewsSpreadInterval(parseInt(e.target.value))}
                                  className="w-full px-3 py-2 bg-[#18181b] border border-white/[0.06] rounded text-sm text-white"
                                >
                                  {[1, 2, 3].map(days => <option key={days} value={days}>Every {days} day(s)</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-[#a1a1aa] mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={newsStartDate}
                                  onChange={(e) => setNewsStartDate(e.target.value)}
                                  className="w-full px-3 py-2 bg-[#18181b] border border-white/[0.06] rounded text-sm text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-[#a1a1aa] mb-1">Time</label>
                                <input
                                  type="time"
                                  value={newsPostTime}
                                  onChange={(e) => setNewsPostTime(e.target.value)}
                                  className="w-full px-3 py-2 bg-[#18181b] border border-white/[0.06] rounded text-sm text-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={handleGenerateNewsPost}
                          disabled={newsGenerating}
                          className="w-full px-4 py-3 bg-[#22d3ee] text-white rounded-lg transition-all disabled:opacity-50"
                        >
                          {newsGenerating ? `⏳ Generating ${newsPostCount} posts...` : `✨ Generate ${newsPostCount} Posts`}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Platform Selection */}
                {(newsPostMode === 'options' || showNewsPostPreview) && newsGeneratedPosts.length > 0 && (
                  <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4 space-y-3">
                    <label className="block text-sm font-medium text-[#a1a1aa]">Post to Platforms</label>
                    <div className="flex flex-wrap gap-3">
                      {['linkedin', 'twitter', 'tiktok', 'telegram', 'slack', 'discord', 'reddit', 'devto', 'mastodon', 'bluesky'].map(platform => (
                        <PlatformChip
                          key={platform}
                          platform={platform}
                          selected={selectedPlatforms.includes(platform)}
                          onClick={() => {
                            setSelectedPlatforms(prev =>
                              prev.includes(platform)
                                ? prev.filter(p => p !== platform)
                                : [...prev, platform]
                            );
                          }}
                          size="sm"
                        />
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
                        <div key={idx} className="bg-[#18181b] border border-white/[0.06] rounded-lg p-3">
                          <p className="text-sm text-white mb-2">{post.caption}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.hashtags?.slice(0, 5).map((tag, i) => (
                              <span key={i} className="text-xs text-[#22d3ee]">{tag}</span>
                            ))}
                          </div>
                          <div className="text-xs text-[#52525b]">Quality: {post.quality_score}/100 | Engagement: {post.engagement_prediction}/100</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="sticky bottom-0 bg-slate-900/95 border-t border-white/[0.06] px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => setNewsGenerationModal(false)}
                  className="px-6 py-2 bg-[#18181b] text-[#a1a1aa] rounded-lg hover:bg-[#111113] transition-colors"
                >
                  Close
                </button>
                {(newsPostMode === 'options' || showNewsPostPreview) && newsGeneratedPosts.length > 0 && (
                  <>
                    <button
                      onClick={handlePostNewsNow}
                      className="px-6 py-2 bg-[#22d3ee] text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                    >
                      🚀 Post Now
                    </button>
                    <button
                      onClick={handleScheduleNewsPosts}
                      className="px-6 py-2 bg-[#22d3ee] text-[#0a0a0b] rounded-lg transition-colors flex items-center gap-2 font-medium"
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
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900/95 border border-white/[0.08] rounded-xl w-full max-w-2xl"
              >
                {/* Modal Header */}
                <div className="bg-slate-900/95 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between sticky top-0">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FaEdit className="text-[#22d3ee]" />
                      Edit Post
                    </h2>
                    <p className="text-sm text-[#a1a1aa] mt-1">
                      {editingPost.topic}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-[#a1a1aa] hover:text-white transition-colors text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Current Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#18181b] rounded-lg p-3 border border-white/[0.06]">
                      <p className="text-xs text-[#a1a1aa] uppercase mb-1">Quality Score</p>
                      <p className="text-xl font-bold text-white">{editingPost.quality_score}/100</p>
                    </div>
                    <div className="bg-[#18181b] rounded-lg p-3 border border-white/[0.06]">
                      <p className="text-xs text-[#a1a1aa] uppercase mb-1">Engagement Prediction</p>
                      <p className="text-xl font-bold text-white">{editingPost.engagement_prediction}/100</p>
                    </div>
                  </div>

                  {/* Content Type */}
                  <div>
                    <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                      Content Type
                    </label>
                    <div className="px-4 py-2 bg-[#18181b] border border-white/[0.06] rounded-lg text-[#a1a1aa] capitalize">
                      {editingPost.content_type}
                    </div>
                  </div>

                  {/* Caption Editor */}
                  <div>
                    <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                      Caption ({editingCaption.length} characters)
                    </label>
                    <textarea
                      value={editingCaption}
                      onChange={(e) => setEditingCaption(e.target.value)}
                      className="w-full px-4 py-3 bg-[#18181b] border border-white/[0.06] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors resize-none"
                      rows="6"
                      placeholder="Edit your post caption..."
                    />
                    <p className="text-xs text-[#52525b] mt-1">
                      Tip: Keep captions concise and engaging for better performance
                    </p>
                  </div>

                  {/* Hashtags Editor */}
                  <div>
                    <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                      Hashtags (comma-separated)
                    </label>
                    <textarea
                      value={editingHashtags}
                      onChange={(e) => setEditingHashtags(e.target.value)}
                      className="w-full px-4 py-3 bg-[#18181b] border border-white/[0.06] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors resize-none"
                      rows="3"
                      placeholder="e.g., #AI, #Technology, #Innovation"
                    />
                    <p className="text-xs text-[#52525b] mt-1">
                      Current hashtags: {editingHashtags.split(',').filter(t => t.trim()).length}
                    </p>
                  </div>

                  {/* Platforms Info */}
                  <div>
                    <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                      Posting Platforms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {editingPost.platforms && editingPost.platforms.map(platform => (
                        <span
                          key={platform}
                          className="px-3 py-1 bg-[#22d3ee]/10 text-[#22d3ee] rounded-lg text-sm capitalize flex items-center gap-1"
                        >
                          {platform === 'linkedin' && '💼'}
                          {platform === 'twitter' && '𝕏'}
                          {platform === 'tiktok' && '🎵'}
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Created Info */}
                  <div className="bg-[#18181b] rounded-lg p-3 border border-white/[0.06] text-xs text-[#a1a1aa]">
                    <p>Created: {new Date(editingPost.created_at).toLocaleDateString()} at {new Date(editingPost.created_at).toLocaleTimeString()}</p>
                    {editingPost.source && <p>Source: {editingPost.source}</p>}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="sticky bottom-0 bg-slate-900/95 border-t border-white/[0.06] px-6 py-4 flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 bg-[#18181b] text-[#a1a1aa] rounded-lg hover:bg-[#111113] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-2 bg-[#22d3ee] text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
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
