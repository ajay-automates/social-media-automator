# Facebook Permission Fix - Complete Guide

## 🔴 Current Error
```
(#283) Requires pages_read_engagement permission to manage the object
```

## ✅ Solution: Add All Required Permissions

I've added `pages_read_engagement` to the OAuth scope along with `pages_manage_posts`.

**New Permissions:**
- `pages_show_list` - List pages you manage
- `pages_manage_posts` - Post to pages you manage
- `pages_read_engagement` - **Required for posting** (Facebook API requirement)

---

## ⚠️ IMPORTANT: These Permissions May Require App Review

Facebook may show these permissions as "requires app review" but they should work for:
- Pages you own/manage
- Development/testing environment
- Your own Facebook Pages

---

## 🔄 Action Required: Reconnect Facebook

**You MUST reconnect Facebook** to get the new permissions:

1. **Go to Settings:**
   ```
   http://localhost:3000/dashboard/settings
   ```

2. **Disconnect Facebook:**
   - Find Facebook in connected accounts
   - Click disconnect/remove

3. **Reconnect Facebook:**
   - Click "Connect Facebook"
   - Authorize with ALL permissions (including the new ones)
   - Grant access when prompted

4. **Try Posting Again:**
   - Go to: http://localhost:3000/create
   - Select Facebook
   - Create a post
   - Should work now! ✅

---

## 📝 Permission Details

### Why We Need These Permissions:

1. **`pages_show_list`**
   - Lists Facebook Pages you manage
   - Required to get page IDs
   - Works without app review

2. **`pages_manage_posts`**
   - Allows posting to pages
   - May require app review for public pages
   - Usually works for pages you own

3. **`pages_read_engagement`**
   - Facebook API requires this for posting
   - Even though it's named "read", it's needed for posting
   - May require app review

---

## 🔍 If Permissions Are Rejected

If Facebook says permissions require app review:

1. **Check Facebook Developer Console:**
   - Go to: https://developers.facebook.com/apps/
   - Select your app
   - Check **App Review** → **Permissions and Features**
   - See which permissions need review

2. **For Development:**
   - Permissions should work for YOUR pages
   - Test with pages you own/manage
   - Should work even if "requires review"

3. **For Production:**
   - May need to submit for app review
   - Provide use case and privacy policy
   - Facebook will review and approve

---

## 🧪 Testing After Reconnect

After reconnecting with new permissions, test:

1. **Text-only post** → Should work
2. **Post with image** → Should work
3. **Post with video** → Should work

Check server logs for success:
```
✅ Facebook post successful: [post_id]
```

---

## ❌ If Still Not Working

If you still get permission errors after reconnecting:

1. **Check Token Permissions:**
   - Go to: https://developers.facebook.com/tools/debug/accesstoken/
   - Paste your page access token
   - Check what permissions it has

2. **Verify Page Ownership:**
   - Make sure you're an admin of the page
   - Check: https://www.facebook.com/pages/manage

3. **Alternative: Use Long-Lived Token:**
   - Exchange short-lived token for long-lived
   - Request with all permissions explicitly

---

## 📚 Facebook Documentation

- **Permissions:** https://developers.facebook.com/docs/permissions/reference
- **App Review:** https://developers.facebook.com/docs/app-review
- **Page Tokens:** https://developers.facebook.com/docs/pages/access-tokens

---

**Reconnect Facebook now and try posting again!** 🚀

