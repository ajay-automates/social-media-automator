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

    // If focusKeyword is provided, generate topics specifically about that keyword
    let prompt;
    if (options.focusKeyword) {
      console.log(`   🎯 Generating ${count} topics specifically about: "${options.focusKeyword}"`);
      if (options.keywordContext) {
        console.log(`   📝 Using context: ${options.keywordContext.substring(0, 100)}...`);
      }

      prompt = `You are a social media content strategist. Generate exactly ${count} unique social media post ideas that are ALL specifically about: "${options.focusKeyword}"

${options.keywordContext ? `Context/News about this topic:
${options.keywordContext}` : 'Generate posts based on the keyword provided.'}

CRITICAL CONSTRAINTS:
- EVERY SINGLE TOPIC MUST BE DIRECTLY ABOUT "${options.focusKeyword}" - this is non-negotiable
- NO off-topic ideas allowed
- NO generic ideas allowed
- NO ideas about other topics
- Each topic should offer a different angle on "${options.focusKeyword}"
- Include diverse perspectives: news, analysis, tips, debates, trends, history, comparisons, future outlook, expert opinions
- All topics must be suitable for social media (engaging, shareable, relevant)

Examples of good angles for "${options.focusKeyword}":
- Latest news/developments in ${options.focusKeyword}
- Tips and strategies related to ${options.focusKeyword}
- Trends in the ${options.focusKeyword} space
- Common questions about ${options.focusKeyword}
- Controversies or debates about ${options.focusKeyword}
- Success stories in ${options.focusKeyword}
- How to get started with ${options.focusKeyword}
- Predictions or future of ${options.focusKeyword}

Return ONLY a valid JSON array of exactly ${count} topic strings. Nothing else. No explanation, no commentary.
Example format: ["Topic 1 about ${options.focusKeyword}", "Topic 2 about ${options.focusKeyword}", ...]`;
    } else {
      console.log(`   💡 Generating ${count} general topics for niches: ${niches}`);

      prompt = `Generate ${count} unique social media post topic ideas for someone in these niches: ${niches}.

Requirements:
- Mix of educational, promotional, engaging, and trending topics
- Varied and interesting (no repetition)
- Actionable and specific (not vague)
- Good for social media (shareable, engaging)
- Avoid these topics: ${avoidTopics}

Return ONLY a JSON array of topic strings, no additional text:
["Topic 1", "Topic 2", "Topic 3", ...]`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      temperature: 0.9, // High creativity
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text.trim();
    console.log(`   📤 AI Response: ${responseText.substring(0, 150)}...`);

    // Extract JSON array
    const jsonMatch = responseText.match(/\[([\s\S]*)\]/);
    if (!jsonMatch) {
      console.error('❌ Failed to extract JSON from response:', responseText);
      throw new Error('Could not parse topics from AI response');
    }

    let topics;
    try {
      topics = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON array:', jsonMatch[0]);
      throw new Error('Could not parse topics JSON: ' + parseError.message);
    }

    if (!Array.isArray(topics) || topics.length === 0) {
      console.error('❌ AI returned empty or invalid topics array');
      throw new Error('AI returned empty topics array');
    }

    if (options.focusKeyword) {
      console.log(`   ✅ Generated ${topics.length} topics about "${options.focusKeyword}"`);
      topics.forEach((t, i) => console.log(`      ${i + 1}. ${t}`));
    }

    return topics.map(topic => ({ topic, type: null }));

  } catch (error) {
    console.error('❌ Error generating topic ideas:', error.message);

    // If we have a focusKeyword, generate keyword-focused fallback topics
    if (options.focusKeyword) {
      console.log(`   ⚠️  Using fallback topics for "${options.focusKeyword}"`);
      return generateKeywordFallbackTopics(options.focusKeyword, count);
    }

    // Otherwise use default fallback
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
    // 1. Get the generated post
    const { data: agentPost, error: fetchError } = await supabase
      .from('content_agent_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;
    if (!agentPost) throw new Error('Post not found');

    // 2. Update status to approved
    const { error: updateError } = await supabase
      .from('content_agent_posts')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    // 3. Schedule the post by inserting into posts table
    console.log(`📅 Scheduling approved post ${postId} to queue...`);

    const { data: scheduledPost, error: scheduleError } = await supabase
      .from('posts')
      .insert({
        user_id: agentPost.user_id,
        text: agentPost.caption,
        platforms: agentPost.platforms,
        schedule_time: agentPost.scheduled_time,
        status: 'queued'
      })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    console.log(`✅ Post scheduled successfully! Queue ID: ${scheduledPost.id}`);

    return {
      success: true,
      post: agentPost,
      scheduledPost: scheduledPost
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

/**
 * Generate fallback topics when API is unavailable but keyword is provided
 */
function generateKeywordFallbackTopics(keyword, count) {
  const fallbackTemplates = [
    `Latest news about ${keyword}`,
    `Tips and tricks for ${keyword}`,
    `How to get started with ${keyword}`,
    `Best practices in ${keyword}`,
    `Trends in the ${keyword} world`,
    `Common questions about ${keyword}`,
    `Expert insights on ${keyword}`,
    `Success stories in ${keyword}`,
    `Challenges in the ${keyword} industry`,
    `Future outlook for ${keyword}`
  ];

  return fallbackTemplates.slice(0, count).map(topic => ({ topic, type: null }));
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

/**
 * Generate posts from a news article with different content angles
 * @param {string} userId - User ID
 * @param {Object} article - News article data {title, description, url, source}
 * @param {number} count - Number of posts to generate (1-10)
 * @param {boolean} multipleAngles - Generate varied perspectives if true
 * @param {Array} platforms - Target platforms
 * @returns {Promise<Array>} Generated posts
 */
async function generatePostsFromNews(userId, article, count = 1, multipleAngles = false, platforms = ['linkedin', 'twitter']) {
  try {
    const startTime = Date.now();
    console.log(`\n📰 Generating ${count} posts from news article...`);
    console.log(`   Article: "${article.title.substring(0, 60)}..."`);
    console.log(`   Source: ${article.source}`);

    // Get brand voice profile
    let brandVoice = await getBrandVoiceProfile(userId);
    if (!brandVoice) {
      brandVoice = getDefaultBrandVoice();
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const posts = [];

    // Generate posts with different angles
    for (let i = 0; i < count; i++) {
      let angle = 'general commentary';

      if (multipleAngles && count > 1) {
        const angles = [
          'educational explanation of the topic',
          'opinion and perspective on the topic',
          'breaking news announcement style',
          'case study or real-world example',
          'question to engage audience discussion',
          'statistical insight or data point',
          'prediction or future impact',
          'how-to or actionable advice'
        ];
        angle = angles[i % angles.length];
      }

      const prompt = `Based on this news article, create a social media post with a ${angle} style.

Article Title: ${article.title}
Article Description: ${article.description}
Source: ${article.source}
Article URL: ${article.url}

Brand Voice Profile:
- Tone: ${brandVoice.tone || 'professional'}
- Style: ${brandVoice.style || 'informative'}
- Topics: ${(brandVoice.topics_of_interest || []).join(', ') || 'general'}

CRITICAL CONSTRAINTS:
- The post MUST be directly related to the article
- The post MUST include the article URL
- Keep caption concise and engaging
- Generate 5-8 relevant hashtags
- Estimate quality score (0-100) based on relevance and engagement potential
- Estimate engagement prediction (0-100)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "caption": "...",
  "hashtags": ["#tag1", "#tag2"],
  "quality_score": 85,
  "engagement_prediction": 78,
  "content_type": "news_commentary"
}`;

      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 500,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });

        const responseText = message.content[0].text.trim();
        const postData = JSON.parse(responseText);

        // Create post record in database
        const { data: post, error } = await supabase
          .from('content_agent_posts')
          .insert({
            user_id: userId,
            topic: article.title,
            caption: postData.caption,
            hashtags: postData.hashtags,
            platforms: platforms,
            quality_score: postData.quality_score,
            engagement_prediction: postData.engagement_prediction,
            content_type: postData.content_type,
            status: 'draft',
            metadata: {
              source: 'news',
              article_url: article.url,
              article_source: article.source
            }
          })
          .select()
          .single();

        if (error) {
          console.error(`   ❌ Database error saving post ${i + 1}:`, error.message);
        } else {
          posts.push(post);
          console.log(`   ✅ Post ${i + 1}/${count} generated (Quality: ${postData.quality_score})`);
        }

      } catch (parseError) {
        console.error(`   ❌ Error generating post ${i + 1}:`, parseError.message);
        continue;
      }

      // Add small delay between generations to avoid rate limits
      if (i < count - 1) {
        await sleep(500);
      }
    }

    const generationTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Generated ${posts.length}/${count} posts in ${generationTime}s`);

    return {
      success: posts.length > 0,
      posts,
      count: posts.length,
      totalRequested: count,
      generationTime
    };

  } catch (error) {
    console.error('❌ Error generating posts from news:', error);
    return {
      success: false,
      posts: [],
      error: error.message
    };
  }
}

module.exports = {
  generateContentCalendar,
  generateSinglePost,
  getGeneratedPosts,
  approvePost,
  rejectPost,
  generateTopicIdeas,
  generatePostsFromNews
};
