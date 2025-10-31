# 📹 YouTube Integration (Shorts)

Complete guide to setting up YouTube Shorts video uploads with OAuth 2.0.

## Overview

**Capabilities:**
- ✅ Video uploads (Shorts)
- ✅ Auto #Shorts hashtag
- ✅ Token auto-refresh
- ✅ Multi-account support
- ⚠️ Quota limitations (default: 6 uploads/day)

**API Version**: YouTube Data API v3

---

## Prerequisites

1. Google Cloud account
2. YouTube channel
3. YouTube Data API v3 enabled

---

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console

Visit: https://console.cloud.google.com/

### 1.2 Create New Project

1. Click **"Select a project"** → **"New Project"**
2. Enter project name: "Social Media Automator"
3. Click **"Create"**

### 1.3 Enable YouTube Data API v3

1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it
4. Click **"Enable"**

---

## Step 2: Configure OAuth Consent Screen

### 2.1 Setup Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (for testing)
3. Click **"Create"**

### 2.2 Fill in App Information

**App Information:**
- **App name:** Social Media Automator
- **User support email:** Your email
- **Developer contact:** Your email

**App domain (optional for testing):**
- **Application home page:** http://localhost:3000
- **Privacy policy:** (optional for dev)
- **Terms of service:** (optional for dev)

### 2.3 Add Scopes

Click **"Add or Remove Scopes"**

Required scopes:
```
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube.readonly
https://www.googleapis.com/auth/userinfo.profile
```

### 2.4 Add Test Users

Under "Test users", add:
- Your Google email
- Any other accounts you want to test with

**Click "Save and Continue"**

---

## Step 3: Create OAuth 2.0 Credentials

### 3.1 Create Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Choose **"Web application"**

### 3.2 Configure Client

**Name:** Social Media Automator

**Authorized JavaScript origins:**
```
http://localhost:3000
https://your-domain.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/youtube/callback
https://your-domain.com/auth/youtube/callback
```

Click **"Create"**

### 3.3 Save Credentials

You'll see:
- **Client ID** (starts with numbers)
- **Client Secret**

**Download the JSON or copy both values.**

---

## Step 4: Environment Variables

Add to your `.env` file:

```env
YOUTUBE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_client_secret
```

---

## Step 5: Understand Quota Limits

### Default Quota

YouTube Data API v3 has strict quotas:

| Operation | Cost | Daily Limit |
|-----------|------|-------------|
| Video upload | 1600 units | 10,000 units |
| **Uploads per day** | **~6 videos** | **(default)** |

**Formula:** 10,000 units ÷ 1,600 per upload = ~6 uploads/day

### Request Quota Increase

**For production use, you MUST request a quota increase:**

1. Go to **"APIs & Services"** → **"Quotas"**
2. Find **"YouTube Data API v3"**
3. Click **"Edit Quotas"** or **"Request Increase"**
4. Fill out form:
   - **Desired quota:** 100,000 - 1,000,000 units/day
   - **Reason:** Social media automation tool for businesses
   - **Use case:** Scheduled YouTube Shorts posting
5. Submit and wait for approval (1-7 days)

**Typical approved quotas:** 100,000 - 10,000,000 units/day

---

## Step 6: Test Connection

### 6.1 Connect YouTube Account

1. Start server: `npm start`
2. Go to: `http://localhost:3000/dashboard/settings`
3. Click **"Connect YouTube"**
4. Sign in with Google account
5. Grant permissions
6. Authorize app

### 6.2 Test Video Upload

**Important:** Only videos work, not images or text!

1. Go to Create Post
2. Upload a SHORT video (<60 seconds recommended)
3. Enter title/description
4. Select YouTube
5. Click "Post Now"

**Expected result:**
- ✅ Video uploads successfully
- ✅ Appears in your YouTube channel
- ✅ Tagged as #Shorts
- ✅ Post ID returned

---

## How YouTube Shorts Work

### Requirements for Shorts

A video is automatically recognized as a Short if:
1. **Duration:** Less than 60 seconds
2. **Aspect ratio:** Vertical (9:16 or 1:1)
3. **Title/Description:** Contains #Shorts hashtag (we add automatically)

### Our Implementation

```javascript
// Automatically adds #Shorts to description
const description = `${originalDescription} #Shorts`;

