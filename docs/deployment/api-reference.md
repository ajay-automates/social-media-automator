# 📡 API Reference

Complete API documentation for all endpoints in the Social Media Automator platform.

## Base URL

**Development:**
```
http://localhost:3000/api
```

**Production:**
```
https://your-domain.com/api
```

---

## Authentication

All API endpoints (except OAuth callbacks) require JWT authentication.

**Header:**
```http
Authorization: Bearer {jwt_token}
```

**Get JWT token:**
1. User signs in via Supabase Auth
2. Token stored in localStorage
3. Automatically attached by axios interceptor

---

## Endpoints Overview

### Authentication & OAuth
- `POST /api/auth/linkedin/url` - Get LinkedIn OAuth URL
- `GET /auth/linkedin/callback` - LinkedIn OAuth callback
- `POST /api/auth/twitter/url` - Get Twitter OAuth URL
- `GET /auth/twitter/callback` - Twitter OAuth callback
- `POST /api/auth/telegram/connect` - Connect Telegram bot
- `POST /api/auth/instagram/url` - Get Instagram OAuth URL
- `GET /auth/instagram/callback` - Instagram OAuth callback
- `POST /api/auth/facebook/url` - Get Facebook OAuth URL
- `GET /auth/facebook/callback` - Facebook OAuth callback
- `POST /api/auth/youtube/url` - Get YouTube OAuth URL
- `GET /auth/youtube/callback` - YouTube OAuth callback

### Posting
- `POST /api/post/now` - Post immediately
- `POST /api/post/schedule` - Schedule a post
- `POST /api/post/bulk` - Bulk schedule posts
- `POST /api/post/bulk-csv` - Upload CSV for bulk scheduling

### Queue Management
- `GET /api/queue` - Get scheduled posts
- `DELETE /api/queue/:id` - Remove from queue

### Analytics
- `GET /api/history` - Get post history
- `GET /api/analytics/overview` - Dashboard stats
- `GET /api/analytics/platforms` - Platform distribution
- `GET /api/analytics/timeline` - Timeline data

### Account Management
- `GET /api/accounts` - List connected accounts
- `DELETE /api/user/accounts/:platform/:accountId` - Disconnect account

### AI Generation
- `POST /api/ai/generate` - Generate AI captions
- `POST /api/ai/image/generate` - Generate AI images

### Templates
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get single template
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/use` - Increment use count
- `POST /api/templates/:id/favorite` - Toggle favorite
- `POST /api/templates/:id/duplicate` - Duplicate template

### Billing
- `GET /api/billing/plans` - Get all plans
- `POST /api/billing/checkout` - Create Stripe checkout
- `POST /api/billing/portal` - Open billing portal
- `GET /api/billing/usage` - Get usage stats

### Media Upload
- `POST /api/upload/image` - Upload image
- `POST /api/upload/video` - Upload video

### System
- `GET /api/health` - Health check

---

## Detailed Endpoints

### POST /api/post/now

Post immediately to selected platforms.

**Request Body:**
```json
{
  "text": "Your post content here",
  "imageUrl": "https://cloudinary.com/...",
  "platforms": ["linkedin", "twitter", "telegram"]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "linkedin": [
      {
        "success": true,
        "postId": "urn:li:share:123456",
        "url": "https://www.linkedin.com/feed/update/urn:li:share:123456",
        "account": "John Doe"
      }
    ],
    "twitter": [
      {
        "success": true,
        "id": "1234567890",
        "url": "https://twitter.com/i/web/status/1234567890"
      }
    ]
  },
  "postId": 123
}
```

---

### POST /api/post/schedule

Schedule a post for later.

**Request Body:**
```json
{
  "text": "Your post content",
  "imageUrl": "https://cloudinary.com/...",
  "platforms": ["linkedin", "twitter"],
  "scheduleTime": "2025-02-01T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "postId": 123,
  "scheduleTime": "2025-02-01T10:00:00Z",
  "status": "queued"
}
```

---

### POST /api/ai/generate

Generate AI captions using Claude.

**Request Body:**
```json
{
  "topic": "productivity tips",
  "niche": "business",
  "platform": "linkedin"
}
```

**Niche options:**
- `business`
- `tech`
- `lifestyle`
- `fitness`
- `food`
- `travel`

**Response:**
```json
{
  "success": true,
  "captions": [
    "🚀 Productivity Tip: Start your day with your most important task...",
    "💡 Want to boost productivity? Try the 2-minute rule...",
    "⏰ Time management hack: Block your calendar in 90-minute chunks..."
  ]
}
```

---

### POST /api/ai/image/generate

Generate AI images using Stability AI.

**Request Body:**
```json
{
  "prompt": "modern office workspace, minimalist, natural lighting",
  "style": "photorealistic"
}
```

**Style options:**
- `photorealistic`
- `digital-art`
- `oil-painting`
- `watercolor`
- `comic-book`
- `anime`

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/...",
  "prompt": "modern office workspace...",
  "style": "photorealistic"
}
```

---

### GET /api/accounts

