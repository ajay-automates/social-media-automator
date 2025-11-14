# Chrome Extension Testing Guide

## 🧪 Complete Authentication Flow Test

### Prerequisites
1. Extension must be loaded in Chrome (`chrome://extensions/`)
2. Dashboard must be running at: `https://capable-motivation-production-7a75.up.railway.app/dashboard`

---

## Test Steps

### Step 1: Reload Extension
1. Go to `chrome://extensions/`
2. Find "Social Media Automator - Post This Now"
3. Click the **reload icon** 🔄

### Step 2: Clear Previous Token (Optional)
To test from a clean state:
```javascript
// Run in any page's console
chrome.storage.local.clear()
```

### Step 3: Open Extension Popup
1. Navigate to any webpage (e.g., https://github.com)
2. Click the extension icon in toolbar
3. You should see: **"Authentication Required"** screen

### Step 4: Open Dashboard & Login
1. Click **"Open Dashboard & Login"** button
2. Dashboard should open in a new tab
3. You should see a success message in the popup

### Step 5: Login to Dashboard
1. Go to the dashboard tab that just opened
2. Log in with your credentials
3. **IMPORTANT**: Open DevTools Console (F12) on the dashboard page

### Step 6: Verify Token Sync
Look for these console messages on the dashboard:

```
✅ Expected Console Output:
🔄 Dashboard detected, attempting token sync...
📍 Current URL: https://capable-motivation-production-7a75.up.railway.app/dashboard
🔄 Attempting immediate token sync...
🔑 LocalStorage keys: [array of keys]
🎯 Auth key found: sb-xxxxx-auth-token
📦 Parsed session data: { hasAccessToken: true, hasUser: true, hasUserId: true, userEmail: "your@email.com" }
✅ Valid token found, sending to background...
✅ Token synced from dashboard to extension
```

You should also see a **green notification** appear on screen:
> ✅ Extension authenticated successfully!

### Step 7: Verify Background Script
1. Go to `chrome://extensions/`
2. Find "Social Media Automator - Post This Now"
3. Click **"service worker"** link (or "Inspect views: service worker")
4. Check console for:
```
💾 Saving auth token from dashboard
✅ Token saved to extension storage
```

### Step 8: Refresh Popup
1. Go back to the original webpage
2. Click **"Refresh After Login"** button in the popup
3. Wait 2 seconds
4. Popup should reload and show the main interface with:
   - ✅ Page metadata (title, image, description)
   - ✅ Caption input
   - ✅ Platform checkboxes
   - ✅ Account dropdowns

---

## 🐛 Troubleshooting

### Issue: No console messages on dashboard
**Possible causes:**
- Content script not injected
- URL doesn't match pattern

**Solution:**
1. Check manifest.json `content_scripts.matches` includes `<all_urls>`
2. Reload extension
3. Hard refresh dashboard (Cmd+Shift+R / Ctrl+Shift+R)

### Issue: "No auth key found in localStorage"
**Possible causes:**
- Not logged in to dashboard
- Supabase session not created

**Solution:**
1. Make sure you're fully logged in
2. Check dashboard console for "✅ Session found"
3. Run this in dashboard console:
```javascript
Object.keys(localStorage).filter(k => k.includes('auth'))
```

### Issue: Token synced but refresh doesn't work
**Possible causes:**
- Token not saved to extension storage
- Background script error

**Solution:**
1. Check background script console (chrome://extensions → service worker)
2. Manually check storage:
```javascript
chrome.storage.local.get(['authToken', 'userId'], console.log)
```

### Issue: "Checking for login..." never completes
**Possible causes:**
- Reload logic issue

**Solution:**
1. Close popup
2. Reopen extension
3. Should auto-detect token now

---

## ✅ Success Criteria

Extension is working correctly if:

1. ✅ Login button opens dashboard in new tab
2. ✅ Console shows token sync messages
3. ✅ Green notification appears on dashboard
4. ✅ Background script logs token save
5. ✅ Refresh button reloads popup to main interface
6. ✅ Can see page metadata and platform options

---

## 📊 Test Results Log

| Date | Tester | Result | Notes |
|------|--------|--------|-------|
| 2025-01-13 | - | ⏳ Pending | Initial test |

