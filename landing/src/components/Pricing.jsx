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
        { text: '25+ platforms', included: true },
        { text: 'Basic scheduling', included: true },
        { text: 'No AI features', included: false },
        { text: 'Community support', included: true },
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: { monthly: 29, yearly: 290 },
      description: 'Perfect for professionals',
      features: [
        { text: 'Unlimited posts', included: true, highlight: true },
        { text: '10 social accounts', included: true },
        { text: 'All 25+ platforms', included: true },
        { text: 'AI captions & images (100/mo)', included: true, highlight: true },
        { text: 'AI video generation (10/mo)', included: true, highlight: true },
        { text: 'Analytics & A/B testing', included: true },
        { text: 'CSV bulk upload', included: true },
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
        { text: 'All platforms + priority', included: true },
        { text: 'Unlimited AI (captions, images, videos)', included: true, highlight: true },
        { text: 'Team collaboration & workflows', included: true },
        { text: 'White-label + API access', included: true },
        { text: 'Dedicated account manager', included: true, highlight: true },
        { text: '24/7 priority support', included: true },
      ],
      cta: 'Get Started',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-32 bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900">
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
            <span className="text-pink-400 font-semibold text-sm uppercase tracking-wider px-4 py-2 rounded-full glass">
              💰 Pricing
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Simple, Transparent{' '}
            <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your needs
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg ${!isYearly ? 'text-white font-semibold' : 'text-gray-400'}`}>
              Monthly
            </span>
            <motion.button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-16 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-1"
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full shadow-lg"
                animate={{ x: isYearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
            <span className={`text-lg ${isYearly ? 'text-white font-semibold' : 'text-gray-400'}`}>
              Yearly
              <span className="ml-2 text-sm text-green-400">(Save 20%)</span>
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
              className={`relative glass rounded-2xl p-8 ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold"
                >
                  MOST POPULAR
                </motion.div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-white">
                    ${isYearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-gray-400">
                    /{isYearly ? 'year' : 'month'}
                  </span>
                </div>
                {isYearly && plan.price.yearly > 0 && (
                  <p className="text-sm text-green-400 mt-2">
                    Save ${plan.price.monthly * 12 - plan.price.yearly}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`text-xl mt-0.5 ${feature.included ? 'text-green-400' : 'text-red-400'}`}>
                      {feature.included ? '✓' : '✗'}
                    </span>
                    <span className={`${feature.highlight ? 'font-semibold text-white' : 'text-gray-300'} ${!feature.included && 'text-gray-500'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <motion.a
                href="/auth.html"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`block w-full text-center py-4 rounded-xl font-bold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-blue-500/50'
                    : 'glass hover:bg-white/20 text-white'
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
          className="text-center text-gray-400 mt-12"
        >
          ✓ No credit card required • ✓ 14-day free trial • ✓ Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}

