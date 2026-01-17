# ✅ PRODUCTION READINESS CHECKLIST

## 🔴 CRITICAL (Must Fix Before Launch)

### Billing Configuration

- [ ] Create Razorpay account at <https://razorpay.com>
- [ ] Complete KYC verification
- [ ] Get API Keys from Dashboard → Settings → API Keys
  - [ ] Copy `RAZORPAY_KEY_ID` (starts with rzp_)
  - [ ] Copy `RAZORPAY_KEY_SECRET`
- [ ] Create 4 Subscription Plans in Dashboard → Subscriptions → Plans:
  - [ ] Pro Monthly (₹1000/month, recurring)
  - [ ] Pro Annual (₹10000/year, recurring)
  - [ ] Business Monthly (₹5000/month, recurring)
  - [ ] Business Annual (₹50000/year, recurring)
- [ ] Copy all 4 Plan IDs
- [ ] Setup Webhook:
  - [ ] Go to Dashboard → Webhooks
  - [ ] Add endpoint: `https://your-railway-url.up.railway.app/api/billing/webhook`
  - [ ] Select events: `subscription.charged`, `subscription.cancelled`, `subscription.halted`
  - [ ] Copy Webhook Secret
- [ ] Add to Railway Environment Variables:

  ```
  RAZORPAY_KEY_ID=rzp_live_xxxxx
  RAZORPAY_KEY_SECRET=xxxxx
  RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
  RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_xxxxx
  RAZORPAY_PRO_ANNUAL_PLAN_ID=plan_xxxxx
  RAZORPAY_BUSINESS_MONTHLY_PLAN_ID=plan_xxxxx
  RAZORPAY_BUSINESS_ANNUAL_PLAN_ID=plan_xxxxx
  ```

- [ ] Restart Railway application

### Environment Configuration

- [ ] Set `NODE_ENV=production` in Railway
- [ ] Set `AI_DAILY_SPEND_LIMIT=0.20` in Railway
- [ ] Set `AI_MONTHLY_SPEND_LIMIT=5.00` in Railway
- [ ] Restart Railway application

---

## 🧪 TESTING (Before Going Live)

### Free Plan Testing

- [ ] Create test user account
- [ ] Verify can create posts
- [ ] Create 10 posts (should hit limit)
- [ ] Try to create 11th post (should show warning)
- [ ] Try to create 13th post (should be blocked)
- [ ] Verify upgrade prompt appears
- [ ] Generate 5 AI posts (should hit limit)
- [ ] Try 6th AI generation (should be blocked)

### Pro Plan Testing

- [ ] Click "Upgrade to Pro" button
- [ ] Verify Razorpay checkout opens
- [ ] Use test card: 4111 1111 1111 1111
- [ ] Complete payment
- [ ] Verify redirected to success page
- [ ] Verify plan updated in database
- [ ] Verify can create more than 10 posts
- [ ] Verify unlimited AI generations work
- [ ] Create 100 posts (should hit limit)
- [ ] Try 101st post (should show warning)

### Business Plan Testing

- [ ] Click "Upgrade to Business" button
- [ ] Complete Razorpay checkout
- [ ] Verify unlimited posts work
- [ ] Verify unlimited AI works
- [ ] Create 200+ posts (should never hit limit)

### Subscription Management

- [ ] Test "Manage Subscription" button
- [ ] Test subscription cancellation
- [ ] Verify downgrade to Free plan
- [ ] Verify limits reset to Free tier
- [ ] Test subscription renewal
- [ ] Verify webhook updates database

### Rate Limiting

- [ ] Verify `NODE_ENV=production` is set
- [ ] Test AI endpoint rate limit (50 req/hour)
- [ ] Test auth endpoint rate limit (50 req/15min)
- [ ] Verify rate limit error messages

---

## 📊 MONITORING (After Launch)

### Daily Checks

- [ ] Check AI spending: `SELECT SUM(cost) FROM ai_cost_tracking WHERE date = CURRENT_DATE`
- [ ] Check new signups: `SELECT COUNT(*) FROM subscriptions WHERE created_at::date = CURRENT_DATE`
- [ ] Check failed posts: `SELECT COUNT(*) FROM posts WHERE status = 'failed'`
- [ ] Check Razorpay dashboard for payments
- [ ] Check Railway logs for errors

