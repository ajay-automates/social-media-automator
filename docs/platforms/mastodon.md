# 🐘 Mastodon Integration

Complete guide for integrating Mastodon with Social Media Automator.

---

## 📋 **Overview**

**Mastodon** is a decentralized, open-source social network. Unlike centralized platforms, Mastodon is made up of thousands of independent "instances" (servers), each with its own community and rules.

### **Key Features:**
- ✅ **Decentralized** - No single company owns it
- ✅ **500 characters** per post (configurable per instance)
- ✅ **Media support** - Images, videos, GIFs
- ✅ **Hashtags** - For discoverability
- ✅ **Visibility controls** - Public, Unlisted, Private, Direct
- ✅ **Open API** - Easy integration

---

## 🔑 **Prerequisites**

1. **A Mastodon Account** on any instance:
   - mastodon.social (largest)
   - mastodon.online
   - mas.to
   - techhub.social
   - Or any other instance: https://joinmastodon.org/servers

2. **Create an Application** on your instance

---

## 📝 **Setup Instructions**

### **Step 1: Create a Mastodon Account** (if you don't have one)

1. Go to **https://joinmastodon.org/servers**
2. Pick an instance (e.g., `mastodon.social`)
3. Sign up (it's free!)
4. Confirm your email

### **Step 2: Create an Application**

1. **Log in** to your Mastodon account
2. Go to **Settings → Development** or visit:
   ```
   https://[your-instance]/settings/applications
   ```
   Example: `https://mastodon.social/settings/applications`

3. Click **"New Application"**

4. Fill in the application details:

```
Application Name:
Social Media Automator

Application Website:
https://socialmediaautomator.com

Redirect URI:
urn:ietf:wg:oauth:2.0:oob
```

5. **Scopes** - Select these permissions:
   - ☑ `read:accounts` - Read account information
   - ☑ `write:statuses` - Post statuses
   - ☑ `write:media` - Upload media

6. Click **"Submit"**

### **Step 3: Get Your Access Token**

After creating the app, you'll see:
- **Client key** (Client ID)
- **Client secret**
- **Your access token** ← This is what you need!

Copy the **access token** - it looks like:
```
BflDERF7-N-BT2jpPkM_uwpRNsZyLGpvJdClSMFdxSo
```

### **Step 4: Connect in Social Media Automator**

1. Go to **Connect Accounts** page
2. Click the **Mastodon** button
3. Enter:
   - **Instance URL**: Your Mastodon instance (e.g., `mastodon.social`)
   - **Access Token**: The token you copied
4. Click **"Connect"**

---

## ✨ **Features**

### **What You Can Do:**
- ✅ Post text updates (up to 500 characters)
- ✅ Share images
- ✅ Use hashtags for discoverability
- ✅ Schedule posts
- ✅ Post to multiple Mastodon accounts (different instances)
- ✅ View post analytics

### **Content Formatting:**
- **Character limit**: 500 characters (default, configurable per instance)
- **Hashtags**: Use `#hashtag` format
- **Mentions**: Use `@username@instance.social` format
- **Links**: Automatically shortened by most instances
- **Media**: Supports images (JPEG, PNG, GIF, WebP)

### **Visibility Options:**
- **Public** - Visible on public timelines
- **Unlisted** - Not on public timelines, but visible if linked
- **Private** - Followers only
- **Direct** - Mentioned users only

*Currently, all posts from Social Media Automator are set to **Public**.*

---

## 🎯 **Best Practices**

### **1. Choose the Right Instance**
- **General instances**: mastodon.social, mastodon.online
- **Tech-focused**: techhub.social, fosstodon.org
- **Creative**: mastodon.art
- Each instance has its own community and vibe!

### **2. Use Hashtags**
Mastodon relies heavily on hashtags for discovery:
```
Check out my new project! #WebDev #OpenSource #IndieHacker
```

### **3. Engage with the Community**
- Reply to others' posts
- Boost (repost) interesting content
- Use Content Warnings (CW) when appropriate

### **4. Respect Instance Rules**
Each instance has its own code of conduct. Read and follow them!

### **5. Cross-Post Smartly**
- Mastodon users value authentic engagement
- Don't just auto-post from Twitter/X
- Tailor content for the Mastodon audience

---

## 📊 **Character Limits**

| Content Type | Limit |
|--------------|-------|
| Status text  | 500 characters (default) |
| Username     | 30 characters |
| Display name | 30 characters |
| Bio          | 500 characters |
| Image alt text | 1,500 characters |

**Note:** Some instances have custom character limits (e.g., 1,000 or 5,000 characters).

---

## 🔧 **Troubleshooting**

### **"Invalid Mastodon credentials" Error**

**Possible causes:**
1. **Wrong access token** - Double-check you copied it correctly
2. **Wrong instance** - Make sure the instance URL matches where you created the app
3. **Expired token** - Mastodon tokens don't expire, but you may have revoked the app

**Solution:**
- Go to your instance's applications page
- Click on your app
- Copy the access token again
- Try reconnecting

### **"Failed to post to Mastodon" Error**

**Possible causes:**
1. **Character limit exceeded** - Posts are truncated to 500 characters
2. **Image upload failed** - Check image format (JPEG, PNG, GIF, WebP)
3. **Instance is down** - Check your instance's status page
4. **Rate limited** - Mastodon has rate limits (300 posts per 3 hours for most instances)

**Solution:**
- Check post length (max 500 chars)
- Verify image format and size
- Check instance status: `https://[your-instance]/health`
- Wait if rate limited

### **"App not found" in Settings**

**Solution:**
- You may be looking at the wrong instance
- Try: `https://[your-instance]/settings/applications`
- If it's not there, you need to create a new app

---

## 🌍 **Mastodon vs. Twitter/X**

| Feature | Mastodon | Twitter/X |
|---------|----------|-----------|
| Ownership | Decentralized | Centralized (X Corp) |
| Character limit | 500+ (configurable) | 280 |
| Ads | None | Yes |
| Algorithm | Chronological | Algorithmic |
| Edit posts | Yes | Yes (Premium only) |
| Federation | Yes (across instances) | No |
| Open source | Yes | No |

---

## 🔗 **Useful Links**

- **Mastodon Homepage**: https://joinmastodon.org
- **Find an Instance**: https://joinmastodon.org/servers
- **Mastodon API Docs**: https://docs.joinmastodon.org/api/
- **Mastodon Apps**: https://joinmastodon.org/apps
- **Mastodon Roadmap**: https://joinmastodon.org/roadmap

---

## ⚡ **Quick Reference**

### **Connect Mastodon:**
```
1. Create app at: https://[instance]/settings/applications
2. Get access token
3. Connect in Social Media Automator
```

### **Post Format:**
```
Text (max 500 chars)
Optional image
Hashtags for discovery
```

### **Environment Variables:**
```bash
# Not needed for user connections (they use their own tokens)
# These are only if you want to use a default app for OAuth flow
MASTODON_CLIENT_KEY=your_client_key_here
MASTODON_CLIENT_SECRET=your_client_secret_here
MASTODON_INSTANCE=mastodon.social
```

---

## 💡 **Pro Tips**

1. **Use Alt Text**: Mastodon community values accessibility - add alt text to images!
2. **Content Warnings**: Use CW for sensitive topics
3. **Local vs Federated**: 
   - Local timeline = your instance only
   - Federated timeline = all connected instances
4. **Follow Hashtags**: You can follow hashtags to discover content
5. **Instance Migration**: You can move your account between instances!

---

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ Account shows as "Connected" in dashboard
- ✅ Posts appear on your Mastodon profile
- ✅ Post URL is visible in analytics
- ✅ Engagement metrics are tracked

---

## 📞 **Support**

Having issues? Check:
1. This documentation
2. Your instance's status page
3. Mastodon API docs: https://docs.joinmastodon.org/api/
4. Our support team

---

**Last Updated**: November 8, 2025  
**Integration Status**: ✅ Fully Working  
**Difficulty**: ⭐⭐ Easy  
**Setup Time**: 5-10 minutes

