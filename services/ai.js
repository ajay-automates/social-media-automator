const axios = require('axios');

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
 * Generate AI caption using Claude API
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

    console.log(`\n🤖 Generating ${platform} caption for "${topic}" in ${niche} niche...`);

    // Call Claude API - Generate 3 variations
    const variations = [];
    
    for (let i = 0; i < 3; i++) {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\nGenerate variation ${i + 1} of 3. Make each variation unique in style and approach.`
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      if (response.data && response.data.content && response.data.content[0]) {
        const caption = response.data.content[0].text.trim();
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
    console.error('❌ AI generation error:', error.response?.data || error.message);
    
    // Provide helpful error messages
    if (error.response?.status === 401) {
      throw new Error('Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.response?.status === 500) {
      throw new Error('Anthropic API error. Please try again.');
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

module.exports = {
  generateCaption,
  generateMultiPlatformCaptions
};

