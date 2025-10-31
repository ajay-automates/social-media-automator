# Facebook Authorization Debugging Guide

## Current Issue
After clicking "Authorize Facebook account" button, the flow redirects to Facebook but doesn't work after authorization.

## What Should Happen

1. ✅ **Click Button** → Frontend calls `/api/auth/facebook/url`
2. ✅ **Redirect to Facebook** → User sees Facebook authorization page
3. ✅ **Click "Continue"** → Facebook redirects to `/auth/facebook/callback?code=...&state=...`
4. ❌ **Something Breaks Here** → Need to check what's happening

---

## Debug Steps

### 1. Check Browser Console (Frontend)

When you click the "Connect Facebook" button, check the browser console:

```javascript
// Should see:
🔑 Auth session: exists
📘 Facebook OAuth URL request...
// Then redirect to Facebook
```

**If you see errors:**
- `401 Unauthorized` → Auth token issue
- `500 Internal Server Error` → Server-side issue
- `Failed to generate Facebook OAuth URL` → Configuration issue

### 2. Check Server Console (Backend)

When you authorize on Facebook and get redirected back, check server logs:

**Success Flow:**
```
📘 Facebook OAuth callback received
  - Code: AQAV-...
  - State: eyJ1c2VySWQ...
  - Error: none
📘 Starting Facebook callback handler...
📘 Facebook OAuth callback for user: [userId]
📘 Step 1: Exchanging code for access token...
✅ Got user access token, expires in: 5183781
📘 Step 2: Getting user's Facebook Pages...
📘 Pages API response: {...}
✅ Found X Facebook Pages
✅ Saved Facebook Page: [Page Name]
✅ Facebook connected successfully: X Pages
```

**Error Flow:**
```
❌ Facebook OAuth error: [error message]
❌ Facebook callback error: [error details]
```

### 3. Common Errors & Solutions

#### Error: "No Facebook Pages found"
**Solution:** You need to create a Facebook Page first
1. Go to: https://www.facebook.com/pages/create
2. Create a Page (Business or Brand)
3. Make sure you're an Admin
4. Try connecting again

#### Error: "Invalid redirect_uri"
**Solution:** Check Facebook Developer Console
1. Go to: https://developers.facebook.com/apps/
2. Select your app → **Facebook Login** → **Settings**
3. Under **Valid OAuth Redirect URIs**, add:
   - `http://localhost:3000/auth/facebook/callback`
   - `https://your-domain.com/auth/facebook/callback` (if deployed)

#### Error: "Missing code or state"
**Solution:** Check the callback URL
- Make sure redirect URI matches exactly
- Check for any URL encoding issues

#### Error: "RLS policy violation"
**Fixed:** Code now uses `supabaseAdmin` to bypass RLS

---

## Quick Test

### Step 1: Check Redirect URI Configuration

Make sure this URL is in Facebook Developer Console:
```
http://localhost:3000/auth/facebook/callback
```

### Step 2: Test the Flow

1. **Open Browser Console** (F12)
2. **Click "Connect Facebook"**
3. **Check Console** for any errors
4. **Authorize on Facebook**
5. **After Redirect** - Check:
   - Server console logs
   - Browser console for errors
   - URL parameters (should have `?facebook=connected` or `?error=...`)

### Step 3: Check URL After Redirect

After Facebook redirects you back, check the URL:

**Success:**
```
http://localhost:3000/dashboard?facebook=connected
```

**Error:**
```
http://localhost:3000/dashboard?error=facebook_failed
http://localhost:3000/dashboard?error=facebook_no_pages
http://localhost:3000/dashboard?error=facebook_failed&message=No%20Facebook%20Pages%20found...
```

---

## What to Check

### ✅ Facebook Developer Console
1. **App ID:** `2137952033706098`
2. **Redirect URIs:**
   - `http://localhost:3000/auth/facebook/callback` ✓
   - `https://your-domain.com/auth/facebook/callback` (if deployed)
3. **Permissions:**
   - `pages_show_list` ✓

### ✅ Environment Variables
Check your `.env` file:
```env
FACEBOOK_APP_ID=2137952033706098
FACEBOOK_APP_SECRET=your_secret_here
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
```

### ✅ Server Endpoints
- `/api/auth/facebook/url` → Generate OAuth URL ✓
- `/auth/facebook/callback` → Handle callback ✓

---

## Debugging Commands

### Check if Server is Running
```bash
curl http://localhost:3000/api/health
```

### Test OAuth URL Generation
```bash
# Should return OAuth URL if authenticated
curl -X POST http://localhost:3000/api/auth/facebook/url \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Facebook Pages Directly
After getting access token, test:
```bash
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_TOKEN"
```

---

## Still Not Working?

Share these details:
1. **Browser Console Errors** (screenshot or copy/paste)
2. **Server Console Logs** (when you click authorize)
3. **URL After Redirect** (what URL do you see?)
4. **Error Message** (if any)

Then we can debug further! 🔍

