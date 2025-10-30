# Cursor AI Context - Social Media Automator

## Current State (Updated Jan 2025)

### Working Platforms
- **Twitter/X**: Text + Images ✅ (Videos have 403 error - need Elevated API access)
- **LinkedIn**: Text + Images ✅ (No video API support)
- **Telegram**: Text + Images + Videos ✅ FULLY WORKING
- **YouTube**: Video uploads (Shorts) ✅ Code ready (Quota limit: 6/day)
- **Instagram**: Images ✅ (Requires Facebook Page + Business Account)
- **Facebook**: Posts ✅ (Requires Facebook Page)

### Platform Status Summary
| Platform | Text | Images | Videos | Status |
|----------|------|--------|--------|--------|
| Twitter  | ✅   | ✅     | ❌ 403 | Works |
| LinkedIn | ✅   | ✅     | ❌ API | Works |
| Telegram | ✅   | ✅     | ✅     | Fully Working |
| YouTube  | N/A  | N/A    | ✅     | Code Ready |
| Instagram| N/A  | ✅     | ✅     | Needs Setup |
| Facebook | ✅   | ✅     | ❌     | Needs Setup |

### Recent Changes & Production Updates
1. **YouTube Integration**
   - ✅ Token auto-refresh with proactive expiration check
   - ✅ Resumable upload API for videos
   - ✅ #Shorts auto-tagging
   - ✅ Multi-account support

2. **Video Handling**
   - ✅ Video attach workflow with preview in CreatePost.jsx
   - ✅ Cloudinary video upload support
   - ✅ Video detection: `imageUrl.includes('/video/upload/')`

3. **OAuth Improvements**
   - ✅ Database-backed PKCE storage for Twitter OAuth
   - ✅ Token expiration tracking (`token_expires_at`)
   - ✅ Multi-account OAuth flows

4. **Analytics & UX**
   - ✅ Auto-refresh every 30 seconds
   - ✅ Window focus refresh
   - ✅ Real-time post history
   - ✅ Platform statistics

5. **Scheduler**
   - ✅ Multi-tenant queue processing
   - ✅ Instagram/Facebook/YouTube support
   - ✅ Post status tracking (queued/posted/failed/partial)

### Key Files Structure
```
server.js                  # Main Express server (2586 lines)
├── Auth middleware        # Supabase JWT verification
├── Static file serving    # React dashboard dist folder
├── API routes            # All /api/* endpoints
└── OAuth callbacks       # LinkedIn, Twitter, Instagram, Facebook, YouTube

services/
├── youtube.js            # Token refresh + upload logic
├── oauth.js              # All OAuth flows + credential management
├── twitter.js            # OAuth 1.0a + 2.0 support
├── linkedin.js           # Text + image posting
├── telegram.js           # Bot API integration
├── instagram.js          # Facebook Graph API integration
├── facebook.js           # Page posting
├── scheduler.js          # Cron-based queue processor
└── database.js           # Supabase operations

dashboard/src/pages/
├── CreatePost.jsx        # Video attach workflow + AI generation
├── Analytics.jsx         # Auto-refresh + post history
└── Settings.jsx          # Account management
```

### Important Code Patterns

#### Credential Format
- Supports both `camelCase` and `snake_case` for compatibility
- Multi-account: Arrays in credentials object (e.g., `credentials.twitter[]`)
- Database: All credentials stored in `user_accounts` table with RLS

#### Video Detection
```javascript
// Pattern used throughout codebase
const isVideo = imageUrl && imageUrl.includes('/video/upload/');
```

#### YouTube Token Refresh
- Proactive refresh: Checks `token_expires_at` before expiration
- Buffer: 5 minutes before expiration
- Auto-saves refreshed token to database
- Uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations

#### OAuth State Management
- Twitter: PKCE stored in `oauth_states` table
- LinkedIn/Instagram/Facebook: Encrypted state with `encryptState()`
- All states expire after 30 minutes

#### Post Status Flow
```
queued → (processing) → posted | failed | partial
```

#### Multi-Tenant Architecture
- All queries filtered by `user_id`
- RLS policies enforce data isolation
- Admin client (`supabaseAdmin`) bypasses RLS for backend operations

### Environment Variables (Critical)
```bash
# Supabase (Database + Auth)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # Used for global admin client (line 96-99)
SUPABASE_SERVICE_KEY=       # Used in OAuth callbacks (lines 1327, 1559, 1876, 1963, 2525)
                             # NOTE: Check production - may need both or just one

# OAuth Credentials
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_API_KEY=           # OAuth 1.0a for media uploads
TWITTER_API_SECRET=        # OAuth 1.0a for media uploads
INSTAGRAM_APP_ID=          # Facebook App ID
INSTAGRAM_APP_SECRET=      # Facebook App Secret
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

# AI Services
ANTHROPIC_API_KEY=         # Claude for captions
STABILITY_API_KEY=         # Stability AI for images

# Storage
CLOUDINARY_URL=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
APP_URL=                   # For OAuth redirects
SESSION_SECRET=
```

