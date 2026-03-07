/**
 * Content Creation Agent Service
 * AI-powered autonomous content generation
 * Generates 30-day content calendars, monitors trends, learns brand voice
 * ENHANCED: Uses few-shot sample posts for authentic voice matching
 */

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const { analyzeBrandVoice, getBrandVoiceProfile, needsReanalysis, generateInBrandVoice, getSamplePosts } = require('./brand-voice-analyzer');
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
  educational: 40,
  promotional: 30,
  engaging: 20,
  trending: 10
};

/**
 * Generate a complete content calendar
 */
async function generateContentCalendar(userId, days = 30, options = {}) {
  const startTime = Date.now();

  try {
    console.log(`\n\u{1F916} CONTENT CREATION AGENT STARTING...`);
    console.log(`   User: ${userId}`);
    console.log(`   Days: ${days}`);
    console.log(`   ` + '='.repeat(50));

    // 1. Analyze brand voice (if needed)
    console.log('\n\u{1F4CA} STEP 1: Analyzing Brand Voice...');
    let brandVoice = await getBrandVoiceProfile(userId);

    if (!brandVoice || await needsReanalysis(userId)) {
      console.log('   \u{1F504} Running brand voice analysis...');
      const analysisResult = await analyzeBrandVoice(userId);

      if (!analysisResult.success) {
        console.log('   \u26A0\uFE0F  Not enough posts for brand voice analysis');
        brandVoice = getDefaultBrandVoice();
      } else {
        brandVoice = analysisResult.brandVoice;
      }
    } else {
      console.log('   \u2705 Using existing brand voice profile');
    }

    // 2. Monitor trends
    console.log('\n\u{1F525} STEP 2: Monitoring Trends...');
    const userNiches = brandVoice.topics_of_interest || options.niches || ['business', 'technology'];
    const trendingTopics = await monitorTrendsForUser(userId, userNiches);

    console.log(`   \u2705 Found ${trendingTopics.alertsCreated || 0} relevant trending topics`);

    // 3. Generate topic ideas
    console.log('\n\u{1F4A1} STEP 3: Generating Topic Ideas...');
    const topics = await generateTopicIdeas(userId, brandVoice, days, options);

    console.log(`   \u2705 Generated ${topics.length} topic ideas`);

    // 4. Calculate content mix
    const contentMix = options.contentMix || CONTENT_MIX;
    const typedTopics = assignContentTypes(topics, contentMix);

    // 5. Generate posts for each topic
    console.log('\n\u270D\uFE0F  STEP 4: Generating Posts...');
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
        console.error(`   \u274C Failed to generate post: ${error.message}`);
      }

      if (i < typedTopics.length - 1) {
        await sleep(2000);
      }
    }

    console.log(`\n   \u2705 Generated ${successCount}/${typedTopics.length} posts successfully`);

    // 6. Schedule posts across the calendar
    console.log('\n\u{1F4C5} STEP 5: Scheduling Posts...');
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
      ai_tokens_used: posts.length * 500
    });

    console.log(`\n` + '='.repeat(50));
    console.log(`\u2705 CONTENT CREATION AGENT COMPLETE`);
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
    console.error('\u274C Error generating content calendar:', error);

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

    let prompt;
    if (options.focusKeyword) {
      console.log(`   \u{1F3AF} Generating ${count} topics specifically about: "${options.focusKeyword}"`);
      if (options.keywordContext) {
        console.log(`   \u{1F4DD} Using context: ${options.keywordContext.substring(0, 100)}...`);
      }

      prompt = `You are a social media content strategist. Generate exactly ${count} unique social media post ideas that are ALL specifically about: "${options.focusKeyword}"

${options.keywordContext ? `Context/News about this topic:\n${options.keywordContext}` : 'Generate posts based on the keyword provided.'}

CRITICAL CONSTRAINTS:
- EVERY SINGLE TOPIC MUST BE DIRECTLY ABOUT "${options.focusKeyword}" - this is non-negotiable
- NO off-topic ideas allowed
- Each topic should offer a different angle on "${options.focusKeyword}"
- Include diverse perspectives: news, analysis, tips, debates, trends

Return ONLY a valid JSON array of exactly ${count} topic strings.\n["Topic 1", "Topic 2", ...]`;
    } else {
      console.log(`   \u{1F4A1} Generating ${count} general topics for niches: ${niches}`);

      prompt = `Generate ${count} unique social media post topic ideas for someone in these niches: ${niches}.\n\nRequirements:\n- Mix of educational, promotional, engaging, and trending topics\n- Varied and interesting (no repetition)\n- Actionable and specific (not vague)\n- Good for social media (shareable, engaging)\n- Avoid these topics: ${avoidTopics}\n\nReturn ONLY a JSON array of topic strings:\n["Topic 1", "Topic 2", "Topic 3", ...]`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text.trim();
    const jsonMatch = responseText.match(/\[([\s\S]*)\]/);
    if (!jsonMatch) throw new Error('Could not parse topics from AI response');

    let topics = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(topics) || topics.length === 0) throw new Error('AI returned empty topics array');

    return topics.map(topic => ({ topic, type: null }));

  } catch (error) {
    console.error('\u274C Error generating topic ideas:', error.message);
    if (options.focusKeyword) return generateKeywordFallbackTopics(options.focusKeyword, count);
    return generateFallbackTopics(count);
  }
}

