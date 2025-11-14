# CODEMAP — Social Media Automator

This document is an operational, high-level map of the repository designed to help new contributors understand the architecture, entry points, major services, data flows, and important setup steps.

## Purpose

- Quick on-boarding reference for engineers.
- Where to look for platform adapters, background work (scheduler), auth, and database schema.

## High-level architecture

- Backend: Node.js (>=20) + Express. Entry: `server.js`.
- Database & Auth: Supabase (Postgres). Uses both anon and service-role clients.
- Frontend: React + Vite (projects in `dashboard/` and `landing/`), builds placed in `dashboard/dist` and `landing-dist`.
- Storage: Cloudinary for images/videos; `uploads/` exists for temporary storage.
- Scheduling: `services/scheduler.js` runs background posting jobs (uses node-cron style approach).
- AI: Anthropic (Claude Sonnet 4) via `@anthropic-ai/sdk` and Stability AI for image gen (refer to `services/ai.js` and `services/ai-image.js`).

## Entry points

- `server.js` — main express app. Responsibilities:

  - Configure middleware (CORS, body parsers, sessions, multer for uploads).
  - Initialize Supabase clients and Cloudinary.
  - Mount static assets for `landing-dist` and `dashboard/dist`.
  - Import and wire many service functions (see Services section below).
  - Start scheduler via `startScheduler()`.

- `dashboard/` and `landing/` — front-end projects (run `npm run build:dashboard` and `npm run build:landing`).

## Services (folder: `services/`)

This repo centralizes most logic in `services/`. Notable files:

- Integrations / Platforms:

  - `linkedin.js`, `twitter.js`, `instagram.js`, `facebook.js`, `reddit.js`, `mastodon.js`, `bluesky.js`, `telegram.js`, `slack.js`, `discord.js`, `pinterest.js`, `youtube.js`, `tumblr.js`, `devto.js`, `tiktok.js`, `tumblr.js`.

- Core infra & utilities:

  - `database.js` — DB access layer and queries used across app.
  - `oauth.js` — central OAuth flows, connect/disconnect and callback handlers.
  - `cloudinary.js` — upload helpers.
  - `scheduler.js` — queue processing, cron-like job runner.
  - `webhooks.js` — webhook management and firing.
  - `billing.js` — Stripe usage and billing flows.
  - `email.js` — sending emails, reports, invite flows.
  - `ai.js`, `ai-image.js` — AI caption generation, variations, image generation.

- Feature modules:

  - `content-creation-agent.js`, `analytics-insights-agent.js`, `content-recycling.js`, `ab-testing.js`, `hashtag-tracker.js`, `templates.js`, `reports.js`, `analytics.js`.

- Helpers and misc:
  - `csv-parser.js` (bulk uploads), `video-search.js`, `web-scraper-light.js`, `permissions.js`, `activity.js`, `invitations.js`.

Each service exports functions that `server.js` imports and exposes via API routes (inside `server.js` there are many references to those functions). When adding features, follow the same pattern: create service functions and wire them in `server.js` (or modularize routes later).

## Typical data flow (Create & Post)

1. User composes a post in the React dashboard (frontend). The frontend calls an API route on the Express server.
2. `server.js` verifies auth (Supabase token) via `verifyAuth` middleware and delegates to the relevant service (e.g., `services/database.addPost` and `services/scheduler.schedulePost`).
3. Posts are queued in an application queue (scheduler); `startScheduler()` processes the queue and calls platform adapters (e.g., `instagram.js`, `linkedin.js`) to perform actual posting.
4. Adapters use stored credentials (from `services/oauth` / database) to call external APIs and return results.
5. `scheduler` updates post status in DB (`services/database.updatePostStatus`) and triggers webhooks/notifications via `webhooks.js`.

## Background jobs

- `services/scheduler.js` manages immediate and scheduled posts, retries, and rate limits. It's launched at server start in `server.js`.
- Cron-like operations (weekly emails, recycling jobs, analytics jobs) are scheduled from services (check `reports.js`, `content-recycling.js`, and `analytics-insights-agent.js`).

## Auth & OAuth

- Primary auth: Supabase Auth. `server.js` uses a Supabase JS client to verify bearer tokens in `verifyAuth`.
- OAuth flows (platform connect) are implemented in `services/oauth.js` and platform-specific modules implement token refresh/verify helpers.
- PKCE code_verifiers are stored in in-memory Maps (see `server.js`); this is noted as a development shortcut and should be moved to Redis in production.

## Migrations & DB schema

- `migrations/` contains ordered SQL files. Key migrations include `001_initial_schema.sql` and many later migrations adding platforms, templates, teams, webhooks, A/B testing, analytics, etc. Run them in order in Supabase SQL Editor on a fresh install.

## Important environment variables (from documentation)

- Required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `PORT`.
- Optional / feature flags: `ANTHROPIC_API_KEY`, `CLOUDINARY_*`, `STRIPE_SECRET_KEY`, `EMAIL_USER`, `EMAIL_PASSWORD`, `FRONTEND_URL`.

## How to run (developer quick commands)

1. Install deps: `npm install` (root), then `cd dashboard && npm install` if developing frontend.
2. Set up `.env` from `docs/getting-started/env-template.txt` and configure Supabase and platform credentials.
3. Run DB migrations in Supabase SQL Editor (ordered) before first run.
4. Development: `npm run dev` (uses nodemon) — backend default port 3000. Frontend: `cd dashboard && npm run dev` (port 5173).
5. Production build: `npm run build` then `npm start`.

## Key docs to read (already scanned)

- `README.md` — product overview + quick start (primary entry).
- `FEATURES.md` — exhaustive feature list and required migrations.
- `README_GOOGLE_OAUTH.md`, `QUICK_START_GOOGLE_OAUTH.md` — Google OAuth setup and troubleshooting.
- `TESTING_GUIDE.md`, `VISUAL_GUIDE.md` — QA and UX notes.

## Observations & risks

- A lot of runtime secrets required: ensure Supabase & Cloudinary are configured before running.
- PKCE and other in-memory stores will lose state on restart — not production-safe.
- Many platform adapters are present; some require platform approvals (Facebook/Instagram/YouTube/Pinterest/TikTok) and may be in partial/approximate state.
- Large surface area: when changing `server.js`, carefully keep route wiring stable.

## Suggested next steps (pick one)

1. Generate per-file summaries for `services/` (I can do 8-12 files per batch). This will list exports and responsibilities.
2. Add a lightweight routes directory (split `server.js` into modular routers) — medium risk but improves maintainability.
3. Replace in-memory PKCE store with Redis-backed store (recommended for production).

If you'd like, I can start producing per-module summaries now (I suggest batches of 10 files). Which do you prefer?

---

Generated by repo scan on Nov 13, 2025
