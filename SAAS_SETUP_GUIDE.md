# 🚀 SaaS Conversion Setup Guide

This guide will walk you through setting up your Social Media Automator as a multi-tenant SaaS application with authentication, billing, and OAuth account connections.

## 📋 Table of Contents
1. [What's Been Implemented](#whats-been-implemented)
2. [Prerequisites](#prerequisites)
3. [Supabase Setup](#supabase-setup)
4. [Stripe Setup](#stripe-setup)
5. [OAuth Setup](#oauth-setup)
6. [Environment Variables](#environment-variables)
7. [Local Testing](#local-testing)
8. [Production Deployment](#production-deployment)
9. [Testing Checklist](#testing-checklist)

---

## ✅ What's Been Implemented

### 🔐 Authentication System
- **Email/Password Authentication** via Supabase Auth
- **Social Login** (Google & GitHub OAuth)
- **JWT-based API Protection** - all API endpoints secured
- **Auth Pages**: Login, signup, forgot password, social login
- **Session Management** for OAuth flows

### 📄 Pages Created
- **Landing Page** (`index.html`) - Conversion-optimized marketing page with pricing
- **Auth Page** (`auth.html`) - Login/signup with social login options
- **Dashboard** (`dashboard.html`) - Protected app dashboard with user info and logout

### 🔒 Multi-Tenant Architecture
- **Row Level Security (RLS)** policies for data isolation
- **User-scoped API endpoints** - users only see their own data
- **Database Migration** (`migrations/002_multi_tenant.sql`) for:
  - `user_accounts` table (OAuth credentials storage)
  - `subscriptions` table (Stripe billing info)
  - `usage` table (monthly usage tracking)
  - RLS policies on all tables

### 💳 Billing & Subscriptions (Stripe)
- **3-Tier Pricing Model**:
  - **Free**: 10 posts/month, 1 account, no AI
  - **Pro**: $29/month (or $290/year), unlimited posts, 3 accounts, 100 AI/month
  - **Business**: $99/month (or $990/year), unlimited everything, 10 accounts
- **14-day Free Trial** on paid plans
- **Stripe Checkout** integration
- **Customer Portal** for subscription management
- **Webhook Handling** for subscription events
- **Usage Tracking** with soft limits (grace period before hard block)

### 🔗 OAuth Account Connection
- **LinkedIn OAuth 2.0** - Connect LinkedIn accounts
- **Twitter OAuth 1.0a** - Connect Twitter accounts
- **Account Management** - Connect/disconnect social accounts
- **Automatic Token Refresh** (where supported)

### 📊 Usage Limits & Enforcement
- **Soft Limits** - Allow 2-3 posts/AI generations over limit with upgrade prompts
- **Usage Tracking** - Automatic monthly reset
- **Upgrade Prompts** - Suggest plan upgrades when limits reached
- **API Responses** include usage information

### 🎯 API Endpoints Added
#### Authentication & Users
- `GET /auth` - Auth page (login/signup)
- `GET /dashboard` - Dashboard (protected)
- `GET /api/user/accounts` - Get connected social accounts
- `DELETE /api/user/accounts/:platform` - Disconnect account

#### OAuth
- `GET /auth/linkedin/connect` - Start LinkedIn OAuth
- `GET /auth/linkedin/callback` - Handle LinkedIn callback
- `GET /auth/twitter/connect` - Start Twitter OAuth
- `GET /auth/twitter/callback` - Handle Twitter callback

#### Billing
- `GET /api/billing/plans` - Get all plans
- `POST /api/billing/checkout` - Create Stripe checkout session
- `POST /api/billing/portal` - Create customer portal session
- `POST /api/billing/webhook` - Handle Stripe webhooks
- `GET /api/billing/usage` - Get user usage and limits

---

## 📦 Prerequisites

Before you begin, make sure you have:
- ✅ **Node.js** (v16 or higher)
- ✅ **Supabase account** (free tier works)
- ✅ **Stripe account** (test mode for development)
- ✅ **LinkedIn Developer account** (for OAuth)
- ✅ **Twitter Developer account** (for OAuth)
- ✅ **GitHub/Google OAuth apps** (for social login)

---

## 🗄️ Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from Settings → API

### 2. Enable Authentication Providers
1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Enable **Google** provider:
   - Create OAuth app in [Google Cloud Console](https://console.cloud.google.com/)
   - Add authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase
4. Enable **GitHub** provider:
   - Create OAuth app in [GitHub Developer Settings](https://github.com/settings/developers)
   - Add callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase

### 3. Run Database Migration
1. Go to **SQL Editor** in Supabase Dashboard
2. Create a new query
3. Copy the entire contents of `migrations/002_multi_tenant.sql`
4. Paste and run the query
5. Verify tables were created:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_schema = 'public';
   ```

### 4. Verify RLS Policies
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

You should see policies for:
- `posts` - "Users see own posts"
- `user_accounts` - "Users see own accounts"
- `subscriptions` - "Users see own subscription"
- `usage` - "Users see own usage"

---

## 💳 Stripe Setup

### 1. Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Use **Test Mode** for development

### 2. Create Products
Go to **Products** in Stripe Dashboard and create:

**Pro Plan (Monthly)**
- Name: "Pro Monthly"
- Price: $29/month
- Copy the Price ID (starts with `price_`)

**Pro Plan (Annual)**
- Name: "Pro Annual"
- Price: $290/year
- Copy the Price ID

**Business Plan (Monthly)**
- Name: "Business Monthly"
- Price: $99/month
- Copy the Price ID

**Business Plan (Annual)**
- Name: "Business Annual"
- Price: $990/year
- Copy the Price ID

### 3. Set Up Webhook
1. Go to **Developers → Webhooks**
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/billing/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook Signing Secret** (starts with `whsec_`)

### 4. Get API Keys
Go to **Developers → API Keys** and copy:
- **Publishable key** (starts with `pk_test_`)
- **Secret key** (starts with `sk_test_`)

---

## 🔗 OAuth Setup

### LinkedIn OAuth
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Add redirect URL: `http://localhost:3000/auth/linkedin/callback` (for development)
4. Add redirect URL: `https://your-domain.com/auth/linkedin/callback` (for production)
5. Request access to these products:
   - "Sign In with LinkedIn"
   - "Share on LinkedIn"
6. Copy **Client ID** and **Client Secret**

### Twitter OAuth
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 1.0a
4. Add callback URL: `http://localhost:3000/auth/twitter/callback`
5. Add callback URL: `https://your-domain.com/auth/twitter/callback`
6. Copy **API Key** (Consumer Key) and **API Secret** (Consumer Secret)

---

## 🔑 Environment Variables

Create/update your `.env` file with the following:

```bash
# Supabase (Database & Auth)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Stripe (Billing)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Twitter OAuth
TWITTER_CONSUMER_KEY=your_twitter_consumer_key
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret

# Anthropic AI (Existing)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Session Secret (for Twitter OAuth)
SESSION_SECRET=generate_a_random_secret_string_here

# Node Environment
NODE_ENV=development
PORT=3000
```

**Generate Session Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 Local Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Update HTML Files with Supabase Credentials
In both `auth.html` and `dashboard.html`, replace:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual credentials:
```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your_actual_anon_key_here';
```

### 3. Start Server
```bash
npm start
```

### 4. Test Authentication
1. Navigate to `http://localhost:3000`
2. Click "Start Free" or "Login"
3. Try signing up with email/password
4. Try signing in with Google/GitHub
5. Verify you're redirected to dashboard
6. Verify logout works

### 5. Test OAuth Account Connection
1. In dashboard, look for "Connect LinkedIn" or "Connect Twitter" buttons (you'll need to add these to UI)
2. Click to start OAuth flow
3. Authorize the app
4. Verify account appears as connected

### 6. Test Billing
1. Get usage info: `curl -H "Authorization: Bearer YOUR_JWT" http://localhost:3000/api/billing/usage`
2. Create checkout session (use Stripe test cards)
3. Complete checkout
4. Verify subscription active
5. Test customer portal access

### 7. Test Usage Limits
1. Make 10 posts as a free user
2. Try to make 11th post
3. Verify you see upgrade prompt
4. Upgrade to Pro
5. Verify unlimited posting works

---

## 🚀 Production Deployment

### 1. Update Environment Variables on Railway
Add all environment variables from `.env` to Railway:
```bash
railway variables set SUPABASE_URL=https://...
railway variables set SUPABASE_ANON_KEY=...
railway variables set STRIPE_SECRET_KEY=...
# ... etc for all variables
```

### 2. Update OAuth Redirect URLs
Add production URLs to:
- LinkedIn app: `https://your-domain.up.railway.app/auth/linkedin/callback`
- Twitter app: `https://your-domain.up.railway.app/auth/twitter/callback`
- Google OAuth: `https://your-project-id.supabase.co/auth/v1/callback`
- GitHub OAuth: `https://your-project-id.supabase.co/auth/v1/callback`

### 3. Update Supabase Site URL
In Supabase Dashboard → Authentication → URL Configuration:
- Set Site URL: `https://your-domain.up.railway.app`
- Add Redirect URLs:
  - `https://your-domain.up.railway.app/dashboard`
  - `https://your-domain.up.railway.app/auth`

### 4. Update Stripe Webhook
Update webhook endpoint URL to production:
```
https://your-domain.up.railway.app/api/billing/webhook
```

### 5. Update HTML Files for Production
In `auth.html` and `dashboard.html`, update Supabase credentials to production values.

**Note:** For production, consider moving these credentials to environment variables and injecting them server-side.

### 6. Deploy
```bash
git add .
git commit -m "SaaS conversion complete"
git push
```

Railway will automatically deploy.

### 7. Test Production
- Test signup/login
- Test social login
- Test OAuth connections
- Test billing checkout with test card
- Test usage limits
- Verify webhooks are received

---

## ✅ Testing Checklist

### Authentication
- [ ] Email signup works
- [ ] Email login works
- [ ] Forgot password works
- [ ] Google OAuth works
- [ ] GitHub OAuth works
- [ ] JWT tokens are issued correctly
- [ ] Protected routes redirect to /auth
- [ ] Logout works

### OAuth Account Connection
- [ ] LinkedIn OAuth flow completes
- [ ] Twitter OAuth flow completes
- [ ] Connected accounts appear in dashboard
- [ ] Disconnect account works
- [ ] Can post using connected accounts

### Billing & Subscriptions
- [ ] Can view available plans
- [ ] Checkout session creates successfully
- [ ] Test card payment works
- [ ] Subscription activates after payment
- [ ] Webhook events are processed
- [ ] Customer portal opens correctly
- [ ] Subscription cancellation works
- [ ] Downgrade to free plan works

### Usage Limits
- [ ] Free plan limited to 10 posts/month
- [ ] Soft limit allows 2-3 extra posts
- [ ] Hard limit blocks after grace period
- [ ] Upgrade prompt shown when limit reached
- [ ] Pro plan has unlimited posts
- [ ] AI generation limits enforced
- [ ] Monthly usage resets correctly

### Multi-Tenancy & Data Isolation
- [ ] User A cannot see User B's posts
- [ ] User A cannot see User B's accounts
- [ ] User A cannot see User B's usage
- [ ] RLS policies prevent unauthorized access
- [ ] API endpoints filter by user_id

### General Functionality
- [ ] Landing page loads correctly
- [ ] Pricing displayed accurately
- [ ] All API endpoints respond correctly
- [ ] Error messages are clear
- [ ] UI is responsive (mobile/desktop)

---

## 🆘 Troubleshooting

### "Supabase not configured" error
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in `.env`
- Verify credentials are correct in `auth.html` and `dashboard.html`

### OAuth flow fails
- Check redirect URLs match exactly (including protocol and trailing slashes)
- Verify OAuth app is approved/published
- Check environment variables for client IDs and secrets

### Stripe webhook not working
- Verify webhook URL is correct
- Check webhook signing secret is set
- Test webhook using Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3000/api/billing/webhook
  ```

### "Invalid or expired token" error
- Token might have expired (check Supabase session duration)
- Ensure Authorization header format is correct: `Bearer <token>`
- Verify JWT is being passed from frontend

### Usage limits not enforcing
- Check if subscription exists for user
- Verify usage table has entries
- Check RLS policies allow access to usage table

---

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [LinkedIn OAuth Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Twitter OAuth 1.0a Guide](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)

---

## 🎉 Next Steps

After setting everything up:

1. **Test thoroughly** using the checklist above
2. **Add billing UI** to dashboard (usage indicators, upgrade modals)
3. **Enhance OAuth UI** in dashboard (connect/disconnect buttons)
4. **Add email notifications** for:
   - Welcome email
   - Usage limit warnings
   - Subscription changes
   - Payment failures
5. **Implement analytics** tracking (Google Analytics, Plausible)
6. **Add Terms of Service** and **Privacy Policy** pages
7. **Create API documentation** for Business plan users
8. **Set up monitoring** (error tracking, uptime monitoring)

---

## 💡 Tips

- **Use Test Mode** for Stripe during development
- **Use Test Cards**: Stripe provides test card numbers
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
- **Monitor Supabase Usage**: Free tier has limits
- **Set up alerts** for high error rates
- **Back up database** regularly
- **Use environment-specific configs** (dev/staging/prod)

---

Good luck with your SaaS launch! 🚀

