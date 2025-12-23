# API Usage Limits Configuration Guide

## 🎯 Overview

This guide explains how to configure and manage API usage limits to prevent overspending.

---

## 📍 Where Limits Are Configured

### 1. **Environment Variables** (Recommended)

Set these in your `.env` file or Railway environment variables:

```bash
# Daily spending limit (default: $0.50)
AI_DAILY_SPEND_LIMIT=0.50

# Monthly spending limit (default: $5.00)
AI_MONTHLY_SPEND_LIMIT=5.00
```

### 2. **Code Configuration**

Edit `services/cost-tracker.js`:

```javascript
// Global spending limits
const DAILY_SPEND_LIMIT = parseFloat(process.env.AI_DAILY_SPEND_LIMIT || '0.50');
const MONTHLY_SPEND_LIMIT = parseFloat(process.env.AI_MONTHLY_SPEND_LIMIT || '5.00');
```

---

## 💰 Current Limits

### Default Limits:
- **Daily**: $0.50 per day
- **Monthly**: $5.00 per month

### Recommended Limits for $5 Budget:
- **Daily**: $0.15-0.20 (allows ~25-30 days)
- **Monthly**: $5.00 (your total budget)

---

## 🔧 How Limits Work

### 1. **Cost Estimation**
Before every API call:
- System estimates cost based on input/output tokens
- Checks if limit would be exceeded
- Blocks call if limit exceeded

### 2. **Cost Tracking**
After every API call:
- Records actual tokens used
- Calculates actual cost
- Stores in `ai_cost_tracking` table

### 3. **Limit Enforcement**
- **Daily Limit**: Resets at midnight UTC
- **Monthly Limit**: Resets on 1st of month
- **Hard Block**: API calls are rejected when limit exceeded

---

## 📊 Cost Breakdown

### Claude Haiku 3.5 (Cheapest Model - Now Used Everywhere)
- **Input**: $0.25 per 1M tokens
- **Output**: $1.25 per 1M tokens

### Typical Costs:
- **Topic Selection**: ~$0.001-0.002 per call
- **Post Generation**: ~$0.002-0.005 per call
- **Auto-fill**: ~$0.01-0.02 per call
- **Weekly Calendar (7 posts)**: ~$0.02-0.03 total

---

## 🚀 Setting Up Limits

### Step 1: Run Database Migration

```bash
# Run this migration in Supabase SQL editor
psql -f migrations/029_add_ai_cost_tracking.sql
```

Or manually run the SQL in Supabase dashboard.

### Step 2: Set Environment Variables

**In Railway:**
1. Go to your project → Variables
2. Add:
   - `AI_DAILY_SPEND_LIMIT=0.20`
   - `AI_MONTHLY_SPEND_LIMIT=5.00`

**In Local `.env`:**
```bash
AI_DAILY_SPEND_LIMIT=0.20
AI_MONTHLY_SPEND_LIMIT=5.00
```

### Step 3: Restart Server

After setting environment variables, restart your server.

---

## 📈 Monitoring Usage

### Check Spending via API

```javascript
const { getSpendingSummary } = require('./services/ai-wrapper');

const summary = await getSpendingSummary();
console.log(summary);
// {
//   today: 0.15,
//   month: 2.50,
//   limitDaily: 0.20,
//   limitMonthly: 5.00,
//   remainingDaily: 0.05,
//   remainingMonthly: 2.50
// }
```

### Check Database

```sql
-- Today's spending
SELECT SUM(cost) as today_total
FROM ai_cost_tracking
WHERE date = CURRENT_DATE;

-- This month's spending
SELECT SUM(cost) as month_total
FROM ai_cost_tracking
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- Detailed breakdown
SELECT 
  date,
  model,
  feature,
  SUM(cost) as total_cost,
  SUM(input_tokens) as total_input,
  SUM(output_tokens) as total_output
FROM ai_cost_tracking
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY date, model, feature
ORDER BY date DESC;
```

---

## ⚠️ What Happens When Limit Exceeded?

### Error Response:
```json
{
  "success": false,
  "error": "Spending limit exceeded: Daily spending limit exceeded. Current: $0.50/$0.50. Please try again later or contact support."
}
```

### User Experience:
- API calls are blocked
- Clear error message shown
- User can try again next day/month

---

## 🔄 Adjusting Limits

### Increase Limits:
1. Update environment variables
2. Restart server
3. Limits take effect immediately

### Decrease Limits:
1. Update environment variables
2. Restart server
3. New calls will be blocked if over limit

---

## 💡 Best Practices

### 1. **Start Conservative**
- Set daily limit to $0.15-0.20
- Monitor for a week
- Adjust based on actual usage

### 2. **Monitor Daily**
- Check spending summary daily
- Identify expensive features
- Optimize if needed

### 3. **Set Alerts** (Future Feature)
- Email alerts at 80% of limit
- SMS alerts at 95% of limit

### 4. **Use Cheapest Models**
- ✅ All models now use Claude Haiku (cheapest)
- ✅ Cost tracking enabled everywhere
- ✅ Limits enforced automatically

---

## 🛠️ Troubleshooting

### Limits Not Working?
1. ✅ Check environment variables are set
2. ✅ Verify database migration ran
3. ✅ Check server logs for errors
4. ✅ Restart server after changes

### Costs Higher Than Expected?
1. Check `ai_cost_tracking` table
2. Identify expensive features
3. Review token usage
4. Consider reducing max_tokens

### Need to Reset Spending?
```sql
-- Reset today's spending (emergency only!)
DELETE FROM ai_cost_tracking WHERE date = CURRENT_DATE;

-- Reset this month's spending (emergency only!)
DELETE FROM ai_cost_tracking WHERE date >= DATE_TRUNC('month', CURRENT_DATE);
```

---

## 📝 Summary

**Current Setup:**
- ✅ All models use Claude Haiku (cheapest)
- ✅ Cost tracking enabled
- ✅ Spending limits enforced
- ✅ Default: $0.50/day, $5.00/month

**Recommended for $5 Budget:**
- Set `AI_DAILY_SPEND_LIMIT=0.20`
- Set `AI_MONTHLY_SPEND_LIMIT=5.00`
- Monitor daily usage
- Adjust as needed

**Your $5 should now last ~25-30 days!** 🎉

