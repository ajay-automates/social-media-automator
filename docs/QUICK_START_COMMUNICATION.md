# 🚀 Quick Start: Frontend-Backend Communication

## How It Works (Simple Version)

```
USER → REACT → AXIOS → EXPRESS → SERVICES → EXTERNAL APIs → DATABASE
 👤     ⚛️      📡      🚂        🔧          🌐             🗄️
```

---

## 🔥 Live Example: Creating a Post

### 1. Open Browser Console
```bash
# Visit: http://localhost:3000/dashboard
# Open DevTools: Cmd+Option+I (Mac) or F12 (Windows)
# Go to Network tab
```

### 2. Make a Post
- Click "Create Post"
- Write: "Hello World!"
- Select platforms: Twitter, LinkedIn
- Click "Post Now"

### 3. Watch the Network Request

You'll see:
```
POST /api/post/now

Request Headers:
  Authorization: Bearer eyJhbGci... (JWT token - AUTOMATIC!)
  Content-Type: application/json

Request Body:
  {
    "text": "Hello World!",
    "platforms": ["twitter", "linkedin"]
  }

Response (200 OK):
  {
    "success": true,
    "results": { ... }
  }
```

---

## 📝 Code Location Reference

| What | Where | Lines |
|------|-------|-------|
| **Frontend API Client** | `dashboard/src/lib/api.js` | 1-44 |
| **Auth Token Injector** | `dashboard/src/lib/api.js` | 9-24 |
| **Create Post UI** | `dashboard/src/pages/CreatePost.jsx` | 165-200 |
| **Backend Auth Check** | `server.js` | 102-145 |
| **Post Now Endpoint** | `server.js` | 321-488 |
| **Twitter Service** | `services/twitter.js` | Full file |
| **LinkedIn Service** | `services/linkedin.js` | Full file |

---

## 🎯 Key Files to Understand

### Frontend (3 files)
1. **`dashboard/src/lib/api.js`** - Axios setup + auth interceptor
2. **`dashboard/src/lib/supabase.js`** - Authentication client
3. **`dashboard/src/pages/CreatePost.jsx`** - Example component

### Backend (2 files)
1. **`server.js`** - All API routes + auth middleware
2. **`services/*.js`** - Business logic (Twitter, LinkedIn, etc.)

---

## 🔐 Authentication Flow

```javascript
// 1. User logs in (Frontend)
supabase.auth.signInWithPassword({ email, password })

// 2. Get JWT token (saved in session)
const { data: { session } } = await supabase.auth.getSession()

// 3. Axios automatically adds token to ALL requests
config.headers.Authorization = `Bearer ${session.access_token}`

// 4. Backend verifies token
const { data: { user } } = await supabase.auth.getUser(token)

// 5. User ID available in request
req.user.id // Use this for database queries
```

---

## 🧪 Test It Yourself

### Terminal 1: Watch Backend Logs
```bash
cd /Users/ajaykumarreddy/Projects/social-media-automator
npm start

# You'll see logs like:
# 🤖 AI caption request: topic="tech", niche="AI"
# ✅ Post saved to database (ID: 123)
```

### Terminal 2: Make API Call Directly
```bash
# Get your JWT token from browser DevTools → Application → Local Storage

TOKEN="your_jwt_token_here"

# Test API call
curl -X POST http://localhost:3000/api/health

# Test authenticated call
curl -X GET http://localhost:3000/api/user/accounts \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 All API Endpoints

```bash
# Health check (no auth)
GET  /api/health

# Posts
POST /api/post/now           # Post immediately
POST /api/post/schedule      # Schedule for later
GET  /api/history           # Get post history

# AI
POST /api/ai/generate        # Generate caption
POST /api/ai/image/generate  # Generate image

# Media
POST /api/upload/image       # Upload image/video

# Accounts
GET  /api/user/accounts      # Connected social accounts
POST /api/auth/linkedin/url  # Get LinkedIn OAuth URL
POST /api/auth/twitter/url   # Get Twitter OAuth URL
POST /api/auth/telegram/connect # Connect Telegram bot

# Analytics
GET  /api/analytics/overview  # Dashboard stats
GET  /api/analytics/platforms # Per-platform stats
GET  /api/analytics/timeline  # Activity over time

# Templates
GET  /api/templates          # Get all templates
POST /api/templates          # Create template
PUT  /api/templates/:id      # Update template
DELETE /api/templates/:id    # Delete template

# Billing
GET  /api/billing/usage      # Current usage
GET  /api/billing/plans      # Available plans
POST /api/billing/checkout   # Start subscription
POST /api/billing/portal     # Manage subscription
```

---

## 🎓 Learning Path

1. ✅ **Read this doc** - You are here!
2. 📖 **Read** `docs/FRONTEND_BACKEND_COMMUNICATION.md` - Deep dive
3. 📝 **Open** `dashboard/src/lib/api.js` - See auth setup
4. 🔍 **Inspect** `server.js` line 102-145 - See auth middleware
5. 🧪 **Try** Making a post and watching Network tab
6. 🛠️ **Modify** Add a new API endpoint yourself!

---

## 💡 Pro Tips

### Debugging Frontend
```javascript
// dashboard/src/lib/api.js
api.interceptors.request.use((config) => {
  console.log('📤 Request:', config.method.toUpperCase(), config.url);
  console.log('📦 Data:', config.data);
  return config;
});
```

### Debugging Backend
```javascript
// server.js (add to any route)
console.log('👤 User ID:', req.user.id);
console.log('📦 Request body:', req.body);
console.log('🔑 Headers:', req.headers.authorization);
```

---

## ❓ Common Questions

**Q: Why do I need two node_modules?**
A: Frontend (React) and Backend (Express) are separate apps with different dependencies.

**Q: How does auth work?**
A: JWT token from Supabase → Stored in browser → Axios adds to every request → Backend verifies.

**Q: Where is user data stored?**
A: Supabase PostgreSQL database with Row Level Security (RLS).

**Q: How do I add a new platform?**
A: 1) Create `services/newplatform.js`, 2) Add OAuth route in `server.js`, 3) Add button in `Settings.jsx`.

---

## 🎯 Next Steps

1. ✅ Your server is running at http://localhost:3000
2. 📱 Visit the dashboard and try creating a post
3. 🔍 Open DevTools → Network tab to see the requests
4. 📖 Read the full communication doc for details
5. 🛠️ Start building your own features!

**Happy coding! 🚀**
