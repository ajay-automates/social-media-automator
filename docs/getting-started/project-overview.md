# 📋 Project Overview

Complete technical overview of the Social Media Automator SaaS platform.

## 🎯 What Is This?

A **production-ready multi-tenant SaaS** that automates social media posting across 16 platforms (10 working instantly, 5 pending approval) with AI-powered content generation.

**Core Value Proposition:**
- Post to all platforms simultaneously
- AI-generated captions and images
- Schedule posts weeks in advance  
- Save 10+ hours per week
- Multi-account management

---

## 🏗️ Architecture

### High-Level Stack

```
┌─────────────────────────────────────────┐
│         React Dashboard (SPA)           │
│    React 19 + Vite + TailwindCSS        │
└─────────────────────────────────────────┘
                   ↓ API
┌─────────────────────────────────────────┐
│        Express.js Backend               │
│    Auth + OAuth + Scheduling            │
└─────────────────────────────────────────┘
         ↓                    ↓
┌─────────────────┐  ┌─────────────────┐
│   Supabase      │  │  External APIs  │
│   PostgreSQL    │  │  (Social+AI)    │
└─────────────────┘  └─────────────────┘
```

### Request Flow

```
User Action → React Component → API Client → Express Route
    ↓
JWT Verification → Service Layer → Platform API
    ↓
Database Update → Return Response → UI Update
```

---

## 📁 Project Structure

```
social-media-automator/
├── 📄 Core Files
│   ├── package.json              # Backend dependencies
│   ├── server.js                 # Main Express server (2800+ lines)
│   ├── .env                      # Environment variables (gitignored)
│   └── README.md                 # Main documentation
│
├── ⚛️ React Dashboard
│   └── dashboard/
│       ├── src/
│       │   ├── pages/            # Main routes
│       │   │   ├── Dashboard.jsx
│       │   │   ├── CreatePost.jsx
│       │   │   ├── Analytics.jsx
│       │   │   ├── Settings.jsx
│       │   │   ├── Templates.jsx
│       │   │   └── Pricing.jsx
│       │   ├── components/       # Reusable UI
│       │   │   └── ui/           # Loading, Toast, etc.
│       │   ├── contexts/         # Auth context
│       │   ├── lib/              # API client, Supabase
│       │   └── utils/            # Helpers
│       ├── dist/                 # Built files (production)
│       └── package.json          # Frontend dependencies
│
├── 🔧 Services (Business Logic)
│   ├── database.js               # Supabase operations
│   ├── scheduler.js              # Cron + queue processing
│   ├── oauth.js                  # Multi-platform OAuth
│   ├── billing.js                # Stripe integration
│   ├── ai.js                     # Claude AI captions
│   ├── ai-image.js               # Stability AI images
│   ├── cloudinary.js             # Media uploads
│   ├── linkedin.js               # LinkedIn posting
│   ├── twitter.js                # Twitter API
│   ├── telegram.js               # Bot API
│   ├── instagram.js              # Graph API
│   ├── facebook.js               # Page posting
│   ├── youtube.js                # Video uploads
│   ├── tiktok.js                 # Video posting
│   └── templates.js              # Template CRUD
│
├── ⚙️ Configuration
│   └── config/plans.js           # Pricing tiers & limits
│
├── 🗄️ Database
│   └── migrations/               # 8 SQL migrations
│       ├── 001_initial_schema.sql
│       ├── 002_multi_tenant.sql
│       ├── 003_fix_signup_trigger.sql
│       └── ...
│
├── 📚 Documentation
│   └── docs/                     # All guides
│
└── 🔐 Utilities
    └── utilities/
        └── oauthState.js         # OAuth encryption
```

---

## 🛠️ Tech Stack Details

### Backend
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Supabase client (not traditional ORM)
- **Auth**: Supabase Auth + JWT
- **Session**: express-session
- **Cron**: node-cron

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: TailwindCSS v3
- **Animations**: Framer Motion
- **Forms**: React Hook Form (where needed)
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast

