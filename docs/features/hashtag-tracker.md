# 📊 Hashtag Performance Tracker

**Status:** ✅ Backend Complete (Frontend: Build via Analytics page)  
**Version:** 1.0  
**Date:** November 13, 2025

---

## 📖 Overview

Track which hashtags drive engagement and which ones to avoid. Get data-driven hashtag recommendations based on YOUR performance history.

---

## ✨ Features

### 🏷️ **Auto-Tracking**
- Extracts hashtags from every post automatically
- Tracks per platform (LinkedIn, Twitter, Instagram, etc.)
- Links hashtags to posts for detailed analysis

### 📈 **Performance Metrics**
- **Success Rate**: % of posts that succeeded with this hashtag
- **Avg Engagement**: Average likes + comments + shares
- **Times Used**: How often you've used it
- **Total Engagement**: Cumulative engagement across all posts

### 🔥 **Trending Detection**
- Identifies trending up hashtags (improving performance)
- Flags trending down hashtags (declining performance)
- Based on last 30 days vs historical average

### 💡 **Smart Suggestions**
- Recommends hashtags that work well for YOU
- Filters: 70%+ success rate, used 2+ times
- Excludes hashtags already in your post
- Platform-specific recommendations

### ⚠️ **Avoid List**
- Shows worst performing hashtags
- Low success rate warnings
- Helps avoid hashtags that hurt reach

---

## 🔌 **API Endpoints**

```http
GET /api/hashtags/analytics        # Summary stats
GET /api/hashtags/top              # Top performers
GET /api/hashtags/worst            # Worst performers
GET /api/hashtags/suggestions      # Smart suggestions
POST /api/hashtags/analyze-trends  # Run trend analysis
```

---

## 📦 **Database Schema**

- `hashtag_performance` - Metrics per hashtag per platform
- `post_hashtags` - Junction table (posts ↔ hashtags)
- `top_hashtags` (view) - Ranked by performance
- `trending_hashtags` (view) - Trending up/down

---

## 💡 **Example Analytics**

**Top Performers:**
- `#AI` - 85% success, 245 avg engagement (use more!)
- `#SaaS` - 82% success, 198 avg engagement
- `#productivity` - 78% success, 165 avg engagement

**Avoid These:**
- `#spam` - 20% success, 12 avg engagement (stop using!)
- `#follow4follow` - 15% success, 8 avg engagement
- `#like4like` - 10% success, 5 avg engagement

**Recommendations:**
- Replace `#software` (50% success) with `#SaaS` (82% success)
- Use `#AI` more often (only used 5 times but 85% success)
- Stop using `#marketing` (declining 45% → 25%)

---

**Setup:** Run `migrations/026_add_hashtag_tracker.sql` in Supabase

**Auto-Tracks:** Hashtags extracted and tracked automatically on every post!

