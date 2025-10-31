# Instagram API Setup Guide

This guide will walk you through getting your Instagram credentials for the Social Media Automator.

## 📋 Prerequisites

- A Facebook account
- An Instagram Business or Creator account (not personal)
- Your Instagram account must be connected to a Facebook Page

---

## 🚀 Step-by-Step Setup

### Step 1: Convert to Instagram Business/Creator Account

1. Open Instagram app on your phone
2. Go to **Settings** → **Account**
3. Select **Switch to Professional Account**
4. Choose **Business** or **Creator**
5. Follow the prompts to complete setup

### Step 2: Connect Instagram to Facebook Page

1. In Instagram settings, go to **Account** → **Linked Accounts**
2. Select **Facebook**
3. Connect to a Facebook Page (create one if needed)
4. Make sure the connection is successful

---

### Step 3: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** as app type
4. Fill in app details:
   - **App Name**: Social Media Automator (or your choice)
   - **App Contact Email**: Your email
5. Click **Create App**

### Step 4: Add Instagram Graph API

1. In your app dashboard, click **Add Product**
2. Find **Instagram** and click **Set Up**
3. Go to **Instagram** → **Basic Display** or **Instagram Graph API**
4. Click **Create New App**

### Step 5: Configure App Settings

1. Go to **App Settings** → **Basic**
2. Add **App Domains**: `localhost` (for testing)
3. Add **Privacy Policy URL** (required for production)
4. Save changes

### Step 6: Get Access Token

#### Option A: Using Graph API Explorer (Easiest)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click **Generate Access Token**
4. Add these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
5. Click **Generate Access Token**
6. Copy the token (this is a short-lived token)

#### Option B: Get Long-Lived Token (Recommended)

**Convert short-lived token to long-lived (60 days):**

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

Replace:
- `YOUR_APP_ID`: From App Settings → Basic
- `YOUR_APP_SECRET`: From App Settings → Basic (Show button)
- `YOUR_SHORT_LIVED_TOKEN`: Token from Graph API Explorer

**Response:**
```json
{
  "access_token": "EAAxxxxx...",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

Save this long-lived token!

### Step 7: Get Instagram User ID

#### Method 1: Using Graph API Explorer

1. In Graph API Explorer, use your access token
2. Make a GET request to: `/me/accounts`
3. Find your Facebook Page ID in the response
4. Make another GET request to: `/{PAGE_ID}?fields=instagram_business_account`
5. Copy the `instagram_business_account` → `id`

#### Method 2: Using cURL

```bash
# Get your Facebook Page ID
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_ACCESS_TOKEN"

# Get Instagram Business Account ID
curl -X GET "https://graph.facebook.com/v18.0/{PAGE_ID}?fields=instagram_business_account&access_token=YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "instagram_business_account": {
    "id": "17841400000000000"  ← This is your Instagram User ID!
  },
  "id": "123456789"
}
```

---

## 🔐 Add to Your .env File

```env
INSTAGRAM_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxx
INSTAGRAM_USER_ID=17841400000000000
```

---

## ✅ Test Your Setup

Run the test script:

```bash
node test_instagram.js
```

You should see:
```
🧪 Testing Instagram API...

Credentials check:
  Access Token: ✅
  IG User ID: ✅

🚀 Posting test to Instagram...
✅ Instagram: Posted successfully
   Post ID: 18234567890123456

🎉 SUCCESS! Check your Instagram profile!
```

---

## 🔄 Token Refresh (Important!)

Long-lived tokens expire after **60 days**. To refresh:

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_CURRENT_TOKEN"
```

**Pro Tip**: Set a calendar reminder for 55 days to refresh your token!

---

## 🛠️ Troubleshooting

### Error: "Invalid OAuth access token"
- Token expired → Generate new long-lived token
- Wrong token → Double-check you copied correctly

### Error: "Instagram account not found"
- Wrong Instagram User ID → Verify using Graph API Explorer
- Account not connected to Page → Check Facebook Page connection

### Error: "Insufficient permissions"
- Missing permissions → Regenerate token with all required permissions:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_read_engagement`

### Error: "Media URL not reachable"
- URL must be publicly accessible
- Instagram must be able to download the file
- HTTPS required (not HTTP)

### Error: "Container processing failed"
- Video format not supported (use MP4, H.264)
- Video too long (max 90 seconds for Reels)
- Video resolution issues (use 1080x1920 for best results)

---

## 📝 Important Notes

### Limitations:
- ⚠️ **Instagram requires media** - You cannot post text-only
- ⚠️ **Videos become Reels** - Normal video posts not supported via API
- ⚠️ **No Stories via API** - Only feed posts and Reels
- ⚠️ **Rate limits apply** - 25 posts per 24 hours per user

### Media Requirements:

**Images:**
- Format: JPG, PNG
- Max size: 8MB
- Aspect ratio: 4:5 (portrait), 1.91:1 (landscape), 1:1 (square)
- Min resolution: 320px

**Videos/Reels:**
- Format: MP4, H.264 codec
- Max size: 100MB
- Duration: 3-90 seconds
- Aspect ratio: 9:16 (vertical)
- Min resolution: 720px

### Best Practices:
- ✅ Use long-lived tokens (60 days)
- ✅ Store tokens securely in .env
- ✅ Test with public URLs (use Imgur, Cloudinary, etc.)
- ✅ Monitor rate limits
- ✅ Handle errors gracefully

---

## 🔗 Useful Links

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Facebook App Dashboard](https://developers.facebook.com/apps/)

---

## 💡 Quick Reference

### Get Facebook Page ID:
```bash
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=TOKEN"
```

### Get Instagram User ID:
```bash
curl "https://graph.facebook.com/v18.0/PAGE_ID?fields=instagram_business_account&access_token=TOKEN"
```

### Post Image to Instagram:
```bash
# Create container
curl -X POST "https://graph.facebook.com/v18.0/IG_USER_ID/media" \
  -d "image_url=IMAGE_URL" \
  -d "caption=CAPTION" \
  -d "access_token=TOKEN"

# Publish
curl -X POST "https://graph.facebook.com/v18.0/IG_USER_ID/media_publish" \
  -d "creation_id=CONTAINER_ID" \
  -d "access_token=TOKEN"
```

---

## 🎉 You're All Set!

Once you have your credentials, you can:
- ✅ Post images to Instagram
- ✅ Post Reels (videos)
- ✅ Schedule Instagram posts
- ✅ Multi-platform posting (Instagram + LinkedIn + Twitter)

Need help? Check the troubleshooting section or open an issue on GitHub!

---

**Author**: Aj (@ajay-automates)  
**Last Updated**: October 2025

