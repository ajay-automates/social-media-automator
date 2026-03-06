const AUTH_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

export default function FinalCTA() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/[0.04] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto text-center">
        <h2 className="font-display text-4xl sm:text-5xl mb-4">
          Ready to automate your social media?
        </h2>
        <p className="text-lg text-txt-secondary mb-10">
          Start free. No credit card required.
        </p>
        <a
          href={`${AUTH_URL}/auth`}
          className="inline-block px-10 py-4 rounded-xl bg-accent font-semibold text-base hover:bg-accent-hover transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
          style={{ color: '#0a0a0b' }}
        >
          Start Free — No Credit Card
        </a>
      </div>
    </section>
  );
}
