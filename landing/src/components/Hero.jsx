const AUTH_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-16 overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="opacity-0 animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-base-elevated text-xs font-mono font-medium text-txt-secondary tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          AI-Powered &middot; 16 Platforms &middot; Free to Start
        </div>

        {/* Headline */}
        <h1 className="opacity-0 animate-fade-up-delay-1 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-6 text-balance">
          Your AI Social Media Manager.
          <br />
          <span className="text-txt-secondary">It writes. It learns your voice.</span>
          <br />
          <span className="relative inline-block">
            <span className="italic">It publishes </span>
            <span className="relative italic">
              automatically
              <span className="absolute -bottom-1 left-0 h-[3px] bg-accent rounded-full animate-underline-grow" style={{ width: 0 }} />
            </span>
            <span className="italic">.</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="opacity-0 animate-fade-up-delay-2 text-lg sm:text-xl text-txt-secondary max-w-2xl mx-auto mb-10 text-balance">
          One tool replaces Buffer, Hootsuite, and a content writer.
          Generate 30 days of posts in 60 seconds.
        </p>

        {/* CTAs */}
        <div className="opacity-0 animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a
            href={`${AUTH_URL}/auth`}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent text-base font-semibold text-base hover:bg-accent-hover transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] text-center"
            style={{ color: '#0a0a0b' }}
          >
            Start Free — No Credit Card
          </a>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-border text-txt-secondary font-medium hover:border-border-hover hover:text-txt-primary transition-all text-center"
          >
            See How It Works ↓
          </a>
        </div>

        {/* Trust line */}
        <p className="text-sm text-txt-muted">
          ✓ Free forever plan &nbsp;&nbsp; ✓ No credit card &nbsp;&nbsp; ✓ 2-minute setup
        </p>
      </div>
    </section>
  );
}
