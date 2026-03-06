import { useState, useEffect } from 'react';

const AUTH_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-base/80 backdrop-blur-xl border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-display text-xl text-txt-primary">Social Media Automator</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-txt-secondary hover:text-txt-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href={`${AUTH_URL}/auth`}
            className="text-sm text-txt-secondary hover:text-txt-primary transition-colors"
          >
            Log in
          </a>
          <a
            href={`${AUTH_URL}/auth`}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-accent text-base hover:bg-accent-hover transition-colors"
          >
            Start Free
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-txt-secondary hover:text-txt-primary"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-base-secondary border-t border-border">
          <div className="px-6 py-4 flex flex-col gap-4">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-txt-secondary hover:text-txt-primary transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-border" />
            <a href={`${AUTH_URL}/auth`} className="text-txt-secondary hover:text-txt-primary py-2">Log in</a>
            <a href={`${AUTH_URL}/auth`} className="text-center font-semibold px-5 py-3 rounded-lg bg-accent text-base hover:bg-accent-hover transition-colors">Start Free</a>
          </div>
        </div>
      )}
    </header>
  );
}
