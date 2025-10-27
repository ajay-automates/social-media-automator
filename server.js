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
  getAnalyticsOverview,
  getTimelineData,
  healthCheck,
  addPost,
  updatePostStatus
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
  disconnectAccountById,
  getUserConnectedAccounts,
  getUserCredentialsForPosting
} = require('./services/oauth');
const { validateBotToken } = require('./services/telegram');
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
// NOTE: This is lost on server restart - using session storage as fallback
const pkceStore = new Map();
const sessionPkceStore = new Map(); // Temporary session store with timestamps

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
// Serve static files for landing page and auth ONLY
app.use(express.static(__dirname, {
  index: false // Don't serve index.html automatically
}));

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

// Serve React Dashboard static assets first (before catch-all)
try {
  const dashboardPath = path.join(__dirname, 'dashboard/dist');
  const fs = require('fs');
  
  if (fs.existsSync(dashboardPath)) {
    const indexHtmlPath = path.join(dashboardPath, 'index.html');
    
    if (fs.existsSync(indexHtmlPath)) {
      // Serve static assets for React dashboard at root level
      app.use('/assets', express.static(path.join(dashboardPath, 'assets')));
      app.use('/vite.svg', express.static(path.join(dashboardPath, 'vite.svg')));
      console.log('✅ React Dashboard static assets configured');
      console.log('📁 Dashboard path:', dashboardPath);
    } else {
      console.log('⚠️  Dashboard dist folder exists but index.html not found');
    }
  } else {
    console.log('⚠️  Dashboard dist folder not found at:', dashboardPath);
    console.log('📂 Current directory:', __dirname);
  }
} catch (err) {
  console.log('❌ Error loading dashboard:', err.message);
}

