const Anthropic = require('@anthropic-ai/sdk');

/**
 * Platform-specific prompt templates
 */
const PLATFORM_PROMPTS = {
  linkedin: (topic, niche) => `Write a professional LinkedIn post about "${topic}" for the ${niche} niche.

Requirements:
- Thought-leadership tone
- 3-5 sentences
- Engaging and valuable to the audience
- Include 2-3 relevant hashtags at the end
- No emojis or casual language
- Focus on insights and actionable takeaways`,

  twitter: (topic, niche) => `Write a Twitter/X post about "${topic}" for the ${niche} niche.

Requirements:
- Casual and punchy tone
- Under 250 characters
- Engaging hook in first line
- Include 2-3 relevant hashtags
- Can use 1-2 emojis if appropriate
- Make it shareable`,

  instagram: (topic, niche) => `Write an Instagram caption about "${topic}" for the ${niche} niche.

Requirements:
- Trendy and engaging tone
- Multiple paragraphs with line breaks
- Use emojis throughout (3-5 emojis)
- Include 10-15 relevant hashtags at the end
- Call-to-action (like, comment, share)
- Relatable and conversational`
};

/**
 * Generate AI caption using Claude (Anthropic) API
 * @param {string} topic - The topic/subject of the post
 * @param {string} niche - The business niche (Restaurant Tools, E-commerce, etc)
 * @param {string} platform - Target platform (linkedin, twitter, instagram)
 * @returns {Promise<Array<string>>} - Array of 3 caption variations
 */
