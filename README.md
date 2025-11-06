# 🚀 Social Media Automator

**Multi-platform social media automation SaaS with AI-powered content generation.**

[![Production Ready](https://img.shields.io/badge/status-production-green)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()

---

## 📖 Overview

Premium multi-platform social media automation SaaS with AI-powered content generation, real-time analytics, and glassmorphism UI design.

**Key Features:**
- 🌐 **10 Platforms Integrated**: LinkedIn, Twitter, Instagram, Facebook, YouTube, TikTok, Reddit, Discord, Slack, Telegram
- 🤖 **AI Suite** (Claude Sonnet 4):
  - Caption generation (3 variations per topic)
  - Platform-specific post variations (auto-adapt content)
  - AI hashtag generator (platform-optimized)
  - Best time to post recommendations
  - Content ideas generator (20+ ideas in seconds)
  - Image generation (Stability AI)
  - URL/YouTube content extraction
- 📅 **Smart Scheduling**: Post immediately, schedule with calendar view, auto-posting with cron
- 👥 **Multi-Account**: Connect & label unlimited accounts per platform with default settings
- 📊 **Analytics Suite**: Real-time stats, CSV export, weekly email reports, posting heatmap
- 📤 **Bulk Upload**: Schedule 100+ posts via CSV with drag-and-drop interface
- 🔢 **Character Counter**: Real-time multi-platform validation with color-coded limits
- 📝 **Template Library**: 15 pre-built templates + save your own
- 📅 **Calendar View**: Visual calendar with hover previews for scheduled posts
- 💎 **Glassmorphism UI**: Premium glossy design with real brand icons
- 💳 **Stripe Billing**: 3-tier SaaS pricing with usage tracking

---

## 🎯 Platform Status

### ✅ Fully Integrated (10)
| Platform | Text | Images | Videos | OAuth/Webhook | Status |
|----------|------|--------|--------|--------------|--------|
| **LinkedIn** | ✅ | ✅ | ❌ | OAuth 2.0 | Live |
| **Twitter/X** | ✅ | ✅ | ⚠️ | OAuth 2.0 | Live |
| **Telegram** | ✅ | ✅ | ✅ | Bot API | Live |
| **Slack** | ✅ | ✅ | 🔗 | Webhook | Live |
| **Discord** | ✅ | ✅ | 🔗 | Webhook | Live |
| **Reddit** | ✅ | ✅ | ✅ | OAuth 2.0 | Live |
| **YouTube** | ⏳ | ⏳ | ✅ | OAuth 2.0 | Ready |
| **Instagram** | ✅ | ✅ | ✅ | Graph API | Live |
| **Facebook** | ✅ | ✅ | ✅ | Graph API | Live |
| **TikTok** | ❌ | ❌ | ✅ | OAuth 2.0 | Beta |

### 🚧 Coming Soon (10)
Pinterest, WhatsApp, Snapchat, Medium, Twitch, Threads, Bluesky, Mastodon, Tumblr, Quora

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

Comprehensive documentation is organized in the `docs/` folder:

### 🚀 Getting Started
- **[Quick Start](docs/getting-started/quick-start.md)** - 5-minute setup
- **[Environment Setup](docs/getting-started/environment-setup.md)** - Configure .env
- **[Project Overview](docs/getting-started/project-overview.md)** - Architecture & tech stack

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
- **[TikTok](docs/platforms/tiktok.md)** - Video posting

### ✨ Features
- **[AI Generation](docs/features/ai-generation.md)** - Claude AI & Stability AI
- **[Post Templates](docs/features/templates.md)** - Save & reuse content
- **[Billing & Pricing](docs/features/billing-pricing.md)** - Stripe integration
- **[OAuth Configuration](docs/features/oauth.md)** - Multi-platform auth

### 🚀 Deployment
- **[Platform Status](docs/deployment/platform-status.md)** - Current integrations
- **[Testing Guide](docs/deployment/testing-guide.md)** - How to test
- **[API Reference](docs/deployment/api-reference.md)** - Complete API docs
- **[URLs Reference](docs/deployment/urls-reference.md)** - All URLs & callbacks

**📖 [Full Documentation Index →](docs/README.md)**

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

## 💰 Pricing

| Plan | Price | Posts | Accounts | AI |
|------|-------|-------|----------|-----|
| **Free** | $0 | 10/mo | 1 | ❌ |
| **Pro** | $29/mo | Unlimited | 3 | 100/mo |
| **Business** | $99/mo | Unlimited | 10 | Unlimited |

**All paid plans include:**
- 14-day free trial
- All platforms
- CSV bulk upload
- Post templates
- Analytics

**[View Full Pricing →](docs/features/billing-pricing.md)**

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

- **Total Files**: 100+
- **Lines of Code**: 20,000+
- **Platforms**: 10 fully integrated
- **API Endpoints**: 45+
- **Database Tables**: 12+
- **React Components**: 40+
- **Real Icons**: 70+ brand logos
- **Features**: 13 major features (enterprise-grade)

---

## 🗺️ Roadmap

### ✅ Recently Completed (Nov 2025)
- [x] **AI Content Ideas Generator** - 20+ platform-specific ideas in seconds
- [x] **AI Post Variations** - Auto-adapt content for each platform
- [x] **Bulk CSV Upload** - Schedule 100+ posts at once
- [x] **Character Counter** - Multi-platform validation with color codes
- [x] **Multi-Account Labels** - Name & set defaults for accounts
- [x] **Calendar View** - Visual schedule with hover previews
- [x] **Analytics Export** - Download data to CSV
- [x] **Email Reports** - Automated weekly summaries
- [x] **AI Hashtag Generator** - Platform-optimized hashtags
- [x] **Best Time to Post** - AI-powered scheduling recommendations
- [x] **Template Library** - 15 pre-built templates

### 🔜 Next Up (Phase 2)
- [ ] **Team Collaboration** - Multi-user accounts with approval workflow
- [ ] **Content Recycling** - Auto-repost best-performing content
- [ ] **Engagement Prediction** - AI scores posts before publishing
- [ ] **Client Management** - Manage multiple client accounts
- [ ] **Hashtag Performance Tracking** - Analytics per hashtag

### 🚀 Future (Phase 3)
- [ ] White-label offering for agencies
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Advanced team roles & permissions
- [ ] Public API with Zapier integration
- [ ] Competitor analysis tools

---

**Made with ❤️ by the Social Media Automator Team**

**⭐ Star this repo if you find it useful!**

---

**Version**: 5.0 - AI Enterprise Edition  
**Status**: ✅ Production Ready  
**Last Updated**: November 6, 2025  
**UI**: Premium Glassmorphism with Real Brand Icons  
**AI Features**: 6 AI-powered tools for content creation
