# Instagram & Facebook Testing Guide

## Quick Start

### Step 1: Start Your Server
```bash
node server.js
```

### Step 2: Connect Your Accounts

#### Option A: Using Dashboard (Recommended)
1. Open your browser: `http://localhost:3000`
2. Sign up/Login
3. Go to **Settings** tab
4. Click **"Connect Instagram"** button
   - Follow OAuth flow
   - Grant permissions
   - Instagram will be connected
5. Click **"Connect Facebook"** button
   - Follow OAuth flow
   - Select which Pages to connect
   - Facebook Pages will be connected

#### Option B: Using API (For Testing)
```bash
# First, get your user ID from Supabase Dashboard
# Then use these API endpoints:

# Connect Instagram
POST /api/auth/instagram/url
# Returns OAuth URL, redirect to it

# Connect Facebook
POST /api/auth/facebook/url
# Returns OAuth URL, redirect to it
```

### Step 3: Verify Accounts Are Connected

Check via Supabase Dashboard:
1. Go to `user_accounts` table
2. Filter by `platform` = 'instagram' or 'facebook'
3. Should see entries with:
   - `status` = 'active'
   - `access_token` = valid token
   - `platform_user_id` = Instagram User ID or Facebook Page ID

---

## Test Methods

### Method 1: Via Dashboard UI (Easiest)

1. Go to **Create Post** page
2. Enter caption
3. Select **Instagram** or **Facebook** (or both)
4. **IMPORTANT for Instagram**: Upload an image or generate one
5. Click **"Post Now"**
6. Check success message
7. Verify post appears on your social media profile

### Method 2: Via Test Script

```bash
# Run the test script
node test_instagram_facebook.js
```

**What it tests:**
- ✅ Connects to database
- ✅ Finds Instagram account
- ✅ Posts image to Instagram
- ✅ Finds Facebook Page
- ✅ Posts text-only to Facebook
- ✅ Posts image to Facebook

---

## Manual Testing Steps

### Test Instagram Posting

**Prerequisites:**
- [ ] Instagram account connected in dashboard
- [ ] Valid access token (not expired)
- [ ] Test image URL (publicly accessible)

**Test Steps:**
1. Go to Create Post
2. Write caption: "🧪 Test post #testing"
3. **Upload image** (Instagram requires media)
4. Select **Instagram** platform
5. Click **"Post Now"**
6. Verify on your Instagram profile

**Expected Result:**
- ✅ Success message appears
- ✅ Post appears on Instagram within 2 minutes
- ✅ Image is posted correctly
- ✅ Caption is included

### Test Facebook Posting

**Prerequisites:**
- [ ] Facebook Page connected in dashboard
- [ ] Valid access token
- [ ] Page admin permissions

**Test Steps:**
1. Go to Create Post
2. Write caption: "🧪 Test post #testing"
3. (Optional) Upload image
4. Select **Facebook** platform
5. Click **"Post Now"**
6. Verify on your Facebook Page

**Expected Result:**
- ✅ Success message appears
- ✅ Post appears on Facebook Page
- ✅ Text and/or image is posted correctly

---

## Testing Scheduled Posts

### Schedule a Post

1. Go to **Create Post** page
2. Enter caption
3. Select **Instagram** or **Facebook**
4. Upload image (for Instagram)
5. Select **Schedule** tab
6. Choose future date/time (e.g., 2 minutes from now)
7. Click **"Schedule Post"**

### Verify Scheduled Post Runs

**Option 1: Check Logs**
```bash
# Watch server logs
# Wait for scheduled time
# Should see:
# "📋 Processing 1 due posts..."
# "✅ Posted to Instagram"
```

**Option 2: Check Dashboard**
1. Go to **Queue** or **History** tab
2. Check post status
3. Should change from "queued" to "posted"

**Option 3: Check Social Media**
1. Visit Instagram/Facebook
2. Check if post appeared at scheduled time

---

## Troubleshooting

### Issue: "No Instagram accounts found"
**Solution:**
- Go to Settings → Connect Instagram
- Complete OAuth flow
- Verify account appears in connected accounts list

### Issue: "Instagram error: Invalid OAuth access token"
**Solution:**
1. Token may be expired (60-day limit)
2. Disconnect and reconnect Instagram account
3. Get new token via OAuth flow

### Issue: "Instagram requires an image"
**Solution:**
- Instagram API only supports posts with media
- Upload an image or generate one with AI
- Text-only posts are not supported

### Issue: "No Facebook Pages found"
**Solution:**
- Go to Settings → Connect Facebook
- Make sure you have admin access to a Facebook Page
- Verify Page is connected (should appear in Settings)

