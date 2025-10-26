# 🔧 OAuth Fix Instructions

## 🚨 **Current Issues**

### Issue 1: LinkedIn - "redirect_uri does not match"
**Error**: "The redirect_uri does not match the registered value"

**Root Cause**: The callback URL in your LinkedIn app settings doesn't match what the server is sending.

### Issue 2: Twitter - Callback completes but nothing happens
**Problem**: After authorizing on Twitter, redirects back but nothing happens.

**Root Cause**: Callback endpoint might be failing silently or not redirecting properly.

---

## ✅ **SOLUTION: Fix LinkedIn Redirect URI**

### Step 1: Get Your Current Callback URL

Your app is generating this callback URL:
```
https://capable-motivation-production-7a75.up.railway.app/auth/linkedin/callback
```

### Step 2: Add This Exact URL to LinkedIn App

1. Go to https://www.linkedin.com/developers/apps
2. Click on your app
3. Go to "Auth" tab
4. Under "Authorized redirect URLs for your app"
5. Click "Add redirect URL"
6. Add this EXACT URL (copy and paste):
   ```
   https://capable-motivation-production-7a75.up.railway.app/auth/linkedin/callback
   ```
7. Click "Update"

### Step 3: Important - NO TRAILING SLASH
Make sure the URL in LinkedIn is **EXACTLY**:
```
https://capable-motivation-production-7a75.up.railway.app/auth/linkedin/callback
```

NOT:
```
https://capable-motivation-production-7a75.up.railway.app/auth/linkedin/callback/
```

---

## ✅ **SOLUTION: Fix Twitter Redirect URI**

### Step 1: Get Your Current Callback URL

Your app is generating this callback URL:
```
https://capable-motivation-production-7a75.up.railway.app/auth/twitter/callback
```

### Step 2: Add This Exact URL to Twitter App

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Click on your app
3. Go to "App Settings" → "User authentication settings"
4. Under "Callback URI / Redirect URL"
5. Add this EXACT URL:
   ```
   https://capable-motivation-production-7a75.up.railway.app/auth/twitter/callback
   ```
6. Click "Save"

### Step 3: Check Twitter Logs

After trying to connect, check Railway logs to see what's happening:
1. Go to Railway dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for messages starting with `🐦`

---

## 📋 **Quick Checklist**

- [ ] LinkedIn callback URL added in LinkedIn Developers Portal
- [ ] Twitter callback URL added in Twitter Developer Portal
- [ ] No trailing slashes in callback URLs
- [ ] Railway environment variables are set:
  - [ ] `LINKEDIN_CLIENT_ID`
  - [ ] `LINKEDIN_CLIENT_SECRET`
  - [ ] `TWITTER_CLIENT_ID`
  - [ ] `TWITTER_CLIENT_SECRET`
  - [ ] `APP_URL`
  - [ ] `OAUTH_STATE_SECRET`

---

## 🧪 **Testing After Fix**

### Test LinkedIn:
1. Go to your dashboard
2. Click "Connect LinkedIn"
3. You should see "Redirecting to LinkedIn..." alert
4. LinkedIn should show authorization page (NO error)
5. Click "Allow"
6. Should redirect back to dashboard with success message

### Test Twitter:
1. Go to your dashboard
2. Click "Connect Twitter"
3. You should see "Redirecting to Twitter..." alert
4. Twitter should show authorization page
5. Click "Authorize app"
6. Should redirect back to dashboard with success message

---

## 🔍 **Debugging: Check Railway Logs**

1. Go to Railway dashboard
2. Click on your service
3. Click "Logs" tab
4. Watch for these messages:

**LinkedIn:**
```
🔗 LinkedIn OAuth URL generation:
  - Client ID: exists
  - Redirect URI: https://capable-motivation-production-7a75.up.railway.app/auth/linkedin/callback
```

**Twitter:**
```
🐦 Twitter OAuth URL generation:
  - Client ID: exists
  - Redirect URI: https://capable-motivation-production-7a75.up.railway.app/auth/twitter/callback
```

If you see errors, they'll show what's wrong.

---

## ❌ **Common Mistakes**

1. **Trailing slash**: `https://...app/auth/linkedin/callback/` ❌
   - Should be: `https://...app/auth/linkedin/callback` ✅

2. **HTTP instead of HTTPS**: `http://...` ❌
   - Should be: `https://...` ✅

3. **Different domain**: Using localhost or staging URL ❌
   - Should be: Production Railway URL ✅

4. **Missing in app settings**: URL not added to LinkedIn/Twitter app ❌
   - Must be added to both platforms ✅

---

## 🎯 **After You Fix the URLs**

Once you add the correct callback URLs to LinkedIn and Twitter:

1. Wait 1-2 minutes for changes to propagate
2. Try connecting again
3. It should work!

**Let me know once you've added the callback URLs and I'll help test!**
