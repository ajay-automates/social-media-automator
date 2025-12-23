# 🔍 Why 2 Servers? Port 3000 vs Port 5173 Explained

## 📊 **The Two Servers**

### **Port 3000 - Backend API Server** (Node.js/Express)
- **Purpose:** Backend API + Auth page
- **Serves:**
  - ✅ API endpoints (`/api/*`)
  - ✅ Auth page (`/auth`)
  - ✅ OAuth callbacks
  - ⚠️ **In PRODUCTION:** Serves built React app from `dashboard/dist`
  - ⚠️ **In DEVELOPMENT:** Only serves auth.html (not the dashboard)

### **Port 5173 - Frontend Dev Server** (Vite)
- **Purpose:** React Dashboard with Hot Reload
- **Serves:**
  - ✅ Latest React source code (from `dashboard/src`)
  - ✅ Hot reload (auto-refresh on code changes)
  - ✅ Proxies API calls to port 3000
  - ✅ Shows latest changes immediately

---

## 🎯 **Why Port 5173 Has Latest Code**

### **Port 5173 (Development)**
- Runs directly from `dashboard/src/` (source code)
- Vite compiles React on-the-fly
- Shows **latest changes** immediately
- Matches production because it's running the **same source code**

### **Port 3000 (Backend)**
- In **development mode:** Only serves API + auth page
- In **production mode:** Serves built files from `dashboard/dist`
- If `dashboard/dist` has old files → shows old code
- Backend code (`server.js`) is always latest, but static files might be outdated

---

## 🔧 **How It Works**

### **Development Setup (What You're Using Now)**
```
┌─────────────────┐
│  Port 5173      │  ← Vite Dev Server (Latest React Code)
│  Dashboard      │     - Serves React from src/
│  (Frontend)     │     - Hot reload enabled
└────────┬────────┘     - Proxies /api → port 3000
         │
         │ API Calls
         ▼
┌─────────────────┐
│  Port 3000      │  ← Backend Server (API + Auth)
│  Backend API    │     - Serves /api/* endpoints
│  (Node.js)      │     - Serves /auth page
└─────────────────┘     - Does NOT serve dashboard in dev mode
```

### **Production Setup (Railway)**
```
┌─────────────────┐
│  Port 3000      │  ← Single Server (Everything)
│  Backend +      │     - Serves API endpoints
│  Built React    │     - Serves built React from dist/
│  (Everything)   │     - Serves auth page
└─────────────────┘     - No separate dev server
```

---

## ✅ **Why Port 5173 Matches Production**

1. **Same Source Code**
   - Port 5173 runs from `dashboard/src/` (latest)
   - Production builds from `dashboard/src/` (latest)
   - Both use the same React components

2. **Hot Reload**
   - Changes in `dashboard/src/` → instantly visible on port 5173
   - No rebuild needed

3. **Production Build Process**
   ```bash
   npm run build  # Builds dashboard/src → dashboard/dist
   # Then Railway serves dashboard/dist on port 3000
   ```

---

## ⚠️ **Why Port 3000 Shows Old Code**

### **If Port 3000 Shows Dashboard:**

1. **Old Build Files**
   - `dashboard/dist/` folder has old built files
   - Backend serves these old files
   - Solution: Rebuild dashboard or delete `dashboard/dist/`

2. **Production Mode Active**
   - `NODE_ENV=production` is set
   - Backend serves from `dashboard/dist`
   - Solution: Use port 5173 for development

3. **Outdated Static Files**
   - Last build was before your latest changes
   - Solution: Run `npm run build` in dashboard folder

---

## 🎯 **What You Should Do**

### **For Development (Latest Code):**
✅ **Use Port 5173** - `http://localhost:5173`
- Latest React code
- Hot reload
- Matches production source

### **For Backend API:**
✅ **Use Port 3000** - `http://localhost:3000/api/*`
- API endpoints
- Auth page (`/auth`)

### **Don't Use Port 3000 for Dashboard in Dev:**
❌ Port 3000 dashboard = Old built files (if they exist)
✅ Port 5173 dashboard = Latest source code

---

## 🔄 **To Update Port 3000 Dashboard (If Needed)**

If you want port 3000 to show latest dashboard:

```bash
# 1. Go to dashboard folder
cd dashboard

# 2. Build latest React app
npm run build

# 3. Restart backend server
# Now port 3000 will serve latest built files
```

**But you don't need to do this!** Just use port 5173 for development.

---

## 📝 **Summary**

| Server | Port | Purpose | Code Status |
|--------|------|---------|-------------|
| **Backend API** | 3000 | API + Auth | ✅ Latest backend code |
| **Frontend Dev** | 5173 | React Dashboard | ✅ Latest React code |
| **Production** | 3000 | Everything | ✅ Latest (built from src) |

**Answer:** Port 5173 shows latest code because it runs directly from source. Port 3000 might show old code if it's serving old built files. **Use port 5173 for development!**

---

## 🚀 **Current Setup (Correct)**

- ✅ **Port 5173** = Dashboard (Latest code) ← **USE THIS**
- ✅ **Port 3000** = API + Auth (Latest backend code)
- ✅ Both servers running correctly
- ✅ Port 5173 matches production because same source code

**Everything is working as intended!** 🎉

