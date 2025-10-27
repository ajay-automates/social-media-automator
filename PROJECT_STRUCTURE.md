# 📁 Social Media Automator - Project Structure

## 🎯 Overview

**Clean, organized, professional structure** - Production-ready SaaS with React Dashboard and Express backend

---

## 📂 Directory Structure

```
social-media-automator/
│
├── 📄 CORE FILES
│   ├── package.json              # Dependencies & scripts
│   ├── server.js                 # Main Express server
│   ├── railway.json              # Railway deployment config
│   └── README.md                 # Main documentation
│
├── ⚛️ REACT DASHBOARD (NEW!)
│   └── dashboard/
│       ├── src/                  # React source code
│       │   ├── pages/            # Dashboard pages
│       │   │   ├── Dashboard.jsx
│       │   │   ├── CreatePost.jsx
│       │   │   ├── Analytics.jsx
│       │   │   └── Settings.jsx
│       │   ├── components/       # Reusable components
│       │   │   └── ui/           # UI components
│       │   ├── contexts/         # React contexts
│       │   ├── hooks/            # Custom hooks
│       │   ├── lib/              # API & Supabase client
│       │   └── utils/             # Helper functions
│       ├── dist/                 # Built dashboard (production)
│       ├── public/                # Static assets
│       └── package.json          # Dashboard dependencies
│
├── 🌐 LEGACY FRONTEND (deprecated)
│   ├── index.html                # Landing page
│   ├── auth.html                 # Login/signup page  
│   └── dashboard.html            # Old dashboard (deprecated)
│
├── 🔧 SERVICES (11 files) - Business Logic
│   ├── accounts.js            # Legacy account management
│   ├── ai.js                  # Claude AI caption generation
│   ├── ai-image.js           # AI image generation (Stability)
│   ├── billing.js            # Stripe payments & usage tracking
│   ├── cloudinary.js         # Media upload (Cloudinary)
│   ├── database.js           # Supabase operations
│   ├── instagram.js          # Instagram API (prepared)
│   ├── linkedin.js           # LinkedIn posting ✅
│   ├── oauth.js              # OAuth flows (LinkedIn/Twitter)
│   ├── scheduler.js           # Cron jobs & queue
│   ├── telegram.js           # Telegram Bot API ✅
│   └── twitter.js            # Twitter posting ✅
│
├── ⚙️ CONFIG
│   └── config/
│       └── plans.js           # Pricing tiers
│
├── 🗄️ DATABASE MIGRATIONS
│   └── migrations/
│       ├── 001_initial_schema.sql        # Base tables
│       ├── 002_multi_tenant.sql          # Multi-tenant RLS
│       ├── 003_fix_signup_trigger.sql    # Fix user creation
│       ├── 004_add_user_credentials.sql  # OAuth credentials
│       └── 005_add_telegram_support.sql  # Telegram platform
│
├── 📚 DOCUMENTATION
│   ├── README.md                      # Main guide
│   ├── PROJECT_SUMMARY.md             # Complete project overview
│   ├── PROJECT_STRUCTURE.md           # This file
│   ├── UI_ENHANCEMENTS_SUMMARY.md    # Recent UI improvements
│   ├── DASHBOARD_FEATURES.md         # Dashboard feature list
│   ├── DASHBOARD_STATUS.md           # Dashboard status
│   ├── DEPLOYMENT_FIX.md             # Deployment fixes
│   └── docs/
│       ├── AI_GENERATION_SETUP.md
│       ├── INSTAGRAM_SETUP.md
│       ├── LINKEDIN_SETUP.md
│       ├── SUPABASE_SETUP.md
│       └── TELEGRAM_SETUP.md
│
└── 🔐 UTILITIES
    └── utilities/
        └── oauthState.js      # OAuth state encryption
```

---

## 📋 File Breakdown

### ⚛️ React Dashboard (Modern SPA)

#### Dashboard Structure
```
dashboard/src/
├── pages/
│   ├── Dashboard.jsx         # Home dashboard with stats
│   ├── CreatePost.jsx        # Post creation with AI features
│   ├── Analytics.jsx         # Analytics and history
│   └── Settings.jsx          # Account and platform settings
├── components/
│   ├── ProtectedRoute.jsx    # Auth wrapper
│   └── ui/                   # Reusable UI components
│       ├── EmptyState.jsx
│       ├── ErrorBoundary.jsx
│       ├── LoadingStates.jsx
│       ├── Toast.jsx
│       └── SuccessAnimation.jsx
├── contexts/
│   └── AuthContext.jsx       # Authentication context
├── hooks/
│   └── useLoadingState.js   # Loading state management
├── lib/
│   ├── api.js               # API client
│   └── supabase.js          # Supabase client
└── utils/
    ├── animations.js        # Framer Motion utilities
    └── errorHandler.js      # Error handling
```