// Upload as standard video (YouTube auto-detects Shorts)
const metadata = {
  snippet: {
    title,
    description,
    tags: ['Shorts', ...customTags],
    categoryId: '22' // People & Blogs
  },
  status: {
    privacyStatus: 'public',
    selfDeclaredMadeForKids: false
  }
};
```

---

## Token Management

### Access Token
- **Lifespan:** 1 hour
- **Refresh:** Yes, using refresh token
- **Auto-refresh:** ✅ Implemented

### Refresh Token
- **Lifespan:** Indefinite (until revoked)
- **Storage:** Encrypted in database
- **Reusable:** Yes

**Our implementation:**
- Proactively checks expiration (5-minute buffer)
- Auto-refreshes before upload
- Saves new access token to database
- Never expires refresh token

---

## Multi-Account Support

### How It Works

1. Connect multiple YouTube channels
2. App posts to ALL connected channels
3. Separate tokens per channel

### Connect Multiple Channels

**Option A: Multiple Google Accounts**
1. Connect first channel
2. Click "Connect YouTube" again
3. Use different Google account
4. Authorize

**Option B: Multiple Channels on Same Account**
1. Works automatically if you have Brand Accounts
2. Each channel gets separate entry in database

---

## API Endpoints Used

### OAuth
- `POST https://oauth2.googleapis.com/token` - Exchange code/refresh tokens

### Video Upload
- `POST https://www.googleapis.com/upload/youtube/v3/videos` - Resumable upload
- `GET https://www.googleapis.com/youtube/v3/channels` - Get channel info

---

## Troubleshooting

### "Quota exceeded" Error

**Cause:** Hit daily upload limit (default: 6 videos)

**Solutions:**
1. Wait until tomorrow (quota resets at midnight PT)
2. Request quota increase from Google
3. Use multiple API projects (not recommended)

**Check quota:**
1. Go to Google Cloud Console
2. APIs & Services → Dashboard
3. Click YouTube Data API v3
4. View "Quotas" tab

### "Invalid credentials" Error

**Causes:**
- Wrong Client ID/Secret
- Scopes not approved
- App not in testing mode

**Solutions:**
1. Verify `.env` has correct credentials
2. Check OAuth consent screen has required scopes
3. Add test users in Google Cloud Console

### "Video processing failed"

**Causes:**
- Unsupported video format
- File too large (>256GB max)
- Corrupted file

**Solutions:**
1. Use MP4 format (H.264 codec)
2. Keep under 100MB for best results
3. Test video plays locally first

### "Token refresh failed"

**Cause:** Refresh token revoked or expired

**Solution:**
1. Disconnect YouTube account
2. Reconnect and reauthorize
3. New tokens will be saved

---

## Video Specifications

### Recommended Format
- **Container:** MP4
- **Video codec:** H.264
- **Audio codec:** AAC
- **Resolution:** 1080x1920 (9:16 vertical)
- **Frame rate:** 30fps
- **Bitrate:** 2-5 Mbps
- **Duration:** 15-60 seconds (for Shorts)

### Size Limits
- **Max file size:** 256GB
- **Max duration:** 12 hours
- **Recommended:** <100MB for Shorts

---

## Best Practices

### Content Guidelines
- Keep videos under 60 seconds for Shorts
- Use vertical format (9:16)
- Add #Shorts to description
- Include engaging thumbnails
- Use relevant tags

### Upload Strategy
- Monitor quota usage
- Schedule uploads to spread across days
- Request quota increase for production
- Test with small videos first

### Security
- Keep Client Secret secure
- Never expose refresh tokens
- Monitor API usage
- Rotate credentials periodically

---

## Code Example

```javascript
// services/youtube.js
async function uploadYouTubeShort(videoUrl, credentials, title, description) {
  // Check if token needs refresh
  if (isTokenExpired(credentials)) {
    credentials = await refreshYouTubeToken(credentials.refreshToken);
  }
  
  // Download video from Cloudinary
  const videoBuffer = await downloadVideo(videoUrl);
  
  // Add #Shorts hashtag
  const shortDescription = `${description} #Shorts`;
  
  // Prepare metadata
  const metadata = {
    snippet: {
      title,
      description: shortDescription,
      tags: ['Shorts'],
      categoryId: '22'
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false
    }
  };
  
  // Upload using resumable upload
  const videoId = await uploadVideoResumable(
    videoBuffer,
    metadata,
    credentials.accessToken
  );
  
  return {
    success: true,
    videoId,
    url: `https://www.youtube.com/shorts/${videoId}`
  };
}
```

---

## Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Resumable Upload Guide](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [Shorts Requirements](https://support.google.com/youtube/answer/10059070)

---

## Status

- ✅ OAuth 2.0 integration complete
- ✅ Video upload works
- ✅ Auto #Shorts tagging
- ✅ Token auto-refresh
- ✅ Multi-channel support
- ⚠️ Default quota: 6 uploads/day
- 💡 Request quota increase for production

**Code ready, waiting for quota approval!**

---

**Next:** [Request YouTube Quota Increase](https://support.google.com/youtube/contact/yt_api_form)

