/**
 * Brand Voice Analyzer Service
 * Analyzes user's past posts to learn their unique writing style and brand voice
 * Supports bootstrapping from pasted posts (no need to post through the app first)
 */

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Bootstrap brand voice from manually pasted posts
 * This is the KEY function - lets users seed their voice profile without
 * needing 5+ posts through the app first
 * @param {string} userId - User ID
 * @param {Array<string>} samplePosts - Array of user's best posts (pasted in)
 * @param {Object} identity - Optional identity info {name, role, topics, style_notes}
 * @returns {Promise<Object>} Brand voice profile
 */
async function bootstrapBrandVoice(userId, samplePosts, identity = {}) {
  try {
    console.log(`\n🚀 Bootstrapping brand voice for user ${userId} from ${samplePosts.length} sample posts...`);

    if (!samplePosts || samplePosts.length < 3) {
      return {
        success: false,
        message: 'Need at least 3 sample posts to bootstrap brand voice.',
        postsProvided: samplePosts?.length || 0
      };
    }

    // 1. Save sample posts for few-shot generation later
    await saveSamplePosts(userId, samplePosts);

    // 2. Calculate basic stats from the samples
    const stats = calculateBasicStats(samplePosts.map(text => ({ text })));

    // 3. Use Claude to do deep voice analysis with identity context
    const aiAnalysis = await analyzeWithClaude(
      samplePosts.map(text => ({ text })),
      identity
    );

    // 4. Build the complete brand voice profile
    const brandVoice = {
      ...stats,
      ...aiAnalysis,
      identity_name: identity.name || null,
      identity_role: identity.role || null,
      identity_topics: identity.topics || [],
      identity_style_notes: identity.style_notes || null,
      analyzed_post_count: samplePosts.length,
      bootstrap_source: 'manual_paste',
      last_analyzed_at: new Date().toISOString()
    };

    // 5. Save to database
    await saveBrandVoiceProfile(userId, brandVoice);

    console.log(`✅ Brand voice bootstrapped successfully!`);
    console.log(`   Tone: ${brandVoice.tone}`);
    console.log(`   Personality: ${brandVoice.personality_traits?.join(', ')}`);
    console.log(`   Topics: ${brandVoice.topics_of_interest?.join(', ')}`);

    return {
      success: true,
      brandVoice,
      postsAnalyzed: samplePosts.length,
      samplePostsSaved: samplePosts.length
    };

  } catch (error) {
    console.error('❌ Error bootstrapping brand voice:', error);
    throw error;
  }
}

/**
 * Save sample posts for few-shot learning during generation
 * These are the user's BEST posts that represent their voice
 */
async function saveSamplePosts(userId, posts) {
  try {
    // Store as JSON in a simple key-value approach
    const { error } = await supabase
      .from('brand_voice_profiles')
      .upsert({
        user_id: userId,
        sample_posts: posts.slice(0, 20), // Keep max 20 samples
        sample_posts_updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      // If column doesn't exist yet, that's okay - we'll add it via migration
      console.warn('⚠️  Could not save sample_posts (column may not exist yet):', error.message);
      // Fallback: store in a separate table
      await saveSamplePostsFallback(userId, posts);
    }

    console.log(`   💾 Saved ${posts.length} sample posts for few-shot learning`);
  } catch (error) {
    console.error('❌ Error saving sample posts:', error);
    // Non-fatal - continue with voice analysis even if sample storage fails
    await saveSamplePostsFallback(userId, posts);
  }
}

/**
 * Fallback: store sample posts in a separate table
 */
async function saveSamplePostsFallback(userId, posts) {
  try {
    // Try creating a simple storage via the posts table with a special status
    // Or use a JSON field approach
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        setting_key: 'brand_voice_samples',
        setting_value: JSON.stringify(posts.slice(0, 20))
      }, {
        onConflict: 'user_id,setting_key'
      });

    if (error) {
      console.warn('⚠️  Fallback storage also failed, storing in-memory cache');
      // Last resort: in-memory cache
      if (!global._brandVoiceSamples) global._brandVoiceSamples = {};
      global._brandVoiceSamples[userId] = posts.slice(0, 20);
    }
  } catch (err) {
    console.warn('⚠️  All sample post storage methods failed');
    if (!global._brandVoiceSamples) global._brandVoiceSamples = {};
    global._brandVoiceSamples[userId] = posts.slice(0, 20);
  }
}

/**
 * Get saved sample posts for few-shot generation
 */
