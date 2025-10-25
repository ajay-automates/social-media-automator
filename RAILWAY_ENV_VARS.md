# 🚂 Railway Environment Variables

## ⚠️ IMPORTANT: Add These to Railway Dashboard

Go to: https://railway.app → Your Project → Settings → Variables

---

## 🔑 **Required Environment Variables:**

```bash
# ✅ Supabase (Database & Auth)
SUPABASE_URL=https://gzchblilbthkfuxqhoyo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Y2hibGlsYnRoa2Z1eHFob3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDgzOTcsImV4cCI6MjA3Njg4NDM5N30.h85XUXsVvxYAdMA9odgO4W5RN1148MDOO86XhwgOnb8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Y2hibGlsYnRoa2Z1eHFob3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMwODM5NywiZXhwIjoyMDc2ODg0Mzk3fQ.BchwefyfskLrbrbPoSfT6lScJenacDQBs6VlFiGlA8g

# ✅ Twitter (For Posting)
TWITTER_API_KEY=6zRyP8xkbfOh8FaSTfnkuQUq9
TWITTER_API_SECRET=q2hKH0UmmXoaQZvZooihJqyUfKt7cUfqBKhD5XZ7rR2HAtdXVK

# ✅ Server Configuration
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_random_session_secret_here
```

---

## 📝 **How to Add Variables:**

### **Method 1: Railway Dashboard (Recommended)**
1. Go to https://railway.app
2. Click on your project
3. Click "Variables" tab
4. Click "New Variable"
5. Copy-paste each variable name and value
6. Click "Add"
7. Repeat for all variables

### **Method 2: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Add variables
railway variables set SUPABASE_URL="https://gzchblilbthkfuxqhoyo.supabase.co"
railway variables set SUPABASE_ANON_KEY="eyJhbGc..."
# ... add all others
```

---

## 🟡 **Optional Variables (Add Later):**

```bash
# For AI Caption Generation
ANTHROPIC_API_KEY=sk-ant-your_key_here

# For Stripe Billing
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
STRIPE_PRO_MONTHLY_PRICE_ID=price_your_id_here
STRIPE_PRO_ANNUAL_PRICE_ID=price_your_id_here
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_your_id_here
STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_your_id_here

# For LinkedIn OAuth (when ready)
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here

# For Twitter OAuth (when ready)
TWITTER_CONSUMER_KEY=your_consumer_key_here
TWITTER_CONSUMER_SECRET=your_consumer_secret_here
```

---

## ✅ **After Adding Variables:**

1. Railway will automatically redeploy
2. Wait 2-3 minutes for deployment
3. Check deployment logs for errors
4. Test your production URL: https://capable-motivation-production-7a75.up.railway.app
5. Try logging in and posting!

---

## 🔍 **Verify Deployment:**

```bash
# Check if server is running
curl https://capable-motivation-production-7a75.up.railway.app/api/health

# Should return:
# {"status":"running","database":"connected","message":"🚀 Social Media Automator is live!"}
```

---

## 🐛 **Troubleshooting:**

### **Database not connected?**
- Check SUPABASE_URL is correct
- Check SUPABASE_SERVICE_ROLE_KEY is correct
- Verify Supabase project is running

### **Authentication not working?**
- Check SUPABASE_ANON_KEY is set
- Update auth.html and dashboard.html with Supabase URL (if needed)

### **Twitter not posting?**
- Check TWITTER_API_KEY and TWITTER_API_SECRET are set
- Verify Twitter credentials are in Supabase user_accounts table

---

## 🎉 **You're All Set!**

Once variables are added:
- ✅ Your app will be live at: https://capable-motivation-production-7a75.up.railway.app
- ✅ Users can sign up
- ✅ Users can post to LinkedIn & Twitter
- ✅ All features working!

**Go add those variables and you're live! 🚀**

