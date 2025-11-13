import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { FaChartLine, FaLightbulb, FaBrain, FaTrophy, FaClock, FaHashtag, FaCalendar, FaServer, FaSync, FaTimes } from 'react-icons/fa';

export default function AnalyticsAgent() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [stats, setStats] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isPageMounted, setIsPageMounted] = useState(false);

  useEffect(() => {
    // CRITICAL: Check if this is a fresh page load or navigation from another page
    // Use a page visibility marker to detect fresh loads
    const pageLoadId = sessionStorage.getItem('analyticsPageLoadId');
    const currentLoadId = Math.random().toString();

    if (!pageLoadId) {
      // First load in this session - start fresh, NO analysis shown
      sessionStorage.setItem('analyticsPageLoadId', currentLoadId);
      sessionStorage.removeItem('analyticsAnalyzed');
      setHasAnalyzed(false);
    } else {
      // Already loaded in this session - check if user clicked analyze
      const analyzedInSession = sessionStorage.getItem('analyticsAnalyzed') === 'true';
      setHasAnalyzed(analyzedInSession);
    }

    setIsPageMounted(true);

    // Clean up insights when component unmounts (user leaves the page)
    return () => {
      setInsights([]);
      setPatterns([]);
      setStats(null);
      setShowInsights(false);
      // Clear both flags when leaving the Analytics page
      sessionStorage.removeItem('analyticsAnalyzed');
      sessionStorage.removeItem('analyticsPageLoadId');
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load insights and patterns in parallel
      const [insightsRes, patternsRes] = await Promise.all([
        api.get('/analytics-agent/insights'),
        api.get('/analytics-agent/patterns')
      ]);

      if (insightsRes.data.success) {
        setInsights(insightsRes.data.insights);
      }

      if (patternsRes.data.success) {
        setPatterns(patternsRes.data.patterns);
        calculateStats(patternsRes.data.patterns);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status !== 404) {
        showError('Failed to load insights');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (patterns) => {
    if (!patterns || patterns.length === 0) return;

    // Find best patterns
    const timePatterns = patterns.filter(p => p.pattern_type === 'time_slot');
    const dayPatterns = patterns.filter(p => p.pattern_type === 'day_of_week');
    const contentPatterns = patterns.filter(p => p.pattern_type === 'content_format');
    const platformPatterns = patterns.filter(p => p.pattern_type === 'platform_performance');

    const bestTime = timePatterns.sort((a, b) => b.success_rate - a.success_rate)[0];
    const bestDay = dayPatterns.sort((a, b) => b.success_rate - a.success_rate)[0];
    const bestContent = contentPatterns.sort((a, b) => b.success_rate - a.success_rate)[0];
    const bestPlatform = platformPatterns.sort((a, b) => b.success_rate - a.success_rate)[0];

    setStats({
      bestTime,
      bestDay,
      bestContent,
      bestPlatform,
      totalPatterns: patterns.length
    });
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await api.post('/analytics-agent/analyze');
      if (response.data.success) {
        showSuccess('Analysis complete! New insights generated.');
        // Set flag in sessionStorage to persist across navigation
        sessionStorage.setItem('analyticsAnalyzed', 'true');
        setHasAnalyzed(true);
        await loadData();
      }
    } catch (error) {
      console.error('Error analyzing:', error);
      showError(error.response?.data?.error || 'Failed to analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDismissInsight = async (insightId) => {
    try {
      await api.put(`/analytics-agent/insights/${insightId}/dismiss`);
      setInsights(prev => prev.filter(i => i.id !== insightId));
      showSuccess('Insight dismissed');
    } catch (error) {
      showError('Failed to dismiss insight');
    }
  };

  const getInsightIcon = (type) => {
    const icons = {
      best_time: <FaClock className="text-gray-400" />,
      best_day: <FaCalendar className="text-gray-400" />,
      content_type: <FaLightbulb className="text-gray-400" />,
      hashtag_performance: <FaHashtag className="text-gray-400" />,
      platform_performance: <FaServer className="text-gray-400" />,
      overall_trend: <FaChartLine className="text-gray-400" />,
    };
    return icons[type] || <FaBrain className="text-gray-400" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      positive: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
      negative: 'from-red-500/20 to-rose-500/20 border-red-500/30',
      neutral: 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
    };
    return colors[category] || colors.neutral;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <AnimatedBackground />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasData = insights.length > 0 || patterns.length > 0;

  return (
    <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8">
      <AnimatedBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6 relative z-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg">
                <FaChartLine className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-2">
                  Analytics Insights Agent
                </h1>
                <p className="text-gray-400">AI-powered insights from your posting patterns</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAnalyze}
              disabled={analyzing || loading}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {analyzing || loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <FaSync />
                  Analyze Now
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {!hasAnalyzed ? (
          <motion.div variants={itemVariants} className="text-center py-16">
            <div className="glass border-2 border-white/20 rounded-2xl p-12 max-w-2xl mx-auto">
              <FaBrain className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Ready to analyze your posts?</h2>
              <p className="text-gray-400 mb-8">
                Click "Analyze Now" to get AI-powered insights from your posting patterns.
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  You need at least 10 posts for best results.
                </span>
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || loading}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                {analyzing || loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FaBrain />
                    Run First Analysis
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.bestTime && (
                  <div className="glass border border-white/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FaClock className="text-gray-400 text-2xl" />
                      <h3 className="text-lg font-semibold text-white">Best Time</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.bestTime.characteristics?.hourLabel}</p>
                    <p className="text-sm text-gray-400 mt-1">{stats.bestTime.success_rate}% success rate</p>
                  </div>
                )}

                {stats.bestDay && (
                  <div className="glass border border-white/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FaCalendar className="text-gray-400 text-2xl" />
                      <h3 className="text-lg font-semibold text-white">Best Day</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.bestDay.characteristics?.dayName}</p>
                    <p className="text-sm text-gray-400 mt-1">{stats.bestDay.success_rate}% success rate</p>
                  </div>
                )}

                {stats.bestContent && (
                  <div className="glass border border-white/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FaLightbulb className="text-gray-400 text-2xl" />
                      <h3 className="text-lg font-semibold text-white">Best Content</h3>
                    </div>
                    <p className="text-3xl font-bold text-white capitalize">{stats.bestContent.characteristics?.contentType}</p>
                    <p className="text-sm text-gray-400 mt-1">{stats.bestContent.success_rate}% success rate</p>
                  </div>
                )}

                {stats.bestPlatform && (
                  <div className="glass border border-white/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FaTrophy className="text-gray-400 text-2xl" />
                      <h3 className="text-lg font-semibold text-white">Best Platform</h3>
                    </div>
                    <p className="text-3xl font-bold text-white capitalize">{stats.bestPlatform.characteristics?.platform}</p>
                    <p className="text-sm text-gray-400 mt-1">{stats.bestPlatform.success_rate}% success rate</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Insights Toggle */}
            {insights.length > 0 && (
              <motion.div variants={itemVariants}>
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="w-full group relative bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-lg border-2 border-blue-400/40 rounded-xl p-5 hover:from-blue-600/40 hover:to-purple-600/40 transition-all shadow-lg hover:shadow-blue-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaBrain className="text-blue-400 text-2xl" />
                      <div className="text-left">
                        <h2 className="text-xl font-bold text-white">Want to see AI Insights?</h2>
                        <p className="text-sm text-gray-300 mt-1">Click to analyze your analytics and get AI-powered insights</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showInsights ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-white text-2xl flex-shrink-0"
                    >
                      ▼
                    </motion.div>
                  </div>
                </button>

                {/* AI Insights Section - Shown when toggle is on */}
                <AnimatePresence>
                  {showInsights && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 space-y-4"
                    >
                      <AnimatePresence>
                        {insights.map((insight) => (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`glass border-2 rounded-2xl p-6 bg-gradient-to-br ${getCategoryColor(insight.category)}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="text-3xl">{getInsightIcon(insight.insight_type)}</div>
                              <div>
                                <h3 className="text-xl font-bold text-white">{insight.title}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-400">
                                    Impact: {insight.impact_score}/100
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    Confidence: {insight.confidence_score}/100
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    Based on {insight.data_points} posts
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-300 mb-4">{insight.description}</p>

                            {insight.metric_value && (
                              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                <p className="text-sm text-gray-400 mb-1">Key Metric</p>
                                <p className="text-2xl font-bold text-white">
                                  {insight.metric_value}% {insight.comparison_value && `(vs ${insight.comparison_value}%)`}
                                </p>
                              </div>
                            )}

                            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                              <p className="text-sm text-gray-400 font-semibold mb-2">💡 Recommendation:</p>
                              <p className="text-white">{insight.recommendation}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDismissInsight(insight.id)}
                            className="text-gray-400 transition p-2 rounded-lg"
                            title="Dismiss insight"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Patterns Summary */}
            {patterns.length > 0 && (
              <motion.div variants={itemVariants}>
                <h2 className="text-2xl font-bold text-white mb-4">Detected Patterns</h2>
                <div className="glass border border-white/20 rounded-xl p-6">
                  <p className="text-gray-300 mb-4">
                    Analyzed {patterns.length} patterns from your posting history.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...new Set(patterns.map(p => p.pattern_type))].map(type => {
                      const typePatterns = patterns.filter(p => p.pattern_type === type);
                      return (
                        <div key={type} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-sm text-gray-400 capitalize mb-1">{type.replace(/_/g, ' ')}</p>
                          <p className="text-2xl font-bold text-white">{typePatterns.length}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
