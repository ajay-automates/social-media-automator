# Social Media Automator

Automate your LinkedIn posts with scheduling! Built for creators managing multiple social media accounts.

## Features

- Post Immediately to LinkedIn
- Schedule Posts for optimal times
- Queue Management with visual dashboard
- Auto-posting every minute
- Clean UI with dark mode
- Image Support with URL uploads

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

Edit .env and add your LinkedIn credentials.

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
- API: LinkedIn Graph API
- Frontend: Vanilla JS + TailwindCSS

## Author

Aj (@ajay-automates)

## License

MIT License
