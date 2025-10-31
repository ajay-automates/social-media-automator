# 📱 Telegram Bot Setup Guide

## Overview
Telegram Bot integration allows users to connect their own Telegram bot and post to channels/groups.

**Key Point:** Each user provides their own bot token (no system-wide setup needed!)

---

## User Setup Instructions

### Step 1: Create Your Telegram Bot
1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow instructions to name your bot
4. **Copy the bot token** (looks like: `123456:ABC-DEF...`)

### Step 2: Add Bot to Your Channel/Group
1. Create or open your Telegram channel/group
2. Add your bot as an **admin** with posting permissions
3. For **private groups**: Get chat ID using [@userinfobot](https://t.me/userinfobot)
4. For **public channels**: Use the @username (e.g., `@mychannel`)

### Step 3: Connect in Dashboard
1. Click "Connect Telegram" button
2. Enter your bot token
3. Enter your chat ID (`@username` for public or numeric ID for private)
4. Click "Connect Telegram Bot"

---

## What Gets Stored

**Database Table:** `user_accounts`

```sql
{
  user_id: "user-id-from-auth",
  platform: "telegram",
  platform_name: "Your Bot Name",
  oauth_provider: "manual",
  access_token: "bot-token-from-user",  // Bot token
  platform_user_id: "chat-id",          // Channel/chat ID
  platform_username: "bot-username",
  status: "active"
}
```

---

## API Endpoints

### POST /api/auth/telegram/connect
**Purpose:** Connect user's Telegram bot

**Request:**
```json
{
  "botToken": "123456:ABC-DEF...",
  "chatId": "@my_channel"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Telegram bot connected successfully",
  "bot": {
    "id": 123456789,
    "username": "my_bot",
    "first_name": "My Bot"
  }
}
```

---

## How Posting Works

When user posts to Telegram:

1. System loads user's credentials from database
2. Calls Telegram Bot API: `POST https://api.telegram.org/bot{TOKEN}/sendMessage`
3. For media: Uses `sendPhoto` or `sendVideo` endpoints
4. Returns success/failure to user

---

## Supported Features

✅ Text posts  
✅ Image posts (PNG, JPG, WebP)  
✅ Video posts (up to 2GB - largest of any platform!)  
✅ HTML formatting in text  
✅ Captions with media  

---

## Differences from OAuth Platforms

| Feature | LinkedIn/Twitter | Telegram |
|---------|------------------|----------|
| **Setup** | Developer app with OAuth | User's own bot |
| **Credentials** | App-specific keys in `.env` | User-provided in UI |
| **Security** | OAuth 2.0 flow | Bot token validation |
| **Token Storage** | Encrypted in database | Encrypted in database |
| **Multi-user** | Shared app credentials | Each user's own bot |

---

## Troubleshooting

### "Telegram bot not connected"
- Bot token not saved in database
- Try disconnecting and reconnecting
- Check browser console for errors

### "Invalid bot token"
- Token is incorrect or expired
- Check with BotFather: `/token`
- Recreate bot if needed

### "Chat not found"
- Chat ID is incorrect
- Bot must be admin in channel/group
- For private groups, use numeric ID (e.g., `-100123456789`)

### Posts not sending
- Bot doesn't have permission to post
- Add bot as admin with "Post Messages" permission
- Check bot status with BotFather: `/mybots`

---

## Security Notes

1. **Bot tokens are sensitive** - stored encrypted in database
2. **Each user's bot** - complete isolation between users
3. **Validation on connect** - token verified via Telegram API
4. **No shared credentials** - unlike OAuth apps, each user has their own bot

---

## Example Bot Creation

```bash
# In Telegram, message @BotFather

You: /newbot
BotFather: Alright, a new bot. How are we going to call it? Please choose a name for your bot.

You: My Social Media Bot
BotFather: Good. Now let's choose a username for your bot. It must end in `bot`.

You: my_social_media_bot
BotFather: Done! Congratulations on your new bot.
         Token: 8459859445:AAFlYhcVCgqVu-6cwRq60P3XiGc1-s3XnWY
         
# Use this token in the dashboard!
```

---

## Your Current Bot

**Bot Token:** `8459859445:AAFlYhcVCgqVu-6cwRq60P3XiGc1-s3XnWY`  
**Bot Username:** `@ajay_reddy_bot`  
**Chat ID:** `5115310175`

**Status:** ✅ Valid and Working

---

## Resources

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots/api#botfather-commands)
- [Chat IDs Guide](https://core.telegram.org/bots/api#getchat)