#### `dashboard/dist/` - Production Build
- Built React app
- Minified and optimized
- Deployed to Railway
- Served by Express server

### 🌐 Legacy Frontend (Deprecated)

#### `index.html` - Landing Page
- Marketing page for the SaaS
- Pricing table
- Features showcase
- Call-to-action buttons

#### `auth.html` - Authentication
- Login/Signup UI
- Supabase Auth integration
- Google & GitHub OAuth
- Redirects to dashboard

#### `dashboard.html` - Old Dashboard (Legacy)
- Deprecated - replaced by React dashboard
- Keep for reference only

---

### 🔧 Services Layer (11 files)

#### Core Services

**`database.js`** - Database Operations
```javascript
// Functions:
- addPost(), getDuePosts(), getAllQueuedPosts()
- updatePostStatus(), getPostHistory()
- getPlatformStats()
```

**`scheduler.js`** - Post Scheduling
```javascript
// Functions:
- schedulePost(), postNow()
- startQueueProcessor()
- getQueue(), deleteFromQueue()

// Runs: node-cron every minute
```

**`oauth.js`** - Social Media Connection
```javascript
// Functions:
- initiateLinkedInOAuth(), handleLinkedInCallback()
- initiateTwitterOAuth(), handleTwitterCallback()
- getUserCredentialsForPosting()
- disconnectAccount(), getUserConnectedAccounts()
```

#### Platform Services

**`linkedin.js`** ✅ Working
- `postTextToLinkedIn()`
- `postImageToLinkedIn()`
- Uses LinkedIn UGC Posts API

**`twitter.js`** ✅ Working
- `postToTwitter()`
- OAuth 1.0a signing
- Supports text, images, videos

**`telegram.js`** ✅ Working (NEW!)
- `sendToTelegram()`
- `sendTextMessage()`, `sendPhoto()`, `sendVideo()`
- Bot token validation
- **Supports videos up to 2GB!**

**`instagram.js`** 🟡 Prepared
- API structure ready
- Needs Facebook Developer App setup

#### AI Services

**`ai.js`** - Claude AI Captions
- 3 variations per request
- 6 niche options
- Platform-specific optimization

**`ai-image.js`** - Stability AI Images
- Multiple art styles
- Platform-optimized sizes
- Usage tracking

#### Support Services

**`cloudinary.js`** - Media Storage
- Upload images (10MB max)
- Upload videos (100MB max)
- Returns CDN URLs

**`billing.js`** - Stripe Payments
- Usage tracking
- Subscription management
- Limit enforcement
- Checkout sessions

---

### ⚙️ Configuration

**`config/plans.js`** - Pricing Tiers
```javascript
- Free: 10 posts/mo, 1 account
- Pro: Unlimited, $29/mo
- Business: Unlimited, $99/mo
```

---

### 🗄️ Database Migrations

**Sequential migrations applied:**
1. `001` - Base schema (users, subscriptions, usage, posts)
2. `002` - Multi-tenant with RLS policies
3. `003` - Fix user signup trigger
4. `004` - Add OAuth credentials storage
5. `005` - Enable Telegram platform ✅

---

## 🏗️ Architecture

### Request Flow

```
1. User clicks "Post Now"
   ↓
2. React Dashboard (CreatePost.jsx)
   ↓
3. API Client (lib/api.js)
   ↓
4. POST /api/post/now → Express server (server.js)
   ↓
5. verifyAuth() → Check JWT token
   ↓
6. getUserCredentialsForPosting() → database.js
   ↓
7. postNow() → scheduler.js
   ↓
8. platform service (linkedin.js/twitter.js/telegram.js)
   ↓
9. Social Media API (LinkedIn/Twitter/Telegram)
   ↓
10. Response back to React Dashboard
    ↓
11. Success/Error Toast notification
```

### Database Flow

```
1. User connects account
   ↓
2. POST /api/auth/linkedin/url
   ↓
3. OAuth redirect → LinkedIn
   ↓
4. Callback → Exchange tokens
   ↓
5. Store in user_accounts table (Supabase)
   ↓
6. RLS ensures user isolation
```

### Queue Flow

```
1. User schedules post
   ↓
2. Save to posts table (status: 'queued')
   ↓
3. Cron job runs every minute
   ↓
4. Check for due posts (schedule_time <= now)
   ↓
5. Process each post
   ↓
6. Update status: 'posted' or 'failed'
```

---

## 📊 Data Flow

