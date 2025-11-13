# 🧪 Complete Testing Guide - All New Features

**Date:** November 13, 2025  
**Features to Test:** 5 major features built today

---

## 📋 PRE-TESTING CHECKLIST

### ✅ **Step 1: Run Database Migrations**

Go to Supabase SQL Editor and run these **IN ORDER**:

```sql
-- 1. Content Recycling Engine
-- Copy & paste: migrations/023_add_content_recycling.sql
-- Click "Run" or Ctrl+Enter

-- 2. Webhooks
-- Copy & paste: migrations/024_add_webhooks.sql
-- Click "Run"

-- 3. A/B Testing
-- Copy & paste: migrations/025_add_ab_testing.sql
-- Click "Run"

-- 4. Hashtag Tracker
-- Copy & paste: migrations/026_add_hashtag_tracker.sql
-- Click "Run"
```

**Verify migrations ran successfully:**
```sql
-- Check tables created:
SELECT table_name FROM information_schema.tables 
WHERE table_name IN (
  'content_recycling_settings',
  'content_recycling_history',
  'webhook_endpoints',
  'webhook_logs',
  'ab_tests',
  'ab_test_variations',
  'hashtag_performance',
  'post_hashtags'
);

-- Should return 8 tables ✅
```

### ✅ **Step 2: Verify Railway Deployment**

Check Railway dashboard:
- Status should be: **"Active"** ✅
- Logs should show: No errors ✅

---

## 🧪 **TESTING PLAN**

---

## 1️⃣ **TEST: iOS Dark Calendar** 📅

### **What to Test:**
- New clean, minimal iOS dark mode design
- Advanced filters (search, platform, status, date)
- CSV/iCal export
- Drag-and-drop rescheduling
- Hover preview dismissal

### **Steps:**

1. **Navigate to Calendar:**
   ```
   Production: https://yourdomain.com/calendar
   Local: http://localhost:5173/calendar
   ```

