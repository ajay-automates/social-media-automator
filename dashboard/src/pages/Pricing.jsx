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
    price: 1000,
    annual: 10000,
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
    price: 5000,
    annual: 50000,
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

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
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
      // Create Subscription
      const response = await api.post('/billing/subscription', {
        plan: planName,
        billingCycle,
      });

      // Handle free upgrade
      if (response.data.free) {
        showSuccess(`Upgraded to ${planName} plan successfully!`);
        navigate('/success');
        return;
      }

      const res = await loadRazorpay();
      if (!res) {
        showError('Razorpay SDK failed to load');
        return;
      }

      const { subscriptionId, keyId } = response.data;

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "Social Media Automator",
        description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan Subscription`,
        currency: "INR", // Set currency to INR
        handler: async function (response) {
          try {
            // Verify Payment
            await api.post('/billing/verify', {
              paymentData: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature
              },
              plan: planName
            });

            showSuccess('Subscription activated successfully!');
            navigate('/success');
          } catch (err) {
            console.error('Verification error:', err);
            showError('Payment verification failed');
          }
        },
        theme: {
          color: "#3B82F6"
        },
        prefill: {
          // Optional: prefill customer details
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Checkout error:', err);
      showError(err.response?.data?.error || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will be downgraded to the Free plan immediately.')) {
      try {
        await api.post('/billing/cancel');
        showSuccess('Subscription cancelled successfully');
        loadCurrentPlan();
      } catch (err) {
        console.error('Cancellation error:', err);
        showError('Failed to cancel subscription');
      }
    }
  };

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.price : Math.round(plan.annual / 12);
  };

  const getAnnualSavings = (plan) => {
    if (plan.price === 0) return 0;
    return plan.price * 12 - plan.annual;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-20 pt-32 overflow-x-hidden">
      <div className="container mx-auto px-6 max-w-7xl overflow-visible">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Choose the plan that fits your needs. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-2xl p-2 shadow-xl">
            <span className={`text-lg px-4 py-2 rounded-xl transition-all ${billingCycle === 'monthly' ? 'text-white font-semibold bg-blue-500/30 backdrop-blur-sm border border-blue-400/30' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className={`text-lg px-4 py-2 rounded-xl transition-all ${billingCycle === 'annual' ? 'text-white font-semibold bg-purple-500/30 backdrop-blur-sm border border-purple-400/30' : 'text-gray-400'}`}>
              Annual
              <span className="ml-2 text-sm bg-green-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg border border-green-400/30">
                Save 17%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-20 overflow-visible">
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
                className={`group relative overflow-visible ${isPopular
                  ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 backdrop-blur-xl border-2 border-blue-400/50 transform scale-105 shadow-2xl shadow-blue-500/30'
                  : 'bg-gray-900/30 backdrop-blur-xl border-2 border-white/10 shadow-xl'
                  } p-8 rounded-2xl flex flex-col relative`}
              >
                {/* Glossy shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-yellow-400/50 z-50">
                    ⭐ MOST POPULAR
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrent && !isPopular && (
                  <div className="absolute -top-6 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-500/50 backdrop-blur-sm border border-blue-400/30 z-50">
                    ✓ Current Plan
                  </div>
                )}

                <div className="relative mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className={`text-5xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-white'}`}>
                    {isFree ? 'Free' : `₹${getPrice(plan)}`}
                    <span className={`text-lg ml-2 ${isPopular ? 'text-blue-200' : 'text-gray-300'}`}>
                      {isFree ? '/ forever' : '/ mo'}
                    </span>
                  </div>
                  {isFree && <p className="text-gray-300">Forever free plan</p>}
                  {!isFree && billingCycle === 'annual' && (
                    <p className="text-green-400 text-sm">
                      Save ₹${getAnnualSavings(plan)} per year
                    </p>
                  )}
                </div>

                <ul className="relative space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`text-xl ${isPopular ? 'text-green-300' : 'text-green-400'}`}>✓</span>
                      <span className={isPopular ? 'text-white' : 'text-gray-200'}>{feature}</span>
                    </li>
                  ))}
                  {plan.features_excluded?.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 text-xl">✗</span>
                      <span className="text-gray-400 line-through">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={isFree}
                    className={`relative overflow-hidden w-full py-4 rounded-xl font-bold transition-all ${isFree
                      ? 'bg-gray-800/50 backdrop-blur-sm border-2 border-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-white hover:shadow-xl hover:shadow-blue-500/30 border-2 border-white/50'
                      }`}
                  >
                    {isFree ? 'Current Plan' : 'Manage Subscription'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={loading}
                    className={`relative overflow-hidden w-full py-4 rounded-xl font-bold transition-all group/btn ${isPopular
                      ? 'bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-white hover:shadow-2xl hover:shadow-white/30 border-2 border-white/50'
                      : 'bg-gray-800/50 backdrop-blur-sm text-white hover:bg-gray-700/50 border-2 border-white/20 hover:border-white/30'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    <span className="relative">{loading ? 'Processing...' : isFree ? 'Get Started' : 'Start Free Trial'}</span>
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
