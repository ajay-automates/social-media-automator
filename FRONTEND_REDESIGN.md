# FRONTEND REDESIGN SPEC
## Social Media Automator → Premium "AI Social Media Manager"

Read this entire document before making ANY changes. This is a complete redesign spec.

---

## DESIGN PHILOSOPHY

**Kill the AI-generated look.** No purple gradients on white. No generic Inter/Roboto fonts. No cookie-cutter card grids. No "gradient blob" backgrounds. No generic hero with floating mockups.

**Aesthetic direction: Editorial Luxury meets SaaS Utility.**
Think: Linear.app meets Stripe.com meets Cal.com. Clean, confident, dark-mode-first, with one strong accent color. Every element earns its place.

**Reference sites for inspiration:**
- linear.app (dark, crisp, confident)
- stripe.com (editorial typography, clear hierarchy)
- cal.com (open-source SaaS that looks premium)
- resend.com (simple, dark, beautiful)
- vercel.com (minimal, fast, modern)

---

## BRAND IDENTITY

**Product Name:** Keep "Social Media Automator" OR rebrand to something shorter like "PostPilot" or "Autopilot" — up to Ajay.

**Tagline (NEW — this is the pitch):**
"Your AI Social Media Manager. It writes your posts, learns your voice, and publishes automatically. You just approve."

**Color System:**
```css
:root {
  /* Base — true dark, not grey-dark */
  --bg-primary: #0a0a0b;
  --bg-secondary: #111113;
  --bg-elevated: #18181b;
  --bg-hover: #1f1f23;

  /* Text */
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #52525b;

  /* Accent — ONE strong color, not a gradient */
  --accent: #22d3ee;           /* cyan-400: fresh, techy, not overused */
  --accent-hover: #06b6d4;
  --accent-muted: rgba(34, 211, 238, 0.1);
  --accent-glow: rgba(34, 211, 238, 0.15);

  /* Borders */
  --border: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.12);

  /* Status */
  --success: #34d399;
  --warning: #fbbf24;
  --error: #f87171;
}
```

**Typography:**
```css
/* Import from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=JetBrains+Mono:wght@400;500&display=swap');

/* Display/Headlines: Instrument Serif — elegant, editorial, unexpected for SaaS */
--font-display: 'Instrument Serif', Georgia, serif;

/* Body/UI: DM Sans — clean, modern, highly legible */
--font-body: 'DM Sans', system-ui, sans-serif;

/* Code/Mono: JetBrains Mono */
--font-mono: 'JetBrains Mono', monospace;
```

Typography rules:
- H1 (hero): Instrument Serif, 56-72px, italic for the keyword ("automatically")
- H2 (sections): Instrument Serif, 36-44px
- H3 (cards): DM Sans, 20-24px, 600 weight
- Body: DM Sans, 16-18px, 400 weight
- Small/labels: DM Sans, 12-14px, 500 weight, uppercase tracking

---

## LANDING PAGE REDESIGN

### Structure (top to bottom):

**1. Header/Nav**
- Sticky, transparent bg → solid dark on scroll (add backdrop-filter: blur)
- Logo (text: product name in --font-display) left
- Nav links center: Features, Pricing, FAQ
- Right: "Log in" text link + "Start Free" solid accent button
- Mobile: hamburger menu, slide-in from right
- Height: 64px, border-bottom: 1px solid var(--border)

**2. Hero Section**
- NO floating mockups, NO gradient blobs, NO illustration
- Full-width dark bg with subtle radial gradient (accent glow at center, very faint)
- Layout: centered text, generous whitespace

```
[small label badge: "AI-POWERED • 16 PLATFORMS • FREE TO START"]

Your AI Social Media Manager.
It writes. It learns your voice.
It publishes *automatically*.

[subtitle: One tool replaces Buffer, Hootsuite, and a content writer.
Generate 30 days of posts in 60 seconds.]

[CTA button: "Start Free — No Credit Card"]   [secondary: "Watch Demo ▶"]
```

- The word "automatically" in italic Instrument Serif, with a subtle cyan underline animation
- Below CTAs: small trust line: "✓ Free forever plan  ✓ No credit card  ✓ 2-minute setup"
- Below that: a SINGLE clean screenshot of the dashboard calendar view (not a mockup, a real screenshot with slight rounded corners and subtle shadow)