### External Services
- **Database & Auth**: Supabase
- **AI Captions**: Anthropic Claude Sonnet 4
- **AI Images**: Stability AI
- **Media Storage**: Cloudinary
- **Payments**: Stripe
- **Deployment**: Railway
- **Email**: Supabase Auth (transactional)

---

## 🔐 Security Architecture

### Multi-Tenant Isolation

**Row Level Security (RLS):**
```sql
-- Every query automatically filtered by user_id
CREATE POLICY user_posts ON posts
  FOR ALL USING (auth.uid() = user_id);
```

**Benefits:**
- Database-level security
- No application-level checks needed
- Impossible to access other users' data

### Authentication Flow

```
1. User signs up → Supabase Auth
2. JWT token generated → Stored in localStorage
3. Every API request → Authorization: Bearer {token}
4. Backend verifies JWT → Supabase validation
5. User ID extracted → Used in all queries
```

### OAuth Token Storage

- Encrypted in database
- Service role key for admin operations
- Tokens never exposed to frontend
- Auto-refresh for expired tokens

---

## 💾 Database Schema

### Core Tables

**`posts`** - All scheduled/posted content
```sql
- id, user_id, text, image_url
- platforms (JSONB array)
- schedule_time, status
- results (JSONB)
```

**`user_accounts`** - OAuth credentials
```sql
- id, user_id, platform
- access_token, refresh_token
- platform_user_id, platform_username
- token_expires_at, status
```

**`subscriptions`** - Billing
```sql
- id, user_id, plan
- stripe_customer_id, stripe_subscription_id
- status, trial_ends_at
```

**`usage`** - Monthly tracking
```sql
- id, user_id, month
- posts_count, ai_count, accounts_count
```

**`post_templates`** - Saved drafts
```sql
- id, user_id, name, text
- platforms, category, use_count
```

---

## 🔄 Key Workflows

### 1. Immediate Posting

```javascript
User clicks "Post Now"
  ↓
CreatePost.jsx calls API
  ↓
POST /api/post/now
  ↓
verifyAuth() checks JWT
  ↓
getUserCredentialsForPosting(userId)
  ↓
postNow() in scheduler.js
  ↓
Loop through selected platforms:
  - postToLinkedIn()
  - postToTwitter()
  - postToTelegram()
  ↓
Aggregate results
  ↓
Save to database
  ↓
Return success/errors
  ↓
UI shows toast notification
```

### 2. Scheduled Posting

```javascript
User schedules post
  ↓
POST /api/post/schedule
  ↓
Save to posts table (status: 'queued')
  ↓
Cron runs every minute
  ↓
processDueQueue() finds posts where:
  schedule_time <= NOW() AND status = 'queued'
  ↓
Process each post (same as immediate)
  ↓
Update status to 'posted' or 'failed'
```

### 3. OAuth Connection

```javascript
User clicks "Connect LinkedIn"
  ↓
POST /api/auth/linkedin/url
  ↓
Generate OAuth URL with state
  ↓
Redirect to LinkedIn
  ↓
User authorizes
  ↓
LinkedIn redirects to /auth/linkedin/callback
  ↓
Exchange code for tokens
  ↓
Get user profile
  ↓
Save to user_accounts table
  ↓
Redirect to dashboard with success message
```

### 4. AI Caption Generation

```javascript
User enters topic + niche
  ↓
POST /api/ai/generate
  ↓
Call Claude API with prompt
  ↓
Generate 3 variations
  ↓
Return to frontend
  ↓
Show in modal for user selection
  ↓
User picks one
  ↓
Insert into post textarea
```

---

## 📊 Data Flow

### User Credentials Storage

```
OAuth Flow
  ↓
Exchange code → Get tokens
  ↓
Store in user_accounts:
  - access_token (encrypted)
  - refresh_token (if applicable)
  - token_expires_at
  ↓
When posting:
  getUserCredentialsForPosting(userId)
  ↓
Returns formatted object:
  {
    linkedin: [{ accessToken, urn, ... }],
    twitter: [{ accessToken, userId, ... }],
    ...
  }
```

### Multi-Account Support