// Fallback to old dashboard for now
app.get('/dashboard/old', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Serve React Dashboard index.html for /dashboard routes
app.get('/dashboard/*', (req, res) => {
  const dashboardIndex = path.join(__dirname, 'dashboard/dist/index.html');
  const fs = require('fs');
  
  if (fs.existsSync(dashboardIndex)) {
    res.sendFile(dashboardIndex);
  } else {
    console.error('❌ Dashboard index.html not found at:', dashboardIndex);
    res.status(404).send('Dashboard not deployed. Please check deployment.');
  }
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
 * Get user's connected accounts (protected)
 */
app.get('/api/accounts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const accounts = await getUserConnectedAccounts(userId);
    res.json({ 
      success: true,
      accounts: accounts || [],
      count: accounts?.length || 0
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
      linkedin: credentials.linkedin.length,
      twitter: credentials.twitter.length,
      telegram: credentials.telegram.length
    });
    console.log('🔑 Full credentials:', JSON.stringify(credentials, null, 2));
    
    // Check if video is being posted to unsupported platforms
    if (imageUrl && imageUrl.includes('/video/') && platforms.includes('linkedin')) {
      console.warn('⚠️  Videos not supported on LinkedIn, will skip LinkedIn');
      platforms = platforms.filter(p => p !== 'linkedin');
    }
    
    // Validate that user has connected the requested platforms
    const requestedPlatforms = Array.isArray(platforms) ? platforms : [platforms];
    for (const platform of requestedPlatforms) {
      if (platform === 'linkedin' && credentials.linkedin.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'LinkedIn account not connected. Please connect your LinkedIn account first.'
        });
      }
      if (platform === 'twitter' && credentials.twitter.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Twitter account not connected. Please connect your Twitter account first.'
        });
      }
      if (platform === 'telegram') {
        console.log('🔍 Checking Telegram credentials for platform:', platform);
        console.log('  - credentials.telegram:', credentials.telegram);
        console.log('  - accounts count:', credentials.telegram.length);
        if (credentials.telegram.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Telegram bot not connected. Please connect your Telegram bot first.'
          });
        }
      }
    }
    
    const platformResults = await postNow(text, imageUrl || null, platforms, credentials);
    
    // Check if all platforms succeeded
    const allSuccess = Object.values(platformResults).every(r => r.success);
    const anySuccess = Object.values(platformResults).some(r => r.success);
    
    // Save the post to database
    if (anySuccess) {
      try {
        // Determine final status
        let status;
        if (allSuccess) {
          status = 'posted';
        } else if (anySuccess && !allSuccess) {
          status = 'partial';
        } else {
          status = 'failed';
        }
        
        // Save post to database
        const savedPost = await addPost({
          text,
          imageUrl: imageUrl || null,
          platforms,
          scheduleTime: new Date(), // For "post now", use current time
          credentials,
          userId
        });
        
        // Update post status with results
        if (savedPost && savedPost.id) {
          await updatePostStatus(savedPost.id, status, platformResults);
        }
        
        console.log(`✅ Post saved to database with status: ${status}`);
      } catch (dbError) {
        console.error('⚠️  Error saving post to database:', dbError);
        // Don't fail the request if DB save fails
      }
      
      // Increment usage count
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
      if (platform === 'linkedin' && credentials.linkedin.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'LinkedIn account not connected. Please connect your LinkedIn account first.'
        });
      }
      if (platform === 'twitter' && credentials.twitter.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Twitter account not connected. Please connect your Twitter account first.'
        });
      }
      if (platform === 'telegram') {
        console.log('🔍 Checking Telegram credentials for schedule:');
        console.log('  - credentials.telegram:', credentials.telegram);
        console.log('  - accounts count:', credentials.telegram.length);
        if (credentials.telegram.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Telegram bot not connected. Please connect your Telegram bot first.'
          });
        }
      }
    }
    
    const queueItem = await schedulePost(
      text, 
      imageUrl || null,
      platforms || ['linkedin'],
      scheduleTime, 
      credentials,
      userId // Pass userId for multi-tenant
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
app.post('/api/post/bulk', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { posts } = req.body;
    
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ 
        success: false, 
        error: 'posts array is required' 
      });
    }
    
    const scheduled = [];
    
    for (const post of posts) {
      if (post.text && post.scheduleTime) {
        // Each post can have its own accountId (defaults to 1)
        const accountId = post.accountId || 1;
        const credentials = getAllCredentials(accountId);
        
        const queueItem = await schedulePost(
          post.text,
          post.imageUrl || null,
          post.platforms || ['linkedin'],
          post.scheduleTime,
          credentials,
          userId // Pass userId
        );
        scheduled.push(queueItem.id);
      }
    }
    
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
    const userId = req.user.id;
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
        const queueItem = await schedulePost(
          post.text.toString(),
          post.image_url || null,
          platforms,
          scheduleTime,
          credentials,
          userId // Pass userId
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
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const history = await getPostHistory(limit, userId);
    
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
 * Get platform statistics (protected - multi-tenant)
 */
app.get('/api/analytics/platforms', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getPlatformStats(userId);
    
    // Format for frontend
    const platformsArray = Object.keys(stats).map(platform => ({
      platform,
      total: stats[platform].total,
      successful: stats[platform].successful,
      failed: stats[platform].failed,
      successRate: stats[platform].successRate
    }));
    
    res.json({ 
      success: true,
      platforms: platformsArray
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
 * GET /api/analytics/overview
 * Get analytics overview for current user (protected - multi-tenant)
 */
app.get('/api/analytics/overview', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const overview = await getAnalyticsOverview(userId);
    
    res.json({
      success: true,
      ...overview
    });
  } catch (error) {
    console.error('Error in /api/analytics/overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/timeline
 * Get timeline data for last 30 days (protected - multi-tenant)
 */
app.get('/api/analytics/timeline', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const timeline = await getTimelineData(userId, days);
    
    res.json({
      success: true,
      ...timeline
    });
  } catch (error) {
    console.error('Error in /api/analytics/timeline:', error);
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
    
    console.log('🔗 LinkedIn OAuth URL generation:');
    console.log('  - Client ID:', clientId ? 'exists' : 'missing');
    console.log('  - Redirect URI:', redirectUri);
    console.log('  - Scope:', scope);
    
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);
    
    console.log('  - Generated URL:', authUrl.toString());
    
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
    
    console.log('🔗 LinkedIn callback received:');
    console.log('  - Code:', code ? 'exists' : 'missing');
    console.log('  - State:', state ? 'exists' : 'missing');
    console.log('  - Error:', error || 'none');
    console.log('  - Query params:', JSON.stringify(req.query));
    console.log('  - Full URL:', req.url);
    
    if (error) {
      console.error('LinkedIn OAuth error:', error);
      return res.redirect('/dashboard?error=linkedin_denied');
    }
    
    if (!code || !state) {
      console.error('Missing code or state parameter');
      return res.redirect('/dashboard?error=linkedin_missing_params');
    }
    
    // Decrypt state to get userId
    let userId;
    try {
      userId = decryptState(state);
      console.log('  - Decrypted user ID:', userId);
    } catch (stateError) {
      console.error('State decryption error:', stateError.message);
      return res.redirect('/dashboard?error=linkedin_invalid_state');
    }
    
    // Exchange code for access token
    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/linkedin/callback`;
    console.log('  - Exchange token with redirect URI:', redirectUri);
    
    let tokenResponse;
    try {
      tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
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
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError.response?.data || tokenError.message);
      return res.redirect('/dashboard?error=linkedin_token_exchange_failed');
    }
    
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
    // Store in both in-memory and session stores for redundancy
    const pkceData = { codeVerifier, userId, timestamp: Date.now() };
    pkceStore.set(state, pkceData);
    sessionPkceStore.set(state, pkceData);
    setTimeout(() => {
      pkceStore.delete(state);
      sessionPkceStore.delete(state);
    }, 10 * 60 * 1000);
    
    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/twitter/callback`;
    const scope = 'tweet.read tweet.write users.read offline.access';
    
    console.log('🐦 Twitter OAuth URL generation:');
    console.log('  - Client ID:', clientId ? 'exists' : 'missing');
    console.log('  - Redirect URI:', redirectUri);
    console.log('  - State:', state.substring(0, 20) + '...');
    
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    console.log('  - Generated URL length:', authUrl.toString().length);
    
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
    
    console.log('🐦 Twitter callback received:');
    console.log('  - Code:', code ? 'exists' : 'missing');
    console.log('  - State:', state ? state.substring(0, 20) + '...' : 'missing');
    console.log('  - Error:', error || 'none');
    console.log('  - Query params:', JSON.stringify(req.query));
    console.log('  - Full URL:', req.url);
    
    if (error) {
      console.error('Twitter OAuth error:', error);
      return res.redirect('/dashboard?error=twitter_denied');
    }
    
    if (!code || !state) {
      console.error('Missing code or state parameter');
      return res.redirect('/dashboard?error=twitter_missing_params');
    }
    
    // Get stored code_verifier - check both stores
    let pkceData = pkceStore.get(state);
    if (!pkceData) {
      console.log('  - Not found in in-memory store, checking session store...');
      pkceData = sessionPkceStore.get(state);
      if (pkceData) {
        console.log('  - Found in session store! (server may have restarted)');
        // Restore to in-memory store
        pkceStore.set(state, pkceData);
      }
    }
    
    console.log('  - PKCE data:', pkceData ? 'found' : 'not found');
    console.log('  - PKCE store size:', pkceStore.size);
    console.log('  - Session store size:', sessionPkceStore.size);
    console.log('  - PKCE store entries:', Array.from(pkceStore.keys()).map(k => k.substring(0, 20) + '...'));
    
    if (!pkceData) {
      console.error('  - State expired or invalid');
      console.error('  - Looking for state:', state.substring(0, 20) + '...');
      console.error('  - Server may have restarted - PKCE state lost');
      console.error('  - Try connecting again within 10 minutes of deployment');
      return res.redirect('/dashboard?error=twitter_expired');
    }
    
    const { codeVerifier, userId } = pkceData;
    console.log('  - User ID from PKCE:', userId);
    pkceStore.delete(state); // Clean up
    
    // Exchange code for access token
    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/twitter/callback`;
    console.log('  - Token exchange starting with redirect URI:', redirectUri);
    
    let tokenResponse;
    try {
      tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', 
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
      console.log('  - Token exchange successful');
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError.response?.data || tokenError.message);
      return res.redirect('/dashboard?error=twitter_token_exchange_failed');
    }
    
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
    
    console.log('📋 User accounts requested for:', userId);
    console.log('📋 Accounts found:', accounts.length);
    accounts.forEach(acc => {
      console.log(`  - Platform: ${acc.platform}, Name: ${acc.platform_name}, Username: ${acc.platform_username}`);
    });
    
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
 * POST /api/auth/telegram/connect
 * Connect Telegram bot (user provides bot token)
 */
app.post('/api/auth/telegram/connect', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { botToken, chatId } = req.body;
    
    console.log('📱 Connecting Telegram bot for user:', userId);
    
    if (!botToken || !chatId) {
      return res.status(400).json({
        success: false,
        error: 'Bot token and chat ID are required'
      });
    }
    
    // Validate bot token
    const validation = await validateBotToken(botToken);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid bot token'
      });
    }
    
    // Store in database using supabaseAdmin
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    const insertData = {
      user_id: userId,
      platform: 'telegram',
      platform_name: validation.bot.username || 'Telegram Bot',
      oauth_provider: 'manual',
      access_token: botToken,
      platform_user_id: chatId,
      platform_username: validation.bot.username || 'bot',
      status: 'active',
      connected_at: new Date().toISOString()
    };
    
    console.log('📝 Inserting Telegram account:', JSON.stringify(insertData, null, 2));
    
    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('user_accounts')
      .upsert(insertData, {
        onConflict: 'user_id,platform,platform_user_id'
      });
    
    if (insertError) {
      console.error('❌ Database error:', insertError);
      return res.status(500).json({
        success: false,
        error: insertError.message
      });
    }
    
    console.log('✅ Telegram bot connected for user', userId);
    console.log('✅ Insert result:', insertResult);
    res.json({
      success: true,
      message: 'Telegram bot connected successfully',
      bot: validation.bot
    });
    
  } catch (error) {
    console.error('Error connecting Telegram bot:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/user/accounts/:platform
 * Disconnect a social media account (all accounts for the platform)
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

/**
 * DELETE /api/user/accounts/:platform/:accountId
 * Disconnect a specific account by ID
 */
app.delete('/api/user/accounts/:platform/:accountId', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = parseInt(req.params.accountId);
    
    const result = await disconnectAccountById(userId, accountId);
    
    res.json(result);
  } catch (error) {
    console.error('Error disconnecting account by ID:', error);
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
    
    const successUrl = `${req.protocol}://${req.get('host')}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${req.protocol}://${req.get('host')}/cancel`;
    
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
// CATCH-ALL ROUTE FOR REACT SPA (must be last)
// ============================================

// Serve React Dashboard for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth') || req.path.startsWith('/template.csv')) {
    return next();
  }
  
  const dashboardIndex = path.join(__dirname, 'dashboard/dist/index.html');
  const fs = require('fs');
  
  if (fs.existsSync(dashboardIndex)) {
    res.sendFile(dashboardIndex);
  } else {
    // Fallback to landing page
    res.sendFile(path.join(__dirname, 'index.html'));
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
