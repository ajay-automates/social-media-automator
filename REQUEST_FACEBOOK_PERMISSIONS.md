# How to Request Facebook Permissions for Posting

## 🔴 Current Issue
Your app **cannot post** to Facebook Pages because it's missing:
- `pages_read_engagement` ❌
- `pages_manage_posts` ❌

## ✅ Solution: Request Permissions via App Review

### Step 1: Go to App Review
1. Go to: https://developers.facebook.com/apps/2137952033706098/
2. In the left sidebar, click **"Review"**
3. Then click **"Permissions and Features"**

### Step 2: Find Required Permissions
Look for these permissions in the list:
- `pages_read_engagement`
- `pages_manage_posts`

### Step 3: Click "Request" for Each
For each permission:
1. Click the **"Request"** button next to it
2. Fill in the submission form:

#### For `pages_read_engagement`:
- **Use Case:** "I need to read page engagement data and post content to my Facebook Page"
- **How it works:** "Users authorize my app to post content to their Facebook Pages on their behalf using automation"
- **Privacy Policy URL:** (Required - add your privacy policy URL)
- **Data Use:** "I use this to post content that users create in my app to their Facebook Pages"

#### For `pages_manage_posts`:
- **Use Case:** "I need to create and manage posts on Facebook Pages"
- **How it works:** "Users connect their Facebook Page to my app and authorize it to post content they create to their Page"
- **Privacy Policy URL:** (Same as above)
- **Data Use:** "I use this to post text, images, and videos that users create to their Facebook Pages"

### Step 4: Submit for Review
1. Complete all required fields
2. Add a **video demo** (recommended but optional)
3. Click **"Submit for Review"**

### Step 5: Wait for Approval
- Facebook typically reviews within **7 days**
- You'll get an email when reviewed
- Check **"Review"** tab for status updates

---

## 📝 What You Need Before Submitting

### Required:
- ✅ **Privacy Policy URL** - Must be publicly accessible
- ✅ **Use Case Description** - Clear explanation of what you're doing
- ✅ **How it Works** - Step-by-step explanation

### Optional (but helpful):
- 📹 **Video Demo** - Screen recording showing the feature
- 📸 **Screenshots** - Of your app using the feature

---

## 🔍 Current App Status

Your app ID: **2137952033706098**
App Name: **Ajay Automates**

To check your review status:
1. Go to: https://developers.facebook.com/apps/2137952033706098/review/
2. Check **"Permissions and Features"** tab
3. See which permissions are:
   - ✅ **Approved**
   - ⏳ **Pending Review**
   - ❌ **Not Requested**

---

## 🧪 Alternative: Test Token (Development Only)

While waiting for review, you can test using Graph API Explorer:

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select app: **"Ajay Automates"**
3. Get User Access Token with:
   - `pages_show_list`
   - `pages_manage_posts`
   - `pages_read_engagement`
4. Then get page token: `GET /me/accounts`
5. Use that token for testing (temporary)

---

## ⚠️ Important Notes

- **Client Token** (`e7940fc4c34e8ab752a5fdaf216eebf5`) ≠ **Access Token**
- Client token is for app-level authentication
- Access token is what you need for posting
- After approval, reconnect Facebook to get new permissions

---

**Go to App Review → Permissions and Features → Request both permissions!** 🚀