function assignContentTypes(topics, contentMix) {
  const types = [];
  const total = topics.length;
  const educational = Math.round(total * contentMix.educational / 100);
  const promotional = Math.round(total * contentMix.promotional / 100);
  const engaging = Math.round(total * contentMix.engaging / 100);
  const trending = total - educational - promotional - engaging;

  types.push(...Array(educational).fill('educational'));
  types.push(...Array(promotional).fill('promotional'));
  types.push(...Array(engaging).fill('engaging'));
  types.push(...Array(trending).fill('trending'));

  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  return topics.map((topic, index) => ({ ...topic, type: types[index] || 'educational' }));
}

/**
 * Generate a single post with caption, hashtags, and quality score
 * ENHANCED: Passes userId for few-shot sample post retrieval
 */
async function generateSinglePost(userId, topic, brandVoice, platforms) {
  try {
    const primaryPlatform = platforms[0] || 'linkedin';
    // Pass userId so generateInBrandVoice can fetch sample posts
    const caption = await generateInBrandVoice(topic.topic, brandVoice, primaryPlatform, userId);

    let hashtags = [];
    try {
      hashtags = await generateHashtags(caption, primaryPlatform);
    } catch (error) {
      console.log('      \u26A0\uFE0F  Hashtag generation failed, skipping');
    }

    const qualityScore = calculateQualityScore(caption, topic.type);
    const engagementPrediction = calculateEngagementPrediction(caption, qualityScore, brandVoice);

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
    console.error('\u274C Error generating single post:', error);
    throw error;
  }
}

function calculateQualityScore(caption, contentType) {
  let score = 50;
  const length = caption.length;
  if (length >= 100 && length <= 500) score += 15;
  else if (length < 50) score -= 10;
  else if (length > 1000) score -= 5;

  const firstSentence = caption.split(/[.!?]/)[0];
  if (firstSentence.length < 100 && (firstSentence.includes('?') || /\d/.test(firstSentence))) score += 10;

  const ctas = ['comment', 'share', 'follow', 'check out', 'learn more', 'what do you think', 'let me know'];
  if (ctas.some(cta => caption.toLowerCase().includes(cta))) score += 10;

  const lineBreaks = (caption.match(/\n/g) || []).length;
  if (lineBreaks >= 2) score += 10;

  const promotional = ['buy', 'purchase', 'sale', 'discount', 'limited time'];
  const promoCount = promotional.filter(word => caption.toLowerCase().includes(word)).length;
  if (contentType === 'promotional') { if (promoCount === 1) score += 5; }
  else { if (promoCount === 0) score += 5; }

  return Math.min(100, Math.max(0, score));
}

function calculateEngagementPrediction(caption, qualityScore, brandVoice) {
  let prediction = qualityScore * 0.7;
  if (caption.includes('?')) prediction += 5;
  if (brandVoice.emoji_usage && /[\p{Emoji}]/u.test(caption)) prediction += 5;
  if (caption.split('\n').length >= 3) prediction += 5;
  const length = caption.length;
  if (length >= 250 && length <= 500) prediction += 10;
  return Math.min(100, Math.max(0, Math.round(prediction)));
}

