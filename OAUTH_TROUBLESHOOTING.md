# OAuth Troubleshooting Guide

## 🚨 Quick Fix Checklist

### Both LinkedIn & Twitter Need Registered Callback URLs

Your app is hosted at: `https://capable-motivation-production-7a75.up.railway.app`

---

## 🔗 LinkedIn Setup (2 minutes)

### Step 1: Add Callback URL
1. Go to: https://www.linkedin.com/developers/apps
2. Click your app
3. Go to **"Auth"** tab
4. Under **"Authorized redirect URLs"**
5. Click **"Add redirect URL"**
6. Paste EXACTLY this (no trailing slash):
   ```
   https://capable-motivation-production-7a75.up.railway.app/auth/linkedin/callback
   ```
7. Click **"Update"**

### Step 2: Verify Environment Variables in Railway
- `LINKEDIN_CLIENT_ID` - your LinkedIn app Client ID
- `LINKEDIN_CLIENT_SECRET` - your LinkedIn app Client Secret
- `APP_URL` - `https://capable-motivation-production-7a75.up.railway.app`
- `OAUTH_STATE_SECRET` - `81e83078e15ae349e50e28f617cb34acca527d9d4152a6da1dfe0fc98117a4bd`

---

## 🐦 Twitter/X Setup (2 minutes)

### Step 1: Add Callback URL
1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Click your app
3. Go to **"App Settings"** → **"User authentication settings"**
4. Under **"Callback URI / Redirect URL"**
5. Click **"Add URI"**
6. Paste EXACTLY this (no trailing slash):
   ```
   https://capable-motivation-production-7a75.up.railway.app/auth/twitter/callback
   ```
7. Click **"Save"**

### Step 2: Verify Environment Variables in Railway
- `TWITTER_CLIENT_ID` - your Twitter app Client ID
- `TWITTER_CLIENT_SECRET` - your Twitter app Client Secret
- `APP_URL` - `https://capable-motivation-production-7a75.up.railway.app`
- `OAUTH_STATE_SECRET` - `81e83078e15ae349e50e28f617cb34acca527d9d4152a6da1dfe0fc98117a4bd`

---

## 🧪 Testing After Setup

1. **Wait 1-2 minutes** for LinkedIn/Twitter settings to propagate
2. Go to your dashboard: https://capable-motivation-production-7a75.up.railway.app/dashboard
3. Click **"Connect LinkedIn"** button
4. You should be redirected to LinkedIn authorization page
5. Click **"Allow"**
6. Should redirect back to dashboard with success message
7. Repeat for **Twitter**

---

## ❌ Common Errors & Solutions

### "redirect_uri does not match"
**Problem**: Callback URL not registered in LinkedIn/Twitter app  
**Solution**: Add the exact callback URL (see steps above)

### "State expired"
**Problem**: OAuth flow took too long or app restarted  
**Solution**: Try connecting again immediately

### "Invalid state"
**Problem**: State parameter corrupted  
**Solution**: Clear browser cookies and try again

### "Callback completes but nothing happens"
**Problem**: Callback URL mismatch or server error  
**Solution**: Check Railway logs for error messages

---

## 🔍 Checking Railway Logs

1. Go to: https://railway.app/dashboard
2. Click your service
3. Click **"Logs"** tab
4. Look for messages starting with `🔗` (LinkedIn) or `🐦` (Twitter)

---

## ✅ After Fixes Applied

- Wait 2-3 minutes for changes to propagate
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Try connecting again
- Check logs if still failing

