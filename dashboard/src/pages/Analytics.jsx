import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';
import { showError, showSuccess } from '../components/ui/Toast';
import { NoAnalyticsEmpty, NoHistoryEmpty } from '../components/ui/EmptyState';
import { AnalyticsSkeleton } from '../components/ui/LoadingStates';
import {
  FaLinkedin,
  FaTwitter,
  FaTiktok,
  FaYoutube,
  FaReddit,
  FaDiscord,
  FaSlack,
  FaTelegram,
  FaTumblr,
  FaMedium,
  FaPinterest,
  FaChartLine,
  FaLightbulb,
  FaBrain,
  FaTrophy,
  FaClock,
  FaHashtag,
  FaCalendar,
  FaServer,
  FaSync,
  FaTimes
} from 'react-icons/fa';
import { SiMastodon, SiBluesky } from 'react-icons/si';

const PLATFORM_META = {
  youtube:   { label: 'YouTube',    color: '#FF0033', icon: '▶' },
  twitter:   { label: 'Twitter/X',  color: '#1DA1F2', icon: '𝕏' },
  linkedin:  { label: 'LinkedIn',   color: '#0A66C2', icon: 'in' },
  instagram: { label: 'Instagram',  color: '#E4405F', icon: '📷' },
  substack:  { label: 'Substack',   color: '#FF6719', icon: '✉' },
};

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return (n || 0).toLocaleString();
}

