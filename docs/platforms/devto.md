# 📝 Dev.to Integration Guide

Complete setup guide for connecting and posting to Dev.to (the developer blogging platform).

## Overview

Dev.to (also known as DEV Community or Forem) is the largest platform for developers to share articles, tutorials, and stories. This integration allows you to:
- Publish technical articles and tutorials
- Cross-post blog content
- Share coding tips and guides
- Build your developer brand
- Use Markdown formatting
- Add tags to posts
- Include cover images

**Perfect for:** Developers, tech writers, coding educators, SaaS founders

---

## Prerequisites

- A Dev.to account ([dev.to](https://dev.to))
- 5 minutes to set up

---

## Setup Instructions (SUPER EASY!)

### Step 1: Get Your Dev.to API Key (30 seconds)

1. **Log in to Dev.to:** https://dev.to
2. **Go to Settings:** Click your profile picture (top right) → "Settings"
3. **Navigate to Extensions:** In the left sidebar, find and click **"Extensions"**
   - Or go directly to: https://dev.to/settings/extensions
4. **Generate API Key:**
   - Find the **"DEV Community API Keys"** section
   - **Description:** Enter `Social Media Automator`
   - **Click "Generate API Key"**
   - **Copy the key immediately!** (You won't see it again)
   - It looks like: `Q3QMaaq53dyqJsebtZ6ry14N`

### Step 2: Add to Environment (Local Testing)

Add to your `.env` file:

```env
# Dev.to API (optional - for fallback if user doesn't provide their own)
DEV_TO_API_KEY=Q3QMaaq53dyqJsebtZ6ry14N
```

**Note:** Each user will provide their own API key when connecting, so this is optional.

### Step 3: Restart Server (if needed)

```bash
npm start
```

---

## Connecting Your Account

1. **Go to Connect Accounts page** in your dashboard
2. **Find Dev.to card** (black gradient button)
3. **Click "Connect"** 
4. **Enter your API key** in the modal popup
5. **Click "Connect"** button
6. **✅ Done!** - No OAuth redirects, no approvals, instant connection!

---

## Creating Posts

### Basic Article

1. Go to **Create Post** page
2. Enter your content:
   ```
   Understanding JavaScript Closures
   
   Closures are one of the most powerful features in JavaScript...
   
   #javascript #tutorial #webdev #beginners
   ```
3. Check **Dev.to** platform
4. Click **Post Now** or **Schedule**

### With Cover Image

```
Build a REST API with Node.js

![Cover](https://images.unsplash.com/photo-api-endpoint)

In this tutorial, we'll build a complete REST API...

#nodejs #api #tutorial #backend
```

### Auto-Title Extraction

Dev.to requires a title. Our system automatically:
- Uses **first line** as title (if under 128 chars)
- Or uses **first 60 chars** as title
- Removes markdown heading syntax (`#`, `##`, etc.)

**Example:**
```
# How to Build a Social Media Automator

Your content here...
```
→ Title: "How to Build a Social Media Automator"

---

## Features

### Supported Content Types

✅ **Text posts** (required)
- Articles, tutorials, guides
- Code snippets and examples
- Discussion posts

✅ **Images** (via URL)
- Cover images
- Inline images in content
- Must be publicly accessible URLs

✅ **Markdown formatting**
- Headers (`#`, `##`, `###`)
- **Bold**, *italic*, ~~strikethrough~~
- Lists, links, quotes
- Code blocks with syntax highlighting
- Tables

✅ **Tags** (max 4)
- Extracted from hashtags automatically
- Helps with discoverability on Dev.to
- Categories: `#javascript`, `#tutorial`, `#beginners`, etc.

❌ **Videos** (use embedded links instead)

### Character Limits

- **Title:** 128 characters maximum
- **Content:** No limit (long-form friendly!)
- **Tags:** 4 tags maximum
- **Description:** 200 characters (optional)

### Publishing Options

- **Published:** Live immediately (default)
- **Draft:** Save without publishing

---

## Content Formatting

Dev.to uses **Markdown** with enhanced features:

### Basic Formatting

```markdown
# H1 Heading
## H2 Heading
### H3 Heading

**Bold text**
*Italic text*
~~Strikethrough~~

- Bullet list
- Item 2

1. Numbered list
2. Item 2

[Link text](https://example.com)
```

### Code Blocks

\`\`\`javascript
function hello() {
  console.log("Hello, Dev.to!");
}
\`\`\`

### Images

```markdown
![Alt text](https://image-url.com/image.jpg)
```

### Liquid Tags (Dev.to Special)

```markdown
{% embed https://www.youtube.com/watch?v=VIDEO_ID %}

{% github username/repo %}

{% codepen https://codepen.io/... %}
```

---

## Best Practices

### 1. Title Optimization

✅ **Good titles:**
- "Understanding React Hooks: A Complete Guide"
- "10 JavaScript Tips That Will Make You a Better Developer"
- "How to Build a REST API in Node.js (2024 Guide)"

❌ **Avoid:**
- Too generic ("JavaScript tips")
- Too long (over 100 characters)
- Clickbait without substance

### 2. Tag Strategy

**Use relevant Dev.to tags:**
- Language tags: `#javascript`, `#python`, `#go`, `#rust`
- Topic tags: `#tutorial`, `#webdev`, `#beginners`, `#discuss`
- Framework tags: `#react`, `#vue`, `#nodejs`, `#rails`
- Max 4 tags per post

**Check tag popularity:** Browse https://dev.to/tags to see popular tags

### 3. Content Structure

**Successful Dev.to articles:**
1. **Catchy title** - Clear, specific, valuable
2. **Cover image** - Visual appeal (use Unsplash, Cloudinary)
3. **TL;DR** - Quick summary at top
4. **Introduction** - Hook readers in
5. **Body** - Well-structured with headers
6. **Code examples** - Syntax highlighted
7. **Conclusion** - Summary + CTA
8. **Tags** - Relevant, popular tags

### 4. Engagement Tips

- **Respond to comments** - Dev.to has active community
- **Series** - Create multi-part content
- **Cross-post** - Share on Twitter, LinkedIn
- **Canonical URLs** - Set if published elsewhere first

---

## API Features

### What Our Integration Supports

✅ **Publish articles** - Immediately or as draft
✅ **Markdown formatting** - Full support
✅ **Cover images** - Via URL
✅ **Tags** - Auto-extracted from hashtags (max 4)
✅ **Multi-account** - Connect multiple Dev.to accounts
✅ **Auto-title** - Extracted from content

### What's Not Supported (Dev.to API Limitations)

❌ **Image upload** - Must use external URLs (use our Cloudinary integration)
❌ **Series creation** - Manual setup on Dev.to
❌ **Organization posts** - Personal account only via API
❌ **Video upload** - Use embedded links

---

## Multi-Account Support

You can connect multiple Dev.to accounts:

1. **Generate API key** for each account
2. **Connect each** via Connect Accounts page
3. **Label accounts:**
   - "Personal Dev.to"
   - "Company Tech Blog"
4. **Select account** when posting (if 2+ connected)

---

## Troubleshooting

### "Invalid API key"
**Solution:**
- Verify you copied the complete API key (no spaces)
- Check it wasn't revoked in Dev.to settings
- Generate a new key if needed

### "Article not appearing"
**Check:**
- Was it published vs saved as draft?
- Check your Dev.to dashboard
- Verify account has posting permissions

### "Tags not working"
**Issues:**
- Dev.to allows max 4 tags
- Tags must exist on Dev.to (create if new)
- Use lowercase, no special characters

### "Image not showing"
**Requirements:**
- Image URL must be publicly accessible
- Use HTTPS URLs only
- Try using Cloudinary for reliable hosting

### "Title too long error"
**Solution:**
- Dev.to limit: 128 characters
- Our system auto-truncates, but keep first line short
- Edit manually if needed

---

## Example Posts

### Example 1: Tutorial

```markdown
Building a Social Media Automator with Node.js

![Cover](https://res.cloudinary.com/demo/image.jpg)

Learn how to build a multi-platform social media automation tool using Node.js, Express, and React.

## What We'll Build

- Multi-platform posting
- OAuth integration
- Scheduled posts
- AI caption generation

## Prerequisites

- Node.js v20+
- Basic JavaScript knowledge
- API keys for social platforms

## Step 1: Setup

\```bash
npm init -y
npm install express axios
\```

## Step 2: Create Express Server

\```javascript
const express = require('express');
const app = express();

app.listen(3000, () => {
  console.log('Server running!');
});
\```

## Conclusion

We've built a foundation for our social media automator...

#nodejs #tutorial #javascript #api
```

### Example 2: Quick Tip

```markdown
5 JavaScript Array Methods You Should Know

Here are my favorite array methods that every JS developer should master:

1. **map()** - Transform array elements
2. **filter()** - Remove unwanted items
3. **reduce()** - Aggregate values
4. **find()** - Get first match
5. **some()** - Check if any match

Code examples and details in the full article...

#javascript #webdev #programming #beginners
```

---

## Resources

- **[Dev.to API Documentation](https://developers.forem.com/api)** - Official API docs
- **[Dev.to Extensions Settings](https://dev.to/settings/extensions)** - Generate API keys
- **[Dev.to Tag Guidelines](https://dev.to/tags)** - Browse all tags
- **[Markdown Guide](https://www.markdownguide.org/)** - Markdown syntax

---

## Why Dev.to?

### Benefits

✅ **Huge developer audience** - 1M+ monthly readers
✅ **SEO-friendly** - High domain authority
✅ **Free platform** - No costs
✅ **Active community** - Comments, reactions, engagement
✅ **Career building** - Build your developer brand
✅ **No algorithm** - Chronological + tag-based discovery
✅ **Code-friendly** - Syntax highlighting, embeds

### Use Cases

- **Tutorial publishing** - Share coding guides
- **Portfolio building** - Showcase projects
- **Thought leadership** - Share insights
- **Course promotion** - Drive traffic to courses
- **Open source** - Document projects
- **Career growth** - Get noticed by recruiters

---

## Technical Details

### Authentication

**Method:** API Key (no OAuth needed!)
- Super simple: Just an API key in header
- No redirects, no callbacks, no complexity
- Instant setup

### API Call Example

```javascript
POST https://dev.to/api/articles

Headers:
  api-key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "article": {
    "title": "My Article Title",
    "body_markdown": "# Content here...",
    "published": true,
    "tags": ["javascript", "tutorial", "webdev"]
  }
}
```

### Response

```json
{
  "id": 123456,
  "title": "My Article Title",
  "url": "https://dev.to/username/my-article-title-abc",
  "published": true,
  "tags": ["javascript", "tutorial", "webdev"]
}
```

---

## Comparison: Dev.to vs Medium

| Feature | Dev.to | Medium |
|---------|--------|--------|
| **API Access** | ✅ Instant | ❌ Restricted |
| **Setup Time** | 30 seconds | N/A |
| **Auth Method** | API Key (simple) | OAuth (complex) |
| **Audience** | Developers | General |
| **Cost** | Free | Free |
| **Code Support** | Excellent | Basic |
| **SEO** | Great | Great |
| **Community** | Very active | Active |

**Winner:** Dev.to for technical content! 🏆

---

**Status:** ✅ Fully Integrated & Working  
**Difficulty:** ⭐☆☆☆☆ (EASIEST of all platforms!)  
**Setup Time:** 30 seconds  
**Best For:** Developers, tech writers, coding educators, SaaS founders  
**Last Updated:** November 2025