async function getSamplePosts(userId) {
  try {
    // Try primary storage
    const { data, error } = await supabase
      .from('brand_voice_profiles')
      .select('sample_posts')
      .eq('user_id', userId)
      .single();

    if (!error && data?.sample_posts) {
      return data.sample_posts;
    }

    // Try fallback storage
    const { data: settings } = await supabase
      .from('user_settings')
      .select('setting_value')
      .eq('user_id', userId)
      .eq('setting_key', 'brand_voice_samples')
      .single();

    if (settings?.setting_value) {
      return JSON.parse(settings.setting_value);
    }

    // Try in-memory cache
    if (global._brandVoiceSamples?.[userId]) {
      return global._brandVoiceSamples[userId];
    }

    return [];
  } catch (error) {
    console.warn('⚠️  Could not retrieve sample posts:', error.message);
    return global._brandVoiceSamples?.[userId] || [];
  }
}

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
        message: 'Not enough posts to analyze. Need at least 5 published posts. Use the bootstrap feature to paste your existing posts instead.',
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
      bootstrap_source: 'post_history',
      last_analyzed_at: new Date().toISOString()
    };

    // 5. Save sample posts (best ones) for few-shot learning
    const bestPosts = posts.slice(0, 10).map(p => p.text);
    await saveSamplePosts(userId, bestPosts);

    // 6. Save to database
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

  // Line break / structure usage
  const avgLineBreaks = Math.round(
    captions.reduce((sum, text) => sum + (text.match(/\n/g) || []).length, 0) / captions.length
  );

  return {
    avg_caption_length: avgLength,
    avg_sentence_length: avgSentenceLength,
    emoji_usage: emojiFrequency > 0.5,
    emoji_frequency: emojiFrequency,
    hashtag_count_avg: avgHashtags,
    hashtag_style: avgHashtags < 3 ? 'minimal' : avgHashtags < 8 ? 'moderate' : 'heavy',
    question_usage: questionUsage,
    avg_line_breaks: avgLineBreaks,
    uses_structure: avgLineBreaks >= 3
  };
}

/**
 * Use Claude AI to analyze writing style and tone
 * Enhanced: extracts richer voice profile including hooks, structure patterns, personality
 */
