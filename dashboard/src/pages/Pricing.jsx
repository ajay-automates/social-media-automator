import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

const plans = {
  free: {
    name: 'Free',
    description: 'Get started at no cost',
    price: 0,
    annual: 0,
    features: [
      '5 specific accounts',
      '10 posts/month',
      '5 AI post generations',
      '5 Images/month',
    ],
    features_excluded: [
      'Videos',
      'Voice generation',
      'Team members',
      'API access',
      'White-label options',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'For growing creators',
    price: 1000,
    annual: 10000,
    features: [
      'All 20+ accounts',
      '100 posts/month',
      'Unlimited AI post gen',
      '50 Images/month',
      '20 Videos',
      '10 Voice generations',
      '1 Team member',
    ],
    features_excluded: [
      'API access',
      'White-label options',
    ],
  },
  business: {
    name: 'Business',
    description: 'For agencies and teams',
    price: 5000,
    annual: 50000,
    features: [
      'All 20+ accounts',
      'Unlimited posts',
      'Unlimited AI post gen',
      'Unlimited Images',
      'Unlimited Videos',
      'Unlimited Voice gen',
      '5 Team members',
      'API access',
      'White-label options',
    ],
  },
};

export default function Pricing() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(true);

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      const response = await api.get('/billing/usage');
      if (response.data?.plan) setCurrentPlan(response.data.plan.name);
    } catch (err) {
      console.error('Error loading current plan:', err);
    } finally {
      setBillingLoading(false);
    }
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleUpgrade = async (planName) => {
    if (planName === 'free') { navigate('/dashboard'); return; }
    if (currentPlan === planName) { showError('You are already on this plan'); return; }

    setLoading(true);
    try {
      const response = await api.post('/billing/subscription', { plan: planName, billingCycle });

      if (response.data.free) {
        showSuccess(`Upgraded to ${planName} plan successfully!`);
        navigate('/success');
        return;
      }

      const res = await loadRazorpay();
      if (!res) { showError('Razorpay SDK failed to load'); return; }

      const { subscriptionId, keyId } = response.data;
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Social Media Automator',
        description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan Subscription`,
        currency: 'INR',
        handler: async (resp) => {
          try {
            await api.post('/billing/verify', {
              paymentData: {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_subscription_id: resp.razorpay_subscription_id,
                razorpay_signature: resp.razorpay_signature,
              },
              plan: planName,
            });
            showSuccess('Subscription activated successfully!');
            navigate('/success');
          } catch {
            showError('Payment verification failed');
          }
        },
        theme: { color: '#22d3ee' },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (window.confirm('Cancel your subscription? You will be downgraded to the Free plan immediately.')) {
      try {
        await api.post('/billing/cancel');
        showSuccess('Subscription cancelled successfully');
        loadCurrentPlan();
      } catch {
        showError('Failed to cancel subscription');
      }
    }
  };

  const getPrice = (plan) => billingCycle === 'monthly' ? plan.price : Math.round(plan.annual / 12);
  const getAnnualSavings = (plan) => plan.price === 0 ? 0 : plan.price * 12 - plan.annual;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl text-white mb-2">Simple, Transparent Pricing</h1>
        <p className="text-[#a1a1aa] text-sm">Choose the plan that fits your needs. No hidden fees.</p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 mt-6 bg-[#111113] border border-white/[0.06] rounded-xl p-1.5">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white/[0.08] text-white'
                : 'text-[#52525b] hover:text-[#a1a1aa]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-white/[0.08] text-white'
                : 'text-[#52525b] hover:text-[#a1a1aa]'
            }`}
          >
            Yearly
            <span className="text-[10px] font-bold text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/20 px-1.5 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {Object.entries(plans).map(([key, plan], index) => {
          const isPopular = key === 'pro';
          const isCurrent = currentPlan === key;
          const isFree = key === 'free';

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative flex flex-col rounded-xl p-6 ${
                isPopular
                  ? 'bg-[#111113] border border-[#22d3ee]/30 ring-1 ring-[#22d3ee]/10'
                  : 'bg-[#111113] border border-white/[0.06]'
              }`}
            >
              {/* Popular badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#22d3ee] text-[#0a0a0b] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              {/* Current plan badge */}
              {isCurrent && (
                <div className="absolute top-4 right-4 text-[10px] font-semibold text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/20 px-2 py-0.5 rounded-full">
                  Current
                </div>
              )}

              {/* Plan name & price */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1">{plan.name}</h3>
                <p className="text-xs text-[#52525b] mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  {isFree ? (
                    <span className="text-3xl font-bold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-white">₹{getPrice(plan).toLocaleString()}</span>
                      <span className="text-sm text-[#52525b]">/mo</span>
                    </>
                  )}
                </div>
                {!isFree && billingCycle === 'annual' && (
                  <p className="text-xs text-[#22d3ee] mt-1">Save ₹{getAnnualSavings(plan).toLocaleString()} per year</p>
                )}
                {isFree && <p className="text-xs text-[#52525b] mt-1">Forever free</p>}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-grow">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <svg width="14" height="14" fill="none" stroke="#22d3ee" strokeWidth="2.5" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="text-[#a1a1aa]">{f}</span>
                  </li>
                ))}
                {plan.features_excluded?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <svg width="14" height="14" fill="none" stroke="#52525b" strokeWidth="2.5" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    <span className="text-[#52525b] line-through">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              {isCurrent ? (
                <button
                  onClick={isFree ? undefined : handleManageSubscription}
                  disabled={isFree}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isFree
                      ? 'bg-white/[0.04] text-[#52525b] cursor-default border border-white/[0.06]'
                      : 'bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.1]'
                  }`}
                >
                  {isFree ? 'Current plan' : 'Manage subscription'}
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={loading}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPopular
                      ? 'bg-[#22d3ee] text-[#0a0a0b] hover:bg-[#06b6d4]'
                      : 'bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.1]'
                  }`}
                >
                  {loading ? 'Processing...' : isFree ? 'Get started' : 'Start free trial'}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-[#52525b] mt-8">
        No credit card required &nbsp;·&nbsp; 14-day free trial &nbsp;·&nbsp; Cancel anytime
      </p>
    </div>
  );
}
