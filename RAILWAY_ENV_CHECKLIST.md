# Railway Environment Variables Checklist

## ⚠️ REQUIRED for OAuth to Work

Check these in your Railway dashboard: https://railway.app/dashboard

### 1. OAUTH_STATE_SECRET (REQUIRED)
```
Variable: OAUTH_STATE_SECRET
Value: 81e83078e15ae349e50e28f617cb34acca527d9d4152a6da1dfe0fc98117a4bd
```

### 2. APP_URL (REQUIRED)
```
Variable: APP_URL
Value: https://capable-motivation-production-7a75.up.railway.app
```

### 3. LINKEDIN_CLIENT_ID (REQUIRED)
```
Variable: LINKEDIN_CLIENT_ID
Value: Your LinkedIn Client ID
```

### 4. LINKEDIN_CLIENT_SECRET (REQUIRED)
```
Variable: LINKEDIN_CLIENT_SECRET
Value: Your LinkedIn Client Secret
```

### 5. TWITTER_CLIENT_ID (REQUIRED)
```
Variable: TWITTER_CLIENT_ID
Value: Your Twitter Client ID
```

### 6. TWITTER_CLIENT_SECRET (REQUIRED)
```
Variable: TWITTER_CLIENT_SECRET
Value: Your Twitter Client Secret
```

### 7. SUPABASE_SERVICE_KEY (REQUIRED)
```
Variable: SUPABASE_SERVICE_KEY
Value: Your Supabase service role key
```
**Get this from**: https://supabase.com/dashboard → Project → Settings → API → service_role key

### 8. SUPABASE_URL (REQUIRED)
```
Variable: SUPABASE_URL
Value: https://gzchblilbthkfuxqhoyo.supabase.co
```

### 9. SUPABASE_ANON_KEY (REQUIRED)
```
Variable: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚨 Most Common Issue: Missing SUPABASE_SERVICE_KEY

If this is missing, OAuth callbacks will fail with "linkedin_failed" error.

**Get it from Supabase:**
1. Go to: https://supabase.com/dashboard/project/gzchblilbthkfuxqhoyo
2. Click **Settings** → **API**
3. Find **service_role** key
4. Copy and add to Railway as `SUPABASE_SERVICE_KEY`
