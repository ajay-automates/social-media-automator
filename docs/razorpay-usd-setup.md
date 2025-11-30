# Razorpay USD Currency Setup Guide

## Problem
Razorpay is showing INR (Indian Rupees) instead of USD because the plans were created with INR currency in the Razorpay dashboard.

## Solution: Create USD Plans in Razorpay

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

4. **Enable International Payments (if needed)**

   - Go to **Settings → International Payments**
   - Enable **"Accept International Payments"**
   - Select **USD** as supported currency

5. **Redeploy**

   After updating environment variables, Railway will automatically redeploy.

## Important Notes

- **Amount in Razorpay**: Always enter amount in **cents** (smallest currency unit)
  - $19.00 = 1900 cents
  - $99.00 = 9900 cents
  - $190.00 = 19000 cents
  - $990.00 = 99000 cents

- **Currency is Plan-Level**: The currency is set when creating the plan and cannot be changed later. You must create new plans with USD.

- **Old Plans**: You can keep the old INR plans for existing customers, but new subscriptions will use the USD plans.

## Verification

After setup:
1. Go to Pricing page
2. Click "Start Free Trial" on any plan
3. The Razorpay checkout should show USD currency
4. Verify the amount matches your pricing ($19, $99, etc.)

## Troubleshooting

**Still showing INR?**
- Check that you selected USD when creating the plan
- Verify the Plan IDs in environment variables are correct
- Make sure you're using the new USD plan IDs, not the old INR ones
- Clear browser cache and try again

**Currency conversion?**
- Razorpay will handle currency conversion automatically
- Customers can pay in their local currency
- You'll receive settlement in your account's base currency