async function generateCaption(topic, niche, platform = 'linkedin') {
  try {
    // Validate inputs
    if (!topic || topic.trim() === '') {
      throw new Error('Topic is required');
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment variables');
    }

    // Normalize platform
    platform = platform.toLowerCase();
    if (!['linkedin', 'twitter', 'instagram'].includes(platform)) {
      platform = 'linkedin';
    }

    // Get platform-specific prompt
    const prompt = PLATFORM_PROMPTS[platform](topic, niche);

    console.log(`\n🤖 Generating ${platform} caption for "${topic}" in ${niche} niche using Claude...`);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Generate 3 variations
    const variations = [];
    
    for (let i = 0; i < 3; i++) {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0.9, // Higher temperature for more creative variations
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nGenerate variation ${i + 1} of 3. Make each variation unique in style and approach. Return ONLY the caption text, no additional commentary.`
          }
        ]
      });

      if (message && message.content && message.content.length > 0) {
        const caption = message.content[0].text.trim();
        variations.push(caption);
        console.log(`   ✅ Generated variation ${i + 1}`);
      }
    }

    if (variations.length === 0) {
      throw new Error('No captions generated from Claude API');
    }

    console.log(`✅ Successfully generated ${variations.length} caption variations\n`);

    return variations;

  } catch (error) {
    console.error('❌ AI generation error:', error.message);
    
    // Provide helpful error messages
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      throw new Error('Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY.');
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.message?.includes('500') || error.message?.includes('overloaded')) {
      throw new Error('Claude API error. Please try again.');
    } else {
      throw new Error(error.message || 'Failed to generate captions');
    }
  }
}

/**
 * Generate captions for multiple platforms at once
 * @param {string} topic - The topic/subject of the post
 * @param {string} niche - The business niche
 * @param {Array<string>} platforms - Array of platforms ['linkedin', 'twitter']
 * @returns {Promise<Object>} - Object with platform as key and variations as value
 */
async function generateMultiPlatformCaptions(topic, niche, platforms = ['linkedin']) {
  const results = {};
  
  for (const platform of platforms) {
    try {
      results[platform] = await generateCaption(topic, niche, platform);
    } catch (error) {
      results[platform] = { error: error.message };
    }
  }
  
  return results;
}

/**
 * Generate AI hashtags for a post
 * @param {string} caption - The caption/content of the post
 * @param {string} platform - Target platform (linkedin, twitter, instagram, etc.)
 * @returns {Promise<Array<string>>} - Array of relevant hashtags
 */
async function generateHashtags(caption, platform = 'instagram') {
  try {
    // Validate inputs
    if (!caption || caption.trim() === '') {
      throw new Error('Caption is required');
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment variables');
    }

    // Normalize platform
    platform = platform.toLowerCase();
    
    // Platform-specific hashtag counts
    const hashtagCounts = {
      'instagram': '15-20',
      'linkedin': '3-5',
      'twitter': '2-4',
      'tiktok': '5-8',
      'default': '10-15'
    };
    
    const count = hashtagCounts[platform] || hashtagCounts['default'];

    console.log(`\n🏷️  Generating ${count} hashtags for ${platform}...`);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Generate ${count} relevant hashtags for this ${platform} post:

"${caption}"

Requirements:
- Return ONLY hashtags, one per line
- No explanations, no numbering, no extra text
- Include the # symbol
- Mix popular and niche hashtags
- Make them trending and ${platform}-appropriate
- Focus on relevance to the content
${platform === 'linkedin' ? '- Use professional, industry-related hashtags' : ''}
${platform === 'instagram' ? '- Mix broad reach and specific niche hashtags' : ''}
${platform === 'twitter' ? '- Keep them concise and trending' : ''}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract hashtags from response
    const text = message.content[0].text;
    const hashtags = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('#'))
      .map(tag => tag.replace(/[^\w#]/g, '')); // Clean up any extra characters

    console.log(`✅ Generated ${hashtags.length} hashtags for ${platform}`);
    
    return hashtags;

  } catch (error) {
    console.error('❌ AI Hashtag Generation Error:', error.message);
    throw error;
  }
}

/**
 * Get AI recommendations for best time to post
 * @param {string} platform - Target platform
 * @param {object} userHistory - User's historical best times data
 * @returns {Promise<Array>} Array of recommended times
 */
async function recommendPostTime(platform, userHistory = {}) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log(`\n⏰ Getting posting time recommendations for ${platform}...`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = new Date().toLocaleDateString();
    
    const historyContext = userHistory.hasEnoughData 
      ? `The user's best performing times based on their history:
${userHistory.topSlots?.map(slot => `- ${slot.day} at ${slot.time} (${slot.successRate}% success rate, ${slot.totalPosts} posts)`).join('\n')}`
      : 'User has limited posting history. Rely on general best practices.';

    const prompt = `You are a social media expert. Recommend the best 3 times to post on ${platform} this week.

Current context:
- Today is ${currentDay}, ${currentDate}
- Platform: ${platform}

${historyContext}

Provide 3 specific recommendations for THIS WEEK with exact days and times.

Return ONLY a JSON array with this exact format (no markdown, no code blocks, just the JSON):
[
  {
    "day": "Monday",
    "time": "9:00 AM",
    "reason": "Peak professional engagement time"
  }
]

Make recommendations practical and actionable for the upcoming week.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse the response
    const text = message.content[0].text.trim();
    
    // Try to extract JSON from response
    let recommendations;
    try {
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      recommendations = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI recommendations');
    }

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      throw new Error('Invalid recommendations format');
    }

    console.log(`✅ Generated ${recommendations.length} time recommendations for ${platform}`);
    
    return recommendations.slice(0, 3); // Ensure max 3

  } catch (error) {
    console.error('❌ AI Time Recommendation Error:', error.message);
    throw error;
  }
}

/**
 * Generate platform-specific post variations
 * Takes a base caption and creates optimized versions for each platform
 * @param {string} baseCaption - The original caption
 * @param {Array<string>} platforms - Array of platforms (e.g., ['linkedin', 'twitter', 'instagram'])
 * @returns {Promise<Object>} - Object with platform-specific variations { linkedin: "...", twitter: "...", instagram: "..." }
 */
