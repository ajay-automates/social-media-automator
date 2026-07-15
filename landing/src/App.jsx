import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiEdit3,
  FiLayers,
  FiMenu,
  FiPlus,
  FiSend,
  FiShield,
  FiSliders,
  FiStar,
  FiX,
  FiZap,
} from 'react-icons/fi';
import { FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DataDeletion from './pages/DataDeletion';
import RefundPolicy from './pages/RefundPolicy';
import ContactUs from './pages/ContactUs';
import ShippingPolicy from './pages/ShippingPolicy';

const AUTH_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

const platforms = [
  {
    name: 'LinkedIn',
    handle: '@northstar.studio',
    description: 'Thoughtful posts for the people who matter to your business.',
    accent: 'linkedin',
    icon: FaLinkedinIn,
  },
  {
    name: 'X / Twitter',
    handle: '@northstarhq',
    description: 'Sharp, timely ideas that keep your point of view moving.',
    accent: 'twitter',
    icon: FaXTwitter,
  },
];

const features = [
  {
    icon: FiEdit3,
    eyebrow: 'Write like you',
    title: 'Your voice, on repeat.',
    description: 'Give the AI a few examples and it picks up your rhythm, point of view, and level of polish.',
    tone: 'sun',
  },
  {
    icon: FiCalendar,
    eyebrow: 'Plan once',
    title: 'A week of momentum.',
    description: 'Turn one idea into a platform-aware week of posts, ready to review in a single calm workspace.',
    tone: 'blue',
  },
  {
    icon: FiSliders,
    eyebrow: 'Stay in control',
    title: 'Nothing goes live by surprise.',
    description: 'Every post is yours to edit, approve, reschedule, or skip before it reaches your audience.',
    tone: 'lavender',
  },
  {
    icon: FiBarChart2,
    eyebrow: 'Learn faster',
    title: 'See what earns attention.',
    description: 'Understand which ideas travel on LinkedIn and X, then use those signals to shape what comes next.',
    tone: 'mint',
  },
];

const faqs = [
  {
    question: 'Which platforms are supported right now?',
    answer: 'Social Media Automator currently supports LinkedIn and X (Twitter). The product is intentionally focused on making those two channels work exceptionally well.',
  },
  {
    question: 'Can I edit posts before they are published?',
    answer: 'Yes. AI drafts are always reviewable. Edit the copy, change the timing, or skip a post before anything is published to your connected account.',
  },
  {
    question: 'How does the AI learn my voice?',
    answer: 'Share a few examples of your past writing or use the brand voice workspace. The AI looks for tone, sentence length, vocabulary, and the way you make a point.',
  },
  {
    question: 'What happens on the free plan?',
    answer: 'The free plan gives you the essentials to create and schedule a small, consistent publishing habit across LinkedIn and X. Upgrade when you need more volume.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. There are no lock-in contracts. You can cancel from your account, and your existing scheduled content stays visible for review.',
  },
];

function BrandMark({ small = false }) {
  return (
    <span className={`brand-mark ${small ? 'brand-mark--small' : ''}`} aria-hidden="true">
      <span>SA</span>
    </span>
  );
}

function PlatformMark({ platform, size = 'md' }) {
  const Icon = platform.icon;
  return (
    <span className={`platform-mark platform-mark--${platform.accent} platform-mark--${size}`} aria-hidden="true">
      <Icon />
    </span>
  );
}

function ButtonLink({ children, href = `${AUTH_URL}/auth`, secondary = false, className = '' }) {
  return (
    <a className={`button ${secondary ? 'button--secondary' : 'button--primary'} ${className}`} href={href}>
      <span>{children}</span>
      <FiArrowUpRight aria-hidden="true" />
    </a>
  );
}

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <div className="shell nav-shell">
        <a className="brand" href="/" onClick={closeMenu} aria-label="Social Media Automator home">
          <BrandMark />
          <span className="brand-wordmark">Social Media <em>Automator</em></span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#product">Product</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="nav-actions">
          <a className="nav-login" href={`${AUTH_URL}/auth`}>Log in</a>
          <ButtonLink className="button--compact">Start free</ButtonLink>
        </div>

        <button
          className="mobile-menu-button"
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-nav" id="mobile-navigation">
          <a href="#product" onClick={closeMenu}>Product</a>
          <a href="#workflow" onClick={closeMenu}>Workflow</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
          <a href={`${AUTH_URL}/auth`} onClick={closeMenu}>Log in</a>
          <ButtonLink className="mobile-nav__cta">Start free</ButtonLink>
        </div>
      )}
    </header>
  );
}