2. **Check Visual Design:**
   - ✅ Black background (#000000)
   - ✅ Dark calendar card (#1c1c1e)
   - ✅ White text
   - ✅ iOS blue accents (#0a84ff)
   - ✅ Clean, minimal design

3. **Test Filters:**
   - Click "Filters" button
   - Try search: Type a word from your posts
   - Select platforms: Click LinkedIn, Twitter
   - Select status: Click "Queued"
   - Set date range: Pick start/end dates
   - Verify: Posts filter correctly
   - Click "Clear All Filters"

4. **Test Export:**
   - Click "CSV" button → Downloads file ✅
   - Open CSV in Excel/Sheets → Verify data ✅
   - Click "iCal" button → Downloads .ics file ✅
   - Import to Google Calendar → Posts appear ✅

5. **Test Drag-Drop:**
   - Hover over a post → Cursor changes to "move" ✅
   - Drag post to different day → Drops successfully ✅
   - Success toast appears ✅
   - Refresh calendar → Post stayed in new location ✅

6. **Test Hover Preview:**
   - Hover over post → Preview appears ✅
   - Move cursor away → Preview disappears instantly ✅
   - Click post → Modal opens ✅

**Expected Result:** ✅ Calendar looks like iOS, all features work

---

## 2️⃣ **TEST: Content Recycling Engine** ♻️

### **What to Test:**
- Recyclable posts detection
- Manual recycling
- Auto-recycle trigger
- Settings configuration
- History tracking

### **Steps:**

1. **Navigate to Content Recycling:**
   ```
   https://yourdomain.com/content-recycling
   ```

2. **Check Stats Dashboard:**
   - ✅ Available to Recycle: Shows count
   - ✅ Total Recycled: Shows 0 (first time)
   - ✅ Recent (30 days): Shows 0
   - ✅ Auto-Recycle: Shows "Disabled"

3. **Configure Settings:**
   - Click "Settings" button
   - Toggle "Auto-Recycle": ON
   - Set "Frequency": Weekly
   - Set "Posts per Cycle": 3
   - Lower "Minimum Age": 7 days (for testing)
   - Lower "Min Success Rate": 50% (for testing)
   - Click "Save Settings"

4. **Check Recyclable Posts:**
   - Go to "Recyclable Posts" tab
   - Should show old posts with 50%+ success rate
   - If empty: Need posts 7+ days old

5. **Test Manual Recycle:**
   - Click "Recycle Now" on any post
   - Confirm dialog
   - Success toast appears ✅
   - Go to "History" tab → See entry ✅
   - Go to Calendar → See scheduled post ✅

6. **Test Auto-Recycle:**
   - Click "Trigger Auto-Recycle Now" button
   - Wait for success message
   - Shows: "Auto-recycled X posts successfully!"
   - Go to Calendar → See multiple scheduled posts ✅
   - Go to History tab → See all entries ✅

**Expected Result:** ✅ Posts get recycled, appear in calendar

---

## 3️⃣ **TEST: Webhook Notifications** 🔔

### **What to Test:**
- Webhook creation
- Test webhook functionality
- Real webhook on post publish
- Logs tracking

### **Steps:**

1. **Get Test Webhook URL:**
   - Go to https://webhook.site
   - Copy your unique URL (e.g., `https://webhook.site/abc-123`)

2. **Navigate to Webhooks:**
   ```
   User Menu (top right) → Webhooks
   OR: https://yourdomain.com/webhooks
   ```

3. **Create Webhook:**
   - Click "Add Webhook" button
   - Fill in:
     * Name: "Test Webhook"
     * URL: (paste webhook.site URL)
     * Events: Check "Post Published Successfully" ✅
     * Events: Check "Post Failed" ✅
     * Platforms: Leave empty (all platforms)
     * Secret: Leave empty
   - Click "Create Webhook"

4. **Test Webhook:**
   - Click "Test" button next to your webhook
   - Wait for success toast
   - Go back to webhook.site
   - Refresh page
   - **See the test payload!** ✅
   ```json
   {
     "event": "test.webhook",
     "timestamp": "...",
     "data": {
       "test": true,
       "message": "This is a test webhook..."
     }
   }
   ```

5. **Test Real Webhook:**
   - Go to Create Post
   - Create a simple post (any platform)
   - Click "Post Now"
   - Go to webhook.site
   - **See the real post data arrive!** ✅
   ```json
   {
     "event": "post.success",
     "data": {
       "post_id": 123,
       "text": "Your caption",
       "platforms": ["linkedin"],
       "status": "posted",
       "results": {...}
     }
   }
   ```

6. **Check Logs:**
   - Go to Webhooks page
   - Click "Logs" tab
   - See both test + real webhook calls ✅
   - Check: Success status, Response time, Status code

**Expected Result:** ✅ Webhooks sent, logged, data visible

---

## 4️⃣ **TEST: A/B Testing Engine** 🧪

### **What to Test:**
- Test creation via API
- Variations auto-scheduling
- Results tracking
- Winner declaration

### **Steps:**

Since frontend isn't built yet, test via API:

1. **Get Your Auth Token:**
   - Open browser DevTools (F12)
   - Go to Application → Local Storage
   - Find: `sb-*-auth-token`
   - Copy the `access_token` value

2. **Create A/B Test (via curl):**
   ```bash
   curl -X POST https://yourdomain.com/api/ab-tests \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test LinkedIn Caption",
       "platforms": ["linkedin", "twitter"],
       "test_duration_hours": 48,
       "variations": [
         {
           "name": "A",
           "caption": "5 tips to boost productivity 🚀 #productivity #tips"
         },
         {
           "name": "B",
           "caption": "How I 10x my productivity (here'\''s how) #productivity #growth"
         }
       ]
     }'
   ```

3. **Check Response:**
   ```json
   {
     "success": true,
     "test": { "id": 1, "name": "Test LinkedIn Caption" },
     "variations": [
       { "variation_name": "A", "post_id": 101 },
       { "variation_name": "B", "post_id": 102 }
     ]
   }
   ```

4. **Verify in Calendar:**
   - Go to Calendar page
   - Should see 2 scheduled posts (A and B) ✅
   - Staggered by 1 hour ✅

5. **Get Test Results:**
   ```bash
   curl -X GET https://yourdomain.com/api/ab-tests/1/results \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

6. **Check Database:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT * FROM ab_tests;
   SELECT * FROM ab_test_variations;
   ```

**Expected Result:** ✅ Test created, posts scheduled, results trackable

---

## 5️⃣ **TEST: Hashtag Performance Tracker** 📊

### **What to Test:**
- Auto-extraction from posts
- Performance tracking
- Top/worst hashtags
- Smart suggestions

### **Steps:**

1. **Create Posts with Hashtags:**
   - Go to Create Post
   - Write caption with hashtags:
     ```
     "Testing hashtag tracker! #AI #SaaS #productivity #testing"
     ```
   - Select platforms
   - Click "Post Now" or schedule

2. **Repeat 3-5 Times:**
   - Create more posts with different hashtags
   - Mix: Some same hashtags, some new
   - This builds data for analytics

3. **Check Auto-Tracking (API):**
   ```bash
   # Get your auth token (from DevTools)
   
   # Get hashtag analytics
   curl -X GET "https://yourdomain.com/api/hashtags/analytics" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

   **Response:**
   ```json
   {
     "totalHashtags": 12,
     "avgSuccessRate": 75,
     "topPerformer": {
       "hashtag": "ai",
       "success_rate": 85,
       "avg_engagement": 120,
       "times_used": 3
     }
   }
   ```

4. **Get Top Hashtags:**
   ```bash
   curl -X GET "https://yourdomain.com/api/hashtags/top?platform=linkedin&limit=10" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

5. **Get Smart Suggestions:**
   ```bash
   curl -X GET "https://yourdomain.com/api/hashtags/suggestions?platform=linkedin" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

   **Response:**
   ```json
   {
     "suggestions": [
       {
         "hashtag": "#AI",
         "success_rate": 85,
         "avg_engagement": 120,
         "times_used": 3
       }
     ]
   }
   ```

6. **Verify Database:**
   ```sql
   -- In Supabase:
   SELECT * FROM hashtag_performance;
   SELECT * FROM post_hashtags;
   SELECT * FROM top_hashtags;
   ```

**Expected Result:** ✅ Hashtags auto-tracked, metrics calculated, suggestions generated

---

## ✅ **SUCCESS CRITERIA**

| Feature | Test | Status |
|---------|------|--------|
| **iOS Calendar** | Filters work | ⬜ |
| **iOS Calendar** | Export CSV/iCal | ⬜ |
| **iOS Calendar** | Drag-drop reschedule | ⬜ |
| **iOS Calendar** | Hover preview dismisses | ⬜ |
| **Content Recycling** | Stats show | ⬜ |
| **Content Recycling** | Manual recycle works | ⬜ |
| **Content Recycling** | Auto-recycle triggers | ⬜ |
| **Webhooks** | Webhook created | ⬜ |
| **Webhooks** | Test sends successfully | ⬜ |
| **Webhooks** | Real post triggers webhook | ⬜ |
| **Webhooks** | Logs show activity | ⬜ |
| **A/B Testing** | Test created via API | ⬜ |
| **A/B Testing** | Posts auto-scheduled | ⬜ |
| **Hashtag Tracker** | Hashtags auto-extracted | ⬜ |
| **Hashtag Tracker** | Performance tracked | ⬜ |
| **Hashtag Tracker** | Suggestions generated | ⬜ |

---

## 🚀 **Quick Test Script**

Want to test everything quickly? Here's a test script:

```bash
#!/bin/bash

# Set your auth token
TOKEN="your-token-here"
BASE_URL="https://yourdomain.com/api"

echo "🧪 Testing Social Media Automator Features..."

# 1. Test Webhooks
echo "\n🔔 Testing Webhooks..."
curl -X GET "$BASE_URL/webhooks" -H "Authorization: Bearer $TOKEN"

# 2. Test Hashtag Analytics
echo "\n📊 Testing Hashtag Analytics..."
curl -X GET "$BASE_URL/hashtags/analytics" -H "Authorization: Bearer $TOKEN"

# 3. Test A/B Tests
echo "\n🧪 Testing A/B Tests..."
curl -X GET "$BASE_URL/ab-tests" -H "Authorization: Bearer $TOKEN"

# 4. Test Content Recycling
echo "\n♻️ Testing Content Recycling..."
curl -X GET "$BASE_URL/content-recycling/stats" -H "Authorization: Bearer $TOKEN"

echo "\n✅ All API endpoints tested!"
```

---

## 🎯 **READY TO TEST?**

**Start with:**
1. Run migrations (5 minutes)
2. Wait for Railway deploy (should be done now)
3. Test Calendar (easiest - visual)
4. Test Webhooks (fun - use webhook.site)
5. Test Recycling (if you have old posts)
6. Test Hashtag Tracker (create posts with hashtags)
7. Test A/B Testing (via API)

**Let me know which one you want to test first!** 🚀

