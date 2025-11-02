# OAuth Settings Checklist ✅

## 1. Facebook App Configuration (App ID: 2137952033706098)

### ✅ App Type
- [ ] App Type: **Business** (not Consumer)
- [ ] App Mode: Development (OK for testing)

### ✅ Products Enabled
- [ ] **Facebook Login** - Enabled and configured
- [ ] **Instagram Graph API** - Enabled

### ✅ Facebook Login Settings
- [ ] Client OAuth login: **Yes**
- [ ] Web OAuth login: **Yes**
- [ ] Enforce HTTPS: **Yes** (localhost is exception)
- [ ] Use Strict Mode for redirect URIs: **Yes**

### ✅ Valid OAuth Redirect URIs
Must include ALL of these:
- [ ] `http://localhost:3000/auth/facebook/callback`
- [ ] `http://localhost:3000/auth/instagram/callback`
- [ ] `https://capable-motivation-production-7a75.up.railway.app/auth/facebook/callback`
- [ ] `https://capable-motivation-production-7a75.up.railway.app/auth/instagram/callback`

### ✅ Permissions Requested
For Instagram posting, you need:
- [ ] `instagram_basic`
- [ ] `instagram_content_publish`
- [ ] `pages_show_list`
- [ ] `pages_read_engagement`

**Note:** In Development mode, these work without App Review for test users.

---

## 2. Instagram Account Requirements

### ✅ Instagram Account Type
- [ ] Instagram account is **Business** or **Creator** account
- [ ] NOT a personal account

### ✅ Facebook Page Linkage
- [ ] Instagram account is **linked to a Facebook Page**
- [ ] You have **Admin access** to that Facebook Page

**To check:**
1. Go to Instagram mobile app → Settings → Account → Linked Accounts
2. Should show Facebook Page linked

---

## 3. Environment Variables (.env)

### ✅ Required Variables
```env
# Facebook App (same app ID/Secret for both)
FACEBOOK_APP_ID=2137952033706098
FACEBOOK_APP_SECRET=your_app_secret_here

# Instagram (can use same as Facebook or separate)
INSTAGRAM_APP_ID=2137952033706098
INSTAGRAM_APP_SECRET=your_app_secret_here

# Redirect URIs
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback
```

### ✅ Verify Values
Run this to check:
```bash
node -e "require('dotenv').config(); console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID || 'MISSING'); console.log('INSTAGRAM_APP_ID:', process.env.INSTAGRAM_APP_ID || 'MISSING'); console.log('FACEBOOK_REDIRECT_URI:', process.env.FACEBOOK_REDIRECT_URI || 'MISSING'); console.log('INSTAGRAM_REDIRECT_URI:', process.env.INSTAGRAM_REDIRECT_URI || 'MISSING');"
```

---

## 4. Code Configuration ✅ (Already Fixed)

- ✅ Instagram OAuth uses Facebook Login flow (not Instagram Basic Display)
- ✅ OAuth URL: `https://www.facebook.com/v18.0/dialog/oauth` ✅
- ✅ Permissions requested correctly ✅
- ✅ Can use FACEBOOK_APP_ID if INSTAGRAM_APP_ID not set ✅

---

## 5. Quick Test

### Step 1: Verify Redirect URIs
In Facebook Developer Console:
- Go to: **Facebook Login → Settings**
- Scroll to: **"Valid OAuth Redirect URIs"**
- Check: Both localhost URLs are listed ✅

### Step 2: Test Connection
1. Start server: `npm start`
2. Go to: `http://localhost:3000/dashboard/settings`
3. Click: **"Connect Instagram"**
4. Should redirect to: **Facebook Login** (not Instagram Basic Display)
5. Grant permissions
6. Should redirect back successfully ✅

---

## Common Issues & Fixes

### ❌ Error: "Invalid platform app"
**Fix:** Make sure:
- Using Facebook Login OAuth (not Instagram Basic Display)
- localhost URLs added to Valid OAuth Redirect URIs
- App type is Business

### ❌ Error: "Redirect URI mismatch"
**Fix:** 
- Add exact URL to Valid OAuth Redirect URIs
- Must match exactly (including http/https, port, path)

### ❌ Error: "Instagram account not found"
**Fix:**
- Instagram must be Business/Creator account
- Must be linked to Facebook Page
- You need admin access to that Page

### ❌ Error: "Invalid permissions"
**Fix:**
- Make sure permissions are requested in OAuth scope
- In development mode, add your Facebook user as admin/tester

---

## ✅ Final Checklist

Before testing, ensure:
1. [ ] All localhost URLs added to Valid OAuth Redirect URIs
2. [ ] Facebook Login product enabled
3. [ ] Instagram Graph API product enabled
4. [ ] .env file has correct App ID and Secret
5. [ ] Instagram account is Business/Creator
6. [ ] Instagram linked to Facebook Page
7. [ ] Server restarted after .env changes

**Ready to test!** 🚀


