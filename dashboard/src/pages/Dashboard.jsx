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
import Card3D from '../components/ui/Card3D';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import AnimatedBackground from '../components/ui/AnimatedBackground';

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
      const data = response.data;
      setBillingInfo(data);
      
      // Check if user has hit post limit
      const { usage, plan } = data;
      if (plan && plan.name === 'free' && usage && usage.posts && usage.posts.used >= usage.posts.limit) {
        setShowUpgrade(true);
      }
    } catch (err) {
      console.error('Error loading billing info:', err);
      // Set default empty billing info on error
      setBillingInfo(null);
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

  // Show empty state with 0 stats if no data
  const displayStats = stats || {
    postsToday: 0,
    totalPosts: 0,
    successRate: 0,
    scheduledCount: 0,
    activePlatforms: 0,
    recentPosts: []
  };

  const hasNoActivity = displayStats.totalPosts === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Animated Background */}
      <AnimatedBackground variant="blue" />

      <div className="mb-8 relative z-10">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-2"
        >
          Dashboard
        </motion.h1>
        <p className="text-gray-400">Welcome back! Manage your social media posts from one place.</p>
      </div>
      
      {/* Usage Summary */}
      {billingInfo && billingInfo.usage && billingInfo.usage.posts && billingInfo.plan && billingInfo.plan.name && (
        <div className="mb-6 relative z-10">
          <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-semibold text-white">
                  You've used {billingInfo.usage.posts.used}/{billingInfo.usage.posts.limit} posts this month
                </p>
                {billingInfo.usage.posts.used / billingInfo.usage.posts.limit >= 0.8 && (
                  <p className={`text-xs mt-1 ${billingInfo.usage.posts.used >= billingInfo.usage.posts.limit ? 'text-red-400' : 'text-yellow-400'}`}>
                    {billingInfo.usage.posts.used >= billingInfo.usage.posts.limit ? '❌ Limit reached' : '⚠️ Approaching limit'}
                  </p>
                )}
              </div>
            </div>
            {billingInfo.plan && billingInfo.plan.name === 'free' && (
              <Link
                to="/pricing"
                className="text-blue-400 hover:text-blue-300 font-medium text-sm ml-2"
              >
                Upgrade →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards with 3D Tilt */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative z-10"
      >
        <Card3D 
          gradient="from-blue-400/80 via-blue-500/60 to-cyan-500/80"
          shadowColor="rgba(59, 130, 246, 0.5)"
        >
          <div className="p-6">
            <motion.div 
              className="text-5xl mb-2"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              📝
            </motion.div>
            <div className="text-4xl font-bold text-gray-50">
              <AnimatedNumber value={displayStats.postsToday || 0} />
            </div>
            <div className="text-blue-200 mt-2 font-medium">Posts Today</div>
          </div>
        </Card3D>
        
        <Card3D 
          gradient="from-green-400/80 via-emerald-500/60 to-teal-500/80"
          shadowColor="rgba(16, 185, 129, 0.5)"
        >
          <div className="p-6">
            <motion.div 
              className="text-5xl mb-2"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            >
              🌐
            </motion.div>
            <div className="text-4xl font-bold text-gray-50">
              <AnimatedNumber value={displayStats.activePlatforms || 0} />
            </div>
            <div className="text-green-200 mt-2 font-medium">Platforms</div>
          </div>
        </Card3D>
        
        <Card3D 
          gradient="from-purple-400/80 via-purple-500/60 to-pink-500/80"
          shadowColor="rgba(168, 85, 247, 0.5)"
        >
          <div className="p-6">
            <motion.div 
              className="text-5xl mb-2"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            >
              ✓
            </motion.div>
            <div className="text-4xl font-bold text-gray-50">
              <AnimatedNumber value={displayStats.successRate || 0} suffix="%" />
            </div>
            <div className="text-purple-200 mt-2 font-medium">Success Rate</div>
          </div>
        </Card3D>
        
        <Card3D 
          gradient="from-orange-400/80 via-amber-500/60 to-yellow-500/80"
          shadowColor="rgba(251, 146, 60, 0.5)"
        >
          <div className="p-6">
            <motion.div 
              className="text-5xl mb-2"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            >
              📅
            </motion.div>
            <div className="text-4xl font-bold text-gray-50">
              <AnimatedNumber value={displayStats.scheduledCount || 0} />
            </div>
            <div className="text-orange-200 mt-2 font-medium">Scheduled</div>
          </div>
        </Card3D>
      </motion.div>

      {hasNoActivity && (
        <div className="mb-8">
          <NoPostsEmpty onCreate={handleCreatePost} />
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="mb-8 relative z-10">
        <Card3D 
          gradient="from-gray-800/80 via-gray-900/60 to-black/80"
          shadowColor="rgba(107, 114, 128, 0.3)"
          hover3D={false}
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Quick Actions</h2>
            <div className="flex gap-4 flex-wrap">
              <Link to="/create">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 shadow-lg"
                >
                  ➕ Create New Post
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition inline-flex items-center gap-2 border border-white/20"
              >
                📅 View Calendar
              </motion.button>
              <Link to="/analytics">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition inline-flex items-center gap-2 border border-white/20"
                >
                  📊 View Analytics
                </motion.button>
              </Link>
            </div>
          </div>
        </Card3D>
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <Card3D 
          gradient="from-blue-500/20 via-cyan-500/20 to-blue-600/20"
          shadowColor="rgba(59, 130, 246, 0.3)"
        >
          <div className="p-6">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Posts</h2>
            <p className="text-gray-300 mb-4">Manage your social media content</p>
            <Link to="/create" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1">
              Create Post →
            </Link>
          </div>
        </Card3D>
        
        <Card3D 
          gradient="from-purple-500/20 via-pink-500/20 to-purple-600/20"
          shadowColor="rgba(168, 85, 247, 0.3)"
        >
          <div className="p-6">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Analytics</h2>
            <p className="text-gray-300 mb-4">Track performance metrics</p>
            <Link to="/analytics" className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1">
              View Analytics →
            </Link>
          </div>
        </Card3D>
        
        <Card3D 
          gradient="from-green-500/20 via-emerald-500/20 to-green-600/20"
          shadowColor="rgba(16, 185, 129, 0.3)"
        >
          <div className="p-6">
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Settings</h2>
            <p className="text-gray-300 mb-4">Configure your accounts</p>
            <Link to="/settings" className="text-green-400 hover:text-green-300 font-semibold inline-flex items-center gap-1">
              Open Settings →
            </Link>
          </div>
        </Card3D>
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

