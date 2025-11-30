# Razorpay Plan IDs

## Current Plan IDs (INR)

Update these environment variables in Railway (or your `.env` file):

```env
# Pro Plan
RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_Rm5g9Giq9nW7uc
RAZORPAY_PRO_ANNUAL_PLAN_ID=plan_Rm5hhJ07F40teI

# Business Plan
RAZORPAY_BUSINESS_MONTHLY_PLAN_ID=plan_Rm5ioPCBVTvfOS
RAZORPAY_BUSINESS_ANNUAL_PLAN_ID=plan_Rm5jRZMaOXjEGr
```

## Plan Details

### Pro Plan
- **Monthly**: `plan_Rm5g9Giq9nW7uc` - ₹1,000.00/month
- **Annual**: `plan_Rm5hhJ07F40teI` - ₹10,000.00/year

### Business Plan
- **Monthly**: `plan_Rm5ioPCBVTvfOS` - ₹5,000.00/month
- **Annual**: `plan_Rm5jRZMaOXjEGr` - ₹50,000.00/year

## How to Update in Railway

1. Go to your Railway project dashboard
2. Navigate to **Variables** tab
3. Add or update these environment variables:
   - `RAZORPAY_PRO_MONTHLY_PLAN_ID`
   - `RAZORPAY_PRO_ANNUAL_PLAN_ID`
   - `RAZORPAY_BUSINESS_MONTHLY_PLAN_ID`
   - `RAZORPAY_BUSINESS_ANNUAL_PLAN_ID`
4. Set the values to the plan IDs above
5. Railway will automatically redeploy

## Verification

After updating, test the pricing page:
1. Go to `/dashboard/pricing`
2. Click "Start Free Trial" on any plan
3. Verify the Razorpay checkout shows the correct amount

