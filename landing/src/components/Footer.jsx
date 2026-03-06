const AUTH_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-display text-sm text-txt-secondary">Social Media Automator</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-txt-muted">
            <a href="#features" className="hover:text-txt-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-txt-primary transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-txt-primary transition-colors">FAQ</a>
            <a href={`${AUTH_URL}/auth`} className="hover:text-txt-primary transition-colors">Login</a>
            <a href="/privacy" className="hover:text-txt-primary transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-txt-primary transition-colors">Terms</a>
            <a href="/refund-policy" className="hover:text-txt-primary transition-colors">Refund</a>
            <a href="/contact" className="hover:text-txt-primary transition-colors">Contact</a>
          </nav>

          {/* Right */}
          <p className="text-xs text-txt-muted">
            Built with ❤️ in India
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-txt-muted">
          © {new Date().getFullYear()} Social Media Automator. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