```sql
-- One user can have multiple accounts per platform
SELECT * FROM user_accounts 
WHERE user_id = 'abc-123' 
  AND platform = 'linkedin';

-- Returns:
-- { id: 1, platform_username: 'John Doe', ... }
-- { id: 2, platform_username: 'Company Page', ... }
```

When posting, loop through all accounts:
```javascript
for (const account of credentials.linkedin) {
  await postToLinkedIn(text, imageUrl, account);
}
```

---

## 🎯 Features Implemented

### Core Features
- ✅ Multi-platform posting (7 platforms)
- ✅ Post scheduling
- ✅ Multi-account per platform
- ✅ OAuth integration
- ✅ Media upload (images & videos)
- ✅ Real-time analytics
- ✅ Post history
- ✅ Queue management

### AI Features
- ✅ AI caption generation (Claude Sonnet 4)
- ✅ 3 variations per request
- ✅ 6 niche options
- ✅ AI image generation (Stability AI)
- ✅ Multiple art styles
- ✅ Example prompts

### Content Management
- ✅ Post templates
- ✅ Save drafts
- ✅ Bulk CSV upload
- ✅ Template variables ({{name}}, {{date}})
- ✅ Template categories

### Billing
- ✅ 3-tier pricing (Free, Pro, Business)
- ✅ Stripe integration
- ✅ Usage tracking
- ✅ Subscription management
- ✅ Customer portal

### UX
- ✅ Loading skeletons
- ✅ Toast notifications
- ✅ Success animations
- ✅ Empty states
- ✅ Error boundaries
- ✅ Responsive design

---

## 📈 Scalability Considerations

### Current Capacity
- **Concurrent users**: Limited by Supabase plan
- **Posts per minute**: ~60 (rate-limited by platforms)
- **Database**: PostgreSQL (vertically scalable)
- **File storage**: Cloudinary (25GB free → unlimited paid)

### Bottlenecks
1. **Platform rate limits** - Use queue system
2. **Database connections** - Connection pooling via Supabase
3. **Memory** - Stateless design (scales horizontally)

### Scaling Strategy
1. **Horizontal**: Deploy multiple Railway instances
2. **Queue**: Use Redis for distributed queue (future)
3. **CDN**: Static assets via Cloudinary
4. **Database**: Upgrade Supabase plan or self-host PostgreSQL

---

## 🚀 Deployment

### Current Setup
- **Platform**: Railway
- **URL**: capable-motivation-production-7a75.up.railway.app
- **Auto-deploy**: Push to `main` branch
- **Build**: `npm run build` (dashboard) + `npm start`
- **Environment**: Variables in Railway dashboard

### CI/CD Pipeline
```
git push origin main
  ↓
Railway detects push
  ↓
Install dependencies
  ↓
Build React dashboard
  ↓
Start Express server
  ↓
Run health checks
  ↓
Deploy to production
```

---

## 📊 Metrics & Monitoring

### Built-in Analytics
- Total posts by platform
- Post success/failure rates
- Daily activity
- Platform distribution
- User engagement

### What to Monitor
1. **Error rates** - Failed posts
2. **API response times** - Database queries
3. **Queue processing** - Scheduled posts
4. **Token expirations** - OAuth refresh failures
5. **Usage limits** - Billing alerts

---

## 🔮 Future Enhancements

### Short-term
- [ ] Pinterest integration
- [ ] Threads (Instagram) support
- [ ] Advanced analytics (charts)
- [ ] Post performance tracking
- [ ] A/B testing for captions

### Long-term
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Team collaboration
- [ ] Content calendar view
- [ ] White-label offering

---

## 📚 Additional Resources

- [Quick Start](quick-start.md) - Get started in 5 minutes
- [Environment Setup](environment-setup.md) - Configure variables
- [Platform Guides](../platforms/) - Setup each social network
- [API Reference](../deployment/api-reference.md) - Complete endpoint docs
- [Testing Guide](../deployment/testing-guide.md) - How to test features

---

**Built with ❤️ using modern best practices**  
**Production-ready** | **Fully tested** | **Well documented** ✅