async function schedulePostsAcrossCalendar(userId, posts, days, options = {}) {
  try {
    const postsPerDay = Math.ceil(posts.length / days);
    const scheduledPosts = [];
    const { analyzeBestTimes } = require('./analytics');
    let bestTimes = [];

    try {
      const timesAnalysis = await analyzeBestTimes(userId);
      if (timesAnalysis.hasEnoughData) {
        bestTimes = timesAnalysis.topSlots.map(slot => ({ dayOfWeek: slot.dayOfWeek, hour: slot.hour }));
      }
    } catch (error) {
      console.log('      \u26A0\uFE0F  Could not fetch best times, using defaults');
    }

    if (bestTimes.length === 0) {
      bestTimes = [
        { dayOfWeek: 1, hour: 9 },
        { dayOfWeek: 2, hour: 14 },
        { dayOfWeek: 3, hour: 10 },
        { dayOfWeek: 4, hour: 15 },
        { dayOfWeek: 5, hour: 11 }
      ];
    }

    const startDate = new Date();
    let postIndex = 0;

    for (let day = 0; day < days && postIndex < posts.length; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);
      const dayOfWeek = currentDate.getDay();
      const timeSlot = bestTimes.find(t => t.dayOfWeek === dayOfWeek) || bestTimes[0];
      currentDate.setHours(timeSlot.hour, 0, 0, 0);

      const postsThisDay = Math.min(postsPerDay, posts.length - postIndex);
      for (let i = 0; i < postsThisDay; i++) {
        const post = posts[postIndex];
        const { data, error } = await supabase
          .from('content_agent_posts')
          .update({
            scheduled_time: currentDate.toISOString(),
            status: options.autoApprove ? 'approved' : 'pending'
          })
          .eq('id', post.id)
          .select()
          .single();

        if (!error) scheduledPosts.push(data);
        postIndex++;
        currentDate.setHours(currentDate.getHours() + 4);
      }
    }

    return scheduledPosts;
  } catch (error) {
    console.error('\u274C Error scheduling posts:', error);
    return posts;
  }
}

async function getGeneratedPosts(userId, status = null, limit = 50) {
  try {
    let query = supabase
      .from('content_agent_posts')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_time', { ascending: true })
      .limit(limit);

    if (status) query = query.eq('status', status);
    const { data, error } = query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('\u274C Error fetching generated posts:', error);
    return [];
  }
}

async function approvePost(postId, approvedBy) {
  try {
    const { data: agentPost, error: fetchError } = await supabase
      .from('content_agent_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;
    if (!agentPost) throw new Error('Post not found');

    const { error: updateError } = await supabase
      .from('content_agent_posts')
      .update({ status: 'approved', approved_by: approvedBy, approved_at: new Date().toISOString() })
      .eq('id', postId);

    if (updateError) throw updateError;

    const { data: scheduledPost, error: scheduleError } = await supabase
      .from('posts')
      .insert({ user_id: agentPost.user_id, text: agentPost.caption, platforms: agentPost.platforms, schedule_time: agentPost.scheduled_time, status: 'queued' })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    return { success: true, post: agentPost, scheduledPost };
  } catch (error) {
    console.error('\u274C Error approving post:', error);
    throw error;
  }
}

async function rejectPost(postId) {
  try {
    const { data, error } = await supabase
      .from('content_agent_posts')
      .update({ status: 'rejected' })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, post: data };
  } catch (error) {
    console.error('\u274C Error rejecting post:', error);
    throw error;
  }
}

function getDefaultBrandVoice() {
  return {
    tone: 'professional',
    formality_level: 6,
    writing_personality: '',
    common_phrases: [],
    hook_style: '',
    structure_pattern: '',
    closing_style: '',
    avoided_words: [],
    avg_caption_length: 300,
    avg_sentence_length: 80,
    emoji_usage: false,
    emoji_frequency: 0,
    emoji_pattern: 'minimal',
    hashtag_count_avg: 3,
    hashtag_style: 'moderate',
    question_usage: false,
    cta_style: 'subtle',
    perspective: 'first_person',
    topics_of_interest: ['business', 'technology'],
    personality_traits: [],
    unique_characteristics: [],
    best_performing_topics: []
  };
}

function generateKeywordFallbackTopics(keyword, count) {
  const templates = [
    `Latest news about ${keyword}`, `Tips and tricks for ${keyword}`,
    `How to get started with ${keyword}`, `Best practices in ${keyword}`,
    `Trends in the ${keyword} world`, `Common questions about ${keyword}`,
    `Expert insights on ${keyword}`, `Success stories in ${keyword}`,
    `Challenges in the ${keyword} industry`, `Future outlook for ${keyword}`
  ];
  return templates.slice(0, count).map(topic => ({ topic, type: null }));
}

function generateFallbackTopics(count) {
  const topics = [
    'How to improve productivity in remote work', '5 common mistakes in social media marketing',
    'The future of artificial intelligence', 'Best practices for customer service',
    'Tips for effective team communication', 'Latest trends in technology',
    'How to build a personal brand', 'Strategies for business growth',
    'The importance of work-life balance', 'Innovation in the digital age'
  ];
  return topics.slice(0, count).map(topic => ({ topic, type: null }));
}