async function analyzeWithClaude(posts, identity = {}) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Sample up to 10 posts for AI analysis
    const samplePosts = posts.slice(0, 10).map(p => p.text).join('\n\n---POST SEPARATOR---\n\n');

    const identityContext = identity.name || identity.role
      ? `\nContext about this person: ${identity.name ? 'Name: ' + identity.name + '. ' : ''}${identity.role ? 'Role: ' + identity.role + '. ' : ''}${identity.topics?.length ? 'Topics they cover: ' + identity.topics.join(', ') + '. ' : ''}${identity.style_notes ? 'Style notes: ' + identity.style_notes : ''}`
      : '';

    const prompt = `Analyze the writing style and brand voice from these social media posts. Be very specific and detailed - this will be used to generate new posts that sound exactly like this person.${identityContext}

Posts to analyze:
${samplePosts}

Return ONLY a JSON object with these exact fields:
{
  "tone": "one of: professional, casual, humorous, inspirational, technical, bold, conversational",
  "formality_level": 1-10,
  "writing_personality": "2-3 sentence description of how this person writes - their unique voice, what makes their posts recognizable",
  "common_phrases": ["phrase1", "phrase2", "phrase3", "phrase4", "phrase5"],
  "hook_style": "How they typically start posts - describe their opening pattern",
  "structure_pattern": "How they structure posts - short paragraphs? bullet points? numbered lists? single block? line breaks between ideas?",
  "closing_style": "How they end posts - question? CTA? bold statement? hashtags?",
  "avoided_words": ["word1", "word2"],
  "cta_style": "direct|subtle|question|none",
  "topics_of_interest": ["topic1", "topic2", "topic3"],
  "personality_traits": ["trait1", "trait2", "trait3"],
  "unique_characteristics": ["something specific and unique about their writing style", "another unique trait"],
  "emoji_pattern": "none|minimal|moderate|heavy - and which specific emojis they prefer",
  "perspective": "first_person|third_person|we - how they refer to themselves"
}

Return ONLY valid JSON, no additional text.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text.trim();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      tone: analysis.tone || 'professional',
      formality_level: analysis.formality_level || 5,
      writing_personality: analysis.writing_personality || '',
      common_phrases: analysis.common_phrases || [],
      hook_style: analysis.hook_style || '',
      structure_pattern: analysis.structure_pattern || '',
      closing_style: analysis.closing_style || '',
      avoided_words: analysis.avoided_words || [],
      cta_style: analysis.cta_style || 'subtle',
      topics_of_interest: analysis.topics_of_interest || [],
      personality_traits: analysis.personality_traits || [],
      unique_characteristics: analysis.unique_characteristics || [],
      emoji_pattern: analysis.emoji_pattern || 'minimal',
      perspective: analysis.perspective || 'first_person',
      best_performing_topics: analysis.topics_of_interest || []
    };

  } catch (error) {
    console.error('❌ Claude analysis error:', error.message);

    // Fallback to default values if AI fails
    return {
      tone: 'professional',
      formality_level: 5,
      writing_personality: '',
      common_phrases: [],
      hook_style: '',
      structure_pattern: '',
      closing_style: '',
      avoided_words: [],
      cta_style: 'subtle',
      topics_of_interest: [],
      personality_traits: [],
      unique_characteristics: [],
      emoji_pattern: 'minimal',
      perspective: 'first_person',
      best_performing_topics: []
    };
  }
}

/**
 * Save brand voice profile to database
 */
async function saveBrandVoiceProfile(userId, brandVoice) {
  try {
    // Filter to only include fields that exist in the table
    // Store complex objects as JSON strings if needed
    const profileData = {
      user_id: userId,
      tone: brandVoice.tone,
      formality_level: brandVoice.formality_level,
      writing_personality: brandVoice.writing_personality || null,
      common_phrases: brandVoice.common_phrases,
      hook_style: brandVoice.hook_style || null,
      structure_pattern: brandVoice.structure_pattern || null,
      closing_style: brandVoice.closing_style || null,
      avoided_words: brandVoice.avoided_words,
      cta_style: brandVoice.cta_style,
      topics_of_interest: brandVoice.topics_of_interest,
      personality_traits: brandVoice.personality_traits,
      unique_characteristics: brandVoice.unique_characteristics || [],
      emoji_pattern: brandVoice.emoji_pattern || 'minimal',
      perspective: brandVoice.perspective || 'first_person',
      best_performing_topics: brandVoice.best_performing_topics,
      avg_caption_length: brandVoice.avg_caption_length,
      avg_sentence_length: brandVoice.avg_sentence_length,
      emoji_usage: brandVoice.emoji_usage,
      emoji_frequency: brandVoice.emoji_frequency,
      hashtag_count_avg: brandVoice.hashtag_count_avg,
      hashtag_style: brandVoice.hashtag_style,
      question_usage: brandVoice.question_usage,
      analyzed_post_count: brandVoice.analyzed_post_count,
      bootstrap_source: brandVoice.bootstrap_source || null,
      identity_name: brandVoice.identity_name || null,
      identity_role: brandVoice.identity_role || null,
      identity_topics: brandVoice.identity_topics || [],
      identity_style_notes: brandVoice.identity_style_notes || null,
      last_analyzed_at: brandVoice.last_analyzed_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('brand_voice_profiles')
      .upsert(profileData, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      // If we get column errors, try with just the original fields
      console.warn('⚠️  Full profile save failed, trying minimal save:', error.message);
      const minimalData = {
        user_id: userId,
        tone: brandVoice.tone,
        formality_level: brandVoice.formality_level,
        common_phrases: brandVoice.common_phrases,
        avoided_words: brandVoice.avoided_words,
        cta_style: brandVoice.cta_style,
        topics_of_interest: brandVoice.topics_of_interest,
        personality_traits: brandVoice.personality_traits,
        best_performing_topics: brandVoice.best_performing_topics,
        avg_caption_length: brandVoice.avg_caption_length,
        avg_sentence_length: brandVoice.avg_sentence_length,
        emoji_usage: brandVoice.emoji_usage,
        emoji_frequency: brandVoice.emoji_frequency,
        hashtag_count_avg: brandVoice.hashtag_count_avg,
        hashtag_style: brandVoice.hashtag_style,
        question_usage: brandVoice.question_usage,
        analyzed_post_count: brandVoice.analyzed_post_count,
        last_analyzed_at: brandVoice.last_analyzed_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: minData, error: minError } = await supabase
        .from('brand_voice_profiles')
        .upsert(minimalData, { onConflict: 'user_id' })
        .select()
        .single();

      if (minError) throw minError;

      // Store extended fields in-memory for this session
      if (!global._brandVoiceExtended) global._brandVoiceExtended = {};
      global._brandVoiceExtended[userId] = {
        writing_personality: brandVoice.writing_personality,
        hook_style: brandVoice.hook_style,
        structure_pattern: brandVoice.structure_pattern,
        closing_style: brandVoice.closing_style,
        unique_characteristics: brandVoice.unique_characteristics,
        emoji_pattern: brandVoice.emoji_pattern,
        perspective: brandVoice.perspective,
        identity_name: brandVoice.identity_name,
        identity_role: brandVoice.identity_role,
        identity_topics: brandVoice.identity_topics,
        identity_style_notes: brandVoice.identity_style_notes
      };

      return minData;
    }

    return data;
  } catch (error) {
    console.error('❌ Error saving brand voice profile:', error);
    throw error;
  }
}

/**
 * Get user's brand voice profile from database
 * Enhanced: merges extended fields from memory if available
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
        return null;
      }
      throw error;
    }

    // Merge any extended fields stored in-memory
    if (global._brandVoiceExtended?.[userId]) {
      return { ...data, ...global._brandVoiceExtended[userId] };
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching brand voice profile:', error);
    return null;
  }
}

/**
 * Check if brand voice needs re-analysis
 */
async function needsReanalysis(userId) {
  try {
    const profile = await getBrandVoiceProfile(userId);

    if (!profile) return true;
    if (!profile.last_analyzed_at) return true;

    const daysSinceAnalysis = (Date.now() - new Date(profile.last_analyzed_at)) / (1000 * 60 * 60 * 24);
    if (daysSinceAnalysis > 30) return true;
    if (profile.analyzed_post_count < 10) return true;

    return false;
  } catch (error) {
    console.error('❌ Error checking re-analysis need:', error);
    return true;
  }
}

/**
 * Generate content in user's brand voice
 * ENHANCED: Uses few-shot sample posts for much better voice matching
 * @param {string} topic - Topic to write about
 * @param {Object} brandVoice - Brand voice profile
 * @param {string} platform - Target platform
 * @param {string} userId - User ID (for fetching sample posts)
 * @returns {Promise<string>} Generated caption
 */
async function generateInBrandVoice(topic, brandVoice, platform = 'linkedin', userId = null) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Fetch sample posts for few-shot learning
    let samplePostsText = '';
    if (userId) {
      const samples = await getSamplePosts(userId);
      if (samples.length > 0) {
        const selected = samples.slice(0, 5);
        samplePostsText = `