function Delta({ value }) {
  if (!value) return null;
  const positive = value > 0;
  return (
    <span className={`text-xs font-mono ml-1 ${positive ? 'text-green-400' : 'text-red-400'}`}>
      {positive ? '+' : ''}{formatNum(value)}
    </span>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [insightsStats, setInsightsStats] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  // Platform Reach state
  const [reachSnapshots, setReachSnapshots] = useState([]);
  const [reachHistory, setReachHistory] = useState([]);
  const [reachPosts, setReachPosts] = useState([]);
  const [reachSyncing, setReachSyncing] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadHistory();
    loadPlatformReach();

    // Auto-refresh every 5 minutes (was 30s — too aggressive, caused rate-limit hits)
    const interval = setInterval(() => {
      loadAnalytics();
      loadHistory();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Refresh on visibility change (tab becomes visible) — throttled to max once per 2 min
  useEffect(() => {
    let lastRefresh = Date.now();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRefresh > 2 * 60 * 1000) {
        lastRefresh = Date.now();
        loadAnalytics();
        loadHistory();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const loadAnalytics = async () => {
    try {
      setError(null);
      // Fetch all analytics data in parallel
      const [overviewResponse, timelineResponse, platformsResponse] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/timeline'),
        api.get('/analytics/platforms')
      ]);


      // Get overview data
      let overviewData = overviewResponse.data;
      if (overviewData && overviewData.success) {
        const { success, ...data } = overviewData;
        overviewData = data;
      }

      // Get timeline data
      let timelineData = timelineResponse.data;
      if (timelineData && timelineData.success) {
        const { success, ...data } = timelineData;
        timelineData = data;
      }

      // Format timeline for chart (convert dates array to array of objects)
      let formattedTimeline = [];
      if (timelineData && timelineData.dates && Array.isArray(timelineData.dates)) {
        formattedTimeline = timelineData.dates.map((date, index) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          posts: (timelineData.successful?.[index] || 0) + (timelineData.failed?.[index] || 0)
        }));
      }

      // Get platform distribution data
      let platformsData = platformsResponse.data;
      if (platformsData && platformsData.success) {
        platformsData = platformsData.platforms || [];
      } else if (platformsData && Array.isArray(platformsData.platforms)) {
        platformsData = platformsData.platforms;
      }

      // Format platform data for pie chart (convert to percentage)
      let formattedPlatforms = [];
      if (Array.isArray(platformsData) && platformsData.length > 0) {
        const total = platformsData.reduce((sum, p) => sum + (p.total || 0), 0);
        formattedPlatforms = platformsData.map(p => ({
          name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
          value: total > 0 ? Math.round((p.total / total) * 100) : 0,
          total: p.total,
          successful: p.successful,
          failed: p.failed
        }));
      }

      // Combine all analytics data
      const analyticsData = {
        ...overviewData,
        timeline: formattedTimeline.length > 0 ? formattedTimeline : undefined,
        platforms: formattedPlatforms.length > 0 ? formattedPlatforms : undefined
      };

      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      // Don't clear analytics if it's just a background refresh failure
      if (!analytics) {
        let errorMsg = 'Failed to load analytics data';
        if (err.response?.data?.error) {
          if (typeof err.response.data.error === 'object') {
            errorMsg = err.response.data.error.message || JSON.stringify(err.response.data.error);
          } else {
            errorMsg = err.response.data.error;
          }
        } else if (err.message) {
          errorMsg = err.message;
        }
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/history');
      // The API returns { success: true, history: [...], count: N }
      const historyData = response.data?.history || response.data || [];
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Error loading history:', err);
      setHistory([]);
    }
  };

  const loadInsights = async () => {
    try {
      const [insightsRes, patternsRes] = await Promise.all([
        api.get('/analytics-agent/insights').catch(() => ({ data: { success: false } })),
        api.get('/analytics-agent/patterns').catch(() => ({ data: { success: false } }))
      ]);

      if (insightsRes.data.success) {
        setInsights(insightsRes.data.insights || []);
      }

      if (patternsRes.data.success) {
        setPatterns(patternsRes.data.patterns || []);
        calculateStats(patternsRes.data.patterns || []);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const calculateStats = (patterns) => {
    if (!patterns || patterns.length === 0) return;

    const timePatterns = patterns.filter(p => p.pattern_type === 'time_slot');
    const dayPatterns = patterns.filter(p => p.pattern_type === 'day_of_week');
    const contentPatterns = patterns.filter(p => p.pattern_type === 'content_format');
    const platformPatterns = patterns.filter(p => p.pattern_type === 'platform_performance');

    const bestTime = timePatterns.sort((a, b) => b.success_rate - a.success_rate)[0];
    const bestDay = dayPatterns.sort((a, b) => b.success_rate - a.success_rate)[0];
    const bestContent = contentPatterns.sort((a, b) => b.success_rate - a.success_rate)[0];
    const bestPlatform = platformPatterns.sort((a, b) => b.success_rate - a.success_rate)[0];

    setInsightsStats({
      bestTime,
      bestDay,
      bestContent,
      bestPlatform,
      totalPatterns: patterns.length
    });
  };

  const loadPlatformReach = async () => {
    try {
      const [snapsRes, histRes, postsRes] = await Promise.all([
        api.get('/platform-analytics/snapshots').catch(() => ({ data: { snapshots: [] } })),
        api.get('/platform-analytics/history').catch(() => ({ data: { history: [] } })),
        api.get('/platform-analytics/posts').catch(() => ({ data: { posts: [] } })),
      ]);
      setReachSnapshots(snapsRes.data?.snapshots || []);
      setReachHistory(histRes.data?.history || []);
      setReachPosts(postsRes.data?.posts || []);
    } catch (err) {
      console.error('Error loading platform reach:', err);
    }
  };

  const handleReachSync = async () => {
    setReachSyncing(true);
    try {
      await api.post('/platform-analytics/sync');
      showSuccess('Platform data synced!');
      await loadPlatformReach();
    } catch (err) {
      showError('Sync failed — check your connected accounts');
    } finally {
      setReachSyncing(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await api.post('/analytics-agent/analyze');
      if (response.data.success) {
        showSuccess('Analysis complete! New insights generated.');
        await loadInsights();
      }
    } catch (err) {
      console.error('Error analyzing:', err);

      let errorMsg = 'Failed to analyze';
      if (err.response?.data?.error) {
        if (typeof err.response.data.error === 'object') {
          errorMsg = err.response.data.error.message || JSON.stringify(err.response.data.error);
        } else {
          errorMsg = err.response.data.error;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      showError(errorMsg);
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
      best_time: <FaClock className="text-blue-400" />,
      best_day: <FaCalendar className="text-green-400" />,
      content_type: <FaLightbulb className="text-yellow-400" />,
      hashtag_performance: <FaHashtag className="text-pink-400" />,
      platform_performance: <FaServer className="text-purple-400" />,
      overall_trend: <FaChartLine className="text-cyan-400" />,
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

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Analytics</h1>
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Analytics</h1>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 text-lg mb-2">Failed to load analytics data</p>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); loadAnalytics(); }}
            className="px-4 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded hover:bg-red-600/30 transition shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full px-4 sm:px-6 lg:px-8 py-8"
      >
        <h1 className="text-4xl font-bold mb-4">Analytics</h1>
        <NoAnalyticsEmpty />
      </motion.div>
    );
  }

  // Show data even with 0 posts to debug
  const hasData = analytics && (analytics.totalPosts > 0 || analytics.postsToday > 0);

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full px-4 sm:px-6 lg:px-8 py-8"
      >
        <h1 className="text-4xl font-bold mb-4">Analytics</h1>
        <NoAnalyticsEmpty />
      </motion.div>
    );
  }

  // Use timeline data from analytics, or show empty state
  const lineData = analytics.timeline && analytics.timeline.length > 0
    ? analytics.timeline
    : [{ date: 'No data', posts: 0 }];

  // Use platform data from analytics, or show empty state
  const pieData = analytics.platforms && analytics.platforms.length > 0
    ? analytics.platforms
    : [{ name: 'No data', value: 100 }];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-300">Track your social media performance • Auto-refreshes every 30s</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/analytics/export"
            onClick={(e) => {
              e.preventDefault();
              fetch('/api/analytics/export', {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              })
                .then(response => {
                  if (!response.ok) throw new Error('Export failed');
                  return response.blob();
                })
                .then(blob => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                })
                .catch(err => {
                  console.error('Export error:', err);
                  alert('Failed to export analytics. Make sure you have posts to export.');
                });
            }}
            className="group relative bg-white/[0.06] border border-white/[0.08] text-white text-sm px-4 py-2 rounded-lg hover:bg-white/[0.1] transition-colors flex items-center gap-2"
            title="Export your analytics data as CSV"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            <div className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </div>
          </a>
          <button
            onClick={() => {
              setLoading(true);
              loadAnalytics();
              loadHistory();
            }}
            className="group relative bg-white/[0.06] border border-white/[0.08] text-white text-sm px-4 py-2 rounded-lg hover:bg-white/[0.1] transition-colors flex items-center gap-2"
            title="Refresh analytics data now"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            <div className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Now
            </div>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="group relative bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-md border-2 border-blue-400/30 rounded-xl shadow-xl p-6 text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          <div className="relative">
            <div className="text-3xl font-bold">{analytics.totalPosts}</div>
            <div className="text-blue-200 mt-1">Total Posts</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="group relative bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-md border-2 border-green-400/30 rounded-xl shadow-xl p-6 text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          <div className="relative">
            <div className="text-3xl font-bold">{analytics.successRate || 98}%</div>
            <div className="text-green-200 mt-1">Success Rate</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="group relative bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-md border-2 border-purple-400/30 rounded-xl shadow-xl p-6 text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          <div className="relative">
            <div className="text-3xl font-bold">{analytics.activePlatforms || 3}</div>
            <div className="text-purple-200 mt-1">Active Platforms</div>
          </div>
        </motion.div>
      </div>

      {/* ── Platform Reach ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Platform Reach</h2>
          <button
            onClick={handleReachSync}
            disabled={reachSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-400/30 text-purple-200 hover:bg-purple-600/30 transition-all text-sm disabled:opacity-50"
          >
            <FaSync className={reachSyncing ? 'animate-spin' : ''} />
            {reachSyncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>

        {reachSnapshots.length === 0 ? (
          <div className="bg-gray-900/30 border border-white/10 rounded-xl p-8 text-center text-gray-400">
            <p className="mb-2">No platform data yet.</p>
            <p className="text-sm">Click <span className="text-purple-300 font-medium">Sync Now</span> to pull followers, views, and engagement from your connected accounts.</p>
          </div>
        ) : (
          <>
            {/* Aggregate stat cards */}
            {(() => {
              const totals = reachSnapshots.reduce((acc, s) => ({
                followers: acc.followers + (s.followers || 0),
                followersDelta: acc.followersDelta + (s.followers_delta || 0),
                views: acc.views + (s.total_views || 0),
                viewsDelta: acc.viewsDelta + (s.views_delta || 0),
                likes: acc.likes + (s.total_likes || 0),
                likesDelta: acc.likesDelta + (s.likes_delta || 0),
                comments: acc.comments + (s.total_comments || 0),
                commentsDelta: acc.commentsDelta + (s.comments_delta || 0),
              }), { followers: 0, followersDelta: 0, views: 0, viewsDelta: 0, likes: 0, likesDelta: 0, comments: 0, commentsDelta: 0 });

              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Followers', value: totals.followers, delta: totals.followersDelta, color: 'from-green-600/20 to-emerald-600/20 border-green-400/30' },
                    { label: 'Total Views', value: totals.views, delta: totals.viewsDelta, color: 'from-blue-600/20 to-blue-700/20 border-blue-400/30' },
                    { label: 'Total Likes', value: totals.likes, delta: totals.likesDelta, color: 'from-red-600/20 to-rose-600/20 border-red-400/30' },
                    { label: 'Total Comments', value: totals.comments, delta: totals.commentsDelta, color: 'from-yellow-600/20 to-amber-600/20 border-yellow-400/30' },
                  ].map(stat => (
                    <motion.div key={stat.label} whileHover={{ y: -3 }}
                      className={`bg-gradient-to-br ${stat.color} backdrop-blur-md border-2 rounded-xl p-5 text-white`}>
                      <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold">{formatNum(stat.value)}<Delta value={stat.delta} /></p>
                    </motion.div>
                  ))}
                </div>
              );
            })()}

            {/* Per-platform cards with sparklines */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {reachSnapshots.map(snap => {
                const meta = PLATFORM_META[snap.platform] || { label: snap.platform, color: '#888', icon: '●' };
                const platformHistory = reachHistory
                  .filter(h => h.platform === snap.platform)
                  .slice(-14);
                const maxFollowers = Math.max(...platformHistory.map(h => h.followers), 1);
                const minFollowers = Math.min(...platformHistory.map(h => h.followers), 0);
                const range = maxFollowers - minFollowers || 1;

                return (
                  <motion.div key={snap.platform} whileHover={{ y: -3 }}
                    className="bg-gray-900/40 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${meta.color}22` }}>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                          style={{ background: `${meta.color}22`, color: meta.color }}>{meta.icon}</span>
                        <span className="font-semibold text-sm text-white">{meta.label}</span>
                      </div>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: meta.color }} />
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-white/5 p-px">
                      {[
                        { label: 'Followers', value: snap.followers, delta: snap.followers_delta },
                        { label: 'Views', value: snap.total_views, delta: snap.views_delta },
                        { label: 'Likes', value: snap.total_likes, delta: snap.likes_delta },
                        { label: 'Comments', value: snap.total_comments, delta: snap.comments_delta },
                      ].map(m => (
                        <div key={m.label} className="bg-gray-900/60 px-3 py-2">
                          <p className="text-[10px] font-mono text-gray-500 uppercase">{m.label}</p>
                          <p className="text-base font-bold text-white">{formatNum(m.value)}<Delta value={m.delta} /></p>
                        </div>
                      ))}
                    </div>
                    {platformHistory.length > 1 && (
                      <div className="px-4 py-3 border-t border-white/5">
                        <p className="text-[10px] font-mono text-gray-500 mb-1">FOLLOWER TREND</p>
                        <div className="flex items-end gap-0.5 h-8">
                          {platformHistory.map((h, i) => {
                            const height = Math.max(((h.followers - minFollowers) / range) * 100, 5);
                            return (
                              <div key={i} className="flex-1 rounded-sm"
                                style={{ height: `${height}%`, background: meta.color, opacity: 0.3 + (i / 14) * 0.7 }} />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Top Posts table */}
            {reachPosts.length > 0 && (
              <div className="bg-gray-900/30 border border-white/10 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10">
                  <h3 className="font-semibold text-white">Top Performing Posts</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                        <th className="text-left px-5 py-2">Post</th>
                        <th className="text-left px-5 py-2">Platform</th>
                        <th className="text-right px-5 py-2">Views</th>
                        <th className="text-right px-5 py-2">Likes</th>
                        <th className="text-right px-5 py-2">Comments</th>
                        <th className="text-right px-5 py-2">Published</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...reachPosts]
                        .sort((a, b) => (b.views + b.likes * 10) - (a.views + a.likes * 10))
                        .slice(0, 20)
                        .map(post => {
                          const meta = PLATFORM_META[post.platform] || { label: post.platform, color: '#888' };
                          return (
                            <tr key={post.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-5 py-3">
                                <a href={post.post_url || '#'} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 hover:text-white text-gray-300 transition-colors">
                                  {post.thumbnail_url && (
                                    <img src={post.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                                  )}
                                  <span className="truncate max-w-[180px]">{post.title || 'Untitled'}</span>
                                </a>
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: `${meta.color}22`, color: meta.color }}>{meta.label}</span>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-xs text-gray-300">{formatNum(post.views)}</td>
                              <td className="px-5 py-3 text-right font-mono text-xs text-gray-300">{formatNum(post.likes)}</td>
                              <td className="px-5 py-3 text-right font-mono text-xs text-gray-300">{formatNum(post.comments)}</td>
                              <td className="px-5 py-3 text-right font-mono text-xs text-gray-400">
                                {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Timeline Chart */}
        <motion.div
          whileHover={{ y: -5 }}
          className="group relative bg-gray-900/30 backdrop-blur-md border-2 border-white/10 rounded-xl shadow-xl p-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          <div className="relative">
            <h2 className="text-xl font-bold text-white mb-4">Posts Timeline (Last 30 Days)</h2>
            {lineData.length > 0 && lineData[0].date !== 'No data' ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="posts" stroke="#3B82F6" strokeWidth={2} name="Posts" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p>No timeline data available yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Platform Distribution */}
        <motion.div
          whileHover={{ y: -5 }}
          className="group relative bg-gray-900/30 backdrop-blur-md border-2 border-white/10 rounded-xl shadow-xl p-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          <div className="relative">
            <h2 className="text-xl font-bold text-white mb-4">Platform Distribution</h2>
            {pieData.length > 0 && pieData[0].name !== 'No data' ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, total }) => `${name}: ${total || value} posts`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${props.payload.total || value} posts (${value}%)`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p>No platform data available yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Post History Table */}
      <motion.div
        whileHover={{ y: -5 }}
        className="group relative bg-gray-900/30 backdrop-blur-md border-2 border-white/10 rounded-xl shadow-xl p-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
        <div className="relative">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Posts</h2>
          {history.length === 0 ? (
            <div className="py-8">
              <NoHistoryEmpty onCreate={() => window.location.href = '/create'} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Platform</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Caption</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                  {history.slice(0, 10).map((post, idx) => {
                    // Get platforms - handle both array and string formats
                    let platforms = [];
                    if (Array.isArray(post.platforms)) {
                      platforms = post.platforms;
                    } else if (typeof post.platforms === 'string') {
                      platforms = [post.platforms];
                    } else if (post.platform) {
                      platforms = [post.platform];
                    }



                    // Platform icons mapping
                    const platformIcons = {
                      linkedin: { Icon: FaLinkedin, color: 'bg-blue-500/20 text-blue-400 border-blue-400/30', name: 'LinkedIn' },
                      twitter: { Icon: FaTwitter, color: 'bg-sky-500/20 text-sky-400 border-sky-400/30', name: 'Twitter' },
                      telegram: { Icon: FaTelegram, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30', name: 'Telegram' },
                      youtube: { Icon: FaYoutube, color: 'bg-red-500/20 text-red-400 border-red-400/30', name: 'YouTube' },
                      reddit: { Icon: FaReddit, color: 'bg-orange-500/20 text-orange-400 border-orange-400/30', name: 'Reddit' },
                      discord: { Icon: FaDiscord, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-400/30', name: 'Discord' },
                      slack: { Icon: FaSlack, color: 'bg-purple-500/20 text-purple-400 border-purple-400/30', name: 'Slack' },
                      tiktok: { Icon: FaTiktok, color: 'bg-gray-500/20 text-gray-400 border-gray-400/30', name: 'TikTok' },
                      tumblr: { Icon: FaTumblr, color: 'bg-blue-600/20 text-blue-400 border-blue-400/30', name: 'Tumblr' },
                      devto: { Icon: FaMedium, color: 'bg-gray-900/20 text-gray-300 border-gray-300/30', name: 'Dev.to' },
                      mastodon: { Icon: SiMastodon, color: 'bg-purple-600/20 text-purple-400 border-purple-400/30', name: 'Mastodon' },
                      bluesky: { Icon: SiBluesky, color: 'bg-blue-500/20 text-blue-400 border-blue-400/30', name: 'Bluesky' },
                      medium: { Icon: FaMedium, color: 'bg-gray-700/20 text-gray-300 border-gray-300/30', name: 'Medium' },
                      pinterest: { Icon: FaPinterest, color: 'bg-red-600/20 text-red-400 border-red-400/30', name: 'Pinterest' }
                    };

                    // Helper function to get post URL from results
                    // Handles both single results and array results (multi-account)
                    const getPostUrl = (platform) => {
                      try {
                        if (!post.results) {
                          console.log(`[Analytics] No results for post ${post.id}`);
                          return null;
                        }

                        // Handle case-insensitive platform matching
                        const platformKey = Object.keys(post.results).find(
                          key => key.toLowerCase() === platform.toLowerCase()
                        );

                        if (!platformKey) {
                          console.log(`[Analytics] Platform ${platform} not found in results. Available:`, Object.keys(post.results));
                          return null;
                        }

                        const platformResults = post.results[platformKey];

                        // Handle array results (multiple accounts per platform)
                        const resultsArray = Array.isArray(platformResults) ? platformResults : [platformResults];

                        // Find first successful result
                        const successfulResult = resultsArray.find(r => r && typeof r === 'object' && r.success === true);
                        if (!successfulResult) {
                          console.log(`[Analytics] No successful result for ${platform}. Results:`, resultsArray);
                          return null;
                        }

                        const platformLower = platform.toLowerCase();
                        if (platformLower === "slack" || platformLower === "discord") {
                          return "webhook";
                        }

                        // First try: Direct URL from result
                        if (successfulResult.url) {
                          console.log(`[Analytics] Found URL for ${platform}:`, successfulResult.url);
                          return successfulResult.url;
                        }

                        // Second try: Construct from postId
                        if (successfulResult.postId) {
                          if (platformLower === 'linkedin') {
                            return `https://www.linkedin.com/feed/update/urn:li:ugcPost:${successfulResult.postId}`;
                          } else if (platformLower === 'twitter' || platformLower === 'x') {
                            return `https://twitter.com/i/web/status/${successfulResult.postId}`;
                          } else if (platformLower === 'telegram') {
                            if (successfulResult.chatId && successfulResult.messageId) {
                              const chatIdForUrl = successfulResult.chatId.toString().replace(/^-/, '');
                              return `https://t.me/c/${chatIdForUrl}/${successfulResult.messageId}`;
                            }
                          } else if (platformLower === 'youtube') {
                            return `https://www.youtube.com/shorts/${successfulResult.postId}`;
                          } else if (platformLower === 'devto') {
                            // Dev.to URLs are in format: https://dev.to/username/title-slug
                            // If we have postId, we can't construct URL without username, so return null
                            // But if URL was returned, it should be in successfulResult.url above
                            return null;
                          } else if (platformLower === 'bluesky') {
                            // Bluesky URLs need handle and postId
                            if (successfulResult.account && successfulResult.postId) {
                              return `https://bsky.app/profile/${successfulResult.account}/post/${successfulResult.postId}`;
                            } else if (successfulResult.uri) {
                              // Extract handle and postId from URI
                              const uriParts = successfulResult.uri.split('/');
                              const handle = uriParts[uriParts.length - 3];
                              const postId = uriParts[uriParts.length - 1];
                              return `https://bsky.app/profile/${handle}/post/${postId}`;
                            }
                          }
                        }

                        // Third try: Construct from id (for backward compatibility)
                        if (successfulResult.id) {
                          if (platformLower === 'linkedin' && successfulResult.id.includes(':')) {
                            const postId = successfulResult.id.split(':').pop();
                            return `https://www.linkedin.com/feed/update/urn:li:ugcPost:${postId}`;
                          } else if (platformLower === 'twitter' || platformLower === 'x') {
                            return `https://twitter.com/i/web/status/${successfulResult.id}`;
                          }
                        }

                        console.log(`[Analytics] Could not construct URL for ${platform}. Result:`, successfulResult);
                        return null;
                      } catch (error) {
                        console.error(`[Analytics] Error getting URL for ${platform}:`, error);
                        return null;
                      }
                    };

                    return (
                      <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          {platforms.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {platforms.map((platform, pIdx) => {
                                const platformInfo = platformIcons[platform.toLowerCase()] || { Icon: FaTwitter, color: 'bg-gray-500/20 text-gray-400 border-gray-400/30', name: platform };
                                const postUrl = getPostUrl(platform);
                                const isClickable = postUrl !== null;
                                const PlatformIcon = platformInfo.Icon;

                                return (
                                  <a
                                    key={pIdx}
                                    href={postUrl || '#'}
                                    target={isClickable ? "_blank" : undefined}
                                    rel={isClickable ? "noopener noreferrer" : undefined}
                                    onClick={(e) => {
                                      if (!isClickable) {
                                        e.preventDefault();

                                        // Check if post failed
                                        const platformResult = post.results && post.results[platform];
                                        const isFailed = post.status === 'failed' || (platformResult && platformResult.success === false);

                                        if (isFailed) {
                                          const errorMsg = platformResult && platformResult.error ? platformResult.error : 'Post failed';
                                          showError(`Post failed: ${errorMsg}`);
                                        } else {
                                          // Show toast notification with helpful message for successful but missing link
                                          showError(`Link not available for this ${platformInfo.name} post. The post was successful but the URL wasn't saved. This will be fixed for future posts.`);
                                        }
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border backdrop-blur-sm ${platformInfo.color} transition ${isClickable
                                      ? 'hover:scale-110 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-400'
                                      : 'cursor-pointer opacity-70 hover:opacity-100'
                                      }`}
                                    title={isClickable ? `View post on ${platformInfo.name}` : `Click to see why link isn't available for ${platformInfo.name}`}
                                  >
                                    <PlatformIcon className="text-sm" />
                                    <span>{platformInfo.name}</span>
                                    {isClickable ? <span className="text-xs">↗</span> : <span className="text-xs opacity-50">ⓘ</span>}
                                  </a>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No platforms</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-200 max-w-md">
                            <div className="truncate">{post.text || post.caption || 'No caption'}</div>
                            {post.image_url && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                <span>🖼️</span>
                                <span>With image</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${post.status === 'posted' ? 'bg-green-100 text-green-800' :
                              post.status === 'failed' ? 'bg-red-100 text-red-800' :
                                post.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {post.status === 'posted' ? '✓ Posted' :
                                post.status === 'failed' ? '✗ Failed' :
                                  post.status === 'partial' ? '⚠ Partial' : post.status}
                            </span>
                            {post.results && Object.keys(post.results).length > 0 && (
                              <span className="text-xs text-gray-500">
                                {Object.values(post.results).filter(r => r.success).length}/{Object.keys(post.results).length} succeeded
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                // Navigate to create post with prefilled data
                                const state = {
                                  clonedCaption: post.text || post.caption,
                                  clonedPlatforms: platforms,
                                  clonedImageUrl: post.image_url
                                };
                                window.location.href = `/create?clone=${JSON.stringify(state)}`;
                              }}
                              className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-all text-xs font-semibold"
                              title="Clone this post"
                            >
                              📋 Clone
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this post record?')) {
                                  try {
                                    await api.delete(`/queue/${post.id}`);
                                    showSuccess('Post deleted');
                                    // Refresh history
                                    const response = await api.get('/posts/history');
                                    if (response.data.success) {
                                      setHistory(response.data.history);
                                    }
                                  } catch (err) {
                                    console.error('Error deleting post:', err);
                                    showError('Failed to delete post');
                                  }
                                }
                              }}
                              className="px-3 py-1 bg-red-600/20 text-red-300 border border-red-500/30 rounded hover:bg-red-600/30 transition-all text-xs font-semibold"
                              title="Delete this post"
                            >
                              🗑️ Delete
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* AI Insights Section - REMOVED */}
      {false && (insights.length > 0 || patterns.length > 0) && (
        <>
          {/* Insights Stats Cards */}
          {insightsStats && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FaBrain className="text-cyan-400" />
                AI Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {insightsStats.bestTime && (
                  <div className="glass border border-white/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FaClock className="text-blue-400 text-2xl" />
                      <h3 className="text-lg font-semibold text-white">Best Time</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{insightsStats.bestTime.characteristics?.hourLabel}</p>
                    <p className="text-sm text-gray-400 mt-1">{insightsStats.bestTime.success_rate}% success rate</p>
                  </div>
                )}

                {insightsStats.bestDay && (
                  <div className="glass border border-white/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FaCalendar className="text-green-400 text-2xl" />
                      <h3 className="text-lg font-semibold text-white">Best Day</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{insightsStats.bestDay.characteristics?.dayName}</p>
                    <p className="text-sm text-gray-400 mt-1">{insightsStats.bestDay.success_rate}% success rate</p>
                  </div>
                )}

                {insightsStats.bestContent && (
                  <div className="glass border border-white/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FaLightbulb className="text-yellow-400 text-2xl" />
                      <h3 className="text-lg font-semibold text-white">Best Content</h3>
                    </div>
                    <p className="text-3xl font-bold text-white capitalize">{insightsStats.bestContent.characteristics?.contentType}</p>
                    <p className="text-sm text-gray-400 mt-1">{insightsStats.bestContent.success_rate}% success rate</p>
                  </div>
                )}

                {insightsStats.bestPlatform && (
                  <div className="glass border border-white/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FaTrophy className="text-purple-400 text-2xl" />
                      <h3 className="text-lg font-semibold text-white">Best Platform</h3>
                    </div>
                    <p className="text-3xl font-bold text-white capitalize">{insightsStats.bestPlatform.characteristics?.platform}</p>
                    <p className="text-sm text-gray-400 mt-1">{insightsStats.bestPlatform.success_rate}% success rate</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Insights Cards */}
          {insights.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FaLightbulb className="text-yellow-400" />
                Detailed Insights
              </h2>

              <div className="space-y-4">
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
                            <p className="text-sm text-cyan-400 font-semibold mb-2">💡 Recommendation:</p>
                            <p className="text-white">{insight.recommendation}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDismissInsight(insight.id)}
                          className="text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-white/10"
                          title="Dismiss insight"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Patterns Summary */}
          {patterns.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 mb-8">
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

          {/* Analyze Button */}
          {(insights.length === 0 || patterns.length === 0) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-lg"
              >
                {analyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FaSync />
                    Generate AI Insights
                  </>
                )}
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* Analyze Button for Empty State - REMOVED */}
      {false && insights.length === 0 && patterns.length === 0 && analytics && analytics.totalPosts > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
          <div className="glass border-2 border-white/20 rounded-2xl p-12 max-w-2xl mx-auto">
            <FaBrain className="w-20 h-20 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">No insights yet</h2>
            <p className="text-gray-400 mb-8">
              You need at least 10 posts to generate insights. The AI will analyze your posting patterns
              and provide actionable recommendations.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2 shadow-lg"
            >
              {analyzing ? (
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
      )}
    </motion.div>
  );
}

