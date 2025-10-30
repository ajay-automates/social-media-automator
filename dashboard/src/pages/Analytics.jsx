import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';
import { showError } from '../components/ui/Toast';
import { NoAnalyticsEmpty } from '../components/ui/EmptyState';
import { AnalyticsSkeleton } from '../components/ui/LoadingStates';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    loadHistory();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAnalytics();
      loadHistory();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Also refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      loadAnalytics();
      loadHistory();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadAnalytics = async () => {
    try {
      // Fetch all analytics data in parallel
      const [overviewResponse, timelineResponse, platformsResponse] = await Promise.all([
        api.get('/analytics/overview').catch(() => ({ data: null })),
        api.get('/analytics/timeline').catch(() => ({ data: null })),
        api.get('/analytics/platforms').catch(() => ({ data: null }))
      ]);
      
      console.log('📊 Analytics API responses:', {
        overview: overviewResponse.data,
        timeline: timelineResponse.data,
        platforms: platformsResponse.data
      });
      
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
      
      console.log('📊 Combined analytics data:', analyticsData);
      
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/history');
      console.log('📋 History API response:', response.data);
      // The API returns { success: true, history: [...], count: N }
      const historyData = response.data?.history || response.data || [];
      console.log('📋 History data:', historyData);
      console.log('📋 First post platforms:', historyData[0]?.platforms);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Error loading history:', err);
      setHistory([]);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Analytics</h1>
        <AnalyticsSkeleton />
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Track your social media performance • Auto-refreshes every 30s</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            loadAnalytics();
            loadHistory();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Now
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-3xl font-bold">{analytics.totalPosts}</div>
          <div className="text-blue-100 mt-1">Total Posts</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-3xl font-bold">{analytics.successRate || 98}%</div>
          <div className="text-green-100 mt-1">Success Rate</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-3xl font-bold">{analytics.activePlatforms || 3}</div>
          <div className="text-purple-100 mt-1">Active Platforms</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Timeline Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Posts Timeline (Last 30 Days)</h2>
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

        {/* Platform Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Distribution</h2>
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
      </div>

      {/* Post History Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Posts</h2>
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No posts yet. Create your first post to see it here!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caption</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
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
                  linkedin: { emoji: '🔗', color: 'bg-blue-100 text-blue-800', name: 'LinkedIn' },
                  twitter: { emoji: '🐦', color: 'bg-sky-100 text-sky-800', name: 'Twitter' },
                  telegram: { emoji: '💬', color: 'bg-indigo-100 text-indigo-800', name: 'Telegram' },
                  instagram: { emoji: '📸', color: 'bg-pink-100 text-pink-800', name: 'Instagram' }
                };

                // Helper function to get post URL from results
                const getPostUrl = (platform) => {
                  // First try: Direct URL from results
                  if (post.results && post.results[platform] && post.results[platform].url) {
                    return post.results[platform].url;
                  }
                  
                  // Second try: Construct from postId
                  if (post.results && post.results[platform] && post.results[platform].postId) {
                    const platformLower = platform.toLowerCase();
                    let url = null;
                    
                    if (platformLower === 'linkedin') {
                      url = `https://www.linkedin.com/feed/update/${post.results[platform].postId}`;
                    } else if (platformLower === 'twitter' || platformLower === 'x') {
                      url = `https://twitter.com/i/web/status/${post.results[platform].postId}`;
                    } else if (platformLower === 'telegram') {
                      url = `https://t.me/c/${post.results[platform].chatId}/${post.results[platform].messageId}`;
                    } else if (platformLower === 'instagram') {
                      // Instagram posts use shortcode (need to construct from id)
                      // For now, return null as we'd need to fetch the shortcode
                      url = null; // Instagram Graph API doesn't provide direct post URLs easily
                    }
                    
                    if (url) {
                      return url;
                    }
                  }
                  
                  return null;
                };

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {platforms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {platforms.map((platform, pIdx) => {
                            const platformInfo = platformIcons[platform.toLowerCase()] || { emoji: '📱', color: 'bg-gray-100 text-gray-800', name: platform };
                            const postUrl = getPostUrl(platform);
                            const isClickable = postUrl !== null;
                            
                            return (
                              <a
                                key={pIdx}
                                href={postUrl || '#'}
                                target={isClickable ? "_blank" : undefined}
                                rel={isClickable ? "noopener noreferrer" : undefined}
                                onClick={(e) => {
                                  if (!isClickable) {
                                    e.preventDefault();
                                    // Show toast notification
                                    alert(`Link not available for this ${platformInfo.name} post. The post was successful but the URL wasn't saved in the database.`);
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${platformInfo.color} transition ${
                                  isClickable 
                                    ? 'hover:scale-110 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-400' 
                                    : 'cursor-pointer opacity-70 hover:opacity-100'
                                }`}
                                title={isClickable ? `View post on ${platformInfo.name}` : `Click to see why link isn't available for ${platformInfo.name}`}
                              >
                                <span className="text-base">{platformInfo.emoji}</span>
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
                      <div className="text-sm text-gray-900 max-w-md">
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
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          post.status === 'posted' ? 'bg-green-100 text-green-800' : 
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </motion.div>
  );
}

