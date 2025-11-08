# 🎨 Tumblr Integration Guide

Complete setup guide for connecting and posting to Tumblr.

## Overview

Tumblr is a microblogging and social networking platform with 135M+ monthly users. Perfect for:
- Creative content and visual storytelling
- Blogging and long-form posts
- Fandom communities
- Art and photography
- GIFs and multimedia content
- Personal expression

---

## Prerequisites

- A Tumblr account ([tumblr.com](https://tumblr.com))
- Tumblr blog (created automatically with account)

---

## Setup Instructions

### Step 1: Register Your Application

1. **Go to Tumblr Developer Portal:**
   - https://www.tumblr.com/oauth/apps

2. **Click "Register application"** (blue button)

3. **Fill in the form:**

```
Application Name:
SOCIAL MEDIA AUTOMATOR

Application Website:
https://socialmediaautomator.com

App Store URL:
https://socialmediaautomator.com

Google Play Store URL:
https://socialmediaautomator.com

Application Description:
Multi-platform social media automation SaaS that helps users automate posting across 13+ platforms including Tumblr, LinkedIn, Twitter, Instagram, Dev.to and more. Features AI caption generation, scheduling and analytics.

Administrative contact email:
your-email@example.com

Default callback URL:
http://localhost:3000/auth/tumblr/callback

OAuth2 redirect URLs (space separate):
http://localhost:3000/auth/tumblr/callback https://socialmediaautomator.com/auth/tumblr/callback
```

4. **Check:** "I agree to the Tumblr API License Agreement"

5. **Click "Register"**

### Step 2: Get Your Credentials

After registration, you'll see:

- **OAuth Consumer Key** (like: `abc123def456...`)
- **OAuth Consumer Secret** (click "Show secret key" to reveal)

**Copy both!**

### Step 3: Add to Environment

**Local (.env file):**
```env
# Tumblr OAuth 1.0a
TUMBLR_CONSUMER_KEY=your_consumer_key_here
TUMBLR_CONSUMER_SECRET=your_consumer_secret_here
```

**Production (Railway):**
- Add both variables in Railway dashboard

### Step 4: Restart Server

```bash
npm start
```

---

## Connecting Your Account

1. **Go to Connect Accounts** page in dashboard
2. **Find Tumblr card** (blue gradient button)
3. **Click "Connect"**
4. **Authorize on Tumblr** - Redirected to Tumblr
5. **Grant permissions** - Allow the app
6. **Redirected back** - Success message shown
7. **✅ Connected!** - Tumblr appears in connected accounts

**Note:** If you have multiple Tumblr blogs, we'll use your **primary blog** by default.

---

## Creating Posts

### Text Post

```
My First Tumblr Post

This is a simple text post on Tumblr!

I can write as much as I want here. Tumblr supports long-form content.

#tumblr #blogging #test
```

### Photo Post (with image)

When you attach an image, it becomes a photo post:

```
Check out this amazing sunset!

Beautiful colors tonight 🌅

#photography #sunset #nature
```

### With Markdown

```
# Markdown Support on Tumblr

Tumblr supports **bold**, *italic*, and more!

- Bullet lists
- Work great

## Code blocks too!

\```javascript
console.log("Hello Tumblr!");
\```

#markdown #blogging #tutorial
```

---

## Features

### Supported Post Types

✅ **Text Posts** - Blogs, articles, stories  
✅ **Photo Posts** - Images (when you upload/attach)  
✅ **Markdown formatting** - Headers, bold, lists, code  
✅ **Tags** - Unlimited tags (extracted from hashtags)  
✅ **Multi-blog support** - If you have multiple Tumblr blogs  

⚠️ **Video, Quote, Link, Chat, Audio** - Planned for future

### Character Limits

- **Title:** No strict limit
- **Body:** No limit (long-form friendly!)
- **Tags:** Unlimited (but 5-10 recommended for best reach)

### Content Types

1. **Text Post** - No image attached
   - Title extracted from first line
   - Body is the rest of the content

2. **Photo Post** - Image attached
   - Image becomes the main content
   - Text becomes caption
   - Supports multiple images (future feature)

---

## Tumblr Best Practices

### 1. Content Strategy

**What works on Tumblr:**
- Visual content (photos, GIFs, art)
- Fan content and discussions
- Personal stories and blogs
- Creative writing
- Memes and humor
- Educational content with visuals

**Tumblr audience loves:**
- Authenticity
- Creative expression
- Fandom content
- Social justice topics
- Art and aesthetics

### 2. Tag Strategy

**Use descriptive, specific tags:**
- Genre tags: `#photography`, `#writing`, `#art`
- Topic tags: `#nature`, `#tech`, `#books`
- Community tags: `#studyblr`, `#writeblr`, `#artblr`
- No limit, but 5-10 tags optimal

**Avoid:**
- Irrelevant tags (spam)
- Over-tagging (looks desperate)
- Only popular tags (mix popular + niche)

### 3. Post Timing

**Best times for Tumblr:**
- Evenings: 7-10 PM
- Weekends: 12-8 PM
- Timezone: EST (US East Coast)

**Frequency:**
- 1-5 posts per day
- Consistency over quantity
- Queue posts for steady flow

---

## Multi-Blog Support

Tumblr allows multiple blogs per account:

**Primary Blog:**
- Your main blog (username.tumblr.com)
- Used by default in our integration

**Secondary Blogs:**
- Can create unlimited sideblog
- Future feature: select which blog to post to

**Coming Soon:**
- Select specific blog when posting
- Manage multiple blogs
- Different content per blog

---

## API Limitations

- **Rate Limits:** 
  - New apps: 1,000 requests/hour, 5,000/day
  - Can request removal of limits
- **OAuth 1.0a:** Requires 3-step flow
- **Image Upload:** Direct upload via API supported
- **Video:** Large files may have limits
- **Queue:** Can add to Tumblr's native queue

---

## Troubleshooting

### "Invalid OAuth credentials"
**Solution:**
- Verify Consumer Key and Secret in `.env`
- Check no extra spaces when copying
- Regenerate credentials if needed

### "Callback URL mismatch"
**Solution:**
- Ensure callback URL in Tumblr app matches exactly
- Local: `http://localhost:3000/auth/tumblr/callback`
- Production: `https://socialmediaautomator.com/auth/tumblr/callback`

### "Post not appearing"
**Check:**
- Verify blog is public (not private)
- Check Tumblr dashboard/queue
- May be in queue vs published immediately

### "Image not uploading"
**Requirements:**
- Image URL must be publicly accessible
- Use HTTPS URLs
- Supported formats: JPG, PNG, GIF
- Max size varies (usually 10-20 MB)

---

## Tumblr vs Other Platforms

| Feature | Tumblr | Medium | Dev.to |
|---------|--------|--------|--------|
| **Access** | ✅ Easy | ❌ Restricted | ✅ Easiest |
| **Auth** | OAuth 1.0a | OAuth 2.0 | API Key |
| **Content** | Creative | Articles | Tech |
| **Audience** | 135M | 60M | 10M devs |
| **Tags** | Unlimited | 3-5 | 4 max |
| **Images** | Native | URL only | URL only |
| **Format** | Markdown | Markdown | Markdown |

---

## Technical Details

### OAuth 1.0a Flow

**3-Step Process:**

1. **Get Request Token**
   - POST to `/oauth/request_token`
   - Store request token secret

2. **User Authorization**
   - Redirect to `/oauth/authorize?oauth_token=XXX`
   - User grants permission

3. **Exchange for Access Token**
   - POST to `/oauth/access_token`
   - Get permanent access token

### API Call Example

```javascript
POST https://api.tumblr.com/v2/blog/{blog-identifier}/post

Headers:
  Authorization: OAuth oauth_consumer_key="...", 
                 oauth_token="...", 
                 oauth_signature="...", etc.

Body:
{
  "type": "text",
  "title": "My Post Title",
  "body": "Post content here...",
  "tags": "tag1,tag2,tag3"
}
```

### Response

```json
{
  "meta": {
    "status": 201,
    "msg": "Created"
  },
  "response": {
    "id": 123456789
  }
}
```

---

## Post Types Supported

### Currently Supported

1. **Text Posts** - Default if no image
   - Title + body
   - Markdown formatting
   - Tags

2. **Photo Posts** - When image attached
   - Image URL or upload
   - Caption
   - Tags

### Coming Soon

3. **Quote Posts** - Quoted text with source
4. **Link Posts** - Share links with description
5. **Video Posts** - Video content
6. **Audio Posts** - Music/podcasts
7. **Chat Posts** - Dialogue format

---

## Advanced Features (Future)

- **Reblog functionality** - Reblog others' posts
- **Queue management** - Add to Tumblr queue
- **Draft posts** - Save without publishing
- **Schedule natively** - Use Tumblr's scheduler
- **Multiple blogs** - Choose which blog to post to
- **Custom URLs** - Set custom post slugs
- **Rich media** - GIFs, videos, audio

---

## Resources

- **[Tumblr API Docs](https://www.tumblr.com/docs/en/api/v2)** - Official documentation
- **[OAuth Apps](https://www.tumblr.com/oauth/apps)** - Manage your apps
- **[Tag Guidelines](https://www.tumblr.com/tagged)** - Browse popular tags
- **[Community Guidelines](https://www.tumblr.com/policy/en/community)** - Content rules

---

## Why Tumblr?

### Benefits

✅ **Huge audience** - 135M monthly active users  
✅ **Creative freedom** - Minimal content restrictions  
✅ **Engaged community** - Reblogs, likes, comments  
✅ **SEO friendly** - Good domain authority  
✅ **Free platform** - No costs  
✅ **Multimedia** - Photos, GIFs, videos, audio  
✅ **Queue system** - Built-in scheduling  
✅ **Customization** - Theme your blog  

### Use Cases

- **Art portfolio** - Share your creative work
- **Fan communities** - Build fandom presence
- **Personal blogging** - Share thoughts and stories
- **Brand building** - Creative brands and indie businesses
- **Visual storytelling** - Photo essays and narratives
- **Alternative to Instagram** - More creative freedom

---

## Tumblr Culture

**Know your audience:**
- Values authenticity over perfection
- Loves creativity and unique perspectives
- Active fandoms (TV shows, movies, books, games)
- Social justice and activism
- Humor and memes
- Art and aesthetics

**Content tips:**
- Be genuine and personal
- Visual content performs best
- Engage with reblogs and tags
- Join conversations in tags
- Reblog others (community building)

---

## Example Post

```markdown
# Just Launched My First SaaS Product! 🚀

After 3 months of coding, my social media automator is finally live!

![Screenshot](https://res.cloudinary.com/demo/screenshot.png)

## What it does:
- Posts to 14 platforms simultaneously
- AI caption generation
- Smart scheduling
- Analytics dashboard

Building in public has been an amazing journey. Here's what I learned...

[Read full story on my blog](https://yourblog.com/article)

#saas #entrepreneurship #coding #buildinpublic #webdev #startup
```

---

**Status:** ✅ Fully Integrated & Working  
**Difficulty:** ⭐⭐☆☆☆ (Moderate - OAuth 1.0a)  
**Auth Type:** OAuth 1.0a (3-step flow)  
**Best For:** Creative content, blogging, visual posts, fandoms  
**Audience:** 135M+ monthly users  
**Last Updated:** November 2025

