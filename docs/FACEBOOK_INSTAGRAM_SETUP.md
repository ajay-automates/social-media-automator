# Facebook & Instagram Setup Guide

## 📋 Current Status

### ✅ **OAuth Connection**
- Facebook OAuth connection **works** - users can connect their Facebook Pages
- Instagram OAuth connection **works** - users can connect their Instagram Business accounts
- Both use Facebook Login OAuth flow

### ⏳ **Posting Capability**
- **Status:** Awaiting Facebook App Review
- **Issue:** Missing `pages_read_engagement` and `pages_manage_posts` permissions
- **Action Taken:** App review submitted with business verification
- **Timeline:** Typically 7-14 days for approval

---

## 🚀 Setup Instructions

### Prerequisites
- Facebook account
- Facebook Page (for Facebook posting)
- Instagram Business or Creator account (for Instagram posting)
- Instagram account linked to a Facebook Page

### Step 1: Create Facebook App

1. Go to: https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Select **"Business"** as app type
4. Fill in app details:
   - **App Name:** Social Media Automator (or your choice)
   - **App Contact Email:** Your email
5. Click **"Create App"**

### Step 2: Add Instagram & Facebook Products

1. In your app dashboard, click **"Add Product"**
2. Add **"Instagram Graph API"** - Click **"Set Up"**
3. Add **"Facebook Login"** - Click **"Set Up"**

### Step 3: Configure OAuth Settings

1. Go to **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs:**
   ```
   http://localhost:3000/auth/facebook/callback
   http://localhost:3000/auth/instagram/callback
   https://your-domain.com/auth/facebook/callback
   https://your-domain.com/auth/instagram/callback
   ```

3. Go to **App Settings** → **Basic**
4. Add **Site URL:**
   ```
   http://localhost:3000
   ```
   (or your production domain)

### Step 4: Request Permissions (App Review)

1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - `pages_read_engagement` - Required for posting
   - `pages_manage_posts` - Required for posting
3. Fill out submission forms:
   - **Use Case:** "Post content to Facebook Pages and Instagram accounts"
   - **How it works:** "Users connect their Facebook Pages and Instagram accounts, then my app posts content they create to their Pages/accounts on their behalf"
   - **Privacy Policy URL:** (Required - add yours)
4. Submit for review

### Step 5: Business Verification

Facebook may require business verification:
1. Go to **Meta Business Suite** → **Business Settings**
2. Complete business verification if requested
3. Upload required documents (bank statement, utility bill, etc.)
4. Wait for verification approval

---

## 🔧 Environment Variables

Add to your `.env` file:

```env
# Facebook OAuth (same app ID for both Facebook and Instagram)
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback

# Instagram OAuth (uses same app as Facebook)
INSTAGRAM_APP_ID=your_app_id_here  # Same as FACEBOOK_APP_ID
INSTAGRAM_APP_SECRET=your_app_secret_here  # Same as FACEBOOK_APP_SECRET
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback
```

---

## ✅ After App Review Approval

Once permissions are approved:

1. **Update OAuth Scope:**
   - Facebook: Add `pages_manage_posts,pages_read_engagement` to scope
   - Instagram: Add `pages_read_engagement` to scope

2. **Reconnect Accounts:**
   - Users need to disconnect and reconnect Facebook/Instagram
   - This will grant the new permissions

3. **Test Posting:**
   - Facebook: Should be able to post to Pages
   - Instagram: Should be able to post images/Reels

---

## 🧪 Testing (Before App Review)

For testing before app review approval:

### Option 1: Graph API Explorer
1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app
3. Get User Access Token with all permissions
4. Test posting manually

### Option 2: Manual Token
- Generate token with permissions manually
- Use in your app temporarily for testing
- Replace with proper OAuth tokens after approval

---

## 📚 Useful Links

- **Facebook App Dashboard:** https://developers.facebook.com/apps/
- **App Review:** https://developers.facebook.com/docs/app-review
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer/
- **Permissions Reference:** https://developers.facebook.com/docs/permissions/reference
- **Instagram Graph API:** https://developers.facebook.com/docs/instagram-api

---

## ⚠️ Important Notes

- **Facebook and Instagram share the same app** - Use same App ID for both
- **Both require app review** for posting permissions
- **Business verification may be required** for certain permissions
- **Timeline:** 7-14 days for app review approval
- **Workaround:** Use Graph API Explorer for testing before approval

---

**Status:** OAuth connection ✅ | Posting ⏳ (pending app review)