### Issue: "Facebook error: Insufficient permissions"
**Solution:**
1. Ensure `pages_show_list` permission is granted
2. Reconnect Facebook account
3. Grant all requested permissions

### Issue: Scheduled posts not running
**Solution:**
1. Check server is running: `ps aux | grep node`
2. Check scheduler is started: Look for "Queue processor started" in logs
3. Check post status in database: `SELECT * FROM posts WHERE status='queued'`
4. Verify `schedule_time` is in the past

---

## API Testing Examples

### Test Instagram via API
```bash
curl -X POST http://localhost:3000/api/post/now \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "🧪 API Test Post",
    "imageUrl": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    "platforms": ["instagram"]
  }'
```

### Test Facebook via API
```bash
curl -X POST http://localhost:3000/api/post/now \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "🧪 API Test Post",
    "platforms": ["facebook"]
  }'
```

### Schedule via API
```bash
curl -X POST http://localhost:3000/api/post/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "🧪 Scheduled Post",
    "imageUrl": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    "platforms": ["instagram", "facebook"],
    "scheduleTime": "2025-01-28T12:00:00Z"
  }'
```

---

## Database Queries

### Check Connected Accounts
```sql
SELECT 
  id,
  user_id,
  platform,
  platform_name,
  platform_username,
  status,
  token_expires_at,
  connected_at
FROM user_accounts
WHERE platform IN ('instagram', 'facebook')
  AND status = 'active';
```

### Check Scheduled Posts
```sql
SELECT 
  id,
  user_id,
  text,
  platforms,
  schedule_time,
  status,
  created_at
FROM posts
WHERE status = 'queued'
ORDER BY schedule_time;
```

### Check Completed Posts
```sql
SELECT 
  id,
  user_id,
  platforms,
  status,
  result,
  created_at,
  updated_at
FROM posts
WHERE status IN ('posted', 'failed')
ORDER BY updated_at DESC
LIMIT 10;
```

---

## Expected Test Results

### ✅ Successful Instagram Test
```
🧪 Instagram & Facebook Integration Test
==================================================

📱 Testing Instagram Posting...

✅ Found Instagram account: your_instagram_handle
   Access Token: EAAxxxxxxxxxxxxxxxxxxx...
   IG User ID: 17841400000000000

📤 Posting to Instagram...
   📸 Creating IMAGE container...
   ✅ Container created: 123456789
   ✅ Image uploaded to Facebook: 987654321
   📤 Publishing to Instagram...
✅ Instagram: Posted successfully
   Post ID: 18234567890123456

✅ Instagram test successful!
   Post ID: 18234567890123456
   Media Type: IMAGE
```

### ✅ Successful Facebook Test
```
📘 Testing Facebook Posting...

✅ Found Facebook Page: Your Page Name
   Page ID: 123456789012345
   Access Token: EAAxxxxxxxxxxxxxxxxxxx...

📤 Test 1: Posting text-only to Facebook...
📘 Posting text-only to Facebook...
✅ Facebook post successful: 123456789012345_678901234567890

✅ Facebook text-only test successful!
   Post ID: 123456789012345_678901234567890

📤 Test 2: Posting image to Facebook...
📘 Uploading media to Facebook...
✅ Image uploaded to Facebook: 987654321

✅ Facebook image test successful!
   Post ID: 123456789012345_678901234567890
   Permalink: https://www.facebook.com/123456789012345/posts/678901234567890
```

---

## Next Steps

1. ✅ Connect Instagram account
2. ✅ Connect Facebook Page
3. ✅ Test immediate posting
4. ✅ Test scheduled posting
5. ✅ Verify posts appear on social media
6. ✅ Check analytics for post metrics

---

## Common Errors & Solutions

### Error: "Instagram API error: (#100) Media URL not reachable"
**Cause:** Image URL is not publicly accessible  
**Solution:** Use URLs from Cloudinary, Imgur, or Unsplash

### Error: "Facebook API error: (#200) Permissions error"
**Cause:** Insufficient permissions on Facebook Page  
**Solution:** Reconnect Facebook with all permissions

### Error: "Instagram account not found"
**Cause:** Wrong Instagram User ID or account not Business/Creator  
**Solution:** Verify account type in Instagram settings

### Error: "Container processing failed"
**Cause:** Video format or encoding issues  
**Solution:** Use MP4 format, H.264 codec, <100MB, <90 seconds

---

## Monitoring

### Check Server Logs
```bash
# Watch live logs
tail -f server.log

# Or if using PM2
pm2 logs social-media-automator
```

### Monitor Queue
```bash
# Check queue status
curl http://localhost:3000/api/queue

# Check specific user's queue
curl http://localhost:3000/api/queue?userId=USER_ID
```

---

**Happy Testing! 🎉**