function DashboardPreview() {
  return (
    <div className="dashboard-scene" aria-label="Preview of the Social Media Automator workspace">
      <div className="dashboard-glow dashboard-glow--one" />
      <div className="dashboard-glow dashboard-glow--two" />

      <div className="dashboard-window">
        <div className="window-topbar">
          <div className="window-dots"><i /><i /><i /></div>
          <span className="window-label">Workspace / Content calendar</span>
          <span className="window-status"><span /> Synced</span>
        </div>

        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="sidebar-logo"><BrandMark small /></div>
            <div className="sidebar-menu">
              <span className="sidebar-menu__item sidebar-menu__item--active"><FiCalendar /> Calendar</span>
              <span className="sidebar-menu__item"><FiEdit3 /> Drafts</span>
              <span className="sidebar-menu__item"><FiBarChart2 /> Insights</span>
            </div>
            <span className="sidebar-help"><FiShield /> Safe by default</span>
          </aside>

          <div className="dashboard-main">
            <div className="dashboard-heading">
              <div>
                <span className="mini-overline">This week</span>
                <h3>Content calendar</h3>
              </div>
              <a className="new-post-button" href={`${AUTH_URL}/auth`}><FiPlus /> New post</a>
            </div>

            <div className="calendar-strip">
              {[
                ['MON', '08', 'quiet'],
                ['TUE', '09', 'has-post'],
                ['WED', '10', 'has-post active'],
                ['THU', '11', 'has-post'],
                ['FRI', '12', 'quiet'],
              ].map(([day, date, state]) => (
                <div className={`calendar-day ${state}`} key={day}>
                  <span>{day}</span><strong>{date}</strong>
                  {state.includes('has-post') && <i />}
                </div>
              ))}
            </div>

            <div className="preview-post-card">
              <div className="preview-post-card__top">
                <div className="preview-profile"><span className="profile-avatar">NS</span><span><strong>Northstar Studio</strong><small>Wed, Jun 10 · 9:30 AM</small></span></div>
                <span className="scheduled-pill"><FiClock /> Scheduled</span>
              </div>
              <p>Consistency beats intensity. The best content system is the one your team can actually keep.</p>
              <div className="preview-post-card__footer">
                <div className="preview-platforms"><span className="tiny-platform tiny-platform--linkedin"><FaLinkedinIn /></span><span className="tiny-platform tiny-platform--twitter"><FaXTwitter /></span></div>
                <span className="post-tag">AI draft <FiStar /></span>
              </div>
            </div>

            <div className="dashboard-insights">
              <div className="insight-row"><span><FiZap /> Voice match</span><strong>96%</strong></div>
              <div className="insight-row"><span><FiSend /> Next up</span><strong>2 posts</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div className="floating-note floating-note--voice"><span className="floating-icon"><FiStar /></span><span><strong>Voice match</strong><small>Feels like you</small></span><b>96%</b></div>
      <div className="floating-note floating-note--publish"><span className="floating-icon floating-icon--green"><FiCheck /></span><span><strong>Ready to publish</strong><small>2 posts approved</small></span></div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-orbit hero-orbit--one" aria-hidden="true" />
      <div className="hero-orbit hero-orbit--two" aria-hidden="true" />
      <div className="shell hero-shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> The focused social publishing system</div>
          <h1>Turn good ideas into a <span>consistent presence.</span></h1>
          <p className="hero-lede">Social Media Automator helps you write, refine, and schedule better content for LinkedIn and X — without losing the voice behind it.</p>
          <div className="hero-actions">
            <ButtonLink>Start free</ButtonLink>
            <a className="text-link" href="#workflow">See how it works <FiArrowRight /></a>
          </div>
          <div className="hero-proof"><span><FiCheck /> Free to start</span><span><FiCheck /> No credit card</span><span><FiCheck /> Review before publishing</span></div>
        </div>
        <DashboardPreview />
      </div>
      <div className="shell hero-footnote"><span>Built for teams who want their ideas to travel</span><span className="hero-footnote__line" /><span className="hero-footnote__count">02 <small>platforms, deeply supported</small></span></div>
    </section>
  );
}

