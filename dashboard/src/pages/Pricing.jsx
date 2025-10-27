import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

const plans = {
  free: {
    name: 'Free',
    price: 0,
    annual: 0,
    features: [
      '10 posts per month',
      '1 social account',
      'LinkedIn or Twitter only',
      'Community support',
      'Basic scheduling',
      'Post history',
    ],
    features_excluded: [
      'AI caption generation',
      'Instagram support',
      'CSV bulk upload',
      'Priority support',
      'API access',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    annual: 290,
    features: [
      'Unlimited posts',
      '3 social accounts',
      'All platforms (LinkedIn, Twitter, Instagram)',
      '100 AI caption generations/month',
      'CSV bulk upload',
      'Email support',
      'Advanced scheduling',
      'Full analytics',
      'Post templates',
    ],
  },
  business: {
    name: 'Business',
    price: 99,
    annual: 990,
    features: [
      'Unlimited everything',
      '10 social accounts',
      'All platforms',
      'Unlimited AI captions',
      'CSV bulk upload',
      'Priority support',
      'API access',
      'White-label option',
      'Remove branding',
      'Custom integrations',
      'Dedicated account manager',
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
      if (response.data?.plan) {
        setCurrentPlan(response.data.plan.name);
      }
    } catch (err) {
      console.error('Error loading current plan:', err);
    } finally {
      setBillingLoading(false);
    }
  };

  const handleUpgrade = async (planName) => {
    if (planName === 'free') {
      navigate('/dashboard');
      return;
    }

    if (currentPlan === planName) {
      showError('You are already on this plan');
      return;
    }

    setLoading(true);

    try {
      // In demo mode, just show a toast
      if (!process.env.STRIPE_SECRET_KEY) {
        showError('🎭 Demo Mode: Stripe not configured. Checkout disabled.');
        setLoading(false);
        return;
      }

      // TODO: Get actual price IDs from backend
      const priceId = billingCycle === 'monthly' 
        ? `price_${planName}_monthly` 
        : `price_${planName}_annual`;

      const response = await api.post('/billing/checkout', {
        plan: planName,
        priceId,
        billingCycle,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        showError('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showError(err.response?.data?.error || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await api.post('/billing/portal');
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        showError('Failed to open billing portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      showError('Failed to open billing portal');
    }
  };

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.price : plan.annual / 12;
  };

  const getAnnualSavings = (plan) => {
    if (plan.price === 0) return 0;
    return plan.price * 12 - plan.annual;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-20">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Choose the perfect plan for your needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-lg ${billingCycle === 'monthly' ? 'text-white font-semibold' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg ${billingCycle === 'annual' ? 'text-white font-semibold' : 'text-gray-400'}`}>
              Annual
              <span className="ml-2 text-sm bg-green-500 text-white px-2 py-0.5 rounded">
                Save 17%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(plans).map(([key, plan], index) => {
            const isPopular = key === 'pro';
            const isCurrent = currentPlan === key;
            const isFree = key === 'free';

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`${
                  isPopular
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-400 transform scale-105'
                    : 'bg-gray-800 border-2 border-gray-700'
                } p-8 rounded-lg flex flex-col relative`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrent && !isPopular && (
                  <div className="absolute -top-5 right-4 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    Current Plan
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className={`text-5xl font-bold mb-2 ${isPopular ? '' : 'text-gray-400'}`}>
                    ${isFree ? 0 : billingCycle === 'monthly' ? plan.price : Math.round(plan.annual / 12)}
                    <span className={`text-lg ${isPopular ? 'opacity-80' : 'text-gray-400'}`}>
                      /{billingCycle === 'monthly' ? 'month' : 'month'}
                    </span>
                  </div>
                  {!isFree && billingCycle === 'annual' && (
                    <p className="text-sm opacity-80">
                      or ${plan.annual}/year (save ${getAnnualSavings(plan)})
                    </p>
                  )}
                  {isFree && <p className="text-gray-400">Great for getting started</p>}
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`text-xl ${isPopular ? '' : 'text-green-400'}`}>✓</span>
                      <span className={isPopular ? '' : 'text-gray-300'}>{feature}</span>
                    </li>
                  ))}
                  {plan.features_excluded?.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 text-xl">✗</span>
                      <span className="text-gray-500 line-through">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={isFree}
                    className={`w-full py-4 rounded-lg font-bold transition ${
                      isFree
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    {isFree ? 'Current Plan' : 'Manage Subscription'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={loading}
                    className={`w-full py-4 rounded-lg font-bold transition ${
                      isPopular
                        ? 'bg-white text-blue-600 hover:bg-gray-100'
                        : 'bg-gray-700 hover:bg-gray-600'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Processing...' : isFree ? 'Get Started' : 'Start Free Trial'}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-400">
          <p>✓ No credit card required • ✓ 14-day free trial • ✓ Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
