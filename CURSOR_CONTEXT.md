# Cursor AI Context - Social Media Automator

## Current State (Oct 30, 2025)

### Working Platforms
- Twitter: Text + Images ✅ (Videos have 403 error)
- LinkedIn: Text + Images ✅ (No video API support)
- Telegram: Text + Images + Videos ✅ FULLY WORKING
- YouTube: Code ready ✅ (Quota exhausted, resets tomorrow)

### Recent Changes
1. Fixed YouTube token auto-refresh
2. Added video attach workflow with preview
3. Fixed LinkedIn crash (const to let)
4. Added database-backed PKCE for Twitter OAuth
5. Cleaned up all test files
6. Added analytics auto-refresh

### Key Files Modified
- services/youtube.js - Token refresh + auto-expire check
- services/oauth.js - Added token_expires_at
- server.js - Global supabaseAdmin + PKCE database storage
- dashboard/src/pages/CreatePost.jsx - Video attach workflow
- dashboard/src/pages/Analytics.jsx - Auto-refresh every 30s

### Known Issues
1. Twitter videos: 403 error (need Elevated API access)
2. YouTube: Quota limit 6/day (need increase request)
3. LinkedIn: No video support (API limitation)

### Important Patterns
- All credentials support both camelCase and snake_case
- Videos detected by: imageUrl.includes('/video/upload/')
- YouTube token refreshes proactively before expiration
- Multi-account support via arrays in credentials object

### Environment
- Production: Railway auto-deploy on push
- Database: Supabase with RLS
- Node: v20+ required for build