async function generatePostVariations(baseCaption, platforms) {
  try {
    if (!baseCaption || baseCaption.trim() === '') {
      throw new Error('Base caption is required');
    }

    if (!platforms || platforms.length === 0) {
      throw new Error('At least one platform is required');
    }

    console.log(`🎨 Generating post variations for ${platforms.length} platforms...`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Platform-specific instructions
    const platformInstructions = {
      linkedin: `
LINKEDIN VERSION:
- Professional, thought-leadership tone
- 2-4 paragraphs with clear structure
- 200-500 words (can be longer for valuable content)
- Include insights, data, or lessons learned
- End with an engaging question to spark discussion
- 3-5 professional hashtags (e.g., #BusinessStrategy, #Leadership)
- NO emojis (or max 1-2 very subtle ones)
- Format with line breaks for readability`,

      twitter: `
TWITTER VERSION:
- Casual, punchy, conversational tone
- MUST be under 280 characters total (including hashtags)
- Start with a HOOK (surprising fact, question, or bold statement)
- Use line breaks for emphasis (max 3-4 lines)
- 1-2 emojis maximum
- 2-3 hashtags
- Make it shareable and quotable`,

      instagram: `
INSTAGRAM VERSION:
- Story-driven, emotional, relatable tone
- 3-5 short paragraphs with emojis throughout
- Use emojis to break up text (5-10 emojis total)
- Personal and conversational (like talking to a friend)
- Include call-to-action (e.g., "Double tap if you agree!", "Tag a friend!")
- 8-12 trending hashtags at the end
- Make it visually appealing with line breaks`,

      facebook: `
FACEBOOK VERSION:
- Friendly, community-focused tone
- 2-3 paragraphs, conversational
- 100-300 words
- Encourage comments and discussion
- 2-3 emojis
- 2-4 hashtags
- Ask questions to drive engagement`,

      reddit: `
REDDIT VERSION:
- Authentic, helpful, no-BS tone
- Detailed and informative (300-500 words)
- NO emojis, NO hashtags, NO sales-y language
- Provide value first, link/CTA last
- Use bullet points or numbered lists
- Sound like a real person sharing knowledge`,

      tiktok: `
TIKTOK VERSION:
- Fun, energetic, Gen-Z friendly tone
- Short and snappy (100-150 words)
- Lots of emojis (8-15)
- Trending phrases and hashtags
- Call-to-action for engagement
- Use line breaks for emphasis`,

      youtube: `
YOUTUBE VERSION:
- Engaging, informative tone
- 2-3 paragraphs explaining the video
- Include timestamps if relevant
- Call-to-action (like, subscribe, comment)
- 3-5 hashtags
- Professional but friendly`
    };

    // Filter to only platforms we have instructions for
    const supportedPlatforms = platforms.filter(p => platformInstructions[p]);
    
    if (supportedPlatforms.length === 0) {
      // Return original caption for all platforms if none are supported
      const variations = {};
      platforms.forEach(p => variations[p] = baseCaption);
      return variations;
    }

    // Build the prompt for Claude
    const platformsList = supportedPlatforms.map(p => {
      return `${p.toUpperCase()}:\n${platformInstructions[p]}`;
    }).join('\n\n---\n\n');

    const prompt = `You are a social media expert who adapts content for different platforms.

ORIGINAL POST:
"""
${baseCaption}
"""

TASK: Transform this post into optimized versions for the following platforms. Each version should be COMPLETELY REWRITTEN to match that platform's audience and best practices, while keeping the core message.

${platformsList}

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code blocks, just raw JSON):
{
  ${supportedPlatforms.map(p => `"${p}": "...optimized version..."`).join(',\n  ')}
}

IMPORTANT RULES:
1. Each version should be UNIQUE and optimized for that specific platform
2. Maintain the core message but adapt tone, length, and style dramatically
3. Include appropriate hashtags for each platform
4. Use emojis according to platform norms (none for LinkedIn/Reddit, lots for Instagram/TikTok)
5. Ensure Twitter version is under 280 characters total
6. Make each version feel native to that platform
7. Return ONLY valid JSON, nothing else`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse the response
    const text = message.content[0].text.trim();
    
    let variations;
    try {
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      variations = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI variations:', text);
      throw new Error('Failed to parse AI variations');
    }

    // Validate we got variations for all requested platforms
    supportedPlatforms.forEach(platform => {
      if (!variations[platform]) {
        variations[platform] = baseCaption; // Fallback to original
      }
    });

    // For unsupported platforms, use original caption
    platforms.forEach(platform => {
      if (!variations[platform]) {
        variations[platform] = baseCaption;
      }
    });

    console.log(`✅ Generated ${Object.keys(variations).length} platform variations`);
    
    return variations;

  } catch (error) {
    console.error('❌ AI Variations Error:', error.message);
    throw error;
  }
}

module.exports = {
  generateCaption,
  generateMultiPlatformCaptions,
  generateHashtags,
  recommendPostTime,
  generatePostVariations
};