### Weekly Checks

- [ ] Review subscription distribution
- [ ] Check users hitting limits
- [ ] Review rate limit violations
- [ ] Check Razorpay webhook logs
- [ ] Review customer support tickets

### Monthly Checks

- [ ] Calculate MRR: `SELECT SUM(CASE WHEN plan='pro' THEN 1000 WHEN plan='business' THEN 5000 ELSE 0 END) FROM subscriptions WHERE status='active'`
- [ ] Review churn rate
- [ ] Analyze usage patterns
- [ ] Review AI costs vs. revenue
- [ ] Update pricing if needed

---

## 🔐 SECURITY CHECKLIST

- [x] Row Level Security (RLS) enabled ✅
- [x] Supabase Auth configured ✅
- [x] API keys in environment variables ✅
- [x] Rate limiting configured ✅
- [x] Webhook signature verification ✅
- [ ] HTTPS enabled (Railway provides this)
- [ ] Regular API key rotation schedule
- [ ] Monitor for suspicious activity
- [ ] Backup database regularly

---

## 📝 DOCUMENTATION CHECKLIST

- [x] Pricing tiers documented ✅
- [x] API limits documented ✅
- [x] Rate limits documented ✅
- [x] Billing flow documented ✅
- [ ] Update README with production setup
- [ ] Create user onboarding guide
- [ ] Create troubleshooting guide
- [ ] Document common issues

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All Razorpay credentials configured
- [ ] All environment variables set
- [ ] `NODE_ENV=production` set
- [ ] All tests passing
- [ ] Database migrations run
- [ ] Backup database

### Deployment

- [ ] Deploy to Railway
- [ ] Verify deployment successful
- [ ] Check Railway logs for errors
- [ ] Test health endpoint: `/api/health`
- [ ] Test auth flow
- [ ] Test billing flow

### Post-Deployment

- [ ] Monitor logs for 1 hour
- [ ] Test all critical flows
- [ ] Verify webhooks working
- [ ] Check AI cost tracking
- [ ] Announce to users

---

## 📞 EMERGENCY CONTACTS

### If Billing Breaks

1. Check Railway logs
2. Check Razorpay dashboard
3. Verify webhook endpoint is accessible
4. Check environment variables
5. Restart Railway application

### If Rate Limits Too Strict

1. Temporarily increase limits in `middleware/rate-limiter.js`
2. Deploy update
3. Monitor for abuse
4. Adjust as needed

### If AI Costs Spike

1. Check `ai_cost_tracking` table
2. Identify expensive features
3. Temporarily disable AI features
4. Increase `AI_DAILY_SPEND_LIMIT`
5. Optimize AI prompts

---

## 📈 SUCCESS METRICS

### Week 1

- [ ] 0 billing errors
- [ ] 0 rate limit complaints
- [ ] At least 1 paid conversion
- [ ] AI costs under $5/day

### Month 1

- [ ] 10% conversion rate (1-2 paid users)
- [ ] MRR > ₹1,000
- [ ] AI costs < ₹500
- [ ] 0 critical bugs

### Month 3

- [ ] 20% conversion rate (3-4 paid users)
- [ ] MRR > ₹3,000
- [ ] Positive unit economics
- [ ] 5-star user reviews

---

## 🎯 CURRENT STATUS

**Last Audit:** January 16, 2026  
**Overall Health:** 48.1%  
**Critical Issues:** 12  
**Warnings:** 2  
**Status:** ❌ NOT PRODUCTION READY

**Next Audit:** Run `node scripts/production_audit.js`

---

## 📋 QUICK COMMANDS

```bash
# Run production audit
node scripts/production_audit.js

# Check current subscriptions
node scripts/check_subscriptions.js

# Upgrade user manually (emergency)
node scripts/upgrade_user.js

# Downgrade user manually (emergency)
node scripts/downgrade_user.js

# Check AI spending
node scripts/check_ai_spending.js

# Check database health
node scripts/check_database.js
```

---

**Remember:** The app is technically solid. Just need to configure Razorpay and set production environment!

**Estimated Time to Production:** 3-4 hours  
**Estimated First Month Revenue:** ₹1,000-3,000
