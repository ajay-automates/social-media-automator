import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import CreateCarousel from './pages/CreateCarousel';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import BulkUpload from './pages/BulkUpload';
import Settings from './pages/Settings';
import ConnectAccounts from './pages/ConnectAccounts';
import Templates from './pages/Templates';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Team from './pages/Team';
import Approvals from './pages/Approvals';
import AcceptInvitation from './pages/AcceptInvitation';
import NotificationBell from './components/NotificationBell';

function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isActive = (path) => location.pathname === path || location.pathname === `${path}/`;
  
  // Core nav items (always visible on desktop)
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/create', label: 'Create Post', icon: '✨' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/connect-accounts', label: 'Connect Accounts', icon: '🔗' },
    { path: '/team', label: 'Team', icon: '👥' },
  ];
  
  // User dropdown items (secondary features)
  const userMenuItems = [
    { path: '/carousel', label: 'Create Carousel', icon: '📸' },
    { path: '/bulk-upload', label: 'Bulk Upload', icon: '📤' },
    { path: '/templates', label: 'Templates', icon: '📝' },
    { path: '/approvals', label: 'Approvals', icon: '⏳' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { path: '/pricing', label: 'Pricing', icon: '💎' },
  ];
  
  // All items for mobile menu
  const allNavItems = [...navItems, ...userMenuItems];
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 shadow-sm shadow-gray-900/5 dark:shadow-2xl transition-colors duration-300"
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
              <h1 className="text-base xl:text-lg 2xl:text-xl font-bold text-gray-900 tracking-tight dark:bg-gradient-to-r dark:from-blue-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent whitespace-nowrap">Social Media Automator</h1>
            </motion.div>
            
            {/* Nav Items - Desktop Only (Core 6 items) */}
            <div className="hidden lg:flex ml-10 items-center space-x-4">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className="relative group px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                >
                  <span className={`flex items-center gap-2 font-medium ${isActive(item.path) ? 'text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-200'}`}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  
                  {/* Active underline */}
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-gradient-to-r dark:from-blue-500 dark:via-purple-500 dark:to-pink-500 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Hover glow */}
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              ))}
            </div>
          </div>
          
          {/* User Section */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            {/* Theme Toggle Button */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-gray-100 dark:glass border border-gray-200 dark:border-white/20 hover:bg-gray-200 hover:shadow-sm dark:hover:border-white/40 transition-all backdrop-blur-lg group"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
            </motion.button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all"
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
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-100 dark:glass border border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-200 hover:shadow-sm dark:hover:text-white hover:border-gray-300 dark:hover:border-white/40 transition-all backdrop-blur-lg"
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
                    className="absolute right-0 mt-2 w-64 glass border border-gray-200 dark:border-2 dark:border-white/20 rounded-2xl shadow-xl shadow-gray-900/10 dark:shadow-2xl overflow-hidden z-50"
                    style={{
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 40, 0.98) 100%)'
                        : 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: theme === 'dark'
                        ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                        : '0 12px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04) inset'
                    }}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none"></div>
                    
                    <div className="relative py-2">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setUserMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                            isActive(item.path)
                              ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/30 dark:to-purple-600/30 text-blue-600 dark:text-blue-300 border-l-2 border-blue-600 dark:border-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                      ))}
                      <div className="border-t border-gray-200 dark:border-white/20 my-2 mx-3"></div>
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gradient-to-r dark:hover:from-red-500/20 dark:hover:to-pink-500/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 group"
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
              className="lg:hidden border-t border-gray-200 dark:border-white/10 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2 max-h-[70vh] overflow-y-auto">
                {allNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                <div className="border-t border-gray-200 dark:border-white/10 my-2"></div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
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
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
            <Navigation />
            
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
              <Route path="/carousel" element={<ProtectedRoute><CreateCarousel /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/bulk-upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
              <Route path="/accept-invite" element={<ProtectedRoute><AcceptInvitation /></ProtectedRoute>} />
              <Route path="/connect-accounts" element={<ProtectedRoute><ConnectAccounts /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
              <Route path="/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
              <Route path="/cancel" element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
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
