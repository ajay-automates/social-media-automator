# Social Media Automator

AI-powered multi-platform social media automation SaaS. Schedule, create, and automate posts across 16 social platforms.

**Live:** https://capable-motivation-production-7a75.up.railway.app

---

## Tech Stack

- **Backend:** Node.js (>=20) + Express
- **Database:** PostgreSQL via Supabase
- **AI:** Claude Sonnet 4 (Anthropic), Stability AI, Google Gemini
- **Frontend:** React 19 + Vite + Recharts
- **Payments:** Razorpay
- **Storage:** Cloudinary
- **Infrastructure:** Railway (auto-deploy on push to main)

---

## Quick Start

```bash
git clone <repo-url>
cd social-media-automator
npm install
cp .env.example .env   # fill in your credentials
npm run dev            # runs on http://localhost:5001
```

Build dashboard and landing page:
```bash
npm run build          # builds both landing + dashboard
npm start              # production server
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

### Required

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Session
SESSION_SECRET=<random 32+ char string>
OAUTH_STATE_SECRET=<random 32 byte hex>

# Generate secrets with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### OAuth Platforms

```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

YOUTUBE_CLIENT_ID=         # Google Cloud Console OAuth credentials
YOUTUBE_CLIENT_SECRET=

TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
```

### AI Services

```env
ANTHROPIC_API_KEY=sk-ant-...     # Claude AI captions & agents
STABILITY_API_KEY=sk-...         # Image generation
GEMINI_API_KEY=                  # Google Gemini (optional)
```

### Storage & Payments

```env
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_PRO_MONTHLY_PLAN_ID=
RAZORPAY_PRO_ANNUAL_PLAN_ID=
RAZORPAY_BUSINESS_MONTHLY_PLAN_ID=
RAZORPAY_BUSINESS_ANNUAL_PLAN_ID=
```

### Application

```env
APP_URL=http://localhost:5001
PORT=5001
NODE_ENV=development
```

---

## Database Setup

Run migrations in order in your Supabase SQL Editor:

```
migrations/001_initial_schema.sql
migrations/002_multi_tenant.sql
migrations/003_fix_signup_trigger.sql
migrations/004_add_user_credentials.sql
migrations/005_add_telegram_support.sql
migrations/006_add_instagram_platform.sql
migrations/007_add_facebook_platform.sql
migrations/008_add_slack_platform.sql
migrations/009_add_discord_platform.sql
migrations/010_add_reddit_platform.sql
migrations/011_add_post_templates.sql
migrations/012_add_public_templates.sql
migrations/013_add_email_reports.sql
migrations/014_add_bulk_upload_tracking.sql
migrations/015_add_account_labels.sql
migrations/016_add_team_collaboration.sql
migrations/017_add_pinterest.sql
migrations/018_add_medium_devto_platforms.sql
migrations/018_user_milestones.sql
migrations/019_add_mastodon_platform.sql
migrations/020_add_bluesky_platform.sql
migrations/021_add_content_agent.sql
migrations/022_add_analytics_insights_agent.sql
migrations/023_add_content_recycling.sql
migrations/024_add_webhooks.sql
migrations/025_add_ab_testing.sql
migrations/026_add_hashtag_tracker.sql
migrations/027_performance_optimization_indexes.sql
migrations/028_add_business_profiles.sql
migrations/029_add_ai_cost_tracking.sql
```

---

## Project Structure

```
social-media-automator/
├── server.js                  # Main Express server (191+ API routes)
├── package.json
├── .env.example
├── railway.json               # Railway deployment config
├── nodemon.json               # Dev server watch config
│
├── services/                  # Business logic
│   ├── Platform services:
│   │   linkedin.js, twitter.js, instagram.js, facebook.js,
│   │   pinterest.js, medium.js, tumblr.js, reddit.js,
│   │   devto.js, telegram.js, discord.js, slack.js,
│   │   bluesky.js, mastodon.js, tiktok.js, youtube.js
│   ├── AI services:
│   │   ai.js, ai-image.js, ai-wrapper.js,
│   │   content-creation-agent.js, analytics-insights-agent.js,
│   │   brand-voice-analyzer.js, trend-monitor.js,
│   │   news-fetcher.js, news-agent.js
│   └── Core services:
│       scheduler.js, database.js, accounts.js, billing.js,
│       email.js, activity.js, permissions.js, invitations.js,
│       carousel.js, ab-testing.js, content-recycling.js,
│       hashtag-tracker.js, smart-scheduling.js, templates.js,
│       webhooks.js, reports.js, cache.js, cloudinary.js,
│       business.js, oauth.js, twitter-auth.js, admin.js
│
├── middleware/
│   ├── error-handler.js
│   ├── rate-limiter.js
│   └── request-logger.js
│
├── utilities/
│   ├── env-validator.js
│   └── oauthState.js
│
├── config/
│   └── plans.js               # Pricing tier definitions
│
├── migrations/                # SQL database migrations (001–029)
│
├── dashboard/                 # React frontend (Vite)
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── pages/             # 23 pages
│       ├── components/        # UI, calendar, dashboard, onboarding
│       ├── contexts/
│       ├── hooks/
│       └── utils/
│
├── landing/                   # Marketing website (React + Vite)
│   └── src/
│       └── components/        # Hero, Features, Pricing, FAQ, etc.
│
├── landing-dist/              # Built landing page (served by Express)
│
├── chrome-extension/          # Browser extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html / popup.js
│   ├── background.js
│   ├── content-script.js
│   ├── manual-settings.html
│   ├── icons/
│   ├── styles/
│   └── utils/                 # api-client.js, storage.js, constants.js
│
├── scripts/                   # Utility scripts
└── supabase/                  # Supabase config files
```

---

## Features

### Core
- **Multi-Platform Posting** — 16 social platforms
- **AI Content Generation** — Captions, hashtags, optimal posting times via Claude Sonnet 4
- **Smart Scheduling** — 10-post daily spreads (hourly) or weekly calendar (21 posts/7 days)
- **Calendar UI** — Drag-and-drop, bulk actions, CSV/iCal export, platform filtering
- **AI Image Generation** — Auto-generated images via Stability AI / Pollinations.ai
- **Bulk Upload** — CSV import for mass scheduling

### AI Agents
- **Content Creation Agent** — Autonomous 7–30 day content calendar with brand voice learning, trend monitoring, quality scoring
- **Analytics Insights Agent** — Pattern detection (7 types), personalized recommendations, predictive post scoring

### Team & Business
- **Team Collaboration** — Roles, approval workflows, invitations
- **Business Profiles** — Brand info storage for AI personalization
- **A/B Testing** — Test content variations
- **Content Recycling** — Auto-repost top performers
- **Hashtag Tracking** — Performance analytics per hashtag
- **Webhooks** — Integrations with Zapier, Make.com, etc.
- **Analytics Dashboard** — Real-time metrics, heatmaps, reports

### Integrations
- **Chrome Extension** — One-click posting from any webpage
- **Billing** — Razorpay with Pro and Business tier plans (monthly/annual)

---

## Supported Platforms

| Platform | Status |
|----------|--------|
| LinkedIn | Live |
| Twitter/X | Live |
| Telegram | Live |
| Slack | Live |
| Discord | Live |
| Reddit | Live |
| Dev.to | Live |
| Tumblr | Live |
| Mastodon | Live |
| Bluesky | Live |
| Medium | Live |
| YouTube | Live |
| Pinterest | Live |
| TikTok | Pending |

---

## Deployment (Railway)

Push to `main` branch → Railway auto-deploys.

**Build command:** `npm run build`
**Start command:** `node server.js`
**Health check:** `GET /api/health`

Update `APP_URL` and all OAuth redirect URIs in platform developer consoles when going to production.

---

## Chrome Extension Setup

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. Click the extension icon → enter your API token from the dashboard Settings page

The extension reads your Supabase auth token from the dashboard and sends posts directly to the API.

---

## API Overview

All routes are in `server.js`. Key route groups:

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Authentication & OAuth |
| `/api/posts` | Post CRUD, scheduling |
| `/api/accounts` | Connected social accounts |
| `/api/generate` | AI content generation |
| `/api/analytics` | Metrics & reports |
| `/api/team` | Team management |
| `/api/billing` | Payments & subscriptions |
| `/api/templates` | Post templates |
| `/api/webhooks` | Webhook management |
| `/api/content-agent` | Content creation agent |
| `/api/analytics-agent` | Analytics insights agent |
| `/api/admin` | Admin operations |
| `/api/health` | Health check |

---

## License

MIT
