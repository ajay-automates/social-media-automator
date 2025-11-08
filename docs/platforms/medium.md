# 📝 Medium Integration Guide

Complete setup guide for connecting and posting to Medium.

## Overview

Medium is a popular long-form content publishing platform. This integration allows you to:
- Cross-post blog articles
- Publish thought leadership content
- Share stories with Medium's audience
- Use Markdown formatting
- Add tags to posts

---

## Prerequisites

- A Medium account ([medium.com](https://medium.com))
- Medium developer app credentials

---

## Setup Instructions

### Step 1: Create Medium Developer App

1. Go to [Medium Applications](https://medium.com/me/applications)
2. Click **"New Application"**
3. Fill in the application details:
   - **Name:** Social Media Automator
   - **Description:** Multi-platform social media automation tool
   - **Callback URL:** `http://localhost:3000/auth/medium/callback` (for local testing)
   - For production: `https://your-domain.com/auth/medium/callback`
4. Click **"Create"**
5. Copy your **Client ID** and **Client Secret**

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# Medium OAuth
MEDIUM_CLIENT_ID=your_client_id_here
MEDIUM_CLIENT_SECRET=your_client_secret_here
```

### Step 3: Restart Server

```bash
npm start
```

---

## Connecting Your Account

1. **Go to Connect Accounts page** in your dashboard
2. **Find the Medium card** (black/gray gradient)
3. **Click "Connect"** button
4. **Authorize on Medium** - You'll be redirected to Medium
5. **Grant permissions** - Allow the app to:
   - Read your profile
   - Publish posts on your behalf
6. **Redirected back** - You'll see success message
7. **✅ Connected!** - Medium now appears in your connected accounts

---

## Creating Posts

### Basic Post

1. Go to **Create Post** page
2. Enter your content (title will be auto-extracted from first line)
3. Check **Medium** platform
4. Click **Post Now** or **Schedule**

### With Images

Medium supports inline images via URL:

```markdown
# My Article Title

![Alt text](https://your-image-url.com/image.jpg)

Your article content here...
```

### With Tags

Add hashtags to your post (max 3 will be used as Medium tags):

```
Check out my new article! #programming #javascript #webdev
```

Tags are automatically extracted and added to Medium post.

---

## Features

### Supported Content Types

✅ **Text posts** (required)
- Long-form articles
- Blog posts
- Stories

✅ **Images** (inline via URL)
- Cover images
- Inline images in content
- Must be publicly accessible URLs

✅ **Markdown formatting**
- Headers, bold, italic
- Lists, links, quotes
- Code blocks

✅ **Tags** (max 3)
- Extracted from hashtags
- Added as Medium tags
- Helps with discoverability

❌ **Videos** (not supported by Medium API)

### Character Limits

- **Title:** No strict limit (recommended: 60-100 chars)
- **Content:** No limit (long-form friendly!)
- **Tags:** Maximum 3 tags per post

### Publishing Options

- **Public:** Visible to everyone (default)
- **Draft:** Save without publishing
- **Unlisted:** Accessible via direct link only

---

## Content Formatting

Medium uses **Markdown** formatting:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
~~Strikethrough~~

- Bullet point 1
- Bullet point 2

1. Numbered list
2. Item 2

[Link text](https://example.com)

> Blockquote

`inline code`

\```
code block
\```
```

---

## Best Practices

### 1. Title Optimization

✅ **Good titles:**
- "10 JavaScript Tips Every Developer Should Know"
- "How We Scaled Our API to Handle 1M Requests"
- "The Ultimate Guide to React Hooks"

❌ **Avoid:**
- Too long (over 100 characters)
- All caps
- Clickbait without substance

### 2. Content Structure

- **Start with a hook** - Grab attention in first paragraph
- **Use headers** - Break up content with ## and ###
- **Include images** - Visual appeal matters
- **Add value** - Provide actionable insights
- **End with CTA** - Call-to-action for engagement

### 3. Tags Strategy

- Use popular, relevant tags
- Mix broad and specific:
  - Broad: `#programming`, `#business`
  - Specific: `#nodejs`, `#saas`
- Check tag popularity on Medium
- Maximum 3 tags (API limitation)

### 4. Cross-Posting Tips

- Add canonical URL if posted elsewhere first (prevents duplicate content issues)
- Customize intro for Medium audience
- Engage with comments on Medium
- Share Medium link on other platforms

---

## API Limitations

- **Rate Limits:** No official limit, but use reasonable frequency
- **Image Uploads:** Not supported via API - images must be hosted externally (use Cloudinary)
- **Video:** Not supported
- **Max Tags:** 3 per post
- **Publications:** Can post to publications if you're a contributor (future feature)

---

## Troubleshooting

### "Invalid access token"
**Solution:** Reconnect your Medium account in Connect Accounts page

### "Post not appearing"
**Check:**
- Was it published as draft vs public?
- Verify account has posting permissions
- Check Medium profile for the post

### "Image not showing"
**Requirements:**
- Image URL must be publicly accessible
- Use HTTPS URLs only
- Medium doesn't support image upload via API - must be hosted elsewhere
- Try using Cloudinary for image hosting

### "Too many tags error"
**Solution:** Medium API allows maximum 3 tags. Remove extra hashtags or edit tags manually.

---

## Multi-Account Support

You can connect multiple Medium accounts:

1. **Add multiple accounts** via Connect Accounts page
2. **Label each account:**
   - "Personal Medium"
   - "Company Blog"
   - "Tech Writing Account"
3. **Select account** when posting (if you have 2+ connected)

---

## Example: Complete Article Post

```markdown
# How I Built a SaaS in 30 Days

![Cover Image](https://images.unsplash.com/photo-1517694712202-14dd9538aa97)

Building a SaaS product is challenging but incredibly rewarding...

## The Idea

It all started when I noticed...

## Tech Stack

I chose the following technologies:
- React for the frontend
- Node.js for the backend
- PostgreSQL for the database

## Challenges

The biggest challenges I faced were...

## Results

After 30 days, here's what I achieved:
- 100 users
- $500 MRR
- 95% uptime

## Conclusion

If you're thinking about building a SaaS...

#saas #startup #coding
```

This will be posted to Medium with:
- Title: "How I Built a SaaS in 30 Days"
- Content: Full markdown article
- Tags: saas, startup, coding (first 3 hashtags)

---

## Resources

- [Medium API Documentation](https://github.com/Medium/medium-api-docs)
- [Medium Developer Portal](https://medium.com/me/applications)
- [Medium Partner Program](https://medium.com/creators)
- [Medium Tag Guidelines](https://help.medium.com/hc/en-us/articles/214741038)

---

## Technical Details

### OAuth Flow

1. User clicks "Connect Medium"
2. Backend generates OAuth URL with state parameter
3. User redirected to Medium authorization page
4. User grants permissions
5. Medium redirects back with authorization code
6. Backend exchanges code for access token
7. Backend fetches user profile
8. Credentials saved to database
9. User sees success message

### Posting Process

1. System extracts title from first line of text (or first 60 chars)
2. Content formatted as Markdown with title as H1
3. Hashtags extracted and converted to tags (max 3)
4. API call to Medium: `POST /v1/users/{userId}/posts`
5. Medium returns post ID and public URL
6. Result saved to database
7. User sees success with link to Medium post

---

**Status:** ✅ Fully Integrated & Working  
**Difficulty:** ⭐☆☆☆☆ (Easiest)  
**Best For:** Long-form content, articles, thought leadership, cross-posting blog posts  
**Last Updated:** November 2025