### Known Issues & Limitations

1. **Twitter Videos**
   - 403 error on video uploads
   - Need Elevated API access tier
   - Workaround: Use OAuth 1.0a credentials

2. **YouTube Quota**
   - Default: 6 uploads per day
   - Can request quota increase from Google Cloud Console

3. **LinkedIn Videos**
   - No video API support (LinkedIn limitation)
   - Only text and images supported

4. **Instagram Requirements**
   - Must link Instagram Business/Creator account to Facebook Page
   - Requires Facebook App with Instagram Basic Display permissions

5. **Facebook Requirements**
   - Requires Facebook Page (not personal profile)
   - Needs `pages_show_list` permission

### Database Schema Key Points

**user_accounts** table:
- `user_id` - Foreign key to auth.users
- `platform` - Platform name (linkedin, twitter, etc.)
- `access_token` - OAuth access token
- `refresh_token` - OAuth refresh token or OAuth 1.0a secret
- `token_expires_at` - Token expiration timestamp
- `platform_user_id` - Platform-specific user ID
- `platform_username` - Display name
- `status` - active | expired | disconnected

**posts** table:
- `user_id` - Multi-tenant isolation
- `text` - Post content
- `image_url` - Cloudinary URL (can be video)
- `platforms` - JSON array of platforms
- `schedule_time` - When to post
- `status` - queued | posted | failed | partial
- `results` - JSON object with platform results

**oauth_states** table:
- Stores PKCE code_verifier for Twitter OAuth
- Expires after 30 minutes
- Used for server restart recovery

### Deployment
- **Platform**: Railway
- **Auto-deploy**: On push to main branch
- **Node Version**: v20+ required
- **Build**: `npm run build` (builds React dashboard)
- **Environment**: Production config in Railway dashboard

### Code Inconsistencies Found
⚠️ **SUPABASE_SERVICE_KEY vs SUPABASE_SERVICE_ROLE_KEY**
- Global `supabaseAdmin` (line 96-99) uses `SUPABASE_SERVICE_ROLE_KEY`
- OAuth callbacks (lines 1327, 1559, 1876, 1963, 2525) create new clients with `SUPABASE_SERVICE_KEY`
- **Action**: Verify production env vars - may need both set to same value, or standardize to `SUPABASE_SERVICE_ROLE_KEY`

### Testing Checklist
- [ ] LinkedIn OAuth flow
- [ ] Twitter OAuth flow (PKCE)
- [ ] Telegram bot connection
- [ ] YouTube OAuth + token refresh
- [ ] Instagram OAuth (requires Facebook Page)
- [ ] Facebook OAuth (requires Facebook Page)
- [ ] Post to all platforms
- [ ] Video upload to Cloudinary
- [ ] YouTube Short upload
- [ ] Analytics auto-refresh
- [ ] Multi-account posting
- [ ] Template system
- [ ] Billing/usage limits

### Files Reviewed (Production Code)
✅ **Core Files**
- `server.js` (2586 lines) - Main Express server
- `services/youtube.js` - YouTube token refresh & upload
- `services/oauth.js` - All OAuth flows
- `services/twitter.js` - Twitter OAuth 1.0a + 2.0
- `services/linkedin.js` - LinkedIn posting
- `services/telegram.js` - Telegram bot API
- `services/instagram.js` - Instagram Graph API (with polling)
- `services/facebook.js` - Facebook Page posting
- `services/scheduler.js` - Cron-based queue processor
- `services/database.js` - Supabase operations
- `services/accounts.js` - Legacy multi-account (5 accounts)

✅ **Frontend Files**
- `dashboard/src/pages/CreatePost.jsx` - Video attach workflow
- `dashboard/src/pages/Analytics.jsx` - Auto-refresh analytics
- `dashboard/src/pages/Settings.jsx` - Account management

✅ **Documentation**
- `CURSOR_CONTEXT.md` - This file (updated)
- `PROJECT_SUMMARY.md` - Full project overview
- `PROJECT_STRUCTURE.md` - File structure

### Quick Reference Commands
```bash
# Development
npm run dev           # Start with nodemon
npm run build         # Build React dashboard

# Production
npm start             # Start server
npm run build         # Build dashboard before deploy

# Testing
# Health check: GET /api/health
# Queue: GET /api/queue
# History: GET /api/history
```
