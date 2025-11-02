# 🔄 Frontend ↔️ Backend Communication Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         React Frontend (dashboard/)                        │  │
│  │  Port: 3000 (production) | 5173 (dev)                     │  │
│  │                                                            │  │
│  │  Components:                                               │  │
│  │  • CreatePost.jsx                                          │  │
│  │  • Analytics.jsx                                           │  │
│  │  • Settings.jsx                                            │  │
│  │  • Templates.jsx                                           │  │
│  │                                                            │  │
│  │  Utilities:                                                │  │
│  │  • api.js (Axios + Auth interceptor)                      │  │
│  │  • supabase.js (Auth client)                              │  │
│  │  • AuthContext.jsx (Session management)                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ HTTP Requests
                              ↕️ (with JWT token)
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Backend (root/)                    │
│                          Port: 3000                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  server.js                                                 │  │
│  │  • API Routes (/api/*)                                     │  │
│  │  • Auth Middleware (verifyAuth)                            │  │
│  │  • Serves React build (production)                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Services:                                                       │
│  • services/ai.js          → Claude AI                          │
│  • services/ai-image.js    → Stability AI                       │
│  • services/linkedin.js    → LinkedIn API                       │
│  • services/twitter.js     → Twitter API                        │
│  • services/instagram.js   → Instagram Graph API                │
│  • services/facebook.js    → Facebook Graph API                 │
│  • services/telegram.js    → Telegram Bot API                   │
│  • services/youtube.js     → YouTube Data API                   │
│  • services/tiktok.js      → TikTok API                         │
│  • services/cloudinary.js  → Media storage                      │
│  • services/database.js    → Supabase queries                   │
│  • services/billing.js     → Stripe payments                    │
└─────────────────────────────────────────────────────────────────┘
                              ↕️
                      External Services
```

---

## 🔐 Authentication Flow

### 1. User Login/Signup
```javascript
// Frontend: dashboard/src/contexts/AuthContext.jsx
supabase.auth.signInWithPassword({ email, password })
          ↓
    Returns JWT token
          ↓
  Stored in session
```

### 2. API Request with Auth
```javascript
// Frontend: dashboard/src/lib/api.js (Axios interceptor)
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    // Attach JWT token to every request
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});
```

### 3. Backend Verification
```javascript
// Backend: server.js (verifyAuth middleware)
async function verifyAuth(req, res, next) {
  const token = req.headers.authorization?.substring(7); // Remove "Bearer "
  
  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.user = { id: user.id, email: user.email }; // Attach user to request
  next();
}
```

---

## 📡 Complete Request Flow Examples

### Example 1: Create a Post

#### **Step 1: User Action (Frontend)**
```jsx
// dashboard/src/pages/CreatePost.jsx (Line 165)
const handleSubmit = async () => {
  try {
    const response = await api.post('/post/now', {
      text: caption,
      imageUrl: image,
      platforms: ['twitter', 'linkedin']
    });
    
    if (response.data.success) {
      showSuccess('Post published!');
    }
  } catch (error) {
    showError(error.message);
  }
};
```

#### **Step 2: API Request (Axios)**
```javascript
// dashboard/src/lib/api.js
POST http://localhost:3000/api/post/now

Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json

Body:
{
  "text": "Hello World!",
  "imageUrl": "https://cloudinary.com/image.jpg",
  "platforms": ["twitter", "linkedin"]
}
```

#### **Step 3: Backend Processing**
```javascript
// server.js (Line 321)
app.post('/api/post/now', verifyAuth, async (req, res) => {
  const userId = req.user.id; // From JWT token
  const { text, imageUrl, platforms } = req.body;
  
  // 1. Check usage limits
  const usageCheck = await checkUsage(userId, 'posts');
  
  // 2. Get user's social media credentials
  const credentials = await getUserCredentialsForPosting(userId);
  
  // 3. Post to each platform
  const results = await postNow(text, imageUrl, platforms, credentials);
  
  // 4. Save to database
  await addPost({ text, imageUrl, platforms, userId });
  
  // 5. Return results
  res.json({ success: true, results });
});
```

#### **Step 4: Platform Services**
```javascript
// services/twitter.js
async function postToTwitter(text, imageUrl, credentials) {
  // Use Twitter API to post
  const response = await axios.post('https://api.twitter.com/2/tweets', {
    text: text
  }, {
    headers: { Authorization: `Bearer ${credentials.access_token}` }
  });
  
  return { success: true, postId: response.data.id };
}
```

#### **Step 5: Response Back to Frontend**
```javascript
Response:
{
  "success": true,
  "results": {
    "twitter": [{ "success": true, "postId": "123456" }],
    "linkedin": [{ "success": true, "postId": "urn:li:share:789" }]
  }
}
```

---

### Example 2: Generate AI Caption

#### **Frontend Call**
```jsx
// dashboard/src/pages/CreatePost.jsx (Line 56)
const generateCaption = async () => {
  const response = await api.post('/ai/generate', {
    topic: 'AI automation',
    niche: 'tech',
    platform: 'linkedin'
  });
  
  setAiVariations(response.data.variations);
};
```

#### **Backend Processing**
```javascript
// server.js (Line 1033)
app.post('/api/ai/generate', verifyAuth, async (req, res) => {
  const userId = req.user.id;
  const { topic, niche, platform } = req.body;
  
  // Check usage limits (Free: 0 AI, Pro: 100/mo, Business: unlimited)
  const usageCheck = await checkUsage(userId, 'ai');
  
  // Call Claude AI service
  const variations = await generateCaption(topic, niche, platform);
  
  // Increment usage counter
  await incrementUsage(userId, 'ai');
  
  res.json({ success: true, variations });
});
```

#### **AI Service**
```javascript
// services/ai.js
async function generateCaption(topic, niche, platform) {
  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-3-5-sonnet-20241022',
    messages: [{
      role: 'user',
      content: `Generate 3 ${platform} captions about ${topic} in ${niche} niche`
    }]
  }, {
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY }
  });
  
  return response.data.variations;
}
```

---

## 🔑 Key Communication Patterns

### 1. **Relative URLs in Production**
```javascript
// dashboard/src/lib/api.js
const api = axios.create({
  baseURL: '/api' // Relative URL works in production!
});

// In production:
// Frontend and backend served from same domain
// Frontend: https://yourapp.com/dashboard
// Backend:  https://yourapp.com/api/*
```

### 2. **CORS in Development**
```javascript
// server.js
app.use(cors()); // Allow all origins in development

// In dev mode:
// Frontend: http://localhost:5173 (Vite dev server)
// Backend:  http://localhost:3000 (Express server)
// CORS allows cross-origin requests
```

### 3. **Auth Interceptor Pattern**
```javascript
// Every API call automatically includes auth token
api.post('/any-endpoint')  // Token added automatically!
         ↓
   Axios Interceptor
         ↓
   Adds: Authorization: Bearer <token>
         ↓
   Backend receives authenticated request
```

### 4. **Error Handling**
```javascript
// Frontend: dashboard/src/lib/api.js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      window.location.href = '/auth'; // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

---

## 📊 API Endpoints Map

| Frontend Call | Backend Route | Auth Required | Service Used |
|--------------|---------------|---------------|--------------|
| `api.post('/post/now')` | `POST /api/post/now` | ✅ | twitter.js, linkedin.js, etc. |
| `api.post('/post/schedule')` | `POST /api/post/schedule` | ✅ | scheduler.js |
| `api.get('/history')` | `GET /api/history` | ✅ | database.js |
| `api.get('/analytics/overview')` | `GET /api/analytics/overview` | ✅ | database.js |
| `api.post('/ai/generate')` | `POST /api/ai/generate` | ✅ | ai.js (Claude) |
| `api.post('/ai/image/generate')` | `POST /api/ai/image/generate` | ✅ | ai-image.js (Stability) |
| `api.post('/upload/image')` | `POST /api/upload/image` | ✅ | cloudinary.js |
| `api.get('/user/accounts')` | `GET /api/user/accounts` | ✅ | oauth.js |
| `api.post('/auth/linkedin/url')` | `POST /api/auth/linkedin/url` | ✅ | oauth.js |
| `api.get('/templates')` | `GET /api/templates` | ✅ | templates.js |
| `api.post('/billing/checkout')` | `POST /api/billing/checkout` | ✅ | billing.js (Stripe) |

---

## 🛡️ Security Features

### 1. **JWT Authentication**
- Every request includes JWT token
- Token verified on backend via Supabase
- User ID extracted from token for multi-tenancy

### 2. **Row Level Security (RLS)**
- Database queries filtered by user_id
- Users can only access their own data
- Implemented in Supabase

### 3. **Rate Limiting (via Billing)**
- Free: 10 posts/month
- Pro: Unlimited posts, 100 AI/month
- Business: Everything unlimited

### 4. **Input Validation**
- Backend validates all inputs
- SQL injection protection via Supabase
- XSS protection via React

---

## 🚀 Production vs Development

### Development Mode:
```bash
# Terminal 1: Backend
npm run dev  # Runs on localhost:3000

# Terminal 2: Frontend
cd dashboard && npm run dev  # Runs on localhost:5173

# Frontend makes requests to: http://localhost:3000/api
```

### Production Mode:
```bash
# Build frontend
cd dashboard && npm run build  # Creates dashboard/dist/

# Start server
npm start  # Serves both API and built React app on port 3000

# Frontend: http://localhost:3000/
# Backend:  http://localhost:3000/api/
# Same origin, no CORS needed!
```

---

## 📝 Summary

1. **Frontend** (React) makes API calls using Axios
2. **Axios interceptor** adds JWT token to every request
3. **Backend** (Express) receives request and verifies token
4. **Auth middleware** extracts user ID from token
5. **Service layer** processes business logic
6. **External APIs** (Twitter, LinkedIn, AI, etc.) are called
7. **Database** (Supabase) stores/retrieves data
8. **Response** sent back to frontend
9. **Frontend** updates UI based on response

**Key Principle:** Frontend and backend are completely separate apps that communicate via HTTP REST API with JWT authentication!

