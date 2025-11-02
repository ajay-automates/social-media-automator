# Reddit Integration Guide

## Overview

Post to Reddit subreddits using OAuth 2.0 authentication. Post to subreddits where you're a moderator for safe, spam-free posting.

## Setup Steps

### 1. Create Reddit App

1. Go to: https://www.reddit.com/prefs/apps
2. Scroll to **"developed applications"**
3. Click **"create another app..."** or **"create app"**
4. Fill in details:
   - **Name**: Social Media Automator
   - **App type**: **web app** (important!)
   - **Description**: Automate Reddit posting
   - **About URL**: Your website (optional)
   - **Redirect URI**: 
     - Local: `http://localhost:3000/auth/reddit/callback`
     - Production: `https://your-domain.com/auth/reddit/callback`
5. Click **"create app"**
6. Note your credentials:
   - **Client ID**: Text directly under app name
   - **Secret**: Click "edit" to see secret value

### 2. Add Environment Variables

Add to `.env` (local) or Railway (production):

```bash
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=SocialMediaAutomator/1.0 by u/YourRedditUsername
```

⚠️ **Important**: 
- Replace `YourRedditUsername` with your actual Reddit username
- Client secret contains confusing characters (lowercase `l` looks like `1` or `I`)

### 3. Run Database Migration

In Supabase SQL Editor:

```sql
-- Migration 010: Add Reddit Platform Support
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_platform_check;

ALTER TABLE user_accounts 
ADD CONSTRAINT user_accounts_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'telegram', 'slack', 'discord', 'reddit', 'instagram', 'facebook', 'youtube', 'tiktok'));

ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS platform_metadata JSONB;

COMMENT ON COLUMN user_accounts.platform_metadata IS 'Platform-specific metadata (e.g., Reddit moderated subreddits)';
```

### 4. Connect Reddit Account

1. Go to **Settings** in Social Media Automator
2. Click **"Connect Reddit"** button
3. You'll be redirected to Reddit
4. Click **"Allow"** to authorize
5. You'll be redirected back with success message
6. Your moderated subreddits are automatically fetched

## Posting Features

### Supported Content Types

| Content Type | Support | Reddit Post Type |
|--------------|---------|------------------|
| **Text** | ✅ | Self post (`kind: self`) |
| **Images** | ✅ | Image post (`kind: image`) |
| **Videos** | ✅ | Link post with video URL |
| **Links** | ✅ | Link post (`kind: link`) |

### Reddit-Specific Requirements

**Post Title (Required):**
- Maximum 300 characters
- Required for ALL Reddit posts
- Shows in subreddit feed

**Subreddit Selection (Required):**
- Can only post to subreddits you moderate
- Prevents spam and Reddit bans
- Safe posting environment

### Creating Posts

1. Go to **Create Post**
2. Select **Reddit** platform (🔴 icon)
3. **Reddit Settings** section appears:
   - **Post Title**: Enter title (max 300 chars)
   - **Subreddit**: Select from dropdown (your moderated subs only)
4. Enter caption
5. (Optional) Upload image/video
6. Click **"Post Now"**

## Features

### OAuth 2.0 Authentication
- ✅ Secure authorization flow
- ✅ Permanent refresh token
- ✅ Automatic token refresh (tokens expire every hour)

### Moderated Subreddits Only
- ✅ Safe posting (no spam risk)
- ✅ No karma requirements
- ✅ Bypass auto-mod filters
- ✅ Full control over your communities

### Content Support
- ✅ Text posts (self posts)
- ✅ Image posts (Reddit hosts the image)
- ✅ Video URLs (posted as links)
- ✅ External links

### Token Management
- ✅ Tokens auto-refresh before posting
- ✅ Expires after 1 hour
- ✅ Refresh token stored securely
- ✅ No re-authentication needed

## Limitations

### Rate Limits

Reddit has strict rate limits:
- **1 post per 10 minutes** per subreddit
- **10 posts per hour** across all subreddits
- Exceeding limits = temporary ban

### Posting Restrictions

- Can **ONLY** post to subreddits where you're a moderator
- Cannot post to arbitrary subreddits (would be spam)
- Each subreddit must be in your moderated list

### Content Restrictions

- Title is always required (no title-less posts)
- Some subreddits may have additional rules
- NSFW content requires proper tagging

## Troubleshooting

### Connection Issues

**Error**: "Reddit OAuth not configured"
- **Fix**: Add `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` to environment variables

**Error**: "401 Unauthorized"
- **Fix**: Check client_secret is correct (watch for lowercase `l` vs `1` or `I`)
- Verify redirect URI matches in Reddit app settings

**Error**: "403 Forbidden - No moderated subreddits"
- **Fix**: Create a test subreddit (you'll automatically be moderator)
- Or ask to be added as moderator to existing subreddit

### Posting Issues

**Error**: "No subreddit specified"
- **Fix**: Select a subreddit from the dropdown

**Error**: "Reddit requires a post title"
- **Fix**: Fill in the Post Title field (required)

**Error**: "Rate limit exceeded"
- **Fix**: Wait 10 minutes before posting to same subreddit again

## Creating a Test Subreddit

If you don't moderate any subreddits:

1. Go to: https://www.reddit.com/subreddits/create
2. **Name**: test_your_project (must be unique)
3. **Type**: Private or Restricted (for testing)
4. **Description**: Testing subreddit for automation
5. Click **"Create Community"**
6. You're automatically the moderator!
7. Reconnect Reddit in app to fetch new subreddit

## OAuth Scopes

The app requests these permissions:
- `identity` - Get your Reddit username
- `submit` - Submit posts
- `read` - Read subreddit info
- `mysubreddits` - Access your moderated subreddits

## API Reference

### Reddit API Endpoints Used

**Get User Info:**
```
GET https://oauth.reddit.com/api/v1/me
```

**Get Moderated Subreddits:**
```
GET https://oauth.reddit.com/subreddits/mine/moderator
```

**Submit Post:**
```
POST https://oauth.reddit.com/api/submit
Parameters: sr, kind, title, text/url
```

### Headers Required

```javascript
{
  'Authorization': `Bearer ${accessToken}`,
  'User-Agent': process.env.REDDIT_USER_AGENT,
  'Content-Type': 'application/x-www-form-urlencoded'
}
```

## Best Practices

### Safe Posting
- Only post to subreddits you moderate
- Follow subreddit rules
- Don't spam (respect 10-minute limit)
- Use descriptive titles

### Content Guidelines
- Make titles clear and descriptive
- Keep captions relevant to subreddit topic
- Tag NSFW content appropriately
- Include context in posts

### Token Management
- Tokens auto-refresh every hour
- Keep refresh_token secure
- Re-authenticate if refresh fails

## Support

Issues with Reddit integration? Check:
1. Reddit app credentials are correct
2. Redirect URI matches exactly
3. Database migration was run
4. You moderate at least one subreddit
5. OAuth scopes include `mysubreddits`

---

**Status**: ✅ Live  
**Integration Type**: OAuth 2.0  
**Token Expiry**: 1 hour (auto-refresh)  
**Posting Scope**: Moderated subreddits only

