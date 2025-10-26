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

## 🚨 CRITICAL ISSUE: Wrong Variable Name!

**Your Railway has**: `SUPABASE_SERVICE_ROLE_KEY` ❌  
**Code expects**: `SUPABASE_SERVICE_KEY` ✅

### Fix:
1. In Railway, find `SUPABASE_SERVICE_ROLE_KEY`
2. Copy its value
3. Add a **NEW** variable called `SUPABASE_SERVICE_KEY` with same value
4. You can keep both (doesn't hurt) or delete the old one

**This mismatch is why OAuth is failing!**
