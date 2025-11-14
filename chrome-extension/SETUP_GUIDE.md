# 🎯 Chrome Extension Setup Guide
## Complete Step-by-Step Instructions

---

## ✅ Pre-Flight Checklist

Before you start:
- [ ] Chrome browser installed
- [ ] Social Media Automator dashboard access
- [ ] Extension files downloaded/cloned

---

## 🔧 Installation Steps

### Step 1: Enable Developer Mode
```
1. Open Chrome
2. Go to chrome://extensions/
3. Look for "Developer mode" toggle in TOP RIGHT
4. Click it to enable (should turn blue)
```

### Step 2: Load the Extension
```
1. Still on chrome://extensions/ page
2. Click "Load unpacked" button (appears after enabling Developer mode)
3. Select the "chrome-extension" folder from your downloads
4. Click "Select Folder"
```

**You should see:**
```
✅ Extension appears in your list
✅ Shows extension ID
✅ Shows version 1.0.0
✅ Extension enabled (toggle is ON)
```

### Step 3: Configure Your Domain

Edit this file in the extension:
```
chrome-extension/utils/constants.js
```

Change this line:
```javascript
DASHBOARD_URL: 'https://your-domain.com/dashboard',
API_BASE_URL: 'https://your-domain.com',
```

To your actual domain:
```javascript
DASHBOARD_URL: 'https://capable-motivation-production-7a75.up.railway.app/dashboard',
API_BASE_URL: 'https://capable-motivation-production-7a75.up.railway.app',
```

### Step 4: Reload Extension

After editing `constants.js`:
```
1. Go back to chrome://extensions/
2. Find your extension
3. Click the refresh icon (bottom of the extension card)
4. Extension reloads with new configuration
```

---

## 🔐 Authenticate

### Step 1: Open Dashboard
```
1. Go to any website (e.g., reddit.com)
2. You'll see the button won't work yet (no auth token)
3. Go to your dashboard: https://your-domain.com/dashboard
4. Log in with your account
```

### Step 2: Auth Token is Saved
```
- After logging in, your auth token is automatically saved in Chrome
- This happens in the browser automatically
- You don't need to do anything!
```

### Step 3: Test the Extension
```
1. Go to any webpage (e.g., techcrunch.com)
2. Click the 📱 "Post" button (bottom-right corner)
3. Should see popup with:
   - Page title, image, description
   - Caption input
   - Platform selection
   - Account selection
4. Done! Ready to post
```

---

## 📝 First Post (Test)

### Step 1: Capture Content
```
1. Go to any article you want to share
2. Click 📱 button
3. Popup opens showing page details
```

### Step 2: Write Caption
```
1. Type a caption in the text box
   OR
   Click "✨ Generate AI" to get suggestions
2. Select platforms (LinkedIn, Twitter, etc.)
3. Pick account if you have multiple
```

### Step 3: Post
```
1. Click "Post Now" for immediate posting
   OR
   Click "Schedule" to pick a date/time
2. Confirm dialog
3. Success! ✅
```

---

## 🐛 Troubleshooting

### "Not authenticated" Error

**Problem:** You see a lock icon and "Authentication Required"

**Solution:**
```
1. Open dashboard: https://your-domain.com/dashboard
2. Make sure you're logged in
3. Go to any website
4. Refresh the page (Cmd+R)
5. Try clicking the button again
```

**If still not working:**
```
1. Go to chrome://extensions/
2. Refresh the extension (refresh icon)
3. Clear Chrome cache (Cmd+Shift+Delete)
4. Log out of dashboard
5. Log in again
6. Try again
```

---

### Button Not Visible

**Problem:** Can't see the 📱 button on webpages

**Solution:**
```
1. Go to chrome://extensions/
2. Check if extension is enabled (toggle should be ON/BLUE)
3. If OFF, click to enable
4. Go to any website
5. Refresh page (Cmd+R)
6. Button should appear in bottom-right corner
```

**If still not visible:**
```
1. Check browser console for errors (F12 → Console tab)
2. Verify extension loaded successfully (should show path)
3. Try a different website
4. Restart Chrome completely (close and reopen)
```

---

### Popup Won't Open

**Problem:** Clicking button does nothing