### User Credentials
```
user_accounts table:
├── user_id (UUID)
├── platform ('linkedin', 'twitter', 'telegram')
├── access_token (encrypted)
├── refresh_token (if applicable)
├── platform_user_id (Chat ID, URN, etc.)
├── platform_username
├── status ('active', 'inactive')
└── connected_at
```

### Posting Workflow
```
1. User composes post (text + optional media)
2. Selects platforms (LinkedIn, Twitter, Telegram)
3. Credentials loaded from database
4. Post sent to each platform's API
5. Results stored in posts table
6. Usage count incremented
```

---

## 🔐 Security Features

### Row Level Security (RLS)
- Each user can only see their own data
- Enforced at database level
- No application-level checks needed

### Authentication
- JWT tokens from Supabase Auth
- All API routes protected with `verifyAuth()`
- Sessions via express-session

### Data Isolation
- `user_id` in every query
- Supabase RLS policies
- Encrypted token storage

---

## 🚀 Deployment

### Current Setup
- **Hosting:** Railway (https://capable-motivation-production-7a75.up.railway.app)
- **Database:** Supabase (PostgreSQL)
- **Media:** Cloudinary CDN
- **Deployment:** Auto-deploy from GitHub
- **Frontend:** React SPA with React Router
- **Build:** Vite (dashboard compiled to dist/)

### Environment Variables
```bash
# Database
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

# AI
ANTHROPIC_API_KEY, STABILITY_API_KEY

# Media
CLOUDINARY_URL

# Session
SESSION_SECRET

# Optional (for specific platforms)
LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET
```

---

## 📈 Key Metrics

- **Total Files:** ~50+ files
- **Dashboard Components:** 10+ React components
- **Services:** 11 platform integrations
- **API Endpoints:** 20+ routes
- **Database Tables:** 6 core tables
- **Migrations:** 5 sequential migrations
- **Lines of Code:** ~8,000+
- **Framework:** React 19 + Express.js
- **Build Tool:** Vite

---

## 🎯 Best Practices Implemented

✅ **Separation of Concerns**
- Services for business logic
- Database layer isolated
- Frontend separate from backend

✅ **DRY Principle**
- Reusable functions in services
- Shared utilities
- Centralized configuration

✅ **Security First**
- RLS policies
- JWT authentication
- Encrypted storage

✅ **Scalability**
- Multi-tenant architecture
- Cron-based queue system
- Stateless design

✅ **Maintainability**
- Clean file structure
- Clear naming conventions
- Comprehensive documentation

---

## 🔄 Development Workflow

### Adding a New Platform

1. **Create service file:**
   ```bash
   services/newplatform.js
   ```

2. **Add posting logic:**
   ```javascript
   export async function postToNewPlatform(text, mediaUrl, credentials) {
     // API call logic
   }
   ```

3. **Update scheduler.js:**
   ```javascript
   case 'newplatform':
     result = await postToNewPlatform(text, imageUrl, credentials.newplatform);
     break;
   ```

4. **Update oauth.js:**
   ```javascript
   credentials.newplatform = {
     accessToken: account.access_token,
     // ...
   };
   ```

5. **Add to dashboard.html:**
   - Add platform checkbox
   - Add connect button
   - Update UI

6. **Create migration (if needed):**
   ```sql
   -- migrations/006_add_newplatform.sql
   ALTER TABLE user_accounts 
   DROP CONSTRAINT user_accounts_platform_check;
   
   ALTER TABLE user_accounts 
   ADD CONSTRAINT user_accounts_platform_check 
   CHECK (platform IN ('linkedin', 'twitter', 'telegram', 'newplatform'));
   ```

7. **Run migration in Supabase**

8. **Test & Deploy**

---

## 📚 Documentation Structure

### Main Docs
- `README.md` - Getting started, features, API reference
- `PROJECT_SUMMARY.md` - Complete project overview

### Setup Guides (docs/)
- `SUPABASE_SETUP.md` - Database configuration
- `LINKEDIN_SETUP.md` - LinkedIn OAuth setup
- `TELEGRAM_SETUP.md` - Telegram bot setup (NEW!)
- `INSTAGRAM_SETUP.md` - Instagram setup guide
- `AI_GENERATION_SETUP.md` - AI configuration

---

## 🎉 Result

**Before:** Messy, 70+ files, hard to navigate  
**After:** Clean, ~35 files, professional structure

✅ Easy to understand  
✅ Easy to maintain  
✅ Easy to extend  
✅ Production-ready  

---

**Status:** 🟢 Production Ready  
**Last Updated:** October 2025  
**Platforms Supported:** LinkedIn | Twitter | Telegram | Instagram

