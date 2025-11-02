const { Innertube } = require('youtubei.js');
const axios = require('axios');

/**
 * Extract transcript from a YouTube video
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<string>} - Video transcript as plain text
 */
async function extractTranscript(videoUrl) {
  try {
    console.log(`\n📺 Extracting transcript from: ${videoUrl}`);
    
    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL. Please provide a valid YouTube video link.');
    }
    
    console.log(`   Video ID: ${videoId}`);
    
    // Initialize YouTube client
    const youtube = await Innertube.create();
    
    // Get video info
    const info = await youtube.getInfo(videoId);
    
    // Get transcript
    const transcriptData = await info.getTranscript();
    
    if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.content) {
      throw new Error('No transcript available for this video. The video may not have captions or transcripts enabled.');
    }
    
    // Extract and combine text segments
    const segments = transcriptData.transcript.content.body.initial_segments;
    
    if (!segments || segments.length === 0) {
      throw new Error('No transcript content found for this video.');
    }
    
    // Combine all text parts into a single string
    const fullText = segments
      .map(segment => segment.snippet.text.toString())
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    console.log(`   ✅ Transcript extracted: ${fullText.length} characters`);
    
    return fullText;
    
  } catch (error) {
    console.error('❌ Transcript extraction error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid YouTube URL')) {
      throw error;
    } else if (error.message.includes('No transcript available') || error.message.includes('No transcript content')) {
      throw error;
    } else if (error.message.includes('Transcript is disabled')) {
      throw new Error('Transcripts are disabled for this video. Please choose a different video.');
    } else if (error.message.includes('Video unavailable') || error.message.includes('not found')) {
      throw new Error('This video is unavailable or private. Please check the URL.');
    } else {
      throw new Error(`Failed to extract transcript: ${error.message}`);
    }
  }
}

/**
 * Extract video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if invalid
 */
function extractVideoId(url) {
  try {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Generate caption from YouTube transcript using Claude
 * @param {string} transcript - Video transcript
 * @param {string} instructions - User's special instructions
 * @param {string} platform - Target platform
 * @returns {Promise<Array<string>>} - Array of 3 caption variations
 */
async function generateCaptionFromTranscript(transcript, instructions = '', platform = 'linkedin') {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment variables');
    }
    
    // Truncate transcript if too long (Claude has token limits)
    const maxTranscriptLength = 4000;
    const truncatedTranscript = transcript.length > maxTranscriptLength 
      ? transcript.substring(0, maxTranscriptLength) + '...' 
      : transcript;
    
    // Platform-specific instructions
    const platformGuidelines = {
      linkedin: 'Professional tone, 3-5 sentences, include 2-3 hashtags, no emojis',
      twitter: 'Casual and punchy, under 250 characters, 2-3 hashtags, 1-2 emojis',
      instagram: 'Trendy and engaging, multiple paragraphs, 3-5 emojis, 10-15 hashtags',
      facebook: 'Conversational and engaging, 2-4 paragraphs, moderate emoji use, few hashtags',
      telegram: 'Informative and direct, well-structured, minimal hashtags',
      youtube: 'Engaging and descriptive, hook in first line, moderate length'
    };
    
    const platformGuide = platformGuidelines[platform.toLowerCase()] || platformGuidelines.linkedin;
    
    // Build the prompt
    const prompt = `You are a social media content expert. Based on the following YouTube video transcript, create a compelling ${platform} post.

VIDEO TRANSCRIPT:
${truncatedTranscript}

SPECIAL INSTRUCTIONS:
${instructions || 'None - use your best judgment'}

PLATFORM GUIDELINES:
${platformGuide}

REQUIREMENTS:
- Generate 3 unique variations of the caption
- Each variation should have a different style and approach
- Extract key insights and value from the transcript
- Make it engaging and shareable
- Maintain authenticity and value
- Do not mention that this is from a YouTube video unless specifically requested

Generate 3 distinct caption variations now.`;

    console.log(`\n🤖 Generating captions from transcript for ${platform}...`);
    
    // Generate 3 variations
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
              content: `${prompt}\n\nGenerate variation ${i + 1} of 3. Make it unique in style and tone.`
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
    
    console.log(`✅ Successfully generated ${variations.length} caption variations from transcript\n`);
    
    return variations;
    
  } catch (error) {
    console.error('❌ Caption generation error:', error.response?.data || error.message);
    
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

module.exports = {
  extractTranscript,
  generateCaptionFromTranscript,
  extractVideoId
};
