# Setup Verification Guide

## ✅ Setup Complete Checklist

- [x] Database migration run (`029_add_ai_cost_tracking.sql`)
- [x] Environment variables set in Railway
- [x] Server redeployed

---

## 🧪 Quick Verification

### 1. Check Environment Variables

Verify these are set in Railway:
- `AI_DAILY_SPEND_LIMIT=0.20` (or your preferred value)
- `AI_MONTHLY_SPEND_LIMIT=5.00` (or your preferred value)

### 2. Test Spending Endpoint

Make a GET request to check current spending:

```bash
# Using curl
curl -X GET https://your-domain.com/api/billing/ai-spending \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Or test in browser console (if logged in)
fetch('/api/billing/ai-spending', {
  headers: { 'Authorization': `Bearer ${yourToken}` }
})
.then(r => r.json())
.then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "spending": {
    "today": 0.00,
    "month": 0.00,
    "limitDaily": 0.20,
    "limitMonthly": 5.00,
    "remainingDaily": 0.20,
    "remainingMonthly": 5.00,
    "percentageDaily": "0.0",
    "percentageMonthly": "0.0"
  }
}
```

### 3. Test AI Call with Limits

Try generating a caption or using calendar "Generate Posts":

**If limits are working:**
- API calls succeed if under limit
- Costs are tracked in database
- Calls are blocked if limit exceeded

**If limit exceeded, you'll see:**
```json
{
  "success": false,
  "error": "Spending limit exceeded: Daily spending limit exceeded. Current: $0.20/$0.20. Please try again later or contact support."
}
```

---

## 📊 Monitor Spending

### Check Database Directly

Run in Supabase SQL Editor:

```sql
-- Today's spending
SELECT 
  SUM(cost) as today_total,
  COUNT(*) as api_calls,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens
FROM ai_cost_tracking
WHERE date = CURRENT_DATE;

-- This month's spending
SELECT 
  SUM(cost) as month_total,
  COUNT(*) as total_calls,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens
FROM ai_cost_tracking
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- Detailed breakdown by feature
SELECT 
  feature,
  COUNT(*) as calls,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost_per_call
FROM ai_cost_tracking
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY feature
ORDER BY total_cost DESC;
```

### Check Server Logs

Look for cost tracking messages:
```
💰 Estimated cost: $0.0023 (1500 in tokens, 1000 max out, model: claude-3-5-haiku-20241022)
💰 Cost recorded: $0.0021 (1500 in + 500 out tokens, model: claude-3-5-haiku-20241022)
```

---

## 🔍 Troubleshooting

### Limits Not Working?

1. **Check Environment Variables**
   ```bash
   # In Railway, verify variables are set
   # They should show in Variables tab
   ```

2. **Check Server Logs**
   - Look for "Cost tracker initialized" messages
   - Check for any errors related to cost-tracker

3. **Verify Database Table**
   ```sql
   -- Check if table exists
   SELECT * FROM ai_cost_tracking LIMIT 1;
   ```

4. **Restart Server**
   - Sometimes environment variables need a restart
   - Railway should auto-restart on deploy

### Costs Not Being Tracked?

1. **Check API Calls**
   - Verify all AI calls use `makeAICall()` wrapper
   - Check server logs for cost tracking messages

2. **Check Database Permissions**
   - Ensure service role key has insert permissions
   - Check RLS policies are correct

3. **Check Error Logs**
   - Look for "Error recording cost" messages
   - Cost tracking shouldn't break API calls (errors are caught)

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ API calls succeed (if under limit)
2. ✅ Costs appear in `ai_cost_tracking` table
3. ✅ Spending endpoint returns correct values
4. ✅ API calls are blocked when limit exceeded
5. ✅ Server logs show cost tracking messages

---

## 📈 Expected Behavior

### Normal Usage:
- Each API call costs ~$0.001-0.005
- Daily limit ($0.20) allows ~40-200 calls
- Monthly limit ($5.00) allows ~1000-5000 calls

### When Limit Reached:
- Next API call will be blocked
- Clear error message shown
- User can try again next day/month

### Cost Tracking:
- Every API call is recorded
- Actual tokens tracked (not estimated)
- Costs calculated accurately

---

## 🎯 Next Steps

1. **Monitor for 24 hours**
   - Check spending daily
   - Verify costs are reasonable
   - Adjust limits if needed

2. **Set Up Alerts** (Optional)
   - Create a cron job to check spending
   - Email yourself when approaching limits
   - Or use Railway's monitoring

3. **Optimize Further** (If Needed)
   - Review expensive features
   - Reduce max_tokens if possible
   - Cache results where appropriate

---

**Your $5 budget is now protected! 🎉**

