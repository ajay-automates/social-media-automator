# Social Media Automator

Automate your social media posts across LinkedIn and Twitter! Built for creators managing multiple social media accounts.

## 🎉 Production Status

**LIVE & WORKING**: https://capable-motivation-production-7a75.up.railway.app

### ✅ Current Features
- 🔗 **LinkedIn** - Post text and images
- 🐦 **Twitter/X** - Post text and images
- ⏰ Schedule Posts for optimal times
- 📋 Queue Management with visual dashboard
- 🔄 Auto-posting every minute
- 🎨 Clean UI with dark mode
- 🖼️ Media Support - Images (10MB) and Videos (100MB)
- 🤖 AI Caption Generation (Claude Sonnet 4)
- 🎨 AI Image Generation (Stability AI)
- 🎯 Multi-platform posting

## 📊 Documentation

- **🎯 Project Status**: See [PROJECT_STATUS.md](./PROJECT_STATUS.md) - **Single source of truth** for all completed and pending features
- **Production Summary**: See [PRODUCTION_SUMMARY_FINAL.md](./PRODUCTION_SUMMARY_FINAL.md) - Production deployment details
- **Project Overview**: See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Full project details
- **Quick Start**: See [QUICK_START.md](./QUICK_START.md) - Get started quickly
- **Setup Guides**: See [/docs](./docs/) folder - Platform-specific setup

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit .env and add your credentials.

### 3. Start the Server

```bash
npm start
```

Open http://localhost:3000 in your browser!

## API Endpoints

- POST /api/post/now - Post immediately
- POST /api/post/schedule - Schedule a post
- POST /api/post/bulk - Schedule multiple posts
- POST /api/post/bulk-csv - Bulk upload via CSV
- GET /api/queue - View scheduled posts
- DELETE /api/queue/:id - Remove from queue
- GET /api/history - Post history
- POST /api/ai/generate - Generate AI captions

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email, Google, GitHub)
- **Scheduler**: node-cron
- **AI**: Anthropic Claude Sonnet 4, Stability AI
- **Media**: Cloudinary
- **APIs**: LinkedIn API v2, Twitter API v2
- **Frontend**: Vanilla JS + TailwindCSS
- **Deployment**: Railway

## Supported Platforms

| Platform | Text Posts | Images | Videos |
|----------|-----------|--------|--------|
| LinkedIn | ✅ | ✅ | ❌ |
| Twitter/X | ✅ | ✅ | ❌ |
| Instagram | 🚧 Planned | 🚧 Planned | 🚧 Planned |

## ⚠️ Known Limitations

- Twitter video upload: Videos upload to Cloudinary but post as captions only (OAuth issue)
- Instagram integration: Not yet implemented

## Author

Aj (@ajay-automates)

## License

MIT License
