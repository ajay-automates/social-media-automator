# 🎨 Carousel Posts Feature - Complete Implementation Plan

## 📋 Overview

Build a premium feature that allows users to create multi-image carousel posts for LinkedIn and Instagram. AI generates captions for each slide, users can preview the carousel, and post with one click.

**Impact:** 3-5x higher engagement than single posts
**Revenue:** Premium feature worth $49-99/month
**Time:** 3-4 hours to build

---

## ✨ What Users Get

### Key Features:
1. **Upload 2-10 images** for carousel
2. **AI generates captions** for each slide (or use one caption for all)
3. **Drag & drop to reorder** slides
4. **Preview carousel** with swipe functionality
5. **One-click post** to LinkedIn & Instagram
6. **Schedule carousel** posts for later

### Supported Platforms:
- ✅ **LinkedIn** (2-10 images per carousel)
- ✅ **Instagram** (2-10 images per carousel)
- ⏳ **Twitter/X** (up to 4 images - Phase 2)

---

## 🎨 UI/UX Design

### 1. Carousel Builder (New Page)

```
┌─────────────────────────────────────────────────────────┐
│  📸 Create Carousel Post                                 │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📤 Upload Images (2-10 slides)                  │   │
│  │  Drag & drop files or click to browse           │   │
│  │  Supported: JPG, PNG, WebP (max 10MB each)      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Uploaded Slides: 5 images                              │
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │
│  │ [1]  │  │ [2]  │  │ [3]  │  │ [4]  │  │ [5]  │    │
│  │ IMG  │  │ IMG  │  │ IMG  │  │ IMG  │  │ IMG  │    │
│  │ 🗑️   │  │ 🗑️   │  │ 🗑️   │  │ 🗑️   │  │ 🗑️   │    │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘    │
│    ↕️         ↕️         ↕️         ↕️         ↕️         │
│  Drag to reorder                                        │
│                                                          │
│  Caption Options:                                       │
│  ○ Single caption for all slides                       │
│  ● AI-generated caption per slide 🤖                   │
│  ○ Custom caption per slide                            │
│                                                          │
│  [✨ Generate AI Captions] [Preview Carousel]          │
└─────────────────────────────────────────────────────────┘
```

### 2. AI Caption Generation Modal

```
┌─────────────────────────────────────────────────────────┐
│  🤖 AI Carousel Caption Generator                        │
│                                                          │
│  Analyzing 5 slides...                                  │
│                                                          │
│  Slide 1: [Thumbnail]                                   │
│  Caption: "5 LinkedIn Tips for 2025 🚀"                 │
│  [Edit] [Regenerate]                                    │
│                                                          │
│  Slide 2: [Thumbnail]                                   │
│  Caption: "Tip #1: Use AI to automate captions..."     │
│  [Edit] [Regenerate]                                    │
│                                                          │
│  Slide 3: [Thumbnail]                                   │
│  Caption: "Tip #2: Post at optimal times..."           │
│  [Edit] [Regenerate]                                    │
│                                                          │
│  ... (2 more slides)                                    │
│                                                          │
│  [Use These Captions] [Regenerate All]                 │
└─────────────────────────────────────────────────────────┘
```

### 3. Carousel Preview

```
┌─────────────────────────────────────────────────────────┐
│  📱 Carousel Preview                                     │
│                                                          │
│  ← [Slide 1 of 5] →                                    │
│                                                          │
│  ┌───────────────────────────────────────────────┐     │
│  │                                                │     │
│  │            [Image Preview]                     │     │
│  │                                                │     │
│  └───────────────────────────────────────────────┘     │
│                                                          │
│  5 LinkedIn Tips for 2025 🚀                            │
│                                                          │
│  ● ○ ○ ○ ○  (Slide indicators)                         │
│                                                          │
│  Select Platforms:                                      │
│  ☑ LinkedIn  ☑ Instagram                               │
│                                                          │
│  [Post Now] [Schedule] [Back to Edit]                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Backend Implementation

### New Files to Create:

#### 1. `services/carousel.js`

```javascript
const { uploadToCloudinary } = require('./cloudinary');
const { generateCarouselCaptions } = require('./ai');

