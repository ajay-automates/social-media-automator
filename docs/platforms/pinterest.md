# Pinterest Integration

**Status:** ⏳ Awaiting API Approval  
**Version:** 1.0  
**Last Updated:** November 8, 2025

---

## 📌 Overview

Pinterest integration allows users to:
- Post images with captions to Pinterest boards
- Manage multiple Pinterest accounts
- Select specific boards for posting
- Schedule pins for optimal times
- Track Pinterest posting analytics

---

## 🎯 Features

### ✅ Implemented
- OAuth 2.0 authentication flow
- Image posting with captions
- Board selection
- Multi-account support
- Auto token refresh
- Scheduled posting
- Analytics tracking

### ⏳ Coming Soon (After Approval)
- Video pins
- Idea Pins (carousels)
- Pinterest analytics integration
- Auto board creation
- Trending topics integration

---

## 🔐 Authentication

### OAuth Flow

**Scopes Required:**
- `boards:read` - View user boards
- `boards:write` - Create boards
- `pins:read` - View pins
- `pins:write` - Create pins
- `user_accounts:read` - Get user profile

### Setup

1. **Create Pinterest App:**
   - Go to https://developers.pinterest.com/
   - Create new app "Social Media Automator"
   - Get App ID and App Secret

2. **Configure Redirect URIs:**
   ```
   http://localhost:3000/auth/pinterest/callback
   https://your-domain.com/auth/pinterest/callback
   ```

3. **Environment Variables:**
   ```bash
   PINTEREST_APP_ID=your_app_id
   PINTEREST_APP_SECRET=your_app_secret
   ```

---

## 📡 API Endpoints

### Backend Routes

#### `POST /api/auth/pinterest/url`
Generate Pinterest OAuth URL

**Authentication:** Required  
**Request:**
```json
{
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://www.pinterest.com/oauth/..."
}
```

#### `GET /auth/pinterest/callback`
Handle OAuth callback

**Parameters:**
- `code` - Authorization code
- `state` - State parameter

**Redirect:** `/connect-accounts?success=pinterest_connected`

#### `GET /api/pinterest/boards/:userId`
Get user's Pinterest boards

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "boards": [
    {
      "id": "board_id",
      "name": "Board Name",
      "description": "Board description",
      "privacy": "public"
    }
  ]
}
```

---

## 💻 Frontend Integration

### Connection Flow

```jsx
// ConnectAccounts.jsx
const connectPinterest = async () => {
  try {
    const response = await api.post('/auth/pinterest/url');
    if (response.data.success && response.data.authUrl) {
      window.location.href = response.data.authUrl;
    }
  } catch (error) {
    showError('Failed to connect Pinterest');
  }
};
```

### Display Connected Account

```jsx
{account?.platform === 'pinterest' && (
  <FaPinterest className="text-5xl text-red-600" />
)}
```

---

## 📝 Posting

### Post Format

**Requirements:**
- ✅ Image required (Pinterest is visual-first)
- ✅ Caption (max 500 characters)
- ❌ Text-only posts not supported

**Optional:**
- Board ID (posts to specific board)
- Destination link (where pin links to)
- Title (separate from description)

### Code Example

```javascript
// services/pinterest.js
const result = await postToPinterest(
  text,      // Caption
  imageUrl,  // Image URL (required)
  credentials,
  {
    boardId: 'board_id',     // Optional
    link: 'https://...',     // Optional
    title: 'Pin Title'       // Optional
  }
);
```

---

## 🗄️ Database Schema

Uses existing `user_accounts` table:

```sql
{
  user_id: INTEGER,
  platform: 'pinterest',
  platform_user_id: 'username',
  platform_username: 'username',
  access_token: 'token',
  refresh_token: 'refresh_token',
  token_expires_at: TIMESTAMP,
  platform_metadata: {
    profile_image: 'url',
    account_type: 'business'
  }
}
```

**Indexes:**
```sql
CREATE INDEX idx_user_accounts_pinterest 
ON user_accounts(user_id, platform) 
WHERE platform = 'pinterest';
```

---

## ⚠️ Limitations

### Pinterest API Limits
- **Rate Limit:** 1000 requests/hour per user
- **Pin Size:** Images must be 100x100px minimum
- **File Size:** Max 32MB per image
- **Daily Quota:** Varies by access tier

### Trial Access
- ⏳ Pins only visible to creator
- ⏳ Limited to testing purposes
- ⏳ Requires Standard Access for public pins

### Standard Access
- ✅ Public pins visible to all
- ✅ Full API access
- ✅ Production-ready

---

## 🐛 Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid media` | Image URL not accessible | Use public Cloudinary URL |
| `Rate limit exceeded` | Too many requests | Wait 1 hour |
| `Invalid token` | Token expired | Auto-refreshed by system |
| `No image` | Text-only post | Attach image |

### Error Response Format

```json
{
  "success": false,
  "error": "User-friendly error message",
  "platform": "pinterest"
}
```

---

## 🧪 Testing

### Local Testing

1. **Setup:**
   ```bash
   # Add to .env
   PINTEREST_APP_ID=your_app_id
   PINTEREST_APP_SECRET=your_app_secret
   ```

2. **Connect Account:**
   - Go to http://localhost:5173/connect-accounts
   - Click "Pinterest" button
   - Authorize app

3. **Test Post:**
   - Go to Create Post
   - Write caption
   - Attach image
   - Select Pinterest
   - Post!

### Production Testing

Same flow at https://socialmediaautomator.com

---

## 📊 Analytics

Pinterest posts are tracked in the `posts` table:

```json
{
  "platform": "pinterest",
  "status": "posted",
  "image_url": "cloudinary_url",
  "text": "caption",
  "post_metadata": {
    "boardId": "board_id",
    "pinId": "pin_id"
  }
}
```

---

## 🔄 Token Refresh

Automatic token refresh is handled by `refreshPinterestToken()`:

```javascript
// Checks expiration (5 min buffer)
if (tokenExpired) {
  const newToken = await refreshPinterestToken(refreshToken, userId);
  // Auto-saves to database
}
```

---

## 📚 Resources

- **Pinterest API Docs:** https://developers.pinterest.com/docs/api/v5/
- **OAuth Guide:** https://developers.pinterest.com/docs/getting-started/authentication/
- **Developer Portal:** https://developers.pinterest.com/apps/
- **API Status:** https://status.pinterest.com/

---

## 🚀 Deployment

### Environment Variables (Railway)

```bash
PINTEREST_APP_ID=1536126
PINTEREST_APP_SECRET=your_secret_here
```

### Migration

Run `migrations/017_add_pinterest.sql` in Supabase

### Verification

```sql
SELECT COUNT(*) as pinterest_accounts
FROM user_accounts 
WHERE platform = 'pinterest';
```

---

## ✅ Status

- **Code:** ✅ Complete
- **Backend:** ✅ Deployed
- **Frontend:** ✅ Deployed
- **Database:** ✅ Migrated
- **API Access:** ⏳ Pending approval (1-3 days)

**Once approved:** Add App Secret to Railway → Pinterest works immediately! 🎉

