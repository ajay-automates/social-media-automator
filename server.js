require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
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
const { 
  getAllAccountsWithStatus, 
  getAllCredentials 
} = require('./services/accounts');
const { 
  uploadImage 
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
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
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
// OAUTH ENDPOINTS (Protected)
// ============================================

/**
 * GET /auth/linkedin/connect
 * Initiate LinkedIn OAuth flow
 * Note: This is accessed via browser navigation, not AJAX, so no Bearer token
 */
app.get('/auth/linkedin/connect', async (req, res) => {
  try {
    // TODO: Get user ID from session/cookie instead of Bearer token
    // For now, show configuration message
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LinkedIn OAuth</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-8">
        <div class="max-w-2xl bg-gray-800 p-8 rounded-lg">
          <h1 class="text-3xl font-bold mb-4">🔗 LinkedIn OAuth Coming Soon!</h1>
          <p class="text-gray-300 mb-4">
            LinkedIn OAuth requires additional setup:
          </p>
          <ol class="list-decimal list-inside space-y-2 text-gray-300 mb-6">
            <li>Create LinkedIn OAuth app at <a href="https://www.linkedin.com/developers" class="text-blue-400 hover:underline" target="_blank">LinkedIn Developers</a></li>
            <li>Add Client ID and Secret to .env</li>
            <li>Configure redirect URL</li>
          </ol>
          <div class="bg-yellow-900 border border-yellow-600 p-4 rounded mb-6">
            <p class="text-yellow-200 font-bold mb-2">✅ For Testing:</p>
            <p class="text-yellow-100 text-sm">
              I'll add test LinkedIn/Twitter credentials to your account so you can test the posting UI.
              Run this SQL in Supabase:
            </p>
          </div>
          <pre class="bg-gray-900 p-4 rounded text-xs text-green-400 mb-6 overflow-x-auto">
INSERT INTO user_accounts (user_id, platform, platform_name, oauth_provider, access_token, refresh_token, platform_user_id, platform_username, status)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com'), 
   'linkedin', 'LinkedIn', 'manual', 'test_linkedin_token', NULL, 
   'ajay_linkedin', 'Ajay Kumar Reddy', 'active'),
  ((SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com'), 
   'twitter', 'Twitter/X', 'manual', 'test_twitter_token', 'test_twitter_secret', 
   'ajay_twitter', 'Ajay Kumar', 'active')
ON CONFLICT (user_id, platform, platform_user_id) DO NOTHING;
          </pre>
          <a href="/dashboard" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold inline-block">
            ← Back to Dashboard
          </a>
        </div>
      </body>
      </html>
    `);
    return;
    
    const userId = req.user.id;
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/linkedin/callback`;
    
    const authUrl = initiateLinkedInOAuth(userId, redirectUri);
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating LinkedIn OAuth:', error);
    res.status(500).send('Error connecting to LinkedIn');
  }
});

/**
 * GET /auth/linkedin/callback
 * Handle LinkedIn OAuth callback
 */
app.get('/auth/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/linkedin/callback`;
    
    const result = await handleLinkedInCallback(code, state, redirectUri);
    
    // Redirect to dashboard with success message
    res.redirect('/dashboard?linkedin=connected');
  } catch (error) {
    console.error('Error in LinkedIn callback:', error);
    res.redirect('/dashboard?error=linkedin_failed');
  }
});

/**
 * GET /auth/twitter/connect
 * Initiate Twitter OAuth flow
 * Note: This is accessed via browser navigation, not AJAX, so no Bearer token
 */
app.get('/auth/twitter/connect', async (req, res) => {
  try {
    // TODO: Get user ID from session/cookie instead of Bearer token
    // For now, show configuration message
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Twitter OAuth</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-8">
        <div class="max-w-2xl bg-gray-800 p-8 rounded-lg">
          <h1 class="text-3xl font-bold mb-4">🐦 Twitter OAuth Coming Soon!</h1>
          <p class="text-gray-300 mb-4">
            Twitter OAuth requires additional setup:
          </p>
          <ol class="list-decimal list-inside space-y-2 text-gray-300 mb-6">
            <li>Create Twitter OAuth app at <a href="https://developer.twitter.com" class="text-blue-400 hover:underline" target="_blank">Twitter Developers</a></li>
            <li>Add API keys to .env</li>
            <li>Configure callback URL</li>
          </ol>
          <div class="bg-yellow-900 border border-yellow-600 p-4 rounded mb-6">
            <p class="text-yellow-200 font-bold mb-2">✅ For Testing:</p>
            <p class="text-yellow-100 text-sm">
              I'll add test credentials to your account. Run this SQL in Supabase:
            </p>
          </div>
          <pre class="bg-gray-900 p-4 rounded text-xs text-green-400 mb-6 overflow-x-auto">
INSERT INTO user_accounts (user_id, platform, platform_name, oauth_provider, access_token, refresh_token, platform_user_id, platform_username, status)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com'), 
   'linkedin', 'LinkedIn', 'manual', 'test_linkedin_token', NULL, 
   'ajay_linkedin', 'Ajay Kumar Reddy', 'active'),
  ((SELECT id FROM auth.users WHERE email = 'ajaykumarreddynelavetla@gmail.com'), 
   'twitter', 'Twitter/X', 'manual', 'test_twitter_token', 'test_twitter_secret', 
   'ajay_twitter', 'Ajay Kumar', 'active')
ON CONFLICT (user_id, platform, platform_user_id) DO NOTHING;
          </pre>
          <a href="/dashboard" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold inline-block">
            ← Back to Dashboard
          </a>
        </div>
      </body>
      </html>
    `);
    return;
    
    const userId = req.user.id;
    const callbackUrl = `${req.protocol}://${req.get('host')}/auth/twitter/callback`;
    
    const result = await initiateTwitterOAuth(userId, callbackUrl);
    
    // Store token secret in session (simplified for MVP)
    // In production, use Redis or encrypted session storage
    req.session = req.session || {};
    req.session.twitter_oauth_token_secret = result.oauthTokenSecret;
    req.session.twitter_user_id = userId;
    
    res.redirect(result.authUrl);
  } catch (error) {
    console.error('Error initiating Twitter OAuth:', error);
    res.status(500).send('Error connecting to Twitter');
  }
});

/**
 * GET /auth/twitter/callback
 * Handle Twitter OAuth callback
 */
app.get('/auth/twitter/callback', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    
    // Get stored token secret and user ID from session
    // This is simplified - in production use proper session management
    const tokenSecret = req.session?.twitter_oauth_token_secret;
    const userId = req.session?.twitter_user_id;
    
    if (!tokenSecret || !userId) {
      throw new Error('Session expired or invalid');
    }
    
    const result = await handleTwitterCallback(oauth_token, oauth_verifier, userId, tokenSecret);
    
    // Clear session data
    delete req.session.twitter_oauth_token_secret;
    delete req.session.twitter_user_id;
    
    res.redirect('/dashboard?twitter=connected');
  } catch (error) {
    console.error('Error in Twitter callback:', error);
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
  console.log('\n' + '='.repeat(50) + '\n');
});
