/**
 * Content Creation Agent Service
 * AI-powered autonomous content generation
 * Generates 30-day content calendars, monitors trends, learns brand voice
 */

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const { analyzeBrandVoice, getBrandVoiceProfile, needsReanalysis, generateInBrandVoice } = require('./brand-voice-analyzer');
const { monitorTrendsForUser, getTrendAlerts, fetchAllTrends, matchTrendsToNiche } = require('./trend-monitor');
const { generateHashtags } = require('./ai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Content types distribution for balanced calendar
 */
const CONTENT_MIX = {
  educational: 40,   // How-to, tips, tutorials
  promotional: 30,   // Product features, announcements
  engaging: 20,      // Questions, polls, stories
  trending: 10       // Trending topic commentary
};

/**
 * Generate a complete content calendar
 * @param {string} userId - User ID
 * @param {number} days - Number of days to generate (default: 30)
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated content calendar
 */
async function generateContentCalendar(userId, days = 30, options = {}) {
  const startTime = Date.now();

  try {
    console.log(`\n🤖 CONTENT CREATION AGENT STARTING...`);
    console.log(`   User: ${userId}`);
    console.log(`   Days: ${days}`);
    console.log(`   ` + '='.repeat(50));

    // 1. Analyze brand voice (if needed)
    console.log('\n📊 STEP 1: Analyzing Brand Voice...');
    let brandVoice = await getBrandVoiceProfile(userId);

    if (!brandVoice || await needsReanalysis(userId)) {
      console.log('   🔄 Running brand voice analysis...');
      const analysisResult = await analyzeBrandVoice(userId);

      if (!analysisResult.success) {
        console.log('   ⚠️  Not enough posts for brand voice analysis');
        brandVoice = getDefaultBrandVoice();
      } else {
        brandVoice = analysisResult.brandVoice;
      }
    } else {
      console.log('   ✅ Using existing brand voice profile');
    }

    // 2. Monitor trends
    console.log('\n🔥 STEP 2: Monitoring Trends...');
    const userNiches = brandVoice.topics_of_interest || options.niches || ['business', 'technology'];
    const trendingTopics = await monitorTrendsForUser(userId, userNiches);

    console.log(`   ✅ Found ${trendingTopics.alertsCreated || 0} relevant trending topics`);

    // 3. Generate topic ideas
    console.log('\n💡 STEP 3: Generating Topic Ideas...');
    const topics = await generateTopicIdeas(userId, brandVoice, days, options);

    console.log(`   ✅ Generated ${topics.length} topic ideas`);

    // 4. Calculate content mix
    const contentMix = options.contentMix || CONTENT_MIX;
    const typedTopics = assignContentTypes(topics, contentMix);

    // 5. Generate posts for each topic
    console.log('\n✍️  STEP 4: Generating Posts...');
    const posts = [];
    let successCount = 0;

    for (let i = 0; i < typedTopics.length; i++) {
      const topic = typedTopics[i];

      try {
        console.log(`   [${i + 1}/${typedTopics.length}] ${topic.topic.substring(0, 50)}...`);

        const post = await generateSinglePost(
          userId,
          topic,
          brandVoice,
          options.platforms || ['linkedin', 'twitter']
        );

        posts.push(post);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Failed to generate post: ${error.message}`);
      }

      // Rate limiting: pause between generations
      if (i < typedTopics.length - 1) {
        await sleep(2000); // 2 second pause
      }
    }

    console.log(`\n   ✅ Generated ${successCount}/${typedTopics.length} posts successfully`);

    // 6. Schedule posts across the calendar
    console.log('\n📅 STEP 5: Scheduling Posts...');
    const scheduledPosts = await schedulePostsAcrossCalendar(userId, posts, days, options);

    // 7. Log generation stats
    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    await logGeneration(userId, {
      generation_type: 'calendar',
      posts_requested: days,
      posts_generated: posts.length,
      posts_approved: 0,
      posts_rejected: 0,
      avg_quality_score: calculateAverageScore(posts),
      topics_generated: topics.map(t => t.topic),
      trends_used: trendingTopics.alerts?.map(a => a.trend_topic) || [],
      generation_time_seconds: parseFloat(generationTime),
      ai_tokens_used: posts.length * 500 // Rough estimate
    });

    console.log(`\n` + '='.repeat(50));
    console.log(`✅ CONTENT CREATION AGENT COMPLETE`);
    console.log(`   Posts Generated: ${posts.length}`);
    console.log(`   Time Taken: ${generationTime}s`);
    console.log(`   Avg Quality Score: ${calculateAverageScore(posts)}/100`);
    console.log(`   ` + '='.repeat(50) + `\n`);

    return {
      success: true,
      posts: scheduledPosts,
      stats: {
        postsGenerated: posts.length,
        daysGenerated: days,
        avgQualityScore: calculateAverageScore(posts),
        generationTime: parseFloat(generationTime),
        trendingTopicsUsed: trendingTopics.alertsCreated || 0
      },
      brandVoice,
      trendingTopics: trendingTopics.alerts || []
    };

  } catch (error) {
    console.error('❌ Error generating content calendar:', error);

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    await logGeneration(userId, {
      generation_type: 'calendar',
      posts_requested: days,
      posts_generated: 0,
      posts_approved: 0,
      posts_rejected: 0,
      generation_time_seconds: parseFloat(generationTime),
      error_message: error.message
    });

    throw error;
  }
}

/**
 * Generate topic ideas for content calendar
 */
async function generateTopicIdeas(userId, brandVoice, count, options = {}) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const niches = brandVoice.topics_of_interest?.join(', ') || options.niches?.join(', ') || 'business, technology';
    const avoidTopics = options.avoidTopics?.join(', ') || 'none';

    const prompt = `Generate ${count} unique social media post topic ideas for someone in these niches: ${niches}.

Requirements:
- Mix of educational, promotional, engaging, and trending topics
- Varied and interesting (no repetition)
- Actionable and specific (not vague)
- Good for social media (shareable, engaging)
- Avoid these topics: ${avoidTopics}

Return ONLY a JSON array of topic strings, no additional text:
["Topic 1", "Topic 2", "Topic 3", ...]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.9, // High creativity
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text.trim();

    // Extract JSON array
    const jsonMatch = responseText.match(/\[([\s\S]*)\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse topics from AI response');
    }

    const topics = JSON.parse(jsonMatch[0]);

    return topics.map(topic => ({ topic, type: null }));

  } catch (error) {
    console.error('❌ Error generating topic ideas:', error);
    // Fallback to default topics
    return generateFallbackTopics(count);
  }
}

/**
 * Assign content types to topics based on mix ratio
 */
function assignContentTypes(topics, contentMix) {
  const types = [];

  // Calculate counts for each type
  const total = topics.length;
  const educational = Math.round(total * contentMix.educational / 100);
  const promotional = Math.round(total * contentMix.promotional / 100);
  const engaging = Math.round(total * contentMix.engaging / 100);
  const trending = total - educational - promotional - engaging;

  // Create type array
  types.push(...Array(educational).fill('educational'));
  types.push(...Array(promotional).fill('promotional'));
  types.push(...Array(engaging).fill('engaging'));
  types.push(...Array(trending).fill('trending'));

  // Shuffle types
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  // Assign to topics
  return topics.map((topic, index) => ({
    ...topic,
    type: types[index] || 'educational'
  }));
}

/**
 * Generate a single post with caption, hashtags, and quality score
 */
async function generateSinglePost(userId, topic, brandVoice, platforms) {
  try {
    // 1. Generate caption in brand voice
    const primaryPlatform = platforms[0] || 'linkedin';
    const caption = await generateInBrandVoice(topic.topic, brandVoice, primaryPlatform);

    // 2. Generate hashtags
    let hashtags = [];
    try {
      hashtags = await generateHashtags(caption, primaryPlatform);
    } catch (error) {
      console.log('      ⚠️  Hashtag generation failed, skipping');
    }

    // 3. Calculate quality score
    const qualityScore = calculateQualityScore(caption, topic.type);

    // 4. Calculate engagement prediction (simple heuristic for now)
    const engagementPrediction = calculateEngagementPrediction(caption, qualityScore, brandVoice);

    // 5. Save to database
    const { data, error } = await supabase
      .from('content_agent_posts')
      .insert({
        user_id: userId,
        topic: topic.topic,
        caption: caption,
        platforms: platforms,
        hashtags: hashtags,
        status: 'pending',
        quality_score: qualityScore,
        engagement_prediction: engagementPrediction,
        content_type: topic.type,
        created_by: 'ai-agent'
      })
      .select()
      .single();

    if (error) throw error;

    return data;

  } catch (error) {
    console.error('❌ Error generating single post:', error);
    throw error;
  }
}

/**
 * Calculate quality score for a post (0-100)
 */
function calculateQualityScore(caption, contentType) {
  let score = 50; // Base score

  // Length score (not too short, not too long)
  const length = caption.length;
  if (length >= 100 && length <= 500) score += 15;
  else if (length < 50) score -= 10;
  else if (length > 1000) score -= 5;

  // Has a hook (starts strong)
  const firstSentence = caption.split(/[.!?]/)[0];
  if (firstSentence.length < 100 && (firstSentence.includes('?') || /\d/.test(firstSentence))) {
    score += 10; // Question or number in hook
  }

  // Has call-to-action
  const ctas = ['comment', 'share', 'follow', 'check out', 'learn more', 'what do you think', 'let me know'];
  if (ctas.some(cta => caption.toLowerCase().includes(cta))) {
    score += 10;
  }

  // Has structure (line breaks, bullet points)
  const lineBreaks = (caption.match(/\n/g) || []).length;
  if (lineBreaks >= 2) score += 10;

  // Not too promotional
  const promotional = ['buy', 'purchase', 'sale', 'discount', 'limited time'];
  const promoCount = promotional.filter(word => caption.toLowerCase().includes(word)).length;
  if (contentType === 'promotional') {
    if (promoCount === 1) score += 5; // Subtle promo
  } else {
    if (promoCount === 0) score += 5; // Not promotional when shouldn't be
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate engagement prediction (0-100)
 */
function calculateEngagementPrediction(caption, qualityScore, brandVoice) {
  let prediction = qualityScore * 0.7; // Start with quality score

  // Boost for engaging elements
  if (caption.includes('?')) prediction += 5; // Questions boost engagement
  if (brandVoice.emoji_usage && /[\p{Emoji}]/u.test(caption)) prediction += 5;
  if (caption.split('\n').length >= 3) prediction += 5; // Good structure

  // Boost for optimal length (250-500 chars tends to perform well)
  const length = caption.length;
  if (length >= 250 && length <= 500) prediction += 10;

  return Math.min(100, Math.max(0, Math.round(prediction)));
}

/**
 * Schedule posts across calendar days
 */
async function schedulePostsAcrossCalendar(userId, posts, days, options = {}) {
  try {
    const postsPerDay = Math.ceil(posts.length / days);
    const scheduledPosts = [];

    // Get user's best posting times (if available)
    const { analyzeBestTimes } = require('./analytics');
    let bestTimes = [];

    try {
      const timesAnalysis = await analyzeBestTimes(userId);
      if (timesAnalysis.hasEnoughData) {
        bestTimes = timesAnalysis.topSlots.map(slot => ({
          dayOfWeek: slot.dayOfWeek,
          hour: slot.hour
        }));
      }
    } catch (error) {
      console.log('      ⚠️  Could not fetch best times, using defaults');
    }

    // Default posting times if no data available
    if (bestTimes.length === 0) {
      bestTimes = [
        { dayOfWeek: 1, hour: 9 },  // Monday 9 AM
        { dayOfWeek: 2, hour: 14 }, // Tuesday 2 PM
        { dayOfWeek: 3, hour: 10 }, // Wednesday 10 AM
        { dayOfWeek: 4, hour: 15 }, // Thursday 3 PM
        { dayOfWeek: 5, hour: 11 }  // Friday 11 AM
      ];
    }

    // Schedule posts
    const startDate = new Date();
    let postIndex = 0;

    for (let day = 0; day < days && postIndex < posts.length; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);

      const dayOfWeek = currentDate.getDay();
      const timeSlot = bestTimes.find(t => t.dayOfWeek === dayOfWeek) || bestTimes[0];

      currentDate.setHours(timeSlot.hour, 0, 0, 0);

      // Schedule 1-2 posts per day
      const postsThisDay = Math.min(postsPerDay, posts.length - postIndex);

      for (let i = 0; i < postsThisDay; i++) {
        const post = posts[postIndex];

        // Update post with scheduled time
        const { data, error } = await supabase
          .from('content_agent_posts')
          .update({
            scheduled_time: currentDate.toISOString(),
            status: options.autoApprove ? 'approved' : 'pending'
          })
          .eq('id', post.id)
          .select()
          .single();

        if (!error) {
          scheduledPosts.push(data);
        }

        postIndex++;

        // Add hours between posts on same day
        currentDate.setHours(currentDate.getHours() + 4);
      }
    }

    return scheduledPosts;

  } catch (error) {
    console.error('❌ Error scheduling posts:', error);
    return posts; // Return unscheduled posts
  }
}

/**
 * Get generated posts for user
 */
async function getGeneratedPosts(userId, status = null, limit = 50) {
  try {
    let query = supabase
      .from('content_agent_posts')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_time', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching generated posts:', error);
    return [];
  }
}

/**
 * Approve a generated post (schedules it for posting)
 */
async function approvePost(postId, approvedBy) {
  try {
    const { data, error } = await supabase
      .from('content_agent_posts')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    // TODO: Actually schedule the post in the queue
    // This will be integrated with the existing scheduler

    return {
      success: true,
      post: data
    };
  } catch (error) {
    console.error('❌ Error approving post:', error);
    throw error;
  }
}

/**
 * Reject a generated post
 */
async function rejectPost(postId) {
  try {
    const { data, error } = await supabase
      .from('content_agent_posts')
      .update({
        status: 'rejected'
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      post: data
    };
  } catch (error) {
    console.error('❌ Error rejecting post:', error);
    throw error;
  }
}

// Helper functions

function getDefaultBrandVoice() {
  return {
    tone: 'professional',
    formality_level: 6,
    common_phrases: [],
    avoided_words: [],
    avg_caption_length: 300,
    avg_sentence_length: 80,
    emoji_usage: false,
    emoji_frequency: 0,
    hashtag_count_avg: 3,
    hashtag_style: 'moderate',
    question_usage: false,
    cta_style: 'subtle',
    topics_of_interest: ['business', 'technology'],
    best_performing_topics: []
  };
}

function generateFallbackTopics(count) {
  const fallbackTopics = [
    'How to improve productivity in remote work',
    '5 common mistakes in social media marketing',
    'The future of artificial intelligence',
    'Best practices for customer service',
    'Tips for effective team communication',
    'Latest trends in technology',
    'How to build a personal brand',
    'Strategies for business growth',
    'The importance of work-life balance',
    'Innovation in the digital age'
  ];

  return fallbackTopics.slice(0, count).map(topic => ({ topic, type: null }));
}

function calculateAverageScore(posts) {
  if (posts.length === 0) return 0;
  const sum = posts.reduce((acc, post) => acc + (post.quality_score || 0), 0);
  return Math.round(sum / posts.length);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function logGeneration(userId, stats) {
  try {
    await supabase.from('content_generation_log').insert({
      user_id: userId,
      ...stats
    });
  } catch (error) {
    console.error('⚠️  Error logging generation:', error);
  }
}

module.exports = {
  generateContentCalendar,
  generateSinglePost,
  getGeneratedPosts,
  approvePost,
  rejectPost,
  generateTopicIdeas
};