EXAMPLE POSTS BY THIS PERSON (study their voice carefully and match it):
${selected.map((post, i) => `--- Example ${i + 1} ---
${post}`).join('\n\n')}
--- End of examples ---

`;
      }
    }

    // Build rich style guide from brand voice
    const identitySection = brandVoice.identity_name || brandVoice.identity_role
      ? `\nWho this person is: ${brandVoice.identity_name ? brandVoice.identity_name + '. ' : ''}${brandVoice.identity_role ? brandVoice.identity_role + '. ' : ''}${brandVoice.identity_style_notes || ''}\n`
      : '';

    const personalitySection = brandVoice.writing_personality
      ? `\nWriting personality: ${brandVoice.writing_personality}`
      : '';

    const styleGuide = `
Writing Style Guidelines:
- Tone: ${brandVoice.tone}
- Formality: ${brandVoice.formality_level}/10 (1=very casual, 10=very formal)
- Perspective: ${brandVoice.perspective || 'first_person'}${identitySection}${personalitySection}
- Hook style: ${brandVoice.hook_style || 'Start with something attention-grabbing'}
- Structure: ${brandVoice.structure_pattern || 'Use line breaks between ideas'}
- Closing: ${brandVoice.closing_style || 'End with engagement driver'}
- Common phrases to use: ${brandVoice.common_phrases?.slice(0, 5).join(', ') || 'none identified'}
- Avoid these words: ${brandVoice.avoided_words?.slice(0, 5).join(', ') || 'none'}
- Average caption length: ~${brandVoice.avg_caption_length} characters
- Emoji usage: ${brandVoice.emoji_pattern || (brandVoice.emoji_usage ? 'Yes' : 'No')}
- Hashtags: ${brandVoice.hashtag_style} style (~${brandVoice.hashtag_count_avg} hashtags)
- Questions: ${brandVoice.question_usage ? 'Often uses questions' : 'Rarely uses questions'}
- Call-to-action: ${brandVoice.cta_style}
- Topics of interest: ${brandVoice.topics_of_interest?.join(', ') || 'general'}
- Unique traits: ${brandVoice.unique_characteristics?.join('; ') || 'none identified'}
`.trim();

    const platformGuide = {
      linkedin: 'Professional LinkedIn post (thought leadership, 200-500 chars)',
      twitter: 'Twitter/X post (punchy, under 280 chars)',
      reddit: 'Reddit post (detailed, helpful, authentic)'
    };

    const prompt = `${samplePostsText}Write a ${platformGuide[platform] || 'social media post'} about "${topic}" using this EXACT writing style:

${styleGuide}

CRITICAL INSTRUCTIONS:
- Your #1 goal is to sound EXACTLY like the person who wrote the example posts above
- Match their sentence structure, their energy, their word choices
- If they use short punchy sentences, you use short punchy sentences
- If they use emojis, use the same kind of emojis
- If they ask questions, ask questions
- Do NOT sound like generic AI content
- Do NOT use corporate buzzwords unless they do
- Write as if this person sat down and wrote this themselves
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
  bootstrapBrandVoice,
  getBrandVoiceProfile,
  getSamplePosts,
  saveSamplePosts,
  needsReanalysis,
  generateInBrandVoice,
  saveBrandVoiceProfile
};
