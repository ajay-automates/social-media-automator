# Slack Integration Testing Guide

## Quick Test Instructions

### Step 1: Create Slack Test Webhook

1. **Go to:** https://api.slack.com/messaging/webhooks
2. **Click:** "Create your Slack app"
3. **Select:** "From scratch"
4. **Name:** "Social Media Automator Test"
5. **Select workspace:** Your workspace
6. **Click:** "Incoming Webhooks"
7. **Toggle:** "Activate Incoming Webhooks" to ON
8. **Click:** "Add New Webhook to Workspace"
9. **Select channel:** #general (or test channel)
10. **Copy the webhook URL** (starts with https://hooks.slack.com/services/)

### Step 2: Connect in Your App

1. **Start server:** `npm start` (if not running)
2. **Open:** http://localhost:3000/dashboard
3. **Go to:** Settings page
4. **Click:** "Connect Slack" button
5. **Paste webhook URL**
6. **Enter channel name:** #general
7. **Click:** "Connect"
8. **Check Slack** - you should see a test message!

### Step 3: Test Text-Only Post

1. **Go to:** Create Post page
2. **Type:** "Testing Slack integration! 🚀"
3. **Check:** Slack checkbox only
4. **Click:** "Post Now"
5. **Check Slack channel** - message should appear

✅ **Expected:** Message appears in Slack within 1-2 seconds

### Step 4: Test Image Post

1. **Create new post**
2. **Type:** "Testing with image! 📸"
3. **Upload image** or generate AI image
4. **Check:** Slack checkbox
5. **Click:** "Post Now"
6. **Check Slack** - message with embedded image

✅ **Expected:** Message with inline image in Slack

### Step 5: Test Multi-Platform

1. **Create new post**
2. **Type:** "Multi-platform test"
3. **Check:** Slack + Twitter + LinkedIn
4. **Click:** "Post Now"
5. **Check all platforms** - should appear on all

✅ **Expected:** Posted to all selected platforms

### Step 6: Test Scheduled Post

1. **Create new post**
2. **Type:** "Scheduled Slack post"
3. **Check:** Slack
4. **Select:** Schedule for 2 minutes from now
5. **Click:** "Schedule Post"
6. **Wait 2 minutes**
7. **Check Slack** - message appears automatically

✅ **Expected:** Message posts at scheduled time

---

## Testing Checklist

- [ ] Webhook connects successfully
- [ ] Test message appears in Slack
- [ ] Text-only post works
- [ ] Post with image works
- [ ] Video shows as link (expected behavior)
- [ ] Multi-platform posting includes Slack
- [ ] Scheduled posts to Slack work
- [ ] Slack appears in connected accounts
- [ ] Can disconnect Slack
- [ ] Reconnect with different webhook works
- [ ] Multiple Slack channels can be connected

---

## Expected Behavior

### Successful Post

Slack shows:
```
Social Media Automator [APP]  12:30 PM
Testing Slack integration! 🚀
```

### With Image

```
Social Media Automator [APP]  12:30 PM
Testing with image! 📸

[Image displayed inline]
```

### Error Handling

If webhook is invalid:
- ❌ Connection fails with error message
- User sees: "Invalid webhook URL" toast

If channel deleted:
- Post attempt fails gracefully
- Error logged but doesn't crash
- User notified of failure

---

## Verification

After all tests pass:
- ✅ Slack integration is production ready
- ✅ Users can connect and post
- ✅ Ready to push to production

---

## Need Help?

If tests fail, check:
1. Webhook URL is correct (copy-paste from Slack)
2. Slack channel exists and is not archived
3. Server is running
4. Dashboard is built (`cd dashboard && npm run build`)
5. Check browser console for errors
6. Check server logs for errors

---

**Happy testing!** 🚀

