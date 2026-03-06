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

// Core routes
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';

// Lazy load
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
const Business = lazy(() => import('./pages/Business'));

/* ─── SVG Icons ─── */
const icons = {
  dashboard: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  create: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  calendar: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  accounts: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  analytics: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  agent: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4zM6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="12" cy="6" r="1" fill="currentColor"/></svg>,
  settings: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  pricing: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  chevron: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>,
  logout: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  menu: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  close: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>,
};

function Navigation() {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [billingInfo, setBillingInfo] = useState(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        if (user) {
          const { data } = await api.get('/billing/usage');
          setBillingInfo(data);
        }
      } catch (err) { /* silent */ }
    };
    fetchBilling();
  }, [user]);

  // Close dropdown on route change
  useEffect(() => { setMoreOpen(false); setMobileMenuOpen(false); }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.more-dropdown')) setMoreOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [moreOpen]);

  const isActive = (path) => location.pathname === path || location.pathname === `${path}/`;

  const primaryNav = [
    { path: '/', label: 'Dashboard', icon: icons.dashboard },
    { path: '/create', label: 'Create', icon: icons.create },
    { path: '/calendar', label: 'Calendar', icon: icons.calendar },
    { path: '/content-agent', label: 'AI Agent', icon: icons.agent },
    { path: '/analytics', label: 'Analytics', icon: icons.analytics },
    { path: '/connect-accounts', label: 'Accounts', icon: icons.accounts },
  ];

  const secondaryNav = [
    { path: '/templates', label: 'Templates' },
    { path: '/bulk-upload', label: 'Bulk Upload' },
    { path: '/carousel', label: 'Carousel' },
    { path: '/content-recycling', label: 'Recycling' },
    { path: '/ab-testing', label: 'A/B Testing' },
    { path: '/hashtag-analytics', label: 'Hashtags' },
    { path: '/webhooks', label: 'Webhooks' },
    { path: '/approvals', label: 'Approvals' },
    { path: '/team', label: 'Team' },
    { path: '/business', label: 'Business Profile' },
    { path: '/settings', label: 'Settings' },
    { path: '/pricing', label: 'Pricing' },
  ];

  if (isAdmin) secondaryNav.unshift({ path: '/admin/users', label: 'Admin' });

  const allNav = [...primaryNav, ...secondaryNav];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Primary Nav */}
          <div className="flex items-center gap-1">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 mr-6 group">
              <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-display text-base text-white hidden xl:block">Social Media Automator</span>
            </Link>

            {/* Primary Nav — Desktop */}
            <div className="hidden lg:flex items-center">
              {primaryNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-accent bg-accent/[0.08]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={isActive(item.path) ? 'text-accent' : 'text-zinc-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* More dropdown */}
              <div className="relative more-dropdown">
                <button
                  onClick={(e) => { e.stopPropagation(); setMoreOpen(!moreOpen); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    moreOpen ? 'text-zinc-200 bg-white/[0.06]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  More
                  <span className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`}>{icons.chevron}</span>
                </button>

                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-52 bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 py-1.5 z-50 max-h-[70vh] overflow-y-auto custom-scrollbar"
                    >
                      {secondaryNav.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`block px-4 py-2 text-[13px] transition-colors ${
                            isActive(item.path)
                              ? 'text-accent bg-accent/[0.06]'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right: Plan + Notifications + User + Mobile toggle */}
          <div className="flex items-center gap-3">
            {/* Plan badge — desktop */}
            {billingInfo?.plan?.name && (
              <div className="hidden lg:flex items-center gap-2">
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  billingInfo.plan.name === 'free'
                    ? 'text-zinc-500 border-zinc-700/50 bg-zinc-800/30'
                    : billingInfo.plan.name === 'pro'
                      ? 'text-accent border-accent/20 bg-accent/[0.06]'
                      : 'text-violet-400 border-violet-500/20 bg-violet-500/[0.06]'
                }`}>
                  {billingInfo.plan.name}
                </span>
                {billingInfo.plan.name === 'free' && (
                  <Link to="/pricing" className="text-[11px] font-semibold text-[#0a0a0b] bg-accent hover:bg-accent-hover px-3 py-1 rounded-full transition-colors">
                    Upgrade
                  </Link>
                )}
              </div>
            )}

            <NotificationBell />

            {/* User avatar + dropdown — desktop */}
            <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-white/[0.06]">
              <span className="text-[13px] text-zinc-400 max-w-[160px] truncate">{user?.email}</span>
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Sign out"
              >
                {icons.logout}
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {mobileMenuOpen ? icons.close : icons.menu}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-white/[0.06] overflow-hidden"
            >
              <div className="py-3 space-y-0.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {allNav.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-accent bg-accent/[0.08]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-white/[0.06] my-2" />
                <div className="px-4 py-2 text-[12px] text-zinc-500 truncate">{user?.email}</div>
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#0a0a0b]">
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
                <Route path="/business" element={<ProtectedRoute><Business /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#18181b', color: '#fafafa', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '13px' },
              success: { duration: 4000, iconTheme: { primary: '#22d3ee', secondary: '#18181b' } },
              error: { duration: 5000, iconTheme: { primary: '#f87171', secondary: '#18181b' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
