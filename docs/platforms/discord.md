# Discord Integration Guide

## Overview

Post to Discord channels using incoming webhooks. Simple setup with no OAuth required, similar to Slack integration.

## Setup Steps

### 1. Create Discord Webhook

1. Open Discord desktop or web app
2. Go to your server
3. Right-click on server name → **Server Settings**
4. Click **Integrations** → **Webhooks**
5. Click **"New Webhook"** or **"Create Webhook"**
6. Configure webhook:
   - **Name**: Social Media Automator
   - **Channel**: Select target channel (e.g., #general, #announcements)
   - **Avatar**: (Optional) Upload custom icon
7. Click **"Copy Webhook URL"**

Your webhook URL format:
```
https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN
```
OR
```
https://discordapp.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN
```

### 2. Connect in App

1. Go to **Settings** in Social Media Automator
2. Click **"Connect Discord"** button
3. Paste your webhook URL
4. (Optional) Enter server/channel name for identification
5. Click **"Connect"**

A test message will appear in your Discord channel:
```
✅ Discord webhook connected successfully! You can now post to this channel from Social Media Automator.
```

## Posting Features

### Supported Content Types

| Content Type | Support | Format |
|--------------|---------|--------|
| **Text** | ✅ | Simple messages |
| **Images** | ✅ | Rich embeds with image |
| **Videos** | 🔗 | Embedded link with preview |

### Post Examples

**Text Only:**
```
Caption: "Hello Discord community!"
Result: Simple text message
```

**With Image:**
```
Caption: "New product launch!"
Image: product.jpg
Result: Message with embedded image preview
```

**With Video:**
```
Caption: "Check out our demo!"
Video: demo.mp4 (URL)
Result: Embedded video link with title and preview
```

## Features

### Simple Integration
- ✅ **No OAuth** - Just paste webhook URL
- ✅ **Instant setup** - Working in seconds
- ✅ **No API limits** - Use Discord's webhook limits

### Rich Formatting
- ✅ **Embeds** - Professional-looking messages
- ✅ **Image previews** - Images display inline
- ✅ **Video links** - Clickable embedded links
- ✅ **Markdown support** - Discord markdown in messages

### Multi-Channel
- ✅ Connect multiple webhooks (different channels)
- ✅ Each webhook = one channel
- ✅ Post to multiple channels simultaneously

## Limitations

### Webhook Constraints
- Videos posted as links (webhooks don't support native video upload)
- No analytics or engagement tracking
- One-way communication only
- Requires "Manage Webhooks" permission in server

### Discord Limits
- Rate limit: ~5 messages per second per webhook
- Message length: 2000 characters
- Embed field limits apply

## Troubleshooting

### Connection Issues

**Error**: "Invalid Discord webhook URL"
- **Fix**: URL must start with `https://discord.com/api/webhooks/` or `https://discordapp.com/api/webhooks/`
- Check you copied the full URL (including token)

**Error**: "Webhook validation failed"
- **Fix**: Webhook might be deleted in Discord
- Create new webhook and try again

**Error**: "204 No Content"
- **Fix**: This is actually success! Discord returns 204 for successful webhook posts
- Should be handled automatically

### Posting Issues

**Error**: "Discord API returned unexpected response"
- **Fix**: Check webhook still exists
- Verify you have permission in that server

**Error**: "Rate limit exceeded"
- **Fix**: Wait a few seconds between posts
- Discord webhooks have rate limits

### No Messages Appearing

**Check:**
1. Webhook is connected in Settings
2. Discord is selected in Create Post
3. Channel permissions allow webhook posts
4. Webhook wasn't deleted in Discord

## Advanced Configuration

### Webhook Permissions

Required Discord permissions:
- **Manage Webhooks** - Create and manage webhooks
- **Send Messages** - Webhook needs this in target channel

### Multiple Servers

To post to multiple Discord servers:
1. Create webhook in each server
2. Connect each webhook separately
3. Give each a unique name (e.g., "Server 1", "Server 2")

### Channel-Specific Webhooks

Best practice:
- Create separate webhooks for different purposes
- Example: #announcements webhook, #updates webhook, #general webhook
- Connect all in Settings
- Posts go to all connected channels

## Security

### Webhook URL Protection

- ⚠️ **Never share** your webhook URL publicly
- ⚠️ Anyone with the URL can post to your channel
- ✅ Regenerate webhook if exposed
- ✅ Webhooks stored securely in database

### Revoking Access

To disconnect:
1. Go to Settings → Connected Accounts
2. Find Discord webhook
3. Click "Disconnect"

OR delete webhook in Discord:
1. Discord → Server Settings → Integrations → Webhooks
2. Find webhook → Delete

## API Reference

### Discord Webhook API

**Simple Message:**
```javascript
POST https://discord.com/api/webhooks/ID/TOKEN
{
  "content": "Hello Discord!"
}
```

**Message with Embed:**
```javascript
POST https://discord.com/api/webhooks/ID/TOKEN
{
  "content": "Check this out!",
  "embeds": [{
    "image": {
      "url": "https://image-url.com/image.jpg"
    }
  }]
}
```

**Response:** 204 No Content (success)

## Best Practices

### Posting Guidelines
- Keep messages relevant to channel topic
- Don't spam (respect Discord TOS)
- Use clear, descriptive text
- Include context for images/videos

### Channel Organization
- Use webhooks for automated content
- Reserve @mentions for important updates
- Consider channel-specific webhooks for different content types

### Rate Limiting
- Don't post too frequently (5-10 second gaps)
- Use scheduling for regular posts
- Monitor Discord rate limits

## Support

Issues with Discord integration? Check:
1. Webhook URL is complete and correct
2. Webhook exists in Discord server
3. You have "Manage Webhooks" permission
4. Channel allows webhook posts

---

**Status**: ✅ Live  
**Integration Type**: Webhook  
**OAuth Required**: No  
**Video Support**: Links only (webhooks limitation)
