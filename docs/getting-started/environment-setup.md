# ⚙️ Environment Setup

Complete guide to configuring environment variables for all features.

## Quick Setup

```bash
# Copy the template
cp ENV_TEMPLATE.txt .env

# Edit with your credentials
nano .env
```

---

## 🔑 Required Variables

### Supabase (Database & Auth)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Where to find:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy Project URL and keys

**Note:** `SERVICE_ROLE_KEY` is secret - never expose in frontend!

### Session Secret

```env
SESSION_SECRET=your_random_secure_string_here
```

**Generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 Platform OAuth Credentials

### LinkedIn

```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

**Setup:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/auth/linkedin/callback`
4. Copy Client ID and Secret

[Full Guide →](../platforms/linkedin.md)

### Twitter/X

```env
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

**Setup:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Add callback: `http://localhost:3000/auth/twitter/callback`

[Full Guide →](../platforms/twitter.md)

### Instagram (via Facebook)

```env
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback
```

**Note:** Instagram uses Facebook Login. Same App ID/Secret.

[Full Guide →](../platforms/instagram.md)

### Facebook

```env
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
```

[Full Guide →](../platforms/facebook.md)

### YouTube

```env
YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret
```

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Enable YouTube Data API v3
4. Add redirect: `http://localhost:3000/auth/youtube/callback`

[Full Guide →](../platforms/youtube.md)

### TikTok

```env
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
```

[Full Guide →](../platforms/tiktok.md)

### OAuth State Encryption

```env
OAUTH_STATE_SECRET=your_32_byte_hex_string
```

**Generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🤖 AI Services (Optional)

### Anthropic Claude (AI Captions)

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**Get API key:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Add to `.env`

**Cost:** ~$0.01 per 1000 captions

[Full Guide →](../features/ai-generation.md)

### Stability AI (Image Generation)

```env
STABILITY_API_KEY=sk-xxxxx
```

**Get API key:**
1. Go to [Stability AI Platform](https://platform.stability.ai/)
2. Create an API key
3. Add to `.env`

**Cost:** ~$0.04 per image

[Full Guide →](../features/ai-generation.md#image-generation)

---

## 📦 Storage (Required for Media)

### Cloudinary

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Or use Cloudinary URL:**
```env
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

**Get credentials:**
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy from Settings → Access Keys

**Free tier:** 25GB storage, 25GB bandwidth/month

---

## 💳 Stripe (Optional - for billing)

### Stripe Keys

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Price IDs

```env
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_xxxxx
```

**Setup:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys from Developers → API keys
3. Create products and get price IDs
4. Setup webhook endpoint for `/api/billing/webhook`

[Full Guide →](../features/billing-pricing.md)

---

## 🌍 Application URLs

### Local Development

```env
APP_URL=http://localhost:3000
BASE_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

### Production

```env
APP_URL=https://your-domain.com
BASE_URL=https://your-domain.com
PORT=3000
NODE_ENV=production
```

**Important:** Update all OAuth redirect URIs when deploying!

---

## ✅ Complete Example (.env)

```env
# ====================================================================================
# SUPABASE
# ====================================================================================
SUPABASE_URL=https://gzchblilbthkfuxqhoyo.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ====================================================================================
# SESSION
# ====================================================================================
SESSION_SECRET=81e83078e15ae349e50e28f617cb34acca527d9d4152a6da1dfe0fc98117a4bd
OAUTH_STATE_SECRET=81e83078e15ae349e50e28f617cb34acca527d9d4152a6da1dfe0fc98117a4bd

# ====================================================================================
# OAUTH PLATFORMS
# ====================================================================================
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback

YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret

TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# ====================================================================================
# AI SERVICES (Optional)
# ====================================================================================
ANTHROPIC_API_KEY=sk-ant-xxxxx
STABILITY_API_KEY=sk-xxxxx

# ====================================================================================
# CLOUDINARY
# ====================================================================================
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# ====================================================================================
# STRIPE (Optional)
# ====================================================================================
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_xxxxx

# ====================================================================================
# APPLICATION
# ====================================================================================
APP_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

---

## 🧪 Verify Configuration

Run this command to check which variables are set:

```bash
node -e "require('dotenv').config(); console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗'); console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗'); console.log('LINKEDIN_CLIENT_ID:', process.env.LINKEDIN_CLIENT_ID ? '✓' : '✗'); console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✓' : '✗');"
```

---

## 🚨 Security Best Practices

1. **Never commit `.env` to git** ✅ (already in `.gitignore`)
2. **Use different keys for dev/prod**
3. **Rotate secrets regularly**
4. **Keep `SERVICE_ROLE_KEY` secret** - full database access!
5. **Use Railway/Vercel environment variables for production**

---

## 🔧 Troubleshooting

### "Missing environment variable"
- Check variable name spelling (case-sensitive)
- Restart server after editing `.env`
- Ensure no spaces around `=` sign

### OAuth redirect errors
- Update redirect URIs in all platform developer consoles
- Match exactly: `http://localhost:3000` vs `http://localhost:3000/`

### Database connection errors
- Verify Supabase URL and keys
- Check if project is paused in Supabase dashboard
- Ensure migrations are applied

---

**Next:** [Connect Your First Platform →](../platforms/linkedin.md)

