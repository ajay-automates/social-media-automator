/**
 * Brand Voice Analyzer Service
 * Analyzes user's past posts to learn their unique writing style and brand voice
 */

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Analyze user's brand voice from their post history
 * @param {string} userId - User ID
 * @param {number} postLimit - Number of recent posts to analyze (default: 30)
 * @returns {Promise<Object>} Brand voice profile
 */
async function analyzeBrandVoice(userId, postLimit = 30) {
  try {
    console.log(`\n🎨 Analyzing brand voice for user ${userId}...`);

    // 1. Fetch user's recent posts
    const { data: posts, error } = await supabase
      .from('posts')
      .select('text, platforms, created_at')
      .eq('user_id', userId)
      .eq('status', 'posted')
      .order('created_at', { ascending: false })
      .limit(postLimit);

    if (error) throw error;

    if (!posts || posts.length < 5) {
      console.log('⚠️  Not enough posts to analyze brand voice (need at least 5)');
      return {
        success: false,
        message: 'Not enough posts to analyze. Need at least 5 published posts.',
        postsAnalyzed: posts?.length || 0
      };
    }

    console.log(`   📊 Analyzing ${posts.length} posts...`);

    // 2. Basic statistical analysis
    const stats = calculateBasicStats(posts);

    // 3. Use Claude AI to analyze writing style
    const aiAnalysis = await analyzeWithClaude(posts);

    // 4. Combine results
    const brandVoice = {
      ...stats,
      ...aiAnalysis,
      analyzed_post_count: posts.length,
      last_analyzed_at: new Date().toISOString()
    };

    // 5. Save to database
    await saveBrandVoiceProfile(userId, brandVoice);

    console.log(`✅ Brand voice analyzed successfully!`);
    console.log(`   Tone: ${brandVoice.tone}`);
    console.log(`   Formality: ${brandVoice.formality_level}/10`);
    console.log(`   Avg length: ${brandVoice.avg_caption_length} chars`);

    return {
      success: true,
      brandVoice,
      postsAnalyzed: posts.length
    };

  } catch (error) {
    console.error('❌ Error analyzing brand voice:', error);
    throw error;
  }
}

/**
 * Calculate basic statistical metrics from posts
 */