/**
 * Upload carousel images to Cloudinary
 * @param {Array<File>} images - Array of image files
 * @returns {Promise<Array<string>>} - Array of image URLs
 */
async function uploadCarouselImages(images) {
  const uploadPromises = images.map(img => uploadToCloudinary(img));
  return await Promise.all(uploadPromises);
}

/**
 * Create carousel post data structure
 * @param {Object} carouselData - { images, captions, platform }
 * @returns {Object} - Formatted carousel post
 */
function createCarouselPost(carouselData) {
  const { images, captions, platform, captionMode } = carouselData;
  
  return {
    type: 'carousel',
    platform,
    images,
    captions: captionMode === 'single' ? [captions[0]] : captions,
    captionMode,
    slideCount: images.length,
    createdAt: new Date()
  };
}

/**
 * Validate carousel requirements per platform
 */
function validateCarousel(platform, images) {
  const requirements = {
    linkedin: { min: 2, max: 10, maxSize: 10 * 1024 * 1024 }, // 10MB
    instagram: { min: 2, max: 10, maxSize: 8 * 1024 * 1024 }, // 8MB
    twitter: { min: 2, max: 4, maxSize: 5 * 1024 * 1024 } // 5MB
  };
  
  const req = requirements[platform];
  
  if (images.length < req.min || images.length > req.max) {
    throw new Error(`${platform} requires ${req.min}-${req.max} images`);
  }
  
  images.forEach((img, i) => {
    if (img.size > req.maxSize) {
      throw new Error(`Image ${i + 1} exceeds ${req.maxSize / (1024 * 1024)}MB limit`);
    }
  });
  
  return true;
}

module.exports = {
  uploadCarouselImages,
  createCarouselPost,
  validateCarousel
};
```

#### 2. Update `services/ai.js` - Add Carousel Caption Generation

```javascript
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
        imageSource = {
          type: 'base64',
          media_type: matches[1],
          data: matches[2]
        };
      } else {
        imageSource = {
          type: 'url',
          url: url
        };
      }
      
      content.push({
        type: 'image',
        source: imageSource
      });
    });

    // Add the prompt
    const prompt = `Analyze these ${imageUrls.length} images as a carousel post about "${topic}" for ${platform}.

Create a caption for EACH slide that:
- Slide 1: Attention-grabbing hook/title
- Middle slides: Key points/tips/steps
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
      max_tokens: 2000,
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

// Add to module.exports
module.exports = {
  // ... existing exports
  generateCarouselCaptions
};
```

#### 3. Update `services/linkedin.js` - Add Carousel Support

