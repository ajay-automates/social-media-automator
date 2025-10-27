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
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/analytics/overview');
      console.log('📊 Analytics API response:', response.data);
      
      // API returns { success: true, totalPosts: X, postsToday: X, ... }
      // or just the data directly
      let analyticsData = response.data;
      
      // Extract data if wrapped in success object
      if (analyticsData.success && analyticsData.totalPosts !== undefined) {
        // Data is already in response.data
        analyticsData = analyticsData;
      } else if (analyticsData.success) {
        // Data might be nested, extract it
        const { success, ...data } = analyticsData;
        analyticsData = data;
      }
      
      console.log('📊 Analytics data being set:', analyticsData);
      console.log('📊 totalPosts:', analyticsData.totalPosts);
      console.log('📊 postsToday:', analyticsData.postsToday);
      
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

  const lineData = analytics.timeline || [
    { date: '2024-01-01', posts: 5 },
    { date: '2024-01-02', posts: 8 },
    { date: '2024-01-03', posts: 12 },
  ];

  const pieData = analytics.platforms || [
    { name: 'Twitter', value: 40 },
    { name: 'LinkedIn', value: 35 },
    { name: 'Telegram', value: 25 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Track your social media performance</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Posts Timeline</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="posts" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Post History Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Posts</h2>
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
                const platforms = Array.isArray(post.platforms) ? post.platforms : (post.platforms ? [post.platforms] : []);
                
                // Platform icons mapping
                const platformIcons = {
                  linkedin: { emoji: '🔗', color: 'bg-blue-100 text-blue-800', name: 'LinkedIn' },
                  twitter: { emoji: '🐦', color: 'bg-sky-100 text-sky-800', name: 'Twitter' },
                  telegram: { emoji: '💬', color: 'bg-indigo-100 text-indigo-800', name: 'Telegram' },
                  instagram: { emoji: '📸', color: 'bg-pink-100 text-pink-800', name: 'Instagram' }
                };

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {platforms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {platforms.map((platform, pIdx) => {
                            const platformInfo = platformIcons[platform.toLowerCase()] || { emoji: '📱', color: 'bg-gray-100 text-gray-800', name: platform };
                            return (
                              <span 
                                key={pIdx}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${platformInfo.color} transition hover:scale-110`}
                                title={platformInfo.name}
                              >
                                <span className="text-base">{platformInfo.emoji}</span>
                                <span>{platformInfo.name}</span>
                              </span>
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
      </div>
    </motion.div>
  );
}

