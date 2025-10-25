# 🗄️ Supabase Setup - Step by Step Guide

## 🎯 What You'll Get
- ✅ User authentication (Email/Password, Google, GitHub)
- ✅ PostgreSQL database with multi-tenant isolation
- ✅ Row Level Security (RLS) for data protection
- ✅ 4 new tables: `user_accounts`, `subscriptions`, `usage`, updated `posts`

---

## 📝 Step 1: Create Supabase Project (5 mins)

### 1.1 Sign Up / Log In
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign in with GitHub (recommended) or email

### 1.2 Create New Project
1. Click **"New Project"**
2. Fill in:
   - **Name:** `social-media-automator` (or your choice)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to you (e.g., `us-east-1`)
   - **Pricing Plan:** Select **Free** (includes auth, database, 500MB storage)
3. Click **"Create new project"**
4. ⏳ Wait 2-3 minutes for database to provision

---

## 🔐 Step 2: Enable Authentication Providers (5 mins)

### 2.1 Enable Email Authentication
1. In left sidebar, click **Authentication** → **Providers**
2. Find **Email** provider
3. Make sure it's **enabled** (should be by default)
4. ✅ Done!

### 2.2 Enable Google OAuth (Optional but Recommended)

#### A. Create Google OAuth App
1. Go to **https://console.cloud.google.com/**
2. Create new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if needed:
   - User Type: **External**
   - App name: `Social Media Automator`
   - Support email: Your email
   - Save
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Supabase Auth`
   - Authorized redirect URIs: (get from Supabase - see below)
7. Copy **Client ID** and **Client Secret**

#### B. Configure in Supabase
1. Back in Supabase, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Google provider** ON
4. You'll see a **Callback URL** like:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
5. Copy this URL
6. Go back to Google Cloud Console
7. Add this URL to **Authorized redirect URIs**
8. Save in Google Console
9. Return to Supabase and paste:
   - **Client ID** from Google
   - **Client Secret** from Google
10. Click **Save**

### 2.3 Enable GitHub OAuth (Optional but Recommended)

#### A. Create GitHub OAuth App
1. Go to **https://github.com/settings/developers**
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** `Social Media Automator`
   - **Homepage URL:** `http://localhost:3000` (for now)
   - **Authorization callback URL:** Get from Supabase (see below)
4. Copy **Client ID**
5. Click **Generate a new client secret**
6. Copy **Client Secret**

#### B. Configure in Supabase
1. In Supabase, go to **Authentication** → **Providers**
2. Find **GitHub** and click to expand
3. Toggle **Enable GitHub provider** ON
4. You'll see a **Callback URL** like:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
5. Copy this URL and paste into GitHub OAuth App settings
6. Return to Supabase and paste:
   - **Client ID** from GitHub
   - **Client Secret** from GitHub
7. Click **Save**

---

## 🗄️ Step 3: Run Database Migration (3 mins)

### 3.1 Open SQL Editor
1. In Supabase dashboard, click **SQL Editor** in left sidebar
2. Click **New Query** button

### 3.2 Copy Migration SQL
1. Open the file: `migrations/002_multi_tenant.sql` in your project
2. Copy **ALL** contents (Ctrl/Cmd + A, then Ctrl/Cmd + C)

### 3.3 Run Migration
1. Paste into Supabase SQL Editor
2. Click **Run** button (or press Ctrl/Cmd + Enter)
3. ⏳ Wait a few seconds
4. You should see: **"Success. No rows returned"** (this is good!)

### 3.4 Verify Tables Created
Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'user_accounts', 'subscriptions', 'usage');
```

You should see 4 tables listed:
- ✅ posts
- ✅ user_accounts
- ✅ subscriptions
- ✅ usage

### 3.5 Verify RLS Policies
Run this to check security policies:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

You should see 4 policies:
- ✅ Users see own posts
- ✅ Users see own accounts
- ✅ Users see own subscription
- ✅ Users see own usage

---

## 🔑 Step 4: Get Your Credentials (2 mins)

### 4.1 Get API Keys
1. Click **Settings** (gear icon) in left sidebar
2. Click **API** in settings menu
3. You'll see:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **Project API keys:**
   - **anon (public):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)
   - **service_role (secret):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (different long string)

4. Copy these three values:
   - ✅ Project URL
   - ✅ anon key (labeled as "anon public")
   - ✅ service_role key (labeled as "service_role secret")

### 4.2 IMPORTANT - Keep These Safe! 🔒
- ⚠️ **anon key** - Safe to use in browser (public)
- ⚠️ **service_role key** - NEVER expose in browser (keep secret!)
- ⚠️ Don't commit these to GitHub

---

## 🔧 Step 5: Update Your .env File (1 min)

Add these to your `.env` file:

```bash
# Supabase (✅ COMPLETE)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_key_here
```

Replace with your actual values from Step 4.1!

---

## 📄 Step 6: Update HTML Files (2 mins)

### 6.1 Update auth.html
Open `auth.html` and find these lines (around line 224-225):
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with:
```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here';
```

### 6.2 Update dashboard.html
Open `dashboard.html` and find these lines (around line 274-275):
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with the **same values** as above.

---

## ✅ Step 7: Configure Site URL (1 min)

### 7.1 Set Development URL
1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000`
3. Add to **Redirect URLs**:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth`
4. Click **Save**

### 7.2 Production URL (Do Later)
When you deploy, come back and add:
- Site URL: `https://your-railway-domain.up.railway.app`
- Redirect URLs:
  - `https://your-railway-domain.up.railway.app/dashboard`
  - `https://your-railway-domain.up.railway.app/auth`

