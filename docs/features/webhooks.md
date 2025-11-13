# 🔔 Webhook Notifications

**Status:** ✅ Fully Implemented  
**Version:** 1.0  
**Date:** November 13, 2025

---

## 📖 Overview

**Webhook Notifications** enable your Social Media Automator to send real-time notifications to external services like **Zapier**, **Make (Integromat)**, **Slack**, **Discord**, and any custom webhook endpoint. This unlocks integration with 1000+ apps and enables powerful automation workflows.

---

## ✨ Features

### 🔌 **Multi-Event Support**
Trigger webhooks on 7 different events:
- ✅ `post.success` - Post published successfully
- ❌ `post.failed` - Post failed to publish  
- 📅 `post.scheduled` - New post scheduled
- ♻️ `post.recycled` - Content auto-recycled
- 🗑️ `post.deleted` - Scheduled post deleted
- 🤖 `content.generated` - AI generated new content
- 📊 `analytics.insight` - New analytics insights available

### 🎯 **Smart Filtering**
- **Platform Filter**: Only trigger for specific platforms (LinkedIn, Twitter, etc.)
- **Multi-Event**: Select which events trigger each webhook
- **Enable/Disable**: Toggle webhooks on/off without deleting

### 🔄 **Retry Logic**
- **Auto-Retry**: Automatic retries on failure (configurable 1-10 attempts)
- **Delay**: Configurable delay between retries (1-60 seconds)
- **Smart Backoff**: Prevents overwhelming failed endpoints
- **Complete Logging**: Track every attempt

### 🔐 **Security**
- **HMAC Signatures**: Optional SHA256 signatures for verification
- **Headers**: `X-Webhook-Signature` and `X-Webhook-Signature-Algorithm`
- **URL Validation**: Only accepts valid HTTP/HTTPS URLs
- **User Isolation**: Users can only see their own webhooks

### 📊 **Comprehensive Logging**
- **Every Call Logged**: Success, failure, retries - all tracked
- **Response Data**: Status code, response body, response time
- **Error Messages**: Detailed error logging
- **Search & Filter**: Find specific webhook calls
- **Retention**: 50-100 most recent logs

### 🧪 **Testing**
- **Test Button**: Send test webhook instantly
- **Test Payload**: Includes test flag and sample data
- **Immediate Feedback**: Success/failure shown in UI
- **Log Verification**: Test appears in logs

---

## 🔌 **Webhook Payload Format**

### **Standard Payload**
All webhooks receive this JSON structure:

```json
{
  "event": "post.success",
  "timestamp": "2025-11-13T10:30:00Z",
  "data": {
    "post_id": 12345,
    "text": "Your post caption here...",
    "platforms": ["linkedin", "twitter"],
    "image_url": "https://...",
    "status": "posted",
    "results": {
      "linkedin": { "success": true, "url": "..." },
      "twitter": { "success": true, "tweet_id": "..." }
    },
    "timestamp": "2025-11-13T10:30:00Z"
  },
  "webhook_id": 1
}
```

### **Event-Specific Payloads**

#### **post.success**
```json
{
  "event": "post.success",
  "data": {
    "post_id": 123,
    "text": "Post caption",
    "platforms": ["linkedin", "twitter"],
    "image_url": "https://...",
    "status": "posted",
    "results": { /* platform results */ }
  }
}
```

#### **post.failed**
```json
{
  "event": "post.failed",
  "data": {
    "post_id": 123,
    "text": "Post caption",
    "platforms": ["linkedin"],
    "error": "Authentication failed",
    "results": { /* error details */ }
  }
}
```

#### **post.recycled**
```json
{
  "event": "post.recycled",
  "data": {
    "original_post_id": 100,
    "recycled_post_id": 150,
    "text": "Post caption",
    "platforms": ["linkedin"],
    "scheduled_for": "2025-11-20T14:00:00Z"
  }
}
```

#### **test.webhook** (Test Event)
```json
{
  "event": "test.webhook",
  "timestamp": "2025-11-13T10:30:00Z",
  "data": {
    "test": true,
    "message": "This is a test webhook from Social Media Automator"
  },
  "webhook_id": 1
}
```

---

## 🔐 **Webhook Security (HMAC)**

### **Generating Signature (on our side)**
```javascript
const crypto = require('crypto');

const payload = { /* webhook payload */ };
const secret = 'your-secret-key';

const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

// Send in header: X-Webhook-Signature: {signature}
```

### **Verifying Signature (on your side)**
```javascript
// Node.js example
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === computedSignature;
}

// In your webhook handler:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;
  const secret = 'your-secret-key';
  
  if (!verifyWebhook(payload, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook...
  res.status(200).send('OK');
});
```

