# AI Cost Analysis & Optimization Plan

## Current Cost Breakdown

### Claude Sonnet 4 Pricing (Approximate)
- **Input tokens**: ~$3 per 1M tokens
- **Output tokens**: ~$15 per 1M tokens

### Major Cost Drivers

#### 1. **Calendar "Generate Posts" (Weekly)** - BIGGEST COST ⚠️
- **Frequency**: Every time user clicks "Generate Posts" for weekly calendar
- **AI Calls per generation**:
  - 1 call to generate topics (`generateDailyAIToolsList` or `generateBusinessProfileTopics`)
  - 10-21 calls to generate post content (one per post)
  - **Total: ~11-22 AI calls per weekly generation**

- **Token usage per call**:
  - Input: ~3,000-5,000 tokens (large prompts with news context)
  - Output: ~1,000-2,000 tokens
  - **Average: ~4,000 input + 1,500 output = 5,500 tokens per call**

- **Cost per weekly generation**:
  - 15 calls average × 5,500 tokens = 82,500 tokens
  - Input cost: 82,500 × $3/1M = **$0.25**
  - Output cost: 82,500 × $15/1M = **$1.24**
  - **Total: ~$1.50 per weekly calendar generation**

#### 2. **Business Profile Auto-fill** - HIGH COST ⚠️
- **Frequency**: Every time user uses auto-fill feature
- **AI Calls**: 1 call
- **Token usage**:
  - Input: ~8,000-12,000 tokens (scraped website content + large prompt)
  - Output: ~2,000-4,000 tokens
  - **Average: ~10,000 input + 3,000 output = 13,000 tokens**

- **Cost per auto-fill**:
  - Input: 13,000 × $3/1M = **$0.04**
  - Output: 13,000 × $15/1M = **$0.20**
  - **Total: ~$0.24 per auto-fill**

#### 3. **Regular Caption Generation** (3 variations)
- **Frequency**: When user generates captions manually
- **AI Calls**: 3 calls (one per variation)
- **Token usage per call**:
  - Input: ~500-800 tokens
  - Output: ~500-1,000 tokens
  - **Average: ~600 input + 750 output = 1,350 tokens per call**

- **Cost per caption generation**:
  - 3 calls × 1,350 tokens = 4,050 tokens
  - Input: 4,050 × $3/1M = **$0.01**
  - Output: 4,050 × $15/1M = **$0.06**
  - **Total: ~$0.07 per caption generation**

### Estimated Monthly Costs

**If user generates:**
- 4 weekly calendars/month = 4 × $1.50 = **$6.00**
- 5 business profile auto-fills = 5 × $0.24 = **$1.20**
- 20 caption generations = 20 × $0.07 = **$1.40**

**Total: ~$8.60/month per active user**

**If multiple users or heavy usage:**
- 10 weekly calendars = **$15.00**
- 20 auto-fills = **$4.80**
- 50 caption generations = **$3.50**

**Total: ~$23.30/month**

---

## Optimization Strategies

### 🎯 Immediate Cost Reductions (High Impact)

#### 1. **Reduce Weekly Calendar Post Count**
- **Current**: Generates 10-21 posts
- **Optimization**: Default to 7-10 posts (one per day)
- **Savings**: ~40% reduction = **$0.60 per generation**

#### 2. **Use Claude Haiku for Simple Tasks**
- **Current**: Using Sonnet 4 for everything
- **Optimization**: Use Haiku for:
  - Topic selection (less creative, more factual)
  - Simple content generation
- **Haiku Pricing**: ~$0.25/1M input, $1.25/1M output (80% cheaper!)
- **Savings**: ~$0.80 per weekly generation

#### 3. **Reduce max_tokens for Topic Selection**
- **Current**: `max_tokens: 2000` for topic selection
- **Optimization**: Reduce to `max_tokens: 1000` (topics are short)
- **Savings**: ~$0.10 per generation

#### 4. **Optimize Business Profile Auto-fill Prompt**
- **Current**: Sends full scraped content (10,000+ tokens)
- **Optimization**: 
  - Summarize scraped content first (use Haiku)
  - Then extract structured data (use Sonnet)
- **Savings**: ~$0.15 per auto-fill

#### 5. **Batch Content Generation**
- **Current**: Generates posts one-by-one
- **Optimization**: Generate multiple posts in one API call
- **Savings**: ~50% reduction = **$0.75 per weekly generation**

### 📊 Medium-Term Optimizations

#### 6. **Cache Topic Lists**
- Cache daily topic lists for 6-12 hours
- Multiple users can share same cached topics
- **Savings**: ~$0.25 per generation if cached

#### 7. **Reduce Caption Variations**
- **Current**: 3 variations per caption
- **Optimization**: Default to 1-2 variations, make 3 optional
- **Savings**: ~$0.05 per caption generation

#### 8. **Smart Prompt Engineering**
- Reduce prompt verbosity
- Use more concise instructions
- **Savings**: ~20% token reduction = **$0.30 per generation**

### 🔧 Implementation Priority

**Phase 1 (Quick Wins - Implement Now)**:
1. ✅ Reduce default post count to 7-10
2. ✅ Use Haiku for topic selection
3. ✅ Reduce max_tokens for topic selection
4. ✅ Add option to generate 1-2 captions instead of 3

**Phase 2 (Medium Effort)**:
5. ✅ Optimize business profile auto-fill
6. ✅ Batch content generation
7. ✅ Cache topic lists

**Phase 3 (Long-term)**:
8. ✅ Smart prompt engineering
9. ✅ Usage analytics dashboard
10. ✅ Cost alerts and limits

---

## Expected Cost Reduction

**Before Optimization**:
- Weekly calendar: $1.50
- Auto-fill: $0.24
- Captions: $0.07

**After Phase 1 Optimization**:
- Weekly calendar: **$0.40** (73% reduction)
- Auto-fill: **$0.10** (58% reduction)
- Captions: **$0.03** (57% reduction)

**Monthly cost per active user**: ~$2.00-3.00 (down from $8.60)

---

## Monitoring & Alerts

### Add Cost Tracking
1. Track tokens used per API call
2. Log costs per user/feature
3. Set daily/monthly spending limits
4. Alert when approaching limits

### Usage Dashboard
- Show AI usage stats per user
- Display cost per feature
- Warn users before expensive operations

---

## Next Steps

1. **Immediate**: Implement Phase 1 optimizations
2. **This Week**: Add cost tracking and monitoring
3. **Next Week**: Implement Phase 2 optimizations
4. **Ongoing**: Monitor costs and adjust as needed

