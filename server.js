require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs').promises;
const crypto = require('crypto');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { encryptState, decryptState } = require('./utilities/oauthState');
const { 
  schedulePost, 
  postNow, 
  startQueueProcessor, 
  getQueue,
  deleteFromQueue 
} = require('./services/scheduler');

const { 
  getPostHistory, 
  getPlatformStats,
  healthCheck
} = require('./services/database');

const { generateCaption } = require('./services/ai');
const aiImageService = require('./services/ai-image');
const { 
  getAllAccountsWithStatus, 
  getAllCredentials 
} = require('./services/accounts');
const { 
  uploadImage,
  uploadVideo 
} = require('./services/cloudinary');
const {
  initiateLinkedInOAuth,
  handleLinkedInCallback,
  initiateTwitterOAuth,
  handleTwitterCallback,
  disconnectAccount,
  getUserConnectedAccounts,
  getUserCredentialsForPosting
} = require('./services/oauth');
const {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
  checkUsage,
  incrementUsage,
  getUserBillingInfo
} = require('./services/billing');
const { getAllPlans } = require('./config/plans');

const app = express();

// In-memory storage for PKCE code_verifier (use Redis in production)
const pkceStore = new Map();

// Initialize Supabase client for auth verification
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  console.log('✅ Supabase Auth configured');
} else {
  console.warn('⚠️  Supabase Auth not configured - API protection disabled');
}

// Auth middleware
async function verifyAuth(req, res, next) {
  // Skip auth check if Supabase not configured (development mode)
  if (!supabase) {
    req.user = { id: 'dev-user', email: 'dev@example.com' };
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No authorization token provided' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email
    };
    
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));
app.use(express.static('.')); // Serve static files

// Configure Multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // Increase to 100MB for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir);
  console.log('📁 Created uploads directory');
}

// Start the queue processor
startQueueProcessor();

// ============================================
// PAGE ROUTES (Unprotected)
// ============================================

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Auth page
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

// Dashboard (protected on client-side)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ============================================
// API ROUTES
// ============================================

/**
 * Health check (unprotected)
 */