**Solution:**
```
1. Check browser console (F12 → Console tab)
2. Look for red error messages
3. Common fixes:
   - Verify domain in constants.js is correct
   - Make sure auth token is saved (log in again)
   - Refresh extension in chrome://extensions/
```

---

### "API Connection Error"

**Problem:** Popup opens but shows API error

**Solution:**
```
1. Verify domain in constants.js:
   DASHBOARD_URL: 'https://your-domain.com/dashboard',
   API_BASE_URL: 'https://your-domain.com',
   
2. Make sure your backend is running:
   npm start
   
3. Check that your domain is accessible:
   - Open https://your-domain.com in browser
   - Should load dashboard
   
4. Log out and log in again:
   - Clear auth token
   - Log in fresh
   - Retry
```

---

## 📱 Icon Customization (Optional)

To add custom icons for different sizes:

```
Create these files in chrome-extension/icons/:
- icon-16.png   (16x16 pixels)
- icon-48.png   (48x48 pixels)
- icon-128.png  (128x128 pixels)
- icon-512.png  (512x512 pixels)

Then reload extension in chrome://extensions/
```

Current setup uses Chrome's default icons.

---

## 🚀 Sharing with Customers

### Step 1: Prepare Distribution

```bash
# In your project root:
cd chrome-extension

# Create a ZIP file
zip -r social-media-automator-extension.zip .

# This creates: social-media-automator-extension.zip
```

### Step 2: Upload to GitHub Release

```
1. Go to GitHub repo
2. Click "Releases" (right side)
3. Click "Create a new release"
4. Upload the ZIP file
5. Name it "v1.0.0 - Chrome Extension"
6. Add description:
   
   📱 Social Media Automator Chrome Extension
   
   One-click social media posting from any webpage.
   
   Installation:
   1. Download & extract this ZIP
   2. Go to chrome://extensions/
   3. Enable Developer mode
   4. Click "Load unpacked"
   5. Select the extracted folder
   6. Log in with your dashboard account
   7. Done! Use on any website
   
7. Publish release
```

### Step 3: Share Link

Send customers this link:
```
https://github.com/ajay-automates/social-media-automator/releases/tag/v1.0.0

OR create a guide:
https://your-domain.com/help/chrome-extension
```

---

## 📊 Monitoring Usage

After release, track:
```
- How many customers installed extension?
- How often is it used daily?
- Which platforms do they post to?
- Average posts per user per day?
```

Check in your database:
```sql
SELECT 
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_posts,
  COUNT(CASE WHEN post_metadata->>'fromExtension' = 'true' THEN 1 END) as extension_posts
FROM posts
WHERE created_at > NOW() - INTERVAL 7 days;
```

---

## 🎓 Advanced: Deep Linking from Dashboard

You can add a button in your dashboard that opens the extension directly:

```javascript
// In your dashboard, add this button:
<button onClick={() => {
  // Tells extension to open popup
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }
}}>
  📱 Post from Extension
</button>
```

---

## 📚 Documentation for Users

### Create a Help Page

Add to your dashboard website:
```html
/help/chrome-extension/

Shows:
1. Installation guide (this document)
2. How to use guide
3. Troubleshooting
4. FAQ
5. Video tutorial (optional)
```

---

## ✨ Done!

You're all set! 🎉

### Next Steps:
1. ✅ Load extension in Chrome
2. ✅ Update constants.js with your domain
3. ✅ Test with your account
4. ✅ Share with customers
5. ✅ Monitor usage

---

## 🤔 FAQ

**Q: Do users need Developer Mode?**
A: YES (for now). Later we'll submit to Chrome Web Store for one-click install.

**Q: Is it safe?**
A: YES. Uses OAuth tokens, HTTPS, and server-side validation.

**Q: Can multiple people use it?**
A: YES. Each person loads it separately with their own auth.

**Q: What if I update the extension?**
A: Users need to refresh the extension in chrome://extensions/

**Q: Can I submit to Chrome Web Store?**
A: YES, but requires Google review (3-5 days). Optional.

---

## 📞 Support

If customers have issues:
1. Check troubleshooting section above
2. Ask them to share browser console errors (F12)
3. Verify their domain in constants.js
4. Try reloading the extension

---

Created: November 13, 2025
Last Updated: November 13, 2025
