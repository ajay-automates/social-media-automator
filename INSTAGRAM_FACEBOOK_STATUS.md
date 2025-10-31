# Instagram & Facebook Status

## 🔴 Current Issue: Both Need App Review

**Instagram and Facebook both have the same problem:**
- Both require `pages_read_engagement` permission
- This permission is **invalid** in OAuth scope (Facebook rejects it)
- Both need **App Review** to get the permission

---

## 📊 Comparison

### Instagram OAuth Permissions Requested:
```
instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement
```

**Status:**
- ❌ `pages_read_engagement` - Invalid scope (will be rejected)
- ❌ `instagram_content_publish` - May require app review
- ✅ `pages_show_list` - Works without app review
- ✅ `instagram_basic` - May work without app review

### Facebook OAuth Permissions Requested:
```
pages_show_list
```

**Status:**
- ✅ `pages_show_list` - Works (currently only one)
- ❌ `pages_read_engagement` - Required for posting (not in scope - invalid)
- ❌ `pages_manage_posts` - Required for posting (not in scope - invalid)

---

## 🎯 What Happens When You Try to Connect

### Instagram:
1. OAuth URL includes `pages_read_engagement`
2. Facebook will reject it as "Invalid Scope"
3. Connection will fail
4. **Same issue as Facebook**

### Facebook:
1. OAuth URL only has `pages_show_list` (valid)
2. Connection works ✅
3. But posting fails ❌ (missing permissions)

---

## ✅ Solution: Same for Both

**Wait for App Review:**
- You've submitted business verification
- Request permissions via App Review
- Wait for approval (~7-14 days)
- Once approved, both Instagram and Facebook will work

---

## 🔧 Quick Fix: Remove Invalid Permission from Instagram

Since Instagram OAuth includes `pages_read_engagement` (invalid), it will fail to connect.

**Option 1: Remove it temporarily (can connect but can't post)**
```javascript
// Change Instagram OAuth scope to:
'instagram_basic,instagram_content_publish,pages_show_list'
// Remove: pages_read_engagement
```

**Option 2: Keep it (will fail OAuth but request permission)**
- Let it fail (Facebook will show invalid scope)
- Still request permission via App Review
- After approval, it will work

---

## 📝 Recommended Action

### For Now:
1. **Instagram:** Will fail to connect (invalid scope)
2. **Facebook:** Connects but can't post (missing permissions)

### After App Review Approval:
1. **Instagram:** Will connect and post ✅
2. **Facebook:** Will post ✅

---

## ⏳ Timeline

**Current:**
- ✅ Business verification submitted
- ⏳ Waiting for review

**After Review:**
- ✅ Permissions approved
- ✅ Instagram can connect
- ✅ Facebook can post
- ✅ Instagram can post

---

**Bottom Line:** Instagram will have the same issue until app review is approved. For now, Instagram connection will fail due to invalid scope. Once app review approves the permissions, both will work!

