import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationBell from './components/NotificationBell';
import RouteLoadingFallback from './components/ui/RouteLoadingFallback';
import api from './lib/api';

// Core routes - keep in main bundle for fast initial load
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';

// Lazy load all other routes for code splitting
const Analytics = lazy(() => import('./pages/Analytics'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Templates = lazy(() => import('./pages/Templates'));
const Team = lazy(() => import('./pages/Team'));
const Settings = lazy(() => import('./pages/Settings'));
const ConnectAccounts = lazy(() => import('./pages/ConnectAccounts'));
const Pricing = lazy(() => import('./pages/Pricing'));
const BulkUpload = lazy(() => import('./pages/BulkUpload'));
const CreateCarousel = lazy(() => import('./pages/CreateCarousel'));
const ContentAgent = lazy(() => import('./pages/ContentAgent'));
const ContentRecycling = lazy(() => import('./pages/ContentRecycling'));
const Webhooks = lazy(() => import('./pages/Webhooks'));
const ABTesting = lazy(() => import('./pages/ABTesting'));
const HashtagAnalytics = lazy(() => import('./pages/HashtagAnalytics'));
const Approvals = lazy(() => import('./pages/Approvals'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));

function Navigation() {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [billingInfo, setBillingInfo] = useState(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        if (user) {
          const { data } = await api.get('/billing/usage');
          setBillingInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch billing info', err);
      }
    };
    fetchBilling();
  }, [user]);

  const isActive = (path) => location.pathname === path || location.pathname === `${path}/`;

  // TIER 1: Core Navigation (Always visible - 3 items)
  const coreNavItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/create', label: 'Create Post', icon: '✨' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
  ];

  // TIER 2: Quick Actions (Secondary nav - 3 items)
  const quickActionItems = [
    { path: '/connect-accounts', label: 'Accounts', icon: '🔗' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/pricing', label: 'Pricing', icon: '💎' },
  ];

  // TIER 3: User Dropdown (organized by category)
  const userMenuItems = [
    // Key Features
    { path: '/content-agent', label: 'AI Agent', icon: '🤖', category: 'Features' },
    { path: '/team', label: 'Team', icon: '👥', category: 'Features' },
    { path: '/viral-posts', label: 'Viral Posts', icon: '🔥', category: 'Features' },
    { path: '/ai-news', label: 'AI News', icon: '📰', category: 'Features' },
    { path: '/saved-items', label: 'Saved Items', icon: '🔖', category: 'Features' },

    // Content Tools
    { path: '/carousel', label: 'Create Carousel', icon: '📸', category: 'Content' },
    { path: '/bulk-upload', label: 'Bulk Upload', icon: '📤', category: 'Content' },
    { path: '/templates', label: 'Templates', icon: '📝', category: 'Content' },
    { path: '/content-recycling', label: 'Content Recycling', icon: '♻️', category: 'Content' },

    // Analytics & Testing
    { path: '/ab-testing', label: 'A/B Testing', icon: '🧪', category: 'Analytics' },
    { path: '/hashtag-analytics', label: 'Hashtag Analytics', icon: '#️⃣', category: 'Analytics' },

    // Automation
    { path: '/webhooks', label: 'Webhooks', icon: '🔔', category: 'Automation' },
    { path: '/approvals', label: 'Approvals', icon: '⏳', category: 'Automation' },

    // Settings
    { path: '/settings', label: 'Settings', icon: '⚙️', category: 'Settings' },
  ];

  // Admin Item (Only visible to admin)
  if (isAdmin) {
    userMenuItems.unshift({ path: '/admin/users', label: 'User Management', icon: '👑', category: 'Admin' });
  }

  // All items for mobile menu
  const allNavItems = [...coreNavItems, ...quickActionItems, ...userMenuItems];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/10 shadow-2xl"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <motion.div
              className="flex-shrink-0 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-3xl"
              >
                🚀
              </motion.span>
              <h1 className="text-base xl:text-lg 2xl:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">Social Media Automator</h1>
            </motion.div>

            {/* TIER 1: Core Nav Items - Desktop Only */}
            <div className="hidden lg:flex ml-10 items-center space-x-2">
              {coreNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative group px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                >
                  <span className={`flex items-center gap-2 ${isActive(item.path) ? 'text-blue-300' : 'text-gray-400 group-hover:text-blue-200'}`}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>

                  {/* Gradient underline */}
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Hover glow */}
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              ))}

              {/* Divider */}
              <div className="h-8 w-px bg-white/20 mx-2"></div>

              {/* TIER 2: Quick Actions */}
              {quickActionItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative group px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                >
                  <span className={`flex items-center gap-2 ${isActive(item.path) ? 'text-purple-300' : 'text-gray-400 group-hover:text-purple-200'}`}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>

                  {/* Gradient underline */}
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeTabQuick"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Hover glow */}
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              ))}

            </div>
          </div>

          {/* Free Plan Usage Indicator */}
          {billingInfo?.plan?.name === 'Free' && (
            <Link to="/pricing" className="hidden lg:flex items-center gap-3 px-4 py-1.5 mr-4 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 rounded-full group hover:border-blue-500/30 transition-all">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider group-hover:text-blue-300 transition-colors">Free Plan</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(billingInfo.usage.posts.used / billingInfo.plan.limits.posts) > 0.8 ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                      style={{ width: `${Math.min((billingInfo.usage.posts.used / billingInfo.plan.limits.posts) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-white font-bold">
                    {billingInfo.usage.posts.used}/{billingInfo.plan.limits.posts}
                  </span>
                </div>
              </div>
              <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                ⚡
              </div>
            </Link>
          )}

          {/* User Section */}
          <div className="flex items-center gap-4">
            <NotificationBell />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* User Dropdown (Desktop) */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl glass border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-all backdrop-blur-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium truncate max-w-[150px]">{user?.email}</span>
                <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu - Glassmorphism Style */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 glass border-2 border-white/20 rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 40, 0.98) 100%)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                    }}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none"></div>

                    <div className="relative py-2">
                      {/* Group items by category */}
                      {['Admin', 'Features', 'Content', 'Analytics', 'Automation', 'Settings'].map((category, catIdx) => {
                        const categoryItems = userMenuItems.filter(item => item.category === category);
                        if (categoryItems.length === 0) return null;

                        return (
                          <div key={category}>
                            {catIdx > 0 && <div className="border-t border-white/10 my-2 mx-3"></div>}
                            <div className="px-4 py-2">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{category}</span>
                            </div>
                            {categoryItems.map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setUserMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 transition-all ${isActive(item.path)
                                  ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 border-l-2 border-blue-400'
                                  : 'text-gray-300 hover:bg-white/10 hover:text-white hover:border-l-2 hover:border-purple-400/50'
                                  }`}
                              >
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-sm font-medium">{item.label}</span>
                              </Link>
                            ))}
                          </div>
                        );
                      })}

                      <div className="border-t border-white/20 my-2 mx-3"></div>
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:text-red-300 transition-all group hover:border-l-2 hover:border-red-400"
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform">👋</span>
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-white/10 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2 max-h-[70vh] overflow-y-auto">
                {allNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path)
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                <div className="border-t border-white/10 my-2"></div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium"
                >
                  <span className="text-xl">👋</span>
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            <Navigation />

            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                <Route path="/content-agent" element={<ProtectedRoute><ContentAgent /></ProtectedRoute>} />
                <Route path="/content-recycling" element={<ProtectedRoute><ContentRecycling /></ProtectedRoute>} />
                <Route path="/webhooks" element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
                <Route path="/carousel" element={<ProtectedRoute><CreateCarousel /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                <Route path="/bulk-upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
                <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                <Route path="/accept-invite" element={<ProtectedRoute><AcceptInvitation /></ProtectedRoute>} />
                <Route path="/connect-accounts" element={<ProtectedRoute><ConnectAccounts /></ProtectedRoute>} />
                <Route path="/ab-testing" element={<ProtectedRoute><ABTesting /></ProtectedRoute>} />
                <Route path="/hashtag-analytics" element={<ProtectedRoute><HashtagAnalytics /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
                <Route path="/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                <Route path="/cancel" element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              success: {
                duration: 4000,
                style: {
                  background: '#10B981',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                  color: '#fff',
                },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