function calculateBasicStats(posts) {
  const captions = posts.map(p => p.text);

  // Average caption length
  const avgLength = Math.round(
    captions.reduce((sum, text) => sum + text.length, 0) / captions.length
  );

  // Average sentence length
  const sentences = captions.join(' ').split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = Math.round(
    sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
  );

  // Emoji usage
  const emojiRegex = /[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu;
  const totalEmojis = captions.join('').match(emojiRegex)?.length || 0;
  const totalChars = captions.join('').length;
  const emojiFrequency = parseFloat((totalEmojis / totalChars * 100).toFixed(2));

  // Hashtag usage
  const hashtags = captions.join(' ').match(/#\w+/g) || [];
  const avgHashtags = Math.round(hashtags.length / captions.length);

  // Question usage
  const questionsCount = captions.filter(text => text.includes('?')).length;
  const questionUsage = questionsCount > captions.length * 0.3;

  return {
    avg_caption_length: avgLength,
    avg_sentence_length: avgSentenceLength,
    emoji_usage: emojiFrequency > 0.5,
    emoji_frequency: emojiFrequency,
    hashtag_count_avg: avgHashtags,
    hashtag_style: avgHashtags < 3 ? 'minimal' : avgHashtags < 8 ? 'moderate' : 'heavy',
    question_usage: questionUsage
  };
}

/**
 * Use Claude AI to analyze writing style and tone
 */
async function analyzeWithClaude(posts) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Sample up to 10 posts for AI analysis
    const samplePosts = posts.slice(0, 10).map(p => p.text).join('\n\n---\n\n');

    const prompt = `Analyze the writing style and brand voice from these social media posts. Return ONLY a JSON object with these exact fields:

{
  "tone": "professional|casual|humorous|inspirational|technical",
  "formality_level": 1-10,
  "common_phrases": ["phrase1", "phrase2", "phrase3"],
  "avoided_words": ["word1", "word2"],
  "cta_style": "direct|subtle|none",
  "topics_of_interest": ["topic1", "topic2", "topic3"],
  "personality_traits": ["trait1", "trait2", "trait3"]
}

Posts to analyze:
${samplePosts}

Return ONLY valid JSON, no additional text.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text.trim();

    // Extract JSON from response (handle cases where Claude adds extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      tone: analysis.tone || 'professional',
      formality_level: analysis.formality_level || 5,
      common_phrases: analysis.common_phrases || [],
      avoided_words: analysis.avoided_words || [],
      cta_style: analysis.cta_style || 'subtle',
      topics_of_interest: analysis.topics_of_interest || [],
      best_performing_topics: analysis.topics_of_interest || [] // Will be enhanced with real analytics later
    };

  } catch (error) {
    console.error('❌ Claude analysis error:', error.message);

    // Fallback to default values if AI fails
    return {
      tone: 'professional',
      formality_level: 5,
      common_phrases: [],
      avoided_words: [],
      cta_style: 'subtle',
      topics_of_interest: [],
      best_performing_topics: []
    };
  }
}

/**
 * Save brand voice profile to database
 */
async function saveBrandVoiceProfile(userId, brandVoice) {
  try {
    const { data, error } = await supabase
      .from('brand_voice_profiles')
      .upsert({
        user_id: userId,
        ...brandVoice,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('❌ Error saving brand voice profile:', error);
    throw error;
  }
}

/**
 * Get user's brand voice profile from database
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Brand voice profile or null
 */
async function getBrandVoiceProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('brand_voice_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching brand voice profile:', error);
    return null;
  }
}

/**
 * Check if brand voice needs re-analysis
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if needs re-analysis
 */
async function needsReanalysis(userId) {
  try {
    const profile = await getBrandVoiceProfile(userId);

    if (!profile) return true;

    // Re-analyze if:
    // 1. Never analyzed (shouldn't happen but safety check)
    if (!profile.last_analyzed_at) return true;

    // 2. Last analyzed > 30 days ago
    const daysSinceAnalysis = (Date.now() - new Date(profile.last_analyzed_at)) / (1000 * 60 * 60 * 24);
    if (daysSinceAnalysis > 30) return true;

    // 3. Less than 20 posts were analyzed (need more data)
    if (profile.analyzed_post_count < 20) return true;

    return false;
  } catch (error) {
    console.error('❌ Error checking re-analysis need:', error);
    return true; // Default to re-analyze on error
  }
}

/**
 * Generate content in user's brand voice
 * @param {string} topic - Topic to write about
 * @param {Object} brandVoice - Brand voice profile
 * @param {string} platform - Target platform
 * @returns {Promise<string>} Generated caption
 */
async function generateInBrandVoice(topic, brandVoice, platform = 'linkedin') {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Build style guide from brand voice
    const styleGuide = `
Writing Style Guidelines:
- Tone: ${brandVoice.tone}
- Formality: ${brandVoice.formality_level}/10 (1=very casual, 10=very formal)
- Common phrases to use: ${brandVoice.common_phrases?.slice(0, 5).join(', ') || 'none'}
- Avoid these words: ${brandVoice.avoided_words?.slice(0, 5).join(', ') || 'none'}
- Average caption length: ~${brandVoice.avg_caption_length} characters
- Average sentence length: ~${brandVoice.avg_sentence_length} characters
- Emoji usage: ${brandVoice.emoji_usage ? 'Yes (use ' + Math.round(brandVoice.emoji_frequency * 10) + ' emojis)' : 'No'}
- Hashtags: ${brandVoice.hashtag_style} style (~${brandVoice.hashtag_count_avg} hashtags)
- Questions: ${brandVoice.question_usage ? 'Often use questions' : 'Rarely use questions'}
- Call-to-action: ${brandVoice.cta_style}
- Topics of interest: ${brandVoice.topics_of_interest?.join(', ') || 'general'}
`.trim();

    const platformGuide = {
      linkedin: 'Professional LinkedIn post (thought leadership)',
      twitter: 'Twitter/X post (punchy, under 280 chars)',
      instagram: 'Instagram caption (engaging, visual)',
      facebook: 'Facebook post (conversational)',
      reddit: 'Reddit post (detailed, helpful)'
    };

    const prompt = `Write a ${platformGuide[platform] || 'social media post'} about "${topic}" using this exact writing style:

${styleGuide}

Important:
- Match the tone and formality precisely
- Use similar phrase structures
- Keep the same emoji/hashtag patterns
- Write as if the original author wrote it
- Return ONLY the caption text, no commentary

Caption:`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text.trim();

  } catch (error) {
    console.error('❌ Error generating in brand voice:', error);
    throw error;
  }
}

module.exports = {
  analyzeBrandVoice,
  getBrandVoiceProfile,
  needsReanalysis,
  generateInBrandVoice,
  saveBrandVoiceProfile
};
