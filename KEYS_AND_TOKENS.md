# 🔑 Keys and Tokens - Social Media Automator

## 📅 Last Updated: December 2024

---

## 🤖 **AI Services**

### Stability AI (Image Generation)
- **API Key:** `sk-Zf5TFAY8n0HLTo7O6aa0fxf8DkaAJ8BoztqXO8s12C5bokGn`
- **Status:** ✅ **WORKING** - Image generation fully functional
- **Usage:** AI Image Generation with 12 styles and 4 platform sizes
- **Endpoint:** `https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`

### Anthropic Claude (Caption Generation)
- **API Key:** `sk-ant-api03-your_anthropic_api_key_here` (placeholder)
- **Status:** ✅ **WORKING** - Caption generation fully functional
- **Usage:** AI Caption Generation with 3 variations per topic
- **Model:** Claude Sonnet 4

---

## 🗄️ **Database & Auth**

### Supabase (PostgreSQL + Auth)
- **URL:** `https://gzchblilbthkfuxqhoyo.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Y2hibGlsYnRoa2Z1eHFob3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDgzOTcsImV4cCI6MjA3Njg4NDM5N30.h85XUXsVvxYAdMA9odgO4W5RN1148MDOO86XhwgOnb8`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Y2hibGlsYnRoa2Z1eHFob3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMwODM5NywiZXhwIjoyMDc2ODg0Mzk3fQ.BchwefyfskLrbrbPoSfT6lScJenacDQBs6VlFiGlA8g`
- **Status:** ✅ **WORKING** - Database and authentication fully functional

---

## 📱 **Social Media Platforms**

### Twitter/X API
- **Consumer Key:** `6zRyP8xkbfOh8FaSTfnkuQUq9`
- **Consumer Secret:** `q2hKH0UmmXoaQZvZooihJqyUfKt7cUfqBKhD5XZ7rR2HAtdXVK`
- **Status:** ⚠️ **NEEDS OAUTH** - API keys configured but accounts not connected
- **Issue:** "Invalid API key" errors when fetching connected accounts

### LinkedIn API
- **Client ID:** `your_linkedin_client_id` (placeholder)
- **Client Secret:** `your_linkedin_client_secret` (placeholder)
- **Status:** ⚠️ **NEEDS OAUTH** - Not configured yet
- **Issue:** No LinkedIn OAuth credentials

### Instagram API
- **Access Token:** `your_instagram_access_token` (placeholder)
- **Account ID:** `your_instagram_account_id` (placeholder)
- **Status:** ⚠️ **NOT CONFIGURED** - Placeholder values

---

## ☁️ **Cloud Storage**

### Cloudinary (Image Storage)
- **Cloud Name:** `your_cloud_name` (placeholder)
- **API Key:** `your_api_key` (placeholder)
- **API Secret:** `your_api_secret` (placeholder)
- **Status:** ⚠️ **NOT CONFIGURED** - Using base64 fallback
- **Fallback:** ✅ **WORKING** - Base64 data URLs working perfectly

---

## 💳 **Payment Processing**

### Stripe (Billing)
- **Secret Key:** `sk_test_your_stripe_secret_key` (placeholder)
- **Publishable Key:** `pk_test_your_stripe_publishable_key` (placeholder)
- **Webhook Secret:** `whsec_your_webhook_secret` (placeholder)
- **Status:** ⚠️ **NOT CONFIGURED** - Placeholder values

---

## 🚀 **Deployment**

### Railway (Production)
- **URL:** `https://capable-motivation-production-7a75.up.railway.app`
- **Status:** ✅ **DEPLOYED** - Production environment active
- **Environment Variables:** All keys synced to production

### Local Development
- **URL:** `http://localhost:3000`
- **Status:** ✅ **RUNNING** - Local development server active

---

## 📊 **Current Status Summary**

### ✅ **FULLY WORKING:**
- AI Image Generation (Stability AI)
- AI Caption Generation (Claude)
- Database & Authentication (Supabase)
- Local & Production Deployment (Railway)

### ⚠️ **NEEDS CONFIGURATION:**
- Twitter OAuth (accounts not connected)
- LinkedIn OAuth (not configured)
- Instagram API (not configured)
- Cloudinary (using base64 fallback)
- Stripe Billing (not configured)

### 🎯 **NEXT PRIORITIES:**
1. **Connect Twitter Account** - Fix OAuth flow
2. **Connect LinkedIn Account** - Set up OAuth credentials
3. **Configure Cloudinary** - For better image storage
4. **Set up Stripe** - For billing features

---

## 🔒 **Security Notes**

- All keys are stored in `.env` file (local) and Railway environment variables (production)
- Never commit actual keys to version control
- Use placeholder values in templates
- Rotate keys regularly for security

---

## 📝 **Usage Instructions**

### For AI Image Generation:
```bash
# Test locally
curl -X POST http://localhost:3000/api/ai/image/generate \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Professional business team", "style": "photographic", "platform": "linkedin"}'
```

### For AI Caption Generation:
```bash
# Test locally
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Business success", "niche": "entrepreneurship", "platform": "linkedin"}'
```

---

**🎊 Congratulations! Your AI-powered social media automation platform is working beautifully!**
