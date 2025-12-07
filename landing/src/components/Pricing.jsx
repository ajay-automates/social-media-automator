import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Great for getting started',
      features: [
        { text: '10 posts per month', included: true },
        { text: '3 social accounts', included: true },
        { text: '10 working platforms', included: true },
        { text: 'Basic scheduling', included: true },
        { text: 'No AI features', included: false },
        { text: 'Community support', included: true },
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: { monthly: 19, yearly: 190 },
      description: 'Perfect for professionals',
      features: [
        { text: 'Unlimited posts', included: true, highlight: true },
        { text: '10 social accounts', included: true },
        { text: 'All 20+ platforms (10 working now)', included: true },
        { text: 'AI captions & images (100/mo)', included: true, highlight: true },
        { text: 'Analytics dashboard', included: true },
        { text: 'CSV bulk upload', included: true },
        { text: 'Post templates', included: true },
        { text: 'Email support', included: true },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Business',
      price: { monthly: 99, yearly: 990 },
      description: 'For teams and agencies',
      features: [
        { text: 'Unlimited everything', included: true, highlight: true },
        { text: '50 social accounts', included: true },
        { text: 'All 20+ platforms + priority access', included: true },
        { text: 'Unlimited AI captions & images', included: true, highlight: true },
        { text: 'Team collaboration (4 roles)', included: true, highlight: true },
        { text: 'Approval workflows', included: true },
        { text: 'Carousel creator', included: true },
        { text: 'Priority support', included: true },
      ],
      cta: 'Get Started',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-32 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="text-netflix-red font-semibold text-sm uppercase tracking-wider px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50 font-netflix">
              💰 Pricing
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold text-netflix-red mb-6 font-netflix">
            Simple, Transparent{' '}
            <span className="text-netflix-red">Pricing</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your needs
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg ${!isYearly ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
              Monthly
            </span>
            <motion.button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-16 h-8 bg-netflix-red rounded-full p-1"
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full shadow-lg"
                animate={{ x: isYearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
            <span className={`text-lg ${isYearly ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
              Yearly
              <span className="ml-2 text-sm text-green-600">(Save 20%)</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`relative bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-lg ${plan.popular ? 'ring-2 ring-netflix-red scale-105' : ''
                }`}
            >
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-netflix-red text-white px-4 py-1 rounded-full text-sm font-bold font-netflix"
                >
                  MOST POPULAR
                </motion.div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-gray-900">
                    ${isYearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-gray-600">
                    /{isYearly ? 'year' : 'month'}
                  </span>
                </div>
                {isYearly && plan.price.yearly > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    Save ${plan.price.monthly * 12 - plan.price.yearly}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`text-xl mt-0.5 ${feature.included ? 'text-green-600' : 'text-red-600'}`}>
                      {feature.included ? '✓' : '✗'}
                    </span>
                    <span className={`${feature.highlight ? 'font-semibold text-gray-900' : 'text-gray-700'} ${!feature.included && 'text-gray-400'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <motion.a
                href="/auth"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`block w-full text-center py-4 rounded-xl font-bold transition-all ${plan.popular
                  ? 'bg-netflix-red hover:bg-netflix-red-dark text-white hover:shadow-2xl hover:shadow-red-500/50 font-netflix'
                  : 'bg-white/80 backdrop-blur-md border border-gray-200/50 hover:bg-white/90 text-gray-900'
                  }`}
              >
                {plan.cta}
              </motion.a>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-gray-600 mt-12"
        >
          ✓ No credit card required • ✓ 14-day free trial • ✓ Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}

