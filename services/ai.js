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

    // Use AI wrapper with cost tracking
    const { makeAICall } = require('./ai-wrapper');

    // Generate 3 variations
    const variations = [];
    
    for (let i = 0; i < 3; i++) {
      const message = await makeAICall({
        model: 'claude-3-5-haiku-20241022', // Use cheapest model
        max_tokens: 1024,
        temperature: 0.9, // Higher temperature for more creative variations
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nGenerate variation ${i + 1} of 3. Make each variation unique in style and approach. Return ONLY the caption text, no additional commentary.`
          }
        ],
        taskType: 'creative',
        feature: 'caption_generation'
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

/**
 * Generate content ideas for a given topic and platform
 * @param {string} topic - The topic to generate ideas about
 * @param {string} platform - Target platform (linkedin, twitter, instagram, etc.)
 * @param {number} count - Number of ideas to generate (default 20)
 * @returns {Promise<Array>} - Array of content idea objects
 */
async function generateContentIdeas(topic, platform = 'linkedin', count = 20) {
  try {
    if (!topic || topic.trim() === '') {
      throw new Error('Topic is required');
    }

    if (count < 5 || count > 50) {
      count = 20; // Default to 20 if invalid
    }

    console.log(`💡 Generating ${count} content ideas about "${topic}" for ${platform}...`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Platform-specific content strategies
    const platformStrategies = {
      linkedin: {
        focus: 'Thought leadership, professional insights, data-driven content, career advice, industry trends',
        types: 'Case studies, polls, lessons learned, data analysis, industry commentary, how-to guides, personal stories with business lessons',
        tone: 'Professional but approachable, authoritative, insightful',
        examples: 'Share 3 lessons from [experience], Poll: What\'s your biggest [challenge], Case study: How we [achieved result]'
      },
      twitter: {
        focus: 'Quick tips, hot takes, news commentary, viral threads, controversial opinions',
        types: 'Thread starters, hot takes, quick tips, polls, quote tweets, controversial statements',
        tone: 'Casual, punchy, conversational, witty',
        examples: 'Unpopular opinion: [hot take], Here\'s why [controversial statement], Thread: 10 things about [topic]'
      },
      instagram: {
        focus: 'Visual storytelling, behind-the-scenes, inspirational content, personal journeys',
        types: 'Carousel post ideas, reel concepts, before/after stories, day-in-the-life, transformation stories',
        tone: 'Personal, relatable, emotional, inspiring',
        examples: 'Behind the scenes of [process], Before/after: [transformation], Story time: When I [experience]'
      },
      facebook: {
        focus: 'Community engagement, events, questions, local content, group discussions',
        types: 'Community questions, event announcements, polls, local stories, user stories',
        tone: 'Friendly, community-focused, conversational',
        examples: 'Question for the community: [question], Share your [experience], Poll: [options]'
      },
      reddit: {
        focus: 'Detailed guides, AMAs, authentic discussions, problem-solving, niche expertise',
        types: 'Detailed guides, ask-me-anything, discussion starters, tutorials, resource compilations',
        tone: 'Authentic, helpful, no-BS, expertise-driven',
        examples: 'Complete guide to [topic], AMA: I\'ve been doing [thing] for [time], Here\'s what nobody tells you about [topic]'
      },
      tiktok: {
        focus: 'Entertainment, trends, quick tutorials, challenges, relatable humor',
        types: 'Trend participation, quick tips, challenges, day-in-life, funny takes',
        tone: 'Fun, energetic, Gen-Z friendly, trendy',
        examples: 'POV: When [relatable situation], Quick hack for [problem], This trend but make it [topic]'
      },
      youtube: {
        focus: 'In-depth tutorials, reviews, vlogs, educational content, entertainment',
        types: 'Tutorial videos, reviews, vlogs, interviews, documentaries, commentary',
        tone: 'Engaging, informative, personality-driven',
        examples: 'How to [achieve result] in [timeframe], I tried [thing] for [duration], Everything wrong with [topic]'
      }
    };

    const strategy = platformStrategies[platform] || platformStrategies.linkedin;

    const prompt = `You are a viral content strategist specializing in ${platform.toUpperCase()}.

TASK: Generate ${count} SPECIFIC, ACTIONABLE content ideas about "${topic}" for ${platform}.

PLATFORM STRATEGY:
- Focus: ${strategy.focus}
- Content Types: ${strategy.types}
- Tone: ${strategy.tone}
- Examples: ${strategy.examples}

REQUIREMENTS FOR EACH IDEA:
1. Be SPECIFIC, not generic (e.g., "Share 3 specific automation tools" not just "Talk about automation")
2. Include a clear hook/angle that drives engagement
3. Vary the content types (mix of ${strategy.types})
4. Make them immediately actionable (user can start writing right away)
5. Include numbers, specifics, or unique angles
6. Each should feel fresh and different from the others

RETURN FORMAT - Respond with ONLY a JSON array, no markdown, no code blocks:
[
  {
    "title": "Specific, actionable idea description",
    "type": "case-study|poll|tips|story|data|question|tutorial|thread",
    "hook": "The engaging angle or hook",
    "engagement_potential": "high|medium|low"
  }
]

IMPORTANT: 
- Make ideas SPECIFIC to "${topic}"
- Each idea should be unique and non-repetitive
- High engagement potential = questions, polls, controversial, data-driven
- Return ONLY valid JSON array with ${count} ideas`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.8, // Higher creativity for diverse ideas
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse the response
    const text = message.content[0].text.trim();
    
    let ideas;
    try {
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      ideas = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI ideas:', text);
      throw new Error('Failed to parse AI ideas');
    }

    if (!Array.isArray(ideas) || ideas.length === 0) {
      throw new Error('No ideas generated');
    }

    console.log(`✅ Generated ${ideas.length} content ideas for ${platform}`);
    
    return ideas.slice(0, count); // Ensure we return exactly the requested count

  } catch (error) {
    console.error('❌ AI Content Ideas Error:', error.message);
    throw error;
  }
}

/**
 * Improve an existing caption with AI
 * @param {string} originalCaption - User's original caption
 * @param {string} platform - Target platform
 * @returns {Promise<Object>} - { professional, casual, engaging, short }
 */
async function improveCaption(originalCaption, platform = 'linkedin') {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    console.log(`🎨 Improving caption for ${platform}...`);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Improve this social media caption for ${platform}. Create 4 distinct versions:

1. PROFESSIONAL & POLISHED - Business-appropriate, clear value proposition
2. CASUAL & FRIENDLY - Conversational, approachable, warm tone
3. ENGAGING & VIRAL - Hooks, curiosity gaps, calls-to-action
4. SHORT & PUNCHY - Concise, impactful, under 100 characters

Original caption: "${originalCaption}"

REQUIREMENTS:
- Keep the core message but enhance delivery
- Add relevant emojis (2-3 max per caption)
- Each version should feel distinctly different
- Make them platform-appropriate for ${platform}
- Optimize for engagement

Return ONLY valid JSON format:
{
  "professional": "professional version here",
  "casual": "casual version here",
  "engaging": "engaging version here",
  "short": "short version here"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
    const improved = JSON.parse(jsonText);

    console.log(`✅ Caption improved successfully`);
    
    return improved;

  } catch (error) {
    console.error('❌ Caption Improvement Error:', error.message);
    throw error;
  }
}

/**
 * Generate captions from image using Claude Vision
 * @param {string} imageUrl - URL of the image to analyze
 * @param {string} platform - Target platform
 * @returns {Promise<Object>} - { description, captions: [] }
 */
async function generateCaptionFromImage(imageUrl, platform = 'linkedin') {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    console.log(`🖼️ Analyzing image to generate captions for ${platform}...`);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Analyze this image and generate 3 engaging social media captions for ${platform}.

Instructions:
1. First, describe what you see in the image (objects, setting, mood, colors, composition)
2. Then create 3 unique caption variations that match the image
3. Each caption should:
   - Reference what's in the image naturally
   - Include relevant emojis (2-4 per caption)
   - Have a clear call-to-action or question
   - Be platform-appropriate for ${platform}
   - Aim for high engagement (curiosity, emotion, value)

Make each caption feel different:
- Caption 1: Professional/Informative
- Caption 2: Casual/Relatable  
- Caption 3: Engaging/Viral (with hook)

Return ONLY valid JSON format:
{
  "description": "detailed description of what's in the image",
  "captions": [
    "caption 1 here",
    "caption 2 here",
    "caption 3 here"
  ]
}`;

    // Handle both base64 data URLs and regular URLs
    let imageSource;
    if (imageUrl.startsWith('data:')) {
      // It's a base64 data URL - extract the base64 part
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid base64 data URL format');
      }
      const mediaType = matches[1]; // e.g., "image/jpeg", "image/png"
      const base64Data = matches[2];
      
      imageSource = {
        type: 'base64',
        media_type: mediaType,
        data: base64Data
      };
    } else {
      // It's a regular URL
      imageSource = {
        type: 'url',
        url: imageUrl
      };
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: imageSource
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }]
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonText);

    console.log(`✅ Generated captions from image`);
    console.log(`   Image shows: ${result.description?.substring(0, 80)}...`);
    
    return result;

  } catch (error) {
    console.error('❌ Image-to-Caption Error:', error.message);
    throw error;
  }
}

