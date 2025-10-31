# TikTok Developer Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create TikTok Developer Account
1. Go to https://developers.tiktok.com/
2. Click Sign up or Log in
3. Verify your email

### Step 2: Create New App
1. Click My Apps → Create New App
2. Select Web as platform
3. Fill in app details

### Step 3: Request Scopes
Request these permissions:
- user.info.basic (auto-approved)
- user.info.profile (requires review)
- video.upload (requires review)
- video.publish (requires review)

### Step 4: Get Credentials
Copy Client Key and Client Secret to your .env file:

```
TIKTOK_CLIENT_KEY=your_key
TIKTOK_CLIENT_SECRET=your_secret
```

### Step 5: Add Redirect URI
- Dev: http://localhost:3000/auth/tiktok/callback
- Prod: https://your-domain.com/auth/tiktok/callback

Approval takes 3-7 days.
