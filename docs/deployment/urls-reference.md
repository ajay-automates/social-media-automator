# URLs Reference Guide

## 🎯 Dashboard URLs

### Local Development
```
Dashboard:         http://localhost:3000/dashboard
Settings:          http://localhost:3000/dashboard/settings
Create Post:       http://localhost:3000/dashboard/create
Analytics:         http://localhost:3000/dashboard/analytics
```

### Production (if deployed)
```
Dashboard:         https://your-domain.com/dashboard
Settings:          https://your-domain.com/dashboard/settings
Create Post:       https://your-domain.com/dashboard/create
Analytics:         https://your-domain.com/dashboard/analytics
```

---

## 🔐 OAuth Callback URLs

### Facebook
- **Local:** `http://localhost:3000/auth/facebook/callback`
- **Production:** `https://your-domain.com/auth/facebook/callback`

### Instagram
- **Local:** `http://localhost:3000/auth/instagram/callback`
- **Production:** `https://your-domain.com/auth/instagram/callback`

### LinkedIn
- **Local:** `http://localhost:3000/auth/linkedin/callback`
- **Production:** `https://your-domain.com/auth/linkedin/callback`

### Twitter
- **Local:** `http://localhost:3000/auth/twitter/callback`
- **Production:** `https://your-domain.com/auth/twitter/callback`

### YouTube
- **Local:** `http://localhost:3000/auth/youtube/callback`
- **Production:** `https://your-domain.com/auth/youtube/callback`

---

## 🧪 Test Image URLs

Use these publicly accessible URLs for testing:

### Placeholder Images
```
https://via.placeholder.com/800x600
https://picsum.photos/800/600
https://placeimg.com/800/600/any
https://source.unsplash.com/800x600/?nature
```

### Sample Images
```
https://picsum.photos/seed/picsum/800/600
https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800
```

### Video URLs (for testing)
```
https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4
```

---

## 📝 Environment Variables (URLs)

Add these to your `.env` file:

```env
# Application URL (for OAuth redirects)
APP_URL=http://localhost:3000                    # Local
# APP_URL=https://your-domain.com                # Production

# Facebook OAuth Redirect
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
# FACEBOOK_REDIRECT_URI=https://your-domain.com/auth/facebook/callback

# Instagram OAuth Redirect
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback
# INSTAGRAM_REDIRECT_URI=https://your-domain.com/auth/instagram/callback
```

---

## 🌐 Facebook Developer Console URLs

### Configure OAuth Redirect URIs
1. Go to: https://developers.facebook.com/apps/
2. Select your app
3. Settings → Basic → Add Platform → Website
4. Site URL: Your app URL
5. Valid OAuth Redirect URIs:
   - `http://localhost:3000/auth/facebook/callback`
   - `https://your-domain.com/auth/facebook/callback`
   - `http://localhost:3000/auth/instagram/callback`
   - `https://your-domain.com/auth/instagram/callback`

---

## 📱 How to Connect Accounts

### Step 1: Go to Settings
- **Local:** http://localhost:3000/dashboard/settings
- **Production:** https://your-domain.com/dashboard/settings

### Step 2: Click Connect Buttons
- Click "Connect Facebook"
- Click "Connect Instagram"

### Step 3: OAuth Flow
1. You'll be redirected to Facebook/Instagram login
2. Authorize the app
3. Redirected back to: `/auth/facebook/callback` or `/auth/instagram/callback`
4. Automatically redirected to: `/dashboard?facebook=connected` or `/dashboard?instagram=connected`

---

## 🔗 API Endpoints

### Post Endpoints
```
POST /api/post/now              # Post immediately
POST /api/post/schedule          # Schedule a post
GET  /api/post/history           # Get post history
```

### Account Endpoints
```
GET  /api/accounts               # Get connected accounts
POST /api/auth/facebook/url       # Get Facebook OAuth URL
POST /api/auth/instagram/url      # Get Instagram OAuth URL
```

### Analytics Endpoints
```
GET /api/analytics/overview      # Analytics overview
GET /api/analytics/timeline      # Timeline data
GET /api/analytics/platforms     # Platform distribution
```

---

## 🚀 Quick Start URLs

1. **Start Server:**
   ```bash
   npm start
   # Server runs on: http://localhost:3000
   ```

2. **Open Dashboard:**
   - http://localhost:3000/dashboard

3. **Connect Accounts:**
   - http://localhost:3000/dashboard/settings

4. **Test Posting:**
   - http://localhost:3000/dashboard/create

---

## 📊 Example Post URLs (after posting)

After successfully posting, you'll get URLs like:

### Facebook
```
https://www.facebook.com/YOUR_PAGE_ID/posts/POST_ID
```

### Instagram
```
https://www.instagram.com/p/POST_ID/
```

### Twitter
```
https://twitter.com/i/web/status/TWEET_ID
```

### LinkedIn
```
https://www.linkedin.com/feed/update/POST_ID
```

### YouTube
```
https://www.youtube.com/shorts/VIDEO_ID
```

---

## ⚙️ Configure in .env

Make sure these URLs match your setup:

```env
# Application
APP_URL=http://localhost:3000

# OAuth Redirects
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback
```

---

**Need help?** Check the main server logs or browser console for any URL-related errors!