**3. Social Proof Bar**
- Horizontal strip, slightly lighter bg
- "Trusted by 500+ creators and businesses" (or whatever real number you have)
- Platform logos in a row: LinkedIn, Twitter, Instagram, etc. (SVG icons, monochrome, 24px)
- This should be subtle, not screaming

**4. How It Works (3 steps)**
- Section title: "How it works" (Instrument Serif)
- Three columns, each with:
  - Step number (big, accent color, --font-mono)
  - Short headline (DM Sans, 600)
  - One-line description
  - NO icons, NO illustrations — just clean typography
- Step 1: "Connect" — "Link your LinkedIn, Twitter, or Instagram in one click."
- Step 2: "Generate" — "AI creates 30 days of posts in your brand voice."
- Step 3: "Approve & Go" — "Review, edit if needed, and schedule. Done."

**5. Features Section**
- Section title: "Everything you need. Nothing you don't."
- BENTO GRID layout (not a boring 3-column grid):
  ```
  ┌─────────────────────┬──────────────┐
  │                     │              │
  │  AI Content         │  Brand       │
  │  Calendar           │  Voice       │
  │  (large, 2x wide)  │  (standard)  │
  │                     │              │
  ├──────────┬──────────┼──────────────┤
  │          │          │              │
  │ Smart    │ Analytics│  16 Platform │
  │ Schedule │          │  Support     │
  │          │          │  (tall)      │
  └──────────┴──────────┘              │
                        └──────────────┘
  ```
- Each cell: dark card (--bg-elevated), 1px border, hover → border-accent, subtle glow
- Inside each card: headline + 2-line description + subtle decorative element (could be a code snippet, a mini calendar grid, or platform icons)
- The large "AI Content Calendar" card should have a mini preview of a calendar with color-coded posts
- NO feature icons from icon libraries — if you need visual elements, use text/code/data as decoration

**Key features to highlight (in this order of importance):**
1. AI Content Calendar (7-30 day generation)
2. Brand Voice Learning
3. Smart Scheduling (optimal times)
4. 16 Platform Support
5. Analytics Dashboard
6. AI Image Generation

**Remove from landing page:**
- A/B Testing mention
- Team Collaboration mention
- Webhooks/API mention
- Chrome Extension mention
- News Agent / Trend Monitor mention
These are either enterprise features or not core to the pitch.

**6. Pricing Section**
- Section title: "Simple pricing" (Instrument Serif)
- Toggle: Monthly / Annual (with "Save 17%" badge on annual)
- TWO cards only (not three — simplify):

Card 1: FREE
```
Free
₹0 / forever

- 10 posts per month
- 3 social accounts
- 5 AI generations
- LinkedIn, Twitter, YouTube

[Start Free]
```

Card 2: PRO (highlighted with accent border)
```
Pro
₹1,000 / month (₹10,000 / year)

- 100 posts per month
- 20 social accounts
- Unlimited AI generations
- All 16 platforms
- Brand voice learning
- Smart scheduling
- Analytics dashboard
- AI image generation

[Upgrade to Pro]
```

- Remove Business tier from the landing page — it confuses people. Add it later when you have enterprise customers asking for it.
- Add below pricing: "Need more? Contact us for custom plans."

**7. FAQ Section**
- Accordion style, minimal
- Questions:
  1. "How does the AI learn my brand voice?" — It analyzes your past posts and writing style to generate content that sounds like you.
  2. "Which platforms are supported?" — LinkedIn, Twitter/X, Instagram, Facebook, YouTube, Reddit, Medium, Pinterest, Telegram, Discord, Slack, Bluesky, Mastodon, Dev.to, Tumblr.
  3. "Can I edit posts before they go live?" — Yes. Every AI-generated post goes through you first. Review, edit, and approve in the calendar view.
  4. "Is my data safe?" — Your social media credentials are encrypted with AES-256 and stored securely. We never post without your explicit approval.
  5. "What happens when I hit the free limit?" — You'll see a friendly upgrade prompt. Your scheduled posts continue as planned. No surprises.

**8. Final CTA**
- Full-width dark section with accent radial glow
- "Ready to automate your social media?"
- "Start free. No credit card required."
- [Start Free] button
- Very simple, very clean

**9. Footer**
- Minimal: Logo, links (Features, Pricing, FAQ, Login, Privacy, Terms), copyright
- Social links: Twitter, LinkedIn, GitHub
- "Built with ❤️ in India"

