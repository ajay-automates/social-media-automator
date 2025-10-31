# 💳 Billing & Pricing

Complete guide to Stripe integration, pricing tiers, and usage limits.

## Overview

The platform uses Stripe for:
- Subscription management
- Usage tracking
- Payment processing
- Customer portal
- Webhook handling

---

## Pricing Tiers

### Free Plan - $0/month

**Limits:**
- 10 posts per month
- 1 social account
- No AI captions
- LinkedIn OR Twitter only
- Community support

**Perfect for:** Testing, personal use, getting started

### Pro Plan - $29/month ($290/year)

**Limits:**
- ♾️ Unlimited posts
- 3 social accounts
- 100 AI captions/month
- All platforms
- Email support

**Perfect for:** Small businesses, influencers, agencies

**Annual savings:** $58/year (2 months free)

### Business Plan - $99/month ($990/year)

**Limits:**
- ♾️ Unlimited posts
- 10 social accounts
- ♾️ Unlimited AI captions
- All platforms
- Priority support
- API access
- White-label option

**Perfect for:** Agencies, enterprises, teams

**Annual savings:** $198/year (2 months free)

---

## Feature Comparison

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| **Posts/Month** | 10 | Unlimited | Unlimited |
| **Social Accounts** | 1 | 3 | 10 |
| **AI Captions** | ❌ 0 | 100/mo | Unlimited |
| **AI Images** | ❌ | 50/mo | Unlimited |
| **Platforms** | 2 | All 7 | All 7 |
| **Templates** | 5 | 50 | Unlimited |
| **CSV Bulk Upload** | ❌ | ✅ | ✅ |
| **Analytics** | Basic | Full | Advanced |
| **Support** | Community | Email | Priority |
| **API Access** | ❌ | ❌ | ✅ |
| **White-label** | ❌ | ❌ | ✅ |

---

## Setup Stripe Integration

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete verification

### Step 2: Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. Copy:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)

**Add to `.env`:**
```env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

**Use test keys for development:**
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Step 3: Create Products

1. Go to **Products** in Stripe Dashboard
2. Click **"+ Add product"**

**Create Pro Plan:**
- **Name**: Pro Plan
- **Description**: Unlimited posts, 3 accounts, AI features
- **Pricing**: $29/month (recurring)
- Copy the **Price ID** (starts with `price_`)

**Create Pro Annual:**
- Same product, add another price
- **Pricing**: $290/year (recurring annually)

**Create Business Plan:**
- **Name**: Business Plan
- **Description**: Unlimited everything, 10 accounts
- **Pricing**: $99/month
- Also add annual option: $990/year

**Add Price IDs to `.env`:**
```env
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_xxxxx
```

### Step 4: Setup Webhook

1. Go to **Developers → Webhooks**
2. Click **"+ Add endpoint"**
3. **Endpoint URL**: `https://your-domain.com/api/billing/webhook`
4. **Events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy **Signing secret** (starts with `whsec_`)

**Add to `.env`:**
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Usage Tracking

### How It Works

The platform tracks usage monthly for each user:
- **Posts**: Incremented on each successful post
- **AI Captions**: Incremented on each generation
- **AI Images**: Incremented on each image generated
- **Accounts**: Count of connected accounts

**Database table:**
```sql
usage
├── user_id
├── month (YYYY-MM)
├── posts_count
├── ai_count
├── accounts_count
└── updated_at
```

### Limit Enforcement

**Soft limits** (with grace):
- User can exceed limit by 2 posts
- Warning shown in UI
- Prompt to upgrade

**Hard limits**:
- Enforced after grace period
- Shows upgrade modal
- Post button disabled

**Code example:**
```javascript
// Check limit before posting
const usage = await checkUsage(userId, 'posts');

if (!usage.allowed) {
  return res.status(403).json({
    error: 'Post limit reached',
    message: 'Upgrade to Pro for unlimited posts',
    upgrade_url: '/pricing'
  });
}

// Increment after successful post
await incrementUsage(userId, 'posts');
```

---

## Customer Portal

### What It Provides

Stripe Customer Portal allows users to:
- View current subscription
- Update payment method
- View billing history
- Cancel subscription
- Update billing address
- Download invoices

### Integration

