# 🦋 Bluesky Integration

Complete guide for integrating Bluesky with Social Media Automator.

---

## 📋 **Overview**

**Bluesky** is a decentralized social network built on the AT Protocol (Authenticated Transfer Protocol). It's designed to be an open, user-controlled alternative to Twitter/X.

### **Key Features:**
- ✅ **Decentralized** - Built on AT Protocol
- ✅ **300 characters** per post
- ✅ **Media support** - Up to 4 images per post
- ✅ **App Passwords** - No OAuth approval needed!
- ✅ **Open API** - Easy integration
- ✅ **Growing community** - 1M+ users and growing fast

---

## 🔑 **Prerequisites**

1. **A Bluesky Account**
   - Sign up at: https://bsky.app
   - You may need an invite code (check Twitter/X or community forums)

2. **Create an App Password**
   - Go to Settings → App Passwords
   - Generate a new password for Social Media Automator

---

## 📝 **Setup Instructions**

### **Step 1: Create Bluesky Account** (if you don't have one)

1. **Get an invite code:**
   - Check https://blueskydirectory.com/invite-codes
   - Ask on Twitter/X (#BlueSkyInvite)
   - Join waitlist at https://bsky.app

2. **Sign up at:** https://bsky.app
3. **Choose your handle** (e.g., `ajay.bsky.social`)
4. **Verify your email**

### **Step 2: Create App Password**

1. **Log in** to Bluesky: https://bsky.app
2. **Go to:** Settings → App Passwords
   - Or visit: https://bsky.app/settings/app-passwords

3. **Click "Add App Password"**

4. **Name it:**
   ```
   Social Media Automator
   ```

5. **Click "Create"**

6. **Copy the password** - it looks like:
   ```
   abcd-efgh-ijkl-mnop
   ```
   
   ⚠️ **Important:** Save it immediately - you can't see it again!

### **Step 3: Connect in Social Media Automator**

1. Go to **Connect Accounts** page
2. Click the **Bluesky** button
3. Enter:
   - **Handle**: Your Bluesky handle (e.g., `ajay.bsky.social`)
   - **App Password**: The password you just copied
4. Click **"Connect"**

---

## ✨ **Features**

### **What You Can Do:**
- ✅ Post text updates (up to 300 characters)
- ✅ Share images (up to 4 per post)
- ✅ Add alt text for accessibility
- ✅ Schedule posts
- ✅ Post to multiple Bluesky accounts
- ✅ View post analytics

### **Content Formatting:**
- **Character limit**: 300 characters
- **Images**: Up to 4 images per post (JPEG, PNG, GIF, WebP)
- **Image size**: Max 1MB per image
- **Hashtags**: Use `#hashtag` format (limited discovery for now)
- **Mentions**: Use `@username.bsky.social` format
- **Links**: Automatically detected and formatted

### **Supported Content Types:**
- ✅ **Text posts** - Standard posts with text
- ✅ **Image posts** - Text + up to 4 images
- ✅ **Quote posts** - Quote other posts (coming soon)
- ✅ **Threads** - Reply to your own posts (coming soon)
- ✅ **Link previews** - Rich card previews for links

---

## 🎯 **Best Practices**

### **1. Keep Posts Concise**
With 300 character limit:
```
✅ Good: "Just launched my new project! Check it out 🚀 #IndieHacker"
❌ Too long: Multiple paragraphs of text
```

### **2. Use Images Effectively**
- Add alt text for accessibility
- Optimize images before uploading (max 1MB each)
- Use high-quality, relevant images

### **3. Engage with the Community**
- Reply to others' posts
- Repost interesting content
- Use hashtags sparingly (discovery is still developing)

### **4. Timing Matters**
Best times to post:
- **Weekdays**: 9 AM - 11 AM, 1 PM - 3 PM (your timezone)
- **Weekends**: 10 AM - 12 PM

### **5. Cross-Post Smartly**
- Tailor content for Bluesky's audience
- Tech and privacy-focused community
- Less formal than LinkedIn, more technical than Instagram

---

## 📊 **Character Limits**

| Content Type | Limit |
|--------------|-------|
| Post text | 300 characters |
| Handle | 253 characters (DNS format) |
| Display name | 64 graphemes |
| Bio | 256 graphemes |
| Alt text | 1000 characters |

---

## 🔧 **Troubleshooting**

### **"Invalid Bluesky credentials" Error**

**Possible causes:**
1. **Wrong handle** - Make sure it's exactly `username.bsky.social`
2. **Wrong app password** - Copy it carefully (includes dashes)
3. **Expired password** - Create a new app password
4. **Account suspended** - Check your account status

**Solution:**
- Double-check handle format
- Generate a new app password
- Try logging in at https://bsky.app first

### **"Failed to post to Bluesky" Error**

**Possible causes:**
1. **Character limit exceeded** - Posts are truncated to 300 characters
2. **Image too large** - Max 1MB per image
3. **Too many images** - Max 4 images per post
4. **Rate limited** - Too many posts in short time
5. **Token expired** - Need to reconnect

**Solution:**
- Check post length (max 300 chars)
- Compress images to under 1MB
- Use max 4 images
- Wait if rate limited (limits are generous)
- Reconnect your account

### **"Session expired" Error**

**Solution:**
1. Go to Connect Accounts
2. Disconnect Bluesky
3. Connect again with your app password
4. Try posting again

---

## 🌍 **Bluesky vs. Twitter/X vs. Mastodon**

| Feature | Bluesky | Twitter/X | Mastodon |
|---------|---------|-----------|----------|
| Ownership | Decentralized (AT Protocol) | Centralized (X Corp) | Decentralized (ActivityPub) |
| Character limit | 300 | 280 | 500+ |
| Images per post | 4 | 4 | 4 |
| Ads | None | Yes | None |
| Algorithm | Customizable feeds | Algorithmic | Chronological |
| Edit posts | No | Yes (Premium) | Yes |
| Open source | Protocol: Yes | No | Yes |
| Auth | App Password | OAuth 2.0 | Access Token |
| Approval | No | Yes | No |

---

## 🔗 **Useful Links**

- **Bluesky Homepage**: https://bsky.app
- **AT Protocol Docs**: https://atproto.com
- **API Documentation**: https://docs.bsky.app
- **Community**: https://blueskydirectory.com
- **Status**: https://status.bsky.app

---

## ⚡ **Quick Reference**

### **Connect Bluesky:**
```
1. Create app password at: https://bsky.app/settings/app-passwords
2. Get your handle (e.g., username.bsky.social)
3. Connect in Social Media Automator
```

### **Post Format:**
```
Text (max 300 chars)
Up to 4 images (max 1MB each)
Hashtags for organization
```

### **Environment Variables:**
```bash
# Not needed for user connections (they use their own app passwords)
# These are only for development/testing
BLUESKY_HANDLE=your_handle.bsky.social
BLUESKY_APP_PASSWORD=your-app-password
```

---

## 💡 **Pro Tips**

1. **Multiple Accounts**: Create separate app passwords for each account
2. **Security**: Revoke unused app passwords regularly
3. **Backup**: Save your main password separately (not app password)
4. **Custom Domains**: You can use your own domain as your handle!
5. **Feeds**: Customize your feed with algorithm preferences
6. **Starter Packs**: Follow themed starter packs to find your community

---

## 🚀 **Advanced Features**

### **Custom Handles (Coming Soon)**
Use your own domain:
```
@yourdomain.com instead of @username.bsky.social
```

### **Custom Feeds (Coming Soon)**
Create algorithmic feeds for your audience

### **Moderation Tools**
- Mute users/keywords
- Block accounts
- Custom moderation lists

---

## 📈 **Growth Tips**

1. **Post Consistently**: 1-3 posts per day
2. **Engage Early**: Reply to others' posts
3. **Quality over Quantity**: Focus on valuable content
4. **Use Images**: Visual posts get more engagement
5. **Cross-Promote**: Share your Bluesky handle on other platforms
6. **Join Communities**: Find your niche via starter packs

---

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ Account shows as "Connected" in dashboard
- ✅ Posts appear on your Bluesky profile
- ✅ Post URL is visible in analytics
- ✅ Engagement metrics are tracked
- ✅ Can schedule posts successfully

---

## 🔒 **Security & Privacy**

### **App Passwords:**
- More secure than using your main password
- Easy to revoke if compromised
- Unique per application
- Doesn't give access to change account settings

### **Best Practices:**
- ✅ Use unique app password per service
- ✅ Revoke unused passwords regularly
- ✅ Never share your app passwords
- ✅ Keep main password secure
- ✅ Enable 2FA (when available)

---

## 🆚 **When to Use Bluesky**

**Perfect for:**
- 🎯 Tech-savvy audience
- 🔓 Privacy-conscious users
- 💡 Early adopters
- 🚀 Indie hackers & builders
- 📢 Open source projects
- 🌐 Decentralization advocates

**Maybe skip if:**
- 👴 Your audience isn't tech-savvy
- 💼 Purely corporate content
- 📊 Need advanced analytics (not mature yet)
- 🎥 Video content (not supported yet)

---

## 📞 **Support**

Having issues? Check:
1. This documentation
2. Bluesky status: https://status.bsky.app
3. AT Protocol docs: https://atproto.com
4. Our support team

---

## 🎯 **Quick Facts**

- **Launch**: February 2023 (beta)
- **Creator**: Jack Dorsey (Twitter founder)
- **Protocol**: AT Protocol (Authenticated Transfer)
- **Funding**: Independent PBC (Public Benefit Corp)
- **Users**: 1M+ and growing
- **Mobile Apps**: iOS, Android
- **Web App**: https://bsky.app

---

**Last Updated**: November 8, 2025  
**Integration Status**: ✅ Fully Working  
**Difficulty**: ⭐☆☆☆☆ Very Easy  
**Setup Time**: 2-5 minutes