---

## AUTH PAGE REDESIGN (auth.html)

Currently 45KB standalone HTML. Redesign:
- Split screen: left half = dark with product branding + tagline, right half = auth form
- Or: centered card on dark background (simpler)
- Tabs: Sign In / Sign Up
- Google OAuth button prominently on top
- Divider: "or continue with email"
- Email + password fields
- Match the same color system, fonts, and styling as landing page
- Mobile: full-width card, no split screen

---

## DASHBOARD REDESIGN (dashboard/)

The dashboard is React 19 + Vite. Key principles:

**Layout:**
- Sidebar (240px) + main content area
- Sidebar: dark (--bg-secondary), logo at top, nav items with icons, user avatar at bottom
- Main area: --bg-primary with --bg-elevated cards
- Top bar: breadcrumb + search + notification bell + user dropdown

**Sidebar navigation (simplified):**
1. 📊 Dashboard (home/overview)
2. 📝 Create Post
3. 📅 Calendar
4. 🤖 AI Agent (content generation)
5. 📈 Analytics
6. 🔗 Accounts (connected platforms)
7. ⚙ Settings
8. 💳 Billing

**Dashboard Home:**
- Greeting: "Good morning, Ajay"
- Stats row: Posts this month / Scheduled / AI Generated / Best performing
- Quick actions: [Create Post] [Generate Calendar] [View Analytics]
- Recent activity feed
- Upcoming scheduled posts (next 3-5)

**Calendar Page:**
- Monthly calendar grid, dark theme
- Color-coded dots for each platform
- Click a day → see/edit posts for that day
- "Generate Week" / "Generate Month" AI button prominently placed
- Drag-and-drop to reschedule

**Create Post Page:**
- Left: editor (textarea + formatting)
- Right: preview cards showing how it looks on each selected platform
- Platform selector checkboxes at top
- "AI Generate" button that fills the editor
- Schedule picker at bottom
- Media upload zone

**General dashboard styling:**
- All cards: bg-elevated, 1px border, rounded-xl (12px)
- Buttons: solid accent for primary, ghost for secondary
- Inputs: bg-secondary, border, focus ring in accent color
- Tables: clean, no zebra striping, hover highlight
- Loading states: skeleton shimmer (not spinners)
- Transitions: 150ms ease on all hover/focus states

---

## RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

- Landing: single column on mobile, bento grid collapses to stack
- Dashboard: sidebar collapses to bottom tab bar on mobile (< 768px)
- All touch targets: minimum 44px
- Font sizes scale down 10-15% on mobile

---

## ANIMATIONS (keep it subtle)

- Page load: elements fade-in with 20px translateY, staggered by 50ms
- Cards: hover → translateY(-2px) + border-accent + subtle shadow
- Buttons: hover → slight brightness increase, active → scale(0.98)
- Section reveals: IntersectionObserver fade-in on scroll (not every element, just section headings)
- NO particle effects, NO floating elements, NO parallax — these scream "AI template"

---

## IMPLEMENTATION ORDER

1. **Landing page** — this is what converts visitors to users. Start here.
2. **Auth page** — the next thing they see. Must feel premium.
3. **Dashboard layout + sidebar** — the frame everything sits in.
4. **Dashboard Home page** — the first impression after login.
5. **Calendar page** — the core feature users interact with most.
6. **Create Post page** — the second most-used feature.
7. **Other dashboard pages** — settings, billing, analytics, accounts.

For each page:
- Update the Tailwind config to include the new color system and fonts
- Replace all component styling
- Test responsive at 375px (iPhone), 768px (iPad), 1280px (desktop)
- Verify all buttons, links, and forms are functional
- Build: `cd landing && npm run build` → copy to `landing-dist/`

---

## CRITICAL REMINDERS

- **Every button must work.** Don't just make it look good — test every click.
- **No placeholder content.** Use real feature descriptions, real pricing, real platform names.
- **Test the Razorpay flow.** Pricing buttons must trigger the actual subscription flow.
- **Auth must work.** Login/signup with Supabase auth must function after redesign.
- **Mobile first.** Check every page on 375px width before calling it done.
- **Build and deploy.** After changes: `npm run build` in both landing/ and dashboard/. Push to main for Railway auto-deploy.
