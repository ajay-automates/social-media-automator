import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { DashboardSkeleton } from '../components/ui/LoadingStates';
import { NoPostsEmpty } from '../components/ui/EmptyState';
import { showError } from '../components/ui/Toast';
import { staggerContainer } from '../utils/animations';
import UpgradeModal from '../components/UpgradeModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [billingInfo, setBillingInfo] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadBillingInfo();
  }, []);

  const loadBillingInfo = async () => {
    try {
      const response = await api.get('/billing/usage');
      setBillingInfo(response.data);
      
      // Check if user has hit post limit
      const { usage, plan } = response.data;
      if (plan.name === 'free' && usage.posts.used >= usage.posts.limit) {
        setShowUpgrade(true);
      }
    } catch (err) {
      console.error('Error loading billing info:', err);
    }
  };

  // Refresh when user returns to dashboard
  useEffect(() => {
    const handleFocus = () => {
      loadDashboardData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      // Fetch analytics overview which contains the stats we need
      const [analyticsResponse, historyResponse] = await Promise.all([
        api.get('/analytics/overview').catch(() => null),
        api.get('/history?limit=10').catch(() => null),
      ]);

      if (analyticsResponse?.data) {
        const analytics = analyticsResponse.data;
        setStats({
          postsToday: analytics.postsToday || 0,
          totalPosts: analytics.totalPosts || 0,
          successRate: analytics.successRate || 0,
          scheduledCount: analytics.scheduledCount || 0,
          activePlatforms: analytics.activePlatforms || 0,
          recentPosts: historyResponse?.data?.history || []
        });
      } else {
        // If API fails, show default empty stats
        setStats({
          postsToday: 0,
          totalPosts: 0,
          successRate: 0,
          scheduledCount: 0,
          activePlatforms: 0,
          recentPosts: []
        });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    navigate('/create');
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Initialize stats if null to prevent blank screen
  if (!stats) {
    setStats({
      postsToday: 0,
      totalPosts: 0,
      successRate: 0,
      scheduledCount: 0,
      activePlatforms: 0,
      recentPosts: []
    });
    return null;
  }

  const hasNoActivity = stats.totalPosts === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Manage your social media posts from one place.</p>
      </div>
      
      {/* Usage Summary */}
      {billingInfo && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  You've used {billingInfo.usage.posts.used}/{billingInfo.usage.posts.limit} posts this month
                </p>
                {billingInfo.usage.posts.used / billingInfo.usage.posts.limit >= 0.8 && (
                  <p className={`text-xs mt-1 ${billingInfo.usage.posts.used >= billingInfo.usage.posts.limit ? 'text-red-600' : 'text-yellow-600'}`}>
                    {billingInfo.usage.posts.used >= billingInfo.usage.posts.limit ? '❌ Limit reached' : '⚠️ Approaching limit'}
                  </p>
                )}
              </div>
            </div>
            {billingInfo.plan.name === 'free' && (
              <Link
                to="/pricing"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm ml-2"
              >
                Upgrade →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <motion.div 
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="text-3xl font-bold">{stats?.postsToday || 0}</div>
          <div className="text-blue-100 mt-1">Posts Today</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="text-3xl font-bold">{stats?.activePlatforms || 0}</div>
          <div className="text-green-100 mt-1">Platforms</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="text-3xl font-bold">{stats?.successRate || 0}%</div>
          <div className="text-purple-100 mt-1">Success Rate</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="text-3xl font-bold">{stats?.scheduledCount || 0}</div>
          <div className="text-orange-100 mt-1">Scheduled</div>
        </motion.div>
      </motion.div>

      {hasNoActivity && (
        <div className="mb-8">
          <NoPostsEmpty onCreate={handleCreatePost} />
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Link 
              to="/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              ➕ Create New Post
            </Link>
            <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
              📅 View Calendar
            </button>
            <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
              📊 View Analytics
            </button>
          </div>
        </div>
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transition"
        >
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Posts</h2>
          <p className="text-gray-600 mb-4">Manage your social media content</p>
          <Link to="/create" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
            Create Post →
          </Link>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transition"
        >
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
          <p className="text-gray-600 mb-4">Track performance metrics</p>
          <Link to="/analytics" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
            View Analytics →
          </Link>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transition"
        >
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
          <p className="text-gray-600 mb-4">Configure your accounts</p>
          <Link to="/settings" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
            Open Settings →
          </Link>
        </motion.div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="posts_limit"
        currentPlan={billingInfo?.plan?.name || 'free'}
      />
    </motion.div>
  );
}