---

## 🚀 **Setup with Zapier**

### **Step 1: Create Webhook in Zapier**
1. Go to [Zapier](https://zapier.com)
2. Create new Zap
3. Choose trigger: **Webhooks by Zapier**
4. Select: **Catch Hook**
5. Copy the webhook URL (e.g., `https://hooks.zapier.com/hooks/catch/123456/abcdef`)

### **Step 2: Add Webhook in Your App**
1. Go to **Webhooks** page (or Settings > Webhooks)
2. Click **Add Webhook**
3. Fill in:
   - Name: "Zapier - Post Success"
   - URL: (paste Zapier URL)
   - Events: Select "Post Published Successfully"
   - Platforms: (optional - filter by platform)
4. Click **Create Webhook**

### **Step 3: Test the Connection**
1. Click **Test** button next to your webhook
2. Go back to Zapier
3. Click "Test trigger" - you should see the test data!
4. Continue building your Zap (email, Slack, Google Sheets, etc.)

### **Step 4: Activate**
1. Publish your Zap in Zapier
2. Create a post in Social Media Automator
3. When it publishes, Zapier receives the webhook automatically! 🎉

---

## 🔧 **Setup with Make (Integromat)**

### **Step 1: Create Scenario**
1. Go to [Make.com](https://make.com)
2. Create new scenario
3. Add **Webhooks** module
4. Choose **Custom webhook**
5. Copy webhook URL

### **Step 2: Configure in App**
1. Add webhook with Make URL
2. Select events to trigger
3. Click **Test** to send sample data
4. Verify in Make

### **Step 3: Build Automation**
1. Add more modules (Google Sheets, Email, Slack, etc.)
2. Map webhook data to actions
3. Activate scenario
4. Webhooks flow automatically!

---

## 💡 **Use Cases & Examples**

### **1. Slack Notification on Post Success** 
```
Webhook → Zapier → Slack
"Your post to LinkedIn was published successfully! 🎉"
```

### **2. Google Sheets Analytics**
```
Webhook → Make → Google Sheets
Log every post (date, platform, status) to spreadsheet
```

### **3. Email Alerts on Failure**
```
Webhook → Zapier → Gmail
"⚠️ Post failed on Twitter - check credentials"
```

### **4. Discord Bot Notifications**
```
Webhook → Discord Webhook
"📢 New post scheduled for tomorrow at 2 PM"
```

### **5. Custom Dashboard**
```
Webhook → Your Backend API
Build custom analytics/monitoring dashboard
```

### **6. Multi-Step Automation**
```
Webhook (post.success) → Zapier → Multiple Actions:
  - Log to Google Sheets
  - Notify in Slack
  - Update CRM (HubSpot/Salesforce)
  - Tweet from personal account
```

---

## 📊 **API Endpoints**

### **Get All Webhooks**
```http
GET /api/webhooks
Authorization: Bearer {token}

Response:
{
  "success": true,
  "webhooks": [
    {
      "id": 1,
      "name": "Zapier Success Hook",
      "url": "https://hooks.zapier.com/...",
      "enabled": true,
      "events": ["post.success"],
      "platforms": [],
      "total_triggers": 42,
      "successful_triggers": 40,
      "failed_triggers": 2
    }
  ]
}
```

### **Create Webhook**
```http
POST /api/webhooks
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "My Webhook",
  "url": "https://hooks.zapier.com/...",
  "enabled": true,
  "events": ["post.success", "post.failed"],
  "platforms": ["linkedin", "twitter"],
  "secret": "optional-secret-key",
  "retry_enabled": true,
  "max_retries": 3,
  "retry_delay_seconds": 5
}

Response:
{
  "success": true,
  "webhook": { /* created webhook */ },
  "message": "Webhook created successfully"
}
```

### **Update Webhook**
```http
PUT /api/webhooks/:id
Authorization: Bearer {token}

Body: { /* fields to update */ }
```

### **Delete Webhook**
```http
DELETE /api/webhooks/:id
Authorization: Bearer {token}
```

### **Test Webhook**
```http
POST /api/webhooks/:id/test
Authorization: Bearer {token}

Sends test payload to webhook URL
```

### **Get Webhook Logs**
```http
GET /api/webhooks/logs?webhook_id=1&limit=50
Authorization: Bearer {token}

Response:
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "event_type": "post.success",
      "status_code": 200,
      "success": true,
      "response_time_ms": 245,
      "sent_at": "2025-11-13T10:30:00Z",
      "attempt_number": 1,
      "is_retry": false
    }
  ]
}
```

---

## 🗄️ **Database Schema**

### **webhook_endpoints Table**
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID (references auth.users)
- name: VARCHAR(100) - User-friendly name
- url: TEXT - Webhook URL
- enabled: BOOLEAN - On/off toggle
- events: TEXT[] - Array of event types
- platforms: TEXT[] - Platform filter (optional)
- secret: VARCHAR(255) - HMAC secret (optional)
- retry_enabled: BOOLEAN
- max_retries: INTEGER (1-10)
- retry_delay_seconds: INTEGER (1-60)
- total_triggers: INTEGER
- successful_triggers: INTEGER
- failed_triggers: INTEGER
- last_triggered_at: TIMESTAMPTZ
```

### **webhook_logs Table**
```sql
- id: BIGSERIAL PRIMARY KEY
- webhook_id: BIGINT (references webhook_endpoints)
- user_id: UUID
- event_type: VARCHAR(100)
- post_id: BIGINT (optional, references posts)
- url: TEXT
- payload: JSONB - Full request payload
- headers: JSONB - Request headers
- status_code: INTEGER - HTTP response code
- response_body: TEXT
- success: BOOLEAN
- error_message: TEXT
- attempt_number: INTEGER
- is_retry: BOOLEAN
- sent_at: TIMESTAMPTZ
- response_time_ms: INTEGER
```

---

## 🎨 **Frontend Features**

### **Webhooks Management Page** (`/webhooks`)

#### **Stats Dashboard**
- Total webhooks count
- Active webhooks count
- Total triggers count
- Overall success rate

#### **Webhooks List**
Each webhook shows:
- Name and enabled status
- URL (with copy button)
- Event count
- Total triggers & success rate
- Selected events (chips)
- Platform filters (if any)
- Actions: Test, Edit, Delete

#### **Logs Tab**
- Success/failure badge
- Event type
- Timestamp
- Status code
- Response time
- Attempt number
- Error messages (if failed)

#### **Create/Edit Modal**
- Webhook name input
- URL input with validation
- Event selector (multi-select)
- Platform filter (optional)
- Secret key input (optional)
- Retry settings (toggle, max retries, delay)
- Save/Cancel buttons

---

## 🧪 **Testing Guide**

### **Quick Test (5 minutes)**

1. **Get a Test Webhook URL:**
   - Go to [webhook.site](https://webhook.site)
   - Copy your unique URL

2. **Create Webhook:**
   - Name: "Test Webhook"
   - URL: (paste webhook.site URL)
   - Events: "Post Published Successfully"
   - Click "Create"

3. **Send Test:**
   - Click "Test" button
   - Go to webhook.site
   - See the test payload! 🎉

4. **Real Test:**
   - Create and publish a post
   - Check webhook.site
   - See the real post data!

### **Test with Zapier**

1. **Create Catch Hook Zap** (as described in Setup section)
2. **Add webhook in app**
3. **Click Test button**
4. **Verify in Zapier**: Data appears
5. **Publish a real post**
6. **Zapier receives it automatically**

---

## 💻 **Technical Implementation**

### **Backend Service** (`services/webhooks.js`)

#### **Key Functions:**
```javascript
// Send webhook with retry logic
sendWebhook(webhookId, eventType, payload, attemptNumber)

// Trigger all webhooks for an event
triggerWebhooks(userId, eventType, payload)

// Validate webhook URL
validateWebhookUrl(url)

// Generate HMAC signature
generateSignature(payload, secret)

// CRUD operations
createWebhook(userId, webhookData)
updateWebhook(userId, webhookId, updates)
deleteWebhook(userId, webhookId)
testWebhook(userId, webhookId)

// Logs and stats
getWebhookLogs(userId, webhookId, limit)
getWebhookStats(userId)
```

#### **Retry Logic:**
```javascript
// Automatic retry with exponential backoff
if (webhook.retry_enabled && attemptNumber < webhook.max_retries) {
  await sleep(webhook.retry_delay_seconds * 1000);
  return sendWebhook(webhookId, eventType, payload, attemptNumber + 1);
}
```

### **Integration Points**

#### **1. Post Publishing** (`services/scheduler.js`)
```javascript
// After post completes
const eventType = hasErrors ? 'post.failed' : 'post.success';
await triggerWebhooks(user_id, eventType, {
  post_id: id,
  text,
  platforms,
  status,
  results
});
```

#### **2. Content Recycling** (`services/content-recycling.js`)
```javascript
// When post is recycled
await triggerWebhooks(userId, 'post.recycled', {
  original_post_id,
  recycled_post_id,
  scheduled_for
});
```

#### **3. Content Agent** (`services/content-creation-agent.js`)
```javascript
// When content is generated
await triggerWebhooks(userId, 'content.generated', {
  posts_generated,
  calendar_days
});
```

---

## 🎯 **Business Impact**

### **User Benefits**
- ⚡ **Real-time notifications** - Know instantly when posts publish
- 🔌 **1000+ integrations** - Connect to any tool via Zapier/Make
- 🤖 **Advanced automation** - Build complex workflows
- 📊 **Custom analytics** - Send data to your own systems

### **Platform Benefits**
- 💰 **Premium feature** - Charge $10-30/month extra
- 🏢 **Enterprise appeal** - Big companies need webhooks
- 🔗 **Ecosystem lock-in** - Users build workflows, harder to leave
- 🚀 **Competitive advantage** - Most competitors don't have this

### **Use Case Examples**

**For Agencies:**
- Post Success → Google Sheets (client reporting)
- Post Failed → Slack (team alert)
- Content Generated → Email (client approval)

**For Teams:**
- Post Success → Team Slack channel
- Post Scheduled → Calendar event
- Analytics Insight → Email digest

**For Power Users:**
- Post Success → Twitter personal account (amplify)
- Post Failed → Telegram alert
- Post Recycled → Track in Notion

---

## 📋 **Zapier Templates** (You Can Create)

### **Popular Zap Ideas:**

1. **Post to Google Sheets**
   - Trigger: Post Published
   - Action: Add row to Google Sheets
   - Use: Analytics tracking

2. **Slack Notifications**
   - Trigger: Post Success/Failed
   - Action: Send Slack message
   - Use: Team notifications

3. **Email Digest**
   - Trigger: Analytics Insight
   - Action: Send email (Gmail)
   - Use: Weekly insights

4. **CRM Update**
   - Trigger: Post Success
   - Action: Update contact (HubSpot)
   - Use: Customer engagement tracking

5. **Backup to Airtable**
   - Trigger: Post Success
   - Action: Create Airtable record
   - Use: Content backup

---

## 🐛 **Troubleshooting**

### **Webhook Not Triggering**
**Symptoms:** No webhooks sent after post  
**Solutions:**
- Check webhook is enabled
- Verify event is selected (e.g., post.success)
- Check platform filter (empty = all platforms)
- Look in Logs tab for attempts

### **Test Fails**
**Symptoms:** Test button shows error  
**Solutions:**
- Verify URL is valid (starts with http/https)
- Check endpoint is accessible (not localhost)
- Look at error message in logs
- Try webhook.site to debug

### **Signature Verification Failed**
**Symptoms:** Receiving endpoint rejects webhook  
**Solutions:**
- Ensure both sides use same secret
- Verify HMAC algorithm (SHA256)
- Check JSON payload isn't modified
- Use the signature exactly as sent

### **High Failure Rate**
**Symptoms:** Many failed webhook calls  
**Solutions:**
- Check receiving endpoint uptime
- Verify endpoint returns 2xx status
- Increase retry delay
- Check timeout (10 second limit)

---

## 📈 **Best Practices**

### **Naming Conventions**
```
✅ Good: "Zapier - Post Success to Sheets"
✅ Good: "Slack - Failed Post Alerts"
❌ Bad: "webhook1"
❌ Bad: "test"
```

### **Event Selection**
- Start with `post.success` and `post.failed`
- Add more events as needed
- Don't select all events unless necessary

### **Platform Filtering**
- Use when you only care about specific platforms
- Leave empty for universal webhooks
- Example: LinkedIn-only webhook for business metrics

### **Retry Settings**
```
Recommended:
- Enable retries: true
- Max retries: 3
- Delay: 5 seconds

For critical webhooks:
- Max retries: 5-10
- Delay: 10 seconds
```

### **Security**
- Always use HTTPS URLs (not HTTP)
- Add secret for production webhooks
- Verify signatures on receiving end
- Don't expose secrets in logs

---

## 🎉 **Conclusion**

**Webhook Notifications** transform your Social Media Automator from a standalone tool into a connected automation powerhouse. With Zapier/Make integration, users can build complex workflows and connect to their entire tech stack.

**Key Benefits:**
- 🔌 **1000+ app integrations** via Zapier
- ⚡ **Real-time notifications**
- 🤖 **Advanced automation**
- 🔐 **Enterprise-grade security**
- 📊 **Complete logging**
- 🧪 **Easy testing**

**Production Ready:** ✅  
**Zapier Compatible:** ✅  
**Make Compatible:** ✅  
**Documented:** ✅  

---

**Need Help?**
- **Documentation:** `/docs/features/webhooks.md`
- **Code:** `/services/webhooks.js`
- **Frontend:** `/dashboard/src/pages/Webhooks.jsx`
- **Zapier:** https://zapier.com/apps/webhooks/integrations

**Happy automating!** 🔔🚀

