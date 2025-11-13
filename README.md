# 🚀 Social Media Automator

**Enterprise-grade multi-platform social media automation SaaS with 2 AI-powered autonomous agents.**

[![Production Ready](https://img.shields.io/badge/status-production-green)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)]()
[![React](https://img.shields.io/badge/react-19.0-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()

---

## 📖 Overview

Premium multi-platform social media automation SaaS featuring **2 autonomous AI agents**, real-time analytics, team collaboration, and glassmorphism UI design.

### 🤖 **NEW: Dual AI Agent System**

#### 1. **Content Creation Agent** 🎨
Autonomously generates and schedules content calendars:
- **Brand Voice Analysis**: Learns your unique writing style from past posts
- **Trend Monitoring**: Fetches real-time trends from Google Trends + Reddit
- **Smart Generation**: Creates 7-30 day content calendars automatically
- **Quality Scoring**: Rates posts 0-100 based on engagement potential
- **Approval Workflow**: Review and approve before scheduling
- **Platform Optimization**: Auto-adapts content for each platform

**[View Content Agent Docs →](docs/agents/CONTENT-AGENT-README.md)**

#### 2. **Analytics Insights Agent** 📊
AI-powered pattern detection and actionable recommendations:
- **7 Pattern Types**: Time slots, days, content formats, caption length, hashtags, emojis, platforms
- **AI Insights**: Claude Sonnet 4 generates 5-8 personalized recommendations
- **Impact Scoring**: Each insight rated for impact (0-100) and confidence (0-100)
- **Predictive Scoring**: Score draft posts before publishing (backend ready)
- **Data-Driven**: Analyzes YOUR posting history (last 90 days, min 10 posts)
- **Beautiful Dashboard**: Glassmorphism UI with dismissable insights

**[View Analytics Agent Docs →](docs/agents/ANALYTICS-AGENT-README.md)**

---

## ✨ Core Features

### 🌐 **16 Platforms Integrated**
- **✅ Working Now (10):** LinkedIn, Twitter/X, Telegram, Slack, Discord, Reddit, Dev.to, Tumblr, Mastodon, Bluesky
- **⏳ Pending Approval (5):** Facebook, Instagram, YouTube, Pinterest, TikTok
- **⚠️ API Restricted (1):** Medium

### 🎓 **5-Step Onboarding Tutorial**
- Interactive guided tour (30-60 seconds to first post)
- Seamless OAuth flow integration
- Skip confirmation with multi-attempt protection
- Restart option in Dashboard Quick Actions

### 🤖 **AI Content Suite** (Claude Sonnet 4 + Stability AI)
- **Caption Generator**: 3 variations per topic
- **Platform Variations**: Auto-adapt content for each platform
- **Hashtag Generator**: Platform-optimized hashtags (3-5 per post)
- **Best Time to Post**: AI-powered scheduling recommendations
- **Content Ideas**: 20+ platform-specific ideas in seconds
- **Image Generation**: AI-powered image creation (Stability AI)
- **URL/YouTube Extraction**: Generate posts from any URL or YouTube video

### 👥 **Team Collaboration**
- Multi-user workspaces with role-based permissions
- 4 roles: Owner, Admin, Editor, Viewer
- Approval workflow (Editor → Submit → Owner/Admin → Approve)
- Email invitation system (7-day expiry)
- Activity logging & audit trail
- Real-time notifications with count badges

### 📊 **Analytics Suite**
- Real-time stats dashboard
- Platform performance comparison
- CSV export for all data
- Weekly email reports (automated)
- Posting heatmap visualization
- Post history with search & filters

### 📅 **Smart Scheduling**
- Post immediately or schedule for later
- Visual calendar view with hover previews
- Auto-posting with cron (checks every minute)
- Best time recommendations (AI-powered)
- Bulk CSV upload (100+ posts at once)

### 👥 **Multi-Account Management**
- Connect unlimited accounts per platform
- Custom labels for each account
- Set default accounts per platform
- Easy account switching

### 💎 **Premium Features**
- **iOS Dark Mode UI**: Clean, minimal Apple-inspired design
- **Content Recycling**: Auto-repost best-performing content
- **Advanced Calendar**: Filters, export, drag-drop rescheduling
- **Webhook Notifications**: Zapier/Make integration (1000+ apps)
- **A/B Testing**: Test content variations for optimization
- **Hashtag Performance Tracker**: Data-driven hashtag strategy
- **Character Counter**: Real-time multi-platform validation
- **Template Library**: 15 pre-built + save your own
- **Bulk Upload**: Drag-and-drop CSV interface
- **AI Image Generation**: Create images from text prompts
- **URL Content Extraction**: Generate posts from any webpage

### 💳 **Stripe Billing**
- Multi-tier SaaS pricing ($29-$199/month)
- Usage tracking & limits
- 14-day free trial on all paid plans
- Automatic billing & invoicing

---

## 🎯 Platform Status

### ✅ **FULLY WORKING (10 platforms - No Approval Needed)**
| Platform | Text | Images | Videos | Auth Method | Status |
|----------|------|--------|--------|-------------|--------|
| **LinkedIn** | ✅ | ✅ | ❌ | OAuth 2.0 | ✅ Live |
| **Twitter/X** | ✅ | ✅ | ⚠️ | OAuth 2.0 | ✅ Live |
| **Telegram** | ✅ | ✅ | ✅ | Bot API | ✅ Live |
| **Slack** | ✅ | ✅ | 🔗 | Webhook | ✅ Live |
| **Discord** | ✅ | ✅ | 🔗 | Webhook | ✅ Live |
| **Reddit** | ✅ | ✅ | ✅ | OAuth 2.0 | ✅ Live |
| **Dev.to** | ✅ | ✅ | ❌ | API Key | ✅ Live |
| **Tumblr** | ✅ | ✅ | ❌ | OAuth 1.0a | ✅ Live |
| **Mastodon** | ✅ | ✅ | ❌ | Access Token | ✅ Live |
| **Bluesky** | ✅ | ✅ | ❌ | App Password | ✅ Live |

### ⏳ **Code Complete - Pending Approval (5)**
| Platform | Text | Images | Videos | Auth Method | Status |
|----------|------|--------|--------|-------------|--------|
| **Facebook** | ✅ | ✅ | ✅ | Graph API | ⏳ Approval Needed |
| **Instagram** | ✅ | ✅ | ✅ | Graph API | ⏳ Approval Needed |
| **YouTube** | ⏳ | ⏳ | ✅ | OAuth 2.0 | ⏳ Quota Limited |
| **Pinterest** | ❌ | ✅ | ❌ | OAuth 2.0 | ⏳ Approval Pending |
| **TikTok** | ❌ | ❌ | ✅ | OAuth 2.0 | ⏳ Approval Needed |

### ⚠️ **API Restricted (1)**
| Platform | Status | Note |
|----------|--------|------|
| **Medium** | ⚠️ Code Complete | Requires manual email approval from Medium |

### 🚧 **Coming Soon (5)**
Threads, Quora, Twitch, WhatsApp, Snapchat

**Legend:**
- ✅ Fully Working
- ⚠️ Partial (Elevated access needed)
- ⏳ Ready (quota/approval pending)
- 🔗 Webhook (no video support)
- ❌ Not Supported

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/social-media-automator.git
cd social-media-automator
npm install

cd dashboard
npm install
cd ..
```

### 2. Configure Environment

```bash
cp docs/getting-started/env-template.txt .env
# Edit .env with your credentials
```

**Minimum required:**
- Supabase credentials (database)
- Session secret
- At least one social media platform OAuth credentials

### 3. Setup Database

Run migrations in Supabase SQL Editor (in order):
- `migrations/001_initial_schema.sql` through `migrations/011_add_post_templates.sql`
- Also run `supabase/migrations/006_oauth_states.sql` for OAuth state management

### 4. Build & Run

```bash
# Build landing page and dashboard
npm run build

# Start production server
npm start

# OR run in development mode
npm run dev  # Backend on port 3000
cd dashboard && npm run dev  # Frontend on port 5173
```

**Production:** `http://localhost:3000`  
**Development:** Frontend `http://localhost:5173` + Backend `http://localhost:3000`

**📚 [Complete Setup Guide →](docs/getting-started/quick-start.md)**

---

## 📚 Documentation

### 🚀 Getting Started
- **[Quick Start](docs/getting-started/quick-start.md)** - 5-minute setup guide
- **[Environment Setup](docs/getting-started/environment-setup.md)** - Configure .env file
- **[Supabase Setup](docs/getting-started/supabase-setup.md)** - Database configuration
- **[Project Overview](docs/getting-started/project-overview.md)** - Architecture & tech stack

### 🤖 AI Agents
- **[Content Creation Agent](docs/agents/CONTENT-AGENT-README.md)** - Autonomous content generation
- **[Analytics Insights Agent](docs/agents/ANALYTICS-AGENT-README.md)** - Pattern detection & recommendations
- **[Analytics Agent Summary](docs/agents/ANALYTICS-AGENT-SUMMARY.md)** - Quick reference
- **[Deployment Checklist](docs/agents/DEPLOYMENT-CHECKLIST.md)** - Agent deployment guide

### 🔌 Platform Guides
- **[LinkedIn](docs/platforms/linkedin.md)** - OAuth & posting
- **[Twitter/X](docs/platforms/twitter.md)** - OAuth 2.0 setup
- **[Telegram](docs/platforms/telegram.md)** - Bot integration
- **[Slack](docs/platforms/slack.md)** - Webhook integration
- **[Discord](docs/platforms/discord.md)** - Webhook integration
- **[Reddit](docs/platforms/reddit.md)** - OAuth & subreddit posting
- **[Instagram](docs/platforms/instagram.md)** - Facebook Graph API
- **[Facebook](docs/platforms/facebook.md)** - Page posting
- **[YouTube](docs/platforms/youtube.md)** - Video uploads (Shorts)
- **[All 16 platforms →](docs/platforms/)**

### ✨ Features
- **[AI Generation](docs/features/ai-generation.md)** - Claude AI & Stability AI integration
- **[Post Templates](docs/features/templates.md)** - Save & reuse content
- **[Billing & Pricing](docs/features/billing-pricing.md)** - Stripe integration
- **[OAuth Configuration](docs/features/oauth.md)** - Multi-platform authentication
- **[Onboarding](docs/features/onboarding.md)** - Interactive tutorial system
- **[URL Content Generation](docs/features/url-content-generation.md)** - Extract from any URL

### 🚀 Deployment
- **[Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Platform Status](docs/deployment/platform-status.md)** - Current integrations
- **[Testing Guide](docs/deployment/testing-guide.md)** - How to test platforms
- **[API Reference](docs/deployment/api-reference.md)** - Complete API documentation
- **[URLs Reference](docs/deployment/urls-reference.md)** - All URLs & OAuth callbacks

**[📖 Full Documentation Index →](docs/README.md)**

---

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT
- **Cron**: node-cron for scheduling

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS v3.4
- **Animations**: Framer Motion v12
- **Routing**: React Router v7
- **Icons**: React Icons (FontAwesome + Simple Icons)
- **UI Design**: Glassmorphism with backdrop filters
- **Charts**: Recharts for analytics

### External Services
- **AI**: 
  - Anthropic Claude Sonnet 4 (caption generation - 3 variations, platform-optimized)
  - Stability AI (AI image generation)
  - YouTube transcript extraction (youtubei.js)
  - Web scraping with cheerio (lightweight HTML parsing)
- **Storage**: Cloudinary (images & videos)
- **Payments**: Stripe (subscriptions + usage tracking)
- **Deployment**: Railway (auto-deploy from GitHub)
- **OAuth Providers**: LinkedIn, Twitter/X, Reddit, Instagram, Facebook, YouTube, TikTok
- **Webhook Integrations**: Telegram Bot API, Slack, Discord

---

## 💰 Pricing Tiers

| Plan | Price | Posts | Accounts | AI | Team |
|------|-------|-------|----------|-----|------|
| **Free** | $0 | 10/mo | 1 | ❌ | ❌ |
| **Pro** | $29/mo | Unlimited | 3 | 100/mo | 1 user |
| **Business** | $99/mo | Unlimited | 10 | Unlimited | 5 users |
| **Enterprise** | $199/mo | Unlimited | Unlimited | Unlimited | Unlimited |

**All paid plans include:**
- 14-day free trial
- All 16 platforms
- CSV bulk upload
- Post templates
- Analytics dashboard
- Email reports
- Priority support

**[View Full Pricing Details →](docs/features/billing-pricing.md)**

---

## 🔧 Development

### Local Development

```bash
# Backend
npm run dev

# Frontend (separate terminal)
cd dashboard
npm run dev
```

### Build for Production

```bash
# Build dashboard
cd dashboard
npm run build
cd ..

# Start production server
npm start
```

### Run Tests

```bash
npm test
```

---

## 📦 Deployment

### Railway (Recommended)

1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Deploy automatically on push to `main`

**[Deployment Guide →](docs/deployment/platform-status.md)**

### Manual Deployment

1. Build dashboard: `cd dashboard && npm run build`
2. Set environment variables
3. Run migrations in Supabase
4. Start server: `npm start`

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

**Guidelines:**
- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits clean and descriptive

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🆘 Support

- **Documentation**: [docs/README.md](docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/social-media-automator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/social-media-automator/discussions)

---

## 🎉 Acknowledgments

Built with:
- [Supabase](https://supabase.com) - Database & Auth
- [Anthropic](https://anthropic.com) - Claude AI
- [Stability AI](https://stability.ai) - Image generation
- [Cloudinary](https://cloudinary.com) - Media storage
- [Stripe](https://stripe.com) - Payments
- [Railway](https://railway.app) - Deployment

---

## 📊 Project Stats

- **Total Platforms**: 16 (10 working, 5 pending, 1 restricted)
- **Lines of Code**: 34,000+
- **API Endpoints**: 114+
- **Service Files**: 31 (26 platform + 5 feature services)
- **React Components**: 63+
- **Database Tables**: 43+
- **Migrations**: 26
- **Documentation Pages**: 36+
- **AI Agents**: 2 (Content Creation + Analytics Insights)
- **Premium Features**: 5 (Recycling, Webhooks, A/B Testing, Hashtag Tracker, Advanced Calendar)
- **Success Rate**: 100% (all built platforms work!)

---

## 🗺️ Roadmap

### ✅ Recently Completed (November 2025)

**AI Agents:**
- [x] **Content Creation Agent** 🤖 - Autonomous 7-30 day content calendars
- [x] **Analytics Insights Agent** 📊 - Pattern detection & AI recommendations
- [x] **Brand Voice Analysis** - Learn user's unique writing style
- [x] **Trend Monitoring** - Real-time Google Trends + Reddit integration

**Core Features:**
- [x] **Team Collaboration** 👥 - Multi-user workspaces, 4 roles, approval workflow
- [x] **AI Content Ideas Generator** - 20+ platform-specific ideas
- [x] **AI Post Variations** - Auto-adapt content for each platform
- [x] **Bulk CSV Upload** - Schedule 100+ posts at once
- [x] **Character Counter** - Multi-platform validation
- [x] **Multi-Account Labels** - Name & set defaults for accounts
- [x] **Calendar View** - Visual schedule with hover previews
- [x] **Analytics Export** - Download data to CSV
- [x] **Email Reports** - Automated weekly summaries
- [x] **AI Hashtag Generator** - Platform-optimized hashtags
- [x] **Best Time to Post** - AI-powered recommendations
- [x] **Template Library** - 15 pre-built templates

**NEW - November 13, 2025:**
- [x] **Content Recycling Engine** ♻️ - Auto-repost best-performing content
- [x] **iOS Dark Calendar** 📅 - Clean minimal design with advanced filters
- [x] **Webhook Notifications** 🔔 - Zapier/Make integration (1000+ apps)
- [x] **A/B Testing Engine** 🧪 - Test content variations (backend complete)
- [x] **Hashtag Performance Tracker** 📊 - Track which hashtags work best (backend complete)
- [x] **Advanced Calendar Filters** - Search, platform/status/date filters, CSV/iCal export
- [x] **Drag-and-Drop Rescheduling** - Move posts by dragging in calendar

### 🔜 Next Up (Phase 3 - December 2025)

**Frontend Dashboards:**
- [ ] **A/B Testing Dashboard** - Visual test results & winner display (backend ready)
- [ ] **Hashtag Analytics Page** - Charts, top/worst lists (backend ready)
- [ ] **Webhook Dashboard** - Enhanced UI with Zapier templates

**Analytics & Optimization:**
- [ ] **Engagement Prediction** - ML model for engagement forecasting
- [ ] **Competitor Analysis** - Track competitor posting patterns
- [ ] **Post Performance Heatmap** - Visual analytics

**Team & Agency:**
- [ ] **Client Management Dashboard** - Manage multiple client accounts
- [ ] **White-Label** - Custom branding for agencies
- [ ] **Advanced Team Permissions** - Granular role controls
- [ ] **Bulk Operations** - Select & manage multiple posts at once

### 🚀 Future (Phase 4)

- [ ] Mobile app (React Native)
- [ ] Browser extension (Chrome/Firefox)
- [ ] Public API with Zapier integration
- [ ] Video editing tools (trim, add captions)
- [ ] Social listening & monitoring
- [ ] Advanced analytics (sentiment analysis)
- [ ] Multi-language support

---

**Made with ❤️ by the Social Media Automator Team**

**⭐ Star this repo if you find it useful!**

---

### Project Structure

```
social-media-automator/
├── server.js                    # Main Express server (3,600+ lines)
├── package.json                 # Backend dependencies
│
├── services/                    # Platform + Feature Services (31 files)
│   ├── linkedin.js
│   ├── twitter.js
│   ├── brand-voice-analyzer.js  # Content Agent
│   ├── trend-monitor.js         # Content Agent
│   ├── content-creation-agent.js # Content Agent
│   ├── analytics-insights-agent.js # Analytics Agent
│   ├── content-recycling.js     # NEW: Content Recycling
│   ├── webhooks.js              # NEW: Webhook Notifications
│   ├── ab-testing.js            # NEW: A/B Testing Engine
│   ├── hashtag-tracker.js       # NEW: Hashtag Performance Tracker
│   └── ... (21 more platforms)
│
├── dashboard/                   # React frontend
│   ├── src/
│   │   │   ├── pages/              # Main pages (20)
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   ├── ContentAgent.jsx       # AI Agent
│   │   │   ├── AnalyticsAgent.jsx     # AI Agent
│   │   │   ├── ContentRecycling.jsx   # NEW
│   │   │   ├── Webhooks.jsx           # NEW
│   │   │   ├── Calendar.jsx           # UPDATED
│   │   │   └── ... (13 more)
│   │   ├── components/         # Reusable UI components
│   │   └── lib/                # API client & utilities
│   └── package.json
│
├── landing/                     # Landing page (React + Vite)
│   └── src/
│
├── migrations/                  # Database migrations (26 files)
│   ├── 001_initial_schema.sql
│   ├── 021_add_content_creation_agent.sql  # Content Agent
│   ├── 022_add_analytics_insights_agent.sql # Analytics Agent
│   ├── 023_add_content_recycling.sql       # NEW: Recycling Engine
│   ├── 024_add_webhooks.sql                # NEW: Webhooks
│   ├── 025_add_ab_testing.sql              # NEW: A/B Testing
│   ├── 026_add_hashtag_tracker.sql         # NEW: Hashtag Tracker
│   └── ... (19 more)
│
├── docs/                        # Documentation (36+ guides)
│   ├── MASTER_INDEX.md         # Complete documentation index
│   ├── agents/                 # AI Agent docs
│   │   ├── CONTENT-AGENT-README.md
│   │   ├── ANALYTICS-AGENT-README.md
│   │   └── DEPLOYMENT-CHECKLIST.md
│   ├── platforms/              # Platform guides (16)
│   ├── features/               # Feature documentation (11 guides)
│   │   ├── content-recycling.md        # NEW
│   │   ├── advanced-calendar-filters.md # NEW
│   │   ├── webhooks.md                 # NEW
│   │   ├── ab-testing.md               # NEW
│   │   ├── hashtag-tracker.md          # NEW
│   │   └── ... (6 more)
│   ├── deployment/             # Deploy guides
│   └── getting-started/        # Setup guides
│
├── config/                      # Configuration files
├── utilities/                   # Helper functions
├── scripts/                     # Automation scripts
└── supabase/                    # Supabase specific files
```

---

**Version**: 8.0 - Premium Features Edition
**Status**: ✅ Production Ready
**Last Updated**: November 13, 2025
**Working Platforms**: 10 (instant access)
**AI Agents**: 2 (Content Creation + Analytics Insights)
**Premium Features**: 5 (Recycling, Webhooks, A/B Testing, Hashtag Tracker, Advanced Calendar)
**Total Lines of Code**: 34,000+
**API Endpoints**: 114+
