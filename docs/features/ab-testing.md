# 🧪 A/B Testing Engine

**Status:** ✅ Backend Complete (Frontend: Build via Analytics page)  
**Version:** 1.0  
**Date:** November 13, 2025

---

## 📖 Overview

Test content variations to discover what drives the most engagement. Compare 2-4 different versions of your content, track performance, and let the system declare the winner automatically.

---

## ✨ Features

### 🎯 **Test Creation**
- Create tests with 2-4 variations
- Test different: Captions, Hashtags, Images, Post Times
- Schedule across platforms
- Auto-stagger posting times

### 📊 **Performance Tracking**
- Track: Likes, Comments, Shares, Clicks, Views
- Calculate: Total engagement, Engagement rate
- Rank: Variations by performance
- Winner: Auto-declared after test duration

### 🏆 **Winner Detection**
- Auto-declare after 24-48 hours
- Statistical confidence scoring
- Manual override option
- Results dashboard

---

## 🔌 **API Endpoints**

```http
GET  /api/ab-tests              # Get all tests
POST /api/ab-tests              # Create test
GET  /api/ab-tests/:id/results  # Get results
POST /api/ab-tests/:id/declare-winner  # Manual winner
POST /api/ab-tests/:id/cancel   # Cancel test
GET  /api/ab-tests/insights     # Get insights
```

---

## 📦 **Database Schema**

- `ab_tests` - Test configurations
- `ab_test_variations` - Individual variations with metrics
- `ab_test_results` (view) - Results with rankings

---

## 💡 **Example Test**

**Test Name:** "LinkedIn Caption Test"  
**Variations:**
- A: "5 tips to boost productivity 🚀"
- B: "How I 10x'd my productivity (here's how)"
- C: "Productivity hacks nobody talks about"

**Result after 48h:**
- Variation B: 250 likes, 45 comments (Winner! 🏆)
- Variation A: 180 likes, 30 comments
- Variation C: 160 likes, 25 comments

**Insight:** Question-based headlines perform 39% better!

---

**Setup:** Run `migrations/025_add_ab_testing.sql` in Supabase