function PlatformSection() {
  return (
    <section className="platform-section" aria-labelledby="platform-heading">
      <div className="shell">
        <div className="section-intro section-intro--split">
          <div><span className="section-kicker">One clear focus</span><h2 id="platform-heading">Two platforms.<br /><em>More signal.</em></h2></div>
          <p>Most tools try to be everywhere. We are building the best place to show up consistently on the channels where your reputation compounds.</p>
        </div>
        <div className="platform-grid">
          {platforms.map((platform) => (
            <article className={`platform-card platform-card--${platform.accent}`} key={platform.name}>
              <div className="platform-card__top"><PlatformMark platform={platform} size="lg" /><span className="platform-card__arrow"><FiArrowUpRight /></span></div>
              <div className="platform-card__content"><span className="platform-card__eyebrow">{platform.handle}</span><h3>{platform.name}</h3><p>{platform.description}</p></div>
              <div className="platform-card__bottom"><span>Native publishing</span><span>AI-ready</span><span>Analytics</span></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    ['01', 'Connect your accounts', 'Bring in LinkedIn and X in a couple of clicks. Your workspace stays private and yours.'],
    ['02', 'Set the point of view', 'Add your offer, audience, and a few examples so every draft starts from the right context.'],
    ['03', 'Build the queue', 'Generate a week of platform-aware posts and refine them together in one review loop.'],
    ['04', 'Let consistency compound', 'Approve, schedule, and use the signals from your best posts to make the next week sharper.'],
  ];

  return (
    <section className="workflow-section" id="workflow" aria-labelledby="workflow-heading">
      <div className="shell">
        <div className="section-intro"><span className="section-kicker">The workflow</span><h2 id="workflow-heading">A calmer way to<br /><em>stay visible.</em></h2><p>From blank page to approved queue, every step is designed to keep your judgment in the loop and your momentum intact.</p></div>
        <div className="workflow-list">
          {steps.map(([number, title, description], index) => (
            <div className="workflow-item" key={number}>
              <div className="workflow-number">{number}</div>
              <div className="workflow-item__body"><h3>{title}</h3><p>{description}</p></div>
              <span className="workflow-item__arrow"><FiArrowUpRight /></span>
              {index < steps.length - 1 && <span className="workflow-connector" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="features-section" id="product" aria-labelledby="features-heading">
      <div className="shell">
        <div className="section-intro section-intro--center"><span className="section-kicker">Built around your voice</span><h2 id="features-heading">Less content churn.<br /><em>More thoughtful output.</em></h2><p>Everything you need to make a strong point, publish it well, and understand what resonated.</p></div>
        <div className="feature-grid">
          {features.map((feature) => {
            const FeatureIcon = feature.icon;
            return <article className={`feature-card feature-card--${feature.tone}`} key={feature.title}>
              <div className="feature-card__icon"><FeatureIcon /></div><span className="feature-card__eyebrow">{feature.eyebrow}</span><h3>{feature.title}</h3><p>{feature.description}</p>
            </article>;
          })}
          <article className="feature-card feature-card--wide feature-card--ink"><div className="feature-card__copy"><span className="feature-card__eyebrow">Platform-aware by design</span><h3>One idea, two versions<br /><em>that actually fit.</em></h3><p>Shape the thought once. Let the system adapt the pace, length, and format for LinkedIn and X.</p></div><div className="variation-preview"><div className="variation variation--linkedin"><div className="variation__header"><span className="tiny-platform tiny-platform--linkedin"><FaLinkedinIn /></span><span>LinkedIn</span></div><strong>Consistency is a strategy, not a personality trait.</strong><small>Long-form perspective · ready for review</small></div><div className="variation variation--twitter"><div className="variation__header"><span className="tiny-platform tiny-platform--twitter"><FaXTwitter /></span><span>X / Twitter</span></div><strong>Consistency is a strategy.</strong><small>Short-form thought · ready for review</small></div></div></article>
        </div>
      </div>
    </section>
  );
}

function MetricsSection() {
  return (
    <section className="metrics-section" aria-label="Product highlights">
      <div className="shell metrics-grid">
        <div className="metrics-copy"><span className="section-kicker">The small details matter</span><h2>Built for the<br /><em>long game.</em></h2><p>Good publishing is not about shouting more often. It is about creating a dependable system for showing up with something worth saying.</p><a className="text-link text-link--dark" href="#pricing">See plans <FiArrowRight /></a></div>
        <div className="metric-cards">
          <div className="metric-card"><FiClock /><strong>2 min</strong><span>to turn an idea into a reviewable draft</span></div>
          <div className="metric-card"><FiShield /><strong>100%</strong><span>human approval before anything publishes</span></div>
          <div className="metric-card"><FiLayers /><strong>1 queue</strong><span>for all your LinkedIn and X content</span></div>
          <div className="metric-card"><FiZap /><strong>96%</strong><span>example voice match in your workspace</span></div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    { name: 'Free', price: '₹0', label: 'to build your habit', description: 'The essentials for getting your publishing system moving.', features: ['10 posts per month', '5 AI generations', 'LinkedIn + X publishing', 'Basic scheduling'], cta: 'Start free' },
    { name: 'Pro', price: '₹1,000', label: '/ month', description: 'More room to create, refine, and learn from every post.', features: ['100 posts per month', 'Unlimited AI generations', 'Brand voice learning', 'Smart scheduling', 'Analytics dashboard', 'Email support'], cta: 'Choose Pro', featured: true },
  ];

  return (
    <section className="pricing-section" id="pricing" aria-labelledby="pricing-heading">
      <div className="shell">
        <div className="section-intro section-intro--center"><span className="section-kicker">Simple plans</span><h2 id="pricing-heading">Start small.<br /><em>Grow with intent.</em></h2><p>No confusing tiers. Just enough room to match the way you publish today.</p></div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card ${plan.featured ? 'price-card--featured' : ''}`} key={plan.name}>
              {plan.featured && <span className="price-card__badge">Most popular</span>}
              <div className="price-card__top"><span className="price-card__name">{plan.name}</span><span className="price-card__label">{plan.featured ? 'For consistent teams' : 'For getting started'}</span></div>
              <p>{plan.description}</p><div className="price"><strong>{plan.price}</strong><span>{plan.label}</span></div>
              <ul>{plan.features.map((feature) => <li key={feature}><FiCheck /> {feature}</li>)}</ul>
              <ButtonLink secondary={!plan.featured} className="price-card__button">{plan.cta}</ButtonLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="faq-section" id="faq" aria-labelledby="faq-heading">
      <div className="shell faq-layout">
        <div className="section-intro"><span className="section-kicker">Questions, answered</span><h2 id="faq-heading">Keep it<br /><em>straightforward.</em></h2><p>Still curious? <a href="/contact">Talk to us</a> and we’ll help you figure out if it’s a fit.</p></div>
        <div className="faq-list">
          {faqs.map((faq, index) => {
            const open = openIndex === index;
            return <div className={`faq-item ${open ? 'faq-item--open' : ''}`} key={faq.question}><button type="button" aria-expanded={open} onClick={() => setOpenIndex(open ? -1 : index)}><span>{faq.question}</span><FiChevronDown /></button>{open && <p>{faq.answer}</p>}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="final-cta"><div className="final-cta__pattern" aria-hidden="true" /><div className="shell final-cta__inner"><div><span className="section-kicker">Your next good idea is waiting</span><h2>Make showing up<br /><em>feel easier.</em></h2></div><div><p>Start with LinkedIn and X. Build a system you’ll actually want to keep using.</p><ButtonLink>Start free</ButtonLink></div></div></section>
  );
}

function Footer() {
  return (
    <footer className="site-footer"><div className="shell"><div className="footer-top"><a className="brand" href="/"><BrandMark /><span className="brand-wordmark">Social Media <em>Automator</em></span></a><span className="footer-note">Focused publishing for LinkedIn + X.</span><a className="footer-top__link" href="#top">Back to top <FiArrowUpRight /></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Social Media Automator</span><nav aria-label="Footer navigation"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund-policy">Refunds</a><a href="/contact">Contact</a></nav><span>Made for better ideas.</span></div></div></footer>
  );
}

function HomePage() {
  return <><Header /><main><Hero /><PlatformSection /><WorkflowSection /><FeaturesSection /><MetricsSection /><PricingSection /><FAQSection /><FinalCTA /></main><Footer /></>;
}

function App() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = 'auto'; };
  }, []);

  return <div className="app-shell"><Routes><Route path="/" element={<HomePage />} /><Route path="/privacy" element={<PrivacyPolicy />} /><Route path="/terms" element={<TermsOfService />} /><Route path="/data-deletion" element={<DataDeletion />} /><Route path="/refund-policy" element={<RefundPolicy />} /><Route path="/contact" element={<ContactUs />} /><Route path="/shipping-policy" element={<ShippingPolicy />} /></Routes></div>;
}

export default App;
