import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../lib/api';
import { DashboardSkeleton } from '../components/ui/LoadingStates';
import { NoPostsEmpty } from '../components/ui/EmptyState';
import { showError } from '../components/ui/Toast';
import { staggerContainer } from '../utils/animations';
import UpgradeModal from '../components/UpgradeModal';
import Card3D from '../components/ui/Card3D';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import ContentIdeasModal from '../components/ContentIdeasModal';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';

function DashboardContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [billingInfo, setBillingInfo] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showContentIdeas, setShowContentIdeas] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [draftsCount, setDraftsCount] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { restartOnboarding, goToStep } = useOnboarding();

  useEffect(() => {
    loadDashboardData();
    loadBillingInfo();
    loadTeamData();
  }, []);

  // MANUAL TRIGGER ONLY - No auto-trigger to prevent infinite loops
  
  // Auto-open Content Ideas modal if requested from Create Post page
  useEffect(() => {
    if (location.state?.openContentIdeas) {
      setShowContentIdeas(true);
      window.history.replaceState({}, '');
    }
  }, [location]);

  // Resume onboarding after OAuth redirect
  useEffect(() => {
    // Check localStorage for resume flag (more reliable than URL params with React Router)
    const resumeStep = localStorage.getItem('sma_resume_onboarding_step');
    
    if (resumeStep) {
      const stepNumber = parseInt(resumeStep);
      
      // Remove the resume flag immediately to prevent loops
      localStorage.removeItem('sma_resume_onboarding_step');
      
      // Update onboarding state in localStorage
      const storageKey = 'sma_onboarding_state';
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const state = JSON.parse(saved);
          state.currentStep = stepNumber;
          state.onboardingComplete = false;
          state.hasConnectedAccount = true;
          localStorage.setItem(storageKey, JSON.stringify(state));
        } else {
          // Create fresh state at specified step
          localStorage.setItem(storageKey, JSON.stringify({
            isNewUser: false,
            currentStep: stepNumber,
            hasConnectedAccount: true,
            hasCreatedFirstPost: false,
            onboardingComplete: false,
            skipped: false,
            skipCount: 0
          }));
        }
      } catch (error) {
        console.error('Error updating onboarding state:', error);
      }
      
      // Set step in context
      goToStep(stepNumber);
      
      // Reload data to show connected accounts
      setTimeout(() => {
        loadDashboardData();
      }, 100);
      
      // Wait for everything to settle, then open modal
      setTimeout(() => {
        setShowOnboarding(true);
      }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goToStep]);

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

  const loadTeamData = async () => {
    try {
      // Load workspace info to get user role
      const workspaceRes = await api.get('/workspace/info').catch(() => null);
      if (workspaceRes?.data?.success) {
        setUserRole(workspaceRes.data.workspace.role);
      }

      // Load pending approvals count (for Owner/Admin)
      const approvalsRes = await api.get('/notifications/count').catch(() => null);
      if (approvalsRes?.data?.success) {
        setPendingApprovalsCount(approvalsRes.data.count || 0);
      }

      // Load drafts count (for all users)
      const draftsRes = await api.get('/posts/drafts').catch(() => null);
      if (draftsRes?.data?.success) {
        setDraftsCount(draftsRes.data.drafts?.length || 0);
      }
    } catch (err) {
      console.error('Error loading team data:', err);
      // Silently fail - team features are optional
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

  const handleRestartOnboarding = () => {
    restartOnboarding();
    setShowOnboarding(true);
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
    <>
      {/* Onboarding Flow - Manual Trigger Only */}
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      
      {/* Regular Dashboard */}
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
          className="text-4xl font-bold text-gray-900 dark:bg-gradient-to-r dark:from-blue-300 dark:to-purple-300 dark:bg-clip-text dark:text-transparent mb-2"
        >
          Dashboard
        </motion.h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back! Manage your social media posts from one place.</p>
      </div>
      
      {/* Usage Summary */}
      {billingInfo && billingInfo.usage && billingInfo.usage.posts && billingInfo.plan && billingInfo.plan.name && (
        <div className="mb-6 relative z-10">
          <div className="bg-white dark:bg-gray-900/30 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  You've used {billingInfo.usage.posts.used}/{billingInfo.usage.posts.limit} posts this month
                </p>
                {billingInfo.usage.posts.used / billingInfo.usage.posts.limit >= 0.8 && (
                  <p className={`text-xs mt-1 ${billingInfo.usage.posts.used >= billingInfo.usage.posts.limit ? 'text-red-500 dark:text-red-400' : 'text-yellow-600 dark:text-gray-900 dark:text-yellow-400'}`}>
                    {billingInfo.usage.posts.used >= billingInfo.usage.posts.limit ? '❌ Limit reached' : '⚠️ Approaching limit'}
                  </p>
                )}
              </div>
            </div>
            {billingInfo.plan && billingInfo.plan.name === 'free' && (
              <Link
                to="/pricing"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm ml-2"
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 relative z-10"
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

      {/* No Connected Accounts Banner */}
      {displayStats.activePlatforms === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative z-10"
        >
          <div className="bg-gray-100 dark:bg-gradient-to-r dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-lg border border-gray-200 dark:border-2 dark:border-blue-400/30 rounded-2xl p-8 text-center shadow-sm dark:shadow-2xl dark:shadow-blue-500/20">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">No Platforms Connected</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              Connect your social media accounts to start posting across multiple platforms instantly!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/connect-accounts')}
                className="bg-blue-600 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 dark:hover:shadow-xl dark:hover:shadow-blue-500/50 transition-all inline-flex items-center gap-2"
              >
                <span>🚀 Connect Accounts</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestartOnboarding}
                className="bg-white dark:glass border border-gray-300 dark:border-2 dark:border-purple-400/50 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-all inline-flex items-center gap-2"
              >
                <span>🎓 Start Tutorial</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {hasNoActivity && displayStats.activePlatforms > 0 && (
        <div className="mb-8 relative z-10">
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
            <div className="flex gap-4 flex-wrap">
              <Link to="/create">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:bg-blue-700 transition-all"
                >
                  ➕ Create New Post
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowContentIdeas(true)}
                className="bg-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:bg-gray-50 border border-gray-200 dark:border-0 transition-all"
              >
                💡 Get Content Ideas
              </motion.button>

              {/* Pending Approvals (Owner/Admin only) */}
              {(userRole === 'owner' || userRole === 'admin') && pendingApprovalsCount > 0 && (
                <Link to="/approvals">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(234, 179, 8, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white dark:bg-gradient-to-r dark:from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 shadow-lg relative"
                  >
                    ⏳ Pending Approvals
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                      {pendingApprovalsCount}
                    </span>
                  </motion.button>
                </Link>
              )}

              {/* My Drafts (All users) */}
              {draftsCount > 0 && (
                <Link to="/create">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white dark:bg-white/10 backdrop-blur-sm text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-white/20 transition inline-flex items-center gap-2 border border-gray-200 dark:border-white/20 relative"
                  >
                    📝 My Drafts
                    <span className="ml-1 bg-blue-500/30 text-blue-600 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">
                      {draftsCount}
                    </span>
                  </motion.button>
                </Link>
              )}

              <Link to="/calendar">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-200/60 dark:bg-white/10 backdrop-blur-sm text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-300/60 dark:hover:bg-white/20 transition inline-flex items-center gap-2 border border-gray-400 dark:border-white/20"
                >
                  📅 View Calendar
                </motion.button>
              </Link>
              <Link to="/analytics">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-200/60 dark:bg-white/10 backdrop-blur-sm text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-300/60 dark:hover:bg-white/20 transition inline-flex items-center gap-2 border border-gray-400 dark:border-white/20"
                >
                  📊 View Analytics
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestartOnboarding}
                className="bg-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 border border-gray-200 dark:border-0 dark:hover:shadow-xl dark:hover:shadow-purple-500/50 transition inline-flex items-center gap-2"
              >
                🎓 Start Tutorial
              </motion.button>
            </div>
          </div>
        </Card3D>
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 relative z-10">
        <Card3D 
          gradient="from-blue-500/20 via-cyan-500/20 to-blue-600/20"
          shadowColor="rgba(59, 130, 246, 0.3)"
        >
          <div className="p-6">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Posts</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Manage your social media content</p>
            <Link to="/create" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1">
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Analytics</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Track performance metrics</p>
            <Link to="/analytics" className="text-blue-600 dark:text-blue-600 dark:text-purple-400 hover:text-blue-700 dark:hover:text-purple-300 font-semibold inline-flex items-center gap-1">
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Configure your accounts</p>
            <Link to="/settings" className="text-blue-600 dark:text-blue-600 dark:text-green-400 hover:text-blue-700 dark:hover:text-green-300 font-semibold inline-flex items-center gap-1">
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

      <ContentIdeasModal
        isOpen={showContentIdeas}
        onClose={() => setShowContentIdeas(false)}
      />
      </motion.div>
    </>
  );
}

export default function Dashboard() {
  return (
    <OnboardingProvider>
      <DashboardContent />
    </OnboardingProvider>
  );
}

