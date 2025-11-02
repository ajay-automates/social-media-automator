# Slack Integration Guide

## Overview

Slack integration allows you to post messages to Slack channels and workspaces using incoming webhooks. This is perfect for:
- Team notifications
- Content distribution to team channels
- Automated workflow updates
- Cross-posting to internal communication

---

## Prerequisites

- Slack workspace (free or paid)
- Admin or appropriate permissions to add apps/webhooks
- A channel where you want to post

---

## Setup Instructions

### Step 1: Create Incoming Webhook in Slack

1. Go to your Slack workspace
2. Click your workspace name (top left)
3. Select **Settings & administration** → **Manage apps**
4. Search for **"Incoming Webhooks"**
5. Click **"Add to Slack"**
6. Select the channel where you want to post
7. Click **"Add Incoming Webhooks integration"**

### Step 2: Copy Webhook URL

After creating the webhook, you'll see:

```
Webhook URL: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Copy this URL** - you'll need it to connect in the app.

### Step 3: Connect in Social Media Automator

1. Log into your dashboard
2. Go to **Settings** page
3. Find the **Social Accounts** section
4. Click **"Connect Slack"** button
5. Paste your **Webhook URL**
6. Enter **Channel Name** (e.g., #general, #marketing)
7. Click **"Connect"**

You'll see a test message appear in your Slack channel confirming the connection!

---

## How It Works

### Webhook-Based Posting

Unlike OAuth platforms (LinkedIn, Twitter), Slack uses **incoming webhooks**:

```
Your App → Slack Webhook URL → Slack Channel
```

**No authentication dance** - just post to the webhook URL!

### What You Can Post

- ✅ **Text messages** - Plain text or Markdown
- ✅ **Images** - Automatically embedded
- ❌ **Videos** - Not supported via webhooks (text link provided)

---

## Usage

### Post to Slack

1. Go to **Create Post** page
2. Write your message
3. Select **Slack** checkbox
4. Click **"Post Now"** or **"Schedule"**

Your message will appear in the connected Slack channel!

### Multiple Channels

You can connect **multiple Slack webhooks** for different channels:
- #general
- #marketing
- #announcements
- Different workspaces

Each connection is independent.

---

## Message Format

### Text Only

```
Your message text appears in Slack
```

### With Image

```
Your message text

[Image displayed inline]
```

### With Video

```
Your message text

🎥 Video: https://cloudinary.com/your-video.mp4
```

(Slack webhooks don't support video embedding, so video link is included)

---

## Webhook URL Format

Valid webhook URLs look like:

```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
                              ↑          ↑          ↑
                         Workspace   Channel    Secret
```

**Keep this URL secret!** Anyone with it can post to your channel.

---

## Advanced Configuration

### Custom Name and Icon

In your Slack webhook settings, you can customize:
- **Username** - Name shown for bot messages
- **Icon** - Emoji or image for bot avatar
- **Channel** - Default channel (can be overridden)

### Slack Block Kit

The app uses Slack's Block Kit for rich formatting:
- Section blocks for text
- Image blocks for images
- Markdown support (*bold*, _italic_, `code`)

---

## Troubleshooting

### Error: "Invalid webhook URL"

**Cause:** Webhook URL doesn't match Slack's format

**Solution:**
- Must start with `https://hooks.slack.com/services/`
- Copy entire URL from Slack settings
- Don't add spaces or line breaks

### Error: "Webhook validation failed"

**Cause:** Webhook was deleted or expired

**Solution:**
- Create a new webhook in Slack
- Update the URL in Social Media Automator
- Reconnect

### Message not appearing in Slack

**Possible causes:**
1. **Webhook deleted** - Recreate in Slack
2. **Channel archived** - Unarchive or use different channel
3. **Network issue** - Check internet connection

### "No Slack credentials found"

**Cause:** Slack webhook not connected

**Solution:**
1. Go to Settings
2. Click "Connect Slack"
3. Enter webhook URL
4. Connect successfully

---

## Security Best Practices

### Protect Your Webhook URL

- ❌ Don't share publicly
- ❌ Don't commit to Git (it's in database only)
- ❌ Don't post in public channels
- ✅ Regenerate if leaked
- ✅ Use separate webhooks for testing

### Regenerate Webhook

If your webhook URL is compromised:

1. Go to Slack webhook settings
2. Click **"Regenerate"** or delete and create new
3. Update URL in Social Media Automator
4. Old URL stops working immediately

---

## Rate Limits

Slack incoming webhooks have generous limits:
- **1 message per second** per webhook
- **No daily limit**
- Much higher than Telegram or Twitter

For your use case (social media scheduling), limits are not a concern.

---

## Multiple Workspaces

You can connect webhooks from **different Slack workspaces**:

1. Create webhook in Workspace A → Connect in app
2. Create webhook in Workspace B → Connect in app
3. Post to both simultaneously

Each workspace appears as a separate connected account.

---

## Use Cases

### Team Notifications

```
Post to #announcements whenever:
- New blog post published
- Product launch
- Company update
```

### Content Distribution

```
Cross-post social media content to:
- #marketing channel
- #social-media channel
- Team sees what's being published
```

### Automation Workflows

```
Trigger Slack messages for:
- Scheduled post reminders
- Failed post alerts
- Analytics summaries
```

---

## Comparison with Other Platforms

| Feature | Slack | Telegram | Discord |
|---------|-------|----------|---------|
| **Setup** | Webhook (2 min) | Bot token (5 min) | Webhook (2 min) |
| **Auth** | None | Bot token | None |
| **Approval** | None | None | None |
| **Images** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Videos** | ❌ Link only | ✅ Yes | ✅ Yes |
| **Audience** | Team/Business | Public/Private | Community |

---

## FAQs

### Can I post to private channels?

**Yes!** When creating the webhook, select any channel you have access to (public or private).

### Can I post to DMs?

**No.** Incoming webhooks only work for channels, not direct messages.

### Can I customize the message appearance?

**Yes!** Configure in Slack webhook settings:
- Bot username
- Bot icon
- Default channel

### Is there a cost?

**No.** Incoming webhooks are **free** on all Slack plans (Free, Pro, Business+).

### How many webhooks can I create?

**Unlimited!** Create as many as you need for different channels/workspaces.

---

## Additional Resources

- [Slack Incoming Webhooks Documentation](https://api.slack.com/messaging/webhooks)
- [Slack Block Kit Builder](https://app.slack.com/block-kit-builder)
- [Slack App Directory](https://slack.com/apps)

---

## Next Steps

1. ✅ Create webhook in Slack
2. ✅ Connect in Social Media Automator
3. ✅ Test posting to Slack
4. ✅ Schedule posts to Slack
5. ✅ Enjoy automated team communication!

---

**Author**: Aj (@ajay-automates)  
**Last Updated**: November 2025  
**Status**: ✅ Production Ready

