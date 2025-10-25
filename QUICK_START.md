# 🚀 Quick Start Guide

**Your Social Media Automator is READY TO USE!**

---

## ✅ **Everything Working**

```
✅ LinkedIn Posting - WORKING
✅ Twitter Posting - WORKING  
✅ Database - CONNECTED
✅ Authentication - WORKING
✅ Scheduling - WORKING
✅ Queue - 30 posts ready
✅ Server - RUNNING
```

---

## 🎯 **How to Use**

### **1. Start the Server**
```bash
cd /Users/ajaykumarreddy/Desktop/PROJECTS/social-media-automator
npm start
```

### **2. Open Dashboard**
```
http://localhost:3000/dashboard
```

### **3. Create a Post**
1. Type your content
2. Check platforms (LinkedIn ✅ Twitter ✅)
3. Click "Post Now" or "Schedule Post"
4. Done! 🎉

---

## 📝 **Key Commands**

### **Start Server**
```bash
npm start
```

### **Stop Server**
```bash
# Press Ctrl+C in terminal
# Or use:
lsof -ti:3000 | xargs kill
```

### **Check Status**
```bash
curl http://localhost:3000/api/health
```

### **View Logs**
```bash
# Server shows logs in terminal
# Look for:
# ✅ Success messages
# ❌ Error messages
```

---

## 🔗 **Important URLs**

### **Local**
- 🏠 Landing: http://localhost:3000
- 🔐 Auth: http://localhost:3000/auth
- 📊 Dashboard: http://localhost:3000/dashboard

### **Production**
- 🌐 Live: https://capable-motivation-production-7a75.up.railway.app

### **Database**
- 🗄️ Supabase: https://supabase.com/dashboard/project/gzchblilbthkfuxqhoyo

---

## 🔑 **Credentials Location**

### **`.env` File** (DO NOT COMMIT)
```
Location: /Users/ajaykumarreddy/Desktop/PROJECTS/social-media-automator/.env

Contains:
- Supabase keys ✅
- Twitter API keys ✅
- Session secrets ✅
```

### **Supabase Database**
```
Table: user_accounts

Contains:
- LinkedIn access tokens ✅
- Twitter access tokens ✅
- User credentials ✅
```

---

## 📊 **What's Working**

### **LinkedIn Posting** ✅
- Post text ✅
- Post with images ✅
- Immediate posting ✅
- Scheduled posting ✅
- Last post: urn:li:share:7387713611382812672

### **Twitter Posting** ✅
- Post tweets ✅
- OAuth 1.0a auth ✅
- Immediate posting ✅
- Scheduled posting ✅
- Last tweet: 1981950768497238083

### **Features** ✅
- Post now ✅
- Schedule posts ✅
- Bulk CSV upload ✅
- Queue management ✅
- Auto-posting (cron) ✅
- Post history ✅
- Multi-tenant ✅

---

## 🟡 **Optional Features (Not Required)**

### **AI Captions**
- Status: Code ready
- Need: Anthropic API key
- Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

### **Stripe Billing**
- Status: Code ready
- Need: Stripe account
- Add price IDs to `.env`

### **Instagram**
- Status: Code ready
- Need: Instagram Graph API access
- Requires Facebook Business account

---

## 🐛 **Troubleshooting**

### **Server Won't Start**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9
# Start again
npm start
```

### **LinkedIn Not Posting**
```
Check:
1. Is LinkedIn access token in .env?
2. Is token expired? (60 days)
3. Check terminal for error messages
```

### **Twitter Not Posting**
```
Check:
1. Are TWITTER_API_KEY and TWITTER_API_SECRET in .env? ✅
2. Is Twitter account in Supabase user_accounts table? ✅
3. Check terminal for "Unauthorized" errors
```

### **Database Error**
```
Check:
1. Is SUPABASE_URL correct? ✅
2. Is SUPABASE_SERVICE_ROLE_KEY set? ✅
3. Visit Supabase dashboard to verify project is running
```

---

## 📁 **File Structure**

```
social-media-automator/
├── .env                    ✅ Your secrets (protected)
├── server.js               ✅ Main server
├── package.json            ✅ Dependencies
│
├── index.html              ✅ Landing page
├── auth.html               ✅ Login/signup
├── dashboard.html          ✅ Main app
│
├── services/
│   ├── linkedin.js         ✅ LinkedIn API
│   ├── twitter.js          ✅ Twitter API
│   ├── database.js         ✅ Supabase
│   ├── scheduler.js        ✅ Cron jobs
│   └── ai.js               🟡 Claude AI (ready)
│
├── migrations/             ✅ Database schemas
└── docs/                   ✅ Documentation
```

---

## 🎯 **Common Tasks**

### **Add a New Post**
1. Open dashboard
2. Type content
3. Select platforms
4. Click "Post Now"

### **Schedule Posts**
1. Open dashboard
2. Type content
3. Select date/time
4. Click "Schedule Post"

### **Upload CSV**
1. Download template
2. Fill with posts
3. Click "Choose CSV File"
4. Review preview
5. Click "Schedule All"

### **View Queue**
1. Scroll to bottom of dashboard
2. See "Scheduled Posts" section
3. View all queued posts
4. Delete if needed

---

## 🚀 **Deploy to Production**

### **Railway (Current)**
```
1. Push to GitHub
2. Railway auto-deploys
3. Add environment variables in Railway dashboard
4. Done!
```

### **Environment Variables Needed**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TWITTER_API_KEY
TWITTER_API_SECRET
SESSION_SECRET
PORT=3000
NODE_ENV=production
```

---

## 📞 **Need Help?**

### **Check Documentation**
- `README.md` - Overview
- `CURRENT_STATUS.md` - What's working
- `NEXT_STEPS.md` - What to do next
- `PROJECT_SUMMARY.md` - Full details

### **Check Logs**
```bash
# Terminal shows all activity:
✅ = Success
❌ = Error
📤 = Posting
🔑 = Auth
```

---

## 🎊 **You're Ready!**

Everything is configured and working:
- ✅ Server running
- ✅ Database connected
- ✅ LinkedIn working
- ✅ Twitter working
- ✅ Posts are being made!

**Just open the dashboard and start posting!** 🚀

---

**Happy Posting!** 🎉

