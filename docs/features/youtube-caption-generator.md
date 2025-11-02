# YouTube Caption Generator

## Overview
The YouTube Caption Generator allows users to create engaging social media captions based on YouTube video transcripts. This feature extracts the transcript from any YouTube video and uses AI (Claude) to generate 3 unique caption variations tailored to your selected platform.

## Features

### Frontend (Create Post Page)
- **New Button**: "📺 Generate from YouTube" button next to "✨ Generate with AI"
- **Interactive Modal**: Clean, user-friendly modal for inputting YouTube URL and instructions
- **3 Caption Variations**: AI generates 3 different caption styles to choose from
- **Platform-Specific**: Captions are optimized for the selected platform (LinkedIn, Twitter, Instagram, etc.)

### Backend API
- **Endpoint**: `POST /api/ai/youtube-caption`
- **Authentication**: Protected route (requires valid user session)
- **Usage Tracking**: Counts against AI usage limits in billing

## How to Use

### User Flow
1. Navigate to the **Create Post** page
2. Click the **"📺 Generate from YouTube"** button
3. Enter a **YouTube video URL** (the video must have captions/transcripts enabled)
4. Optionally, add **special instructions** for caption style (e.g., "Focus on marketing tips", "Make it casual")
5. Click **"🎬 Generate"**
6. Wait for AI to process the transcript and generate 3 variations
7. **Select** your favorite variation - it will be added to the caption field
8. Continue posting as normal

### Example Instructions
- "Focus on the key takeaways"
- "Make it more professional"
- "Emphasize the marketing strategies"
- "Keep it casual and friendly"
- "Highlight the technical details"

## Technical Details

### Dependencies
- **youtubei.js**: Reliable YouTube API client for extracting video transcripts
- **Anthropic Claude API**: AI model for generating captions

### File Structure
```
services/
  └── youtube-transcript.js       # YouTube transcript extraction and caption generation
dashboard/src/pages/
  └── CreatePost.jsx               # Updated with YouTube modal and button
server.js                          # New endpoint: /api/ai/youtube-caption
```

### API Request Format
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "instructions": "Optional special instructions",
  "platform": "linkedin"
}
```

### API Response Format
```json
{
  "success": true,
  "variations": [
    "First caption variation...",
    "Second caption variation...",
    "Third caption variation..."
  ],
  "count": 3,
  "transcriptLength": 4521
}
```

## Platform-Specific Guidelines

The AI adapts captions based on the selected platform:

### LinkedIn
- Professional tone
- 3-5 sentences
- 2-3 hashtags
- No emojis
- Focus on insights

### Twitter
- Casual and punchy
- Under 250 characters
- 2-3 hashtags
- 1-2 emojis
- Shareable hook

### Instagram
- Trendy and engaging
- Multiple paragraphs
- 3-5 emojis
- 10-15 hashtags
- Call-to-action

### Facebook
- Conversational
- 2-4 paragraphs
- Moderate emoji use
- Few hashtags

## Error Handling

The feature gracefully handles various error scenarios:

### Invalid URL
```
"Invalid YouTube URL. Please provide a valid YouTube video link."
```

### No Transcript Available
```
"No transcript available for this video. The video may not have captions or transcripts enabled."
```

### Video Unavailable
```
"This video is unavailable or private. Please check the URL."
```

### API Rate Limits
```
"Rate limit exceeded. Please try again in a moment."
```

### Usage Limits Reached
```
"You've reached your AI generation limit. Please upgrade your plan."
```

## Supported YouTube URL Formats

The feature supports all common YouTube URL formats:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- Direct video ID: `VIDEO_ID`

## Billing Integration

- Uses the same **AI usage counter** as the regular caption generator
- Counts as **1 AI generation** per request
- Subject to plan limits (Free: 10/month, Pro: 100/month, Enterprise: Unlimited)
- Will prompt upgrade if limit is reached

## Best Practices

### For Users
1. **Use videos with good transcripts**: Auto-generated captions work, but manual transcripts are better
2. **Add specific instructions**: The more specific, the better the result
3. **Choose the right platform**: Select your target platform before generating
4. **Review and edit**: Always review the generated caption and adjust as needed

### For Videos
- Choose videos with **clear audio** (better transcripts)
- Prefer videos with **manual captions** (more accurate)
- Avoid videos with **music-only** or **no speech**
- Works best with **educational** or **talking-head** style videos

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for multiple video URLs at once
- [ ] Timestamp-based caption generation (extract specific sections)
- [ ] Video thumbnail extraction
- [ ] Support for other video platforms (Vimeo, etc.)
- [ ] Cache transcripts to avoid re-extraction
- [ ] Support for videos in different languages
- [ ] Sentiment analysis of video content
- [ ] Automatic hashtag suggestions based on video content

## Troubleshooting

### "No transcript available"
**Solution**: The video must have captions enabled. Try a different video or use manual caption generation.

### "Invalid URL"
**Solution**: Ensure you're using a valid YouTube URL format. Copy the URL directly from YouTube's address bar.

### Slow generation
**Solution**: This is normal. The process involves:
1. Extracting transcript (~2-5 seconds)
2. Generating 3 AI variations (~10-15 seconds)

### Generated captions are off-topic
**Solution**: Use more specific instructions to guide the AI. Reference specific topics or themes from the video.

## Code Examples

### Frontend Usage
```jsx
// Trigger YouTube modal
onClick={() => setShowYoutubeModal(true)}

// Generate captions
const response = await api.post('/ai/youtube-caption', {
  videoUrl: youtubeUrl,
  instructions: youtubeInstructions,
  platform: platforms[0] || 'linkedin'
});

// Handle variations
setYoutubeVariations(response.data.variations);
```

### Backend Usage
```javascript
// Extract transcript
const transcript = await extractTranscript(videoUrl);

// Generate captions
const variations = await generateCaptionFromTranscript(
  transcript,
  instructions,
  platform
);
```

## Security Considerations

- **Rate Limiting**: Protected by usage limits to prevent abuse
- **Authentication Required**: Must be logged in to use
- **URL Validation**: Validates YouTube URLs before processing
- **Error Handling**: Safely handles malformed requests
- **API Key Protection**: Claude API key stored securely in environment variables

## Performance

- **Transcript Extraction**: ~2-5 seconds
- **AI Generation**: ~10-15 seconds (3 variations)
- **Total Time**: ~15-20 seconds on average
- **Transcript Limit**: Truncated to 4000 characters for Claude API compatibility

## Environment Setup

Required environment variables:
```bash
ANTHROPIC_API_KEY=your_claude_api_key_here
```

No additional configuration needed - the feature works with existing setup.
