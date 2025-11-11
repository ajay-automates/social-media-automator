/**
 * Analytics Insights Agent
 *
 * AI-powered analytics system that analyzes posting patterns,
 * detects trends, and generates actionable insights to improve engagement.
 *
 * Features:
 * - Pattern detection (best times, content types, etc.)
 * - AI-generated insights and recommendations
 * - Predictive post scoring
 * - Weekly insights summaries
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================
// 1. PATTERN DETECTION
// ============================================================

/**
 * Analyze user's posting patterns and detect trends
 */
async function analyzeUserPatterns(userId) {
  console.log(`\n📊 Analyzing patterns for user ${userId}...`);

  try {
    // Get user's posts (last 90 days)
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        text,
        platforms,
        status,
        posted_at,
        post_analytics (
          platform,
          success
        )
      `)
      .eq('user_id', userId)
      .gte('posted_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .not('posted_at', 'is', null)
      .order('posted_at', { ascending: false });

    if (error) throw error;

    if (!posts || posts.length < 10) {
      console.log('⚠️  Not enough posts for pattern analysis (need at least 10)');
      return { patterns: [], message: 'Need at least 10 posts for pattern analysis' };
    }

    console.log(`✅ Found ${posts.length} posts for analysis`);

    const patterns = [];

    // 1. TIME SLOT PATTERNS
    const timePatterns = detectTimePatterns(posts);
    patterns.push(...timePatterns);

    // 2. DAY OF WEEK PATTERNS
    const dayPatterns = detectDayPatterns(posts);
    patterns.push(...dayPatterns);

    // 3. CONTENT TYPE PATTERNS
    const contentPatterns = detectContentTypePatterns(posts);
    patterns.push(...contentPatterns);

    // 4. CAPTION LENGTH PATTERNS
    const lengthPatterns = detectCaptionLengthPatterns(posts);
    patterns.push(...lengthPatterns);

    // 5. HASHTAG PATTERNS
    const hashtagPatterns = detectHashtagPatterns(posts);
    patterns.push(...hashtagPatterns);

    // 6. EMOJI PATTERNS
    const emojiPatterns = detectEmojiPatterns(posts);
    patterns.push(...emojiPatterns);

    // 7. PLATFORM PATTERNS
    const platformPatterns = detectPlatformPatterns(posts);
    patterns.push(...platformPatterns);

    // Save patterns to database
    await savePatterns(userId, patterns);

    console.log(`✅ Detected ${patterns.length} patterns`);
    return { patterns, totalPostsAnalyzed: posts.length };

  } catch (error) {
    console.error('❌ Error analyzing patterns:', error);
    throw error;
  }
}

/**
 * Detect time slot patterns (best hours to post)
 */
function detectTimePatterns(posts) {
  const patterns = [];
  const timeSlots = {}; // { "09": { total: 5, success: 4 } }

  posts.forEach(post => {
    if (!post.posted_at) return;

    const hour = new Date(post.posted_at).getHours();
    const hourKey = hour.toString().padStart(2, '0');

    if (!timeSlots[hourKey]) {
      timeSlots[hourKey] = { total: 0, success: 0, posts: [] };
    }

    timeSlots[hourKey].total++;
    timeSlots[hourKey].posts.push(post.id);

    // Count successful posts
    if (post.post_analytics) {
      const successCount = post.post_analytics.filter(a => a.success).length;
      const totalAttempts = post.post_analytics.length;
      if (successCount === totalAttempts && totalAttempts > 0) {
        timeSlots[hourKey].success++;
      }
    }
  });

  // Calculate success rates and create patterns
  Object.entries(timeSlots).forEach(([hour, data]) => {
    if (data.total >= 3) { // At least 3 posts in this time slot
      const successRate = (data.success / data.total) * 100;

      patterns.push({
        patternType: 'time_slot',
        patternKey: `hour_${hour}`,
        totalPosts: data.total,
        totalSuccess: data.success,
        successRate: successRate.toFixed(2),
        characteristics: {
          hour: parseInt(hour),
          hourLabel: `${hour}:00`,
          bestPost: data.posts[0],
        }
      });
    }
  });

  return patterns;
}

/**
 * Detect day of week patterns
 */
function detectDayPatterns(posts) {
  const patterns = [];
  const daySlots = {}; // { "1": { total: 10, success: 8 } } (1 = Monday)

  posts.forEach(post => {
    if (!post.posted_at) return;

    const day = new Date(post.posted_at).getDay(); // 0-6
    const dayKey = day.toString();

    if (!daySlots[dayKey]) {
      daySlots[dayKey] = { total: 0, success: 0, posts: [] };
    }

    daySlots[dayKey].total++;
    daySlots[dayKey].posts.push(post.id);

    if (post.post_analytics) {
      const successCount = post.post_analytics.filter(a => a.success).length;
      const totalAttempts = post.post_analytics.length;
      if (successCount === totalAttempts && totalAttempts > 0) {
        daySlots[dayKey].success++;
      }
    }
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  Object.entries(daySlots).forEach(([day, data]) => {
    if (data.total >= 3) {
      const successRate = (data.success / data.total) * 100;

      patterns.push({
        patternType: 'day_of_week',
        patternKey: `day_${day}`,
        totalPosts: data.total,
        totalSuccess: data.success,
        successRate: successRate.toFixed(2),
        characteristics: {
          dayNumber: parseInt(day),
          dayName: dayNames[parseInt(day)],
          bestPost: data.posts[0],
        }
      });
    }
  });

  return patterns;
}

/**
 * Detect content type patterns (questions, tips, stories, etc.)
 */
function detectContentTypePatterns(posts) {
  const patterns = [];
  const contentTypes = {
    question: { total: 0, success: 0, posts: [] },
    list: { total: 0, success: 0, posts: [] },
    story: { total: 0, success: 0, posts: [] },
    announcement: { total: 0, success: 0, posts: [] },
    tip: { total: 0, success: 0, posts: [] },
    quote: { total: 0, success: 0, posts: [] },
  };

  posts.forEach(post => {
    const text = post.text.toLowerCase();
    const isSuccess = post.post_analytics?.every(a => a.success) && post.post_analytics?.length > 0;

    // Question posts
    if (text.includes('?')) {
      contentTypes.question.total++;
      if (isSuccess) contentTypes.question.success++;
      contentTypes.question.posts.push(post.id);
    }

    // List posts (numbered or bulleted)
    if (/[0-9]\.|•|→|✓/.test(text) || text.includes('step') || text.includes('ways')) {
      contentTypes.list.total++;
      if (isSuccess) contentTypes.list.success++;
      contentTypes.list.posts.push(post.id);
    }

    // Story posts
    if (text.includes('story') || text.includes('today') || text.includes('yesterday')) {
      contentTypes.story.total++;
      if (isSuccess) contentTypes.story.success++;
      contentTypes.story.posts.push(post.id);
    }

    // Announcements
    if (text.includes('announce') || text.includes('excited') || text.includes('launching')) {
      contentTypes.announcement.total++;
      if (isSuccess) contentTypes.announcement.success++;
      contentTypes.announcement.posts.push(post.id);
    }

    // Tips
    if (text.includes('tip') || text.includes('hack') || text.includes('trick') || text.includes('pro tip')) {
      contentTypes.tip.total++;
      if (isSuccess) contentTypes.tip.success++;
      contentTypes.tip.posts.push(post.id);
    }

    // Quotes
    if (text.includes('"') || text.includes('"') || text.includes('"')) {
      contentTypes.quote.total++;
      if (isSuccess) contentTypes.quote.success++;
      contentTypes.quote.posts.push(post.id);
    }
  });

  Object.entries(contentTypes).forEach(([type, data]) => {
    if (data.total >= 3) {
      const successRate = (data.success / data.total) * 100;

      patterns.push({
        patternType: 'content_format',
        patternKey: `content_${type}`,
        totalPosts: data.total,
        totalSuccess: data.success,
        successRate: successRate.toFixed(2),
        characteristics: {
          contentType: type,
          bestPost: data.posts[0],
        }
      });
    }
  });

  return patterns;
}

/**
 * Detect caption length patterns
 */
function detectCaptionLengthPatterns(posts) {
  const patterns = [];
  const lengthBuckets = {
    short: { total: 0, success: 0, range: [0, 100], posts: [] },
    medium: { total: 0, success: 0, range: [101, 300], posts: [] },
    long: { total: 0, success: 0, range: [301, 1000], posts: [] },
    veryLong: { total: 0, success: 0, range: [1001, 10000], posts: [] },
  };

  posts.forEach(post => {
    const length = post.text.length;
    const isSuccess = post.post_analytics?.every(a => a.success) && post.post_analytics?.length > 0;

    let bucket = null;
    if (length <= 100) bucket = 'short';
    else if (length <= 300) bucket = 'medium';
    else if (length <= 1000) bucket = 'long';
    else bucket = 'veryLong';

    lengthBuckets[bucket].total++;
    if (isSuccess) lengthBuckets[bucket].success++;
    lengthBuckets[bucket].posts.push(post.id);
  });

  Object.entries(lengthBuckets).forEach(([bucket, data]) => {
    if (data.total >= 3) {
      const successRate = (data.success / data.total) * 100;

      patterns.push({
        patternType: 'post_length',
        patternKey: `length_${bucket}`,
        totalPosts: data.total,
        totalSuccess: data.success,
        successRate: successRate.toFixed(2),
        characteristics: {
          lengthCategory: bucket,
          minLength: data.range[0],
          maxLength: data.range[1],
          bestPost: data.posts[0],
        }
      });
    }
  });

  return patterns;
}

/**
 * Detect hashtag usage patterns
 */
function detectHashtagPatterns(posts) {
  const patterns = [];
  const hashtagBuckets = {
    none: { total: 0, success: 0, posts: [] },
    few: { total: 0, success: 0, range: [1, 5], posts: [] },
    moderate: { total: 0, success: 0, range: [6, 15], posts: [] },
    many: { total: 0, success: 0, range: [16, 100], posts: [] },
  };

  posts.forEach(post => {
    const hashtagCount = (post.text.match(/#/g) || []).length;
    const isSuccess = post.post_analytics?.every(a => a.success) && post.post_analytics?.length > 0;

    let bucket = null;
    if (hashtagCount === 0) bucket = 'none';
    else if (hashtagCount <= 5) bucket = 'few';
    else if (hashtagCount <= 15) bucket = 'moderate';
    else bucket = 'many';

    hashtagBuckets[bucket].total++;
    if (isSuccess) hashtagBuckets[bucket].success++;
    hashtagBuckets[bucket].posts.push(post.id);
  });

  Object.entries(hashtagBuckets).forEach(([bucket, data]) => {
    if (data.total >= 3) {
      const successRate = (data.success / data.total) * 100;

      patterns.push({
        patternType: 'hashtag_strategy',
        patternKey: `hashtags_${bucket}`,
        totalPosts: data.total,
        totalSuccess: data.success,
        successRate: successRate.toFixed(2),
        characteristics: {
          hashtagCategory: bucket,
          range: data.range || [0, 0],
          bestPost: data.posts[0],
        }
      });
    }
  });

  return patterns;
}

/**
 * Detect emoji usage patterns
 */
function detectEmojiPatterns(posts) {
  const patterns = [];
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

  const emojiBuckets = {
    none: { total: 0, success: 0, posts: [] },
    few: { total: 0, success: 0, range: [1, 3], posts: [] },
    moderate: { total: 0, success: 0, range: [4, 10], posts: [] },
    many: { total: 0, success: 0, range: [11, 100], posts: [] },
  };

  posts.forEach(post => {
    const emojiCount = (post.text.match(emojiRegex) || []).length;
    const isSuccess = post.post_analytics?.every(a => a.success) && post.post_analytics?.length > 0;

    let bucket = null;
    if (emojiCount === 0) bucket = 'none';
    else if (emojiCount <= 3) bucket = 'few';
    else if (emojiCount <= 10) bucket = 'moderate';
    else bucket = 'many';

    emojiBuckets[bucket].total++;
    if (isSuccess) emojiBuckets[bucket].success++;
    emojiBuckets[bucket].posts.push(post.id);
  });

  Object.entries(emojiBuckets).forEach(([bucket, data]) => {
    if (data.total >= 3) {
      const successRate = (data.success / data.total) * 100;

      patterns.push({
        patternType: 'emoji_frequency',
        patternKey: `emojis_${bucket}`,
        totalPosts: data.total,
        totalSuccess: data.success,
        successRate: successRate.toFixed(2),
        characteristics: {
          emojiCategory: bucket,
          range: data.range || [0, 0],
          bestPost: data.posts[0],
        }
      });
    }
  });

  return patterns;
}

/**
 * Detect platform-specific patterns
 */
function detectPlatformPatterns(posts) {
  const patterns = [];
  const platformStats = {};

  posts.forEach(post => {
    if (!post.post_analytics) return;

    post.post_analytics.forEach(analytics => {
      const platform = analytics.platform;
      if (!platformStats[platform]) {
        platformStats[platform] = { total: 0, success: 0, posts: [] };
      }

      platformStats[platform].total++;
      if (analytics.success) platformStats[platform].success++;
      platformStats[platform].posts.push(post.id);
    });
  });

  Object.entries(platformStats).forEach(([platform, data]) => {
    if (data.total >= 3) {
      const successRate = (data.success / data.total) * 100;

      patterns.push({
        patternType: 'platform_performance',
        patternKey: `platform_${platform}`,
        totalPosts: data.total,
        totalSuccess: data.success,
        successRate: successRate.toFixed(2),
        characteristics: {
          platform: platform,
          bestPost: data.posts[0],
        }
      });
    }
  });

  return patterns;
}

/**
 * Save patterns to database
 */
async function savePatterns(userId, patterns) {
  for (const pattern of patterns) {
    const { error } = await supabase
      .from('content_patterns')
      .upsert({
        user_id: userId,
        pattern_type: pattern.patternType,
        pattern_key: pattern.patternKey,
        total_posts: pattern.totalPosts,
        total_success: pattern.totalSuccess,
        success_rate: parseFloat(pattern.successRate),
        characteristics: pattern.characteristics,
        last_updated: new Date().toISOString(),
        last_post_analyzed: new Date().toISOString(),
      }, {
        onConflict: 'user_id,pattern_type,pattern_key'
      });

    if (error) {
      console.error(`Error saving pattern ${pattern.patternKey}:`, error);
    }
  }
}

// ============================================================
// 2. AI INSIGHTS GENERATION
// ============================================================

/**
 * Generate AI insights from detected patterns
 */
async function generateInsights(userId) {
  console.log(`\n🤖 Generating AI insights for user ${userId}...`);

  try {
    // Get patterns for this user
    const { data: patterns, error } = await supabase
      .from('content_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('success_rate', { ascending: false });

    if (error) throw error;

    if (!patterns || patterns.length === 0) {
      console.log('⚠️  No patterns found. Run pattern analysis first.');
      return { insights: [], message: 'No patterns found' };
    }

    console.log(`✅ Found ${patterns.length} patterns to analyze`);

    // Use AI to generate insights
    const insights = await analyzePatternsWithAI(userId, patterns);

    // Save insights to database
    await saveInsights(userId, insights);

    console.log(`✅ Generated ${insights.length} insights`);
    return { insights, totalPatterns: patterns.length };

  } catch (error) {
    console.error('❌ Error generating insights:', error);
    throw error;
  }
}

/**
 * Use Claude AI to analyze patterns and generate insights
 */
async function analyzePatternsWithAI(userId, patterns) {
  // Prepare pattern data for AI
  const patternSummary = patterns.map(p => ({
    type: p.pattern_type,
    key: p.pattern_key,
    successRate: p.success_rate,
    totalPosts: p.total_posts,
    characteristics: p.characteristics,
  }));

  const prompt = `You are an expert social media strategist analyzing posting patterns for a user.

Here are the detected patterns from their last 90 days of posts:

${JSON.stringify(patternSummary, null, 2)}

Based on these patterns, generate 5-8 actionable insights and recommendations. For each insight:

1. Identify what's working well (high success rate patterns)
2. Identify what's not working (low success rate patterns)
3. Provide specific, actionable recommendations
4. Calculate the potential impact

Format your response as a JSON array of insights:

[
  {
    "type": "best_time|best_day|content_type|caption_length|hashtag_performance|platform_performance|emoji_usage|overall_trend",
    "title": "Short, catchy title",
    "description": "Detailed explanation of the insight",
    "impactScore": 0-100,
    "confidenceScore": 0-100,
    "category": "positive|negative|neutral",
    "recommendation": "Specific action to take",
    "dataPoints": number_of_posts_analyzed,
    "metricValue": percentage_or_value,
    "comparisonValue": baseline_value
  }
]

Focus on:
- Best posting times and days
- Most effective content types
- Optimal caption length
- Hashtag strategy
- Platform performance
- Emoji usage effectiveness

Make recommendations specific, actionable, and data-driven. Be honest about both what's working and what needs improvement.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const insights = JSON.parse(jsonMatch[0]);
    return insights;

  } catch (error) {
    console.error('❌ Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Save insights to database
 */
async function saveInsights(userId, insights) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  for (const insight of insights) {
    const { error } = await supabase
      .from('analytics_insights')
      .insert({
        user_id: userId,
        insight_type: insight.type,
        title: insight.title,
        description: insight.description,
        impact_score: insight.impactScore,
        confidence_score: insight.confidenceScore,
        data_points: insight.dataPoints,
        metric_value: insight.metricValue,
        comparison_value: insight.comparisonValue,
        recommendation: insight.recommendation,
        category: insight.category,
        analysis_period_start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        analysis_period_end: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

    if (error) {
      console.error(`Error saving insight "${insight.title}":`, error);
    }
  }
}

// ============================================================
// 3. PREDICTIVE POST SCORING
// ============================================================

/**
 * Score a draft post before publishing (0-100)
 */
async function scoreDraftPost(userId, draftCaption, platforms = [], hasImage = false, hasVideo = false) {
  console.log(`\n⭐ Scoring draft post for user ${userId}...`);

  try {
    // Get user's historical patterns
    const { data: patterns, error: patternsError } = await supabase
      .from('content_patterns')
      .select('*')
      .eq('user_id', userId);

    if (patternsError) throw patternsError;

    // Get user's best performing posts for comparison
    const { data: bestPosts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        text,
        platforms,
        post_analytics (
          success
        )
      `)
      .eq('user_id', userId)
      .not('posted_at', 'is', null)
      .order('posted_at', { ascending: false })
      .limit(50);

    if (postsError) throw postsError;

    // Calculate success rate of historical posts
    const successfulPosts = bestPosts.filter(p =>
      p.post_analytics?.every(a => a.success) && p.post_analytics?.length > 0
    );
    const avgSuccessRate = successfulPosts.length / bestPosts.length * 100;

    // Use AI to score the draft
    const score = await scoreWithAI(draftCaption, platforms, hasImage, hasVideo, patterns, bestPosts, avgSuccessRate);

    // Save score to database
    await saveDraftScore(userId, null, draftCaption, platforms, hasImage, hasVideo, score);

    console.log(`✅ Draft scored: ${score.overallScore}/100`);
    return score;

  } catch (error) {
    console.error('❌ Error scoring draft:', error);
    throw error;
  }
}

/**
 * Use AI to score draft post
 */
async function scoreWithAI(caption, platforms, hasImage, hasVideo, patterns, bestPosts, avgSuccessRate) {
  const patternSummary = patterns?.map(p => ({
    type: p.pattern_type,
    key: p.pattern_key,
    successRate: p.success_rate,
  })) || [];

  const bestPostsPreview = bestPosts.slice(0, 5).map(p => ({
    text: p.text.substring(0, 150),
    platforms: p.platforms,
  }));

  const prompt = `You are a social media performance predictor. Score this draft post on a scale of 0-100.

DRAFT POST:
"${caption}"

PLATFORMS: ${platforms.join(', ')}
HAS IMAGE: ${hasImage}
HAS VIDEO: ${hasVideo}

USER'S HISTORICAL PATTERNS:
${JSON.stringify(patternSummary, null, 2)}

USER'S BEST POSTS:
${JSON.stringify(bestPostsPreview, null, 2)}

USER'S AVERAGE SUCCESS RATE: ${avgSuccessRate.toFixed(1)}%

Analyze the draft post and provide:
1. Overall score (0-100)
2. Engagement prediction (0-100)
3. Virality score (0-100)
4. Platform-specific scores
5. Strengths (what's good)
6. Weaknesses (what could be improved)
7. Specific suggestions

Consider:
- Caption length and structure
- Hashtag usage
- Emoji usage
- Call-to-action presence
- Content type (question, story, tip, etc.)
- Hook/opening line effectiveness
- Alignment with user's successful patterns

Format as JSON:
{
  "overallScore": 0-100,
  "engagementPrediction": 0-100,
  "viralityScore": 0-100,
  "platformScores": { "linkedin": 85, "twitter": 72, ... },
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "comparedToBest": percentage_vs_user_best,
  "comparedToAvg": percentage_vs_user_avg
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.2,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const score = JSON.parse(jsonMatch[0]);
    return score;

  } catch (error) {
    console.error('❌ Error calling Claude API for scoring:', error);
    throw error;
  }
}

/**
 * Save draft score to database
 */
async function saveDraftScore(userId, postId, caption, platforms, hasImage, hasVideo, score) {
  const hashtagCount = (caption.match(/#/g) || []).length;

  const { error } = await supabase
    .from('draft_post_scores')
    .insert({
      user_id: userId,
      post_id: postId,
      draft_caption: caption,
      draft_platforms: platforms,
      draft_has_image: hasImage,
      draft_has_video: hasVideo,
      draft_hashtag_count: hashtagCount,
      overall_score: score.overallScore,
      engagement_prediction: score.engagementPrediction,
      virality_score: score.viralityScore,
      platform_scores: score.platformScores,
      strengths: score.strengths,
      weaknesses: score.weaknesses,
      suggestions: score.suggestions,
      compared_to_best: score.comparedToBest,
      compared_to_avg: score.comparedToAvg,
      model_version: 'claude-sonnet-4-20250514',
    });

  if (error) {
    console.error('Error saving draft score:', error);
  }
}

// ============================================================
// 4. GET INSIGHTS FOR USER
// ============================================================

/**
 * Get active insights for a user
 */
async function getUserInsights(userId) {
  const { data, error } = await supabase
    .from('analytics_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('dismissed_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('impact_score', { ascending: false })
    .order('confidence_score', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get user patterns
 */
async function getUserPatterns(userId) {
  const { data, error } = await supabase
    .from('content_patterns')
    .select('*')
    .eq('user_id', userId)
    .order('success_rate', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  analyzeUserPatterns,
  generateInsights,
  scoreDraftPost,
  getUserInsights,
  getUserPatterns,
};
