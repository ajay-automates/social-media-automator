# Razorpay USD Currency Setup Guide

## Problem
Razorpay is showing INR (Indian Rupees) instead of USD because the plans were created with INR currency in the Razorpay dashboard.

## ⚠️ Important Limitation

**Your business type may not support international card payments directly in Razorpay.**

If you see this message in Razorpay Dashboard:
- "Your business type is not supported for international card payments"
- "You can accept Payments in International Currencies only using PayPal. They CANNOT be collected in INR."

This means:
- ❌ You **cannot** create USD subscription plans for international card payments
- ✅ You **can** use PayPal for USD payments (but PayPal payments cannot be in INR)
- ⚠️ PayPal payments will be in USD and settled to your PayPal account (not directly to your Indian bank account)

## Solution Options

### Option 1: Use PayPal for USD Payments (Recommended if international cards not supported)

If your business type doesn't support international cards, you'll need to:
1. Link your PayPal account in Razorpay Dashboard
2. Accept payments via PayPal in USD
3. PayPal will handle the currency conversion
4. Funds will be in your PayPal account (you can then transfer to your bank)

**Note:** Razorpay subscriptions may not work with PayPal. You might need to use one-time payments or payment links instead of subscriptions.

### Option 2: Request International Card Support (If Available)

Some business types can request international card payment support:

## Solution: Enable International Payments & Create USD Plans

### Option 2A: Enable International Card Payments (If Your Business Type Supports It)

**Note:** This only works if Razorpay approves your business type for international cards. If you see "Your business type is not supported for international card payments," skip to Option 1 (PayPal).

1. **Log in to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com
   - Navigate to **Settings → Payment Methods → International Payments**

2. **Request Activation**
   - Click **"Request"** or **"Enable International Payments"**
   - Provide necessary business information
   - Ensure your business details are complete and accurate
   - Razorpay may require additional documentation (invoices, bank statements)

3. **Wait for Approval**
   - Razorpay typically reviews applications within **5-7 working days**
   - Once approved, you can accept payments in USD and 100+ other currencies

4. **Important Notes:**
   - **Settlements**: International card payments (USD) will be settled in your Indian bank account in **INR** (converted automatically at current exchange rate)
   - **Compliance**: For RBI regulations, you may need to provide invoices and buyer's address details for international transactions
   - **Transaction Fees**: International payment fees may differ from domestic rates

### Option 2B: Create USD Subscription Plans (Only if International Cards Are Supported)

**⚠️ This only works if your business type supports international card payments!**

If you can accept international cards, you can create USD subscription plans:

The currency is set when creating the plan in Razorpay, not in the code. You need to create new plans with USD currency.

### Steps to Create USD Plans:

1. **Log in to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com
   - Navigate to **Settings → Plans**

2. **Create New Plans with USD Currency**

   **Pro Monthly Plan:**
   - Click **"+ Create Plan"**
   - **Name**: Pro Plan (Monthly)
   - **Amount**: 1900 (in cents, so $19.00 = 1900 cents)
   - **Currency**: Select **USD** (not INR)
   - **Interval**: Monthly
   - **Description**: Pro Plan - Monthly Subscription
   - Click **Create**
   - Copy the **Plan ID** (starts with `plan_`)

   **Pro Annual Plan:**
   - Click **"+ Create Plan"**
   - **Name**: Pro Plan (Annual)
   - **Amount**: 19000 (in cents, so $190.00 = 19000 cents)
   - **Currency**: Select **USD**
   - **Interval**: Yearly
   - **Description**: Pro Plan - Annual Subscription
   - Click **Create**
   - Copy the **Plan ID**

   **Business Monthly Plan:**
   - Click **"+ Create Plan"**
   - **Name**: Business Plan (Monthly)
   - **Amount**: 9900 (in cents, so $99.00 = 9900 cents)
   - **Currency**: Select **USD**
   - **Interval**: Monthly
   - Click **Create**
   - Copy the **Plan ID**

   **Business Annual Plan:**
   - Click **"+ Create Plan"**
   - **Name**: Business Plan (Annual)
   - **Amount**: 99000 (in cents, so $990.00 = 99000 cents)
   - **Currency**: Select **USD**
   - **Interval**: Yearly
   - Click **Create**
   - Copy the **Plan ID**

3. **Update Environment Variables**

   Add these to your Railway environment variables (or `.env` file):

   ```env
   RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_xxxxx_USD
   RAZORPAY_PRO_ANNUAL_PLAN_ID=plan_xxxxx_USD
   RAZORPAY_BUSINESS_MONTHLY_PLAN_ID=plan_xxxxx_USD
   RAZORPAY_BUSINESS_ANNUAL_PLAN_ID=plan_xxxxx_USD
   ```

4. **Redeploy**

   After updating environment variables, Railway will automatically redeploy.

## Important Notes

- **Amount in Razorpay**: Always enter amount in **cents** (smallest currency unit)
  - $19.00 = 1900 cents
  - $99.00 = 9900 cents
  - $190.00 = 19000 cents
  - $990.00 = 99000 cents

- **Currency is Plan-Level**: The currency is set when creating the plan and cannot be changed later. You must create new plans with USD.

- **Old Plans**: You can keep the old INR plans for existing customers, but new subscriptions will use the USD plans.

- **Settlement in INR**: Even though customers pay in USD, Razorpay will settle the funds to your Indian bank account in **INR** (converted at the current exchange rate). This is automatic and handled by Razorpay.

- **Multi-Currency Support**: Once international payments are enabled, you can accept payments in 100+ currencies, but settlements will always be in INR for Indian accounts.

## Verification

After setup:
1. Go to Pricing page
2. Click "Start Free Trial" on any plan
3. The Razorpay checkout should show USD currency
4. Verify the amount matches your pricing ($19, $99, etc.)

## Alternative: Switch to Stripe (Recommended for International Payments)

If Razorpay doesn't support international cards for your business type, consider using **Stripe** instead:

### Why Stripe?
- ✅ Better international payment support
- ✅ Native USD support (no currency conversion needed)
- ✅ Works with all business types
- ✅ Better subscription management
- ✅ Direct USD settlements (if you have a US bank account) or automatic INR conversion

### Migration Steps:
1. Create a Stripe account (supports Indian businesses)
2. Set up products and prices in USD
3. Update the codebase to use Stripe instead of Razorpay
4. Update environment variables

See `docs/features/billing-pricing.md` for Stripe setup instructions.

## Troubleshooting

**Still showing INR?**
- Check that you selected USD when creating the plan
- Verify the Plan IDs in environment variables are correct
- Make sure you're using the new USD plan IDs, not the old INR ones
- Clear browser cache and try again

**"Business type not supported" error?**
- Your business type doesn't support international card payments in Razorpay
- Use PayPal for USD payments (Option 1)
- Or consider switching to Stripe (recommended)

**PayPal payments:**
- PayPal payments will be in USD and go to your PayPal account
- You'll need to transfer from PayPal to your bank account manually
- PayPal handles currency conversion for customers

**Currency conversion?**
- For international cards: Razorpay converts USD to INR automatically, settled to your Indian bank
- For PayPal: Payments stay in USD in your PayPal account, you handle conversion when transferring

