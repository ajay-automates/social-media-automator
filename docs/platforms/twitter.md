# 🐦 Twitter/X Integration

Complete guide to setting up Twitter/X posting with OAuth 2.0.

## Overview

**Capabilities:**
- ✅ Text posts
- ✅ Image posts (up to 4 images)
- ⚠️ Video posts (requires Elevated API access)
- ✅ Multi-account support
- ✅ Auto token refresh

**API Version**: Twitter API v2 (OAuth 2.0 with PKCE)

---

## Prerequisites

1. Twitter Developer account
2. Elevated API access (for media uploads)
3. OAuth 2.0 app created

---

## Step 1: Create Twitter App

### 1.1 Go to Developer Portal

Visit: https://developer.twitter.com/en/portal/dashboard

### 1.2 Create New App

1. Click **"+ Create Project"**
2. Enter project name (e.g., "Social Media Automator")
3. Select use case: **"Making a bot"** or **"Building tools"**
4. Enter app name (visible to users during OAuth)

### 1.3 Get API Credentials

After creating the app, you'll see:
- **Client ID** (starts with uppercase letters)
- **Client Secret** (save immediately - shown only once!)

**Save these for your `.env` file.**

---

## Step 2: Configure OAuth 2.0

### 2.1 Enable User Authentication

1. Go to your app settings
2. Click **"Set up"** under "User authentication settings"
3. Enable **OAuth 2.0**
4. Select app permissions:
   - ✅ Read
   - ✅ Write
   - ✅ Direct Messages (optional)

### 2.2 Configure Callback URL

**Type of App:** Web App

**Callback URLs:**
```
http://localhost:3000/auth/twitter/callback
https://your-domain.com/auth/twitter/callback
```

**Website URL:**
```
http://localhost:3000
```

### 2.3 Additional Settings

**Confidential client:** Yes  
**Organization:** Your company name  
**Privacy Policy:** Optional for dev

Click **"Save"**

---

## Step 3: Request Elevated Access

### Why Elevated Access?

Free tier has limitations:
- ❌ Cannot upload media
- Limited API calls
- No media endpoints

**With Elevated Access:**
- ✅ Media uploads (images/videos)
- Higher rate limits
- More endpoints

### How to Apply

1. Go to: https://developer.twitter.com/en/portal/products/elevated
2. Click **"Apply for Elevated"**
3. Fill out form:
   - **Use case:** Social media management tool
   - **Will you make Twitter content available?** Yes
   - **Will you aggregate data?** No
4. Submit and wait 1-3 days for approval

---

## Step 4: Environment Variables

Add to your `.env` file:

```env
# Twitter OAuth 2.0 (for posting)
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here

# Twitter OAuth 1.0a (for media uploads - if needed)
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_token_secret
```

**Note:** OAuth 2.0 is primary. OAuth 1.0a credentials are backup for media uploads.

---

## Step 5: Test Connection

### 5.1 Connect Account

1. Start your server: `npm start`
2. Go to: `http://localhost:3000/dashboard/settings`
3. Click **"Connect Twitter"**
4. Authorize the app
5. You should see your Twitter account connected

### 5.2 Test Posting

**Text-only post:**
1. Go to Create Post
2. Enter text
3. Select Twitter
4. Click "Post Now"
5. ✅ Should succeed

**Image post:**
1. Upload an image
2. Enter text
3. Select Twitter
4. Click "Post Now"
5. ✅ Should succeed (with Elevated access)

**Video post:**
1. Upload a video
2. Enter text
3. Select Twitter
4. Click "Post Now"
5. ⚠️ May fail without Elevated access

---

## API Endpoints Used

### OAuth
- `POST /2/oauth2/token` - Exchange code for tokens
- `POST /2/oauth2/revoke` - Revoke tokens

### Posting
- `POST /2/tweets` - Create tweet
- `POST /1.1/media/upload` - Upload media (requires Elevated)

### User Info
- `GET /2/users/me` - Get authenticated user profile

---

## Rate Limits

### Free Tier
- 1,500 tweets per month
- 50 requests per 15 minutes

### Elevated Tier
- 300,000 tweets per month
- 100 requests per 15 minutes

**Our implementation handles rate limiting automatically.**

---

## Multi-Account Support

### How It Works

1. Each user can connect multiple Twitter accounts
2. When posting, the app posts to ALL connected accounts
3. Accounts stored separately in database

### Connect Multiple Accounts

1. Go to Settings
2. Click "Connect Twitter" again
3. Sign in with different account
4. Authorize
5. Both accounts now receive posts

---

## Token Management

### Access Token
- **Lifespan:** 2 hours
- **Refresh:** Yes, using refresh token
- **Auto-refresh:** ✅ Implemented

### Refresh Token
- **Lifespan:** 180 days (6 months)
- **Single-use:** Yes, new refresh token issued each time
- **Storage:** Encrypted in database

**Our implementation:**
- Checks expiration before posting
- Auto-refreshes if needed
- Saves new tokens to database
- Handles expired refresh tokens (requires re-auth)

---

## Troubleshooting

### "403 Forbidden" Error

**Cause:** Missing Elevated API access

**Solution:**
1. Apply for Elevated access
2. Wait for approval
3. Or post text-only (works on Free tier)

### "Unauthorized" Error

**Causes:**
- Invalid credentials
- Expired tokens
- Wrong OAuth version

**Solutions:**
1. Check `.env` has correct Client ID/Secret
2. Disconnect and reconnect account
3. Verify OAuth 2.0 is enabled in app settings

### "Media upload failed"

**Cause:** Free tier doesn't support media uploads

**Solution:**
- Get Elevated access
- Or use OAuth 1.0a credentials (legacy)

### "Invalid callback URL"

**Cause:** Mismatch between app settings and actual URL

**Solution:**
1. Go to Twitter Developer Portal
2. App Settings → User authentication settings
3. Add exact callback URL (with/without trailing slash)
4. Restart server

---

## Best Practices

### Content Guidelines
- Max tweet length: 280 characters
- Max images: 4 per tweet
- Max video size: 512MB
- Supported formats: JPG, PNG, GIF, MP4

### Posting Strategy
- Avoid spammy behavior (rate limiting)
- Use unique content (duplicate detection)
- Include images for better engagement
- Schedule posts with variety

### Security
- Never commit API keys to git
- Rotate secrets regularly
- Use environment variables
- Monitor API usage

---

## Code Example

```javascript
// services/twitter.js
async function postToTwitter(text, credentials, imageUrl = null) {
  const { accessToken, userId } = credentials;
  
  // Check if token needs refresh
  if (isTokenExpired(credentials)) {
    await refreshTwitterToken(userId);
  }
  
  // Upload media if provided
  let mediaIds = [];
  if (imageUrl) {
    const mediaId = await uploadMediaToTwitter(imageUrl, credentials);
    mediaIds.push(mediaId);
  }
  
  // Create tweet
  const response = await axios.post(
    'https://api.twitter.com/2/tweets',
    {
      text,
      media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}
```

---

## Resources

- [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [OAuth 2.0 Guide](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Media Upload Guide](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/overview)
- [Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)

---

## Status

- ✅ OAuth 2.0 integration complete
- ✅ Text posting works
- ✅ Image posting works (with Elevated)
- ⚠️ Video posting requires Elevated access
- ✅ Multi-account support
- ✅ Auto token refresh

**Ready for production use!**

---

**Next:** [Test your Twitter integration](../deployment/testing-guide.md#twitter-testing)

