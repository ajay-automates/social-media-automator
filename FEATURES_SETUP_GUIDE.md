# 🚀 New Features Setup Guide

This guide covers the 5 new premium features added to Social Media Automator.

---

## ✅ Features Implemented

1. **📊 Export Analytics to CSV** - Download your analytics data
2. **🏷️ AI Hashtag Generator** - AI-powered hashtag suggestions  
3. **📅 Calendar View** - Visual calendar of scheduled posts
4. **⏰ Best Time to Post** - AI recommendations for optimal posting times
5. **📧 Email Reports** - Weekly email summaries

---

## 📋 Setup Steps

### 1. Database Migrations

Run these SQL migrations in Supabase SQL Editor:

**For Public Templates (if not done already):**
```sql
-- Run: migrations/012_add_public_templates.sql
```

**For Email Reports:**
```sql
-- Run: migrations/013_add_email_reports.sql
```

### 2. Install Dependencies (Already Done)

```bash
npm install json2csv react-big-calendar date-fns nodemailer
cd dashboard && npm install react-big-calendar date-fns
```

### 3. Configure Email Service (Optional)

For email reports to work, add to `.env`:

**Option A: Gmail (Recommended for testing)**
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password  # NOT your regular password!
EMAIL_FROM=Social Media Automator <noreply@yourdomain.com>
```

**How to get Gmail App Password:**
1. Go to Google Account settings
2. Security > 2-Step Verification
3. App passwords
4. Generate password for "Mail"

**Option B: SendGrid**
```env
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

**Option C: Custom SMTP**
```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

**Note:** Email reports will be disabled if no email config is found. All other features work without it.

### 4. Restart Server

```bash
# Stop current server (Ctrl+C)
# Restart:
node server.js

# Or restart both (frontend + backend):
cd dashboard && npm run dev &
cd .. && node server.js
```

---

## 🎯 Feature Usage

### 1. Export Analytics to CSV

**Where:** Analytics page  
**How to use:**
1. Go to Analytics page (`/analytics`)
2. Click green "📊 Export CSV" button (top right)
3. CSV file downloads automatically with all your post history

**CSV includes:**
- Date & Time
- Platform
- Status (posted/failed)
- Caption (truncated)
- Media info
- Schedule info

---

### 2. AI Hashtag Generator

**Where:** Create Post page  
**How to use:**
1. Write your caption (min 10 characters)
2. Click "🏷️ Generate Hashtags" button (appears automatically)
3. AI generates platform-specific hashtags
4. Click individual hashtags to add to caption
5. Or click "Add All Hashtags" to add all at once

**Platform-specific:**
- Instagram: 15-20 hashtags
- LinkedIn: 3-5 professional hashtags
- Twitter: 2-4 trending hashtags
- TikTok: 5-8 hashtags

**Counts as:** 1 AI generation (subject to plan limits)

---

### 3. Calendar View

**Where:** New Calendar page  
**How to use:**
1. Navigate to Calendar page (`/calendar`)
2. See all scheduled posts on visual calendar
3. Switch views: Month / Week / Day / Agenda
4. Click any event to see full details
5. Delete scheduled posts from modal

**Features:**
- Color-coded by platform
- Shows time and caption preview
- Mobile responsive
- Empty state if no scheduled posts

---

### 4. Best Time to Post

**Where:** Create Post page  
**How to use:**
1. Select platform(s)
2. "⏰ Best Time to Post" card appears automatically
3. See 3 AI-recommended times
4. Based on your posting history + general best practices
5. Recommendations refresh when you change platforms

**Shows:**
- 🥇 🥈 🥉 Top 3 recommended times
- Day and specific time
- Reason for recommendation
- Powered by your data + AI

**Falls back to:** General best practices if you have < 5 posts

---

### 5. Email Reports

**Where:** Settings page  
**Setup:**
1. Go to Settings page (`/settings`)
2. Scroll to "📧 Email Reports" section
3. Toggle "Enable Weekly Reports"
4. Enter email address
5. Choose frequency (Weekly/Bi-weekly/Monthly)
6. Click "Save Settings"
7. Click "Send Test Email" to verify

**What you receive:**
- Beautiful HTML email every Monday at 9 AM
- Total posts, success rate, top platform
- Week-over-week summary
- Direct link to dashboard

**Cron Schedule:**
- Weekly: Every Monday 9 AM
- Bi-weekly: Every other Monday 9 AM
- Monthly: 1st of each month 9 AM

---

## 🧪 Testing the Features

### Test Export CSV
```bash
# 1. Create some test posts first
# 2. Go to Analytics page
# 3. Click Export CSV
# 4. Verify CSV downloads with correct data
```

### Test AI Hashtags
```bash
# 1. Go to Create Post
# 2. Write caption: "Excited to announce our new product launch!"
# 3. Select platform (Instagram)
# 4. Click Generate Hashtags
# 5. Verify hashtags appear
# 6. Click a hashtag, verify it's added to caption
```

### Test Calendar
```bash
# 1. Schedule a post for tomorrow
# 2. Go to Calendar page (/calendar)
# 3. Verify post appears on calendar
# 4. Click event, verify details show
# 5. Try Month/Week/Day views
```

### Test Best Time
```bash
# 1. Go to Create Post
# 2. Select a platform
# 3. Verify "Best Time to Post" card appears
# 4. Check recommendations are relevant
# (Note: Need 5+ posts for personalized recommendations)
```

### Test Email Reports
```bash
# 1. Add email config to .env
# 2. Restart server
# 3. Go to Settings
# 4. Enable email reports
# 5. Enter your email
# 6. Click "Send Test Email"
# 7. Check inbox for test email
```

---

## 📊 Database Schema Changes

### New Columns in `users` table:
```sql
email_reports_enabled BOOLEAN DEFAULT false
report_email TEXT
report_frequency TEXT DEFAULT 'weekly'
```

### New Column in `post_templates` table (from previous feature):
```sql
is_public BOOLEAN DEFAULT false
```

---

## 🔧 Troubleshooting

### Email reports not sending
1. Check `.env` has EMAIL_USER and EMAIL_PASSWORD
2. For Gmail: Use App Password, not regular password
3. Test with: `curl -X POST http://localhost:3000/api/reports/test-email -H "Authorization: Bearer YOUR_TOKEN" -d '{"email":"test@example.com"}'`
4. Check server logs for errors

