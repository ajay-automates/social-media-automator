# 🚀 Social Media Automator

**Multi-platform social media automation SaaS with AI-powered content generation.**

[![Production Ready](https://img.shields.io/badge/status-production-green)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()

---

## 📖 Overview

Automate your social media posting across 8+ platforms with AI-generated content, intelligent scheduling, and multi-account management.

**Key Features:**
- 🌐 **8 Platforms**: LinkedIn, Twitter, Telegram, Slack, YouTube, Instagram, Facebook, TikTok
- 🤖 **AI-Powered**: Claude AI captions + Stability AI images
- 📅 **Smart Scheduling**: Post immediately or schedule for later
- 👥 **Multi-Account**: Connect multiple accounts per platform
- 📊 **Analytics**: Track performance across all platforms
- 💳 **Stripe Billing**: 3-tier SaaS pricing

---

## 🎯 Platform Status

| Platform | Text | Images | Videos | Status |
|----------|------|--------|--------|--------|
| **LinkedIn** | ✅ | ✅ | ❌ | Live |
| **Twitter/X** | ✅ | ✅ | ⚠️ | Partial |
| **Telegram** | ✅ | ✅ | ✅ | Live |
| **Slack** | ✅ | ✅ | 🔗 | Live |
| **YouTube** | ⏳ | ⏳ | ✅ | Ready |
| **Instagram** | ✅ | ✅ | ✅ | Live |
| **Facebook** | ✅ | ✅ | ✅ | Live |
| **TikTok** | ❌ | ❌ | ✅ | Beta |

**Legend:**
- ✅ Fully Working
- ⚠️ Partial (Elevated access needed)
- ⏳ Ready (quota/approval pending)
- 🔗 Link only (webhooks don't support video)
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
- `migrations/001_initial_schema.sql`
- `migrations/002_multi_tenant.sql`
- Through `migrations/007_add_post_templates.sql`

### 4. Build & Run

```bash
# Build React dashboard
cd dashboard && npm run build && cd ..

# Start server
npm start
```

Visit: `http://localhost:3000`

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
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Routing**: React Router v7

### External Services
- **AI**: Anthropic Claude, Stability AI
- **Storage**: Cloudinary
- **Payments**: Stripe
- **Deployment**: Railway
- **OAuth**: LinkedIn, Twitter, Instagram, Facebook, YouTube, TikTok

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

- **Total Files**: 50+
- **Lines of Code**: 8,000+
- **Platforms Supported**: 7
- **API Endpoints**: 25+
- **Database Tables**: 8
- **React Components**: 15+

---

## 🗺️ Roadmap

### Short-term
- [ ] Pinterest integration
- [ ] Threads (Instagram) support
- [ ] Advanced analytics dashboard
- [ ] Content calendar view

### Long-term
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Team collaboration features
- [ ] White-label offering
- [ ] API for third-party integrations

---

**Made with ❤️ by the Social Media Automator Team**

**⭐ Star this repo if you find it useful!**

---

**Version**: 3.2  
**Status**: ✅ Production Ready  
**Last Updated**: January 2025