function calculateAverageScore(posts) {
  if (posts.length === 0) return 0;
  return Math.round(posts.reduce((acc, post) => acc + (post.quality_score || 0), 0) / posts.length);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function logGeneration(userId, stats) {
  try { await supabase.from('content_generation_log').insert({ user_id: userId, ...stats }); }
  catch (error) { console.error('\u26A0\uFE0F  Error logging generation:', error); }
}

/**
 * Generate posts from a news article with brand voice + few-shot examples
 * ENHANCED: Now fetches sample posts and builds rich voice context
 */
async function generatePostsFromNews(userId, article, count = 1, multipleAngles = false, platforms = ['linkedin', 'twitter']) {
  try {
    const startTime = Date.now();
    console.log(`\n\u{1F4F0} Generating ${count} posts from news article...`);
    console.log(`   Article: "${article.title.substring(0, 60)}..."`);
    console.log(`   Source: ${article.source}`);

    // Get brand voice profile
    let brandVoice = await getBrandVoiceProfile(userId);
    if (!brandVoice) {
      brandVoice = getDefaultBrandVoice();
    }

    // ENHANCED: Get sample posts for few-shot voice matching
    const samplePosts = await getSamplePosts(userId);
    let samplePostsSection = '';
    if (samplePosts.length > 0) {
      const selected = samplePosts.slice(0, 3);
      samplePostsSection = `\nHERE ARE REAL POSTS BY THIS PERSON - study their voice and match it EXACTLY:\n${selected.map((post, i) => `--- Example ${i + 1} ---\n${post}`).join('\n\n')}\n--- End of examples ---\n`;
      console.log(`   \u{1F3A4} Using ${selected.length} sample posts for voice matching`);
    }

    // Build rich identity context
    const identityContext = brandVoice.identity_name || brandVoice.identity_role
      ? `\nWho is writing: ${brandVoice.identity_name || 'Unknown'}${brandVoice.identity_role ? ' - ' + brandVoice.identity_role : ''}${brandVoice.identity_style_notes ? '\nStyle notes: ' + brandVoice.identity_style_notes : ''}`
      : '';

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const posts = [];

    for (let i = 0; i < count; i++) {
      let angle = 'personal commentary and insight';

      if (multipleAngles && count > 1) {
        const angles = [
          'personal take with an insight from experience',
          'opinion piece with a bold or contrarian perspective',
          'breaking it down simply for the audience',
          'connecting it to a broader trend or pattern',
          'asking a provocative question to spark discussion',
          'sharing a prediction about what this means',
          'practical takeaway or action item',
          'hot take that shows personality'
        ];
        angle = angles[i % angles.length];
      }

      const prompt = `${samplePostsSection}${identityContext}

Based on this news article, write a social media post in this person's EXACT voice and style.

Article Title: ${article.title}
Article Description: ${article.description}
Source: ${article.source}
Article URL: ${article.url}

Voice Profile:
- Tone: ${brandVoice.tone || 'professional'}
- Personality: ${brandVoice.writing_personality || 'informative and authentic'}
- Hook style: ${brandVoice.hook_style || 'attention-grabbing opener'}
- Structure: ${brandVoice.structure_pattern || 'line breaks between ideas'}
- Closing: ${brandVoice.closing_style || 'engagement driver'}
- Perspective: ${brandVoice.perspective || 'first_person'}
- Emoji pattern: ${brandVoice.emoji_pattern || 'minimal'}
- Common phrases: ${(brandVoice.common_phrases || []).slice(0, 5).join(', ') || 'none identified'}
- Unique traits: ${(brandVoice.unique_characteristics || []).join('; ') || 'none identified'}
- Topics: ${(brandVoice.topics_of_interest || []).join(', ') || 'general'}

Angle for this post: ${angle}

CRITICAL RULES:
- Sound EXACTLY like the person who wrote the example posts above
- DO NOT sound like generic AI content or corporate marketing
- Add YOUR OWN perspective/insight, don't just summarize the article
- Include the article URL naturally
- Match the person's emoji usage, sentence structure, and energy
- The post should feel like this person genuinely reacting to this news
- 5-8 relevant hashtags

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
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          temperature: 0.85,
          messages: [{ role: 'user', content: prompt }]
        });

        let responseText = message.content[0].text.trim();
        if (responseText.startsWith('```json')) {
          responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (responseText.startsWith('```')) {
          responseText = responseText.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        const postData = JSON.parse(responseText);

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
            status: 'pending',
            created_by: 'news-agent'
          })
          .select()
          .single();

        if (error) {
          console.error(`   \u274C Database error saving post ${i + 1}:`, error.message);
        } else {
          posts.push(post);
          console.log(`   \u2705 Post ${i + 1}/${count} generated (Quality: ${postData.quality_score})`);
        }

      } catch (parseError) {
        console.error(`   \u274C Error generating post ${i + 1}:`, parseError.message);
        continue;
      }

      if (i < count - 1) await sleep(500);
    }

    const generationTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n\u2705 Generated ${posts.length}/${count} posts in ${generationTime}s`);

    return {
      success: posts.length > 0,
      posts,
      count: posts.length,
      totalRequested: count,
      generationTime
    };

  } catch (error) {
    console.error('\u274C Error generating posts from news:', error);
    return { success: false, posts: [], error: error.message };
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