### Hashtags not generating
1. Verify ANTHROPIC_API_KEY in `.env`
2. Check usage limits (Pro: 100/month, Business: unlimited)
3. Caption must be at least 10 characters
4. Check browser console for errors

### Calendar not showing posts
1. Verify posts are scheduled for FUTURE (not past)
2. Check post status is 'queued'
3. Refresh page
4. Check browser console

### Best times not showing
1. Need at least 1 platform selected
2. May show "Not enough data" if < 5 posts
3. Will show AI recommendations based on general best practices
4. Check browser console for API errors

### CSV export fails
1. Need at least 1 post in history
2. Check if logged in (token valid)
3. Try refreshing Analytics page first

---

## 🎨 UI/UX Notes

All features follow the existing design system:
- ✨ Glassmorphism with backdrop-blur-2xl
- 🎨 Gradient buttons (blue→purple, pink→purple)
- 💫 Framer Motion animations
- 📱 Mobile responsive
- 🔔 Toast notifications for feedback
- ⚡ Loading states with spinners
- 🎯 Empty states with CTAs

---

## 📈 Performance & Limits

### AI Features (Hashtags, Best Time)
- Count toward AI usage limits
- Free: 0/month (disabled)
- Pro: 100/month
- Business: Unlimited

### Email Reports
- No usage limits
- Sent via cron (doesn't block requests)
- 1 second delay between sends to avoid rate limits

### Calendar
- Shows max 100 scheduled posts
- Only future posts (status='queued')
- Lightweight query, fast load

### CSV Export
- Max 100 posts per export
- Streams directly (no memory issues)
- Works with any number of posts

---

## 🚀 Production Deployment

When ready to deploy:

1. **Run migrations in production Supabase:**
   - migrations/012_add_public_templates.sql
   - migrations/013_add_email_reports.sql

2. **Add environment variables to Railway:**
   - EMAIL_USER (if using Gmail)
   - EMAIL_PASSWORD (if using Gmail)
   - SENDGRID_API_KEY (if using SendGrid)
   - EMAIL_FROM

3. **Push to git:**
   ```bash
   git add .
   git commit -m "feat: Add 5 premium features"
   git push origin main
   ```

4. **Verify deployment:**
   - Check Railway logs
   - Test each feature in production
   - Send test email to verify email service

---

## ✅ Success Criteria

Feature is working if:

- ✅ **CSV Export:** File downloads with correct data
- ✅ **Hashtags:** AI generates relevant hashtags, click-to-add works
- ✅ **Calendar:** Scheduled posts appear, can click events, can delete
- ✅ **Best Time:** Shows recommendations after selecting platform
- ✅ **Email Reports:** Test email delivers successfully

---

## 🎉 What Users Get

**Immediate Value:**
- Professional hashtags boost engagement
- Visual calendar simplifies scheduling
- Data export for external analysis
- Smart posting time recommendations
- Automated weekly summaries

**Reduces Friction:**
- No more manual hashtag research
- Visual planning vs. list view
- Data portability (CSV)
- Removes guesswork on timing
- Passive analytics delivery

**Premium Feel:**
- AI-powered everything
- Beautiful UI with glassmorphism
- Professional email templates
- Data-driven insights
- Automated workflows

---

**All 5 features are ready to use locally! Test them out before pushing to production.** 🚀

