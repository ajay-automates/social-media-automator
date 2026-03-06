import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../lib/api';
import { DashboardSkeleton } from '../components/ui/LoadingStates';
import { NoPostsEmpty } from '../components/ui/EmptyState';
import { showError } from '../components/ui/Toast';
import UpgradeModal from '../components/UpgradeModal';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import ContentIdeasModal from '../components/ContentIdeasModal';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import AINewsFeedSection from '../components/dashboard/AINewsFeedSection';

const statCards = [
  {
    key: 'postsToday',
    label: 'Posts today',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    key: 'activePlatforms',
    label: 'Platforms',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
  },
  {
    key: 'successRate',
    label: 'Success rate',
    suffix: '%',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  {
    key: 'scheduledCount',
    label: 'Scheduled',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
];

const quickLinks = [
  { to: '/calendar', label: 'Calendar', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { to: '/analytics', label: 'Analytics', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  { to: '/connect-accounts', label: 'Accounts', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> },
  { to: '/templates', label: 'Templates', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
];

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
  const [onboardingCheckComplete, setOnboardingCheckComplete] = useState(false);
  const { restartOnboarding, goToStep, isNewUser } = useOnboarding();

  useEffect(() => {
    Promise.all([loadDashboardData(), loadBillingInfo(), loadTeamData()])
      .catch(err => console.error('Error loading dashboard data:', err));
  }, []);

  useEffect(() => {
    if (loading || onboardingCheckComplete) return;
    const checkAndOpenOnboarding = async () => {
      try {
        if (isNewUser) { setShowOnboarding(true); setOnboardingCheckComplete(true); return; }
        try {
          const response = await api.get('/accounts');
          const accounts = response.data?.accounts || response.data || [];
          if (Array.isArray(accounts) && accounts.length === 0) {
            restartOnboarding();
            setShowOnboarding(true);
          }
        } catch { /* silent */ }
      } finally {
        setOnboardingCheckComplete(true);
      }
    };
    checkAndOpenOnboarding();
  }, [isNewUser, loading, onboardingCheckComplete, restartOnboarding]);

  useEffect(() => {
    if (location.state?.openContentIdeas) {
      setShowContentIdeas(true);
      window.history.replaceState({}, '');
    }
  }, [location]);

  useEffect(() => {
    const resumeStep = localStorage.getItem('sma_resume_onboarding_step');
    if (resumeStep) {
      const stepNumber = parseInt(resumeStep);
      localStorage.removeItem('sma_resume_onboarding_step');
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
          localStorage.setItem(storageKey, JSON.stringify({
            isNewUser: false, currentStep: stepNumber, hasConnectedAccount: true,
            hasCreatedFirstPost: false, onboardingComplete: false, skipped: false, skipCount: 0,
          }));
        }
      } catch { /* silent */ }
      goToStep(stepNumber);
      setTimeout(() => loadDashboardData(), 100);
      setTimeout(() => setShowOnboarding(true), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goToStep]);

  const loadBillingInfo = async () => {
    try {
      const response = await api.get('/billing/usage');
      const data = response.data;
      setBillingInfo(data);
      const { usage, plan } = data;
      if (plan?.name === 'free' && usage?.posts?.used >= usage?.posts?.limit) setShowUpgrade(true);
      return data;
    } catch { setBillingInfo(null); return null; }
  };

  const loadTeamData = async () => {
    try {
      const [workspaceRes, approvalsRes, draftsRes] = await Promise.all([
        api.get('/workspace/info').catch(() => null),
        api.get('/notifications/count').catch(() => null),
        api.get('/posts/drafts').catch(() => null),
      ]);
      if (workspaceRes?.data?.success) setUserRole(workspaceRes.data.workspace.role);
      if (approvalsRes?.data?.success) setPendingApprovalsCount(approvalsRes.data.count || 0);
      if (draftsRes?.data?.success) setDraftsCount(draftsRes.data.drafts?.length || 0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    window.addEventListener('focus', loadDashboardData);
    return () => window.removeEventListener('focus', loadDashboardData);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [analyticsResponse, historyResponse] = await Promise.all([
        api.get('/analytics/overview').catch(() => null),
        api.get('/history?limit=10').catch(() => null),
      ]);
      if (analyticsResponse?.data) {
        const a = analyticsResponse.data;
        setStats({
          postsToday: a.postsToday || 0,
          totalPosts: a.totalPosts || 0,
          successRate: a.successRate || 0,
          scheduledCount: a.scheduledCount || 0,
          activePlatforms: a.activePlatforms || 0,
          recentPosts: historyResponse?.data?.history || [],
        });
      } else {
        setStats({ postsToday: 0, totalPosts: 0, successRate: 0, scheduledCount: 0, activePlatforms: 0, recentPosts: [] });
      }
    } catch (err) {
      setError(err.message);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestartOnboarding = () => { restartOnboarding(); setShowOnboarding(true); };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><DashboardSkeleton /></div>;
  }

  if (error && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" fill="none" stroke="#f87171" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Failed to load dashboard</h2>
          <p className="text-sm text-[#a1a1aa] mb-4">{error}</p>
          <button onClick={loadDashboardData} className="bg-[#22d3ee] text-[#0a0a0b] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#06b6d4] transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayStats = stats || { postsToday: 0, totalPosts: 0, successRate: 0, scheduledCount: 0, activePlatforms: 0, recentPosts: [] };
  const hasNoActivity = displayStats.totalPosts === 0;
  const usagePct = billingInfo?.usage?.posts
    ? (billingInfo.usage.posts.used / billingInfo.usage.posts.limit) * 100
    : 0;

  return (
    <>
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-[#111113] border border-white/[0.06] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#52525b] font-medium">{s.label}</span>
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#52525b]">
                  {s.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                <AnimatedNumber value={displayStats[s.key] || 0} suffix={s.suffix} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Usage bar (when near limit) */}
        {billingInfo?.usage?.posts && usagePct >= 60 && (
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#a1a1aa]">
                  {billingInfo.usage.posts.used} / {billingInfo.usage.posts.limit} posts used this month
                </span>
                <span className={`text-xs font-medium ${usagePct >= 100 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {Math.round(usagePct)}%
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePct >= 100 ? 'bg-red-500' : usagePct >= 80 ? 'bg-yellow-500' : 'bg-[#22d3ee]'}`}
                  style={{ width: `${Math.min(usagePct, 100)}%` }}
                />
              </div>
            </div>
            {billingInfo.plan?.name === 'free' && (
              <Link to="/pricing" className="flex-shrink-0 text-xs font-semibold text-[#22d3ee] hover:text-[#06b6d4] transition-colors">
                Upgrade
              </Link>
            )}
          </div>
        )}

        {/* No platforms banner */}
        {displayStats.activePlatforms === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111113] border border-[#22d3ee]/20 rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" fill="none" stroke="#22d3ee" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-white mb-1">No platforms connected</h2>
            <p className="text-sm text-[#a1a1aa] mb-4">Connect your social media accounts to start posting across multiple platforms.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate('/connect-accounts')}
                className="bg-[#22d3ee] text-[#0a0a0b] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#06b6d4] transition-colors"
              >
                Connect accounts
              </button>
              <button
                onClick={handleRestartOnboarding}
                className="bg-white/[0.06] border border-white/[0.08] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/[0.1] transition-colors"
              >
                Start tutorial
              </button>
            </div>
          </motion.div>
        )}

        {/* No activity empty state */}
        {hasNoActivity && displayStats.activePlatforms > 0 && (
          <NoPostsEmpty onCreate={() => navigate('/create')} />
        )}

        {/* Quick actions */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#52525b] uppercase tracking-wider mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/create">
              <button className="bg-[#22d3ee] text-[#0a0a0b] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#06b6d4] transition-colors flex items-center gap-2">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create post
              </button>
            </Link>
            <button
              onClick={() => setShowContentIdeas(true)}
              className="bg-white/[0.06] border border-white/[0.08] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/[0.1] transition-colors flex items-center gap-2"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Content ideas
            </button>
            {(userRole === 'owner' || userRole === 'admin') && pendingApprovalsCount > 0 && (
              <Link to="/approvals">
                <button className="relative bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center gap-2">
                  Pending approvals
                  <span className="bg-yellow-500 text-[#0a0a0b] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingApprovalsCount}
                  </span>
                </button>
              </Link>
            )}
            {draftsCount > 0 && (
              <Link to="/create">
                <button className="bg-white/[0.06] border border-white/[0.08] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/[0.1] transition-colors flex items-center gap-2">
                  Drafts
                  <span className="bg-[#22d3ee]/20 text-[#22d3ee] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{draftsCount}</span>
                </button>
              </Link>
            )}
            <button
              onClick={handleRestartOnboarding}
              className="bg-white/[0.06] border border-white/[0.08] text-[#a1a1aa] text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              Tutorial
            </button>
          </div>
        </div>

        {/* Quick nav links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3 hover:border-white/[0.12] hover:bg-white/[0.02] transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#52525b] group-hover:text-[#22d3ee] group-hover:bg-[#22d3ee]/10 transition-colors">
                  {link.icon}
                </div>
                <span className="text-sm font-medium text-[#a1a1aa] group-hover:text-white transition-colors">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* AI News Feed */}
        <AINewsFeedSection />

        <UpgradeModal
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          reason="posts_limit"
          currentPlan={billingInfo?.plan?.name || 'free'}
        />
        <ContentIdeasModal isOpen={showContentIdeas} onClose={() => setShowContentIdeas(false)} />
      </div>
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