app.get('/api/health', async (req, res) => {
  try {
    const dbHealthy = await healthCheck();
    const queue = await getQueue();
    
    res.json({ 
      status: 'running',
      uptime: process.uptime(),
      database: dbHealthy ? 'connected' : 'disconnected',
      queueSize: queue.length,
      message: '🚀 Social Media Automator is live!'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * GET /api/accounts
 * Get all accounts with their platform availability (protected)
 */
app.get('/api/accounts', verifyAuth, (req, res) => {
  try {
    const accounts = getAllAccountsWithStatus();
    res.json({ 
      success: true,
      accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error('Error in /api/accounts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/post/now
 * Post immediately to selected platforms from selected account (protected)
 */
app.post('/api/post/now', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, imageUrl, platforms } = req.body;
    console.log('📤 Post Now - User:', userId);
    console.log('📤 Platforms:', platforms);
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required' 
      });
    }
    
    // Check usage limits
    const usageCheck = await checkUsage(userId, 'posts');
    if (!usageCheck.allowed) {
      return res.status(402).json({
        success: false,
        error: usageCheck.message,
        limitReached: true,
        upgradePlan: usageCheck.upgradePlan
      });
    }
    
    // Get user's credentials from database
    const credentials = await getUserCredentialsForPosting(userId);
    console.log('🔑 Credentials loaded:', {
      linkedin: !!credentials.linkedin.accessToken,
      twitter: !!credentials.twitter.accessToken
    });
    
    // Check if video is being posted to unsupported platforms
    if (imageUrl && imageUrl.includes('/video/') && platforms.includes('linkedin')) {
      console.warn('⚠️  Videos not supported on LinkedIn, will skip LinkedIn');
      platforms = platforms.filter(p => p !== 'linkedin');
    }
    
    // Validate that user has connected the requested platforms
    const requestedPlatforms = Array.isArray(platforms) ? platforms : [platforms];
    for (const platform of requestedPlatforms) {
      if (platform === 'linkedin' && !credentials.linkedin.accessToken) {
        return res.status(400).json({
          success: false,
          error: 'LinkedIn account not connected. Please connect your LinkedIn account first.'
        });
      }
      if (platform === 'twitter' && !credentials.twitter.accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Twitter account not connected. Please connect your Twitter account first.'
        });
      }
    }
    
    const platformResults = await postNow(text, imageUrl || null, platforms, credentials);
    
    // Check if all platforms succeeded
    const allSuccess = Object.values(platformResults).every(r => r.success);
    const anySuccess = Object.values(platformResults).some(r => r.success);
    
    // Increment usage count if at least one platform succeeded
    if (anySuccess) {
      await incrementUsage(userId, 'posts');
    }
    
    // Format response for frontend
    res.json({
      success: allSuccess,
      partial: anySuccess && !allSuccess,
      results: platformResults
    });
  } catch (error) {
    console.error('❌ Error in /api/post/now:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/post/schedule
 * Schedule a post for later from selected account (protected)
 */
app.post('/api/post/schedule', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, imageUrl, platforms, scheduleTime } = req.body;
    console.log('📅 Schedule Post - User:', userId);
    console.log('📅 Platforms:', platforms);
    console.log('📅 Schedule Time:', scheduleTime);
    
    if (!text || !scheduleTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text and scheduleTime are required' 
      });
    }
    
    // Check usage limits
    const usageCheck = await checkUsage(userId, 'posts');
    if (!usageCheck.allowed) {
      return res.status(402).json({
        success: false,
        error: usageCheck.message,
        limitReached: true,
        upgradePlan: usageCheck.upgradePlan
      });
    }
    
    // Get user's credentials from database
    const credentials = await getUserCredentialsForPosting(userId);
    
    // Check if video is being posted to unsupported platforms
    if (imageUrl && imageUrl.includes('/video/') && platforms.includes('linkedin')) {
      console.warn('⚠️  Videos not supported on LinkedIn, will skip LinkedIn');
      platforms = platforms.filter(p => p !== 'linkedin');
    }
    
    // Validate that user has connected the requested platforms
    const requestedPlatforms = Array.isArray(platforms) ? platforms : [platforms];
    for (const platform of requestedPlatforms) {
      if (platform === 'linkedin' && !credentials.linkedin.accessToken) {
        return res.status(400).json({
          success: false,
          error: 'LinkedIn account not connected. Please connect your LinkedIn account first.'
        });
      }
      if (platform === 'twitter' && !credentials.twitter.accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Twitter account not connected. Please connect your Twitter account first.'
        });
      }
    }
    
    const queueItem = schedulePost(
      text, 
      imageUrl || null,
      platforms || ['linkedin'],
      scheduleTime, 
      credentials
    );
    
    // Increment usage count
    await incrementUsage(userId, 'posts');
    
    res.json({ 
      success: true, 
      message: 'Post scheduled successfully!',
      post: {
        id: queueItem.id,
        scheduleTime: queueItem.scheduleTime
      }
    });
  } catch (error) {
    console.error('❌ Error in /api/post/schedule:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/post/bulk
 * Schedule multiple posts at once (supports different accounts per post) (protected)
 */
app.post('/api/post/bulk', verifyAuth, (req, res) => {
  try {
    const { posts } = req.body;
    
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ 
        success: false, 
        error: 'posts array is required' 
      });
    }
    
    const scheduled = [];
    
    posts.forEach(post => {
      if (post.text && post.scheduleTime) {
        // Each post can have its own accountId (defaults to 1)
        const accountId = post.accountId || 1;
        const credentials = getAllCredentials(accountId);
        
        const queueItem = schedulePost(
          post.text,
          post.imageUrl || null,
          post.platforms || ['linkedin'],
          post.scheduleTime,
          credentials
        );
        scheduled.push(queueItem.id);
      }
    });
    
    res.json({ 
      success: true, 
      message: `Scheduled ${scheduled.length} posts!`,
      scheduledIds: scheduled
    });
  } catch (error) {
    console.error('Error in /api/post/bulk:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/post/bulk-csv
 * Upload CSV and schedule multiple posts at once (protected)
 */
app.post('/api/post/bulk-csv', verifyAuth, async (req, res) => {
  try {
    const { posts } = req.body;
    
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ 
        success: false, 
        error: 'posts array is required' 
      });
    }
    
    console.log(`\n📂 Processing bulk CSV upload: ${posts.length} posts`);
    
    const scheduled = [];
    const failed = [];
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const rowNum = i + 1;
      
      try {
        // Validate required fields
        if (!post.account_id || !post.text || !post.platforms || !post.schedule_time) {
          failed.push({ 
            row: rowNum, 
            error: 'Missing required fields (account_id, text, platforms, or schedule_time)' 
          });
          continue;
        }
        
        // Parse and validate account ID
        const accountId = parseInt(post.account_id);
        if (isNaN(accountId) || accountId < 1 || accountId > 5) {
          failed.push({ 
            row: rowNum, 
            error: 'Invalid account_id (must be 1-5)' 
          });
          continue;
        }
        
        // Get credentials for the account
        const credentials = getAllCredentials(accountId);
        
        // Parse platforms (comma-separated string to array)
        const platformsRaw = post.platforms.toString().split(',').map(p => p.trim());
        const validPlatforms = ['linkedin', 'twitter', 'instagram'];
        const platforms = platformsRaw.filter(p => validPlatforms.includes(p));
        
        if (platforms.length === 0) {
          failed.push({ 
            row: rowNum, 
            error: 'No valid platforms specified (must be linkedin, twitter, or instagram)' 
          });
          continue;
        }
        
        // Parse schedule time
        const scheduleTime = new Date(post.schedule_time);
        if (isNaN(scheduleTime.getTime())) {
          failed.push({ 
            row: rowNum, 
            error: 'Invalid schedule_time format (use YYYY-MM-DD HH:MM)' 
          });
          continue;
        }
        
        // Schedule the post
        const queueItem = schedulePost(
          post.text.toString(),
          post.image_url || null,
          platforms,
          scheduleTime,
          credentials
        );
        
        scheduled.push(queueItem.id);
        console.log(`   ✅ Row ${rowNum}: Scheduled post ID ${queueItem.id}`);
        
      } catch (error) {
        console.error(`   ❌ Row ${rowNum}: ${error.message}`);
        failed.push({ 
          row: rowNum, 
          error: error.message 
        });
      }
    }
    
    console.log(`\n📊 CSV Upload Complete:`);
    console.log(`   ✅ Scheduled: ${scheduled.length}`);
    console.log(`   ❌ Failed: ${failed.length}\n`);
    
    res.json({ 
      success: true, 
      scheduled: scheduled.length,
      failed: failed.length,
      scheduledIds: scheduled,
      errors: failed.length > 0 ? failed : undefined
    });
    
  } catch (error) {
    console.error('❌ Error in /api/post/bulk-csv:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /template.csv
 * Download CSV template for bulk upload
 */
app.get('/template.csv', (req, res) => {
  res.sendFile(path.join(__dirname, 'template.csv'));
});

/**
 * GET /api/queue
 * Get all queued posts (protected)
 */
app.get('/api/queue', verifyAuth, async (req, res) => {
  try {
    const queue = await getQueue();
    res.json({ queue });
  } catch (error) {
    console.error('Error in /api/queue:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/queue/:id
 * Delete a post from queue (protected)
 */
app.delete('/api/queue/:id', verifyAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const deleted = await deleteFromQueue(postId);
    
    if (deleted) {
      res.json({ 
        success: true, 
        message: 'Post removed from queue' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
  } catch (error) {
    console.error('Error in /api/queue/:id:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/history
 * Get post history (protected)
 */
app.get('/api/history', verifyAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await getPostHistory(limit);
    
    res.json({ 
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Error in /api/history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/analytics/platforms
 * Get platform statistics (protected)
 */
app.get('/api/analytics/platforms', verifyAuth, async (req, res) => {
  try {
    const stats = await getPlatformStats();
    
    res.json({ 
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in /api/analytics/platforms:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/upload/image
 * Upload image file to Cloudinary (protected)
 */
app.post('/api/upload/image', verifyAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const userId = req.user.id;
    console.log(`📤 Uploading image for user ${userId}...`);

    // Upload to Cloudinary
    const result = await uploadImage(req.file.path, userId);

    // Delete temporary file
    await fs.unlink(req.file.path).catch(err => {
      console.error('Error deleting temp file:', err);
    });

    if (result.success) {
      console.log('✅ Image uploaded:', result.url);
      
      // Track usage (for billing limits later)
      await incrementUsage(userId, 'image_upload');
      
      return res.json({
        success: true,
        imageUrl: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        source: 'upload'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to upload image'
      });
    }
  } catch (error) {
    console.error('❌ Image upload error:', error);
    
    // Clean up temp file on error
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(err => {
        console.error('Error deleting temp file:', err);
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

/**
 * POST /api/upload/video
 * Upload video file to Cloudinary (protected)
 */
app.post('/api/upload/video', verifyAuth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided'
      });
    }

    const userId = req.user.id;
    console.log(`📹 Uploading video for user ${userId}...`);

    // Upload to Cloudinary as video
    const result = await uploadVideo(req.file.path, userId);

    // Delete temporary file
    await fs.unlink(req.file.path).catch(err => {
      console.error('Error deleting temp file:', err);
    });

    if (result.success) {
      console.log('✅ Video uploaded:', result.url);
      
      await incrementUsage(userId, 'video_upload');
      
      return res.json({
        success: true,
        videoUrl: result.url,
        publicId: result.publicId,
        duration: result.duration,
        format: result.format,
        source: 'upload'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to upload video'
      });
    }
  } catch (error) {
    console.error('❌ Video upload error:', error);
    
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(err => {
        console.error('Error deleting temp file:', err);
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload video'
    });
  }
});

/**
 * POST /api/ai/generate
 * Generate AI captions using Claude (protected)
 */
app.post('/api/ai/generate', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, niche, platform } = req.body;
    
    // Validate inputs
    if (!topic || topic.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Topic is required' 
      });
    }
    
    // Check AI usage limits
    const usageCheck = await checkUsage(userId, 'ai');
    if (!usageCheck.allowed) {
      return res.status(402).json({
        success: false,
        error: usageCheck.message,
        limitReached: true,
        upgradePlan: usageCheck.upgradePlan
      });
    }
    
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured. Please add ANTHROPIC_API_KEY to your environment variables.'
      });
    }
    
    console.log(`🤖 AI caption request: topic="${topic}", niche="${niche}", platform="${platform}"`);
    
    // Generate captions
    const variations = await generateCaption(
      topic,
      niche || 'General',
      platform || 'linkedin'
    );
    
    // Increment AI usage count
    await incrementUsage(userId, 'ai');
    
    res.json({ 
      success: true,
      variations,
      count: variations.length
    });
    
  } catch (error) {
    console.error('Error in /api/ai/generate:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate captions'
    });
  }
});

// ============================================
// AI IMAGE GENERATION ENDPOINTS
// ============================================

// GET available AI image styles
app.get('/api/ai/image/styles', (req, res) => {
  try {
    res.json({
      success: true,
      styles: aiImageService.getAvailableStyles()
    });
  } catch (error) {
    console.error('Error getting styles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load styles'
    });
  }
});

// GET platform options
app.get('/api/ai/image/platforms', (req, res) => {
  try {
    res.json({
      success: true,
      platforms: aiImageService.getPlatformOptions()
    });
  } catch (error) {
    console.error('Error getting platforms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load platforms'
    });
  }
});

// GET example prompts
app.get('/api/ai/image/examples', (req, res) => {
  try {
    res.json({
      success: true,
      examples: aiImageService.getExamplePrompts()
    });
  } catch (error) {
    console.error('Error getting examples:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load examples'
    });
  }
});

// POST generate AI image
app.post('/api/ai/image/generate', verifyAuth, async (req, res) => {
  try {
    const { prompt, style, platform } = req.body;
    const userId = req.user.id;

    // Validate prompt
    if (!prompt || prompt.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a detailed image description (minimum 3 characters)'
      });
    }

    if (prompt.trim().length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Prompt too long (maximum 500 characters)'
      });
    }

    console.log(`🎨 AI Image request from user ${userId}: "${prompt}"`);

    // Generate image
    const result = await aiImageService.generateImage(
      prompt.trim(),
      style || 'photographic',
      platform || 'universal',
      userId
    );

    if (result.success) {
      console.log(`✅ AI Image generated successfully for user ${userId}`);

      res.json({
        success: true,
        imageUrl: result.imageUrl,
        platform: result.platform,
        style: result.style,
        dimensions: result.dimensions,
        originalPrompt: result.originalPrompt
      });
    } else {
      console.error(`❌ AI Image generation failed for user ${userId}:`, result.error);
      
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ AI Image endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Image generation failed. Please try again.'
    });
  }
});

// ============================================

/**
 * POST /api/auth/linkedin/url
 * Generate LinkedIn OAuth URL (authenticated endpoint)
 */
app.post('/api/auth/linkedin/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: 'LinkedIn OAuth not configured'
      });
    }
    
    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/linkedin/callback`;
    const state = encryptState(userId);
    const scope = 'openid profile email w_member_social';
    
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);
    
    res.json({
      success: true,
      oauthUrl: authUrl.toString()
    });
  } catch (error) {
    console.error('Error generating LinkedIn OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OAuth URL'
    });
  }
});

/**
 * GET /auth/linkedin/callback
 * Handle LinkedIn OAuth callback
 */
app.get('/auth/linkedin/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('LinkedIn OAuth error:', error);
      return res.redirect('/dashboard?error=linkedin_denied');
    }
    
    if (!code || !state) {
      return res.redirect('/dashboard?error=linkedin_missing_params');
    }
    
    // Decrypt state to get userId
    const userId = decryptState(state);
    
    // Exchange code for access token
    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/linkedin/callback`;
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: redirectUri
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, expires_in } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const profile = profileResponse.data;
    const expiresAt = new Date(Date.now() + (expires_in * 1000));
    
    // Store in database using supabaseAdmin (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'linkedin',
        platform_name: 'LinkedIn',
        oauth_provider: 'linkedin',
        access_token: access_token,
        token_expires_at: expiresAt.toISOString(),
        platform_user_id: profile.sub,
        platform_username: profile.name || profile.email,
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      });
    
    console.log(`✅ LinkedIn account connected for user ${userId}`);
    res.redirect('/dashboard?connected=linkedin&success=true');
  } catch (error) {
    console.error('Error in LinkedIn callback:', error.message);
    res.redirect('/dashboard?error=linkedin_failed');
  }
});

