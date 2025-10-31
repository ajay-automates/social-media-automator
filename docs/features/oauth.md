# 🔐 OAuth Configuration Guide

Comprehensive guide to setting up OAuth 2.0 authentication across all platforms.

## Overview

OAuth 2.0 allows users to securely connect their social media accounts without sharing passwords. Our implementation supports:

- ✅ Multi-platform OAuth (7 platforms)
- ✅ Multi-account per platform
- ✅ Token auto-refresh
- ✅ Secure token storage
- ✅ State-based CSRF protection

---

## How OAuth Works

### Flow Diagram

```
User clicks "Connect LinkedIn"
    ↓
Generate OAuth URL with state parameter
    ↓
Redirect user to LinkedIn login
    ↓
User authorizes app
    ↓
LinkedIn redirects back with authorization code
    ↓
Exchange code for access & refresh tokens
    ↓
Fetch user profile
    ↓
Save tokens + profile to database (encrypted)
    ↓
User can now post to LinkedIn
```

---

## Platform-Specific Guides

Each platform has unique OAuth requirements:

- **[LinkedIn](../platforms/linkedin.md#oauth-setup)** - OAuth 2.0, simple flow
- **[Twitter](../platforms/twitter.md#step-2-configure-oauth-20)** - OAuth 2.0 with PKCE
- **[Instagram](../platforms/instagram.md#oauth-flow)** - Uses Facebook Login
- **[Facebook](../platforms/facebook.md#oauth-setup)** - Facebook Login for Pages
- **[YouTube](../platforms/youtube.md#step-2-configure-oauth-consent-screen)** - Google OAuth with scopes
- **[TikTok](../platforms/tiktok.md#oauth-setup)** - OAuth 2.0 with video permissions

---

## General OAuth Setup Steps

### 1. Create Developer App

For each platform:
1. Go to platform's developer portal
2. Create a new app/project
3. Get Client ID and Client Secret
4. Configure OAuth settings

### 2. Configure Redirect URIs

**Critical:** Redirect URIs must match EXACTLY

**Development:**
```
http://localhost:3000/auth/{platform}/callback
```

**Production:**
```
https://your-domain.com/auth/{platform}/callback
```

Replace `{platform}` with: linkedin, twitter, instagram, facebook, youtube, tiktok

### 3. Request Permissions/Scopes

Request minimum necessary scopes:

**LinkedIn:**
- `r_liteprofile` - Read profile
- `w_member_social` - Post updates

**Twitter:**
- `tweet.read` - Read tweets
- `tweet.write` - Post tweets
- `users.read` - Get profile

**Instagram (via Facebook):**
- `instagram_basic` - Basic profile
- `instagram_content_publish` - Post content
- `pages_show_list` - List Facebook Pages

**Facebook:**
- `pages_show_list` - List Pages
- `pages_read_engagement` - Read Page data
- `pages_manage_posts` - Post to Pages

**YouTube:**
- `youtube.upload` - Upload videos
- `youtube.readonly` - Read channel info

**TikTok:**
- `user.info.basic` - Basic profile
- `video.publish` - Post videos

### 4. Add Environment Variables

```env
# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Twitter
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# Instagram
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback

# Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback

# YouTube
YOUTUBE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_client_secret

# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret

# OAuth State Encryption
OAUTH_STATE_SECRET=your_32_byte_hex_string
```

---

## Security Implementation

### State Parameter (CSRF Protection)

**Purpose:** Prevent cross-site request forgery attacks

**How it works:**
1. Generate random state when initiating OAuth
2. Encrypt with user ID
3. Store in database or session
4. Validate on callback

**Code:**
```javascript
// Generate state
const state = crypto.randomBytes(16).toString('hex');
const encrypted = encryptState({ userId, state, timestamp });

// Save to database
await saveOAuthState(userId, state, platform);

// Include in OAuth URL
const authUrl = `https://platform.com/oauth?client_id=${clientId}&state=${encrypted}`;
```

**On callback:**
```javascript
// Decrypt and validate
const { userId, state, timestamp } = decryptState(req.query.state);

// Check if expired (30 minutes)
if (Date.now() - timestamp > 30 * 60 * 1000) {
  throw new Error('State expired');
}

// Verify state matches
const savedState = await getOAuthState(userId, platform);
if (state !== savedState) {
  throw new Error('Invalid state');
}
```

### Token Storage

**Encryption at rest:**
```javascript
// Encrypt before saving
const encryptedToken = encrypt(accessToken, process.env.ENCRYPTION_KEY);

// Save to database
await supabase.from('user_accounts').insert({
  user_id: userId,
  platform,
  access_token: encryptedToken,
  // ...
});
```

**Row Level Security (RLS):**
```sql
-- Only user can access their own tokens
CREATE POLICY user_accounts_policy ON user_accounts
  FOR ALL USING (auth.uid() = user_id);
```

### PKCE (Twitter)

**Proof Key for Code Exchange** - Enhanced security for public clients

**Flow:**
1. Generate code_verifier (random string)
2. Create code_challenge (SHA256 hash)
3. Send code_challenge in auth URL
4. Store code_verifier in database
5. Send code_verifier when exchanging code for token

**Implementation:**
```javascript
// Generate PKCE values
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Save code_verifier
await savePKCE(userId, codeVerifier);

// Use in OAuth URL
const authUrl = `...&code_challenge=${codeChallenge}&code_challenge_method=S256`;

// Exchange code for token
const tokenResponse = await axios.post('token_endpoint', {
  code,
  code_verifier: savedCodeVerifier,
  // ...
});
```

---

## Token Management

### Access Tokens

**Properties:**
- Short-lived (1-24 hours typically)
- Used for API requests
- Stored encrypted in database

**Refresh Strategy:**
```javascript
async function makeAPIRequest(userId, platform) {
  let credentials = await getCredentials(userId, platform);
  
  // Check if token expired
  if (isExpired(credentials.token_expires_at)) {
    credentials = await refreshToken(userId, platform);
  }
  
  // Make API call
  return await callAPI(credentials.access_token);
}
```

### Refresh Tokens

**Properties:**
- Long-lived (months to indefinite)
- Used to get new access tokens
- Never sent to client
- Some are single-use (Twitter)

**Auto-Refresh Implementation:**
```javascript
async function refreshToken(userId, platform) {
  const account = await getAccount(userId, platform);
  
  const response = await axios.post('token_endpoint', {
    grant_type: 'refresh_token',
    refresh_token: account.refresh_token,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  });
  
  // Save new tokens
  await updateAccount(account.id, {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token, // May be new
    token_expires_at: calculateExpiry(response.data.expires_in)
  });
  
  return response.data;
}
```

### Token Expiration Tracking

**Database schema:**
```sql
user_accounts
├── access_token (TEXT) - Encrypted token
├── refresh_token (TEXT) - Encrypted refresh token
├── token_expires_at (TIMESTAMP) - When token expires
└── token_created_at (TIMESTAMP) - When token was issued
```

**Proactive refresh:**
```javascript
// Refresh 5 minutes before expiration
const bufferTime = 5 * 60 * 1000; // 5 minutes
const needsRefresh = 
  Date.now() >= (tokenExpiresAt.getTime() - bufferTime);

if (needsRefresh && hasRefreshToken) {
  await refreshToken(userId, platform);
}
```

---

## Multi-Account Support

### How It Works

Users can connect multiple accounts per platform:
- Multiple LinkedIn profiles
- Multiple Twitter accounts
- Multiple Facebook Pages
- Etc.

**Database design:**
```sql
-- One user, multiple accounts per platform
user_accounts
├── id (unique for each connection)
├── user_id (same user)
├── platform (e.g., 'linkedin')
├── platform_user_id (LinkedIn ID, different for each account)
├── platform_username (Display name)
└── ... tokens ...
```

### Posting to All Accounts

```javascript
// Get all connected accounts for platform
const accounts = await getUserAccounts(userId, 'linkedin');

// Post to each account
const results = [];
for (const account of accounts) {
  try {
    const result = await postToLinkedIn(text, imageUrl, account);
    results.push({ success: true, account: account.username, ...result });
  } catch (error) {
    results.push({ success: false, account: account.username, error });
  }
}

return { platform: 'linkedin', results };
```

---

## Error Handling

### Common OAuth Errors

**"Invalid redirect_uri"**
- Cause: Mismatch between configured URI and actual URI
- Fix: Update in platform developer console

**"Invalid client_id"**
- Cause: Wrong Client ID in `.env`
- Fix: Double-check credentials

**"Insufficient permissions"**
- Cause: Missing required scopes
- Fix: Request additional scopes in app settings

**"Token expired"**
- Cause: Access token expired, no refresh token
- Fix: User must reconnect account

**"Invalid grant"**
- Cause: Refresh token expired or revoked
- Fix: User must reconnect account

### Graceful Degradation

```javascript
try {
  await postToLinkedIn(text, imageUrl, credentials);
} catch (error) {
  if (error.message.includes('token')) {
    // Try to refresh
    try {
      await refreshLinkedInToken(accountId);
      return await postToLinkedIn(text, imageUrl, newCredentials);
    } catch (refreshError) {
      // Mark account as expired
      await updateAccountStatus(accountId, 'expired');
      // Notify user to reconnect
      await notifyUser(userId, 'Please reconnect your LinkedIn account');
      throw new Error('Account needs reconnection');
    }
  }
  throw error;
}
```

---

## Testing OAuth

### Local Testing

1. **Start local server:**
   ```bash
   npm start
   ```

2. **Configure callback URLs:**
   - Add `http://localhost:3000/auth/{platform}/callback` to each platform

3. **Test connection:**
   - Go to Settings
   - Click "Connect {Platform}"
   - Complete OAuth flow
   - Verify account appears in Settings

### ngrok for Testing

**For platforms that don't allow localhost:**

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
# Update callback URLs in developer consoles
```

### Test Checklist

- [ ] OAuth URL generates correctly
- [ ] State parameter is present
- [ ] User redirects to platform login
- [ ] User can authorize app
- [ ] Callback URL receives code
- [ ] Code exchanges for tokens
- [ ] User profile fetched
- [ ] Tokens saved to database
- [ ] Account appears in Settings
- [ ] Can post with connected account
- [ ] Token refresh works
- [ ] Multi-account support works

---

## Troubleshooting

### Debug OAuth Flow

**Log every step:**
```javascript
console.log('1. Generating OAuth URL:', authUrl);
console.log('2. State:', state);
console.log('3. Callback received:', { code, state });
console.log('4. Token exchange response:', tokens);
console.log('5. User profile:', profile);
console.log('6. Saved to database:', savedAccount);
```

### Common Issues

**"Cannot read property 'access_token'"**
- Token exchange failed
- Check response structure
- Verify credentials

**"State mismatch"**
- State expired (>30 minutes)
- Different browser/device
- Clear cookies and retry

**"Redirect loop"**
- Check callback route exists
- Verify no redirect in callback
- Check for infinite redirects

---

## Production Checklist

- [ ] All callback URLs updated to production domain
- [ ] Environment variables set in production
- [ ] HTTPS enabled (required for OAuth)
- [ ] Token encryption key is secure
- [ ] OAuth state secret is random
- [ ] Webhook endpoints configured
- [ ] Error monitoring enabled
- [ ] Rate limiting implemented
- [ ] Logs anonymized (no tokens)

---

## Resources

- Platform-specific guides in [docs/platforms/](../platforms/)
- [Environment Setup](../getting-started/environment-setup.md)
- [Testing Guide](../deployment/testing-guide.md)

---

**Status:** ✅ Multi-platform OAuth fully implemented  
**Security:** ✅ State-based CSRF protection, encrypted storage  
**Scalability:** ✅ Multi-account, auto-refresh, graceful errors