```javascript
/**
 * Post carousel to LinkedIn
 * @param {Array<string>} imageUrls - Array of image URLs
 * @param {Array<string>} captions - Array of captions (or single caption)
 * @param {Object} credentials - LinkedIn access token
 */
async function postLinkedInCarousel(imageUrls, captions, credentials) {
  try {
    const accessToken = credentials.access_token;
    const userId = credentials.user_id;

    // Step 1: Register upload for each image
    const mediaAssets = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const registerResponse = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:person:${userId}`,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;

      // Step 2: Upload image binary
      const imageResponse = await axios.get(imageUrls[i], { responseType: 'arraybuffer' });
      await axios.put(uploadUrl, imageResponse.data, {
        headers: { 'Content-Type': 'image/jpeg' }
      });

      mediaAssets.push(asset);
    }

    // Step 3: Create carousel post
    const caption = captions.length === 1 ? captions[0] : captions.join('\n\n');
    
    const postData = {
      author: `urn:li:person:${userId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: caption
          },
          shareMediaCategory: 'IMAGE',
          media: mediaAssets.map(asset => ({
            status: 'READY',
            media: asset
          }))
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    console.log('✅ LinkedIn carousel posted successfully');
    return { success: true, postId: response.data.id };

  } catch (error) {
    console.error('❌ LinkedIn carousel error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  // ... existing exports
  postLinkedInCarousel
};
```

#### 4. New API Endpoints in `server.js`

```javascript
// =====================================================
// CAROUSEL POSTS ENDPOINTS
// =====================================================

/**
 * POST /api/carousel/upload
 * Upload carousel images to Cloudinary
 */
app.post('/api/carousel/upload', verifyAuth, upload.array('images', 10), async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files;

    if (!files || files.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least 2 images for carousel'
      });
    }

    if (files.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 images allowed per carousel'
      });
    }

    console.log(`📤 Uploading ${files.length} carousel images...`);

    // Upload all images to Cloudinary
    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'carousel-posts' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    console.log(`✅ Uploaded ${imageUrls.length} images`);

    res.json({
      success: true,
      images: imageUrls,
      count: imageUrls.length
    });

  } catch (error) {
    console.error('Error uploading carousel images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload images'
    });
  }
});

/**
 * POST /api/carousel/generate-captions
 * Generate AI captions for carousel slides
 */
app.post('/api/carousel/generate-captions', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrls, topic, platform } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least 2 image URLs'
      });
    }

    // Check AI usage limits
    const usageCheck = await checkUsage(userId, 'ai');
    if (!usageCheck.allowed) {
      return res.status(402).json({
        success: false,
        error: usageCheck.message,
        limitReached: true
      });
    }

    console.log(`🤖 Generating captions for ${imageUrls.length}-slide carousel...`);

    const captions = await generateCarouselCaptions(imageUrls, topic || 'carousel post', platform || 'linkedin');

    // Increment AI usage
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      captions,
      count: captions.length
    });

  } catch (error) {
    console.error('Error generating carousel captions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate captions'
    });
  }
});

/**
 * POST /api/carousel/post
 * Post carousel to social media
 */
app.post('/api/carousel/post', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrls, captions, platforms, scheduleTime } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least 2 images'
      });
    }

    if (!platforms || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please select at least one platform'
      });
    }

    // Validate platforms support carousels
    const supportedPlatforms = ['linkedin', 'instagram'];
    const unsupported = platforms.filter(p => !supportedPlatforms.includes(p));
    if (unsupported.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Carousel not supported on: ${unsupported.join(', ')}`
      });
    }

    console.log(`📸 Posting carousel to ${platforms.join(', ')}...`);

    // Get user credentials for platforms
    const { data: accounts } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('user_id', userId)
      .in('platform', platforms);

    if (!accounts || accounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No connected accounts found for selected platforms'
      });
    }

    const results = [];

    for (const account of accounts) {
      try {
        let result;
        
        if (account.platform === 'linkedin') {
          result = await postLinkedInCarousel(imageUrls, captions, account.credentials);
        } else if (account.platform === 'instagram') {
          result = await postInstagramCarousel(imageUrls, captions, account.credentials);
        }

        results.push({
          platform: account.platform,
          success: true,
          postId: result.postId
        });

      } catch (error) {
        console.error(`Failed to post to ${account.platform}:`, error);
        results.push({
          platform: account.platform,
          success: false,
          error: error.message
        });
      }
    }

    // Save to analytics
    await addPost(
      userId,
      captions[0] || 'Carousel post',
      imageUrls[0],
      platforms,
      { type: 'carousel', images: imageUrls, captions }
    );

    res.json({
      success: true,
      results,
      message: 'Carousel posted successfully!'
    });

  } catch (error) {
    console.error('Error posting carousel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to post carousel'
    });
  }
});
```

---

## 🎨 Frontend Implementation

### New Files to Create:

#### 1. `dashboard/src/pages/CreateCarousel.jsx`

Main carousel builder page with:
- Multi-image upload (drag & drop)
- Image reordering (drag & drop)
- Caption generation options
- Preview functionality
- Post/Schedule buttons

#### 2. `dashboard/src/components/CarouselBuilder.jsx`

Component for building the carousel:
- Image upload zone
- Thumbnail grid with reorder
- Delete individual images
- Caption mode selector

#### 3. `dashboard/src/components/CarouselPreview.jsx`

Swipeable carousel preview:
- Navigate between slides
- Show captions per slide
- Platform preview modes (LinkedIn/Instagram style)

#### 4. `dashboard/src/components/CarouselCaptionModal.jsx`

AI caption generation modal:
- Shows all slides with thumbnails
- Generated caption for each
- Edit/regenerate individual captions
- Regenerate all button

---

## 📊 Database Schema

### Add to existing `analytics` table:

```sql
-- Add carousel metadata to post_metadata column
-- Example:
{
  "type": "carousel",
  "slideCount": 5,
  "images": ["url1", "url2", ...],
  "captions": ["caption1", "caption2", ...],
  "captionMode": "ai-per-slide"
}
```

No new tables needed - use existing `analytics` table with metadata!

---

## 🚀 User Flows

### Flow 1: Create & Post Carousel

1. User clicks "Create Carousel" in nav
2. Upload 5 images (drag & drop)
3. Select "AI-generated caption per slide"
4. Click "Generate AI Captions"
5. AI analyzes images and creates 5 captions
6. User reviews/edits captions
7. Click "Preview Carousel"
8. Swipe through preview
9. Select LinkedIn + Instagram
10. Click "Post Now"
11. Success! Carousel posted to both platforms

### Flow 2: Schedule Carousel

1. Build carousel (same as above)
2. Click "Schedule" instead of "Post Now"
3. Select date & time
4. Carousel queued for posting
5. Shows in Calendar view

---

## 💰 Pricing Strategy

### Free Plan:
- ❌ No carousel posts
- "Upgrade to Premium for Carousel Posts"

### Premium Plan ($49/mo):
- ✅ Unlimited carousel posts
- ✅ AI caption generation
- ✅ Up to 10 images per carousel

### Agency Plan ($99-199/mo):
- ✅ Everything in Premium
- ✅ Team access to carousels
- ✅ Carousel templates library

---

## ✅ Success Metrics

### Technical:
- Upload time: < 3 seconds for 5 images
- AI caption generation: < 15 seconds
- Post success rate: > 95%

### Business:
- 40% of users try carousel feature
- 30% upgrade to Premium for carousels
- Average 2-3 carousels posted per week
- 4-5x engagement vs regular posts

---

## 🎯 Implementation Order

### Phase 1 (MVP - 3 hours):
1. Backend carousel upload & storage
2. AI caption generation for multiple images
3. LinkedIn carousel posting
4. Basic frontend builder
5. Preview component

### Phase 2 (Polish - 1 hour):
6. Instagram carousel posting
7. Drag & drop reordering
8. Carousel templates
9. Analytics tracking

### Phase 3 (Future):
10. Twitter multi-image support
11. Carousel templates library
12. A/B testing different slide orders
13. Engagement heatmaps per slide

---

## 🔧 Dependencies Needed

```bash
# Backend
npm install multer cloudinary

# Frontend
npm install react-dropzone react-beautiful-dnd swiper
```

---

## 📝 To-Do Checklist

- [ ] Create services/carousel.js with upload/validation logic
- [ ] Add generateCarouselCaptions() to services/ai.js
- [ ] Add postLinkedInCarousel() to services/linkedin.js
- [ ] Add 3 carousel endpoints to server.js
- [ ] Create CreateCarousel.jsx page
- [ ] Create CarouselBuilder.jsx component
- [ ] Create CarouselPreview.jsx component
- [ ] Create CarouselCaptionModal.jsx component
- [ ] Add "Create Carousel" to navigation
- [ ] Test LinkedIn carousel posting
- [ ] Test Instagram carousel posting
- [ ] Add carousel analytics tracking

---

**Ready to start building! This will be a GAME-CHANGER feature! 🚀**

