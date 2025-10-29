# 🚀 Social Media Automator

A production-ready **multi-platform social media automation SaaS** that helps you schedule and publish content across LinkedIn, Twitter/X, Telegram, and Instagram.

<!-- Last deployed: $(date) -->

![Platform Support](https://img.shields.io/badge/platforms-LinkedIn%20%7C%20Twitter%20%7C%20Telegram-blue)
![Status](https://img.shields.io/badge/status-Production-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## ✨ Features

### 📱 Social Media Integration
- ✅ **LinkedIn** - Text + Images
- ✅ **Twitter/X** - Text + Images + Videos (up to 2:20)
- ✅ **Telegram** - Text + Images + Videos (up to 2GB!)
- 🟡 **Instagram** - Ready to configure

### 🤖 AI-Powered Content
- Generate captions with Claude Sonnet 4
- AI image generation with Stability AI
- 6 niche options (Restaurant, E-commerce, Content, Cost-Saving, Real Estate, General)
- Platform-specific optimization

### 📅 Smart Scheduling
- Immediate posting
- Schedule posts for future dates
- Auto-posting via cron jobs
- Queue management
- Bulk CSV upload (schedule 100s of posts)

### 💰 Monetization Ready
- 3-tier pricing model (Free, Pro $29/mo, Business $99/mo)
- Stripe integration ready
- Usage tracking & limits
- Customer portal

---

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL with RLS)
- **Authentication:** Supabase Auth (JWT)
- **Payments:** Stripe

### Frontend
- Vanilla JavaScript (no build step)
- TailwindCSS CDN
- Supabase Auth UI

### Integrations
- **AI:** Anthropic Claude Sonnet 4
- **Media Storage:** Cloudinary
- **Deployment:** Railway

---

## 📁 Project Structure

```
social-media-automator/
├── server.js                 # Main Express server
├── package.json             # Dependencies
├── .env.example             # Environment variables template
│
├── index.html               # Landing page
├── auth.html                # Authentication page
├── dashboard.html           # Main dashboard
│
├── services/                # Business logic modules
│   ├── ai.js                # Claude AI integration
│   ├── ai-image.js         # AI image generation
│   ├── billing.js          # Stripe & usage tracking
│   ├── cloudinary.js       # Media storage
│   ├── database.js         # Supabase operations
│   ├── instagram.js        # Instagram API
│   ├── linkedin.js         # LinkedIn API
│   ├── oauth.js            # OAuth flows
│   ├── scheduler.js        # Cron jobs
│   ├── telegram.js         # Telegram Bot API
│   └── twitter.js          # Twitter API
│
├── config/
│   └── plans.js            # Pricing configuration
│
├── migrations/              # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_multi_tenant.sql
│   ├── 003_fix_signup_trigger.sql
│   ├── 004_add_user_credentials.sql
│   └── 005_add_telegram_support.sql
│
└── docs/                    # Documentation
    ├── AI_GENERATION_SETUP.md
    ├── INSTAGRAM_SETUP.md
    ├── LINKEDIN_SETUP.md
    ├── SUPABASE_SETUP.md
    └── TELEGRAM_SETUP.md
```

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/ajay-automates/social-media-automator.git
cd social-media-automator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# AI
ANTHROPIC_API_KEY=sk-ant-...
STABILITY_API_KEY=sk-xxx

# Media Storage
CLOUDINARY_URL=cloudinary://...

# Session
SESSION_SECRET=random_secure_string

# Server
PORT=3000
APP_URL=http://localhost:3000
```

### 4. Run Database Migrations

Apply migrations in `Supabase > SQL Editor`:

1. Run `migrations/001_initial_schema.sql`
2. Run `migrations/002_multi_tenant.sql`
3. Run `migrations/003_fix_signup_trigger.sql`
4. Run `migrations/004_add_user_credentials.sql`
5. Run `migrations/005_add_telegram_support.sql`

### 5. Start Server

```bash
npm start
```

Server runs at http://localhost:3000

---

## 📚 Documentation

- [Supabase Setup](docs/SUPABASE_SETUP.md)
- [LinkedIn Setup](docs/LINKEDIN_SETUP.md)
- [Instagram Setup](docs/INSTAGRAM_SETUP.md)
- [Telegram Setup](docs/TELEGRAM_SETUP.md)
- [AI Generation Setup](docs/AI_GENERATION_SETUP.md)

---

## 🎯 Key Features Explained

### Multi-Platform Posting

Post to multiple platforms simultaneously:

```javascript
// Single post to all platforms
POST /api/post/now
{
  "text": "Your post content",
  "imageUrl": "https://...",
  "platforms": ["linkedin", "twitter", "telegram"]
}
```

### AI Caption Generation

Generate platform-specific captions:

```javascript
POST /api/ai/generate
{
  "topic": "Benefits of automation",
  "niche": "E-commerce",
  "platform": "linkedin"
}
```

### Smart Scheduling

Queue posts for automatic publishing:

```javascript
POST /api/post/schedule
{
  "text": "Scheduled post",
  "platforms": ["twitter", "linkedin"],
  "scheduleTime": "2025-10-27T10:00:00Z"
}
```

---

## 🌐 Production URL

**Live at:** https://capable-motivation-production-7a75.up.railway.app

Deployed on Railway with auto-deployment from GitHub.

---

## 💳 Pricing Tiers

| Feature | Free | Pro ($29/mo) | Business ($99/mo) |
|---------|------|---------------|-------------------|
| **Posts/month** | 10 | ♾️ Unlimited | ♾️ Unlimited |
| **Social Accounts** | 1 | 3 | 10 |
| **AI Generations** | ❌ | 100/month | ♾️ Unlimited |
| **Platforms** | 1 | All 3 | All 4 |
| **CSV Bulk Upload** | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ |

---

## 🔐 Security

- ✅ Row Level Security (RLS) for complete data isolation
- ✅ JWT token-based authentication
- ✅ Encrypted OAuth token storage
- ✅ Supabase session management
- ✅ HTTPS enforced in production

---

## 🛠️ Development

### Local Development

```bash
npm run dev  # With nodemon for auto-reload
```

### Testing

```bash
# Health check
curl http://localhost:3000/api/health
```

---

## 📊 API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/signin` - Login
- `POST /auth/signout` - Logout

### Posting
- `POST /api/post/now` - Post immediately
- `POST /api/post/schedule` - Schedule post
- `POST /api/post/bulk-csv` - CSV upload

### Queue
- `GET /api/queue` - View queue
- `DELETE /api/queue/:id` - Remove from queue

### OAuth
- `POST /api/auth/linkedin/url` - LinkedIn OAuth URL
- `GET /auth/linkedin/callback` - LinkedIn callback
- `POST /api/auth/twitter/url` - Twitter OAuth URL
- `GET /auth/twitter/callback` - Twitter callback
- `POST /api/auth/telegram/connect` - Connect Telegram bot

### AI
- `POST /api/ai/generate` - Generate captions
- `POST /api/ai/image/generate` - Generate images

### Billing
- `GET /api/billing/plans` - Get plans
- `POST /api/billing/checkout` - Create checkout
- `POST /api/billing/portal` - Customer portal
- `GET /api/billing/usage` - Usage stats

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

---

## 👤 Author

**Ajay Kumar Reddy**

- GitHub: [@ajay-automates](https://github.com/ajay-automates)
- Twitter: [@MrAjayReddie](https://twitter.com/MrAjayReddie)

---

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com) and [Railway](https://railway.app)
- AI powered by [Anthropic Claude](https://anthropic.com)
- Deployment on [Railway](https://railway.app)

---

**Status:** ✅ Production Ready  
**Last Updated:** October 2025  
**Platforms:** LinkedIn | Twitter | Telegram | Instagram
# Force rebuild