/**
 * Generate captions for carousel slides using Claude Vision
 * @param {Array<string>} imageUrls - Array of image URLs
 * @param {string} topic - Overall topic/theme
 * @param {string} platform - Target platform
 * @returns {Promise<Array<string>>} - Array of captions (one per slide)
 */
async function generateCarouselCaptions(imageUrls, topic, platform = 'linkedin') {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    console.log(`🎨 Generating captions for ${imageUrls.length}-slide carousel about "${topic}"...`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Build content array with all images
    const content = [];
    
    imageUrls.forEach((url, index) => {
      // Determine image source type
      let imageSource;
      if (url.startsWith('data:')) {
        const matches = url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          imageSource = {
            type: 'base64',
            media_type: matches[1],
            data: matches[2]
          };
        }
      } else {
        imageSource = {
          type: 'url',
          url: url
        };
      }
      
      if (imageSource) {
        content.push({
          type: 'image',
          source: imageSource
        });
      }
    });

    // Add the prompt
    const prompt = `Analyze these ${imageUrls.length} images as a carousel post about "${topic}" for ${platform}.

Create a caption for EACH slide that follows this structure:
- Slide 1: Attention-grabbing hook/title
- Middle slides: Key points/tips/steps (numbered if applicable)
- Last slide: Call-to-action or conclusion

Requirements:
- Each caption should be 1-2 sentences
- Progressive storytelling (build on previous slides)
- Platform-appropriate for ${platform}
- Include relevant emojis (1-2 per caption)
- Engaging and actionable

Return ONLY valid JSON format:
{
  "captions": [
    "Caption for slide 1",
    "Caption for slide 2",
    "Caption for slide 3",
    ...
  ]
}`;

    content.push({
      type: 'text',
      text: prompt
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: content
      }]
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonText);

    console.log(`✅ Generated ${result.captions.length} carousel captions`);
    
    return result.captions;

  } catch (error) {
    console.error('❌ Carousel Caption Generation Error:', error.message);
    throw error;
  }
}

module.exports = {
  generateCaption,
  generateMultiPlatformCaptions,
  generateHashtags,
  recommendPostTime,
  generatePostVariations,
  generateContentIdeas,
  improveCaption,
  generateCaptionFromImage,
  generateCarouselCaptions
};