/**
 * POST /api/auth/twitter/url
 * Generate Twitter OAuth URL with PKCE (authenticated endpoint)
 */
app.post('/api/auth/twitter/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = process.env.TWITTER_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: 'Twitter OAuth not configured'
      });
    }
    
    // Generate PKCE code_verifier and code_challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    const state = encryptState(userId);
    
    // Store code_verifier temporarily (expires in 10 minutes)
    pkceStore.set(state, { codeVerifier, userId, timestamp: Date.now() });
    setTimeout(() => pkceStore.delete(state), 10 * 60 * 1000);
    
    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/twitter/callback`;
    const scope = 'tweet.read tweet.write users.read offline.access';
    
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    res.json({
      success: true,
      oauthUrl: authUrl.toString()
    });
  } catch (error) {
    console.error('Error generating Twitter OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OAuth URL'
    });
  }
});

/**
 * GET /auth/twitter/callback
 * Handle Twitter OAuth callback
 */
app.get('/auth/twitter/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('Twitter OAuth error:', error);
      return res.redirect('/dashboard?error=twitter_denied');
    }
    
    if (!code || !state) {
      return res.redirect('/dashboard?error=twitter_missing_params');
    }
    
    // Get stored code_verifier
    const pkceData = pkceStore.get(state);
    if (!pkceData) {
      return res.redirect('/dashboard?error=twitter_expired');
    }
    
    const { codeVerifier, userId } = pkceData;
    pkceStore.delete(state); // Clean up
    
    // Exchange code for access token
    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/twitter/callback`;
    const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.TWITTER_CLIENT_ID,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
      }
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const profile = profileResponse.data.data;
    const expiresAt = expires_in ? new Date(Date.now() + (expires_in * 1000)) : null;
    
    // Store in database using supabaseAdmin
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'twitter',
        platform_name: 'Twitter/X',
        oauth_provider: 'twitter',
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: expiresAt?.toISOString(),
        platform_user_id: profile.id,
        platform_username: profile.username,
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      });
    
    console.log(`✅ Twitter account connected for user ${userId}`);
    res.redirect('/dashboard?connected=twitter&success=true');
  } catch (error) {
    console.error('Error in Twitter callback:', error.message);
    res.redirect('/dashboard?error=twitter_failed');
  }
});

