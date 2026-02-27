<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,10,18&height=170&section=header&text=Social%20Media%20Automator&fontSize=44&fontAlignY=35&animation=twinkling&fontColor=ffffff&desc=AI-Powered%20Multi-Platform%20SaaS%20%7C%2016%20Platforms%20%7C%206%20AI%20Agents&descAlignY=55&descSize=18" width="100%" />

[![Live](https://img.shields.io/badge/Live-Production-00C853?style=for-the-badge&logo=railway&logoColor=white)](https://capable-motivation-production-7a75.up.railway.app)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](.)
[![Claude API](https://img.shields.io/badge/Claude_Sonnet_4-8B5CF6?style=for-the-badge&logo=anthropic&logoColor=white)](.)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](.)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](.)
[![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](.)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Schedule, create, and automate posts across 16 social platforms with 6 AI agents. Full production SaaS.**

[Live App](https://capable-motivation-production-7a75.up.railway.app) · [Features](#features) · [Architecture](#project-structure) · [Quick Start](#quick-start)

</div>

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Express Server (191+ routes)               │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐    │
│  │    AI Layer          │  │     Platform Layer               │    │
│  │  • Claude Sonnet 4   │  │  LinkedIn   Twitter   Instagram  │    │
│  │  • Stability AI      │  │  Facebook   Pinterest  Medium    │    │
│  │  • Google Gemini     │  │  Tumblr     Reddit    Dev.to    │    │
│  │  • 6 AI Agents       │  │  Telegram   Discord   Slack     │    │
│  └─────────────────────┘  │  Bluesky    Mastodon  YouTube    │    │
│                            │  TikTok                          │    │
│  ┌─────────────────────┐  └─────────────────────────────────┘    │
│  │    Data Layer        │                                         │
│  │  • Supabase (PG)    │  ┌─────────────────────────────────┐    │
│  │  • Cloudinary        │  │     Business Layer               │    │
│  │  • 29 migrations     │  │  • Razorpay billing              │    │
│  └─────────────────────┘  │  • Team collaboration             │    │
│                            │  • A/B testing                    │    │
│  ┌─────────────────────┐  │  • Webhooks (Zapier/Make)         │    │
│  │    Chrome Extension  │  │  • Analytics dashboard            │    │
│  │  • One-click post    │  └─────────────────────────────────┘    │
│  └─────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js 20+ / Express (191+ API routes) |
| **Database** | PostgreSQL via Supabase (29 migrations) |
| **AI** | Claude Sonnet 4, Stability AI, Google Gemini |
| **Frontend** | React 19 + Vite + Recharts |
| **Payments** | Razorpay (Pro + Business tiers) |
| **Storage** | Cloudinary |
| **Infrastructure** | Railway (auto-deploy on push) |

---

## Features

### Core
| Feature | Details |
|---------|---------|
| **Multi-Platform Posting** | 16 social platforms with native API integration |
| **AI Content Generation** | Captions, hashtags, optimal posting times via Claude Sonnet 4 |
| **Smart Scheduling** | 10-post daily spreads or weekly calendar (21 posts/7 days) |
| **Calendar UI** | Drag-and-drop, bulk actions, CSV/iCal export |
| **AI Image Generation** | Auto-generated images via Stability AI / Pollinations.ai |
| **Bulk Upload** | CSV import for mass scheduling |

### AI Agents
| Agent | Capability |
|-------|-----------|
| **Content Creation Agent** | Autonomous 7–30 day content calendar with brand voice learning |
| **Analytics Insights Agent** | 7 pattern types, predictive post scoring, recommendations |
| **Brand Voice Analyzer** | Learns and replicates your writing style |
| **Trend Monitor** | Real-time trend detection and content suggestions |
| **News Agent** | Curates industry news for thought leadership posts |

### Business Features
| Feature | Details |
|---------|---------|
| **Team Collaboration** | Roles, approval workflows, invitations |
| **A/B Testing** | Test content variations across audiences |
| **Content Recycling** | Auto-repost top performers |
| **Webhooks** | Zapier, Make.com integrations |
| **Analytics Dashboard** | Real-time metrics, heatmaps, reports |
| **Chrome Extension** | One-click posting from any webpage |

---

## Supported Platforms

| Platform | Status | Platform | Status |
|----------|--------|----------|--------|
| LinkedIn | ✅ Live | Reddit | ✅ Live |
| Twitter/X | ✅ Live | Dev.to | ✅ Live |
| Telegram | ✅ Live | Tumblr | ✅ Live |
| Slack | ✅ Live | Mastodon | ✅ Live |
| Discord | ✅ Live | Bluesky | ✅ Live |
| Medium | ✅ Live | YouTube | ✅ Live |
| Pinterest | ✅ Live | TikTok | ⏳ Pending |

---

## Quick Start

```bash
git clone https://github.com/ajay-automates/social-media-automator.git
cd social-media-automator
npm install
cp .env.example .env    # Fill in your credentials
npm run dev             # http://localhost:5001
```

### Production Build

```bash
npm run build           # Builds both landing + dashboard
npm start               # Production server
```

---

## Deployment

Push to `main` → Railway auto-deploys.

| Config | Value |
|--------|-------|
| **Build command** | `npm run build` |
| **Start command** | `node server.js` |
| **Health check** | `GET /api/health` |

---

## Tech Stack

`Node.js` `Express` `React 19` `Vite` `Supabase` `Claude Sonnet 4` `Stability AI` `Razorpay` `Cloudinary` `Railway` `Chrome Extension` `Recharts`

---

## Related Projects

| Project | Description |
|---------|-------------|
| [EazyApply](https://github.com/ajay-automates/eazyapply) | Chrome extension for auto-filling job applications |
| [AI Voice Agent](https://github.com/ajay-automates/ai-voice-agent) | Voice-powered document Q&A |
| [EmailBlast](https://github.com/ajay-automates/EmailBlast) | AI-powered email automation SaaS |

---

<div align="center">

**Built by [Ajay Kumar Reddy Nelavetla](https://github.com/ajay-automates)**

*Full production SaaS — not a demo. 191+ API routes. 16 platforms. 6 AI agents.*

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,10,18&height=100&section=footer" width="100%" />

</div>
