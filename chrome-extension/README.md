# 🚀 Social Media Automator Chrome Extension
## "Post This Now" - Browser Integration

Instantly create and schedule social media posts from any webpage with AI-powered captions and hashtags.

---

## 📋 Features

✅ **One-Click Posting** — Click the extension button on any webpage
✅ **AI Caption Generation** — Get 3 smart caption variations using Claude
✅ **Multi-Platform** — Post to LinkedIn, Twitter, Facebook, Instagram, Reddit, and more
✅ **URL Metadata** — Auto-extracts page title, description, and image
✅ **Character Counter** — Real-time validation per platform
✅ **Scheduling** — Post now or schedule for later
✅ **Account Selection** — Choose which account to post from
✅ **Zero Friction** — No leaving your current tab

---

## 🔧 Installation (Developer Mode)

### Step 1: Download the Extension
```bash
# Clone or download the extension folder:
# /chrome-extension/
```

### Step 2: Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `chrome-extension/` folder
5. Extension appears in your toolbar! ✅

### Step 3: Authenticate
1. Click the extension icon (📱)
2. You'll see an auth error initially
3. Click **"Open Dashboard & Login"**
4. Log in to your Social Media Automator account
5. Auth token is saved in Chrome
6. Return to any webpage and use the extension!

---

## 🎯 How to Use

### Basic Workflow
```
1. Open any webpage you want to share
2. Click 📱 button (bottom-right corner)
3. Extension popup opens with:
   - Page title, image, description (auto-extracted)
   - Caption input box (or click "Generate AI" button)
   - Platform selection (LinkedIn, Twitter, etc.)
   - Account selection (if you have multiple)
4. Choose "Post Now" or "Schedule"
5. Done! Post goes to selected platforms
```

### Using AI Caption Generation
```
1. Click "Generate AI" button
2. Gets 3 smart variations using Claude Sonnet 4
3. Select the variation you like (or edit caption manually)
4. Post or schedule
```

### Scheduling Posts
```
1. Click "Schedule" button
2. Pick date and time in the date picker
3. Click "Schedule" again
4. Post will be scheduled for that time
```

---

## 📁 File Structure

```
chrome-extension/
├── manifest.json                 # Manifest V3 configuration
├── popup.html                    # Popup UI (post composer)
├── popup.js                      # Popup logic & interactions
├── content-script.js             # Injects button into pages
├── background.js                 # Service worker (background tasks)
├── styles/
│   ├── popup.css                 # Popup styling
│   └── content.css               # Button styling
├── utils/
│   ├── constants.js              # Configuration & API endpoints
│   ├── storage.js                # Chrome Storage wrapper
│   └── api-client.js             # API communication
└── icons/
    ├── icon-16.png               # 16x16 (favicon size)
    ├── icon-48.png               # 48x48 (notification)
    ├── icon-128.png              # 128x128 (management page)
    └── icon-512.png              # 512x512 (Chrome Web Store)
```

---

## 🔐 Authentication

### How It Works
1. Extension checks for auth token in Chrome storage
2. If no token: shows "Login" button
3. User clicks "Open Dashboard & Login"
4. Logs in to your Social Media Automator dashboard
5. Token is stored in `chrome.storage.local` (user-specific, encrypted)
6. Extension uses token to call backend API

### Security
- ✅ Tokens stored locally (only this user can access)
- ✅ HTTPS only (no insecure HTTP)
- ✅ JWT token validation on every API call
- ✅ Server-side permission checks
- ✅ No passwords stored

---

## ⚙️ Configuration

### Update Your Domain

Edit `utils/constants.js`:

```javascript
const CONSTANTS = {
  DASHBOARD_URL: 'https://your-domain.com/dashboard',
  API_BASE_URL: 'https://your-domain.com',
  // ... rest of config
};
```

Replace `your-domain.com` with your actual production domain.

### API Endpoints Required

Your backend needs these endpoints (already exist in main app):

```
GET /api/accounts/list
  → Returns user's connected accounts
  
POST /api/ai/generate-caption
  → Generates AI captions using Claude
  
POST /api/posts/create
  → Creates and posts immediately
  
POST /api/posts/schedule
  → Schedules post for later
```

---

## 🐛 Troubleshooting

### Extension doesn't appear?
1. Go to `chrome://extensions/`
2. Verify extension is enabled (toggle ON)
3. Verify folder loaded successfully (should show path)

### "Not authenticated" error?
1. Click "Open Dashboard & Login"
2. Log in to your account
3. Return to webpage with the button and refresh (Cmd+R)

### Button doesn't appear on webpage?
1. Verify extension is enabled in `chrome://extensions/`
2. Refresh the webpage (Cmd+R)
3. Button appears bottom-right corner
4. Check browser console for errors (F12 → Console tab)

### API connection errors?
1. Verify `CONSTANTS.API_BASE_URL` is correct in `utils/constants.js`
2. Verify you're logged in (auth token present)
3. Check that your backend is running
4. Look at browser console (F12) for detailed error messages

---

## 📦 Development

### File Sizes (Optimized)
- manifest.json: ~1 KB
- popup.html: ~4 KB
- popup.js: ~12 KB
- content-script.js: ~2 KB
- background.js: ~1 KB
- styles/popup.css: ~8 KB
- **Total: ~28 KB** (extremely lightweight!)

### Browser Support
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave (Chromium-based)
- ✅ Opera (Chromium-based)

### Performance
- Content script loads instantly
- Popup opens in <200ms
- AI generation: 2-5 seconds (depends on Claude API)
- Posting: 1-2 seconds per platform

---

## 🚀 Deployment

### Phase 1: Self-Hosted (Now)
✅ Users download from GitHub
✅ Users load in Developer Mode
✅ Works immediately
✅ Share with paying customers ($49+ tier)

### Phase 2: Chrome Web Store (Optional, Later)
- Polish extension
- Add store assets (screenshots, description)
- Pay $5 to Google
- Submit for review (3-5 days)
- Users can search & install like Gmail

---

## 📊 Usage Analytics

Track these metrics after launch:
- Daily active users using extension
- Posts created via extension (% of total)
- AI caption generation usage
- Platform distribution of posts
- User retention (7-day, 30-day)

---

## 🔔 Support

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Button not visible | Refresh page (Cmd+R) |
| Can't post | Verify accounts are connected |
| Popup won't open | Check extension is enabled |
| Auth error | Log in again in dashboard |
| AI not working | Check ANTHROPIC_API_KEY in backend |

---

## 📝 Changelog

### v1.0.0 (Initial Release)
- ✅ Basic post creation
- ✅ AI caption generation
- ✅ Multi-platform support
- ✅ Scheduling
- ✅ Account management
- ✅ Authentication via JWT

---

## 🎯 Next Steps

1. **Update `constants.js`** with your domain
2. **Load extension** in Chrome (Developer Mode)
3. **Log in** via dashboard
4. **Test** on any webpage
5. **Share** link with customers

---

## 📄 License

MIT - Same as main Social Media Automator app

---

## 🙋 Questions?

Check `popup.js`, `content-script.js`, and `utils/api-client.js` for detailed code comments.

Happy posting! 🚀
