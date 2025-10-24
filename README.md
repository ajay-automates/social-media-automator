# Social Media Automator

Automate your social media posts across LinkedIn, Twitter, and Instagram! Built for creators managing multiple social media accounts.

## Features

- 🔗 **LinkedIn** - Post text and images
- 🐦 **Twitter/X** - Post text updates
- 📸 **Instagram** - Post images and Reels (videos)
- ⏰ Schedule Posts for optimal times
- 📋 Queue Management with visual dashboard
- 🔄 Auto-posting every minute
- 🎨 Clean UI with dark mode
- 🖼️ Media Support with URL uploads
- 🎯 Multi-platform posting (select one or all platforms)

## Quick Start

### 1. Install Dependencies

```bash
cd social-media-automator
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit .env and add your credentials for LinkedIn, Twitter, and Instagram.

### 3. Start the Server

```bash
npm start
```

Open http://localhost:3000 in your browser!

## API Endpoints

- POST /api/post/now - Post immediately
- POST /api/post/schedule - Schedule a post
- POST /api/post/bulk - Schedule multiple posts
- GET /api/queue - View scheduled posts
- DELETE /api/queue/:id - Remove from queue

## Tech Stack

- Backend: Node.js + Express
- Scheduler: node-cron
- APIs: LinkedIn API v2, Twitter API v2, Instagram Graph API v18.0
- Frontend: Vanilla JS + TailwindCSS

## Supported Platforms

| Platform | Text Posts | Images | Videos |
|----------|-----------|--------|--------|
| LinkedIn | ✅ | ✅ | ❌ |
| Twitter/X | ✅ | ❌ | ❌ |
| Instagram | ✅ | ✅ | ✅ (Reels) |

## Author

Aj (@ajay-automates)

## License

MIT License
