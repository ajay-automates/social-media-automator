const features = [
  {
    title: 'AI Content Calendar',
    desc: 'Generate 7 to 30 days of content in seconds. AI writes captions, picks hashtags, and schedules at optimal times. All in your brand voice.',
    span: 'md:col-span-2',
    highlight: true,
    visual: () => (
      <div className="mt-6 grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }).map((_, i) => {
          const colors = ['bg-accent/40', 'bg-emerald-500/40', 'bg-violet-500/40', 'bg-amber-500/40', 'bg-transparent'];
          const c = i % 5 === 4 ? colors[4] : colors[i % 4];
          return <div key={i} className={`aspect-square rounded-sm ${c}`} />;
        })}
      </div>
    ),
  },
  {
    title: 'Brand Voice Learning',
    desc: 'AI analyzes your past posts and writing style. Every generated post sounds like you, not a robot.',
    span: '',
    visual: () => (
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2 text-xs text-txt-muted"><span className="w-2 h-2 rounded-full bg-accent" /> Tone: Professional</div>
        <div className="flex items-center gap-2 text-xs text-txt-muted"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Style: Conversational</div>
        <div className="flex items-center gap-2 text-xs text-txt-muted"><span className="w-2 h-2 rounded-full bg-violet-400" /> Emojis: Moderate</div>
        <div className="w-full h-1.5 rounded-full bg-base mt-3"><div className="h-full w-[78%] rounded-full bg-gradient-to-r from-accent to-emerald-400" /></div>
        <div className="text-xs text-txt-muted">78% voice match</div>
      </div>
    ),
  },
  {
    title: 'Smart Scheduling',
    desc: 'AI analyzes when your audience is most active and schedules posts at the perfect time for maximum reach.',
    span: '',
    visual: () => (
      <div className="mt-6 flex items-end gap-1 h-16">
        {[30, 55, 40, 80, 95, 70, 45, 60, 85, 50, 35, 75].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm bg-accent/20 hover:bg-accent/40 transition-colors" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  },
  {
    title: 'Analytics Dashboard',
    desc: 'See what performs best. Track engagement, reach, and growth across all platforms in one view.',
    span: '',
    visual: () => (
      <div className="mt-6 space-y-3">
        <div className="flex justify-between text-xs"><span className="text-txt-muted">Engagement</span><span className="text-accent font-mono">+34%</span></div>
        <div className="flex justify-between text-xs"><span className="text-txt-muted">Reach</span><span className="text-emerald-400 font-mono">+52%</span></div>
        <div className="flex justify-between text-xs"><span className="text-txt-muted">Followers</span><span className="text-violet-400 font-mono">+18%</span></div>
      </div>
    ),
  },
  {
    title: '16 Platforms',
    desc: 'LinkedIn, Twitter/X, Instagram, Facebook, YouTube, Reddit, Medium, Pinterest, Telegram, Discord, and more. One dashboard, everywhere.',
    span: 'md:col-span-2',
    visual: () => (
      <div className="mt-6 flex flex-wrap gap-2">
        {['LinkedIn', 'Twitter', 'Instagram', 'YouTube', 'Reddit', 'Medium', 'Pinterest', 'Discord', 'Telegram', 'Slack', 'Bluesky', 'Mastodon'].map(p => (
          <span key={p} className="px-3 py-1.5 text-xs font-medium text-txt-muted bg-base rounded-md border border-border">{p}</span>
        ))}
      </div>
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl sm:text-5xl text-center mb-4">
          Everything you need.
        </h2>
        <p className="text-txt-secondary text-center text-lg mb-16">Nothing you don't.</p>

        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className={`group p-6 rounded-2xl bg-base-elevated border border-border hover:border-accent/30 transition-all duration-300 ${f.span || ''} ${f.highlight ? 'ring-1 ring-accent/10' : ''}`}
            >
              <h3 className="font-body text-lg font-semibold text-txt-primary mb-2">{f.title}</h3>
              <p className="text-sm text-txt-secondary leading-relaxed">{f.desc}</p>
              {f.visual && f.visual()}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
