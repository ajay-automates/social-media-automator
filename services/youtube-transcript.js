/**
 * YouTube Transcript Service
 * Extracts transcripts from YouTube videos and generates AI captions
 * 
 * Uses dynamic import() to handle ESM modules in CommonJS environment
 */

const Anthropic = require('@anthropic-ai/sdk');

/**
 * Extract transcript from YouTube video
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<string>} - Video transcript text
 */
async function extractTranscript(videoUrl) {
  try {
    // Dynamic import for ESM module
    const { Innertube } = await import('youtubei.js');
    
    console.log('🎬 Initializing YouTube client...');
    const youtube = await Innertube.create();
    
    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    console.log(`📺 Fetching transcript for video: ${videoId}`);
    
    // Get video info
    const info = await youtube.getInfo(videoId);
    
    // Get transcript
    const transcriptData = await info.getTranscript();
    
    if (!transcriptData || !transcriptData.transcript) {
      throw new Error('No transcript available for this video');
    }
    
    // Combine all transcript segments into one text
    const transcript = transcriptData.transcript.content.body.initial_segments
      .map(segment => segment.snippet.text)
      .join(' ');
    
    console.log(`✅ Transcript extracted: ${transcript.length} characters`);
    return transcript;
    
  } catch (error) {
    console.error('❌ Transcript extraction error:', error);
    throw new Error(`Failed to extract transcript: ${error.message}`);
  }
}

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null
 */
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
    /(?:youtube\.com\/v\/)([^?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Generate AI captions from transcript using Claude (Anthropic)
 * @param {string} transcript - Video transcript text
 * @param {string} instructions - User instructions for caption style
 * @param {string} platform - Target platform (linkedin, twitter, etc.)
 * @returns {Promise<Array>} - Array of caption variations
 */
async function generateCaptionFromTranscript(transcript, instructions = '', platform = 'linkedin') {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment variables');
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    console.log(`🤖 Generating captions for ${platform} using Claude...`);
    
    // Platform-specific guidelines
    const platformGuidelines = {
      linkedin: 'Professional tone, 1-3 paragraphs, use emojis sparingly, focus on insights and takeaways',
      twitter: 'Concise, under 280 characters, engaging hook, 1-2 hashtags',
      instagram: 'Casual and engaging, use relevant emojis, include call-to-action, 3-5 hashtags',
      facebook: 'Conversational tone, 2-3 paragraphs, ask questions to drive engagement',
      youtube: 'Detailed description, include timestamps if relevant, SEO keywords',
      tiktok: 'Short and punchy, trending phrases, 3-5 hashtags',
      telegram: 'Clear and informative, use formatting for readability',
      slack: 'Professional but casual, concise, action-oriented'
    };
    
    const guideline = platformGuidelines[platform] || platformGuidelines.linkedin;
    
    // Truncate transcript if too long (Claude has token limits)
    const maxLength = 8000;
    const truncatedTranscript = transcript.length > maxLength 
      ? transcript.substring(0, maxLength) + '...' 
      : transcript;
    
    const prompt = `You are a social media expert creating engaging captions from video transcripts.

VIDEO TRANSCRIPT:
${truncatedTranscript}

TARGET PLATFORM: ${platform.toUpperCase()}
PLATFORM GUIDELINES: ${guideline}

${instructions ? `USER INSTRUCTIONS: ${instructions}` : ''}

Generate 3 different caption variations for this video content. Each caption should:
1. Capture the key message from the transcript
2. Be optimized for ${platform}
3. Include relevant hashtags (where appropriate)
4. Be engaging and encourage interaction

Return the captions in this exact format:
CAPTION 1:
[your first caption here]

CAPTION 2:
[your second caption here]

CAPTION 3:
[your third caption here]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.9, // Higher temperature for more creative variations
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    const responseText = message.content[0].text;
    
    // Parse the response into separate captions
    const captions = parseCaptions(responseText);
    
    console.log(`✅ Generated ${captions.length} caption variations`);
    return captions;
    
  } catch (error) {
    console.error('❌ Caption generation error:', error);
    throw new Error(`Failed to generate captions: ${error.message}`);
  }
}

/**
 * Parse Claude's response into separate caption strings
 * @param {string} response - Claude API response
 * @returns {Array<string>} - Array of caption strings
 */
function parseCaptions(response) {
  const captions = [];
  const captionRegex = /CAPTION \d+:\s*([\s\S]*?)(?=CAPTION \d+:|$)/gi;
  
  let match;
  while ((match = captionRegex.exec(response)) !== null) {
    const caption = match[1].trim();
    if (caption) {
      captions.push(caption);
    }
  }
  
  // Fallback: if parsing fails, return the whole response as one caption
  if (captions.length === 0) {
    captions.push(response.trim());
  }
  
  return captions;
}

module.exports = {
  extractTranscript,
  generateCaptionFromTranscript
};

