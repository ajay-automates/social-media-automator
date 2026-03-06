import { useState } from 'react';

const AUTH_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

const plans = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    desc: 'Get started with the essentials.',
    features: [
      '10 posts per month',
      '5 social accounts',
      '5 AI generations',
      'LinkedIn, Twitter, YouTube',
      'Basic scheduling',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthly: 1000,
    annual: 10000,
    desc: 'For creators and businesses who post regularly.',
    features: [
      '100 posts per month',
      '20 social accounts',
      'Unlimited AI generations',
      'All 16 platforms',
      'Brand voice learning',
      'Smart scheduling',
      'Analytics dashboard',
      'AI image generation',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-4xl sm:text-5xl text-center mb-4">
          Simple pricing
        </h2>
        <p className="text-txt-secondary text-center text-lg mb-12">No surprises. Cancel anytime.</p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-16">
          <span className={`text-sm ${!annual ? 'text-txt-primary' : 'text-txt-muted'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-12 h-6 rounded-full bg-base-elevated border border-border transition-colors"
            aria-label="Toggle annual billing"
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-accent transition-transform duration-200 ${
                annual ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-sm ${annual ? 'text-txt-primary' : 'text-txt-muted'}`}>
            Annual
            <span className="ml-2 text-xs font-medium text-accent bg-accent-muted px-2 py-0.5 rounded-full">Save 17%</span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const price = annual ? Math.round(plan.annual / 12) : plan.monthly;
            const isHighlighted = plan.highlighted;

            return (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border transition-all ${
                  isHighlighted
                    ? 'bg-base-elevated border-accent/30 ring-1 ring-accent/10'
                    : 'bg-base-secondary border-border hover:border-border-hover'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-8 px-3 py-1 text-xs font-semibold bg-accent text-base rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="font-body text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-txt-muted mb-6">{plan.desc}</p>

                <div className="flex items-baseline gap-1 mb-8">
                  {price === 0 ? (
                    <span className="text-4xl font-semibold">₹0</span>
                  ) : (
                    <>
                      <span className="text-4xl font-semibold">₹{price.toLocaleString('en-IN')}</span>
                      <span className="text-txt-muted text-sm">/ month</span>
                    </>
                  )}
                  {annual && plan.annual > 0 && (
                    <span className="text-xs text-txt-muted ml-2">(₹{plan.annual.toLocaleString('en-IN')}/yr)</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-txt-secondary">
                      <svg className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={`${AUTH_URL}/auth`}
                  className={`block w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    isHighlighted
                      ? 'bg-accent text-base hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                      : 'bg-base-hover border border-border text-txt-primary hover:border-border-hover'
                  }`}
                  style={isHighlighted ? { color: '#0a0a0b' } : {}}
                >
                  {plan.cta}
                </a>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-txt-muted mt-8">
          Need more? <a href="mailto:ajay@example.com" className="text-accent hover:underline">Contact us</a> for custom plans.
        </p>
      </div>
    </section>
  );
}