---

## 🧪 Step 8: Test Authentication (5 mins)

### 8.1 Start Your Server
```bash
cd /Users/ajaykumarreddy/Desktop/PROJECTS/social-media-automator
npm start
```

### 8.2 Test Email Signup
1. Open browser: `http://localhost:3000`
2. Click **"Start Free"** or **"Login"**
3. Click **"Sign Up"** tab
4. Enter email and password
5. Click **"Create Account"**
6. ✅ You should see: "Account created! Please check your email..."

### 8.3 Check Email
1. Check your inbox
2. Click confirmation link in email from Supabase
3. Should redirect back to your app

### 8.4 Test Login
1. Go back to login page
2. Enter same email/password
3. Click **"Sign In"**
4. ✅ Should redirect to dashboard!

### 8.5 Test Google Login (if configured)
1. Go to auth page
2. Click **"Continue with Google"**
3. Select your Google account
4. ✅ Should redirect to dashboard!

### 8.6 Test GitHub Login (if configured)
1. Go to auth page
2. Click **"Continue with GitHub"**
3. Authorize the app
4. ✅ Should redirect to dashboard!

### 8.7 Verify in Supabase
1. Go to Supabase dashboard
2. Click **Authentication** → **Users**
3. ✅ You should see your user(s) listed!

---

## 🎉 Step 9: Verify Everything Works

### Test Checklist:
- [ ] Email signup works
- [ ] Confirmation email received
- [ ] Email login works
- [ ] Redirects to dashboard after login
- [ ] User email shows in dashboard header
- [ ] Plan badge shows "FREE"
- [ ] Logout works
- [ ] Can't access dashboard without login
- [ ] Google login works (if configured)
- [ ] GitHub login works (if configured)

---

## 🐛 Troubleshooting

### "Invalid login credentials"
- Check that email is confirmed (click link in email)
- Try resetting password

### "Supabase not configured" error
- Verify SUPABASE_URL and SUPABASE_ANON_KEY in .env
- Verify same values in auth.html and dashboard.html
- Restart server after updating .env

### Can't access dashboard
- Check browser console for errors (F12)
- Verify you're logged in (check Supabase Users panel)
- Clear browser cache and cookies

### Google OAuth redirect error
- Verify redirect URI matches exactly in Google Console
- Check Site URL in Supabase URL Configuration

### GitHub OAuth error
- Verify callback URL matches in GitHub OAuth app
- Check that app is not in suspended state

### Database migration errors
- Make sure you copied the ENTIRE migration file
- Check for any syntax errors in the SQL
- Try running sections one at a time

---

## 📊 Your Supabase Setup Status

After completing this guide, you should have:

| Feature | Status |
|---------|--------|
| ✅ PostgreSQL Database | Ready |
| ✅ User Authentication | Enabled |
| ✅ Email/Password | Working |
| ✅ Google OAuth | Optional |
| ✅ GitHub OAuth | Optional |
| ✅ 4 Tables Created | Done |
| ✅ RLS Policies | Active |
| ✅ Multi-tenant Isolation | Enabled |
| ✅ Auto-subscriptions | Configured |

---

## 🎯 What's Next?

After Supabase is working:

1. **Generate Session Secret** (1 min)
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Add to `.env`:
   ```bash
   SESSION_SECRET=<generated_value>
   ```

2. **Set up LinkedIn OAuth** (15 mins)
   - For user account connection feature
   - See `SAAS_SETUP_GUIDE.md` for details

3. **Set up Twitter OAuth** (15 mins)
   - For user account connection feature
   - See `SAAS_SETUP_GUIDE.md` for details

4. **Test all features locally** (30 mins)
   - Create posts
   - Test usage limits
   - Test upgrade modal
   - Test AI generation

5. **Deploy to Railway** (10 mins)
   - Update environment variables
   - Update OAuth redirect URLs
   - Test production!

---

## 💡 Pro Tips

- **Free Tier Limits:** 500MB database, 50,000 monthly active users
- **Email Settings:** Customize email templates in Authentication → Email Templates
- **Monitoring:** Check Database → Reports for performance metrics
- **Backups:** Free tier includes daily backups (7 days retention)
- **Use RLS:** Never disable Row Level Security in production!

---

## 🆘 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **Check our guides:** `SAAS_SETUP_GUIDE.md` and `IMPLEMENTATION_COMPLETE.md`

---

**All done? Test it out and let me know if you hit any issues! 🚀**

