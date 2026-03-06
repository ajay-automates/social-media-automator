const steps = [
  {
    num: '01',
    title: 'Connect',
    desc: 'Link your LinkedIn, Twitter, or Instagram in one click. We support 16 platforms total.',
  },
  {
    num: '02',
    title: 'Generate',
    desc: 'AI creates 30 days of posts in your brand voice. Captions, hashtags, optimal times — all handled.',
  },
  {
    num: '03',
    title: 'Approve & Go',
    desc: 'Review in a calendar, edit if needed, and schedule. Your content runs on autopilot.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl sm:text-5xl text-center mb-20">
          How it works
        </h2>

        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              {/* Connector line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-border-hover to-transparent" />
              )}

              <div className="text-center">
                <span className="inline-block font-mono text-5xl font-medium text-accent/30 mb-4">
                  {step.num}
                </span>
                <h3 className="font-body text-xl font-semibold text-txt-primary mb-3">
                  {step.title}
                </h3>
                <p className="text-txt-secondary leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
