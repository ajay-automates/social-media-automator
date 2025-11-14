# 🚀 Social Media Automator

**AI-powered multi-platform social media automation SaaS with autonomous agents, Chrome extension, and team collaboration.**

[![Production](https://img.shields.io/badge/status-live-green)]()
[![Platforms](https://img.shields.io/badge/platforms-16-blue)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)]()
[![React](https://img.shields.io/badge/react-19-blue)]()

🌐 **Live:** [https://capable-motivation-production-7a75.up.railway.app](https://capable-motivation-production-7a75.up.railway.app)

---

## ⚡ Quick Start

```bash
# 1. Clone & Install
git clone <repo-url>
npm install

# 2. Environment Setup
cp .env.example .env
# Add your API keys (see docs/getting-started/environment-setup.md)

# 3. Start Development
npm run dev

# 4. Open Browser
http://localhost:5001
```

📖 **Full Setup:** [docs/getting-started/quick-start.md](docs/getting-started/quick-start.md)

---

## 🤖 AI Agent System

### **Content Creation Agent** 🎨
Autonomous content calendar generation:
- Learns brand voice from past posts
- Monitors real-time trends (Google Trends + Reddit)
- Generates 7-30 day content calendars
- Quality scoring (0-100) for engagement prediction
- Platform-optimized content

[View Docs →](docs/agents/CONTENT-AGENT-README.md)

### **Analytics Insights Agent** 📊
AI-powered pattern detection & recommendations:
- 7 pattern types (timing, content, hashtags, etc.)
- Claude Sonnet 4 generates personalized insights
- Impact & confidence scoring for each recommendation
- Predictive post scoring before publishing

[View Docs →](docs/agents/ANALYTICS-AGENT-README.md)

---

## 🌐 Supported Platforms

| Platform | Status | OAuth | API |
|----------|--------|-------|-----|
| LinkedIn | ✅ Live | ✅ | ✅ |
| Twitter/X | ✅ Live | ✅ | ✅ |
| Telegram | ✅ Live | ✅ | ✅ |
| Slack | ✅ Live | ✅ | ✅ |
| Discord | ✅ Live | ✅ | ✅ |
| Reddit | ✅ Live | ✅ | ✅ |
| Dev.to | ✅ Live | ✅ | ✅ |
| Tumblr | ✅ Live | ✅ | ✅ |
| Mastodon | ✅ Live | ✅ | ✅ |
| Bluesky | ✅ Live | ✅ | ✅ |
| Facebook | ⏳ Pending | ✅ | Approval |
| Instagram | ⏳ Pending | ✅ | Approval |
| YouTube | ⏳ Pending | ✅ | Approval |
| TikTok | ⏳ Pending | ✅ | Approval |
| Pinterest | ⏳ Pending | ✅ | Approval |
| Medium | ⚠️ Restricted | - | Limited |

📋 **Platform Docs:** [docs/platforms/](docs/platforms/)

---

## ✨ Key Features

### 🤖 AI Content Suite
- **Caption Generation:** 3 AI variations per topic (Claude Sonnet 4)
- **Platform Adaptation:** Auto-optimize for each platform's format
- **Hashtag Generator:** Platform-specific hashtags (3-5 per post)
- **Best Time to Post:** AI recommendations based on your data
- **Content Ideas:** 20+ platform-specific suggestions instantly
- **Image Generation:** Stability AI integration
- **URL Extraction:** Generate posts from any URL or YouTube video

### 📅 Smart Scheduling
- Post immediately or schedule for later
- Visual calendar with hover previews
- Auto-posting with cron (checks every minute)
- Bulk CSV upload (100+ posts)
- Advanced filters & drag-drop rescheduling

### 👥 Team Collaboration
- Multi-user workspaces with role-based permissions
- 4 roles: Owner, Admin, Editor, Viewer
- Approval workflow for content review
- Email invitations (7-day expiry)
- Activity logging & audit trail

### 📊 Analytics
- Real-time performance dashboard
- Platform comparison metrics
- CSV export for all data
- Automated weekly email reports
- Posting heatmap visualization

### 🔌 Chrome Extension
- One-click posting from any webpage
- Auto-extract page metadata (title, image, URL)
- AI caption generation
- Multi-platform selection
- Manual token entry (no complex auth flow)

[Extension Setup →](CHROME_EXTENSION_QUICK_START.md)

### 🎨 UI/UX
- Modern glassmorphism design
- iOS-inspired dark mode
- Responsive (mobile, tablet, desktop)
- 5-step onboarding tutorial (30-60 seconds)
- Real-time notifications with badges

---

## 📂 Project Structure

```
social-media-automator/
├── server.js                    # Express server (230K lines)
├── config/                      # Environment & API configs
├── services/                    # Platform APIs & business logic
├── utilities/                   # Helper functions
├── dashboard/                   # React frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Route pages
│   │   └── utils/              # Frontend utilities
│   └── dist/                   # Production build
├── chrome-extension/           # Browser extension
│   ├── popup.html/.js          # Extension UI
│   ├── content-script.js       # Page injection
│   ├── background.js           # Service worker
│   └── manual-settings.html    # Token entry
├── landing/                    # Marketing site
├── docs/                       # Documentation
│   ├── getting-started/        # Setup guides
│   ├── features/               # Feature docs
│   ├── platforms/              # Platform integration
│   ├── deployment/             # Deploy guides
│   └── agents/                 # AI agent docs
└── migrations/                 # Database migrations
```

📖 **Detailed Map:** [CODEMAP.md](CODEMAP.md)

---

## 🔧 Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth (JWT)
- **AI:** Claude Sonnet 4 (Anthropic)
- **Image AI:** Stability AI
- **OAuth:** Passport.js
- **Scheduling:** node-cron
- **File Upload:** multer

### Frontend
- **Framework:** React 19
- **Build:** Vite
- **Router:** React Router v6
- **HTTP:** Axios
- **Date:** date-fns
- **Charts:** Recharts
- **UI:** Custom glassmorphism CSS

### Chrome Extension
- **Manifest:** V3
- **Auth:** Supabase JWT (manual entry)
- **Storage:** chrome.storage.local
- **Injection:** Content scripts

### Infrastructure
- **Hosting:** Railway.app
- **Database:** Supabase (managed PostgreSQL)
- **Storage:** Supabase Storage (images/media)
- **DNS:** Custom domain support

---

## 🚀 Deployment

**Current Production:**
- URL: https://capable-motivation-production-7a75.up.railway.app
- Status: ✅ Live
- Uptime: Railway auto-scaling

**Deploy Steps:**
1. Push to GitHub
2. Railway auto-deploys from `main` branch
3. Environment variables synced from Railway dashboard

📖 **Full Guide:** [docs/deployment/DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md)

---

## 📚 Documentation

| Topic | Link |
|-------|------|
| **Quick Start** | [docs/getting-started/quick-start.md](docs/getting-started/quick-start.md) |
| **Environment Setup** | [docs/getting-started/environment-setup.md](docs/getting-started/environment-setup.md) |
| **Chrome Extension** | [CHROME_EXTENSION_QUICK_START.md](CHROME_EXTENSION_QUICK_START.md) |
| **API Reference** | [docs/deployment/api-reference.md](docs/deployment/api-reference.md) |
| **Platform Status** | [docs/deployment/platform-status.md](docs/deployment/platform-status.md) |
| **Testing Guide** | [TESTING_GUIDE.md](TESTING_GUIDE.md) |
| **Full Index** | [DOCS_INDEX.md](DOCS_INDEX.md) |

---

## 🔑 Environment Variables

Required keys in `.env`:

```bash
# Server
PORT=5001
NODE_ENV=production
BASE_URL=https://your-domain.com

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
ANTHROPIC_API_KEY=sk-ant-...
STABILITY_API_KEY=sk-...

# OAuth (per platform)
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
TWITTER_CLIENT_ID=xxx
TWITTER_CLIENT_SECRET=xxx
# ... (see docs/getting-started/environment-setup.md)
```

📖 **Complete List:** [docs/getting-started/environment-setup.md](docs/getting-started/environment-setup.md)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific platform
npm run test:linkedin

# Test AI agents
npm run test:agents

# Test Chrome extension
See chrome-extension/TESTING.md
```

📖 **Full Testing Guide:** [TESTING_GUIDE.md](TESTING_GUIDE.md)

---

## 🎯 Roadmap

### ✅ Completed
- 16 platform integrations
- 2 AI autonomous agents
- Chrome extension v1.0
- Team collaboration
- Advanced analytics
- Mobile-responsive UI

### 🚧 In Progress
- Platform API approvals (Facebook, Instagram, YouTube, TikTok, Pinterest)
- Chrome Web Store submission
- Mobile app (React Native)

### 📋 Planned
- Video post support (all platforms)
- Advanced A/B testing dashboard
- White-label solution
- API for third-party integrations
- WordPress plugin

---

## 📊 Performance

- **Server Response:** <100ms average
- **UI Load Time:** <1s initial
- **Chrome Extension:** <200ms popup open
- **AI Generation:** 2-5s per request
- **Auto-posting:** Every 1 minute (cron)
- **Database:** PostgreSQL (optimized indexes)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🆘 Support

- 📖 **Documentation:** [DOCS_INDEX.md](DOCS_INDEX.md)
- 🐛 **Issues:** GitHub Issues
- 📧 **Email:** support@your-domain.com

---

## 🎉 Credits

Built with:
- [Node.js](https://nodejs.org/)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Anthropic Claude](https://anthropic.com/)
- [Stability AI](https://stability.ai/)
- [Railway](https://railway.app/)

---

**Version:** 1.0.0
**Last Updated:** November 13, 2025
**Status:** ✅ Production Ready

🚀 **[Get Started Now →](docs/getting-started/quick-start.md)**