**In Settings page:**
```javascript
const handleManageSubscription = async () => {
  const response = await api.post('/api/billing/portal', {
    returnUrl: window.location.origin + '/dashboard/settings'
  });
  
  window.location.href = response.data.url;
};
```

**Backend endpoint:**
```javascript
app.post('/api/billing/portal', verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const { returnUrl } = req.body;
  
  const session = await billing.createPortalSession(userId, returnUrl);
  res.json({ url: session.url });
});
```

---

## Checkout Flow

### User Journey

1. User clicks "Upgrade to Pro"
2. Redirected to Stripe Checkout
3. Enters payment details
4. Stripe processes payment
5. Webhook updates database
6. User redirected to success page
7. Dashboard shows Pro features unlocked

### Implementation

**Frontend (Pricing.jsx):**
```javascript
const handleUpgrade = async (planName) => {
  const response = await api.post('/api/billing/checkout', {
    plan: planName,
    billingCycle: 'monthly', // or 'annual'
    successUrl: `${window.location.origin}/success`,
    cancelUrl: `${window.location.origin}/cancel`
  });
  
  window.location.href = response.data.url;
};
```

**Backend:**
```javascript
app.post('/api/billing/checkout', verifyAuth, async (req, res) => {
  const { userId, email } = req.user;
  const { plan, billingCycle, successUrl, cancelUrl } = req.body;
  
  const priceId = getPriceId(plan, billingCycle);
  
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode: 'subscription',
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, plan }
  });
  
  res.json({ url: session.url });
});
```

---

## Webhook Handling

### Events Processed

**`checkout.session.completed`**
- User completed payment
- Create/update subscription in database
- Send welcome email
- Grant access to features

**`customer.subscription.updated`**
- Plan changed
- Update database
- Adjust limits

**`customer.subscription.deleted`**
- Subscription cancelled
- Downgrade to Free plan
- Preserve data

**`invoice.payment_succeeded`**
- Monthly renewal successful
- Extend subscription
- Send receipt

**`invoice.payment_failed`**
- Payment failed
- Send notification
- Grace period or suspend

### Security

**Verify webhook signature:**
```javascript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

---

## Free Trial

### 14-Day Trial (All Paid Plans)

**How it works:**
- User subscribes to Pro/Business
- First 14 days are free
- No charge until trial ends
- Can cancel anytime during trial
- No credit card required (optional)

**Implementation:**
```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  subscription_data: {
    trial_period_days: 14
  },
  // ... rest of config
});
```

---

## Billing Dashboard (Frontend)

### Usage Display

Shows current usage vs. limits:
```jsx
<div>
  <h3>Posts This Month</h3>
  <ProgressBar 
    current={usage.posts_count} 
    limit={plan.limits.posts} 
  />
  <p>{usage.posts_count} / {plan.limits.posts}</p>
</div>
```

### Upgrade Prompts

**When to show:**
- At 80% of limit
- When limit reached
- When trying to use Pro features

**UI elements:**
- Warning badge
- Upgrade button
- Feature comparison
- Pricing cards

---

## Analytics & Reporting

### Admin Dashboard (Future)

Track business metrics:
- Monthly Recurring Revenue (MRR)
- Customer count by plan
- Churn rate
- Average revenue per user (ARPU)
- Trial conversion rate

### User Analytics

Show users:
- Spending trends
- Usage patterns
- Cost savings vs. alternatives
- ROI calculations

---

## Testing

### Use Stripe Test Mode

**Test card numbers:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires 3DS: 4000 0027 6000 3184
```

**Test workflow:**
1. Create checkout with test price ID
2. Use test card number
3. Complete purchase
4. Verify webhook received
5. Check database updated
6. Test customer portal
7. Test cancellation

---

## Troubleshooting

### "Webhook not receiving events"

**Solutions:**
1. Check webhook endpoint is publicly accessible
2. Verify webhook secret in `.env`
3. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```

### "Subscription not updating"

**Check:**
- Webhook signature validation
- Database connection
- Error logs in webhook handler
- Stripe dashboard for failed webhooks

### "Payment failed"

**Common causes:**
- Insufficient funds
- Card expired
- Fraud detection
- International card restrictions

---

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Customer Portal Setup](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Webhook Guide](https://stripe.com/docs/webhooks)

---

**Status:** ✅ Fully implemented  
**Mode:** Test (switch to live for production)  
**Current MRR:** Track in Stripe Dashboard