Get all connected social media accounts.

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": 1,
      "platform": "linkedin",
      "platform_name": "LinkedIn",
      "platform_username": "John Doe",
      "platform_user_id": "abc123",
      "status": "active",
      "connected_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "platform": "twitter",
      "platform_name": "Twitter",
      "platform_username": "@johndoe",
      "status": "active"
    }
  ]
}
```

---

### DELETE /api/user/accounts/:platform/:accountId

Disconnect a specific account.

**Parameters:**
- `platform` - Platform name (linkedin, twitter, etc.)
- `accountId` - Account ID from database

**Response:**
```json
{
  "success": true,
  "message": "Account disconnected successfully"
}
```

---

### GET /api/history

Get post history with optional filtering.

**Query Parameters:**
- `limit` - Number of posts (default: 50)
- `platform` - Filter by platform
- `status` - Filter by status (posted, failed, queued)

**Example:**
```
GET /api/history?limit=10&platform=linkedin&status=posted
```

**Response:**
```json
{
  "success": true,
  "posts": [
    {
      "id": 123,
      "text": "Post content",
      "image_url": "https://...",
      "platforms": ["linkedin", "twitter"],
      "status": "posted",
      "created_at": "2025-01-20T10:00:00Z",
      "results": {
        "linkedin": [{ "success": true, "postId": "..." }]
      }
    }
  ],
  "total": 100
}
```

---

### GET /api/analytics/overview

Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPosts": 150,
    "postsThisMonth": 25,
    "successRate": 98.5,
    "platformBreakdown": {
      "linkedin": 50,
      "twitter": 60,
      "telegram": 40
    },
    "recentActivity": [
      {
        "date": "2025-01-20",
        "count": 5
      }
    ]
  }
}
```

---

### GET /api/templates

Get all templates for user.

**Query Parameters:**
- `category` - Filter by category
- `favorite` - Show only favorites (true/false)
- `search` - Search in name/description/text
- `sort` - Sort by (created_at, use_count, name)

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": 1,
      "name": "Weekly Tip",
      "description": "Monday motivation",
      "text": "💡 Tip: {{tip_content}}",
      "platforms": ["linkedin", "twitter"],
      "category": "educational",
      "use_count": 15,
      "is_favorite": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "count": 10
}
```

---

### POST /api/templates

Create a new template.

**Request Body:**
```json
{
  "name": "Product Launch",
  "description": "Standard product announcement",
  "text": "🚀 Excited to announce {{product_name}}!",
  "platforms": ["linkedin", "twitter"],
  "category": "promotional",
  "tags": ["product", "launch"]
}
```

**Response:**
```json
{
  "success": true,
  "template": {
    "id": 10,
    "name": "Product Launch",
    ...
  }
}
```

---

### GET /api/billing/usage

Get current usage and limits.

**Response:**
```json
{
  "success": true,
  "usage": {
    "posts": {
      "used": 25,
      "limit": 100,
      "remaining": 75,
      "percentage": 25
    },
    "ai_captions": {
      "used": 10,
      "limit": 50,
      "remaining": 40,
      "percentage": 20
    },
    "accounts": {
      "used": 2,
      "limit": 3
    }
  },
  "plan": "pro",
  "billing_cycle": "monthly"
}
```

---

### POST /api/billing/checkout

Create Stripe checkout session.

**Request Body:**
```json
{
  "plan": "pro",
  "billingCycle": "monthly",
  "successUrl": "https://your-domain.com/success",
  "cancelUrl": "https://your-domain.com/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Missing or invalid authentication token",
  "code": "UNAUTHORIZED"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Post limit reached. Upgrade to Pro for unlimited posts.",
  "code": "LIMIT_REACHED",
  "upgrade_url": "/pricing"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND"
}
```

**429 Too Many Requests**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 60 seconds.",
  "code": "RATE_LIMIT",
  "retry_after": 60
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "SERVER_ERROR"
}
```

---

## Rate Limiting

**Limits:**
- 100 requests per 15 minutes per user
- 1000 requests per hour per IP

**Response headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Webhooks

### Stripe Webhook

**Endpoint:** `POST /api/billing/webhook`

**Events handled:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Authentication:** Stripe signature verification

---

## Code Examples

### JavaScript (Axios)

```javascript
import axios from 'axios';

// Setup axios with auth
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${getToken()}`
  }
});

// Post now
const response = await api.post('/post/now', {
  text: 'Hello world!',
  platforms: ['linkedin', 'twitter']
});

console.log(response.data);
```

### cURL

```bash
# Post now
curl -X POST http://localhost:3000/api/post/now \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world!",
    "platforms": ["linkedin", "twitter"]
  }'
```

### Python

```python
import requests

# Setup headers
headers = {
    'Authorization': f'Bearer {jwt_token}',
    'Content-Type': 'application/json'
}

# Post now
response = requests.post(
    'http://localhost:3000/api/post/now',
    headers=headers,
    json={
        'text': 'Hello world!',
        'platforms': ['linkedin', 'twitter']
    }
)

print(response.json())
```

---

## Testing

### Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "Social Media Automator API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Post Now",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": "{{base_url}}/api/post/now",
        "body": {
          "mode": "raw",
          "raw": "{\"text\":\"Test post\",\"platforms\":[\"linkedin\"]}"
        }
      }
    }
  ]
}
```

---

## Resources

- [Getting Started](../getting-started/quick-start.md)
- [OAuth Configuration](../features/oauth.md)
- [Testing Guide](testing-guide.md)

---

**Version:** 3.2  
**Last Updated:** January 2025  
**Status:** ✅ Production-ready

