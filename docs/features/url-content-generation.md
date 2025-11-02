# 🔗 Generate from URL Feature

Generate AI-powered social media captions from any URL - YouTube videos or web pages.

## Overview

The "Generate from URL" feature allows users to create engaging social media captions by providing any URL. The system intelligently handles:

- **YouTube Videos**: Extracts transcripts and generates captions based on video content
- **Web Pages**: Scrapes article content and generates relevant captions

## How It Works

### 1. User Input
Users click the "🔗 Generate from URL" button on the Create Post page and provide:
- **URL**: Any YouTube video URL or article/blog post URL
- **Special Instructions** (optional): Specific guidance on caption style, tone, or focus areas

### 2. Content Extraction

#### YouTube URLs
When a YouTube URL is detected:
1. System extracts the video transcript using `youtubei.js`
2. Transcript is sent to Claude for caption generation
3. Video must have captions/transcripts enabled

Supported YouTube URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

#### Web Page URLs
For non-YouTube URLs:
1. System uses Crawlee with Playwright to scrape the page
2. Content is extracted using intelligent selectors that cover most websites:
   - `article`, `main`, `[role="main"]`
   - `.content`, `.post-content`, `.article-content`
   - `.entry-content`, `.post-body`, `.article-body`
   - `#content`, `#main-content`, `.main-content`
3. Noise is removed (scripts, styles, navigation, footers, sidebars)
4. Cleaned content is sent to Claude for caption generation

### 3. AI Caption Generation

The system uses Claude (Anthropic) to generate 3 caption variations:
- Optimized for the selected platform (LinkedIn, Twitter, Instagram, etc.)
- Follows platform-specific guidelines (character limits, hashtag usage, tone)
- Incorporates user's special instructions
- Includes relevant hashtags and calls-to-action

### 4. User Selection

Users can:
- Review all 3 generated caption variations
- Select the one that best fits their needs
- The selected caption is automatically populated in the post editor

## Technical Implementation

### Backend Components

#### 1. Web Scraper Service (`services/web-scraper.js`)
```javascript
// Scrape content from any web page
const content = await scrapeWebContent(url);

// Check if URL is YouTube
const isYT = isYouTubeUrl(url);
```

Features:
- Uses Crawlee with Playwright for robust scraping
- Handles dynamic content loading
- Multiple fallback selectors for broad compatibility
- Removes noise (navigation, ads, scripts)
- Extracts page title and main content
- Returns cleaned, formatted text

#### 2. YouTube Transcript Service (`services/youtube-transcript.js`)
```javascript
// Extract transcript from YouTube video
const transcript = await extractTranscript(videoUrl);

// Generate captions from transcript
const variations = await generateCaptionFromTranscript(
  transcript,
  instructions,
  platform
);
```

Features:
- Uses `youtubei.js` for YouTube API
- Extracts video transcripts
- Handles multiple YouTube URL formats
- Generates platform-optimized captions

#### 3. API Endpoint (`server.js`)
```javascript
POST /api/ai/youtube-caption
```

Request body:
```json
{
  "videoUrl": "https://example.com/article-or-video",
  "instructions": "Focus on key takeaways, casual tone",
  "platform": "linkedin"
}
```

Response:
```json
{
  "success": true,
  "variations": [
    "Caption variation 1...",
    "Caption variation 2...",
    "Caption variation 3..."
  ],
  "count": 3,
  "contentLength": 5432,
  "contentType": "web page" // or "YouTube video"
}
```

### Frontend Components

#### CreatePost.jsx Updates
1. **Button**: "🔗 Generate from URL" (previously "📺 Generate from YouTube")
2. **Modal**: Updated to accept any URL type
3. **Placeholder**: Shows both YouTube and article URL examples
4. **State Management**: Uses existing `youtubeUrl` state (naming kept for backward compatibility)

## Usage Limits

This feature consumes AI usage quota:
- Each generation counts as 1 AI request
- Usage limits based on subscription plan
- Users are notified when limits are reached

## Error Handling

The system handles various error scenarios:

### YouTube Errors
- Invalid YouTube URL
- No transcript available (video doesn't have captions)
- Video is private or restricted
- API rate limits

### Web Scraping Errors
- Page not accessible (404, 403, etc.)
- Content extraction failed (empty page, dynamic content issues)
- Timeout (page takes too long to load)
- CAPTCHA or anti-bot protection

### AI Errors
- API key not configured
- Usage limits exceeded
- Content too long (automatically truncated)
- API service unavailable

## Best Practices

### For Users
1. **YouTube Videos**: Ensure videos have captions/transcripts enabled
2. **Web Pages**: Use direct article URLs, not homepage URLs
3. **Instructions**: Be specific about desired caption style and focus
4. **Platform Selection**: Choose the target platform before generating

### For Developers
1. **Rate Limiting**: Implement proper rate limiting for scraping
2. **Caching**: Consider caching scraped content to reduce redundant requests
3. **Error Handling**: Provide clear, actionable error messages
4. **Monitoring**: Track scraping success rates and failure reasons

## Dependencies

```json
{
  "crawlee": "^3.x",
  "playwright": "^1.x",
  "youtubei.js": "^16.x",
  "@anthropic-ai/sdk": "^0.68.0"
}
```

## Future Enhancements

Potential improvements:
1. **Video Upload**: Upload video files and extract audio for transcription
2. **Multi-URL**: Generate captions from multiple URLs at once
3. **Content Preview**: Show extracted content preview before generating
4. **Template Library**: Save and reuse instruction templates
5. **PDF Support**: Extract content from PDF documents
6. **Twitter Thread**: Generate full threads from long-form content
7. **Language Detection**: Auto-detect content language and generate accordingly

## Security Considerations

1. **URL Validation**: Validate and sanitize all URLs before processing
2. **Rate Limiting**: Prevent abuse of scraping functionality
3. **Content Length**: Limit maximum content length to prevent DoS
4. **User Isolation**: Each user's requests are isolated and tracked
5. **Error Disclosure**: Don't expose internal system details in errors

## Testing

To test the feature:

1. **Test YouTube URL**:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

2. **Test Article URL**:
   ```
   https://blog.example.com/article-title
   ```

3. **Test with Instructions**:
   ```
   Instructions: "Make it funny, focus on the key points, add 3-5 hashtags"
   ```

4. **Test Error Cases**:
   - Invalid URL: `https://this-is-not-a-real-url.com`
   - YouTube without transcript: (find a video without captions)

## Troubleshooting

### Scraping Fails
- Check if the website allows scraping (robots.txt)
- Try a different article from the same site
- Check browser console for specific errors

### YouTube Fails
- Verify video has captions enabled
- Try a different video from the same channel
- Check if video is public

### Captions Not Generated
- Check AI usage limits
- Verify ANTHROPIC_API_KEY is configured
- Check server logs for specific errors

---

**Status**: ✅ Fully implemented and ready for use

**Last Updated**: November 2, 2025
