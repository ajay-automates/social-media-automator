# 🚀 Quick Start Guide

Get your Social Media Automator up and running in 5 minutes!

## Prerequisites

- Node.js v20+
- npm or yarn
- Git
- A Supabase account
- Social media accounts to connect

## 1. Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/social-media-automator.git
cd social-media-automator

# Install backend dependencies
npm install

# Install dashboard dependencies
cd dashboard
npm install
cd ..
```

## 2. Configure Environment (2 minutes)

```bash
# Copy the environment template
cp ENV_TEMPLATE.txt .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

**Minimum required variables:**
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Session
SESSION_SECRET=random_secure_string_here
```

See [Environment Setup](environment-setup.md) for complete configuration.

## 3. Setup Database (1 minute)

1. Go to your Supabase dashboard
2. Open SQL Editor
3. Run migrations in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_multi_tenant.sql`
   - `migrations/003_fix_signup_trigger.sql`
   - `migrations/004_add_user_credentials.sql`
   - `migrations/005_add_telegram_support.sql`
   - `migrations/006_add_instagram_platform.sql`
   - `migrations/007_add_facebook_platform.sql`
   - `migrations/007_add_post_templates.sql`

## 4. Build & Start (30 seconds)

```bash
# Build the React dashboard
cd dashboard
npm run build
cd ..

# Start the server
npm start
```

Your app should now be running at `http://localhost:3000`

## 5. First Login

1. Open `http://localhost:3000`
2. Click "Get Started" or go to `/auth.html`
3. Sign up with email/password or OAuth
4. You'll be redirected to the dashboard

## 6. Connect Your First Platform

1. Go to **Settings** tab
2. Click **"Connect LinkedIn"** (or any platform)
3. Complete the OAuth flow
4. Your account is now connected!

## 7. Make Your First Post

1. Go to **Create Post** tab
2. Write some text
3. Select platforms
4. Click **"Post Now"**
5. 🎉 Your post is live!

---

## What's Next?

### Connect More Platforms
- [LinkedIn Setup](../platforms/linkedin.md)
- [Twitter Setup](../platforms/twitter.md)
- [Telegram Setup](../platforms/telegram.md)
- [Instagram Setup](../platforms/instagram.md)

### Enable AI Features
- [AI Caption Generation](../features/ai-generation.md) - Get Claude AI to write for you
- [AI Image Generation](../features/ai-generation.md#image-generation) - Create visuals with Stability AI

### Setup Billing
- [Billing & Pricing](../features/billing-pricing.md) - Configure Stripe for monetization

### Advanced Features
- [Post Templates](../features/templates.md) - Save and reuse content
- [Bulk Scheduling](../deployment/testing-guide.md#bulk-upload) - Upload CSV files
- [API Access](../deployment/api-reference.md) - Integrate with other tools

---

## Troubleshooting

### "Cannot connect to database"
- Check your `SUPABASE_URL` and keys in `.env`
- Ensure migrations are run in Supabase

### "OAuth redirect error"
- Check redirect URIs in platform developer consoles
- Match exactly with your app URL

### "Dashboard is blank"
- Run `cd dashboard && npm run build`
- Check browser console for errors
- Ensure React build files are in `dashboard/dist/`

### Need more help?
- See [Testing Guide](../deployment/testing-guide.md)
- Check [Platform Status](../deployment/platform-status.md)
- Review [Project Overview](project-overview.md)

---

**Time to first post: ~5 minutes** ⚡  
**Difficulty: Beginner-friendly** ✅