/**
 * GET /api/user/accounts
 * Get user's connected social media accounts
 */
app.get('/api/user/accounts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const accounts = await getUserConnectedAccounts(userId);
    
    res.json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('Error getting user accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/user/accounts/:platform
 * Disconnect a social media account
 */
app.delete('/api/user/accounts/:platform', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const platform = req.params.platform;
    
    const result = await disconnectAccount(userId, platform);
    
    res.json(result);
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// BILLING ENDPOINTS (Protected)
// ============================================

/**
 * GET /api/billing/plans
 * Get all available plans
 */
app.get('/api/billing/plans', (req, res) => {
  try {
    const plans = getAllPlans();
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/billing/checkout
 * Create Stripe checkout session
 */
app.post('/api/billing/checkout', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { priceId, plan } = req.body;
    
    const successUrl = `${req.protocol}://${req.get('host')}/dashboard?checkout=success`;
    const cancelUrl = `${req.protocol}://${req.get('host')}/dashboard?checkout=cancelled`;
    
    const session = await createCheckoutSession(userId, priceId, plan, successUrl, cancelUrl);
    
    res.json(session);
  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/billing/portal
 * Create Stripe customer portal session
 */
app.post('/api/billing/portal', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const returnUrl = `${req.protocol}://${req.get('host')}/dashboard`;
    
    const session = await createPortalSession(userId, returnUrl);
    
    res.json(session);
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/billing/webhook
 * Handle Stripe webhook events (unprotected)
 */
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    // Handle the event
    await handleWebhook(event);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * GET /api/billing/usage
 * Get current user usage and limits
 */
app.get('/api/billing/usage', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const billingInfo = await getUserBillingInfo(userId);
    
    res.json({
      success: true,
      ...billingInfo
    });
  } catch (error) {
    console.error('Error getting billing info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 SOCIAL MEDIA AUTOMATOR');
  console.log('='.repeat(50));
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Queue processor active`);
  
  // Check database connection
  const dbHealthy = await healthCheck();
  console.log(`${dbHealthy ? '✅' : '❌'} Database: ${dbHealthy ? 'Connected to Supabase' : 'Disconnected'}`);
  
  console.log(`\n📋 API Endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/accounts - List all accounts`);
  console.log(`   POST /api/post/now - Post immediately`);
  console.log(`   POST /api/post/schedule - Schedule a post`);
  console.log(`   POST /api/post/bulk - Schedule multiple posts`);
  console.log(`   POST /api/post/bulk-csv - Bulk CSV upload`);
  console.log(`   GET  /template.csv - Download CSV template`);
  console.log(`   GET  /api/queue - View queue`);
  console.log(`   DELETE /api/queue/:id - Remove from queue`);
  console.log(`   GET  /api/history - View post history`);
  console.log(`   GET  /api/analytics/platforms - Platform statistics`);
  console.log(`   POST /api/ai/generate - Generate AI captions`);
  console.log(`   GET  /api/ai/image/styles - Get AI image styles`);
  console.log(`   GET  /api/ai/image/platforms - Get platform options`);
  console.log(`   GET  /api/ai/image/examples - Get example prompts`);
  console.log(`   POST /api/ai/image/generate - Generate AI images`);
  console.log('\n' + '='.repeat(50) + '\n');
});
